<template>
    <input :id="field.key" :name="field.name" :value="modelValue" :placeholder="field.label" :required="field.required"
        type="number" @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script setup>
defineProps({
    modelValue: [String, Number],
    field: Object,
})

defineEmits(['update:modelValue'])
</script>
