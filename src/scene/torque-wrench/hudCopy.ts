// HUD copy deck (owner-approved 2026-11-05): one step line per beat, rail tooltips and term
// tooltips. Facts only from the locked tolerance fact sheet and owner rulings. The 3250:1
// cascade and its gear speeds are cinematic and must never appear here as a spec.
import type { TorquePosterChapterId } from './posterMap'

export interface TorqueHudStep {
  /** Chapter the step is numbered under (the displayed HUD chapter, not the poster chapter). */
  readonly chapter: TorquePosterChapterId
  readonly n: number
  readonly label: string
}

/** Keyed by beat id (beats.ts). Every beat has one entry; see hudCopy.test.ts. */
export const TORQUE_HUD_STEPS: Readonly<Record<string, TorqueHudStep>> = Object.freeze({
  'drafting-detail': { chapter: 'drafting', n: 1, label: 'Engineering detail' },
  'drafting-authorship': { chapter: 'drafting', n: 2, label: 'Title block' },
  'drafting-input-note': { chapter: 'drafting', n: 3, label: 'Note · input shaft P001835' },
  'drafting-output-note': { chapter: 'drafting', n: 4, label: 'Note · output shaft' },
  'drafting-rake': { chapter: 'drafting', n: 5, label: 'Across the sheet' },
  'drafting-registered': { chapter: 'drafting', n: 6, label: 'Side elevation' },
  'breakthrough-anticipation': { chapter: 'breakthrough', n: 1, label: 'The light falters' },
  'breakthrough-trace': { chapter: 'breakthrough', n: 2, label: 'Profile trace' },
  'breakthrough-pressure': { chapter: 'breakthrough', n: 3, label: 'Pressure from below' },
  'breakthrough-rupture': { chapter: 'breakthrough', n: 4, label: 'Sheet fractures' },
  'breakthrough-emergence': { chapter: 'breakthrough', n: 5, label: 'Out of the drawing' },
  'inspection-ring': { chapter: 'mechanism', n: 1, label: 'Ring switch · knurl + anodize' },
  'mechanism-switch': { chapter: 'mechanism', n: 2, label: 'Rundown ▸ High Torque · 120°' },
  // Shown under the Mechanism caption: Inspection chrome waits for the isolated shaft (.62).
  'inspection-isolation': { chapter: 'mechanism', n: 3, label: 'Isolating the input shaft' },
  'inspection-shaping': { chapter: 'inspection', n: 1, label: 'Shaping · relief groove' },
  'inspection-bullet-time': { chapter: 'inspection', n: 2, label: 'At the cut · slow motion' },
  'inspection-materials': { chapter: 'inspection', n: 3, label: 'Three steels, one weak spot' },
  'inspection-hobbing': { chapter: 'inspection', n: 4, label: 'The fix · rotary hob' },
  'inspection-runout': { chapter: 'inspection', n: 5, label: 'Runout check · Stage 1 mesh' },
  'inspection-cascade': { chapter: 'inspection', n: 6, label: 'Torque path · five stages' },
  'inspection-return': { chapter: 'inspection', n: 7, label: 'Back to the gearbox' },
  'mechanism-extraction': { chapter: 'close', n: 1, label: 'Exploded view' },
  'mechanism-exploded-hold': { chapter: 'close', n: 2, label: 'Assembly order' },
  'close-settle': { chapter: 'close', n: 3, label: 'The finished wrench' },
  // close-ownership: left to the ending work; no step line.
})

const CHAPTER_INDEX: Record<TorquePosterChapterId, number> = {
  drafting: 1, breakthrough: 2, mechanism: 3, inspection: 4, close: 5,
}

/** Step line text for a beat under the displayed chapter. The `NN·n` prefix is shown only
 * when the step belongs to the displayed chapter (e.g. inspection-return after .845 shows
 * under Mechanism, so it drops its 04 prefix rather than mis-numbering). */
export function torqueHudStepText(beatId: string | undefined, displayed: TorquePosterChapterId): string | null {
  const step = beatId ? TORQUE_HUD_STEPS[beatId] : undefined
  if (!step) return null
  if (step.chapter !== displayed) return step.label
  return `${String(CHAPTER_INDEX[step.chapter]).padStart(2, '0')}·${step.n}  ${step.label}`
}

export const TORQUE_RAIL_TOOLTIPS: Readonly<Record<TorquePosterChapterId, string>> = Object.freeze({
  drafting: 'The drawing and the notes behind it',
  breakthrough: 'The wrench breaks out of its drawing',
  mechanism: 'The ring switch and the two-speed shift',
  inspection: 'Why the input shaft failed, and the fix',
  close: 'The gearbox, exploded in assembly order',
})

export const TORQUE_TERM_TOOLTIPS = Object.freeze({
  FOS: 'Factor of safety: allowable stress ÷ peak stress. Below 1.0 predicts failure.',
  HRC: 'Rockwell C hardness',
  TIR: 'Total indicator reading: the full runout swing on a dial indicator',
  H7k6: 'ISO fit: H7 bore, k6 shaft (transition fit)',
  ISO1328: 'Gear accuracy grade. Lower numbers are more precise.',
})
