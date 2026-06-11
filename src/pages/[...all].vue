<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

// 1. Ganti import MockData dengan instance Axios global Anda
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'

import Menu from '@/components/Menu.vue'
import TabHeader from '@/components/TabHeader.vue'
import { useTabStore } from '@/stores/tabs'
import DashboardContent from '@/components/DashboardContent.vue'
import MasterComponent from '@/components/dynamic/MasterComponent.vue'
import TransactionComponent from '@/components/dynamic/TransactionComponent.vue'

const route = useRoute()
const router = useRouter()
const tabStore = useTabStore()
const authStore = useAuthStore() // Gunakan authStore untuk mencocokkan menu yang diizinkan
const isError = ref(false)

// MAPPING KOMPONEN SECARA STATIS
const componentsMap = {
    'dashboard': DashboardContent,
    'master': MasterComponent,
    'transaction': TransactionComponent,
    'transaction-detail': TransactionComponent,
}

const getComponentByType = (type) => {
    return componentsMap[type] || null
}

const ensureDashboardTabExists = () => {
    const hasDashboard = tabStore.openedTabs.some(t => t.id === '/dashboard')
    if (!hasDashboard) {
        tabStore.addTab({
            id: '/dashboard',
            label: 'Dashboard',
            route: '/dashboard',
            apiResponse: { type: 'dashboard' },
            currentMenu: { key: 'Dashboard', label: 'Dashboard', route: '/dashboard' }
        })
    }
}

// 2. Ubah fungsi sinkronisasi dari MockData menjadi HIT API ASYNC ke Express Backend
const fetchSchemaFromApi = async () => {
    const currentPath = route.path
    ensureDashboardTabExists()

    if (currentPath === '/' || currentPath === '/dashboard') {
        tabStore.activeTabId = '/dashboard'
        return
    }

    const existingTab = tabStore.openedTabs.find(t => t.id === currentPath)
    if (existingTab && existingTab.apiResponse) {
        tabStore.activeTabId = currentPath
        return
    }

    isError.value = false

    const pathSegments = currentPath.split('/').filter(Boolean)
    const rootPath = pathSegments.length ? `/${pathSegments[0]}` : '/'

    // Ambil menu dari data real Pinia (bukan mock file)
    const matchedMenu = authStore.menus.find(m => m.route === rootPath)

    if (!matchedMenu) {
        isError.value = true
        return
    }

    try {
        // 🔥 DI SINI KUNCINYA: Tembak endpoint Express secara dinamis.
        // Jika currentPath adalah '/product', maka url-nya menjadi '/product/'
        const response = await api.get(`${currentPath}/`)
        const responseData = response.data
        console.log('API Response for', currentPath, ':', responseData)
        if (responseData) {
            tabStore.addTab({
                id: currentPath,
                label: responseData.label || matchedMenu.label,
                route: currentPath,
                apiResponse: responseData, // Otomatis berisi schema, permissions, dan data dari Prisma
                currentMenu: matchedMenu
            })
        } else {
            isError.value = true
        }
    } catch (err) {
        // Jika API error atau token expired (401), Interceptor akan menangani redirect keluar.
        // Kita cukup set UI error jika terjadi kegagalan jaringan biasa selain 401.
        console.error('Fetch metadata failed:', err)
        isError.value = true
    }
}

const focusGridInActiveTab = () => {
    nextTick(() => {
        setTimeout(() => {
            const activeTabEl = document.querySelector('div[style*="display: block"] revo-grid, div:not([style*="display: none"]) revo-grid')

            if (activeTabEl) {
                activeTabEl.focus()
                if (typeof activeTabEl.setCellsFocus === 'function') {
                    activeTabEl.setCellsFocus({ x: 0, y: 0 }, { x: 0, y: 0 })
                }
            }
        }, 50)
    })
}

const handleKeyDown = (event) => {
    if (event.ctrlKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        const activeEl = document.activeElement
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
            return
        }

        event.preventDefault()

        const tabs = tabStore.openedTabs
        if (tabs.length <= 1) return

        const currentIndex = tabs.findIndex(tab => tab.id === tabStore.activeTabId)
        if (currentIndex === -1) return

        let nextIndex
        if (event.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
        } else {
            nextIndex = (currentIndex + 1) % tabs.length
        }

        const targetTab = tabs[nextIndex]
        router.push(targetTab.route)
        focusGridInActiveTab()
    }
}

onMounted(() => {
    ensureDashboardTabExists()
    window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
})

// Pasang watcher untuk mendeteksi perubahan rute
watch(() => route.path, fetchSchemaFromApi, { immediate: true })
</script>

<template>
    <div class="flex min-h-screen bg-gray-100 dark:bg-gray-950 select-none">
        <Menu />

        <div
            class="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 h-screen max-h-screen flex flex-col overflow-hidden w-full min-w-0">

            <TabHeader />

            <div class="flex-1 min-h-0 relative overflow-hidden w-full">

                <keep-alive :max="5">
                    <div v-for="tab in tabStore.openedTabs" :key="tab.id + (tab.refreshKey || 0)"
                        v-show="tabStore.activeTabId === tab.id" :data-tab-id="tab.id" class="w-full h-full">

                        <component v-if="tab.apiResponse && getComponentByType(tab.apiResponse.type)"
                            :is="getComponentByType(tab.apiResponse.type)" :menu="tab.currentMenu"
                            :schemaData="tab.apiResponse" />
                    </div>
                </keep-alive>

                <div v-if="isError" class="flex items-center justify-center h-full">
                    <div
                        class="text-center p-8 bg-white dark:bg-gray-800 shadow-xl rounded-2xl max-w-md border border-gray-100 dark:border-gray-700">
                        <span class="text-5xl block mb-3">⚠️</span>
                        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Gagal Memuat Halaman</h1>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>