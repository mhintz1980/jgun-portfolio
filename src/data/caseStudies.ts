import type {
  CameraKeyframe,
  CaseStudy,
  ChapterDef,
  HotspotDef,
  MaterialMode,
} from '../types/portfolio'

/**
 * Copy and HUD vocabulary sourced verbatim from OUTBOX/portfolio-module4-copy.md
 * (drafted by Honey, 2026-08-20). Do not invent new copy here.
 */

export const CHAPTERS: ChapterDef[] = [
  {
    index: 0,
    label: 'CH.01 ASSEMBLY',
    title: 'The Full-Stack Physical & Digital Systems Architect',
    subtitle:
      '25 years of planetary reduction gearboxes, 7-axis mill-turn and ASME Y14.5 GD&T — bridged into modern software, web-native 3D, and AI automation.',
    callouts: ['RUNOUT < .0015" TIR'],
    datum: 'A',
  },
  {
    index: 1,
    label: 'CH.02 X-RAY / EXPLODE',
    title: 'Inside the Reduction Train',
    subtitle:
      'Housing fades to ghost wireframe; the planetary stages explode axially to expose the gear train.',
    callouts: ['RUNOUT < .0015" TIR', 'POSITION ⌖ .002" @ MMC'],
    datum: 'B',
  },
  {
    index: 2,
    label: 'CH.03 THERMAL / ACOUSTIC',
    title: 'Airflow Against the Noise Floor',
    subtitle:
      'CFM/FPM airflow math, composite acoustic walls, and vibration-decoupled mounting — silence as an engineering deliverable.',
    callouts: ['FLATNESS < .0008"'],
    datum: 'C',
  },
  {
    index: 3,
    label: 'CH.04 DIGITAL SYSTEMS',
    title: 'From Point Cloud to Production Code',
    subtitle:
      'The same tool carries an MSP430, USB, LiPo and LCD manometer — physical systems dissolving into digital ones.',
    callouts: ['POSITION ⌖ .002" @ MMC', 'RUNOUT < .0015" TIR'],
    datum: 'A',
  },
]

/**
 * CH.01 machine-identity lines, reused verbatim from StaticPoster.tsx (same
 * Honey-drafted vocabulary) so the full-tier opening viewport names the machine
 * itself, not just the role title.
 */
export const ASSEMBLY_IDENTITY = {
  machine: 'Industrial Pneumatic Torque Wrench',
  spec: 'Multi-stage planetary reduction · 7-axis mill-turn · ASME Y14.5 GD&T',
} as const

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'gearbox',
    chapter: 1,
    headline: 'Zero to Prototype: Planetary Reduction at Full Torque',
    oneLiner:
      'A multi-stage planetary gear train engineered for 7-axis mill-turn production and heat-treat-stable tolerances.',
    bullets: [
      'Designed and toleranced a multi-stage planetary reduction gearbox for high-torque, low-backlash output, machined complete on 7-axis mill-turn centers.',
      'Controlled heat-treat distortion across hardened gear stages to hold ASME Y14.5 GD&T callouts post-process, not just at rough machining.',
      'Took the assembly from concept to a zero-prototype production run — first parts off the line met spec, no iteration cycle.',
    ],
    tags: ['7-AXIS MILL-TURN', 'HEAT-TREAT CONTROL', 'ASME Y14.5'],
  },
  {
    id: 'safe-enclosure',
    chapter: 2,
    headline: 'Engineered Silence: The Acoustic SAFE Enclosure',
    oneLiner:
      'A 5-layer composite acoustic enclosure engineered around real CFM/FPM airflow math and vibration-isolated mounting.',
    bullets: [
      'Designed a 5-layer composite acoustic wall system to attenuate noise without choking airflow through the enclosure.',
      'Calculated CFM/FPM airflow requirements to size vents and ducting for adequate cooling under the acoustic constraint.',
      'Isolated the enclosed equipment from the housing structure with vibration-decoupled mounting, preventing structure-borne noise transfer.',
    ],
    tags: ['CFM/FPM', '5-LAYER COMPOSITE', 'VIBRATION DECOUPLING'],
  },
  {
    id: 'm249',
    chapter: 3,
    headline: 'From Point Cloud to Parametric: Reverse-Engineering Mission-Critical Hardware',
    oneLiner:
      '3D scan data reconstructed into fully toleranced, manufacturable CAD for the M249/MK46 platform.',
    bullets: [
      'Converted raw 3D scan point clouds of legacy mil-spec hardware into clean, parametric CAD models.',
      'Rebuilt ASME Y14.5 GD&T drawings from physical parts with no original technical data package — reverse-engineered datums, fits, and tolerance stacks from scratch.',
      'Delivered production-ready drawings meeting mil-spec interchangeability requirements for the M249/MK46 platform.',
    ],
    tags: ['SCAN-TO-CAD', 'NO TDP', 'MIL-SPEC INTERCHANGEABILITY'],
  },
]

export const MATERIAL_MODE_LABELS: Record<MaterialMode, string> = {
  solid: '[ SOLID PBR ]',
  blueprint: '[ BLUEPRINT WIREFRAME ]',
  exploded: '[ EXPLODED ASSEMBLY ]',
}

