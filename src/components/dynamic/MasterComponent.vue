<script setup>
import { ref, watch, onMounted } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import { defineAsyncComponent } from 'vue'

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

const grid = ref(null)
const focusedElement = ref(null)
const columns = ref([])
const rows = ref([])
const primaryKey = ref('id')
const permission = ref({})

const newData = ref({})
const editData = ref({})

const openDrawerAdd = ref(false)
const openDrawerEdit = ref(false)

const selectedKey = ref(null)
const focusedField = ref(null)

/**
 * PETA KOMPONEN INPUT DINAMIS
 */
const inputComponentsMap = {
	'text': defineAsyncComponent(() => import('@/components/inputs/InputText.vue')),
	'number': defineAsyncComponent(() => import('@/components/inputs/InputNumber.vue')),
	'currency': defineAsyncComponent(() => import('@/components/inputs/InputCurrency.vue')),
	'date': defineAsyncComponent(() => import('@/components/inputs/InputDate.vue')),
	'display': defineAsyncComponent(() => import('@/components/inputs/InputDisplay.vue')),
	'relation': defineAsyncComponent(() => import('@/components/inputs/InputRelation.vue')),
	'email': defineAsyncComponent(() => import('@/components/inputs/InputEmail.vue')),
}

const getInputComponent = (type) => {
	return inputComponentsMap[type] || 'input'
}

/**
 * MEMUAT DATA BERDASARKAN PROPS DARI ROUTER DYNAMIC
 */
