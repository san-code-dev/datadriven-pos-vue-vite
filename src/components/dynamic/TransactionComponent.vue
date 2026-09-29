<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import type { ColumnRegular } from '@revolist/revogrid'
import GridNavigator from '@/components/GridNavigator.vue'
import SyncStatus from '../SyncStatus.vue'
import api from '@/lib/axios'
import { useTabStore } from '@/stores/tabs'
import { useNumberFormat } from '@/composables/number-format.ts'
import { useRealtimeSync } from '@/composables/useRealtimeSync'
import { useRouter } from 'vue-router'
import { getActiveCellState } from '@/composables/grid.ts'

import NumberColumnType from '@revolist/revogrid-column-numeral'
import DateTypePlugin from '@revolist/revogrid-column-date'
import SelectDialog from '../SelectDialog.vue'

import type { TransactionSchemaState } from '@/types/workflow/transaction.ts'

// ==========================================
// 1. PROPS
// ==========================================
const props = defineProps({
  menu: { type: Object, required: true },
  schemaData: { type: Object as () => TransactionSchemaState, required: true }
})

// ==========================================
// 2. REFS & COMPOSABLES
// ==========================================
const numberFormat = useNumberFormat()
const { toLocalDatetimeLocal } = useNumberFormat()
const tabStore = useTabStore()
const router = useRouter()

const gridRef = ref<any>(null)
const navigatorRef = ref<any>(null)
const syncStatusRef = ref<InstanceType<typeof SyncStatus> | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

const schema = ref<TransactionSchemaState>(props.schemaData)
const currentGridKey = computed(() => `${useTenantStore().selectedTenant?.code}-${formKey.value}-details_transaction_grid`)

const selectDialogDataSchema = ref<any>(null)
const selectDialogRelationInfo = ref<any>(null)
const selectDialogEventDetail = ref<any>(null)
const selectDialogContext = ref<'relation-header' | 'relation-detail' | null>(null)

const isSelectDialogOpen = ref(false)
const showSearchModal = ref(false)

const detailSearchQuery = ref<string>('')
const activeFieldControllers = ref<Record<string, AbortController>>({})

const columnTypes = {
  numeric: new NumberColumnType('0,0'),
  decimal: new NumberColumnType('0,0'),
  date: new DateTypePlugin()
}

// ==========================================
// 3. COMPUTED PROPERTIES
// ==========================================
const formKey = computed(() => (schema.value?.key || '').toLowerCase())

const headerSchema = computed(() => schema.value?.header?.schema || [])
const detailsSchema = computed(() => schema.value?.details?.schema || [])

// 🔹 Filter Header Schema: Hanya ambil field yang TIDAK hidden
const visibleHeaderSchema = computed(() =>
  headerSchema.value.filter((field) => !field.isHidden)
)

const permission = computed(() => schema.value?.permissions || {})

const headerData = computed(() => schema.value?.header?.data ?? null)
const detailsData = computed(() => schema.value?.details?.data ?? [])
const queueData = computed(() => schema.value?.queue?.data ?? [])
const activeHeaderId = computed(() => headerData.value?.id ?? null)

const primaryKeyFieldName = computed(
  () => detailsSchema.value.find((f) => f.primary)?.key || undefined
)

const currentGridConfig = computed(() => {
  const activeTabId = tabStore.activeTabId
  if (!activeTabId) return null

  return tabStore.getGridConfig(activeTabId, currentGridKey.value)
})

const saveCurrentStateToStore = async (event: any) => {
  const detail = event?.detail
  if (!detail) return

  const existingConfig = currentGridConfig.value || {
    coordinate: { x: 0, y: 0 },
    column: columns.value.map(col => ({ key: col.prop, size: col.size }))
  }

  let updatedCoordinate = { ...existingConfig.coordinate }
  let updatedColumns = [...columns.value]

  // 1. Tangani event 'afterfocus'
  if ('rowIndex' in detail && 'colIndex' in detail) {
    updatedCoordinate = {
      x: detail.colIndex,
      y: detail.rowIndex
    }
  }

  // 2. Tangani event 'aftercolumnresize'
  const resizedKeys = Object.keys(detail)
  const isResizeEvent = resizedKeys.some(key => !isNaN(Number(key)) && detail[key]?.prop)

  if (isResizeEvent) {
    updatedColumns = columns.value.map(col => {
      for (const key of resizedKeys) {
        const resizedCol = detail[key]
        if (resizedCol && resizedCol.prop === col.prop) {
          return { ...col, size: resizedCol.size }
        }
      }
      return col
    })
  }

  // Simpan otomatis ke Pinia Store
  tabStore.updateGridConfig(tabStore.activeTabId, currentGridKey.value, {
    coordinate: updatedCoordinate,
    column: updatedColumns.map(col => ({ key: col.prop, size: col.size }))
  })
}

