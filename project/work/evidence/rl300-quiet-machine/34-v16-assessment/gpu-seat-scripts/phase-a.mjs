// GPU-2 phase A: section holds, 7-shot sheets, header/end card + probes, lite vs full.
import fs from 'node:fs'
import path from 'node:path'
import { E, SHOTS, launchBrowser, chromium, describeLaunch, open, capture, seekRest, readProof, compose, dataUrl, writeJson, write, compare, worstNdc, sha } from './common.mjs'

const browser = await launchBrowser(chromium)
const log = {}
const mid = s => +((s.from + s.to) / 2).toFixed(4)
const pct = n => (n * 100).toFixed(2) + '%'

async function sheet(browser, tiles, { cols, tileW, tileH, out, title }) {
  // tiles: [{png, label}], scaled to tileW x tileH
  const cells = tiles.map(t => `<div class="cell" style="width:${tileW}px;height:${tileH}px"><img style="width:${tileW}px;height:${tileH}px" src="${dataUrl(t.png)}"><div class="lbl">${t.label}</div></div>`).join('')
  const rows = Math.ceil(tiles.length / cols)
  const page = await compose(browser, { w: cols * tileW, h: rows * tileH + 34,
    html: `<div style="height:34px;line-height:34px;padding-left:8px;font-weight:bold">${title}</div><div style="width:${cols * tileW}px;font-size:0">${cells}</div>` })
  const buf = await page.screenshot({ path: path.join(E, out), fullPage: true })
  await page.close()
  return buf
}

// ---- 1. section holds + 7-shot sheets ----
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const vp = `${w}x${h}`
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full' })
  const hold = {}
  for (const [tag, u] of [['u34', .34], ['u51', .51]]) {
    const r = await capture(page, `${tag}-${vp}`, u, { w, h })
    hold[tag] = { tier: r.meta.tier, u: r.meta.u, uMatch: r.meta.uMatchesRequest, nonFlat: r.meta.nonFlatFraction }
  }
  const tiles = []
  for (let i = 0; i < SHOTS.length; i++) {
    const u = mid(SHOTS[i])
    const r = await capture(page, `sheet-tile-${vp}-shot${i + 1}`, u, { w, h, pngPath: `sheet-tiles/${vp}-shot${i + 1}.png`, extra: { shot: i + 1, shotTitle: SHOTS[i].title } })
    tiles.push({ png: r.png, label: `SHOT ${i + 1}/7 &middot; u=${u.toFixed(3)} &middot; tier=${r.meta.tier} &middot; ${SHOTS[i].title}` })
  }
  const cols = w > 600 ? 2 : 4, tileW = w > 600 ? 960 : 390, tileH = w > 600 ? 600 : 844
  await sheet(browser, tiles, { cols, tileW, tileH, out: `sheet-${vp}.png`, title: `Quiet Machine contact sheet ${vp}, ?quality=full, shot midpoints from SHOTS (shot.ts); tiles are full viewport at dsf 1 (scaled ${tileW}px wide)` })
  log['hold-sheet-' + vp] = { hold, tilesTiers: tiles.map(t => t.label) }
  await ctx.close()
}

