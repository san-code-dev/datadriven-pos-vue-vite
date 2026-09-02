// stores/tabs.js
import { defineStore } from 'pinia'

export const useTabStore = defineStore('tabs', {
  state: () => ({
    activeTabId: '/dashboard',
    openedTabs: [
      {
        id: '/dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        apiResponse: null,
        currentMenu: {
          key: 'Dashboard',
          label: 'Dashboard',
          route: '/dashboard',
        },
        refreshKey: 0,
      },
    ],
    // 🟢 Simpan konfigurasi grid secara permanen berdasarkan tab ID / route
    savedGridConfigs: {},
  }),

  actions: {
    addTab({ id, label, route, apiResponse, currentMenu }) {
      const existingTab = this.openedTabs.find((tab) => tab.id === id)

      if (!existingTab) {
        this.openedTabs.push({
          id,
          label,
          route,
          apiResponse,
          currentMenu,
          refreshKey: 0,
        })
      } else {
        if (apiResponse) existingTab.apiResponse = apiResponse
        if (currentMenu) existingTab.currentMenu = currentMenu
      }
      this.activeTabId = id
    },

    closeTab(id) {
      const index = this.openedTabs.findIndex((tab) => tab.id === id)
      if (index === -1) return

      this.openedTabs.splice(index, 1)

      if (this.activeTabId === id && this.openedTabs.length > 0) {
        const nextTab = this.openedTabs[index - 1] || this.openedTabs[0]
        this.activeTabId = nextTab.id
        return nextTab.route
      }
      return null
    },

    moveTab(fromIndex, toIndex) {
      const element = this.openedTabs.splice(fromIndex, 1)[0]
      this.openedTabs.splice(toIndex, 0, element)
    },

    refreshTab(tabId) {
      const tab = this.openedTabs.find((t) => t.id === tabId)
      if (tab) {
        tab.refreshKey = (tab.refreshKey || 0) + 1
      }
    },

    // 🟢 Simpan config ke savedGridConfigs
    updateGridConfig(tabId, gridKey, config) {
      if (!this.savedGridConfigs[tabId]) {
        this.savedGridConfigs[tabId] = []
      }

      const gridList = this.savedGridConfigs[tabId]
      const existingIndex = gridList.findIndex((g) => g.gridKey === gridKey)

      if (existingIndex !== -1) {
        gridList[existingIndex] = {
          ...gridList[existingIndex],
          ...config,
          gridKey,
        }
      } else {
        gridList.push({
          gridKey,
          coordinate: { x: 0, y: 0 },
          column: [],
          ...config,
        })
      }
    },

    // 🟢 Getter/Helper untuk mengambil config grid berdasarkan tabId & gridKey
    getGridConfig(tabId, gridKey) {
      return this.savedGridConfigs[tabId]?.find((g) => g.gridKey === gridKey) || null
    },

    // 🟢 `clearTabs` menghapus daftar tab yang terbuka tanpa menyentuh `savedGridConfigs`
    clearTabs() {
      this.openedTabs = []
      this.activeTabId = null
    },
  },

  persist: true,
})