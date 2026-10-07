/**
 * JG-035 shaft machining kinematics (leaf spec: shaft-kinematics-camera-spec, 2026-10-05).
 *
 * Closed-form machining kinematics for the 43 s Input Shaft story, sampled from one master
 * playhead. Everything is a pure function of time: no accumulators, no clocks, no randomness,
 * no allocation in per-frame paths, deterministic under any seek order.
 *
 * Frame: shaft-local millimetres, +Y is the shaft axis (CAD datum). The runtime loader performs
 * exactly one conversion (shaft-local +Y -> glTF -Z); nothing here converts.
 *
 * Certified tool numbers (clearance-v4 report, mirrored in toolSpec.ts):
 *   shaper N=20 disc cutter, signed work/cutter ratio -2, centre distance 15.5 mm,
 *   tip radius 11.2032 mm (near edge at root + 5 um), thickness 1.2 mm,
 *   stroke centre limits y 2.17..9.7749, overtravel 0.5 mm past the last tooth material,
 *   return backed off 2.0 mm. Hob R 5.87 mm tilted 5.5587 deg, centre distance 10.1618 mm,
 *   stop yc 9.5249, path: radial infeed at yc -4.195 -> feed +Y -> retract 2.5 mm -> withdraw.
 *
 * Sign conventions (tool-conventions.md, independently checked there to 1e-12 m/s):
 *   Shaper: tool and work axes +Y, cutter centre on +Z. Positive angles right-hand about +Y.
 *   External rolling at the pitch point (work z=+5, cutter z=-10 in the 5/10 mm pitch circles)
 *   gives phi_w = -2 * phi_c (toolSpec SHAPER_SIGNED_RATIO).
 *   Hob: RH one-start, axis a = [cos g, sin g, 0], shaft contact at shaft +Z = tool -Z side,
 *   so phi_w = -(starts / teeth) * phi_h = -phi_h / 10.
 */
import type { ProgressionState } from './progression'
import {
  FACE_START_MM,
  HOB_INFEED_YC_MM,
  HOB_RETRACT_MM,
  HOB_VISUAL_A_MM,
  HOB_VISUAL_R_MM,
  SHAFT_OD_MM,
  SHAFT_ROOT_MM,
  SHAFT_SPACES,
  SHAPING_FACE_END_MM,
  SPACE_CLOCK_RAD,
  SPACE_PITCH_RAD,
} from './progression'
import {
  HOB_CENTRE_DISTANCE_AT_DEPTH_MM,
  HOB_LENGTH_MM,
  HOB_LEAD_ANGLE_DEG,
  HOB_RADIUS_MM,
  HOB_STARTS,
  HOB_STOP_YC_MM,
  SHAPER_BACKOFF_MM,
  SHAPER_SIGNED_RATIO,
  SHAPER_STROKE_CENTRE_Y_MAX_MM,
  SHAPER_STROKE_CENTRE_Y_MIN_MM,
  SHAPER_TEETH,
  SHAPER_THICKNESS_MM,
} from './toolSpec'

// ---- master playhead -> machining time map -----------------------------------------------

export const SHAFT_KINEMATICS_DURATION = 43
/** 30 fps lite floor; repeated features above a quarter of it must be softened. */
export const SHAFT_LITE_FPS = 30
export const SHAFT_MAX_FEATURE_HZ = SHAFT_LITE_FPS / 4

const T_SHAPING_START = 2
/** End of the eased startup ramp; the full normal rate resumes here (C1 at 2.0 s and 3.0 s). */
const T_STARTUP_EASE_END = 3
const T_EASE_DOWN = 6
const T_SLOW_START = 7.2
const T_SLOW_END = 9.6
const T_EASE_UP_END = 11
const T_RECAP_END = 14
const T_SHAPING_END = 15
const T_HOB_RATE_IN = 24.6
const T_HOB_RATE_FULL = 25.6
const T_HOB_RATE_DOWN = 31.4
const T_HOB_END = 32
const RATE_NORMAL = 1
const RATE_SLOW = 0.22
const RATE_RECAP = 4

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const ease = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }
/** Integral of ease over [0, u]. */
const easeIntegral = (u: number) => { const t = clamp01(u); return t * t * t - t * t * t * t / 2 }
const mod1 = (x: number) => x - Math.floor(x)

