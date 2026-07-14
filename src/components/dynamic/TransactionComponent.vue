<template>
  <div
    class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-slate-100 dark:bg-slate-900 w-full p-3 gap-3 font-sans select-none">

    <div
      class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="nota in localQueue" :key="nota.id" @click="setActiveAntrian(nota.id)"
          :class="activeNotaId === nota.id
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'"
          class="px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 focus:outline-none">
          <span>{{ primaryKeyLabel }} #{{ nota.id }} <span v-if="nota.customer" class="opacity-90">({{ nota.customer
              }})</span></span>
          <span @click.stop="cancelTransactionFromServer(nota.id)"
            :class="activeNotaId === nota.id ? 'hover:bg-emerald-700 text-emerald-200' : 'hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-400'"
            class="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition ml-0.5">✕</span>
        </button>

        <button @click="tambahAntrianServer"
          class="px-3 py-1.5 font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all flex items-center gap-1 border border-dashed border-slate-300 dark:border-slate-600 focus:outline-none">
          <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
          <span>Buat {{ headerLabel }}</span>
          <kbd
            class="opacity-60 text-[10px] bg-slate-100 dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700 font-mono">[F2]</kbd>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Mode: {{
          schemaLabel }}</span>
      </div>
    </div>

    <div class="flex-1 grid grid-cols-12 gap-3 min-h-0 w-full items-stretch">
      <div
        class="col-span-12 lg:col-span-9 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden p-4 relative min-h-0 gap-3">

        <div v-if="!activeNotaId"
          class="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
          <p class="text-slate-400 text-sm font-semibold flex items-center gap-2">
            <Icon icon="mdi:form-select" class="w-5 h-5 text-slate-400" />
            Silahkan buat atau pilih transaksi {{ headerLabel }} [F2] terlebih dahulu
          </p>
        </div>

        <div class="flex justify-between items-center flex-shrink-0">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ detailLabel }}</span>
          <button @click="openSearchModalDirect('detail')"
            class="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-lg transition-colors">
            <Icon icon="mdi:playlist-plus" class="w-4 h-4" /> Tambah Item (Scan/Cari)
          </button>
        </div>

        <div
          class="flex-1 min-h-0 relative rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          <RevoGrid ref="gridRef" class="w-full h-full max-h-full focus:outline-none" :columns="detailColumns"
            :source="localDetails" :theme="isDark ? 'darkCompact' : 'compact'" resize="true" @afterfocus="afterFocus"
            @afteredit="handleServerGridEdit" @keydown="handleKeyDown" />
        </div>

        <div
          class="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div :class="lastActiveGrid === 'header' ? 'bg-amber-500' : 'bg-emerald-500'"
            class="text-white p-2 rounded-lg flex-shrink-0">
            <Icon :icon="lastActiveGrid === 'header' ? 'mdi:account-box-outline' : 'mdi:barcode-scan'"
              class="w-4 h-4" />
          </div>
          <input type="text"
            :placeholder="lastActiveGrid === 'header' ? 'Mode Header: Cari Data Relator...' : 'Mode Detail: Masukkan Barcode / ID Produk...'"
            class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-3 py-2 rounded-lg focus:outline-none cursor-pointer font-medium shadow-sm"
            @click="openSearchModal" readonly />
        </div>
      </div>

      <div class="col-span-12 lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-none">
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex flex-col gap-3 flex-shrink-0">
          <div
            class="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2">
            {{ headerLabel }}
          </div>

          <div v-if="activeNotaId" class="flex flex-col gap-3 text-xs">
            <div v-for="field in filteredHeaderSchema" :key="field.key" class="flex flex-col gap-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ field.label }}</label>

              <div v-if="field.readonly || field.primary"
                class="font-bold text-slate-700 dark:text-slate-300 py-1.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono border border-slate-200/50 dark:border-slate-700/50">
                {{ field.type === 'currency' ? formatCurrency(localHeader[field.key]) : localHeader[field.key] || '-' }}
              </div>

              <select v-else-if="field.type === 'relation'" v-model="localHeader[field.key]"
                @change="updateHeaderToServer(field.key, localHeader[field.key])"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-medium">
                <option value="" disabled>Pilih {{ field.label }}</option>
                <option v-for="opt in masterRelations[field.relation?.entity]" :key="opt.id" :value="opt.id">
                  {{ opt[field.relation?.displayField] || opt.name }}
                </option>
              </select>

              <input v-else-if="field.type === 'date'" type="date" v-model="localHeader[field.key]"
                @change="updateHeaderToServer(field.key, localHeader[field.key])"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100" />

              <input v-else-if="field.type === 'currency' || field.type === 'number'" type="number"
                v-model.number="localHeader[field.key]" @blur="updateHeaderToServer(field.key, localHeader[field.key])"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100 text-right" />

              <input v-else type="text" v-model="localHeader[field.key]"
                @blur="updateHeaderToServer(field.key, localHeader[field.key])"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100" />
            </div>
          </div>
          <div v-else class="text-center py-4 text-slate-400 text-xs italic">Belum ada transaksi aktif.</div>
        </div>

        <div v-for="hl in highlightConfig" :key="hl.key"
          class="bg-slate-900 text-emerald-400 dark:bg-slate-950 p-4 rounded-xl flex flex-col justify-between shadow-md border border-slate-800 min-h-[90px] flex-shrink-0">
          <div class="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{{ hl.label }}</div>
          <div class="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-right font-mono break-all w-full">
            {{ hl.type === 'currency' ? formatCurrency(localHeader[hl.field]) : localHeader[hl.field] || 0 }}
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-400">
        <span class="text-slate-500 font-bold dark:text-slate-300">CORE ERP AGNOSTIC ENGINE</span>
        <div class="h-3 w-px bg-slate-200 dark:bg-slate-700 hidden sm:inline-block"></div>
        <div><kbd
            class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">[DEL]</kbd>
          Hapus Baris</div>
        <div><kbd
            class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">[F4]</kbd>
          Bayar & Simpan</div>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button v-for="action in actionButtons" :key="action.key" @click="triggerAction(action.key)"
          :class="action.type === 'payment' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600 text-slate-100'"
          class="px-5 py-2.5 text-xs font-bold text-white rounded-xl transition whitespace-nowrap shadow-md flex items-center gap-1.5">
          <Icon :icon="action.type === 'payment' ? 'mdi:credit-card-outline' : 'mdi:printer'" class="w-4 h-4" />
          <span>{{ action.label }}</span>
          <span class="opacity-70 text-[10px] font-mono font-normal">({{ action.type === 'payment' ? 'F4' : 'Ctrl'
          }})</span>
        </button>
      </div>
    </div>

    <div v-if="showSearchModal" @click.self="closeSearchModal"
      class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
        <label class="block text-xs font-bold mb-2 uppercase tracking-wider"
          :class="lastActiveGrid === 'header' ? 'text-amber-500' : 'text-emerald-500'">
          {{ lastActiveGrid === 'header' ? 'Masukkan ID Entitas Master' : 'Masukkan ID / Scan Barcode Produk' }}
        </label>
        <input ref="searchInputRef" v-model="searchQuery" type="text"
          placeholder="Ketik angka / scan barcode lalu enter..."
          class="w-full text-lg font-mono font-bold px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 text-slate-800 dark:text-slate-100 shadow-inner"
          :class="lastActiveGrid === 'header' ? 'focus:ring-amber-500' : 'focus:ring-emerald-500'"
          @keydown.enter="handleSearchSubmit" @keydown.esc="closeSearchModal" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import axios from 'axios'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import { useNumberFormat } from '@/composables/number-format'
