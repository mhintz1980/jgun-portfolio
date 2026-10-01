// Review stills, a review video, and per-frame telemetry for the JG-035 storm flicker and
// visible-dark beat.
//
// Why the checkpoint list looks like this: the opening is a pure function of scroll, so the
// reviewer needs the two extremes of the shot (the lit hold and the resolved handoff) plus EVERY
// key of the authored failure envelope — all five troughs, all four unequal recoveries, and the
// sustained near-out shelf — because the point of the beat is that no two failures look alike.
// Nothing here is sampled randomly or off a clock.
//
// The stills pass runs one page per case, ascending, and verifies the WebGL context is still
// live before each shutter; a lost context forces a fresh page and a retry, so a dead canvas can
// never be filed as a still. Each still carries the live telemetry, the tier, the GPU renderer
// behind the canvas, and a sheet-coordinate paper/ink reading taken from that still's own pixels.
// The motion pass records one continuous scrub of the whole beat as a review video with per-frame
// telemetry alongside it, because a still cannot show rhythm.
//
// Full pixel evidence (dark stock band, ink-over-stock contrast, trace bright pixels and the
// offscreen normal-vs-null trace control) lives in scripts/measure-jgun-visible-dark.mjs, which is
// the authority for those numbers. This script is the review artifact.
//
// Phase table: docs/jgun-storm-flicker-visible-dark-plan.md ("Visual thesis and phase contract").
//
// Usage:
//   node scripts/capture-jgun-blackout-motion.mjs [--url=http://localhost:4173] [--out=<dir>]
//     [--label=baseline] [--cases=desktop,narrow] [--passes=stills,video]
//     [--duration=14] [--sample=0.12] [--points=<intro times>] [--headless=1] [--radius=4]
//     [--require-tier=full]

import { chromium } from 'playwright'
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=')
  return [key, value.join('=')]
}))

// The built preview is authoritative: the dev server HMR can tear the scene down mid-capture.
const url = args.url || 'http://localhost:4173'
const label = args.label || 'visible-dark'
const duration = Math.max(3, Number(args.duration || 14))
const sampleInterval = Math.max(0.05, Number(args.sample || 0.12))
const headed = args.headless !== '1'
const radius = Math.max(1, Math.min(12, Number(args.radius || 4)))
// Review stills are only full-finish evidence when the FULL shader set is live. The quality
// ratchet is never overridden here: a mismatched tier is retried on a fresh page and, if it still
// does not match, fails the run, so a lite frame can never be filed as full-tier proof.
const requireTier = args['require-tier'] || ''
const passes = (args.passes || 'stills,video').split(',').map((s) => s.trim()).filter(Boolean)
for (const pass of passes) if (!['stills', 'video'].includes(pass)) throw new Error('Unknown pass "' + pass + '" (expected stills, video)')
const out = path.resolve(args.out || ('project/work/evidence/JG-035-opening-drafting-table/storm-visible-dark-2026-09-30/' + label + '-motion'))

const CASES = {
  desktop: { width: 1600, height: 900 },
  narrow: { width: 390, height: 844 },
}
const caseNames = (args.cases || 'desktop,narrow').split(',').map((s) => s.trim()).filter(Boolean)
for (const name of caseNames) {
  if (!CASES[name]) throw new Error('Unknown case "' + name + '" (expected ' + Object.keys(CASES).join(', ') + ')')
}

/**
 * Intro-normalized scroll time -> paced progress: `drawingIntroState` divides by
 * `DRAWING_INTRO_WINDOW.releaseEnd` (0.12, unchanged by pacing). The raw document share
 * (`INTRO_SCROLL_SHARE`, 0.50 since 2026-10-01) is consumed inside `__drawingProof.setProgress`,
 * which routes through `rawScrollFor`, so it must NOT be applied here or every checkpoint lands
 * more than four times too deep into the intro (0.50 / 0.12 = 4.17x).
 */
