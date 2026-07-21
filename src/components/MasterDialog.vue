<template>
    <Transition name="modal-fade" @after-enter="handleAfterEnter">
        <div v-if="props.isOpen"
            class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:p-6 md:p-10"
            @click.self="closeDialog" @keydown="handleGlobalKeyDown">

            <div
                class="flex flex-col w-full max-w-7xl h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl transform transition-all duration-300">

                <!-- HEADER & ACTIONS -->
                <div
                    class="flex flex-col p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4 shrink-0">

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <h2
                                class="mb-0 text-base font-bold leading-none tracking-tight text-slate-800 dark:text-slate-100">
                                Pilih Master
                            </h2>
                            <span
                                class="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40">
                                {{ props.relation?.entity || '—' }}
                            </span>
                        </div>

                        <div class="flex items-center gap-2">
                            <button @click="fetchGridData" :disabled="syncStatus.state === 'loading'"
                                class="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50">
                                <Icon icon="heroicons:arrow-path-20-solid"
                                    :class="{ 'animate-spin': syncStatus.state === 'loading' }" class="w-4 h-4" />
                            </button>
                            <button @click="closeDialog"
                                class="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-95">
                                <Icon icon="heroicons:x-mark-20-solid" class="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <!-- DYNAMIC FILTER -->
                    <div v-if="props.schemaData?.schema" class="w-full">
                        <DynamicFilter :schema="props.schemaData.schema"
                            :tabId="props.relation?.entity || 'picker-master'" @filter-changed="handleFilterChanged"
                            @escape-filter="focusBackToGrid" />
                    </div>

                    <!-- SUB-BAR: METADATA & STATUS -->
                    <div
                        class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2">
                        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 select-none">
                            <div class="flex items-center gap-1">
                                <span class="font-medium text-slate-700 dark:text-slate-300">{{ rows.length }}</span>
                                <span>items,</span>
                            </div>
                            <div class="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                                <template v-if="syncStatus.state === 'loading'">
                                    <Icon icon="heroicons:arrow-path-20-solid"
                                        class="w-3.5 h-3.5 animate-spin text-emerald-500" />
                                    <span>{{ syncStatus.message }}</span>
                                </template>
                                <template v-if="syncStatus.state === 'success'">
                                    <Icon icon="heroicons:check-circle-20-solid" class="w-3.5 h-3.5 text-emerald-500" />
                                    <span class="text-emerald-600 dark:text-emerald-400 font-medium">{{
                                        syncStatus.message }}</span>
                                </template>
                                <template v-if="syncStatus.state === 'error'">
                                    <Icon icon="heroicons:exclamation-circle-20-solid"
                                        class="w-3.5 h-3.5 text-rose-500" />
                                    <span class="text-rose-600 dark:text-rose-400 font-medium animate-pulse">{{
                                        syncStatus.message }}</span>
                                </template>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- BODY / GRID CONTAINER -->
                <div
                    class="flex flex-1 flex-col min-h-0 w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950 p-4 relative">
                    <div
                        class="relative flex-1 w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 group">

                        <RevoGrid v-if="columns.length > 0" :key="gridKey" ref="gridRef" hide-attribution
                            class="absolute inset-0 w-full h-full focus:outline-none" :columns="columns" :source="rows"
                            :theme="isDark ? 'darkCompact' : 'compact'" :resize="true" :auto-size-column="true"
                            :column-types="columnTypes" @afterfocus="handleCellFocus" @rowdblclick="handleRowDblClick"
                            @keydown="handleGridKeyDown" />

                        <!-- GRID NAVIGATOR -->
                        <GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns" />

                        <!-- IN-GRID SEARCH OVERLAY -->
                        <div v-if="showSearchModal" @click.self="closeSearchModal"
                            class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 z-50 transition-all">
                            <div class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-3 mx-4"
                                @keydown.stop>
                                <form @submit.prevent="handleSearchSubmit" class="relative flex items-center">
                                    <div
                                        class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                                        <Icon icon="heroicons:magnifying-glass-20-solid" class="w-5 h-5" />
                                    </div>
                                    <input ref="searchInputRef" v-model="searchQuery" type="text"
                                        placeholder="Lanjutkan mengetik untuk mencari data..."
                                        class="w-full pl-11 pr-20 py-3 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 transition-all" />
                                    <div class="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                                        <kbd
                                            class="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-600 rounded shadow-sm">Enter
                                            ↩</kbd>
                                        <button type="button" @click="closeSearchModal"
                                            class="pointer-events-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Esc</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>

                    <!-- FOOTER HELPERS -->
                    <div class="mt-2 text-xs text-slate-400 flex justify-between items-center px-1">
                        <span>
                            Petunjuk Keyboard:
                            <kbd class="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">↑ / ↓</kbd> Navigasi |
                            <kbd class="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Enter</kbd> Konfirmasi
                            Pilihan |
                            <kbd class="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Ketik Huruf</kbd> Cari Cepat
                            |
                            <kbd class="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">Esc</kbd> Tutup Modal
                        </span>
                    </div>
                </div>

            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, toRaw, onMounted, onBeforeUnmount, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'
