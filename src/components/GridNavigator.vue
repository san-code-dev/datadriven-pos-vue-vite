<template>
    <div v-if="rows.length > 0"
        class="absolute right-0 top-0 bottom-[10px] w-[10px] flex flex-col justify-between pointer-events-none z-50">
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
        class="absolute bottom-0 left-0 right-[10px] h-[10px] flex justify-between pointer-events-none z-50">
        <span @click="scrollToFirstCol"
            class="pointer-events-auto h-full w-4 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all rounded-r-sm"
            title="Ke Kolom Pertama">
            <Icon icon="heroicons:chevron-left-20-solid" class="w-3 h-3 flex-shrink-0" />
        </span>

        <span @click="scrollToLastCol"
            class="pointer-events-auto h-full w-4 bg-emerald-500/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all rounded-l-sm"
            title="Ke Kolom Terakhir">
            <Icon icon="heroicons:chevron-right-20-solid" class="w-3 h-3 flex-shrink-0" />
        </span>
    </div>
</template>

<style>
/* Style kustom untuk internal scrollbar RevoGrid tetap di parent */
revogr-scroll-virtual {
    background: transparent !important;
}

revogr-scroll-virtual::-webkit-scrollbar {
    width: 10px !important;
    height: 10px !important;
}

revogr-scroll-virtual::-webkit-scrollbar-track {
    background: transparent !important;
}

revogr-scroll-virtual::-webkit-scrollbar-thumb {
    background-color: rgba(16, 185, 129, 0.4) !important;
    border-radius: 9999px !important;
    transition: background-color 0.2s ease-in-out !important;
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
<script setup>
import { Icon } from '@iconify/vue'

const props = defineProps({
    grid: [Object, null], // Menerima ref/element RevoGrid dari parent
    rows: {
        type: Array,
        default: () => []
    },
    columns: {
        type: Array,
        default: () => []
    },
    focusedCoordinate: {
        type: Object,
        default: () => ({ x: -1, y: -1 })
    }
})

// Fungsi helper internal untuk mengambil instance grid asli
const getGridInstance = () => {
    return props.grid?.$el || props.grid
}

// ========================================================
// FUNGSI JUMP & FOCUS UNTUK BARIS (VERTIKAL)
// ========================================================
const scrollToFirstRow = () => {
    nextTick(() => {
        const grid = getGridInstance()
        if (!grid || props.rows.length === 0) return

        const currentX = props.focusedCoordinate.x >= 0 ? props.focusedCoordinate.x : 0
        grid.setCellsFocus({ x: currentX, y: 0 }, { x: currentX, y: 0 })
        grid.scrollToRow(0)

    })
}

const scrollToLastRow = () => {
    nextTick(() => {
        const grid = getGridInstance()
        if (!grid || props.rows.length === 0) return

        const lastRowIndex = props.rows.length - 1
        const currentX = props.focusedCoordinate.x >= 0 ? props.focusedCoordinate.x : 0
        grid.setCellsFocus({ x: currentX, y: lastRowIndex }, { x: currentX, y: lastRowIndex })
        grid.scrollToRow(lastRowIndex)
    })
}

// ========================================================
// FUNGSI JUMP & FOCUS UNTUK KOLOM (HORIZONTAL)
// ========================================================
const scrollToFirstCol = (e) => {
    const grid = getGridInstance()
    if (!grid || props.columns.length === 0) return

    const currentY = props.focusedCoordinate.y >= 0 ? props.focusedCoordinate.y : 0
    grid.scrollToColumnIndex(0)
    grid.setCellsFocus({ x: 0, y: currentY }, { x: 0, y: currentY })
}

const scrollToLastCol = (e) => {
    const grid = getGridInstance()
    if (!grid || props.columns.length === 0) return

    const lastColIndex = props.columns.length - 1
    const currentY = props.focusedCoordinate.y >= 0 ? props.focusedCoordinate.y : 0
    grid.scrollToColumnIndex(lastColIndex)
    grid.setCellsFocus({ x: lastColIndex, y: currentY }, { x: lastColIndex, y: currentY })
}

// Expose fungsi scrollToLastRow agar bisa dipanggil Parent saat inisialisasi awal data
defineExpose({ scrollToLastRow, scrollToLastCol, scrollToFirstRow, scrollToFirstCol })
</script>