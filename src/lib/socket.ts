// src/lib/socket.ts
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

let socket: Socket | null = null

export const initGlobalSocket = () => {
    if (!socket) {
        const authStore = useAuthStore()

        // 🔥 Ambil ID user langsung dari store Pinia yang sudah ter-persist
        const userId = authStore.user?.id

        socket = io('http://localhost:3000', {
            withCredentials: true,
            auth: {
                userId: userId // Dikirim ke backend saat koneksi
            }
        })

        socket.on('connect', () => {
            console.log(`⚡ Socket terhubung. User ID aktif: ${userId} (Socket ID: ${socket?.id})`)
        })
    }
    return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}