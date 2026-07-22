<template>
    <Transition name="modal-fade">
        <div v-if="props.isOpen"
            class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:p-6 md:p-10"
            @click.self="closeDialog">

            <div
                class="flex flex-col w-full max-w-7xl h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl transform transition-all duration-300">

                <!-- HEADER & ACTIONS -->
                <div
                    class="flex flex-col p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-4 shrink-0">

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <h2
                                class="mb-0 text-base font-bold leading-none tracking-tight text-slate-800 dark:text-slate-100">
                                Title
                            </h2>
                        </div>

                        <div class="flex items-center gap-2">
                            <button @click="closeDialog"
                                class="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-95">
                                <Icon icon="heroicons:x-mark-20-solid" class="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                </div>

                <!-- BODY / GRID CONTAINER -->
                <div
                    class="flex flex-1 flex-col min-h-0 w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950 p-4 relative">
                    <div
                        class="relative flex-1 w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 group">

                        <RevoGrid ref="gridRef" hide-attribution
                            class="absolute inset-0 w-full h-full focus:outline-none" :columns="columns" :source="rows"
                            :theme="isDark ? 'darkCompact' : 'compact'" @keydown="handleKeyDown" />

                        <GridNavigator ref="gridNavigatorRef" :columns="columns" :rows="rows" :grid="gridRef" />


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
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from './GridNavigator.vue'

interface Props {
    schemaDataEntity: any
    isOpen: boolean
}

const gridRef = ref()
const gridNavigatorRef = ref()
const props = defineProps<Props>()
const emit = defineEmits(['close', 'select'])

const columns = ref<any[]>([])
const rows = ref<any[]>([])


const closeDialog = () => {
    emit('close')
}


const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        selectData()
    }
}


const selectData = async () => {
    const focusedColumn = await gridRef.value.$el.getFocused();
    const selectedData = focusedColumn.model;
    await emit('select', selectedData)
    emit('close')
}

watch(() => props.isOpen, async (isOpen) => {
    if (!isOpen) return;

    columns.value = props.schemaDataEntity.schema.map((field: any) => ({
        prop: field.key,
        name: field.label,
        size: field.size || 150,
        readonly: true,
    }))

    rows.value = props.schemaDataEntity.data

    await nextTick()

    // 1. Dapatkan elemen RevoGrid
    const gridEl = gridRef.value?.$el || gridRef.value

    if (gridEl) {
        // Beri sedikit jeda agar animasi Transition Vue selesai & DOM siap
        setTimeout(async () => {
            // Focus elemen HTML
            gridEl.focus()

            // 2. Set sel aktif ke (Row index 0, Column index 0) secara eksplisit via API RevoGrid
            if (typeof gridEl.setSelectedFocusedCell === 'function') {
                await gridEl.setSelectedFocusedCell({ rowIndex: 0, colIndex: 0 })
            }

            // Scroll ke baris pertama jika navigator ada
            gridNavigatorRef.value?.scrollToFirstRow()
        }, 50)
    }
})
</script>

<style scoped>
/* Pastikan custom element RevoGrid benar-benar mengisi wrapper */
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
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    transform: scale(0.98);
}
</style>