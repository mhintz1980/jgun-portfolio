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
/** Whole-source restoration needs a wider composition than shaft isolation.
 * Authored from solver-return desktop/narrow CAD hulls and DOM rectangles. */
export function restorationCamera(aspect:number,h:Matrix4,out:JourneyPose):JourneyPose {
  const narrow=aspect<.8
  const tx=narrow?.083:.02634,ty=narrow?.068:-.01137,tz=narrow?-.061:-.07409
  const radius=narrow?.96:.48,az=ISOLATION_AZIMUTH_DEG*Math.PI/180,el=ISOLATION_ELEVATION_DEG*Math.PI/180
  out.target.set(tx,ty,tz)
  out.position.set(tx+radius*Math.cos(el)*Math.sin(az),ty+radius*Math.sin(el),tz+radius*Math.cos(el)*Math.cos(az))
  out.position.applyMatrix4(h);out.target.applyMatrix4(h);out.up.set(0,1,0).transformDirection(h)
  out.fov=narrow?45:39;return out
}
/**
 * Signed azimuth travel from offset azimuth a to b: sign +1 sweeps counter-clockwise in [0,2pi), -1 clockwise in (-2pi,0].
 * A leg whose endpoints agree to 1e-12 rad has zero travel for either sign, so rounding can never add a full turn.
 */
export function signedAzimuthDelta(azA:number,azB:number,sign:1|-1): number {
  const twoPi=2*Math.PI,d=((azB-azA)%twoPi+twoPi)%twoPi
  if(d<1e-12||d>twoPi-1e-12) return 0
  return sign>0?d:d-twoPi
}
/**
 * Law 2: one direction for two adjoining legs. Returns the sign whose combined travel az0->az1->az2 is shorter, so
 * neither leg can counter-swing against the other. Pure function of the three azimuths.
 */
export function monotoneAzimuthSign(az0:number,az1:number,az2:number):1|-1 {
  const plus=signedAzimuthDelta(az0,az1,1)+signedAzimuthDelta(az1,az2,1)
  const minus=-(signedAzimuthDelta(az0,az1,-1)+signedAzimuthDelta(az1,az2,-1))
  return plus<=minus?1:-1
}
/** Law 6: an offset this close to the vertical has no usable azimuth; callers borrow the other endpoint's heading. */
const HORIZONTAL_MIN_SQ=1e-8
const horizontalAzimuth=(x:number,z:number)=>x*x+z*z<HORIZONTAL_MIN_SQ?NaN:Math.atan2(x,z)
const firstFinite=(a:number,b:number,c:number)=>!Number.isNaN(a)?a:!Number.isNaN(b)?b:!Number.isNaN(c)?c:0
const elevationOf=(y:number)=>Math.asin(y>1?1:y<-1?-1:y)
/** Law 4: interpolate orbit radius as exp(lerp(log ra, log rb)) so macro-to-overview zooms read as constant-rate. */
const MIN_RADIUS=1e-6
const logRadius=(r:number)=>Math.log(r>MIN_RADIUS?r:MIN_RADIUS)
const logLerpRadius=(a:number,b:number,w:number)=>{const la=logRadius(a);return Math.exp(la+(logRadius(b)-la)*w)}
const inverseFrame = new Matrix4(), aOffset = new Vector3(), bOffset = new Vector3(), cOffset = new Vector3()
/** A single signed-azimuth leg; no waypoint or chord through the subject. Radius is log-interpolated; a polar endpoint borrows the other's azimuth. */
export function orbitCamera(a: JourneyPose,b: JourneyPose,u:number,axisFrame:Matrix4,out:JourneyPose,sign:1|-1=1): JourneyPose {
  if(u<=0) return copy(a,out)
  if(u>=1) return copy(b,out)
  const w=quintic(u), inv=inverseFrame.copy(axisFrame).invert()
  aOffset.copy(a.position).sub(a.target).transformDirection(inv); bOffset.copy(b.position).sub(b.target).transformDirection(inv)
  const ra=a.position.distanceTo(a.target),rb=b.position.distanceTo(b.target)
  const rawA=horizontalAzimuth(aOffset.x,aOffset.z),rawB=horizontalAzimuth(bOffset.x,bOffset.z)
  const azA=firstFinite(rawA,rawB,0),azB=firstFinite(rawB,rawA,0)
  const delta=signedAzimuthDelta(azA,azB,sign)
  const elA=elevationOf(aOffset.y),elB=elevationOf(bOffset.y)
  const az=azA+delta*w,el=elA+(elB-elA)*w,r=logLerpRadius(ra,rb,w)
  out.target.lerpVectors(a.target,b.target,w)
  out.position.set(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).transformDirection(axisFrame).multiplyScalar(r).add(out.target)
  // Blend the endpoint ups (roll) with the same quintic weight so a leg arriving at a rolled study pose has no roll snap.
  out.up.set(a.up.x+(b.up.x-a.up.x)*w,a.up.y+(b.up.y-a.up.y)*w,a.up.z+(b.up.z-a.up.z)*w)
  // Near-antipodal endpoint ups would collapse the blend; fall back to the nearer endpoint instead of a NaN up.
  if(out.up.lengthSq()<1e-6) out.up.copy(w<.5?a.up:b.up)
  out.up.normalize();out.fov=a.fov+(b.fov-a.fov)*w
  return out
}
/**
 * Owner correction (2026-10-24, Issue 9 / 09.png): the old .94-.995 override swung the camera 18 cm behind the rear
 * handle along the LCD normal, so the whole collapse was watched dead-on down the explosion axis. The close beats are
 * now authored here in world space (handle/LCD at -Z, snout at +Z, reaction arm toward +X):
 * - close-settle [.94,.98]: crane up and push in from the exploded hold to an elevated side three-quarter on the -X
 *   side, ~74 deg off the explosion axis, so the stages visibly slide home with depth and parallax.
 * - close-ownership [.98,.995]: continue the same clockwise orbit to an elevated rear three-quarter that shows the
 *   side of the body and the angled LCD face, then hold to 1.
 * Choreography alignment (2026-10-27): the two legs are ONE C1 span (`closeSpan`). The collapse pose is a pass-through
 * knot with a shared monotone slope on every channel, so the camera does not stop at .98 and then restart.
 */
