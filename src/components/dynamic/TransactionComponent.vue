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
          :placeholder="lastActiveGrid === 'header' ? `Mode ${headerLabel}: Pilih/Buat Baris Baru...` : `Mode ${detailLabel}: Ketik / Masukkan Data Item...`"
          class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs px-4 py-2.5 rounded-lg focus:outline-none placeholder:text-slate-400 cursor-pointer font-medium"
          @click="openSearchWithChar('')" readonly />
      </div>

      <div class="flex items-center gap-2">
        <button @click="handleTambahAntrian(null)"
          class="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-xl active:scale-95 transition">
          + {{ headerLabel }} BARU (F2)
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
        class="flex-[7] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden p-4 relative min-h-0">

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-3 gap-3 flex-shrink-0">
          <div class="flex flex-wrap items-center gap-1.5 max-w-full">
            <button v-for="(nota, index) in headerRows" :key="nota[primaryKey]"
              @click="setActiveAntrian(nota[primaryKey], index)"
              :class="activeNotaId === nota[primaryKey]
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap active:scale-95">
              <span>{{ primaryKeyLabel }} #{{ nota[primaryKey] }} <span v-if="getTabDisplayValue(nota)">({{
                getTabDisplayValue(nota) }})</span></span>
              <span @click.stop="handleDeleteAntrianByTab(nota, index)"
                :class="activeNotaId === nota[primaryKey] ? 'hover:bg-emerald-600' : 'hover:bg-slate-300 dark:hover:bg-slate-700'"
                class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold p-0.5">
                ✕
              </span>
            </button>

            <div v-if="headerRows.length === 0" class="text-xs font-semibold text-slate-400">
              Tidak Ada {{ headerLabel }} Aktif
            </div>
          </div>
        </div>

        <div v-if="activeNotaId && currentActiveNota"
          class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl mb-3 border border-slate-100 dark:border-slate-800 text-xs flex-shrink-0">

          <div v-for="field in headerSchemaRaw" :key="field.key" class="flex flex-col gap-1">
            <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {{ field.label }}
            </label>

            <div v-if="field.readonly || field.primary"
              class="font-bold text-slate-700 dark:text-slate-300 py-1.5 px-2 font-mono">
              {{ formatHeaderValue(currentActiveNota, field) }}
            </div>

            <select v-else-if="field.type === 'relation'" v-model="currentActiveNota[field.key]"
              class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-medium">
              <option :value="currentActiveNota[field.key]">
                {{ typeof currentActiveNota[field.key] === 'object' ?
                  currentActiveNota[field.key][field.relation?.displayField] : currentActiveNota[field.key] }}
              </option>
            </select>

            <input v-else-if="field.type === 'date'" type="date" v-model="currentActiveNota[field.key]"
              class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-100" />

            <input v-else type="text" v-model="currentActiveNota[field.key]"
              @input="handleHeaderFieldInput($event, currentActiveNota, field)"
              class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100" />
          </div>
        </div>

        <div v-if="!activeNotaId"
          class="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
          <p class="text-slate-400 text-sm font-semibold">Silahkan pilih atau buat data {{ headerLabel }} terlebih
            dahulu</p>
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
          class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between text-xs text-slate-400">
          <div class="space-y-2">
            <div class="font-bold uppercase tracking-wider text-[10px]">Pintasan Akses</div>
            <div class="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-1">
              <span>[F2]</span><span class="text-slate-500">Buat {{ headerLabel }}</span>
            </div>
            <div class="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-1">
              <span>[F4]</span><span class="text-slate-500">Aksi Pembayaran</span>
            </div>
            <div class="flex justify-between border-b border-slate-100 dark:border-slate-700/50 pb-1">
              <span>[DEL]</span><span class="text-slate-500">Hapus Baris / Item</span>
            </div>
          </div>
          <div
            class="text-center pt-4 border-t border-slate-100 dark:border-slate-700/50 font-bold text-slate-500 dark:text-slate-400 text-[11px] tracking-widest uppercase">
            {{ props.schemaData?.label || 'POS SYSTEM' }}
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
          {{ lastActiveGrid === 'header' ? `Cari / Input Master ${headerFirstRelationField?.label || 'Data'}` : `Cari /
          Input Master ${detailFirstRelationField?.label || 'Produk'}` }}
        </label>
        <input ref="searchInputRef" v-model="searchQuery" type="text"
          :placeholder="lastActiveGrid === 'header' ? 'Ketik masukan data baru...' : 'Scan barcode / ketik pencarian...'"
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
const navigatorRef = ref(null)

