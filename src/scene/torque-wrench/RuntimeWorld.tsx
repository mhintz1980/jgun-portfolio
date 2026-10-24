/** Private live model host. Drawing and final camera recovery are integrated separately. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, Group, Material, Matrix4, Mesh, MeshPhysicalMaterial, PerspectiveCamera, PMREMGenerator, Raycaster, Vector3, type Object3D } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { STAGE_IDS } from '../../data/caseStudies'
import { buildWrenchRig } from '../rig/nodeRoles'
import { applyWrenchMechanics, writeWrenchMechanicsProbe, type WrenchMechanicsProbe } from '../rig/wrenchMechanics'
import { makeDrawingLayout, snapshotDrawing } from '../drawing/drawingGeometry'
import { type SheetCameraPose } from '../drawing/sheetCamera'
import { bakeSheet, type SheetBakeResult } from '../drawing/sheet/sheetBake'
import { applyExtractionCore, createExtractionContext } from '../drawing/poseCore'
import { createShaftRuntime, type ShaftPresentation } from '../inspection/shaft/shaftRuntime'
import { shaftMetrePoint } from '../inspection/shaft/frame'
import { createStorySession } from '../inspection/session'
import type { StoryRuntime } from '../inspection/story'
import { createRingRuntimeCore, createRingRuntimeProbe } from '../inspection/ringRuntimeCore'
import { roleMaterial, RING_SWITCH_OD_MASK_FULL, RING_SWITCH_OD_MASK_START } from '../rig/materials'
import type { TorqueSceneProps } from './cadGate'
import {
  createPrivateInspectionSample,
  createPrivateRingCamera,
  RING_CLOSEUP_END,
  RING_CLOSEUP_START,
  RING_KNURL_DEPTH_MULTIPLIER,
  type PrivateRingFocus,
  ringTimeAt,
  samplePrivateInspection,
  samplePrivateRingCamera,
} from './InspectionDirector'
import { MECHANISM_TRANSLATION, RING_WINDOW_END, RING_WINDOW_START, sampleMechanism, type MechanismSample } from './MechanismDirector'
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
import { samplePrivateRing } from './RingInspection'
import { createJourneySample, sampleJourney } from './JourneyDirector'
import { createJourneyCameraSampler, createJourneyPose, orbitCamera } from './JourneyCamera'
import { createJourneyPlanes, effectiveMeshOpacity, measureShaftLandmarks, measureShaftDisplacement, registerShaft, registrationScale } from './shaftJourneyRegistration'
import { applyShaftLook } from './shaftJourneyLook'
import { captureGrooveProof, type GrooveCaptureOptions } from './grooveProof'
import { isTorqueHotspotActive } from './hotspotData'
import { createStopAndAppreciateController, type StopAndAppreciateTelemetry } from './stopAndAppreciate'

const MODEL_URL = '/models/Default.glb'

/**
 * T5 ring-study seams (canonical progress). Lazy mount precedes the first ring camera move;
 * the clone/source swap is bit-compatible at the anchor pose and happens inside the S0 plateau.
 */
const RING_LOAD_AT = 0.44
const RING_ACTIVE_START = 0.469
const RING_CAMERA_ENTRY_END = 0.4725
const GROOVE_NAMES = Object.freeze({ red: 'P000420 Speed Indicator (Red)', blue: 'P000420 Speed Indicator (Blue)' })

/** 26 surface extrema of a part, in its own frame, used as candidate callout anchors. */
function createSurfaceFeature(node: Object3D) {
  node.updateWorldMatrix(true, true)
  const inverse = node.matrixWorld.clone().invert(), transform = new Matrix4(), point = new Vector3()
  const directions: Vector3[] = [], points: Vector3[] = [], scores: number[] = []
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (!x && !y && !z) continue
    directions.push(new Vector3(x, y, z).normalize()); points.push(new Vector3()); scores.push(-Infinity)
  }
  const meshes: Mesh[] = []
  node.traverse(child => { if (child instanceof Mesh) meshes.push(child) })
  const visit = (each: (p: Vector3) => void) => {
    for (const mesh of meshes) {
      transform.multiplyMatrices(inverse, mesh.matrixWorld)
      const position = mesh.geometry.getAttribute('position')
      for (let i = 0; i < position.count; i++) each(point.fromBufferAttribute(position, i).applyMatrix4(transform))
    }
  }
  const bounds = new Box3()
  visit(p => {
    bounds.expandByPoint(p)
    for (let j = 0; j < directions.length; j++) scores[j] = Math.max(scores[j], p.dot(directions[j]))
  })
  // Average every vertex within 2% of the extreme: on a band or cylinder the radial extremum
  // is a whole edge-to-edge column, and its mid-point is the exposed face, not a chamfer edge.
  const tolerance = .02 * Math.max(1e-6, bounds.getSize(new Vector3()).length())
  const counts = directions.map(() => 0)
  visit(p => {
    for (let j = 0; j < directions.length; j++) {
      if (p.dot(directions[j]) >= scores[j] - tolerance) { points[j].add(p); counts[j]++ }
    }
  })
  for (let j = 0; j < directions.length; j++) if (counts[j]) points[j].multiplyScalar(1 / counts[j])
  return { node, points, scores, center: node.worldToLocal(new Box3().setFromObject(node).getCenter(new Vector3())), inverse: new Matrix4(), direction: new Vector3() }
}

