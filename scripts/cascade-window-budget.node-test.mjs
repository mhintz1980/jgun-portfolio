import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cascadeWindowBudget } from './lib/cascade-window-budget.mjs'

const times = [
  40.2, 43.5, 44.4, 45.3, 46.2, 52.2, 53.1, 54, 55.5, 56.4, 57, 57.9, 59.1, 60, 60.9, 62.25, 63.15, 64.65, 65.4, 66.9,
]
function approved() {
  const windows = times
    .slice(1)
    .map((t, i) => ({ time: [times[i], t], baselinePixels: (t - times[i]) * 100, pixels: (t - times[i]) * 150 }))
  const early = windows.filter((w) => w.time[0] >= 44.4 && w.time[1] <= 52.2)
  const later = windows.filter((w) => w.time[0] >= 53.1 && w.time[1] <= 64.65)
  const saved = early.reduce((s, w) => s + w.pixels * 0.65, 0)
  const laterTotal = later.reduce((s, w) => s + w.pixels, 0)
  for (const w of early) w.pixels *= 0.35
  for (const w of later) w.pixels *= 1 + saved / laterTotal
  return windows
}
test('accepts approved early compression, compensated later distance and preserved total', () => {
  const result = cascadeWindowBudget(approved())
  assert.equal(result.passed, true)
  assert.equal(result.totalPreserved, true)
  assert.ok(Math.abs(result.windows[2].expectedRatio - 0.525) < 1e-12)
})
test('rejects the superseded uniform 1.5x allocation despite its correct total', () => {
  const windows = approved().map((w) => ({ ...w, pixels: w.baselinePixels * 1.5 }))
  assert.equal(cascadeWindowBudget(windows).totalPreserved, true)
  assert.equal(cascadeWindowBudget(windows).passed, false)
})
test('rejects missing, reordered, nonfinite and zero-width evidence', () => {
  for (const invalid of [
    [],
    approved().slice(1),
    approved().reverse(),
    approved().map((w, i) => (i === 0 ? { ...w, pixels: NaN } : w)),
    approved().map((w, i) => (i === 0 ? { ...w, baselinePixels: 0 } : w)),
  ])
    assert.equal(cascadeWindowBudget(invalid).passed, false)
})
test('rejects a wrong local allocation even when another window compensates its total', () => {
  const windows = approved()
  windows[2].pixels += 40
  windows[3].pixels -= 40
  const result = cascadeWindowBudget(windows)
  assert.equal(result.totalPreserved, true)
  assert.equal(result.passed, false)
})
