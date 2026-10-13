import { AnimationMixer, type AnimationAction, Box3, BufferAttribute, Color, DirectionalLight, Group, LoopOnce, Matrix4, Mesh, Quaternion, Vector3, type Material, type Object3D, type Texture } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createInspectionRing, type RingGeometryCleanupResource } from './ringGeometry'
import { ease, newFrame, odMask, rollerAngle, sampleInspection, SHOULDER, WHEEL_WIDTH } from './timeline'
import type { StoryContext, StoryRuntime } from './story'
import type { StorySession } from './session'

const black = new Color('#040404'), aluminium = new Color('#bfc5cb')

export interface RingRuntimeProbe {
  ringMeshes: number
  toolMeshes: number
  ringBounds: { min: number[]; max: number[]; center: number[]; radius: number; width: number }
  worldBounds: { min: number[]; max: number[] }
  rollerCenters: number[][]
  rollerAxial: number[]
  rollerClearance: number[]
  wheelAxis: number[][]
  holePlugBlend: number
  holePatchOpacity: number
  holePatches: number
  holeApertures: number
  holePatchesVisible: number
  time: number
  phase: string
  odKnurlProgress: number
  normalStrength: number
  aluminiumBlend: number
  ringAngle: number
  toolClipTime: number
  toolVisible: boolean
  maskSamples: { bore: number; shoulder: number; odStart: number; odEnd: number }
  disposed: number
  loaded: boolean
}

export function createRingRuntimeProbe(): RingRuntimeProbe {
  return {
    ringMeshes: 0, toolMeshes: 0,
    ringBounds: { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0], radius: 0, width: 0 },
    worldBounds: { min: [0, 0, 0], max: [0, 0, 0] },
    rollerCenters: [[0, 0, 0], [0, 0, 0]], rollerAxial: [0, 0], rollerClearance: [0, 0],
    wheelAxis: [[0, 0, 1], [0, 0, 1]],
    holePlugBlend: 0, holePatchOpacity: 0, holePatches: 0, holeApertures: 0, holePatchesVisible: 0,
    time: 0, phase: 'Smooth black', odKnurlProgress: 0, normalStrength: 0, aluminiumBlend: 0,
    ringAngle: 0, toolClipTime: 0, toolVisible: false,
    maskSamples: { bore: 0, shoulder: 0, odStart: 0, odEnd: 0 },
    disposed: 0, loaded: false,
  }
}

export interface RingRuntimeCoreInputs {
  source: Object3D
  meshes: readonly Mesh[]
  initialTime: number
  getEntryElapsed: () => number
  probe: RingRuntimeProbe
  onCleanupError?: (report: RingCleanupReport) => void
}

export interface RingCleanupReport {
  phase: 'runtime' | 'construction'
  resource: 'tool-animation' | 'tool-cache' | 'scene-root' | 'ring' | 'tool' | RingGeometryCleanupResource
  error: unknown
}

export interface RingRuntimeDiagnosticControls {
  mask(enabled: boolean): void
  progress(value: number | null): void
}

export type RingRuntimeCore = StoryRuntime & RingRuntimeDiagnosticControls

type RingResource = ReturnType<typeof createInspectionRing>

interface ToolOwnership {
  geometries: Set<Mesh['geometry']>
  materials: Set<Material>
  textures: Set<Texture>
  dispose(phase?: RingCleanupReport['phase']): void
}

interface Mechanics {
  mixer: AnimationMixer
  action: AnimationAction
  root: Object3D
  rootSample: { evaluate(time: number): Float32Array }
  wheels: Object3D[]
  radii: number[]
}

function reportCleanup(report: ((value: RingCleanupReport) => void) | undefined, phase: RingCleanupReport['phase'], resource: RingCleanupReport['resource'], error: unknown): void {
  try { report?.({ phase, resource, error }) } catch { /* reporting cannot interrupt cleanup */ }
}

function disposeEach<T extends { dispose(): void }>(values: Iterable<T>, phase: RingCleanupReport['phase'], resource: RingCleanupReport['resource'], report?: (value: RingCleanupReport) => void): void {
  for (const value of values) {
    try { value.dispose() } catch (error) { reportCleanup(report, phase, resource, error) }
  }
}

