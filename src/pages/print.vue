<script setup lang="ts">
import { ref } from 'vue'
import PrintComponent from '@/components/dynamic/PrintComponent.vue'
import type { DocumentBlueprint } from '@/printing/types'
// import Menu from '@/components/Menu.vue' // Pastikan ini di-import jika ada komponen Menu

const printBlueprint = ref<DocumentBlueprint | null>(null)
const activeReportId = ref<string | null>(null)

// --- DATA DUMMY: Kumpulan Blueprint dari "API Server" ---
const availableReports = [
    {
        id: 'receipt_58',
        title: 'Struk Kasir (Pelanggan)',
        description: 'Ukuran 58mm, detail harga lengkap',
        icon: '🧾',
        blueprint: {
            "docType": "receipt",
            "pageSize": "thermal58",
            "elements": [
                { "type": "text", "text": "KEDAI KOPI SENJA", "align": "center", "bold": true, "size": 1 },
                { "type": "text", "text": "Jl. Sudirman No. 45, Jakarta", "align": "center" },
                { "type": "separator", "style": "dashed" },
                {
                    "type": "table",
                    "columns": [
                        { "width": 16, "align": "left" },
                        { "width": 16, "align": "right" }
                    ],
                    "rows": [
                        ["No: INV-20260820", "20/08/26 10:49"],
                        ["Kasir: Andi", "Cust: Budi"]
                    ]
                },
                { "type": "separator", "style": "dashed" },
                {
                    "type": "table",
                    "columns": [
                        { "width": 16, "align": "left" },
                        { "width": 4, "align": "center" },
                        { "width": 12, "align": "right" }
                    ],
                    "rows": [
                        ["Kopi Susu Aren", "2", "50.000"],
                        ["Roti Bakar Coklat", "1", "30.000"],
                        ["Es Teh Manis", "3", "15.000"]
                    ]
                },
                { "type": "separator", "style": "dashed" },
                {
                    "type": "table",
                    "columns": [
                        { "width": 16, "align": "left" },
                        { "width": 16, "align": "right" }
                    ],
                    "rows": [
                        ["Subtotal", "95.000"],
                        ["Diskon", "-5.000"],
                        ["Pajak (11%)", "9.900"]
                    ]
                },
                {
                    "type": "table",
                    "columns": [
                        { "width": 16, "align": "left" },
                        { "width": 16, "align": "right" }
                    ],
                    "bold": true,
                    "rows": [
                        ["TOTAL", "99.900"],
                        ["DIBAYAR", "100.000"],
                        ["KEMBALI", "100"]
                    ]
                },
                { "type": "space", "lines": 1 },
                { "type": "qrcode", "value": "https://struk.online/INV-20260820", "align": "center" },
                { "type": "space", "lines": 1 },
                { "type": "text", "text": "Terima Kasih!", "align": "center", "italic": true }
            ]
        } as DocumentBlueprint
    },
    {
        id: 'kitchen_80',
        title: 'Tiket Dapur (Pesanan)',
        description: 'Ukuran 80mm, teks besar, tanpa harga',
        icon: '🍳',
        blueprint: {
            "docType": "receipt",
            "pageSize": "thermal80",
            "elements": [
                { "type": "text", "text": "PESANAN DAPUR", "align": "center", "bold": true, "size": 2 },
                { "type": "text", "text": "MEJA: 12", "align": "center", "bold": true, "size": 2 },
                { "type": "separator", "style": "solid" },
                {
                    "type": "table",
                    "columns": [
                        { "width": 38, "align": "left" }, // Total 48 kolom untuk 80mm
                        { "width": 10, "align": "right" }
                    ],
                    "bold": true,
                    "rows": [
                        ["Kopi Susu Aren (Less Sugar)", "2x"],
                        ["Roti Bakar Coklat Keju", "1x"],
                        ["Es Teh Manis", "3x"]
                    ]
                },
                { "type": "separator", "style": "solid" },
                { "type": "text", "text": "Waktu Pesan: 10:49", "align": "center" },
                { "type": "text", "text": "Waitress: Siska", "align": "center" }
            ]
        } as DocumentBlueprint
    },
    {
        id: 'report_80',
        title: 'Laporan Shift Kasir',
        description: 'Ukuran 80mm, rekapitulasi penjualan harian',
        icon: '📊',
        blueprint: {
            "docType": "report",
            "pageSize": "thermal80",
            "elements": [
                { "type": "text", "text": "LAPORAN SHIFT", "align": "center", "bold": true, "size": 1 },
                { "type": "text", "text": "Tanggal: 20 Agustus 2026", "align": "center" },
                { "type": "text", "text": "Kasir: Andi (Shift Pagi)", "align": "center" },
                { "type": "separator", "style": "dashed" },
                { "type": "text", "text": "RINGKASAN PEMBAYARAN", "bold": true },
                {
                    "type": "table",
                    "columns": [
                        { "width": 24, "align": "left" },
                        { "width": 24, "align": "right" }
                    ],
                    "rows": [
                        ["Tunai", "Rp 1.500.000"],
                        ["BCA EDC", "Rp 2.350.000"],
                        ["QRIS Gopay", "Rp 850.000"],
                        ["QRIS ShopeePay", "Rp 400.000"]
                    ]
                },
                { "type": "separator", "style": "dashed" },
                {
                    "type": "table",
                    "columns": [
                        { "width": 24, "align": "left" },
                        { "width": 24, "align": "right" }
                    ],
                    "bold": true,
                    "rows": [
                        ["TOTAL PENDAPATAN", "Rp 5.100.000"],
                        ["TOTAL TRANSAKSI", "84 Struk"]
                    ]
                },
                { "type": "space", "lines": 2 },
                { "type": "text", "text": "______________________", "align": "center" },
                { "type": "text", "text": "Tanda Tangan Kasir", "align": "center" }
            ]
        } as DocumentBlueprint
    },
    // --- BARCODE LABEL BARU DITAMBAHKAN DI SINI ---
    {
        id: 'label_barcode',
        title: 'Label Barcode Produk',
        description: 'Stiker label untuk rak atau produk (58mm)',
        icon: '🏷️',
        blueprint: {
            "docType": "label",
            "pageSize": "label",
            "elements": [
                { "type": "text", "text": "KEDAI KOPI SENJA", "align": "center", "bold": true },
                { "type": "text", "text": "Biji Kopi Arabica 200g", "align": "center", "size": 1 },
                { "type": "space", "lines": 1 },
                { "type": "barcode", "format": 'CODE128', "value": "8991234567890", "align": "center" },
                { "type": "space", "lines": 1 },
                { "type": "text", "text": "Rp 75.000", "align": "center", "bold": true, "size": 2 },
                { "type": "space", "lines": 1 }
            ]
        } as DocumentBlueprint
    }
]

