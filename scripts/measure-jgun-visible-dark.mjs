// Measures what the rendered dark beat actually looks like ON the drawing sheet.
//
// Every patch is authored in SHEET coordinates and projected through the live sheet matrix and
// the live camera, so each reading is attached to a physical place on the vellum: blank stock
// inside the drawing frame, printed linework on the registered elevation, dimension lettering,
// the electrical trace along the measured profile, and the surrounding desk/backdrop. A
// screen-space average would blend all of those together and could not say whether the stock
// stayed readable or whether the printed ink stayed darker than its own paper. Material uniforms
// and tier telemetry are recorded, but they are never the measurement.
//
// The trace is measured twice from the SAME registered hold camera: at the trace beat and at the
// dark beat. `__drawingProof.captureLightningPixels()` adds the offscreen normal-vs-null control
// that hides the ribbon outright, so a still cannot claim an electrical event the renderer never
// drew. One fresh page per still: a lost WebGL context must never masquerade as a measurement.
//
// Usage:
//   node scripts/measure-jgun-visible-dark.mjs [--url=http://localhost:4173] [--out=<dir>]
//     [--cases=desktop,narrow] [--points=0.4,0.4864,0.5332,0.5436,0.58,0.59,0.69,0.82,0.94,0.98]
//     [--label=baseline] [--radius=4] [--assert=0|1]
//     [--require-tier=full]
//
// Phase table: docs/jgun-storm-flicker-visible-dark-plan.md ("Visual thesis and phase contract").

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=')
  return [key, value.join('=')]
}))

// The built preview is authoritative: the dev server HMR can tear the scene down mid-capture.
const url = args.url || 'http://localhost:4173'
const label = args.label || 'visible-dark'
const assert = args.assert !== '0'
const radius = Math.max(1, Math.min(12, Number(args.radius || 4)))
// Review stills are only full-finish evidence when the FULL shader set is live. The quality
// ratchet is never overridden here: a mismatched tier is retried on a fresh page and, if it still
// does not match, fails the run, so a lite frame can never be filed as full-tier proof.
const requireTier = args['require-tier'] || ''
const out = path.resolve(args.out || `project/work/evidence/JG-035-opening-drafting-table/storm-visible-dark-2026-09-30/${label}`)

const CASES = {
  desktop: { width: 1600, height: 900 },
  narrow: { width: 390, height: 844 },
}
const caseNames = (args.cases || 'desktop,narrow').split(',').map((s) => s.trim()).filter(Boolean)
for (const name of caseNames) {
  if (!CASES[name]) throw new Error(`Unknown case "${name}" (expected ${Object.keys(CASES).join(', ')})`)
}

/**
 * Intro t -> paced progress factor: `drawingIntroState` divides progress by
 * `DRAWING_INTRO_WINDOW.releaseEnd` (0.12, unchanged by pacing). This is NOT the raw document
 * share (`INTRO_SCROLL_SHARE`, 0.50 since 2026-10-01) — `setProgress` consumes that internally
 * through `rawScrollFor`.
 */
const INTRO_SHARE = 0.12
/** Storm flicker envelope: the five irregular failures and their unequal recoveries. */
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

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const smooth01 = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t) }
const introT = (u) => FLICKER.start + u * (FLICKER.end - FLICKER.start)
const round = (v, n = 2) => (typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(n)) : null)
const sum = (values) => values.reduce((a, b) => a + b, 0)
const median = (values) => {
  const s = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : null
}

/** The lamp power the plan predicts at intro time `t`, plus whether it is a hard contract. */
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
 * Stable, collision-free checkpoint name, shared verbatim with capture-jgun-blackout-motion.mjs so
 * a still filename and a measurement row always mean the same scroll position. The failure-key
 * INDEX is part of the name and the values are fixed to three decimals, so two keys that round to
 * the same numbers still get distinct names.
 */
function checkpointName(t) {
  const beat = Object.entries(BEATS).find(([, value]) => Math.abs(value - t) < 1e-9)
  if (beat) return 'beat-' + beat[0]
  const index = FLICKER.u.findIndex((u) => Math.abs(introT(u) - t) < 1e-9)
  if (index >= 0) {
    return 'flicker-k' + String(index).padStart(2, '0') + '-' + flickerKind(index)
      + '-u' + sanitize(FLICKER.u[index].toFixed(3)) + '-p' + sanitize(FLICKER.power[index].toFixed(3))
  }
  return 't' + sanitize(t.toFixed(3))
}

const points = (args.points || [BEATS.lit, introT(0.28), introT(0.64), introT(0.72), FLICKER.end, BEATS.dark, BEATS.trace, BEATS.pressure, BEATS.resolved].join(','))
  .split(',').map(Number)
if (points.some((p) => !Number.isFinite(p) || p < 0 || p > 1)) throw new Error('Expected finite intro times in [0,1]')