/** Parsed props are owned by this session, never by the narrative GLTF cache. */
function toolResources(gltf: GLTF, report?: (value: RingCleanupReport) => void): ToolOwnership {
  const geometries = new Set<Mesh['geometry']>(), materials = new Set<Material>(), textures = new Set<Texture>()
  gltf.scene.traverse(object => {
    if (!(object instanceof Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value && typeof value === 'object' && 'isTexture' in value) textures.add(value as Texture)
    }
  })
  return {
    geometries, materials, textures,
    dispose(phase: RingCleanupReport['phase'] = 'runtime') {
      disposeEach(geometries, phase, 'tool', report)
      disposeEach(materials, phase, 'tool', report)
      disposeEach(textures, phase, 'tool', report)
    },
  }
}

function disposeRing(ring: RingResource, phase: RingCleanupReport['phase'], report?: (value: RingCleanupReport) => void): void {
  disposeEach(ring.geometries, phase, 'ring', report)
  disposeEach(ring.patchGeometries, phase, 'ring', report)
  disposeEach([ring.material, ring.patchMaterial], phase, 'ring', report)
  disposeEach([ring.normalMap], phase, 'ring', report)
}

/** Filter physical tooth vertices and normals toward a smooth roller at high display speed. */
function filterRoller(wheel: Object3D, radius: number, detail: { value: number }, ownedMaterials: Set<Material>) {
  const inverse = wheel.matrixWorld.clone().invert(), local = new Matrix4(), back = new Matrix4(), v = new Vector3(), normal = new Vector3()
  wheel.traverse(object => {
    if (!(object instanceof Mesh)) return
    local.multiplyMatrices(inverse, object.matrixWorld); back.copy(local).invert()
    const positions = object.geometry.getAttribute('position'), normals = object.geometry.getAttribute('normal')
    const smoothPositions = new Float32Array(positions.count * 3), smoothNormals = new Float32Array(normals.count * 3)
    for (let i = 0; i < positions.count; i++) {
      v.fromBufferAttribute(positions, i).applyMatrix4(local)
      const radial = Math.hypot(v.x, v.z)
      normal.fromBufferAttribute(normals, i)
      if (radial > radius - 0.0012) {
        const smoothRadius = radius - 0.00035
        v.x *= smoothRadius / radial; v.z *= smoothRadius / radial
        normal.transformDirection(local)
        if (Math.abs(normal.y) < 0.7) normal.set(v.x, 0, v.z).normalize()
        normal.transformDirection(back)
      }
      v.applyMatrix4(back).toArray(smoothPositions, i * 3); normal.toArray(smoothNormals, i * 3)
    }
    object.geometry.setAttribute('inspectionSmoothPosition', new BufferAttribute(smoothPositions, 3))
    object.geometry.setAttribute('inspectionSmoothNormal', new BufferAttribute(smoothNormals, 3))
    const adapt = (original: Material) => {
      const material = original.clone(); ownedMaterials.add(material)
      const before = original.onBeforeCompile, key = original.customProgramCacheKey()
      material.onBeforeCompile = (shader, renderer) => {
        before.call(material, shader, renderer)
        shader.uniforms.uRollerDetail = detail
        shader.vertexShader = 'uniform float uRollerDetail;\nattribute vec3 inspectionSmoothPosition;\nattribute vec3 inspectionSmoothNormal;\n' + shader.vertexShader
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = mix(inspectionSmoothPosition, position, uRollerDetail);')
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', 'vec3 objectNormal = normalize(mix(inspectionSmoothNormal, normal, uRollerDetail));\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3(tangent.xyz);\n#endif')
      }
      material.customProgramCacheKey = () => `${key}-inspection-smooth-roller-v1`
      return material
    }
    object.material = Array.isArray(object.material) ? object.material.map(adapt) : adapt(object.material)
  })
}