const INTRO_SHARE = 0.12
/** Authored failure envelope. Mirrors INTRO_PHASES + LAMP_FAILURE_KEYS in introTimeline.ts. */
const FLICKER = {
  start: 0.45,
  end: 0.58,
  u: [0, 0.12, 0.18, 0.28, 0.34, 0.46, 0.51, 0.64, 0.72, 0.78, 0.85, 0.91, 1],
  power: [1, 0.58, 0.92, 0.14, 0.78, 0.36, 0.86, 0.015, 0.015, 0.58, 0.08, 0.34, 0],
}
const LAMP_RETURN = { start: 0.79, end: 0.86 }
// Beat samples are interior points of the current phase contract (plan, 2026-10-01), not boundary
// values: `lit` .40 sits inside the .38-.45 registered hold, `dark` .59 inside the .58-.66
// visible-dark anticipation (lamp 0, no lightning yet), `trace` .69 inside the .66-.79 electrical
// profile, and `pressure` .82 inside the .79-.86 lamp return. `lift` .94 is honest naming while the
// tool is still rising out of the sheet; the physical separation (solved crossing, pose ~.899) now
// lands at intro t ~.9603, so `resolved` .98 still has to be sampled after it — and after the .97
// wave end.
const BEATS = { lit: 0.4, dark: 0.59, trace: 0.69, pressure: 0.82, lift: 0.94, resolved: 0.98 }
const SCRUB = { from: 0.4, to: 1 }

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const smooth01 = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t) }
const round = (v, n = 3) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(n)) : null)
const median = (values) => {
  const s = [...values].filter(Number.isFinite).sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : null
}
const sanitize = (value) => String(value).replaceAll('.', '_')

/** Which side of its neighbours a failure key sits on, so the label is honest. */
const flickerKind = (i) => {
  const previous = FLICKER.power[i - 1]
  const next = FLICKER.power[i + 1]
  if (previous === undefined || next === undefined) return 'edge'
  if (FLICKER.power[i] < previous && FLICKER.power[i] < next) return 'dip'
  if (FLICKER.power[i] > previous && FLICKER.power[i] > next) return 'recovery'
  return 'step'
}

/**
 * Stable, collision-free checkpoint name, shared verbatim with measure-jgun-visible-dark.mjs so a
 * still filename and a measurement row always mean the same scroll position. The failure-key
 * INDEX is part of the name and the values are fixed to three decimals, so two keys that round to
 * the same numbers still get distinct names.
 */
function checkpointName(t) {
  const beat = Object.entries(BEATS).find(([, value]) => Math.abs(value - t) < 1e-9)
  if (beat) return 'beat-' + beat[0]
  const index = FLICKER.u.findIndex((u) => Math.abs(FLICKER.start + u * (FLICKER.end - FLICKER.start) - t) < 1e-9)
  if (index >= 0) {
    return 'flicker-k' + String(index).padStart(2, '0') + '-' + flickerKind(index)
      + '-u' + sanitize(FLICKER.u[index].toFixed(3)) + '-p' + sanitize(FLICKER.power[index].toFixed(3))
  }
  return 't' + sanitize(t.toFixed(3))
}

function expectedPowerFor(t) {
  if (t <= FLICKER.start) return { value: 1, source: 'plan', hard: true }
  if (t < FLICKER.end) {
    const u = (t - FLICKER.start) / (FLICKER.end - FLICKER.start)
    let i = 0
    while (i < FLICKER.u.length - 2 && u >= FLICKER.u[i + 1]) i += 1
    const local = (u - FLICKER.u[i]) / Math.max(1e-9, FLICKER.u[i + 1] - FLICKER.u[i])
    return { value: FLICKER.power[i] + (FLICKER.power[i + 1] - FLICKER.power[i]) * smooth01(local), source: 'plan', hard: true }
  }
  if (t < LAMP_RETURN.start) return { value: 0, source: 'plan', hard: true }
  if (t < LAMP_RETURN.end) return { value: smooth01((t - LAMP_RETURN.start) / (LAMP_RETURN.end - LAMP_RETURN.start)), source: 'derived', hard: false }
  return { value: 1, source: 'plan', hard: false }
}

/** Every key of the failure envelope, classified by its own neighbours so the name is honest. */
function flickerCheckpoints() {
  return FLICKER.u.map((value, i) => {
    const t = FLICKER.start + value * (FLICKER.end - FLICKER.start)
    return { t, kind: flickerKind(i), u: value, power: FLICKER.power[i], name: checkpointName(t) }
  })
}

