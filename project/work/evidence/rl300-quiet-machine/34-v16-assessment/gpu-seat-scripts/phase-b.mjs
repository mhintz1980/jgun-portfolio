// GPU-2 phase B: intake close-ups with ndc overlay, reservoir 1019 vs 1020, chevrons, 2a panel candidates.
import fs from 'node:fs'
import path from 'node:path'
import { E, THREE, evaluateShot, launchBrowser, chromium, open, capture, seekRest, readParts, compose, dataUrl, writeJson, pixels, worstNdc, rebuildCamera } from './common.mjs'
import { loadGlb, worldBoxes, boxByName } from './glb-aabb.mjs'

const browser = await launchBrowser(chromium)
const out = {}
const f3 = v => +v.toFixed(3)
const only = process.argv[2] || 'all'

const glbBoxes = worldBoxes(loadGlb())

/** ndc -> viewport px through the canvas rect. */
const toPx = (rect, n) => [rect.x + (n[0] + 1) / 2 * rect.width, rect.y + (1 - n[1]) / 2 * rect.height]

/** Add a clipped overlay of rectangles + a corner label, in viewport px. */
async function overlay(page, rects, label) {
  await page.evaluate(({ rects, label }) => {
    const c = document.createElement('div')
    c.id = '__gpu2_overlay'
    c.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:2147483647'
    for (const r of rects) {
      const d = document.createElement('div')
      d.style.cssText = `position:absolute;box-sizing:border-box;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;border:${r.dash ? '3px dashed' : '3px solid'} ${r.color};${r.fill ? 'background:' + r.fill + ';' : ''}`
      if (r.text) { const t = document.createElement('span'); t.textContent = r.text; t.style.cssText = `position:absolute;left:2px;top:2px;background:#000c;color:${r.color};font:12px Consolas,monospace;padding:1px 4px;white-space:pre`; d.appendChild(t) }
      c.appendChild(d)
    }
    if (label) { const l = document.createElement('div'); l.textContent = label; l.style.cssText = 'position:absolute;right:8px;bottom:8px;max-width:70%;background:#000d;color:#fff;font:12px/1.35 Consolas,monospace;padding:6px 9px;white-space:pre;border:1px solid #fff6'; c.appendChild(l) }
    document.body.appendChild(c)
  }, { rects, label })
}