function buildMechanics(gltf: GLTF, detail: { value: number }, ownership: ToolOwnership): Mechanics {
  const mixer = new AnimationMixer(gltf.scene)
  const clip = gltf.animations.find(value => value.name === 'KnurlTool_Approach_Contact_Traverse_Retract')
  if (!clip) throw new Error('Verified tool animation is missing')
  const action = mixer.clipAction(clip); action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play()
  const toolRoot = gltf.scene.getObjectByName('KT_TOOL_ROOT')
  const rootTrack = clip.tracks.find(value => value.name === 'KT_TOOL_ROOT.position')
  if (!toolRoot || !rootTrack) throw new Error('Verified tool root is missing')
  const rootSample = (rootTrack as unknown as { createInterpolant(): { evaluate(time: number): Float32Array } }).createInterpolant()
  const wheels = ['KT_UPPER_KNURL_WHEEL_RH', 'KT_LOWER_KNURL_WHEEL_LH'].map(name => {
    const wheel = gltf.scene.getObjectByName(name)
    if (!wheel) throw new Error(`Verified roller is missing: ${name}`)
    return wheel
  })
  const radii = wheels.map(wheel => {
    wheel.updateWorldMatrix(true, true)
    const inverse = wheel.matrixWorld.clone().invert(), vertex = new Vector3(), matrix = new Matrix4()
    let radius = 0
    wheel.traverse(object => { if (object instanceof Mesh) {
      const p = object.geometry.getAttribute('position'); matrix.multiplyMatrices(inverse, object.matrixWorld)
      for (let i = 0; i < p.count; i++) { vertex.fromBufferAttribute(p, i).applyMatrix4(matrix); radius = Math.max(radius, Math.hypot(vertex.x, vertex.z)) }
    } })
    if (radius <= 0) throw new Error('Verified roller radius is unavailable')
    return radius
  })
  for (let i = 0; i < wheels.length; i++) filterRoller(wheels[i], radii[i], detail, ownership.materials)
  return { mixer, action, root: toolRoot, rootSample, wheels, radii }
}

