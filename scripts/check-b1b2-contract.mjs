/**
 * Pure-math contracts for the B1/B2 intro. No browser, render, performance or visual approval.
 * Uses the existing esbuild + Three; writes no compiled files and installs nothing.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const THREE = require('three')
const { Box3, BufferGeometry, EdgesGeometry, Float32BufferAttribute, Matrix4, Vector3 } = THREE

const sourcePaths = [
  'src/scene/drawing/introTimeline.ts',
  'src/scene/drawing/extractionPose.ts',
  'src/scene/drawing/drawingGeometry.ts',
]
const compiled = await build({
  stdin: {
    contents: sourcePaths.map((p) => `export * from './${p}'`).join('\n'),
    resolveDir: root,
    sourcefile: 'b1b2-contract-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  logLevel: 'silent',
  // Share the very same Three constructors with fixtures; bundle its ESM helpers.
  plugins: [
    {
      name: 'external-three-root',
      setup(b) {
        b.onResolve({ filter: /^three$/ }, () => ({ path: 'three', external: true }))
      },
    },
  ],
})
const compiledModule = { exports: {} }
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(require, compiledModule, compiledModule.exports)
const {
  DRAWING_INTRO_WINDOW,
  INTRO_PHASES,
  INTRO_SCROLL_SHARE,
  drawingIntroState,
  introPoseTime,
  introScrollTimeFor,
  pacedProgress,
  rawScrollFor,
  remapHeroProgress,
  makeDrawingLayout,
  projectFeature,
  SHEET_WIDTH,
  SHEET_ZONES,
  SHEET_HEIGHT,
  SIDE_ROTATION,
  SHEET_ROTATION,
  SHEET_UP_WORLD,
  relativePose,
  lowestVertex,
  solveExtraction,
  applyExtraction,
  bindExtractionPressure,
} = compiledModule.exports

const results = []
const measurements = []
function check(name, run) {
  try {
    run()
    results.push({ name, pass: true })
    console.log(`PASS ${name}`)
  } catch (error) {
    results.push({ name, pass: false, error: error.message })
    console.log(`FAIL ${name}: ${error.message}`)
  }
}
const close = (a, b, tolerance = 1e-12, message = '') =>
  assert.ok(Math.abs(a - b) <= tolerance, `${message} expected ${b}, got ${a}, tolerance ${tolerance}`)
const vectorClose = (a, b, tolerance = 1e-12) => a.toArray().forEach((n, i) => close(n, b.toArray()[i], tolerance))
const identityResidual = (m) => Math.max(...m.elements.map((n, i) => Math.abs(n - (i % 5 === 0 ? 1 : 0))))
const state = (t, crossing) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
const allFinite = (value) =>
  typeof value === 'number' ? Number.isFinite(value) : Object.values(value).every(allFinite)
const LAMP_FAILURE_KEYS = [
  [0, 1], [0.12, 0.58], [0.18, 0.92],
  [0.28, 0.14], [0.34, 0.78],
  [0.46, 0.36], [0.51, 0.86],
  [0.64, 0.015], [0.72, 0.015], [0.78, 0.58],
  [0.85, 0.08], [0.91, 0.34], [1, 0],
]
const flickerT = (u) => INTRO_PHASES.flickerStart + u * (INTRO_PHASES.blackoutStart - INTRO_PHASES.flickerStart)
// An asymmetric tetrahedron deliberately lacks most AABB corners: transformed
// Box3 support would be a different answer from the actual vertex support.
const geometry = new BufferGeometry()
geometry.setAttribute(
  'position',
  new Float32BufferAttribute([-0.11, -0.033, -0.16, 0.13, -0.023, -0.14, -0.09, 0.057, 0.12, 0.12, 0.041, 0.15], 3),
)
geometry.setIndex([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3])
geometry.computeBoundingBox()
const data = {
  geometry,
  edges: new EdgesGeometry(geometry),
  bounds: geometry.boundingBox.clone(),
  features: {},
  sourceTriangles: 4,
}
function independentVertices(matrix) {
  const a = geometry.getAttribute('position')
  return Array.from({ length: a.count }, (_, i) => new Vector3(a.getX(i), a.getY(i), a.getZ(i)).applyMatrix4(matrix))
}
const independentMinimum = (matrix) => independentVertices(matrix).reduce((a, b) => (b.z < a.z ? b : a))
/** Upper-left 3x3 of a pose matrix, row-major. */
const rotationBlock = (m) => [0, 1, 2, 4, 5, 6, 8, 9, 10].map((i) => m.elements[i])
const blockDelta = (a, b) => {
  const x = rotationBlock(a)
  const y = rotationBlock(b)
  return Math.max(...x.map((n, i) => Math.abs(n - y[i])))
}

