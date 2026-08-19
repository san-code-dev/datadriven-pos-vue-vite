import type { DocType, TransactionData } from '@/utils/mockData'

// ==========================================
// TYPES — Blueprint (output Template Layer)
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
  pageSize?: 'thermal58' | 'thermal80' | 'A4' | 'A5' | 'label'
  elements: DocElement[]
}

// ==========================================
// TEMPLATE — Invoice/Faktur (kertas A4/A5)
// Dipakai oleh PdfRenderer / HtmlRenderer (bukan ESC/POS)
// ==========================================
export function invoiceBluePrint(data: TransactionData): DocumentBlueprint {
  const elements: DocElement[] = []

  // --- Header toko ---
  elements.push({
    type: 'text',
    text: data.store.name,
    align: 'left',
    bold: true,
    size: 2,
  })
  elements.push({ type: 'text', text: data.store.address, align: 'left' })
  elements.push({ type: 'text', text: data.store.phone, align: 'left' })
  if (data.store.npwp) {
    elements.push({
      type: 'text',
      text: `NPWP: ${data.store.npwp}`,
      align: 'left',
    })
  }
  elements.push({ type: 'separator', style: 'solid' })

  // --- Info invoice & customer (2 kolom) ---
  elements.push({
    type: 'table',
    columns: [
      { width: 50, align: 'left' },
      { width: 50, align: 'right' },
    ],
    rows: [
      [`No. Invoice: ${data.meta.invoiceNo}`, `Tanggal: ${data.meta.date}`],
      [
        data.customer?.name ? `Kepada: ${data.customer.name}` : '',
        data.meta.dueDate ? `Jatuh Tempo: ${data.meta.dueDate}` : '',
      ],
    ],
  })
  if (data.customer?.address) {
    elements.push({ type: 'text', text: data.customer.address, align: 'left' })
  }
  elements.push({ type: 'separator' })

  // --- Tabel item lengkap ---
  const cols = [
    { width: 46, align: 'left' as const, header: 'Item' },
    { width: 10, align: 'center' as const, header: 'Qty' },
    { width: 20, align: 'right' as const, header: 'Harga' },
    { width: 24, align: 'right' as const, header: 'Subtotal' },
  ]

  elements.push({
    type: 'table',
    columns: cols,
    showHeader: true,
    rows: data.items.map((it) => [
      it.name,
      `${it.qty}`,
      formatCurrency(it.price),
      formatCurrency(it.subtotal),
    ]),
  })
  elements.push({ type: 'separator' })

  // --- Ringkasan pembayaran ---
  const summaryRows: string[][] = [
    ['Subtotal', formatCurrency(data.payment.subtotal)],
  ]
  if (data.payment.discount)
    summaryRows.push(['Diskon', `-${formatCurrency(data.payment.discount)}`])
  if (data.payment.tax)
    summaryRows.push(['PPN', formatCurrency(data.payment.tax)])
  summaryRows.push(['TOTAL', formatCurrency(data.payment.total)])

  elements.push({
    type: 'table',
    columns: [
      { width: 70, align: 'left' },
      { width: 30, align: 'right' },
    ],
    rows: summaryRows,
    bold: true,
  })
  elements.push({ type: 'space', lines: 2 })

  // --- Tanda tangan (opsional, untuk copy tertentu) ---
  if (data.signature) {
    const labels = Object.values(data.signature).filter(Boolean) as string[]
    elements.push({ type: 'signature_block', labels })
  }

  if (data.qrUrl) {
    elements.push({ type: 'qrcode', value: data.qrUrl, align: 'right' })
  }

  return {
    docType: 'invoice',
    pageSize: 'A4',
    elements,
  }
}

function formatCurrency(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}
