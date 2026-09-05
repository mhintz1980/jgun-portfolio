import { useSyncExternalStore } from 'react'
import type { MaterialMode } from '../types/portfolio'

/**
 * Minimal external store bridging the DOM scroll world (Lenis + ScrollTrigger)
 * and the R3F frame loop. Canvas-side consumers read via getScrollState() in
 * useFrame (no React re-renders); DOM-side consumers subscribe to individual
 * keys via useScrollValue and only re-render when that key actually changes.
 */
export interface ScrollState {
  /** Global page scroll progress, 0..1. */
  progress: number
  /** Active chapter index, 0..3. */
  chapter: number
  /** Progress through the active chapter, 0..1. */
  chapterProgress: number
  /** Smoothed scroll velocity (arbitrary units, for HUD flavor). */
  velocity: number
  materialMode: MaterialMode
  /** Currently selected hotspot id, or null. */
  hotspotId: string | null
}

export interface SpatialStation {
  id: string
  index: number
  label: string
  name: string
  position: readonly [number, number, number]
  scrollProgress: number
}

export const SPATIAL_STATIONS: readonly SpatialStation[] = [
  { id: 'jgun', index: 0, label: 'STATION 01', name: 'PTG-HP-1000 TORQUE GUN', position: [0, 0, 0], scrollProgress: 0.0 },
  { id: 'enclosure', index: 1, label: 'STATION 02', name: 'RL-300 ACOUSTIC SAFE ENCLOSURE', position: [28, 0, -6], scrollProgress: 0.60 },
  { id: 'm249', index: 2, label: 'STATION 03', name: 'M249 / MK46 PLATFORM', position: [56, 0, -12], scrollProgress: 0.85 },
] as const

/**
 * Smoothly navigates the viewport to the target station's scroll progress.
 */
export function navigateToStation(stationIndex: number): void {
  const target = SPATIAL_STATIONS[stationIndex]
  if (!target) return
  if (typeof window === 'undefined') return
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  if (maxScroll <= 0) return

  const targetScroll = maxScroll * target.scrollProgress
  const lenis = (window as unknown as Record<string, unknown>).__lenis as
    | { scrollTo: (target: number, opts?: { duration?: number }) => void }
    | undefined

  if (lenis && typeof lenis.scrollTo === 'function') {
    lenis.scrollTo(targetScroll, { duration: 1.2 })
  } else {
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    })
  }
}

function initialScrollProgress(): number {
  if (typeof window === 'undefined') return 0
  const params = new URLSearchParams(window.location.search)
  const station = params.get('station')
  if (station === '1' || station === 'jgun') return 0.0
  if (station === '2' || station === 'enclosure' || station === 'safe-enclosure') return 0.60
  if (station === '3' || station === 'm249') return 0.85
  const chapter = params.get('chapter')
  if (chapter === '0') return 0.0
  if (chapter === '1') return 0.35
  if (chapter === '2') return 0.60
  if (chapter === '3') return 0.85
  return 0
}

const state: ScrollState = {
  progress: initialScrollProgress(),
  chapter: 0,
  chapterProgress: 0,
  velocity: 0,
  materialMode: initialMaterialMode(),
  hotspotId: null,
}

/**
 * Deep-linkable initial material mode via ?view=<mode> — e.g.
 * /?view=exploded opens straight into the fully exploded assembly. Only the
 * three real switcher modes are accepted; anything else falls back to solid.
 * Read once at store creation; the HUD switcher remains the live control.
 */
function initialMaterialMode(): MaterialMode {
  if (typeof window === 'undefined') return 'solid'
  const view = new URLSearchParams(window.location.search).get('view')
  if (view === 'solid' || view === 'blueprint' || view === 'exploded') return view
  return 'solid'
}

if (typeof window !== 'undefined') {
  const initProg = initialScrollProgress()
  if (initProg > 0) {
    window.addEventListener('DOMContentLoaded', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0) window.scrollTo(0, max * initProg)
    })
  }
}

