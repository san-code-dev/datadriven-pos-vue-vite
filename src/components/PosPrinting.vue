<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'

// ==========================================
// 1. REFS & STATE
// ==========================================
const isDeviceDialogOpen = ref(false)
const printMode = ref<'driver' | 'network' | 'bluetooth'>('driver')
const printerList = ref<any[]>([])
const selectedPrinter = ref('')
const networkHost = ref('192.168.1.200')
const networkPort = ref(9100)
const paperWidth = ref<number>(32) // 32 = 58mm, 48 = 80mm
const isPrinting = ref(false)
const isLoadingPrinters = ref(false)
const statusMessage = ref('')
const isSuccess = ref(true)

// Bluetooth States
const bluetoothDevice = ref<any>(null)
const bluetoothDeviceName = ref<string>('')
const isScanningBluetooth = ref(false)

// Data Dinamis Struk
const storeInfo = ref({
    name: 'KASIR POINT OF SALE',
    address: 'Jl. Pahlawan No. 45, Surabaya',
    phone: 'Telp: (031) 555-1234',
    invoiceNo: 'INV/2026/08/0091',
    date: '14/08/26 15:30'
})

const items = ref([
    { name: 'Kopi Espresso Blend', qty: 1, subtotal: '15.000' },
    { name: 'Roti Bakar Coklat Keju', qty: 2, subtotal: '30.000' },
    { name: 'Es Teh Manis Jasmine', qty: 1, subtotal: '5.000' }
])

const paymentSummary = ref({
    total: 'Rp 50.000',
    bayar: 'Rp 50.000',
    kembali: 'Rp 0'
})

const qrUrl = ref('https://mywebsite.com/invoice/INV-9982')

// ==========================================
// 2. DYNAMIC COMMAND BLUEPRINT UNTUK PREVIEW & ENCODER
// ==========================================
interface ReceiptElement {
    type: 'text' | 'separator' | 'table' | 'qrcode' | 'space'
    text?: string
    align?: 'left' | 'center' | 'right'
    bold?: boolean
    size?: number
    columns?: { width: number; align: 'left' | 'center' | 'right' }[]
    rows?: string[][]
    value?: string
    lines?: number
}

const tableConfig = computed(() => {
    return paperWidth.value === 32
        ? [
            { width: 16, align: 'left' as const },
            { width: 4, align: 'center' as const },
            { width: 12, align: 'right' as const }
        ]
        : [
            { width: 26, align: 'left' as const },
            { width: 6, align: 'center' as const },
            { width: 16, align: 'right' as const }
        ]
})

// Generator Struktur Perintah Struk
const receiptElements = computed<ReceiptElement[]>(() => {
    return [
        // Header
        { type: 'text', text: storeInfo.value.name, align: 'center', bold: true, size: 2 },
        { type: 'text', text: storeInfo.value.address, align: 'center' },
        { type: 'text', text: storeInfo.value.phone, align: 'center' },
        { type: 'separator' },

        // Metadata
        {
            type: 'table',
            columns: [
                { width: Math.floor(paperWidth.value / 2), align: 'left' },
                { width: Math.ceil(paperWidth.value / 2), align: 'right' }
            ],
            rows: [[storeInfo.value.invoiceNo, storeInfo.value.date]]
        },
        { type: 'separator' },

        // Item List
        {
            type: 'table',
            columns: tableConfig.value,
            rows: items.value.map((item) => [item.name, `${item.qty}x`, item.subtotal])
        },
        { type: 'separator' },

        // Total & Payment
        {
            type: 'table',
            columns: [
                { width: Math.floor(paperWidth.value / 2), align: 'left' },
                { width: Math.ceil(paperWidth.value / 2), align: 'right' }
            ],
            rows: [
                ['TOTAL', paymentSummary.value.total],
                ['BAYAR (CASH)', paymentSummary.value.bayar],
                ['KEMBALI', paymentSummary.value.kembali]
            ],
            bold: true
        },
        { type: 'separator' },

        // QR Code & Footer
        { type: 'qrcode', value: qrUrl.value, align: 'center' },
        { type: 'space', lines: 1 },
        { type: 'text', text: 'Terima Kasih Atas Kunjungan Anda!', align: 'center' },
        { type: 'text', text: 'Barang yang dibeli tidak dapat ditukar.', align: 'center' }
    ]
})