const loadComponentData = () => {
	const res = props.schemaData
	if (!res) return

	// 1. Setup Kolom Datagrid RevoGrid berdasarkan properti schema
	columns.value = (res.schema || []).map(field => ({
		prop: field.key,
		name: field.label,
		size: field.width || 200, // <--- TAMBAHKAN INI (Ganti 200 dengan lebar pixel yang diinginkan)
		// Handler template jika kolom bertipe relasi objek (seperti User / Customer)
		cellTemplate: field.type === 'relation'
			? (h, cellProps) => h('span', {}, cellProps.model[field.key]?.[field.relation.displayField] || '')
			: undefined
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

const addData = () => {
	rows.value = [
		...rows.value,
		{ ...newData.value }
	]
	hideAddForm()
}

const removeData = async () => {
	const ok = await confirm('Yakin hapus data ini?')
	if (selectedKey.value !== null && ok) {
		rows.value = rows.value.filter(row => row[primaryKey.value] !== selectedKey.value)
		console.log('Data removed with key:', selectedKey.value)
		hideEditForm()
	}
}

const showEditForm = (event) => {
	event.preventDefault()
	focusedElement.value = grid.value?.$el
	if (focusedElement.value?.clearFocus) {
		focusedElement.value.clearFocus()
	}
	selectedKey.value = event.detail.model[primaryKey.value]
	editData.value = { ...event.detail.model }
	focusedField.value = event.detail.prop
	openDrawerEdit.value = true
	hideAddForm()
}

const hideEditForm = () => {
	openDrawerEdit.value = false
	editData.value = {}
}

const showAddForm = () => {
	if (grid.value?.$el?.clearFocus) {
		grid.value.$el.clearFocus()
	}
	newData.value = {}
	openDrawerAdd.value = true
	hideEditForm()
}

const hideAddForm = () => {
	openDrawerAdd.value = false
	newData.value = {}
}

const updateData = () => {
	const index = rows.value.findIndex(r => r[primaryKey.value] === editData.value[primaryKey.value])
	if (index !== -1) {
		rows.value[index] = { ...editData.value }

		refreshLocalData()
		console.log('Data updated:', rows.value[index])
	} else {
		console.warn('Data tidak ditemukan untuk diperbarui')
	}
	hideEditForm()
}

const deleteData = (event) => {
	selectedKey.value = event.detail.model[primaryKey.value]
	removeData()
}

const refreshLocalData = () => {
	// Paksa isi ulang properti source pada Web Component-nya
	if (grid.value && grid.value.$el) {
		grid.value.$el.source = [] // Kosongkan sekejap
		grid.value.$el.source = rows.value // Isi kembali dengan data baru
	}
}
</script>

<template>
	<!-- Ganti div terluar menjadi h-screen (tinggi penuh layar) dan flex-col -->
	<div class="flex flex-col h-screen">
		<div class="flex flex-1 min-h-0">
			<div class="flex-1 flex flex-col min-h-0 w-full">

				<div class="flex-shrink-0 pt-6">
					<h2 class="text-xl font-bold mb-2 capitalize">{{ props.schemaData?.label || props.menu.label }}</h2>
					<ButtonTheme v-if="permission.create" @click="showAddForm"> add data </ButtonTheme>
					<br /><br />
				</div>

				<!-- WRAPPER UNTUK GRID (Mengambil sisa ruang yang ada) -->
				<div class="flex-1 min-h-0 w-full relative">
					<!-- class w-full h-full memaksa RevoGrid mengisi penuh sisa kontainer ini -->
					<RevoGrid ref="grid" class="w-full h-full absolute inset-0" :columns="columns" :source="rows"
						:theme="isDark ? 'darkCompact' : 'compact'" resize="true" @beforeedit.prevent="deleteData"
						@beforeeditstart="showEditForm" />
				</div>


				<!-- 4. KOMPONEN MASA DEPAN / GRAND TOTAL (Jika dinyalakan) -->
				<!-- flex-shrink-0 menjamin totalan tidak mendesak grid keluar layar -->
				<!-- <div class="flex-shrink-0 w-full bg-white dark:bg-gray-800 p-6">
					<span>Grand Total: </span><strong>Rp 150.000.000</strong>
				</div> -->

				<!-- ADD FORM DRAWER -->
				<Drawer v-if="permission.create" :focused-field="focusedField" :is-open="openDrawerAdd"
					@close="openDrawerAdd = false">
					<!-- ... isi form tambah tetap sama ... -->
					<form @submit.prevent="addData">
						<h4 class="font-semibold text-lg">Add New {{ props.schemaData?.label }}</h4>
						<br>
						<div v-for="f in props.schemaData?.schema" :key="f.key" class="mb-2">
							<template v-if="!f.primary">
								<LabelTheme :for="f.key" class="text-sm font-medium">{{ f.label }}</LabelTheme>
								<br>
								<component :is="getInputComponent(f.type)" v-model="newData[f.key]" :field="f" />
							</template>
						</div>
						<div class="mt-4 space-x-2">
							<ButtonTheme button-type="submit"><Kbd>Enter</Kbd> save</ButtonTheme>
							<ButtonTheme type="button" @click.prevent="hideAddForm()"><Kbd>ESC</Kbd> cancel
							</ButtonTheme>
						</div>
					</form>
				</Drawer>

				<!-- EDIT FORM DRAWER -->
				<Drawer :is-open="openDrawerEdit" :focused-field="focusedField" @delete="removeData"
					@close="openDrawerEdit = false">
					<!-- ... isi form edit tetap sama ... -->
					<form @submit.prevent="updateData">
						<h4 class="font-semibold text-lg">Edit {{ props.schemaData?.label }}</h4>
						<br>
						<div v-for="f in props.schemaData?.schema" :key="f.key" class="mb-2">
							<LabelTheme v-if="!f.primary" :for="f.key" class="text-sm font-medium">{{ f.label }}
							</LabelTheme>
							<span v-else class="block font-semibold text-gray-500 dark:text-gray-400 mb-1">
								{{ f.label }}: {{ editData[f.key] }}
							</span>
							<br>
							<component :is="getInputComponent(f.type)" v-model="editData[f.key]" :field="f"
								:disabled="f.primary || f.readonly" />
						</div>
						<br>
						<div class="space-x-2">
							<ButtonTheme v-if="permission.edit" button-type="submit"><Kbd>Enter</Kbd> update
							</ButtonTheme>
							<ButtonTheme v-if="permission.delete" type="button" @click.prevent="removeData()">
								<Kbd>Del</Kbd> delete
							</ButtonTheme>
							<ButtonTheme type="button" @click.prevent="hideEditForm()"><Kbd>ESC</Kbd> cancel
							</ButtonTheme>
						</div>
					</form>
				</Drawer>

			</div>
		</div>
	</div>
</template>