// ================= intake close-ups =================
if (only === 'all' || only === 'intake') {
  out.intake = {}
  for (const [w, h] of [[1440, 900], [768, 1024]]) {
    const vp = `${w}x${h}`
    const { ctx, page } = await open(browser, { w, h, qs: '?quality=full' })
    const raw = await capture(page, `intake-raw-${vp}`, .51, { w, h })
    const proof = raw.proof
    const { cam, target, portrait, posErr } = rebuildCamera(proof)
    const rect = proof.canvasRect
    const world = proof.projection.map(p => new THREE.Vector3(...p).unproject(cam))
    const corners = proof.projection.map((p, i) => {
      const wv = world[i]
      const vz = wv.clone().applyMatrix4(cam.matrixWorldInverse).z
      const re = wv.clone().project(cam)
      return { idx: i, ix: (i >> 2) & 1, iy: (i >> 1) & 1, iz: i & 1, world: wv.toArray().map(f3), ndc: p.map(f3), viewZ: f3(vz), side: p[2] > 1 ? 'behind camera (ndc z > 1: beyond far plane or w<0)' : vz > 0 ? 'behind camera (view z > 0)' : vz > -0.02 ? 'between eye and near plane' : 'in front', reprojErr: Math.max(...re.toArray().map((v, k) => Math.abs(v - p[k]))) }
    })
    const wn = worstNdc(proof.projection)
    const worstCorner = corners.reduce((a, b) => Math.max(...b.ndc.slice(0, 2).map(Math.abs)) > Math.max(...a.ndc.slice(0, 2).map(Math.abs)) ? b : a)
    const worstAxis = Math.abs(worstCorner.ndc[0]) >= Math.abs(worstCorner.ndc[1]) ? 'x' : 'y'
    const aabb = new THREE.Box3().setFromPoints(world)
    const camPos = new THREE.Vector3(...proof.camera)
    const inside = aabb.containsPoint(camPos)
    const dist = aabb.distanceToPoint(camPos)
    const clipPlaneX = proof.cutPlane
    // Naive bbox, exactly what the verifier's numbers describe.
    const xs = proof.projection.map(p => p[0]), ys = proof.projection.map(p => p[1])
    const pxA = toPx(rect, [Math.min(...xs), Math.max(...ys)]), pxB = toPx(rect, [Math.max(...xs), Math.min(...ys)])
    const naive = { x: pxA[0], y: pxA[1], w: pxB[0] - pxA[0], h: pxB[1] - pxA[1] }
    // Near-plane-clipped bounds of the 12 edges: what part of the AABB is actually in front of the eye.
    const near = .02, edges = []
    for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) edges.push([i, i | bit])
    const pts = []
    for (const [a, b] of edges) {
      let pa = world[a].clone().applyMatrix4(cam.matrixWorldInverse), pb = world[b].clone().applyMatrix4(cam.matrixWorldInverse)
      const ia = pa.z <= -near, ib = pb.z <= -near
      if (!ia && !ib) continue
      if (ia !== ib) { const t = (-near - pa.z) / (pb.z - pa.z); const m = pa.clone().lerp(pb, t); if (ia) pb = m; else pa = m }
      for (const p of [pa, pb]) pts.push(p.clone().applyMatrix4(cam.matrixWorld).project(cam))
    }
    let clipped = null
    if (pts.length) {
      const cx = pts.map(p => p.x), cy = pts.map(p => p.y)
      const a = toPx(rect, [Math.min(...cx), Math.max(...cy)]), b = toPx(rect, [Math.max(...cx), Math.min(...cy)])
      clipped = { ndcX: [f3(Math.min(...cx)), f3(Math.max(...cx))], ndcY: [f3(Math.min(...cy)), f3(Math.max(...cy))], x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] }
    }
    const label = [`INTAKE u=${proof.u} tier=${raw.meta.tier} ${vp} (camera branch: ${portrait ? 'portrait' : 'landscape'}, stage ${proof.size.width}x${proof.size.height})`,
      `model-AABB corner ndc x[${f3(wn.xMin)}, ${f3(wn.xMax)}]  y[${f3(wn.yMin)}, ${f3(wn.yMax)}]`,
      `worst |ndc| = ${f3(wn.worst)} (corner ${worstCorner.idx} axis ${worstAxis}, viewZ ${worstCorner.viewZ})`,
      `RED = verifier's projected AABB, clipped to viewport`,
      clipped ? `CYAN dashed = near-plane-clipped AABB, ndc x[${clipped.ndcX}] y[${clipped.ndcY}]` : 'no part of AABB in front of camera'].join('\n')
    await overlay(page, [{ ...naive, color: '#ff2020', text: 'verifier AABB (ndc ' + f3(wn.xMin) + '..' + f3(wn.xMax) + ', ' + f3(wn.yMin) + '..' + f3(wn.yMax) + ')' },
      ...(clipped ? [{ x: clipped.x, y: clipped.y, w: clipped.w, h: clipped.h, color: '#20e0ff', dash: true, text: 'near-clipped AABB' }] : [])], label)
    await page.screenshot({ path: path.join(E, `intake-closeup-${vp}.png`) })
    out.intake[vp] = { u: proof.u, tier: raw.meta.tier, portraitBranch: portrait, size: proof.size, canvasRect: rect, camera: proof.camera, target, fov: proof.fov, cutPlane: clipPlaneX,
      cameraRebuildPosErr: posErr, maxReprojErr: Math.max(...corners.map(c => c.reprojErr)), worst: wn, worstCorner, worstAxis, corners,
      reconstructedAABB: { min: aabb.min.toArray().map(f3), max: aabb.max.toArray().map(f3) }, cameraInsideAABB: inside, cameraDistanceToAABB: f3(dist),
      cameraVsAABB: { x: f3(camPos.x), y: f3(camPos.y), z: f3(camPos.z) }, naivePxRect: naive, nearClipped: clipped,
      cornersBehindOrBeyond: corners.filter(c => c.side !== 'in front').length, verifierPinDesktop: 21.586, verifierPinTablet: 26.368 }
    await ctx.close()
  }
}

