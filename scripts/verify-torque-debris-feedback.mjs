// Focused feedback smoke. Native scroll + real input; geometry claims use installed telemetry.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const arg=(name, fallback)=>process.argv.find(x=>x.startsWith(`--${name}=`))?.slice(name.length+3)??fallback
const url=arg('url','http://localhost:5215/torque-wrench/')
const out=resolve(arg('out','project/work/evidence/torque-debris-field-2026-11-12/runtime'))
const cases=arg('cases','desktop,narrow').split(',')
mkdirSync(out,{recursive:true})
const report={url,browser:describeLaunch(),cases:[],status:'INCOMPLETE'}
const browser=await launchBrowser(chromium)
try {
  for(const name of cases) {
    const viewport=name==='narrow'?{width:390,height:844}:{width:1440,height:900}
    const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'no-preference'})
    const page=await context.newPage(), errors=[], samples=[]
    page.on('pageerror',e=>errors.push(String(e)))
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
    const item={name,viewport,errors,samples,gates:[]}; report.cases.push(item)
    const gate=(name,pass,evidence)=>item.gates.push({name,pass,evidence})
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000})
    await page.waitForFunction(()=>window.__torqueWorld?.snapshot().ready
      &&window.__torqueWorld.snapshot().sheet.stats.annotationsReady===1
      &&window.__torqueWorld.snapshot().sheet.stats.shaderWarmReady===1,null,{timeout:150000,polling:500})
    async function seek(p) {
      await page.evaluate(p=>window.scrollTo(0,window.__torqueNarrative.scrollFraction(p)
        *(document.documentElement.scrollHeight-innerHeight)),p)
      await page.waitForFunction(p=>Math.abs(window.__torqueNarrative.snapshot().progress-p)<.00005,p,{timeout:30000})
      if(p>=.62&&p<.825) await page.waitForFunction(()=>window.__torqueWorld.snapshot().inspection.ready,null,{timeout:120000})
      await page.waitForTimeout(700)
    }
    async function sample(p,label='') {
      const data=await page.evaluate(()=>{
        const w=window.__torqueWorld.snapshot()
        return {progress:w.progress,opening:w.opening,camera:w.camera,stats:w.sheet.stats,
          lightning:window.__torqueWorld.lightningSnapshot(),background:window.__torqueBackground.snapshot(),
          workbench:window.__metrologyWorkbench?.snapshot(),lab:window.__metrologyLab?.snapshot?.(),
          shell:[...document.querySelectorAll('.torque-header,.torque-footer')].map(e=>({hidden:e.hidden,display:getComputedStyle(e).display})),
          autoplay:window.__torqueShatterPlayback?.snapshot()}
      })
      samples.push({requested:p,label,...data});return data
    }
    const forward=new Map()
    for(const p of [0,.20,.419,.425,.43,.44,.451,.46,.4805,.69,.99]) {
      await seek(p); const data=await sample(p); forward.set(p,data)
      if([0,.20,.44,.4805,.69,.99].includes(p)) await page.screenshot({path:resolve(out,`${name}-${p}.png`)})
      gate(`shell hidden at ${p}`,data.shell.every(s=>s.hidden&&s.display==='none'),data.shell)
      if(p===.44) {
        gate('eight CAD-attached lightning discharges',data.lightning?.active===8&&data.lightning.endpointErrorM<1e-6,data.lightning)
        gate('time-dilation atmosphere active',data.background.dilation?.strength===1,data.background.dilation)
      }
    }
    for(const p of [.451,.44,.43]) {
      await seek(p);const data=await sample(p,'reverse'), a=forward.get(p)
      const cameraError=Math.max(...data.camera.position.map((x,i)=>Math.abs(x-a.camera.position[i])))
      gate(`reverse ${p}`,cameraError<1e-5&&data.lightning.fingerprint===a.lightning.fingerprint
        &&data.opening.t===a.opening.t,{cameraError,forwardFingerprint:a.lightning.fingerprint,reverseFingerprint:data.lightning.fingerprint})
    }
    await seek(.4288)
    await page.mouse.move(viewport.width*.65,viewport.height*.6)
    await page.mouse.wheel(0,280)
    await page.waitForFunction(()=>window.__torqueShatterPlayback?.snapshot().active,null,{timeout:8000})
    const start=await sample(.43,'auto-start')
    await page.mouse.wheel(0,1800)
    await page.waitForTimeout(500)
    const during=await sample(.43,'auto-wheel-lock')
    gate('wheel cannot skip authored sweep',during.autoplay.active&&during.progress<.44,{start:start.autoplay,during:during.autoplay})
    await page.keyboard.press('f')
    await page.waitForTimeout(350)
    const override=await page.evaluate(()=>({auto:window.__torqueShatterPlayback.snapshot(),free:window.__torqueWorld.stopAndAppreciate()}))
    gate('F releases lock into Free Look',!override.auto.active&&override.free.freeLookActive,override)
    await page.keyboard.press('f');await page.waitForTimeout(700)
    await seek(.425);await seek(.4288);await page.mouse.wheel(0,280)
    await page.waitForFunction(()=>window.__torqueShatterPlayback.snapshot().active,null,{timeout:8000})
    await page.waitForFunction(()=>!window.__torqueShatterPlayback.snapshot().active,null,{timeout:14000})
    const end=await sample(.452,'auto-complete')
    gate('automatic passage completes at .452',Math.abs(end.progress-.452)<.00005,end.autoplay)
    gate('no runtime errors',errors.length===0,errors)
    await context.close()
  }
  report.status=report.cases.every(c=>c.gates.every(g=>g.pass))?'PASS':'FAIL'
} catch(error){report.error=String(error);report.status='FAIL'}
finally {await browser.close();writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify({status:report.status,error:report.error,cases:report.cases.map(c=>({name:c.name,gates:c.gates.length,failed:c.gates.filter(g=>!g.pass).map(g=>g.name),errors:c.errors}))}))
if(report.status!=='PASS')process.exitCode=1
