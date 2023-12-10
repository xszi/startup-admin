<template>
  <Select
    v-model:value="state"
    :mode="mode"
    v-bind="bindValue"
    :filterOption="filterOption"
    @dropdown-visible-change="handleFetch"
    @change="handleChange"
  >
    <template v-for="item in Object.keys($slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}"></slot>
    </template>
    <template v-if="loading" #suffixIcon>
      <LoadingOutlined spin />
    </template>
    <template v-if="loading" #notFoundContent>
      <span>
        <LoadingOutlined spin class="mr-1" />
        {{ t('component.form.apiSelectNotFound') }}
      </span>
    </template>
    <!-- 自定义渲染的字段 -->
    <template v-if="tagRender" #tagRender="{ value: val, closable, onClose, option }">
      <Tag :closable="closable" style="margin-right: 3px" @close="onClose">
        <span v-if="option && option[tagRender]">{{
          option[tagRender] ? option[tagRender] : option
        }}</span>
        <span v-else>{{ val }}</span>
      </Tag>
    </template>
    <template v-if="selectWithOpt" #dropdownRender="{ menuNode: menu }">
      <v-nodes :vnodes="menu" />
      <template v-if="getOptions.length > 0">
        <Divider style="margin: 4px 0" />
        <div style="padding: 4px 8px; cursor: pointer" @mousedown="(e) => e.preventDefault()">
          <Button v-if="isMultiple" size="small" type="link" @click="selectAll">全选</Button>
          <Button size="small" type="text" @click="clearAll">清空</Button>
        </div>
      </template>
    </template>
    <!-- v-else 会导致vue3出现编译错误 -->
    <template v-if="!selectWithOpt && getOptions.length > 0">
      <!-- 传label转成字符串支持模糊查询 -->
      <template v-if="selectGroup">
        <SelectOptGroup
          v-for="(item, index) in getOptions"
          v-bind="omit(item, 'options')"
          :key="index"
          :disabled="item.disabled"
          :label="Array.isArray(item.label) ? item.label.join('-') : item.label"
        >
          <SelectOption
            v-for="option in item.options"
            v-bind="option"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
            :label="Array.isArray(option.label) ? option.label.join('-') : option.label"
          >
            <OptionValue :item="option"
          /></SelectOption>
        </SelectOptGroup>
      </template>
      <template v-else>
        <SelectOption
          v-for="item in getOptions"
          v-bind="item"
          :key="item.value"
          :value="item.value"
          :disabled="item.disabled"
          :label="Array.isArray(item.label) ? item.label.join('-') : item.label"
        >
          <OptionValue :item="item"
        /></SelectOption>
      </template>
    </template>
  </Select>
