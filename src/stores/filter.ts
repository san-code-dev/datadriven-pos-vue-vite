import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface FilterItem {
    field: string
    operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'between'
    value: any
    valueTo?: any
}

export const useFilterStore = defineStore('filter', () => {
    // STATE
    const activeFilters = ref<Record<string, FilterItem[]>>({})
    const searchQueries = ref<Record<string, string>>({})
    // Menggunakan Record<string, boolean> agar TypeScript tahu key berupa string dan value berupa boolean
    const filterCollapseStates = ref<Record<string, boolean>>({})

    // ACTIONS
    const setFilters = (tabId: string, filters: FilterItem[]) => {
        activeFilters.value[tabId] = filters
    }

    const clearFilters = (tabId: string) => {
        activeFilters.value[tabId] = []
    }

    const getFiltersByTab = (tabId: string): FilterItem[] => {
        return activeFilters.value[tabId] || []
    }

    // Perbaikan: Ubah ke format standard arrow function di Setup Store & gunakan .value
    const setCollapseState = (tabId: string, isExpanded: boolean) => {
        filterCollapseStates.value[tabId] = isExpanded
    }

    // Pastikan semua state dan function yang ingin dipakai di komponen di-return di sini
    return {
        activeFilters,
        searchQueries,
        filterCollapseStates,
        setFilters,
        clearFilters,
        getFiltersByTab,
        setCollapseState
    }
}, {
    persist: {
        storage: sessionStorage
    }
})