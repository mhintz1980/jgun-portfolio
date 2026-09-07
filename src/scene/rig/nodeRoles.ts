import { Box3, BufferAttribute, BufferGeometry, CylinderGeometry, Group, Material, Matrix4, Mesh, Object3D, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { StageId } from '../../data/caseStudies'
import { STAGE_IDS } from '../../data/caseStudies'
import { materialRoleFor, roleMaterial, type MaterialRole } from './materials'
import { buildLcdCluster, type LcdClusterParts } from './lcdCluster'

/**
 * Classifies the loaded GLB scene into rig roles by REAL node identity, then
 * consolidates the CAD export's mesh soup into a handful of draw calls.
 *
 * The two top-level assemblies in the JGun GLB (confirmed by the audit and
 * role-map.json) are:
 *   - `HANDLE ASSY, D.5AP-D1AP-rev1-1 <1>`  — air motor + smart-tool electronics
 *   - `D1-AP Gearbox Assy-rev2-1 <1>`       — planetary reduction train
 *
 * Identity lives on NODES; mesh names are generic `meshN_mesh`. Node names are
 * matched with tolerant patterns (GLTFLoader may dedupe/mangle punctuation) —
 * the separator class must include `_`, not just whitespace.
 *
 * Gearbox roles come from the D1-AP 2-speed part-number table (Mark Hintz,
 * 2026-08-23): P-prefix = manufactured part, K = commercial part (bearings,
 * rings, screws, bushings), A = sub-assembly. Five planetary stages, each an
 * A-node cage assembly holding a cage part (the carrier, with integral sun —
 * except the final-stage cage P001849, which carries an internal spline
 * locking it to the output shaft) plus a ring of planet occurrences (four per
 * stage, five in stage 4). A000881 is the two-speed clutch: static structure
 * (intermediate housing P000420, input shaft P001835), the sliding fork train
 * (shifter fork P000724, shifter cam P000297), and the ring switch assembly
 * (ring switch P003068, 3× pins P000464, 3× ball plungers K000156). The
 * K000004 thrust bearing ring directly behind the A000606 cage is its own
 * unit too (pass 3, 2026-08-25 — it was the gearbox's last untagged part)
 * and extracts between A000606 and stage 2. The output
 * spindle cluster (P000095 shaft, P000207/K000001 bushings, K000074 retaining
 * ring) is the only group that exits the +Z snout; everything else extracts
 * rearward (see EXPLODE_OFFSETS in caseStudies.ts for the measured rationale).
 *
 * Consolidation: the export carries ~9.7k one-primitive glTF meshes across 96
 * mesh defs, which GLTFLoader expands to ~13k THREE.Mesh objects — ~13k draw
 * calls per frame. Every mesh belongs to exactly one rigid animation unit
 * (handle, output spindle, clutch halves, five stage carriers, each planet,
 * or the static remainder), so merging geometry per
 * (unit × PBR role × ghost-status) into unit-local space is visually lossless
 * and collapses the scene to tens of draws. Role detection runs on the
 * original node tree BEFORE merging, so name-based identity is unaffected.
 */

const HANDLE_RE = /HANDLE[\s_]*ASSY/i
const GEARBOX_RE = /GEARBOX[\s_]*ASSY/i

// D1-AP part-number roles (substring matches survive GLTFLoader mangling —
// part numbers carry no spaces). Names at runtime look like
// `occurrence_of_P000247-1` / `P000247-1` / `A000591-1__1_`.
const HOUSING_PART_RE = /P000245/i
const OUTPUT_PART_RE = /(P000095|P000207|K000001|K000074)/i
/** Rear bearing ring (K000004) — thrust support directly behind the A000606
 * cage (rest z ≈ [−0.058, −0.051], ⌀0.058 × 7 mm). Extracts as its own unit
 * between A000606 and stage 2 in the rear ladder. */
const BEARING_RE = /K000004/i
/** Ring switch assembly (P003068 knurled ring, 3× P000464 pins, 3× K000156
 * ball-nose plungers) — travels +Z (away from handle) with a 120° cam rotation. */
const RING_SWITCH_RE = /(P003068|P000464|K000156)/i
/** Sliding shift fork train (fork P000724, cam P000297) — slides −Z without rotation. */
const CLUTCH_SLIDING_RE = /(P000724|P000297)/i
const CLUTCH_STATIC_RE = /(A000881|P000420|P001835)/i
/** Rear handle LCD + buttons (CR-5 emissive materials). */
const LCD_SCREEN_RE = /P002115/i
const LCD_BUTTONS_RE = /(P002123|P002124|P002125)/i
const LCD_HOUSING_RE = /P001924/i
/** Handle fasteners (2026-09-01 Fine re-export): 9 McMaster black-oxide
 * socket/button-head screws — 91251A148, 96006A253, 91251A344, 90910A815 —
 * direct children of HANDLE ASSY. Own unit so they get the blackOxideSteel
 * default (the handle unit default is anodized aluminum); the merged bucket
 * hosts at a screw node inside HANDLE ASSY, so it rides with the handle
 * explosion rigidly. Tagging is by NODE name — mesh names are generic. */
const FASTENER_RE = /91251A|96006A|90910A/i
/** Gearbox radial bolts (owner spec 2026-09-02, CAD-true from the Fine
 * re-export JGUN-1.glb): four 90910A815 button-head Torx screws on a 90° bolt
 * circle concentric with the drivetrain — node origins at az
 * 0°/90°/180°/−90°, r 32.3 mm, z −69.6 mm, shank axes radial. They are
 * TOP-LEVEL nodes under the Default root; the handle's two rear 90910A815
 * screws share the name and are excluded by their HANDLE ASSY ancestry (they
 * stay 'fastener'). Each bolt gets its OWN unit so it can pop along its own
 * radial direction; the groups are children of the clutch-static group so
 * they ride its rear extraction. */
const GB_FASTENER_RE = /90910A815/i
/** Onshape occurrence wrappers (`occurrence of X` → sanitized
 * `occurrence_of_X`) share the part node's name — exclude them from unit
 * allocation so the actual part node owns the tag. */
const GB_OCCURRENCE_RE = /^occurrence[\s_]*of/i

interface StageDef {
  /** Cage sub-assembly node — fallback carrier bucket for unlisted hardware. */
  assembly: RegExp
  /** Cage (carrier) part. */
  cage: RegExp
  /** Planet part. */
  planet: RegExp
  /** Only when the planet part is shared between stages (P000247 lives in
   *  both stage 1 and stage 2) — disambiguated by the owning assembly. */
  planetAssembly?: RegExp
}

const STAGE_DEFS: Record<StageId, StageDef> = {
  stage1: { assembly: /A000591/i, cage: /P001836/i, planet: /P000247/i, planetAssembly: /A000591/i },
  stage2: { assembly: /A000592/i, cage: /P001837/i, planet: /P000247/i, planetAssembly: /A000592/i },
  stage3: { assembly: /A000860/i, cage: /P003045/i, planet: /P000069/i },
  stage4: { assembly: /A000861/i, cage: /P003047/i, planet: /P003046/i },
  stage5: { assembly: /A000606/i, cage: /P001849/i, planet: /P000248/i },
}

export interface StageNodes {
  /** Merged cage (carrier) group — extracts along Z and rotates about the
   *  gear-train axis at its stage ratio. Null when the stage isn't found. */
  carrier: Object3D | null
  /** Merged per-planet groups — children of the carrier; each counter-rotates
   *  about its own pin axis. Empty when the stage isn't found. */
  planets: Object3D[]
}

export interface WrenchRig {
  handleRoot: Object3D | null
  gearboxRoot: Object3D | null
  /** Static outer shell (P000245) — ghosts, never explodes. */
  housing: Object3D | null
  /** Output spindle cluster — the only unit that exits the +Z snout. */
  outputShaft: Object3D | null
  /** K000004 thrust bearing ring behind the A000606 cage — extracts between
   *  A000606 (stage 5) and stage 2 in the rear ladder (pass 3). */
  bearing: Object3D | null
  /** Two-speed clutch: static structure vs. sliding shift train (fork /
   *  cam). The ring switch assembly (P003068 + 3× P000464 pins + 3× K000156
   *  ball plungers) is split out into its own group because it travels +Z with
   *  120° cam rotation while the fork train goes −Z. */
  clutch: { static: Object3D | null; sliding: Object3D | null; ringSwitch: Object3D | null }
  stages: Record<StageId, StageNodes>
  /** Gearbox radial bolts (90910A815): one group per bolt (child of the
   * clutch-static group) + its outward radial direction for the pop. */
  gbFasteners: { group: Object3D; dir: Vector3 }[]
  /** JG-025 rear LCD cluster dressing — red bezel ring, data readout decal,
   * button symbol decals, and the per-button merged meshes (probe surface). */
  lcdCluster: LcdClusterParts | null
  /** All meshes in the model (post-consolidation). */
  meshes: Mesh[]
  /** Per-mesh material as loaded (post ghost-clone) — restored on mode switches. */
  originalMaterials: Map<Mesh, Material | Material[]>
  /** Cloned, transparent-capable materials on housing meshes for the ghost fade. */
  ghostMaterials: Map<Mesh, Material>
  /** Rest positions of every node the explosion animates. */
  basePositions: Map<Object3D, Vector3>
  /** Model-space (GLTF scene frame) Z bounds of the whole model — sweep range
   *  for the CAD shader; shifted into the recentered hero frame at the call site. */
  sweepMin: number
  sweepMax: number
  /** Model center offset so the hero group can recenter the wrench at the origin. */
  center: Vector3
}


function hasAncestorMatching(node: Object3D, re: RegExp): boolean {
  let current = node.parent
  while (current) {
    if (re.test(current.name)) return true
    current = current.parent
  }
  return false
}

/**
 * The CAD export carries no UVs, so the ring switch's knurled-OD normal map
 * has nothing to sample (JG-029). Synthesize cylindrical UVs in the unit bake
 * frame (gear axis = local Z): u wraps the circumference, v spans the axial
 * height. The knurl texture repeats an integer number of times in u, so the
 * θ = ±π seam is continuous; the OD mask in the material keeps end faces
 * smooth.
 */
function attachCylindricalUvs(geometry: BufferGeometry): void {
  geometry.computeBoundingBox()
  const bb = geometry.boundingBox
  if (!bb) return
  const pos = geometry.attributes.position as BufferAttribute
  const uvs = new Float32Array(pos.count * 2)
  const zSpan = Math.max(bb.max.z - bb.min.z, 1e-6)
  for (let i = 0; i < pos.count; i += 1) {
    uvs[i * 2] = Math.atan2(pos.getY(i), pos.getX(i)) / (Math.PI * 2) + 0.5
    uvs[i * 2 + 1] = (pos.getZ(i) - bb.min.z) / zSpan
  }
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
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

  // ---- Part-number tagging: nearest tagged ancestor owns each mesh.
  // Occurrence wrappers and their part-leaf share a key: the wrapper is
  // traversed first and allocates it, the leaf reuses it via the ancestor walk.
  const unitOfNode = new Map<Object3D, string>()
  const stagePlanets = new Map<StageId, Object3D[]>()
  /** gb-fastener leaves in tagging order — index i owns key `gb-fastener-${i}`. */
  const gbFastenerNodes: Object3D[] = []
  /** lcd-button part nodes in tagging order — index i owns key `lcd-button-${i}`. */
  const lcdButtonNodes: Object3D[] = []
  for (const id of STAGE_IDS) stagePlanets.set(id, [])

  if (gearbox) {
    root.traverse((node) => {
      const name = node.name
      for (const [id, def] of Object.entries(STAGE_DEFS) as [StageId, StageDef][]) {
        if (def.planet.test(name)) {
          if (def.planetAssembly && !hasAncestorMatching(node, def.planetAssembly)) continue
          // Reuse the wrapper's planet index if an ancestor already tagged it.
          let owner: string | null = null
          let current = node.parent
          while (current) {
            const key = unitOfNode.get(current)
            if (key?.startsWith(`${id}-planet`)) {
              owner = key
              break
            }
            current = current.parent
          }
          const key = owner ?? `${id}-planet-${stagePlanets.get(id)!.length}`
          unitOfNode.set(node, key)
          if (!owner) stagePlanets.get(id)!.push(node)
          return
        }
      }
      if (HOUSING_PART_RE.test(name)) {
        unitOfNode.set(node, 'housing')
        return
      }
      if (OUTPUT_PART_RE.test(name)) {
        unitOfNode.set(node, 'output')
        return
      }
      if (BEARING_RE.test(name)) {
        unitOfNode.set(node, 'bearing')
        return
      }
      if (RING_SWITCH_RE.test(name)) {
        unitOfNode.set(node, 'ring-switch')
        return
      }
      if (CLUTCH_SLIDING_RE.test(name)) {
        unitOfNode.set(node, 'clutch-sliding')
        return
      }
      if (CLUTCH_STATIC_RE.test(name)) {
        unitOfNode.set(node, 'clutch-static')
        return
      }
      if (LCD_SCREEN_RE.test(name)) {
        unitOfNode.set(node, 'lcd-screen')
        return
      }
      if (LCD_BUTTONS_RE.test(name)) {
        // JG-025: each button is its own unit. A shared 'lcd-buttons' bucket
        // merged all three parts into the first part's bake frame, cancelling
        // the CAD's ~9.9 mm occurrence offsets — the buttons rendered stacked
        // into one blob. Per-part units bake each into its own node so each
        // rides its own placement. Skip `occurrence_of_*` wrappers so exactly
        // the part node allocates (gb-fastener pattern).
        if (!GB_OCCURRENCE_RE.test(name)) {
          unitOfNode.set(node, `lcd-button-${lcdButtonNodes.length}`)
          lcdButtonNodes.push(node)
        }
        return
      }
      if (LCD_HOUSING_RE.test(name)) {
        unitOfNode.set(node, 'lcd-housing')
        return
      }
      // Gearbox bolts BEFORE the handle-fastener rule: 90910A815 names exist
      // in both populations, so the quartet is picked out by its lack of a
      // HANDLE ASSY ancestor; the two rear screws fall through to 'fastener'.
      // GLTFLoader expands the bolt's multi-primitive mesh def into a Group
      // of per-primitive Meshes, so tag the bolt GROUP itself (its prim
      // meshes resolve to it via the ancestor walk); skip the identically
      // named `occurrence_of_*` wrapper above it so each bolt allocates
      // exactly one unit.
      if (GB_FASTENER_RE.test(name) && !hasAncestorMatching(node, HANDLE_RE)) {
        if (!GB_OCCURRENCE_RE.test(name)) {
          unitOfNode.set(node, `gb-fastener-${gbFastenerNodes.length}`)
          gbFastenerNodes.push(node)
        }
        return
      }
      if (FASTENER_RE.test(name)) {
        unitOfNode.set(node, 'fastener')
        return
      }
      for (const [id, def] of Object.entries(STAGE_DEFS) as [StageId, StageDef][]) {
        if (def.cage.test(name) || def.assembly.test(name)) {
          unitOfNode.set(node, `${id}-carrier`)
          return
        }
      }
    })
  }
  if (handle) unitOfNode.set(handle, 'handle')

  // ---- Housing meshes: only the outer P000245 shell ghosts during CH.02.
  // All other assemblies (clutch, ring switch, LCD cluster, stages, output, handle)
  // must remain 100% opaque.
  const housingMeshSet = new Set<Mesh>()
  for (const mesh of meshes) {
    let current: Object3D | null = mesh
    while (current) {
      const key = unitOfNode.get(current)
      if (key) {
        if (key === 'housing') housingMeshSet.add(mesh)
        break
      }
      current = current.parent
    }
  }

  // ---- Bounds for the shader sweep + recentering (original tree, rest pose).
  const bounds = new Box3().setFromObject(root)
  const center = bounds.isEmpty() ? new Vector3() : bounds.getCenter(new Vector3())

  // ---- Animation units. Each animatable node owns a merged group; geometry
  // is baked into the GROUP's own frame, so translating/rotating the group
  // moves its parts rigidly about the pivot the group sits at. Carriers pivot
  // on the gear-train axis (mean planet-pin center); planet groups hang under
  // their carrier at their pin so the carrier rotation revolves them and their
  // own rotation.z counter-spins them on the pin.
  root.updateMatrixWorld(true)

  const stages: Record<StageId, StageNodes> = {
    stage1: { carrier: null, planets: [] },
    stage2: { carrier: null, planets: [] },
    stage3: { carrier: null, planets: [] },
    stage4: { carrier: null, planets: [] },
    stage5: { carrier: null, planets: [] },
  }
  let housingGroup: Group | null = null
  let outputGroup: Group | null = null
  let bearingGroup: Group | null = null
  let clutchStaticGroup: Group | null = null
  let clutchSlidingGroup: Group | null = null
  let ringSwitchGroup: Group | null = null

  if (gearbox) {
    const gearboxInverse = new Matrix4().copy(gearbox.matrixWorld).invert()
    const toGearboxLocal = (world: Vector3): Vector3 => world.clone().applyMatrix4(gearboxInverse)

    const makeUnit = (name: string): Group => {
      const group = new Group()
      group.name = name
      gearbox.add(group)
      return group
    }

    housingGroup = makeUnit('MERGED Housing (P000245)')
    outputGroup = makeUnit('MERGED Output Spindle')
    bearingGroup = makeUnit('MERGED Bearing Ring (K000004)')
    clutchStaticGroup = makeUnit('MERGED Clutch Static')
    clutchSlidingGroup = makeUnit('MERGED Clutch Sliding')
    ringSwitchGroup = makeUnit('MERGED Ring Switch (P003068)')

    for (const id of STAGE_IDS) {
      const planetNodes = stagePlanets.get(id)!
      // Carrier pivot = mean planet-pin center (the orbital axis proxy) in
      // gearbox-local XY; ring symmetry makes the mean exact.
      const pivot = new Vector3()
      for (const node of planetNodes) {
        const box = new Box3().setFromObject(node)
        if (!box.isEmpty()) pivot.add(toGearboxLocal(box.getCenter(new Vector3())))
      }
      if (planetNodes.length > 0) pivot.multiplyScalar(1 / planetNodes.length)

      const carrier = makeUnit(`MERGED ${id} Carrier`)
      carrier.position.set(pivot.x, pivot.y, 0)
      stages[id].carrier = carrier
      for (let i = 0; i < planetNodes.length; i++) {
        const box = new Box3().setFromObject(planetNodes[i])
        const pin = box.isEmpty() ? new Vector3() : toGearboxLocal(box.getCenter(new Vector3()))
        const planet = new Group()
        planet.name = `MERGED ${id} Planet ${i + 1}`
        planet.position.set(pin.x - pivot.x, pin.y - pivot.y, 0)
        carrier.add(planet)
        stages[id].planets.push(planet)
      }
    }
    // Groups were positioned — refresh world matrices before bake inverses.
    root.updateMatrixWorld(true)
  }

  const groupsByKey = new Map<string, Group>()
  /** Gearbox radial bolts (90910A815): one group per bolt, parented to the
   * clutch-static unit (they thread into the clutch housing) so the rear
   * extraction carries them; each group pops along its own radial direction
   * (dir from the bolt's world azimuth) on the explode's leading edge —
   * driven in TorqueWrenchHero's applyExplosion. */
  const gbFasteners: { group: Group; dir: Vector3 }[] = []
  if (gearbox) {
    groupsByKey.set('housing', housingGroup!)
    groupsByKey.set('output', outputGroup!)
    groupsByKey.set('bearing', bearingGroup!)
    groupsByKey.set('clutch-static', clutchStaticGroup!)
    groupsByKey.set('clutch-sliding', clutchSlidingGroup!)
    groupsByKey.set('ring-switch', ringSwitchGroup!)
    for (const id of STAGE_IDS) {
      const key = `${id}-carrier`
      if (stages[id].carrier) groupsByKey.set(key, stages[id].carrier as Group)
      stages[id].planets.forEach((planet, i) => groupsByKey.set(`${id}-planet-${i}`, planet as Group))
    }
    for (const [i, node] of gbFastenerNodes.entries()) {
      const wp = node.getWorldPosition(new Vector3())
      const dir = new Vector3(wp.x, wp.y, 0).normalize()
      const group = new Group()
      group.name = `MERGED GB Fastener ${i + 1} (90910A815)`
      clutchStaticGroup!.add(group)
      groupsByKey.set(`gb-fastener-${i}`, group)
      gbFasteners.push({ group, dir })
    }
  }

  const staticGroup = new Group()
  staticGroup.name = 'MERGED Static'
  root.add(staticGroup)

  interface Unit {
    key: string
    /** Merged-mesh parent AND bake frame — animating it moves its parts. */
    host: Object3D
  }
  const unitOf = (mesh: Mesh): Unit => {
    let current: Object3D | null = mesh
    while (current) {
      const key = unitOfNode.get(current)
      if (key) {
        const group = groupsByKey.get(key)
        if (group) return { key, host: group }
        // 'handle' — the assembly node itself is the unit.
        return { key, host: current }
      }
      current = current.parent
    }
    return { key: 'static', host: staticGroup }
  }

  // ---- Consolidation: merge meshes per (animation unit × PBR role × ghost).
  // The photoreal role replaces the CAD placeholder material as the bucket
  // identity (Mark review 2026-08-24 — see rig/materials.ts), which also
  // merges more aggressively: one draw per part family instead of per
  // original CAD material.
  interface Bucket {
    unit: Unit
    role: MaterialRole
    material: Material
    ghost: boolean
    sources: Mesh[]
  }
  const buckets = new Map<string, Bucket>()
  const leftovers: Mesh[] = // array-material meshes (none expected from GLTFLoader)
    []
  for (const mesh of meshes) {
    if (Array.isArray(mesh.material)) {
      leftovers.push(mesh)
      continue
    }
    const unit = unitOf(mesh)
    const ghost = unit.key === 'housing' && housingMeshSet.has(mesh)
    // Resolve nearest non-generic node name for ROLE_OVERRIDES matching.
    // The suffix variant matters: multi-primitive CAD parts expand to prim
    // meshes named after the mesh def, and GLTFLoader uniquifies duplicates
    // (`mesh2534_mesh`, `mesh2534_mesh_1`, …) — treating the suffixed ones as
    // identity stopped the walk at prim ≥ 1 and only prim-0 of each part ever
    // matched its override (JG-029).
    let nodeName = mesh.name
    let curr: Object3D | null = mesh
    while (curr) {
      if (curr.name && !/^mesh\d+_mesh(_\d+)?$/i.test(curr.name)) {
        nodeName = curr.name
        break
      }
      curr = curr.parent
    }
    const role = materialRoleFor(unit.key, nodeName)
    const key = `${unit.key}|${role}|${ghost ? 'g' : 's'}`
    const bucket = buckets.get(key)
    if (bucket) bucket.sources.push(mesh)
    else buckets.set(key, { unit, role, material: roleMaterial(role), ghost, sources: [mesh] })
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
    const inv = inverseFor(bucket.unit.host)
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
    if (bucket.unit.key === 'ring-switch' && bucket.role === 'ringSwitch') attachCylindricalUvs(merged)
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

  // ---- P000420 OSHA Speed Indicator Painted Grooves (2026-08-25):
  // Annular painted bands in the physical groove channels of P000420 (clutch housing):
  // - Upper groove (Red #C8102E, near handle): centered at z = -0.10715 m, width = 1.5 mm, r = 31.70 mm
  // - Lower groove (Blue #005DAA, near gearbox): centered at z = -0.08645 m, width = 1.5 mm, r = 31.70 mm
  // Parented to clutchStaticGroup so they move with P000420 during explosion and are
  // dynamically revealed/covered as the ring switch (P003068) shifts +Z.
  if (clutchStaticGroup) {
    const makeGroove = (zCenter: number, role: 'grooveRed' | 'grooveBlue', name: string): Mesh => {
      const geom = new CylinderGeometry(0.03170, 0.03170, 0.0015, 64, 1, true)
      geom.rotateX(Math.PI / 2)
      geom.translate(0, 0, zCenter)
      const mesh = new Mesh(geom, roleMaterial(role))
      mesh.name = name
      mesh.frustumCulled = true
      clutchStaticGroup!.add(mesh)
      finalMeshes.push(mesh)
      return mesh
    }
    makeGroove(-0.10715, 'grooveRed', 'P000420 Speed Indicator (Red)')
    makeGroove(-0.08645, 'grooveBlue', 'P000420 Speed Indicator (Blue)')
  }

  // ---- JG-025: rear LCD cluster dressing. Measured off the consolidated
  // screen/button meshes in their part-node local frames (rest pose, world
  // matrices refreshed above): a glossy red bezel ring + white-on-dark data
  // readout around/on the P002115 screen face, and dark ▲/⏎/▼ symbol decals
  // on the P00212x button caps. Everything parents to the part nodes so it
  // rides the handle explosion rigidly, registers into finalMeshes for the
  // material-mode switcher and the CH.04 dissolve, and never ghosts.
  const lcdCluster = buildLcdCluster(root, finalMeshes)

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

  // ---- Explosion rest positions (unit groups sit at their pivots).
  const basePositions = new Map<Object3D, Vector3>()
  if (handle) basePositions.set(handle, handle.position.clone())
  if (outputGroup) basePositions.set(outputGroup, outputGroup.position.clone())
  if (bearingGroup) basePositions.set(bearingGroup, bearingGroup.position.clone())
  if (clutchStaticGroup) basePositions.set(clutchStaticGroup, clutchStaticGroup.position.clone())
  if (clutchSlidingGroup) basePositions.set(clutchSlidingGroup, clutchSlidingGroup.position.clone())
  if (ringSwitchGroup) basePositions.set(ringSwitchGroup, ringSwitchGroup.position.clone())
  for (const { group } of gbFasteners) basePositions.set(group, group.position.clone())
  for (const id of STAGE_IDS) {
    const carrier = stages[id].carrier
    if (carrier) basePositions.set(carrier, carrier.position.clone())
  }

  const rig: WrenchRig = {
    handleRoot: handle,
    gearboxRoot: gearbox,
    housing: housingGroup,
    outputShaft: outputGroup,
    bearing: bearingGroup,
    clutch: { static: clutchStaticGroup, sliding: clutchSlidingGroup, ringSwitch: ringSwitchGroup },
    stages,
    gbFasteners,
    lcdCluster,
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
