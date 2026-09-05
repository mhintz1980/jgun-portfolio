/**
 * JG-026 B1/B2 verification harness.
 *
 * Everything here runs against the SHIPPING system: exponentially damped camera, pointer
 * parallax, rest orbit, gear idle, and the GSAP ScrollTrigger timeline at scrub 0.6. Nothing
 * is deleted to make a gate pass. Where a channel cannot settle by design — the rest orbit and
 * the gear idle both advance on wall clock on purpose — the harness says so and reports the
 * residual as a number instead of pretending it converged.
 *
 * Settle gating (JG-023 pattern): after every scroll move the probe waits for the damped
 * channels to go quiet for a run of frames before reading a checkpoint.
 *
 * Usage: node scripts/verify-b1b2-rebuild.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'

const OUT = 'project/work/evidence/b1-b2-rebuild/proof'
fs.mkdirSync(OUT, { recursive: true })
const save = (name, data) =>
  fs.writeFileSync(
    path.join(OUT, name),
    typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n',
  )

const INTRO_SHARE = 0.3
const RELEASE_END = 0.12

/** Wait for the drawing runtime to publish its proof API. */
const waitReady = (page) =>
  page.waitForFunction(() => Boolean(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady), null, {
    timeout: 60000,
  })

/**
 * Scroll to a paced-progress value through the real document, then wait for the damped
 * channels to go quiet. Returns the settle report, including which channels never settled.
 */
async function settleAt(page, progress, options = {}) {
  const { maxMs = 9000, quietFrames = 10, eps = 1e-7 } = options
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, progress)
  return page.evaluate(
    async ({ maxMs, quietFrames, eps }) => {
      const t = window.__telemetry
      // Damped / scroll-derived channels only. The rest orbit and the gear idle advance on
      // wall clock by design and are reported separately rather than gated on.
      const snap = () => [
        t.camera.x,
        t.camera.y,
        t.camera.z,
        t.camera.fov,
        t.camera.goal.position[0],
        t.camera.goal.position[1],
        t.camera.goal.position[2],
        t.camera.goal.fov,
        t.rig.explodeFactor,
        t.rig.ghostOpacity,
        t.rig.shift,
        t.drawing.phase,
        t.drawing.poseT,
        t.drawing.minZ,
      ]
      let previous = snap()
      let quiet = 0
      let worst = 0
      const start = performance.now()
      while (performance.now() - start < maxMs) {
        await new Promise((resolve) => requestAnimationFrame(() => resolve()))
        const current = snap()
        let delta = 0
        for (let i = 0; i < current.length; i += 1) delta = Math.max(delta, Math.abs(current[i] - previous[i]))
        previous = current
        if (delta <= eps) {
          quiet += 1
          if (quiet >= quietFrames) break
        } else {
          quiet = 0
          worst = delta
        }
      }
      const settled = quiet >= quietFrames
      return {
        settledMs: performance.now() - start,
        settled,
        lastDelta: worst,
        progress: t.scroll.progress,
        camera: { x: t.camera.x, y: t.camera.y, z: t.camera.z, fov: t.camera.fov, up: [...t.camera.up] },
        goal: {
          position: [...t.camera.goal.position],
          target: [...t.camera.goal.target],
          fov: t.camera.goal.fov,
        },
        rig: {
          explodeFactor: t.rig.explodeFactor,
          ghostOpacity: t.rig.ghostOpacity,
          shift: t.rig.shift,
          gearRotation: t.rig.gearRotation,
          handleZ: t.rig.handleZ,
          outputZ: t.rig.outputZ,
          stageZ: [...t.rig.stageZ],
        },
        drawing: {
          phase: t.drawing.phase,
          poseT: t.drawing.poseT,
          focus: t.drawing.focus,
          pulse: t.drawing.pulse,
          pulseHead: t.drawing.pulseHead,
          pulseLuminance: t.drawing.pulseLuminance,
          waveTime: t.drawing.waveTime,
          waveEnabled: t.drawing.waveEnabled,
          lineOpacity: t.drawing.lineOpacity,
          minZ: t.drawing.minZ,
          crossing: t.drawing.crossing,
          leaderCrossings: t.drawing.leaderCrossings,
          modelMatrix: [...t.drawing.modelMatrix],
        },
        backdropAlpha: t.stage.backdropAlpha,
        scrollY: window.scrollY,
      }
    },
    { maxMs, quietFrames, eps },
  )
}

