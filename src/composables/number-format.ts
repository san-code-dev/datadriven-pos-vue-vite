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

    const toLocalDatetimeLocal = (isoString) => {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';

        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));

        // Ambil format ISO lalu potong sampai detik/menit
        return localDate.toISOString().slice(0, 19);
    }

    return {
        formatNumber,
        formatCurrency,
        toLocalDatetimeLocal
    }
}

