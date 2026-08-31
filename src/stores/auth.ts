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
    const user = ref<UserInfo | null>(null)
    const token = ref<string | null>(null)

    // --- GETTERS ---
    const isAuthenticated = computed(() => !!token.value && user.value !== null)

    // --- ACTIONS ---
    const setMenus = (newMenus: MenuItem[]) => {
        menus.value = newMenus
    }

    const setUser = (newUser: UserInfo) => {
        user.value = newUser
    }

    const setToken = (newToken: string) => { // 🔥 2. Tambahkan action setToken
        token.value = newToken
    }

    const clearAuth = () => {
        menus.value = []
        user.value = null
        token.value = null // 🔥 3. Hapus token saat logout
    }

    return {
        menus,
        user,
        token,
        isAuthenticated,
        setMenus,
        setUser,
        setToken,
        clearAuth
    }
}, {
    persist: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        key: 'user_auth_data',
    }
})