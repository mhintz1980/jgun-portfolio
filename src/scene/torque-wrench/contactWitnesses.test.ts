import { describe, expect, it } from 'vitest'
import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { createShaftKinematicsFrame, sampleShaftKinematics } from '../inspection/shaft/kinematics'
import { placeShaper } from '../inspection/shaft/frame'
import { buildShaperCutter } from '../inspection/shaft/tools'
import { sampleShaftSchedule, createShaftSchedule } from '../inspection/shaft/schedule'
import {
  isShaperShaftContactPoint, isShaperToolContactPoint, shaperContactRegion,
  SHAPER_WORKPIECE_BAND_MM,
} from './contactWitnesses'

describe('installed shaper engagement witnesses', () => {
  it('retains real near-side rake vertices across infeed, cutting, return and overtravel; rejects disc context', () => {
    const material = new MeshStandardMaterial(), tool = buildShaperCutter(material)
    const root = new Group(), vertex = new Vector3()
    root.add(tool.root)
    // Arbitrary host registration must disappear before predicate evaluation.
    root.position.set(.11, -.07, .23); root.rotation.set(.3, -.6, .2)
    const k = createShaftKinematicsFrame(), schedule = createShaftSchedule()
    const phases = new Set<string>()
    try {
      const disc = tool.root.getObjectByName('shaper-cutter-disc') as Mesh
      const positions = disc.geometry.getAttribute('position')
      for (const time of [2.01, 3, 3.5, 4.5, 6, 7.5, 7.8, 8.1, 8.4, 8.7, 9.1, 9.4, 10, 12, 14.9]) {
        sampleShaftKinematics(time, k); sampleShaftSchedule(time, schedule)
        expect(schedule.shaper).toBeGreaterThan(0)
        placeShaper(tool.root, k); root.updateMatrixWorld(true)
        const inverseRoot = root.matrixWorld.clone().invert(), region = shaperContactRegion(k)
        phases.add(region.phase)
        let selected = 0, rejectedBack = 0, rejectedFar = 0, invalidBack = 0, invalidFar = 0
        let nearestRakeRadius = Infinity, nearestRakeAccepted = false
        for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i).applyMatrix4(disc.matrixWorld).applyMatrix4(inverseRoot)
          const accepted = isShaperToolContactPoint(vertex, region)
          if (accepted) selected++
          // Independent installed geometry oracle: the body's rear is 8 mm behind the rake.
          if (Math.abs(vertex.z - (region.leadingZ + .008)) < 1e-8) {
            if (accepted) invalidBack++
            rejectedBack++
          }
          if (vertex.y > region.centreY + .020) { if (accepted) invalidFar++; rejectedFar++ }
          if (Math.abs(vertex.z - region.leadingZ) < 1e-8) {
            const radius = Math.hypot(vertex.x, vertex.y)
            if (radius < nearestRakeRadius) { nearestRakeRadius = radius; nearestRakeAccepted = accepted }
          }
        }
        expect(selected, `tool disappeared at ${time}s (${region.phase})`).toBeGreaterThan(0)
        expect(nearestRakeAccepted, `nearest installed rake point at ${time}s`).toBe(true)
        expect(nearestRakeRadius * 1000).toBeGreaterThanOrEqual(k.cutterRho - .0001)
        expect(nearestRakeRadius * 1000).toBeLessThan(k.cutterRho + .25)
        expect(rejectedBack).toBeGreaterThan(0); expect(rejectedFar).toBeGreaterThan(0)
        expect(invalidBack).toBe(0); expect(invalidFar).toBe(0)
        expect(selected).toBeLessThan(positions.count / 10)
      }
      expect(phases).toEqual(new Set(['approach', 'cutting', 'return', 'overtravel']))
    } finally { tool.dispose(); material.dispose() }
  })

  it('uses the authenticated source tooth/exit band, rejects hob lead-out, and keeps shaft plus tool roles distinct', () => {
    const region = shaperContactRegion(sampleShaftKinematics(7.5, createShaftKinematicsFrame()))
    expect(SHAPER_WORKPIECE_BAND_MM).toEqual([3.174827, 9.789711])
    for (const axialMm of [3.174827, 6, 9.524858, 9.789711]) {
      expect(isShaperShaftContactPoint(new Vector3(.0043, 0, -axialMm / 1000), region)).toBe(true)
    }
    for (const axialMm of [3.17, 9.80, 13.938684, 61.109647]) {
      expect(isShaperShaftContactPoint(new Vector3(.0043, 0, -axialMm / 1000), region)).toBe(false)
    }
    expect(isShaperShaftContactPoint(new Vector3(0, .03, -.006), region)).toBe(false)
    expect(isShaperToolContactPoint(new Vector3(0, region.centreY, region.leadingZ), region)).toBe(false)
    expect(isShaperToolContactPoint(new Vector3(0, region.centreY + .0307032, region.leadingZ), region)).toBe(false)
  })

  it('does not call a withdrawn rake cutting, and is inactive outside the actual shaping lifecycle', () => {
    const k = createShaftKinematicsFrame()
    expect(shaperContactRegion(sampleShaftKinematics(8.4, k)).phase).toBe('overtravel')
    for (const time of [0, 1.99, 15, 26, 40]) {
      const region = shaperContactRegion(sampleShaftKinematics(time, k))
      expect(region.phase).toBe('inactive')
      expect(isShaperShaftContactPoint(new Vector3(.005, 0, -.006), region)).toBe(false)
      expect(isShaperToolContactPoint(new Vector3(0, region.centreY - .0307032, region.leadingZ), region)).toBe(false)
    }
    expect(() => shaperContactRegion({ ...k, cutterRho: NaN })).toThrow(RangeError)
    const region = shaperContactRegion(sampleShaftKinematics(7.5, k))
    expect(isShaperToolContactPoint(new Vector3(NaN, 0, 0), region)).toBe(false)
    expect(isShaperShaftContactPoint(new Vector3(0, 0, NaN), region)).toBe(false)
  })
})
