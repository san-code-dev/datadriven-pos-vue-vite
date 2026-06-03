<script setup>
import { ref, nextTick } from 'vue'
import { useTabStore } from '@/stores/tabs'
import { useRouter } from 'vue-router'

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

const DRAG_THRESHOLD = 5 // Batas toleransi gerakan mikro mouse (piksel)

const switchTab = (tab) => {
    router.push(tab.route)
}

const handleCloseTab = (tabId) => {
    const fallbackRoute = tabStore.closeTab(tabId)
    if (fallbackRoute) router.push(fallbackRoute)
}

const handlePointerDown = (event, index) => {
    // Jangan drag jika yang diklik adalah tombol close (✕)
    if (event.target.closest('button')) return

    activeDragIndex.value = index
    isDragging.value = false
    startX = event.clientX
    currentX = event.clientX

    const container = containerRef.value
    tabElements = Array.from(container.querySelectorAll('.tab-item'))

    // Ambil ukuran lebar komponen tab saat ini
    tabWidths = tabElements.map(el => el.offsetWidth)

    // Kalkulasi posisi X awal masing-masing tab
    let accumulatedLeft = 0
    tabPositions = tabElements.map((el, i) => {
        const left = accumulatedLeft
        accumulatedLeft += tabWidths[i]
        return left
    })

    initialLeft = tabPositions[index]

    // Capture pointer agar tracking mouse tetap berjalan meski keluar dari batas element tab
    event.target.closest('.tab-item').setPointerCapture(event.pointerId)
}

const handlePointerMove = (event, index) => {
    if (activeDragIndex.value !== index) return

    currentX = event.clientX
    const deltaX = currentX - startX

    // Proteksi berkedut: Cek apakah gerakan tangan user sudah melewati batas threshold minimum
    if (!isDragging.value) {
        if (Math.abs(deltaX) > DRAG_THRESHOLD) {
            isDragging.value = true
        } else {
            return
        }
    }

    const newLeft = initialLeft + deltaX

    // Geser posisi tab yang sedang ditarik secara horizontal mengikuti mouse
    const draggedEl = tabElements[index]
    draggedEl.style.transform = `translateX(${deltaX}px)`
    draggedEl.style.zIndex = '50'

    // Buat efek animasi bergeser minggir untuk tab tetangga secara real-time
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

    // Jika pelepasan klik terjadi tanpa adanya drag yang valid (hanya klik biasa)
    if (!isDragging.value) {
        switchTab(tabStore.openedTabs[index])
        activeDragIndex.value = null
        try {
            event.target.closest('.tab-item').releasePointerCapture(event.pointerId)
        } catch (e) { }
        return
    }

    const deltaX = currentX - startX
    const newLeft = initialLeft + deltaX
    let finalIndex = index

    // Tentukan indeks slot array baru berdasarkan posisi drop terakhir
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

    try {
        event.target.closest('.tab-item').releasePointerCapture(event.pointerId)
    } catch (e) { }

    // Reset paksa transisi CSS & manipulasi transform style sebelum struktur DOM dirombak oleh Pinia
    tabElements.forEach(el => {
        el.style.transition = 'none'
        el.style.transform = ''
        el.style.zIndex = ''
    })

    // Eksekusi perubahan susunan data di dalam store
    nextTick(() => {
        if (finalIndex !== index) {
            tabStore.moveTab(index, finalIndex)
        }
        activeDragIndex.value = null
        isDragging.value = false
    })
}
</script>

<template>
    <div ref="containerRef"
        class="flex-shrink-0 flex items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar relative h-[41px]">

        <div v-for="(tab, index) in tabStore.openedTabs" :key="tab.id" @pointerdown="handlePointerDown($event, index)"
            @pointermove="handlePointerMove($event, index)" @pointerup="handlePointerUp($event, index)"
            class="tab-item flex items-center gap-2 px-4 py-2.5 text-sm border-r border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing relative min-w-[120px] h-full touch-none select-none"
            :class="[
                tabStore.activeTabId === tab.id
                    ? 'bg-gray-50 dark:bg-gray-900 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50',

                // Menentukan kapan animasi transisi horizontal boleh berjalan
                activeDragIndex !== null && isDragging
                    ? (activeDragIndex === index ? 'shadow-lg bg-white dark:bg-gray-800 border-l border-r border-gray-200 dark:border-gray-600 z-50' : 'transition-transform duration-200')
                    : 'transition-transform duration-200'
            ]">

            <span
                class="truncate pr-4 capitalize inline-flex flex-col items-center justify-center after:content-[attr(data-text)] after:h-0 after:invisible after:overflow-hidden select-none"
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
</template>

<style scoped>
.tab-item {
    will-change: transform;
}
</style>