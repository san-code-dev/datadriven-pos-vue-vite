<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initGlobalSocket, disconnectSocket } from '@/lib/socket'
import "@revolist/revo-dropdown"

const authStore = useAuthStore()
const handleKeyDown = async (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.key === 'F5') {
        event.preventDefault()

        // Cukup catat penanda dan langsung reload instan
        sessionStorage.setItem('is_reloading', 'true')
        window.location.reload()
    }
}

// Pantau perubahan status login secara reaktif
watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
        if (isAuth) {
            initGlobalSocket()
        } else {
            disconnectSocket()
        }
    },
    { immediate: true }
)

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)

    // Jika ada proses reload
    if (sessionStorage.getItem('is_reloading') === 'true') {
        // 1. Batalkan timer loader (jika Vue selesai dimuat < 250ms, loader BATTAL muncul)
        if ((window as any).__reloaderTimer) {
            clearTimeout((window as any).__reloaderTimer)
        }

        // 2. Jika loader keburu muncul (proses > 250ms), sembunyikan dengan fade-out
        const nativeReloader = document.getElementById('native-reloader')
        if (nativeReloader) {
            nativeReloader.classList.remove('active')
        }

        // 3. Hapus penanda
        sessionStorage.removeItem('is_reloading')
    }

    if (window.electronAPI?.appReady) {
        window.electronAPI.appReady()
    }
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    disconnectSocket()
})
</script>

<template>
    <router-view />
    <ErrorModal />
</template>

<style>
revogr-header .rgHeaderCell>.resizable-r {
    /* Berikan lebar yang cukup agar ikon terlihat jelas (default 1px terlalu tipis) */
    width: 12px;
    padding-right: 6px !important;
    margin-right: 6px !important;
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFJUlEQVR4AeyaP2wTVxzHiWOBWCoFlq4tXagYqpawFKlL27FCKnYizFKpSgRIHcNQmKADGSsBSlSpC0aJTSXUse1SiS6EVh1QWUq7doFIXRDISfh8zbN1nO/53rv3DJw49L6+d78/39/P3/uROOer7XrN/1UCvOYDsKuagGoCIiowPz9/Ym5ubgV0wKVms/lhKL04xAXEuaIaoZzJ/Cj/BWjuENjY2dlpQ74AGmBpamrqFvYV9oWWcsVB8hIQ54JqYN8Ah7AFr2ABWq3WG3RxExwGWWuBZr1FMDkSM4tTtW6a2ll+Z1uwAL1e72uqHQDj1oJGeVxA0mdibW9+EHrA1B6cFzoGC0DVz0HuYpQ/yw0yAR6xTrUNbeYhhgBvZzKPGt8aNVktrrGuta2FYgiwaWV/3uEapyzXWNc4cWYiWADG9ZdM5pSRuF9TJuupayxxTrWthXAEC7C9vf0tPHnrztra2vW8oIHfxN4ZnNuOjrVt6X17sACdTuc3mE4D27qP4wvgu5SjXFveaVPb5neyBwugKuvr61f5gHKUkexw/hDsADW/XK/X38d/l3OvpRzlkrQMxCXOh6qhWvivYvde6YQoAohUV4PRnaOx/aAG3gFn2+32//IXgXLFAcQlzv2qoVpF+LJyogmQRV4GWyVAGa7SJHusJmCS6paBu5qAMlylSfZYTcAk1S0Dd9QJaDQae8En3Lg8zi2t2VgCiEuc4gZ7Y/GKJ5oANHihVqttgp/4rN6F/DaN/4X9OPtCS7niIPm2OMUNNrFfwBZlRRGAJq/R4Dk62gOS6yD2Lv4vk0aXvXKUS+xBkFx7sJ/Dfy1pLLoPFoBG9OZaOQ1cZnTfzIkZuk3s5aEhe9MytbO9jtZgAaijv9s5jF27p6enT46NSDhN7O6EybZ1qW3L7dtjCPBBnynnhbF9Lydk6PaIza09JLVsYghgoS6HOYYAv7u8Ve7k/OkSpxiPWKfa4rQhhgDf28gT9idbW1vOP7VN7JNEvm3rUtuW27cHC8Dtqu9g0peiHKzrTLfb/c/qTTlM7JmUOX3aNrXTdq/zYAFUjUZOMrYX2T8GyXUPewO/RErac/fKUS6B90ByPcZ+Eb/zb5VkcnofRQCRcrPyPPfpZ8CnNKivso/Q5LvYb8hfBMoVB7lHxCluMIP9PLYoK5oA6obRfQR+psEbNL4hWwyIS5ziBo9icA44ogowIC3TsRKgTFdrEr1WEzAJVcvEWU1Ama7WJHqtJmASqr5MTt/a0SZAz/Zxs3Kd21QPwDb4G1wKeZhRueIA4hLnA9VQLd83aouPIgANnuKz+i3u5DQptA9MAT08udTr9f7A7/1Yq3KUC48ekxWXOPephmrhP4UveAULYK7GlTGdqPkif7crR7k26iumts3vZA8WgPv0XzlUOszonnCI64eYWD0P3D+3vTjWtqX37cECMJIf95lyXoj7KCdk6HaNJc6p9pA4YxMsAJwzwGW5xonLNdY1TpyZiCHAP5nMo8Z/R01Wi2usa21roRgC/GBlTzgY1x8Tp2O3HrFOtccVCxagXq9/QwE9yMjBulZ9nu0zsatWtmeO+6b2s7OCr8EC6GFGah8Dtmd7V7mltYjfa5kcmwiqdczU9uJNBwcLIEKavQtm+YCiL0nVtL4eX2aUj2L3fvPiFJQrDvZ6XFacq6qBfRZ4P34Lz8iKIsCAlRuX12lsETTBWTPKA3ehozjEBcS5qBqFiCxJUQWw1HilzZUAr/TleQHNlX4CQjV6CgAA///rDD3LAAAABklEQVQDAODKypA9P5VAAAAAAElFTkSuQmCC");
}

