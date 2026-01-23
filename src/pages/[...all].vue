<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { UI, response } from '@/sample-data'

const route = useRoute()

const menu = computed(() =>
    UI.AccessMenu.find(m => m.link === route.path)
)

const Component = computed(() => menu.value?.type)
</script>

<template>
    <div class="flex">
        <Menu />
        <div v-if="menu && Component">
            <component :is="Component" :menu="menu" />
        </div>

        <div v-else>
            ❌ Route not found
        </div>
    </div>
</template>
