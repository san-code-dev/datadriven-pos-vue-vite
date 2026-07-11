<template>
  <div
    class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-slate-100 dark:bg-slate-900 w-full p-3 gap-3 font-sans select-none">

    <div
      class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="(nota, index) in localQueue" :key="nota.id" @click="setActiveAntrian(nota.id, index)"
          :class="activeNotaId === nota.id
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'"
          class="px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 focus:outline-none">
          <span>{{ primaryKeyLabel }} #{{ nota.id }} <span v-if="nota.customer" class="opacity-90">({{ nota.customer
          }})</span></span>
          <span @click.stop="deleteAntrianLocally(nota.id)"
            :class="activeNotaId === nota.id ? 'hover:bg-emerald-700 text-emerald-200' : 'hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-400'"
            class="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition ml-0.5">✕</span>
        </button>

        <button @click="tambahAntrianLokal"
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
          <button @click="addBlankDetailRow"
            class="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-lg transition-colors">
            <Icon icon="mdi:playlist-plus" class="w-4 h-4" /> Tambah Baris
          </button>
        </div>

        <div
          class="flex-1 min-h-0 relative rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          <RevoGrid ref="gridRef" class="w-full h-full max-h-full focus:outline-none" :columns="detailColumns"
            :source="localDetails" :theme="isDark ? 'darkCompact' : 'compact'" resize="true" @afterfocus="afterFocus"
            @beforecellsave="handleLocalGridEdit" />
        </div>

        <div
          class="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div :class="lastActiveGrid === 'header' ? 'bg-amber-500' : 'bg-emerald-500'"
            class="text-white p-2 rounded-lg flex-shrink-0">
            <Icon :icon="lastActiveGrid === 'header' ? 'mdi:account-box-outline' : 'mdi:barcode-scan'"
              class="w-4 h-4" />
          </div>
          <input type="text"
            :placeholder="lastActiveGrid === 'header' ? 'Mode Header: Masukkan/Cari Data Relator...' : 'Mode Detail: Masukkan Barcode / ID Produk...'"
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
                @change="syncQueueCustomerName(field)"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-medium">
                <option value="" disabled>Pilih {{ field.label }}</option>
                <option v-for="opt in masterRelations[field.relation?.entity]" :key="opt.id" :value="opt.id">
                  {{ opt[field.relation?.displayField] || opt.name }}
                </option>
              </select>

              <input v-else-if="field.type === 'date'" type="date" v-model="localHeader[field.key]"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100" />

              <input v-else-if="field.type === 'currency' || field.type === 'number'" type="number"
                v-model.number="localHeader[field.key]" @input="recalculateTotals"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100 text-right" />

              <input v-else type="text" v-model="localHeader[field.key]"
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

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import axios from 'axios'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import { useNumberFormat } from '@/composables/number-format'
import RevoGrid from '@revolist/vue3-datagrid'

axios.defaults.baseURL = 'http://localhost:3000'
axios.defaults.withCredentials = true

const props = defineProps({
  menu: { type: Object, required: true }
})

const { formatNumber, formatCurrency } = useNumberFormat()

// State Management Form Lokal
const schemaLabel = ref('')
const headerLabel = ref('TRANSAKSI')
const detailLabel = ref('ITEM')
const primaryKeyLabel = ref('ID')

const headerSchemaRaw = ref([])
const detailSchemaRaw = ref([])
const actionButtons = ref([])
const highlightConfig = ref([])

const localQueue = ref([])
const activeNotaId = ref(null)
const localHeader = ref({})
const localDetails = ref([])

// Master relational storage (e.g. products, customer arrays parsed globally)
const masterRelations = ref({
  customer: [],
  product: []
})

const gridRef = ref(null)
const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)
const lastActiveGrid = ref('detail')
const focusedCoordinate = ref({ x: -1, y: -1 })

// Engine Dynamic Base API endpoint
const baseApiUrl = computed(() => {
  let route = props.menu?.route?.trim() || 'penjualan'
  route = route.replace(/^\/+|\/+$/g, '')
  return `/api/${route}`
})

