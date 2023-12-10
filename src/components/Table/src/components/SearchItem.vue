<template>
  <div class="history-search-item">
    <div class="label">检索项:</div>
    <div class="item-list">
      <template v-if="searchItems.length > 0">
        <Tag
          v-for="item in searchItems"
          :key="item.field"
          closable
          @close="handleTagClose(item.field)"
          >{{ item.label }}：{{ item.value }}</Tag
        >
        <a-button type="text" size="small" @click="handleSave">保存</a-button>
        <a-button type="text" size="small" @click="cleanSearch">清除</a-button>
      </template>
      <Tag v-else>无</Tag>
      <ApiSelect v-bind="selectProps" :value="selectHis" @change="handleChange">
        <template #option="{ label, id }">
          <div class="custom-select">
            <span class="select-label">{{ label }}</span>
            <CloseOutlined class="remove-icon" @click.stop="handleRemove(id)" />
          </div>
        </template>
      </ApiSelect>
    </div>
  </div>
  <SaveModal @register="registerModal" @success="handleSuccess" />
</template>
<script setup lang="ts">
  import { reactive, ref, watchEffect, unref, Ref } from 'vue';
  import { useModal } from '/@/components/Modal';
  import { ApiSelect } from '/@/components/Form';
  import { Tag } from 'ant-design-vue';
  import { CloseOutlined } from '@ant-design/icons-vue';
  import SaveModal from './search/SaveModal.vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { fetchSearchList, delSearch } from '/@/api/base';
  import type { FormSchema } from '/@/components/Table';
  import type { TableActionType } from '/@/components/Table';
  import type { FormActionType } from '/@/components/Form';
  interface CfgItem {
    label: string;
    field: string;
    value: any;
  }
  const props = defineProps({
    searchHistory: { type: Object, default: () => ({}) },
    searchFormConfig: { type: Array, default: () => [] },
    tableAction: {
      type: Object as PropType<TableActionType>,
    },
    formActions: {
      type: Object as PropType<FormActionType>,
    },
    tableKey: {
      type: [Number, String],
      default: '',
    },
  });

  const { createMessage } = useMessage();
  const [registerModal, { openModal }] = useModal();
  const searchItems: Ref<CfgItem[]> = ref([]);
  const selectHis = ref();
  const selectProps = reactive({
    allowClear: true,
    options: [],
    fieldNames: {
      label: 'label',
      value: 'id',
    },
    // size: 'small',
    placeholder: '常用搜索条件',
    immediate: true,
    params: {
      key: unref(props.tableKey),
      t: new Date().getTime(),
    },
    showSearch: true,
    filterOption: filterOption,
    api: fetchSearchList,
  });
  watchEffect(() => {
    const searchHistory = unref(props.searchHistory);
    const searchFormConfig = unref(props.searchFormConfig);
    const cgfList: CfgItem[] = [];
    Object.keys(searchHistory).forEach((item) => {
      const value = searchHistory[item];
      if (value && value !== false) {
        const cfgItem = searchFormConfig.find((i: FormSchema) => i.field === item) as CfgItem;
        cgfList.push({
          label: cfgItem.label,
          field: cfgItem.field,
          value,
        });
      }
    });
    searchItems.value = cgfList;
  });
  const reloadHisList = () => {
    selectProps.params.t = new Date().getTime();
  };
  const handleSave = () => {
    openModal(true, {
      key: unref(props.tableKey),
      config: JSON.stringify(unref(props.searchHistory)),
    });
  };
  function filterOption(value, options) {
    return options.label.includes(value);
  }
  const handleSuccess = () => {
    createMessage.success('保存成功');
    reloadHisList();
  };
  const resetSearch = async (config) => {
    await props.formActions?.setFieldsValue(config);
    props.tableAction?.setHisSearch(config);
    props.tableAction?.reload({ searchInfo: config, page: 1 });
  };
  const handleChange = async (val, option) => {
    selectHis.value = val;
    try {
      if (!option) {
        cleanSearch();
        return;
      }
      const config = JSON.parse(option.config);
      resetSearch(config);
    } catch (e) {
      console.log(e);
    }
  };
  const handleRemove = async (id) => {
    try {
      await delSearch({ id });
      createMessage.success('删除成功');
      reloadHisList();
    } catch (e) {
      console.log(e);
    }
  };
  const cleanSearch = () => {
    selectHis.value = null;
    props.formActions?.resetFields();
  };
  const handleTagClose = async (field) => {
    const { searchHistory } = props;
    const newParams = Object.assign(searchHistory, { [field]: null });
    resetSearch(newParams);
  };
</script>
<style lang="less" scoped>
  .history-search-item {
    background: #fff;
    margin-bottom: 8px;
    display: flex;
    // padding: 0 6px 0 0;

    .label {
      width: fit-content;
      flex: none;
      padding-right: 12px;
      padding-left: 4px;
      font-size: 12px;
      line-height: 22px;
      margin-top: 6px;
      color: rgba(0, 0, 0, 0.85);
    }

    :deep(.ant-select) {
      width: 150px;
    }

    .item-list {
      .ant-tag {
        margin-right: 6px;
        margin-top: 6px;
      }
    }
  }
</style>
