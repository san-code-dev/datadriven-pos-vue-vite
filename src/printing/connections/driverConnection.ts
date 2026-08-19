import type { OperationResult } from '../types'
import { type PrintConnection, isVirtualPrinter } from './connection.interface'

// Tipe minimal untuk window.electronAPI (didefinisikan lengkap di preload.ts)
declare global {
  interface Window {
    electronAPI?: {
      getPrinters: () => Promise<any[]>
      printRawDriver: (args: {
        printerName: string
        rawBuffer: Uint8Array
      }) => Promise<{ success: boolean; error?: string }>
    }
  }
}

/**
 * Kirim RAW bytes ke printer yang terpasang di OS (Windows Spooler via winspool.drv).
 * Divalidasi dulu supaya tidak dikirim ke printer virtual (PDF/XPS) yang akan
 * menghasilkan file 0 byte karena driver tersebut butuh GDI, bukan RAW stream.
 */
export class DriverConnection implements PrintConnection {
  readonly name = 'driver'

  constructor(private printerName: string) {}

  async send(buffer: Uint8Array | Buffer): Promise<OperationResult> {
    const cleanName = this.printerName.trim()

    if (!cleanName) {
      return { success: false, error: 'Nama printer belum dipilih.' }
    }

    if (isVirtualPrinter(cleanName)) {
      return {
        success: false,
        error: `Printer "${cleanName}" adalah printer virtual dan tidak mendukung data RAW. Pilih printer thermal/label fisik.`,
      }
    }

    if (!window.electronAPI) {
      return { success: false, error: 'Electron API tidak terdeteksi.' }
    }

    try {
      const result = await window.electronAPI.printRawDriver({
        printerName: cleanName,
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

  static async listPrinters(): Promise<{ name: string; isDefault: boolean }[]> {
    if (!window.electronAPI) return []
    const printers = await window.electronAPI.getPrinters()
    // Filter otomatis buang printer virtual dari daftar pilihan user
    return (printers || []).filter((p) => !isVirtualPrinter(p.name))
  }
}