// 🔹 Filter Details Schema: Hanya petakan kolom yang TIDAK hidden
const columns = computed(() => {
  const savedColumnsConfig = currentGridConfig.value?.column || []

  return detailsSchema.value
    .filter((field) => !field.isHidden) // <--- Array Filter untuk membuang field hidden di tabel
    .map((field) => {
      const savedCol = savedColumnsConfig.find((c: any) => c.key === field.key)

      const columnConfig: ColumnRegular & Record<string, any> = {
        prop: field.key,
        name: field.label,
        size: savedCol ? savedCol.size : (field.size || 150),
        readonly: field.readonly || false,
        required: field.validation?.required || false,
        _type: field.type || 'text',
        _primary: field.primary || false
      }

      if (['number', 'integer'].includes(field.type)) columnConfig.columnType = 'numeric'
      else if (['decimal', 'currency'].includes(field.type)) columnConfig.columnType = 'decimal'
      else if (field.type === 'date') {
        columnConfig.columnType = 'date'
        columnConfig.appendTo = 'body'
      }
      else if (field.type === 'select') {
        columnConfig.columnType = 'select'
        columnConfig.labelKey = 'label'
        columnConfig.valueKey = 'value'
        columnConfig.appendTo = 'body'
        columnConfig.source = field.options || []
        columnConfig.editorProperties = { appendToBody: true }
      }
      return columnConfig
    })
})

// ==========================================
// 4. METHODS (API, EVENT HANDLERS, UTILITIES)
// ==========================================
const setSyncStatus = (state: any, message: string) => {
  syncStatusRef.value?.setStatus(state, message)
}

const applyResponseData = (socketIoData: any) => {
  if (!socketIoData || !schema.value) return

  const payload = socketIoData.data || socketIoData

  if (payload.queue?.data) {
    schema.value.queue.data = payload.queue.data
  }

  if (payload.header) {
    schema.value.header = payload.header
  }

  if (payload.details) {
    schema.value.details = payload.details
  }
}

const loadComponentData = () => {
  if (!props.schemaData) return
  schema.value = props.schemaData
}

const loadTransaction = async (id: number) => {
  setSyncStatus('loading', 'Memuat dokumen transaksi..')
  try {
    await api.get(`/${formKey.value}/get-transaction`, { params: { id } })
    await nextTick()
    setSyncStatus('success', 'Transaksi dimuat')
  } catch (err: any) {
    setSyncStatus('error', `Gagal memuat transaksi: ${err.message}`)
  }
}

const updateHeaderData = async (fieldKey?: string, value?: any) => {
  if (!activeHeaderId.value || !fieldKey) {
    console.error('[updateHeaderData] No transaksi kosong atau field transaksi tidak ditentukan, pembaruan header dibatalkan.')
    setSyncStatus('error', 'gagal memperbarui transaksi')
    return
  }

  if (activeFieldControllers.value[fieldKey]) {
    activeFieldControllers.value[fieldKey].abort()
  }

  const controller = new AbortController()
  activeFieldControllers.value[fieldKey] = controller

  const payload = {
    id: activeHeaderId.value,
    [fieldKey]: value
  }

  setSyncStatus('loading', 'Menyimpan perubahan header..')
  try {
    await api.put(`/${formKey.value}/update-header`, payload, {
      signal: controller.signal
    })

    setSyncStatus('success', 'Header disimpan')
  } catch (err: any) {
    if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
      return
    }

    setSyncStatus('error', `Gagal update header: ${err.response?.data?.message || err.message}`)
  } finally {
    if (activeFieldControllers.value[fieldKey] === controller) {
      delete activeFieldControllers.value[fieldKey]
    }
  }
}