import RevoGrid from '@revolist/vue3-datagrid'
import { evaluate } from 'mathjs'
axios.defaults.baseURL = 'http://localhost:3000'
axios.defaults.withCredentials = true

const props = defineProps({
  menu: { type: Object, required: true }
})

const { formatNumber, formatCurrency } = useNumberFormat()

// Metadata Schema Backend
const schemaLabel = ref('')
const headerLabel = ref('TRANSAKSI')
const detailLabel = ref('ITEM')
const primaryKeyLabel = ref('ID')
const headerSchemaRaw = ref([])
const detailSchemaRaw = ref([])
const detailColumns = ref([])
const actionButtons = ref([])
const highlightConfig = ref([])

// Real-time Queue & Current Record Active Data
const localQueue = ref([])
const activeNotaId = ref(null)
const localHeader = ref({})
const localDetails = ref([])

// Dropdown Relation Cache Map (Hanya untuk relasi non-item seperti customer)
const masterRelations = ref({ customer: [] })

// UI Controllers State
const gridRef = ref(null)
const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)
const lastActiveGrid = ref('detail')
const focusedCoordinate = ref({ x: -1, y: -1 })

// Dynamic Base Routing URL Builder
const baseApiUrl = computed(() => {
  let route = props.menu?.route?.trim() || 'penjualan'
  route = route.replace(/^\/+|\/+$/g, '')
  return `/api/${route}`
})

