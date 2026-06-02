<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { AccessMenu } from '@/new-konsep-data'
import { useSidebarStore } from '@/stores/sideBar' // Sesuaikan path store Anda

const router = useRouter()
const route = useRoute()
const openCategory = ref(null)
const category = ref('')

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

const formatIcon = (iconString) => {
    if (!iconString) return 'mdi:folder-outline'
    return iconString.replace('iconify:', '')
}

const handleMenuClick = (menu) => {
    console.log(`Mengirim request API ke: ${menu.api} untuk data ${menu.key}...`)
    router.push(menu.route)
}
</script>

<template>
    <nav class="relative z-40 flex-shrink-0 font-sans text-gray-900 dark:text-gray-200 select-none flex flex-col min-h-screen border-r border-gray-200 dark:border-gray-800 transition-all duration-300"
        :class="sidebarStore.isCollapsed ? 'w-20' : 'w-64'">

        <ul
            class="p-2 space-y-2 rounded-r-lg shadow-md bg-white dark:bg-gray-900 flex-1 flex flex-col justify-between relative">

            <div class="space-y-2">

                <li class="flex p-2 mb-2 transition-all duration-300"
                    :class="sidebarStore.isCollapsed ? 'justify-center' : 'justify-end'">
                    <button @click="sidebarStore.toggleCollapse"
                        class="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors duration-200 focus:outline-none">
                        <Icon icon="mdi:chevron-left" class="text-xl transition-transform duration-300"
                            :class="{ 'rotate-180': sidebarStore.isCollapsed }" />
                    </button>
                </li>

                <li :key="'Dashboard'" class="relative group" @click="router.push('/dashboard')">
                    <div class="flex items-center w-full h-12 px-5 transition-all rounded cursor-pointer hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
                        :class="[
                            openCategory === category ? 'bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700 shadow-sm' : '',
                            sidebarStore.isCollapsed ? 'justify-center px-0' : 'justify-between'
                        ]">
                        <div class="flex items-center" :class="sidebarStore.isCollapsed ? 'space-x-0' : 'space-x-3'">
                            <Icon icon="ix:dashboard" class="text-xl opacity-80" />
                            <span v-show="!sidebarStore.isCollapsed"
                                class="font-semibold capitalize text-sm text-gray-700 dark:text-gray-200 transition-all">
                                Dashboard
                            </span>
                        </div>
                    </div>
                </li>

                <li v-for="(menus, category) in menuTree" :key="category" class="relative group"
                    @mouseenter="openCategory = category" @mouseleave="openCategory = null">
                    <div class="flex items-center w-full h-12 px-5 transition-all rounded cursor-pointer hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
                        :class="[
                            openCategory === category ? 'bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700 shadow-sm' : '',
                            sidebarStore.isCollapsed ? 'justify-center px-0' : 'justify-between'
                        ]">
                        <div class="flex items-center" :class="sidebarStore.isCollapsed ? 'space-x-0' : 'space-x-3'">
                            <Icon v-if="menus[0]?.icon" :icon="formatIcon(menus[0].icon)" class="text-xl opacity-80" />
                            <span v-show="!sidebarStore.isCollapsed"
                                class="font-semibold capitalize text-sm text-gray-700 dark:text-gray-200">
                                {{ category }}
                            </span>
                        </div>
                        <Icon v-show="!sidebarStore.isCollapsed" icon="mdi:chevron-down"
                            class="w-5 h-5 text-gray-500 transition-transform duration-200 dark:text-gray-300"
                            :class="{ '-rotate-90': openCategory === category }" />
                    </div>

                    <div v-show="openCategory === category" class="absolute top-0 z-50 pl-2 w-48 transition-all"
                        :class="sidebarStore.isCollapsed ? 'left-16' : 'left-full'">
                        <ul
                            class="bg-white border border-gray-200 rounded shadow-lg shadow-slate-200/50 dark:shadow-none dark:bg-gray-800 dark:border-gray-700 p-1 space-y-1">
                            <li v-for="menu in menus" :key="menu.key">
                                <button @click="handleMenuClick(menu)" :class="[
                                    route.path === menu.route
                                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 font-medium'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-700/50',
                                    'flex items-center w-full h-11 px-4 text-xs transition-colors rounded text-left capitalize'
                                ]">
                                    <span>{{ menu.label }}</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </li>

                <li :key="'Setting'" class="relative group" @click="router.push('/setting')">
                    <div class="flex items-center w-full h-12 px-5 transition-all rounded cursor-pointer hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
                        :class="[
                            openCategory === category ? 'bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700 shadow-sm' : '',
                            sidebarStore.isCollapsed ? 'justify-center px-0' : 'justify-between'
                        ]">
                        <div class="flex items-center" :class="sidebarStore.isCollapsed ? 'space-x-0' : 'space-x-3'">
                            <Icon icon="uil:setting" class="text-xl opacity-80" />
                            <span v-show="!sidebarStore.isCollapsed"
                                class="font-semibold capitalize text-sm text-gray-700 dark:text-gray-200">
                                Settings
                            </span>
                        </div>
                    </div>
                </li>

            </div>

            <ButtonLogout :is-collapsed="sidebarStore.isCollapsed" />

        </ul>
    </nav>
</template>