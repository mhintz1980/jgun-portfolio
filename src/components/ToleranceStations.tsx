import { useEffect, useRef, useState, type ReactElement } from 'react'
import { PHASE, STATIONS, type FcfCell, type Station } from '../scene/stations/stationData'
import { registerStationOverlay, type StationFrame } from '../scene/stations/stationStore'

/**
 * JG-035 TOLERANCE STATIONS — one callout at a time (replaces the CH.01/02 hotspot cluster).
 *
 * Sequence per station, all scrubbed by scroll (scroll back = the same film in reverse):
 * the anchor reticle draws on the part and pings, the leader draws out to an elbow and shelf,
 * the feature control frame outlines itself and fills cell by cell with vector GD&T glyphs,
 * the part name and process note type in — then everything retracts before the next station.
 * Cream ink on the dark scene with a warm amber anchor (navy is unreadable here — fact sheet §4
 * Q3). The StationDriver (in-canvas) supplies screen positions every frame; this component
 * never re-renders per frame, only when the station changes.
 */

const CREAM = '#efe6d0'
const AMBER = '#f2a24a'
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const ease = (x: number) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}
const span = (u: number, [a, b]: readonly [number, number]) => ease((u - a) / (b - a))

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Y14.5 characteristic glyphs (20x20), same construction as GdtSymbols.tsx plus ⌰ and ⌀. */
const GLYPH: Record<string, ReactElement> = {
  RUNOUT: (
    <>
      <path d="M3 17 L14.6 5.4" {...stroke} />
      <path d="M14.6 5.4 L10.2 5.6 M14.6 5.4 L14.4 9.8" {...stroke} />
    </>
  ),
  TOTAL_RUNOUT: (
    <>
      <path d="M2.5 17.5 H17.5" {...stroke} />
      <path d="M3.5 17.5 L11 5 M9.5 17.5 L17 5" {...stroke} />
      <path d="M11 5 L7.6 6.4 M11 5 L11.6 8.6 M17 5 L13.6 6.4 M17 5 L17.6 8.6" {...stroke} />
    </>
  ),
  PROFILE: (
    <>
      <path d="M3 13 A 7 7 0 0 1 17 13 L3 13 Z" {...stroke} />
    </>
  ),
  FLATNESS: <path d="M3.5 14.5 L7.5 5.5 L16.5 5.5 L12.5 14.5 Z" {...stroke} />,
  DIAMETER: (
    <>
      <circle cx="10" cy="10" r="5.6" {...stroke} />
      <path d="M4 16 L16 4" {...stroke} />
    </>
  ),
}

function Cell({ cell }: { cell: FcfCell }) {
  if (cell.kind === 'symbol')
    return (
      <svg viewBox="0 0 20 20" className="h-[20px] w-[20px]" aria-hidden="true">
        {GLYPH[cell.symbol]}
      </svg>
    )
  if (cell.kind === 'datum') return <span className="station-datum">{cell.text}</span>
  return <span>{cell.text}</span>
}

function Frame({ cells, name }: { cells: FcfCell[]; name: string }) {
  return (
    <div data-frame={name} className="relative inline-flex items-stretch h-[36px] font-mono text-[15px] tracking-[0.04em]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <rect data-outline x="0" y="0" width="100%" height="100%" pathLength={1} fill="none" stroke={CREAM} strokeWidth={1.5} strokeDasharray="1 1" strokeDashoffset={1} />
      </svg>
      {cells.map((cell, i) => (
        <div
          key={i}
          data-cell
          className="flex items-center justify-center px-3 min-w-[36px] opacity-0"
          style={{ borderLeft: i > 0 ? `1.5px solid ${CREAM}` : undefined }}
        >
          <Cell cell={cell} />
        </div>
      ))}
    </div>
  )
}

