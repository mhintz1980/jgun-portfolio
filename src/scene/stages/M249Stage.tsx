import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { Box3, Group, Material, Mesh, Vector3 } from "three"
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
  const originalMaterials = useRef(new Map<Mesh, Material | Material[]>())
  const cadBound = useRef(false)

  const { sweepMin, sweepMax, center } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const center = box.getCenter(new Vector3())
    return {
      sweepMin: box.min.z,
      sweepMax: box.max.z,
      center,
    }
  }, [scene])

  const cadMaterial = useMemo(
    () =>
      createCadTransitionMaterial({
        sweepMin: sweepMin - center.z,
        sweepMax: sweepMax - center.z,
      }),
    [sweepMin, sweepMax, center],
  )

  const bindCadMaterial = () => {
    if (cadBound.current) return
    scene.traverse((node) => {
      if (!(node instanceof Mesh)) return
      originalMaterials.current.set(node, node.material)
      node.material = cadMaterial
    })
    cadBound.current = true
  }

  const restoreOriginalMaterials = () => {
    if (!cadBound.current) return
    for (const [mesh, material] of originalMaterials.current) mesh.material = material
    originalMaterials.current.clear()
    cadBound.current = false
  }

  useEffect(() => {
    return () => {
      restoreOriginalMaterials()
      cadMaterial.dispose()
    }
  }, [cadMaterial])

  useFrame((_, delta) => {
    const { chapter, chapterProgress } = getScrollState()
    const { tier } = getQuality()
    const wantCad = chapter === 3 && tier === "full"

    cadMaterial.uniforms.uTime.value += delta
    if (groupRef.current) {
      cadMaterial.uniforms.uRootInv.value.copy(groupRef.current.matrixWorld).invert()
    }
    if (wantCad) {
      bindCadMaterial()
      cadMaterial.uniforms.uProgress.value = chapterProgress
    } else {
      restoreOriginalMaterials()
    }
  })

  return (
    <group ref={groupRef} position={[-center.x, -center.y, -center.z]}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
