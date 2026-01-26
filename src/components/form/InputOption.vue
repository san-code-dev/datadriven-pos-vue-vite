<template>
    <select :name="field.key" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">-- pilih {{ field.label }} --</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
        </option>
    </select>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: [String, Number],
    field: Object,
})

const options = computed(() => {
    // contoh: field.refer = "user.role"
    return optionData[props.field.refer] || []
})
</script>