const headerRelationField = computed(() => headerSchemaRaw.value.find(f => f.type === 'relation') || null)
const detailRelationField = computed(() => detailSchemaRaw.value.find(f => f.type === 'relation') || null)
const filteredHeaderSchema = computed(() => {
  const highlights = highlightConfig.value.map(h => h.field)
  return headerSchemaRaw.value.filter(f => !highlights.includes(f.key))
})

// ==========================================
//           CORE TRANSAKSI LOCAL ALUR
// ==========================================

onMounted(async () => {
  await loadDynamicModuleConfiguration()
  await fetchMasterRelationsMockAndApi()
  tambahAntrianLokal()
  window.addEventListener('keydown', handleGlobalShortcuts)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalShortcuts)
})

// 1. Ambil Skema Metadata Backend Secara Dinamis
const loadDynamicModuleConfiguration = async () => {
  try {
    const response = await axios.get(baseApiUrl.value)
    const res = response.data
    if (!res) return

    schemaLabel.value = res.label || ''
    actionButtons.value = res.actions || []
    headerLabel.value = res.header?.label || 'INFORMASI UTAMA'
    detailLabel.value = res.details?.label || 'DAFTAR ITEM'
    headerSchemaRaw.value = res.header?.schema || []
    detailSchemaRaw.value = res.details?.schema || []

    primaryKeyLabel.value = headerSchemaRaw.value.find(f => f.primary)?.label || 'ID'

    highlightConfig.value = headerSchemaRaw.value
      .filter(f => f.highlight)
      .map(f => ({ key: f.key, label: f.label, field: f.key, type: f.type }))

    buildRevoGridColumnsConfig()
  } catch (error) {
    console.error('Gagal memuat konfigurasi skema backend:', error)
  }
}

// Fetch data master relasi untuk select option lokal & mapping pencarian otomatis
const fetchMasterRelationsMockAndApi = async () => {
  try {
    // Diganti dengan endpoint riil `/api/customer` dan `/api/product` dari relation schema backend Anda
    const resCustomer = await axios.get('/api/customer').catch(() => ({ data: [{ id: 1, nmCustomer: 'Umum / Cash Customer' }] }))
    const resProduct = await axios.get('/api/product').catch(() => ({
      data: [
        { id: 101, name: 'Produk A', price: 15000 },
        { id: 102, name: 'Produk B', price: 25000 }
      ]
    }))

    masterRelations.value.customer = resCustomer.data || []
    masterRelations.value.product = resProduct.data || []
    buildRevoGridColumnsConfig()
  } catch (e) {
    console.error('Error fetching master relation lists', e)
  }
}

// 2. Buat Antrian Transaksi di Sisi Lokal (Klien)
const tambahAntrianLokal = () => {
  const newId = 'Lokal-' + Math.floor(1000 + Math.random() * 9000)

  // Konstruksi Object Header Lokal berdasarkan Skema backend
  const initialHeader = {}
  headerSchemaRaw.value.forEach(field => {
    if (field.type === 'date') initialHeader[field.key] = new Date().toISOString().split('T')[0]
    else if (field.type === 'currency' || field.type === 'number') initialHeader[field.key] = 0
    else initialHeader[field.key] = ''
  })
  initialHeader.id = newId
  initialHeader.noInvoice = `DRAFT-${newId}`

  const newQueueItem = { id: newId, customer: 'Drafting...', header: initialHeader, details: [] }
  localQueue.value.push(newQueueItem)

  setActiveAntrian(newId, localQueue.value.length - 1)
}

const setActiveAntrian = (id, index) => {
  // Simpan state antrian lama terlebih dahulu sebelum switch
  if (activeNotaId.value) {
    const activeIdx = localQueue.value.findIndex(q => q.id === activeNotaId.value)
    if (activeIdx !== -1) {
      localQueue.value[activeIdx].header = { ...localHeader.value }
      localQueue.value[activeIdx].details = [...localDetails.value]
    }
  }

  activeNotaId.value = id
  const targetQueue = localQueue.value[index]
  if (targetQueue) {
    localHeader.value = targetQueue.header
    localDetails.value = targetQueue.details
    if (localDetails.value.length === 0) {
      addBlankDetailRow()
    }
  }
}

