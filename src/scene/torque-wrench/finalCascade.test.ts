import { describe, expect, it } from 'vitest'
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from 'three'
import type { WrenchRig } from '../rig/nodeRoles'
import { CASCADE_CLOCK_WINDOWS, cascadeProgressAtTime, cascadeTimeAt, subjectTimeAt, cameraTimeAt } from './InspectionDirector'
import { torqueScrollDistance } from './scrollPacing'
import { createShaftTakeover } from './shaftTakeover'
import { sampleFinaleAngle } from '../inspection/shaft/schedule'
import { CASCADE_ALIAS_FEATURES, featureStepPeriods } from '../inspection/shaft/cascadeConfig'
import { createShaftSchedule, sampleShaftSchedule } from '../inspection/shaft/schedule'
import { sampleMechanism, type MechanismSample } from './MechanismDirector'
import { ROTATION_TURNS } from '../../data/caseStudies'

describe('final cascade physical clock and source takeover', () => {
  it('redistributes the existing cascade distance toward later stages and has constant interior speed', () => {
    let total=0,baselineTotal=0
    for(const w of CASCADE_CLOCK_WINDOWS){
      const old=w.end.baselineDistance-w.start.baselineDistance
      expect((w.end.distance-w.start.distance)/old).toBeCloseTo(1.5*w.end.previewDistanceWeight,5)
      total+=w.end.distance-w.start.distance;baselineTotal+=old
      if(w.start.time>=44.4&&w.end.time<=52.2)expect(w.end.previewDistanceWeight).toBeLessThan(.5)
      if(w.start.time>=53.1&&w.end.time<=64.65)expect(w.end.previewDistanceWeight).toBeGreaterThan(1)
      const speeds=[]
      for(let i=1;i<20;i++){
        const p=w.interiorStartProgress+(w.interiorEndProgress-w.interiorStartProgress)*i/20,h=1e-8
        speeds.push((cascadeTimeAt(p+h)-cascadeTimeAt(p-h))/(torqueScrollDistance(p+h-.115)-torqueScrollDistance(p-h-.115)))
      }
      expect(Math.max(...speeds)/Math.min(...speeds)).toBeLessThan(1.3)
      for(const b of [w.start,w.end]){
        expect(subjectTimeAt(b.progress)).toBeCloseTo(b.time,10)
        expect(cameraTimeAt(b.progress)).toBeCloseTo(b.time,10)
      }
    }
    expect(total).toBe(torqueScrollDistance(.825)-torqueScrollDistance(.815))
    expect(total).toBeCloseTo(1.5*baselineTotal,8)
    for(const t of [40.2,43.5,44.4,52.2,53.1,56.4,57,60,63.15,66.9])expect(cascadeTimeAt(cascadeProgressAtTime(t))).toBeCloseTo(t,10)
  })

  it('transfers the unwrapped phase and holds it through forward, reverse and arbitrary seeks', () => {
    const stages=Object.fromEntries(['stage1','stage2','stage5','stage3','stage4'].map(id=>[id,{carrier:new Group(),planets:[new Group(),new Group()]}]))
    const geometry=new BoxGeometry(),material=new MeshBasicMaterial(),shaft=new Mesh(geometry,material)
    shaft.userData.partNumber='P001835'
    const output=new Group(),apply=createShaftTakeover({stages,meshes:[shaft],outputShaft:output} as unknown as WrenchRig)
    const pose=(p:number,angle?:number)=>{apply(p,angle);return [shaft.rotation.z,output.rotation.z,...Object.values(stages).flatMap(s=>[s.carrier.rotation.z,...s.planets.map(p=>p.rotation.z)])]}
    const final=pose(.825),phase=sampleFinaleAngle(66.9)
    expect(final[1]).toBeCloseTo(-phase*.0016,12)
    expect(final[0]-final[2]*5.2).toBeCloseTo(3*2*Math.PI/10,10)
    for(const p of [.844999,.845,.845001,.855,.9,.98,1,.9,.83,.825])expect(pose(p)).toEqual(final)
    const points=[.62,.7,.8,.82,.825,.845,1],expected=points.map(p=>pose(p))
    for(const i of [6,2,1,5,0,4,3])expect(pose(points[i])).toEqual(expected[i])
    const anchor=sampleMechanism(.56,{} as MechanismSample).gearAngle
    for(const angle of [anchor,anchor+1,anchor+3,anchor+1]){
      const display=pose(.9,angle)
      for(const [i,id] of ['stage1','stage2','stage5','stage3','stage4'].entries())
        expect(display[2+3*i]-final[2+3*i]).toBeCloseTo((angle-anchor)*ROTATION_TURNS[id as keyof typeof ROTATION_TURNS]/4,10)
    }
    // Recreating the host must reuse immutable rig-rest angles, not a pose
    // left by the previous host. Cover both input and the split retaining ring.
    const ring=new Mesh(geometry,material);ring.userData.partNumber='K000211'
    const cached={stages,meshes:[shaft,ring],outputShaft:output} as unknown as WrenchRig
    apply(.825)
    const hostA=createShaftTakeover(cached);hostA(.825)
    const expectedRemount=[shaft.rotation.z,ring.rotation.z]
    const hostB=createShaftTakeover(cached);hostB(.825)
    expect([shaft.rotation.z,ring.rotation.z]).toEqual(expectedRemount)
    expect(shaft.rotation.z).toBe(final[0])
    hostB(0);expect([shaft.rotation.z,ring.rotation.z]).toEqual([0,0])
    hostB(.825);expect([shaft.rotation.z,ring.rotation.z]).toEqual(expectedRemount)
    geometry.dispose();material.dispose()
  })

  it('retains the input shaft while retiring the upstream planet and carrier',()=>{
    const s=createShaftSchedule()
    for(const [t,input,planet,cage] of [[52.2,1,1,1],[52.65,1,.5,1],[53.1,1,0,1],[56.4,1,0,1],[61.5,1,0,1],[61.875,1,0,.5],[62.25,1,0,0]]){
      sampleShaftSchedule(t,s)
      expect(s.approvedShaft).toBeCloseTo(input,12)
      expect(s.cascadePlanetAlpha[0]).toBeCloseTo(planet,12)
      expect(s.cascadeAlpha[0]).toBeCloseTo(cage,12)
      expect(s.finaleAngle).toBe(sampleFinaleAngle(t))
    }
    const expected=[52.2,52.65,53.1,55.95,56.4,66.9].map(t=>JSON.stringify(sampleShaftSchedule(t,s)))
    for(const i of [5,4,0,2,3,1])expect(JSON.stringify(sampleShaftSchedule([52.2,52.65,53.1,55.95,56.4,66.9][i],s))).toBe(expected[i])
  })

  it('uses complete feature periods rather than a universal input RPM cap',()=>{
    const degrees=Math.PI/180
    expect(featureStepPeriods(90*degrees/60,CASCADE_ALIAS_FEATURES[0])).toBeCloseTo(.2166666667,8)
    expect(featureStepPeriods(270*degrees/60,CASCADE_ALIAS_FEATURES[0])).toBeGreaterThan(.35)
    expect(featureStepPeriods(270*degrees/60,CASCADE_ALIAS_FEATURES[1])).toBeGreaterThan(.35)
    expect(featureStepPeriods(420*degrees/60,CASCADE_ALIAS_FEATURES[2])).toBeGreaterThan(.35)
    expect(featureStepPeriods(1000*degrees/60,CASCADE_ALIAS_FEATURES[3])).toBeGreaterThan(.35)
  })
})
