<template>
    <span :id="field.key">
        {{ modelValue }}
    </span>
</template>

<script setup>
defineProps({
    modelValue: [String, Number],
    field: Object,
})

defineEmits(['update:modelValue'])
</script>
