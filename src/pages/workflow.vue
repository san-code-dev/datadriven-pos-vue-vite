<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'
import CustomNode from '@/components/workflow/CustomNode.vue'
import { Icon } from '@iconify/vue'

// --- MASTER MENU DATA SCHEMAS ---
const Menu = [
    {
        key: 'customer',
        prefix: 'CUST',
        label: 'Data Customer',
        type: 'master',
        icon: 'carbon:user-multiple',
        permissions: { create: true, edit: true, delete: true },
        isMenuHidden: false,
        schema: [
            { key: 'id', label: 'ID', type: 'display', required: true, readonly: true, nullable: false },
            { key: 'nmCustomer', label: 'Customer Name', type: 'text', required: true, size: 250 },
            { key: 'email', label: 'Email Address', type: 'text', required: true, size: 250 },
            { key: 'telepon', label: 'No Telp', type: 'text', size: 200 },
            { key: 'alamat', label: 'Address', type: 'textarea' },
        ],
        data: []
    },
    {
        key: 'product',
        prefix: 'PROD',
        label: 'Data Product',
        type: 'master',
        icon: 'carbon:product',
        permissions: { create: true, edit: true, delete: true },
        isMenuHidden: false,
        schema: [
            { key: 'id', label: 'Product ID', type: 'display', required: true, readonly: true, nullable: false },
            { key: 'name', label: 'Product Name', type: 'text', required: true, size: 300 },
            { key: 'price', label: 'Price', type: 'currency', required: true },
            { key: 'stok', label: 'Stock', type: 'number', required: true },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                size: 120,
                options: [
                    { label: 'Aktif', value: 'active' },
                    { label: 'Non-Aktif', value: 'inactive' }
                ]
            },
            { key: 'tanggalMasuk', label: 'Tanggal Masuk', type: 'date', size: 160 },
            { key: 'description', label: 'Description', type: 'textarea', size: 200 },
        ],
        data: []
    },
    {
        key: 'penjualan',
        prefix: 'PJ',
        label: 'Transaksi Penjualan (POS)',
        type: 'transaction',
        icon: 'mdi-cash-register',
        permissions: { view: true, create: true, edit: false, delete: false },
        isMenuHidden: false,
        actions: [
            { key: 'print', label: 'Cetak Nota', type: 'printer' },
            { key: 'pay', label: 'Bayar Langsung', type: 'payment' },
        ],
        queue: {
            label: 'ANTRIAN TRANSAKSI',
            schema: [
                { key: 'id', label: 'ID Order', type: 'display', primary: true, readonly: true, nullable: false },
                { key: 'label', label: 'Pelanggan', type: 'text' },
            ],
            data: []
        },
        header: {
            label: 'INFORMASI UTAMA NOTA',
            schema: [
                { key: 'id', label: 'ID', type: 'display', primary: true, readonly: true, nullable: false },
                { key: 'noInvoice', label: 'No Invoice', type: 'text', readonly: true },
                { key: 'createdAt', label: 'Tanggal Transaksi', type: 'date' },
                { key: 'customerId', label: 'kode customer', type: 'relation', entity: 'customer', relationKey: 'id' },
                { key: 'nmCustomer', label: 'Nama Customer', type: 'text', readonly: true, size: 250 },
                { key: 'discount', label: 'Potongan Diskon', type: 'currency' },
                { key: 'total', label: 'Total Bayar', type: 'currency', readonly: true, highlight: true },
            ],
            data: null
        },
        details: {
            label: 'DAFTAR BARANG BELANJA',
            schema: [
                { key: 'id', label: 'id', type: 'primary', primary: true, readonly: true, nullable: false },
                { key: 'productId', label: 'Kode Barang', type: 'text', readonly: true },
                { key: 'nmProduct', label: 'Nama Barang', type: 'text', readonly: true, size: 250 },
                { key: 'quantity', label: 'Qty', type: 'number', validation: { required: true, min: 1 }, size: 80 },
                { key: 'price', label: 'Harga Satuan', type: 'currency', readonly: true, size: 150 },
                { key: 'subtotal', label: 'Subtotal', readonly: true, size: 250 },
            ],
            data: []
        },
    }
]

// --- VUE FLOW NODES GENERATION ---
const nodes = ref<Node[]>(
    Menu.map((item, index) => {
        const itemCopy = structuredClone(item)
        const { key, type, label, prefix, ...restProps } = itemCopy

        return {
            id: key,
            type: 'special',
            label: label,
            position: {
                x: 100 + index * 320,
                y: 150
            },
            data: {
                key,
                prefix: prefix || '',
                type,
                label,
                floatingProperties: restProps
            }
        }
    })
)

