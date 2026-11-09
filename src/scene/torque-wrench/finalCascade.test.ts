import { describe, expect, it } from 'vitest'
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three'
import type { WrenchRig } from '../rig/nodeRoles'
import {
  CASCADE_CLOCK_WINDOWS,
  cascadeProgressAtTime,
  cascadeTimeAt,
  subjectTimeAt,
  cameraTimeAt,
} from './InspectionDirector'
import { torqueScrollDistance, torqueProgressAtDistance } from './scrollPacing'
import { createShaftTakeover } from './shaftTakeover'
import { sampleFinaleAngle } from '../inspection/shaft/schedule'
import { CASCADE_ALIAS_FEATURES, featureStepPeriods } from '../inspection/shaft/cascadeConfig'
import { createShaftSchedule, sampleShaftSchedule } from '../inspection/shaft/schedule'
import { sampleMechanism, type MechanismSample } from './MechanismDirector'
import { ROTATION_TURNS } from '../../data/caseStudies'

describe('final cascade physical clock and source takeover', () => {
  it('decelerates only the final shot into a C1 hold while preserving its time and distance endpoints', () => {
    const last = CASCADE_CLOCK_WINDOWS.at(-1)!
    const width = last.end.distance - last.start.distance
    expect([last.start.time, last.end.time]).toEqual([65.4, 66.9])
    expect(last.endRate).toBe(0)
    expect(last.endShoulderDistance / width).toBeCloseTo(0.2, 12)
    expect(CASCADE_CLOCK_WINDOWS.slice(0, -1).every((w) => w.endRate > 0)).toBe(true)
    const time = (d: number) => cascadeTimeAt(torqueProgressAtDistance(d) + 0.115)
    const h = width * 1e-5
    for (const seam of [
      last.start.distance,
      last.start.distance + last.shoulderDistance,
      last.end.distance - last.endShoulderDistance,
      last.end.distance,
    ]) {
      const center = time(seam)
      const left = (3 * center - 4 * time(seam - h) + time(seam - 2 * h)) / (2 * h)
      const right = (-3 * center + 4 * time(seam + h) - time(seam + 2 * h)) / (2 * h)
      expect(Math.abs(left - right)).toBeLessThan(0.001)
      if (seam === last.end.distance) expect(Math.max(Math.abs(left), Math.abs(right))).toBeLessThan(0.001)
    }
    const rates = Array.from({ length: 11 }, (_, i) => {
      const d = last.end.distance - last.endShoulderDistance * (1 - i / 10)
      return (time(d + h) - time(d - h)) / (2 * h)
    })
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeLessThan(rates[i - 1])
    expect(time(last.start.distance)).toBeCloseTo(65.4, 10)
    expect(time(last.end.distance)).toBe(66.9)
  })

  it('redistributes the existing cascade distance toward later stages and has constant interior speed', () => {
    let total = 0,
      baselineTotal = 0
    for (const w of CASCADE_CLOCK_WINDOWS) {
      const old = w.end.baselineDistance - w.start.baselineDistance
      expect((w.end.distance - w.start.distance) / old).toBeCloseTo(1.5 * w.end.previewDistanceWeight, 5)
      total += w.end.distance - w.start.distance
      baselineTotal += old
      if (w.start.time >= 44.4 && w.end.time <= 52.2) expect(w.end.previewDistanceWeight).toBeLessThan(0.5)
      if (w.start.time >= 53.1 && w.end.time <= 64.65) expect(w.end.previewDistanceWeight).toBeGreaterThan(1)
      const speeds = []
      for (let i = 1; i < 20; i++) {
        const p = w.interiorStartProgress + ((w.interiorEndProgress - w.interiorStartProgress) * i) / 20,
          h = 1e-8
        speeds.push(
          (cascadeTimeAt(p + h) - cascadeTimeAt(p - h)) /
            (torqueScrollDistance(p + h - 0.115) - torqueScrollDistance(p - h - 0.115)),
        )
      }
      expect(Math.max(...speeds) / Math.min(...speeds)).toBeLessThan(1.3)
      for (const b of [w.start, w.end]) {
        expect(subjectTimeAt(b.progress)).toBeCloseTo(b.time, 10)
        expect(cameraTimeAt(b.progress)).toBeCloseTo(b.time, 10)
      }
    }
    expect(total).toBe(torqueScrollDistance(0.825) - torqueScrollDistance(0.815))
    expect(total).toBeCloseTo(1.5 * baselineTotal, 8)
    for (const t of [40.2, 43.5, 44.4, 52.2, 53.1, 56.4, 57, 60, 63.15, 66.9])
      expect(cascadeTimeAt(cascadeProgressAtTime(t))).toBeCloseTo(t, 10)
  })

  it('transfers the unwrapped phase and holds it through forward, reverse and arbitrary seeks', () => {
    const stages = Object.fromEntries(
      ['stage1', 'stage2', 'stage5', 'stage3', 'stage4'].map((id) => [
        id,
        { carrier: new Group(), planets: [new Group(), new Group()] },
      ]),
    )
    const geometry = new BoxGeometry(),
      material = new MeshBasicMaterial(),
      shaft = new Mesh(geometry, material)
    shaft.userData.partNumber = 'P001835'
    const output = new Group(),
      apply = createShaftTakeover({ stages, meshes: [shaft], outputShaft: output } as unknown as WrenchRig)
    const pose = (p: number, angle?: number) => {
      apply(p, angle)
      return [
        shaft.rotation.z,
        output.rotation.z,
        ...Object.values(stages).flatMap((s) => [s.carrier.rotation.z, ...s.planets.map((p) => p.rotation.z)]),
      ]
    }
    const final = pose(0.825),
      phase = sampleFinaleAngle(66.9)
    expect(final[1]).toBeCloseTo(-phase * 0.0016, 12)
    expect(final[0] - final[2] * 5.2).toBeCloseTo((3 * 2 * Math.PI) / 10, 10)
    for (const p of [0.844999, 0.845, 0.845001, 0.855, 0.9, 0.98, 1, 0.9, 0.83, 0.825]) expect(pose(p)).toEqual(final)
    const points = [0.62, 0.7, 0.8, 0.82, 0.825, 0.845, 1],
      expected = points.map((p) => pose(p))
    for (const i of [6, 2, 1, 5, 0, 4, 3]) expect(pose(points[i])).toEqual(expected[i])
    const anchor = sampleMechanism(0.56, {} as MechanismSample).gearAngle
    for (const angle of [anchor, anchor + 1, anchor + 3, anchor + 1]) {
      const display = pose(0.9, angle)
      for (const [i, id] of ['stage1', 'stage2', 'stage5', 'stage3', 'stage4'].entries())
        expect(display[2 + 3 * i] - final[2 + 3 * i]).toBeCloseTo(
          ((angle - anchor) * ROTATION_TURNS[id as keyof typeof ROTATION_TURNS]) / 4,
          10,
        )
    }
    // Recreating the host must reuse immutable rig-rest angles, not a pose
    // left by the previous host. Cover both input and the split retaining ring.
    const ring = new Mesh(geometry, material)
    ring.userData.partNumber = 'K000211'
    const cached = { stages, meshes: [shaft, ring], outputShaft: output } as unknown as WrenchRig
    apply(0.825)
    const hostA = createShaftTakeover(cached)
    hostA(0.825)
    const expectedRemount = [shaft.rotation.z, ring.rotation.z]
    const hostB = createShaftTakeover(cached)
    hostB(0.825)
    expect([shaft.rotation.z, ring.rotation.z]).toEqual(expectedRemount)
    expect(shaft.rotation.z).toBe(final[0])
    hostB(0)
    expect([shaft.rotation.z, ring.rotation.z]).toEqual([0, 0])
    hostB(0.825)
    expect([shaft.rotation.z, ring.rotation.z]).toEqual(expectedRemount)
    geometry.dispose()
    material.dispose()
  })

  it('retains the input shaft while retiring the upstream planet and carrier', () => {
    const s = createShaftSchedule()
    for (const [t, input, planet, cage] of [
      [52.2, 1, 1, 1],
      [52.65, 1, 0.5, 1],
      [53.1, 1, 0, 1],
      [56.4, 1, 0, 1],
      [61.5, 1, 0, 1],
      [61.875, 1, 0, 0.5],
      [62.25, 1, 0, 0],
    ]) {
      sampleShaftSchedule(t, s)
      expect(s.approvedShaft).toBeCloseTo(input, 12)
      expect(s.cascadePlanetAlpha[0]).toBeCloseTo(planet, 12)
      expect(s.cascadeAlpha[0]).toBeCloseTo(cage, 12)
      expect(s.finaleAngle).toBe(sampleFinaleAngle(t))
    }
    const expected = [52.2, 52.65, 53.1, 55.95, 56.4, 66.9].map((t) => JSON.stringify(sampleShaftSchedule(t, s)))
    for (const i of [5, 4, 0, 2, 3, 1])
      expect(JSON.stringify(sampleShaftSchedule([52.2, 52.65, 53.1, 55.95, 56.4, 66.9][i], s))).toBe(expected[i])
  })

  it('uses complete feature periods rather than a universal input RPM cap', () => {
    const degrees = Math.PI / 180
    expect(featureStepPeriods((90 * degrees) / 60, CASCADE_ALIAS_FEATURES[0])).toBeCloseTo(0.2166666667, 8)
    expect(featureStepPeriods((270 * degrees) / 60, CASCADE_ALIAS_FEATURES[0])).toBeGreaterThan(0.35)
    expect(featureStepPeriods((270 * degrees) / 60, CASCADE_ALIAS_FEATURES[1])).toBeGreaterThan(0.35)
    expect(featureStepPeriods((420 * degrees) / 60, CASCADE_ALIAS_FEATURES[2])).toBeGreaterThan(0.35)
    expect(featureStepPeriods((1000 * degrees) / 60, CASCADE_ALIAS_FEATURES[3])).toBeGreaterThan(0.35)
  })
})
