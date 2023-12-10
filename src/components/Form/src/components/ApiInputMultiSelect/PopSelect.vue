<template>
  <div class="select-area__wrap">
    <Input
      ref="inputRef"
      v-model:value="inputValue"
      placeholder="搜索关键字"
      @input="handleInput"
      @focus="handleFetch"
    />
    <div class="select-area__body">
      <div class="select-options">
        <div
          v-for="(item, index) in getOptions"
          :key="item.value"
          class="select-options__item flex"
          :class="{ active: item.checked }"
          @click="selectOption(index)"
        >
          <div class="select-options__item--left">{{ item.label }}</div>
          <div class="select-options__item--right"><CheckOutlined /></div>
        </div>
      </div>
    </div>
    <div class="select-area__foot">
      <div class="select-area__foot-left">
        <Button type="text" class="btn-text" @click="handleSetAll">全选</Button>
        <Button type="text" class="btn-text" @click="handleReset">清空</Button>
      </div>
      <div class="select-area__foot-right">
        <Button size="small" type="text" @click="handleCancel(false)">取消</Button>
        <Button size="small" type="primary" @click="handleConfirm">确定</Button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent, computed, nextTick } from 'vue';
  import { ref, unref, watch } from 'vue';
  import { Button, Input } from 'ant-design-vue';
  import { isFunction } from '/@/utils/is';
  import { useDebounceFn } from '@vueuse/shared';
  import { CheckOutlined } from '@ant-design/icons-vue';
  import { propTypes } from '/@/utils/propTypes';
  import { omit, get } from 'lodash-es';
  type OptionsItem = {
    label: string;
    value: string | number;
    disabled?: boolean;
    checked?: boolean;
  };
  type CheckedItem = string | number;

  export default defineComponent({
    name: 'PopSelect',
    components: { Button, Input, CheckOutlined },
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
    emits: ['change', 'change-visible', 'search', 'options-change', 'update:value'],
    expose: ['focusOn'],
    setup(props, { emit, expose }) {
      const inputRef = ref<HTMLInputElement | null>();
      const inputValue = ref('');
      const selectValue = ref<string>('');
      const options = ref<OptionsItem[]>([]);
      const isFirstLoad = ref(true);
      const loading = ref<boolean>(false);
      const checkedOptions = ref<CheckedItem[]>([]);

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

      const handleConfirm = () => {
        const result = getOptions.value.filter((item) => item.checked);
        emit('update:value', result);
        changeVisible(false);
        inputValue.value = '';
      };

      const handleReset = () => {
        options.value.forEach((option: OptionsItem) => {
          option.checked = false;
        });
        emit('change', unref(checkedOptions));
      };

      const handleSetAll = () => {
        options.value.forEach((option: OptionsItem) => {
          option.checked = true;
        });
      };

      const handleCancel = (val: boolean) => {
        selectValue.value = '';
        changeVisible(val);
      };

      const changeVisible = (val: boolean) => {
        emit('change-visible', val);
      };

      const handleInput = (e: ChangeEvent) => {
        emit('search', e.target.value);
      };

      const selectOption = (index: number) => {
        options.value[index].checked = !options.value[index].checked;
      };

      watch(
        () => props.params,
        () => {
          console.log('props.params', props.params);
          !unref(isFirstLoad) && fetch();
        },
        { deep: true },
      );

      async function fetch() {
        const api = props.api;
        if (!api || !isFunction(api)) return;
        options.value = [];
        try {
          loading.value = true;
          const res = await api(props.params);
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

      function emitChange() {
        emit('options-change', unref(getOptions));
      }

      async function handleFetch() {
        await fetch();
        isFirstLoad.value = false;
      }

      function focusOn() {
        nextTick(() => {
          inputRef.value && inputRef.value.focus();
        });
      }

      expose({
        focusOn,
        changeVisible,
      });

      return {
        inputValue,
        selectValue,
        getOptions,
        checkedOptions,
        isFirstLoad,
        handleConfirm,
        handleReset,
        handleSetAll,
        handleCancel,
        selectOption,
        handleInput: useDebounceFn(handleInput, 300),
        handleFetch,
        focusOn,
        inputRef,
      };
    },
  });
</script>
<style lang="less" scoped>
  .select-area__wrap {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 9;
    border: 1px solid @mes-border-color;
    padding: 0.5em 0.5em 0;
    background: #fff;
    // min-width: 260px;

    .ant-input:focus,
    .ant-input-focused {
      border-color: inherit;
      box-shadow: unset;
    }

    .select-area__body {
      min-height: 10em;
      max-height: 20em;
      overflow-y: auto;

      .select-options__item {
        padding: 5px 12px;
        cursor: pointer;

        &:hover {
          background: #f5f5f5;
        }

        &--right {
          display: none;
          margin-left: auto;
          color: #0f62fe;
        }

        &.active {
          background: #e3f4fc;

          .select-options__item--right {
            display: block;
          }
        }
      }
    }

    .select-area__foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5em 0;
      border-top: 1px solid #e5e7eb;
    }
  }
</style>
