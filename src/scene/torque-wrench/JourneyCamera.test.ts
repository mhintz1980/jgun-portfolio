import { expect,it } from 'vitest'
import { Matrix4,Vector3 } from 'three'
import { createPrivateInspectionSample,samplePrivateInspection,samplePrivateRingCamera,RING_CAMERA_RED_AT } from './InspectionDirector'
import { createJourneySample,sampleJourney } from './JourneyDirector'
import { shaftMetrePoint } from '../inspection/shaft/frame'
import { COLLAPSE_END,COLLAPSE_START,READOUT_END,collapseCamera,createJourneyCameraSampler,createJourneyPose,explodedHoldCamera,isolationCamera,restorationCamera,orbitCamera,readoutCamera,signedAzimuthDelta } from './JourneyCamera'
const digest=(p:ReturnType<typeof createJourneyPose>)=>[p.position.toArray(),p.target.toArray(),p.up.toArray(),p.fov]
it.each([1.6,390/844])('passes profile I at isolation and holds it only across restore at aspect %s',aspect=>{
  const h=new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),sample=createJourneyCameraSampler(),out=createJourneyPose()
  const expected=digest(isolationCamera(aspect,h,createJourneyPose()))
  expect(digest(sample(.60,aspect,h,out))).toEqual(expected)
  const restored=digest(restorationCamera(aspect,h,createJourneyPose()))
  for(const p of [.845,.85,.855])expect(digest(sample(p,aspect,h,out))).toEqual(restored)
  expect(digest(sample(.94,aspect,h,out))).toEqual(digest(explodedHoldCamera(aspect,createJourneyPose())))
})
it('keeps continuous orbit radii, avoids polar roll and does not stop halfway',()=>{
  const sample=createJourneyCameraSampler(),out=createJourneyPose(),h=new Matrix4()
  for(const [a,b] of [[.56,.60],[.60,.62],[.83,.845],[.855,.93],[.94,.98],[.98,.995]]){
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
  {name:'A->I',a:.56,b:.60,sign:1,identityDeg:129.7},
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
it('keeps restoration legs turning in the same signed direction under transformed assembly frames',()=>{
  const hs=[new Matrix4(),new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),new Matrix4().makeRotationY(Math.PI/6)]
  for(const aspect of [1.6,390/844])for(const h of hs){
    const incoming=sweptDeg(h,aspect,.825,.845),outgoing=sweptDeg(h,aspect,.855,.94)
    expect(Math.abs(incoming)).toBeGreaterThan(1)
    expect(Math.abs(outgoing)).toBeGreaterThan(1)
    expect(Math.sign(incoming)).toBe(Math.sign(outgoing))
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
    for(const [p0,p1] of [[.5599999,.56],[.58499,.585],[.5999,.60],[.61999,.62],[.62,.62001],[.82999,.83],[.84499,.845],[.855,.85501],[.94,.94001],[.94999,.95],[.97999,.98],[.98,.98001],[.99499,.995],[.995,1]] as const){
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
  for(const p of [.590,.596,.599])expect(digest(sample(p,aspect,h,out,ring))).not.toEqual(profile)
  expect(digest(sample(.600,aspect,h,out,ring))).toEqual(profile)
  const axis=new Vector3(0,0,1).transformDirection(h)
  // Owner 2026-10-22 moved the profile to a snout-side three-quarter, so the view is no longer near-perpendicular to the axis.
  expect(Math.abs(out.position.clone().sub(out.target).normalize().dot(axis))).toBeLessThan(.5)
  sample(.601,aspect,h,out,ring)
  expect(digest(out)).not.toEqual(profile)
  expect(digest(ring)).toEqual(original)
})

const registeredRingExit=(h:Matrix4)=>{
  const ring=createJourneyPose()
  ring.target.set(.02,.04,-.10).applyMatrix4(h);ring.position.set(-.25,.10,-.20).applyMatrix4(h)
  ring.up.set(0,1,0).transformDirection(h);ring.fov=32
  return ring
}
const flatPose=(p:ReturnType<typeof createJourneyPose>)=>[...p.position.toArray(),...p.target.toArray(),...p.up.toArray(),p.fov]
it.each([1.6,390/844])('has dense interior motion through the former hold and into study, in either seek direction, aspect %s',aspect=>{
  for(const h of [new Matrix4(),new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17)])for(const supplied of [false,true]){
    const sample=createJourneyCameraSampler(),out=createJourneyPose(),ring=supplied?registeredRingExit(h):undefined
    const state=createJourneySample(),points=Array.from({length:1201},(_,n)=>.56+.06*n/1200)
    const expected=points.map(p=>flatPose(sample(p,aspect,h,out,ring)))
    for(let n=1;n<points.length;n++){
      const p=points[n],previous=new Vector3(...expected[n-1].slice(0,3) as [number,number,number])
      sample(p,aspect,h,out,ring)
      if(p>=.585&&p<=.619)expect(out.position.distanceTo(previous),'camera at '+p).toBeGreaterThan(1e-6)
      if(p>.590&&p<=.596)expect(sampleJourney(p,true,state).surroundingsOpacity,'opacity at '+p).toBeLessThan(sampleJourney(points[n-1],true,createJourneySample()).surroundingsOpacity)
      expect(out.position.distanceTo(out.target)).toBeGreaterThan(.03)
      expect(Math.abs(out.up.dot(out.target.clone().sub(out.position).normalize()))).toBeLessThan(.98)
    }
    for(const indices of [points.map((_,n)=>1200-n),points.map((_,n)=>(n*613)%1201)])for(const n of indices){
      expect(flatPose(sample(points[n],aspect,h,out,ring))).toEqual(expected[n])
    }
    expect(flatPose(sample(.599,aspect,h,out,ring))).not.toEqual(flatPose(isolationCamera(aspect,h,createJourneyPose())))
    expect(sampleJourney(.599,true,state).surroundingsOpacity).toBeGreaterThan(0)
    expect(digest(sample(.600,aspect,h,out,ring))).toEqual(digest(isolationCamera(aspect,h,createJourneyPose())))
    expect(sampleJourney(.600,true,state).surroundingsOpacity).toBe(0)
  }
})
it.each([1.6,390/844])('has C0/C1 camera seams and passes isolation with nonzero speed, aspect %s',aspect=>{
  const epsilon=1e-7
  for(const h of [new Matrix4(),new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17)])for(const supplied of [false,true]){
    const sample=createJourneyCameraSampler(),out=createJourneyPose(),ring=supplied?registeredRingExit(h):undefined
    for(const seam of [.56,.585,.590,.596,.600,.620,.825,.830,.845,.855]){
      const left=flatPose(sample(seam-epsilon,aspect,h,out,ring)),mid=flatPose(sample(seam,aspect,h,out,ring)),right=flatPose(sample(seam+epsilon,aspect,h,out,ring))
      for(let k=0;k<mid.length;k++){
        expect(Math.abs(left[k]-mid[k]),'C0 left '+seam).toBeLessThan(.001)
        expect(Math.abs(right[k]-mid[k]),'C0 right '+seam).toBeLessThan(.001)
        expect(Math.abs((mid[k]-left[k])/epsilon-(right[k]-mid[k])/epsilon),'C1 '+seam+' channel '+k).toBeLessThan(.1)
      }
      if(seam===.600)expect(new Vector3(right[0]-left[0],right[1]-left[1],right[2]-left[2]).length()/(2*epsilon)).toBeGreaterThan(.5)
    }
  }
})
it.each([1.6,390/844])('commutes with rigid registration and lands on the converted study entry, aspect %s',aspect=>{
  const sample=createJourneyCameraSampler(),identity=new Matrix4(),h=new Matrix4().makeRotationY(.7).multiply(new Matrix4().makeRotationZ(.4)).setPosition(.08,-.04,.17)
  const a=createJourneyPose(),b=createJourneyPose(),ring=registeredRingExit(identity),registered=registeredRingExit(h)
  for(let n=0;n<=600;n++){
    const p=.56+.06*n/600
    sample(p,aspect,identity,a,ring);sample(p,aspect,h,b,registered)
    expect(a.position.applyMatrix4(h).distanceTo(b.position)).toBeLessThan(1e-12)
    expect(a.target.applyMatrix4(h).distanceTo(b.target)).toBeLessThan(1e-12)
    expect(a.up.transformDirection(h).distanceTo(b.up)).toBeLessThan(1e-12)
    expect(a.fov).toBeCloseTo(b.fov,10)
  }
  const c=samplePrivateInspection(.735,aspect,createPrivateInspectionSample()).camera
  sample(.62,aspect,h,b,registered)
  expect(b.position.distanceTo(shaftMetrePoint(new Vector3(),c.px,c.py,c.pz).applyMatrix4(h))).toBeLessThan(1e-12)
  expect(b.target.distanceTo(shaftMetrePoint(new Vector3(),c.tx,c.ty,c.tz).applyMatrix4(h))).toBeLessThan(1e-12)
  expect(b.up.distanceTo(shaftMetrePoint(new Vector3(),c.ux,c.uy,c.uz).normalize().transformDirection(h))).toBeLessThan(1e-12)
  expect(b.fov).toBe(c.fov)
  const pending=sampleJourney(.7,false,createJourneySample())
  expect(digest(sample(pending.effectiveProgress,aspect,h,b,registered))).toEqual(digest(isolationCamera(aspect,h,createJourneyPose())))
})

it('swings at least 45 degrees between the Ring Switch exit pose and the isolation profile',()=>{
  const h=new Matrix4(),exit=samplePrivateRingCamera(RING_CAMERA_RED_AT,.24,{px:0,py:0,pz:0,tx:0,ty:0,tz:0,ux:0,uy:1,uz:0,fov:32},1.6)
  const offsetAz=(px:number,pz:number,tz:number)=>Math.atan2(px,pz-tz)
  const exitAz=offsetAz(exit.px,exit.pz,exit.tz)
  const iso=isolationCamera(1.6,h,createJourneyPose())
  const isoAz=offsetAz(iso.position.x-iso.target.x,iso.position.z,iso.target.z)
  let d=Math.abs(isoAz-exitAz)*180/Math.PI
  if(d>180)d=360-d
  expect(d).toBeGreaterThanOrEqual(45)
})

// Issue 9 (09.png): the collapse must not be watched dead-on down the explosion axis from behind the rear handle.
// World frame: explosion along Z, rear handle + LCD at -Z, snout at +Z. LCD normal measured live 2026-10-24.
const LCD_NORMAL=new Vector3(-.296,0,-.958).normalize()
const offsetOf=(p:ReturnType<typeof createJourneyPose>)=>p.position.clone().sub(p.target)
it.each([1.6,390/844])('keeps the collapse on an elevated side three-quarter, never axial, at aspect %s',aspect=>{
  const h=new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17),sample=createJourneyCameraSampler(),out=createJourneyPose()
  for(let j=0;j<=400;j++){
    const p=COLLAPSE_START+(COLLAPSE_END-COLLAPSE_START)*j/400,o=offsetOf(sample(p,aspect,h,out)),d=o.clone().normalize()
    expect(Math.abs(d.z),'axial at '+p).toBeLessThan(.6)
    expect(Math.asin(d.y)*180/Math.PI,'elevation at '+p).toBeGreaterThan(12)
    expect(o.x,'side at '+p).toBeLessThan(-.2)
    expect(d.dot(LCD_NORMAL),'LCD dead-on at '+p).toBeLessThan(.2)
  }
  const settled=offsetOf(sample(COLLAPSE_END,aspect,h,out)).normalize()
  expect(Math.asin(settled.y)*180/Math.PI).toBeGreaterThanOrEqual(25)
  expect(Math.abs(settled.z)).toBeLessThan(.35)
})
it.each([1.6,390/844])('moves through the collapse instead of holding a static frame at aspect %s',aspect=>{
  const h=new Matrix4(),sample=createJourneyCameraSampler(),out=createJourneyPose()
  const at=(p:number)=>sample(p,aspect,h,out).position.clone()
  const start=at(COLLAPSE_START),mid=at(.955),late=at(.965),end=at(COLLAPSE_END)
  expect(start.distanceTo(mid)).toBeGreaterThan(.02)
  expect(mid.distanceTo(late)).toBeGreaterThan(.02)
  expect(late.distanceTo(end)).toBeGreaterThan(.02)
  expect(start.distanceTo(end)).toBeGreaterThan(.08)
})
it.each([1.6,390/844])('lands exactly on the authored close poses and holds the readout to 1 at aspect %s',aspect=>{
  const h=new Matrix4().makeRotationY(Math.PI/6),sample=createJourneyCameraSampler(),out=createJourneyPose()
  expect(digest(sample(COLLAPSE_START,aspect,h,out))).toEqual(digest(explodedHoldCamera(aspect,createJourneyPose())))
  expect(digest(sample(COLLAPSE_END,aspect,h,out))).toEqual(digest(collapseCamera(aspect,createJourneyPose())))
  const readout=digest(readoutCamera(aspect,createJourneyPose()))
  for(const p of [READOUT_END,.998,1])expect(digest(sample(p,aspect,h,out))).toEqual(readout)
})
it.each([1.6,390/844])('frames the LCD from an elevated rear three-quarter, not head-on, at aspect %s',aspect=>{
  const d=offsetOf(readoutCamera(aspect,createJourneyPose())).normalize(),facing=d.dot(LCD_NORMAL)
  expect(facing).toBeGreaterThan(.5)
  expect(facing).toBeLessThan(.9)
  expect(Math.asin(d.y)*180/Math.PI).toBeGreaterThan(18)
  expect(d.x).toBeLessThan(-.4)
})
it('orbits one way through both close legs without crossing behind the handle axis',()=>{
  const sample=createJourneyCameraSampler(),out=createJourneyPose(),h=new Matrix4()
  let prev=Infinity
  for(let j=0;j<=600;j++){
    const p=COLLAPSE_START+(READOUT_END-COLLAPSE_START)*j/600,o=offsetOf(sample(p,1.6,h,out)),az=Math.atan2(o.x,o.z)
    expect(az).toBeLessThanOrEqual(prev+1e-9)
    expect(az).toBeLessThan(0)
    prev=az
  }
})

it.each([1.6,390/844])('tracks the extracted stack without a distant pullback and replays arbitrary seeks at aspect %s',aspect=>{
  const h=new Matrix4().makeRotationX(.3).setPosition(.08,-.04,.17)
  const sample=createJourneyCameraSampler(),out=createJourneyPose()
  const begin=sample(.855,aspect,h,out).position.distanceTo(out.target)
  const end=sample(.94,aspect,h,out).position.distanceTo(out.target)
  const points=Array.from({length:101},(_,i)=>.855+.085*i/100)
  const expected=points.map(p=>{
    sample(p,aspect,h,out)
    expect(out.position.distanceTo(out.target)).toBeLessThanOrEqual(Math.max(begin,end)+1e-12)
    return digest(out)
  })
  for(let i=points.length-1;i>=0;i--)expect(digest(sample(points[i],aspect,h,out))).toEqual(expected[i])
  for(let i=0;i<points.length;i++){
    const n=(i*37)%points.length
    expect(digest(sample(points[n],aspect,h,out))).toEqual(expected[n])
  }
})
