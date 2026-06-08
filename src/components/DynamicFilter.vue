<template>
    <div ref="filterContainerRef"
        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 mb-4 transition-colors outline-none focus:ring-2 focus:ring-emerald-500/50 select-none"
        tabindex="1" @keydown="handleGlobalComponentKey" @mousedown="handleContainerMouseDown">

        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <h3
                    class="text-xs font-bold uppercase mb-0 tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center h-5">
                    Filter
                </h3>
                <span
                    class="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded shadow-sm font-bold tracking-wide inline-flex items-center justify-center h-5 box-border">
                    Alt + F
                </span>
            </div>
            <div class="flex space-x-2 text-xs">
                <button @click="addFilterRow"
                    class="px-3 py-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <span>+ Aturan</span> <kbd class="opacity-60 text-[10px]">[Ins]</kbd>
                </button>
                <button v-if="localFilters.length > 0" @click="applyFilters"
                    class="px-3 py-1.5 font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-all flex items-center gap-1 focus:ring-2 focus:ring-emerald-400 focus:outline-none">
                    <span>Terapkan</span> <kbd class="opacity-60 text-[10px]">[Enter]</kbd>
                </button>
                <button v-if="localFilters.length > 0" @click="resetFilters"
                    class="px-3 py-1.5 font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all focus:ring-2 focus:ring-slate-400 focus:outline-none">
                    Reset
                </button>
            </div>
        </div>

        <div v-if="localFilters.length === 0"
            class="text-center py-5 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            Belum ada filter aktif. Tekan tombol atau <kbd
                class="px-1 bg-slate-100 dark:bg-slate-700 rounded shadow">Insert</kbd> untuk menyaring data.
        </div>

        <div class="space-y-3">
            <div v-for="(item, index) in localFilters" :key="index" :ref="el => { if (el) rowRefs[index] = el }"
                class="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 transition-all focus-within:border-emerald-500/40">

                <div class="relative flex items-center h-full">
                    <select v-model="item.field" @change="onFieldChange(index)"
                        class="filter-input data-field text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-2.5 pr-8 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-none min-w-[140px]">
                        <option value="" disabled>-- Pilih Kolom --</option>
                        <option v-for="field in allowedSchema" :key="field.key" :value="field.key">
                            {{ field.label }}
                        </option>
                    </select>
                    <div
                        class="absolute right-2.5 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center justify-center">
                        <Icon icon="heroicons:chevron-down-20-solid" class="w-4 h-4" />
                    </div>
                </div>

                <div class="relative flex items-center h-full">
                    <select v-model="item.operator"
                        class="filter-input data-operator text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-2.5 pr-8 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-none min-w-[110px]">
                        <option v-for="op in getAvailableOperators(item.field)" :key="op.value" :value="op.value">
                            {{ op.label }}
                        </option>
                    </select>
                    <div
                        class="absolute right-2.5 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center justify-center">
                        <Icon icon="heroicons:chevron-down-20-solid" class="w-4 h-4" />
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <input v-if="item.operator !== 'between'" v-model="item.value" :type="getInputType(item.field)"
                        placeholder="Ketik nilai..."
                        class="filter-input data-val text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />

                    <template v-if="item.operator === 'between'">
                        <input v-model="item.value" :type="getInputType(item.field)" placeholder="Min"
                            class="filter-input data-val-min w-24 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                        <span class="text-xs text-slate-400">s/d</span>
                        <input v-model="item.valueTo" :type="getInputType(item.field)" placeholder="Max"
                            class="filter-input data-val-max w-24 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </template>
                </div>

                <button @click="removeFilterRow(index)"
                    class="ml-auto p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 flex items-center justify-center"
                    tabindex="-1" title="Hapus Aturan (Delete)">
                    <Icon icon="heroicons:x-mark-20-solid" class="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useFilterStore } from '@/stores/filter'

const props = defineProps({
    schema: { type: Array, required: true },
    tabId: { type: String, required: true }
})

const emit = defineEmits(['filter-changed', 'escape-filter'])

const filterStore = useFilterStore()
const localFilters = ref([])
const filterContainerRef = ref(null)
const rowRefs = ref([])

const allowedSchema = computed(() => {
    return props.schema.filter(f => f.type !== 'json' && f.key !== 'action')
})

watch(() => props.tabId, (newTabId) => {
    localFilters.value = JSON.parse(JSON.stringify(filterStore.getFiltersByTab(newTabId)))
}, { immediate: true })


const getFieldConfig = (fieldKey) => props.schema.find(f => f.key === fieldKey)

const getAvailableOperators = (fieldKey) => {
    const config = getFieldConfig(fieldKey)
    if (!config) return [{ value: 'equals', label: '=' }]

    if (['number', 'currency'].includes(config.type)) {
        return [
            { value: 'equals', label: '=' },
            { value: 'greater_than', label: '>' },
            { value: 'less_than', label: '<' },
            { value: 'between', label: 'Rentang Angka' }
        ]
    }
    if (config.type === 'date') {
        return [
            { value: 'equals', label: 'Sama Dengan' },
            { value: 'between', label: 'Rentang Tanggal' }
        ]
    }
    return [
        { value: 'contains', label: 'Mengandung kata' },
        { value: 'equals', label: 'Tepat sama' }
    ]
}

