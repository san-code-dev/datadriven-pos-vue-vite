<script setup lang="ts">
import { UI } from '@/sample-data'
definePage({
    name: 'Login',
    // alias: ['home'],
    meta: {
        title: 'Login Page',
    },
})

</script>
<template>
    <div>
        <h1 class="text-2xl font-bold mb-4">Login Page</h1>
        <p>This is the login page. Implement your login form here.</p>
        <a href="/dashboard" class="text-blue-500 hover:underline">Go to Dashboard</a>
    </div>
</template>
<style scoped></style>
