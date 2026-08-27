import type { DocElement } from '../types'
import type { Renderer, RenderOptions } from './renderer.interface'
import type { DocumentBlueprint } from '../types'

/**
 * Merender blueprint jadi HTML string.
 * Dipakai untuk: preview di UI, basis konversi ke PDF (via puppeteer/wkhtmltopdf),
 * atau basis konversi ke gambar PNG (untuk share ke WhatsApp).
 */
export class HtmlRenderer implements Renderer<string> {
  readonly name = 'html'

  async render(
    blueprint: DocumentBlueprint,
    options: RenderOptions = {},
  ): Promise<string> {
    const isThermal =
      blueprint.pageSize === 'thermal58' || blueprint.pageSize === 'thermal80'

    const pageWidthCss =
      blueprint.pageSize === 'thermal58'
        ? '58mm'
        : blueprint.pageSize === 'thermal80'
          ? '80mm'
          : '210mm'

    const pageCssSize =
      blueprint.pageSize === 'thermal58'
        ? '58mm auto'
        : blueprint.pageSize === 'thermal80'
          ? '80mm auto'
          : blueprint.pageSize === 'A5'
            ? 'A5'
            : 'A4'

    const body = blueprint.elements
      .map((el) => this.renderElement(el))
      .join('\n')

    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<style>
  /* === STYLING UTAMA (Untuk Preview di iframe / UI) === */
  html, body {
    margin: 0;
    padding: 20px 0;
    background: #333333; /* Background gelap kontras kembali untuk Preview iframe */
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    box-sizing: border-box;
  }

  /* Kertas Struk / Dokumen */
  .document-sheet {
    font-family: ${isThermal ? "'Courier New', monospace" : "'Helvetica Neue', Arial, sans-serif"};
    width: ${pageWidthCss};
    background: #ffffff;
    padding: ${isThermal ? '8px' : '24px'};
    font-size: ${isThermal ? '11px' : '13px'};
    color: #111;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); /* Efek bayangan kertas saat di iframe */
  }

  .align-center { text-align: center; }
  .align-right { text-align: right; }
  .align-left { text-align: left; }
  .bold { font-weight: 700; }
  .italic { font-style: italic; }
  .separator { border-bottom: 1px dashed #999; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th { text-align: left; border-bottom: 1px solid #333; font-size: 11px; padding: 2px 4px; }
  td { padding: 2px 4px; vertical-align: top; }
  .signature-block { display: flex; justify-content: space-between; margin-top: 40px; }
  .signature-box { text-align: center; width: 30%; }
  .signature-line { border-top: 1px solid #333; margin-top: 48px; padding-top: 4px; }
  
  .qr-placeholder { 
    width: 80px; 
    height: 80px; 
    border: 1px solid #ccc; 
    margin: 8px auto; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 9px; 
  }
  .qr-placeholder img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .barcode-container {
    margin: 6px 0;
  }
  .barcode-container img {
    max-width: 100%;
    height: auto;
    display: inline-block;
  }

  /* === STYLING KHUSUS UNTUK CETAK / PUPPETEER PDF === */
  @media print {
    @page {
      size: ${pageCssSize};
      margin: 0;
    }

    html, body {
      background: #ffffff !important; /* Hapus background gelap saat di-PDF-kan */
      padding: 0 !important;
      display: block !important;
      min-height: auto !important;
    }

    .document-sheet {
      box-shadow: none !important; /* Hapus bayangan saat di-PDF-kan */
      margin: 0 auto !important;
    }
  }
</style>
</head>
<body>
<div class="document-sheet">
${body}
</div>
</body>
</html>`
  }

  private renderElement(el: DocElement): string {
    switch (el.type) {
      case 'text':
        return `<div class="${this.alignClass(el.align)} ${el.bold ? 'bold' : ''} ${el.italic ? 'italic' : ''}" style="${el.size ? `font-size:${11 + el.size * 3}px` : ''}">${escapeHtml(el.text)}</div>`

      case 'separator':
        return `<div class="separator"></div>`

      case 'table': {
        const header = el.showHeader
          ? `<thead><tr>${el.columns.map((c) => `<th class="${this.alignClass(c.align)}">${escapeHtml(c.header || '')}</th>`).join('')}</tr></thead>`
          : ''
        const rows = el.rows
          .map(
            (row) =>
              `<tr class="${el.bold ? 'bold' : ''}">${row
                .map(
                  (cell, i) =>
                    `<td class="${this.alignClass(el.columns[i]?.align)}">${escapeHtml(cell)}</td>`,
                )
                .join('')}</tr>`,
          )
          .join('')
        return `<table>${header}<tbody>${rows}</tbody></table>`
      }

      case 'qrcode':
        return `<div class="${this.alignClass(el.align)}"><div class="qr-placeholder" data-qr-value="${escapeHtml(el.value)}">QR: ${escapeHtml(el.value.slice(0, 20))}</div></div>`

      case 'barcode':
        return `<div class="${this.alignClass(el.align)} barcode-container">
          <img src="https://barcode.tec-it.com/barcode.ashx?code=${escapeHtml(el.format)}&data=${escapeHtml(el.value)}&dpi=150" alt="Barcode ${escapeHtml(el.value)}" />
        </div>`

      case 'image':
        return `<div class="${this.alignClass(el.align)}"><img src="${el.url}" style="max-width:${el.width || 100}%" /></div>`

      case 'space':
        return `<div style="height:${(el.lines || 1) * 10}px"></div>`

      case 'pagebreak':
        return `<div style="page-break-after: always"></div>`

      case 'signature_block':
        return `<div class="signature-block">${el.labels
          .map(
            (label) =>
              `<div class="signature-box"><div class="signature-line">${escapeHtml(label)}</div></div>`,
          )
          .join('')}</div>`
    }
  }

  private alignClass(align?: string): string {
    return align === 'center'
      ? 'align-center'
      : align === 'right'
        ? 'align-right'
        : 'align-left'
  }
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  )
}
