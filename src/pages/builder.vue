<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
    <div class="flex-1 p-6">

        <div class="p-6 space-y-6 min-h-screen transition-colors
           bg-gray-100 dark:bg-gray-900
           text-gray-900 dark:text-gray-100">
            <h1 class="text-2xl font-bold">
                Schema UI Builder
            </h1>

            <!-- LOAD STATUS -->
            <div v-if="loading" class="text-gray-600 dark:text-gray-400">
                Loading schema...
            </div>

            <!-- MODEL LIST -->
            <div v-for="model in schema" :key="model.model" class="border rounded p-4
             bg-white dark:bg-gray-800
             border-gray-300 dark:border-gray-700">
                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2 font-semibold">
                        <input v-model="modelSelected[model.model]" type="checkbox" class="accent-blue-600" />
                        {{ model.model }}
                    </label>

                    <select v-model="modelType[model.model]" class="border rounded px-2 py-1
                 bg-white dark:bg-gray-700
                 border-gray-300 dark:border-gray-600">
                        <option value="Master">Master</option>
                        <option value="Transaction">Transaction</option>
                        <option value="Report">Report</option>
                    </select>
                </div>

                <!-- FIELDS -->
                <div class="mt-3 ml-6 grid grid-cols-2 gap-2">
                    <label v-for="field in model.fields" :key="field.name" class="flex items-center gap-2 text-sm
                 text-gray-700 dark:text-gray-300">
                        <input v-model="fieldSelected[model.model][field.name]" type="checkbox"
                            class="accent-blue-600" />
                        {{ field.name }}
                        <span class="text-gray-400">
                            ({{ field.type }})
                        </span>
                    </label>
                </div>
            </div>

            <!-- ACTION -->
            <div class="flex gap-4">
                <button class="bg-blue-600 hover:bg-blue-700
               text-white px-4 py-2 rounded transition" @click="generateJS">
                    Generate JS
                </button>
            </div>

            <!-- PREVIEW -->
            <div v-if="generatedCode" class="mt-6">
                <h2 class="font-bold mb-2">
                    Generated Output
                </h2>
                <pre class="bg-black text-green-400
               p-4 text-xs overflow-auto rounded">
{{ generatedCode }}
      </pre>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
type PrismaField = {
    name: string
    type: string
    primary?: boolean
    required?: boolean
}

type PrismaModelSchema = {
    model: string
    type: 'Master' | 'Transaction' | 'Report'
    endpoint: string
    category: string
    fields: PrismaField[]
}
const router = useRouter()
const schema = ref<PrismaModelSchema[]>([])
const loading = ref(false)

const modelSelected = ref<Record<string, boolean>>({})
const fieldSelected = ref<Record<string, Record<string, boolean>>>({})
const modelType = ref<Record<string, 'Master' | 'Transaction' | 'Report'>>({})

const generatedCode = ref('')

/* =======================
   LOAD SCHEMA
======================= */
async function loadSchema() {
    loading.value = true

    const res = await fetch('http://localhost:3000/api/builder/schema', {
        credentials: 'include',
    })
    if (!res.ok) {
        await router.push('/')
        return;
    }
    const json = await res.json()

    schema.value = json.models

    // init selections
    schema.value.forEach((m) => {
        modelSelected.value[m.model] = true
        modelType.value[m.model] = m.type

        fieldSelected.value[m.model] = {}
        m.fields.forEach((f) => {
            fieldSelected.value[m.model][f.name] = true
        })
    })

    loading.value = false
}

onMounted(loadSchema)

/* =======================
   GENERATOR
======================= */
function generateJS() {
    console.log(schema.value)
    const accessMenu = schema.value
        .filter((m) => modelSelected.value[m.model])
        .map((m) => ({
            key: m.model.toUpperCase(),
            name: `Data ${m.model}`,
            link: `/${m.model.toLowerCase()}`,
            type: `MenuType.${modelType.value[m.model]}`,
            data: m.endpoint,
            menuCategory: m.category,
            menuSubCategory: modelType.value[m.model].toLowerCase(),
            fields: m.fields
                .filter((f) => fieldSelected.value[m.model][f.name])
                .map((f) => ({
                    key: f.name,
                    label: f.name,
                    primary: f.primary || false,
                    required: f.required || false,
                })),
        }))




    const code = `
// ⚠️ AUTO GENERATED FILE – DO NOT EDIT MANUALLY

const MenuType = {
  Master: 'Master',
  Transaction: 'Transaction',
  Report: 'Report',
}

export const AccessMenu = ${JSON.stringify(accessMenu, null, 2)}
`

    generatedCode.value = code.trim()

    downloadFile(code)
}

/* =======================
   DOWNLOAD
======================= */
function downloadFile(content: string) {
    const blob = new Blob([content], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'access-menu.generated.js'
    a.click()

    URL.revokeObjectURL(url)
}
</script>