const detailColumns = ref([])
const headerRows = ref([])
const allDetailRows = ref([])

const headerLabel = ref('ANTRIAN')
const detailLabel = ref('ITEM')

const headerSchemaRaw = ref([])
const detailSchemaRaw = ref([])

const actionButtons = ref([])
const highlightConfig = ref([])

const primaryKey = ref('id')
const primaryKeyLabel = ref('antrian')
const foreignKeyInDetail = ref('penjualanId')

const focusedCoordinate = ref({ x: -1, y: -1 })
const focusedHeaderCoordinate = ref({ x: 0, y: 0 })

const activeNotaId = ref(null)
const lastActiveGrid = ref('detail')

const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

let savedDetailGridEl = null
let focusTimeoutId = null
let watchTabTimeoutId = null

// Mencari field relasi pertama milik header schema (cth: customer) untuk display label di Tab
const headerFirstRelationField = computed(() => {
  return headerSchemaRaw.value.find(field => field.type === 'relation') || null
})

// Mencari field relasi pertama milik detail schema (cth: product) untuk target input search modal
const detailFirstRelationField = computed(() => {
  return detailSchemaRaw.value.find(field => field.type === 'relation') || null
})

const currentActiveNota = computed(() => {
  return headerRows.value.find(nota => nota[primaryKey.value] === activeNotaId.value) || null
})

// Mengambil nama tampilan dinamis pada Tab navigasi
const getTabDisplayValue = (nota) => {
  const relField = headerFirstRelationField.value
  if (!relField || !nota[relField.key]) return ''
  const objData = nota[relField.key]
  if (typeof objData === 'object') {
    return objData[relField.relation?.displayField] || objData.name || ''
  }
  return objData
}

// Format nilai tampilan jika dibaca sebagai string static readonly pada view tertentu
// Format render value untuk panel ringkasan informasi secara data-driven penuh
const formatHeaderValue = (nota, field) => {
  const val = nota[field.key]
  if (val === undefined || val === null || val === '') return '-'

  // 1. Jika bertipe relation (Object), ambil display field-nya
  if (field.type === 'relation' && typeof val === 'object') {
    return val[field.relation?.displayField] || val.name || '-'
  }

  // 2. KONDISI KHUSUS: Jika ini adalah Primary Key atau field ID/Display, JANGAN jadikan currency
  if (field.primary || field.type === 'display' || field.key === primaryKey.value) {
    return val
  }

  // 3. LOGIKA DINAMIS DISKON / ANGKA LAINNYA:
  // Jika tipe data di skema adalah 'currency' ATAU nilainya berupa angka murni (dan bukan ID)
  if (field.type === 'currency' || !isNaN(val)) {
    return formatCurrency(val)
  }

  // 4. Jika nilai berupa string dan mengandung simbol '%', biarkan sebagai teks biasa
  if (typeof val === 'string' && val.includes('%')) {
    return val
  }

  // Fallback untuk tipe lainnya (date, text biasa, dll)
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
  if (typeof rowData === 'object') {
    return createElement('span', {}, rowData[displayField] || rowData.name || '')
  }
  return createElement('span', {}, rowData)
}

