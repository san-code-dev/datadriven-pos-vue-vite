<template>
    <input :name="field.key" :value="modelValue" :required="field.required" type="text" placeholder="default"
        disabled="" @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script setup>
defineProps({
    modelValue: [String, Number],
    field: Object,
})

defineEmits(['update:modelValue'])
</script>
