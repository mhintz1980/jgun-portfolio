// Approved proposal 66 redistributes the original 1.5x budget: 44.4..52.2 s
// receives 35% of its old allocation, and 53.1..64.65 s receives the savings.
// This oracle is independent of the production clock's previewDistanceWeight.
const BOUNDARIES = [
  40.2, 43.5, 44.4, 45.3, 46.2, 52.2, 53.1, 54, 55.5, 56.4, 57, 57.9, 59.1, 60, 60.9, 62.25, 63.15, 64.65, 65.4, 66.9,
]
const early = ([a, b]) => a >= 44.4 && b <= 52.2
const later = ([a, b]) => a >= 53.1 && b <= 64.65

export function cascadeWindowBudget(windows) {
  if (
    !Array.isArray(windows) ||
    windows.length !== BOUNDARIES.length - 1 ||
    windows.some(
      (w, i) =>
        !Array.isArray(w.time) ||
        w.time.length !== 2 ||
        w.time[0] !== BOUNDARIES[i] ||
        w.time[1] !== BOUNDARIES[i + 1] ||
        !Number.isFinite(w.pixels) ||
        w.pixels <= 0 ||
        !Number.isFinite(w.baselinePixels) ||
        w.baselinePixels <= 0,
    )
  )
    return { passed: false, reason: 'missing, malformed or reordered cascade windows' }
  const baseline = (predicate) => windows.filter((w) => predicate(w.time)).reduce((sum, w) => sum + w.baselinePixels, 0)
  const laterGain = 1 + (0.65 * baseline(early)) / baseline(later)
  const checks = windows.map((w) => {
    const expectedRatio = 1.5 * (early(w.time) ? 0.35 : later(w.time) ? laterGain : 1)
    const actualRatio = w.pixels / w.baselinePixels
    return { time: w.time, actualRatio, expectedRatio, passed: Math.abs(actualRatio / expectedRatio - 1) <= 0.02 }
  })
  const actualTotal = windows.reduce((sum, w) => sum + w.pixels, 0)
  const expectedTotal = 1.5 * baseline(() => true)
  const totalPreserved = Math.abs(actualTotal / expectedTotal - 1) <= 0.02
  return {
    passed: totalPreserved && checks.every((w) => w.passed),
    laterGain,
    actualTotal,
    expectedTotal,
    totalPreserved,
    windows: checks,
  }
}
