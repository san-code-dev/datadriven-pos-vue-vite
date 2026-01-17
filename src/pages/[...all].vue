<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { UI, response } from '@/sample-data'

const route = useRoute()

const menu = computed(() =>
    UI.AccessMenu.find(m => m.link === route.path)
)

const Component = computed(() => menu.value?.type)
const data = computed(() => response[menu.value?.key]?.data ?? [])
const permission = computed(() => response[menu.value?.key]?.permission)
</script>

<template>
    <div v-if="menu && Component">
        <component :is="Component" :menu="menu" :data="data" :permission="permission" />
    </div>

    <div v-else>
        ❌ Route not found
    </div>
</template>
