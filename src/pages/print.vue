<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import PrintComponent from '@/components/dynamic/PrintComponent.vue'
import type { DocumentBlueprint, DocElement } from '@/printing/types'

const printBlueprint = ref<DocumentBlueprint | null>(null)
const activeReportId = ref<string | null>(null)
const selectedElementIndex = ref<number | null>(null)
const draggedIndex = ref<number | null>(null)

// --- DATA DUMMY BLUEPRINT ---
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
                { "type": "text", "text": "TINTA UV DTF CMYK 100ML", "align": "center", "bold": true, "size": 2 },
                { "type": "space", "lines": 1 },
                { "type": "text", "text": "Rp 75.000", "align": "center", "bold": true, "size": 2 },
                { "type": "space", "lines": 1 },
                { "type": "barcode", "format": 'CODE128', "value": "8991234567890", "align": "center" },
                { "type": "space", "lines": 1 },
            ]
        } as DocumentBlueprint
    },
    {
        id: 'invoice_a4',
        title: 'Faktur Penjualan (A4)',
        description: 'Format profesional untuk klien B2B',
        icon: '📄',
        blueprint: {
            "docType": "invoice",
            "pageSize": "A4",
            "elements": [
                { "type": "text", "text": "FAKTUR PENJUALAN", "align": "right", "bold": true, "size": 3 },
                { "type": "text", "text": "KEDAI KOPI SENJA", "align": "left", "bold": true },
                { "type": "text", "text": "Jl. Sudirman No. 45, Jakarta", "align": "left" },
                { "type": "separator", "style": "solid" },
                {
                    "type": "table",
                    "columns": [{ "width": 25, "align": "left" }, { "width": 25, "align": "right" }],
                    "rows": [["No. Faktur: INV/2026/08/001", "Tanggal: 20/08/2026"], ["Kepada: PT Maju Jaya", "Jatuh Tempo: 27/08/2026"]]
                },
                { "type": "space", "lines": 1 },
                {
                    "type": "table",
                    "columns": [{ "width": 10, "header": "Qty" }, { "width": 30, "header": "Deskripsi" }, { "width": 20, "header": "Total" }],
                    "rows": [["10", "Biji Kopi Arabika 1kg", "1.500.000"], ["5", "Cangkir Keramik Set", "500.000"]]
                },
                { "type": "signature_block", "labels": ["Dibuat Oleh", "Diterima Oleh"] }
            ]
        }
    },
    {
        id: 'po_a4',
        title: 'Purchase Order (PO)',
        description: 'Dokumen pemesanan barang ke supplier',
        icon: '📦',
        blueprint: {
            "docType": "purchase_order",
            "pageSize": "A4",
            "elements": [
                { "type": "text", "text": "PURCHASE ORDER", "align": "center", "bold": true, "size": 3 },
                { "type": "text", "text": "Kepada: Supplier Kopi Nusantara", "align": "left" },
                { "type": "separator", "style": "solid" },
                {
                    "type": "table",
                    "columns": [{ "width": 20 }, { "width": 40 }],
                    "rows": [["PO Number", "PO-2026-088"], ["Ship To", "Gudang Pusat, Jakarta"]]
                },
                { "type": "space", "lines": 1 },
                {
                    "type": "table",
                    "columns": [{ "width": 10, "header": "No" }, { "width": 40, "header": "Item" }, { "width": 10, "header": "Qty" }],
                    "rows": [["1", "Green Bean Gayo", "50kg"], ["2", "Packaging Bag", "500pcs"]]
                }
            ]
        }
    },
    {
        id: 'do_a4',
        title: 'Surat Jalan (DO)',
        description: 'Bukti pengiriman barang',
        icon: '🚚',
        blueprint: {
            "docType": "delivery_order",
            "pageSize": "A5",
            "elements": [
                { "type": "text", "text": "SURAT JALAN", "align": "center", "bold": true, "size": 2 },
                { "type": "text", "text": "No: DO-2026-001", "align": "center" },
                {
                    "type": "table",
                    "columns": [{ "width": 25 }, { "width": 25 }],
                    "rows": [["Pengirim: Kedai Senja", "Penerima: Kafe Cabang"]]
                },
                { "type": "space", "lines": 1 },
                { "type": "table", "columns": [{ "width": 10 }, { "width": 30 }], "rows": [["2", "Meja Kayu Jati"], ["4", "Kursi Cafe"]] },
                { "type": "space", "lines": 2 },
                { "type": "signature_block", "labels": ["Sopir", "Penerima"] }
            ]
        }
    }

]

// --- MUAT DOKUMEN ---
const loadDocument = (reportId: string, blueprintData: DocumentBlueprint) => {
    activeReportId.value = reportId
    printBlueprint.value = JSON.parse(JSON.stringify(blueprintData))
    selectedElementIndex.value = null
}

// --- DRAG & DROP HANDLERS ---
const onDragStart = (index: number, event: DragEvent) => {
    draggedIndex.value = index
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
    }
}

