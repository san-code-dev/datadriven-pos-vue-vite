<template>
    <Transition name="modal-fade">
        <div v-if="props.isOpen"
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 md:p-10"
            @click.self="closeDialog">

            <div
                class="bg-white dark:bg-slate-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden transform transition-all duration-300">

                <div
                    class="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10">
                    <div class="flex items-center gap-4">
                        <div
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/20 shadow-xs shrink-0">
                            <Icon icon="heroicons:clock" class="w-5 h-5" />
                        </div>

                        <div class="flex items-center gap-2">
                            <h2
                                class="text-base font-bold tracking-tight mb-0 leading-none text-slate-800 dark:text-slate-100">
                                Log Audit
                            </h2>
                            <span
                                class="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40">
                                {{ props.tableName }}
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">

                        <button @click="fetchAuditLogs" :disabled="isLoading"
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

                <div
                    class="flex-1 flex flex-row min-h-0 w-full bg-slate-50/50 dark:bg-slate-950 overflow-hidden split-container">

                    <div
                        class="w-[50%] h-full p-4 relative bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/60 flex flex-col min-h-0 shrink-0">
                        <div v-if="isLoading"
                            class="absolute inset-0 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50">
                            <Icon icon="heroicons:arrow-path-20-solid" class="w-7 h-7 animate-spin text-emerald-500" />
                        </div>

                        <div
                            class="w-full h-full rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/50 flex-1">
                            <RevoGrid hide-attribution ref="gridRef" class="w-full h-full max-h-full focus:outline-none"
                                :columns="columns" :source="rows" :theme="isDark ? 'darkCompact' : 'compact'"
                                resize="true" :auto-size-column="true" @afterfocus="handleRowClick" />
                        </div>
                    </div>

                    <div class="flex-1 h-full p-4 overflow-y-auto min-h-0 flex flex-col gap-3">

                        <div
                            class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 shrink-0">
                            <Icon icon="heroicons:adjustments-horizontal" class="w-4 h-4 text-emerald-500" />
                            <span>Inspector Perbandingan Data</span>
                        </div>

                        <div v-if="!selectedLog"
                            class="flex-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 p-8">
                            <Icon icon="heroicons:cursor-arrow-rays" class="w-8 h-8 mb-1 animate-pulse" />
                            <p class="text-xs font-medium">Klik salah satu baris log di kiri untuk membedah perbedaan
                                data</p>
                        </div>

                        <div v-else class="flex-1 flex flex-col gap-4 min-h-0">

                            <div
                                class="flex-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
                                <div
                                    class="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5 shrink-0">
                                    <span class="w-2 h-2 rounded-full bg-rose-500"></span> Sebelum Perubahan (Old Data)
                                </div>
                                <div
                                    class="flex-1 overflow-auto bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                                    <div v-if="!selectedLog.oldData" class="text-slate-500 italic">Tidak ada data awal
                                        (Aksi: Created)</div>
                                    <div v-else>
                                        <div v-for="(val, key) in selectedLog.oldData" :key="key"
                                            :class="{ 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 px-1 py-0.5': isFieldChanged(key) }"
                                            class="my-0.5">
                                            <span class="text-emerald-400">"{{ key }}"</span>: <span
                                                v-html="formatJsonValue(val)"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="flex-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
                                <div
                                    class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5 shrink-0">
                                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Sesudah Perubahan (New
                                    Data)
                                </div>
                                <div
                                    class="flex-1 overflow-auto bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                                    <div v-if="!selectedLog.newData" class="text-slate-500 italic">Data dihapus total
                                        (Aksi: Delete)</div>
                                    <div v-else>
                                        <div v-for="(val, key) in selectedLog.newData" :key="key"
                                            :class="{ 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 px-1 py-0.5': isFieldChanged(key) }"
                                            class="my-0.5">
                                            <span class="text-emerald-400">"{{ key }}"</span>: <span
                                                v-html="formatJsonValue(val)"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                <div
                    class="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                    <span class="font-medium">Total: {{ rows.length }} log aktivitas</span>
                    <span class="italic font-mono">Klik baris tabel untuk memicu perbandingan data</span>
                </div>
            </div>
        </div>
    </Transition>
</template>
<script setup>
import { ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import api from '@/lib/axios'

const props = defineProps({
    isOpen: { type: Boolean, required: true },
    tableName: { type: String, required: true }
})

const emit = defineEmits(['close'])

const gridRef = ref(null)
const columns = ref([])
const rows = ref([])
const isLoading = ref(false)
const selectedLog = ref(null)

const formatJsonValue = (val) => {
    if (val === null) return '<span class="text-slate-500">null</span>'
    if (typeof val === 'string') return `<span class="text-amber-300">"${val}"</span>`
    if (typeof val === 'number') return `<span class="text-cyan-400">${val}</span>`
    if (typeof val === 'boolean') return `<span class="text-purple-400">${val}</span>`
    return JSON.stringify(val)
}

const isFieldChanged = (key) => {
    if (!selectedLog.value?.oldData || !selectedLog.value?.newData) return false
    const oldVal = selectedLog.value.oldData[key]
    const newVal = selectedLog.value.newData[key]
    return JSON.stringify(oldVal) !== JSON.stringify(newVal)
}

const handleRowClick = (e) => {
    if (e.detail && e.detail.model) {
        selectedLog.value = e.detail.model
    }
}

const actionCellRenderer = (createElement, props) => {
    const action = (props.model.action || '').toLowerCase()
    let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    if (action === 'created') badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    if (action === 'update') badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    if (action === 'delete') badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'

    return createElement('div', { class: 'flex items-center h-full' }, [
        createElement('span', { class: `px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${badgeClass}` }, action)
    ])
}

const fetchAuditLogs = async () => {
    if (!props.tableName) return
    isLoading.value = true
    selectedLog.value = null
    try {
        const response = await api.get('/audit-logs', { params: { tableName: props.tableName } })
        const { schema, data } = response.data.schema

        // 🟢 Ditambahkan filter agar 'oldData' dan 'newData' tidak masuk ke kolom grid
        columns.value = schema
            .filter(field => field.key !== 'oldData' && field.key !== 'newData')
            .map(field => {
                const config = { prop: field.key, name: field.label, readonly: true, sortable: true }

                if (field.key === 'action') {
                    config.cellTemplate = (createElement, linkProps) => actionCellRenderer(createElement, linkProps)
                } else if (field.type === 'json') {
                    config.cellTemplate = (createElement, linkProps) => {
                        const raw = linkProps.model[field.key]
                        return createElement('span', { class: 'text-slate-400 text-[11px] truncate block' }, raw ? '{...}' : '-')
                    }
                } else if (field.type === 'date') {
                    config.cellTemplate = (createElement, linkProps) => {
                        const dateVal = linkProps.model[field.key]
                        return createElement('span', { class: 'text-slate-600 dark:text-slate-400 text-[11px]' },
                            dateVal ? new Date(dateVal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
                        )
                    }
                }
                return config
            })

        rows.value = data || []
        await nextTick()
        gridRef.value?.$el?.requestGridRowsRedraw?.()
    } catch (err) {
        console.error('Gagal memuat audit log:', err)
    } finally {
        isLoading.value = false
    }
}
const closeDialog = () => {
    emit('close')
}

watch(() => props.isOpen, (newVal) => {
    if (newVal) fetchAuditLogs()
})
</script>

<style scoped>
:deep(revo-grid) {
    z-index: 10 !important;
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

.modal-fade-enter-from .transform {
    transform: scale(0.98) translateY(8px);
}

.modal-fade-leave-to .transform {
    transform: scale(0.98) translateY(8px);
}
</style>