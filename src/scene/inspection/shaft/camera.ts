/**
 * JG-035 shaft inspection camera (leaf spec: shaft-kinematics-camera-spec, 2026-10-05).
 *
 * Authored camera curves sampled from the master playhead plus the kinematics frame-follow
 * azimuth. Output is position/target/up/fov in shaft-local METRES (CAD datum: +Y shaft axis;
 * the runtime loader performs exactly one conversion to glTF -Z, never two).
 *
 * Composition law: camera machine azimuth = anchorAzimuth(t) + followAzimuth(t). During
 * shaping the follow integrates the law exactly (7*pi/16 over 2..6 s; the eased startup
 * banks only half a machining second), eases its rate to zero before the cutter edge
 * reaches the face end (by 7.2 s), and the fixed machine-frame macro
 * holds through the slow exit. The recap re-engages the same law (comparatively slow
 * apparent orbit). After 15 s the follow is frozen, so anchors are authored as machine
 * azimuths minus FOLLOW_AZIMUTH_MOD (the frozen follow, wrapped once).
 *
 * Up vector: +Y (shaft vertical) through the machining era - matching the blockout exit
 * macro whose critical ROI is taller than wide - then eases to +Z (shaft horizontal, side
 * view) for the material attempts and every later beat. Both stay non-parallel to the view
 * direction everywhere on the timeline.
 *
 * Anchors start from camera/blockout.json (desktop and 390x844) and are re-centred on the
 * certified tool positions (cutter-exit macro target balances face end 9.875, groove floor
 * 3.97 at y 10.41, groove wall 10.94 and the backed-off cutter edge). All curves are
 * closed-form smoothstep blends; no damping, no state.
 */
import { FOLLOW_MF_TOTAL, SHAFT_KINEMATICS_DURATION, FOLLOW_GAIN, followMfAt, hobYcAt } from './kinematics'
import type { ShaftKinematicsFrame } from './kinematics'

const DEG = Math.PI / 180
const MM = 1e-3
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const ease = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }

/**
 * Frozen follow azimuth wrapped to the nearest turn, so post-15 s anchors can be authored
 * as machine azimuths. The corrected total (6.2752 rad) sits just under 2*pi: wrapping it
 * into [0, 2*pi) would put the post-15 anchors a full turn away from the live pre-15 curve
 * and force the 14..15 s anchor blend through a near-full cancelled turn (C0 spike).
 */
export const FOLLOW_AZIMUTH_MOD =
  FOLLOW_GAIN * FOLLOW_MF_TOTAL - 2 * Math.PI * Math.round((FOLLOW_GAIN * FOLLOW_MF_TOTAL) / (2 * Math.PI))

/**
 * Camera azimuth (machine frame, deg) that puts the button cutter (machine azimuth MESH_AZ = 90 deg)
 * on the viewer's RIGHT at equal camera depth: camera at MESH_AZ + 90 deg. With up = +shaft axis the
 * view-right vector is azimuth (camera - 90 deg), so cutter centre and shaft axis share one depth plane
 * (zero depth difference; the owner's "side by side, same distance from the camera").
 */
export const CUTTER_VIEW_AZIMUTH_DEG = 180
/** The recap swirl (11..15 s) sweeps the camera from the cutter-right view to the settled 15 s view. */
export const RECAP_SWING_START_S = 11
export const RECAP_SWING_DEG = 200
const RECAP_MF_START = followMfAt(RECAP_SWING_START_S)

/**
 * Machining-era total camera azimuth, degrees, t < 15 s. Held exactly at the cutter-right view through the
 * isolate, shaping and slow-exit beats, then the existing recap follow profile (C1: zero rate at 11 s and
 * 15 s) carries it 200 deg to 380 deg, which is the settled materials view (20 deg + the frozen follow turn),
 * so every anchor from 15 s on is untouched and nothing snaps.
 */
export function machiningViewAzimuthDeg(t: number): number {
  if (t <= RECAP_SWING_START_S) return CUTTER_VIEW_AZIMUTH_DEG
  const g = clamp01((followMfAt(t) - RECAP_MF_START) / (FOLLOW_MF_TOTAL - RECAP_MF_START))
  return CUTTER_VIEW_AZIMUTH_DEG + RECAP_SWING_DEG * g
}

