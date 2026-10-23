import {
  BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh,
  MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Plane,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DEEPEST_CUT } from './shot'
import { isMultiSlotMismatch, mapFor, type V16Map, type V16Resolved } from './v16Materials'

/** Shell roles carry the approved blue. Equipment and hardware keep their CAD identity. */
export const SHELL_ROOTS = new Set(['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'ACOUSTIC_BAFFLES', 'DUCT_INTAKE', 'DUCT_EXHAUST'])
/** Roots the cut owns by default. PUMP_HOUSING and ISOLATION_MOUNTS stay whole on
 *  purpose — the engine and pump are the story — so their 150 mesh nodes are cut only
 *  where PART_POLICY names them. */
export const SECTION_ROOTS = SHELL_ROOTS
export const LINER_PART = 'V2RL300-SAF-1047-5'
/** Owner ruling 2026-09-16 on the annotated render: "this exhaust pipe should be chrome."
 *  `EXHAUST PIPE-1` is the external stack above the roof (world y 1.77…2.06) — not the
 *  internal rear ducting its root also holds — so it takes polished metal, never the
 *  approved blue, no matter what the shell roots say. Scene form, as GLTFLoader delivers it. */
export const EXHAUST_PIPE = 'EXHAUST_PIPE-1'
/** MSP_STAINLESS's own base colour, so the ruled pipe and its stainless tip read as one metal. */
export const CHROME = '#b8babf'

export type SectionPolicy = 'section' | 'keep' | 'hide' | 'delete'

/** Owner ruling 2026-09-11 on the Milestone-2 review build, by exact CAD occurrence name.
 *  `keep`    — never clipped; reads as an intact component inside the open section.
 *  `hide`    — must not be visible once the section is open. Parts the finished cut already
 *              removes are simply clipped, so they still dress the closed exterior; parts the
 *              cut cannot reach are dropped from the model outright.
 *  `delete`  — never built, at any progress. Reserved for parts the owner has ruled do not
 *              belong in the assembly at all, not for dressing we merely do not want on screen.
 *  `section` — clipped; the cut face is the point (default for everything unnamed). */
export const PART_POLICY: Record<string, SectionPolicy> = {
  'V2RL300-SAF-RES-1020-SAFE-1': 'keep',
  'RL300-PEM-1001-1': 'keep',
  'RL300-EMG-1001-P-1': 'keep',
  // V16 materials-and-parts track, owner-approved 2026-10-11: already in both shipped GLBs
  // (ENCLOSURE_CHASSIS, MSP_BLACK_CHASSIS, 674 triangles); kept whole and never repainted.
  'RL300-P-FFM-1001-1': 'keep',
  // Owner, V16 round 2: these two must not disappear with the section. Both are in the full
  // and lite GLBs.
  'RL300-CPM-3001-1': 'keep',
  'RL300-P-CPM-2001-1': 'keep',
  // Owner recommendation accepted, V16 round 2: the external exhaust stack stays visible
  // through the section. Its chrome ruling still wins (see finishFor), and
  // EXHAUST_STACK_OFFSET moves it onto the V16 connector.
  'EXHAUST PIPE-1': 'keep',
  'MirrorRL200-AFS-2001-2': 'hide',
  'RL300-AFS-2003-5': 'hide',
  'V23028T25_Weld-on Tie-Down Ring-1': 'hide',
  'V23028T25_Weld-on Tie-Down Ring-2': 'hide',
  'V2RL300-WO-NP-SAFE-1': 'hide',
  'V2EDW-60335 (Fuel Tank Weld On Flange)-1': 'hide',
  'V2SKF-TB-2200-01-1': 'hide',
  // Second ruling pass 2026-09-11: still visible in the open section.
  'V2MSP-MID-5406HHP24 ~-1': 'hide',
  'V2MSP-MID-5406HHP24 ~-3': 'hide',
  'V2SKF-TB-2200-01-2': 'hide',
  'V2SKF-TB-2250-01-1': 'hide',
  'V2SKF-TB-2250-01-2': 'hide',
  'ISO_MOUNT_4': 'hide',
  'ISO_MOUNT_5': 'hide',
  'ISO_MOUNT_6': 'hide',
  // Third pass: the fuel flange and the fuel neck beside it. `-3` completed the flange
  // pair in a follow-up ruling the same day; the owner's report of -2 still showing
  // traced to a screenshot captured before this pass had been built.
  'V2EDW-60335 (Fuel Tank Weld On Flange)-2': 'hide',
  'V2EDW-60335 (Fuel Tank Weld On Flange)-3': 'hide',
  'V2WISC-4770-7-1': 'hide',
  // Owner: "not supposed to be there technically" — out of the assembly entirely.
  '12335A81_Oil-Resistant Push-on Seal with Bulb-1': 'delete',
  'V2SKF-TB-5500-03-1': 'section',
  'V2SKF-TB-5500-03-2': 'section',
}

/** GLTFLoader runs every node name through PropertyBinding.sanitizeNodeName, so the
 *  CAD occurrence names above never reach the scene verbatim. Match on the same form. */
export function sanitizeName(name: string) {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '')
}

const POLICY_INDEX = new Map(Object.entries(PART_POLICY).map(([name, policy]) => [sanitizeName(name), { name, policy }]))

/** Also matches the `name_1` primitives GLTFLoader splits multi-primitive mesh defs into. */
export function policyFor(name: string): { name: string; policy: SectionPolicy } | null {
  const exact = POLICY_INDEX.get(name)
  if (exact) return exact
  for (const [key, entry] of POLICY_INDEX) if (name.startsWith(`${key}_`)) return entry
  return null
}

/** The deepest plane constant the sequence ever reaches; nothing at or below it is ever
 *  cut away. Shot 07 closes the section again, so this is the sequence minimum — not the
 *  value at `u = 1`, which is the closed exterior. */
export const FINISHED_CUT = DEEPEST_CUT

export interface PartRecord {
  policy: SectionPolicy; clipped: boolean; repainted: boolean; removed: boolean
  triangles: number; xMin: number; xMax: number
}

export function finishFor(root: string, material: string, policy: SectionPolicy = 'section', part?: string, reservoir = false, insulation = false) {
  // A named part rules over its root here too: the exhaust stack is chrome even inside a shell
  // root, and even though it is a kept (never clipped) part.
  if (part === EXHAUST_PIPE) return CHROME
  // A kept component is equipment, not shell: repainting it blue is what made it unreadable.
  if (policy === 'keep') return null
  // Owner ruling 2026-09-24: reservoirs are equipment (all MSP_YELLOW_PAINT) — the two
  // under COMPOSITE_PANELS were catching the shell blue and reading as a different
  // machine from their yellow siblings. CAD finish wins for any reservoir occurrence.
  // The ancestor walk is deliberate: a reservoir's child meshes are often unnamed
  // splits, so any -RES- name from the mesh up to the root counts (reviewer-verified:
  // no live non-reservoir matches that path today).
  if (reservoir) return null
  // Owner ruling 2026-09-24: insulation is the enclosure's absorptive interior — any
  // -SIF- occurrence renders the approved blue whatever its CAD material (several carry
  // MSP_ALUMINUM / MSP_RUBBER and read as bare metal or gray behind the airflow path).
  if (insulation) return '#193f66'
  if (SHELL_ROOTS.has(root) && material === 'MSP_YELLOW_PAINT') return '#193f66'
  if (material === 'MSP_BLACK_CHASSIS') return '#161e25'
  return null
}

/** Bake world transforms once, preserving reflected CAD winding and every triangle. */
export function bakeGeometry(mesh: Mesh): BufferGeometry {
  const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
  g.applyMatrix4(mesh.matrixWorld)
  // CAD has no texture coordinates; only normals and positions are needed here.
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
  if (mesh.matrixWorld.determinant() < 0) {
    for (const name of Object.keys(g.attributes)) {
      const attr = g.getAttribute(name)
      const a = new Float32Array(attr.count * attr.itemSize)
      for (let i = 0; i < attr.count; i++) {
        const source = i % 3 === 1 ? i + 1 : i % 3 === 2 ? i - 1 : i
        for (let j = 0; j < attr.itemSize; j++) a[i * attr.itemSize + j] = attr.array[source * attr.itemSize + j]
      }
      g.setAttribute(name, new Float32BufferAttribute(a, attr.itemSize))
    }
  }
  if (!g.getAttribute('normal')) g.computeVertexNormals()
  g.clearGroups()
  return g
}

/** Count caps only on closed, consistently wound volumes. Open CAD sheets leak stencil. */
export function isClosedVolume(geometry: BufferGeometry): boolean {
  const p = geometry.getAttribute('position')
  const index = geometry.index
  const count = index?.count ?? p.count
  const edges = new Map<string, { count: number; balance: number }>()
  const key = (i: number) => `${Math.round(p.getX(i) * 1e5)},${Math.round(p.getY(i) * 1e5)},${Math.round(p.getZ(i) * 1e5)}`
  const keys = Array.from({ length: p.count }, (_, i) => key(i))
  for (let i = 0; i < count; i += 3) {
    const t = [0, 1, 2].map(j => keys[index ? index.getX(i + j) : i + j])
    if (new Set(t).size < 3) continue
    for (let j = 0; j < 3; j++) {
      const a = t[j], b = t[(j + 1) % 3], edge = a < b ? `${a}/${b}` : `${b}/${a}`
      const e = edges.get(edge) ?? { count: 0, balance: 0 }
      e.count++; e.balance += a < b ? 1 : -1; edges.set(edge, e)
    }
  }
  return edges.size > 0 && [...edges.values()].every(e => e.count === 2 && e.balance === 0)
}

const has = (table: object, key: string) => Object.prototype.hasOwnProperty.call(table, key)

/** Which V16 part a delivered Mesh belongs to, and where it sits among that part's slots.
 *  GLTFLoader gives a single-primitive part as one Mesh named after the part (the JSON
 *  key). A multi-primitive part is a non-Mesh group carrying the part name whose Mesh
 *  children (`Mesh_422`, `Mesh_422_1`, ...) are its primitives in order. The slot count is
 *  what the loader delivered, never the asset seat's `glbPrims`: lite splits fewer parts. */
export function locatePart(obj: Mesh, parts: V16Map['parts']): { part: string; slotIndex: number; slotCount: number } | null {
  if (has(parts, obj.name)) return { part: obj.name, slotIndex: 0, slotCount: 1 }
  const parent = obj.parent
  if (parent && !(parent instanceof Mesh) && has(parts, parent.name)) {
    const slots = parent.children.filter(child => child instanceof Mesh && !has(parts, child.name))
    const slotIndex = slots.indexOf(obj)
    if (slotIndex >= 0) return { part: parent.name, slotIndex, slotCount: slots.length }
  }
  return null
}

/** Policy for the separate `rl300-extra-parts.glb`, by the node names GLTFLoader delivers.
 *  Kept apart from PART_POLICY because prepareModel requires every PART_POLICY part to be
 *  present in the main source. Everything in the extras is whole (never clipped, never
 *  capped): the dials, the V16 MAN pump assembly that replaces the shipped fused MAN mesh,
 *  and the exhaust connector pipe the owner wants visible through the section. */
export const EXTRAS_POLICY: Record<string, SectionPolicy> = {
  GAUGE_DIALS: 'keep',
  PUMP_HOUSING: 'keep',
  EXHAUST_CONNECTOR_PIPE: 'keep',
}

/** The shipped fused MAN mesh that the extras' PUMP_HOUSING assembly replaces on the full tier. */
export const REPLACED_MAN = 'MAN-6650459107-1'

/** Translation (glTF metres, world frame) of the external exhaust stack `EXHAUST PIPE-1`
 *  so it stays coaxial with the V16 connector pipe. V16 sits +0.40 in x and -0.065 in z
 *  from the shipped stack. The engine-bay cluster now returns to the V16 frame (see
 *  FRAME_SHIFT_Z), so the extras' connector carries no frame shift and the stack takes
 *  the full -0.065. The shipped GLBs are never edited. */
export const EXHAUST_STACK_OFFSET = [0.4, 0, -0.065] as const

/** V16 frame shift (owner-approved 2026-10-12): the engine-bay cluster is exported
 *  +14.0 to +15.0 mm in glTF z from V16 while the shell, panels and ducts are exact. Audit
 *  `asset2/audit.md`, shipped minus V16, median per V16 root group (the fused nodes are
 *  measured on their family union). Each node moves back by its group's constant, the same
 *  on both tiers, and its extras follow it by root so nothing sits 15 mm off its neighbour.
 *  Keys are scene names (GLTFLoader-sanitized), matched on any ancestor of a mesh. The
 *  scattered groups (COMPOSITE_PANELS, bolts, tie-downs) are deliberately absent. */
const FRAME_SHIFT_Z = new Map<string, number>()
const shiftNodes = (dz: number, names: string[]) => names.forEach(name => FRAME_SHIFT_Z.set(name, dz))
shiftNodes(-0.0149, [
  '26-01305-1', '4874290_REV00_MS-1', '4874323_VG01_REV01_MS-1', '4874342_VG01_REV08_MS-1', '4901304_VG01_REV12_MS-1',
  '4987944_VG01_REV02_PART-1', '4992387_VG01_REV02_MS-1', '5055447_REV03_MS-1', '5090203_REV03_MS-1', '5100022_REV03_MS-1',
  '5118791_REV03_PART-1', '5182996_REV03_MS-1', '5236568_REV08_ASSY_ASM-15236568_REV08_PARTS_MS-1',
  '5236568_REV08_ASSY_ASM-15515102_REV00_MS-1', '5257943_REV01_MS-1', '5257950_REV00_MS-1', '5286519-06_SIMP-1',
  '5488442_REV02_MS-1', '5488455_REV05_MS-1', '5488492_REV03_MS-1', '5488512_REV04_PART-1', '5488541_REV03_MS-1',
  '5488818_REV04_MS-1', '5488968_REV04_ASSY_ASM-15488968_XOVERPIPE_MS01-1',
  '5488968_REV04_ASSY_ASM-15770437_ASM-15770437_CP01-1', '5495457_REV09_PART-1', '5501384_VG01_REV01_MS-1',
  '5501498_REV00_MS-1', '5529980_REV02_MS-1', '5545242_REV03_MS-1', '5952967_REV00_MS-1', '6008619_VG01_REV00_MS-1',
  '6008668_REV02_MS-1', '6013677_REV04_PART-1', '6103389_REV00_MS-1',
]) // 904j-e28t_eng (34 nodes, +14.9) and 26-01305-1 (+14.9)
shiftNodes(-0.0145, ['RM100-PX1029008D-1'])
// RL300-CPM-3000, RL300-P-FFM-1000 and the fused control panel (+14.0).
shiftNodes(-0.014, ['RL300-CPM-3001-1', 'RL300-P-CPM-2001-1', 'RL300-P-FFM-1001-1', 'RL300-P-FFM-1002-1', 'RL300-P-FFM-1002-2', 'V2CONTROL_PANEL,_URFS-2'])
shiftNodes(-0.0141, [REPLACED_MAN]) // the shipped fused MAN (+14.1), replaced by the extras assembly on both tiers
/** The extras GLB bakes the same cluster frame into each root's translation (z +0.0154 /
 *  +0.014 / +0.0141); the roots return to V16 by that amount. Root -> world z. */
const EXTRAS_FRAME_SHIFT_Z: Record<string, number> = { DUCT_EXHAUST: -0.0154, GAUGE_DIALS: -0.014, PUMP_HOUSING: -0.0141 }

export interface PrepareOptions {
  /** V16 per-part materials. Absent: the GLB's own materials, exactly as before. */
  v16?: V16Map
  /** Build MeshPhysicalMaterial for V16 materials with clearcoat. False on the lite tier. */
  physical?: boolean
  /** Scene of `rl300-extra-parts.glb` (full tier). Prepared in the same call so it shares
   *  buckets, caps, stencil and disposal with the main model. */
  extras?: Group
}

/** A mapped, non-repainted part takes its V16 values. The clone keeps whatever else the
 *  GLB material carried; colour (linear working space), metalness and roughness come from
 *  the entry, and clearcoat promotes the material to physical when the tier allows it. */
function v16Material(original: MeshStandardMaterial, entry: V16Resolved, physical: boolean): MeshStandardMaterial {
  const clone = original.clone()
  let mat = clone
  if (physical && entry.clearcoat > 0) {
    const coated = new MeshPhysicalMaterial()
    MeshStandardMaterial.prototype.copy.call(coated, clone)
    // The standard copy resets `defines` to STANDARD only; a physical material also carries PHYSICAL.
    coated.defines = { STANDARD: '', PHYSICAL: '' }
    coated.clearcoat = entry.clearcoat
    coated.clearcoatRoughness = entry.clearcoatRoughness
    clone.dispose()
    mat = coated
  }
  mat.color.setRGB(entry.baseLinear[0], entry.baseLinear[1], entry.baseLinear[2])
  mat.metalness = entry.metalness
  mat.roughness = entry.roughness
  return mat
}

export function prepareModel(source: Group, plane: Plane, options: PrepareOptions = {}) {
  const { v16, physical = false, extras } = options
  source.updateMatrixWorld(true)
  extras?.updateMatrixWorld(true)
  const group = new Group()
  group.name = 'RL300_PRESENTATION'
  const buckets = new Map<string, { geometries: BufferGeometry[]; material: MeshStandardMaterial; root: string }>()
  const caps = new Map<string, BufferGeometry[]>()
  const counts = {
    sourceTriangles: 0, keptTriangles: 0, linerTriangles: 0, sourceMeshes: 0, batches: 0, cappedTriangles: 0, openSectionTriangles: 0, keptWholeTriangles: 0, removedTriangles: 0, skippedRoots: 0,
    // Triangles of the shipped fused MAN mesh the extras' PUMP_HOUSING assembly replaces (full tier).
    // Not a ruled removal, so never part of removedTriangles.
    replacedTriangles: 0,
    // V16 telemetry. `materials` is the unique materials in the group; mappedParts and
    // unmappedMultiSlot are unique part names, mappedPrimitives counts delivered meshes
    // (a mapped part whose look a ruling protects still counts: its V16 entry was found).
    materials: 0, mappedParts: 0, mappedPrimitives: 0, protectedPrimitives: 0, unmappedMultiSlot: 0,
    extraParts: 0, extraTriangles: 0, v16Applied: false,
  }
  const mappedParts = new Set<string>(), unmappedMultiSlot = new Set<string>()
  /** Measured evidence for every part the owner named, so the ruling is verifiable. */
  const parts = new Map<string, PartRecord>()
  let linerFound = false
  // V16 materials with identical values share one bucket: the order-independent canonical
  // name is the alphabetically first material carrying the same values.
  const canonical = new Map<string, string>()
  if (v16) {
    const bySignature = new Map<string, string>()
    for (const name of Object.keys(v16.materials).sort()) {
      const m = v16.materials[name]
      const signature = JSON.stringify([m.baseLinear, m.metalness, m.roughness, m.clearcoat, m.clearcoatRoughness, m.opacity])
      if (!bySignature.has(signature)) bySignature.set(signature, name)
      canonical.set(name, bySignature.get(signature)!)
    }
  }
  // The full tier's extras replace the shipped fused MAN mesh with the V16 assembly.
  const manReplaced = !!extras && extras.children.some(child => child.name === 'PUMP_HOUSING')
  const ingest = (root: Object3D, extra: boolean) => {
    root.traverse((obj: Object3D) => {
      if (!(obj instanceof Mesh)) return
      counts.sourceMeshes++
      const triangles = (obj.geometry.index?.count ?? obj.geometry.getAttribute('position').count) / 3
      counts.sourceTriangles += triangles
      let p: Object3D | null = obj
      let liner = false
      let pipe = false
      let named: string | null = null
      let policy: SectionPolicy | null = null
      let reservoir = false
      let insulation = false
      let frameShiftZ = 0
      if (extra) {
        // Extras are not CAD occurrences: no liner, reservoir, insulation or exhaust-stack
        // rules, only the extras table, nearest ancestor first (the root itself counts).
        for (; p && p !== extras; p = p.parent) {
          if (!policy && has(EXTRAS_POLICY, p.name)) policy = EXTRAS_POLICY[p.name]
          if (!frameShiftZ && has(EXTRAS_FRAME_SHIFT_Z, p.name)) frameShiftZ = EXTRAS_FRAME_SHIFT_Z[p.name]
        }
      } else {
        while (p && p !== root) {
          if (p.name === LINER_PART) liner = true
          if (!pipe) pipe = p.name === EXHAUST_PIPE || p.name.startsWith(`${EXHAUST_PIPE}_`)
          if (!frameShiftZ) frameShiftZ = FRAME_SHIFT_Z.get(p.name) ?? 0
          if (/-RES-/.test(p.name)) reservoir = true
          if (/-SIF-/.test(p.name)) insulation = true
          if (!policy) { const found = policyFor(p.name); if (found) { policy = found.policy; named = found.name } }
          p = p.parent
        }
      }
      if (liner) { linerFound = true; counts.linerTriangles += triangles; return }
      if (manReplaced && !extra) {
        let q: Object3D | null = obj
        while (q && q !== root && q.name !== REPLACED_MAN) q = q.parent
        if (q && q !== root) { counts.replacedTriangles += triangles; return }
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      if (mats.length !== 1) throw new Error('RL300 loader must expand each CAD primitive before batching')
      const original = mats[0] as MeshStandardMaterial
      if (original.name === 'MSP_AIRWAY_VOLUME') return // CAD helper, not a surface
      const resolved: SectionPolicy = policy ?? (SECTION_ROOTS.has(root.name) ? 'section' : 'keep')
      // A named part rules over its root: that is how equipment gets hidden or cut.
      const clipped = policy ? policy !== 'keep' : SECTION_ROOTS.has(root.name)
      // Every finishFor rule keeps receiving the BASE material name; for the extras that is
      // the V16 name their GLB carries (MSP_BLACK_CHASSIS still renders the ruled #161e25) and
      // the root is the extras root. The extras' `keep` is a cutting policy, not a finish: they
      // pass `section` like any unnamed part, so the root and material rules decide the finish.
      const color = finishFor(root.name, original.name, extra ? 'section' : policy ?? 'section', pipe ? EXHAUST_PIPE : undefined, reservoir, insulation)
      let entry: V16Resolved | null = null
      let partName: string | null = null
      let mismatch = false
      if (v16) {
        const at = locatePart(obj, v16.parts)
        if (at) {
          partName = at.part
          entry = mapFor(v16, at.part, at.slotIndex, at.slotCount)
          // A multi-slot part whose slots are not the primitives the loader delivered stays
          // on current behaviour; it is counted, never guessed.
          mismatch = !entry && isMultiSlotMismatch(v16, at.part, at.slotCount)
        }
        // An extras mesh the part table lacks still carries a V16 material name.
        if (!entry && extra && has(v16.materials, original.name)) entry = { ...v16.materials[original.name], name: original.name }
      }
      // Ruled looks are protected: where finishFor returned a colour the bucket keeps the
      // current roughness and metalness exactly and takes no V16 values. Otherwise a mapped
      // part takes the V16 material outright.
      const applyV16 = !!entry && !color
      // A bucket is keyed by the material whose values it carries: the V16 name when V16
      // values apply, else the GLB name. In V16 mode an unrepainted GLB-look bucket gets
      // `~glb`, because V16 reuses GLB names (MSP_STAINLESS, MSP_PLASTIC, ...) with
      // different values and the two must never merge. Repainted buckets keep the GLB name:
      // the repaint is a base-material ruling, and several base materials (the -SIF-
      // insulation) share one V16 name, so keying them on it would mix their looks.
      // V16 materials with identical values share the canonical (alphabetically first) name.
      const material = applyV16 ? canonical.get(entry!.name) ?? entry!.name : v16 && !color ? `${original.name}~glb` : original.name
      const key = `${root.name}/${material}/${clipped ? 'cut' : 'whole'}/${color ?? 'cad'}`
      let bucket = buckets.get(key)
      if (!bucket) {
        const mat = applyV16 ? v16Material(original, entry!, physical) : original.clone()
        mat.name = key
        if (color) mat.color.set(color)
        mat.transparent = false; mat.opacity = 1; mat.depthWrite = true
        // The one transparent path: a mapped entry with opacity < 1 (the dial lenses, at the
        // JSON's Fresnel normal-incidence value). Nothing else is ever transparent.
        // DoubleSide stays; forceSinglePass stops three drawing a transparent double-sided
        // material as a back pass then a front pass (both faces share colour and opacity, so
        // the order is invisible and the lens costs one draw instead of two).
        if (applyV16 && entry!.opacity < 1) { mat.transparent = true; mat.opacity = entry!.opacity; mat.depthWrite = false; mat.forceSinglePass = true }
        mat.side = DoubleSide
        if (!applyV16) {
          // The chrome ruling carries the stainless tip's own clamped .28/.8, so the whole
          // stack reads as one polished pipe; repainted paint stays satin like the approved blue.
          mat.roughness = color === CHROME ? .28 : original.name === 'MSP_YELLOW_PAINT' ? .34 : Math.max(.28, original.roughness)
          mat.metalness = color === CHROME ? .8 : original.name === 'MSP_YELLOW_PAINT' ? .32 : Math.min(.8, original.metalness)
        }
        // V16 values skip the `roughness >= .28` / `metalness <= .8` clamps above on purpose:
        // they would erase the lacquer's .16 roughness and the brass's 1.0 metalness.
        mat.envMapIntensity = .65
        if (clipped) { mat.clippingPlanes = [plane]; mat.clipShadows = true }
        bucket = { geometries: [], material: mat, root: root.name }
        buckets.set(key, bucket)
      }
      const geometry = bakeGeometry(obj)
      // The geometry is baked into the world frame above, so the stack offset (a world-frame
      // translation in glTF metres) is applied to the baked positions, before the bounds, the
      // closed-volume test and the merge. Both tiers carry the same node; the GLBs stay as shipped.
      if (pipe) geometry.translate(EXHAUST_STACK_OFFSET[0], EXHAUST_STACK_OFFSET[1], EXHAUST_STACK_OFFSET[2])
      // The V16 frame shift (FRAME_SHIFT_Z), likewise a world-frame translation of the baked positions.
      if (frameShiftZ) geometry.translate(0, 0, frameShiftZ)
      let record: PartRecord | undefined
      if (named) {
        geometry.computeBoundingBox()
        const box = geometry.boundingBox!
        record = parts.get(named) ?? { policy: resolved, clipped, repainted: !!color, removed: false, triangles: 0, xMin: Infinity, xMax: -Infinity }
        record.triangles += triangles
        record.xMin = Math.min(record.xMin, box.min.x); record.xMax = Math.max(record.xMax, box.max.x)
        parts.set(named, record)
        // The cut only reaches what lies beyond the finished plane. Anything a `hide` ruling
        // names on the near side of it has to go, or it survives the whole sequence.
        if (resolved === 'delete' || (resolved === 'hide' && box.min.x <= FINISHED_CUT)) {
          record.removed = true
          counts.removedTriangles += triangles
          geometry.dispose()
          return
        }
      }
      // V16 and extras telemetry counts what survives the rulings, not what was removed.
      if (entry && partName) { mappedParts.add(partName); counts.mappedPrimitives++; if (color) counts.protectedPrimitives++ }
      else if (mismatch && partName) unmappedMultiSlot.add(partName)
      if (extra) { counts.extraParts++; counts.extraTriangles += triangles }
      counts.keptTriangles += triangles
      if (!clipped && SECTION_ROOTS.has(root.name)) counts.keptWholeTriangles += triangles
      bucket.geometries.push(geometry)
      // A kept component is not part of any cut face, so it never counts toward a cap.
      if (clipped && isClosedVolume(geometry)) {
        counts.cappedTriangles += triangles
        if (!caps.has(root.name)) caps.set(root.name, [])
        caps.get(root.name)!.push(geometry)
      } else if (clipped) counts.openSectionTriangles += triangles
    })
  }
  for (const root of source.children) {
    // The owner's Blender export carries the reference lower-intake geometry as its own
    // root (coordinate source of truth for the authored copy in LowerIntake.tsx). The
    // site draws that passage in code; building the GLB copy too would double-render it.
    if (root.name === 'PROPOSED_LOWER_INTAKE') { counts.skippedRoots = (counts.skippedRoots ?? 0) + 1; continue }
    ingest(root, false)
  }
  // The extras follow the main roots, so every main bucket keeps its place.
  if (extras) for (const root of extras.children) ingest(root, true)
  for (const name of Object.keys(PART_POLICY)) if (!parts.has(name)) throw new Error(`Ruled RL300 part absent from the CAD source: ${name}`)
  if (!linerFound) throw new Error(`Missing registered liner ${LINER_PART}`)
  const sections = [...caps].map(([name, geometries]) => {
    const geometry = mergeGeometries(geometries)
    if (!geometry) throw new Error(`Incompatible section geometry: ${name}`)
    return { name, geometry }
  })
  for (const [name, bucket] of buckets) {
    // A bucket can end up empty when every part in it was ruled away.
    if (!bucket.geometries.length) { bucket.material.dispose(); continue }
    const geometry = mergeGeometries(bucket.geometries)
    if (!geometry) throw new Error(`Incompatible CAD geometry: ${name}`)
    const mesh = new Mesh(geometry, bucket.material)
    mesh.name = name
    // The 78 mm gauge dials cast no shadow (one draw per bucket instead of two); the lens
    // below already has none.
    mesh.castShadow = bucket.root !== 'GAUGE_DIALS'; mesh.receiveShadow = true
    mesh.userData.sourceRoot = bucket.root
    if (bucket.material.transparent) {
      // The lens is nearly clear glass: it renders after the opaque equipment and, being
      // 96.6% transparent, must not throw a full shadow onto the dial face behind it
      // (the shadow pass ignores opacity). It still receives shadow.
      mesh.userData.lens = true
      mesh.renderOrder = 2
      mesh.castShadow = false
    }
    group.add(mesh)
    bucket.geometries.forEach(g => g.dispose())
  }
  counts.batches = group.children.length
  counts.materials = new Set(group.children.map(obj => (obj as Mesh).material)).size
  counts.mappedParts = mappedParts.size
  counts.unmappedMultiSlot = unmappedMultiSlot.size
  counts.v16Applied = !!v16 && counts.mappedPrimitives > 0
  return { group, sections, counts, parts: Object.fromEntries(parts), dispose() {
    group.children.forEach(obj => { const mesh = obj as Mesh; mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose() })
    sections.forEach(s => s.geometry.dispose())
  } }
}
