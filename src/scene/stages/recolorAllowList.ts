/**
 * JG-032 — Dark-blue enclosure recolor: per-mesh part-number allow-list.
 *
 * OWNER RULING 2026-09-08: the dark-blue treatment is APPROVED, superseding
 * the JG-021 materials round-3 ruling ("RETAIN the GLB's baked CAD palette").
 * That ruling's failure catalogue is the design constraint here:
 *   (1) tint-lerping pulled black/rubber parts toward grey     → no lerps,
 *       no tints, no global clamps; only explicit SETs on allow-listed parts.
 *   (2) large meshes repainted into saturated walls (the opaque
 *       MSP_YELLOW_PAINT intake grille G2RL300-SAF-1003-2 lerped teal and
 *       read as "the cyan camera-facing panel")                  → every
 *       MSP_YELLOW_PAINT mesh is protected by material gate AND absence
 *       from the allow-list.
 *   (3) a dark finish matrix at metalness ≈ 1 under env reflections
 *       flattened everything to milky-grey charcoal              → the
 *       matrix below sits deliberately below the draft's 0.78/1.05.
 *
 * Evaluation is PER MESH (node name + material name), never on a root —
 * root-level evaluation is what repainted all 191 chassis children in the
 * rejected draft. Part numbers are the stable key (AGENTS.md); GLTFLoader
 * sanitizes node names ('/' and '.' dropped, whitespace → '_'), so patterns
 * are matched unanchored on the sanitized name.
 */

export interface RecolorSpec {
  bucket: 'chassis' | 'panels'
  color: string
  roughness: number
  metalness: number
  envMapIntensity: number
}

/** Chassis structure — starting matrix, A/B'd (below the milky-grey band). */
export const CHASSIS_RECOLOR: RecolorSpec = {
  bucket: 'chassis',
  color: '#0a1a3a',
  roughness: 0.42,
  metalness: 0.5,
  envMapIntensity: 0.75,
}

/** Composite panel sheets — starting matrix, A/B'd. */
export const PANEL_RECOLOR: RecolorSpec = {
  bucket: 'panels',
  color: '#132a4a',
  roughness: 0.48,
  metalness: 0.4,
  envMapIntensity: 0.7,
}

/**
 * Chassis structure allow-list (ENCLOSURE_CHASSIS root). The big baked-black
 * frame members by vertex rank (.scratch/dump-jg032-verts.mjs 2026-09-08):
 * V2RL300-FPL-0001/0002 frame plates (10.7K pts), RL300-CPM-3001,
 * V2RL300-FTS-1007/1009 feet, V2RLP-SK-4000-A skids, V2ECP-SM-5000 end
 * frames, V2FTA-FP-46-RL-1000 floor tracks. HWR-/V2HWR- fasteners and
 * every yellow SIF/PEM/EMG member are deliberately excluded.
 */
const CHASSIS_STRUCTURE_ALLOW_LIST: readonly RegExp[] = [
  /V2RL300-FPL-000[12]/i,
  /RL300-CPM-3001/i,
  /V2RL300-FTS-100[79]/i,
  /V2RLP-SK-4000-A/i,
  /V2ECP-SM-5000/i,
  /V2FTA-FP-46-RL-1000/i,
]

/**
 * Panel sheet allow-list (COMPOSITE_PANELS root). The baked-black composite
 * wall sheets: STD-LBAP-4001 and the G2RL200-SAF-10xx LBA panel family
 * (1033/1035/1039/1040/1041/1049) plus V2RL300-SAF-1047/1066 stiffeners.
 * The large yellow G2C07-0085 / G2RL300-SAF-1xxx wall sheets, Allegis latch
 * hardware, and plastic fasteners are deliberately excluded.
 */
const PANEL_ALLOW_LIST: readonly RegExp[] = [
  /STD-LBAP-4001/i,
  /G2RL200-SAF-10(33|35|39|40|41|49)/i,
  /V2RL300-SAF-1047/i,
  /V2RL300-SAF-1066/i,
]

/**
 * Material gate — the recolor only ever lands on baked-black chassis stock.
 * Everything else is protected by name: yellow paint (failure band 2),
 * rubber/plastic (band 1 collateral), stainless/aluminum/machined steel
 * (hardware identity), and the translucent cyan airway volume.
 */
const RECOLORABLE_MATERIAL = 'MSP_BLACK_CHASSIS'

/**
 * Per-mesh recolor predicate. Returns the finish to SET (never lerp) or null.
 * Both gates must pass: an allow-listed part number AND the baked-black
 * chassis material — so a future GLB material reshuffle cannot repaint a
 * yellow or rubber mesh that happens to share a name fragment.
 */
export function recolorSpecFor(nodeName: string, materialName: string): RecolorSpec | null {
  if (materialName !== RECOLORABLE_MATERIAL) return null
  if (CHASSIS_STRUCTURE_ALLOW_LIST.some((re) => re.test(nodeName))) return CHASSIS_RECOLOR
  if (PANEL_ALLOW_LIST.some((re) => re.test(nodeName))) return PANEL_RECOLOR
  return null
}
