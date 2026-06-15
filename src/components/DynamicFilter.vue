<template>
    <div ref="filterContainerRef"
        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 transition-colors outline-none focus:ring-2 focus:ring-emerald-500/50 select-none rounded-xl"
        tabindex="1" @keydown="handleGlobalComponentKey" @mousedown="handleContainerMouseDown">

        <div class="flex items-center justify-between" :class="{ isExpanded }">
            <div class="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <h3
                    class="text-xs font-bold uppercase mb-0 tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center h-5">
                    Filter
                </h3>
                <span
                    class="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded shadow-sm font-bold tracking-wide inline-flex items-center justify-center h-5 box-border">
                    Alt + F
                </span>

                <span v-if="localFilters.length > 0"
                    class="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-200 dark:border-slate-600">
                    {{ localFilters.length }} Aturan Aktif
                </span>

                <button v-if="localFilters.length > 0" @click="toggleCollapse" type="button"
                    class="text-[10px] text-slate-600 dark:text-slate-300  font-semibold dark:border-slate-600">
                    <span class="flex items-center gap-1">
                        {{ isExpanded ? 'sembunyikan' : 'tampilkan..' }}
                    </span>
                </button>
            </div>

            <div class=" flex items-center space-x-2 text-xs">
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

        <div v-show="isExpanded">

            <div v-if="localFilters.length === 0"
                class="text-center py-3 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg my-2">
                Belum ada filter aktif. Tekan tombol atau <kbd
                    class="px-1 bg-slate-100 dark:bg-slate-700 rounded shadow">Insert</kbd> untuk menyaring data.
            </div>

            <div v-else class="space-y-3 pt-2">
                <div v-for="(item, index) in localFilters" :key="index" :ref="el => { if (el) rowRefs[index] = el }"
                    class="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 focus-within:border-emerald-500/40">

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

const isExpanded = computed({
    get: () => {
        if (filterStore.filterCollapseStates === undefined) return true
        return filterStore.filterCollapseStates[props.tabId] !== false
    },
    set: (val) => {
        filterStore.setCollapseState(props.tabId, val)
    }
})

const toggleCollapse = () => {
    isExpanded.value = !isExpanded.value
}

const allowedSchema = computed(() => {
    return props.schema.filter(f => f.type !== 'json' && f.key !== 'action')
})

const getFieldConfig = (fieldKey) => props.schema.find(f => f.key === fieldKey)

const isNumericField = (fieldKey) => {
    const config = getFieldConfig(fieldKey)
    if (!config) return false
    return ['number', 'currency'].includes(config.type) || fieldKey === 'id'
}

