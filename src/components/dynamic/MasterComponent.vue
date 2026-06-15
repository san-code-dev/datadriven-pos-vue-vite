<template>
	<div class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-transparent w-full">

		<!-- KONTEN ATAS: FILTER & ACTION BAR -->
		<div
			class="flex flex-col p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors gap-4">

			<!-- 1. Area Full Width untuk Dynamic Filter -->
			<div class="w-full">
				<DynamicFilter v-if="props.schemaData?.schema" :schema="props.schemaData.schema"
					:tabId="props.menu?.route || 'master'" @filter-changed="handleFilterChanged"
					@escape-filter="focusBackToGrid" />
			</div>

			<!-- 2. Action Toolbar (Tempat Tombol-Tombol Aksi) -->
			<div
				class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">

				<!-- Sisi Kiri Toolbar: Tempat status info data jika diperlukan -->
				<div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
					<!-- Stat/info opsional -->
					awawawa
				</div>

				<!-- Sisi Kanan Toolbar: Kumpulan Tombol Aksi -->
				<div class="flex flex-wrap items-center gap-2">

					<!-- TOMBOL: TAMBAH BARIS -->
					<button v-if="permission.create" @click="handleAddNewRow" type="button"
						class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900">
						<Icon icon="heroicons:plus-20-solid" class="w-4 h-4" />
						<span>Tambah Baris</span>
						<kbd
							class="opacity-60 text-[9px] font-sans tracking-wide bg-emerald-700 px-1 py-0.5 rounded ml-0.5">F2</kbd>
					</button>

					<!-- TOMBOL: AKSES TERKUNCI -->
					<button v-else disabled type="button"
						class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 font-medium text-xs rounded-lg border border-slate-200/60 dark:border-slate-700/60 cursor-not-allowed">
						<Icon icon="heroicons:lock-closed-20-solid" class="w-4 h-4" />
						<span>Akses Terkunci</span>
					</button>

					<!-- ⏳ CONTOH TOMBOL AKSI BARU LAINNYA DI MASA DEPAN -->
					<!-- Tombol Export Excel -->
					<!-- 
                    <button type="button" class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg shadow-sm transition-all">
                        <Icon icon="heroicons:document-arrow-down-20-solid" class="w-4 h-4 text-slate-500" />
                        <span>Export Excel</span>
                    </button> 
                    -->

				</div>
			</div>

		</div>

		<!-- AREA GRID & MODAL DATA -->
		<div class="flex flex-1 min-h-0 w-full overflow-hidden">
			<div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
				<div class="flex-1 min-h-0 w-full relative group overflow-hidden z-10">

					<RevoGrid ref="gridRef" class="w-full h-full max-h-full focus:outline-none" :columns="columns"
						:source="rows" :theme="isDark ? 'darkCompact' : 'compact'" resize="true"
						@beforeeditstart.once="beforeEditStart" @beforeedit.once="beforeEdit" @afteredit="afterEdit"
						@afterfocus="afterFocus" @keydown="handleKeyDown" />

					<GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns"
						:focused-coordinate="focusedCoordinate" />

					<!-- MODAL PENCARIAN -->
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

<script setup>
import { Icon } from '@iconify/vue'

import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'
import DynamicFilter from '@/components/DynamicFilter.vue'

import api from '@/lib/axios'
import { useTabStore } from '@/stores/tabs'
import { useFilterStore } from '@/stores/filter' // 🟢 1. Import Filter Store Pinia
import { useRoute } from 'vue-router'            // 🟢 2. Import useRoute

const props = defineProps({
	menu: { type: Object, required: true },
	schemaData: { type: Object, required: true }
})

const route = useRoute()                         // 🟢 3. Definisikan instance route
const tabStore = useTabStore()
const filterStore = useFilterStore()             // 🟢 4. Definisikan instance filterStore

const gridRef = ref(null)
const navigatorRef = ref(null)
const columns = ref([])
const rows = ref([])
const primaryKey = ref('id')
const permission = ref({})
const focusedCoordinate = ref({ x: -1, y: -1 })
const focusedColumn = ref({})
const focusedRow = ref({})

const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)

// 🟢 5. ISI DATA AWAL dari Pinia Store, jangan biarkan {} kosong melompong agar first load aman
const activeFilters = ref(filterStore.getFiltersByTab(props.menu?.route || route.path) || {})

let savedGridEl = null
let behaviorTimeoutId = null
let focusTimeoutId = null
let watchTabTimeoutId = null


const relationCellRenderer = (createElement, props, displayField, fieldKey) => {
	const rowData = props.model[fieldKey]
	const displayText = rowData ? rowData[displayField] : ''
	return createElement('span', {}, displayText || '')
}