const listeners = new Set<() => void>()

export function getScrollState(): ScrollState {
  return state
}

export function setScrollState(patch: Partial<ScrollState>): void {
  // Headless proof probes pin progress so a captured frame is a pure function of the value
  // asked for. Real sessions never set this flag.
  const proofProgress =
    typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>).__drawingProofProgress
      : undefined
  if (typeof proofProgress === 'number') patch = { ...patch, progress: proofProgress, velocity: 0 }
  let changed = false
  for (const key of Object.keys(patch) as (keyof ScrollState)[]) {
    const next = patch[key]
    if (next !== undefined && state[key] !== next) {
      ;(state as unknown as Record<string, unknown>)[key] = next
      changed = true
    }
  }
  if (changed) for (const listener of listeners) listener()
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function useScrollValue<K extends keyof ScrollState>(key: K): ScrollState[K] {
  // Third arg lets HUD/hotspot markup server-render for the a11y smoke checks.
  return useSyncExternalStore(
    subscribe,
    () => state[key],
    () => state[key],
  )
}

/**
 * Per-frame runtime telemetry — the page's instrumentation surface. Mutated
 * directly from the frame loops (CameraRig writes camera + scroll,
 * TorqueWrenchHero writes rig) and read by a rAF loop in TechnicalHUD —
 * deliberately outside React state so 60 fps updates never trigger
 * reconciliation.
 */
export interface TelemetryCamera {
  /** Undamped goal the rig is steering toward, preallocated and mutated in place. */
  goal: { position: number[]; target: number[]; fov: number }
  /** Camera up vector — non-(0,1,0) only while the sheet owns the frame. */
  up: number[]
  /** Height above the sheet during the B1/B2 intro; 0 outside it. */
  sheetDistance: number
  x: number
  y: number
  z: number
  fov: number
  framingBias: number
  /** Portrait-viewport vertical framing bias (JG-021 remediation probe surface). */
  framingBiasY: number
  /** Portrait-viewport dolly-out factor active at stations (1 = off). */
  portraitDolly: number
}

export interface TelemetryRig {
  /** Live Z of the explosion-animated units (m — rest position + offset). */
  handleZ: number
  outputZ: number
  clutchZ: number
  slidingZ: number
  /** Carrier-group Z per stage, stage1..stage5 (rest + offset). */
  stageZ: number[]
  /** Carrier-group rotation.z per stage + stage-1 first-planet rotation (rad). */
  stageRot: number[]
  planetRot: number
  /** Commanded proxy channels: gear sweep angle (rad) and clutch shift 0..1. */
  gearRotation: number
  shift: number
  /** Commanded ghost opacity (1 → GHOST_OPACITY) and ghost material count. */
  ghostOpacity: number
  ghostCount: number
  /** Active explosion factor 0..1 (timeline ⊕ exploded mode). */
  explodeFactor: number
  /** CR-1 ring-switch cam-follower state: position.z and rotation.z at shift=1. */
  ringSwitchZ: number
  ringSwitchRotZ: number
}

export interface TelemetryScroll {
  progress: number
  chapter: number
  chapterProgress: number
  materialMode: MaterialMode
}

export interface TelemetryStage {
  /** Dominant stage index: 0 wrench, 1 enclosure, 2 point cloud, −1 none. */
  active: number
  /** Cross-fade alpha per stage, 0..1 (order: wrench, enclosure, cloud). */
  alpha: [number, number, number]
  /** CH.03 airflow field intensity 0..1 (scroll-bound, damped). */
  flow: number
  /**
   * JG-018 — acoustic wave attenuation & baffle propagation intensity 0..1.
   * Written each frame by AcousticBaffleField.
   */
  acousticWave: number
  /**
   * JG-017 — smoothed cross-station transition intensity 0..1.
   * Written each frame by SpatialRig from the max absolute alpha-delta,
   * exponentially decayed so it persists for ~0.4 s after the transition peak.
   * PostProcessingComposer reads this to drive chromatic aberration + bloom
   * without per-frame allocation in the composer's own useFrame.
   */
  transitionIntensity: number
  /** JG-023 — procedural backdrop visibility 0..1, written per frame by
   * BackdropRig (flag/chapter envelope across the palette blend windows). */
  backdropAlpha: number
}

