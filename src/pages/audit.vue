<template>
    <div class="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div class="mb-8 border-b pb-4">
            <h2 class="text-2xl font-bold text-gray-800">Data Lifecycle & Audit Trail</h2>
            <p class="text-sm text-gray-500 mt-1">
                Batch ID: <span class="font-mono font-semibold text-indigo-600">{{ batchId }}</span>
            </p>
        </div>

        <div class="relative border-l-2 border-gray-200 ml-4 md:ml-6 space-y-8">

            <div v-for="(step, index) in timelineData" :key="step.id" class="relative pl-6 md:pl-8 group">
                <span
                    class="absolute -left-[11px] top-1 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white transition-transform group-hover:scale-110"
                    :class="getStepColorClass(step.stage)">
                    <span class="w-2 h-2 bg-white rounded-full"></span>
                </span>

                <div
                    class="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 transition-all duration-200 shadow-sm">

                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                        @click="toggleStep(index)">
                        <div>
                            <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                                :class="getBadgeColorClass(step.stage)">
                                {{ step.stage }}
                            </span>
                            <h3 class="text-lg font-bold text-gray-800 mt-1.5">{{ step.title }}</h3>
                        </div>

                        <div class="flex items-center space-x-3 text-right">
                            <div class="text-xs text-gray-500">
                                <p class="font-medium text-gray-700">{{ step.timestamp }}</p>
                                <p>Oleh: <span class="font-semibold text-gray-600">{{ step.user.name }}</span></p>
                            </div>
                            <div
                                class="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 uppercase">
                                {{ step.user.name.substring(0, 2) }}
                            </div>
                            <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-200"
                                :class="{ 'rotate-180': expandedSteps[index] }" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <div v-show="expandedSteps[index]"
                        class="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm animate-fade-in">
                        <div class="space-y-1.5">
                            <p class="text-gray-500">No. Dokumen: <span class="font-mono text-gray-900 font-medium">{{
                                    step.documentNo }}</span></p>
                            <p class="text-gray-500">Item Terkait: <span class="text-gray-900 font-medium">{{
                                    step.itemName }}</span></p>
                            <p class="text-gray-500" v-if="step.qtyChange !== null">
                                Perubahan Stok:
                                <span class="font-bold" :class="step.qtyChange < 0 ? 'text-red-600' : 'text-green-600'">
                                    {{ step.qtyChange > 0 ? '+' : '' }}{{ step.qtyChange }} Pcs
                                </span>
                            </p>
                        </div>

                        <div
                            class="space-y-1.5 sm:text-right bg-white p-2.5 rounded border border-gray-100 sm:bg-transparent sm:p-0 sm:border-none">
                            <p class="text-gray-500" v-if="step.financialValue !== null">
                                Nilai Transaksi:
                                <span class="font-semibold text-gray-900">
                                    {{ formatRupiah(step.financialValue) }}
                                </span>
                            </p>
                            <p v-if="step.stage === 'LABA'" class="text-gray-500">
                                Margin Laba:
                                <span class="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">
                                    +{{ ((step.financialValue / 25000000) * 100).toFixed(1) }}%
                                </span>
                            </p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

// Props dummy untuk Batch ID data running
const batchId = ref('BATCH-2026-MTR01')

// Data Dummy representasi Alur Data
const timelineData = ref([
    {
        id: 1,
        stage: 'PEMBELIAN',
        title: 'Pengadaan Bahan Baku Masuk',
        timestamp: '01 Jul 2026 - 09:00 WIB',
        documentNo: 'PO-2026-001',
        itemName: 'Kain Katun Premium (100 Roll)',
        qtyChange: 100,
        financialValue: 15000000,
        user: { name: 'Andi', role: 'Purchasing' }
    },
    {
        id: 2,
        stage: 'PRODUKSI',
        title: 'Pemotongan & Jahit (WIP)',
        timestamp: '02 Jul 2026 - 13:15 WIB',
        documentNo: 'WO-2026-085',
        itemName: 'Kain Katun Premium (-100 Roll)',
        qtyChange: -100,
        financialValue: 2000000,
        user: { name: 'Budi', role: 'Produksi' }
    },
    {
        id: 3,
        stage: 'HASIL PRODUK',
        title: 'Penerimaan Produk Jadi (QC Passed)',
        timestamp: '04 Jul 2026 - 16:00 WIB',
        documentNo: 'FG-2026-112',
        itemName: 'Kaos Polos Pola-A (980 Pcs)',
        qtyChange: 980,
        financialValue: 17000000, // HPP Total
        user: { name: 'Citra', role: 'QC & Finishing' }
    },
    {
        id: 4,
        stage: 'STOCK',
        title: 'Inbound Gudang Utama',
        timestamp: '04 Jul 2026 - 16:10 WIB',
        documentNo: 'STK-IN-092',
        itemName: 'Kaos Polos Pola-A',
        qtyChange: 980,
        financialValue: null,
        user: { name: 'Doni', role: 'Logistik/Gudang' }
    },
    {
        id: 5,
        stage: 'PENJUALAN',
        title: 'Invoicing ke Pelanggan',
        timestamp: '06 Jul 2026 - 10:22 WIB',
        documentNo: 'INV-2026-550',
        itemName: 'Kaos Polos Pola-A (500 Pcs)',
        qtyChange: -500,
        financialValue: 25000000, // Nilai Penjualan
        user: { name: 'Eka', role: 'Sales/Kasir' }
    },
    {
        id: 6,
        stage: 'LABA',
        title: 'Kalkulasi Laba Kotor Penjualan',
        timestamp: '07 Jul 2026 - 10:00 WIB',
        documentNo: 'REV-2026-041',
        itemName: 'Realisasi Laba Batch MTR01',
        qtyChange: null,
        financialValue: 16327000, // Laba
        user: { name: 'Fani', role: 'Finance' }
    }
])

// State untuk mengatur buka-tutup detail card (Default semua terbuka true)
const expandedSteps = ref(new Array(timelineData.value.length).fill(true))

const toggleStep = (index) => {
    expandedSteps.value[index] = !expandedSteps.value[index]
}

// Helpers untuk Utility Class Pewarnaan Dot Timeline
const getStepColorClass = (stage) => {
    const classes = {
        'PEMBELIAN': 'bg-teal-500',
        'PRODUKSI': 'bg-blue-500',
        'HASIL PRODUK': 'bg-amber-500',
        'STOCK': 'bg-orange-500',
        'PENJUALAN': 'bg-red-500',
        'LABA': 'bg-green-500'
    }
    return classes[stage] || 'bg-gray-500'
}

// Helpers untuk Utility Class Pewarnaan Badge Status
const getBadgeColorClass = (stage) => {
    const classes = {
        'PEMBELIAN': 'bg-teal-50 text-teal-700 border border-teal-200',
        'PRODUKSI': 'bg-blue-50 text-blue-700 border border-blue-200',
        'HASIL PRODUK': 'bg-amber-50 text-amber-700 border border-amber-200',
        'STOCK': 'bg-orange-50 text-orange-700 border border-orange-200',
        'PENJUALAN': 'bg-red-50 text-red-700 border border-red-200',
        'LABA': 'bg-green-100 text-green-800 border border-green-300'
    }
    return classes[stage] || 'bg-gray-100 text-gray-700'
}

// Format Angka ke Rupiah
const formatRupiah = (value) => {
    if (!value) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(value)
}
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>