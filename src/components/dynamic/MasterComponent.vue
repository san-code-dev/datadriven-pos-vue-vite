<script setup>
import { ref, watch, onMounted } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'

const columns = ref([])
const rows = ref([])
const permission = ref({})

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
		autoSize: true
	}))

	rows.value = res.data
	permission.value = res.permission
}

onMounted(load)

// Watch menu.key, reload data jika menu berubah
watch(() => props.menu.key, load)

function cekEvent(event) {
	console.log(event)
}
</script>

<template>
	<div>
		<h2>{{ props.menu.name }}</h2>
		<button v-if="permission.create">Create</button>
		<RevoGrid :columns="columns" :readonly="permission.update" :source="rows"
			:theme="isDark ? 'darkCompact' : 'compact'" @afteredit="cekEvent" @beforeeditstart="cekEvent"
			@beforecellfocus="cekEvent" />
	</div>
</template>
