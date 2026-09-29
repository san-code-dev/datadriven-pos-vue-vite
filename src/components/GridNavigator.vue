<template>
    <!-- Kontainer Vertikal (Kanan) -->
    <!-- PERUBAHAN: bottom-[15px] diganti menjadi bottom-[15px] jika kontainer horizontal juga setinggi 15px, -->
    <!-- Namun agar posisinya berada pas di ATAS garis horizontal (tanpa tumpang tindih), pastikan bottom bernilai 15px -->
    <div v-if="rows.length > 0"
        class="absolute right-0 top-0 bottom-[15px] w-[15px] flex flex-col justify-between pointer-events-none z-50">
        <button @click="scrollToFirstRow"
            class="pointer-events-auto border border-emerald-600 w-[16px] h-[16px] bg-emerald-700 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all"
            title="Ke Baris Pertama Alt+⬆">
            <Icon icon="heroicons:chevron-up-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>

        <button @click="scrollToLastRow"
            class="pointer-events-auto border border-emerald-600 w-[16px] h-[16px] bg-emerald-700 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all"
            title="Ke Baris Terakhir Alt+⬇">
            <Icon icon="heroicons:chevron-down-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>
    </div>

    <!-- Kontainer Horizontal (Bawah - Full Width) -->
    <!-- PERUBAHAN: right-[15px] diganti menjadi right-0 agar lebar horizontal menjadi Full (100%) -->
    <div v-if="columns.length > 0"
        class="absolute bottom-0 left-0 right-0 h-[15px] flex justify-between pointer-events-none z-50">
        <button @click="scrollToFirstCol"
            class="pointer-events-auto border border-emerald-600 h-[16px] w-[16px] bg-emerald-700 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all"
            title="Ke Kolom Pertama Alt+⬅">
            <Icon icon="heroicons:chevron-left-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>

        <button @click="scrollToLastCol"
            class="pointer-events-auto border border-emerald-600 h-[16px] w-[16px] bg-emerald-700 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-all"
            title="Ke Kolom Terakhir Alt+➡">
            <Icon icon="heroicons:chevron-right-20-solid" class="w-3 h-3 flex-shrink-0" />
        </button>
    </div>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { toRef } from 'vue'
import { getActiveCellState, gridSelectSingleCell } from '@/composables/grid'
const props = defineProps({
    grid: [Object, null],
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] }
})

const gridRef = toRef(props, 'grid')

// ========================================================
// FUNGSI JUMP & FOCUS UNTUK BARIS (VERTIKAL)
// ========================================================
const scrollToFirstRow = async () => {
    if (props.rows.length === 0) return
    const activeState = await getActiveCellState(gridRef)
    const x = activeState?.x

    gridSelectSingleCell(gridRef, { rowIndex: 0, colIndex: x })
}

const scrollToLastRow = async () => {
    if (props.rows.length === 0) return
    const activeState = await getActiveCellState(gridRef)
    const x = activeState?.x
    const lastRowIndex = props.rows.length - 1

    gridSelectSingleCell(gridRef, { rowIndex: lastRowIndex, colIndex: x })
}

// ========================================================
// FUNGSI JUMP & FOCUS UNTUK KOLOM (HORIZONTAL)
// ========================================================
const scrollToFirstCol = async () => {
    if (props.columns.length === 0) return
    const activeState = await getActiveCellState(gridRef)
    const y = activeState?.y

    gridSelectSingleCell(gridRef, { rowIndex: y, colIndex: 0 })
}

const scrollToLastCol = async () => {
    if (props.columns.length === 0) return
    const activeState = await getActiveCellState(gridRef)
    const y = activeState?.y
    const lastColIndex = props.columns.length - 1

    gridSelectSingleCell(gridRef, { rowIndex: y, colIndex: lastColIndex })
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

/* 
  1. SCROLLBAR VERTIKAL (Kanan)
  - Atas: margin-top: 16px (memberi ruang untuk tombol Chevron UP di atas)
  - Bawah: margin-bottom: 16px (memberi ruang untuk tombol Chevron DOWN di bawah)
*/
revogr-scroll-virtual.vertical::-webkit-scrollbar-track,
.vertical revogr-scroll-virtual::-webkit-scrollbar-track {
    background: transparent !important;
    margin-top: 16px !important;
    margin-bottom: 16px !important;
}

/* Scrollbar Horizontal */
revogr-scroll-virtual.horizontal::-webkit-scrollbar-track,
.horizontal revogr-scroll-virtual::-webkit-scrollbar-track {
    background: transparent !important;
    margin-left: 16px !important;
    margin-right: 16px !important;
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
    background-color: rgb(5, 150, 105) !important;
}
</style>