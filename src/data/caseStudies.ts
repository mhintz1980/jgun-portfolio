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
 * Coordinates are in meters in world space across the three discrete 3D stations:
 *   Station 1 (`[0, 0, 0]`):     CH.01 & CH.02 Torque Wrench Hero
 *   Station 2 (`[28, 0, -6]`):   CH.03 RL-300 / MSP Acoustic SAFE Enclosure
 *   Station 3 (`[56, 0, -12]`):  CH.04 M249 / MK46 Parametric Receiver Platform
 */
export const CAMERA_PATH: CameraKeyframe[] = [
  // CH.01 — hero planetary torque wrench, 3/4 perspective (Station 1: [0, 0, 0])
  { position: [0.32, 0.16, 0.42], target: [0, 0, 0], fov: 42 },
  // CH.02 — x-ray & axial exploded reduction stages, lateral inspection (Station 1: [0, 0, 0])
  { position: [0.60, 0.08, 0.05], target: [0, 0.015, -0.07], fov: 36 },
  // CH.03 — acoustic enclosure / thermal airflow, macro isometric (Station 2: [28, 0, -6])
  { position: [28.27, 0.27, -5.73], target: [28, 0, -6.02], fov: 28 },
  // CH.04 — digital systems: M249 platform overview & continuous zoom-out (Station 3: [56, 0, -12])
  { position: [56.28, 0.42, -10.45], target: [56, 0, -12], fov: 38 },
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
 * Rear LCD orbit — JG-014 repair pass (2026-08-27), all values measured, not
 * eyeballed:
 *   - The hero timeline scrubs [data-chapter="1"] across global progress
 *     ≈0.177 → 0.458 against the current 2020vh document (3×440vh sections +
 *     660vh CH.04 + 40vh footer, viewport-normalized), so the explode tween
 *     (timeline 0.35→0.85) completes at ≈0.416 — NOT the stale ≈0.518 figure
 *     from the pre-660vh layout.
 *   - Live probe at progress 0.47 (2026-08-27): explodeFactor 1, hero yaw
 *     exactly 0.85π (spin tween saturated), handleZ −0.354.
 *   - The exploded LCD cluster (role-map anchor [−0.007, −0.0005, −0.2125] +
 *     handle offset −0.354, recentered by rig.center [0.0775, 0, −0.0906],
 *     rotated 0.85π about Y) sits at world [−0.14, 0.00, 0.46]. The pre-repair
 *     dwell camera (position [−0.06, 0.08, −0.44] / target [0, 0.02, −0.22])
 *     pointed at empty space 0.68 m away on the opposite side of the model.
 *   - The dwell camera below sits 0.32 m back from the LCD along its rear
 *     normal [−0.44, 0.24, 0.86], framing the manometer screen (P002115) with
 *     the 3X button cluster (P002123–P002125) beside it.
 *   - start/return equal the base CAMERA_PATH blend at the window edges
 *     (smoothstep(0.26)/smoothstep(0.575) between the CH.02 and CH.03
 *     keyframes) so the orbit composes with the base path without pops.
 */
export const LCD_REVEAL_WINDOW = {
  /** After the explode beat completes (measured ≈0.416). */
  start: 0.420,
  /** Stable rear LCD/buttons dwell before the wrench stage handoff. */
  dwellStart: 0.458,
  dwellEnd: 0.488,
  /** Before the wrench sink window (STAGE_TRANSITIONS.wrenchOut 0.525–0.565). */
  end: 0.525,
} as const

export const LCD_ORBIT_KEYFRAMES = {
  /** Base-path blend at progress 0.420 — lateral inspection, already easing toward CH.03. */
  start:  { position: [0.545, 0.112, 0.087] as [number,number,number], target: [0, 0.013, -0.062] as [number,number,number], fov: 34.7 },
  /** Swing around the extracted train's mid-span toward the handle rear cap. */
  arc:    { position: [0.28, 0.10, 0.50] as [number,number,number], target: [-0.05, 0.01, 0.18] as [number,number,number], fov: 34 },
  /** Dwell: 0.32 m behind the exploded rear cap, looking straight at the LCD cluster (world [−0.14, 0, 0.46]). */
  dwell:  { position: [-0.28, 0.08, 0.74] as [number,number,number], target: [-0.14, 0.00, 0.46] as [number,number,number], fov: 31 },
  /** Base-path blend at progress 0.525 — mid interpolation toward the CH.03 macro view. */
  return: { position: [0.398, 0.196, 0.185] as [number,number,number], target: [0, 0.006, -0.039] as [number,number,number], fov: 31.1 },
} as const

/**
 * Hotspots anchored via role-map.json `occurrence` names. All of these are
 * real node identities confirmed in the GLB audit — never guessed labels.
 *
 * anchorOffset provenance (role-map bbox spans, model frame, 2026-08-27):
 *   ROTOR-1 z ∈ [−0.196, −0.133] → rear (air-inlet/vane) face center z −0.196.
 *   AIR MOTOR HOUSING-MACHINED-1 z ∈ [−0.1835, −0.1455] → rear bore face z −0.1835.
 *     Both raw bbox centers sit at [0, 0, −0.1645] (0.1 mm apart) — the
 *     pre-JG-014 duplicate-anchor defect; the face anchors separate them by
 *     12.5 mm of measured feature distance.
 *   FLANGE-1 exists twice (mount face z −0.1396 AND rear cap z −0.1895) —
 *     pickNear selects the motor-to-gearbox mount-face occurrence.
 *
 * Feature-control-frame cells use ONLY owner-approved vocabulary: the HUD
 * callout strings ('RUNOUT < .0015" TIR', 'POSITION ⌖ .002" @ MMC',
 * 'FLATNESS < .0008"') and drawing-verified datum references (P000420
 * controls terminate in datum A). Literal glyph transcription from the
 * drawing PDFs requires crop verification at readable scale
 * (gdt-annotation-style.md) — invented symbols are not used.
 */
export const HOTSPOTS: HotspotDef[] = [
  {
    id: 'rotor',
    occurrence: 'ROTOR-1',
    kind: 'inspect',
    label: 'AIR MOTOR ROTOR',
    detail:
      'Vane-type pneumatic rotor — the input side of the reduction train. Balanced for high-RPM operation inside the machined motor housing.',
    annotation: {
      // Rear face of the rotor bbox (center −0.1645 − half-extent 0.0315).
      anchorOffset: [0, 0, -0.0315],
      processNote: 'BALANCED VANE ASSEMBLY',
    },
    chapters: [0, 1],
  },
  {
    id: 'motor-housing',
    occurrence: 'AIR MOTOR HOUSING-MACHINED-1',
    kind: 'datum',
    label: 'DATUM A — MOTOR BORE',
    detail: 'Machined air-motor housing. Primary datum for the rotating stack: RUNOUT < .0015" TIR.',
    annotation: {
      datum: 'A',
      frame: {
        characteristic: 'RUNOUT',
        cells: ['.0015" TIR', 'A'],
        datums: ['A'],
      },
      processNote: 'RUNOUT < .0015" TIR',
      // Rear bore face of the housing bbox (center −0.1645 − half-extent 0.019).
      anchorOffset: [0, 0, -0.019],
    },
    chapters: [0, 1],
  },
  {
    id: 'flange',
    occurrence: 'FLANGE-1',
    // Two role-map rows share this occurrence name; pick the motor-to-gearbox
    // mount face (z −0.1396), not the rear-cap twin (z −0.1895).
    pickNear: [0.0001, 0, -0.1396],
    kind: 'datum',
    label: 'DATUM B — MOUNT FACE',
    detail: 'Motor-to-gearbox interface flange. FLATNESS < .0008" holds stage alignment across the joint.',
    annotation: {
      datum: 'B',
      frame: {
        characteristic: 'FLATNESS',
        cells: ['.0008"'],
        datums: [],
      },
      processNote: 'FLATNESS < .0008"',
      // Top rim of the mount-face annulus (bbox y half-extent 0.029).
      anchorOffset: [0, 0.028, 0],
    },
    chapters: [1],
  },
  {
    id: 'gearbox-housing',
    occurrence: 'P000245-1',
    kind: 'inspect',
    label: 'GEARBOX HOUSING',
    detail:
      'Outer housing of the D1-AP planetary gearbox — ring gears and 4-planet carriers run inside this shell.',
    annotation: {
      frame: {
        characteristic: 'POSITION ⌖',
        cells: ['.002" @ MMC'],
      },
      processNote: 'POSITION ⌖ .002" @ MMC',
      // Top rim of the housing bbox (y half-extent 0.0327).
      anchorOffset: [0, 0.032, 0],
    },
    chapters: [1, 2],
  },
  {
    id: 'mcu',
    occurrence: 'MSP430F6726IPN-1',
    kind: 'inspect',
    label: 'MSP430 MCU',
    detail:
      'TI MSP430F6726 microcontroller — the smart-tool brain sampling pressure and driving the manometer display.',
    annotation: {
      processNote: 'DIGITAL SAMPLING CONTROLLER',
      anchorOffset: [-0.003, 0, 0.002],
    },
    chapters: [3],
  },
  {
    id: 'lcd',
    occurrence: 'MANOMETER LCD BK11356-1',
    kind: 'inspect',
    label: 'LCD MANOMETER',
    detail: 'Onboard LCD manometer readout — live line-pressure telemetry at the operator’s thumb.',
    // Visible during the rear-LCD orbit dwell (LCD_REVEAL_WINDOW straddles
    // progress where the DOM chapter trigger already reports chapter 2).
    window: [0.44, 0.51],
    annotation: {
      processNote: 'BACKLIT DIGITAL MANOMETER',
      // Toward the screen slab (P002115 sits at x −0.0091 / z −0.2191).
      anchorOffset: [-0.003, 0, -0.006],
    },
    chapters: [3],
  },
  {
    id: 'lipo',
    occurrence: 'Tenergy LiPo Battery 3.7 V-1',
    kind: 'inspect',
    label: 'LiPo POWER CELL',
    detail: 'Tenergy 3.7 V LiPo cell powering the electronics stack independent of the air line.',
    annotation: {
      processNote: '3.7V AUXILIARY POWER CELL',
      anchorOffset: [0.003, 0, 0.004],
    },
    chapters: [3],
  },
  /* ---------------- Station 2: RL-300 / MSP Acoustic SAFE Enclosure ---------------- */
  {
    id: 'enclosure-chassis',
    occurrence: 'ENCLOSURE_CHASSIS',
    kind: 'inspect',
    label: 'EXTRUDED UNIBODY CHASSIS',
    detail:
      'Structural welded 6061-T6 aluminum framework with modular internal mounting channels engineered for industrial plant environments.',
    annotation: {
      processNote: '6061-T6 WELDED UNIBODY',
      anchorOffset: [0, 0.35, 0],
    },
    chapters: [2],
  },
  {
    id: 'composite-panels',
    occurrence: 'COMPOSITE_PANELS',
    kind: 'datum',
    label: 'DATUM C — 5-LAYER COMPOSITE WALL',
    detail:
      'Mass-loaded vinyl core + dual-density closed-cell decoupling foam providing -43 dBA acoustic attenuation without thermal trapping.',
    annotation: {
      datum: 'C',
      frame: {
        characteristic: 'ATTENUATION',
        cells: ['-43 dBA', '5-LAYER'],
      },
      processNote: '-43 dBA NOISE ATTENUATION',
      anchorOffset: [0.6, 0.2, 0.4],
    },
    chapters: [2],
  },
  {
    id: 'pump-housing',
    occurrence: 'PUMP_HOUSING',
    kind: 'inspect',
    label: 'RL-300 ROTARY DRIVE UNIT',
    detail:
      'High-pressure continuous rotary positive displacement pump generating 115 dBA source noise, isolated via tuned acoustic chambers.',
    annotation: {
      processNote: '115 dBA CONTINUOUS DRIVE',
      anchorOffset: [0, 0, 0],
    },
    chapters: [2],
  },
  {
    id: 'acoustic-baffles',
    occurrence: 'ACOUSTIC_BAFFLES',
    kind: 'datum',
    label: 'DATUM D — INTERNAL LABYRINTH',
    detail:
      'Sound-dissipating geometric baffles trapping high-frequency acoustic waves while preserving aerodynamic cooling airflow.',
    annotation: {
      datum: 'D',
      frame: {
        characteristic: 'LABYRINTH',
        cells: ['SOUND ARRESTOR', 'CFM TUNED'],
      },
      processNote: 'INTERNAL SOUND BAFFLES',
      anchorOffset: [0.35, 0.15, -0.25],
    },
    chapters: [2],
  },
  {
    id: 'isolation-mounts',
    occurrence: 'ISOLATION_MOUNTS',
    kind: 'datum',
    label: 'DATUM E — DECOUPLING ISOLATORS',
    detail:
      'Elastomeric shear isolators preventing structure-borne motor vibration transfer and eliminating sympathetic unibody resonance.',
    annotation: {
      datum: 'E',
      frame: {
        characteristic: 'ISOLATION',
        cells: ['< 5 Hz TRANSMISSION'],
      },
      processNote: 'ELASTOMERIC SHEAR MOUNTS',
      anchorOffset: [-0.5, -0.35, 0.35],
    },
    chapters: [2],
  },
  {
    id: 'duct-intake',
    occurrence: 'DUCT_INTAKE',
    kind: 'datum',
    label: 'DATUM F — 1,850 CFM INTAKE AIRWAY',
    detail:
      'Laminar low-velocity cooling intake sized via CFM/FPM airflow math to maintain optimal thermal delta-T without acoustic leakage.',
    annotation: {
      datum: 'F',
      frame: {
        characteristic: 'LAMINAR FLOW',
        cells: ['1,850 CFM', '650 FPM'],
      },
      processNote: '1,850 CFM LAMINAR INTAKE',
      anchorOffset: [-1.1, 0.25, 0],
    },
    chapters: [2],
  },
  {
    id: 'duct-exhaust',
    occurrence: 'DUCT_EXHAUST',
    kind: 'datum',
    label: 'DATUM G — ATTENUATED EXHAUST DUCT',
    detail:
      'Low-backpressure thermal discharge port with integrated dissipative sound arrestor rings discharging cooling air quietly.',
    annotation: {
      datum: 'G',
      frame: {
        characteristic: 'DISCHARGE',
        cells: ['LOW BACKPRESSURE'],
      },
      processNote: 'THERMAL DISCHARGE PORT',
      anchorOffset: [1.2, 0.2, 0],
    },
    chapters: [2],
  },
  /* ---------------- Station 3: M249 / MK46 Platform ---------------- */
  {
    id: 'm249-receiver',
    occurrence: 'RECEIVER_MONOBLOC',
    kind: 'datum',
    label: 'DATUM A — RECEIVER MONOBLOC',
    detail:
      'Reverse-engineered CNC-machined steel receiver body with ASME Y14.5 mil-spec interchangeability tolerances reconstructed from 3D scans.',
    annotation: {
      datum: 'A',
      frame: {
        characteristic: 'PROFILE ⌓',
        cells: ['.0015" @ MMC', 'A', 'B'],
      },
      processNote: 'MIL-SPEC INTERCHANGEABILITY',
      anchorOffset: [0, 0.04, 0],
    },
    chapters: [3],
  },
  {
    id: 'm249-trunnion',
    occurrence: 'BARREL_TRUNNION',
    kind: 'datum',
    label: 'DATUM B — BARREL TRUNNION BORE',
    detail:
      'Precision-machined locking trunnion bore. Concentricity and RUNOUT < .0008" TIR for quick-change barrel interchangeability.',
    annotation: {
      datum: 'B',
      frame: {
        characteristic: 'RUNOUT',
        cells: ['.0008" TIR', 'A'],
      },
      processNote: 'QUICK-CHANGE LOCKUP BORE',
      anchorOffset: [0, 0.02, 0.15],
    },
    chapters: [3],
  },
  {
    id: 'm249-rail',
    occurrence: 'PICATINNY_TOP_RAIL',
    kind: 'datum',
    label: 'DATUM C — MIL-STD-1913 TOP RAIL',
    detail:
      'Parametrically reconstructed 1913 optical mounting rail with true recoil slot spacing and precision center-bore datum alignment.',
    annotation: {
      datum: 'C',
      frame: {
        characteristic: 'PARALLELISM //',
        cells: ['.0010"', 'A'],
      },
      processNote: 'MIL-STD-1913 PROFILE',
      anchorOffset: [0, 0.1, -0.08],
    },
    chapters: [3],
  },
  {
    id: 'm249-feed-tray',
    occurrence: 'FEED_TRAY_INTERFACE',
    kind: 'inspect',
    label: 'FEED TRAY & BOLT CARRIER GUIDE',
    detail:
      'Reverse-engineered feed guide rails reconstructed from raw 3D scan point clouds without original technical data package (TDP).',
    annotation: {
      processNote: 'DUAL-FEED GUIDE INTERFACE',
      anchorOffset: [0, 0.06, 0.04],
    },
    chapters: [3],
  },
]
