/** Supplemental deterministic reverse seeks, camera samples and opaque housing. */
import { chromium } from 'playwright'
import { buildSync } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { launchConfig } from './lib/browser-launch.mjs'
const out=path.resolve('output/playwright/final-cascade-2026-10-26/final-verified');mkdirSync(out,{recursive:true})
const load=async file=>import('data:text/javascript;base64,'+Buffer.from(buildSync({entryPoints:[file],bundle:true,format:'esm',platform:'node',write:false}).outputFiles[0].text).toString('base64'))
const clock=await load('src/scene/torque-wrench/InspectionDirector.ts'),schedule=await load('src/scene/inspection/shaft/schedule.ts')
const browser=await chromium.launch({...launchConfig(),headless:false}),results=[]
try{
  for(const width of [1440,390])for(const quality of ['full','lite']){
    const context=await browser.newContext({viewport:{width,height:width===1440?900:844}}),page=await context.newPage()
    const result={width,quality,seeks:[],housing:[],errors:[]};results.push(result);page.on('pageerror',e=>result.errors.push(String(e)))
    try{
      await page.goto(`http://localhost:5293/torque-wrench/?quality=${quality}`)
      await page.waitForFunction(()=>window.__torqueWorld?.snapshot().ready&&window.__torqueWorld.snapshot().sheet?.stats?.shaderWarmReady===1,null,{timeout:180000})
      result.installation=await page.evaluate(()=>{
        const s=window.__torqueWorld.snapshot()
        return {tier:s.mechanical.tier,sheetTier:s.sheet.tier,renderer:s.renderer}
      })
      const seek=async p=>{
        let request=p,state
        for(let attempt=0;attempt<4;attempt++){
          await page.evaluate(p=>window.scrollTo({top:window.__torqueNarrative.scrollFraction(p)*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'}),request)
          await page.waitForTimeout(250)
          state=await page.evaluate(()=>({nativeY:scrollY,motion:window.__torqueWorld.motionSample(),snapshot:window.__torqueWorld.snapshot()}))
          if(Math.abs(state.motion.progress-p)<2e-6)return state
          request+=p-state.motion.progress
        }
        throw Error(`Unmatched seek ${p}; got ${state.motion.progress}`)
      }
      await page.evaluate(()=>window.scrollTo({top:window.__torqueNarrative.scrollFraction(.825)*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'}))
      await page.waitForFunction(()=>window.__torqueWorld.snapshot().inspection.ready,null,{timeout:90000})
      await seek(.825)
      const times=[...new Set([...clock.CASCADE_CLOCK_BOUNDARIES.map(x=>x.time),52.65,55.95])].sort((a,b)=>a-b)
      for(const t of [...times,...times.toReversed(),57.9,43.5,64.65,53.1,66.9,40.2]){
        const {nativeY,motion,snapshot}=await seek(clock.cascadeProgressAtTime(t)-.115)
        result.seeks.push({requestedTime:t,nativeY,motion,camera:snapshot.camera,phaseResidual:Math.abs(motion.driveAngle-schedule.sampleFinaleAngle(motion.time)),
          angleResidual:Math.max(...motion.carriers.map((a,i)=>Math.abs(a+motion.driveAngle*[1,.2,.04,0,.008,.0016,.0016,0][i])))})
      }
      for(const p of [.855,.86,.88,.9,.93,.94,.96,.98,1,.98,.9,.855]){
        const {snapshot,motion}=await seek(p)
        result.housing.push({requested:p,progress:motion.progress,materials:snapshot.mechanical.ghostMaterials.filter(x=>x.attached)})
      }
      result.pass=!result.errors.length&&result.seeks.every(x=>x.phaseResidual<1e-9&&x.angleResidual<1e-9&&x.motion.meshPhaseError<1e-9)
        &&result.housing.every(x=>x.materials.length>0&&x.materials.every(m=>m.opacity===1&&m.applied.every(a=>a.opacity===1&&a.depthWrite)))
    }catch(e){result.error=String(e);result.pass=false}
    finally{await context.close();writeFileSync(path.join(out,'seeks-and-housing.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({width,quality,pass:result.pass,error:result.error}))}
  }
}finally{await browser.close()}
process.exitCode=results.length===4&&results.every(x=>x.pass)?0:1
