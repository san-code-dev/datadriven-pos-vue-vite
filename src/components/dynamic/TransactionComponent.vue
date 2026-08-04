<template>
  <div class="flex h-full max-h-full overflow-hidden min-h-0 w-full text-slate-800 dark:text-slate-100">
    <div class="flex-1 flex flex-col h-full overflow-hidden min-h-0 relative">
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
            <input ref="searchInputRef" v-model="detailSearchQuery" type="text" @keydown="handleSearchKeydown"
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

      <div class="flex flex-1 flex-col min-h-0 overflow-hidden relative w-full">

        <div class="flex-1 min-h-0 w-full relative group overflow-hidden z-10">
          <RevoGrid hide-attribution ref="gridRef" class="w-full h-full max-h-full focus:outline-none"
            :columns="columns" :source="rows" :theme="isDark ? 'darkCompact' : 'compact'" :resize="true"
            :auto-size-column="true" @beforeeditstart="beforeEditStart" @afteredit="afterEdit" @beforeedit="beforeEdit"
            @keydown="handleKeyDown" :column-types="columnTypes" />
          <GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns" />
        </div>

        <!-- TABS ANTREAN (DRAFTS) -->
        <div class="flex items-center gap-1 dark:border-slate-800 shrink-0 overflow-hidden px-2 flex-wrap">
          <button class="flex text-xs font-extralight px-3 gap-1 py-1.5 items-center text-slate-500">
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
          <div v-if="headerForm"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 items-center">

            <div v-for="field in headerSchema" :key="field.key" :data-key="field.key" class="flex flex-col space-y-1"
              :class="{ 'hidden': field.isHidden }">
              <label
                class="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase truncate">
                {{ field.label }}
              </label>

              <div v-if="field.readonly" :class="[
                'px-2 py-1 text-xs rounded border border-transparent bg-slate-50 dark:bg-slate-800/50 font-medium truncate',
                field.highlight ? 'text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50/50 dark:bg-emerald-950/30' : 'text-slate-700 dark:text-slate-200'
              ]">
                <template v-if="field.type === 'currency'">
                  {{ numberFormat.formatCurrency(headerForm[field.key]) }}
                </template>
                <template v-else>
                  {{ headerForm[field.key] || '-' }}
                </template>
              </div>

              <div v-else-if="field.type === 'relation' && field.relation" class="relative">
                <input type="text"
                  :value="getRelationDisplayLabel(field, headerForm[field.key]) || headerSearchQuery[field.key]"
                  @input="e => headerSearchQuery[field.key] = (e.target as HTMLInputElement).value"
                  :placeholder="`Pilih...`" @keydown.enter.prevent="searchRelationHeaderData(field)"
                  class="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all pr-6" />
                <Icon icon="mdi:magnify"
                  class="w-3.5 h-3.5 absolute right-2 top-1.5 text-slate-400 cursor-pointer hover:text-emerald-500"
                  @click="searchRelationHeaderData(field)" />
              </div>

              <input v-else
                :type="field.type === 'date' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text'" :value="field.type === 'date'
                  ? toLocalDatetimeLocal(headerForm[field.key])
                  : headerForm[field.key]" @input="e => {
                    const target = e.target as HTMLInputElement;
                    if (field.type === 'date') {
                      headerForm[field.key] = target.value ? new Date(target.value).toISOString() : null;
                    } else {
                      headerForm[field.key] = target.value;
                    }
                  }" @change="updateHeaderData()"
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
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ rows.length }}</span>
            <span>items</span>
          </div>
          <SyncStatus ref="syncStatusRef" />
        </div>
        <div class="flex items-center gap-2">
          <button v-for="action in (moduleSchema.actions || [])" :key="action.key"
            @click="triggerCustomAction(action.key)" class="btn-action-slate">
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
    </div>
  </div>
  <SelectDialog :schema-data-entity="searchDataSchema" :is-open="isSelectDialogOpen" @close="closeSelectDialog"
    @select="selectDialogSelectData" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'
