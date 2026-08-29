import { useFrame } from '@react-three/fiber'
import { getScrollState, telemetry, SPATIAL_STATIONS } from '../state/scrollStore'
import { getQuality } from '../state/qualityStore'
import { stageEnvelope, STAGE_TRANSITIONS } from './stages/stageWindows'
import { STATION_TRANSFORMS } from './SpatialWorld'

/**
 * JG-016 — Spatial Rig.
 *
 * Coordinates spatial navigation, active station envelopes, transition windows,
 * and runtime telemetry across the three discrete 3D engineering stations.
 *
 * Telemetry and state updates are purely imperative inside useFrame:
 * zero React re-renders or state churn.
 *
 * JG-017 addition: tracks per-frame alpha deltas across the three station
 * cross-fades and accumulates them into telemetry.stage.transitionIntensity
 * (0..1, exponentially decayed at τ≈0.35 s). The PostProcessingComposer reads
 * this signal to drive chromatic aberration + bloom during station transitions.
 * Module-level prev array avoids per-frame allocation.
 */

/** Module-level prev alpha — avoids per-frame object allocation. */
const prevAlpha: [number, number, number] = [1, 0, 0]

export function SpatialRig() {
  useFrame((_state, delta) => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()

    if (reducedMotion) {
      telemetry.stage.active = 0
      telemetry.stage.alpha = [1, 0, 0]
      telemetry.stage.transitionIntensity = 0
      prevAlpha[0] = 1; prevAlpha[1] = 0; prevAlpha[2] = 0
      return
    }

    const s1Env = stageEnvelope(progress, undefined, STAGE_TRANSITIONS.wrenchOut)
    const s2Env = stageEnvelope(progress, STAGE_TRANSITIONS.enclosureIn, STAGE_TRANSITIONS.enclosureOut)
    const s3Env = stageEnvelope(progress, STAGE_TRANSITIONS.pointCloudIn, undefined)

    const alphas: [number, number, number] = [s1Env.alpha, s2Env.alpha, s3Env.alpha]
    const dominant = alphas.indexOf(Math.max(...alphas))
    telemetry.stage.active = alphas[dominant] > 0.25 ? dominant : -1
    telemetry.stage.alpha = alphas

    // JG-017 — compute per-frame max absolute alpha change, scale to 0..1
    // using an empirical denominator (0.04 ≈ max delta per frame at 30 fps
    // across a 0.04-unit transition window), then decay with τ ≈ 0.35 s.
    const safeDelta = Math.min(delta, 0.1)
    const maxDelta = Math.max(
      Math.abs(alphas[0] - prevAlpha[0]),
      Math.abs(alphas[1] - prevAlpha[1]),
      Math.abs(alphas[2] - prevAlpha[2]),
    )
    prevAlpha[0] = alphas[0]; prevAlpha[1] = alphas[1]; prevAlpha[2] = alphas[2]

    // Scale raw delta to 0..1 and inject into exponential decay accumulator.
    // Denominator 0.085 accounts for the smoothstep derivative (dα/dp = 37.5 at
    // mid-window across the 0.04-unit transition), yielding peak intensity
    // ~0.70–0.74 during continuous 60 fps scrub (well below 1.0 ceiling) and
    // ~0.49 during incremental 80 ms steps, matching the JG-017 spec.
    const scaled = Math.min(maxDelta / 0.085, 1)
    const decay = 1 - Math.exp(-safeDelta / 0.35)
    telemetry.stage.transitionIntensity = Math.max(
      telemetry.stage.transitionIntensity * (1 - decay) + scaled * decay,
      scaled,   // inject the raw spike on the frame it happens
    )
    // Hard clamp to 1.
    if (telemetry.stage.transitionIntensity > 1) telemetry.stage.transitionIntensity = 1
  })

  return null
}

export { STATION_TRANSFORMS, SPATIAL_STATIONS }