function checkpointList() {
  const requested = (args.points || '').split(',').map((s) => s.trim()).filter(Boolean).map(Number)
  if (requested.length) {
    if (requested.some((t) => !Number.isFinite(t) || t < 0 || t > 1)) throw new Error('Expected finite intro times in [0,1]')
    return requested.map((t) => ({ t, kind: 'custom', u: null, power: null, name: checkpointName(t) }))
  }
  const beats = Object.entries(BEATS).map(([name, t]) => ({ t, kind: 'beat', u: null, power: null, name: 'beat-' + name }))
  const unique = new Map()
  for (const checkpoint of [...beats, ...flickerCheckpoints()]) {
    if (!unique.has(checkpoint.t.toFixed(6))) unique.set(checkpoint.t.toFixed(6), checkpoint)
  }
  return [...unique.values()].sort((a, b) => a.t - b.t)
}

/**
 * Installed in every page. Canvas selection mirrors the verifier's liveness predicate: the quality
 * store also creates a detached WebGL2 probe canvas, and a dead or unlaid-out canvas must never be
 * mistaken for the render surface.
 */
const PAGE_HELPERS = () => {
  window.__captureHelpers = {
    pickCanvas() {
      for (const canvas of Array.from(document.querySelectorAll('canvas'))) {
        const rect = canvas.getBoundingClientRect()
        if (canvas.isConnected && canvas.width > 1 && canvas.height > 1 && rect.width > 1 && rect.height > 1) return canvas
      }
      return null
    },
    /** The live context of the render canvas, asked through the element so it is the real one. */
    context() {
      const canvas = this.pickCanvas()
      if (!canvas) return null
      return canvas.getContext('webgl2') || canvas.getContext('webgl') || null
    },
    gpu() {
      const gl = this.context()
      if (!gl) return { available: false, reason: this.pickCanvas() ? 'NO_CONTEXT' : 'NO_LIVE_CANVAS' }
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        available: true,
        unmasked: !!debug,
        vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        api: gl.getParameter(gl.VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        contextLost: gl.isContextLost(),
      }
    },
    liveness() {
      const canvas = this.pickCanvas()
      const gl = this.context()
      return {
        canvasConnected: !!canvas,
        contextLost: gl ? gl.isContextLost() : null,
        drawingBuffer: canvas ? [canvas.width, canvas.height] : null,
        tier: window.__telemetry?.performance?.tier ?? null,
      }
    },
  }
}

