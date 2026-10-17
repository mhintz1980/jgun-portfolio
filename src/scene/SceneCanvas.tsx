import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import type { PerformanceMonitorApi } from '@react-three/drei'
import { CanvasTexture, Color, DirectionalLight, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, PointLight, Scene, SpotLight, WebGLRenderTarget, Vector4 } from 'three'
import { CameraRig } from './CameraRig'
import { InspectionScene } from './inspection/InspectionScene'
import { StationDriver } from './stations/StationDriver'
import { BackdropRig } from './backgrounds/BackdropRig'
import { SpatialRig } from './SpatialRig'
import { SpatialWorld } from './SpatialWorld'
import { TorqueWrenchHero } from './TorqueWrenchHero'
import { PostProcessingComposer } from './PostProcessingComposer'
import { degradeQuality, forcePoster, getQuality, useQuality } from '../state/qualityStore'
import type { QualityTier } from '../state/qualityStore'
import { LCD_REVEAL_WINDOW } from '../data/caseStudies'
import { getScrollState, telemetry } from '../state/scrollStore'
import { STAGE_TRANSITIONS } from './stages/stageWindows'
import { drawingIntroState } from './drawing/introTimeline'
import { drawingRuntime } from './drawing/extractionPose'
import { exitInspection, setInspectionSuspend, useInspection } from '../state/inspectionStore'
import { renderOwnership } from './inspection/renderLease'
import { compileWithLease } from './inspection/compileLease'
import { explodeShadowOpacity, lcdMicroRimIntensity, studioSpotNudge } from './jgunVisualGates'
import { computeRenderBudget } from './torque-wrench/renderBudget'

/** Adaptive DPR clamp — never above 1.5 or the device's own ratio. */
const MAX_DPR = Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1)

/**
 * Explicit DPR staircase (1.5 → 1.25 → 1), clamped to the device ratio.
 * When the staircase is exhausted and frames still drop, we escalate to the
 * next quality tier instead (lite: dissolve shader off; poster: no canvas).
 */
const DPR_STEPS = [MAX_DPR, 1.25, 1].filter(
  (value, index, all) => value <= MAX_DPR && all.indexOf(value) === index,
)

/** Apply the shared pixel ceiling to the actual Canvas CSS size, including resize. */
function RootRenderBudget({ requestedDpr, tier }: { requestedDpr: number; tier: 'full' | 'lite' }) {
  const { size, viewport, setDpr } = useThree()
  useLayoutEffect(() => {
    if (size.width <= 0 || size.height <= 0) return
    const deviceDpr = Math.min(requestedDpr, window.devicePixelRatio)
    const budget = computeRenderBudget(size.width, size.height, deviceDpr, tier)
    if (viewport.dpr !== budget.dpr) setDpr(budget.dpr)
  }, [size.width, size.height, viewport.dpr, requestedDpr, tier, setDpr])
  return null
}

/**
 * P1 mechanical timestamp diagnostic (2026-10-08) — bounded chronology of the
 * opening quality collapse. Discrete quality-lifecycle moments only (warmup
 * lifecycle, offscreen cull renders, PerformanceMonitor callbacks); every
 * event carries the same performance.now() clock drei samples with, plus the
 * tier / DPR step / warmReady state at that instant. No per-frame writes, no
 * React state, no threshold or adaptation change: app code never reads this
 * buffer — proof scripts query window.__qualityEvents().
 */
type QualityEventType =
  | 'warmstart'
  | 'warmfinish'
  | 'warmcancel'
  | 'cullrenderstart'
  | 'cullrenderend'
  | 'ondecline'
  | 'onincline'
  | 'onfallback'
  | 'dprstep'
  | 'degradequality'

interface QualityEvent {
  /** performance.now() ms — the same clock PerformanceMonitor samples. */
  t: number
  type: QualityEventType
  /** Quality tier at event time. */
  tier: QualityTier
  /** DPR staircase index at event time. */
  step: number
  /** telemetry.performance.warmReady at event time. */
  warmReady: boolean
  /** Monitor fps at callback events. */
  fps?: number
  /** Monitor flip-flop count at callback events. */
  flipped?: number
  /** Offscreen cull-render combination index (0..4). */
  index?: number
}

const QUALITY_EVENT_CAP = 256
const qualityEvents: QualityEvent[] = []
/**
 * Query guard (parent review 2026-10-08): the diagnostic is opt-in via
 * ?qualityDiagnostics. Without the param there is no buffering, no window API
 * and no monitor-callback work beyond one argument check — the default path
 * pays a single URLSearchParams read at module load.
 */