interface CameraAnchor {
  readonly t: number
  /** Machine azimuth (deg) while the follow is live (t <= 15), otherwise already compensated. */
  readonly az: number
  readonly el: number
  readonly dist: number
  readonly fovDesktop: number
  readonly fovNarrow: number
  readonly tgt: readonly [number, number, number]
  /** Narrow-layout target override (mm); falls back to tgt. */
  readonly tgtNarrow?: readonly [number, number, number]
}

/**
 * Anchored camera states. az for t >= 15 is machineAzimuth - FOLLOW_AZIMUTH_MOD in degrees.
 * Targets are shaft-local mm. Blockout starting values: overview/cutter-exit/hobbing/
 * runout-withdrawn/support (camera/blockout.json renders), re-centred as documented above.
 */
const ANCHORS: readonly CameraAnchor[] = [
  // JG-035 S1 (2026-10-07): through 2..11 s the button cutter sits viewer-RIGHT of the shaft at the
  // same depth (camera azimuth = CUTTER_VIEW_AZIMUTH_DEG, see below), so targets slide toward the
  // cutter (+Z in this frame) and the field of view widens to hold shaft and cutter edge side by
  // side in the right-hand 62% of a desktop frame (copy column ends at x 537 px). Narrow targets are
  // centred on the pair. `az` is documentary for t < 15: the machining-era azimuth is a closed-form
  // law (machiningViewAzimuthDeg), not a lerp of these rows.
  { t: 0,    az: 180,                         el: 6.3, dist: 0.24,   fovDesktop: 17,   fovNarrow: 27,   tgt: [0, 9, 0] },
  { t: 2,    az: 180,                         el: 6.2, dist: 0.2,    fovDesktop: 9.4,  fovNarrow: 17.1, tgt: [0, 7.5, -0.8], tgtNarrow: [0, 6.8, 5.5] },
  { t: 6,    az: 180,                         el: 4.6, dist: 0.2,    fovDesktop: 8.2,  fovNarrow: 15.1, tgt: [0, 6.8, -1.6], tgtNarrow: [0, 6.1, 4] },
  { t: 7.2,  az: 180,                         el: 3.2, dist: 0.2,    fovDesktop: 7.5,  fovNarrow: 13.8, tgt: [0, 9, -2.2],   tgtNarrow: [0, 8.2, 3] },
  { t: 9.7,  az: 180,                         el: 3.2, dist: 0.2,    fovDesktop: 7.5,  fovNarrow: 13.8, tgt: [0, 9, -2.2],   tgtNarrow: [0, 8.2, 3] },
  { t: 11,   az: 180,                         el: 4.2, dist: 0.2,    fovDesktop: 8.2,  fovNarrow: 15.1, tgt: [0, 7.2, -1.6], tgtNarrow: [0, 6.5, 4] },
  // Recap pull-back completes at 14 s; 14..15 s is the C1 handoff into the settled materials
  // side view, so the camera is steady before the first card is visible (15.0 s) and fully
  // readable (15.14 s). The hold runs the whole materials beat 15..22.6 s.
  // JG-035 S2: the left "Model Name: Input Shaft" block and the right FOS bar now share the frame, so the
  // framing is re-derived against those measured rects (desktop model block x57.6..397.6 / py148..246, FOS
  // bar x1342..1420 / py148..488; narrow compact block py346..392 under the card). Desktop: fov 11.4, target
  // y18.2 z-1.6 mm; narrow: the action band y3.2..14.2 mm is held between the compact block (py392) and the
  // footer top (py529.5) with fovNarrow 25.7 and tgtNarrow z 4.5 mm (>= 8 px both sides; camera.test.ts).
  { t: 14,   az: 180 + RECAP_SWING_DEG * 0.999,  el: 5,   dist: 0.26,   fovDesktop: 14.5, fovNarrow: 20,   tgt: [0, 6.5, 0] },
  { t: 15,   az: 20 - FOLLOW_AZIMUTH_MOD / DEG, el: 0.5, dist: 0.2,  fovDesktop: 11.4, fovNarrow: 25.7, tgt: [0, 18.2, -1.6], tgtNarrow: [0, 8.5, 4.5] },
  { t: 22.6, az: 20 - FOLLOW_AZIMUTH_MOD / DEG, el: 0.5, dist: 0.2,  fovDesktop: 11.4, fovNarrow: 25.7, tgt: [0, 18.2, -1.6], tgtNarrow: [0, 8.5, 4.5] },
  { t: 23.4, az: 26 - FOLLOW_AZIMUTH_MOD / DEG, el: 3,   dist: 0.2,  fovDesktop: 9.7,  fovNarrow: 15.5, tgt: [0, 11, 2.8] },
  { t: 25.4, az: 33.7 - FOLLOW_AZIMUTH_MOD / DEG, el: 5.7, dist: 0.2, fovDesktop: 9.7, fovNarrow: 16,   tgt: [0, 11, 2.8] },
  { t: 30.2, az: 33.7 - FOLLOW_AZIMUTH_MOD / DEG, el: 5.7, dist: 0.2, fovDesktop: 9.7, fovNarrow: 16,   tgt: [0, 11, 2.8] },
  { t: 31,   az: 28 - FOLLOW_AZIMUTH_MOD / DEG,   el: 4.6, dist: 0.2, fovDesktop: 8,    fovNarrow: 13.5, tgt: [0, 12.2, 1.4] },
  { t: 32,   az: 24.2 - FOLLOW_AZIMUTH_MOD / DEG, el: 4.2, dist: 0.2, fovDesktop: 6.3,  fovNarrow: 16.5, tgt: [0, 12.8, 0], tgtNarrow: [0, 8.7, 0] },
  // Final 4340 card window 33.2..35 s: card-safe runout framing, reached while no card is on
  // screen. The full revised section (axis y 3.2..20 mm, journal r 6.325 over y 9..20) stays
  // left of the desktop right 8..44% card band, clear of the model block / FOS bar, and below the narrow
  // compact FOS block (py346..392). Decoded broad y3.2..20 mm action clears both measured footers
  // (camera.test.ts, >= 8 px).
  { t: 33.2, az: 24.2 - FOLLOW_AZIMUTH_MOD / DEG, el: 4.2, dist: 0.2, fovDesktop: 13,   fovNarrow: 32.6, tgt: [0, 17.5, -4], tgtNarrow: [0, 8, 5.5] },
  { t: 35,   az: 24.2 - FOLLOW_AZIMUTH_MOD / DEG, el: 4.2, dist: 0.2, fovDesktop: 13,   fovNarrow: 32.6, tgt: [0, 17.5, -4], tgtNarrow: [0, 8, 5.5] },
  { t: 35.8, az: -FOLLOW_AZIMUTH_MOD / DEG,       el: 0,   dist: 0.2, fovDesktop: 15.3, fovNarrow: 26,   tgt: [0, 17.5, 0] },
  { t: 38.2, az: -FOLLOW_AZIMUTH_MOD / DEG,       el: 0,   dist: 0.2, fovDesktop: 15.3, fovNarrow: 26,   tgt: [0, 17.5, 0] },
  { t: 39.4, az: 10 - FOLLOW_AZIMUTH_MOD / DEG,   el: 3,   dist: 0.21, fovDesktop: 17,  fovNarrow: 26,   tgt: [0, 13.5, 0] },
  { t: 41.2, az: 12 - FOLLOW_AZIMUTH_MOD / DEG,   el: 3,   dist: 0.22, fovDesktop: 18,  fovNarrow: 26,   tgt: [0, 12, 0] },
  { t: 43,   az: 12 - FOLLOW_AZIMUTH_MOD / DEG,   el: 3,   dist: 0.22, fovDesktop: 18,  fovNarrow: 26,   tgt: [0, 12, 0] },
]

