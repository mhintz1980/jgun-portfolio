import {
  BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh,
  MeshStandardMaterial, Object3D, Plane,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DEEPEST_CUT } from './shot'

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
  // A kept component is equipment, not shell: repainting it blue is what made it unreadable.
  if (policy === 'keep') return null
  // A named part rules over its root here too: the exhaust stack is chrome even inside a shell root.
  if (part === EXHAUST_PIPE) return CHROME
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

export function prepareModel(source: Group, plane: Plane) {
  source.updateMatrixWorld(true)
  const group = new Group()
  group.name = 'RL300_PRESENTATION'
  const buckets = new Map<string, { geometries: BufferGeometry[]; material: MeshStandardMaterial; root: string }>()
  const caps = new Map<string, BufferGeometry[]>()
  const counts = { sourceTriangles: 0, keptTriangles: 0, linerTriangles: 0, sourceMeshes: 0, batches: 0, cappedTriangles: 0, openSectionTriangles: 0, keptWholeTriangles: 0, removedTriangles: 0 }
  /** Measured evidence for every part the owner named, so the ruling is verifiable. */
  const parts = new Map<string, PartRecord>()
  let linerFound = false
  for (const root of source.children) {
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
      while (p && p !== root) {
        if (p.name === LINER_PART) liner = true
        if (!pipe) pipe = p.name === EXHAUST_PIPE || p.name.startsWith(`${EXHAUST_PIPE}_`)
        if (/-RES-/.test(p.name)) reservoir = true
        if (/-SIF-/.test(p.name)) insulation = true
        if (!policy) { const found = policyFor(p.name); if (found) { policy = found.policy; named = found.name } }
        p = p.parent
      }
      if (liner) { linerFound = true; counts.linerTriangles += triangles; return }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      if (mats.length !== 1) throw new Error('RL300 loader must expand each CAD primitive before batching')
      const original = mats[0] as MeshStandardMaterial
      if (original.name === 'MSP_AIRWAY_VOLUME') return // CAD helper, not a surface
      const resolved: SectionPolicy = policy ?? (SECTION_ROOTS.has(root.name) ? 'section' : 'keep')
      // A named part rules over its root: that is how equipment gets hidden or cut.
      const clipped = policy ? policy !== 'keep' : SECTION_ROOTS.has(root.name)
      const color = finishFor(root.name, original.name, policy ?? 'section', pipe ? EXHAUST_PIPE : undefined, reservoir, insulation)
      const key = `${root.name}/${original.name}/${clipped ? 'cut' : 'whole'}/${color ?? 'cad'}`
      let bucket = buckets.get(key)
      if (!bucket) {
        const mat = original.clone()
        mat.name = key
        if (color) mat.color.set(color)
        mat.transparent = false; mat.opacity = 1; mat.depthWrite = true
        mat.side = DoubleSide
        // The chrome ruling carries the stainless tip's own clamped .28/.8, so the whole
        // stack reads as one polished pipe; repainted paint stays satin like the approved blue.
        mat.roughness = color === CHROME ? .28 : original.name === 'MSP_YELLOW_PAINT' ? .34 : Math.max(.28, original.roughness)
        mat.metalness = color === CHROME ? .8 : original.name === 'MSP_YELLOW_PAINT' ? .32 : Math.min(.8, original.metalness)
        mat.envMapIntensity = .65
        if (clipped) { mat.clippingPlanes = [plane]; mat.clipShadows = true }
        bucket = { geometries: [], material: mat, root: root.name }
        buckets.set(key, bucket)
      }
      const geometry = bakeGeometry(obj)
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
    mesh.castShadow = true; mesh.receiveShadow = true
    mesh.userData.sourceRoot = bucket.root
    group.add(mesh)
    bucket.geometries.forEach(g => g.dispose())
  }
  counts.batches = group.children.length
  return { group, sections, counts, parts: Object.fromEntries(parts), dispose() {
    group.children.forEach(obj => { const mesh = obj as Mesh; mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose() })
    sections.forEach(s => s.geometry.dispose())
  } }
}