</template>
<script lang="tsx">
  import { defineComponent, PropType, ref, computed, unref, watch } from 'vue';
  import { Tag, Select, Divider, Button, SelectOption, SelectOptGroup } from 'ant-design-vue';
  import { isFunction, isNullOrUnDef } from '/@/utils/is';
  import { useRuleFormItem } from '/@/hooks/component/useFormItem';
  import { useAttrs } from '/@/hooks/core/useAttrs';
  import { get, omit, isEqual } from 'lodash-es';
  import { LoadingOutlined } from '@ant-design/icons-vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { propTypes } from '/@/utils/propTypes';
  import { useDebounceFn } from '@vueuse/core';
  import OptionValue from './Select/OptionValue.vue';
  import { watchDebounced } from '@vueuse/core';
  import { useDelay } from '/@/hooks/core/useTimeout';

  type OptionsItem = { label: string; value: string; disabled?: boolean; options?: Recordable[] };

  export default defineComponent({
    name: 'ApiSelect',
    components: {
      Tag,
      Select,
      Divider,
      SelectOption,
      Button,
      LoadingOutlined,
      OptionValue,
      SelectOptGroup,
      VNodes: (_, { attrs }) => {
        return attrs.vnodes;
      },
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
      watch: propTypes.array.def([]),
      formValues: propTypes.object.def({}),
      dependWatch: propTypes.bool.def(false),
      selectWithOpt: propTypes.bool.def(false),
      tagRender: propTypes.string.def(''),
      mode: propTypes.string.def(''),
      limitNum: propTypes.number.def(0),
      blendLabel: {
        type: [Boolean, Array],
        default: false,
      },
      customFilter: propTypes.func,
      options: propTypes.array.def([]),
      searchField: propTypes.string.def(''),
      remoteSearch: propTypes.bool.def(false),
      searchWithDefaultVal: propTypes.bool.def(false),
      /**
       * 默认选择第一条数据
       * 只支持本地搜索, TODO: 支持远程搜索
       **/
      autoSelectFirstOption: propTypes.bool.def(false),
      //是否分组
      selectGroup: propTypes.bool.def(false),
      //是否含有全部
      withWhole: propTypes.bool.def(false),
      //处理 options 函数
      handleOptFn: propTypes.func,
    },
    emits: ['options-change', 'change'],
    setup(props, { emit }) {
      const remoteParams = ref<Recordable>({});
      const options = ref<OptionsItem[]>([]);
      const loading = ref(false);
      const isFirstLoad = ref(true);
      const emitData = ref<any[]>([]);
      const attrs = useAttrs({ excludeDefaultKeys: false });
      const { t } = useI18n();
      // Embedded in the form, just use the hook binding to perform form verification
      const [state] = useRuleFormItem(props, 'value', 'change', emitData);
      const isMultiple = computed((): boolean => {
        return ['tags', 'multiple'].includes(props.mode);
      });
      const bindValue = computed(() => {
        const { selectWithOpt, remoteSearch, searchField, tagRender, autoSelectFirstOption } =
          props;

        const vbind = {
          ...unref(attrs),
          ...(tagRender ? { optionLabelProp: tagRender } : {}), // input 框回显字段
          ...(selectWithOpt ? { options: unref(getOptions) } : {}),
          ...((remoteSearch && searchField) || autoSelectFirstOption
            ? {
                onSearch: (val) => {
                  if (remoteSearch && searchField) {
                    handleSearch(val);
                  } else {
                    selectFirstOption(val);
                  }
                },
              }
            : {}),
        };
        return vbind;
      });

      const convertData = (prev, next) => {
        const { labelField, valueField, numberToString, blendLabel } = props;
        if (next) {
          const value = next[valueField];
          let label = next[labelField];
          if (!!blendLabel && Array.isArray(blendLabel)) {
            label = blendLabel.map((item: string) => next[item]).filter((item) => !!item);
          }
          prev.push({
            // ...omit(next, [labelField, valueField]),
            ...next,
            label,
            value: numberToString ? `${value}` : value,
          });
        }
        return prev;
      };
      const getOptions = computed(() => {
        const { selectGroup, withWhole, handleOptFn } = props;
        let data = unref(options).reduce((prev, next: Recordable) => {
          if (selectGroup && next?.options?.length > 0) {
            next.options = next.options.reduce((oPrev, oNext) => {
              return convertData(oPrev, oNext);
            }, [] as OptionsItem[]);
          }
          return convertData(prev, next);
        }, [] as OptionsItem[]);
        if (withWhole) {
          let disabled = false;
          if (unref(isMultiple)) {
            const selected = (unref(state) as Array<any>)?.filter((i) => !!i) || [];
            disabled = selected.length <= 0;
          }

          const wholeOpt = {
            label: '全部',
            value: '',
            disabled,
          };
          data = [wholeOpt, ...data];
        }
        return handleOptFn ? handleOptFn(data) : data;
      });

      // combine watch params logic
      const getWatchParams = computed(() => {
        const params: Recordable = {};
        const { watch, formValues, dependWatch } = props;
        if (watch?.length) {
          let watchWithoutVal = false;
          watch.forEach((fieldName: string) => {
            const formValue = formValues.values[fieldName];
            if (!isNullOrUnDef(formValue)) {
              params[fieldName] = formValue;
            } else {
              watchWithoutVal = true;
            }
          });
          if (watchWithoutVal && dependWatch) {
            return false;
          }
        }
        return params;
      });

      const fetch = async () => {
        const { api } = props;
        if (!api || !isFunction(api)) return;
        options.value = [];
        const watchParams = unref(getWatchParams);
        if (watchParams === false) {
          return;
        }
        const params = {
          ...props.params,
          ...unref(remoteParams),
          ...watchParams,
        };

        try {
          loading.value = true;
          const res = await api(params);
          isFirstLoad.value = false;
          try {
            watchSetDefaultRemoteVal();
          } catch {}
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
      };
      watchDebounced(
        () => {
          return props.immediate && !props.alwaysLoad && unref(isFirstLoad);
        },
        (val) => {
          val && fetch();
        },
        {
          debounce: 10,
          immediate: true,
        },
      );
      watchDebounced(
        () => {
          return unref(getWatchParams);
        },
        (val, old) => {
          if (isEqual(val, old)) return;
          fetch();
        },
      );

      watchDebounced(
        [() => JSON.stringify(props.params), () => JSON.stringify(unref(remoteParams))],
        () => {
          !unref(isFirstLoad) && fetch();
        },
        { debounce: 100 },
      );

      watch(
        () => props.formValues,
        (value, oldValue) => {
          props.watch.forEach((fieldName: string) => {
            const newFiledValue = value.values?.[fieldName];
            const oldFieldValue = oldValue.values?.[fieldName];
            if (typeof oldFieldValue === 'string' && newFiledValue !== oldFieldValue) {
              isFirstLoad.value = true;
            }
            if (
              Array.isArray(newFiledValue) &&
              Array.isArray(oldFieldValue) &&
              newFiledValue.length !== oldFieldValue.length
            ) {
              isFirstLoad.value = true;
            }

            if (oldFieldValue === undefined && newFiledValue !== oldFieldValue) {
              isFirstLoad.value = true;
            }
          });
        },
        { deep: true },
      );

      async function handleFetch(visible) {
        if (visible) {
          if (props.alwaysLoad) {
            await fetch();
          } else if (!props.immediate && unref(isFirstLoad)) {
            await fetch();
          }
        }
      }

      function emitChange() {
        emit('options-change', unref(getOptions));
      }

      function handleChange(_, ...args) {
        emitData.value = args;
      }
      const selectAll = () => {
        const { value } = (unref(attrs) as Recordable)?.fieldNames || {};
        state.value = unref(getOptions).map((i) => {
          if (value) return i[value];
          return i.value;
        });
        emitData.value = [unref(getOptions)];
      };
      const clearAll = () => {
        emitData.value = [];
        state.value = [];
      };
      const filterOption = (inputVal, options) => {
        if (inputVal) {
          inputVal = inputVal.trim();
        }
        const { customFilter, remoteSearch } = props;
        if (remoteSearch) return true;
        if (isFunction(customFilter)) {
          return customFilter(inputVal, options);
        }
        // replaceAll 有低版本浏览器兼容问题，先改成 replace 了
        return options?.label?.replace(/\s|\s/g, '')?.includes(inputVal);
      };

      const setDefaultOption = () => {
        const { api, options: list } = props;
        if ((!api || !isFunction(api)) && Array.isArray(list)) {
          options.value = list as OptionsItem[];
        }
      };
      const handleSearch = useDebounceFn((val) => {
        const { remoteSearch, searchField } = props;
        if (!remoteSearch || !searchField) {
          return;
        }
        remoteParams.value = {
          [searchField]: val,
        };
      }, 100);

      const selectFirstOption = (inputVal: string) => {
        if (typeof inputVal !== 'string' || inputVal.trim() === '') return;

        const firstOption = getOptions.value.find((item) => {
          if (Array.isArray(item.label)) {
            return item.label.some(
              (label) => typeof label === 'string' && label.includes(inputVal),
            );
          } else {
            item.label.includes(inputVal);
          }
        });

        if (firstOption) {
          state.value = firstOption.value;
          emitData.value = [firstOption];
        } else {
          state.value = undefined;
          emitData.value = [];
        }
      };

      watch(
        () => {
          return props.options;
        },
        setDefaultOption,
        {
          immediate: true,
        },
      );

      const setDefaultRemoteSearchVal = () => {
        const { searchWithDefaultVal, searchField, remoteSearch } = props;
        if (!searchWithDefaultVal || !remoteSearch || !searchField) {
          return;
        }
        const value = unref(state);
        isFirstLoad.value = false;
        remoteParams.value = {
          [searchField]: value,
        };
      };
      const watchSetDefaultRemoteVal = watch(
        state,
        async () => {
          unref(isFirstLoad) && setDefaultRemoteSearchVal();
          try {
            await useDelay(500);
            watchSetDefaultRemoteVal();
          } catch {}
        },
        {
          immediate: true,
        },
      );

      watchDebounced(
        state,
        (val: any[], old: any[]) => {
          val = val || [];
          old = old || [];
          if (!props.withWhole || !unref(isMultiple)) {
            return;
          }
          if (val.length <= 0 || (val.some((i) => i === '') && !old.some((i) => i === ''))) {
            state.value = [''];
            // emitData.value = [];
            return;
          }
          if (val.length > 1 && val.some((i) => i === '')) {
            state.value = (unref(state) as any[])?.filter((i) => i !== '');
            return;
          }
        },
        {
          debounce: 50,
        },
      );
      const handleMouseOver = (e) => {
        const target = e.target;
        if (!target) return;
        if (target.scrollWidth <= target.clientWidth) {
          const maskEl = target.querySelector('.mask');
          if (maskEl) {
            return;
          }
          const mask = document.createElement('div');
          mask.style.position = 'absolute';
          mask.classList.add('mask');
          mask.style.left = '0';
          mask.style.right = '0';
          mask.style.top = '0';
          mask.style.bottom = '0';
          mask.style.zIndex = '999';
          target.style.position = 'relative';
          target.appendChild(mask);
        }
      };

      return {
        state,
        attrs,
        getOptions,
        loading,
        t,
        handleFetch,
        handleChange,
        selectAll,
        clearAll,
        isMultiple,
        filterOption,
        handleSearch,
        bindValue,
        handleMouseOver,
        omit,
      };
    },
  });
</script>