interface RateSegment { readonly t0: number; readonly t1: number; readonly r0: number; readonly r1: number; readonly m0: number }

/**
 * Rate segments dm/dt: frozen before 2 s, eased onset 2..3 s (C1 out of the frozen pre-roll
 * and into the normal rate; the review's 2.0 s 0 -> 1 step is gone), normal 3..6 s, eased
 * slow window, compressed recap easing to 0 at 15 s, frozen until the hob window.
 */
const RATE_SPEC: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, T_SHAPING_START, 0, 0],
  [T_SHAPING_START, T_STARTUP_EASE_END, 0, RATE_NORMAL],
  [T_STARTUP_EASE_END, T_EASE_DOWN, RATE_NORMAL, RATE_NORMAL],
  [T_EASE_DOWN, T_SLOW_START, RATE_NORMAL, RATE_SLOW],
  [T_SLOW_START, T_SLOW_END, RATE_SLOW, RATE_SLOW],
  [T_SLOW_END, T_EASE_UP_END, RATE_SLOW, RATE_RECAP],
  [T_EASE_UP_END, T_RECAP_END, RATE_RECAP, RATE_RECAP],
  [T_RECAP_END, T_SHAPING_END, RATE_RECAP, 0],
  [T_SHAPING_END, T_HOB_RATE_IN, 0, 0],
  [T_HOB_RATE_IN, T_HOB_RATE_FULL, 0, 1],
  [T_HOB_RATE_FULL, T_HOB_RATE_DOWN, 1, 1],
  [T_HOB_RATE_DOWN, T_HOB_END, 1, 0],
  [T_HOB_END, SHAFT_KINEMATICS_DURATION, 0, 0],
]

const RATE_SEGMENTS: readonly RateSegment[] = (() => {
  const segments: RateSegment[] = []
  let m = 0
  for (const [t0, t1, r0, r1] of RATE_SPEC) {
    segments.push({ t0, t1, r0, r1, m0: m })
    m += (t1 - t0) * (r0 + r1) * 0.5
  }
  return segments
})()

/** Interior rate-segment boundary times (s); m(t) is tested for C1 across each of these. */
export const MACHINING_RATE_BOUNDARIES: readonly number[] = RATE_SPEC.slice(1, -1).map((segment) => segment[0])

function rateSegmentAt(t: number): RateSegment {
  for (let i = RATE_SEGMENTS.length - 1; i >= 0; i--) {
    const segment = RATE_SEGMENTS[i]
    if (t >= segment.t0) return segment
  }
  return RATE_SEGMENTS[0]
}

/** Machining time m(t): continuous, monotonic, C1 (rate is C0, piecewise smooth). */
export function machiningTimeAt(time: number): number {
  const t = time < 0 ? 0 : time > SHAFT_KINEMATICS_DURATION ? SHAFT_KINEMATICS_DURATION : time
  const s = rateSegmentAt(t)
  const u = (t - s.t0) / (s.t1 - s.t0)
  return s.m0 + (t - s.t0) * s.r0 + (s.r1 - s.r0) * (s.t1 - s.t0) * easeIntegral(u)
}

/** dm/dt at the master playhead. */
export function machiningRateAt(time: number): number {
  const t = time < 0 ? 0 : time > SHAFT_KINEMATICS_DURATION ? SHAFT_KINEMATICS_DURATION : time
  const s = rateSegmentAt(t)
  if (s.r0 === s.r1) return s.r0
  return s.r0 + (s.r1 - s.r0) * ease((t - s.t0) / (s.t1 - s.t0))
}

