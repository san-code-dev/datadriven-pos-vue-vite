<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from './GridNavigator.vue'
import { getActiveCellState } from '@/composables/grid.ts'
import { useTabStore } from '@/stores/tabs'

interface Props {
    schemaData: any
    fieldKey?: string
    relationKey?: string
    context?: string
    isOpen: boolean
}

const gridRef = ref()
const navRef = ref<InstanceType<typeof GridNavigator> | null>(null);
const props = defineProps<Props>()
const emit = defineEmits(['close', 'select'])

const tabStore = useTabStore()

const columns = ref<any[]>([])
const rows = ref<any[]>([])

const currentGridKey = computed(() => `${useTenantStore().selectedTenant?.code}-${props.context}-${props.fieldKey}-select_data_grid`)

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

const handleKeyDown = (e: KeyboardEvent) => {
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
    await emit('select', selectedData, props.context, props.fieldKey, props.relationKey)
    emit('close')
}

async function focusBackToGrid() {
    await nextTick()
    const grid = gridRef?.value?.$el
    await grid?.focus()

    const startCoord = currentGridConfig.value?.coordinate || { x: 0, y: 0 }
    await grid?.scrollToCoordinate(startCoord)
    grid?.setCellsFocus(startCoord, startCoord)
}

// Watch ketika modal dibuka (isOpen bernilai true)
watch(() => props.isOpen, async (isOpen) => {
    if (!isOpen || !props.schemaData) return;

    const rawSchema = props.schemaData.schema || []
    const savedColumnsConfig = currentGridConfig.value?.column || []

    // 1. Cari field dengan type 'relation' yang memiliki array 'fields'
    const relationField = rawSchema.find((field: any) => field.type === 'relation' && Array.isArray(field.fields) && field.fields.length > 0)

    // 2. Tentukan daftar field yang diperbolehkan (ambil dari relationField.fields jika ada)
    const allowedFields = relationField?.fields || props.schemaData?.fields

    // 3. Filter schema berdasarkan allowedFields jika ada
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
    focusBackToGrid()
}, { immediate: true })
</script>

<template>
    <Transition name="modal-fade">
        <div v-if="props.isOpen"
            class="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur sm:p-6 md:p-10"
            @click.self="closeDialog">

            <div :style="{ width: computedModalWidth, maxWidth: '95vw', maxHeight: '90vh' }"
                class="flex flex-col overflow-hidden bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-900/10 dark:ring-slate-100/10 transform transition-all duration-300">

                <!-- HEADER & ACTIONS -->
                <div
                    class="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <Icon icon="heroicons:table-cells-20-solid" class="w-4 h-4" />
                        </div>
                        <div>
                            <h2 class="text-sm mb-0 font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                Data {{ props.schemaData?.key || props.context }}
                            </h2>
                        </div>
                    </div>

                    <button @click="closeDialog"
                        class="flex items-center justify-center w-8 h-8 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-red-500">
                        <Icon icon="heroicons:x-mark-20-solid" class="w-4 h-4" />
                    </button>
                </div>

                <!-- BODY / GRID CONTAINER -->
                <div :style="{ height: computedModalHeight }"
                    class="flex flex-col min-h-0 w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 relative">
                    <div class="relative flex-1 w-full h-full min-h-[200px] overflow-hidden bg-white dark:bg-slate-900">

                        <RevoGrid ref="gridRef" hide-attribution
                            class="absolute inset-0 w-full h-full focus:outline-none" :columns="columns" :source="rows"
                            :theme="isDark ? 'darkCompact' : 'compact'" @keydown="handleKeyDown" @dblclick="selectData"
                            @afterfocus="saveCurrentStateToStore" @aftercolumnresize="saveCurrentStateToStore"
                            :resize="true" />

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