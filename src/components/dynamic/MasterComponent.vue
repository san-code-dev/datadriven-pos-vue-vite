<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'

const props = defineProps({
	menu: {
		type: Object,
		required: true
	},
	// Tambahan prop untuk menerima skema utuh dari penembakan API di [..all].vue
	schemaData: {
		type: Object,
		required: true
	}
})

const columns = ref([])
const rows = ref([])
const primaryKey = ref('id')
const permission = ref({})

const loadComponentData = () => {
	const res = props.schemaData
	if (!res) return

	// 1. Setup Kolom Datagrid RevoGrid berdasarkan properti schema
	columns.value = (res.schema || []).map(field => ({
		prop: field.key,
		name: field.label
	}))


	// 2. Pasang Baris Data Tabel
	rows.value = res.data || []
	// 3. Ambil Primary Key dan Hak Akses Role
	primaryKey.value = (res.schema || []).find(f => f.primary)?.key || 'id'
	permission.value = res.permissions || {}
}

// Inisialisasi awal saat komponen dimuat
onMounted(loadComponentData)

// Pantau perubahan skema kiriman jika user berpindah menu master dengan tipe komponen yang sama
watch(() => props.schemaData, loadComponentData, { deep: true })


const beforeEditStart = (event) => {
	console.log("mencari relasi data..")
}
const beforeEdit = (event) => {
	const { model, prop, val } = event.detail;
	console.log("data sebelum edit:", model)
}
const afterEdit = () => {
	const { model, prop, val } = event.detail;
	console.log("data setelah edit:", model)
}

</script>

<template>
	<!-- Ganti div terluar menjadi h-screen (tinggi penuh layar) dan flex-col -->
	<div class="flex flex-col h-screen">
		<div class="flex flex-1 min-h-0">
			<div class="flex-1 flex flex-col min-h-0 w-full">
				<!-- WRAPPER UNTUK GRID (Mengambil sisa ruang yang ada) -->
				<div class="flex-1 min-h-0 w-full relative">
					<!-- class w-full h-full memaksa RevoGrid mengisi penuh sisa kontainer ini -->
					<RevoGrid class="w-full h-full absolute" :columns="columns" :source="rows"
						:theme="isDark ? 'darkCompact' : 'compact'" resize="true"
						@beforeeditstart.prevent="beforeEditStart" @beforeedit="beforeEdit" @afteredit="afterEdit" />
				</div>

			</div>
		</div>
	</div>
</template>

<style>
/* 1. Targetkan komponen scroll internal bawaan RevoGrid */
revogr-scroll-virtual {
	background: transparent !important;
}

/* 2. Mengatur ukuran ketebalan track scrollbar horizontal dan vertikal */
revogr-scroll-virtual::-webkit-scrollbar {
	width: 8px !important;
	height: 8px !important;
}

/* 3. Menghilangkan background kotak jalur scrollbar (Bikin Transparan) */
revogr-scroll-virtual::-webkit-scrollbar-track {
	background: transparent !important;
}

/* 4. Mewarnai batang geser (Thumb) menjadi Emerald Kapsul (Light Mode) */
revogr-scroll-virtual::-webkit-scrollbar-thumb {
	background-color: rgba(16, 185, 129, 0.4) !important;
	/* bg-emerald-500/40 */
	border-radius: 9999px !important;
	transition: background-color 0.2s ease-in-out !important;
}

/* 5. Efek saat kursor menyentuh batang geser (Hover Light Mode) */
revogr-scroll-virtual::-webkit-scrollbar-thumb:hover {
	background-color: rgb(5, 150, 105) !important;
	/* bg-emerald-600 */
}

/* 6. Penyesuaian Otomatis saat Aplikasi masuk ke Tema Gelap (Dark Mode) */
.dark revogr-scroll-virtual::-webkit-scrollbar-thumb {
	background-color: rgba(52, 211, 153, 0.3) !important;
	/* bg-emerald-400/30 */
}

.dark revogr-scroll-virtual::-webkit-scrollbar-thumb:hover {
	background-color: rgb(52, 211, 153) !important;
	/* bg-emerald-400 */
}
</style>