/** Sheet-coordinate paper/ink patches for one still. Full evidence lives in measure-jgun-visible-dark. */
const STILL_PATCHES = () => {
  const scene = window.__threeScene
  const camera = window.__threeCamera
  const canvas = window.__captureHelpers.pickCanvas()
  const api = window.__drawingProof
  if (!scene || !camera || !canvas || !api) throw new Error('LIVE_CANVAS_MISSING')
  const frame = scene.getObjectByName('engineering-drawing-plane-frame')
  if (!frame) throw new Error('SHEET_MISSING')
  // The sheet group copies its matrix with matrixAutoUpdate off, so push the world update
  // ourselves instead of trusting the renderer's dirty flags.
  frame.updateMatrixWorld(true)
  camera.updateMatrixWorld(true)
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert()

  const lines = frame.children.find((m) => m.geometry?.getAttribute?.('aSeg'))
  const seg = lines?.geometry?.getAttribute?.('aSeg')
  if (!seg) throw new Error('INK_GEOMETRY_MISSING')
  const style = lines.geometry.getAttribute('aStyle')
  const segs = []
  for (let i = 0; i < seg.count; i += 1) {
    segs.push({ a: [seg.getX(i), seg.getY(i)], b: [seg.getZ(i), seg.getW(i)], group: style ? style.getY(i) : 0 })
  }
  const textBoxes = []
  // The proof surface exposes the whole lettering layer at once (captureTextBounds); there is no
  // per-group accessor, and each item already carries its own ink.ts GROUP.
  try {
    for (const item of api.captureTextBounds?.()?.items ?? []) if (item.bounds) textBoxes.push(item.bounds)
  } catch { /* the lettering layer has no ready layout yet */ }

  const FRAME = { x: -0.38, y: -0.23, w: 0.76, h: 0.46 }
  const BLOCKED = [
    { x: 0.14, y: -0.23, w: 0.24, h: 0.085 },
    { x: 0.14, y: -0.145, w: 0.24, h: 0.036 },
    { x: 0.198, y: 0.118, w: 0.176, h: 0.106 },
  ]
  const inside = (p, r, pad) => p[0] >= r.x - pad && p[0] <= r.x + r.w + pad && p[1] >= r.y - pad && p[1] <= r.y + r.h + pad
  const CELL = 0.008
  const occupied = new Set()
  for (const s of segs) {
    const length = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])
    const steps = Math.max(1, Math.ceil(length / (CELL * 0.5)))
    for (let k = 0; k <= steps; k += 1) {
      const u = k / steps
      occupied.add(Math.floor((s.a[0] + (s.b[0] - s.a[0]) * u) / CELL) + ',' + Math.floor((s.a[1] + (s.b[1] - s.a[1]) * u) / CELL))
    }
  }
  const clearOfInk = (p) => {
    const ix = Math.floor(p[0] / CELL), iy = Math.floor(p[1] / CELL)
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dy = -2; dy <= 2; dy += 1) if (occupied.has((ix + dx) + ',' + (iy + dy))) return false
    }
    return true
  }
  const candidates = []
  for (let x = FRAME.x + 0.008; x <= FRAME.x + FRAME.w - 0.008; x += 0.014) {
    for (let y = FRAME.y + 0.008; y <= FRAME.y + FRAME.h - 0.008; y += 0.014) {
      const p = [x, y]
      if (BLOCKED.some((r) => inside(p, r, 0.006))) continue
      if (textBoxes.some((b) => inside(p, { x: b[0], y: b[1], w: b[2] - b[0], h: b[3] - b[1] }, 0.004))) continue
      if (!clearOfInk(p)) continue
      candidates.push(p)
    }
  }
  const paper = []
  if (candidates.length) {
    paper.push(candidates[0])
    while (paper.length < 18 && paper.length < candidates.length) {
      let best = null
      let bestDistance = -1
      for (const p of candidates) {
        let nearest = Infinity
        for (const c of paper) nearest = Math.min(nearest, Math.hypot(p[0] - c[0], p[1] - c[1]))
        if (nearest > bestDistance) { bestDistance = nearest; best = p }
      }
      if (!best) break
      paper.push(best)
    }
  }
  // The registered elevation: side view plus its dimensions — the ink the camera settles onto.
  const inkSegs = segs.filter((s) => s.group === 12 || s.group === 13)
  const ink = []
  const stride = Math.max(1, Math.floor(inkSegs.length / 24))
  for (let i = 0; i < inkSegs.length && ink.length < 24; i += stride) {
    ink.push([(inkSegs[i].a[0] + inkSegs[i].b[0]) / 2, (inkSegs[i].a[1] + inkSegs[i].b[1]) / 2, 0.0003])
  }

  const rect = canvas.getBoundingClientRect()
  const scratch = frame.position.clone()
  const project = (p) => {
    const ndc = scratch.set(p[0], p[1], p[2]).applyMatrix4(frame.matrixWorld).project(camera)
    return {
      sheet: [p[0], p[1]],
      x: rect.x + ((ndc.x + 1) * rect.width) / 2,
      y: rect.y + ((1 - ndc.y) * rect.height) / 2,
    }
  }
  return {
    image: { width: Math.round(rect.width), height: Math.round(rect.height) },
    counts: { paper: paper.length, ink: ink.length, segments: segs.length },
    paper: paper.map(project),
    ink: ink.map(project),
  }
}

/** Sample the still around each patch: the local median is the stock, the minimum is the line. */
const STILL_SAMPLER = async ({ b64, patches, radius }) => {
  const image = new Image()
  image.src = 'data:image/png;base64,' + b64
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  const sample = (p) => {
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < radius || y < radius || x >= image.width - radius || y >= image.height - radius) {
      return { sheet: p.sheet, x, y, valid: false }
    }
    const size = radius * 2 + 1
    const data = ctx.getImageData(x - radius, y - radius, size, size).data
    const lum = []
    for (let i = 0; i < data.length; i += 4) lum.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
    const sorted = [...lum].sort((a, b) => a - b)
    const at = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
    return { sheet: p.sheet, x, y, valid: true, min: sorted[0], median: at(0.5), max: sorted[sorted.length - 1], mean: lum.reduce((a, b) => a + b, 0) / lum.length }
  }
  return { paper: patches.paper.map(sample), ink: patches.ink.map(sample) }
}

