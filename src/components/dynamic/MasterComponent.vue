<template>
	<div class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-transparent w-full">

		<div
			class="flex flex-col p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors gap-4">

			<div class="w-full">
				<DynamicFilter v-if="props.schemaData?.schema" :schema="props.schemaData.schema"
					:event-detail="selectDialogEventDetail" :tabId="props.menu?.route || 'master'"
					@filter-changed="handleFilterChanged" @escape-filter="focusBackToGrid"
					@open-select-dialog="handleOpenSelectDialog" />
			</div>

			<div
				class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60">

				<div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 select-none">

					<div>
						<button @click="fetchGridData" type="button" class="btn-action-slate"
							:disabled="syncStatusRef?.syncStatus.state === 'loading'">
							<span class="flex justify-center items-center gap-1">
								<Icon icon="cuida:refresh-outline" /> Refresh
							</span>
						</button>
					</div>

					<div class="relative">

						<Icon icon="mdi:magnify"
							class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors peer-focus:text-emerald-500" />



						<input ref="searchInputRef" type="search" @focus="handleFocus"
							class="peer filter-input data-val text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
							placeholder="Ctrl + / cari lalu enter"
							@search="($event.target as HTMLInputElement).value === '' ? fetchGridData() : null"
							@keydown.enter.prevent="searchData(($event.target as HTMLInputElement).value)"
							@keydown.escape.prevent="focusBackToGrid()">

					</div>


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

					<RevoGrid hide-attribution ref="gridRef"
						class="cell-border w-full h-full max-h-full focus:outline-none" :columns="columns"
						:source="rows" :theme="isDark ? 'darkCompact' : 'compact'" :resize="true"
						:auto-size-column="true" @afteredit="afterEdit" @beforeedit="beforeEdit"
						@keydown="handleKeyDown" @beforeeditstart="beforeEditStart"
						@afterfocus="saveCurrentStateToStore" @aftercolumnresize="saveCurrentStateToStore"
						:column-types="columnTypes" :can-move-columns="true" :stretch="true" />

					<GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns" />

				</div>
			</div>
			<SelectDialog :schema-data="selectDialogDataSchema" :event-detail="selectDialogEventDetail"
				:relation-info="selectDialogRelationInfo" :context="selectDialogContext" :is-open="isSelectDialogOpen"
				@close="closeSelectDialog" @select="selectDialogSelectData" />
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
import { useTenantStore } from '@/stores/tenant'
import { useRoute } from 'vue-router'

import NumberColumnType from '@revolist/revogrid-column-numeral'
import SelectTypePlugin from '@revolist/revogrid-column-select'
import DateTypePlugin from '@revolist/revogrid-column-date'
import { useRealtimeSync } from '@/composables/useRealtimeSync'
import { getActiveCellState } from '@/composables/grid'

const selectDialogDataSchema = ref<any>(null)
const selectDialogRelationInfo = ref<any>(null)
const selectDialogEventDetail = ref<any>(null)
const selectDialogContext = ref<'filter' | 'data' | 'relation' | 'form' | null>(null)

const isSelectDialogOpen = ref(false)

const props = defineProps({
	menu: { type: Object, required: true },
	schemaData: { type: Object, required: true }
})

const COLOR_UPDATE = 'rgba(59, 130, 246, 0.45)' // Biru
const COLOR_CREATE = 'rgba(34, 197, 94, 0.45)'  // Hijau
const COLOR_DELETE = 'rgba(239, 68, 68, 0.45)'  // Merah

const route = useRoute()
const tabStore = useTabStore()
const filterStore = useFilterStore()
const tenantStore = useTenantStore()

const gridRef = ref<any>(null)
const navigatorRef = ref<any>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const columns = ref<any[]>([])
const rows = ref<any[]>([])
const primaryKey = ref('id')
const permission = ref<Record<string, boolean | undefined>>({})

// 🟢 MEMORY MANAGEMENT: Lacak seluruh active setTimeout agar bisa dibersihkan saat unmount
const activeTimeouts = new Set<ReturnType<typeof setTimeout>>()

