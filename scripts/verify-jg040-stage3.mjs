// Owner review corrections only. Native scroll, actual DOM geometry and unchanged GPU scene.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const root = process.argv[3] ?? 'output/playwright/jg040-stage3-20261104/final'
const url = process.argv[2] ?? 'http://localhost:5417'
const points = [.56, .6199, .62, .735, .80, .845]
const out = `${root}/owner-captures`
mkdirSync(out, { recursive: true })
const report = { url, launch: describeLaunch(), errors: [], samples: [], interactions: [], gates: [] }
const gate = (name, pass, evidence) => report.gates.push({ name, pass: !!pass, evidence })
// Allow live-host checks to keep fresh evidence while identifying the exact release build.
const dist = process.argv[4] ?? `${root}/dist`
const manifest = () => Object.fromEntries(readdirSync(`${dist}/assets`).map(name => [name,
  createHash('sha256').update(readFileSync(`${dist}/assets/${name}`)).digest('hex')]))
const before = manifest()
const browser = await launchBrowser(chromium)
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['narrow', 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block' })
    const page = await context.newPage()
    let releaseStudy
    let released = false
    const studyHold = new Promise(resolve => { releaseStudy = resolve })
    await page.route('**/models/manufacturing-core-*.glb', async route => { await studyHold; await route.continue() })
    page.on('pageerror', e => report.errors.push(`${name}: ${e}`))
    page.on('console', m => { if (m.type() === 'error') report.errors.push(`${name}: ${m.text()}`) })
    await page.goto(`${url}/torque-wrench/`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => {
      const w = window.__torqueWorld?.snapshot?.()
      return w?.ready && w.sheet?.baked && w.sheet.stats?.annotationsReady === 1
        && w.sheet.stats?.shaderWarmReady === 1 && window.__torqueWorld?.overlaySample && window.__torqueNarrative
    }, null, { timeout: 120000 })
    const seek = async p => {
      // Native scroll is pixel quantized: ceil lands on/after the boundary within <.00005.
      await page.evaluate(p => window.scrollTo({ top: Math.ceil(window.__torqueNarrative.scrollFraction(p)
        * (document.documentElement.scrollHeight - innerHeight)), behavior: 'instant' }), p)
      await page.waitForFunction(p => Math.abs(window.__torqueNarrative.snapshot().progress - p) < .00005, p, { timeout: 30000 })
      if (p >= .62 && p < .845) {
        if (!released) {
          await page.waitForTimeout(700)
          const cold = await page.evaluate(() => ({ ready: window.__torqueWorld.snapshot().inspection?.ready,
            visible: window.__torqueWorld.overlaySample().studyVisible,
            chapter: document.querySelector('.torque-hud').dataset.torqueHudChapter,
            tech: !!document.querySelector('.torque-hud__tech'), cue: !!document.querySelector('.torque-hud__cue'),
            cutter: !!document.querySelector('.torque-hud__caption .torque-inspection__toggle') }))
          gate(`${name}: delayed shaft asset holds Mechanism`, cold.ready === false && cold.visible === false
            && cold.chapter === 'mechanism' && !cold.tech && !cold.cue && !cold.cutter, cold)
          released = true; releaseStudy()
        }
        await page.waitForFunction(() => window.__torqueWorld.snapshot().inspection?.ready, null, { timeout: 120000 })
      }
      await page.waitForTimeout(700)
    }
    for (const p of [...points, .6199, .62, .845]) {
      await seek(p)
      const sample = await page.evaluate(() => {
        const rect = selector => {
          const e = document.querySelector(selector)
          if (!e) return null
          const r = e.getBoundingClientRect(), s = getComputedStyle(e)
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height,
            visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden' }
        }
        const separate = (a, b) => !a?.visible || !b?.visible || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
        const rail = rect('.torque-hud__rail'), tech = rect('.torque-hud__tech'), caption = rect('.torque-hud__caption'), freeLook = rect('.torque-freelook-toggle')
        const bar = document.querySelector('.torque-hud__fos-scale')
        const siblings = () => Object.fromEntries(['.torque-hud__fos-title', '.torque-hud__fos-ticks', '.torque-hud__tech-attempts', '.torque-hud__tech-note', '.torque-hud__fos-marker'].map(s => {
          const e = document.querySelector(s), r = e.getBoundingClientRect(), c = getComputedStyle(e)
          return [s, { width: r.width, height: s.endsWith('marker') ? undefined : r.height, font: c.font, padding: c.padding, margin: c.margin }]
        }))
        let fos = null
        if (bar) {
          const current = siblings(), height = bar.getBoundingClientRect().height
          bar.style.height = '.6rem'
          const original = siblings()
          bar.style.removeProperty('height')
          fos = { height, expected: parseFloat(getComputedStyle(document.documentElement).fontSize) * .9,
            siblingsUnchanged: JSON.stringify(current) === JSON.stringify(original), current, original,
            markerWidth: document.querySelector('.torque-hud__fos-marker').getBoundingClientRect().width }
        }
        return { actual: window.__torqueNarrative.snapshot().progress,
          studyVisible: window.__torqueWorld.overlaySample().studyVisible,
          chapter: document.querySelector('.torque-hud').dataset.torqueHudChapter,
          title: document.querySelector('.torque-hud__title').textContent,
          railChapter: document.querySelector('.torque-hud__rail-button[aria-current="step"]')?.textContent,
          tech: !!tech, cutter: !!document.querySelector('.torque-hud__caption .torque-inspection__toggle'),
          cue: !!document.querySelector('.torque-hud__cue'), leaderNodes: document.querySelectorAll('.torque-hud__leader').length,
          anchorPresent: 'studyAnchor' in window.__torqueWorld.overlaySample(),
          rects: { rail, tech, caption, freeLook }, fos,
          railClear: separate(rail, tech) && separate(rail, caption) && separate(rail, freeLook),
          railInViewport: rail.left >= 0 && rail.right <= innerWidth && rail.bottom <= innerHeight,
          railAtBottom: rail.top > innerHeight * .8,
          rows: [...document.querySelectorAll('.torque-hud__rail-button')].map(e => e.textContent) }
      })
      sample.viewport = name; sample.requested = p
      const inspection = p >= .62 && p < .845
      gate(`${name} ${p}: correct chrome`, sample.chapter === (inspection ? 'inspection' : 'mechanism')
        && sample.tech === inspection && sample.cutter === inspection && sample.cue === inspection, sample.chapter)
      gate(`${name} ${p}: no leader`, sample.leaderNodes === 0 && !sample.anchorPresent)
      gate(`${name} ${p}: rail clear/in viewport`, sample.railClear && sample.railInViewport && (name !== 'desktop' || sample.railAtBottom), sample.rects)
      if (inspection) gate(`${name} ${p}: FOS height/siblings`, Math.abs(sample.fos.height - sample.fos.expected) < .02
        && sample.fos.siblingsUnchanged && sample.fos.markerWidth === 2, sample.fos)
      report.samples.push(sample)
      const file = `${name}-${p.toFixed(4)}.png`
      if (!report.samples.slice(0, -1).some(s => s.viewport === name && s.requested === p)) await page.screenshot({ path: `${out}/${file}` })
    }
    // Existing labels, keyboard activation, active rail semantics and Inspection seek.
    if (name === 'narrow') await page.locator('.torque-hud__chapters-toggle').click()
    const inspectionButton = page.locator('.torque-hud__rail-button').filter({ hasText: 'Inspection' })
    await inspectionButton.focus(); await inspectionButton.press('Enter')
    await page.waitForFunction(() => Math.abs(window.__torqueNarrative.snapshot().progress - .621) < .0001, null, { timeout: 30000 })
    const interaction = await page.evaluate(() => ({ progress: window.__torqueNarrative.snapshot().progress,
      chapter: document.querySelector('.torque-hud').dataset.torqueHudChapter,
      active: document.querySelector('.torque-hud__rail-button[aria-current="step"]')?.textContent,
      expanded: document.querySelector('.torque-hud__chapters-toggle').getAttribute('aria-expanded') }))
    report.interactions.push({ viewport: name, ...interaction })
    gate(`${name}: keyboard Inspection seek`, interaction.chapter === 'inspection' && interaction.active.includes('Inspection') && interaction.expanded === 'false', interaction)
    await context.close()
  }
  gate('isolated build assets unchanged throughout probes', JSON.stringify(before) === JSON.stringify(manifest()))
  gate('zero browser errors', report.errors.length === 0, report.errors)
} catch (error) { report.errors.push(String(error)); gate('run completes', false, String(error)) }
finally {
  await browser.close()
  report.status = report.errors.length || report.gates.some(g => !g.pass) ? 'FAIL' : 'PASS'
  writeFileSync(`${out}/review.json`, JSON.stringify(report, null, 2))
  const frames = ['desktop', 'narrow'].map(v => `<h2>${v}</h2>` + points.map(p => `<figure><a href="${v}-${p.toFixed(4)}.png"><img src="${v}-${p.toFixed(4)}.png"></a><figcaption>${p}</figcaption></figure>`).join('')).join('')
  writeFileSync(`${out}/index.html`, `<!doctype html><meta charset="utf-8"><title>JG-040 Stage 3 owner review</title><style>body{background:#13191c;color:#eee;font:16px Arial;padding:24px}figure{display:inline-block;width:46%;margin:1%}img{width:100%}figcaption{padding:8px}</style><h1>JG-040 Stage 3 — pending Mark's review</h1><p>${report.status}; local isolated build; no deployment. Click a frame for full resolution.</p>${frames}`)
  console.log(JSON.stringify({ status: report.status, gates: report.gates.length, failed: report.gates.filter(g => !g.pass), errors: report.errors, out }))
  process.exitCode = report.status === 'PASS' ? 0 : 1
}
