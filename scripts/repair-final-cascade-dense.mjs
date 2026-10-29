/** Resume only incomplete dense evidence, on the exact same served build. */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { launchConfig } from './lib/browser-launch.mjs'
const file=path.resolve(process.argv[2]??'output/playwright/final-cascade-2026-10-26/final-verified/report.json')
const r=JSON.parse(readFileSync(file,'utf8')),save=()=>writeFileSync(file,JSON.stringify(r,null,2))
if(!r.finished)throw Error('Do not repair while the primary writer is active')
const browser=await chromium.launch({...launchConfig(),headless:false})
try{
  for(const c of r.cases){
    const required=c.aliasSteps?.map((x,i)=>({...x,frame:i})).filter(x=>x.features.some(f=>f.periods>.35))
    if(!required)continue
    const done=new Set((c.dense??[]).filter(x=>x.valid&&!x.failed.length).map(x=>x.frame))
    const pending=required.filter(x=>!done.has(x.frame))
    if(!pending.length&&c.complete)continue
    const context=await browser.newContext({viewport:{width:c.width,height:c.height},deviceScaleFactor:1}),page=await context.newPage()
    c.recovery={started:new Date().toISOString(),originalError:c.error,previousVerifiedFrames:done.size,pending:pending.length,samples:[]}
    try{
      await page.goto(`${r.url}?quality=${c.quality}`)
      await page.waitForFunction(()=>window.__torqueWorld?.snapshot().ready&&window.__torqueWorld.snapshot().sheet?.stats?.shaderWarmReady===1,null,{timeout:180000})
      for(const m of c.modules){
        const bytes=Buffer.from(await(await fetch(new URL(`/assets/${m.file}`,r.url))).arrayBuffer())
        if(createHash('sha256').update(bytes).digest('hex')!==m.sha256)throw Error(`Build changed since cadence recording: ${m.file}`)
      }
      const seek=async(p,time)=>{
        let request=p,state
        for(let attempt=0;attempt<4;attempt++){
          await page.evaluate(p=>window.scrollTo({top:window.__torqueNarrative.scrollFraction(p)*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'}),request)
          await page.waitForTimeout(150)
          state=await page.evaluate(()=>window.__torqueWorld.motionSample())
          if(Number.isFinite(state.time)&&Math.abs(state.progress-p)<2e-6&&(time===undefined||Math.abs(state.time-time)<=.003))return {state,attempts:attempt+1}
          request+=p-state.progress
        }
        throw Error(`Unmatched native seek ${p} time ${time}: ${JSON.stringify(state)}`)
      }
      // First seek waits for the real study to load, then the measured correction owns replay.
      await page.evaluate(()=>window.scrollTo({top:window.__torqueNarrative.scrollFraction(.825)*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'}))
      await page.waitForFunction(()=>window.__torqueWorld.snapshot().inspection.ready,null,{timeout:90000})
      await page.waitForTimeout(1200)
      for(const s of pending){
        const replay=await seek(s.progress,s.time),ids=s.features.filter(f=>f.periods>.35).map(f=>f.id)
        const capture=await page.evaluate(features=>window.__torqueWorld.cascadeProof({images:false,features}),ids)
        const failed=s.features.filter(f=>f.periods>.35&&!capture.features[f.id].exactZero)
        const record={frame:s.frame,progress:s.progress,time:s.time,actualProgress:replay.state.progress,actualTime:replay.state.time,valid:capture.valid,failed}
        c.dense=(c.dense??[]).filter(x=>x.frame!==s.frame);c.dense.push(record);c.recovery.samples.push({frame:s.frame,attempts:replay.attempts,timeError:Math.abs(s.time-replay.state.time)})
        if(!capture.valid||failed.length)throw Error(`Pixel replay fails at frame ${s.frame}: ${JSON.stringify(failed)}`)
        if(c.recovery.samples.length%30===0){save();console.log(`${c.name}: repaired ${c.recovery.samples.length}/${pending.length}`)}
      }
      c.dense.sort((a,b)=>a.frame-b.frame);c.complete=true;delete c.error;c.recovery.finished=new Date().toISOString();save()
    }catch(e){c.error=String(e);c.complete=false;save();console.log(c.error)}
    finally{await context.close()}
  }
}finally{await browser.close()}
r.gates.errors=r.cases.every(c=>c.complete&&!c.error&&!c.errors.length)
r.gates.sampledPixelAlias=r.cases.every(c=>c.complete&&c.captures.every(x=>x.capture.valid&&x.limits.every(l=>l.periodStep<=.35||l.exactZero)))
r.gates.windowPixels=r.cases.every(c=>c.windows?.every(w=>Math.abs(w.ratio/1.5-1)<=.02))
r.gates.mesh=r.cases.every(c=>c.captures.every(x=>x.motion.meshPhaseError<1e-9))
r.gates.densePixels=r.cases.every(c=>c.complete&&c.aliasSteps&&c.dense?.length===c.aliasSteps.filter(s=>s.features.some(f=>f.periods>.35)).length&&c.dense.every(s=>s.valid&&!s.failed.length))
r.pass=r.cases.length===4&&Object.values(r.gates).every(Boolean)&&r.headed&&r.dense&&!r.quick
r.repaired=new Date().toISOString();save();console.log(JSON.stringify({gates:r.gates,pass:r.pass}));process.exitCode=r.pass?0:1
