<template>
    <input :id="field.key" :name="field.key" :value="displayValue" :placeholder="field.label" :required="field.required"
        type="text" autocomplete="off" @input="handleInput" />
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/setting'

const settings = useSettingsStore()

const props = defineProps({
    modelValue: [String, Number],
    field: Object,
})

const emit = defineEmits(['update:modelValue'])

const displayValue = computed(() => {
    if (!props.modelValue) return ''

    // hapus semua selain angka
    const number = props.modelValue.toString().replace(/\D/g, '')

    // format 10000 -> 10.000
    return new Intl.NumberFormat(settings.locale).format(number)
})

const handleInput = (e) => {
    // ambil hanya angka
    const rawValue = e.target.value.replace(/\D/g, '')

    emit('update:modelValue', rawValue)
}
</script>