export const COLLAPSE_START = .94
export const COLLAPSE_END = .98
export const READOUT_END = .995
export const COLLAPSE_AZIMUTH_DEG = -72
export const COLLAPSE_ELEVATION_DEG = 28
export const READOUT_AZIMUTH_DEG = -128
export const READOUT_ELEVATION_DEG = 24
function spherical(out:JourneyPose,tx:number,ty:number,tz:number,azDeg:number,elDeg:number,r:number,fov:number):JourneyPose {
  const az=azDeg*Math.PI/180,el=elDeg*Math.PI/180
  out.target.set(tx,ty,tz)
  out.position.set(tx+r*Math.cos(el)*Math.sin(az),ty+r*Math.sin(el),tz+r*Math.cos(el)*Math.cos(az))
  out.up.set(0,1,0);out.fov=fov;return out
}
/** Owner preview 66: track the extracted bearing/carrier/clutch stack at useful
 * scale. Peripheral housing/handle context may crop in this detail composition. */
export function explodedHoldCamera(aspect:number,out:JourneyPose):JourneyPose {
  const layout=Math.max(0,Math.min(1,(aspect-.62)/.4))
  return spherical(out,0,0,-.24,-65,26,.60+(.40-.60)*layout,42+(32-42)*layout)
}
/** Assembled, elevated side three-quarter that close-settle lands on at p = .98. */
export const collapseCamera=(aspect:number,out:JourneyPose)=>spherical(out,0,0,-.01,COLLAPSE_AZIMUTH_DEG,COLLAPSE_ELEVATION_DEG,aspect<.8?.9:.5,aspect<.8?58:42)
/** Elevated rear three-quarter on the same side: angled LCD face plus the side of the wrench body. */
export const readoutCamera=(aspect:number,out:JourneyPose)=>spherical(out,aspect<.8?-.085:-.02,aspect<.8?-.04:-.02,aspect<.8?-.03:-.11,READOUT_AZIMUTH_DEG,READOUT_ELEVATION_DEG,aspect<.8?.90:.52,aspect<.8?56:36)
function copy(a:JourneyPose,out:JourneyPose) {out.position.copy(a.position);out.target.copy(a.target);out.up.copy(a.up);out.fov=a.fov;return out}
/**
 * Law 5 knot: two cubic Hermite legs through (tA,a), (tI,i), (tE,e) with one shared, monotone (harmonic-mean) slope at
 * the middle knot and rest only at the outer endpoints. A local extremum at the knot gets slope 0, so a channel never overshoots.
 */