/**
 * The 2026-10-01 pose law, re-implemented here from its written description alone — no
 * `relativePose`, no `lowestVertex`, no layout — so the fixture checks below can derive the
 * barrier crossing instead of hardcoding it.
 *
 *   park        `initialZ = -side.max.z - 0.0006`: the model hangs 0.0006 m BENEATH the sheet.
 *   push        bounded pressure lift on pose .4-.5; no field means zero pressure travel.
 *   lift        remaining travel * u^1.4 along the sheet normal, `u = (t - 0.5) / 0.5`.
 *   rotation    none, anywhere: the lift is a pure translation on the side-profile basis, so
 *               the lowest vertex is monotone and can never re-enter the barrier. The camera
 *               orbit from t = .90 supplies the authored motion instead.
 *   sheet basis `SIDE_ROTATION` is the signed permutation `(x, y, z) -> (-z, -x, y)`, asserted
 *               independently by the side-basis check below.
 */
const fixturePoints = [-0.11, -0.033, -0.16, 0.13, -0.023, -0.14, -0.09, 0.057, 0.12, 0.12, 0.041, 0.15]
const fixtureSidePoints = []
for (let i = 0; i < fixturePoints.length; i += 3) {
  fixtureSidePoints.push([-fixturePoints[i + 2], -fixturePoints[i], fixturePoints[i + 1]])
}
const fixtureLift = (extraction, t) => {
  const pressureTravel = extraction.pressureTravel ?? 0
  if (t <= 0.5) {
    const u = Math.min(1, Math.max(0, (t - 0.4) / 0.1))
    return extraction.initialZ + pressureTravel * u * u * (3 - 2 * u)
  }
  const u = Math.min(1, Math.max(0, (t - 0.5) / 0.5))
  return extraction.initialZ + pressureTravel + (extraction.travel - pressureTravel) * Math.pow(u, 1.4)
}
const fixtureMinZ = (extraction, t) =>
  Math.min(...fixtureSidePoints.map((point) => point[2])) + fixtureLift(extraction, t)
/** Pose time at which the u^1.4 lift has travelled `distance` metres. */
const poseTimeForLift = (extraction, distance) =>
  0.5 + 0.5 * Math.pow((distance - (extraction.pressureTravel ?? 0)) / (extraction.travel - (extraction.pressureTravel ?? 0)), 1 / 1.4)
/** Independent 44-step bisection of the same predicate the shipped solver states. */
const bisectCrossing = (extraction) => {
  let lo = 0.4
  let hi = 1
  for (let i = 0; i < 44; i += 1) {
    const t = (lo + hi) / 2
    if (fixtureMinZ(extraction, t) > 0) hi = t
    else lo = t
  }
  return (lo + hi) / 2
}

const fixtureLayout = makeDrawingLayout(1920 / 1080, data.bounds)
const fixtureExtraction = solveExtraction(data, fixtureLayout)
/** Pose time at which the rotation is released; the last vertex is 0.0006 m clear by then. */
const FIXTURE_CLEARANCE_POSE = poseTimeForLift(fixtureExtraction, fixtureExtraction.clearanceTravel)
/** Rotation-free contact: the lift alone brings the lowest vertex up to the sheet plane. */
const FIXTURE_CONTACT_POSE = poseTimeForLift(fixtureExtraction, -fixtureMinZ(fixtureExtraction, 0.4))
/** What the shipped 44-step solver lands on, re-derived here without touching its code. */
const FIXTURE_SOLVED_CROSSING = bisectCrossing(fixtureExtraction)

const deterministicCheckpoints = [
  0,
  ...LAMP_FAILURE_KEYS.map(([u]) => flickerT(u)),
  INTRO_PHASES.pulseStart,
  (INTRO_PHASES.pulseStart + INTRO_PHASES.pulseEnd) / 2,
  INTRO_PHASES.pulseEnd,
  0.885,
  INTRO_PHASES.fractureStart,
  (INTRO_PHASES.fractureStart + INTRO_PHASES.fractureEnd) / 2,
  INTRO_PHASES.fractureEnd,
  INTRO_PHASES.metalStart,
  0.9,
  0.91,
  INTRO_PHASES.riseStart,
  INTRO_PHASES.orbitStart,
  INTRO_PHASES.waveEnd,
  1,
]