// ================= reservoir 1019 vs 1020 =================
if (only === 'all' || only === 'reservoir') {
  const [w, h] = [1440, 900], u = .34
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full' })
  const raw = await capture(page, 'reservoir-raw-1440x900', u, { w, h })
  const proof = raw.proof, parts = await readParts(page)
  const { cam } = rebuildCamera(proof)
  const rect = proof.canvasRect
  const rects = {}
  for (const [tag, re] of [['1019', /RES-1019/], ['1020', /RES-1020/]]) {
    const bs = boxByName(glbBoxes, re)
    const box = bs.reduce((a, b) => a.union(b.box), new THREE.Box3())
    const ps = []
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) ps.push(new THREE.Vector3(x, y, z).project(cam))
    const a = toPx(rect, [Math.min(...ps.map(p => p.x)), Math.max(...ps.map(p => p.y))]), b = toPx(rect, [Math.max(...ps.map(p => p.x)), Math.min(...ps.map(p => p.y))])
    rects[tag] = { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1], box: { min: box.min.toArray().map(f3), max: box.max.toArray().map(f3) }, nodes: bs.map(b => b.name) }
  }
  const png = fs.readFileSync(path.join(E, 'reservoir-raw-1440x900.png'))
  const crop = (r, m = 24) => ({ x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), w: Math.min(w, r.w + 2 * m), h: Math.min(h, r.h + 2 * m) })
  const S = 3
  const cells = ['1019', '1020'].map(tag => {
    const c = crop(rects[tag])
    return `<div class="cell" style="width:${c.w * S}px;height:${c.h * S}px;margin:4px"><img src="${dataUrl(png)}" style="position:absolute;left:${-c.x * S}px;top:${-c.y * S}px;width:${w * S}px;height:${h * S}px;image-rendering:pixelated"><div class="lbl">V2RL300-SAF-RES-${tag}-SAFE-1 &middot; ${tag === '1019' ? "default policy 'section' (not in PART_POLICY, not in proof.parts)" : "policy 'keep' (whole, not clipped)"}</div></div>`
  }).join('')
  const full = `<div class="cell" style="width:${w * .75}px;height:${h * .75}px;margin:4px"><img src="${dataUrl(png)}" style="width:${w * .75}px;height:${h * .75}px">` +
    ['1019', '1020'].map((t, i) => { const r = rects[t]; return `<div style="position:absolute;box-sizing:border-box;left:${r.x * .75}px;top:${r.y * .75}px;width:${r.w * .75}px;height:${r.h * .75}px;border:2px solid ${i ? '#ff3030' : '#30ff60'}"></div>` }).join('') +
    `<div class="lbl">full frame u=${u} tier=${raw.meta.tier} 1440x900 &middot; green=1019 red=1020 (projected GLB node AABBs; occlusion not tested)</div></div>`
  const maxW = Math.max(...['1019', '1020'].map(t => crop(rects[t]).w * S)) * 2 + 24
  const page2 = await compose(browser, { w: Math.max(maxW, w * .75 + 16), h: 900, html: `<div style="font-size:0">${cells}</div><div style="font-size:0">${full}</div>` })
  await page2.screenshot({ path: path.join(E, 'reservoir-1019-vs-1020.png'), fullPage: true })
  await page2.close()
  out.reservoir = { u, tier: raw.meta.tier, rects,
    proofParts1020: parts['V2RL300-SAF-RES-1020-SAFE-1'], proofParts1019: parts['V2RL300-SAF-RES-1019-SAFE-1'] ?? 'absent from proof.parts (24 ruled parts only)',
    cutPlane: proof.cutPlane, note: 'runtime cannot toggle 1019 policy: PART_POLICY is a static const and the proof object has no setter; both parts shown in the current build state' }
  await ctx.close()
}

