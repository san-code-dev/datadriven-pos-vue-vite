// stores/tabs.js
import { defineStore } from 'pinia'

export const useTabStore = defineStore('tabs', {
    state: () => ({
        activeTabId: '/dashboard', // Menyimpan path URL yang aktif
        openedTabs: [
            {
                id: '/dashboard',
                label: 'Dashboard',
                route: '/dashboard',
                apiResponse: null,
                currentMenu: { key: 'Dashboard', label: 'Dashboard', route: '/dashboard' }
            }
        ]
    }),

    actions: {
        // Menambahkan atau mengaktifkan tab baru
        addTab({ id, label, route, apiResponse, currentMenu }) {
            const existingTab = this.openedTabs.find(tab => tab.id === id)

            if (!existingTab) {
                this.openedTabs.push({ id, label, route, apiResponse, currentMenu })
            } else {
                // Jika skema/data diperbarui dari API, update datanya
                if (apiResponse) existingTab.apiResponse = apiResponse
                if (currentMenu) existingTab.currentMenu = currentMenu
            }
            this.activeTabId = id
        },

        // Menutup tab
        closeTab(id) {
            const index = this.openedTabs.findIndex(tab => tab.id === id)
            if (index === -1) return

            this.openedTabs.splice(index, 1)

            // Jika tab yang ditutup adalah tab aktif, alihkan ke tab sebelahnya
            if (this.activeTabId === id && this.openedTabs.length > 0) {
                const nextTab = this.openedTabs[index - 1] || this.openedTabs[0]
                this.activeTabId = nextTab.id
                return nextTab.route // Kembalikan route untuk push router di view
            }
            return null
        }
    },
})