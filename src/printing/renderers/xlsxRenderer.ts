import ExcelJS from 'exceljs'
import type { DocumentBlueprint } from '../types'
import type { Renderer, RenderOptions } from './renderer.interface'

export interface XlsxOptions extends RenderOptions {
  sheetName?: string
}

/**
 * Render blueprint → XLSX Buffer.
 * Cocok untuk docType 'report' (sales report, stock opname), atau invoice
 * yang perlu diekspor sebagai data terstruktur, bukan cuma dokumen visual.
 * Hanya elemen 'table' yang benar-benar dikonversi jadi baris spreadsheet;
 * elemen lain (text/separator) ditulis sebagai baris judul/catatan.
 */
export class XlsxRenderer implements Renderer<Buffer> {
  readonly name = 'xlsx'

  async render(
    blueprint: DocumentBlueprint,
    options: XlsxOptions = {},
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(options.sheetName || blueprint.docType)

    let currentRow = 1

    for (const el of blueprint.elements) {
      if (el.type === 'text') {
        const cell = sheet.getCell(currentRow, 1)
        cell.value = el.text
        if (el.bold)
          cell.font = { bold: true, size: el.size ? 12 + el.size * 2 : 11 }
        currentRow += 1
      } else if (el.type === 'table') {
        if (el.showHeader) {
          el.columns.forEach((col, idx) => {
            const cell = sheet.getCell(currentRow, idx + 1)
            cell.value = col.header || ''
            cell.font = { bold: true }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFEFEFEF' },
            }
          })
          currentRow += 1
        }
        for (const row of el.rows) {
          row.forEach((val, idx) => {
            const cell = sheet.getCell(currentRow, idx + 1)
            // Coba parse angka (buang "Rp" dan titik ribuan) supaya bisa dihitung di Excel
            const numeric = parseNumericIfPossible(val)
            cell.value = numeric ?? val
            if (el.bold) cell.font = { bold: true }
          })
          currentRow += 1
        }
        currentRow += 1 // spasi setelah tabel
      } else if (el.type === 'separator') {
        currentRow += 1
      } else if (el.type === 'space') {
        currentRow += el.lines || 1
      }
    }

    // Auto-width kolom sederhana
    sheet.columns.forEach((col) => {
      let maxLen = 10
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? '').length
        if (len > maxLen) maxLen = len
      })
      col.width = Math.min(maxLen + 2, 40)
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }
}

function parseNumericIfPossible(val: string): number | null {
  const cleaned = val
    .replace(/^Rp\s?/i, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/x$/i, '')
  const n = Number(cleaned)
  return !isNaN(n) && cleaned.trim() !== '' ? n : null
}