/** Midpoint of the stable slow window; the exit stroke peaks here (t = 8.4 s). */
export const T_SLOW_MID = (T_SLOW_START + T_SLOW_END) / 2
export const MACHINING_AT_SLOW_MID = machiningTimeAt(T_SLOW_MID)
export const MACHINING_AT_SHAPING_END = machiningTimeAt(T_SHAPING_END)

// ---- shaper ------------------------------------------------------------------------------

/** Work revolution period in machining seconds (ratio -2 with the cutter below). */
export const WORK_REV_M = 2
export const CUTTER_RATE = Math.PI / 2
export const WORK_RATE = SHAPER_SIGNED_RATIO * CUTTER_RATE
/** Mesh (pitch) point azimuth in the machine frame: cutter centre sits on +Z. */
export const MESH_AZ_RAD = Math.PI / 2
/** Stroke period in machining seconds; 2.5 strokes per work revolution. */
export const STROKE_PERIOD_M = 0.8
/**
 * Stroke phase offset, chosen so phase 0.5 (peak, yc = stroke max) lands exactly at
 * MACHINING_AT_SLOW_MID: the readable cutter exit sits at the centre of the slow window.
 */
export const STROKE_PHASE_OFFSET = mod1(0.5 - MACHINING_AT_SLOW_MID / STROKE_PERIOD_M)
/** Cutter orbit period; radial infeed completes within the first quarter orbit. */
export const CUTTER_ORBIT_M = (2 * Math.PI) / CUTTER_RATE
export const INFEED_END_M = CUTTER_ORBIT_M / 4
/** Cutter tip runs at work root + 5 um stock (clearance-v4 shaper fit). */
export const ROOT_TIP_STOCK_MM = 0.005
export const CUTTER_TIP_RHO_MM = SHAFT_ROOT_MM + ROOT_TIP_STOCK_MM
/**
 * Illustrative counted contact events each tooth space needs to reach depth 1. Selected
 * cutting revolutions recur every 2 * WORK_REV_M (the stroke/work ratio is 2.5). Each
 * event is placed within the nearest-space sector AND actual axial/radial stock contact;
 * four events put every space's completion inside the 11..15 s recap. This depicts
 * retained pass depths, not a continuous generating-surface simulation.
 */
export const SPACE_PASSES_REQUIRED = 4
/** Deterministic chip seed (golden-ratio conjugate); fixes the baked chip offsets. */
export const CHIP_SEED = 0.6180339887498949

export function strokePhaseAt(m: number): number {
  return mod1(m / STROKE_PERIOD_M + STROKE_PHASE_OFFSET)
}

export function strokeCentreYAt(m: number): number {
  const phase = strokePhaseAt(m)
  const bump = 0.5 * (1 - Math.cos(2 * Math.PI * phase))
  return SHAPER_STROKE_CENTRE_Y_MIN_MM + (SHAPER_STROKE_CENTRE_Y_MAX_MM - SHAPER_STROKE_CENTRE_Y_MIN_MM) * bump
}

/** Relieved-return radial backoff (mm): eased in/out around a full 2.0 mm plateau. */
export function backoffAt(m: number): number {
  const phase = strokePhaseAt(m)
  if (phase < 0.5) return 0
  const u = (phase - 0.5) * 2
  const bump = u < 0.2 ? ease(u / 0.2) : u <= 0.84 ? 1 : 1 - ease((u - 0.84) / 0.16)
  return SHAPER_BACKOFF_MM * bump
}

/** Radial infeed position of the cutter near edge (mm): OD -> root + 5 um in the first quarter orbit. */
export function infeedRhoAt(m: number): number {
  if (m <= 0) return SHAFT_OD_MM
  if (m >= INFEED_END_M) return CUTTER_TIP_RHO_MM
  return SHAFT_OD_MM + (CUTTER_TIP_RHO_MM - SHAFT_OD_MM) * ease(m / INFEED_END_M)
}