const headerRelationField = computed(() => headerSchemaRaw.value.find(f => f.type === 'relation') || null)
const filteredHeaderSchema = computed(() => {
  const highlights = highlightConfig.value.map(h => h.field)
  return headerSchemaRaw.value.filter(f => !highlights.includes(f.key))
})

// ==========================================
//           LIFECYCLE HOOKS
// ==========================================
onMounted(async () => {
  await fetchHeaderRelations()
  await fetchInitialLoad()
  window.addEventListener('keydown', handleGlobalShortcuts)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalShortcuts)
})

// ==========================================
//       SERVERSIDE CONFIG & RECORD FETCH
// ==========================================
const fetchHeaderRelations = async () => {
  try {
    // Cukup memuat data relasi non-item (seperti data customer untuk dropdown sidebar)
    const resCustomer = await axios.get('/api/customer').catch(() => ({ data: [] }))
    masterRelations.value.customer = resCustomer.data || []
  } catch (e) {
    console.error('Gagal memuat relasi master data:', e)
  }
}

const fetchInitialLoad = async () => {
  try {
    // Pola 1: GET /api/penjualan -> memicu getLastTransaction()
    const response = await axios.get(baseApiUrl.value)
    const fullSchema = response.data

    if (fullSchema && fullSchema.header) {
      applySchemaToComponent(fullSchema)

      if (fullSchema.queue && Array.isArray(fullSchema.queue.data)) {
        localQueue.value = fullSchema.queue.data
      }
    }
  } catch (error) {
    console.error('Gagal melakukan inisialisasi data transaksi akhir:', error)
  }
}

const applySchemaToComponent = (schema) => {
  if (!schema) return
  schemaLabel.value = schema.label || ''
  actionButtons.value = schema.actions || []
  headerLabel.value = schema.header?.label || 'INFORMASI UTAMA'
  detailLabel.value = schema.details?.label || 'DAFTAR ITEM'
  headerSchemaRaw.value = schema.header?.schema || []
  detailSchemaRaw.value = schema.details?.schema || []

  primaryKeyLabel.value = headerSchemaRaw.value.find(f => f.primary)?.label || 'ID'
  highlightConfig.value = headerSchemaRaw.value
    .filter(f => f.highlight)
    .map(f => ({ key: f.key, label: f.label, field: f.key, type: f.type }))

  localHeader.value = schema.header?.data || {}
  localDetails.value = schema.details?.data || {}
  activeNotaId.value = schema.header?.data?.id || null

  // SINKRONISASI DATA QUEUE DI SINI AGAR TIDAK HILANG SAAT MUTASI DATA
  if (schema.queue && Array.isArray(schema.queue.data)) {
    localQueue.value = schema.queue.data
  }

  buildRevoGridColumnsConfig()
}

// ==========================================
//        SYNCHRONIZED CORE OPERATION
// ==========================================

const tambahAntrianServer = async () => {
  try {
    const response = await axios.post(baseApiUrl.value, {})
    const fullSchema = response.data

    if (fullSchema && fullSchema.header?.data?.id) {
      applySchemaToComponent(fullSchema)
      await fetchInitialLoad()
    }
  } catch (e) {
    alert('Gagal membuat antrian transaksi baru.')
  }
}

const setActiveAntrian = async (id) => {
  try {
    const response = await axios.get(`${baseApiUrl.value}/${id}`)
    if (response.data) {
      applySchemaToComponent(response.data)
    }
  } catch (e) {
    console.error('Gagal memuat detail transaksi antrian:', e)
  }
}

