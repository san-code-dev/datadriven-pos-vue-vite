<template>
  <div
    class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-slate-100 dark:bg-slate-900 w-full p-3 gap-3 font-sans select-none">

    <div
      class="flex bg-white dark:bg-slate-800 rounded-xl p-3 items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700/80 gap-4">
      <div class="flex items-center gap-3 flex-1 max-w-xl">
        <div
          :class="lastActiveGrid === 'header' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'"
          class="text-white p-2 rounded-lg shadow-sm transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5"
            stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
          </svg>
        </div>
        <input type="text"
          :placeholder="lastActiveGrid === 'header' ? 'Mode Antrian: Ketik untuk Cari Pelanggan & Bikin Antrian Baru...' : 'Mode Kasir: Ketik / Scan Barcode untuk Tambah Produk ke Keranjang...'"
          class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-4 py-2.5 rounded-lg focus:outline-none placeholder:text-slate-400 cursor-pointer font-medium"
          @click="openSearchWithChar('')" readonly />
      </div>

      <div class="flex items-center gap-2">
        <button @click="handleTambahAntrian(null)"
          class="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-xl active:scale-95 transition">
          + ANTRIAN BARU (F2)
        </button>

        <button v-for="action in actionButtons" :key="action.key" @click="handleActionTrigger(action)"
          :class="getActionClass(action.type)"
          class="px-4 py-2.5 text-xs font-bold text-white rounded-xl active:scale-95 transition">
          {{ action.label }}
        </button>
      </div>
    </div>

    <div class="flex flex-1 min-h-0 w-full gap-3 items-stretch">

      <div
        class="flex-[7] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden p-4 relative">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{{ detailLabel }}
          </h2>
          <span
            class="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md font-medium">
            Fokus di sini + <kbd class="font-bold text-red-500">DEL</kbd> = Hapus Barang
          </span>
        </div>

        <div v-if="!activeNotaId"
          class="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-20">
          <p class="text-slate-400 text-sm font-semibold">Pilih atau buat antrian kasir terlebih dahulu</p>
        </div>

        <div
          class="flex-1 min-h-0 relative rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
          <RevoGrid ref="gridRef" class="w-full h-full max-h-full focus:outline-none" :columns="detailColumns"
            :source="filteredDetailRows" :theme="isDark ? 'darkCompact' : 'compact'" resize="true"
            @afterfocus="afterFocus" />
          <GridNavigator ref="navigatorRef" :grid="gridRef" :rows="filteredDetailRows" :columns="detailColumns"
            :focused-coordinate="focusedCoordinate" />
        </div>
      </div>

      <div class="flex-[3] flex flex-col gap-3 min-h-0">

        <div v-for="hl in highlightConfig" :key="hl.key"
          class="bg-slate-900 text-emerald-400 dark:bg-slate-950 p-4 rounded-xl flex flex-col justify-between shadow-md border border-slate-800 min-h-[100px] flex-shrink-0">
          <div class="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{{ hl.label }}</div>

          <div class="text-2xl md:text-3xl font-black tracking-tight text-right select-all font-mono break-all">
            <template v-if="hl.type === 'currency'">
              {{ formatCurrency(activeNotaValueByField(hl.field)) }}
            </template>
            <template v-else-if="hl.type === 'number'">
              {{ formatNumber(activeNotaValueByField(hl.field)) }}
            </template>
            <template v-else>
              {{ activeNotaValueByField(hl.field) }}
            </template>
          </div>
        </div>

        <div
          class="flex-1 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden p-4 min-h-0">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{{ headerLabel }}
            </h2>
            <span
              class="text-[10px] text-slate-500 dark:text-slate-400 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-medium">
              Fokus + <kbd class="font-bold">DEL</kbd> = Hapus Antrian
            </span>
          </div>

          <div class="flex-1 min-h-0 border border-slate-200/60 dark:border-slate-700/60 rounded-lg overflow-hidden">
            <RevoGrid ref="headerGridRef" class="w-full h-full max-h-full focus:outline-none" :columns="headerColumns"
              :source="headerRows" :theme="isDark ? 'darkCompact' : 'compact'" resize="true"
              @afterfocus="afterHeaderFocus" />
          </div>
        </div>

      </div>
    </div>

    <div v-if="showSearchModal" @click.self="closeSearchModal"
      class="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div
        class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4">
        <label class="block text-xs font-bold mb-2 uppercase tracking-wider"
          :class="lastActiveGrid === 'header' ? 'text-amber-500' : 'text-emerald-500'">
          {{ lastActiveGrid === 'header' ? 'Scan / Cari Data Pelanggan (Antrian Baru)' : `Scan Barcode / Cari Nama Item
          Produk` }}
        </label>
        <input ref="searchInputRef" v-model="searchQuery" type="text"
          :placeholder="lastActiveGrid === 'header' ? 'Ketik nama pelanggan baru...' : 'Scan barcode / ketik nama barang...'"
          class="w-full text-lg font-mono font-bold px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 text-slate-800 dark:text-slate-100 shadow-inner"
          :class="lastActiveGrid === 'header' ? 'focus:ring-amber-500' : 'focus:ring-emerald-500'"
          @keydown.enter="handleSearchSubmit" @keydown.esc="closeSearchModal" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { isDark } from '@/composables/dark'
