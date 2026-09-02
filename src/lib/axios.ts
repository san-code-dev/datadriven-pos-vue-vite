import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'

// 1. Extend AxiosRequestConfig agar TypeScript mengenali opsi includeTenant
declare module 'axios' {
    export interface AxiosRequestConfig {
        includeTenant?: boolean
    }
}

let routerInstance: any = null

export function injectRouterToAxios(router: any) {
    routerInstance = router
}

const api = axios.create({
    baseURL: 'http://localhost:3000/api/',
    withCredentials: true
})

// ==========================================
// 2. REQUEST INTERCEPTOR (Token & Tenant Header)
// ==========================================
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const authStore = useAuthStore()
        const tenantStore = useTenantStore()

        // Kirim Authorization Bearer Token
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }

        // Default value set ke true jika tidak didefinisikan secara eksplisit
        const shouldIncludeTenant = config.includeTenant ?? true

        // Sisipkan x-tenant-code HANYA jika includeTenant bernilai true dan tenant tersedia
        if (shouldIncludeTenant && tenantStore.selectedTenant?.code) {
            config.headers['x-tenant-code'] = tenantStore.selectedTenant.code
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// ==========================================
// 3. RESPONSE INTERCEPTOR (Penanganan Error 401)
// ==========================================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore()
            const tenantStore = useTenantStore()

            authStore.clearAuth()
            tenantStore.clearTenant()

            if (routerInstance && routerInstance.currentRoute.value.path !== '/') {
                await routerInstance.push('/')
            }
        }
        return Promise.reject(error)
    }
)

export default api