const updateHeaderToServer = async (key, val) => {
  if (!activeNotaId.value) return
  try {
    const patchPayload = { [key]: val }
    const response = await axios.put(`${baseApiUrl.value}/${activeNotaId.value}`, patchPayload)

    if (response.data) {
      applySchemaToComponent(response.data)

      if (key === headerRelationField.value?.key) {
        const currentIdx = localQueue.value.findIndex(q => q.id === activeNotaId.value)
        const custObj = masterRelations.value.customer.find(c => c.id === Number(val))
        if (currentIdx !== -1 && custObj) {
          localQueue.value[currentIdx].customer = custObj[headerRelationField.value.relation?.displayField] || custObj.name
        }
      }
    }
  } catch (e) {
    console.error('Gagal sinkronisasi data header ke server:', e)
  }
}

const handleKeyDown = async (e) => {
  if (e.repeat) return

  if (e.key === 'Delete') {
    handleDeleteKey()
    e.preventDefault()
    return
  }
}

const handleDeleteKey = () => {
  deleteDetailRowFromServer()
}

const handleServerGridEdit = async (event) => {

  const detail = event.detail || event;
  const prop = detail.prop;         // Nama kolom dinamis yang diedit (misal: 'quantity', 'discount', 'note')
  const val = detail.val;           // Nilai barunya
  const rowIndex = detail.rowIndex; // Posisi baris di dalam grid

  // Ambil data baris asli dari array lokal menggunakan rowIndex
  const targetRow = localDetails.value[rowIndex];

  if (!targetRow || !targetRow.id) {
    console.error("ID detail tidak ditemukan untuk baris:", rowIndex);
    return;
  }

  try {
    // BUAT PAYLOAD DINAMIS BERDASARKAN PROPERTI YANG DIEDIT
    // Jika value bisa di-convert ke angka, kita convert (mencegah string angka dikirim ke DB bertipe Int/Float)
    const processedValue = !isNaN(Number(val)) && val !== '' ? Number(val) : val;

    const patchItemPayload = {
      [prop]: processedValue
    };

    // Mengarah ke: PUT /api/penjualan/:header_key/:details_key
    const response = await axios.put(
      `${baseApiUrl.value}/${activeNotaId.value}/${targetRow.id}`,
      patchItemPayload
    );

    if (response.data) {
      applySchemaToComponent(response.data);
    }
  } catch (e) {
    console.error("Gagal mengirim update dinamis ke server:", e);
    alert('Gagal mengubah data item di server.');
  }
};

const handleSearchSubmit = async () => {
  const inputCode = searchQuery.value.trim()
  if (!inputCode) return

  if (lastActiveGrid.value === 'header') {
    if (headerRelationField.value) {
      await updateHeaderToServer(headerRelationField.value.key, Number(inputCode))
    }
    closeSearchModal()
  } else {
    try {
      // LANGSUNG DIKIRIM KE BACKEND (Pola POST: /api/penjualan/:header_key)
      // Logika barcode vs ID, dan penambahan qty otomatis diurus oleh PenjualanService.addDetails()
      const res = await axios.post(`${baseApiUrl.value}/${activeNotaId.value}`, { query: inputCode, })

      if (res.data) {
        applySchemaToComponent(res.data)
      } else {
        alert('Gagal memproses item ke server.')
      }
    } catch (e) {
      const errorMsg = e.response?.data?.error || 'Produk tidak ditemukan atau gagal dimasukkan.'
      console.log(errorMsg)
    }
    closeSearchModal()
  }
}

const deleteDetailRowFromServer = async () => {
  if (focusedCoordinate.value.y === -1 || localDetails.value.length === 0) return
  const targetRow = localDetails.value[focusedCoordinate.value.y]
  if (!targetRow || !targetRow.id) return

  if (confirm('Hapus baris item belanja ini?')) {
    try {
      const response = await axios.delete(`${baseApiUrl.value}/${activeNotaId.value}/${targetRow.id}`)
      if (response.data) {
        applySchemaToComponent(response.data)
        focusedCoordinate.value = { x: -1, y: -1 }
      }
    } catch (e) {
      alert('Gagal menghapus detail item.')
    }
  }
}

