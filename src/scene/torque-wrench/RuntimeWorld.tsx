/** Private live model host. Drawing and final camera recovery are integrated separately. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Group, PerspectiveCamera, PMREMGenerator, Vector3, type Object3D } from 'three'
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
import { createPrivateInspectionSample, samplePrivateInspection } from './InspectionDirector'
import { sampleMechanism, type MechanismSample } from './MechanismDirector'
import { createResourceScope } from './resourceScope'
import { createOpeningSampler, sampleOpening } from './OpeningDirector'
import { sampleOpeningCamera } from './OpeningCamera'
import { createCameraHandoff, type CameraHandoffPose } from './CameraHandoff'
import { PrivateSheet } from './PrivateSheet'
import type { DrawingFrameInput, PrivateSheetRuntime } from './privateSheetRuntime'
import { captureInstalledCutter, measureInstalledInspection } from './inspectionProof'
import { createInspectionFailureCollector } from './inspectionFailure'

const MODEL_URL = '/models/Default.glb'

export default function RuntimeWorld({ store, onFailure, playback }: TorqueSceneProps) {
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
    cameraSheetDistance: 1, delta: 0,
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
    inspection: { ready: false, subjectTime: 0, cameraTime: 0, machiningRate: 0, arcWeight: 0 },
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
          bakeInstalled: Boolean(baked), sheetVisible: Boolean(baked) && sheetFrame.retirement < 1 }
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
    try {
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
      bakeSheet({ gl, data: snapshot, layout: makeDrawingLayout(1, snapshot.bounds),
        tier: store.getState().tier === 'lite' ? 'lite' : 'full', signal: owned.signal,
        onCleanupFailure: errors => { if (errors.length) onFailure(new AggregateError(errors, 'Sheet cleanup failed')) },
      }).then(result => {
        owned.own(result)
        if (owned.current()) {
          bakedSheet.current = result
          probe.sheet.baked = true
          probe.sheet.tier = store.getState().tier === 'lite' ? 'lite' : 'full'
          probe.sheet.precomputed = result.stats.precomputed ?? -1
          probe.sheet.stats = { ...result.stats }
          setSheetBake(result)
        }
      }, error => { if (owned.current()) fail(error) })
    } catch (error) { fail(error); owned.dispose() }
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
  }, [gl, scene, rig, model, probe, onFailure, center])

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
      sheetFrame.intro = sampleOpeningFrame(progress, crossing)
      sheetFrame.delta = previousProgress.current === progress ? 0 : Math.min(delta, 0.1)
      previousProgress.current = progress
      sheetFrame.retirement = Math.max(0, Math.min(1, (progress - 0.46) / 0.04))
      const manual = playback?.isOpen() ?? false
      const studyProgress = manual
        ? 0.735 + (playback?.advance(delta, true) ?? 0) * 0.205
        : progress
      const studyVisible = manual || (progress >= 0.735 && progress < 0.94)
      const ringVisible = !manual && progress >= 0.69 && progress < 0.735
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
      writeWrenchMechanicsProbe(rig, channels, channels.ghostOpacity, probe.rig)
      if (group.current) group.current.visible = !studyVisible && !ringVisible
      if (!manual && progress >= 0.675 && !ring.current) {
        const source = rig.clutch.ringSwitch
        if (!source) throw new Error('Private ring source unavailable')
        const failures = createInspectionFailureCollector(reportFailure)
        const session = createStorySession('ring', { id: 2, current: owned.current, fail: failures.primary })
        owned.defer(() => session.cancel())
        let runtime: StoryRuntime
        try { runtime = createRingRuntimeCore(session, { gl, scene, hero: model, rig,
          tier: store.getState().tier === 'lite' ? 'lite' : 'full', aspect }, {
          source, meshes: rig.meshes.filter(mesh => rig.originalMaterials.get(mesh) === roleMaterial('ringSwitch')),
          initialTime: 0, getEntryElapsed: () => 2, probe: createRingRuntimeProbe(),
          onCleanupError: report => failures.cleanup(report),
        }) } catch (error) { failures.reject(error); throw error }
        failures.loading()
        ring.current = runtime
        scene.add(runtime.root)
        owned.defer(() => { failures.disposing(); try { runtime.dispose() } finally { failures.disposed() } })
        runtime.ready.then(() => failures.resolve(), error => {
          if (owned.current()) failures.reject(error)
          else failures.disposed()
        })
      }
      if (ring.current) {
        const runtime = ring.current
        runtime.sample(Math.max(0, Math.min(1, (progress - 0.69) / 0.045)) * 12)
        runtime.apply(); runtime.root.visible = ringVisible
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
        if (runtime.root.visible) {
          camera.position.copy(runtime.camera.position)
          target.copy(runtime.camera.target)
          camera.up.copy(runtime.camera.up)
          camera.fov = runtime.camera.fov
        }
      }
      if (!studyVisible && !ringVisible) {
        if (progress < 0.46 && layout.current) {
          sampleOpeningCamera(layout.current, aspect, progress, pose)
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
