/** Private live model host. Drawing and final camera recovery are integrated separately. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, Group, Material, Matrix4, Mesh, MeshPhysicalMaterial, PerspectiveCamera, PMREMGenerator, Vector3, type Object3D } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { STAGE_IDS } from '../../data/caseStudies'
import { buildWrenchRig } from '../rig/nodeRoles'
import { applyWrenchMechanics, writeWrenchMechanicsProbe, type WrenchMechanicsProbe } from '../rig/wrenchMechanics'
import { makeDrawingLayout, snapshotDrawing } from '../drawing/drawingGeometry'
import { type SheetCameraPose } from '../drawing/sheetCamera'
import { bakeSheet, type SheetBakeResult } from '../drawing/sheet/sheetBake'
import { applyExtractionCore, createExtractionContext } from '../drawing/poseCore'
import { createShaftRuntime } from '../inspection/shaft/shaftRuntime'
import { shaftMetrePoint } from '../inspection/shaft/frame'
import { createStorySession } from '../inspection/session'
import type { StoryRuntime } from '../inspection/story'
import { createRingRuntimeCore, createRingRuntimeProbe } from '../inspection/ringRuntimeCore'
import { roleMaterial } from '../rig/materials'
import type { TorqueSceneProps } from './cadGate'
import {
  createPrivateInspectionSample,
  createPrivateRingCamera,
  RING_KNURL_DEPTH_MULTIPLIER,
  ringTimeAt,
  samplePrivateInspection,
  samplePrivateRingCamera,
} from './InspectionDirector'
import { sampleMechanism, type MechanismSample } from './MechanismDirector'
import { createResourceScope } from './resourceScope'
import { createOpeningSampler, DEFAULT_FINAL_INK_T, finalInkTimeFromStyles, sampleOpening } from './OpeningDirector'
import { sampleOpeningCamera } from './OpeningCamera'
import { sampleLegacyMechanismCamera } from './LegacyMechanismCamera'
import { createCameraHandoff, type CameraHandoffPose } from './CameraHandoff'
import { PrivateSheet } from './PrivateSheet'
import type { DrawingFrameInput, PrivateSheetRuntime } from './privateSheetRuntime'
import { captureInstalledCutter, measureInstalledInspection } from './inspectionProof'
import { createInspectionFailureCollector } from './inspectionFailure'
import { applyPrivateSheetContent } from './privateSheetContent'
import { sampleInspectionIsolation, type InspectionIsolationSample } from './inspectionIsolation'
import { captureCanonicalRingAnchor } from './ringAnchor'

const MODEL_URL = '/models/Default.glb'

interface SurroundingMaterialEntry {
  readonly mesh: Mesh
  readonly source: Material | Material[]
  readonly clone: Material | Material[]
}

interface PrivateSurroundingMaterials {
  readonly entries: readonly SurroundingMaterialEntry[]
  readonly unique: ReadonlyMap<Material, Material>
}

interface PrivateRingKnurlMaterial {
  readonly mesh: Mesh
  readonly source: MeshPhysicalMaterial
  readonly clone: MeshPhysicalMaterial
}

function cloneMaterialShape(source: Material | Material[], unique: Map<Material, Material>): Material | Material[] {
  if (Array.isArray(source)) return source.map(value => cloneMaterialShape(value, unique) as Material)
  let clone = unique.get(source)
  if (!clone) {
    clone = source.clone()
    clone.transparent = true
    unique.set(source, clone)
  }
  return clone
}

function copyMaterialFade(source: Material, clone: Material, fade: number): void {
  clone.opacity = source.opacity * fade
  const transparent = source.transparent || fade < 0.999
  if (clone.transparent !== transparent) { clone.transparent = transparent; clone.needsUpdate = true }
  clone.depthWrite = source.depthWrite && fade > 0.5
}

export default function RuntimeWorld({ store, onFailure, playback, isolation }: TorqueSceneProps & { isolation: InspectionIsolationSample }) {
  // Explicit decoder URL is local to this hook; no global preload or root hero import.
  const { scene: model } = useGLTF(MODEL_URL, '/draco/')
  const { gl, scene, camera, size } = useThree()
  const rig = useMemo(() => buildWrenchRig(model), [model])
  const center = useMemo(() => [-rig.center.x, -rig.center.y, -rig.center.z] as const, [rig])
  const group = useRef<Group>(null)
  const centered = useRef<Group>(null)
  const aspect = size.width / Math.max(1, size.height)
  const scope = useRef<ReturnType<typeof createResourceScope> | null>(null)
  const terminal = useRef(false)
  const reportFailure = useCallback((error: unknown) => {
    if (terminal.current) return
    terminal.current = true
    onFailure(error)
  }, [onFailure])
  const reportSheetCleanup = useCallback((errors: readonly unknown[]) => {
    if (errors.length) reportFailure(new AggregateError(errors, 'Sheet presentation cleanup failed'))
  }, [reportFailure])
  const shaft = useRef<StoryRuntime | null>(null)
  const ring = useRef<StoryRuntime | null>(null)
  const ringProbe = useMemo(createRingRuntimeProbe, [])
  const ringCamera = useMemo(createPrivateRingCamera, [])
  const ringAnchor = useMemo(() => new Matrix4(), [])
  const ringLocalCenter = useMemo(() => new Vector3(), [])
  const ringWorldCenter = useMemo(() => new Vector3(), [])
  const ringKnurlMaterials = useRef<readonly PrivateRingKnurlMaterial[] | null>(null)
  const surroundingMaterials = useRef<PrivateSurroundingMaterials | null>(null)
  const openingFinalInkT = useRef(DEFAULT_FINAL_INK_T)
  const manualCamera = useMemo(() => ({ open: false, transitioning: false, elapsed: 0,
    from: { position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), fov: 42 } }), [])
  const drawing = useRef<ReturnType<typeof snapshotDrawing> | null>(null)
  const layout = useRef<ReturnType<typeof makeDrawingLayout> | null>(null)
  const [sheetBake, setSheetBake] = useState<SheetBakeResult | null>(null)
  // Parent-lane observable: the baked sheet result is owned by this effect, but the probe port is
  // created before it exists, so registration/stats are read lazily through this ref.
  const bakedSheet = useRef<SheetBakeResult | null>(null)
  const sheetRuntime = useRef<PrivateSheetRuntime | null>(null)
  const installSheetRuntime = useCallback((runtime: PrivateSheetRuntime | null) => { sheetRuntime.current = runtime }, [])
  const extractionContext = useMemo(createExtractionContext, [])
  const sheetFrame = useMemo<DrawingFrameInput>(() => ({ intro: sampleOpening(0),
    tier: store.getState().tier === 'lite' ? 'lite' : 'full', reducedMotion: false,
    proofMode: 'normal', retirement: 0, cameraLookTargetWorld: null,
    surroundingsOpacity: 1, cameraSheetDistance: 1, delta: 0,
  }), [store])
  const previousProgress = useRef<number | null>(null)
  const sampleOpeningFrame = useMemo(createOpeningSampler, [])
  const readSheetFrame = useMemo(() => () => sheetFrame, [sheetFrame])
  const pose = useMemo<SheetCameraPose>(() => ({
    position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0),
    fov: 34, ortho: 0, distance: 1,
  }), [])
  const channels = useMemo<MechanismSample>(() => ({ shift: 0, explode: 0, gearAngle: 0, idle: 0, ghostOpacity: 1 }), [])
  const inspection = useMemo(createPrivateInspectionSample, [])
  const target = useMemo(() => new Vector3(), [])
  const blendCamera = useMemo(createCameraHandoff, [])
  const handoffFrom = useMemo<CameraHandoffPose>(() => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 42 }), [])
  const handoffTo = useMemo<CameraHandoffPose>(() => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 42 }), [])
  const handoffResult = useMemo<CameraHandoffPose>(() => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 42 }), [])
  const shaftEntry = useMemo(createPrivateInspectionSample, [])
  const probe = useMemo(() => ({
    ready: false, frames: 0, hiddenFrames: 0, progress: 0,
    rig: {} as WrenchMechanicsProbe,
    camera: { position: [0, 0, 0], target: [0, 0, 0], quaternion: [0, 0, 0, 1], fov: 34 },
    inspection: { ready: false, subjectTime: 0, cameraTime: 0, machiningRate: 0, arcWeight: 0,
      feaDwellWeight: 0, hobSwingWeight: 0, surroundingsOpacity: 1 },
    ring: { ready: false, time: 0, cameraTime: 0, knurlMultiplier: RING_KNURL_DEPTH_MULTIPLIER,
      effectiveNormalStrength: 0 },
    isolation: { surroundingsOpacity: 1, manual: false, manualTransition: 'settled', ringVisible: false, shaftVisible: false },
    renderer: { calls: 0, triangles: 0, geometries: 0, textures: 0 },
    // Drawing/sheet observables: whether the bake installed, which tier it used, whether the
    // frozen precompute matched these inputs (precomputed 1) or the live bake ran (0), and the
    // side-view ink registration measured lazily on demand.
    sheet: { baked: false, tier: '', precomputed: -1, stats: {} as Record<string, number>,
      registration: null as unknown },
    stage: 'stage3-model-host',
  }), [])

  useEffect(() => {
    const owned = createResourceScope(errors => onFailure(new AggregateError(errors, 'Private scene cleanup failed')))
    scope.current = owned
    const fail = (error: unknown) => { if (owned.current()) reportFailure(error) }
    const globals = window as unknown as Record<string, unknown>
    const port = {
      pitInputs: () => sheetRuntime.current?.pitInputs(),
      pitGeometryAb: (candidate: number[]) => {
        if (!sheetRuntime.current) throw new Error('Private sheet unavailable')
        return sheetRuntime.current.pitGeometryAb(gl, camera, candidate)
      },
      effectsCapture: () => {
        if (!sheetRuntime.current) throw new Error('Private sheet unavailable')
        return sheetRuntime.current.captureEffects(gl, camera)
      },
      electricityCapture: () => {
        if (!sheetRuntime.current) throw new Error('Private sheet unavailable')
        return sheetRuntime.current.captureElectricity(gl, camera)
      },
      snapshot: () => {
        const copy = JSON.parse(JSON.stringify(probe))
        const context = gl.getContext()
        const debug = context.getExtension('WEBGL_debug_renderer_info')
        copy.renderer.backend = debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null
        copy.renderer.effectiveDpr = gl.getPixelRatio()
        copy.renderer.drawingBuffer = [context.drawingBufferWidth, context.drawingBufferHeight]
        // pulseRegistration is lazy and cached inside the bake result; never throws for a live bake.
        copy.sheet.registration = bakedSheet.current ? bakedSheet.current.pulseRegistration() : null
        const base = (node: Object3D | null) => node ? rig.basePositions.get(node)?.z ?? null : null
        // Opening/pit telemetry for the Stage 4 recovery A/B: the canonical intro state the
        // private sheet is actually rendering, plus the solved bake crossing when installed.
        // Read the bake through its ref: this port's effect does not re-run when the bake state
        // lands, so a captured `sheetBake` binding would report a stale null forever.
        const baked = bakedSheet.current
        copy.sheet.stats = baked ? { ...baked.stats } : {}
        copy.opening = { ...sheetFrame.intro, retirement: sheetFrame.retirement,
          sheetDistance: sheetFrame.cameraSheetDistance, tier: sheetFrame.tier,
          crossing: baked?.extraction.crossing ?? null,
          finalInkT: openingFinalInkT.current,
          bakeInstalled: Boolean(baked), sheetVisible: Boolean(baked) && sheetFrame.retirement < 1 }
        const display = rig.lcdCluster?.readout
        if (display) {
          display.updateWorldMatrix(true, false)
          const centre = new Box3().setFromObject(display).getCenter(new Vector3())
          const facing = display.getWorldDirection(new Vector3()).dot(new Vector3().subVectors(camera.position, centre).normalize())
          copy.lcdDisplay = { centreWorld: centre.toArray(), centreNdc: centre.project(camera).toArray(), facing }
        }
        copy.mechanical = {
          channels: { ...channels }, tier: store.getState().tier,
          bearingZ: rig.bearing?.position.z ?? null,
          baseZ: { handleZ: base(rig.handleRoot), outputZ: base(rig.outputShaft), clutchZ: base(rig.clutch.static),
            slidingZ: base(rig.clutch.sliding), ringSwitchZ: base(rig.clutch.ringSwitch), bearingZ: base(rig.bearing),
            stageZ: STAGE_IDS.map(id => base(rig.stages[id].carrier)) },
          present: { handle: !!rig.handleRoot, output: !!rig.outputShaft, clutch: !!rig.clutch.static,
            sliding: !!rig.clutch.sliding, ringSwitch: !!rig.clutch.ringSwitch, bearing: !!rig.bearing,
            stages: STAGE_IDS.map(id => !!rig.stages[id].carrier) },
          planetRotByStage: STAGE_IDS.map(id => rig.stages[id].planets.map(planet => planet.rotation.z)),
          ghostMaterials: [...rig.ghostMaterials].map(([mesh, material]) => ({ mesh: mesh.name,
            opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite,
            attached: Array.isArray(mesh.material) ? mesh.material.includes(material) : mesh.material === material,
          })).sort((a, b) => a.mesh.localeCompare(b.mesh)),
        }
        if (ring.current) {
          const subject = ring.current.root.getObjectByName('inspection-P003068-spin')
          ring.current.root.updateWorldMatrix(true, true)
          copy.ring.rootMatrix = ring.current.root.matrixWorld.toArray()
          copy.ring.subjectMatrix = subject?.matrixWorld.toArray() ?? null
          const bounds = subject ? new Box3().setFromObject(subject) : null
          copy.ring.worldBounds = bounds ? { min: bounds.min.toArray(), max: bounds.max.toArray() } : null
        }
        copy.isolation.progress = isolation.progress
        return copy
      },
      inspection: () => {
        if (!shaft.current || !(camera instanceof PerspectiveCamera)) throw new Error('Installed study unavailable')
        return { ...measureInstalledInspection(shaft.current, camera), playback: playback?.snapshot() }
      },
      cutterCapture: () => {
        if (!shaft.current || !(camera instanceof PerspectiveCamera)) throw new Error('Installed study unavailable')
        return captureInstalledCutter(shaft.current, gl, scene, camera)
      },
    }
    globals.__torqueWorld = port
    owned.defer(() => { if (globals.__torqueWorld === port) delete globals.__torqueWorld })
    const contextLost = (event: Event) => { event.preventDefault(); fail(new Error('Private WebGL context lost')) }
    gl.domElement.addEventListener('webglcontextlost', contextLost)
    owned.defer(() => gl.domElement.removeEventListener('webglcontextlost', contextLost))
    const waitVisible = async () => {
      if (document.hidden) await new Promise<void>((resolve, reject) => {
        const cleanup = () => { document.removeEventListener('visibilitychange', visible); owned.signal.removeEventListener('abort', aborted) }
        const visible = () => { if (!document.hidden) { cleanup(); resolve() } }
        const aborted = () => { cleanup(); reject(new DOMException('Private initialization cancelled', 'AbortError')) }
        document.addEventListener('visibilitychange', visible)
        owned.signal.addEventListener('abort', aborted, { once: true })
        if (owned.signal.aborted) aborted()
      })
    }
    const initializeVisible = async () => {
    try {
      await waitVisible()
      if (!owned.current()) return
      // Rest snapshot is page-owned; cached merged rig and its materials are borrowed.
      applyWrenchMechanics(rig, { shift: 0, explode: 0, gearAngle: 0, idle: 0 })
      // snapshotDrawing recenters raw CAD world positions itself. Remove the host's
      // centering temporarily so StrictMode/remount cannot apply the offset twice.
      const host = centered.current
      host?.position.set(0, 0, 0)
      model.updateWorldMatrix(true, true)
      let snapshot: ReturnType<typeof snapshotDrawing>
      try { snapshot = snapshotDrawing(rig) }
      finally { host?.position.set(...center); model.updateWorldMatrix(true, true) }
      owned.own(snapshot.geometry)
      drawing.current = snapshot
      layout.current = makeDrawingLayout(aspect, snapshot.bounds)
      owned.defer(() => { if (drawing.current === snapshot) drawing.current = null })
      const pmrem = owned.own(new PMREMGenerator(gl))
      const room = owned.own(new RoomEnvironment())
      const environment = owned.own(pmrem.fromScene(room, 0.04))
      scene.environment = environment.texture
      scene.environmentIntensity = 1
      owned.defer(() => { if (scene.environment === environment.texture) scene.environment = null })
      gl.localClippingEnabled = true
      probe.ready = true
      bakeSheet({ gl, data: snapshot, layout: makeDrawingLayout(1, snapshot.bounds), content: applyPrivateSheetContent,
        beforeGpu: waitVisible,
        tier: store.getState().tier === 'lite' ? 'lite' : 'full', signal: owned.signal,
        onCleanupFailure: errors => { if (errors.length) onFailure(new AggregateError(errors, 'Sheet cleanup failed')) },
      }).then(result => {
        owned.own(result)
        if (owned.current()) {
          const styles = result.lines.geometry.getAttribute('aStyle')
          openingFinalInkT.current = finalInkTimeFromStyles(styles.array as ArrayLike<number>, styles.itemSize)
          bakedSheet.current = result
          probe.sheet.baked = true
          probe.sheet.tier = store.getState().tier === 'lite' ? 'lite' : 'full'
          probe.sheet.precomputed = result.stats.precomputed ?? -1
          probe.sheet.stats = { ...result.stats }
          setSheetBake(result)
        }
      }, error => { if (owned.current()) fail(error) })
    } catch (error) { if (owned.current()) { fail(error); owned.dispose() } }
    }
    void initializeVisible()
    return () => {
      probe.ready = false
      bakedSheet.current = null
      probe.sheet.baked = false
      probe.sheet.stats = {}
      owned.dispose()
      shaft.current = null
      ring.current = null
      if (scope.current === owned) scope.current = null
    }
  }, [gl, scene, rig, model, probe, onFailure, center, isolation])

  useEffect(() => {
    if (drawing.current) layout.current = makeDrawingLayout(aspect, drawing.current.bounds)
  }, [aspect])

  useFrame((_state, delta) => {
    const owned = scope.current
    if (terminal.current || !owned?.current() || !probe.ready || !(camera instanceof PerspectiveCamera)) return
    if (document.hidden) { probe.hiddenFrames++; return }
    try {
      const progress = store.getProgress()
      const crossing = sheetBake?.extraction.crossing ?? 0.9
      sheetFrame.intro = sampleOpeningFrame(progress, crossing, openingFinalInkT.current)
      sheetFrame.delta = previousProgress.current === progress ? 0 : Math.min(delta, 0.1)
      previousProgress.current = progress
      sheetFrame.retirement = Math.max(0, Math.min(1, (progress - 0.46) / 0.04))
      const manual = playback?.isOpen() ?? false
      if (manual !== manualCamera.open) {
        manualCamera.open = manual; manualCamera.transitioning = true; manualCamera.elapsed = 0
        manualCamera.from.position.copy(camera.position); manualCamera.from.target.copy(target)
        manualCamera.from.up.copy(camera.up); manualCamera.from.fov = camera.fov
      }
      const studyProgress = manual
        ? 0.735 + (playback?.advance(manualCamera.transitioning ? 0 : delta, true) ?? 0) * 0.205
        : progress
      const studyVisible = manual || (progress >= 0.735 && progress < 0.94)
      const ringVisible = !manual && progress >= 0.69 && progress < 0.735
      sampleInspectionIsolation(progress, manual, studyProgress, isolation)
      const surroundingsOpacity = isolation.surroundingsOpacity
      sheetFrame.surroundingsOpacity = surroundingsOpacity
      sampleMechanism(progress, channels)
      applyWrenchMechanics(rig, channels)
      if (sheetBake && group.current) {
        applyExtractionCore(sheetFrame.intro.poseT, sheetBake.layout, sheetBake.extraction,
          sheetBake.flex, sheetFrame.tier, extractionContext)
        group.current.matrixAutoUpdate = false
        group.current.matrix.copy(extractionContext.modelMatrix)
        group.current.matrixWorldNeedsUpdate = true
      }
      for (const material of rig.ghostMaterials.values()) {
        material.opacity = channels.ghostOpacity
        // Preserve the legacy host's transparent-capable clone and depth law.
        material.depthWrite = channels.ghostOpacity > 0.5
      }
      if (!surroundingMaterials.current && !manual && progress >= 0.655) {
        const unique = new Map<Material, Material>()
        let entries: SurroundingMaterialEntry[]
        try {
          entries = rig.meshes.map(mesh => {
          const source = mesh.material
          if (!source) throw new Error('Surrounding material source unavailable')
            return { mesh, source, clone: cloneMaterialShape(source, unique) }
          })
        } catch (error) {
          for (const clone of unique.values()) clone.dispose()
          throw error
        }
        for (const entry of entries) entry.mesh.material = entry.clone
        surroundingMaterials.current = { entries, unique }
        owned.defer(() => {
          if (surroundingMaterials.current?.unique === unique) surroundingMaterials.current = null
          for (const entry of entries) entry.mesh.material = entry.source
          for (const clone of unique.values()) clone.dispose()
        })
      }
      const privateSurroundings = surroundingMaterials.current
      if (privateSurroundings) {
        for (const { source, clone } of privateSurroundings.entries) {
          if (Array.isArray(source) && Array.isArray(clone)) {
            for (let i = 0; i < source.length; i++) copyMaterialFade(source[i], clone[i], surroundingsOpacity)
          } else if (!Array.isArray(source) && !Array.isArray(clone)) {
            copyMaterialFade(source, clone, surroundingsOpacity)
          }
        }
      }
      writeWrenchMechanicsProbe(rig, channels, channels.ghostOpacity, probe.rig)
      if (group.current) group.current.visible = surroundingsOpacity > 0.001
      probe.isolation.surroundingsOpacity = surroundingsOpacity
      probe.isolation.manual = manual
      probe.isolation.ringVisible = ringVisible
      probe.isolation.shaftVisible = studyVisible
      if (!manual && progress >= 0.655 && !ring.current) {
        const source = rig.clutch.ringSwitch
        if (!source) throw new Error('Private ring source unavailable')
        const failures = createInspectionFailureCollector(reportFailure)
        const session = createStorySession('ring', { id: 2, current: owned.current, fail: failures.primary })
        owned.defer(() => session.cancel())
        let runtime: StoryRuntime
        model.updateWorldMatrix(true, true)
        try { runtime = createRingRuntimeCore(session, { gl, scene, hero: model, rig,
          tier: store.getState().tier === 'lite' ? 'lite' : 'full', aspect }, {
          source, meshes: rig.meshes.filter(mesh => rig.originalMaterials.get(mesh) === roleMaterial('ringSwitch')),
          initialTime: 0, getEntryElapsed: () => 2, probe: ringProbe,
          onCleanupError: report => failures.cleanup(report),
        }) } catch (error) { failures.reject(error); throw error }
        owned.defer(() => { failures.disposing(); try { runtime.dispose() } finally { failures.disposed() } })
        source.updateWorldMatrix(true, true)
        const inverse = source.matrixWorld.clone().invert(), union = new Box3(), bounds = new Box3(), transform = new Matrix4()
        for (const mesh of rig.meshes.filter(mesh => rig.originalMaterials.get(mesh) === roleMaterial('ringSwitch'))) {
          mesh.geometry.computeBoundingBox()
          bounds.copy(mesh.geometry.boundingBox!).applyMatrix4(transform.multiplyMatrices(inverse, mesh.matrixWorld))
          union.union(bounds)
        }
        union.getCenter(ringLocalCenter)
        captureCanonicalRingAnchor(rig, ringLocalCenter, channels, ringAnchor)
        const spin = runtime.root.getObjectByName('inspection-P003068-spin')
        if (!spin) throw new Error('Private ring material host unavailable')
        const knurl: PrivateRingKnurlMaterial[] = []
        try {
          spin.traverse(object => {
            if (!(object instanceof Mesh) || !(object.material instanceof MeshPhysicalMaterial)) return
            const source = object.material
            const clone = source.clone()
            clone.onBeforeCompile = source.onBeforeCompile
            clone.customProgramCacheKey = source.customProgramCacheKey.bind(source)
            knurl.push({ mesh: object, source, clone })
          })
        } catch (error) {
          for (const { clone } of knurl) clone.dispose()
          throw error
        }
        for (const { mesh, clone } of knurl) mesh.material = clone
        if (!knurl.length) throw new Error('Private ring knurl material unavailable')
        ringKnurlMaterials.current = knurl
        owned.defer(() => {
          if (ringKnurlMaterials.current === knurl) ringKnurlMaterials.current = null
          for (const material of knurl) { material.mesh.material = material.source; material.clone.dispose() }
        })
        failures.loading()
        ring.current = runtime
        scene.add(runtime.root)
        runtime.ready.then(() => {
          if (owned.current()) probe.ring.ready = true
          failures.resolve()
        }, error => {
          if (owned.current()) failures.reject(error)
          else failures.disposed()
        })
      }
      if (ring.current) {
        const runtime = ring.current
        const ringTime = ringTimeAt(progress)
        runtime.sample(ringTime)
        runtime.apply(); runtime.root.visible = ringVisible
        runtime.root.matrixAutoUpdate = false
        runtime.root.matrix.copy(ringAnchor)
        runtime.root.matrixWorldNeedsUpdate = true
        const ringDistance = runtime.camera.position.length()
        const privateRingCamera = samplePrivateRingCamera(progress, ringDistance, ringCamera)
        runtime.camera.position.set(privateRingCamera.px, privateRingCamera.py, privateRingCamera.pz)
        runtime.camera.target.set(privateRingCamera.tx, privateRingCamera.ty, privateRingCamera.tz)
        runtime.camera.up.set(privateRingCamera.ux, privateRingCamera.uy, privateRingCamera.uz)
        runtime.camera.position.applyMatrix4(ringAnchor)
        runtime.camera.target.applyMatrix4(ringAnchor)
        runtime.camera.up.transformDirection(ringAnchor)
        ringWorldCenter.setFromMatrixPosition(ringAnchor)
        runtime.camera.fov = privateRingCamera.fov
        const knurl = ringKnurlMaterials.current
        if (knurl) {
          let effectiveNormalStrength = 0
          for (const { source, clone } of knurl) {
            clone.color.copy(source.color)
            clone.roughness = source.roughness
            clone.opacity = source.opacity
            clone.transparent = source.transparent
            if (clone.opacity < .999) clone.transparent = true
            clone.depthWrite = source.depthWrite
            clone.normalScale.set(
              source.normalScale.x * RING_KNURL_DEPTH_MULTIPLIER,
              source.normalScale.y * RING_KNURL_DEPTH_MULTIPLIER,
            )
            effectiveNormalStrength = Math.max(effectiveNormalStrength, clone.normalScale.x)
          }
          probe.ring.effectiveNormalStrength = effectiveNormalStrength
        }
        probe.ring.time = ringTime
        probe.ring.cameraTime = ringTime
        if (ringVisible) {
          camera.position.copy(runtime.camera.position); target.copy(runtime.camera.target)
          camera.up.copy(runtime.camera.up); camera.fov = runtime.camera.fov
        }
      }
      if ((studyVisible || (!manual && progress >= 0.72)) && !shaft.current) {
        const failures = createInspectionFailureCollector(reportFailure)
        const session = createStorySession('shaft', { id: 1, current: owned.current, fail: failures.primary })
        owned.defer(() => session.cancel())
        let runtime: StoryRuntime
        try { runtime = createShaftRuntime(session, { gl, scene, hero: model, rig, tier: store.getState().tier === 'lite' ? 'lite' : 'full', aspect }, {
          onCleanupFailure: reports => {
            failures.cleanupMany(reports.map(failure => ({ phase: failures.phase(), ...failure })))
          },
        }) } catch (error) { failures.reject(error); throw error }
        failures.loading()
        shaft.current = runtime
        scene.add(runtime.root)
        owned.defer(() => { failures.disposing(); try { runtime.dispose() } finally { failures.disposed(); runtime.root.removeFromParent() } })
        runtime.ready.then(() => {
          failures.resolve()
          if (owned.current()) probe.inspection.ready = true
        }, error => { if (owned.current()) failures.reject(error); else failures.disposed() })
      }
      if (shaft.current) {
        const runtime = shaft.current
        samplePrivateInspection(studyProgress, aspect, inspection)
        runtime.sample(inspection.subjectTime)
        const c = inspection.camera
        shaftMetrePoint(runtime.camera.position, c.px, c.py, c.pz)
        shaftMetrePoint(runtime.camera.target, c.tx, c.ty, c.tz)
        shaftMetrePoint(runtime.camera.up, c.ux, c.uy, c.uz).normalize()
        runtime.camera.fov = c.fov
        runtime.apply()
        runtime.root.visible = studyVisible
        probe.inspection.subjectTime = inspection.subjectTime
        probe.inspection.cameraTime = inspection.cameraTime
        probe.inspection.machiningRate = inspection.machiningRate
        probe.inspection.arcWeight = inspection.arcWeight
        probe.inspection.feaDwellWeight = inspection.feaDwellWeight
        probe.inspection.hobSwingWeight = inspection.hobSwingWeight
        probe.inspection.surroundingsOpacity = inspection.surroundingsOpacity
        if (runtime.root.visible) {
          camera.position.copy(runtime.camera.position)
          target.copy(runtime.camera.target)
          camera.up.copy(runtime.camera.up)
          camera.fov = runtime.camera.fov
        }
      }
      // The replacement ring shares the actual part's world pose. Hand it off
      // at full opacity; only neighbouring components follow the isolation fade.
      for (const mesh of rig.meshes) {
        if (rig.originalMaterials.get(mesh) === roleMaterial('ringSwitch')) {
          mesh.visible = !ringVisible
        }
      }
      if (!studyVisible && !ringVisible) {
        if (progress < 0.46 && layout.current) {
          sampleOpeningCamera(layout.current, aspect, progress, pose)
          camera.position.copy(pose.position); target.copy(pose.target); camera.up.copy(pose.up); camera.fov = pose.fov
        } else if (progress < .69) {
          sampleLegacyMechanismCamera(progress, aspect, channels.explode, pose)
          camera.position.copy(pose.position); target.copy(pose.target); camera.up.copy(pose.up); camera.fov = pose.fov
        } else {
          // Provisional mechanical overview; final opening/inspection handoffs remain gates.
          const spread = channels.explode
          const narrow = aspect < 0.8
          camera.position.set(0.32, 0.16, 0.42 + spread * 0.32)
          target.set(0, 0, -0.15 * spread)
          camera.up.set(0, 1, 0); camera.fov = narrow ? 58 : 42
        }
      }
      // Resolve each private domain join from current canonical samples, never a
      // previous-frame pose. The next subject may load early but keeps its
      // original visibility/mechanical window. Quintic weights stop at seams.
      let handoffStart = 0, handoffEnd = 0
      if (!manual && progress >= 0.675 && progress < 0.69 && ring.current) {
        handoffStart = 0.675; handoffEnd = 0.69
        handoffTo.position.copy(ring.current.camera.position)
        handoffTo.target.copy(ring.current.camera.target)
        handoffTo.up.copy(ring.current.camera.up); handoffTo.fov = ring.current.camera.fov
      } else if (!manual && progress >= 0.72 && progress < 0.735) {
        handoffStart = 0.72; handoffEnd = 0.735
        const entry = samplePrivateInspection(0.735, aspect, shaftEntry).camera
        shaftMetrePoint(handoffTo.position, entry.px, entry.py, entry.pz)
        shaftMetrePoint(handoffTo.target, entry.tx, entry.ty, entry.tz)
        shaftMetrePoint(handoffTo.up, entry.ux, entry.uy, entry.uz).normalize()
        handoffTo.fov = entry.fov
      } else if (!manual && progress >= 0.925 && progress < 0.94) {
        handoffStart = 0.925; handoffEnd = 0.94
        handoffTo.position.set(0.32, 0.16, 0.74)
        handoffTo.target.set(0, 0, -0.15); handoffTo.up.set(0, 1, 0)
        handoffTo.fov = aspect < 0.8 ? 58 : 42
      }
      if (handoffEnd > handoffStart) {
        handoffFrom.position.copy(camera.position); handoffFrom.target.copy(target)
        handoffFrom.up.copy(camera.up); handoffFrom.fov = camera.fov
        blendCamera(handoffFrom, handoffTo, progress, handoffStart, handoffEnd, handoffResult)
        camera.position.copy(handoffResult.position); target.copy(handoffResult.target)
        camera.up.copy(handoffResult.up); camera.fov = handoffResult.fov
      }
      if (manualCamera.transitioning) {
        manualCamera.elapsed = Math.min(1, manualCamera.elapsed + Math.min(delta, .1))
        handoffTo.position.copy(camera.position); handoffTo.target.copy(target)
        handoffTo.up.copy(camera.up); handoffTo.fov = camera.fov
        blendCamera(manualCamera.from, handoffTo, manualCamera.elapsed, 0, 1, handoffResult)
        camera.position.copy(handoffResult.position); target.copy(handoffResult.target)
        camera.up.copy(handoffResult.up); camera.fov = handoffResult.fov
        if (manualCamera.elapsed === 1) manualCamera.transitioning = false
      }
      probe.isolation.manualTransition = manualCamera.transitioning ? (manual ? 'entering' : 'exiting') : 'settled'
      camera.lookAt(target); camera.updateProjectionMatrix()
      sheetFrame.cameraLookTargetWorld = target
      sheetFrame.cameraSheetDistance = camera.position.distanceTo(target)
      probe.progress = progress; probe.frames++
      camera.position.toArray(probe.camera.position)
      target.toArray(probe.camera.target)
      camera.quaternion.toArray(probe.camera.quaternion)
      probe.camera.fov = camera.fov
      probe.renderer.calls = gl.info.render.calls; probe.renderer.triangles = gl.info.render.triangles
      probe.renderer.geometries = gl.info.memory.geometries; probe.renderer.textures = gl.info.memory.textures
    } catch (error) { reportFailure(error) }
  }, -2)

  return <>
    <ambientLight intensity={0.25} />
    <directionalLight position={[1.5, 2, 1]} intensity={1.7} />
    <directionalLight position={[-2, 1, -1.5]} intensity={0.6} color="#7dd3fc" />
    <group ref={group} name="private-wrench-world" dispose={null}>
      <group ref={centered} position={center}><primitive object={model} dispose={null} /></group>
    </group>
    {sheetBake && <PrivateSheet baked={sheetBake} frame={readSheetFrame} context={extractionContext} onRuntime={installSheetRuntime}
      onCleanupFailure={reportSheetCleanup} />}
  </>
}
