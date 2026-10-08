import { Vector3 } from 'three'
import type { DrawingGeometry, DrawingLayout } from '../drawingGeometry'
import { GROUP, InkBuilder, PEN, PEN_COLOR, withPenColor } from './ink'
import { handCircle, handLine, handwrite, strokeLength, type HandStroke, type Pt } from './handwriting'

/**
 * JG-035 owner revisions (2026-10-07) — handwritten margin notes and the personal title/revision block.
 *
 * One module owns the words, the measured anchors and the pen paths, so the live sheet, the cached asset,
 * the readable DOM equivalent and the static poster all say exactly the same thing. Nothing here draws
 * pixels: it appends deterministic strokes to the InkBuilder and returns the anchors it used.
 */

export const OWNER_TITLE = { name: 'MARK HINTZ', role: 'Digital Systems Architect' } as const

/** Revisions A/B/C in the owner's listed order. No dates, initials or approvals are implied. */
export const OWNER_CAREER = [
  { rev: 'A', organization: 'Myers-Seth Pumps', scope: 'Product Design / R&D / 3D Product Visualizer' },
  { rev: 'B', organization: 'Special Tool Solutions', scope: 'Lead Mechanical Designer / Product Development / 3D Product Visualization / Data Management' },
  { rev: 'C', organization: 'Black Creek Precision', scope: 'Lead Mechanical Design / Product Development / Reverse Engineering / Materials and Processes' },
] as const

/** Suggested extra title-block fields (confirmed project facts only; no dates, certifications or contacts). */
export const OWNER_EXTRA_FIELDS = [
  ['DRAWN BY', 'M. HINTZ'],
  ['DISCIPLINE', 'PRODUCT DESIGN & DIGITAL SYSTEMS'],
  ['METHODS', 'CAD / VISUALIZATION / PROCESS DEVELOPMENT'],
  ['PORTFOLIO', 'ENGINEERING PROJECTS'],
] as const

/** The words on the paper. Letter-for-letter the owner's request; the DOM/static copy reads these arrays. */
export const OWNER_NOTES = {
  input: {
    lead: ['Failure point.', 'Alternate materials??'],
    alloys: ['4140', '4340', 'C300'],
    decision: ['change manufacturing method...', 'ROTARY HOBB IN LATHE!'],
  },
  output: ['Run FEA. Material?', 'Try C300 - Heat treat', 'to 52 to 54 HRC.'],
} as const

/** Plain reading of each note (static/DOM equivalent, transcript). */
export const OWNER_NOTE_TEXT = {
  input: 'Failure point. Alternate materials?? 4140, 4340 and C300 are each crossed off in red. Then: change manufacturing method... ROTARY HOBB IN LATHE! (circled)',
  output: 'Run FEA. Material? Try C300 - Heat treat to 52 to 54 HRC.',
} as const

/**
 * Input-shaft sun gear (P001835, section A–A). Measured from Default.glb before the rig consolidates the
 * part into shared buckets: z extent of the toothed land (vertices at the 6.0835 mm tip radius above the relief groove) and the tip radius of the 10-tooth sun, in the raw
 * CAD frame. `rigCenter` (recorded by `snapshotDrawing`) converts to the recentred drawing frame.
 */
export const SUN_GEAR = { rawZMm: [-78.6, -72.7] as const, tipRadiusMm: 6.0835 } as const

export function sunGearModelPoint(data: Pick<DrawingGeometry, 'units' | 'rigCenter'>): Vector3 {
  const axisX = data.units.housing ? (data.units.housing.min.x + data.units.housing.max.x) / 2 : 0
  const zMid = ((SUN_GEAR.rawZMm[0] + SUN_GEAR.rawZMm[1]) / 2) * 1e-3 - data.rigCenter.z
  return new Vector3(axisX, 0, zMid)
}

/** Name every anchor the camera / proof hooks may point at. */
export interface OwnerAnnotationMarks {
  inputNote: [number, number]
  inputGear: [number, number]
  outputNote: [number, number]
  outputSpindle: [number, number]
  titleName: [number, number]
  career: [number, number]
}

