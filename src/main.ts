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
  const tenantStore = useTenantStore(pinia) // 2. Inisialisasi Tenant Store dengan pinia instance

  const isLoginPage = to.path === '/'
  const isDatasetPage = to.path === '/dataset' // Halaman untuk memilih tenant

  // A. Jika belum login dan coba akses halaman terproteksi -> lempar ke Login
  if (!isLoginPage && !authStore.isAuthenticated) {
    return next('/')
  }

  // B. Jika sudah login dan mencoba akses halaman Login -> lempar ke Dataset
  if (isLoginPage && authStore.isAuthenticated) {
    return next('/dataset')
  }

  // C. Jika sudah login, BUKAN di halaman Dataset/Login, DAN Tenant BELUM dipilih -> lempar ke Dataset
  if (
    authStore.isAuthenticated &&
    !isDatasetPage &&
    !tenantStore.selectedTenant
  ) {
    return next('/dataset')
  }

  next()
})

window.TAB_ID = window.TAB_ID || Math.random().toString(36).substring(2)

const authChannel = new BroadcastChannel('auth_channel')

authChannel.onmessage = (event) => {
  const data = event.data

  // Cek apakah senderId SAMA DENGAN window.TAB_ID tab ini
  if (data?.type === 'LOGIN_SUCCESS' && data.senderId !== window.TAB_ID) {
    window.location.hash = '#/dataset'
    window.location.reload()
  }

  if (data?.type === 'LOGOUT' && data.senderId !== window.TAB_ID) {
    const authStore = useAuthStore(pinia)
    const tenantStore = useTenantStore(pinia)

    authStore.clearAuth()
    tenantStore.clearTenant()
    router.push('/')
  }
}

app.mount('#app')