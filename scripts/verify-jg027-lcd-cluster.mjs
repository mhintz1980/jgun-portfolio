/**
 * JG-027 LCD cluster verification probe.
 *
 * Asserts, at the LCD reveal dwell (paced 0.473, driven through natural scroll),
 * that the cluster dressing — bezel ring, LCD readout, 3 button symbols — is
 * actually VISIBLE: front-facing the active camera, in-frame, and rendering its
 * pixels into the frame. This is the gate class JG-025 lacked: its material
 * identity checks passed while the decals were mounted inside the handle and
 * had never been visible (latent defect found 2026-09-06, fixed by the union
 * bounds placement rework in lcdCluster.ts).
 *
 * Occlusion is asserted via the PIXEL gates (decal colors present in the
 * projected screen rect), not via bounding-sphere ray casts: the decals sit
 * sub-millimetres from their host panels, whose bounding spheres always
 * intersect the sight line, so a sphere test false-positives on correct
 * placements. Sphere candidates are still reported as diagnostics.
 *
 * Modes:
 *   node scripts/verify-jg027-lcd-cluster.mjs --before
 *       Capture the pre-fix dwell frame + diagnostics. No visibility asserts
 *       (the pre-fix state is expected invisible); pixel counts are recorded
 *       so the after-mode thresholds can be sanity-checked against them.
 *   node scripts/verify-jg027-lcd-cluster.mjs
 *       Full assert pass (desktop), mobile capture leg, ?dwell=lcd deep-link
 *       smoke, reduced-motion reload smoke.
 *
 * Requires the :4173 preview server serving the build under test.
 */
import fs from 'node:fs'
import path from 'node:path'
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'
)

const BEFORE_MODE = process.argv.includes('--before')
const OUT = 'project/work/evidence/jg027-lcd-cluster'
fs.mkdirSync(OUT, { recursive: true })
const save = (name, data) =>
  fs.writeFileSync(path.join(OUT, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n')

const DWELL = 0.473 // paced midpoint of LCD_REVEAL_WINDOW (0.458–0.488)
const report = {
  startedAt: new Date().toISOString(),
  mode: BEFORE_MODE ? 'before' : 'after',
  dwell: DWELL,
  failures: [],
  viewports: [],
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
})

/** Natural-scroll to paced progress, then wait for the damped channels to go quiet. */
async function settleAtDwell(page) {
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, DWELL)
  return page.evaluate(async () => {
    const t = window.__telemetry
    const snap = () => [t.camera.x, t.camera.y, t.camera.z, t.camera.fov, t.rig.explodeFactor, t.rig.ghostOpacity]
    let previous = snap()
    let quiet = 0
    const start = performance.now()
    while (performance.now() - start < 9000 && quiet < 10) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()))
      const current = snap()
      let delta = 0
      for (let i = 0; i < current.length; i += 1) delta = Math.max(delta, Math.abs(current[i] - previous[i]))
      previous = current
      quiet = delta <= 1e-7 ? quiet + 1 : 0
    }
    return { progress: t.scroll.progress, explodeFactor: t.rig.explodeFactor }
  })
}

