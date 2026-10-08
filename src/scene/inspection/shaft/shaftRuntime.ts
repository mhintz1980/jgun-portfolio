import {
  BackSide, Box3, BufferGeometry, Color, DirectionalLight, Group, Matrix4, Mesh,
  MeshStandardMaterial, Plane, Quaternion, TorusGeometry, Vector3,
  Material, type InstancedMesh, type Object3D, type Texture,
} from 'three'
import { creasedNormals } from './normalRepair'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GEAR_RATIOS, ROTATION_TURNS, STAGE_IDS } from '../../../data/caseStudies'
import type { WrenchRig } from '../../rig/nodeRoles'
import type { StoryContext, StoryRuntime } from '../story'
import type { StorySession } from '../session'
import { createShaftCameraSample, sampleShaftCamera } from './camera'
import { narrativeModelToStudy, placeHob, placeShaper, shaftMetrePoint, shaftMmPoint, studyToShaftLocal } from './frame'
import { createShaftKinematicsFrame, sampleShaftKinematics, writeShaftProgression } from './kinematics'
import {
  applyProgression, createProgressionState, createProgressionUniforms, FACE_START_MM,
  HOB_INFEED_YC_MM, HOB_RETRACT_MM, HOB_VISUAL_A_MM, HOB_VISUAL_R_MM,
  setShaftTransform, writeProgressionUniforms, writeStressUniforms,
  type ProgressionShaft, type ProgressionUniforms, type StressOverlay,
} from './progression'
import { createShaftSchedule, sampleShaftSchedule } from './schedule'
import { createShaftScriptFrame, sampleShaftScript } from './script'
import { FOS_CENTER_Y, FOS_MAX, newFosPresentation, sampleFosPresentation } from './fosPresentation'
import { shaftStory } from './story'
import { buildHob, buildShaperCutter } from './tools'

interface BundleNode {
  name?: string; mesh?: number; children?: number[]; matrix?: number[]
  translation?: number[]; rotation?: number[]; scale?: number[]
}
/** Human-readable beat labels for the dialog's polite status line. */
const SHAFT_BEAT_LABELS: Readonly<Record<string, string>> = Object.freeze({
  isolate: 'Grooved blank', shaping: 'Gear shaping', 'slow-exit': 'Cutter exit into the relief groove',
  recap: 'Remaining teeth, time compressed', materials: 'Material attempts', 'revised-blank': 'Revised blank',
  hobbing: 'Rotary hobbing', 'runout-hold': 'Runout and revised material', supports: 'Moving the supports', finale: 'Revised assembly',
})

export interface ShaftBundleDocument {
  nodes: BundleNode[]
  meshes: { primitives: { attributes: { POSITION: number } }[] }[]
  accessors: { min?: number[]; max?: number[] }[]
}

/** Read only GLB metadata; Draco is decoded by the normal loader, not by this helper. */
export function readShaftBundleDocument(data: ArrayBuffer): ShaftBundleDocument {
  const view = new DataView(data)
  if (view.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2
    || view.getUint32(16, true) !== 0x4e4f534a) throw new Error('Invalid shaft GLB')
  const length = view.getUint32(12, true)
  if (20 + length > data.byteLength) throw new Error('Truncated shaft GLB')
  return JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, length))) as ShaftBundleDocument
}

/** Supports are identity nodes with baked vertex poses in today's exports. This also
 * handles future TRS nodes: use the union of ALL POSITION accessor bounds in study space.
 */
