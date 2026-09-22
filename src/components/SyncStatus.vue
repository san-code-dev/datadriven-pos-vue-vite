<template>
    <div class="relative flex items-center">
        <!-- Trigger Status (Bisa diklik jika ada history) -->
        <button type="button" @click="isHistoryOpen = true"
            class="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700 text-xs hover:opacity-80 transition-opacity cursor-pointer group"
            title="Klik untuk melihat riwayat proses">
            <template v-if="syncStatus.state === 'loading'">
                <Icon icon="heroicons:arrow-path-20-solid" class="w-4 h-4 animate-spin text-emerald-500" />
                <span class="text-slate-500">{{ syncStatus.message }}</span>
            </template>
            <template v-else-if="syncStatus.state === 'success'">
                <Icon icon="heroicons:check-circle-20-solid" class="w-4 h-4 text-emerald-500" />
                <span class="text-emerald-600 dark:text-emerald-400 font-medium">{{ syncStatus.message }}</span>
            </template>
            <template v-else-if="syncStatus.state === 'error'">
                <Icon icon="heroicons:exclamation-circle-20-solid" class="w-4 h-4 text-rose-500" />
                <span class="text-rose-600 dark:text-rose-400 font-medium animate-pulse">{{ syncStatus.message }}</span>
            </template>
            <template v-else>
                <Icon icon="mdi:info-outline"
                    class="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </template>
        </button>

        <!-- Dialog Modal History -->
        <Teleport to="body">
            <div v-if="isHistoryOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
                @click.self="isHistoryOpen = false">
                <div
                    class="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[80vh]">
                    <!-- Header Modal -->
                    <div
                        class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div class="flex items-center gap-2">
                            <Icon icon="mdi:clock-outline" class="w-5 h-5 text-emerald-500" />
                            <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0">Riwayat Proses
                            </h3>
                        </div>
                        <button @click="isHistoryOpen = false"
                            class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
                            <Icon icon="heroicons:x-mark-20-solid" class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Body List History -->
                    <div
                        class="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-700/50">
                        <template v-if="historyLogs.length > 0">
                            <div v-for="(log, index) in historyLogs" :key="index"
                                class="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                                <div class="flex items-start gap-2">
                                    <Icon :icon="getLogIcon(log.state)"
                                        :class="['w-4 h-4 mt-0.5 shrink-0', getLogColor(log.state)]" />
                                    <div>
                                        <p class="text-slate-700 dark:text-slate-200 font-medium">{{ log.message }}</p>
                                        <div class="flex items-center gap-2 mt-0.5">
                                            <span class="text-[10px] text-slate-400 capitalize">{{ log.state }}</span>
                                            <span v-if="log.duration"
                                                class="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded font-mono">
                                                {{ log.duration }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span class="text-[10px] text-slate-400 whitespace-nowrap">{{ log.timestamp }}</span>
                            </div>
                        </template>

                        <!-- Empty State -->
                        <div v-else class="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                            Belum ada proses apapun.
                        </div>
                    </div>

                    <!-- Footer Modal -->
                    <div
                        class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button @click="isHistoryOpen = false"
                            class="px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors">
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'

export type SyncState = 'idle' | 'loading' | 'success' | 'error'

export interface HistoryItem {
    state: SyncState
    message: string
    timestamp: string
    duration?: string
}

const syncStatus = ref<{ state: SyncState; message: string }>({
    state: 'idle',
    message: ''
})

// State untuk Modal & Local History Array
const isHistoryOpen = ref(false)
const historyLogs = ref<HistoryItem[]>([])

let statusResetTimeout: any = null
let apiLoadingTimeout: any = null
let startTime: number | null = null

// Helper penanganan Escape Key Global
const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isHistoryOpen.value) {
        isHistoryOpen.value = false
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
})

// Helper warna & ikon riwayat
const getLogIcon = (state: SyncState) => {
    switch (state) {
        case 'success': return 'heroicons:check-circle-20-solid'
        case 'error': return 'heroicons:exclamation-circle-20-solid'
        default: return 'heroicons:information-circle-20-solid'
    }
}

const getLogColor = (state: SyncState) => {
    switch (state) {
        case 'success': return 'text-emerald-500'
        case 'error': return 'text-rose-500'
        default: return 'text-slate-400'
    }
}

// Format waktu durasi eksekusi
const formatDuration = (ms: number): string => {
    if (ms < 1000) {
        return `${Math.round(ms)} ms`
    }
    return `${(ms / 1000).toFixed(2)} s`
}

// Fungsi utama untuk mengubah status & mencatat riwayat
const setStatus = (state: SyncState, message: string, autoResetDelay = 3000) => {
    if (statusResetTimeout) clearTimeout(statusResetTimeout)
    if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)

    if (state === 'loading') {
        startTime = performance.now()

        apiLoadingTimeout = setTimeout(() => {
            syncStatus.value = { state, message }
        }, 400)
    } else {
        syncStatus.value = { state, message }

        if (state !== 'idle' && message) {
            let durationStr: string | undefined = undefined

            if (startTime) {
                const durationMs = performance.now() - startTime
                durationStr = formatDuration(durationMs)
                startTime = null
            }

            const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

            historyLogs.value.unshift({
                state,
                message,
                timestamp: time,
                duration: durationStr
            })
        }
    }

    if ((state === 'success' || state === 'error') && autoResetDelay) {
        statusResetTimeout = setTimeout(() => {
            syncStatus.value = { state: 'idle', message: '' }
        }, autoResetDelay)
    }
}

// Cleanup timer dan listener window saat unmount
onBeforeUnmount(() => {
    if (statusResetTimeout) clearTimeout(statusResetTimeout)
    if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)
    window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
    setStatus,
    syncStatus,
    historyLogs
})
</script>