export interface AnnotationContext {
  ink: InkBuilder
  /** Sheet position and radius of the (relocated) Detail B circle, 2:1. */
  detailB: { at: [number, number]; radius: number }
  /** Section A–A: model -> sheet transform and scale. */
  section: { transform: import('three').Matrix4; scale: number }
  data: Pick<DrawingGeometry, 'units' | 'rigCenter' | 'bounds'>
  layout: Pick<DrawingLayout, 'views'>
}

/** Uniform half-width for supplementary vector lettering in sheet metres. */
const PEN_HAND = 0.00024
/** Heavier pen for marks that sit on the dense section linework, where a fine graphite line would be lost. */
const PEN_HAND_HEAVY = 0.0005
const CAP = 0.0038
const PITCH = 0.0068

/** Slow, deterministic, never-the-same line spacing and margin wander for the hand (sheet metres). */
const wobbleOf = (k: number, amplitude: number): number => Math.sin(k * 12.9898 + 3.1) * amplitude

type PenColour = (typeof PEN_COLOR)[keyof typeof PEN_COLOR]

/**
 * Emit hand strokes as one continuous pen over [key0, key1] of the group reveal, weighted by pen travel.
 * Bare point lists take `colour`; a HandStroke marked `red` always draws red, and every stroke's width is
 * `width` times its own `pressure`. Unmarked hand strokes are graphite.
 */
function pen(ink: InkBuilder, strokes: (HandStroke | Pt[])[], group: number, key0: number, key1: number, colour: PenColour = PEN_COLOR.graphite, width = PEN_HAND): void {
  const list: HandStroke[] = strokes.map(s => (Array.isArray(s) ? { points: s as Pt[] } : (s as HandStroke)))
  const total = strokeLength(list) || 1
  let walked = 0
  for (const s of list) {
    const len = strokeLength([s])
    const k = key0 + (walked / total) * (key1 - key0)
    const d = Math.max(1e-4, (len / total) * (key1 - key0))
    if (s.letter) {
      const letter = s.letter
      ink.text({ text: letter.ch, x: letter.x, y: letter.y, size: letter.capHeight, group, key: k,
        weight: 'handwriting', color: s.red ? 'red' : colour === PEN_COLOR.red ? 'red' : colour === PEN_COLOR.ink ? 'ink' : 'graphite',
        scaleX: letter.scaleX, rotation: letter.rotation, anchorX: 'left', anchorY: 'baseline', letterSpacing: 0, dur: d,
      })
    } else {
      ink.path(s.points, width * (s.pressure ?? 1), group, k, d, withPenColor(0, s.red ? PEN_COLOR.red : colour))
    }
    walked += len
  }
}

/** A pen path with an explicit pressure, for the loops, leaders and strikes that are not lettering. */
const pressed = (points: Pt[], pressure: number, red = false): HandStroke => (red ? { points, red, pressure } : { points, pressure })

/** Hand-drawn arrowhead at `tip`, pointing along (dx, dy): two short barbs. */
function arrowHead(tip: Pt, dx: number, dy: number, size = 0.0035): HandStroke[] {
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len, uy = dy / len
  const barb = (sign: number): Pt[] => [[tip[0] - ux * size + -uy * size * 0.45 * sign, tip[1] - uy * size + ux * size * 0.45 * sign], tip]
  return [{ points: barb(1), pressure: 1.1 }, { points: barb(-1), pressure: 0.9 }]
}

/**
 * Compose the input-shaft note (beside Detail B), the output-spindle note (beside Section A–A) and their
 * circles / leaders. Returns the anchors. Keys are group-reveal fractions: gear circle + arrow first, then
 * the list is written, then the failures are struck red, then the decision is written and circled.
 */
