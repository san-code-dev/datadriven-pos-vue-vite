<template>
    <div
        class="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
        <!-- Menu Utama Aplikasi -->
        <Menu />

        <!-- Area Konten Utama Pengaturan -->
        <div class="flex-1 p-8">

            <!-- Header Halaman (Tanpa Ikon) -->
            <div class="mb-8">
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                    Pengaturan Sistem
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola konfigurasi aplikasi POS dan format
                    toko Anda.</p>
            </div>

            <!-- Layout Grid: Kategori Kiri, Form Kanan -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">


                <!-- Form Pengaturan (Sisi Kanan - Bersih & Minimalis) -->
                <div
                    class="md:col-span-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 overflow-hidden">

                    <!-- Header Kategori Aktif -->
                    <div
                        class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Format Angka & Mata Uang
                        </h2>
                    </div>

                    <!-- Isi Form (Semua ikon input dihapus agar fokus pada teks) -->
                    <div class="p-6 space-y-6">

                        <!-- Input Lokalisasi Negara -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Lokalisasi Wilayah (Locale)
                            </label>
                            <div class="md:col-span-2">
                                <select v-model="settings.locale"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition">
                                    <option value="id-ID" class="dark:bg-slate-900">🇮🇩 Indonesia (id-ID)</option>
                                    <option value="en-US" class="dark:bg-slate-900">🇺🇸 United States (en-US)</option>
                                </select>
                            </div>
                        </div>

                        <hr class="border-slate-100 dark:border-slate-700" />

                        <!-- Input Mata Uang -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Mata Uang Utama
                            </label>
                            <div class="md:col-span-2">
                                <select v-model="settings.currency"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition">
                                    <option value="IDR" class="dark:bg-slate-900">Rupiah (IDR)</option>
                                    <option value="USD" class="dark:bg-slate-900">Dollar (USD)</option>
                                </select>
                            </div>
                        </div>

                        <hr class="border-slate-100 dark:border-slate-700" />

                        <!-- Input Jumlah Desimal -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Jumlah Desimal
                                </label>
                                <span class="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">Contoh: 0 = Rp
                                    15.000</span>
                            </div>
                            <div class="md:col-span-2 max-w-xs">
                                <input type="number" v-model="settings.decimals" min="0" max="4"
                                    class="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition" />
                            </div>
                        </div>

                    </div>

                    <!-- Footer Status Simpan -->
                    <div
                        class="flex justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                        <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            V 0.2.1
                        </span>
                        <RouterLink to="/version" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            version log
                        </RouterLink>
                    </div>

                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '@/stores/setting'

const settings = useSettingsStore()
</script>