const QUALITY_DIAGNOSTICS_ENABLED =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('qualityDiagnostics')
/** Mirror of the component's stepRef so module-level pushes can stamp it. */
let qualityEventStep = 0

function pushQualityEvent(draft: {
  type: QualityEventType
  fps?: number
  flipped?: number
  index?: number
}): void {
  if (!QUALITY_DIAGNOSTICS_ENABLED) return
  if (qualityEvents.length >= QUALITY_EVENT_CAP) qualityEvents.shift()
  qualityEvents.push({
    t: performance.now(),
    type: draft.type,
    tier: getQuality().tier,
    step: qualityEventStep,
    warmReady: telemetry.performance.warmReady,
    fps: draft.fps,
    flipped: draft.flipped,
    index: draft.index,
  })
}

/** Guarded proof query: bounded snapshot copy; never read by app code. */
if (typeof window !== 'undefined' && QUALITY_DIAGNOSTICS_ENABLED) {
  ;(window as unknown as Record<string, unknown>).__qualityEvents = () => qualityEvents.slice()
}

/** Deterministic HDR softboxes: vertex-colour roll-off, with dark flags between them. */
function createStudioEnvironment() {
  const studio = new Scene()
  studio.name = 'ProceduralStudioEnvironment'
  studio.background = new Color(0.025, 0.03, 0.04)

  const addSoftbox = (width: number, height: number, position: [number, number, number], tint: string, gain: number) => {
    const geometry = new PlaneGeometry(width, height, 32, 32)
    const positions = geometry.getAttribute('position')
    const colors = new Float32Array(positions.count * 3)
    const color = new Color(tint).multiplyScalar(gain)
    for (let i = 0; i < positions.count; i++) {
      const u = Math.abs(positions.getX(i) / (width * 0.5))
      const v = Math.abs(positions.getY(i) / (height * 0.5))
      const edge = smoothstep01((1 - u) / 0.45) * smoothstep01((1 - v) / 0.45)
      colors[i * 3] = color.r * edge
      colors[i * 3 + 1] = color.g * edge
      colors[i * 3 + 2] = color.b * edge
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    const panel = new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, toneMapped: false }))
    panel.position.set(...position)
    panel.lookAt(0, 0, 0)
    studio.add(panel)
  }

  addSoftbox(6, 9, [-6, 5, 6], '#f4f6ff', 6)
  addSoftbox(4, 7, [7, 2, 3], '#d7e8ff', 3)
  addSoftbox(7, 5, [0, 8, -1], '#ffffff', 4.5)
  addSoftbox(2, 8, [2, 2, -7], '#e6efff', 8)
  // A broad neutral bounce occupies the lower/front hemisphere, restoring fill on
  // downward-facing black metal without raising every existing highlight globally.
  addSoftbox(14, 10, [0, -6.5, 7.5], '#f5f7f9', 1.2)

  // Unlit black flags create negative fill and long dark breaks in cylindrical reflections.
  for (const position of [[-5, 0, -4], [5, -2, 0]] as const) {
    const flag = new Mesh(new PlaneGeometry(4, 10), new MeshBasicMaterial({ color: 0x000000, side: DoubleSide, toneMapped: false }))
    flag.position.set(position[0], position[1], position[2])
    flag.lookAt(0, 0, 0)
    studio.add(flag)
  }
  return studio
}

/** Bake once into the existing 256-face CubeUV budget; retain only the environment target. */
function StudioEnvironmentIbl() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const studio = createStudioEnvironment()
    const previousEnvironment = scene.environment
    const previousIntensity = scene.environmentIntensity
    const previousProbe = (window as any).__threeScene
    let target: WebGLRenderTarget
    try {
      target = pmrem.fromScene(studio, 0.04, 0.1, 100, { size: 256 })
    } finally {
      studio.traverse(object => {
        if (object instanceof Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) material.dispose()
        }
      })
      pmrem.dispose()
    }
    scene.environment = target.texture
    scene.environmentIntensity = 1.0
    ;(window as any).__threeScene = scene
    return () => {
      if ((window as any).__threeScene === scene) (window as any).__threeScene = previousProbe
      if (scene.environment === target.texture) {
        scene.environment = previousEnvironment
        scene.environmentIntensity = previousIntensity
      }
      target.dispose()
    }
  }, [gl, scene])

  return null
}

