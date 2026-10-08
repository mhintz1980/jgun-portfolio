/**
 * JG-035 S2 (owner revision 2026-10-07) — retrospective factor-of-safety (FOS) presentation.
 *
 * ONE table feeds the sampler, the stress shader and the DOM panels, so a colour can never disagree
 * with the number or the bar next to it. The numbers are authored recollections of a project Mark
 * worked on and no longer has exact data for ("numbers don't need to be precise"); they are NOT a
 * newly executed solver result and carry no load case, solver date or stress units. The owner asked
 * for no on-screen disclaimer, so none is printed; this comment and the evidence record are where the
 * provenance lives.
 */
import type { ShaftCardId } from './script'

/** Printed range of the FOS bar. */
export const FOS_MIN = 0
export const FOS_MAX = 3

/** Attempted alloys: all below 1.0, weakest 4140, strongest C300 (owner request). Ordered. */
export const FOS_ATTEMPTS = Object.freeze({ '4140': 0.55, '4340': 0.72, c300: 0.9 } as const)
export const FOS_ATTEMPT_ORDER = ['4140', '4340', 'c300'] as const

/**
 * Revised (hobbed, smooth-blank) shaft: blue shades only — the upper end of the same bar. The hotspot
 * floor sits in the light-blue part of the scale; the body is full blue. No number is printed for it.
 */
export const FOS_REVISED = Object.freeze({ hotspot: 2.55, body: FOS_MAX })

/** Red -> orange -> yellow -> green -> cyan -> blue, SolidWorks-style, value then linear RGB-ish sRGB triple. */
export const FOS_STOPS: readonly (readonly [number, number, number, number])[] = Object.freeze([
  [0.0, 0.86, 0.07, 0.06],
  [0.6, 0.93, 0.17, 0.07],
  [0.85, 1.0, 0.5, 0.06],
  [1.05, 1.0, 0.88, 0.1],
  [1.45, 0.45, 0.86, 0.14],
  [1.95, 0.1, 0.78, 0.45],
  [2.35, 0.08, 0.72, 0.9],
  [3.0, 0.1, 0.26, 0.86],
])

/** Colour at a FOS value, clamped to the bar. */
export function fosColor(value: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const f = value < FOS_MIN ? FOS_MIN : value > FOS_MAX ? FOS_MAX : value
  let i = 1
  while (i < FOS_STOPS.length - 1 && f > FOS_STOPS[i][0]) i++
  const a = FOS_STOPS[i - 1], b = FOS_STOPS[i]
  const u = (f - a[0]) / (b[0] - a[0])
  out[0] = a[1] + (b[1] - a[1]) * u; out[1] = a[2] + (b[2] - a[2]) * u; out[2] = a[3] + (b[3] - a[3]) * u
  return out
}

/** The same colormap as a GLSL function body, generated from FOS_STOPS (single source of truth). */
export function fosGlsl(): string {
  const stops = FOS_STOPS.map(s => `  vec4(${s[0].toFixed(3)}, ${s[1].toFixed(3)}, ${s[2].toFixed(3)}, ${s[3].toFixed(3)})`).join(',\n')
  return `
vec3 jgFosColor(float fos) {
  float f = clamp(fos, ${FOS_MIN.toFixed(1)}, ${FOS_MAX.toFixed(1)});
  vec4 stops[${FOS_STOPS.length}] = vec4[${FOS_STOPS.length}](
${stops}
  );
  vec3 c = stops[0].yzw;
  for (int i = 1; i < ${FOS_STOPS.length}; i++) {
    float u = clamp((f - stops[i - 1].x) / (stops[i].x - stops[i - 1].x), 0.0, 1.0);
    c = mix(c, mix(stops[i - 1].yzw, stops[i].yzw, u), step(stops[i - 1].x, f));
  }
  return c;
}
`
}

/** Axial centre (shaft-local mm) of the concentration: the relief-groove floor of the old shaft; the end of the hobbed lead-out on the revision. */
export const FOS_CENTER_Y = Object.freeze({ attempt: 10.41, revised: 13.4 })

/** Attempt boundaries (s) at which the study swaps alloy; the marker eases across each over FOS_SWAP seconds. */
export const FOS_SWAP = 0.28
const BOUNDARIES: readonly number[] = [17.8, 20.3]

const ease = (x: number) => { const t = x < 0 ? 0 : x > 1 ? 1 : x; return t * t * (3 - 2 * t) }

/** Authored attempt FOS for a card id (null for the revised card / no card). */
export function fosForCard(card: ShaftCardId): number | null {
  return card === '4140' || card === '4340' || card === 'c300' ? FOS_ATTEMPTS[card] : null
}

/**
 * Hotspot FOS of the attempted undercut study at master time `time`: the current alloy's value, eased
 * across the two boundaries so the stress colours and the bar line move together. Pure, closed-form.
 */
export function attemptFosAt(time: number): number {
  let value: number = FOS_ATTEMPTS['4140']
  for (let i = 0; i < BOUNDARIES.length; i++) {
    value += (FOS_ATTEMPTS[FOS_ATTEMPT_ORDER[i + 1]] - FOS_ATTEMPTS[FOS_ATTEMPT_ORDER[i]]) * ease((time - (BOUNDARIES[i] - FOS_SWAP / 2)) / FOS_SWAP)
  }
  return value
}

export interface FosPresentation {
  /** 'attempt' = warm undercut study, 'revised' = blue hobbed study, 'none' = nothing on screen. */
  kind: 'none' | 'attempt' | 'revised'
  /** Hotspot FOS driving the shader and the bar marker (0 when none). */
  hotspot: number
  /** Body (far field) FOS: full blue. */
  body: number
  /** Panel/field opacity: follows the stress mix exactly so panels and colours appear within one frame of each other. */
  opacity: number
}
export const newFosPresentation = (): FosPresentation => ({ kind: 'none', hotspot: 0, body: FOS_MAX, opacity: 0 })

export function sampleFosPresentation(time: number, stress: 'none' | 'warm' | 'cool', stressMix: number, out: FosPresentation): FosPresentation {
  out.kind = stress === 'warm' ? 'attempt' : stress === 'cool' ? 'revised' : 'none'
  out.hotspot = stress === 'warm' ? attemptFosAt(time) : stress === 'cool' ? FOS_REVISED.hotspot : 0
  out.body = stress === 'cool' ? FOS_REVISED.body : FOS_MAX
  out.opacity = stress === 'none' ? 0 : stressMix < 0 ? 0 : stressMix > 1 ? 1 : stressMix
  return out
}

/** Provenance string recorded in evidence and code only; deliberately never rendered. */
export const FOS_PROVENANCE = 'Authored retrospective FOS presentation values (owner 2026-10-07): 4140 0.55, 4340 0.72, C300 0.90; revised study blue-only. Not a newly executed solver result.'
