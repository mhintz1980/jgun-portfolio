/** Distances in sheet metres from the baked pulse to the actual side-view ink.
 * Independent of viewport/DPR. Empty or nonfinite input fails closed.
 */
export function measureProfileRegistration(points: number[][], segments: number[], group: number) {
  const lines: number[][] = []
  for (let i = 0; i + 8 < segments.length; i += 9) {
    if (segments[i + 5] === group) lines.push(segments.slice(i, i + 4))
  }
  let max = 0, total = 0
  for (const [x, y] of points) {
    let nearest = Infinity
    for (const [ax, ay, bx, by] of lines) {
      const dx = bx - ax, dy = by - ay
      const lengthSq = dx * dx + dy * dy
      const t = lengthSq ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSq)) : 0
      nearest = Math.min(nearest, Math.hypot(x - ax - t * dx, y - ay - t * dy))
    }
    total += nearest
    max = Math.max(max, nearest)
  }
  const ready = points.length > 0 && lines.length > 0 && Number.isFinite(total)
  return { ready, pointCount: points.length, segmentCount: lines.length,
    maxDistance: ready ? max : null, meanDistance: ready ? total / points.length : null, units: 'metres' }
}
