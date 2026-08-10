<!-- src/App.vue -->
<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initGlobalSocket, disconnectSocket } from '@/lib/socket'
import "@revolist/revo-dropdown"

const authStore = useAuthStore()

// Pantau perubahan status login secara reaktif
watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
        if (isAuth) {
            // User sudah login (atau memuat ulang halaman saat sesi masih aktif)
            initGlobalSocket()
        } else {
            // User logout atau sesi habis
            disconnectSocket()
        }
    },
    { immediate: true } // Jalankan langsung saat aplikasi pertama kali dimuat
)
onUnmounted(() => {
    disconnectSocket()
})
</script>

<template>
    <router-view />
</template>