/**
 * B1/B2 drawing telemetry. Every field is preallocated and mutated in place — the frame
 * loop must not build objects or call `toArray()` (repo rule: zero per-frame allocation).
 */
export interface TelemetryDrawing {
  /** B1 edge-field opacity, written by DrawingLinework every frame. */
  lineOpacity: number
  /** Source trace used by the telemetry proof; never an authored raster. */
  edgeSource: string
  /** Intro-normalized scroll time and the pose time it maps to. */
  phase: number
  poseT: number
  focus: number
  pulseHead: number
  pulse: number
  pbr: number
  travel: number
  /** Sheet-local Z of the model's origin during the lift. */
  localZ: number
  /** Lowest supported vertex, sheet-local. Negative means still embedded in the sheet. */
  minZ: number
  /** Solved detachment pose time. */
  crossing: number
  contact: number[]
  waveTime: number
  waveEnabled: number
  /** Peak linear luminance the excitation writes, against the 0.6 bloom threshold. */
  pulseLuminance: number
  profilePoints: number
  planeMatrix: number[]
  modelMatrix: number[]
  annotationsReady: boolean
  /** Leader crossings counted in the SVG annotation layer (target: 0). */
  leaderCrossings: number
}

export const telemetry: {
  camera: TelemetryCamera
  rig: TelemetryRig
  scroll: TelemetryScroll
  stage: TelemetryStage
  drawing: TelemetryDrawing
  performance: { declines: number; tier: string; warmReady: boolean }
} = {
  camera: {
    x: 0,
    y: 0,
    z: 0,
    fov: 42,
    framingBias: 0,
    framingBiasY: 0,
    portraitDolly: 1,
    goal: { position: [0, 0, 0], target: [0, 0, 0], fov: 42 },
    up: [0, 1, 0],
    sheetDistance: 0,
  },
  rig: {
    handleZ: 0,
    outputZ: 0,
    clutchZ: 0,
    slidingZ: 0,
    stageZ: [0, 0, 0, 0, 0],
    stageRot: [0, 0, 0, 0, 0],
    planetRot: 0,
    gearRotation: 0,
    shift: 0,
    ghostOpacity: 1,
    ghostCount: 0,
    explodeFactor: 0,
    ringSwitchZ: 0,
    ringSwitchRotZ: 0,
  },
  scroll: { progress: 0, chapter: 0, chapterProgress: 0, materialMode: state.materialMode },
  stage: { active: 0, alpha: [1, 0, 0], flow: 0, acousticWave: 0, transitionIntensity: 0, backdropAlpha: 0 },
  drawing: {
    lineOpacity: 1,
    edgeSource: 'Default.glb:crease+boundary',
    phase: 0,
    poseT: 0,
    focus: 0,
    pulseHead: 0,
    pulse: 0,
    pbr: 0,
    travel: 0,
    localZ: 0,
    minZ: 0,
    crossing: 0,
    contact: [0, 0, 0],
    waveTime: 0,
    waveEnabled: 0,
    pulseLuminance: 0,
    profilePoints: 0,
    planeMatrix: new Array(16).fill(0),
    modelMatrix: new Array(16).fill(0),
    annotationsReady: false,
    leaderCrossings: 0,
  },
  performance: { declines: 0, tier: 'full', warmReady: false },
}

// Exposed for headless verification probes (docs/animation-spec.md §11 —
// instrumentation over screenshots). The frame loops stay the sole writers;
// outside readers should treat it as read-only.
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__telemetry = telemetry
}
