<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useSidebarStore } from '@/stores/sideBar'

const router = useRouter()
const sidebarStore = useSidebarStore()

// State kontrol Modal & Loading
const showLogoutModal = ref(false)
const isLoggingOut = ref(false)
const dialogRef = ref<HTMLDialogElement | null>(null)

// State untuk navigasi tombol: 'cancel' atau 'confirm'
const activeButton = ref<'cancel' | 'confirm'>('cancel')

// Fungsi buka modal dengan auto-focus native
async function openModal() {
    showLogoutModal.value = true
    // Reset pilihan default ke tombol 'Batal' setiap kali modal dibuka
    activeButton.value = 'cancel'
    await nextTick()
    if (dialogRef.value) {
        dialogRef.value.showModal()
    }
}

// Fungsi tutup modal secara bersih
function closeModal() {
    if (dialogRef.value) {
        dialogRef.value.close()
    }
    showLogoutModal.value = false
}

// Menangani navigasi keyboard panah dan aksi enter
function handleKeyDown(event: KeyboardEvent) {
    if (isLoggingOut.value) return

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        // Berpindah antar tombol 'cancel' dan 'confirm'
        activeButton.value = activeButton.value === 'cancel' ? 'confirm' : 'cancel'
    } else if (event.key === 'Enter') {
        // Eksekusi aksi berdasarkan tombol yang aktif saat ini
        if (activeButton.value === 'confirm') {
            submitLogout()
        } else {
            closeModal()
        }
    } else if (event.key === 'Escape') {
        // Tetap izinkan ESC sebagai fallback standar accessibility modal jika diinginkan
        closeModal()
    }
}

// Eksekusi Logout API
async function submitLogout() {
    if (isLoggingOut.value) return
    isLoggingOut.value = true

    try {

        await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        })

        closeModal()
        await router.push('/')
    } catch (err) {
        console.error('Logout failed:', err)
        closeModal()
        await router.push('/')
    } finally {
        isLoggingOut.value = false
    }
}
</script>

<template>
    <div>
        <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button @click="openModal" type="button"
                class="flex items-center w-full h-12 transition-all rounded cursor-pointer text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                :class="sidebarStore.isCollapsed ? 'justify-center px-0' : 'justify-between px-5'">

                <div class="flex items-center" :class="sidebarStore.isCollapsed ? 'space-x-0' : 'space-x-3'">
                    <Icon icon="mdi:logout" class="text-xl opacity-90" />
                    <span v-show="!sidebarStore.isCollapsed" class="font-semibold text-sm">
                        Logout
                    </span>
                </div>
            </button>
        </div>

        <Teleport to="body">
            <dialog ref="dialogRef" v-if="showLogoutModal" @cancel.prevent="!isLoggingOut ? closeModal() : null"
                @keydown.prevent="handleKeyDown"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm w-full h-full max-w-none max-h-none border-none outline-none open:backdrop:bg-transparent">

                <div
                    class="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700 transform transition-all animate-in fade-in zoom-in-95 duration-150 text-gray-900 dark:text-gray-200">

                    <div class="flex place-items-center space-x-3 text-amber-500 dark:text-amber-400 mb-3">
                        <Icon icon="mdi:alert-circle-outline" class="text-3xl" />
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                            Konfirmasi Keluar
                        </h3>
                    </div>

                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                        Apakah Anda yakin ingin mengakhiri sesi ini? Gunakan tombol
                        <kbd
                            class="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">←</kbd>
                        atau
                        <kbd
                            class="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">→</kbd>
                        untuk memilih, lalu tekan
                        <kbd
                            class="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">Enter</kbd>.
                    </p>

                    <div class="flex justify-end space-x-3">
                        <button type="button" :disabled="isLoggingOut" @click="closeModal"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50 outline-none"
                            :class="activeButton === 'cancel' ? 'ring-2 ring-amber-500 bg-gray-200 dark:bg-gray-600' : ''">
                            Batal
                        </button>

                        <button type="button" :disabled="isLoggingOut" @click="submitLogout"
                            class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-all disabled:opacity-50 outline-none"
                            :class="activeButton === 'confirm' ? 'ring-2 ring-red-400 dark:ring-red-300 bg-red-700 dark:bg-red-600' : ''">
                            <Icon v-if="isLoggingOut" icon="line-md:loading-twotone-loop" class="w-4 h-4" />
                            <span>{{ isLoggingOut ? '' : 'Ya, Keluar' }}</span>
                        </button>
                    </div>

                </div>
            </dialog>
        </Teleport>
    </div>
</template>