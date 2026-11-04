/** Doc39 §8: part identities and verified design facts; no authored world coordinates.
 * RuntimeWorld owns projection/occlusion and camera focus. DOM owns presentation.
 *
 * Doc45 Issue 5: each callout owns its own scroll window so at most one leader is ever on
 * screen during the narrative, and no callout appears during a special sequence (ring-switch
 * knurling, input-shaft study). The leader layout below still guarantees non-crossing
 * leaders if two cards ever share the screen (for example during a focus transition).
 */

/** One Y14.5 feature-control-frame cell. Only verified design facts are framed. */
export type TorqueFcfCell =
  | { readonly kind: 'symbol'; readonly symbol: 'DIAMETER' | 'TOTAL_RUNOUT' }
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'datum'; readonly text: string }

export const TORQUE_HOTSPOTS = [
  {
    id: 'clutch-housing', title: 'Clutch Housing', part: 'P000420 → P000245',
    summary: '⌀2.525 H7/k6 · Finished after heat treat',
    detail: 'The housing OD and ID are both finished after heat treat, keeping heat-treatment distortion out of the mating fit.',
    // Second half of mechanism-switch (verifier checkpoint .545).
    window: [0.532, 0.558],
    fcf: [{ kind: 'symbol', symbol: 'DIAMETER' }, { kind: 'text', text: '2.525' }, { kind: 'text', text: 'H7/k6' }],
    fcfLabel: 'Diameter 2.525, H7/k6 fit',
  },
  {
    id: 'ring-switch', title: 'Ring Switch', part: 'P003068',
    summary: 'OD diamond knurl · Detent grooves',
    detail: 'The knurled outer diameter gives the operator a grip to twist and shift between Rundown and High Torque. Detent grooves locate the selector; the OSHA Blue and OSHA Red stripes identify the modes.',
    // First half of mechanism-switch (verifier checkpoint .520).
    window: [0.506, 0.530],
    fcf: null,
    fcfLabel: '',
  },
  {
    id: 'lcd-manometer', title: 'LCD Manometer', part: 'P002115 / BK11356',
    summary: 'Digital pressure / torque readout',
    detail: 'The rear-handle display brings the pressure and torque readout to the operator. Inspect the LCD cluster in its handle mounting.',
    // Post-collapse: the close camera orbits to the rear three-quarter facing the LCD by .986
    // (verifier gate 'LCD readout after collapse .99').
    window: [0.986, 0.995],
    fcf: null,
    fcfLabel: '',
  },
  {
    id: 'stage2-planet', title: 'Second-Stage Planet Gear', part: 'P000247 · A000592',
    summary: 'Total runout < .001″ TIR · ISO 1328 Grade A6',
    detail: 'The second-stage P000247 planet belongs to A000592, with carrier cage P001837. All gears were cut in house. Total runout below .001 inch and ISO 1328 Grade A6 define the precision requirement.',
    // Exploded drivetrain (verifier checkpoints .905/.925); also needs explode > .65.
    window: [0.875, 0.938],
    fcf: [{ kind: 'symbol', symbol: 'TOTAL_RUNOUT' }, { kind: 'text', text: '< .001″ TIR' }],
    fcfLabel: 'Total runout less than .001 inch TIR',
  },
] as const satisfies readonly {
  id: string; title: string; part: string; summary: string; detail: string
  window: readonly [number, number]; fcf: readonly TorqueFcfCell[] | null; fcfLabel: string
}[]

export type TorqueHotspotId = (typeof TORQUE_HOTSPOTS)[number]['id']

/** Special sequences: nothing external to the sequence may be on screen. */
export const TORQUE_HOTSPOT_EXCLUSIONS = Object.freeze([
  Object.freeze({ id: 'inspection-ring', start: 0.46, end: 0.506 }),
  Object.freeze({ id: 'inspection-shaft', start: 0.56, end: 0.855 }),
])

/** Below this the gearbox is still fading (ring isolation or shaft isolation). */
export const TORQUE_HOTSPOT_MIN_SURROUNDINGS = 0.95
export const TORQUE_HOTSPOT_MIN_EXPLODE = 0.65

/** Owner 2026-10-24: the Clutch Housing callout is off until it gets a camera beat that exposes
 * P000420 (the handle-side .532-.558 view hides every surface anchor). Its data stays for re-enable.
 * Owner 2026-10-28: suspend Ring Switch and Second-Stage Planet callouts with jittering leaders.
 * Keep all callout data, anchors and layout for later reactivation.
 */
export const TORQUE_HOTSPOTS_DISABLED: ReadonlySet<string> = new Set(['clutch-housing', 'ring-switch', 'stage2-planet'])

const hotspotById = (id: string) => TORQUE_HOTSPOTS.find(item => item.id === id)

export function isTorqueHotspotInSpecialSequence(progress: number): boolean {
  return TORQUE_HOTSPOT_EXCLUSIONS.some(range => progress >= range.start && progress <= range.end)
}

/** Single gate shared by RuntimeWorld (selection, focus release, anchor projection) and the DOM
 * keyboard-focus path. Pure: every input is sampled by the caller for the same frame.
 */
