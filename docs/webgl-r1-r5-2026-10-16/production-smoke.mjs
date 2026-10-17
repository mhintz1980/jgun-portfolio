import { preview } from 'vite'
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from '../../scripts/lib/browser-launch.mjs'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const report = { launch: describeLaunch(), started: new Date().toISOString(), cases:[] }
let server, browser
try {
  // A new preview instance is started after the final build; never reuse a stale one.
  server = await preview({ root, preview:{host:'localhost',port:5281,strictPort:true} })
  browser = await launchBrowser(chromium)
  for (const spec of [
    {name:'root-desktop',route:'/',width:1440,height:900},
    {name:'root-narrow',route:'/',width:390,height:844},
    {name:'torque-shared-materials',route:'/torque-wrench/',width:1440,height:900},
    {name:'root-reduced',route:'/',width:1440,height:900,reducedMotion:'reduce'},
  ]) {
    const c = await browser.newContext({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:1,reducedMotion:spec.reducedMotion??'no-preference'})
    const p = await c.newPage(), errors=[]
    p.on('pageerror', e=>errors.push(String(e)))
    p.on('console', m=>{if(m.type()==='error') errors.push(m.text())})
    const response = await p.goto(`http://localhost:5281${spec.route}`,{waitUntil:'domcontentloaded'})
    let ready=true, failure
    try {
      if (spec.reducedMotion) await p.waitForFunction(()=>document.querySelector('main')&&document.querySelectorAll('canvas').length===0)
      else if(spec.route==='/') await p.waitForFunction(()=>window.__telemetry?.performance?.warmReady&&window.__threeRenderer,null,{timeout:180000})
      else await p.waitForFunction(()=>window.__torqueWorld?.snapshot?.().ready,null,{timeout:180000})
      await p.waitForTimeout(1200)
    } catch(e) {ready=false;failure=String(e)}
    const actual = await p.evaluate(()=>{
      const renderer=window.__threeRenderer, gl=renderer?.getContext(), dbg=gl?.getExtension('WEBGL_debug_renderer_info')
      return {canvases:document.querySelectorAll('canvas').length,root:renderer?{gpu:dbg&&gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL),drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],dpr:renderer.getPixelRatio(),warm:window.__telemetry?.performance}:null,torque:window.__torqueWorld?.snapshot?.()}
    })
    const entry={...spec,http:response.status(),ready,failure,errors,actual,pass:response.status()===200&&ready&&errors.length===0}
    report.cases.push(entry); console.log(JSON.stringify({name:spec.name,pass:entry.pass,failure,errors}))
    await c.close()
  }
} catch(e){report.fatal=String(e.stack??e)} finally {
  await browser?.close().catch(()=>{})
  await new Promise(r=>server?server.httpServer.close(r):r())
  report.passed=!report.fatal&&report.cases.length===4&&report.cases.every(c=>c.pass)
  writeFileSync(new URL('./production-smoke.json',import.meta.url),JSON.stringify(report,null,2))
  console.log(JSON.stringify({passed:report.passed,fatal:report.fatal}))
  if(!report.passed)process.exitCode=1
}
