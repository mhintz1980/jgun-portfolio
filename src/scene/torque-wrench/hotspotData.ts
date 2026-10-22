/** Doc39 §8: part identities and verified design facts; no authored world coordinates.
 * RuntimeWorld owns projection/occlusion and camera focus. DOM owns presentation.
 */
export const TORQUE_HOTSPOTS = [
  {
    id: 'clutch-housing', title: 'Clutch Housing', part: 'P000420 → P000245',
    summary: '⌀2.525 H7/k6 · Finished after heat treat',
    detail: 'The housing OD and ID are both finished after heat treat, keeping heat-treatment distortion out of the mating fit.',
  },
  {
    id: 'ring-switch', title: 'Ring Switch', part: 'P003068',
    summary: 'OD diamond knurl · Detent grooves',
    detail: 'The knurled outer diameter gives the operator a grip to twist and shift between Rundown and High Torque. Detent grooves locate the selector; the OSHA Blue and OSHA Red stripes identify the modes.',
  },
  {
    id: 'lcd-manometer', title: 'LCD Manometer', part: 'P002115 / BK11356',
    summary: 'Digital pressure / torque readout',
    detail: 'The rear-handle display brings the pressure and torque readout to the operator. Inspect the LCD cluster in its handle mounting.',
  },
  {
    id: 'stage2-planet', title: 'Second-Stage Planet Gear', part: 'P000247 · A000592',
    summary: 'Total runout < .001″ TIR · ISO 1328 Grade A6',
    detail: 'The second-stage P000247 planet belongs to A000592, with carrier cage P001837. All gears were cut in house. Total runout below .001 inch and ISO 1328 Grade A6 define the precision requirement.',
  },
] as const

export type TorqueHotspotId = (typeof TORQUE_HOTSPOTS)[number]['id']

/** RuntimeWorld.overlaySample() returns this stable, read-only frame without copying.
 * x/y are CSS viewport pixels AFTER final rig/camera transforms, never drawing-buffer pixels.
 * visible includes beat, opacity, frustum and occlusion gates. Missing anchors stay hidden.
 * P000247 is shared with A000591: project stage2.planets[0], NOT a global name match.
 */
export interface TorqueOverlaySample {
  readonly progress: number
  readonly subjectTime: number
  readonly studyVisible: boolean
  readonly manual: boolean
  readonly focusId: string | null
  readonly anchors: readonly {
    readonly id: string
    readonly x: number
    readonly y: number
    readonly visible: boolean
    readonly reason: string
    readonly occluder: string
  }[]
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
