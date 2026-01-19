<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
	menu: {
		type: Object,
		required: true
	}
})

const rows = ref([])          // Ini akan menampung data
const permission = ref({})    // Permission per menu

const load = async () => {
	// REAL API nanti:
	// const res = await fetch(props.menu.data)

	// MOCK
	const mock = (await import('@/sample-data')).response
	const res = mock[props.menu.key]

	rows.value = res.data
	permission.value = res.permission
}

onMounted(load)

// Watch menu.key, reload data jika menu berubah
watch(() => props.menu.key, load)
</script>

<template>
	<div>
		<DatePickerPopUp />
		<h2>{{ props.menu.name }}</h2>


		<table border="1">
			<thead>
				<tr>
					<th v-for="f in props.menu.fields" :key="f.key">
						{{ f.label }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.id">
					<td v-for="f in props.menu.fields" :key="f.key">
						{{ row[f.key] }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
