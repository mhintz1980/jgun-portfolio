// Pure maths for the ghost vault and the loupe (W2). No DOM access here; Vault.tsx writes styles.
import type { DrawingLayer, ProjectId } from './content'

/** Resting opacity of a ghost layer. The design rule caps it at 0.18. */
export const REST_OPACITY = 0.12
export const MAX_REST_OPACITY = 0.18
/** Opacity of the hovered project's layers, and of the others while one is focused. */
export const FOCUS_OPACITY = 0.3
export const DIM_OPACITY = 0.04
export const FOCUS_SCALE = 1.06
/** Fraction of the way a focused layer eases toward the viewport centre. */
export const FOCUS_PULL = 0.2
export const LOUPE_RADIUS = 100
export const LOUPE_RADIUS_PHONE = 80
export const PHONE_QUERY = '(max-width: 720px)'
export const COARSE_QUERY = '(hover: none), (pointer: coarse)'
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

export interface VaultMode {
  phone: boolean
  reduced: boolean
}

export interface Viewport {
  width: number
  height: number
}

export interface Transform {
  x: number
  y: number
  scale: number
}

/** Desktop shows every layer; phones and reduced motion show only the primary one per project. */
export function visibleLayers(layers: readonly DrawingLayer[], mode: VaultMode): DrawingLayer[] {
  return layers.filter((layer) => layer.primary || (!mode.phone && !mode.reduced))
}

/** Box of a layer at scroll 0, in px: width from w/wPhone, height from the mask aspect ratio. */
export function layerBox(layer: DrawingLayer, viewport: Viewport, phone: boolean) {
  const width = (phone ? layer.wPhone : layer.w) * viewport.width
  const height = width * (layer.height / layer.width)
  return {
    width,
    height,
    left: layer.cx * viewport.width - width / 2,
    top: layer.cy * viewport.height - height / 2,
  }
}

/** Scroll drift: dx/dy px and ds scale per 1000 px of scroll. Reduced motion stays put. */
export function scrollTransform(layer: DrawingLayer, scrollY: number, reduced = false): Transform {
  if (reduced) return { x: 0, y: 0, scale: 1 }
  const k = scrollY / 1000
  return { x: layer.dx * k + 0, y: layer.dy * k + 0, scale: Math.max(0.5, 1 + layer.ds * k) }
}

export type FocusRole = 'rest' | 'focused' | 'dimmed'

export function focusRole(layer: DrawingLayer, focus: ProjectId | null): FocusRole {
  if (focus === null) return 'rest'
  return layer.project === focus ? 'focused' : 'dimmed'
}

export function ghostOpacity(role: FocusRole): number {
  return role === 'focused' ? FOCUS_OPACITY : role === 'dimmed' ? DIM_OPACITY : REST_OPACITY
}

/** Focus offset applied on top of the scroll drift: eases toward the centre and scales up. */
export function focusTransform(layer: DrawingLayer, role: FocusRole, viewport: Viewport, reduced = false): Transform {
  if (role !== 'focused' || reduced) return { x: 0, y: 0, scale: 1 }
  return {
    x: (0.5 - layer.cx) * viewport.width * FOCUS_PULL,
    y: (0.5 - layer.cy) * viewport.height * FOCUS_PULL,
    scale: FOCUS_SCALE,
  }
}

export function transformCss(t: Transform): string {
  return `translate3d(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px, 0) scale(${t.scale.toFixed(4)})`
}

/**
 * Touch loupe: a slow Lissajous sweep over the viewport, driven only by scroll position.
 * Stays inside the middle 70% x 60% of the viewport; at scroll 0 it sits over the upper drawing.
 */
export function sweepPosition(scrollY: number, viewport: Viewport): { x: number; y: number } {
  const t = scrollY / 1000
  return {
    x: viewport.width * (0.5 + 0.35 * Math.sin(t * 1.3 + 0.29)),
    y: viewport.height * (0.5 + 0.3 * Math.sin(t * 0.9 - 0.64)),
  }
}
