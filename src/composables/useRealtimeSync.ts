// src/composables/useRealtimeSync.ts
import { onMounted, onBeforeUnmount, watch, type Ref, nextTick } from 'vue'
import { getSocket } from '@/lib/socket'

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

    const eventName = `realtime_update:${key}`

    const register = () => {
      socket.off(eventName)

      socket.on(eventName, (response) => {
        onUpdate(response.data || response)

        if (gridRef) {
          nextTick(async () => {
            const grid = typeof gridRef.value === 'function' ? gridRef.value() : gridRef.value
            if (grid?.refresh) {
              await grid.refresh()
            }
            grid?.requestGridRowsRedraw?.()
          })
        }
      })
    }

    if (socket.connected) {
      register()
    } else {
      socket.once('connect', () => register())
    }
  }

  onMounted(() => {
    setupListener()
  })

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
    }
  })
}