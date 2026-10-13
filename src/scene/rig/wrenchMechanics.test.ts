import { describe, expect, it } from 'vitest'
import { Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three'
import type { Material } from 'three'
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
import type { StageId } from '../../data/caseStudies'
import type { WrenchRig } from './nodeRoles'
import { applyWrenchMechanics, writeWrenchMechanicsProbe } from './wrenchMechanics'
import type { WrenchMechanicsProbe } from './wrenchMechanics'

const BASE_Z = -0.06
/** The hero's proxy sweep across the gear-rotation window: 8π rad. */
const FULL_SWEEP = Math.PI * 8

interface FastenerFixture {
  group: Object3D
  dir: Vector3
  baseX: number
}

interface Fixture {
  rig: WrenchRig
  handle: Object3D
  output: Object3D
  bearing: Object3D
  clutchStatic: Object3D
  clutchSliding: Object3D
  ringSwitch: Object3D
  carriers: Record<StageId, Object3D>
  planets: Record<StageId, Object3D[]>
  fasteners: FastenerFixture[]
}

/** Real three.js nodes with measured-style base positions — no GLB, no GPU. */
function makeFixture(): Fixture {
  const basePositions = new Map<Object3D, Vector3>()
  const register = (x: number, y: number, z: number): Object3D => {
    const node = new Object3D()
    node.position.set(x, y, z)
    basePositions.set(node, new Vector3(x, y, z))
    return node
  }

  const carriers = {} as Record<StageId, Object3D>
  const planets = {} as Record<StageId, Object3D[]>
  const stages = {} as WrenchRig['stages']
  for (const id of STAGE_IDS) {
    const carrier = register(0, 0, BASE_Z)
    const planetA = register(0.01, 0, BASE_Z)
    const planetB = register(-0.01, 0, BASE_Z)
    carriers[id] = carrier
    planets[id] = [planetA, planetB]
    stages[id] = { carrier, planets: [planetA, planetB] }
  }

  const fasteners: FastenerFixture[] = [
    { group: register(0.0323, 0, BASE_Z), dir: new Vector3(1, 0, 0), baseX: 0.0323 },
    { group: register(-0.0323, 0, BASE_Z), dir: new Vector3(-1, 0, 0), baseX: -0.0323 },
  ]

  const ghostMaterials = new Map<Mesh, Material>()
  ghostMaterials.set(new Mesh(), new MeshBasicMaterial())

  const rig = {
    handleRoot: register(0, 0, BASE_Z),
    gearboxRoot: null,
    housing: null,
    outputShaft: register(0, 0, 0.02),
    bearing: register(0, 0, BASE_Z),
    clutch: {
      static: register(0, 0, BASE_Z),
      sliding: register(0, 0, BASE_Z),
      ringSwitch: register(0, 0, BASE_Z),
    },
    stages,
    gbFasteners: fasteners,
    lcdCluster: null,
    meshes: [],
    originalMaterials: new Map<Mesh, Material>(),
    ghostMaterials,
    basePositions,
    sweepMin: -0.2,
    sweepMax: 0.05,
    center: new Vector3(),
  } as unknown as WrenchRig

  return {
    rig,
    handle: rig.handleRoot as Object3D,
    output: rig.outputShaft as Object3D,
    bearing: rig.bearing as Object3D,
    clutchStatic: rig.clutch.static as Object3D,
    clutchSliding: rig.clutch.sliding as Object3D,
    ringSwitch: rig.clutch.ringSwitch as Object3D,
    carriers,
    planets,
    fasteners,
  }
}

describe('wrenchMechanics', () => {
  it('rest frame returns every animated unit to its base after a full excursion', () => {
    const fx = makeFixture()
    applyWrenchMechanics(fx.rig, { shift: 1, explode: 1, gearAngle: FULL_SWEEP, idle: 0.2 })
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 0, gearAngle: 0, idle: 0 })
    expect(fx.handle.position.z).toBe(BASE_Z)
    expect(fx.output.position.z).toBe(0.02)
    expect(fx.bearing.position.z).toBe(BASE_Z)
    expect(fx.clutchStatic.position.z).toBe(BASE_Z)
    expect(fx.clutchSliding.position.z).toBe(BASE_Z)
    expect(fx.ringSwitch.position.z).toBe(BASE_Z)
    expect(fx.ringSwitch.rotation.z).toBe(0)
    for (const id of STAGE_IDS) {
      expect(fx.carriers[id].position.z).toBe(BASE_Z)
      expect(fx.carriers[id].rotation.z).toBe(0)
      for (const planet of fx.planets[id]) expect(planet.rotation.z).toBeCloseTo(0, 12)
    }
    for (const fastener of fx.fasteners) {
      expect(fastener.group.position.x).toBe(fastener.baseX)
      expect(fastener.group.position.y).toBe(0)
      expect(fastener.group.position.z).toBe(BASE_Z)
    }
  })

  it('interior sample halves the ladder with partial shift and the pop already complete', () => {
    const fx = makeFixture()
    applyWrenchMechanics(fx.rig, { shift: 0.5, explode: 0.5, gearAngle: 0, idle: 0 })
    expect(fx.output.position.z).toBeCloseTo(0.02 + EXPLODE_OFFSETS.output * 0.5, 15)
    for (const id of STAGE_IDS) {
      expect(fx.carriers[id].position.z).toBeCloseTo(BASE_Z + EXPLODE_OFFSETS[id] * 0.5, 15)
    }
    expect(fx.bearing.position.z).toBeCloseTo(BASE_Z + EXPLODE_OFFSETS.bearing * 0.5, 15)
    expect(fx.clutchStatic.position.z).toBeCloseTo(BASE_Z + EXPLODE_OFFSETS.clutch * 0.5, 15)
    // Fork train rides the clutch explosion plus its own −Z travel.
    expect(fx.clutchSliding.position.z).toBeCloseTo(
      BASE_Z + EXPLODE_OFFSETS.clutch * 0.5 + 0.5 * CLUTCH_SHIFT_DISTANCE,
      15,
    )
    // Ring switch rides the clutch plus its own +Z travel and positive rotation.
    expect(fx.ringSwitch.position.z).toBeCloseTo(
      BASE_Z + EXPLODE_OFFSETS.clutch * 0.5 + 0.5 * RING_SWITCH_TRAVEL_Z,
      15,
    )
    expect(fx.ringSwitch.rotation.z).toBeCloseTo(0.5 * RING_SWITCH_ROTATION, 15)
    // The radial pop leads the rear ladder: complete at explode 0.5 > 0.35.
    expect(fx.fasteners[0].group.position.x).toBeCloseTo(0.0323 + GB_FASTENER_POP_M, 14)
  })

  it('full explode lands the measured rear-extraction ladder with ≥15 mm gaps', () => {
    const fx = makeFixture()
    applyWrenchMechanics(fx.rig, { shift: 1, explode: 1, gearAngle: 0, idle: 0 })
    // Measured pass-3 ladder (rig skill / caseStudies): the output exits +Z
    // through the snout, then the driveline order rearward, handle furthest.
    expect(EXPLODE_OFFSETS).toEqual({
      output: 0.05,
      stage4: -0.099,
      stage3: -0.142,
      stage5: -0.177,
      bearing: -0.197,
      stage2: -0.23,
      stage1: -0.255,
      clutch: -0.291,
      handle: -0.354,
    })
    expect(fx.output.position.z).toBeCloseTo(0.02 + 0.05, 15)
    expect(fx.carriers.stage4.position.z).toBeCloseTo(BASE_Z - 0.099, 15)
    expect(fx.carriers.stage3.position.z).toBeCloseTo(BASE_Z - 0.142, 15)
    expect(fx.carriers.stage5.position.z).toBeCloseTo(BASE_Z - 0.177, 15)
    expect(fx.bearing.position.z).toBeCloseTo(BASE_Z - 0.197, 15)
    expect(fx.carriers.stage2.position.z).toBeCloseTo(BASE_Z - 0.23, 15)
    expect(fx.carriers.stage1.position.z).toBeCloseTo(BASE_Z - 0.255, 15)
    expect(fx.clutchStatic.position.z).toBeCloseTo(BASE_Z - 0.291, 15)
    expect(fx.handle.position.z).toBeCloseTo(BASE_Z - 0.354, 15)
    const ladder = [
      fx.carriers.stage4,
      fx.carriers.stage3,
      fx.carriers.stage5,
      fx.bearing,
      fx.carriers.stage2,
      fx.carriers.stage1,
      fx.clutchStatic,
      fx.handle,
    ].map((node) => node.position.z)
    for (let i = 1; i < ladder.length; i += 1) {
      expect(ladder[i - 1] - ladder[i]).toBeGreaterThanOrEqual(0.015)
    }
    // Fork train rides the clutch at the endpoint too (shift=1).
    expect(fx.clutchSliding.position.z).toBeCloseTo(BASE_Z - 0.291 + CLUTCH_SHIFT_DISTANCE, 15)
  })

  it('clutch shift alone drives the fork −Z and the ring switch +Z with positive rotation', () => {
    const fx = makeFixture()
    expect(CLUTCH_SHIFT_DISTANCE).toBeLessThan(0)
    expect(RING_SWITCH_TRAVEL_Z).toBeGreaterThan(0)
    expect(RING_SWITCH_ROTATION).toBeCloseTo((2 * Math.PI) / 3, 12)
    applyWrenchMechanics(fx.rig, { shift: 1, explode: 0, gearAngle: 0, idle: 0 })
    expect(fx.clutchSliding.position.z).toBeCloseTo(BASE_Z + CLUTCH_SHIFT_DISTANCE, 15)
    expect(fx.ringSwitch.position.z).toBeCloseTo(BASE_Z + RING_SWITCH_TRAVEL_Z, 15)
    expect(fx.ringSwitch.rotation.z).toBeCloseTo(RING_SWITCH_ROTATION, 15)
    // Explosion channels stay at rest during a pure shift.
    expect(fx.handle.position.z).toBe(BASE_Z)
    expect(fx.carriers.stage1.position.z).toBe(BASE_Z)
    // Reverse to rest retraces exactly.
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 0, gearAngle: 0, idle: 0 })
    expect(fx.clutchSliding.position.z).toBe(BASE_Z)
    expect(fx.ringSwitch.position.z).toBe(BASE_Z)
    expect(fx.ringSwitch.rotation.z).toBe(0)
  })

  it('fastener pop follows the smoothstep leading edge and clamps at completion', () => {
    const fx = makeFixture()
    // Halfway along the leading edge: smoothstep(0.5) = 0.5 → half travel.
    applyWrenchMechanics(fx.rig, { shift: 0, explode: GB_FASTENER_POP_COMPLETE / 2, gearAngle: 0, idle: 0 })
    expect(fx.fasteners[0].group.position.x).toBeCloseTo(0.0323 + GB_FASTENER_POP_M * 0.5, 14)
    // Exactly at completion, and clamped beyond it.
    applyWrenchMechanics(fx.rig, { shift: 0, explode: GB_FASTENER_POP_COMPLETE, gearAngle: 0, idle: 0 })
    expect(fx.fasteners[0].group.position.x).toBeCloseTo(0.0323 + GB_FASTENER_POP_M, 14)
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 1, gearAngle: 0, idle: 0 })
    expect(fx.fasteners[0].group.position.x).toBeCloseTo(0.0323 + GB_FASTENER_POP_M, 14)
    // Radial axes only: z stays at the base, the −X bolt mirrors the pop.
    expect(fx.fasteners[0].group.position.z).toBe(BASE_Z)
    expect(fx.fasteners[1].group.position.x).toBeCloseTo(-0.0323 - GB_FASTENER_POP_M, 14)
  })

  it('gear sweep maps carriers through the JG-031 turns and counter-rotates planets', () => {
    const fx = makeFixture()
    expect(ROTATION_TURNS.stage1).toBe(8)
    expect(ROTATION_TURNS.stage2).toBe(5.2)
    expect(ROTATION_TURNS.stage5).toBe(3.38)
    expect(ROTATION_TURNS.stage3).toBe(2.2)
    expect(ROTATION_TURNS.stage4).toBe(1.43)
    expect(GEAR_RATIOS.planetMultiplier).toBe(3.5)
    // Full sweep: stage 1 carrier = 8 turns = 16π; planets = −16π × 3.5.
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 0, gearAngle: FULL_SWEEP, idle: 0 })
    for (const id of STAGE_IDS) {
      const carrierAngle = ROTATION_TURNS[id] * Math.PI * 2
      expect(fx.carriers[id].rotation.z).toBeCloseTo(carrierAngle, 12)
      for (const planet of fx.planets[id]) {
        expect(planet.rotation.z).toBeCloseTo(-carrierAngle * GEAR_RATIOS.planetMultiplier, 12)
      }
    }
    expect(fx.planets.stage1[0].rotation.z).toBeCloseTo(-56 * Math.PI, 12)
    // Quarter sweep: stage 1 carrier = 2 turns = 4π.
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 0, gearAngle: FULL_SWEEP / 4, idle: 0 })
    expect(fx.carriers.stage1.rotation.z).toBeCloseTo(4 * Math.PI, 12)
    // Caller-owned idle adds on top of the commanded sweep.
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 0, gearAngle: FULL_SWEEP / 4, idle: 0.25 })
    const forward = fx.carriers.stage1.rotation.z
    expect(forward).toBeCloseTo((0.25 + 0.25) * 8 * Math.PI * 2, 12)
    // Reverse scrub retraces the same sample exactly (no accumulated state).
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 0, gearAngle: FULL_SWEEP, idle: 0.25 })
    applyWrenchMechanics(fx.rig, { shift: 0, explode: 0, gearAngle: FULL_SWEEP / 4, idle: 0.25 })
    expect(fx.carriers.stage1.rotation.z).toBe(forward)
  })

  it('probe mirrors the legacy telemetry rig fields at matched inputs', () => {
    const fx = makeFixture()
    const frame = { shift: 0.5, explode: 0.5, gearAngle: FULL_SWEEP / 2, idle: 0 }
    applyWrenchMechanics(fx.rig, frame)
    const probe: WrenchMechanicsProbe = {
      handleZ: 0,
      outputZ: 0,
      clutchZ: 0,
      slidingZ: 0,
      stageZ: [],
      stageRot: [],
      planetRot: 0,
      gearRotation: 0,
      shift: 0,
      ghostOpacity: 0,
      ghostCount: 0,
      explodeFactor: 0,
      ringSwitchZ: 0,
      ringSwitchRotZ: 0,
    }
    writeWrenchMechanicsProbe(fx.rig, frame, 0.15, probe)
    expect(probe.handleZ).toBe(fx.handle.position.z)
    expect(probe.outputZ).toBe(fx.output.position.z)
    expect(probe.clutchZ).toBe(fx.clutchStatic.position.z)
    expect(probe.slidingZ).toBe(fx.clutchSliding.position.z)
    expect(probe.stageZ).toEqual(STAGE_IDS.map((id) => fx.carriers[id].position.z))
    expect(probe.stageRot).toEqual(STAGE_IDS.map((id) => fx.carriers[id].rotation.z))
    expect(probe.planetRot).toBe(fx.planets.stage1[0].rotation.z)
    expect(probe.gearRotation).toBe(frame.gearAngle)
    expect(probe.shift).toBe(frame.shift)
    expect(probe.ghostOpacity).toBe(0.15)
    expect(probe.ghostCount).toBe(1)
    expect(probe.explodeFactor).toBe(frame.explode)
    expect(probe.ringSwitchZ).toBe(fx.ringSwitch.position.z)
    expect(probe.ringSwitchRotZ).toBe(fx.ringSwitch.rotation.z)
    // Missing nodes mirror the legacy null-tolerant telemetry defaults.
    const bare = makeFixture()
    bare.rig.handleRoot = null
    bare.rig.clutch.ringSwitch = null
    writeWrenchMechanicsProbe(bare.rig, frame, 1, probe)
    expect(probe.handleZ).toBe(0)
    expect(probe.ringSwitchZ).toBe(0)
    expect(probe.ringSwitchRotZ).toBe(0)
  })
})
