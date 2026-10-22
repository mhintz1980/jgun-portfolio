import { MathUtils } from 'three'
import type { Object3D } from 'three'
import type { WrenchRig } from './nodeRoles'
import {
  CLUTCH_SHIFT_DISTANCE,
  EXPLODE_OFFSETS,
  GB_FASTENER_POP_COMPLETE,
  GB_FASTENER_POP_M,
  GEAR_RATIOS,
  RING_SWITCH_ROTATION,
  RING_SWITCH_TRAVEL_Z,
  ROTATION_TURNS,
  STAGE_IDS,
} from '../../data/caseStudies'

/**
 * M1 mechanical applicator (JG-038 Stage 3, extraction-contracts.md §3).
 *
 * Root-free transform writer for the wrench rig: clutch shift, rear
 * extraction ladder, gearbox fastener pop, and epicyclic gear rotation,
 * moved verbatim from TorqueWrenchHero.tsx (offsetZ / applyShift /
 * applyExplosion / applyGearRotation) with the rig passed explicitly instead
 * of closed over. Imports are limited to nodeRoles types, caseStudies
 * constants, and three's MathUtils — no loader, GSAP, store, telemetry,
 * drawing, inspection, ghost/material, or mode-switch logic lives here.
 * Ghost opacity and material/mode switching stay in the host; the host
 * adapter calls applyWrenchMechanics every frame with the same matched
 * inputs at the same call sites, so identical inputs produce identical
 * transforms (G3 matched-sample parity).
 */

/** Total gearRotation proxy sweep across the gear-rotation window. The
 * per-carrier DISPLAY angles come from ROTATION_TURNS (JG-031): the sweep's
 * scroll-driven shape is kept, with each carrier completing its display turns
 * (8 / 5.2 / 3.38 / 2.2 / 1.43) at ~65% speed of the previous stage. */
const GEAR_ROTATION_SWEEP = Math.PI * 8

/**
 * Owner visual correction (2026-10-21): the 9.525 mm cam-follow projection
 * exposes the machined teardrop groove beside the collar at full shift. The
 * mode change still rotates 120 degrees; the displayed axial component is
 * limited to the amount that keeps the groove covered.
 * Owner revision (2026-10-22): 0.62 stopped a hair early and showed only a thin edge of the OSHA Red band;
 * 0.76 (7.24 mm of the 9.525 mm stroke) is the owner-requested 0.74-0.78 band; confirm the cam pocket stays covered visually.
 */
export const RING_SWITCH_TRAVEL_SCALE = 0.76
export const RING_SWITCH_VISUAL_TRAVEL_Z = RING_SWITCH_TRAVEL_Z * RING_SWITCH_TRAVEL_SCALE

/** One frame of commanded wrench mechanics. */
export interface WrenchMechanicsFrame {
  /** 0..1 clutch */
  shift: number
  /** 0..1; 'exploded'-mode callers pass 1 — no hidden mode logic */
  explode: number
  /** proxy sweep angle in radians (legacy anim.gearRotation, 0..8π) */
  gearAngle: number
  /** caller-owned transient sweep addition; private canonical passes 0 */
  idle: number
}

/** Plain numeric mirror of the legacy telemetry.rig fields. */
export interface WrenchMechanicsProbe {
  handleZ: number
  outputZ: number
  clutchZ: number
  slidingZ: number
  stageZ: number[]
  stageRot: number[]
  planetRot: number
  gearRotation: number
  shift: number
  ghostOpacity: number
  ghostCount: number
  explodeFactor: number
  ringSwitchZ: number
  ringSwitchRotZ: number
}

const offsetZ = (rig: WrenchRig, node: Object3D | null, offset: number): void => {
  if (!node) return
  const base = rig.basePositions.get(node)
  if (base) node.position.z = base.z + offset
}

/**
 * Shift mechanism: the fork train (shifter fork P000724, shifter cam P000297)
 * slides −Z while the ring switch assembly (P003068 knurled ring, 3× P000464
 * pins, 3× K000156 ball plungers) follows the cam groove in P000420 — traveling
 * +Z (away from handle) and rotating +120° (CCW when viewed from rear).
 * Called every frame from the host's useFrame with the current shift value (0→1).
 */
const applyShift = (rig: WrenchRig, shift: number): void => {
  // Fork train — slides toward handle (−Z)
  offsetZ(rig, rig.clutch.sliding, shift * CLUTCH_SHIFT_DISTANCE)
  // Ring switch — travels +Z along cam groove with simultaneous positive rotation
  const rs = rig.clutch.ringSwitch
  if (rs) {
    const base = rig.basePositions.get(rs)
    if (base) {
      rs.position.z = base.z + shift * RING_SWITCH_VISUAL_TRAVEL_Z
      rs.rotation.z = +shift * RING_SWITCH_ROTATION  // +Z travel = positive rotation
    }
  }
}