export function exportedNodeBounds(doc: ShaftBundleDocument, name: string, out: Box3): Box3 {
  const index = doc.nodes.findIndex(node => node.name === name)
  if (index < 0) throw new Error('Missing shaft node: ' + name)
  const world = new Matrix4(), local = new Matrix4(), p = new Vector3(), q = new Quaternion(), s = new Vector3()
  let cursor = index
  while (cursor >= 0) {
    const node = doc.nodes[cursor]
    if (node.matrix) local.fromArray(node.matrix)
    else local.compose(p.fromArray(node.translation ?? [0, 0, 0]), q.fromArray(node.rotation ?? [0, 0, 0, 1]), s.fromArray(node.scale ?? [1, 1, 1]))
    world.premultiply(local)
    cursor = doc.nodes.findIndex(parent => parent.children?.includes(cursor))
  }
  const node = doc.nodes[index]
  if (node.mesh === undefined) throw new Error('Shaft node has no exported mesh: ' + name)
  out.makeEmpty()
  const box = new Box3()
  for (const primitive of doc.meshes[node.mesh].primitives) {
    const accessor = doc.accessors[primitive.attributes.POSITION]
    if (!accessor.min || !accessor.max) throw new Error('Shaft accessor bounds missing: ' + name)
    box.min.fromArray(accessor.min); box.max.fromArray(accessor.max)
    out.union(box.applyMatrix4(world))
  }
  return out
}

export function measureSupportDelta(doc: ShaftBundleDocument, out: Vector3): number {
  const box = new Box3(), legacy = new Vector3(), approved = new Vector3(), ring = new Vector3()
  exportedNodeBounds(doc, 'legacybearing', box).getCenter(legacy)
  exportedNodeBounds(doc, 'approvedbearing', box).getCenter(approved)
  out.subVectors(approved, legacy)
  exportedNodeBounds(doc, 'legacyring', box).getCenter(legacy)
  exportedNodeBounds(doc, 'approvedring', box).getCenter(approved)
  ring.subVectors(approved, legacy)
  const deltaYmm = -out.z * 1000
  if (Math.abs(deltaYmm - 2.75) > 0.005 || Math.abs(out.x) > 0.000005 || Math.abs(out.y) > 0.000005
    || ring.distanceTo(out) > 0.000005) throw new Error('Exported support pair does not translate rigidly +2.750 mm')
  return deltaYmm
}

interface Part { root: Group; materials: MeshStandardMaterial[]; caps: Mesh[]; bindings: ProgressionBinding[] }
interface ProgressionBinding { uniforms: ProgressionUniforms; kind: ProgressionShaft }
interface Neighbour { carrier: Object3D; planets: Object3D[]; ratio: number; materials: Material[] }
const CLIPPED_PARTS = ['legacyshaft', 'approvedshaft', 'housing'] as const

