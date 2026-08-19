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
        gridsConfig: [], // Struktur: [{ gridKey, coordinate: {x, y}, column: [{ key, size }] }]
        refreshKey: 0,
      },
    ],
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
          gridsConfig: [],
          refreshKey: 0,
        })
      } else {
        if (apiResponse) existingTab.apiResponse = apiResponse
        if (currentMenu) existingTab.currentMenu = currentMenu
        if (!existingTab.gridsConfig) existingTab.gridsConfig = []
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

    // Action untuk memperbarui/menyimpan konfigurasi grid (koordinat & ukuran kolom)
    updateGridConfig(tabId, gridKey, config) {
      const tab = this.openedTabs.find((t) => t.id === tabId)
      if (!tab) return

      if (!tab.gridsConfig) {
        tab.gridsConfig = []
      }

      const existingIndex = tab.gridsConfig.findIndex(
        (g) => g.gridKey === gridKey,
      )

      if (existingIndex !== -1) {
        tab.gridsConfig[existingIndex] = {
          ...tab.gridsConfig[existingIndex],
          ...config,
          gridKey,
        }
      } else {
        tab.gridsConfig.push({
          gridKey,
          coordinate: { x: 0, y: 0 },
          column: [],
          ...config,
        })
      }
    },
  },

  persist: true,
})
