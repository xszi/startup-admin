<template>
  <div ref="wrapRef" :class="getWrapperClass">
    <BasicTitle v-show="getBindValues.headTitle" span full-w :space="0" class="head-title">
      {{ getBindValues.headTitle }}
      <template #extra>
        <slot name="extra"></slot>
      </template>
    </BasicTitle>
    <BasicForm
      v-if="getBindValues.useSearchForm"
      ref="formRef"
      submitOnReset
      class="basic-form"
      v-bind="getFormProps"
      :tableAction="tableAction"
      @register="registerForm"
      @submit="handleSearchInfoChange"
      @advanced-change="redoHeight"
      @field-value-change="handleFormChange"
    >
      <template v-for="item in getFormSlotKeys" #[replaceFormSlotKey(item)]="data">
        <slot :name="item" v-bind="data || {}"></slot>
      </template>
      <template #advanceAfter>
        <div v-if="getBindValues.searchInline" class="advanceAfterGroup">
          <slot name="toolbar"></slot>
          <TableSetting
            v-if="getBindValues.showTableSetting"
            v-bind="getBindValues.tableSettings"
            @columns-change="innerHandlers.onColumnsChange"
          />
        </div>
      </template>
    </BasicForm>
    <div ref="tableWrapperRef" class="table-wrapper">
      <Table
        v-show="getEmptyDataIsShowTable"
        ref="tableElRef"
        v-bind="getBindValues"
        :rowClassName="getRowClassName"
        @change="handleTableChange"
        @resize-column="handleResizeColumn"
      >
        <template v-for="item in Object.keys($slots)" #[item]="data" :key="item">
          <slot :name="item" v-bind="data || {}"></slot>
        </template>
        <template #headerCell="{ column }">
          <HeaderCell :column="column" />
        </template>
        <!-- 增加对antdv3.x兼容 -->
        <template #bodyCell="data">
          <slot name="bodyCell" v-bind="data || {}"></slot>
        </template>

        <template v-if="isShowFooterSlot" #footer>
          <div class="table-footer-slot">
            <template v-if="showSelectTotal">
              <div class="selectedCount"
                >共选择
                <span class="font-color_primary font-medium">{{
                  getRowSelectionRef?.selectedRowKeys?.length || 0
                }}</span>
                条</div
              >
            </template>
            <div class="footer-slot">
              <slot name="pagination-slot"></slot>
            </div>
            <div v-if="getPaginationInfo" class="flex">
              <span class="page-total_info"> 共 {{ tableDataTotal }} 条数据 </span>
              <Pagination
                v-model:current="current"
                v-model:pageSize="pageSize"
                :total="tableDataTotal"
                show-size-changer
                hideOnSinglePage
                show-quick-jumper
                v-bind="getPaginationInfo"
                size="small"
                @change="handlePaginationChange"
              />
            </div>
          </div>
        </template>
        <!--      <template #[`header-${column.dataIndex}`] v-for="(column, index) in columns" :key="index">-->
        <!--        <HeaderCell :column="column" />-->
        <!--      </template>-->
      </Table>
    </div>
  </div>
