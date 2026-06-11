// stores/transaction.ts
import { defineStore } from 'pinia'

interface QueueState {
    activeNotaId: string | number | null
}

export const useQueueStore = defineStore('queue', {
    state: (): QueueState => ({
        activeNotaId: null
    }),

    getters: {
        /**
         * Mengecek apakah ada nota/antrian yang sedang aktif saat ini
         */
        hasActiveNota: (state) => state.activeNotaId !== null
    },

    actions: {
        /**
         * Mengubah ID antrian yang sedang aktif
         */
        setActiveNotaId(id: string | number | null) {
            this.activeNotaId = id
        },

        /**
         * Mereset status antrian aktif (misal setelah transaksi selesai disubmit/bayar)
         */
        resetActiveNota() {
            this.activeNotaId = null
        }
    }, persist: true
})