import DynamicFilter from '@/components/DynamicFilter.vue'
import api from '@/lib/axios'

import NumberColumnType from '@revolist/revogrid-column-numeral'
import SelectTypePlugin from '@revolist/revogrid-column-select'
import DateTypePlugin from '@revolist/revogrid-column-date'

interface Props {
    isOpen: boolean
    selectedValue?: any
    relation: {
        entity: string
        displayField?: string
        valueField?: string
        [key: string]: any
    }
    schemaData: {
        schema: any[]
        [key: string]: any
    }
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'select'])

const gridRef = ref<any>(null)
const navigatorRef = ref<any>(null)
const columns = ref<any[]>([])
const rows = ref<any[]>([])
const gridKey = ref<number>(0)

const selectedRow = ref<any>(null)
const selectedIndex = ref<number>(0)
const primaryKey = ref<string>('id')

// Search & Overlay States
const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<any>(null)
const activeFilters = ref<any>([])

// Sync & Loading State
const syncStatus = ref({ state: 'idle', message: '' })
let statusResetTimeout: any = null
let apiLoadingTimeout: any = null

const relationOptions = ref<{ [entityName: string]: Array<{ value: any, label: string }> }>({})

const getGridEl = () => gridRef.value?.$el || gridRef.value

// RevoGrid Column Type Configs
const columnTypes = {
    numeric: new NumberColumnType('0,0'),
    decimal: new NumberColumnType('0,0.00'),
    select: new SelectTypePlugin(),
    date: new DateTypePlugin()
}

// Custom Cell Sync Status Manager
const setSyncStatus = (state: string, message: string, autoResetDelay = 3000) => {
    if (statusResetTimeout) clearTimeout(statusResetTimeout)
    if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)

    if (state === 'loading') {
        apiLoadingTimeout = setTimeout(() => {
            syncStatus.value = { state, message }
        }, 300)
    } else {
        syncStatus.value = { state, message }
    }

    if ((state === 'success' || state === 'error') && autoResetDelay) {
        statusResetTimeout = setTimeout(() => {
            syncStatus.value = { state: 'idle', message: '' }
        }, autoResetDelay)
    }
}

// Relation Field Renderer
const relationCellRenderer = (createElement: any, cellProps: any, displayField: string, fieldKey: string, optionsList: any[]) => {
    const rawValue = cellProps.model[fieldKey]
    if (!rawValue) return createElement('span', {}, '')
    if (typeof rawValue === 'object' && rawValue !== null) {
        return createElement('span', {}, rawValue[displayField] || rawValue.name || '')
    }
    const matchedOption = optionsList.find(opt => opt.value === rawValue)
    return createElement('span', {}, matchedOption ? matchedOption.label : rawValue)
}

// Fetch Master Options for Inner Relations
const fetchRelationOptions = async () => {
    const schema = props.schemaData?.schema || []
    const relationFields = schema.filter(f => f.type === 'relation' && f.relation)

    for (const field of relationFields) {
        const entity = field.relation.entity
        const displayField = field.relation.displayField || 'name'
        if (relationOptions.value[entity]) continue

        try {
            const response = await api.get(`/${entity}/get-all`)
            const rawData = response.data?.schema?.data || response.data?.data || []
            relationOptions.value[entity] = rawData.map((item: any) => ({
                value: item.id,
                label: item[displayField] || item.name
            }))
        } catch (err) {
            console.error(`Gagal memuat opsi relasi untuk entitas ${entity}:`, err)
        }
    }
}

