import { OperationResult } from '../types'
import { DistributionChannel, DistributionPayload, DistributionTarget } from './distribution.interface'

export interface FacebookConfig {
    pageAccessToken: string
    apiUrl?: string // default: https://graph.facebook.com/v19.0/me/messages
}

/**
 * Kirim dokumen via Facebook Messenger Platform API.
 * Butuh: Facebook Page terverifikasi + App yang sudah di-review Meta untuk
 * izin `pages_messaging`. `target.recipient` di sini adalah PSID (Page-Scoped
 * ID) pengguna, BUKAN nomor telepon atau username — PSID hanya didapat
 * setelah user pernah mengirim pesan ke Page terlebih dahulu (kebijakan Meta).
 *
 * Catatan praktis: untuk kasus ERP retail biasa, channel ini jarang jadi
 * prioritas dibanding WhatsApp/Email — pertimbangkan implementasi terakhir.
 */
export class FacebookChannel implements DistributionChannel {
    readonly name = 'facebook'
    private apiUrl: string

    constructor(private config: FacebookConfig) {
        this.apiUrl = config.apiUrl || 'https://graph.facebook.com/v19.0/me/messages'
    }

    async send(payload: DistributionPayload, target: DistributionTarget): Promise<OperationResult> {
        if (!target.recipient) {
            return { success: false, error: 'PSID (Page-Scoped ID) penerima belum diisi.' }
        }

        try {
            // Step 1: upload attachment
            const form = new FormData()
            form.append(
                'message',
                JSON.stringify({
                    attachment: { type: 'file', payload: { is_reusable: true } },
                })
            )
            form.append('filedata', new Blob([payload.fileBuffer], { type: payload.mimeType }), payload.fileName)

            const uploadRes = await fetch(`${this.apiUrl}?access_token=${this.config.pageAccessToken}`, {
                method: 'POST',
                body: form,
            })
            const uploadData = await uploadRes.json()
            const attachmentId = uploadData.attachment_id

            if (!attachmentId) {
                return { success: false, error: `Gagal upload attachment: ${JSON.stringify(uploadData)}` }
            }

            // Step 2: kirim pesan dengan attachment_id
            const sendRes = await fetch(`${this.apiUrl}?access_token=${this.config.pageAccessToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: target.recipient },
                    message: {
                        attachment: { type: 'file', payload: { attachment_id: attachmentId } },
                    },
                }),
            })
            const sendData = await sendRes.json()

            if (sendData.error) {
                return { success: false, error: sendData.error.message }
            }
            return { success: true, meta: { messageId: sendData.message_id } }
        } catch (err: any) {
            return { success: false, error: err.message || String(err) }
        }
    }
}