/**
 * CR-5 / JG-025 — soft fill behind the handle LCD face.
 * Activates only during the shared post-explode rear-LCD reveal window so the
 * dwell has stable reflections without lighting the pre-explode ghost beat.
 * JG-025 retune (owner light canon 2026-09-02: soft, never squint-inducing,
 * still sharp and legible): cool-neutral to match the reference's studio mood
 * — the screen readout is now the warm/bright element, so the fill no longer
 * needs the old warm cast, and the peak steps down with the emissive @ 5
 * screen gone.
 */
function LcdFillLight() {
  const lightRef = useRef<PointLight>(null)

  useFrame(() => {
    if (!lightRef.current) return
    if (renderOwnership.blocked) return
    const { progress } = getScrollState()
    // Ease over 0.02 of scroll (~40vh) — the pre-repair 0.004 ramp was ~3 frames.
    const fadeIn = Math.min(Math.max((progress - LCD_REVEAL_WINDOW.start) / 0.02, 0), 1)
    const fadeOut = Math.min(Math.max((LCD_REVEAL_WINDOW.end - progress) / 0.02, 0), 1)
    const w = Math.min(fadeIn, fadeOut)
    lightRef.current.intensity = w * 2.4
  })

  return (
    <pointLight
      ref={lightRef}
      // Behind/above the rear cap at the measured dwell: the exploded LCD
      // cluster sits at world [−0.14, 0, 0.46] (see LCD_ORBIT_KEYFRAMES notes).
      position={[-0.24, 0.08, 0.56]}
      color="#e6eef7"
      intensity={0}
      distance={0.35}
      decay={2}
    />
  )
}

/**
 * Global studio key/fill/spot — the balance tuned for the JGun hero's
 * photoreal PBR pass (CH.01/02). JG-021 materials round 3: the MSP
 * enclosure's retained CAD palette is bright and clips deep under this
 * studio (blown-hot 14-19% of the St.2 subject region). Live-perturbation
 * attribution pinned the driver on the RoomEnvironment IBL — not the
 * punctual rig and not material.envMapIntensity, which does not modulate
 * scene.environment in this three version (env 1.0→0: region hot
 * 56,399→464; env 0.5 under this rig: 0.13% blown, avgL 54.9). So BOTH
 * the punctual rig and scene.environmentIntensity ease to floors while
 * Station 2 owns the frame, riding the SAME STAGE_TRANSITIONS windows as
 * the station swap so the choreography masks the crossfade. Station 3
 * keeps the full studio — its committed look passed owner review.
 */
const STUDIO_KEY_INTENSITY = 1.7
const STUDIO_FILL_INTENSITY = 0.6
const STUDIO_SPOT_INTENSITY = 1.1
/** Punctual + environment floors while the MSP enclosure is up. */
const STUDIO_STATION2_SCALE = 0.25
/** JG-021 glow experiment 5: env floor 0.5 → 0.35 (−30%) — after bloom and
 * both particle systems were exonerated, the residual halo points at the
 * station's light level. Revert value: 0.5. */
const STUDIO_ENV_STATION2 = 0.35

const smoothstep01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

// The studio's directional softboxes need different gains as the retained camera
// turns from black housings to the exposed steel/LCD and the enclosure. Interpolate
// calibrated shot values rather than globally overexposing the LCD dwell.
const STUDIO_IBL_SHOTS: readonly (readonly [number, number])[] = [
  [0, 1], [0.12, 1], [0.15, 16], [0.22, 8], [0.35, 6],
  [0.47, 1.5], [0.525, 1.5], [0.565, 4], [0.72, 4], [0.76, 1], [1, 1],
]

function studioIblGain(progress: number): number {
  for (let i = 1; i < STUDIO_IBL_SHOTS.length; i++) {
    const [end, gain] = STUDIO_IBL_SHOTS[i]
    if (progress <= end) {
      const [start, previousGain] = STUDIO_IBL_SHOTS[i - 1]
      return previousGain + (gain - previousGain) * smoothstep01((progress - start) / (end - start))
    }
  }
  return STUDIO_IBL_SHOTS[STUDIO_IBL_SHOTS.length - 1][1]
}

