<template>
  <PageWrapper>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleAdd"> 新增 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'operate'">
          <TableAction
            :actions="[
              {
                label: '编辑',
                onClick: handleEdit.bind(null, record),
              },
              {
                label: '删除',
                color: 'error',
                popConfirm: {
                  title: '是否确认删除？',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <AccountModal @register="registerModal" />
  </PageWrapper>
</template>
<script lang="ts" setup>
  import moment from 'moment'
  import { PageWrapper } from '/@/components/Page'
  import AccountModal from './components/AccountModal.vue'
  import { columns, searchFormSchema } from './components/data'
  import { useModal } from '/@/components/Modal'
  import { useMessage } from '/@/hooks/web/useMessage'
  const [registerModal, { openModal }] = useModal()
  import { BasicTable, useTable, TableAction } from '/@/components/Table'
  import { fetchAccountList, deleteAccount } from '/@/api/dashboard/accounting'
  const { createMessage } = useMessage()
  const [registerTable, { reload }] = useTable({
    showSearchHistory: true,
    rowKey: 'id',
    columns,
    canResize: true,
    loading: false,
    searchInline: false,
    formConfig: {
      labelWidth: 90,
      labelAlign: 'right',
      schemas: searchFormSchema,
      autoSubmitOnEnter: true,
    },
    actionColumn: {
      width: 175,
      title: '操作',
      dataIndex: 'operate',
      align: 'center',
    },
    beforeFetch: (params) => {
      if (params.create_date) {
        params.create_date = moment(params.create_date).format('YYYY-MM-DD')
      } else {
        params.create_date = ''
      }
      return params
    },
    api: fetchAccountList,
    autoAppendComCol: false,
    immediate: true,
    showIndexColumn: false,
    useSearchForm: true,
    showTableSetting: true,
    clearSelectOnPageChange: true,
    bordered: false,
  })

  const handleAdd = (record: Recordable) => {
    openModal(true, { payload: record, handler: reload, title: '新增' })
  }

  const handleEdit = (record: Recordable) => {
    openModal(true, { payload: record, handler: reload, title: '编辑' })
  }

  const handleDelete = async (record) => {
    console.log(record, 'record')
    await deleteAccount({ create_id: record.create_id })
    createMessage.success('操作成功')
    reload()
  }
</script>
<style lang="less" scoped>
  :deep(.vben-page-wrapper-content) {
    margin: 10px;
  }
</style>
