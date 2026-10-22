// Native-scroll captures and runtime evidence for doc39; no store mutation.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const args = Object.fromEntries(process.argv.slice(2).map(x => x.replace(/^--/, '').split('=')))
const phase = args.phase ?? 'after'
const width = Number(args.width ?? 1440), height = Number(args.height ?? 900)
const out = `output/playwright/torque-camera-hud-2026-10-21/${phase}${width < 600 ? '-narrow' : ''}`
mkdirSync(out, { recursive: true })
const browser = await launchBrowser(chromium)
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block' })
const page = await context.newPage()
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
const report = { phase, launch: describeLaunch(), viewport: [width,height], capturedAt: new Date().toISOString(), errors, samples: [], interactions: [], gates: [] }
try {
  await page.goto('http://localhost:5341/torque-wrench/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => {
    const w = window.__torqueWorld?.snapshot?.()
    return w?.ready && w.sheet?.baked && w.sheet.stats?.annotationsReady === 1
      && w.sheet.stats?.shaderWarmReady === 1 && window.__torqueNarrative
  }, null, { timeout: 120000, polling: 500 })
  const points = args.points ? args.points.split(',').map(Number) : args.quick ? [0.4725, 0.505, 0.735] : [0.418, 0.435, 0.442, 0.46, 0.469, 0.4725, 0.4805, 0.4945, 0.500, 0.505, 0.520, 0.545, 0.587, 0.593, 0.600, 0.735, 0.747, 0.775, 0.885, 0.905, 0.925, 0.94, 0.960]
  for (const p of points) {
    await page.evaluate(p => window.scrollTo(0, window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight)), p)
    await page.waitForFunction(p => Math.abs(window.__torqueNarrative.snapshot().progress - p) < 0.00005, p, { timeout: 15000 })
    await page.waitForTimeout(p === points[0] ? 1800 : 600)
    const sample = await page.evaluate(() => ({
      narrative: window.__torqueNarrative.snapshot(), world: window.__torqueWorld.snapshot(),
      grooves: window.__torqueWorld.grooveRects?.(), overlay: window.__torqueWorld.overlaySample?.(),
      hud: { cards: [...document.querySelectorAll('[data-shaft-card]')].map(x => x.textContent),
        fos: [...document.querySelectorAll('[data-shaft-fos-model]')].map(x => x.textContent),
        callouts: [...document.querySelectorAll('[data-torque-hotspot]')].map(x => ({ id:x.getAttribute('data-torque-hotspot'), text:x.textContent, visible:x.getBoundingClientRect().width > 0 && getComputedStyle(x).visibility !== 'hidden' })) },
    }))
    sample.controls = await page.evaluate(() => {
      const rect = selector => {
        const element = document.querySelector(selector)
        if (!element) return null
        const r = element.getBoundingClientRect()
        return {left:r.left,top:r.top,right:r.right,bottom:r.bottom}
      }
      const study = rect('.torque-inspection__toggle'), freeLook = rect('.torque-freelook-toggle')
      return {study,freeLook,separate:study && freeLook && (study.bottom <= freeLook.top || freeLook.bottom <= study.top || study.right <= freeLook.left || freeLook.right <= study.left)}
    })
    sample.requestedProgress = p
    report.samples.push(sample)
    if (phase === 'after' && [.4725, .520, .545].includes(p)) {
      sample.groovePixels = await page.evaluate(async () => {
        const proof = window.__torqueWorld.grooveCapture()
        const decode = async url => {
          const bmp = await createImageBitmap(await (await fetch(url)).blob())
          const canvas = new OffscreenCanvas(bmp.width, bmp.height), ctx = canvas.getContext('2d')
          ctx.drawImage(bmp, 0, 0); return ctx.getImageData(0, 0, bmp.width, bmp.height).data
        }
        const beauty = await decode(proof.beauty), result = {}
        for (const [id, url] of Object.entries(proof.without)) {
          const hidden = await decode(url); let changed = 0, colored = 0
          for (let i = 0; i < beauty.length; i += 4) {
            const delta = Math.max(Math.abs(beauty[i]-hidden[i]), Math.abs(beauty[i+1]-hidden[i+1]), Math.abs(beauty[i+2]-hidden[i+2]))
            if (delta > 3) {
              changed++
              if (id === 'red' ? beauty[i] > beauty[i+2]*1.2 && beauty[i] > beauty[i+1]*1.2 : beauty[i+2] > beauty[i]*1.2) colored++
            }
          }
          result[id] = { changed, colored }
        }
        return result
      })
    }
    await page.screenshot({ path: `${out}/p-${p.toFixed(4)}.png` })
    if (phase === 'after' || args.interactions) {
      for (const anchor of sample.overlay?.anchors ?? []) {
        if (!anchor.visible || report.interactions.some(x => x.id === anchor.id)) continue
        const button = page.locator(`[data-torque-hotspot="${anchor.id}"] > button`)
        await button.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(900)
        const focused = await page.evaluate(() => ({ overlay: window.__torqueWorld.overlaySample(), camera: window.__torqueWorld.snapshot().camera }))
        await page.keyboard.press('Escape'); await page.waitForTimeout(900)
        const restored = await page.evaluate(id => ({ focusId: window.__torqueWorld.overlaySample().focusId,
          focusRestored: document.activeElement?.closest('[data-torque-hotspot]')?.getAttribute('data-torque-hotspot') === id }), anchor.id)
        report.interactions.push({ id:anchor.id, progress:p, selected:focused.overlay.focusId, restored,
          cameraMoved: Math.hypot(...focused.camera.position.map((x,i) => x-sample.world.camera.position[i])) })
      }
    }
    console.log(`${phase} p=${p} beat=${sample.narrative.beatId} tier=${sample.world.mechanical?.tier}`)
  }
  report.buildHtmlSha256 = createHash('sha256').update(readFileSync('dist/torque-wrench/index.html')).digest('hex')
  if (phase === 'after' && !args.quick) {
    const add = (name, pass, evidence) => report.gates.push({ name, pass:Boolean(pass), evidence })
    const at = p => report.samples.find(x => x.requestedProgress === p)
    add('live full renderer', report.samples.every(x=>x.world.ready && x.world.mechanical?.tier === 'full'), report.samples.map(x=>x.world.mechanical?.tier))
    for (const p of [.469,.4725,.4805,.4945,.500,.505,.520,.545]) {
      const b = at(p)?.world.ring.projectedBounds
      add(`ring contained ${p}`, b && !b.behind && b.rect[0]>=0 && b.rect[1]>=0 && b.rect[2]<=width && b.rect[3]<=height, b)
    }
    add('ghost plateau 27.5%', Math.abs(at(.593)?.world.isolation.surroundingsOpacity-.275)<.005, at(.593)?.world.isolation)
    add('context gone at .600', at(.600)?.world.isolation.surroundingsOpacity < .001, at(.600)?.world.isolation)
    // Native scroll is integer CSS pixels: the nearest representable .520 seek
    // can land microscopically after the boundary (shift ~1e-8).
    add('camera settled before shift', at(.505)?.world.mechanical.channels.shift < 1e-6 && at(.520)?.world.mechanical.channels.shift < 1e-6, [at(.505)?.world.mechanical.channels,at(.520)?.world.mechanical.channels])
    add('shaft FEA HUD present', at(.735)?.hud.fos.length>0 && at(.735)?.hud.cards.length>0, at(.735)?.hud)
    add('OD shader retained', at(.4725)?.world.ring.sourceMaterialPrograms?.some(x=>x.includes('ring-switch-od-knurl-v3')), at(.4725)?.world.ring.sourceMaterialPrograms)
    const surface = at(.4725)?.world.ring.sourceKnurlSurface
    add('measured OD-only mask', surface?.outerVertices > 0 && surface.knurledOuterVertices === surface.outerVertices
      && surface.boreVertices > 0 && surface.faceVertices > 0 && surface.knurledBoreVertices === 0 && surface.knurledFaceVertices === 0, surface)
    add('blue pixels at entry', at(.4725)?.groovePixels?.blue.colored>10, at(.4725)?.groovePixels)
    add('red pixels after shift', at(.545)?.groovePixels?.red.colored>10, at(.545)?.groovePixels)
    add('four accessible focus callouts', report.interactions.length===4 && report.interactions.every(x=>x.selected===x.id && x.restored.focusId===null && x.cameraMoved>.001), report.interactions)
    // Reverse native seek must return to the same authored camera and subject.
    const reverse = []
    for (const p of [.593,.520,.4805,.435]) {
      await page.evaluate(p => window.scrollTo(0, window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight-innerHeight)),p)
      await page.waitForTimeout(700)
      const state = await page.evaluate(()=>window.__torqueWorld.snapshot())
      const original = at(p).world
      reverse.push({p,cameraError:Math.hypot(...state.camera.position.map((x,i)=>x-original.camera.position[i])),subjectError:Math.abs(state.inspection.subjectTime-original.inspection.subjectTime)})
    }
    add('reverse camera retraces',reverse.every(x=>x.cameraError<.002),reverse)
    // Exercise the existing user playback controls, not a runtime clock setter.
    await page.getByRole('button',{name:'Open cutter inspection details',exact:true}).focus()
    await page.keyboard.press('Enter')
    const slider = page.getByRole('slider',{name:'Study position'})
    await slider.focus(); await page.keyboard.press('Home')
    for(let i=0;i<56;i++) await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(1400)
    const manual = await page.evaluate(()=>({world:window.__torqueWorld.overlaySample(),hudTime:Number(document.querySelector('[data-torque-shaft-time]')?.getAttribute('data-torque-shaft-time')),card:document.querySelector('[data-shaft-card]')?.textContent}))
    add('manual shaft HUD follows subject clock',manual.world.manual && manual.world.studyVisible && Math.abs(manual.hudTime-manual.world.subjectTime)<.08,manual)
    await page.keyboard.press('Escape')
  }
  report.status = errors.length || report.gates.some(x=>!x.pass) ? 'FAIL' : phase === 'after' ? 'PASS' : 'CAPTURED'
  if (report.status === 'FAIL') process.exitCode = 1
} catch (error) {
  report.status = 'FAIL'; report.failure = String(error); process.exitCode = 1
} finally {
  writeFileSync(`${out}/runtime.json`, JSON.stringify(report, null, 2))
  await browser.close()
}
if (errors.length) process.exitCode = 1
console.log(`${report.status}: ${out}/runtime.json (${errors.length} browser errors)`)
