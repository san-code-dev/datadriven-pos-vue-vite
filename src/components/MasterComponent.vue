<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
	menu: Object,
})


const rows = ref([])
const permission = ref({})

const load = async () => {
	// MOCK
	const mock = (await import('@/sample-data')).response
	const res = mock[props.menu.key]

	rows.value = res.data
	permission.value = res.permission

	// REAL API (nanti)
	// const res = await fetch(props.menu.data)
}

onMounted(load)

watch(() => props.menu.key, load)
</script>

<template>
	<div>
		<h2>{{ menu.name }}</h2>

		<button v-if="permission.create">Create</button>

		<table border="1">
			<thead>
				<tr>
					<th v-for="f in menu.fields" :key="f.key">
						{{ f.label }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in data" :key="row.id">
					<td v-for="f in menu.fields" :key="f.key">
						{{ row[f.key] }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
