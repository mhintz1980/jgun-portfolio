import { Box3, Material, Mesh, Object3D, Vector3 } from 'three'

/**
 * Classifies the loaded GLB scene into rig roles by REAL node identity.
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
 */

const HANDLE_RE = /HANDLE\s*ASSY/i
const GEARBOX_RE = /GEARBOX\s*ASSY/i
const HOUSING_RE = /(HOUSING|COVER|SHELL|CASE\b|CAP\b)/i

export interface WrenchRig {
  handleRoot: Object3D | null
  gearboxRoot: Object3D | null
  /** Gearbox children on the input (handle) side — Stage 1: sun & planet cluster. */
  stage1: Object3D[]
  /** Gearbox children on the output side — Stage 2: planet carrier & output drive. */
  stage2: Object3D[]
  /** All meshes in the model. */
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
  let handleRoot: Object3D | null = null
  let gearboxRoot: Object3D | null = null
  const meshes: Mesh[] = []

  root.traverse((node) => {
    if (!handleRoot && HANDLE_RE.test(node.name)) handleRoot = node
    if (!gearboxRoot && GEARBOX_RE.test(node.name)) gearboxRoot = node
    if ((node as Mesh).isMesh) {
      const mesh = node as Mesh
      mesh.frustumCulled = true
      meshes.push(mesh)
    }
  })

  // TS narrows closure-assigned lets back to their initializer; widen explicitly.
  const gearbox = gearboxRoot as Object3D | null
  const handle = handleRoot as Object3D | null

  // ---- Gearbox stage split: order direct children along the long (Z) axis.
  const stage1: Object3D[] = []
  const stage2: Object3D[] = []
  if (gearbox) {
    const measured = gearbox.children.map((child) => {
      const box = new Box3().setFromObject(child)
      return { child, z: box.isEmpty() ? 0 : (box.min.z + box.max.z) / 2 }
    })
    const sorted = [...measured].sort((a, b) => a.z - b.z)
    const medianZ = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)].z : 0
    // Handle sits on the -Z end; gearbox children nearer the handle are Stage 1.
    for (const entry of measured) {
      ;(entry.z < medianZ ? stage1 : stage2).push(entry.child)
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

  // ---- Ghost materials: clone so the fade never bleeds into the 52 shared
  // source materials used elsewhere in the assembly.
  const ghostMaterials = new Map<Mesh, Material>()
  for (const mesh of housingMeshSet) {
    if (Array.isArray(mesh.material)) continue
    const clone = mesh.material.clone()
    clone.transparent = true
    mesh.material = clone
    ghostMaterials.set(mesh, clone)
  }

  // Record originals AFTER ghost cloning so mode restores keep fade capability.
  const originalMaterials = new Map<Mesh, Material | Material[]>()
  for (const mesh of meshes) originalMaterials.set(mesh, mesh.material)

  // ---- Explosion rest positions.
  const basePositions = new Map<Object3D, Vector3>()
  if (handle) basePositions.set(handle, handle.position.clone())
  for (const node of [...stage1, ...stage2]) basePositions.set(node, node.position.clone())

  // ---- Bounds for the shader sweep + recentering.
  const bounds = new Box3().setFromObject(root)
  const center = bounds.isEmpty() ? new Vector3() : bounds.getCenter(new Vector3())

  return {
    handleRoot: handle,
    gearboxRoot: gearbox,
    stage1,
    stage2,
    meshes,
    originalMaterials,
    ghostMaterials,
    basePositions,
    sweepMin: bounds.isEmpty() ? -0.25 : bounds.min.z,
    sweepMax: bounds.isEmpty() ? 0.05 : bounds.max.z,
    center,
  }
}
