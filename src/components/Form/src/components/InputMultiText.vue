<template>
  <div ref="multipleInput" class="multiple-input__wrap">
    <div class="flex">
      <Input v-model:value="state" allowClear :placeholder="props.placeholder" v-bind="attrs" />
      <Tooltip>
        <Button @click="togglePopVisible">
          <template #icon><EllipsisOutlined /></template>
        </Button>
      </Tooltip>
    </div>
    <Popover
      :visible="popVisible"
      placement="bottomLeft"
      trigger="click"
      :autoAdjustOverflow="true"
      :overlayStyle="{ width: popWidth + 'px' }"
      overlayClassName="multiple-input__popover"
    >
      <template #content>
        <div ref="textarea" class="text-area__wrap">
          <FormItemRest>
            <Input.TextArea
              v-model:value="textareaValue"
              :placeholder="props.textareaPlaceholder"
              :rows="8"
            />
          </FormItemRest>
          <Divider class="divider" />
          <div class="text-area__foot flex justify-between">
            <div>
              共{{ number }}个
              <Button size="small" type="link" @click="handleClearAll">清空</Button>
            </div>
            <Space class="btn-group">
              <Button size="small" @click="popVisible = false">取消</Button>
              <Button size="small" ghost type="primary" @click="handleConfirm">确定</Button>
            </Space>
          </div>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script setup lang="ts" name="InputMultiText">
  import { ref, onMounted, watch, computed } from 'vue';
  import { Button, Input, Tooltip, Popover, Divider, Space } from 'ant-design-vue';
  import { EllipsisOutlined } from '@ant-design/icons-vue';
  import { onClickOutside } from '@vueuse/core';
  import { FormItemRest } from 'ant-design-vue/es/form';
  import { useAttrs } from '/@/hooks/core/useAttrs';
  import { RefElement } from '/@/utils/types';

  const popVisible = ref(false);
  const textareaValue = ref<string>('');
  const multipleInput = ref<RefElement>(null);
  const textarea = ref(null);
  const popWidth = ref(0);
  const number = ref(0);

  const props = defineProps({
    value: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    textareaPlaceholder: {
      type: String,
      default: '',
    },
    maxNum: {
      type: Number,
      default: 30,
    },
  });

  const attrs = useAttrs({ excludeDefaultKeys: false });
  const emit = defineEmits(['change']);
  const state: any = computed({
    get() {
      return props.value;
    },
    set(value) {
      emit('change', value);
    },
  });

  onMounted(() => {
    popWidth.value = multipleInput.value?.clientWidth || 0;
  });

  watch(
    () => textareaValue.value,
    (value) => {
      const values = value.split('\n');
      number.value = values.filter((str) => str.length).length;
      if (values.length > props.maxNum) {
        textareaValue.value = values.slice(0, props.maxNum).join('\n');
      }
    },
  );

  onClickOutside(textarea, () => {
    popVisible.value = false;
  });

  const togglePopVisible = () => {
    popVisible.value = true;
  };

  const handleClearAll = () => {
    textareaValue.value = '';
    state.value = '';
    popVisible.value = false;
  };

  const handleConfirm = () => {
    const newVal = textareaValue.value.replace(/[\n]+/g, ',');
    state.value = newVal;
    popVisible.value = false;
  };
</script>

<style lang="less">
  .multiple-input__popover {
    padding-top: 0;
    margin-top: -8px;

    .ant-popover-content {
      box-shadow: unset;
    }

    .ant-popover-inner-content {
      padding: 0;
    }

    .ant-popover-arrow {
      display: none;
    }

    .field-label {
      // font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .divider {
      margin: 0;
    }

    .text-area__wrap {
      .ant-input {
        border: none !important;
        box-shadow: unset;

        &:hover,
        &:focus {
          box-shadow: unset;
          border: none !important;
        }
      }

      .text-area__foot {
        padding: 4px 10px;
      }

      .btn-group {
        .ant-btn {
          &.ant-btn-sm {
            height: 22px;
            line-height: 20px;
            min-width: 26px !important;
            padding-left: 8px;
            padding-right: 8px;
          }
        }
      }
    }
  }
</style>
