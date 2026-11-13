// Arc carousel geometry (pure). Adapted from "Curved Arc Image Carousel" by Kedhareswer Naidu
// (21st.dev/@kedhareswer/components/arc-card-carousel, listed as MIT):
// cards ride the rim of a large wheel whose hub sits off the left edge of the stage, so a gentle
// arc of them shows and the card on the equator lies flat. The wheel does not loop here, so the
// page scroll above and below the pinned section stays continuous.

/** Degrees between neighbouring cards on the wheel. */
export const ARC_STEP = 14
/** Cards past this angle from the equator are well outside the stage and are not painted. */
export const MAX_ARC_ANGLE = 80
/** Pinned scroll length per card step, in stage heights. */
export const SCROLL_PER_CARD = 0.6

export interface ArcGeometry {
  cardW: number
  cardH: number
  radius: number
  hubX: number
  hubY: number
}

export interface ArcPlacement {
  x: number
  y: number
  rot: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function arcGeometry(width: number, height: number): ArcGeometry {
  const u = Math.min(height, width / 0.47)
  const cardW = 0.3 * u
  const radius = 0.71 * u
  return { cardW, cardH: cardW / 1.65, radius, hubX: 0.284 * u - radius, hubY: 0.475 * height }
}

/** Centre of a card whose position on the wheel is "offset" steps from the equator. */
export function arcPlace(offset: number, step: number, g: ArcGeometry): ArcPlacement {
  const rot = -offset * step
  const rad = (rot * Math.PI) / 180
  return { x: g.hubX + g.radius * Math.cos(rad), y: g.hubY + g.radius * Math.sin(rad), rot }
}

/** Cards far round the wheel, or centred well off the stage, are not painted (and cannot take focus). */
export function arcVisible(p: ArcPlacement, g: ArcGeometry, stageHeight: number): boolean {
  return Math.abs(p.rot) <= MAX_ARC_ANGLE && p.y > -g.cardH && p.y < stageHeight + g.cardH
}

/** Cards on the ring: enough copies of the items that the visible arc is always full. */
export function ringSize(total: number): number {
  return total > 0 ? Math.ceil(10 / total) * total : 0
}

/** Signed distance, in cards, from the equator to ring slot "slot" at wheel position "position". */
export function ringOffset(slot: number, position: number, ring: number): number {
  if (ring <= 0) return 0
  const a = (((slot - position) % ring) + ring) % ring
  return a >= ring / 2 ? a - ring : a
}

/** Wheel position (in cards) for pinned-section progress 0..1. */
export function positionForProgress(progress: number, total: number): number {
  return clamp(progress, 0, 1) * Math.max(total - 1, 0)
}

export function indexAt(position: number, total: number): number {
  return clamp(Math.round(position), 0, Math.max(total - 1, 0))
}

/** Page scroll offset that brings card "index" to the equator. */
export function scrollTopForIndex(index: number, total: number, start: number, travel: number): number {
  if (total < 2) return start
  return start + (clamp(index, 0, total - 1) / (total - 1)) * travel
}

/** Exponential approach to the target; lands exactly on it once close. */
export function smoothToward(value: number, target: number, dtMs: number, tauMs = 110): number {
  const next = value + (target - value) * (1 - Math.exp(-dtMs / tauMs))
  return Math.abs(target - next) < 1e-3 ? target : next
}

/** Pinned track height, in stage heights. */
export function trackStages(total: number): number {
  return 1 + Math.max(total - 1, 0) * SCROLL_PER_CARD
}
