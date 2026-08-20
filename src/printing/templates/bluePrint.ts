// import type { TransactionData, DocumentBlueprint, DocElement } from '../types'
// import { useNumberFormat } from '@/composables/number-format'

// export function invoiceBluePrint(
//   data: TransactionData,
//   pageSize: 'thermal58' | 'thermal80' | 'A4' = 'A4',
// ): DocumentBlueprint {
//   const numberFormat = useNumberFormat()
//   const elements: DocElement[] = []

//   // --- Header toko ---
//   elements.push({
//     type: 'text',
//     text: data.store.name,
//     align: 'center',
//     bold: true,
//     size: 2,
//   })
//   elements.push({ type: 'text', text: data.store.address, align: 'center' })
//   elements.push({ type: 'text', text: data.store.phone, align: 'center' })
//   if (data.store.npwp) {
//     elements.push({
//       type: 'text',
//       text: `NPWP: ${data.store.npwp}`,
//       align: 'center',
//     })
//   }
//   elements.push({ type: 'separator', style: 'dashed' })

//   // --- Info invoice ---
//   elements.push({
//     type: 'table',
//     columns: [
//       { width: 50, align: 'left' },
//       { width: 50, align: 'right' },
//     ],
//     rows: [
//       [`No: ${data.meta.invoiceNo}`, `${data.meta.date}`],
//       [
//         data.customer?.name ? `Cust: ${data.customer.name}` : '',
//         data.meta.cashier ? `Kasir: ${data.meta.cashier}` : '',
//       ],
//     ],
//   })
//   elements.push({ type: 'separator', style: 'dashed' })

//   // --- Tabel item ---
//   const cols = [
//     { width: 46, align: 'left' as const, header: 'Item' },
//     { width: 10, align: 'center' as const, header: 'Qty' },
//     { width: 20, align: 'right' as const, header: 'Harga' },
//     { width: 24, align: 'right' as const, header: 'Subtotal' },
//   ]

//   elements.push({
//     type: 'table',
//     columns: cols,
//     showHeader: pageSize === 'A4',
//     rows: data.items.map((it) => [
//       it.name,
//       `${it.qty}`,
//       numberFormat.formatCurrency(it.price),
//       numberFormat.formatCurrency(it.subtotal),
//     ]),
//   })
//   elements.push({ type: 'separator', style: 'dashed' })

//   // --- Ringkasan pembayaran ---
//   const summaryRows: string[][] = [
//     ['Subtotal', numberFormat.formatCurrency(data.payment.subtotal)],
//   ]
//   if (data.payment.discount)
//     summaryRows.push([
//       'Diskon',
//       `-${numberFormat.formatCurrency(data.payment.discount)}`,
//     ])
//   if (data.payment.tax)
//     summaryRows.push(['PPN', numberFormat.formatCurrency(data.payment.tax)])
//   summaryRows.push(['TOTAL', numberFormat.formatCurrency(data.payment.total)])
//   summaryRows.push(['DIBAYAR', numberFormat.formatCurrency(data.payment.paid)])
//   summaryRows.push([
//     'KEMBALI',
//     numberFormat.formatCurrency(data.payment.change),
//   ])

//   elements.push({
//     type: 'table',
//     columns: [
//       { width: 60, align: 'left' },
//       { width: 40, align: 'right' },
//     ],
//     rows: summaryRows,
//     bold: true,
//   })
//   elements.push({ type: 'space', lines: 1 })

//   if (data.qrUrl) {
//     elements.push({ type: 'qrcode', value: data.qrUrl, align: 'center' })
//   }

//   elements.push({ type: 'space', lines: 1 })
//   elements.push({
//     type: 'text',
//     text: 'Terima kasih atas kunjungan Anda',
//     align: 'center',
//     italic: true,
//   })

//   return {
//     docType: 'invoice',
//     pageSize: pageSize,
//     elements,
//   }
// }
