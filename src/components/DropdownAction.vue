<!-- DropdownAction.vue -->
<script setup lang="ts">
import type { BaseOptions } from '@/types/workflow/common.type'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
    label?: string
    options: BaseOptions[]
}

withDefaults(defineProps<Props>(), {
    label: 'Ambil dari',
    options: () => []
})

// Emit event 'select' dengan membawa objek BaseOptions secara utuh
const emit = defineEmits<{
    (e: 'select', option: BaseOptions): void
}>()

const isDropdownOpen = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

// Posisi dropdown dinamis untuk Teleport
const dropdownStyle = ref({
    top: '0px',
    left: '0px',
    width: '160px'
})

const updatePosition = () => {
    if (buttonRef.value) {
        const rect = buttonRef.value.getBoundingClientRect()
        const menuWidth = 160 // Lebar menu dropdown (px)
        dropdownStyle.value = {
            top: `${rect.bottom + window.scrollY + 4}px`,
            left: `${rect.right - menuWidth + window.scrollX}px`, // Sejajarkan ke kanan tombol
            width: `${menuWidth}px`
        }
    }
}

const toggleDropdown = async () => {
    isDropdownOpen.value = !isDropdownOpen.value
    if (isDropdownOpen.value) {
        await nextTick()
        updatePosition()
    }
}

// Mengirimkan objek option utuh bertipe BaseOptions
const handleSelect = (option: BaseOptions) => {
    emit('select', option)
    isDropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node
    if (
        dropdownRef.value && !dropdownRef.value.contains(target) &&
        buttonRef.value && !buttonRef.value.contains(target)
    ) {
        isDropdownOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('resize', updatePosition)
    window.removeEventListener('scroll', updatePosition, true)
})
</script>

<template>
    <div class="relative inline-block text-left">
        <!-- Tombol Utama Trigger Dropdown -->
        <button ref="buttonRef" type="button" @click="toggleDropdown"
            class="inline-flex items-center gap-x-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer">
            <span>{{ label }}</span>
            <Icon icon="mdi:chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': isDropdownOpen }" />
        </button>

        <!-- Menu Dropdown Rendered directly to <body> -->
        <Teleport to="body">
            <div v-if="isDropdownOpen" ref="dropdownRef" :style="dropdownStyle"
                class="fixed rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 z-[99999] overflow-hidden text-xs py-1">
                <ul class="max-h-60 overflow-y-auto">
                    <li v-for="option in options" :key="option.value" @click="handleSelect(option)"
                        class="px-3 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors">
                        <span>{{ option.label }}</span>
                    </li>
                </ul>
            </div>
        </Teleport>
    </div>
</template>