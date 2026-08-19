// ==========================================
// CORE TYPES — dipakai di semua layer
// ==========================================

export type DocType =
  | 'receipt' // struk kasir
  | 'invoice' // faktur A4/A5
  | 'delivery_order' // surat jalan
  | 'purchase_order' // PO ke supplier
  | 'report' // laporan (sales, stock opname, dst)
  | 'label' // label barcode/SKU

export type CopyType =
  | 'customer'
  | 'merchant'
  | 'kitchen'
  | 'warehouse'
  | 'accounting'

export interface StoreInfo {
  name: string
  address: string
  phone: string
  npwp?: string
  logoUrl?: string
}

export interface CustomerInfo {
  name: string
  phone?: string
  address?: string
  email?: string
}

export interface TransactionItem {
  sku?: string
  name: string
  qty: number
  price: number
  subtotal: number
  note?: string
  tax?: number
}

export interface PaymentInfo {
  subtotal: number
  discount?: number
  tax?: number
  total: number
  paid: number
  change: number
  method: 'cash' | 'debit' | 'credit' | 'qris' | 'transfer' | 'other'
}

export interface TransactionData {
  docType: DocType
  copyType: CopyType
  meta: {
    invoiceNo: string
    date: string
    cashier?: string
    dueDate?: string // untuk invoice B2B
    reference?: string // no. PO / SO terkait
  }
  store: StoreInfo
  customer?: CustomerInfo
  items: TransactionItem[]
  payment: PaymentInfo
  qrUrl?: string
  signature?: {
    preparedBy?: string
    approvedBy?: string
    receivedBy?: string
  }
  extra?: Record<string, unknown>
}

// ==========================================
// BLUEPRINT DOKUMEN (Template Layer output)
// Format abstrak — dikonsumsi oleh semua Renderer
// ==========================================

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
  docType: DocType
  copyType: CopyType
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
