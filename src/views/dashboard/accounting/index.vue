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
                label: '关闭',
                ifShow: +record.status !== 3, // 2已确认 3已关闭
                auth: 'informationExpress:push-record:btn:confirmClose',
                onClick: handleClose.bind(null, record),
              },
              {
                label: '编辑',
                ifShow: +record.status !== 2 && +record.status !== 3,
                auth: 'informationExpress:push-record:btn:detail',
                onClick: handleEdit.bind(null, record),
              },
              {
                label: '详情',
                auth: 'informationExpress:push-record:btn:detail',
                onClick: handleViewDetail.bind(null, record),
              },
              {
                label: '删除',
                color: 'error',
                auth: 'informationExpress:push-record:btn:delete',
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
  import { ref } from 'vue'
  import { PageWrapper } from '/@/components/Page'
  import AccountModal from './components/AccountModal.vue'
  import { columns } from './components/data'
  import { useModal } from '/@/components/Modal'
  const [registerModal, { openModal }] = useModal()
  import { BasicTable, useTable, TableAction } from '/@/components/Table'
  import { fetchAccountList } from '/@/api/dashboard/accounting'
  const [registerTable, { reload, setTableData }] = useTable({
    showSearchHistory: true,
    rowKey: 'id',
    columns,
    canResize: true,
    loading: false,
    searchInline: false,
    formConfig: {
      labelWidth: 90,
      labelAlign: 'right',
      // schemas: searchFormSchema,
      autoSubmitOnEnter: true,
      fieldMapToTime: [
        ['createTimeRange', ['createStartTime', 'createEndTime'], void 0, false],
        ['stopTimeRange', ['stopStartTime', 'stopEndTime'], void 0, false],
      ],
    },
    actionColumn: {
      width: 175,
      title: '操作',
      dataIndex: 'operate',
      align: 'center',
    },
    api: fetchAccountList,
    // dataSource: [],
    autoAppendComCol: false,
    immediate: true,
    showIndexColumn: false,
    useSearchForm: true,
    showTableSetting: true,
    clearSelectOnPageChange: true,
    bordered: false,
  })

  const loading = ref(true)
  const handleAdd = (record: Recordable) => {
    openModal(true, { payload: record, handler: reload, title: '新增' })
  }

  const handleEdit = (record: Recordable) => {
    openModal(true, { payload: record, handler: reload, title: '编辑' })
  }
  const handleClose = () => {}
  const handleDelete = () => {}
  const handleViewDetail = () => {}

  setTimeout(() => {
    loading.value = false
    setTableData([
      {
        time: '1',
        type: 'food',
        number: '10',
        remark: 'hahha',
      },
    ])
  }, 1500)
</script>
