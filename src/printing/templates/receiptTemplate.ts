import type {
  TransactionData,
  DocumentBlueprint,
  DocElement,
  TableColumn,
} from '../types'

/**
 * Template struk thermal (58mm = 32 kolom, 80mm = 48 kolom)
 * copyType menentukan field apa saja yang ditampilkan:
 *  - customer/merchant → full harga
 *  - kitchen           → tanpa harga, fokus nama item + qty + note
 */
export function buildReceiptBlueprint(
  data: TransactionData,
  paperWidth: 32 | 48 = 32,
): DocumentBlueprint {
  const elements: DocElement[] = []

  const itemCols: TableColumn[] =
    paperWidth === 32
      ? [
          { width: 16, align: 'left' },
          { width: 4, align: 'center' },
          { width: 12, align: 'right' },
        ]
      : [
          { width: 26, align: 'left' },
          { width: 6, align: 'center' },
          { width: 16, align: 'right' },
        ]

  const kitchenCols: TableColumn[] =
    paperWidth === 32
      ? [
          { width: 24, align: 'left' },
          { width: 8, align: 'center' },
        ]
      : [
          { width: 36, align: 'left' },
          { width: 12, align: 'center' },
        ]

  // --- Header ---
  elements.push({
    type: 'text',
    text: data.store.name,
    align: 'center',
    bold: true,
    size: 2,
  })
  elements.push({ type: 'separator' })

  // --- Metadata ---
  const half = Math.floor(paperWidth / 2)
  elements.push({
    type: 'table',
    columns: [
      { width: half, align: 'left' },
      { width: paperWidth - half, align: 'right' },
    ],
    rows: [[data.meta.invoiceNo, data.meta.date]],
  })

  elements.push({ type: 'separator' })

  // --- Items ---

  elements.push({
    type: 'table',
    columns: itemCols,
    rows: data.items.map((it) => [
      it.name,
      `${it.qty}x`,
      formatCurrency(it.subtotal),
    ]),
  })

  elements.push({ type: 'separator' })

  // --- Payment (skip untuk kitchen copy) ---

  const rows: string[][] = [
    ['TOTAL', formatCurrency(data.payment.total)],
    [labelForMethod(data.payment.method), formatCurrency(data.payment.paid)],
    ['KEMBALI', formatCurrency(data.payment.change)],
  ]
  elements.push({
    type: 'table',
    columns: [
      { width: half, align: 'left' },
      { width: paperWidth - half, align: 'right' },
    ],
    rows,
    bold: true,
  })
  elements.push({ type: 'separator' })

  if (data.qrUrl) {
    elements.push({ type: 'qrcode', value: data.qrUrl, align: 'center' })
    elements.push({ type: 'space', lines: 1 })
  }

  elements.push({
    type: 'text',
    text: 'Terima Kasih Atas Kunjungan Anda!',
    align: 'center',
  })
  elements.push({
    type: 'text',
    text: 'Barang yang dibeli tidak dapat ditukar.',
    align: 'center',
  })

  return {
    docType: 'receipt',
    pageSize: paperWidth === 32 ? 'thermal58' : 'thermal80',
    elements,
  }
}

function formatCurrency(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function labelForMethod(method: string): string {
  const map: Record<string, string> = {
    cash: 'BAYAR (CASH)',
    debit: 'BAYAR (DEBIT)',
    credit: 'BAYAR (KREDIT)',
    qris: 'BAYAR (QRIS)',
    transfer: 'BAYAR (TRANSFER)',
    other: 'BAYAR',
  }
  return map[method] || 'BAYAR'
}
