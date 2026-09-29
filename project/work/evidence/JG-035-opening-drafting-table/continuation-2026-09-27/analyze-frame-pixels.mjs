import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const base = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const frames = [
  ['frames-retry/p0.0600-1600x900.png', 0.06],
  ['frames/p0.0660-1600x900.png', 0.066],
  ['frames/p0.0720-1600x900.png', 0.072],
  ['frames/p0.0780-1600x900.png', 0.078],
  ['frames/p0.0840-1600x900.png', 0.084],
]

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

const analyze = fs.readFileSync(path.join(base, 'analyze-frame-pixels.page.mjs'), 'utf8')
const results = []
for (const [rel, progress] of frames) {
  const file = path.join(base, rel)
  const dataUrl = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64')
  const stats = await page.evaluate(([src, code]) => {
    const fnSrc = code.replace(/^export default\s*/, '')
    const mod = new Function('return ' + fnSrc)()
    return mod(src)
  }, [dataUrl, analyze])
  results.push({ progress, ...stats })
  console.log(JSON.stringify({ progress, ...stats }))
}

fs.writeFileSync(path.join(base, 'frame-pixel-analysis.json'), JSON.stringify(results, null, 2))
await browser.close()
