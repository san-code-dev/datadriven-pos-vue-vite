<template>
    <div v-if="rows.length > 0"
        class="absolute right-0 top-0 bottom-[15px] w-[15px] flex flex-col justify-between pointer-events-none z-50">
        <button @click="scrollToFirstRow"
            class="pointer-events-auto w-full h-4 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all rounded-b-sm"
            title="Ke Baris Pertama">
            <Icon icon="heroicons:chevron-up-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>

        <button @click="scrollToLastRow"
            class="pointer-events-auto w-full h-4 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all rounded-t-sm"
            title="Ke Baris Terakhir">
            <Icon icon="heroicons:chevron-down-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>
    </div>

    <div v-if="columns.length > 0"
        class="absolute bottom-0 left-0 right-[15px] h-[15px] flex justify-between pointer-events-none z-50">
        <button @click="scrollToFirstCol"
            class="pointer-events-auto h-full w-4 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all rounded-r-sm"
            title="Ke Kolom Pertama">
            <Icon icon="heroicons:chevron-left-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>

        <button @click="scrollToLastCol"
            class="pointer-events-auto h-full w-4 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all rounded-l-sm"
            title="Ke Kolom Terakhir">
            <Icon icon="heroicons:chevron-right-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
    grid: [Object, null],
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] }
})

// 🟢 HELPER UTAMA: Mengambil instance element DOM asli RevoGrid secara aman
const getGrid = () => props.grid?.$el || props.grid || {}

// 🟢 HELPER REALTIME: Mendapatkan koordinat aktif secara asynchronous langsung dari engine grid
const getActiveCoordinates = async () => {
    const grid = getGrid()
    if (typeof grid.getFocused !== 'function') return { x: 0, y: 0 }
    const focused = await grid.getFocused()
    return {
        x: focused?.cell?.x ?? 0,
        y: focused?.cell?.y ?? 0
    }
}

// ========================================================
// FUNGSI JUMP & FOCUS UNTUK BARIS (VERTIKAL)
// ========================================================
const scrollToFirstRow = async () => {
    if (props.rows.length === 0) return
    const grid = getGrid()
    const { x } = await getActiveCoordinates()

    grid.setCellsFocus?.({ x, y: 0 }, { x, y: 0 })
    grid.scrollToRow?.(0)
}

const scrollToLastRow = async () => {
    if (props.rows.length === 0) return
    const grid = getGrid()
    const { x } = await getActiveCoordinates()
    const lastRowIndex = props.rows.length - 1

    grid.setCellsFocus?.({ x, y: lastRowIndex }, { x, y: lastRowIndex })
    grid.scrollToRow?.(lastRowIndex)
}

// ========================================================
// FUNGSI JUMP & FOCUS UNTUK KOLOM (HORIZONTAL)
// ========================================================
const scrollToFirstCol = async () => {
    if (props.columns.length === 0) return
    const grid = getGrid()
    const { y } = await getActiveCoordinates()

    grid.scrollToColumnIndex?.(0)
    grid.setCellsFocus?.({ x: 0, y }, { x: 0, y })
}

const scrollToLastCol = async () => {
    if (props.columns.length === 0) return
    const grid = getGrid()
    const { y } = await getActiveCoordinates()
    const lastColIndex = props.columns.length - 1

    grid.scrollToColumnIndex?.(lastColIndex)
    grid.setCellsFocus?.({ x: lastColIndex, y }, { x: lastColIndex, y })
}

defineExpose({ scrollToLastRow, scrollToLastCol, scrollToFirstRow, scrollToFirstCol })
</script>

<style>
/* Style kustom untuk internal scrollbar RevoGrid */
revogr-scroll-virtual {
    background: transparent !important;
}

revogr-scroll-virtual::-webkit-scrollbar {
    width: 15px !important;
    height: 15px !important;
}

revogr-scroll-virtual:active {
    cursor: grabbing !important;
}

revogr-scroll-virtual::-webkit-scrollbar-track {
    background: transparent !important;
    margin-top: 16px !important;
    margin-bottom: 15px !important;
    margin-left: 16px !important;
    margin-right: 31px !important;
}

revogr-scroll-virtual[type="horizontal"]::-webkit-scrollbar-track {
    background: transparent !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    margin-left: 16px !important;
    margin-right: 26px !important;
}

revogr-scroll-virtual::-webkit-scrollbar-thumb {
    background-color: rgba(16, 185, 129, 0.4) !important;
    border: 3.5px solid transparent !important;
    background-clip: padding-box !important;
    border-radius: 9999px !important;
    transition: background-color 0.2s ease-in-out !important;
    cursor: grab !important;
}

revogr-scroll-virtual::-webkit-scrollbar-thumb:active {
    cursor: grabbing !important;
}

revogr-scroll-virtual::-webkit-scrollbar-thumb:hover {
    background-color: rgb(5, 150, 105) !important;
}

.dark revogr-scroll-virtual::-webkit-scrollbar-thumb {
    background-color: rgba(52, 211, 153, 0.3) !important;
}

.dark revogr-scroll-virtual::-webkit-scrollbar-thumb:hover {
    background-color: rgb(52, 211, 153) !important;
}
</style>