import { useNumberFormat } from '@/composables/number-format'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'
import { useTabStore } from '@/stores/tabs'

const props = defineProps({
  menu: { type: Object, required: true },
  schemaData: { type: Object, required: true }
})

const tabStore = useTabStore()
const { formatNumber, formatCurrency } = useNumberFormat()

const gridRef = ref(null)
const headerGridRef = ref(null)
const navigatorRef = ref(null)

const headerColumns = ref([])
const detailColumns = ref([])
const headerRows = ref([])
const allDetailRows = ref([])

// Label Dinamis Grid
const headerLabel = ref('ANTRIAN')
const detailLabel = ref('ITEM')

const actionButtons = ref([])
const highlightConfig = ref([])

const primaryKey = ref('id')
const primaryKeyLabel = ref('antrian')

// Koordinat Fokus Pelacak Presisi
const focusedCoordinate = ref({ x: -1, y: -1 })
const focusedHeaderCoordinate = ref({ x: -1, y: -1 }) // Ditambahkan untuk melacak kolom & baris Antrian

const activeNotaId = ref(null)
const lastActiveGrid = ref('detail')

const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

let savedDetailGridEl = null
let savedHeaderGridEl = null
let focusTimeoutId = null
let watchTabTimeoutId = null

const activeNotaValueByField = (fieldName) => {
  const notaAktif = headerRows.value.find(nota => nota[primaryKey.value] === activeNotaId.value)
  if (!notaAktif) return ''

  const value = notaAktif[fieldName]
  if (value && typeof value === 'object') {
    return value.nmCustomer || value.nmUser || value.name || ''
  }
  return value !== undefined ? value : ''
}

const relationCellRenderer = (createElement, linkProps, displayField, fieldKey) => {
  const rowData = linkProps.model[fieldKey]
  if (!rowData) return createElement('span', {}, '')
  if (typeof rowData === 'object') {
    return createElement('span', {}, rowData[displayField] || rowData.name || rowData.nmCustomer || rowData.nmUser || '')
  }
  return createElement('span', {}, rowData)
}

const filteredDetailRows = computed(() => {
  if (!activeNotaId.value) return []
  return allDetailRows.value.filter(item => item.penjualanId === activeNotaId.value)
})

const getActionClass = (type) => {
  if (type === 'payment') return 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'
  if (type === 'printer') return 'bg-slate-600 hover:bg-slate-500 shadow-lg shadow-slate-600/20'
  return 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20'
}

const removeGridListeners = () => {
  if (savedDetailGridEl) {
    savedDetailGridEl.removeEventListener('keydown', handleKeyDownDetail)
    savedDetailGridEl = null
  }
  if (savedHeaderGridEl) {
    savedHeaderGridEl.removeEventListener('keydown', handleKeyDownHeader)
    savedHeaderGridEl = null
  }
}

