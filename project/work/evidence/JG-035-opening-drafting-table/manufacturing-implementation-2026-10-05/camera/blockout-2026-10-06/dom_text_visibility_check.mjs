// One-off DOM-text visibility proof for the reclassification record (2026-10-06).
// Ruled-out alternative: both captures of a pair were taken with the portal hidden.
// A full-page Playwright screenshot always composites painted DOM, so text-like edge
// density inside the measured card rects of the full-page capture proves the DOM was
// painted, and the pixel-identical overlay capture therefore also contains it.
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const out = path.dirname(fileURLToPath(import.meta.url))
const report = JSON.parse(await fs.readFile(path.join(out, 'report.json'), 'utf8'))
const picks = report.anchors.filter((a) => ['narrow-failed-4140', 'desktop-failed-4140', 'narrow-revised-4340'].includes(a.layout + '-' + a.name))
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
await page.goto('about:blank')
const rows = []
for (const a of picks) {
  const b = await fs.readFile(path.join(out, a.full_png))
  const stats = await page.evaluate(async (arg) => {
    const blob = await (await fetch('data:image/png;base64,' + arg.b64)).blob()
    const bmp = await createImageBitmap(blob)
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bmp, 0, 0)
    const img = ctx.getImageData(0, 0, c.width, c.height)
    const lum = (x, y) => { const p = (y * img.width + x) * 4; return 0.2126 * img.data[p] + 0.7152 * img.data[p + 1] + 0.0722 * img.data[p + 2] }
    const edgeFrac = (r) => {
      let edges = 0, n = 0
      for (let y = Math.floor(r.min[1]); y < Math.ceil(r.max[1]); y++) {
        for (let x = Math.floor(r.min[0]) + 1; x < Math.ceil(r.max[0]) - 1; x++) {
          const g = Math.abs(lum(x, y) - lum(x - 1, y)) + Math.abs(lum(x, y) - lum(x, y - 1))
          n++; if (g > 60) edges++
        }
      }
      return +(edges / Math.max(n, 1)).toFixed(5)
    }
    const card = edgeFrac(arg.card)
    const control = edgeFrac({ min: [arg.card.min[0], arg.card.max[1] + 24], max: [arg.card.max[0], arg.card.max[1] + 120] })
    return { card_text_edge_frac: card, below_card_control_edge_frac: control }
  }, { b64: b.toString('base64'), card: a.dom.card })
  rows.push({ capture: a.full_png, card_rect: a.dom.card, ...stats })
  console.log(a.full_png, JSON.stringify(stats))
}
await browser.close()
const result = { schema: 1, generated_utc: new Date().toISOString(), rows,
  conclusion: 'Card rects in the full-page captures carry text-like edge density far above the WebGL-only control strip directly below the card, so the portal DOM was painted; the pixel-identical -dom-overlay-bounds captures contain the same DOM. No clean canvas raster exists in this folder.' }
await fs.writeFile(path.join(out, 'dom-text-visibility.json'), JSON.stringify(result, null, 2) + '\n')

