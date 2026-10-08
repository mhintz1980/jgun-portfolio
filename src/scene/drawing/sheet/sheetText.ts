import { Color, LinearSRGBColorSpace, MeshBasicMaterial, Vector3 } from 'three'
import { BatchedText, Text } from 'troika-three-text'
import { INK } from '../drawingGeometry'
import { GROUP, INK_GRAPHITE, INK_RED, type InkText, type SheetUniforms, type TextCell } from './ink'
import { PAPER_FLEX_GLSL } from './paperFlex'
import { PAPER_BARRIER_GLSL } from './breakthrough'
import { REFERENCE_GLYPHS } from './referenceHandGlyphs'
import type { ReferenceGlyph } from './handwriting'

/**
 * Sheet lettering as SDF text in ONE draw call (troika BatchedText). Glyphs stay razor sharp at
 * any camera distance, which the old rasterised SVG annotation layer never could.
 *
 * Reveal: each item types itself in left-to-right by animating its clipRect with the same
 * (group, key, dur) contract the ink lines use — clipRect is not a layout property, so this
 * costs no re-layout per frame.
 */

export const SHEET_FONTS = {
  medium: '/fonts/BarlowCondensed-Medium.ttf',
  semibold: '/fonts/BarlowCondensed-SemiBold.ttf',
  handwriting: '/fonts/AcFastReference.ttf',
} as const

/**
 * BatchedText packs each member's colour straight into a data texture and the shader treats
 * it as linear, so the ink hex has to be handed over already linearised or the lettering
 * prints a washed-out pale blue next to the navy linework.
 */
const COLORS_LINEAR = {
  ink: new Color(INK).getHex(LinearSRGBColorSpace),
  graphite: new Color(INK_GRAPHITE).getHex(LinearSRGBColorSpace),
  red: new Color(INK_RED).getHex(LinearSRGBColorSpace),
}

export interface SheetTextLayer {
  object: BatchedText
  ready: Promise<void>
  update: (reveal: number[], opacity: number) => void
  captureBounds: (group?: number) => SheetTextBounds
  /** Generated source only: this is not evidence of a successful GPU link/draw. */
  captureShaderEvidence: () => {
    generated: boolean
    vertexShader: string | null
    generatedFragment: boolean
    fragmentShader: string | null
  }
  dispose: () => void
}

export interface SheetTextBoundsItem {
  text: string
  group: number
  /** Unclipped AABB in sheet metres: visible ink for handwriting, layout block for print. */
  bounds: [number, number, number, number] | null
  fitCell: TextCell | null
  /** null when layout is unavailable or no fit target was authored. */
  contained: boolean | null
}

export interface SheetTextBounds {
  ready: boolean
  count: number
  /** Fail-closed: unavailable/invalid bounds, overflow, or a missing title fit target. */
  violations: number
  items: SheetTextBoundsItem[]
}

