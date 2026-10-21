import { expect,it } from 'vitest'
import { BoxGeometry,Group,Matrix4,Mesh,MeshStandardMaterial,PerspectiveCamera,Vector3 } from 'three'
import type { StoryRuntime } from '../inspection/story'
import { measureInstalledInspection } from './inspectionProof'
it('measures installed cutter contact in canonical study space under H',()=>{
  const root=new Group(),cutter=new Group();cutter.name='shaper-cutter';root.add(cutter)
  const disc=new Mesh(new BoxGeometry(.002,.002,.001),new MeshStandardMaterial());disc.name='shaper-cutter-disc';disc.position.set(.005,0,-.006);cutter.add(disc)
  const camera=new PerspectiveCamera(42,1.6,.001,10),target=new Vector3(0,0,-.006)
  camera.position.set(.12,.08,.2);camera.lookAt(target);camera.updateProjectionMatrix()
  const runtime={root,telemetry(){}} as unknown as StoryRuntime
  const before=measureInstalledInspection(runtime,camera)
  const h=new Matrix4().makeRotationY(.8).setPosition(.4,-.2,.3)
  root.matrixAutoUpdate=false;root.matrix.copy(h);root.matrixWorldNeedsUpdate=true
  camera.position.applyMatrix4(h);camera.up.transformDirection(h);camera.lookAt(target.applyMatrix4(h))
  const after=measureInstalledInspection(runtime,camera)
  expect(before.contactVertices).toBeGreaterThan(0)
  expect(after.contactVertices).toBe(before.contactVertices)
  expect(after.cameraClearance).toBeCloseTo(before.cameraClearance,12)
  expect(after.contactRect.left).toBeCloseTo(before.contactRect.left,12)
  expect(after.contactRect.right).toBeCloseTo(before.contactRect.right,12)
})
