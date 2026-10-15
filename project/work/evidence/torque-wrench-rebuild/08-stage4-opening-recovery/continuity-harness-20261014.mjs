import {chromium} from 'playwright'
import {launchBrowser,describeLaunch} from '../scripts/lib/browser-launch.mjs'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import http from 'node:http'
import https from 'node:https'
const raw=url=>new Promise((resolve,reject)=>{const client=new URL(url).protocol==='https:'?https:http;client.get(url,{headers:{'Accept-Encoding':'identity'}},r=>{const chunks=[];r.on('data',c=>chunks.push(c));r.on('end',()=>resolve({ok:r.statusCode===200,bytes:Buffer.concat(chunks)}));r.on('error',reject)}).on('error',reject)})
const v=process.argv[2], out=process.argv[3]
const effectsPath=process.argv[4]
const bindingBytes=readFileSync(effectsPath), binding=JSON.parse(bindingBytes)
const startedAt=new Date().toISOString()
if (!binding.runtime.pass || !binding.served.pass) throw new Error('Passing provenance-bound effects report required')
const served=[]
for(const f of binding.provenance.files){const url=new URL('/'+f.path,binding.url).href,response=await raw(url),sha256=createHash('sha256').update(response.bytes).digest('hex');if(!response.ok||sha256!==f.sha256)throw new Error('Served mismatch '+url);served.push({url,sha256})}
const spec=v==='N'?{width:390,height:844,deviceScaleFactor:3,isMobile:true}:{width:1440,height:900,deviceScaleFactor:1,isMobile:false}
mkdirSync(out,{recursive:true})
const b=await launchBrowser(chromium)
let page
const errors=[]
const requestFailures=[], consoleDiagnostics=[]
try {
 const c=await b.newContext({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:spec.deviceScaleFactor,isMobile:spec.isMobile,reducedMotion:'no-preference'})
 const p=await c.newPage();page=p;p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error'){errors.push(m.text());consoleDiagnostics.push({text:m.text(),location:m.location(),time:new Date().toISOString()})}})
 p.on('requestfailed',r=>requestFailures.push({url:r.url(),method:r.method(),resourceType:r.resourceType(),failure:r.failure(),time:new Date().toISOString()}))
 p.on('response',r=>{if(r.status()>=400)requestFailures.push({url:r.url(),status:r.status(),time:new Date().toISOString()})})
 const url=new URL(binding.url);url.searchParams.set('quality','full')
 await p.goto(url.href)
 await p.waitForFunction(()=>window.__torqueWorld?.snapshot().sheet.baked,null,{timeout:120000})
 const observed=await p.evaluate(()=>({innerWidth,innerHeight,devicePixelRatio,renderer:window.__torqueWorld.snapshot().renderer,shaderWarmReady:window.__torqueWorld.snapshot().sheet.stats.shaderWarmReady}))
 if(observed.innerWidth!==spec.width||observed.innerHeight!==spec.height||observed.devicePixelRatio!==spec.deviceScaleFactor||observed.shaderWarmReady!==1)throw new Error('Viewport/warmup mismatch')
 const set=async t=>{const q=await p.evaluate(t=>{const max=document.documentElement.scrollHeight-innerHeight,y=Math.round(t*max),before=window.__torqueWorld.snapshot().frames;scrollTo(0,y);return{max,y,before}},t);await p.waitForFunction(({max,y,before})=>{const s=window.__torqueWorld.snapshot();return s.frames>before&&Math.abs(scrollY-y)<=.5&&Math.abs(s.progress-y/max)<=.5/max},q,{timeout:15000});await p.waitForTimeout(1800)}
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
 const bySweep=Object.fromEntries(['cold-forward','warm-reverse','warm-forward'].map(s=>{const rows=steps.filter(x=>x.sweep===s),samples=frames.filter(x=>x.sweep===s);return[s,{frames:samples.length,gapsOver100ms:samples.flatMap((x,i)=>i>0&&x.time-samples[i-1].time>100?[{dt:x.time-samples[i-1].time,before:samples[i-1],stalled:x,catchUp:samples[i+1]??null,nativeSkip:x.nativeProgress-samples[i-1].nativeProgress,worldCatchUp:samples[i+1]?samples[i+1].progress-x.progress:null}]:[]),maxima:Object.fromEntries(['dt','progressStep','position','target','fov'].map(k=>[k,Math.max(...rows.map(x=>x[k]))]))}]}))
 const report={schema:'JG038-opening-continuity-observation-v3',startedAt,finishedAt:new Date().toISOString(),url:url.href,harnessSha256:createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),effectsBinding:{path:effectsPath,sha256:createHash('sha256').update(bindingBytes).digest('hex')},provenance:binding.provenance,served,viewport:spec,observed,launch:describeLaunch(),errors,requestFailures,consoleDiagnostics,frames,artifacts,bySweep,scope:'Observed time-driven native-scroll cold forward, warm reverse and warm forward opening sweeps and unaltered join PNGs. RAF stalls cause input progress skips; record without classifying a sampler discontinuity. No invented derivative/pacing threshold. Full G5 and owner/Astra acceptance open.'}
 writeFileSync(out+'/continuity-report.json',JSON.stringify(report,null,2));console.log(v,frames.length,bySweep,errors)
}catch(error){const diagnostic=page?await page.evaluate(()=>({url:location.href,world:window.__torqueWorld?.snapshot?.()??null,narrative:window.__torqueNarrative?.snapshot?.()??null,canvasCount:document.querySelectorAll('canvas').length,scene:document.querySelector('.torque-scene')?.getAttribute('data-torque-scene'),body:document.body.innerText.slice(0,1200)})).catch(()=>null):null;writeFileSync(out+'/failure-report.json',JSON.stringify({error:String(error),errors,requestFailures,consoleDiagnostics,diagnostic,startedAt,finishedAt:new Date().toISOString(),provenance:binding.provenance},null,2));throw error}finally{await b.close()}
