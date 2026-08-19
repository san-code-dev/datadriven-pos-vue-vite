import type { OperationResult } from '../types'
import type { PrintConnection } from './connection.interface'

declare global {
  interface Window {
    electronAPI?: Window['electronAPI'] & {
      printRawNetwork: (args: {
        host: string
        port: number
        rawBuffer: Uint8Array
      }) => Promise<{ success: boolean; error?: string }>
    }
  }
}

/**
 * Kirim RAW bytes ke printer via socket TCP (umumnya port 9100 — standar
 * RAW printing socket untuk printer thermal/label berjaringan).
 */
export class NetworkConnection implements PrintConnection {
  readonly name = 'network'

  constructor(
    private host: string,
    private port: number = 9100,
  ) {}

  async send(buffer: Uint8Array | Buffer): Promise<OperationResult> {
    if (!this.host.trim()) {
      return { success: false, error: 'Alamat IP printer belum diisi.' }
    }
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API tidak terdeteksi.' }
    }

    try {
      const result = await window.electronAPI.printRawNetwork({
        host: this.host.trim(),
        port: this.port,
        rawBuffer:
          buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer),
      })
      return result.success
        ? { success: true }
        : { success: false, error: result.error }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) }
    }
  }
}