</template>
<script lang="ts">
  import type {
    BasicTableProps,
    TableActionType,
    SizeType,
    ColumnChangeParam,
    BasicColumn,
  } from './types/table';
  import TableSettingComponent from './components/settings/index.vue';
  import {
    defineComponent,
    ref,
    computed,
    unref,
    toRaw,
    inject,
    watchEffect,
    onUnmounted,
    watch,
    onDeactivated,
  } from 'vue';
  import { Table, Pagination } from 'ant-design-vue';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { BasicTitle } from '/@/components/Basic';
  import { PageWrapperFixedHeightKey } from '/@/components/Page';
  import HeaderCell from './components/HeaderCell.vue';
  // import TableSetting from './components/settings/index.vue';
  import { InnerHandlers } from './types/table';

  import { usePagination } from './hooks/usePagination';
  import { useColumns } from './hooks/useColumns';
  import { useDataSource } from './hooks/useDataSource';
  import { useLoading } from './hooks/useLoading';
  import { useRowSelection } from './hooks/useRowSelection';
  import { useTableScroll } from './hooks/useTableScroll';
  import { useTableScrollTo } from './hooks/useScrollTo';
  import { useCustomRow } from './hooks/useCustomRow';
  import { useTableStyle } from './hooks/useTableStyle';
  import { useTableHeader } from './hooks/useTableHeader';
  import { useTableExpand } from './hooks/useTableExpand';
  import { createTableContext } from './hooks/useTableContext';
  import { useTableFooter } from './hooks/useTableFooter';
  import { useTableForm } from './hooks/useTableForm';
  import { useDesign } from '/@/hooks/web/useDesign';

  import { createOrUpdateCol } from '/@/field/common';
  import { useTableStore } from '/@/store/modules/table';
  import { isBoolean, omit } from 'lodash-es';
  import { basicProps } from './props';
  import { isFunction } from '/@/utils/is';
  import { warn } from '/@/utils/log';
  import { onMountedOrActivated } from '/@/hooks/core/onMountedOrActivated';

  const getTableStore = () => {
    return useTableStore();
  };

  export default defineComponent({
    name: 'BasicTable',
    components: {
      Table,
      BasicTitle,
      BasicForm,
      HeaderCell,
      Pagination,
      TableSetting: TableSettingComponent,
    },
    props: basicProps,
    emits: [
      'fetch-success',
      'fetch-error',
      'selection-change',
      'register',
      'row-click',
      'row-dbClick',
      'row-contextmenu',
      'row-mouseenter',
      'row-mouseleave',
      'edit-end',
      'edit-cancel',
      'edit-row-end',
      'edit-change',
      'expanded-rows-change',
      'change',
      'columns-change',
      'data-source-change',
    ],
    setup(props, { attrs, emit, slots, expose }) {
      const tableElRef = ref(null);
      const tableData = ref<Recordable[]>([]);
      const wrapRef = ref(null);
      const formRef = ref(null);
      const innerPropsRef = ref<Partial<BasicTableProps>>();
      const searchHistory = ref({});
      const { prefixCls } = useDesign('basic-table');
      const [registerForm, formActions] = useForm();

      const getProps = computed(() => {
        const realProps = {
          ...props,
          ...unref(innerPropsRef),
          // clickToRowSelect: false,
        } as BasicTableProps;
        appendCommonColumns(realProps, realProps.columns);
        return realProps;
      });

      const isFixedHeightPage = inject(PageWrapperFixedHeightKey, false);

      function appendCommonColumns(propsRef: BasicTableProps, columns: BasicColumn[]) {
        if (!propsRef.showTableSetting || propsRef.autoAppendComCol === false) {
          return;
        }
        const commonKeys = createOrUpdateCol.map((item) => item.dataIndex);
        commonKeys.forEach((key, i) => {
          const index = columns.findIndex((col) => {
            return key === col.dataIndex;
          });
          if (index === -1) {
            columns.push({
              ...createOrUpdateCol[i],
            });
          } else {
            // Object.assign(columns[index], createOrUpdateCol[i]);
            columns[index].defaultHidden = createOrUpdateCol[i].defaultHidden;
          }
        });
      }

      watchEffect(() => {
        unref(isFixedHeightPage) &&
          props.canResize &&
          warn(
            "'canResize' of BasicTable may not work in PageWrapper with 'fixedHeight' (especially in hot updates)",
          );
      });
      const { getLoading, setLoading } = useLoading(getProps);
      const {
        getPaginationInfo,
        getPagination,
        setPagination,
        setShowPagination,
        getShowPagination,
      } = usePagination(getProps);

      const onShowSizeChange = (current: number, pageSize: number) => {
        console.log(current, pageSize);
      };
      const {
        getRowSelection,
        getRowSelectionRef,
        getSelectRows,
        clearSelectedRowKeys,
        getSelectRowKeys,
        deleteSelectRowByKey,
        setSelectedRowKeys,
      } = useRowSelection(getProps, tableData, emit);

      const {
        handleTableChange: onTableChange,
        getDataSourceRef,
        getDataSource,
        getRawDataSource,
        setTableData,
        updateTableDataRecord,
        deleteTableDataRecord,
        insertTableDataRecord,
        findTableDataRecord,
        fetch,
        getRowKey,
        reload,
        getAutoCreateKey,
        updateTableData,
        handlePageChange,
        getSortInfo,
      } = useDataSource(
        getProps,
        {
          tableData,
          getPaginationInfo,
          setLoading,
          setPagination,
          getFieldsValue: formActions.getFieldsValue,
          clearSelectedRowKeys,
          setHisSearch,
          searchHistory,
        },
        emit,
      );

      function handleTableChange(...args) {
        onTableChange.call(undefined, ...args);
        emit('change', ...args);
        // 解决通过useTable注册onChange时不起作用的问题
        const { onChange } = unref(getProps);
        onChange && isFunction(onChange) && onChange.call(undefined, ...args);
      }
      function handlePaginationChange(page, pageSize) {
        setPagination({ pageSize: pageSize, current: page });
        handlePageChange.call(undefined, page, pageSize);
      }
      function handleResizeColumn(w, col) {
        const columns = getColumns();
        const index = columns.findIndex((item) => item.dataIndex === col.dataIndex);
        if (index > -1) {
          columns[index].width = w;
          setColumns(columns);
        }
      }

      const {
        getViewColumns,
        getColumns,
        setCacheColumnsByField,
        setColumns,
        getColumnsRef,
        getCacheColumns,
      } = useColumns(getProps, getPaginationInfo);

      const isShowFooterSlot = computed(() => {
        if (!getBindValues.value.showFooter) {
          return false;
        }
        return showSelectTotal.value || !!getPaginationInfo.value || !!slots['pagination-slot'];
      });
      const { getScrollRef, redoHeight } = useTableScroll(
        getProps,
        tableElRef,
        getColumnsRef,
        getRowSelectionRef,
        getDataSourceRef,
        wrapRef,
        formRef,
        isShowFooterSlot,
      );

      const { scrollTo } = useTableScrollTo(tableElRef, getDataSourceRef);

      const { customRow } = useCustomRow(getProps, {
        setSelectedRowKeys,
        getSelectRowKeys,
        clearSelectedRowKeys,
        getAutoCreateKey,
        emit,
      });

      const { getRowClassName } = useTableStyle(getProps, prefixCls);

      const {
        getExpandOption,
        expandAll,
        expandRows,
        collapseAll,
        toggleExpandRow,
        expandRow,
        collapseRow,
      } = useTableExpand(getProps, tableData, emit);

      const handlers: InnerHandlers = {
        onColumnsChange: (data: ColumnChangeParam[]) => {
          emit('columns-change', data);
          // support useTable
          unref(getProps).onColumnsChange?.(data);
        },
      };

      const hasHistorySearch = computed(() => {
        const { showSearchHistory, tableKey } = unref(getProps);
        return showSearchHistory && !!tableKey;
      });
      const searchFormConfig = computed(() => {
        const { useSearchForm, formConfig } = unref(getProps);
        if (!useSearchForm) return [];
        return formConfig?.schemas;
      });
      const getSearchItemProps = computed(() => {
        return {
          searchHistory: unref(searchHistory),
          searchFormConfig: unref(searchFormConfig),
          tableAction,
          formActions,
          tableKey: unref(getProps).tableKey,
        };
      });
      const showSelectTotal = computed(() => {
        const values = unref(getBindValues);
        return values?.rowSelection?.type === 'checkbox';
      });

      const { getFooterProps } = useTableFooter(
        getProps,
        getScrollRef,
        tableElRef,
        getDataSourceRef,
      );

      const { getFormProps, replaceFormSlotKey, getFormSlotKeys, handleSearchInfoChange } =
        useTableForm(getProps, slots, fetch, getLoading, clearSelectedRowKeys);
      const getBindValues = computed(() => {
        const dataSource = unref(getDataSourceRef);
        let propsData: Recordable = {
          ...attrs,
          customRow,
          ...unref(getProps),
          ...unref(getHeaderProps),
          scroll: unref(getScrollRef),
          loading: unref(getLoading),
          tableLayout: 'fixed',
          rowSelection: unref(getRowSelectionRef),
          rowKey: unref(getRowKey),
          columns: toRaw(unref(getViewColumns)),
          pagination: toRaw(unref(getPaginationInfo)),
          dataSource,
          footer: unref(getFooterProps),
          ...unref(getExpandOption),
          pagination: false,
        };
        propsData = omit(propsData, ['class', 'onChange']);

        const { simpleSearch, formConfig } = propsData;

        if (simpleSearch && formConfig) {
          let { schemas = [] } = formConfig;
          if (!Array.isArray(schemas)) {
            return propsData;
          }
          propsData.showTableSetting = false;
          propsData.useSearchForm = false;
        }

        return propsData;
      });
      const pageSize = ref(0);
      const current = ref(0);
      const tableDataTotal = ref(0);

      watch(
        () => getPaginationInfo.value,
        (newVal) => {
          if (!isBoolean(newVal)) {
            pageSize.value = newVal.pageSize || 0;
            current.value = newVal.current || 0;
            tableDataTotal.value = newVal.total || 0;
          }
        },
        { deep: true },
      );

      const getWrapperClass = computed(() => {
        const values = unref(getBindValues);
        const formProps = unref(getFormProps);
        return [
          prefixCls,
          attrs.class,
          {
            [`${prefixCls}-form-container`]: values.useSearchForm,
            [`${prefixCls}--hide-form`]: !values.useSearchForm,
            [`${prefixCls}--inset`]: values.inset,
            [`${prefixCls}--has-title`]: !!values.headTitle,
            [`${prefixCls}--col-bootstrap`]: values.columns.length < 7,
            [`${prefixCls}--can-resize`]: values.canResize,
            [`${prefixCls}--search-inline`]: values.searchInline,
            [`${prefixCls}--simple-search`]: values.simpleSearch,
            [`${prefixCls}--show-advance`]: formProps.schemas && formProps.schemas.length > 3,
            [`${prefixCls}--show-footer`]: unref(isShowFooterSlot),
          },
        ];
      });

      const getEmptyDataIsShowTable = computed(() => {
        const { emptyDataIsShowTable, useSearchForm } = unref(getProps);
        if (emptyDataIsShowTable || !useSearchForm) {
          return true;
        }
        return !!unref(getDataSourceRef).length;
      });

      function setProps(props: Partial<BasicTableProps>) {
        innerPropsRef.value = { ...unref(innerPropsRef), ...props };
      }
      function setHisSearch(data: Recordable) {
        searchHistory.value = data;
      }
      const tableAction: TableActionType = {
        reload,
        getSelectRows,
        clearSelectedRowKeys,
        getSelectRowKeys,
        deleteSelectRowByKey,
        setPagination,
        setTableData,
        updateTableDataRecord,
        deleteTableDataRecord,
        insertTableDataRecord,
        findTableDataRecord,
        redoHeight,
        setSelectedRowKeys,
        setColumns,
        setLoading,
        getDataSource,
        getRawDataSource,
        setProps,
        getRowSelection,
        getPaginationRef: getPagination,
        getColumns,
        getCacheColumns,
        emit,
        updateTableData,
        setShowPagination,
        getShowPagination,
        setCacheColumnsByField,
        expandAll,
        expandRows,
        collapseAll,
        expandRow,
        collapseRow,
        toggleExpandRow,
        scrollTo,
        getSize: () => {
          return unref(getBindValues).size as SizeType;
        },
        setHisSearch,
        getSortInfo,
      };

      const { getHeaderProps } = useTableHeader(
        getProps,
        slots,
        handlers,
        getSearchItemProps,
        getFormProps,
        handleSearchInfoChange,
      );

      const handleResizeListener = () => {
        const { prefixCls } = useDesign('layout-content');
        const layout = document.querySelector(`.${prefixCls}.full`);
        if (layout) {
          const rect = layout.getBoundingClientRect();
          if (wrapRef.value) {
            (wrapRef.value as HTMLElement).style.height = rect.height + 'px';
          }
        }
      };

      onMountedOrActivated(() => {
        if (unref(getBindValues).fullPage) {
          handleResizeListener();
        }
      });
      onDeactivated(() => {
        clearTableStore();
      });
      onUnmounted(() => {
        clearTableStore();
        document.removeEventListener('resize', handleResizeListener);
      });
      const handleFormChange = () => {
        const { enterSearch } = unref(getProps);
        if (enterSearch === false) {
          return;
        }
        const tableStore = getTableStore();
        tableStore.setTableInstance({ ...tableAction, wrapRef, getBindValues });
      };

      const clearTableStore = () => {
        const tableStore = getTableStore();
        tableStore.clearTableInstance();
      };

      createTableContext({ ...tableAction, wrapRef, getBindValues });

      expose({ ...tableAction, getDataSourceRef });

      emit('register', tableAction, formActions);
      return {
        innerHandlers: handlers,
        current,
        handleFormChange,
        handleResizeColumn,
        getRowSelectionRef,
        tableDataTotal,
        onShowSizeChange,
        getPaginationInfo,
        pageSize,
        formRef,
        getSelectRowKeys,
        tableElRef,
        getBindValues,
        getLoading,
        registerForm,
        handleSearchInfoChange,
        getEmptyDataIsShowTable,
        handleTableChange,
        getRowClassName,
        wrapRef,
        tableAction,
        redoHeight,
        getFormProps: getFormProps as any,
        replaceFormSlotKey,
        getFormSlotKeys,
        getWrapperClass,
        columns: getViewColumns,
        hasHistorySearch,
        getSearchItemProps,
        handlePaginationChange,
        showSelectTotal,
        isShowFooterSlot,
      };
    },
  });
