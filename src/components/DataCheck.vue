<template>
    <div class="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
        <!-- Toggle Button Panel -->
        <button @click="isOpen = !isOpen"
            class="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-xl hover:opacity-90 transition-all font-semibold border border-slate-700 dark:border-slate-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>JSON Inspector ({{ formattedData.length }})</span>
            <span class="text-[10px] opacity-70">{{ isOpen ? '▼' : '▲' }}</span>
        </button>

        <!-- Floating Panel -->
        <div v-if="isOpen"
            class="mt-2 w-[450px] max-w-[90vw] max-h-[80vh] bg-slate-900 dark:bg-slate-950 text-slate-200 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">

            <!-- Variable Items List -->
            <div class="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                <div v-for="(item, index) in formattedData" :key="index"
                    class="bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
                    <!-- Item Title Bar -->
                    <div @click="toggleItem(index)"
                        class="flex items-center justify-between px-3 py-1.5 bg-slate-800/40 cursor-pointer hover:bg-slate-800/70 transition-colors select-none">
                        <span class="font-bold text-amber-400">
                            #{{ index + 1 }} {{ item.label }}
                        </span>
                        <div class="flex items-center gap-2">
                            <!-- Copy Button -->
                            <button @click.stop="copyJson(item.data, index)"
                                class="px-2 py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">
                                {{ copiedIndex === index ? 'Copied! ✓' : 'Copy' }}
                            </button>
                            <span class="text-slate-500 text-[10px]">
                                {{ activeIndexes.includes(index) ? '▼' : '▶' }}
                            </span>
                        </div>
                    </div>

                    <!-- JSON Content -->
                    <div v-if="activeIndexes.includes(index)" class="p-2.5 overflow-x-auto text-[11px] bg-slate-950">
                        <pre
                            class="text-emerald-300 leading-relaxed font-mono whitespace-pre-wrap break-all">{{ formatJSON(item.data) }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    // Menerima array variabel atau object variabel
    variable: any[] | Record<string, any> | any
}>()

const isOpen = ref(false)
const activeIndexes = ref<number[]>([0]) // Default membuka item pertama
const copiedIndex = ref<number | null>(null)

// Format dan mapping input variabel agar rapi
const formattedData = computed(() => {
    if (Array.isArray(props.variable)) {
        return props.variable.map((val, idx) => ({
            label: typeof val === 'object' && val !== null && !Array.isArray(val)
                ? Object.keys(val)[0] || `Variable ${idx + 1}`
                : `Variable ${idx + 1}`,
            data: val
        }))
    } else if (typeof props.variable === 'object' && props.variable !== null) {
        return Object.entries(props.variable).map(([key, val]) => ({
            label: key,
            data: val
        }))
    }
    return [{ label: 'Value', data: props.variable }]
})

const toggleItem = (index: number) => {
    const pos = activeIndexes.value.indexOf(index)
    if (pos >= 0) {
        activeIndexes.value.splice(pos, 1)
    } else {
        activeIndexes.value.push(index)
    }
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
    setTimeout(() => {
        copiedIndex.value = null
    }, 1500)
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
}
</style>