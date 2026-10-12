// Torque narrative scene adapter — Stage 1 foundation placeholder.
//
// PENDING Stage 2+: there is no Canvas, no three/R3F import, and no model here yet. This module
// exists so cadGate has its real dynamic-import target and the page has an honest scene boundary.
// The narrative world (beats, conductor, directors, CAD) replaces this body in later stages and
// must call props.onFailure for initialization, context-loss or asynchronous failures.
import type { TorqueSceneProps } from './cadGate'

export default function TorqueScene(_props: TorqueSceneProps) {
  return (
    <div className="torque-scene" data-torque-scene="placeholder" data-torque-scene-pending="stage-2">
      <p className="torque-scene__pending">Narrative scene pending — Stage 2.</p>
    </div>
  )
}
