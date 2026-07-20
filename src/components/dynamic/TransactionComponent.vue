<template>
  <div
    class="flex h-full max-h-full overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950 w-full text-slate-800 dark:text-slate-100">
    <!-- ==================== MAIN TRANSACTION AREA ==================== -->
    <div class="flex-1 flex flex-col h-full overflow-hidden min-h-0 relative">
      <!-- HEADER STATUS & CONTROL ACTIONS -->
      <div v-if="showSearchModal" @click.self="closeSearchModal"
        class="absolute backdrop-blur-sm bg-slate-900/40 flex inset-0 items-center justify-center transition-all z-50">
        <div
          class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-3 mx-4"
          @keydown.stop>
          <form @submit.prevent="handleSearchSubmit" class="flex items-center relative">
            <div class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              <Icon icon="heroicons:magnifying-glass-20-solid" class="w-5 h-5" />
            </div>
            <input ref="searchInputRef" v-model="searchQuery" type="text"
              placeholder="Ketik Kode/Nama barang lalu tekan Enter untuk menambah..."
              class="w-full pl-11 pr-20 py-3 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 transition-all" />
            <div class="absolute right-3 flex items-center gap-1.5 pointer-events-none"> <kbd
                class="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-600 rounded shadow-sm">
                Enter ↩
              </kbd>
              <button type="button" @click="closeSearchModal"
                class="pointer-events-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                Esc
              </button>
            </div>
          </form>
        </div>
      </div>
      <div
        class="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div class="flex items-center gap-3 select-none"> <span
            class="font-bold text-base tracking-tight text-slate-800 dark:text-slate-200">
            {{ schemaData.label || 'Transaksi' }}
          </span>
          <div class="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700 text-xs">
            <template v-if="syncStatus.state === 'loading'">
              <Icon icon="heroicons:arrow-path-20-solid" class="w-4 h-4 animate-spin text-emerald-500" /> <span
                class="text-slate-500">{{ syncStatus.message }}</span>
            </template>
            <template v-else-if="syncStatus.state === 'success'">
              <Icon icon="heroicons:check-circle-20-solid" class="w-4 h-4 text-emerald-500" /> <span
                class="text-emerald-600 dark:text-emerald-400 font-medium">{{ syncStatus.message }}</span>
            </template>
            <template v-else-if="syncStatus.state === 'error'">
              <Icon icon="heroicons:exclamation-circle-20-solid" class="w-4 h-4 text-rose-500" /> <span
                class="text-rose-600 dark:text-rose-400 font-medium animate-pulse">{{ syncStatus.message }}</span>
            </template>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Tombol Tambah Detil Produk Langsung -->
          <button @click="openSearchProduct('')" type="button"
            class="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1.5">
            <Icon icon="heroicons:plus-circle-20-solid" class="w-4 h-4" /> <span>Tambah Item</span> <kbd
              class="ml-1 text-[9px] bg-emerald-750 px-1 py-0.5 rounded text-emerald-100 font-mono">[F4]</kbd>
          </button>
          <!-- Dinamis Actions dari schema (print, pay dll) -->
          <button v-for="action in (schemaData.actions || [])" :key="action.key"
            @click="triggerCustomAction(action.key)" class="btn-action-slate"> <span>{{ action.label }}</span>
          </button>
          <button @click="handleSaveTransaction" type="button"
            class="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-sm">
            <span>Simpan Transaksi</span> <kbd
              class="ml-1.5 text-[9px] bg-emerald-700 px-1 py-0.5 rounded text-emerald-100 font-mono">[F9]</kbd>
          </button>
          <button @click="handleCancelTransaction" type="button"
            class="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
            <span>Batal</span>
          </button>
        </div>
      </div>
      <!-- ==================== TABS ANTREAN (DRAFTS) ==================== -->
      <div
        class="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-hidden">
        <span
          class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
          <icon icon="heroicons:clock-20-solid" class="w-3.5 h-3.5"></icon>(Draft)
        </span>
        <div class="flex flex-1 flex-wrap gap-1.5 items-center no-scrollbar overflow-x-auto py-0.5">
          <button v-for="item in queueData" :key="item.id" @click="loadTransaction(item.id)" :class="[
            'px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 shadow-sm',
            activeHeaderId === item.id
              ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
          ]"> <span class="w-1.5 h-1.5 rounded-full"
              :class="activeHeaderId === item.id ? 'bg-white animate-pulse' : 'bg-slate-400'"></span> <span>{{
                item.label ||
                `Draft #${item.id}` }}</span>
          </button>
          <!-- Tombol Tambah Draft Antrean Baru -->
          <button @click="handleNewTransaction"
            class="p-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-center shrink-0"
            title="Tambah Antrean Baru (F2)">
            <Icon icon="heroicons:plus-20-solid" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <!-- FORM HEADER (INFORMASI UTAMA NOTA) -->
      <!-- ==================== TABLE DETAILS (DAFTAR BARANG BELANJA) ==================== -->
      <div class="flex flex-1 flex-row min-h-0 overflow-hidden relative w-full">
        <div class="flex-1 min-h-0 w-full relative group overflow-hidden z-10">
          <RevoGrid hide-attribution ref="gridRef" class="w-full h-full max-h-full focus:outline-none"
            :columns="columns" :source="rows" :theme="isDark ? 'darkCompact' : 'compact'" :resize="true"
            :auto-size-column="true" @beforeeditstart="beforeEditStart" @afteredit="afterEdit" @beforeedit="beforeEdit"
            @keydown="handleKeyDown" :column-types="columnTypes" />
          <GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns" />
          <!-- Modal Pencarian Produk Cepat -->
        </div>
        <div v-if="headerForm"
          class="bg-white border-b border-slate-200 flex flex-col gap-4 grid-cols-1 p-4 transition-colors dark:bg-slate-900 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="field in (schemaData.header?.schema || [])" :key="field.key" class="flex flex-col gap-1.5">
            <label class="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">{{
              field.label
            }}
            </label>
            <!-- Type: Display / Readonly -->
            <div v-if="field.readonly" :class="[
              'px-3 py-2 text-sm rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium',
              field.highlight ? 'text-emerald-600 dark:text-emerald-400 font-bold text-lg border-emerald-100 dark:border-emerald-900/50' : 'text-slate-600 dark:text-slate-300'
            ]">
              <template v-if="field.type === 'currency'">
                {{ formatCurrency(headerForm[field.key]) }}
              </template>
              <template v-else>
                {{ headerForm[field.key] || '-' }}
              </template>
            </div>
            <!-- Type: Relation (Select Customer) -->
            <select v-else-if="field.type === 'relation' && field.relation" v-model="headerForm[field.key]"
              @change="updateHeaderField(field.key)"
              class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
              <option :value="null">-- Pilih {{ field.label }} --</option>
              <option v-for="opt in relationOptions[field.relation.entity] || []" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <!-- Type: Standard (Date, Text, Number) -->
            <input v-else :type="field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'"
              v-model="headerForm[field.key]" @change="updateHeaderField(field.key)"
              class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'