check('intro clamps outside window and returns finite phase states', () => {
  assert.equal(state(-1).t, 0)
  assert.equal(state(2).t, 1)
  for (const p of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8, 0.85, 0.95, 1]) assert.ok(allFinite(state(p)))
})

check('pacing map: intro owns its scroll share, downstream stays linear and invertible', () => {
  assert.equal(INTRO_SCROLL_SHARE, 0.5)
  assert.equal(DRAWING_INTRO_WINDOW.releaseEnd, 0.12)
  close(pacedProgress(0), 0)
  close(pacedProgress(1), 1, 1e-12)
  close(pacedProgress(INTRO_SCROLL_SHARE), DRAWING_INTRO_WINDOW.releaseEnd, 1e-12)
  close(rawScrollFor(DRAWING_INTRO_WINDOW.releaseEnd), INTRO_SCROLL_SHARE, 1e-10)
  // Equal raw spans clear of the handoff blend must cover equal progress.
  close(pacedProgress(0.7) - pacedProgress(0.6), pacedProgress(0.9) - pacedProgress(0.8), 1e-12)
  for (const p of [0, 0.02, 0.12, 0.13, 0.4, 0.525, 0.76, 1]) close(pacedProgress(rawScrollFor(p)), p, 1e-10)
  let previous = -1
  for (let i = 0; i <= 4000; i += 1) {
    const value = pacedProgress(i / 4000)
    assert.ok(value > previous, `pacing map must be strictly monotonic at raw ${i / 4000}`)
    previous = value
  }
})

check('storm phase boundaries retain pressure .79-.84 and fracture .84-.88', () => {
  const expected = {
    onboardEnd: 0.38,
    flickerStart: 0.45,
    blackoutStart: 0.58,
    pulseStart: 0.66,
    pulseEnd: 0.79,
    registrationEnd: 0.79,
    bulgeStart: 0.79,
    lampReturnStart: 0.96,
    lampReturnEnd: 1,
    fractureStart: 0.84,
    fractureEnd: 0.88,
    detachStart: 0.88,
    orbitStart: 0.90,
    waveEnd: 0.97,
  }
  for (const [key, value] of Object.entries(expected)) close(INTRO_PHASES[key], value, 1e-12, key)
  const dark = state(INTRO_PHASES.blackoutStart)
  assert.equal(dark.lampPower, 0)
  assert.equal(dark.blackout, 1)
  assert.equal(dark.pulse, 0)
  const traceStart = state(INTRO_PHASES.pulseStart)
  assert.equal(traceStart.lampPower, 0)
  assert.equal(traceStart.blackout, 1)
  assert.equal(traceStart.pulse, 1)
  close(traceStart.pulseHead, 0)
  const traceEnd = state(INTRO_PHASES.pulseEnd)
  assert.equal(traceEnd.lampPower, 0)
  assert.equal(traceEnd.blackout, 1)
  assert.equal(traceEnd.pulse, 1)
  close(traceEnd.pulseHead, 1)
  assert.equal(traceEnd.pbr, 0)
  assert.equal(traceEnd.illumination, 0)
  assert.equal(traceEnd.fracture, 0)
  assert.equal(traceEnd.openingClear, 0)
  assert.equal(traceEnd.pressure, 0)
  assert.equal(traceEnd.crackGlow, 1)
  assert.ok(traceEnd.crackWeb > 0)
  // The object causes the pressure. It is already lit metal when the first gap opens.
  assert.equal(state(INTRO_PHASES.fractureStart).fracture, 0)
  assert.equal(state(INTRO_PHASES.fractureStart).openingClear, 0)
  close(state(INTRO_PHASES.fractureStart).pressure, 1, 1e-12)
  assert.ok(state((INTRO_PHASES.fractureStart + INTRO_PHASES.fractureEnd) / 2).fracture > 0)
  assert.equal(state(INTRO_PHASES.fractureEnd).fracture, 1)
  assert.equal(state(INTRO_PHASES.fractureEnd).openingClear, 1)
  for (const t of [0.84, 0.8405, 0.845, 0.86, 0.88, 0.9, 0.91]) {
    close(state(t).illumination, 0, 1e-12, `studio off at ${t}`)
    close(state(t).pbr, 1, 1e-12, `metal at ${t}`)
    assert.ok(state(t).poseT > 0.4, `model must already be pushing at ${t}`)
  }
  assert.equal(state(INTRO_PHASES.orbitStart).perspective, 0)
  close(state(INTRO_PHASES.waveEnd, FIXTURE_SOLVED_CROSSING).waveTime, 1, 1e-12)
})

