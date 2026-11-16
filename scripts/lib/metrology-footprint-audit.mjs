/**
 * Independent footprint contract check. SELF-CONTAINED (serialised into the page with toString()).
 * props: [{ id, footprint: [[x,y],...], localBounds: {min:[..],max:[..]}|null }]
 * Violations: id:drawing (penetrates |x|<0.404 && |y|<0.254), id:plate (outside |x|<=0.68, |y|<=0.45),
 * id:<other> (convex overlap with another prop), id:z (asset local min z below the table plane).
 * Touching (zero penetration) is allowed; penetration above eps (metres) is a violation.
 */
export function footprintViolations(props, options) {
  const o = Object.assign({ keepX: 0.404, keepY: 0.254, plateX: 0.68, plateY: 0.45, eps: 1e-6, zEps: 1e-4 }, options || {})
  const depth = (a, b) => {
    let best = Infinity
    for (const poly of [a, b]) {
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i], q = poly[(i + 1) % poly.length]
        let nx = q[1] - p[1], ny = p[0] - q[0]
        const len = Math.hypot(nx, ny)
        if (len < 1e-12) continue
        nx /= len; ny /= len
        let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity
        for (const v of a) { const d = v[0] * nx + v[1] * ny; if (d < minA) minA = d; if (d > maxA) maxA = d }
        for (const v of b) { const d = v[0] * nx + v[1] * ny; if (d < minB) minB = d; if (d > maxB) maxB = d }
        const overlap = Math.min(maxA, maxB) - Math.max(minA, minB)
        if (overlap <= 0) return 0
        if (overlap < best) best = overlap
      }
    }
    return best === Infinity ? 0 : best
  }
  const keep = [[-o.keepX, -o.keepY], [o.keepX, -o.keepY], [o.keepX, o.keepY], [-o.keepX, o.keepY]]
  const out = []
  for (let i = 0; i < props.length; i++) {
    const p = props[i]
    if (!p.footprint || p.footprint.length < 3) { out.push(p.id + ':footprint-missing'); continue }
    if (depth(p.footprint, keep) > o.eps) out.push(p.id + ':drawing')
    if (p.footprint.some(v => Math.abs(v[0]) > o.plateX + o.eps || Math.abs(v[1]) > o.plateY + o.eps)) out.push(p.id + ':plate')
    if (p.localBounds && p.localBounds.min[2] < -o.zEps) out.push(p.id + ':z')
    for (let j = 0; j < i; j++) {
      const q = props[j]
      if (q.footprint && q.footprint.length >= 3 && depth(p.footprint, q.footprint) > o.eps) out.push(p.id + ':' + q.id)
    }
  }
  return out
}
