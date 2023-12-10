<template>
  <div class="input-multi__select" @mouseleave="mouseLeave">
    <Input v-model:value="getInputValue" placeholder="请选择工段编码或名称" @focus="handleFocus">
      <template #suffix>
        <CloseCircleFilled
          v-show="getInputValue.length"
          :style="{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.25)' }"
          @click="handleClearInputValue"
        />
      </template>
    </Input>
    <FormItemRest>
      <PopSelect
        v-show="selectModelVisible"
        ref="popSelectRef"
        v-bind="getSelectBindValue"
        v-model:value="selectValue"
        @search="search"
        @change-visible="handleChangeVisible"
      />
    </FormItemRest>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref, computed, watch, unref } from 'vue';
  import { Input } from 'ant-design-vue';
  import { FormItemRest } from 'ant-design-vue/es/form';
  import PopSelect from './PopSelect.vue';
  import { propTypes } from '/@/utils/propTypes';
  import { CloseCircleFilled } from '@ant-design/icons-vue';
  type OptionsItem = {
    label: string;
    value: string | number | boolean;
    disabled?: boolean;
    checked?: boolean;
  };

  export default defineComponent({
    name: 'ApiInputMultiSelect',
    components: { Input, PopSelect, CloseCircleFilled, FormItemRest },
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
    emits: ['search', 'update:value'],
    setup(props, { emit }) {
      const popSelectRef = ref<any>(null);
      const inputValue = ref('');
      const selectModelVisible = ref<boolean>(false);
      const selectValue = ref<OptionsItem[]>([]);

      const getSelectBindValue = computed(() => {
        return { ...props };
      });

      const getInputValue = computed(() => {
        return selectValue.value.map((item) => item.label).join(',');
      });

      watch(
        () => selectValue.value,
        (val) => {
          emit('update:value', val);
        },
      );

      const search = (val) => {
        emit('search', val);
      };

      const handleChangeVisible = (visible: boolean) => {
        selectModelVisible.value = visible;
      };

      const handleFocus = async () => {
        selectModelVisible.value = true;
        // popSelectRef.value && popSelectRef.value.focusOn();
        unref(popSelectRef)?.focusOn();
      };

      const handleClearInputValue = () => {
        selectValue.value = [];
      };

      const mouseLeave = () => {
        // 鼠标移出事件
        console.log('离开整体组件');
        // unref(popSelectRef)?.changeVisible(false);
      };

      return {
        search,
        inputValue,
        selectValue,
        popSelectRef,
        getInputValue,
        getSelectBindValue,
        selectModelVisible,
        handleChangeVisible,
        handleFocus,
        handleClearInputValue,
        mouseLeave,
      };
    },
  });
</script>
<style lang="less" scoped>
  .input-multi__select {
    position: relative;
  }
</style>
