import { expect,it } from 'vitest'
import { BoxGeometry,Group,Matrix4,Mesh,MeshStandardMaterial,Plane,Vector3 } from 'three'
import { narrativeModelToStudy } from '../inspection/shaft/frame'
import { createJourneyPlanes,measureShaftDisplacement,measureShaftLandmarks,registerShaft } from './shaftJourneyRegistration'
it('registers landmarks with nonidentity extraction, centering and measured displacement',()=>{
  const model=new Group(),parent=new Group();model.add(parent)
  model.position.set(.3,-.1,.4);model.rotation.x=.4;parent.position.z=.012;model.updateMatrixWorld(true)
  const rest=new Matrix4().copy(model.matrixWorld).invert().multiply(parent.matrixWorld).invert()
  parent.position.z+=.02
  const delta=measureShaftDisplacement(model,parent,rest,new Matrix4()),h=registerShaft(model.matrixWorld,delta,new Matrix4())
  for(const source of [new Vector3(),new Vector3(.02,.04,-.07)]){
    const actual=source.clone().applyMatrix4(narrativeModelToStudy(new Matrix4())).applyMatrix4(h)
    const expected=source.clone().applyMatrix4(delta).applyMatrix4(model.matrixWorld)
    expect(actual.distanceTo(expected)).toBeLessThan(1e-12)
  }
})
it('restores canonical coefficients across 200 sequential/shuffled clip transforms',()=>{
  const root=new Group(),plane=new Plane(new Vector3(.3,.4,.5).normalize(),.02)
  const mat=new MeshStandardMaterial();mat.clippingPlanes=[plane];root.add(new Mesh(new BoxGeometry(),mat))
  const original=plane.clone(),control=createJourneyPlanes(),h=new Matrix4().makeRotationY(.8).setPosition(.1,.2,.3)
  for(let i=0;i<200;i++){
    const shuffled=(i*137)%200
    h.makeRotationY(shuffled*.013).setPosition(shuffled*.001,-.04,.3)
    const expected=original.clone().applyMatrix4(h)
    control.restore();control.transform(root,h)
    expect(plane.normal.distanceTo(expected.normal)).toBeLessThan(1e-12)
    expect(Math.abs(plane.constant-expected.constant)).toBeLessThan(1e-12)
  }
})

it('rejects nonuniform registration and accepts uniform extraction scale',()=>{
  expect(()=>registerShaft(new Matrix4().makeScale(1,2,1),new Matrix4(),new Matrix4())).toThrow(/uniform/)
  expect(()=>registerShaft(new Matrix4().makeScale(2,2,2),new Matrix4(),new Matrix4())).not.toThrow()
})

it('measures installed shaft datums after a nonidentity world registration',()=>{
  const root=new Group(),part=new Group();part.name='study-legacyshaft';root.add(part)
  const geometry=new BoxGeometry(.01,.01,.07),material=new MeshStandardMaterial(),source=new Mesh(geometry,material),study=new Mesh(geometry,material)
  part.add(study)
  const h=new Matrix4().makeRotationX(.5).setPosition(.3,.4,-.2)
  root.matrixAutoUpdate=false;root.matrix.copy(h);root.updateMatrixWorld(true)
  source.matrixAutoUpdate=false;source.matrix.copy(h);source.updateMatrixWorld(true)
  const proof=measureShaftLandmarks(source,root,h)
  expect(proof.axisErrorDeg).toBeLessThan(.00001)
  for(const error of proof.shafts[0].axialDatumErrorMm)expect(Math.abs(error)).toBeLessThan(1e-9)
})