/**
 * Tooth-space contact schedule. Space i centre crosses the mesh azimuth when
 * SPACE_CLOCK + i*pitch + WORK_RATE*m === MESH_AZ (mod 2*pi); crossings recur every
 * WORK_REV_M. Because WORK_REV_M / STROKE_PERIOD_M = 2.5, the stroke phase at a space's
 * crossings advances by exactly +0.5 per revolution. A cutting-half centre crossing can
 * still precede the stock face: counting it would remove material while engagedSpace=-1.
 * Move that event to the first actual face contact within the SAME nearest-space sector
 * (half a pitch either side of the centre). Precompute once, never allocate during sample.
 */
const STOCK_ENTRY_PHASE = Math.acos(1 - 2 * (FACE_START_MM - SHAPER_THICKNESS_MM / 2 - SHAPER_STROKE_CENTRE_Y_MIN_MM)
  / (SHAPER_STROKE_CENTRE_Y_MAX_MM - SHAPER_STROKE_CENTRE_Y_MIN_MM)) / (2 * Math.PI)
const STOCK_EXIT_PHASE = Math.acos(1 - 2 * (SHAPING_FACE_END_MM - SHAPER_THICKNESS_MM / 2 - SHAPER_STROKE_CENTRE_Y_MIN_MM)
  / (SHAPER_STROKE_CENTRE_Y_MAX_MM - SHAPER_STROKE_CENTRE_Y_MIN_MM)) / (2 * Math.PI)
const PASS_REPEAT_M = 2 * WORK_REV_M
const HALF_SPACE_WINDOW_M = SPACE_PITCH_RAD / (2 * Math.abs(WORK_RATE))
/** Tiny interior offset avoids an acos/cos roundoff putting the event outside the face. */
const CONTACT_INTERIOR_M = 1e-9
const FIRST_CONTACT_PASS_M: number[] = []
for (let i = 0; i < SHAFT_SPACES; i++) {
  const alpha = SPACE_CLOCK_RAD + i * SPACE_PITCH_RAD
  let c = (alpha - MESH_AZ_RAD) / -WORK_RATE
  c -= Math.floor(c / WORK_REV_M) * WORK_REV_M
  if (strokePhaseAt(c) >= 0.5) c += WORK_REV_M
  const strokeStart = c - strokePhaseAt(c) * STROKE_PERIOD_M
  const entry = strokeStart + STOCK_ENTRY_PHASE * STROKE_PERIOD_M
  const exit = strokeStart + STOCK_EXIT_PHASE * STROKE_PERIOD_M
  const event = Math.max(entry + CONTACT_INTERIOR_M, Math.min(c, exit - CONTACT_INTERIOR_M))
  const eventEdge = strokeCentreYAt(event) + SHAPER_THICKNESS_MM / 2
  const nearest = Math.round((MESH_AZ_RAD - SPACE_CLOCK_RAD - WORK_RATE * event) / SPACE_PITCH_RAD)
  if (event < c - HALF_SPACE_WINDOW_M || event >= c + HALF_SPACE_WINDOW_M
    || eventEdge < FACE_START_MM || eventEdge > SHAPING_FACE_END_MM
    || ((nearest % SHAFT_SPACES) + SHAFT_SPACES) % SHAFT_SPACES !== i
    || strokePhaseAt(event) >= 0.5 || infeedRhoAt(event) >= SHAFT_OD_MM - 1e-3) {
    throw new Error('Shaper contact event does not fit the certified nearest-space stock window')
  }
  FIRST_CONTACT_PASS_M.push(event)
}

/** Counted stock-contact events of space i by machining time m; closed form, no history. */
export function countedPasses(m: number, space: number): number {
  const first = FIRST_CONTACT_PASS_M[space]
  return m < first ? 0 : Math.floor((m - first) / PASS_REPEAT_M) + 1
}

// ---- hob ---------------------------------------------------------------------------------

const T_HOB_INFEED_END = 25.7
const T_HOB_FEED_END = 30.2
const T_HOB_RETRACT_END = 31
const T_HOB_WITHDRAW_END = 31.8
const HOB_WITHDRAW_YC_MM = -8
const HOB_REV_RATE = 0.5
const HOB_FLUTES = 10
const HOB_FEED_SPAN_MM = HOB_STOP_YC_MM - HOB_INFEED_YC_MM