/** Synchronous factory; async readiness owns every parsed/created resource by this session. */
export function createShaftRuntime(session: StorySession, ctx: StoryContext): StoryRuntime {
  const root = new Group(); root.name = 'manufacturing-study-root'
  // Fixed origin/identity. Every asset, camera and light is in this independent world.
  const supportPair = new Group(); supportPair.name = 'shaft-rigid-support-pair'; root.add(supportPair)
  const key = new DirectionalLight('#f0f1f2', 2.6), graze = new DirectionalLight('#d6dde2', 1.4)
  root.add(key, key.target, graze, graze.target)
  const steel = new MeshStandardMaterial({ color: '#adb4ba', metalness: 0.94, roughness: 0.28 })
  const shaperMaterial = steel.clone(), shaperDetailMaterial = steel.clone()
  const hobMaterial = steel.clone(), hobDetailMaterial = steel.clone()
  const chipMaterial = steel.clone(); chipMaterial.roughness = 0.38
  const shaper = buildShaperCutter(shaperMaterial), hob = buildHob(hobMaterial)
  const shaperDisc = shaper.root.getObjectByName('shaper-cutter-disc') as Mesh | undefined
  const hobThread = hob.root.getObjectByName('hob-thread') as InstancedMesh | undefined
  if (shaperDisc) shaperDisc.material = shaperDetailMaterial
  if (hobThread) hobThread.material = hobDetailMaterial
  const chip = new Mesh(new TorusGeometry(0.00035, 0.000045, 4, 14, Math.PI * 1.3), chipMaterial)
  chip.name = 'shaft-single-rake-chip'; root.add(shaper.root, hob.root, chip)
  const ownedGeometry = new Set<BufferGeometry>(), sharedGeometry = new Set<BufferGeometry>()
  const ownedMaterials = new Set<Material>([steel, shaperMaterial, shaperDetailMaterial, hobMaterial, hobDetailMaterial, chipMaterial])
  const ownedTextures = new Set<Texture>(), sharedTextures = new Set<Texture>()
  const resources = { geometries: 0, materials: 0, textures: 0, meshes: 0 }
  const parts: Record<string, Part> = Object.create(null) as Record<string, Part>
  const neighbours: Neighbour[] = []
  const bindings: ProgressionBinding[] = []
  const schedule = createShaftSchedule(), kinematics = createShaftKinematicsFrame(), script = createShaftScriptFrame()
  const cameraSample = createShaftCameraSample()
  const legacyState = createProgressionState(), approvedState = createProgressionState()
  const stress: StressOverlay = { kind: 'none', mix: 0, scanProgress: 0, yMin: 0, yMax: 24, rMax: 9, centerY: FOS_CENTER_Y.attempt, hotspotFos: 0, bodyFos: FOS_MAX }
  const fos = newFosPresentation()
  const camera = { valid: true, position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), fov: 34 }
  const render = { background: new Color('#05070a'), fogNear: 25, fogFar: 120, envIntensity: 0.35, envRotationY: 0,
    bloom: 0.16, aberration: 0, dofBokeh: 0, exposure: ctx.gl.toneMappingExposure }
  const frame = { time: 0, chapter: 0, phase: 'isolate', discrete: 0, narrativeAlpha: 1, returnBlend: 0, ownsNarrative: true }
  const toShaft = studyToShaftLocal(new Matrix4()), matrix = new Matrix4(), delta = new Vector3()
  const wipeLegacy = new Plane(new Vector3(0, 0, -1), 0), wipeApproved = new Plane(new Vector3(0, 0, 1), 0)
  const sectionPlane = new Plane(new Vector3(1, 0, 0), 0)
  const noPlanes: Plane[] = [], legacyWipePlanes = [wipeLegacy], approvedWipePlanes = [wipeApproved], sectionPlanes = [sectionPlane]
  const probe = {
    teethFormed: 0, teethPartial: 0,
    cutter: { visible: false, stroke: 0, infeed: 0, rotation: 0, softened: false },
    hob: { visible: false, feed: 0, rotation: 0, softened: false },
    card: { id: script.card, stamp: script.stamp }, stress: { kind: script.stress, mix: 0 },
    supports: { deltaYmm: 0, witnesses: false, endpointHeld: false },
    finale: { assembled: false, shaftCount: 0, racesFollow: false, carrierCount: 0, missingCarriers: true, bearingRacePolicy: 'unsplit-fixed', ringFollowsShaft: false, bearingOuterFixed: true },
    narrative: { alpha: 1, hiddenCount: 0, originalsIntact: true },
    nodes: { housing: '', legacyHousing: '', legacyHousingPresent: false },
  }
  let disposed = false, loaded = false, supportDeltaYmm = 0, shaftMinZ = -0.071524, shaftMaxZ = 0
  let draco: DRACOLoader | null = null
  let releaseShared: (() => void) | null = null
  let runtime!: StoryRuntime

  function collect(object: Object3D, shared = false): void {
    object.traverse(child => {
      if (!(child instanceof Mesh)) return
      if (shared) sharedGeometry.add(child.geometry); else ownedGeometry.add(child.geometry)
      resources.meshes++
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        ownedMaterials.add(material)
        for (const value of Object.values(material)) {
          if (value && typeof value === 'object' && 'isTexture' in value) {
            if (shared) sharedTextures.add(value as Texture); else ownedTextures.add(value as Texture)
          }
        }
      }
    })
  }
  collect(shaper.root); collect(hob.root); collect(chip)
  function census(): void {
    resources.geometries = ownedGeometry.size + sharedGeometry.size
    resources.materials = ownedMaterials.size; resources.textures = ownedTextures.size + sharedTextures.size
  }
  function materialOpacity(material: Material, opacity: number): void {
    const transparent = opacity < 0.999
    if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true }
    material.opacity = opacity; material.depthWrite = !transparent
  }
  function partOpacity(part: Part | undefined, opacity: number): void {
    if (!part) return
    part.root.visible = opacity > 0
    for (let i = 0; i < part.materials.length; i++) materialOpacity(part.materials[i], opacity)
    for (let i = 0; i < part.caps.length; i++) materialOpacity(part.caps[i].material as Material, opacity)
  }

  function attachPart(node: Object3D, name: string, kind?: ProgressionShaft): Part {
    const group = new Group(); group.name = 'study-' + name
    group.add(node); (name === 'approvedbearing' || name === 'approvedring' ? supportPair : root).add(group)
    const part: Part = { root: group, materials: [], caps: [], bindings: [] }; parts[name] = part
    // Freeze the undeformed rest registration before sampling any spins/sections.
    root.updateWorldMatrix(true, true)
    const meshes: Mesh[] = []; node.traverse(child => { if (child instanceof Mesh) meshes.push(child) })
    for (const mesh of meshes) {
      if (kind) {
        // S3: the exported shaft normals streak across sliver fans; rebuild them creased + angle-weighted (see normalRepair.ts).
        const original = mesh.geometry
        matrix.multiplyMatrices(toShaft, mesh.matrixWorld)
        mesh.geometry = creasedNormals(original, 40, matrix).geometry
        ownedGeometry.delete(original); ownedGeometry.add(mesh.geometry); original.dispose()
      }
      const material = steel.clone()
      if (name.includes('housing')) { material.color.set('#596169'); material.roughness = 0.4 }
      ownedMaterials.add(material); part.materials.push(material); mesh.material = material
      let uniforms: ProgressionUniforms | undefined
      if (kind) {
        uniforms = createProgressionUniforms()
        matrix.multiplyMatrices(toShaft, mesh.matrixWorld)
        setShaftTransform(uniforms, matrix); applyProgression(material, uniforms)
        const binding = { uniforms, kind }; bindings.push(binding); part.bindings.push(binding)
      }
      if (name === 'approvedshaft' || name === 'housing') {
        // Darker clipped back faces suggest section walls. No CSG or fabricated solid cap.
        const capMaterial = steel.clone(); capMaterial.side = BackSide; capMaterial.color.set('#262c32'); capMaterial.roughness = 0.65
        capMaterial.clippingPlanes = sectionPlanes
        if (uniforms) applyProgression(capMaterial, uniforms)
        ownedMaterials.add(capMaterial)
        const cap = new Mesh(mesh.geometry, capMaterial); cap.name = 'study-section-backface'
        cap.position.copy(mesh.position); cap.quaternion.copy(mesh.quaternion); cap.scale.copy(mesh.scale)
        mesh.parent?.add(cap); cap.visible = false; part.caps.push(cap); resources.meshes++
      }
    }
    return part
  }

  function cloneNeighbours(): void {
    const rig = ctx.rig as Partial<WrenchRig> | null
    if (!rig?.stages || !rig.basePositions) return
    const modelFrame = new Group(); modelFrame.name = 'study-narrative-rest-registration'; modelFrame.matrixAutoUpdate = false
    narrativeModelToStudy(modelFrame.matrix)
    // Carrier pivots and baked merged geometry are gearbox-local, not model-local.
    if (rig.gearboxRoot) {
      const gearboxLocal = new Matrix4().compose(rig.gearboxRoot.position, rig.gearboxRoot.quaternion, rig.gearboxRoot.scale)
      modelFrame.matrix.multiply(gearboxLocal)
    }
    root.add(modelFrame)
    const materialClones = new Map<Material, Material>()
    for (const id of STAGE_IDS) {
      const stage = rig.stages[id], source = stage?.carrier
      const base = source ? rig.basePositions.get(source) : undefined
      if (!source || !base) continue
      const carrier = source.clone(true)
      carrier.position.copy(base); carrier.rotation.set(0, 0, 0); carrier.visible = false
      const sourceTree: Object3D[] = [], cloneTree: Object3D[] = []
      source.traverse(child => sourceTree.push(child)); carrier.traverse(child => cloneTree.push(child))
      const planets: Object3D[] = []
      for (const planet of stage.planets) {
        const i = sourceTree.indexOf(planet)
        if (i >= 0) { cloneTree[i].rotation.set(0, 0, 0); planets.push(cloneTree[i]) }
      }
      const materials: Material[] = []
      carrier.traverse(child => {
        child.visible = true
        if (!(child instanceof Mesh)) return
        const cloneMaterial = (original: Material): Material => {
          let material = materialClones.get(original)
          if (!material) {
            material = original.clone()
            // A narrative shader callback may own cached, mutable hero uniforms.
            // The study keeps PBR fields/textures; it does not copy that callback.
            material.onBeforeCompile = Material.prototype.onBeforeCompile
            material.customProgramCacheKey = Material.prototype.customProgramCacheKey
            materialClones.set(original, material); ownedMaterials.add(material)
          }
          if (!materials.includes(material)) materials.push(material)
          return material
        }
        child.material = Array.isArray(child.material) ? child.material.map(cloneMaterial) : cloneMaterial(child.material)
      })
      carrier.visible = false; modelFrame.add(carrier); collect(carrier, true)
      neighbours.push({ carrier, planets, ratio: ROTATION_TURNS[id] / ROTATION_TURNS.stage1, materials })
    }
    probe.finale.carrierCount = neighbours.length
    probe.finale.missingCarriers = neighbours.length !== STAGE_IDS.length
    if (neighbours.length > 0) releaseShared = session.borrowShared('shaft-finale-carriers')
  }

  const ready = (async () => {
    if (disposed || !session.current()) return
    const asset = shaftStory.assets.find(candidate => candidate.tier === ctx.tier)
    if (!asset) throw new Error('Missing shaft tier asset')
    const url = `${import.meta.env.BASE_URL}${asset.url}`
    const response = await fetch(url, { signal: session.signal })
    if (disposed || !session.current()) return
    if (!response.ok) throw new Error(`Shaft download failed (${response.status})`)
    const data = await response.arrayBuffer()
    if (disposed || !session.current()) return
    if (data.byteLength > asset.maxBytes) throw new Error('Shaft bundle exceeds declared byte limit')
    const doc = readShaftBundleDocument(data)
    supportDeltaYmm = measureSupportDelta(doc, delta)
    const shaftBounds = exportedNodeBounds(doc, 'approvedshaft', new Box3())
    shaftMinZ = shaftBounds.min.z; shaftMaxZ = shaftBounds.max.z
    draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
    const loader = new GLTFLoader().setDRACOLoader(draco)
    const gltf = await loader.parseAsync(data, url.slice(0, url.lastIndexOf('/') + 1))
    if (disposed || !session.current()) {
      // A parse cannot be aborted; release its unmounted results, including after cancel.
      const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>()
      gltf.scene.traverse(child => {
        if (!(child instanceof Mesh)) return
        geometries.add(child.geometry)
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          materials.add(material)
          for (const value of Object.values(material)) if (value && typeof value === 'object' && 'isTexture' in value) textures.add(value as Texture)
        }
      })
      geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose())
      return
    }
    collect(gltf.scene)
    const names = ['legacyshaft', 'approvedshaft', 'legacybearing', 'legacyring', 'approvedbearing', 'approvedring'] as const
    for (const name of names) {
      const node = gltf.scene.getObjectByName(name)
      if (!node) throw new Error('Missing shaft bundle node: ' + name)
      attachPart(node, name, name === 'legacyshaft' ? 'legacy' : name === 'approvedshaft' ? 'approved' : undefined)
    }
    const housing = gltf.scene.getObjectByName('approvedhousing') ?? gltf.scene.getObjectByName('housing')
    if (!housing) throw new Error('Missing approvedhousing/housing')
    probe.nodes.housing = housing.name; attachPart(housing, 'housing')
    const legacyHousing = gltf.scene.getObjectByName('legacyhousing')
    if (legacyHousing) { probe.nodes.legacyHousing = legacyHousing.name; probe.nodes.legacyHousingPresent = true; attachPart(legacyHousing, 'legacyhousing') }
    cloneNeighbours(); census(); loaded = true
    // Preserve a seek issued during loading, applying only after registration is complete.
    runtime.apply()
  })().catch(error => {
    if (!disposed && session.current()) { session.fail(error); runtime.dispose(); throw error }
  }).finally(() => { draco?.dispose(); draco = null })

  runtime = {
    root, ready, frame, camera, render, resources,
    sample(time) {
      if (disposed) return
      sampleShaftSchedule(time, schedule)
      const t = schedule.time
      sampleShaftKinematics(t, kinematics); sampleShaftScript(t, false, script)
      writeShaftProgression(kinematics, legacyState); writeShaftProgression(kinematics, approvedState)
      // Kinematics mode='none' outside cutting; explicitly preserve the appropriate stock.
      legacyState.mode = 'shaping'
      if (t < 2) { legacyState.spaceDepth.fill(0); legacyState.engagedSpace = -1 }
      if (t >= 15) { legacyState.spaceDepth.fill(1); legacyState.engagedSpace = -1 }
      approvedState.mode = t < 32 ? 'hobbing' : 'none'
      if (t < 25) {
        approvedState.hobYc = HOB_INFEED_YC_MM; approvedState.hobA = HOB_VISUAL_A_MM + HOB_RETRACT_MM; approvedState.hobR = HOB_VISUAL_R_MM
      }
      frame.time = t; frame.phase = schedule.beat; frame.discrete = schedule.beatIndex
      frame.chapter = t < 15 ? 0 : t < 22.6 ? 1 : t < 35 ? 2 : 3
      frame.narrativeAlpha = schedule.narrativeAlpha; frame.ownsNarrative = true; frame.returnBlend = 0
      sampleShaftCamera(t, ctx.aspect, kinematics, cameraSample)
      shaftMetrePoint(camera.position, cameraSample.px, cameraSample.py, cameraSample.pz)
      shaftMetrePoint(camera.target, cameraSample.tx, cameraSample.ty, cameraSample.tz)
      shaftMetrePoint(camera.up, cameraSample.ux, cameraSample.uy, cameraSample.uz).normalize()
      camera.fov = cameraSample.fov; camera.valid = cameraSample.valid
      render.envRotationY = 0 // local lights carry the authored frame-follow reflection.
    },
    apply() {
      if (disposed) return
      root.visible = true
      partOpacity(parts.legacyshaft, schedule.legacyShaft); partOpacity(parts.approvedshaft, schedule.approvedShaft)
      partOpacity(parts.housing, schedule.housing); partOpacity(parts.legacyhousing, schedule.legacyHousing)
      partOpacity(parts.legacybearing, schedule.legacyBearing); partOpacity(parts.legacyring, schedule.legacyRing)
      partOpacity(parts.approvedbearing, schedule.approvedBearing); partOpacity(parts.approvedring, schedule.approvedRing)
      const legacyAngle = kinematics.workPhi
      const approvedAngle = kinematics.hobWorkPhi + schedule.finaleAngle
      if (parts.legacyshaft) parts.legacyshaft.root.rotation.z = -legacyAngle
      if (parts.approvedshaft) parts.approvedshaft.root.rotation.z = -approvedAngle
      if (parts.approvedring) parts.approvedring.root.rotation.z = frame.time >= 39 ? -schedule.finaleAngle : 0
      // Unsplit bearing stays fixed; only an authenticated separable inner race may spin.
      supportPair.position.copy(delta).multiplyScalar(-(1 - schedule.supportBlend))
      const wipeZ = shaftMaxZ + (shaftMinZ - shaftMaxZ) * schedule.wipeProgress
      wipeLegacy.constant = wipeZ; wipeApproved.constant = -wipeZ
      // Remove the camera-facing half, retaining the far half and its darker backs.
      // Study shaft axis is -Z, so the section plane uses only the radial XY direction.
      sectionPlane.normal.set(camera.target.x - camera.position.x, camera.target.y - camera.position.y, 0).normalize()
      // Three.js discards negative plane distance. New retains z>=wipeZ, old z<=wipeZ.
      for (let partIndex = 0; partIndex < CLIPPED_PARTS.length; partIndex++) {
        const name = CLIPPED_PARTS[partIndex]
        const part = parts[name]; if (!part) continue
        const planes = schedule.wipe ? name === 'legacyshaft' ? legacyWipePlanes : name === 'approvedshaft' ? approvedWipePlanes : noPlanes
          : schedule.section && name !== 'legacyshaft' ? sectionPlanes : noPlanes
        for (let i = 0; i < part.materials.length; i++) {
          const material = part.materials[i]
          if (material.clippingPlanes !== planes) { material.clippingPlanes = planes; material.needsUpdate = true }
        }
        for (let i = 0; i < part.caps.length; i++) part.caps[i].visible = schedule.section
      }
      stress.kind = script.stress; stress.mix = script.stressMix; stress.scanProgress = script.scanProgress
      // The whole shaft carries the field (body blue, hotspot warm/blue); it spreads from the hotspot centre.
      stress.yMin = 0; stress.yMax = 24; stress.rMax = 9
      stress.centerY = script.stress === 'warm' ? FOS_CENTER_Y.attempt : FOS_CENTER_Y.revised
      sampleFosPresentation(frame.time, script.stress, script.stressMix, fos)
      stress.hotspotFos = fos.hotspot; stress.bodyFos = fos.body
      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i]
        writeProgressionUniforms(binding.uniforms, binding.kind === 'legacy' ? legacyState : approvedState, binding.kind)
        // Warm geometry leaves only with the old shaft; cool belongs only to the revision.
        stress.kind = binding.kind === 'legacy' && script.stress === 'warm' ? 'warm'
          : binding.kind === 'approved' && script.stress === 'cool' ? 'cool' : 'none'
        writeStressUniforms(binding.uniforms, stress)
      }
      placeShaper(shaper.root, kinematics); shaper.root.visible = schedule.shaper > 0
      placeHob(hob.root, kinematics); hob.root.visible = schedule.hob > 0
      materialOpacity(shaperMaterial, schedule.shaper); materialOpacity(shaperDetailMaterial, schedule.shaper * (kinematics.softened ? 0.25 : 1))
      materialOpacity(hobMaterial, schedule.hob); materialOpacity(hobDetailMaterial, schedule.hob * (kinematics.softened ? 0.25 : 1))
      shaftMmPoint(chip.position, kinematics.chipX, kinematics.chipY, kinematics.chipZ)
      chip.rotation.set(Math.PI / 2, 0, kinematics.chipCurl); chip.scale.setScalar(0.6 + kinematics.chipCurl * 0.2)
      const chipAlpha = kinematics.chipOpacity * schedule.shaper
      chip.visible = chipAlpha > 0; materialOpacity(chipMaterial, chipAlpha)
      const follow = kinematics.followAzimuth
      shaftMetrePoint(key.position, 0.08 * Math.cos(follow) + 0.06 * Math.sin(follow), 0.1, 0.06 * Math.cos(follow) - 0.08 * Math.sin(follow))
      shaftMmPoint(key.target.position, 0, 12, 0)
      shaftMetrePoint(graze.position, -0.025 * Math.cos(follow) + 0.075 * Math.sin(follow), 0.02, 0.075 * Math.cos(follow) + 0.025 * Math.sin(follow))
      shaftMmPoint(graze.target.position, 0, 12, 0)
      for (let i = 0; i < neighbours.length; i++) {
        const neighbour = neighbours[i]
        const angle = -schedule.finaleAngle * neighbour.ratio
        neighbour.carrier.visible = schedule.neighbours > 0; neighbour.carrier.rotation.z = angle
        for (let j = 0; j < neighbour.planets.length; j++) neighbour.planets[j].rotation.z = -angle * GEAR_RATIOS.planetMultiplier
        for (let j = 0; j < neighbour.materials.length; j++) materialOpacity(neighbour.materials[j], schedule.neighbours)
      }
      root.updateWorldMatrix(true, true)
    },
    telemetry(out) {
      if (disposed) return
      out.phase = SHAFT_BEAT_LABELS[frame.phase] ?? frame.phase
      let formed = 0, partial = 0
      if (frame.time < 22.6) {
        for (let i = 0; i < legacyState.spaceDepth.length; i++) {
          if (legacyState.spaceDepth[i] >= 1) formed++
          else if (legacyState.spaceDepth[i] > 0) partial++
        }
      } else if (frame.time >= 32) formed = 10
      else if (approvedState.hobYc > FACE_START_MM) partial = 10
      probe.teethFormed = formed; probe.teethPartial = partial
      probe.cutter.visible = schedule.shaper > 0; probe.cutter.stroke = kinematics.strokeCentreY
      probe.cutter.infeed = kinematics.cutterRho; probe.cutter.rotation = kinematics.cutterPhi; probe.cutter.softened = kinematics.softened
      probe.hob.visible = schedule.hob > 0; probe.hob.feed = kinematics.hobYc; probe.hob.rotation = kinematics.hobPhi; probe.hob.softened = kinematics.softened
      probe.card.id = script.card; probe.card.stamp = script.stamp
      probe.stress.kind = script.stress; probe.stress.mix = script.stressMix
      probe.supports.deltaYmm = supportDeltaYmm; probe.supports.witnesses = loaded && schedule.witnesses
      probe.supports.endpointHeld = loaded && schedule.endpointHeld
      probe.finale.assembled = loaded && !probe.finale.missingCarriers && frame.time >= 39
      probe.finale.shaftCount = loaded ? (schedule.legacyShaft > 0 ? 1 : 0) + (schedule.approvedShaft > 0 ? 1 : 0) : 0
      // These bundles expose an unsplit bearing: do not claim an animated inner race.
      probe.finale.racesFollow = false
      probe.finale.ringFollowsShaft = loaded && frame.time >= 39
      probe.narrative.alpha = frame.narrativeAlpha
      out.shaft = probe; out.resources = resources
    },
    dispose() {
      if (disposed) return
      disposed = true; loaded = false; root.removeFromParent(); root.visible = false
      hobThread?.dispose()
      ownedGeometry.forEach(value => value.dispose()); ownedMaterials.forEach(value => value.dispose()); ownedTextures.forEach(value => value.dispose())
      // Shared narrative geometries/textures are borrowed, never disposed here.
      key.dispose(); graze.dispose(); releaseShared?.(); releaseShared = null
      // Do not terminate a pending Draco parse: worker disposal would strand its
      // promise. ready's finally releases it after stale parsed assets are cleaned up.
      ownedGeometry.clear(); ownedMaterials.clear(); ownedTextures.clear(); sharedGeometry.clear(); sharedTextures.clear()
      resources.geometries = 0; resources.materials = 0; resources.textures = 0; resources.meshes = 0
      root.clear()
    },
  }
  census(); runtime.sample(0); runtime.apply()
  session.own(runtime)
  return runtime
}
