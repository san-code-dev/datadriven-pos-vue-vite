import type { DocumentBlueprint } from '../templates/bluePrint'
import type { Renderer, RenderOptions } from './renderer.interface'

export interface ZplOptions extends RenderOptions {
  /** Ukuran label dalam dot, default label 40mm x 30mm @ 203dpi */
  widthDots?: number
  heightDots?: number
}

/**
 * Render blueprint → ZPL string (Zebra Programming Language).
 * Khusus untuk docType 'label' — printer barcode Zebra/TSC/Godex.
 * Berbeda command set total dari ESC/POS, jangan dicampur.
 */
export class ZplRenderer implements Renderer<string> {
  readonly name = 'zpl'

  async render(
    blueprint: DocumentBlueprint,
    options: ZplOptions = {},
  ): Promise<string> {
    const width = options.widthDots ?? 320 // ~40mm @ 203dpi
    const height = options.heightDots ?? 240 // ~30mm @ 203dpi

    let zpl = '^XA\n' // Start label
    zpl += `^PW${width}\n` // Print width
    zpl += `^LL${height}\n` // Label length

    let y = 20
    for (const el of blueprint.elements) {
      if (el.type === 'text') {
        const fontSize = el.size ? 20 + el.size * 10 : 20
        zpl += `^FO20,${y}^A0N,${fontSize},${fontSize}^FD${escapeZpl(el.text)}^FS\n`
        y += fontSize + 10
      } else if (el.type === 'barcode') {
        zpl += `^FO20,${y}^BY2\n^BCN,60,Y,N,N\n^FD${escapeZpl(el.value)}^FS\n`
        y += 80
      } else if (el.type === 'qrcode') {
        zpl += `^FO20,${y}^BQN,2,5\n^FDQA,${escapeZpl(el.value)}^FS\n`
        y += 100
      } else if (el.type === 'space') {
        y += (el.lines || 1) * 15
      }
    }

    zpl += '^XZ\n' // End label
    return zpl
  }
}

function escapeZpl(str: string): string {
  // ZPL pakai ^ dan ~ sebagai control char, escape kalau muncul di data
  return str.replace(/\^/g, '').replace(/~/g, '')
}
