// Each case appends full real-vertex evidence to samples.jsonl. The checkpoint
// retains every gate and matrix but references that journal for bulky hulls.
export function checkpointJson(report) {
  return JSON.stringify(report, (key, value) => {
    if (key === 'witnesses' && Array.isArray(value)) return value.map(({ points, ...witness }) => ({
      ...witness, pointCount: Array.isArray(points) ? points.length : null, pointsEvidence: 'case samples.jsonl',
    }))
    return typeof value === 'number' && !Number.isFinite(value) ? String(value) : value
  }, 2) + '\n'
}
