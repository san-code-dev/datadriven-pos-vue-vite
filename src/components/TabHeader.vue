<script setup>
import { ref, nextTick } from 'vue'
import { useTabStore } from '@/stores/tabs'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()
const tabStore = useTabStore()

// ===================================================
// LOGIKA DRAG & DROP HORIZONTAL MENGIKUTI MOUSE
// ===================================================
const containerRef = ref(null)
const activeDragIndex = ref(null)
const isDragging = ref(false)

let startX = 0
let currentX = 0
let initialLeft = 0
let tabElements = []
let tabWidths = []
let tabPositions = []

const DRAG_THRESHOLD = 5

const switchTab = (tab) => {
    router.push(tab.route)
}

const handleCloseTab = (tabId) => {
    const fallbackRoute = tabStore.closeTab(tabId)
    if (fallbackRoute) router.push(fallbackRoute)
}

const handlePointerDown = (event, index) => {
    if (event.target.closest('button') || event.button === 2) return

    activeDragIndex.value = index
    isDragging.value = false
    startX = event.clientX
    currentX = event.clientX

    const container = containerRef.value
    tabElements = Array.from(container.querySelectorAll('.tab-item'))
    tabWidths = tabElements.map(el => el.offsetWidth)

    let accumulatedLeft = 0
    tabPositions = tabElements.map((el, i) => {
        const left = accumulatedLeft
        accumulatedLeft += tabWidths[i]
        return left
    })

    initialLeft = tabPositions[index]
    event.target.closest('.tab-item').setPointerCapture(event.pointerId)
}

const handlePointerMove = (event, index) => {
    if (activeDragIndex.value !== index) return

    currentX = event.clientX
    const deltaX = currentX - startX

    if (!isDragging.value) {
        if (Math.abs(deltaX) > DRAG_THRESHOLD) {
            isDragging.value = true
        } else {
            return
        }
    }

    const newLeft = initialLeft + deltaX
    const draggedEl = tabElements[index]
    draggedEl.style.transform = `translateX(${deltaX}px)`
    draggedEl.style.zIndex = '50'

    tabPositions.forEach((pos, i) => {
        if (i === index) return

        const targetCenter = pos + tabWidths[i] / 2
        const draggedCenter = newLeft + tabWidths[index] / 2

        if (index < i && draggedCenter > targetCenter) {
            tabElements[i].style.transform = `translateX(${-tabWidths[index]}px)`
        } else if (index > i && draggedCenter < targetCenter) {
            tabElements[i].style.transform = `translateX(${tabWidths[index]}px)`
        } else {
            tabElements[i].style.transform = ''
        }
    })
}

const handlePointerUp = (event, index) => {
    if (activeDragIndex.value !== index) return

    if (!isDragging.value) {
        switchTab(tabStore.openedTabs[index])
        activeDragIndex.value = null
        try { event.target.closest('.tab-item').releasePointerCapture(event.pointerId) } catch (e) { }
        return
    }

    const deltaX = currentX - startX
    const newLeft = initialLeft + deltaX
    let finalIndex = index

    tabPositions.forEach((pos, i) => {
        if (i === index) return
        const targetCenter = pos + tabWidths[i] / 2
        const draggedCenter = newLeft + tabWidths[index] / 2

        if (index < i && draggedCenter > targetCenter) {
            finalIndex = Math.max(finalIndex, i)
        } else if (index > i && draggedCenter < targetCenter) {
            finalIndex = Math.min(finalIndex, i)
        }
    })

    try { event.target.closest('.tab-item').releasePointerCapture(event.pointerId) } catch (e) { }

    tabElements.forEach(el => {
        el.style.transition = 'none'
        el.style.transform = ''
        el.style.zIndex = ''
    })

    nextTick(() => {
        if (finalIndex !== index) {
            tabStore.moveTab(index, finalIndex)
        }
        activeDragIndex.value = null
        isDragging.value = false
    })
}

// ===================================================
// LOGIKA CONTEXT MENU (KLIK KANAN)
// ===================================================
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const targetTabId = ref(null)
const targetTabIndex = ref(null)

const openContextMenu = (event, tabId, index) => {
    event.preventDefault()

    targetTabId.value = tabId
    targetTabIndex.value = index
    contextMenuX.value = event.clientX
    contextMenuY.value = event.clientY
    showContextMenu.value = true

    window.addEventListener('click', closeContextMenu)
}

const closeContextMenu = () => {
    showContextMenu.value = false
    window.removeEventListener('click', closeContextMenu)
}

// 1. Fitur Tambahan: Reload Tab
const reloadTab = () => {
    if (!targetTabId.value) return

    // Pemicu render ulang komponen secara lokal
    if (typeof tabStore.refreshTab === 'function') {
        tabStore.refreshTab(targetTabId.value)
    } else {
        // Fallback jika lupa memasukkan fungsi ke action store
        const tab = tabStore.openedTabs.find(t => t.id === targetTabId.value)
        if (tab) tab.refreshKey = (tab.refreshKey || 0) + 1
    }

    // Pindahkan fokus router ke tab yang disegarkan
    router.push(targetTabId.value)
    closeContextMenu()
}