const getInputType = (fieldKey) => {
    const config = getFieldConfig(fieldKey)
    if (!config) return 'text'
    if (['number', 'currency'].includes(config.type)) return 'number'
    if (config.type === 'date') return 'date'
    return 'text'
}

const handleContainerMouseDown = (e) => {
    if (e.target.closest('.filter-input') || e.target.closest('button')) return
    nextTick(() => {
        filterContainerRef.value?.focus()
    })
}

const addFilterRow = async () => {
    if (allowedSchema.value.length > 0) {
        const firstField = allowedSchema.value[0]
        localFilters.value.push({
            field: firstField.key,
            operator: ['number', 'currency'].includes(firstField.type) ? 'equals' : 'contains',
            value: '',
            valueTo: ''
        })
        await nextTick()
        focusInputAtRow(localFilters.value.length - 1, 0)
    }
}

const onFieldChange = (index) => {
    const item = localFilters.value[index]
    const ops = getAvailableOperators(item.field)
    item.operator = ops[0].value
    item.value = ''
    item.valueTo = ''
}

const removeFilterRow = async (index) => {
    localFilters.value.splice(index, 1)
    rowRefs.value.splice(index, 1)

    await nextTick()
    if (localFilters.value.length > 0) {
        const nextFocusIndex = index === 0 ? 0 : index - 1
        focusInputAtRow(nextFocusIndex, 0)
    } else {
        filterContainerRef.value?.focus()
    }
}

const handleSelectEnter = (targetElement) => {
    const rowEl = targetElement.closest('[ref]')
    if (!rowEl) return

    const inputsInRow = Array.from(rowEl.querySelectorAll('.filter-input'))
    const currentIndex = inputsInRow.indexOf(targetElement)

    if (currentIndex !== -1 && inputsInRow[currentIndex + 1]) {
        inputsInRow[currentIndex + 1].focus()
    }
}

const generatePrismaWhereJSON = (filters) => {
    const where = {}
    filters.forEach(f => {
        const { field, operator, value, valueTo } = f
        if (value === '' || value === null || value === undefined) return

        const schemaField = props.schema.find(s => s.key === field)
        const isRelation = schemaField?.type === 'relation'
        const isNumber = ['number', 'currency'].includes(schemaField?.type)

        let target = where
        let targetField = field

        if (isRelation && schemaField.relation) {
            const entity = field
            where[entity] = where[entity] || {}
            target = where[entity]
            targetField = schemaField.relation.displayField
        }

        switch (operator) {
            case 'contains':
                target[targetField] = { contains: value, mode: 'insensitive' }
                break
            case 'equals':
                target[targetField] = { equals: isNumber ? Number(value) : value }
                break
            case 'greater_than':
                target[targetField] = { gt: Number(value) }
                break
            case 'less_than':
                target[targetField] = { lt: Number(value) }
                break
            case 'between':
                if (value && valueTo) {
                    if (schemaField?.type === 'date') {
                        target[targetField] = { gte: new Date(value), lte: new Date(valueTo) }
                    } else {
                        target[targetField] = { gte: Number(value), lte: Number(valueTo) }
                    }
                }
                break
        }
    })
    return where
}

const applyFilters = () => {
    filterStore.setFilters(props.tabId, localFilters.value)
    const prismaWhereJSON = generatePrismaWhereJSON(localFilters.value)
    emit('filter-changed', prismaWhereJSON)
    emit('escape-filter')
}

const resetFilters = () => {
    localFilters.value = []
    filterStore.clearFilters(props.tabId)
    emit('filter-changed', {})
}

const focusInputAtRow = (rowIndex, inputIndex = 0) => {
    const rowEl = rowRefs.value[rowIndex]
    if (rowEl) {
        const inputsInRow = Array.from(rowEl.querySelectorAll('.filter-input'))
        const targetIdx = Math.min(Math.max(inputIndex, 0), inputsInRow.length - 1)
        inputsInRow[targetIdx]?.focus()
    }
}

const handleGlobalComponentKey = (e) => {
    if (e.key === 'Escape') {
        emit('escape-filter')
        e.preventDefault()
    }
    if (e.key === 'Insert') {
        addFilterRow()
        e.preventDefault()
    }
}

