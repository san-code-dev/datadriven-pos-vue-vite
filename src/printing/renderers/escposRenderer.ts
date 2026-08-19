import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
import type { DocumentBlueprint } from '../templates/bluePrint'
import type { Renderer, RenderOptions } from './renderer.interface'

export interface EscPosOptions extends RenderOptions {
  /** 32 kolom untuk 58mm, 48 kolom untuk 80mm */
  width?: 32 | 48
}

/**
 * Renderer untuk printer thermal ESC/POS.
 * HANYA cocok untuk printer fisik thermal — jangan dikirim ke printer
 * virtual (PDF/XPS) atau printer laser/inkjet biasa (lihat catatan di README).
 */
export class EscPosRenderer implements Renderer<Uint8Array> {
  readonly name = 'escpos'

  async render(
    blueprint: DocumentBlueprint,
    options: EscPosOptions = {},
  ): Promise<Uint8Array> {
    const width =
      options.width ?? (blueprint.pageSize === 'thermal80' ? 48 : 32)
    let encoder = new ReceiptPrinterEncoder({
      language: 'esc-pos',
      width,
    }).initialize()
    const lineSeparator = '-'.repeat(width)

    for (const el of blueprint.elements) {
      switch (el.type) {
        case 'text': {
          if (el.align) encoder = encoder.align(el.align)
          if (el.bold) encoder = encoder.bold(true)
          if (el.size) encoder = encoder.size(el.size)
          encoder = encoder.line(el.text)
          if (el.size) encoder = encoder.size(1)
          if (el.bold) encoder = encoder.bold(false)
          break
        }
        case 'separator':
          encoder = encoder.align('left').line(lineSeparator)
          break
        case 'table':
          if (el.bold) encoder = encoder.bold(true)
          encoder = encoder.table(
            el.columns.map((c) => ({ width: c.width, align: c.align })),
            el.rows,
          )
          if (el.bold) encoder = encoder.bold(false)
          break
        case 'qrcode':
          encoder = encoder
            .align(el.align || 'center')
            .qrcode(el.value, 1, 6, 'h')
          break
        case 'barcode':
          // @point-of-sale/receipt-printer-encoder mendukung .barcode(value, symbology, height)
          encoder = encoder
            .align(el.align || 'center')
            .barcode(el.value, el.format || 'CODE128', 60)
          break
        case 'image':
          // Perlu decode gambar jadi bitmap dulu (di luar scope skeleton ini) —
          // umumnya pakai encoder.image(bitmapCanvas, ...)
          break
        case 'space':
          encoder = encoder.newline(el.lines || 1)
          break
        case 'signature_block':
          // ESC/POS tidak butuh blok tanda tangan visual — skip
          break
        case 'pagebreak':
          // Tidak relevan untuk thermal continuous roll
          break
      }
    }

    return encoder.newline(4).cut().encode()
  }
}
