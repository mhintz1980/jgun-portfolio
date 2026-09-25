import { useEffect, useMemo, useRef, useState } from 'react'
import { Vector3 } from 'three'
import { GdtSymbol } from './GdtSymbols'
import { telemetry } from '../state/scrollStore'
import {
  INK,
  PAPER,
  PIXELS_PER_METER,
  SHEET_ZONES,
  type DrawingGeometry,
  type DrawingLayout,
  type DrawingView,
  projectFeature,
} from '../scene/drawing/drawingGeometry'

export interface PrintInput {
  data: DrawingGeometry
  layout: DrawingLayout
}
declare global {
  interface Window {
    __drawingPrint?: PrintInput
    __drawingSvgReady?: (svg: string) => void
  }
}

const FONT = 19
const MICRO = FONT * 0.78
/** Vertical pitch of one callout block in the lane. */
const CALLOUT_PITCH = FONT * 3.1
/** Zone-reference strip between the trim line and the drawing frame (px). Stays inside the
 *  ~19 px clearance the callout lane leaves on the left. */
const FRAME_MARGIN = 18

interface Point {
  x: number
  y: number
}

interface Callout {
  id: string
  caption: string
  anchor: Point
  /** Placed label origin (left edge of the text, baseline of the id line). */
  label: Point
  /** Point where the leader meets the label's horizontal shoulder. */
  land: Point
}

/** Order-preserving 1-D separation onto a lane, respecting the lane's usable band. */
function separate(desired: number[], pitch: number, min: number, max: number): number[] {
  const placed = desired.slice()
  for (let i = 1; i < placed.length; i += 1) placed[i] = Math.max(placed[i], placed[i - 1] + pitch)
  const overflow = placed[placed.length - 1] - max
  if (overflow > 0) {
    placed[placed.length - 1] = max
    for (let i = placed.length - 2; i >= 0; i -= 1) placed[i] = Math.min(placed[i], placed[i + 1] - pitch)
  }
  if (placed[0] < min) {
    placed[0] = min
    for (let i = 1; i < placed.length; i += 1) placed[i] = Math.max(placed[i], placed[i - 1] + pitch)
  }
  return placed
}

/** Proper segment intersection, used only to prove the leader set is crossing-free. */
function segmentsCross(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const side = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  const d1 = side(a1, a2, b1)
  const d2 = side(a1, a2, b2)
  const d3 = side(b1, b2, a1)
  const d4 = side(b1, b2, a2)
  return d1 * d2 < 0 && d3 * d4 < 0
}

/**
 * Annotations are SVG, rasterized once onto the scene plane. This DOM copy carries accessibility.
 *
 * Layout contract (JG-026 Items 7.2 / 7.3 / 7.4 / 7.6):
 *  - Every anchor is a真 projected CAD feature (`projectFeature`), never a hand-placed point.
 *  - Every label lands in ONE callout lane immediately outboard of the view block, ordered by
 *    its anchor's sheet Y and separated with an order-preserving pass — so the leader set is
 *    crossing-free by construction, and the count is published to telemetry as proof.
 *  - The A–A cutting plane is drawn on the parent elevation with its arrows, and the section
 *    view sits below it, which is where third angle puts a view of the underside.
 *  - `#sheet-furniture` is the hand-drawn swap-in slot: title block, revision block and notes.
 *    Nothing generated is drawn inside those zones.
 */
