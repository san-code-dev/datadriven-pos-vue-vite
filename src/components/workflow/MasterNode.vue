<script setup lang="ts">
import { computed } from 'vue'
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { MasterSchema } from '@/types/workflow/schema.type';
const props = defineProps<NodeProps>()
let data: MasterSchema;

</script>

<template>
    <div class="vue-flow__node-default">
        tes
        <div>{{ data.label }}</div>
        <div> {{ data.key }}| {{ data.type }}</div>

        <Handle type="source" :position="Position.Bottom" />
    </div>

</template>