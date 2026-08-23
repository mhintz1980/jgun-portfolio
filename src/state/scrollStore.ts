import { useSyncExternalStore } from 'react'
import type { MaterialMode } from '../types/portfolio'

/**
 * Minimal external store bridging the DOM scroll world (Lenis + ScrollTrigger)
 * and the R3F frame loop. Canvas-side consumers read via getScrollState() in
 * useFrame (no React re-renders); DOM-side consumers subscribe to individual
 * keys via useScrollValue and only re-render when that key actually changes.
 */
export interface ScrollState {
  /** Global page scroll progress, 0..1. */
  progress: number
  /** Active chapter index, 0..3. */
  chapter: number
  /** Progress through the active chapter, 0..1. */
  chapterProgress: number
  /** Smoothed scroll velocity (arbitrary units, for HUD flavor). */
  velocity: number
  materialMode: MaterialMode
  /** Currently selected hotspot id, or null. */
  hotspotId: string | null
}

const state: ScrollState = {
  progress: 0,
  chapter: 0,
  chapterProgress: 0,
  velocity: 0,
  materialMode: initialMaterialMode(),
  hotspotId: null,
}

/**
 * Deep-linkable initial material mode via ?view=<mode> — e.g.
 * /?view=exploded opens straight into the fully exploded assembly. Only the
 * three real switcher modes are accepted; anything else falls back to solid.
 * Read once at store creation; the HUD switcher remains the live control.
 */
function initialMaterialMode(): MaterialMode {
  if (typeof window === 'undefined') return 'solid'
  const view = new URLSearchParams(window.location.search).get('view')
  if (view === 'solid' || view === 'blueprint' || view === 'exploded') return view
  return 'solid'
}

const listeners = new Set<() => void>()

export function getScrollState(): ScrollState {
  return state
}

export function setScrollState(patch: Partial<ScrollState>): void {
  let changed = false
  for (const key of Object.keys(patch) as (keyof ScrollState)[]) {
    const next = patch[key]
    if (next !== undefined && state[key] !== next) {
      ;(state as unknown as Record<string, unknown>)[key] = next
      changed = true
    }
  }
  if (changed) for (const listener of listeners) listener()
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function useScrollValue<K extends keyof ScrollState>(key: K): ScrollState[K] {
  // Third arg lets HUD/hotspot markup server-render for the a11y smoke checks.
  return useSyncExternalStore(
    subscribe,
    () => state[key],
    () => state[key],
  )
}

/**
 * Per-frame camera telemetry for the HUD datum readout. Mutated directly from
 * the frame loop and read by a rAF loop in TechnicalHUD — deliberately outside
 * React state so 60 fps updates never trigger reconciliation.
 */
export const telemetry = { x: 0, y: 0, z: 0, fov: 42 }