// ==========================================
// 3. COMPUTED & HELPER CLASSES
// ==========================================
const isPrintDisabled = computed(() => {
    if (isPrinting.value || isLoadingPrinters.value) return true
    if (printMode.value === 'driver' && !selectedPrinter.value) return true
    if (printMode.value === 'bluetooth' && !bluetoothDevice.value) return true
    return false
})

const getModeBtnClass = (mode: 'driver' | 'network' | 'bluetooth') => {
    const isActive = printMode.value === mode
    return [
        'py-1.5 rounded-lg transition-colors duration-150 flex items-center justify-center gap-1 font-medium text-xs cursor-pointer select-none',
        isActive
            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    ]
}

const statusAlertClass = computed(() => {
    return isSuccess.value
        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
})

// ==========================================
// 4. METHODS & HARDWARE HANDLERS
// ==========================================
const handlePrintClick = async () => {
    statusMessage.value = ''
    isDeviceDialogOpen.value = true
    await loadPrinters()
}

const closeDeviceDialog = () => {
    isDeviceDialogOpen.value = false
}

const scanBluetoothDevice = async () => {
    // Cek ketersediaan API
    if (!navigator.bluetooth) {
        statusMessage.value = 'Web Bluetooth API belum aktif atau tidak didukung di window ini.'
        isSuccess.value = false
        return
    }

    isScanningBluetooth.value = true
    statusMessage.value = 'Mencari perangkat Bluetooth...'

    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS Service
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
                '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Service
                '0000ff00-0000-1000-8000-00805f9b34fb',
                '0000ae00-0000-1000-8000-00805f9b34fb'
            ]
        })

        bluetoothDevice.value = device
        bluetoothDeviceName.value = device.name || `BT Device (${device.id.slice(0, 5)})`
        statusMessage.value = `Terhubung: ${bluetoothDeviceName.value}`
        isSuccess.value = true
    } catch (err: any) {
        if (err.name !== 'NotFoundError') {
            statusMessage.value = `Gagal scan Bluetooth: ${err.message}`
            isSuccess.value = false
        }
    } finally {
        isScanningBluetooth.value = false
    }
}

const printViaBluetooth = async (rawBytes: Uint8Array) => {
    if (!bluetoothDevice.value) {
        throw new Error('Silakan pilih dan scan printer Bluetooth terlebih dahulu.')
    }

    const server = await bluetoothDevice.value.gatt.connect()
    const services = await server.getPrimaryServices()
    let writeChar: any = null

    for (const service of services) {
        const chars = await service.getCharacteristics()
        for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
                writeChar = c
                break
            }
        }
        if (writeChar) break
    }

    if (!writeChar) {
        throw new Error('Karakteristik write Bluetooth tidak ditemukan.')
    }

    const chunkSize = 512
    for (let i = 0; i < rawBytes.length; i += chunkSize) {
        const chunk = rawBytes.slice(i, i + chunkSize)
        if (writeChar.properties.writeWithoutResponse) {
            await writeChar.writeValueWithoutResponse(chunk)
        } else {
            await writeChar.writeValue(chunk)
        }
    }
}

// Generate buffer ESC/POS dinamis dari array receiptElements
const generateEscPosReceipt = (): Uint8Array => {
    let encoder = new ReceiptPrinterEncoder({
        language: 'esc-pos',
        width: paperWidth.value
    }).initialize()

    const lineSeparator = '-'.repeat(paperWidth.value)

    for (const el of receiptElements.value) {
        if (el.align) {
            encoder = encoder.align(el.align)
        }

        if (el.type === 'text') {
            if (el.bold) encoder = encoder.bold(true)
            if (el.size) encoder = encoder.size(el.size)

            encoder = encoder.line(el.text || '')

            if (el.size) encoder = encoder.size(1)
            if (el.bold) encoder = encoder.bold(false)
        } else if (el.type === 'separator') {
            encoder = encoder.line(lineSeparator)
        } else if (el.type === 'table' && el.columns && el.rows) {
            if (el.bold) encoder = encoder.bold(true)
            encoder = encoder.table(el.columns, el.rows)
            if (el.bold) encoder = encoder.bold(false)
        } else if (el.type === 'qrcode' && el.value) {
            encoder = encoder.qrcode(el.value, 1, 6, 'h')
        } else if (el.type === 'space') {
            encoder = encoder.newline(el.lines || 1)
        }
    }

    return encoder.newline(4).cut().encode()
}

