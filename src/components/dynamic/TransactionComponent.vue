<script setup>
import { ref, watch, onMounted } from 'vue'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
	menu: {
		type: Object,
		required: true
	}
})

const route = useRoute()
const router = useRouter()

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
const focusedField = ref(null)



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
	hideAddForm()
}
const removeData = async () => {
	const ok = await confirm('yakin hapus data ini?');
	if (selectedKey.value != '' && ok) {
		rows.value = rows.value.filter(row => row[primaryKey.value] !== selectedKey.value)
		console.log('Data removed with key:', selectedKey.value)
		hideEditForm()
	}
}

const showEditForm = (event) => {
	event.preventDefault()
	// focusedElement.value = grid.value.$el;
	// focusedElement.value.clearFocus()
	selectedKey.value = event.detail.model[primaryKey.value]
	// editData.value = { ...event.detail.model }
	// focusedField.value = event.detail.prop
	// openDrawerEdit.value = true
	// hideAddForm()
	router.push(`${route.path}/${selectedKey.value}`)
}

const hideEditForm = () => {
	openDrawerEdit.value = false
	editData.value = {}
}

const showAddForm = () => {
	grid.value.$el.clearFocus()
	openDrawerAdd.value = true;
	hideEditForm()
}

const hideAddForm = () => {
	openDrawerAdd.value = false;
	addData.value = {}
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
	hideEditForm()
}

const deleteData = (event) => {
	selectedKey.value = event.detail.model[primaryKey.value]
	removeData()
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
					resize="true" @beforeedit.prevent="deleteData" @beforeeditstart="showEditForm" />



				<!-- add form -->
				<Drawer v-if="permission.create" :focused-field="focusedField" :is-open="openDrawerAdd"
					@close="openDrawerAdd = false">
					<form>
						<h4>Add New {{ props.menu.name }}</h4>
						<br>
						<div v-for="f in menu.fields" :key="f.key" class="mb-2">
							<LabelTheme v-if="!f.primary" :for="f.key">{{ f.label }}</LabelTheme>
							<br>
							<component :is="f.type" v-model="newData[f.key]" :field="f" />
						</div>
						<div>
							<ButtonTheme button-type="submit" @click.prevent="addData()"><Kbd>Enter</Kbd> save
							</ButtonTheme>
							<ButtonTheme @click.prevent="openDrawerAdd = false"><Kbd>ESC</Kbd> cancel</ButtonTheme>
						</div>
					</form>
				</Drawer>


				<!-- update form -->
				<Drawer :is-open="openDrawerEdit" :focused-field="focusedField" @delete="removeData"
					@close="openDrawerEdit = false">
					<form>
						<h4>Edit {{ props.menu.name }}</h4>
						<br>
						<div v-for="f in menu.fields" :key="f.key" class="mb-2">
							<LabelTheme v-if="!f.primary" :for="f.key">{{ f.label }}</LabelTheme>
							<span v-else>{{ f.label }}</span>
							<br>
							<component :is="f.type" v-model="editData[f.key]" :field="f" />
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
