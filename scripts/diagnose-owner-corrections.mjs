import { chromium } from 'playwright'
import { launchConfig } from './lib/browser-launch.mjs'
console.log('launch', new Date().toISOString())
const browser = await chromium.launch({ ...launchConfig(), timeout: 20000 })
try {
  console.log('launched')
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', e => console.log('PAGEERROR', String(e)))
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()) })
  console.log('goto')
  await page.goto(process.argv[2] ?? 'http://localhost:5291/torque-wrench/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  console.log('loaded')
  await page.waitForFunction(() => window.__torqueWorld?.snapshot && window.__torqueNarrative?.scrollFraction, null, { polling: 500, timeout: 60000 })
  console.log('probe')
  await page.waitForFunction(() => { const s = window.__torqueWorld.snapshot(); return s.ready && s.sheet?.baked && s.sheet.stats?.annotationsReady === 1 && s.sheet.stats?.shaderWarmReady === 1 }, null, { polling: 500, timeout: 180000 })
  console.log('bake ready')
  const controls = process.argv.includes('--controls')
  for (const progress of controls ? [.470, .500, .824, .8449] : [.466, .470, .4725, .485, .4905, .492, .494, .496, .500, .592, .596, .600, .819, .824, .830, .8449, .8451]) {
    await page.evaluate(p => window.scrollTo({ top: window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }), progress)
    await page.waitForFunction(p => Math.abs(window.__torqueWorld.snapshot().progress - p) < .00005, progress, { polling: 100, timeout: 60000 })
    console.log(JSON.stringify(await page.evaluate(() => {
      const s = window.__torqueWorld.snapshot()
      return { p: s.progress, camera: s.camera, ring: { ready: s.ring.ready, time: s.ring.time, bounds: s.ring.projectedBounds },
        journey: { phase: s.journey.phase, context: s.journey.contextOpacity, study: s.journey.studyVisible },
        inspection: { ready: s.inspection.ready, time: s.inspection.subjectTime, stage1: s.inspection.runtime?.stage1 } }
    })))
    if (controls) console.log('CONTROLS', JSON.stringify(await page.evaluate(p => {
      const s = window.__torqueWorld.snapshot()
      if (p > .6) return { p: s.progress, ownedLeaks: s.isolation.occurrences.filter(o => o.studyOwned && o.applied.some(m => m.opacity > .001)).map(o => o.name),
        support: s.journey.supportHandoff, output: window.__torqueWorld.visibilityCapture('output', true).union }
      const c = window.__torqueWorld.visibilityCapture('fadeOccurrences', true)
      return { p: s.progress, count: c.occurrences.length,
        types: c.occurrences.reduce((a, o) => { const k = `${o.unit}:${o.kind}`; a[k] = (a[k] ?? 0) + 1; return a }, {}),
        suspicious: c.occurrences.filter(o => o.control.appliedOpacity > .1 && (!o.control.ancestorsVisible || !o.control.maskPixels || (!o.control.alphaPixels && !o.pixels))).map(o => ({ label: [o.unit, o.kind, o.occurrence], natural: o.pixels, control: o.control })) }
    }, progress)))
  }
} catch (e) { console.log('DIAGNOSTIC_ERROR', String(e)); process.exitCode = 1 }
finally { await browser.close(); console.log('closed') }