// Eksekusi Cetak
const confirmAndPrint = async () => {
    if (isPrintDisabled.value) return
    isPrinting.value = true
    statusMessage.value = ''

    try {
        const rawBytes = generateEscPosReceipt()

        if (printMode.value === 'bluetooth') {
            await printViaBluetooth(rawBytes)
            isSuccess.value = true
            statusMessage.value = 'Struk berhasil dicetak via Bluetooth!'
        } else if (printMode.value === 'driver') {
            if (!window.electronAPI) throw new Error('Electron API tidak terdeteksi.')
            const result = await window.electronAPI.printRawDriver({
                printerName: selectedPrinter.value,
                rawBuffer: rawBytes
            })
            if (!result.success) throw new Error(result.error)
            isSuccess.value = true
            statusMessage.value = 'Struk berhasil dikirim ke printer OS!'
        } else {
            if (!window.electronAPI) throw new Error('Electron API tidak terdeteksi.')
            const result = await window.electronAPI.printRawNetwork({
                host: networkHost.value,
                port: networkPort.value,
                rawBuffer: rawBytes
            })
            if (!result.success) throw new Error(result.error)
            isSuccess.value = true
            statusMessage.value = 'Struk berhasil dikirim via Network IP!'
        }

        setTimeout(() => {
            closeDeviceDialog()
        }, 1000)
    } catch (err: any) {
        isSuccess.value = false
        statusMessage.value = `Gagal: ${err.message || err}`
    } finally {
        isPrinting.value = false
    }
}

// ==========================================
// 5. GLOBAL KEYBOARD LISTENERS (ENTER & F9)
// ==========================================
const handleGlobalKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName)

    if (e.key === 'Enter') {
        if (!isDeviceDialogOpen.value) {
            e.preventDefault()
            handlePrintClick()
        } else if (!isTyping) {
            e.preventDefault()
            confirmAndPrint()
        }
    } else if (e.key === 'F9') {
        e.preventDefault()
        if (!isDeviceDialogOpen.value) {
            handlePrintClick()
        }
    } else if (e.key === 'Escape' && isDeviceDialogOpen.value) {
        e.preventDefault()
        closeDeviceDialog()
    }
}

onMounted(async () => {
    window.addEventListener('keydown', handleGlobalKeyDown)
    await loadPrinters()
})

const loadPrinters = async () => {
    if (!window.electronAPI) return
    isLoadingPrinters.value = true
    try {
        const printers = await window.electronAPI.getPrinters()
        printerList.value = printers || []

        if (printers && printers.length > 0) {
            const defaultPrinter = printers.find((p: any) => p.isDefault)
            if (defaultPrinter) {
                selectedPrinter.value = defaultPrinter.name
            } else if (!selectedPrinter.value) {
                selectedPrinter.value = printers[0].name
            }
        }
    } catch (err: any) {
        console.error('[PosPrinting] Gagal memuat printer:', err)
    } finally {
        isLoadingPrinters.value = false
    }
}
</script>

