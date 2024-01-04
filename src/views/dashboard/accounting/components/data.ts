import { FormSchema } from '/@/components/Form'
import { BasicColumn } from '/@/components/Table'
// import moment from 'moment';
// const dataRange = {
//   今天: [moment().startOf('day'), moment()],
//   昨天: [moment().startOf('day').subtract(1, 'days'), moment().startOf('day').subtract(1, 'days')],
//   最近一周: [moment().startOf('day').subtract(1, 'weeks'), moment()],
//   最近两周: [moment().startOf('day').subtract(2, 'weeks'), moment()],
//   最近1个月: [moment().startOf('day').subtract(1, 'months'), moment()],
//   最近3个月: [moment().startOf('day').subtract(3, 'months'), moment()],
//   最近半年: [moment().startOf('day').subtract(6, 'months'), moment()],
// };

// 表格列
export const columns: BasicColumn[] = [
  {
    title: '时间',
    dataIndex: 'create_date',
    fixed: 'left',
    width: 200,
  },
  {
    title: '消费类型',
    dataIndex: 'expense_type',
    width: 150,
  },
  {
    title: '消费金额',
    dataIndex: 'expense_amount',
    width: 150,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 150,
  },
]

export const accountSchema: FormSchema[] = [
  {
    field: 'create_date',
    label: '时间',
    colProps: { span: 12 },
    component: 'DatePicker',
  },
  {
    field: 'expense_type',
    label: '消费类型',
    colProps: { span: 12 },
    component: 'Input',
  },
  {
    field: 'expense_amount',
    label: '消费金额',
    colProps: { span: 12 },
    component: 'Input',
  },
  {
    field: 'remark',
    label: '备注',
    colProps: { span: 12 },
    component: 'Input',
  },
]
