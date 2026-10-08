// Independent CPU old/new kinematics equivalence resample for the 16 static shaft WEBPs.
// Loads hash-verified OLD (recovery worktree) and NEW (current repo) kinematics.ts,
// each against the SAME current progression/toolSpec dependencies, and compares every
// runtime-consumed field of sampleShaftKinematics + writeShaftProgression at the eight
// capture times (fresh-state and sequential-state regimes), plus a 0.01 s dense grid
// and all exported module constants. Read-only except its own output JSON.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = process.cwd()
const CURRENT_SHAFT = path.join(root, 'src/scene/inspection/shaft')
const OLD_KINEMATICS = 'C:/Users/Markimus/Documents/Codex/recovery/jgun-portfolio-20261006-030424/worktree/src/scene/inspection/shaft/kinematics.ts'
const EXPECTED_OLD_SHA = '4509f6b247efc40b428c37ad4a8925add3a944c1e4d16fd978f62101d6cd874a'
const EXPECTED_NEW_SHA = '2f78847da8cc70b350c7f22eed2c899d6289100f94011dc87533f1dd337bd893'
const TIMES = [8.4, 17, 25, 32.4, 34.2, 35.8, 38.2, 42.5]

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const oldSha = sha256(OLD_KINEMATICS)
const newKinPath = path.join(CURRENT_SHAFT, 'kinematics.ts')
const newSha = sha256(newKinPath)
if (oldSha !== EXPECTED_OLD_SHA || newSha !== EXPECTED_NEW_SHA) {
  console.error(JSON.stringify({ fatal: 'hash gate failed', oldSha, newSha }))
  process.exit(1)
}

// Relative imports ALWAYS resolve to the current shaft dir so old and new share
// identical current dependencies (progression.ts / toolSpec.ts are hash-pinned).
const cache = new Map()
function load(file, base = CURRENT_SHAFT) {
  file = path.resolve(file)
  const cached = cache.get(file)
  if (cached) return cached.exports
  const module = { exports: {} }
  cache.set(file, module)
  const source = fs.readFileSync(file, 'utf8')
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  new Function('module', 'exports', 'require', js)(
    module,
    module.exports,
    (spec) => {
      if (spec.startsWith('.')) {
        let resolved = path.resolve(base, spec)
        if (!path.extname(resolved)) resolved += '.ts'
        return load(resolved)
      }
      return require(spec)
    },
  )
  return module.exports
}

const Old = load(OLD_KINEMATICS)
const New = load(newKinPath)
const Prog = load(path.join(CURRENT_SHAFT, 'progression.ts'))

// Deep comparator distinguishing -0/+0 and NaN (typed-array aware).
function deepEqual(a, b, where, diffs) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (!Object.is(a, b)) diffs.push(where + ': ' + a + ' != ' + b)
    return
  }
  const ta = ArrayBuffer.isView(a)
  const tb = ArrayBuffer.isView(b)
  if (ta || tb) {
    if (!ta || !tb || a.length !== b.length) {
      diffs.push(where + ': typed-array shape mismatch')
      return
    }
    for (let i = 0; i < a.length; i += 1) deepEqual(a[i], b[i], where + '[' + i + ']', diffs)
    return
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    if (!Object.is(a, b)) diffs.push(where + ': ' + String(a) + ' != ' + String(b))
    return
  }
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])]
  for (const key of keys) deepEqual(a[key], b[key], where + '.' + key, diffs)
}

function sample(K, t, frame, state) {
  K.sampleShaftKinematics(t, frame)
  K.writeShaftProgression(frame, state)
  return { kinematics: plain(frame), progression: plain(state) }
}

function plain(value) {
  if (ArrayBuffer.isView(value)) return Array.from(value, (x) => (Object.is(x, -0) ? '-0' : x))
  if (value === null || typeof value !== 'object') return Object.is(value, -0) ? '-0' : value
  const out = {}
  for (const key of Object.keys(value)) out[key] = plain(value[key])
  return out
}

function plainJson(value) {
  // JSON.stringify semantics (loses -0 distinction) for cross-checking the
// source worker's recorded rows, which were serialized the same way.
  if (ArrayBuffer.isView(value)) return Array.from(value)
  if (value === null || typeof value !== 'object') return value
  const out = {}
  for (const key of Object.keys(value)) out[key] = plainJson(value[key])
  return out
}

const rows = []
const regimes = ['fresh', 'sequential']
const seqOld = { frame: Old.createShaftKinematicsFrame(), state: Prog.createProgressionState() }
const seqNew = { frame: New.createShaftKinematicsFrame(), state: Prog.createProgressionState() }
for (const t of TIMES) {
  const perRegime = {}
  for (const regime of regimes) {
    let before
    let after
    if (regime === 'fresh') {
      before = sample(Old, t, Old.createShaftKinematicsFrame(), Prog.createProgressionState())
      after = sample(New, t, New.createShaftKinematicsFrame(), Prog.createProgressionState())
    } else {
      before = sample(Old, t, seqOld.frame, seqOld.state)
      after = sample(New, t, seqNew.frame, seqNew.state)
    }
    const diffs = []
    deepEqual(before, after, '$', diffs)
    perRegime[regime] = { equal: diffs.length === 0, diffs }
  }
  rows.push({ t, ...perRegime })
}

// Exported constants diff (functions cannot be value-compared; constants can).
const constDiffs = []
for (const key of new Set([...Object.keys(Old), ...Object.keys(New)])) {
  const a = Old[key]
  const b = New[key]
  if (typeof a === 'function' || typeof b === 'function') continue
  const diffs = []
  deepEqual(a, b, key, diffs)
  if (diffs.length) constDiffs.push(...diffs)
}