const loadComponentData = async () => {
  const res = props.schemaData
  if (!res) return

  actionButtons.value = res.actions || []
  highlightConfig.value = res.highlight || []

  headerLabel.value = res.header?.label || 'ANTRIAN'
  detailLabel.value = res.details?.label || 'ITEM'

  headerRows.value = [...(res.header?.data || [])]
  allDetailRows.value = [...(res.details?.data || [])]

  const primaryField = (res.header?.schema || []).find(f => f.primary)
  primaryKey.value = primaryField?.key || 'id'
  primaryKeyLabel.value = primaryField?.label || 'antrian'

  headerColumns.value = (res.header?.schema || []).map(field => {
    const config = {
      prop: field.key,
      name: field.label,
      readonly: field.readonly || false,
    }
    if (field.type === 'currency') {
      config.cellTemplate = (createElement, linkProps) =>
        createElement('span', { class: 'font-mono' }, formatCurrency(linkProps.model[field.key] || 0))
    } else if (field.relation) {
      config.cellTemplate = (createElement, linkProps) =>
        relationCellRenderer(createElement, linkProps, field.relation.displayField, field.key)
    }
    return config
  })

  detailColumns.value = (res.details?.schema || []).map(field => {
    const config = {
      prop: field.key,
      name: field.label,
      readonly: field.readonly || false,
    }
    if (field.type === 'currency') {
      config.cellTemplate = (createElement, linkProps) =>
        createElement('span', { class: 'font-mono' }, formatCurrency(linkProps.model[field.key] || 0))
    } else if (field.type === 'number') {
      config.cellTemplate = (createElement, linkProps) =>
        createElement('span', { class: 'font-mono' }, formatNumber(linkProps.model[field.key] || 0))
    } else if (field.relation) {
      config.cellTemplate = (createElement, linkProps) =>
        relationCellRenderer(createElement, linkProps, field.relation.displayField, field.key)
    }
    return config
  })

  if (headerRows.value.length > 0 && !activeNotaId.value) {
    activeNotaId.value = headerRows.value[0][primaryKey.value]
  }

  await nextTick()
  setTimeout(() => { setUpGridBehaviors() }, 100)
}

const setUpGridBehaviors = () => {
  const detailGrid = gridRef.value?.$el || gridRef.value
  const headerGrid = headerGridRef.value?.$el || headerGridRef.value

  removeGridListeners()

  if (detailGrid) {
    savedDetailGridEl = detailGrid
    detailGrid.addEventListener('keydown', handleKeyDownDetail)
    detailGrid.setAttribute('tabindex', '0')
  }
  if (headerGrid) {
    savedHeaderGridEl = headerGrid
    headerGrid.addEventListener('keydown', handleKeyDownHeader)
    headerGrid.setAttribute('tabindex', '0')
  }

  if (focusTimeoutId) clearTimeout(focusTimeoutId)
  focusTimeoutId = setTimeout(() => {
    if (detailGrid) detailGrid.focus()
  }, 50)
}

const afterHeaderFocus = (event) => {
  lastActiveGrid.value = 'header'
  // FIX: Simpan koordinat X (kolom) dan Y (baris) secara riil untuk tabel Antrian
  focusedHeaderCoordinate.value = { x: event.detail.colIndex, y: event.detail.rowIndex }

  const targetRow = headerRows.value[event.detail.rowIndex]
  if (targetRow) {
    activeNotaId.value = targetRow[primaryKey.value]
  }
}

const afterFocus = (event) => {
  lastActiveGrid.value = 'detail'
  focusedCoordinate.value = { x: event.detail.colIndex, y: event.detail.rowIndex }
}

const handleKeyDownDetail = (e) => {
  if (showSearchModal.value) return
  if (e.repeat) return
  if (e.key === 'Delete') {
    handleDeleteDetailRow()
    e.preventDefault()
    return
  }
  handleGlobalPOSShortcuts(e, 'detail')
}

const handleKeyDownHeader = (e) => {
  if (showSearchModal.value) return
  if (e.repeat) return
  if (e.key === 'Delete') {
    handleDeleteAntrianRow()
    e.preventDefault()
    return
  }
  handleGlobalPOSShortcuts(e, 'header')
}

const handleGlobalPOSShortcuts = (e, gridSource) => {
  if (gridSource) lastActiveGrid.value = gridSource

  if (e.key === 'F2') {
    handleTambahAntrian(null)
    e.preventDefault()
    return
  }

  if (e.key === 'F4') {
    const payAction = actionButtons.value.find(a => a.type === 'payment')
    if (payAction) handleActionTrigger(payAction)
    e.preventDefault()
    return
  }

  const isFunctionalKey = e.ctrlKey || e.altKey || e.metaKey
  if (e.key.length === 1 && !isFunctionalKey) {

    const currentColumns = gridSource === 'header' ? headerColumns.value : detailColumns.value
    // FIX: Menggunakan data pelacak koordinat yang tepat berdasarkan grid yang sedang aktif
    const currentCoordinate = gridSource === 'header' ? focusedHeaderCoordinate.value : focusedCoordinate.value

    if (currentColumns && currentCoordinate.x >= 0) {
      const activeColumn = currentColumns[currentCoordinate.x]

      if (activeColumn) {
        // Hanya trigger modal jika cell target adalah primary key, tipenya display, atau ditandai readonly: true
        const isPrimaryKey = activeColumn.prop === primaryKey.value || activeColumn.prop === 'id' || activeColumn.type === 'display'
        const isReadOnly = activeColumn.readonly === true

        if (isPrimaryKey || isReadOnly) {
          openSearchWithChar(e.key)
          e.preventDefault()
        }
        // JIKA BUKAN primary/readonly, abaikan, biarkan kasir mengetik langsung di dalam input bawaan RevoGrid
      }
    }
  }
}

