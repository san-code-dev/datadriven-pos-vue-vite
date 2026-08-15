<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useSidebarStore } from '@/stores/sideBar'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const openCategory = ref(null)

const isSearchMenuOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const searchInputRef = ref(null)
const resultItemsRef = ref([])

const sidebarStore = useSidebarStore()
const authStore = useAuthStore()

const menuTree = computed(() => {
    const tree = {}
    if (!authStore.menus || authStore.menus.length === 0) return tree

    authStore.menus.forEach(menu => {
        const category = menu.menuCategory || 'general'
        if (!tree[category]) {
            tree[category] = []
        }
        tree[category].push(menu)
    })
    return tree
})

const flatMenus = computed(() => {
    if (!authStore.menus) return []
    const extraMenus = [
        { key: 'dashboard', label: 'Dashboard', route: '/dashboard', menuCategory: 'General', icon: 'mdi:view-dashboard-outline' },
        { key: 'posprint', label: 'Tes print', route: '/posprint', menuCategory: 'General', icon: 'mdi:printer-outline' },
        { key: 'setting', label: 'Settings', route: '/setting', menuCategory: 'General', icon: 'mdi:cog-outline' }
    ]
    return [...extraMenus, ...authStore.menus]
})

const filteredMenus = computed(() => {
    if (!searchQuery.value) return flatMenus.value.slice(0, 8)
    const query = searchQuery.value.toLowerCase().trim()
    return flatMenus.value.filter(menu =>
        menu.label.toLowerCase().includes(query) ||
        (menu.menuCategory && menu.menuCategory.toLowerCase().includes(query))
    )
})

const formatIcon = (iconString) => {
    if (!iconString) return 'mdi:folder-outline'
    return iconString
}

const handleMenuClick = (menu) => {
    router.push(menu.route)
    isSearchMenuOpen.value = false
}

const handleKeyDown = (e) => {
    if (!isSearchMenuOpen.value) return
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
        isSearchMenuOpen.value = false
    }
}

const scrollIntoView = () => {
    nextTick(() => {
        const activeElement = resultItemsRef.value[selectedIndex.value]
        if (activeElement) {
            activeElement.scrollIntoView({ block: 'nearest' })
        }
    })
}

watch(searchQuery, () => {
    selectedIndex.value = 0
})

watch(isSearchMenuOpen, (isOpen) => {
    if (isOpen) {
        searchQuery.value = ''
        selectedIndex.value = 0
        nextTick(() => {
            searchInputRef.value?.focus()
        })
    }
})

const handleGlobalKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        isSearchMenuOpen.value = !isSearchMenuOpen.value
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeyDown, true)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown, true)
})
</script>

