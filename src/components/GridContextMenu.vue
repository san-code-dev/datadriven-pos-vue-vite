<template>
    <Teleport to="body">
        <div v-if="isOpen" ref="menuRef"
            class="fixed z-50 min-w-[190px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
            :style="{ top: `${position.y}px`, left: `${position.x}px` }" @contextmenu.prevent>
            <!-- Menu Item: Refresh -->
            <button type="button" @click="executeRefresh"
                class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                <Icon icon="cuida:refresh-outline" class="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Refresh Data</span>
            </button>

            <div class="my-1 border-t border-slate-100 dark:border-slate-800"></div>

            <!-- Menu Item: Reset Layout -->
            <button type="button" @click="executeResetLayout"
                class="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-amber-600 dark:text-amber-400 transition-colors">
                <Icon icon="mdi:restore" class="w-4 h-4" />
                <span>Atur Ulang Tatak Letak</span>
            </button>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import { useTabStore } from '@/stores/tabs'
import { useTenantStore } from '@/stores/tenant'

const props = defineProps<{
    /** Referensi ke instance RevoGrid atau wrapper utamanya */
    gridRef: any
    /** Kunci unik form/menu (contoh: 'master' atau menu.key) */
    formKey: string
    /** Callback fungsi untuk mengambil data ulang dari server */
    onRefresh?: () => Promise<void> | void
    /** Callback opsi jika ingin memuat ulang schema/kolom lokal */
    onResetLayoutComplete?: () => Promise<void> | void
}>()

const route = useRoute()
const tabStore = useTabStore()
const tenantStore = useTenantStore()

const isOpen = ref(false)
const position = ref({ x: 0, y: 0 })
const menuRef = ref<HTMLElement | null>(null)

// 1. Tentukan Kunci Grid Pinia secara otomatis
const getGridStoreKey = () => {
    const tenantCode = tenantStore.selectedTenant?.code || 'default'
    const key = props.formKey.toLowerCase()
    return `${tenantCode}-${key}-master_grid`
}

// 2. Intersept & Handler Klik Kanan
const handleContextMenu = (e: MouseEvent) => {
    // Cek apakah klik kanan berasal dari dalam elemen RevoGrid
    const target = e.target as HTMLElement
    const isInsideGrid = target.closest('revo-grid') || target.closest('.rgRow') || target.closest('.rgHeader')

    if (!isInsideGrid) return

    e.preventDefault()

    // Mencegah menu keluar dari batasan layar (Viewport Boundary)
    const menuWidth = 190
    const menuHeight = 90
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    let x = e.clientX
    let y = e.clientY

    if (x + menuWidth > screenWidth) x -= menuWidth
    if (y + menuHeight > screenHeight) y -= menuHeight

    position.value = { x, y }
    isOpen.value = true
}

// 3. Menutup Menu Saat Klik di Luar / Scroll
const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        isOpen.value = false
    }
}

// 4. Aksi: Refresh Data
const executeRefresh = async () => {
    isOpen.value = false
    if (props.onRefresh) {
        await props.onRefresh()
    }
}

// 5. Aksi: Reset Tatak Letak (Layout)
const executeResetLayout = async () => {
    isOpen.value = false

    if (!confirm('Apakah Anda yakin ingin mengatur ulang tata letak grid?')) {
        return
    }
    const activeTabId = tabStore.activeTabId || route.path
    const gridKey = getGridStoreKey()

    // A. Hapus/Kosongkan Konfigurasi Kolom & Koordinat Sel di Pinia
    if (activeTabId) {
        tabStore.updateGridConfig(activeTabId, gridKey, {
            coordinate: { x: 0, y: 0 },
            column: []
        })
    }

    // B. Kembalikan Posisi Fokus Sel ke Atas Kiri (0,0)
    const gridEl = props.gridRef?.$el || props.gridRef
    if (gridEl?.setCellsFocus) {
        gridEl.setCellsFocus({ x: 0, y: 0 }, { x: 0, y: 0 })
    }

    // C. Jalankan Callback Reload Schema / Kolom Utama
    if (props.onResetLayoutComplete) {
        await props.onResetLayoutComplete()
    }
}

// Lifecycle Hooks untuk Event Listener Global
onMounted(() => {
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('scroll', handleClickOutside, true)
})

onBeforeUnmount(() => {
    window.removeEventListener('contextmenu', handleContextMenu)
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', handleClickOutside, true)
})
</script>