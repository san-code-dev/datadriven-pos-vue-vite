<template>
	<div class="flex flex-col h-full max-h-full overflow-hidden min-h-0 bg-transparent w-full">
		<DynamicFilter v-if="props.schemaData?.schema" :schema="props.schemaData.schema"
			:tabId="props.menu?.route || 'master'" @filter-changed="fetchDataWithPrismaFilter"
			@escape-filter="focusBackToGrid" />
		<div class="flex flex-1 min-h-0 w-full overflow-hidden">
			<div class="flex-1 flex flex-col min-h-0 w-full overflow-hidden">

				<div class="flex-1 min-h-0 w-full relative group overflow-hidden z-10">

					<RevoGrid ref="gridRef" class="w-full h-full max-h-full focus:outline-none" :columns="columns"
						:source="rows" :theme="isDark ? 'darkCompact' : 'compact'" resize="true"
						@beforeeditstart.once="beforeEditStart" @beforeedit.once="beforeEdit"
						@afteredit.once="afterEdit" @afterfocus="afterFocus" />

					<GridNavigator ref="navigatorRef" :grid="gridRef" :rows="rows" :columns="columns"
						:focused-coordinate="focusedCoordinate" />

					<div v-if="showSearchModal" @click.self="closeSearchModal"
						class="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">

						<div
							class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg mx-4">
							<label
								class="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
								Pencarian Cepat
							</label>
							<input ref="searchInputRef" v-model="searchQuery" type="text"
								placeholder="Ketik sesuatu lalu tekan Enter..."
								class="w-full text-2xl font-medium px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-800 dark:text-slate-100 transition-all"
								@keydown.enter="handleSearchSubmit" @keydown.esc="closeSearchModal" />
							<div class="flex justify-between items-center mt-4 text-xs text-slate-400">
								<span>Tekan <kbd
										class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded shadow">Enter</kbd>
									untuk mencari</span>
								<span>Tekan <kbd
										class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded shadow">ESC</kbd>
									untuk batal</span>
							</div>
						</div>
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
import { useTabStore } from '@/stores/tabs'
import DynamicFilter from '@/components/DynamicFilter.vue'
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
let watchTabTimeoutId = null // <-- Tambahkan ini untuk mengontrol timer di dalam watch

// PERBAIKAN 1: Optimasi template agar tidak menciptakan closure baru secara liar
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
	console.log('Menerima schemaData baru:', res)
	if (!res) return

	// Bersihkan referensi kolom lama terlebih dahulu
	columns.value = []

	columns.value = (res.schema || []).map(field => {
		const columnConfig = {
			prop: field.key,
			name: field.label,
			readonly: field.readonly || false,
			size: field.label.length * 15,
			_type: field.type || 'text',
			_autoIncrementOnDuplicate: field.autoIncrementOnDuplicate || false,
			_primary: field.primary || false,
		}

		if (field.type === 'relation' && field.relation) {
			// Gunakan referensi fungsi statis, melemparkan parameter secara eksplisit
			columnConfig.cellTemplate = (createElement, linkProps) =>
				relationCellRenderer(createElement, linkProps, field.relation.displayField, field.key)
		}
		return columnConfig
	})

	rows.value = res.data || []
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
const afterEdit = (event) => { console.log('data setelah edit:', event.detail.model) }

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
	if (e.key === 'ArrowDown') {
		handleArrowDown(e)
		return
	}
	if (e.key === 'ArrowUp') {
		handleArrowUp(e)
		return
	}

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
	// Jika user menekan Ctrl+K, paksa RevoGrid kehilangan fokus seketika
	if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
		const activeGrid = gridRef.value?.$el || gridRef.value
		if (activeGrid) {
			// Ambil elemen input/clipboard internal RevoGrid yang sedang fokus dan blur
			const activeInput = activeGrid.querySelector('.revo-clipboard, input, :focus')
			if (activeInput) activeInput.blur()

			activeGrid.blur()
		}
	}
}
const handleDeleteKey = () => {
	if (!permission.value.delete) return

	if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
		const targetIndex = focusedCoordinate.value.y
		rows.value = rows.value.filter((_, index) => index !== targetIndex)

		if (gridRef.value?.$el && typeof gridRef.value.$el.setCellsFocus === 'function') {
			const nextY = Math.max(0, targetIndex - 1)
			gridRef.value.$el.setCellsFocus({ x: 0, y: nextY }, { x: 0, y: nextY })
		}
	}
}
// Parameter prismaWhere dikirim dalam struktur JSON siap saji dari komponen di atas
const fetchDataWithPrismaFilter = async (prismaWhere = {}) => {
	try {
		const response = await fetch(`http://localhost:3000/api/${props.menu.key.toLowerCase()}/query`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ where: prismaWhere }) // Dikirim langsung sebagai JSON object body
		})
		console.log(prismaWhere)

		if (response.ok) {
			const res = await response.json()
			rows.value = res.data || []
			await nextTick()
			gridRef.value?.$el?.requestGridRowsRedraw()
		}
	} catch (err) {
		console.error("Gagal melakukan pencarian database server:", err)
	}
}

const focusBackToGrid = () => {
	nextTick(() => {
		const grid = gridRef.value?.$el || gridRef.value
		grid?.focus()
	})
}

const cariDataDenganKarakter = async (char) => {
	searchQuery.value = char
	showSearchModal.value = true
	await nextTick()
	searchInputRef.value?.focus()
}

const handleSearchSubmit = async () => {
	if (!searchQuery.value.trim()) return
	console.log('Mengirim permintaan ke server untuk ID:', searchQuery.value)
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

// PERBAIKAN 2: Pastikan seluruh sisa timer dibersihkan total tanpa celah
onBeforeUnmount(() => {
	if (behaviorTimeoutId) clearTimeout(behaviorTimeoutId)
	if (focusTimeoutId) clearTimeout(focusTimeoutId)
	if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId) // Bersihkan objek watch timer
	removeGridListeners()
	window.removeEventListener('keydown', handlePreventGridConflict, true)
	// Putus referensi array besar agar Garbage Collector langsung mengambilnya
	rows.value = []
	columns.value = []
	savedGridEl = null

	console.log('Semua listener, data referensi, dan timer dibersihkan dengan aman.')
})

watch(() => props.schemaData, loadComponentData)

onMounted(() => {
	loadComponentData()
	window.addEventListener('keydown', handlePreventGridConflict, true)
})

// Memantau perubahan Tab Aktif secara Global dari Pinia
watch(() => tabStore.activeTabId, async (activeTabId) => {
	if (activeTabId === props.menu?.route) {
		await nextTick()

		// PERBAIKAN 3: Bersihkan timeout penjelajahan tab sebelumnya jika user klik sangat cepat
		if (watchTabTimeoutId) clearTimeout(watchTabTimeoutId)

		watchTabTimeoutId = setTimeout(() => {
			const grid = gridRef.value?.$el || gridRef.value
			if (!grid) return

			if (typeof grid.requestGridColumnsRedraw === 'function') {
				grid.requestGridColumnsRedraw()
			}

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