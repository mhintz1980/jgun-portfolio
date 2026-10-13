import { Vector2, type Mesh, type WebGLRenderer } from 'three'
import {
  SHEET_HEIGHT, SHEET_WIDTH, type DrawingGeometry, type DrawingLayout, type RenderedDrawing,
} from '../drawingGeometry'
import { bindExtractionPressure, solveExtraction, type Extraction } from '../poseCore'
import { composeSheet } from './composeSheet'
import { prepareDrawingCache } from './drawingCache'
import { GROUP, makeInkFills, makeInkLines, makeSheetUniforms, type SheetUniforms } from './ink'
import { clearPaperFlexField, makePaperFlexField, type PaperFlexField } from './paperFlex'
import { bakeProfile } from './profile'
import { measureProfileRegistration } from './registration'
import { makeSheetText, type SheetTextLayer } from './sheetText'
import { makeBreakthroughGeometry } from './breakthroughGeometry'
import { makeBarrierMask, makeFragmentPrint, makeCrackMask } from './breakthrough'

export type SheetBakeTier = 'full' | 'lite'
export interface SheetBakeInput {
  gl: WebGLRenderer
  /** Borrowed immutable snapshot: this bake never disposes it. */
  data: DrawingGeometry
  layout: DrawingLayout
  tier: SheetBakeTier
  cacheUrl?: string
  signal?: AbortSignal
  onCleanupFailure(errors: readonly unknown[]): void
}

export interface SheetBakeResult {
  layout: DrawingLayout
  extraction: Extraction
  rendered: RenderedDrawing
  uniforms: SheetUniforms
  lines: Mesh
  fills: Mesh
  text: SheetTextLayer
  flex: PaperFlexField
  fracture: ReturnType<typeof makeBreakthroughGeometry>
  barrierMask: ReturnType<typeof makeBarrierMask>
  fragmentPrint: ReturnType<typeof makeFragmentPrint>
  crackMask: ReturnType<typeof makeCrackMask>
  stats: Record<string, number>
  pulseRegistration(): ReturnType<typeof measureProfileRegistration>
  dispose(): void
}

/** CAD bake with explicit inputs and ownership; the host owns installation and failure policy. */
export async function bakeSheet(input: SheetBakeInput): Promise<SheetBakeResult> {
  const { gl, data, layout, tier, signal, onCleanupFailure } = input
  const started = performance.now()
  const cleanups: Array<() => void> = []
  const failures: unknown[] = []
  const collect = (errors: readonly unknown[]) => { for (const error of errors) failures.push(error) }
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const cleanup of cleanups) {
      try { cleanup() } catch (error) { failures.push(error) }
    }
    cleanups.length = 0
    try { onCleanupFailure(Object.freeze(failures.slice())) } catch { /* Keep the primary error. */ }
  }
  const checkpoint = () => {
    if (signal?.aborted) throw new DOMException('Sheet bake cancelled', 'AbortError')
  }
  const ownMesh = (mesh: Mesh) => {
    cleanups.push(() => mesh.geometry.dispose())
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      cleanups.push(() => material.dispose())
    }
  }
  try {
    checkpoint()
    const precomputed = await prepareDrawingCache(data, layout, input.cacheUrl, signal)
    checkpoint()
    const cacheMs = performance.now() - started
    const extractStart = performance.now()
    checkpoint()
    const extraction = solveExtraction(data, layout)
    const extractMs = performance.now() - extractStart
    checkpoint()
    const composed = composeSheet(gl, data, layout, collect)
    checkpoint()
    const rendered = bakeProfile(gl, data, layout, collect)
    cleanups.push(() => rendered.dispose(collect))
    checkpoint()
    const fracture = makeBreakthroughGeometry(rendered.profilePoints, SHEET_WIDTH, SHEET_HEIGHT, collect)
    cleanups.push(() => fracture.dispose(collect))
    checkpoint()
    const barrierMask = makeBarrierMask(fracture.outline, SHEET_WIDTH, SHEET_HEIGHT, collect)
    cleanups.push(() => barrierMask.dispose())
    checkpoint()
    const fragmentPrint = makeFragmentPrint(composed.ink.segs, composed.ink.fills, SHEET_WIDTH, SHEET_HEIGHT, collect)
    cleanups.push(() => fragmentPrint.dispose())
    checkpoint()
    const crackMask = makeCrackMask(rendered.profilePoints, fracture.cracks, SHEET_WIDTH, SHEET_HEIGHT, collect)
    cleanups.push(() => crackMask.dispose())
    checkpoint()
    const uniforms = makeSheetUniforms()
    uniforms.uBarrierMask.value = barrierMask
    checkpoint()
    uniforms.uPortalSheetSize = { value: new Vector2(SHEET_WIDTH, SHEET_HEIGHT) }
    uniforms.uPortalLight = { value: 0 }
    checkpoint()
    const flex = makePaperFlexField(rendered.profilePoints, SHEET_WIDTH, SHEET_HEIGHT, 256, 160, collect)
    // Separate attempts: a throwing texture listener must not leave a published stale field.
    cleanups.push(() => flex.texture.dispose(), () => { clearPaperFlexField(flex) })
    checkpoint()
    bindExtractionPressure(extraction, layout, flex, tier)
    uniforms.uFlexField.value = flex.texture
    uniforms.uFlexRect.value = flex.rect
    uniforms.uOrigin.value.set(extraction.contact.x, extraction.contact.y)
    checkpoint()
    const lines = makeInkLines(composed.ink, uniforms, collect)
    ownMesh(lines)
    checkpoint()
    const fills = makeInkFills(composed.ink, uniforms, collect)
    ownMesh(fills)
    checkpoint()
    const text = makeSheetText(composed.ink.texts, uniforms, collect)
    cleanups.push(() => text.dispose(collect))
    checkpoint()
    const stats = { ...composed.stats, cacheMs, precomputed: precomputed ? 1 : 0, extractMs,
      bakeMs: performance.now() - started, flexFieldPeak: flex.peak, flexAmplitude: 0,
      flexPeakDisplacement: 0, flexEnabled: 0, flexNormalX: 0, flexNormalY: 0, flexNormalZ: 1,
      contactShadow: 0, contactRadius: 0, vellum: 0 }
    // The independent ink comparison stays lazy, exactly as in the legacy bake.
    let registration: ReturnType<typeof measureProfileRegistration> | undefined
    const pulseRegistration = () => registration ??= measureProfileRegistration(rendered.profilePoints, composed.ink.segs, GROUP.side)
    checkpoint()
    return { layout, extraction, rendered, uniforms, lines, fills, text, flex,
      fracture, barrierMask, fragmentPrint, crackMask, stats, pulseRegistration, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
