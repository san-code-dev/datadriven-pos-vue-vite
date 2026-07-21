<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth' // 1. Import Store Pinia Anda
import api from "@/lib/axios"

definePage({
    name: 'Login',
    meta: {
        title: 'Login Page',
    },
})

const router = useRouter()
const authStore = useAuthStore() // 2. Inisialisasi Store

const loading = ref(false)
const error = ref('')

const usernameInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
    if (usernameInput.value) {
        usernameInput.value.focus()
    }
})

const form = reactive({
    email: 't',
    password: 't',
})

/* ======================
    LOGIN
====================== */
async function login() {
    if (loading.value) return
    loading.value = true
    error.value = ''

    try {
        const response = await api.post('auth/login', form)

        // Simpan menu hasil login ke Pinia (otomatis tersinkron ke local storage)
        authStore.setMenus(response.data.menu)
        // Redirect ke dashboard setelah sukses
        await router.push('/dashboard')
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Terjadi kesalahan sistem";
        error.value = errorMessage
    } finally {
        loading.value = false
    }
}
</script>
<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4 transition-colors font-sans select-none">
        <div class="w-full max-w-md p-8 rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 text-gray-800 dark:text-gray-100 transform transition-all">
            <div class="flex flex-col items-center justify-center mb-8 space-y-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-md shadow-emerald-500/20">
                    R
</div>
                <div class="text-center">
                    <h1 class="text-xl font-bold tracking-wider text-gray-900 dark:text-white uppercase">
                        REVO-CORE </h1>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Silakan masuk untuk mengakses sistem utama </p>
                </div>
            </div>
            <form class="space-y-5" @submit.prevent="login">
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Username / Email
</label>
                    <div class="relative flex items-center">
                        <Icon icon="mdi:account-outline" class="absolute left-3 text-xl text-gray-400 dark:text-gray-500"/>
                        <input ref="usernameInput" v-model="form.email" type="text" class="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all" placeholder="Masukkan username" required/>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Password
</label>
                    <div class="relative flex items-center">
                        <Icon icon="mdi:lock-outline" class="absolute left-3 text-xl text-gray-400 dark:text-gray-500"/>
                        <input v-model="form.password" type="password" class="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all" placeholder="••••••" required/>
                    </div>
                </div>
                <div v-if="error" class="flex items-center space-x-2 p-3 rounded-lg text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/50">
                    <Icon icon="mdi:alert-circle-outline" class="text-base flex-shrink-0"/><span class="font-medium">{{ error }}</span>
                </div>
                <button type="submit" :disabled="loading" class="w-full h-11 flex items-center justify-center space-x-2 rounded-lg font-semibold text-sm text-white transition-all shadow-md shadow-emerald-600/10 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none
                           bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-500 dark:hover:to-emerald-600">
                    <Icon v-if="loading" icon="line-md:loading-twotone-loop" class="w-5 h-5"/><span>{{ loading ? '' : 'Masuk Aplikasi' }}</span>
                </button>
            </form>
        </div>
    </div>
</template>