const getAvailableOperators = (fieldKey) => {
    if (!fieldKey) return [{ value: 'contains', label: 'Mengandung kata' }]
    const config = getFieldConfig(fieldKey)

    if (isNumericField(fieldKey)) {
        return [
            { value: 'equals', label: '=' },
            { value: 'greater_than', label: '>' },
            { value: 'less_than', label: '<' },
            { value: 'between', label: 'Rentang Angka' }
        ]
    }
    if (config?.type === 'date') {
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
    if (isNumericField(fieldKey)) return 'number'
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
    if (!isExpanded.value) isExpanded.value = true

    if (allowedSchema.value.length > 0) {
        const firstField = allowedSchema.value[0]
        const isNumeric = isNumericField(firstField.key)
        localFilters.value.push({
            field: firstField.key,
            operator: isNumeric ? 'equals' : 'contains',
            value: '',
            valueTo: ''
        })
        await nextTick()
        focusInputAtRow(localFilters.value.length - 1, 0)
        triggerFilterUpdate()
    }
}

const onFieldChange = (index) => {
    const item = localFilters.value[index]
    const ops = getAvailableOperators(item.field)
    item.operator = ops[0].value
    item.value = ''
    item.valueTo = ''
    triggerFilterUpdate()
}

const triggerFilterUpdate = () => {
    filterStore.setFilters(props.tabId, localFilters.value)
    emit('filter-changed', localFilters.value)
}

const removeFilterRow = async (index) => {
    localFilters.value.splice(index, 1)
    rowRefs.value.splice(index, 1)

    await nextTick()

    if (localFilters.value.length > 0) {
        filterStore.setFilters(props.tabId, localFilters.value)
        emit('filter-changed', localFilters.value)
        const nextFocusIndex = index === 0 ? 0 : index - 1
        focusInputAtRow(nextFocusIndex, 0)
    } else {
        resetFilters()
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

const applyFilters = () => {
    filterStore.setFilters(props.tabId, localFilters.value)
    emit('filter-changed', localFilters.value)
}

const resetFilters = () => {
    localFilters.value = []
    filterStore.clearFilters(props.tabId)
    emit('filter-changed', [])
}

const focusInputAtRow = (rowIndex, inputIndex = 0) => {
    if (!isExpanded.value) return
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
    if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        e.stopPropagation()

        if (!isExpanded.value) isExpanded.value = true

        if (localFilters.value.length === 0) {
            addFilterRow()
        } else {
            focusInputAtRow(0, 0)
        }
        return
    }

    if (!isExpanded.value) return

    if (filterContainerRef.value?.contains(document.activeElement)) {
        const activeEl = document.activeElement

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
        if (currentY === -1) return

        const rowEl = rowRefs.value[currentY]
        const inputsInRow = Array.from(rowEl.querySelectorAll('.filter-input'))
        const currentX = inputsInRow.indexOf(activeEl)

        if (e.key === 'Delete' && (activeEl.tagName === 'SELECT' || activeEl.value === '')) {
            e.preventDefault()
            e.stopPropagation()
            removeFilterRow(currentY)
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                e.stopPropagation()
                if (rowRefs.value[currentY + 1]) {
                    const nextInputs = Array.from(rowRefs.value[currentY + 1].querySelectorAll('.filter-input'))
                    nextInputs[Math.min(currentX, nextInputs.length - 1)]?.focus()
                }
                break
            case 'ArrowUp':
                e.preventDefault()
                e.stopPropagation()

                if (rowRefs.value[currentY - 1]) {
                    const prevInputs = Array.from(rowRefs.value[currentY - 1].querySelectorAll('.filter-input'))
                    prevInputs[Math.min(currentX, prevInputs.length - 1)]?.focus()
                }
                break
            case 'ArrowRight':
                if (activeEl.tagName === 'SELECT' || activeEl.selectionEnd === activeEl.value?.length || activeEl.value === '') {
                    if (inputsInRow[currentX + 1]) {
                        e.preventDefault()
                        e.stopPropagation()

                        inputsInRow[currentX + 1].focus()
                    }
                }
                break
            case 'ArrowLeft':
                if (activeEl.tagName === 'SELECT' || activeEl.selectionStart === 0 || activeEl.value === '') {
                    if (inputsInRow[currentX - 1]) {
                        e.preventDefault()
                        e.stopPropagation()

                        inputsInRow[currentX - 1].focus()
                    }
                }
                break
        }
    }
}

onMounted(() => window.addEventListener('keydown', handleWindowKeyDown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', handleWindowKeyDown, true))

watch(
    () => filterStore.activeFilters[props.tabId],
    async (newFilters) => {
        await nextTick()
        if (newFilters && Array.isArray(newFilters)) {
            localFilters.value = newFilters.map(item => {
                const availableOps = getAvailableOperators(item.field)
                const isOpValid = availableOps.some(o => o.value === item.operator)
                const defaultOp = isNumericField(item.field) ? 'equals' : 'contains'

                return {
                    field: item.field || '',
                    operator: item.operator && isOpValid ? item.operator : defaultOp,
                    value: item.value !== undefined ? item.value : '',
                    valueTo: item.valueTo !== undefined ? item.valueTo : ''
                }
            })
        } else {
            localFilters.value = []
        }
    },
    { deep: true, immediate: true }
)
</script>