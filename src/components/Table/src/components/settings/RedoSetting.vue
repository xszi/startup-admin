<template>
  <Tooltip placement="top">
    <template #title>
      <span>{{ t('common.redo') }}</span>
    </template>
    <Icon
      icon="icon-biaoshuaxin"
      :size="21"
      class="basic-table-setting p-5.5px"
      iconfont
      @click="redo"
    />
  </Tooltip>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';
  import { Tooltip } from 'ant-design-vue';
  import Icon from '/@/components/Icon';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useTableContext } from '../../hooks/useTableContext';

  export default defineComponent({
    name: 'RedoSetting',
    components: {
      Icon,
      Tooltip,
    },
    setup() {
      const table = useTableContext();
      const { t } = useI18n();

      function redo() {
        table.reload();
      }

      return { redo, t };
    },
  });
</script>

<style lang="less" scoped>
  .basic-table-setting {
    background-color: #e6e6e6;
  }
</style>