export function makeSheetText(items: InkText[], uniforms?: SheetUniforms): SheetTextLayer {
  const batch = new BatchedText()
  const material = new MeshBasicMaterial({ color: INK, transparent: true, depthWrite: false, toneMapped: false })
  if (uniforms) {
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      // `transformed` is already in batch/sheet space here: Troika has applied the
      // per-member position/rotation matrix. Deforming glyph-local XY misregisters text.
      shader.vertexShader = 'varying vec2 vStockPlane;\n' + PAPER_FLEX_GLSL + shader.vertexShader.replace(
        '#include <project_vertex>',
        'vStockPlane = transformed.xy;\ntransformed.z += paperDisplacement(transformed.xy);\n#include <project_vertex>',
      )
      // Glyphs are printed ink, lit by the same failed practical and room bounce
      // as the vector linework. Opacity alone would leave bright navy lettering
      // floating over the dark stock.
      shader.fragmentShader = PAPER_BARRIER_GLSL + 'varying vec2 vStockPlane;\nuniform float uLampPower;\n' + shader.fragmentShader.replace('void main() {', 'void main() {\ncutPrintedStock(vStockPlane);').replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb *= 0.14 + 0.86 * uLampPower;',
      )
    }
    material.customProgramCacheKey = () => 'sheet-paper-flex-ambient-ink-v2'
  }
  batch.material = material
  let vertexShader: string | null = null
  let fragmentShader: string | null = null
  // Troika's derived material setter runs this callback AFTER its nested shader
  // rewrites. Keep the final sources available for the parent's runtime proof.
  batch.material.onBeforeCompile = (shader) => {
    vertexShader = shader.vertexShader
    fragmentShader = shader.fragmentShader
  }
  batch.renderOrder = 3
  batch.position.z = 0.00034
  batch.frustumCulled = false
  const members: { text: Text; item: InkText; clip: number[] }[] = []
  const syncs: Promise<void>[] = []
  for (const item of items) {
    const text = new Text()
    text.text = item.text
    text.font = SHEET_FONTS[item.weight ?? 'medium']
    text.fontSize = item.size / 0.7
    text.anchorX = item.anchorX ?? 'left'
    text.anchorY = item.weight === 'handwriting' || item.anchorY === 'baseline' ? 'top-baseline' : item.anchorY ?? 'middle'
    text.letterSpacing = item.letterSpacing ?? 0.02
    text.lineHeight = item.lineHeight ?? 1.15
    text.textAlign = item.anchorX === 'center' ? 'center' : item.anchorX === 'right' ? 'right' : 'left'
    text.color = COLORS_LINEAR[item.color ?? (item.weight === 'handwriting' ? 'graphite' : 'ink')]
    text.sdfGlyphSize = 64
    // Troika's public property is absent from this repo's minimal declaration.
    ;(text as Text & { glyphGeometryDetail: number }).glyphGeometryDetail = 4
    text.position.set(item.x, item.y, 0)
    text.rotation.z = item.rotation ?? 0
    text.scale.x = item.scaleX ?? 1
    if (item.weight === 'handwriting') {
      // Match the normalized reference contours to the actual TTF black bounds,
      // rather than its nominal cap700/LSB50 metrics. Offset BEFORE member rotation.
      const glyph: ReferenceGlyph | undefined = REFERENCE_GLYPHS[item.text]
      const { fontMinX, fontMinY, fontHeight } = glyph ?? {}
      if (typeof fontMinX !== 'number' || !Number.isFinite(fontMinX)
        || typeof fontMinY !== 'number' || !Number.isFinite(fontMinY)
        || typeof fontHeight !== 'number' || !Number.isFinite(fontHeight) || fontHeight <= 0) {
        throw new Error(`Missing reference font metrics for ${JSON.stringify(item.text)}`)
      }
      text.fontSize = item.size * 1000 / fontHeight
      const unit = text.fontSize / 1000
      const offsetX = fontMinX * unit * text.scale.x
      const offsetY = fontMinY * unit
      const c = Math.cos(text.rotation.z), s = Math.sin(text.rotation.z)
      text.position.x -= offsetX * c - offsetY * s
      text.position.y -= offsetX * s + offsetY * c
    }
    text.fillOpacity = 0
    const clip = [0, 0, 0, 0]
    text.clipRect = clip
    members.push({ text, item, clip })
    batch.add(text)
    // troika drops a sync() callback outright when the member's _needsSync flag was already
    // consumed (e.g. by BatchedText's own render-time sync) — observed as a cold load whose
    // annotationsReady never fired. 'synccomplete' is dispatched by every completed sync,
    // whoever started it, so resolve on either.
    syncs.push(
      new Promise((resolve) => {
        const done = () => {
          text.removeEventListener('synccomplete', done)
          resolve()
        }
        text.addEventListener('synccomplete', done)
        text.sync(done)
      }),
    )
  }
  const ready = Promise.all(syncs).then(() => undefined)
  const captureBounds = (group?: number): SheetTextBounds => {
    const captured = members.filter(m => group === undefined || m.item.group === group).map(({ text, item }): SheetTextBoundsItem => {
      const info = text.textRenderInfo as (typeof text.textRenderInfo & { visibleBounds?: number[] })
      const block = item.weight === 'handwriting' ? info?.visibleBounds : info?.blockBounds
      const fitCell = item.fitCell ? { ...item.fitCell } : null
      const result: SheetTextBoundsItem = { text: item.text, group: item.group, bounds: null, fitCell, contained: null }
      if (!block || block.length !== 4 || !block.every(Number.isFinite)) return result
      // Use the live member transform used by BatchedText, not the authored x/y
      // or clipped/revealed glyph bounds. Rotation needs all four block corners.
      text.updateMatrix()
      const corners = [[block[0], block[1]], [block[2], block[1]], [block[2], block[3]], [block[0], block[3]]]
        .map(([x, y]) => new Vector3(x, y, 0).applyMatrix4(text.matrix))
      const bounds: [number, number, number, number] = [
        Math.min(...corners.map(p => p.x)), Math.min(...corners.map(p => p.y)),
        Math.max(...corners.map(p => p.x)), Math.max(...corners.map(p => p.y)),
      ]
      if (!bounds.every(Number.isFinite)) return result
      result.bounds = bounds
      if (fitCell) {
        // Micrometre tolerance absorbs float roundoff, not a visible layout overflow.
        const epsilon = 1e-6
        result.contained = bounds[0] >= fitCell.x - epsilon && bounds[1] >= fitCell.y - epsilon
          && bounds[2] <= fitCell.x + fitCell.w + epsilon && bounds[3] <= fitCell.y + fitCell.h + epsilon
      }
      return result
    })
    return {
      ready: captured.every(item => item.bounds !== null),
      count: captured.length,
      violations: captured.filter(item => !item.bounds || item.contained === false || (item.group === GROUP.titleBlock && !item.fitCell)).length,
      items: captured,
    }
  }
  const update = (reveal: number[], opacity: number) => {
    for (const m of members) {
      const r = reveal[m.item.group] ?? 1
      const local = Math.min(1, Math.max(0, (r - m.item.key) / Math.max(1e-4, m.item.dur ?? 0.06)))
      const bounds = m.text.textRenderInfo?.blockBounds
      if (!bounds) {
        m.text.fillOpacity = 0
        continue
      }
      m.clip[0] = bounds[0] - 1
      m.clip[1] = bounds[1] - 1
      m.clip[2] = bounds[0] + (bounds[2] - bounds[0]) * local
      m.clip[3] = bounds[3] + 1
      m.text.clipRect = m.clip
      m.text.fillOpacity = local > 0 ? (m.item.opacity ?? 1) * opacity : 0
    }
  }
  return {
    object: batch,
    ready,
    update,
    captureBounds,
    captureShaderEvidence: () => ({
      generated: vertexShader !== null,
      vertexShader,
      generatedFragment: fragmentShader !== null,
      fragmentShader,
    }),
    dispose: () => {
      for (const m of members) m.text.dispose()
      batch.dispose()
      material.dispose()
    },
  }
}
