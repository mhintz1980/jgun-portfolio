// Raster reclassification evidence (2026-10-06 follow-up).
//
// Question: the blockout report defect note "artifact-label-corrected" claims all 24
// canvas locator captures "included DOM overlays" and relabelled them
// -dom-overlay-bounds.png, while capture.mjs records that each canvas capture was
// taken with .ring-inspection-portal visibility hidden (clean_canvas_capture).
// Decide which classification is true by decoding every capture pair in headless
// Chromium and comparing pixels inside the measured portal DOM rects vs everywhere else.
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const out = path.dirname(fileURLToPath(import.meta.url))
const report = JSON.parse(await fs.readFile(path.join(out, 'report.json'), 'utf8'))
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
await page.goto('about:blank')
const rows = []
for (const a of report.anchors) {
  const overlayName = a.layout + '-' + a.name + '-dom-overlay-bounds.png'
  const fullB = await fs.readFile(path.join(out, a.full_png))
  const overlayB = await fs.readFile(path.join(out, overlayName)).catch(() => null)
  if (!overlayB) { rows.push({ layout: a.layout, name: a.name, overlay_png: 'missing' }); continue }
  const stats = await page.evaluate(async (arg) => {
    const decode = async (b64) => {
      const blob = await (await fetch('data:image/png;base64,' + b64)).blob()
      const bmp = await createImageBitmap(blob)
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(bmp, 0, 0)
      return ctx.getImageData(0, 0, c.width, c.height)
    }
    const i1 = await decode(arg.fullB64), i2 = await decode(arg.overlayB64)
    const rects = Object.values(arg.dom).filter((r) => r && r.max && r.max[1] > r.min[1])
      .map((r) => ({ x0: r.min[0] - 2, x1: r.max[0] + 2, y0: r.min[1] - 2, y1: r.max[1] + 2 }))
    const insideAny = (x, y) => rects.some((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1)
    const region = (r, invert) => {
      const x0 = Math.max(0, Math.floor(r.min[0])), x1 = Math.min(i1.width, Math.ceil(r.max[0]))
      const y0 = Math.max(0, Math.floor(r.min[1])), y1 = Math.min(i1.height, Math.ceil(r.max[1]))
      let sum = 0, n = 0, gt8 = 0
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          if (invert ? insideAny(x, y) : !insideAny(x, y)) continue
          const p1 = (y * i1.width + x) * 4, p2 = (y * i2.width + x) * 4
          const d = (Math.abs(i1.data[p1] - i2.data[p2]) + Math.abs(i1.data[p1 + 1] - i2.data[p2 + 1]) + Math.abs(i1.data[p1 + 2] - i2.data[p2 + 2])) / 3
          sum += d; n++; if (d > 8) gt8++
        }
      }
      return { mean_diff: +(sum / Math.max(n, 1)).toFixed(2), frac_gt8: +(gt8 / Math.max(n, 1)).toFixed(4), samples: n }
    }
    const regions = {}
    for (const [k, r] of Object.entries(arg.dom)) if (r && r.max && r.max[1] > r.min[1]) regions[k] = region(r, false)
    return {
      size_full: [i1.width, i1.height], size_overlay: [i2.width, i2.height],
      regions,
      outside_all_dom: region({ min: [0, 0], max: [i1.width, i1.height] }, true),
    }
  }, { fullB64: fullB.toString('base64'), overlayB64: overlayB.toString('base64'), dom: a.dom })
  rows.push({ layout: a.layout, name: a.name, time: a.time, overlay_png: overlayName, identical_bytes: fullB.equals(overlayB), ...stats })
  console.log('RASTER', a.layout, a.name, 'outside', stats.outside_all_dom.mean_diff, 'card', stats.regions.card ? stats.regions.card.mean_diff : null, 'footer', stats.regions.footer ? stats.regions.footer.mean_diff : null)
}
await browser.close()
const decided = rows.filter((r) => r.regions)
const portalDomAbsent = decided.filter((r) => ['card', 'header', 'footer'].every((k) => (r.regions[k] ? r.regions[k].mean_diff : 0) > 10))
const outsideQuiet = decided.filter((r) => r.outside_all_dom.mean_diff <= 2 && r.outside_all_dom.frac_gt8 <= 0.01)
const summary = {
  schema: 1,
  generated_utc: new Date().toISOString(),
  method: 'Headless Chromium canvas decode of every capture pair; mean per-channel absolute difference sampled every 2 px inside each measured portal DOM rect (same report.json anchor row) and everywhere outside all DOM rects (2 px dilation). The full-page capture always shows the portal; if the -dom-overlay-bounds capture was taken with the portal hidden, the DOM rects differ strongly while pixels outside the DOM stay identical.',
  question: 'Are the -dom-overlay-bounds.png files full-DOM composites (defect note artifact-label-corrected) or clean canvas rasters captured with .ring-inspection-portal visibility hidden (capture.mjs clean_canvas_capture)?',
  rows,
  row_count: rows.length,
  portal_dom_absent_in_overlay_count: portalDomAbsent.length,
  outside_dom_quiet_count: outsideQuiet.length,
  identical_bytes_count: rows.filter((r) => r.identical_bytes).length,
}
await fs.writeFile(path.join(out, 'raster-reclassification.json'), JSON.stringify(summary, null, 2) + '\n')
console.log('PORTAL_DOM_ABSENT_IN_OVERLAY', portalDomAbsent.length, 'of', decided.length, 'OUTSIDE_DOM_QUIET', outsideQuiet.length, 'of', decided.length)
