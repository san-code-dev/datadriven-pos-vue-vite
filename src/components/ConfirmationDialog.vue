<!-- ConfirmationDialog.vue -->
<template>
    <transition name="fade">
        <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white p-6 rounded-md shadow-lg w-96">
                <h3 class="text-lg font-semibold mb-4">{{ message }}</h3>
                <div class="flex justify-end space-x-2">
                    <button class="px-4 py-2 bg-gray-500 text-white rounded-md" @click="cancel">Cancel</button>
                    <button class="px-4 py-2 bg-red-500 text-white rounded-md" @click="confirm">Confirm</button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
    isVisible: Boolean,
    message: String
})

const emit = defineEmits(['confirm', 'cancel'])

function confirm() {
    emit('confirm')
}

function cancel() {
    emit('cancel')
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
