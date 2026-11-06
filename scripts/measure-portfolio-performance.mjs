// Local lab measurement producer. Usage is strict; no server/build or product changes.
import { chromium } from 'playwright'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { ROUTES, PROFILES, sha256, validateIdentity, assertRoute, windowTasks, parseOptions, runPair, median } from './lib/performance-contract.mjs'
const require = createRequire(import.meta.url)
const args = parseOptions(process.argv.slice(2))
const identity = JSON.parse(readFileSync(args.identity, 'utf8'))
const wait = { timeout: args['ready-timeout'], polling: 1000 }
const preflight = []
// Byte validation happens through Node, outside browser contexts, to avoid warming browser caches.
for (const route of args.routes) {
  const row = validateIdentity(identity, route)
  for (const url of [row.path + 'index.html', row.entry, ...(row.scene ? [row.scene] : [])]) {
    const response = await fetch(new URL(url, args.base))
    const expected = identity.files.find(f => '/' + f.path === url)
    if (response.status !== 200 || !expected || sha256(Buffer.from(await response.arrayBuffer())) !== expected.sha256) throw new Error(`Served identity mismatch: ${url}`)
    preflight.push({ path: url, sha256: expected.sha256 })
  }
}
mkdirSync(args.out, { recursive: true })
const output = path.join(args.out, 'runs.jsonl')
if (existsSync(output)) throw new Error(`Refusing to mix runs: ${output} exists; choose a new --out`)
const browser = await chromium.launch({ headless: true, timeout: 15000, args: ['--use-angle=d3d11', '--enable-gpu'] })
const records = []
function initializer() {
  const probe = window.__portfolioPerf = { longTasks: [], lcp: null, cls: 0, frames: [], lastFrame: null }
  try { new PerformanceObserver(list => {
    for (const e of list.getEntries()) probe.longTasks.push({ start: e.startTime, duration: e.duration })
  }).observe({ type: 'longtask', buffered: true }) } catch {}
  try { new PerformanceObserver(list => {
    for (const e of list.getEntries()) probe.lcp = { start: e.startTime, size: e.size, renderTime: e.renderTime, loadTime: e.loadTime }
  }).observe({ type: 'largest-contentful-paint', buffered: true }) } catch {}
  try { new PerformanceObserver(list => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) probe.cls += e.value
  }).observe({ type: 'layout-shift', buffered: true }) } catch {}
  function frame(at) {
    if (probe.lastFrame !== null) probe.frames.push({ at, duration: at - probe.lastFrame })
    probe.lastFrame = at
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
async function sample(context, meta, profile, route, index) {
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  const net = new Map()
  let origin = null
  const row = { schemaVersion: 1, ts: new Date().toISOString(), source: identity.source,
    lockSha256: identity.lockSha256, artifactManifestSha256: identity.artifactManifestSha256,
    preflightIdentity: preflight, ...meta, pairIndex: index, profile, route: ROUTES[route],
    browserVersion: browser.version(), playwrightVersion: require('playwright/package.json').version,
    requestedProfile: PROFILES[profile], launch: 'bundled Chromium; headless; ANGLE/D3D11 requested',
    throttled: false, readinessObservationResolutionMs: wait.polling, ready: false, inspectionReady: null, windows: [], checkpoints: [], errors: [],
    limitations: ['Local emulation, not physical mobile.', 'rAF timing is presented scheduling, not GPU execution.',
      'No isolated model-prep/decode spans, power or hidden-tab evidence.',
      'Tier/DPR observed at checkpoints; intermediate transitions may be missed.',
      'Readiness observed at up to 1000 ms polling resolution; evaluation/transport latency may add more delay.',
      'Home readiness is DOM main only; home/QM scrolling verifies document movement, not pixel/scene response.',
      'Evaluation latency adds uncertainty to window bounds; preflightIdentity is checked before the roster, not per row.',
      'Natural startup cache only; Lean-V1 valid/missing/stale injection roster NOT completed.'] }
  await page.addInitScript(initializer)
  cdp.on('Network.requestWillBeSent', e => {
    if (e.type === 'Document' && origin === null) origin = e.timestamp
    net.set(e.requestId, { url: e.request.url, type: e.type, start: e.timestamp, initiator: e.initiator })
  })
  cdp.on('Network.requestServedFromCache', e => { const r=net.get(e.requestId); if(r) r.servedFromCache=true })
  cdp.on('Network.responseReceived', e => {
    const r=net.get(e.requestId)
    if(r) Object.assign(r,{status:e.response.status,fromDiskCache:e.response.fromDiskCache,
      fromServiceWorker:e.response.fromServiceWorker,protocol:e.response.protocol,timing:e.response.timing})
  })
  cdp.on('Network.loadingFinished', e => {const r=net.get(e.requestId);if(r) Object.assign(r,{finish:e.timestamp,encodedBytes:e.encodedDataLength})})
  cdp.on('Network.loadingFailed', e => { const r=net.get(e.requestId);if(r) Object.assign(r,{failed:e.errorText,canceled:e.canceled}) })
  page.on('pageerror', error => row.errors.push('PAGEERROR '+error.message))
  page.on('console', message => {if(message.type()==='error') row.errors.push('CONSOLE '+message.text().slice(0,500))})
  const now = () => page.evaluate(()=>performance.now())
  const state = () => page.evaluate(route => {
    const s=window.__torqueWorld?.snapshot?.()
    const canvas=document.querySelector('canvas')
    const gl=canvas?.getContext('webgl2')
    const ext=gl?.getExtension('WEBGL_debug_renderer_info')
    return {at:performance.now(),rawScroll:scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight),
      progress:window.__torqueNarrative?.snapshot?.().progress??null,worldProgress:s?.progress??null,
      ready:route==='torque'?s?.ready:route==='quiet'?window.__quietMachine?.ready:!!document.querySelector('main'),
      inspectionReady:s?.inspection?.ready??null,tier:s?.mechanical?.tier??(route==='home'?'not-applicable':null),
      dpr:devicePixelRatio,viewport:{width:innerWidth,height:innerHeight},canvas:!!canvas,
      drawingBuffer:canvas?{width:canvas.width,height:canvas.height}:null,
      renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,visibility:document.visibilityState}
  },route)
  const checkpoint = async label => {const s=await state();row.checkpoints.push({label,...s});return s}
  const seek = async target => {
    await page.evaluate(({route,target})=>{const raw=route==='torque'?window.__torqueNarrative.scrollFraction(target):target;scrollTo(0,raw*(document.documentElement.scrollHeight-innerHeight))},{route,target})
    await page.waitForFunction(({route,target})=>{
      if(route==='torque') return Math.abs((window.__torqueNarrative?.snapshot?.().progress??-1)-target)<.01
      return Math.abs(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)-target)<.015
    },{route,target},{timeout:15000,polling:100})
    // World progress may legitimately hold at .60 while the study loads. Do not turn that
    // readiness guard into a scroll deadlock or poll the expensive mesh census per frame.
    await page.waitForTimeout(150)
  }
  const sweep = async (from,to) => {
    const start=await now()
    await page.evaluate(async({route,from,to,duration})=>{
      const start=performance.now()
      while(performance.now()-start<duration){const u=Math.min(1,(performance.now()-start)/duration),p=from+(to-from)*u
        const raw=route==='torque'?window.__torqueNarrative.scrollFraction(p):p
        scrollTo(0,raw*(document.documentElement.scrollHeight-innerHeight))
        await new Promise(resolve=>setTimeout(resolve,50))}
    },{route,from,to,duration:args['window-ms']})
    await seek(to)
    row.windows.push({name:to>from?'sustained-forward':'sustained-reverse',start,end:await now()})
    await checkpoint(to>from?'forward-end':'reverse-end')
    if(route==='torque' && Math.abs(row.checkpoints.at(-1).worldProgress-to)>=.01) throw new Error('Installed world did not follow sustained input')
  }
  try {
    await cdp.send('Network.enable')
    const response=await page.goto(new URL(ROUTES[route],args.base).href,{waitUntil:'domcontentloaded',timeout:30000})
    assertRoute(page.url(),route)
    if(new URL(page.url()).origin!==new URL(args.base).origin || response.status()!==200) throw new Error('Unexpected origin/status')
    if(sha256(await response.body())!==identity.routes[route].htmlSha256) throw new Error('Navigation HTML identity mismatch')
    row.dclMs=await now()
    await page.waitForFunction(route=>route==='torque'?window.__torqueWorld?.snapshot?.().ready===true:
      route==='quiet'?window.__quietMachine?.ready===true:!!document.querySelector('main'),route,wait)
    row.ready=true
    row.readyMs=await now()
    row.windows.push({name:'boot-through-scene-ready',start:0,end:row.readyMs})
    await checkpoint('ready')
    const idleStart=await now()
    await page.waitForTimeout(args['window-ms'])
    row.windows.push({name:'idle-before-scroll',start:idleStart,end:await now()})
    if(route==='torque') {
      await seek(.72)
      await page.waitForFunction(()=>window.__torqueWorld?.snapshot?.().inspection?.ready===true,null,wait)
      row.inspectionReady=true; row.inspectionReadyMs=await now()
      await checkpoint('inspection-ready')
      await seek(.62)
      await sweep(.62,.825)
      await sweep(.825,.62)
    } else {await sweep(0,.9);await sweep(.9,.1)}
    row.scrollSuccess=true
    const after=await now();await page.waitForTimeout(args['window-ms'])
    row.windows.push({name:'idle-after-scroll',start:after,end:await now()})
    await checkpoint('finished')
    row.probe=await page.evaluate(()=>{const p=window.__portfolioPerf;return {longTasks:p.longTasks,lcp:p.lcp,cls:p.cls,frames:p.frames,
      navigation:performance.getEntriesByType('navigation')[0]?.toJSON(),resources:performance.getEntriesByType('resource').map(e=>e.toJSON())}})
    for(const window of row.windows) {
      window.longTasks=windowTasks(row.probe.longTasks,window.start,window.end)
      const intervals=row.probe.frames.filter(f=>f.at>=window.start&&f.at<=window.end).map(f=>f.duration).sort((a,b)=>a-b)
      window.frameIntervals={count:intervals.length,p50:intervals[Math.floor(intervals.length*.5)]??null,p95:intervals[Math.floor(intervals.length*.95)]??null}
    }
  } catch(error) {row.errors.push(String(error.stack??error));row.scrollSuccess??=false;await checkpoint('failure').catch(()=>{})}
  finally {
    row.requests=[...net.values()].map(r=>({...r,startMs:origin===null?null:(r.start-origin)*1000,finishMs:origin===null||!r.finish?null:(r.finish-origin)*1000}))
    const transferEnd=Math.max(0,...row.requests.filter(r=>r.finishMs!=null).map(r=>r.finishMs))
    row.httpTransferWindow={start:0,end:transferEnd,encodedBytes:row.requests.reduce((n,r)=>n+(r.encodedBytes??0),0),note:'Network interval overlaps application windows; includes later study requests.'}
    const bad=row.requests.filter(r=>(r.status>=400)||r.failed&&!r.canceled)
    if(bad.length) row.errors.push('Request failures: '+JSON.stringify(bad.map(r=>({url:r.url,status:r.status,error:r.failed}))))
    row.valid=row.ready===true&&row.scrollSuccess===true&&(route!=='torque'||row.inspectionReady===true)&&row.errors.length===0
    await page.close()
    records.push(row)
    appendFileSync(output,JSON.stringify(row)+'\n')
    console.log(JSON.stringify({profile,route,kind:row.kind,pairIndex:index,valid:row.valid,readyMs:row.readyMs,errors:row.errors.slice(0,2)}))
  }
  return row
}
try {
  for(const profile of args.profiles) for(const route of args.routes) for(let index=1;index<=args.pairs;index++) {
    await runPair(browser,profile,(context,meta)=>sample(context,meta,profile,route,index))
  }
} finally {await browser.close()}
const summary={schemaVersion:1,source:identity.source,artifactManifestSha256:identity.artifactManifestSha256,
  invocation:process.argv.slice(2),records:records.length,valid:records.filter(r=>r.valid).length,invalid:records.filter(r=>!r.valid).length,
  leanV1Status:'UNVERIFIED — valid/missing/stale drawing-cache conditions and shader observables not covered by paired natural-startup runs.',
  groups:args.profiles.flatMap(profile=>args.routes.flatMap(route=>['cold','repeat'].map(kind=>{
    const rows=records.filter(r=>r.profile===profile&&r.route===ROUTES[route]&&r.kind===kind),valid=rows.filter(r=>r.valid),values=valid.map(r=>r.readyMs).sort((a,b)=>a-b)
    return{profile,route:ROUTES[route],kind,attempts:rows.length,valid:valid.length,readinessMs:values,
      median:values.length>=5?median(values):null,min:values[0]??null,max:values.at(-1)??null}
  }))) }
writeFileSync(path.join(args.out,'summary.json'),JSON.stringify(summary,null,2)+'\n')
console.log(JSON.stringify({records:summary.records,valid:summary.valid,invalid:summary.invalid}))
process.exitCode=summary.invalid?1:0