const summarizePixels = (pixels) => {
  const gather = (list) => (list ?? []).filter((p) => p.valid)
  const paper = gather(pixels?.paper)
  const ink = gather(pixels?.ink)
  return {
    paper: paper.length
      ? { count: paper.length, median: round(median(paper.map((p) => p.median)), 2), min: round(Math.min(...paper.map((p) => p.min)), 2), max: round(Math.max(...paper.map((p) => p.max)), 2) }
      : null,
    ink: ink.length ? { count: ink.length, median: round(median(ink.map((p) => p.median)), 2), min: round(Math.min(...ink.map((p) => p.min)), 2) } : null,
    inkOverStock: ink.length ? round(median(ink.map((p) => p.median - p.min)), 2) : null,
  }
}

/**
 * Developer GPU-evidence launch flags. The anti-throttling trio keeps a concurrent or occluded
 * window from background-throttling the renderer and freezing WebGL mid-capture — an earlier
 * harness hit exactly that. These are capture-time flags only; the product quality ladder and
 * every runtime behavior the site ships are untouched.
 */
const LAUNCH_ARGS = [
  '--use-angle=d3d11',
  '--enable-gpu',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
]
const browser = await chromium.launch({ channel: 'chrome', headless: !headed, args: LAUNCH_ARGS })
const report = {
  url,
  label,
  generatedAt: new Date().toISOString(),
  headed,
  duration,
  sampleInterval,
  introShare: INTRO_SHARE,
  requireTier: requireTier || null,
  phaseTable: { flicker: FLICKER, lampReturn: LAMP_RETURN, beats: BEATS, scrub: SCRUB },
  cases: {},
}