/**
 * Up-vector weight: 1 = +Y up (machining era), eased to 0 = +Z up (side views) across the
 * 14..15 s recap-to-materials handoff, settled before the first card is readable (15.14 s).
 */
const UP_Y_START = 14
const UP_Y_END = 15

export interface ShaftCameraSample {
  valid: boolean
  /** Camera position, target and up in shaft-local metres. */
  px: number
  py: number
  pz: number
  tx: number
  ty: number
  tz: number
  ux: number
  uy: number
  uz: number
  /** Vertical field of view in degrees (three.js convention). */
  fov: number
  /** Rotating-frame follow azimuth (rad) and weight, passed through for lighting. */
  followAzimuth: number
  followWeight: number
}

export function createShaftCameraSample(): ShaftCameraSample {
  return {
    valid: false,
    px: 0.24, py: 0.02, pz: 0.1,
    tx: 0, ty: 0.009, tz: 0,
    ux: 0, uy: 1, uz: 0,
    fov: 17,
    followAzimuth: 0,
    followWeight: 0,
  }
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u

/** Closed-form camera sample. Writes only into out and returns it. */
export function sampleShaftCamera(
  time: number,
  aspect: number,
  kinematics: ShaftKinematicsFrame,
  out: ShaftCameraSample,
): ShaftCameraSample {
  const t = time < 0 ? 0 : time > SHAFT_KINEMATICS_DURATION ? SHAFT_KINEMATICS_DURATION : time
  let i = 0
  while (i < ANCHORS.length - 2 && t >= ANCHORS[i + 1].t) i++
  const a = ANCHORS[i]
  const b = ANCHORS[i + 1]
  const u = ease((t - a.t) / (b.t - a.t))
  // Layout blend: 0 at 390x844-class aspects, 1 at desktop-class.
  const layout = clamp01((aspect - 0.62) / 0.4)
  const ta = a.tgtNarrow ?? a.tgt
  const tb = b.tgtNarrow ?? b.tgt
  const txMM = lerp(lerp(ta[0], a.tgt[0], layout), lerp(tb[0], b.tgt[0], layout), u)
  const tyMM = lerp(lerp(ta[1], a.tgt[1], layout), lerp(tb[1], b.tgt[1], layout), u)
  const tzMM = lerp(lerp(ta[2], a.tgt[2], layout), lerp(tb[2], b.tgt[2], layout), u)

  // Gentle target follow of the hob centre during the feed phase.
  let hobFollow = 0
  if (t > 25.4 && t < 30.8) {
    const weight = ease((t - 25.4) / 0.5) * (1 - ease((t - 30.2) / 0.6))
    hobFollow = 0.35 * (hobYcAt(t) - 2.66495) * weight
  }

  // Before 15 s the azimuth is the closed-form machining view (the follow is already folded into it);
  // from 15 s the authored anchors carry the frozen follow turn as before.
  const az = t < 15 ? machiningViewAzimuthDeg(t) * DEG : (lerp(a.az, b.az, u) * DEG) + kinematics.followAzimuth
  const el = lerp(a.el, b.el, u) * DEG
  const dist = lerp(a.dist, b.dist, u)
  const fov = lerp(lerp(a.fovNarrow, a.fovDesktop, layout), lerp(b.fovNarrow, b.fovDesktop, layout), u)

  const tx = txMM * MM
  const ty = (tyMM + hobFollow) * MM
  const tz = tzMM * MM
  const ce = Math.cos(el)
  out.px = tx + dist * ce * Math.cos(az)
  out.py = ty + dist * Math.sin(el)
  out.pz = tz + dist * ce * Math.sin(az)
  out.tx = tx
  out.ty = ty
  out.tz = tz
  const upY = t < UP_Y_START ? 1 : t >= UP_Y_END ? 0 : 1 - ease((t - UP_Y_START) / (UP_Y_END - UP_Y_START))
  const upAngle = upY * (Math.PI / 2)
  out.ux = 0
  out.uy = Math.sin(upAngle)
  out.uz = Math.cos(upAngle)
  out.fov = fov
  out.followAzimuth = kinematics.followAzimuth
  out.followWeight = kinematics.followWeight
  out.valid = true
  return out
}

/** Follow mf re-exported for tests: the camera adds the live follow azimuth, never a second integral. */
export { followMfAt }