/**
 * Axial explosion offsets in METERS, on the D1-AP 2-speed gearbox. Measured
 * rest-pose geometry (Default.glb): the handle assembly sits at −Z (center
 * z ≈ −0.168), the output spindle cluster at +Z, and the P000245 outer
 * housing (rear face z = −0.074) necks down toward the +Z snout. The
 * internals therefore CANNOT exit the front: all five planetary stages and
 * the clutch extract rearward (−Z, toward the removed handle) while only the
 * output-spindle parts exit forward (+Z) through the snout. The housing
 * itself never moves.
 *
 * Magnitudes are a clearance-derived ladder (Mark review 2026-08-23: the
 * final stage was still half inside the gearbox): every stage fully clears
 * the housing rear face with ≥12 mm air, and adjacent exploded stages keep
 * ≥12 mm gaps — offsets = target slot center − rest center, computed from
 * the measured half-depths of each unit.
 */
export const EXPLODE_OFFSETS = {
  output: 0.05,
  stage5: -0.063,
  stage4: -0.142,
  stage3: -0.181,
  stage2: -0.194,
  stage1: -0.215,
  clutch: -0.251,
  handle: -0.303,
} as const

export type StageId = 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5'
export const STAGE_IDS: readonly StageId[] = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5']

/**
 * Carrier-speed ratios per stage, relative to the input drive (cumulative
 * reduction: stage N's carrier turns at its listed fraction of input speed),
 * plus the planet counter-rotation multiplier for the epicyclic spin — each
 * planet counter-rotates on its pin at −stageAngle × multiplier.
 */
export const GEAR_RATIOS = {
  stage1: 1.0,
  stage2: 0.28,
  stage3: 0.08,
  stage4: 0.022,
  stage5: 0.006,
  planetMultiplier: 3.5,
} as const

/**
 * Mechanical shift travel (meters) for the two-speed clutch: the ring switch
 * (P003068) / shifter fork (P000724) / shifter cam (P000297) / pins (P000464)
 * slide together along the train axis before the explosion begins.
 */
export const CLUTCH_SHIFT_DISTANCE = -0.015

/**
 * Camera trajectory state machine keyframes — one per scroll chapter.
 * Coordinates are in meters, in the hero group's space (model recentered so
 * the wrench midpoint sits at the origin).
 */
export const CAMERA_PATH: CameraKeyframe[] = [
  // CH.01 — hero planetary torque wrench, 3/4 perspective
  { position: [0.32, 0.16, 0.42], target: [0, 0, 0], fov: 42 },
  // CH.02 — x-ray & axial exploded reduction stages, lateral inspection
  { position: [0.55, 0.04, 0.04], target: [0, 0, 0.03], fov: 34 },
  // CH.03 — acoustic enclosure / thermal airflow, macro isometric
  { position: [0.27, 0.27, 0.27], target: [0, 0, -0.02], fov: 28 },
  // CH.04 — digital systems & AI matrix, forward terminal perspective on the
  // smart-tool electronics stack (MSP430/USB/LiPo/LCD live around z ≈ -0.11)
  { position: [0.06, 0.03, -0.46], target: [0, 0, -0.11], fov: 50 },
]

/**
 * Hotspots anchored via role-map.json `occurrence` names. All of these are
 * real node identities confirmed in the GLB audit — never guessed labels.
 */
export const HOTSPOTS: HotspotDef[] = [
  {
    id: 'rotor',
    occurrence: 'ROTOR-1',
    kind: 'inspect',
    label: 'AIR MOTOR ROTOR',
    detail:
      'Vane-type pneumatic rotor — the input side of the reduction train. Balanced for high-RPM operation inside the machined motor housing.',
    chapters: [0, 1],
  },
  {
    id: 'motor-housing',
    occurrence: 'AIR MOTOR HOUSING-MACHINED-1',
    kind: 'datum',
    label: 'DATUM A — MOTOR BORE',
    detail: 'Machined air-motor housing. Primary datum for the rotating stack: RUNOUT < .0015" TIR.',
    chapters: [0, 1],
  },
  {
    id: 'flange',
    occurrence: 'FLANGE-1',
    kind: 'datum',
    label: 'DATUM B — MOUNT FACE',
    detail: 'Motor-to-gearbox interface flange. FLATNESS < .0008" holds stage alignment across the joint.',
    chapters: [1],
  },
  {
    id: 'gearbox-housing',
    occurrence: 'P000245-1',
    kind: 'inspect',
    label: 'GEARBOX HOUSING',
    detail:
      'Outer housing of the D1-AP planetary gearbox — ring gears and 4-planet carriers run inside this shell.',
    chapters: [1, 2],
  },
  {
    id: 'mcu',
    occurrence: 'MSP430F6726IPN-1',
    kind: 'inspect',
    label: 'MSP430 MCU',
    detail:
      'TI MSP430F6726 microcontroller — the smart-tool brain sampling pressure and driving the manometer display.',
    chapters: [3],
  },
  {
    id: 'lcd',
    occurrence: 'MANOMETER LCD BK11356-1',
    kind: 'inspect',
    label: 'LCD MANOMETER',
    detail: 'Onboard LCD manometer readout — live line-pressure telemetry at the operator’s thumb.',
    chapters: [3],
  },
  {
    id: 'lipo',
    occurrence: 'Tenergy LiPo Battery 3.7 V-1',
    kind: 'inspect',
    label: 'LiPo POWER CELL',
    detail: 'Tenergy 3.7 V LiPo cell powering the electronics stack independent of the air line.',
    chapters: [3],
  },
]
