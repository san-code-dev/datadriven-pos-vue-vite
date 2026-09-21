<template>
    <!-- Backdrop Modal -->
    <Transition enter-active-class="transition opacity-0 duration-200 ease-out" enter-to-class="opacity-100"
        leave-active-class="transition opacity-100 duration-150 ease-in" leave-to-class="opacity-0">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center  p-4 backdrop-blur-sm"
            @click.self="closeError">
            <!-- Modal Box -->
            <div
                class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all border border-slate-100 dark:border-slate-800">
                <!-- Icon Warning / Bad Request -->
                <div
                    class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 mb-4 ring-8 ring-orange-50 dark:ring-orange-950/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <!-- Content -->
                <div class="text-center">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {{ errorTitle }}
                    </h3>
                    <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {{ errorMessage }}
                    </p>
                </div>

                <!-- Button Action -->
                <div class="mt-6">
                    <button type="button"
                        class="w-full inline-flex justify-center rounded-xl bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-orange-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-150"
                        @click="closeError">
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { useErrorModal } from '@/composables/useErrorModal'

const { isOpen, errorMessage, errorTitle, closeError } = useErrorModal()
</script>