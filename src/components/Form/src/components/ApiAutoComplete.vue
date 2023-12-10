<template>
  <AutoComplete
    v-model:value="state"
    :filter-option="filterOption"
    v-bind="bindValue"
    :options="getOptions"
    @dropdown-visible-change="handleFetch"
    @change="handleChange"
    @select="selectItem"
  >
    <!-- <template v-if="loading" #suffixIcon>
      <LoadingOutlined spin />
    </template> -->
    <Input
      class="input"
      :placeholder="$attrs.placeholder"
      allowClear
      @press-enter="handlePressEnter"
    />
    <template #option="{ value: val }">
      <span>{{ val.split('|')[0] }} <span class="split"></span> {{ val.split('|')[1] }}</span>
    </template>
  </AutoComplete>
</template>
<script lang="ts">
  import { defineComponent, PropType, ref, watchEffect, computed, unref, watch, toRaw } from 'vue';
  import { AutoComplete, Input } from 'ant-design-vue';
  import { isFunction } from '/@/utils/is';
  import { useAttrs } from '/@/hooks/core/useAttrs';
  import { get, omit } from 'lodash-es';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { propTypes } from '/@/utils/propTypes';

  type OptionsItem = { label: string; value: string; disabled?: boolean };

  export default defineComponent({
    name: 'ApiAutoComplete',
    components: {
      Input,
      AutoComplete,
    },
    inheritAttrs: false,
    props: {
      value: [Array, Object, String, Number],
      numberToString: propTypes.bool,
      api: {
        type: Function as PropType<(arg?: Recordable) => Promise<OptionsItem[]>>,
        default: null,
      },
      // api params
      params: {
        type: Object as PropType<Recordable>,
        default: () => ({}),
      },
      // support xxx.xxx.xx
      resultField: propTypes.string.def(''),
      labelField: propTypes.string.def('label'),
      valueField: propTypes.string.def('value'),
      immediate: propTypes.bool.def(true),
      alwaysLoad: propTypes.bool.def(false),
    },
    emits: ['options-change', 'change', 'update:value'],
    setup(props, { emit }) {
      const options = ref<OptionsItem[]>([]);
      const loading = ref(false);
      const isFirstLoad = ref(true);
      const emitData = ref<any[]>([]);
      const attrs = useAttrs();
      const { t } = useI18n();
      const dropDownVisible = ref(false);

      // Embedded in the form, just use the hook binding to perform form verification
      // const [state] = useRuleFormItem(props, 'value', 'change', emitData);
      const inputValue = ref('');
      const state: any = computed({
        get() {
          return props.value;
        },
        set(value) {
          emit('change', value, ...(toRaw(unref(emitData)) || []));
        },
      });

      const bindValue = computed(() => {
        const vbind = {
          ...omit(unref(attrs), ['allowClear', 'placeholder']),
        };
        return vbind;
      });

      const getOptions = computed(() => {
        const { labelField, valueField } = props;

        return unref(options).reduce((prev, next: Recordable) => {
          if (next) {
            const value = next[valueField];
            prev.push({
              ...omit(next, [labelField, valueField]),
              label: next[labelField],
              value: value + '|' + next[labelField],
            });
          }
          return prev;
        }, [] as OptionsItem[]);
      });

      const selectItem = (value, _) => {
        // emit('change', value, ...(toRaw(unref(emitData)) || []));
        emit('change', value.split('|')[1], ...(toRaw(unref(emitData)) || []));
      };

      watchEffect(() => {
        props.immediate && !props.alwaysLoad && fetch();
      });

      // watch(
      //   () => state.value,
      //   (v) => {
      //     emit('update:value', v);
      //   },
      // );

      watch(
        () => props.params,
        () => {
          !unref(isFirstLoad) && fetch();
        },
        { deep: true },
      );

      const filterOption = (input: string, option) => {
        if (dropDownVisible.value) {
          dropDownVisible.value = false;
          return true;
        }
        return (
          option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0 ||
          option.label.toUpperCase().indexOf(input.toUpperCase()) >= 0
        );
      };

      async function fetch() {
        const api = props.api;
        if (!api || !isFunction(api)) return;
        options.value = [];
        try {
          loading.value = true;
          let res = await api(props.params);
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
          dropDownVisible.value = visible;
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

      function handleChange(_, ...args) {
        emitData.value = args;
      }

      function handlePressEnter(e) {
        e.stopPropagation();
      }

      return {
        inputValue,
        state,
        attrs,
        getOptions,
        loading,
        t,
        handleFetch,
        handleChange,
        filterOption,
        bindValue,
        selectItem,
        handlePressEnter,
      };
    },
  });
</script>

<style lang="less" scoped>
  .split {
    height: 1.2em;
    line-height: 1.2em;
    vertical-align: -0.3em;
    width: 1px;
    margin: 0 8px;
    display: inline-block;
    background-color: @table-header-bg;
  }

  :deep(.ant-select-selector) {
    .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover {
      border-right: none;
    }
  }
</style>
