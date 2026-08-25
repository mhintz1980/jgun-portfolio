import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { Box3, Group, Vector3 } from "three"
import { createCadTransitionMaterial } from "../../shaders/CadTransitionShader"
import { getScrollState } from "../../state/scrollStore"
import { getQuality } from "../../state/qualityStore"

const MODEL_URL = "/models/m249-transformed.glb"

/**
 * CR-6 -- Real M249/MK46 receiver platform GLB.
 *
 * Replaces the procedural rejection-sampled point-cloud placeholder in
 * StageManager stage 2 (CH.04). The model is Draco-compressed (KHR_draco,
 * confirmed by binary probe 2026-08-25); the same vendored public/draco/
 * decoders used for Default.glb cover it.
 *
 * CadTransitionShader is bound to the model actual Z bounds so the CH.04
 * dissolve scanline tracks the real geometry (previously aimed at the
 * sunken wrench -- spec 14.3 known-gap, now resolved).
 */
export function M249Stage() {
  const { scene } = useGLTF(MODEL_URL)
  const groupRef = useRef<Group>(null)

  const { sweepMin, sweepMax, centerZ } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const center = box.getCenter(new Vector3())
    return {
      sweepMin: box.min.z,
      sweepMax: box.max.z,
      centerZ: center.z,
    }
  }, [scene])

  const cadMaterial = useMemo(
    () =>
      createCadTransitionMaterial({
        sweepMin: sweepMin - centerZ,
        sweepMax: sweepMax - centerZ,
      }),
    [sweepMin, sweepMax, centerZ],
  )

  useFrame((_, delta) => {
    const { chapter, chapterProgress } = getScrollState()
    const { tier } = getQuality()

    cadMaterial.uniforms.uTime.value += delta
    if (chapter === 3 && tier === "full") {
      cadMaterial.uniforms.uProgress.value = chapterProgress
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -centerZ]}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
