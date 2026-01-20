<template>
    <div class="bg-transparent fixed flex items-center justify-center min-h-full min-w-full">
        <div class="bg-slate-800 flex gap-6 p-10">
            <div class="flex flex-col">
                <span>dari</span>
                <input ref="tglFrom" type="date">
            </div>
            <div class="flex flex-col">
                <span>sampai</span>
                <div class="flex flex-row gap-12">
                    <input ref="tglTo" type="date">
                    <button class="bg-primary p-2 text-white">tampilkan</button>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref } from 'vue'
const tglFrom = ref('')
const tglTo = ref('')
</script>