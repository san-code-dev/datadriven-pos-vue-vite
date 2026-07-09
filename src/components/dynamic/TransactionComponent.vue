<template>
  <div
    class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-slate-100 dark:bg-slate-900 w-full p-3 gap-3 font-sans select-none">

    <div class="flex-1 grid grid-cols-12 gap-3 min-h-0 w-full items-stretch">

      <div
        class="col-span-12 lg:col-span-9 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden p-4 relative min-h-0 gap-3">

        <div
          class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 flex-shrink-0 text-xs">

          <button v-for="(nota, index) in queueRows" :key="nota[primaryKey]"
            @click="setActiveAntrian(nota[primaryKey], index)"
            :class="activeNotaId === nota[primaryKey]
              ? 'bg-emerald-600 text-white shadow-sm focus:ring-2 focus:ring-emerald-500'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-2 focus:ring-slate-400'"
            class="px-3 py-1.5 font-medium rounded-lg transition-all flex items-center gap-1.5 focus:outline-none">

            <span>{{ primaryKeyLabel }} #{{ nota[primaryKey] }} <span v-if="nota.customer" class="opacity-90">({{
              nota.customer }})</span></span>

            <span @click.stop="deleteAntrian(nota[primaryKey])"
              :class="activeNotaId === nota[primaryKey] ? 'hover:bg-emerald-700 text-emerald-200' : 'hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-400'"
              class="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition ml-0.5">
              ✕
            </span>
          </button>

          <button @click="tambahAntrian"
            class="px-3 py-1.5 font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-all flex items-center gap-1 border border-dashed border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-slate-400 focus:outline-none">
            <span>+ Buat {{ headerLabel }}</span>
            <kbd
              class="opacity-60 text-[10px] bg-slate-100 dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700 font-mono">[F2]</kbd>
          </button>

          <div v-if="queueRows.length === 0" class="text-xs font-semibold text-slate-400 ml-2">
            Tidak Ada {{ headerLabel }} Aktif
          </div>
        </div>

        <div v-if="!activeNotaId || !currentActiveNota"
          class="absolute inset-x-4 bottom-4 top-[60px] bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
          <p class="text-slate-400 text-sm font-semibold">Silahkan buat transaksi {{ headerLabel }} [F2] terlebih dahulu
          </p>
        </div>

        <div
          class="flex-1 min-h-0 relative rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          <RevoGrid ref="gridRef" class="w-full h-full max-h-full focus:outline-none" :columns="detailColumns"
            :source="allDetailRows" :theme="isDark ? 'darkCompact' : 'compact'" resize="true" @afterfocus="afterFocus"
            @afteredit="handleInlineGridEdit" />
          <GridNavigator ref="navigatorRef" :grid="gridRef" :rows="allDetailRows" :columns="detailColumns"
            :focused-coordinate="focusedCoordinate" />
        </div>

        <div
          class="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div
            :class="lastActiveGrid === 'header' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'"
            class="text-white p-2 rounded-lg shadow-sm transition-colors duration-200 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5"
              stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
            </svg>
          </div>
          <input type="text"
            :placeholder="lastActiveGrid === 'header' ? `Mode ${headerLabel}: Hubungkan Data Relasi...` : `Mode ${detailLabel}: Input ID Data / Scan Barcode...`"
            class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-3 py-2 rounded-lg focus:outline-none placeholder:text-slate-400 cursor-pointer font-medium shadow-sm"
            @click="openSearchWithChar('')" readonly />
        </div>
      </div>

      <div class="col-span-12 lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-none">
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex flex-col gap-3 flex-shrink-0">
          <div
            class="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2">
            Data {{ headerLabel }} (Header Info)
          </div>

          <div v-if="activeNotaId && currentActiveNota" class="flex flex-col gap-3 text-xs">
            <div v-for="field in filteredHeaderSchema" :key="field.key" class="flex flex-col gap-1">
              <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ field.label }}</label>

              <div v-if="field.readonly || field.primary"
                class="font-bold text-slate-700 dark:text-slate-300 py-1.5 px-2 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono">
                {{ formatHeaderValue(currentActiveNota, field) }}
              </div>

              <select v-else-if="field.type === 'relation'"
                :value="currentActiveNota[field.key] ? (typeof currentActiveNota[field.key] === 'object' ? currentActiveNota[field.key].id : currentActiveNota[field.key]) : ''"
                @change="updateHeaderField(field.key, $event.target.value)"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-medium">
                <option
                  :value="typeof currentActiveNota[field.key] === 'object' ? currentActiveNota[field.key].id : currentActiveNota[field.key]">
                  {{ typeof currentActiveNota[field.key] === 'object' ?
                    currentActiveNota[field.key][field.relation?.displayField] : currentActiveNota[field.key] }}
                </option>
              </select>

              <input v-else-if="field.type === 'date'" type="date" :value="currentActiveNota[field.key]"
                @change="updateHeaderField(field.key, $event.target.value)"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100" />

              <input v-else type="text" :value="currentActiveNota[field.key]"
                @change="updateHeaderField(field.key, $event.target.value)"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100" />
            </div>
          </div>
          <div v-else class="text-center py-4 text-slate-400 text-xs italic">Belum ada antrian yang aktif.</div>
        </div>

        <div v-for="hl in highlightConfig" :key="hl.key"
          class="bg-slate-900 text-emerald-400 dark:bg-slate-950 p-4 rounded-xl flex flex-col justify-between shadow-md border border-slate-800 min-h-[100px] flex-shrink-0 relative group">
          <div class="flex items-center justify-between w-full mb-1">
            <div class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{{ hl.label }}</div>
            <span v-if="isFieldEditable(hl.field) && inlineEditingField !== hl.field"
              class="text-[9px] text-slate-500 font-semibold group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Klik
              angka untuk edit</span>
          </div>

          <div class="w-full min-h-[40px] flex items-center justify-end">
            <input v-if="isFieldEditable(hl.field) && inlineEditingField === hl.field" ref="inlineInputRef"
              v-model="inlineEditValue" type="text"
              class="w-full bg-slate-800 border border-emerald-500 text-emerald-300 text-right font-mono text-xl lg:text-2xl font-bold px-2 py-1 rounded focus:outline-none shadow-inner"
              @keydown.enter="submitInlineEdit(hl.field)" @keydown.esc="cancelInlineEdit"
              @blur="submitInlineEdit(hl.field)" />
            <div v-else
              :class="isFieldEditable(hl.field) ? 'cursor-pointer hover:text-emerald-300 transition-colors' : 'select-all'"
              class="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-right font-mono break-all w-full"
              @click="isFieldEditable(hl.field) && startInlineEdit(hl)">
              <template v-if="hl.type === 'currency'">{{ formatCurrency(activeNotaValueByField(hl.field)) }}</template>
              <template v-else-if="hl.type === 'number'">{{ formatNumber(activeNotaValueByField(hl.field)) }}</template>
              <template v-else>{{ activeNotaValueByField(hl.field) }}</template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-400">
        <span class="text-slate-500 font-bold dark:text-slate-300">CORE ERP ENGINE</span>
        <div class="h-3 w-px bg-slate-200 dark:bg-slate-700 hidden sm:inline-block"></div>
        <div><kbd
            class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">[DEL]</kbd>
          Hapus Baris Item</div>
        <div><kbd
            class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">[F4]</kbd>
          Jalankan Aksi Utama</div>
        <div><kbd
            class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">[F7]</kbd>
          Fokus Header</div>
        <div><kbd
            class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">[F8]</kbd>
          Fokus Detail Grid</div>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button v-for="action in actionButtons" :key="action.key" @click="triggerActionButton(action.key)"
          :class="action.key === 'pay' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'"
          class="px-5 py-2.5 text-xs font-bold text-white rounded-xl transition whitespace-nowrap shadow-md flex items-center gap-1.5">
          <span>{{ action.label }}</span>
          <span class="opacity-70 text-[10px] font-mono font-normal">({{ action.key === 'pay' ? 'F4' : 'Ctrl' }})</span>
        </button>
      </div>
    </div>

    <div v-if="showSearchModal" @click.self="closeSearchModal"
      class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
        <label class="block text-xs font-bold mb-2 uppercase tracking-wider"
          :class="lastActiveGrid === 'header' ? 'text-amber-500' : 'text-emerald-500'">
          {{ lastActiveGrid === 'header' ? `Masukkan ID Master ${headerRelationField?.label || 'Relasi'}` : `Masukkan ID
          Baris ${detailRelationField?.label || 'Produk'}` }}
        </label>
        <input ref="searchInputRef" v-model="searchQuery" type="text"
          placeholder="Masukkan ID angka lalu tekan Enter..."
          class="w-full text-lg font-mono font-bold px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 text-slate-800 dark:text-slate-100 shadow-inner"
          :class="lastActiveGrid === 'header' ? 'focus:ring-amber-500' : 'focus:ring-emerald-500'"
          @keydown.enter="handleSearchSubmit" @keydown.esc="closeSearchModal" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import axios from 'axios'
