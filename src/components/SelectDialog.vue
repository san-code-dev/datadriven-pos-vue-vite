<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from './GridNavigator.vue'
import { getActiveCellState } from '@/composables/grid.ts'
import { useTabStore } from '@/stores/tabs'
import api from '@/lib/axios.ts'
import SyncStatus from '@/components/SyncStatus.vue'

interface Props {
    schemaData: any
    eventDetail: any
    relationInfo: any
    context?: string
    isOpen: boolean
}

const gridRef = ref()
const navRef = ref<InstanceType<typeof GridNavigator> | null>(null);
const props = defineProps<Props>()
const emit = defineEmits(['close', 'select'])

const searchInputRef = ref<HTMLInputElement | null>(null)
const syncStatusRef = ref<InstanceType<typeof SyncStatus> | null>(null)

const setSyncStatus = (state: any, message: string, autoResetDelay = 3000) => {
    syncStatusRef.value?.setStatus(state, message, autoResetDelay)
}

const tabStore = useTabStore()

const columns = ref<any[]>([])
const rows = ref<any[]>([])

const currentGridKey = computed(() => `${useTenantStore().selectedTenant?.code}-${props.context}-${props.relationInfo?.entityKey}-select_data_grid`)

const currentGridConfig = computed(() => {
    const activeTabId = tabStore.activeTabId
    if (!activeTabId) return null
    return tabStore.getGridConfig(activeTabId, currentGridKey.value)
})

const computedModalWidth = computed(() => {
    const totalColumnWidth = columns.value.reduce((acc, col) => acc + (col.size || 150), 0)
    const dynamicWidth = totalColumnWidth + 60
    return `${Math.max(450, Math.min(dynamicWidth, 1400))}px`
})

const computedModalHeight = computed(() => {
    const rowCount = rows.value.length || 1
    const estimatedHeight = (rowCount * 40) + 140
    return `${Math.min(Math.max(estimatedHeight, 250), 650)}px`
})

const closeDialog = () => {
    emit('close')
}

// Menyimpan state posisi fokus (koordinat) dan ukuran kolom ke Pinia berdasarkan event.detail
const saveCurrentStateToStore = async (event: CustomEvent) => {
    const detail = event.detail
    if (!detail) return

    // Ambil state existing dari Pinia atau buat default
    const existingConfig = currentGridConfig.value || {
        coordinate: { x: 0, y: 0 },
        column: columns.value.map(col => ({ key: col.prop, size: col.size }))
    }

    let updatedCoordinate = { ...existingConfig.coordinate }
    let updatedColumns = [...columns.value]

    // 1. Tangani jika event dari 'afterfocus'
    if ('rowIndex' in detail && 'colIndex' in detail) {
        updatedCoordinate = {
            x: detail.colIndex,
            y: detail.rowIndex
        }
    }

    // 2. Tangani jika event dari 'aftercolumnresize' (detail berupa object index kolom)
    // Contoh: { "0": { prop: "id", size: 169, ... } }
    const resizedKeys = Object.keys(detail)
    const isResizeEvent = resizedKeys.some(key => !isNaN(Number(key)) && detail[key]?.prop)

    if (isResizeEvent) {
        updatedColumns = columns.value.map(col => {
            // Cek apakah kolom ini ikut di-resize di dalam detail
            for (const key of resizedKeys) {
                const resizedCol = detail[key]
                if (resizedCol && resizedCol.prop === col.prop) {
                    return { ...col, size: resizedCol.size }
                }
            }
            return col
        })
        // Update local columns agar lebar modal langsung menyesuaikan secara reaktif
        columns.value = updatedColumns
    }

    // Simpan ke Pinia Store
    tabStore.updateGridConfig(tabStore.activeTabId, currentGridKey.value, {
        coordinate: updatedCoordinate,
        column: updatedColumns.map(col => ({ key: col.prop, size: col.size }))
    })
}
const clearGridFocus = () => {
    try {
        const gridEl = gridRef.value?.$el
        if (gridEl) {
            // Hapus fokus dari shadow root / element aktif jika ada
            if (typeof gridEl.clearFocus === 'function') {
                gridEl.clearFocus()
            }
            if (typeof gridEl.blur === 'function') {
                gridEl.blur()
            }
        }
        // Pastikan fokus kembali ke document body agar tidak mengendap di Web Component
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
        }
    } catch (err) {
        // Mencegah unmount crash jika method RevoGrid sudah tidak terjangkau
        console.warn('[Grid] Error clearing focus during unmount:', err)
    }
}
const handleKeyDown = (e: KeyboardEvent) => {


    if (e.key === '/' && e.ctrlKey) {
        e.preventDefault()
        clearGridFocus()
        searchInputRef.value?.focus()
    }

    if (e.key === 'Enter') {
        selectData()
    }
    if (e.key === 'Escape') {
        closeDialog()
    }
    if (!e.altKey) return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        if (e.repeat) return;

        if (e.key === 'ArrowLeft') {
            navRef.value?.scrollToFirstCol();
            return;
        }
        if (e.key === 'ArrowRight') {
            navRef.value?.scrollToLastCol();
            return;
        }
        if (e.key === 'ArrowDown') {
            navRef.value?.scrollToLastRow();
            return;
        }
        if (e.key === 'ArrowUp') {
            navRef.value?.scrollToFirstRow();
            return;
        }
    }
}