const safeSetTimeout = (fn: Function, delay: number) => {
	const timer = setTimeout(() => {
		fn()
		activeTimeouts.delete(timer)
	}, delay)
	activeTimeouts.add(timer)
	return timer
}

const syncStatusRef = ref<InstanceType<typeof SyncStatus> | null>(null)

const setSyncStatus = (state: any, message: string, autoResetDelay = 3000) => {
	syncStatusRef.value?.setStatus(state, message, autoResetDelay)
}

const activeFilters = ref(filterStore.getFiltersByTab(props.menu?.route || route.path) || {})
const relationOptions = ref<{ [entityName: string]: Array<{ value: any, label: string }> }>({})

const formKey = computed(() => {
	return props.menu.key.toLowerCase()
})

const columnTypes = {
	numeric: new NumberColumnType('0'),
	decimal: new NumberColumnType('0,0'),
	select: new SelectTypePlugin(),
	date: new DateTypePlugin()
}

// 🟢 APPLY RESPONSE DATA
const applyResponseData = async (serverData: any) => {
	if (!serverData) return

	if (serverData.action && serverData.id) {
		await handleRealtimeMutation(serverData.action, serverData.id)
		return
	}

	let incomingRows: any[] = []

	if (Array.isArray(serverData)) {
		incomingRows = serverData
	} else if (Array.isArray(serverData.data)) {
		incomingRows = serverData.data
	} else if (serverData.schema && Array.isArray(serverData.schema.data)) {
		incomingRows = serverData.schema.data
	} else if (typeof serverData === 'object' && !serverData.success) {
		incomingRows = [serverData]
	}

	rows.value = [...incomingRows]

	if (tabStore.activeTabId === props.menu?.route) {
		const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
		if (currentTab?.apiResponse) {
			currentTab.apiResponse.data = [...rows.value]
		}
	}
}

// 🟢 SAFE GRID RENDER: Dengan timeout fallback untuk cegah listener menggantung jika render batal
const waitForGridRender = (): Promise<void> => {
	return new Promise((resolve) => {
		const gridEl = gridRef.value?.$el
		if (!gridEl) return resolve()

		let safetyTimer: ReturnType<typeof setTimeout> | null = null

		const handleRender = () => {
			if (safetyTimer) clearTimeout(safetyTimer)
			gridEl.removeEventListener('afterrender', handleRender)
			resolve()
		}

		safetyTimer = setTimeout(() => {
			gridEl.removeEventListener('afterrender', handleRender)
			resolve()
		}, 300)

		gridEl.addEventListener('afterrender', handleRender)
	})
}

// 🟢 SAFE FLASH ROW: Mencegah error/leak jika komponen di-unmount saat animasi berjalan
function flashRowDirectly(rowIndex: number, color: string = 'rgba(59, 130, 246, 0.45)', duration: number = 300) {
	if (!gridRef.value?.$el) return

	const gridEl = gridRef.value.$el
	const shadowRoot = gridEl.shadowRoot || gridEl
	const cells = shadowRoot.querySelectorAll(`[data-rgrow="${rowIndex}"]`)

	if (cells && cells.length > 0) {
		cells.forEach((cell: Element) => {
			const htmlCell = cell as HTMLElement

			htmlCell.style.transition = 'background-color 0.05s ease-in-out'
			htmlCell.style.backgroundColor = color

			safeSetTimeout(() => {
				if (htmlCell) {
					htmlCell.style.backgroundColor = ''
				}
			}, duration)
		})
	}
}

