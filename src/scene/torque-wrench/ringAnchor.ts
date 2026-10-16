import { Matrix4, type Vector3 } from 'three'
import type { WrenchRig } from '../rig/nodeRoles'
import { applyWrenchMechanics, type WrenchMechanicsFrame } from '../rig/wrenchMechanics'
import { sampleMechanism } from './MechanismDirector'

/** The ring study starts in the fully extracted, shifted mechanical pose. */
export const RING_ANCHOR_PROGRESS = 0.69

/** Construction-only capture; always restore the live mechanics, including on failure. */
export function captureCanonicalRingAnchor(
  rig: WrenchRig,
  localCenter: Vector3,
  liveFrame: WrenchMechanicsFrame,
  out: Matrix4,
): Matrix4 {
  const source = rig.clutch.ringSwitch
  if (!source) throw new Error('Private ring source unavailable')
  const canonical = sampleMechanism(RING_ANCHOR_PROGRESS,
    { shift: 0, explode: 0, gearAngle: 0, idle: 0, ghostOpacity: 1 })
  try {
    applyWrenchMechanics(rig, canonical)
    source.updateWorldMatrix(true, true)
    return out.copy(source.matrixWorld).multiply(new Matrix4().makeTranslation(localCenter.x, localCenter.y, localCenter.z))
  } finally {
    applyWrenchMechanics(rig, liveFrame)
    source.updateWorldMatrix(true, true)
  }
}
