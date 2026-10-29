import type { WrenchRig } from '../rig/nodeRoles'
import { CASCADE_PLANET_MULTIPLIERS, CASCADE_RATIOS, SUN_TO_STAGE1_CARRIER_RATIO } from '../inspection/shaft/cascadeConfig'
import { sampleFinaleAngle } from '../inspection/shaft/schedule'
import { approvedShaftBaseAngle } from '../inspection/shaft/shaftRuntime'
import { createShaftKinematicsFrame, sampleShaftKinematics } from '../inspection/shaft/kinematics'
import { subjectTimeAt } from './InspectionDirector'
import { sampleMechanism, type MechanismSample } from './MechanismDirector'
import { GEAR_RATIOS, ROTATION_TURNS } from '../../data/caseStudies'

const ORDER = ['stage1', 'stage2', 'stage5', 'stage3', 'stage4'] as const
const INDEX = [0, 1, 2, 4, 5] as const

/** A deterministic source pose in the same common phase as the study.
 * The held phase survives the later explosion/close; it is never reset visibly.
 * Source mesh buckets are baked in coaxial unit frames (no hierarchy changes).
 */
export function createShaftTakeover(rig: WrenchRig) {
  const shaft = rig.meshes.filter(mesh => mesh.userData.partNumber === 'P001835' || mesh.userData.partNumber === 'K000211')
  // The GLTF rig is cached across host mounts. A current animated angle must
  // never become the next mount's rest pose (or the common phase doubles).
  const restAngles = shaft.map(mesh => {
    const key = 'jgunShaftTakeoverRestAngle'
    if (typeof mesh.userData[key] !== 'number') mesh.userData[key] = mesh.rotation.z
    return mesh.userData[key] as number
  })
  const k = sampleShaftKinematics(66.9, createShaftKinematicsFrame())
  const fixedIndex = -approvedShaftBaseAngle(66.9, k.hobWorkPhi)
  const sourceAnchor = sampleMechanism(.56, {} as MechanismSample).gearAngle
  return (progress: number, gearAngle = sourceAnchor) => {
    if (progress < .62) {
      for (let i = 0; i < shaft.length; i++) shaft[i].rotation.z = restAngles[i]
      // applyWrenchMechanics has already restored the other source units.
      if (rig.outputShaft) rig.outputShaft.rotation.z = 0
      return
    }
    const phase = sampleFinaleAngle(subjectTimeAt(Math.min(.94, progress + .115)))
    for (let i = 0; i < ORDER.length; i++) {
      const stage = rig.stages[ORDER[i]], index = INDEX[i]
      const angle = -phase * CASCADE_RATIOS[index]
      // Retain the original explosion/close display increments around the
      // inherited phase; the private study and that display use separate laws.
      const displayDelta = progress > .855 ? (gearAngle - sourceAnchor) * ROTATION_TURNS[ORDER[i]] / 4 : 0
      if (stage.carrier) stage.carrier.rotation.z = angle + displayDelta
      for (const planet of stage.planets) planet.rotation.z = -angle * CASCADE_PLANET_MULTIPLIERS[index]
        - displayDelta * GEAR_RATIOS.planetMultiplier
    }
    if (rig.outputShaft) rig.outputShaft.rotation.z = -phase * CASCADE_RATIOS[6]
    for (let i = 0; i < shaft.length; i++) shaft[i].rotation.z = restAngles[i] + fixedIndex - phase * SUN_TO_STAGE1_CARRIER_RATIO
  }
}
