<template>
    <!-- Overlay -->
    <div v-if="isOpen" class="fixed inset-0 z-50 bg-black bg-opacity-50" @click.self="close"></div>

    <!-- Drawer -->
    <transition name="slide">
        <div v-if="isOpen" ref="drawerRef"
            class="fixed top-0 right-0 z-50 w-96 h-full p-4 bg-gray-100 dark:bg-gray-800 shadow-lg overflow-auto">
            <slot></slot>
        </div>
    </transition>
</template>

<script setup>
import { defineProps, defineEmits, watch, onUnmounted, ref } from 'vue'

const props = defineProps({
    isOpen: Boolean,
    focusedField: String

})

const emit = defineEmits(['close', 'delete'])
const drawerRef = ref(null)

function close() {
    emit('close')
}

function handleKey(event) {
    if (event.key === 'Escape') {
        event.preventDefault()
        close()
    }
    if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveFocus('prev')
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveFocus('next')
    }

    if (event.key == 'Delete') {
        event.preventDefault()
        emit('delete') // ⬅️ kirim ke parent
    }
}

// Watch for when drawer opens and focus the first input
watch(
    () => props.isOpen,
    async (isDrawerOpen) => {
        if (isDrawerOpen) {
            // Menambahkan event listener untuk ESC
            window.addEventListener('keydown', handleKey)

            // Tunggu sedikit setelah drawer terbuka (untuk memastikan transition selesai)
            await new Promise(resolve => setTimeout(resolve, 300));
            focusTargetInput()
            // Delay 300ms untuk menunggu animasi selesai
        } else {
            // Hapus event listener ketika drawer ditutup
            window.removeEventListener('keydown', handleKey)
        }
    }
)
function focusTargetInput() {
    if (!drawerRef.value) return

    let target = null

    if (props.focusedField) {
        target = drawerRef.value.querySelector(
            `[name="${props.focusedField}"]`
        )
    }

    if (!target) {
        target = drawerRef.value.querySelector(
            'input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
    }

    if (target) {
        target.focus()

        // SELECT ALL (khusus input & textarea)
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            target.select()
        }
    }
}


function moveFocus(direction) {
    const focusableElements = Array.from(drawerRef.value?.querySelectorAll('input, textarea, select, [tabindex]:not([tabindex="-1"])') || [])

    if (focusableElements.length === 0) return;

    let currentIndex = focusableElements.indexOf(document.activeElement);

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % focusableElements.length; // Loop back to the first element
    } else if (direction === 'prev') {
        currentIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length; // Loop to the last element
    }

    // Move focus to the new element
    focusableElements[currentIndex].focus()
}


onUnmounted(() => {
    // Pastikan event listener dihapus saat komponen di-unmount
    window.removeEventListener('keydown', handleKey)
})
</script>

<style>
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s ease;
}

.slide-enter-from {
    transform: translateX(100%);
}

.slide-leave-to {
    transform: translateX(100%);
}
</style>
