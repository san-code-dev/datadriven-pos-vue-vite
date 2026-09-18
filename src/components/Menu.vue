<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useSidebarStore } from '@/stores/sideBar'
import { useAuthStore, type UserInfo } from '@/stores/auth'
import { useTenantStore, type Tenant } from '@/stores/tenant';
import { useTailwindColor } from '@/composables/useTailwindColor'

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
const tenantStore = useTenantStore()
const { getTailwindColor, getMenuStyles } = useTailwindColor()

const tenantInfo = computed<Tenant>(() => ({
    id: tenantStore.selectedTenant?.id || 'unknown',
    logo: tenantStore.selectedTenant?.logo || '',
    name: tenantStore.selectedTenant?.name || 'unknown',
    code: tenantStore.selectedTenant?.code || 'unknown'
}))

const userInfo = computed<UserInfo>(() => ({
    id: authStore.user?.id,
    email: authStore.user?.email || 'unknown',
    role: authStore.user?.role || 'unknown'
}))

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
        { key: 'print', label: 'Tes print', route: '/print', menuCategory: 'General', icon: 'mdi:printer-outline' },
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
    <nav class="relative z-50 flex-shrink-0 font-sans text-slate-900 dark:text-slate-200 select-none flex flex-col h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-[width] duration-200 ease-in-out shadow-sm"
        :class="sidebarStore.isCollapsed ? 'w-20' : 'w-64'">

        <div class="p-3 mt-3 flex-1 flex flex-col justify-center relative h-full min-h-0">
            <div class="flex" :class="sidebarStore.isCollapsed ? 'justify-center' : 'justify-end'"
                title="Perkecil menu">
                <button @click="sidebarStore.toggleCollapse"
                    class="flex justify-center p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 focus:outline-none flex-shrink-0 items-center">
                    <Icon icon="mdi:chevron-left" class="text-lg transition-transform duration-200"
                        :class="{ 'rotate-180': sidebarStore.isCollapsed }" />
                </button>
            </div>
            <!-- UPPER SECTION: Header, Ganti Cabang, Search, Menus -->
            <div class="mt-9 space-y-1.5 flex-1 no-scrollbar">
                <!-- Header: Tenant Info & Collapse Toggle -->
                <div class="flex items-center cursor-pointer mb-6 h-12 justify-center border-b border-slate-100 dark:border-slate-800 py-3 px-1 hover:bg-slate-700/40 rounded-lg"
                    @click="router.push('/dataset')" title="Ganti cabang">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                            class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img v-if="tenantInfo.logo" :src="tenantInfo.logo" class="w-full h-full object-cover" />
                            <Icon v-else icon="lucide:building-2" class="w-6 h-6 text-slate-400" />
                        </div>
                        <div class="flex flex-col min-w-0 text-sidebar-label"
                            :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                            <div
                                class="text-xs font-bold truncate text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                {{ tenantInfo.name }}
                            </div>
                            <div class="text-[10px] text-slate-400 truncate">
                                {{ tenantInfo.code }}
                            </div>
                        </div>
                    </div>

                </div>


                <!-- Global Search Menu -->
                <div class="mb-4">
                    <button @click="isSearchMenuOpen = true"
                        class="w-full flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition-all duration-200 text-slate-400 dark:text-slate-500 h-10 px-3 cursor-text"
                        :class="sidebarStore.isCollapsed ? 'justify-center px-0' : 'justify-between'">
                        <div class="flex items-center gap-2.5 min-w-0"
                            :class="sidebarStore.isCollapsed ? 'justify-center' : 'flex-1'">
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

                <!-- Main Navigation: Dashboard -->
                <div class="relative group" @click="router.push('/dashboard')">
                    <div class="flex items-center w-full h-11 rounded-xl cursor-pointer relative transition-all duration-200 gap-3"
                        :class="[
                            sidebarStore.isCollapsed ? 'justify-center px-0' : 'px-3.5',
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

                    <div class="flex items-center w-full h-11 rounded-xl cursor-pointer relative transition-all duration-200 gap-3"
                        :class="[
                            sidebarStore.isCollapsed ? 'justify-center px-0' : 'justify-between px-3.5',
                            openCategory === category
                                ? 'bg-slate-50 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        ]">
                        <div class="flex items-center min-w-0 gap-3"
                            :class="sidebarStore.isCollapsed ? 'justify-center' : 'flex-1'">
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

                    <!-- Flyout Submenu -->
                    <div v-show="openCategory === category" class="absolute z-50 top-0 w-80 flyout-container"
                        :class="sidebarStore.isCollapsed ? 'left-[72px]' : 'left-[244px]'">

                        <div
                            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none animate-fadeInFast">

                            <!-- Judul Kategori Paling Atas -->
                            <div
                                class="px-1 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                                <span
                                    class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                    {{ category }}
                                </span>
                            </div>

                            <!-- Grid 3 Kolom untuk Sub Category / Item Menu -->
                            <div class="grid grid-cols-3 gap-2">
                                <button v-for="menu in menus" :key="menu.key" @click="handleMenuClick(menu)"
                                    :title="menu.label" :class="[
                                        route.path === menu.route
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                                            : 'bg-slate-50/60 dark:bg-slate-700/30 border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600',
                                        'flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-150 aspect-square group/item text-center relative overflow-hidden'
                                    ]">

                                    <!-- Indicator Aktif -->
                                    <div v-if="route.path === menu.route"
                                        class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500">
                                    </div>

                                    <!-- Icon Menu -->
                                    <Icon :icon="formatIcon(menu.icon)"
                                        class="text-xl mb-1.5 flex-shrink-0 transition-transform duration-200"
                                        :class="route.path === menu.route ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'" />

                                    <!-- Label Menu -->
                                    <span class="text-[11px] leading-tight line-clamp-2 w-full break-words capitalize">
                                        {{ menu.label }}
                                    </span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- POS Print -->
                <div class="relative group" @click="router.push('/print')">
                    <div class="flex items-center w-full h-11 rounded-xl cursor-pointer relative transition-all duration-200 gap-3"
                        :class="[
                            sidebarStore.isCollapsed ? 'justify-center px-0' : 'px-3.5',
                            route.path === '/print'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        ]">
                        <div v-if="route.path === '/print'"
                            class="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-r">
                        </div>
                        <Icon icon="mdi:printer-outline" class="text-xl flex-shrink-0" />
                        <span class="text-sm capitalize text-sidebar-label"
                            :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                            Tes Print
                        </span>
                    </div>
                </div>
            </div>



            <!-- LOWER SECTION: User Info & Actions Footer -->
            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">

                <!-- Quick Action Bar (Collapsed Support) -->
                <div class="flex items-center p-1 bg-slate-100/70 dark:bg-slate-800/70 rounded-xl transition-all duration-300"
                    :class="sidebarStore.isCollapsed ? 'flex-col space-y-1 bg-transparent p-0' : 'justify-around'">

                    <!-- Notification Button -->
                    <button
                        class="p-2 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 transition-all relative flex items-center justify-center"
                        title="Notifikasi">
                        <Icon icon="heroicons:bell-20-solid" class="text-lg" />
                        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
                    </button>

                    <!-- Message Button -->
                    <button
                        class="p-2 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 transition-all relative flex items-center justify-center"
                        title="Pesan">
                        <Icon icon="heroicons:chat-bubble-left-right-20-solid" class="text-lg" />
                    </button>

                    <!-- Settings Button -->
                    <button @click="router.push('/setting')"
                        class="p-2 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 transition-all flex items-center justify-center"
                        :class="{ 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-700': route.path === '/setting' }"
                        title="Settings">
                        <Icon icon="heroicons:cog-6-tooth-20-solid" class="text-lg" />
                    </button>
                </div>


                <!-- User Profile Bar -->
                <div class="py-2  border-b border-gray-200 dark:border-gray-800">
                    <div class="flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all duration-200 p-1.5"
                        :class="sidebarStore.isCollapsed ? 'justify-center' : 'justify-between gap-2.5'">
                        <div class="flex items-center gap-2.5 min-w-0"
                            :class="sidebarStore.isCollapsed ? 'justify-center' : ''">
                            <div
                                class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0 shadow-sm">
                                {{ userInfo.email.charAt(0) }}
                            </div>
                            <div class="flex flex-col min-w-0 text-sidebar-label"
                                :class="sidebarStore.isCollapsed ? 'collapsed' : 'expanded'">
                                <div class="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                                    {{ userInfo.email }}
                                </div>
                                <div class="text-[10px] text-slate-400 truncate">
                                    {{ userInfo.role }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ButtonLogout />
            </div>
        </div>
    </nav>

    <!-- Global Search Modal Dialog -->
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

/* OPTIMASI PERFORMA LABEL */
.text-sidebar-label {
    white-space: nowrap;
    overflow: hidden;
    will-change: opacity;
    transition: opacity 0.15s ease-in-out;
}

.text-sidebar-label.expanded {
    opacity: 1;
    display: inline-block;
}

.text-sidebar-label.collapsed,
.text-sidebar-label.collapsed-instant {
    opacity: 0;
    display: none;
    /* Langsung hilangkan dari render tree agar tidak reflow */
}
</style>