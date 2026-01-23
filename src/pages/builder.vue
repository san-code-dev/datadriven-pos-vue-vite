<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
    <div>
        <div v-if="schema" class="flex">
            <div v-for="models in schema.models" :key="models.name" class="border inline-block w-80">
                <div>
                    <b>{{ models.name }}<input type="checkbox" /></b>
                    <div class="flex flex-col">
                        <div v-for="fields in models.fields" :key="fields.name">
                            {{ fields.name }}
                        </div>
                        <div>
                            create<input type="checkbox"><br>
                            create<input type="checkbox"><br>
                            updarte<input type="checkbox"><br>
                            create<input type="checkbox"><br>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'


interface Root {
    models: Model[]
    enums: Enum[]
}

interface Model {
    name: string
    type: string
    fields: Field[]
}

interface Field {
    name: string
    type: string
    kind: string
    isRequired: boolean
    isList: boolean
    isId: boolean
    isRelation: boolean
}

interface Enum {
    name: string
    values: string[]
}



const router = useRouter()
const loading = ref(false)
const schema = ref<Root>()

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
    schema.value = json
    console.log(json)

}

onMounted(loadSchema)
</script>
