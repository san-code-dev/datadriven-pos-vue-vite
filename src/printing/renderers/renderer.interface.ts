import type { DocumentBlueprint } from '../templates/bluePrint'
export interface RenderOptions {
  [key: string]: unknown
}

export interface Renderer<TOutput = Buffer> {
  /** Nama renderer, untuk logging/debug */
  readonly name: string

  render(
    blueprint: DocumentBlueprint,
    options?: RenderOptions,
  ): Promise<TOutput>
}
