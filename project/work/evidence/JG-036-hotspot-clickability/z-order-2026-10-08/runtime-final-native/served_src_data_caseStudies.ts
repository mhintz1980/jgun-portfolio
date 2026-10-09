export const CHAPTERS = [
  {
    index: 0,
    label: "CH.01 ASSEMBLY",
    title: "The Full-Stack Physical & Digital Systems Architect",
    subtitle: "25 years of planetary reduction gearboxes, 7-axis mill-turn and ASME Y14.5 GD&T — bridged into modern software, web-native 3D, and AI automation.",
    callouts: ['RUNOUT < .001" TIR'],
    datum: "A"
  },
  {
    index: 1,
    label: "CH.02 X-RAY / EXPLODE",
    title: "Inside the Reduction Train",
    subtitle: "Housing fades to ghost wireframe; the planetary stages explode axially to expose the gear train.",
    callouts: ['RUNOUT < .001" TIR', 'POSITION .002" @ MMC'],
    datum: "B"
  },
  {
    index: 2,
    label: "CH.03 THERMAL / ACOUSTIC",
    title: "Airflow Against the Noise Floor",
    subtitle: "CFM/FPM airflow math, composite acoustic walls, and vibration-decoupled mounting — silence as an engineering deliverable.",
    callouts: ['FLATNESS < .0008"'],
    datum: "C"
  },
  {
    index: 3,
    label: "CH.04 DIGITAL SYSTEMS",
    title: "From Point Cloud to Production Code",
    subtitle: "The same tool carries an MSP430, USB, LiPo and LCD manometer — physical systems dissolving into digital ones.",
    callouts: ['POSITION .002" @ MMC', 'RUNOUT < .001" TIR'],
    datum: "A"
  }
];
export const ASSEMBLY_IDENTITY = {
  machine: "High-Precision Industrial Torque Gun",
  drawingNumber: "PTG-HP-1000",
  revision: "REV03",
  spec: "Multi-stage planetary reduction · 7-axis mill-turn · ASME Y14.5 GD&T"
};
export const CASE_STUDIES = [
  {
    id: "gearbox",
    chapter: 1,
    headline: "Machining decisions behind the reduction train",
    oneLiner: "I turn and hob the input and output shafts in one chucking, and finish the clutch housing after heat treatment. The machining sequence is part of the design.",
    bullets: [
      "I designed and toleranced the planetary reduction for 7-axis mill-turn production.",
      "Turning and hobbing the input and output shafts in one chucking keeps the related features on the same setup, avoiding the alignment error another chucking can introduce.",
      "I finish the clutch housing OD and ID after heat treatment, so the final fit is machined after the operation that can distort the part.",
      "I think about the order of operations alongside the geometry: which features need a shared setup, and which surfaces need their final cut after heat treatment."
    ],
    tags: ["7-AXIS MILL-TURN", "HEAT-TREAT CONTROL", "ASME Y14.5"]
  },
  {
    id: "safe-enclosure",
    chapter: 2,
    headline: "Engineered Silence: The Acoustic SAFE Enclosure",
    oneLiner: "A 5-layer composite acoustic enclosure engineered around real CFM/FPM airflow math and vibration-isolated mounting.",
    bullets: [
      "Designed a 5-layer composite acoustic wall system to attenuate noise without choking airflow through the enclosure.",
      "Calculated CFM/FPM airflow requirements to size vents and ducting for adequate cooling under the acoustic constraint.",
      "Isolated the enclosed equipment from the housing structure with vibration-decoupled mounting, preventing structure-borne noise transfer."
    ],
    tags: ["CFM/FPM", "5-LAYER COMPOSITE", "VIBRATION DECOUPLING"]
  },
  {
    id: "m249",
    chapter: 3,
    headline: "From Point Cloud to Parametric: Reverse-Engineering Mission-Critical Hardware",
    oneLiner: "3D scan data reconstructed into fully toleranced, manufacturable CAD for the M249/MK46 platform.",
    bullets: [
      "Converted raw 3D scan point clouds of legacy mil-spec hardware into clean, parametric CAD models.",
      "Rebuilt ASME Y14.5 GD&T drawings from physical parts with no original technical data package — reverse-engineered datums, fits, and tolerance stacks from scratch.",
      "Delivered production-ready drawings meeting mil-spec interchangeability requirements for the M249/MK46 platform."
    ],
    tags: ["SCAN-TO-CAD", "NO TDP", "MIL-SPEC INTERCHANGEABILITY"]
  }
];
export const MATERIAL_MODE_LABELS = {
  solid: "[ SOLID PBR ]",
  blueprint: "[ BLUEPRINT WIREFRAME ]",
  exploded: "[ EXPLODED ASSEMBLY ]"
};
export const EXPLODE_OFFSETS = {
  output: 0.05,
  stage4: -0.099,
  stage3: -0.142,
  stage5: -0.177,
  bearing: -0.197,
  stage2: -0.23,
  stage1: -0.255,
  clutch: -0.291,
  handle: -0.354
};
export const GB_FASTENER_POP_M = 0.045;
export const GB_FASTENER_POP_COMPLETE = 0.35;
export const STAGE_IDS = ["stage1", "stage2", "stage3", "stage4", "stage5"];
export const GEAR_RATIOS = {
  stage1: 1,
  stage2: 0.28,
  stage3: 0.08,
  stage4: 0.022,
  stage5: 6e-3,
  planetMultiplier: 3.5
};
export const DRIVELINE_STAGE_IDS = ["stage1", "stage2", "stage5", "stage3", "stage4"];
export const ROTATION_TURNS = {
  stage1: 8,
  stage2: 5.2,
  stage3: 2.2,
  stage4: 1.43,
  stage5: 3.38
};
export const CLUTCH_SHIFT_DISTANCE = -0.015;
export const RING_SWITCH_TRAVEL_Z = 9525e-6;
export const RING_SWITCH_ROTATION = 2 * Math.PI / 3;
export const CAMERA_PATH = [
  // CH.01 — hero planetary torque wrench, 3/4 perspective (Station 1: [0, 0, 0])
  { position: [0.32, 0.16, 0.42], target: [0, 0, 0], fov: 42 },
  // CH.02 — x-ray & axial exploded reduction stages, lateral inspection (Station 1: [0, 0, 0])
  { position: [0.6, 0.08, 0.05], target: [0, 0.015, -0.07], fov: 36 },
  // CH.03 — acoustic enclosure / thermal airflow, macro isometric (Station 2: [28, 0, -6])
  // JG-021 remediation: pulled to R = 8.5 m about the arc center so the 1.6 x 3.4 m
  // subject clears the left CH.03 card lane with margin (was R ≈ 6.905 m — subject
  // filled ~97% of screen width and sat under the card).
  { position: [33.662357, 2.8, -0.010622], target: [28, 1.2, -6.35], fov: 36 },
  // CH.04 — digital systems: M249 platform overview & continuous zoom-out (Station 3: [56, 0, -12])
  // JG-021 remediation: near pose at ~2.5 m (the CH.04 override starts here —
  // zero goal jump at 0.760 — and dollies to ~3.5 m over a 0.18 window; the old
  // 0.82 m / 1.63 m macro poses put the 1.18 m receiver at 131% screen width,
  // under the CH.04 card).
  { position: [56.43, 0.65, -9.62], target: [56, 0, -12], fov: 35 }
];
export const PATH_SEGMENTS = [
  { fromIndex: 0, toIndex: 1, startProgress: 0, endProgress: 0.525 },
  { fromIndex: 1, toIndex: 2, startProgress: 0.525, endProgress: 0.6 },
  { fromIndex: 2, toIndex: 2, startProgress: 0.6, endProgress: 0.72 },
  { fromIndex: 2, toIndex: 3, startProgress: 0.72, endProgress: 0.76 }
];
const S2_ARC_CENTER = [28, 1.2, -6.35];
const S2_ARC_RADIUS = 8.5;
const S2_ARC_START_AZIMUTH = 0.8417486991100905;
const S2_ARC_SWEEP = 0.7;
export const S2_ARC_END_POSE = {
  position: [
    S2_ARC_CENTER[0] + S2_ARC_RADIUS * Math.cos(S2_ARC_START_AZIMUTH + S2_ARC_SWEEP),
    2.4,
    S2_ARC_CENTER[2] + S2_ARC_RADIUS * Math.sin(S2_ARC_START_AZIMUTH + S2_ARC_SWEEP)
  ],
  target: [28, 1.2, -6.35],
  fov: 35
};
const smoothstep = (t) => t * t * (3 - 2 * t);
const lerpN = (a, b, t) => a + (b - a) * t;
export function baseAt(progress) {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= 0.525) {
    const u = p / 0.525;
    const t = smoothstep(u);
    const from = CAMERA_PATH[0];
    const to = CAMERA_PATH[1];
    return {
      position: [
        lerpN(from.position[0], to.position[0], t),
        lerpN(from.position[1], to.position[1], t),
        lerpN(from.position[2], to.position[2], t)
      ],
      target: [
        lerpN(from.target[0], to.target[0], t),
        lerpN(from.target[1], to.target[1], t),
        lerpN(from.target[2], to.target[2], t)
      ],
      fov: lerpN(from.fov, to.fov, t)
    };
  }
  if (p <= 0.6) {
    const u = (p - 0.525) / (0.6 - 0.525);
    const t = smoothstep(u);
    const tTarget = smoothstep(smoothstep(t));
    const from = CAMERA_PATH[1];
    const to = CAMERA_PATH[2];
    return {
      position: [
        lerpN(from.position[0], to.position[0], t),
        lerpN(from.position[1], to.position[1], t),
        lerpN(from.position[2], to.position[2], t)
      ],
      target: [
        lerpN(from.target[0], to.target[0], tTarget),
        lerpN(from.target[1], to.target[1], tTarget),
        lerpN(from.target[2], to.target[2], tTarget)
      ],
      fov: lerpN(from.fov, to.fov, t)
    };
  }
  if (p <= 0.72) {
    const u = (p - 0.6) / (0.72 - 0.6);
    const t = smoothstep(u);
    const azimuth = S2_ARC_START_AZIMUTH + S2_ARC_SWEEP * t;
    return {
      position: [
        S2_ARC_CENTER[0] + S2_ARC_RADIUS * Math.cos(azimuth),
        lerpN(2.8, 2.4, t),
        S2_ARC_CENTER[2] + S2_ARC_RADIUS * Math.sin(azimuth)
      ],
      target: [...S2_ARC_CENTER],
      fov: lerpN(36, 35, t)
    };
  }
  if (p <= 0.76) {
    const u = (p - 0.72) / (0.76 - 0.72);
    const t = smoothstep(u);
    const tTarget = smoothstep(smoothstep(t));
    const to = CAMERA_PATH[3];
    return {
      position: [
        lerpN(S2_ARC_END_POSE.position[0], to.position[0], t),
        lerpN(S2_ARC_END_POSE.position[1], to.position[1], t),
        lerpN(S2_ARC_END_POSE.position[2], to.position[2], t)
      ],
      target: [
        lerpN(S2_ARC_END_POSE.target[0], to.target[0], tTarget),
        lerpN(S2_ARC_END_POSE.target[1], to.target[1], tTarget),
        lerpN(S2_ARC_END_POSE.target[2], to.target[2], tTarget)
      ],
      fov: lerpN(S2_ARC_END_POSE.fov, to.fov, t)
    };
  }
  const k3 = CAMERA_PATH[3];
  return { position: [...k3.position], target: [...k3.target], fov: k3.fov };
}
export function framingBiasVec(progress) {
  const ramp = 0.035;
  const w0 = Math.min(Math.max((0.22 - progress) / ramp, 0), 1);
  const w1 = Math.min(Math.max((progress - 0.24) / ramp, 0), Math.max((0.46 - progress) / ramp, 0), 1);
  const w2 = Math.min(Math.max((progress - 0.5) / ramp, 0), Math.max((0.72 - progress) / ramp, 0), 1);
  const w3 = Math.min(Math.max((progress - 0.76) / 0.02, 0), 1);
  const b01 = smoothstep(Math.max(w0, w1)) * 0.14;
  const b23 = smoothstep(Math.max(w2, w3)) * 0.38;
  const y2 = smoothstep(w2) * 0.75;
  const y3 = smoothstep(w3) * 0.84;
  return { x: Math.max(b01, b23), y: Math.max(y2, y3) };
}
export function framingBias(progress) {
  return framingBiasVec(progress).x;
}
export const SHIFT_CAMERA_KEYFRAMES = {
  /** Before shift: CH.01 wide view. */
  idle: { position: [0.32, 0.16, 0.42], target: [0, 0, 0], fov: 42 },
  /** Shift starts: zoom to P000420 groove area — blue groove visible. */
  zoomIn: { position: [0.14, 0.04, 0.19], target: [0, 0, 0.06], fov: 22 },
  /** Mid shift: hold tight — ring switch rising, red groove revealed. */
  hold: { position: [0.12, 0.03, 0.17], target: [0, 0, 0.06], fov: 20 },
  /** Shift complete: pull back to CH.01 framing. */
  pullBack: { position: [0.32, 0.16, 0.42], target: [0, 0, 0], fov: 42 }
};
export const LCD_REVEAL_WINDOW = {
  /** After the explode beat completes (measured ≈0.416). */
  start: 0.42,
  /** Stable rear LCD/buttons dwell before the wrench stage handoff. */
  dwellStart: 0.458,
  dwellEnd: 0.488,
  /** Before the wrench sink window (STAGE_TRANSITIONS.wrenchOut 0.525–0.565). */
  end: 0.525
};
export const LCD_ORBIT_KEYFRAMES = {
  /** Swing around the extracted train's mid-span toward the handle rear cap. */
  arc: { position: [0.28, 0.1, 0.5], target: [-0.05, 0.01, 0.18], fov: 34 },
  /** Dwell: 0.32 m behind the exploded rear cap, looking straight at the LCD cluster (world [−0.14, 0, 0.46]). */
  dwell: { position: [-0.28, 0.08, 0.74], target: [-0.14, 0, 0.46], fov: 31 }
};
export const ACTIVE_HOTSPOT_IDS = /* @__PURE__ */ new Set(["rotor", "duct-intake", "m249-trunnion"]);
export const HOTSPOTS = [
  {
    id: "rotor",
    occurrence: "ROTOR-1",
    kind: "inspect",
    label: "AIR MOTOR ROTOR",
    detail: "Vane-type pneumatic rotor — the input side of the reduction train. Balanced for high-RPM operation inside the machined motor housing.",
    annotation: {
      processNote: "BALANCED VANE ASSEMBLY"
    },
    chapters: [0, 1]
  },
  {
    id: "motor-housing",
    occurrence: "AIR MOTOR HOUSING-MACHINED-1",
    kind: "datum",
    label: "DATUM A — MOTOR BORE",
    detail: 'Machined air-motor housing. Primary datum for the rotating stack: RUNOUT < .001" TIR.',
    annotation: {
      datum: "A",
      frame: {
        characteristic: "RUNOUT",
        cells: ['.001" TIR', "A"],
        datums: ["A"]
      },
      processNote: 'RUNOUT < .001" TIR'
    },
    chapters: [0, 1]
  },
  {
    id: "flange",
    occurrence: "FLANGE-1",
    // Two role-map rows share this occurrence name; pick the motor-to-gearbox
    // mount face (z −0.1396), not the rear-cap twin (z −0.1895).
    pickNear: [1e-4, 0, -0.1396],
    kind: "datum",
    label: "DATUM B — MOUNT FACE",
    detail: 'Motor-to-gearbox interface flange. FLATNESS < .0008" holds stage alignment across the joint.',
    annotation: {
      datum: "B",
      frame: {
        characteristic: "FLATNESS",
        cells: ['.0008"'],
        datums: []
      },
      processNote: 'FLATNESS < .0008"'
    },
    chapters: [1]
  },
  {
    id: "gearbox-housing",
    occurrence: "P000245-1",
    kind: "inspect",
    label: "GEARBOX HOUSING",
    detail: "Outer housing of the planetary gearbox — ring gears and 4-planet carriers run inside this shell.",
    annotation: {
      frame: {
        characteristic: "POSITION",
        cells: ['.002" @ MMC']
      },
      processNote: 'POSITION .002" @ MMC'
    },
    chapters: [1]
  },
  {
    id: "mcu",
    occurrence: "MSP430F6726IPN-1",
    kind: "inspect",
    label: "MSP430 MCU",
    detail: "TI MSP430F6726 microcontroller — the smart-tool brain sampling pressure and driving the manometer display.",
    annotation: {
      processNote: "DIGITAL SAMPLING CONTROLLER"
    },
    chapters: [3]
  },
  {
    id: "lcd",
    occurrence: "MANOMETER LCD BK11356-1",
    kind: "inspect",
    label: "LCD MANOMETER",
    detail: "Onboard LCD manometer readout — live line-pressure telemetry at the operator’s thumb.",
    // Visible during the rear-LCD orbit dwell (LCD_REVEAL_WINDOW straddles
    // progress where the DOM chapter trigger already reports chapter 2).
    window: [0.44, 0.51],
    annotation: {
      processNote: "BACKLIT DIGITAL MANOMETER"
    },
    chapters: [3]
  },
  {
    id: "lipo",
    occurrence: "Tenergy LiPo Battery 3.7 V-1",
    kind: "inspect",
    label: "LiPo POWER CELL",
    detail: "Tenergy 3.7 V LiPo cell powering the electronics stack independent of the air line.",
    annotation: {
      processNote: "3.7V AUXILIARY POWER CELL"
    },
    chapters: [3]
  },
  /* ---------------- Station 2: RL-300 / MSP Acoustic SAFE Enclosure ---------------- */
  {
    id: "enclosure-chassis",
    occurrence: "ENCLOSURE_CHASSIS",
    kind: "inspect",
    label: "EXTRUDED UNIBODY CHASSIS",
    detail: "Structural welded 6061-T6 aluminum framework with modular internal mounting channels engineered for industrial plant environments.",
    annotation: {
      processNote: "6061-T6 WELDED UNIBODY"
    },
    chapters: [2]
  },
  {
    id: "composite-panels",
    occurrence: "COMPOSITE_PANELS",
    kind: "datum",
    label: "DATUM C — 5-LAYER COMPOSITE WALL",
    detail: "Mass-loaded vinyl core + dual-density closed-cell decoupling foam providing -43 dBA acoustic attenuation without thermal trapping.",
    annotation: {
      datum: "C",
      frame: {
        characteristic: "ATTENUATION",
        cells: ["-43 dBA", "5-LAYER"]
      },
      processNote: "-43 dBA NOISE ATTENUATION"
    },
    chapters: [2]
  },
  {
    id: "pump-housing",
    occurrence: "PUMP_HOUSING",
    kind: "inspect",
    label: "RL-300 ROTARY DRIVE UNIT",
    detail: "High-pressure continuous rotary positive displacement pump generating 115 dBA source noise, isolated via tuned acoustic chambers.",
    annotation: {
      processNote: "115 dBA CONTINUOUS DRIVE"
    },
    chapters: [2]
  },
  {
    id: "acoustic-baffles",
    occurrence: "ACOUSTIC_BAFFLES",
    kind: "datum",
    label: "DATUM D — INTERNAL LABYRINTH",
    detail: "Sound-dissipating geometric baffles trapping high-frequency acoustic waves while preserving aerodynamic cooling airflow.",
    annotation: {
      datum: "D",
      frame: {
        characteristic: "LABYRINTH",
        cells: ["SOUND ARRESTOR", "CFM TUNED"]
      },
      processNote: "INTERNAL SOUND BAFFLES"
    },
    chapters: [2]
  },
  {
    id: "isolation-mounts",
    occurrence: "ISOLATION_MOUNTS",
    kind: "datum",
    label: "DATUM E — DECOUPLING ISOLATORS",
    detail: "Elastomeric shear isolators preventing structure-borne motor vibration transfer and eliminating sympathetic unibody resonance.",
    annotation: {
      datum: "E",
      frame: {
        characteristic: "ISOLATION",
        cells: ["< 5 Hz TRANSMISSION"]
      },
      processNote: "ELASTOMERIC SHEAR MOUNTS"
    },
    chapters: [2]
  },
  {
    id: "duct-intake",
    occurrence: "DUCT_INTAKE",
    kind: "datum",
    label: "DATUM F — 1,850 CFM INTAKE AIRWAY",
    detail: "Laminar low-velocity cooling intake sized via CFM/FPM airflow math to maintain optimal thermal delta-T without acoustic leakage.",
    annotation: {
      datum: "F",
      frame: {
        characteristic: "LAMINAR FLOW",
        cells: ["1,850 CFM", "650 FPM"]
      },
      processNote: "1,850 CFM LAMINAR INTAKE"
    },
    chapters: [2]
  },
  {
    id: "duct-exhaust",
    occurrence: "DUCT_EXHAUST",
    kind: "datum",
    label: "DATUM G — ATTENUATED EXHAUST DUCT",
    detail: "Low-backpressure thermal discharge port with integrated dissipative sound arrestor rings discharging cooling air quietly.",
    annotation: {
      datum: "G",
      frame: {
        characteristic: "DISCHARGE",
        cells: ["LOW BACKPRESSURE"]
      },
      processNote: "THERMAL DISCHARGE PORT"
    },
    chapters: [2]
  },
  /* ---------------- Station 3: M249 / MK46 Platform ---------------- */
  {
    id: "m249-receiver",
    occurrence: "RECEIVER_MONOBLOC",
    kind: "datum",
    label: "DATUM A — RECEIVER MONOBLOC",
    detail: "Reverse-engineered CNC-machined steel receiver body with ASME Y14.5 mil-spec interchangeability tolerances reconstructed from 3D scans.",
    annotation: {
      datum: "A",
      frame: {
        characteristic: "PROFILE",
        cells: ['.0015" @ MMC', "A", "B"]
      },
      processNote: "MIL-SPEC INTERCHANGEABILITY"
    },
    chapters: [3]
  },
  {
    id: "m249-trunnion",
    occurrence: "BARREL_TRUNNION",
    kind: "datum",
    label: "DATUM B — BARREL TRUNNION BORE",
    detail: 'Precision-machined locking trunnion bore. Concentricity and RUNOUT < .0008" TIR for quick-change barrel interchangeability.',
    annotation: {
      datum: "B",
      frame: {
        characteristic: "RUNOUT",
        cells: ['.0008" TIR', "A"]
      },
      processNote: "QUICK-CHANGE LOCKUP BORE"
    },
    chapters: [3]
  },
  {
    id: "m249-rail",
    occurrence: "PICATINNY_TOP_RAIL",
    kind: "datum",
    label: "DATUM C — MIL-STD-1913 TOP RAIL",
    detail: "Parametrically reconstructed 1913 optical mounting rail with true recoil slot spacing and precision center-bore datum alignment.",
    annotation: {
      datum: "C",
      frame: {
        characteristic: "PARALLELISM",
        cells: ['.0010"', "A"]
      },
      processNote: "MIL-STD-1913 PROFILE"
    },
    chapters: [3]
  },
  {
    id: "m249-feed-tray",
    occurrence: "FEED_TRAY_INTERFACE",
    kind: "inspect",
    label: "FEED TRAY & BOLT CARRIER GUIDE",
    detail: "Reverse-engineered feed guide rails reconstructed from raw 3D scan point clouds without original technical data package (TDP).",
    annotation: {
      processNote: "DUAL-FEED GUIDE INTERFACE"
    },
    chapters: [3]
  }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhc2VTdHVkaWVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQ2FtZXJhS2V5ZnJhbWUsXG4gIENhc2VTdHVkeSxcbiAgQ2hhcHRlckRlZixcbiAgSG90c3BvdERlZixcbiAgTWF0ZXJpYWxNb2RlLFxufSBmcm9tICcuLi90eXBlcy9wb3J0Zm9saW8nXG5cbi8qKlxuICogQ29weSBhbmQgSFVEIHZvY2FidWxhcnkgc291cmNlZCB2ZXJiYXRpbSBmcm9tIE9VVEJPWC9wb3J0Zm9saW8tbW9kdWxlNC1jb3B5Lm1kXG4gKiAoZHJhZnRlZCBieSBIb25leSwgMjAyNi0wOC0yMCkuIERvIG5vdCBpbnZlbnQgbmV3IGNvcHkgaGVyZS5cbiAqL1xuXG5leHBvcnQgY29uc3QgQ0hBUFRFUlM6IENoYXB0ZXJEZWZbXSA9IFtcbiAge1xuICAgIGluZGV4OiAwLFxuICAgIGxhYmVsOiAnQ0guMDEgQVNTRU1CTFknLFxuICAgIHRpdGxlOiAnVGhlIEZ1bGwtU3RhY2sgUGh5c2ljYWwgJiBEaWdpdGFsIFN5c3RlbXMgQXJjaGl0ZWN0JyxcbiAgICBzdWJ0aXRsZTpcbiAgICAgICcyNSB5ZWFycyBvZiBwbGFuZXRhcnkgcmVkdWN0aW9uIGdlYXJib3hlcywgNy1heGlzIG1pbGwtdHVybiBhbmQgQVNNRSBZMTQuNSBHRCZUIOKAlCBicmlkZ2VkIGludG8gbW9kZXJuIHNvZnR3YXJlLCB3ZWItbmF0aXZlIDNELCBhbmQgQUkgYXV0b21hdGlvbi4nLFxuICAgIGNhbGxvdXRzOiBbJ1JVTk9VVCA8IC4wMDFcIiBUSVInXSxcbiAgICBkYXR1bTogJ0EnLFxuICB9LFxuICB7XG4gICAgaW5kZXg6IDEsXG4gICAgbGFiZWw6ICdDSC4wMiBYLVJBWSAvIEVYUExPREUnLFxuICAgIHRpdGxlOiAnSW5zaWRlIHRoZSBSZWR1Y3Rpb24gVHJhaW4nLFxuICAgIHN1YnRpdGxlOlxuICAgICAgJ0hvdXNpbmcgZmFkZXMgdG8gZ2hvc3Qgd2lyZWZyYW1lOyB0aGUgcGxhbmV0YXJ5IHN0YWdlcyBleHBsb2RlIGF4aWFsbHkgdG8gZXhwb3NlIHRoZSBnZWFyIHRyYWluLicsXG4gICAgY2FsbG91dHM6IFsnUlVOT1VUIDwgLjAwMVwiIFRJUicsICdQT1NJVElPTiAuMDAyXCIgQCBNTUMnXSxcbiAgICBkYXR1bTogJ0InLFxuICB9LFxuICB7XG4gICAgaW5kZXg6IDIsXG4gICAgbGFiZWw6ICdDSC4wMyBUSEVSTUFMIC8gQUNPVVNUSUMnLFxuICAgIHRpdGxlOiAnQWlyZmxvdyBBZ2FpbnN0IHRoZSBOb2lzZSBGbG9vcicsXG4gICAgc3VidGl0bGU6XG4gICAgICAnQ0ZNL0ZQTSBhaXJmbG93IG1hdGgsIGNvbXBvc2l0ZSBhY291c3RpYyB3YWxscywgYW5kIHZpYnJhdGlvbi1kZWNvdXBsZWQgbW91bnRpbmcg4oCUIHNpbGVuY2UgYXMgYW4gZW5naW5lZXJpbmcgZGVsaXZlcmFibGUuJyxcbiAgICBjYWxsb3V0czogWydGTEFUTkVTUyA8IC4wMDA4XCInXSxcbiAgICBkYXR1bTogJ0MnLFxuICB9LFxuICB7XG4gICAgaW5kZXg6IDMsXG4gICAgbGFiZWw6ICdDSC4wNCBESUdJVEFMIFNZU1RFTVMnLFxuICAgIHRpdGxlOiAnRnJvbSBQb2ludCBDbG91ZCB0byBQcm9kdWN0aW9uIENvZGUnLFxuICAgIHN1YnRpdGxlOlxuICAgICAgJ1RoZSBzYW1lIHRvb2wgY2FycmllcyBhbiBNU1A0MzAsIFVTQiwgTGlQbyBhbmQgTENEIG1hbm9tZXRlciDigJQgcGh5c2ljYWwgc3lzdGVtcyBkaXNzb2x2aW5nIGludG8gZGlnaXRhbCBvbmVzLicsXG4gICAgY2FsbG91dHM6IFsnUE9TSVRJT04gLjAwMlwiIEAgTU1DJywgJ1JVTk9VVCA8IC4wMDFcIiBUSVInXSxcbiAgICBkYXR1bTogJ0EnLFxuICB9LFxuXVxuXG4vKipcbiAqIENILjAxIG1hY2hpbmUgaWRlbnRpdHkg4oCUIHRoZSBPTkxZIHBsYWNlIHRoZSBzdGF0aW9uLTEgdG9vbCBpcyBuYW1lZCBmb3IgdGhlXG4gKiB2aXNpdG9yLiBFdmVyeSBkaXNwbGF5ZWQgc3VyZmFjZSAoU3RhdGljUG9zdGVyLCBCb290U2VxdWVuY2UsIHRoZSBkcmF3aW5nXG4gKiBzaGVldCB0aXRsZSBibG9jaywgdGhlIEhVRCBzdGF0aW9uIGxpc3QpIHJlYWRzIGZyb20gaGVyZSBzbyB0aGUgcHVibGljXG4gKiBub21lbmNsYXR1cmUgY2Fubm90IGRyaWZ0IGFwYXJ0IGFnYWluLlxuICpcbiAqIE5vbWVuY2xhdHVyZSBydWxlIChNYXJrLCAyMDI2LTA5LTA1KTpcbiAqICAtIGBQVEctSFAtMTAwMCBSRVYwM2AgYW5kIFwiSGlnaC1QcmVjaXNpb24gSW5kdXN0cmlhbCBUb3JxdWUgR3VuXCIgYXJlIHRoZVxuICogICAgb25seSBwdWJsaWMgZGVzaWduYXRpb25zIGZvciB0aGlzIG1hY2hpbmUuXG4gKiAgLSBgRDEtQVBgIGlzIHRoZSBpbi1ob3VzZSBwYXJ0IG51bWJlciBzaGFyZWQgYmV0d2VlbiBNYXJrIGFuZCBoaXMgcGFydG5lci5cbiAqICAgIEl0IG11c3QgTkVWRVIgcmVhY2ggdGhlIHNjcmVlbi4gSXQgc3RheXMgaW4gc291cmNlIGNvbW1lbnRzIGFuZCBpblxuICogICAgYG5vZGVSb2xlcy50c2AsIHdoaWNoIHN1YnN0cmluZy1tYXRjaGVzIHRoZSBDQUQgbm9kZSBuYW1lcyBleHBvcnRlZCB1bmRlclxuICogICAgdGhhdCBudW1iZXIg4oCUIHJlbmFtaW5nIGl0IHRoZXJlIHdvdWxkIGJyZWFrIHJvbGUgY2xhc3NpZmljYXRpb24gZm9yIGFsbFxuICogICAgMzE2IG9jY3VycmVuY2VzIGluIGByb2xlLW1hcC5qc29uYC5cbiAqICAtIGBKR1VOYCBpcyBsaWtld2lzZSBpbi1ob3VzZSBhbmQgaXMgbmV2ZXIgZGlzcGxheWVkLlxuICogIC0gYFJMMzAwYCBkZXNpZ25hdGVzIHRoZSBzdGF0aW9uLTIgYWNvdXN0aWMgZW5jbG9zdXJlIE9OTFksIG5ldmVyIHRoaXMgdG9vbFxuICogICAgYW5kIG5ldmVyIHRoZSBzaXRlIGFzIGEgd2hvbGUuXG4gKi9cbmV4cG9ydCBjb25zdCBBU1NFTUJMWV9JREVOVElUWSA9IHtcbiAgbWFjaGluZTogJ0hpZ2gtUHJlY2lzaW9uIEluZHVzdHJpYWwgVG9ycXVlIEd1bicsXG4gIGRyYXdpbmdOdW1iZXI6ICdQVEctSFAtMTAwMCcsXG4gIHJldmlzaW9uOiAnUkVWMDMnLFxuICBzcGVjOiAnTXVsdGktc3RhZ2UgcGxhbmV0YXJ5IHJlZHVjdGlvbiDCtyA3LWF4aXMgbWlsbC10dXJuIMK3IEFTTUUgWTE0LjUgR0QmVCcsXG59IGFzIGNvbnN0XG5cbmV4cG9ydCBjb25zdCBDQVNFX1NUVURJRVM6IENhc2VTdHVkeVtdID0gW1xuICB7XG4gICAgaWQ6ICdnZWFyYm94JyxcbiAgICBjaGFwdGVyOiAxLFxuICAgIGhlYWRsaW5lOiAnTWFjaGluaW5nIGRlY2lzaW9ucyBiZWhpbmQgdGhlIHJlZHVjdGlvbiB0cmFpbicsXG4gICAgb25lTGluZXI6XG4gICAgICAnSSB0dXJuIGFuZCBob2IgdGhlIGlucHV0IGFuZCBvdXRwdXQgc2hhZnRzIGluIG9uZSBjaHVja2luZywgYW5kIGZpbmlzaCB0aGUgY2x1dGNoIGhvdXNpbmcgYWZ0ZXIgaGVhdCB0cmVhdG1lbnQuIFRoZSBtYWNoaW5pbmcgc2VxdWVuY2UgaXMgcGFydCBvZiB0aGUgZGVzaWduLicsXG4gICAgYnVsbGV0czogW1xuICAgICAgJ0kgZGVzaWduZWQgYW5kIHRvbGVyYW5jZWQgdGhlIHBsYW5ldGFyeSByZWR1Y3Rpb24gZm9yIDctYXhpcyBtaWxsLXR1cm4gcHJvZHVjdGlvbi4nLFxuICAgICAgJ1R1cm5pbmcgYW5kIGhvYmJpbmcgdGhlIGlucHV0IGFuZCBvdXRwdXQgc2hhZnRzIGluIG9uZSBjaHVja2luZyBrZWVwcyB0aGUgcmVsYXRlZCBmZWF0dXJlcyBvbiB0aGUgc2FtZSBzZXR1cCwgYXZvaWRpbmcgdGhlIGFsaWdubWVudCBlcnJvciBhbm90aGVyIGNodWNraW5nIGNhbiBpbnRyb2R1Y2UuJyxcbiAgICAgICdJIGZpbmlzaCB0aGUgY2x1dGNoIGhvdXNpbmcgT0QgYW5kIElEIGFmdGVyIGhlYXQgdHJlYXRtZW50LCBzbyB0aGUgZmluYWwgZml0IGlzIG1hY2hpbmVkIGFmdGVyIHRoZSBvcGVyYXRpb24gdGhhdCBjYW4gZGlzdG9ydCB0aGUgcGFydC4nLFxuICAgICAgJ0kgdGhpbmsgYWJvdXQgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbnMgYWxvbmdzaWRlIHRoZSBnZW9tZXRyeTogd2hpY2ggZmVhdHVyZXMgbmVlZCBhIHNoYXJlZCBzZXR1cCwgYW5kIHdoaWNoIHN1cmZhY2VzIG5lZWQgdGhlaXIgZmluYWwgY3V0IGFmdGVyIGhlYXQgdHJlYXRtZW50LicsXG4gICAgXSxcbiAgICB0YWdzOiBbJzctQVhJUyBNSUxMLVRVUk4nLCAnSEVBVC1UUkVBVCBDT05UUk9MJywgJ0FTTUUgWTE0LjUnXSxcbiAgfSxcbiAge1xuICAgIGlkOiAnc2FmZS1lbmNsb3N1cmUnLFxuICAgIGNoYXB0ZXI6IDIsXG4gICAgaGVhZGxpbmU6ICdFbmdpbmVlcmVkIFNpbGVuY2U6IFRoZSBBY291c3RpYyBTQUZFIEVuY2xvc3VyZScsXG4gICAgb25lTGluZXI6XG4gICAgICAnQSA1LWxheWVyIGNvbXBvc2l0ZSBhY291c3RpYyBlbmNsb3N1cmUgZW5naW5lZXJlZCBhcm91bmQgcmVhbCBDRk0vRlBNIGFpcmZsb3cgbWF0aCBhbmQgdmlicmF0aW9uLWlzb2xhdGVkIG1vdW50aW5nLicsXG4gICAgYnVsbGV0czogW1xuICAgICAgJ0Rlc2lnbmVkIGEgNS1sYXllciBjb21wb3NpdGUgYWNvdXN0aWMgd2FsbCBzeXN0ZW0gdG8gYXR0ZW51YXRlIG5vaXNlIHdpdGhvdXQgY2hva2luZyBhaXJmbG93IHRocm91Z2ggdGhlIGVuY2xvc3VyZS4nLFxuICAgICAgJ0NhbGN1bGF0ZWQgQ0ZNL0ZQTSBhaXJmbG93IHJlcXVpcmVtZW50cyB0byBzaXplIHZlbnRzIGFuZCBkdWN0aW5nIGZvciBhZGVxdWF0ZSBjb29saW5nIHVuZGVyIHRoZSBhY291c3RpYyBjb25zdHJhaW50LicsXG4gICAgICAnSXNvbGF0ZWQgdGhlIGVuY2xvc2VkIGVxdWlwbWVudCBmcm9tIHRoZSBob3VzaW5nIHN0cnVjdHVyZSB3aXRoIHZpYnJhdGlvbi1kZWNvdXBsZWQgbW91bnRpbmcsIHByZXZlbnRpbmcgc3RydWN0dXJlLWJvcm5lIG5vaXNlIHRyYW5zZmVyLicsXG4gICAgXSxcbiAgICB0YWdzOiBbJ0NGTS9GUE0nLCAnNS1MQVlFUiBDT01QT1NJVEUnLCAnVklCUkFUSU9OIERFQ09VUExJTkcnXSxcbiAgfSxcbiAge1xuICAgIGlkOiAnbTI0OScsXG4gICAgY2hhcHRlcjogMyxcbiAgICBoZWFkbGluZTogJ0Zyb20gUG9pbnQgQ2xvdWQgdG8gUGFyYW1ldHJpYzogUmV2ZXJzZS1FbmdpbmVlcmluZyBNaXNzaW9uLUNyaXRpY2FsIEhhcmR3YXJlJyxcbiAgICBvbmVMaW5lcjpcbiAgICAgICczRCBzY2FuIGRhdGEgcmVjb25zdHJ1Y3RlZCBpbnRvIGZ1bGx5IHRvbGVyYW5jZWQsIG1hbnVmYWN0dXJhYmxlIENBRCBmb3IgdGhlIE0yNDkvTUs0NiBwbGF0Zm9ybS4nLFxuICAgIGJ1bGxldHM6IFtcbiAgICAgICdDb252ZXJ0ZWQgcmF3IDNEIHNjYW4gcG9pbnQgY2xvdWRzIG9mIGxlZ2FjeSBtaWwtc3BlYyBoYXJkd2FyZSBpbnRvIGNsZWFuLCBwYXJhbWV0cmljIENBRCBtb2RlbHMuJyxcbiAgICAgICdSZWJ1aWx0IEFTTUUgWTE0LjUgR0QmVCBkcmF3aW5ncyBmcm9tIHBoeXNpY2FsIHBhcnRzIHdpdGggbm8gb3JpZ2luYWwgdGVjaG5pY2FsIGRhdGEgcGFja2FnZSDigJQgcmV2ZXJzZS1lbmdpbmVlcmVkIGRhdHVtcywgZml0cywgYW5kIHRvbGVyYW5jZSBzdGFja3MgZnJvbSBzY3JhdGNoLicsXG4gICAgICAnRGVsaXZlcmVkIHByb2R1Y3Rpb24tcmVhZHkgZHJhd2luZ3MgbWVldGluZyBtaWwtc3BlYyBpbnRlcmNoYW5nZWFiaWxpdHkgcmVxdWlyZW1lbnRzIGZvciB0aGUgTTI0OS9NSzQ2IHBsYXRmb3JtLicsXG4gICAgXSxcbiAgICB0YWdzOiBbJ1NDQU4tVE8tQ0FEJywgJ05PIFREUCcsICdNSUwtU1BFQyBJTlRFUkNIQU5HRUFCSUxJVFknXSxcbiAgfSxcbl1cblxuZXhwb3J0IGNvbnN0IE1BVEVSSUFMX01PREVfTEFCRUxTOiBSZWNvcmQ8TWF0ZXJpYWxNb2RlLCBzdHJpbmc+ID0ge1xuICBzb2xpZDogJ1sgU09MSUQgUEJSIF0nLFxuICBibHVlcHJpbnQ6ICdbIEJMVUVQUklOVCBXSVJFRlJBTUUgXScsXG4gIGV4cGxvZGVkOiAnWyBFWFBMT0RFRCBBU1NFTUJMWSBdJyxcbn1cblxuLyoqXG4gKiBBeGlhbCBleHBsb3Npb24gb2Zmc2V0cyBpbiBNRVRFUlMsIG9uIHRoZSBEMS1BUCAyLXNwZWVkIGdlYXJib3guIE1lYXN1cmVkXG4gKiByZXN0LXBvc2UgZ2VvbWV0cnkgKERlZmF1bHQuZ2xiKTogdGhlIGhhbmRsZSBhc3NlbWJseSBzaXRzIGF0IOKIklogKGNlbnRlclxuICogeiDiiYgg4oiSMC4xNjgpLCB0aGUgb3V0cHV0IHNwaW5kbGUgY2x1c3RlciBhdCArWiwgYW5kIHRoZSBQMDAwMjQ1IG91dGVyXG4gKiBob3VzaW5nIChyZWFyIGZhY2UgeiA9IOKIkjAuMDc0KSBuZWNrcyBkb3duIHRvd2FyZCB0aGUgK1ogc25vdXQuIFRoZVxuICogaW50ZXJuYWxzIHRoZXJlZm9yZSBDQU5OT1QgZXhpdCB0aGUgZnJvbnQ6IHRoZSBwbGFuZXRhcnkgc3RhZ2VzIGFuZCB0aGVcbiAqIGNsdXRjaCBleHRyYWN0IHJlYXJ3YXJkICjiiJJaLCB0b3dhcmQgdGhlIHJlbW92ZWQgaGFuZGxlKSB3aGlsZSBvbmx5IHRoZVxuICogb3V0cHV0LXNwaW5kbGUgcGFydHMgZXhpdCBmb3J3YXJkICgrWikgdGhyb3VnaCB0aGUgc25vdXQuIFRoZSBob3VzaW5nXG4gKiBpdHNlbGYgbmV2ZXIgbW92ZXMuXG4gKlxuICogRXhwbG9kZWQgbGluZSBvcmRlciBpcyB0aGUgRFJJVkVMSU5FIG9yZGVyLCBub3QgdGhlIHN0YWdlIG51bWJlcmluZyAoTWFya1xuICogcmV2aWV3IDIwMjYtMDgtMjQpOiB0aGUgQTAwMDYwNiBjYWdlIChQMDAxODQ5KSBpcyB0aGUgVEhJUkQgY2FnZSBvZiBmaXZlLFxuICogc28gYmVoaW5kIHRoZSBob3VzaW5nIHJlYXIgZmFjZSB0aGUgbGluZSByZWFkcyBQMDAzMDQ3IChzdGFnZSA0LCBmaXJzdFxuICogb3V0KSDihpIgUDAwMzA0NSAoc3RhZ2UgMykg4oaSIFAwMDE4NDkgKEEwMDA2MDYpIOKGkiBQMDAxODM3IChzdGFnZSAyKSDihpJcbiAqIFAwMDE4MzYgKHN0YWdlIDEsIGZ1cnRoZXN0IGJhY2spLiBLZXllZCBieSBwYXJ0IG51bWJlcnMsIG5ldmVyIHN0YWdlXG4gKiBuYW1lcyDigJQgTWFyayBoYXMgY2FsbGVkIEEwMDA2MDYgYm90aCBcInN0YWdlIDVcIiBhbmQgXCJ0aGUgM3JkIHN0YWdlIGNhZ2VcIi5cbiAqXG4gKiBNYWduaXR1ZGVzIGFyZSBhIGNsZWFyYW5jZS1kZXJpdmVkIGxhZGRlciBtZWFzdXJlZCBmcm9tIHRoZSBKU09OLWNodW5rXG4gKiByZXN0IHNwYW5zICguc2NyYXRjaC9tZWFzdXJlLXNwYW5zLm1qcywgdmFsaWRhdGVkIGFnYWluc3QgdGhlIDA4LTI0IGhhbmRvZmZcbiAqIGFuY2hvcnMpOiB0aGUgZmlyc3QgY2FnZSBjbGVhcnMgdGhlIGhvdXNpbmcgcmVhciBmYWNlIGJ5IOKJpTE0IG1tLFxuICogYWRqYWNlbnQgZXhwbG9kZWQgdW5pdHMga2VlcCDiiaUxNSBtbSBnYXBzLCBhbmQgdGhlIGhhbmRsZSBiYWNrcyBvZmYgd2l0aFxuICogMjUgbW0gb2YgYWlyIGJlaGluZCB0aGUgY2x1dGNoICh3aWRlbmVkIGZyb20gMTQuNSBtbSBwZXIgdGhlIHNhbWUgcmV2aWV3XG4gKiBzbyB0aGUgZXh0cmFjdGlvbiByZWFkcyB3aXRoIGdlbmVyb3VzIHNwYWNpbmcpLlxuICpcbiAqIFBhc3MgMyAoMjAyNi0wOC0yNSk6IHRoZSBLMDAwMDA0IHRocnVzdCBiZWFyaW5nIHJpbmcg4oCUIHByZXZpb3VzbHkgdGhlXG4gKiBnZWFyYm94J3MgT05MWSB1bnRhZ2dlZCBwYXJ0IChyZXN0IHNwYW4geiBb4oiSMC4wNTgsIOKIkjAuMDUxXSwg4oyAMC4wNTggw5cgNyBtbSxcbiAqIHJvbGUtbWFwIGNlbnRlciB6IOKIkjAuMDU0NSkg4oCUIGV4dHJhY3RzIGFzIGl0cyBvd24gdW5pdCBkaXJlY3RseSBiZWhpbmRcbiAqIEEwMDA2MDYuIEhvbm9yaW5nIHRoZSDiiaUxNSBtbSBhZGphY2VudC1nYXAgcnVsZSBvbiBib3RoIG9mIGl0cyBzaWRlcyBjb3N0c1xuICogMTUgKyA3ICsgMTUgbW0gd2hlcmUgb25seSAxNiBtbSBleGlzdGVkLCBzbyBldmVyeSB1bml0IGJlaGluZCBpdCAoc3RhZ2UgMixcbiAqIHN0YWdlIDEsIGNsdXRjaCwgaGFuZGxlKSBzaGlmdHMgfjIyIG1tIGZ1cnRoZXIgYmFjazsgdW5pdHMgYWhlYWQgb2YgdGhlXG4gKiBiZWFyaW5nIGFyZSB1bnRvdWNoZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBFWFBMT0RFX09GRlNFVFMgPSB7XG4gIG91dHB1dDogMC4wNSxcbiAgc3RhZ2U0OiAtMC4wOTksXG4gIHN0YWdlMzogLTAuMTQyLFxuICBzdGFnZTU6IC0wLjE3NyxcbiAgYmVhcmluZzogLTAuMTk3LFxuICBzdGFnZTI6IC0wLjIzLFxuICBzdGFnZTE6IC0wLjI1NSxcbiAgY2x1dGNoOiAtMC4yOTEsXG4gIGhhbmRsZTogLTAuMzU0LFxufSBhcyBjb25zdFxuXG4vKipcbiAqIEdlYXJib3ggcmFkaWFsIGZhc3RlbmVycyAoOTA5MTBBODE1IGJ1dHRvbi1oZWFkIFRvcnggc2NyZXdzLCBvd25lciBzcGVjXG4gKiAyMDI2LTA5LTAyKTogZm91ciBib2x0cyBvbiBhIDkwwrAtc3BhY2VkIGJvbHQgY2lyY2xlIGNvbmNlbnRyaWMgd2l0aCB0aGVcbiAqIGRyaXZldHJhaW4sIHRocmVhZGluZyB0aHJvdWdoIHRoZSBQMDAwMjQ1IGhvdXNpbmcgaW50byB0aGUgY2x1dGNoIGhvdXNpbmcuXG4gKiBUaGV5IHBvcCBvdXR3YXJkIGFsb25nIHRoZWlyIG93biByYWRpYWwgYXhlcyBvbiB0aGUgTEVBRElORyBlZGdlIG9mIHRoZVxuICogZXhwbG9kZSBlbnZlbG9wZSAoZnVsbHkgb3V0IGJ5IGV4cGxvZGU9MC4zNSwgYWhlYWQgb2YgdGhlIHJlYXIgZXh0cmFjdGlvbiksXG4gKiB0aGVuIHJpZGUgd2l0aCB0aGUgY2x1dGNoIGhvdXNpbmcuIENBRC10cnVlIHBsYWNlbWVudCAoSkdVTi0xLmdsYik6IG5vZGVcbiAqIG9yaWdpbnMgYXQgYXppbXV0aHMgMMKwLzkwwrAvMTgwwrAv4oiSOTDCsCwgciAzMi4zIG1tLCB6IOKIkjY5LjYgbW0sIHNoYW5rcyByYWRpYWwuXG4gKi9cbmV4cG9ydCBjb25zdCBHQl9GQVNURU5FUl9QT1BfTSA9IDAuMDQ1XG4vKiogZXhwbG9kZSB2YWx1ZSBhdCB3aGljaCB0aGUgcmFkaWFsIHBvcCBjb21wbGV0ZXMgKGxlYWRpbmcgZWRnZSkuICovXG5leHBvcnQgY29uc3QgR0JfRkFTVEVORVJfUE9QX0NPTVBMRVRFID0gMC4zNVxuXG5leHBvcnQgdHlwZSBTdGFnZUlkID0gJ3N0YWdlMScgfCAnc3RhZ2UyJyB8ICdzdGFnZTMnIHwgJ3N0YWdlNCcgfCAnc3RhZ2U1J1xuZXhwb3J0IGNvbnN0IFNUQUdFX0lEUzogcmVhZG9ubHkgU3RhZ2VJZFtdID0gWydzdGFnZTEnLCAnc3RhZ2UyJywgJ3N0YWdlMycsICdzdGFnZTQnLCAnc3RhZ2U1J11cblxuLyoqXG4gKiBDYXJyaWVyLXNwZWVkIHJhdGlvcyBwZXIgc3RhZ2UsIHJlbGF0aXZlIHRvIHRoZSBpbnB1dCBkcml2ZSAoY3VtdWxhdGl2ZVxuICogcmVkdWN0aW9uOiBzdGFnZSBOJ3MgY2FycmllciB0dXJucyBhdCBpdHMgbGlzdGVkIGZyYWN0aW9uIG9mIGlucHV0IHNwZWVkKSxcbiAqIHBsdXMgdGhlIHBsYW5ldCBjb3VudGVyLXJvdGF0aW9uIG11bHRpcGxpZXIgZm9yIHRoZSBlcGljeWNsaWMgc3BpbiDigJQgZWFjaFxuICogcGxhbmV0IGNvdW50ZXItcm90YXRlcyBvbiBpdHMgcGluIGF0IOKIknN0YWdlQW5nbGUgw5cgbXVsdGlwbGllci5cbiAqL1xuZXhwb3J0IGNvbnN0IEdFQVJfUkFUSU9TID0ge1xuICBzdGFnZTE6IDEuMCxcbiAgc3RhZ2UyOiAwLjI4LFxuICBzdGFnZTM6IDAuMDgsXG4gIHN0YWdlNDogMC4wMjIsXG4gIHN0YWdlNTogMC4wMDYsXG4gIHBsYW5ldE11bHRpcGxpZXI6IDMuNSxcbn0gYXMgY29uc3RcblxuZXhwb3J0IGNvbnN0IERSSVZFTElORV9TVEFHRV9JRFM6IHJlYWRvbmx5IFN0YWdlSWRbXSA9IFsnc3RhZ2UxJywgJ3N0YWdlMicsICdzdGFnZTUnLCAnc3RhZ2UzJywgJ3N0YWdlNCddXG5cbi8qKlxuICogRGlzcGxheSByb3RhdGlvbiB0dXJucyAoSkctMDMxLCAyMDI2LTA5LTA3KSDigJQgdmlzdWFsIG11bHRpcGxpZXIgZm9yIHRoZVxuICogc2Nyb2xsLXNjcnViIGdlYXIgc3dlZXA6IGFjcm9zcyB0aGUgZnVsbCBnZWFyUm90YXRpb24gcHJveHkgc3dlZXAgZWFjaFxuICogY2FycmllciBjb21wbGV0ZXMgUk9UQVRJT05fVFVSTlNbc3RhZ2VdIHJldm9sdXRpb25zLlxuICpcbiAqIE1hcHBlZCB0byB0aGUgcGh5c2ljYWwgdmlzdWFsIGRyaXZlbGluZSBvcmRlciBmcm9tIG1vdG9yIHRvIHNub3V0XG4gKiAoU3RhZ2UgMSBbUDAwMTgzNl0g4oaSIFN0YWdlIDIgW1AwMDE4MzddIOKGkiBTdGFnZSA1IFtBMDAwNjA2XSDihpIgU3RhZ2UgMyBbUDAwMzA0NV0g4oaSIFN0YWdlIDQgW1AwMDMwNDddKSxcbiAqIHdpdGggZWFjaCBzdWNjZXNzaXZlIHBoeXNpY2FsIGNhZ2Ugcm90YXRpbmcgYXQgfjY1JSBvZiB0aGUgcHJlY2VkaW5nIGNhZ2UncyBzcGVlZDpcbiAqICAgLSBQb3MgMSAoU3RhZ2UgMSwgUDAwMTgzNik6IDguMCB0dXJuc1xuICogICAtIFBvcyAyIChTdGFnZSAyLCBQMDAxODM3KTogNS4yIHR1cm5zICg2NSUgb2YgUG9zIDEpXG4gKiAgIC0gUG9zIDMgKFN0YWdlIDUsIFAwMDE4NDkgLyBBMDAwNjA2KTogMy4zOCB0dXJucyAoNjUlIG9mIFBvcyAyKVxuICogICAtIFBvcyA0IChTdGFnZSAzLCBQMDAzMDQ1KTogMi4yMCB0dXJucyAoNjUlIG9mIFBvcyAzKVxuICogICAtIFBvcyA1IChTdGFnZSA0LCBQMDAzMDQ3KTogMS40MyB0dXJucyAoNjUlIG9mIFBvcyA0KVxuICpcbiAqIFRoaXMgZW5zdXJlcyB0aGF0IHdoZW4gdmlld2luZyB0aGUgZXhwbG9kZWQgYXNzZW1ibHkgZnJvbSBsZWZ0IChtb3RvcikgdG8gcmlnaHQgKHNub3V0KSxcbiAqIGVhY2ggY2FnZSB2aXNpYmx5IHNsb3dzIGRvd24gYXQgYSBjb25zaXN0ZW50IHJhdGUgd2l0aG91dCBtaWQtc3RhY2sgc3BlZWQganVtcHMgb3IgcmV2ZXJzYWxzLlxuICogR0VBUl9SQVRJT1MgcmVtYWlucyB0aGUga2luZW1hdGljIHJlZmVyZW5jZTsgcGxhbmV0IGNvdW50ZXItcm90YXRpb24gc3RheXMgcGVnZ2VkIHRvIHRoZVxuICogY2FycmllcidzIGRpc3BsYXkgYW5nbGUgKHNlZSBhcHBseUdlYXJSb3RhdGlvbikuXG4gKi9cbmV4cG9ydCBjb25zdCBST1RBVElPTl9UVVJOUyA9IHtcbiAgc3RhZ2UxOiA4LFxuICBzdGFnZTI6IDUuMixcbiAgc3RhZ2UzOiAyLjIsXG4gIHN0YWdlNDogMS40MyxcbiAgc3RhZ2U1OiAzLjM4LFxufSBhcyBjb25zdFxuXG4vKipcbiAqIE1lY2hhbmljYWwgc2hpZnQgdHJhdmVsIChtZXRlcnMpIGZvciB0aGUgdHdvLXNwZWVkIGNsdXRjaCBmb3JrIHRyYWluOlxuICogc2hpZnRlciBmb3JrIChQMDAwNzI0KSBhbmQgc2hpZnRlciBjYW0gKFAwMDAyOTcpLlxuICogVGhlc2Ugc2xpZGUgdG9nZXRoZXIg4oiSWiAodG93YXJkIHRoZSBoYW5kbGUpIGJlZm9yZSB0aGUgZXhwbG9zaW9uIGJlZ2lucy5cbiAqIE5PVEU6IFRoZSByaW5nIHN3aXRjaCBhc3NlbWJseSAoUDAwMzA2OCArIDPDlyBQMDAwNDY0IHBpbnMgKyAzw5cgSzAwMDE1NiBiYWxsXG4gKiBwbHVuZ2VycykgaXMgYW5pbWF0ZWQgU0VQQVJBVEVMWSBpbiBUb3JxdWVXcmVuY2hIZXJvIOKAlCBpdCB0cmF2ZWxzICtaIHdpdGhcbiAqIGEgMTIwwrAgY2FtIHJvdGF0aW9uIChzZWUgUklOR19TV0lUQ0hfVFJBVkVMX1ogYmVsb3cpLlxuICovXG5leHBvcnQgY29uc3QgQ0xVVENIX1NISUZUX0RJU1RBTkNFID0gLTAuMDE1XG5cbi8qKlxuICogUmluZyBzd2l0Y2ggKFAwMDMwNjgpIGNhbS1mb2xsb3dlciBraW5lbWF0aWNzLlxuICogQXMgdGhlIGNsdXRjaCBzaGlmdHMsIHRoZSByaW5nIHN3aXRjaCBmb2xsb3dzIHRoZSBoZWxpY2FsIGNhbSBncm9vdmUgb25cbiAqIFAwMDA0MjA6IGl0IHRyYXZlbHMgK1ogKGF3YXkgZnJvbSBoYW5kbGUsIHRvd2FyZCBzbm91dCkgYnkgOS41MjUgbW1cbiAqICgwLjM3NSBpbikgYW5kIHNpbXVsdGFuZW91c2x5IHJvdGF0ZXMgMTIwwrAgYXJvdW5kIHRoZSBkcml2ZXRyYWluIGF4aXNcbiAqIGZvbGxvd2luZyB0aGUgZ3Jvb3ZlLiBSb3RhdGlvbiBpcyBDVyB3aGVuIHZpZXdlZCBmcm9tIHRoZSBoYW5kbGUgKGF3YXlcbiAqIGZyb20gY2FtZXJhIGluIHRoZSBDSC4wMSAzLzQgdmlldykuXG4gKi9cbmV4cG9ydCBjb25zdCBSSU5HX1NXSVRDSF9UUkFWRUxfWiA9IDAuMDA5NTI1ICAvLyArOS41MjUgbW0gKCtaID0gYXdheSBmcm9tIGhhbmRsZSlcbmV4cG9ydCBjb25zdCBSSU5HX1NXSVRDSF9ST1RBVElPTiA9ICgyICogTWF0aC5QSSkgLyAzICAvLyAxMjDCsCwgYXBwbGllZCBhcyBuZWdhdGl2ZSAoQ1cgZnJvbSByZWFyKVxuXG4vKipcbiAqIENhbWVyYSB0cmFqZWN0b3J5IHN0YXRlIG1hY2hpbmUga2V5ZnJhbWVzIOKAlCBvbmUgcGVyIHNjcm9sbCBjaGFwdGVyLlxuICogQ29vcmRpbmF0ZXMgYXJlIGluIG1ldGVycyBpbiB3b3JsZCBzcGFjZSBhY3Jvc3MgdGhlIHRocmVlIGRpc2NyZXRlIDNEIHN0YXRpb25zOlxuICogICBTdGF0aW9uIDEgKGBbMCwgMCwgMF1gKTogICAgIENILjAxICYgQ0guMDIgVG9ycXVlIFdyZW5jaCBIZXJvXG4gKiAgIFN0YXRpb24gMiAoYFsyOCwgMCwgLTZdYCk6ICAgQ0guMDMgUkwtMzAwIC8gTVNQIEFjb3VzdGljIFNBRkUgRW5jbG9zdXJlXG4gKiAgIFN0YXRpb24gMyAoYFs1NiwgMCwgLTEyXWApOiAgQ0guMDQgTTI0OSAvIE1LNDYgUGFyYW1ldHJpYyBSZWNlaXZlciBQbGF0Zm9ybVxuICovXG5leHBvcnQgY29uc3QgQ0FNRVJBX1BBVEg6IENhbWVyYUtleWZyYW1lW10gPSBbXG4gIC8vIENILjAxIOKAlCBoZXJvIHBsYW5ldGFyeSB0b3JxdWUgd3JlbmNoLCAzLzQgcGVyc3BlY3RpdmUgKFN0YXRpb24gMTogWzAsIDAsIDBdKVxuICB7IHBvc2l0aW9uOiBbMC4zMiwgMC4xNiwgMC40Ml0sIHRhcmdldDogWzAsIDAsIDBdLCBmb3Y6IDQyIH0sXG4gIC8vIENILjAyIOKAlCB4LXJheSAmIGF4aWFsIGV4cGxvZGVkIHJlZHVjdGlvbiBzdGFnZXMsIGxhdGVyYWwgaW5zcGVjdGlvbiAoU3RhdGlvbiAxOiBbMCwgMCwgMF0pXG4gIHsgcG9zaXRpb246IFswLjYwLCAwLjA4LCAwLjA1XSwgdGFyZ2V0OiBbMCwgMC4wMTUsIC0wLjA3XSwgZm92OiAzNiB9LFxuICAvLyBDSC4wMyDigJQgYWNvdXN0aWMgZW5jbG9zdXJlIC8gdGhlcm1hbCBhaXJmbG93LCBtYWNybyBpc29tZXRyaWMgKFN0YXRpb24gMjogWzI4LCAwLCAtNl0pXG4gIC8vIEpHLTAyMSByZW1lZGlhdGlvbjogcHVsbGVkIHRvIFIgPSA4LjUgbSBhYm91dCB0aGUgYXJjIGNlbnRlciBzbyB0aGUgMS42IHggMy40IG1cbiAgLy8gc3ViamVjdCBjbGVhcnMgdGhlIGxlZnQgQ0guMDMgY2FyZCBsYW5lIHdpdGggbWFyZ2luICh3YXMgUiDiiYggNi45MDUgbSDigJQgc3ViamVjdFxuICAvLyBmaWxsZWQgfjk3JSBvZiBzY3JlZW4gd2lkdGggYW5kIHNhdCB1bmRlciB0aGUgY2FyZCkuXG4gIHsgcG9zaXRpb246IFszMy42NjIzNTcsIDIuOCwgLTAuMDEwNjIyXSwgdGFyZ2V0OiBbMjguMCwgMS4yLCAtNi4zNV0sIGZvdjogMzYgfSxcbiAgLy8gQ0guMDQg4oCUIGRpZ2l0YWwgc3lzdGVtczogTTI0OSBwbGF0Zm9ybSBvdmVydmlldyAmIGNvbnRpbnVvdXMgem9vbS1vdXQgKFN0YXRpb24gMzogWzU2LCAwLCAtMTJdKVxuICAvLyBKRy0wMjEgcmVtZWRpYXRpb246IG5lYXIgcG9zZSBhdCB+Mi41IG0gKHRoZSBDSC4wNCBvdmVycmlkZSBzdGFydHMgaGVyZSDigJRcbiAgLy8gemVybyBnb2FsIGp1bXAgYXQgMC43NjAg4oCUIGFuZCBkb2xsaWVzIHRvIH4zLjUgbSBvdmVyIGEgMC4xOCB3aW5kb3c7IHRoZSBvbGRcbiAgLy8gMC44MiBtIC8gMS42MyBtIG1hY3JvIHBvc2VzIHB1dCB0aGUgMS4xOCBtIHJlY2VpdmVyIGF0IDEzMSUgc2NyZWVuIHdpZHRoLFxuICAvLyB1bmRlciB0aGUgQ0guMDQgY2FyZCkuXG4gIHsgcG9zaXRpb246IFs1Ni40MywgMC42NSwgLTkuNjJdLCB0YXJnZXQ6IFs1NiwgMCwgLTEyXSwgZm92OiAzNSB9LFxuXVxuXG5leHBvcnQgaW50ZXJmYWNlIENhbWVyYVNlZ21lbnQge1xuICBmcm9tSW5kZXg6IG51bWJlclxuICB0b0luZGV4OiBudW1iZXJcbiAgc3RhcnRQcm9ncmVzczogbnVtYmVyXG4gIGVuZFByb2dyZXNzOiBudW1iZXJcbn1cblxuLyoqXG4gKiBDb250ZW50LWFsaWduZWQgY2FtZXJhIHBhdGggc2VnbWVudHMgKEpHLTAyMSBXUzEuMSkuXG4gKiBSZXBsYWNlcyB1bmlmb3JtIHByb2dyZXNzIHRoaXJkcyB3aXRoIGNvbnRlbnQtYWxpZ25lZCB3aW5kb3dzOlxuICogICAtIEswIOKGkiBLMSBbMC4wMDAsIDAuNTI1XTogQWxsIEpHdW4gd3JlbmNoIGJlYXRzIChDSC4wMSBzaGlmdCwgQ0guMDIgZXhwbG9kZSAmIExDRCByZXZlYWwpLlxuICogICAtIEsxIOKGkiBLMiBbMC41MjUsIDAuNjAwXTogV2hpcC1wYW4gZmxpZ2h0IHRvIFN0YXRpb24gMi5cbiAqICAgLSBIb2xkIEsyIFswLjYwMCwgMC43MjBdOiBTdGF0aW9uIDIgUkwtMzAwIFNBRkUgRW5jbG9zdXJlIGhvbGQgd2luZG93LlxuICogICAtIEsyIOKGkiBLMyBbMC43MjAsIDAuNzYwXTogVHJhbnNpdGlvbiBmbGlnaHQgdG8gU3RhdGlvbiAzLlxuICogICAtIDAuNzYwIOKGkiAxLjAwMDogU3RhdGlvbiAzIE0yNDkgY29udGludW91cyB6b29tLW91dCBvdmVycmlkZS5cbiAqL1xuZXhwb3J0IGNvbnN0IFBBVEhfU0VHTUVOVFM6IHJlYWRvbmx5IENhbWVyYVNlZ21lbnRbXSA9IFtcbiAgeyBmcm9tSW5kZXg6IDAsIHRvSW5kZXg6IDEsIHN0YXJ0UHJvZ3Jlc3M6IDAuMDAwLCBlbmRQcm9ncmVzczogMC41MjUgfSxcbiAgeyBmcm9tSW5kZXg6IDEsIHRvSW5kZXg6IDIsIHN0YXJ0UHJvZ3Jlc3M6IDAuNTI1LCBlbmRQcm9ncmVzczogMC42MDAgfSxcbiAgeyBmcm9tSW5kZXg6IDIsIHRvSW5kZXg6IDIsIHN0YXJ0UHJvZ3Jlc3M6IDAuNjAwLCBlbmRQcm9ncmVzczogMC43MjAgfSxcbiAgeyBmcm9tSW5kZXg6IDIsIHRvSW5kZXg6IDMsIHN0YXJ0UHJvZ3Jlc3M6IDAuNzIwLCBlbmRQcm9ncmVzczogMC43NjAgfSxcbl0gYXMgY29uc3RcblxuZXhwb3J0IGludGVyZmFjZSBDYW1lcmFQb3NlIHtcbiAgcG9zaXRpb246IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVxuICB0YXJnZXQ6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVxuICBmb3Y6IG51bWJlclxufVxuXG4vKiogU3RhdGlvbiAyIE9yYml0IEFyYyBjb25zdGFudHMgKEpHLTAyMSBXUzMuMyAmIEFyYyBIYW5kb2ZmIEZpeDsgcmVtZWRpYXRpb24gUi1idW1wKS4gKi9cbmNvbnN0IFMyX0FSQ19DRU5URVI6IHJlYWRvbmx5IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSA9IFsyOC4wLCAxLjIsIC02LjM1XVxuY29uc3QgUzJfQVJDX1JBRElVUyA9IDguNSAvLyBoeXBvdCgzMy42NjIzNTcgLSAyOC4wLCAtMC4wMTA2MjIgLSAoLTYuMzUpKSDigJQgd2lkZW5lZCBmcm9tIDYuOTA1IChKRy0wMjEgcmVtZWRpYXRpb24pIGZvciBjYXJkLWxhbmUgY2xlYXJhbmNlXG5jb25zdCBTMl9BUkNfU1RBUlRfQVpJTVVUSCA9IDAuODQxNzQ4Njk5MTEwMDkwNTQgLy8gZXhhY3QgYXRhbjIoNS4xNSwgNC42KSDigJQgYXppbXV0aCBvZiBLMiBhYm91dCBTMl9BUkNfQ0VOVEVSOyB0aGUgcmVtZWRpYXRpb24gSzIgc2l0cyBvbiB0aGlzIGF6aW11dGggYnkgY29uc3RydWN0aW9uIChubyBnb2FsIHNlYW0gYXQgdGhlIDAuNjAwIGJvdW5kYXJ5KVxuY29uc3QgUzJfQVJDX1NXRUVQID0gMC43MCAvLyB+NDAuMSBkZWcgc3dlZXBcblxuLyoqIEFyYyBlbmQgcG9zZSBhdCBwPTAuNzIwIChkZXJpdmVkIGZvciBleGFjdCBDMCBoYW5kb2ZmIGludG8gU2VnbWVudCAzKS4gKi9cbmV4cG9ydCBjb25zdCBTMl9BUkNfRU5EX1BPU0U6IENhbWVyYVBvc2UgPSB7XG4gIHBvc2l0aW9uOiBbXG4gICAgUzJfQVJDX0NFTlRFUlswXSArIFMyX0FSQ19SQURJVVMgKiBNYXRoLmNvcyhTMl9BUkNfU1RBUlRfQVpJTVVUSCArIFMyX0FSQ19TV0VFUCksXG4gICAgMi40LFxuICAgIFMyX0FSQ19DRU5URVJbMl0gKyBTMl9BUkNfUkFESVVTICogTWF0aC5zaW4oUzJfQVJDX1NUQVJUX0FaSU1VVEggKyBTMl9BUkNfU1dFRVApLFxuICBdLFxuICB0YXJnZXQ6IFsyOC4wLCAxLjIsIC02LjM1XSxcbiAgZm92OiAzNS4wLFxufVxuXG5jb25zdCBzbW9vdGhzdGVwID0gKHQ6IG51bWJlcik6IG51bWJlciA9PiB0ICogdCAqICgzIC0gMiAqIHQpXG5jb25zdCBsZXJwTiA9IChhOiBudW1iZXIsIGI6IG51bWJlciwgdDogbnVtYmVyKTogbnVtYmVyID0+IGEgKyAoYiAtIGEpICogdFxuXG4vKipcbiAqIFJldHVybnMgdGhlIGJhc2UgY2FtZXJhIHBvc2UgKHBvc2l0aW9uLCB0YXJnZXQsIEZPVikgYXQgYW55IGdsb2JhbCBzY3JvbGwgcHJvZ3Jlc3MuXG4gKiBJbnRlcnBvbGF0ZXMgc21vb3RobHkgYWxvbmcgUEFUSF9TRUdNRU5UUyBhbmQgU3RhdGlvbiAyIG9yYml0IGFyYy4gQ29udGludW91cyBieSBjb25zdHJ1Y3Rpb24gYWNyb3NzIGJvdW5kYXJpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlQXQocHJvZ3Jlc3M6IG51bWJlcik6IENhbWVyYVBvc2Uge1xuICBjb25zdCBwID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcHJvZ3Jlc3MpKVxuXG4gIGlmIChwIDw9IDAuNTI1KSB7XG4gICAgLy8gU2VnbWVudCAwIFswLjAwMCwgMC41MjVdOiBLMCAtPiBLMSAoQWxsIEpHdW4gd3JlbmNoIGJlYXRzKVxuICAgIGNvbnN0IHUgPSBwIC8gMC41MjVcbiAgICBjb25zdCB0ID0gc21vb3Roc3RlcCh1KVxuICAgIGNvbnN0IGZyb20gPSBDQU1FUkFfUEFUSFswXVxuICAgIGNvbnN0IHRvID0gQ0FNRVJBX1BBVEhbMV1cbiAgICByZXR1cm4ge1xuICAgICAgcG9zaXRpb246IFtcbiAgICAgICAgbGVycE4oZnJvbS5wb3NpdGlvblswXSwgdG8ucG9zaXRpb25bMF0sIHQpLFxuICAgICAgICBsZXJwTihmcm9tLnBvc2l0aW9uWzFdLCB0by5wb3NpdGlvblsxXSwgdCksXG4gICAgICAgIGxlcnBOKGZyb20ucG9zaXRpb25bMl0sIHRvLnBvc2l0aW9uWzJdLCB0KSxcbiAgICAgIF0sXG4gICAgICB0YXJnZXQ6IFtcbiAgICAgICAgbGVycE4oZnJvbS50YXJnZXRbMF0sIHRvLnRhcmdldFswXSwgdCksXG4gICAgICAgIGxlcnBOKGZyb20udGFyZ2V0WzFdLCB0by50YXJnZXRbMV0sIHQpLFxuICAgICAgICBsZXJwTihmcm9tLnRhcmdldFsyXSwgdG8udGFyZ2V0WzJdLCB0KSxcbiAgICAgIF0sXG4gICAgICBmb3Y6IGxlcnBOKGZyb20uZm92LCB0by5mb3YsIHQpLFxuICAgIH1cbiAgfVxuXG4gIGlmIChwIDw9IDAuNjAwKSB7XG4gICAgLy8gU2VnbWVudCAxIFswLjUyNSwgMC42MDBdOiBLMSAtPiBLMiAoRmxpZ2h0IGludG8gU3RhdGlvbiAyKS5cbiAgICAvLyBKRy0wMjEgcmVtZWRpYXRpb246IHRoZSBUQVJHRVQgbGVhZHMgdGhlIHBvc2l0aW9uICh0cmlwbGUgc21vb3Roc3RlcClcbiAgICAvLyBzbyB0aGUgY2FtZXJhIHR1cm5zIHRvd2FyZCB0aGUgZW5jbG9zdXJlIGVhcmx5IGluIHRoZSBhcHByb2FjaCDigJRcbiAgICAvLyBwcmV2aW91c2x5IHRoZSB0YXJnZXQgbGFnZ2VkIGFuZCB0aGUgc3ViamVjdCBzYXQgb2ZmLXNjcmVlbiByaWdodFxuICAgIC8vIHRocm91Z2ggdGhlIGFycml2YWwgdHJhbnNpdCAob3duZXIgdmlzdWFsIHBhc3MgZmluZGluZykuXG4gICAgY29uc3QgdSA9IChwIC0gMC41MjUpIC8gKDAuNjAwIC0gMC41MjUpXG4gICAgY29uc3QgdCA9IHNtb290aHN0ZXAodSlcbiAgICBjb25zdCB0VGFyZ2V0ID0gc21vb3Roc3RlcChzbW9vdGhzdGVwKHQpKVxuICAgIGNvbnN0IGZyb20gPSBDQU1FUkFfUEFUSFsxXVxuICAgIGNvbnN0IHRvID0gQ0FNRVJBX1BBVEhbMl1cbiAgICByZXR1cm4ge1xuICAgICAgcG9zaXRpb246IFtcbiAgICAgICAgbGVycE4oZnJvbS5wb3NpdGlvblswXSwgdG8ucG9zaXRpb25bMF0sIHQpLFxuICAgICAgICBsZXJwTihmcm9tLnBvc2l0aW9uWzFdLCB0by5wb3NpdGlvblsxXSwgdCksXG4gICAgICAgIGxlcnBOKGZyb20ucG9zaXRpb25bMl0sIHRvLnBvc2l0aW9uWzJdLCB0KSxcbiAgICAgIF0sXG4gICAgICB0YXJnZXQ6IFtcbiAgICAgICAgbGVycE4oZnJvbS50YXJnZXRbMF0sIHRvLnRhcmdldFswXSwgdFRhcmdldCksXG4gICAgICAgIGxlcnBOKGZyb20udGFyZ2V0WzFdLCB0by50YXJnZXRbMV0sIHRUYXJnZXQpLFxuICAgICAgICBsZXJwTihmcm9tLnRhcmdldFsyXSwgdG8udGFyZ2V0WzJdLCB0VGFyZ2V0KSxcbiAgICAgIF0sXG4gICAgICBmb3Y6IGxlcnBOKGZyb20uZm92LCB0by5mb3YsIHQpLFxuICAgIH1cbiAgfVxuXG4gIGlmIChwIDw9IDAuNzIwKSB7XG4gICAgLy8gU2VnbWVudCAyIFswLjYwMCwgMC43MjBdOiBTdGF0aW9uIDIgT3JiaXQgQXJjIGFyb3VuZCBbMjguMCwgMS4yLCAtNi4zNV1cbiAgICBjb25zdCB1ID0gKHAgLSAwLjYwMCkgLyAoMC43MjAgLSAwLjYwMClcbiAgICBjb25zdCB0ID0gc21vb3Roc3RlcCh1KVxuICAgIGNvbnN0IGF6aW11dGggPSBTMl9BUkNfU1RBUlRfQVpJTVVUSCArIFMyX0FSQ19TV0VFUCAqIHRcbiAgICByZXR1cm4ge1xuICAgICAgcG9zaXRpb246IFtcbiAgICAgICAgUzJfQVJDX0NFTlRFUlswXSArIFMyX0FSQ19SQURJVVMgKiBNYXRoLmNvcyhhemltdXRoKSxcbiAgICAgICAgbGVycE4oMi44LCAyLjQsIHQpLFxuICAgICAgICBTMl9BUkNfQ0VOVEVSWzJdICsgUzJfQVJDX1JBRElVUyAqIE1hdGguc2luKGF6aW11dGgpLFxuICAgICAgXSxcbiAgICAgIHRhcmdldDogWy4uLlMyX0FSQ19DRU5URVJdLFxuICAgICAgZm92OiBsZXJwTigzNi4wLCAzNS4wLCB0KSxcbiAgICB9XG4gIH1cblxuICBpZiAocCA8PSAwLjc2MCkge1xuICAgIC8vIFNlZ21lbnQgMyBbMC43MjAsIDAuNzYwXTogSGFuZG9mZiBmbGlnaHQgZnJvbSBTMl9BUkNfRU5EX1BPU0UgLT4gSzMuXG4gICAgLy8gVGFyZ2V0IGxlYWRzIHBvc2l0aW9uIChzYW1lIHJlbWVkaWF0aW9uIGFzIHNlZ21lbnQgMSkgc28gdGhlIHJlY2VpdmVyXG4gICAgLy8gaXMgb24tc2NyZWVuIHRocm91Z2ggdGhlIGFwcHJvYWNoIHJhdGhlciB0aGFuIHNuYXBwaW5nIGluIGF0IDAuNzYwLlxuICAgIGNvbnN0IHUgPSAocCAtIDAuNzIwKSAvICgwLjc2MCAtIDAuNzIwKVxuICAgIGNvbnN0IHQgPSBzbW9vdGhzdGVwKHUpXG4gICAgY29uc3QgdFRhcmdldCA9IHNtb290aHN0ZXAoc21vb3Roc3RlcCh0KSlcbiAgICBjb25zdCB0byA9IENBTUVSQV9QQVRIWzNdXG4gICAgcmV0dXJuIHtcbiAgICAgIHBvc2l0aW9uOiBbXG4gICAgICAgIGxlcnBOKFMyX0FSQ19FTkRfUE9TRS5wb3NpdGlvblswXSwgdG8ucG9zaXRpb25bMF0sIHQpLFxuICAgICAgICBsZXJwTihTMl9BUkNfRU5EX1BPU0UucG9zaXRpb25bMV0sIHRvLnBvc2l0aW9uWzFdLCB0KSxcbiAgICAgICAgbGVycE4oUzJfQVJDX0VORF9QT1NFLnBvc2l0aW9uWzJdLCB0by5wb3NpdGlvblsyXSwgdCksXG4gICAgICBdLFxuICAgICAgdGFyZ2V0OiBbXG4gICAgICAgIGxlcnBOKFMyX0FSQ19FTkRfUE9TRS50YXJnZXRbMF0sIHRvLnRhcmdldFswXSwgdFRhcmdldCksXG4gICAgICAgIGxlcnBOKFMyX0FSQ19FTkRfUE9TRS50YXJnZXRbMV0sIHRvLnRhcmdldFsxXSwgdFRhcmdldCksXG4gICAgICAgIGxlcnBOKFMyX0FSQ19FTkRfUE9TRS50YXJnZXRbMl0sIHRvLnRhcmdldFsyXSwgdFRhcmdldCksXG4gICAgICBdLFxuICAgICAgZm92OiBsZXJwTihTMl9BUkNfRU5EX1BPU0UuZm92LCB0by5mb3YsIHQpLFxuICAgIH1cbiAgfVxuXG4gIC8vIFNlZ21lbnQgNCBbMC43NjAsIDEuMDAwXTogU3RhdGlvbiAzIE0yNDkgYmFzZSBwb3NlXG4gIGNvbnN0IGszID0gQ0FNRVJBX1BBVEhbM11cbiAgcmV0dXJuIHsgcG9zaXRpb246IFsuLi5rMy5wb3NpdGlvbl0sIHRhcmdldDogWy4uLmszLnRhcmdldF0sIGZvdjogazMuZm92IH1cbn1cblxuLyoqXG4gKiBGcmFtaW5nIGJpYXMgKEpHLTAyMSByZW1lZGlhdGlvbikg4oCUIHRhcmdldCBvZmZzZXRzIGluIE5EQyB1bml0cyB0aGF0IHB1c2ggdGhlXG4gKiBTVUJKRUNUIGNsZWFyIG9mIHRoZSBsZWZ0IG5hcnJhdGl2ZSB0ZXh0IGxhbmUuXG4gKlxuICogRGVza3RvcC9sYW5kc2NhcGU6IGhvcml6b250YWwgb25seS4gYjAxID0gMC4xNCBkdXJpbmcgQ0guMDEvMDIgKHRyYW5zcGFyZW50XG4gKiBjYXB0aW9uLCBvd25lci1wYXNzZWQg4oCUIHVuY2hhbmdlZCk7IGIyMyA9IDAuMzYgZHVyaW5nIHRoZSBDSC4wMyBjYXJkIHdpbmRvdyBhbmRcbiAqIENILjA0IChyYWlzZWQgZnJvbSAwLjIyOiB3aXRoIHRoZSBjb3JyZWN0ZWQgc2hpZnQgZGlyZWN0aW9uIHRoZSBTdC4yIHN1YmplY3Qnc1xuICogdW5iaWFzZWQgTkRDIGNlbnRlciBzaXRzIGF0IOKJiCDiiJIwLjE1IHdpdGggaGFsZi13aWR0aCDiiYggMC40Miwgc28gY2xlYXJpbmcgdGhlXG4gKiBjYXJkIGVkZ2UgYXQgTkRDIOKIkjAuMTYgcmVxdWlyZXMg4omIIDAuMzYpLlxuICpcbiAqIFBvcnRyYWl0L21vYmlsZTogdGhlIGdsYXNzIGNhcmRzIHNwYW4gfjkwJSBvZiB0aGUgMzkwcHggd2lkdGgsIHNvIG5vIGhvcml6b250YWxcbiAqIGxhbmUgZXhpc3RzOyBgeWAgY29tcG9zZXMgdGhlIHN1YmplY3QgaW50byB0aGUgZnJlZSBiYW5kIEFCT1ZFIHRoZSB2ZXJ0aWNhbGx5XG4gKiBjZW50ZXJlZCBjYXJkIChjYXJkIHRvcCDiiYggTkRDIHkgKzAuNjgpLiBGdWxsIGNsZWFyaW5nIGlzIGdlb21ldHJpY2FsbHlcbiAqIGltcG9zc2libGUgZm9yIHRoZSAyLjYgbSB0YWxsIGVuY2xvc3VyZSDigJQgYHlgIHBsYWNlcyBpdHMgdXBwZXIgcG9ydGlvbiBpbiB0aGVcbiAqIGJhbmQ7IHRoZSBzbWFsbCBNMjQ5IHJlY2VpdmVyIGNsZWFycyBjb21wbGV0ZWx5LiBSYW1wcyBtaXJyb3IgdGhlIGNhcmQgZmFkZXMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRnJhbWluZ0JpYXNWZWMge1xuICB4OiBudW1iZXJcbiAgeTogbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcmFtaW5nQmlhc1ZlYyhwcm9ncmVzczogbnVtYmVyKTogRnJhbWluZ0JpYXNWZWMge1xuICBjb25zdCByYW1wID0gMC4wMzVcbiAgY29uc3QgdzAgPSBNYXRoLm1pbihNYXRoLm1heCgoMC4yMiAtIHByb2dyZXNzKSAvIHJhbXAsIDApLCAxKVxuICBjb25zdCB3MSA9IE1hdGgubWluKE1hdGgubWF4KChwcm9ncmVzcyAtIDAuMjQpIC8gcmFtcCwgMCksIE1hdGgubWF4KCgwLjQ2IC0gcHJvZ3Jlc3MpIC8gcmFtcCwgMCksIDEpXG4gIGNvbnN0IHcyID0gTWF0aC5taW4oTWF0aC5tYXgoKHByb2dyZXNzIC0gMC41MCkgLyByYW1wLCAwKSwgTWF0aC5tYXgoKDAuNzIgLSBwcm9ncmVzcykgLyByYW1wLCAwKSwgMSlcbiAgLy8gQ0guMDQgcmFtcHMgaW4gb3ZlciAwLjAyICh0aWdodGVyIHRoYW4gdGhlIGNhcmQgZmFkZSkgc28gdGhlIHJlY2VpdmVyIGlzXG4gIC8vIGZ1bGx5IGJpYXNlZCBieSBwID0gMC43OCwgd2hlcmUgdGhlIGNhcmQgaXMgYWxyZWFkeSB+NTclIHZpc2libGUuXG4gIGNvbnN0IHczID0gTWF0aC5taW4oTWF0aC5tYXgoKHByb2dyZXNzIC0gMC43NikgLyAwLjAyLCAwKSwgMSlcblxuICBjb25zdCBiMDEgPSBzbW9vdGhzdGVwKE1hdGgubWF4KHcwLCB3MSkpICogMC4xNFxuICBjb25zdCBiMjMgPSBzbW9vdGhzdGVwKE1hdGgubWF4KHcyLCB3MykpICogMC4zOFxuICAvLyBQb3J0cmFpdCB2ZXJ0aWNhbDogdzIgd2luZG93IChTdGF0aW9uIDIgaG9sZCkgbGlmdHMgdGhlIHRhbGwgZW5jbG9zdXJlIGludG9cbiAgLy8gdGhlIHRvcCBiYW5kICh+NTElIG9mIGl0cyBoZWlnaHQgY2xlYXJzIHRoZSBjYXJkIHRvcCBhdCBOREMgKzAuNjUpOyB3M1xuICAvLyB3aW5kb3cgKENILjA0KSBwYXJrcyB0aGUgc21hbGwgcmVjZWl2ZXIgZnVsbHkgaW5zaWRlIHRoZSBiYW5kLlxuICBjb25zdCB5MiA9IHNtb290aHN0ZXAodzIpICogMC43NVxuICBjb25zdCB5MyA9IHNtb290aHN0ZXAodzMpICogMC44NFxuICByZXR1cm4geyB4OiBNYXRoLm1heChiMDEsIGIyMyksIHk6IE1hdGgubWF4KHkyLCB5MykgfVxufVxuXG4vKiogSG9yaXpvbnRhbCBmcmFtaW5nIGJpYXMgbWFnbml0dWRlICh0ZWxlbWV0cnkvcHJvYmUgc3VyZmFjZSDigJQgdGhlIHggY29tcG9uZW50KS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcmFtaW5nQmlhcyhwcm9ncmVzczogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIGZyYW1pbmdCaWFzVmVjKHByb2dyZXNzKS54XG59XG5cbi8qKlxuICogU2hpZnQgc3ViLXNlcXVlbmNlIGNhbWVyYSBrZXlmcmFtZXMg4oCUIEdTQVAgc3ViLXRpbWVsaW5lIHNjcnViYmVkIGFnYWluc3RcbiAqIHRoZSBzaGlmdCBwcm94eSAoMOKGkjEgYWNyb3NzIHRpbWVsaW5lIDDihpIwLjE1KS4gWm9vbXMgdGlnaHQgb24gdGhlIFAwMDA0MjBcbiAqIGdyb292ZSBhcmVhIHNvIHRoZSBPU0hBIEJsdWUgc3RyaXBlIGlzIHZpc2libGUgYmVmb3JlIHRoZSByaW5nIHN3aXRjaCBtb3ZlcyxcbiAqIHRoZW4gaG9sZHMgd2hpbGUgdGhlIHJpbmcgc3dpdGNoIGxpZnRzIHRvIHJldmVhbCB0aGUgT1NIQSBSZWQgc3RyaXBlLCB0aGVuXG4gKiByZXR1cm5zIHRvIHRoZSBDSC4wMSBrZXlmcmFtZS4gVmFsdWVzIGluIG1ldGVycywgaGVybyBncm91cCBzcGFjZS5cbiAqL1xuZXhwb3J0IGNvbnN0IFNISUZUX0NBTUVSQV9LRVlGUkFNRVMgPSB7XG4gIC8qKiBCZWZvcmUgc2hpZnQ6IENILjAxIHdpZGUgdmlldy4gKi9cbiAgaWRsZTogICAgeyBwb3NpdGlvbjogWzAuMzIsIDAuMTYsIDAuNDJdIGFzIFtudW1iZXIsbnVtYmVyLG51bWJlcl0sIHRhcmdldDogWzAsIDAsIDBdIGFzIFtudW1iZXIsbnVtYmVyLG51bWJlcl0sIGZvdjogNDIgfSxcbiAgLyoqIFNoaWZ0IHN0YXJ0czogem9vbSB0byBQMDAwNDIwIGdyb292ZSBhcmVhIOKAlCBibHVlIGdyb292ZSB2aXNpYmxlLiAqL1xuICB6b29tSW46ICB7IHBvc2l0aW9uOiBbMC4xNCwgMC4wNCwgMC4xOV0gYXMgW251bWJlcixudW1iZXIsbnVtYmVyXSwgdGFyZ2V0OiBbMCwgMCwgMC4wNl0gYXMgW251bWJlcixudW1iZXIsbnVtYmVyXSwgZm92OiAyMiB9LFxuICAvKiogTWlkIHNoaWZ0OiBob2xkIHRpZ2h0IOKAlCByaW5nIHN3aXRjaCByaXNpbmcsIHJlZCBncm9vdmUgcmV2ZWFsZWQuICovXG4gIGhvbGQ6ICAgIHsgcG9zaXRpb246IFswLjEyLCAwLjAzLCAwLjE3XSBhcyBbbnVtYmVyLG51bWJlcixudW1iZXJdLCB0YXJnZXQ6IFswLCAwLCAwLjA2XSBhcyBbbnVtYmVyLG51bWJlcixudW1iZXJdLCBmb3Y6IDIwIH0sXG4gIC8qKiBTaGlmdCBjb21wbGV0ZTogcHVsbCBiYWNrIHRvIENILjAxIGZyYW1pbmcuICovXG4gIHB1bGxCYWNrOiB7IHBvc2l0aW9uOiBbMC4zMiwgMC4xNiwgMC40Ml0gYXMgW251bWJlcixudW1iZXIsbnVtYmVyXSwgdGFyZ2V0OiBbMCwgMCwgMF0gYXMgW251bWJlcixudW1iZXIsbnVtYmVyXSwgZm92OiA0MiB9LFxufSBhcyBjb25zdFxuXG4vKipcbiAqIFJlYXIgTENEIG9yYml0IOKAlCBKRy0wMTQgLyBKRy0wMjEgbWVhc3VyZWQgZ2VvbWV0cnk6XG4gKiAgIC0gVGhlIGhlcm8gdGltZWxpbmUgc2NydWJzIFtkYXRhLWNoYXB0ZXI9XCIxXCJdIGFjcm9zcyBnbG9iYWwgcHJvZ3Jlc3NcbiAqICAgICDiiYgwLjE3NyDihpIgMC40NTggYWdhaW5zdCB0aGUgY3VycmVudCAyMDIwdmggZG9jdW1lbnQgKDPDlzQ0MHZoIHNlY3Rpb25zICtcbiAqICAgICA2NjB2aCBDSC4wNCArIDQwdmggZm9vdGVyLCB2aWV3cG9ydC1ub3JtYWxpemVkKSwgc28gdGhlIGV4cGxvZGUgdHdlZW5cbiAqICAgICAodGltZWxpbmUgMC4zNeKGkjAuODUpIGNvbXBsZXRlcyBhdCDiiYgwLjQxNi5cbiAqICAgLSBMaXZlIHByb2JlIGF0IHByb2dyZXNzIDAuNDc6IGV4cGxvZGVGYWN0b3IgMSwgaGVybyB5YXcgZXhhY3RseSAwLjg1z4AsIGhhbmRsZVog4oiSMC4zNTQuXG4gKiAgIC0gVGhlIGV4cGxvZGVkIExDRCBjbHVzdGVyIHNpdHMgYXQgd29ybGQgW+KIkjAuMTQsIDAuMDAsIDAuNDZdLlxuICogICAtIER3ZWxsIGNhbWVyYSBmcmFtZXMgdGhlIG1hbm9tZXRlciBzY3JlZW4gKFAwMDIxMTUpIGFuZCBidXR0b25zIChQMDAyMTIz4oCTUDAwMjEyNSkuXG4gKiAgIC0gSU5WQVJJQU5UIChKRy0wMjEgV1MxLjIpOiBzdGFydCBhbmQgcmV0dXJuIHBvc2VzIGFyZSBldmFsdWF0ZWQgYXQgcnVudGltZSB2aWFcbiAqICAgICBiYXNlQXQoTENEX1JFVkVBTF9XSU5ET1cuc3RhcnQpIGFuZCBiYXNlQXQoTENEX1JFVkVBTF9XSU5ET1cuZW5kKSwgZW5zdXJpbmdcbiAqICAgICBndWFyYW50ZWVkIENeMCBjb250aW51aXR5IHdpdGggdGhlIGJhc2UgdHJhamVjdG9yeSB3aXRob3V0IG1hbnVhbCBrZXlmcmFtZSBzeW5jaW5nLlxuICovXG5leHBvcnQgY29uc3QgTENEX1JFVkVBTF9XSU5ET1cgPSB7XG4gIC8qKiBBZnRlciB0aGUgZXhwbG9kZSBiZWF0IGNvbXBsZXRlcyAobWVhc3VyZWQg4omIMC40MTYpLiAqL1xuICBzdGFydDogMC40MjAsXG4gIC8qKiBTdGFibGUgcmVhciBMQ0QvYnV0dG9ucyBkd2VsbCBiZWZvcmUgdGhlIHdyZW5jaCBzdGFnZSBoYW5kb2ZmLiAqL1xuICBkd2VsbFN0YXJ0OiAwLjQ1OCxcbiAgZHdlbGxFbmQ6IDAuNDg4LFxuICAvKiogQmVmb3JlIHRoZSB3cmVuY2ggc2luayB3aW5kb3cgKFNUQUdFX1RSQU5TSVRJT05TLndyZW5jaE91dCAwLjUyNeKAkzAuNTY1KS4gKi9cbiAgZW5kOiAwLjUyNSxcbn0gYXMgY29uc3RcblxuZXhwb3J0IGNvbnN0IExDRF9PUkJJVF9LRVlGUkFNRVMgPSB7XG4gIC8qKiBTd2luZyBhcm91bmQgdGhlIGV4dHJhY3RlZCB0cmFpbidzIG1pZC1zcGFuIHRvd2FyZCB0aGUgaGFuZGxlIHJlYXIgY2FwLiAqL1xuICBhcmM6ICAgIHsgcG9zaXRpb246IFswLjI4LCAwLjEwLCAwLjUwXSBhcyBbbnVtYmVyLG51bWJlcixudW1iZXJdLCB0YXJnZXQ6IFstMC4wNSwgMC4wMSwgMC4xOF0gYXMgW251bWJlcixudW1iZXIsbnVtYmVyXSwgZm92OiAzNCB9LFxuICAvKiogRHdlbGw6IDAuMzIgbSBiZWhpbmQgdGhlIGV4cGxvZGVkIHJlYXIgY2FwLCBsb29raW5nIHN0cmFpZ2h0IGF0IHRoZSBMQ0QgY2x1c3RlciAod29ybGQgW+KIkjAuMTQsIDAsIDAuNDZdKS4gKi9cbiAgZHdlbGw6ICB7IHBvc2l0aW9uOiBbLTAuMjgsIDAuMDgsIDAuNzRdIGFzIFtudW1iZXIsbnVtYmVyLG51bWJlcl0sIHRhcmdldDogWy0wLjE0LCAwLjAwLCAwLjQ2XSBhcyBbbnVtYmVyLG51bWJlcixudW1iZXJdLCBmb3Y6IDMxIH0sXG59IGFzIGNvbnN0XG5cbi8qKlxuICogSG90c3BvdHMgYW5jaG9yZWQgdmlhIHJvbGUtbWFwLmpzb24gYG9jY3VycmVuY2VgIG5hbWVzLiBBbGwgb2YgdGhlc2UgYXJlXG4gKiByZWFsIG5vZGUgaWRlbnRpdGllcyBjb25maXJtZWQgaW4gdGhlIEdMQiBhdWRpdCDigJQgbmV2ZXIgZ3Vlc3NlZCBsYWJlbHMuXG4gKlxuICogRmVhdHVyZS1jb250cm9sLWZyYW1lIGNlbGxzIHVzZSBPTkxZIG93bmVyLWFwcHJvdmVkIHZvY2FidWxhcnk6IHRoZSBIVURcbiAqIGNhbGxvdXQgc3RyaW5ncyAoJ1JVTk9VVCA8IC4wMDFcIiBUSVInLCAnUE9TSVRJT04gLjAwMlwiIEAgTU1DJyxcbiAqICdGTEFUTkVTUyA8IC4wMDA4XCInKSBhbmQgZHJhd2luZy12ZXJpZmllZCBkYXR1bSByZWZlcmVuY2VzIChQMDAwNDIwXG4gKiBjb250cm9scyB0ZXJtaW5hdGUgaW4gZGF0dW0gQSkuIEpHLTAyMSByZW1lZGlhdGlvbjogWTE0LjUgY2hhcmFjdGVyaXN0aWNzXG4gKiByZW5kZXIgYXMgY2Fub25pY2FsIFNWRyBzeW1ib2xzIChHZHRTeW1ib2xzLnRzeCwgc3R5bGVkIHBlciB0aGUgcmVnaXN0ZXJlZFxuICogcmVmZXJlbmNlcyBpbiBjb250ZXh0L3JlZmVyZW5jZXMvbWVkaWEvZ2R0Lykg4oCUIHRoZSBjaGFyYWN0ZXJpc3RpYyBzdHJpbmdcbiAqIGlzIGEgc3ltYm9sIEtFWSAoJ1JVTk9VVCcsICdGTEFUTkVTUycsICdQT1NJVElPTicsICdQUk9GSUxFJyxcbiAqICdQQVJBTExFTElTTScpOyBTdGF0aW9uIDIncyBub24tWTE0LjUgYWNvdXN0aWMgc3BlYyBmcmFtZXMgKCdBVFRFTlVBVElPTicsXG4gKiAnTEFCWVJJTlRIJywg4oCmKSBsZWdpdGltYXRlbHkgc3RheSBhcyB0ZXh0LiBQcm9zZSAoZGV0YWlsL3Byb2Nlc3NOb3RlKVxuICoga2VlcHMgdGhlIHdvcmRzIHdoZXJlIG5hdHVyYWwgbGFuZ3VhZ2UgYmVsb25ncy5cbiAqL1xuXG4vKipcbiAqIEpHLTAzNiBvd25lciBkZWNpc2lvbiAoMjAyNi0xMC0wOCk6IHJldml2ZSBleGFjdGx5IG9uZSBhdXRob3JlZCBpbnNwZWN0aW9uXG4gKiBob3RzcG90IHBlciBhc3NlbWJseSBpbiB0aGUgU3RhdGlvbiAxIGxlZ2FjeSBIb3RzcG90cyBrZWVwZXIgbGF5ZXJcbiAqIChzcmMvc2NlbmUvSG90c3BvdHMudHN4KSwgdGhlIG9ubHkgY29uc3VtZXIgb2YgdGhpcyBzZXQuIFN0YXRpb24gMiBhbmRcbiAqIFN0YXRpb24gMyBrZWVwIHRoZWlyIG93biBwcmUtZXhpc3Rpbmcgc3RhZ2UgcHJvZHVjZXJzXG4gKiAoU3RhdGlvbjJfQWNvdXN0aWNFbmNsb3N1cmUudHN4LCBNMjQ5U3RhZ2UudHN4KTsgdGhvc2UgZXh0cmEgY2FsbG91dCBiYWRnZXNcbiAqIHJlbWFpbiBhY3RpdmUgYW5kIG93bmVyLXBlcm1pdHRlZCAoY29uZmlybWVkIDIwMjYtMTAtMDgpLCBzbyB0aGlzIHNldCBkb2VzXG4gKiBub3QgZ2F0ZSB0aGVtLlxuICovXG5leHBvcnQgY29uc3QgQUNUSVZFX0hPVFNQT1RfSURTID0gbmV3IFNldChbJ3JvdG9yJywgJ2R1Y3QtaW50YWtlJywgJ20yNDktdHJ1bm5pb24nXSlcblxuZXhwb3J0IGNvbnN0IEhPVFNQT1RTOiBIb3RzcG90RGVmW10gPSBbXG4gIHtcbiAgICBpZDogJ3JvdG9yJyxcbiAgICBvY2N1cnJlbmNlOiAnUk9UT1ItMScsXG4gICAga2luZDogJ2luc3BlY3QnLFxuICAgIGxhYmVsOiAnQUlSIE1PVE9SIFJPVE9SJyxcbiAgICBkZXRhaWw6XG4gICAgICAnVmFuZS10eXBlIHBuZXVtYXRpYyByb3RvciDigJQgdGhlIGlucHV0IHNpZGUgb2YgdGhlIHJlZHVjdGlvbiB0cmFpbi4gQmFsYW5jZWQgZm9yIGhpZ2gtUlBNIG9wZXJhdGlvbiBpbnNpZGUgdGhlIG1hY2hpbmVkIG1vdG9yIGhvdXNpbmcuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBwcm9jZXNzTm90ZTogJ0JBTEFOQ0VEIFZBTkUgQVNTRU1CTFknLFxuICAgIH0sXG4gICAgY2hhcHRlcnM6IFswLCAxXSxcbiAgfSxcbiAge1xuICAgIGlkOiAnbW90b3ItaG91c2luZycsXG4gICAgb2NjdXJyZW5jZTogJ0FJUiBNT1RPUiBIT1VTSU5HLU1BQ0hJTkVELTEnLFxuICAgIGtpbmQ6ICdkYXR1bScsXG4gICAgbGFiZWw6ICdEQVRVTSBBIOKAlCBNT1RPUiBCT1JFJyxcbiAgICBkZXRhaWw6ICdNYWNoaW5lZCBhaXItbW90b3IgaG91c2luZy4gUHJpbWFyeSBkYXR1bSBmb3IgdGhlIHJvdGF0aW5nIHN0YWNrOiBSVU5PVVQgPCAuMDAxXCIgVElSLicsXG4gICAgYW5ub3RhdGlvbjoge1xuICAgICAgZGF0dW06ICdBJyxcbiAgICAgIGZyYW1lOiB7XG4gICAgICAgIGNoYXJhY3RlcmlzdGljOiAnUlVOT1VUJyxcbiAgICAgICAgY2VsbHM6IFsnLjAwMVwiIFRJUicsICdBJ10sXG4gICAgICAgIGRhdHVtczogWydBJ10sXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc05vdGU6ICdSVU5PVVQgPCAuMDAxXCIgVElSJyxcbiAgICB9LFxuICAgIGNoYXB0ZXJzOiBbMCwgMV0sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2ZsYW5nZScsXG4gICAgb2NjdXJyZW5jZTogJ0ZMQU5HRS0xJyxcbiAgICAvLyBUd28gcm9sZS1tYXAgcm93cyBzaGFyZSB0aGlzIG9jY3VycmVuY2UgbmFtZTsgcGljayB0aGUgbW90b3ItdG8tZ2VhcmJveFxuICAgIC8vIG1vdW50IGZhY2UgKHog4oiSMC4xMzk2KSwgbm90IHRoZSByZWFyLWNhcCB0d2luICh6IOKIkjAuMTg5NSkuXG4gICAgcGlja05lYXI6IFswLjAwMDEsIDAsIC0wLjEzOTZdLFxuICAgIGtpbmQ6ICdkYXR1bScsXG4gICAgbGFiZWw6ICdEQVRVTSBCIOKAlCBNT1VOVCBGQUNFJyxcbiAgICBkZXRhaWw6ICdNb3Rvci10by1nZWFyYm94IGludGVyZmFjZSBmbGFuZ2UuIEZMQVRORVNTIDwgLjAwMDhcIiBob2xkcyBzdGFnZSBhbGlnbm1lbnQgYWNyb3NzIHRoZSBqb2ludC4nLFxuICAgIGFubm90YXRpb246IHtcbiAgICAgIGRhdHVtOiAnQicsXG4gICAgICBmcmFtZToge1xuICAgICAgICBjaGFyYWN0ZXJpc3RpYzogJ0ZMQVRORVNTJyxcbiAgICAgICAgY2VsbHM6IFsnLjAwMDhcIiddLFxuICAgICAgICBkYXR1bXM6IFtdLFxuICAgICAgfSxcbiAgICAgIHByb2Nlc3NOb3RlOiAnRkxBVE5FU1MgPCAuMDAwOFwiJyxcbiAgICB9LFxuICAgIGNoYXB0ZXJzOiBbMV0sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2dlYXJib3gtaG91c2luZycsXG4gICAgb2NjdXJyZW5jZTogJ1AwMDAyNDUtMScsXG4gICAga2luZDogJ2luc3BlY3QnLFxuICAgIGxhYmVsOiAnR0VBUkJPWCBIT1VTSU5HJyxcbiAgICBkZXRhaWw6XG4gICAgICAnT3V0ZXIgaG91c2luZyBvZiB0aGUgcGxhbmV0YXJ5IGdlYXJib3gg4oCUIHJpbmcgZ2VhcnMgYW5kIDQtcGxhbmV0IGNhcnJpZXJzIHJ1biBpbnNpZGUgdGhpcyBzaGVsbC4nLFxuICAgIGFubm90YXRpb246IHtcbiAgICAgIGZyYW1lOiB7XG4gICAgICAgIGNoYXJhY3RlcmlzdGljOiAnUE9TSVRJT04nLFxuICAgICAgICBjZWxsczogWycuMDAyXCIgQCBNTUMnXSxcbiAgICAgIH0sXG4gICAgICBwcm9jZXNzTm90ZTogJ1BPU0lUSU9OIC4wMDJcIiBAIE1NQycsXG4gICAgfSxcbiAgICBjaGFwdGVyczogWzFdLFxuICB9LFxuICB7XG4gICAgaWQ6ICdtY3UnLFxuICAgIG9jY3VycmVuY2U6ICdNU1A0MzBGNjcyNklQTi0xJyxcbiAgICBraW5kOiAnaW5zcGVjdCcsXG4gICAgbGFiZWw6ICdNU1A0MzAgTUNVJyxcbiAgICBkZXRhaWw6XG4gICAgICAnVEkgTVNQNDMwRjY3MjYgbWljcm9jb250cm9sbGVyIOKAlCB0aGUgc21hcnQtdG9vbCBicmFpbiBzYW1wbGluZyBwcmVzc3VyZSBhbmQgZHJpdmluZyB0aGUgbWFub21ldGVyIGRpc3BsYXkuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBwcm9jZXNzTm90ZTogJ0RJR0lUQUwgU0FNUExJTkcgQ09OVFJPTExFUicsXG4gICAgfSxcbiAgICBjaGFwdGVyczogWzNdLFxuICB9LFxuICB7XG4gICAgaWQ6ICdsY2QnLFxuICAgIG9jY3VycmVuY2U6ICdNQU5PTUVURVIgTENEIEJLMTEzNTYtMScsXG4gICAga2luZDogJ2luc3BlY3QnLFxuICAgIGxhYmVsOiAnTENEIE1BTk9NRVRFUicsXG4gICAgZGV0YWlsOiAnT25ib2FyZCBMQ0QgbWFub21ldGVyIHJlYWRvdXQg4oCUIGxpdmUgbGluZS1wcmVzc3VyZSB0ZWxlbWV0cnkgYXQgdGhlIG9wZXJhdG9y4oCZcyB0aHVtYi4nLFxuICAgIC8vIFZpc2libGUgZHVyaW5nIHRoZSByZWFyLUxDRCBvcmJpdCBkd2VsbCAoTENEX1JFVkVBTF9XSU5ET1cgc3RyYWRkbGVzXG4gICAgLy8gcHJvZ3Jlc3Mgd2hlcmUgdGhlIERPTSBjaGFwdGVyIHRyaWdnZXIgYWxyZWFkeSByZXBvcnRzIGNoYXB0ZXIgMikuXG4gICAgd2luZG93OiBbMC40NCwgMC41MV0sXG4gICAgYW5ub3RhdGlvbjoge1xuICAgICAgcHJvY2Vzc05vdGU6ICdCQUNLTElUIERJR0lUQUwgTUFOT01FVEVSJyxcbiAgICB9LFxuICAgIGNoYXB0ZXJzOiBbM10sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2xpcG8nLFxuICAgIG9jY3VycmVuY2U6ICdUZW5lcmd5IExpUG8gQmF0dGVyeSAzLjcgVi0xJyxcbiAgICBraW5kOiAnaW5zcGVjdCcsXG4gICAgbGFiZWw6ICdMaVBvIFBPV0VSIENFTEwnLFxuICAgIGRldGFpbDogJ1RlbmVyZ3kgMy43IFYgTGlQbyBjZWxsIHBvd2VyaW5nIHRoZSBlbGVjdHJvbmljcyBzdGFjayBpbmRlcGVuZGVudCBvZiB0aGUgYWlyIGxpbmUuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBwcm9jZXNzTm90ZTogJzMuN1YgQVVYSUxJQVJZIFBPV0VSIENFTEwnLFxuICAgIH0sXG4gICAgY2hhcHRlcnM6IFszXSxcbiAgfSxcbiAgLyogLS0tLS0tLS0tLS0tLS0tLSBTdGF0aW9uIDI6IFJMLTMwMCAvIE1TUCBBY291c3RpYyBTQUZFIEVuY2xvc3VyZSAtLS0tLS0tLS0tLS0tLS0tICovXG4gIHtcbiAgICBpZDogJ2VuY2xvc3VyZS1jaGFzc2lzJyxcbiAgICBvY2N1cnJlbmNlOiAnRU5DTE9TVVJFX0NIQVNTSVMnLFxuICAgIGtpbmQ6ICdpbnNwZWN0JyxcbiAgICBsYWJlbDogJ0VYVFJVREVEIFVOSUJPRFkgQ0hBU1NJUycsXG4gICAgZGV0YWlsOlxuICAgICAgJ1N0cnVjdHVyYWwgd2VsZGVkIDYwNjEtVDYgYWx1bWludW0gZnJhbWV3b3JrIHdpdGggbW9kdWxhciBpbnRlcm5hbCBtb3VudGluZyBjaGFubmVscyBlbmdpbmVlcmVkIGZvciBpbmR1c3RyaWFsIHBsYW50IGVudmlyb25tZW50cy4nLFxuICAgIGFubm90YXRpb246IHtcbiAgICAgIHByb2Nlc3NOb3RlOiAnNjA2MS1UNiBXRUxERUQgVU5JQk9EWScsXG4gICAgfSxcbiAgICBjaGFwdGVyczogWzJdLFxuICB9LFxuICB7XG4gICAgaWQ6ICdjb21wb3NpdGUtcGFuZWxzJyxcbiAgICBvY2N1cnJlbmNlOiAnQ09NUE9TSVRFX1BBTkVMUycsXG4gICAga2luZDogJ2RhdHVtJyxcbiAgICBsYWJlbDogJ0RBVFVNIEMg4oCUIDUtTEFZRVIgQ09NUE9TSVRFIFdBTEwnLFxuICAgIGRldGFpbDpcbiAgICAgICdNYXNzLWxvYWRlZCB2aW55bCBjb3JlICsgZHVhbC1kZW5zaXR5IGNsb3NlZC1jZWxsIGRlY291cGxpbmcgZm9hbSBwcm92aWRpbmcgLTQzIGRCQSBhY291c3RpYyBhdHRlbnVhdGlvbiB3aXRob3V0IHRoZXJtYWwgdHJhcHBpbmcuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBkYXR1bTogJ0MnLFxuICAgICAgZnJhbWU6IHtcbiAgICAgICAgY2hhcmFjdGVyaXN0aWM6ICdBVFRFTlVBVElPTicsXG4gICAgICAgIGNlbGxzOiBbJy00MyBkQkEnLCAnNS1MQVlFUiddLFxuICAgICAgfSxcbiAgICAgIHByb2Nlc3NOb3RlOiAnLTQzIGRCQSBOT0lTRSBBVFRFTlVBVElPTicsXG4gICAgfSxcbiAgICBjaGFwdGVyczogWzJdLFxuICB9LFxuICB7XG4gICAgaWQ6ICdwdW1wLWhvdXNpbmcnLFxuICAgIG9jY3VycmVuY2U6ICdQVU1QX0hPVVNJTkcnLFxuICAgIGtpbmQ6ICdpbnNwZWN0JyxcbiAgICBsYWJlbDogJ1JMLTMwMCBST1RBUlkgRFJJVkUgVU5JVCcsXG4gICAgZGV0YWlsOlxuICAgICAgJ0hpZ2gtcHJlc3N1cmUgY29udGludW91cyByb3RhcnkgcG9zaXRpdmUgZGlzcGxhY2VtZW50IHB1bXAgZ2VuZXJhdGluZyAxMTUgZEJBIHNvdXJjZSBub2lzZSwgaXNvbGF0ZWQgdmlhIHR1bmVkIGFjb3VzdGljIGNoYW1iZXJzLicsXG4gICAgYW5ub3RhdGlvbjoge1xuICAgICAgcHJvY2Vzc05vdGU6ICcxMTUgZEJBIENPTlRJTlVPVVMgRFJJVkUnLFxuICAgIH0sXG4gICAgY2hhcHRlcnM6IFsyXSxcbiAgfSxcbiAge1xuICAgIGlkOiAnYWNvdXN0aWMtYmFmZmxlcycsXG4gICAgb2NjdXJyZW5jZTogJ0FDT1VTVElDX0JBRkZMRVMnLFxuICAgIGtpbmQ6ICdkYXR1bScsXG4gICAgbGFiZWw6ICdEQVRVTSBEIOKAlCBJTlRFUk5BTCBMQUJZUklOVEgnLFxuICAgIGRldGFpbDpcbiAgICAgICdTb3VuZC1kaXNzaXBhdGluZyBnZW9tZXRyaWMgYmFmZmxlcyB0cmFwcGluZyBoaWdoLWZyZXF1ZW5jeSBhY291c3RpYyB3YXZlcyB3aGlsZSBwcmVzZXJ2aW5nIGFlcm9keW5hbWljIGNvb2xpbmcgYWlyZmxvdy4nLFxuICAgIGFubm90YXRpb246IHtcbiAgICAgIGRhdHVtOiAnRCcsXG4gICAgICBmcmFtZToge1xuICAgICAgICBjaGFyYWN0ZXJpc3RpYzogJ0xBQllSSU5USCcsXG4gICAgICAgIGNlbGxzOiBbJ1NPVU5EIEFSUkVTVE9SJywgJ0NGTSBUVU5FRCddLFxuICAgICAgfSxcbiAgICAgIHByb2Nlc3NOb3RlOiAnSU5URVJOQUwgU09VTkQgQkFGRkxFUycsXG4gICAgfSxcbiAgICBjaGFwdGVyczogWzJdLFxuICB9LFxuICB7XG4gICAgaWQ6ICdpc29sYXRpb24tbW91bnRzJyxcbiAgICBvY2N1cnJlbmNlOiAnSVNPTEFUSU9OX01PVU5UUycsXG4gICAga2luZDogJ2RhdHVtJyxcbiAgICBsYWJlbDogJ0RBVFVNIEUg4oCUIERFQ09VUExJTkcgSVNPTEFUT1JTJyxcbiAgICBkZXRhaWw6XG4gICAgICAnRWxhc3RvbWVyaWMgc2hlYXIgaXNvbGF0b3JzIHByZXZlbnRpbmcgc3RydWN0dXJlLWJvcm5lIG1vdG9yIHZpYnJhdGlvbiB0cmFuc2ZlciBhbmQgZWxpbWluYXRpbmcgc3ltcGF0aGV0aWMgdW5pYm9keSByZXNvbmFuY2UuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBkYXR1bTogJ0UnLFxuICAgICAgZnJhbWU6IHtcbiAgICAgICAgY2hhcmFjdGVyaXN0aWM6ICdJU09MQVRJT04nLFxuICAgICAgICBjZWxsczogWyc8IDUgSHogVFJBTlNNSVNTSU9OJ10sXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc05vdGU6ICdFTEFTVE9NRVJJQyBTSEVBUiBNT1VOVFMnLFxuICAgIH0sXG4gICAgY2hhcHRlcnM6IFsyXSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZHVjdC1pbnRha2UnLFxuICAgIG9jY3VycmVuY2U6ICdEVUNUX0lOVEFLRScsXG4gICAga2luZDogJ2RhdHVtJyxcbiAgICBsYWJlbDogJ0RBVFVNIEYg4oCUIDEsODUwIENGTSBJTlRBS0UgQUlSV0FZJyxcbiAgICBkZXRhaWw6XG4gICAgICAnTGFtaW5hciBsb3ctdmVsb2NpdHkgY29vbGluZyBpbnRha2Ugc2l6ZWQgdmlhIENGTS9GUE0gYWlyZmxvdyBtYXRoIHRvIG1haW50YWluIG9wdGltYWwgdGhlcm1hbCBkZWx0YS1UIHdpdGhvdXQgYWNvdXN0aWMgbGVha2FnZS4nLFxuICAgIGFubm90YXRpb246IHtcbiAgICAgIGRhdHVtOiAnRicsXG4gICAgICBmcmFtZToge1xuICAgICAgICBjaGFyYWN0ZXJpc3RpYzogJ0xBTUlOQVIgRkxPVycsXG4gICAgICAgIGNlbGxzOiBbJzEsODUwIENGTScsICc2NTAgRlBNJ10sXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc05vdGU6ICcxLDg1MCBDRk0gTEFNSU5BUiBJTlRBS0UnLFxuICAgIH0sXG4gICAgY2hhcHRlcnM6IFsyXSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZHVjdC1leGhhdXN0JyxcbiAgICBvY2N1cnJlbmNlOiAnRFVDVF9FWEhBVVNUJyxcbiAgICBraW5kOiAnZGF0dW0nLFxuICAgIGxhYmVsOiAnREFUVU0gRyDigJQgQVRURU5VQVRFRCBFWEhBVVNUIERVQ1QnLFxuICAgIGRldGFpbDpcbiAgICAgICdMb3ctYmFja3ByZXNzdXJlIHRoZXJtYWwgZGlzY2hhcmdlIHBvcnQgd2l0aCBpbnRlZ3JhdGVkIGRpc3NpcGF0aXZlIHNvdW5kIGFycmVzdG9yIHJpbmdzIGRpc2NoYXJnaW5nIGNvb2xpbmcgYWlyIHF1aWV0bHkuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBkYXR1bTogJ0cnLFxuICAgICAgZnJhbWU6IHtcbiAgICAgICAgY2hhcmFjdGVyaXN0aWM6ICdESVNDSEFSR0UnLFxuICAgICAgICBjZWxsczogWydMT1cgQkFDS1BSRVNTVVJFJ10sXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc05vdGU6ICdUSEVSTUFMIERJU0NIQVJHRSBQT1JUJyxcbiAgICB9LFxuICAgIGNoYXB0ZXJzOiBbMl0sXG4gIH0sXG4gIC8qIC0tLS0tLS0tLS0tLS0tLS0gU3RhdGlvbiAzOiBNMjQ5IC8gTUs0NiBQbGF0Zm9ybSAtLS0tLS0tLS0tLS0tLS0tICovXG4gIHtcbiAgICBpZDogJ20yNDktcmVjZWl2ZXInLFxuICAgIG9jY3VycmVuY2U6ICdSRUNFSVZFUl9NT05PQkxPQycsXG4gICAga2luZDogJ2RhdHVtJyxcbiAgICBsYWJlbDogJ0RBVFVNIEEg4oCUIFJFQ0VJVkVSIE1PTk9CTE9DJyxcbiAgICBkZXRhaWw6XG4gICAgICAnUmV2ZXJzZS1lbmdpbmVlcmVkIENOQy1tYWNoaW5lZCBzdGVlbCByZWNlaXZlciBib2R5IHdpdGggQVNNRSBZMTQuNSBtaWwtc3BlYyBpbnRlcmNoYW5nZWFiaWxpdHkgdG9sZXJhbmNlcyByZWNvbnN0cnVjdGVkIGZyb20gM0Qgc2NhbnMuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBkYXR1bTogJ0EnLFxuICAgICAgZnJhbWU6IHtcbiAgICAgICAgY2hhcmFjdGVyaXN0aWM6ICdQUk9GSUxFJyxcbiAgICAgICAgY2VsbHM6IFsnLjAwMTVcIiBAIE1NQycsICdBJywgJ0InXSxcbiAgICAgIH0sXG4gICAgICBwcm9jZXNzTm90ZTogJ01JTC1TUEVDIElOVEVSQ0hBTkdFQUJJTElUWScsXG4gICAgfSxcbiAgICBjaGFwdGVyczogWzNdLFxuICB9LFxuICB7XG4gICAgaWQ6ICdtMjQ5LXRydW5uaW9uJyxcbiAgICBvY2N1cnJlbmNlOiAnQkFSUkVMX1RSVU5OSU9OJyxcbiAgICBraW5kOiAnZGF0dW0nLFxuICAgIGxhYmVsOiAnREFUVU0gQiDigJQgQkFSUkVMIFRSVU5OSU9OIEJPUkUnLFxuICAgIGRldGFpbDpcbiAgICAgICdQcmVjaXNpb24tbWFjaGluZWQgbG9ja2luZyB0cnVubmlvbiBib3JlLiBDb25jZW50cmljaXR5IGFuZCBSVU5PVVQgPCAuMDAwOFwiIFRJUiBmb3IgcXVpY2stY2hhbmdlIGJhcnJlbCBpbnRlcmNoYW5nZWFiaWxpdHkuJyxcbiAgICBhbm5vdGF0aW9uOiB7XG4gICAgICBkYXR1bTogJ0InLFxuICAgICAgZnJhbWU6IHtcbiAgICAgICAgY2hhcmFjdGVyaXN0aWM6ICdSVU5PVVQnLFxuICAgICAgICBjZWxsczogWycuMDAwOFwiIFRJUicsICdBJ10sXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc05vdGU6ICdRVUlDSy1DSEFOR0UgTE9DS1VQIEJPUkUnLFxuICAgIH0sXG4gICAgY2hhcHRlcnM6IFszXSxcbiAgfSxcbiAge1xuICAgIGlkOiAnbTI0OS1yYWlsJyxcbiAgICBvY2N1cnJlbmNlOiAnUElDQVRJTk5ZX1RPUF9SQUlMJyxcbiAgICBraW5kOiAnZGF0dW0nLFxuICAgIGxhYmVsOiAnREFUVU0gQyDigJQgTUlMLVNURC0xOTEzIFRPUCBSQUlMJyxcbiAgICBkZXRhaWw6XG4gICAgICAnUGFyYW1ldHJpY2FsbHkgcmVjb25zdHJ1Y3RlZCAxOTEzIG9wdGljYWwgbW91bnRpbmcgcmFpbCB3aXRoIHRydWUgcmVjb2lsIHNsb3Qgc3BhY2luZyBhbmQgcHJlY2lzaW9uIGNlbnRlci1ib3JlIGRhdHVtIGFsaWdubWVudC4nLFxuICAgIGFubm90YXRpb246IHtcbiAgICAgIGRhdHVtOiAnQycsXG4gICAgICBmcmFtZToge1xuICAgICAgICBjaGFyYWN0ZXJpc3RpYzogJ1BBUkFMTEVMSVNNJyxcbiAgICAgICAgY2VsbHM6IFsnLjAwMTBcIicsICdBJ10sXG4gICAgICB9LFxuICAgICAgcHJvY2Vzc05vdGU6ICdNSUwtU1RELTE5MTMgUFJPRklMRScsXG4gICAgfSxcbiAgICBjaGFwdGVyczogWzNdLFxuICB9LFxuICB7XG4gICAgaWQ6ICdtMjQ5LWZlZWQtdHJheScsXG4gICAgb2NjdXJyZW5jZTogJ0ZFRURfVFJBWV9JTlRFUkZBQ0UnLFxuICAgIGtpbmQ6ICdpbnNwZWN0JyxcbiAgICBsYWJlbDogJ0ZFRUQgVFJBWSAmIEJPTFQgQ0FSUklFUiBHVUlERScsXG4gICAgZGV0YWlsOlxuICAgICAgJ1JldmVyc2UtZW5naW5lZXJlZCBmZWVkIGd1aWRlIHJhaWxzIHJlY29uc3RydWN0ZWQgZnJvbSByYXcgM0Qgc2NhbiBwb2ludCBjbG91ZHMgd2l0aG91dCBvcmlnaW5hbCB0ZWNobmljYWwgZGF0YSBwYWNrYWdlIChURFApLicsXG4gICAgYW5ub3RhdGlvbjoge1xuICAgICAgcHJvY2Vzc05vdGU6ICdEVUFMLUZFRUQgR1VJREUgSU5URVJGQUNFJyxcbiAgICB9LFxuICAgIGNoYXB0ZXJzOiBbM10sXG4gIH0sXG5dXG4iXSwibWFwcGluZ3MiOiJBQWFPLGFBQU0sV0FBeUI7QUFBQSxFQUNwQztBQUFBLElBQ0UsT0FBTztBQUFBLElBQ1AsT0FBTztBQUFBLElBQ1AsT0FBTztBQUFBLElBQ1AsVUFDRTtBQUFBLElBQ0YsVUFBVSxDQUFDLG9CQUFvQjtBQUFBLElBQy9CLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQTtBQUFBLElBQ0UsT0FBTztBQUFBLElBQ1AsT0FBTztBQUFBLElBQ1AsT0FBTztBQUFBLElBQ1AsVUFDRTtBQUFBLElBQ0YsVUFBVSxDQUFDLHNCQUFzQixzQkFBc0I7QUFBQSxJQUN2RCxPQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE9BQU87QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLFVBQ0U7QUFBQSxJQUNGLFVBQVUsQ0FBQyxtQkFBbUI7QUFBQSxJQUM5QixPQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0E7QUFBQSxJQUNFLE9BQU87QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLE9BQU87QUFBQSxJQUNQLFVBQ0U7QUFBQSxJQUNGLFVBQVUsQ0FBQyx3QkFBd0Isb0JBQW9CO0FBQUEsSUFDdkQsT0FBTztBQUFBLEVBQ1Q7QUFDRjtBQW9CTyxhQUFNLG9CQUFvQjtBQUFBLEVBQy9CLFNBQVM7QUFBQSxFQUNULGVBQWU7QUFBQSxFQUNmLFVBQVU7QUFBQSxFQUNWLE1BQU07QUFDUjtBQUVPLGFBQU0sZUFBNEI7QUFBQSxFQUN2QztBQUFBLElBQ0UsSUFBSTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLElBQ1YsVUFDRTtBQUFBLElBQ0YsU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFB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