/** Plan-driven evidence targets. None of these replace an existing gate; they are the new ones. */
const TARGETS = {
  /** Apparent luminance of unoccluded stock during the dark hold, 8-bit sRGB. */
  darkPaperLuminance: [20, 40],
  /** Line ink must sit this far below the stock in the SAME sampled window. */
  inkOverStock: 6,
  /** Printed lettering (darkest pixel in its own font rect) must sit this far below its stock. */
  textOverStock: 6,
  /** Minimum valid letter boxes before a text-contrast median means anything. */
  minTextSamples: 6,
  /** Bright pixels contributed across the sampled trace windows at the trace beat. */
  traceBrightPixels: 8,
  /** Offscreen normal-vs-null contour pixels at the trace beat. */
  traceContourPixels: 1,
}

/**
 * Installed in every page. The quality store also creates a detached WebGL2 probe canvas, so the
 * render surface is chosen by the same liveness predicate the opening verifier uses: connected,
 * laid out, and actually sized. Asking the element for its context returns the real R3F context,
 * which is where the GPU renderer string comes from.
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

/**
 * Runs in the page. Selects the sheet-coordinate sample set once per page and projects it
 * through the CURRENT sheet matrix and camera, then returns the live state alongside it.
 */
const PROBE = () => {
  const scene = window.__threeScene
  const camera = window.__threeCamera
  const canvas = window.__captureHelpers.pickCanvas()
  const api = window.__drawingProof
  if (!scene || !camera || !canvas || !api) throw new Error('LIVE_CANVAS_MISSING')
  const frame = scene.getObjectByName('engineering-drawing-plane-frame')
  const paper = scene.getObjectByName('engineering-drawing-Z0')
  if (!frame || !paper) throw new Error('SHEET_MISSING')
  // The group copies the live sheet matrix with matrixAutoUpdate off, so force the world update
  // instead of trusting the renderer's dirty flags, and refresh the camera basis we project with.
  frame.updateMatrixWorld(true)
  camera.updateMatrixWorld(true)
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert()

  const lines = frame.children.find((m) => m.geometry?.getAttribute?.('aSeg'))
  const seg = lines?.geometry?.getAttribute?.('aSeg')
  const style = lines?.geometry?.getAttribute?.('aStyle')
  if (!seg) throw new Error('INK_GEOMETRY_MISSING')
  const segs = []
  for (let i = 0; i < seg.count; i += 1) {
    segs.push({ a: [seg.getX(i), seg.getY(i)], b: [seg.getZ(i), seg.getW(i)], group: style ? style.getY(i) : 0 })
  }

  // Lettering comes from the sheet's own text layer, so printer notes are never counted as
  // blank stock. Group ids are ink.ts GROUP (0 printed, 1 titleBlock, 2 notes, 13 sideDims,
  // 14 sideLabels, 15 gdt).
  const textBoxes = []
  const textItems = []
  // The proof surface exposes the whole lettering layer at once (captureTextBounds) and the title
  // block alone (captureTitleBounds) - there is no per-group accessor. Each item carries its own
  // ink.ts GROUP, which the block filters below key on.
  try {
    for (const item of api.captureTextBounds()?.items ?? []) {
      if (!item.bounds) continue
      textBoxes.push(item.bounds)
      textItems.push({ group: item.group, bounds: item.bounds })
    }
  } catch { /* the lettering layer has no ready layout yet */ }

  // SHEET_ZONES.frame (drawingGeometry.ts) and the three printed blocks that live inside it.
  const FRAME = { x: -0.38, y: -0.23, w: 0.76, h: 0.46 }
  const BLOCKED = [
    { x: 0.14, y: -0.23, w: 0.24, h: 0.085 },
    { x: 0.14, y: -0.145, w: 0.24, h: 0.036 },
    { x: 0.198, y: 0.118, w: 0.176, h: 0.106 },
  ]
  const inside = (p, r, pad) => p[0] >= r.x - pad && p[0] <= r.x + r.w + pad && p[1] >= r.y - pad && p[1] <= r.y + r.h + pad

  // Coarse ink occupancy: a candidate with no ink cell within two cells (16 mm) is at least
  // 10 mm of bare stock away from the nearest printed line.
  const CELL = 0.008
  const occupied = new Set()
  const cellKey = (ix, iy) => `${ix},${iy}`
  for (const s of segs) {
    const length = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1])
    const steps = Math.max(1, Math.ceil(length / (CELL * 0.5)))
    for (let k = 0; k <= steps; k += 1) {
      const u = k / steps
      occupied.add(cellKey(Math.floor((s.a[0] + (s.b[0] - s.a[0]) * u) / CELL), Math.floor((s.a[1] + (s.b[1] - s.a[1]) * u) / CELL)))
    }
  }
  const clearOfInk = (p) => {
    const ix = Math.floor(p[0] / CELL), iy = Math.floor(p[1] / CELL)
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dy = -2; dy <= 2; dy += 1) if (occupied.has(cellKey(ix + dx, iy + dy))) return false
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
  // Farthest-point spread so the paper reading is not one corner of the sheet.
  const chosen = []
  if (candidates.length) {
    chosen.push(candidates[0])
    while (chosen.length < 18 && chosen.length < candidates.length) {
      let best = null
      let bestDistance = -1
      for (const p of candidates) {
        let nearest = Infinity
        for (const c of chosen) nearest = Math.min(nearest, Math.hypot(p[0] - c[0], p[1] - c[1]))
        if (nearest > bestDistance) { bestDistance = nearest; best = p }
      }
      if (!best) break
      chosen.push(best)
    }
  }

  // Printed linework on the registered elevation (side + its dimensions) — the view the camera
  // settles square-on to, so these patches are ink the visitor is actually meant to read.
  const inkSegs = segs.filter((s) => s.group === 12 || s.group === 13)
  const inkPatches = []
  const stride = Math.max(1, Math.floor(inkSegs.length / 24))
  for (let i = 0; i < inkSegs.length && inkPatches.length < 24; i += stride) {
    const s = inkSegs[i]
    inkPatches.push([(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2, 0.0003, s.group])
  }

  // Printed lettering blocks on the sheet. The screen-space FONT RECT is computed below, once
  // `project` exists: the darkest pixel inside that rect is the lettering and its median the
  // adjacent stock, so a centre that falls in the gap between glyph strokes cannot report clean
  // stock as text.
  const textBlocks = []
  for (const group of [14, 13, 2, 15]) {
    for (const item of textItems.filter((entry) => entry.group === group)) textBlocks.push({ group, bounds: item.bounds })
  }

  // The electrical ribbon follows the measured profile; sample it along its own arc length.
  const tracePatches = []
  const ribbon = scene.getObjectByName('lightning')
  const positions = ribbon?.geometry?.getAttribute?.('position')
  const arcs = ribbon?.geometry?.getAttribute?.('arcLength')
  if (positions && arcs) {
    const targets = []
    for (let k = 0; k < 28; k += 1) targets.push(0.06 + (0.88 * k) / 27)
    let next = 0
    for (let i = 0; i + 1 < positions.count; i += 2) {
      while (next < targets.length && arcs.getX(i) >= targets[next]) {
        tracePatches.push([(positions.getX(i) + positions.getX(i + 1)) / 2, (positions.getY(i) + positions.getY(i + 1)) / 2, 0.00045, 0])
        next += 1
      }
    }
  }
  const traceFallback = tracePatches.length === 0

  const rect = canvas.getBoundingClientRect()
  const scratch = frame.position.clone()
  const project = (p) => {
    const world = scratch.set(p[0], p[1], p[2]).applyMatrix4(frame.matrixWorld)
    const ndc = world.project(camera)
    return {
      sheet: [p[0], p[1], p[2]],
      group: p[3] ?? null,
      x: rect.x + ((ndc.x + 1) * rect.width) / 2,
      y: rect.y + ((1 - ndc.y) * rect.height) / 2,
      ndcZ: ndc.z,
    }
  }
  // Desk / backdrop support, authored in SHEET coordinates OUTSIDE the stock trim
  // (SHEET_WIDTH/2 = 0.4 by SHEET_HEIGHT/2 = 0.25). The drawing frame at +/-0.38/0.23 is an inset
  // border, not the sheet edge, so anything inside the trim is still paper — the previous
  // viewport-fraction sampling landed on the stock at a tight framing and read paper as support.
  // Candidates that project outside the viewport are dropped: a close framing shows no background
  // at all, which is recorded rather than quietly sampled as paper.
  const surroundCandidates = [
    [0, 0.30], [0, 0.36], [0, 0.44], [0, 0.56], [0, 0.72], [0, 0.92],
    [0.3, 0.30], [-0.3, 0.30], [0.3, 0.44], [-0.3, 0.44],
    [0.45, 0], [-0.45, 0], [0.45, 0.18], [-0.45, 0.18], [0.45, -0.18], [-0.45, -0.18],
    [0.60, 0], [-0.60, 0], [0.78, 0.16], [-0.78, 0.16], [0.98, 0], [-0.98, 0],
  ]
  const surround = surroundCandidates
    .filter(([x, y]) => (Math.abs(x) > 0.42 || Math.abs(y) > 0.28) && Math.abs(x) <= 1.5 && Math.abs(y) <= 1.05)
    .map(([x, y]) => project([x, y, 0]))
    .filter((p) => p.x >= rect.x + 6 && p.x <= rect.x + rect.width - 6 && p.y >= rect.y + 6 && p.y <= rect.y + rect.height - 6)

  // Screen-space letter boxes from the sheet-space text bounds (four projected corners).
  const textRects = textBlocks.map(({ group, bounds }) => {
    const [x0, y0, x1, y1] = bounds
    const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => project([x, y, 0.0004]))
    const xs = corners.map((p) => p.x)
    const ys = corners.map((p) => p.y)
    return { group, sheet: bounds, rect: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }
  })

  const d = window.__telemetry?.drawing ?? {}
  const c = window.__telemetry?.camera ?? {}
  // Probe surface first: a missing helper is a harness failure to report, never a quiet unknown.
  const REQUIRED_API = ['captureLightningPixels', 'captureRegistration', 'captureTextBounds', 'sheetStats']
  const apiMissing = REQUIRED_API.filter((name) => typeof api[name] !== 'function')
  /**
   * The offscreen normal-vs-null trace control is recorded as OBSERVED only when the helper
   * returned numeric readings. A missing helper, a throw, or a non-numeric result is UNKNOWN, and
   * the requirement it backs is "the dark hold observes zero contour pixels" — unknown must never
   * be laundered into a pass. This is also why the STATUS is stored rather than the reading alone:
   * a future build may legitimately return early when no ribbon is active (comparing two identical
   * renders proves nothing), and that intentional unavailability has to read as unknown too.
   */
  let traceControl = null
  let traceControlStatus = 'unavailable'
  let traceControlError = null
  if (typeof api.captureLightningPixels !== 'function') {
    traceControlStatus = 'missing-api'
    traceControlError = 'captureLightningPixels is not exposed by __drawingProof'
  } else {
    try {
      const reading = api.captureLightningPixels()
      traceControl = reading ?? null
      if (typeof reading?.contourPixels === 'number' && typeof reading?.changedBrightPixels === 'number') {
        traceControlStatus = 'observed'
      } else {
        traceControlStatus = 'unavailable'
        traceControlError = 'captureLightningPixels returned no numeric contourPixels/changedBrightPixels'
      }
    } catch (error) {
      traceControlStatus = 'error'
      traceControlError = String(error)
    }
  }
  let matrixConsistent = null
  try {
    const elements = frame.matrix.elements
    const telemetryMatrix = d.planeMatrix
    matrixConsistent = !!telemetryMatrix && elements.every((v, i) => Math.abs(v - telemetryMatrix[i]) < 1e-6)
  } catch { matrixConsistent = null }

  const trace = traceFallback ? inkPatches.map(([x, y]) => [x, y, 0.00045, 12]) : tracePatches
  return {
    canvas: true,
    gpu: window.__captureHelpers.gpu(),
    liveness: window.__captureHelpers.liveness(),
    mode: window.__drawingProofMode ?? 'normal',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    phase: d.phase,
    lampPower: d.lampPower,
    blackout: d.blackout,
    pulse: d.pulse,
    pulseHead: d.pulseHead,
    inkLuminance: d.inkLuminance,
    bulge: d.bulgeDisplacement,
    vellum: d.vellum,
    // Pose evidence behind the resolved/handoff claim.
    minZ: d.minZ,
    localZ: d.localZ,
    contact: d.contact,
    travel: d.travel,
    poseT: d.poseT,
    crossing: d.crossing,
    tier: window.__telemetry?.performance?.tier,
    annotationsReady: d.annotationsReady,
    camera: {
      x: c.x, y: c.y, z: c.z, fov: c.fov,
      residual: c.goal ? Math.hypot(c.x - c.goal.position[0], c.y - c.goal.position[1], c.z - c.goal.position[2]) : null,
    },
    stats: api.sheetStats ? api.sheetStats() : null,
    matrixConsistent,
    traceControl,
    traceControlStatus,
    traceControlError,
    apiMissing,
    traceFallback,
    counts: { paper: chosen.length, ink: inkPatches.length, text: textRects.length, trace: trace.length, surround: surround.length, segments: segs.length, textBoxes: textBoxes.length },
    frameRect: FRAME,
    image: { width: Math.round(rect.width), height: Math.round(rect.height) },
    patches: {
      paper: chosen.map(project),
      ink: inkPatches.map(project),
      text: textRects,
      trace: trace.map(project),
      surround,
    },
  }
}

