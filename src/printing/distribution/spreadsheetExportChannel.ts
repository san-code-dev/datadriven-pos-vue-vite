import fs from 'node:fs/promises'
import path from 'node:path'
import type { OperationResult } from '../types'
import type {
  DistributionChannel,
  DistributionPayload,
  DistributionTarget,
} from './distribution.interface'

export interface SpreadsheetExportConfig {
  mode: 'local' | 'google-sheets'
  localDir?: string // untuk mode 'local'
  googleSheetsApiUrl?: string // untuk mode 'google-sheets' (via backend proxy sendiri)
  googleAccessToken?: string
}

/**
 * Distribusi khusus untuk file XLSX (biasanya hasil dari XlsxRenderer untuk
 * docType 'report'). Dua mode:
 *  - 'local'         → simpan file XLSX ke folder lokal (laporan harian, dsb)
 *  - 'google-sheets'  → push data ke Google Sheets API (butuh backend proxy
 *                       karena OAuth2 flow tidak aman dilakukan di client)
 */
export class SpreadsheetExportChannel implements DistributionChannel {
  readonly name = 'spreadsheet-export'

  constructor(private config: SpreadsheetExportConfig) {}

  async send(
    payload: DistributionPayload,
    target: DistributionTarget,
  ): Promise<OperationResult> {
    if (this.config.mode === 'local') {
      return this.saveLocal(payload)
    }
    return this.pushToGoogleSheets(payload, target)
  }

  private async saveLocal(
    payload: DistributionPayload,
  ): Promise<OperationResult> {
    try {
      const dir = this.config.localDir || './exports'
      await fs.mkdir(dir, { recursive: true })
      const fullPath = path.join(dir, payload.fileName)
      await fs.writeFile(fullPath, payload.fileBuffer)
      return { success: true, meta: { path: fullPath } }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) }
    }
  }

  private async pushToGoogleSheets(
    payload: DistributionPayload,
    target: DistributionTarget,
  ): Promise<OperationResult> {
    if (!this.config.googleSheetsApiUrl || !this.config.googleAccessToken) {
      return {
        success: false,
        error: 'Konfigurasi Google Sheets API belum lengkap.',
      }
    }
    try {
      // Catatan: endpoint ini idealnya backend proxy milik sendiri yang
      // menerima XLSX buffer lalu memakai googleapis SDK di server side
      // untuk import data ke spreadsheet tujuan (target.recipient = spreadsheetId).
      const res = await fetch(this.config.googleSheetsApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.googleAccessToken}`,
          'Content-Type': 'application/octet-stream',
          'X-Spreadsheet-Id': target.recipient || '',
          'X-File-Name': payload.fileName,
        },
        body: payload.fileBuffer,
      })
      if (!res.ok) {
        return {
          success: false,
          error: `Gagal push ke Google Sheets: HTTP ${res.status}`,
        }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) }
    }
  }
}
