<template>
    <div class="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700 text-xs">
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
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'

export type SyncState = 'idle' | 'loading' | 'success' | 'error'

const syncStatus = ref<{ state: SyncState; message: string }>({
    state: 'idle',
    message: ''
})

let statusResetTimeout: any = null
let apiLoadingTimeout: any = null

// Fungsi utama untuk mengubah status
const setStatus = (state: SyncState, message: string, autoResetDelay = 3000) => {
    if (statusResetTimeout) clearTimeout(statusResetTimeout)
    if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)

    if (state === 'loading') {
        apiLoadingTimeout = setTimeout(() => {
            syncStatus.value = { state, message }
        }, 400)
    } else {
        syncStatus.value = { state, message }
    }

    if ((state === 'success' || state === 'error') && autoResetDelay) {
        statusResetTimeout = setTimeout(() => {
            syncStatus.value = { state: 'idle', message: '' }
        }, autoResetDelay)
    }
}

// Otomatis bersihkan timer ketika komponen di-unmount
onBeforeUnmount(() => {
    if (statusResetTimeout) clearTimeout(statusResetTimeout)
    if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)
})

// Expose fungsi ke induk agar bisa dipanggil via ref
defineExpose({
    setStatus,
    syncStatus
})
</script>