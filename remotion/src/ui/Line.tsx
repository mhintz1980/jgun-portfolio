import { C } from '../theme'

export type Pt = { x: number; y: number }

/** A ruled polyline: straight segments only, measured so the pen can sit anywhere along it. */
export function ruled(points: Pt[]) {
  const lengths = [0]
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  const total = lengths[lengths.length - 1]
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const at = (len: number): Pt => {
    const L = Math.min(total, Math.max(0, len))
    let i = 1
    while (i < lengths.length - 1 && lengths[i] < L) i++
    const t = (L - lengths[i - 1]) / Math.max(1e-6, lengths[i] - lengths[i - 1])
    return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * t, y: points[i - 1].y + (points[i].y - points[i - 1].y) * t }
  }
  /** Distance along the line to the vertex nearest `p` (marks sit on vertices). */
  const lengthAt = (p: Pt) => {
    let best = 0
    let bd = Infinity
    points.forEach((q, i) => {
      const dd = (q.x - p.x) ** 2 + (q.y - p.y) ** 2
      if (dd < bd) {
        bd = dd
        best = lengths[i]
      }
    })
    return best
  }
  return { d, total, at, lengthAt }
}

/** The plotter pen: a crosshair with an open ring, the same head in 2D and over the 3D. */
export function PenHead({ x, y, color = C.orange, opacity = 1, reach = 14 }: { x: number; y: number; color?: string; opacity?: number; reach?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <circle r={reach + 6} fill={color} opacity={0.12} />
      <line x1={-reach} y1={0} x2={reach} y2={0} stroke={color} strokeWidth={1.5} />
      <line x1={0} y1={-reach} x2={0} y2={reach} stroke={color} strokeWidth={1.5} />
      <circle r={5} fill="none" stroke={color} strokeWidth={2} />
      <circle r={1.8} fill={color} />
    </g>
  )
}

/** A registration mark: crosshair + ring. Ink and faint until the inked line reaches it. */
function Mark({ p, lit, color, opacity }: { p: Pt; lit: boolean; color: string; opacity: number }) {
  const c = lit ? color : C.ink
  return (
    <g transform={`translate(${p.x} ${p.y})`} opacity={opacity * (lit ? 1 : 0.4)}>
      <line x1={-13} y1={0} x2={13} y2={0} stroke={c} strokeWidth={1.25} />
      <line x1={0} y1={-13} x2={0} y2={13} stroke={c} strokeWidth={1.25} />
      <circle r={7} fill={lit ? color : 'none'} stroke={c} strokeWidth={1.75} />
      <circle r={2.4} fill={lit ? C.paper : c} />
    </g>
  )
}

/** "The line": a drafting stroke. A thin ink construction line is ruled first (`construct`),
 *  then the Revision Orange object line is inked over it (`ink`), lighting each mark as it
 *  passes. Straight segments, square ends. */
export function Line({
  points,
  construct,
  ink,
  marks = [],
  markOpacity = 1,
  color = C.orange,
  width = 3,
  opacity = 1,
  head = true,
}: {
  points: Pt[]
  construct: number
  ink: number
  marks?: Pt[]
  markOpacity?: number
  color?: string
  width?: number
  opacity?: number
  head?: boolean
}) {
  const s = ruled(points)
  const built = s.total * Math.min(1, Math.max(0, construct))
  const inked = s.total * Math.min(1, Math.max(0, ink))
  // The pen sits on whichever pass is still moving: ruling first, then inking.
  const penLen = construct < 0.999 ? built : inked
  const pen = s.at(penLen)
  const penMoving = (construct > 0.001 && construct < 0.999) || (ink > 0.001 && ink < 0.999)
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity }}>
      <path d={s.d} fill="none" stroke={C.ink} strokeWidth={1} opacity={0.38} strokeLinecap="butt" strokeDasharray={`${built} ${s.total + 10}`} />
      <path d={s.d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="square" strokeLinejoin="miter" strokeDasharray={`${inked} ${s.total + 10}`} opacity={ink > 0 ? 1 : 0} />
      {marks.map((m, i) => (
        <Mark key={i} p={m} lit={ink > 0 && inked >= s.lengthAt(m) - 1} color={color} opacity={markOpacity} />
      ))}
      {head && penMoving && <PenHead x={pen.x} y={pen.y} color={color} />}
    </svg>
  )
}