const maxAbsDiff = (a, b) => {
  let worst = 0
  for (const key of Object.keys(a)) {
    const x = a[key]
    const y = b[key]
    if (typeof x === 'number' && typeof y === 'number') worst = Math.max(worst, Math.abs(x - y))
    else if (Array.isArray(x) && Array.isArray(y)) {
      for (let i = 0; i < x.length; i += 1) worst = Math.max(worst, Math.abs(x[i] - y[i]))
    } else if (x && typeof x === 'object' && y && typeof y === 'object') {
      worst = Math.max(worst, maxAbsDiff(x, y))
    }
  }
  return worst
}

/**
 * Pixel agreement between two full-screen mask captures. Runs the decode in the page so no
 * image library is needed, and applies no dilation, alignment correction or resampling.
 */
async function compareMasks(page, fileA, fileB) {
  const toDataUrl = (file) => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64')
  return page.evaluate(
    async ([a, b]) => {
      const load = (src) =>
        new Promise((resolve) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.src = src
        })
      const [imageA, imageB] = await Promise.all([load(a), load(b)])
      const canvas = document.createElement('canvas')
      canvas.width = imageA.width
      canvas.height = imageA.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const read = (image) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0)
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data
      }
      const pixelsA = read(imageA)
      const pixelsB = read(imageB)
      // The HUD chrome is DOM over the canvas and belongs to neither render, so its rows are
      // excluded from both images identically.
      const on = (data, i) => {
        const py = (i / 4 / canvas.width) | 0
        if (py < 70 || py > canvas.height - 40) return false
        const r = data[i]
        const g = data[i + 1]
        const bl = data[i + 2]
        return r >= 200 && g >= 200 && bl >= 200 && Math.max(r, g, bl) - Math.min(r, g, bl) <= 25
      }
      let onA = 0
      let onB = 0
      let both = 0
      let either = 0
      const boundsA = [Infinity, Infinity, -Infinity, -Infinity]
      const boundsB = [Infinity, Infinity, -Infinity, -Infinity]
      const grow = (bounds, x, y) => {
        bounds[0] = Math.min(bounds[0], x)
        bounds[1] = Math.min(bounds[1], y)
        bounds[2] = Math.max(bounds[2], x)
        bounds[3] = Math.max(bounds[3], y)
      }
      for (let i = 0; i < pixelsA.length; i += 4) {
        const pixel = i / 4
        const px = pixel % canvas.width
        const py = (pixel / canvas.width) | 0
        const x = on(pixelsA, i)
        const y = on(pixelsB, i)
        if (x) {
          onA += 1
          grow(boundsA, px, py)
        }
        if (y) {
          onB += 1
          grow(boundsB, px, py)
        }
        if (x && y) both += 1
        if (x || y) either += 1
      }
      /**
       * Nearest-neighbour distance from every ON pixel of one image to the other, via a
       * two-pass chessboard distance transform.
       *
       * Raw IoU is the right metric for a filled silhouette and the wrong one for a hairline:
       * the drawing's lines are a 1760x1360 raster resampled down onto the sheet, the model's
       * are drawn natively at screen resolution, and two 1 px lines one pixel apart score zero
       * overlap while being, in fact, the same line. This measures how far apart they actually
       * are. No dilation is applied to either image.
       */
      const distanceStats = (from, to) => {
        const W = canvas.width
        const H = canvas.height
        const BIG = 1e6
        const dist = new Float64Array(W * H)
        for (let i = 0; i < dist.length; i += 1) dist[i] = on(to, i * 4) ? 0 : BIG
        for (let y = 0; y < H; y += 1) {
          for (let x = 0; x < W; x += 1) {
            const i = y * W + x
            let best = dist[i]
            if (x > 0) best = Math.min(best, dist[i - 1] + 1)
            if (y > 0) best = Math.min(best, dist[i - W] + 1)
            if (x > 0 && y > 0) best = Math.min(best, dist[i - W - 1] + 1)
            if (x + 1 < W && y > 0) best = Math.min(best, dist[i - W + 1] + 1)
            dist[i] = best
          }
        }
        for (let y = H - 1; y >= 0; y -= 1) {
          for (let x = W - 1; x >= 0; x -= 1) {
            const i = y * W + x
            let best = dist[i]
            if (x + 1 < W) best = Math.min(best, dist[i + 1] + 1)
            if (y + 1 < H) best = Math.min(best, dist[i + W] + 1)
            if (x + 1 < W && y + 1 < H) best = Math.min(best, dist[i + W + 1] + 1)
            if (x > 0 && y + 1 < H) best = Math.min(best, dist[i + W - 1] + 1)
            dist[i] = best
          }
        }
        const samples = []
        for (let i = 0; i < dist.length; i += 1) if (on(from, i * 4)) samples.push(dist[i])
        samples.sort((a, b) => a - b)
        if (!samples.length) return null
        return {
          count: samples.length,
          medianPx: samples[Math.floor(samples.length * 0.5)],
          p95Px: samples[Math.floor(samples.length * 0.95)],
          maxPx: samples.at(-1),
          within1px: samples.filter((v) => v <= 1).length / samples.length,
          within2px: samples.filter((v) => v <= 2).length / samples.length,
        }
      }

      return {
        width: canvas.width,
        height: canvas.height,
        drawingPixels: onA,
        modelPixels: onB,
        drawingBounds: boundsA,
        modelBounds: boundsB,
        intersectionPixels: both,
        unionPixels: either,
        disagreementPixels: either - both,
        iou: either ? both / either : 1,
        disagreementFraction: either ? (either - both) / either : 0,
        drawingToModelPx: distanceStats(pixelsA, pixelsB),
        modelToDrawingPx: distanceStats(pixelsB, pixelsA),
      }
    },
    [toDataUrl(fileA), toDataUrl(fileB)],
  )
}