const handleRealtimeMutation = async (action: 'CREATE' | 'UPDATE' | 'DELETE', id: number) => {
	if (action === 'DELETE') {
		const index = rows.value.findIndex((row: any) => row[primaryKey.value] === id)
		if (index !== -1) {
			flashRowDirectly(index, COLOR_DELETE, 100)
			safeSetTimeout(() => {
				rows.value = rows.value.filter((row: any) => row[primaryKey.value] !== id)
			}, 125)
		}
		return
	}

	try {
		const response = await api.get(`/${formKey.value}/get-by-id`, {
			params: { id }
		})

		const updatedRecord = response.data
		if (!updatedRecord) return

		const index = rows.value.findIndex((row: any) => row[primaryKey.value] === id)

		if (index !== -1) {
			const renderPromise = waitForGridRender()
			rows.value[index] = { ...rows.value[index], ...updatedRecord }
			rows.value = [...rows.value]
			await renderPromise
			flashRowDirectly(index, COLOR_UPDATE, 100)
		} else {
			const renderPromise = waitForGridRender()
			rows.value = [...rows.value, updatedRecord]
			await renderPromise

			const newIndex = rows.value.findIndex((row: any) => row[primaryKey.value] === id)
			if (newIndex !== -1) {
				flashRowDirectly(newIndex, COLOR_CREATE, 100)
			}
		}
	} catch (err) {
		console.warn(`[Realtime] Gagal mengambil detail ID ${id}, melakukan fallback fetch grid.`, err)
		await fetchGridData()
	}
}

const fetchGridData = async () => {
	searchInputRef.value.value = ''
	setSyncStatus('loading', 'Mengambil data..')
	try {
		const response = await api.get(`/${formKey.value}/get-all`, {
			params: {
				filter: JSON.stringify(activeFilters.value)
			}
		})

		applyResponseData(response.data)
		if (activeFilters.value && Object.keys(activeFilters.value).length > 0) {
			setSyncStatus('success', 'Menampilkan hasil filter')
		} else {
			setSyncStatus('success', 'Semua data ditampilkan')
		}
		await nextTick()
		focusBackToGrid()
	} catch (err: any) {
		console.error("[Api] Gagal sinkronisasi data dengan server:", err)
		setSyncStatus('error', `Gagal memuat: ${err.message || 'Server Error'}`)
	}
}

const searchData = async (e: Event | string) => {
	// Ambil nilai string baik dari Event maupun string langsung
	const keyword = typeof e === 'string' ? e : (e.target as HTMLInputElement).value

	setSyncStatus('loading', 'Mencari data..')
	try {
		const response = await api.get(`/${formKey.value}/search-data`, {
			params: { keyword }
		})

		applyResponseData(response.data)
		await nextTick()
		focusBackToGrid()
		setSyncStatus('success', 'Hasil pencarian ditampilkan')

	} catch (err: any) {
		console.error("[searchData] Gagal mencari data server:", err)
		setSyncStatus('error', `Gagal memuat: ${err.message || 'Server Error'}`)
	}
}


const loadComponentData = async () => {
	const res = props.schemaData
	if (!res) return
	applyResponseData(res)

	const savedColumnsConfig = currentGridConfig.value?.column || []

	columns.value = (res.schema || []).map((field: any) => {
		const savedCol = savedColumnsConfig.find((c: any) => c.key === field.key)

		const columnConfig: Record<string, any> = {
			prop: field.key,
			name: field.label,
			size: savedCol ? savedCol.size : field.size,
			readonly: field.readonly || false,
			required: field.required || false,
			_type: field.type || 'text',
			_autoIncrementOnDuplicate: field.autoIncrementOnDuplicate || false,
			_primary: field.primary || false,
		}

		if (['number', 'integer'].includes(field.type)) {
			columnConfig.columnType = 'numeric'
			columnConfig.editor = 'number'
		} else if (['decimal', 'currency'].includes(field.type)) {
			columnConfig.editor = 'number'
			columnConfig.columnType = 'decimal'
		} else if (field.type === 'date') {
			columnConfig.columnType = 'date'
		} else if (field.type === 'select') {
			columnConfig.columnType = 'select'
			columnConfig.labelKey = 'label'
			columnConfig.valueKey = 'value'
			columnConfig.appendTo = 'body'
			columnConfig.source = field.options || []
			columnConfig.editorProperties = { appendToBody: true }
		} else if (field.type === 'relation' && field.relation) {
			const entity = field.relation.entity
			columnConfig.columnType = 'select'
			columnConfig.labelKey = 'label'
			columnConfig.valueKey = 'value'
			columnConfig.source = relationOptions.value[entity] || []
			columnConfig.appendTo = 'body'
			columnConfig.editorProperties = { appendToBody: true }
		}
		return columnConfig
	})

	primaryKey.value = (res.schema || []).find((f: any) => f.primary)?.key || 'id'
	permission.value = res.permissions || {}
	await nextTick()
	focusBackToGrid()
}

