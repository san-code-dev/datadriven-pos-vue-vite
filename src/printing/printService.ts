import type { TransactionData } from '@/utils/mockData'
import type { DocumentBlueprint } from './templates/bluePrint'
import { invoiceBluePrint } from './templates/bluePrint'

// Renderers
import { EscPosRenderer } from './renderers/escposRenderer'
import { HtmlRenderer } from './renderers/htmlRenderer'
import { XlsxRenderer } from './renderers/xlsxRenderer'
import { ZplRenderer } from './renderers/zplRenderer'

// Connections
import type { PrintConnection } from './connections/connection.interface'

// Distribution
import type {
  DistributionChannel,
  DistributionPayload,
  DistributionTarget,
} from './distribution/distribution.interface'
import type { Buffer } from 'exceljs'

const escposRenderer = new EscPosRenderer()
const htmlRenderer = new HtmlRenderer()
const xlsxRenderer = new XlsxRenderer()
const zplRenderer = new ZplRenderer()

// ==========================================
// TYPES — Hasil operasi Service
// ==========================================
export interface OperationResult {
  success: boolean
  error?: string
  meta?: Record<string, unknown>
}

export class PrintService {
  // ---------- 1+2. Data → Template ----------
  private buildBlueprint(
    data: TransactionData,
    paperWidth: 32 | 48 = 32,
  ): DocumentBlueprint {
    return invoiceBluePrint(data)
  }

  // ---------- 3. Cetak ke printer fisik (thermal/label) ----------
  async printToHardware(
    data: TransactionData,
    connection: PrintConnection,
    options: { paperWidth?: 32 | 48; format?: 'escpos' | 'zpl' } = {},
  ): Promise<OperationResult> {
    const blueprint = this.buildBlueprint(data, options.paperWidth ?? 32)

    const buffer =
      options.format === 'zpl'
        ? await zplRenderer.render(blueprint)
        : await escposRenderer.render(blueprint, {
            width: options.paperWidth ?? 32,
          })

    return connection.send(buffer)
  }

  // ---------- Render dokumen jadi PDF (untuk invoice/surat jalan/preview) ----------
  async renderToPdf(data: TransactionData): Promise<Uint8Array> {
    const blueprint = this.buildBlueprint(data)
    const result = await (window as any).electronAPI.renderPdf(blueprint)

    if (!result.success) throw new Error(result.error)

    return new Uint8Array(result.data)
  }

  // ---------- Render dokumen jadi HTML (preview UI) ----------
  async renderToHtml(
    data: TransactionData,
    paperWidth: 32 | 48 = 32,
  ): Promise<string> {
    const blueprint = this.buildBlueprint(data, paperWidth)
    return htmlRenderer.render(blueprint)
  }

  // ---------- Render dokumen jadi XLSX (laporan/export data) ----------
  async renderToXlsx(data: TransactionData): Promise<Buffer> {
    const blueprint = this.buildBlueprint(data)
    return xlsxRenderer.render(blueprint)
  }

  // ---------- 5. Distribusi ke channel digital ----------
  async distribute(
    data: TransactionData,
    channel: DistributionChannel,
    target: DistributionTarget,
    format: 'pdf' | 'xlsx' = 'pdf',
  ): Promise<OperationResult> {
    const fileBuffer =
      format === 'pdf'
        ? await this.renderToPdf(data)
        : await this.renderToXlsx(data)

    const payload: DistributionPayload = {
      fileBuffer,
      fileName: `${data.meta.invoiceNo.replace(/[/\\]/g, '-')}.${format}`,
      mimeType:
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }

    return channel.send(payload, target)
  }
}

// ==========================================
// CONTOH PEMAKAIAN
// ==========================================
/*
import { PrintService } from './PrintService'
import type { TransactionData } from './MockData'
import { NetworkConnection } from './connections/networkConnection'
import { EmailChannel } from './distribution/emailChannel'
import { WhatsAppChannel } from './distribution/whatsappChannel'

const printService = new PrintService()

const transaction: TransactionData = {
    docType: 'receipt',
    meta: { invoiceNo: 'INV/2026/08/0091', date: '15/08/26 10:00' },
    store: { name: 'KASIR POS', address: 'Jl. Pahlawan No. 45, Surabaya', phone: '(031) 555-1234' },
    items: [{ name: 'Kopi Espresso', qty: 1, price: 15000, subtotal: 15000 }],
    payment: { subtotal: 15000, total: 15000, paid: 20000, change: 5000, method: 'cash' },
    qrUrl: 'https://mywebsite.com/invoice/INV-9982',
}

// 1. Cetak fisik ke printer LAN
await printService.printToHardware(transaction, new NetworkConnection('192.168.1.200', 9100))

// 2. Kirim invoice PDF via email
const emailChannel = new EmailChannel({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: 'toko@gmail.com', pass: 'app-password' },
    fromAddress: 'toko@gmail.com', fromName: 'Kasir POS',
})
await printService.distribute(
    { ...transaction, docType: 'invoice' },
    emailChannel,
    { recipient: 'customer@email.com', subject: 'Invoice Pembelian' }
)

// 3. Kirim link WA (mode deeplink)
const waChannel = new WhatsAppChannel({ mode: 'deeplink' })
const waResult = await printService.distribute(
    { ...transaction, docType: 'invoice' },
    waChannel,
    { recipient: '08123456789', message: 'Terima kasih sudah berbelanja!' }
)
console.log(waResult.meta?.waLink) // buka link ini di browser/window baru
*/
