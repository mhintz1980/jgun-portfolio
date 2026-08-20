import { useSyncExternalStore } from 'react'

/**
 * Graceful-degradation tier ladder. One-way ratchet — we never upgrade a tier
 * at runtime (only DPR steps back up), so a struggling device can't thrash
 * between canvas and poster.
 *
 *   full   — every effect on: scroll camera, explosion, CAD dissolve shader.
 *   lite   — DPR already floored at 1 and still under 45 FPS: the Module 3
 *            dissolve shader is replaced by a plain opacity crossfade.
 *   poster — no WebGL2, context lost, or still under 45 FPS in lite: the
 *            canvas is unmounted entirely and a static DOM poster renders
 *            behind the (always-DOM) case-study content.
 *
 * prefers-reduced-motion is orthogonal to the tier: the canvas may still
 * render (static hero pose) but every scroll/pointer-driven animation and the
 * dissolve shader are skipped, and Lenis/ScrollTrigger never mount.
 */
export type QualityTier = 'full' | 'lite' | 'poster'

export interface QualityState {
  tier: QualityTier
  reducedMotion: boolean
}

function detectWebGL2(): boolean {
  if (typeof window === 'undefined' || !window.WebGL2RenderingContext) return false
  try {
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl2')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

const reducedMotionQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

const state: QualityState = {
  tier: detectWebGL2() ? 'full' : 'poster',
  reducedMotion: reducedMotionQuery?.matches ?? false,
}

const listeners = new Set<() => void>()
// useSyncExternalStore compares snapshots by reference — swap the object on change.
let snapshot: QualityState = { ...state }

function emit(): void {
  snapshot = { ...state }
  for (const listener of listeners) listener()
}

reducedMotionQuery?.addEventListener('change', (event) => {
  state.reducedMotion = event.matches
  emit()
})

export function getQuality(): QualityState {
  return state
}

/** Step down one tier: full → lite → poster. No-op at poster. */
export function degradeQuality(): void {
  if (state.tier === 'full') state.tier = 'lite'
  else if (state.tier === 'lite') state.tier = 'poster'
  else return
  emit()
}

/** Hard drop to the static poster (WebGL context loss). */
export function forcePoster(): void {
  if (state.tier === 'poster') return
  state.tier = 'poster'
  emit()
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function useQuality(): QualityState {
  // Third arg lets the tree server-render (poster tier) for smoke tests.
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  )
}
