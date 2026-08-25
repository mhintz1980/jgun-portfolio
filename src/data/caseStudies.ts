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
 * internals therefore CANNOT exit the front: the planetary stages and the
 * clutch extract rearward (−Z, toward the removed handle) while only the
 * output-spindle parts exit forward (+Z) through the snout. The housing
 * itself never moves.
 *
 * Exploded line order is the DRIVELINE order, not the stage numbering (Mark
 * review 2026-08-24): the A000606 cage (P001849) is the THIRD cage of five,
 * so behind the housing rear face the line reads P003047 (stage 4, first
 * out) → P003045 (stage 3) → P001849 (A000606) → P001837 (stage 2) →
 * P001836 (stage 1, furthest back). Keyed by part numbers, never stage
 * names — Mark has called A000606 both "stage 5" and "the 3rd stage cage".
 *
 * Magnitudes are a clearance-derived ladder measured from the JSON-chunk
 * rest spans (.scratch/measure-spans.mjs, validated against the 08-24 handoff
 * anchors): the first cage clears the housing rear face by ≥14 mm,
 * adjacent exploded units keep ≥15 mm gaps, and the handle backs off with
 * 25 mm of air behind the clutch (widened from 14.5 mm per the same review
 * so the extraction reads with generous spacing).
 *
 * Pass 3 (2026-08-25): the K000004 thrust bearing ring — previously the
 * gearbox's ONLY untagged part (rest span z [−0.058, −0.051], ⌀0.058 × 7 mm,
 * role-map center z −0.0545) — extracts as its own unit directly behind
 * A000606. Honoring the ≥15 mm adjacent-gap rule on both of its sides costs
 * 15 + 7 + 15 mm where only 16 mm existed, so every unit behind it (stage 2,
 * stage 1, clutch, handle) shifts ~22 mm further back; units ahead of the
 * bearing are untouched.
 */
export const EXPLODE_OFFSETS = {
  output: 0.05,
  stage4: -0.099,
  stage3: -0.142,
  stage5: -0.177,
  bearing: -0.197,
  stage2: -0.23,
  stage1: -0.255,
  clutch: -0.291,
  handle: -0.354,
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
 * Display rotation turns (pass 3, 2026-08-25) — visual multiplier for the
 * scroll-scrub gear sweep: across the full gearRotation proxy sweep each
 * carrier completes ROTATION_TURNS[stage] revolutions instead of its raw
 * ratio fraction. Stage 1/2 are exactly 2× their kinematic turns (4 → 8,
 * 1.12 → 2.24); the slow tail (0.32 / 0.088 / 0.024 turns at the true
 * ratios) is boosted to 1.5 / 1 / 0.5 so the reduction stages still read as
 * motion instead of appearing frozen. GEAR_RATIOS remains the kinematic
 * reference; planet counter-rotation stays pegged to the carrier's display
 * angle (see applyGearRotation).
 */
export const ROTATION_TURNS = {
  stage1: 8,
  stage2: 2.24,
  stage3: 1.5,
  stage4: 1,
  stage5: 0.5,
} as const

/**
 * Mechanical shift travel (meters) for the two-speed clutch fork train:
 * shifter fork (P000724) and shifter cam (P000297).
 * These slide together −Z (toward the handle) before the explosion begins.
 * NOTE: The ring switch assembly (P003068 + 3× P000464 pins + 3× K000156 ball
 * plungers) is animated SEPARATELY in TorqueWrenchHero — it travels +Z with
 * a 120° cam rotation (see RING_SWITCH_TRAVEL_Z below).
 */
export const CLUTCH_SHIFT_DISTANCE = -0.015

/**
 * Ring switch (P003068) cam-follower kinematics.
 * As the clutch shifts, the ring switch follows the helical cam groove on
 * P000420: it travels +Z (away from handle, toward snout) by 9.525 mm
 * (0.375 in) and simultaneously rotates 120° around the drivetrain axis
 * following the groove. Rotation is CW when viewed from the handle (away
 * from camera in the CH.01 3/4 view).
 */
export const RING_SWITCH_TRAVEL_Z = 0.009525  // +9.525 mm (+Z = away from handle)
export const RING_SWITCH_ROTATION = (2 * Math.PI) / 3  // 120°, applied as negative (CW from rear)

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
  // CH.04 — digital systems: M249 platform overview & continuous zoom-out
  // Frames the centered 1.18m weapon with generous margins from barrel to stock
  { position: [0.28, 0.42, 1.55], target: [0, 0, 0], fov: 38 },
]

/**
 * Shift sub-sequence camera keyframes — GSAP sub-timeline scrubbed against
 * the shift proxy (0→1 across timeline 0→0.15). Zooms tight on the P000420
 * groove area so the OSHA Blue stripe is visible before the ring switch moves,
 * then holds while the ring switch lifts to reveal the OSHA Red stripe, then
 * returns to the CH.01 keyframe. Values in meters, hero group space.
 */
export const SHIFT_CAMERA_KEYFRAMES = {
  /** Before shift: CH.01 wide view. */
  idle:    { position: [0.32, 0.16, 0.42] as [number,number,number], target: [0, 0, 0] as [number,number,number], fov: 42 },
  /** Shift starts: zoom to P000420 groove area — blue groove visible. */
  zoomIn:  { position: [0.14, 0.04, 0.19] as [number,number,number], target: [0, 0, 0.06] as [number,number,number], fov: 22 },
  /** Mid shift: hold tight — ring switch rising, red groove revealed. */
  hold:    { position: [0.12, 0.03, 0.17] as [number,number,number], target: [0, 0, 0.06] as [number,number,number], fov: 20 },
  /** Shift complete: pull back to CH.01 framing. */
  pullBack: { position: [0.32, 0.16, 0.42] as [number,number,number], target: [0, 0, 0] as [number,number,number], fov: 42 },
} as const

/**
 * Rear LCD orbit camera keyframes — sub-sequence that runs during global
 * progress 0.35→0.57 (inside the ghost-fade window). Camera arcs rearward
 * to reveal the LCD screen (P002115) and buttons (P002123/24/25) on the
 * handle rear face, dwells with the emissive screen glowing, then returns.
 */
export const LCD_ORBIT_KEYFRAMES = {
  /** Ghost fade start — still at lateral inspection position. */
  start:  { position: [0.55, 0.04, 0.04] as [number,number,number], target: [0, 0, 0.03] as [number,number,number], fov: 34 },
  /** Arc rearward — coming around to the handle back face. */
  arc:    { position: [-0.08, 0.12, -0.38] as [number,number,number], target: [0, 0.02, -0.20] as [number,number,number], fov: 38 },
  /** Dwell: tight rear view, LCD emissive full blast. */
  dwell:  { position: [-0.06, 0.08, -0.44] as [number,number,number], target: [0, 0.02, -0.22] as [number,number,number], fov: 32 },
  /** Return to lateral inspection framing for explosion. */
  return: { position: [0.55, 0.04, 0.04] as [number,number,number], target: [0, 0, 0.03] as [number,number,number], fov: 34 },
} as const

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