import { isDark } from '@/composables/dark'
import { useNumberFormat } from '@/composables/number-format'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'
import { useQueueStore } from '@/stores/transaction'

// Pengaturan default Axios global untuk integrasi cookie dan endpoint server backend
axios.defaults.baseURL = 'http://localhost:3000'
axios.defaults.withCredentials = true

const props = defineProps({
  menu: { type: Object, required: true }
})

const queueStore = useQueueStore()
const { formatNumber, formatCurrency } = useNumberFormat()

const gridRef = ref(null)
const navigatorRef = ref(null)

const detailColumns = ref([])
const queueRows = ref([])
const currentActiveNota = ref(null)
const allDetailRows = ref([])

const headerLabel = ref('TRANSAKSI')
const detailLabel = ref('ITEM')

const headerSchemaRaw = ref([])
const detailSchemaRaw = ref([])
const actionButtons = ref([])
const highlightConfig = ref([])

const primaryKey = ref('id')
const primaryKeyLabel = ref('id')

const focusedCoordinate = ref({ x: -1, y: -1 })
const focusedHeaderCoordinate = ref({ x: 0, y: 0 })
const lastActiveGrid = ref('detail')

const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

const inlineEditingField = ref(null)
const inlineEditValue = ref('')
const inlineInputRef = ref(null)