const beforeEdit = (event: any) => {
	const { val, prop } = event.detail;
	const originalField = props.schemaData?.schema?.find((f: any) => f.key === prop);
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

const beforeEditStart = async (event: any) => {
	const { prop } = event.detail;
	const originalField = props.schemaData?.schema?.find((f: any) => f.key === prop);
	if (!originalField) return;

	const fieldType = originalField.type;

	if (fieldType === 'relation') {
		event.preventDefault()
		handleOpenSelectDialog({
			keyword: '',
			context: 'relation',
			eventDetail: event.detail,
			relationInfo: {
				entity: originalField.entity,
				entityKey: originalField.entityKey,
				entityKeySetTo: originalField.entityKeySetTo,
				fieldsToShow: originalField.fieldsToShow,
			}
		})
	}
}

const afterEdit = async (event: any) => {
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
		const errorMessage = err.customMessage || err.message || 'Gagal memperbarui'
		await fetchGridData()
		setSyncStatus('error', errorMessage)
	}
}


const handleGlobalKeyDown = (e: KeyboardEvent) => {

	if (e.key === '/' && e.ctrlKey) {
		e.preventDefault()
		clearGridFocus()
		searchInputRef.value?.focus()
	}
}

const handleKeyDown = async (e: KeyboardEvent) => {
	if (e.repeat) {
		if (e.key === 'Enter') {
			e.preventDefault()
			e.stopPropagation()
		}
		return
	}

	const target = e.target as HTMLElement
	if (
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.isContentEditable
	) {
		return
	}

	if (e.key === 'Delete') {
		handleDeleteKey()
		e.preventDefault()
		return
	}

	if (e.altKey && e.key === 'ArrowLeft') { navigatorRef.value?.scrollToFirstCol(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowRight') { navigatorRef.value?.scrollToLastCol(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowDown') { navigatorRef.value?.scrollToLastRow(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowUp') { navigatorRef.value?.scrollToFirstRow(); e.preventDefault(); return; }
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
	} catch (err: any) {
		console.error("[Api] Gagal menambahkan baris baru:", err)
		setSyncStatus('error', `Gagal menambah baris: ${err.message}`)
	}
}

const handleDeleteKey = async () => {
	if (!permission.value.delete) return

	const { model } = await getActiveCellState(gridRef)
	const recordId = model?.[primaryKey.value]

	if (!recordId) return

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

async function handleOpenSelectDialog({
	keyword,
	context,
	eventDetail,
	relationInfo,
}: {
	keyword?: string,
	eventDetail?: any,
	context?: 'filter' | 'data' | 'relation',
	relationInfo: any
}) {
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

const selectDialogSelectData = async (selectedData: any, context: any, relationInfo: any, eventDetail: any) => {
	if (!selectedData || !relationInfo || !context) {
		console.error('[selectDialogSelectData] Data tidak lengkap:', {
			selectedData,
			context,
			relationInfo
		})
		return
	}
	if (context === 'filter') {
		alert('not implemented')
	}
	if (context === 'relation') {
		const selectedValue = selectedData[relationInfo.entityKey]

		if (!gridRef.value?.$el) {
			console.error('[selectDialogSelectData] grid not found')
			return;
		}

		const updatedModel = { ...eventDetail.model, [relationInfo.entityKeySetTo]: selectedValue }
		await afterEdit({
			detail: {
				model: updatedModel
			}
		})
	}
	closeSelectDialog()
}

const closeSelectDialog = () => {
	isSelectDialogOpen.value = false
	focusBackToGrid()
}

const handleFilterChanged = (filter: any) => {
	activeFilters.value = filter
	fetchGridData()
}

const handleFocus = (event: FocusEvent) => {
	const input = event.target as HTMLInputElement
	input.select()
}

const focusBackToGrid = async () => {
	if (!gridRef.value?.$el) return

	await waitForGridRender()

	const grid = gridRef.value?.$el
	if (!grid) return

	grid.focus?.()

	const startCoord = currentGridConfig.value?.coordinate || { x: 0, y: 0 }
	grid.setCellsFocus?.(startCoord, startCoord)
}
const clearGridFocus = () => {
	try {
		const gridEl = gridRef.value?.$el
		if (gridEl) {
			// Hapus fokus dari shadow root / element aktif jika ada
			if (typeof gridEl.clearFocus === 'function') {
				gridEl.clearFocus()
			}
			if (typeof gridEl.blur === 'function') {
				gridEl.blur()
			}
		}
		// Pastikan fokus kembali ke document body agar tidak mengendap di Web Component
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur()
		}
	} catch (err) {
		// Mencegah unmount crash jika method RevoGrid sudah tidak terjangkau
		console.warn('[Grid] Error clearing focus during unmount:', err)
	}
}

const handlePrint = () => { window.print() }
const handleExport = () => { console.log("[Action] Ekspor data ke CSV/Excel...", rows.value) }

// --- STATE & CONFIG STORAGE PINIA ---
const currentGridKey = computed(() => `${tenantStore.selectedTenant?.code}-${formKey.value}-master_grid`)

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
		column: columns.value.map((col: any) => ({ key: col.prop, size: col.size }))
	}

	let updatedCoordinate = { ...existingConfig.coordinate }
	let updatedColumns = [...columns.value]

	if ('rowIndex' in detail && 'colIndex' in detail) {
		updatedCoordinate = {
			x: detail.colIndex,
			y: detail.rowIndex
		}
	}

	const resizedKeys = Object.keys(detail)
	const isResizeEvent = resizedKeys.some(key => !isNaN(Number(key)) && detail[key]?.prop)

	if (isResizeEvent) {
		updatedColumns = columns.value.map((col: any) => {
			for (const key of resizedKeys) {
				const resizedCol = detail[key]
				if (resizedCol && resizedCol.prop === col.prop) {
					return { ...col, size: resizedCol.size }
				}
			}
			return col
		})
	}

	tabStore.updateGridConfig(tabStore.activeTabId, currentGridKey.value, {
		coordinate: updatedCoordinate,
		column: updatedColumns.map((col: any) => ({ key: col.prop, size: col.size }))
	})
}

const cleanupOnTabLeave = () => {
	clearGridFocus()
	window.removeEventListener('keydown', handleGlobalKeyDown)

	// Bersihkan timer/timeout jika ada
	activeTimeouts.forEach(timer => clearTimeout(timer))
	activeTimeouts.clear()
}

// 2. Fungsi berat saat TAB DITUTUP / UNMOUNT SUNGGUHAN
const destroyAll = () => {
	cleanupOnTabLeave()

	// Hanya kosongkan data jika komponen benar-benar di-unmount/dihapus
	rows.value = []
	columns.value = []
	relationOptions.value = {}

	selectDialogDataSchema.value = null
	selectDialogEventDetail.value = null
	selectDialogRelationInfo.value = null

	gridRef.value = null
	navigatorRef.value = null
}

watch(() => props.schemaData, async () => {
	loadComponentData()
})
// Watcher perpindahan tab
watch(() => tabStore.activeTabId, (newActiveTabId, oldActiveTabId) => {
	const currentTabRoute = props.menu?.route || route.path

	// KONDISI 1: Pengguna PINDAH TAB (Meninggalkan tab ini)
	if (oldActiveTabId === currentTabRoute && newActiveTabId !== currentTabRoute) {
		// Panggil cleanup ringan SAJA agar data 'rows' dan 'columns' tetap aman di memory
		cleanupOnTabLeave()
	}

	// KONDISI 2: Pengguna KEMBALI ke tab ini
	if (newActiveTabId === currentTabRoute) {
		activeFilters.value = filterStore.getFiltersByTab(currentTabRoute) || {}

		// Pasang kembali global event listener jika diperlukan
		window.addEventListener('keydown', handleGlobalKeyDown)

		focusBackToGrid()
	}
}, { immediate: false })
useRealtimeSync(formKey, applyResponseData, gridRef)
onBeforeUnmount(() => {
	destroyAll()
})
onMounted(async () => {
	loadComponentData()
	window.addEventListener('keydown', handleGlobalKeyDown)
})
</script>

<style scoped>
:deep(revo-grid) {
	z-index: 10 !important;
}
</style>