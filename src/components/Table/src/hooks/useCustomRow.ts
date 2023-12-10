import type { ComputedRef } from 'vue';
import type { BasicTableProps } from '../types/table';
import { unref } from 'vue';
import { ROW_KEY } from '../const';
import { isString, isFunction } from '/@/utils/is';

interface Options {
  setSelectedRowKeys: (keys: string[]) => void;
  getSelectRowKeys: () => string[];
  clearSelectedRowKeys: () => void;
  emit: EmitType;
  getAutoCreateKey: ComputedRef<boolean | undefined>;
}

function getKey(
  record: Recordable,
  rowKey: string | ((record: Record<string, any>) => string) | undefined,
  autoCreateKey?: boolean,
) {
  if (!rowKey || autoCreateKey) {
    return record[ROW_KEY];
  }
  if (isString(rowKey)) {
    return record[rowKey];
  }
  if (isFunction(rowKey)) {
    return record[rowKey(record)];
  }
  return null;
}

export function useCustomRow(
  propsRef: ComputedRef<BasicTableProps>,
  { setSelectedRowKeys, getSelectRowKeys, getAutoCreateKey, clearSelectedRowKeys, emit }: Options,
) {
  let highlightRow: Nullable<HTMLElement> = null;
  const HighlightRowClassName = 'custom-row_highlight';
  const customRow = (record: Recordable, index: number) => {
    return {
      onClick: (e: Event) => {
        e?.stopPropagation();
        function handleClick() {
          const tr: HTMLElement = (e as MouseEvent)
            .composedPath?.()
            .find((dom: HTMLElement) => dom.tagName === 'TR') as HTMLElement;
          // 需要异步操作，因为ant-table对rowClass返回的类名重新赋值给dom，同步操作完类名会被覆盖
          setTimeout(() => {
            if (tr) {
              tr.classList.add(HighlightRowClassName);
              if (highlightRow && highlightRow !== tr) {
                highlightRow.classList.remove(HighlightRowClassName);
              }
              highlightRow = tr;
            }
          });
          const { rowSelection, rowKey, clickToRowSelect } = unref(propsRef);
          if (!rowSelection || !clickToRowSelect) return;
          const keys = getSelectRowKeys();
          const key = getKey(record, rowKey, unref(getAutoCreateKey));
          if (!key) return;
          const isCheckbox = rowSelection.type === 'checkbox';
          if (isCheckbox) {
            // 找到tr
            if (!tr) return;
            // 找到Checkbox，检查是否为disabled
            const checkBox = tr.querySelector('input[type=checkbox]');
            if (!checkBox || checkBox.hasAttribute('disabled')) return;
            if (!keys.includes(key)) {
              setSelectedRowKeys([...keys, key]);
              return;
            }
            const keyIndex = keys.findIndex((item) => item === key);
            keys.splice(keyIndex, 1);
            setSelectedRowKeys(keys);
            return;
          }

          const isRadio = rowSelection.type === 'radio';
          if (isRadio) {
            const radio = tr.querySelector('input[type=radio]');
            if (!radio || radio.hasAttribute('disabled')) return;
            if (!keys.includes(key)) {
              if (keys.length) {
                clearSelectedRowKeys();
              }
              setSelectedRowKeys([key]);
              return;
            }
            clearSelectedRowKeys();
          }
        }
        handleClick();
        emit('row-click', record, index, e);
      },
      onDblclick: (event: Event) => {
        emit('row-dbClick', record, index, event);
      },
      onContextmenu: (event: Event) => {
        emit('row-contextmenu', record, index, event);
      },
      onMouseenter: (event: Event) => {
        emit('row-mouseenter', record, index, event);
      },
      onMouseleave: (event: Event) => {
        emit('row-mouseleave', record, index, event);
      },
    };
  };

  return {
    customRow,
  };
}