check('lamp envelope hits five unequal failures, weak recoveries, and the fourth near-out shelf', () => {
  const samples = LAMP_FAILURE_KEYS.map(([u, expected]) => {
    const value = state(flickerT(u)).lampPower
    close(value, expected, 1e-12, `u=${u}`)
    return { u, expected, value }
  })
  const dips = [1, 3, 5, 7, 10].map((index) => samples[index])
  const recoveries = [2, 4, 6, 9, 11].map((index) => samples[index])
  assert.equal(new Set(dips.map((sample) => sample.expected)).size, 5, 'the five dip minima must be unequal')
  assert.ok(dips.every((sample) => sample.expected < 1))
  assert.ok(recoveries.every((sample) => sample.expected < 1), 'recoveries stay below full lamp power')
  assert.ok(dips.every((sample, index) => sample.expected < recoveries[index].expected))
  const shelfStart = flickerT(0.64)
  const shelfEnd = flickerT(0.72)
  close(shelfStart, 0.5332, 1e-12)
  close(shelfEnd, 0.5436, 1e-12)
  close(state((shelfStart + shelfEnd) / 2).lampPower, 0.015, 1e-12)
  measurements.push(...samples.map((sample) => ({ flickerU: sample.u, introT: flickerT(sample.u), lampPower: sample.value })))
})

check('focus completes before the pulse; the reserved onboarding window carries nothing else', () => {
  const start = state(0)
  const focused = state(INTRO_PHASES.focusEnd)
  const reserved = state((INTRO_PHASES.onboardStart + INTRO_PHASES.onboardEnd) / 2)
  const excited = state((INTRO_PHASES.pulseStart + INTRO_PHASES.pulseEnd) / 2)
  const lift = state(INTRO_PHASES.riseStart)
  assert.equal(start.focus, 0)
  assert.equal(start.drawingOpacity, 1)
  assert.equal(start.pbr, 0)
  assert.equal(focused.focus, 1)
  assert.equal(focused.pulse, 0)
  assert.equal(reserved.focus, 1)
  assert.equal(reserved.pulse, 0)
  assert.equal(reserved.pbr, 0)
  assert.equal(reserved.drawingOpacity, 1)
  assert.ok(reserved.poseT < 0.4)
  assert.equal(excited.focus, 1)
  assert.equal(excited.pulse, 1)
  close(excited.pulseHead, 0.5)
  assert.equal(lift.pulse, lift.t >= INTRO_PHASES.pulseStart && lift.t <= INTRO_PHASES.pulseEnd ? 1 : 0)
  close(lift.poseT, 0.4, 1e-12)
})

check('causal push precedes rupture; every fracture frame reveals fully lit metal on opaque stock', () => {
  let firstOpenT = Infinity
  let firstMotionT = Infinity
  for (let i = 0; i <= 4000; i += 1) {
    const s = state(i / 4000)
    if (s.openingClear === 1 && firstOpenT === Infinity) firstOpenT = s.t
    if (s.poseT > 0.4 && firstMotionT === Infinity) firstMotionT = s.t
    assert.equal(s.drawingOpacity, 1, `print must stay opaque at t=${s.t}`)
    if (s.t <= 0.79) assert.ok(s.poseT <= 0.4, `push must wait for pressure at t=${s.t}`)
    if (s.t > 0.79 && s.t < 0.84) {
      assert.ok(s.poseT > 0.4 && s.pressure > 0, `object must push the closed bulge at t=${s.t}`)
      assert.equal(s.fracture, 0)
    }
    if (s.t >= 0.84) {
      close(s.pbr, 1, 1e-12, `immediate metal at t=${s.t}`)
      close(s.illumination, s.lampPower, 1e-12, `studio-return envelope at t=${s.t}`)
      assert.ok(s.poseT > 0.4, `model must continue through rupture at t=${s.t}`)
    }
  }
  assert.ok(firstOpenT >= INTRO_PHASES.fractureEnd - 1e-9 && firstOpenT <= INTRO_PHASES.fractureEnd + 0.001,
    `first open frame must be the fracture end; got ${firstOpenT}`)
  assert.ok(firstMotionT >= 0.79 && firstMotionT <= 0.791,
    `first motion frame must be the rise start; got ${firstMotionT}`)
  assert.ok(firstMotionT < INTRO_PHASES.fractureStart && firstMotionT < firstOpenT, 'the object must cause the rupture before the opening clears')
  measurements.push({ firstOpenFrameT: firstOpenT, firstMotionFrameT: firstMotionT, fullyLitMetalByT: 0.84 })
})