</script>
<style lang="less">
  @border-color: #cecece4d;
  @table-wrapper-gap: 10px;
  @table-selected_striped: #fbfbfe;
  @prefix-cls: ~'@{namespace}-basic-table';

  [data-theme='dark'] {
    .ant-table-tbody > tr:hover.ant-table-row-selected > td,
    .ant-table-tbody > tr.ant-table-row-selected td {
      background-color: #262626;
    }
  }

  // 设置表头和行的最小高度，tr直接设置33px，内容超出高度会自动撑开
  .ant-table-thead,
  .ant-table-tbody > tr {
    height: 33px;
  }

  .ant-table:not(.ant-table-bordered) {
    // 表头竖线 (仅非实现边框时显示)
    .ant-table-thead {
      > tr {
        > th:not(:last-child):not(.ant-table-selection-column):not(
            .ant-table-row-expand-icon-cell
          ):not([colspan])::before {
          // height: 100%;
          height: 1em;
          right: 1px;
          border-left: 1px solid @text-color;
          background-color: transparent;
        }
      }
    }
  }

  .@{prefix-cls} {
    max-width: 100%;
    height: 100%;
    background-color: @white;

    .ant-table-tbody {
      > tr {
        &.ant-table-row-selected {
          &.@{prefix-cls}-row__striped {
            td {
              background-color: @table-selected_striped;
            }
          }

          td {
            background-color: #fff;
            border-bottom: 1px solid #e2e2e2;
          }
        }
      }

      .ant-table-cell:not(.ant-table-selection-column) {
        &:first-child {
          padding-left: 16px;

          .ant-btn {
            padding-left: 0;
          }
        }
      }

      .ant-table-placeholder {
        .ant-table-cell {
          &:first-child {
            padding-left: 0;
          }
        }
      }
    }

    &--hide-form {
      .table-wrapper {
        padding-top: 8px;

        .ant-table {
          .ant-table-title {
            // min-height: 35px;
            padding-bottom: 0px;
            padding-top: 0px;
          }
        }
      }
    }

    &-title {
      padding-left: 0 !important;
      font-size: 16px !important;
      margin-bottom: 0 !important;
      font-weight: bold;
    }

    .custom-row_highlight {
      > td {
        background: #e3f4fc !important;
      }
    }

    &-row__striped {
      td {
        background-color: @table-selected_striped;
      }
    }

    .basic-form {
      .split-line {
        display: block;
      }
    }

    &--simple-search,
    &--search-inline {
      .basic-form {
        .split-line {
          display: none;
        }
      }

      .table-wrapper {
        .split-line {
          display: none;
        }
      }
    }

    &--show-advance {
      .table-wrapper {
        .ant-table {
          .ant-table-title {
            padding-top: 0;
          }
        }
      }
    }

    &--simple-search {
      .table-wrapper {
        padding-top: 10px;

        .ant-table-container {
          margin-top: 2px;
        }
      }
    }

    &--search-inline {
      .table-search-action {
        &.normal-search-action {
          .ant-form-item-control-input-content {
            justify-content: flex-end;
          }
        }

        .ant-form-item-control-input-content {
          display: flex;
          flex-direction: row;
          justify-content: space-between;

          .advanceAfterGroup {
            display: inline-block;

            .table-settings {
              display: inline-block;
            }

            > * {
              margin-left: 10px;

              &.table-settings {
                margin-left: 0;
              }
            }
          }
        }
      }

      .table-wrapper {
        .ant-table-container {
          margin-top: 2px;
        }
      }
    }

    &-form-container {
      .basic-form {
        padding: 12px 10px 0px 10px;
        margin-bottom: 0;
        background: #ffffff;

        > .ant-form {
          padding: 0;
        }
      }

      .ant-form {
        // padding: 0px 10px 0 10px;
        border-radius: 0;
      }
    }

    .ant-tag {
      margin-right: 0;
    }

    .ant-table-wrapper {
      // padding: 0 6px 6px 6px;
      background-color: @component-background;
      border-radius: 2px;

      .ant-table-title {
        min-height: 33px;
      }

      .ant-table.ant-table-bordered .ant-table-title {
        border: none !important;
      }
    }

    .ant-table {
      width: 100%;
      overflow-x: hidden;

      &-title {
        display: flex;
        border-bottom: none;
        justify-content: space-between;
        align-items: center;
      }

      &-row-expand-icon {
        margin-top: 3.5px;
      }

      .ant-table-title {
        padding-left: 10px;
        padding-right: 10px;
        padding-bottom: 0;
        padding-top: 4px;
      }

      &-container {
        margin: 8px 10px;
        border: 1px solid #e2e2e2;

        .ant-btn {
          user-select: text;
        }
      }

      &-tbody {
        > tr {
          &:last-child {
            > td {
              border-bottom-width: 0;
            }
          }
        }
      }

      & > .ant-table-footer {
        box-shadow: none;
        padding: 0 10px 8px 10px;
      }

      td,
      th {
        border-bottom: 1px solid #e2e2e2;
        line-height: 24px;
      }
    }

    .ant-table-footer {
      padding: 0;

      .ant-table-wrapper {
        padding: 0;
      }

      table {
        border: none !important;
      }

      .ant-table-body {
        overflow-x: hidden !important;
        //  overflow-y: scroll !important;
      }

      td {
        padding: 12px 8px;
      }
    }

    &--inset {
      .ant-table-wrapper {
        padding: 0;
      }
    }

    // 列不可拖拽下的样式
    &--col-bootstrap {
      .ant-table-thead {
        // 表头竖线
        > tr {
          > th:not(:last-child):not(.ant-table-selection-column):not(
              .ant-table-row-expand-icon-cell
            ):not([colspan])::before {
            // height: 100%;
            height: 1em;
            right: 1px;
            border-left: 1px solid @text-color;
            background-color: transparent;
          }
        }
      }
    }
  }

  .table-footer-slot {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    .footer-slot {
      flex: 1;
      padding-left: 10px;
    }
  }

  .basic-form {
    overflow: hidden;
  }

  .hide-scrollbar-y {
    .ant-table {
      &-tbody {
        > tr {
          &:last-child {
            > td {
              border-bottom-width: 1px;
            }
          }
        }
      }
    }
  }
</style>
<style lang="less" scoped>
  .head-title {
    margin-bottom: 4px;
    padding-left: 26px;
    padding-right: 10px;

    &::before {
      left: 12px;
    }
  }

  .page-total_info {
    font-size: 13px;
    height: 24px;
    line-height: 24px;
    margin-right: 4px;
    color: @text-color;
  }

  .table-wrapper {
    flex: 1;
    position: relative;
    // 操作列左右12px
    :deep(.ant-table-cell-fix-right-first) {
      padding: 4px 12px !important;
    }

    :deep(.ant-table-body) {
      .ant-table-cell-fix-right-first {
        padding: 4px 8px 4px 8px !important;
      }
    }
  }
</style>