// 2. Fitur Tambahan: Tutup Tab Sebelah Kanan
const closeTabsToRight = () => {
    if (targetTabIndex.value === null) return

    const tabsToKeep = tabStore.openedTabs.slice(0, targetTabIndex.value + 1)
    // Pastikan dashboard tidak ikut terhapus jika posisinya di kanan (opsional)
    const dashboard = tabStore.openedTabs.find(t => t.id === '/dashboard')
    if (dashboard && !tabsToKeep.find(t => t.id === '/dashboard')) {
        tabsToKeep.unshift(dashboard)
    }

    tabStore.openedTabs = tabsToKeep
    router.push(targetTabId.value)
    closeContextMenu()
}

const closeOtherTabs = () => {
    if (!targetTabId.value) return
    if (typeof tabStore.closeOthers === 'function') {
        tabStore.closeOthers(targetTabId.value)
    } else {
        tabStore.openedTabs = tabStore.openedTabs.filter(
            t => t.id === targetTabId.value || t.id === '/dashboard'
        )
    }
    router.push(targetTabId.value)
    closeContextMenu()
}

const closeAllTabs = () => {
    tabStore.clearTabs()
    router.push('/dashboard')
    closeContextMenu()
}
</script>

<template>
    <div ref="containerRef"
        class="flex-shrink-0 flex items-center flex-wrap bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative min-h-[41px]">

        <div v-for="(tab, index) in tabStore.openedTabs" :key="tab.id" @pointerdown="handlePointerDown($event, index)"
            @pointermove="handlePointerMove($event, index)" @pointerup="handlePointerUp($event, index)"
            @contextmenu.prevent="openContextMenu($event, tab.id, index)"
            class="tab-item flex items-center gap-2 px-4 text-sm border-r cursor-grab active:cursor-grabbing relative min-w-[120px] h-[41px] touch-none select-none"
            :class="[
                // Tambahkan border-r secara konsisten di sini agar garis kanan tidak hilang/muncul garis putih
                'border-gray-200 dark:border-gray-700',

                tabStore.activeTabId === tab.id
                    ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border-b-transparent mb-[-1px] pb-[2px] z-10'
                    : 'bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b hover:bg-gray-50 dark:hover:bg-gray-700/50',

                activeDragIndex !== null && isDragging
                    ? (activeDragIndex === index ? 'shadow-lg bg-white dark:bg-gray-800 border-l border-r border-gray-200 dark:border-gray-600 z-[100]' : 'transition-transform duration-200')
                    : 'transition-transform duration-200'
            ]">

            <!-- Perbaikan pada span: Ubah ke flex items-center biasa agar teks tidak terdorong ke atas -->
            <span class="truncate pr-4 capitalize flex items-center h-full select-none" :data-text="tab.label">
                {{ tab.label }}
            </span>

            <button v-if="tab.id !== '/dashboard'" @click.stop="handleCloseTab(tab.id)"
                class="absolute right-2 p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 flex items-center justify-center z-10"
                tabindex="-1" title="Tutup Tab">
                <Icon icon="heroicons:x-mark-20-solid" class="w-3.5 h-3.5" />
            </button>

            <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 scale-x-0 transition-transform duration-200 origin-center"
                :class="{ 'scale-x-100': tabStore.activeTabId === tab.id }"></div>
        </div>
    </div>

    <Teleport to="body">
        <div v-if="showContextMenu"
            class="fixed z-[9999] min-w-[150px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 text-xs text-gray-600 dark:text-gray-300 select-none tracking-wide"
            :style="{ top: `${contextMenuY}px`, left: `${contextMenuX}px` }">

            <button @click="reloadTab"
                class="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <Icon icon="heroicons:arrow-path" class="w-3.5 h-3.5 text-gray-400" />
                <span>Segarkan Tab</span>
            </button>

            <hr class="border-gray-100 dark:border-gray-700 my-0.5" />

            <button @click="closeTabsToRight"
                class="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <Icon icon="heroicons:arrow-long-right" class="w-3.5 h-3.5 text-gray-400" />
                <span>Tutup Bagian Kanan</span>
            </button>

            <button @click="closeOtherTabs"
                class="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <Icon icon="heroicons:arrows-right-left" class="w-3.5 h-3.5 text-gray-400" />
                <span>Tutup Tab Lainnya</span>
            </button>

            <hr class="border-gray-100 dark:border-gray-700 my-0.5" />

            <button @click="closeAllTabs"
                class="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 text-red-500 dark:text-red-400 transition-colors font-medium">
                <Icon icon="heroicons:trash" class="w-3.5 h-3.5" />
                <span>Tutup Semua Tab</span>
            </button>
        </div>
    </Teleport>
</template>

<style scoped>
.tab-item {
    will-change: transform;
}
</style>