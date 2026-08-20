<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { PrintService } from '@/printing/printService'
import { DriverConnection } from '@/printing/connections/driverConnection'
import { NetworkConnection } from '@/printing/connections/networkConnection'
import { BluetoothConnection } from '@/printing/connections/bluetoothConnection'
import type { DocumentBlueprint } from '@/printing/types'

// ==========================================
// PROPS (Data berasal dari Parent)
// ==========================================
const props = defineProps<{
    blueprint: DocumentBlueprint
}>()

const printService = new PrintService()
const previewHtml = ref<string>('')
const blobPreviewUrl = ref<string>('')

// ==========================================
// 1. REFS & STATE
// ==========================================
const isDeviceDialogOpen = ref(false)
const printMode = ref<'driver' | 'network' | 'bluetooth'>('driver')
const printerList = ref<Array<{ name: string; isDefault: boolean }>>([])
const selectedPrinter = ref('')
const networkHost = ref('192.168.1.200')
const networkPort = ref(9100)
const paperWidth = ref<32 | 48>(32) // 32 = 58mm, 48 = 80mm
const isPrinting = ref(false)
const isLoadingPrinters = ref(false)
const statusMessage = ref('')
const isSuccess = ref(true)

// Bluetooth States
const bluetoothConnectionRef = ref<BluetoothConnection | null>(null)
const bluetoothDeviceName = ref<string>('')
const isScanningBluetooth = ref(false)

// ==========================================
// 2. RENDER PREVIEW (Dari Blueprint)
// ==========================================
const updatePreview = async () => {
    if (!props.blueprint) return
    try {
        const htmlContent = await printService.renderToHtml(
            props.blueprint,
        )
        previewHtml.value = htmlContent

        if (blobPreviewUrl.value) {
            URL.revokeObjectURL(blobPreviewUrl.value)
        }

        const blob = new Blob([htmlContent], { type: 'text/html' })
        blobPreviewUrl.value = URL.createObjectURL(blob)
    } catch (err) {
        console.error('[PosPrinting] Gagal merender preview HTML:', err)
    }
}

// ==========================================
// 3. COMPUTED & VALIDATION HELPERS
// ==========================================
const isNetworkIpValid = computed(() => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
    return ipPattern.test(networkHost.value) && networkPort.value > 0
})

const isPrintDisabled = computed(() => {
    if (isPrinting.value || isLoadingPrinters.value) return true
    if (printMode.value === 'driver' && !selectedPrinter.value) return true
    if (printMode.value === 'network' && !isNetworkIpValid.value) return true
    if (printMode.value === 'bluetooth' && !bluetoothConnectionRef.value?.isPaired()) return true
    return false
})

const getModeBtnClass = (mode: 'driver' | 'network' | 'bluetooth') => [
    'py-1.5 rounded-lg transition-colors duration-150 flex items-center justify-center gap-1 font-medium text-xs cursor-pointer select-none',
    printMode.value === mode
        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
]

const statusAlertClass = computed(() =>
    isSuccess.value
        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
)

// ==========================================
// 4. METHODS & HARDWARE HANDLERS
// ==========================================
const loadPrinters = async () => {
    // Fungsi Electron Asli Milik Anda dipertahankan
    if (!(window as any).electronAPI) {
        console.warn('[PosPrinting] Electron API tidak terdeteksi.')
        return
    }
    isLoadingPrinters.value = true
    try {
        printerList.value = await DriverConnection.listPrinters()
        if (printerList.value.length > 0) {
            const defaultPrinter = printerList.value.find((p) => p.isDefault)
            selectedPrinter.value = defaultPrinter ? defaultPrinter.name : printerList.value[0].name
        } else {
            selectedPrinter.value = ''
            statusMessage.value = 'Tidak ada printer thermal/fisik yang terdeteksi.'
            isSuccess.value = false
        }
    } catch (err: any) {
        console.error('[PosPrinting] Gagal memuat printer:', err)
        statusMessage.value = 'Gagal memuat daftar printer sistem.'
        isSuccess.value = false
    } finally {
        isLoadingPrinters.value = false
    }
}

const handlePrintClick = async () => {
    statusMessage.value = ''
    isDeviceDialogOpen.value = true
    if (printMode.value === 'driver') {
        await loadPrinters()
    }
}

