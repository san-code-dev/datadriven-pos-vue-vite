import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
import type {
  DocumentBlueprint,
  DocElement,
  TableCell,
  TableCellContent
} from '@/types/print-service/print'
import type { Renderer, RenderOptions } from './renderer.interface'

export interface EscPosOptions extends RenderOptions {
  /** 32 kolom untuk 58mm, 48 kolom untuk 80mm */
  width?: 32 | 48
}

export class EscPosRenderer implements Renderer<Uint8Array> {
  readonly name = 'escpos'

  /**
   * Helper untuk mengonversi isi sel tabel yang kompleks menjadi string mentah
   */
  private flattenCellToString(cell: string | TableCellContent | TableCell): string {
    if (typeof cell === 'string') return cell

    // Jika berbentuk objek TableCell
    if ('content' in cell) {
      if (typeof cell.content === 'string') return cell.content
      if (Array.isArray(cell.content)) {
        return cell.content
          .map((item) => (item.type === 'text' ? item.text : ''))
          .filter(Boolean)
          .join(' ')
      }
      return cell.content.type === 'text' ? cell.content.text : ''
    }

    // Jika berbentuk TableCellContent tunggal
    if ('type' in cell && cell.type === 'text') {
      return cell.text
    }

    return '' // Gambar/Barcode di dalam sel thermal di-fallback ke string kosong (atau handle via canvas)
  }

  /**
   * Mapping ukuran font dari tipe blueprint ke angka skala ESC/POS
   */
  private mapFontSize(size?: 'small' | 'normal' | 'large' | 'xlarge' | number): number {
    if (typeof size === 'number') return size
    switch (size) {
      case 'small': return 1
      case 'normal': return 1
      case 'large': return 2
      case 'xlarge': return 3
      default: return 1
    }
  }

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

    let hasExplicitCut = false

    for (const el of blueprint.elements) {
      switch (el.type) {
        case 'text': {
          if (el.align) encoder = encoder.align(el.align)
          if (el.bold) encoder = encoder.bold(true)
          if (el.italic) encoder = encoder.italic(true)
          if (el.underline) encoder = encoder.underline(true)

          const fontSize = this.mapFontSize(el.size)
          if (fontSize > 1) encoder = encoder.size(fontSize)

          encoder = encoder.line(el.text)

          // Reset styling
          if (fontSize > 1) encoder = encoder.size(1)
          if (el.underline) encoder = encoder.underline(false)
          if (el.italic) encoder = encoder.italic(false)
          if (el.bold) encoder = encoder.bold(false)
          if (el.align) encoder = encoder.align('left')
          break
        }

        case 'separator': {
          const char = el.char ?? (el.style === 'double' ? '=' : '-')
          const lineSeparator = char.repeat(width).slice(0, width)
          encoder = encoder.align('left').line(lineSeparator)
          break
        }

        case 'table': {
          if (el.bold) encoder = encoder.bold(true)

          // Sanitize columns width & alignment
          const columns = el.columns.map((c) => ({
            width: c.width,
            align: c.align ?? 'left',
          }))

          // Flatten rows agar kompatibel dengan ReceiptPrinterEncoder (string[][])
          const formattedRows = el.rows.map((row) =>
            row.map((cell) => this.flattenCellToString(cell))
          )

          encoder = encoder.table(columns, formattedRows)

          if (el.bold) encoder = encoder.bold(false)
          break
        }

        case 'qrcode': {
          const qrSize = el.size ?? 6
          encoder = encoder
            .align(el.align || 'center')
            .qrcode(el.value, 1, qrSize, 'h')
            .align('left')
          break
        }

        case 'barcode': {
          const format = (el.format || 'CODE128').toLowerCase()
          const height = el.height ?? 60

          encoder = encoder
            .align(el.align || 'center')
            .barcode(el.value, format, height)
            .align('left')
          break
        }

        case 'space': {
          encoder = encoder.newline(el.lines || 1)
          break
        }

        case 'cut': {
          hasExplicitCut = true
          const cutMode = el.mode === 'full' ? 'full' : 'partial'
          encoder = encoder.newline(3).cut(cutMode)
          break
        }

        case 'drawer': {
          const pin = el.pin ?? 2
          encoder = encoder.pulse(pin === 2 ? 0 : 1)
          break
        }

        case 'image': {
          // Jika menggunakan base64/URL, decode ke Canvas/ImageData lalu panggil:
          // encoder = encoder.align(el.align || 'center').image(imageData, width, height)
          break
        }

        case 'label_grid':
        case 'signature_block':
        case 'pagebreak':
          // Diabaikan untuk printer thermal continuous roll
          break
      }
    }

    // Default Fallback: Jika di blueprint tidak ada elemen 'cut', lakukan auto-feed & cut di akhir
    if (!hasExplicitCut) {
      encoder = encoder.newline(4).cut('partial')
    }

    return encoder.encode()
  }
}