/** Geometry + texture diagnostics for every cluster surface, in the page. */
function probeCluster() {
  const scene = window.__threeScene
  const cam = window.__threeCamera
  const cluster = window.__rig?.lcdCluster
  if (!scene || !cam || !cluster) return { error: 'missing globals', hasScene: !!scene, hasCam: !!cam, hasCluster: !!cluster }
  cam.updateMatrixWorld()
  const V = cluster.readout.position.constructor
  const Q = cluster.readout.quaternion.constructor
  const camPos = new V().setFromMatrixPosition(cam.matrixWorld)
  const surfaces = []
  const entries = [
    ['bezel', cluster.bezel],
    ['readout', cluster.readout],
    ['symbol-up', cluster.symbols[0]],
    ['symbol-enter', cluster.symbols[1]],
    ['symbol-down', cluster.symbols[2]],
  ]
  for (const [key, mesh] of entries) {
    if (!mesh) {
      surfaces.push({ key, missing: true })
      continue
    }
    mesh.updateWorldMatrix(true, false)
    const pos = new V().setFromMatrixPosition(mesh.matrixWorld)
    const q = new Q().setFromRotationMatrix(mesh.matrixWorld)
    const normal = new V(0, 0, 1).applyQuaternion(q).normalize()
    const toCam = camPos.clone().sub(pos).normalize()
    const facingDot = normal.dot(toCam)
    const ndc = pos.clone().project(cam)
    // Screen-rect (px) from the mesh's own geometry bounds — the plane sizes
    // live in the geometry, not the mesh scale, so scale-based corners
    // massively oversize the rect.
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    const gb = mesh.geometry.boundingBox
    let x1 = Infinity
    let x2 = -Infinity
    let y1 = Infinity
    let y2 = -Infinity
    for (let cx = 0; cx < 2; cx += 1) {
      for (let cy = 0; cy < 2; cy += 1) {
        for (let cz = 0; cz < 2; cz += 1) {
          const corner = new V(cx ? gb.max.x : gb.min.x, cy ? gb.max.y : gb.min.y, cz ? gb.max.z : gb.min.z)
            .applyMatrix4(mesh.matrixWorld)
            .project(cam)
          const px = (corner.x * 0.5 + 0.5) * innerWidth
          const py = (-corner.y * 0.5 + 0.5) * innerHeight
          x1 = Math.min(x1, px)
          x2 = Math.max(x2, px)
          y1 = Math.min(y1, py)
          y2 = Math.max(y2, py)
        }
      }
    }
    const rect = { x1, x2, y1, y2 }
    // Texture content stats (proves the canvas is drawn, independent of placement).
    let texture = null
    const img = mesh.material?.map?.image
    if (img && img.width > 0) {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const x = c.getContext('2d')
      x.drawImage(img, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data
      let bright = 0
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 180 && d[i + 1] > 180 && d[i + 2] > 180) bright += 1
      }
      texture = { size: `${img.width}x${img.height}`, brightWhitePx: bright }
    }
    surfaces.push({
      key,
      name: mesh.name,
      facingDot: +facingDot.toFixed(3),
      inFrame: Math.abs(ndc.x) < 1 && Math.abs(ndc.y) < 1 && ndc.z < 1,
      rectPx: { x1: Math.round(rect.x1), y1: Math.round(rect.y1), x2: Math.round(rect.x2), y2: Math.round(rect.y2) },
      camDist: +camPos.distanceTo(pos).toFixed(4),
      texture,
    })
  }
  return { surfaces }
}

/** Decode a PNG (base64) in-page and count pixel classes inside rects. */
async function countPixels(page, pngPath, rects) {
  const b64 = fs.readFileSync(pngPath).toString('base64')
  return page.evaluate(
    async ({ b64, rects }) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const x = c.getContext('2d')
      x.drawImage(img, 0, 0)
      const out = {}
      for (const [key, r] of Object.entries(rects)) {
        const x1 = Math.max(0, Math.floor(r.x1) - 3)
        const y1 = Math.max(0, Math.floor(r.y1) - 3)
        const x2 = Math.min(c.width, Math.ceil(r.x2) + 3)
        const y2 = Math.min(c.height, Math.ceil(r.y2) + 3)
        const d = x.getImageData(x1, y1, x2 - x1, y2 - y1).data
        let white = 0
        let red = 0
        let total = 0
        for (let i = 0; i < d.length; i += 4) {
          const [rr, gg, bb] = [d[i], d[i + 1], d[i + 2]]
          total += 1
          if (rr > 200 && gg > 200 && bb > 200) white += 1
          if (rr > 80 && rr > 2 * Math.max(gg, 1) && rr > 2 * Math.max(bb, 1)) red += 1
        }
        out[key] = { whitePx: white, redPx: red, sampledPx: total }
      }
      return out
    },
    { b64, rects }
  )
}

const fail = (message) => {
  report.failures.push(message)
  console.log('FAIL ' + message)
}

const legSpecs = BEFORE_MODE
  ? [{ label: 'desktop', width: 1920, height: 1080, assert: false }]
  : [
      { label: 'desktop', width: 1920, height: 1080, assert: true },
      { label: 'mobile', width: 390, height: 844, assert: true },
    ]

