import { describe, expect, it } from 'vitest'
import { Matrix4, Object3D, Vector3 } from 'three'
import { STAGE_IDS } from '../../data/caseStudies'
import type { WrenchRig } from '../rig/nodeRoles'
import { applyWrenchMechanics } from '../rig/wrenchMechanics'
import { sampleMechanism } from './MechanismDirector'
import { captureCanonicalRingAnchor } from './ringAnchor'

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
    const anchors = [.655, .7, .98].map(progress => {
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
