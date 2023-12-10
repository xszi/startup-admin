import { BasicColumn } from '/@/components/Table';
import { Tooltip } from 'ant-design-vue';
export const createOrUpdateCol: BasicColumn[] = [
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 160,
    align: 'center',
  },
  {
    title: '更新人',
    dataIndex: 'updateByName',
    width: 100,
    defaultHidden: true,
    align: 'left',
    customRender: ({ text, record }) => {
      return (
        <Tooltip title={record.updateBy} placement="top" arrowPointAtCenter={true}>
          {text}
        </Tooltip>
      );
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 160,
    defaultHidden: true,
    align: 'center',
  },
  {
    title: '创建人',
    dataIndex: 'createByName',
    align: 'left',
    defaultHidden: true,
    width: 100,
    customRender: ({ text, record }) => {
      return (
        <Tooltip title={record.createBy} placement="top" arrowPointAtCenter={true}>
          {text}
        </Tooltip>
      );
    },
  },
];
