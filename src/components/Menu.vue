<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { AccessMenu } from '@/mock-api/mock-padel-menu'
import { useSidebarStore } from '@/stores/sideBar'

const router = useRouter()
const route = useRoute()
const openCategory = ref(null)

// State untuk Pencarian (Ctrl + K)
const isSearchOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const searchInputRef = ref(null)
const resultItemsRef = ref([])

// Inisialisasi Pinia Store
const sidebarStore = useSidebarStore()

// Grouping menu berdasarkan menuCategory
const menuTree = computed(() => {
    const tree = {}
    if (!AccessMenu) return tree

    AccessMenu.forEach(menu => {
        const category = menu.menuCategory || 'general'
        if (!tree[category]) {
            tree[category] = []
        }
        tree[category].push(menu)
    })
    return tree
})

// Flatten menu untuk kebutuhan search list global
const flatMenus = computed(() => {
    if (!AccessMenu) return []
    // Tambahkan manual Dashboard & Settings jika ingin masuk ke dalam indexing pencarian
    const extraMenus = [
        { key: 'dashboard', label: 'Dashboard', route: '/dashboard', menuCategory: 'General', icon: 'si:dashboard-vert-line' },
        { key: 'setting', label: 'Settings', route: '/setting', menuCategory: 'General', icon: 'heroicons:cog-6-tooth' }
    ]
    return [...extraMenus, ...AccessMenu]
})

// Filter hasil pencarian berdasarkan query
const filteredMenus = computed(() => {
    if (!searchQuery.value) return flatMenus.value.slice(0, 8) // batasi default max 8 item saat kosong
    const query = searchQuery.value.toLowerCase().trim()
    return flatMenus.value.filter(menu =>
        menu.label.toLowerCase().includes(query) ||
        (menu.menuCategory && menu.menuCategory.toLowerCase().includes(query))
    )
})

const formatIcon = (iconString) => {
    if (!iconString) return 'heroicons:folder'
    return iconString.replace('iconify:', '')
}

const handleMenuClick = (menu) => {
    router.push(menu.route)
    isSearchOpen.value = false
}

// Keyboard Control untuk Navigasi Modal Pencarian
const handleKeyDown = (e) => {
    if (!isSearchOpen.value) return
    e.stopPropagation()

    if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (selectedIndex.value < filteredMenus.value.length - 1) {
            selectedIndex.value++
            scrollIntoView()
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (selectedIndex.value > 0) {
            selectedIndex.value--
            scrollIntoView()
        }
    } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredMenus.value[selectedIndex.value]) {
            handleMenuClick(filteredMenus.value[selectedIndex.value])
        }
    } else if (e.key === 'Escape') {
        e.preventDefault()
        isSearchOpen.value = false
    }
}

// Memastikan item yang terpilih lewat keyboard tetap terlihat di dalam area scroll
const scrollIntoView = () => {
    nextTick(() => {
        const activeElement = resultItemsRef.value[selectedIndex.value]
        if (activeElement) {
            activeElement.scrollIntoView({ block: 'nearest' })
        }
    })
}

// Reset index pilihan saat query pencarian berubah
watch(searchQuery, () => {
    selectedIndex.value = 0
})

// Auto-focus input saat modal dibuka
watch(isSearchOpen, (isOpen) => {
    if (isOpen) {
        searchQuery.value = ''
        selectedIndex.value = 0
        nextTick(() => {
            searchInputRef.value?.focus()
        })
    }
})

// Menu.vue
const handleGlobalKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation() // <--- Tambahkan ini agar tidak bocor ke RevoGrid
        e.stopImmediatePropagation() // <--- Tambahkan ini untuk memblokir listener lain di level yang sama
        isSearchOpen.value = !isSearchOpen.value
    }
}
// Menu.vue
onMounted(() => {
    // Menggunakan true / { capture: true } agar dieksekusi di fase awal (Capture)
    window.addEventListener('keydown', handleGlobalKeyDown, true)
    window.addEventListener('keydown', handleKeyDown, true)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown, true)
    window.removeEventListener('keydown', handleKeyDown, true)
})
</script>