// Fungsi untuk melempar blueprint ke komponen cetak
const loadDocument = (reportId: string, blueprintData: DocumentBlueprint) => {
    activeReportId.value = reportId
    printBlueprint.value = blueprintData
}
</script>

<template>
    <div class="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <!-- Anggap komponen Menu Anda ada di sini -->
        <Menu />

        <!-- Area Konten Utama -->
        <div class="flex-1 flex p-6 gap-6 h-screen overflow-hidden">

            <!-- KOLOM KIRI: Daftar Pilihan Dokumen -->
            <div class="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">

                <div class="grid gap-3 mt-4">
                    <button v-for="report in availableReports" :key="report.id"
                        @click="loadDocument(report.id, report.blueprint)"
                        class="flex items-start text-left p-4 rounded-2xl border transition-all duration-200" :class="[
                            activeReportId === report.id
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 dark:bg-blue-900/20'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md dark:bg-slate-800 dark:border-slate-700'
                        ]">
                        <span>{{ report.icon }}</span>
                        <div class="flex-1">
                            <h6 class="font-bold text-slate-800 dark:text-white text-base mb-1">
                                {{ report.title }}
                            </h6>
                            <p class="text-slate-500 text-sm">
                                {{ report.description }}
                            </p>
                        </div>

                        <!-- Indikator aktif (opsional, untuk UI lebih baik) -->
                        <div v-if="activeReportId === report.id"
                            class="text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center h-full">
                            ✓
                        </div>
                    </button>
                </div>
            </div>

            <!-- KOLOM KANAN: Preview & Eksekusi Komponen Print -->
            <div
                class="w-full h-full flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-sm">

                <!-- Area Preview yang membungkus erat PrintComponent -->
                <div class="flex-1 h-full overflow-hidden relative">
                    <!-- Jika blueprint ada, panggil komponen -->
                    <PrintComponent v-if="printBlueprint" :blueprint="printBlueprint" class="absolute inset-0" />

                    <!-- Jika belum ada yang dipilih (Empty State) -->
                    <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <svg class="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z">
                            </path>
                        </svg>
                        <p class="text-base font-medium">Belum ada dokumen dipilih</p>
                        <p class="text-sm">Klik salah satu dokumen di sebelah kiri.</p>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>