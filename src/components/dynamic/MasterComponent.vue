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

const grid = ref(null)
const focusedElement = ref(null)
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
	primaryKey.value = props.menu.fields.find(f => f.primary)?.key || 'id'
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
const removeData = () => {
	if (selectedKey.value != '') {
		rows.value = rows.value.filter(row => row[primaryKey.value] !== selectedKey.value)
		console.log('Data removed with key:', selectedKey.value)
		openDrawerEdit.value = false
	}
}

const showEditForm = (event) => {
	event.preventDefault()
	focusedElement.value = grid.value.$el;
	focusedElement.value.clearFocus()
	selectedKey.value = event.detail.model[primaryKey.value]
	editData.value = { ...event.detail.model }
	openDrawerEdit.value = true
	openDrawerAdd.value = false
}
const showAddForm = () => {
	grid.value.$el.clearFocus()
	openDrawerAdd.value = true;
	openDrawerEdit.value = false
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
		<div class="flex">
			<div class="flex-1 p-6">

				<!-- display data -->
				<h2>{{ props.menu.name }}</h2>
				<ButtonTheme v-if="permission.create" @click="showAddForm"> add data
				</ButtonTheme>
				<br />
				<br />
				<RevoGrid ref="grid" :columns="columns" :source="rows" :theme="isDark ? 'darkCompact' : 'compact'"
					resize="true" @beforeeditstart="showEditForm" />



				<!-- add form -->
				<Drawer v-if="permission.create" :is-open="openDrawerAdd" @close="openDrawerAdd = false">
					<form>
						<h4>Add New {{ props.menu.name }}</h4>
						<div v-for="f in menu.fields" :key="f.key">
							<LabelTheme :for="f.key">{{ f.label }}</LabelTheme>
							<input v-model="newData[f.key]" :name="f.key" :type="f.type" :placeholder="f.label"
								:required="f.required" />
						</div>
						<div>
							<ButtonTheme button-type="submit" @click.prevent="addData()"><Kbd>Enter</Kbd> save
							</ButtonTheme>
							<ButtonTheme @click.prevent="openDrawerAdd = false"><Kbd>ESC</Kbd> cancel</ButtonTheme>
						</div>
					</form>
				</Drawer>


				<!-- update form -->
				<Drawer :is-open="openDrawerEdit" @close="openDrawerEdit = false">
					<form>
						<h4>Edit {{ props.menu.name }}</h4>
						<br>
						<div v-for="f in menu.fields" :key="f.key" class="mb-2">
							<LabelTheme :for="f.key">{{ f.label }}</LabelTheme>
							<div v-if="f.primary" class="text-sm text-gray-500 dark:text-gray-400 mb-1">
								{{ editData[f.key] }}
							</div>
							<div v-else>
								<input v-model="editData[f.key]" :name="f.key" :type="f.type" :placeholder="f.label" />

							</div>
						</div>
						<br>
						<div>
							<ButtonTheme v-if="permission.update" button-type="submit" @click.prevent="updateData()">
								<Kbd>Enter</Kbd>
								update
							</ButtonTheme>
							<ButtonTheme v-if="permission.delete" @click.prevent="removeData()"><Kbd>Del</Kbd> delete
							</ButtonTheme>
							<ButtonTheme @click.prevent="openDrawerEdit = false"><Kbd>ESC</Kbd> cancel</ButtonTheme>
						</div>
					</form>
				</Drawer>
			</div>
		</div>

	</div>
</template>
