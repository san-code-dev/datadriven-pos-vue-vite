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
            <span>+ {{ headerLabel }}</span>
            <kbd
              class="opacity-60 text-[10px] bg-slate-100 dark:bg-slate-900 px-1 rounded border border-slate-200 dark:border-slate-700 font-mono">[F2]</kbd>
          </button>

          <div v-if="queueRows.length === 0" class="text-xs font-semibold text-slate-400 ml-2">
            Tidak Ada {{ headerLabel }} Aktif
          </div>
        </div>

        <div v-if="!activeNotaId || !currentActiveNota"
          class="absolute inset-x-4 bottom-4 top-[60px] bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
          <p class="text-slate-400 text-sm font-semibold">Silahkan pilih atau buat data {{ headerLabel }} terlebih
            dahulu</p>
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
            :placeholder="lastActiveGrid === 'header' ? `Mode ${headerLabel}: Pilih/Buat Baris Baru...` : `Mode ${detailLabel}: Scan Barcode / Masukkan Data Item...`"
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
        <span class="text-slate-500 font-bold dark:text-slate-300">POS SYSTEM</span>
        <div class="h-3 w-px bg-slate-200 dark:bg-slate-700 hidden sm:inline-block"></div>
        <div><kbd
            class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">[DEL]</kbd>
          Hapus Baris Item</div>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button v-for="action in actionButtons" :key="action.key" @click="triggerActionButton(action.key)"
          :class="action.class || 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'"
          class="px-5 py-2.5 text-xs font-bold text-white rounded-xl transition whitespace-nowrap shadow-md flex items-center gap-1.5">
          <span>{{ action.label }}</span>
          <span v-if="action.hotkey" class="opacity-70 text-[10px] font-mono font-normal">({{ action.hotkey }})</span>
        </button>
      </div>
    </div>

    <div v-if="showSearchModal" @click.self="closeSearchModal"
      class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
        <label class="block text-xs font-bold mb-2 uppercase tracking-wider"
          :class="lastActiveGrid === 'header' ? 'text-amber-500' : 'text-emerald-500'">
          {{ lastActiveGrid === 'header' ? `Cari / Input Master ${headerFirstRelationField?.label || 'Data'}` : `Cari /
          Master ${detailFirstRelationField?.label || 'Produk'}` }}
        </label>
        <input ref="searchInputRef" v-model="searchQuery" type="text"
          class="w-full text-lg font-mono font-bold px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 text-slate-800 dark:text-slate-100 shadow-inner"
          :class="lastActiveGrid === 'header' ? 'focus:ring-amber-500' : 'focus:ring-emerald-500'"
          @keydown.enter="handleSearchSubmit" @keydown.esc="closeSearchModal" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import axios from 'axios' // Import pemanggil API pihak ketiga
import { isDark } from '@/composables/dark'
import { useNumberFormat } from '@/composables/number-format'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'
import { useQueueStore } from '@/stores/transaction'
import { Penjualan as MockPenjualan } from '@/mock-api/mock-data'

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

const headerLabel = ref('ANTRIAN')
const detailLabel = ref('ITEM')

const headerSchemaRaw = ref([])
const detailSchemaRaw = ref([])

const actionButtons = ref([])
const highlightConfig = ref([])

const primaryKey = ref('id')
const primaryKeyLabel = ref('id')
const foreignKeyInDetail = ref('penjualanId')

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

// Menghubungkan activeNotaId murni ke Pinia Store untuk tujuan Persistence (Simpan saat refresh)
const activeNotaId = computed({
  get() { return queueStore.activeNotaId },
  set(val) { queueStore.activeNotaId = val }
})

// ==========================================
//        KUMPULAN FUNGSI API (AXIOS)
// ==========================================

