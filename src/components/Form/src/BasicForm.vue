<template>
  <div class="vben-basic-form_wrapper">
    <BasicTitle v-show="getBindValue.title" class="head-title" span full-w>
      {{ getBindValue.title }}
      <template #extra>
        <slot name="extra"></slot>
      </template>
    </BasicTitle>
    <Form
      v-bind="getBindValue"
      ref="formElRef"
      :class="getFormClass"
      :model="formModel"
      @keypress.enter="handleEnterPress"
    >
      <Row :wrap="false">
        <Col flex="auto">
          <Row v-bind="getRow">
            <slot name="formHeader"></slot>
            <template v-for="schema in getSchema" :key="schema.field">
              <template v-if="!customRenderComp.includes(schema.component)">
                <FormItem
                  :tableAction="tableAction"
                  :isAdvanced="fieldsIsAdvancedMap[schema.field]"
                  :formActionType="formActionType"
                  :schema="schema"
                  :formProps="getProps"
                  :allDefaultValues="defaultValueRef"
                  :formModel="formModel"
                  :setFormModel="setFormModel"
                >
                  <template v-for="item in Object.keys($slots)" #[item]="data">
                    <slot :name="item" v-bind="data || {}"></slot>
                  </template>
                </FormItem>
              </template>
              <template v-else>
                <component
                  :is="schema.component"
                  :tableAction="tableAction"
                  :formActionType="formActionType"
                  :schema="schema"
                  :formProps="getProps"
                  :allDefaultValues="defaultValueRef"
                  :formModel="formModel"
                  :setFormModel="setFormModel"
                  :schemaData="getSchemaData"
                />
              </template>
            </template>

            <FormAction
              v-if="isShowFormAction"
              v-bind="getFormActionBindProps"
              @toggle-advanced="handleToggleAdvanced"
            >
              <template
                v-for="item in ['resetBefore', 'submitBefore', 'advanceBefore', 'advanceAfter']"
                #[item]="data"
              >
                <slot :name="item" v-bind="data || {}"></slot>
              </template>
            </FormAction>
            <slot name="formFooter"></slot>
          </Row>
        </Col>
        <Col v-if="isExtraFormAction" flex="180px">
          <Row>
            <FormAction
              v-bind="Object.assign({}, getFormActionBindProps, { span: 24 })"
              @toggle-advanced="handleToggleAdvanced"
            />
          </Row>
        </Col>
      </Row>
    </Form>
    <div>
      <slot name="formBottom"></slot>
    </div>
    <div class="split-line" :class="[showAdvance ? 'show-advance' : '']">
      <div
        v-show="getFormActionBindProps.showAdvancedButton && !getFormActionBindProps.hideAdvanceBtn"
        class="line-advance"
        @click="handleToggleAdvanced"
      >
        <Icon
          iconfont
          icon="icon-zuojiantou"
          :class="[!advanceState.isAdvanced ? 'down' : 'up', 'icon']"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import type { FormActionType, FormProps, FormSchema } from './types/form';
  import type { AdvanceState } from './types/hooks';
  import type { Ref, ComponentInternalInstance } from 'vue';
  import {
    defineComponent,
    reactive,
    ref,
    computed,
    unref,
    onMounted,
    onUnmounted,
    watch,
    nextTick,
    getCurrentInstance,
    onActivated,
  } from 'vue';
  import { Form, Row, Col } from 'ant-design-vue';
  import { BasicTitle } from '/@/components/Basic';
  import Icon from '/@/components/Icon/src/Icon.vue';
  import FormItem from './components/FormItem.vue';
  import FormAction from './components/FormAction.vue';
  import CompactGroup from './components/CompactGroup.vue';

  import { dateItemType } from './helper';
  import { dateUtil } from '/@/utils/dateUtil';

  // import { cloneDeep } from 'lodash-es';
  import { deepMerge } from '/@/utils';

  import { useFormValues } from './hooks/useFormValues';
  import useAdvanced from './hooks/useAdvanced';
  import { useFormEvents } from './hooks/useFormEvents';
  import { createFormContext } from './hooks/useFormContext';
  import { useAutoFocus } from './hooks/useAutoFocus';
  import { useModalContext } from '/@/components/Modal';
  import { useDebounceFn } from '@vueuse/core';

  import { basicProps } from './props';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { cloneDeep } from 'lodash-es';

  const BASIC_COLUMN_COUNT = 24;
  export default defineComponent({
    name: 'BasicForm',
    components: { FormItem, Form, Row, FormAction, CompactGroup, BasicTitle, Icon, Col },
    props: basicProps,
    emits: ['advanced-change', 'reset', 'submit', 'register', 'field-value-change'],
    setup(props, { emit, attrs }) {
      const formModel = reactive<Recordable>({});
      const modalFn = useModalContext();
      let $instance: ComponentInternalInstance | null = null;
      const advanceState = reactive<AdvanceState>({
        isAdvanced: true,
        hideAdvanceBtn: false,
        isLoad: false,
        actionSpan: 6,
      });
      const customRenderComp = ref(['CompactGroup']);

      const defaultValueRef = ref<Recordable>({});
      const isInitedDefaultRef = ref(false);
      const propsRef = ref<Partial<FormProps>>({});
      const schemaRef = ref<Nullable<FormSchema[]>>(null);
      const formElRef = ref<Nullable<FormActionType>>(null);

      const { prefixCls } = useDesign('basic-form');

      // Get the basic configuration of the form
      const getProps = computed((): FormProps => {
        return { ...(props as Recordable), ...unref(propsRef) } as FormProps;
      });

      const getFormClass = computed(() => {
        return [
          prefixCls,
          {
            [`${prefixCls}--compact`]: unref(getProps).compact,
            [`${prefixCls}--has_title`]: !!unref(getProps).title,
          },
        ];
      });

      const getColSum = computed(() => {
        let BASE_COL = 24;
        const { baseColProps } = unref(getProps);
        if (baseColProps) {
          BASE_COL = +(baseColProps.span || 24);
        }
        return unref(getSchema).reduce((prev, cur) => {
          let span = BASE_COL;
          if (cur.colProps) {
            span = +(cur.colProps.span || BASE_COL);
          }
          return prev + span;
        }, 0);
      });

      const isExtraFormAction = computed(() => {
        if (!unref(getFormActionBindProps).showActionButtonGroup) {
          return false;
        }
        if (!unref(getProps).isTableSearchForm || unref(getColSum) < BASIC_COLUMN_COUNT) {
          return false;
        }
        return !advanceState.isAdvanced;
      });

      const isShowFormAction = computed(() => {
        if (!unref(getProps).isTableSearchForm) {
          return true;
        }
        return unref(getColSum) < 24 || advanceState.isAdvanced;
      });

      // Get uniform row style and Row configuration for the entire form
      const getRow = computed((): Recordable => {
        const { baseRowStyle = {}, rowProps } = unref(getProps);
        return {
          style: baseRowStyle,
          ...rowProps,
        };
      });

      const getBindValue = computed(
        () => ({ ...attrs, ...props, ...unref(getProps) } as Recordable),
      );

      const getSchemaData = computed((): FormSchema[] => {
        const schemas: FormSchema[] = unref(schemaRef) || (unref(getProps).schemas as any);
        for (const schema of schemas) {
          const { defaultValue, component } = schema;
          // handle date type
          if (defaultValue && dateItemType.includes(component)) {
            if (!Array.isArray(defaultValue)) {
              schema.defaultValue = dateUtil(defaultValue);
            } else {
              const def: any[] = [];
              defaultValue.forEach((item) => {
                def.push(dateUtil(item));
              });
              schema.defaultValue = def;
            }
          }
        }
        if (unref(getProps).showAdvancedButton) {
          return cloneDeep(
            schemas.filter((schema) => schema.component !== 'Divider') as FormSchema[],
          );
        } else {
          return cloneDeep(schemas as FormSchema[]);
        }
      });
      const getSchema = computed((): FormSchema[] => {
        return unref(getSchemaData).filter((schema) => schema.compact !== true);
      });

      const { handleToggleAdvanced, fieldsIsAdvancedMap } = useAdvanced({
        advanceState,
        emit,
        getProps,
        getSchema,
        formModel,
        defaultValueRef,
      });

      const { handleFormValues, initDefault } = useFormValues({
        getProps,
        defaultValueRef,
        getSchema,
        formModel,
      });

      useAutoFocus({
        getSchema,
        getProps,
        isInitedDefault: isInitedDefaultRef,
        formElRef: formElRef as Ref<FormActionType>,
      });

      const {
        handleSubmit,
        setFieldsValue,
        clearValidate,
        validate,
        validateFields,
        getFieldsValue,
        updateSchema,
        resetSchema,
        appendSchemaByField,
        removeSchemaByFiled,
        resetFields,
        scrollToField,
      } = useFormEvents({
        emit,
        getProps,
        formModel,
        getSchema: getSchemaData,
        defaultValueRef,
        formElRef: formElRef as Ref<FormActionType>,
        schemaRef: schemaRef as Ref<FormSchema[]>,
        handleFormValues,
      });

      createFormContext({
        resetAction: resetFields,
        submitAction: handleSubmit,
      });

      watch(
        () => unref(getProps).model,
        async () => {
          await nextTick();
          const { model } = unref(getProps);
          if (!model) return;
          setFieldsValue(model);
        },
        {
          immediate: true,
        },
      );

      watch(
        () => unref(getProps).schemas,
        (schemas) => {
          resetSchema(schemas ?? []);
        },
      );

      watch(
        () => getSchema.value,
        async (schema) => {
          nextTick(() => {
            //  Solve the problem of modal adaptive height calculation when the form is placed in the modal
            modalFn?.redoModalHeight?.();
          });
          if (unref(isInitedDefaultRef)) {
            return;
          }
          if (schema?.length) {
            initDefault();
            await nextTick();
            isInitedDefaultRef.value = true;
          }
        },
      );

      onActivated(() => {
        isInitedDefaultRef.value = false; // 防止缓存失效
      });

      /* fix register won't tirgger getProps usage */
      const startWatchBinding = () => {
        // optimize watch binding
        if (unref(getProps).submitOnChange) {
          watch(
            () => formModel,
            useDebounceFn(() => {
              handleSubmit();
            }, 300),
            { deep: true },
          );
        }
      };
      const stopSubmitOnChangeWatch = watch(
        () => unref(getProps).submitOnChange,
        () => {
          startWatchBinding();
          stopSubmitOnChangeWatch();
        },
      );

      /* watch reflect start */
      const startWatchReflect = () => {
        let delayWatchFlag = false;
        const watchMap = unref(getSchema).reduce((map, schema) => {
          if (schema.watch?.length) {
            // 延迟 watch，用于编辑情况下第一次赋值，不重新 reset
            if (schema.delayWatch) delayWatchFlag = true;

            schema.watch.forEach((filedName) => {
              const fieldArr = map.get(filedName) || [];
              fieldArr.push(schema.field);
              map.set(filedName, fieldArr);
            });
          }

          return map;
        }, new Map() as Map<string, string[]>);
        if (watchMap.size) {
          const watchStart = () => {
            [...watchMap.keys()].map((fieldName) => {
              watch(
                () => ({ fieldName, value: formModel[fieldName] }),
                ({ fieldName }) => {
                  console.log(fieldName);
                  watchMap.get(fieldName)?.forEach((changeField) => {
                    setFormModel(changeField, void 0);
                  });
                },
                { deep: true },
              );
            });
          };
          if (delayWatchFlag) {
            setTimeout(() => {
              watchStart();
            }, 500);
          } else {
            watchStart();
          }
        }
      };
      /* watch reflect end */

      if (unref(getSchema).length === 0) {
        // async load form modal's form has no schema in init
        const stopGetSchemaWatch = watch(
          () => unref(getSchema),
          (schema) => {
            if (schema.length > 0) {
              startWatchReflect();
              stopGetSchemaWatch();
            }
          },
        );
      } else {
        startWatchReflect();
      }

      async function setProps(formProps: Partial<FormProps>): Promise<void> {
        propsRef.value = deepMerge(unref(propsRef) || {}, formProps);
        $instance = getCurrentInstance() || $instance;
      }

      function setFormModel(key: string, value: any) {
        formModel[key] = value;
        const { validateTrigger } = unref(getBindValue);
        if (!validateTrigger || validateTrigger === 'change') {
          validateFields([key]).catch((_) => {});
        }
        emit('field-value-change', key, value);
      }

      function handleEnterPress(e: KeyboardEvent) {
        const { autoSubmitOnEnter } = unref(getProps);
        if (!autoSubmitOnEnter) return;
        if (e.key === 'Enter' && e.target && e.target instanceof HTMLElement) {
          const target: HTMLElement = e.target as HTMLElement;
          if (target && target.tagName && target.tagName.toUpperCase() == 'INPUT') {
            handleSubmit();
          }
        }
      }

      const formActionType: Partial<FormActionType> = {
        getFieldsValue,
        setFieldsValue,
        resetFields,
        updateSchema,
        resetSchema,
        setProps,
        removeSchemaByFiled,
        appendSchemaByField,
        clearValidate,
        validateFields,
        validate,
        submit: handleSubmit,
        scrollToField: scrollToField,
        handleToggleAdvanced: handleToggleAdvanced,
      };

      onMounted(() => {
        initDefault();
        emit('register', formActionType);
      });

      onUnmounted(() => {
        $instance = null;
      });

      const getFormActionBindProps = computed(
        (): Recordable => ({ ...getProps.value, ...advanceState }),
      );

      const showAdvance = computed(() => {
        return (
          getFormActionBindProps.value.showAdvancedButton &&
          !getFormActionBindProps.value.hideAdvanceBtn
        );
      });

      return {
        showAdvance,
        getBindValue,
        handleToggleAdvanced,
        handleEnterPress,
        fieldsIsAdvancedMap,
        formModel,
        defaultValueRef,
        advanceState,
        getRow,
        getProps,
        formElRef,
        getSchema,
        formActionType: formActionType as any,
        setFormModel,
        getFormClass,
        getFormActionBindProps,
        ...formActionType,
        getSchemaData,
        customRenderComp,
        isExtraFormAction,
        isShowFormAction,
      };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'@{namespace}-basic-form';

  .@{prefix-cls} {
    .ant-form-item {
      &-label label::after {
        margin: 0 6px 0 2px;
      }

      &-with-help {
        margin-bottom: 10px;

        .ant-form-item-explain {
          display: none;
        }
      }

      &:not(.ant-form-item-with-help) {
        margin-bottom: 10px;
      }

      &.suffix-item {
        .ant-form-item-children {
          display: flex;
        }

        .ant-form-item-control {
          margin-top: 4px;
        }

        .suffix {
          display: inline-flex;
          padding-left: 6px;
          margin-top: 1px;
          line-height: 1;
          align-items: center;
        }
      }
    }

    .ant-form-explain {
      font-size: 14px;
    }

    &--compact {
      .ant-form-item {
        margin-bottom: 8px !important;
      }
    }

    &--has_title {
      padding-left: 32px;
      padding-right: 32px;
    }
  }

  .vben-basic-form_wrapper {
    .split-line {
      display: none;
    }

    > .head-title {
      margin-bottom: 14px;
    }
  }
</style>

<style lang="less" scoped>
  .line-advance {
    display: inline-block;
    width: 45px;
    height: 14px;
    background-color: #e2e2e2;
    position: relative;
    top: -6px;
    font-size: 12px;
    line-height: 1.2;
    color: #061023;
    cursor: pointer;

    .icon {
      transition: all 0.2s;
      color: #061023;
      transform: rotate(-90deg) scale(0.7);

      &.up {
        transform: rotate(90deg) scale(0.7);
      }
    }
  }

  .split-line {
    width: 100%;
    border-top: 1px solid #e2e2e2;
    text-align: center;
    line-height: 0px;
    margin-bottom: 4px;
    // display: none;
    &.show-advance {
      margin-bottom: -2px;
    }
  }
</style>
