<template>
    <Transition name="modal-fade" @after-enter="handleAfterEnter">
        <div v-if="props.isOpen"
            class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:p-6 md:p-10"
            @click.self="closeDialog">
            <div
                class="flex flex-col w-full max-w-7xl h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl transform transition-all duration-300">
                <!-- Header -->
                <div
                    class="flex items-center justify-between shrink-0 z-10 px-8 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <h2
                                class="mb-0 text-base font-bold leading-none tracking-tight text-slate-800 dark:text-slate-100">
                                Master
                            </h2>
                            <span
                                class="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40">
                                {{ props.relation?.entity || '—' }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button @click="fetchMaster" :disabled="isLoading"
                            class="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                            title="Refresh Data">
                            <Icon icon="heroicons:arrow-path-20-solid" :class="{ 'animate-spin': isLoading }"
                                class="w-4 h-4" />
                        </button>
                        <button @click="closeDialog"
                            class="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-95"
                            title="Tutup Dialog">
                            <Icon icon="heroicons:x-mark-20-solid" class="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <!-- Body / Grid Container -->
                <div class="flex flex-1 flex-col min-h-0 w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950 p-4">
                    <div
                        class="relative flex-1 w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">

                        <!-- Loading Indicator Overlay -->
                        <div v-if="isLoading"
                            class="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs">
                            <Icon icon="heroicons:arrow-path-20-solid" class="w-7 h-7 animate-spin text-emerald-500" />
                        </div>

                        <!-- RevoGrid dengan Absolute Layout & Key Rendering -->
                        <RevoGrid v-if="columns.length > 0" :key="gridKey" ref="gridRef" hide-attribution
                            class="absolute inset-0 w-full h-full focus:outline-none" :columns="columns" :source="rows"
                            :theme="isDark ? 'darkCompact' : 'compact'" :resize="true" :auto-size-column="true"
                            @afterfocus="handleRowClick" />

                        <!-- Empty State jika Data Kosong -->
                        <div v-else-if="!isLoading"
                            class="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                            Tidak ada data atau struktur kolom untuk ditampilkan.
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, toRaw } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import api from '@/lib/axios'

interface Props {
    isOpen: boolean
    relation: {
        entity: string
        [key: string]: any
    }
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const gridRef = ref<any>(null)
const columns = ref<any[]>([])
const rows = ref<any[]>([])
const isLoading = ref<boolean>(false)
const selectedLog = ref<any>(null)
const gridKey = ref<number>(0)

const handleRowClick = (e: any) => {
    if (e.detail && e.detail.model) {
        selectedLog.value = e.detail.model
    }
}

const triggerGridRedraw = async () => {
    await nextTick()
    if (gridRef.value?.$el) {
        gridRef.value.$el.refresh?.()
        gridRef.value.$el.requestGridRowsRedraw?.()
    }
}

const fetchMaster = async () => {
    if (!props.relation?.entity) return

    isLoading.value = true
    selectedLog.value = null

    try {
        const [resSchema, resData] = await Promise.all([
            api.get(`/${props.relation.entity}/get-module-schema`),
            api.get(`/${props.relation.entity}/get-all`)
        ])

        const rawSchema = resSchema.data?.schema || resSchema.data || []
        const rawData = resData.data?.data || resData.data || []

        // Mapping Schema ke Format RevoGrid (Wajib memiliki 'prop' & 'name')
        columns.value = rawSchema.map((col: any) => ({
            prop: col.prop || col.field || col.key,
            name: col.name || col.label || col.header || col.prop,
            size: col.size || 150,
            readonly: true,
            ...col
        }))

        // Mengubah ke Plain Array JS agar kompatibel sempurna dengan StencilJS / RevoGrid
        rows.value = structuredClone(toRaw(rawData))

        // Update key untuk memaksa RevoGrid merender ulang instance barunya
        gridKey.value += 1

        await triggerGridRedraw()
    } catch (err) {
        console.error('Gagal memuat data master relation:', err)
    } finally {
        isLoading.value = false
    }
}

const closeDialog = () => {
    emit('close')
}

// Dipanggil secara otomatis oleh Event Vue Transition saat animasi selesai
const handleAfterEnter = () => {
    triggerGridRedraw()
}

// Watcher untuk mendeteksi pembukaan modal
watch(
    () => props.isOpen,
    (newVal) => {
        if (newVal) {
            fetchMaster()
        } else {
            columns.value = []
            rows.value = []
        }
    },
    { immediate: true }
)
</script>

<style scoped>
:deep(revo-grid) {
    z-index: 10 !important;
    height: 100% !important;
    width: 100% !important;
}

::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #475569;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-active .transform,
.modal-fade-leave-active .transform {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .transform,
.modal-fade-leave-to .transform {
    transform: scale(0.98) translateY(8px);
}
</style>