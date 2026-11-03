import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classifyReport, reverseReplayGate, ringContactFramingGate, isolationFadeGate,
  solidHousingGate, focusCalloutsGate, suspendedCalloutsGate } from './verify-torque-camera-hud.mjs'

const report = (gates = [], errors = [], phase = 'after') => ({ phase, gates, errors })
const replay = (cameraError = 0, subjectError = 0) => [{ p: .593, cameraError, subjectError }]

test('full assertions pass only with a nonempty passing gate set', () => {
  assert.equal(classifyReport(report([reverseReplayGate(replay())])), 'PASS')
  assert.equal(classifyReport(report()), 'INCOMPLETE')
  assert.equal(classifyReport(report([{ pass: false }])), 'FAIL')
})

test('quick mode is incomplete even if supplied gates pass', () => {
  assert.equal(classifyReport(report(), { quick: true }), 'INCOMPLETE')
  assert.equal(classifyReport(report([{ pass: true }]), { quick: true }), 'INCOMPLETE')
})

test('browser errors and failed gates take precedence over preview/capture status', () => {
  for (const phase of ['after', 'before']) {
    for (const quick of [false, true]) {
      assert.equal(classifyReport(report([], ['browser error'], phase), { quick }), 'FAIL')
      assert.equal(classifyReport(report([{ pass: false }], [], phase), { quick }), 'FAIL')
    }
  }
})

test('before phase remains capture-only, regardless of quick mode', () => {
  assert.equal(classifyReport(report([], [], 'before')), 'CAPTURED')
  assert.equal(classifyReport(report([], [], 'before'), { quick: true }), 'CAPTURED')
})

test('both replay errors must be strictly below 1e-5 and evidence is preserved', () => {
  const evidence = replay(9.99e-6, 9.99e-6)
  const gate = reverseReplayGate(evidence)
  assert.equal(gate.pass, true)
  assert.strictEqual(gate.evidence, evidence)
  for (const error of [1e-5, 1.01e-5, .001, NaN, Infinity, undefined]) {
    const cameraOnly = reverseReplayGate([{ cameraError: error, subjectError: 0 }])
    const subjectOnly = reverseReplayGate([{ cameraError: 0, subjectError: error }])
    assert.equal(cameraOnly.pass, false, `camera error: ${error}`)
    assert.equal(subjectOnly.pass, false, `subject error: ${error}`)
    assert.equal(classifyReport(report([subjectOnly])), 'FAIL')
  }
})

test('every reverse checkpoint must pass; empty reverse evidence cannot pass', () => {
  assert.equal(reverseReplayGate([]).pass, false)
  assert.equal(reverseReplayGate([...replay(), ...replay(0, 1e-5)]).pass, false)
  assert.equal(reverseReplayGate([...replay(), ...replay(1e-5, 0)]).pass, false)
  assert.equal(reverseReplayGate([...replay(), ...replay(1e-6, 1e-6)]).pass, true)
})

test('contact shot asserts the solver radius and lens at both aspects and the aspect blend', () => {
  for (const [viewport, radius, fov] of [[[1440, 900], .31, 30], [[390, 844], .5, 36], [[820, 1000], .405, 33]]) {
    const sample = (r = radius, lens = fov) => ({ world: { camera: { position: [4 + r, 2, 3], target: [4, 2, 3], fov: lens } } })
    assert.equal(ringContactFramingGate(sample(), viewport).pass, true)
    // Old .55x framing, wrong aspect, lens regression and missing evidence must fail.
    for (const bad of [sample(radius * .55), sample(radius + .00001), sample(radius, fov + .00001), undefined]) {
      assert.equal(ringContactFramingGate(bad, viewport).pass, false)
    }
  }
})

const fadeSamples = () => [
  // Analytic quintic witnesses at u=2/15, 8/15 and 1, rather than copying the gate's implementation.
  [.587, .9807841975308642], [.593, .4376849382716049], [.600, 0],
].map(([p, opacity]) => ({ requestedProgress: p, world: { isolation: {
  progress: p, surroundingsOpacity: opacity, actualMaxOpacity: opacity,
} } }))

