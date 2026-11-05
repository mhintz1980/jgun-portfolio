import { C } from '../theme'

export type Pt = { x: number; y: number }

/** Catmull-Rom → cubic Bézier, the same lacing the site's thread uses (threadPath.ts). */
export function catmull(points: Pt[], tension = 0.5): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const k = tension / 3
    const c1 = { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k }
    const c2 = { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k }
    d += ` C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

/** Sample a catmull path densely so we can measure length and place the tip without the DOM. */
export function samplePath(points: Pt[], tension = 0.5, perSeg = 48) {
  const out: Pt[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const k = tension / 3
    const c1 = { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k }
    const c2 = { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k }
    for (let j = i === 0 ? 0 : 1; j <= perSeg; j++) {
      const t = j / perSeg
      const a = (1 - t) ** 3
      const b = 3 * (1 - t) ** 2 * t
      const c = 3 * (1 - t) * t * t
      const e = t ** 3
      out.push({ x: a * p1.x + b * c1.x + c * c2.x + e * p2.x, y: a * p1.y + b * c1.y + c * c2.y + e * p2.y })
    }
  }
  const lengths = [0]
  for (let i = 1; i < out.length; i++) lengths.push(lengths[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y))
  const total = lengths[lengths.length - 1]
  const at = (len: number): Pt => {
    const L = Math.min(total, Math.max(0, len))
    let i = 1
    while (i < lengths.length - 1 && lengths[i] < L) i++
    const t = (L - lengths[i - 1]) / Math.max(1e-6, lengths[i] - lengths[i - 1])
    return { x: out[i - 1].x + (out[i].x - out[i - 1].x) * t, y: out[i - 1].y + (out[i].y - out[i - 1].y) * t }
  }
  const lengthNear = (p: Pt) => {
    let best = 0
    let bd = Infinity
    out.forEach((q, i) => {
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2
      if (d < bd) {
        bd = d
        best = lengths[i]
      }
    })
    return best
  }
  return { total, at, lengthNear }
}

/** The Revision Orange thread: drawn to `progress` (0..1) with a glowing tip and eyelets
 *  that light as the thread passes them (the homepage's "Follow the thread"). */
export function Thread({
  points,
  progress,
  eyelets = [],
  color = C.orange,
  width = 3,
  opacity = 1,
  tip = true,
  glow = 0.35,
}: {
  points: Pt[]
  progress: number
  eyelets?: Pt[]
  color?: string
  width?: number
  opacity?: number
  tip?: boolean
  glow?: number
}) {
  const d = catmull(points)
  const s = samplePath(points)
  const drawn = s.total * Math.min(1, Math.max(0, progress))
  const head = s.at(drawn)
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity }}>
      <defs>
        <filter id="threadGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {glow > 0 && (
        <path d={d} fill="none" stroke={color} strokeWidth={width * 3} strokeLinecap="round" strokeDasharray={`${drawn} ${s.total + 10}`} opacity={glow} filter="url(#threadGlow)" />
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={`${drawn} ${s.total + 10}`} />
      {eyelets.map((e, i) => {
        const lit = drawn >= s.lengthNear(e) - 1
        return (
          <g key={i} transform={`translate(${e.x} ${e.y})`}>
            <circle r={9} fill={lit ? color : 'none'} stroke={color} strokeWidth={2} opacity={lit ? 1 : 0.45} />
            <circle r={3.2} fill={lit ? C.paper : color} opacity={lit ? 1 : 0.45} />
          </g>
        )
      })}
      {tip && progress > 0.001 && progress < 0.999 && (
        <g transform={`translate(${head.x} ${head.y})`}>
          <circle r={16} fill={color} opacity={0.25} filter="url(#threadGlow)" />
          <circle r={6} fill={color} />
        </g>
      )}
    </svg>
  )
}