import SyncStatus from '../SyncStatus.vue'
import { io } from 'socket.io-client'
import api from '@/lib/axios'
import { useNumberFormat } from '@/composables/number-format.ts'
import { useSettingsStore } from '@/stores/setting.ts'
import { useRealtimeSync } from '@/composables/useRealtimeSync'
import { getActiveCellState, gridFocus } from '@/composables/grid.ts'

import NumberColumnType from '@revolist/revogrid-column-numeral'
import DateTypePlugin from '@revolist/revogrid-column-date'
import SelectDialog from '../SelectDialog.vue'

const props = defineProps({
  menu: { type: Object, required: true },
  schemaData: { type: Object, required: true }
})

const numberFormat = useNumberFormat()
const { toLocalDatetimeLocal } = useNumberFormat()
const gridRef = ref<any>(null)
const searchDataSchema = ref<any>(null)

const isSelectDialogOpen = ref(false)
const queueData = ref<any[]>([])

const activeHeaderId = ref<number | null>(null)
const headerForm = ref<any>([])
const rows = ref<any[]>([])

const moduleSchema = ref<any>(props.schemaData || {})
const headerSchema = computed(() => moduleSchema.value.header?.schema || [])
const detailsSchema = computed(() => moduleSchema.value.details?.schema || [])

const activeRelationContext = ref<{ type: 'header' | 'detail'; fieldKey: string; rowIndex?: number } | null>(null)

const columns = ref<any[]>([])
const primaryKeyFieldName = ref('id')
const permission = ref<Record<string, boolean | undefined>>({})

const showSearchModal = ref(false)
const headerSearchQuery = ref<Record<string, string>>({})
const detailSearchQuery = ref<Record<string, string>>({})
const searchInputRef = ref<HTMLInputElement | null>(null)
const syncStatusRef = ref<InstanceType<typeof SyncStatus> | null>(null)

const setSyncStatus = (state: any, message: string) => {
  syncStatusRef.value?.setStatus(state, message)
}

const relationOptions = ref<{ [entityName: string]: Array<{ value: any; label: string }> }>({})
const formKey = computed(() => props.menu.key.toLowerCase())

const applyResponseData = (resData: any) => {
  if (!resData) return
  if (resData.queue?.data) {
    queueData.value = resData.queue.data
  }

  if (resData.header) {
    moduleSchema.value.header = resData.header
    headerForm.value = resData.header.data ? { ...resData.header.data } : null
    if (headerForm.value?.id) {
      activeHeaderId.value = headerForm.value.id
    }
  }

  if (resData.details) {
    moduleSchema.value.details = resData.details
    rows.value = resData.details.data || []
  }
}

const getRelationDisplayLabel = (field: any, val: any) => {
  if (!val) return ''
  const entity = field.relation?.entity
  const opts = relationOptions.value[entity] || []
  const found = opts.find((o) => o.value === val)
  return found ? found.label : val
}

const searchRelationHeaderData = async (field: any) => {
  const keyword = headerSearchQuery.value[field.key] || ''
  activeRelationContext.value = { type: 'header', fieldKey: field.key }

  try {
    const response = await api.get(`${field.relation.entity}/search-data`, {
      params: { keyword }
    })

    const resultData = response.data?.data || response.data || []

    if (resultData.length === 1) {
      selectDialogSelectData(resultData[0])
    } else {
      searchDataSchema.value = response.data
      isSelectDialogOpen.value = true
    }
  } catch (err: any) {
    setSyncStatus('error', `Gagal mencari data: ${err.message}`)
  }
}

const selectDialogSelectData = async (selectedRow: any) => {
  if (activeRelationContext.value?.type === 'header') {
    const key = activeRelationContext.value.fieldKey
    headerForm.value[key] = selectedRow.id || selectedRow.value
    await updateHeaderData()
  }
  closeSelectDialog()
}

