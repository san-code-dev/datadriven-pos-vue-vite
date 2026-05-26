import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
    // State: mengambil data awal dari localStorage jika ada, default false (terbuka)
    const isCollapsed = ref(JSON.parse(localStorage.getItem('sidebar_collapsed')) || false)

    // Action: fungsi untuk mengubah status collapse
    const toggleCollapse = () => {
        isCollapsed.value = !isCollapsed.value
        localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed.value))
    }

    return {
        isCollapsed,
        toggleCollapse
    }
})