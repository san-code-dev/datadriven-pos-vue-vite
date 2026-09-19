import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'
import { useCompanyStore } from '@/stores/company'
import { useErrorModal } from '@/composables/useErrorModal'

declare module 'axios' {
    export interface AxiosRequestConfig {
        includeTenant?: boolean
        includeCompany?: boolean
        showErrorDialog?: boolean // Set false jika ingin me-bypass modal otomatis
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

        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }

        const shouldIncludeTenant = config.includeTenant ?? true
        const shouldIncludeCompany = config.includeCompany ?? true

        if (shouldIncludeTenant && tenantStore.selectedTenant?.id) {
            config.headers['x-tenant-id'] = tenantStore.selectedTenant.id
        } else {
            delete config.headers['x-tenant-id']
        }

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
        const status = error.response?.status
        const backendMessage = error.response?.data?.error || error.response?.data?.message

        if (backendMessage) {
            error.customMessage = backendMessage
        }

        // --- HANDLER HTTP 400 BAD REQUEST ---
        if (status === 400 && error.config?.showErrorDialog !== false) {
            const { showError } = useErrorModal()
            showError(
                backendMessage || 'Permintaan tidak dapat diproses. Periksa kembali input Anda.',
                'Peringatan salah input'
            )
        }

        // --- HANDLER HTTP 401 UNAUTHORIZED ---
        if (status === 401) {
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