<template>
	<div class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-transparent w-full">

		<div
			class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">

			<div class="flex-1 min-w-0">
				<DynamicFilter v-if="props.schemaData?.schema" :schema="props.schemaData.schema"
					:tabId="props.menu?.route || 'master'" @filter-changed="fetchDataWithPrismaFilter"
					@escape-filter="focusBackToGrid" />
			</div>

			<div class="flex items-center justify-end shrink-0">
				<button v-if="permission.create" @click="handleAddNewRow" type="button"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5"
						stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Tambah Baris Baru
				</button>

				<button v-else disabled type="button"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-medium text-sm rounded-xl cursor-not-allowed border border-slate-200 dark:border-slate-700">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
						stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round"
							d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
					</svg>
					Akses Terkunci
				</button>
			</div>

		</div>

		<div class="flex flex-1 min-h-0 w-full overflow-hidden">
			<div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
				<div class="flex-1 min-h-0 w-full relative group overflow-hidden z-10">

					<RevoGrid ref="gridRef" class="w-full h-full max-h-full focus:outline-none" :columns="columns"
						:source="rows" :theme="isDark ? 'darkCompact' : 'compact'" resize="true"
						@beforeeditstart.once="beforeEditStart" @beforeedit.once="beforeEdit" @afteredit="afterEdit"
						@afterfocus="afterFocus" />

					<GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns"
						:focused-coordinate="focusedCoordinate" />

					<div v-if="showSearchModal" @click.self="closeSearchModal"
						class="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
					</div>

				</div>
			</div>
		</div>

	</div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue'
import DynamicFilter from '@/components/DynamicFilter.vue'

// 🔥 Hubungkan ke global Axios instance (Pencegat 401) dan Pinia Tab Store
import api from '@/lib/axios'
import { useTabStore } from '@/stores/tabs'

const props = defineProps({
	menu: { type: Object, required: true },
	schemaData: { type: Object, required: true }
})

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
const tabStore = useTabStore()

let savedGridEl = null
let behaviorTimeoutId = null
let focusTimeoutId = null
let watchTabTimeoutId = null

// Renderer relasi data statis (Optimasi reaktivitas)
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

