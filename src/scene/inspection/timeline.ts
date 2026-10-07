export const INSPECTION_DURATION = 12
export const TRAVERSE_START = 4.2
export const TRAVERSE_END = 6.2
export const WHEEL_RADIUS = 0.0115
export const WHEEL_WIDTH = 0.0075
export const SHOULDER = 0.0016

// Measured on public/models/knurling-tool.glb (clip KnurlTool_Approach_Contact_Traverse_Retract, 30 fps keys):
// both rollers first touch the OD at clip 1.5 s, the sampled axial traverse spans 55/30..115/30 s, and the
// rollers leave the OD at clip 4.0 s. Radial clearance is positive from there on.
export const CLIP_START = 1 / 30
export const CLIP_CONTACT_START = 1.5
export const CLIP_TRAVERSE_START = 55 / 30
export const CLIP_TRAVERSE_END = 115 / 30
export const CLIP_CONTACT_END = 4
export const CLIP_END = 5

// Display-time landmarks (seconds of the 12 s sequence).
export const APPROACH_START = 2.8
/** Paired rollers touch the OD here and roll, without axial travel, until TRAVERSE_START. */
export const CONTACT_START = 3.8
export const CONTACT_DWELL = TRAVERSE_START - CONTACT_START
/** Tool starts to fade only once measured radial clearance is >= TOOL_FADE_MIN_CLEARANCE. */
export const TOOL_FADE_START = 7.7
export const TOOL_FADE_END = 8.2
export const TOOL_FADE_MIN_CLEARANCE = 0.01
export const BLACK_FINISH_START = 9.3
export const RETURN_START = 10.5

// Temporal detail budget, NOT a physical spin cap. High-speed repeated features must be filtered by the renderer.
export const RING_RADIUS = .07544365628189591 / 2
export const RING_WIDTH = .027204217025541766
export const RING_FEATURES = 96
export const ROLLER_TEETH = 128
export const LITE_FPS = 30
export const MAX_FEATURE_HZ = LITE_FPS / 4
/** Two opposed contacts cover a circle after pi radians, not after one visible tooth pitch. */
export const SPIN_RATE = 4 * Math.PI
// A 2% sweep margin covers Float32 clip interpolation and sampled boundary tolerances.
export const COVERAGE_TIME = Math.PI * 1.02 / SPIN_RATE
export const FORMING_END = TRAVERSE_END + COVERAGE_TIME
export const CONTACT_END = TRAVERSE_END + (CLIP_CONTACT_END - CLIP_TRAVERSE_END) * 2 / (CLIP_END - CLIP_TRAVERSE_END)
const BAND_WIDTH = RING_WIDTH - 2 * SHOULDER

const SPIN_UP_START = 1.2
const SPIN_UP_TIME = CONTACT_START - SPIN_UP_START
const CRUISE_TIME = CONTACT_END - CONTACT_START
const RETRACT_RAMP_TIME = 0.4
const RETRACT_SPIN_RATE = 0.5
const RETRACT_RAMP_END = CONTACT_END + RETRACT_RAMP_TIME
const DECEL_START = 8.2
const DECEL_TIME = RETURN_START - DECEL_START
/** Preserve the eight-turn lifecycle contract and pin-hole registration. */
export const FINAL_ANGLE = 16 * Math.PI
const RETRACT_RAMP_ANGLE = (SPIN_RATE + RETRACT_SPIN_RATE) * RETRACT_RAMP_TIME / 2
const RETRACT_CRUISE_ANGLE = RETRACT_SPIN_RATE * (DECEL_START - RETRACT_RAMP_END)
const SPIN_UP_OWED = FINAL_ANGLE - SPIN_RATE * CRUISE_TIME - RETRACT_RAMP_ANGLE - RETRACT_CRUISE_ANGLE - RETRACT_SPIN_RATE * DECEL_TIME / 2
// Squared smoothstep integrates to 13/35; the endpoint-flat bump integrates to 8/15.
const BUMP_GAIN = (SPIN_UP_OWED / SPIN_UP_TIME - SPIN_RATE * 13 / 35) / (8 / 15)