export function createRingRuntimeCore(session: StorySession, ctx: StoryContext, inputs: RingRuntimeCoreInputs): RingRuntimeCore {
  const probe = inputs.probe, cleanupReport = inputs.onCleanupError
  let ring!: RingResource
  let root!: Group
  let toolFrame!: Group
  let patchMeshes!: Object3D[]
  let resources!: StoryRuntime['resources']
  let disposed = false, tool: GLTF | null = null, ownership: ToolOwnership | null = null
  let mechanics: Mechanics | null = null, proofProgress: number | null = null
  let ready: Promise<void>
  let runtime: RingRuntimeCore

  try {
    ring = createInspectionRing(inputs.source, [...inputs.meshes], report =>
      reportCleanup(cleanupReport, report.phase === 'construction' ? 'construction' : 'runtime', report.resource, report.error))
    root = new Group(); root.name = 'ring-inspection-world'
    toolFrame = new Group(); toolFrame.name = 'inspection-tool-frame'; toolFrame.rotation.x = Math.PI / 2; toolFrame.visible = false
    root.add(ring.group, toolFrame)
    const key = new DirectionalLight('#edf4ff', 2.6), rim = new DirectionalLight('#c7dae2', 1.4)
    key.position.set(-0.1, 0.15, 0.16); rim.position.set(0.12, -0.12, 0.04)
    root.add(key, rim, key.target, rim.target)
    patchMeshes = ring.group.children.filter(child => child.name.startsWith('P003068-hole-cover-'))
    resources = { geometries: ring.geometries.length + ring.patchGeometries.length, materials: 2, textures: 1, meshes: ring.geometries.length + patchMeshes.length }
  } catch (error) {
    disposed = true
    try { root?.removeFromParent() } catch (cleanupError) { reportCleanup(cleanupReport, 'construction', 'scene-root', cleanupError) }
    if (ring) disposeRing(ring, 'construction', cleanupReport)
    throw error
  }

  const entryPosition = new Vector3(), entryRotation = new Quaternion(), entryScale = new Vector3()
  ring.entryMatrix.decompose(entryPosition, entryRotation, entryScale)
  const zero = new Vector3(), identity = new Quaternion(), axis = new Vector3(), point = new Vector3(), local = new Vector3(), bounds = new Box3()
  const sample = newFrame(), detail = { value: 1 }
  const frame = { time: 0, chapter: 0, phase: sample.phase, discrete: 0, narrativeAlpha: 1, returnBlend: 0, ownsNarrative: true }
  const camera = { valid: true, position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), fov: 34 }
  let exposure: number
  try { exposure = ctx.gl.toneMappingExposure }
  catch (error) {
    disposed = true
    try { root.removeFromParent() } catch (cleanupError) { reportCleanup(cleanupReport, 'construction', 'scene-root', cleanupError) }
    disposeRing(ring, 'construction', cleanupReport)
    throw error
  }
  const render = { background: new Color('#05070a'), fogNear: 25, fogFar: 120, envIntensity: 0.7, envRotationY: 0, bloom: 0.16, aberration: 0, dofBokeh: 0, exposure }

  ready = (async () => {
    const url = `${import.meta.env.BASE_URL}models/knurling-tool.glb`
    const response = await fetch(url, { signal: session.signal })
    if (!response.ok) throw new Error(`Tool download failed (${response.status})`)
    const data = await response.arrayBuffer()
    if (disposed || !session.current()) return
    const gltf = await new GLTFLoader().parseAsync(data, url.slice(0, url.lastIndexOf('/') + 1))
    const owned = toolResources(gltf, cleanupReport)
    if (disposed || !session.current()) { owned.dispose(); return }
    tool = gltf; ownership = owned
    mechanics = buildMechanics(gltf, detail, owned)
    toolFrame.add(gltf.scene)
    resources.geometries += owned.geometries.size; resources.materials += owned.materials.size; resources.textures += owned.textures.size
    gltf.scene.traverse(object => { if (object instanceof Mesh) resources.meshes++ })
    probe.toolMeshes = resources.meshes - ring.geometries.length
  })()

  runtime = {
    root, ready, frame, camera, render, resources,
    sample(time) {
      sampleInspection(time, sample)
      frame.time = sample.time; frame.phase = sample.phase; frame.returnBlend = sample.returnBlend
      frame.discrete = sample.time < 1.2 ? 0 : sample.time < 2.8 ? 1 : sample.time < 4.2 ? 2 : sample.time < 6.2 ? 3 : sample.time < 8.2 ? 4 : sample.time < 10.5 ? 5 : sample.time < 12 ? 6 : 7
      frame.narrativeAlpha = sample.returnBlend; frame.ownsNarrative = true
      const distance = Math.max(ring.radius * 5.4, ring.radius * 3.2 / Math.max(0.42, ctx.aspect))
      camera.position.set(-0.7, 0.48, 0.53).normalize().multiplyScalar(distance)
      camera.target.set(0, 0, 0); camera.up.set(0, 1, 0); camera.fov = 34
    },
    apply() {
      if (disposed) return
      const entryBlend = ease(inputs.getEntryElapsed() / 1.2), poseBlend = 1 - entryBlend + entryBlend * sample.returnBlend
      root.position.lerpVectors(zero, entryPosition, poseBlend); root.quaternion.slerpQuaternions(identity, entryRotation, poseBlend)
      root.visible = true
      ring.group.rotation.z = sample.angle
      ring.material.color.lerpColors(black, aluminium, sample.aluminium); ring.material.roughness = 0.26 + sample.aluminium * 0.09
      ring.material.opacity = 1 - sample.returnBlend; ring.material.transparent = true; ring.material.depthWrite = sample.returnBlend < 0.001
      // Bandwidth filtering is independent of the forming mask and true angular sweep.
      ring.material.normalScale.set(1.5 * sample.ringDetailScale, 1.5 * sample.ringDetailScale)
      // Hole covers: same finish as the ring, own opacity from the sampled blend and the return fade (never the ring's).
      const cover = ring.patchMaterial
      cover.color.copy(ring.material.color); cover.roughness = ring.material.roughness; cover.normalScale.copy(ring.material.normalScale)
      cover.transparent = true; cover.opacity = sample.holePlugBlend * (1 - sample.returnBlend); cover.depthWrite = cover.opacity >= 0.999
      for (const mesh of patchMeshes) mesh.visible = cover.opacity > 0.001
      ring.uniforms.progress.value = proofProgress ?? sample.knurl; detail.value = sample.rollerDetailScale
      toolFrame.visible = sample.toolVisible
      toolFrame.position.x = 0.24 * ease((sample.clipTime - 4.5) / 0.5)
      if (mechanics) {
        mechanics.action.enabled = true; mechanics.action.paused = false
        mechanics.mixer.setTime(Math.min(sample.clipTime, 5 - 0.000001))
        mechanics.root.position.y = mechanics.rootSample.evaluate(sample.clipTime)[1] * (ring.width / 2 - SHOULDER - WHEEL_WIDTH / 2) / ((0.027204217025541766 - WHEEL_WIDTH) / 2)
        for (let i = 0; i < 2; i++) mechanics.wheels[i].quaternion.setFromAxisAngle(axis.set(0, 1, 0), rollerAngle(sample.angle, ring.radius, mechanics.radii[i]))
      }
      if (ownership) for (const material of ownership.materials) { material.transparent = true; material.opacity = sample.toolOpacity; material.depthWrite = sample.toolOpacity >= 0.999 }
      root.updateWorldMatrix(true, true)
    },
    telemetry(out) {
      if (disposed) return
      bounds.setFromObject(ring.group)
      for (let i = 0; i < 3; i++) { probe.worldBounds.min[i] = bounds.min.getComponent(i); probe.worldBounds.max[i] = bounds.max.getComponent(i) }
      if (mechanics) for (let i = 0; i < 2; i++) {
        point.setFromMatrixPosition(mechanics.wheels[i].matrixWorld)
        for (let j = 0; j < 3; j++) probe.rollerCenters[i][j] = point.getComponent(j)
        local.copy(point); root.worldToLocal(local)
        probe.rollerAxial[i] = local.z; probe.rollerClearance[i] = Math.hypot(local.x, local.y) - ring.radius - mechanics.radii[i]
        axis.set(0, 1, 0).transformDirection(mechanics.wheels[i].matrixWorld)
        for (let j = 0; j < 3; j++) probe.wheelAxis[i][j] = axis.getComponent(j)
      }
      probe.holePlugBlend = sample.holePlugBlend; probe.holePatchOpacity = ring.patchMaterial.opacity
      probe.holePatches = patchMeshes.length; probe.holeApertures = ring.apertures.length
      probe.holePatchesVisible = patchMeshes.filter(mesh => mesh.visible).length
      probe.time = sample.time; probe.phase = sample.phase; probe.odKnurlProgress = ring.uniforms.progress.value
      probe.normalStrength = ring.material.normalScale.x; probe.aluminiumBlend = sample.aluminium
      probe.ringAngle = sample.angle; probe.toolClipTime = sample.clipTime; probe.toolVisible = toolFrame.visible
      const p = ring.uniforms.progress.value
      probe.maskSamples.bore = odMask(ring.radius * 0.8, 0, 0, ring.radius, ring.width / 2, p)
      probe.maskSamples.shoulder = odMask(ring.radius, ring.width / 2 - 0.0005, 0, ring.radius, ring.width / 2, p)
      probe.maskSamples.odStart = odMask(ring.radius, -ring.width / 2 + SHOULDER + 0.0005, 0, ring.radius, ring.width / 2, p)
      probe.maskSamples.odEnd = odMask(ring.radius, ring.width / 2 - SHOULDER - 0.0005, 0, ring.radius, ring.width / 2, p)
      out.runtimeVersion = 2; out.toolOpacity = sample.toolOpacity; out.ringDetailScale = sample.ringDetailScale; out.rollerDetailScale = detail.value
      out.rollerFilter = 'blended-geometry-and-normals'; out.trueSpin = sample.spin; out.ownsNarrative = frame.ownsNarrative
    },
    mask(enabled: boolean) { ring.uniforms.diagnostic.value = enabled ? 1 : 0 },
    progress(value: number | null) { proofProgress = value },
    dispose() {
      if (disposed) return
      disposed = true
      if (mechanics) {
        try { mechanics.mixer.stopAllAction() } catch (error) { reportCleanup(cleanupReport, 'runtime', 'tool-animation', error) }
        if (tool) {
          try { mechanics.mixer.uncacheRoot(tool.scene) } catch (error) { reportCleanup(cleanupReport, 'runtime', 'tool-cache', error) }
        }
      }
      try { root.removeFromParent() } catch (error) { reportCleanup(cleanupReport, 'runtime', 'scene-root', error) }
      disposeRing(ring, 'runtime', cleanupReport)
      ownership?.dispose()
      probe.disposed++; probe.loaded = false
    },
  }

  probe.ringMeshes = ring.geometries.length; probe.toolMeshes = 0
  probe.ringBounds.radius = ring.radius; probe.ringBounds.width = ring.width
  for (let i = 0; i < 3; i++) { probe.ringBounds.min[i] = ring.union.min.getComponent(i); probe.ringBounds.max[i] = ring.union.max.getComponent(i); probe.ringBounds.center[i] = ring.center.getComponent(i) }
  runtime.sample(inputs.initialTime)
  return runtime
}
