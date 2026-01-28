<script setup>
import { ref, shallowRef, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { UI, detailTransaction } from '@/sample-data'

const route = useRoute()

// --------------------
// Extract segments from route
// --------------------
const segments = computed(() => {
    const val = route.params.all
    if (!val) return []
    return Array.isArray(val) ? val : val.split('/')
})

const moduleName = computed(() => segments.value[0] || '')
const id = computed(() => segments.value[1] || null)

// --------------------
// Find menu
// --------------------
const menu = computed(() =>
    UI.AccessMenu.find(m => m.link === `/${moduleName.value}`)
)

// --------------------
// Transaction data state
// --------------------
const loading = ref(false)
const error = ref(null)

// --------------------
// Dynamic component
// --------------------
const Component = shallowRef(null)

// --------------------
// Fetch data whenever `id` changes
// --------------------
watch(
    id,
    async newId => {
        if (!newId) {
            Component.value = menu.value?.type || null
            return
        }

        loading.value = true
        error.value = null

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Replace with real API call:
            // const response = await fetch(`/api/${moduleName.value}/${newId}`)
            // if (!response.ok) throw new Error('Network error')
            const res = detailTransaction[String(moduleName.value).toUpperCase()]

            // Set dynamic component
            Component.value = res?.transactionType || menu.value?.type || null
        } catch (err) {
            console.error(err)
            error.value = 'Failed to load data'
            Component.value = menu.value?.type || null
        } finally {
            loading.value = false
        }
    },
    { immediate: true }
)
</script>

<template>
    <div class="flex">
        <Menu />
        <div class="flex-1">
            <div v-if="loading">Loading...</div>
            <div v-else-if="error">{{ error }}</div>
            <component :is="Component" v-else-if="Component" :menu="menu" />
            <div v-else>❌ Route not found</div>
        </div>
    </div>
</template>
