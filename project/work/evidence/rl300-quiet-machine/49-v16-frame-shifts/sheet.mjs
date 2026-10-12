import { createRequire } from 'node:module'
import fs from 'node:fs'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const E = REPO + '/project/work/evidence/rl300-quiet-machine/49-v16-frame-shifts'
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const us = ['200', '340', '580', '825']
const cell = (f, w, h, bx, by, bw) => `<div style="width:${w}px;height:${h}px;background:url('file:///${E}/frames/${f}.png') -${bx}px -${by}px/${bw}px auto no-repeat"></div>`
const S = .7
const sheet = (tier) => `<body style="margin:0;background:#000;color:#9ab;font:12px sans-serif"><div style="display:grid;grid-template-columns:auto auto;gap:6px;padding:6px">
<div style="grid-column:span 2;display:flex;justify-content:space-around"><b>BEFORE (HEAD c7240ad3)</b><b>AFTER (V16 frame shift)</b></div>
${us.map(u => cell(`before-${tier}-u${u}`, 520, 392, 700 * S, 60 * S, 1440 * S) + cell(`after-${tier}-u${u}`, 520, 392, 700 * S, 60 * S, 1440 * S)).join('')}
</div></body>`
const phone = `<body style="margin:0;background:#000;color:#9ab;font:12px sans-serif"><div style="display:flex;gap:6px;padding:6px">
<div><b>BEFORE</b><img src="file:///${E}/frames/before-phone-u580.png" width="390"></div><div><b>AFTER</b><img src="file:///${E}/frames/after-phone-u580.png" width="390"></div></div></body>`
const browser = await chromium.launch()
for (const [name, html, w, h] of [['sheet-full', sheet('full'), 1060, 1620], ['sheet-lite', sheet('lite'), 1060, 1620], ['sheet-phone', phone, 800, 900]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } })
  fs.writeFileSync(`${E}/${name}.html`, html)
  await p.goto(`file:///${E}/${name}.html`); await p.waitForTimeout(500)
  await p.screenshot({ path: `${E}/${name}.png`, fullPage: true }); await p.close()
}
await browser.close()
for (const n of ['sheet-full', 'sheet-lite', 'sheet-phone']) fs.unlinkSync(`${E}/${n}.html`)
