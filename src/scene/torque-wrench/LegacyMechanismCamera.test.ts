import { expect, it } from 'vitest'
import { Vector3 } from 'three'
import { LCD_ORBIT_KEYFRAMES } from '../../data/caseStudies'
import { sampleLegacyMechanismCamera } from './LegacyMechanismCamera'
import { sampleMechanism } from './MechanismDirector'
const pose = () => ({position:new Vector3(),target:new Vector3(),up:new Vector3(),fov:42,ortho:0,distance:1})
it('starts at emergence, reads both grooves and reaches the legacy rear display in the private frame',()=>{
  const first=sampleLegacyMechanismCamera(.46,1.6,0,pose())
  expect(first.position.toArray()).toEqual([.32,.16,.42])
  expect(first.target.length()).toBe(0)
  expect(sampleLegacyMechanismCamera(.48,1.6,0,pose()).fov).toBe(22)
  expect(sampleLegacyMechanismCamera(.495,1.6,0,pose()).fov).toBeLessThan(25)
  const rear=sampleLegacyMechanismCamera(.655,1.6,1,pose())
  const yaw=new Vector3(0,1,0)
  expect(rear.position.clone().applyAxisAngle(yaw,Math.PI*.85).distanceTo(new Vector3(...LCD_ORBIT_KEYFRAMES.dwell.position))).toBeLessThan(1e-9)
  const times=[.46,.478,.505,.55,.635,.65,.655,.665,.675]
  const values=times.map(p=>sampleLegacyMechanismCamera(p,1.6,1,pose()).position.toArray())
  expect(times.slice().reverse().map(p=>sampleLegacyMechanismCamera(p,1.6,1,pose()).position.toArray()).reverse()).toEqual(values)
})
it('enters the LCD arc from the complete incoming target without a cut',()=>{
  const sample=(p:number)=>sampleLegacyMechanismCamera(p,1.6,sampleMechanism(p,{shift:0,explode:0,gearAngle:0,idle:0,ghostOpacity:1}).explode,pose())
  const a=sample(.635-1e-8),b=sample(.635+1e-8)
  expect(a.target.distanceTo(b.target)).toBeLessThan(1e-6)
  expect(a.position.distanceTo(b.position)).toBeLessThan(1e-6)
})