const handleActionTrigger = (action) => {
  if (action.type === 'payment') {
    const total = activeNotaValueByField('total')
    if (!total || total === 0) return alert('Keranjang belanja masih kosong!')
    alert(`[${action.label}] Memproses pembayaran sebesar: ${formatCurrency(total)}`)
  } else {
    alert(`Menjalankan aksi dinamis POS: ${action.label} (${action.key})`)
  }
}

const handleDeleteDetailRow = () => {
  if (focusedCoordinate.value.y < 0) return
  if (confirm('Hapus item barang ini?')) {
    const targetIndex = focusedCoordinate.value.y
    const targetItem = filteredDetailRows.value[targetIndex]
    if (targetItem) {
      allDetailRows.value = allDetailRows.value.filter(item => item.id !== targetItem.id)
      recalculateActiveTotal()
    }
  }
}

const handleDeleteAntrianRow = () => {
  if (focusedHeaderCoordinate.value.y < 0) return
  const targetNota = headerRows.value[focusedHeaderCoordinate.value.y]
  if (!targetNota) return

  if (confirm(`Hapus seluruh nomor antrian #${targetNota[primaryKey.value]} ini?`)) {
    const idYangDihapus = targetNota[primaryKey.value]
    headerRows.value = headerRows.value.filter(nota => nota[primaryKey.value] !== idYangDihapus)
    allDetailRows.value = allDetailRows.value.filter(item => item.penjualanId !== idYangDihapus)

    if (headerRows.value.length > 0) {
      activeNotaId.value = headerRows.value[0][primaryKey.value]
      focusedHeaderCoordinate.value = { x: 0, y: 0 }
    } else {
      activeNotaId.value = null
      focusedHeaderCoordinate.value = { x: -1, y: -1 }
    }
  }
}

const handleTambahAntrian = (customerName = null) => {
  const newId = headerRows.value.length > 0
    ? Math.max(...headerRows.value.map(n => n[primaryKey.value])) + 1
    : 1

  const dataBaru = {
    [primaryKey.value]: newId,
    date: new Date().toISOString().split('T')[0],
    user: { id: 1, nmUser: 'John Doe' },
    customer: { id: customerName ? Math.random() : 1, nmCustomer: customerName || 'Pelanggan Umum' },
    total: 0
  }

  headerRows.value = [...headerRows.value, dataBaru]
  activeNotaId.value = newId
  nextTick(() => { focusedHeaderCoordinate.value = { x: 0, y: headerRows.value.length - 1 } })
}

const handleSearchSubmit = () => {
  const query = searchQuery.value.trim()
  if (!query) return

  if (lastActiveGrid.value === 'header') {
    handleTambahAntrian(query)
  } else {
    if (!activeNotaId.value) {
      alert('Pilih atau buat antrian terlebih dahulu!')
      closeSearchModal()
      return
    }

    const nextDetailId = allDetailRows.value.length > 0
      ? Math.max(...allDetailRows.value.map(d => d.id)) + 1
      : 1

    const produkBaruTiruan = {
      id: nextDetailId,
      penjualanId: activeNotaId.value,
      product: { id: nextDetailId + 100, nmProduct: query },
      quantity: 1,
      price: 15000
    }

    allDetailRows.value = [...allDetailRows.value, produkBaruTiruan]
    recalculateActiveTotal()
  }
  closeSearchModal()
}

const recalculateActiveTotal = () => {
  const sisaItem = allDetailRows.value.filter(item => item.penjualanId === activeNotaId.value)
  const totalBaru = sisaItem.reduce((acc, curr) => acc + (curr.quantity * (curr.price || 0)), 0)

  headerRows.value = headerRows.value.map(nota => {
    if (nota[primaryKey.value] === activeNotaId.value) {
      return { ...nota, total: totalBaru }
    }
    return nota
  })
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
  nextTick(() => {
    if (lastActiveGrid.value === 'header') {
      headerGridRef.value?.$el?.focus()
    } else {
      gridRef.value?.$el?.focus()
    }
  })
}

onBeforeUnmount(() => {
  if (focusTimeoutId) clearTimeout(focusTimeoutId)
  if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)
  removeGridListeners()
  headerRows.value = []
  allDetailRows.value = []
  detailColumns.value = []
})

watch(() => props.schemaData, loadComponentData)
onMounted(loadComponentData)

watch(() => tabStore.activeTabId, async (activeTabId) => {
  if (activeTabId === props.menu?.route) {
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
</style>