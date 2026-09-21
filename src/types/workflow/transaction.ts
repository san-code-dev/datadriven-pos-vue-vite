export interface SchemaField {
    key: string
    label: string
    type: string
    primary?: boolean
    readonly?: boolean
    nullable?: boolean
    size?: number
    highlight?: boolean
    isHidden?: boolean
    options?: any[]
    formula?: string
    entityKey?: string
    entity?: string
    validation?: { required?: boolean; min?: number }
}

export interface SchemaSection<T = any> {
    label?: string
    schema: SchemaField[]
    data: T
}

export interface TransactionSchemaState {
    key: string
    prefix?: string
    label?: string
    type?: string
    icon?: string
    permissions?: Record<string, boolean | undefined>
    isMenuHidden?: boolean
    actions?: { key: string; label: string; type?: string }[]
    queue: SchemaSection<any[]>
    header: SchemaSection<Record<string, any> | null>
    details: SchemaSection<any[]>
}