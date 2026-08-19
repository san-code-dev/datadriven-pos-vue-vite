import nodemailer, { Transporter } from 'nodemailer'
import type { OperationResult } from '../types'
import type {
  DistributionChannel,
  DistributionPayload,
  DistributionTarget,
} from './distribution.interface'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: { user: string; pass: string }
  fromAddress: string
  fromName?: string
}

/**
 * Kirim dokumen (PDF invoice/struk/laporan) sebagai email attachment.
 * Bisa pakai SMTP biasa (Gmail, kantor sendiri) atau layanan seperti
 * SendGrid/Mailgun (tinggal ganti host/port/auth sesuai provider).
 */
export class EmailChannel implements DistributionChannel {
  readonly name = 'email'
  private transporter: Transporter

  constructor(private config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    })
  }

  async send(
    payload: DistributionPayload,
    target: DistributionTarget,
  ): Promise<OperationResult> {
    if (!target.recipient) {
      return { success: false, error: 'Alamat email tujuan belum diisi.' }
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.fromName
          ? `"${this.config.fromName}" <${this.config.fromAddress}>`
          : this.config.fromAddress,
        to: target.recipient,
        subject: target.subject || 'Dokumen Transaksi',
        text:
          target.message || 'Terlampir dokumen transaksi Anda. Terima kasih.',
        attachments: [
          {
            filename: payload.fileName,
            content: payload.fileBuffer,
            contentType: payload.mimeType,
          },
        ],
      })
      return { success: true, meta: { messageId: info.messageId } }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) }
    }
  }
}
