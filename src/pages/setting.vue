<script setup>
import { useSettingsStore } from '@/stores/setting'
import Menu from '@/components/Menu.vue' // Pastikan path Menu Anda sudah benar

const settings = useSettingsStore()

// Daftar locale diupdate: hapus currencySymbol, gunakan currency (Kode ISO)
const LOCALE = [
    {
        locale: 'id-ID',
        label: '🇮🇩 Indonesia (id-ID)',
        currency: 'IDR',
    },
    {
        locale: 'en-US',
        label: '🇺🇸 United States (en-US)',
        currency: 'USD'
    },
    {
        locale: 'en-GB',
        label: '🇬🇧 United Kingdom (en-GB)',
        currency: 'GBP'
    },
    {
        locale: 'ja-JP',
        label: '🇯🇵 Japan (ja-JP)',
        currency: 'JPY'
    },
    {
        locale: 'de-DE',
        label: '🇩🇪 Germany (de-DE)',
        currency: 'EUR'
    },
    {
        locale: 'ms-MY',
        label: '🇲🇾 Malaysia (ms-MY)',
        currency: 'MYR'
    }
]

// Sinkronisasi kode currency ke Pinia store ketika locale berubah
const onLocaleChange = () => {
    const selectedLocale = LOCALE.find(item => item.locale === settings.locale)
    if (selectedLocale) {
        settings.currency = selectedLocale.currency // Menyimpan kode ISO seperti IDR/USD
    }
}
</script>

<template>
    <div
        class="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
        <Menu />

        <div class="flex-1 p-8">
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                    Pengaturan Sistem
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Kelola konfigurasi aplikasi POS dan format toko Anda.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <div
                    class="col-span-1 md:col-span-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden rounded-xl">

                    <div
                        class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Format Angka & Mata Uang
                        </h2>
                    </div>

                    <div class="p-6 space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Lokalisasi Wilayah (Locale)
                            </label>
                            <div class="md:col-span-2">
                                <select v-model="settings.locale" @change="onLocaleChange"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition">
                                    <option v-for="item in LOCALE" :key="item.locale" :value="item.locale"
                                        class="dark:bg-slate-900">
                                        {{ item.label }}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <hr class="border-slate-100 dark:border-slate-700" />

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Jumlah Desimal
                                </label>
                                <span class="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">
                                    Contoh: 0 = 15.000 / 2 = 15.000,00
                                </span>
                            </div>
                            <div class="md:col-span-2 max-w-xs">
                                <input type="number" v-model.number="settings.decimals" min="0" max="4"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition" />
                            </div>
                        </div>
                    </div>

                    <div
                        class="flex justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700">
                        <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            V 0.2.1
                        </span>
                        <RouterLink to="/version"
                            class="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                            version log
                        </RouterLink>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>