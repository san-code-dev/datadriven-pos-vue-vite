<template>
    <select v-model="normalizedValue" :name="field.key">
        <option value="">
            -- pilih {{ field.label }} --
        </option>

        <option v-for="opt in options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
        </option>
    </select>
</template>
<script setup>
import { computed } from 'vue'

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
    modelValue: [String, Number],
    field: Object,
})

const optionData = {
    "user.role": [
        { value: "USER", label: "USER" },
        { value: "ADMIN", label: "ADMIN" },
        { value: "SUPERADMIN", label: "SUPERADMIN" }
    ]
}

const options = computed(() => {
    // contoh: field.refer = "user.role"
    return optionData[props.field.refer] || []
})

/**
 * normalizedValue:
 * - GET  : samakan case (UPPERCASE)
 * - SET  : kirim balik ke parent
 */
const normalizedValue = computed({
    get() {
        return props.modelValue
            ? String(props.modelValue).toUpperCase()
            : ''
    },
    set(val) {
        emit('update:modelValue', val)
    }
})
</script>
