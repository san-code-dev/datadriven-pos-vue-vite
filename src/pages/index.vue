<script setup lang="ts">
import { UI } from '@/sample-data'
definePage({
    name: 'home',
    // alias: ['home'],
    meta: {
        title: 'Home',
        navOrder: 1,
    },
})

</script>
<template>
    <div>
        <nav>
            <ul>
                <li v-for="menu in UI.AccessMenu" :key="menu.key">
                    <RouterLink :to="menu.link">
                        {{ menu.name }}
</RouterLink>
                </li>
            </ul>
        </nav>
    </div>
</template>
<style scoped></style>
