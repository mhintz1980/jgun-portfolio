import { chromium } from 'playwright'
import { buildSync } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { launchBrowser } from './lib/browser-launch.mjs'
import { encodePreviewVideo } from './lib/preview-video.mjs'
const variant = process.argv[2] || 'rail'
const out = `output/camera-comparison/${variant}`
mkdirSync(out, { recursive: true })
const source = buildSync({entryPoints:['src/scene/torque-wrench/InspectionDirector.ts'],bundle:true,platform:'node',format:'esm',write:false}).outputFiles[0].text
const clock = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const browser = await launchBrowser(chromium)
const report = {status:'PREVIEW_ONLY', samples:[], errors:[], frames:[]}
try {
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1})
  page.on('pageerror', e=>report.errors.push(e.message))
  await page.goto(`http://localhost:5207/torque-wrench/?quality=full&cameraPreview=${variant}`,{waitUntil:'domcontentloaded'})
  await page.waitForFunction(()=>window.__torqueWorld?.snapshot().ready && window.__torqueNarrative,null,{timeout:120000})
  async function seek(p) {
    await page.evaluate(p=>window.scrollTo({top:window.__torqueNarrative.scrollFraction(p)*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'}),p)
    await page.waitForFunction(p=>Math.abs(window.__torqueNarrative.snapshot().progress-p)<=.00005,p,{timeout:30000})
    await page.waitForFunction(()=>window.__torqueWorld.snapshot().inspection?.ready,null,{timeout:120000})
    await page.waitForTimeout(120)
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  }
  const times=[44.4,49,54.9,63.8]
  for (const time of times) {
    const p=clock.cascadeProgressAtTime(time)-.115
    await seek(p); await page.waitForTimeout(1200)
    const state=await page.evaluate(()=>({world:window.__torqueWorld.snapshot(), motion:window.__torqueWorld.motionSample(), narrative:window.__torqueNarrative.snapshot()}))
    const file=`still-${time}.png`; await page.screenshot({path:`${out}/${file}`}); report.samples.push({time,p,file,state})
  }
  const start=clock.cascadeProgressAtTime(42)-.115, end=clock.cascadeProgressAtTime(66)-.115
  await seek(start)
  for(let i=0;i<25;i++) {
    const p=start+(end-start)*i/24; await seek(p)
    const frame=`frame-${String(i).padStart(5,'0')}.png`; await page.screenshot({path:`${out}/${frame}`})
    const actual=await page.evaluate(()=>({narrative:window.__torqueNarrative.snapshot(),motion:window.__torqueWorld.motionSample()}))
    report.frames.push({p,actual})
  }
  report.video=await encodePreviewVideo({directory:out,fps:8,frameCount:25})
} catch(e) { report.error=String(e.stack||e); process.exitCode=1 }
finally { await browser.close(); writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)); console.log(JSON.stringify({error:report.error,errors:report.errors,stills:report.samples.length,frames:report.frames.length,video:report.video?.mp4})) }
