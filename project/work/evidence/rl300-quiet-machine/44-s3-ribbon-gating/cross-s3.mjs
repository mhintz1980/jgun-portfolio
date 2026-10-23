import fs from 'node:fs'
import { createRequire } from 'node:module'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const { compare } = await import('file:///' + REPO + '/scripts/lib/preview-pixels.mjs')
const [headBase, newBase] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
async function shots(base, name, width, height, quality, us) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.goto(`${base}/quiet-machine/?quality=${quality}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
  const res = {}
  for (const u of us) {
    const f = await page.evaluate(u => { const q = window.__quietMachine; const f = q.frame; q.seek(u); return f }, u)
    await page.waitForFunction(f => window.__quietMachine.frame > f, f)
    const img = await page.locator('.qm-stage').screenshot()
    const t = await page.evaluate(() => { const q = window.__quietMachine; return { dc: q.drawCalls, tri: q.triangles, plane: q.cutPlane } })
    res[u] = { img, ...t }
  }
  await page.close(); return res
}
const us = [0, .07, .13, .2, .27, .28, .34, .43, .51, .52, .6, .685, .76, .77, .825, .9, .95, .99, 1]
for (const [name, w, h, q] of [['desktop', 1440, 900, 'full'], ['portrait', 390, 844, 'full'], ['tablet', 768, 1024, 'full'], ['lite', 390, 844, 'lite']]) {
  const a = await shots(headBase, name, w, h, q, us), b = await shots(newBase, name, w, h, q, us)
  console.log(name, us.map(u => `${u}:${b[u].plane >= .85 - 1e-6 ? 'C' : 'O'}:${compare(a[u].img, b[u].img, 0).changed}px dc${a[u].dc}>${b[u].dc} tri${a[u].tri}>${b[u].tri}`).join(' | '))
}
await browser.close()
