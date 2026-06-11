import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Buat variabel penampung router kosong agar tidak perlu import manual
let routerInstance: any = null

// Fungsi untuk menyuntikkan router dari main.ts
export function injectRouterToAxios(router: any) {
    routerInstance = router
}

const api = axios.create({
    baseURL: 'http://localhost:3000/api/', // Sesuaikan domain API Anda
    withCredentials: true // Wajib TRUE agar HttpOnly Cookie terkirim
})

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Jika backend merespon dengan status 401 (Expired / Unauthorized)
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore()

            // 1. Bersihkan data menu di Pinia & Local Storage
            authStore.clearAuth()

            // 2. Lakukan redirect menggunakan router yang sudah disuntikkan
            if (routerInstance && routerInstance.currentRoute.value.path !== '/') {
                await routerInstance.push('/')
            }
        }
        return Promise.reject(error)
    }
)

export default api