// ================= chevrons =================
if (only === 'all' || only === 'chevrons') {
  const [w, h] = [1440, 900]
  const mounts = [[-.53, .025, -1.355051], [.53, .025, -1.355051], [-.53, .025, -.055051], [.53, .025, -.055051], [-.53, .025, 1.244949], [.53, .025, 1.244949]]
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full' })
  const frames = []
  for (const [tag, u] of [['u840', .84], ['u873', .873], ['u900', .90]]) {
    const r = await capture(page, `chevrons-raw-${tag}`, u, { w, h })
    const { cam } = rebuildCamera(r.proof)
    const m = mounts.map(p => { const v = new THREE.Vector3(...p), n = v.clone().project(cam), vz = v.clone().applyMatrix4(cam.matrixWorldInverse).z
      const px = toPx(r.proof.canvasRect, [n.x, n.y]); return { p, ndc: [f3(n.x), f3(n.y)], px, front: vz < 0, onKeptSide: p[0] <= r.proof.cutPlane, inStage: Math.abs(n.x) <= 1 && Math.abs(n.y) <= 1 } })
    frames.push({ tag, u, png: r.png, mounts: m, cutPlane: r.proof.cutPlane, tier: r.meta.tier })
  }
  // region = bbox of the mounts that sit on the kept side and inside the stage, +-40 px
  const vis = frames[1].mounts.filter(m => m.front && m.onKeptSide && m.inStage)
  const region = vis.length ? { x0: Math.max(0, Math.min(...vis.map(m => m.px[0])) - 40) | 0, x1: Math.min(w, Math.max(...vis.map(m => m.px[0])) + 40) | 0, y0: Math.max(0, Math.min(...vis.map(m => m.px[1])) - 40) | 0, y1: Math.min(h, Math.max(...vis.map(m => m.px[1])) + 40) | 0 } : null
  const regionDiff = (A, B) => {
    const a = pixels(A), b = pixels(B); let n = 0, tot = 0
    for (let y = region.y0; y < region.y1; y++) for (let x = region.x0; x < region.x1; x++) { tot++; const o = (y * a.width + x) * a.channels
      if (Math.abs(a.data[o] - b.data[o]) > 8 || Math.abs(a.data[o + 1] - b.data[o + 1]) > 8 || Math.abs(a.data[o + 2] - b.data[o + 2]) > 8) n++ }
    return { changed: n, of: tot, fraction: +(n / tot).toFixed(4) }
  }
  const cells = frames.map((f, i) => `<div class="cell" style="width:800px;height:500px;margin:2px"><img src="${dataUrl(f.png)}" style="width:800px;height:500px">` +
    f.mounts.filter(m => m.front && m.inStage).map(m => { const x = m.px[0] * 800 / w, y = m.px[1] * 500 / h; return `<div style="position:absolute;left:${x - 10}px;top:${y - 10}px;width:20px;height:20px;border-radius:50%;box-sizing:border-box;border:2px ${m.onKeptSide ? 'solid #30ff60' : 'dashed #888'}"></div>` }).join('') +
    `<div class="lbl">u=${f.u} tier=${f.tier} &middot; ${i === 1 ? 'PEAK of isolation response (+30%, shader window u .856-.894)' : i === 0 ? 'before response onset' : 'after response ends'} &middot; cut plane x&le;${f3(f.cutPlane)}</div></div>`).join('')
  const page2 = await compose(browser, { w: 2410, h: 520, html: `<div style="font-size:0;white-space:nowrap">${cells}</div><div style="padding:4px 8px">Chevrons (AirRibbons kind 1). There is NO runtime toggle for the isolation response (uProgress-gated in the shader, ribbons proof only exposes clip overrides), so this is current state at three u; the camera and the sound fronts also change between them. Green circle = mount on kept side of the cut, grey dashed = mount x &gt; cut plane.</div>` })
  await page2.screenshot({ path: path.join(E, 'chevrons.png'), fullPage: true })
  await page2.close()
  out.chevrons = { region, frames: frames.map(f => ({ tag: f.tag, u: f.u, tier: f.tier, cutPlane: f.cutPlane, mounts: f.mounts.map(m => ({ p: m.p, ndc: m.ndc, front: m.front, onKeptSide: m.onKeptSide, inStage: m.inStage })) })),
    regionDiff: region ? { 'u873_vs_u840': regionDiff(frames[1].png, frames[0].png), 'u873_vs_u900': regionDiff(frames[1].png, frames[2].png), 'u840_vs_u900': regionDiff(frames[0].png, frames[2].png) } : null,
    toggle: 'none available at runtime' }
  await ctx.close()
}

// ================= 2a control panel candidates =================
if (only === 'all' || only === 'panel') {
  const [w, h] = [1440, 900]
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full' })
  const bs = boxByName(glbBoxes, /CONTROL PANEL/i)
  const box = bs.reduce((a, b) => a.union(b.box), new THREE.Box3())
  out.panel = { nodes: bs.map(b => b.name), box: { min: box.min.toArray().map(f3), max: box.max.toArray().map(f3) }, candidates: [] }
  for (const u of [0, .1, .2, .25, .3, .34, .9, 1]) {
    const tag = 'u' + Math.round(u * 1000)
    const r = await capture(page, `panel-cand-${tag}`, u, { w, h, pngPath: `panel-candidates/${tag}.png` })
    const { cam } = rebuildCamera(r.proof)
    const ps = []
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) ps.push(new THREE.Vector3(x, y, z).project(cam))
    const a = toPx(r.proof.canvasRect, [Math.min(...ps.map(p => p.x)), Math.max(...ps.map(p => p.y))]), b = toPx(r.proof.canvasRect, [Math.max(...ps.map(p => p.x)), Math.min(...ps.map(p => p.y))])
    out.panel.candidates.push({ u, tag, cutPlane: r.proof.cutPlane, boxMinXKept: box.min.x <= r.proof.cutPlane, rect: { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] } })
  }
  await ctx.close()
}
writeJson(`phase-b-${only}.json`, out)
await browser.close()
console.log('phase B done', only)