function hermite3(a:number,i:number,e:number,p:number,tA:number,tI:number,tE:number):number {
  const incoming=(i-a)/(tI-tA),outgoing=(e-i)/(tE-tI)
  const slope=incoming*outgoing>0?2*incoming*outgoing/(incoming+outgoing):0
  const first=p<tI,duration=first?tI-tA:tE-tI,u=first?(p-tA)/(tI-tA):(p-tI)/(tE-tI)
  const start=first?a:i,end=first?i:e,m0=first?0:slope*duration,m1=first?slope*duration:0
  return start+(end-start)*u*u*(3-2*u)+m0*u*(1-u)*(1-u)-m1*u*u*(1-u)
}
const ENTRY_START=.56,ENTRY_ISOLATION=.60,ENTRY_END=.62
const entryChannel=(a:number,i:number,e:number,p:number)=>hermite3(a,i,e,p,ENTRY_START,ENTRY_ISOLATION,ENTRY_END)
/**
 * Collapse -> readout as one span about world +Y. Azimuth shares one sign through the collapse pose, elevation and
 * target/up/fov use the same harmonic knot, and radius is log-interpolated. Callers hold the exact endpoint poses.
 */
function closeSpan(p:number,x:JourneyPose,c:JourneyPose,r:JourneyPose,out:JourneyPose):JourneyPose {
  const xo=aOffset.copy(x.position).sub(x.target),co=bOffset.copy(c.position).sub(c.target),ro=cOffset.copy(r.position).sub(r.target)
  const rx=xo.length(),rc=co.length(),rr=ro.length()
  const rawX=horizontalAzimuth(xo.x,xo.z),rawC=horizontalAzimuth(co.x,co.z),rawR=horizontalAzimuth(ro.x,ro.z)
  const azX=firstFinite(rawX,rawC,rawR),azC=firstFinite(rawC,rawX,rawR),azR=firstFinite(rawR,rawC,rawX)
  const sign=monotoneAzimuthSign(azX,azC,azR)
  const azCu=azX+signedAzimuthDelta(azX,azC,sign),azRu=azCu+signedAzimuthDelta(azC,azR,sign)
  const elX=elevationOf(xo.y/rx),elC=elevationOf(co.y/rc),elR=elevationOf(ro.y/rr)
  const t0=COLLAPSE_START,t1=COLLAPSE_END,t2=READOUT_END
  const az=hermite3(azX,azCu,azRu,p,t0,t1,t2),el=hermite3(elX,elC,elR,p,t0,t1,t2)
  const radius=Math.exp(hermite3(logRadius(rx),logRadius(rc),logRadius(rr),p,t0,t1,t2))
  out.target.set(hermite3(x.target.x,c.target.x,r.target.x,p,t0,t1,t2),hermite3(x.target.y,c.target.y,r.target.y,p,t0,t1,t2),hermite3(x.target.z,c.target.z,r.target.z,p,t0,t1,t2))
  out.position.set(out.target.x+radius*Math.cos(el)*Math.sin(az),out.target.y+radius*Math.sin(el),out.target.z+radius*Math.cos(el)*Math.cos(az))
  out.up.set(hermite3(x.up.x,c.up.x,r.up.x,p,t0,t1,t2),hermite3(x.up.y,c.up.y,r.up.y,p,t0,t1,t2),hermite3(x.up.z,c.up.z,r.up.z,p,t0,t1,t2))
  if(out.up.lengthSq()<1e-6)out.up.copy(p<t1?x.up:r.up)
  out.up.normalize();out.fov=hermite3(x.fov,c.fov,r.fov,p,t0,t1,t2)
  return out
}
export function createJourneyCameraSampler() {
  const a=createJourneyPose(),i=createJourneyPose(),e=createJourneyPose(),f=createJourneyPose(),x=createJourneyPose(),c=createJourneyPose(),r=createJourneyPose()
  const localA=createJourneyPose(),localI=createJourneyPose(),localE=createJourneyPose(),inv=new Matrix4()
  const local=(pose:JourneyPose,out:JourneyPose)=>{
    out.position.copy(pose.position).sub(pose.target).transformDirection(inv)
    out.target.copy(pose.target).applyMatrix4(inv);out.up.copy(pose.up).transformDirection(inv)
  }
  const old=createPrivateInspectionSample(),legacy={...createJourneyPose(),ortho:0,distance:1}
  const study=(q:number,aspect:number,h:Matrix4,out:JourneyPose)=>{
    const c=samplePrivateInspection(q,aspect,old).camera
    shaftMetrePoint(out.position,c.px,c.py,c.pz).applyMatrix4(h)
    shaftMetrePoint(out.target,c.tx,c.ty,c.tz).applyMatrix4(h)
    shaftMetrePoint(out.up,c.ux,c.uy,c.uz).normalize().transformDirection(h);out.fov=c.fov
  }
  return (p:number,aspect:number,h:Matrix4,out:JourneyPose,ringExitPose?:JourneyPose):JourneyPose=>{
    isolationCamera(aspect,h,i)
    if(p===.60)return copy(i,out)
    if(p<.62){
      if(ringExitPose)copy(ringExitPose,a)
      else {sampleLegacyMechanismCamera(.56-MECHANISM_TRANSLATION,aspect,0,legacy);copy(legacy,a)}
      if(p<=.56)return copy(a,out)
      study(.735,aspect,h,e)
      // Author in the registered assembly frame: no world-space chord through the shaft,
      // no independent easing stop at .600, and no elapsed-time/seek-history dependency.
      inv.copy(h).invert();local(a,localA);local(i,localI);local(e,localE)
      const rawA=horizontalAzimuth(localA.position.x,localA.position.z),rawI=horizontalAzimuth(localI.position.x,localI.position.z),rawE=horizontalAzimuth(localE.position.x,localE.position.z)
      const azA=firstFinite(rawA,rawI,rawE),azI=firstFinite(rawI,rawA,rawE),azE=firstFinite(rawE,rawI,rawA)
      // Law 2: the ring exit, isolation pass-through and study entry share ONE sweep direction (no counter-swing at .600).
      const sign=monotoneAzimuthSign(azA,azI,azE)
      const midAz=azA+signedAzimuthDelta(azA,azI,sign)
      const endAz=midAz+signedAzimuthDelta(azI,azE,sign)
      const az=entryChannel(azA,midAz,endAz,p)
      const el=entryChannel(elevationOf(localA.position.y),elevationOf(localI.position.y),elevationOf(localE.position.y),p)
      // Law 4: log radius, so the zoom between the ring close-up, isolation and study reads at a steady rate.
      const radius=Math.exp(entryChannel(logRadius(a.position.distanceTo(a.target)),logRadius(i.position.distanceTo(i.target)),logRadius(e.position.distanceTo(e.target)),p))
      out.target.set(entryChannel(localA.target.x,localI.target.x,localE.target.x,p),entryChannel(localA.target.y,localI.target.y,localE.target.y,p),entryChannel(localA.target.z,localI.target.z,localE.target.z,p)).applyMatrix4(h)
      out.position.set(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).transformDirection(h).multiplyScalar(radius).add(out.target)
      out.up.set(entryChannel(localA.up.x,localI.up.x,localE.up.x,p),entryChannel(localA.up.y,localI.up.y,localE.up.y,p),entryChannel(localA.up.z,localI.up.z,localE.up.z,p))
      if(out.up.lengthSq()<1e-6)out.up.copy(p<.60?localA.up:localE.up)
      out.up.transformDirection(h);out.fov=entryChannel(a.fov,i.fov,e.fov,p)
      return out
    }
    if(p<=.825){study(.735+p-.62,aspect,h,out);return out}
    study(.94,aspect,h,f)
    restorationCamera(aspect,h,i)
    if(p>=.845&&p<=.855)return copy(i,out)
    explodedHoldCamera(aspect,x)
    if(p===COLLAPSE_START)return copy(x,out)
    if(p<=COLLAPSE_START){
      inv.copy(h).invert()
      aOffset.copy(f.position).sub(f.target).transformDirection(inv)
      bOffset.copy(i.position).sub(i.target).transformDirection(inv)
      cOffset.copy(x.position).sub(x.target).transformDirection(inv)
      const sign=monotoneAzimuthSign(Math.atan2(aOffset.x,aOffset.z),Math.atan2(bOffset.x,bOffset.z),Math.atan2(cOffset.x,cOffset.z))
      if(p<.845)return orbitCamera(f,i,(p-.825)/.020,h,out,sign)
      // Axial dolly: target follows the extracting stack while the registered
      // spherical offset preserves depth. No whole-assembly pullback hump.
      return orbitCamera(i,x,(p-.855)/(COLLAPSE_START-.855),h,out,sign)
    }
    // Close legs are authored in world space, so they orbit world +Y rather than the shaft registration frame.
    collapseCamera(aspect,c)
    if(p===COLLAPSE_END)return copy(c,out)
    readoutCamera(aspect,r)
    if(p>=READOUT_END)return copy(r,out)
    return closeSpan(p,x,c,r,out)
  }
}
