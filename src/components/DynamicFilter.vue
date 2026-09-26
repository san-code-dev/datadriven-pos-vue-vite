<template>
    <div ref="filterContainerRef"
        class="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs transition-all duration-200 outline-none p-2.5"
        tabindex="1" @keydown="handleComponentKey" @mousedown="handleContainerMouseDown">

        <!-- HEADER / INLINE BAR (SELALU MUNCUL) -->
        <div class="flex items-center justify-between gap-2">

            <!-- Left Controls: Title & (+ Aturan Saat Kosong) -->
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-1.5 mr-1">
                    <Icon icon="heroicons:funnel-20-solid" class="w-4 h-4 text-emerald-500" />
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-0">
                        Filter
                    </h3>
                    <span
                        class="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded font-bold">
                        Alt + F
                    </span>
                </div>

                <!-- Button + Aturan (MUNCUL DI SINI HANYA SAAT ATURAN KOSONG) -->
                <button v-if="localFilters.length === 0" @click="addFilterRow" type="button"
                    class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors">
                    <span>Buat filter</span>
                </button>

                <!-- Right Controls: Indikator & Toggle Collapse (Saat Ada Aturan) -->
                <div v-if="localFilters.length > 0" class="flex items-center gap-2.5">

                    <!-- Badge Indikator Jumlah Aturan & Status Unapplied -->
                    <span v-if="!isExpanded"
                        class="inline-flex items-center gap-1.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-200 dark:border-slate-600">
                        <span :class="isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'"
                            class="w-1.5 h-1.5 rounded-full"></span>
                        <span>{{ localFilters.length }} Aturan</span>
                        <span v-if="isDirty" class="text-amber-600 dark:text-amber-400 font-bold">(Belum
                            Diterapkan)</span>
                    </span>

                    <!-- Tombol Toggle (Selalu Ada di Kanan Atas saat Ada Aturan) -->
                    <button @click="toggleCollapse" type="button"
                        class="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-1">
                        <span>{{ isExpanded ? 'Sembunyikan' : 'Tampilkan Aturan' }}</span>
                        <Icon :icon="isExpanded ? 'heroicons:chevron-up-20-solid' : 'heroicons:chevron-down-20-solid'"
                            class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- AREA YANG BISA DISEMBUNYIKAN -->
        <div v-show="localFilters.length > 0 && isExpanded"
            class="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">

            <!-- BARIS AKSI KELOMPOK: + ATURAN, RESET, & TERAPKAN -->
            <div class="flex items-center justify-start gap-2 pb-0.5">

                <!-- Button + Aturan -->
                <button @click="addFilterRow" type="button"
                    class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors">
                    <span>+ Aturan</span>
                    <kbd class="text-[9px] font-mono opacity-70 bg-white dark:bg-slate-800 px-1 rounded">[Ins]</kbd>
                </button>

                <!-- Reset Button -->
                <button @click="resetFilters" type="button"
                    class="text-xs font-medium px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    Reset
                </button>

                <!-- Tombol Terapkan (Memiliki Indikator Visual Jika Adanya Perubahan yang Belum Diterapkan) -->
                <button @click="applyFilters" type="button" :class="[
                    isDirty
                        ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300 dark:ring-amber-900/50 font-bold'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white font-semibold'
                ]"
                    class="relative inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg shadow-xs active:scale-95 transition-all">
                    <span v-if="isDirty" class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>Terapkan</span>
                </button>
            </div>

            <!-- LOOPING BARIS FILTER -->
            <div class="space-y-2">

                <div v-for="(item, index) in localFilters" :key="index" :ref="el => { if (el) rowRefs[index] = el }"
                    :class="[
                        isRowDirty(item, index)
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/60'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/60'
                    ]"
                    class="group relative grid grid-cols-12 gap-1.5 p-1.5 rounded-lg border focus-within:border-emerald-500/50 transition-all items-center w-full">

                    <!-- Pin Status Dirty per Baris -->
                    <div v-if="isRowDirty(item, index)" title="Aturan ini belum diterapkan"
                        class="absolute -top-1.5 -left-1 flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs z-10">
                        <span>Belum diterapkan</span>
                    </div>

                    <!-- 1. Select Field / Kolom (4 dari 12 Kolom) -->
                    <div class="col-span-4 relative">
                        <select v-model="item.field" @change="onFieldChange(index)"
                            class="filter-input data-field w-full cursor-pointer text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-2 pr-6 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none font-medium truncate">
                            <option value="" disabled>-- Pilih Kolom --</option>
                            <option v-for="field in allowedSchema" :key="field.key" :value="field.key">
                                {{ field.label }}
                            </option>
                        </select>
                    </div>

                    <!-- 2. Select Operator (3 dari 12 Kolom) -->
                    <div class="col-span-3 relative">
                        <select v-model="item.operator" @change="onOperatorChange(index)"
                            class="filter-input data-operator w-full cursor-pointer text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-2 pr-6 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none truncate">
                            <option v-for="op in getAvailableOperators(item.field)" :key="op.value" :value="op.value">
                                {{ op.label }}
                            </option>
                        </select>
                    </div>

                    <!-- 3. Value Inputs (4 dari 12 Kolom) -->
                    <div class="col-span-4 flex items-center min-w-0">
                        <div v-if="isValuelessOperator(item.operator)"
                            class="text-[11px] italic text-slate-400 dark:text-slate-500 px-1 truncate">
                            Tidak perlu nilai
                        </div>

                        <div v-else-if="item.operator === 'between'" class="flex items-center gap-1 w-full min-w-0">
                            <input v-model="item.value" :type="getInputType(item.field)" placeholder="Min"
                                @focus="handleFocus"
                                class="filter-input data-val-min w-1/2 min-w-0 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-1.5 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            <span class="text-[10px] text-slate-400 font-medium flex-shrink-0">s/d</span>
                            <input v-model="item.valueTo" :type="getInputType(item.field)" placeholder="Max"
                                @focus="handleFocus"
                                class="filter-input data-val-max w-1/2 min-w-0 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-1.5 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>

                        <div v-else-if="getFieldConfig(item.field)?.type === 'boolean'" class="relative w-full">
                            <select v-model="item.value"
                                class="filter-input data-val w-full cursor-pointer text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-2 pr-6 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none">
                                <option value="" disabled>-- Pilih Status --</option>
                                <option value="true">Ya</option>
                                <option value="false">Tidak</option>
                            </select>
                        </div>

                        <div v-else-if="getFieldConfig(item.field)?.type === 'select'" class="relative w-full">
                            <select v-model="item.value"
                                class="filter-input data-val w-full cursor-pointer text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-2 pr-6 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none truncate">
                                <option value="" disabled>-- Pilih Option --</option>
                                <option v-for="opt in (getFieldConfig(item.field)?.options || [])" :key="opt.value"
                                    :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>

                        <div v-else-if="getFieldConfig(item.field)?.type === 'relation'"
                            class="relative flex items-center w-full">
                            <template v-if="getFieldConfig(item.field)">
                                <input type="search" :value="item.value" placeholder="Pilih..." readonly
                                    class="filter-input data-val w-full cursor-pointer text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-2 pr-7 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate" />
                                <button type="button" @click="e => {
                                    emit('open-select-dialog', {
                                        keyword: '',
                                        context: 'filter',
                                        eventDetail: e.detail,
                                        relationInfo: {
                                            entity: getFieldConfig(item.field)?.entity,
                                            entityKey: item.field,
                                            entityKeySetTo: item.field,
                                            fieldsToShow: getFieldConfig(item.field)?.fieldsToShow,
                                        }
                                    })
                                }"
                                    class="absolute right-1 p-0.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-slate-700 dark:text-emerald-400 transition-colors">
                                    <Icon icon="mdi:magnify" class="w-3.5 h-3.5" />
                                </button>
                            </template>
                        </div>

                        <div v-else class="w-full">
                            <input v-model="item.value" :type="getInputType(item.field)" placeholder="Ketik nilai..."
                                @focus="handleFocus"
                                class="filter-input data-val w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                    </div>

                    <!-- 4. Delete Button (1 dari 12 Kolom) -->
                    <div class="col-span-1 flex justify-end">
                        <button @click="removeFilterRow(index)" type="button"
                            class="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors focus:outline-none"
                            tabindex="-1" title="Hapus Aturan">
                            <Icon icon="heroicons:x-mark-20-solid" class="w-4 h-4" />
                        </button>
                    </div>

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

