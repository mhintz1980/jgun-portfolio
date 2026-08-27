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
 */
export function SpatialRig() {
  useFrame(() => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()

    if (reducedMotion) {
      telemetry.stage.active = 0
      telemetry.stage.alpha = [1, 0, 0]
      telemetry.stage.y = [0, 0, 0]
      return
    }

    const s1Env = stageEnvelope(progress, undefined, STAGE_TRANSITIONS.wrenchOut)
    const s2Env = stageEnvelope(progress, STAGE_TRANSITIONS.enclosureIn, STAGE_TRANSITIONS.enclosureOut)
    const s3Env = stageEnvelope(progress, STAGE_TRANSITIONS.pointCloudIn, undefined)

    const alphas: [number, number, number] = [s1Env.alpha, s2Env.alpha, s3Env.alpha]
    const dominant = alphas.indexOf(Math.max(...alphas))
    telemetry.stage.active = alphas[dominant] > 0.25 ? dominant : -1
    telemetry.stage.alpha = alphas
    telemetry.stage.y = [s1Env.y, s2Env.y, s3Env.y]
  })

  return null
}

export { STATION_TRANSFORMS, SPATIAL_STATIONS }