const beforeEdit = (event: any) => {
  const { val, prop } = event.detail
  const originalField = detailsSchema.value.find((f) => f.key === prop)
  if (!originalField) return

  const columnLabel = originalField.label || prop
  const fieldType = originalField.type
  const isRequired = originalField.validation?.required || false

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

const afterEdit = async (event: any) => {
  if (event.detail.oldValue === event.detail.value) return

  const updatedModel = event.detail.model
  const detailId = updatedModel[primaryKeyFieldName.value]
  if (!detailId || !activeHeaderId.value) return

  setSyncStatus('loading', 'Memperbarui baris belanja..')
  try {
    const response = await api.put(`/${formKey.value}/update-details`, {
      ...updatedModel,
      headerId: activeHeaderId.value,
      id: detailId
    })

    if (response.status === 200) {
      setSyncStatus('success', 'Perubahan barang disimpan')
    }
  } catch (err: any) {
    setSyncStatus('error', `Gagal merubah baris belanja: ${err.message}`)
  }
}

const handleKeyDown = async (e: KeyboardEvent) => {
  if (e.repeat) return

  if (e.key === 'F2') { handleNewTransaction(); e.preventDefault(); return }
  if (e.key === 'F4') { openSearchItemsDialog(''); e.preventDefault(); return }
  if (e.key === 'F9') { handleSaveTransaction(); e.preventDefault(); return }
  if (e.key === 'Delete') { handleDeleteDetailRow(); e.preventDefault(); return }

  const { column } = await getActiveCellState(gridRef)
  if (column?._primary && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    openSearchItemsDialog(e.key)
    e.preventDefault()
  }
}

const openSearchItemsDialog = async (char: string) => {
  detailSearchQuery.value = char
  showSearchModal.value = true
  await nextTick()
  searchInputRef.value?.focus()
}

const handleSearchSubmit = async () => {
  const query = detailSearchQuery.value
  if (!query || !activeHeaderId.value) return

  setSyncStatus('loading', 'Menambahkan barang..')
  try {
    const response = await api.post(`/${formKey.value}/add-details`, {
      headerId: activeHeaderId.value,
      query
    })
    if (response.status === 201 || response.status === 200) {
      setSyncStatus('success', 'Barang berhasil ditambahkan')
    }
  } catch (err: any) {
    setSyncStatus('error', `Gagal menambah barang: ${err.response?.data?.message || err.message}`)
  }
  closeSearchModal()
}

const closeSearchModal = async () => {
  showSearchModal.value = false
  detailSearchQuery.value = ''
  focusBackToGrid()
}

const handleDeleteDetailRow = async () => {
  if (!activeHeaderId.value) return

  const { y: targetIndex } = await getActiveCellState(gridRef)
  const selectedData = detailsData.value[targetIndex]
  const detailId = selectedData?.[primaryKeyFieldName.value]
  if (!detailId) return

  if (confirm(`Hapus item belanja: ${selectedData?.name || selectedData?.nmProduct || 'barang ini'}?`)) {
    setSyncStatus('loading', 'Menghapus item..')
    try {
      const response = await api.delete(`/${formKey.value}/delete-details`, {
        params: { headerId: activeHeaderId.value, id: detailId }
      })
      if (response.status === 200) setSyncStatus('success', 'Item belanja dihapus')
    } catch (err: any) {
      setSyncStatus('error', `Gagal menghapus item: ${err.message}`)
    }
  }
}

const handleNewTransaction = async () => {
  setSyncStatus('loading', 'Membuat transaksi baru..')
  try {
    await api.post(`/${formKey.value}/new-transaction`, {})
    setSyncStatus('success', 'Transaksi baru siap')
  } catch (err: any) {
    setSyncStatus('error', `Gagal membuat transaksi: ${err.message}`)
  }
}

const handleSaveTransaction = async () => {
  if (!activeHeaderId.value) return
  if (!confirm('Apakah Anda yakin ingin menyelesaikan dan menyimpan transaksi ini?')) return

  setSyncStatus('loading', 'Menyimpan final transaksi..')
  try {
    await api.post(`/${formKey.value}/save-transaction`, {}, { params: { id: activeHeaderId.value } })
    setSyncStatus('success', 'Transaksi berhasil disimpan!')
  } catch (err: any) {
    setSyncStatus('error', `Gagal menyimpan transaksi: ${err.message}`)
  }
}

const handleCancelTransaction = async () => {
  if (!activeHeaderId.value) return
  if (!confirm('Apakah Anda yakin ingin membatalkan transaksi draft ini? (Data akan dihapus)')) return

  setSyncStatus('loading', 'Membatalkan transaksi..')
  try {
    await api.post(`/${formKey.value}/cancel-transaction`, { id: activeHeaderId.value })
    setSyncStatus('success', 'Transaksi dibatalkan')
  } catch (err: any) {
    setSyncStatus('error', `Gagal membatalkan transaksi: ${err.message}`)
  }
}

const triggerCustomAction = (actionKey: string) => {
  if (actionKey === 'print') {
    window.print()
  } else {
    console.log(`[Action] Trigger action: ${actionKey} untuk transaksi ID: ${activeHeaderId.value}`)
  }
}

const handleGlobalKeyDown = (e: any) => {
  const target = e.target
  if (
    target.tagName === 'DIV' ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    isSelectDialogOpen.value
  ) {
    return
  }
  if (e.ctrlKey || e.altKey || e.metaKey) return

  const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key)
  if (isAlphanumeric) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    detailSearchQuery.value = detailSearchQuery.value + e.key
    openSearchItemsDialog(detailSearchQuery.value)
  }
}

