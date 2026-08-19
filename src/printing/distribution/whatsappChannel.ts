import type { OperationResult } from '../types'
import type {
  DistributionChannel,
  DistributionPayload,
  DistributionTarget,
} from './distribution.interface'

/**
 * WhatsApp punya 2 mode implementasi dengan trade-off berbeda:
 *
 * MODE 'deeplink' — TANPA approval Meta, gratis, tapi TERBATAS:
 *   Hanya bisa buka chat dengan teks pre-filled (wa.me link).
 *   File (PDF/gambar struk) TIDAK bisa dikirim otomatis — user harus
 *   attach manual dari chat yang terbuka. Cocok untuk kirim "link invoice"
 *   yang di-host di server sendiri, bukan file langsung.
 *
 * MODE 'business-api' — perlu WhatsApp Business API (approval Meta,
 *   berbayar per konversasi), tapi bisa kirim file/PDF langsung otomatis
 *   tanpa interaksi manual user.
 */
export type WhatsAppMode = 'deeplink' | 'business-api'

export interface WhatsAppConfig {
  mode: WhatsAppMode
  // --- untuk mode business-api ---
  apiUrl?: string // mis. https://graph.facebook.com/v19.0/{phone-number-id}/messages
  accessToken?: string
  // --- untuk mode deeplink ---
  /** Base URL publik tempat file bisa diakses (perlu backend hosting sendiri) */
  publicFileBaseUrl?: string
}

export class WhatsAppChannel implements DistributionChannel {
  readonly name = 'whatsapp'

  constructor(private config: WhatsAppConfig) {}

  async send(
    payload: DistributionPayload,
    target: DistributionTarget,
  ): Promise<OperationResult> {
    if (!target.recipient) {
      return { success: false, error: 'Nomor WhatsApp tujuan belum diisi.' }
    }

    const phone = normalizePhoneNumber(target.recipient)

    if (this.config.mode === 'deeplink') {
      return this.sendViaDeeplink(phone, payload, target)
    }
    return this.sendViaBusinessApi(phone, payload, target)
  }

  /**
   * Mode tanpa API resmi — hanya membuka chat WA dengan teks siap kirim.
   * Return `waLink` di meta supaya UI bisa buka window/tab baru ke link ini.
   * File harus di-attach manual oleh kasir di chat yang terbuka, ATAU
   * kirim link download (jika `publicFileBaseUrl` di-set & file sudah diupload
   * ke server sendiri sebelumnya).
   */
  private async sendViaDeeplink(
    phone: string,
    payload: DistributionPayload,
    target: DistributionTarget,
  ): Promise<OperationResult> {
    let text = target.message || 'Berikut dokumen transaksi Anda.'

    if (this.config.publicFileBaseUrl) {
      // Asumsi file sudah di-upload ke storage sendiri sebelum fungsi ini dipanggil
      const fileUrl = `${this.config.publicFileBaseUrl}/${payload.fileName}`
      text += `\n${fileUrl}`
    }

    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`

    return {
      success: true,
      meta: {
        waLink,
        note: 'Mode deeplink tidak mengirim file otomatis. Buka waLink untuk lanjut kirim manual, atau gunakan mode business-api untuk otomatisasi penuh.',
      },
    }
  }

  /**
   * Mode WhatsApp Business API — kirim dokumen langsung via Meta Graph API.
   * Perlu: nomor terverifikasi, akses token, dan file sudah di-upload dulu
   * ke Meta Media endpoint (langkah upload disederhanakan di sini).
   */
  private async sendViaBusinessApi(
    phone: string,
    payload: DistributionPayload,
    target: DistributionTarget,
  ): Promise<OperationResult> {
    if (!this.config.apiUrl || !this.config.accessToken) {
      return {
        success: false,
        error:
          'Konfigurasi WhatsApp Business API (apiUrl/accessToken) belum lengkap.',
      }
    }

    try {
      // Step 1: upload media ke Meta
      const form = new FormData()
      form.append(
        'file',
        new Blob([payload.fileBuffer], { type: payload.mimeType }),
        payload.fileName,
      )
      form.append('messaging_product', 'whatsapp')

      const uploadRes = await fetch(
        `${this.config.apiUrl.replace('/messages', '/media')}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.config.accessToken}` },
          body: form,
        },
      )
      const uploadData = await uploadRes.json()
      if (!uploadData.id) {
        return {
          success: false,
          error: `Gagal upload media: ${JSON.stringify(uploadData)}`,
        }
      }

      // Step 2: kirim pesan dengan dokumen
      const sendRes = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'document',
          document: {
            id: uploadData.id,
            filename: payload.fileName,
            caption: target.message,
          },
        }),
      })
      const sendData = await sendRes.json()

      if (sendData.error) {
        return { success: false, error: sendData.error.message }
      }
      return { success: true, meta: { messageId: sendData.messages?.[0]?.id } }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) }
    }
  }
}

function normalizePhoneNumber(phone: string): string {
  // Buang karakter non-digit, ubah awalan 0 → 62 (format Indonesia)
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1)
  return cleaned
}