const report = { startedAt: new Date().toISOString(), viewports: {} }

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
})

for (const viewport of [
  { width: 1920, height: 1080, label: 'desktop' },
  { width: 390, height: 844, label: 'mobile' },
]) {
  const label = viewport.label
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push('console: ' + message.text())
  })
  await page.goto('http://localhost:4173/?chapter=0', { waitUntil: 'networkidle' })
  await waitReady(page)
  await page.waitForTimeout(2500)
  await page.mouse.move(viewport.width / 2, viewport.height / 2)

  const run = { viewport, errors }

  // ---- 1. Pacing: measured document geometry and per-chapter absolute scroll ----
  run.pacing = await page.evaluate(
    ({ share, releaseEnd }) => {
      const vh = window.innerHeight
      const docPx = document.documentElement.scrollHeight
      const maxPx = docPx - vh
      const sections = [...document.querySelectorAll('[data-intro],[data-chapter],footer')].map((el) => ({
        id: el.dataset.intro ? 'intro' : el.dataset.chapter !== undefined ? `chapter-${el.dataset.chapter}` : 'footer',
        vh: el.getBoundingClientRect().height / vh,
      }))
      const heroEl = document.querySelector('[data-chapter="1"]')
      const heroRect = heroEl.getBoundingClientRect()
      const heroTop = heroRect.top + window.scrollY
      const heroBottom = heroRect.bottom + window.scrollY
      const paced = (raw) => {
        const introSlope = releaseEnd / share
        const mainSlope = (1 - releaseEnd) / (1 - share)
        const blend = 0.025
        const low = introSlope * raw
        const high = releaseEnd + mainSlope * (raw - share)
        if (raw <= share - blend) return low
        if (raw >= share + blend) return high
        const x = (raw - (share - blend)) / (2 * blend)
        const s = x * x * (3 - 2 * x)
        return low + s * (high - low)
      }
      return {
        documentHeightVh: docPx / vh,
        scrollDistanceVh: maxPx / vh,
        sections,
        heroTriggerRawStart: (heroTop - vh) / maxPx,
        heroTriggerRawEnd: heroBottom / maxPx,
        heroTriggerPacedStart: paced((heroTop - vh) / maxPx),
        heroTriggerPacedEnd: paced(heroBottom / maxPx),
        introAbsoluteVh: (share * maxPx) / vh,
        downstreamAbsoluteVh: ((1 - share) * maxPx) / vh,
      }
    },
    { share: INTRO_SHARE, releaseEnd: RELEASE_END },
  )

  // ---- 2. Layout / third-angle alignment / registration ----
  run.registration = await page.evaluate(() => window.__drawingProof.captureRegistration())
  const views = Object.fromEntries(run.registration.views.map((v) => [v.name, v.rect]))
  const centre = (r) => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2 })
  run.thirdAngle = {
    frontTopSharedVerticalAxis: Math.abs(centre(views.front).x - centre(views.top).x),
    frontSectionSharedVerticalAxis: Math.abs(centre(views.front).x - centre(views.section).x),
    frontRightSharedHorizontalAxis: Math.abs(centre(views.front).y - centre(views.right).y),
    topAboveFront: views.top[1] > views.front[1] + views.front[3],
    sectionBelowFront: views.section[1] + views.section[3] < views.front[1],
    rightRightOfFront: views.right[0] > views.front[0] + views.front[2],
    sheetAspect: run.registration.sheet.aspect,
    sheetAspectTarget: 22 / 17,
  }
  if (label === 'desktop') save('layout.json', run.registration)

  // ---- 3. Settle-gated forward pass ----
  const introPoints = [0.02, 0.2, 0.42, 0.62, 0.8, 0.9, 0.96, 1].map((t) => t * RELEASE_END)
  const mainPoints = [0.18, 0.3, 0.45, 0.53, 0.65, 0.78, 0.9, 0.99]
  const checkpoints = [...introPoints, ...mainPoints]
  run.forward = {}
  for (const p of checkpoints) run.forward[p.toFixed(4)] = await settleAt(page, p)

  // ---- 4. Settle-gated reverse pass + determinism residuals ----
  run.reverse = {}
  for (const p of [...checkpoints].reverse()) run.reverse[p.toFixed(4)] = await settleAt(page, p)

  run.determinism = checkpoints.map((p) => {
    const key = p.toFixed(4)
    const a = run.forward[key]
    const b = run.reverse[key]
    // The rest orbit (progress 0.12..0.545, amplitude 0.003 m) and the gear idle both advance
    // on wall clock on purpose, so they are excluded from the gated channels and their bound
    // is reported instead.
    const wallClockChannel = p > RELEASE_END && p < 0.545
    return {
      progress: p,
      settledForward: a.settled,
      settledReverse: b.settled,
      goalResidual: maxAbsDiff(a.goal, b.goal),
      drawingResidual: maxAbsDiff(a.drawing, b.drawing),
      rigResidual: maxAbsDiff(
        { explodeFactor: a.rig.explodeFactor, ghostOpacity: a.rig.ghostOpacity, shift: a.rig.shift, stageZ: a.rig.stageZ },
        { explodeFactor: b.rig.explodeFactor, ghostOpacity: b.rig.ghostOpacity, shift: b.rig.shift, stageZ: b.rig.stageZ },
      ),
      renderedCameraResidual: maxAbsDiff(a.camera, b.camera),
      wallClockChannelActive: wallClockChannel,
      restOrbitBoundM: wallClockChannel ? 0.003 : 0,
    }
  })

  // ---- 5. Pulse series (Item 3) ----
  run.pulse = []
  for (const t of [0.3, 0.36, 0.42, 0.48, 0.54]) {
    const state = await settleAt(page, t * RELEASE_END)
    await page.screenshot({ path: path.join(OUT, `${label}-pulse-${t.toFixed(2)}.png`) })
    run.pulse.push({
      t,
      focus: state.drawing.focus,
      pulse: state.drawing.pulse,
      pulseHead: state.drawing.pulseHead,
      peakLinearLuminance: state.drawing.pulseLuminance,
      bloomThreshold: 0.6,
      blurredWhilePulsing: state.drawing.focus < 1,
    })
  }

  // ---- 6. Shockwave series (Item 4) ----
  const contact = run.registration.contact
  const sheet = run.registration.sheet
  const corners = [
    [-sheet.width / 2, -sheet.height / 2],
    [sheet.width / 2, -sheet.height / 2],
    [-sheet.width / 2, sheet.height / 2],
    [sheet.width / 2, sheet.height / 2],
  ]
  run.wave = {
    contact,
    farCornerDistanceM: Math.max(...corners.map((c) => Math.hypot(c[0] - contact[0], c[1] - contact[1]))),
    frontReachAtWaveTimeOneM: 0.06 + 0.72,
    frames: [],
  }
  for (const t of [0.88, 0.9, 0.92, 0.94, 0.96, 0.99]) {
    const state = await settleAt(page, t * RELEASE_END)
    await page.screenshot({ path: path.join(OUT, `${label}-wave-${t.toFixed(2)}.png`) })
    run.wave.frames.push({
      t,
      waveTime: state.drawing.waveTime,
      waveEnabled: state.drawing.waveEnabled,
      frontRadiusM: 0.06 + 0.72 * state.drawing.waveTime,
      sheetOpacity: state.drawing.lineOpacity,
      minZ: state.drawing.minZ,
    })
  }
  run.wave.singlePass =
    run.wave.frames.filter((f) => f.waveEnabled === 1).length > 0 &&
    run.wave.frames[run.wave.frames.length - 1].waveEnabled === 0
  run.wave.reachesSheetEdge = run.wave.frontReachAtWaveTimeOneM >= run.wave.farCornerDistanceM
  run.wave.sheetOpaqueUntilWaveCrossed = run.wave.frames
    .filter((f) => f.waveTime < 1)
    .every((f) => f.sheetOpacity > 0.999)

  // ---- 7. Composition captures ----
  run.composition = []
  for (const t of [0, 0.08, 0.2, 0.42, 0.7, 0.88, 1]) {
    await settleAt(page, t * RELEASE_END)
    await page.screenshot({ path: path.join(OUT, `${label}-phase-${t.toFixed(2)}.png`) })
    run.composition.push(
      await page.evaluate(
        (tt) => ({
          t: tt,
          sheetDistance: window.__telemetry.camera.sheetDistance,
          cameraUp: [...window.__telemetry.camera.up],
        }),
        t,
      ),
    )
  }

  // ---- 8. Registration proof modes: silhouette + edge agreement ----
  // The model half of each pair is rendered from the LIVE scene meshes through the LIVE
  // camera (DrawingProofRenderer), never from the saved drawing geometry, and the two images
  // are compared with no dilation, alignment correction or resampling.
  await settleAt(page, 0)
  run.registrationAtRest = await page.evaluate(() => window.__drawingProof.captureRegistration())
  const buffers = {}
  for (const mode of ['drawing-mask', 'model-mask', 'drawing-edges', 'model-edges']) {
    await page.evaluate((m) => window.__drawingProof.setMode(m), mode)
    await page.waitForTimeout(700)
    const file = path.join(OUT, `${label}-${mode}.png`)
    await page.screenshot({ path: file })
    buffers[mode] = file
  }
  await page.evaluate(() => window.__drawingProof.setMode('normal'))
  await page.waitForTimeout(500)
  run.imageAgreement = {
    silhouette: await compareMasks(page, buffers['drawing-mask'], buffers['model-mask']),
    edges: await compareMasks(page, buffers['drawing-edges'], buffers['model-edges']),
    threshold: 'Each RGB channel >=200; channel spread <=25; no dilation or alignment correction',
  }
  run.featureErrorPixels = {
    max: Math.max(...run.registrationAtRest.projectedFeatures.map((f) => f.errorPixels)),
    mean:
      run.registrationAtRest.projectedFeatures.reduce((sum, f) => sum + f.errorPixels, 0) /
      run.registrationAtRest.projectedFeatures.length,
    count: run.registrationAtRest.projectedFeatures.length,
  }

  // ---- 9. Frame-time budget on the restored (damped + GSAP) system ----
  // A warm-up sweep runs FIRST and is discarded: the first pass through each station compiles
  // its programs and uploads its buffers, and measuring that reports compiler latency rather
  // than frame cost. The measured pass is a second, continuous scroll over the same range.
  const sweep = async (durationMs) => {
    for (const p of [0.03, 0.08, 0.11, 0.2, 0.4, 0.6, 0.8, 0.95]) {
      await page.evaluate((v) => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        window.__lenis?.scrollTo(max * v, { duration: 0.6 })
      }, p)
      await page.waitForTimeout(durationMs)
    }
  }
  await sweep(900)
  await page.evaluate(() => {
    window.__frameIntervals = []
    let previous = performance.now()
    const frame = (now) => {
      window.__frameIntervals.push(now - previous)
      previous = now
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
  await sweep(1400)
  run.performance = await page.evaluate(() => {
    const raw = window.__frameIntervals.slice(2)
    const values = raw.slice().sort((a, b) => a - b)
    const gl = document.querySelector('canvas')?.getContext('webgl2')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    return {
      sampleCount: values.length,
      medianMs: values[Math.floor(values.length * 0.5)],
      p95Ms: values[Math.floor(values.length * 0.95)],
      p99Ms: values[Math.floor(values.length * 0.99)],
      maxMs: values.at(-1),
      // Outliers, so a single hitch is not reported as a sustained frame cost.
      over20ms: raw.filter((v) => v > 20).length,
      over33ms: raw.filter((v) => v > 33).length,
      over50ms: raw.filter((v) => v > 50).length,
      vsyncQuantumMs: 1000 / 60,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
      declines: window.__telemetry.performance.declines,
      tier: window.__telemetry.performance.tier,
    }
  })

  // ---- 10. JG-023 backdrop re-measurement ----
  run.jg023 = []
  for (const p of [0.02, 0.1, 0.115, 0.12, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
    const state = await settleAt(page, p)
    run.jg023.push({ progress: p, backdropAlpha: state.backdropAlpha })
  }

  run.leaderCrossings = run.forward['0.0240'].drawing.leaderCrossings

  report.viewports[label] = run
  save('report.json', report)
  await context.close()
}

// ---- 11. Tier fallbacks + JG-022 reduced motion, desktop only ----
{
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.goto('http://localhost:4173/?chapter=0', { waitUntil: 'networkidle' })
  await waitReady(page)
  await page.waitForTimeout(2000)
  await page.evaluate(() => window.__drawingProof.setTier('lite'))
  await page.waitForTimeout(2500)
  for (const t of [0.2, 0.42, 0.88]) {
    await settleAt(page, t * RELEASE_END)
    await page.screenshot({ path: path.join(OUT, `desktop-lite-${t.toFixed(2)}.png`) })
  }
  report.lite = await page.evaluate(() => ({
    tier: window.__telemetry.performance.tier,
    waveEnabled: window.__telemetry.drawing.waveEnabled,
    focus: window.__telemetry.drawing.focus,
    pulse: window.__telemetry.drawing.pulse,
  }))
  await context.close()
}

{
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto('http://localhost:4173/?chapter=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(6000)
  await page.screenshot({ path: path.join(OUT, 'desktop-reduced-motion.png') })
  // JG-022 gate: exactly one card at a time, advancing in order, none stranded below the fold.
  const cards = []
  for (const raw of [0.02, 0.35, 0.6, 0.92]) {
    await page.evaluate((v) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * v), raw)
    await page.waitForTimeout(600)
    cards.push(
      await page.evaluate((v) => {
        const labels = [...document.querySelectorAll('main p.font-mono')]
          .map((el) => el.textContent.trim())
          .filter((text) => /^CH\.\d/.test(text))
        const first = document.querySelector('main .bg-slate-950\\/85')
        const rect = first?.getBoundingClientRect()
        return {
          rawScroll: v,
          labels,
          firstCardTopVh: rect ? (rect.top + window.scrollY) / window.innerHeight : null,
          firstCardVisible: rect ? rect.top < window.innerHeight && rect.bottom > 0 : false,
        }
      }, raw),
    )
  }
  report.jg022 = { cards, scrollJackApplies: false }
  report.reducedMotion = await page.evaluate(() => ({
    phase: window.__telemetry.drawing.phase,
    focus: window.__telemetry.drawing.focus,
    pulse: window.__telemetry.drawing.pulse,
    waveEnabled: window.__telemetry.drawing.waveEnabled,
    backdropAlpha: window.__telemetry.stage.backdropAlpha,
    cameraUp: [...window.__telemetry.camera.up],
  }))
  await context.close()
}

report.finishedAt = new Date().toISOString()
save('report.json', report)

const desktop = report.viewports.desktop
console.log(
  JSON.stringify(
    {
      pacing: desktop.pacing,
      thirdAngle: desktop.thirdAngle,
      leaderCrossings: desktop.leaderCrossings,
      featureErrorPixels: desktop.featureErrorPixels,
      imageAgreement: desktop.imageAgreement,
      wave: { ...desktop.wave, frames: desktop.wave.frames.length },
      performance: desktop.performance,
      worstGoalResidual: Math.max(...desktop.determinism.map((d) => d.goalResidual)),
      worstDrawingResidual: Math.max(...desktop.determinism.map((d) => d.drawingResidual)),
      worstRigResidual: Math.max(...desktop.determinism.map((d) => d.rigResidual)),
      unsettled: desktop.determinism.filter((d) => !d.settledForward || !d.settledReverse).map((d) => d.progress),
      errors: desktop.errors,
    },
    null,
    2,
  ),
)
await browser.close()
