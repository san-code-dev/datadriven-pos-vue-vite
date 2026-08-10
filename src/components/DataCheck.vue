<template>
    <div ref="panelRootRef" class="fixed z-[9999] font-mono text-xs select-none"
        :style="{ top: pos.y + 'px', left: pos.x + 'px', bottom: 'auto', right: 'auto' }">

        <!-- Toggle Button -->
        <button v-if="!isOpen" @click="isOpen = true" @pointerdown="startDrag"
            class="cursor-pointer active:cursor-grabbing flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg shadow-xl hover:opacity-90 transition-all font-semibold border border-slate-200 dark:border-slate-800">
            <Icon icon="mdi:drag" class="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span class="w-2 h-2 rounded-full shrink-0"
                :class="flashUpdate ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'"></span>
            <span class="font-bold text-slate-800 dark:text-slate-200 truncate">JSON Inspector</span>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{{ formattedData.length }}
                var</span>
        </button>

        <!-- Floating Panel -->
        <div v-else
            class="w-[480px] max-w-[92vw] max-h-[82vh] bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">

            <!-- Header / Drag Handle -->
            <div @pointerdown="startDrag"
                class="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing shrink-0">
                <div class="flex items-center gap-2 min-w-0">
                    <Icon icon="mdi:drag" class="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span class="w-2 h-2 rounded-full shrink-0"
                        :class="flashUpdate ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'"></span>
                    <span class="font-bold text-slate-800 dark:text-slate-200 truncate">JSON Inspector</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{{ formattedData.length }}
                        var</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button @click="resetPosition" title="Reset posisi"
                        class="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors">
                        <Icon icon="mdi:crosshairs-gps" class="w-3.5 h-3.5" />
                    </button>
                    <button @click="isOpen = false"
                        class="p-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors">
                        <Icon icon="mdi:close" class="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <!-- Toolbar: search + expand/collapse -->
            <div
                class="flex items-center gap-1.5 px-2.5 py-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
                <div class="relative flex-1">
                    <Icon icon="mdi:magnify"
                        class="w-3.5 h-3.5 absolute left-2 top-1.5 text-slate-400 dark:text-slate-500" />
                    <input v-model="searchQuery" type="text" placeholder="Filter key / value..."
                        class="w-full pl-7 pr-2 py-0 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <button @click="expandAll"
                    class="px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors whitespace-nowrap">
                    Expand
                </button>
                <button @click="collapseAll"
                    class="px-2 py-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors whitespace-nowrap">
                    Collapse
                </button>
            </div>

            <!-- Variable Items List -->
            <div class="p-2.5 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
                <div v-if="filteredData.length === 0"
                    class="text-center text-slate-400 dark:text-slate-600 py-6 text-[11px]">
                    Tidak ada data cocok dengan "{{ searchQuery }}"
                </div>

                <div v-for="item in filteredData" :key="item.index"
                    class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors"
                    :class="{ 'border-amber-500/50 dark:border-amber-500/50': item.justUpdated }">

                    <!-- Item Title Bar -->
                    <div @click="toggleItem(item.index)"
                        class="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/70 transition-colors">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="text-slate-400 dark:text-slate-500 text-[10px] shrink-0">
                                {{ activeIndexes.includes(item.index) ? '▼' : '▶' }}
                            </span>
                            <span class="font-bold text-amber-600 dark:text-amber-400 truncate">
                                #{{ item.index + 1 }} {{ item.label }}
                            </span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0"
                                :class="typeBadgeClass(item.data)">
                                {{ typeLabel(item.data) }}
                            </span>
                            <span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{{
                                sizeLabel(item.data) }}</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button @click.stop="copyJson(item.data, item.index)"
                                class="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded transition-colors">
                                {{ copiedIndex === item.index ? 'Copied ✓' : 'Copy' }}
                            </button>
                        </div>
                    </div>

                    <!-- JSON Content -->
                    <div v-if="activeIndexes.includes(item.index)"
                        class="p-2.5 text-[11px] bg-slate-100/70 dark:bg-slate-900 overflow-x-auto custom-scrollbar">
                        <pre contenteditable="true"
                            class="text-emerald-700 dark:text-emerald-300 leading-relaxed font-mono whitespace-pre">{{ formatJSON(item.data) }}</pre>

                        <!-- Item footer Bar -->
                        <div @click="toggleItem(item.index)"
                            class="flex flex-col px-3 py-1.5 bg-slate-100 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800/70 transition-colors">
                            <button @click.stop="copyJson(item.data, item.index)"
                                class="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded transition-colors">
                                {{ copiedIndex === item.index ? 'Saved ✓' : 'save' }}
                            </button>

                        </div>
                    </div>


                </div>
            </div>

            <!-- Footer -->
            <div
                class="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between shrink-0">
                <span>Update terakhir: {{ lastUpdatedLabel }}</span>
                <span>Drag header untuk pindah</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
    variable: any[] | Record<string, any> | any
}>()

const isOpen = ref(false)
const activeIndexes = ref<number[]>([])
const copiedIndex = ref<number | null>(null)
const searchQuery = ref('')

const flashUpdate = ref(false)
const lastUpdatedAt = ref<Date | null>(null)
const justUpdatedIndexes = ref<Set<number>>(new Set())
let flashTimeout: ReturnType<typeof setTimeout> | null = null

const lastUpdatedLabel = computed(() =>
    lastUpdatedAt.value ? lastUpdatedAt.value.toLocaleTimeString() : '-'
)