const addBlankDetailRow = () => {
  const blankRow = { id: 'item-' + Date.now() + Math.random() }
  detailSchemaRaw.value.forEach(field => {
    if (field.type === 'number' || field.type === 'currency') blankRow[field.key] = 0
    else blankRow[field.key] = ''
  })
  localDetails.value = [...localDetails.value, blankRow]
}

// 3. Detektor Interseptor Edit Baris RevoGrid Lokal
const handleLocalGridEdit = (event) => {
  const { model, prop, val } = event.detail
  const rowIndex = localDetails.value.findIndex(item => item.id === model.id)
  if (rowIndex === -1) return

  // Logika kalkulasi dinamis lokal jika kolom relasi produk atau kuantitas berubah
  if (prop === 'productId') {
    const prodId = Number(val)
    const productMaster = masterRelations.value.product.find(p => p.id === prodId)
    if (productMaster) {
      localDetails.value[rowIndex].productId = productMaster.id
      localDetails.value[rowIndex].price = productMaster.price || 0
      localDetails.value[rowIndex].quantity = localDetails.value[rowIndex].quantity || 1
      localDetails.value[rowIndex].subTotal = localDetails.value[rowIndex].price * localDetails.value[rowIndex].quantity
    }
  } else if (prop === 'quantity') {
    const qty = Number(val) || 0
    localDetails.value[rowIndex].quantity = qty
    localDetails.value[rowIndex].subTotal = (localDetails.value[rowIndex].price || 0) * qty
  } else {
    localDetails.value[rowIndex][prop] = val
  }

  recalculateTotals()
}

// 4. Kalkulator Total Belanja Bersih Sisi Klien
const recalculateTotals = () => {
  const grandSubTotal = localDetails.value.reduce((acc, curr) => acc + (Number(curr.subTotal) || 0), 0)
  const discount = Number(localHeader.value.discount) || 0
  localHeader.value.total = Math.max(0, grandSubTotal - discount)
}

const syncQueueCustomerName = (field) => {
  const selectedCustId = localHeader.value[field.key]
  const customerObj = masterRelations.value.customer.find(c => c.id === Number(selectedCustId))
  const currentIdx = localQueue.value.findIndex(q => q.id === activeNotaId.value)
  if (currentIdx !== -1 && customerObj) {
    localQueue.value[currentIdx].customer = customerObj[field.relation?.displayField] || customerObj.name
  }
}

// 5. Eksekusi Pembayaran Akhir & Post Payload ke Backend Service
const triggerAction = async (actionKey) => {
  if (!activeNotaId.value) return

  if (actionKey === 'pay') {
    if (!localHeader.value.customerId) return alert('Pilih Customer terlebih dahulu!')

    // Validasi item lokal
    const itemsPayload = localDetails.value
      .filter(d => d.productId && Number(d.quantity) > 0)
      .map(d => ({ productId: Number(d.productId), quantity: Number(d.quantity) }))

    if (itemsPayload.length === 0) return alert('Keranjang belanja kosong atau kuantitas tidak valid!')

    // Pembuatan payload bersih sesuai method create() di backend service Anda
    const finalPayload = {
      customerId: Number(localHeader.value.customerId),
      discount: Number(localHeader.value.discount) || 0,
      items: itemsPayload
    }

    try {
      // POST data ke backend untuk disimpan secara sah & pemicu auto-jurnal akuntansi
      await axios.post(baseApiUrl.value, finalPayload)
      alert('Transaksi Berhasil Disimpan! Jurnal Akuntansi otomatis terbentuk.')

      // Hapus dari antrian lokal setelah sukses bayar
      deleteAntrianLocally(activeNotaId.value)
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal memproses pengiriman data transaksi ke server.')
    }
  }
}