import api from '@/lib/axios'
import { useTabStore } from '@/stores/tabs'
import { useRoute } from 'vue-router'

import NumberColumnType from '@revolist/revogrid-column-numeral'
import SelectTypePlugin from '@revolist/revogrid-column-select'
import DateTypePlugin from '@revolist/revogrid-column-date'

const props = defineProps({
  menu: { type: Object, required: true },
  schemaData: { type: Object, required: true }
})

const route = useRoute()
const tabStore = useTabStore()

const gridRef = ref(null)
const navigatorRef = ref(null)

const isSidebarOpen = ref(true)
const queueData = ref<any[]>([])
const savedTransactions = ref<any[]>([])

const activeHeaderId = ref<number | null>(null)
const headerForm = ref<any>(null)
const rows = ref<any[]>([])

const columns = ref([])
const primaryKeyFieldName = ref('id')
const permission = ref<Record<string, boolean | undefined>>({})

// ==================== STATE PENCAIRAN PRODUK (addDetails) ====================
const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

const syncStatus = ref({ state: 'idle', message: '' })
let statusResetTimeout = null
let apiLoadingTimeout = null

const relationOptions = ref<{ [entityName: string]: Array<{ value: any, label: string }> }>({})

const formKey = computed(() => props.menu.key.toLowerCase())

const getGrid = () => (gridRef.value?.$el || gridRef.value || {})

const getActiveCellState = async () => {
  const grid = getGrid()
  if (typeof grid.getFocused !== 'function') return { x: 0, y: 0, column: {}, model: {} }
  const focused = await grid.getFocused()
  return {
    x: focused?.cell?.x ?? 0,
    y: focused?.cell?.y ?? 0,
    column: focused?.column || {},
    model: focused?.model || {}
  }
}

const columnTypes = {
  numeric: new NumberColumnType('0,0'),
  decimal: new NumberColumnType('0,0.00'),
  select: new SelectTypePlugin(),
  date: new DateTypePlugin()
}

