import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'
import { useCompanyStore } from '@/stores/company'

// 1. Extend AxiosRequestConfig agar TypeScript mengenali opsi includeTenant & includeCompany
declare module 'axios' {
    export interface AxiosRequestConfig {
        includeTenant?: boolean
        includeCompany?: boolean
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
        const companyStore = useCompanyStore()

        // Kirim Authorization Bearer Token jika ada
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }

        const shouldIncludeTenant = config.includeTenant ?? true
        const shouldIncludeCompany = config.includeCompany ?? true

        // Sisipkan x-tenant-code HANYA jika includeTenant = true dan tenant tersedia
        if (shouldIncludeTenant && tenantStore.selectedTenant?.id) {
            config.headers['x-tenant-id'] = tenantStore.selectedTenant.id
        } else {
            delete config.headers['x-tenant-id']
        }

        // Sisipkan x-company-code HANYA jika includeCompany = true dan company tersedia
        if (shouldIncludeCompany && companyStore.selectedCompany?.id) {
            config.headers['x-company-id'] = companyStore.selectedCompany.id
        } else {
            delete config.headers['x-company-id']
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// ==========================================
// 3. RESPONSE INTERCEPTOR
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

        // Normalisasi pesan error dari backend ke properti custom 'customMessage'
        const backendMessage = error.response?.data?.error || error.response?.data?.message
        if (backendMessage) {
            error.customMessage = backendMessage
        }

        return Promise.reject(error)
    }
)
export default api