/* Opsional: Ubah warna ikon saat di-hover */
revogr-header .rgHeaderCell>.resizable-r:hover {
    background-color: theme('colors.slate.200');

}

/* Membalik warna hitam ikon PNG menjadi putih */
.dark revogr-header .rgHeaderCell>.resizable-r {
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFX0lEQVR4AeyaTWhcVRTHm0yI46bQduNW003FhWh004Ib26UINik0boSiWMFFCJOvFgJtPmYIWQhWlIIbU2hSQVy2boS60SguxG4a3bppC904DpmJvz+9Ay8v98677903bR995Z7e887H/3/m3DtD3+0dPPCM/ykb8IxvgAPlDih3QI4dWFlZOVuv179cXl7eQK83Go3jofDCEJYwhY1+NhQzmp/LV2BxcfEVCvsF4PXd3d0PBwYGxtBrnU7ntopGzzSUKwySa8IUNvq6uMSJHjyCG7CwsHCwUql8RyWjyL6hovVB9jkSDMpRriNsVJzidvi9zcENqFar87CNIM6hD6Kt7AyIORSrnJg5/jhiuOP2VM/BDYDtPSRxdDqddxKDTECKWC9uA2udghvAd/MlK3LMyIq+GDM5H31jfbmdRDiCG0CxD8BJHIODg15xAvKN9eUWpkuCGwDwD0jioNgfE4NMQIpYL24Da52CG8D39TMr8l7j1szMzLW9JveTid1yRzzyeHI/Cnb8HdyAubm5n8A+j7jGdrvd/sDldNlNzrbLj/284UbNPoIbIGpW7AtW4wT6BnKfH6ddZhXfaDabr83Pz//Bc6qhHOWS1EC2DeZ99A1xiRM99Ygn5NIAgWo1KOoMcmR6enqQ+SgyzT9WHsqfRZQrDOSowTyCfkZcWfBsObk1wAZeBFvZgCKsUj9rLHdAP7tbBOxyBxRhlfpZY7kD+tndImDnugPW1tae5yjrJHJ6dXX1jbwaICxhIifFkReucHJrAAeVl1qt1gNeZW8imzs7Oz9j+5OiT4soiyhXGMISJnJTHNguZcGz5eTSAI6svwH8AvIcEh3HKHoT/7mo0UdXjnKJPYZEhzgu4Bdn1J5JD24AhZzjTW2iFzv+zznofKFXTNSnWOVEbXEd/4S44/a0z8ENoBCfd/1hXmHf9y3OxA4nxXty94QJbgDoryOJg+38amKQCUgRm8htIJ1THg1wghfBkUcDfvX5oGzX333iFJMi1otbmC4JbgDb9WsXeMTe4qjb+1fbxLYi+VbVk9ua2zUGN2B2dvYqhax3AW0z/k9qtdo/Np/Npljl2HxdG/51cXefs87BDRAxhegX/jL6f0h03GE7j+G/GjX66MpRLrF3kOgQx2X84ozaM+m5NEDMHFZeHB4ePkTRp5CxoaGhN7G9zGHmDfmziHKFISxhIqfEge1iFjxbTm4NEPjk5OS/FH0LuTE1NaX7AjIHi7CEidwSRzBgBCDXBkRwC6OWDSjMUvWp0HIH9KmxhYEtd0BhlqpPhZY7oE+NfWKwaYlz2wFLS0vHOay8jtzjMLPDfBep83/8B9MW1Y1XrjCQuwbzHvp1cXVjQudcGkBRH/MKe5tixpHDvKkNMOvyZK1arf6W5VqrcpQLTg0ZMZiH0cfFJU704BHcALMaV3pUMlKpVHzODPZAmBw1cY898nDFcEdM6dXgBrAan3rQjrJi3re8Taz17nGUy5M7mrJPD24AiG8jiYNX2bcSg0xAilgvbgNrnYIbQLGHrMgxI0fdXnFK84315RamS4IbwI/TXy7wqJ1i/44+99J9Y325e3EFNwDwb5HEwff1+8QgE5Ai1ovbwFqn4AY0m81FkHUpksk+WNGvOOjUjVJ7QMyqWOXEzPHHbcMdt6d6Dm4A/1h52G6334XVerdXH4SjrI/wpxrKUa4jaUuc4nb4vc3BDRCTrrVyUKn7ABMqmu/mJvYGW/mEPgh6pqFcYZDcEKaw0SfEJU704JFLA7pVUNg1Fc2R9Tj6tLZy15d1FoawhClsdO9b5z6cuTbAh/Bpiykb8LStyOOup/A7ILRh/wMAAP//141b6QAAAAZJREFUAwB8zgyfwL8O2QAAAABJRU5ErkJggg==");
}

