// src/composables/useRealtimeSync.ts
import { onMounted, onBeforeUnmount, watch, type Ref, nextTick } from 'vue'
import { getSocket } from '@/lib/socket'
import { useTenantStore } from '@/stores/tenant'

const tenantStore = useTenantStore()

export function useRealtimeSync(
  formKey: Ref<string> | string,
  onUpdate: (data: any) => void,
  gridRef?: Ref<any>,
) {
  const setupListener = () => {
    const socket = getSocket()
    if (!socket) return

    const key = typeof formKey === 'string' ? formKey : formKey.value
    if (!key) return

    const eventName = `realtime_update:${key}-${tenantStore.selectedTenant.code}`

    // Fungsi internal untuk mendaftarkan listener
    const register = () => {
      // console.log(`[Socket]⚡ Listening.. to: ${eventName}`)

      // Bersihkan listener lama untuk menghindari duplikasi event
      socket.off(eventName)

      // Pasang listener baru
      socket.on(eventName, (response) => {
        // console.log(`[Socket]⚡ Received event on ${eventName}:`, response)
        // Ambil data payload dari response
        onUpdate(response.data || response)

        if (gridRef) {
          nextTick(async () => {
            const grid =
              typeof gridRef.value === 'function'
                ? gridRef.value()
                : gridRef.value
            if (grid?.refresh) {
              await grid.refresh()
            }
            grid?.requestGridRowsRedraw?.()
          })
        }
      })
    }

    // Pastikan socket sudah terhubung sebelum mendaftarkan listener
    if (socket.connected) {
      register()
    } else {
      // Jika belum terhubung (masih proses handshake), tunggu hingga event 'connect' selesai
      socket.once('connect', () => {
        register()
      })
    }
  }

  onMounted(() => {
    setupListener()
  })

  // Watch jika formKey berubah (misal props/ID transaksi berubah dinamis)
  if (typeof formKey !== 'string') {
    watch(formKey, (newKey, oldKey) => {
      if (newKey && newKey !== oldKey) {
        const socket = getSocket()
        if (socket && oldKey) {
          socket.off(`realtime_update:${oldKey}`)
        }
        setupListener()
      }
    })
  }

  onBeforeUnmount(() => {
    const socket = getSocket()
    const key = typeof formKey === 'string' ? formKey : formKey?.value || ''
    if (socket && key) {
      socket.off(`realtime_update:${key}`)
      // console.log(`[Socket]⚡ Stop listening to: ${key}`)
    }
  })
}
