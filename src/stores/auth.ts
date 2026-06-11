import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 1. Definisikan tipe data untuk Menu (Sesuaikan dengan properti dari backend Anda)
export interface MenuItem {
    key: string
    icon: string
    label: string
    route: string
    api: string
    menuCategory: string
}

export const useAuthStore = defineStore('auth', () => {
    // --- STATE ---
    // Awalnya kosong, nanti diisi setelah hit API login berhasil
    const menus = ref<MenuItem[]>([])

    // --- GETTERS (COMPUTED) ---
    // Mengecek apakah user sudah login atau belum (dipakai di main.ts router guard)
    const isAuthenticated = computed(() => menus.value.length > 0)

    // --- ACTIONS ---
    // Fungsi untuk menyimpan menu baru saat login berhasil
    const setMenus = (newMenus: MenuItem[]) => {
        menus.value = newMenus
    }

    // Fungsi untuk membersihkan data saat logout atau token expired (401)
    const clearAuth = () => {
        menus.value = []
    }

    return {
        menus,
        isAuthenticated,
        setMenus,
        clearAuth
    }
}, {
    // 🔥 2. AKTIFKAN PERSISTENCE
    // Menggunakan konfigurasi object agar aman saat proses Build SSG/SSR (Server-Side)
    persist: {
        // Hanya simpan data di Local Storage jika dijalankan di sisi client (browser)
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        key: 'user_auth_data', // Nama key di Local Storage browser Anda
    }
})