// --- DETEKSI PERUBAHAN (DIRTY STATE) ---
const activeStoreFilters = computed(() => filterStore.activeFilters[props.tabId] || [])

// Apakah seluruh filter lokal berbeda dengan store
const isDirty = computed(() => {
    return JSON.stringify(localFilters.value) !== JSON.stringify(activeStoreFilters.value)
})

// Mencek apakah baris tertentu baru atau diubah dari store
const isRowDirty = (item, index) => {
    const storeItem = activeStoreFilters.value[index]
    if (!storeItem) return true // Baris baru
    return (
        item.field !== storeItem.field ||
        item.operator !== storeItem.operator ||
        item.value !== storeItem.value ||
        item.valueTo !== storeItem.valueTo
    )
}

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
        !f.isHidden
    )
})

const getFieldConfig = (fieldKey) => props.schema.find(f => f.key === fieldKey)

const isNumericField = (fieldKey) => {
    const config = getFieldConfig(fieldKey)
    if (!config) return false
    return ['number', 'currency'].includes(config.type)
}

const isValuelessOperator = (operator) => ['is_empty', 'is_not_empty'].includes(operator)

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

    if (type === 'select') {
        return [
            { value: 'equals', label: 'Sama Dengan' },
            { value: 'not_equals', label: 'Tidak Sama Dengan' },
            { value: 'is_empty', label: 'Kosong' },
            { value: 'is_not_empty', label: 'Tidak Kosong' },
        ]
    }

    if (type === 'uuid') {
        return [
            { value: 'equals', label: 'Sama Dengan' },
            { value: 'not_equals', label: 'Tidak Sama Dengan' },
            { value: 'in', label: 'Termasuk dalam (Banyak ID)' },
            { value: 'not_in', label: 'Tidak Termasuk dalam' },
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

    // 1. Ambil semua key field yang sudah terpakai di localFilters
    const usedFields = localFilters.value.map(item => item.field)

    // 2. Cari field dari allowedSchema yang BELUM ada di usedFields
    const availableField = allowedSchema.value.find(f => !usedFields.includes(f.key))

    // 3. Jika masih ada field yang belum dipakai, tambahkan ke localFilters
    if (availableField) {
        const defaultOp = getAvailableOperators(availableField.key)[0].value
        localFilters.value.push({
            field: availableField.key,
            type: availableField.type,
            operator: defaultOp,
            value: '',
            valueTo: ''
        })
        await nextTick()
        focusInputAtRow(localFilters.value.length - 1, 0)
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
}

const onOperatorChange = (index) => {
    const item = localFilters.value[index]
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
    if (e.repeat) return
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
            localFilters.value = JSON.parse(JSON.stringify(newFilters))
        } else {
            localFilters.value = []
        }
    },
    { deep: true, immediate: true }
)
</script>