<template>
    <div class="relative w-full h-full min-h-[500px] flex flex-col overflow-hidden bg-gray-600 select-none">

        <!-- ==========================================
         1. LIVE DYNAMIC RECEIPT PREVIEW
         ========================================== -->
        <div class="flex-1 w-full overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-start pb-24">

            <!-- Label Indikator Ukuran -->
            <div class="flex items-center gap-2 mb-4 text-[11px] font-semibold tracking-wider uppercase text-white">
                <Icon icon="mdi:receipt-text-outline" class="w-4 h-4" />
                <span>Live Dynamic Preview ({{ paperWidth === 32 ? '58mm / 32 Kolom' : '80mm / 48 Kolom' }})</span>
            </div>

            <!-- Kertas Struk Fisik Realistis -->
            <div :style="{ width: paperWidth === 32 ? '58mm' : '80mm' }"
                class="bg-white text-slate-900 shadow-2xl font-mono text-[11px] leading-tight rounded-sm transition-all duration-300 p-4 relative">
                <template v-for="(el, idx) in receiptElements" :key="idx">

                    <!-- Element: Text -->
                    <div v-if="el.type === 'text'" :class="[
                        'w-full py-0.5',
                        el.align === 'center' ? 'text-center' : el.align === 'right' ? 'text-right' : 'text-left',
                        el.bold ? 'font-bold text-slate-900' : 'text-slate-600',
                        el.size && el.size > 1 ? 'text-xs tracking-tight uppercase font-extrabold' : 'text-[10px]'
                    ]">
                        {{ el.text }}
                    </div>

                    <!-- Element: Separator -->
                    <div v-else-if="el.type === 'separator'" class="border-b border-dashed border-slate-300 my-2" />

                    <!-- Element: Table / Grid -->
                    <div v-else-if="el.type === 'table'" class="w-full space-y-1 my-1">
                        <div v-for="(row, rIdx) in el.rows" :key="rIdx" class="flex items-start text-[10px]"
                            :class="el.bold ? 'font-bold text-slate-900' : 'text-slate-700'">
                            <div v-for="(cell, cIdx) in row" :key="cIdx" :style="{
                                width: el.columns?.[cIdx]
                                    ? `${(el.columns[cIdx].width / paperWidth) * 100}%`
                                    : 'auto'
                            }" :class="[
                                'truncate',
                                el.columns?.[cIdx]?.align === 'center'
                                    ? 'text-center'
                                    : el.columns?.[cIdx]?.align === 'right'
                                        ? 'text-right'
                                        : 'text-left'
                            ]">
                                {{ cell }}
                            </div>
                        </div>
                    </div>

                    <!-- Element: QR Code -->
                    <div v-else-if="el.type === 'qrcode'"
                        class="text-center pt-2 flex flex-col items-center justify-center">
                        <div
                            class="w-16 h-16 bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-[7px] text-slate-500 font-sans p-1">
                            <Icon icon="mdi:qrcode" class="w-10 h-10 text-slate-800" />
                            <span class="truncate w-full text-center">{{ el.value?.slice(0, 15) }}...</span>
                        </div>
                    </div>

                    <!-- Element: Spacing / Feed -->
                    <div v-else-if="el.type === 'space'" :style="{ height: `${(el.lines || 1) * 8}px` }" />

                </template>
            </div>
        </div>

        <!-- ==========================================
         2. FLOATING ACTION DOCK (FOOTER BAR)
         ========================================== -->
        <div
            class="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80">

            <!-- Pilihan Kertas -->
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold text-slate-400 uppercase hidden sm:inline">Kertas:</span>
                <div
                    class="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <button type="button" :class="[
                        'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                        paperWidth === 32
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    ]" @click="paperWidth = 32">
                        58 mm
                    </button>
                    <button type="button" :class="[
                        'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                        paperWidth === 48
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    ]" @click="paperWidth = 48">
                        80 mm
                    </button>
                </div>
            </div>

            <!-- Tombol Cetak Langsung -->
            <button type="button"
                class="px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
                @click="handlePrintClick">
                <Icon icon="mdi:printer-pos-outline" class="w-4 h-4" />
                <span>Cetak Struk</span>
                <kbd class="px-1.5 py-0.5 text-[9px] font-mono bg-emerald-700/80 rounded border border-emerald-400/30">Enter
                    /
                    F9</kbd>
            </button>
        </div>

        <!-- ==========================================
         3. DIALOG 3 MODE PRINTER
         ========================================== -->
        <div v-if="isDeviceDialogOpen"
            class="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            @click.self="closeDeviceDialog">
            <div
                class="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-fade-in">

                <!-- Dialog Header -->
                <div
                    class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/50">
                    <div class="flex items-center gap-2">
                        <div
                            class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <Icon icon="mdi:printer-pos-outline" class="w-4 h-4" />
                        </div>
                        <div>
                            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100">
                                Pilih Printer & Mode Transmisi
                            </h3>
                            <p class="text-[10px] text-slate-400 dark:text-slate-500">
                                Tekan <kbd class="font-bold text-emerald-600 dark:text-emerald-400">Enter</kbd> untuk
                                konfirmasi
                                cetak
                            </p>
                        </div>
                    </div>
                    <button type="button"
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                        @click="closeDeviceDialog">
                        <Icon icon="mdi:close" class="w-4 h-4" />
                    </button>
                </div>

                <!-- Dialog Body -->
                <div class="p-4 space-y-4">

                    <!-- Mode Switcher 3 Tombol -->
                    <div class="flex flex-col space-y-1">
                        <label
                            class="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                            Metode Transmisi
                        </label>
                        <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl text-xs">
                            <button type="button" :class="getModeBtnClass('driver')" @click="printMode = 'driver'">
                                <Icon icon="mdi:usb" class="w-3.5 h-3.5" />
                                <span>OS Driver</span>
                            </button>
                            <button type="button" :class="getModeBtnClass('network')" @click="printMode = 'network'">
                                <Icon icon="mdi:lan" class="w-3.5 h-3.5" />
                                <span>LAN IP</span>
                            </button>
                            <button type="button" :class="getModeBtnClass('bluetooth')"
                                @click="printMode = 'bluetooth'">
                                <Icon icon="mdi:bluetooth" class="w-3.5 h-3.5" />
                                <span>Bluetooth</span>
                            </button>
                        </div>
                    </div>

                    <!-- Wrapper Form dengan Tinggi Terkunci (Mencegah Layout Jitter) -->
                    <div class="min-h-[58px] flex flex-col justify-center">
                        <!-- 1. Form Mode Driver OS -->
                        <div v-if="printMode === 'driver'" class="flex flex-col space-y-1">
                            <label
                                class="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                                Pilih Printer Terpasang
                            </label>
                            <div v-if="isLoadingPrinters"
                                class="py-2 flex items-center justify-center text-slate-400 gap-2 text-xs">
                                <Icon icon="mdi:loading" class="w-4 h-4 animate-spin text-emerald-500" />
                                <span>Memuat daftar printer...</span>
                            </div>
                            <select v-else v-model="selectedPrinter"
                                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="" disabled>-- Pilih Printer Sistem --</option>
                                <option v-for="p in printerList" :key="p.name" :value="p.name">
                                    {{ p.name }} {{ p.isDefault ? '(Default)' : '' }}
                                </option>
                            </select>
                        </div>

                        <!-- 2. Form Mode Network LAN IP -->
                        <div v-else-if="printMode === 'network'" class="grid grid-cols-3 gap-2">
                            <div class="col-span-2 flex flex-col space-y-1">
                                <label
                                    class="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                                    IP Socket Printer
                                </label>
                                <input v-model="networkHost" type="text" placeholder="192.168.1.200"
                                    class="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div class="flex flex-col space-y-1">
                                <label
                                    class="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                                    Port
                                </label>
                                <input v-model.number="networkPort" type="number"
                                    class="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </div>

                        <!-- 3. Form Mode Bluetooth BLE Scanner -->
                        <div v-else class="flex flex-col space-y-1">
                            <label
                                class="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                                Perangkat Bluetooth Printer
                            </label>
                            <div class="flex items-center gap-2">
                                <div
                                    class="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                                    <Icon icon="mdi:bluetooth-connect" class="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span class="truncate font-medium">
                                        {{ bluetoothDeviceName || 'Belum ada perangkat terpilih' }}
                                    </span>
                                </div>
                                <button type="button" :disabled="isScanningBluetooth"
                                    class="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
                                    @click="scanBluetoothDevice">
                                    <Icon v-if="isScanningBluetooth" icon="mdi:loading"
                                        class="w-3.5 h-3.5 animate-spin" />
                                    <Icon v-else icon="mdi:radar" class="w-3.5 h-3.5" />
                                    <span>Scan</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Status Pesan Feedback -->
                    <div v-if="statusMessage" :class="statusAlertClass"
                        class="p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all">
                        <span class="w-1.5 h-1.5 rounded-full" :class="isSuccess ? 'bg-emerald-500' : 'bg-rose-500'" />
                        <span>{{ statusMessage }}</span>
                    </div>
                </div>

                <!-- Dialog Footer Actions -->
                <div
                    class="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-end gap-2">
                    <button type="button"
                        class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        @click="closeDeviceDialog">
                        Batal (Esc)
                    </button>

                    <button type="button" :disabled="isPrintDisabled"
                        class="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        @click="confirmAndPrint">
                        <Icon v-if="isPrinting" icon="mdi:loading" class="w-3.5 h-3.5 animate-spin" />
                        <Icon v-else icon="mdi:check" class="w-3.5 h-3.5" />
                        <span>{{ isPrinting ? 'Mencetak...' : 'Konfirmasi Cetak (Enter)' }}</span>
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>