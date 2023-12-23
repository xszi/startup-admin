<template>
  <BasicModal
    v-bind="$attrs"
    showFooter
    :title="modalTitle"
    width="900px"
    :min-height="500"
    destroyOnClose
    @register="register"
    @ok="handleSubmit"
    @cancel="handleClose"
    @close="handleClose"
  >
    <BasicForm
      ref="form"
      class="wrap"
      :model="formModel"
      :labelWidth="85"
      :baseColProps="{ span: 24 }"
      :rowProps="{ gutter: 15 }"
      :schemas="accountSchema"
      :showActionButtonGroup="false"
      :actionColOptions="{
        span: 23,
      }"
      @register="registerBasicForm"
    />
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { BasicForm, useForm, FormActionType } from '/@/components/Form'
  import { BasicModal, useModalInner } from '/@/components/Modal'
  import { accountSchema } from './data'
  import { useMessage } from '/@/hooks/web/useMessage'
  import { addAccount } from '/@/api/dashboard/accounting'

  const [
    registerBasicForm,
    { clearValidate: clearBasicValidate, setFieldsValue, validate: basicValidate, updateSchema },
  ] = useForm({
    showActionButtonGroup: false,
  })

  let reloadTable: Nullable<Function> = null
  const form = ref<Nullable<FormActionType>>(null)
  const modalTitle = ref()
  const { createMessage } = useMessage()

  const formModel = ref({
    create_date: '',
    expense_type: '',
    expense_amount: '',
    remark: '',
  })

  const initViewModel = async (payload) => {
    if (!payload) {
      formModel.value = {
        create_date: '',
        expense_type: '',
        expense_amount: '',
        remark: '',
      }
    }
  }

  const [register, { closeModal, setModalProps, changeOkLoading }] = useModalInner(
    async ({ payload, handler, title }) => {
      modalTitle.value = title
      form.value?.resetFields()
      //   formModel.value.id = payload.id
      // await initUserOptions();
      await initViewModel(payload)

      reloadTable = handler
    },
  )

  // 保存
  const handleSubmit = async () => {
    try {
      changeOkLoading(true)
      const params: any = {
        ...form.value?.getFieldsValue(),
      }
      const res = await addAccount(params)
      console.log(res, 'xxxx')
      createMessage.success('操作成功')
      await reloadTable?.()
      closeModal()
    } catch (err) {
      createMessage.error(err instanceof Error ? err.message : '数据不完整')
    } finally {
      // 最后把确定按钮loading效果去除
      setModalProps({ confirmLoading: false })
      changeOkLoading(false)
    }
  }

  const handleClose = async () => {
    await reloadTable?.()
    closeModal()
  }
</script>
<style lang="less" scoped>
  .wrap {
    width: 97%;
    margin: 0 auto;
  }
</style>
