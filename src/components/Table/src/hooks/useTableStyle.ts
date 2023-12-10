import type { ComputedRef } from 'vue';
import type { BasicTableProps, TableCustomRecord } from '../types/table';
import { unref } from 'vue';
import { isFunction } from '/@/utils/is';

export function useTableStyle(propsRef: ComputedRef<BasicTableProps>, prefixCls: string) {
  function getRowClassName(record: TableCustomRecord, index: number) {
    const { striped, rowClassName, isTreeTable, childrenColumnName = 'children' } = unref(propsRef);
    const classNames: string[] = ['customer-table-row'];
    if (striped) {
      classNames.push((index || 0) % 2 === 1 ? `${prefixCls}-row__striped` : '');
    }
    if (rowClassName && isFunction(rowClassName)) {
      classNames.push(rowClassName(record, index));
    }
    if (isTreeTable && !(record[childrenColumnName]?.length > 0)) {
      classNames.push('without-children-row');
    }
    return classNames.filter((cls) => !!cls).join(' ');
  }

  return { getRowClassName };
}