<template>
    <nav class="relative z-40 flex-shrink-0 font-sans text-slate-900 dark:text-slate-200 select-none flex flex-col min-h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 shadow-sm"
        :class="sidebarStore.isCollapsed ? 'w-20' : 'w-64'">

        <div class="p-3 flex-1 flex flex-col justify-between relative h-full">

            <div class="space-y-1.5">
                <div class="flex items-center mb-6 px-2 h-10"
                    :class="sidebarStore.isCollapsed ? 'justify-center' : 'justify-between'">
                    <span v-show="!sidebarStore.isCollapsed"
                        class="text-sm font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                        VUE CORE
                    </span>
                    <button @click="sidebarStore.toggleCollapse"
                        class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <Icon icon="heroicons:chevron-left-20-solid" class="text-lg transition-transform duration-300"
                            :class="{ 'rotate-180': sidebarStore.isCollapsed }" />
                    </button>
                </div>

                <div class="px-1 mb-4">
                    <button @click="isSearchOpen = true"
                        class="w-full flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition-all duration-150 text-slate-400 dark:text-slate-500"
                        :class="sidebarStore.isCollapsed ? 'p-2.5 justify-center' : 'h-10 px-3 justify-between'">
                        <div class="flex items-center gap-2.5">
                            <Icon icon="heroicons:magnifying-glass-20-solid" class="text-lg flex-shrink-0" />
                            <span v-show="!sidebarStore.isCollapsed" class="text-xs tracking-wide">Cari menu...</span>
                        </div>
                        <kbd v-show="!sidebarStore.isCollapsed"
                            class="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-500">
                            Ctrl K
                        </kbd>
                    </button>
                </div>

                <div class="relative group" @click="router.push('/dashboard')">
                    <div class="flex items-center w-full h-11 px-3.5 rounded-xl cursor-pointer relative" :class="[
                        route.path === '/dashboard'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                        sidebarStore.isCollapsed ? 'justify-center' : 'justify-start gap-3'
                    ]">
                        <div v-if="route.path === '/dashboard'"
                            class="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-r">
                        </div>
                        <Icon icon="si:dashboard-vert-line" class="text-xl flex-shrink-0" />
                        <span v-show="!sidebarStore.isCollapsed" class="text-sm capitalize">
                            Dashboard
                        </span>
                    </div>
                </div>

                <div v-for="(menus, category) in menuTree" :key="category" class="relative group"
                    @mouseenter="openCategory = category" @mouseleave="openCategory = null">

                    <div class="flex items-center w-full h-11 px-3.5 rounded-xl cursor-pointer relative" :class="[
                        openCategory === category
                            ? 'bg-slate-50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                        sidebarStore.isCollapsed ? 'justify-center' : 'justify-start gap-3'
                    ]">
                        <div class="flex items-center" :class="sidebarStore.isCollapsed ? 'space-x-0' : 'space-x-3'">
                            <Icon v-if="menus[0]?.icon" :icon="formatIcon(menus[0].icon)"
                                class="text-xl flex-shrink-0" />
                            <span v-show="!sidebarStore.isCollapsed" class="font-medium capitalize text-sm">
                                {{ category }}
                            </span>
                        </div>
                        <Icon v-show="!sidebarStore.isCollapsed" icon="heroicons:chevron-right-20-solid"
                            class="w-4 h-4 ml-auto text-slate-400"
                            :class="{ 'text-emerald-500': openCategory === category }" />
                    </div>

                    <div v-show="openCategory === category" class="absolute z-50 top-0 w-52 flyout-container"
                        :class="sidebarStore.isCollapsed ? 'left-[72px]' : 'left-[244px]'">
                        <ul
                            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 space-y-1 rounded-xl shadow-xl shadow-slate-200/40 dark:shadow-none animate-fadeInFast">
                            <li v-for="menu in menus" :key="menu.key">
                                <button @click="handleMenuClick(menu)" :class="[
                                    route.path === menu.route
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100',
                                    'flex items-center w-full h-10 px-3 text-xs transition-colors rounded-lg text-left capitalize font-medium'
                                ]">
                                    <div v-if="route.path === menu.route"
                                        class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 flex-shrink-0"></div>
                                    <div v-else class="w-1.5 h-1.5 rounded-full bg-transparent mr-2 flex-shrink-0">
                                    </div>
                                    <span>{{ menu.label }}</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="relative group" @click="router.push('/setting')">
                    <div class="flex items-center w-full h-11 px-3.5 rounded-xl cursor-pointer relative" :class="[
                        route.path === '/setting'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                        sidebarStore.isCollapsed ? 'justify-center' : 'justify-start gap-3'
                    ]">
                        <div v-if="route.path === '/setting'"
                            class="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-r">
                        </div>
                        <Icon icon="heroicons:cog-6-tooth" class="text-xl flex-shrink-0" />
                        <span v-show="!sidebarStore.isCollapsed" class="text-sm capitalize">
                            Settings
                        </span>
                    </div>
                </div>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
                <ButtonLogout :is-collapsed="sidebarStore.isCollapsed" />
            </div>

        </div>
    </nav>

    <Teleport to="body">
        <div v-if="isSearchOpen"
            class="fixed inset-0 z-[999] flex items-start justify-center pt-[12vh] p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            @click.self="isSearchOpen = false">

            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[480px] animate-fadeInFast">

                <div class="flex items-center px-4 border-b border-slate-100 dark:border-slate-800 h-14 gap-3">
                    <Icon icon="heroicons:magnifying-glass-20-solid"
                        class="text-xl text-slate-400 dark:text-slate-500" />
                    <input ref="searchInputRef" v-model="searchQuery" type="text"
                        placeholder="Ketik nama menu atau kategori halaman..."
                        class="flex-1 bg-transparent border-none text-sm outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 h-full" />
                    <button @click="isSearchOpen = false"
                        class="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600">
                        ESC
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-2 no-scrollbar">
                    <ul v-if="filteredMenus.length > 0" class="space-y-0.5">
                        <li v-for="(menu, index) in filteredMenus" :key="menu.key"
                            :ref="el => resultItemsRef[index] = el" @click="handleMenuClick(menu)"
                            @mouseenter="selectedIndex = index"
                            class="flex items-center justify-between px-3 h-11 rounded-xl cursor-pointer transition-colors"
                            :class="selectedIndex === index
                                ? 'bg-slate-50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'">
                            <div class="flex items-center gap-3">
                                <Icon :icon="formatIcon(menu.icon)" class="text-lg opacity-70" />
                                <span class="text-sm">{{ menu.label }}</span>
                            </div>

                            <span
                                class="text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider opacity-60 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {{ menu.menuCategory || 'General' }}
                            </span>
                        </li>
                    </ul>

                    <div v-else
                        class="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                        <Icon icon="heroicons:exclamation-circle" class="text-3xl opacity-50 mb-2" />
                        <p class="text-xs">Tidak ada menu "{{ searchQuery }}" yang cocok</p>
                    </div>
                </div>

                <div
                    class="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 h-9 px-4 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <div class="flex items-center gap-4">
                        <span class="flex items-center gap-1">
                            <kbd
                                class="px-1 bg-white dark:bg-slate-700 rounded shadow-sm border border-slate-200 dark:border-slate-600 font-sans">↵</kbd>
                            buka
                        </span>
                        <span class="flex items-center gap-1">
                            <kbd
                                class="px-1 bg-white dark:bg-slate-700 rounded shadow-sm border border-slate-200 dark:border-slate-600 font-sans">↑↓</kbd>
                            navigasi
                        </span>
                    </div>
                    <span>Total {{ filteredMenus.length }} rute ditemukan</span>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.flyout-container::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -20px;
    width: 25px;
    background: transparent;
    z-index: -1;
}

@keyframes fadeInFast {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.animate-fadeInFast {
    animation: fadeInFast 0.08s ease-out forwards;
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>