const filteredDetailRows = computed(() => {
  if (!activeNotaId.value) return []
  return allDetailRows.value.filter(item => item[foreignKeyInDetail.value] === activeNotaId.value)
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
}

const loadComponentData = async () => {
  const res = props.schemaData
  if (!res) return

  actionButtons.value = res.actions || []
  highlightConfig.value = res.highlight || []

  headerLabel.value = res.header?.label || 'ANTRIAN'
  detailLabel.value = res.details?.label || 'ITEM'

  headerSchemaRaw.value = res.header?.schema || []
  detailSchemaRaw.value = res.details?.schema || []

  headerRows.value = [...(res.header?.data || [])]
  allDetailRows.value = [...(res.details?.data || [])]

  const primaryField = headerSchemaRaw.value.find(f => f.primary)
  primaryKey.value = primaryField?.key || 'id'
  primaryKeyLabel.value = primaryField?.label || 'Key'

  const fKey = detailSchemaRaw.value.find(f => f.key.toLowerCase().includes('id') && f.key !== 'id')
  foreignKeyInDetail.value = fKey?.key || 'penjualanId'

  // Mapping dynamic layout Detail Column RevoGrid
  detailColumns.value = detailSchemaRaw.value.map(field => {
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
    focusedHeaderCoordinate.value = { x: 0, y: 0 }
  }

  await nextTick()
  setTimeout(() => { setUpGridBehaviors() }, 100)
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
  focusTimeoutId = setTimeout(() => {
    if (detailGrid) detailGrid.focus()
  }, 50)
}

const setActiveAntrian = (id, index) => {
  activeNotaId.value = id
  focusedHeaderCoordinate.value = { x: 0, y: index }
  lastActiveGrid.value = 'detail'
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

const handleGlobalPOSShortcuts = (e, gridSource) => {
  if (gridSource) lastActiveGrid.value = gridSource

  if (e.key === 'F2') {
    lastActiveGrid.value = 'header'
    openSearchWithChar('')
    e.preventDefault()
    return
  }

  if (e.key === 'F4') {
    const payAction = actionButtons.value.find(a => a.type === 'payment' || a.key === 'pay')
    if (payAction) handleActionTrigger(payAction)
    e.preventDefault()
    return
  }

  const isFunctionalKey = e.ctrlKey || e.altKey || e.metaKey
  if (e.key.length === 1 && !isFunctionalKey) {
    const currentColumns = detailColumns.value
    const currentCoordinate = focusedCoordinate.value

    if (currentColumns && currentCoordinate.x >= 0) {
      const activeColumn = currentColumns[currentCoordinate.x]
      if (activeColumn) {
        const isPrimaryKey = activeColumn.prop === primaryKey.value || activeColumn.prop === 'id' || activeColumn.type === 'display'
        const isReadOnly = activeColumn.readonly === true

        if (isPrimaryKey || isReadOnly) {
          openSearchWithChar(e.key)
          e.preventDefault()
        }
      }
    }
  }
}

// Mengawal perubahan interaktif text input pada editable info panel header secara real-time
const handleHeaderFieldInput = (event, nota, field) => {
  // Jika field yang diubah kasir mengandung kata kunci diskon/discount, picu re-kalkulasi total
  if (field.key.toLowerCase().includes('discount') || field.key.toLowerCase().includes('diskon')) {
    recalculateActiveTotal()
  }
}

const handleActionTrigger = (action) => {
  const targetTotalField = highlightConfig.value[0]?.field || 'total'
  const total = activeNotaValueByField(targetTotalField)

  if (action.type === 'payment' || action.key === 'pay') {
    if (!total || total === 0) return alert('Keranjang / Data item masih kosong!')
    alert(`[${action.label}] Memproses transaksi sebesar: ${formatCurrency(total)}`)
  } else {
    alert(`Menjalankan aksi ${action.label} (${action.key})`)
  }
}

const handleDeleteDetailRow = () => {
  if (focusedCoordinate.value.y < 0) return
  if (confirm(`Hapus item ${detailLabel.value} ini?`)) {
    const targetIndex = focusedCoordinate.value.y
    const targetItem = filteredDetailRows.value[targetIndex]
    if (targetItem) {
      allDetailRows.value = allDetailRows.value.filter(item => item.id !== targetItem.id)
      recalculateActiveTotal()
    }
  }
}

const handleDeleteAntrianByTab = (nota, index) => {
  if (confirm(`Hapus seluruh nomor data #${nota[primaryKey.value]} ini?`)) {
    const idYangDihapus = nota[primaryKey.value]
    headerRows.value = headerRows.value.filter(item => item[primaryKey.value] !== idYangDihapus)
    allDetailRows.value = allDetailRows.value.filter(item => item[foreignKeyInDetail.value] !== idYangDihapus)

    if (headerRows.value.length > 0) {
      if (activeNotaId.value === idYangDihapus) {
        activeNotaId.value = headerRows.value[0][primaryKey.value]
        focusedHeaderCoordinate.value = { x: 0, y: 0 }
      } else {
        const newIndex = headerRows.value.findIndex(n => n[primaryKey.value] === activeNotaId.value)
        focusedHeaderCoordinate.value = { x: 0, y: newIndex }
      }
    } else {
      activeNotaId.value = null
      focusedHeaderCoordinate.value = { x: -1, y: -1 }
    }
  }
}

const handleTambahAntrian = (relationInputValue = null) => {
  const newId = headerRows.value.length > 0
    ? Math.max(...headerRows.value.map(n => n[primaryKey.value])) + 1
    : 1

  const dataBaru = {}
  headerSchemaRaw.value.forEach(field => {
    if (field.primary) {
      dataBaru[field.key] = newId
    } else if (field.type === 'date') {
      dataBaru[field.key] = new Date().toISOString().split('T')[0]
    } else if (field.type === 'relation') {
      const isFirstRel = headerFirstRelationField.value?.key === field.key
      dataBaru[field.key] = {
        [field.relation.valueField || 'id']: Math.random(),
        [field.relation.displayField || 'name']: isFirstRel && relationInputValue ? relationInputValue : `Default ${field.label}`
      }
    } else if (field.type === 'currency' || field.type === 'number') {
      dataBaru[field.key] = 0
    } else {
      dataBaru[field.key] = ''
    }
  })

  headerRows.value = [...headerRows.value, dataBaru]
  activeNotaId.value = newId
  nextTick(() => {
    focusedHeaderCoordinate.value = { x: 0, y: headerRows.value.length - 1 }
  })
}

const handleSearchSubmit = () => {
  const query = searchQuery.value.trim()
  if (!query) return

  if (lastActiveGrid.value === 'header') {
    handleTambahAntrian(query)
    lastActiveGrid.value = 'detail'
  } else {
    if (!activeNotaId.value) {
      alert('Pilih atau buat data antrian terlebih dahulu!')
      closeSearchModal()
      return
    }

    const nextDetailId = allDetailRows.value.length > 0
      ? Math.max(...allDetailRows.value.map(d => d.id)) + 1
      : 1

    const detailBaru = {}
    detailSchemaRaw.value.forEach(field => {
      if (field.primary) {
        detailBaru[field.key] = nextDetailId
      } else if (field.key === foreignKeyInDetail.value) {
        detailBaru[field.key] = activeNotaId.value
      } else if (field.type === 'relation') {
        detailBaru[field.key] = {
          [field.relation.valueField || 'id']: nextDetailId + 100,
          [field.relation.displayField || 'name']: query
        }
      } else if (field.key === 'quantity') {
        detailBaru[field.key] = 1
      } else if (field.key === 'price' || field.type === 'currency') {
        detailBaru[field.key] = 15000  // fallback default price mock
      } else {
        detailBaru[field.key] = ''
      }
    })

    allDetailRows.value = [...allDetailRows.value, detailBaru]
    recalculateActiveTotal()
  }
  closeSearchModal()
}

// Logika re-kalkulasi subtotal & diskon murni (% vs nominal rupiah) secara data-driven
const recalculateActiveTotal = () => {
  const sisaItem = allDetailRows.value.filter(item => item[foreignKeyInDetail.value] === activeNotaId.value)

  const qtyField = detailSchemaRaw.value.find(f => f.key === 'quantity' || f.key === 'qty')?.key || 'quantity'
  const priceField = detailSchemaRaw.value.find(f => f.type === 'currency' || f.key === 'price')?.key || 'price'
  const totalField = headerSchemaRaw.value.find(f => f.key === 'total' || f.type === 'currency')?.key || 'total'

  const diskonField = headerSchemaRaw.value.find(f => f.key.toLowerCase().includes('discount') || f.key.toLowerCase().includes('diskon'))?.key

  // 1. Hitung dasar subtotal dari item grid detail
  let subTotal = sisaItem.reduce((acc, curr) => {
    const q = parseFloat(curr[qtyField]) || 0
    const p = parseFloat(curr[priceField]) || 0
    return acc + (q * p)
  }, 0)

  // 2. Kalkulasi diskon dinamis jika fieldnya eksis pada skema master
  if (diskonField && headerRows.value.length > 0) {
    const currentNota = headerRows.value.find(nota => nota[primaryKey.value] === activeNotaId.value)
    if (currentNota) {
      const nilaiDiskon = currentNota[diskonField]

      if (nilaiDiskon && typeof nilaiDiskon === 'string' && nilaiDiskon.includes('%')) {
        const persen = parseFloat(nilaiDiskon.replace('%', '')) || 0
        subTotal = subTotal - (subTotal * (persen / 100))
      } else if (nilaiDiskon) {
        const nominal = parseFloat(nilaiDiskon) || 0
        subTotal = subTotal - nominal
      }
    }
  }

  headerRows.value = headerRows.value.map(nota => {
    if (nota[primaryKey.value] === activeNotaId.value) {
      return { ...nota, [totalField]: subTotal < 0 ? 0 : subTotal }
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
    gridRef.value?.$el?.focus()
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

.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>