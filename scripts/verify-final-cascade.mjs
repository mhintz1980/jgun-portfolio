/** Final plan 59: production native-scroll, real depth, conservative full-part masks.
 * --quick: desktop full sampled pixels only. --headed: installed Chrome 60 Hz evidence.
 * --dense: replay every recorded over-limit frame with real-depth pixel captures.
 * No builds/server management or app/asset writes. PNGs/JSON are evidence only.
 */
import { chromium } from 'playwright'
import { buildSync } from 'esbuild'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { launchConfig, describeLaunch } from './lib/browser-launch.mjs'

const arg=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback
const url=arg('url','http://localhost:5293/torque-wrench/')
const out=path.resolve(arg('out','output/playwright/final-cascade-2026-10-26/final-verified'))
mkdirSync(out,{recursive:true})
const quick=process.argv.includes('--quick'), headed=process.argv.includes('--headed'),dense=process.argv.includes('--dense')
const load=async entry=>{
  const text=buildSync({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'}).outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`)
}
const clock=await load('src/scene/torque-wrench/InspectionDirector.ts')
const config=await load('src/scene/inspection/shaft/cascadeConfig.ts')
const schedule=await load('src/scene/inspection/shaft/schedule.ts')
const variants=quick?[{width:1440,height:900,quality:'full'}]:[1440,390].flatMap(width=>['full','lite'].map(quality=>({width,height:width===1440?900:844,quality})))
const report={url,headed,dense,quick,browser:describeLaunch(),started:new Date().toISOString(),cases:[],gates:{}}
const save=()=>writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2))
function extractImages(value,dir,prefix='capture'){
  if(!value||typeof value!=='object')return
  for(const [key,item] of Object.entries(value)){
    if(typeof item==='string'&&item.startsWith('data:image/png;base64,')){
      const name=`${prefix}-${key}.png`;writeFileSync(path.join(dir,name),Buffer.from(item.split(',')[1],'base64'));value[key]=name
    }else if(item&&typeof item==='object')extractImages(item,dir,`${prefix}-${key}`)
  }
}
const browser=await chromium.launch({...launchConfig(),headless:!headed})
try{
  for(const variant of variants){
    const name=`${variant.width}-${variant.quality}`,dir=path.join(out,name);mkdirSync(dir,{recursive:true})
    const result={...variant,name,errors:[],captures:[],seeks:[],playback:null};report.cases.push(result);save()
    const context=await browser.newContext({viewport:{width:variant.width,height:variant.height},deviceScaleFactor:1})
    const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)))
    try{
      await page.goto(`${url}?quality=${variant.quality}`,{waitUntil:'domcontentloaded'})
      await page.waitForFunction(()=>window.__torqueWorld?.snapshot().ready&&window.__torqueWorld.snapshot().sheet?.stats?.shaderWarmReady===1,null,{timeout:180000})
      // Source hashes prove this is the just-built production server.
      result.modules=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/\/assets\/[^/]+\.js$/.test(n)))
      if(!result.modules.length)throw Error('Cascade proof requires an identified production build')
      result.modules=await Promise.all(result.modules.map(async u=>{
        const bytes=Buffer.from(await(await fetch(u)).arrayBuffer()),file=path.basename(new URL(u).pathname)
        const hash=b=>createHash('sha256').update(b).digest('hex')
        const served=hash(bytes),local=hash(readFileSync(path.join('dist/assets',file)))
        if(served!==local)throw Error(`Stale production module ${file}`)
        return {file,sha256:served}
      }))
      let studyReady=false
      const seek=async(p,expectedTime=null,fast=false)=>{
        // Compare against the nearest reachable integer native-scroll position,
        // retaining the abstract request separately; never relax replay tolerances.
        const target=await page.evaluate(p=>{
          const n=window.__torqueNarrative,range=document.documentElement.scrollHeight-innerHeight
          const idealY=n.scrollFraction(p)*range
          const candidates=[...new Set([Math.floor(idealY),Math.ceil(idealY)])].map(y=>({y,progress:n.narrativeProgress(y/range)}))
          candidates.sort((a,b)=>Math.abs(a.progress-p)-Math.abs(b.progress-p))
          return {requestedProgress:p,idealY,range,candidates,...candidates[0]}
        },p)
        const native=await page.evaluate(target=>{
          const frames=window.__torqueWorld.motionSample().frames
          window.scrollTo({top:target.y,behavior:'instant'})
          // A headed browser can quantize CSS scroll positions to fractional
          // physical pixels. Predict from the observed DOM position, never
          // from the scene's reported progress or an assumed integer landing.
          const actualY=scrollY,actualRange=document.documentElement.scrollHeight-innerHeight
          if(Math.abs(actualY-target.y)>1)throw Error('Native scroll did not reach the selected pixel')
          return {frames,actualY,actualRange,integerProgress:target.progress,
            progress:window.__torqueNarrative.narrativeProgress(actualY/actualRange)}
        },target)
        const before=native.frames
        Object.assign(target,native)
        if(!studyReady&&p>=.62&&p<.845){
          await page.waitForFunction(()=>window.__torqueWorld.snapshot().inspection.ready,null,{timeout:90000})
          studyReady=true
        }
        try{
          await page.waitForFunction(({before,target})=>{
            const motion=window.__torqueWorld.motionSample()
            return motion.frames>=before+3&&Math.abs(scrollY-target.actualY)<1e-4&&Math.abs(motion.progress-target.progress)<2e-6
          },{before,target},{timeout:20000})
        }catch(e){
          const motion=await page.evaluate(()=>window.__torqueWorld.motionSample())
          throw Error(`Unmatched native seek: ${JSON.stringify({target,expectedTime,motion})}: ${e}`)
        }
        if(!fast)await page.waitForTimeout(300)
        const state=await page.evaluate(fast=>({motion:window.__torqueWorld.motionSample(),snapshot:fast?null:window.__torqueWorld.snapshot()}),fast)
        const timeError=expectedTime===null?null:Math.abs(state.motion.time-expectedTime)
        if(!(Math.abs(state.motion.progress-target.progress)<2e-6&&(expectedTime===null||timeError<=.003)))
          throw Error(`Unmatched native seek: ${JSON.stringify({target,expectedTime,timeError,motion:state.motion})}`)
        return {target,expectedTime,timeError,...state}
      }
      const atTime=t=>clock.cascadeProgressAtTime(t)-.115
      // Warm alpha/PBR variants and decoded clones before recording.
      for(const t of [66.9,63,60,56,53,44.4,40.2])await seek(atTime(t))
      result.pacing=await page.evaluate(()=>window.__torqueNarrative.pacing())
      result.windows=clock.CASCADE_CLOCK_WINDOWS.map(w=>({time:[w.start.time,w.end.time],pixels:(w.end.distance-w.start.distance)*result.pacing.baselineRange,
        baselinePixels:(w.end.baselineDistance-w.start.baselineDistance)*result.pacing.baselineRange,ratio:(w.end.distance-w.start.distance)/(w.end.baselineDistance-w.start.baselineDistance)}))
      const points=[40.2,43.5,44.4,52.2,53.1,55.5,56,56.25,56.35,56.4,57,57.9,59.1,59.6,60,60.9,62.25,62.8,63.15,64.65,65.4,66.9]
      const captures=async(t,label)=>{
        const state=await seek(atTime(t))
        const capture=await page.evaluate(features=>window.__torqueWorld.cascadeProof(features?{features}:undefined),label.startsWith('hero')?null:config.CASCADE_ALIAS_FEATURES.map(f=>f.id))
        const limits=config.CASCADE_ALIAS_FEATURES.map(f=>({id:f.id,periodStep:config.featureStepPeriods(schedule.sampleFinaleDriveRate(state.motion.time)/60,f),exactZero:capture.features[f.id].exactZero}))
        const record={time:t,requestedProgress:atTime(t),target:state.target,motion:state.motion,camera:state.snapshot.camera,limits,capture}
        extractImages(capture,dir,label);result.captures.push(record);save()
        if(!capture.valid||limits.some(l=>l.periodStep>.35&&!l.exactZero))console.log(JSON.stringify({case:name,time:t,valid:capture.valid,failed:limits.filter(l=>l.periodStep>.35&&!l.exactZero)}))
        return record
      }
      for(const t of points)await captures(t,`t${String(t).replace('.','-')}`)
      // Every hero is measured in the actual projection, with held azimuth.
      for(const t of [53.2,53.3,58.2,58.3,61.2,61.3,64,64.1])await captures(t,`hero${String(t).replace('.','-')}`)
      for(const p of [.824999,.825,.83,.844999,.845,.845001,.855,.9,1,.9,.845,.83,.825]){
        const state=await seek(p);result.seeks.push({requested:p,target:state.target,motion:state.motion})
      }
      if(!quick){
        const pathPoints=Array.from({length:2671},(_,i)=>({t:40.2+i/100,p:atTime(40.2+i/100)}))
        const native=await page.evaluate(points=>points.map(x=>({...x,y:window.__torqueNarrative.scrollFraction(x.p)*(document.documentElement.scrollHeight-innerHeight)})),pathPoints)
        // Full unrecorded traversal warms partial-alpha programs and every
        // reveal before cadence evidence; no concurrent build/test processes.
        await seek(atTime(40.2))
        await page.evaluate(async points=>new Promise(resolve=>{
          let start;function tick(now){start??=now;const elapsed=(now-start)/1000,i=Math.min(2669,Math.floor(elapsed*100)),u=Math.min(1,elapsed*100-i)
            window.scrollTo({top:points[i].y+(points[i+1].y-points[i].y)*u,behavior:'instant'})
            if(elapsed<28)requestAnimationFrame(tick);else resolve()
          }requestAnimationFrame(tick)
        }),native)
        await seek(atTime(40.2))
        result.playback=await page.evaluate(async points=>new Promise(resolve=>{
          const frames=[];let start
          function tick(now){
            start??=now;const elapsed=(now-start)/1000,index=Math.min(2669,Math.floor(elapsed*100)),blend=Math.min(1,elapsed*100-index)
            window.scrollTo({top:points[index].y+(points[index+1].y-points[index].y)*blend,behavior:'instant'})
            frames.push({now,...window.__torqueWorld.motionSample()})
            if(elapsed<28)requestAnimationFrame(tick);else resolve(frames)
          }requestAnimationFrame(tick)
        }),native)
        const steps=result.playback.slice(1).flatMap((f,i)=>f.frames===result.playback[i].frames?[]:[{dt:(f.now-result.playback[i].now)/1000,
          time:f.time,progress:f.progress,carrierStep:Math.abs(f.driveAngle-result.playback[i].driveAngle)}])
        result.cadence={frames:result.playback.length,maxGapMs:Math.max(...steps.map(x=>x.dt*1000)),medianMs:steps.map(x=>x.dt*1000).sort((a,b)=>a-b)[Math.floor(steps.length/2)],
          J:Math.max(...steps.map(x=>{const rate=schedule.sampleFinaleDriveRate(x.time);return rate?x.carrierStep/(rate/60):0}))}
        result.aliasSteps=steps.map(x=>({...x,features:config.CASCADE_ALIAS_FEATURES.map(f=>({id:f.id,periods:config.featureStepPeriods(x.carrierStep,f)}))}))
        if(dense){
          // Replay each actual rendered over-limit pose, retaining its original native progress.
          for(const [i,s] of result.aliasSteps.entries())if(s.features.some(f=>f.periods>.35)){
            const replay=await seek(s.progress,s.time,true)
            const capture=await page.evaluate(features=>window.__torqueWorld.cascadeProof({images:false,features}),s.features.filter(f=>f.periods>.35).map(f=>f.id))
            const failed=s.features.filter(f=>f.periods>.35&&!capture.features[f.id].exactZero)
            result.dense??=[];result.dense.push({frame:i,progress:s.progress,time:s.time,target:replay.target,timeError:replay.timeError,actualProgress:replay.motion.progress,actualTime:replay.motion.time,valid:capture.valid,failed})
            if(failed.length){const full=await page.evaluate(()=>window.__torqueWorld.cascadeProof());extractImages(full,dir,`failed-frame${i}`);writeFileSync(path.join(dir,`failed-frame${i}.json`),JSON.stringify(full));break}
            if(i%120===0){save();console.log(`${name} dense frame ${i}/${result.aliasSteps.length}`)}
          }
        }
      }
      await page.screenshot({path:path.join(dir,'end.png')})
      result.complete=true
      console.log(JSON.stringify({case:name,complete:true,cadence:result.cadence,dense:result.dense?.length}))
    }catch(e){result.error=String(e);console.log(`${name}: ${e.stack}`)}
    finally{await context.close();save()}
  }
}finally{await browser.close()}
report.finished=new Date().toISOString()
report.gates.sampledPixelAlias=report.cases.every(c=>c.complete&&c.captures.every(x=>x.capture.valid&&x.limits.every(l=>l.periodStep<=.35||l.exactZero)))
report.gates.windowPixels=report.cases.every(c=>c.windows?.every(w=>Math.abs(w.ratio/1.5-1)<=.02))
report.gates.mesh=report.cases.every(c=>c.captures.every(x=>x.motion.meshPhaseError<1e-9))
report.gates.errors=report.cases.every(c=>!c.error&&!c.errors.length)
report.gates.densePixels=report.cases.every(c=>c.complete&&c.aliasSteps&&c.dense?.length===c.aliasSteps.filter(s=>s.features.some(f=>f.periods>.35)).length&&c.dense.every(s=>s.valid&&!s.failed.length))
report.gates.takeover=report.cases.every(c=>c.seeks.length>0&&c.seeks.filter(s=>s.requested<=.855).every(s=>{
  const x=s.motion,indices=[0,1,4,5,2]
  return Math.abs(x.sourceInput-x.sun)<Math.PI/360&&Math.abs(x.sourceOutput-x.carriers[6])<Math.PI/360
    &&indices.every((index,i)=>Math.abs(x.sourceCarriers[i]-x.carriers[index])<Math.PI/360&&x.sourcePlanets[i].every((a,j)=>Math.abs(a-x.planets[index][j])<Math.PI/360))
}))
// Dense per-frame visibility and full opening roster are separate required evidence.
report.pass=Object.values(report.gates).every(Boolean)&&!quick&&dense&&headed
save();console.log(JSON.stringify({out,gates:report.gates,pass:report.pass}));process.exitCode=report.pass?0:1
