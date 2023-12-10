<template>
  <Col v-if="compactData.length > 0" v-bind="realColProps">
    <div class="compact-group" :class="{ 'compact-active': popVisible }">
      <Col class="compact-select-text">
        <ClickOutSide @click-outside="handlePopVisibleChange(false)">
          <Popover
            :visible="popVisible"
            placement="bottomLeft"
            trigger="click"
            overlayClassName="compact-group-popover"
          >
            <template #content>
              <VScroll
                :itemHeight="itemHeight"
                :items="compactData"
                :height="scrollHeight"
                :max-height="200"
                :width="150"
              >
                <template #default="{ item }">
                  <div
                    :class="{ 'ant-select-item-option-selected': item.field === nowField }"
                    class="ant-select-item field-label"
                    :title="item.label"
                    @click="handleChangeField(item.field)"
                    >{{ item.label }}</div
                  >
                </template>
              </VScroll>
            </template>
            <div
              class="label-switch"
              :title="(renderSchema.showLabel as string)"
              @click="clickCompactLabel"
            >
              <span>{{ renderSchema.showLabel }}</span>
              <DownOutlined :class="{ 'go-return': popVisible }" />
            </div>
          </Popover>
        </ClickOutSide>
      </Col>
      <FormItem
        class="test"
        :tableAction="tableAction"
        :formActionType="formActionType"
        :schema="renderSchema"
        :formProps="formProps"
        :allDefaultValues="allDefaultValues"
        :formModel="formModel"
        :setFormModel="setFormModel"
      />
    </div>
  </Col>
</template>
<script lang="ts" setup>
  import { computed, unref, reactive, ref } from 'vue';
  import { Col, Popover } from 'ant-design-vue';
  import { DownOutlined } from '@ant-design/icons-vue';
  import FormItem from './FormItem.vue';
  import type { FormActionType, FormProps, FormSchema } from '../types/form';
  import type { TableActionType } from '/@/components/Table';
  import { cloneDeep } from 'lodash-es';
  import { VScroll } from '/@/components/VirtualScroll/index';
  import { ClickOutSide } from '/@/components/ClickOutSide/index';

  const props = defineProps({
    schema: {
      type: Object as PropType<FormSchema>,
      default: () => ({}),
    },
    formProps: {
      type: Object as PropType<FormProps>,
      default: () => ({}),
    },
    allDefaultValues: {
      type: Object as PropType<Recordable>,
      default: () => ({}),
    },
    formModel: {
      type: Object as PropType<Recordable>,
      default: () => ({}),
    },
    setFormModel: {
      type: Function as PropType<(key: string, value: any) => void>,
      default: null,
    },
    tableAction: {
      type: Object as PropType<TableActionType>,
    },
    formActionType: {
      type: Object as PropType<FormActionType>,
    },
    schemaData: {
      type: Object as PropType<FormSchema[]>,
      default: () => [] as FormSchema[],
    },
  });
  const compactData = computed((): FormSchema[] => {
    return unref(props)
      .schemaData.sort((pre, next) => {
        return (pre.sort || Infinity) - (next.sort || Infinity);
      })
      .filter((schema) => schema.compact);
  });

  const nowField = ref(props.schema.defaultLink) || ref(unref(compactData).at(0)?.field);

  const renderSchema = computed((): FormSchema => {
    let schema = unref(compactData).find((item) => item.field === nowField.value);
    if (!schema) return {} as FormSchema;
    schema = cloneDeep(schema);
    schema.showLabel = schema.label;
    schema.label = '';
    delete schema.colProps;
    return schema;
  });

  const { colProps = {} } = unref(props.schema);
  const { baseColProps = {} } = unref(props.formProps);
  const realColProps = reactive({ ...baseColProps, ...colProps });
  const itemHeight = ref(32);
  const scrollHeight = computed(() => {
    return unref(compactData).length * unref(itemHeight);
  });
  const handleChangeField = async (field) => {
    if (field === unref(nowField)) return;
    nowField.value = field;
    popVisible.value = false;
  };
  const popVisible = ref(false);
  const clickCompactLabel = () => {
    popVisible.value = !unref(popVisible);
  };
  const handlePopVisibleChange = (flag = true) => {
    popVisible.value = flag;
  };
</script>
<style lang="less" scoped>
  .compact-group {
    display: flex;
    align-items: center;
    border: 1px solid @mes-border-color;
    height: 32px;
    border-radius: 2px;
    // font-size: 12px;

    &:focus-within,
    &.compact-active {
      border-color: #2a7dc9;
      box-shadow: 0 0 0 2px rgb(9 96 189 / 20%);
      border-right-width: 1px !important;
      outline: 0;
    }

    &:hover {
      border-color: #2a7dc9;
    }

    .compact-select-text {
      max-width: 40%;
      position: relative;
      border-right: 1px solid #e2e2e2;
      height: 30px;

      .label-switch {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 14px;
        height: 30px;
        line-height: 30px;

        .anticon-down {
          transition: 0.3s;
          color: #999;
          position: absolute;
          right: 4px;
          top: 10px;

          &.go-return {
            transform: rotate(180deg);
          }
        }
      }

      & + .ant-col {
        padding-left: 0 !important;
        padding-right: 0 !important;
        flex: 1;
      }
    }

    :deep(.ant-col) {
      .ant-select,
      .ant-picker {
        vertical-align: top;
      }

      .ant-input-search-button,
      .ant-input-group-addon {
        border: 0;

        .app-iconify {
          font-size: 12px !important;
        }
      }

      .ant-input-group-wrapper,
      .ant-input-search-button {
        height: 30px;
      }

      .ant-input-affix-wrapper,
      .ant-select-selector,
      .ant-input-number,
      .ant-picker {
        border: 0;
        box-shadow: none !important;
        height: 30px;

        &:focus,
        &-focused {
          box-shadow: none !important;
        }
      }

      textarea.ant-input {
        height: 30px;
        min-height: 30px;
        line-height: 30px;
        padding: 0;

        & + .anticon-close-circle {
          top: 5px;
        }
      }

      .ant-select-selection-item {
        line-height: 30px;
      }

      .ant-form-small {
        .ant-form-item-control-input {
          min-height: 30px;
        }
      }

      .ant-form-item {
        margin-bottom: 0 !important;
      }
    }
  }
</style>
<style lang="less">
  .compact-group-popover {
    padding-top: 3px;

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
  }
</style>
