<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { AccessMenu } from '@/new-konsep-data'

const router = useRouter()
const route = useRoute()
const openCategory = ref(null)
const category = ref('');


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
    <nav class="relative w-64 font-sans text-gray-900 dark:text-gray-200 select-none flex flex-col min-h-screen">
        <ul class="p-2 space-y-2 rounded-lg shadow-md bg-gray-50 dark:bg-gray-900 flex-1 flex flex-col justify-between">

            <!-- CONT-ATAS: DAFTAR MENU UTAMA -->
            <div class="space-y-2">

                <li :key="'Dashboard'" class="relative group" @click="router.push('/dashboard')">
                    <div class="flex items-center justify-between w-full h-12 px-5 transition-all rounded cursor-pointer hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
                        :class="{ 'bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700 shadow-sm': openCategory === category }">

                        <div class="flex items-center space-x-3">
                            <Icon icon="ix:dashboard" class="text-xl opacity-80" />
                            <span class="font-semibold capitalize text-sm text-gray-700 dark:text-gray-200">
                                Dashboard
                            </span>
                        </div>

                    </div>

                </li>

                <li v-for="(menus, category) in menuTree" :key="'category'" class="relative group"
                    @mouseenter="openCategory = category" @mouseleave="openCategory = null">

                    <div class="flex items-center justify-between w-full h-12 px-5 transition-all rounded cursor-pointer hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
                        :class="{ 'bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700 shadow-sm': openCategory === category }">

                        <div class="flex items-center space-x-3">
                            <Icon v-if="menus[0]?.icon" :icon="formatIcon(menus[0].icon)" class="text-xl opacity-80" />
                            <span class="font-semibold capitalize text-sm text-gray-700 dark:text-gray-200">
                                {{ category }}
                            </span>
                        </div>

                        <Icon icon="mdi:chevron-down"
                            class="w-5 h-5 text-gray-500 transition-transform duration-200 dark:text-gray-300"
                            :class="{ '-rotate-90': openCategory === category }" />
                    </div>

                    <!-- LEVEL 2: DROPDOWN ITEM MENU -->
                    <div v-show="openCategory === category" class="absolute top-0 z-10 pl-2 left-full w-48">
                        <ul
                            class="bg-white border border-gray-200 rounded shadow-lg dark:bg-gray-800 dark:border-gray-700 p-1 space-y-1">
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
                    <div class="flex items-center justify-between w-full h-12 px-5 transition-all rounded cursor-pointer hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
                        :class="{ 'bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700 shadow-sm': openCategory === category }">

                        <div class="flex items-center space-x-3">
                            <Icon icon="uil:setting" class="text-xl opacity-80" />
                            <span class="font-semibold capitalize text-sm text-gray-700 dark:text-gray-200">
                                Settings
                            </span>
                        </div>

                    </div>

                </li>
            </div>
            <ButtonLogout />


        </ul>
    </nav>


</template>