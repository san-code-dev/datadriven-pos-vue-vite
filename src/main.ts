import '@revolist/revo-dropdown'
import '@/assets/css/tailwind.css'
import '@/assets/css/style.css'
import 'uno.css'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from '@/App.vue'
import pinia from '@/plugins/pinia'

import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'

import { injectRouterToAxios } from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant' // 1. Impor Tenant Store
import { useCompanyStore } from './stores/company'

const app = createApp(App)

const router = createRouter({
  history: createWebHashHistory(),
  routes: setupLayouts(routes),
})

app.use(pinia)
app.use(router)

injectRouterToAxios(router)

// 2. Router Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(pinia)
  const companyStore = useCompanyStore(pinia)
  const tenantStore = useTenantStore(pinia)

  const isLoginPage = to.path === '/'
  const isCompanyPage = to.path === '/company'
  const isDatasetPage = to.path === '/dataset' // Halaman pilih Tenant

  // 1. Jika belum login dan mencoba akses halaman terproteksi -> Lempar ke Login
  if (!authStore.isAuthenticated && !isLoginPage) {
    return next('/')
  }

  // 2. Jika sudah login dan mencoba membuka halaman Login ('/')
  if (authStore.isAuthenticated && isLoginPage) {
    if (!companyStore.selectedCompany) {
      return next('/company')
    }
    if (!tenantStore.selectedTenant) {
      return next('/dataset')
    }
    return next('/dashboard') // Atau halaman utama app Anda
  }

  // 3. Guard Company: Jika sudah login tapi belum pilih Company, DILARANG ke mana pun selain /company
  if (authStore.isAuthenticated && !companyStore.selectedCompany && !isCompanyPage) {
    return next('/company')
  }

  // 4. Guard Tenant: Jika sudah pilih Company tapi belum pilih Tenant, DILARANG ke mana pun selain /dataset
  if (
    authStore.isAuthenticated &&
    companyStore.selectedCompany &&
    !tenantStore.selectedTenant &&
    !isDatasetPage &&
    !isCompanyPage
  ) {
    return next('/dataset')
  }

  next()
})

window.TAB_ID = window.TAB_ID || Math.random().toString(36).substring(2)

const authChannel = new BroadcastChannel('auth_channel')

authChannel.onmessage = (event) => {
  const data = event.data

  if (data?.type === 'LOGIN_SUCCESS' && data.senderId !== window.TAB_ID) {
    const tenantStore = useTenantStore(pinia)
    const companyStore = useCompanyStore(pinia)

    // Clear state lama sebelum pindah/reload
    companyStore.clearCompany()
    tenantStore.clearTenant()

    window.location.hash = '#/dataset'
    window.location.reload()
  }

  if (data?.type === 'LOGOUT' && data.senderId !== window.TAB_ID) {
    const authStore = useAuthStore(pinia)
    const tenantStore = useTenantStore(pinia)
    const companyStore = useCompanyStore(pinia) // Jangan lupa instansiasi companyStore

    authStore.clearAuth()
    companyStore.clearCompany()
    tenantStore.clearTenant()
    router.push('/')
  }
}

app.mount('#app')