const closeDeviceDialog = () => {
    isDeviceDialogOpen.value = false
}

const scanBluetoothDevice = async () => {
    isScanningBluetooth.value = true
    statusMessage.value = 'Mencari perangkat Bluetooth...'

    const conn = new BluetoothConnection()
    const result = await conn.scanAndPair() // Fungsi native BT milik Anda dipertahankan

    if (result.success) {
        bluetoothConnectionRef.value = conn
        bluetoothDeviceName.value = result.deviceName || ''
        statusMessage.value = `Terhubung: ${result.deviceName}`
        isSuccess.value = true
    } else {
        statusMessage.value = `Gagal scan Bluetooth: ${result.error || 'Perangkat tidak ditemukan'}`
        isSuccess.value = false
    }
    isScanningBluetooth.value = false
}

const confirmAndPrint = async () => {
    if (isPrintDisabled.value || !props.blueprint) return
    isPrinting.value = true
    statusMessage.value = ''

    try {
        let connection: DriverConnection | NetworkConnection | BluetoothConnection

        if (printMode.value === 'driver') {
            connection = new DriverConnection(selectedPrinter.value)
        } else if (printMode.value === 'network') {
            connection = new NetworkConnection(networkHost.value, networkPort.value)
        } else {
            if (!bluetoothConnectionRef.value) {
                throw new Error('Perangkat Bluetooth belum terhubung.')
            }
            connection = bluetoothConnectionRef.value as BluetoothConnection
        }

        // MENCETAK MENGGUNAKAN PROPS BLUEPRINT
        const result = await printService.printToHardware(
            props.blueprint,
            connection,
        )

        if (!result.success) throw new Error(result.error)

        isSuccess.value = true
        statusMessage.value = 'Dokumen berhasil dicetak!'
        setTimeout(() => closeDeviceDialog(), 1000)
    } catch (err: any) {
        isSuccess.value = false
        statusMessage.value = `Gagal cetak: ${err.message || err}`
    } finally {
        isPrinting.value = false
    }
}

// ==========================================
// 5. GLOBAL KEYBOARD LISTENERS
// ==========================================
const handleGlobalKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

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

// Memantau Blueprint dan Lebar kertas
watch([() => props.blueprint, paperWidth], () => {
    updatePreview()
}, { immediate: true, deep: true })

onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeyDown)
    loadPrinters()
})