const clearGridFocus = () => {
  try {
    const gridEl = gridRef.value?.$el
    if (gridEl) {
      if (typeof gridEl.clearFocus === 'function') {
        gridEl.clearFocus()
      }
      if (typeof gridEl.blur === 'function') {
        gridEl.blur()
      }
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  } catch (err) {
    console.warn('[Grid] Error clearing focus during unmount:', err)
  }
}

async function handleOpenSelectDialog({ keyword, context, eventDetail, relationInfo, }: { keyword?: string, eventDetail?: any, context?: 'relation-header' | 'relation-detail', relationInfo: any }) {
  try {
    const targetEntity = relationInfo.entity
    const response = await api.get(`/${targetEntity}/search-data`, {
      params: { keyword }
    })

    selectDialogContext.value = context
    selectDialogEventDetail.value = eventDetail
    selectDialogRelationInfo.value = relationInfo
    selectDialogDataSchema.value = response.data
    clearGridFocus()
    isSelectDialogOpen.value = true

  } catch (err) {
    console.error('[Api][handleOpenSelectDialogFilter] Gagal mencari data:', err)
  }
}

const handleSelectDialogDataSelected = async (selectedData: any, context: any, relationInfo: any, eventDetail: any) => {
  if (!selectedData || !relationInfo || !context) {
    console.error('[handleSelectDialogDataSelected] Tidak ada data yang dipilih atau relation tidak ditentukan.')
    return
  }
  if (context === 'relation-header') {
    await updateHeaderData(relationInfo.entityKeySetTo, selectedData[relationInfo.entityKey])
  }
  handleSelectDialogClosed()
}

const handleSelectDialogClosed = () => {
  isSelectDialogOpen.value = false
  focusBackToGrid()
}

async function focusBackToGrid() {
  await nextTick()
  const grid = gridRef?.value?.$el
  await grid?.focus()

  const startCoord = currentGridConfig.value?.coordinate || { x: 0, y: 0 }
  await grid?.scrollToCoordinate(startCoord)
  grid?.setCellsFocus(startCoord, startCoord)
}

const handleInputChange = (e: Event, field: any) => {
  const target = e.target as HTMLInputElement;

  const relationInfo = {
    entity: field.entity,
    entityKey: field.entityKey,
    entityKeySetTo: field.entityKeySetTo,
    fieldsToShow: field.fieldsToShow
  };

  handleOpenSelectDialog({
    keyword: target.value,
    context: 'relation-header',
    eventDetail: e,
    relationInfo
  });
};

// ==========================================
// 5. WATCHERS & LIFECYCLE HOOKS
// ==========================================
watch(() => props.schemaData, async () => {
  loadComponentData()
  await nextTick()
  focusBackToGrid()
})

useRealtimeSync(formKey, applyResponseData, gridRef)

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeyDown, true)
  loadComponentData()
  await nextTick()
  focusBackToGrid()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown, true)
})
</script>

