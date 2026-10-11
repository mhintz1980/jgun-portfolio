// Shared helpers for the GPU-2 capture scripts. Lives in scratch; imports repo modules by absolute path.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const R = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
export const E = R + '/project/work/evidence/rl300-quiet-machine/32-gpu-2'
export const BASE = 'http://localhost:4173'
const req = createRequire(R + '/package.json')
export const { chromium } = req('playwright')
export const THREE = req('three')
const imp = p => import(pathToFileURL(R + '/' + p).href)
export const { launchBrowser, describeLaunch } = await imp('scripts/lib/browser-launch.mjs')
export const { pixels, compare } = await imp('scripts/lib/preview-pixels.mjs')
export const shotMod = await imp('src/scene/rl300/shot.ts')
export const { SHOTS, evaluateShot } = shotMod

export const sha = b => crypto.createHash('sha256').update(b).digest('hex')
export const write = (name, data) => { fs.mkdirSync(path.dirname(path.join(E, name)), { recursive: true }); fs.writeFileSync(path.join(E, name), data) }
export const writeJson = (name, obj) => write(name, JSON.stringify(obj, null, 2))

/** Non-flat fraction against the stage background #101b24 (per-channel delta > 8), the GPU-1 blank test. */
export function nonFlat(png) {
  const p = pixels(png), bg = [0x10, 0x1b, 0x24]
  let n = 0
  for (let i = 0; i < p.width * p.height; i++) {
    const o = i * p.channels
    if (Math.abs(p.data[o] - bg[0]) > 8 || Math.abs(p.data[o + 1] - bg[1]) > 8 || Math.abs(p.data[o + 2] - bg[2]) > 8) n++
  }
  return n / (p.width * p.height)
}