// ---- 2. header + end card + probes ----
const probes = {}
for (const [w, h] of [[390, 667], [390, 844]]) {
  const vp = `${w}x${h}`
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full' })
  const head = await capture(page, `header-${vp}`, 0, { w, h })
  const navAt0 = await page.evaluate(() => [...document.querySelectorAll('nav, [role=navigation]')].map(n => ({ label: n.getAttribute('aria-label'), cls: n.className, within: n.closest('.qm-header') ? 'header' : n.closest('.qm-endcard') ? 'endcard' : 'other', display: getComputedStyle(n).display, text: n.textContent.trim().replace(/\s+/g, ' ') })))
  // overlap header/editorial across beats
  const overlaps = []
  for (let i = 0; i < SHOTS.length; i++) {
    await seekRest(page, i === 0 ? 0 : mid(SHOTS[i]))
    const o = await page.evaluate(() => {
      const a = document.querySelector('.qm-header').getBoundingClientRect(), b = document.querySelector('.qm-editorial').getBoundingClientRect()
      const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
      return { header: [a.left, a.top, a.right, a.bottom].map(v => +v.toFixed(1)), editorial: [b.left, b.top, b.right, b.bottom].map(v => +v.toFixed(1)), overlapW: +ox.toFixed(1), overlapH: +oy.toFixed(1), overlapArea: +(ox * oy).toFixed(0), title: document.querySelector('.qm-editorial h1')?.textContent }
    })
    overlaps.push({ shot: i + 1, u: i === 0 ? 0 : mid(SHOTS[i]), ...o })
  }
  const end = await capture(page, `endcard-${vp}`, .98, { w, h })
  const endProbe = await page.evaluate(() => {
    const cur = location.pathname
    const navs = [...document.querySelectorAll('nav, [role=navigation]')].map(n => ({ label: n.getAttribute('aria-label'), cls: n.className, within: n.closest('.qm-header') ? 'header' : n.closest('.qm-endcard') ? 'endcard' : 'other', display: getComputedStyle(n).display, visibility: getComputedStyle(n).visibility }))
    const links = scope => [...document.querySelectorAll(scope + ' a')].map(a => ({ text: a.textContent.trim().replace(/\s+/g, ' '), href: a.getAttribute('href'), resolvedPath: new URL(a.href).pathname, hasDataFade: a.hasAttribute('data-fade'), ariaCurrent: a.getAttribute('aria-current'), selfLink: new URL(a.href).pathname === cur }))
    const reserved = [...document.querySelectorAll('.qm-endcard .shell-nav-reserved, .qm-header .shell-nav-reserved')].map(e => e.textContent.trim().replace(/\s+/g, ' '))
    const numberRe = /(^|\W)0?[13](\W|$)|\b0[13]\b/
    const scopes = ['.qm-header nav', '.qm-endcard']
    const texts = scopes.map(s => ({ scope: s, text: document.querySelector(s)?.textContent.trim().replace(/\s+/g, ' ') ?? null }))
    const pseudo = []
    for (const s of scopes) for (const el of document.querySelectorAll(s + ', ' + s + ' *')) for (const p of ['::before', '::after']) {
      const c = getComputedStyle(el, p).content
      if (c && c !== 'none' && c !== 'normal') pseudo.push({ el: el.tagName + '.' + el.className, p, content: c })
    }
    const counters = scopes.flatMap(s => [...document.querySelectorAll(s + ', ' + s + ' *')].map(el => getComputedStyle(el).counterIncrement).filter(c => c && c !== 'none'))
    const digits = texts.map(t => ({ scope: t.scope, matches: (t.text || '').match(/\b0?[13]\b/g) }))
    return { path: cur, navLandmarks: navs, headerLinks: links('.qm-header nav'), endcardLinks: links('.qm-endcard'), reserved, texts, pseudo, counters, digits, eyebrow: document.querySelector('.qm-eyebrow')?.textContent.trim() }
  })
  probes[vp] = { headerCapture: head.meta.file, endcardCapture: end.meta.file, navAt0, endProbe, overlaps, endcardUMatches: end.meta.uMatchesRequest, endcardRendered: await page.evaluate(() => !!document.querySelector('.qm-endcard')) }
  await ctx.close()
}
for (const [w, h] of [[1440, 900], [768, 1024]]) {
  const vp = `${w}x${h}`
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full' })
  const end = await capture(page, `endcard-${vp}`, .98, { w, h })
  probes[vp] = { endcardCapture: end.meta.file, endcardRendered: await page.evaluate(() => !!document.querySelector('.qm-endcard')), uMatches: end.meta.uMatchesRequest }
  await ctx.close()
}
writeJson('probes-header-endcard.json', probes)

// ---- 3. lite vs full ----
const lvf = { runAt: new Date().toISOString(), rows: [] }
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const vp = `${w}x${h}`
  const pages = {}
  for (const tier of ['full', 'lite']) pages[tier] = await open(browser, { w, h, qs: `?quality=${tier}` })
  for (const [tag, u] of [['u34', .34], ['u51', .51]]) {
    const rr = {}
    for (const tier of ['full', 'lite']) {
      const r = await capture(pages[tier].page, `lite-vs-full-${tag}-${vp}-${tier}`, u, { w, h, qs: `?quality=${tier}`, pngPath: `lite-vs-full-tiles/${tag}-${vp}-${tier}.png` })
      const c = r.meta.counts
      rr[tier] = { meta: r.meta, png: r.png, airwayDerived: c.sourceTriangles - c.keptTriangles - c.linerTriangles - c.removedTriangles, ndc: worstNdc(r.proof.projection) }
    }
    const diff = compare(rr.full.png, rr.lite.png)
    const page = await compose(browser, { w: 2 * w, h: h + 34, html: `<div style="width:${2 * w}px;font-size:0">` +
      ['full', 'lite'].map(t => `<div class="cell" style="width:${w}px;height:${h + 34}px"><div style="font:bold 14px Consolas;height:34px;line-height:34px;color:#fff;background:#223;font-size:14px;padding-left:8px">${t.toUpperCase()} (resolved tier=${rr[t].meta.tier}) &middot; u=${u} &middot; ${vp} &middot; glb=${rr[t].meta.glbsRequested.join(',')}</div><img src="${dataUrl(rr[t].png)}"></div>`).join('') + '</div>' })
    await page.screenshot({ path: path.join(E, `lite-vs-full-${tag}-${vp}.png`), fullPage: true })
    await page.close()
    lvf.rows.push({ viewport: vp, u, tag, pixelDiff: diff, tiers: Object.fromEntries(['full', 'lite'].map(t => [t, {
      resolvedTier: rr[t].meta.tier, requested: rr[t].meta.requestedTier, glbs: rr[t].meta.glbsRequested, counts: rr[t].meta.counts,
      airwayHelperDerived: rr[t].airwayDerived, renderedTriangles: rr[t].meta.renderedTriangles, drawCalls: rr[t].meta.drawCalls, geometries: rr[t].meta.geometries, textures: rr[t].meta.textures,
      partCount: rr[t].meta.partCount, partPolicies: rr[t].meta.partPolicies, partTriangleSum: rr[t].meta.partTriangleSum,
      projectionNdc: rr[t].ndc, stageSize: rr[t].meta.stageSize, gpu: rr[t].meta.gpu, pngBytes: rr[t].meta.pngBytes, nonFlat: rr[t].meta.nonFlatFraction }])) })
  }
  for (const t of ['full', 'lite']) await pages[t].ctx.close()
}
writeJson('lite-vs-full-telemetry.json', lvf)
writeJson('phase-a-log.json', { log, launch: describeLaunch() })
await browser.close()
console.log('phase A done')