// Dense 0.01 s grid over the full 43 s story, sequential shared frame/state (runtime-like).
const denseFrameOld = Old.createShaftKinematicsFrame()
const denseStateOld = Prog.createProgressionState()
const denseFrameNew = New.createShaftKinematicsFrame()
const denseStateNew = Prog.createProgressionState()
const denseDifferingTimes = []
const denseFieldHistogram = {}
for (let i = 0; i <= 4300; i += 1) {
  const t = Math.round(i) / 100
  sample(Old, t, denseFrameOld, denseStateOld)
  sample(New, t, denseFrameNew, denseStateNew)
  const diffs = []
  deepEqual(plain(denseFrameOld), plain(denseFrameNew), 'kinematics', diffs)
  deepEqual(plain(denseStateOld), plain(denseStateNew), 'progression', diffs)
  if (diffs.length) {
    denseDifferingTimes.push(t)
    for (const d of diffs) {
      const field = d.split(/[:.[]/, 1)[0]
      denseFieldHistogram[field] = (denseFieldHistogram[field] || 0) + 1
    }
  }
}

// Cross-check against the source worker's recorded rows (exact JSON string equality).
const workerPath = path.join(root, 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shaft-stock-contact-correction-2026-10-06/static-source-equivalence.json')
const worker = JSON.parse(fs.readFileSync(workerPath, 'utf8'))
const crossCheck = []
for (const row of worker.rows) {
  const mine = sample(New, row.t, New.createShaftKinematicsFrame(), Prog.createProgressionState())
  const beforeMatches = JSON.stringify(plainJson(mine.kinematics)) === JSON.stringify(row.before.kinematics)
  const progressionMatches = JSON.stringify(plainJson(mine.progression)) === JSON.stringify(row.before.progression)
  crossCheck.push({ t: row.t, kinematicsMatchesWorkerBefore: beforeMatches, progressionMatchesWorkerBefore: progressionMatches })
}

// Distance from each capture time to the nearest old/new divergence (fine 1e-4 scan, +/-0.05).
const marginFrameOld = Old.createShaftKinematicsFrame()
const marginStateOld = Prog.createProgressionState()
const marginFrameNew = New.createShaftKinematicsFrame()
const marginStateNew = Prog.createProgressionState()
const margins = TIMES.map((t) => {
  let nearest = null
  for (let i = -500; i <= 500; i += 1) {
    const probe = Math.round((t + i / 10000) * 10000) / 10000
    sample(Old, probe, marginFrameOld, marginStateOld)
    sample(New, probe, marginFrameNew, marginStateNew)
    const diffs = []
    deepEqual(plain(marginFrameOld), plain(marginFrameNew), 'k', diffs)
    deepEqual(plain(marginStateOld), plain(marginStateNew), 'p', diffs)
    if (diffs.length && (nearest === null || Math.abs(probe - t) < Math.abs(nearest - t))) nearest = probe
  }
  return { t, nearest_differing_t: nearest, margin: nearest === null ? null : Math.abs(nearest - t) }
})

const allEqual = rows.every((r) => r.fresh.equal && r.sequential.equal)
const result = {
  generated: new Date().toISOString(),
  method: 'Independent in-memory TS transpile; old recovery kinematics (4509f6b...) vs current (2f78847d...) both resolved against current progression/toolSpec; Object.is deep compare (-0 sensitive); fresh + sequential regimes; 0.01 s dense grid; exported-constant diff; cross-check vs source worker JSON.',
  hashes: {
    old_kinematics: oldSha,
    new_kinematics: newSha,
    current_progression: sha256(path.join(CURRENT_SHAFT, 'progression.ts')),
    current_toolSpec: sha256(path.join(CURRENT_SHAFT, 'toolSpec.ts')),
    current_camera: sha256(path.join(CURRENT_SHAFT, 'camera.ts')),
    current_shaftRuntime: sha256(path.join(CURRENT_SHAFT, 'shaftRuntime.ts')),
  },
  capture_times_all_equal: allEqual,
  rows,
  exported_constant_diffs: constDiffs,
  dense_grid: {
    step: 0.01,
    samples: 4301,
    differing_samples: denseDifferingTimes.length,
    first_differing_t: denseDifferingTimes[0] ?? null,
    last_differing_t: denseDifferingTimes[denseDifferingTimes.length - 1] ?? null,
    differing_windows: summarizeWindows(denseDifferingTimes),
    field_histogram: denseFieldHistogram,
  },
  worker_json_cross_check: crossCheck,
  capture_time_divergence_margins: margins,
}

function summarizeWindows(times) {
  const windows = []
  let start = null
  let prev = null
  for (const t of times) {
    if (start === null) start = t
    else if (t - prev > 0.0100001) {
      windows.push([start, prev])
      start = t
    }
    prev = t
  }
  if (start !== null) windows.push([start, prev])
  return windows
}

const outPath = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'equivalence-resample.json')
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({
  capture_times_all_equal: allEqual,
  exported_constant_diffs: constDiffs.length,
  dense_differing_samples: denseDifferingTimes.length,
  dense_windows: result.dense_grid.differing_windows,
  worker_cross_check_all_match: crossCheck.every((c) => c.kinematicsMatchesWorkerBefore && c.progressionMatchesWorkerBefore),
}, null, 2))
if (!allEqual) process.exitCode = 1
