<script setup>
defineProps({
	menu: Object,
	data: Array,
	permission: Object,
})
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
