<template>
  <PageWrapper>
    <template #headerContent> <WorkbenchHeader /> </template>
    <BasicTable @register="registerTable" @form-reset="formReset" @row-click="rowClick">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd"> 新增 </a-button>
        <export-button
          v-auth="'informationExpress:push-record:btn:export'"
          :use-export="handleExport"
          :get-action="getForm"
          :get-columns="getColumns"
        />
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'operate'">
          <TableAction
            :actions="[
              {
                label: '关闭',
                ifShow: +record.status !== 3, // 2已确认 3已关闭
                auth: 'informationExpress:push-record:btn:confirmClose',
                onClick: handleClose.bind(null, record),
              },
              {
                label: '编辑',
                ifShow: +record.status !== 2 && +record.status !== 3,
                auth: 'informationExpress:push-record:btn:detail',
                onClick: handleEdit.bind(null, record),
              },
              {
                label: '详情',
                auth: 'informationExpress:push-record:btn:detail',
                onClick: handleViewDetail.bind(null, record),
              },
              {
                label: '删除',
                color: 'error',
                auth: 'informationExpress:push-record:btn:delete',
                popConfirm: {
                  title: '是否确认删除？',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </PageWrapper>
</template>
<script lang="ts" setup>
  import { ref } from 'vue'
  import { PageWrapper } from '/@/components/Page'
  import { columns } from './data'
  import { BasicTable, useTable } from '/@/components/Table'
  import { fetchRecordList } from '/@/api/dashboard/accounting'
  const [registerTable, { reload, getForm, getColumns, setTableData }] = useTable({
    showSearchHistory: true,
    rowKey: 'id',
    columns,
    canResize: true,
    loading: false,
    searchInline: false,
    formConfig: {
      labelWidth: 90,
      labelAlign: 'right',
      // schemas: searchFormSchema,
      autoSubmitOnEnter: true,
      fieldMapToTime: [
        ['createTimeRange', ['createStartTime', 'createEndTime'], void 0, false],
        ['stopTimeRange', ['stopStartTime', 'stopEndTime'], void 0, false],
      ],
    },
    actionColumn: {
      width: 175,
      title: '操作',
      dataIndex: 'operate',
      align: 'center',
    },
    // api: fetchRecordList,
    dataSource: [
      {
        time: '2023-12-10',
        type: 'food',
        number: '10',
        remark: 'hahah',
      },
    ],
    autoAppendComCol: false,
    immediate: true,
    showIndexColumn: false,
    useSearchForm: true,
    showTableSetting: true,
    clearSelectOnPageChange: true,
    bordered: false,
  })

  const loading = ref(true)

  setTimeout(() => {
    loading.value = false
  }, 1500)
</script>