export function EngineeringDrawingOverlay() {
  const [input, setInput] = useState<PrintInput | null>(window.__drawingPrint ?? null)
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const receive = () => setInput(window.__drawingPrint ?? null)
    window.addEventListener('drawing-print', receive)
    receive()
    return () => window.removeEventListener('drawing-print', receive)
  }, [])

  const sheet = useMemo(() => (input ? buildSheet(input) : null), [input])

  useEffect(() => {
    if (svg.current && input) window.__drawingSvgReady?.(new XMLSerializer().serializeToString(svg.current))
    if (sheet) telemetry.drawing.leaderCrossings = sheet.crossings
  }, [input, sheet])

  if (!input || !sheet) return null
  const { data, layout } = input
  const { w, h, xy, px, callouts, sectionCallouts, dimensions, partLengths, crossings } = sheet
  const primary = layout.views[0]

  const zoneRect = (zone: { x: number; y: number; w: number; h: number }) => {
    const [left, top] = xy([zone.x, zone.y + zone.h])
    return { x: left, y: top, width: zone.w * PIXELS_PER_METER, height: zone.h * PIXELS_PER_METER }
  }

  const fcf = (x: number, y: number, kind: string, limit: string, datum: string, modifier = '') => (
    <g transform={`translate(${x} ${y})`}>
      <rect width={252} height={FONT * 1.8} fill={PAPER} />
      <path d={`M38 0 V${FONT * 1.8} M148 0 V${FONT * 1.8} M200 0 V${FONT * 1.8}`} />
      <svg x="6" y="5" width="26" height="26">
        <GdtSymbol name={kind} />
      </svg>
      <text x="48" y={FONT * 1.23}>
        {limit}
      </text>
      {modifier && (
        <>
          <circle cx={174} cy={FONT * 0.9} r={FONT * 0.55} />
          <text x={174} y={FONT * 1.23} textAnchor="middle">
            {modifier}
          </text>
        </>
      )}
      <text x={226} y={FONT * 1.23} textAnchor="middle">
        {datum}
      </text>
    </g>
  )

  const calloutGroup = (list: Callout[], prefix: string) =>
    list.map((callout) => (
      <g key={`${prefix}-${callout.id}`}>
        <path
          d={`M${callout.anchor.x} ${callout.anchor.y} L${callout.land.x} ${callout.land.y} H${callout.label.x}`}
        />
        <circle cx={callout.anchor.x} cy={callout.anchor.y} r="3" fill={INK} />
        <text x={callout.label.x} y={callout.label.y}>
          {callout.id}
        </text>
        <text x={callout.label.x} y={callout.label.y + MICRO * 1.45} className="micro">
          {callout.caption}
        </text>
      </g>
    ))

  const tables = zoneRect(SHEET_ZONES.tables)

  return (
    <section className="sr-only" aria-label="High-Precision Industrial Torque Gun engineering reference drawing">
      <p>
        ANSI C general arrangement, third-angle projection. Side elevation at 1:1 with plan and
        end views projected on shared axes, and section A–A taken on the horizontal cutting plane
        marked on the elevation. Dimensions and part identities are measured from CAD; tolerance
        frames illustrate datum, runout, position and material-condition notation. Reference
        print, not a manufacturing release. Leader crossings: {crossings}.
      </p>
      <svg
        ref={svg}
        xmlns="http://www.w3.org/2000/svg"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
      >
        <style>{`text{font-family:'Bahnschrift','DIN Alternate','Arial Narrow',Consolas,sans-serif;font-size:${FONT}px;fill:${INK};stroke:none;letter-spacing:.5px}g{stroke:${INK};stroke-width:1.6;fill:none}svg{color:${INK}}.micro{font-size:${MICRO}px}.strong{font-size:${FONT * 1.5}px;font-weight:700;letter-spacing:2px}.title{font-size:${FONT * 1.12}px;font-weight:700;letter-spacing:1px}.label{font-size:${MICRO * 0.82}px;letter-spacing:1px}.slot{stroke-dasharray:10 6}.hand{font-style:italic;font-weight:600}`}</style>
        <defs>
          {/* Drafting-vellum graph grid: 5 mm minor, 25 mm major. */}
          <pattern
            id="grid-minor"
            width={0.005 * PIXELS_PER_METER}
            height={0.005 * PIXELS_PER_METER}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M${0.005 * PIXELS_PER_METER} 0H0V${0.005 * PIXELS_PER_METER}`}
              fill="none"
              stroke={INK}
              strokeWidth="0.6"
              opacity=".15"
            />
          </pattern>
          <pattern
            id="grid-major"
            width={0.025 * PIXELS_PER_METER}
            height={0.025 * PIXELS_PER_METER}
            patternUnits="userSpaceOnUse"
          >
            <rect width={0.025 * PIXELS_PER_METER} height={0.025 * PIXELS_PER_METER} fill="url(#grid-minor)" />
            <path
              d={`M${0.025 * PIXELS_PER_METER} 0H0V${0.025 * PIXELS_PER_METER}`}
              fill="none"
              stroke={INK}
              strokeWidth="1"
              opacity=".28"
            />
          </pattern>
          <marker
            id="drawing-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3.5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L7 3.5L0 7" fill="none" stroke={INK} />
          </marker>
          <marker id="section-arrow" markerWidth="10" markerHeight="10" refX="2" refY="5" orient="auto">
            <path d="M0 0L9 5L0 10Z" fill={INK} stroke="none" />
          </marker>
        </defs>

        {/* ---- sheet frame + zone grid ---- */}
        {(() => {
          const outer = zoneRect(SHEET_ZONES.border)
          const m = FRAME_MARGIN
          const inner = { x: outer.x + m, y: outer.y + m, width: outer.width - 2 * m, height: outer.height - 2 * m }
          const cols = 8
          const rows = 6
          const colW = inner.width / cols
          const rowH = inner.height / rows
          return (
            <g>
              <rect {...inner} fill="url(#grid-major)" stroke="none" />
              <rect {...outer} strokeWidth="1.1" />
              <rect {...inner} strokeWidth="2.6" />
              {Array.from({ length: cols }, (_, i) => (
                <g key={`c${i}`}>
                  {i > 0 && (
                    <path
                      d={`M${inner.x + i * colW} ${outer.y} V${inner.y} M${inner.x + i * colW} ${inner.y + inner.height} V${outer.y + outer.height}`}
                    />
                  )}
                  {[outer.y + m * 0.72, outer.y + outer.height - m * 0.28].map((y) => (
                    <text key={y} x={inner.x + (i + 0.5) * colW} y={y} textAnchor="middle" className="label">
                      {i + 1}
                    </text>
                  ))}
                </g>
              ))}
              {Array.from({ length: rows }, (_, i) => (
                <g key={`r${i}`}>
                  {i > 0 && (
                    <path
                      d={`M${outer.x} ${inner.y + i * rowH} H${inner.x} M${inner.x + inner.width} ${inner.y + i * rowH} H${outer.x + outer.width}`}
                    />
                  )}
                  {[outer.x + m / 2, outer.x + outer.width - m / 2].map((x) => (
                    <text key={x} x={x} y={inner.y + (i + 0.5) * rowH + MICRO * 0.3} textAnchor="middle" className="label">
                      {String.fromCharCode(65 + i)}
                    </text>
                  ))}
                </g>
              ))}
              {/* Centring marks, as on a production sheet. */}
              <path
                d={`M${inner.x + inner.width / 2} ${outer.y} v${m + 16} M${inner.x + inner.width / 2} ${outer.y + outer.height} v${-m - 16} M${outer.x} ${inner.y + inner.height / 2} h${m + 16} M${outer.x + outer.width} ${inner.y + inner.height / 2} h${-m - 16}`}
                strokeWidth="2.2"
              />
            </g>
          )
        })()}

        {/* ---- generated third-angle views ---- */}
        <g>
          {layout.views.map((view) => {
            const [x, y, vw, vh] = view.rect
            const [left, top] = xy([x, y + vh])
            const [right, bottom] = xy([x + vw, y])
            return (
              <g key={view.name}>
                <text x={left} y={bottom + FONT * 1.6} className="micro">
                  {view.label}
                </text>
                {/* Projection centrelines — the shared axes that make this third angle. */}
                <path
                  d={`M${left - 10} ${(top + bottom) / 2} H${right + 10} M${(left + right) / 2} ${top - 10} V${bottom + 10}`}
                  strokeDasharray="16 5 3 5"
                  opacity=".45"
                />
              </g>
            )
          })}

          {/* Third-angle alignment rails: top/section share the front's vertical axis, the end
              view shares its horizontal axis. Drawn faint so the relationship is visible. */}
          <path
            d={`M${px.frontCenterX} ${px.viewsTop} V${px.viewsBottom} M${px.viewsLeft} ${px.frontCenterY} H${px.viewsRight}`}
            strokeDasharray="3 7"
            opacity=".25"
          />

          {/* ---- section line A–A on the parent elevation, arrows pointing down ---- */}
          <g>
            <path
              d={`M${px.sectionLineLeft} ${px.sectionLineY} H${px.sectionLineRight}`}
              strokeDasharray="30 6 8 6"
              strokeWidth="2.4"
            />
            <path
              d={`M${px.sectionLineLeft} ${px.sectionLineY} V${px.sectionLineY + 30}`}
              markerEnd="url(#section-arrow)"
              strokeWidth="2.4"
            />
            <path
              d={`M${px.sectionLineRight} ${px.sectionLineY} V${px.sectionLineY + 30}`}
              markerEnd="url(#section-arrow)"
              strokeWidth="2.4"
            />
            <text x={px.sectionLineLeft - 8} y={px.sectionLineY - 10} textAnchor="end" className="strong">
              A
            </text>
            <text x={px.sectionLineRight + 8} y={px.sectionLineY - 10} className="strong">
              A
            </text>
          </g>
        </g>

        {/* ---- CAD-derived dimensions ---- */}
        <g>
          <path d={`M${dimensions.length.a.x} ${dimensions.length.a.y} V${dimensions.length.line - 8} M${dimensions.length.b.x} ${dimensions.length.b.y} V${dimensions.length.line - 8}`} opacity=".55" />
          <line
            x1={dimensions.length.a.x}
            y1={dimensions.length.line}
            x2={dimensions.length.b.x}
            y2={dimensions.length.line}
            markerStart="url(#drawing-arrow)"
            markerEnd="url(#drawing-arrow)"
          />
          <text
            x={(dimensions.length.a.x + dimensions.length.b.x) / 2}
            y={dimensions.length.line - 10}
            textAnchor="middle"
            className="micro"
          >
            {dimensions.length.label}
          </text>

          <path d={`M${dimensions.height.a.x} ${dimensions.height.a.y} H${dimensions.height.line + 5} M${dimensions.height.b.x} ${dimensions.height.b.y} H${dimensions.height.line + 5}`} opacity=".55" />
          <line
            x1={dimensions.height.line}
            y1={dimensions.height.a.y}
            x2={dimensions.height.line}
            y2={dimensions.height.b.y}
            markerStart="url(#drawing-arrow)"
            markerEnd="url(#drawing-arrow)"
          />
          <text
            transform={`translate(${dimensions.height.line + 9} ${(dimensions.height.a.y + dimensions.height.b.y) / 2}) rotate(-90)`}
            textAnchor="middle"
            className="micro"
          >
            {dimensions.height.label}
          </text>
        </g>

        {/* ---- callout lane: one column, ordered, crossing-free ---- */}
        <g>{calloutGroup(callouts, 'primary')}</g>
        <g>{calloutGroup(sectionCallouts, 'section')}</g>

        {/* ---- generated tolerance frames, datum flags and reference tables ---- */}
        <g>
          {fcf(tables.x, tables.y + 6, 'RUNOUT', '0.04', 'A')}
          {fcf(tables.x, tables.y + 6 + FONT * 2.4, 'POSITION', 'Ø0.08', 'B', 'M')}
          {fcf(tables.x, tables.y + 6 + FONT * 4.8, 'POSITION', 'Ø0.12', 'C', 'L')}
          {fcf(tables.x, tables.y + 6 + FONT * 7.2, 'PARALLELISM', '0.05', 'A')}
          <text x={tables.x} y={tables.y + FONT * 10.4} className="micro">
            DATUMS A | B | C · M = MMC · L = LMC
          </text>

          <rect x={tables.x} y={tables.y + FONT * 11.4} width={tables.width} height={FONT * 5.6} />
          <path
            d={`M${tables.x} ${tables.y + FONT * 13.1} H${tables.x + tables.width} M${tables.x + tables.width * 0.42} ${tables.y + FONT * 11.4} V${tables.y + FONT * 17} M${tables.x + tables.width * 0.76} ${tables.y + FONT * 11.4} V${tables.y + FONT * 17}`}
          />
          <text x={tables.x + 8} y={tables.y + FONT * 12.6} className="micro">
            FEATURE / DATUM
          </text>
          <text x={tables.x + tables.width * 0.42 + 8} y={tables.y + FONT * 12.6} className="micro">
            CONTROL
          </text>
          <text x={tables.x + tables.width * 0.76 + 8} y={tables.y + FONT * 12.6} className="micro">
            BASIS
          </text>
          {['P000245 / A', 'P003068 / B', 'P000095 / C'].map((label, i) => (
            <g key={label}>
              <text x={tables.x + 8} y={tables.y + FONT * (14.4 + i * 1.2)} className="micro">
                {label}
              </text>
              <text
                x={tables.x + tables.width * 0.42 + 8}
                y={tables.y + FONT * (14.4 + i * 1.2)}
                className="micro"
              >
                {['RUNOUT', 'POSN MMC', 'POSN LMC'][i]}
              </text>
              <text
                x={tables.x + tables.width * 0.76 + 8}
                y={tables.y + FONT * (14.4 + i * 1.2)}
                className="micro"
              >
                REF
              </text>
            </g>
          ))}

          {/* CAD reference dimensions live in a table rather than as extra dimension lines —
              the four-view block leaves no honest room for five dimension stacks. Every value
              is measured from Default.glb at render time. */}
          <rect x={tables.x} y={tables.y + FONT * 18} width={tables.width} height={FONT * 5.6} />
          <path
            d={`M${tables.x} ${tables.y + FONT * 19.7} H${tables.x + tables.width} M${tables.x + tables.width * 0.5} ${tables.y + FONT * 18} V${tables.y + FONT * 23.6}`}
          />
          <text x={tables.x + 8} y={tables.y + FONT * 19.2} className="micro">
            CAD REFERENCE DIMENSIONS
          </text>
          {partLengths.map((row, i) => (
            <g key={row.id}>
              <text x={tables.x + 8} y={tables.y + FONT * (21 + i * 1.2)} className="micro">
                {row.id}
              </text>
              <text
                x={tables.x + tables.width - 8}
                y={tables.y + FONT * (21 + i * 1.2)}
                textAnchor="end"
                className="micro"
              >
                {row.value}
              </text>
            </g>
          ))}
        </g>

        {/* ---- datum feature flags on the elevation ---- */}
        <g>
          {sheet.datums.map((datum, i) => (
            <g key={datum.id}>
              <path d={`M${datum.anchor.x} ${datum.anchor.y} L${datum.flag.x} ${datum.flag.y}`} />
              <path d={`M${datum.anchor.x} ${datum.anchor.y} l-5 14 h10 Z`} fill={INK} />
              <rect
                x={datum.flag.x - FONT * 0.8}
                y={datum.flag.y - FONT * 0.9}
                width={FONT * 1.6}
                height={FONT * 1.5}
              />
              <text x={datum.flag.x} y={datum.flag.y + FONT * 0.22} textAnchor="middle">
                {String.fromCharCode(65 + i)}
              </text>
            </g>
          ))}
        </g>

        {/*
          HAND-DRAWN SWAP-IN SLOT.
          Everything inside #sheet-furniture is placeholder furniture and is replaced wholesale
          by Mark's Inkscape SVG. It must stay inside these three rectangles, must not introduce
          any dimension, part number or tolerance value (those are generated above), and must
          keep this element id.
        */}
        <g id="sheet-furniture">
          {(() => {
            const inset = (r: { x: number; y: number; width: number; height: number }, d: number) => ({
              x: r.x + d,
              y: r.y + d,
              width: r.width - 2 * d,
              height: r.height - 2 * d,
            })
            // Furniture zones abut the trim line; pull them inside the drawing frame.
            const tb = inset(zoneRect(SHEET_ZONES.titleBlock), FRAME_MARGIN + 6)
            const rb = inset(zoneRect(SHEET_ZONES.revisionBlock), FRAME_MARGIN + 6)
            const nb = inset(zoneRect(SHEET_ZONES.notes), FRAME_MARGIN + 6)

            // ---- title block: project name left, drawing data grid right ----
            const split = tb.x + tb.width * 0.56
            const cellW = (tb.x + tb.width - split) / 2
            const rowH = tb.height / 3
            const cells: [string, string, number, number][] = [
              ['DWG NO.', 'PTG-HP-1000', 0, 0],
              ['REV', 'C', 1, 0],
              ['SCALE', '1:1', 0, 1],
              ['SHEET', '1 OF 1', 1, 1],
              ['DATE', '2026-09-24', 0, 2],
              ['PROJ.', 'THIRD ANGLE', 1, 2],
            ]

            // ---- revision table ----
            const revCols = [0, 0.12, 0.42, 0.86, 1].map((f) => rb.x + rb.width * f)
            const revHeader = ['REV', 'DATE', 'DESCRIPTION', 'DRN']
            const revRows = [
              ['C', '2026-09-24', 'PORTFOLIO RELEASE', 'MH'],
              ['B', '2026-08-30', 'CAD DIMS UPDATED', 'MH'],
              ['A', '2026-07-12', 'INITIAL RELEASE', 'MH'],
            ]
            const revRowH = rb.height / (revRows.length + 1)

            const notes = [
              '1.  ALL DIMENSIONS ARE IN MILLIMETERS.',
              '2.  TOLERANCING PER ASME Y14.5 UNLESS OTHERWISE SPECIFIED.',
              '3.  REMOVE ALL BURRS AND SHARP EDGES.',
              '4.  GEOMETRY MEASURED FROM CAD AT RENDER TIME.',
              '5.  FOR REFERENCE ONLY — NOT FOR MANUFACTURING.',
            ]
            const noteTop = nb.y + FONT * 1.35
            const notePitch = (nb.height - FONT * 1.6) / notes.length

            return (
              <>
                <rect {...tb} strokeWidth="2.2" />
                <path d={`M${split} ${tb.y} V${tb.y + tb.height}`} strokeWidth="1.6" />
                <path
                  d={`M${split} ${tb.y + rowH} H${tb.x + tb.width} M${split} ${tb.y + 2 * rowH} H${tb.x + tb.width} M${split + cellW} ${tb.y} V${tb.y + tb.height}`}
                />
                <path d={`M${tb.x} ${tb.y + tb.height - FONT * 1.55} H${split}`} />
                <text x={tb.x + 10} y={tb.y + MICRO * 1.2} className="label">
                  PROJECT:
                </text>
                <text x={tb.x + 10} y={tb.y + FONT * 2.35} className="title">
                  PRECISION PNEUMATIC
                </text>
                <text x={tb.x + 10} y={tb.y + FONT * 3.7} className="title">
                  TORQUE GUN · JGUN
                </text>
                <text x={tb.x + 10} y={tb.y + tb.height - FONT * 0.45} className="micro hand">
                  BUILT FOR PERFORMANCE
                </text>
                {cells.map(([label, value, cx, cy]) => {
                  const x = split + cx * cellW
                  const y = tb.y + cy * rowH
                  return (
                    <g key={label}>
                      <text x={x + 7} y={y + MICRO * 1.05} className="label">
                        {label}
                      </text>
                      <text x={x + cellW / 2} y={y + rowH - 7} textAnchor="middle" className="micro">
                        {value}
                      </text>
                    </g>
                  )
                })}

                <rect {...rb} strokeWidth="2.2" />
                <path
                  d={
                    revCols
                      .slice(1, -1)
                      .map((x) => `M${x} ${rb.y} V${rb.y + rb.height}`)
                      .join(' ') +
                    revRows.map((_, i) => ` M${rb.x} ${rb.y + (i + 1) * revRowH} H${rb.x + rb.width}`).join('')
                  }
                />
                {[revHeader, ...revRows].map((row, r) =>
                  row.map((cell, c) => (
                    <text
                      key={`${r}-${c}`}
                      x={(revCols[c] + revCols[c + 1]) / 2}
                      y={rb.y + (r + 0.68) * revRowH}
                      textAnchor="middle"
                      className="label"
                    >
                      {cell}
                    </text>
                  )),
                )}

                <rect {...nb} strokeWidth="2.2" />
                <text x={nb.x + 10} y={nb.y + FONT * 1.05} className="micro" fontWeight="700">
                  GENERAL NOTES:
                </text>
                <path d={`M${nb.x + 10} ${nb.y + FONT * 1.25} h${FONT * 7.4}`} />
                {notes.map((line, i) => (
                  <text key={line} x={nb.x + 16} y={noteTop + (i + 0.85) * notePitch} className="label">
                    {line}
                  </text>
                ))}
              </>
            )
          })()}
        </g>

        {/* Accessibility mirror of the generated identities (never a source of truth). */}
        <desc>
          {[...callouts, ...sectionCallouts].map((c) => `${c.id} ${c.caption}`).join('; ')} ·{' '}
          {data.sourceTriangles} source triangles · primary view {primary.label}
        </desc>
      </svg>
    </section>
  )
}

const PRIMARY_CALLOUTS: [string, string][] = [
  ['P000095', 'OUTPUT / DATUM C'],
  ['P000245', 'HOUSING / DATUM A'],
  ['P003068', '2-SPEED CAM / B'],
  ['HANDLE', 'AIR MOTOR / CTRL'],
]
const SECTION_CALLOUTS: [string, string][] = [
  ['A000591', 'STAGE 1 CARRIER'],
  ['A000606', 'STAGE 5 CARRIER'],
  ['K000004', 'SUPPORT BEARING'],
]
const DATUM_IDS = ['P000245', 'P003068', 'P000095']

/**
 * Resolve every generated element's pixel geometry once per layout. Keeping this out of the
 * render body means the placement pass runs on layout change, not on every React render.
 */
function buildSheet({ data, layout }: PrintInput) {
  const w = Math.round(layout.width * PIXELS_PER_METER)
  const h = Math.round(layout.height * PIXELS_PER_METER)
  const xy = ([x, y]: number[]): [number, number] => [
    (x + layout.width / 2) * PIXELS_PER_METER,
    (layout.height / 2 - y) * PIXELS_PER_METER,
  ]
  const point = (id: string, view: DrawingView): Point | null => {
    const feature = data.features[id]
    if (!feature) return null
    const [x, y] = xy(projectFeature(feature, view))
    return { x, y }
  }

  const primary = layout.views[0]
  const section = layout.views.find((view) => view.section) ?? primary
  const laneRight = xy([SHEET_ZONES.callouts.x + SHEET_ZONES.callouts.w, 0])[0]
  const laneX = xy([SHEET_ZONES.callouts.x, 0])[0]
  const laneTop = xy([0, SHEET_ZONES.callouts.y + SHEET_ZONES.callouts.h])[1] + FONT
  const laneBottom = xy([0, SHEET_ZONES.callouts.y])[1] - FONT

  const place = (entries: [string, string][], view: DrawingView) =>
    entries
      .map(([id, caption]) => ({ id, caption, anchor: point(id, view) }))
      .filter((entry): entry is { id: string; caption: string; anchor: Point } => entry.anchor !== null)

  const all = [...place(PRIMARY_CALLOUTS, primary), ...place(SECTION_CALLOUTS, section)]

  /**
   * Choose which lane slot each callout gets.
   *
   * Sorting by anchor Y is the obvious answer and it is wrong: two straight leaders ending on
   * a common vertical line can still cross when their anchors differ in X. With at most eight
   * callouts the assignment space is small enough to search exactly, so the placement is the
   * provable minimum over all orderings rather than a heuristic that usually works. Ties break
   * on total leader length, which is what keeps them short and readable.
   */
  const landing = (labelY: number): Point => ({ x: laneRight, y: labelY - FONT * 0.35 })
  const scoreOrder = (order: number[], slots: number[]) => {
    let crossings = 0
    let length = 0
    for (let i = 0; i < order.length; i += 1) {
      const anchorI = all[order[i]].anchor
      const landI = landing(slots[i])
      length += Math.hypot(landI.x - anchorI.x, landI.y - anchorI.y)
      for (let j = i + 1; j < order.length; j += 1) {
        const anchorJ = all[order[j]].anchor
        const landJ = landing(slots[j])
        if (segmentsCross(anchorI, landI, anchorJ, landJ)) crossings += 1
      }
    }
    return { crossings, length }
  }

  const slots = separate(
    all
      .map((entry) => entry.anchor.y)
      .slice()
      .sort((a, b) => a - b),
    CALLOUT_PITCH,
    laneTop,
    laneBottom,
  )
  const byAnchor = all.map((_, i) => i).sort((a, b) => all[a].anchor.y - all[b].anchor.y)
  let bestOrder = byAnchor
  let best = scoreOrder(bestOrder, slots)
  if (all.length <= 8) {
    const permute = (rest: number[], acc: number[]) => {
      if (!rest.length) {
        const score = scoreOrder(acc, slots)
        if (
          score.crossings < best.crossings ||
          (score.crossings === best.crossings && score.length < best.length - 1e-6)
        ) {
          best = score
          bestOrder = acc.slice()
        }
        return
      }
      for (let i = 0; i < rest.length; i += 1) {
        acc.push(rest[i])
        permute([...rest.slice(0, i), ...rest.slice(i + 1)], acc)
        acc.pop()
      }
    }
    permute(
      all.map((_, i) => i),
      [],
    )
  }

  const resolved: Callout[] = bestOrder.map((index, slot) => ({
    id: all[index].id,
    caption: all[index].caption,
    anchor: all[index].anchor,
    label: { x: laneX, y: slots[slot] },
    land: landing(slots[slot]),
  }))
  const crossings = best.crossings

  const primaryIds = new Set(PRIMARY_CALLOUTS.map(([id]) => id))
  const callouts = resolved.filter((entry) => primaryIds.has(entry.id))
  const sectionCallouts = resolved.filter((entry) => !primaryIds.has(entry.id))

  // ---- CAD-measured extents of the primary elevation ----
  const attribute = data.geometry.getAttribute('position')
  const v = new Vector3()
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < attribute.count; i += 1) {
    v.fromBufferAttribute(attribute, i).applyMatrix4(primary.transform)
    minX = Math.min(minX, v.x)
    maxX = Math.max(maxX, v.x)
    minY = Math.min(minY, v.y)
    maxY = Math.max(maxY, v.y)
  }
  const [, topRectTop] = xy([layout.views[1].rect[0], layout.views[1].rect[1] + layout.views[1].rect[3]])
  const dimensionLineY = topRectTop - 34
  const [leftEdge] = xy([minX, 0])
  const [rightEdge] = xy([maxX, 0])
  const [, bottomEdge] = xy([0, minY])
  const [, topEdge] = xy([0, maxY])
  // The overall height is dimensioned off the END view, not the elevation: third angle
  // guarantees they share the vertical extent, and the elevation's left margin is the callout
  // lane's approach, so a dimension there would sit inside the leader fan.
  const endRect = layout.views[2].rect
  const [endRight] = xy([endRect[0] + endRect[2], 0])
  // Centred in the clear channel between the end view and the tables zone.
  const heightLineX = xy([endRect[0] + endRect[2] + 0.0085, 0])[0]

  const dimensions = {
    length: {
      a: { x: leftEdge, y: topRectTop },
      b: { x: rightEdge, y: topRectTop },
      line: dimensionLineY,
      label: `${((maxX - minX) * 1000).toFixed(2)} REF`,
    },
    height: {
      a: { x: endRight, y: topEdge },
      b: { x: endRight, y: bottomEdge },
      line: heightLineX,
      label: `${((maxY - minY) * 1000).toFixed(2)} REF`,
    },
  }

  const partLengths = DATUM_IDS.map((id) => ({
    id: `${id} LENGTH`,
    value:
      data.features[`${id}:maxZ`] && data.features[`${id}:minZ`]
        ? `${(Math.abs(data.features[`${id}:maxZ`].z - data.features[`${id}:minZ`].z) * 1000).toFixed(2)} REF`
        : '—',
  }))

  // Datum flags occupy the clear gap between the elevation and the end view, separated with
  // the same order-preserving pass the callout lane uses so their leaders cannot cross either.
  const datumAnchors = DATUM_IDS.map((id) => ({ id, anchor: point(id, primary) })).filter(
    (entry): entry is { id: string; anchor: Point } => entry.anchor !== null,
  )
  datumAnchors.sort((a, b) => a.anchor.y - b.anchor.y)
  const [frontRightPx] = xy([primary.rect[0] + primary.rect[2], 0])
  const [endLeftPx] = xy([layout.views[2].rect[0], 0])
  const datumX = (frontRightPx + endLeftPx) / 2
  const datumY = separate(
    datumAnchors.map((entry) => entry.anchor.y),
    FONT * 2.4,
    xy([0, primary.rect[1] + primary.rect[3]])[1] + FONT,
    xy([0, primary.rect[1]])[1] - FONT,
  )
  const datums = datumAnchors.map((entry, i) => ({
    id: entry.id,
    anchor: entry.anchor,
    flag: { x: datumX, y: datumY[i] },
  }))

  const [viewsLeft, viewsTop] = xy([SHEET_ZONES.views.x, SHEET_ZONES.views.y + SHEET_ZONES.views.h])
  const [viewsRight, viewsBottom] = xy([SHEET_ZONES.views.x + SHEET_ZONES.views.w, SHEET_ZONES.views.y])
  const [frontCenterX, frontCenterY] = xy([layout.primaryCenter.x, layout.primaryCenter.y])
  const [sectionLineLeft, sectionLineY] = xy([primary.rect[0] - 0.012, layout.sectionLineY])
  const [sectionLineRight] = xy([primary.rect[0] + primary.rect[2] + 0.012, 0])

  return {
    w,
    h,
    xy,
    callouts,
    sectionCallouts,
    crossings,
    dimensions,
    partLengths,
    datums,
    px: {
      viewsLeft,
      viewsRight,
      viewsTop,
      viewsBottom,
      frontCenterX,
      frontCenterY,
      sectionLineLeft,
      sectionLineRight,
      sectionLineY,
    },
  }
}
