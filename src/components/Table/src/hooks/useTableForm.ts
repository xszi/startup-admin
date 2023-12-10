import type { ComputedRef, Slots } from 'vue';
import type { BasicTableProps, FetchParams } from '../types/table';
import { unref, computed } from 'vue';
import type { FormProps } from '/@/components/Form';
import { isFunction } from '/@/utils/is';

export function useTableForm(
  propsRef: ComputedRef<BasicTableProps>,
  slots: Slots,
  fetch: (opt?: FetchParams | undefined) => Promise<void>,
  _getLoading: ComputedRef<boolean | undefined>,
  clearSelectedRowKeys: () => void,
) {
  const getFormProps = computed((): Partial<FormProps> => {
    const { formConfig } = unref(propsRef);
    const { submitButtonOptions } = formConfig || {};
    return {
      isTableSearchForm: true,
      showAdvancedButton: true,
      labelWidth: 90,
      labelAlign: 'right',
      colon: true,
      ...Object.assign(
        {
          rowProps: {
            gutter: 10,
          },
        },
        formConfig,
      ),
      submitButtonOptions: { ...submitButtonOptions },
      compact: true,
      autoSubmitOnEnter: false, // 因为回车搜索，关闭原本的自动搜索
    };
  });

  const getFormSlotKeys: ComputedRef<string[]> = computed(() => {
    const keys = Object.keys(slots);
    return keys
      .map((item) => (item.startsWith('form-') ? item : null))
      .filter((item) => !!item) as string[];
  });

  function replaceFormSlotKey(key: string) {
    if (!key) return '';
    return key?.replace?.(/form\-/, '') ?? '';
  }

  async function handleSearchInfoChange(info: Recordable) {
    const { handleSearchInfoFn } = unref(propsRef);
    if (handleSearchInfoFn && isFunction(handleSearchInfoFn)) {
      info = handleSearchInfoFn(info) || info;
    }
    await fetch({ searchInfo: info, page: 1 });
    clearSelectedRowKeys && clearSelectedRowKeys();
  }

  return {
    getFormProps,
    replaceFormSlotKey,
    getFormSlotKeys,
    handleSearchInfoChange,
  };
}
