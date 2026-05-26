import { defineStore } from 'pinia'

export const useFilterStore = defineStore('filterStore', {
  state: () => ({
    currentSchema: [],
    // Disimpan dalam bentuk object key agar reaktif per kolom
    // Contoh: { nmProduct: { operator: 'contains', value: 'baju' } }
    headerFilters: {},
    pagination: {
      page: 1,
      limit: 10,
      totalData: 0,
      totalPages: 1
    },
    isLoading: false
  }),

  actions: {
    setSchema(schema) {
      this.currentSchema = schema
      // Inisialisasi object filter kosong untuk setiap key di schema
      const newFilters = {}
      schema.forEach(field => {
        newFilters[field.key] = {
          operator: this.getDefaultOperator(field.type),
          value: ''
        }
      })
      this.headerFilters = newFilters
      this.pagination.page = 1
    },

    getDefaultOperator(type) {
      if (['text', 'email'].includes(type)) return 'contains'
      if (['number', 'currency', 'relation'].includes(type)) return 'equals'
      return 'equals'
    },

    getAvailableOperators(type) {
      if (['text', 'email'].includes(type)) {
        return [
          { value: 'contains', label: '⌕' }, // Icon text singkat agar compact
          { value: 'equals', label: '=' }
        ]
      }
      if (['number', 'currency', 'date'].includes(type)) {
        return [
          { value: 'equals', label: '=' },
          { value: 'gte', label: '≥' },
          { value: 'lte', label: '≤' }
        ]
      }
      return [{ value: 'equals', label: '=' }]
    }
  },

  getters: {
    // Parser untuk mengubah object headerFilters menjadi format array JSON yang siap dikirim ke Prisma
    apiPayload: (state) => {
      const activeFilters = []

      Object.keys(state.headerFilters).forEach(key => {
        const item = state.headerFilters[key]
        // Hanya kirim filter yang memiliki value (tidak kosong)
        if (item.value !== undefined && item.value !== null && item.value !== '') {
          const fieldMeta = state.currentSchema.find(s => s.key === key)
          activeFilters.push({
            field: key,
            operator: item.operator,
            value: item.value,
            type: fieldMeta ? fieldMeta.type : 'text',
            relation: fieldMeta?.type === 'relation' ? fieldMeta.relation : null
          })
        }
      })

      return {
        page: state.pagination.page,
        limit: state.pagination.limit,
        filters: activeFilters
      }
    }
  }
})