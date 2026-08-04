<template>
    <div class="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
        <!-- Toggle Button Panel -->
        <button @click="isOpen = !isOpen"
            class="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900 rounded-lg shadow-xl hover:opacity-90 transition-all font-semibold border border-slate-700 dark:border-slate-300 select-none">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Data Inspector ({{ formattedData.length }})</span>
            <span class="text-[10px] opacity-70">{{ isOpen ? '▼' : '▲' }}</span>
        </button>

        <!-- Floating Panel -->
        <div v-if="isOpen"
            class="mt-2 w-[450px] max-w-[90vw] max-h-[80vh] bg-slate-900 dark:bg-slate-950 text-slate-200 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">

            <!-- Variable Items List -->
            <div class="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                <div v-for="(item, index) in formattedData" :key="item.label"
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
import { ref, computed, watch, toRaw, isRef } from 'vue'

const props = defineProps<{
    variable?: Record<string, any> | any
}>()

const isOpen = ref(false)
const activeIndexes = ref<number[]>([0])
const copiedIndex = ref<number | null>(null)

const debugStore = ref<Record<string, any>>({})

// Helper untuk membuka membongkar Ref / Proxy Vue sampai ke nilai paling asli
const deepUnwrap = (val: any): any => {
    if (val === null || val === undefined) return val
    let raw = isRef(val) ? val.value : val
    raw = toRaw(raw)

    if (Array.isArray(raw)) {
        return raw.map(item => deepUnwrap(item))
    }

    return raw
}

// Helper setDebug Internal yang Kebal Bug #1 0
const setDebug = (input: any) => {
    if (input === null || input === undefined) return

    const rawInput = isRef(input) ? input.value : input

    // Jika input berupa Objek Murni { resData: ... }
    if (typeof rawInput === 'object' && !Array.isArray(rawInput)) {
        for (const [key, val] of Object.entries(rawInput)) {
            debugStore.value[key] = deepUnwrap(val)
        }
    } else {
        // Fallback jika yang di-pass hanya nilai tunggal
        debugStore.value['Data'] = deepUnwrap(rawInput)
    }
}

watch(
    () => props.variable,
    (newVal) => {
        if (newVal !== undefined) {
            setDebug(newVal)
        }
    },
    { immediate: true, deep: true }
)

const formattedData = computed(() => {
    return Object.entries(debugStore.value).map(([key, val]) => ({
        label: key, // 👈 Nama variabel asli (resData, rows, dll)
        data: val
    }))
})

// Fungsi Format JSON yang Kebal Undefined
const formatJSON = (val: any): string => {
    if (val === undefined) return 'undefined'
    if (val === null) return 'null'
    try {
        const rawVal = deepUnwrap(val)
        return JSON.stringify(rawVal, null, 2) || String(rawVal)
    } catch (e) {
        return String(val)
    }
}

const copyJson = async (val: any, index: number) => {
    const textToCopy = formatJSON(val)
    try {
        await navigator.clipboard.writeText(textToCopy)
        copiedIndex.value = index
        setTimeout(() => { copiedIndex.value = null }, 1500)
    } catch (err) {
        console.error('Gagal copy text:', err)
    }
}

const toggleItem = (index: number) => {
    const pos = activeIndexes.value.indexOf(index)
    if (pos >= 0) activeIndexes.value.splice(pos, 1)
    else activeIndexes.value.push(index)
}

defineExpose({
    setDebug,
    clear: () => { debugStore.value = {} }
})
</script>