/** Hob centre y (mm) along the certified path: infeed yc, feed +Y, hold, withdraw below the face. */
export function hobYcAt(t: number): number {
  if (t < T_HOB_INFEED_END) return HOB_INFEED_YC_MM
  if (t < T_HOB_FEED_END) return HOB_INFEED_YC_MM + HOB_FEED_SPAN_MM * ease((t - T_HOB_INFEED_END) / (T_HOB_FEED_END - T_HOB_INFEED_END))
  if (t < T_HOB_RETRACT_END) return HOB_STOP_YC_MM
  if (t < T_HOB_WITHDRAW_END) return HOB_STOP_YC_MM + (HOB_WITHDRAW_YC_MM - HOB_STOP_YC_MM) * ease((t - T_HOB_RETRACT_END) / (T_HOB_WITHDRAW_END - T_HOB_RETRACT_END))
  return HOB_WITHDRAW_YC_MM
}

/** Radial offset from full depth (mm): 2.5 out before infeed and after retract. */
export function hobRadialOffsetAt(t: number): number {
  if (t < T_HOB_INFEED_END) return HOB_RETRACT_MM * (1 - ease((t - 25) / (T_HOB_INFEED_END - 25)))
  if (t < T_HOB_FEED_END) return 0
  if (t < T_HOB_RETRACT_END) return HOB_RETRACT_MM * ease((t - T_HOB_FEED_END) / (T_HOB_RETRACT_END - T_HOB_FEED_END))
  return HOB_RETRACT_MM
}

/** Hob rotation rate (rev/s at the master playhead), eased up 25.2..26 and down 31..31.8. */
export function hobRevRateAt(t: number): number {
  if (t <= 25.2 || t >= 31.8) return 0
  if (t < 26) return HOB_REV_RATE * ease((t - 25.2) / 0.8)
  if (t < 31) return HOB_REV_RATE
  return HOB_REV_RATE * (1 - ease((t - 31) / 0.8))
}

export function hobPhiAt(t: number): number {
  // Closed form: integral of hobRevRateAt with the same smoothstep segments.
  let revs = 0
  if (t > 25.2) {
    if (t < 26) revs = HOB_REV_RATE * 0.8 * easeIntegral((t - 25.2) / 0.8)
    else {
      revs = HOB_REV_RATE * 0.8 * 0.5
      if (t < 31) revs += HOB_REV_RATE * (t - 26)
      else {
        revs += HOB_REV_RATE * 5
        if (t < 31.8) {
          const u = (t - 31) / 0.8
          revs += HOB_REV_RATE * 0.8 * (u - easeIntegral(u))
        }
        else revs += HOB_REV_RATE * 0.8 * 0.5
      }
    }
  }
  return 2 * Math.PI * revs
}

// ---- frame-follow azimuth ----------------------------------------------------------------

/**
 * Frame-follow azimuth psi(t) = FOLLOW_GAIN * mf(t), mf = integral of followWeight * rate.
 * The eased startup is integrated exactly: dm/dt ramps 0 -> 1 across 2..3 s, so mf banks
 * only half a machining second there and psi spans 7*pi/16 over 2..6 s (a full quarter
 * orbit was the retired linear-startup figure). Follow weight: 1 on [2,6], eased to 0 by
 * 7.2 (before the cutter edge reaches the face end), re-engaged 11..12 for the recap,
 * frozen after 15 s because the rate is zero there.
 */
export const FOLLOW_GAIN = Math.PI / 8

export function followWeightAt(t: number): number {
  if (t < T_SHAPING_START) return 0
  if (t < T_EASE_DOWN) return 1
  if (t < T_SLOW_START) return 1 - ease((t - T_EASE_DOWN) / (T_SLOW_START - T_EASE_DOWN))
  if (t < T_EASE_UP_END) return 0
  if (t < 12) return ease((t - T_EASE_UP_END) / 1)
  if (t < T_SHAPING_END) return 1
  return 0
}