/** Rear extraction + snout exit, driven by the explode factor 0..1. */
const applyExplosion = (rig: WrenchRig, explode: number, shift: number): void => {
  offsetZ(rig, rig.outputShaft, EXPLODE_OFFSETS.output * explode)
  for (const id of STAGE_IDS) {
    offsetZ(rig, rig.stages[id].carrier, EXPLODE_OFFSETS[id] * explode)
  }
  // K000004 bearing ring parks between A000606 (stage 5) and stage 2.
  offsetZ(rig, rig.bearing, EXPLODE_OFFSETS.bearing * explode)
  offsetZ(rig, rig.clutch.static, EXPLODE_OFFSETS.clutch * explode)
  // Fork train rides the clutch explosion offset plus its own shift travel
  offsetZ(rig, rig.clutch.sliding, EXPLODE_OFFSETS.clutch * explode + shift * CLUTCH_SHIFT_DISTANCE)
  // Ring switch also rides the clutch explosion, plus its own cam travel
  const rs = rig.clutch.ringSwitch
  if (rs) {
    const base = rig.basePositions.get(rs)
    if (base) {
      rs.position.z = base.z + EXPLODE_OFFSETS.clutch * explode + shift * RING_SWITCH_VISUAL_TRAVEL_Z
      rs.rotation.z = +shift * RING_SWITCH_ROTATION
    }
  }
  offsetZ(rig, rig.handleRoot, EXPLODE_OFFSETS.handle * explode)
  // Gearbox radial bolts (90910A815): pop outward along their own radial
  // axes on the explode's LEADING edge (fully out by
  // GB_FASTENER_POP_COMPLETE, ahead of the rear extraction), then ride the
  // clutch — their groups are clutch-static children, so the offsetZ above
  // already carries them.
  for (const f of rig.gbFasteners) {
    const base = rig.basePositions.get(f.group)
    if (!base) continue
    const t = MathUtils.clamp(explode / GB_FASTENER_POP_COMPLETE, 0, 1)
    const pop = GB_FASTENER_POP_M * t * t * (3 - 2 * t)
    f.group.position.set(base.x + f.dir.x * pop, base.y + f.dir.y * pop, base.z)
  }
}

/**
 * Epicyclic rotation: each carrier turns about the gear-train axis while
 * each planet counter-rotates on its own pin (planet groups are carrier
 * children, so they also revolve with it). JG-031 display turns: the proxy
 * sweep is normalized 0..1 and remapped through ROTATION_TURNS mapped to the
 * physical driveline order from motor to snout (stage1: 8.0 → stage2: 5.2 →
 * stage5 [A000606]: 3.38 → stage3: 2.20 → stage4: 1.43), so each successive
 * physical cage spins at ~65% of the preceding cage's speed. This provides
 * strictly monotonic reduction across the physical visual assembly and clear,
 * perceptible motion even during fast scroll scrub. GEAR_RATIOS keeps the
 * kinematic reference, and planets stay pegged to their carrier's display angle
 * via the multiplier.
 *
 * Continuous Kinematic Idling (Milestone 4):
 * When scroll pauses during CH.02 explosion range, idle rotation accumulates
 * delta-time at a rate proportional to each stage's ROTATION_TURNS and blends
 * seamlessly with scroll-driven sweep without pops or jumps.
 */
const applyGearRotation = (rig: WrenchRig, angle: number, idle: number = 0): void => {
  const sweep = angle / GEAR_ROTATION_SWEEP
  for (const id of STAGE_IDS) {
    const stage = rig.stages[id]
    const turns = ROTATION_TURNS[id]
    const carrierAngle = (sweep + idle) * turns * Math.PI * 2
    if (stage.carrier) stage.carrier.rotation.z = carrierAngle
    const planetAngle = -carrierAngle * GEAR_RATIOS.planetMultiplier
    for (const planet of stage.planets) planet.rotation.z = planetAngle
  }
}

/**
 * Apply one mechanics frame in the legacy hero's execution order — gear
 * rotation, then clutch shift, then rear extraction — so matched inputs
 * produce identical transforms to the pre-extraction call sequence.
 */
export function applyWrenchMechanics(rig: WrenchRig, frame: WrenchMechanicsFrame): void {
  applyGearRotation(rig, frame.gearAngle, frame.idle)
  applyShift(rig, frame.shift)
  applyExplosion(rig, frame.explode, frame.shift)
}

/**
 * Plain numeric mirror of the legacy hero's writeRigTelemetry for callers
 * without the scroll store (private runtime, proofs). Fields and the
 * null-tolerant ?? 0 reads match the legacy telemetry exactly; gearRotation,
 * shift, and explodeFactor echo the commanded frame rather than re-reading
 * nodes, exactly like the legacy anim/parameter passthroughs.
 */
export function writeWrenchMechanicsProbe(
  rig: WrenchRig,
  frame: WrenchMechanicsFrame,
  ghostOpacity: number,
  probe: WrenchMechanicsProbe,
): void {
  probe.handleZ = rig.handleRoot?.position.z ?? 0
  probe.outputZ = rig.outputShaft?.position.z ?? 0
  probe.clutchZ = rig.clutch.static?.position.z ?? 0
  probe.slidingZ = rig.clutch.sliding?.position.z ?? 0
  probe.stageZ ??= []
  probe.stageRot ??= []
  for (let i = 0; i < STAGE_IDS.length; i++) {
    const carrier = rig.stages[STAGE_IDS[i]].carrier
    probe.stageZ[i] = carrier?.position.z ?? 0
    probe.stageRot[i] = carrier?.rotation.z ?? 0
  }
  probe.planetRot = rig.stages.stage1.planets[0]?.rotation.z ?? 0
  probe.gearRotation = frame.gearAngle
  probe.shift = frame.shift
  probe.ghostOpacity = ghostOpacity
  probe.ghostCount = rig.ghostMaterials.size
  probe.explodeFactor = frame.explode
  // CR-1 ring-switch telemetry: verify +Z travel and rotation
  probe.ringSwitchZ = rig.clutch.ringSwitch?.position.z ?? 0
  probe.ringSwitchRotZ = rig.clutch.ringSwitch?.rotation.z ?? 0
}
