<template>
  <div class="text-area__wrap">
    <Textarea
      v-model:value="textareaValue"
      placeholder="多个工号可以换行隔开，最多支持30个物料编码&#10;例如：&#10;CBAMQ28000ABM103&#10;CBAMQ28000ABM102"
      :rows="4"
    />
    <div class="text-area__foot">
      <div class="text-area__foot-left">
        <span>共 {{ getResultValue.length }} 个</span>
        <Button type="link" @click="handleReset">清空</Button>
      </div>
      <div class="text-area__foot-right">
        <Button size="small" type="text" @click="handleCancel(false)">取消</Button>
        <Button size="small" type="primary" @click="handleConfirm">确定</Button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import { defineComponent, computed } from 'vue';
  import { ref, unref } from 'vue';
  import { Button } from 'ant-design-vue';
  import { Textarea } from 'ant-design-vue/es';
  import { isEmpty } from '/@/utils/is';

  export default defineComponent({
    name: 'PopTextArea',
    components: { Textarea, Button },
    // props: {},
    emits: ['change', 'change-visible'],
    setup(_, { emit }) {
      const textareaValue = ref<string>('');

      const getResultValue = computed(() => {
        return textareaValue.value.split('\n').filter((v) => !isEmpty(v));
      });

      const handleConfirm = () => {
        const result = unref(getResultValue);
        if (isEmpty(result)) return;
        emit('change', result);
        changeVisible(false);
        textareaValue.value = '';
      };

      const handleReset = () => {
        textareaValue.value = '';
        emit('change', unref(getResultValue));
      };

      const handleCancel = (val: boolean) => {
        textareaValue.value = '';
        changeVisible(val);
      };

      const changeVisible = (val: boolean) => {
        emit('change-visible', val);
      };

      return {
        textareaValue,
        handleConfirm,
        handleReset,
        getResultValue,
        handleCancel,
      };
    },
  });
</script>
<style lang="less" scoped>
  .text-area__wrap {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 9;
    background: #fff;
    min-width: 260px;

    .ant-input:focus,
    .ant-input-focused {
      border-color: inherit;
      box-shadow: unset;
    }

    .text-area__foot {
      display: flex;
      justify-content: space-between;
      min-width: 100%;
      padding: 0.5em;
      border: 1px solid @mes-border-color;
      border-top: 0;
    }
  }
</style>
