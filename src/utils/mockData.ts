import type { DocType, TransactionData } from '@/printing/types'

export const docTypeList: Array<{ value: DocType; label: string }> = [
  { value: 'invoice', label: 'Faktur (Invoice)' },
]

export const storeInfo = {
  name: 'NOTA KASIR',
  address: 'Jl. Pahlawan No. 45, Surabaya',
  phone: 'Telp: (031) 555-1234',
  npwp: '01.234.567.8-901.000',
}

export const customerInfo = {
  name: 'PT Maju Sejahtera Abadi',
  phone: '081234567890',
  address: 'Jl. Ahmad Yani No. 88, Surabaya',
  email: 'purchasing@majuabadi.com',
}

export const metaInfo = {
  invoiceNo: 'INV/2026/08/0091',
  date: '14/08/2026 15:30',
  cashier: 'Rian (Kasir 01)',
  dueDate: '28/08/2026',
  reference: 'PO-REF-9921',
}

export const items = [
  {
    sku: 'BRD-001',
    name: 'Kopi Espresso Blend (1kg)',
    qty: 2,
    price: 75000,
    subtotal: 150000,
    note: 'Extra roasting',
  },
  {
    sku: 'BRD-002',
    name: 'Roti Bakar Coklat Keju',
    qty: 5,
    price: 15000,
    subtotal: 75000,
    note: '',
  },
  {
    sku: 'BRD-003',
    name: 'Es Teh Manis Jasmine',
    qty: 10,
    price: 5000,
    subtotal: 50000,
    note: '',
  },
]

export const paymentSummary = {
  subtotal: 275000,
  discount: 10000,
  tax: 26500,
  total: 291500,
  paid: 300000,
  change: 8500,
  method: 'transfer' as const,
}

export const qrUrl = 'https://mywebsite.com/verify/INV-0091'

export const buildTransactionData = (docType: DocType): TransactionData => ({
  docType,
  meta: { ...metaInfo },
  store: { ...storeInfo },
  customer: { ...customerInfo },
  items: items.map((it) => ({ ...it })),
  payment: { ...paymentSummary },
  qrUrl,
  signature: {
    preparedBy: metaInfo.cashier,
    approvedBy: 'Manager Gudang',
    receivedBy: customerInfo.name,
  },
})