try {
  for (const caseName of caseNames) {
    const { width, height } = CASES[caseName]
    const caseOut = path.join(out, caseName)
    await mkdir(caseOut, { recursive: true })
    const entry = { viewport: { width, height }, gpu: null, consoleErrors: [], checkpoints: [], stills: [], motion: null, video: null }
    const checkpoints = checkpointList().map((checkpoint) => {
      const expected = expectedPowerFor(checkpoint.t)
      return { ...checkpoint, expectedPower: round(expected.value, 4), expectedSource: expected.source, hard: expected.hard }
    })
    entry.checkpoints = checkpoints

    if (passes.includes('stills')) {
      const stillsDir = path.join(caseOut, 'stills')
      await mkdir(stillsDir, { recursive: true })
      const errors = []
      let context = null
      let page = null
      const closePage = async () => {
        if (page) await page.close().catch(() => {})
        if (context) await context.close().catch(() => {})
        page = null
        context = null
      }
      const openPage = async () => {
        await closePage()
        context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference', deviceScaleFactor: 1, serviceWorkers: 'block' })
        await context.addInitScript(PAGE_HELPERS)
        page = await context.newPage()
        page.on('pageerror', (error) => errors.push(String(error.message)))
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 120000 })
        await page.evaluate(() => { window.__scrollCommitDisabled = true })
        return page
      }
      try {
        await openPage()
        entry.gpu = await page.evaluate(() => window.__captureHelpers.gpu())
        for (const checkpoint of checkpoints) {
          let still = null
          // A ratcheted tier is a fresh-page problem, so a required tier earns extra attempts.
          const maxAttempts = requireTier ? 4 : 2
          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
              const live = await page.evaluate(() => window.__captureHelpers.liveness())
              if (!live.canvasConnected) throw new Error('CANVAS_MISSING')
              if (live.contextLost) throw new Error('CONTEXT_LOST')
              await page.evaluate((progress) => window.__drawingProof.setProgress(progress), checkpoint.t * INTRO_SHARE)
              await page.waitForFunction((expected) => Math.abs((window.__telemetry?.drawing?.phase ?? -1) - expected) < 1e-6, checkpoint.t, { timeout: 30000 })
              await page.waitForFunction(() => {
                const c = window.__telemetry?.camera
                const g = c?.goal
                return !!g && Math.hypot(c.x - g.position[0], c.y - g.position[1], c.z - g.position[2]) < 1e-4 && Math.abs(c.fov - g.fov) < 1e-4
              }, null, { timeout: 15000 }).catch(() => false)
              // The reading pool trails the look-at point with a damped lag; let it arrive.
              await page.waitForTimeout(450)
              const reading = await page.evaluate(() => {
                const api = window.__drawingProof
                const t = window.__telemetry
                const registration = api.captureRegistration()
                return {
                  liveness: window.__captureHelpers.liveness(),
                  phase: t.drawing.phase,
                  lampPower: t.drawing.lampPower,
                  blackout: t.drawing.blackout,
                  pulse: t.drawing.pulse,
                  pulseHead: t.drawing.pulseHead,
                  poseT: t.drawing.poseT,
                  pbr: t.drawing.pbr,
                  vellum: t.drawing.vellum,
                  bulge: t.drawing.bulgeDisplacement,
                  waveTime: t.drawing.waveTime,
                  focus: t.drawing.focus,
                  lineOpacity: t.drawing.lineOpacity,
                  inkLuminance: t.drawing.inkLuminance,
                  annotationsReady: t.drawing.annotationsReady,
                  tier: t.performance.tier,
                  declines: t.performance.declines,
                  camera: t.camera,
                  cameraResidual: t.camera.goal
                    ? Math.hypot(t.camera.x - t.camera.goal.position[0], t.camera.y - t.camera.goal.position[1], t.camera.z - t.camera.goal.position[2])
                    : null,
                  stats: api.sheetStats(),
                  maxRegistrationPx: Math.max(...registration.projectedFeatures.map((f) => f.errorPixels)),
                  crossing: registration.crossing,
                  // Pose evidence for the resolved/handoff claim: after separation the lowest vertex
                  // must have cleared the sheet plane, while the lift sample is still at contact.
                  minZ: t.drawing.minZ,
                  localZ: t.drawing.localZ,
                  contact: t.drawing.contact,
                  travel: t.drawing.travel,
                  exactContact: registration.exactContact,
                }
              })
              if (requireTier && reading.tier !== requireTier) {
                throw new Error('TIER_MISMATCH ' + reading.tier + ' != ' + requireTier)
              }
              const patches = await page.evaluate(STILL_PATCHES)
              const file = 'still-' + checkpoint.name + '.png'
              const png = await page.screenshot({ path: path.join(stillsDir, file) })
              const pixels = summarizePixels(await page.evaluate(STILL_SAMPLER, { b64: png.toString('base64'), patches, radius }))
              still = { ...checkpoint, attempt, file, errorCount: errors.length, ...reading, pixels, patchCounts: patches.counts }
              break
            } catch (error) {
              still = { ...checkpoint, attempt, ok: false, error: String(error) }
              await openPage().catch(() => {})
            }
          }
          entry.stills.push(still)
          await writeFile(path.join(caseOut, 'frames.json'), JSON.stringify({ url, case: caseName, viewport: { width, height }, gpu: entry.gpu, checkpoints, stills: entry.stills }, null, 2))
          console.log(JSON.stringify({
            case: caseName,
            t: still.t,
            name: still.name,
            kind: still.kind,
            ok: still.ok !== false,
            phase: round(still.phase, 6),
            power: round(still.lampPower, 4),
            expected: still.expectedPower,
            paper: still.pixels?.paper?.median ?? null,
            inkStock: still.pixels?.inkOverStock ?? null,
            tier: still.tier ?? null,
            error: still.error ?? null,
          }))
        }
      } finally {
        await closePage()
      }
      entry.consoleErrors = [...entry.consoleErrors, ...errors]
    }

    if (passes.includes('video')) {
      const videoDir = path.join(caseOut, 'video')
      await mkdir(videoDir, { recursive: true })
      const errors = []
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: 'no-preference',
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
        recordVideo: { dir: videoDir, size: { width, height } },
      })
      await context.addInitScript(PAGE_HELPERS)
      const page = await context.newPage()
      const video = page.video()
      page.on('pageerror', (error) => errors.push(String(error.message)))
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      let samples = []
      let gpu = null
      let saved = null
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 120000 })
        await page.evaluate(() => { window.__scrollCommitDisabled = true })
        gpu = await page.evaluate(() => window.__captureHelpers.gpu())
        // Hold the lit beat briefly so the video opens on a readable frame.
        await page.evaluate((progress) => window.__drawingProof.setProgress(progress), SCRUB.from * INTRO_SHARE)
        await page.waitForTimeout(1200)
        samples = await page.evaluate(async ({ from, to, share, duration: seconds, sampleInterval: interval }) => {
          const result = []
          const began = performance.now()
          let lastSample = -Infinity
          // A continuous scrub: scroll time stays the only render input, exactly as live.
          while (true) {
            const elapsed = (performance.now() - began) / 1000
            if (elapsed > seconds) break
            const t = from + (to - from) * Math.min(1, elapsed / seconds)
            window.__drawingProof.setProgress(t * share)
            if (elapsed - lastSample >= interval) {
              lastSample = elapsed
              const d = window.__telemetry.drawing
              const c = window.__telemetry.camera
              result.push({
                seconds: Number(elapsed.toFixed(3)),
                t: Number(t.toFixed(5)),
                phase: d.phase,
                lampPower: d.lampPower,
                blackout: d.blackout,
                pulse: d.pulse,
                pulseHead: d.pulseHead,
                poseT: d.poseT,
                pbr: d.pbr,
                vellum: d.vellum,
                bulge: d.bulgeDisplacement,
                waveTime: d.waveTime,
                focus: d.focus,
                lineOpacity: d.lineOpacity,
                inkLuminance: d.inkLuminance,
                camera: { x: c.x, y: c.y, z: c.z, fov: c.fov },
                tier: window.__telemetry.performance.tier,
                liveness: window.__captureHelpers.liveness(),
              })
            }
            await new Promise(requestAnimationFrame)
          }
          // Land exactly on the endpoint and hold it. The while loop can break a frame short of
          // `to`, so without this the resolved handoff is never actually rendered or recorded.
          window.__drawingProof.setProgress(to * share)
          await new Promise((resolve) => setTimeout(resolve, 750))
          const dEnd = window.__telemetry.drawing
          const cEnd = window.__telemetry.camera
          result.push({
            seconds: seconds,
            t: to,
            final: true,
            phase: dEnd.phase,
            lampPower: dEnd.lampPower,
            blackout: dEnd.blackout,
            pulse: dEnd.pulse,
            pulseHead: dEnd.pulseHead,
            poseT: dEnd.poseT,
            pbr: dEnd.pbr,
            vellum: dEnd.vellum,
            bulge: dEnd.bulgeDisplacement,
            waveTime: dEnd.waveTime,
            focus: dEnd.focus,
            lineOpacity: dEnd.lineOpacity,
            inkLuminance: dEnd.inkLuminance,
            minZ: dEnd.minZ,
            localZ: dEnd.localZ,
            camera: { x: cEnd.x, y: cEnd.y, z: cEnd.z, fov: cEnd.fov },
            tier: window.__telemetry.performance.tier,
            liveness: window.__captureHelpers.liveness(),
          })
          return result
        }, { from: SCRUB.from, to: SCRUB.to, share: INTRO_SHARE, duration, sampleInterval }).catch((error) => {
          // A torn-down page mid-scrub must be reported, not thrown out of the pass loop.
          errors.push('scrub: ' + String(error))
          return []
        })
        // Let the final frames reach the recorder before the context is torn down.
        await page.waitForTimeout(1400)
      } finally {
        await page.close()
        saved = video ? await video.path().catch(() => null) : null
        await context.close()
      }
      const files = (await readdir(videoDir).catch(() => [])).filter((name) => name.endsWith('.webm'))
      const source = saved && path.dirname(saved) === videoDir && files.includes(path.basename(saved))
        ? saved
        : (files.length ? path.join(videoDir, files[0]) : null)
      if (source) {
        const target = path.join(videoDir, caseName + '.webm')
        if (path.resolve(source) !== path.resolve(target)) await rename(source, target)
        for (const name of (await readdir(videoDir)).filter((n) => n.endsWith('.webm') && n !== caseName + '.webm')) {
          await rm(path.join(videoDir, name), { force: true })
        }
        entry.video = { file: path.relative(out, target).replaceAll('\\', '/') }
      }
      entry.gpu = entry.gpu ?? gpu
      entry.motion = {
        duration,
        sampleInterval,
        samples: samples.length,
        live: samples.length > 0 && samples.every((s) => s.liveness?.canvasConnected && !s.liveness?.contextLost),
        notLive: samples.filter((s) => !s.liveness?.canvasConnected || s.liveness?.contextLost).length,
        finalT: samples.find((s) => s.final)?.t ?? null,
        tierMismatch: requireTier ? samples.some((s) => s.tier !== requireTier) : false,
        contextLost: samples.some((s) => s.liveness?.contextLost),
        canvasMissing: samples.some((s) => !s.liveness?.canvasConnected),
        tiers: [...new Set(samples.map((s) => s.tier))],
        minLampPower: samples.length ? round(Math.min(...samples.map((s) => s.lampPower)), 4) : null,
        maxLampPower: samples.length ? round(Math.max(...samples.map((s) => s.lampPower)), 4) : null,
      }
      entry.consoleErrors = [...entry.consoleErrors, ...errors]
      await writeFile(path.join(caseOut, 'motion-telemetry.json'), JSON.stringify({ url, case: caseName, viewport: { width, height }, gpu, duration, sampleInterval, scrub: SCRUB, samples }, null, 2))
      console.log(JSON.stringify({ case: caseName, pass: 'video', samples: samples.length, video: entry.video?.file ?? null, tiers: entry.motion.tiers, minPower: entry.motion.minLampPower, errors: errors.length }))
    }

    report.cases[caseName] = entry
    await writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2))
  }
} finally {
  await browser.close()
}

