<template>
    <input :id="props.relation?.key || 'date-input'" :name="props.relation?.key || 'date-input'" :value="modelValue"
        :readonly="readonly" type="date" autocomplete="off"
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
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
        default: () => ({ displayField: '', key: '' })
    }
})

defineEmits(['update:modelValue'])
</script>