for (const leg of legSpecs) {
  const context = await browser.newContext({ viewport: { width: leg.width, height: leg.height }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push('console: ' + message.text())
  })
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () => Boolean(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady),
    null,
    { timeout: 60000 }
  )
  await page.waitForTimeout(2000)

  const run = { leg: leg.label, errors }
  const settled = await settleAtDwell(page)
  run.settled = settled
  if (Math.abs(settled.progress - DWELL) > 0.005) fail(`${leg.label}: settled progress ${settled.progress} != ${DWELL}`)
  if (settled.explodeFactor < 0.999) fail(`${leg.label}: explodeFactor ${settled.explodeFactor} < 1 at dwell`)

  const probe = await page.evaluate(probeCluster)
  run.surfaces = probe.surfaces || probe
  if (probe.error) {
    fail(`${leg.label}: ${JSON.stringify(probe)}`)
  } else {
    for (const s of probe.surfaces) {
      if (s.missing) {
        fail(`${leg.label}: cluster surface ${s.key} missing`)
        continue
      }
      if (leg.assert && s.facingDot <= 0.5) fail(`${leg.label}: ${s.key} facingDot ${s.facingDot} <= 0.5 (backfaced/edge-on)`)
      if (leg.assert && !s.inFrame) fail(`${leg.label}: ${s.key} not in frame at dwell`)
      if (leg.assert && s.texture && s.texture.brightWhitePx < 20 && (s.key === 'readout' || s.key.startsWith('symbol'))) {
        fail(`${leg.label}: ${s.key} texture has only ${s.texture.brightWhitePx} bright pixels (blank canvas?)`)
      }
    }
  }

  const shot = path.join(OUT, `${BEFORE_MODE ? 'dwell-before' : 'dwell-after'}-${leg.label}-${leg.width}x${leg.height}.png`)
  await page.screenshot({ path: shot, animations: 'disabled' })
  run.screenshot = path.basename(shot)

  // Pixel gates (desktop asserts; mobile records counts — glyph sizes differ per viewport).
  if (probe.surfaces && !probe.error) {
    const rects = {}
    for (const s of probe.surfaces) if (!s.missing) rects[s.key] = s.rectPx
    run.pixelCounts = await countPixels(page, shot, rects)
    if (leg.assert) {
      const p = run.pixelCounts
      const isDesktop = leg.label === 'desktop'
      if ((p.bezel?.redPx ?? 0) < (isDesktop ? 250 : 60)) fail(`${leg.label}: bezel red pixels ${p.bezel?.redPx} below threshold (invisible ring?)`)
      if ((p.readout?.whitePx ?? 0) < (isDesktop ? 150 : 40)) fail(`${leg.label}: readout white pixels ${p.readout?.whitePx} below threshold (blank screen?)`)
      for (const key of ['symbol-up', 'symbol-enter', 'symbol-down']) {
        if ((p[key]?.whitePx ?? 0) < (isDesktop ? 15 : 5)) fail(`${leg.label}: ${key} white pixels ${p[key]?.whitePx} below threshold (unlit symbol?)`)
      }
    }
  }
  report.viewports.push(run)
  await context.close()
}

// After-mode extras: ?dwell=lcd deep-link + reduced-motion reload smoke.
if (!BEFORE_MODE) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))

  await page.goto('http://localhost:4173/?dwell=lcd', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(window.__drawingProof?.ready), null, { timeout: 60000 })
  await page.waitForTimeout(2500)
  const dwellLink = await page.evaluate(() => ({
    paced: window.__telemetry?.scroll?.progress,
    inWindow:
      window.__telemetry?.scroll?.progress >= 0.458 - 0.01 && window.__telemetry?.scroll?.progress <= 0.488 + 0.01,
  }))
  report.dwellLink = { ...dwellLink, errors }
  if (!dwellLink.inWindow) fail(`?dwell=lcd landed at paced ${dwellLink.paced} (outside 0.458–0.488)`)
  if (errors.length) fail(`?dwell=lcd page errors: ${errors.join('; ')}`)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const reduced = await page.evaluate(() => ({
    hasRig: !!window.__rig,
    hasCluster: !!window.__rig?.lcdCluster,
    clusterBuilt: !!window.__rig?.lcdCluster?.readout,
  }))
  report.reducedMotion = { ...reduced, errors }
  if (!reduced.clusterBuilt) fail('reduced-motion: cluster did not build')
  await context.close()
}

await browser.close()
report.finishedAt = new Date().toISOString()
save(BEFORE_MODE ? 'report-before.json' : 'report.json', report)
console.log(`${report.failures.length === 0 ? 'PASS' : 'FAIL'} — ${report.failures.length} failure(s) — ${OUT}/report${BEFORE_MODE ? '-before' : ''}.json`)
process.exitCode = report.failures.length ? 1 : 0
