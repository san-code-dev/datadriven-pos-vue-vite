<template>
    <div ref="filterContainerRef"
        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 transition-colors outline-none focus:ring-2 focus:ring-emerald-500/50 select-none rounded-xl"
        tabindex="1" @keydown.stop="handleComponentKey" @mousedown="handleContainerMouseDown">

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
                <button @click="addFilterRow" class="btn-action-slate">
                    <span>+ Aturan</span> <kbd class="opacity-60 text-[10px]">[Ins]</kbd>
                </button>
                <button v-if="localFilters.length > 0" @click="applyFilters" class="btn-action-slate">
                    <span>Terapkan</span> <kbd class="opacity-60 text-[10px]">[Enter]</kbd>
                </button>
                <button v-if="localFilters.length > 0" @click="resetFilters" class="btn-action-slate">
                    Reset
                </button>
            </div>
        </div>

        <div v-show="isExpanded">

            <div v-if="localFilters.length === 0"
                class="text-center py-3 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg my-2">
                Belum ada filter aktif. Tekan tombol atau <kbd
                    class="px-1 bg-slate-100 dark:bg-slate-700 rounded shadow">Alt+F</kbd> untuk menyaring data.
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
                        <select v-model="item.operator" @change="onOperatorChange(index)"
                            class="filter-input data-operator text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-2.5 pr-8 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-none min-w-[150px]">
                            <option v-for="op in getAvailableOperators(item.field)" :key="op.value" :value="op.value">
                                {{ op.label }}
                            </option>
                        </select>
                        <div
                            class="absolute right-2.5 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center justify-center">
                            <Icon icon="heroicons:chevron-down-20-solid" class="w-4 h-4" />
                        </div>
                    </div>

                    <!-- Operator tanpa kebutuhan nilai (Kosong / Tidak Kosong) -->
                    <div v-if="isValuelessOperator(item.operator)"
                        class="text-[11px] italic text-slate-400 dark:text-slate-500 px-1">
                        Tidak perlu nilai
                    </div>

                    <!-- Operator BETWEEN (angka / tanggal) -->
                    <div v-else-if="item.operator === 'between'" class="flex items-center gap-2">
                        <input v-model="item.value" :type="getInputType(item.field)" placeholder="Min"
                            @focus="handleFocus"
                            class="filter-input data-val-min w-28 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />

                        <span class="text-xs text-slate-400">s/d</span>

                        <input v-model="item.valueTo" :type="getInputType(item.field)" placeholder="Max"
                            @focus="handleFocus"
                            class="filter-input data-val-max w-28 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>

                    <!-- Nilai boolean -->
                    <div v-else-if="getFieldConfig(item.field)?.type === 'boolean'" class="flex items-center">
                        <select v-model="item.value"
                            class="filter-input data-val text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                            <option value="" disabled>-- Pilih --</option>
                            <option value="true">Ya</option>
                            <option value="false">Tidak</option>
                        </select>
                    </div>

                    <!-- Nilai Relation -->
                    <div v-else-if="getFieldConfig(item.field)?.type === 'relation'" class="relative flex items-center">

                        <!-- Ambil config skema field relasi -->
                        <template v-if="getFieldConfig(item.field)">
                            <input type="text" :value="item.value" placeholder="Pilih..." readonly @change="e => {
                                const target = e.target;
                                emit('open-select-dialog', {
                                    value: target.value,
                                    type: 'relation',
                                    entity: getFieldConfig(item.field)?.entity,
                                    key: item.field,
                                    relationKey: getFieldConfig(item.field)?.relationKey
                                });
                            }"
                                class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all pr-8" />

                            <Icon icon="mdi:magnify"
                                class="w-5 h-5 absolute right-1 rounded-md top-[3px] p-1 bg-emerald-200 dark:bg-slate-800 text-emerald-500 cursor-pointer hover:text-emerald-500"
                                @click="emit('open-select-dialog', {
                                    value: item.value || '',
                                    type: 'relation',
                                    entity: getFieldConfig(item.field)?.entity,
                                    key: item.field,
                                    relationKey: getFieldConfig(item.field)?.relationKey
                                })" />
                        </template>

                    </div>


                    <!-- Nilai default (string / number / date) -->
                    <div v-else class="flex items-center">
                        <input v-model="item.value" :type="getInputType(item.field)" placeholder="Ketik nilai..."
                            @focus="handleFocus"
                            class="filter-input data-val text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
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

const emit = defineEmits(['filter-changed', 'escape-filter', 'open-select-dialog'])

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
    return props.schema.filter(f =>
        f.type !== 'json' &&
        f.key !== 'action' &&
        !f.hideFilter // <--- Tambahkan baris ini
    )
})

const getFieldConfig = (fieldKey) => props.schema.find(f => f.key === fieldKey)

const isNumericField = (fieldKey) => {
    const config = getFieldConfig(fieldKey)
    if (!config) return false
    return ['number', 'currency'].includes(config.type)
}

const isValuelessOperator = (operator) => ['is_empty', 'is_not_empty'].includes(operator)