export function isTorqueHotspotActive(
  id: string, progress: number, explode: number, surroundingsOpacity: number,
  ringVisible: boolean, studyVisible: boolean, manual: boolean,
): boolean {
  const hotspot = hotspotById(id)
  if (!hotspot || TORQUE_HOTSPOTS_DISABLED.has(id) || manual || studyVisible || ringVisible) return false
  if (!Number.isFinite(progress) || isTorqueHotspotInSpecialSequence(progress)) return false
  if (!(surroundingsOpacity >= TORQUE_HOTSPOT_MIN_SURROUNDINGS)) return false
  if (progress < hotspot.window[0] || progress > hotspot.window[1]) return false
  if (hotspot.id === 'stage2-planet' && !(explode > TORQUE_HOTSPOT_MIN_EXPLODE)) return false
  return true
}

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

/** 0..1 draw-in/retract envelope across a callout's own window, so the leader draws out
 * from the reticle as the beat opens and retracts into it before the next callout.
 */
export function torqueCalloutReveal(id: string, progress: number): number {
  const hotspot = hotspotById(id)
  if (!hotspot) return 0
  const [a, b] = hotspot.window
  const span = b - a
  return smooth((progress - a) / (span * 0.2)) * (1 - smooth((progress - (b - span * 0.12)) / (span * 0.12)))
}

/** RuntimeWorld.overlaySample() returns this stable, read-only frame without copying.
 * x/y are CSS viewport pixels AFTER final rig/camera transforms, never drawing-buffer pixels.
 * visible includes beat, opacity, frustum and occlusion gates. Missing anchors stay hidden.
 * P000247 is shared with A000591: project stage2.planets[0], NOT a global name match.
 * explode/surroundingsOpacity/ringVisible feed isTorqueHotspotActive on the DOM side; when a
 * runtime does not publish them the DOM falls back to the neutral (non-blocking) value.
 */
export interface TorqueOverlaySample {
  readonly progress: number
  readonly subjectTime: number
  readonly studyVisible: boolean
  readonly manual: boolean
  readonly focusId: string | null
  readonly explode?: number
  readonly surroundingsOpacity?: number
  readonly ringVisible?: boolean
  readonly anchors: readonly {
    readonly id: string
    readonly x: number
    readonly y: number
    readonly visible: boolean
    readonly reason: string
    readonly occluder: string
  }[]
}

export function isTorqueHotspotActiveForSample(id: string, sample: TorqueOverlaySample): boolean {
  return isTorqueHotspotActive(id, sample.progress, sample.explode ?? 1, sample.surroundingsOpacity ?? 1,
    sample.ringVisible ?? false, sample.studyVisible, sample.manual)
}

// ---------------------------------------------------------------------------------------------
// Leader layout: anchor -> 45° elbow -> horizontal shelf, card on the anchor's near side.

export interface CalloutPoint { x: number; y: number }
export interface CalloutInput { id: string; anchor: CalloutPoint; width: number; height: number }
export interface CalloutPlacement {
  id: string
  side: 1 | -1
  /** Card box in viewport pixels. */
  left: number
  top: number
  width: number
  height: number
  /** anchor, elbow, shelf end (touching the card edge). */
  leader: [CalloutPoint, CalloutPoint, CalloutPoint]
}
export interface CalloutViewport {
  width: number
  height: number
  /** Safe margins: top band, bottom band (free-look button / captions), sides. */
  top?: number
  bottom?: number
  side?: number
}

/** Horizontal run of the leader from anchor to the card, and the shelf length. */
const REACH = 96
const SHELF = 28
/** Card shelf sits this far below the card top (aligned with the title rule). */
const SHELF_DROP = 18
const GAP = 14

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, b < a ? a : x))

function orient(a: CalloutPoint, b: CalloutPoint, c: CalloutPoint) {
  const v = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  return Math.abs(v) < 1e-9 ? 0 : v > 0 ? 1 : -1
}
function onSegment(a: CalloutPoint, b: CalloutPoint, p: CalloutPoint) {
  return Math.min(a.x, b.x) - 1e-9 <= p.x && p.x <= Math.max(a.x, b.x) + 1e-9
    && Math.min(a.y, b.y) - 1e-9 <= p.y && p.y <= Math.max(a.y, b.y) + 1e-9
}
export function segmentsIntersect(p1: CalloutPoint, p2: CalloutPoint, q1: CalloutPoint, q2: CalloutPoint): boolean {
  const o1 = orient(p1, p2, q1), o2 = orient(p1, p2, q2), o3 = orient(q1, q2, p1), o4 = orient(q1, q2, p2)
  if (o1 !== o2 && o3 !== o4) return true
  return (o1 === 0 && onSegment(p1, p2, q1)) || (o2 === 0 && onSegment(p1, p2, q2))
    || (o3 === 0 && onSegment(q1, q2, p1)) || (o4 === 0 && onSegment(q1, q2, p2))
}
export function leadersIntersect(a: readonly CalloutPoint[], b: readonly CalloutPoint[]): boolean {
  for (let i = 0; i + 1 < a.length; i++) {
    for (let j = 0; j + 1 < b.length; j++) if (segmentsIntersect(a[i], a[i + 1], b[j], b[j + 1])) return true
  }
  return false
}

