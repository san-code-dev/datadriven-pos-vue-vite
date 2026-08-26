// src/printing/printService.ts
import type { DocumentBlueprint, OperationResult } from './types'
import { EscPosRenderer } from './renderers/escposRenderer'
import { HtmlRenderer } from './renderers/htmlRenderer'
import { XlsxRenderer } from './renderers/xlsxRenderer'
import { ZplRenderer } from './renderers/zplRenderer'
import type { PrintConnection } from './connections/connection.interface'

const escposRenderer = new EscPosRenderer()
const htmlRenderer = new HtmlRenderer()
const xlsxRenderer = new XlsxRenderer()
const zplRenderer = new ZplRenderer()

export class PrintService {
  async printToHardware(
    blueprint: DocumentBlueprint,
    connection: PrintConnection,
  ): Promise<OperationResult> {
    // Tentukan lebar kertas (32 kolom = 58mm, 48 kolom = 80mm) berdasarkan blueprint API
    const paperWidth = blueprint.pageSize === 'thermal80' ? 48 : 32
    const isZpl = blueprint.pageSize === 'label'

    const buffer = isZpl
      ? await zplRenderer.render(blueprint)
      : await escposRenderer.render(blueprint, { width: paperWidth })

    return connection.send(
      typeof buffer === 'string' ? new TextEncoder().encode(buffer) : buffer,
    )
  }

  async renderToHtml(blueprint: DocumentBlueprint): Promise<string> {
    return htmlRenderer.render(blueprint)
  }

  async renderToPdf(blueprint: DocumentBlueprint): Promise<Uint8Array> {
    const result = await (window as any).electronAPI.renderPdf(blueprint)
    if (!result.success) throw new Error(result.error)
    return new Uint8Array(result.data)
  }

  async renderToXlsx(blueprint: DocumentBlueprint): Promise<any> {
    return xlsxRenderer.render(blueprint)
  }
}
