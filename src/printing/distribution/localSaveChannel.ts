import type { OperationResult } from '../types'
import type {
  DistributionChannel,
  DistributionPayload,
  DistributionTarget,
} from './distribution.interface'

declare global {
  interface Window {
    electronAPI?: Window['electronAPI'] & {
      saveFileDialog: (args: {
        fileName: string
        fileBuffer: Uint8Array
        mimeType: string
      }) => Promise<{ success: boolean; path?: string; error?: string }>
    }
  }
}

/**
 * Simpan dokumen (biasanya PDF) ke disk lokal via native Save Dialog Electron.
 * Dipakai untuk kasus "unduh invoice" atau arsip manual oleh user.
 */
export class LocalSaveChannel implements DistributionChannel {
  readonly name = 'local-save'

  async send(
    payload: DistributionPayload,
    _target: DistributionTarget,
  ): Promise<OperationResult> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API tidak terdeteksi.' }
    }

    try {
      const result = await window.electronAPI.saveFileDialog({
        fileName: payload.fileName,
        fileBuffer: new Uint8Array(payload.fileBuffer),
        mimeType: payload.mimeType,
      })
      return result.success
        ? { success: true, meta: { path: result.path } }
        : { success: false, error: result.error }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) }
    }
  }
}
