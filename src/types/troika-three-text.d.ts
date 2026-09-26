declare module 'troika-three-text' {
  import type { Mesh } from 'three'
  /** Minimal surface of troika's SDF Text used by the drawing sheet. */
  export class Text extends Mesh {
    text: string
    font: string | null
    fontSize: number
    anchorX: number | string
    anchorY: number | string
    letterSpacing: number
    lineHeight: number | string
    maxWidth: number
    textAlign: string
    color: unknown
    fillOpacity: number
    clipRect: number[] | null
    sdfGlyphSize: number | null
    textRenderInfo: { blockBounds: number[] } | null
    sync(callback?: () => void): void
    dispose(): void
    // troika dispatches `{ type: 'synccomplete' }` after every completed sync (no payload);
    // Object3DEventMap doesn't know it. Widened so the override stays compatible with
    // Object3D's generic signature.
    addEventListener(type: string, listener: (event: any) => void): void
    removeEventListener(type: string, listener: (event: any) => void): void
  }
  export class BatchedText extends Text {
    addText(text: Text): void
    removeText(text: Text): void
  }
  export function preloadFont(options: { font: string; characters?: string }, callback: () => void): void
  export function configureTextBuilder(config: Record<string, unknown>): void
}
