// Full scroll, forward then reverse, 1280x720 full tier, wheel notches; one clip per build.
import { createRequire } from 'node:module'
import fs from 'node:fs'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const OUT = REPO + '/project/work/evidence/rl300-quiet-machine/50-s4-background/motion'
fs.mkdirSync(OUT, { recursive: true })
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
for (const [label, port] of [['before', 4311], ['after', 4312]]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: OUT + '/_' + label, size: { width: 1280, height: 720 } } })
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${port}/quiet-machine/?quality=full`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 90000 })
  await page.mouse.move(640, 400); await page.waitForTimeout(600)
  for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 144); await page.waitForTimeout(120) }
  await page.waitForTimeout(500)
  for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, -144); await page.waitForTimeout(120) }
  await page.waitForTimeout(500)
  const v = page.video(); await ctx.close()
  fs.renameSync(await v.path(), `${OUT}/${label}.webm`); fs.rmdirSync(OUT + '/_' + label)
}
await browser.close()
console.log(fs.readdirSync(OUT).join(' '))