const ease2Integral = (u: number) => (9 / 5) * u ** 5 - 2 * u ** 6 + (4 / 7) * u ** 7
/** mf at 3 s: the eased startup segment (length 1, rate 0 -> 1) banks easeIntegral(1) = 0.5. */
const MF_AT_STARTUP_END = (T_STARTUP_EASE_END - T_SHAPING_START) * RATE_NORMAL * easeIntegral(1)
/** mf at 6 s: half a machining second from the eased startup plus three at the normal rate. */
const MF_AT_EASE_DOWN = MF_AT_STARTUP_END + (T_EASE_DOWN - T_STARTUP_EASE_END)
const MF_AT_SLOW_START = MF_AT_EASE_DOWN + 1.2 * (1 - 1.78 * 0.5 + 0.78 * (9 / 5 - 2 + 4 / 7))
const MF_AT_RECAP_START = MF_AT_SLOW_START
const MF_AT_12 = MF_AT_SLOW_START + 4 * 0.5
const MF_AT_RECAP_END = MF_AT_12 + 8
export const FOLLOW_MF_TOTAL = MF_AT_RECAP_END + 4 * 0.5

export function followMfAt(t: number): number {
  if (t < T_SHAPING_START) return 0
  if (t < T_STARTUP_EASE_END) {
    // Weight 1 through the eased startup: mf = m(t) on that segment (same closed form).
    return (T_STARTUP_EASE_END - T_SHAPING_START) * RATE_NORMAL * easeIntegral((t - T_SHAPING_START) / (T_STARTUP_EASE_END - T_SHAPING_START))
  }
  if (t < T_EASE_DOWN) return MF_AT_STARTUP_END + (t - T_STARTUP_EASE_END)
  if (t < T_SLOW_START) {
    const u = (t - T_EASE_DOWN) / (T_SLOW_START - T_EASE_DOWN)
    // integral of (1 - S(u)) * (1 - 0.78 S(u)) over the shared ease window
    return MF_AT_EASE_DOWN + 1.2 * (u - 1.78 * easeIntegral(u) + 0.78 * ease2Integral(u))
  }
  if (t < T_EASE_UP_END) return MF_AT_SLOW_START
  if (t < 12) return MF_AT_RECAP_START + 4 * easeIntegral(t - T_EASE_UP_END)
  if (t < T_RECAP_END) return MF_AT_12 + 4 * (t - 12)
  if (t < T_SHAPING_END) return MF_AT_RECAP_END + 4 * ((t - T_RECAP_END) - easeIntegral(t - T_RECAP_END))
  return FOLLOW_MF_TOTAL
}

// ---- sampler -----------------------------------------------------------------------------

export type ShaftKinematicsMode = 'none' | 'shaping' | 'hobbing'

export interface ShaftKinematicsFrame {
  /** Clamped master playhead (s). */
  time: number
  /** Machining time m(t) and rate dm/dt. */
  machining: number
  machiningRate: number
  mode: ShaftKinematicsMode
  /** Rotating-frame follow azimuth (rad) and weight; lighting follows the same weight. */
  followAzimuth: number
  followWeight: number
  // shaper (machine frame, shaft-local mm)
  cutterPhi: number
  workPhi: number
  strokeCentreY: number
  /** Cutter leading-face y (mm); progression.ts reveal edge. */
  edgeY: number
  strokePhase: number
  cutting: boolean
  returning: boolean
  backoff: number
  /** Cutter near-edge radius (mm), including infeed and backoff. */
  cutterRho: number
  engagedSpace: number
  /** Caller-owned per-space depth in [0,1]; 1 only behind counted cutting engagement. */
  spaceDepth: Float32Array
  // chip (one restrained chip at the rake face; none during return)
  chipOpacity: number
  chipX: number
  chipY: number
  chipZ: number
  chipCurl: number
  // hob (machine frame, shaft-local mm)
  hobPhi: number
  hobWorkPhi: number
  hobRevRate: number
  hobYc: number
  /** Visual floor centre distance for progression.ts (equivalent meridian circle). */
  hobA: number
  /** Certified tool centre distance (10.1618 mm at full depth) plus radial offset. */
  hobToolA: number
  hobR: number
  // display-rate guard (30 fps lite floor)
  strokeHz: number
  gashHz: number
  softened: boolean
}

