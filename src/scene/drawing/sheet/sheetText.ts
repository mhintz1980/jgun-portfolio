import { Color, LinearSRGBColorSpace, MeshBasicMaterial } from 'three'
import { BatchedText, Text } from 'troika-three-text'
import { INK } from '../drawingGeometry'
import type { InkText } from './ink'

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
} as const

/**
 * BatchedText packs each member's colour straight into a data texture and the shader treats
 * it as linear, so the ink hex has to be handed over already linearised or the lettering
 * prints a washed-out pale blue next to the navy linework.
 */
const INK_LINEAR = new Color(INK).getHex(LinearSRGBColorSpace)

export interface SheetTextLayer {
  object: BatchedText
  ready: Promise<void>
  update: (reveal: number[], opacity: number) => void
  dispose: () => void
}

export function makeSheetText(items: InkText[]): SheetTextLayer {
  const batch = new BatchedText()
  batch.material = new MeshBasicMaterial({ color: INK, transparent: true, depthWrite: false, toneMapped: false })
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
    text.anchorY = item.anchorY ?? 'middle'
    text.letterSpacing = item.letterSpacing ?? 0.02
    text.lineHeight = item.lineHeight ?? 1.15
    text.textAlign = item.anchorX === 'center' ? 'center' : item.anchorX === 'right' ? 'right' : 'left'
    text.color = INK_LINEAR
    text.sdfGlyphSize = 64
    text.position.set(item.x, item.y, 0)
    text.rotation.z = item.rotation ?? 0
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
    dispose: () => {
      for (const m of members) m.text.dispose()
      batch.dispose()
    },
  }
}
