import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color } from 'three'
import {
  BACKDROP_CHAPTER_FLAGS,
  BACKDROP_PALETTES,
  CHAPTER_BLEND_12,
  CHAPTER_BLEND_23,
  CHAPTER_BLEND_34,
  SCRUBBED_BACKGROUNDS,
} from './backdropConfig'
import { BackdropGradientLayer } from './layers/BackdropGradientLayer'
import { BackdropGridLayer } from './layers/BackdropGridLayer'
import type { BackdropLayerHandle } from './layers/types'
import { getScrollState, telemetry } from '../../state/scrollStore'
import { useQuality } from '../../state/qualityStore'

/**
 * JG-023 — mounts the two camera-locked backdrop layers and drives them from
 * ONE useFrame: piecewise smoothstep palette lerp across the three chapter
 * blend windows (into module-scope scratch Colors, mutated in place),
 * chapter-flag visibility envelope, telemetry write, camera lock.
 *
 * Render authority is getScrollState().progress — NEVER the ScrollTrigger
 * `chapter` flag (laggy channel; ScrollRig precedent, AND-gate 287bf05) and
 * never the hero timeline proxy. Zero allocation per frame
 * (r3f-scroll-performance-guard): no `new`, no literals, no closures inside
 * the callback; sRGB→linear palette conversion happens once at module init.
 *
 * SCRUBBED_BACKGROUNDS=false ⇒ the component returns null (module no-op): the
 * layers never mount, the frame callback exits on the null handles, and no
 * per-frame flag check is needed. Layers start invisible and any alpha
 * ≤ 0.001 keeps them culled, so unflagged chapters (weight 0) draw nothing.
 * Reduced motion needs no special case: progress is static in that tier, so
 * the backdrop is static (JG-022 precedent).
 */

// sRGB→linear conversion happens ONCE at module init (ColorManagement converts
// on construction) — never per frame, never re-converted.
const PALETTE_TOP: Color[] = BACKDROP_PALETTES.map((p) => new Color(p.top))
const PALETTE_BOTTOM: Color[] = BACKDROP_PALETTES.map((p) => new Color(p.bottom))
const PALETTE_ACCENT: Color[] = BACKDROP_PALETTES.map((p) => new Color(p.accent))
const PALETTE_ACCENT_ALPHA: number[] = BACKDROP_PALETTES.map((p) => p.accentAlpha)

// Per-frame scratch at module scope (r3f-scroll-performance-guard): the frame
// loop mutates these in place — never reallocated.
const SCRATCH_TOP = new Color()
const SCRATCH_BOTTOM = new Color()
const SCRATCH_ACCENT = new Color()

// Same shape as StudioRig's smoothstep01 (SceneCanvas.tsx).
function smoothstep01(x: number): number {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

/** Lerps palette pair [a, b] by t into the scratch Colors in place. The accent
 * arrives PRE-SCALED by the lerped accentAlpha — L3 contract: the layers copy
 * uAccent verbatim, so the alpha factor must be baked in upstream. */
function lerpPaletteInto(a: number, b: number, t: number): void {
  SCRATCH_TOP.lerpColors(PALETTE_TOP[a], PALETTE_TOP[b], t)
  SCRATCH_BOTTOM.lerpColors(PALETTE_BOTTOM[a], PALETTE_BOTTOM[b], t)
  SCRATCH_ACCENT.lerpColors(PALETTE_ACCENT[a], PALETTE_ACCENT[b], t)
  SCRATCH_ACCENT.multiplyScalar(
    PALETTE_ACCENT_ALPHA[a] + (PALETTE_ACCENT_ALPHA[b] - PALETTE_ACCENT_ALPHA[a]) * t,
  )
}

export function BackdropRig() {
  const gradientRef = useRef<BackdropLayerHandle>(null)
  const gridRef = useRef<BackdropLayerHandle>(null)
  const camera = useThree((state) => state.camera)
  const { tier } = useQuality()

  useFrame(() => {
    const gradient = gradientRef.current
    const grid = gridRef.current
    // Flag-off no-op (layers unmounted) and first-frame guard.
    if (!gradient || !grid) return
    const { progress } = getScrollState()
    // The layer-side clamp (Math.min/max) propagates NaN, so guard once here —
    // telemetry and uniforms must never be poisoned.
    if (!Number.isFinite(progress)) return

    // Blend-window t's: chapter 1→2 gap, then the two stage cross-fades.
    const t12 = smoothstep01(
      (progress - CHAPTER_BLEND_12[0]) / (CHAPTER_BLEND_12[1] - CHAPTER_BLEND_12[0]),
    )
    const t23 = smoothstep01(
      (progress - CHAPTER_BLEND_23[0]) / (CHAPTER_BLEND_23[1] - CHAPTER_BLEND_23[0]),
    )
    const t34 = smoothstep01(
      (progress - CHAPTER_BLEND_34[0]) / (CHAPTER_BLEND_34[1] - CHAPTER_BLEND_34[0]),
    )

    // Piecewise palette: the windows are disjoint, so at most one t is open;
    // each branch is continuous with its neighbors at the clamped boundaries.
    if (t23 >= 1) lerpPaletteInto(2, 3, t34)
    else if (t12 >= 1) lerpPaletteInto(1, 2, t23)
    else lerpPaletteInto(0, 1, t12)

    // Visibility envelope: chapter weights partition unity across the same
    // windows; unflagged chapters contribute 0 weight (alpha ≤ 0.001 ⇒ the
    // handles set visible = false).
    const w0 = 1 - t12
    const w1 = t12 * (1 - t23)
    const w2 = t23 * (1 - t34)
    const w3 = t34
    const backdropAlpha =
      (BACKDROP_CHAPTER_FLAGS[0] ? w0 : 0) +
      (BACKDROP_CHAPTER_FLAGS[1] ? w1 : 0) +
      (BACKDROP_CHAPTER_FLAGS[2] ? w2 : 0) +
      (BACKDROP_CHAPTER_FLAGS[3] ? w3 : 0)

    telemetry.stage.backdropAlpha = backdropAlpha

    gradient.setAlpha(backdropAlpha)
    gradient.setPalette(SCRATCH_TOP, SCRATCH_BOTTOM, SCRATCH_ACCENT)
    // Grid is the lite-tier casualty (gradient-only rule). Same lerped palette
    // to both handles — the grid consumes the accent only.
    grid.setAlpha(tier === 'lite' ? 0 : backdropAlpha)
    grid.setPalette(SCRATCH_TOP, SCRATCH_BOTTOM, SCRATCH_ACCENT)

    // Camera-locked fiction: both planes ride this frame's camera pose
    // (CameraRig subscribed earlier — mount order = priority-0 order).
    gradient.syncToCamera(camera)
    grid.syncToCamera(camera)
  })

  if (!SCRUBBED_BACKGROUNDS) return null
  return (
    <>
      <BackdropGradientLayer ref={gradientRef} />
      <BackdropGridLayer ref={gridRef} />
    </>
  )
}