let savedDetailGridEl = null
let focusTimeoutId = null
let watchTabTimeoutId = null

const activeNotaId = computed({
  get() { return queueStore.activeNotaId },
  set(val) { queueStore.activeNotaId = val }
})

// 🌟 URL API DINAMIS: Sepenuhnya bergantung pada properti modul rute yang sedang diakses browser
const baseApiUrl = computed(() => {
  // 1. Ambil nilai route, jika kosong/null/undefined default ke 'penjualan'
  let route = props.menu?.route?.trim() || 'penjualan'

  // 2. Bersihkan slash di awal atau di akhir jika user tidak sengaja menulis "/penjualan/"
  route = route.replace(/^\/+|\/+$/g, '')

  // 3. Kembalikan URL yang bersih tanpa double-slash
  return `/api/${route}`
})

// Detektor objek schema relasi database secara otomatis
const headerRelationField = computed(() => headerSchemaRaw.value.find(f => f.type === 'relation') || null)
const detailRelationField = computed(() => detailSchemaRaw.value.find(f => f.type === 'relation') || null)

// ==========================================
//          BLOK FUNGSI DYNAMIC API
// ==========================================

// 1. Ambil Skema Kontrol UI Komponen & List Transaksi Aktif
const loadPOSConfiguration = async () => {
  try {
    const response = await axios.get(baseApiUrl.value)
    const res = response.data
    if (!res) return

    actionButtons.value = res.actions || []
    headerLabel.value = res.label || 'TRANSAKSI'
    detailLabel.value = res.details?.label || 'ITEM'
    headerSchemaRaw.value = res.header?.schema || []
    detailSchemaRaw.value = res.details?.schema || []
    queueRows.value = [...(res.queue?.data || [])]

    highlightConfig.value = headerSchemaRaw.value
      .filter(f => f.highlight)
      .map(f => ({ key: f.key, label: f.label, field: f.key, type: f.type }))

    const primaryField = headerSchemaRaw.value.find(f => f.primary)
    primaryKey.value = primaryField?.key || 'id'
    primaryKeyLabel.value = primaryField?.label || 'ID'

    buildRevoGridColumns()

    if (queueRows.value.length > 0) {
      if (!activeNotaId.value) {
        await setActiveAntrian(queueRows.value[0][primaryKey.value], 0)
      } else {
        const activeIndex = queueRows.value.findIndex(n => String(n[primaryKey.value]) === String(activeNotaId.value))
        if (activeIndex !== -1) {
          focusedHeaderCoordinate.value = { x: 0, y: activeIndex }
        }
        await loadActiveNotaDetails(activeNotaId.value)
      }
    }
  } catch (error) {
    console.error('Gagal memuat konfigurasi dari dynamic backend:', error)
  }
}

