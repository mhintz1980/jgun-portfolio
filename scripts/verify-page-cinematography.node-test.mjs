import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  builtinPhysicalGates, canonicalGate, CASES, chooseWitnesses, classify, clearanceGates, compareState,
  parseArgs, primeOrder, projectWorld, replayGates, roiGate, signedMatrixRotation, sourceModule, sweepGates, makePlan,
} from './verify-page-cinematography.mjs'

const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
const camera = () => ({ position: [0, 0, 0], target: [0, 0, -1], up: [0, 1, 0], quaternion: [0, 0, 0, 1], fov: 90 })
const state = () => ({ camera: camera(), subjects: [{ name: 'shaft/a/approvedshaft', matrixWorld: identity() }],
  inspection: { subjectTime: 1, cameraTime: 2 }, ringTime: null, progress: .5, viewport: [1000, 1000], poleDot: 0,
  witnesses: [{ name: 'shaft/a/approvedshaft', kind: 'shaft', points: [[0, 0, -1]] }] })
const clone = x => structuredClone(x)
const statuses = gates => gates.map(g => g.status)
const rotation = angle => [Math.cos(angle), Math.sin(angle), 0, 0, -Math.sin(angle), Math.cos(angle), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

test('ordinary and shot endpoints representing the same progress produce only one reachable checkpoint', async () => {
  const { exports: source } = await sourceModule('src/scene/torque-wrench/bulletTime.ts')
  const plan = makePlan(source.BULLET_TIME_SHOT_SPECS)
  assert.equal(plan.points.filter(p => Math.abs(p - .815) < 1e-10).length, 1)
  for (let i = 1; i < plan.points.length; i++) assert.ok(plan.points[i] - plan.points[i-1] > 1e-12)
})

test('replay directly gates the dedicated shatter clock and moving registration, including missing or malformed channels', () => {
  const a = state(); a.shatter = { subjectTime: .86, frame: identity() }
  assert.equal(compareState(a, clone(a)).subjectError, 0)
  for (const key of ['clock', 'frame', 'missing', 'malformed']) {
    const b = clone(a)
    if (key === 'clock') b.shatter.subjectTime += 1e-4
    if (key === 'frame') b.shatter.frame[12] += 1e-4
    if (key === 'missing') delete b.shatter
    if (key === 'malformed') b.shatter.frame[0] = NaN
    assert.ok(compareState(a, b).subjectError >= 1e-5, key)
  }
})

test('aggregate cannot pass empty, incomplete or omitted evidence; failure wins', () => {
  const pass = [{ status: 'PASS' }]
  assert.equal(classify([]), 'INCOMPLETE')
  assert.equal(classify(pass), 'PASS')
  assert.equal(classify(pass, [], ['narrow-lite']), 'INCOMPLETE')
  assert.equal(classify([{ status: 'INCOMPLETE' }]), 'INCOMPLETE')
  assert.equal(classify([{ status: 'FAIL' }], [], ['omitted']), 'FAIL')
  assert.equal(classify(pass, ['browser error']), 'FAIL')
})

test('CLI selects only requested cases, accepts both value forms and rejects weakening flags', () => {
  const args = parseArgs(['--url', 'http://localhost:4173/torque-wrench/', '--out=output/playwright/__node_fixture_not_created', '--cases=desktop-full,narrow-reduced'])
  assert.deepEqual(args.cases, ['desktop-full', 'narrow-reduced'])
  assert.equal(CASES.length, 6)
  for (const tail of [['--quick'], ['--cases=desktop-full,desktop-full'], ['--cases=unknown'], ['--url=http://localhost:5199/torque-wrench/']]) {
    assert.throws(() => parseArgs(['--url=http://localhost:4173/torque-wrench/', '--out=output/playwright/__node_fixture_not_created', ...tail]))
  }
  assert.throws(() => parseArgs(['--url=http://localhost:4173/torque-wrench/', '--out=.scratch/test']))
})

test('replay compares all camera channels, installed matrix components AND both clocks', () => {
  const a = state()
  assert.deepEqual(compareState(a, clone(a)), { cameraError: 0, subjectError: 0 })
  for (const change of [s => { s.camera.position[0] += .001 }, s => { s.camera.target[1] += .001 }, s => { s.camera.up[0] += .001 }, s => { s.camera.fov += .001 }]) {
    const b = clone(a); change(b); assert.ok(compareState(a, b).cameraError > 1e-5)
  }
  const ringA = clone(a); ringA.ringTime = 8
  const ringB = clone(ringA); ringB.ringTime = 8.001
  assert.ok(compareState(ringA, ringB).subjectError > 1e-5)
  const ringGone = clone(ringA); ringGone.ringTime = null
  assert.equal(compareState(ringA, ringGone).subjectError, Infinity)
  for (const change of [s => { s.subjects[0].matrixWorld[12] += .001 }, s => { s.subjects[0].matrixWorld[0] += .001 },
    s => { s.inspection.subjectTime += .001 }, s => { s.inspection.cameraTime += .001 }]) {
    const b = clone(a); change(b); assert.ok(compareState(a, b).subjectError > 1e-5)
  }
  const b = clone(a); b.camera.quaternion = [0, 0, 0, -1]
  assert.equal(compareState(a, b).cameraError, 0)
})

test('empty, malformed, renamed or disappeared subjects never pass replay', () => {
  for (const mutate of [s => { s.subjects = [] }, s => { s.subjects[0].name = 'other' },
    s => { s.subjects[0].matrixWorld[0] = NaN }, s => { delete s.inspection.cameraTime }]) {
    const b = state(); mutate(b); assert.equal(compareState(state(), b).subjectError, Infinity)
  }
  assert.deepEqual(statuses(replayGates([], 'reverse')), ['INCOMPLETE'])
})

test('strict replay threshold, decoded hash equality and every checkpoint are required', () => {
  const record = { cameraError: 0, subjectError: 0, forwardHash: 'rgba', replayHash: 'rgba' }
  assert.deepEqual(statuses(replayGates([record], 'reverse')), ['PASS', 'PASS', 'PASS'])
  for (const key of ['cameraError', 'subjectError']) {
    assert.ok(statuses(replayGates([{ ...record, [key]: 1e-5 }], 'reverse')).includes('FAIL'))
    assert.ok(statuses(replayGates([{ ...record, [key]: NaN }], 'reverse')).includes('FAIL'))
  }
  assert.equal(replayGates([{ ...record, replayHash: 'other' }], 'reverse')[2].status, 'FAIL')
  assert.equal(replayGates([record, { ...record, subjectError: 2e-5 }], 'random')[1].status, 'FAIL')
})

test('projection consumes world metres, handles inverse rotation, aspect and behind-camera points', () => {
  const result = projectWorld(camera(), [.5, .25, -1], [1000, 500])
  assert.ok(Math.abs(result.ndc[0] - .25) < 1e-12)
  assert.ok(Math.abs(result.ndc[1] - .25) < 1e-12)
  assert.ok(projectWorld(camera(), [0, 0, 1], [1000, 1000]).depth < 0)
  const c = camera(); c.position = [10, 2, 0]; c.quaternion = [0, Math.SQRT1_2, 0, Math.SQRT1_2]
  const rotated = projectWorld(c, [9, 2, 0], [1000, 1000])
  assert.ok(Math.abs(rotated.ndc[0]) < 1e-12)
  assert.ok(Math.abs(rotated.ndc[1]) < 1e-12)
  assert.ok(Math.abs(rotated.depth - 1) < 1e-12)
})

test('machining chooses actual contact ROI while ordinary sequences retain full subject extrema', () => {
  const full = { name: 'shaft', kind: 'shaft', points: [[100, 0, -1]] }
  const contact = { name: 'shaft/tooth-groove', kind: 'contact', points: [[0, 0, -1]] }
  assert.deepEqual(chooseWitnesses([full, contact], true).witnesses, [contact])
  assert.deepEqual(chooseWitnesses([full, contact], false).witnesses, [full])
  assert.match(chooseWitnesses([full], true).scope, /fallback/)
  assert.equal(chooseWitnesses([], true).witnesses.length, 0)
  const sample = { telemetry: state(), hud: [] }; sample.telemetry.witnesses = [full, contact]
  assert.equal(clearanceGates(sample, true)[0].status, 'PASS')
  assert.equal(clearanceGates(sample, false)[0].status, 'FAIL')
})

test('shaft-only macro ROI is INCOMPLETE until actual tool vertices are present', () => {
  const sample = { telemetry: state() }
  sample.telemetry.witnesses = [{ name: 'approvedshaft/tooth-groove', kind: 'contact', points: [[0, 0, -1]] }]
  assert.equal(roiGate(sample, { id: 'hobContact' }).status, 'INCOMPLETE')
  sample.telemetry.witnesses.push({ name: 'hob-thread/tooth-groove', kind: 'contact', points: [[0, 0, -1]] })
  assert.equal(roiGate(sample, { id: 'hobContact' }).status, 'PASS')
})

test('Stage 1 requires explicit selected planetP000247 contact identity and real flank points', () => {
  const work = { name: 'shaft/approvedshaft/tooth-groove', kind: 'contact', points: [[0, 0, -1]] }
  const sample = { telemetry: state() }, shot = { id: 'stage1Ignition' }
  for (const name of ['', 'planet', 'P001836', 'P001837', 'P000247', 'unknownplanetP000247']) {
    sample.telemetry.witnesses = [work, { name, kind: 'contact', points: [[0, 0, -1]] }]
    assert.equal(roiGate(sample, shot).status, 'INCOMPLETE', name)
  }
  for (const name of ['planetP000247', 'shaft/uuid/planetP000247/tooth-groove']) {
    sample.telemetry.witnesses = [work, { name, kind: 'contact', points: [[0, 0, -1]] }]
    assert.equal(roiGate(sample, shot).status, 'PASS', name)
    assert.equal(roiGate(sample, shot).evidence.requiredToolIdentity, 'planetP000247')
  }
  for (const points of [[], [[NaN, 0, 0]], [[0, 0]]]) {
    sample.telemetry.witnesses = [work, { name: 'planetP000247', kind: 'contact', points }]
    assert.equal(roiGate(sample, shot).status, 'INCOMPLETE')
  }
  sample.telemetry.witnesses = [work, { name: 'planetP000247', kind: 'shaft', points: [[0, 0, -1]] }]
  assert.equal(roiGate(sample, shot).status, 'INCOMPLETE')
})

test('safe frame .84 and HUD 8px are strict, and missing witnesses cannot pass', () => {
  const sample = { telemetry: state(), hud: [{ left: 508, right: 520, top: 490, bottom: 510 }] }
  assert.deepEqual(statuses(clearanceGates(sample)), ['PASS', 'PASS'])
  sample.hud[0].left = 507.999
  assert.equal(clearanceGates(sample)[1].status, 'FAIL')
  sample.telemetry.witnesses[0].points[0] = [.841, 0, -1]
  assert.equal(clearanceGates(sample)[0].status, 'FAIL')
  sample.telemetry.witnesses = []
  assert.deepEqual(statuses(clearanceGates(sample)), ['INCOMPLETE', 'INCOMPLETE'])
})

test('empty or malformed HUD evidence is INCOMPLETE and never a clearance pass', () => {
  const s = state()
  s.hud = []
  Object.assign(s.telemetry ?? {}, {})
  const sample = { telemetry: s, hud: [], canvas: null }
  const gates = clearanceGates(sample, false)
  assert.equal(gates.find(g => g.name.includes('HUD')).status, 'INCOMPLETE')
  sample.hud = [{ left: 0, top: 0, right: NaN, bottom: 10 }]
  const malformed = clearanceGates(sample, false)
  assert.equal(malformed.find(g => g.name.includes('HUD')).status, 'INCOMPLETE')
})

test('matrix rotation is signed, translation independent and handles baked scale', () => {
  assert.ok(Math.abs(signedMatrixRotation(identity(), rotation(.2), [0, 0, 1]) - .2) < 1e-12)
  assert.ok(Math.abs(signedMatrixRotation(rotation(.2), identity(), [0, 0, 1]) + .2) < 1e-12)
  const a = identity(), b = rotation(.2)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { a[i * 4 + j] *= .001; b[i * 4 + j] *= .001 }
  b[12] = 8
  assert.ok(Math.abs(signedMatrixRotation(a, b, [0, 0, 1]) - .2) < 1e-12)
  assert.ok(Number.isNaN(signedMatrixRotation(a, b, [0, 0, 2])))
})

test('prime stride visits every point exactly once, or rejects degenerate rosters', () => {
  for (const n of [1, 11, 203, 1009]) assert.equal(new Set(primeOrder(n)).size, n)
  assert.throws(() => primeOrder(0))
  assert.throws(() => primeOrder(613))
})

test('shaft signed sweep uses installed local frame and actual native viewport distance', () => {
  const samples = Array.from({ length: 5 }, (_, i) => {
    const s = state(), a = i * Math.PI / 6
    s.frame = identity(); s.camera.position = [Math.cos(a), Math.sin(a), 0]; s.camera.target = [0, 0, 0]
    s.inspection.cameraTime = i
    return { telemetry: s, scrollY: i * 1000 }
  })
  const shot = { id: 'shaperContact', progressSpace: 'shaft-study', minCameraSweepDeg: 60, rampFraction: .15 }
  const gates = sweepGates(samples, shot)
  assert.equal(gates[0].status, 'PASS')
  assert.equal(gates[0].evidence.nativeViewportSpan, 4)
  assert.equal(gates[1].status, 'FAIL') // only 30deg/vp, despite adequate total sweep
  for (const s of samples) delete s.telemetry.frame
  assert.equal(sweepGates(samples, shot)[0].status, 'INCOMPLETE')
})

test('canonical target guard rejects smaller sweeps and conflated revolution/rate targets', () => {
  const specs = Object.fromEntries(Object.entries({ shatter: 355, ringSwitch: 45, shaperContact: 60, hobContact: 60, stage1Ignition: 165 })
    .map(([id, minCameraSweepDeg]) => [id, { rate: .1, rampFraction: .15, window: [.1, .2], minCameraSweepDeg }]))
  specs.ringSwitch.maxRevolutions = .15; specs.stage1Ignition.maxRevolutions = .2
  assert.equal(canonicalGate(specs).status, 'PASS')
  const weaker = clone(specs); weaker.shaperContact.minCameraSweepDeg = 24
  assert.equal(canonicalGate(weaker).status, 'FAIL')
  const wrongBudget = clone(specs); wrongBudget.ringSwitch.maxRevolutions = .1
  assert.equal(canonicalGate(wrongBudget).status, 'FAIL')
})

test('in-memory source helper imports and integrated physical gates work for current ring/shaper/hob/ignition laws', async () => {
  const sources = {}
  for (const [key, entry] of Object.entries({ contract: 'src/scene/torque-wrench/bulletTime.ts', clock: 'src/scene/torque-wrench/InspectionDirector.ts',
    ring: 'src/scene/torque-wrench/RingInspection.ts', timeline: 'src/scene/inspection/timeline.ts', kinematics: 'src/scene/inspection/shaft/kinematics.ts',
    schedule: 'src/scene/inspection/shaft/schedule.ts', cascade: 'src/scene/inspection/shaft/cascadeConfig.ts' })) {
    const imported = await sourceModule(entry); sources[key] = imported.exports
    assert.ok(imported.inputs.length > 0)
    assert.ok(imported.inputs.every(x => /^[a-f0-9]{64}$/.test(x.sha256)))
  }
  const { clock, ring, timeline, kinematics: kin, schedule, cascade } = sources
  assert.equal(canonicalGate(sources.contract.BULLET_TIME_SHOT_SPECS).status, 'PASS')
  for (const id of ['ringSwitch', 'shaperContact', 'hobContact', 'stage1Ignition']) {
    const spec = sources.contract.BULLET_TIME_SHOT_SPECS[id]
    const shot = { ...spec, nativeWindow: spec.window.map(p => p - (spec.progressSpace === 'shaft-study' ? .115 : 0)) }
    const samples = Array.from({ length: 33 }, (_, i) => {
      const p = shot.nativeWindow[0] + (shot.nativeWindow[1] - shot.nativeWindow[0]) * i / 32
      const s = state(); s.progress = p
      const t = clock.subjectTimeAt(p + .115)
      s.inspection = { subjectTime: t, cameraTime: clock.cameraTimeAt(p + .115) }
      let angle
      if (id === 'ringSwitch') angle = timeline.sampleInspection(ring.ringMechanicalTimeAt(clock.ringTimeAt(p)), timeline.newFrame()).angle
      else if (id === 'shaperContact') angle = -kin.WORK_RATE * kin.machiningTimeAt(t)
      else if (id === 'hobContact') angle = kin.hobPhiAt(t) / 10
      else angle = -cascade.SUN_TO_STAGE1_CARRIER_RATIO * schedule.sampleFinaleAngle(t)
      s.subjects = [{ name: `shaft/a/${id === 'shaperContact' ? 'legacyshaft' : 'approvedshaft'}`, matrixWorld: rotation(angle) }]
      return { telemetry: s, snapshot: { ring: { time: clock.ringTimeAt(p), subjectMatrix: rotation(angle) } } }
    })
    const gates = builtinPhysicalGates(samples, shot, sources)
    assert.ok(gates.every(g => g.status === 'PASS'), `${id}: ${JSON.stringify(gates.filter(g => g.status !== 'PASS'))}`)
    const corrupt = clone(samples)
    if (id === 'ringSwitch') corrupt[10].snapshot.ring.subjectMatrix = rotation(1)
    else corrupt[10].telemetry.subjects[0].matrixWorld = rotation(1)
    assert.ok(builtinPhysicalGates(corrupt, shot, sources).some(g => g.status === 'FAIL'), `${id}: bad installed matrices must fail`)
  }
})
