import { expect,it } from 'vitest'
import { Matrix4,Vector3 } from 'three'
import { createJourneyCameraSampler,createJourneyPose,isolationCamera,orbitCamera,signedAzimuthDelta } from './JourneyCamera'
const digest=(p:ReturnType<typeof createJourneyPose>)=>[p.position.toArray(),p.target.toArray(),p.up.toArray(),p.fov]
it.each([1.6,390/844])('holds profile I after the initial moving fade and across restore at aspect %s',aspect=>{
  const h=new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),sample=createJourneyCameraSampler(),out=createJourneyPose()
  const expected=digest(isolationCamera(aspect,h,createJourneyPose()))
  for(const p of [.590,.595,.60,.845,.85,.855])expect(digest(sample(p,aspect,h,out))).toEqual(expected)
  const endpoint=new Vector3(-.62,.18,.32),target=new Vector3(0,0,-.15)
  if(aspect<.8)endpoint.lerpVectors(target,endpoint,2.2)
  expect(digest(sample(.94,aspect,h,out))).toEqual([endpoint.toArray(),target.toArray(),[0,1,0],aspect<.8?58:42])
})
it('keeps continuous orbit radii, avoids polar roll and does not stop halfway',()=>{
  const sample=createJourneyCameraSampler(),out=createJourneyPose(),h=new Matrix4()
  for(const [a,b] of [[.56,.590],[.60,.62],[.83,.845],[.855,.93]]){
    let prev:Vector3|null=null,maxStep=0
    for(let j=0;j<=500;j++){
      sample(a+(b-a)*j/500,1.6,h,out)
      expect(out.position.distanceTo(out.target)).toBeGreaterThan(.03)
      expect(Math.abs(out.up.dot(out.position.clone().sub(out.target).normalize()))).toBeLessThan(.98)
      if(prev)maxStep=Math.max(maxStep,prev.distanceTo(out.position))
      prev=out.position.clone()
    }
    expect(maxStep).toBeLessThan(.025)
    const mid=(a+b)/2
    const left=sample(mid-1e-6,1.6,h,out).position.clone(),right=sample(mid+1e-6,1.6,h,out).position.clone()
    expect(left.distanceTo(right)).toBeGreaterThan(1e-7)
  }
})
const LEGS:Array<{name:string;a:number;b:number;sign:1|-1;identityDeg:number}>=[
  {name:'A->I',a:.56,b:.590,sign:1,identityDeg:129.7},
  {name:'I->E',a:.60,b:.62,sign:1,identityDeg:83.7},
  {name:'F->I',a:.83,b:.845,sign:1,identityDeg:86.9},
  {name:'I->X',a:.855,b:.93,sign:-1,identityDeg:-160.2},
]
const sweptDeg=(h:Matrix4,aspect:number,a:number,b:number)=>{
  const sample=createJourneyCameraSampler(),out=createJourneyPose(),inv=h.clone().invert()
  const az=()=>{const o=out.position.clone().sub(out.target).transformDirection(inv);return Math.atan2(o.x,o.z)}
  sample(a,aspect,h,out);let prev=az(),total=0
  for(let j=1;j<=2000;j++){
    sample(a+(b-a)*j/2000,aspect,h,out);const next=az();let d=next-prev
    while(d>Math.PI)d-=2*Math.PI
    while(d<-Math.PI)d+=2*Math.PI
    total+=d;prev=next
  }
  return total*180/Math.PI
}
// Doc39 replaces axial isolation and its prescribed long signed sweeps.
it('uses the shorter profile orbit on every leg under transformed assembly frames',()=>{
  const hs=[new Matrix4(),new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),new Matrix4().makeRotationY(Math.PI/6)]
  for(const aspect of [1.6,390/844])for(const h of hs)for(const leg of LEGS){
    const swept=sweptDeg(h,aspect,leg.a,leg.b)
    expect(Math.abs(swept),leg.name).toBeLessThanOrEqual(180+1e-8)
    expect(Math.abs(swept),leg.name).toBeGreaterThan(1)
  }
})
it('falls back to a finite up when endpoint ups are antipodal',()=>{
  const a=createJourneyPose(),b=createJourneyPose(),out=createJourneyPose()
  a.position.set(0,0,1);b.position.set(1,0,0);b.up.set(0,-1,0)
  const mid=orbitCamera(a,b,.5,new Matrix4(),out)
  expect(Number.isFinite(mid.up.x+mid.up.y+mid.up.z)).toBe(true)
  expect(mid.up.length()).toBeCloseTo(1,12)
})
it.each([1.6,390/844])('keeps up clear of the view axis on every orbit leg under three H matrices at aspect %s',aspect=>{
  for(const h of [new Matrix4(),new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),new Matrix4().makeRotationY(Math.PI/6).multiply(new Matrix4().makeRotationZ(.4))]){
    const sample=createJourneyCameraSampler(),out=createJourneyPose()
    for(const leg of LEGS)for(let j=0;j<=400;j++){
      sample(leg.a+(leg.b-leg.a)*j/400,aspect,h,out)
      const view=out.target.clone().sub(out.position).normalize()
      expect(Math.abs(out.up.clone().normalize().dot(view)),leg.name).toBeLessThan(.98)
    }
  }
})
it.each([1.6,390/844])('has no camera roll or view snap across every orbit-leg boundary at aspect %s',aspect=>{
  for(const h of [new Matrix4(),new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),new Matrix4().makeRotationY(Math.PI/6).multiply(new Matrix4().makeRotationZ(.4))]){
    const sample=createJourneyCameraSampler(),a=createJourneyPose(),b=createJourneyPose()
    const basis=(p:ReturnType<typeof createJourneyPose>)=>{const f=p.target.clone().sub(p.position).normalize();return {f,up:p.up.clone().sub(f.clone().multiplyScalar(p.up.dot(f))).normalize()}}
    const angle=(u:Vector3,v:Vector3)=>Math.acos(Math.max(-1,Math.min(1,u.dot(v))))*180/Math.PI
    for(const [p0,p1] of [[.5599999,.56],[.58499,.585],[.5999,.60],[.61999,.62],[.62,.62001],[.82999,.83],[.84499,.845],[.855,.85501],[.94999,.95]] as const){
      const A=basis(sample(p0,aspect,h,a)),B=basis(sample(p1,aspect,h,b))
      expect(angle(A.up,B.up),'up '+p0).toBeLessThan(.2)
      expect(angle(A.f,B.f),'view '+p0).toBeLessThan(.2)
    }
  }
})
it('unwraps toward the requested sign without a discontinuity near zero travel',()=>{
  expect(signedAzimuthDelta(3,3.2,1)).toBeCloseTo(.2,12)
  expect(signedAzimuthDelta(3,3.2,-1)).toBeCloseTo(.2-2*Math.PI,12)
  expect(signedAzimuthDelta(3,2.8,1)).toBeCloseTo(2*Math.PI-.2,12)
  expect(signedAzimuthDelta(3,2.8,-1)).toBeCloseTo(-.2,12)
  expect(signedAzimuthDelta(1,1,-1)).toBe(0)
})

