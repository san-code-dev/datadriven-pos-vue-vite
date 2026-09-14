<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import type { ColumnRegular } from '@revolist/revogrid'
import GridNavigator from '@/components/GridNavigator.vue'
import SyncStatus from '../SyncStatus.vue'
import api from '@/lib/axios'
import { useTabStore } from '@/stores/tabs' // Pastikan sudah diimport
import { useNumberFormat } from '@/composables/number-format.ts'
import { useRealtimeSync } from '@/composables/useRealtimeSync'
import { useRouter } from 'vue-router'
import { getActiveCellState, gridFocus } from '@/composables/grid.ts'

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

const searchDataSchema = ref<any>(null)
const searchDataFieldKey = ref<string | null>(null)
const searchDataRelationKey = ref<string | null>(null)
const searchDataContext = ref<'header' | 'details' | 'history' | null>(null)

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

const columns = computed(() => {
  const savedColumnsConfig = currentGridConfig.value?.column || []

  return detailsSchema.value.map((field) => {
    const savedCol = savedColumnsConfig.find((c: any) => c.key === field.key)

    const columnConfig: ColumnRegular & Record<string, any> = {
      prop: field.key,
      name: field.label,
      size: savedCol ? savedCol.size : (field.size || 150), // Memuat ukuran dari Pinia jika ada
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

  // Ambil objek 'data' utama dari payload Socket.IO
  const payload = socketIoData.data || socketIoData
  console.log('[Realtime Sync] Processing payload:', payload)

  // Update data ke schema
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



async function cariDataRef(keyword, context, entity, fieldKey, relationKey) {
  try {
    const response = await api.get(`/${entity}/search-data`, { params: { keyword } })
    searchDataFieldKey.value = fieldKey
    searchDataRelationKey.value = relationKey
    searchDataContext.value = context
    searchDataSchema.value = response.data
    isSelectDialogOpen.value = true
    // console.log('[Api] Response for:', response.config.url, response.data)
  } catch (err) {
    console.error('[Api][cariDataRef] Gagal mencari data:', err)
  }
}


async function getTransactionHistory(keyword, context, entity, fieldKey, relationKey) {
  try {
    const response = await api.get(`/${entity}/get-history`, { params: { keyword } })
    searchDataFieldKey.value = fieldKey
    searchDataRelationKey.value = relationKey
    searchDataContext.value = context
    searchDataSchema.value = response.data
    isSelectDialogOpen.value = true
    // console.log('[Api] Response for:', response.config.url, response.data)
  } catch (err) {
    console.error('[Api][getTransactionHistory] Gagal mengambil riwayat transaksi:', err)
  }
}

const selectDialogSelectData = async (selectedRow: any, context: string, fieldKey: string, relationKey) => {
  if (!selectedRow || !relationKey || !context) {
    console.error('[selectDialogSelectData] Tidak ada data yang dipilih atau relation tidak ditentukan.', selectedRow, relationKey, fieldKey)
    return
  }
  if (context === 'header') {
    await updateHeaderData(fieldKey, selectedRow[relationKey])
  }

  if (context === 'history') {
    router.push('print')
  }
  closeSelectDialog()
}

const closeSelectDialog = () => {
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
  <div class="flex h-full max-h-full overflow-hidden min-h-0 w-full text-slate-800 dark:text-slate-100">
    <div class="flex-1 flex flex-col h-full overflow-hidden min-h-0 relative">


      <div class="flex flex-1 flex-col min-h-0 overflow-hidden relative w-full">

        <div class="flex-1 min-h-0 w-full relative group overflow-hidden z-10">
          <RevoGrid hide-attribution ref="gridRef" class="w-full h-full max-h-full focus:outline-none"
            :columns="columns" :source="detailsData" :theme="isDark ? 'darkCompact' : 'compact'" :resize="true"
            :auto-size-column="true" @afteredit="afterEdit" @beforeedit="beforeEdit" @keydown="handleKeyDown"
            @afterfocus="saveCurrentStateToStore" @aftercolumnresize="saveCurrentStateToStore"
            :column-types="columnTypes" />
          <GridNavigator ref="navigatorRef" :grid="gridRef" :rows="detailsData" :columns="columns" />


          <!-- MODAL PENCARIAN PRODUK -->
          <div v-if="showSearchModal" @click.self="closeSearchModal"
            class="absolute backdrop-blur-sm flex inset-0 items-center justify-center transition-all z-50">
            <div
              class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-3 mx-4"
              @keydown.stop>
              <form @submit.prevent="handleSearchSubmit" class="flex items-center relative">
                <div class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                  <Icon icon="mdi:magnify" class="w-5 h-5" />
                </div>
                <input ref="searchInputRef" v-model="detailSearchQuery" type="text" @keydown.escape="closeSearchModal()"
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




        </div>

        <!-- TABS ANTREAN (DRAFTS) -->
        <div class="flex items-center gap-1 dark:border-slate-800 shrink-0 overflow-hidden px-2 flex-wrap">
          <button
            class="flex text-xs font-extralight px-2 gap-1 py-1 rounded-md items-center text-slate-500 dark:hover:bg-slate-800 hover:bg-slate-200"
            @click="getTransactionHistory(schema.prefix, 'history', schema.key, '', 'id')">
            <Icon icon="mdi:view-grid-outline" class="w-3.5 h-3.5" /> history
          </button>

          <button v-for="item in queueData" :key="item.id" @click="loadTransaction(item.id)" :class="[
            'px-4 py-2 text-xs font-medium flex items-center gap-2 whitespace-nowrap shrink-0 relative',
            activeHeaderId === item.id
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-t-xl shadow-sm z-10' +
              ' before:absolute before:bottom-0 before:-left-2.5 before:w-2.5 before:h-2.5 before:bg-transparent before:rounded-br-xl before:shadow-[4px_4px_0_4px_white] dark:before:shadow-[4px_4px_0_4px_rgb(30,41,59)]' +
              ' after:absolute after:bottom-0 after:-right-2.5 after:w-2.5 after:h-2.5 after:bg-transparent after:rounded-bl-xl after:shadow-[-4px_4px_0_4px_white] dark:after:shadow-[-4px_4px_0_4px_rgb(30,41,59)]'
              : 'bg-slate-100/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 rounded-lg'
          ]">

            <span class="w-1.5 h-1.5 rounded-full"
              :class="activeHeaderId === item.id ? 'bg-emerald-500' : 'bg-slate-400'"></span>
            <span>{{ item.label || `Draft #${item.id}` }}</span>

          </button>

          <button @click="handleNewTransaction"
            class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-center shrink-0 ml-1"
            title="Tambah Antrean Baru (F2)">
            <Icon icon="mdi:plus" class="w-4 h-4" />
          </button>
        </div>

        <!-- FORM HEADER -->
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 border-t-0 px-3 py-2 transition-colors outline-none focus:ring-1 focus:ring-emerald-500 select-none">
          <div v-if="headerData"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 items-center">

            <div v-for="field in headerSchema" :key="field.key" :data-key="field.key" class="flex flex-col space-y-1"
              :class="{ 'hidden': field.isHidden }">
              <label
                class="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase truncate">
                {{ field.label }}
              </label>

              <div v-if="field.readonly" :class="[
                'px-2 py-1 text-xs rounded border border-transparent bg-slate-50 dark:bg-slate-800/50 font-medium truncate',
                field.highlight ? 'text-emerald-600 dark:text-emerald-400 font-bold text-[16px]  bg-emerald-50/50 dark:bg-emerald-950/30' : 'text-slate-700 dark:text-slate-200'
              ]">
                <template v-if="field.type === 'currency'">
                  {{ numberFormat.formatCurrency(headerData[field.key]) }}
                </template>
                <template v-else>
                  {{ headerData[field.key] || '-' }}
                </template>
              </div>

              <div v-else-if="field.type === 'relation'" class="relative">
                <input type="text" :value="headerData[field.key]" :placeholder="`Pilih...`" @change="e => {
                  const target = e.target as HTMLInputElement;
                  cariDataRef(target.value, 'header', field.entity, field.key, field.relationKey)
                }"
                  class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all pr-6" />
                <Icon icon="mdi:magnify"
                  class="w-5 h-5 absolute right-1 rounded-md top-[3px] p-1 bg-emerald-200 dark:bg-slate-800 text-emerald-500 cursor-pointer hover:text-emerald-500"
                  @click="cariDataRef('', 'header', field.entity, field.key, field.relationKey)" />
              </div>

              <!-- Input teks, angka, atau tanggal -->
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
                class="dark:[color-scheme:dark] px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER SUMMARY & ACTIONS -->
      <div
        class="bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between px-4 py-2 transition-colors dark:bg-slate-900 dark:border-slate-800">
        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 select-none">
          <div class="flex items-center gap-1">
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ detailsData.length }}</span>
            <span>items</span>
          </div>
          <SyncStatus ref="syncStatusRef" />
        </div>
        <div class="flex items-center gap-2">
          <button v-for="action in (schema.actions || [])" :key="action.key" @click="triggerCustomAction(action.key)"
            class="btn-action-slate">
            <span>{{ action.label }}</span>
          </button>
          <button @click="handleSaveTransaction" type="button" class="btn-action-emerald-600">
            <span>Simpan Transaksi</span>
            <kbd class="btn-kbd">[F9]</kbd>
          </button>
          <button @click="handleCancelTransaction" type="button" class="btn-action text-rose-600 dark:text-rose-400">
            <span>Batal</span>
          </button>
        </div>
      </div>

      <SelectDialog :schema-data="searchDataSchema" :field-key="searchDataFieldKey"
        :relation-key="searchDataRelationKey" :context="searchDataContext" :is-open="isSelectDialogOpen"
        @close="closeSelectDialog" @select="selectDialogSelectData" />
    </div>
  </div>
</template>

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