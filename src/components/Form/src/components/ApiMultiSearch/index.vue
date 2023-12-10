<template>
  <div class="api-multi__search">
    <div class="flex">
      <Select
        v-if="isSelect"
        ref="select"
        v-model:value="selectValue"
        mode="multiple"
        style="width: 100%"
        placeholder="请输入物料编码或名称"
        allowClear
        :options="getOptions"
        @search="onSearch"
        @dropdown-visible-change="handleFetch"
      />
      <Input v-else v-model:value="inputValue" allowClear @focus="handleInputFocus" />
      <Tooltip title="切换输入模式">
        <Button @click="handleChangeModel">
          <template #icon><EllipsisOutlined /></template>
        </Button>
      </Tooltip>
    </div>
    <FormItemRest>
      <PopTextArea
        v-show="!isSelect && showArea"
        @change="handleTextareaValueChange"
        @change-visible="changeTextareaVisible"
      />
    </FormItemRest>
  </div>
</template>
<script lang="ts">
  import { defineComponent, computed, watch, toRaw } from 'vue';
  import { EllipsisOutlined } from '@ant-design/icons-vue';
  import PopTextArea from './PopTextArea.vue';
  import { ref, unref } from 'vue';
  import { get, omit } from 'lodash-es';
  import { propTypes } from '/@/utils/propTypes';
  import { Button, Input, Select, Tooltip } from 'ant-design-vue';
  import { FormItemRest } from 'ant-design-vue/es/form';
  import { isEmpty, isFunction } from '/@/utils/is';
  import { useDebounceFn } from '@vueuse/core';
  type OptionsItem = { label: string; value: string | number | boolean; disabled?: boolean };

  export default defineComponent({
    name: 'ApiMultiSearch',
    components: { EllipsisOutlined, Input, Button, Select, PopTextArea, Tooltip, FormItemRest },
    props: {
      api: {
        type: Function as PropType<(arg?: Recordable) => Promise<OptionsItem[]>>,
        default: null,
      },
      // api params
      params: {
        type: Object as PropType<Recordable>,
        default: () => ({}),
      },
      labelField: propTypes.string.def('label'),
      valueField: propTypes.string.def('value'),
      resultField: propTypes.string.def(''),
      numberToString: propTypes.bool,
      immediate: propTypes.bool.def(true),
      alwaysLoad: propTypes.bool.def(false),
    },
    emits: ['options-change', 'update:value', 'search'],
    setup(props, { emit }) {
      const options = ref<OptionsItem[]>([]);
      const selectValue = ref<string[]>([]);
      const inputValue = ref<string>('');
      const textareaValue = ref<string>('');
      const isSelect = ref<boolean>(true);
      const showArea = ref<boolean>(true);
      const loading = ref(false);
      const isFirstLoad = ref(true);

      const getOptions = computed(() => {
        const { labelField, valueField, numberToString } = props;

        return unref(options).reduce((prev, next: Recordable) => {
          if (next) {
            const value = next[valueField];
            prev.push({
              ...omit(next, [labelField, valueField]),
              label: next[labelField],
              value: numberToString ? `${value}` : value,
            });
          }
          return prev;
        }, [] as OptionsItem[]);
      });

      const handleChange = () => {
        // inputValue.value = value.join(',');
      };

      const handleChangeModel = (): void => {
        isSelect.value = !isSelect.value;
        if (isSelect.value) {
          inputValue.value = '';
          showArea.value = false;
        } else {
          selectValue.value = [];
          showArea.value = true;
        }
      };

      const handleInputFocus = (): void => {
        showArea.value = true;
      };

      const handleTextareaValueChange = (val) => {
        inputValue.value = val.join(',');
      };

      const changeTextareaVisible = (val: boolean) => {
        showArea.value = val;
      };

      const onSearch = (val: string) => {
        emit('search', val);
        fetch();
      };

      watch(
        () => props.params,
        () => {
          !unref(isFirstLoad) && fetch();
        },
        { deep: true },
      );

      watch([() => selectValue.value, () => inputValue.value], (v: any[]) => {
        const selectValue = [...toRaw(v[0])];
        const inputValue = v[1].split(',').filter((v: string) => !isEmpty(v));
        emit(
          'update:value',
          inputValue.length ? inputValue : selectValue.length ? selectValue : [],
        );
      });

      async function fetch() {
        const api = props.api;
        if (!api || !isFunction(api)) return;
        options.value = [];
        try {
          loading.value = true;
          const res = await api(props.params);
          console.log(res);
          if (Array.isArray(res)) {
            options.value = res;
            emitChange();
            return;
          }
          if (props.resultField) {
            options.value = get(res, props.resultField) || [];
          }
          emitChange();
        } catch (error) {
          console.warn(error);
        } finally {
          loading.value = false;
        }
      }

      async function handleFetch(visible) {
        if (visible) {
          if (props.alwaysLoad) {
            await fetch();
          } else if (!props.immediate && unref(isFirstLoad)) {
            await fetch();
            isFirstLoad.value = false;
          }
        }
      }

      function emitChange() {
        emit('options-change', unref(getOptions));
      }

      return {
        selectValue,
        inputValue,
        isSelect,
        showArea,
        textareaValue,
        getOptions,
        onSearch: useDebounceFn(onSearch, 300),
        handleChange,
        handleChangeModel,
        handleInputFocus,
        handleFetch,
        handleTextareaValueChange,
        changeTextareaVisible,
      };
    },
  });
</script>
<style lang="less" scoped>
  .api-multi__search {
    position: relative;
  }
</style>