const formatCurrency = (val: any) => {
  if (val === undefined || val === null) return 'Rp 0'
  const numeric = typeof val === 'object' && val.d ? Number(val.d[0]) : Number(val)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(numeric)
}

const relationCellRenderer = (createElement, cellProps, displayField, fieldKey, optionsList) => {
  const rawValue = cellProps.model[fieldKey]
  if (!rawValue) return createElement('span', {}, '')
  if (typeof rawValue === 'object' && rawValue !== null) {
    return createElement('span', {}, rawValue[displayField] || rawValue.name || '')
  }
  const matchedOption = optionsList.find(opt => opt.value === rawValue)
  return createElement('span', {}, matchedOption ? matchedOption.label : rawValue)
}

const setSyncStatus = (state, message, autoResetDelay = 3000) => {
  if (statusResetTimeout) clearTimeout(statusResetTimeout)
  if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)

  if (state === 'loading') {
    apiLoadingTimeout = setTimeout(() => {
      syncStatus.value = { state, message }
    }, 400)
  } else {
    syncStatus.value = { state, message }
  }

  if ((state === 'success' || state === 'error') && autoResetDelay) {
    statusResetTimeout = setTimeout(() => {
      syncStatus.value = { state: 'idle', message: '' }
    }, autoResetDelay)
  }
}

// AMBIL DAFTAR RELASI
const fetchRelationOptions = async () => {
  const headerSchema = props.schemaData?.header?.schema || []
  const detailsSchema = props.schemaData?.details?.schema || []
  const allFields = [...headerSchema, ...detailsSchema]
  const relationFields = allFields.filter(f => f.type === 'relation' && f.relation)

  for (const field of relationFields) {
    const entity = field.relation.entity
    const displayField = field.relation.displayField || 'name'
    if (relationOptions.value[entity]) continue

    try {
      const response = await api.get(`/${entity}/get-all`)
      const rawData = response.data?.schema?.data || response.data?.data || response.data || []
      relationOptions.value[entity] = rawData.map((item: any) => ({
        value: item.id,
        label: item[displayField] || item.name
      }))
    } catch (err) {
      console.error(`Gagal memuat opsi relasi untuk entitas ${entity}:`, err)
    }
  }
}

// AMBIL ANTREAN AKTIF (DRAFTS)
const fetchQueue = async () => {
  try {
    const response = await api.get(`/${formKey.value}/get-queue`)
    queueData.value = response.data || []
  } catch (err) {
    console.error("Gagal mengambil antrean:", err)
  }
}


// MUAT DETAIL SATU TRANSAKSI UTAMA (HEADER & DETAILS)
const loadTransaction = async (id: number) => {
  setSyncStatus('loading', 'Memuat dokumen transaksi..')
  try {
    const response = await api.get(`/${formKey.value}/get-transaction`, { params: { id } })
    const { header, details } = response.data || { header: null, details: [] }

    activeHeaderId.value = id
    headerForm.value = header
    rows.value = details

    await nextTick()
    getGrid().requestGridRowsRedraw?.()
    setSyncStatus('success', 'Transaksi dimuat')
  } catch (err: any) {
    setSyncStatus('error', `Gagal memuat transaksi: ${err.message}`)
  }
}

// INITIAL LOAD
const loadComponentData = async () => {
  const res = props.schemaData
  if (!res) return

  await fetchRelationOptions()

  columns.value = (res.details?.schema || []).map(field => {
    const columnConfig: Record<string, any> = {
      prop: field.key,
      name: field.label,
      size: field.size,
      readonly: field.readonly || false,
      required: field.required || false,
      _type: field.type || 'text',
      _primary: field.primary || false,
    }

    if (['number', 'integer'].includes(field.type)) columnConfig.columnType = 'numeric'
    else if (['decimal', 'currency'].includes(field.type)) columnConfig.columnType = 'decimal'
    else if (field.type === 'date') columnConfig.columnType = 'date'
    else if (field.type === 'select') {
      columnConfig.columnType = 'select'
      columnConfig.labelKey = 'label'
      columnConfig.valueKey = 'value'
      columnConfig.source = field.options || []
      columnConfig.editorProperties = { appendToBody: true }
    }
    else if (field.type === 'relation' && field.relation) {
      const entity = field.relation.entity
      columnConfig.columnType = 'select'
      columnConfig.labelKey = 'label'
      columnConfig.valueKey = 'value'
      columnConfig.source = relationOptions.value[entity] || []
      columnConfig.editorProperties = { appendToBody: true }
      columnConfig.cellTemplate = (createElement, linkProps) =>
        relationCellRenderer(
          createElement,
          linkProps,
          field.relation.displayField,
          field.key,
          relationOptions.value[entity] || []
        )
    }
    return columnConfig
  })

  primaryKeyFieldName.value = (res.details?.schema || []).find(f => f.primary)?.key || 'id'
  permission.value = res.permissions || {}

  await fetchQueue()

  if (queueData.value.length > 0) {
    await loadTransaction(queueData.value[0].id)
  } else {
    await handleNewTransaction()
  }
}