// FETCH UTAMA DATA GRID (Mengadopsi pola Komponen Kedua dengan Filter)
const fetchGridData = async () => {
    if (!props.relation?.entity) return
    setSyncStatus('loading', 'Mengambil data..')

    try {
        const response = await api.get(`/${props.relation.entity}/get-all`, {
            params: {
                filter: JSON.stringify(activeFilters.value)
            }
        })

        const freshData = response.data || response.data?.schema?.data || response.data?.data || []
        rows.value = structuredClone(toRaw(freshData))

        gridKey.value += 1
        await nextTick()

        if (typeof getGridEl().requestGridRowsRedraw === 'function') {
            getGridEl().requestGridRowsRedraw()
        }

        setSyncStatus('success', 'Selesai sinkronisasi')
        await triggerGridRedrawAndFocus()
    } catch (err: any) {
        console.error("Gagal sinkronisasi data tabel pemilih:", err)
        setSyncStatus('error', `Gagal memuat: ${err.message || 'Server Error'}`)
    }
}

// PROSES SCHEMA & KOORDINASI DATA
const loadComponentData = async () => {
    const res = props.schemaData
    if (!res || !props.isOpen) return

    await fetchRelationOptions()

    columns.value = (res.schema || []).map((field: any) => {
        const columnConfig: Record<string, any> = {
            prop: field.key,
            name: field.label,
            size: field.size || 150,
            readonly: true, // Dipaksakan ReadOnly untuk kebutuhan Dialog Selector
            required: field.required || false,
            _type: field.type || 'text',
            _primary: field.primary || false,
        }

        if (['number', 'integer'].includes(field.type)) columnConfig.columnType = 'numeric'
        else if (['decimal', 'currency'].includes(field.type)) columnConfig.columnType = 'decimal'
        else if (field.type === 'date') columnConfig.columnType = 'date'
        else if (field.type === 'select') {
            columnConfig.columnType = 'select'
            columnConfig.labelKey = 'label'
            columnConfig.valueKey = 'value'
            columnConfig.source = field.options || []
            columnConfig.editorProperties = { appendToBody: true }
        }
        else if (field.type === 'relation' && field.relation) {
            const entity = field.relation.entity
            columnConfig.columnType = 'select'
            columnConfig.labelKey = 'label'
            columnConfig.valueKey = 'value'
            columnConfig.source = relationOptions.value[entity] || []
            columnConfig.editorProperties = { appendToBody: true }
            columnConfig.cellTemplate = (createElement, linkProps) =>
                relationCellRenderer(
                    createElement,
                    linkProps,
                    field.relation.displayField,
                    field.key,
                    relationOptions.value[entity] || []
                )
        }
        return columnConfig
    })

    primaryKey.value = (res.schema || []).find((f: any) => f.primary)?.key || 'id'
    await fetchGridData()
}

const findCurrentDataIndex = (): number => {
    if (!props.selectedValue || rows.value.length === 0) return 0
    const valueField = props.relation.valueField || 'id'
    const displayField = props.relation.displayField || 'name'

    const idx = rows.value.findIndex(
        (item) => item[valueField] == props.selectedValue || item[displayField] == props.selectedValue
    )
    return idx !== -1 ? idx : 0
}

const handleCellFocus = (e: any) => {
    if (e.detail) {
        if (e.detail.model) selectedRow.value = e.detail.model
        if (typeof e.detail.rowIndex === 'number') selectedIndex.value = e.detail.rowIndex
    }
}

const handleRowDblClick = (e: any) => {
    if (e.detail?.model) confirmSelection(e.detail.model)
}

const confirmSelection = (rowData?: any) => {
    const target = rowData || selectedRow.value || rows.value[selectedIndex.value]
    if (!target) return

    const valueField = props.relation.valueField || 'id'
    const displayField = props.relation.displayField || 'name'

    emit('select', {
        value: target[valueField],
        display: target[displayField] || target[valueField],
        item: target
    })
    closeDialog()
}

