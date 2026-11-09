import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assertRoute,
  validateIdentity,
  windowTasks,
  parseOptions,
  runPair,
  median,
} from './lib/performance-contract.mjs'
test('reject fallback routes and unknown CLI keys', () => {
  assert.throws(() => assertRoute('https://example.com/torque/', 'torque'), /fallback/)
  assert.doesNotThrow(() => assertRoute('https://example.com/torque-wrench/', 'torque'))
  assert.throws(() => parseOptions(['--route=torque']), /Unknown/)
  assert.throws(
    () => parseOptions(['--base=https://example.com', '--identity=a', '--out=b', '--routes=torque/']),
    /Unknown route/,
  )
  assert.throws(
    () => parseOptions(['--base=https://example.com', '--identity=a', '--out=b', '--routes=constructor']),
    /Unknown route/,
  )
  assert.throws(
    () => parseOptions(['--base=https://example.com', '--identity=a', '--out=b', '--routes=home,home']),
    /Duplicate/,
  )
})
test('median handles odd and even sample counts', () => {
  assert.equal(median([7, 1, 3]), 3)
  assert.equal(median([9, 1, 3, 5]), 4)
  assert.equal(median([]), null)
})
test('require source lock artifact scene and byte identity', () => {
  assert.throws(() => validateIdentity({}, 'torque'), /identity/)
  const identity = {
    source: 'a'.repeat(40),
    lockSha256: 'b'.repeat(64),
    artifactManifestSha256: 'c'.repeat(64),
    routes: { torque: { path: '/torque-wrench/', entry: '/assets/torque-abc.js', scene: '/assets/Scene-abc.js' } },
    files: ['torque-wrench/index.html', 'assets/torque-abc.js', 'assets/Scene-abc.js'].map((path) => ({
      path,
      sha256: 'd'.repeat(64),
    })),
  }
  assert.doesNotThrow(() => validateIdentity(identity, 'torque'))
  delete identity.routes.torque.scene
  assert.throws(() => validateIdentity(identity, 'torque'), /scene/)
})
test('long task crossing windows is apportioned by intersection', () => {
  const tasks = [
    { start: 90, duration: 40 },
    { start: 180, duration: 50 },
  ]
  assert.deepEqual(windowTasks(tasks, 100, 200), { count: 2, durationMs: 50 })
  assert.deepEqual(windowTasks(tasks, 200, 250), { count: 1, durationMs: 30 })
})
test('cold/repeat reuse context and context closes even after sample failure', async () => {
  const events = []
  const context = { close: async () => events.push('close') }
  const browser = {
    newContext: async () => {
      events.push('new')
      return context
    },
  }
  const records = await runPair(browser, 'desktop', async (c, meta) => {
    assert.equal(c, context)
    events.push(meta.kind)
    return meta
  })
  assert.deepEqual(events, ['new', 'cold', 'repeat', 'close'])
  assert.equal(records[0].pairId, records[1].pairId)
  assert.equal(records[1].cacheState, 'same-context-after-measured-cold')
  events.length = 0
  await assert.rejects(
    runPair(browser, 'desktop', async () => {
      throw new Error('failed')
    }),
  )
  assert.deepEqual(events, ['new', 'close'])
})