it.each([1.6,390/844])('matches actual world ring exit and moves DURING the first isolation fade, aspect %s',aspect=>{
  const h=new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),sample=createJourneyCameraSampler(),out=createJourneyPose()
  const ring=createJourneyPose();ring.target.set(.02,.04,-.10).applyMatrix4(h)
  ring.position.set(-.25,.10,-.20).applyMatrix4(h);ring.up.set(0,1,0).transformDirection(h);ring.fov=32
  const original=digest(ring)
  expect(digest(sample(.56,aspect,h,out,ring))).toEqual(original)
  const first=sample(.585,aspect,h,out,ring).position.clone()
  expect(first.distanceTo(sample(.587,aspect,h,out,ring).position)).toBeGreaterThan(.0001)
  const profile=digest(isolationCamera(aspect,h,createJourneyPose()))
  for(const p of [.590,.596,.600])expect(digest(sample(p,aspect,h,out,ring))).toEqual(profile)
  const axis=new Vector3(0,0,1).transformDirection(h)
  expect(Math.abs(out.position.clone().sub(out.target).normalize().dot(axis))).toBeLessThan(.35)
  sample(.601,aspect,h,out,ring)
  expect(digest(out)).not.toEqual(profile)
  expect(digest(ring)).toEqual(original)
})
