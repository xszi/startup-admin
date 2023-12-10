import type { BasicTableProps, TableRowSelection, BasicColumn } from '../types/table';
import { Ref, ComputedRef, ref, onMounted, computed, unref, nextTick, watch } from 'vue';
import { getViewportOffset } from '/@/utils/domUtils';
import { isBoolean } from '/@/utils/is';
import { useWindowSizeFn } from '/@/hooks/event/useWindowSizeFn';
import { useModalContext } from '/@/components/Modal';
import { onMountedOrActivated } from '/@/hooks/core/onMountedOrActivated';
import { useDebounceFn, useElementBounding } from '@vueuse/core';

export function useTableScroll(
  propsRef: ComputedRef<BasicTableProps>,
  tableElRef: Ref<ComponentRef>,
  columnsRef: ComputedRef<BasicColumn[]>,
  rowSelectionRef: ComputedRef<TableRowSelection | null>,
  getDataSourceRef: ComputedRef<Recordable[]>,
  wrapRef: Ref<HTMLElement | null>,
  formRef: Ref<ComponentRef>,
  isShowFooterSlot: ComputedRef<boolean>,
) {
  const tableHeightRef: Ref<Nullable<number | string>> = ref(167);
  const modalFn = useModalContext();

  // Greater than animation time 280
  const debounceRedoHeight = useDebounceFn(redoHeight, 100);

  const getCanResize = computed(() => {
    const { canResize, scroll } = unref(propsRef);
    return canResize && !(scroll || {}).y;
  });

  watch(
    () => [unref(getCanResize), , unref(getDataSourceRef)?.length],
    () => {
      debounceRedoHeight();
    },
    {
      flush: 'post',
    },
  );

  onMounted(() => {
    if (unref(wrapRef) && unref(propsRef).isCanResizeParent) return;

    // 表格的位置发生变化时，需要重新计算表格的高度
    const { top, left } = useElementBounding(tableElRef.value?.$el);
    watch([() => top.value, () => left.value, () => modalFn?.fullScreenRef], () => {
      setTimeout(() => {
        calcTableHeight();
      }, 200);
    });
  });

  function redoHeight() {
    nextTick(() => {
      calcTableHeight();
    });
  }

  function setHeight(height: number) {
    tableHeightRef.value = height;
    //  Solve the problem of modal adaptive height calculation when the form is placed in the modal
    modalFn?.redoModalHeight?.();
  }

  // No need to repeat queries
  let paginationEl: HTMLElement | null;
  // let footerEl: HTMLElement | null;
  let bodyEl: HTMLElement | null;

  async function calcTableHeight() {
    const { resizeHeightOffset, pagination, maxHeight, isCanResizeParent, useSearchForm } =
      unref(propsRef);
    const tableData = unref(getDataSourceRef);

    const table = unref(tableElRef);
    if (!table) return;

    const tableEl: Element = table.$el;
    if (!tableEl) return;

    if (!bodyEl) {
      bodyEl = tableEl.querySelector('.ant-table-body');
      if (!bodyEl) return;
    }

    bodyEl!.style.height = 'unset';
    if (!unref(getCanResize) || (!unref(tableData) && !unref(isCanResizeParent))) {
      return;
    }

    await nextTick();
    // Add a delay to get the correct bottomIncludeBody paginationHeight footerHeight headerHeight

    const headEl = tableEl.querySelector('.ant-table-thead ');
    if (!headEl) return;

    // Table height from bottom height-custom offset
    let paddingHeight = 11;
    // Pager height
    let paginationHeight = 0;
    // 因为自定义分页器，分页器的高度用footer插槽的高度
    if (isShowFooterSlot.value) {
      paginationEl = tableEl.querySelector('.ant-table-footer') as HTMLElement;
      if (paginationEl) {
        const offsetHeight = paginationEl.offsetHeight;
        paginationHeight += offsetHeight || 0;
      } else {
        // TODO First fix 24
        paginationHeight += 24;
      }
    } else {
      paginationHeight = 0;
    }
    // table自带分页器隐藏，底部现在用来放分页器，所以不用单独计算分页器高度
    const footerHeight = 0;
    let headerHeight = 0;
    // ant-table-container设置了上下border，导致高度算多了，要扣掉
    // const borderSpace = 3;
    if (headEl) {
      headerHeight = (headEl as HTMLElement).offsetHeight;
    }
    let bottomIncludeBody = 0;
    let OFFSET = 10; // 用来添加偏移量
    if (unref(wrapRef) && isCanResizeParent) {
      const tablePadding = 0;
      // const formMargin = 16;
      const formMargin = 0;
      let paginationMargin = 10;
      const wrapHeight = unref(wrapRef)?.offsetHeight ?? 0;

      let formHeight = unref(formRef)?.$el.offsetHeight ?? 0;
      if (formHeight) {
        formHeight += formMargin;
      }
      if (isBoolean(pagination) && !pagination) {
        paginationMargin = 0;
      }
      if (isBoolean(useSearchForm) && !useSearchForm) {
        paddingHeight = 0;
      }

      const headerCellHeight =
        (tableEl.querySelector('.ant-table-title') as HTMLElement)?.offsetHeight ?? 0;
      bottomIncludeBody =
        wrapHeight - formHeight - headerCellHeight - tablePadding - paginationMargin;
    } else if (unref(modalFn.wrapperRef)) {
      const modalEl = unref(modalFn.wrapperRef)?.$el;
      const { top } = getViewportOffset(modalEl!);
      const { top: headTop } = getViewportOffset(headEl);

      bottomIncludeBody = unref(modalFn.heightRef) - (headTop - top);
      if (modalFn?.fullScreenRef) {
        OFFSET = 0;
      }
    } else {
      // Table height from bottom
      bottomIncludeBody = getViewportOffset(headEl).bottomIncludeBody;
    }

    let height =
      bottomIncludeBody -
      (resizeHeightOffset || 0) -
      paddingHeight -
      paginationHeight -
      footerHeight -
      headerHeight -
      OFFSET;
    height = (height > maxHeight! ? (maxHeight as number) : height) ?? height;

    setHeight(height);
    bodyEl!.style.height = `${height}px`;

    nextTick(() => {
      hasScrollBarClass(tableEl, bodyEl);
    });
  }
  useWindowSizeFn(calcTableHeight, 280);
  onMountedOrActivated(() => {
    calcTableHeight();
    nextTick(() => {
      debounceRedoHeight();
    });
  });

  const hasScrollBarClass = (tableEl, bodyEl) => {
    const hasScrollBarY = bodyEl.scrollHeight > bodyEl.clientHeight;
    const hasScrollBarX = bodyEl.scrollWidth > bodyEl.clientWidth;
    if (hasScrollBarY) {
      tableEl.classList.contains('hide-scrollbar-y') &&
        tableEl.classList.remove('hide-scrollbar-y');
    } else {
      !tableEl.classList.contains('hide-scrollbar-y') && tableEl.classList.add('hide-scrollbar-y');
    }

    if (hasScrollBarX) {
      tableEl.classList.contains('hide-scrollbar-x') &&
        tableEl.classList.remove('hide-scrollbar-x');
    } else {
      !tableEl.classList.contains('hide-scrollbar-x') && tableEl.classList.add('hide-scrollbar-x');
    }
  };

  const getScrollX = computed(() => {
    let width = 0;
    if (unref(rowSelectionRef)) {
      width += 60;
    }

    // TODO props ?? 0;
    const NORMAL_WIDTH = 150;

    const columns = unref(columnsRef).filter((item) => !item.defaultHidden);
    columns.forEach((item) => {
      width += Number.parseFloat(item.width as string) || 0;
    });
    const unsetWidthColumns = columns.filter((item) => !Reflect.has(item, 'width'));

    const len = unsetWidthColumns.length;
    if (len !== 0) {
      width += len * NORMAL_WIDTH;
    }

    const table = unref(tableElRef);
    const tableWidth = table?.$el?.offsetWidth ?? 0;
    return tableWidth > width ? '100%' : width;
  });

  const getScrollRef = computed(() => {
    const tableHeight = unref(tableHeightRef);
    const { canResize, scroll } = unref(propsRef);
    return {
      x: unref(getScrollX),
      y: canResize ? tableHeight : null,
      scrollToFirstRowOnChange: false,
      ...scroll,
    };
  });

  return { getScrollRef, redoHeight };
}
