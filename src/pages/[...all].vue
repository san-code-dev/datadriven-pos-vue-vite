<script setup>
import { useRoute } from 'vue-router'
import { computed, ref, watch, defineAsyncComponent } from 'vue'

// Ambil semua data terexport (Product, Penjualan, dll) dari file konsep data
import * as MockAPI from '@/new-konsep-data'
import Menu from '@/components/Menu.vue'

const route = useRoute()

// STATES
const currentMenu = ref(null)
const apiResponse = ref(null)
const isLoading = ref(false)
const isError = ref(false)

/**
 * MAPPING DYNAMIC LAZY COMPONENT
 */
const componentsMap = {
    'master': defineAsyncComponent(() => import('@/components/dynamic/MasterComponent.vue')),
    'transaction': defineAsyncComponent(() => import('@/components/dynamic/TransactionComponent.vue')),
}

const ActiveComponent = computed(() => {
    if (!apiResponse.value?.type) return null
    return componentsMap[apiResponse.value.type] || null
})

/**
 * LOGIKA REQUEST API & PENCARIAN VARIABEL DATA
 */
const fetchSchemaFromApi = () => {
    isLoading.value = true
    isError.value = false
    apiResponse.value = null
    currentMenu.value = null

    const currentPath = route.path // Contoh: '/product' atau '/penjualan'

    // 1. Ambil segmentasi dasar untuk mencocokkan rute menu utama
    const pathSegments = currentPath.split('/').filter(Boolean)
    const rootPath = pathSegments.length ? `/${pathSegments[0]}` : '/'

    // Cari config-nya di AccessMenu
    const matchedMenu = MockAPI.AccessMenu.find(m => m.route === rootPath)

    if (!matchedMenu) {
        isError.value = true
        isLoading.value = false
        return
    }

    currentMenu.value = matchedMenu

    // 2. Cari nama variabel data yang diexport di new-konsep-data.ts (Misal: Product, Penjualan)
    let targetVariableKey = matchedMenu.key

    // Kasus Khusus A: Audit History (/product/audit)
    if (currentPath.endsWith('/audit') || currentPath.includes('/audit-history')) {
        targetVariableKey = `${matchedMenu.key}AuditHistory`
    }
    // Kasus Khusus B: Sub-route Detail (/penjualan/1)
    else if (currentPath !== matchedMenu.route) {
        targetVariableKey = `Detail${matchedMenu.key}`
    }

    // 3. Ambil objek konseptual REST API dari file data
    const responseData = MockAPI[targetVariableKey]

    if (responseData) {
        // Simulasi delay response server 250ms
        setTimeout(() => {
            apiResponse.value = responseData
            isLoading.value = false
        }, 250)
    } else {
        // Jika variabel data berpasangan belum dibuat / di-export di file data.ts
        isError.value = true
        isLoading.value = false
    }
}

// Setiap kali halaman berganti akibat trigger klik di menu, jalankan request API simulasi ini
watch(() => route.path, fetchSchemaFromApi, { immediate: true })
</script>

<template>
    <div class="flex min-h-screen bg-gray-100 dark:bg-gray-950">
        <!-- Sidebar Menu -->
        <Menu />

        <!-- Area Konten Dinamis Halaman -->
        <div
            class="flex-1 ps-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 h-screen max-h-screen flex flex-col overflow-hidden w-full min-w-0">

            <!-- KEADAAN 1: LOADING DATA FROM API -->
            <div v-if="isLoading" class="flex items-center justify-center h-full min-h-[400px]">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto">
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Memanggil REST API <code class="text-emerald-500 font-mono">{{ currentMenu?.api }}</code> ...
                    </p>
                </div>
            </div>

            <!-- KEADAAN 2: BERHASIL MENDAPATKAN RESPON & RENDER COMPONENT -->
            <div v-else-if="apiResponse && ActiveComponent">
                <!-- Data API dikirim penuh ke komponen anak melalui prop schemaData -->
                <component :is="ActiveComponent" :menu="currentMenu" :schemaData="apiResponse" :key="route.path" />
            </div>

            <!-- KEADAAN 3: ERROR / ROUTE NOT FOUND -->
            <div v-else-if="isError || !ActiveComponent" class="flex items-center justify-center h-full min-h-[400px]">
                <div
                    class="text-center p-8 bg-white dark:bg-gray-800 shadow-xl rounded-2xl max-w-md border border-gray-100 dark:border-gray-700">
                    <span class="text-5xl block mb-3">⚠️</span>
                    <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Gagal Memuat Halaman</h1>
                    <p class="text-sm text-gray-400 dark:text-gray-400 mt-2">
                        Konfigurasi data atau variabel ekspor API untuk rute
                        <code
                            class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-rose-500 text-xs font-mono">{{ route.path }}</code>
                        tidak ditemukan pada file konsep data.
                    </p>
                </div>
            </div>

        </div>
    </div>
</template>