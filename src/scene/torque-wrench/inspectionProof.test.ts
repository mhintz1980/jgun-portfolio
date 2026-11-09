import { expect, it } from 'vitest'
import { BoxGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from 'three'
import type { StoryRuntime } from '../inspection/story'
import { measureInstalledInspection, measureStage1Contact } from './inspectionProof'
it('measures installed cutter contact in canonical study space under H', () => {
  const root = new Group(),
    cutter = new Group()
  cutter.name = 'shaper-cutter'
  root.add(cutter)
  const disc = new Mesh(new BoxGeometry(0.002, 0.002, 0.001), new MeshStandardMaterial())
  disc.name = 'shaper-cutter-disc'
  disc.position.set(0.005, 0, -0.006)
  cutter.add(disc)
  const camera = new PerspectiveCamera(42, 1.6, 0.001, 10),
    target = new Vector3(0, 0, -0.006)
  camera.position.set(0.12, 0.08, 0.2)
  camera.lookAt(target)
  camera.updateProjectionMatrix()
  const runtime = { root, telemetry() {} } as unknown as StoryRuntime
  const before = measureInstalledInspection(runtime, camera)
  const h = new Matrix4().makeRotationY(0.8).setPosition(0.4, -0.2, 0.3)
  root.matrixAutoUpdate = false
  root.matrix.copy(h)
  root.matrixWorldNeedsUpdate = true
  camera.position.applyMatrix4(h)
  camera.up.transformDirection(h)
  camera.lookAt(target.applyMatrix4(h))
  const after = measureInstalledInspection(runtime, camera)
  expect(before.contactVertices).toBeGreaterThan(0)
  expect(after.contactVertices).toBe(before.contactVertices)
  expect(after.cameraClearance).toBeCloseTo(before.cameraClearance, 12)
  expect(after.contactRect.left).toBeCloseTo(before.contactRect.left, 12)
  expect(after.contactRect.right).toBeCloseTo(before.contactRect.right, 12)
})

it('measures actual flank size and rejects a contact hidden behind opaque geometry', () => {
  const root = new Group(),
    shaft = new Group()
  shaft.name = 'study-approvedshaft'
  root.add(shaft)
  const geometry = new BoxGeometry(0.002, 0.002, 0.006).translate(0.004, 0.003, -0.006)
  const material = new MeshStandardMaterial(),
    tooth = new Mesh(geometry, material)
  tooth.name = 'sun-flank'
  shaft.add(tooth)
  const camera = new PerspectiveCamera(12, 1.6, 0.001, 10)
  const target = new Vector3(0.004, 0.003, -0.006)
  camera.position.copy(target).add(new Vector3(0.03, 0.04, 0.02))
  camera.lookAt(target)
  camera.updateProjectionMatrix()
  const runtime = { root } as unknown as StoryRuntime
  const visible = measureStage1Contact(runtime, camera)
  expect(visible.vertices).toBeGreaterThan(0)
  expect(visible.diameterUnitHeight).toBeGreaterThan(0.1)
  expect(visible.raySamples).toBeGreaterThan(0)
  expect(visible.visibleSamples).toBeGreaterThan(0)
  const blocker = new Mesh(new BoxGeometry(0.025, 0.025, 0.025), material)
  blocker.name = 'opaque-carrier'
  blocker.position.lerpVectors(target, camera.position, 0.5)
  root.add(blocker)
  const hidden = measureStage1Contact(runtime, camera)
  expect(hidden.vertices).toBe(visible.vertices)
  expect(hidden.visibleSamples).toBe(0)
  expect(hidden.occluders['opaque-carrier']).toBe(hidden.raySamples)
  geometry.dispose()
  blocker.geometry.dispose()
  material.dispose()
})