interface SurroundingMaterialEntry {
  readonly mesh: Mesh
  readonly visible: boolean
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
    clone.onBeforeCompile = source.onBeforeCompile
    clone.customProgramCacheKey = source.customProgramCacheKey.bind(source)
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
  const ringExitCamera = useMemo(createPrivateRingCamera, [])
  const ringBaseDistance = useRef(.24)
  const ringExitPose = useMemo(createJourneyPose, [])
  const entryInverse = useMemo(() => new Matrix4(), [])
  const entryFromDirection = useMemo(() => new Vector3(), [])
  const entryToDirection = useMemo(() => new Vector3(), [])
  const ringAnchor = useMemo(() => new Matrix4(), [])
  // Canonical ring pose expressed relative to the extraction group, so the clone follows the
  // live extraction/recentering transform instead of freezing the pose from the load frame.
  const ringAnchorLocal = useMemo(() => new Matrix4(), [])
  const ringLocalCenter = useMemo(() => new Vector3(), [])
  const ringFocusPoint = useMemo(() => new Vector3(), [])
  const ringFocusInverse = useMemo(() => new Matrix4(), [])
  const ringWorldCenter = useMemo(() => new Vector3(), [])
  const ringKnurlMaterials = useRef<readonly PrivateRingKnurlMaterial[] | null>(null)
  // True only once the current ring runtime has resolved; the clone never replaces the source before.
  const ringReady = useRef(false)
  const surroundingMaterials = useRef<PrivateSurroundingMaterials | null>(null)
  const sourceRingMaterials = useRef<PrivateSurroundingMaterials | null>(null)
  const sourceKnurlProof = useMemo(() => {
    const proof = { outerVertices: 0, knurledOuterVertices: 0, boreVertices: 0, knurledBoreVertices: 0,
      faceVertices: 0, knurledFaceVertices: 0, maxRadius: 0, thresholdStart: RING_SWITCH_OD_MASK_START, thresholdFull: RING_SWITCH_OD_MASK_FULL }
    for (const mesh of rig.meshes) {
      if (rig.originalMaterials.get(mesh) !== roleMaterial('ringSwitch')) continue
      const p = mesh.geometry.getAttribute('position'), n = mesh.geometry.getAttribute('normal')
      for (let i = 0; i < p.count; i++) {
        const radius = Math.hypot(p.getX(i), p.getY(i)), normalLength = Math.hypot(n.getX(i), n.getY(i), n.getZ(i))
        const axial = Math.abs(n.getZ(i) / normalLength)
        const outward = (p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i)) / Math.max(radius * Math.hypot(n.getX(i), n.getY(i)), 1e-8)
        const masked = axial < .2 && outward >= .5 && radius >= RING_SWITCH_OD_MASK_FULL
        proof.maxRadius = Math.max(proof.maxRadius, radius)
        if (axial >= .2) { proof.faceVertices++; if (masked) proof.knurledFaceVertices++ }
        else if (outward < -.5) { proof.boreVertices++; if (masked) proof.knurledBoreVertices++ }
        else if (radius >= .0375 && outward >= .5) { proof.outerVertices++; if (masked) proof.knurledOuterVertices++ }
      }
    }
    return proof
  }, [rig])
  const openingFinalInkT = useRef(DEFAULT_FINAL_INK_T)
  const manualCamera = useMemo(() => ({ open: false, transitioning: false, elapsed: 0,
    from: { position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), fov: 42 } }), [])
  const stopAndAppreciate = useMemo(createStopAndAppreciateController, [])
  const appreciatePose = useMemo<CameraHandoffPose>(() => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), fov: 42 }), [])
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
  // Geometry bounds are measured once in each animation unit's local frame.
  // Projection follows its matrixWorld, including carrier rotation and extraction.
  const hotspots = useMemo(() => {
    model.updateWorldMatrix(true, true)
    const clutch = rig.meshes.find(mesh => mesh.name === GROOVE_NAMES.blue) ?? rig.clutch.static
    const nodes = [clutch, rig.clutch.ringSwitch, rig.lcdCluster?.readout ?? null, rig.stages.stage2.planets[0] ?? null]
    const ids = ['clutch-housing', 'ring-switch', 'lcd-manometer', 'stage2-planet']
    return nodes.map((node, i) => {
      const bounds = node ? new Box3().setFromObject(node) : new Box3()
      const world = bounds.isEmpty() ? new Vector3() : bounds.getCenter(new Vector3())
      const local = node ? node.worldToLocal(world.clone()) : new Vector3()
      return { id: ids[i], node, local, world: new Vector3(), projected: new Vector3(),
        radius: Math.max(.015, bounds.isEmpty() ? .015 : bounds.getSize(new Vector3()).length() / 2),
        screen: { id: ids[i], x: 0, y: 0, visible: false, reason: 'inactive', occluder: '' } }
    })
  }, [model, rig])
  const overlay = useMemo(() => ({ progress: 0, subjectTime: 0, studyVisible: false, manual: false,
    explode: 0, surroundingsOpacity: 1, ringVisible: false,
    focusId: null as string | null, anchors: hotspots.map(item => item.screen) }), [hotspots])
  const focus = useMemo(() => ({ id: null as string | null, weight: 0, progress: 0, initialized: false,
    position: new Vector3(), target: new Vector3(), direction: new Vector3() }), [])
  const hotspotRay = useMemo(() => new Raycaster(), [])
  const hotspotDirection = useMemo(() => new Vector3(), [])
  const hotspotHits = useMemo(() => [] as ReturnType<Raycaster['intersectObjects']>, [])
  const hotspotBlockers = useMemo(() => [] as Mesh[], [])
  const hotspotTick = useRef(0)
  // Sample actual surface vertices in each part's own frame. Bounds centres sit on the
  // drivetrain axis inside the part (a P000247 pin centre is hidden by the carrier plates,
  // the P003068/P000420 centres sit inside the housing), so a leader must terminate on a
  // visible surface extremum instead.
  const planetFeatures = useMemo(() => rig.stages.stage2.planets.map(createSurfaceFeature), [rig])
  const hotspotFeatures = useMemo(() => {
    const groove = (name: string) => rig.meshes.find(mesh => mesh.name === name) ?? null
    const features = (...nodes: (Object3D | null | undefined)[]) =>
      nodes.filter((node): node is Object3D => Boolean(node)).map(createSurfaceFeature)
    return {
      // The exposed groove is the clutch-housing feature this beat is about: blue while the
      // ring is down, red once it has shifted up (it covers the blue groove then).
      clutchDown: features(groove(GROOVE_NAMES.blue), groove(GROOVE_NAMES.red), rig.clutch.static),
      clutchUp: features(groove(GROOVE_NAMES.red), groove(GROOVE_NAMES.blue), rig.clutch.static),
      ring: features(rig.clutch.ringSwitch),
      lcd: features(rig.lcdCluster?.readout),
    }
  }, [rig])
  const blendCamera = useMemo(createCameraHandoff, [])
  const handoffFrom = useMemo<CameraHandoffPose>(() => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 42 }), [])
  const handoffTo = useMemo<CameraHandoffPose>(() => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 42 }), [])
  const handoffResult = useMemo<CameraHandoffPose>(() => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 42 }), [])
  const journey = useMemo(createJourneySample, [])
  const lastStudyProgress = useRef(0)
  const journeyCamera = useMemo(createJourneyCameraSampler, [])
  const journeyPose = useMemo(createJourneyPose, [])
  const registration = useMemo(() => new Matrix4(), [])
  const displacement = useMemo(() => new Matrix4(), [])
  const heldDisplacement = useMemo(() => new Matrix4(), [])
  const cameraRegistration = useMemo(() => new Matrix4(), [])
  const shaftRestInverse = useRef<Matrix4 | null>(null)
  const planes = useMemo(createJourneyPlanes, [])
  const presentation = useMemo<ShaftPresentation>(() => ({ entryOpaque: true, contextOpacity: 1, phaseCorrection: 0, narrativeAlpha: 0 }), [])
  const sourceShaftMaterials = useRef<PrivateSurroundingMaterials | null>(null)
  const probe = useMemo(() => ({
    ready: false, frames: 0, hiddenFrames: 0, progress: 0,
    rig: {} as WrenchMechanicsProbe,
    camera: { position: [0, 0, 0], target: [0, 0, 0], up: [0, 1, 0], quaternion: [0, 0, 0, 1], fov: 34 },
    inspection: { ready: false, subjectTime: 0, cameraTime: 0, machiningRate: 0, arcWeight: 0,
      feaDwellWeight: 0, hobSwingWeight: 0, surroundingsOpacity: 1 },
    ring: { ready: false, time: 0, cameraTime: 0, knurlMultiplier: RING_KNURL_DEPTH_MULTIPLIER,
      effectiveNormalStrength: 0, returnBlend: 0, sourceOpacity: 1, sourceVisible: true, cloneOpacity: 0 },
    isolation: { surroundingsOpacity: 1, manual: false, manualTransition: 'settled', ringVisible: false, shaftVisible: false },
    renderer: { calls: 0, triangles: 0, geometries: 0, textures: 0 },
    // Drawing/sheet observables: whether the bake installed, which tier it used, whether the
    // frozen precompute matched these inputs (precomputed 1) or the live bake ran (0), and the
    // side-view ink registration measured lazily on demand.
    sheet: { baked: false, tier: '', precomputed: -1, stats: {} as Record<string, number>,
      registration: null as unknown },
    journey: {} as Record<string, unknown>,
    stopAndAppreciate: {
      mode: 'idle', freeLookActive: false, whipBackActive: false, whipBackProgress: 1,
      passiveWeight: 0, yawDeg: 0, pitchDeg: 0, frozenProgress: null, wheelAccumPx: 0,
    } as StopAndAppreciateTelemetry,
    stage: 'stage3-model-host',
  }), [])

  useEffect(() => {
    const owned = createResourceScope(errors => onFailure(new AggregateError(errors, 'Private scene cleanup failed')))
    scope.current = owned
    const fail = (error: unknown) => { if (owned.current()) reportFailure(error) }
    const globals = window as unknown as Record<string, unknown>
    // Per-frame cost guard: this walks every source mesh and the whole study
    // runtime graph with regex tests, so it only runs when telemetry is read.
    const measureJourneyCensus = () => {
      const sourceShaft = rig.meshes.find(mesh => mesh.userData.partNumber === 'P001835')
      const sourceOpacities = rig.meshes.map(mesh => ({ part: mesh.userData.partNumber ?? mesh.name, opacity: effectiveMeshOpacity(mesh) }))
      let studyGearboxOpacity = 0, studyShaftOpacity = 0
      const studyContexts: Array<{name:string;opacity:number}> = []
      shaft.current?.root.traverse(object => {
        if (!(object instanceof Mesh)) return
        const opacity=effectiveMeshOpacity(object)
        let ancestor: Object3D | null=object, isShaft=false, isContext=false
        while(ancestor && ancestor!==shaft.current?.root) {
          if (/study-(legacyshaft|approvedshaft)/.test(ancestor.name)) isShaft=true
          if (/study-(housing|legacyhousing|.*bearing|.*ring)|shaft-finale|shaft-rigid-support-pair|study-narrative-rest-registration/.test(ancestor.name)) isContext=true
          ancestor=ancestor.parent
        }
        if(isShaft) studyShaftOpacity=Math.max(studyShaftOpacity,opacity)
        if(isContext && !isShaft) { studyGearboxOpacity=Math.max(studyGearboxOpacity,opacity);studyContexts.push({name:object.name,opacity}) }
      })
      const sourceGearboxVisible=rig.meshes.some(mesh=>mesh.userData.partNumber!=='P001835'&&effectiveMeshOpacity(mesh)>.001)
      const studyGearboxVisible=studyGearboxOpacity>.001
      return {...journey, oldInspectionProgress:lastStudyProgress.current,oldMechanismProgress:journey.mechanismProgress,
        sourceGearboxVisible,studyGearboxVisible,visibleGearboxCount:Number(sourceGearboxVisible)+Number(studyGearboxVisible),
        sourceShaftVisible:!!sourceShaft && effectiveMeshOpacity(sourceShaft)>.001,studyShaftVisible:studyShaftOpacity>.001,
        sourceOpacities,studyContexts,sourceShaftOpacity:sourceShaft?effectiveMeshOpacity(sourceShaft):0,studyShaftOpacity,
        sourceShaftMaterial:sourceShaft?(m=>({color:m.color.getHexString(),metalness:m.metalness,roughness:m.roughness,envMapIntensity:m.envMapIntensity}))(sourceShaft.material as unknown as {color:{getHexString():string};metalness:number;roughness:number;envMapIntensity:number}):null,
        cameraRegistrationMatrix:cameraRegistration.toArray(),registrationMatrix:registration.toArray(),registrationScale:registrationScale(registration),displacement:displacement.toArray()}
    }
    const port = {
      overlaySample: () => overlay,
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
          const runtimeDetail: Record<string, unknown> = {}
          ring.current.telemetry(runtimeDetail)
          copy.ring.runtime = { ...ringProbe, ...runtimeDetail }
          const subject = ring.current.root.getObjectByName('inspection-P003068-spin')
          ring.current.root.updateWorldMatrix(true, true)
          copy.ring.rootMatrix = ring.current.root.matrixWorld.toArray()
          copy.ring.subjectMatrix = subject?.matrixWorld.toArray() ?? null
          const bounds = subject ? new Box3().setFromObject(subject) : null
          copy.ring.worldBounds = bounds ? { min: bounds.min.toArray(), max: bounds.max.toArray() } : null
        }
        const sourceRing = rig.clutch.ringSwitch
        if (sourceRing) {
          sourceRing.updateWorldMatrix(true, true)
          const bounds = new Box3().setFromObject(sourceRing)
          copy.ring.sourceMatrix = sourceRing.matrixWorld.toArray()
          copy.ring.sourceBounds = { min: bounds.min.toArray(), max: bounds.max.toArray() }
        }
        const visibleRing = probe.isolation.ringVisible
          ? ring.current?.root.getObjectByName('inspection-P003068-spin') : sourceRing
        if (visibleRing) {
          visibleRing.updateWorldMatrix(true, true)
          const box = new Box3().setFromObject(visibleRing), point = new Vector3()
          const rect = [Infinity, Infinity, -Infinity, -Infinity]
          let behind = false
          for (let i = 0; i < 8; i++) {
            point.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera)
            behind ||= point.z > 1
            const x = (point.x + 1) * size.width / 2, y = (1 - point.y) * size.height / 2
            rect[0] = Math.min(rect[0], x); rect[1] = Math.min(rect[1], y)
            rect[2] = Math.max(rect[2], x); rect[3] = Math.max(rect[3], y)
          }
          copy.ring.projectedBounds = { rect, behind, viewport: [size.width, size.height] }
        }
        copy.ring.sourceMaterialPrograms = sourceRingMaterials.current
          ? [...sourceRingMaterials.current.unique.values()].map(material => material.customProgramCacheKey()) : []
        copy.ring.sourceKnurlSurface = sourceKnurlProof
        if (rig.handleRoot) {
          const box = new Box3().setFromObject(rig.handleRoot)
          copy.camera.handleBoundsClearance = box.distanceToPoint(camera.position)
        }
        copy.isolation.surroundingMeshCount = surroundingMaterials.current?.entries.length ?? 0
        copy.isolation.actualMaxOpacity = 0
        for (const entry of surroundingMaterials.current?.entries ?? []) {
          const materials = Array.isArray(entry.clone) ? entry.clone : [entry.clone]
          for (const material of materials) copy.isolation.actualMaxOpacity = Math.max(copy.isolation.actualMaxOpacity, material.opacity)
        }
        copy.journey = JSON.parse(JSON.stringify(measureJourneyCensus()))
        const sourceShaft = rig.meshes.find(mesh => mesh.userData.partNumber === 'P001835')
        if (sourceShaft && shaft.current) copy.journey.shaftLandmarks = measureShaftLandmarks(sourceShaft, shaft.current.root, registration)
        copy.isolation.progress = isolation.progress
        if (shaft.current) {
          const detail: Record<string, unknown> = {}
          shaft.current.telemetry(detail)
          copy.inspection.runtime = detail
        }
        return copy
      },
      inspection: () => {
        if (!shaft.current || !(camera instanceof PerspectiveCamera)) throw new Error('Installed study unavailable')
        return { ...measureInstalledInspection(shaft.current, camera), playback: playback?.snapshot() }
      },
      stressProbe: () => shaft.current?.stressProbe?.() ?? null,
      stressCapture: () => {
        if (!shaft.current) throw new Error('Installed study unavailable')
        return shaft.current.stressCapture?.(gl, camera)
      },
      grooveCapture: (options?: GrooveCaptureOptions) => {
        if (!(camera instanceof PerspectiveCamera)) throw new Error('Perspective camera unavailable')
        return captureGrooveProof(gl, scene, camera, rig.meshes, options)
      },
      /**
       * Diagnostic, read-only: projected screen rects (px, drawing-buffer space) of the two named
       * groove meshes plus their visibility and the current fade. Identity-isolated by NAME, so it is
       * not contaminated by drawing ink. Beauty visible/hidden captures are left to the parent.
       */
      grooveRects: () => {
        if (!(camera instanceof PerspectiveCamera)) throw new Error('Perspective camera unavailable')
        camera.updateMatrixWorld(true)
        const width = gl.domElement.width, height = gl.domElement.height
        const corner = new Vector3(), box = new Box3()
        const read = (name: string) => {
          const mesh = rig.meshes.find(candidate => candidate.name === name)
          if (!mesh) return null
          mesh.updateWorldMatrix(true, false)
          box.setFromObject(mesh)
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, behind = false
          for (let i = 0; i < 8; i++) {
            corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
            corner.project(camera)
            if (corner.z > 1) behind = true
            const x = (corner.x * 0.5 + 0.5) * width, y = (1 - (corner.y * 0.5 + 0.5)) * height
            minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          }
          const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
          return { name, visible: mesh.visible, behindCamera: behind, opacity: material?.opacity ?? null,
            rect: [minX, minY, maxX, maxY], drawingBuffer: [width, height] }
        }
        return { progress: probe.progress, shift: channels.shift, blue: read(GROOVE_NAMES.blue), red: read(GROOVE_NAMES.red),
          surroundingsOpacity: probe.isolation.surroundingsOpacity, ringVisible: probe.isolation.ringVisible }
      },
      cutterCapture: () => {
        if (!shaft.current || !(camera instanceof PerspectiveCamera)) throw new Error('Installed study unavailable')
        return captureInstalledCutter(shaft.current, gl, scene, camera)
      },
      toggleFreeLook: (force?: boolean) => stopAndAppreciate.toggleFreeLook(force, store.getProgress()),
      stopAndAppreciate: () => stopAndAppreciate.snapshot(),
    }
    globals.__torqueWorld = port
    const selectPart = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string | null }>).detail?.id
      // A DOM button can be activated between projection ticks. Its part stays
      // valid during that short transition even if the center ray just changed.
      if (id == null || (isTorqueHotspotActive(id, overlay.progress, overlay.explode, overlay.surroundingsOpacity,
        overlay.ringVisible, overlay.studyVisible, overlay.manual)
        && hotspots.some(item => item.id === id && item.node))) {
        if (id) stopAndAppreciate.toggleFreeLook(false, store.getProgress())
        focus.id = id ?? null
        focus.progress = store.getProgress()
        focus.initialized = false
      }
    }
    window.addEventListener('torque-part-focus', selectPart)
    owned.defer(() => window.removeEventListener('torque-part-focus', selectPart))
    owned.defer(() => { if (globals.__torqueWorld === port) delete globals.__torqueWorld })
    const hudHost = gl.domElement.parentElement
    const pageRoot = document.querySelector<HTMLElement>('.torque-page')
    const freeLookBtn = document.createElement('button')
    freeLookBtn.type = 'button'
    freeLookBtn.className = 'torque-freelook-toggle'
    freeLookBtn.dataset.torqueFreelookToggle = 'true'
    const syncFreeLookButton = (active: boolean) => {
      freeLookBtn.setAttribute('aria-pressed', String(active))
      freeLookBtn.textContent = active
        ? 'Exit Free Look (F) · Drag / Move to Orbit · Scroll to Resume'
        : 'Free Look / Inspect (F)'
      if (pageRoot) {
        if (active) pageRoot.setAttribute('data-torque-freelook', 'true')
        else {
          pageRoot.removeAttribute('data-torque-freelook')
          pageRoot.removeAttribute('data-torque-freelook-dragging')
        }
      }
    }
    syncFreeLookButton(false)
    const onFreeLookClick = () => {
      const next = stopAndAppreciate.toggleFreeLook(undefined, store.getProgress())
      syncFreeLookButton(next)
    }
    freeLookBtn.addEventListener('click', onFreeLookClick)
    hudHost?.appendChild(freeLookBtn)
    owned.defer(() => {
      freeLookBtn.removeEventListener('click', onFreeLookClick)
      freeLookBtn.remove()
      pageRoot?.removeAttribute('data-torque-freelook')
      pageRoot?.removeAttribute('data-torque-freelook-dragging')
    })
    const onPointerMove = (event: PointerEvent) => {
      const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight)
      stopAndAppreciate.setPointerNormalized((event.clientX / w) * 2 - 1, (event.clientY / h) * 2 - 1)
      stopAndAppreciate.movePointerDrag(event.clientX, event.clientY, w, h)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target === freeLookBtn) return
      if (stopAndAppreciate.snapshot().freeLookActive) {
        pageRoot?.setAttribute('data-torque-freelook-dragging', 'true')
      }
      stopAndAppreciate.beginPointerDrag(event.clientX, event.clientY)
    }
    const onPointerUp = () => {
      pageRoot?.removeAttribute('data-torque-freelook-dragging')
      stopAndAppreciate.endPointerDrag()
    }
    const onWheel = (event: WheelEvent) => {
      if (stopAndAppreciate.onWheelDelta(event.deltaY)) syncFreeLookButton(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key === 'f' || event.key === 'F') {
        const next = stopAndAppreciate.toggleFreeLook(undefined, store.getProgress())
        syncFreeLookButton(next)
      } else if (event.key === 'Escape' && stopAndAppreciate.snapshot().freeLookActive) {
        stopAndAppreciate.toggleFreeLook(false, store.getProgress())
        syncFreeLookButton(false)
      } else if (stopAndAppreciate.snapshot().freeLookActive) {
        const step = 0.12
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') { event.preventDefault(); stopAndAppreciate.nudgeOrbit(step, 0) }
        else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') { event.preventDefault(); stopAndAppreciate.nudgeOrbit(-step, 0) }
        else if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') { event.preventDefault(); stopAndAppreciate.nudgeOrbit(0, -step) }
        else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') { event.preventDefault(); stopAndAppreciate.nudgeOrbit(0, step) }
      }
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    owned.defer(() => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
    })
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
      const shaftMesh = rig.meshes.find(mesh => mesh.userData.partNumber === 'P001835')
      if (!shaftMesh?.parent) throw new Error('Rendered source P001835 missing')
      // This is a model-space displacement, independent of extraction and recentering.
      applyWrenchMechanics(rig, { shift: 0, explode: 0, gearAngle: 0, idle: 0 })
      model.updateWorldMatrix(true, true)
      shaftRestInverse.current = new Matrix4().copy(model.matrixWorld).invert().multiply(shaftMesh.parent.matrixWorld).invert()
      applyWrenchMechanics(rig, { shift: 1, explode: 0, gearAngle: 0, idle: 0 })
      measureShaftDisplacement(model, shaftMesh.parent, shaftRestInverse.current, heldDisplacement)
      // Rest snapshot is page-owned; cached merged rig and its materials are borrowed.
      applyWrenchMechanics(rig, { shift: 0, explode: 0, gearAngle: 0, idle: 0 })
      // snapshotDrawing recenters raw CAD world positions itself. Remove the host's
      // centering temporarily so StrictMode/remount cannot apply the offset twice.
      const host = centered.current
      host?.position.set(0, 0, 0)
      model.updateWorldMatrix(true, true)
      let snapshot: ReturnType<typeof snapshotDrawing>
      try { snapshot = snapshotDrawing({ ...rig, meshes: model.userData.journeyDrawingMeshes ?? rig.meshes }) }
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
      ringReady.current = false
      probe.inspection.ready = false
      probe.ring.ready = false
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
      const requestedProgress = stopAndAppreciate.resolveProgress(store.getProgress())
      sampleJourney(requestedProgress, probe.inspection.ready, journey)
      const progress = journey.effectiveProgress
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
        : journey.inspectionProgress
      const studyVisible = manual || journey.studyVisible
      // The ring camera leads the clone: it runs from the window start, the clone/source swap only
      // inside the S0 plateau and only once the clone runtime is ready.
      const ringCameraWindow = !manual && progress >= RING_WINDOW_START && progress < RING_WINDOW_END
      const ringVisible = ringCameraWindow && progress >= RING_ACTIVE_START && ringReady.current && !!ring.current
      sampleInspectionIsolation(progress, manual, studyProgress, isolation, journey)
      // Readiness guard: until the clone is ready the source ring stays the visible subject, so a
      // direct seek into the study never shows a blank frame.
      if (ringCameraWindow && !ringVisible && progress >= RING_ACTIVE_START) isolation.surroundingsOpacity = 1
      if (!ringCameraWindow) isolation.surroundingsOpacity = manual ? 0 : journey.surroundingsOpacity
      const surroundingsOpacity = isolation.surroundingsOpacity
      sheetFrame.surroundingsOpacity = surroundingsOpacity
      sampleMechanism(journey.mechanismProgress, channels)
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
      if (!surroundingMaterials.current && (manual || progress >= RING_LOAD_AT)) {
        const unique = new Map<Material, Material>()
        const ringUnique = new Map<Material, Material>()
        const shaftUnique = new Map<Material, Material>()
        const shaftEntries: SurroundingMaterialEntry[] = []
        let entries: SurroundingMaterialEntry[]
        const ringEntries: SurroundingMaterialEntry[] = []
        try {
          entries = []
          for (const mesh of rig.meshes) {
            const source = mesh.material
            if (!source) throw new Error('Surrounding material source unavailable')
            const isRing = rig.originalMaterials.get(mesh) === roleMaterial('ringSwitch')
            const isShaft = mesh.userData.partNumber === 'P001835'
            const entry = { mesh, source, visible: mesh.visible, clone: cloneMaterialShape(source, isShaft ? shaftUnique : isRing ? ringUnique : unique) }
            ;(isShaft ? shaftEntries : isRing ? ringEntries : entries).push(entry)
          }
        } catch (error) {
          for (const clone of unique.values()) clone.dispose()
          for (const clone of ringUnique.values()) clone.dispose()
          for (const clone of shaftUnique.values()) clone.dispose()
          throw error
        }
        for (const entry of entries) entry.mesh.material = entry.clone
        for (const entry of ringEntries) entry.mesh.material = entry.clone
        for (const entry of shaftEntries) entry.mesh.material = entry.clone
        sourceShaftMaterials.current = { entries: shaftEntries, unique: shaftUnique }
        surroundingMaterials.current = { entries, unique }
        sourceRingMaterials.current = { entries: ringEntries, unique: ringUnique }
        owned.defer(() => {
          if (surroundingMaterials.current?.unique === unique) surroundingMaterials.current = null
          if (sourceRingMaterials.current?.unique === ringUnique) sourceRingMaterials.current = null
          for (const entry of entries) { entry.mesh.material = entry.source; entry.mesh.visible = entry.visible }
          for (const entry of ringEntries) { entry.mesh.material = entry.source; entry.mesh.visible = entry.visible }
          for (const entry of shaftEntries) { entry.mesh.material = entry.source; entry.mesh.visible = entry.visible }
          if (sourceShaftMaterials.current?.unique === shaftUnique) sourceShaftMaterials.current = null
          for (const clone of unique.values()) clone.dispose()
          for (const clone of ringUnique.values()) clone.dispose()
          for (const clone of shaftUnique.values()) clone.dispose()
        })
      }
      const privateSurroundings = surroundingMaterials.current
      // Both painted grooves are features of the Clutch Housing (P000420), so they share its
      // context fade exactly: nothing of P000420 floats around the isolated Ring Switch (owner 04.png).
      if (privateSurroundings) {
        for (const { source, clone } of privateSurroundings.entries) {
          const fade = surroundingsOpacity
          if (Array.isArray(source) && Array.isArray(clone)) {
            for (let i = 0; i < source.length; i++) copyMaterialFade(source[i], clone[i], fade)
          } else if (!Array.isArray(source) && !Array.isArray(clone)) {
            copyMaterialFade(source, clone, fade)
          }
        }
      }
      writeWrenchMechanicsProbe(rig, channels, channels.ghostOpacity, probe.rig)
      if (group.current) group.current.visible = surroundingsOpacity > 0.001
      probe.isolation.surroundingsOpacity = surroundingsOpacity
      probe.isolation.manual = manual
      probe.isolation.ringVisible = ringVisible
      probe.isolation.shaftVisible = studyVisible
      overlay.progress = progress
      overlay.studyVisible = studyVisible; overlay.manual = manual
      overlay.explode = channels.explode; overlay.surroundingsOpacity = surroundingsOpacity; overlay.ringVisible = ringVisible
      if (!manual && progress >= RING_LOAD_AT && !ring.current) {
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
          sampleFrame: samplePrivateRing,
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
        if (group.current) {
          group.current.updateWorldMatrix(true, false)
          ringAnchorLocal.copy(group.current.matrixWorld).invert().multiply(ringAnchor)
        } else ringAnchorLocal.copy(ringAnchor)
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
            clone.polygonOffset = true
            clone.polygonOffsetFactor = -1
            clone.polygonOffsetUnits = -1
            const order = object.renderOrder
            object.renderOrder = 3
            owned.defer(() => { object.renderOrder = order })
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
        ringBaseDistance.current = runtime.camera.position.length()
        scene.add(runtime.root)
        runtime.ready.then(() => {
          if (owned.current()) { probe.ring.ready = true; ringReady.current = ring.current === runtime }
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
        // Re-derive the world anchor from the group's CURRENT transform every frame.
        if (group.current) {
          group.current.updateWorldMatrix(true, false)
          ringAnchor.multiplyMatrices(group.current.matrixWorld, ringAnchorLocal)
        }
        runtime.root.matrixAutoUpdate = false
        runtime.root.matrix.copy(ringAnchor)
        runtime.root.matrixWorldNeedsUpdate = true
        // The knurl close-up leans toward the live upper die so it frames the roller pressing into the OD.
        const dieWheel = runtime.root.getObjectByName('KT_UPPER_KNURL_WHEEL_RH')
        let ringFocus: PrivateRingFocus | undefined
        if (dieWheel && progress >= RING_CLOSEUP_START - .01 && progress <= RING_CLOSEUP_END + .01) {
          ringFocusPoint.setFromMatrixPosition(dieWheel.matrixWorld)
          runtime.root.updateWorldMatrix(true, false)
          ringFocusPoint.applyMatrix4(ringFocusInverse.copy(runtime.root.matrixWorld).invert())
          ringFocus = ringFocusPoint
        }
        const privateRingCamera = samplePrivateRingCamera(progress, ringBaseDistance.current, ringCamera, aspect, ringFocus)
        runtime.camera.position.set(privateRingCamera.px, privateRingCamera.py, privateRingCamera.pz)
        runtime.camera.target.set(privateRingCamera.tx, privateRingCamera.ty, privateRingCamera.tz)
        runtime.camera.up.set(privateRingCamera.ux, privateRingCamera.uy, privateRingCamera.uz)
        runtime.camera.position.applyMatrix4(ringAnchor)
        runtime.camera.target.applyMatrix4(ringAnchor)
        runtime.camera.up.transformDirection(ringAnchor)
        ringWorldCenter.setFromMatrixPosition(ringAnchor)
        runtime.camera.fov = privateRingCamera.fov
        const exit = samplePrivateRingCamera(.56, ringBaseDistance.current, ringExitCamera, aspect)
        ringExitPose.position.set(exit.px, exit.py, exit.pz).applyMatrix4(ringAnchor)
        ringExitPose.target.set(exit.tx, exit.ty, exit.tz).applyMatrix4(ringAnchor)
        ringExitPose.up.set(exit.ux, exit.uy, exit.uz).transformDirection(ringAnchor)
        ringExitPose.fov = exit.fov
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
        probe.ring.cameraTime = Math.max(0, progress - RING_WINDOW_START) * 1000
      }
      if ((manual || journey.preload) && !shaft.current) {
        const failures = createInspectionFailureCollector(reportFailure)
        const session = createStorySession('shaft', { id: 1, current: owned.current, fail: failures.primary })
        owned.defer(() => session.cancel())
        let runtime: StoryRuntime
        try { runtime = createShaftRuntime(session, { gl, scene, hero: model, rig, tier: store.getState().tier === 'lite' ? 'lite' : 'full', aspect }, {
          presentation,
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
      const sourceShaft = rig.meshes.find(mesh => mesh.userData.partNumber === 'P001835')
      if (sourceShaft?.parent && shaftRestInverse.current) {
        measureShaftDisplacement(model, sourceShaft.parent, shaftRestInverse.current, displacement)
        registerShaft(model.matrixWorld, displacement, registration)
        // Camera I remains anchored to the assembled transfer pose while the source explodes.
        registerShaft(model.matrixWorld, heldDisplacement, cameraRegistration)
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
        presentation.contextOpacity = manual ? 1 : journey.contextOpacity
        presentation.phaseCorrection = manual ? 0 : journey.phaseCorrection
        planes.restore()
        runtime.apply()
        planes.transform(runtime.root, registration)
        runtime.root.matrixAutoUpdate = false
        runtime.root.matrix.copy(registration); runtime.root.matrixWorldNeedsUpdate = true
        runtime.root.visible = studyVisible
        probe.inspection.subjectTime = inspection.subjectTime
        probe.inspection.cameraTime = inspection.cameraTime
        probe.inspection.machiningRate = inspection.machiningRate
        probe.inspection.arcWeight = inspection.arcWeight
        probe.inspection.feaDwellWeight = inspection.feaDwellWeight
        probe.inspection.hobSwingWeight = inspection.hobSwingWeight
        probe.inspection.surroundingsOpacity = inspection.surroundingsOpacity
        if (runtime.root.visible) {
          camera.position.copy(runtime.camera.position).applyMatrix4(registration)
          target.copy(runtime.camera.target).applyMatrix4(registration)
          camera.up.copy(runtime.camera.up).transformDirection(registration)
          camera.fov = runtime.camera.fov
        }
      }
      // The replacement ring shares the actual part's world pose. Hand it off
      // with an opaque source under the dissolving clone. Two transparent coincident
      // shells would lose coverage at mid-fade. Non-ring parts keep their own fade.
      const returnBlend = ring.current?.frame.returnBlend ?? 0
      const sourceShaftFade = manual ? 0 : journey.sourceShaftOpacity
      for (const { mesh, source, clone } of sourceShaftMaterials.current?.entries ?? []) {
        const sources = Array.isArray(source) ? source : [source], clones = Array.isArray(clone) ? clone : [clone]
        for (let i=0;i<sources.length;i++) { copyMaterialFade(sources[i],clones[i],sourceShaftFade); applyShaftLook(sources[i],clones[i],manual ? 0 : journey.sourceShaftLook) }
        mesh.visible = sourceShaftFade > .001
      }
      const sourceRingFade = manual ? 0 : ringVisible ? (returnBlend > 0 ? 1 : 0) : surroundingsOpacity
      for (const { mesh, source, clone } of sourceRingMaterials.current?.entries ?? []) {
        if (Array.isArray(source) && Array.isArray(clone)) {
          for (let i = 0; i < source.length; i++) copyMaterialFade(source[i], clone[i], sourceRingFade)
        } else if (!Array.isArray(source) && !Array.isArray(clone)) {
          copyMaterialFade(source, clone, sourceRingFade)
        }
        mesh.visible = sourceRingFade > 0.001
      }
      if (group.current) group.current.visible = surroundingsOpacity > 0.001 || sourceRingFade > 0.001 || sourceShaftFade > .001
      probe.ring.returnBlend = returnBlend
      probe.ring.sourceOpacity = sourceRingFade
      probe.ring.sourceVisible = sourceRingFade > 0.001
      probe.ring.cloneOpacity = ringVisible ? 1 - returnBlend : 0
      if (!studyVisible) {
        if (progress < 0.46 && layout.current) {
          sampleOpeningCamera(layout.current, aspect, progress, pose)
          camera.position.copy(pose.position); target.copy(pose.target); camera.up.copy(pose.up); camera.fov = pose.fov
        } else if (progress < .56) {
          // The mechanism is translated by +W: the unchanged legacy camera is sampled at p - W
          // (clamped to its own [.46,.675] domain, so the ring window holds its start pose).
          sampleLegacyMechanismCamera(progress - MECHANISM_TRANSLATION, aspect, channels.explode, pose)
          camera.position.copy(pose.position); target.copy(pose.target); camera.up.copy(pose.up); camera.fov = pose.fov
        } else {
          // Provisional mechanical overview; final opening/inspection handoffs remain gates.
          const spread = channels.explode
          const narrow = aspect < 0.8
          camera.position.set(0.32 - spread * .94, 0.16 + spread * .02, 0.42 - spread * .10)
          target.set(0, 0, -0.15 * spread)
          if (narrow) camera.position.lerpVectors(target, camera.position, 1 + 1.2 * spread)
          camera.up.set(0, 1, 0); camera.fov = narrow ? 58 : 42
        }
      }
      // Resolve each private domain join from current canonical samples, never a
      // previous-frame pose. The next subject may load early but keeps its
      // original visibility/mechanical window. Quintic weights stop at seams.
      let handoffStart = 0, handoffEnd = 0
      const ringCam = !manual && progress >= RING_WINDOW_START && progress <= .56 && !studyVisible && ring.current ? ring.current.camera : null
      if (ringCam && progress < RING_CAMERA_ENTRY_END) {
        // Entry moves on a ring-centred arc while the context fades.
        handoffStart = RING_WINDOW_START; handoffEnd = RING_CAMERA_ENTRY_END
        handoffTo.position.copy(ringCam.position)
        handoffTo.target.copy(ringCam.target)
        handoffTo.up.copy(ringCam.up); handoffTo.fov = ringCam.fov
      } else if (ringCam) {
        camera.position.copy(ringCam.position); target.copy(ringCam.target)
        camera.up.copy(ringCam.up); camera.fov = ringCam.fov
      }
      if (handoffEnd > handoffStart) {
        handoffFrom.position.copy(camera.position); handoffFrom.target.copy(target)
        handoffFrom.up.copy(camera.up); handoffFrom.fov = camera.fov
        entryInverse.copy(ringAnchor).invert()
        entryFromDirection.subVectors(handoffFrom.position, handoffFrom.target).transformDirection(entryInverse)
        entryToDirection.subVectors(handoffTo.position, handoffTo.target).transformDirection(entryInverse)
        const azA = Math.atan2(entryFromDirection.x, entryFromDirection.z), azB = Math.atan2(entryToDirection.x, entryToDirection.z)
        const shortest = Math.atan2(Math.sin(azB - azA), Math.cos(azB - azA))
        orbitCamera(handoffFrom, handoffTo, (progress - handoffStart) / (handoffEnd - handoffStart), ringAnchor, handoffResult, shortest >= 0 ? 1 : -1)
        camera.position.copy(handoffResult.position); target.copy(handoffResult.target)
        camera.up.copy(handoffResult.up); camera.fov = handoffResult.fov
      }
      if (!manual && progress >= .56 && progress <= 1) {
        journeyCamera(progress, aspect, cameraRegistration, journeyPose, ring.current ? ringExitPose : undefined)
        camera.position.copy(journeyPose.position);target.copy(journeyPose.target);camera.up.copy(journeyPose.up);camera.fov=journeyPose.fov
      }
      // Journey census (opacity sweep + study traversal) is built on demand in snapshot().
      lastStudyProgress.current = studyProgress
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
      if (!manual && !manualCamera.transitioning) {
        appreciatePose.position.copy(camera.position)
        appreciatePose.target.copy(target)
        appreciatePose.up.copy(camera.up)
        appreciatePose.fov = camera.fov
        stopAndAppreciate.applyCamera(delta, progress, appreciatePose, probe.stopAndAppreciate)
        camera.position.copy(appreciatePose.position)
        target.copy(appreciatePose.target)
        camera.up.copy(appreciatePose.up)
        camera.fov = appreciatePose.fov
      }
      // Inspection focus is a local override. Native scroll releases it back to
      // the current authored camera without changing the narrative clock.
      // A focused callout also releases when its own beat ends or a special sequence begins.
      if (focus.id && (Math.abs(progress - focus.progress) > .0003 || probe.stopAndAppreciate.freeLookActive
        || !isTorqueHotspotActive(focus.id, progress, channels.explode, surroundingsOpacity, ringVisible, studyVisible, manual))) focus.id = null
      const selected = hotspots.find(item => item.id === focus.id)
      if (selected?.node) {
        selected.node.updateWorldMatrix(true, false)
        selected.world.copy(selected.local).applyMatrix4(selected.node.matrixWorld)
        if (!focus.initialized) {
          focus.direction.subVectors(camera.position, target).normalize()
          if (selected.id === 'clutch-housing') focus.direction.set(-.85, .22, .48).normalize().transformDirection(ringAnchor)
          if (selected.id === 'lcd-manometer') selected.node.getWorldDirection(focus.direction)
          focus.initialized = true
        }
        focus.target.copy(selected.world)
        const minimumDistance = selected.id === 'clutch-housing' ? .24 : .11
        focus.position.copy(selected.world).addScaledVector(focus.direction, Math.max(minimumDistance, selected.radius * 3.6))
      }
      focus.weight += ((selected ? 1 : 0) - focus.weight) * (1 - Math.exp(-8 * Math.min(delta, .1)))
      if (focus.weight > .0001) {
        camera.position.lerp(focus.position, focus.weight)
        target.lerp(focus.target, focus.weight)
      }
      overlay.focusId = focus.id
      overlay.subjectTime = inspection.subjectTime
      camera.lookAt(target); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true)
      hotspotTick.current += Math.min(delta, .1)
      if (hotspotTick.current >= .075) {
        hotspotTick.current = 0
        model.updateWorldMatrix(true, true)
        hotspotBlockers.length = 0
        for (const mesh of rig.meshes) {
          let visible = true, parent: Object3D | null = mesh
          while (parent) { if (!parent.visible) { visible = false; break }; parent = parent.parent }
          if (visible && effectiveMeshOpacity(mesh) >= .5) hotspotBlockers.push(mesh)
        }
        for (const item of hotspots) {
          // One callout per dedicated beat and none during special sequences (Session 1C, owner 05-1/05-2.png).
          const active = isTorqueHotspotActive(item.id, progress, channels.explode, surroundingsOpacity, ringVisible, studyVisible, manual)
          item.screen.visible = false
          item.screen.reason = 'inactive'; item.screen.occluder = ''
          if (!active || !item.node) continue
          {
            const candidates = item.id === 'stage2-planet' ? planetFeatures
              : item.id === 'clutch-housing' ? (channels.shift >= .5 ? hotspotFeatures.clutchUp : hotspotFeatures.clutchDown)
                : item.id === 'ring-switch' ? hotspotFeatures.ring : hotspotFeatures.lcd
            for (const candidate of candidates) {
              candidate.inverse.copy(candidate.node.matrixWorld).invert()
              candidate.direction.copy(camera.position).applyMatrix4(candidate.inverse).sub(candidate.center).normalize()
              // The most camera-facing real surface vertex is the most useful
              // leader endpoint. Try the four nearest surface extrema.
              for (let k = 0; k < candidate.points.length; k++) candidate.scores[k] = candidate.points[k].dot(candidate.direction)
              // The LCD readout is a flat decal: its centre is on the visible face, so try it first.
              for (let j = item.id === 'lcd-manometer' ? -1 : 0; j < 4; j++) {
                if (j < 0) item.world.copy(candidate.center).applyMatrix4(candidate.node.matrixWorld)
                else {
                  let best = 0
                  for (let k = 1; k < candidate.scores.length; k++) if (candidate.scores[k] > candidate.scores[best]) best = k
                  candidate.scores[best] = -Infinity
                  item.world.copy(candidate.points[best]).applyMatrix4(candidate.node.matrixWorld)
                }
                item.projected.copy(item.world).project(camera)
                item.screen.reason = 'outside-view'
                if (Math.abs(item.projected.x) > .96 || Math.abs(item.projected.y) > .94 || Math.abs(item.projected.z) > 1) continue
                hotspotDirection.subVectors(item.world, camera.position)
                hotspotRay.far = hotspotDirection.length() + .0005
                hotspotRay.set(camera.position, hotspotDirection.normalize())
                hotspotHits.length = 0
                hotspotRay.intersectObjects(hotspotBlockers, false, hotspotHits)
                const hit = hotspotHits[0]
                item.screen.reason = 'occluded'; item.screen.occluder = hit?.object.name || '(unnamed surface)'
                let belongs = false, ancestor: Object3D | null = hit?.object ?? null
                while (ancestor) { if (ancestor === candidate.node) { belongs = true; break }; ancestor = ancestor.parent }
                // No hit: nothing stands in front (code-built decals are not raycast blockers).
                if (hit && !belongs) continue
                item.node = candidate.node; item.local.copy(candidate.center)
                item.screen.x = (item.projected.x * .5 + .5) * size.width
                item.screen.y = (.5 - item.projected.y * .5) * size.height
                item.screen.visible = true; item.screen.reason = 'visible'
                item.screen.occluder = ''
                break
              }
              if (item.screen.visible) break
            }
            continue
          }
        }
      }
      sheetFrame.cameraLookTargetWorld = target
      sheetFrame.cameraSheetDistance = camera.position.distanceTo(target)
      probe.progress = progress; probe.frames++
      camera.position.toArray(probe.camera.position)
      target.toArray(probe.camera.target)
      camera.up.toArray(probe.camera.up)
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
