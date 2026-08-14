// src/lib/socket.ts
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

let socket: Socket | null = null

export const initGlobalSocket = () => {
  const authStore = useAuthStore()
  const userId = authStore.user?.id

  if (!userId) {
    console.warn(
      '[Socket]⚠️ Gagal menginisialisasi socket: User belum login / userId tidak ditemukan.',
    )
    return null
  }

  if (!socket) {
    socket = io('http://localhost:3000', {
      withCredentials: true,
      auth: {
        userId: userId, // Dikirim ke backend saat handshake
      },
    })

    socket.on('connect', () => {
      // console.log(`[Socket]⚡ Socket terhubung. User ID: ${userId}, Socket ID: ${socket?.id}`)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket]❌ Koneksi socket gagal:', err.message)
    })

    socket.on('joined_rooms', (data) => {
      //   console.log(
      //     '[Socket]⚡ Anda Socket ID:',
      //     data.socketId,
      //     'Sedang join ke room:',
      //     data.rooms,
      //   )
    })
  }

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('[Socket]⚡ Socket diputus secara manual.')
  }
}
