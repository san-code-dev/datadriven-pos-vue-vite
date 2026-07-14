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
						<span>items,</span>
					</div>

					<span>terakhir diubah
						<span class="text-slate-400 dark:text-slate-500">{{ lastUpdatedText }}</span>,
						<span @click="showLogModal = true"
							class="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium cursor-pointer hover:underline transition-colors ml-1">
							Log Audit
						</span>
					</span>
					<div class="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700 ">
						<template v-if="syncStatus.state === 'loading'">
							<Icon icon="heroicons:arrow-path-20-solid"
								class="w-3.5 h-3.5 animate-spin text-emerald-500" />
							<span class="text-slate-500 dark:text-slate-400">
								{{ syncStatus.message }}
							</span>
						</template>

						<template v-if="syncStatus.state === 'success'">
							<Icon icon="heroicons:check-circle-20-solid" class="w-3.5 h-3.5 text-emerald-500" />
							<span class="text-emerald-600 dark:text-emerald-400 font-medium">{{ syncStatus.message
							}}</span>
						</template>

						<template v-if="syncStatus.state === 'error'">
							<Icon icon="heroicons:exclamation-circle-20-solid" class="w-3.5 h-3.5 text-rose-500" />
							<span class="text-rose-600 dark:text-rose-400 font-medium animate-pulse">{{
								syncStatus.message }}</span>
						</template>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<button v-if="permission.create" @click="handleAddNewRow" type="button" class="btn-action-slate"
						:disabled="syncStatus.state === 'loading'">
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

					<button @click="fetchGridData" type="button" class="btn-action-slate">
						<template v-if="syncStatus.state === 'loading'">
							<Icon icon="heroicons:arrow-path-20-solid"
								class="w-3.5 h-3.5 animate-spin text-emerald-500" />
						</template>
						<template v-else>
							<Icon icon="heroicons:arrow-path-20-solid" class="w-3.5 h-3.5" />
						</template>
						<span>Refresh</span>
					</button>
				</div>
			</div>

		</div>
		<AuditLogDialog :isOpen="showLogModal" :tableName="props.schemaData?.key || 'Product'"
			@close="showLogModal = false" />
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

import axios from 'axios'
import { useTabStore } from '@/stores/tabs'
import { useFilterStore } from '@/stores/filter'
import { useRoute } from 'vue-router'

import NumberColumnType from '@revolist/revogrid-column-numeral'
import SelectTypePlugin from '@revolist/revogrid-column-select'
import DateTypePlugin from '@revolist/revogrid-column-date'
import AuditLogDialog from '@/components/AuditLogDialog.vue'

const showLogModal = ref(false)
const props = defineProps({
	menu: { type: Object, required: true },
	schemaData: { type: Object, required: true }
})

const route = useRoute()
const tabStore = useTabStore()
const filterStore = useFilterStore()

const gridRef = ref(null)
const navigatorRef = ref(null)
const columns = ref([])
const rows = ref([])
const primaryKey = ref('id')
const permission = ref<Record<string, boolean | undefined>>({})

const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

const activeFilters = ref(filterStore.getFiltersByTab(props.menu?.route || route.path) || {})

const syncStatus = ref({ state: 'idle', message: '' })
const lastUpdatedText = ref('baru saja')
let lastUpdatedTimer = null
let statusResetTimeout = null
let activeTimeoutId = null

const relationOptions = ref<{ [entityName: string]: Array<{ value: any, label: string }> }>({})

// 🟢 BASE URL AGNOSTIC (Misal: /product)
const formKey = computed(() => {
	return props.menu.key.toLowerCase()
})

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

const relationCellRenderer = (createElement, cellProps, displayField, fieldKey, optionsList) => {
	const rawValue = cellProps.model[fieldKey]
	if (!rawValue) return createElement('span', {}, '')

	if (typeof rawValue === 'object' && rawValue !== null) {
		return createElement('span', {}, rawValue[displayField] || rawValue.name || '')
	}

	const matchedOption = optionsList.find(opt => opt.value === rawValue)
	return createElement('span', {}, matchedOption ? matchedOption.label : rawValue)
}