// Operator lengkap per tipe data. Tanggal disimpan sebagai DateTime di backend.
const getAvailableOperators = (fieldKey) => {
    if (!fieldKey) return [{ value: 'contains', label: 'Mengandung kata' }]
    const config = getFieldConfig(fieldKey)
    const type = config?.type

    if (isNumericField(fieldKey)) {
        return [
            { value: 'equals', label: 'Sama Dengan (=)' },
            { value: 'not_equals', label: 'Tidak Sama Dengan (≠)' },
            { value: 'greater_than', label: 'Lebih Besar (>)' },
            { value: 'greater_or_equal', label: 'Lebih Besar / Sama (≥)' },
            { value: 'less_than', label: 'Lebih Kecil (<)' },
            { value: 'less_or_equal', label: 'Lebih Kecil / Sama (≤)' },
            { value: 'between', label: 'Rentang Angka' },
            { value: 'is_empty', label: 'Kosong' },
            { value: 'is_not_empty', label: 'Tidak Kosong' },
        ]
    }

    if (type === 'date') {
        return [
            { value: 'equals', label: 'Tepat Pada Tanggal' },
            { value: 'not_equals', label: 'Bukan Pada Tanggal' },
            { value: 'after', label: 'Setelah (>)' },
            { value: 'before', label: 'Sebelum (<)' },
            { value: 'between', label: 'Rentang Tanggal' },
            { value: 'is_empty', label: 'Kosong' },
            { value: 'is_not_empty', label: 'Tidak Kosong' },
        ]
    }

    if (type === 'relation') {
        return [
            { value: 'equals', label: 'Sama dengan' },
            { value: 'not_equals', label: 'Tidak Sama dengan' },
            { value: 'is_empty', label: 'Kosong' },
            { value: 'is_not_empty', label: 'Tidak Kosong' },
        ]
    }

    if (type === 'boolean') {
        return [
            { value: 'equals', label: 'Sama Dengan' },
            { value: 'is_empty', label: 'Kosong' },
            { value: 'is_not_empty', label: 'Tidak Kosong' },
        ]
    }

    // default: string / text
    return [
        { value: 'contains', label: 'Mengandung kata' },
        { value: 'not_contains', label: 'Tidak Mengandung' },
        { value: 'equals', label: 'Tepat Sama' },
        { value: 'not_equals', label: 'Tidak Sama' },
        { value: 'starts_with', label: 'Diawali Dengan' },
        { value: 'ends_with', label: 'Diakhiri Dengan' },
        { value: 'is_empty', label: 'Kosong' },
        { value: 'is_not_empty', label: 'Tidak Kosong' },
    ]
}

const getInputType = (fieldKey) => {
    const config = getFieldConfig(fieldKey)
    if (!config) return 'text'
    if (isNumericField(fieldKey)) return 'number'
    if (config.type === 'date') return 'datetime-local'
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
        const defaultOp = getAvailableOperators(firstField.key)[0].value
        localFilters.value.push({
            field: firstField.key,
            type: firstField.type,
            operator: defaultOp,
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
    const config = getFieldConfig(item.field)
    const ops = getAvailableOperators(item.field)
    item.type = config?.type
    item.operator = ops[0].value
    item.value = ''
    item.valueTo = ''
    triggerFilterUpdate()
}

const onOperatorChange = (index) => {
    const item = localFilters.value[index]
    // Bersihkan nilai lama saat pindah ke/ dari operator tanpa nilai atau between
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

const resetFilters = async () => {
    localFilters.value = []
    filterStore.clearFilters(props.tabId)
    emit('filter-changed', [])
    await nextTick();
    emit('escape-filter')
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

const handleComponentKey = (e) => {
    if (e.key === 'Escape') {
        emit('escape-filter')
    }
    if (e.key === 'Insert') {
        addFilterRow()
        e.preventDefault()
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
                e.preventDefault()
                e.stopPropagation()
                if (activeEl.tagName === 'SELECT' || activeEl.tagName === 'INPUT' || activeEl.selectionEnd === activeEl.value?.length || activeEl.value === '') {
                    if (inputsInRow[currentX + 1]) {
                        inputsInRow[currentX + 1].focus()
                    }
                }
                break
            case 'ArrowLeft':
                e.preventDefault()
                e.stopPropagation()
                if (activeEl.tagName === 'SELECT' || activeEl.tagName === 'INPUT' || activeEl.selectionStart === 0 || activeEl.value === '') {
                    if (inputsInRow[currentX - 1]) {
                        inputsInRow[currentX - 1].focus()
                    }
                }
                break
        }
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
}
const handleFocus = (e) => {
    // Menggunakan setTimeout menjamin selection berjalan setelah browser selesai memproses event focus bawaan
    setTimeout(() => {
        if (e.target) {
            e.target.select()
        }
    }, 0)
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
                const defaultOp = availableOps[0]?.value || 'contains'
                const config = getFieldConfig(item.field)

                return {
                    field: item.field || '',
                    type: item.type || config?.type,
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