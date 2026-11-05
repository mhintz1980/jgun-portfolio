import { useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { AlwaysStencilFunc, Group, KeepStencilOp, Mesh, Plane, ReplaceStencilOp, Vector3 } from 'three'
import { prepareModel, SHELL_ROOTS } from '../../../src/scene/rl300/prepareModel'
import type { V16Map } from '../../../src/scene/rl300/v16Materials'
import v16Parts from '../../../src/scene/rl300/v16-part-materials.json'
import { SectionCaps } from '../../../src/scene/rl300/SectionCaps'
import { LowerIntake } from '../../../src/scene/rl300/LowerIntake'
import { AirRibbons, EQUIPMENT_MASK_STENCIL_REF } from '../../../src/scene/rl300/AirRibbons'
import type { PreviewControl } from '../../../src/scene/rl300/QuietMachineScene'
import { cutAt, CLOSED_CUT, DEEPEST_CUT } from '../../../src/scene/rl300/shot'
import { usePrepared } from './useGltf'
import { ReadyGate } from './ReadyGate'

type Prepared = ReturnType<typeof prepareModel>

// Same stencil tagging as the site's QuietMachineScene: equipment writes the mask the air
// ribbons test against, so air reads as passing around the machine, not through it.
function configureEquipmentStencil(group: Group) {
  group.traverse((object) => {
    if (!(object instanceof Mesh) || SHELL_ROOTS.has(object.userData.sourceRoot)) return
    object.renderOrder = Math.max(object.renderOrder, 1)
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      material.stencilWrite = true
      material.stencilRef = EQUIPMENT_MASK_STENCIL_REF
      material.stencilFunc = AlwaysStencilFunc
      material.stencilFail = KeepStencilOp
      material.stencilZFail = KeepStencilOp
      material.stencilZPass = ReplaceStencilOp
    }
  })
}

/** The site's RL300 section study, driven by the film clock instead of scroll. `u` is the
 *  site's own study progress (src/scene/rl300/beats.ts); `cut` overrides the section depth. */
export function QuietMachine({ u, cut, caps = true }: { u: number; cut?: number; caps?: boolean }) {
  const plane = useMemo(() => new Plane(new Vector3(-1, 0, 0), CLOSED_CUT), [])
  const control = useMemo<PreviewControl>(() => ({ u: 0, invalidate: () => {}, caps: true }), [])
  const [model, release] = usePrepared(
    ['models/msp-enclosure.glb', 'models/rl300-extra-parts.glb'],
    ([scene, extras]) => {
      const m = prepareModel(scene!, plane, { v16: v16Parts as unknown as V16Map, physical: true, extras: extras ?? undefined })
      configureEquipmentStencil(m.group)
      return m
    },
    'Quiet machine (msp-enclosure.glb)',
  )
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  // Written during render so every useFrame consumer (ribbons, caps) sees this frame's u.
  control.u = u
  control.caps = caps
  const c = cut ?? cutAt(u)
  plane.constant = CLOSED_CUT + (DEEPEST_CUT - CLOSED_CUT) * c

  return (
    <>
      {model && (
        <>
          <primitive object={model.group} dispose={null} />
          <SectionCaps sections={model.sections} plane={plane} />
        </>
      )}
      <LowerIntake plane={plane} control={control} />
      <AirRibbons control={control} plane={plane} />
      <ReadyGate ready={!!model} release={release} />
    </>
  )
}

export type { Prepared }