<template>
    <nav class="relative z-50 flex-shrink-0 font-sans text-slate-900 dark:text-slate-200 select-none flex flex-col min-h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 shadow-sm"
        :class="sidebarStore.isCollapsed ? 'w-20' : 'w-64'">

        <div class="p-3 flex-1 flex flex-col justify-between relative h-full">

            <div class="space-y-1.5">

                <div class="flex items-center mb-6 px-2 h-10 justify-between">
                    <span
                        class="text-sm font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase text-sidebar-label"
                        :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                        VUE CORE
                    </span>
                    <button @click="sidebarStore.toggleCollapse"
                        class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 flex-shrink-0">
                        <Icon icon="mdi:chevron-left" class="text-lg transition-transform duration-300"
                            :class="{ 'rotate-180': sidebarStore.isCollapsed }" />
                    </button>
                </div>

                <div class="px-1 mb-4">
                    <button @click="isSearchMenuOpen = true"
                        class="w-full flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition-all duration-200 text-slate-400 dark:text-slate-500 h-10 px-3 justify-between">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <Icon icon="mdi:magnify" class="text-lg flex-shrink-0" />
                            <span class="text-xs tracking-wide text-sidebar-label"
                                :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                                Cari menu...
                            </span>
                        </div>
                        <kbd class="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-500 text-sidebar-label flex-shrink-0"
                            :class="sidebarStore.isCollapsed ? 'collapsed-instant' : 'expanded'">
                            Ctrl K
                        </kbd>
                    </button>
                </div>

                <!-- Dashboard -->
                <div class="relative group" @click="router.push('/dashboard')">
                    <div class="flex items-center w-full h-11 px-3.5 rounded-xl cursor-pointer relative transition-all duration-200 gap-3"
                        :class="[
                            route.path === '/dashboard'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        ]">
                        <div v-if="route.path === '/dashboard'"
                            class="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-r">
                        </div>
                        <Icon icon="mdi:view-dashboard-outline" class="text-xl flex-shrink-0" />
                        <span class="text-sm capitalize text-sidebar-label"
                            :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                            Dashboard
                        </span>
                    </div>
                </div>

                <!-- Dynamic Categories from Store -->
                <div v-for="(menus, category) in menuTree" :key="category" class="relative group"
                    @mouseenter="openCategory = category" @mouseleave="openCategory = null">

                    <div class="flex items-center w-full h-11 px-3.5 rounded-xl cursor-pointer relative transition-all duration-200 justify-between gap-3"
                        :class="[
                            openCategory === category
                                ? 'bg-slate-50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        ]">
                        <div class="flex items-center min-w-0 flex-1 gap-3">
                            <Icon v-if="menus[0]?.icon" :icon="formatIcon(menus[0].icon)"
                                class="text-xl flex-shrink-0" />
                            <span class="font-medium capitalize text-sm text-sidebar-label"
                                :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                                {{ category }}
                            </span>
                        </div>
                        <Icon icon="heroicons:chevron-right-20-solid"
                            class="w-4 h-4 text-slate-400 flex-shrink-0 text-sidebar-label" :class="[
                                sidebarStore.isCollapsed ? 'collapsed-instant' : 'expanded',
                                { 'text-emerald-500': openCategory === category }
                            ]" />
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

                <!-- POS Print -->
                <div class="relative group" @click="router.push('/posprint')">
                    <div class="flex items-center w-full h-11 px-3.5 rounded-xl cursor-pointer relative transition-all duration-200 gap-3"
                        :class="[
                            route.path === '/posprint'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        ]">
                        <div v-if="route.path === '/posprint'"
                            class="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-r">
                        </div>
                        <Icon icon="mdi:printer-outline" class="text-xl flex-shrink-0" />
                        <span class="text-sm capitalize text-sidebar-label"
                            :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                            Tes Print
                        </span>
                    </div>
                </div>

                <!-- Settings -->
                <div class="relative group" @click="router.push('/setting')">
                    <div class="flex items-center w-full h-11 px-3.5 rounded-xl cursor-pointer relative transition-all duration-200 gap-3"
                        :class="[
                            route.path === '/setting'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        ]">
                        <div v-if="route.path === '/setting'"
                            class="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-r">
                        </div>
                        <Icon icon="heroicons:cog-6-tooth" class="text-xl flex-shrink-0" />
                        <span class="text-sm capitalize text-sidebar-label"
                            :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
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
        <div v-if="isSearchMenuOpen"
            class="fixed inset-0 z-[999] flex items-start justify-center pt-[12vh] p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            @click.self="isSearchMenuOpen = false">

            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[480px] animate-fadeInFast">

                <div class="flex items-center px-4 border-b border-slate-100 dark:border-slate-800 h-14 gap-3">
                    <Icon icon="heroicons:magnifying-glass-20-solid"
                        class="text-xl text-slate-400 dark:text-slate-500" />
                    <input ref="searchInputRef" v-model="searchQuery" type="text"
                        placeholder="Ketik nama menu atau kategori halaman..." @keydown="handleKeyDown"
                        class="flex-1 bg-transparent border-none text-sm outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 h-full" />
                    <button @click="isSearchMenuOpen = false"
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

.text-sidebar-label {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    transition: max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.2s ease-in-out,
        transform 0.25s ease-out;
}

.text-sidebar-label.expanded {
    max-width: 180px;
    opacity: 1;
    transform: translateX(0);
    transition-delay: 120ms, 120ms, 120ms;
}

.text-sidebar-label.collapsed {
    max-width: 0px;
    opacity: 0;
    transform: translateX(-10px);
    transition-delay: 0ms;
}

.text-sidebar-label.collapsed-instant {
    opacity: 0;
    max-width: 0px;
    pointer-events: none;
    transition: opacity 0.08s ease-in, max-width 0.08s ease-in;
}
</style>