const failures = []
for (const [caseName, entry] of Object.entries(report.cases)) {
  if (entry.consoleErrors.length) failures.push(caseName + ': ' + entry.consoleErrors.length + ' console error(s)')
  for (const still of entry.stills) {
    if (still.ok === false) failures.push(caseName + '/' + still.name + ': ' + still.error)
    if (still.liveness && (!still.liveness.canvasConnected || still.liveness.contextLost)) failures.push(caseName + '/' + still.name + ': canvas not live')
    if (still.hard && typeof still.lampPower === 'number' && Math.abs(still.lampPower - still.expectedPower) > 0.06) {
      failures.push(caseName + '/' + still.name + ': lampPower ' + round(still.lampPower, 4) + ' off plan ' + still.expectedPower)
    }
    if (requireTier && still.tier && still.tier !== requireTier) failures.push(caseName + '/' + still.name + ': tier ' + still.tier + ' != required ' + requireTier)
  }
  if (entry.motion?.contextLost) failures.push(caseName + ': context lost during the scrub')
  if (entry.motion?.canvasMissing) failures.push(caseName + ': canvas missing during the scrub')
  if (passes.includes('video') && !entry.video) failures.push(caseName + ': no review video written')
}

// The motion pass is gated here, in the verdict, not only on stdout: a lite scrub under
// --require-tier=full, an empty recording, a dead canvas mid-scrub, or a scrub that never landed
// on the resolved endpoint all fail the run even when every still was clean.
const motionFailures = []
if (passes.includes('video')) {
  for (const [caseName, entry] of Object.entries(report.cases)) {
    const motion = entry.motion
    if (!motion) { motionFailures.push(caseName + ': video requested but the motion pass recorded no telemetry'); continue }
    if (!(motion.samples > 0)) motionFailures.push(caseName + ': video requested but no motion telemetry was recorded')
    if (!motion.live) motionFailures.push(caseName + ': video requested but the canvas was not live throughout (' + motion.notLive + ' dead sample(s))')
    if (motion.tierMismatch) motionFailures.push(caseName + ': motion ran tiers ' + JSON.stringify(motion.tiers) + ', not the required ' + requireTier)
    if (motion.finalT !== SCRUB.to) motionFailures.push(caseName + ': motion never landed on the ' + SCRUB.to + ' endpoint (finalT=' + motion.finalT + ')')
    if (!entry.video) motionFailures.push(caseName + ': no review video written')
  }
}
failures.push(...motionFailures)

// The verdict lives in the evidence file as well as on stdout, so a terminal scrollback is not the
// only record of what passed.
report.verdict = {
  label,
  pass: failures.length === 0,
  requireTier: requireTier || null,
  failures,
  decidedAt: new Date().toISOString(),
}
await writeFile(path.join(out, 'summary.json'), JSON.stringify(report, null, 2))

console.log(failures.length ? label + ' — REVIEW ARTIFACTS INCOMPLETE' : label + ' — review artifacts complete')
for (const failure of failures) console.log('  ' + failure)
console.log('Evidence: ' + out)
if (failures.length) process.exitCode = 1