export function createShaftKinematicsFrame(): ShaftKinematicsFrame {
  return {
    time: 0,
    machining: 0,
    machiningRate: 0,
    mode: 'none',
    followAzimuth: 0,
    followWeight: 0,
    cutterPhi: 0,
    workPhi: 0,
    strokeCentreY: 0,
    edgeY: 0,
    strokePhase: 0,
    cutting: false,
    returning: false,
    backoff: 0,
    cutterRho: SHAFT_OD_MM,
    engagedSpace: -1,
    spaceDepth: new Float32Array(SHAFT_SPACES),
    chipOpacity: 0,
    chipX: 0,
    chipY: 0,
    chipZ: 0,
    chipCurl: 0,
    hobPhi: 0,
    hobWorkPhi: 0,
    hobRevRate: 0,
    hobYc: HOB_INFEED_YC_MM,
    hobA: HOB_VISUAL_A_MM + HOB_RETRACT_MM,
    hobToolA: HOB_CENTRE_DISTANCE_AT_DEPTH_MM + HOB_RETRACT_MM,
    hobR: HOB_VISUAL_R_MM,
    strokeHz: 0,
    gashHz: 0,
    softened: false,
  }
}

/** Write the frame's progression-compatible fields into a caller-owned ProgressionState. */
export function writeShaftProgression(frame: ShaftKinematicsFrame, state: ProgressionState): ProgressionState {
  state.mode = frame.mode
  state.engagedSpace = frame.engagedSpace
  // Count only contact events preceding THIS cutting stroke's stock entry. This retains
  // previous-pass material ahead of the edge both before and after the current event,
  // including a delayed entry event; an old angular-centre crossing is not a cut history.
  if (frame.engagedSpace >= 0) {
    const stockEntry = frame.machining - frame.strokePhase * STROKE_PERIOD_M + STOCK_ENTRY_PHASE * STROKE_PERIOD_M
    state.engagedPreviousDepth = Math.min(1, countedPasses(stockEntry, frame.engagedSpace) / SPACE_PASSES_REQUIRED)
  } else state.engagedPreviousDepth = 0
  state.edgeY = frame.edgeY
  // Tool withdrawal must not restore machined stock. Hold the swept envelope
  // once the certified feed reaches its stop; tool pose stays in the frame.
  state.hobYc = frame.time >= T_HOB_FEED_END ? HOB_STOP_YC_MM : frame.hobYc
  state.hobA = frame.time >= T_HOB_FEED_END ? HOB_VISUAL_A_MM : frame.hobA
  state.hobR = frame.hobR
  const depth = state.spaceDepth
  for (let i = 0; i < SHAFT_SPACES; i++) depth[i] = frame.spaceDepth[i]
  return state
}

