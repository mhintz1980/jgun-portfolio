import { expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import { measureSupportHandoff } from './supportHandoff'

it('derives the support return translation from actual vertices under registered scale/rotation', () => {
  const world = new Group(),
    study = new Group(),
    pair = new Group()
  study.position.set(0.08, -0.02, 0.17)
  study.rotation.set(0.1, 0.3, -0.2)
  study.scale.setScalar(1.3)
  world.add(study)
  pair.name = 'shaft-rigid-support-pair'
  study.add(pair)
  const geometry = new BoxGeometry(0.012, 0.01, 0.004),
    material = new MeshBasicMaterial()
  const source = ['K000210', 'K000211'].map((part, i) => {
    const original = new Mesh(geometry, material),
      clone = new Mesh(geometry, material)
    original.userData.partNumber = part
    original.position.set(0, 0, i * 0.006)
    study.add(original)
    clone.position.set(0, 0, i * 0.006 - 0.00275)
    pair.add(clone)
    return original
  })
  world.updateMatrixWorld(true)
  const measured = measureSupportHandoff(source, study)
  expect(measured.sourceParts).toEqual(['K000210', 'K000211'])
  expect(measured.offset[0]).toBeCloseTo(0, 12)
  expect(measured.offset[1]).toBeCloseTo(0, 12)
  expect(measured.offset[2]).toBeCloseTo(0.00275, 12)
  expect(measured.sourceSize).toEqual(measured.privateSize.map((v, i) => expect.closeTo(v, i === 2 ? 10 : 12)))
  pair.position.fromArray(measured.offset)
  expect(measureSupportHandoff(source, study).distance).toBeLessThan(1e-12)
  expect(() => measureSupportHandoff(source.slice(0, 1), study)).toThrow(/Both authenticated/)
  geometry.dispose()
  material.dispose()
})
