import { C, F } from '../theme'

/** The homepage's drawn name: Revision-Orange outline traced first, then filled with ink. */
export function DrawnName({
  text,
  draw,
  fill,
  size = 230,
  ink = C.ink,
  x = 960,
  y = 470,
  anchor = 'middle',
}: {
  text: string
  draw: number
  fill: number
  size?: number
  ink?: string
  x?: number
  y?: number
  anchor?: 'start' | 'middle' | 'end'
}) {
  const dash = 2400
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        style={{
          fontFamily: F.display,
          fontWeight: 900,
          fontSize: size,
          letterSpacing: '-0.01em',
          fill: ink,
          fillOpacity: fill,
          stroke: fill > 0.98 ? 'none' : C.orange,
          strokeOpacity: 1 - fill,
          strokeWidth: 2.4,
          strokeLinejoin: 'round',
          strokeDasharray: `${dash} ${dash * 4}`,
          strokeDashoffset: dash * (1 - draw),
        }}
      >
        {text}
      </text>
    </svg>
  )
}
