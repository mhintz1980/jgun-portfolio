/** Owner brief 50 / interface 51. Native production scroll; no app/asset mutation.
 * Author-only check: node scripts/verify-owner-corrections.mjs --self-test
 * After parent readiness: node scripts/verify-owner-corrections.mjs --run --url=http://localhost:PORT/torque-wrench/
 * Add --final-integration to publish the two clean stills AFTER the complete roster passes.
 * Iteration: --case=desktop-full --fail-fast (never satisfies the required six-case roster).
 * No builds or server management. All evidence lives beneath output/playwright/owner-corrections.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const evidenceRoot = path.join(root, 'output/playwright/owner-corrections')
const hashes = {
  'Default.glb': '8b07246cf857aca29d1832815d8d183e0a1fd8ef06da5a7a089019706a57a257',
  'm249-transformed.glb': '1c251f45b05b736a08858e47c53c8fa779870b636bb1a174d1422d8003305423',
  'msp-enclosure.glb': 'c1c919ab8f747e9e2bd9eeb51b5ac31ee66dc39145cac44ad7c8fddfa056428e',
}
const units = ['stage1', 'stage2', 'stage5', 'bearing', 'stage3', 'stage4', 'output', 'outerHousing']
// Owner refinement 54: independent acceptance checkpoints, not imported from the sampler.
const revealEvents = [
  { index: 1, start: 42.4, full: 43, cageStart: 48.2, cageFull: 48.8, rate: 126.4 * Math.PI / 156 },
  { index: 2, start: 48.8, full: 49.4, cageStart: 50.4, cageFull: 51, rate: 137.46 * Math.PI / 156 },
  { index: 4, start: 51.4, full: 52, cageStart: 52.8, cageFull: 53.4, rate: 148.52 * Math.PI / 156 },
  { index: 5, start: 53.4, full: 54, cageStart: 54.9, cageFull: 55.5, rate: 158 * Math.PI / 156 },
]
const inputRpmCap = 158, inputOutputRatio = 100
const housingPages = [.855, .857, .86, .865, .872, .88, .90, .93, .94, .96, .98]
const speedEvidencePath = 'output/playwright/owner-corrections/56-speed-158/analysis.json'
function validSpeedProof(speed) {
  if (!speed?.pass || !speed.realTimeConfirmed || speed.cap !== inputRpmCap || speed.ratio !== inputOutputRatio || speed.nominalFps !== 60
    || !Array.isArray(speed.cases) || speed.cases.length < 2) return false
  const validChannel = c => Number.isFinite(c.maximumDegreesPerFrame) && c.maximumDegreesPerFrame >= 0
    && Number.isFinite(c.halfPeriodDegrees) && c.halfPeriodDegrees > 0 && c.maximumDegreesPerFrame < c.halfPeriodDegrees && c.flags === 0
  return speed.cases.every(c => c.pass && Array.isArray(c.channels) && c.channels.length > 0 && c.channels.every(validChannel))
    && [1440, 390].every(width => speed.cases.some(c => c.viewport.width === width && c.recordedCap === inputRpmCap && c.headed
      && c.channels.every(v => Number.isFinite(v.maximumRawDegreesPerFrame) && v.maximumRawDegreesPerFrame >= 0 && v.maximumRawDegreesPerFrame < v.halfPeriodDegrees)))
    && speed.cases.some(c => c.nextWholeRpmFailsSameMeasuredCadence && c.nextWholeRpm === inputRpmCap + 1
      && Number.isFinite(c.nextRpmWitnessDegrees) && c.nextRpmWitnessDegrees >= c.channels[0].halfPeriodDegrees)
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const near = (a, b, e = 1e-5) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= e
const range = (a, b, step) => Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => +(a + i * step).toFixed(7))
const unique = values => [...new Set(values)].sort((a, b) => a - b)
const revealTimes = unique(revealEvents.flatMap(e => [e.start - .1, e.start, e.full, e.cageStart, e.cageFull]))
const sub = (a, b) => a.map((v, i) => v - b[i])
const norm = a => Math.hypot(...a)
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)
const delta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))
const finiteRect = r => Array.isArray(r) && r.length === 4 && r.every(Number.isFinite) && r[2] > r[0] && r[3] > r[1]
const pixelValid = c => !!c && Number.isInteger(c.width) && c.width > 0 && c.width <= 640
  && Number.isInteger(c.height) && c.height > 0 && c.threshold === 2
  && Number.isInteger(c.union?.pixels) && c.union.pixels >= 0 && c.union.pixels <= c.width * c.height
  && near(c.union.fraction, c.union.pixels / (c.width * c.height), 1e-8)
  && (c.union.pixels === 0 ? c.union.rect === null : finiteRect(c.union.rect))
const visiblePixels = (c, minimum = 8) => pixelValid(c) && c.union.pixels >= minimum
const outputPixels = c => visiblePixels(c, 9) && Array.isArray(c.occurrences) && c.occurrences.length > 0
  && c.occurrences.every(o => o.uuid && Number.isInteger(o.pixels) && o.pixels >= 0)
  && c.occurrences.some(o => o.pixels > 0)
const pixelSpan = c => visiblePixels(c) ? Math.max((c.union.rect[2] - c.union.rect[0]) / c.width, (c.union.rect[3] - c.union.rect[1]) / c.height) : 0
const s1 = sample => sample?.world?.inspection?.runtime?.shaft?.stage1
const tuple = values => Array.isArray(values) && values.length === 8 && values.every(Number.isFinite)
const vector3 = values => Array.isArray(values) && values.length === 3 && values.every(Number.isFinite)
const fadeControlPages = [.4695, .470, .4705, .471, .4715, .472, .496, .498, .500, .502, .504]
const fadeLabel = o => o && typeof o.unit === 'string' && typeof o.kind === 'string'
  && typeof o.occurrence === 'string' && o.occurrence.length > 0
  && (/^stage[1-5]$/.test(o.unit) ? ['carrier', 'planet'].includes(o.kind)
    : o.unit === 'handle' && ['shell', 'interior'].includes(o.kind))
const labelKey = o => JSON.stringify([o.unit, o.kind, o.occurrence, o.part ?? null])
function countRectValid(count, rect, total) {
  return Number.isInteger(count) && count >= 0 && count <= total && (count === 0 ? rect === null : finiteRect(rect))
}
function adjudicateFadeOccurrence(o, capture, source) {
  const fail = reason => ({ uuid: o?.uuid ?? null, label: o ? labelKey(o) : null, pass: false, reason })
  if (!o?.uuid || !fadeLabel(o) || !source || !fadeLabel(source) || labelKey(o) !== labelKey(source)) return fail('missing-or-mismatched-rig-label')
  const c = o.control, total = capture.width * capture.height
  if (!c || !countRectValid(o.pixels, o.rect, total) || !countRectValid(c.maskPixels, c.maskRect, total)
    || !countRectValid(c.alphaPixels, c.alphaRect, total) || !countRectValid(c.frontFacePixels, c.frontFaceRect, total)
    || ![0, 1, 2].includes(c.sourceSide) || typeof c.geometricallyVisible !== 'boolean'
    || typeof c.ancestorsVisible !== 'boolean' || !Number.isFinite(c.appliedOpacity) || c.appliedOpacity < 0 || c.appliedOpacity > 1
    || !Array.isArray(source.applied) || !source.applied.length
    || !near(c.appliedOpacity, Math.max(...source.applied.map(m => m.opacity)), 1e-6)) return fail('missing-or-invalid-self-depth-control')
  if (c.appliedOpacity > 1e-6 && !c.ancestorsVisible) return fail('hidden-ancestor-at-positive-opacity')
  if (c.maskPixels === 0) {
    const r = c.projectedRect
    const outside = finiteRect(r) && (r[2] <= 0 || r[3] <= 0 || r[0] >= capture.width || r[1] >= capture.height)
    if (!outside || o.pixels > 0 || c.alphaPixels > 0 || c.frontFacePixels > 0) return fail('zero-identity-mask-without-outside-frame-proof')
    return { uuid: o.uuid, label: labelKey(o), pass: true, reason: 'projected-outside-frame', naturalPixels: o.pixels, control: c }
  }
  if (!c.geometricallyVisible) return fail('identity-mask-disagrees-with-geometric-visibility')
  if (o.pixels === 0 && c.alphaPixels === 0 && c.frontFacePixels === 0) return { uuid: o.uuid, label: labelKey(o), pass: true,
    reason: 'documented-backface-culling', naturalPixels: 0, control: c,
    note: 'DoubleSide identity mask contributes; the actual original-side identity mask contributes zero pixels at the same camera and pose.' }
  if (o.pixels > 0 && c.alphaPixels === 0) return { uuid: o.uuid, label: labelKey(o), pass: true,
    reason: 'natural-visible-with-material-control-note', naturalPixels: o.pixels, control: c,
    note: 'Actual beauty contributes; isolated original material has zero contrast against the neutral gray control baseline.' }
  if (c.alphaPixels === 0 && c.appliedOpacity > .1) return fail('material-or-light-suppression-at-positive-opacity')
  const reason = o.pixels > 0 ? 'natural-visible' : c.alphaPixels > 0 && c.ancestorsVisible
    ? 'documented-natural-occlusion' : 'below-control-pixel-threshold-at-low-opacity'
  return { uuid: o.uuid, label: labelKey(o), pass: true, reason, naturalPixels: o.pixels, control: c }
}
function fadeControlReplay(a, b) {
  if (!a || !b || !pixelValid(a) || !pixelValid(b) || !Array.isArray(a.occurrences) || !Array.isArray(b.occurrences)
    || a.width !== b.width || a.height !== b.height) return { pass: false, reason: 'missing-matched-control-capture' }
  const left = new Map(a.occurrences.map(o => [o.uuid, o])), right = new Map(b.occurrences.map(o => [o.uuid, o]))
  if (left.size !== a.occurrences.length || right.size !== b.occurrences.length || left.size !== right.size) return { pass: false, reason: 'occurrence-census-changed' }
  const differences = [...left].map(([uuid, x]) => {
    const y = right.get(uuid)
    if (!y || labelKey(x) !== labelKey(y) || !x.control || !y.control) return { uuid, pass: false, reason: 'missing-labelled-control' }
    const counts = [['natural', x.pixels, y.pixels], ['mask', x.control.maskPixels, y.control.maskPixels],
      ['frontFace', x.control.frontFacePixels, y.control.frontFacePixels], ['alpha', x.control.alphaPixels, y.control.alphaPixels]]
      .map(([kind, v, w]) => ({ kind, a: v, b: w, delta: Math.abs(v - w), allowed: Math.max(4, Math.max(v, w) * .005) }))
    const rectangles = [['natural', x.rect, y.rect], ['mask', x.control.maskRect, y.control.maskRect],
      ['frontFace', x.control.frontFaceRect, y.control.frontFaceRect], ['alpha', x.control.alphaRect, y.control.alphaRect],
      ['projected', x.control.projectedRect, y.control.projectedRect]]
      .map(([kind, v, w]) => ({ kind, delta: v === null && w === null ? 0 : finiteRect(v) && finiteRect(w) ? Math.max(...v.map((n, i) => Math.abs(n - w[i]))) : Infinity }))
    const opacityDelta = Math.abs(x.control.appliedOpacity - y.control.appliedOpacity)
    return { uuid, label: labelKey(x), counts, rectangles, opacityDelta,
      pass: counts.every(c => Number.isFinite(c.delta) && c.delta <= c.allowed) && rectangles.every(r => r.delta <= 2)
        && opacityDelta <= .002 && x.control.ancestorsVisible === y.control.ancestorsVisible
        && x.control.geometricallyVisible === y.control.geometricallyVisible && x.control.sourceSide === y.control.sourceSide }
  })
  return { pass: differences.every(d => d.pass), differences, tolerance: 'Counts max(4px,0.5%); rect coordinates 2px at capture resolution; opacity .002; flags and labels exact.' }
}
function namedFadeChecks(result) {
  const records = result.samples.filter(s => s.kind === 'page' && fadeControlPages.includes(s.requestedProgress))
  const membership = result.samples.map(s1).find(s => s?.cascadeMembership?.length === 8)?.cascadeMembership
  const evidence = records.map(s => {
    const capture = s.pixels?.fadeOccurrences, census = s.world.isolation?.occurrences ?? [], selected = census.filter(fadeLabel)
    const issues = []
    if (!pixelValid(capture) || !Array.isArray(capture?.occurrences) || !capture.occurrences.length) {
      return { direction: s.direction, requested: s.requestedProgress, actual: s.world.progress, pass: false, issues: ['missing-named-control-capture'], occurrences: [] }
    }
    const ids = new Set(capture.occurrences.map(o => o.uuid))
    if (ids.size !== capture.occurrences.length || ids.size !== selected.length || !selected.every(o => ids.has(o.uuid))) issues.push('labelled-source/capture-census-mismatch')
    for (const unit of ['stage1', 'stage2', 'stage5', 'stage3', 'stage4']) {
      const members = selected.filter(o => o.unit === unit)
      const planets = new Set(members.filter(o => o.kind === 'planet').map(o => o.occurrence))
      const expected = membership?.find(m => m.unit === unit)?.planets
      if (!members.some(o => o.kind === 'carrier') || !expected || planets.size !== expected.length) issues.push(`${unit}-carrier-or-planet-occurrence-missing`)
    }
    for (const kind of ['shell', 'interior']) if (!selected.some(o => o.unit === 'handle' && o.kind === kind)) issues.push(`handle-${kind}-missing`)
    const occurrences = capture.occurrences.map(o => adjudicateFadeOccurrence(o, capture, selected.find(source => source.uuid === o.uuid)))
    if (!occurrences.every(o => o.pass)) issues.push('individual-control-adjudication-failed')
    // A wholly zero natural census cannot pass through aggregate pixels or
    // diagnostic masks alone when the selected meshes retain useful opacity.
    if (capture.occurrences.some(o => o.control?.appliedOpacity > .1) && !capture.occurrences.some(o => o.pixels > 0)) issues.push('all-individual-natural-contributions-zero')
    return { direction: s.direction, requested: s.requestedProgress, actual: s.world.progress,
      pass: issues.length === 0, issues, expectedNames: selected.map(o => ({ uuid: o.uuid, unit: o.unit, kind: o.kind, occurrence: o.occurrence, part: o.part })), occurrences }
  })
  const coverage = ['forward', 'reverse'].every(direction => fadeControlPages.every(p => evidence.some(e => e.direction === direction && e.requested === p)))
  check(result, 'F1/F3 every named carrier, planet and handle mesh has adjudicated rendered controls in both directions', coverage
    && evidence.every(e => e.pass) && evidence.some(e => e.occurrences.some(o => o.naturalPixels > 0)),
  { checkpoints: fadeControlPages, coverage, evidence, positiveOpacityEpsilon: 1e-6, suppressionThreshold: .1 })
  const replay = fadeControlPages.map(p => {
    const forward = records.find(s => s.direction === 'forward' && s.requestedProgress === p)
    const reverse = records.find(s => s.direction === 'reverse' && s.requestedProgress === p)
    return { p, progressDelta: forward && reverse ? Math.abs(forward.world.progress - reverse.world.progress) : null,
      stateDelta: forward && reverse ? numericDifference(fadeFingerprint(forward), fadeFingerprint(reverse)) : Infinity,
      ...fadeControlReplay(forward?.pixels?.fadeOccurrences, reverse?.pixels?.fadeOccurrences) }
  })
  check(result, 'F1/F3 named natural/control pixel fingerprints replay at identical native locations', coverage
    && replay.every(r => r.pass && Number.isFinite(r.progressDelta) && r.progressDelta <= 1e-7 && r.stateDelta <= .002), replay)
}
function supportMeasurement(proof) {
  const valid = proof && ['sourceCenter', 'privateCenter', 'offset', 'sourceSize', 'privateSize'].every(k => vector3(proof[k]))
    && Number.isFinite(proof.distance) && proof.distance >= 0 && ['K000210', 'K000211'].every(part => proof.sourceParts?.includes(part))
  if (!valid) return { valid: false, proof }
  const measuredDistance = norm(sub(proof.sourceCenter, proof.privateCenter)), offsetDistance = norm(proof.offset)
  const sizeDelta = proof.sourceSize.map((v, i) => Math.abs(v - proof.privateSize[i]))
  return { valid: near(measuredDistance, proof.distance, 1e-7) && near(offsetDistance, proof.distance, 1e-7),
    proof, measuredDistance, sizeDelta,
    sizeMatches: proof.sourceSize.every((v, i) => v > 0 && proof.privateSize[i] > 0 && sizeDelta[i] <= Math.max(.0001, v * .01)) }
}
const requiredCases = ['desktop-full', 'narrow-full', 'desktop-lite', 'narrow-lite', 'desktop-reduced', 'narrow-reduced']
// Legacy shaft-tail contribution, independently frozen from the pre-correction
// production map. The dedicated cascade x16 adds 15 baseline intervals; the
// overlapping shaft kernel remains. Beat metadata alone proves neither term.
function legacyShaftTailAverage() {
  const u = (.815 - .62) / (.825 - .62), w = 1 - u
  return 1 + (.825 - .62) * w * w / (2 * .15 * (1 - .15)) / .01
}
function pacingEvidence(pacing) {
  const actualAverage = pacing?.continuationNativePixels / (pacing?.baselineRange * .01)
  const legacyAverage = legacyShaftTailAverage()
  return { ...pacing, method: '(scrollFraction(.825)-scrollFraction(.815))*actualRange',
    actualAverage, legacyAverage, addedAverage: actualAverage - legacyAverage,
    requiredAddedAverage: 15, expectedTotalAverage: legacyAverage + 15,
    expectedPixels: pacing?.baselineRange * .01 * (legacyAverage + 15) }
}
function chooseNearestTimePixel(adjacent, requestedTime) {
  if (!adjacent.length || adjacent.some(a => !Number.isInteger(a.pixel) || !Number.isFinite(a.progress) || !Number.isFinite(a.time))) throw new Error('Invalid native-pixel clock bracket')
  const ranked = [...adjacent].sort((a, b) => Math.abs(a.time - requestedTime) - Math.abs(b.time - requestedTime))
  const spacing = ranked.length > 1 ? Math.abs(ranked[0].time - ranked[1].time) : 0
  return { selected: ranked[0], timeSpacing: spacing, allowedRequestedTimeError: Math.max(.025, spacing / 2 + .003) }
}
const options = { run: false, final: false, selfTest: false, url: null, out: null, analyze: null, case: null, failFast: false, resume: null, refinement: false }
for (const arg of process.argv.slice(2)) {
  if (arg === '--run') options.run = true
  else if (arg === '--final-integration') options.final = true
  else if (arg === '--self-test') options.selfTest = true
  else if (arg === '--fail-fast') options.failFast = true
  else if (arg === '--refinement-only') options.refinement = true
  else if (arg.startsWith('--case=')) options.case = arg.slice(7)
  else if (arg.startsWith('--url=')) options.url = arg.slice(6)
  else if (arg.startsWith('--out=')) options.out = path.resolve(arg.slice(6))
  else if (arg.startsWith('--analyze=')) options.analyze = path.resolve(arg.slice(10))
  else if (arg.startsWith('--resume=')) options.resume = path.resolve(arg.slice(9))
  else throw new Error(`Unknown argument ${arg}`)
}
if (options.refinement && (options.final || options.resume)) throw new Error('Refinement evidence cannot publish full-roster stills or resume an older roster')

function selfTest() {
  const channel = { maximumDegreesPerFrame: 17, maximumRawDegreesPerFrame: 17, halfPeriodDegrees: 18, flags: 0 }
  const capture = width => ({ pass: true, recordedCap: inputRpmCap, headed: true, viewport: { width }, channels: [channel],
    nextWholeRpm: inputRpmCap + 1, nextRpmWitnessDegrees: 18.1, nextWholeRpmFailsSameMeasuredCadence: true })
  const speed = { pass: true, realTimeConfirmed: true, cap: inputRpmCap, ratio: 100, nominalFps: 60, cases: [capture(1440), capture(390)] }
  assert.equal(validSpeedProof(speed), true)
  assert.equal(validSpeedProof({ ...speed, cases: [...speed.cases, ...speed.cases, ...speed.cases] }), true)
  assert.equal(validSpeedProof({ ...speed, cases: [capture(1440)] }), false)
  assert.equal(validSpeedProof({ ...speed, cases: speed.cases.map(c => ({ ...c, headed: false })) }), false)
  assert.equal(validSpeedProof({ ...speed, cases: speed.cases.map(c => ({ ...c, channels: [{ ...channel, maximumDegreesPerFrame: 18 }] })) }), false)
  assert.equal(validSpeedProof({ ...speed, cases: speed.cases.map(c => ({ ...c, channels: [{ ...channel, maximumRawDegreesPerFrame: 18 }] })) }), false)
  assert.equal(validSpeedProof({ ...speed, cases: speed.cases.map(c => ({ ...c, nextWholeRpmFailsSameMeasuredCadence: false })) }), false)
  assert.equal(pixelValid(null), false)
  assert.equal(visiblePixels({ width: 640, height: 400, threshold: 2, union: { pixels: 100, fraction: 0, rect: [0, 0, 10, 10] } }), false)
  const valid = { width: 640, height: 400, threshold: 2, union: { pixels: 12800, fraction: .05, rect: [40, 40, 360, 200] } }
  assert.equal(visiblePixels(valid), true)
  assert.equal(pixelSpan(valid), .5)
  assert.equal(outputPixels(valid), false) // Whole-train/union-only evidence cannot establish output visibility.
  assert.equal(outputPixels({ ...valid, occurrences: [{ uuid: 'output', pixels: 0 }] }), false)
  assert.equal(outputPixels({ ...valid, occurrences: [{ uuid: 'output', pixels: 12800 }] }), true)
  assert.equal(outputPixels({ ...valid, union: { pixels: 8, fraction: 8 / (640 * 400), rect: [0, 0, 2, 4] },
    occurrences: [{ uuid: 'output', pixels: 8 }] }), false)
  assert.equal(tuple([1, 2]), false)
  assert.equal(tuple(Array(8).fill(NaN)), false)
  assert.ok(near(delta(179 * Math.PI / 180, -179 * Math.PI / 180), 2 * Math.PI / 180))
  assert.equal(depthIssues([{ uuid: 'x', source: [{ opacity: 1 }], applied: [{ opacity: .5, transparent: true, depthWrite: true }] }]).length, 1)
  assert.equal(depthIssues([{ uuid: 'x', source: [{ opacity: 1 }], applied: [{ opacity: .5, transparent: true, depthWrite: false }] }]).length, 0)
  assert.ok(fadeFingerprint({ world: { isolation: { occurrences: [{ uuid: 'a', visible: true, studyOwned: false, applied: [{ opacity: .5, transparent: true, depthWrite: false }] }] } } }))
  assert.ok(existsSync(path.join(root, 'scripts/lib/browser-launch.mjs')))
  const pixels = [{ pixel: 100, progress: .81922, time: 47.39 }, { pixel: 101, progress: .81924, time: 47.426 }]
  const nearest = chooseNearestTimePixel(pixels, 47.4)
  assert.equal(nearest.selected.pixel, 100)
  assert.ok(near(nearest.timeSpacing, .036))
  assert.equal(nearest.allowedRequestedTimeError, .025)
  assert.throws(() => chooseNearestTimePixel([{ pixel: NaN, time: 4, progress: .8 }], 4))
  const missing = pacingEvidence({ baselineRange: 39441.970400025035, continuationNativePixels: 469.8745688078611 })
  // The DOM's integer scroll range differs fractionally from the pacing
  // baseline reserved by CSS; the saved run has a 1e-5 ratio residue.
  assert.ok(near(missing.addedAverage, 0, .00002))
  const corrected = pacingEvidence({ baselineRange: 39441.970400025035, continuationNativePixels: missing.expectedPixels })
  assert.ok(near(corrected.addedAverage, 15, 1e-8))
  const support = { sourceParts: ['K000210', 'K000211'], sourceCenter: [0, 0, 0], privateCenter: [0, 0, .001],
    offset: [0, 0, -.001], distance: .001, sourceSize: [.02, .02, .005], privateSize: [.02, .02, .005] }
  assert.equal(supportMeasurement(support).valid, true)
  assert.equal(supportMeasurement({ ...support, distance: 0 }).valid, false)
  assert.equal(supportMeasurement({ ...support, privateSize: [.04, .02, .005] }).sizeMatches, false)
  assert.equal(supportMeasurement({}).valid, false)
  const labelled = { uuid: 'planet-1', unit: 'stage1', kind: 'planet', occurrence: 'MERGED stage1 Planet 1', part: 'P000247',
    pixels: 0, rect: null, control: { maskPixels: 100, maskRect: [1, 1, 11, 11], alphaPixels: 40, alphaRect: [1, 1, 9, 6],
      frontFacePixels: 100, frontFaceRect: [1, 1, 11, 11], sourceSide: 0,
      projectedRect: [1, 1, 11, 11], geometricallyVisible: true, ancestorsVisible: true, appliedOpacity: .5 } }
  const labelledSource = { ...labelled, applied: [{ opacity: .5 }] }
  const adjudicate = row => adjudicateFadeOccurrence(row, valid, labelledSource)
  assert.equal(adjudicate(labelled).reason, 'documented-natural-occlusion')
  assert.equal(adjudicate({ ...labelled, control: null }).pass, false)
  assert.equal(adjudicate({ ...labelled, control: { ...labelled.control, ancestorsVisible: false } }).pass, false)
  assert.equal(adjudicate({ ...labelled, control: { ...labelled.control, alphaPixels: 0, alphaRect: null } }).pass, false)
  assert.equal(adjudicate({ ...labelled, control: { ...labelled.control, alphaPixels: 0, alphaRect: null,
    frontFacePixels: 0, frontFaceRect: null } }).reason, 'documented-backface-culling')
  assert.equal(adjudicate({ ...labelled, control: { ...labelled.control, frontFacePixels: undefined } }).pass, false)
  assert.equal(adjudicate({ ...labelled, pixels: 10, rect: [1, 1, 3, 6],
    control: { ...labelled.control, alphaPixels: 0, alphaRect: null } }).reason, 'natural-visible-with-material-control-note')
  const outside = { ...labelled, control: { ...labelled.control, maskPixels: 0, maskRect: null, alphaPixels: 0, alphaRect: null,
    frontFacePixels: 0, frontFaceRect: null,
    projectedRect: [-20, 1, -1, 11], geometricallyVisible: false } }
  assert.equal(adjudicate(outside).reason, 'projected-outside-frame')
  assert.equal(adjudicate({ ...outside, control: { ...outside.control, projectedRect: [1, 1, 11, 11] } }).pass, false)
  const sameCapture = { ...valid, occurrences: [labelled] }
  assert.equal(fadeControlReplay(sameCapture, sameCapture).pass, true)
  assert.equal(fadeControlReplay(sameCapture, { ...sameCapture, occurrences: [{ ...labelled,
    control: { ...labelled.control, alphaPixels: 90 } }] }).pass, false)
  console.log('PASS offline verifier guards: pixel evidence, output-only visibility, labelled occlusion/backface/control adjudication and replay, opacity/depth, signed angles, nearest native time pixel, additive x16 pacing, shared launcher')
}
if (options.selfTest) { selfTest(); process.exit(0) }
if (options.analyze) {
  if (!options.analyze.startsWith(evidenceRoot + path.sep)) throw new Error('Analysis restricted to task evidence')
  const input = JSON.parse(readFileSync(options.analyze, 'utf8')), THREE = await import('three')
  let historical
  try { historical = JSON.parse(readFileSync(path.join(root, 'output/playwright/stage1-cascade/report.json'))) } catch {}
  const analysis = { source: options.analyze, partial: true, cases: [] }
  const interruptionFile = path.join(path.dirname(options.analyze), 'interruption.json')
  const interruption = existsSync(interruptionFile) ? JSON.parse(readFileSync(interruptionFile, 'utf8')) : null
  for (const c of input.cases) {
    if (!c.samples?.length || c.tier === 'reduced') continue
    const result = { ...c, checks: [] }
    for (const evaluate of [() => stageChecks(result, THREE, historical), () => pageChecks(result)]) {
      try { evaluate() } catch (error) { check(result, 'Remaining gates unavailable after abort', false, String(error)) }
    }
    const times = c.samples.filter(s => s.kind === 'time' && s.direction === 'forward')
    const hasEndpoint = times.some(s => s.requestedTime === 58)
    for (const g of result.checks) {
      g.status = g.pass ? 'sampled-pass' : 'incomplete'
      if (!g.pass && g.name.includes('native continuation') && c.pacing) g.status = 'measured-fail'
      if (!g.pass && g.name.startsWith('F2') && interruption?.f2) { g.status = 'invalid-probe'; g.probeLimitation = interruption.f2 }
      if (!g.pass && hasEndpoint && !g.name.startsWith('F2')) g.status = 'fail'
    }
    analysis.cases.push({ name: c.name, sampleCount: c.samples.length, abort: c.failure,
      coverage: { highestRequestedTime: times.at(-1)?.requestedTime ?? null, reached58: hasEndpoint,
        reverseSamples: c.samples.filter(s => s.direction === 'reverse').length, continuousSequences: c.sequences?.length ?? 0 }, checks: result.checks })
  }
  writeFileSync(path.join(path.dirname(options.analyze), 'partial-analysis.json'), JSON.stringify(analysis, null, 2) + '\n')
  for (const c of analysis.cases) for (const g of c.checks) console.log(`${g.status.toUpperCase()} ${c.name}: ${g.name}`)
  process.exit(0)
}
if (!options.run || !options.url) throw new Error('Author-only by default. Parent readiness required: supply --run --url=http://localhost:PORT/torque-wrench/')
if (options.case && !requiredCases.includes(options.case)) throw new Error(`Unknown --case=${options.case}; expected one of ${requiredCases.join(', ')}`)
const selectedCases = options.case ? [options.case] : options.refinement ? requiredCases.filter(c => !c.endsWith('-reduced')) : requiredCases
const base = new URL(options.url)
if (!['http:', 'https:'].includes(base.protocol)) throw new Error('HTTP(S) production preview URL required')
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const out = options.out ?? path.join(evidenceRoot, runId)
const relOut = path.relative(evidenceRoot, out)
if (relOut.startsWith('..') || path.isAbsolute(relOut) || !relOut) throw new Error('--out must be a new run directory beneath output/playwright/owner-corrections/')
if (existsSync(path.join(out, 'report.json'))) throw new Error('Refusing to overwrite an existing evidence run')
mkdirSync(out, { recursive: true })
const report = {
  task: 'owner-corrections-56', contract: '56/100-to-1/solid-housing/native-58s/scroll-x16', verifierRevision: 'ratio-cap-stage2-orbit-solid-housing-v2', startedAt: new Date().toISOString(),
  requiredRoster: requiredCases, selectedRoster: selectedCases, failFast: options.failFast,
  verificationScope: options.refinement ? 'Owner corrections 56: four live viewport/tier cases, ratio/cap, Stage 2 orbit, solid housing; excludes a new full F1-F4/static roster.' : 'Full owner-corrections roster',
  url: base.href, out, launch: describeLaunch(), pass: false, runtimePass: false, failures: [], cases: [], stills: [],
  thresholds: { progress: .00005, timeSeconds: .025, settleFrames: 4, renderedDrivetrainSpan: .5, renderedForegroundFraction: .01,
    ringPixels: 32, ringMinimumSpan: .15, cameraInteriorTranslationMetres: .00001, straightLineErrorMetres: .0001 },
  boundaries: ['Owner visual acceptance remains open.', 'No claim of triangle-level collision freedom.',
    'A/B contribution measures current depth/occlusion, including legitimately occluded occurrences; it is not isolated-object rendering.',
    'Per-occurrence source material census includes numeric source/applied opacity and effective visibility; private stage tuple samples first material plus actual membership.',
    'Sequential browser video is continuous wall-clock evidence; settled samples separately verify applied state.'],
  assets: { provenance: 'doc48 historical protected hashes', expected: hashes },
}
const save = () => writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
const assetHashes = () => Object.fromEntries(Object.keys(hashes).map(name => {
  try { return [name, sha(readFileSync(path.join(root, 'public/models', name)))] }
  catch (error) { return [name, `MISSING: ${error.message}`] }
}))
function check(result, name, pass, evidence) { result.checks.push({ name, pass: !!pass, evidence }) }
function depthIssues(occurrences) {
  if (!Array.isArray(occurrences) || !occurrences.length) return [{ error: 'Missing per-occurrence material census' }]
  return occurrences.flatMap(o => !o.uuid || !Array.isArray(o.source) || !Array.isArray(o.applied) || !o.applied.length || o.source.length !== o.applied.length
    ? [{ uuid: o.uuid, error: 'Missing actual source/applied material slots' }]
    : o.applied.flatMap((m, i) => !Number.isFinite(m.opacity) || !Number.isFinite(o.source[i].opacity)
      || typeof m.depthWrite !== 'boolean' || typeof m.transparent !== 'boolean'
      || (m.opacity > .000001 && m.opacity < .999999 && (!m.transparent || m.depthWrite))
      ? [{ uuid: o.uuid, name: o.name, slot: i, source: o.source[i], applied: m }] : []))
}
function fadeFingerprint(sample) {
  return (sample.world.isolation?.occurrences ?? []).map(o => ({ uuid: o.uuid, visible: o.visible, studyOwned: o.studyOwned,
    applied: o.applied.map(m => [m.opacity, m.transparent, m.depthWrite]) })).sort((a, b) => a.uuid.localeCompare(b.uuid))
}
function mechanicalFingerprint(sample) {
  const s = s1(sample)
  return s ? Object.fromEntries(['cascadeAlpha', 'cascadePlanetAlpha', 'cascadeOffsetZ', 'cascadeRotZ', 'slideProgress',
    'sunRotZ', 'carrierRotZ', 'planetRotZ', 'housingGhostAlpha'].map(k => [k, s[k]])) : null
}
function numericDifference(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b)
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return Math.max(0, ...a.map((v, i) => numericDifference(v, b[i])))
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = Object.keys(a)
    return keys.length === Object.keys(b).length ? Math.max(0, ...keys.map(k => numericDifference(a[k], b[k]))) : Infinity
  }
  return a === b ? 0 : Infinity
}
async function productionFingerprint() {
  const response = await fetch(base)
  if (!response.ok) throw new Error(`Production HTML HTTP ${response.status}`)
  const html = await response.text()
  if (/\/@vite\/client|\/src\/.*\.[tj]sx?/.test(html)) throw new Error('Development server is not production evidence')
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m => m[1])
  if (!scripts.length) throw new Error('No production module scripts')
  const entries = []
  for (const src of scripts) {
    const url = new URL(src, base)
    if (url.origin !== base.origin) throw new Error(`Unexpected external module ${url}`)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Production module ${res.status}: ${url}`)
    const bytes = Buffer.from(await res.arrayBuffer())
    const local = path.resolve(root, 'dist', '.' + decodeURIComponent(url.pathname))
    if (!local.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Invalid production module path')
    if (sha(bytes) !== sha(readFileSync(local))) throw new Error(`Served module differs from dist: ${src}; restart preview`)
    entries.push({ src, sha256: sha(bytes), bytes: bytes.length })
  }
  return entries
}
async function loadClock() {
  const { buildSync } = await import('esbuild')
  const entry = path.join(root, 'src/scene/torque-wrench/InspectionDirector.ts')
  const bundle = buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' }).outputFiles[0].contents
  report.clock = { entry: path.relative(root, entry), sourceSha256: sha(readFileSync(entry)), bundleSha256: sha(bundle), use: 'Seek inversion only; assertions read installed state' }
  return import(`data:text/javascript;base64,${Buffer.from(bundle).toString('base64')}`)
}
function pageAt(time, aspect, clock) {
  if (time === 58) return .825
  if (time === 40.2) return .815
  let lo = .735, hi = .940
  const scratch = clock.createPrivateInspectionSample()
  for (let i = 0; i < 55; i++) {
    const mid = (lo + hi) / 2
    if (clock.samplePrivateInspection(mid, aspect, scratch).subjectTime < time) lo = mid
    else hi = mid
  }
  return .62 + (lo + hi) / 2 - .735
}
const readWorld = page => page.evaluate(() => ({ world: window.__torqueWorld.snapshot(),
  nativeY: scrollY, nativeRange: document.documentElement.scrollHeight - innerHeight,
  mode: document.querySelector('.torque-page')?.dataset.torqueMode, canvases: document.querySelectorAll('canvas').length }))
async function seek(page, p, time = null) {
  let current
  let requestedProgress = p
  const quantization = time !== null ? await page.evaluate(p => {
    const range = document.documentElement.scrollHeight - innerHeight
    const desired = window.__torqueNarrative.scrollFraction(p) * range
    return { desiredPixel: desired, adjacent: [...new Set([Math.floor(desired), Math.ceil(desired)])].map(pixel => ({ pixel,
      progress: window.__torqueNarrative.narrativeProgress(pixel / range) })) }
  }, p) : null
  if (quantization) {
    for (const adjacent of quantization.adjacent) adjacent.time = activeClock.samplePrivateInspection(.735 + Math.max(0, Math.min(.205, adjacent.progress - .62)), activeAspect, activeClock.createPrivateInspectionSample()).subjectTime
    Object.assign(quantization, chooseNearestTimePixel(quantization.adjacent, time))
  }
  const attempts = []
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await page.evaluate(() => window.__torqueWorld.snapshot().frames)
    await page.evaluate(({ progress, nativePixel }) => {
      const y = nativePixel ?? window.__torqueNarrative.scrollFraction(progress) * (document.documentElement.scrollHeight - innerHeight)
      window.scrollTo({ top: y, behavior: 'instant' })
    }, { progress: requestedProgress, nativePixel: attempt === 0 ? quantization?.selected.pixel ?? null : null })
    await page.waitForFunction(({ p, before }) => {
      const w = window.__torqueWorld?.snapshot?.()
      return w?.ready && w.sheet?.baked && w.sheet.stats?.annotationsReady === 1 && w.sheet.stats?.shaderWarmReady === 1
        && w.frames >= before + 4 && document.querySelector('canvas') && Math.abs(w.progress - p) <= .00005
        && (p < .62 || p >= .845 || (w.inspection.ready && !w.journey.pending))
    }, { p, before }, { timeout: 90000, polling: 100 })
    await page.waitForTimeout(180)
    current = { requestedProgress: p, requestedTime: time, scrollRequestProgress: requestedProgress, quantization, ...(await readWorld(page)) }
    attempts.push({ attempt: attempt + 1, requestedProgress, appliedProgress: current.world.progress, nativeY: current.nativeY,
      subjectTime: current.world.inspection.subjectTime, selectedPixel: quantization?.selected.pixel ?? null })
    current.seekAttempts = attempts
    const clockPass = time === null || (Math.abs(current.world.inspection.subjectTime - quantization.selected.time) <= .003
      && Math.abs(current.world.inspection.subjectTime - time) <= quantization.allowedRequestedTimeError)
    if (Math.abs(current.world.progress - p) <= .00005 && clockPass) return current
    requestedProgress += p - current.world.progress
    // The first attempt used the adjacent pixel with the nearest clock. If its
    // applied progress disagrees, retry the measured correction through the
    // native mapping rather than sending that same selected pixel repeatedly.
    if (quantization && attempt === 0) quantization.correctedAfterFirstAttempt = true
  }
  const error = new Error(`Native applied seek failed p=${p}, time=${time}; actual p=${current?.world.progress}, time=${current?.world.inspection?.subjectTime}`)
  error.seekEvidence = current
  throw error
}
async function capture(page, kind, individual = false) {
  const proof = await page.evaluate(({ kind, individual }) => window.__torqueWorld.visibilityCapture(kind, individual), { kind, individual })
  if (!pixelValid(proof)) throw new Error(`Missing/invalid actual ${kind} A/B pixels`)
  if (individual && (!Array.isArray(proof.occurrences) || !proof.occurrences.length)) throw new Error(`Missing individual ${kind} A/B census`)
  return proof
}
async function screenshot(page, result, name, sample) {
  const filename = `${result.name}/${name}.png`
  const bytes = await page.screenshot({ path: path.join(out, filename), timeout: 60000 })
  result.screenshots.push({ filename, sha256: sha(bytes), progress: sample.world.progress, time: sample.world.inspection?.subjectTime })
}
async function measureDomClearance(page, proof) {
  return page.evaluate(proof => {
    if (!proof?.union?.rect) return { pass: false, reason: 'missing-rendered-subject' }
    const r = proof.union.rect, subject = { left: r[0] * innerWidth / proof.width,
      top: r[1] * innerHeight / proof.height, right: r[2] * innerWidth / proof.width, bottom: r[3] * innerHeight / proof.height }
    const visible = element => {
      for (let node = element; node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node), bounds = node.getBoundingClientRect()
        if (style.display === 'none' || style.visibility !== 'visible' || +style.opacity <= .01
          || (bounds.width <= 1 && bounds.height <= 1 && (style.clipPath !== 'none' || style.clip !== 'auto' || style.overflow === 'hidden'))
          || node.matches('.torque-sr,.shaft-visually-hidden')) return false
      }
      return true
    }
    const elements = [...document.querySelectorAll('[data-shaft-caption],.torque-chapter__title,.torque-chapter__lede,.torque-chapter__body,.torque-page button,.torque-page input,.torque-inspection-overlay button')]
      .filter(visible).map(element => { const r = element.getBoundingClientRect(); return { text: element.textContent?.trim().slice(0, 100),
        left: Math.max(0, r.left), top: Math.max(0, r.top), right: Math.min(innerWidth, r.right), bottom: Math.min(innerHeight, r.bottom) } })
      .filter(r => r.right > r.left && r.bottom > r.top)
    const overlaps = elements.filter(r => r.left < subject.right + 8 && r.right > subject.left - 8 && r.top < subject.bottom + 8 && r.bottom > subject.top - 8)
    return { subject, elements, overlaps, margin: 8, pass: elements.length > 0 && overlaps.length === 0 }
  }, proof)
}
function localCamera(sample, THREE) {
  const w = sample.world, matrix = w.journey?.cameraRegistrationMatrix
  if (!Array.isArray(matrix) || matrix.length !== 16 || !matrix.every(Number.isFinite)) throw new Error('Missing actual camera registration')
  const inverse = new THREE.Matrix4().fromArray(matrix).invert()
  const convert = v => { const p = new THREE.Vector3().fromArray(v).applyMatrix4(inverse); return [p.x, -p.z, p.y] }
  return { position: convert(w.camera.position), target: convert(w.camera.target), fov: w.camera.fov }
}
function stageChecks(result, THREE, historical) {
  const rows = result.samples.filter(s => s.kind === 'time' && s.direction === 'forward')
  const at = t => rows.find(s => s.requestedTime === t)
  const continuation = rows.filter(s => s.requestedTime >= 40.2)
  const speedBytes = readFileSync(path.join(root, speedEvidencePath)), speed = JSON.parse(speedBytes)
  check(result, '56 measured headed nominal playback bounds every repeated feature; next integer RPM fails the measured cadence',
    validSpeedProof(speed) && speed.cases.filter(c => c.recordedCap === inputRpmCap).every(c => c.installation?.modules?.some(m =>
      result.sceneBuilds.some(s => s.chunk === m.filename && s.servedSha256 === m.servedSha256 && m.servedSha256 === m.localSha256))),
    { path: speedEvidencePath, sha256: sha(speedBytes), cap: speed.cap, ratio: speed.ratio,
      cases: speed.cases.map(c => ({ viewport: c.viewport, cadence: c.cadence, channels: c.channels,
        nextWholeRpm: c.nextWholeRpm, nextRpmWitnessDegrees: c.nextRpmWitnessDegrees })), limits: speed.limits })
  check(result, 'R1 installed split alpha and actual membership', continuation.length > 50 && continuation.every(row => {
    const s = s1(row)
    return s && tuple(s.cascadeAlpha) && tuple(s.cascadePlanetAlpha) && tuple(s.cascadeRotZ) && tuple(s.cascadeOffsetZ)
      && s.cascadePresent?.length === 8 && s.cascadePresent.every(Boolean)
      && s.cascadeMembership?.length === 8 && s.cascadeMembership.every((m, i) => m.unit === units[i]
        && m.carrierMeshes > 0 && m.carrierMaterials > 0 && (i > 2 && i !== 4 && i !== 5 || m.planets.length > 0)
        && m.planets.every(p => p.name && p.meshes > 0 && p.materials > 0))
  }), continuation.map(s => ({ t: s.requestedTime, membership: s1(s)?.cascadeMembership })))
  const reveals = revealEvents.map(event => {
    const before = at(event.start - .1), full = at(event.full), end = at(event.cageStart), cage = at(event.cageFull)
    const orbit = full && end ? Math.abs(s1(end).cascadeRotZ[event.index] - s1(full).cascadeRotZ[event.index]) / (2 * Math.PI) : 0
    const pixels = full?.pixels?.[units[event.index]]
    return { ...event, orbit, before: before && s1(before), full: full && s1(full), end: end && s1(end), cage: cage && s1(cage), pixels,
      pass: before && full && end && cage && s1(before).cascadePlanetAlpha[event.index] === 0
        && s1(full).cascadePlanetAlpha[event.index] > .98 && s1(full).cascadeAlpha[event.index] < .01
        && s1(end).cascadeAlpha[event.index] < .02 && (event.index !== 1 || orbit >= 1)
        && s1(cage).cascadeAlpha[event.index] > .98 && visiblePixels(pixels)
        && pixels.occurrences.some(o => o.pixels > 2) }
  })
  check(result, '56 planets render before carriers; only Stage 2 gates on one full orbit', reveals.every(e => e.pass), reveals)
  const first = at(42.4), beforeFirst = at(42.3)
  const firstCamera = first && localCamera(first, THREE)
  const view = firstCamera && sub(firstCamera.position, firstCamera.target)
  const firstAzimuth = view && Math.atan2(view[2], view[0]) * 180 / Math.PI
  const firstElevation = view && Math.asin(view[1] / norm(view)) * 180 / Math.PI
  check(result, '54 Stage 2 remains absent until the reference side-angle exposes Stage 1 sun', beforeFirst && first
    && s1(beforeFirst).cascadePlanetAlpha[1] === 0 && Math.abs(firstAzimuth - 151.5) < 1
    && Math.abs(firstElevation + 12) < 1, { firstAzimuth, firstElevation, firstCamera })
  const rates = revealEvents.map(e => { const row = at(e.full), finale = row?.world.inspection.runtime?.shaft?.finale
    return { t: e.full, expected: e.rate, observed: finale?.driveRate, inputRpm: finale?.inputRpm } })
  const r = (.052) ** .25
  const ratios = [1, r, r ** 2, 0, r ** 3, r ** 4, r ** 4, 0]
  const rateRows = rows.filter(r => r.requestedTime >= 40.6 && r.requestedTime <= 58)
  const ratioFaults = rateRows.slice(1).flatMap((b, i) => {
    const a = rateRows[i], drive = s1(b).cascadeRotZ[0] - s1(a).cascadeRotZ[0]
    return ratios.flatMap((ratio, k) => Math.abs(s1(b).cascadeRotZ[k] - s1(a).cascadeRotZ[k] - drive * ratio) > 1e-4 ? [{ t: b.requestedTime, k }] : [])
  })
  check(result, '54 shared input RPM rises at each reveal without changing linked speed ratios', rates.every((r, i) => near(r.observed, r.expected, .02)
    && near(r.inputRpm, r.observed * 5.2 * 60 / (2 * Math.PI), .01) && (i === 0 || r.inputRpm > rates[i - 1].inputRpm))
    && rateRows.every(row => row.world.inspection.runtime.shaft.finale.inputRpm <= inputRpmCap + 1e-6)
    && ratioFaults.length === 0, { rates, ratioFaults, inputRpmCap })
  const ratioA = at(55.5), ratioB = at(58)
  const inputDegrees = Math.abs(s1(ratioB).sunRotZ - s1(ratioA).sunRotZ) * 180 / Math.PI
  const outputDegrees = Math.abs(s1(ratioB).cascadeRotZ[6] - s1(ratioA).cascadeRotZ[6]) * 180 / Math.PI
  check(result, '56 measured input:output ratio is 100:1; output has noticeable rotation without a half-turn target',
    near(inputDegrees / outputDegrees, inputOutputRatio, .001) && outputDegrees > 5,
    { inputDegrees, outputDegrees, measuredRatio: inputDegrees / outputDegrees, authoredWindow: [55.5, 58], inputRpmCap })
  const arrivalTimes = [48.8, 51, 51.4, 53.4, 55.5, 56.6]
  const indices = [1, 2, 3, 4, 5, 6]
  const arrivals = arrivalTimes.map((t, i) => ({ t, unit: units[indices[i]], row: at(t), index: indices[i] }))
  check(result, 'R1 physical downstream order at assembled datum; private shell always hidden', arrivals.every(({ row, index }) => row && s1(row)?.cascadeAlpha[index] > .98)
    && continuation.every(r => s1(r)?.cascadeAlpha[7] === 0 && s1(r)?.cascadeOffsetZ.slice(1).every(z => Math.abs(z) <= 1e-6))
    && indices.slice(1).every((index, j) => s1(at(arrivalTimes[j]))?.cascadeAlpha[index] < .01),
  arrivals.map(({ t, unit, row }) => ({ t, unit, alpha: row && s1(row)?.cascadeAlpha })))
  const outputA = at(56), outputB = at(56.6)
  const preRestore = rows.filter(r => r.requestedTime >= 40.2 && r.requestedTime < 57)
  const restored = at(58)
  const outputEvidence = ['forward', 'reverse'].map(direction => {
    const samples = result.samples.filter(r => r.kind === 'time' && r.direction === direction && [56, 56.6].includes(r.requestedTime))
      .sort((a, b) => a.requestedTime - b.requestedTime)
    return { direction, samples: samples.map(r => ({ requested: r.requestedTime, actual: r.world.inspection.subjectTime,
      outputRotation: s1(r)?.cascadeRotZ[6], pixels: r.pixels?.output,
      exterior: r.world.isolation.occurrences.filter(o => !o.studyOwned) })),
      rotationDelta: samples.length === 2 ? s1(samples[1])?.cascadeRotZ[6] - s1(samples[0])?.cascadeRotZ[6] : null }
  })
  check(result, 'R1 output-specific pixels and actual rotation precede exterior restoration in both scroll directions', outputA && outputB && restored
    && outputEvidence.every(e => e.samples.length === 2 && Number.isFinite(e.rotationDelta) && Math.abs(e.rotationDelta) > 1e-5
      && e.samples.every(r => r.actual < 57 && outputPixels(r.pixels) && r.exterior.length > 0
        && r.exterior.every(o => !o.visible && o.applied.every(m => m.opacity < .001))))
    && preRestore.every(r => r.world.isolation.occurrences.filter(o => !o.studyOwned).every(o => o.applied.every(m => m.opacity < .001)))
    && restored.world.isolation.occurrences.some(o => !o.studyOwned && o.visible && o.applied.some(m => m.opacity > .1)),
  { outputEvidence, restoredProgress: restored?.world.progress, minimumOutputPixelsExclusive: 8,
    method: "visibilityCapture('output', true), actual unit-6 rotation; whole drivetrain pixels excluded from this gate" })
  const orbit = continuation.filter(r => r.requestedTime <= 48.2).map(row => ({ t: row.requestedTime, ...localCamera(row, THREE) }))
  const angles = orbit.map(c => Math.atan2(c.position[2] - c.target[2], c.position[0] - c.target[0]))
  const increments = angles.slice(1).map((b, i) => delta(angles[i], b))
  const travel = increments.reduce((a, b) => a + b, 0)
  const standOff = orbit.map(c => norm(sub(c.position, c.target)))
  check(result, 'R1 signed CCW close orbit continues about 180 degrees without pullback', orbit.length >= 20
    && increments.every(d => d >= -.002) && travel > 150 * Math.PI / 180 && travel < 215 * Math.PI / 180
    && Math.max(...standOff) / Math.min(...standOff) < 1.12,
  { orbit, signedTravelDegrees: travel * 180 / Math.PI, minimumIncrement: Math.min(...increments), standOff })
  const dolly = continuation.filter(r => r.requestedTime >= 48.2 && r.requestedTime <= 56.6).map(row => ({ t: row.requestedTime, ...localCamera(row, THREE) }))
  const start = dolly[0] ?? { position: [0, 0, 0], fov: NaN }, end = dolly.at(-1) ?? start
  const line = sub(end.position, start.position), length = norm(line), direction = line.map(v => v / (length || 1))
  const offsets = dolly.map(c => { const v = sub(c.position, start.position), distance = dot(v, direction); return norm(sub(v, direction.map(d => d * distance))) })
  const offAxis = dolly.map(c => { const view = sub(c.position, c.target); return Math.acos(Math.min(1, Math.abs(view[1]) / norm(view))) * 180 / Math.PI })
  check(result, 'R1 straight off-axis dolly advances toward output with stable lens', dolly.length >= 25 && length > .03
    && direction[1] < -.98 && Math.max(...offsets) < .0001 && offAxis.every(a => a >= 5 && a <= 35)
    && dolly.every((c, i) => i === 0 || c.target[1] <= dolly[i - 1].target[1] + 1e-5)
    && dolly.every(c => near(c.fov, start.fov, .01)), { dolly, lineLength: length, lineDirection: direction, maximumLineError: Math.max(...offsets), offAxisDegrees: offAxis })
  const occupied = continuation.filter(r => r.requestedTime >= 41.8 && r.requestedTime <= 56.6 && r.pixels?.drivetrain)
  check(result, 'R1 actual rendered drivetrain fills useful composition', occupied.length >= 10
    && occupied.every(r => visiblePixels(r.pixels.drivetrain, 64) && pixelSpan(r.pixels.drivetrain) >= .5 && r.pixels.drivetrain.union.fraction >= .01),
  occupied.map(r => ({ t: r.requestedTime, pixels: r.pixels.drivetrain.union, span: pixelSpan(r.pixels.drivetrain) })))
  const preserved = rows.filter(r => r.requestedTime <= 40.2)
  const old = historical?.cases?.find(c => c.name === result.layout)?.samples
  const comparisons = preserved.flatMap(row => {
    const baseline = old?.find(s => s.requestedTime === row.requestedTime)
    if (!baseline) return []
    const keys = ['sunRotZ', 'carrierRotZ', 'planetRotZ', 'slideProgress', 'cascadeAlpha', 'housingGhostAlpha',
      'datumPulseAlpha', 'contactGlintYmm', 'contactGlintMix', 'housingWitnessAlpha']
    const differences = keys.map(key => numericDifference(s1(row)?.[key], baseline.stage1?.[key]))
    // Revised downstream units have no entrance slide; their old hidden parking offsets
    // were explicitly superseded. Stage 1 seating remains part of preserved behavior.
    differences.push(numericDifference(s1(row)?.cascadeOffsetZ[0], baseline.stage1?.cascadeOffsetZ[0]))
    differences.push(numericDifference(s1(row)?.cascadeRotZ[0], baseline.stage1?.cascadeRotZ[0]))
    return [{ t: row.requestedTime, maximumDelta: Math.max(...differences), baselineTime: baseline.subjectTime,
      sourceTimeError: Math.abs(row.world.inspection.subjectTime - baseline.subjectTime),
      cameraPositionDelta: baseline.camera?.position ? norm(sub(row.world.camera.position, baseline.camera.position)) : null,
      cameraLensDelta: baseline.camera ? Math.abs(row.world.camera.fov - baseline.camera.fov) : null }]
  })
  check(result, 'Preserve engagement mechanics through 40.2 seconds against prior runtime evidence', comparisons.length >= 5
    && comparisons.some(c => c.t === 40.2) && comparisons.every(c => c.maximumDelta <= .03),
  { baseline: 'output/playwright/stage1-cascade/report.json', comparisons, tolerance: .03,
    note: 'Visible mechanics, Stage 1 seating, witness/glint preserved. Hidden downstream parking offsets and angles are superseded by the new cascade ratios; Stage 1 angle is still compared. Historical report has no camera registration matrix; camera deltas cannot establish local-camera preservation. Parent owns static preservation checks.' })
  const rolling = rows.filter(r => r.requestedTime >= 38.8)
  check(result, 'Applied private subject/camera clocks agree and canvas frames advance', rows.length > 50
    && rows.every(r => r.mode === 'live' && r.canvases > 0 && !r.world.journey.pending
      && near(r.world.inspection.cameraTime, r.world.inspection.subjectTime, .025)
      && Math.abs(r.world.progress - r.requestedProgress) <= .00005)
    && rows.at(-1).world.frames > rows[0].world.frames,
  rows.map(r => ({ requested: r.requestedTime, subject: r.world.inspection.subjectTime, camera: r.world.inspection.cameraTime, quantization: r.quantization })))
  check(result, 'Preserved input 5.2:1:-3.5 conjugacy and clean contact telemetry', rolling.length > 5 && rolling.every(r => {
    const s = s1(r)
    return s.gearMeshClean && s.meshPhaseError < 1e-4 && near(s.planetRotZ, -3.5 * s.carrierRotZ, 1e-4)
  }) && rolling.slice(1).every((b, i) => near(s1(b).sunRotZ - s1(rolling[i]).sunRotZ, 5.2 * (s1(b).carrierRotZ - s1(rolling[i]).carrierRotZ), 1e-4)),
  rolling.map(r => ({ t: r.requestedTime, phaseError: s1(r)?.meshPhaseError })))
}

function pageChecks(result) {
  const forward = result.samples.filter(s => s.kind === 'page' && s.direction === 'forward')
  const subset = (a, b) => forward.filter(r => r.requestedProgress >= a && r.requestedProgress <= b)
  const fades = subset(.46, .4725).concat(subset(.4945, .505), subset(.585, .600))
  const problems = fades.flatMap(r => depthIssues(r.world.isolation?.occurrences).map(issue => ({ p: r.world.progress, ...issue })))
  const alphaProblems = fades.flatMap(r => r.world.isolation.occurrences.flatMap(o => o.applied.flatMap((m, i) =>
    near(m.opacity, o.source[i]?.opacity * r.world.isolation.surroundingsOpacity, 1e-6) ? []
      : [{ p: r.world.progress, uuid: o.uuid, slot: i, applied: m.opacity, source: o.source[i]?.opacity, context: r.world.isolation.surroundingsOpacity }])))
  const census = fades.map(r => ({ p: r.world.progress, ids: r.world.isolation.occurrences.map(o => o.uuid).sort() }))
  const referenceIds = census[0]?.ids
  check(result, 'F1/F3 complete stable occurrence census and no half-alpha depth switches', fades.length > 30
    && problems.length === 0 && alphaProblems.length === 0 && census.every(r => numericDifference(r.ids, referenceIds) === 0), { census, problems, alphaProblems })
  namedFadeChecks(result)
  const ring = subset(.481, .505)
  check(result, 'F2 real ring contribution remains visible through completion/tool exit/recovery', ring.length >= 30 && ring.every(r => {
    const c = r.pixels?.ring, bounds = r.world.ring.projectedBounds
    if (!visiblePixels(c, 32) || pixelSpan(c) < .15 || !bounds || bounds.behind || !finiteRect(bounds.rect)) return false
    const [x0, y0, x1, y1] = bounds.rect, [w, h] = bounds.viewport
    // At close knurl the composition may intentionally crop the ring. Recovery must contain it.
    return x1 > 0 && y1 > 0 && x0 < w && y0 < h && (r.requestedProgress < .4945 || (x0 >= -2 && y0 >= -2 && x1 <= w + 2 && y1 <= h + 2))
  }), ring.map(r => ({ p: r.world.progress, bounds: r.world.ring.projectedBounds, pixels: r.pixels?.ring?.union, span: pixelSpan(r.pixels?.ring) })))
  const f4 = subset(.590, .596)
  const motion = f4.slice(1).map((b, i) => {
    const a = f4[i], translation = norm(sub(b.world.camera.position, a.world.camera.position))
    const av = sub(a.world.camera.position, a.world.camera.target), bv = sub(b.world.camera.position, b.world.camera.target)
    const angular = Math.acos(Math.max(-1, Math.min(1, dot(av, bv) / (norm(av) * norm(bv)))))
    const effectivePixels = Math.max(translation / norm(av) * result.viewport.height / (2 * Math.tan(a.world.camera.fov * Math.PI / 360)), angular * result.viewport.height / (a.world.camera.fov * Math.PI / 180))
    return { from: a.world.progress, to: b.world.progress, translation, angular, effectivePixels }
  })
  const end = subset(.600, .600)[0]
  check(result, 'F4 interior .590-.596 visibly moves and fade finishes at .600', motion.length >= 6
    && motion.every(m => m.translation > .00001 && m.effectivePixels >= .25) && end
    && end.world.isolation.surroundingsOpacity < .001 && end.world.isolation.occurrences.every(o => o.applied.every(m => m.opacity < .001)),
  { motion, fadeEnd: end?.world.isolation })
  const ownership = subset(.815, .850)
  check(result, 'R1 source internals/private context have one owner through .845 swap', ownership.length >= 30
    && ownership.every(r => {
      const owned = r.world.isolation.occurrences.filter(o => o.studyOwned)
      const isPrivate = r.world.progress < .845
      return owned.length > 0 && (isPrivate ? owned.every(o => !o.visible && o.applied.every(m => m.opacity <= .001))
        && r.world.journey.studyVisible && r.world.journey.studyGearboxVisible && r.world.journey.contextOpacity >= .999
        : !r.world.journey.studyVisible && !r.world.journey.studyGearboxVisible && owned.some(o => o.visible))
        && !(r.world.journey.sourceShaftVisible && r.world.journey.studyShaftVisible)
    }), ownership.map(r => ({ p: r.world.progress, journey: r.world.journey,
      owned: r.world.isolation.occurrences.filter(o => o.studyOwned) })))
  const privateOwnership = ownership.filter(r => r.world.progress < .845)
  const supportCensus = privateOwnership.map(r => ({ p: r.world.progress,
    // Read source occurrence provenance, never infer identity from its screen
    // position. This accepts explicit part/parts/ancestor provenance fields.
    supports: r.world.isolation.occurrences.filter(o => /K00021[01]/.test(JSON.stringify(o))),
    privateSupports: r.world.inspection.runtime?.shaft?.supports }))
  check(result, 'R1 K000210/K000211 source supports remain private-owned until .845', supportCensus.length >= 20
    && supportCensus.every(r => ['K000210', 'K000211'].every(part => r.supports.some(o => JSON.stringify(o).includes(part)))
      && r.supports.every(o => o.studyOwned === true && o.visible === false && o.applied.every(m => m.opacity <= .001))),
  { source: supportCensus, policy: 'Both source support identities must be attested; missing provenance fails closed.' })
  const exteriorDepthFaults = privateOwnership.flatMap(r => r.world.isolation.occurrences.filter(o => !o.studyOwned)
    .flatMap(o => o.applied.flatMap((m, slot) => m.depthWrite || (m.opacity > .001 && !m.transparent)
      ? [{ p: r.world.progress, uuid: o.uuid, name: o.name, parent: o.parent, slot, material: m }] : [])))
  check(result, 'R1 returning source exterior stays transparent without depth writes until .845', privateOwnership.length >= 20
    && exteriorDepthFaults.length === 0, { sampledProgress: privateOwnership.map(r => r.world.progress), faults: exteriorDepthFaults })
  const measuredSupports = ownership.filter(r => r.requestedProgress >= .825).map(r => ({ p: r.world.progress,
    requested: r.requestedProgress, ...supportMeasurement(r.world.journey.supportHandoff) }))
  const lastPrivate = measuredSupports.find(r => r.requested === .8449), atSwap = measuredSupports.find(r => r.requested === .845),
    afterSwap = measuredSupports.find(r => r.requested === .8451), startSupport = measuredSupports.find(r => r.requested === .825)
  check(result, 'R1 measured support centroids converge before .845 and match at source swap', measuredSupports.length >= 20
    && measuredSupports.every(r => r.valid) && lastPrivate && atSwap && afterSwap && startSupport
    && lastPrivate.measuredDistance <= .00002 && atSwap.measuredDistance <= .000001 && afterSwap.measuredDistance <= .000001
    && lastPrivate.measuredDistance <= Math.max(.000001, startSupport.measuredDistance * .01),
  { measurements: measuredSupports, tolerancesMetres: { beforeSwap: .00002, atSwap: .000001 }, frame: 'Actual vertices in registered study frame' })
  check(result, 'R1 source/private support vertex dimensions agree', measuredSupports.length >= 20
    && measuredSupports.every(r => r.valid && r.sizeMatches),
  { measurements: measuredSupports, tolerance: 'Per axis: max(0.1 mm, 1% of source size); reported in study metres.' })
  const sourcePixelRows = ownership.filter(r => r.world.progress < .845 && r.pixels?.surroundings)
  const supportPixels = sourcePixelRows.map(r => {
    const ids = new Set(r.world.isolation.occurrences.filter(o => o.part === 'K000210' || o.part === 'K000211').map(o => o.uuid))
    return { p: r.world.progress, expectedOccurrences: ids.size,
      measured: r.pixels.surroundings.occurrences.filter(o => ids.has(o.uuid)) }
  })
  check(result, 'R1 actual source support pixel contribution is zero while private study owns pair', supportPixels.length >= 4
    && supportPixels.every(r => r.expectedOccurrences === 2 && r.measured.length === 2 && r.measured.every(o => o.pixels === 0)),
  { samples: supportPixels, note: 'Individual beauty A/B, matched by source mesh UUID; root visibility and centroid handoff checked separately.' })
  const recovery = subset(.826, .844)
  const steps = recovery.slice(1).map((b, i) => norm(sub(b.world.camera.position, recovery[i].world.camera.position)))
  check(result, 'R1 camera recovery moves across .825-.845 without a new hold', steps.length > 10 && steps.every(d => d > .000001), { steps })
  const pacing = pacingEvidence(result.pacing)
  check(result, 'R1 native continuation travel increased by x16', pacing?.actualRange > 0 && pacing.baselineRange > 0
    && near(pacing.addedAverage, 15, .02), pacing)
}

async function sequential(page, result, name, from, to, milliseconds) {
  await seek(page, from)
  const frames = await page.evaluate(async ({ from, to, milliseconds }) => {
    const frames = [], start = performance.now()
    return await new Promise(resolve => {
      const tick = now => {
        const u = Math.min(1, (now - start) / milliseconds), requested = from + (to - from) * u
        window.scrollTo({ top: window.__torqueNarrative.scrollFraction(requested) * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' })
        const w = window.__torqueWorld.snapshot()
        frames.push({ wallTime: now, requested, progress: w.progress, frames: w.frames, camera: w.camera,
          isolation: w.isolation, housing: { commanded: w.mechanical.channels.ghostOpacity, applied: w.mechanical.ghostMaterials }, ring: w.ring.projectedBounds, journey: { studyVisible: w.journey.studyVisible,
            contextOpacity: w.journey.contextOpacity, phase: w.journey.phase, supportHandoff: w.journey.supportHandoff }, stage1: w.inspection.runtime?.shaft?.stage1 })
        if (u < 1) requestAnimationFrame(tick)
        else resolve(frames)
      }
      requestAnimationFrame(tick)
    })
  }, { from, to, milliseconds })
  const filename = `${result.name}/${name}-frames.json`
  writeFileSync(path.join(out, filename), JSON.stringify(frames) + '\n')
  const settled = await seek(page, to)
  await screenshot(page, result, `${name}-end`, settled)
  const progressing = frames.slice(1).filter((r, i) => Math.abs(r.progress - frames[i].progress) > 1e-7)
  const depthFaults = frames.flatMap(r => depthIssues(r.isolation.occurrences).map(issue => ({ p: r.progress, ...issue })))
  const housingFaults = name.startsWith('housing-') ? frames.filter(r => r.housing.commanded !== 1
    || r.housing.applied.length !== 1 || r.housing.applied.some(m => m.effectiveOpacity !== 1 || !m.applied.length || m.applied.some(a => a.opacity !== 1 || !a.depthWrite))) : []
  result.sequences.push({ name, from, to, filename, frames: frames.length, progressingFrames: progressing.length,
    maximumFrameGapMs: Math.max(...frames.slice(1).map((r, i) => r.wallTime - frames[i].wallTime)), depthFaults, housingFaults,
    pass: frames.length >= 30 && progressing.length >= 20 && depthFaults.length === 0 && housingFaults.length === 0 })
}

async function runLive(result, clock, THREE, historical, browser) {
  let context, page
  const buildReads = []
  let evaluated = false
  activeClock = clock; activeAspect = result.viewport.width / result.viewport.height
  try {
    mkdirSync(path.join(out, result.name), { recursive: true })
    context = await browser.newContext({ viewport: result.viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference',
      serviceWorkers: 'block', recordVideo: { dir: path.join(out, result.name, 'video'), size: result.viewport } })
    await context.addInitScript(() => {
      window.__ownerVerificationLosses = []
      document.addEventListener('webglcontextlost', e => window.__ownerVerificationLosses.push({ at: performance.now(), message: e.statusMessage }), true)
    })
    page = await context.newPage()
    page.on('pageerror', e => result.errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()) })
    page.on('response', r => { if (r.status() >= 400) result.errors.push(`HTTP ${r.status()} ${r.url()}`) })
    result.sceneBuilds = []
    page.on('response', response => {
      const url = new URL(response.url())
      if (url.origin !== base.origin || !/\/Scene-[^/]+\.js$/.test(url.pathname)) return
      buildReads.push((async () => {
        try {
          const bytes = await response.body(), local = readFileSync(path.join(root, 'dist', '.' + decodeURIComponent(url.pathname)))
          result.sceneBuilds.push({ chunk: path.posix.basename(url.pathname), servedSha256: sha(bytes), localSha256: sha(local), matches: sha(bytes) === sha(local) })
        } catch (error) { result.errors.push(`Scene build identity: ${error}`) }
      })())
    })
    const url = new URL(base); url.searchParams.set('quality', result.tier)
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForFunction(() => {
      const w = window.__torqueWorld?.snapshot?.()
      return w?.ready && w.sheet?.baked && w.sheet.stats?.annotationsReady === 1 && w.sheet.stats?.shaderWarmReady === 1
        && window.__torqueNarrative?.scrollFraction && document.querySelector('canvas')
    }, null, { timeout: 180000, polling: 500 })
    result.ready = await readWorld(page)
    check(result, 'Production canvas baked/warm and requested tier rendered', result.ready.mode === 'live'
      && result.ready.world.sheet.tier === result.tier && result.ready.canvases > 0, result.ready)
    result.pacing = await page.evaluate(() => {
      const p = window.__torqueNarrative.pacing()
      return { ...p, continuationNativePixels: (window.__torqueNarrative.scrollFraction(.825) - window.__torqueNarrative.scrollFraction(.815)) * p.actualRange }
    })
    const pages = options.refinement ? unique([.825, .826, .830, .840, .8449, .845, .8451, ...housingPages])
      : unique([...range(.46, .4725, .0005), ...range(.481, .505, .0005), ...range(.585, .600, .0005),
        ...range(.815, .850, .001), .8449, .8451, ...housingPages])
    const times = unique([35, 35.4, 37, 38.25, 38.5, 38.8, 39, 39.4, 39.8, 40, 40.2,
      ...range(40.2, 58, .2), ...revealTimes, 41.8, 42.2, 42.4, 43, 44.4, 45, 47.6, 49, 50.6, 53.6, 56, 56.6, 57, 58])
    const aspect = result.viewport.width / result.viewport.height
    const checkpoints = [...pages.map(p => ({ kind: 'page', p })), ...times.map(t => ({ kind: 'time', p: pageAt(t, aspect, clock), t }))].sort((a, b) => a.p - b.p)
    const individualPages = new Set([.462, .466, .470, .496, .500, .504, .590, .594, .598, .824, .825, .830, .840, .8449, .845, .8451])
    const timePixels = new Set([40.2, ...revealTimes, 41.8, 42.2, 42.4, 43, 44.4, 45, 46, 47.6, 49, 50.6, 52, 53.6, 55, 56, 56.6, 58])
    for (const direction of ['forward', 'reverse']) {
      const ordered = direction === 'forward' ? checkpoints : [...checkpoints].reverse()
      let count = 0
      for (const item of ordered) {
        const sample = await seek(page, item.p, item.t ?? null)
        Object.assign(sample, { kind: item.kind, direction, pixels: {} })
        if (item.kind === 'page' && item.p >= .481 && item.p <= .505) sample.pixels.ring = await capture(page, 'ring')
        if (item.kind === 'page' && individualPages.has(item.p)) sample.pixels.surroundings = await capture(page, 'surroundings', true)
        if (item.kind === 'page' && fadeControlPages.includes(item.p)) sample.pixels.fadeOccurrences = await capture(page, 'fadeOccurrences', true)
        if (item.kind === 'page' && [.865, .90, .94, .98].includes(item.p)) sample.pixels.mainHousing = await capture(page, 'mainHousing', true)
        if (item.kind === 'time' && timePixels.has(item.t)) {
          sample.pixels.drivetrain = await capture(page, 'drivetrain')
          if ([56, 56.6].includes(item.t)) sample.pixels.output = await capture(page, 'output', true)
          sample.projection = await page.evaluate(() => window.__torqueWorld.inspection())
          if (item.t === 44.4) sample.pixels.stage2 = await capture(page, 'stage2', true)
          for (const event of revealEvents) if ([event.full, event.cageStart, event.cageFull].includes(item.t)) sample.pixels[units[event.index]] = await capture(page, units[event.index], true)
          if ([42.4, 45, 49, 53.6, 56, 56.6].includes(item.t)) {
            sample.domClearance = await measureDomClearance(page, sample.pixels.output ?? sample.pixels.stage2 ?? sample.pixels.drivetrain)
          }
        }
        result.samples.push(sample)
        if ((item.kind === 'time' && [39.4, 42.4, 44.4, 49, 53.6, 56.6, 58, ...revealTimes].includes(item.t))
          || (item.kind === 'page' && [.466, .4905, .4945, .500, .594, .600, .8449, .8451].includes(item.p))) {
          await screenshot(page, result, `${direction}-${item.kind}-${String(item.t ?? item.p).replace('.', 'p')}`, sample)
        }
        if (++count % 25 === 0) { console.log(`${result.name} ${direction} ${count}/${ordered.length}: applied p=${sample.world.progress.toFixed(6)} t=${sample.world.inspection.subjectTime.toFixed(3)}`); save() }
      }
    }
    // Compare effective material state AND applied mechanics, excluding passive camera wall-time.
    const baseline = result.samples.filter(s => s.direction === 'forward')
    for (const reverse of result.samples.filter(s => s.direction === 'reverse')) {
      const original = baseline.find(s => s.kind === reverse.kind && s.requestedProgress === reverse.requestedProgress)
      result.replay.push({ kind: reverse.kind, p: reverse.requestedProgress,
        materialDelta: numericDifference(fadeFingerprint(original), fadeFingerprint(reverse)),
        mechanicalDelta: reverse.kind === 'time' ? numericDifference(mechanicalFingerprint(original), mechanicalFingerprint(reverse)) : 0 })
    }
    const shuffleP = options.refinement ? [.8451, .825, .8449, .830, .826, .98, .86, .93, .865] : [.8451, .4905, .819, .466, .8449, .594, .824, .500]
    for (const p of shuffleP) {
      const original = baseline.find(s => s.kind === 'page' && s.requestedProgress === p)
      const current = await seek(page, p)
      result.replay.push({ kind: 'shuffle', p, materialDelta: original ? numericDifference(fadeFingerprint(original), fadeFingerprint(current)) : Infinity,
        mechanicalDelta: p >= .815 && p <= .825 && original ? numericDifference(mechanicalFingerprint(original), mechanicalFingerprint(current)) : 0 })
    }
    check(result, 'Forward/reverse/shuffle reproduce effective applied material and mechanical state', result.replay.length >= checkpoints.length
      && result.replay.every(r => r.materialDelta <= .002 && r.mechanicalDelta <= .002), result.replay)
    stageChecks(result, THREE, historical)
    if (!options.refinement) pageChecks(result)
    else {
      const handoff = result.samples.filter(s => s.kind === 'page')
      check(result, '54 gear contact remains conjugate through the source handoff', handoff.every(r =>
        r.world.progress >= .845 || (s1(r)?.meshPhaseError < 1e-4 && Math.abs(s1(r).planetRotZ + 3.5 * s1(r).carrierRotZ) < 1e-4)),
      handoff.map(r => ({ p: r.world.progress, stage1: s1(r), exterior: r.world.isolation.surroundingsOpacity })))
    }
    const housingRows = result.samples.filter(row => row.kind === 'page' && housingPages.includes(row.requestedProgress))
    check(result, '56 main P000245 housing is opaque with depth writes throughout explosion and return in both directions',
      housingRows.length === housingPages.length * 2 && housingRows.every(row => row.world.rig.ghostCount === 1
        && near(row.world.rig.ghostOpacity, 1, 1e-8) && near(row.world.mechanical.channels.ghostOpacity, 1, 1e-8)
        && row.world.mechanical.ghostMaterials.length === 1 && row.world.mechanical.ghostMaterials.every(m => m.effectiveOpacity === 1
          && m.applied.length > 0 && m.applied.every(a => a.opacity === 1 && a.depthWrite)))
        && housingRows.filter(row => row.pixels.mainHousing).length === 8
        && housingRows.filter(row => row.pixels.mainHousing).every(row => visiblePixels(row.pixels.mainHousing)
          && row.pixels.mainHousing.occurrences.some(o => row.world.mechanical.ghostMaterials.some(m => m.uuid === o.uuid) && o.pixels > 0)),
      housingRows.map(row => ({ p: row.world.progress, direction: row.direction, rig: row.world.rig, mechanical: row.world.mechanical })))
    const clearance = result.samples.filter(sample => sample.domClearance)
    check(result, 'Active rendered drivetrain clears measured HUD and controls by 8 px', clearance.length >= 12 && clearance.every(sample => sample.domClearance.pass),
      clearance.map(sample => ({ time: sample.requestedTime, direction: sample.direction, ...sample.domClearance })))
    evaluated = true
    result.gatesEvaluatedAt = new Date().toISOString()
    save()
    for (const g of result.checks.filter(g => !g.pass)) console.log(`FAIL ${result.name}: ${g.name}`)
    console.log(`${result.name} settled gates: ${result.checks.filter(g => g.pass).length}/${result.checks.length} pass`)
    if (options.failFast && result.checks.some(g => !g.pass)) {
      result.sequencesSkipped = 'Settled gate failure: preserve observed evidence and report before continuous captures or further viewports.'
      return
    }
    const sequences = options.refinement
      ? [['r1-forward', .815, .8451, 20000], ['r1-reverse', .8451, .815, 20000],
        ['housing-forward', .855, .98, 10000], ['housing-reverse', .98, .855, 10000]]
      : [['ring-forward', .481, .505, 7000], ['ring-reverse', .505, .481, 7000],
      ['fade-forward', .46, .4725, 5000], ['fade-reverse', .4725, .46, 5000],
      ['restore-forward', .4945, .505, 5000], ['restore-reverse', .505, .4945, 5000],
      ['r1-forward', .815, .8451, 12000], ['r1-reverse', .8451, .815, 12000],
      ['f4-forward', .585, .605, 6000], ['f4-reverse', .605, .585, 6000],
      ['housing-forward', .855, .98, 10000], ['housing-reverse', .98, .855, 10000]]
    for (const [name, a, b, ms] of sequences) {
      await sequential(page, result, name, a, b, ms)
      console.log(`${result.name} continuous ${name}: ${result.sequences.at(-1).frames} frames`)
      save()
    }
    check(result, 'Continuous sequential forward and reverse frame evidence for the declared scope', result.sequences.length === sequences.length
      && result.sequences.every(s => s.pass), result.sequences)
    result.contextLosses = await page.evaluate(() => window.__ownerVerificationLosses)
  } catch (error) { result.failure = error.stack ?? String(error); if (error.seekEvidence) result.failedSeek = error.seekEvidence }
  finally {
    await Promise.allSettled(buildReads)
    if (!evaluated && result.samples.length) {
      for (const evaluate of options.refinement ? [() => stageChecks(result, THREE, historical)] : [() => stageChecks(result, THREE, historical), () => pageChecks(result)]) {
        try { evaluate() } catch (error) { check(result, 'Unavailable evidence after case abort', false, String(error)) }
      }
      result.gatesEvaluatedAt = new Date().toISOString()
      save()
      for (const g of result.checks.filter(g => !g.pass)) console.log(`FAIL ${result.name}: ${g.name}`)
      console.log(`${result.name} partial settled gates: ${result.checks.filter(g => g.pass).length}/${result.checks.length} pass`)
    }
    try {
      if (page && !page.isClosed()) {
        result.contextLosses = await page.evaluate(() => window.__ownerVerificationLosses ?? [])
        result.video = path.relative(out, await page.video().path())
      }
      await context?.close()
    } catch (error) { result.errors.push(`Cleanup/video: ${error}`) }
    check(result, 'Zero browser/HTTP/WebGL errors', result.errors.length === 0 && result.contextLosses?.length === 0,
      { errors: result.errors, contextLosses: result.contextLosses })
    check(result, 'Actual loaded Scene chunk matches production build', result.sceneBuilds?.length > 0
      && result.sceneBuilds.every(s => s.matches), result.sceneBuilds)
    check(result, 'No case abort; continuous video saved', !result.failure && result.video && existsSync(path.join(out, result.video)),
    { errors: result.errors, contextLosses: result.contextLosses, video: result.video, failure: result.failure })
    result.pass = !result.failure && result.checks.length >= (options.refinement ? 12 : 15) && result.checks.every(c => c.pass)
    save()
    console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}: ${result.checks.filter(c => c.pass).length}/${result.checks.length} checks`)
  }
}

async function runReduced(result, browser) {
  let context
  try {
    mkdirSync(path.join(out, result.name), { recursive: true })
    context = await browser.newContext({ viewport: result.viewport, reducedMotion: 'reduce', serviceWorkers: 'block' })
    const page = await context.newPage(), cad = []
    page.on('pageerror', e => result.errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()) })
    page.on('request', r => { if (/\.(glb|gltf)(?:\?|$)/i.test(r.url())) cad.push(r.url()) })
    const url = new URL(base); url.searchParams.set('quality', 'full')
    await page.goto(url.href, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForFunction(() => document.querySelector('.torque-page')?.dataset.torqueMode === 'static', null, { timeout: 30000 })
    await page.getByRole('button', { name: 'Open cutter inspection details', exact: true }).click()
    result.transcript = await page.locator('#torque-inspection-detail').innerText()
    // Decode the actual route's picture images, including shaft stills if the
    // static story is mounted. Lazy offscreen images need a real load trigger;
    // neither an empty selector nor image.complete alone establishes success.
    result.staticImageDecode = await page.evaluate(async () => {
      const images = [...document.querySelectorAll('.torque-page picture img, [data-static-shaft-story] picture img')]
      return await Promise.all(images.map(async img => {
        img.loading = 'eager'
        let decoded = false, error = null
        try {
          await Promise.race([img.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Image decode timeout')), 15000))])
          decoded = true
        } catch (failure) { error = String(failure) }
        return { src: img.getAttribute('src'), currentSrc: img.currentSrc, decoded, complete: img.complete,
          width: img.naturalWidth, height: img.naturalHeight, error }
      }))
    })
    for (const p of [.46, .4945, .594, .819, .845]) {
      await page.evaluate(p => window.scrollTo({ top: p * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }), p)
      await page.waitForTimeout(150)
      const state = await page.evaluate(() => ({ reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        mode: document.querySelector('.torque-page')?.dataset.torqueMode, canvases: document.querySelectorAll('canvas').length,
        chapters: document.querySelectorAll('[data-torque-chapter]').length, story: !!document.querySelector('#torque-story'),
        placeholders: [...document.querySelectorAll('[data-torque-poster-pending]')].map(e => ({ chapter: e.dataset.torquePoster, pending: e.dataset.torquePosterPending })),
        images: [...document.querySelectorAll('.torque-page picture img, [data-static-shaft-story] picture img')]
          .map(i => ({ src: i.currentSrc, complete: i.complete, width: i.naturalWidth, height: i.naturalHeight })) }))
      result.samples.push({ p, ...state })
      const bytes = await page.screenshot({ path: path.join(out, result.name, `${p}.png`) })
      result.screenshots.push({ p, sha256: sha(bytes), filename: `${result.name}/${p}.png` })
    }
    check(result, 'Reduced motion retains five-chapter static story without CAD/canvas', result.samples.length === 5
      && result.samples.every(s => s.reduced && s.mode === 'static' && s.canvases === 0 && s.chapters === 5 && s.story)
      && cad.length === 0, { samples: result.samples, cadRequests: cad })
    const expectedChapters = ['breakthrough', 'close', 'drafting', 'inspection', 'mechanism']
    const placeholderContract = result.staticImageDecode.length === 0 && result.samples.every(s => s.images.length === 0
      && s.placeholders.length === 5 && s.placeholders.every(p => p.pending === 'stage-6')
      && JSON.stringify(s.placeholders.map(p => p.chapter).sort()) === JSON.stringify(expectedChapters))
    const imageContract = result.staticImageDecode.length > 0 && result.staticImageDecode.every(i => i.decoded && i.complete && i.width > 0 && i.height > 0)
      && result.samples.every(s => s.images.length > 0 && s.images.every(i => i.complete && i.width > 0 && i.height > 0))
    check(result, 'Reduced motion honours declared poster assets or five explicit pending placeholders', result.errors.length === 0 && (placeholderContract || imageContract),
    { errors: result.errors, decoded: result.staticImageDecode, placeholders: result.samples[0]?.placeholders,
      method: 'posterMap.ts deliberately has no art entries. Require all five exact Stage-6-labelled placeholders, or decode every actual picture; an unaccounted empty census fails.' })
    check(result, 'Reduced motion disclosure retains the corrected torque-path transcript', /Stage 2 planets before their spinning cage/.test(result.transcript)
      && /near-axial dolly/.test(result.transcript) && /after the output is turning/.test(result.transcript), { transcript: result.transcript })
  } catch (error) { result.failure = error.stack ?? String(error) }
  finally { await context?.close(); result.pass = !result.failure && result.checks.length === 3 && result.checks.every(c => c.pass); save() }
  console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}`)
}

async function cleanStills(browser, clock) {
  // Entire runtime roster, both asset checks, and build identity pass before either public write.
  const pending = []
  for (const layout of ['desktop', 'narrow']) {
    const result = report.cases.find(c => c.name === `${layout}-full`)
    activeClock = clock; activeAspect = result.viewport.width / result.viewport.height
    const context = await browser.newContext({ viewport: result.viewport, deviceScaleFactor: 1, serviceWorkers: 'block' })
    try {
      const page = await context.newPage()
      await page.goto(base.href, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction(() => { const w = window.__torqueWorld?.snapshot?.(); return w?.ready && w.sheet?.baked
        && w.sheet.stats?.annotationsReady === 1 && w.sheet.stats?.shaderWarmReady === 1 }, null, { timeout: 180000 })
      const time = 56.6, sample = await seek(page, pageAt(time, result.viewport.width / result.viewport.height, clock), time)
      const pixels = await capture(page, 'drivetrain'), activeOutput = await capture(page, 'output', true),
        proof = await page.evaluate(() => window.__torqueWorld.inspection())
      if (!visiblePixels(pixels, 64) || pixelSpan(pixels) < .5 || !proof.cascadeRects?.length) throw new Error(`Clean ${layout}: missing actual subject`)
      if (!outputPixels(activeOutput)) throw new Error(`Clean ${layout}: missing active output contribution`)
      const cropPixels = layout === 'narrow' ? activeOutput : pixels
      const r = cropPixels.union.rect, subject = { left: r[0] * result.viewport.width / cropPixels.width,
        top: r[1] * result.viewport.height / cropPixels.height, right: r[2] * result.viewport.width / cropPixels.width,
        bottom: r[3] * result.viewport.height / cropPixels.height }
      const aspect = layout === 'desktop' ? 1.6 : 1, quantum = layout === 'desktop' ? 8 : 1
      const padding = layout === 'narrow' ? 1.8 : 1.2
      let width = Math.ceil(Math.max((subject.right - subject.left) * padding, (subject.bottom - subject.top) * padding * aspect,
        layout === 'narrow' ? result.viewport.width * .6 : 0) / quantum) * quantum
      width = Math.min(width, Math.floor(Math.min(result.viewport.width, result.viewport.height * aspect) / quantum) * quantum)
      const height = width / aspect, x = Math.floor(Math.max(0, Math.min(result.viewport.width - width, (subject.left + subject.right - width) / 2))),
        y = Math.floor(Math.max(0, Math.min(result.viewport.height - height, (subject.top + subject.bottom - height) / 2)))
      if (subject.left < x || subject.right > x + width || subject.top < y || subject.bottom > y + height) throw new Error(`Clean ${layout}: subject cannot fit required aspect`)
      await page.addStyleTag({ content: 'body * { visibility: hidden !important; } body canvas { visibility: visible !important; }' })
      const png = await page.screenshot({ clip: { x, y, width, height }, timeout: 60000 })
      const encoded = await page.evaluate(async base64 => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob())
        try {
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height); canvas.getContext('2d').drawImage(bitmap, 0, 0)
          const blob = await canvas.convertToBlob({ type: 'image/webp', quality: .92 })
          if (blob.type !== 'image/webp') throw new Error('Not WebP')
          return Array.from(new Uint8Array(await blob.arrayBuffer()))
        } finally { bitmap.close() }
      }, png.toString('base64'))
      pending.push({ bytes: Buffer.from(encoded), path: `public/inspection/shaft/driveline-cascade-${layout}.webp`,
        uiHidden: true, aspect, clip: { x, y, width, height }, subject,
        cropBasis: layout === 'narrow' ? 'Active output beauty A/B bounds with drivetrain context; peripheral train may extend beyond square crop.' : 'Rendered drivetrain bounds',
        progress: sample.world.progress, time: sample.world.inspection.subjectTime, pixels, activeOutput, proof })
    } finally { await context.close() }
  }
  for (const still of pending) {
    writeFileSync(path.join(root, still.path), still.bytes)
    const { bytes, ...metadata } = still
    report.stills.push({ ...metadata, bytes: bytes.length, sha256: sha(bytes) })
  }
}

let browser, activeClock, activeAspect
try {
  report.assets.before = assetHashes()
  if (!Object.entries(hashes).every(([name, expected]) => report.assets.before[name] === expected)) throw new Error('Protected assets differ from doc48 baseline')
  report.production = await productionFingerprint()
  console.log(`Production: ${report.production.map(p => p.src).join(', ')}`)
  const clock = await loadClock(), THREE = await import('three')
  if (options.resume) {
    const bytes = readFileSync(options.resume), previous = JSON.parse(bytes)
    if (numericDifference(previous.production, report.production) !== 0 || previous.clock?.bundleSha256 !== report.clock.bundleSha256
      || !Object.entries(hashes).every(([name, hash]) => previous.assets?.before?.[name] === hash && previous.assets?.after?.[name] === hash)) {
      throw new Error('Cannot resume: production entry, clock or protected assets changed')
    }
    const eligible = previous.cases.filter(c => !c.name.endsWith('-reduced') && c.pass && c.checks?.length === 30
      && c.checks.every(g => g.pass) && c.samples?.length === 488 && c.sequences?.length === 10 && c.sequences.every(s => s.pass))
    if (eligible.length !== 4 || new Set(eligible.map(c => c.name)).size !== 4) throw new Error('Resume requires all four complete passing live variants')
    const sceneProofs = new Map(eligible.flatMap(c => c.sceneBuilds ?? []).map(s => [s.chunk, s]))
    if (!sceneProofs.size) throw new Error('Resume lacks Scene chunk identity')
    for (const [chunk, proof] of sceneProofs) {
      const served = Buffer.from(await (await fetch(new URL(`/assets/${chunk}`, base))).arrayBuffer())
      if (!proof.matches || sha(served) !== proof.servedSha256 || sha(readFileSync(path.join(root, 'dist/assets', chunk))) !== proof.servedSha256) throw new Error('Resumed Scene differs from the current build')
    }
    report.resumedEvidence = { report: options.resume, sha256: sha(bytes), cases: eligible.map(c => c.name),
      method: 'Reuse only completed live cases; current entry, Scene bytes, clock and protected assets revalidated. Failed reduced-motion checks are rerun with the actual placeholder contract.' }
    for (const c of eligible) {
      const evidenceBase = path.dirname(options.resume)
      for (const f of [c.video, ...c.screenshots.map(s => s.filename), ...c.sequences.map(s => s.filename)]) if (!f || !existsSync(path.join(evidenceBase, f))) throw new Error('Resumed evidence file is missing')
      report.cases.push({ ...c, evidenceBase, resumedFrom: options.resume })
    }
    save(); console.log('Revalidated and resumed four completed live variants')
  }
  let historical
  try { const bytes = readFileSync(path.join(root, 'output/playwright/stage1-cascade/report.json')); historical = JSON.parse(bytes); report.preservationBaselineSha256 = sha(bytes) }
  catch (error) { report.preservationBaselineError = String(error) }
  const { chromium } = await import('playwright')
  browser = await launchBrowser(chromium)
  for (const name of selectedCases) {
    if (report.cases.some(c => c.name === name && c.pass)) continue
    const [layout, tier] = name.split('-'), result = { name, layout, tier,
      viewport: layout === 'desktop' ? { width: 1440, height: 900 } : { width: 390, height: 844 },
      checks: [], samples: [], screenshots: [], sequences: [], replay: [], errors: [], pass: false }
    report.cases.push(result); save()
    console.log(`START ${name}`)
    if (tier === 'reduced') await runReduced(result, browser)
    else await runLive(result, clock, THREE, historical, browser)
    if (options.failFast && !result.pass) {
      report.remainingCasesNotRun = requiredCases.filter(name => !report.cases.some(c => c.name === name))
      throw new Error(`Roster stopped after ${name} failed; inspect saved checks before another production run. Public stills preserved.`)
    }
  }
  report.assets.after = assetHashes()
  report.productionAfter = await productionFingerprint()
  report.runtimePass = report.cases.length === (options.refinement ? 4 : 6) && report.cases.every(c => c.pass)
    && numericDifference(report.assets.before, report.assets.after) === 0 && numericDifference(report.production, report.productionAfter) === 0
  if (report.runtimePass && options.final) await cleanStills(browser, clock)
  else report.stillsSkipped = report.runtimePass ? 'No --final-integration flag; existing stills preserved.' : 'Runtime roster failed; existing stills preserved.'
} catch (error) { report.failures.push(error.stack ?? String(error)) }
finally {
  try { await browser?.close() } catch (error) { report.failures.push(String(error)) }
  report.assets.after = assetHashes()
  report.finishedAt = new Date().toISOString()
  report.pass = report.runtimePass && report.failures.length === 0 && (!options.final || report.stills.length === 2)
    && Object.entries(hashes).every(([name, expected]) => report.assets.after[name] === expected)
  save()
}
for (const c of report.cases) {
  for (const check of c.checks) console.log(`${check.pass ? 'PASS' : 'FAIL'} ${c.name}: ${check.name}`)
  if (c.failure) console.error(c.failure)
}
for (const error of report.failures) console.error(error)
console.log(`${report.pass ? 'PASS' : 'FAIL'} Report: ${path.join(out, 'report.json')}`)
if (!report.pass) process.exitCode = 1
