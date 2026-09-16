<script setup lang="ts">
import { computed } from 'vue'
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { CustomNodeData } from '@/types/workflow/workflow'

const props = defineProps<NodeProps<CustomNodeData>>()

const nodeData = computed(() => props.data)

// Daftar tipe data umum untuk dropdown
const dataTypeOptions = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'Select', value: 'select' },
    { label: 'Object', value: 'object' },
    { label: 'Array', value: 'array' }
]

// Helper hapus item schema berdasarkan target array
const removeField = (targetArray: any[] | undefined, index: number) => {
    if (Array.isArray(targetArray)) {
        targetArray.splice(index, 1)
    }
}
</script>

<template>
    <div
        class="min-w-[340px] max-w-[420px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3.5 shadow-sm hover:shadow-md transition-all text-xs">
        <Handle type="target" :position="Position.Top" />

        <!-- Header Node -->
        <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <div class="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                {{ nodeData?.label || 'Unnamed Node' }}
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <span v-if="nodeData?.key"
                    class="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 font-mono text-gray-600 dark:text-gray-300 text-[10px] border border-gray-200 dark:border-gray-700">
                    {{ nodeData.key }}
                </span>
                <span v-if="nodeData?.type"
                    class="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" :class="nodeData.type === 'master'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        ">
                    {{ nodeData.type }}
                </span>
            </div>
        </div>

        <!-- SECTION 1: MASTER SCHEMA -->
        <div v-if="Array.isArray(nodeData?.floatingProperties?.schema)"
            class="mt-3 space-y-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                    Master Schema
                </span>
                <span class="text-[10px] text-slate-400">
                    {{ nodeData.floatingProperties.schema.length }} fields
                </span>
            </div>

            <!-- Header Kolom -->
            <div class="grid grid-cols-12 gap-1.5 px-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                <span class="col-span-4">Key</span>
                <span class="col-span-4">Label</span>
                <span class="col-span-3">Type</span>
                <span class="col-span-1 text-center"></span>
            </div>

            <!-- Item Form List -->
            <div v-for="(field, idx) in nodeData.floatingProperties.schema" :key="idx"
                class="grid grid-cols-12 gap-1.5 items-center">
                <div class="col-span-4">
                    <input v-model="field.key" type="text" placeholder="key"
                        class="w-full font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div class="col-span-4">
                    <input v-model="field.label" type="text" placeholder="Label"
                        class="w-full text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div class="col-span-3">
                    <select v-model="field.type"
                        class="w-full text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
                        <option v-if="field.type && !dataTypeOptions.some(opt => opt.value === field.type)"
                            :value="field.type">
                            {{ field.type }}
                        </option>
                        <option v-for="opt in dataTypeOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
                <div class="col-span-1 flex justify-center">
                    <button @click="removeField(nodeData?.floatingProperties?.schema, idx)" type="button"
                        class="text-slate-400 hover:text-red-500 transition-colors p-0.5" title="Hapus Field">
                        ✕
                    </button>
                </div>
            </div>
        </div>

        <!-- SECTION 2: TRANSACTION HEADER SCHEMA -->
        <div v-if="Array.isArray(nodeData?.floatingProperties?.header?.schema)"
            class="mt-3 space-y-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                    Header Schema
                </span>
                <span class="text-[10px] text-slate-400">
                    {{ nodeData.floatingProperties.header.schema.length }} fields
                </span>
            </div>

            <!-- Header Kolom -->
            <div class="grid grid-cols-12 gap-1.5 px-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                <span class="col-span-4">Key</span>
                <span class="col-span-4">Label</span>
                <span class="col-span-3">Type</span>
                <span class="col-span-1 text-center"></span>
            </div>

            <!-- Item Form List -->
            <div v-for="(field, idx) in nodeData.floatingProperties.header.schema" :key="idx"
                class="grid grid-cols-12 gap-1.5 items-center">
                <div class="col-span-4">
                    <input v-model="field.key" type="text" placeholder="key"
                        class="w-full font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div class="col-span-4">
                    <input v-model="field.label" type="text" placeholder="Label"
                        class="w-full text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div class="col-span-3">
                    <select v-model="field.type"
                        class="w-full text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
                        <option v-if="field.type && !dataTypeOptions.some(opt => opt.value === field.type)"
                            :value="field.type">
                            {{ field.type }}
                        </option>
                        <option v-for="opt in dataTypeOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
                <div class="col-span-1 flex justify-center">
                    <button @click="removeField(nodeData?.floatingProperties?.header?.schema, idx)" type="button"
                        class="text-slate-400 hover:text-red-500 transition-colors p-0.5" title="Hapus Field">
                        ✕
                    </button>
                </div>
            </div>
        </div>

        <!-- SECTION 3: TRANSACTION DETAILS SCHEMA -->
        <div v-if="Array.isArray(nodeData?.floatingProperties?.details?.schema)"
            class="mt-3 space-y-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                    Details Schema
                </span>
                <span class="text-[10px] text-slate-400">
                    {{ nodeData.floatingProperties.details.schema.length }} fields
                </span>
            </div>

            <!-- Header Kolom -->
            <div class="grid grid-cols-12 gap-1.5 px-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                <span class="col-span-4">Key</span>
                <span class="col-span-4">Label</span>
                <span class="col-span-3">Type</span>
                <span class="col-span-1 text-center"></span>
            </div>

            <!-- Item Form List -->
            <div v-for="(field, idx) in nodeData.floatingProperties.details.schema" :key="idx"
                class="grid grid-cols-12 gap-1.5 items-center">
                <div class="col-span-4">
                    <input v-model="field.key" type="text" placeholder="key"
                        class="w-full font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div class="col-span-4">
                    <input v-model="field.label" type="text" placeholder="Label"
                        class="w-full text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div class="col-span-3">
                    <select v-model="field.type"
                        class="w-full text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer">
                        <option v-if="field.type && !dataTypeOptions.some(opt => opt.value === field.type)"
                            :value="field.type">
                            {{ field.type }}
                        </option>
                        <option v-for="opt in dataTypeOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
                <div class="col-span-1 flex justify-center">
                    <button @click="removeField(nodeData?.floatingProperties?.details?.schema, idx)" type="button"
                        class="text-slate-400 hover:text-red-500 transition-colors p-0.5" title="Hapus Field">
                        ✕
                    </button>
                </div>
            </div>
        </div>

        <Handle type="source" :position="Position.Bottom" />
    </div>
</template>