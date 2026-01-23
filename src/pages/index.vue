<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

definePage({
    name: 'Login',
    meta: {
        title: 'Login Page',
    },
})

const router = useRouter()
const loading = ref(false)
const error = ref('')

const form = reactive({
    email: '',
    password: '',
})


/* ======================
   LOGIN
====================== */
async function login() {
    loading.value = true
    error.value = ''

    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(form),
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Login failed')
        }

        await router.push('/dashboard')
    } catch (err: any) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center
           bg-gray-100 dark:bg-gray-900 transition-colors">
        <div class="w-full max-w-md p-6 rounded shadow
             bg-white dark:bg-gray-800
             text-gray-800 dark:text-gray-100">
            <h1 class="text-2xl font-bold mb-4 text-center">
                Login
            </h1>

            <form class="space-y-4" @submit.prevent="login">
                <div>
                    <label class="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <input v-model="form.email" type="email" class="w-full px-3 py-2 rounded border
                   bg-white dark:bg-gray-700
                   border-gray-300 dark:border-gray-600
                   text-gray-900 dark:text-white" placeholder="admin@email.com" required />
                </div>

                <div>
                    <label class="block text-sm font-medium mb-1">
                        Password
                    </label>
                    <input v-model="form.password" type="password" class="w-full px-3 py-2 rounded border
                   bg-white dark:bg-gray-700
                   border-gray-300 dark:border-gray-600
                   text-gray-900 dark:text-white" placeholder="••••••" required />
                </div>

                <div v-if="error" class="text-red-500 text-sm">
                    {{ error }}
                </div>

                <button type="submit" :disabled="loading" class="w-full py-2 rounded font-medium
                 bg-blue-600 hover:bg-blue-700
                 text-white transition disabled:opacity-50">
                    {{ loading ? 'Logging in...' : 'Login' }}
                </button>
            </form>
        </div>
    </div>
</template>
