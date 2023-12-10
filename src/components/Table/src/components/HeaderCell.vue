<template>
  <EditTableHeaderCell v-if="getIsEdit">
    {{ getTitle }}
  </EditTableHeaderCell>
  <span v-else>
    <span class="table-header-split"></span>
    {{ getTitle }}
  </span>
  <BasicHelp v-if="getHelpMessage" :text="getHelpMessage" :class="`${prefixCls}__help`" />
</template>
<script lang="ts">
  import type { PropType } from 'vue';
  import type { BasicColumn } from '../types/table';
  import { defineComponent, computed } from 'vue';
  import BasicHelp from '/@/components/Basic/src/BasicHelp.vue';
  import EditTableHeaderCell from './EditTableHeaderIcon.vue';
  import { useDesign } from '/@/hooks/web/useDesign';

  export default defineComponent({
    name: 'TableHeaderCell',
    components: {
      EditTableHeaderCell,
      BasicHelp,
    },
    props: {
      column: {
        type: Object as PropType<BasicColumn>,
        default: () => ({}),
      },
    },
    setup(props) {
      const { prefixCls } = useDesign('basic-table-header-cell');

      const getIsEdit = computed(() => !!props.column?.edit);
      const getTitle = computed(() => props.column?.customTitle || props.column?.title);
      const getHelpMessage = computed(() => props.column?.helpMessage);

      return { prefixCls, getIsEdit, getTitle, getHelpMessage };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'@{namespace}-basic-table-header-cell';

  .@{prefix-cls} {
    &__help {
      margin-left: 8px;
      color: rgb(0 0 0 / 65%) !important;
    }
  }
  .table-header-split {
    height: 1em;
    width: 0px;
    border-left: 1px solid #061023;
    display: inline-block;
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 4px;
    display: none;
  }
  .ant-table-thead {
    .ant-table-cell:first-child {
      &:not(.ant-table-selection-column) {
        padding-left: 18px;
      }
      .table-header-split {
        display: inline-block;
      }
    }
  }

  .ant-table.ant-table-bordered {
    // 表头竖线 (仅非实现边框时显示)
    .table-header-split {
      display: none !important;
    }
  }
</style>
