<template>
    <div class="flex min-h-screen bg-gray-100 dark:bg-gray-950">
        <!-- Sidebar Menu -->
        <Menu />

        <!-- Area Konten Dinamis Halaman -->
        <div
            class="flex-1 ps-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200 h-screen max-h-screen flex flex-col overflow-scroll w-full min-w-0">

            <div class="flex flex-col h-screen">
                <div class="flex flex-1 min-h-0">
                    <div class="flex-1 flex flex-col min-h-0 w-full">
                        <div class="flex-1 min-h-0 w-full relative group">
                            <div
                                class="min-h-screen bg-slate-950 p-6 text-slate-200 font-mono text-sm antialiased space-y-6">

                                <!-- EDITOR UTAMA -->
                                <div
                                    class="max-w-4xl mx-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">

                                    <!-- Header ala Code Editor -->
                                    <div
                                        class="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <div class="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span
                                                class="text-xs text-slate-500 ml-2">menu_schema_with_toggles.json</span>
                                        </div>
                                        <button @click="toggleAll"
                                            class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition">
                                            {{ allExpanded ? 'Collapse All' : 'Expand All' }}
                                        </button>
                                    </div>

                                    <!-- Main Content / Tree View -->
                                    <div class="p-6 space-y-4">
                                        <div v-for="(categoryObj, catIdx) in menuData" :key="catIdx"
                                            class="border-l border-slate-800 pl-4 ml-2">

                                            <!-- Loop Kategori Utama (Pembelian, Penjualan, User) -->
                                            <div v-for="(subMenus, categoryName) in categoryObj" :key="categoryName">
                                                <div @click="toggleCategory(categoryName)"
                                                    class="flex items-center space-x-2 cursor-pointer hover:text-emerald-400 transition py-1 select-none">
                                                    <span
                                                        class="text-slate-500 transform transition-transform duration-200"
                                                        :class="{ 'rotate-90': isExpanded(categoryName) }">▶</span>
                                                    <span class="text-amber-400 font-bold">"{{ categoryName }}"</span>
                                                    <span class="text-slate-600">:</span>
                                                    <span
                                                        class="text-blue-400 text-xs font-semibold bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/50">Object</span>
                                                </div>

                                                <!-- Sub Menu Container -->
                                                <div v-show="isExpanded(categoryName)"
                                                    class="pl-6 mt-1 space-y-3 border-l border-slate-800/60 ml-1.5">

                                                    <!-- Loop Sub-Kategori (Data pembelian, Data supplier, dll) -->
                                                    <div v-for="(details, subMenuName) in subMenus" :key="subMenuName"
                                                        class="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                                                        <div @click="toggleSubMenu(subMenuName)"
                                                            class="flex items-center space-x-2 cursor-pointer hover:text-cyan-400 transition select-none">
                                                            <span
                                                                class="text-slate-600 text-xs transform transition-transform duration-200"
                                                                :class="{ 'rotate-90': isSubExpanded(subMenuName) }">▶</span>
                                                            <span class="text-purple-400 font-medium">"{{ subMenuName
                                                            }}"</span>
                                                            <span class="text-slate-600">:</span>
                                                            <span
                                                                class="text-teal-400 text-xs font-semibold bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-900/50">Config</span>
                                                        </div>

                                                        <!-- Detail Metadata Menu -->
                                                        <div v-show="isSubExpanded(subMenuName)"
                                                            class="pl-4 mt-3 space-y-3 text-xs border-l border-slate-800/80 ml-1">

                                                            <!-- Type & URL -->
                                                            <div><span class="text-slate-500">type:</span> <span
                                                                    class="text-emerald-400">"{{
                                                                        details.type }}"</span></div>
                                                            <div><span class="text-slate-500">url:</span> <span
                                                                    class="text-sky-400 underline decoration-dotted">"{{
                                                                        details.url }}"</span>
                                                            </div>

                                                            <!-- Section Methods dengan Fitur Toggle Aktif/Nonaktif -->
                                                            <div>
                                                                <span class="text-slate-500">methods:</span>
                                                                <span class="text-slate-400"> [</span>
                                                                <span class="inline-flex gap-1.5 mx-1">
                                                                    <button v-for="method in availableMethods"
                                                                        :key="method"
                                                                        @click="toggleMethod(details, method)"
                                                                        class="px-2 py-0.5 rounded font-bold text-[10px] uppercase border transition select-none"
                                                                        :class="details.activeMethods.includes(method)
                                                                            ? 'bg-emerald-950 text-emerald-400 border-emerald-700 shadow-sm shadow-emerald-900/50'
                                                                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-60 line-through'">
                                                                        {{ method }}
                                                                    </button>
                                                                </span>
                                                                <span class="text-slate-400">]</span>
                                                            </div>

                                                            <!-- Key -->
                                                            <div><span class="text-slate-500">key:</span> <span
                                                                    class="text-orange-400">"{{
                                                                        details.key }}"</span></div>

                                                            <!-- Section Fields dengan Checkbox -->
                                                            <div class="mt-2">
                                                                <span class="text-slate-500">fields:</span> <span
                                                                    class="text-pink-400 text-[11px] bg-pink-950/20 px-1 rounded border border-pink-900/30">Array&lt;Object&gt;</span>

                                                                <div
                                                                    class="pl-4 mt-2 space-y-1.5 border-l border-pink-900/20 ml-1">
                                                                    <div v-for="(field, fIdx) in details.fields"
                                                                        :key="fIdx"
                                                                        @click="field.enabled = !field.enabled"
                                                                        class="flex items-center space-x-3 p-2 rounded border transition-all cursor-pointer select-none w-fit min-w-[260px]"
                                                                        :class="field.enabled
                                                                            ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                                                                            : 'bg-slate-950/40 border-slate-900/60 text-slate-600'">

                                                                        <!-- CUSTOM CHECKBOX -->
                                                                        <div class="h-4 w-4 rounded border flex items-center justify-center text-[10px] font-bold transition-all shrink-0"
                                                                            :class="field.enabled
                                                                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                                                                : 'bg-slate-800 border-slate-700 text-transparent'">
                                                                            ✓
                                                                        </div>

                                                                        <!-- Info Field -->
                                                                        <span class="font-medium"
                                                                            :class="{ 'line-through text-slate-700': !field.enabled }">
                                                                            {{ field.name }}
                                                                        </span>
                                                                        <span
                                                                            class="text-slate-600 text-xs ml-auto">→</span>

                                                                        <!-- Badge Tipe Data -->
                                                                        <span
                                                                            class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border transition-colors duration-200"
                                                                            :class="!field.enabled
                                                                                ? 'bg-slate-900 text-slate-700 border-slate-800/40'
                                                                                : field.type === 'number'
                                                                                    ? 'bg-indigo-950 text-indigo-400 border-indigo-900'
                                                                                    : 'bg-orange-950 text-orange-400 border-orange-900'">
                                                                            {{ field.type }}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                <!-- LIVE JSON OUTPUT PREVIEW -->
                                <div
                                    class="max-w-4xl mx-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                                    <div
                                        class="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                                        <span class="text-xs text-emerald-400 font-bold">✨ Live Output JSON (Auto
                                            Update)</span>
                                    </div>
                                    <div
                                        class="p-4 max-h-[400px] overflow-y-auto bg-slate-950/50 text-emerald-500 text-xs">
                                        <pre><code>{{ generatedJson }}</code></pre>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref, computed } from 'vue';

