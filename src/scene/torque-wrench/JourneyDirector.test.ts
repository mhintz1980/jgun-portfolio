import { expect,it } from 'vitest'
import { createJourneySample,sampleJourney } from './JourneyDirector'
import { sampleMechanism, type MechanismSample } from './MechanismDirector'
import { createPrivateInspectionSample,samplePrivateInspection } from './InspectionDirector'
const at=(p:number,ready=true)=>sampleJourney(p,ready,createJourneySample())
const mechanism=(p:number)=>sampleMechanism(at(p).mechanismProgress,{} as MechanismSample)
it('is deterministic across dense, reverse and shuffled seeks with no premature motion',()=>{
  const order=Array.from({length:2001},(_,i)=>i/2000)
  const expected=order.map(p=>at(p)),out=createJourneySample()
  for(const indices of [order.map((_,i)=>i),order.map((_,i)=>2000-i),order.map((_,i)=>(i*1177)%2001)]) for(const i of indices){
    expect(sampleJourney(order[i],true,out)).toEqual(expected[i])
    if(order[i]<=.855){expect(mechanism(order[i]).explode).toBe(0);expect(mechanism(order[i]).gearAngle).toBe(0)}
    expect(out.studyVisible&&out.sourceShaftOpacity>.001).toBe(false)
    if(out.studyVisible)expect(out.surroundingsOpacity).toBe(0)
  }
})
it('guards only the shaft window and holds exactly camera-I state .60',()=>{
  for(const p of [.62,.7,.825,.84])expect(at(p,false)).toMatchObject({effectiveProgress:.60,pending:true,studyVisible:false,sourceShaftOpacity:1,surroundingsOpacity:0})
  for(const p of [.3,.61,.845,.85,.9,.97])expect(at(p,false)).toEqual(at(p))
  expect(at(.52).preload).toBe(true)
  expect(()=>at(NaN)).toThrow()
})
it('preserves all 43 seconds and original slope at 2000 mapped episode points',()=>{
  const a=createPrivateInspectionSample(),b=createPrivateInspectionSample()
  for(let i=0;i<=2000;i++){
    const p=.62+.205*i/2000,q=.735+.205*i/2000
    expect(at(p).inspectionProgress).toBeCloseTo(q,14)
    samplePrivateInspection(at(p).inspectionProgress,1.6,a);samplePrivateInspection(q,1.6,b)
    expect(a.subjectTime).toBeCloseTo(b.subjectTime,10)
  }
  expect(samplePrivateInspection(at(.825).inspectionProgress,1.6,a).subjectTime).toBe(43)
  expect(at(.83).contextOpacity).toBe(0)
})
it('has stationary mechanism seams and preserves the original close law',()=>{
  for(const seam of [.855,.93]){
    const c=mechanism(seam),left=mechanism(seam-1e-7),right=mechanism(seam+1e-7)
    for(const key of ['shift','explode','gearAngle','ghostOpacity'] as const){
      expect(Math.abs((c[key]-left[key])/1e-7)).toBeLessThan(.02)
      expect(Math.abs((right[key]-c[key])/1e-7)).toBeLessThan(.02)
    }
  }
  expect(mechanism(.93)).toEqual(mechanism(.94))
  for(const p of [.94,.95,.97,1])expect(mechanism(p)).toEqual(sampleMechanism(p,{} as MechanismSample))
})
