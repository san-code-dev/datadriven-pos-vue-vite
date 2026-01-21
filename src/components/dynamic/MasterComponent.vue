<script setup>
import { ref, watch, onMounted } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'

const props = defineProps({
	menu: {
		type: Object,
		required: true
	}
})

const columns = ref([])
const rows = ref([])
const primaryKey = ref('')
const permission = ref({})

const newData = ref({})
const editData = ref({})

const openDrawerAdd = ref(false)
const openDrawerEdit = ref(false)

const selectedKey = ref(null)



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
	primaryKey.value = res.primaryKey || 'id'
	permission.value = res.permission
}

onMounted(load)

// Watch menu.key, reload data jika menu berubah
watch(() => props.menu.key, load)


const addData = () => {
	rows.value = [
		...rows.value,
		newData.value
	]
}
const removeData = (key) => {
	if (key != '') {
		rows.value = rows.value.filter(row => row[primaryKey.value] !== key)
		console.log('Data removed with key:', key)
		openDrawerEdit.value = false
	}
}
const showEditForm = (event) => {
	selectedKey.value = event.detail.model[primaryKey.value]
	editData.value = { ...event.detail.model }
	openDrawerEdit.value = true
	openDrawerAdd.value = false
}
const updateData = () => {
	const index = rows.value.findIndex(r => r[primaryKey.value] === editData.value[primaryKey.value])
	if (index !== -1) {
		rows.value[index] = { ...editData.value }
		rows.value = [...rows.value]
		console.log('Data updated:', rows.value[index])
	} else {
		console.warn('Data not found for update')
	}
	openDrawerEdit.value = false
}
</script>

<template>
	<div>
		<!-- display data -->
		<h2>{{ props.menu.name }}</h2>
		<ButtonTheme v-if="permission.create" @click="openDrawerAdd = true; openDrawerEdit = false"> add data
		</ButtonTheme>
		<br />
		<br />
		<RevoGrid :columns="columns" :readonly="true" :source="rows" :theme="isDark ? 'darkCompact' : 'compact'"
			resize="true" @beforecellfocus="showEditForm" />



		<!-- add form -->
		<Drawer v-if="permission.create" :is-open="openDrawerAdd" @close="openDrawerAdd = false">
			<form>
				<h4>Add New {{ props.menu.name }}</h4>
				<div v-for="f in menu.fields" :key="f.key">
					<LabelTheme :for="f.key">{{ f.label }}</LabelTheme>
					<input :id="f.key" v-model="newData[f.key]" :type="f.type" :placeholder="f.label" />
				</div>
				<div>
					<ButtonTheme @click.prevent="addData()">Add Data</ButtonTheme>
					<ButtonTheme @click.prevent="openDrawerAdd = false">cancel</ButtonTheme>
				</div>
			</form>
		</Drawer>


		<!-- update form -->
		<Drawer :is-open="openDrawerEdit" @close="openDrawerEdit = false">
			<form>
				<h4>Edit {{ props.menu.name }}</h4>

				<div v-for="f in menu.fields" :key="f.key">
					<LabelTheme :for="f.key">{{ f.label }}</LabelTheme>
					<input :id="f.key" v-model="editData[f.key]" :type="f.type" :placeholder="f.label" />
				</div>
				<div>
					<ButtonTheme v-if="permission.update" @click.prevent="updateData()">Update Data</ButtonTheme>
					<ButtonTheme v-if="permission.delete" @click.prevent="removeData(selectedKey)">Delete
					</ButtonTheme>
					<ButtonTheme @click.prevent="openDrawerEdit = false">[ESC] cancel</ButtonTheme>
				</div>
			</form>
		</Drawer>
	</div>
</template>