check('pulse traverses five ordered head positions without whole-window activation', () => {
  const span = INTRO_PHASES.pulseEnd - INTRO_PHASES.pulseStart
  const heads = [0.1, 0.3, 0.5, 0.7, 0.9].map((k) => state(INTRO_PHASES.pulseStart + k * span).pulseHead)
  for (let i = 1; i < heads.length; i += 1) assert.ok(heads[i] > heads[i - 1])
  assert.equal(state(INTRO_PHASES.pulseStart - 0.05).pulse, 0)
  assert.equal(state(INTRO_PHASES.pulseEnd + 0.05).pulse, 0)
})

check('shockwave runs once, after the solved crossing, on a sheet still held opaque', () => {
  const crossing = FIXTURE_SOLVED_CROSSING
  const waveStart = introScrollTimeFor(crossing)
  const waveProbe = waveStart + Math.min(0.01, (INTRO_PHASES.waveEnd - waveStart) / 2)
  measurements.push({ crossing, waveStartScrollT: waveStart, waveEnd: INTRO_PHASES.waveEnd, waveScrollSpan: INTRO_PHASES.waveEnd - waveStart })
  assert.equal(state(waveStart - 0.01, crossing).waveActive, 0)
  assert.equal(state(waveProbe, crossing).waveActive, 1)
  assert.equal(state(1, crossing).waveActive, 0)
  close(state(INTRO_PHASES.waveEnd, crossing).waveTime, 1, 1e-12)
  assert.ok(waveStart < INTRO_PHASES.waveEnd, 'the solved separation must arm the wave inside the intro')
  assert.equal(state(INTRO_PHASES.waveEnd, crossing).drawingOpacity, 1)
  // Retirement is physical motion of the opaque sheet after the handoff, never a fade.
  assert.equal(state(1, crossing).drawingOpacity, 1)
})

check('pose reparameterization is monotone and leaves the pose axis itself unmoved', () => {
  close(introPoseTime(0), 0)
  close(introPoseTime(INTRO_PHASES.riseStart), 0.4, 1e-12)
  close(introPoseTime(1), 1, 1e-12)
  for (const pose of [0.1, 0.4, 0.7, FIXTURE_SOLVED_CROSSING, 1]) close(introPoseTime(introScrollTimeFor(pose)), pose, 1e-10)
  let previous = -1
  for (let i = 0; i <= 2000; i += 1) {
    const value = introPoseTime(i / 2000)
    assert.ok(value >= previous)
    previous = value
  }
})

check('intro state is exact under forward/reverse evaluation', () => {
  const checkpoints = [...new Set([0, 0.1, 0.2, 0.3, ...deterministicCheckpoints, 0.95, 1])].sort((a, b) => a - b)
  const forward = new Map(checkpoints.map((t) => [t, state(t)]))
  for (const t of [...checkpoints].reverse()) assert.deepEqual(state(t), forward.get(t))
})

check('opening remap preserves its .18 endpoint', () => {
  close(remapHeroProgress(0), 0.12)
  close(remapHeroProgress(0.18), 0.18)
  assert.ok(remapHeroProgress(0.05) < remapHeroProgress(0.1))
  assert.ok(remapHeroProgress(0.17) <= 0.18)
  assert.equal(DRAWING_INTRO_WINDOW.heroEnd, 0.525)
  // remapHeroProgress is an opening-cue helper, not a global remapper: CH.02 beat timing comes
  // from the GSAP ScrollTrigger window measured on [data-chapter="1"], which is DOM-dependent
  // and therefore proved in the runtime harness, not here.
})

check('side basis reads source Z and X with source Y as view depth, printed-up on world -X', () => {
  vectorClose(new Vector3(0, 0, 1).applyMatrix4(SIDE_ROTATION), new Vector3(-1, 0, 0))
  vectorClose(new Vector3(1, 0, 0).applyMatrix4(SIDE_ROTATION), new Vector3(0, -1, 0))
  vectorClose(new Vector3(0, 1, 0).applyMatrix4(SIDE_ROTATION), new Vector3(0, 0, 1))
  close(identityResidual(new Matrix4().multiplyMatrices(SHEET_ROTATION, SIDE_ROTATION)), 0)
  // The sheet lies flat with its normal up, and its printed up-axis points away from the
  // CH.01 hero camera's horizontal offset — which is what makes the print readable throughout.
  vectorClose(new Vector3(0, 0, 1).applyMatrix4(SHEET_ROTATION), new Vector3(0, 1, 0))
  vectorClose(SHEET_UP_WORLD, new Vector3(-1, 0, 0), 1e-12)
  const heroOffset = new Vector3(0.32, 0.16, 0.42)
  assert.ok(SHEET_UP_WORLD.dot(heroOffset) < 0, 'printed-up must face away from the hero camera')
})

