<template>
    <div
        class="px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm text-slate-600 dark:text-slate-300 border border-transparent select-none">
        {{ props.relation?.displayField ? modelValue?.[props.relation.displayField] : modelValue }}
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: [String, Number, Object],
    readonly: Boolean,
    validation: Object,
    relation: Object
})
</script>