function StudioRig() {
  const keyRef = useRef<DirectionalLight>(null)
  const sweepRef = useRef<DirectionalLight>(null)
  const fillRef = useRef<DirectionalLight>(null)
  const spotRef = useRef<SpotLight>(null)
  const scene = useThree((state) => state.scene)

  useFrame(() => {
    telemetry.performance.tier=getQuality().tier
    if (renderOwnership.blocked) return
    const { progress } = getScrollState()
    // wrenchOut [0.525, 0.565] is when the hero sinks and the enclosure
    // rises; enclosureOut [0.72, 0.76] is when the enclosure exits.
    const down = smoothstep01((progress - STAGE_TRANSITIONS.wrenchOut[0]) / (STAGE_TRANSITIONS.wrenchOut[1] - STAGE_TRANSITIONS.wrenchOut[0]))
    const up = smoothstep01((progress - STAGE_TRANSITIONS.enclosureOut[0]) / (STAGE_TRANSITIONS.enclosureOut[1] - STAGE_TRANSITIONS.enclosureOut[0]))
    const intro = drawingIntroState(progress, drawingRuntime.extraction?.crossing)
    const activation = getQuality().reducedMotion ? 0 : intro.illumination
    const k = activation*(1 - (1 - STUDIO_STATION2_SCALE) * down * (1 - up))
    const sweep = getQuality().reducedMotion ? 0 : intro.lightSweep
    if (keyRef.current) keyRef.current.intensity = STUDIO_KEY_INTENSITY * k
    if (sweepRef.current) {
      sweepRef.current.intensity = STUDIO_KEY_INTENSITY * k * 0.16 * sweep
      sweepRef.current.position.set(-1.2 + 2.4 * intro.lightSweepPosition, 1.6, 0.8)
    }
    if (fillRef.current) fillRef.current.intensity = STUDIO_FILL_INTENSITY * k
    if (spotRef.current) {
      // JG-032: explode-hold rim nudge (+0.3 intensity, +0.1 Y) — progress-gated
      // (jgunVisualGates): full 0.49–0.525, faded out by the wrench-sink
      // boundary 0.565, exactly zero at CH.04 progress values. Resting values
      // (STUDIO_SPOT_INTENSITY at y 1.2) are unchanged outside the window.
      const nudge = studioSpotNudge(progress)
      spotRef.current.intensity = (STUDIO_SPOT_INTENSITY + nudge.intensity) * k
      spotRef.current.position.y = 1.2 + nudge.y
    }
    scene.environmentIntensity = activation * studioIblGain(progress) * (1 - (1 - STUDIO_ENV_STATION2) * down * (1 - up))
  })

  return (
    <>
      <directionalLight ref={keyRef} position={[1.5, 2, 1]} intensity={STUDIO_KEY_INTENSITY} />
      <directionalLight name="intro-metal-sweep" ref={sweepRef} position={[-1.2, 1.6, 0.8]} intensity={0} />
      <directionalLight ref={fillRef} position={[-2, 1, -1.5]} intensity={STUDIO_FILL_INTENSITY} color="#7dd3fc" />
      <spotLight ref={spotRef} position={[0, 1.2, -0.6]} intensity={STUDIO_SPOT_INTENSITY} angle={0.5} penumbra={1} />
    </>
  )
}

/**
 * Module 1 — core scene canvas.
 *
 * Performance safeguards:
 *  - DPR walks the staircase down while PerformanceMonitor sees sustained
 *    frame rates below 45 FPS (bounds lower edge), stepping back up when
 *    there is headroom. Tier escalation is one-way; only DPR recovers.
 *  - At DPR 1 and still declining: degradeQuality() — first drop kills the
 *    Module 3 dissolve shader (lite), second unmounts the canvas (poster).
 *  - onFallback pins DPR to 1 after repeated flip-flops (thrash guard).
 *  - WebGL context loss bails straight to the static poster.
 *  - Frustum culling stays enabled on every mesh (asserted in buildWrenchRig).
 */