// KEYDOWN PADA MODEL INTERNAL REVO GRID
const handleGridKeyDown = async (e: any) => {
    if (e.repeat) return

    // Alt + Navigasi Grid (Dari Komponen Kedua)
    if (e.altKey && e.key === 'ArrowLeft') { navigatorRef.value?.scrollToFirstCol(); e.preventDefault(); return; }
    if (e.altKey && e.key === 'ArrowRight') { navigatorRef.value?.scrollToLastCol(); e.preventDefault(); return; }
    if (e.altKey && e.key === 'ArrowDown') { navigatorRef.value?.scrollToLastRow(); e.preventDefault(); return; }
    if (e.altKey && e.key === 'ArrowUp') { navigatorRef.value?.scrollToFirstRow(); e.preventDefault(); return; }

    const focused = await gridRef.value?.getFocused()
    const activeColumn = focused?.column

    // Trigger pencarian jika mengetik karakter alfabet dasar di kolom primary/relation
    if (activeColumn?._primary || activeColumn?._type === 'relation') {
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            cariDataDenganKarakter(e.key)
            e.preventDefault()
        }
    }
}

// KEYDOWN GLOBAL (WINDOW CONTROLLER)
const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (!props.isOpen) return

    if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeDialog()
    } else if (e.key === 'Enter') {
        // Jika sedang tidak membuka modal pencarian
        if (!showSearchModal.value) {
            e.preventDefault()
            e.stopPropagation()
            confirmSelection()
        }
    } else if (e.key === 'ArrowDown' && !showSearchModal.value) {
        if (selectedIndex.value < rows.value.length - 1) {
            e.preventDefault()
            selectedIndex.value++
            focusCell(selectedIndex.value)
        }
    } else if (e.key === 'ArrowUp' && !showSearchModal.value) {
        if (selectedIndex.value > 0) {
            e.preventDefault()
            selectedIndex.value--
            focusCell(selectedIndex.value)
        }
    }
}

const focusCell = async (rowIndex: number) => {
    const grid = getGridEl()
    if (!grid) return
    try {
        if (typeof grid.focus === 'function') await grid.focus({ y: rowIndex, x: 0 })
        if (typeof grid.scrollToRow === 'function') await grid.scrollToRow(rowIndex)
        selectedRow.value = rows.value[rowIndex] || null
    } catch (err) {
        console.warn('Gagal fokus sel:', err)
    }
}

const triggerGridRedrawAndFocus = async () => {
    await nextTick()
    setTimeout(async () => {
        const grid = getGridEl()
        if (grid) {
            const targetIndex = findCurrentDataIndex()
            selectedIndex.value = targetIndex
            selectedRow.value = rows.value[targetIndex] || null

            if (typeof grid.refresh === 'function') grid.refresh()
            if (typeof grid.focus === 'function') grid.focus({ y: targetIndex, x: 0 })
            if (typeof grid.scrollToRow === 'function') grid.scrollToRow(targetIndex)
        }
    }, 150)
}

// SEARCH MODAL LOGICS (Cari Cepat Karakter)
const cariDataDenganKarakter = async (char: string) => {
    searchQuery.value = char
    showSearchModal.value = true
    await nextTick()
    searchInputRef.value?.focus()
}

const handleSearchSubmit = () => {
    const value = searchQuery.value.trim()
    if (!value) return

    const quickFilterRow = {
        field: primaryKey.value || 'id',
        operator: 'contains' as const,
        value: value,
        valueTo: ''
    }

    handleFilterChanged([quickFilterRow])
    closeSearchModal()
}

const closeSearchModal = () => {
    showSearchModal.value = false
    searchQuery.value = ''
    nextTick(() => { getGridEl().focus?.() })
}

const handleFilterChanged = (filter: any) => {
    activeFilters.value = filter
    fetchGridData()
}

const focusBackToGrid = () => {
    nextTick(() => {
        const grid = getGridEl()
        if (typeof grid.focus === 'function') grid.focus()
    })
}

const closeDialog = () => {
    emit('close')
}

const handleAfterEnter = () => {
    triggerGridRedrawAndFocus()
}

// WATCHERS & LIFECYCLE
watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) loadComponentData()
    }
)

onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeyDown)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown)
    if (statusResetTimeout) clearTimeout(statusResetTimeout)
    if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)
})
</script>

<style scoped>
:deep(revo-grid) {
    z-index: 10 !important;
    height: 100% !important;
    width: 100% !important;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    transform: scale(0.98);
}
</style>