const closeSelectDialog = () => {
  isSelectDialogOpen.value = false
  activeRelationContext.value = null
  gridFocus(gridRef)
}

const columnTypes = {
  numeric: new NumberColumnType('0,0'),
  decimal: new NumberColumnType('0,0'),
  date: new DateTypePlugin()
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

const loadComponentData = async () => {
  const res = props.schemaData
  if (!res) return

  moduleSchema.value = res

  columns.value = (detailsSchema.value || []).map((field: any) => {
    const columnConfig: Record<string, any> = {
      prop: field.key,
      name: field.label,
      size: field.size || 150,
      readonly: field.readonly || false,
      required: field.required || false,
      _type: field.type || 'text',
      _primary: field.primary || false
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
    return columnConfig
  })

  primaryKeyFieldName.value = (detailsSchema.value || []).find((f: any) => f.primary)?.key || 'id'
  permission.value = res.permissions || {}
  queueData.value = res.queue.data

  if (queueData.value.length > 0 && !activeHeaderId.value) {
    applyResponseData(res)
  }
}

const updateHeaderData = async () => {
  if (!activeHeaderId.value || !headerForm.value) return

  setSyncStatus('loading', 'Menyimpan perubahan header..')
  try {
    await api.put(`/${formKey.value}/update-header`, headerForm.value, {
      params: { id: activeHeaderId.value }
    })
    setSyncStatus('success', 'Header disimpan')
  } catch (err: any) {
    setSyncStatus('error', `Gagal update header: ${err.message}`)
  }
}

const beforeEditStart = (event: any) => {
  if (!event.detail) return;
  if (event.detail.column._type === "relation") {
    console.log('ini adalah relation..')
  }
}

const beforeEdit = (event: any) => {
  const { val, prop } = event.detail
  const originalField = detailsSchema.value.find((f: any) => f.key === prop)
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

  if (e.key === 'F2') {
    handleNewTransaction()
    e.preventDefault()
    return
  }

  if (e.key === 'F4') {
    openSearchItemsDialog('')
    e.preventDefault()
    return
  }

  if (e.key === 'F9') {
    handleSaveTransaction()
    e.preventDefault()
    return
  }

  if (e.key === 'Delete') {
    handleDeleteDetailRow()
    e.preventDefault()
    return
  }

  const { column } = await getActiveCellState(gridRef)
  if (column?._primary && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    openSearchItemsDialog(e.key)
    e.preventDefault()
  }
}

const handleSearchKeydown = (event: any) => {
  if (event.key == 'Escape') {
    closeSearchModal()
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
  gridFocus(gridRef)
}

const handleDeleteDetailRow = async () => {
  if (!activeHeaderId.value) return

  const { y: targetIndex } = await getActiveCellState(gridRef)
  const selectedData = rows.value[targetIndex]
  const detailId = selectedData?.[primaryKeyFieldName.value]
  if (!detailId) return

  if (confirm(`Hapus item belanja: ${selectedData?.name || selectedData?.nmProduct || 'barang ini'}?`)) {
    setSyncStatus('loading', 'Menghapus item..')
    try {
      const response = await api.delete(`/${formKey.value}/delete-details`, {
        params: {
          headerId: activeHeaderId.value,
          id: detailId
        }
      })

      if (response.status === 200) {
        setSyncStatus('success', 'Item belanja dihapus')
      }
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
    console.log(`Trigger action: ${actionKey} untuk transaksi ID: ${activeHeaderId.value}`)
  }
}

watch(() => props.schemaData, loadComponentData)

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
    detailSearchQuery.value += e.key
    openSearchItemsDialog(detailSearchQuery.value)
  }
}

useRealtimeSync(formKey, applyResponseData, gridRef)
onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown, true)
  loadComponentData()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown, true)
  rows.value = []
  columns.value = []
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