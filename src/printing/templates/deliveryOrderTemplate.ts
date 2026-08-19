import type { TransactionData, DocumentBlueprint, DocElement } from '../types'

/**
 * Template surat jalan — fokus SKU/qty (tanpa harga), perlu tanda tangan penerima.
 * copyType 'warehouse' → tambahkan kolom lokasi rak jika ada di extra.rackLocation per item.
 */
export function buildDeliveryOrderBlueprint(
  data: TransactionData,
): DocumentBlueprint {
  const elements: DocElement[] = []

  elements.push({
    type: 'text',
    text: 'SURAT JALAN',
    align: 'center',
    bold: true,
    size: 2,
  })
  elements.push({ type: 'text', text: data.store.name, align: 'center' })
  elements.push({ type: 'separator' })

  elements.push({
    type: 'table',
    columns: [
      { width: 50, align: 'left' },
      { width: 50, align: 'right' },
    ],
    rows: [
      [`No. Surat Jalan: ${data.meta.invoiceNo}`, `Tanggal: ${data.meta.date}`],
      [data.meta.reference ? `Ref. PO/SO: ${data.meta.reference}` : '', ''],
    ],
  })
  if (data.customer?.name) {
    elements.push({
      type: 'text',
      text: `Dikirim kepada: ${data.customer.name}`,
      align: 'left',
    })
  }
  if (data.customer?.address) {
    elements.push({ type: 'text', text: data.customer.address, align: 'left' })
  }
  elements.push({ type: 'separator' })

  elements.push({
    type: 'table',
    columns: [
      { width: 10, align: 'left', header: 'SKU' },
      { width: 50, align: 'left', header: 'Nama Barang' },
      { width: 15, align: 'center', header: 'Qty' },
      { width: 25, align: 'left', header: 'Catatan' },
    ],
    showHeader: true,
    rows: data.items.map((it) => [
      it.sku || '-',
      it.name,
      `${it.qty}`,
      it.note || '',
    ]),
  })
  elements.push({ type: 'separator' })
  elements.push({ type: 'space', lines: 2 })

  elements.push({
    type: 'signature_block',
    labels: ['Dikirim oleh', 'Diperiksa oleh', 'Diterima oleh'],
  })

  return {
    docType: 'delivery_order',
    pageSize: 'A5',
    elements,
  }
}
