<template>
	<div class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-transparent w-full">

		<div
			class="flex flex-col p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors gap-4">

			<div class="w-full">
				<DynamicFilter v-if="props.schemaData?.schema" :schema="props.schemaData.schema"
					:tabId="props.menu?.route || 'master'" @filter-changed="handleFilterChanged"
					@escape-filter="focusBackToGrid" />
			</div>

			<div
				class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60">

				<div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 select-none">
					<div class="flex items-center gap-1">
						<span class="font-medium text-slate-700 dark:text-slate-300">{{ rows.length }}</span>
						<span>items</span>
					</div>
					<SyncStatus ref="syncStatusRef" />
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<button v-if="permission.create" @click="handleAddNewRow" type="button" class="btn-action-slate"
						:disabled="syncStatusRef?.syncStatus.state === 'loading'">
						<span>+ Tambah Baris</span>
						<kbd class="btn-kbd">[F2]</kbd>
					</button>

					<button v-else disabled type="button" class="btn-action-disabled">
						<Icon icon="heroicons:lock-closed-20-solid" class="w-4 h-4" />
						<span>Akses Terkunci</span>
					</button>
					<button @click="handlePrint" type="button" class="btn-action-slate">
						<span>Cetak</span>
						<kbd class="btn-kbd">[Ctrl+P]</kbd>
					</button>
					<button @click="handleExport" type="button" class="btn-action-slate">
						<span>Ekspor</span>
					</button>
				</div>
			</div>

		</div>
		<div class="flex flex-1 min-h-0 w-full overflow-hidden relative">
			<div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
				<div class="flex-1 min-h-0 w-full relative group overflow-hidden z-10">

					<RevoGrid hide-attribution ref="gridRef" class="w-full h-full max-h-full focus:outline-none"
						:columns="columns" :source="rows" :theme="isDark ? 'darkCompact' : 'compact'" :resize="true"
						:auto-size-column="true" @beforeeditstart="beforeEditStart" @afteredit="afterEdit"
						@beforeedit="beforeEdit" @keydown="handleKeyDown" :column-types="columnTypes" />

					<GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns" />

					<div v-if="showSearchModal" @click.self="closeSearchModal"
						class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 z-50 transition-all">
						<div class="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden p-3 mx-4"
							@keydown.stop>
							<form @submit.prevent="handleSearchSubmit" class="relative flex items-center">

								<div
									class="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
									<Icon icon="heroicons:magnifying-glass-20-solid" class="w-5 h-5" />
								</div>

								<input ref="searchInputRef" v-model="searchQuery" type="text"
									placeholder="Lanjutkan mengetik untuk mencari data..."
									class="w-full pl-11 pr-20 py-3 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 transition-all" />

								<div class="absolute right-3 flex items-center gap-1.5 pointer-events-none">
									<kbd
										class="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-600 rounded shadow-sm">Enter
										↩</kbd>
									<button type="button" @click="closeSearchModal"
										class="pointer-events-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Esc</button>
								</div>
							</form>
						</div>
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
import DynamicFilter from '@/components/DynamicFilter.vue'
import SyncStatus from '@/components/SyncStatus.vue'
import api from '@/lib/axios'

import { useTabStore } from '@/stores/tabs'
import { useFilterStore } from '@/stores/filter'
import { useRoute } from 'vue-router'

import NumberColumnType from '@revolist/revogrid-column-numeral'
import SelectTypePlugin from '@revolist/revogrid-column-select'
import DateTypePlugin from '@revolist/revogrid-column-date'
import { useRealtimeSync } from '@/composables/useRealtimeSync'
import { gridSelectSingleCell, getActiveCellState } from '@/composables/grid'

const props = defineProps({
	menu: { type: Object, required: true },
	schemaData: { type: Object, required: true }
})

const route = useRoute()
const tabStore = useTabStore()
const filterStore = useFilterStore()

const gridRef = ref<any>(null)
const navigatorRef = ref(null)
const columns = ref([])
const rows = ref([])
const primaryKey = ref('id')
const permission = ref<Record<string, boolean | undefined>>({})

const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

let activeTimeoutId: any = null

const syncStatusRef = ref<InstanceType<typeof SyncStatus> | null>(null)

const setSyncStatus = (state: any, message: string, autoResetDelay = 3000) => {
	syncStatusRef.value?.setStatus(state, message, autoResetDelay)
}

const activeFilters = ref(filterStore.getFiltersByTab(props.menu?.route || route.path) || {})
const relationOptions = ref<{ [entityName: string]: Array<{ value: any, label: string }> }>({})

