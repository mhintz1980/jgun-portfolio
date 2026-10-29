import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classifyReport, reverseReplayGate } from './verify-torque-camera-hud.mjs'

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
