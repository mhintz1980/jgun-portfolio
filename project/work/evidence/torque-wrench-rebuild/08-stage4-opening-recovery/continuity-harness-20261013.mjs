import {chromium} from 'playwright'
import {launchBrowser,describeLaunch} from '../scripts/lib/browser-launch.mjs'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const v=process.argv[2], out=process.argv[3]
const spec=v==='N'?{width:390,height:844,deviceScaleFactor:3,isMobile:true}:{width:1440,height:900,deviceScaleFactor:1,isMobile:false}
mkdirSync(out,{recursive:true})
const b=await launchBrowser(chromium)
try {
 const c=await b.newContext({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:spec.deviceScaleFactor,isMobile:spec.isMobile,reducedMotion:'no-preference'})
 const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)))
 await p.goto('http://localhost:5288/torque-wrench/?quality=full')
 await p.waitForFunction(()=>window.__torqueWorld?.snapshot().sheet.baked,null,{timeout:120000})
 const set=async t=>{const q=await p.evaluate(t=>{const max=document.documentElement.scrollHeight-innerHeight,y=Math.round(t*max);scrollTo(0,y);return{max,y}},t);await p.waitForFunction(({max,y})=>Math.abs(window.__torqueWorld.snapshot().progress-y/max)<=.5/max,q,{timeout:15000});await p.waitForTimeout(1800)}
 const frames=[]
 for(const [sweep,a,z] of [['cold-forward',.4,.5],['warm-reverse',.5,.4],['warm-forward',.4,.5]]){
  await set(a)
  frames.push(...await p.evaluate(async ({sweep,a,z})=>{
   const rows=[],max=document.documentElement.scrollHeight-innerHeight,start=performance.now(),duration=6000
   await new Promise(resolve=>{function frame(now){const u=Math.min(1,(now-start)/duration);scrollTo(0,Math.round(max*(a+(z-a)*u)));const s=window.__torqueWorld.snapshot();rows.push({sweep,time:now,nativeProgress:scrollY/max,progress:s.progress,camera:s.camera,opening:s.opening,mechanical:s.mechanical.channels,frames:s.frames});if(u<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)})
   return rows
  },{sweep,a,z}))
 }
 const artifacts=[]
 for(const t of [.434,.436,.459,.461]){await set(t);const file=v+'-p'+t.toFixed(3)+'.png';const bytes=await p.screenshot({path:out+'/'+file,animations:'allow'});artifacts.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),observation:await p.evaluate(()=>window.__torqueWorld.snapshot())})}
 const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]))
 const steps=frames.slice(1).map((x,i)=>({sweep:x.sweep,sameSweep:x.sweep===frames[i].sweep,dt:x.time-frames[i].time,from:frames[i].progress,to:x.progress,progressStep:Math.abs(x.progress-frames[i].progress),position:dist(x.camera.position,frames[i].camera.position),target:dist(x.camera.target,frames[i].camera.target),fov:Math.abs(x.camera.fov-frames[i].camera.fov)})).filter(x=>x.sameSweep&&x.dt>0)
 const bySweep=Object.fromEntries(['cold-forward','warm-reverse','warm-forward'].map(s=>{const rows=steps.filter(x=>x.sweep===s);return[s,{frames:frames.filter(x=>x.sweep===s).length,gapsOver100ms:rows.filter(x=>x.dt>100),maxima:Object.fromEntries(['dt','progressStep','position','target','fov'].map(k=>[k,Math.max(...rows.map(x=>x[k]))]))}]}))
 const report={schema:'JG038-opening-continuity-observation-v2',harnessSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),build:'.scratch/jg038-stage4-20261013-p',viewport:spec,launch:describeLaunch(),errors,frames,artifacts,bySweep,scope:'Observed time-driven native-scroll cold forward, warm reverse and warm forward opening sweeps and unaltered join PNGs. RAF stalls cause input progress skips; record without classifying a sampler discontinuity. No invented derivative/pacing threshold. Full G5 and owner/Astra acceptance open.'}
 writeFileSync(out+'/continuity-report.json',JSON.stringify(report,null,2));console.log(v,frames.length,bySweep,errors)
}finally{await b.close()}
