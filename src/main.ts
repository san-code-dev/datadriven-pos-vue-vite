import '@revolist/revo-dropdown'
import '@/assets/css/tailwind.css'
import '@/assets/css/style.css'
import 'uno.css'
import pinia from '@/plugins/pinia'

import { ViteSSG } from 'vite-ssg'
import App from '@/App.vue'

import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'

// 🔥 1. Import fungsi penyuntik dari file Axios Anda
import { injectRouterToAxios } from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'

export const createApp = ViteSSG(
  App,
  {
    routes: setupLayouts(routes),
    base: import.meta.env.BASE_URL,
  },
  ({ app, router, routes, isClient, initialState }) => {
    app.use(pinia)

    if (import.meta.env.SSR) {
      initialState.pinia = pinia.state.value
    } else {
      pinia.state.value = initialState.pinia || {}
    }

    // 🔥 2. SUNTIKKAN ROUTER KE AXIOS (Hanya jalankan di sisi Client / Browser)
    if (isClient) {
      injectRouterToAxios(router)
    }

    // 🔥 3. PASANG ROUTER GUARD DI SINI
    router.beforeEach((to, from, next) => {
      // Pastikan kita passing instance 'pinia' agar store bisa diakses di luar komponen Vue
      const authStore = useAuthStore(pinia)

      // Cek meta rute (atau sesuaikan dengan nama halaman Anda)
      const requiresAuth = to.path !== '/' // Jika bukan halaman utama (login), berarti butuh auth
      const requiresGuest = to.path === '/' // Halaman utama/login adalah halaman guest

      // Kondisi A: Mencoba masuk halaman internal tapi BELUM login
      if (requiresAuth && !authStore.isAuthenticated) {
        return next('/')
      }

      // Kondisi B: Sudah login tapi mencoba balik ke halaman login (/)
      if (requiresGuest && authStore.isAuthenticated) {
        return next('/dataset')
      }

      next()
    })
  },
)