onUnmounted(() => {
    if (blobPreviewUrl.value) {
        URL.revokeObjectURL(blobPreviewUrl.value)
    }
    window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>

<template>
    <div class="relative w-full h-full min-h-[500px] flex flex-col overflow-hidden bg-gray-950 select-none">

        <!-- TOP CONTROL BAR: PILIH JENIS DOKUMEN & COPY TYPE -->
        <div
            class="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 z-20">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <Icon icon="mdi:card-account-details-outline" class="w-4 h-4 text-emerald-400" />
                    <span>{{ props.blueprint?.docType || 'Information' }}</span>
                </div>
            </div>
        </div>

        <!-- 1. LIVE DYNAMIC RECEIPT PREVIEW -->
        <iframe v-if="props.blueprint" class="w-full h-full border-0 bg-white" :src="blobPreviewUrl"
            title="Receipt Preview"></iframe>

        <div v-else class="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            Menunggu Blueprint dari Server...
        </div>

        <!-- 2. FLOATING ACTION DOCK (FOOTER BAR) -->
        <div
            class="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold text-slate-400 uppercase hidden sm:inline">Kertas:</span>
                <div
                    class="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button type="button" :class="[
                        'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                        paperWidth === 32 ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-300'
                    ]" @click="paperWidth = 32">58 mm</button>
                    <button type="button" :class="[
                        'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                        paperWidth === 48 ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-300'
                    ]" @click="paperWidth = 48">80 mm</button>
                </div>
            </div>

            <button type="button" :disabled="!props.blueprint"
                class="px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
                @click="handlePrintClick">
                <Icon icon="mdi:printer-pos-outline" class="w-4 h-4" />
                <span>Cetak</span>
                <kbd class="px-1.5 py-0.5 text-[9px] font-mono bg-emerald-700/80 rounded border border-emerald-400/30">Enter
                    /
                    F9</kbd>
            </button>
        </div>

        <!-- 3. DIALOG 3 MODE PRINTER -->
        <div v-if="isDeviceDialogOpen"
            class="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            @click.self="closeDeviceDialog">
            <div
                class="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">

                <div
                    class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div class="flex items-center gap-2">
                        <div
                            class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <Icon icon="mdi:printer-pos-outline" class="w-4 h-4" />
                        </div>
                        <div>
                            <h3 class="text-xs font-bold text-slate-800 dark:text-slate-100">Pilih Perangkat & Transmisi
                            </h3>
                        </div>
                    </div>
                    <button type="button" class="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
                        @click="closeDeviceDialog">
                        <Icon icon="mdi:close" class="w-4 h-4" />
                    </button>
                </div>

                <div class="p-4 space-y-4">
                    <div class="flex flex-col space-y-1">
                        <label class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Metode
                            Transmisi</label>
                        <div class="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs">
                            <button type="button" :class="getModeBtnClass('driver')" @click="printMode = 'driver'">
                                <Icon icon="mdi:usb" class="w-3.5 h-3.5" /><span>OS Driver</span>
                            </button>
                            <button type="button" :class="getModeBtnClass('network')" @click="printMode = 'network'">
                                <Icon icon="mdi:lan" class="w-3.5 h-3.5" /><span>LAN IP</span>
                            </button>
                            <button type="button" :class="getModeBtnClass('bluetooth')"
                                @click="printMode = 'bluetooth'">
                                <Icon icon="mdi:bluetooth" class="w-3.5 h-3.5" /><span>Bluetooth</span>
                            </button>
                        </div>
                    </div>

                    <div class="min-h-[58px] flex flex-col justify-center">
                        <!-- Mode Driver OS -->
                        <div v-if="printMode === 'driver'" class="flex flex-col space-y-1">
                            <label class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Pilih
                                Printer
                                Terpasang</label>
                            <div v-if="isLoadingPrinters"
                                class="py-2 flex items-center justify-center text-slate-400 gap-2 text-xs">
                                <Icon icon="mdi:loading" class="w-4 h-4 animate-spin text-emerald-500" />
                                <span>Memuat daftar printer...</span>
                            </div>
                            <select v-else v-model="selectedPrinter"
                                class="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
                                <option value="" disabled>-- Pilih Printer Sistem --</option>
                                <option v-for="p in printerList" :key="p.name" :value="p.name">
                                    {{ p.name }} {{ p.isDefault ? '(Default)' : '' }}
                                </option>
                            </select>
                        </div>

                        <!-- Mode Network LAN IP -->
                        <div v-else-if="printMode === 'network'" class="grid grid-cols-3 gap-2">
                            <div class="col-span-2 flex flex-col space-y-1">
                                <label class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">IP
                                    Socket
                                    Printer</label>
                                <input v-model="networkHost" type="text" placeholder="192.168.1.200"
                                    class="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div class="flex flex-col space-y-1">
                                <label
                                    class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Port</label>
                                <input v-model.number="networkPort" type="number"
                                    class="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                            </div>
                        </div>

                        <!-- Mode Bluetooth BLE -->
                        <div v-else class="flex flex-col space-y-1">
                            <label class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Perangkat
                                Bluetooth
                                Printer</label>
                            <div class="flex items-center gap-2">
                                <div
                                    class="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950/50 flex items-center gap-2">
                                    <Icon icon="mdi:bluetooth-connect" class="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span class="truncate font-medium">{{ bluetoothDeviceName || 'no device'
                                        }}</span>
                                </div>
                                <button type="button" :disabled="isScanningBluetooth"
                                    class="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                                    @click="scanBluetoothDevice">
                                    <Icon v-if="isScanningBluetooth" icon="mdi:loading"
                                        class="w-3.5 h-3.5 animate-spin" />
                                    <Icon v-else icon="mdi:radar" class="w-3.5 h-3.5" />
                                    <span>Scan</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="statusMessage" :class="statusAlertClass"
                        class="p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all">
                        <span class="w-1.5 h-1.5 rounded-full" :class="isSuccess ? 'bg-emerald-500' : 'bg-rose-500'" />
                        <span>{{ statusMessage }}</span>
                    </div>
                </div>

                <div class="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button type="button"
                        class="px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        @click="closeDeviceDialog">
                        Batal (Esc)
                    </button>
                    <button type="button" :disabled="isPrintDisabled"
                        class="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
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