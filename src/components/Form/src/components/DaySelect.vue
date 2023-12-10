<template>
  <!-- <Row>
    <Col :span="8"><Button>自定义</Button></Col>
    <Col :span="16"><Input v-bind="$attrs" v-model:value="state" /></Col>
  </Row> -->
  <a-input-group v-if="mode === 2" compact>
    <a-button @click="changeMode">自定义</a-button>
    <InputNumber
      v-bind="$attrs"
      v-model:value="state"
      class="input-num"
      placeholder="请输入"
      :controls="false"
      :precision="0"
      stringMode
    />
  </a-input-group>

  <Select v-else v-bind="$attrs" v-model:value="state" :options="options" @change="handleChange">
    <template #dropdownRender="{ menuNode: menu }">
      <v-nodes :vnodes="menu" />
      <Divider style="margin: 4px 0" />
      <div style="padding: 4px 8px; cursor: pointer" @mousedown="(e) => e.preventDefault()">
        <a-button class="w-full" @click="changeMode">自定义</a-button>
      </div>
    </template>
  </Select>
</template>
<script lang="tsx">
  import { defineComponent, ref, unref } from 'vue';
  import { Select, Divider, InputNumber } from 'ant-design-vue';
  import { useRuleFormItem } from '/@/hooks/component/useFormItem';
  import { useAttrs } from '/@/hooks/core/useAttrs';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { propTypes } from '/@/utils/propTypes';
  export default defineComponent({
    name: 'DaySelect',
    components: {
      Select,
      Divider,
      InputNumber,
      VNodes: (_, { attrs }) => {
        return attrs.vnodes;
      },
    },
    inheritAttrs: false,
    props: {
      value: [Array, Object, String, Number],
      formValues: propTypes.object.def({}),
      dependWatch: propTypes.bool.def(false),
      selectWithOpt: propTypes.bool.def(false),
      tagRender: propTypes.string.def(''),
      blendLabel: {
        type: [Boolean, Array],
        default: false,
      },
      customFilter: propTypes.func,
      options: propTypes.array.def([]),
      searchField: propTypes.string.def(''),
      remoteSearch: propTypes.bool.def(false),
      searchWithDefaultVal: propTypes.bool.def(false),
    },
    emits: ['options-change', 'change'],
    setup(props) {
      const emitData = ref<any[]>([]);
      const attrs = useAttrs();
      const { t } = useI18n();
      // Embedded in the form, just use the hook binding to perform form verification
      const state: any = useRuleFormItem(props, 'value', 'change', emitData)?.[0];
      const mode = ref(1); //1:下拉 2:输入

      function handleChange(_, ...args) {
        emitData.value = args;
      }
      const changeMode = () => {
        mode.value = unref(mode) === 1 ? 2 : 1;
        state.value = '';
      };

      return {
        state,
        attrs,
        t,
        handleChange,
        changeMode,
        mode,
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

  .ant-btn:hover {
    z-index: 1;
  }

  .input-num {
    width: calc(100% - 80px) !important;
  }
</style>