const formKey = computed(() => {
	return props.menu.key.toLowerCase()
})


// const getActiveCellState = async () => {
// 	const grid = getGrid(gridRef)
// 	if (typeof grid.getFocused !== 'function') return { x: 0, y: 0, column: {}, model: {} }
// 	const focused = await grid.getFocused()
// 	return {
// 		x: focused?.cell?.x ?? 0,
// 		y: focused?.cell?.y ?? 0,
// 		column: focused?.column || {},
// 		model: focused?.model || {}
// 	}
// }

const columnTypes = {
	numeric: new NumberColumnType('0,0'),
	decimal: new NumberColumnType('0,0.00'),
	select: new SelectTypePlugin(),
	date: new DateTypePlugin()
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


// 🟢 APPLY RESPONSE DATA: Handler utama sinkronisasi realtime socket
const applyResponseData = (serverData: any) => {
	if (!serverData) return
	const incomingRows = Array.isArray(serverData)
		? serverData
		: (serverData.schema?.data || serverData.data || [serverData])

	rows.value = [...incomingRows]

	if (tabStore.activeTabId === props.menu?.route) {
		const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
		if (currentTab?.apiResponse) {
			currentTab.apiResponse.data = [...rows.value]
		}
	}
}

// 🟢 FETCH GRID DATA: Mengambil data tabel dari backend
const fetchGridData = async () => {
	setSyncStatus('loading', 'Mengambil data..')
	try {
		await api.get(`/${formKey.value}/get-all`, {
			params: {
				filter: JSON.stringify(activeFilters.value)
			}
		})

		setSyncStatus('success', 'Selesai sinkronisasi')
	} catch (err: any) {
		console.error("[Api] Gagal sinkronisasi data dengan server:", err)
		setSyncStatus('error', `Gagal memuat: ${err.message || 'Server Error'}`)
	}
}

// 🟢 LOAD COMPONENT DATA: Dipicu saat props schemaData masuk / berubah
const loadComponentData = async () => {
	const res = props.schemaData
	if (!res) return
	applyResponseData(res)

	columns.value = (res.schema || []).map(field => {
		const columnConfig: Record<string, any> = {
			prop: field.key,
			name: field.label,
			size: field.size,
			readonly: field.readonly || false,
			required: field.required || false,
			_type: field.type || 'text',
			_autoIncrementOnDuplicate: field.autoIncrementOnDuplicate || false,
			_primary: field.primary || false,
		}

		if (['number', 'integer'].includes(field.type)) {
			columnConfig.columnType = 'numeric'
			columnConfig.editor = 'number'
		}
		else if (['decimal', 'currency'].includes(field.type)) {
			columnConfig.editor = 'number'
			columnConfig.columnType = 'decimal'
		}
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

	primaryKey.value = (res.schema || []).find(f => f.primary)?.key || 'id'
	permission.value = res.permissions || {}
	await nextTick(() => {
		focusBackToGrid()
	})
}

const beforeEditStart = () => { console.log('mencari relasi data..') }

const beforeEdit = (event) => {
	const { val, prop } = event.detail;
	const originalField = props.schemaData?.schema?.find(f => f.key === prop);
	if (!originalField) return;

	const columnLabel = originalField.label || prop;
	const fieldType = originalField.type;
	const isRequired = originalField.required || false;

	if (isRequired) {
		const isStringEmpty = typeof val === 'string' && val.trim() === '';
		const isNullOrUndefined = val === null || val === undefined || val === '';

		if (isStringEmpty || isNullOrUndefined) {
			setSyncStatus('error', `${columnLabel} wajib diisi!`);
			event.preventDefault();
			return;
		}
	}

	if (['number', 'integer', 'decimal', 'currency'].includes(fieldType)) {
		if (val !== '' && val !== null && val !== undefined && isNaN(Number(val))) {
			setSyncStatus('error', `${columnLabel} hanya boleh berisi angka!`);
			event.preventDefault();
			return;
		}

		if (fieldType === 'currency' && val !== '' && Number(val) < 0) {
			setSyncStatus('error', `${columnLabel} tidak boleh bernilai negatif!`);
			event.preventDefault();
			return;
		}
	}

	if (fieldType === 'date' && val) {
		const timestamp = Date.parse(val);
		if (isNaN(timestamp)) {
			setSyncStatus('error', `Format tanggal pada ${columnLabel} tidak valid!`);
			event.preventDefault();
			return;
		}
	}
}


const afterEdit = async (event) => {
	if (event.detail.oldValue === event.detail.value) return
	const updatedModel = event.detail.model
	const recordId = updatedModel[primaryKey.value]
	if (!recordId) return

	setSyncStatus('loading', 'Memperbarui..')
	try {
		await api.put(`/${formKey.value}/update`, updatedModel, {
			params: { id: recordId }
		})

		setSyncStatus('success', 'Perubahan disimpan')

	} catch (err: any) {
		console.error('[Api] Gagal auto-save:', err)
		setSyncStatus('error', `Gagal memperbarui: ${err.response?.data?.message || err.message}`)
	}
}

const handleKeyDown = async (e) => {
	if (e.repeat) return

	if (e.key === 'Delete') {
		handleDeleteKey()
		e.preventDefault()
		return
	}

	if (e.altKey && e.key === 'ArrowLeft') { navigatorRef.value?.scrollToFirstCol(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowRight') { navigatorRef.value?.scrollToLastCol(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowDown') { navigatorRef.value?.scrollToLastRow(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowUp') { navigatorRef.value?.scrollToFirstRow(); e.preventDefault(); return; }

	const { column } = await getActiveCellState(gridRef)

	if (!column?._primary && column?._type !== 'relation') return

	if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
		cariDataDenganKarakter(e.key)
		e.preventDefault()
	}
}


const handleAddNewRow = async () => {
	if (!permission.value.create) {
		alert('Anda tidak memiliki akses untuk menambah data!')
		return
	}

	setSyncStatus('loading', 'Menambah baris..')
	try {
		await api.post(`/${formKey.value}/create`, {})
		setSyncStatus('success', 'Baris baru ditambahkan')
		//scroll to last data row
	} catch (err: any) {
		console.error("[Api] Gagal menambahkan baris baru:", err)
		setSyncStatus('error', `Gagal menambah baris: ${err.message}`)
	}
}
const handleDeleteKey = async () => {
	if (!permission.value.delete) return

	const { model } = await getActiveCellState(gridRef)
	const recordId = model?.[primaryKey.value]

	if (!recordId) {
		console.log('[handleDeleteKey] No record selected for deletion')
		return
	}

	if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
		setSyncStatus('loading', 'Menghapus..')
		try {
			await api.delete(`/${formKey.value}/delete`, {
				params: { id: recordId }
			})

			setSyncStatus('success', 'Data berhasil dihapus')
		} catch (err: any) {
			console.error("[Api] Gagal menghapus data:", err)
			setSyncStatus('error', `Gagal menghapus: ${err.response?.data?.message || err.message}`)
		}
	}
}

const handleFilterChanged = (filter) => {
	activeFilters.value = filter
	fetchGridData()
}

const focusBackToGrid = () => {
	gridSelectSingleCell(gridRef, { rowIndex: 0, colIndex: 0 })
}

const cariDataDenganKarakter = async (char) => {
	searchQuery.value = char
	showSearchModal.value = true
	await nextTick()
	searchInputRef.value?.focus()
}

const handleSearchSubmit = () => {
	const value = searchQuery.value.trim()
	if (!value) return

	const quickFilterRow = {
		field: primaryKey.value || 'id',
		operator: 'contains' as const,
		value: value,
		valueTo: ''
	}

	const currentRoute = props.menu?.route || route.path
	filterStore.setFilters(currentRoute, [quickFilterRow])
	handleFilterChanged([quickFilterRow])
	closeSearchModal()
}

const closeSearchModal = () => {
	showSearchModal.value = false
	searchQuery.value = ''
	focusBackToGrid()
}

const handlePrint = () => { window.print() }
const handleExport = () => { console.log("[Action] Ekspor data ke CSV/Excel...", rows.value) }

watch(() => props.schemaData, loadComponentData)

watch(() => tabStore.activeTabId, async (activeTabId) => {
	if (activeTabId === props.menu?.route) {

		const currentRoute = props.menu?.route || route.path
		activeFilters.value = filterStore.getFiltersByTab(currentRoute) || {}
		focusBackToGrid()
	}
}, { immediate: false })

// 🟢 Hook Realtime Sync menggunakan formKey & applyResponseData
useRealtimeSync(formKey, applyResponseData, gridRef)

onMounted(() => {
	loadComponentData()
})

onBeforeUnmount(() => {
	if (activeTimeoutId) clearTimeout(activeTimeoutId)

	rows.value = []
	columns.value = []
})
</script>

<style scoped>
:deep(revo-grid) {
	z-index: 10 !important;
}
</style>