import type { OperationResult } from '../types'

export interface PrintConnection {
  readonly name: string

  /** Kirim buffer mentah (ESC/POS atau ZPL) ke perangkat fisik */
  send(buffer: Uint8Array | Buffer | string): Promise<OperationResult>
}

/**
 * Daftar pola nama printer virtual yang TIDAK boleh menerima RAW bytes
 * (ESC/POS maupun ZPL) — driver ini butuh GDI rendering, bukan raw stream.
 */
export const VIRTUAL_PRINTER_PATTERN =
  /pdf|xps|onenote|fax|onedrive|document writer/i

export function isVirtualPrinter(name: string): boolean {
  return VIRTUAL_PRINTER_PATTERN.test(name || '')
}
