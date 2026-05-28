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
import { ref, watch, onMounted, nextTick } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import GridNavigator from '@/components/GridNavigator.vue' // Sesuaikan path

const props = defineProps({
	menu: {
		type: Object,
		required: true
	},
	schemaData: {
		type: Object,
		required: true
	}
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

// State baru untuk fitur pencarian
const showSearchModal = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)


// ========================================================
// DATA INITIALIZATION & BEHAVIORS
// ========================================================
const loadComponentData = async () => {
	const res = props.schemaData
	if (!res) return

	columns.value = (res.schema || []).map(field => {
		// Buat base configuration untuk column
		const columnConfig = {
			prop: field.key,
			name: field.label,
			readonly: field.readonly || false,
			size: field.label.length * 15,
			_type: field.type || 'text',
			_autoIncrementOnDuplicate: field.autoIncrementOnDuplicate || false,
			_primary: field.primary || false,
		}

		// JIKA tipenya adalah relation, buat custom cellTemplate
		if (field.type === 'relation' && field.relation) {
			const displayField = field.relation.displayField // contoh: 'nmUser' atau 'nmCustomer'

			columnConfig.cellTemplate = (createElement, props) => {
				// Ambil data object dari row saat ini (misal: { id: 1, nmUser: 'User A' })
				const rowData = props.model[field.key]

				// Ambil teks yang mau ditampilkan berdasarkan displayField yang diset di skema
				const displayText = rowData ? rowData[displayField] : ''

				// Render teksnya saja, bukan object-nya
				return createElement('span', {}, displayText || '')
			}
		}

		return columnConfig
	})

	rows.value = res.data || []
	primaryKey.value = (res.schema || []).find(f => f.primary)?.key || 'id'
	permission.value = res.permissions || {}

	await nextTick()
	setTimeout(() => {
		setUpGridBehaviors()
	}, 100)
}

const setUpGridBehaviors = () => {
	const grid = gridRef.value?.$el || gridRef.value
	if (!grid) return

	if (rows.value.length > 0) {
		navigatorRef.value?.scrollToLastRow()
	}
	grid.addEventListener('keydown', handleKeyDown)
	grid.addEventListener('mousedown', handleMouseDown)

	setTimeout(() => {
		if (typeof grid.focus === 'function') {
			grid.focus()
		} else {
			// Jika grid berupa komponen Vue, coba cari elemen input internalnya atau set tabindex
			grid.setAttribute('tabindex', '0')
			grid.focus()
		}
	}, 50)
}

// ========================================================
// Default event handlers
// ========================================================
const beforeEditStart = (event) => {
	console.log('mencari relasi data..')
}

const beforeEdit = (event) => {
	const { model } = event.detail
	console.log('data sebelum edit:', model)
}

const afterEdit = (event) => {
	const { model } = event.detail
	console.log('data setelah edit:', model)
}

const afterFocus = (event) => {
	focusedCoordinate.value = { x: event.detail.colIndex, y: event.detail.rowIndex }
	focusedColumn.value = event.detail.column
	focusedRow.value = event.detail.model
}

// ========================================================
// Datgrid key & mouse mapping
// ======================================================== 

const handleKeyDown = (e) => {
	// Cegah interaksi grid jika modal pencarian sedang terbuka
	if (showSearchModal.value) return

	if (e.repeat) return
	if (e.key === 'Delete') {
		handleDeleteKey(e)
		e.preventDefault()
		return
	}
	if (e.key === 'ArrowDown') {
		console.log('ARROW DOWN ditekan')
		handleArrowDown(e)
		return
	}

	if (e.key === 'ArrowUp') {
		console.log('ARROW UP ditekan')
		handleArrowUp(e)
		return
	}

	if (!focusedColumn.value._primary && focusedColumn.value._type !== 'relation') return

	if (
		e.key.length === 1 &&
		!e.ctrlKey &&
		!e.altKey &&
		!e.metaKey
	) {
		console.log('Karakter biasa ditekan:', e.key)
		cariDataDenganKarakter(e.key)
		e.preventDefault()
	}
}


// ========================================================
// Mouse & key mapping event handlers
// ========================================================

const handleMouseDown = (e) => {
	if (e.ctrlKey && e.button === 0) {
		console.log('CTRL + KLIK KIRI')
		e.preventDefault()
	}
}

const handleArrowDown = (e) => {
	if (focusedCoordinate.value.y === rows.value.length - 1) {
		console.log('ARROW DOWN di baris terakhir')
	}
}

const handleArrowUp = (e) => {
	if (focusedCoordinate.value.y === 0) {
		console.log('ARROW UP di baris pertama')
	}
}

const handleDeleteKey = (e) => {
	if (!permission.value.delete) {
		console.log('User tidak memiliki izin untuk menghapus data.')
		return
	}
	if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
		//api delete
		if (rows.value = rows.value.filter((_, index) => index !== focusedCoordinate.value.y))

			gridRef.value.$el.setCellsFocus({ x: 0, y: focusedCoordinate.value.y - 1 }, { x: 0, y: focusedCoordinate.value.y - 1 });
	}
}

// ========================================================
// Methods
// ========================================================

// Fitur Pencarian Baru
const cariDataDenganKarakter = async (char) => {
	searchQuery.value = char // Masukkan karakter pertama yang ditekan user ke input
	showSearchModal.value = true

	// Tunggu DOM selesai dirender, lalu arahkan focus ke kotak input
	await nextTick()
	searchInputRef.value?.focus()
}


const handleSearchSubmit = async () => {
	if (!searchQuery.value.trim()) return
	console.log('Mengirim permintaan ke server untuk ID:', searchQuery.value)
	closeSearchModal() // Tutup modal setelah submit

}

const closeSearchModal = () => {
	showSearchModal.value = false
	searchQuery.value = ''

	// Kembalikan fokus ke grid setelah modal ditutup
	nextTick(() => {
		const grid = gridRef.value?.$el || gridRef.value
		grid?.focus()
	})
}

watch(() => props.schemaData, loadComponentData, { deep: true })
onMounted(loadComponentData)
</script>