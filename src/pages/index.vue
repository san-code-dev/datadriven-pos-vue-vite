<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import api from "@/lib/axios"

definePage({
    name: 'Login',
    meta: {
        title: 'Login Page',
    },
})

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

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

async function login() {
    if (loading.value) return
    loading.value = true
    error.value = ''

    try {
        const response = await api.post('auth/login', form, { includeTenant: false, includeCompany: false })

        if (response.data.token) {
            authStore.setToken(response.data.token)
        }

        authStore.setMenus(response.data.menu)

        if (response.data.user) {
            authStore.setUser(response.data.user)
        }

        const authChannel = new BroadcastChannel('auth_channel')
        authChannel.postMessage({
            type: 'LOGIN_SUCCESS',
            senderId: (window as any).TAB_ID
        })
        authChannel.close()

        await router.push('/dataset')
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Terjadi kesalahan sistem"
        error.value = errorMessage
    } finally {
        loading.value = false
    }
}

// Redirect ke provider OAuth backend
function loginWithOAuth(provider: string) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
    window.location.href = `${baseUrl}/auth/redirect/${provider}`
}
</script>

<template>
    <div
        class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors font-sans select-none">
        <div
            class="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 transition-all">

            <!-- Brand Header -->
            <div class="flex flex-col items-center justify-center mb-6 space-y-3">
                <div
                    class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-500/25">
                    R
                </div>
                <div class="text-center">
                    <h1 class="text-2xl font-black tracking-wider text-gray-900 dark:text-white uppercase">
                        REVO-CORE
                    </h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Silakan masuk untuk mengakses sistem utama
                    </p>
                </div>
            </div>

            <!-- OAuth Login Section -->
            <div class="space-y-2.5 mb-6">
                <!-- Google -->
                <button type="button" @click="loginWithOAuth('google')"
                    class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm">
                    <Icon icon="logos:google-icon" class="text-base" />
                    <span>Lanjutkan dengan Google</span>
                </button>

                <div class="grid grid-cols-2 gap-2.5">
                    <!-- WhatsApp -->
                    <button type="button" @click="loginWithOAuth('whatsapp')"
                        class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm">
                        <Icon icon="logos:whatsapp-icon" class="text-lg" />
                        <span>WhatsApp</span>
                    </button>

                    <!-- LINE -->
                    <button type="button" @click="loginWithOAuth('telegram')"
                        class="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm">
                        <Icon icon="logos:telegram" class="text-lg" />
                        <span>Telegram</span>
                    </button>
                </div>
            </div>

            <!-- Divider -->
            <div class="relative flex items-center justify-center mb-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <span
                    class="relative px-3 bg-white dark:bg-gray-900 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Atau
                </span>
            </div>

            <!-- Form Section -->
            <form class="space-y-4" @submit.prevent="login">
                <div>
                    <label
                        class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Username / Email
                    </label>
                    <div class="relative flex items-center">
                        <Icon icon="mdi:account-outline"
                            class="absolute left-3.5 text-lg text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input ref="usernameInput" v-model="form.email" type="text"
                            class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all placeholder:text-gray-400"
                            placeholder="Masukkan username atau email" required />
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between mb-1.5">
                        <label
                            class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Password
                        </label>
                    </div>
                    <div class="relative flex items-center">
                        <Icon icon="mdi:lock-outline"
                            class="absolute left-3.5 text-lg text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                            class="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all placeholder:text-gray-400"
                            placeholder="••••••••" required />
                        <button type="button" @click="showPassword = !showPassword"
                            class="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none transition-colors">
                            <Icon :icon="showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="text-lg" />
                        </button>
                    </div>
                </div>

                <!-- Error Alert -->
                <div v-if="error"
                    class="flex items-center space-x-2 p-3 rounded-xl text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40">
                    <Icon icon="mdi:alert-circle-outline" class="text-base flex-shrink-0" />
                    <span class="font-medium">{{ error }}</span>
                </div>

                <!-- Submit Button -->
                <button type="submit" :disabled="loading"
                    class="relative flex items-center justify-center w-full h-11 rounded-xl font-semibold text-sm text-white transition-all shadow-md shadow-emerald-500/15 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
                        <Icon icon="line-md:loading-twotone-loop" class="w-5 h-5" />
                    </div>
                    <span :class="{ 'opacity-0': loading }">Masuk Aplikasi</span>
                </button>
            </form>

        </div>
    </div>
</template>