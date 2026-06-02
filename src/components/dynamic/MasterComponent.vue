<template>
	<div class="flex flex-col h-screen">
		<div class="flex flex-1 min-h-0">
			<div class="flex-1 flex flex-col min-h-0 w-full">
				<div class="flex-1 min-h-0 w-full relative group">

					<RevoGrid ref="gridRef" class="w-full h-full pb-3 focus:outline-none" :columns="columns"
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

let savedGridEl = null
let behaviorTimeoutId = null
let focusTimeoutId = null

// Pindahkan pembuatan fungsi template ke luar agar tidak re-created di memori terus-menerus
const createRelationTemplate = (displayField, fieldKey) => {
	return (createElement, props) => {
		const rowData = props.model[fieldKey]
		const displayText = rowData ? rowData[displayField] : ''
		return createElement('span', {}, displayText || '')
	}
}

// Fungsi helper untuk mencabut listener dengan aman
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
			columnConfig.cellTemplate = createRelationTemplate(field.relation.displayField, field.key)
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

	// Bersihkan listener lama sebelum memasang yang baru (Mencegah duplikasi akibat balapan async)
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

// ========================================================
// Event Handlers & Methods
// ========================================================
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

// Pembersihan Total
onBeforeUnmount(() => {
	if (behaviorTimeoutId) clearTimeout(behaviorTimeoutId)
	if (focusTimeoutId) clearTimeout(focusTimeoutId)
	removeGridListeners()
	console.log('Semua listener dan timer dibersihkan dengan aman.')
})

// Hapus opsi { deep: true } untuk performa optimal, deteksi referensi baru dari schemaData
watch(() => props.schemaData, loadComponentData)

onMounted(loadComponentData)
</script>