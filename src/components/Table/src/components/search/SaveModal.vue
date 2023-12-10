<template>
  <BasicModal
    v-bind="$attrs"
    showFooter
    title="保存自定义检索项"
    width="600px"
    :destroyOnClose="true"
    @register="registerModal"
    @ok="handleSubmit"
  >
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script setup lang="ts">
  import { ref, unref } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { addSearch } from '/@/api/base';
  const emit = defineEmits(['success', 'register']);
  const modalData = ref();
  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    modalData.value = data;
    resetFields();
    setModalProps({ confirmLoading: false });
  });
  const [registerForm, { resetFields, validate }] = useForm({
    labelWidth: 110,
    baseColProps: {
      span: 24,
    },
    schemas: [
      {
        field: 'label',
        label: '检索项名称',
        component: 'Input',
        componentProps: {
          placeholder: '请输入检索项名称，在2~20个字符之间',
          maxlength: 20,
        },
        rules: [
          {
            required: true,
            validator: async (_, value) => {
              if (!value) {
                return Promise.reject('请输入检索项名称');
              }
              if (value.length < 2 || value.length > 20) {
                return Promise.reject('检索项名称，在2~20个字符之间');
              }
              return Promise.resolve();
            },
            trigger: 'change',
          },
        ],
      },
    ],
    showActionButtonGroup: false,
  });
  async function handleSubmit() {
    try {
      const values = await validate();
      await addSearch({
        ...unref(modalData),
        ...values,
      });
      setModalProps({ confirmLoading: true });

      closeModal();
      emit('success');
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>
