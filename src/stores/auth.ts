// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MenuItem {
    key: string
    icon: string
    label: string
    route: string
    api: string
    menuCategory: string
}

export interface UserInfo {
    id: number
    email: string
    role?: string
}

export const useAuthStore = defineStore('auth', () => {
    // --- STATE ---
    const menus = ref<MenuItem[]>([])
    const user = ref<UserInfo | null>(null) // 🔥 TAMBAHKAN STATE USER

    // --- GETTERS ---
    const isAuthenticated = computed(() => menus.value.length > 0 && user.value !== null)

    // --- ACTIONS ---
    const setMenus = (newMenus: MenuItem[]) => {
        menus.value = newMenus
    }

    const setUser = (newUser: UserInfo) => { // 🔥 TAMBAHKAN ACTION SET USER
        user.value = newUser
    }

    const clearAuth = () => {
        menus.value = []
        user.value = null // 🔥 BERSIHKAN USER SAAT LOGOUT
    }

    return {
        menus,
        user,
        isAuthenticated,
        setMenus,
        setUser,
        clearAuth
    }
}, {
    persist: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        key: 'user_auth_data',
    }
})