const edges = ref<Edge[]>([])
const selectedNode = ref<Node | null>(null)
const activeTab = ref<string>('')

// --- FITUR ACTION BUTTONS BARU ---
// Add Node Handler
const handleAddNode = () => {
    const timestamp = Date.now().toString().slice(-4)
    const newKey = `node_${timestamp}`
    const newNode: Node = {
        id: newKey,
        type: 'special',
        label: `New Node ${timestamp}`,
        position: {
            x: 150 + nodes.value.length * 50,
            y: 150 + (nodes.value.length % 5) * 40
        },
        data: {
            key: newKey,
            prefix: 'NEW',
            type: 'master',
            label: `New Node ${timestamp}`,
            floatingProperties: {
                icon: 'carbon:chip',
                permissions: { create: true, edit: true, delete: true },
                schema: []
            }
        }
    }
    nodes.value.push(newNode)
    selectedNode.value = newNode
}

// Save Handler
const handleSave = () => {
    console.log('Saving flow structure...', { nodes: nodes.value, edges: edges.value })
    alert('Berhasil menyimpan workflow!')
}

// --- HELPER UNTUK DATA DINAMIS ---
const addSchemaField = (schemaArray: any[]) => {
    schemaArray.push({
        key: `field_${Date.now().toString().slice(-4)}`,
        label: 'New Field',
        type: 'text',
        required: false,
        readonly: false
    })
}

const addActionItem = (actionsArray: any[]) => {
    actionsArray.push({
        key: `action_${Date.now().toString().slice(-4)}`,
        label: 'New Action',
        type: 'custom'
    })
}

const removeArrayItem = (arr: any[], index: number) => {
    arr.splice(index, 1)
}

// --- LOGIKA GRAB TO SCROLL TAB HEADER ---
const tabContainerRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)
const hasMoved = ref(false)

const startDragging = (e: MouseEvent) => {
    if (!tabContainerRef.value) return
    isDragging.value = true
    hasMoved.value = false
    startX.value = e.pageX - tabContainerRef.value.offsetLeft
    scrollLeft.value = tabContainerRef.value.scrollLeft
}

const stopDragging = () => {
    isDragging.value = false
}

const onDragging = (e: MouseEvent) => {
    if (!isDragging.value || !tabContainerRef.value) return
    e.preventDefault()
    const x = e.pageX - tabContainerRef.value.offsetLeft
    const walk = (x - startX.value) * 1.5

    if (Math.abs(walk) > 5) {
        hasMoved.value = true
    }

    tabContainerRef.value.scrollLeft = scrollLeft.value - walk
}

const handleTabClick = (propKey: string) => {
    if (!hasMoved.value) {
        activeTab.value = propKey
    }
}

watch(
    selectedNode,
    (newNode) => {
        if (newNode?.data?.floatingProperties) {
            const keys = Object.keys(newNode.data.floatingProperties)
            if (keys.length > 0) {
                activeTab.value = keys[0]
            }
        }
    },
    { immediate: true }
)

const onNodeClick = (event: { node: Node }) => {
    selectedNode.value = event.node
}

const onPaneClick = () => {
    selectedNode.value = null
}
</script>

