import type { Object3D } from 'three'
import type { WrenchRig } from '../rig/nodeRoles'

/**
 * JG-035 TOLERANCE STATIONS — content. Every value here is from the locked fact sheet
 * (`project/work/inbox/JG-035-tolerance-stations-facts.md`, v2 2026-09-25). Part numbers are the
 * logic key; names are display strings only.
 *
 * Windows are on PACED progress, measured against the retained CH.01/CH.02 timeline: the
 * clutch shift close-up owns 0.14–0.17, the housing ghosts 0.26→0.32 and the rear extraction
 * runs 0.31→0.44, so each station sits where its part is on screen.
 */

export type FcfCell =
  | { kind: 'symbol'; symbol: 'TOTAL_RUNOUT' | 'RUNOUT' | 'PROFILE' | 'FLATNESS' | 'DIAMETER' }
  | { kind: 'text'; text: string }
  | { kind: 'datum'; text: string }

export interface StationAnchor {
  /** Rig unit the anchor rides on (follows explode/ghost via matrixWorld). */
  unit?: (rig: WrenchRig) => Object3D | null
  /** Fixed point in the GLTF model frame (drivetrain axis is x = y = 0 along +z there). */
  model?: [number, number, number]
  /** 0..1 along the unit's local z extent. */
  axial?: number
  /** Fraction of the unit's radius, pushed toward the camera (0 = on the unit's axis). */
  radial?: number
}

export interface Station {
  id: string
  window: [number, number]
  part: string
  partNo: string
  note: string
  fcf?: FcfCell[]
  /** A second, smaller frame or callout under the first. */
  fcf2?: FcfCell[]
  anchor: StationAnchor
  secondary?: StationAnchor
  /** Phantom centreline along the drivetrain axis (S1). */
  centreline?: boolean
  /** Datum flag letter drawn at the anchor instead of a reticle. */
  datumFlag?: string
  /** Huge, faint in-canvas process line behind the model. */
  background: string
  /** Summary card: no anchor, no leader. */
  card?: boolean
}

const sym = (symbol: Extract<FcfCell, { kind: 'symbol' }>['symbol']): FcfCell => ({ kind: 'symbol', symbol })
const txt = (text: string): FcfCell => ({ kind: 'text', text })
const dat = (text: string): FcfCell => ({ kind: 'datum', text })

export const STATIONS: Station[] = [
  {
    id: 's4-fork-profile',
    window: [0.128, 0.178],
    part: 'SHIFTER FORK',
    partNo: 'P000724',
    note: 'Profile milled with live tooling. .004 total zone, ±.002 per side.',
    fcf: [sym('PROFILE'), txt('.004'), dat('A'), dat('E')],
    anchor: { unit: (r) => r.clutch.sliding, axial: 0.5, radial: 1 },
    background: 'PROFILE MILLED WITH LIVE TOOLING',
  },
  {
    id: 's5-clutch-fit',
    window: [0.18, 0.222],
    part: 'CLUTCH HOUSING',
    partNo: 'P000420 → P000245',
    note: 'OD and ID both finished after heat treat. Distortion never reaches the fit.',
    fcf: [sym('DIAMETER'), txt('2.525'), txt('H7/k6')],
    fcf2: [sym('TOTAL_RUNOUT'), txt('.001'), dat('A')],
    anchor: { unit: (r) => r.clutch.static, axial: 0.82, radial: 1 },
    background: 'FINISHED AFTER HEAT TREAT',
  },
  {
    id: 'rotor-note',
    window: [0.222, 0.246],
    part: 'AIR MOTOR',
    partNo: 'ROTOR-1',
    note: 'Balanced vane assembly.',
    anchor: { unit: (r) => r.handleRoot, axial: 0.78, radial: 0.35 },
    background: 'BALANCED VANE ASSEMBLY',
  },
  {
    id: 's1-datum-a',
    window: [0.248, 0.302],
    part: 'DATUM A — DRIVETRAIN AXIS',
    partNo: 'P003069 IN P000245',
    note: 'Bearing journals in the housing ID. Every runout on this tool is measured from this axis.',
    fcf2: [sym('FLATNESS'), txt('.0008')],
    anchor: { model: [0, 0, -0.119] },
    centreline: true,
    datumFlag: 'A',
    background: 'EVERY RUNOUT MEASURED FROM ONE AXIS',
  },
  {
    id: 's2-shafts',
    window: [0.305, 0.35],
    part: 'INPUT + OUTPUT SHAFTS',
    partNo: 'P001836 · P000095',
    note: 'Turned and hobbed in one chucking — concentric to the OD by construction.',
    fcf: [sym('TOTAL_RUNOUT'), txt('.001'), dat('A-B')],
    anchor: { unit: (r) => r.outputShaft, axial: 0.3, radial: 1 },
    secondary: { unit: (r) => r.stages.stage1.carrier, axial: 0.5, radial: 0.4 },
    background: 'SINGLE CHUCKING',
  },
  {
    id: 's3-planets',
    window: [0.353, 0.398],
    part: 'PLANET GEARS',
    partNo: 'P001836 … P003047',
    note: 'All gears cut in house. ISO 1328 Grade A6 — high precision.',
    fcf: [sym('RUNOUT'), txt('.001'), dat('D')],
    anchor: { unit: (r) => r.stages.stage4.planets[0] ?? null, axial: 0.5, radial: 1 },
    background: 'ALL GEARS CUT IN HOUSE',
  },
  {
    id: 's6-summary',
    window: [0.402, 0.44],
    part: 'TOLERANCE SUMMARY',
    partNo: 'PTG-HP-1000 · REV 03',
    note: 'All geared parts < .001" TIR · ISO 1328 Grade A6 · Profile .004 · ⌀2.525 H7/k6 finished after heat treat.',
    anchor: {},
    card: true,
    background: '< .001 TIR',
  },
]

/** Local timeline inside a station window (u = 0..1). Scrubbed, so scrolling back retracts. */
export const PHASE = {
  reticle: [0.0, 0.1],
  leader: [0.06, 0.26],
  frame: [0.22, 0.42],
  cells: [0.28, 0.5],
  type: [0.38, 0.62],
  retract: [0.84, 1.0],
} as const