export function composeOwnerAnnotations(ctx: AnnotationContext): OwnerAnnotationMarks {
  const { ink, detailB, section, data } = ctx

  // ---- Input shaft (P001835 sun gear), Detail B -------------------------------------------------
  const sunOnDetail = detailB.at // Detail B is centred on the sun gear by construction (see composeSheet).
  const sunR = SUN_GEAR.tipRadiusMm * 1e-3 * 2 // 2:1
  const gearCircle = handCircle(sunOnDetail[0], sunOnDetail[1], sunR * 1.32, sunR * 1.2, 5, 1.1, -0.2)
  const nx0 = detailB.at[0] - 0.044
  const noteTop = detailB.at[1] - detailB.radius - 0.0265 // below the DETAIL B label stack (title, scale, note rows)
  // Line pitch is never quite even: each baseline sits a fraction of a millimetre off its nominal row.
  const baseline = (row: number) => noteTop - CAP - row * PITCH + wobbleOf(row + 1, 0.0003)
  const leadStrokes: HandStroke[] = []
  const lead1 = handwrite(OWNER_NOTES.input.lead[0], { x: nx0, y: baseline(0), capHeight: CAP, seed: 21, rotation: 0.012 })
  const lead2 = handwrite(OWNER_NOTES.input.lead[1], { x: nx0 + 0.0006, y: baseline(1), capHeight: CAP, seed: 22, rotation: -0.006 })
  leadStrokes.push(...lead1.strokes, ...lead2.strokes)
  // The alloy list: three separate words so each can be crossed off on its own.
  const alloyX = [nx0, nx0 + 0.027, nx0 + 0.054]
  const alloys = OWNER_NOTES.input.alloys.map((word, i) => handwrite(word, { x: alloyX[i], y: baseline(2), capHeight: CAP * 1.08, seed: 31 + i, rotation: 0.01 - i * 0.006 }))
  const decision1 = handwrite(OWNER_NOTES.input.decision[0], { x: nx0, y: baseline(3.15), capHeight: CAP, penHalfWidth: PEN_HAND, seed: 41, rotation: 0.004 })
  const decision2 = handwrite(OWNER_NOTES.input.decision[1], { x: nx0 + 0.003, y: baseline(4.7), capHeight: CAP * 1.12, seed: 42, rotation: -0.01 })
  const strikes: HandStroke[] = []
  alloys.forEach((alloy, i) => {
    const { x0, x1, y0, y1 } = alloy.bounds
    const mid = (y0 + y1) / 2
    // Two clean, slightly bowed passes extending beyond the alloy word.
    strikes.push(pressed(handLine([x0 - 0.0014, mid - 0.0003], [x1 + 0.0016, mid + 0.0012], 60 + i, 0.00034), 1, true))
    strikes.push(pressed(handLine([x1 + 0.0012, mid + 0.0017], [x0 - 0.001, mid - 0.0012], 70 + i, 0.0004), 1, true))
  })
  const dec = decision2.bounds
  const decCircle = handCircle((dec.x0 + dec.x1) / 2, (dec.y0 + dec.y1) / 2, (dec.x1 - dec.x0) / 2 + 0.0042, (dec.y1 - dec.y0) / 2 + 0.0032, 9, 1.12, -0.03)
  // Leader: starts clear of the DETAIL B label stack (right of "Failure point."), rises along its right-hand side
  // and ends with an arrowhead on the gear circle. Red pen: navy hand-lines vanish into the dense section linework.
  const leaderFrom: Pt = [nx0 + 0.056, baseline(0) + CAP * 0.45]
  const gearEdge: Pt = [sunOnDetail[0] + sunR * 1.2 * Math.cos(-0.62), sunOnDetail[1] + sunR * 1.1 * Math.sin(-0.62)]
  const leaderElbow: Pt = [nx0 + 0.092, baseline(0) + CAP * 0.5]
  const leaderMid: Pt = [nx0 + 0.09, (leaderElbow[1] + gearEdge[1]) / 2]
  const leaderPath: Pt[] = [
    ...handLine(leaderFrom, leaderElbow, 80, 0.0002),
    ...handLine(leaderElbow, leaderMid, 81, 0.0003).slice(1),
    ...handLine(leaderMid, gearEdge, 82, 0.00025).slice(1),
  ]
  const heading = [gearEdge[0] - leaderMid[0], gearEdge[1] - leaderMid[1]] as const

  const G = GROUP.noteInput
  // Red: the failure-point mark on the gear and the strikes. Graphite: every word and the decision circle.
  pen(ink, [pressed(gearCircle, 1, true)], G, 0.0, 0.1, PEN_COLOR.red, 0.0006)
  pen(ink, [pressed(leaderPath, 1, true), ...arrowHead(gearEdge, heading[0], heading[1]).map(a => ({ ...a, red: true }))], G, 0.1, 0.18, PEN_COLOR.red, 0.0005)
  pen(ink, leadStrokes, G, 0.18, 0.4)
  pen(ink, alloys.flatMap(a => a.strokes), G, 0.4, 0.52)
  pen(ink, strikes, G, 0.54, 0.68, PEN_COLOR.red, 0.00026)
  pen(ink, [...decision1.strokes, ...decision2.strokes], G, 0.7, 0.9)
  pen(ink, [pressed(decCircle, 1)], G, 0.9, 1.0, PEN_COLOR.graphite, 0.0003)

  // ---- Output spindle (P000095), Section A–A ---------------------------------------------------
  const o = data.units.output
  const axisX = data.units.housing ? (data.units.housing.min.x + data.units.housing.max.x) / 2 : 0
  const spindle = new Vector3(axisX, 0, o ? (o.min.z + o.max.z) / 2 : 0).applyMatrix4(section.transform)
  const spindleLen = o ? (o.max.z - o.min.z) * section.scale : 0.03
  const spindleDia = o ? (o.max.x - o.min.x) * section.scale : 0.015
  const ring = handCircle(spindle.x, spindle.y, spindleLen / 2 + 0.003, spindleDia / 2 + 0.0032, 13, 1.1, 0.04)
  const ox0 = 0.034
  const oTop = 0.088
  const outLines = OWNER_NOTES.output.map((line, i) => handwrite(line, { x: ox0, y: oTop - CAP - i * PITCH, capHeight: CAP, penHalfWidth: PEN_HAND, seed: 51 + i, rotation: 0.006 }))
  const outRight = Math.max(...outLines.map(l => l.bounds.x1))
  const arrowFrom: Pt = [outRight + 0.003, oTop - CAP - PITCH * 0.3]
  const arrowTo: Pt = [spindle.x - (spindleLen / 2 + 0.003) * 0.92, spindle.y + (spindleDia / 2 + 0.003) * 0.4]
  const outMid: Pt = [(arrowFrom[0] + arrowTo[0]) / 2, (arrowFrom[1] + arrowTo[1]) / 2 + 0.003]
  const outLeader: Pt[] = [...handLine(arrowFrom, outMid, 91, 0.0003), ...handLine(outMid, arrowTo, 92, 0.0003).slice(1)]
  const GO = GROUP.noteOutput
  // The ring and leader cross dense section linework, so they take the heavy graphite pen.
  pen(ink, [pressed(ring, 1)], GO, 0.0, 0.14, PEN_COLOR.graphite, PEN_HAND_HEAVY)
  pen(ink, [pressed(outLeader, 1), ...arrowHead(arrowTo, arrowTo[0] - outMid[0], arrowTo[1] - outMid[1])], GO, 0.14, 0.26, PEN_COLOR.graphite, PEN_HAND_HEAVY)
  pen(ink, outLines.flatMap(l => l.strokes), GO, 0.26, 1.0)

  return {
    inputNote: [nx0 + 0.04, baseline(2.2)],
    inputGear: [...sunOnDetail],
    outputNote: [ox0 + (outRight - ox0) / 2, oTop - 0.01],
    outputSpindle: [spindle.x, spindle.y],
    titleName: [0, 0],
    career: [0, 0],
  }
}

export { PEN }
