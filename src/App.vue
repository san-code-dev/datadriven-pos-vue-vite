<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initGlobalSocket, disconnectSocket } from '@/lib/socket'
import "@revolist/revo-dropdown"

const authStore = useAuthStore()
const handleKeyDown = async (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.key === 'F5') {
        event.preventDefault()

        // Cukup catat penanda dan langsung reload instan
        sessionStorage.setItem('is_reloading', 'true')
        window.location.reload()
    }
}

// Pantau perubahan status login secara reaktif
watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
        if (isAuth) {
            initGlobalSocket()
        } else {
            disconnectSocket()
        }
    },
    { immediate: true }
)

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)

    // Jika ada proses reload
    if (sessionStorage.getItem('is_reloading') === 'true') {
        // 1. Batalkan timer loader (jika Vue selesai dimuat < 250ms, loader BATTAL muncul)
        if ((window as any).__reloaderTimer) {
            clearTimeout((window as any).__reloaderTimer)
        }

        // 2. Jika loader keburu muncul (proses > 250ms), sembunyikan dengan fade-out
        const nativeReloader = document.getElementById('native-reloader')
        if (nativeReloader) {
            nativeReloader.classList.remove('active')
        }

        // 3. Hapus penanda
        sessionStorage.removeItem('is_reloading')
    }

    if (window.electronAPI?.appReady) {
        window.electronAPI.appReady()
    }
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    disconnectSocket()
})
</script>

<template>
    <router-view />
    <ErrorModal />
</template>

<style>
revogr-data .arrow-down {
    top: 15px !important;
}

duet-date-picker {
    --duet-color-primary: #059669;
    --duet-color-primary-text: #ffffff;
    --duet-color-text: #1f2937;
    --duet-color-text-active: #ffffff;
    --duet-color-background: #ffffff;
    --duet-color-surface: #f9fafb;
    --duet-color-border: #e5e7eb;
    --duet-color-radius: 0.75rem;
}

.dark duet-date-picker {
    --duet-color-primary: #10b981;
    --duet-color-text: #f3f4f6;
    --duet-color-background: #1f2937;
    --duet-color-surface: #111827;
    --duet-color-border: #374151;
}

.duet-date__dialog {
    background-color: transparent !important;
    color: inherit !important;
    overflow: hidden !important;
}

.duet-date__dialog-content {
    color: var(--duet-color-text) !important;
    border-color: var(--duet-color-border) !important;
    background-color: var(--duet-color-background) !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
}

.duet-date__select select {
    color: var(--duet-color-text) !important;
    background-color: transparent !important;
}

.duet-date__prev svg,
.duet-date__next svg,
.duet-date__close svg,
.duet-date__toggle svg {
    fill: currentColor !important;
    color: var(--duet-color-text) !important;
}

.duet-date__prev,
.duet-date__next,
.duet-date__close {
    color: var(--duet-color-text) !important;
    background-color: transparent !important;
    border-radius: 0.375rem !important;
}

.duet-date__prev:hover,
.duet-date__next:hover,
.duet-date__close:hover {
    background-color: rgba(16, 185, 129, 0.15) !important;
    color: #059669 !important;
}

.dark .duet-date__prev:hover,
.dark .duet-date__next:hover,
.dark .duet-date__close:hover {
    color: #34d399 !important;
}

.duet-date__table-header {
    color: #9ca3af !important;
    font-weight: 600 !important;
}

.duet-date__day {
    color: var(--duet-color-text) !important;
    border-radius: 0.5rem !important;
}

.duet-date__day:hover {
    background-color: #ecfdf5 !important;
    color: #047857 !important;
}

.dark .duet-date__day:hover {
    background-color: #374151 !important;
    color: #34d399 !important;
}

.duet-date__day[aria-pressed="true"],
.duet-date__day.is-selected {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: bold !important;
}

.duet-date__day.is-today {
    border: 2px solid #10b981 !important;
    font-weight: bold !important;
}

.duet-date__input-wrapper {
    background-color: white !important;
    border: none !important;
    border-radius: mpme !important;
    outline: none !important;
    box-shadow: none !important;
}

.duet-date__input {
    background-color: transparent !important;
    color: var(--duet-color-text) !important;
    outline: none !important;
    box-shadow: none !important;
}

.duet-date__toggle {
    color: var(--duet-color-text) !important;
    background: transparent !important;
    outline: none !important;
    box-shadow: none !important;
}

.duet-date__toggle:hover {
    color: #059669 !important;
}

.duet-date__select {
    background-color: var(--duet-color-surface) !important;
    border: 1px solid var(--duet-color-border) !important;
    border-radius: 0.5rem !important;
    padding: 0.25rem 0.5rem !important;
}

.duet-date__select select {
    background-color: transparent !important;
    color: var(--duet-color-text) !important;
    font-weight: 500 !important;
}

.duet-date__select select option {
    background-color: var(--duet-color-background) !important;
    color: var(--duet-color-text) !important;
}

.duet-date__select-label {
    color: var(--duet-color-text) !important;
    font-weight: 500 !important;
}

.duet-date__select-label svg {
    color: var(--duet-color-text) !important;
    fill: currentColor !important;
}
</style>