// 6. Barcode Scanner / ID Finder Modal Submission Handlers
const handleSearchSubmit = () => {
  const inputCode = searchQuery.value.trim()
  if (!inputCode) return

  if (lastActiveGrid.value === 'header') {
    if (headerRelationField.value) {
      localHeader.value[headerRelationField.value.key] = Number(inputCode)
      syncQueueCustomerName(headerRelationField.value)
    }
  } else {
    // Modul scanning barcode item belanja otomatis ke baris tabel lokal
    const productMaster = masterRelations.value.product.find(p => String(p.id) === inputCode)
    if (productMaster) {
      const existingRowIdx = localDetails.value.findIndex(d => d.productId === productMaster.id)
      if (existingRowIdx !== -1) {
        localDetails.value[existingRowIdx].quantity += 1
        localDetails.value[existingRowIdx].subTotal = localDetails.value[existingRowIdx].quantity * localDetails.value[existingRowIdx].price
      } else {
        const newRow = {
          id: 'item-' + Date.now(),
          productId: productMaster.id,
          quantity: 1,
          price: productMaster.price,
          subTotal: productMaster.price
        }
        localDetails.value.push(newRow)
      }
      recalculateTotals()
    } else {
      alert('Produk dengan ID / Barcode tersebut tidak ditemukan pada database lokal.')
    }
  }
  closeSearchModal()
}

const deleteAntrianLocally = (id) => {
  const index = localQueue.value.findIndex(q => q.id === id)
  if (index === -1) return
  localQueue.value.splice(index, 1)
  if (localQueue.value.length > 0) {
    setActiveAntrian(localQueue.value[0].id, 0)
  } else {
    activeNotaId.value = null
    localHeader.value = {}
    localDetails.value = []
  }
}

// ==========================================
//          RENDERING & CONFIG REVO GRID
// ==========================================

const buildRevoGridColumnsConfig = () => {
  detailColumns.value = detailSchemaRaw.value.map(field => {
    const config = { prop: field.key, name: field.label, readonly: field.readonly || false }

    if (field.type === 'currency') {
      config.cellTemplate = (createElement, linkProps) => createElement('span', { class: 'font-mono text-right block w-full text-emerald-600 font-semibold' }, formatCurrency(linkProps.model[field.key] || 0))
    } else if (field.type === 'number') {
      config.cellTemplate = (createElement, linkProps) => createElement('span', { class: 'font-mono text-center block w-full' }, formatNumber(linkProps.model[field.key] || 0))
    } else if (field.type === 'relation' && field.relation?.entity === 'product') {
      config.editor = 'select'
      config.source = masterRelations.value.product.map(p => String(p.id))
    }
    return config
  })
}

const afterFocus = (e) => {
  lastActiveGrid.value = 'detail'
  focusedCoordinate.value = { x: e.detail.colIndex, y: e.detail.rowIndex }
}

const handleGlobalShortcuts = (e) => {
  if (showSearchModal.value) return
  if (e.key === 'F2') { e.preventDefault(); tambahAntrianLokal() }
  if (e.key === 'F4') { e.preventDefault(); triggerAction('pay') }
  if (e.key === 'F7') { e.preventDefault(); lastActiveGrid.value = 'header'; openSearchModal() }
  if (e.key === 'F8') { e.preventDefault(); lastActiveGrid.value = 'detail'; openSearchModal() }
  if (e.key === 'Delete' && lastActiveGrid.value === 'detail' && focusedCoordinate.value.y >= 0) {
    localDetails.value.splice(focusedCoordinate.value.y, 1)
    if (localDetails.value.length === 0) addBlankDetailRow()
    recalculateTotals()
  }
}

const openSearchModal = async () => {
  showSearchModal.value = true
  await nextTick()
  searchInputRef.value?.focus()
}

const closeSearchModal = () => {
  showSearchModal.value = false
  searchQuery.value = ''
}
</script>

<style scoped>
:deep(revo-grid) {
  z-index: 10 !important;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>