const onDrop = (targetIndex: number) => {
    if (draggedIndex.value === null || !printBlueprint.value) return

    const elements = printBlueprint.value.elements
    const itemToMove = elements.splice(draggedIndex.value, 1)[0]
    elements.splice(targetIndex, 0, itemToMove)

    selectedElementIndex.value = targetIndex
    draggedIndex.value = null
}

// --- MANIPULASI ELEMEN ---
const addElement = (type: DocElement['type']) => {
    if (!printBlueprint.value) return
    let newEl: DocElement

    switch (type) {
        case 'text': newEl = { type: 'text', text: 'Teks Baru', align: 'left', size: 1 }; break
        case 'separator': newEl = { type: 'separator', style: 'dashed' }; break
        case 'space': newEl = { type: 'space', lines: 1 }; break
        case 'qrcode': newEl = { type: 'qrcode', value: 'https://example.com', align: 'center' }; break
        case 'barcode': newEl = { type: 'barcode', value: '1234567890', format: 'CODE128', align: 'center' }; break
        default: newEl = { type: 'text', text: 'Teks Baru' }
    }

    printBlueprint.value.elements.push(newEl)
    selectedElementIndex.value = printBlueprint.value.elements.length - 1
}

const removeSelectedElement = () => {
    if (selectedElementIndex.value === null || !printBlueprint.value) return
    printBlueprint.value.elements.splice(selectedElementIndex.value, 1)

    if (printBlueprint.value.elements.length === 0) {
        selectedElementIndex.value = null
    } else if (selectedElementIndex.value >= printBlueprint.value.elements.length) {
        selectedElementIndex.value = printBlueprint.value.elements.length - 1
    }
}