/**
 * Runs in the page. Samples the screenshot around each projected patch. Per patch it returns the
 * darkest and the median luminance in the window: the median is the LOCAL stock around a line and
 * the minimum is the line itself, so "ink darker than adjacent paper" is measured inside one
 * window instead of across two different places on the sheet.
 */
const SAMPLER = async ({ b64, patches, radius }) => {
  const image = new Image()
  image.src = `data:image/png;base64,${b64}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(image, 0, 0)
  const sample = (p, r) => {
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < r || y < r || x >= image.width - r || y >= image.height - r) {
      return { sheet: p.sheet, group: p.group, x, y, valid: false, reason: 'OUT_OF_FRAME' }
    }
    const size = r * 2 + 1
    const data = ctx.getImageData(x - r, y - r, size, size).data
    const lum = []
    for (let i = 0; i < data.length; i += 4) lum.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
    const sorted = [...lum].sort((a, b) => a - b)
    const at = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
    return {
      sheet: p.sheet, group: p.group, x, y, valid: true,
      min: sorted[0], p05: at(0.05), median: at(0.5), max: sorted[sorted.length - 1],
      mean: lum.reduce((a, b) => a + b, 0) / lum.length,
      darkCount: lum.filter((v) => v < 64).length,
      brightCount: lum.filter((v) => v > 160).length,
      pixels: lum.length,
    }
  }
  /** Screen-space font rect: the darkest pixel is the lettering, the median the adjacent stock. */
  const rectSample = (r) => {
    const margin = 1
    const x0 = Math.max(margin, Math.round(Math.min(r.rect[0], r.rect[2])) - margin)
    const y0 = Math.max(margin, Math.round(Math.min(r.rect[1], r.rect[3])) - margin)
    const x1 = Math.min(image.width - margin, Math.round(Math.max(r.rect[0], r.rect[2])) + margin)
    const y1 = Math.min(image.height - margin, Math.round(Math.max(r.rect[1], r.rect[3])) + margin)
    const w = x1 - x0
    const h = y1 - y0
    // A block projected behind the camera can yield non-finite corners, which would otherwise be
    // handed to getImageData as a NaN region.
    if (![x0, y0, x1, y1].every(Number.isFinite)) return { sheet: r.sheet, group: r.group, rect: r.rect, valid: false, reason: 'NON_FINITE' }
    if (w < 2 || h < 2) return { sheet: r.sheet, group: r.group, rect: r.rect, valid: false, reason: 'TOO_SMALL' }
    const data = ctx.getImageData(x0, y0, w, h).data
    const lum = []
    for (let i = 0; i < data.length; i += 4) lum.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
    const sorted = [...lum].sort((a, b) => a - b)
    const at = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
    return {
      sheet: r.sheet, group: r.group, rect: r.rect, x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2), valid: true,
      min: sorted[0], p05: at(0.05), median: at(0.5), max: sorted[sorted.length - 1],
      mean: lum.reduce((a, b) => a + b, 0) / lum.length,
      darkCount: lum.filter((v) => v < 64).length,
      brightCount: lum.filter((v) => v > 160).length,
      pixels: lum.length,
    }
  }
  return {
    image: { width: image.width, height: image.height },
    paper: patches.paper.map((p) => sample(p, radius)),
    ink: patches.ink.map((p) => sample(p, radius)),
    // Lettering needs a wider window than a pen line: the strokes are small and sparse.
    // Letter boxes are sampled as rects: the darkest pixel inside the font rect is the lettering
    // and the median is the adjacent stock, which removes the reliance on a single sample point.
    text: patches.text.map((r) => rectSample(r)),
    trace: patches.trace.map((p) => sample(p, radius)),
    surround: patches.surround.map((p) => sample(p, radius)),
  }
}

/** Wait until the pinned progress has rendered through a real frame and the camera has settled. */
async function settle(page, t) {
  await page.waitForFunction((expected) => {
    const d = window.__telemetry?.drawing
    return !!window.__captureHelpers?.pickCanvas?.() && !!d && Math.abs(d.phase - expected) < 1e-6
  }, t, { timeout: 30000 })
  await page.waitForFunction(() => {
    const c = window.__telemetry?.camera
    const g = c?.goal
    if (!g) return false
    return Math.hypot(c.x - g.position[0], c.y - g.position[1], c.z - g.position[2]) < 1e-4 && Math.abs(c.fov - g.fov) < 1e-4
  }, null, { timeout: 15000 }).catch(() => false)
  // The reading pool trails the look-at point with a damped first-order lag; let it arrive.
  await page.waitForTimeout(450)
}

/** The projected patch groups. Anything else in `pixels` is capture metadata, not samples. */
const PATCH_KINDS = ['paper', 'ink', 'text', 'trace', 'surround']

const metrics = (list) => {
  const valid = (Array.isArray(list) ? list : []).filter((p) => p.valid)
  if (!valid.length) return null
  return {
    count: valid.length,
    median: round(median(valid.map((p) => p.median))),
    mean: round(valid.map((p) => p.mean).reduce((a, b) => a + b, 0) / valid.length),
    min: round(Math.min(...valid.map((p) => p.min))),
    max: round(Math.max(...valid.map((p) => p.max))),
    p05: round(Math.min(...valid.map((p) => p.p05))),
    darkPixels: sum(valid.map((p) => p.darkCount)),
    brightPixels: sum(valid.map((p) => p.brightCount)),
  }
}

function summarize(row) {
  const px = row.pixels ?? {}
  const expected = expectedPowerFor(row.t)
  const inkLocalContrast = (px.ink ?? []).filter((p) => p.valid).map((p) => p.median - p.min)
  const textLocalContrast = (px.text ?? []).filter((p) => p.valid).map((p) => p.median - p.min)
  return {
    t: row.t,
    name: row.name,
    case: row.case,
    ok: row.ok !== false,
    error: row.error ?? null,
    errors: row.errors ?? [],
    attempt: row.attempt,
    gpu: row.gpu ?? null,
    liveness: row.liveness ?? null,
    phase: round(row.phase, 6),
    lampPower: round(row.lampPower, 4),
    expectedPower: round(expected.value, 4),
    expectedSource: expected.source,
    powerDelta: round(typeof row.lampPower === 'number' ? Math.abs(row.lampPower - expected.value) : null, 4),
    powerHard: expected.hard,
    blackout: row.blackout,
    minZ: round(row.minZ, 6),
    localZ: round(row.localZ, 6),
    contact: Array.isArray(row.contact) ? row.contact.map((v) => round(v, 6)) : (row.contact ?? null),
    travel: round(row.travel, 6),
    poseT: round(row.poseT, 6),
    crossing: round(row.crossing, 6),
    pulse: row.pulse,
    pulseHead: round(row.pulseHead, 4),
    tier: row.tier,
    mode: row.mode,
    reducedMotion: row.reducedMotion,
    annotationsReady: row.annotationsReady,
    cameraResidual: round(row.camera?.residual, 6),
    matrixConsistent: row.matrixConsistent,
    counts: row.counts,
    stats: row.stats,
    traceFallback: row.traceFallback,
    traceControl: row.traceControl,
    traceControlStatus: row.traceControlStatus ?? 'unavailable',
    traceControlError: row.traceControlError ?? null,
    apiMissing: row.apiMissing ?? [],
    paper: metrics(px.paper),
    ink: metrics(px.ink),
    text: metrics(px.text),
    trace: metrics(px.trace),
    surround: metrics(px.surround),
    pixelsImage: px.image ?? null,
    inkOverStock: round(median(inkLocalContrast)),
    textOverStock: round(median(textLocalContrast)),
    shaderValid: row.traceControl?.shaderValid ?? null,
    // Only the projected patch groups are counted. `pixels.image` is capture metadata, not a
    // patch list, so it is preserved untouched and never filtered.
    invalidPatches: Object.fromEntries(PATCH_KINDS.map((kind) => [kind, (Array.isArray(px[kind]) ? px[kind] : []).filter((p) => !p.valid).length])),
  }
}

/** Developer GPU-evidence flags; the anti-throttling trio is explained in capture-jgun-blackout-motion.mjs. */
const LAUNCH_ARGS = [
  '--use-angle=d3d11',
  '--enable-gpu',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
]
const browser = await chromium.launch({ channel: 'chrome', args: LAUNCH_ARGS })
const rows = []
try {
  for (const caseName of caseNames) {
    const { width, height } = CASES[caseName]
    const caseOut = path.join(out, caseName)
    await mkdir(caseOut, { recursive: true })
    for (const t of points) {
      const name = checkpointName(t)
      let record = null
      // A ratcheted tier is a fresh-page problem, so a required tier earns extra attempts.
      const maxAttempts = requireTier ? 4 : 2
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference', deviceScaleFactor: 1, serviceWorkers: 'block' })
        await context.addInitScript(PAGE_HELPERS)
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', (error) => errors.push(String(error.message)))
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded' })
          await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 120000 })
          await page.evaluate(() => { window.__scrollCommitDisabled = true })
          await page.evaluate((progress) => window.__drawingProof.setProgress(progress), t * INTRO_SHARE)
          await settle(page, t)
          if (requireTier) {
            const tierNow = await page.evaluate(() => window.__telemetry?.performance?.tier ?? null)
            if (tierNow !== requireTier) throw new Error('TIER_MISMATCH ' + tierNow + ' != ' + requireTier)
          }
          const probe = await page.evaluate(PROBE)
          const png = await page.screenshot({ path: path.join(caseOut, `still-${name}.png`) })
          const pixels = await page.evaluate(SAMPLER, { b64: png.toString('base64'), patches: probe.patches, radius })
          record = { t, name, case: caseName, attempt, errors, ...probe, pixels, ok: errors.length === 0 }
          if (record.ok) break
        } catch (error) {
          record = { t, name, case: caseName, attempt, errors, ok: false, error: String(error) }
        } finally {
          await page.close()
          await context.close()
        }
      }
      rows.push(record)
      const row = summarize(record)
      console.log(JSON.stringify({
        case: caseName, t: row.t, name: row.name, ok: row.ok, phase: row.phase, power: row.lampPower, expected: row.expectedPower,
        paper: row.paper?.median ?? null, inkStock: row.inkOverStock, surround: row.surround?.median ?? null,
        traceBright: row.trace?.brightPixels ?? null, control: { contour: row.traceControl?.contourPixels, bright: row.traceControl?.changedBrightPixels },
        control: { status: row.traceControlStatus, contour: row.traceControl?.contourPixels ?? null, bright: row.traceControl?.changedBrightPixels ?? null },
        tier: row.tier, error: row.error ?? row.errors[0] ?? null,
      }))
    }
  }
} finally {
  await browser.close()
}

const summaries = rows.map(summarize)
const cases = {}
const checks = []
for (const caseName of caseNames) {
  const caseRows = summaries.filter((row) => row.case === caseName)
  const at = (t) => caseRows.find((row) => Math.abs(row.t - t) < 1e-9)
  const lit = at(BEATS.lit)
  const dark = at(BEATS.dark)
  const trace = at(BEATS.trace)
  const consoleErrors = sum(caseRows.map((row) => row.errors.length))
  const failedStills = caseRows.filter((row) => !row.ok).map((row) => row.name)
  const caseChecks = [
    {
      id: 'tier-required', source: requireTier ? 'harness' : 'info', case: caseName,
      observed: { required: requireTier || null, tiers: [...new Set(caseRows.map((row) => row.tier))] },
      pass: requireTier ? caseRows.every((row) => row.tier === requireTier) : null,
      note: 'With --require-tier set, every still must have run on that tier; a lite frame is not full-tier finish evidence.',
    },
    {
      id: 'stills-captured', source: 'harness', case: caseName,
      observed: { failedStills, consoleErrors },
      pass: failedStills.length === 0 && consoleErrors === 0,
      note: 'Every still rendered a live canvas with a clean console.',
    },
    {
      id: 'dark-paper-in-band', source: 'plan', case: caseName,
      observed: dark?.paper?.median ?? null,
      pass: dark?.paper?.median !== null && dark?.paper?.median !== undefined && dark.paper.median >= TARGETS.darkPaperLuminance[0] && dark.paper.median <= TARGETS.darkPaperLuminance[1],
      note: `Unoccluded stock at the dark beat, apparent luminance ${TARGETS.darkPaperLuminance[0]}-${TARGETS.darkPaperLuminance[1]}/255 (plan).`,
    },
    {
      id: 'ink-darker-than-stock', source: 'plan', case: caseName,
      observed: dark?.inkOverStock ?? null,
      pass: typeof dark?.inkOverStock === 'number' && dark.inkOverStock >= TARGETS.inkOverStock,
      note: `Line ink must stay at least ${TARGETS.inkOverStock}/255 below the stock in the SAME window at the dark beat.`,
    },
    {
      id: 'text-darker-than-stock', source: 'plan', case: caseName,
      observed: { samples: dark?.text?.count ?? 0, contrast: dark?.textOverStock ?? null },
      pass: typeof dark?.textOverStock === 'number' && dark.textOverStock >= TARGETS.textOverStock
        && (dark?.text?.count ?? 0) >= TARGETS.minTextSamples,
      note: 'Printed lettering, measured as the darkest pixel inside each font rect against that rect own adjacent stock, must stay below it across enough boxes.',
    },
    {
      id: 'surround-subordinate', case: caseName,
      // Asserted only when the framing actually shows desk/backdrop. At the registered settle the
      // stock fills the viewport, so "no off-sheet pixel in frame" is reported, never a silent pass.
      source: (dark?.surround?.count ?? 0) > 0 ? 'plan' : 'info',
      observed: { samples: dark?.surround?.count ?? 0, paper: dark?.paper?.median ?? null, surround: dark?.surround?.median ?? null },
      // A count of zero means the registered framing shows no page edge at all (framing absence),
      // which is non-applicable rather than a failed background.
      reason: (dark?.surround?.count ?? 0) > 0 ? null : 'NOT_IN_FRAME',
      pass: (dark?.surround?.count ?? 0) > 0
        ? (typeof dark?.paper?.median === 'number' && typeof dark?.surround?.median === 'number' && dark.surround.median <= dark.paper.median)
        : null,
      note: 'Desk/backdrop support sampled OFF the stock trim must not out-luminance the sheet. Zero visible support is reported as not-in-frame, not asserted.',
    },
    {
      id: 'trace-bright-on-screen', source: 'plan', case: caseName,
      observed: { trace: trace?.trace?.brightPixels ?? null, dark: dark?.trace?.brightPixels ?? null },
      pass: typeof trace?.trace?.brightPixels === 'number' && trace.trace.brightPixels >= TARGETS.traceBrightPixels
        && typeof dark?.trace?.brightPixels === 'number' && trace.trace.brightPixels > dark.trace.brightPixels + 4,
      note: 'The electrical trace contributes bright pixels at its own beat and none at the dark beat, same registered camera.',
    },
    {
      id: 'trace-null-control-trace', source: 'plan', case: caseName,
      observed: { status: trace?.traceControlStatus ?? 'unavailable', reading: trace?.traceControl ?? null, error: trace?.traceControlError ?? null },
      pass: trace?.traceControlStatus === 'observed'
        && trace.traceControl.contourPixels >= TARGETS.traceContourPixels
        && trace.traceControl.changedBrightPixels >= TARGETS.traceContourPixels,
      note: 'Offscreen normal-vs-null (ribbon hidden) delta at the trace beat. Unknown, errored or missing helper fails this requirement.',
    },
    {
      id: 'trace-null-control-dark', source: 'plan', case: caseName,
      observed: { status: dark?.traceControlStatus ?? 'unavailable', reading: dark?.traceControl ?? null, error: dark?.traceControlError ?? null },
      pass: dark?.traceControlStatus === 'observed' && dark.traceControl.contourPixels === 0,
      note: 'The dark hold must OBSERVE zero contour pixels from the same registered camera. Unavailable is unknown, not zero, so it fails here.',
    },
    {
      id: 'probe-api-present', source: 'harness', case: caseName,
      observed: { missing: [...new Set(caseRows.flatMap((row) => row.apiMissing ?? []))] },
      pass: caseRows.every((row) => (row.apiMissing ?? []).length === 0),
      note: 'Every required __drawingProof helper must exist; a missing helper is a harness failure, never a silent unknown.',
    },
    {
      id: 'lit-hold-bright', source: 'info', case: caseName,
      observed: lit?.paper?.median ?? null,
      pass: null,
      note: 'Reference only: the lit hold is the bright end of the same measurement chain.',
    },
    {
      id: 'tier-and-gpu', source: 'info', case: caseName,
      observed: { tier: dark?.tier ?? null, matrixConsistent: dark?.matrixConsistent ?? null },
      pass: null,
      note: 'Full-tier finish needs headed Chrome on D3D11; a downgraded tier or a stale sheet matrix invalidates the finish reading, not the numbers.',
    },
  ]
  checks.push(...caseChecks)
  cases[caseName] = {
    viewport: CASES[caseName],
    gpu: dark?.gpu ?? caseRows[0]?.gpu ?? null,
    liveness: dark?.liveness ?? null,
    rows: caseRows,
    checks: caseChecks.map((check) => ({ ...check, case: undefined })),
  }
}

const asserted = checks.filter((check) => check.source !== 'info')
const failed = asserted.filter((check) => !check.pass)
const summary = {
  url,
  label,
  generatedAt: new Date().toISOString(),
  radius,
  requireTier: requireTier || null,
  introShare: INTRO_SHARE,
  phaseTable: { flicker: FLICKER, lampReturn: LAMP_RETURN, beats: BEATS },
  targets: TARGETS,
  points,
  invariants: {
    'all-errors': summaries.filter((row) => row.errors.length).map((row) => ({ t: row.t, name: row.name, case: row.case, errors: row.errors })),
    'unclean-stills': summaries.filter((row) => !row.ok).map((row) => ({ t: row.t, name: row.name, case: row.case, error: row.error })),
    'camera-not-settled': summaries.filter((row) => row.cameraResidual !== null && row.cameraResidual > 1e-3).map((row) => ({ t: row.t, case: row.case, residual: row.cameraResidual })),
    'sheet-matrix-stale': summaries.filter((row) => row.matrixConsistent === false).map((row) => ({ t: row.t, case: row.case })),
    'trace-fallback': summaries.filter((row) => row.traceFallback).map((row) => ({ t: row.t, case: row.case })),
    'trace-control-not-observed': summaries.filter((row) => row.traceControlStatus !== 'observed')
      .map((row) => ({ t: row.t, case: row.case, status: row.traceControlStatus, error: row.traceControlError })),
    // Reported, not asserted: at the registered settle the stock fills the viewport, so no
    // off-sheet pixel exists to compare and the subordinate requirement cannot be evaluated.
    'surround-not-in-frame': summaries.filter((row) => (row.surround?.count ?? 0) === 0).map((row) => ({ t: row.t, case: row.case })),
    'probe-api-missing': summaries.filter((row) => (row.apiMissing ?? []).length).map((row) => ({ t: row.t, case: row.case, missing: row.apiMissing })),
    'canvas-not-live': summaries.filter((row) => row.liveness && (!row.liveness.canvasConnected || row.liveness.contextLost))
      .map((row) => ({ t: row.t, case: row.case, liveness: row.liveness })),
    'gpu-unavailable': summaries.filter((row) => row.gpu && row.gpu.available !== true).map((row) => ({ t: row.t, case: row.case, gpu: row.gpu })),
    'power-off-plan-hard': summaries.filter((row) => row.powerHard && typeof row.powerDelta === 'number' && row.powerDelta > 0.06)
      .map((row) => ({ t: row.t, case: row.case, observed: row.lampPower, expected: row.expectedPower })),
  },
  cases,
  checks,
  failed: failed.map((check) => ({ id: check.id, case: check.case, observed: check.observed })),
}

await writeFile(path.join(out, 'visible-dark-summary.json'), JSON.stringify(summary, null, 2))

const decision = failed.length === 0 ? 'PASS' : 'FAIL'
console.log(`${label} — ${decision} (${asserted.length - failed.length}/${asserted.length} asserted checks) → ${out}`)
for (const check of failed) console.log(`  FAIL ${check.case}/${check.id}: ${JSON.stringify(check.observed)}`)
if (assert && failed.length) process.exitCode = 1
