export interface TableColumn {
  width: number
  align: 'left' | 'center' | 'right'
  header?: string
}

export type DocElement =
  | {
      type: 'text'
      text: string
      align?: 'left' | 'center' | 'right'
      bold?: boolean
      size?: number
      italic?: boolean
    }
  | { type: 'separator'; style?: 'solid' | 'dashed' }
  | {
      type: 'table'
      columns: TableColumn[]
      rows: string[][]
      bold?: boolean
      showHeader?: boolean
    }
  | { type: 'qrcode'; value: string; align?: 'left' | 'center' | 'right' }
  | {
      type: 'barcode'
      value: string
      format?: 'CODE128' | 'EAN13'
      align?: 'left' | 'center' | 'right'
    }
  | {
      type: 'image'
      url: string
      align?: 'left' | 'center' | 'right'
      width?: number
    }
  | { type: 'space'; lines?: number }
  | { type: 'pagebreak' }
  | { type: 'signature_block'; labels: string[] }

export interface DocumentBlueprint {
  pageSize?: 'thermal58' | 'thermal80' | 'A4' | 'A5' | 'label'
  elements: DocElement[]
}

// ==========================================
// RESULT TYPES
// ==========================================

export interface OperationResult {
  success: boolean
  error?: string
  meta?: Record<string, unknown>
}
