import type { OperationResult } from '../types'

export interface DistributionPayload {
  /** File yang akan didistribusikan (PDF/XLSX/PNG buffer, atau path lokal) */
  fileBuffer: Buffer
  fileName: string
  mimeType: string
}

export interface DistributionTarget {
  /** Nomor WA, alamat email, dst — tergantung channel */
  recipient?: string
  /** Pesan pengantar / subject / caption */
  message?: string
  subject?: string
}

export interface DistributionChannel {
  readonly name: string
  send(
    payload: DistributionPayload,
    target: DistributionTarget,
  ): Promise<OperationResult>
}
