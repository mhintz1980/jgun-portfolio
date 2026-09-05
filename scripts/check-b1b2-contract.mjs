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
  SHEET_HEIGHT,
  SIDE_ROTATION,
  SHEET_ROTATION,
  SHEET_UP_WORLD,
  relativePose,
  lowestVertex,
  solveExtraction,
  applyExtraction,
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

check('intro clamps outside window and returns finite phase states', () => {
  assert.equal(state(-1).t, 0)
  assert.equal(state(2).t, 1)
  for (const p of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8, 0.85, 0.95, 1]) assert.ok(allFinite(state(p)))
})

check('pacing map: intro owns its scroll share, downstream stays linear and invertible', () => {
  close(pacedProgress(0), 0)
  close(pacedProgress(1), 1, 1e-12)
  close(pacedProgress(INTRO_SCROLL_SHARE), DRAWING_INTRO_WINDOW.releaseEnd, 1e-12)
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
  assert.equal(lift.pulse, 0)
  close(lift.poseT, 0.4, 1e-12)
})

check('pulse traverses five ordered head positions without whole-window activation', () => {
  const span = INTRO_PHASES.pulseEnd - INTRO_PHASES.pulseStart
  const heads = [0.1, 0.3, 0.5, 0.7, 0.9].map((k) => state(INTRO_PHASES.pulseStart + k * span).pulseHead)
  for (let i = 1; i < heads.length; i += 1) assert.ok(heads[i] > heads[i - 1])
  assert.equal(state(INTRO_PHASES.pulseStart - 0.05).pulse, 0)
  assert.equal(state(INTRO_PHASES.pulseEnd + 0.05).pulse, 0)
})

check('shockwave runs once, after the solved crossing, on a sheet still held opaque', () => {
  const crossing = 0.8888459503339448
  const waveStart = introScrollTimeFor(crossing)
  assert.equal(state(waveStart - 0.01, crossing).waveActive, 0)
  assert.equal(state(waveStart + 0.01, crossing).waveActive, 1)
  assert.equal(state(1, crossing).waveActive, 0)
  close(state(INTRO_PHASES.waveEnd, crossing).waveTime, 1, 1e-12)
  assert.equal(state(INTRO_PHASES.waveEnd, crossing).drawingOpacity, 1)
  assert.equal(state(1, crossing).drawingOpacity, 0)
  measurements.push({ crossing, waveStartScrollT: waveStart, waveScrollSpan: INTRO_PHASES.waveEnd - waveStart })
})

check('pose reparameterization is monotone and leaves the pose axis itself unmoved', () => {
  close(introPoseTime(0), 0)
  close(introPoseTime(INTRO_PHASES.riseStart), 0.4, 1e-12)
  close(introPoseTime(1), 1, 1e-12)
  for (const pose of [0.1, 0.4, 0.7, 0.8888459503339448, 1]) close(introPoseTime(introScrollTimeFor(pose)), pose, 1e-10)
  let previous = -1
  for (let i = 0; i <= 2000; i += 1) {
    const value = introPoseTime(i / 2000)
    assert.ok(value >= previous)
    previous = value
  }
})

check('intro state is exact under forward/reverse evaluation', () => {
  const checkpoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8, 0.85, 0.95, 1]
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

const layouts = {}
for (const [label, aspect] of [
  ['desktop', 1920 / 1080],
  ['mobile', 390 / 844],
]) {
  const layout = makeDrawingLayout(aspect, data.bounds)
  layouts[label] = layout
  const extraction = solveExtraction(data, layout)

  check(`${label}: sheet is ANSI C landscape and identical on every viewport`, () => {
    close(layout.width / layout.height, 22 / 17, 1e-12)
    close(layout.width, SHEET_WIDTH, 1e-12)
    close(layout.height, SHEET_HEIGHT, 1e-12)
    assert.equal(layout.views.length, 4)
  })
  check(`${label}: third-angle views share their parent's axes`, () => {
    const rect = Object.fromEntries(layout.views.map((v) => [v.name, v.rect]))
    const centre = (r) => ({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2 })
    close(centre(rect.top).x, centre(rect.front).x, 1e-12, 'plan shares the elevation vertical axis:')
    close(centre(rect.section).x, centre(rect.front).x, 1e-12, 'section shares the elevation vertical axis:')
    close(centre(rect.right).y, centre(rect.front).y, 1e-12, 'end shares the elevation horizontal axis:')
    assert.ok(rect.top[1] > rect.front[1] + rect.front[3], 'plan sits above the elevation')
    assert.ok(rect.section[1] + rect.section[3] < rect.front[1], 'section sits below the elevation')
    assert.ok(rect.right[0] > rect.front[0] + rect.front[2], 'end sits right of the elevation')
    close(layout.sectionLineY, centre(rect.front).y, 1e-12, 'A–A lies on the elevation centreline:')
  })
  check(`${label}: projected anchor uses the primary ortho transform`, () => {
    const center = projectFeature(new Vector3(), layout.views[0])
    close(center[0], layout.primaryCenter.x)
    close(center[1], layout.primaryCenter.y)
    assert.equal(layout.views[0].camera.isOrthographicCamera, true)
    assert.equal(layout.views[0].scale, 1)
  })
  check(`${label}: initial uppermost vertex lies flush on plane`, () => {
    const m = relativePose(0, layout, extraction.travel, extraction.initialZ, new Matrix4())
    close(Math.max(...independentVertices(m).map((p) => p.z)), 0, 1e-9)
    assert.ok(independentMinimum(m).z < 0)
  })
  check(`${label}: solver contact is an actual support vertex within 1e-9 m`, () => {
    assert.ok(extraction.crossing > 0.4 && extraction.crossing < 1)
    const m = relativePose(extraction.crossing, layout, extraction.travel, extraction.initialZ, new Matrix4())
    const actual = independentMinimum(m)
    close(actual.z, 0, 1e-9)
    vectorClose(extraction.contact, actual, 1e-9)
    vectorClose(lowestVertex(data, m), actual, 1e-12)
    const boxMinimum = new Box3().copy(data.bounds).applyMatrix4(m).min.z
    assert.ok(Math.abs(boxMinimum - actual.z) > 1e-5, 'Fixture must expose an AABB-support substitution')
    const before = independentMinimum(
      relativePose(extraction.crossing - 1e-6, layout, extraction.travel, extraction.initialZ, new Matrix4()),
    ).z
    const after = independentMinimum(
      relativePose(extraction.crossing + 1e-6, layout, extraction.travel, extraction.initialZ, new Matrix4()),
    ).z
    assert.ok(before < 0, `before crossing must be negative; got ${before}`)
    assert.ok(after > 0, `after crossing must be positive; got ${after}`)
    measurements.push({
      viewport: label,
      normalizedCrossing: extraction.crossing,
      contactZ: actual.z,
      beforeZ: before,
      afterZ: after,
      aabbSupportError: boxMinimum - actual.z,
    })
  })
  check(`${label}: support cache agrees with all vertices through forward/reverse poses`, () => {
    const checkpoints = [0, 0.1, 0.3, 0.4, 0.5, 0.65, 0.8, 0.85, 0.95, 1]
    const forward = new Map()
    for (const t of checkpoints) {
      const model = new Matrix4()
      const sheet = new Matrix4()
      const cached = applyExtraction(t, layout, extraction, model, sheet)
      const relative = relativePose(t, layout, extraction.travel, extraction.initialZ, new Matrix4())
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
