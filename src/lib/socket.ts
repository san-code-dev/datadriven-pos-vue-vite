// src/lib/socket.ts
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant' // 👈 Import tenant store

let socket: Socket | null = null

export const initGlobalSocket = () => {
  const authStore = useAuthStore()
  const tenantStore = useTenantStore()

  const userId = authStore.user?.id
  const tenantCode = tenantStore.selectedTenant?.code // 👈 Ambil kode tenant

  if (!userId || !tenantCode) {
    console.warn('[Socket]⚠️ Gagal inisialisasi: User / Tenant belum siap.')
    return null
  }

  if (!socket) {
    socket = io('http://localhost:3000', {
      withCredentials: true,
      auth: {
        userId: userId,
        tenantCode: tenantCode, // 👈 Kirim tenantCode ke backend saat handshake
      },
    })

    socket.on('connect', () => {
      console.log(`[Socket]⚡ Terhubung ke Tenant: ${tenantCode}`)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket]❌ Koneksi socket gagal:', err.message)
    })
  }

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('[Socket]⚡ Socket diputus.')
  }
}


export const reconnectSocket = () => {
  disconnectSocket(); // Putus socket lama jika ada
  return initGlobalSocket(); // Buat koneksi baru dengan tenantCode dari store yang baru
}