const cancelTransactionFromServer = async (id) => {
  if (!confirm('Apakah anda yakin ingin membatalkan & menghapus permanen nota transaksi ini?')) return
  try {
    await axios.delete(`${baseApiUrl.value}/${id}`)

    if (activeNotaId.value === id) {
      activeNotaId.value = null
      localHeader.value = {}
      localDetails.value = []
    }
    await fetchInitialLoad()
  } catch (e) {
    alert('Gagal membatalkan transaksi pada server database.')
  }
}

const triggerAction = async (actionKey) => {
  if (!activeNotaId.value) return

  if (actionKey === 'pay') {
    if (!localHeader.value.customerId) return alert('Silahkan pilih Customer terlebih dahulu!')
    if (localDetails.value.length === 0) return alert('Daftar barang belanja kosong!')

    try {
      await axios.put(`${baseApiUrl.value}/${activeNotaId.value}`, { isFinalSubmit: true })
      alert('Transaksi Berhasil Disimpan & Dicetak!')

      activeNotaId.value = null
      await fetchInitialLoad()
    } catch (error) {
      alert('Gagal memproses simpan transaksi.')
    }
  }
}

// ==========================================
//          RENDERING GRID MODIFIERS
// ==========================================
const buildRevoGridColumnsConfig = () => {
  detailColumns.value = detailSchemaRaw.value.map(field => {
    const config = { prop: field.key, name: field.label, readonly: field.readonly || false }

    // DETEKSI TYPE COMPUTED BERBASIS FORMULA DARI SCHEMA UI
    if (field.type === 'computed' && field.formula) {
      config.cellTemplate = (createElement, linkProps) => {
        let formulaString = field.formula
        const rowData = linkProps.model || {}

        // 1. Parsing Formula: Ganti semua token {key} dengan nilai angka dari baris grid
        // Regular Expression ini mencari string di dalam kurung kurawal, misal {quantity}
        formulaString = formulaString.replace(/\{([^}]+)\}/g, (match, key) => {
          return Number(rowData[key]) || 0
        })

        // 2. Evaluasi rumusnya secara aman menggunakan mathjs
        let computedValue = 0
        try {
          computedValue = evaluate(formulaString)
        } catch (err) {
          console.error(`Gagal mengevaluasi formula untuk ${field.key}:`, err)
        }

        // 3. Render hasilnya dengan format currency (atau custom format berdasarkan key)
        return createElement(
          'span',
          { class: 'font-mono text-right block w-full text-blue-600 dark:text-blue-400 font-semibold bg-slate-50/50 dark:bg-slate-900/30 px-1' },
          formatCurrency(computedValue)
        )
      }
    }
    // Format standar lainnya
    else if (field.type === 'currency') {
      config.cellTemplate = (createElement, linkProps) => createElement('span', { class: 'font-mono text-right block w-full text-emerald-600 font-semibold' }, formatCurrency(linkProps.model[field.key] || 0))
    }
    else if (field.type === 'number') {
      config.cellTemplate = (createElement, linkProps) => createElement('span', { class: 'font-mono text-center block w-full' }, formatNumber(linkProps.model[field.key] || 0))
    }
    else if (field.type === 'relation' && field.relation?.entity === 'product') {
      config.cellTemplate = (createElement, linkProps) => {
        const productName = linkProps.model.productName || linkProps.model.product?.name || `Product ID: ${linkProps.model[field.key]}`
        return createElement('span', { class: 'font-medium block w-full pl-1' }, productName)
      }
    }

    return config
  })
}

const afterFocus = (e) => {
  lastActiveGrid.value = 'detail'
  focusedCoordinate.value = { x: e.detail.colIndex, y: e.detail.rowIndex }
}

const openSearchModalDirect = (mode) => {
  lastActiveGrid.value = mode
  openSearchModal()
}

const openSearchModal = () => {
  if (!activeNotaId.value) return
  showSearchModal.value = true
  searchQuery.value = ''
  nextTick(() => {
    if (searchInputRef.value) searchInputRef.value.focus()
  })
}

const closeSearchModal = () => {
  showSearchModal.value = false
}

const handleGlobalShortcuts = (e) => {
  if (showSearchModal.value) return
  if (e.key === 'F2') {
    e.preventDefault()
    tambahAntrianServer()
  }
  if (e.key === 'F4') {
    e.preventDefault()
    triggerAction('pay')
  }
}
</script>