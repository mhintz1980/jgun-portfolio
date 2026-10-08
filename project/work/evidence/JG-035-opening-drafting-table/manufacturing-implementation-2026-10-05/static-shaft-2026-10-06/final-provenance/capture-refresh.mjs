// Parameterized copy of ../capture-completed-renders.mjs for a possible final-source refresh.
// Only difference from the original: explicit --url and --out arguments (the original
// hardcoded http://localhost:5199 and a sibling output dir); the report also records out.
// Capture semantics preserved verbatim: real DOM #inspection-seek with the native value
// setter (step='any'), exact Vite live-store URL import plus telemetry-identity guard,
// three distinct completed-render stamps with entryElapsed >= 1.2, DOM-hidden screenshot,
// camera-drift and support-pair checks. All target times sit on the 0.01 grid. Never run
// concurrently with the manufacturing verifier. No camera, time or entry override.
// Usage: node capture-refresh.mjs --url http://localhost:<port> --out <capture-output-dir>
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const argv = process.argv.slice(2)
const argOf = (name) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : null }
const url = argOf('url')
const outArg = argOf('out')
if (!url || !outArg) {
  console.error('usage: node capture-refresh.mjs --url http://localhost:<port> --out <capture-output-dir>')
  process.exit(2)
}
const out = path.isAbsolute(outArg) ? outArg : path.resolve(process.cwd(), outArg)
const targets = [
  ['cutter-exit', 8.4], ['material-attempts', 17], ['revised-blank', 25],
  ['hobbed', 32.4], ['cool-stress', 34.2], ['support-before', 35.8],
  ['support-after', 38.2], ['assembled-finale', 42.5],
]
await fs.mkdir(out, { recursive: true })
const report = { url, out, started: new Date().toISOString(), method: 'Three distinct completed-render sample stamps, live entryElapsed >= 1.2, stable camera and projection; repeat after hiding DOM; screenshot and compare a subsequent completed frame. No runtime or camera overrides.', cases: [], failures: [] }
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] })
const delta = (a,b) => Math.max(...a.map((v,i) => Math.abs(v-b[i])))
async function settled(page, t, session, after = -1) {
  return page.evaluate(({ t, session, after }) => new Promise((resolve, reject) => {
    const begin = performance.now(); let previous = null, stable = 0
    function tick() {
      const v = window.__staticCompleted, f = v.last, p = window.__inspection
      if (v.errors.length || p?.status === 'error' || p?.suspend === 'context' || !document.querySelector('canvas[data-engine]') || window.__threeRenderer?.getContext().isContextLost()) return reject(new Error('Capture aborted: ' + JSON.stringify({ errors:v.errors, status:p?.status, suspend:p?.suspend })))
      if (!p?.active || p.session !== session) return reject(new Error('Inspection session changed'))
      if (f && f.frame > after && (!previous || f.frame !== previous.frame) && (!previous || f.sampleStamp !== previous.sampleStamp)) {
        const ready = f.session === session && f.epoch === session && f.entryElapsed >= 1.2 && f.status === 'ready' && !f.playing && Math.abs(f.sampledTime-t)<1e-8 && Math.abs(f.cameraSampleTime-t)<1e-8 && f.sampleStamp === f.cameraSampleStamp
        const same = previous && f.camera.every((x,i)=>Math.abs(x-previous.camera[i])<=1e-12) && f.projection.every((x,i)=>Math.abs(x-previous.projection[i])<=1e-12)
        stable = ready ? (same ? stable+1 : 1) : 0
        previous = f
        if (stable >= 3) return resolve(f)
      }
      if (performance.now()-begin>45000) return reject(new Error('Distinct completed renders did not settle: ' + JSON.stringify(f)))
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }), { t, session, after })
}
try {
  for (const cfg of [{ name:'desktop', width:1440, height:900 }, { name:'narrow', width:390, height:844 }]) {
    const r = { name:cfg.name, shots:[], errors:[], requests:[], storeUrls:[] }; report.cases.push(r)
    const context = await browser.newContext({ viewport:{width:cfg.width,height:cfg.height}, deviceScaleFactor:1, reducedMotion:'no-preference' })
    const page = await context.newPage()
    page.on('pageerror', e=>r.errors.push(e.message))
    page.on('request', q=>{if (/\.glb(?:\?|$)/.test(q.url()))r.requests.push(q.url());if(q.url().includes('/src/state/inspectionStore.ts'))r.storeUrls.push(q.url())})
    try {
      await page.goto(url+'/?chapter=1&inspectionProof=1', {waitUntil:'domcontentloaded'})
      console.log(cfg.name + ': loaded')
      await page.getByRole('button',{name:'Inspect the input shaft'}).waitFor({timeout:90000})
      console.log(cfg.name + ': trigger ready')
      await page.waitForFunction(()=>window.__rig && window.__threeRenderer && window.__telemetry?.performance?.warmReady,null,{timeout:45000})
      console.log(cfg.name + ': renderer ready')
      if(r.storeUrls.length!==1)throw new Error('Ambiguous live store URLs: '+JSON.stringify(r.storeUrls))
      await page.evaluate(async storeUrl => {
        // Use the exact Vite URL (including HMR timestamp), preventing duplicate module state.
        const priorProbe=window.__inspection
        const { inspection,inspectionTelemetry } = await import(storeUrl)
        if(window.__inspection!==priorProbe || inspectionTelemetry!==priorProbe)throw new Error('Store import was not the live application instance')
        const v = window.__staticCompleted = { frames:0,last:null,errors:[] }
        document.querySelector('canvas[data-engine]').addEventListener('webglcontextlost',()=>v.errors.push('contextlost'))
        const renderer = window.__threeRenderer, original = renderer.render
        renderer.render = function(scene,camera,...args) {
          const result = original.call(this,scene,camera,...args)
          if (scene === window.__threeScene) {
            const frame = ++v.frames
            queueMicrotask(()=>{
              const p=window.__inspection
              v.last={ frame, session:p.session, epoch:inspection.epoch, status:p.status, playing:p.playing, entryElapsed:inspection.entryElapsed, time:p.time, sampledTime:p.sampledTime, cameraSampleTime:p.cameraSampleTime, sampleStamp:p.sampleStamp,cameraSampleStamp:p.cameraSampleStamp,camera:[...camera.matrixWorld.elements],projection:[...camera.projectionMatrix.elements],probe:JSON.parse(JSON.stringify(p)) }
            })
          }
          return result
        }
      },r.storeUrls[0])
      await page.getByRole('button',{name:'Inspect the input shaft'}).click()
      await page.waitForFunction(()=>window.__inspection?.status==='ready',null,{timeout:90000})
      const session=await page.evaluate(()=>window.__inspection.session)
      for (const [id,t] of targets) {
        await page.locator('#inspection-seek').evaluate((e,t)=>{
          const step=e.getAttribute('step'); e.step='any'
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,String(t))
          e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}))
          if(step===null)e.removeAttribute('step');else e.setAttribute('step',step)
        },t)
        await settled(page,t,session)
        await page.evaluate(()=>{
          const canvas=document.querySelector('canvas[data-engine]');window.__staticHidden=[]
          for(const e of document.body.querySelectorAll('*')) {
            if (!(e instanceof HTMLElement)||e===canvas||e.contains(canvas))continue
            window.__staticHidden.push([e,e.style.visibility]);e.style.visibility='hidden'
          }
        })
        let pre,post,bytes
        try {
          pre=await settled(page,t,session)
          bytes=await page.locator('canvas[data-engine]').screenshot({path:path.join(out,`${cfg.name}-${id}.png`)})
          post=await settled(page,t,session,pre.frame)
        } finally {await page.evaluate(()=>{for(const [e,v]of window.__staticHidden)e.style.visibility=v})}
        const drift=Math.max(delta(pre.camera,post.camera),delta(pre.projection,post.projection))
        if(drift>1e-12)throw new Error(`${id}: camera drift ${drift}`)
        const s={ id,t,file:`${cfg.name}-${id}.png`,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,drift,pre,post }
        r.shots.push(s)
        await fs.writeFile(path.join(out,'capture-report.json'),JSON.stringify(report,null,2))
        console.log(`${cfg.name}/${id} t=${t} frame=${post.frame} drift=${drift}`)
      }
      const before=r.shots.find(s=>s.id==='support-before'),after=r.shots.find(s=>s.id==='support-after')
      r.supportPair={ session, cameraDelta:delta(before.post.camera,after.post.camera),projectionDelta:delta(before.post.projection,after.post.projection),beforeBlend:0.028,afterBlend:1,nominalRelocationMm:2.75,visiblePairDisplacementMm:2.673 }
      if(r.supportPair.cameraDelta>1e-12||r.supportPair.projectionDelta>1e-12)throw new Error('Support pair camera mismatch')
      r.pass=true
    } catch(e) {r.errors.push(e.message);r.diagnostics=await page.evaluate(()=>({canvas:document.querySelectorAll('canvas').length,telemetry:window.__telemetry,inspection:window.__inspection,renderer:!!window.__threeRenderer,rig:!!window.__rig})).catch(()=>null);report.failures.push(`${cfg.name}: ${e.message}`);r.pass=false}
    finally {await context.close()}
    if(!r.pass)break
  }
} finally {
  await browser.close();report.completed=new Date().toISOString()
  await fs.writeFile(path.join(out,'capture-report.json'),JSON.stringify(report,null,2))
}
console.log(JSON.stringify({cases:report.cases.map(r=>({name:r.name,pass:r.pass,shots:r.shots.length,errors:r.errors,supportPair:r.supportPair})),failures:report.failures},null,2))
if(report.failures.length)process.exitCode=1
