<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { UI } from '@/sample-data'

// STATE
const openCategory = ref(null)
const openSubCategory = ref(null)

// COMPUTED: Build Tree
const menuTree = computed(() => {
    const tree = {}
    if (!UI?.AccessMenu) return tree

    UI.AccessMenu.forEach(menu => {
        const { menuCategory, menuSubCategory } = menu
        if (!tree[menuCategory]) tree[menuCategory] = {}
        if (!tree[menuCategory][menuSubCategory]) tree[menuCategory][menuSubCategory] = []
        tree[menuCategory][menuSubCategory].push(menu)
    })
    return tree
})

// HANDLERS
const setOpenCategory = (category) => {
    openCategory.value = category
    openSubCategory.value = null
}

const setOpenSubCategory = (subKey) => {
    openSubCategory.value = subKey
}
</script>

<template>
    <nav class="relative w-64 font-sans text-gray-900 dark:text-gray-200">
        <ul class="p-2 space-y-2 rounded-lg shadow-md bg-gray-50 dark:bg-gray-900">

            <li v-for="(subCategories, category) in menuTree" :key="category" class="relative group"
                @mouseenter="setOpenCategory(category)" @mouseleave="setOpenCategory(null)">

                <div class="flex items-center justify-between w-full h-12 px-5 transition-all rounded cursor-pointer hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-600 dark:hover:to-emerald-700"
                    :class="{
                        'bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-600 dark:to-emerald-700 shadow-sm': openCategory === category
                    }">

                    <span class="font-semibold capitalize text-gray-700 dark:text-gray-200">{{ category }}</span>

                    <span class="text-xs font-bold text-gray-500 transition-transform duration-200 dark:text-gray-300"
                        :class="{ '-rotate-90': openCategory === category }">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                stroke-width="1.5" d="m3.75 5.75 4.25 4.5 4.25-4.5" />
                        </svg>
                    </span>
                </div>

                <div v-show="openCategory === category" class="absolute top-0 z-10 pl-2 left-full">
                    <ul
                        class="min-w-[200px] bg-white border border-gray-200 rounded shadow-lg dark:bg-gray-800 dark:border-gray-700">

                        <li v-for="(menus, subCategory) in subCategories" :key="subCategory" class="relative group"
                            @mouseenter="setOpenSubCategory(`${category}-${subCategory}`)"
                            @mouseleave="setOpenSubCategory(null)">

                            <div class="flex items-center justify-between w-full h-12 p-5 text-sm transition-colors cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-700"
                                :class="{
                                    'bg-emerald-50 dark:bg-emerald-700 font-medium text-emerald-800 dark:text-emerald-100': openSubCategory === `${category}-${subCategory}`
                                }">

                                <span class="capitalize text-gray-600 dark:text-gray-200"
                                    :class="{ '!text-emerald-800 dark:!text-emerald-100': openSubCategory === `${category}-${subCategory}` }">
                                    {{ subCategory }}
                                </span>

                                <span class="text-[10px] transition-transform duration-200 text-gray-400"
                                    :class="{ '-rotate-90': openSubCategory === `${category}-${subCategory}` }">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                                        <path fill="none" stroke="currentColor" stroke-linecap="round"
                                            stroke-linejoin="round" stroke-width="1.5"
                                            d="m3.75 5.75 4.25 4.5 4.25-4.5" />
                                    </svg> </span>
                            </div>

                            <div v-show="openSubCategory === `${category}-${subCategory}`"
                                class="absolute top-0 z-20 pl-2 left-full">
                                <ul
                                    class="min-w-[180px] bg-white border border-gray-200 rounded shadow-lg dark:bg-gray-800 dark:border-gray-700">
                                    <li v-for="menu in menus" :key="menu.key">
                                        <RouterLink :to="menu.link"
                                            class="block h-12 p-4 text-sm text-gray-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800 dark:text-gray-200 dark:hover:bg-emerald-700 dark:hover:text-emerald-100">
                                            {{ menu.name }}
                                        </RouterLink>
                                    </li>
                                </ul>
                            </div>

                        </li>
                    </ul>
                </div>
            </li>

        </ul>
    </nav>
</template>