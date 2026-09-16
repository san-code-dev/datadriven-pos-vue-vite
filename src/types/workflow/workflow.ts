import type { Node, Edge } from '@vue-flow/core';
import type { ColumnSchema, MasterSchema, TransactionSchema } from './schema.type';

export interface WorkflowNodeData {
    label: string;
    schemaType: 'master' | 'transaction_header' | 'transaction_detail' | 'custom';
    schema: ColumnSchema[];
    formData: Record<string, any>;
}

// Gabungkan tipe schema dengan NodeProps
export type CustomNodeData = (MasterSchema | TransactionSchema) & {
    label?: string
    key?: string
    type?: string
    floatingProperties?: {
        schema?: Array<{
            label: string
            type: string
            required?: boolean
            readonly?: boolean
        }>
        [key: string]: any
    }
}

export type DynamicWorkflowNode = Node<WorkflowNodeData>;