const clamp = (x: number) => Math.max(0, Math.min(1, x))
export const ease = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t) }
const easeIntegral = (x: number) => x * x * x - x * x * x * x / 2
export interface SpinFrame { angle: number; spin: number }
export interface InspectionFrame {
  phase: string; time: number; aluminium: number; knurl: number
  angle: number; clipTime: number; toolVisible: boolean; returnBlend: number
  /** Ring angular rate, rad/s: continuous over the sequence. */
  spin: number
  /** True while the paired rollers are on the OD (clip 1.5 s .. 4.0 s). */
  contact: boolean
  /** Tool prop opacity: 1 until measured clearance, then fades to 0 by TOOL_FADE_END. */
  toolOpacity: number
  /** Retained repeated-feature bandwidth in [0,1]; filter OD normals, never the formed-region mask. */
  ringDetailScale: number
  /** Retained tooth bandwidth in [0,1]; filter the roller depiction, never its true rotation/contact footprint. */
  rollerDetailScale: number
}

/** Deterministic ring angle and rate; the rollers derive their own angle with rollerAngle(). */
export function sampleSpin<T extends SpinFrame>(time: number, out: T): T {
  const t = Math.max(0, Math.min(INSPECTION_DURATION, time))
  if (t < SPIN_UP_START) { out.angle = 0; out.spin = 0 }
  else if (t < CONTACT_START) {
    const u = (t - SPIN_UP_START) / SPIN_UP_TIME, b = u * (1 - u)
    out.angle = SPIN_UP_TIME * (SPIN_RATE * (9 * u ** 5 / 5 - 2 * u ** 6 + 4 * u ** 7 / 7) + BUMP_GAIN * 16 * (u ** 3 / 3 - u ** 4 / 2 + u ** 5 / 5))
    out.spin = SPIN_RATE * ease(u) ** 2 + BUMP_GAIN * 16 * b * b
  } else {
    const contactAngle = SPIN_UP_OWED + SPIN_RATE * CRUISE_TIME
    if (t < CONTACT_END) { out.angle = SPIN_UP_OWED + SPIN_RATE * (t - CONTACT_START); out.spin = SPIN_RATE }
    else if (t < RETRACT_RAMP_END) {
      const u = (t - CONTACT_END) / RETRACT_RAMP_TIME
      out.angle = contactAngle + RETRACT_RAMP_TIME * (SPIN_RATE * u + (RETRACT_SPIN_RATE - SPIN_RATE) * easeIntegral(u))
      out.spin = SPIN_RATE + (RETRACT_SPIN_RATE - SPIN_RATE) * ease(u)
    } else if (t < DECEL_START) {
      out.angle = contactAngle + RETRACT_RAMP_ANGLE + RETRACT_SPIN_RATE * (t - RETRACT_RAMP_END)
      out.spin = RETRACT_SPIN_RATE
    } else if (t < RETURN_START) {
      const u = (t - DECEL_START) / DECEL_TIME
      out.angle = contactAngle + RETRACT_RAMP_ANGLE + RETRACT_CRUISE_ANGLE + RETRACT_SPIN_RATE * DECEL_TIME * (u - easeIntegral(u))
      out.spin = RETRACT_SPIN_RATE * (1 - ease(u))
    } else { out.angle = FINAL_ANGLE; out.spin = 0 }
  }
  return out
}

/** Roller angle about its own axis: equal tangential speed at the OD, opposite sense (external rolling contact). */
export const rollerAngle = (ringAngle: number, ringRadius: number, rollerRadius: number) => -ringAngle * ringRadius / rollerRadius

