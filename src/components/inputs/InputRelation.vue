<template>
    <div class="relative w-full">
        <input :id="props.relation?.key || 'relation-input'" :name="props.relation?.key || 'relation-input'"
            :value="displayName" :placeholder="props.relation?.placeholder || 'Pilih data...'" :readonly="readonly"
            type="text" autocomplete="off"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
            @click="handleInputClick" />

        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    // modelValue menerima Object lengkap, contoh: { id: 1, nmCustomer: 'Jane Smith' }
    modelValue: {
        type: [Object, String, Number],
        default: null
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

const emit = defineEmits(['update:modelValue', 'open-selector'])

// Logika pembongkar [object Object] menjadi teks nama
const displayName = computed(() => {
    if (!props.modelValue) return ''

    // Jika bentuknya Object, bongkar berdasarkan displayField (misal: 'nmCustomer')
    if (typeof props.modelValue === 'object') {
        const displayField = props.relation?.displayField
        if (displayField && props.modelValue[displayField]) {
            return props.modelValue[displayField]
        }

        // Fallback otomatis jika displayField lupa didefinisikan di skema backend
        return props.modelValue.nmCustomer || props.modelValue.nmUser || props.modelValue.name || ''
    }

    // Jika ternyata tipenya data primitif biasa (string/number), tampilkan apa adanya
    return props.modelValue
})

const handleInputClick = () => {
    if (props.readonly) return
    // Emit event jika nanti kamu mau memicu modal popup pencarian data master dari input ini
    emit('open-selector', props.relation)
}
</script>