function boxesOverlap(a: CalloutPlacement, b: CalloutPlacement) {
  return a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
}
function leaderHitsBox(points: readonly CalloutPoint[], box: CalloutPlacement) {
  const corners = [
    { x: box.left, y: box.top }, { x: box.left + box.width, y: box.top },
    { x: box.left + box.width, y: box.top + box.height }, { x: box.left, y: box.top + box.height },
  ]
  for (let i = 0; i + 1 < points.length; i++) {
    for (let k = 0; k < 4; k++) if (segmentsIntersect(points[i], points[i + 1], corners[k], corners[(k + 1) % 4])) return true
  }
  return false
}

/** Lay out cards beside their anchors. Cards share the anchor's side of the screen, each side's
 * cards stack in the same vertical order as their anchors, and any callout whose leader would
 * still cross another leader or card is dropped (earlier inputs win). Result: zero crossings.
 */
export function layoutTorqueCallouts(inputs: readonly CalloutInput[], viewport: CalloutViewport): CalloutPlacement[] {
  const w = viewport.width, h = viewport.height
  const marginX = viewport.side ?? 20
  const minTop = viewport.top ?? 20
  const maxBottom = h - (viewport.bottom ?? 96)
  const groups: Record<'1' | '-1', { input: CalloutInput; order: number }[]> = { '1': [], '-1': [] }
  inputs.forEach((input, order) => {
    const roomRight = w - marginX - (input.anchor.x + REACH)
    const roomLeft = input.anchor.x - REACH - marginX
    // Near side: the half of the screen the anchor is in, unless the card cannot fit there.
    let side: 1 | -1 = input.anchor.x >= w / 2 ? 1 : -1
    if (side > 0 && roomRight < input.width && roomLeft > roomRight) side = -1
    if (side < 0 && roomLeft < input.width && roomRight > roomLeft) side = 1
    groups[side > 0 ? '1' : '-1'].push({ input, order })
  })

  const placed: (CalloutPlacement & { order: number })[] = []
  for (const key of ['1', '-1'] as const) {
    const side = key === '1' ? 1 : -1
    // Sort by anchor height so shelves (and therefore leaders) keep the anchors' order.
    const group = groups[key].slice().sort((a, b) => a.input.anchor.y - b.input.anchor.y)
    let floor = minTop
    for (const { input, order } of group) {
      const { anchor, width, height } = input
      // Shelf rises up-and-out from the anchor at about 45° into the open space above the
      // model, then levels into the card. Near the top edge it drops below instead.
      const rise = clamp(h * 0.2, 60, 190)
      const desiredShelf = anchor.y - rise - SHELF_DROP >= minTop ? anchor.y - rise : anchor.y + rise
      const shelfY = clamp(desiredShelf, Math.max(minTop, floor) + SHELF_DROP, maxBottom - height + SHELF_DROP)
      const top = shelfY - SHELF_DROP
      floor = top + height + GAP
      const reach = Math.max(REACH, Math.abs(shelfY - anchor.y))
      const shelfEnd = side > 0
        ? clamp(anchor.x + reach + SHELF, marginX, w - marginX - width)
        : clamp(anchor.x - reach - SHELF, marginX + width, w - marginX)
      const left = side > 0 ? shelfEnd : shelfEnd - width
      const elbowX = shelfEnd - side * SHELF
      // The leader always leaves the anchor outward; if the card was clamped back past the
      // anchor, the elbow collapses onto the anchor column (vertical drop, still non-crossing).
      const elbow = { x: side > 0 ? Math.max(anchor.x, elbowX) : Math.min(anchor.x, elbowX), y: shelfY }
      placed.push({ id: input.id, side, left, top, width, height, order,
        leader: [{ x: anchor.x, y: anchor.y }, elbow, { x: shelfEnd, y: shelfY }] })
    }
  }

  // Final guarantee: earlier inputs (priority order) win; anything that would cross is dropped.
  placed.sort((a, b) => a.order - b.order)
  const accepted: CalloutPlacement[] = []
  for (const candidate of placed) {
    const clash = accepted.some(other => leadersIntersect(candidate.leader, other.leader)
      || boxesOverlap(candidate, other) || leaderHitsBox(candidate.leader, other) || leaderHitsBox(other.leader, candidate))
    if (!clash) {
      const { order: _order, ...placement } = candidate
      accepted.push(placement)
    }
  }
  return accepted
}

export const TORQUE_PART_FOCUS_EVENT = 'torque-part-focus'

export function requestTorquePartFocus(id: TorqueHotspotId | null): void {
  window.dispatchEvent(new CustomEvent(TORQUE_PART_FOCUS_EVENT, { detail: { id } }))
}

export function readTorqueOverlaySample(): TorqueOverlaySample | null {
  return (window as Window & {
    __torqueWorld?: { overlaySample?: () => TorqueOverlaySample }
  }).__torqueWorld?.overlaySample?.() ?? null
}
