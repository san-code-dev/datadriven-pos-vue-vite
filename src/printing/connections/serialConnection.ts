import type { OperationResult } from '../types'
import type { PrintConnection } from './connection.interface'

/**
 * Kirim RAW bytes via port serial (RS232) — masih relevan untuk:
 *  - Printer dot-matrix lama (nota rangkap karbon) yang belum punya USB/LAN
 *  - Trigger cash drawer yang terhubung lewat printer serial
 *
 * Di Electron, akses serial port biasanya lewat modul Node 'serialport'
 * (dijalankan di main process, bukan renderer), diekspos via IPC.
 */
declare global {
  interface Window {
    electronAPI?: Window['electronAPI'] & {
      printRawSerial: (args: {
        path: string
        baudRate: number
        rawBuffer: Uint8Array
      }) => Promise<{ success: boolean; error?: string }>
      listSerialPorts: () => Promise<{ path: string; manufacturer?: string }[]>
    }
  }
}

export class SerialConnection implements PrintConnection {
  readonly name = 'serial'

  constructor(
    private portPath: string,
    private baudRate: number = 9600,
  ) {}

  async send(buffer: Uint8Array | Buffer): Promise<OperationResult> {
    if (!this.portPath) {
      return {
        success: false,
        error: 'Port serial belum dipilih (mis. COM3, /dev/ttyUSB0).',
      }
    }
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API tidak terdeteksi.' }
    }

    try {
      const result = await window.electronAPI.printRawSerial({
        path: this.portPath,
        baudRate: this.baudRate,
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

  static async listPorts(): Promise<{ path: string; manufacturer?: string }[]> {
    if (!window.electronAPI) return []
    return window.electronAPI.listSerialPorts()
  }
}