const selectData = async () => {
    const focusedColumn = await getActiveCellState(gridRef)

    if (!focusedColumn?.model) {
        alert("gagal memilih data");
        return
    }
    const selectedData = focusedColumn.model
    await emit('select', selectedData, props.context, props.relationInfo, props.eventDetail)
    emit('close')
}
const handleSearchInputSubmit = async (e: Event | string) => {
    // Ambil nilai string baik dari Event maupun string langsung
    const keyword = typeof e === 'string' ? e : (e.target as HTMLInputElement).value

    setSyncStatus('loading', 'Mencari data..')

    try {
        const response = await api.get(`/${props.relationInfo.entity}/search-data`, {
            params: { keyword }
        })

        rows.value = response.data.data || response.data || []
        await nextTick()
        focusBackToGrid()
        setSyncStatus('success', 'Hasil pencarian ditampilkan')

    } catch (err: any) {
        console.error("[searchData] Gagal mencari data server:", err)
        setSyncStatus('error', `Gagal memuat: ${err.message || 'Server Error'}`)
    }
}

async function focusBackToGrid() {
    const grid = gridRef?.value?.$el
    await grid?.focus()

    const startCoord = currentGridConfig.value?.coordinate || { x: 0, y: 0 }
    await grid?.setCellsFocus(startCoord, startCoord)
}
const handleInputSearchFocus = (event: FocusEvent) => {
    const input = event.target as HTMLInputElement
    input.select()
}

const loadComponentData = async () => {
    if (!props.schemaData) return;
    const rawSchema = props.schemaData.schema || []
    const savedColumnsConfig = currentGridConfig.value?.column || []

    const allowedFields = props.relationInfo.fieldsToShow
    let filteredSchema = rawSchema
    if (Array.isArray(allowedFields) && allowedFields.length > 0) {
        filteredSchema = rawSchema.filter((field: any) => allowedFields.includes(field.key))
    }

    // 4. Map ke format RevoGrid
    columns.value = filteredSchema.map((field: any) => {
        const savedCol = savedColumnsConfig.find((c: any) => c.key === field.key)

        return {
            prop: field.key,
            name: field.label,
            size: savedCol ? savedCol.size : (field.size || 150),
            readonly: true,
        }
    })

    rows.value = props.schemaData.data || []
    await nextTick()
    focusBackToGrid()
}

// Watch ketika modal dibuka (isOpen bernilai true)
watch(() => props.isOpen, async (isOpen) => {
    if (!isOpen) return;
    loadComponentData()

}, { immediate: true })
</script>

<template>
    <Transition name="modal-fade">
        <div v-if="props.isOpen"
            class="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm sm:p-6 md:p-10"
            @click.self="closeDialog">

            <div :style="{ width: computedModalWidth, maxWidth: '75vw', maxHeight: '90vh' }"
                class="flex flex-col overflow-hidden bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/10 dark:ring-slate-100/10 transform transition-all duration-300">

                <!-- HEADER & ACTIONS -->
                <div
                    class="flex items-center justify-between px-2 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                    <div class="flex items-center gap-3">
                        <div>
                            <h2 class="text-sm mb-0 font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                {{ props.schemaData?.label }}
                            </h2>
                        </div>
                    </div>

                    <button @click="closeDialog"
                        class="flex items-center justify-center w-8 h-8 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-red-500">
                        <Icon icon="heroicons:x-mark-20-solid" class="w-4 h-4" />
                    </button>
                </div>
                <div
                    class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60">

                    <div class="flex items-center gap-3 text-xs  p-2 text-slate-500 dark:text-slate-400 select-none">

                        <div class="relative">

                            <Icon icon="mdi:magnify"
                                class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors peer-focus:text-emerald-500" />



                            <input ref="searchInputRef" type="search" @focus="handleInputSearchFocus"
                                class="peer filter-input data-val text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Ctrl + / cari lalu enter"
                                @search="($event.target as HTMLInputElement).value === '' ? loadComponentData() : null"
                                @keydown.enter.prevent="handleSearchInputSubmit(($event.target as HTMLInputElement).value)"
                                @keydown.escape.prevent="focusBackToGrid()">

                        </div>


                        <div class="flex items-center gap-1">
                            <span class="font-medium text-slate-700 dark:text-slate-300">{{ rows.length }}</span>
                            <span>items</span>
                        </div>
                        <SyncStatus ref="syncStatusRef" />
                    </div>
                </div>


                <!-- BODY / GRID CONTAINER -->
                <div :style="{ height: computedModalHeight }"
                    class="flex flex-col min-h-0 w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 relative">
                    <div class="relative flex-1 w-full h-full min-h-[200px] overflow-hidden bg-white dark:bg-slate-900">

                        <RevoGrid ref="gridRef" hide-attribution
                            class="absolute inset-0 w-full h-full focus:outline-none" :columns="columns" :source="rows"
                            :theme="isDark ? 'darkCompact' : 'compact'" @keydown="handleKeyDown" @dblclick="selectData"
                            @afterfocus="saveCurrentStateToStore" @aftercolumnresize="saveCurrentStateToStore"
                            :resize="true" :stretch="true" />

                        <GridNavigator ref="navRef" :columns="columns" :rows="rows" :grid="gridRef" />

                    </div>

                    <!-- FOOTER HELPERS -->
                    <div
                        class="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center shrink-0">
                        <div class="flex items-center gap-3">
                            <span class="flex items-center gap-1.5">
                                <kbd
                                    class="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">↑↓</kbd>
                                Navigasi
                            </span>
                            <span class="flex items-center gap-1.5">
                                <kbd
                                    class="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">Enter</kbd>
                                Pilih
                            </span>
                            <span class="flex items-center gap-1.5">
                                <kbd
                                    class="px-1.5 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">Esc</kbd>
                                Tutup
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </Transition>
</template>

<style scoped>
:deep(revo-grid) {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100% !important;
    width: 100% !important;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    transform: scale(0.96);
}
</style>