<template>
    <div
        class="relative flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 antialiased">

        <!-- Top Left Floating Action Bar -->
        <div
            class="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">

            <!-- 1. Tombol Kembali ke /dataset -->
            <router-link to="/dataset"
                class="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                title="Kembali ke Dataset">
                <Icon icon="carbon:arrow-left" class="w-4 h-4" />
                <span>/dataset</span>
            </router-link>

            <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

            <!-- 2. Tombol Add Node (+) -->
            <button @click="handleAddNode"
                class="p-2 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                title="Add Node">
                <Icon icon="carbon:add" class="w-5 h-5" />
            </button>

            <!-- 3. Tombol Save -->
            <button @click="handleSave"
                class="p-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                title="Save Workflow">
                <Icon icon="carbon:save" class="w-5 h-5" />
            </button>
        </div>

        <!-- Vue Flow Canvas -->
        <div class="flex-1 h-full">
            <VueFlow :nodes="nodes" :edges="edges" @node-click="onNodeClick" @pane-click="onPaneClick">
                <template #node-special="specialNodeProps">
                    <CustomNode v-bind="specialNodeProps" />
                </template>
            </VueFlow>
        </div>

        <!-- Right Side Tabbed Properties Panel -->
        <transition name="slide">
            <aside v-if="selectedNode"
                class="mt-12 rounded-tl-3xl w-[520px] border-l border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-10 flex flex-col h-auto shrink-0">
                <!-- 1. Header Node Info (Clean & Modern Layout) -->
                <div class="p-6 border-b border-slate-100 dark:border-slate-800/80 space-y-5 shrink-0">
                    <div class="flex items-center justify-between">
                        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                            Properties
                        </h3>
                        <button @click="selectedNode = null"
                            class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-bold">
                            ✕
                        </button>
                    </div>
                    <!-- System Info Metadata (Locked Key, Type, Prefix) -->
                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Lock Type -->
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px]"
                            :class="selectedNode.data.type === 'master'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50'">
                            {{ selectedNode.data.type }}
                        </span>

                        <!-- Lock Key -->
                        <span
                            class="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                            <span class="text-slate-400">key:</span> {{ selectedNode.data.key }}
                        </span>

                        <!-- Lock Prefix -->
                        <span v-if="selectedNode.data.prefix"
                            class="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                            <span class="text-slate-400">prefix:</span> {{ selectedNode.data.prefix }}
                        </span>
                    </div>

                    <!-- Editable Label Menu -->
                    <div>
                        <label class="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">Label
                            Menu</label>
                        <input v-model="selectedNode.data.label" type="text"
                            class="w-full text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" />
                    </div>
                </div>

                <!-- 2. Minimalist Tab Header (Grab to Scroll) -->
                <div ref="tabContainerRef" @mousedown="startDragging" @mouseleave="stopDragging" @mouseup="stopDragging"
                    @mousemove="onDragging"
                    class="flex items-center border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 shrink-0 overflow-x-auto scrollbar-none select-none"
                    :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'">
                    <button v-for="propKey in Object.keys(selectedNode.data.floatingProperties)" :key="propKey"
                        @click="handleTabClick(propKey)"
                        class="px-3.5 py-1.5 text-xs font-medium capitalize transition-all flex items-center gap-2 shrink-0 select-none"
                        :class="activeTab === propKey
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-s'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'">
                        <span>{{ propKey }}</span>

                        <span v-if="selectedNode.data.floatingProperties[propKey]?.schema"
                            class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-mono">
                            {{ selectedNode.data.floatingProperties[propKey].schema.length }}
                        </span>
                        <span v-else-if="Array.isArray(selectedNode.data.floatingProperties[propKey])"
                            class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-mono">
                            {{ selectedNode.data.floatingProperties[propKey].length }}
                        </span>
                    </button>
                </div>

                <!-- 3. Dynamic Tab Content View -->
                <div class="p-6 flex-1 overflow-y-auto">
                    <div v-if="activeTab && selectedNode.data.floatingProperties[activeTab] !== undefined">

                        <!-- EDITABLE TAB: Icon -->
                        <div v-if="activeTab === 'icon'" class="space-y-4">
                            <div class="space-y-1">
                                <div class="flex gap-2">
                                    <div
                                        class="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500">
                                        <Icon :icon="selectedNode.data.floatingProperties.icon" />
                                    </div>
                                    <input v-model="selectedNode.data.floatingProperties.icon" type="text"
                                        class="w-full text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <br>
                                <span class="text-xs">
                                    reference:
                                    <a href="https://icon-sets.iconify.design/" class="underline"
                                        target="_blank">https://icon-sets.iconify.design/</a>
                                </span>
                            </div>
                        </div>

                        <!-- EDITABLE TAB: Permissions -->
                        <div v-if="activeTab === 'permissions'" class="space-y-4">
                            <div class="grid grid-cols-2 gap-3">
                                <label v-for="(_, permKey) in selectedNode.data.floatingProperties.permissions"
                                    :key="permKey"
                                    class="p-3.5 rounded-xl border text-xs capitalize flex items-center justify-between font-medium cursor-pointer transition-all"
                                    :class="selectedNode.data.floatingProperties.permissions[permKey]
                                        ? 'bg-indigo-50/40 border-indigo-200/80 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-300'
                                        : 'bg-slate-50/60 border-slate-200/60 text-slate-400 dark:bg-slate-800/30 dark:border-slate-800'">
                                    <span>{{ permKey }}</span>
                                    <input type="checkbox"
                                        v-model="selectedNode.data.floatingProperties.permissions[permKey]"
                                        class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                </label>
                            </div>
                        </div>

                        <!-- EDITABLE TAB: Actions -->
                        <div v-else-if="activeTab === 'actions'" class="space-y-4">
                            <div class="flex items-center justify-between">
                                <button @click="addActionItem(selectedNode.data.floatingProperties.actions)"
                                    class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                    + Tambah Action
                                </button>
                            </div>

                            <div class="space-y-3">
                                <div v-for="(action, idx) in selectedNode.data.floatingProperties.actions" :key="idx"
                                    class="p-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3 relative group">
                                    <button @click="removeArrayItem(selectedNode.data.floatingProperties.actions, idx)"
                                        class="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs font-bold transition-colors"
                                        title="Hapus">
                                        ✕
                                    </button>
                                    <div class="grid grid-cols-2 gap-3 pr-6">
                                        <div>
                                            <label class="text-[10px] text-slate-400 block mb-1">Label</label>
                                            <input v-model="action.label" type="text"
                                                class="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label class="text-[10px] text-slate-400 block mb-1">Type</label>
                                            <input v-model="action.type" type="text"
                                                class="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- EDITABLE TAB: Schema -->
                        <div v-else-if="activeTab === 'schema' && Array.isArray(selectedNode.data.floatingProperties.schema)"
                            class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Daftar Field ({{ selectedNode.data.floatingProperties.schema.length }})
                                </span>
                                <button @click="addSchemaField(selectedNode.data.floatingProperties.schema)"
                                    class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                    + Tambah Field
                                </button>
                            </div>

                            <div class="space-y-3">
                                <div v-for="(field, idx) in selectedNode.data.floatingProperties.schema" :key="idx"
                                    class="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative">
                                    <button @click="removeArrayItem(selectedNode.data.floatingProperties.schema, idx)"
                                        class="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs font-bold transition-colors"
                                        title="Hapus Field">
                                        ✕
                                    </button>

                                    <div class="grid grid-cols-2 gap-3 pr-6">
                                        <div>
                                            <label class="text-[10px] text-slate-400 block mb-1">Label</label>
                                            <input v-model="field.label" type="text"
                                                class="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label class="text-[10px] text-slate-400 block mb-1">Type</label>
                                            <input v-model="field.type" type="text"
                                                class="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>

                                    <div
                                        class="flex items-center gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <label
                                            class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                                            <input type="checkbox" v-model="field.required"
                                                class="rounded text-indigo-600 focus:ring-indigo-500" />
                                            <span class="text-[11px]">Required</span>
                                        </label>
                                        <label
                                            class="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                                            <input type="checkbox" v-model="field.readonly"
                                                class="rounded text-indigo-600 focus:ring-indigo-500" />
                                            <span class="text-[11px]">Readonly</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- EDITABLE TAB: Seksi Transaksi (Queue / Header / Details) -->
                        <div v-else-if="typeof selectedNode.data.floatingProperties[activeTab] === 'object' && selectedNode.data.floatingProperties[activeTab] !== null"
                            class="space-y-5">
                            <div v-if="selectedNode.data.floatingProperties[activeTab].label !== undefined"
                                class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Judul
                                    Seksi
                                    Transaksi</label>
                                <input v-model="selectedNode.data.floatingProperties[activeTab].label" type="text"
                                    class="w-full text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500" />
                            </div>

                            <div v-if="selectedNode.data.floatingProperties[activeTab].schema" class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Schema Fields ({{ selectedNode.data.floatingProperties[activeTab].schema.length
                                        }})
                                    </span>
                                    <button
                                        @click="addSchemaField(selectedNode.data.floatingProperties[activeTab].schema)"
                                        class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                        + Tambah Field
                                    </button>
                                </div>

                                <div class="space-y-3">
                                    <div v-for="(field, idx) in selectedNode.data.floatingProperties[activeTab].schema"
                                        :key="idx"
                                        class="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative">
                                        <button
                                            @click="removeArrayItem(selectedNode.data.floatingProperties[activeTab].schema, idx)"
                                            class="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs font-bold transition-colors"
                                            title="Hapus Field">
                                            ✕
                                        </button>

                                        <div class="grid grid-cols-2 gap-3 pr-6">
                                            <div>
                                                <label class="text-[10px] text-slate-400 block mb-1">Label</label>
                                                <input v-model="field.label" type="text"
                                                    class="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label class="text-[10px] text-slate-400 block mb-1">Type</label>
                                                <input v-model="field.type" type="text"
                                                    class="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </aside>
        </transition>
    </div>
</template>