// Memuat data & skema dinamis dari backend Prisma ke dalam tabel RevoGrid
const loadComponentData = async () => {
	const res = props.schemaData
	console.log('Menerima schemaData baru:', res)
	if (!res) return

	columns.value = [] // Bersihkan kolom lama

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

	// 🔥 Spread array agar melepaskan sisa cache data dari localStorage lama
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

	grid.addEventListener('keydown', handleKeyDown)
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

// 🔥 1. FUNGSI UPDATE / AUTO-SAVE (Selesai edit cell, langsung simpan ke database Prisma)
// Optimasi fungsi afterEdit di <script setup>
const afterEdit = async (event) => {
	// Jika nilai lama sama dengan nilai baru, batalkan hit API (mencegah double hit)
	if (event.detail.oldValue === event.detail.value) return;

	const updatedModel = event.detail.model;
	const recordId = updatedModel[primaryKey.value];

	if (!recordId) return;

	try {
		const endpoint = `${props.menu.route || `/${props.menu.key.toLowerCase()}`}/${recordId}`;
		const response = await api.put(endpoint, updatedModel);

		if (response.status === 200) {
			console.log('Auto-save berhasil dijalankan.');

			// Sinkronisasi ke Pinia Tab Store
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
	if (showSearchModal.value) return
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

const handlePreventGridConflict = (e) => {
	if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
		const activeGrid = gridRef.value?.$el || gridRef.value
		if (activeGrid) {
			const activeInput = activeGrid.querySelector('.revo-clipboard, input, :focus')
			if (activeInput) activeInput.blur()
			activeGrid.blur()
		}
	}
}

// Tambahkan fungsi ini di dalam <script setup> MasterComponent.vue Anda:
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

			// 1. 🔥 UBAH DI SINI: Letakkan data baru di belakang array lama (Bawah)
			rows.value = [...rows.value, serverNewData]

			// 2. 🔥 UBAH DI SINI: Samakan urutan untuk data di Pinia Store
			const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
			if (currentTab && currentTab.apiResponse) {
				currentTab.apiResponse.data = [...currentTab.apiResponse.data, serverNewData]
			}

			await nextTick()

			// 3. Redraw RevoGrid
			if (gridRef.value) {
				if (typeof gridRef.value.requestGridRowsRedraw === 'function') {
					gridRef.value.requestGridRowsRedraw()
				} else if (typeof gridRef.value.$el?.requestGridRowsRedraw === 'function') {
					gridRef.value.$el.requestGridRowsRedraw()
				}
			}

			// 4. 🔥 UBAH DI SINI: Hitung indeks baris terakhir yang baru saja dibuat
			const lastRowIndex = rows.value.length - 1

			// 5. 🔥 UBAH DI SINI: Alihkan sel fokus ke baris paling bawah (lastRowIndex)
			if (gridRef.value && typeof gridRef.value.setCellsFocus === 'function') {
				gridRef.value.setCellsFocus({ x: 1, y: lastRowIndex }, { x: 1, y: lastRowIndex })
			} else if (gridRef.value?.$el && typeof gridRef.value.$el.setCellsFocus === 'function') {
				gridRef.value.$el.setCellsFocus({ x: 1, y: lastRowIndex }, { x: 1, y: lastRowIndex })
			}
			setTimeout(() => {
				if (navigatorRef.value && typeof navigatorRef.value.scrollToLastRow === 'function') {
					navigatorRef.value.scrollToLastRow() // 🔥 DIUBAH: Ditambahkan `.value` dan tanda kurung `()`
				}
			}, 50)
		}
	} catch (err) {
		console.error("Gagal menambahkan baris baru ke server:", err)
		alert('Gagal membuat baris baru di database.')
	}
}
// 🔥 2. FUNGSI DELETE (Hit backend Prisma + Update Sinkronisasi Pinia Persist)
const handleDeleteKey = async () => {
	if (!permission.value.delete) return

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
				// Ambil data yang tersisa setelah di-filter
				const updatedRows = rows.value.filter((_, index) => index !== targetIndex)

				// 🔥 UPDATE PINIA STORE LANGSUNG: Ini agar Local Storage ikut terhapus datanya!
				const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
				if (currentTab && currentTab.apiResponse) {
					currentTab.apiResponse.data = [...updatedRows]
				}

				// Jalankan mutasi array ke variabel lokal
				rows.value = [...updatedRows]
				await nextTick()

				// Redraw RevoGrid secara aman
				if (gridRef.value) {
					if (typeof gridRef.value.requestGridRowsRedraw === 'function') {
						gridRef.value.requestGridRowsRedraw()
					} else if (typeof gridRef.value.$el?.requestGridRowsRedraw === 'function') {
						gridRef.value.$el.requestGridRowsRedraw()
					}
				}

				// Kembalikan sel fokus ke baris terdekat
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

// Filter Pencarian Server-Side via Prisma Builder Objek JSON
const fetchDataWithPrismaFilter = async (prismaWhere = {}) => {
	try {
		const response = await api.post(`${props.menu.route || `/${props.menu.key.toLowerCase()}`}/query`, {
			where: prismaWhere
		})

		if (response.status === 200) {
			rows.value = response.data?.data ? [...response.data.data] : []
			await nextTick()

			if (gridRef.value && typeof gridRef.value.requestGridRowsRedraw === 'function') {
				gridRef.value.requestGridRowsRedraw()
			}
		}
	} catch (err) {
		console.error("Gagal melakukan pencarian database server:", err)
	}
}

const focusBackToGrid = () => {
	nextTick(() => {
		const grid = gridRef.value?.$el || gridRef.value
		if (!grid) return

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
const syncFreshDataFromServer = async () => {
	// Pastikan hanya berjalan jika tab menu ini yang sedang aktif dilihat user
	if (tabStore.activeTabId !== props.menu?.route) return

	try {
		const endpoint = props.menu.route || `/${props.menu.key.toLowerCase()}`
		const response = await api.get(endpoint)
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
// 🔥 3. FUNGSI QUICK SEARCH (Menyusun operator OR dinamis untuk query Prisma di Backend)
const handleSearchSubmit = async () => {
	const value = searchQuery.value.trim()
	if (!value) return

	try {
		// Kumpulkan kolom bertipe teks dari skema UI
		const textFields = (props.schemaData?.schema || [])
			.filter(f => f.type === 'text' || f.key === 'name' || f.key === 'nmProduct')
			.map(f => f.key)

		// Bentuk objek filter OR Case-Insensitive ala Prisma ORM
		const prismaWhere = {
			OR: textFields.map(field => ({
				[field]: {
					contains: value,
					mode: 'insensitive'
				}
			}))
		}

		await fetchDataWithPrismaFilter(prismaWhere)
		closeSearchModal()
	} catch (err) {
		console.error("Quick search server failed:", err)
	}
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

// Bersihkan memori dan timer
onBeforeUnmount(() => {
	if (behaviorTimeoutId) clearTimeout(behaviorTimeoutId)
	if (focusTimeoutId) clearTimeout(focusTimeoutId)
	if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)
	removeGridListeners()
	window.removeEventListener('keydown', handlePreventGridConflict, true)
	document.removeEventListener('visibilitychange', handleWindowFocus)
	rows.value = []
	columns.value = []
	savedGridEl = null
	console.log('Semua listener, data referensi, dan timer dibersihkan dengan aman.')
})

watch(() => props.schemaData, loadComponentData)

onMounted(() => {
	loadComponentData()
	window.addEventListener('keydown', handlePreventGridConflict, true)
	document.addEventListener('visibilitychange', handleWindowFocus)
})

// Memantau perpindahan Tab Aktif secara global dari Pinia
watch(() => tabStore.activeTabId, async (activeTabId) => {
	if (activeTabId === props.menu?.route) {
		await nextTick()

		if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)

		watchTabTimeoutId = setTimeout(async () => { // Tambahkan async di sini
			const grid = gridRef.value?.$el || gridRef.value
			if (!grid) return

			if (typeof grid.requestGridColumnsRedraw === 'function') {
				grid.requestColumnsRedraw()
			}

			// --- 🔥 SILENT BACKGROUND REVALIDATE DIMULAI ---
			try {
				// Tembak endpoint murni menu untuk mendapatkan data paling fresh
				const endpoint = props.menu.route || `/${props.menu.key.toLowerCase()}`
				const response = await api.get(endpoint)

				// Ambil data array dari response struktur Prisma kamu
				// Sesuaikan response.data.schema.data / response.data.data berdasarkan API-mu
				const freshData = response.data?.schema?.data || response.data?.data

				if (freshData) {
					rows.value = [...freshData]

					// Update cache di Pinia Store agar tetap sinkron
					const currentTab = tabStore.openedTabs.find(t => t.id === tabStore.activeTabId)
					if (currentTab && currentTab.apiResponse) {
						currentTab.apiResponse.data = [...freshData]
					}

					// Redraw baris jika diperlukan
					grid.requestGridRowsRedraw?.()
				}
			} catch (err) {
				console.error("Gagal sinkronisasi data eksternal saat pindah tab:", err)
			}
			// --- 🔥 SILENT BACKGROUND REVALIDATE SELESAI ---

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