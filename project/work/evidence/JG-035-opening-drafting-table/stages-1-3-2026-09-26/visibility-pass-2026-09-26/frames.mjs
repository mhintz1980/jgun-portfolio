// Scratch: capture opening frames at 1600x900 for quick visual checks.
// One fresh page per frame, retried on WebGL context loss (intermittent under GPU pressure).
import { chromium } from 'playwright'
const points = (process.argv[2] ?? '0.06,0.0666,0.0696,0.072,0.078,0.09,0.102').split(',').map(Number)
const out = process.argv[3] ?? '.scratch/frames'
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11', '--enable-gpu'] })
async function capture(p) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  let lost = false
  page.on('console', m => { if (/Context Lost/.test(m.text())) lost = true })
  try {
    await page.goto('http://localhost:5199', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 90000 })
    await page.evaluate(v => window.__drawingProof.setProgress(v), p)
    await page.waitForTimeout(2500)
    const t = await page.evaluate(() => { const d = window.__telemetry.drawing, s = window.__drawingProof.sheetStats(); return { tier: window.__telemetry.performance?.tier, phase: d.phase, poseT: d.poseT, pbr: d.pbr, flex: s.flexPeakDisplacement, vellum: s.vellum, contact: s.contactShadow, radius: s.contactRadius } })
    if (!lost) await page.screenshot({ path: `${out}/p${p.toFixed(4)}.png` })
    return { lost, t }
  } finally { await page.close() }
}
for (const p of points) {
  let r = await capture(p)
  if (r.lost) r = await capture(p)
  console.log(p, r.lost ? 'CONTEXT LOST' : JSON.stringify(r.t))
}
await browser.close()
