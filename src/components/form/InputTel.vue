<template>
    <input :name="field.key" :value="modelValue" :placeholder="field.label" :required="field.required" type="tel"
        @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script setup>
defineProps({
    modelValue: [String, Number],
    field: Object,
})

defineEmits(['update:modelValue'])
</script>