function WarmStationPrograms() {
  const {gl,scene,camera}=useThree()
  useEffect(()=>{
    let cancelled=false
    pushQualityEvent({ type: 'warmstart' })
    const stations=['station-1-jgun','station-2-enclosure','station-3-m249'].map(name=>scene.getObjectByName(name))
    if(stations.some(station=>!station)){pushQualityEvent({ type: 'warmcancel' });return}
    const warm=async()=>{
      const target=new WebGLRenderTarget(1,1)
      try{
      for(const [renderIndex,combination] of [[true,false,false],[true,true,false],[false,true,false],[false,true,true],[false,false,true]].entries()){
        if(cancelled || renderOwnership.blocked){pushQualityEvent({ type: 'warmcancel' });return}
        const previous=stations.map(station=>station!.visible)
        let pending:Promise<boolean>
        // compileAsync collects lights synchronously; restore visibility before yielding.
        try{stations.forEach((station,i)=>{station!.visible=combination[i]});pending=compileWithLease(gl,scene,camera,()=>cancelled)}
        finally{stations.forEach((station,i)=>{station!.visible=previous[i]})}
        if(!(await pending)){pushQualityEvent({ type: 'warmcancel' });return}
        if(cancelled || renderOwnership.blocked){pushQualityEvent({ type: 'warmcancel' });return}
        // compileAsync does not upload vertex buffers or texture images. A 1px
        // offscreen render prepares those too, including frustum-culled stations.
        const flags:{object:typeof scene;visible:boolean;frustumCulled:boolean}[]=[]
        scene.traverse(object=>{flags.push({object:object as typeof scene,visible:object.visible,frustumCulled:object.frustumCulled});object.visible=true;object.frustumCulled=false})
        stations.forEach((station,i)=>{station!.visible=combination[i]})
        const previousTarget=gl.getRenderTarget(),viewport=gl.getViewport(new Vector4())
        pushQualityEvent({ type: 'cullrenderstart', index: renderIndex })
        try{gl.setRenderTarget(target);gl.setViewport(0,0,1,1);gl.render(scene,camera)}
        finally{gl.setRenderTarget(previousTarget);gl.setViewport(viewport);flags.forEach(({object,visible,frustumCulled})=>{object.visible=visible;object.frustumCulled=frustumCulled})}
        pushQualityEvent({ type: 'cullrenderend', index: renderIndex })
      }
      if(!cancelled){telemetry.performance.warmReady=true;pushQualityEvent({ type: 'warmfinish' })}
      else pushQualityEvent({ type: 'warmcancel' })
      }finally{target.dispose()}
    }
    void warm().catch(error=>{pushQualityEvent({ type: 'warmcancel' });console.error('Station shader preparation failed',error)})
    return()=>{cancelled=true}
  },[gl,scene,camera])
  return null
}

/**
 * JG-032 — micro-rim point light for the rear-LCD dwell: a tight cool rim
 * ([−0.30, 0.12, 0.50], #c8e6ff, peak 0.8) active ONLY inside
 * LCD_REVEAL_WINDOW (0.420–0.525) with the same 0.02 ease as LcdFillLight.
 * The canvas is global, so the gate (jgunVisualGates) is what keeps CH.04
 * inert — intensity is exactly 0 outside the window.
 */
function LcdMicroRimLight() {
  const lightRef = useRef<PointLight>(null)

  useFrame(() => {
    if (!lightRef.current) return
    if (renderOwnership.blocked) return
    const { progress } = getScrollState()
    lightRef.current.intensity = lcdMicroRimIntensity(progress, [
      LCD_REVEAL_WINDOW.start,
      LCD_REVEAL_WINDOW.end,
    ])
  })

  return (
    <pointLight
      ref={lightRef}
      position={[-0.3, 0.12, 0.5]}
      color="#c8e6ff"
      intensity={0}
      distance={0.5}
      decay={2}
    />
  )
}

/**
 * JG-032 — secondary, wider contact shadow beneath the primary one for
 * stronger depth separation during the explode. Implemented as a baked
 * radial-gradient plane (NOT a second drei ContactShadows): ContactShadows
 * re-renders the whole scene into its RT every frame regardless of
 * visibility, which cost +2.2 ms p95 at the hold — the gradient bakes the
 * "scale 1.6, blur 4" softness once. Opacity is driven per frame (peak
 * 0.12 × telemetry.rig.explodeFactor); the mesh hides outside the gate
 * window so the effect is provably inert at CH.04 progress values (zero
 * opacity, zero extra passes — not just unseen).
 */
