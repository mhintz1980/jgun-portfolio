import { Box3, Group, Material, Matrix4, Mesh, Object3D, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * Classifies the loaded GLB scene into rig roles by REAL node identity, then
 * consolidates the CAD export's mesh soup into a handful of draw calls.
 *
 * The two top-level assemblies in the JGun GLB (confirmed by the audit and
 * role-map.json) are:
 *   - `HANDLE ASSY, D.5AP-D1AP-rev1-1 <1>`  — air motor + smart-tool electronics
 *   - `D1-AP Gearbox Assy-rev2-1 <1>`       — planetary reduction stages
 *
 * Identity lives on NODES; mesh names are generic `meshN_mesh`. We therefore
 * match node names with tolerant patterns (GLTFLoader may dedupe/mangle
 * punctuation) and never hardcode mesh names. Gearbox stage membership is
 * derived from geometry (bbox center along the long axis) rather than from
 * guessed part numbers, so the split survives re-exports.
 *
 * Consolidation: the export carries ~9.7k one-primitive glTF meshes across 96
 * mesh defs, which GLTFLoader expands to ~13k THREE.Mesh objects — ~13k draw
 * calls per frame. That draw-call count (not triangle count, only ~494k drawn
 * tris) is what floors integrated GPUs to ~10 fps. Every mesh belongs to
 * exactly one rigid animation unit (handle assembly, gearbox stage 1, gearbox
 * stage 2, or the static remainder), so merging geometry per
 * (unit × material × ghost-status) into unit-local space is visually lossless
 * and collapses the scene to tens of draws. Role detection runs on the
 * original node tree BEFORE merging, so name/bbox-based identity is unaffected.
 */

// Node-name matchers tolerate the exporter's punctuation mangling: the GLB
// carries underscored names (e.g. `D1-AP_Gearbox_Assy-rev2-1_<1>`), so the
// separator class must include `_`, not just whitespace.
const HANDLE_RE = /HANDLE[\s_]*ASSY/i
const GEARBOX_RE = /GEARBOX[\s_]*ASSY/i
const HOUSING_RE = /(HOUSING|COVER|SHELL|CASE\b|CAP\b)/i

export interface WrenchRig {
  handleRoot: Object3D | null
  gearboxRoot: Object3D | null
  /** Gearbox input (handle) side — Stage 1 merged group: sun & planet cluster. */
  stage1: Object3D[]
  /** Gearbox output side — Stage 2 merged group: planet carrier & output drive. */
  stage2: Object3D[]
  /** All meshes in the model (post-consolidation). */
  meshes: Mesh[]
  /** Per-mesh material as loaded (post ghost-clone) — restored on mode switches. */
  originalMaterials: Map<Mesh, Material | Material[]>
  /** Cloned, transparent-capable materials on housing meshes for the ghost fade. */
  ghostMaterials: Map<Mesh, Material>
  /** Rest positions of every node the explosion animates. */
  basePositions: Map<Object3D, Vector3>
  /** World-space Z bounds of the whole model — sweep range for the CAD shader. */
  sweepMin: number
  sweepMax: number
  /** Model center offset so the hero group can recenter the wrench at the origin. */
  center: Vector3
}

function isUnderHousing(node: Object3D): boolean {
  let current: Object3D | null = node
  while (current) {
    if (HOUSING_RE.test(current.name)) return true
    current = current.parent
  }
  return false
}

export function buildWrenchRig(root: Object3D): WrenchRig {
  // useGLTF caches the parsed scene per URL and consolidation is destructive
  // (original mesh leaves are removed) — a remount must reuse the built rig.
  const cached = root.userData.wrenchRig as WrenchRig | undefined
  if (cached) return cached

  let handleRoot: Object3D | null = null
  let gearboxRoot: Object3D | null = null
  const meshes: Mesh[] = []

  root.traverse((node) => {
    if (!handleRoot && HANDLE_RE.test(node.name)) handleRoot = node
    if (!gearboxRoot && GEARBOX_RE.test(node.name)) gearboxRoot = node
    if ((node as Mesh).isMesh) meshes.push(node as Mesh)
  })

  // TS narrows closure-assigned lets back to their initializer; widen explicitly.
  const gearbox = gearboxRoot as Object3D | null
  const handle = handleRoot as Object3D | null

  // ---- Gearbox stage split: order direct children along the long (Z) axis.
  const stage1Nodes: Object3D[] = []
  const stage2Nodes: Object3D[] = []
  if (gearbox) {
    const measured = gearbox.children.map((child) => {
      const box = new Box3().setFromObject(child)
      return { child, z: box.isEmpty() ? 0 : (box.min.z + box.max.z) / 2 }
    })
    const sorted = [...measured].sort((a, b) => a.z - b.z)
    const medianZ = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)].z : 0
    // Handle sits on the -Z end; gearbox children nearer the handle are Stage 1.
    for (const entry of measured) {
      ;(entry.z < medianZ ? stage1Nodes : stage2Nodes).push(entry.child)
    }
  }

  // ---- Housing meshes: explicit *HOUSING* names, plus the gearbox's largest
  // child by bbox volume (the outer shell part-numbered P000245).
  const housingMeshSet = new Set<Mesh>()
  for (const mesh of meshes) {
    if (isUnderHousing(mesh)) housingMeshSet.add(mesh)
  }
  if (gearbox) {
    let largest: Object3D | null = null
    let largestVolume = 0
    for (const child of gearbox.children) {
      const box = new Box3().setFromObject(child)
      if (box.isEmpty()) continue
      const size = box.getSize(new Vector3())
      const volume = size.x * size.y * size.z
      if (volume > largestVolume) {
        largestVolume = volume
        largest = child
      }
    }
    if (largest) {
      largest.traverse((node) => {
        if ((node as Mesh).isMesh) housingMeshSet.add(node as Mesh)
      })
    }
  }

  // ---- Bounds for the shader sweep + recentering (original tree, rest pose).
  const bounds = new Box3().setFromObject(root)
  const center = bounds.isEmpty() ? new Vector3() : bounds.getCenter(new Vector3())

  // ---- Consolidation: merge meshes per (animation unit × material × ghost).
  root.updateMatrixWorld(true)

  const stage1Set = new Set(stage1Nodes)
  const stage2Set = new Set(stage2Nodes)

  const stage1Group = new Group()
  stage1Group.name = 'MERGED Stage1'
  const stage2Group = new Group()
  stage2Group.name = 'MERGED Stage2'
  const staticGroup = new Group()
  staticGroup.name = 'MERGED Static'
  if (gearbox) {
    gearbox.add(stage1Group)
    gearbox.add(stage2Group)
  }
  root.add(staticGroup)

  interface Unit {
    key: string
    /** Parent of the merged mesh. */
    host: Object3D
    /** Space geometry is baked into — the host's parent frame stays animatable. */
    frame: Object3D
  }
  const unitOf = (mesh: Mesh): Unit => {
    let current: Object3D | null = mesh
    while (current) {
      if (handle && current === handle) return { key: 'handle', host: handle, frame: handle }
      if (gearbox && stage1Set.has(current))
        return { key: 'stage1', host: stage1Group, frame: gearbox }
      if (gearbox && stage2Set.has(current))
        return { key: 'stage2', host: stage2Group, frame: gearbox }
      current = current.parent
    }
    return { key: 'static', host: staticGroup, frame: root }
  }

  interface Bucket {
    unit: Unit
    material: Material
    ghost: boolean
    sources: Mesh[]
  }
  const buckets = new Map<string, Bucket>()
  const leftovers: Mesh[] = [] // array-material meshes (none expected from GLTFLoader)
  for (const mesh of meshes) {
    if (Array.isArray(mesh.material)) {
      leftovers.push(mesh)
      continue
    }
    const unit = unitOf(mesh)
    const ghost = housingMeshSet.has(mesh)
    const key = `${unit.key}|${mesh.material.uuid}|${ghost ? 'g' : 's'}`
    const bucket = buckets.get(key)
    if (bucket) bucket.sources.push(mesh)
    else buckets.set(key, { unit, material: mesh.material, ghost, sources: [mesh] })
  }

  const frameInverses = new Map<Object3D, Matrix4>()
  const inverseFor = (frame: Object3D): Matrix4 => {
    let inv = frameInverses.get(frame)
    if (!inv) {
      inv = new Matrix4().copy(frame.matrixWorld).invert()
      frameInverses.set(frame, inv)
    }
    return inv
  }

  const finalMeshes: Mesh[] = [...leftovers]
  const ghostMaterials = new Map<Mesh, Material>()
  const consumed = new Set<Mesh>()
  const bake = new Matrix4()

  for (const bucket of buckets.values()) {
    const inv = inverseFor(bucket.unit.frame)
    const geometries = bucket.sources.map((source) => {
      const geometry = source.geometry.clone()
      geometry.applyMatrix4(bake.multiplyMatrices(inv, source.matrixWorld))
      return geometry
    })
    // mergeGeometries returns null on attribute mismatch — every primitive in
    // this export is indexed POSITION+NORMAL, so a miss means leave originals.
    const merged =
      geometries.length === 1 ? geometries[0] : (mergeGeometries(geometries, false) as
        | ReturnType<typeof mergeGeometries>
        | null)
    if (!merged) {
      for (const geometry of geometries) geometry.dispose()
      leftovers.push(...bucket.sources)
      finalMeshes.push(...bucket.sources)
      continue
    }
    // applyMatrix4 runs normals through the normal matrix without renormalizing.
    merged.normalizeNormals()
    if (geometries.length > 1) for (const geometry of geometries) geometry.dispose()

    let material = bucket.material
    if (bucket.ghost) {
      // Clone so the fade never bleeds into shared source materials.
      material = material.clone()
      material.transparent = true
    }
    const mesh = new Mesh(merged, material)
    mesh.frustumCulled = true
    bucket.unit.host.add(mesh)
    finalMeshes.push(mesh)
    if (bucket.ghost) ghostMaterials.set(mesh, material)
    for (const source of bucket.sources) consumed.add(source)
  }

  // Drop consumed originals before first render so their buffers never reach
  // the GPU. Named assembly/occurrence nodes stay — identity skeleton intact.
  for (const mesh of consumed) mesh.removeFromParent()

  // Un-merged leftovers keep the pre-consolidation ghost behavior.
  for (const mesh of leftovers) {
    if (!housingMeshSet.has(mesh) || Array.isArray(mesh.material)) continue
    const clone = mesh.material.clone()
    clone.transparent = true
    mesh.material = clone
    ghostMaterials.set(mesh, clone)
  }

  // Record originals AFTER ghost cloning so mode restores keep fade capability.
  const originalMaterials = new Map<Mesh, Material | Material[]>()
  for (const mesh of finalMeshes) originalMaterials.set(mesh, mesh.material)

  // ---- Explosion rest positions (merged stage groups sit at gearbox origin).
  const stage1 = gearbox ? [stage1Group as Object3D] : []
  const stage2 = gearbox ? [stage2Group as Object3D] : []
  const basePositions = new Map<Object3D, Vector3>()
  if (handle) basePositions.set(handle, handle.position.clone())
  for (const node of [...stage1, ...stage2]) basePositions.set(node, node.position.clone())

  const rig: WrenchRig = {
    handleRoot: handle,
    gearboxRoot: gearbox,
    stage1,
    stage2,
    meshes: finalMeshes,
    originalMaterials,
    ghostMaterials,
    basePositions,
    sweepMin: bounds.isEmpty() ? -0.25 : bounds.min.z,
    sweepMax: bounds.isEmpty() ? 0.05 : bounds.max.z,
    center,
  }
  root.userData.wrenchRig = rig
  return rig
}
