// Deterministic frame-accurate choreography for StudioMark 3D Video Bumpers:
// - Bumper #1: 'storm-ignition' ("Storm Ignition" — 4.5s @ 60fps = 270 frames)
// - Bumper #4: 'puddle-crane'   ("Low Puddle Crane-Up" — 5.0s @ 60fps = 300 frames)

export type BumperMode = 'interactive' | 'storm-ignition' | 'puddle-crane'

export interface BumperFrameState {
  mode: Exclude<BumperMode, 'interactive'>
  timeSec: number
  durationSec: number
  progress: number
  actLabel: string
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  cameraFov: number
  cameraRoll: number
  monogramRotation: [number, number, number]
  monogramPositionY: number
  monogramScale: number
  neonIntensity: number
  lightningIntensity: number
  textEmissiveScale: number
  rippleStrength: number
  puddleReflectivity: number
  bloomIntensity: number
  hudOpacity: number
  fadeBlackOpacity: number
}

export const BUMPER_SPECS: Record<
  Exclude<BumperMode, 'interactive'>,
  {
    id: Exclude<BumperMode, 'interactive'>
    title: string
    subtitle: string
    durationSec: number
    fps: number
    totalFrames: number
  }
> = {
  'storm-ignition': {
    id: 'storm-ignition',
    title: 'Bumper 01 · Storm Ignition',
    subtitle: 'Macro Glass Refraction → Dual Lightning Strike → Neon Filament Surge → 180° Hero Lock',
    durationSec: 4.5,
    fps: 60,
    totalFrames: 270,
  },
  'puddle-crane': {
    id: 'puddle-crane',
    title: 'Bumper 04 · Low Puddle Crane-Up',
    subtitle: 'Inverted Puddle Mirror Gaze → Concentric Ripple Impact → Vertical Crane Ascent → Hero Lock',
    durationSec: 5.0,
    fps: 60,
    totalFrames: 300,
  },
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Deterministic multi-pulse lightning envelope centered at `strikeStartSec`.
 */
function evaluateLightningStrike(t: number, strikeStartSec: number, peakScale = 1.0): number {
  const dt = t - strikeStartSec
  if (dt < 0 || dt > 0.55) return 0
  // Pulse 1: initial sharp leader flash (0.00 - 0.045s)
  if (dt < 0.045) {
    return 0.82 * peakScale * Math.sin((dt / 0.045) * Math.PI)
  }
  // Brief inter-stroke dim (0.045 - 0.075s)
  if (dt < 0.075) {
    return 0.12 * peakScale
  }
  // Pulse 2: main return stroke peak (0.075 - 0.145s)
  if (dt < 0.145) {
    return 1.0 * peakScale
  }
  // Exponential atmospheric afterglow decay (0.145 - 0.55s)
  const decay = 1.0 - (dt - 0.145) / 0.405
  return Math.max(0, decay * decay * 1.15 * peakScale)
}

/**
 * Evaluate exact deterministic scene parameters at `timeSec` for either bumper.
 */
export function evaluateBumperState(
  mode: Exclude<BumperMode, 'interactive'>,
  rawTimeSec: number,
): BumperFrameState {
  const spec = BUMPER_SPECS[mode]
  const t = Math.max(0, Math.min(spec.durationSec, rawTimeSec))
  const progress = t / spec.durationSec

  // Crisp cinema fade-in from black over first 0.22s
  const fadeIn = 1.0 - smoothstep(0.0, 0.22, t)

  if (mode === 'storm-ignition') {
    // =========================================================================
    // BUMPER 1: STORM IGNITION (4.50s)
    // Act I   (0.00s - 1.15s): Low wet-street sweep across dark glass chevron & puddle reflection
    // Act II  (1.15s - 2.35s): Dual lightning strike + crisp filament ignition on wet asphalt
    // Act III (2.35s - 4.50s): Smooth C2 dolly-out to Puddle Reflection & Sharp Monument Lockup
    // =========================================================================
    const actLabel =
      t < 1.15
        ? 'ACT I · WET ASPHALT & GLASS REFRACTION SWEEP'
        : t < 2.35
          ? 'ACT II · LIGHTNING STRIKE & FILAMENT IGNITION'
          : 'ACT III · PUDDLE MIRROR & HERO LOCKUP'

    // Camera choreography:
    // Start low over the wet puddle: [-1.15, 0.62, 3.35] looking at [0.06, 0.68, -0.15]
    // Mid-ignition orbit: [0.38, 0.82, 4.05]
    // Hero lockup (3.35s+): [0.0, 1.02, 5.25] looking at [0, 0.56, -0.20]
    // Framing target.y = 0.56 places the waterline near the middle so both the 3D emblem (y = 1.24)
    // and its full inverted puddle reflection (y = -1.24) are prominently showcased.
    const wMacroToMid = smootherstep(0.0, 1.65, t)
    const wMidToHero = smootherstep(1.35, 3.35, t)

    const camXMid = lerp(-1.15, 0.38, wMacroToMid)
    const camYMid = lerp(0.62, 0.82, wMacroToMid)
    const camZMid = lerp(3.35, 4.05, wMacroToMid)

    const camX = lerp(camXMid, 0.0, wMidToHero)
    const camY = lerp(camYMid, 1.02, wMidToHero) + Math.sin(t * 1.4) * 0.012 * (1 - wMidToHero * 0.7)
    const camZ = lerp(camZMid, 5.25, wMidToHero)

    const targetX = lerp(0.06, 0.0, wMidToHero)
    const targetY = lerp(0.68, 0.56, wMidToHero)
    const targetZ = lerp(-0.15, -0.20, wMidToHero)

    const cameraFov = lerp(40, 45, wMidToHero)
    const cameraRoll = lerp(-0.035, 0.0, smootherstep(0.6, 3.1, t))

    // Monogram sculptural rotation:
    // Starts turned (-0.58 rad on Y, slight X tilt) so lightformers rake across the dark bevels,
    // then swings with authority through 0 into a subtle breathing showcase poise.
    const rotSweep = smootherstep(0.2, 3.25, t)
    const rotY = lerp(-0.58, 0.0, rotSweep) + Math.sin((t - 3.25) * 1.2) * 0.035 * smoothstep(3.1, 3.8, t)
    const rotX = lerp(0.10, 0.02, rotSweep)
    const rotZ = lerp(-0.04, 0.0, rotSweep)

    const monogramPositionY = 1.24 + Math.sin(t * 1.5) * 0.025
    const monogramScale = lerp(1.02, 1.06, smoothstep(1.1, 2.6, t))

    // Dual Lightning strikes at t = 1.15s (primary) and t = 1.58s (secondary accent)
    const strike1 = evaluateLightningStrike(t, 1.15, 1.0)
    const strike2 = evaluateLightningStrike(t, 1.58, 0.65)
    const lightningIntensity = Math.min(1.2, strike1 + strike2)

    // Crisp neon filament curve (controlled HDR range so bevels and STUDIOMARK stay razor-sharp):
    // 0.00 - 1.12s: crisp warm filament (0.85)
    // 1.12 - 1.28s: lightning arc pulse (2.35)
    // 1.28 - 1.42s: brief dip (1.25)
    // 1.42 - 1.85s: secondary surge (2.45)
    // 1.85 - 3.10s: smooth settle to sharp hero definition (1.45)
    let neonIntensity = 0.85
    if (t >= 1.12 && t < 1.28) {
      neonIntensity = lerp(0.85, 2.35, smoothstep(1.12, 1.24, t))
    } else if (t >= 1.28 && t < 1.42) {
      neonIntensity = lerp(2.35, 1.25, smoothstep(1.28, 1.38, t))
    } else if (t >= 1.42 && t < 1.85) {
      neonIntensity = lerp(1.25, 2.45, smoothstep(1.42, 1.62, t))
    } else if (t >= 1.85) {
      neonIntensity = lerp(2.45, 1.45, smootherstep(1.85, 3.1, t))
    }

    // Keep 3D STUDIOMARK monument consistently sharp from start to finish (never blowing out at the end)
    const textEmissiveScale = 1.0

    // Puddle ripple shockwave on lightning strike, then settles for glassy mirror reflection
    const shockwave = Math.exp(-Math.pow((t - 1.35) / 0.45, 2)) * 0.22
    const rippleStrength = lerp(0.28, 0.16, smoothstep(2.2, 3.9, t)) + shockwave
    const puddleReflectivity = lerp(0.92, 0.96, smoothstep(1.8, 3.4, t))

    // Restrained post-processing bloom so only lightning highlights and filament cores shimmer
    const bloomIntensity = 0.28 + lightningIntensity * 0.18

    // Lower-third technical HUD signature fades in at hero lockup (2.75s -> 3.35s)
    const hudOpacity = smootherstep(2.75, 3.35, t)

    return {
      mode,
      timeSec: t,
      durationSec: spec.durationSec,
      progress,
      actLabel,
      cameraPosition: [camX, camY, camZ],
      cameraTarget: [targetX, targetY, targetZ],
      cameraFov,
      cameraRoll,
      monogramRotation: [rotX, rotY, rotZ],
      monogramPositionY,
      monogramScale,
      neonIntensity,
      lightningIntensity,
      textEmissiveScale,
      rippleStrength,
      puddleReflectivity,
      bloomIntensity,
      hudOpacity,
      fadeBlackOpacity: fadeIn,
    }
  }

  // ===========================================================================
  // BUMPER 4: LOW PUDDLE CRANE-UP (5.00s)
  // Act I   (0.00s - 1.55s): Low water-level gaze into the inverted puddle reflection
  // Act II  (1.55s - 3.35s): Vertical crane-up & upward tilt from puddle mirror to 3D emblem
  // Act III (3.35s - 5.00s): Hero showcase lockup with crystalline reflection
  // ===========================================================================
  const actLabel =
    t < 1.55
      ? 'ACT I · INVERTED PUDDLE MIRROR GAZE'
      : t < 3.35
        ? 'ACT II · VERTICAL CRANE ASCENT & REVEAL'
        : 'ACT III · HERO SHOWCASE LOCKUP'

  // Camera starts 0.28m above the wet asphalt, looking across the mirror pool at the reflection:
  // Start (0.0s): pos [0.0, 0.28, 4.25], target [0.0, 0.18, -0.35] (frames puddle reflection up close)
  // Crane Ascent (1.05s -> 3.45s): rises smoothly to [0.0, 1.02, 5.25], target [0.0, 0.56, -0.20]
  const wCrane = smootherstep(1.05, 3.45, t)

  const camX = Math.sin(t * 0.9) * 0.16 * (1 - wCrane)
  const camY = lerp(0.28, 1.02, wCrane)
  const camZ = lerp(4.25, 5.25, smootherstep(0.4, 3.5, t))

  // Camera target tilts smoothly upward from the wet puddle reflection to balanced reflection+emblem framing
  const targetX = 0.0
  const targetY = lerp(0.18, 0.56, smootherstep(0.95, 3.25, t))
  const targetZ = lerp(-0.35, -0.20, wCrane)

  const cameraFov = lerp(40, 45, wCrane)
  const cameraRoll = lerp(0.02, 0.0, wCrane)

  // Monogram rotation: gentle turn into locked hero symmetry as the crane reaches eye level
  const rotY = lerp(0.42, 0.0, smootherstep(1.1, 3.45, t)) + Math.sin((t - 3.45) * 1.1) * 0.035 * smoothstep(3.3, 4.0, t)
  const rotX = lerp(-0.06, 0.02, wCrane)
  const rotZ = 0.0

  // Monogram hovers above the wet puddle
  const monogramPositionY = lerp(1.18, 1.24, wCrane) + Math.sin(t * 1.4) * 0.025
  const monogramScale = 1.06

  // Atmospheric lightning strikes:
  // Strike 1 at t = 0.45s ripples across the puddle reflection
  // Strike 2 at t = 2.15s silhouettes the Kinetic Chevron mid-crane ascent
  const strikePuddle = evaluateLightningStrike(t, 0.45, 0.72)
  const strikeCrest = evaluateLightningStrike(t, 2.15, 1.0)
  const lightningIntensity = Math.min(1.2, strikePuddle + strikeCrest)

  // Neon filament intensity stays crisp so reflection and 3D emblem remain sharp
  const craneSurge = Math.exp(-Math.pow((t - 2.28) / 0.42, 2)) * 0.85
  const neonIntensity = lerp(1.25, 1.45, wCrane) + craneSurge

  // Keep 3D STUDIOMARK text sharp throughout
  const textEmissiveScale = 1.0

  // Puddle ripples start active during the low-angle puddle gaze, then calm for mirror clarity
  const impactPulse = Math.exp(-Math.pow((t - 0.55) / 0.38, 2)) * 0.18
  const rippleStrength = lerp(0.30, 0.16, wCrane) + impactPulse
  const puddleReflectivity = lerp(0.96, 0.95, wCrane * 0.5)

  const bloomIntensity = 0.28 + lightningIntensity * 0.18
  const hudOpacity = smootherstep(3.15, 3.75, t)

  return {
    mode,
    timeSec: t,
    durationSec: spec.durationSec,
    progress,
    actLabel,
    cameraPosition: [camX, camY, camZ],
    cameraTarget: [targetX, targetY, targetZ],
    cameraFov,
    cameraRoll,
    monogramRotation: [rotX, rotY, rotZ],
    monogramPositionY,
    monogramScale,
    neonIntensity,
    lightningIntensity,
    textEmissiveScale,
    rippleStrength,
    puddleReflectivity,
    bloomIntensity,
    hudOpacity,
    fadeBlackOpacity: fadeIn,
  }
}