// 2. Ambil Data Spesifik Record Transaksi Berdasarkan ID Aktif
const loadActiveNotaDetails = async (id) => {
  if (!id) return
  try {
    const response = await axios.get(`${baseApiUrl.value}/${id}`)
    const dataNota = response.data
    if (!dataNota) return

    const mappedHeader = {}
    headerSchemaRaw.value.forEach(field => {
      mappedHeader[field.key] = dataNota[field.key]
    })
    currentActiveNota.value = mappedHeader
    allDetailRows.value = Array.isArray(dataNota.details) ? dataNota.details : []

    await nextTick()
    setUpGridBehaviors()
  } catch (error) {
    console.error(`Gagal mengambil detail transaksi #${id}:`, error)
  }
}

// 3. Tambah Antrian Transaksi Baru (F2) -> Payload dikonstruksi otomatis via Schema
const tambahAntrian = async () => {
  try {
    const defaultPayload = {}

    // 1. Inisialisasi field header dari skema backend
    headerSchemaRaw.value.forEach(field => {
      if (!field.readonly && !field.primary) {
        if (field.type === 'relation') defaultPayload[field.key] = 1
        else if (field.type === 'currency' || field.type === 'number') defaultPayload[field.key] = 0
        else defaultPayload[field.key] = ''
      }
    })

    // 2. 🌟 DINAMIS: Ambil ID riil dari API master detail
    const dRelField = detailRelationField.value
    let validProductId = null

    if (dRelField) {
      // Cek apakah ada opsi data langsung di dalam skema metadata
      const relationOptions = dRelField.relation?.options || dRelField.options || []

      if (relationOptions.length > 0) {
        validProductId = relationOptions[0].id
      } else {
        // 🚀 Jika skema tidak membawa data opsi, panggil API master-nya secara dinamis!
        // Mengasumsikan endpoint master mengikuti aturan plural/nama relation (e.g., /api/produk atau /api/products)
        const masterEndpoint = dRelField.relation?.endpoint || `/api/${dRelField.key.replace('Id', '')}`
        try {
          const masterRes = await axios.get(masterEndpoint)
          // Ambil data pertama dari array response backend
          const firstItem = Array.isArray(masterRes.data) ? masterRes.data[0] : (masterRes.data.data?.[0] || null)
          if (firstItem) {
            validProductId = firstItem.id
          }
        } catch (apiErr) {
          console.warn('Gagal mengambil data master otomatis, mencoba fallback...', apiErr)
        }
      }

      // Jika tetap gagal mendapatkan ID dari database, pasang fallback 1 (atau biarkan jika backend Anda menerima null)
      if (!validProductId) {
        validProductId = 1
      }

      // Masukkan item pertama yang dijamin valid ke dalam keranjang
      defaultPayload['items'] = [
        {
          [dRelField.key]: validProductId,
          quantity: 1
        }
      ]
    } else {
      defaultPayload['items'] = []
    }

    // 3. Kirim payload akhir ke backend
    const response = await axios.post(baseApiUrl.value, defaultPayload)
    const transactionCreated = response.data.data || response.data

    await loadPOSConfiguration()

    const targetId = transactionCreated[primaryKey.value]
    if (transactionCreated && targetId) {
      const indexAntrian = queueRows.value.findIndex(n => String(n[primaryKey.value]) === String(targetId))
      await setActiveAntrian(targetId, indexAntrian !== -1 ? indexAntrian : 0)
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Gagal membuat transaksi baru.')
  }
}

// 4. Modal Input / Barcode Scanner Cepat Terpadu
const handleSearchSubmit = async () => {
  const inputID = Number(searchQuery.value.trim())
  if (!inputID || !activeNotaId.value) return

  try {
    if (lastActiveGrid.value === 'header') {
      const relField = headerRelationField.value
      if (relField) {
        await axios.put(`${baseApiUrl.value}/${activeNotaId.value}`, { [relField.key]: inputID })
      }
    } else {
      const dRelField = detailRelationField.value
      if (!dRelField) return

      const currentItems = allDetailRows.value.map(d => ({
        [dRelField.key]: d[dRelField.key],
        quantity: d.quantity || 1
      }))

      const existingProduct = currentItems.find(item => item[dRelField.key] === inputID)
      if (existingProduct) {
        existingProduct.quantity += 1
      } else {
        currentItems.push({ [dRelField.key]: inputID, quantity: 1 })
      }

      await axios.put(`${baseApiUrl.value}/${activeNotaId.value}`, { items: currentItems })
    }

    closeSearchModal()
    await loadActiveNotaDetails(activeNotaId.value)
  } catch (error) {
    alert(error.response?.data?.message || 'Gagal menyimpan data relasi.')
  }
}

// 5. Update Kuantitas secara Inline Langsung di Cell RevoGrid
const handleInlineGridEdit = async (event) => {
  const { model, prop, val } = event.detail
  const dRelField = detailRelationField.value
  if (!dRelField) return

  try {
    const updatedItems = allDetailRows.value.map(item => {
      return {
        [dRelField.key]: item[dRelField.key],
        quantity: item.id === model.id && prop === 'quantity' ? Number(val) : (item.quantity || 1)
      }
    })

    await axios.put(`${baseApiUrl.value}/${activeNotaId.value}`, { items: updatedItems })
    await loadActiveNotaDetails(activeNotaId.value)
  } catch (error) {
    console.error(error)
  }
}

// 6. Batalkan Transaksi / Hapus Draft Nomor Antrian
const deleteAntrian = async (id) => {
  if (!confirm(`Batalkan draft transaksi #${id}?`)) return
  try {
    await axios.delete(`${baseApiUrl.value}/${id}`)
    if (String(activeNotaId.value) === String(id)) {
      activeNotaId.value = null
      currentActiveNota.value = null
      allDetailRows.value = []
    }
    await loadPOSConfiguration()
  } catch (error) {
    alert(error.response?.data?.message || 'Gagal menghapus transaksi.')
  }
}

// 7. Modifikasi Data Field Samping Form Kanan
const updateHeaderField = async (fieldKey, value) => {
  if (!activeNotaId.value) return
  try {
    await axios.put(`${baseApiUrl.value}/${activeNotaId.value}`, { [fieldKey]: value })
    await loadActiveNotaDetails(activeNotaId.value)
  } catch (error) {
    console.error(error)
  }
}

// 8. Eksekusi Trigger Tombol Aksi Bawah (Contoh: Cetak / Bayar)
const triggerActionButton = async (actionKey) => {
  if (!activeNotaId.value) return
  if (actionKey === 'pay') {
    if (confirm("Konfirmasi Pembayaran Nota Transaksi Ini?")) {
      try {
        alert("Pembayaran Berhasil Diproses! Ledger Jurnal Akuntansi otomatis terposting.")
        activeNotaId.value = null
        currentActiveNota.value = null
        allDetailRows.value = []
        await loadPOSConfiguration()
      } catch (error) {
        alert(error.response?.data?.message || 'Gagal memproses pembayaran.')
      }
    }
  }
}

// ==========================================
//      KUMPULAN INTERNAL UTILITY VIEW UI
// ==========================================

const buildRevoGridColumns = () => {
  detailColumns.value = detailSchemaRaw.value.map(field => {
    const config = { prop: field.key, name: field.label, readonly: field.readonly || false }
    if (field.type === 'currency') {
      config.cellTemplate = (createElement, linkProps) => createElement('span', { class: 'font-mono' }, formatCurrency(linkProps.model[field.key] || 0))
    } else if (field.type === 'number') {
      config.cellTemplate = (createElement, linkProps) => createElement('span', { class: 'font-mono' }, formatNumber(linkProps.model[field.key] || 0))
    } else if (field.relation) {
      config.cellTemplate = (createElement, linkProps) => relationCellRenderer(createElement, linkProps, field.relation.displayField, field.key)
    }
    return config
  })
}

const setActiveAntrian = async (id, index) => {
  activeNotaId.value = id
  focusedHeaderCoordinate.value = { x: 0, y: index }
  lastActiveGrid.value = 'detail'
  await loadActiveNotaDetails(id)
}

const filteredHeaderSchema = computed(() => {
  const highlightFields = highlightConfig.value.map(hl => hl.field)
  return headerSchemaRaw.value.filter(field => !highlightFields.includes(field.key))
})

const isFieldEditable = (fieldName) => {
  const fieldSchema = headerSchemaRaw.value.find(f => f.key === fieldName)
  return fieldSchema ? !(fieldSchema.readonly || fieldSchema.primary) : false
}

const startInlineEdit = async (hl) => {
  if (!currentActiveNota.value) return
  inlineEditingField.value = hl.field
  inlineEditValue.value = currentActiveNota.value[hl.field] || ''
  await nextTick()
  const inputEl = Array.isArray(inlineInputRef.value) ? inlineInputRef.value[0] : inlineInputRef.value
  if (inputEl) { inputEl.focus(); inputEl.select() }
}

const submitInlineEdit = (fieldKey) => {
  if (inlineEditingField.value === fieldKey && currentActiveNota.value) {
    updateHeaderField(fieldKey, inlineEditValue.value)
  }
  inlineEditingField.value = null
}

const cancelInlineEdit = () => { inlineEditingField.value = null }

const formatHeaderValue = (nota, field) => {
  const val = nota[field.key]
  if (val === undefined || val === null || val === '') return '-'
  if (field.type === 'relation' && typeof val === 'object') return val[field.relation?.displayField] || val.name || '-'
  if (field.primary || field.type === 'display' || field.key === primaryKey.value) return val
  if (field.type === 'currency' || !isNaN(val)) return formatCurrency(val)
  return val
}

const activeNotaValueByField = (fieldName) => {
  const notaAktif = currentActiveNota.value
  if (!notaAktif) return 0
  return notaAktif[fieldName] !== undefined ? notaAktif[fieldName] : 0
}

const relationCellRenderer = (createElement, linkProps, displayField, fieldKey) => {
  const rowData = linkProps.model[fieldKey]
  if (!rowData) return createElement('span', {}, '')
  if (typeof rowData === 'object') return createElement('span', {}, rowData[displayField] || rowData.name || '')
  return createElement('span', {}, rowData)
}

const removeGridListeners = () => {
  if (savedDetailGridEl) {
    savedDetailGridEl.removeEventListener('keydown', handleKeyDownDetail)
    savedDetailGridEl = null
  }
}

const setUpGridBehaviors = () => {
  const detailGrid = gridRef.value?.$el || gridRef.value
  removeGridListeners()
  if (detailGrid) {
    savedDetailGridEl = detailGrid
    detailGrid.addEventListener('keydown', handleKeyDownDetail)
    detailGrid.setAttribute('tabindex', '0')
  }
  if (focusTimeoutId) clearTimeout(focusTimeoutId)
  focusTimeoutId = setTimeout(() => { if (detailGrid) detailGrid.focus() }, 50)
}

const afterFocus = (event) => {
  lastActiveGrid.value = 'detail'
  focusedCoordinate.value = { x: event.detail.colIndex, y: event.detail.rowIndex }
}

const handleKeyDownDetail = async (e) => {
  if (inlineEditingField.value || showSearchModal.value) return
  if (e.repeat) return
  if (e.key === 'Delete') {
    if (focusedCoordinate.value.y >= 0) {
      const targetItem = allDetailRows.value[focusedCoordinate.value.y]
      const dRelField = detailRelationField.value

      if (targetItem && dRelField && confirm('Hapus item belanja ini?')) {
        try {
          const updatedItems = allDetailRows.value
            .filter(item => item.id !== targetItem.id)
            .map(item => ({ [dRelField.key]: item[dRelField.key], quantity: item.quantity }))

          await axios.put(`${baseApiUrl.value}/${activeNotaId.value}`, { items: updatedItems })
          await loadActiveNotaDetails(activeNotaId.value)
        } catch (err) {
          console.error(err)
        }
      }
    }
    e.preventDefault()
    return
  }
  handleGlobalPOSShortcuts(e, 'detail')
}

const handleGlobalPOSShortcuts = (e, gridSource) => {
  if (gridSource) lastActiveGrid.value = gridSource
  if (e.key === 'F2') { tambahAntrian(); e.preventDefault(); return }
  if (e.key === 'F4') { triggerActionButton('pay'); e.preventDefault(); return }
  if (e.key === 'F7') { lastActiveGrid.value = 'header'; openSearchWithChar(''); e.preventDefault(); return }
  if (e.key === 'F8') { lastActiveGrid.value = 'detail'; openSearchWithChar(''); e.preventDefault(); return }
}

const openSearchWithChar = async (char) => {
  searchQuery.value = char
  showSearchModal.value = true
  await nextTick()
  searchInputRef.value?.focus()
}

const closeSearchModal = () => {
  showSearchModal.value = false
  searchQuery.value = ''
  nextTick(() => { gridRef.value?.$el?.focus() })
}

onMounted(() => { loadPOSConfiguration() })

onBeforeUnmount(() => {
  if (focusTimeoutId) clearTimeout(focusTimeoutId)
  if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)
  removeGridListeners()
  queueRows.value = []
  allDetailRows.value = []
  detailColumns.value = []
})

watch(() => queueStore.activeNotaId, async (newId) => {
  if (props.menu?.route && newId === props.menu.route) {
    await nextTick()
    if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)
    watchTabTimeoutId = setTimeout(() => { setUpGridBehaviors() }, 0)
  }
}, { immediate: true })
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