function ExplodeShadow() {
  const meshRef = useRef<Mesh>(null)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 128)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(0.55, 'rgba(0,0,0,0.55)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 256, 256)
    return new CanvasTexture(canvas)
  }, [])
  useEffect(() => () => texture.dispose(), [texture])

  useFrame(() => {
    if (!meshRef.current) return
    if (renderOwnership.blocked) return
    const { progress } = getScrollState()
    const opacity = explodeShadowOpacity(progress, telemetry.rig.explodeFactor ?? 0)
    meshRef.current.visible = opacity > 0.001
    ;(meshRef.current.material as MeshBasicMaterial).opacity = opacity
  })

  return (
    <mesh ref={meshRef} position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshBasicMaterial map={texture} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function NarrativeStationDriver() {
  const { active } = useInspection()
  // Narrative projections are not valid from the temporary macro camera.
  return active ? null : <StationDriver />
}

export function SceneCanvas() {
  const [step, setStep] = useState(0)
  const stepRef = useRef(0)
  const { tier } = useQuality()
  const budgetTier = tier === 'full' ? 'full' : 'lite'
  const requestedDpr = DPR_STEPS[step]
  const initialDpr = computeRenderBudget(
    typeof window !== 'undefined' ? Math.max(1, window.innerWidth) : 1,
    typeof window !== 'undefined' ? Math.max(1, window.innerHeight) : 1,
    requestedDpr,
    budgetTier,
  ).dpr

  const setDprStep = (next: number): void => {
    stepRef.current = next
    qualityEventStep = next
    setStep(next)
    pushQualityEvent({ type: 'dprstep' })
  }

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={initialDpr}
        gl={{ antialias: false, stencil: false, powerPreference: 'high-performance' }}
        camera={{ fov: 42, near: 0.005, far: 150, position: [0.32, 0.16, 0.42] }}
        onCreated={({ gl, camera }) => {
          // Camera probe surface for subject-bbox NDC verification (JG-021
          // remediation): CameraRig mutates this same default camera each
          // frame, so the reference stays live for the page's lifetime.
          ;(window as any).__threeCamera = camera
          // Renderer probe for inspection lifecycle verification (programs/memory census).
          ;(window as any).__threeRenderer = gl
          // JG-032 rev2: local clipping for the Station-2 cross-section cut
          gl.localClippingEnabled = true
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            setInspectionSuspend('context')
            exitInspection()
            forcePoster()
          })
        }}
      >
        <RootRenderBudget requestedDpr={requestedDpr} tier={budgetTier} />
        <PerformanceMonitor
          bounds={() => [45, 60] as [number, number]}
          flipflops={3}
          onDecline={(api: PerformanceMonitorApi) => {
            if (!telemetry.performance.warmReady) {
              api.flipped = 0
              return
            }
            telemetry.performance.declines++
            pushQualityEvent({ type: 'ondecline', fps: api.fps, flipped: api.flipped })
            if (stepRef.current < DPR_STEPS.length - 1) setDprStep(stepRef.current + 1)
            else {
              pushQualityEvent({ type: 'degradequality' })
              degradeQuality()
            }
          }}
          onIncline={(api: PerformanceMonitorApi) => {
            if (!telemetry.performance.warmReady) { api.flipped = 0; return }
            pushQualityEvent({ type: 'onincline', fps: api.fps })
            if (stepRef.current > 0) setDprStep(stepRef.current - 1)
          }}
          onFallback={(api: PerformanceMonitorApi) => {
            if (!telemetry.performance.warmReady) {
              // drei sets fallback before this callback; keep monitoring after warmup.
              api.fallback = false
              api.flipped = 0
              return
            }
            pushQualityEvent({ type: 'onfallback', fps: api.fps, flipped: api.flipped })
            setDprStep(DPR_STEPS.length - 1)
          }}
        >
          <color attach="background" args={['#05070a']} />
          <fog attach="fog" args={['#05070a', 25, 120]} />

          {/* Studio balance for the photoreal PBR pass (2026-08-24): the
              environment carries the softbox reflections the clearcoat
              shells need, so the punctual key steps back from blowing out
              gloss highlights. StudioRig crossfades this balance per
              station (see StudioRig notes). */}
          <ambientLight intensity={0.25} />
          <StudioRig />

          <StudioEnvironmentIbl />

          <Suspense fallback={null}>
            <SpatialWorld>
              <TorqueWrenchHero />
            </SpatialWorld>
            <LcdFillLight />
            <LcdMicroRimLight />
            <WarmStationPrograms />
            <ContactShadows position={[0, -0.16, 0]} opacity={0.4} scale={1.2} blur={2.4} far={0.4} />
            <ExplodeShadow />
          </Suspense>

          <CameraRig />
          {/* JG-035 — after CameraRig at the same priority: station anchors read this frame's camera. */}
          <NarrativeStationDriver />
          {/* JG-023 — scroll-scrubbed procedural backdrop (camera-locked layers).
              Flag-gated in backdropConfig; flag-off = module no-op. */}
          <BackdropRig />
          <SpatialRig />
          <InspectionScene />
          {/* JG-017 — restrained post-processing FX (transition chromatic aberration + bloom).
              Returns null for poster and reduced-motion tiers; safe to always mount. */}
          <PostProcessingComposer />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