// The synthetic tetrahedron fixture, its independent support helpers, the fixture extraction
// and the analytic crossing are built above (before the intro-state checks) because the
// breakthrough ordering contract is derived from that same pure-vertex support math.
const layouts = {}
for (const [label, aspect] of [
  ['desktop', 1920 / 1080],
  ['mobile', 390 / 844],
]) {
  const layout = makeDrawingLayout(aspect, data.bounds)
  layouts[label] = layout
  const extraction = solveExtraction(data, layout)

  // JG-035 rebuild: a 0.80 x 0.50 m drafting-table sheet with six labelled views (1:1 side
  // elevation + five 1:2 removed views). Removed views at a different scale are not projection-
  // aligned by definition (ASME Y14.3 removed views carry their own label + scale), so the
  // contract is now: one sheet for every viewport, every view inside the frame, no view
  // colliding with another view or with the printed furniture.
  check(`${label}: sheet is the fixed drafting-table size on every viewport`, () => {
    close(layout.width, SHEET_WIDTH, 1e-12)
    close(layout.height, SHEET_HEIGHT, 1e-12)
    assert.deepEqual(layout.views.map((v) => v.name), ['side', 'top', 'section', 'front', 'rear', 'bottom'])
    assert.equal(layout.views[0].scale, 1)
    for (const v of layout.views.slice(1)) assert.equal(v.scale, 0.5, `${v.name} is a 1:2 removed view`)
  })
  check(`${label}: views sit inside the frame, clear of each other and the furniture`, () => {
    const box = (r) => ({ x0: r[0], y0: r[1], x1: r[0] + r[2], y1: r[1] + r[3] })
    const zone = (z) => ({ x0: z.x, y0: z.y, x1: z.x + z.w, y1: z.y + z.h })
    const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
    const frame = zone(SHEET_ZONES.frame)
    const furniture = ['titleBlock', 'revisionBlock', 'notes'].map((k) => [k, zone(SHEET_ZONES[k])])
    // Placement is judged on the shipped model's bounds (Default.glb, read live through
    // __drawingProof.captureRegistration 2026-09-25) — the toy tetrahedron's proportions say
    // nothing about whether the real views collide.
    const real = new Box3(
      new Vector3(-0.11518211662769318, -0.03993332386016846, -0.1406710296869278),
      new Vector3(0.12332701683044434, 0.039931509643793106, 0.14239823818206787),
    )
    const views = makeDrawingLayout(aspect, real).views.map((v) => [v.name, box(v.rect)])
    for (const [name, b] of views) {
      assert.ok(b.x0 >= frame.x0 && b.x1 <= frame.x1 && b.y0 >= frame.y0 && b.y1 <= frame.y1, `${name} inside the frame`)
      for (const [k, z] of furniture) assert.ok(!hit(b, z), `${name} clear of ${k}`)
    }
    for (let i = 0; i < views.length; i += 1)
      for (let j = i + 1; j < views.length; j += 1)
        assert.ok(!hit(views[i][1], views[j][1]), `${views[i][0]} clear of ${views[j][0]}`)
    close(layout.sectionLineY, layout.primaryCenter.y, 1e-12, 'A–A lies on the elevation centreline:')
  })
  check(`${label}: projected anchor uses the primary ortho transform`, () => {
    const center = projectFeature(new Vector3(), layout.views[0])
    close(center[0], layout.primaryCenter.x)
    close(center[1], layout.primaryCenter.y)
    assert.equal(layout.views[0].camera.isOrthographicCamera, true)
    assert.equal(layout.views[0].scale, 1)
  })
  check(`${label}: initial pose parks the model 0.0006 m beneath the sheet, rotation-free`, () => {
    const m = relativePose(0, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel)
    const parked = independentVertices(m)
    const highest = Math.max(...parked.map((p) => p.z))
    close(highest, -0.0006, 1e-9, 'initial barrier clearance:')
    assert.ok(highest < 0, 'no vertex may start above the sheet plane')
    assert.ok(independentMinimum(m).z < 0)
    // The whole extraction is a pure translation on the side-profile basis: the rest pose
    // already carries exactly the sheet's own registration rotation and never adds another.
    close(blockDelta(m, SIDE_ROTATION), 0, 1e-12, 'initial pose must be side-profile registration:')
    measurements.push({ viewport: label, initialBarrierClearanceM: highest })
  })
  check(`${label}: full/lite causal pressure pushes beneath every intact-sheet vertex`, () => {
    // A deliberately uniform flex surface provides an independent pressure ceiling.
    // This fixture asks whether the object moves and remains below the deformed stock,
    // rather than merely echoing a solver flag.
    const field = { sample: () => 1 }
    for (const [tier, peak] of [['full', 0.012], ['lite', 0.0054]]) {
      const pressureExtraction = solveExtraction(data, layout)
      bindExtractionPressure(pressureExtraction, layout, field, tier)
      assert.ok(pressureExtraction.pressureTravel > 0, `${tier}: zero causal push`)
      let previous = -Infinity
      for (const t of [0.79, 0.80, 0.81, 0.825, 0.835, 0.84]) {
        const u = Math.min(1, Math.max(0, (t - 0.79) / 0.05))
        const pressure = u * u * (3 - 2 * u)
        const pose = introPoseTime(t)
        const matrix = relativePose(pose, layout, pressureExtraction.travel, pressureExtraction.initialZ,
          new Matrix4(), pressureExtraction.clearanceTravel, pressureExtraction.pressureTravel)
        const vertices = independentVertices(matrix)
        const top = Math.max(...vertices.map(p => p.z))
        assert.ok(top >= previous - 1e-12, `${tier}: push reversed at ${t}`)
        if (t > 0.79) assert.ok(top > previous, `${tier}: model failed to push at ${t}`)
        previous = top
        assert.ok(vertices.every(p => p.z <= peak * pressure - 0.000275 + 1e-9), `${tier}: model pierced intact stock at ${t}`)
        close(Math.min(...vertices.map(p => p.z)), fixtureMinZ(pressureExtraction, pose), 1e-9)
      }
      measurements.push({ viewport: label, tier, pressureTravelM: pressureExtraction.pressureTravel, pressureTopCeilingM: peak })
    }
  })
  check(`${label}: solver contact is an actual support vertex within 1e-9 m`, () => {
    // Independently derived, never a hardcoded literal: the lift law \`travel * u^1.4\` and the
    // vertex support 0.0006 m beneath the plane give the crossing in closed form, and the
    // shipped 44-step solve must land on it.
    close(extraction.crossing, FIXTURE_CONTACT_POSE, 1e-9, 'analytic vertex-support crossing:')
    close(FIXTURE_SOLVED_CROSSING, FIXTURE_CONTACT_POSE, 1e-9, 'independent bisection:')
    close(FIXTURE_CONTACT_POSE, poseTimeForLift(extraction, -fixtureMinZ(extraction, 0.4)), 1e-12, 'lift law:')
    // Tolerances below ride the fixture's Float32 positions (a ~2e-10 quantisation), not the law.
    close(fixtureMinZ(extraction, FIXTURE_CONTACT_POSE), 0, 1e-9, 'closed-form contact must sit on the plane:')
    assert.ok(extraction.crossing > 0.4 && extraction.crossing < 1)
    const m = relativePose(extraction.crossing, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel)
    const actual = independentMinimum(m)
    close(actual.z, 0, 1e-9)
    vectorClose(extraction.contact, actual, 1e-9)
    vectorClose(lowestVertex(data, m), actual, 1e-12)
    // Contact is measured on the actual vertex support, and the clearance law still says the
    // model stands exactly 0.0006 m clear at the pose where \`clearanceTravel\` is spent. That
    // parameter is kept for interface compatibility and must not affect the pose.
    const rest = relativePose(0.4, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel)
    close(extraction.clearanceTravel, -independentMinimum(rest).z + 0.0006, 1e-9, 'clearance travel law:')
    close(fixtureMinZ(extraction, FIXTURE_CLEARANCE_POSE), 0.0006, 1e-9, 'clearance pose must stand 0.0006 m clear:')
    assert.ok(extraction.crossing < FIXTURE_CLEARANCE_POSE, 'contact must precede the recorded clearance pose')
    const before = independentMinimum(
      relativePose(extraction.crossing - 1e-6, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel),
    ).z
    const after = independentMinimum(
      relativePose(extraction.crossing + 1e-6, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel),
    ).z
    assert.ok(before < 0, `before crossing must be negative; got ${before}`)
    assert.ok(after > 0, `after crossing must be positive; got ${after}`)
    measurements.push({
      viewport: label,
      normalizedCrossing: extraction.crossing,
      analyticCrossing: FIXTURE_CONTACT_POSE,
      independentCrossing: FIXTURE_SOLVED_CROSSING,
      clearanceTravel: extraction.clearanceTravel,
      clearancePose: FIXTURE_CLEARANCE_POSE,
      contactZ: actual.z,
      beforeZ: before,
      afterZ: after,
    })
  })
  check(`${label}: the lift is pure translation — monotone vertex support, no pose rotation`, () => {
    // The 2026-10-01 revision dropped the relative model rotation entirely: a free tilt once
    // swept an already-cleared vertex back beneath the barrier (the fixture first touched at
    // 0.7046 and then re-entered, so the shipped solve reported 0.873). With no rotation the
    // lowest vertex is strictly increasing, so a re-entry is impossible by construction.
    let previous = -Infinity
    for (let i = 0; i <= 300; i += 1) {
      const t = 0.4 + (i / 300) * 0.6
      const m = relativePose(t, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel)
      const minZ = independentMinimum(m).z
      assert.ok(minZ > previous - 1e-15, `vertex support must not fall back at t=${t}: ${previous} -> ${minZ}`)
      previous = minZ
      close(blockDelta(m, SIDE_ROTATION), 0, 1e-12, `pose rotation must stay sheet registration at t=${t}:`)
      close(minZ, fixtureMinZ(extraction, t), 1e-9, `independent lift law at t=${t}:`)
    }
    // Composed with the sheet the model leaves on the sheet basis itself: rotation block
    // preserved end to end, which is what keeps the extracted model unrotated on screen.
    const model = new Matrix4()
    const sheet = new Matrix4()
    applyExtraction(1, layout, extraction, model, sheet)
    close(blockDelta(sheet, SHEET_ROTATION), 0, 1e-12, 'sheet matrix rotation:')
    measurements.push({ viewport: label, liftMonotone: true })
  })
  check(`${label}: support cache agrees with all vertices through forward/reverse poses`, () => {
    const checkpoints = [...new Set([0, 0.1, 0.3, ...deterministicCheckpoints, 0.95, 1])].sort((a, b) => a - b)
    const forward = new Map()
    for (const t of checkpoints) {
      const model = new Matrix4()
      const sheet = new Matrix4()
      const cached = applyExtraction(t, layout, extraction, model, sheet)
      const relative = relativePose(t, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel)
      close(cached, independentMinimum(relative).z, 1e-9)
      forward.set(t, { model: [...model.elements], sheet: [...sheet.elements], cached })
    }
    for (const t of [...checkpoints].reverse()) {
      const model = new Matrix4()
      const sheet = new Matrix4()
      const cached = applyExtraction(t, layout, extraction, model, sheet)
      assert.deepEqual({ model: [...model.elements], sheet: [...sheet.elements], cached }, forward.get(t))
    }
  })
  check(`${label}: release t=1 restores identity model matrix`, () => {
    const model = new Matrix4()
    const sheet = new Matrix4()
    applyExtraction(1, layout, extraction, model, sheet)
    const residual = identityResidual(model)
    close(residual, 0, 1e-12)
    measurements.push({ viewport: label, releaseIdentityMaxElementError: residual })
  })
}

check('the sheet layout does not depend on viewport aspect', () => {
  assert.deepEqual(
    layouts.desktop.views.map((v) => v.rect),
    layouts.mobile.views.map((v) => v.rect),
  )
  close(layouts.desktop.fitDistance, layouts.mobile.fitDistance, 1e-12)
  assert.equal(layouts.desktop.narrow, false)
  assert.equal(layouts.mobile.narrow, true, 'a 390x844 viewport must take the push-in/pan path')
})

data.edges.dispose()
geometry.dispose()

const failed = results.filter((r) => !r.pass)
console.log(
  JSON.stringify(
    {
      scope: 'Pure synthetic-geometry contract; not runtime/visual/fallback/performance proof',
      passed: results.length - failed.length,
      failed: failed.length,
      measurements,
      sourceSha256: Object.fromEntries(
        sourcePaths.map((p) => [p, createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex')]),
      ),
    },
    null,
    2,
  ),
)
process.exitCode = failed.length ? 1 : 0