// 1. Load data POS awal & list antrian utama
const loadPOSConfiguration = async () => {
  try {
    //const response = await axios.get('/api/pos/init')
    //const res = response.data

    const res = MockPenjualan
    if (!res) return

    actionButtons.value = res.actions || []
    headerLabel.value = res.header?.label || 'ANTRIAN'
    detailLabel.value = res.details?.label || 'ITEM'
    headerSchemaRaw.value = res.header?.schema || []
    detailSchemaRaw.value = res.details?.schema || []
    queueRows.value = [...(res.queue?.data || [])]

    highlightConfig.value = headerSchemaRaw.value
      .filter(f => f.highlight)
      .map(f => ({ key: f.key, label: f.label, field: f.key, type: f.type }))

    const primaryField = headerSchemaRaw.value.find(f => f.primary)
    primaryKey.value = primaryField?.key || 'id'
    primaryKeyLabel.value = primaryField?.label || 'id'

    const fKey = detailSchemaRaw.value.find(f => f.key.toLowerCase().includes('id') && f.key !== 'id')
    foreignKeyInDetail.value = fKey?.key || 'penjualanId'

    buildRevoGridColumns()

    // Cek ketersediaan antrian pasca-load
    if (queueRows.value.length > 0) {
      if (!activeNotaId.value) {
        // Jika bersih (tidak ada sisa refresh), set antrian pertama jadi aktif
        await setActiveAntrian(queueRows.value[0][primaryKey.value], 0)
      } else {
        // Jika ada id sisa refresh (persist), sinkronkan tab posisi koordinat birunya
        const activeIndex = queueRows.value.findIndex(nota => String(nota[primaryKey.value]) === String(activeNotaId.value))
        if (activeIndex !== -1) {
          focusedHeaderCoordinate.value = { x: 0, y: activeIndex }
        }
        await loadActiveNotaDetails(activeNotaId.value)
      }
    }
  } catch (error) {
    console.error('Gagal mengambil inisialisasi skema POS:', error)
  }
}

// 2. Load data spesifik (Header Info + Detail Item) milik Nota terpilih
const loadActiveNotaDetails = async (id) => {
  if (!id) return
  try {
    // const response = await axios.get(`/api/pos/nota/${id}`)
    const response = { data: MockPenjualan }

    // Set data objek tunggal header
    currentActiveNota.value = response.data.header || null

    // Set data array item, pastikan difilter agar tidak bercampur dengan antrian lain!
    const rawDetails = Array.isArray(response.data.details) ? response.data.details : []
    allDetailRows.value = rawDetails.filter(detail =>
      String(detail[foreignKeyInDetail.value]) === String(id)
    )

    await nextTick()
    setUpGridBehaviors()
  } catch (error) {
    console.error(`Gagal memuat detail nota #${id}:`, error)
  }
}

// 3. Tambah Antrian Baru (F2)
const tambahAntrian = async () => {
  try {
    const response = await axios.post('/api/pos/nota')
    const newNota = response.data

    await loadPOSConfiguration() // Reload list antrian terbaru

    if (newNota && newNota[primaryKey.value]) {
      const idx = queueRows.value.findIndex(n => String(n[primaryKey.value]) === String(newNota[primaryKey.value]))
      await setActiveAntrian(newNota[primaryKey.value], idx !== -1 ? idx : 0)
    }
  } catch (error) {
    console.error('Gagal membuat antrian baru:', error)
  }
}

// 4. Hapus Satu Nomor Antrian Utama
const deleteAntrian = async (id) => {
  if (!confirm(`Hapus antrian #${id}?`)) return
  try {
    await axios.delete(`/api/pos/nota/${id}`)
    if (String(activeNotaId.value) === String(id)) {
      activeNotaId.value = null
      currentActiveNota.value = null
      allDetailRows.value = []
    }
    await loadPOSConfiguration()
  } catch (error) {
    console.error('Gagal menghapus antrian:', error)
  }
}