const removeGridListeners = () => {
	if (savedGridEl) {
		savedGridEl.removeEventListener('keydown', handleKeyDown)
		savedGridEl.removeEventListener('mousedown', handleMouseDown)
		savedGridEl = null
	}
}

const loadComponentData = async () => {
	const res = props.schemaData
	if (!res) return

	columns.value = []

	columns.value = (res.schema || []).map(field => {
		const columnConfig = {
			prop: field.key,
			name: field.label,
			readonly: field.readonly || false,
			size: field.label.length * 15,
			columnType: field.type === 'relation' ? 'display' : field.type,
			_type: field.type || 'text',
			_autoIncrementOnDuplicate: field.autoIncrementOnDuplicate || false,
			_primary: field.primary || false,
		}

		if (field.type === 'relation' && field.relation) {
			columnConfig.cellTemplate = (createElement, linkProps) =>
				relationCellRenderer(createElement, linkProps, field.relation.displayField, field.key)
		}
		return columnConfig
	})

	rows.value = res.data ? [...res.data] : []
	primaryKey.value = (res.schema || []).find(f => f.primary)?.key || 'id'
	permission.value = res.permissions || {}

	await nextTick()

	if (behaviorTimeoutId) clearTimeout(behaviorTimeoutId)
	behaviorTimeoutId = setTimeout(() => {
		setUpGridBehaviors()
	}, 100)
}

const setUpGridBehaviors = () => {
	const grid = gridRef.value?.$el || gridRef.value
	if (!grid) return

	removeGridListeners()
	savedGridEl = grid

	if (rows.value.length > 0) {
		navigatorRef.value?.scrollToLastRow()
	}

	grid.addEventListener('mousedown', handleMouseDown)

	if (focusTimeoutId) clearTimeout(focusTimeoutId)
	focusTimeoutId = setTimeout(() => {
		const activeGrid = gridRef.value?.$el || gridRef.value
		if (!activeGrid) return

		if (typeof activeGrid.focus === 'function') {
			activeGrid.focus()
		} else {
			activeGrid.setAttribute('tabindex', '0')
			activeGrid.focus()
		}
	}, 50)
}

const beforeEditStart = () => { console.log('mencari relasi data..') }
const beforeEdit = (event) => { console.log('data sebelum edit:', event.detail.model) }

const afterEdit = async (event) => {
	if (event.detail.oldValue === event.detail.value) return;

	const updatedModel = event.detail.model;
	const recordId = updatedModel[primaryKey.value];

	if (!recordId) return;

	try {
		const endpoint = `${props.menu.route || `/${props.menu.key.toLowerCase()}`}/${recordId}`;
		const response = await api.put(endpoint, updatedModel);

		if (response.status === 200) {
			console.log('Auto-save berhasil dijalankan.');

			const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId);
			if (currentTab && currentTab.apiResponse) {
				const targetIdx = currentTab.apiResponse.data.findIndex(item => item[primaryKey.value] === recordId);
				if (targetIdx !== -1) {
					currentTab.apiResponse.data[targetIdx] = { ...updatedModel };
				}
			}
		}
	} catch (err) {
		console.error('Gagal auto-save:', err);
	}
};

const afterFocus = (event) => {
	focusedCoordinate.value = { x: event.detail.colIndex, y: event.detail.rowIndex }
	focusedColumn.value = event.detail.column
	focusedRow.value = event.detail.model
}

