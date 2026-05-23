import { computed } from 'vue'
import { useSettingsStore } from '@/stores/setting'

export function useNumberFormat() {
    const settings = useSettingsStore()

    const formatNumber = (value) => {
        return new Intl.NumberFormat(settings.locale, {
            minimumFractionDigits: settings.decimals,
            maximumFractionDigits: settings.decimals,
        }).format(value)
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat(settings.locale, {
            style: 'currency',
            currency: settings.currency,
            minimumFractionDigits: settings.decimals,
        }).format(value)
    }

    return {
        formatNumber,
        formatCurrency,
    }
}