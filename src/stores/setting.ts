import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        locale: 'id-ID',
        currency: 'IDR',
        decimals: 0,
        // Tambahkan ini: default true atau false sesuai keinginanmu
    }),

    persist: true, // Pengaturan sistem ini selalu tersimpan otomatis
})