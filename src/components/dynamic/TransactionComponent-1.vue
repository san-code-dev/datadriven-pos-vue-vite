<template>


</template>
<script setup lang="ts">



const props = defineProps({
  menu: { type: Object, required: true },
  schemaData: { type: Object, default: null }
})

console.log(JSON.stringify(props.schemaData))

import api from "@/lib/axios"
const res = await api.get("penjualan/get-last-transaction")
</script>
<style></style>