// 5. Update data field info samping (Contoh: Mengubah ganti member / tanggal)
const updateHeaderField = async (fieldKey, value) => {
  if (!activeNotaId.value) return
  try {
    const response = await axios.patch(`/api/pos/nota/${activeNotaId.value}`, {
      field: fieldKey,
      value: value
    })
    currentActiveNota.value = response.data || currentActiveNota.value
  } catch (error) {
    console.error('Gagal memperbarui field header:', error)
  }
}

// 6. Update baris data item di dalam RevoGrid secara inline
const handleInlineGridEdit = async (event) => {
  const { model, prop, val } = event.detail
  try {
    await axios.put(`/api/pos/detail/${model.id}`, {
      field: prop,
      value: val
    })
    await loadActiveNotaDetails(activeNotaId.value) // Refresh untuk hitung ulang grand total
  } catch (error) {
    console.error('Gagal merubah kuantitas/harga item:', error)
  }
}

// 7. Pencarian via modal (Input manual nama item / scan barcode barcode)
const handleSearchSubmit = async () => {
  const query = searchQuery.value.trim()
  if (!query || !activeNotaId.value) return
  try {
    await axios.post('/api/pos/search', {
      targetMode: lastActiveGrid.value,
      activeNotaId: activeNotaId.value,
      query: query
    })
    closeSearchModal()
    await loadActiveNotaDetails(activeNotaId.value) // Tarik data item terbaru pasca input
  } catch (error) {
    console.error('Pencarian gagal diproses:', error)
  }
}

// 8. Eksekusi Aksi Tombol Bawah (Contoh: Bayar / Cetak)
const triggerActionButton = async (actionKey) => {
  if (!activeNotaId.value) return
  try {
    const response = await axios.post(`/api/pos/action/${actionKey}`, {
      activeNotaId: activeNotaId.value
    })
    alert(response.data.message || 'Aksi berhasil dieksekusi!')
    if (actionKey === 'pay') {
      activeNotaId.value = null
      await loadPOSConfiguration()
    }
  } catch (error) {
    console.error(`Gagal memicu aksi ${actionKey}:`, error)
  }
}

// ==========================================
//       LOGIKA INTERNAL LOGIKAL KOMPONEN
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

const headerFirstRelationField = computed(() => headerSchemaRaw.value.find(field => field.type === 'relation') || null)
const detailFirstRelationField = computed(() => detailSchemaRaw.value.find(field => field.type === 'relation') || null)

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
  const value = notaAktif[fieldName]
  if (value && typeof value === 'object') {
    return value[headerFirstRelationField.value?.relation?.displayField] || value.name || 0
  }
  return value !== undefined ? value : 0
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
      if (targetItem && confirm(`Hapus item ${detailLabel.value} ini?`)) {
        try {
          await axios.delete(`/api/pos/detail/${targetItem.id}`)
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

  if (e.key === 'F2') {
    lastActiveGrid.value = 'header'
    openSearchWithChar('')
    e.preventDefault()
    return
  }

  if (e.key === 'F4') {
    triggerActionButton('pay')
    e.preventDefault()
    return
  }

  const isFunctionalKey = e.ctrlKey || e.altKey || e.metaKey
  if (e.key.length === 1 && !isFunctionalKey) {
    const currentColumns = detailColumns.value
    const currentCoordinate = focusedCoordinate.value
    if (currentColumns && currentCoordinate.x >= 0) {
      const activeColumn = currentColumns[currentCoordinate.x]
      if (activeColumn && (activeColumn.prop === primaryKey.value || activeColumn.prop === 'id' || activeColumn.readonly)) {
        openSearchWithChar(e.key)
        e.preventDefault()
      }
    }
  }
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

// Lifecycle Hooks
onMounted(() => {
  loadPOSConfiguration()
})

onBeforeUnmount(() => {
  if (focusTimeoutId) clearTimeout(focusTimeoutId)
  if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)
  removeGridListeners()
  queueRows.value = []
  allDetailRows.value = []
  detailColumns.value = []
})

// Mengawasi sisa ID menu rute agar navigasi RevoGrid tetap aktif stabil
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