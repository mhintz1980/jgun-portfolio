/** Small visual proposal, never a completion verifier. Native scroll only. */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { launchBrowser } from './lib/browser-launch.mjs'

const args = Object.fromEntries(process.argv.slice(2).map(x => x.replace(/^--/, '').split('=')))
const out = args.out ?? 'output/playwright/page-cinematography-2026-10-27/preview'
mkdirSync(out, { recursive: true })
const browser = await launchBrowser(chromium)
const report = { status: 'INCOMPLETE', purpose: 'owner visual proposal', samples: [], errors: [] }
try {
  const page = await browser.newPage({ viewport: { width: Number(args.width ?? 1440), height: Number(args.height ?? 900) }, deviceScaleFactor: 1 })
  page.on('pageerror', e => report.errors.push(String(e)))
  await page.goto(args.url ?? 'http://localhost:5199/torque-wrench/?quality=full', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__torqueWorld?.snapshot().ready && window.__torqueNarrative, null, { timeout: 120000 })
  for (const p of (args.points ?? '.685,.701,.717').split(',').map(Number)) {
    await page.evaluate(p => window.scrollTo({ top: window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }), p)
    // Native scrolling lands on integer CSS pixels; use the production seek
    // reachability tolerance, separate from camera/subject replay tolerances.
    await page.waitForFunction(p => Math.abs(window.__torqueNarrative.snapshot().progress - p) <= .00005, p, { timeout: 30000 })
    if (p >= .62 && p <= .825) await page.waitForFunction(() => window.__torqueWorld.snapshot().inspection?.ready, null, { timeout: 120000 })
    await page.waitForTimeout(1600)
    const sample = await page.evaluate(() => ({ narrative: window.__torqueNarrative.snapshot(), world: window.__torqueWorld.snapshot(), motion: window.__torqueWorld.motionSample?.(), cinematography: window.__torqueWorld.cinematography?.(), hud: [...document.querySelectorAll('.torque-chapter__header, .torque-chapter__body, .torque-inspection__toggle, .torque-freelook-toggle, [data-shaft-card], [data-shaft-fos-model], .shaft-fos-bar, .torque-nav')].filter(e => { for (let a=e; a; a=a.parentElement) { if(getComputedStyle(a).visibility === 'hidden' || Number(getComputedStyle(a).opacity) < .01 || getComputedStyle(a).display === 'none') return false } return true }).map(e => { const r = e.getBoundingClientRect(); return { selector: e.className, min: [r.left, r.top], max: [r.right, r.bottom] } }).filter(r=>r.max[0]>0&&r.min[0]<innerWidth&&r.max[1]>0&&r.min[1]<innerHeight) }))
    sample.requestedProgress = p
    sample.image = `${out}/p-${p.toFixed(5)}.png`
    await page.screenshot({ path: sample.image })
    report.samples.push(sample)
    console.log(JSON.stringify({ image: sample.image, progress: sample.narrative.progress, time: sample.motion?.time }))
  }
} finally {
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2))
  await browser.close()
}
