// Frame strip of the recorded clips: N <video> elements, each paused at an evenly spaced time, screenshotted as one grid.
import { createRequire } from 'node:module'
import fs from 'node:fs'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const E = REPO + '/project/work/evidence/rl300-quiet-machine/50-s4-background'
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const N = 8
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1290, height: 900 } })
const html = '<body style="margin:0;background:#000;color:#9ab;font:12px sans-serif">' + ['before', 'after'].map(l =>
  `<div><b>${l} (forward, then reverse; left to right = time)</b></div><div style="display:grid;grid-template-columns:repeat(4,320px);gap:2px">${Array.from({ length: N }, (_, i) => `<video muted preload="auto" data-l="${l}" data-i="${i}" src="file:///${E}/motion/${l}.webm" width="320" height="180"></video>`).join('')}</div>`).join('') + '</body>'
fs.writeFileSync(E + '/_strip.html', html)
await p.goto('file:///' + E + '/_strip.html')
const d = await p.evaluate(async (N) => {
  const vids = [...document.querySelectorAll('video')]
  await Promise.all(vids.map(v => new Promise(r => v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r, { once: true }))))
  let dur = vids[0].duration
  if (!isFinite(dur)) { vids[0].currentTime = 1e9; await new Promise(r => vids[0].addEventListener('seeked', r, { once: true })); dur = vids[0].duration }
  for (const v of vids) {
    const i = +v.dataset.i
    v.currentTime = Math.max(.2, .8 + (dur - 1.4) * i / (N - 1))
    await new Promise(r => v.addEventListener('seeked', r, { once: true }))
  }
  return dur
}, N)
await p.waitForTimeout(600)
await p.screenshot({ path: E + '/strip-motion.png', fullPage: true })
await b.close(); fs.unlinkSync(E + '/_strip.html')
console.log('duration', d)
