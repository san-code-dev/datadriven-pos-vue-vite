<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'

import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'

import Menu from '@/components/Menu.vue'
import TabHeader from '@/components/TabHeader.vue'
import { useTabStore } from '@/stores/tabs'
import DashboardContent from '@/components/DashboardContent.vue'
import MasterComponent from '@/components/dynamic/MasterComponent.vue'
import TransactionComponent from '@/components/dynamic/TransactionComponent.vue'
import { useFilterStore } from '@/stores/filter'

const route = useRoute()
const router = useRouter()
const tabStore = useTabStore()
const authStore = useAuthStore()
const filterStore = useFilterStore()

const isError = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Controller untuk pembatalan request Axios & timer debounce
const currentFetchController = ref(null)
let debounceTimer = null

// Durasi jeda sebelum revalidate ke API (ms)
const REVALIDATE_DEBOUNCE_MS = 400

const componentsMap = {
    'dashboard': DashboardContent,
    'master': MasterComponent,
    'transaction': TransactionComponent,
    'transaction-detail': TransactionComponent,
}

const getComponentByType = (type) => {
    if (!type) console.error('component type not defined from api response');
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

// Fungsi utama eksekusi HTTP Request
const executeApiFetch = async (currentPath, matchedMenu, existingTab) => {
    // Buat AbortController baru untuk request yang akan berjalan
    currentFetchController.value = new AbortController()

    try {
        const cleanPath = currentPath.replace(/\/+$/, '')
        const requestUrl = `${cleanPath}/get-all`

        const isMasterComponent = matchedMenu.type === 'master'
        const activeFilters = isMasterComponent ? filterStore.getFiltersByTab(currentPath) : null

        const params = {}
        if (isMasterComponent && activeFilters) {
            params.filter = JSON.stringify(activeFilters)
        }

        const response = await api.get(requestUrl, {
            params,
            signal: currentFetchController.value.signal
        })
        const responseData = response.data

        if (responseData) {
            if (existingTab) {
                // Update cache Pinia secara diam-diam / revalidate
                existingTab.apiResponse = responseData
            } else {
                tabStore.addTab({
                    id: currentPath,
                    label: responseData.label || matchedMenu.label,
                    route: currentPath,
                    apiResponse: responseData,
                    currentMenu: matchedMenu
                })
            }
            isError.value = false
        } else if (!existingTab) {
            isError.value = true
            errorMessage.value = 'Server mengembalikan skema kosong.'
        }
    } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
            return // Abaikan jika dibatalkan sengaja
        }
        console.error('Fetch metadata failed:', err)
        // Tampilkan screen error HANYA jika tidak ada data cache yang bisa dipakai
        if (!existingTab) {
            isError.value = true
            errorMessage.value = err.response?.data?.message || err.message || 'Terjadi kesalahan jaringan server.'
        }
    } finally {
        isLoading.value = false
        currentFetchController.value = null
    }
}

const fetchSchemaFromApi = () => {
    const currentPath = route.path
    ensureDashboardTabExists()

    // 1. CLEAR PENDING TIMEOUT & REQUEST SEBELUMNYA
    if (debounceTimer) clearTimeout(debounceTimer)
    if (currentFetchController.value) {
        currentFetchController.value.abort()
    }

    // 2. JIKA DASHBOARD: Switch instan
    if (currentPath === '/' || currentPath === '/dashboard') {
        tabStore.activeTabId = '/dashboard'
        isError.value = false
        isLoading.value = false
        return
    }

    const pathSegments = currentPath.split('/').filter(Boolean)
    const rootPath = pathSegments.length ? `/${pathSegments[0]}` : '/'
    const matchedMenu = authStore.menus.find(m => m.route === rootPath)

    if (!matchedMenu) {
        isError.value = true
        isLoading.value = false
        errorMessage.value = 'Halaman tidak ditemukan atau Anda tidak memiliki hak akses.'
        return
    }

    // 3. CEK CACHE PINIA
    const existingTab = tabStore.openedTabs.find(t => t.id === currentPath)

    if (existingTab && existingTab.apiResponse) {
        // TAMPILKAN INSTAN dari Pinia
        tabStore.activeTabId = currentPath
        isError.value = false
        isLoading.value = false

        // SET DEBOUNCE TIMER untuk Revalidate di Background
        debounceTimer = setTimeout(() => {
            executeApiFetch(currentPath, matchedMenu, existingTab)
        }, REVALIDATE_DEBOUNCE_MS)

    } else {
        // JIKA BELUM ADA CACHE: Tampilkan Loading & Langsung Fetch
        isLoading.value = true
        isError.value = false
        tabStore.activeTabId = currentPath

        executeApiFetch(currentPath, matchedMenu, existingTab)
    }
}

const handleGlobalKeyDown = (event) => {
    if (event.repeat || isLoading.value) return
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
    }
}

onMounted(() => {
    ensureDashboardTabExists()
    window.addEventListener('keydown', handleGlobalKeyDown, true)
})

onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (currentFetchController.value) {
        currentFetchController.value.abort()
    }
    window.removeEventListener('keydown', handleGlobalKeyDown, true)
})

watch(() => route.path, fetchSchemaFromApi, { immediate: true })
</script>

<template>
    <div class="flex min-h-screen bg-gray-100 dark:bg-gray-950 select-none">
        <Menu />
        <div
            class="flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 h-screen max-h-screen flex flex-col overflow-hidden w-full min-w-0">
            <TabHeader />
            <div class="flex-1 min-h-0 relative overflow-hidden w-full">
                <!-- Loading Spinner hanya muncul jika tab BELUM punya cache -->
                <div v-if="isLoading"
                    class="absolute inset-0 bg-gray-50/60 dark:bg-gray-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-50 animate-delayed-fade">
                    <Icon icon="heroicons:arrow-path-20-solid"
                        class="w-7 h-7 text-emerald-500 dark:text-emerald-400 animate-spin" />
                    <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Memuat data
                        halaman...</span>
                </div>

                <!-- Tab Render -->
                <div v-for="tab in tabStore.openedTabs" :key="tab.id + (tab.refreshKey || 0)"
                    v-show="tabStore.activeTabId === tab.id && !isError" :data-tab-id="tab.id" class="w-full h-full">
                    <component v-if="tab.apiResponse && getComponentByType(tab.apiResponse.type)"
                        :is="getComponentByType(tab.apiResponse.type)" :menu="tab.currentMenu"
                        :schemaData="tab.apiResponse" />
                </div>

                <!-- Error Screen -->
                <div v-if="isError && !isLoading"
                    class="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in max-w-sm mx-auto">
                    <Icon icon="heroicons:exclamation-triangle-20-solid" class="w-10 h-10 text-rose-500 mb-2" />
                    <h1 class="text-base font-bold text-gray-800 dark:text-gray-100">Gagal Memuat Halaman</h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words line-clamp-3">
                        {{ errorMessage }}
                    </p>
                    <button @click="fetchSchemaFromApi" type="button"
                        class="mt-4 px-4 py-1.5 bg-transparent border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs">
                        <Icon icon="heroicons:arrow-path-16-solid" class="w-3.5 h-3.5" />
                        <span>Coba Lagi</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes delayedFade {
    0% {
        opacity: 0;
    }

    80% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

.animate-delayed-fade {
    animation: delayedFade 0.5s ease-in-out forwards;
}

.animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>