export async function open(browser, { w, h, qs = '?quality=full', video, path: p = '/quiet-machine/' }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1,
    ...(video ? { recordVideo: { dir: video, size: { width: w, height: h } } } : {}) })
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', e => page.errors.push('pageerror: ' + String(e)))
  page.on('console', m => { if (m.type() === 'error') page.errors.push('console: ' + m.text()) })
  const url = `${BASE}${p}${qs}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
  page.url0 = url
  return { ctx, page, url }
}

// The verifier's helper, unchanged.
export async function seek(page, u) {
  const frame = await page.evaluate(u => { const q = window.__quietMachine; const f = q.frame; q.seek(u); return f }, u)
  await page.waitForFunction(f => window.__quietMachine.frame > f, frame)
  await page.waitForFunction(u => Number(document.querySelector('input[type=range]').value) === Math.round(u * 1000), u)
}

/** seek, wait 500 ms, and confirm the frame counter is at rest. */
export async function seekRest(page, u) {
  await seek(page, u)
  await page.waitForTimeout(500)
  for (let i = 0; i < 6; i++) {
    const a = await page.evaluate(() => window.__quietMachine.frame)
    await page.waitForTimeout(150)
    const b = await page.evaluate(() => window.__quietMachine.frame)
    if (a === b) return
  }
}

export function readProof(page) {
  return page.evaluate(() => {
    const q = window.__quietMachine
    const { seek, render, setCaps, ribbons, parts, ...rest } = q
    const entries = performance.getEntriesByType('resource').map(e => e.name).filter(n => /\.glb(\?|$)/.test(n))
    const glbs = [...new Set(entries.map(n => n.split('/').pop().split('?')[0]))]
    const poster = !!document.querySelector('.qm-poster')
    const canvases = document.querySelectorAll('.qm-stage canvas').length
    const tier = glbs.includes('msp-enclosure.glb') ? 'full' : glbs.includes('rl300-lite.glb') ? 'lite' : (poster && !canvases ? 'poster' : 'unknown')
    const policies = {}
    for (const p of Object.values(parts || {})) policies[p.policy] = (policies[p.policy] || 0) + 1
    const triSum = Object.values(parts || {}).reduce((s, p) => s + (p.triangles || 0), 0)
    const rect = document.querySelector('.qm-stage canvas')?.getBoundingClientRect()
    return { ...rest, partCount: Object.keys(parts || {}).length, partPolicies: policies, partTriangleSum: triSum,
      glbsRequested: glbs, poster, canvases, tier,
      rangeValue: Number(document.querySelector('input[type=range]')?.value),
      scrollY: window.scrollY, scrollHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight,
      canvasRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      htmlFade: document.documentElement.getAttribute('data-fade') }
  })
}

export const readParts = page => page.evaluate(() => window.__quietMachine.parts)

/**
 * seek, rest, screenshot the VIEWPORT (never fullPage), then read the proof and write <name>.json.
 * `qs` is the query the page was opened with (recorded; the tier is derived independently).
 */
export async function capture(page, name, u, { w, h, qs = '?quality=full', pngPath, extra = {} } = {}) {
  await seekRest(page, u)
  const png = await page.screenshot({ path: path.join(E, pngPath || name + '.png') })
  const proof = await readProof(page)
  const requestedTier = (new URLSearchParams(qs.replace(/^\?/, '')).get('quality')) || 'default'
  const meta = {
    name, file: pngPath || name + '.png', pngBytes: png.length, pngSha256: sha(png),
    tier: proof.tier, requestedTier, tierMatchesRequest: requestedTier === 'default' ? null : proof.tier === requestedTier,
    u: proof.u, requestedU: u, uMatchesRequest: Math.abs(proof.u - u) < 1e-9 && proof.rangeValue === Math.round(u * 1000),
    ready: proof.ready, viewport: { width: w, height: h }, url: page.url(), nonFlatFraction: nonFlat(png),
    gpu: proof.gpu, stageSize: proof.size, canvasRect: proof.canvasRect,
    frame: proof.frame, cutPlane: proof.cutPlane, camera: proof.camera, fov: proof.fov,
    drawCalls: proof.drawCalls, renderedTriangles: proof.triangles, geometries: proof.geometries, textures: proof.textures,
    counts: proof.counts, partCount: proof.partCount, partPolicies: proof.partPolicies, partTriangleSum: proof.partTriangleSum,
    glbsRequested: proof.glbsRequested, rangeValue: proof.rangeValue, scrollY: proof.scrollY, htmlFade: proof.htmlFade,
    caps: proof.caps, composed: proof.composed, pageErrors: [...page.errors], ...extra,
  }
  write((pngPath || name + '.png').replace(/\.png$/, '.json'), JSON.stringify(meta, null, 2))
  return { png, proof, meta }
}

/** Verifier's intake computation, reproduced: worst |ndc| over the 8 projected model-AABB corners. */
export function worstNdc(projection) {
  const xs = projection.map(p => p[0]), ys = projection.map(p => p[1])
  return { worst: Math.max(...xs.map(Math.abs), ...ys.map(Math.abs)), xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) }
}

/** Rebuild the live camera from proof values with three, in Node. */
export function rebuildCamera(proof) {
  const portrait = proof.size.width < 600
  const s = evaluateShot(proof.u, portrait)
  const cam = new THREE.PerspectiveCamera(proof.fov, proof.size.width / proof.size.height, .02, 60)
  cam.position.set(...proof.camera); cam.lookAt(...s.target); cam.updateProjectionMatrix(); cam.updateMatrixWorld()
  cam.updateMatrixWorld(true)
  const posErr = Math.max(...s.position.map((v, i) => Math.abs(v - proof.camera[i])))
  return { cam, target: s.target, portrait, posErr }
}

// ---- compositor: Chromium page as canvas (no sharp / canvas / ImageMagick in node_modules) ----
export async function compose(browser, { w, h, html }) {
  const page = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><meta charset=utf-8><style>
    html,body{margin:0;background:#0b1117;color:#e8eef2;font:14px/1.3 Consolas,monospace}
    .lbl{background:#000a;color:#fff;padding:3px 7px;font:13px Consolas,monospace;position:absolute;left:0;top:0;white-space:pre-wrap;max-width:100%;box-sizing:border-box}
    .cell{position:relative;display:inline-block;vertical-align:top;overflow:hidden}
    img{display:block}
  </style><body>${html}</body>`)
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))))
  return page
}
export const dataUrl = buf => 'data:image/png;base64,' + buf.toString('base64')