let apiLoadingTimeout = null

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

const formatRelativeTime = (timestamp) => {
	if (!timestamp) return 'belum ada riwayat'
	const now = new Date()
	const diffInSeconds = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000)

	if (diffInSeconds < 30) return 'baru saja'
	if (diffInSeconds < 60) return `${diffInSeconds} detik lalu`

	const diffInMinutes = Math.floor(diffInSeconds / 60)
	if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`

	const diffInHours = Math.floor(diffInMinutes / 60)
	if (diffInHours < 24) return `${diffInHours} jam lalu`

	return new Date(timestamp).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	})
}

const fetchLastAuditTimestamp = async () => {
	const tableName = props.schemaData?.key || 'Product'
	try {
		const response = await axios.get('/audit-logs/get-all', { params: { tableName } })
		const logs = response.data?.schema?.data || response.data?.data || []

		if (logs.length > 0) {
			const latestLog = logs[0]
			const targetTime = latestLog.created_at || latestLog.createdAt || latestLog.date

			if (lastUpdatedTimer) clearInterval(lastUpdatedTimer)
			lastUpdatedText.value = formatRelativeTime(targetTime)

			lastUpdatedTimer = setInterval(() => {
				lastUpdatedText.value = formatRelativeTime(targetTime)
			}, 30000)
		} else {
			lastUpdatedText.value = 'belum pernah diubah'
		}
	} catch (err) {
		console.error('Gagal mengambil data timestamp audit:', err)
		lastUpdatedText.value = 'gagal memuat'
	}
}

const fetchRelationOptions = async () => {
	const schema = props.schemaData?.schema || []
	const relationFields = schema.filter(f => f.type === 'relation' && f.relation)

	for (const field of relationFields) {
		const entity = field.relation.entity
		const displayField = field.relation.displayField || 'name'
		if (relationOptions.value[entity]) continue

		try {
			const response = await axios.get(`/${entity}/get-all`)
			const rawData = response.data?.schema?.data || response.data?.data || []
			relationOptions.value[entity] = rawData.map((item: any) => ({
				value: item.id,
				label: item[displayField] || item.name
			}))
		} catch (err) {
			console.error(`Gagal memuat opsi relasi untuk entitas ${entity}:`, err)
		}
	}
}

// 🟢 GET ALL: Sesuai dynamic controller GET /:form_key/get-all?where=...
const fetchGridData = async () => {
	setSyncStatus('loading', 'Mengambil data..')
	try {
		const response = await axios.get(`/${formKey.value}/get-all`, {
			params: {
				where: activeFilters.value
			}
		})

		const freshData = response.data?.schema?.data || response.data?.data || []

		rows.value = [...freshData]

		if (tabStore.activeTabId === props.menu?.route) {
			const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
			if (currentTab?.apiResponse) {
				currentTab.apiResponse.data = [...freshData]
			}
		}
		getGrid().requestGridRowsRedraw?.()
		setSyncStatus('success', 'Selesai sinkronisasi')
		fetchLastAuditTimestamp()
	} catch (err: any) {
		console.error("Gagal sinkronisasi data dengan server:", err)
		setSyncStatus('error', `Gagal memuat: ${err.message || 'Server Error'}`)
	}
}

const loadComponentData = async () => {
	const res = props.schemaData
	if (!res) return

	await fetchRelationOptions()

	columns.value = (res.schema || []).map(field => {
		const columnConfig: Record<string, any> = {
			prop: field.key,
			name: field.label,
			readonly: field.readonly || false,
			required: field.required || false,
			_type: field.type || 'text',
			_autoIncrementOnDuplicate: field.autoIncrementOnDuplicate || false,
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

	rows.value = res.data ? [...res.data] : []
	primaryKey.value = (res.schema || []).find(f => f.primary)?.key || 'id'
	permission.value = res.permissions || {}
	fetchLastAuditTimestamp()

	await nextTick()

	if (activeTimeoutId) clearTimeout(activeTimeoutId)
	activeTimeoutId = setTimeout(() => {
		if (rows.value.length > 0) navigatorRef.value?.scrollToLastRow()

		const grid = getGrid()
		if (typeof grid.focus === 'function') grid.focus()
		else if (grid.setAttribute) {
			grid.setAttribute('tabindex', '0')
			grid.focus()
		}
	}, 100)
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

// 🟢 UPDATE: Sesuai dynamic controller PUT /:form_key/update?id=:id dengan Body Payload
const afterEdit = async (event) => {
	if (event.detail.oldValue === event.detail.value) return

	const updatedModel = event.detail.model
	const recordId = updatedModel[primaryKey.value]
	if (!recordId) return

	setSyncStatus('loading', 'Memperbarui..')
	try {
		// PUT /product/update?id=12 -> argumen ke-1: id=12 (dari query), argumen ke-2: updatedModel (dari req.body)
		const response = await axios.put(`/${formKey.value}/update`, updatedModel, {
			params: { id: recordId }
		})

		if (response.status === 200) {
			console.log('Auto-save berhasil.')
			const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
			if (currentTab?.apiResponse) {
				const targetIdx = currentTab.apiResponse.data.findIndex(item => item[primaryKey.value] === recordId)
				if (targetIdx !== -1) currentTab.apiResponse.data[targetIdx] = { ...updatedModel }
			}
			setSyncStatus('success', 'Perubahan disimpan')
			fetchLastAuditTimestamp()
		}
	} catch (err: any) {
		console.error('Gagal auto-save:', err)
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

	const { y, column } = await getActiveCellState()

	if (e.key === 'ArrowDown') { handleArrowDown(y); return; }
	if (e.key === 'ArrowUp') { handleArrowUp(y); return; }

	if (!column?._primary && column?._type !== 'relation') return

	if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
		cariDataDenganKarakter(e.key)
		e.preventDefault()
	}
}

const handleMouseDown = (e) => {
	if (e.ctrlKey && e.button === 0) {
		console.log('CTRL + Click terdeteksi, membuka detail data...')
		e.preventDefault()
	}
}

const handleArrowDown = (currentY) => {
	if (currentY === rows.value.length - 1) console.log('ARROW DOWN di baris terakhir')
}

const handleArrowUp = (currentY) => {
	if (currentY === 0) console.log('ARROW UP di baris pertama')
}

// 🟢 CREATE: Sesuai dynamic controller POST /:form_key/create dengan Body Payload kosong {}
const handleAddNewRow = async () => {
	if (!permission.value.create) {
		alert('Anda tidak memiliki akses untuk menambah data!')
		return
	}

	setSyncStatus('loading', 'Memperbarui..')
	try {
		// POST /product/create -> argumen: body (dari req.body)
		const response = await axios.post(`/${formKey.value}/create`, {})

		if (response.status === 201 || response.status === 200) {
			const serverNewData = response.data.data || response.data
			rows.value = [...rows.value, serverNewData]

			const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
			if (currentTab?.apiResponse) {
				currentTab.apiResponse.data = [...currentTab.apiResponse.data, serverNewData]
			}

			await nextTick()

			const grid = getGrid()
			grid.requestGridRowsRedraw?.()

			const lastRowIndex = rows.value.length - 1
			grid.setCellsFocus?.({ x: 1, y: lastRowIndex }, { x: 1, y: lastRowIndex })

			setTimeout(() => { navigatorRef.value?.scrollToLastRow?.() }, 50)
			setSyncStatus('success', 'Baris baru ditambahkan')
			fetchLastAuditTimestamp()
		}
	} catch (err: any) {
		console.error("Gagal menambahkan baris baru:", err)
		setSyncStatus('error', `Gagal menambah baris: ${err.message}`)
	}
}

// 🟢 DELETE: Sesuai dynamic controller DELETE /:form_key/delete?id=:id
const handleDeleteKey = async () => {
	if (!permission.value.delete) return

	const { y: targetIndex } = await getActiveCellState()
	const selectedData = rows.value[targetIndex]
	const recordId = selectedData?.[primaryKey.value]

	if (!recordId) return

	if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
		setSyncStatus('loading', 'Menghapus..')
		try {
			// DELETE /product/delete?id=12 -> argumen: id=12 (dari query)
			const response = await axios.delete(`/${formKey.value}/delete`, {
				params: { id: recordId }
			})

			if ([200, 204].includes(response.status)) {
				const updatedRows = rows.value.filter((_, index) => index !== targetIndex)
				rows.value = [...updatedRows]

				await nextTick()
				const grid = getGrid()
				grid.requestGridRowsRedraw?.()

				const nextY = Math.max(0, targetIndex - 1)
				grid.setCellsFocus?.({ x: 0, y: nextY }, { x: 0, y: nextY })

				setSyncStatus('success', 'Data berhasil dihapus')
				fetchLastAuditTimestamp()
			}
		} catch (err: any) {
			console.error("Gagal menghapus data:", err)
			setSyncStatus('error', `Gagal menghapus: ${err.response?.data?.message || err.message}`)
		}
	}
}

const handleFilterChanged = (filter) => {
	activeFilters.value = filter
	fetchGridData()
}

const focusBackToGrid = () => {
	nextTick(async () => {
		const grid = getGrid()
		if (!grid.setCellsFocus) return

		const { x, y } = await getActiveCellState()
		grid.setCellsFocus({ x, y }, { x, y })

		const internalInput = grid.querySelector?.('.revo-clipboard, input, [tabindex="0"]')
		if (internalInput) internalInput.focus()
		else grid.focus?.()
	})
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
	nextTick(() => { getGrid().focus?.() })
}

const handleWindowFocus = () => {
	if (document.visibilityState === 'visible' && tabStore.activeTabId === props.menu?.route) {
		fetchGridData()
	}
}

const handlePrint = () => {
	window.print()
}

const handleExport = () => {
	console.log("Ekspor data ke CSV/Excel...", rows.value)
}

onBeforeUnmount(() => {
	if (activeTimeoutId) clearTimeout(activeTimeoutId)
	if (lastUpdatedTimer) clearInterval(lastUpdatedTimer)
	if (statusResetTimeout) clearTimeout(statusResetTimeout)
	document.removeEventListener('visibilitychange', handleWindowFocus)

	getGrid().removeEventListener?.('mousedown', handleMouseDown)

	rows.value = []
	columns.value = []
	console.log('Memory cleared perfectly.')
})

watch(() => props.schemaData, loadComponentData)

onMounted(() => {
	loadComponentData()
	getGrid().addEventListener?.('mousedown', handleMouseDown)
	document.addEventListener('visibilitychange', handleWindowFocus)
})

watch(() => tabStore.activeTabId, async (activeTabId) => {
	if (activeTabId === props.menu?.route) {
		await nextTick()

		if (activeTimeoutId) clearTimeout(activeTimeoutId)
		activeTimeoutId = setTimeout(async () => {
			const grid = getGrid()
			if (!grid.requestColumnsRedraw) return

			grid.requestColumnsRedraw()

			const currentRoute = props.menu?.route || route.path
			activeFilters.value = filterStore.getFiltersByTab(currentRoute) || {}

			await fetchGridData()

			const { x, y } = await getActiveCellState()
			grid.setCellsFocus?.({ x, y }, { x, y })
			grid.scrollToRow?.(y)

			const clipboardInput = grid.querySelector?.('.revo-clipboard, input, [tabindex="0"]')
			if (clipboardInput) clipboardInput.focus()
			else grid.focus?.()
		}, 0)
	}
}, { immediate: true })
</script>

<style scoped>
:deep(revo-grid) {
	z-index: 10 !important;
}
</style>