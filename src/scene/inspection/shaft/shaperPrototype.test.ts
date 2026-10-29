import { Box3, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import outline from './cutterOutline.json'
import {
  CUTTER_ORBIT_M, CUTTER_RATE, INFEED_END_M, MACHINING_AT_SLOW_MID, WORK_RATE, infeedRhoAt, machiningTimeAt,
  sampleShaftKinematics, createShaftKinematicsFrame, SHAFT_KINEMATICS_DURATION, CUTTER_TIP_RHO_MM,
} from './kinematics'
import { SHAFT_ROOT_MM } from './progression'
import { buildShaperCutter } from './tools'
import {
  CLEARANCE_V4_SHAPER, SHAPER_BORE_RADIUS_MM, SHAPER_CENTRE_DISTANCE_MM, SHAPER_MODULE_MM, SHAPER_MOUNT_MAX_RADIUS_MM,
  SHAPER_PILOT_RADIUS_MM, SHAPER_PITCH_RADIUS_MM, SHAPER_PROTOTYPE, SHAPER_ROOT_LIMIT_MM, SHAPER_SIGNED_RATIO,
  SHAPER_STOCK_MM, SHAPER_TEETH, SHAPER_THICKNESS_MM, SHAPER_TIP_RADIUS_MM, SHAPER_WORK_PITCH_RADIUS_MM,
  SHAPER_WORK_ROOT_RADIUS_MM, SHAPER_WORK_TEETH, SHAPER_WORK_TIP_RADIUS_MM, SHAPER_ROOT_CLEARANCE_MM,
  SHAPER_ARBOR_EXTENSION_MM, SHAPER_LEADING_FACE_Y_MM, SHAPER_BODY_REAR_Y_MM,
} from './toolSpec'

/** Coherence of the 60-tooth illustrative derived prototype; makes no manufacturing claim. */
describe('60-tooth shaper prototype: geometry', () => {
  it('derives pitch radii, centre distance, ratio, tip and root limits from one module', () => {
    expect(SHAPER_TEETH).toBe(60)
    expect(SHAPER_WORK_PITCH_RADIUS_MM).toBe(5)
    expect(SHAPER_PITCH_RADIUS_MM).toBe(30)
    expect(SHAPER_CENTRE_DISTANCE_MM).toBe(SHAPER_WORK_PITCH_RADIUS_MM + SHAPER_PITCH_RADIUS_MM)
    expect(SHAPER_SIGNED_RATIO).toBe(-SHAPER_TEETH / SHAPER_WORK_TEETH)
    expect(SHAPER_SIGNED_RATIO).toBe(-SHAPER_PITCH_RADIUS_MM / SHAPER_WORK_PITCH_RADIUS_MM)
    expect(SHAPER_TIP_RADIUS_MM).toBeCloseTo(SHAPER_CENTRE_DISTANCE_MM - SHAPER_WORK_ROOT_RADIUS_MM - SHAPER_STOCK_MM, 9)
    expect(SHAPER_ROOT_LIMIT_MM).toBeCloseTo(SHAPER_CENTRE_DISTANCE_MM - SHAPER_WORK_TIP_RADIUS_MM - SHAPER_ROOT_CLEARANCE_MM, 9)
    // The kinematic cutter-tip clearance matches the work root plus stock.
    expect(SHAPER_CENTRE_DISTANCE_MM - SHAPER_TIP_RADIUS_MM).toBeCloseTo(SHAFT_ROOT_MM + SHAPER_STOCK_MM, 4)
    // Circular pitch is shared by both gears: pi * module.
    const pitch = Math.PI * SHAPER_MODULE_MM
    expect(2 * Math.PI * SHAPER_PITCH_RADIUS_MM / SHAPER_TEETH).toBeCloseTo(pitch, 12)
    expect(2 * Math.PI * SHAPER_WORK_PITCH_RADIUS_MM / SHAPER_WORK_TEETH).toBeCloseTo(pitch, 12)
  })
  it('keeps the certified 20-tooth values only as the frozen historical record', () => {
    expect(CLEARANCE_V4_SHAPER).toMatchObject({ teeth: 20, centreDistanceMm: 15.5, signedRatio: -2, tipRadiusMm: 11.2032 })
    expect(SHAPER_PROTOTYPE).toMatchObject({ status: 'illustrative-derived-prototype', ownerGeometryApproved: false, manufacturingAcceptance: false })
  })
  it('ships an outline whose one tooth spans exactly 360/60 degrees inside the derived radii', () => {
    expect(outline.parameters.cutter_teeth).toBe(SHAPER_TEETH)
    expect(outline.tooth.angle_span_deg).toBe(6)
    expect(outline.tooth.point_count).toBe(120)
    expect(outline.tooth.max_radius_mm).toBeLessThanOrEqual(SHAPER_TIP_RADIUS_MM)
    expect(outline.tooth.min_radius_mm).toBeGreaterThanOrEqual(SHAPER_ROOT_LIMIT_MM)
    expect(outline.prototype.cutter_pitch_radius_mm).toBe(SHAPER_PITCH_RADIUS_MM)
    // Crest is much closer to the tip limit than the root: the tooth is a real conjugate tooth, not a flat ring.
    expect(outline.tooth.max_radius_mm).toBeGreaterThan(SHAPER_TIP_RADIUS_MM - 0.01)
    expect(outline.tooth.min_radius_mm).toBeLessThan(SHAPER_PITCH_RADIUS_MM)
  })
})

describe('60-tooth shaper prototype: kinematics', () => {
  it('preserves the work angle law and derives the cutter angle from the ratio', () => {
    expect(WORK_RATE).toBeCloseTo(-Math.PI, 12)
    expect(CUTTER_RATE).toBeCloseTo(Math.PI / 6, 12)
    expect(CUTTER_ORBIT_M).toBeCloseTo(12, 12)
    const frame = createShaftKinematicsFrame()
    for (const t of [2.5, 4, 8.4, 12.5, 14.9]) {
      sampleShaftKinematics(t, frame)
      const m = machiningTimeAt(t)
      expect(frame.workPhi).toBeCloseTo(WORK_RATE * m, 9)
      expect(frame.cutterPhi).toBeCloseTo(-frame.workPhi / 6, 12)
      expect(frame.workPhi).toBeCloseTo(SHAPER_SIGNED_RATIO * frame.cutterPhi, 12)
    }
    // Rolling contact: pitch-point surface speeds match (work 5 mm and cutter 30 mm pitch radii).
    expect(Math.abs(SHAPER_WORK_PITCH_RADIUS_MM * WORK_RATE + SHAPER_PITCH_RADIUS_MM * CUTTER_RATE)).toBeLessThan(1e-12)
  })
  it('keeps the .10 clock, infeed timing and slow-window stroke phasing unchanged', () => {
    expect(INFEED_END_M).toBe(1)
    expect(infeedRhoAt(INFEED_END_M)).toBeCloseTo(CUTTER_TIP_RHO_MM, 12)
    expect(infeedRhoAt(0.5)).toBeGreaterThan(CUTTER_TIP_RHO_MM)
    const frame = createShaftKinematicsFrame()
    sampleShaftKinematics(8.4, frame)
    expect(frame.machining).toBeCloseTo(MACHINING_AT_SLOW_MID, 9)
    expect(frame.strokePhase).toBeCloseTo(0.5, 9)
    expect(SHAFT_KINEMATICS_DURATION).toBe(66.9)
  })
})

describe('60-tooth shaper prototype: sketch mount', () => {
  it('builds a connected load path: shoulder behind the disc, pilot through the bore, flange and nut in front', () => {
    const material = new MeshStandardMaterial()
    const cutter = buildShaperCutter(material)
    const box = (name: string) => {
      const mesh = cutter.root.getObjectByName(name) as Mesh
      expect(mesh, name).toBeTruthy()
      return new Box3().setFromObject(mesh)
    }
    const mm = (v: number) => v * 1000
    const disc = box('shaper-cutter-disc'), hub = box('shaper-hub'), arbor = box('shaper-arbor')
    const flange = box('shaper-clamp-flange'), nut = box('shaper-clamp-nut'), stud = box('shaper-stud')
    const adapter = box('shaper-adapter-flange'), taper = box('shaper-adapter-taper'), thread = box('shaper-stud-thread')
    const shank=box('shaper-arbor-shank')
    expect(mm(shank.max.y)).toBeCloseTo(mm(taper.min.y),5)
    expect(mm(shank.max.y-shank.min.y)).toBeCloseTo(4.5*25.4,4)
    expect(SHAPER_ARBOR_EXTENSION_MM).toBe(114.3)
    // Axial order along -Y -> +Y: taper, adapter flange, shoulder, disc, clamping flange, nut.
    expect(mm(taper.max.y)).toBeCloseTo(mm(adapter.min.y), 6)
    expect(mm(adapter.max.y)).toBeCloseTo(mm(hub.min.y), 6)
    expect(mm(hub.max.y)).toBeCloseTo(mm(disc.min.y), 6)
    expect(mm(flange.min.y)).toBeCloseTo(mm(disc.max.y), 6)
    expect(mm(nut.min.y)).toBeCloseTo(mm(flange.max.y), 6)
    // Pilot arbor spans shoulder -> flange, so it crosses the whole disc thickness.
    expect(mm(arbor.min.y)).toBeLessThan(mm(disc.min.y))
    expect(mm(arbor.max.y)).toBeGreaterThan(mm(disc.max.y))
    expect(mm(arbor.max.y)).toBeLessThan(mm(flange.max.y))
    // Bore and pilot share one radius; a real hole exists in the disc.
    expect((arbor.max.x - arbor.min.x) * 500).toBeCloseTo(SHAPER_PILOT_RADIUS_MM, 5)
    expect(SHAPER_PILOT_RADIUS_MM).toBe(SHAPER_BORE_RADIUS_MM)
    const discMesh = cutter.root.getObjectByName('shaper-cutter-disc') as Mesh
    const position = discMesh.geometry.getAttribute('position')
    const v = new Vector3()
    let innermost = Infinity
    for (let i = 0; i < position.count; i++) { v.fromBufferAttribute(position, i); innermost = Math.min(innermost, Math.hypot(v.x, v.z)) }
    expect(mm(innermost)).toBeCloseTo(SHAPER_BORE_RADIUS_MM, 3)
    // Stud and thread sit proud of the nut so the nut visibly retains them.
    expect(mm(stud.max.y)).toBeGreaterThan(mm(nut.max.y))
    expect(mm(thread.max.y)).toBeGreaterThan(mm(nut.max.y))
    // Nothing in the mount reaches the work: mount radius stays far inside the centre distance.
    let mountRadius = 0
    for (const b of [hub, arbor, flange, nut, stud, adapter, taper, thread,shank]) {
      mountRadius = Math.max(mountRadius, mm(Math.max(Math.abs(b.min.x), Math.abs(b.max.x), Math.abs(b.min.z), Math.abs(b.max.z))))
    }
    expect(mountRadius).toBeLessThanOrEqual(SHAPER_MOUNT_MAX_RADIUS_MM + 1e-6)
    expect(SHAPER_CENTRE_DISTANCE_MM - SHAPER_MOUNT_MAX_RADIUS_MM).toBeGreaterThanOrEqual(20)
    // Disc envelope is the derived crest radius.
    expect(mm(Math.max(disc.max.x, disc.max.z))).toBeLessThanOrEqual(SHAPER_TIP_RADIUS_MM + 1e-6)
    expect(mm(disc.max.y - disc.min.y)).toBeCloseTo(SHAPER_THICKNESS_MM, 6)
    expect(mm(disc.min.y)).toBeCloseTo(SHAPER_BODY_REAR_Y_MM,5)
    expect(mm(disc.max.y)).toBeCloseTo(SHAPER_LEADING_FACE_Y_MM,5)
    expect(SHAPER_THICKNESS_MM/(2*SHAPER_TIP_RADIUS_MM)).toBeGreaterThan(.12)
    expect(SHAPER_THICKNESS_MM/(2*SHAPER_TIP_RADIUS_MM)).toBeLessThan(.14)
    // Physical rake-face/adjacent groove relation is independent of body thickness.
    const k=createShaftKinematicsFrame()
    for(const t of [2,3.5,6,8.4,10,12,14.9]){
      sampleShaftKinematics(t,k)
      expect(k.strokeCentreY+mm(disc.max.y)).toBeCloseTo(k.edgeY,5)
      expect(k.strokeCentreY+mm(disc.max.y)).toBeLessThan(10.94-.5)
    }
    cutter.dispose()
    material.dispose()
  })
  it('sweeps a true helix: the thread ridge advances one pitch per turn', () => {
    const material = new MeshStandardMaterial()
    const cutter = buildShaperCutter(material)
    const mesh = cutter.root.getObjectByName('shaper-stud-thread') as Mesh
    const p = mesh.geometry.getAttribute('position')
    const angle = (i: number) => Math.atan2(-p.getZ(i), p.getX(i))
    // Vertex 2 of each ring is crest-high. Over the whole sweep, axial advance / pitch must equal
    // the accumulated angle / 2 pi: that is the definition of a helix of that pitch.
    const a = 2, b = p.count - 2
    const dy = (p.getY(b) - p.getY(a)) * 1000
    const turns = dy / 1.75
    expect(turns).toBeGreaterThan(1.5)
    let dTheta = angle(b) - angle(a)
    dTheta = ((dTheta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const expected = (turns - Math.floor(turns)) * 2 * Math.PI
    const err = Math.abs(dTheta - expected)
    expect(Math.min(err, 2 * Math.PI - err)).toBeLessThan(1e-4)
    cutter.dispose()
    material.dispose()
  })
})
