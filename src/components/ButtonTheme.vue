<script setup>
defineProps({
    buttonType: {
        type: String,
        default: 'button'
    }
})
</script>

<template>
    <button :type="buttonType" class="
      mt-2 mr-2
      inline-flex items-center gap-1
      rounded
      bg-gray-200 px-3 py-2 text-sm text-gray-800
      hover:bg-gray-300
      dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600
      transition
    ">
        <slot />
    </button>
</template>
