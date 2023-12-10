<template>
  <div style="width: 100%">
    <div v-if="$slots.headerTop" style="margin: 5px">
      <slot name="headerTop"></slot>
    </div>
    <div class="flex items-center">
      <slot v-if="$slots.tableTitle" name="tableTitle"></slot>
      <TableTitle
        v-if="!$slots.tableTitle && title"
        :helpMessage="titleHelpMessage"
        :title="title"
      />
      <div :class="$slots.tableTitle ? 'search-item' : ''">
        <!-- <SearchItem v-if="hasHistorySearch" v-bind="searchItemProps" /> -->
      </div>
      <div :class="`${prefixCls}__toolbar`">
        <slot name="toolbar"></slot>
        <!-- <Divider v-if="$slots.toolbar && showTableSetting" type="vertical" /> -->
        <TableSetting
          v-if="showTableSetting"
          :setting="tableSetting"
          @columns-change="handleColumnChange"
        />
      </div>
    </div>
    <div v-if="$slots.headerBottom">
      <slot name="headerBottom"></slot>
    </div>
  </div>
</template>
<script lang="ts">
  import type { TableSetting, ColumnChangeParam } from '../types/table';
  import type { PropType } from 'vue';
  import { defineComponent } from 'vue';
  // import { Divider } from 'ant-design-vue';
  import TableSettingComponent from './settings/index.vue';
  import TableTitle from './TableTitle.vue';
  import { useDesign } from '/@/hooks/web/useDesign';

  // import SearchItem from './SearchItem.vue';
  export default defineComponent({
    name: 'BasicTableHeader',
    components: {
      // Divider,
      TableTitle,
      TableSetting: TableSettingComponent,
      // SearchItem,
    },
    props: {
      hasHistorySearch: {
        type: Boolean,
        default: true,
      },
      searchItemProps: {
        type: Object,
      },
      title: {
        type: [Function, String] as PropType<string | ((data: Recordable) => string)>,
      },
      tableSetting: {
        type: Object as PropType<TableSetting>,
      },
      showTableSetting: {
        type: Boolean,
      },
      titleHelpMessage: {
        type: [String, Array] as PropType<string | string[]>,
        default: '',
      },
    },
    emits: ['columns-change'],
    setup(_, { emit }) {
      const { prefixCls } = useDesign('basic-table-header');
      function handleColumnChange(data: ColumnChangeParam[]) {
        emit('columns-change', data);
      }
      return { prefixCls, handleColumnChange };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'@{namespace}-basic-table-header';

  .@{prefix-cls} {
    &__toolbar {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;

      > * {
        margin-right: 10px;

        &:last-child {
          margin-right: 0;
        }
      }

      .table-settings {
        margin-right: 0;

        > .anticon:first-child {
          margin-left: 0;
        }
      }
    }
  }
</style>

<style lang="less" scoped>
  .search-item {
    margin-left: 6px;
  }
</style>
