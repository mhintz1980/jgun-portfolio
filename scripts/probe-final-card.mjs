import { buildSync } from 'esbuild'
import { createRequire } from 'node:module'
import { PerspectiveCamera, Vector3 } from 'three'

const bundle = buildSync({ entryPoints: ['src/scene/inspection/shaft/camera.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, packages: 'external' }).outputFiles[0].text
const mod = { exports: {} }
Function('require', 'module', 'exports', bundle)(createRequire(import.meta.url), mod, mod.exports)
const { sampleShaftCamera, createShaftCameraSample } = mod.exports
const kinematics = { followAzimuth: 0, followWeight: 0 }
const points = [[4.402330739613968,3.2065436244010925,.2485545666159628],[4.372921500267474,3.2012909650802612,.21114417884443626],[-8.266207084117266,19.729703664779663,.1612094857321566],[-6.482882101344499,19.729703664779663,5.1311739164458166],[-2.910212724681493,19.729703664779663,7.738636287004341],[3.7289439569838274,19.729703664779663,-7.378355718433207]].map(v => new Vector3(...v).multiplyScalar(.001))
function project(c, aspect, w, h) {
  const cam = new PerspectiveCamera(c.fov, aspect, .01, 1)
  cam.position.set(c.px,c.py,c.pz); cam.up.set(c.ux,c.uy,c.uz); cam.lookAt(c.tx,c.ty,c.tz); cam.updateMatrixWorld(true)
  const px = points.map(p => { const q=p.clone().project(cam); return [(q.x+1)*w/2,(1-q.y)*h/2] })
  return {min:[Math.min(...px.map(x=>x[0])),Math.min(...px.map(x=>x[1]))],max:[Math.max(...px.map(x=>x[0])),Math.max(...px.map(x=>x[1]))]}
}
for (const narrow of [false,true]) {
  const [w,h]=narrow?[390,844]:[1440,900], aspect=w/h, out=createShaftCameraSample(), ranked=[]
  for (const targetZ of [0,2,4,5.5,7,9]) for (const targetY of [14,16,18,20,22,24,26]) for (const fov of [32,34,36,38,40,44,48,52]) {
    let best=Infinity, bt=0
    for (let t=33.2;t<=35+1e-9;t+=1/60) {
      const s=sampleShaftCamera(t,aspect,kinematics,out)
      const az=Math.atan2(s.pz-s.tz,s.px-s.tx), el=Math.asin((s.py-s.ty)/Math.hypot(s.px-s.tx,s.py-s.ty,s.pz-s.tz)), d=Math.hypot(s.px-s.tx,s.py-s.ty,s.pz-s.tz)
      const c={...s,tx:0,ty:targetY*.001,tz:targetZ*.001,fov}
      c.px=c.tx+d*Math.cos(el)*Math.cos(az);c.py=c.ty+d*Math.sin(el);c.pz=c.tz+d*Math.cos(el)*Math.sin(az)
      const r=project(c,aspect,w,h), rect=narrow?[31.1875,346,358.8125,392]:[57.59375,596.5,537.59375,876]
      const clr=Math.max(rect[0]-r.max[0],r.min[0]-rect[2],rect[1]-r.max[1],r.min[1]-rect[3])
      if(clr<best){best=clr;bt=t}
    }
    ranked.push({targetY,targetZ,fov,minClearance:best,t:bt})
  }
  ranked.sort((a,b)=>b.minClearance-a.minClearance)
  console.log(narrow?'narrow':'desktop',ranked.slice(0,12))
}
