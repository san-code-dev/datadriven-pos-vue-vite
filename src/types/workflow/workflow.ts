import type { Node, Edge } from '@vue-flow/core';
import type { ColumnSchema } from './schema.type';

export interface WorkflowNodeData {
    label: string;
    schemaType: 'master' | 'transaction_header' | 'transaction_detail' | 'custom';
    schema: ColumnSchema[];
    formData: Record<string, any>;
}

export type DynamicWorkflowNode = Node<WorkflowNodeData>;