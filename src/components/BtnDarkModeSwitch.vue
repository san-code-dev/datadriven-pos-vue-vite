<script setup>
import { toggleDark, isDark } from '@/composables/dark'
</script>
<template>
    <button @click="toggleDark()">{{ isDark ? 'Light' : 'Dark' }}</button>
</template>
<style scoped></style>