import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

let routerInstance: any = null

export function injectRouterToAxios(router: any) {
    routerInstance = router
}

const api = axios.create({
    baseURL: 'http://localhost:3000/api/',
    withCredentials: true
})

// ==========================================
// 1. REQUEST INTERCEPTOR (Kirim Token ke Backend)
// ==========================================
api.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()

        // Kirim Authorization Bearer Token jika token tersedia di Pinia/LocalStorage
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// ==========================================
// 2. RESPONSE INTERCEPTOR (Penanganan Error 401)
// ==========================================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore()

            // 1. Bersihkan data auth (menus, user, token)
            authStore.clearAuth()

            // 2. Redirect ke halaman Login jika tidak sedang di halaman Login
            if (routerInstance && routerInstance.currentRoute.value.path !== '/') {
                await routerInstance.push('/')
            }
        }
        return Promise.reject(error)
    }
)

export default api