<template>
  <div
    class="flex flex-col h-full max-h-full overflow-hidden w-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">

    <!-- TABS ANTREAN (DRAFTS) & HISTORY -->
    <header
      class="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 shrink-0 z-20">

      <!-- List Tab Antrean -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-0.5">
        <button v-if="schemaData.masterKey" @click="router.push(schemaData.masterKey)"
          class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400"
          title="Lihat Riwayat Transaksi">
          <Icon icon="mdi:history" class="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Riwayat</span>
        </button>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0"></div>

        <button v-for="item in queueData" :key="item.id" @click="loadTransaction(item.id)" :class="[
          'px-3 py-1.5 text-xs font-medium flex items-center gap-2 rounded-lg transition-all whitespace-nowrap shrink-0 group border',
          activeHeaderId === item.id
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 shadow-sm'
            : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
        ]">
          <span class="w-2 h-2 rounded-full transition-all"
            :class="activeHeaderId === item.id ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400'"></span>
          <span>{{ item.label || `Draft #${item.id}` }}</span>
        </button>

        <button @click="handleNewTransaction"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border border-dashed border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shrink-0 ml-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title="Tambah Antrean Baru (F2)">
          <Icon icon="mdi:plus" class="w-4 h-4" />
          <span>Baru <kbd class="text-[10px] opacity-70 font-mono">[F2]</kbd></span>
        </button>
      </div>

    </header>

    <!-- KONTEN UTAMA: KIRI (FORM, TABEL, FOOTER INPUT) + KANAN (PANEL TOMBOL AKSI) -->
    <div class="flex flex-1 min-h-0 w-full overflow-hidden">

      <!-- AREA KIRI -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        <!-- FORM HEADER TRANSAKSI (Field non-bottom) -->
        <section
          class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-sm shrink-0 z-10">
          <div v-if="headerData" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
            <div v-for="field in visibleHeaderSchema.filter(f => !f.isBottom)" :key="field.key" :data-key="field.key"
              class="flex flex-col gap-1">
              <label
                class="text-[11px] font-medium tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate flex items-center gap-1">
                <span>{{ field.label }}</span>
              </label>

              <!-- Readonly Field -->
              <div v-if="field.readonly" :class="[
                'px-2.5 py-1.5 text-xs rounded-md border transition-all truncate flex items-center min-h-[30px]',
                field.highlight
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-medium'
              ]">
                <template v-if="field.type === 'currency'">
                  {{ numberFormat.formatCurrency(headerData[field.key]) }}
                </template>
                <template v-else>
                  {{ headerData[field.key] || '-' }}
                </template>
              </div>

              <!-- Relation / Search Selector -->
              <div v-else-if="field.type === 'relation'" class="relative flex items-center">
                <input type="text" :value="headerData[field.key]" placeholder="Pilih data..."
                  @keydown.enter.prevent="handleInputChange($event, field)" @change="handleInputChange($event, field)"
                  class="w-full pl-2.5 pr-8 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                <button type="button" @click="handleInputChange($event, field)"
                  class="absolute right-0.5 m-0.5 p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Icon icon="mdi:magnify" class="w-3 h-3" />
                </button>
              </div>

              <!-- General Input (Text, Date, Number) -->
              <input v-else
                :type="field.type === 'date' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text'"
                :value="field.type === 'date' ? toLocalDatetimeLocal(headerData[field.key]) : headerData[field.key]"
                @input="e => {
                  const target = e.target as HTMLInputElement;
                  const val = field.type === 'date'
                    ? (target.value ? new Date(target.value).toISOString() : null)
                    : target.value;
                  headerData[field.key] = val;
                }" @change="e => {
                  const target = e.target as HTMLInputElement;
                  const val = field.type === 'date'
                    ? (target.value ? new Date(target.value).toISOString() : null)
                    : target.value;
                  updateHeaderData(field.key, val);
                }"
                class="dark:[color-scheme:dark] px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
            </div>
          </div>
        </section>

        <!-- AREA GRID / TABEL ITEMS -->
        <main class="flex-1 min-h-0 w-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 p-3 gap-2.5">

          <!-- BARIS PENCARIAN & SUMBER TRANSAKSI -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">

            <!-- Input Cari Barang -->
            <div class="relative">
              <Icon icon="mdi:magnify" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Cari barang atau scan barcode..."
                class="w-72 pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
            </div>

            <!-- Group Ambil Dari Transaksi Lain -->
            <div class="flex items-center gap-2">
              <div class="relative flex items-center">
                <select
                  class="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all cursor-pointer">
                  <option value="pembelian">Ambil dari</option>
                  <option value="pembelian">Pembelian</option>
                  <option value="pesanan">Pesanan (SO)</option>
                  <option value="pengiriman">Pengiriman (DO)</option>
                </select>
                <Icon icon="mdi:chevron-down" class="w-4 h-4 absolute right-2 pointer-events-none text-slate-400" />
              </div>
            </div>

          </div>

          <!-- CONTAINER TABLE (RevoGrid) -->
          <div
            class="flex-1 min-h-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden relative">
            <RevoGrid hide-attribution ref="gridRef" class="w-full h-full focus:outline-none" :columns="columns"
              :source="detailsData" :theme="isDark ? 'darkCompact' : 'compact'" :resize="true" :auto-size-column="true"
              @afteredit="afterEdit" @beforeedit="beforeEdit" @keydown="handleKeyDown"
              @afterfocus="saveCurrentStateToStore" @aftercolumnresize="saveCurrentStateToStore"
              :column-types="columnTypes" />
            <GridNavigator ref="navigatorRef" :grid="gridRef" :rows="detailsData" :columns="columns" />
          </div>

        </main>
        <!-- AREA FIELD FOOTER (isBottom = true) -->
        <section
          class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-sm shrink-0 z-10 w-full">

          <div class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span class="font-bold text-slate-800 dark:text-slate-200">{{ detailsData.length }}</span> Items
            <SyncStatus ref="syncStatusRef" />
          </div>

          <div v-if="headerData" class="flex flex-wrap pb-12 items-end justify-end gap-3">
            <div v-for="field in visibleHeaderSchema.filter(f => f.isBottom)" :key="field.key" :data-key="field.key"
              class="flex flex-col gap-1 min-w-[160px]">

              <label
                class="text-[11px] font-medium tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate flex items-center gap-1">
                <span>{{ field.label }}</span>
              </label>

              <!-- Readonly Field -->
              <div v-if="field.readonly" :class="[
                'px-2.5 py-1.5 text-xs rounded-md border transition-all truncate flex items-center min-h-[30px]',
                field.highlight
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-medium'
              ]">
                <template v-if="field.type === 'currency'">
                  {{ numberFormat.formatCurrency(headerData[field.key]) }}
                </template>
                <template v-else>
                  {{ headerData[field.key] || '-' }}
                </template>
              </div>

              <!-- Relation / Search Selector -->
              <div v-else-if="field.type === 'relation'" class="relative flex items-center">
                <input type="text" :value="headerData[field.key]" placeholder="Pilih data..."
                  @keydown.enter.prevent="handleInputChange($event, field)" @change="handleInputChange($event, field)"
                  class="w-full pl-2.5 pr-8 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
                <button type="button" @click="handleInputChange($event, field)"
                  class="absolute right-0 m-0.5 p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Icon icon="mdi:magnify" class="w-3 h-3" />
                </button>
              </div>

              <!-- General Input (Text, Date, Number) -->
              <input v-else
                :type="field.type === 'date' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text'"
                :value="field.type === 'date' ? toLocalDatetimeLocal(headerData[field.key]) : headerData[field.key]"
                @input="e => {
                  const target = e.target as HTMLInputElement;
                  const val = field.type === 'date'
                    ? (target.value ? new Date(target.value).toISOString() : null)
                    : target.value;
                  headerData[field.key] = val;
                }" @change="e => {
                  const target = e.target as HTMLInputElement;
                  const val = field.type === 'date'
                    ? (target.value ? new Date(target.value).toISOString() : null)
                    : target.value;
                  updateHeaderData(field.key, val);
                }"
                class="dark:[color-scheme:dark] px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
            </div>
          </div>
        </section>
      </div>

      <!-- AREA KANAN: PANEL TOMBOL AKSI -->
      <aside
        class="w-48 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between shrink-0 z-20">
        <div class="flex flex-col gap-2">
          <button v-for="action in (schema.actions || [])" :key="action.key" @click="triggerCustomAction(action.key)"
            class="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 flex items-center justify-center">
            {{ action.label }}
          </button>
        </div>

        <div class="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button @click="handleCancelTransaction" type="button"
            class="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400 flex items-center justify-center">
            Batal
          </button>

          <button @click="handleSaveTransaction" type="button"
            class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <Icon icon="mdi:content-save-outline" class="w-4 h-4 shrink-0" />
            <span>Simpan [F9]</span>
          </button>
        </div>
      </aside>

    </div>

    <!-- DIALOG SELEKSI -->
    <SelectDialog :schema-data="selectDialogDataSchema" :event-detail="selectDialogEventDetail"
      :relation-info="selectDialogRelationInfo" :context="selectDialogContext" :is-open="isSelectDialogOpen"
      @close="handleSelectDialogClosed" @select="handleSelectDialogDataSelected" />
  </div>
</template>
<style scoped>
:deep(revo-grid) {
  z-index: 10 !important;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>