function StationCard({ station }: { station: Station }) {
  if (station.card) {
    const items = station.note.split(' · ')
    return (
      <div className="station-summary">
        <div data-type-src={station.partNo} className="font-mono text-[11px] tracking-[0.3em] mb-3" />
        <div data-type-src={station.part} className="station-name mb-4" />
        {items.map((item) => (
          <div key={item} className="station-summary-row">
            <span data-type-src={item} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2.5" style={{ alignItems: 'inherit' }}>
      {station.fcf && <Frame cells={station.fcf} name="a" />}
      {station.datumFlag && (
        <div data-frame="flag" className="inline-flex items-center font-mono text-[15px]">
          <div data-cell className="opacity-0 flex h-[36px] w-[36px] items-center justify-center" style={{ border: `1.5px solid ${CREAM}` }}>
            <span className="station-datum">{station.datumFlag}</span>
          </div>
        </div>
      )}
      {station.fcf2 && <Frame cells={station.fcf2} name="b" />}
      <div data-type-src={station.part} className="station-name mt-2" />
      <div data-type-src={station.partNo} className="font-mono text-[11px] tracking-[0.28em]" style={{ color: AMBER }} />
      <div data-type-src={station.note} className="font-mono text-[12.5px] leading-relaxed tracking-[0.03em] max-w-[23rem]" style={{ color: 'rgba(239,230,208,0.78)' }} />
    </div>
  )
}

export function ToleranceStations() {
  const [index, setIndex] = useState(-1)
  const root = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const leader = useRef<SVGPolylineElement>(null)
  const secondary = useRef<SVGPolylineElement>(null)
  const reticle = useRef<SVGGElement>(null)
  const ring = useRef<SVGCircleElement>(null)
  const ping = useRef<SVGCircleElement>(null)
  const core = useRef<SVGCircleElement>(null)
  const axis = useRef<SVGLineElement>(null)
  const glint = useRef<SVGCircleElement>(null)
  const datum = useRef<SVGGElement>(null)
  const layout = useRef({ index: -1, x: 0, y: 0, side: 1, fresh: true, cardW: 400, cardH: 230 })

  useEffect(() => {
    const apply = (f: StationFrame) => {
      const el = root.current
      if (!el) return
      if (f.index !== layout.current.index) {
        layout.current.index = f.index
        layout.current.fresh = true
        setIndex(f.index)
      }
      if (f.index < 0 || f.index !== index) {
        el.style.visibility = 'hidden'
        return
      }
      el.style.visibility = 'visible'
      const station = STATIONS[f.index]
      const u = f.u
      const out = span(u, PHASE.retract)
      const w = f.width
      const h = f.height
      const [ax, ay, aOn] = f.anchor

      // Card placement: in the free space around the model's projected bounds — beside it on the
      // anchor's side when that fits, else above or below it on the right, clear of the chapter
      // caption (top-left) and beat caption (bottom-left). The card is measured once per
      // station, fully typed, so the lanes test its real size.
      const lay = layout.current
      const c = card.current
      if (lay.fresh && c) {
        const typed = c.querySelectorAll<HTMLElement>('[data-type-src]')
        typed.forEach((node) => (node.textContent = node.dataset.typeSrc ?? ''))
        lay.cardW = c.offsetWidth
        lay.cardH = c.offsetHeight
      }
      const CARD_W = lay.cardW
      const CARD_H = lay.cardH
      const GAP = 56
      const [mx0, my0, mx1, my1] = f.model
      const rightX = Math.max(w * 0.56, Math.min(w - CARD_W - 48, ax + 70))
      let targetX: number
      let targetY: number
      let side: number
      const roomRight = w - 48 - (mx1 + GAP)
      const roomLeft = mx0 - GAP - 48
      const roomAbove = my0 - GAP - h * 0.12
      const roomBelow = h * 0.86 - (my1 + GAP)
      const preferRight = ax >= (mx0 + mx1) / 2 || roomLeft < CARD_W
      if (!station.card && preferRight && roomRight >= CARD_W) {
        side = 1
        targetX = mx1 + GAP
        targetY = Math.min(h * 0.84 - CARD_H, Math.max(h * 0.14, ay - CARD_H * 0.45))
      } else if (!station.card && roomLeft >= CARD_W) {
        side = -1
        targetX = mx0 - GAP
        targetY = Math.min(h * 0.8 - CARD_H, Math.max(h * 0.4, ay - CARD_H * 0.45))
      } else if (roomAbove >= CARD_H || roomAbove >= roomBelow) {
        // The model spans the frame: the card rides above it, right of the chapter caption.
        side = 1
        targetX = rightX
        targetY = Math.max(h * 0.1, my0 - GAP - CARD_H)
      } else {
        side = 1
        targetX = rightX
        targetY = Math.min(h * 0.86 - CARD_H, my1 + GAP)
      }
      if (lay.fresh) {
        lay.x = targetX
        lay.y = targetY
        lay.side = side
        lay.fresh = false
      } else {
        lay.x += (targetX - lay.x) * 0.12
        lay.y += (targetY - lay.y) * 0.12
        lay.side = side
      }
      if (c) {
        // Left-lane cards hang off their right edge via a relative translate — no layout read.
        c.style.transform = lay.side > 0
          ? `translate3d(${lay.x.toFixed(1)}px, ${(lay.y - 18).toFixed(1)}px, 0)`
          : `translate3d(calc(${lay.x.toFixed(1)}px - 100%), ${(lay.y - 18).toFixed(1)}px, 0)`
        c.style.textAlign = lay.side > 0 ? 'left' : 'right'
        c.style.alignItems = lay.side > 0 ? 'flex-start' : 'flex-end'
      }

      // Anchor reticle: ring draws, amber core pops, a single ping ring expands.
      const reticleIn = span(u, PHASE.reticle) * (1 - span(u, [PHASE.retract[0] + 0.08, 1]))
      // A datum feature gets the Y14.5 filled triangle on the feature instead of a reticle.
      if (datum.current) {
        datum.current.style.visibility = aOn && station.datumFlag ? 'visible' : 'hidden'
        datum.current.setAttribute('transform', `translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${reticleIn.toFixed(3)})`)
      }
      if (reticle.current) {
        reticle.current.style.visibility = aOn && !station.card && !station.datumFlag ? 'visible' : 'hidden'
        reticle.current.setAttribute('transform', `translate(${ax.toFixed(1)} ${ay.toFixed(1)})`)
      }
      ring.current?.setAttribute('stroke-dashoffset', String(1 - reticleIn))
      core.current?.setAttribute('r', String(3.2 * reticleIn))
      if (ping.current) {
        const k = clamp01((u - 0.03) / 0.14)
        ping.current.setAttribute('r', String(9 + 26 * ease(k)))
        ping.current.style.opacity = String(k > 0 && k < 1 ? (1 - k) * 0.7 : 0)
      }

      // Leader: anchor -> elbow -> shelf, drawn out, retracted back into the anchor.
      const leaderK = span(u, PHASE.leader) * (1 - out)
      if (leader.current) {
        const shelfEnd = lay.side > 0 ? lay.x - 10 : lay.x + 10
        const elbowX = shelfEnd - lay.side * 44
        leader.current.setAttribute('points', `${ax},${ay} ${elbowX},${lay.y} ${shelfEnd},${lay.y}`)
        leader.current.setAttribute('stroke-dashoffset', String(1 - leaderK))
        leader.current.style.visibility = aOn && !station.card ? 'visible' : 'hidden'
      }
      if (secondary.current) {
        const [sx, sy, sOn] = f.secondary
        const shelfEnd = lay.side > 0 ? lay.x - 10 : lay.x + 10
        const elbowX = shelfEnd - lay.side * 44
        secondary.current.setAttribute('points', `${sx},${sy} ${elbowX},${lay.y}`)
        secondary.current.setAttribute('stroke-dashoffset', String(1 - span(u, [0.18, 0.34]) * (1 - out)))
        secondary.current.style.visibility = sOn && station.secondary ? 'visible' : 'hidden'
      }

      // S1: phantom centreline through the whole stack, with a glint travelling along it.
      if (axis.current) {
        const [x1, y1, x2, y2, on] = f.axis
        const k = span(u, [0.04, 0.3]) * (1 - out)
        axis.current.style.visibility = on && station.centreline ? 'visible' : 'hidden'
        axis.current.setAttribute('x1', String(x1))
        axis.current.setAttribute('y1', String(y1))
        axis.current.setAttribute('x2', String(x1 + (x2 - x1) * k))
        axis.current.setAttribute('y2', String(y1 + (y2 - y1) * k))
        if (glint.current) {
          const g = clamp01((u - 0.3) / 0.36)
          glint.current.style.visibility = on && station.centreline && g > 0 && g < 1 ? 'visible' : 'hidden'
          glint.current.setAttribute('cx', String(x1 + (x2 - x1) * g))
          glint.current.setAttribute('cy', String(y1 + (y2 - y1) * g))
        }
      }

      // Frames: outline draws, then cells arrive one by one.
      if (c) {
        const frameK = span(u, PHASE.frame) * (1 - out)
        c.querySelectorAll<SVGRectElement>('[data-outline]').forEach((rect) => {
          rect.setAttribute('stroke-dashoffset', String(1 - frameK))
        })
        const cells = c.querySelectorAll<HTMLElement>('[data-cell]')
        cells.forEach((cell, i) => {
          const [a, b] = PHASE.cells
          const slot = (b - a) / Math.max(cells.length, 1)
          const k = ease((u - a - i * slot) / (slot * 1.4)) * (1 - out)
          cell.style.opacity = String(k)
          cell.style.transform = `translate3d(0, ${((1 - k) * 6).toFixed(1)}px, 0)`
        })
        // Typing: each line types in over its own slice of the type window.
        const typed = c.querySelectorAll<HTMLElement>('[data-type-src]')
        typed.forEach((node, i) => {
          const full = node.dataset.typeSrc ?? ''
          const [a, b] = PHASE.type
          const start = a + (i / Math.max(typed.length, 1)) * (b - a) * 0.6
          const k = clamp01((u - start) / ((b - a) * 0.55)) * (1 - out)
          const n = Math.round(full.length * k)
          if (node.textContent?.length !== n) node.textContent = full.slice(0, n)
        })
      }
    }
    registerStationOverlay(apply)
    return () => registerStationOverlay(null)
  }, [index])

  const station = index >= 0 ? STATIONS[index] : null

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[12] select-none" style={{ visibility: 'hidden', color: CREAM }}>
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <line ref={axis} stroke={CREAM} strokeWidth={1.25} strokeDasharray="34 6 6 6 6 6" strokeLinecap="round" opacity={0.85} />
        <circle ref={glint} r={4} fill={AMBER} style={{ filter: 'drop-shadow(0 0 8px #f2a24a)' }} />
        <polyline ref={secondary} fill="none" stroke={CREAM} strokeWidth={1.25} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} opacity={0.7} />
        <polyline ref={leader} fill="none" stroke={CREAM} strokeWidth={1.5} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
        <g ref={datum}>
          <path d="M-9 0 H9 L0 -13 Z" fill={AMBER} stroke={AMBER} strokeWidth={1.25} strokeLinejoin="round" />
          <path d="M-18 0 H18" stroke={CREAM} strokeWidth={1.5} strokeLinecap="round" />
        </g>
        <g ref={reticle}>
          <circle ref={ping} r={9} fill="none" stroke={AMBER} strokeWidth={1.25} opacity={0} />
          <circle ref={ring} r={9} fill="none" stroke={AMBER} strokeWidth={1.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} transform="rotate(-90)" />
          <path d="M-15 0 H-11 M11 0 H15 M0 -15 V-11 M0 11 V15" stroke={AMBER} strokeWidth={1.25} strokeLinecap="round" />
          <circle ref={core} r={0} fill={AMBER} />
        </g>
      </svg>
      <div ref={card} className="station-card absolute left-0 top-0 flex flex-col">
        {station && <StationCard key={station.id} station={station} />}
      </div>
    </div>
  )
}