// UPDATE FORM HEADER (AUTO-SAVE)
const updateHeaderField = async (fieldKey: string) => {
  if (!activeHeaderId.value || !headerForm.value) return

  setSyncStatus('loading', 'Menyimpan perubahan header..')
  try {
    const response = await api.put(`/${formKey.value}/update-header`, headerForm.value, {
      params: { id: activeHeaderId.value }
    })
    headerForm.value = response.data

    await fetchQueue()
    setSyncStatus('success', 'Header disimpan')
  } catch (err: any) {
    setSyncStatus('error', `Gagal update header: ${err.message}`)
  }
}

// AKSI EDIT DETIL BARANG (GRID CELLS)
const beforeEditStart = () => { console.log('Mempersiapkan pengeditan data detail..') }

const beforeEdit = (event) => {
  const { val, prop } = event.detail
  const originalField = props.schemaData?.details?.schema?.find(f => f.key === prop)
  if (!originalField) return

  const columnLabel = originalField.label || prop
  const fieldType = originalField.type
  const isRequired = originalField.required || false

  if (isRequired && (val === null || val === undefined || val === '')) {
    setSyncStatus('error', `${columnLabel} wajib diisi!`)
    event.preventDefault()
    return
  }

  if (['number', 'integer', 'decimal', 'currency'].includes(fieldType)) {
    if (val !== '' && val !== null && isNaN(Number(val))) {
      setSyncStatus('error', `${columnLabel} harus berupa angka!`)
      event.preventDefault()
      return
    }
    if (originalField.validation?.min !== undefined && Number(val) < originalField.validation.min) {
      setSyncStatus('error', `${columnLabel} minimal bernilai ${originalField.validation.min}!`)
      event.preventDefault()
      return
    }
  }
}

const afterEdit = async (event) => {
  if (event.detail.oldValue === event.detail.value) return

  const updatedModel = event.detail.model
  const detailId = updatedModel[primaryKeyFieldName.value]
  if (!detailId || !activeHeaderId.value) return

  setSyncStatus('loading', 'Memperbarui baris belanja..')
  try {
    const response = await api.put(`/${formKey.value}/update-details`, updatedModel, {
      params: {
        headerId: activeHeaderId.value,
        id: detailId
      }
    })

    if (response.status === 200) {
      await loadTransaction(activeHeaderId.value)
      setSyncStatus('success', 'Perubahan barang disimpan')
    }
  } catch (err: any) {
    setSyncStatus('error', `Gagal merubah baris belanja: ${err.message}`)
  }
}

// EVENT SHORTCUT KEYBOARD
const handleKeyDown = async (e) => {
  if (e.repeat) return

  // F2: Transaksi Baru
  if (e.key === 'F2') {
    handleNewTransaction()
    e.preventDefault()
    return
  }

  // F4: Cari & Tambah Detail Baru
  if (e.key === 'F4') {
    openSearchProduct('')
    e.preventDefault()
    return
  }

  // F9: Simpan Transaksi
  if (e.key === 'F9') {
    handleSaveTransaction()
    e.preventDefault()
    return
  }

  // Delete: Hapus item aktif
  if (e.key === 'Delete') {
    handleDeleteDetailRow()
    e.preventDefault()
    return
  }

  // Cek apakah user sedang mengetik teks pada sel pencarian utama
  const { column } = await getActiveCellState()
  if (column?._primary && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    openSearchProduct(e.key)
    e.preventDefault()
  }
}

// ==================== FITUR ADD DETAILS & PENCARIAN PRODUK ====================
const openSearchProduct = async (char: string) => {
  searchQuery.value = char
  showSearchModal.value = true
  await nextTick()
  searchInputRef.value?.focus()
}

