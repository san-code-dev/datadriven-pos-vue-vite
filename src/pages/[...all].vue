<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, defineAsyncComponent, onMounted, onBeforeUnmount } from 'vue'
import * as MockAPI from '@/new-konsep-data'
import Menu from '@/components/Menu.vue'
import { useTabStore } from '@/stores/tabs'

const route = useRoute()
const router = useRouter()
const tabStore = useTabStore()

const isError = ref(false)

// MAPPING KOMPONEN
const componentsMap = {
    'dashboard': defineAsyncComponent(() => import('@/components/DashboardContent.vue')),
    'master': defineAsyncComponent(() => import('@/components/dynamic/MasterComponent.vue')),
    'transaction': defineAsyncComponent(() => import('@/components/dynamic/TransactionComponent.vue')),
}

const getComponentByType = (type) => {
    return componentsMap[type] || null
}

// Fungsi jangkar: Jamin dashboard selalu ada di list tab
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

const fetchSchemaFromApi = () => {
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
    const matchedMenu = MockAPI.AccessMenu.find(m => m.route === rootPath)

    if (!matchedMenu) {
        isError.value = true
        return
    }

    let targetVariableKey = matchedMenu.key
    if (currentPath.endsWith('/audit') || currentPath.includes('/audit-history')) {
        targetVariableKey = `${matchedMenu.key}AuditHistory`
    } else if (currentPath !== matchedMenu.route) {
        targetVariableKey = `Detail${matchedMenu.key}`
    }

    const responseData = MockAPI[targetVariableKey]

    if (responseData) {
        tabStore.addTab({
            id: currentPath,
            label: responseData.label || matchedMenu.label,
            route: currentPath,
            apiResponse: responseData,
            currentMenu: matchedMenu
        })
    } else {
        isError.value = true
    }
}

const switchTab = (tab) => {
    router.push(tab.route)
}

const handleCloseTab = (tabId) => {
    const fallbackRoute = tabStore.closeTab(tabId)
    if (fallbackRoute) router.push(fallbackRoute)
}

// Tambahkan fungsi pembantu ini di dalam <script setup> Komponen Utama (Parent)
const focusGridInActiveTab = () => {
    // Berikan jeda mikroskopis agar DOM selesai memperbarui state tab aktif
    nextTick(() => {
        setTimeout(() => {
            // Cari elemen pembungkus tab aktif yang sedang tampil (v-show yang aktif)
            const activeTabEl = document.querySelector('div[style*="display: block"] revo-grid, div:not([style*="display: none"]) revo-grid')

            if (activeTabEl) {
                // 1. Berikan fokus secara native ke elemen Web Component-nya
                activeTabEl.focus()

                // 2. Tembak fungsi internal Web Component RevoGrid untuk mengaktifkan selnya
                if (typeof activeTabEl.setCellsFocus === 'function') {
                    // Cari tahu apakah ada koordinat tersimpan, jika tidak default ke (0,0)
                    // Menggunakan koordinat (0,0) memastikan kotak fokus visual langsung muncul
                    activeTabEl.setCellsFocus({ x: 0, y: 0 }, { x: 0, y: 0 })
                }
            }
        }, 50) // Jeda 50ms sangat ideal untuk transisi tab
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
        switchTab(targetTab)

        // PANGGIL FUNGSI FOKUS DI SINI SETELAH PINDAH TAB
        focusGridInActiveTab()
    }
}

onMounted(() => {
    ensureDashboardTabExists()
    // Daftarkan event listener global saat komponen dimuat
    window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
    // Bersihkan event listener agar tidak bocor (memory leak) ke halaman lain
    window.removeEventListener('keydown', handleKeyDown)
})

watch(() => route.path, fetchSchemaFromApi, { immediate: true })
</script>

<template>
    <div class="flex min-h-screen bg-gray-100 dark:bg-gray-950">
        <Menu />

        <div
            class="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 h-screen max-h-screen flex flex-col overflow-hidden w-full min-w-0">

            <div
                class="flex-shrink-0 flex items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto select-none no-scrollbar">
                <div v-for="tab in tabStore.openedTabs" :key="tab.id" @click="switchTab(tab)"
                    class="flex items-center gap-2 px-4 py-2.5 text-sm border-r border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-150 group relative min-w-[120px]"
                    :class="tabStore.activeTabId === tab.id
                        ? 'bg-gray-50 dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'">

                    <span
                        class="truncate pr-4 capitalize inline-flex flex-col items-center justify-center after:content-[attr(data-text)] after:font-semibold after:h-0 after:invisible after:overflow-hidden select-none"
                        :data-text="tab.label">
                        {{ tab.label }}
                    </span>
                    <button v-if="tab.id !== '/dashboard'" @click.stop="handleCloseTab(tab.id)"
                        class="absolute right-2 p-0.5 rounded-md text-gray-400 hover:text-rose-500 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs z-10">
                        ✕
                    </button>

                    <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 scale-x-0 transition-transform duration-200 origin-center"
                        :class="{ 'scale-x-100': tabStore.activeTabId === tab.id }"></div>
                </div>
            </div>

            <div class="flex-1 min-h-0 relative overflow-hidden w-full">

                <keep-alive :max="5">
                    <div v-for="tab in tabStore.openedTabs" :key="tab.id" v-show="tabStore.activeTabId === tab.id"
                        :data-tab-id="tab.id" class="w-full h-full">
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