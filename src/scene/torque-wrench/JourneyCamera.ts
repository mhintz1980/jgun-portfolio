import { Matrix4, Vector3 } from 'three'
import { createPrivateInspectionSample, samplePrivateInspection } from './InspectionDirector'
import { sampleLegacyMechanismCamera } from './LegacyMechanismCamera'
import { MECHANISM_TRANSLATION } from './MechanismDirector'
import { shaftMetrePoint } from '../inspection/shaft/frame'
import { quintic } from './JourneyDirector'
export interface JourneyPose { position: Vector3; target: Vector3; up: Vector3; fov: number }
export const createJourneyPose = (): JourneyPose => ({position:new Vector3(),target:new Vector3(),up:new Vector3(0,1,0),fov:42})
/**
 * Owner correction (2026-10-22): the Ring Switch exit sat ~10 deg of azimuth from the old isolation profile, so the
 * gearbox faded out with almost no camera motion. The isolation camera now swings round to the snout-side
 * three-quarter (>= 45 deg from `ringExitPose`) and rises slightly, so the handoff into the Input Shaft reads as a move.
 */
export const ISOLATION_AZIMUTH_DEG = -60
export const ISOLATION_ELEVATION_DEG = 28
export function isolationCamera(aspect: number, h: Matrix4, out: JourneyPose): JourneyPose {
  const elevation=ISOLATION_ELEVATION_DEG*Math.PI/180,azimuth=ISOLATION_AZIMUTH_DEG*Math.PI/180,radius=.24
  out.target.set(0,0,-.035762)
  out.position.set(radius*Math.cos(elevation)*Math.sin(azimuth),radius*Math.sin(elevation),-.035762+radius*Math.cos(elevation)*Math.cos(azimuth))
  out.position.applyMatrix4(h);out.target.applyMatrix4(h);out.up.set(0,1,0).transformDirection(h)
  out.fov=aspect<.8?50:34;return out
}
/** Signed azimuth travel from offset azimuth a to b: sign +1 sweeps counter-clockwise in [0,2pi), -1 clockwise in (-2pi,0]. */
export function signedAzimuthDelta(azA:number,azB:number,sign:1|-1): number {
  const twoPi=2*Math.PI,d=((azB-azA)%twoPi+twoPi)%twoPi
  return sign>0?d:(d===0?0:d-twoPi)
}
const inverseFrame = new Matrix4(), aOffset = new Vector3(), bOffset = new Vector3()
/** A single signed-azimuth leg; no waypoint or chord through the subject. */
export function orbitCamera(a: JourneyPose,b: JourneyPose,u:number,axisFrame:Matrix4,out:JourneyPose,sign:1|-1=1): JourneyPose {
  if(u<=0) return copy(a,out)
  if(u>=1) return copy(b,out)
  const w=quintic(u), inv=inverseFrame.copy(axisFrame).invert()
  aOffset.copy(a.position).sub(a.target).transformDirection(inv); bOffset.copy(b.position).sub(b.target).transformDirection(inv)
  const ra=a.position.distanceTo(a.target),rb=b.position.distanceTo(b.target)
  const azA=Math.atan2(aOffset.x,aOffset.z),azB=Math.atan2(bOffset.x,bOffset.z)
  const delta=signedAzimuthDelta(azA,azB,sign)
  const az=azA+delta*w,el=Math.asin(aOffset.y)+(Math.asin(bOffset.y)-Math.asin(aOffset.y))*w,r=ra+(rb-ra)*w
  out.target.lerpVectors(a.target,b.target,w)
  out.position.set(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).transformDirection(axisFrame).multiplyScalar(r).add(out.target)
  // Blend the endpoint ups (roll) with the same quintic weight so a leg arriving at a rolled study pose has no roll snap.
  out.up.set(a.up.x+(b.up.x-a.up.x)*w,a.up.y+(b.up.y-a.up.y)*w,a.up.z+(b.up.z-a.up.z)*w)
  // Near-antipodal endpoint ups would collapse the blend; fall back to the nearer endpoint instead of a NaN up.
  if(out.up.lengthSq()<1e-6) out.up.copy(w<.5?a.up:b.up)
  out.up.normalize();out.fov=a.fov+(b.fov-a.fov)*w
  return out
}
function shortOrbit(a:JourneyPose,b:JourneyPose,u:number,h:Matrix4,out:JourneyPose):JourneyPose {
  inverseFrame.copy(h).invert()
  aOffset.copy(a.position).sub(a.target).transformDirection(inverseFrame)
  bOffset.copy(b.position).sub(b.target).transformDirection(inverseFrame)
  const d=Math.atan2(bOffset.x,bOffset.z)-Math.atan2(aOffset.x,aOffset.z)
  return orbitCamera(a,b,u,h,out,Math.atan2(Math.sin(d),Math.cos(d))>=0?1:-1)
}
function copy(a:JourneyPose,out:JourneyPose) {out.position.copy(a.position);out.target.copy(a.target);out.up.copy(a.up);out.fov=a.fov;return out}
export function createJourneyCameraSampler() {
  const a=createJourneyPose(),i=createJourneyPose(),e=createJourneyPose(),f=createJourneyPose(),x=createJourneyPose()
  const old=createPrivateInspectionSample(),legacy={...createJourneyPose(),ortho:0,distance:1}
  const study=(q:number,aspect:number,h:Matrix4,out:JourneyPose)=>{
    const c=samplePrivateInspection(q,aspect,old).camera
    shaftMetrePoint(out.position,c.px,c.py,c.pz).applyMatrix4(h)
    shaftMetrePoint(out.target,c.tx,c.ty,c.tz).applyMatrix4(h)
    shaftMetrePoint(out.up,c.ux,c.uy,c.uz).normalize().transformDirection(h);out.fov=c.fov
  }
  return (p:number,aspect:number,h:Matrix4,out:JourneyPose,ringExitPose?:JourneyPose):JourneyPose=>{
    isolationCamera(aspect,h,i)
    if(p>=.590&&p<=.60||p>=.845&&p<=.855)return copy(i,out)
    if(p<.590){
      if(ringExitPose)copy(ringExitPose,a)
      else {sampleLegacyMechanismCamera(.56-MECHANISM_TRANSLATION,aspect,0,legacy);copy(legacy,a)}
      return shortOrbit(a,i,(p-.56)/.030,h,out)
    }
    if(p<.62){study(.735,aspect,h,e);return shortOrbit(i,e,(p-.60)/.02,h,out)}
    if(p<=.825){study(.735+p-.62,aspect,h,out);return out}
    study(.94,aspect,h,f)
    if(p<=.83)return copy(f,out)
    if(p<.845)return shortOrbit(f,i,(p-.83)/.015,h,out)
    x.position.set(-.62,.18,.32);x.target.set(0,0,-.15);x.up.set(0,1,0);x.fov=aspect<.8?58:42
    if(aspect<.8)x.position.lerpVectors(x.target,x.position,2.2)
    return shortOrbit(i,x,(p-.855)/.075,h,out)
  }
}
