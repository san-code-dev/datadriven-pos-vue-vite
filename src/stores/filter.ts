import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface FilterItem {
    field: string
    operator: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'between'
    value: any
    valueTo?: any
}

export const useFilterStore = defineStore('filter', () => {
    const activeFilters = ref<Record<string, FilterItem[]>>({})
    const searchQueries = ref<Record<string, string>>({})

    const setFilters = (tabId: string, filters: FilterItem[]) => {
        activeFilters.value[tabId] = filters
    }

    const clearFilters = (tabId: string) => {
        activeFilters.value[tabId] = []
    }

    const getFiltersByTab = (tabId: string): FilterItem[] => {
        return activeFilters.value[tabId] || []
    }

    return {
        activeFilters,
        searchQueries,
        setFilters,
        clearFilters,
        getFiltersByTab
    }
}, {
    persist: true // <-- Cukup tambahkan flag ini di parameter ketiga
})