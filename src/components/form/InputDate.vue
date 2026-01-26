<template>
    <input :value="modelValue" :name="field.key" :placeholder="field.label" :required="field.required" type="text"
        @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script setup>
defineProps({
    modelValue: [String, Number],
    field: Object,
})

defineEmits(['update:modelValue'])
</script>