export function sampleInspection(time: number, out: InspectionFrame): InspectionFrame {
  const t = Math.max(0, Math.min(INSPECTION_DURATION, time))
  out.time = t
  out.phase = t < 1.2 ? 'Smooth black' : t < 2.8 ? 'Aluminium · spin' : t < 4.2 ? 'Paired rollers · approach' : t < 6.2 ? 'Diamond knurl · traverse' : t < 8.2 ? 'Clearance · retract' : t < 10.5 ? 'Black finish · decelerate' : t < 12 ? 'Assembly return' : 'Complete'
  out.aluminium = ease((t - 1.2) / 1.2) * (1 - ease((t - 8.2) / (BLACK_FINISH_START - 8.2)))
  // The initial footprint has received pi radians during the dwell. Reveal it smoothly, then trail the
  // leading roller edge by the pi-radian forming interval. The far edge finishes in the stationary end dwell.
  const coveredTravel = clamp((t - COVERAGE_TIME - TRAVERSE_START) / (TRAVERSE_END - TRAVERSE_START))
  out.knurl = ease((t - TRAVERSE_START) / COVERAGE_TIME) * (WHEEL_WIDTH + (BAND_WIDTH - WHEEL_WIDTH) * coveredTravel) / BAND_WIDTH
  // Export uses absolute frame/fps samples: first key is 1/30, last is 150/30.
  // Approach eases into first contact (zero closing speed), then the clip rolls through the 0.4 s dwell to the
  // traverse key; traverse is 1:1 clip time; retract is linear to the final key.
  out.clipTime = t < APPROACH_START ? CLIP_START
    : t < CONTACT_START ? CLIP_START + (CLIP_CONTACT_START - CLIP_START) * ease((t - APPROACH_START) / (CONTACT_START - APPROACH_START))
    : t < TRAVERSE_START ? CLIP_CONTACT_START + (CLIP_TRAVERSE_START - CLIP_CONTACT_START) * (t - CONTACT_START) / CONTACT_DWELL
    : t < TRAVERSE_END ? CLIP_TRAVERSE_START + t - TRAVERSE_START
    : t < 8.2 ? CLIP_TRAVERSE_END + (t - TRAVERSE_END) / 2 * (CLIP_END - CLIP_TRAVERSE_END) : CLIP_END
  out.contact = out.clipTime >= CLIP_CONTACT_START && out.clipTime <= CLIP_CONTACT_END
  out.toolOpacity = t < APPROACH_START || t >= TOOL_FADE_END ? 0 : 1 - ease((t - TOOL_FADE_START) / (TOOL_FADE_END - TOOL_FADE_START))
  out.toolVisible = out.toolOpacity > 0
  sampleSpin(t, out)
  const ringHz = out.spin * (2 * RING_FEATURES) / (2 * Math.PI)
  const rollerHz = out.spin * RING_RADIUS / WHEEL_RADIUS * ROLLER_TEETH / (2 * Math.PI)
  out.ringDetailScale = ringHz > MAX_FEATURE_HZ ? MAX_FEATURE_HZ / ringHz : 1
  out.rollerDetailScale = rollerHz > MAX_FEATURE_HZ ? MAX_FEATURE_HZ / rollerHz : 1
  out.returnBlend = ease((t - 10.5) / 1.5)
  return out
}
export function odMask(radius: number, z: number, normalZ: number, od: number, halfWidth: number, progress: number): number {
  const bandMin = -halfWidth + SHOULDER, bandMax = halfWidth - SHOULDER
  if (radius < od - 0.00035 || Math.abs(normalZ) > 0.2 || z <= bandMin || z >= bandMax || progress <= 0) return 0
  return z <= bandMin + progress * (bandMax - bandMin) ? 1 : 0
}
export const newFrame = (): InspectionFrame => ({ phase: 'Smooth black', time: 0, aluminium: 0, knurl: 0, angle: 0, clipTime: 0, toolVisible: false, returnBlend: 0, spin: 0, contact: false, toolOpacity: 0, ringDetailScale: 1, rollerDetailScale: 1 })
