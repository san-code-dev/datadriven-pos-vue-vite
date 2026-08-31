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

const app = createApp(App)

// 💡 TIPS ELECTRON: Gunakan Hash History (createWebHashHistory) 
// Ini mencegah error "Page Not Found / 404" saat merefresh halaman di dalam Electron
const router = createRouter({
  history: createWebHashHistory(),
  routes: setupLayouts(routes),
})

app.use(pinia)
app.use(router)

// 1. Suntikkan router ke Axios
injectRouterToAxios(router)

// 2. Router Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(pinia)

  const requiresAuth = to.path !== '/'
  const requiresGuest = to.path === '/'

  if (requiresAuth && !authStore.isAuthenticated) {
    return next('/')
  }

  if (requiresGuest && authStore.isAuthenticated) {
    return next('/dataset')
  }

  next()
})

app.mount('#app')