/** Closed-form sample of the full machining state. Writes only into out and returns it. */
export function sampleShaftKinematics(time: number, out: ShaftKinematicsFrame): ShaftKinematicsFrame {
  const t = time < 0 ? 0 : time > SHAFT_KINEMATICS_DURATION ? SHAFT_KINEMATICS_DURATION : time
  const m = machiningTimeAt(t)
  const rate = machiningRateAt(t)
  const shaping = t >= T_SHAPING_START && t < T_SHAPING_END
  const hobbing = t >= 25 && t < T_HOB_END

  out.time = t
  out.machining = m
  out.machiningRate = rate
  out.mode = shaping ? 'shaping' : hobbing ? 'hobbing' : 'none'
  out.followAzimuth = FOLLOW_GAIN * followMfAt(t)
  out.followWeight = followWeightAt(t)

  // shaper
  const mShaping = shaping || t < T_SHAPING_START ? m : t >= T_SHAPING_END ? MACHINING_AT_SHAPING_END : m
  const cutterPhi = CUTTER_RATE * mShaping
  const workPhi = SHAPER_SIGNED_RATIO * cutterPhi
  const phase = strokePhaseAt(mShaping)
  const cuttingStroke = phase < 0.5
  const yc = strokeCentreYAt(mShaping)
  const edgeY = yc + SHAPER_THICKNESS_MM * 0.5
  const backoff = backoffAt(mShaping)
  const infeedRho = infeedRhoAt(mShaping)
  out.cutterPhi = cutterPhi
  out.workPhi = workPhi
  out.strokeCentreY = yc
  out.edgeY = edgeY
  out.strokePhase = phase
  out.cutting = cuttingStroke
  out.returning = !cuttingStroke
  out.backoff = backoff
  out.cutterRho = infeedRho + backoff

  for (let i = 0; i < SHAFT_SPACES; i++) {
    const depth = countedPasses(mShaping, i) / SPACE_PASSES_REQUIRED
    out.spaceDepth[i] = depth > 1 ? 1 : depth
  }
  // Groove overtravel is tool motion, not tooth-stock contact.
  const inStock = shaping && cuttingStroke && edgeY >= FACE_START_MM && edgeY <= SHAPING_FACE_END_MM
    && infeedRho < SHAFT_OD_MM - 1e-3
  if (inStock) {
    const raw = (MESH_AZ_RAD - SPACE_CLOCK_RAD - workPhi) / SPACE_PITCH_RAD
    const index = ((Math.round(raw) % SHAFT_SPACES) + SHAFT_SPACES) % SHAFT_SPACES
    out.engagedSpace = index
  } else {
    out.engagedSpace = -1
  }

  // chip: only while stock is removed at the rake face; curls toward -X (surface motion at mesh)
  const chipActive = inStock && infeedRho < SHAFT_OD_MM - 1e-3 && mShaping > 0.02
  if (chipActive) {
    const u = phase * 2
    out.chipOpacity = 0.9 * Math.sin(Math.PI * u)
    out.chipX = -(CHIP_SEED * 0.4 + 0.55 * u)
    out.chipY = edgeY
    out.chipZ = infeedRho + 0.2 + 0.6 * u
    out.chipCurl = 0.8 + 2.4 * u
  } else {
    out.chipOpacity = 0
    out.chipX = 0
    out.chipY = edgeY
    out.chipZ = out.cutterRho
    out.chipCurl = 0
  }

  // hob
  const hobYc = hobYcAt(t)
  const offA = hobRadialOffsetAt(t)
  const hobPhi = hobPhiAt(t)
  out.hobPhi = hobPhi
  out.hobWorkPhi = -hobPhi * (HOB_STARTS / SHAFT_SPACES)
  out.hobRevRate = hobRevRateAt(t)
  out.hobYc = hobYc
  out.hobA = HOB_VISUAL_A_MM + offA
  out.hobToolA = HOB_CENTRE_DISTANCE_AT_DEPTH_MM + offA
  out.hobR = HOB_VISUAL_R_MM

  // display-rate guard
  const strokeHz = shaping ? rate / STROKE_PERIOD_M : 0
  const gashHz = shaping
    ? (SHAPER_TEETH * CUTTER_RATE / (2 * Math.PI)) * rate
    : hobbing
      ? HOB_FLUTES * out.hobRevRate
      : 0
  out.strokeHz = strokeHz
  out.gashHz = gashHz
  out.softened = strokeHz > SHAFT_MAX_FEATURE_HZ || gashHz > SHAFT_MAX_FEATURE_HZ
  return out
}

/** Hob envelope top y (mm) at full length along its tilted axis; used for clearance checks. */
export function hobEnvelopeTopY(hobYc: number): number {
  const gamma = (HOB_LEAD_ANGLE_DEG * Math.PI) / 180
  return hobYc + (HOB_LENGTH_MM / 2) * Math.cos(gamma) + HOB_RADIUS_MM * Math.sin(gamma)
}
