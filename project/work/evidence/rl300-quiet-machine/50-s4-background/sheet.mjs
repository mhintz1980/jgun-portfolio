import { createRequire } from 'node:module'
import fs from 'node:fs'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const E = REPO + '/project/work/evidence/rl300-quiet-machine/50-s4-background'
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const us = ['020', '200', '340', '430', '685', '825', '960']
const W = 648, H = 405
const cell = f => `<div style="width:${W}px;height:${H}px;background:url('file:///${E}/frames/${f}.png') 0 0/${W}px auto no-repeat"></div>`
const full = `<body style="margin:0;background:#000;color:#9ab;font:12px sans-serif"><div style="display:grid;grid-template-columns:auto auto;gap:6px;padding:6px">
<div style="text-align:center"><b>BEFORE (HEAD 9b6d1f52)</b></div><div style="text-align:center"><b>AFTER (S4 layered background, full tier)</b></div>
${us.map(u => cell('before-full-u' + u) + cell('after-full-u' + u)).join('')}</div></body>`
const phone = `<body style="margin:0;background:#000;color:#9ab;font:12px sans-serif"><div style="display:flex;gap:6px;padding:6px">
${['before-phone-u200', 'after-phone-u200', 'before-phone-u580', 'after-phone-u580'].map(f => `<div><b>${f.split('-')[0].toUpperCase()}</b><img src="file:///${E}/frames/${f}.png" width="300"></div>`).join('')}</div></body>`
const browser = await chromium.launch()
for (const [name, html, w, h] of [['sheet-full', full, 1320, 2900], ['sheet-phone', phone, 1250, 700]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } })
  fs.writeFileSync(`${E}/_${name}.html`, html)
  await p.goto(`file:///${E}/_${name}.html`); await p.waitForTimeout(500)
  await p.screenshot({ path: `${E}/${name}.png`, fullPage: true }); await p.close(); fs.unlinkSync(`${E}/_${name}.html`)
}
await browser.close()
