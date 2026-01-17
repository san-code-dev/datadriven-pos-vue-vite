<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
	menu: Object,       // Menu info & fields
})

const rows = ref([])          // Ini akan menampung data
const permission = ref({})    // Permission per menu

const load = async () => {
	// MOCK
	const mock = (await import('@/sample-data')).response
	const res = mock[props.menu.key]

	rows.value = res.data
	permission.value = res.permission

	// REAL API nanti:
	// const res = await fetch(props.menu.data)
}

onMounted(load)

// Watch menu.key, reload data jika menu berubah
watch(() => props.menu.key, load)
</script>

<template>
	<div>
		<h2>{{ props.menu.name }}</h2>

		<!-- tombol create jika ada permission -->
		<button v-if="permission.create">Create</button>

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
