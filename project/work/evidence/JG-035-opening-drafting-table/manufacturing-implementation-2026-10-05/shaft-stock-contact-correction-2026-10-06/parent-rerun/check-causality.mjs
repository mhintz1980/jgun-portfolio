// Independent numerical contact oracle and event-history checks; CPU only.
// TS is transpiled in memory. This script does not load the runtime, browser or renderer.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import crypto from 'node:crypto'
const require = createRequire(import.meta.url), ts = require('typescript'), cache = new Map()
const out = path.dirname(fileURLToPath(import.meta.url))
let root = out
while (!fs.existsSync(path.join(root, 'package.json'))) root = path.dirname(root)
function load(file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file).exports
  const m = { exports: {} }; cache.set(file, m)
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function('module', 'exports', 'require', js)(m, m.exports, s => s.startsWith('.') ? load(path.resolve(path.dirname(file), s + '.ts')) : require(s))
  return m.exports
}
const K = load(path.join(root, 'src/scene/inspection/shaft/kinematics.ts'))
const P = load(path.join(root, 'src/scene/inspection/shaft/progression.ts'))
const T = load(path.join(root, 'src/scene/inspection/shaft/toolSpec.ts'))
const f = K.createShaftKinematicsFrame(), prior = new Float32Array(10), events = Array.from({ length: 10 }, () => []), state = P.createProgressionState()
const failures = { stock: 0, nearest: 0, radial: 0, retained: 0, priorEvent: 0, aheadMask: 0 }, firstCompletion = Array(10).fill(null)
let gains = 0, disengagedIntervals = 0, returnPartialSamples = 0, previousT = 2, allCompleteAt = null, maxAheadError = 0
function contact(t) {
  const m = K.machiningTimeAt(t), unwrapped = m / K.STROKE_PERIOD_M + K.STROKE_PHASE_OFFSET, phase = unwrapped - Math.floor(unwrapped)
  const edge = T.SHAPER_STROKE_CENTRE_Y_MIN_MM + (T.SHAPER_STROKE_CENTRE_Y_MAX_MM - T.SHAPER_STROKE_CENTRE_Y_MIN_MM) * (1 - Math.cos(2 * Math.PI * phase)) / 2 + T.SHAPER_THICKNESS_MM / 2
  const cutterPhi = K.CUTTER_RATE * m, raw = Math.round((Math.PI / 2 - P.SPACE_CLOCK_RAD - T.SHAPER_SIGNED_RATIO * cutterPhi) / P.SPACE_PITCH_RAD), nearest = ((raw % 10) + 10) % 10
  return { m, phase, edge, nearest, stock: t < 15 && phase < .5 && edge >= P.FACE_START_MM && edge <= P.SHAPING_FACE_END_MM }
}
const hz = 19200, ticks = 13 * hz
for (let tick = 0; tick <= ticks; tick++) {
  const t = 2 + tick / hz; K.sampleShaftKinematics(t, f); const c = contact(t)
  let whollyDisengaged = true
  // Full interval plus three interior samples, not just two endpoint flags.
  for (let j = 0; j <= 4; j++) if (contact(previousT + (t - previousT) * j / 4).stock) whollyDisengaged = false
  if (whollyDisengaged) disengagedIntervals++
  for (let space = 0; space < 10; space++) {
    const depth = f.spaceDepth[space]
    if (depth > prior[space]) {
      gains++; let lo = previousT, hi = t
      const tmp = K.createShaftKinematicsFrame()
      for (let j = 0; j < 55; j++) { const mid = (lo + hi) / 2; K.sampleShaftKinematics(mid, tmp); if (tmp.spaceDepth[space] <= prior[space]) lo = mid; else hi = mid }
      const at = hi; K.sampleShaftKinematics(at, tmp); const event = contact(at)
      if (!event.stock) failures.stock++
      if (event.nearest !== space || tmp.engagedSpace !== space) failures.nearest++
      if (!(tmp.cutterRho < P.SHAFT_OD_MM - 1e-3)) failures.radial++
      events[space].push({ t: at, m: event.m, edge_mm: event.edge, phase: event.phase, depth, cutter_rho_mm: tmp.cutterRho })
    }
    if (whollyDisengaged && depth !== prior[space]) failures.retained++
    if (depth === 1 && firstCompletion[space] === null) firstCompletion[space] = t
    prior[space] = depth
  }
  if (f.returning && f.spaceDepth.some(d => d > 0 && d < 1)) returnPartialSamples++
  if (f.spaceDepth.every(d => d === 1) && allCompleteAt === null) allCompleteAt = t
  K.writeShaftProgression(f, state)
  if (f.engagedSpace >= 0) {
    const space = f.engagedSpace, strokeStart = c.m - c.phase * K.STROKE_PERIOD_M
    // Independent observed event history: no producer countedPasses or event table used.
    const expected = Math.min(1, events[space].filter(e => e.m < strokeStart).length / 4)
    if (state.engagedPreviousDepth !== expected) failures.priorEvent++
    const y = (f.edgeY + P.SHAPING_FACE_END_MM) / 2, r = P.progressedRadius(P.SHAFT_ROOT_MM, y, P.SPACE_CLOCK_RAD + space * P.SPACE_PITCH_RAD, state, 'legacy')
    const error = Math.abs((P.SHAFT_OD_MM - r) / (P.SHAFT_OD_MM - P.SHAFT_ROOT_MM) - expected); maxAheadError = Math.max(maxAheadError, error)
    if (error >= 0.5e-12) failures.aheadMask++
  }
  previousT = t
}
const hashes = Object.fromEntries(['src/scene/inspection/shaft/kinematics.ts', 'src/scene/inspection/shaft/kinematics.test.ts', 'src/scene/inspection/shaft/progression.ts', 'src/scene/inspection/shaft/camera.ts', 'src/scene/inspection/shaft/toolSpec.ts'].map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex')]))
hashes['check-causality.mjs'] = crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex')
const pass = gains === 40 && Object.values(failures).every(n => n === 0) && firstCompletion.every(t => t > 11 && t < 15)
const result = { pass, method: 'Independent cosine-stroke/nearest-space contact oracle; 55-step bisection at every observed depth gain; independently retained event history for previous-depth and CPU ahead-mask checks.', hz, samples: ticks + 1, intervalSamples: 5, gains, failures, disengagedIntervals, returnPartialSamples, allCompleteAt, firstCompletion, maxAheadError, events, hashes, reportedEarlyCases: [2.5, 2.512274, 2.52, 2.55].map(t => { K.sampleShaftKinematics(t, f); return { t, edge: f.edgeY, engaged: f.engagedSpace, depths: [...f.spaceDepth] } }) }
fs.writeFileSync(path.join(out, 'causal-sweep.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ pass, samples: result.samples, gains, failures, disengagedIntervals, returnPartialSamples, allCompleteAt, maxAheadError, source_sha256: hashes['src/scene/inspection/shaft/kinematics.ts'] }, null, 2))
if (!pass) process.exitCode = 1