const handleKeyDown = (e) => {
	if (e.repeat) return

	if (e.key === 'Delete') {
		handleDeleteKey(e)
		e.preventDefault()
		return
	}

	if (e.altKey && e.key === 'ArrowLeft') { navigatorRef.value?.scrollToFirstCol(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowRight') { navigatorRef.value?.scrollToLastCol(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowDown') { navigatorRef.value?.scrollToLastRow(); e.preventDefault(); return; }
	if (e.altKey && e.key === 'ArrowUp') { navigatorRef.value?.scrollToFirstRow(); e.preventDefault(); return; }

	if (e.key === 'ArrowDown') { handleArrowDown(e); return; }
	if (e.key === 'ArrowUp') { handleArrowUp(e); return; }

	if (!focusedColumn.value?._primary && focusedColumn.value?._type !== 'relation') return

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

const handleArrowDown = () => {
	if (focusedCoordinate.value.y === rows.value.length - 1) {
		console.log('ARROW DOWN di baris terakhir')
	}
}

const handleArrowUp = () => {
	if (focusedCoordinate.value.y === 0) {
		console.log('ARROW UP di baris pertama')
	}
}

const handleAddNewRow = async () => {
	if (!permission.value.create) {
		alert('Anda tidak memiliki akses untuk menambah data!')
		return
	}

	try {
		const endpoint = props.menu.route || `/${props.menu.key.toLowerCase()}`
		const response = await api.post(endpoint)

		if (response.status === 201) {
			const serverNewData = response.data.data

			rows.value = [...rows.value, serverNewData]

			const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
			if (currentTab && currentTab.apiResponse) {
				currentTab.apiResponse.data = [...currentTab.apiResponse.data, serverNewData]
			}

			await nextTick()

			if (gridRef.value) {
				if (typeof gridRef.value.requestGridRowsRedraw === 'function') {
					gridRef.value.requestGridRowsRedraw()
				} else if (typeof gridRef.value.$el?.requestGridRowsRedraw === 'function') {
					gridRef.value.$el.requestGridRowsRedraw()
				}
			}

			const lastRowIndex = rows.value.length - 1

			if (gridRef.value && typeof gridRef.value.setCellsFocus === 'function') {
				gridRef.value.setCellsFocus({ x: 1, y: lastRowIndex }, { x: 1, y: lastRowIndex })
			} else if (gridRef.value?.$el && typeof gridRef.value.$el.setCellsFocus === 'function') {
				gridRef.value.$el.setCellsFocus({ x: 1, y: lastRowIndex }, { x: 1, y: lastRowIndex })
			}
			setTimeout(() => {
				if (navigatorRef.value && typeof navigatorRef.value.scrollToLastRow === 'function') {
					navigatorRef.value.scrollToLastRow()
				}
			}, 50)
		}
	} catch (err) {
		console.error("Gagal menambahkan baris baru ke server:", err)
		alert('Gagal membuat baris baru di database.')
	}
}

const handleDeleteKey = async () => {
	if (!permission.value.delete) {
		console.log('delete data not allowed')
		return
	}
	const targetIndex = focusedCoordinate.value.y
	const selectedData = rows.value[targetIndex]
	const recordId = selectedData?.[primaryKey.value]

	if (!recordId) {
		alert('Gagal mendeteksi ID Data untuk dihapus')
		return
	}

	if (confirm('Apakah Anda yakin ingin menghapus data ini secara permanen dari sistem?')) {
		try {
			const endpoint = `${props.menu.route || `/${props.menu.key.toLowerCase()}`}/${recordId}`
			const response = await api.delete(endpoint)

			if (response.status === 200 || response.status === 204) {
				const updatedRows = rows.value.filter((_, index) => index !== targetIndex)

				const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
				if (currentTab && currentTab.apiResponse) {
					currentTab.apiResponse.data = [...updatedRows]
				}

				rows.value = [...updatedRows]
				await nextTick()

				if (gridRef.value) {
					if (typeof gridRef.value.requestGridRowsRedraw === 'function') {
						gridRef.value.requestGridRowsRedraw()
					} else if (typeof gridRef.value.$el?.requestGridRowsRedraw === 'function') {
						gridRef.value.$el.requestGridRowsRedraw()
					}
				}

				if (gridRef.value && typeof gridRef.value.setCellsFocus === 'function') {
					const nextY = Math.max(0, targetIndex - 1)
					gridRef.value.setCellsFocus({ x: 0, y: nextY }, { x: 0, y: nextY })
				}
			}
		} catch (err) {
			console.error("Gagal menghapus data dari database server:", err)
			alert('Gagal menghapus data. Silakan periksa koneksi atau hak akses Anda.')
		}
	}
}

// 🔥 PERBAIKAN: Tangkap filter dan simpan ke state global komponen agar bisa dipakai fungsi refresh
const handleFilterChanged = (filter) => {
	activeFilters.value = filter
	fetchDataWithFilter(filter)
}

const fetchDataWithFilter = async (filter = {}) => {
	try {
		const response = await api.get(`${props.menu.route || `/${props.menu.key.toLowerCase()}`}/`, {
			params: {
				where: JSON.stringify(filter)
			}
		})

		if (response.status === 200) {
			rows.value = response.data?.data ? [...response.data.data] : []
		} else {
			console.log(response)
		}
	} catch (err) {
		console.error("Gagal melakukan pencarian database server:", err)
	}
}

const focusBackToGrid = () => {
	nextTick(() => {
		const grid = gridRef.value?.$el || gridRef.value
		if (!grid) {
			focusBackToGrid()
			return;
		}

		const targetX = focusedCoordinate.value.x >= 0 ? focusedCoordinate.value.x : 0
		const targetY = focusedCoordinate.value.y >= 0 ? focusedCoordinate.value.y : 0

		if (typeof grid.setCellsFocus === 'function') {
			grid.setCellsFocus({ x: targetX, y: targetY }, { x: targetX, y: targetY })
		}

		const internalInput = grid.querySelector('.revo-clipboard, input, [tabindex="0"]')
		if (internalInput) {
			internalInput.focus()
		} else {
			grid.focus()
		}
	})
}

const cariDataDenganKarakter = async (char) => {
	searchQuery.value = char
	showSearchModal.value = true
	await nextTick()
	searchInputRef.value?.focus()
}

// 🔥 PERBAIKAN: Fungsi sinkronisasi menyertakan filter aktif jika ada
const syncFreshDataFromServer = async () => {
	if (tabStore.activeTabId !== props.menu?.route) return

	try {
		const endpoint = props.menu.route || `/${props.menu.key.toLowerCase()}`
		const response = await api.get(endpoint, {
			params: {
				where: JSON.stringify(activeFilters.value)
			}
		})
		const freshData = response.data?.schema?.data || response.data?.data

		if (freshData) {
			rows.value = [...freshData]
			const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
			if (currentTab && currentTab.apiResponse) {
				currentTab.apiResponse.data = [...freshData]
			}
			gridRef.value?.$el?.requestGridRowsRedraw?.()
		}
	} catch (err) {
		console.error("Gagal otomatis revalidate data:", err)
	}
}
const handleSearchSubmit = () => {
	const value = searchQuery.value.trim()
	if (!value) return

	const quickFilterRow = {
		field: primaryKey.value || 'id',
		operator: 'contains',
		value: value,
		valueTo: ''
	}

	const currentRoute = props.menu?.route || route.path

	// 🟢 Tetap pakai setFilters bawaan store kamu
	filterStore.setFilters(currentRoute, [quickFilterRow])

	// Sinkronkan ke tabel utama dan jalankan API request
	handleFilterChanged([quickFilterRow])
	closeSearchModal()
}

const closeSearchModal = () => {
	showSearchModal.value = false
	searchQuery.value = ''
	nextTick(() => {
		const grid = gridRef.value?.$el || gridRef.value
		grid?.focus()
	})
}

const handleWindowFocus = () => {
	if (document.visibilityState === 'visible') {
		syncFreshDataFromServer()
	}
}

onBeforeUnmount(() => {
	if (behaviorTimeoutId) clearTimeout(behaviorTimeoutId)
	if (focusTimeoutId) clearTimeout(focusTimeoutId)
	if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)
	removeGridListeners()
	document.removeEventListener('visibilitychange', handleWindowFocus)
	rows.value = []
	columns.value = []
	savedGridEl = null
	console.log('Semua listener, data referensi, dan timer dibersihkan dengan aman.')
})

watch(() => props.schemaData, loadComponentData)

onMounted(() => {
	loadComponentData()
	document.addEventListener('visibilitychange', handleWindowFocus)
})

watch(() => tabStore.activeTabId, async (activeTabId) => {
	if (activeTabId === props.menu?.route) {
		await nextTick()

		if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)

		watchTabTimeoutId = setTimeout(async () => {
			const grid = gridRef.value?.$el || gridRef.value
			if (!grid) return

			if (typeof grid.requestGridColumnsRedraw === 'function') {
				grid.requestColumnsRedraw()
			}

			// --- 🔥 PERBAIKAN SILENT BACKGROUND REVALIDATE DENGAN FILTER ---
			const currentRoute = props.menu?.route || route.path;
			activeFilters.value = filterStore.getFiltersByTab(currentRoute) || {};

			try {
				const endpoint = props.menu.route || `/${props.menu.key.toLowerCase()}`
				const response = await api.get(endpoint, {
					params: {
						where: JSON.stringify(activeFilters.value)
					}
				})

				const freshData = response.data?.schema?.data || response.data?.data

				if (freshData) {
					rows.value = [...freshData]

					const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
					if (currentTab && currentTab.apiResponse) {
						currentTab.apiResponse.data = [...freshData]
					}

					grid.requestGridRowsRedraw?.()
				}
			} catch (err) {
				console.error("Gagal sinkronisasi data eksternal saat pindah tab:", err)
			}
			// --- SILENT BACKGROUND REVALIDATE SELESAI ---

			const targetX = focusedCoordinate.value.x >= 0 ? focusedCoordinate.value.x : 0
			const targetY = focusedCoordinate.value.y >= 0 ? focusedCoordinate.value.y : 0

			if (typeof grid.setCellsFocus === 'function') {
				grid.setCellsFocus({ x: targetX, y: targetY }, { x: targetX, y: targetY })
				if (typeof grid.scrollToRow === 'function') {
					grid.scrollToRow(targetY)
				}
			}

			const clipboardInput = grid.querySelector('.revo-clipboard, input, [tabindex="0"]')
			if (clipboardInput) {
				clipboardInput.focus()
			} else {
				grid.focus()
			}
		}, 0)
	}
}, { immediate: true })
</script>

<style scoped>
:deep(revo-grid) {
	z-index: 10 !important;
}
</style>