const handleWindowKeyDown = (e) => {
    // 1. Cegat Shortcut Alt + F secepat mungkin di level teratas
    if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        e.stopPropagation()
        if (localFilters.value.length === 0) {
            addFilterRow()
        } else {
            focusInputAtRow(0, 0)
        }
        return
    }

    // 2. Jika fokus saat ini berada di dalam form filter
    if (filterContainerRef.value?.contains(document.activeElement)) {
        const activeEl = document.activeElement

        // 3. Tangkap dan Isolasi Event Tombol ENTER
        if (e.key === 'Enter') {


            if (activeEl.tagName === 'SELECT') {
                handleSelectEnter(activeEl)
            } else if (activeEl.classList.contains('filter-input')) {
                e.preventDefault()
                e.stopPropagation()
                applyFilters()
            } else {
                e.preventDefault()
                e.stopPropagation()
            }
            return
        }

        const currentY = rowRefs.value.findIndex(el => el && el.contains(activeEl))

        if (currentY === -1) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (localFilters.value.length > 0) {
                    e.preventDefault()
                    e.stopPropagation()
                    focusInputAtRow(0, 0)
                }
            }
            return
        }

        const rowEl = rowRefs.value[currentY]
        const inputsInRow = Array.from(rowEl.querySelectorAll('.filter-input'))
        const currentX = inputsInRow.indexOf(activeEl)

        if (e.key === 'Delete') {
            if (activeEl.tagName === 'SELECT' || activeEl.value === '') {
                e.preventDefault()
                e.stopPropagation()
                removeFilterRow(currentY)
                return
            }
        }

        // 4. Isolasi Event Tombol ARROW Keys (stopPropagation diletakkan sebelum pengecekan IF)
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                e.stopPropagation()
                if (rowRefs.value[currentY + 1]) {
                    // Ambil semua input di baris bawahnya
                    const nextRowEl = rowRefs.value[currentY + 1]
                    const inputsInNextRow = Array.from(nextRowEl.querySelectorAll('.filter-input'))
                    // Sesuaikan kolom indeks (currentX) agar sejajar secara vertikal
                    const targetInput = inputsInNextRow[Math.min(currentX, inputsInNextRow.length - 1)]

                    if (targetInput) {
                        targetInput.focus()
                        if (targetInput.tagName === 'INPUT') {
                            targetInput.select() // Otomatis block semua isi teks/angka
                        }
                    }
                }
                break

            case 'ArrowUp':
                e.preventDefault()
                e.stopPropagation()
                if (rowRefs.value[currentY - 1]) {
                    // Ambil semua input di baris atasnya
                    const prevRowEl = rowRefs.value[currentY - 1]
                    const inputsInPrevRow = Array.from(prevRowEl.querySelectorAll('.filter-input'))
                    // Sesuaikan kolom indeks (currentX) agar sejajar secara vertikal
                    const targetInput = inputsInPrevRow[Math.min(currentX, inputsInPrevRow.length - 1)]

                    if (targetInput) {
                        targetInput.focus()
                        if (targetInput.tagName === 'INPUT') {
                            targetInput.select() // Otomatis block semua isi teks/angka
                        }
                    }
                }
                break
            case 'ArrowRight':
                e.stopPropagation()
                {
                    if (activeEl.tagName === 'SELECT') {
                        if (inputsInRow[currentX + 1]) {
                            e.preventDefault()
                            inputsInRow[currentX + 1].focus()
                            // Otomatis select semua isi jika element setelahnya adalah INPUT
                            if (inputsInRow[currentX + 1].tagName === 'INPUT') {
                                inputsInRow[currentX + 1].select()
                            }
                        }
                    } else if (activeEl.classList.contains('filter-input')) {
                        let selectionEnd = 0
                        if (activeEl.type === 'number') {
                            const originalType = activeEl.type
                            activeEl.type = 'text'
                            selectionEnd = activeEl.selectionEnd
                            activeEl.type = originalType
                        } else {
                            selectionEnd = activeEl.selectionEnd
                        }

                        if (selectionEnd === activeEl.value?.length || activeEl.value === '') {
                            if (inputsInRow[currentX + 1]) {
                                e.preventDefault()
                                inputsInRow[currentX + 1].focus()
                                if (inputsInRow[currentX + 1].tagName === 'INPUT') {
                                    inputsInRow[currentX + 1].select()
                                }
                            }
                        }
                    }
                }
                break

            case 'ArrowLeft':
                e.stopPropagation()
                {
                    if (activeEl.tagName === 'SELECT') {
                        if (inputsInRow[currentX - 1]) {
                            e.preventDefault()
                            inputsInRow[currentX - 1].focus()
                            if (inputsInRow[currentX - 1].tagName === 'INPUT') {
                                inputsInRow[currentX - 1].select()
                            }
                        }
                    } else if (activeEl.classList.contains('filter-input')) {
                        let selectionStart = 0
                        if (activeEl.type === 'number') {
                            const originalType = activeEl.type
                            activeEl.type = 'text'
                            selectionStart = activeEl.selectionStart
                            activeEl.type = originalType
                        } else {
                            selectionStart = activeEl.selectionStart
                        }

                        if (selectionStart === 0 || activeEl.value === '') {
                            if (inputsInRow[currentX - 1]) {
                                e.preventDefault()
                                inputsInRow[currentX - 1].focus()
                                if (inputsInRow[currentX - 1].tagName === 'INPUT') {
                                    inputsInRow[currentX - 1].select()
                                }
                            }
                        }
                    }
                }
                break
        }
    }
}

// 5. Daftarkan event listener global menggunakan Capture Phase (opsi 'true')
onMounted(() => window.addEventListener('keydown', handleWindowKeyDown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', handleWindowKeyDown, true))
</script>