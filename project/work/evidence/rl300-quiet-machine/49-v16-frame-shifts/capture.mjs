// Before/after frames for the V16 frame shift. base = HEAD c7240ad3 build, after = same + prepareModel.ts edit.
import { createRequire } from 'node:module'
import fs from 'node:fs'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const OUT = REPO + '/project/work/evidence/rl300-quiet-machine/49-v16-frame-shifts/frames'
const builds = [['before', 4301], ['after', 4302]]
const shots = [
  ['full', 1440, 900, 1, [0.2, 0.34, 0.58, 0.825]],
  ['lite', 1440, 900, 1, [0.2, 0.34, 0.58, 0.825]],
  ['phone', 390, 844, 2, [0.58]],
]
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
for (const [label, port] of builds) {
  for (const [tier, w, h, dpr, us] of shots) {
    const quality = tier === 'lite' ? 'lite' : 'full'
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
    await page.goto(`http://localhost:${port}/quiet-machine/?quality=${quality}`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 90000 })
    for (const u of us) {
      await page.evaluate(async (u) => {
        const q = window.__quietMachine
        for (let k = 0; k < 4; k++) { const f = q.frame; q.seek(u); let n = 0; while (q.frame === f && n++ < 60) await new Promise(r => requestAnimationFrame(r)) }
        await new Promise(r => setTimeout(r, 400))
      }, u)
      await page.screenshot({ path: `${OUT}/${label}-${tier}-u${String(Math.round(u * 1000)).padStart(3, '0')}.png` })
    }
    await page.close()
  }
}
await browser.close()
console.log(fs.readdirSync(OUT).length, 'frames')
