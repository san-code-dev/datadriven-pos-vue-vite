<template>
    <input :id="props.relation?.key || 'currency-input'" :name="props.relation?.key || 'currency-input'"
        :value="displayValue" :placeholder="props.relation?.placeholder || '0'" :readonly="readonly" type="text"
        autocomplete="off" @input="handleInput" />
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/setting'

const settings = useSettingsStore()

// Sesuaikan deklarasi props dengan apa yang dikirim oleh TransactionComponent.vue
const props = defineProps({
    modelValue: [String, Number],
    readonly: {
        type: Boolean,
        default: false
    },
    validation: {
        type: Object,
        default: () => ({})
    },
    relation: {
        type: Object,
        default: () => ({ displayField: '', key: '', placeholder: '' })
    }
})

const emit = defineEmits(['update:modelValue'])

const displayValue = computed(() => {
    if (props.modelValue === undefined || props.modelValue === null || props.modelValue === '') return ''

    // hapus semua selain angka
    const number = props.modelValue.toString().replace(/\D/g, '')
    if (!number) return ''

    // format menggunakan locale dari store (contoh: 10000 -> 10.000)
    return new Intl.NumberFormat(settings.locale || 'id-ID').format(number)
})

const handleInput = (e) => {
    // ambil hanya angka
    const rawValue = e.target.value.replace(/\D/g, '')

    // Kirim balik angka murni ke v-model induk
    emit('update:modelValue', rawValue ? parseInt(rawValue, 10) : 0)
}
</script>