/* Menyesuaikan warna background hover saat mode gelap */
.dark revogr-header .rgHeaderCell>.resizable-r:hover {
    background-color: theme('colors.slate.800');
}

revo-grid revogr-data .rgRow .rgCell,
revo-grid revogr-header .header-rgRow .rgHeaderCell {
    border-right: 1px solid theme('colors.slate.700');
    border-bottom: 1px solid theme('colors.slate.700');
}


revogr-data .arrow-down {
    top: 15px !important;
    right: 15px !important;
}

duet-date-picker {
    --duet-color-primary: #059669;
    --duet-color-primary-text: #ffffff;
    --duet-color-text: #1f2937;
    --duet-color-text-active: #ffffff;
    --duet-color-background: #ffffff;
    --duet-color-surface: #f9fafb;
    --duet-color-border: #e5e7eb;
    --duet-color-radius: 0.75rem;
}

.dark duet-date-picker {
    --duet-color-primary: #10b981;
    --duet-color-text: #f3f4f6;
    --duet-color-background: #1f2937;
    --duet-color-surface: #111827;
    --duet-color-border: #374151;
}

.duet-date__dialog {
    background-color: transparent !important;
    color: inherit !important;
    overflow: hidden !important;
}

.duet-date__dialog-content {
    color: var(--duet-color-text) !important;
    border-color: var(--duet-color-border) !important;
    background-color: var(--duet-color-background) !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
}

.duet-date__select select {
    color: var(--duet-color-text) !important;
    background-color: transparent !important;
}

.duet-date__prev svg,
.duet-date__next svg,
.duet-date__close svg,
.duet-date__toggle svg {
    fill: currentColor !important;
    color: var(--duet-color-text) !important;
}

.duet-date__prev,
.duet-date__next,
.duet-date__close {
    color: var(--duet-color-text) !important;
    background-color: transparent !important;
    border-radius: 0.375rem !important;
}

.duet-date__prev:hover,
.duet-date__next:hover,
.duet-date__close:hover {
    background-color: rgba(16, 185, 129, 0.15) !important;
    color: #059669 !important;
}

.dark .duet-date__prev:hover,
.dark .duet-date__next:hover,
.dark .duet-date__close:hover {
    color: #34d399 !important;
}

.duet-date__table-header {
    color: #9ca3af !important;
    font-weight: 600 !important;
}

.duet-date__day {
    color: var(--duet-color-text) !important;
    border-radius: 0.5rem !important;
}

.duet-date__day:hover {
    background-color: #ecfdf5 !important;
    color: #047857 !important;
}

.dark .duet-date__day:hover {
    background-color: #374151 !important;
    color: #34d399 !important;
}

.duet-date__day[aria-pressed="true"],
.duet-date__day.is-selected {
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: bold !important;
}

.duet-date__day.is-today {
    border: 2px solid #10b981 !important;
    font-weight: bold !important;
}

.duet-date__input-wrapper {
    background-color: white !important;
    border: none !important;
    border-radius: mpme !important;
    outline: none !important;
    box-shadow: none !important;
}

.duet-date__input {
    background-color: transparent !important;
    color: var(--duet-color-text) !important;
    outline: none !important;
    box-shadow: none !important;
}

.duet-date__toggle {
    color: var(--duet-color-text) !important;
    background: transparent !important;
    outline: none !important;
    box-shadow: none !important;
}

.duet-date__toggle:hover {
    color: #059669 !important;
}

.duet-date__select {
    background-color: var(--duet-color-surface) !important;
    border: 1px solid var(--duet-color-border) !important;
    border-radius: 0.5rem !important;
    padding: 0.25rem 0.5rem !important;
}

.duet-date__select select {
    background-color: transparent !important;
    color: var(--duet-color-text) !important;
    font-weight: 500 !important;
}

.duet-date__select select option {
    background-color: var(--duet-color-background) !important;
    color: var(--duet-color-text) !important;
}

.duet-date__select-label {
    color: var(--duet-color-text) !important;
    font-weight: 500 !important;
}

.duet-date__select-label svg {
    color: var(--duet-color-text) !important;
    fill: currentColor !important;
}
</style>