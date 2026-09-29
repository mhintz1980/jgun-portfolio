import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'))
const base = 'http://localhost:4173/'
const browser = await chromium.launch({channel:'chrome', headless:true, args:['--use-angle=d3d11','--enable-gpu']})
const report = {started:new Date().toISOString(), browser:browser.version(), cpu:os.cpus()[0].model, os:os.release(), method:'Three alternating pairs, fresh context, HTTP cache disabled. Same browser/GPU/server; OS and disk caches uncontrolled. First stats and proof+annotations+live draw readiness measured separately. No assets regenerated.', samples:[]}
try {
  for (const mode of ['precomputed','live','live','precomputed','precomputed','live']) {
    const context = await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,serviceWorkers:'block'})
    const page = await context.newPage()
    const result = {mode, errors:[], failures:[]}; report.samples.push(result)
    page.on('pageerror',e=>result.errors.push(String(e)))
    page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text())})
    page.on('requestfailed',r=>result.failures.push({url:r.url(),error:r.failure()}))
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled',{cacheDisabled:true})
    await page.addInitScript(()=>{
      window.__measurement={contexts:[]}
      const original=HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext=function(...args){
        const gl=original.apply(this,args)
        if(gl && String(args[0]).includes('webgl') && !gl.__measurement){
          gl.__measurement=true; const entry={canvas:this,gl,draws:0};window.__measurement.contexts.push(entry)
          for(const method of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const fn=gl[method];if(fn)gl[method]=function(...args){entry.draws++;return fn.apply(this,args)}}
        }return gl
      }
      const poll=()=>{
        if(!window.__measurement.firstStats && window.__sheetStats?.segments>0)window.__measurement.firstStats={ms:performance.now(),stats:{...window.__sheetStats}}
        if(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady && window.__measurement.contexts.some(e=>e.canvas.isConnected && !e.gl.isContextLost() && e.draws>0))window.__measurement.readyMs=performance.now()
        else requestAnimationFrame(poll)
      };requestAnimationFrame(poll)
    })
    try {
      await page.goto(base+(mode==='live'?'?drawingCache=bypass':''),{waitUntil:'domcontentloaded'})
      await page.waitForFunction(()=>window.__measurement.readyMs && window.__measurement.firstStats,null,{timeout:120000})
      Object.assign(result,await page.evaluate(()=>({firstStats:window.__measurement.firstStats,readyMs:window.__measurement.readyMs,stats:window.__sheetStats,tier:window.__telemetry.performance.tier,resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/drawing/')).map(e=>e.toJSON()),gpu:window.__measurement.contexts.filter(e=>e.canvas.isConnected).map(e=>{const ext=e.gl.getExtension('WEBGL_debug_renderer_info');return ext?e.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):e.gl.getParameter(e.gl.RENDERER)})})))
      result.passed=result.stats.precomputed===(mode==='live'?0:1) && result.errors.length===0
    } catch(e){result.error=String(e);result.passed=false}
    finally {await context.close();fs.writeFileSync(path.join(out,'production-timing.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({mode,readyMs:result.readyMs,statsMs:result.firstStats?.ms,precomputed:result.stats?.precomputed,passed:result.passed,error:result.error}))}
  }
} finally {await browser.close();report.finished=new Date().toISOString();report.passed=report.samples.length===6 && report.samples.every(s=>s.passed);fs.writeFileSync(path.join(out,'production-timing.json'),JSON.stringify(report,null,2))}
process.exitCode=report.passed?0:1