// --- KEYBOARD LISTENER (DELETE / BACKSPACE) ---
const handleKeyDown = (e: KeyboardEvent) => {
    const activeEl = document.activeElement
    const isInputFocused = activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName))

    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused) {
        removeSelectedElement()
    }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
    <div
        class="flex h-screen bg-slate-200 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs overflow-hidden select-none">

        <!-- PANEL 1: NAVIGATOR TEMPLATE (KIRI) -->
        <div class="w-60 border-r border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col">
            <div
                class="p-2 border-b border-slate-300 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
                Templates
            </div>
            <div class="flex-1 overflow-y-auto p-1.5 space-y-1">
                <button v-for="report in availableReports" :key="report.id"
                    @click="loadDocument(report.id, report.blueprint)"
                    class="w-full text-left p-2 rounded border transition-all flex items-center gap-2" :class="[
                        activeReportId === report.id
                            ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    ]">
                    <span>{{ report.icon }}</span>
                    <span class="truncate">{{ report.title }}</span>
                </button>
            </div>
        </div>

        <!-- PANEL 2: EXCEL-LIKE COMPACT SHEET EDITOR (TENGAH) -->
        <div v-if="printBlueprint"
            class="w-[480px] border-r border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">

            <!-- Action Bar Compact -->
            <div
                class="p-2 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between bg-slate-100 dark:bg-slate-900 gap-1">
                <div class="flex items-center gap-1 overflow-x-auto">
                    <button @click="addElement('text')"
                        class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-sans text-[11px] font-medium">+
                        Text</button>
                    <button @click="addElement('separator')"
                        class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-sans text-[11px] font-medium">+
                        Line</button>
                    <button @click="addElement('space')"
                        class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-sans text-[11px] font-medium">+
                        Space</button>
                    <button @click="addElement('qrcode')"
                        class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-sans text-[11px] font-medium">+
                        QR</button>
                </div>
                <select v-model="printBlueprint.pageSize"
                    class="px-1.5 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded font-sans text-[11px]">
                    <option value="thermal58" class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">58mm
                    </option>
                    <option value="thermal80" class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">80mm
                    </option>
                    <option value="A4" class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">A4</option>
                </select>
            </div>

            <!-- Excel Grid Header -->
            <div
                class="grid grid-cols-12 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold text-[10px] text-slate-700 dark:text-slate-300 uppercase text-center">
                <div class="col-span-1 border-r border-slate-300 dark:border-slate-700 py-1">Drag</div>
                <div class="col-span-1 border-r border-slate-300 dark:border-slate-700 py-1">#</div>
                <div class="col-span-3 border-r border-slate-300 dark:border-slate-700 py-1 text-left px-1.5">Type</div>
                <div class="col-span-7 py-1 text-left px-1.5">Properties (Inline Edit)</div>
            </div>

            <!-- Sheet Rows List -->
            <div
                class="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-800 bg-white dark:bg-slate-900">
                <div v-for="(el, idx) in printBlueprint.elements" :key="idx" draggable="true"
                    @dragstart="onDragStart(idx, $event)" @dragover.prevent @drop="onDrop(idx)"
                    @click="selectedElementIndex = idx"
                    class="grid grid-cols-12 items-center cursor-pointer transition-colors" :class="[
                        selectedElementIndex === idx
                            ? 'bg-blue-100 dark:bg-blue-950/80 ring-2 ring-inset ring-blue-500'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                        draggedIndex === idx ? 'opacity-30 bg-slate-300 dark:bg-slate-700' : ''
                    ]">
                    <!-- Drag Handle -->
                    <div
                        class="col-span-1 border-r border-slate-200 dark:border-slate-800 py-1.5 text-center cursor-grab active:cursor-grabbing text-slate-500 dark:text-slate-400 font-bold">
                        ⠿
                    </div>

                    <!-- Index Number -->
                    <div
                        class="col-span-1 border-r border-slate-200 dark:border-slate-800 py-1.5 text-center font-bold text-slate-500 dark:text-slate-400">
                        {{ idx + 1 }}
                    </div>

                    <!-- Element Type -->
                    <div
                        class="col-span-3 border-r border-slate-200 dark:border-slate-800 py-1.5 px-1.5 font-bold text-blue-700 dark:text-blue-400 truncate">
                        {{ el.type }}
                    </div>

                    <!-- Editable Properties -->
                    <div
                        class="col-span-7 py-1 px-1.5 flex items-center gap-1.5 overflow-hidden text-slate-900 dark:text-slate-100">

                        <!-- Props: TEXT -->
                        <template v-if="el.type === 'text'">
                            <input v-model="el.text" type="text"
                                class="flex-1 bg-transparent text-slate-900 dark:text-slate-100 border-none outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 rounded px-1 truncate"
                                placeholder="Content..." />
                            <select v-model="el.align"
                                class="bg-transparent border-none outline-none text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                                <option value="left"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">L</option>
                                <option value="center"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">C</option>
                                <option value="right"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">R</option>
                            </select>
                            <button @click.stop="el.bold = !el.bold"
                                class="px-1.5 py-0.5 font-bold rounded border border-slate-300 dark:border-slate-700"
                                :class="el.bold ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'">B</button>
                        </template>

                        <!-- Props: SEPARATOR -->
                        <template v-else-if="el.type === 'separator'">
                            <select v-model="el.style"
                                class="w-full bg-transparent text-slate-900 dark:text-slate-100 border-none outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 rounded">
                                <option value="dashed"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Garis Putus
                                    (Dashed)</option>
                                <option value="solid"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Garis Utuh
                                    (Solid)</option>
                            </select>
                        </template>

                        <!-- Props: SPACE -->
                        <template v-else-if="el.type === 'space'">
                            <span class="text-slate-600 dark:text-slate-400 font-semibold">Lines:</span>
                            <input v-model.number="el.lines" type="number" min="1" max="10"
                                class="w-12 bg-transparent text-slate-900 dark:text-slate-100 border-none outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 rounded px-1" />
                        </template>

                        <!-- Props: QR / BARCODE -->
                        <template v-else-if="el.type === 'qrcode' || el.type === 'barcode'">
                            <input v-model="el.value" type="text"
                                class="flex-1 bg-transparent text-slate-900 dark:text-slate-100 border-none outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 rounded px-1 truncate" />
                            <select v-model="el.align"
                                class="bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 font-semibold">
                                <option value="left"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">L</option>
                                <option value="center"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">C</option>
                                <option value="right"
                                    class="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">R</option>
                            </select>
                        </template>

                        <!-- Props: TABLE -->
                        <template v-else-if="el.type === 'table'">
                            <span class="text-slate-600 dark:text-slate-400 font-semibold truncate">{{ el.rows.length }}
                                Baris Data Table</span>
                        </template>

                    </div>
                </div>
            </div>

            <!-- Compact Footer / Keyboard Hint -->
            <div
                class="p-2 border-t border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-400 flex justify-between items-center font-sans">
                <span class="flex items-center gap-1">
                    Klik baris lalu tekan
                    <kbd
                        class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 rounded font-mono text-[10px] text-slate-900 dark:text-slate-100 font-bold">DEL</kbd>
                    atau
                    <kbd
                        class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 rounded font-mono text-[10px] text-slate-900 dark:text-slate-100 font-bold">BKSP</kbd>
                </span>
                <span class="font-bold">Total: {{ printBlueprint.elements.length }}</span>
            </div>

        </div>

        <!-- Empty State Center Panel -->
        <div v-else
            class="w-[480px] border-r border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-500 font-sans">
            Pilih template di sisi kiri.
        </div>

        <!-- PANEL 3: LIVE PREVIEW (KANAN) -->
        <div
            class="flex-1 bg-slate-300 dark:bg-slate-950 p-4 flex flex-col items-center justify-center overflow-hidden">
            <div
                class="w-full h-full bg-white dark:bg-slate-900 rounded-lg border border-slate-400 dark:border-slate-800 overflow-hidden relative shadow-lg">
                <PrintComponent v-if="printBlueprint" :blueprint="printBlueprint" class="absolute inset-0" />
            </div>
        </div>

    </div>
</template>