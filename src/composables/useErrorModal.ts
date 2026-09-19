import { ref } from 'vue'

const isOpen = ref(false)
const errorMessage = ref('')
const errorTitle = ref('Peringatan')

export function useErrorModal() {
    const showError = (message: string, title = 'Peringatan') => {
        errorMessage.value = message
        errorTitle.value = title
        isOpen.value = true
    }

    const closeError = () => {
        isOpen.value = false
    }

    return {
        isOpen,
        errorMessage,
        errorTitle,
        showError,
        closeError
    }
}