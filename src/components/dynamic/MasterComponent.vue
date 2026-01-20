<script setup>
import { ref, watch, onMounted } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'

const columns = ref([])
const rows = ref([])
const permission = ref({})
const isEditable = ref(false)

const props = defineProps({
	menu: {
		type: Object,
		required: true
	}
})

const load = async () => {
	// REAL API nanti:
	// const res = await fetch(props.menu.data)

	// MOCK
	const mock = (await import('@/sample-data')).response
	const res = mock[props.menu.key]

	columns.value = props.menu.fields.map(field => ({
		prop: field.key,
		name: field.label,
	}))

	rows.value = res.data
	permission.value = res.permission
}

onMounted(load)

// Watch menu.key, reload data jika menu berubah
watch(() => props.menu.key, load)

const afterEdit = (event) => {
	console.log('tersimpan.')
}
const beforeEditStart = async (event) => {
	isEditable.value = false
	console.log('mengecek proses sebelumnya...')
	await new Promise(resolve => setTimeout(resolve, 5000))
	isEditable.value = true
	console.log('siap diedit.')
}
const beforeEditRender = async (event) => {
	console.log('menyiapkan editor...')
	await new Promise(resolve => setTimeout(resolve, 5000))

}
const beforeEdit = async (event) => {
	console.log('sebelum diedit...')
	await new Promise(resolve => setTimeout(resolve, 5000))

}
const cancelEdit = (event) => {
	console.log('edit dibatalkan')
}
const cellEdit = (event) => {
	console.log('diedit, memvalidasi data...')
}
const closeEdit = (event) => {
	console.log('edit ditutup')
}
const cellEditInit = async (event) => {
	console.log('inisialisasi editor sel')
	await new Promise(resolve => setTimeout(resolve, 5000))
}
</script>

<template>
	<div>
		<h2>{{ props.menu.name }}</h2>
		<button v-if="permission.create">Create</button>
		<RevoGrid ref="grid" :columns="columns" :readonly="(permission.update && false)" :source="rows"
			:theme="isDark ? 'darkCompact' : 'compact'" @afteredit="afterEdit" @beforeedit="beforeEdit"
			@beforeeditrender="beforeEditRender" @beforeeditstart="beforeEditStart" @canceledit="cancelEdit"
			@celledit="cellEdit" @closeedit="closeEdit" @celleditinit="cellEditInit" />
	</div>
</template>