const availableMethods = ['get', 'post', 'put', 'delete'];

const menuData = ref([
    {
        "Pembelian": {
            "Data pembelian": {
                type: "table", url: "/api/pembelian", key: "id",
                activeMethods: ["get", "post", "put", "delete"],
                fields: [
                    { name: "nama_barang", type: "string", enabled: true },
                    { name: "jumlah", type: "number", enabled: true },
                    { name: "harga", type: "number", enabled: true },
                ]
            },
            "Data supplier": {
                type: "table", url: "/api/supplier", key: "id",
                activeMethods: ["get", "post", "put", "delete"],
                fields: [
                    { name: "nama_supplier", type: "string", enabled: true },
                    { name: "alamat", type: "string", enabled: true },
                    { name: "telepon", type: "string", enabled: false },
                ]
            }
        }
    },
    {
        "Penjualan": {
            "Data penjualan": {
                type: "table", url: "/api/penjualan", key: "id",
                activeMethods: ["get", "post"],
                fields: [
                    { name: "nama_barang", type: "string", enabled: true },
                    { name: "jumlah", type: "number", enabled: true },
                    { name: "harga", type: "number", enabled: true },
                ]
            },
            "Data pelanggan": {
                type: "table", url: "/api/pelanggan", key: "id",
                activeMethods: ["get", "post", "put", "delete"],
                fields: [
                    { name: "nama_pelanggan", type: "string", enabled: true },
                    { name: "alamat", type: "string", enabled: true },
                    { name: "telepon", type: "string", enabled: true },
                ]
            },
        }
    },
    {
        "User": {
            "Data user": {
                type: "table", url: "/api/user", key: "id",
                activeMethods: ["get", "post", "put", "delete"],
                fields: [
                    { name: "username", type: "string", enabled: true },
                    { name: "email", type: "string", enabled: true },
                    { name: "password", type: "string", enabled: true },
                ]
            },
            "Poin user": {
                type: "table", url: "/api/poin", key: "id",
                activeMethods: ["get", "put"],
                fields: [
                    { name: "username", type: "string", enabled: true },
                    { name: "poin", type: "number", enabled: true },
                ]
            }
        }
    },
]);

// COMPUTED: Mengonversi objek menuData reaktif menjadi String JSON secara otomatis
const generatedJson = computed(() => {
    return JSON.stringify(menuData.value, null, 4);
});

const toggleMethod = (details, method) => {
    const index = details.activeMethods.indexOf(method);
    if (index > -1) {
        details.activeMethods.splice(index, 1);
    } else {
        details.activeMethods.push(method);
    }
};

const expandedCategories = ref({ 'Pembelian': true, 'Penjualan': false, 'User': false });
const expandedSubMenus = ref({
    'Data pembelian': true, 'Data supplier': false, 'Data penjualan': false,
    'Data pelanggan': false, 'Data user': false, 'Poin user': false
});

const toggleCategory = (name) => expandedCategories.value[name] = !expandedCategories.value[name];
const toggleSubMenu = (name) => expandedSubMenus.value[name] = !expandedSubMenus.value[name];
const isExpanded = (name) => !!expandedCategories.value[name];
const isSubExpanded = (name) => !!expandedSubMenus.value[name];

const allExpanded = computed(() => {
    return Object.values(expandedCategories.value).every(v => v) && Object.values(expandedSubMenus.value).every(v => v);
});

const toggleAll = () => {
    const targetState = !allExpanded.value;
    Object.keys(expandedCategories.value).forEach(k => expandedCategories.value[k] = targetState);
    Object.keys(expandedSubMenus.value).forEach(k => expandedSubMenus.value[k] = targetState);
};
</script>
