import { describe, expect, it } from 'vitest'
import { Matrix4, Object3D, Vector3 } from 'three'
import { STAGE_IDS } from '../../data/caseStudies'
import type { WrenchRig } from '../rig/nodeRoles'
import { applyWrenchMechanics } from '../rig/wrenchMechanics'
import { sampleMechanism } from './MechanismDirector'
import { captureCanonicalRingAnchor, RING_ANCHOR_PROGRESS } from './ringAnchor'

function fixture() {
  const parent = new Object3D()
  parent.position.set(.02, -.01, .08)
  const source = new Object3D()
  source.position.set(.003, .004, -.06)
  parent.add(source)
  const rig = {
    basePositions: new Map([[source, source.position.clone()]]),
    clutch: { static: null, sliding: null, ringSwitch: source },
    stages: Object.fromEntries(STAGE_IDS.map(id => [id, { carrier: null, planets: [] }])),
    gbFasteners: [], handleRoot: null, outputShaft: null, bearing: null,
  } as unknown as WrenchRig
  return { source, rig }
}

describe('canonical ring anchor', () => {
  it('captures the same subject anchor on forward, direct and reverse-first entry', () => {
    // T5: any progress gives the same anchor because capture always resamples RING_ANCHOR_PROGRESS.
    const anchors = [.47, .48, .50, .98].map(progress => {
      const { source, rig } = fixture()
      const frame = sampleMechanism(progress, { shift: 0, explode: 0, gearAngle: 0, idle: 0, ghostOpacity: 1 })
      applyWrenchMechanics(rig, frame)
      source.updateWorldMatrix(true, true)
      const before = source.matrixWorld.clone()
      const anchor = captureCanonicalRingAnchor(rig, new Vector3(.001, -.002, .003), frame, new Matrix4())
      expect(source.matrixWorld.elements).toEqual(before.elements)
      return anchor.elements
    })
    expect(anchors[1]).toEqual(anchors[0])
    expect(anchors[2]).toEqual(anchors[0])
    expect(anchors[3]).toEqual(anchors[0])
  })

  it('keeps the anchor progress inside the study plateau (entry .469, exit .505)', () => {
    expect(RING_ANCHOR_PROGRESS).toBeGreaterThanOrEqual(.469)
    expect(RING_ANCHOR_PROGRESS).toBeLessThan(.505)
    const blank = () => ({ shift: 0, explode: 0, gearAngle: 0, idle: 0, ghostOpacity: 1 })
    const a = sampleMechanism(RING_ANCHOR_PROGRESS, blank())
    for (const p of [.469, .505]) {
      const b = sampleMechanism(p, blank())
      expect(b.shift).toBeCloseTo(a.shift, 12); expect(b.explode).toBe(0); expect(b.gearAngle).toBe(0)
    }
  })

  it('restores live mechanics if anchor capture fails', () => {
    const { source, rig } = fixture()
    const frame = sampleMechanism(.98, { shift: 0, explode: 0, gearAngle: 0, idle: 0, ghostOpacity: 1 })
    applyWrenchMechanics(rig, frame)
    source.updateWorldMatrix(true, true)
    const before = source.matrixWorld.clone()
    const out = new Matrix4()
    out.copy = () => { throw new Error('capture failed') }
    expect(() => captureCanonicalRingAnchor(rig, new Vector3(), frame, out)).toThrow('capture failed')
    expect(source.matrixWorld.elements).toEqual(before.elements)
  })
})