const handleSearchSubmit = async () => {
  const query = searchQuery.value.trim()
  if (!query || !activeHeaderId.value) return

  setSyncStatus('loading', 'Menambahkan barang..')
  try {
    // Memanggil endpoint backend `add-details` dengan query parameter dari text input pencarian
    const response = await api.post(`/${formKey.value}/add-details`, {
      headerId: activeHeaderId.value,
      query
    })

    if (response.status === 201 || response.status === 200) {
      await loadTransaction(activeHeaderId.value)
      closeSearchModal()
      setSyncStatus('success', 'Barang berhasil ditambahkan')
    }
  } catch (err: any) {
    setSyncStatus('error', `Gagal menambah barang: ${err.response?.data?.message || err.message}`)
  }
}

const closeSearchModal = () => {
  showSearchModal.value = false
  searchQuery.value = ''
  nextTick(() => { getGrid().focus?.() })
}

// HAPUS DETAIL BARANG (Delete key)
const handleDeleteDetailRow = async () => {
  if (!activeHeaderId.value) {
    console.log('tidak ada headerId')
    return
  }


  const { y: targetIndex } = await getActiveCellState()
  const selectedData = rows.value[targetIndex]
  const detailId = selectedData?.[primaryKeyFieldName.value]
  console.log(primaryKeyFieldName.value, selectedData)
  if (!detailId) return

  if (confirm(`Hapus item belanja: ${selectedData?.name || 'barang ini'}?`)) {
    setSyncStatus('loading', 'Menghapus item..')
    try {
      const response = await api.delete(`/${formKey.value}/delete-details`, {
        params: {
          headerId: activeHeaderId.value,
          id: detailId
        }
      })

      if (response.status === 200) {
        await loadTransaction(activeHeaderId.value)
        setSyncStatus('success', 'Item belanja dihapus')
      }
    } catch (err: any) {
      setSyncStatus('error', `Gagal menghapus item: ${err.message}`)
    }
  }
}

// BUAT TRANSAKSI BARU (Draft Baru)
const handleNewTransaction = async () => {
  setSyncStatus('loading', 'Membuat transaksi baru..')
  try {
    const response = await api.post(`/${formKey.value}/new-transaction`, {})
    const newTx = response.data
    await fetchQueue()
    await loadTransaction(newTx.id)
    setSyncStatus('success', 'Transaksi baru siap')
  } catch (err: any) {
    setSyncStatus('error', `Gagal membuat transaksi: ${err.message}`)
  }
}

// SIMPAN TRANSAKSI
const handleSaveTransaction = async () => {
  if (!activeHeaderId.value) return
  if (!confirm('Apakah Anda yakin ingin menyelesaikan dan menyimpan transaksi ini?')) return

  setSyncStatus('loading', 'Menyimpan final transaksi..')
  try {
    await api.post(`/${formKey.value}/save-transaction`, {}, { params: { id: activeHeaderId.value } })
    setSyncStatus('success', 'Transaksi berhasil disimpan!')

    await fetchQueue()

    if (queueData.value.length > 0) {
      await loadTransaction(queueData.value[0].id)
    } else {
      await handleNewTransaction()
    }
  } catch (err: any) {
    setSyncStatus('error', `Gagal menyimpan transaksi: ${err.message}`)
  }
}

// BATALKAN TRANSAKSI
const handleCancelTransaction = async () => {
  if (!activeHeaderId.value) return
  if (!confirm('Apakah Anda yakin ingin membatalkan transaksi draft ini? (Data akan dihapus)')) return

  setSyncStatus('loading', 'Membatalkan transaksi..')
  try {
    await api.post(`/${formKey.value}/cancel-transaction`, {}, { params: { id: activeHeaderId.value } })
    setSyncStatus('success', 'Transaksi dibatalkan')

    await fetchQueue()

    if (queueData.value.length > 0) {
      await loadTransaction(queueData.value[0].id)
    } else {
      await handleNewTransaction()
    }
  } catch (err: any) {
    setSyncStatus('error', `Gagal membatalkan transaksi: ${err.message}`)
  }
}

// CUSTOM ACTIONS (Printer, Payment dll)
const triggerCustomAction = (actionKey: string) => {
  if (actionKey === 'print') {
    window.print()
  } else {
    console.log(`Trigger action: ${actionKey} untuk transaksi ID: ${activeHeaderId.value}`)
  }
}

onBeforeUnmount(() => {
  if (statusResetTimeout) clearTimeout(statusResetTimeout)
  if (apiLoadingTimeout) clearTimeout(apiLoadingTimeout)
  rows.value = []
  columns.value = []
})

watch(() => props.schemaData, loadComponentData)

onMounted(() => {
  loadComponentData()
})
</script>
<style scoped>
:deep(revo-grid) {
  z-index: 10 !important;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>