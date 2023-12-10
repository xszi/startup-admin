import { ComputedRef, nextTick, Slots } from 'vue';
import type { BasicTableProps, InnerHandlers } from '../types/table';
import { unref, computed, h } from 'vue';
import TableHeader from '../components/TableHeader.vue';
import type { FormProps } from '/@/components/Form';
import { isString } from '/@/utils/is';
import { getSlot } from '/@/utils/helper/tsxHelper';
import { BasicForm } from '/@/components/Form';

export function useTableHeader(
  propsRef: ComputedRef<BasicTableProps>,
  slots: Slots,
  handlers: InnerHandlers,
  searchItemProps: ComputedRef<any>,
  formProps: ComputedRef<Partial<FormProps>>,
  handleSearch: (info: Recordable<any>) => void,
) {
  const getHeaderProps = computed((): Recordable => {
    const {
      title,
      showTableSetting,
      titleHelpMessage,
      tableSetting,
      showSearchHistory,
      searchInline,
      simpleSearch,
    } = unref(propsRef);
    if (searchInline) {
      return {};
    }

    const hideTitle = !slots.tableTitle && !title && !slots.toolbar && !showTableSetting;
    if (hideTitle && !isString(title)) {
      return {};
    }

    const renderTableToolbar = () => {
      if (!simpleSearch) {
        return slots.toolbar
          ? {
              toolbar: () => getSlot(slots, 'toolbar'),
            }
          : {};
      }
      const formConfig = unref(formProps);
      if (simpleSearch && formConfig) {
        let { schemas = [] } = formConfig;
        if (!Array.isArray(schemas)) {
          return {};
        }
        if (schemas.length > 1) {
          schemas = schemas.slice(0, 1);
        }
        if (schemas[0].colProps) {
          Object.assign(schemas[0].colProps, {
            span: 24,
          });
        }
        const onChange = (e) => {
          nextTick(() => {
            handleSearch({ [schemas[0].field]: e });
          });
        };
        if (typeof schemas[0].componentProps !== 'function') {
          if (schemas[0].componentProps) {
            (schemas[0].componentProps as any).onChange = onChange;
          }
        } else {
          const propsFun = schemas[0].componentProps;
          schemas[0].componentProps = (...args) => {
            const config = propsFun(...args);
            return {
              ...config,
              onChange,
            };
          };
        }

        formConfig.showActionButtonGroup = false;
        formConfig.autoSubmitOnEnter = true;
        formConfig.schemas = schemas;
      }
      return {
        toolbar: () => [
          h(BasicForm, {
            ...unref(formProps),
            showActionButtonGroup: false,
            style: { width: isString(simpleSearch) ? simpleSearch : '300px' },
          }),
          slots.toolbar ? getSlot(slots, 'toolbar') : null,
        ],
      };
    };

    return {
      title: hideTitle
        ? null
        : () =>
            h(
              TableHeader,
              {
                title,
                titleHelpMessage,
                showTableSetting,
                tableSetting,
                searchItemProps,
                hasHistorySearch: showSearchHistory,
                onColumnsChange: handlers.onColumnsChange,
              } as Recordable,
              {
                ...renderTableToolbar(),
                ...(slots.tableTitle
                  ? {
                      tableTitle: () => getSlot(slots, 'tableTitle'),
                    }
                  : {}),
                ...(slots.headerTop
                  ? {
                      headerTop: () => getSlot(slots, 'headerTop'),
                    }
                  : {}),
                ...(slots.headerBottom
                  ? {
                      headerBottom: () => getSlot(slots, 'headerBottom'),
                    }
                  : {}),
              },
            ),
    };
  });
  return { getHeaderProps };
}