const formattedData = computed(() => {
    let list: { label: string; data: any }[] = []

    if (Array.isArray(props.variable)) {
        list = props.variable.map((val, idx) => ({
            label: typeof val === 'object' && val !== null && !Array.isArray(val)
                ? Object.keys(val)[0] || `Variable ${idx + 1}`
                : `Variable ${idx + 1}`,
            data: val
        }))
    } else if (typeof props.variable === 'object' && props.variable !== null) {
        list = Object.entries(props.variable).map(([key, val]) => ({ label: key, data: val }))
    } else {
        list = [{ label: 'Value', data: props.variable }]
    }

    return list.map((item, index) => ({
        ...item,
        index,
        justUpdated: justUpdatedIndexes.value.has(index)
    }))
})

const filteredData = computed(() => {
    if (!searchQuery.value.trim()) return formattedData.value
    const q = searchQuery.value.toLowerCase()
    return formattedData.value.filter(item => {
        if (item.label.toLowerCase().includes(q)) return true
        try {
            return JSON.stringify(item.data).toLowerCase().includes(q)
        } catch {
            return false
        }
    })
})

watch(
    () => props.variable,
    (newVal, oldVal) => {
        lastUpdatedAt.value = new Date()
        flashUpdate.value = true
        if (flashTimeout) clearTimeout(flashTimeout)
        flashTimeout = setTimeout(() => { flashUpdate.value = false }, 1200)

        try {
            const newList = Array.isArray(newVal) ? newVal : Object.values(newVal || {})
            const oldList = Array.isArray(oldVal) ? oldVal : Object.values(oldVal || {})
            const changed = new Set<number>()
            newList.forEach((v, i) => {
                if (JSON.stringify(v) !== JSON.stringify(oldList[i])) changed.add(i)
            })
            justUpdatedIndexes.value = changed
            setTimeout(() => { justUpdatedIndexes.value = new Set() }, 1200)
        } catch {
            // ignore
        }
    },
    { deep: true }
)

const toggleItem = (index: number) => {
    const pos = activeIndexes.value.indexOf(index)
    if (pos >= 0) activeIndexes.value.splice(pos, 1)
    else activeIndexes.value.push(index)
}

const expandAll = () => {
    activeIndexes.value = filteredData.value.map(item => item.index)
}
const collapseAll = () => {
    activeIndexes.value = []
}

const formatJSON = (val: any) => {
    try {
        return JSON.stringify(val, null, 2)
    } catch (e) {
        return String(val)
    }
}

const copyJson = (val: any, index: number) => {
    navigator.clipboard.writeText(formatJSON(val))
    copiedIndex.value = index
    setTimeout(() => { copiedIndex.value = null }, 1500)
}

const typeLabel = (val: any): string => {
    if (val === null) return 'null'
    if (Array.isArray(val)) return 'array'
    return typeof val
}

const typeBadgeClass = (val: any): string => {
    const t = typeLabel(val)
    const map: Record<string, string> = {
        array: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
        object: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
        string: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
        number: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
        boolean: 'bg-pink-500/15 text-pink-600 dark:text-pink-300',
        null: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
        undefined: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
    }
    return map[t] || 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
}

const sizeLabel = (val: any): string => {
    if (val === null || val === undefined) return ''
    if (Array.isArray(val)) return `${val.length} item`
    if (typeof val === 'object') return `${Object.keys(val).length} key`
    if (typeof val === 'string') return `${val.length} char`
    return ''
}

const STORAGE_KEY = 'json-inspector-pos'
const panelRootRef = ref<HTMLElement | null>(null)
const pos = ref({ x: 16, y: 16 })
const dragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const defaultPosition = () => ({
    x: Math.max(16, window.innerWidth - 500),
    y: Math.max(16, window.innerHeight - 500)
})

const clampToViewport = () => {
    const el = panelRootRef.value
    if (!el) return

    const rect = el.getBoundingClientRect()
    const panelWidth = rect.width || 480
    const panelHeight = rect.height || 400

    const minX = 0
    const minY = 0
    const maxX = window.innerWidth - panelWidth
    const maxY = window.innerHeight - panelHeight

    pos.value.x = Math.min(Math.max(minX, pos.value.x), Math.max(minX, maxX))
    pos.value.y = Math.min(Math.max(minY, pos.value.y), Math.max(minY, maxY))
}

const startDrag = (e: PointerEvent) => {
    dragging.value = true
    const rect = panelRootRef.value?.getBoundingClientRect()
    dragOffset.value = {
        x: e.clientX - (rect?.left ?? 0),
        y: e.clientY - (rect?.top ?? 0)
    }
    window.addEventListener('pointermove', onDrag)
    window.addEventListener('pointerup', stopDrag)
}

const onDrag = (e: PointerEvent) => {
    if (!dragging.value) return

    let newX = e.clientX - dragOffset.value.x
    let newY = e.clientY - dragOffset.value.y

    const el = panelRootRef.value
    const panelWidth = el?.offsetWidth || 480
    const panelHeight = el?.offsetHeight || 400

    const minX = 0
    const minY = 0
    const maxX = window.innerWidth - panelWidth
    const maxY = window.innerHeight - panelHeight

    pos.value = {
        x: Math.min(Math.max(minX, newX), Math.max(minX, maxX)),
        y: Math.min(Math.max(minY, newY), Math.max(minY, maxY))
    }
}

const stopDrag = () => {
    dragging.value = false
    clampToViewport()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value))
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', stopDrag)
}

const resetPosition = () => {
    pos.value = defaultPosition()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value))
}

onMounted(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        pos.value = saved ? JSON.parse(saved) : defaultPosition()
    } catch {
        pos.value = defaultPosition()
    }
    requestAnimationFrame(clampToViewport)
    window.addEventListener('resize', clampToViewport)
})

onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', stopDrag)
    window.removeEventListener('resize', clampToViewport)
    if (flashTimeout) clearTimeout(flashTimeout)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
}
</style>