test('isolation follows the uninterrupted quintic in commanded and installed opacity', () => {
  assert.equal(isolationFadeGate(fadeSamples()).pass, true)
  for (const field of ['surroundingsOpacity', 'actualMaxOpacity']) {
    for (const opacity of [.275, 1, NaN, undefined]) {
      const samples = fadeSamples()
      samples[1].world.isolation[field] = opacity
      assert.equal(isolationFadeGate(samples).pass, false, `${field}: ${opacity}`)
    }
  }
  assert.equal(isolationFadeGate([]).pass, false)
  assert.equal(isolationFadeGate(fadeSamples().slice(1)).pass, false)
  const stale = fadeSamples()
  stale[1].world.isolation.progress = .58
  assert.equal(isolationFadeGate(stale).pass, false)
  // Evaluate at actual native progress; do not loosen the inherited .005 opacity tolerance.
  const rounded = fadeSamples()
  rounded[1].world.isolation = { progress: .5930042248629198,
    surroundingsOpacity: .43716155386641176, actualMaxOpacity: .43716155386641176 }
  assert.equal(isolationFadeGate(rounded).pass, true)
})

const housingSamples = () => [.885, .905, .925, .94, .955, .960, .965, .98].map(p => ({ requestedProgress: p,
  world: { mechanical: { channels: { ghostOpacity: 1 } }, rig: { ghostOpacity: 1 }, isolation: { occurrences: [
    { parent: 'MERGED Housing (P000245)', visible: true, applied: [{ opacity: 1, depthWrite: true }] },
  ] } } }))

test('solid explosion housing requires command, installed material and depth writing at every checkpoint', () => {
  assert.equal(solidHousingGate(housingSamples()).pass, true)
  const mutations = [
    s => { s.world.mechanical.channels.ghostOpacity = .15 },
    s => { s.world.rig.ghostOpacity = .15 },
    s => { s.world.isolation.occurrences[0].applied[0].opacity = .15 },
    s => { s.world.isolation.occurrences[0].applied[0].depthWrite = false },
    s => { s.world.isolation.occurrences[0].visible = false },
    s => { s.world.isolation.occurrences[0].applied = [] },
    s => { s.world.isolation.occurrences = [] },
  ]
  for (const mutate of mutations) {
    const samples = housingSamples()
    mutate(samples[4])
    assert.equal(solidHousingGate(samples).pass, false)
  }
  assert.equal(solidHousingGate([]).pass, false)
  assert.equal(solidHousingGate(housingSamples().slice(1)).pass, false)
})

const lcdInteraction = () => ({ id: 'lcd-manometer', selected: 'lcd-manometer',
  restored: { focusId: null, focusRestored: true }, cameraMoved: .01 })

test('LCD alone must select, move the camera, dismiss, and restore keyboard focus', () => {
  assert.equal(focusCalloutsGate([lcdInteraction()]).pass, true)
  for (const mutate of [
    x => { x.id = x.selected = 'ring-switch' }, x => { x.selected = null },
    x => { x.restored.focusId = 'lcd-manometer' }, x => { x.restored.focusRestored = false },
    x => { delete x.restored.focusRestored }, x => { x.cameraMoved = .001 },
  ]) {
    const interaction = lcdInteraction(); mutate(interaction)
    assert.equal(focusCalloutsGate([interaction]).pass, false)
  }
  assert.equal(focusCalloutsGate([]).pass, false)
  assert.equal(focusCalloutsGate([lcdInteraction(), lcdInteraction()]).pass, false)
})

test('every suspended card and projected anchor stays hidden, with evidence retained', () => {
  const sample = () => ({ requestedProgress: .52,
    overlay: { anchors: ['clutch-housing', 'ring-switch', 'stage2-planet'].map(id => ({ id, visible: false })) },
    hud: { callouts: ['clutch-housing', 'ring-switch', 'stage2-planet'].map(id => ({ id, visible: false })) } })
  assert.equal(suspendedCalloutsGate([sample()]).pass, true)
  for (const field of ['anchors', 'callouts']) {
    for (let i = 0; i < 3; i++) {
      const s = sample(), entries = field === 'anchors' ? s.overlay.anchors : s.hud.callouts
      entries[i].visible = true
      assert.equal(suspendedCalloutsGate([s]).pass, false)
      entries.splice(i, 1)
      assert.equal(suspendedCalloutsGate([s]).pass, false)
    }
  }
  assert.equal(suspendedCalloutsGate([]).pass, false)
})
