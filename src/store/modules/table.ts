import { defineStore } from 'pinia'
import { store } from '/@/store'

import { TableActionType } from '/@/components/Table'
import { ComputedRef, Ref } from 'vue'

type Instance = TableActionType & {
  wrapRef: Ref<Nullable<HTMLElement>>
}

type RetInstance = Instance & {
  getBindValues: ComputedRef<Recordable>
}

type TableState = {
  tableInstance: Nullable<RetInstance>
}

export const useTableStore = defineStore({
  id: 'table-function',
  state: (): TableState => ({
    tableInstance: null,
  }),
  getters: {
    getTableInstance(): Nullable<RetInstance> {
      return this.tableInstance as Nullable<RetInstance>
    },
  },
  actions: {
    setTableInstance(instance: RetInstance) {
      this.tableInstance = instance
      this.registerAutoSearch()
    },
    clearTableInstance(): void {
      this.unregisterAutoSearch()
      this.tableInstance = null
    },
    handleAutoSearch(evt) {
      if (this.tableInstance && evt.keyCode === 13) {
        this.tableInstance.reload()
        this.clearTableInstance()
      }
    },
    registerAutoSearch() {
      document.addEventListener('keyup', this.handleAutoSearch)
    },
    unregisterAutoSearch() {
      document.removeEventListener('keyup', this.handleAutoSearch)
    },
  },
})

export function useTableStoreWithOut() {
  return useTableStore(store)
}
