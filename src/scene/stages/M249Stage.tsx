import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { Box3, Group, Material, Mesh, MeshStandardMaterial, Vector3 } from "three"
import { createCadTransitionMaterial } from "../../shaders/CadTransitionShader"
import { getScrollState, setScrollState, useScrollValue } from "../../state/scrollStore"
import { getQuality } from "../../state/qualityStore"
import { HOTSPOTS } from "../../data/caseStudies"
import { SpatialHotspotAnchor } from "../Hotspots"

const MODEL_URL = "/models/m249-transformed.glb"

const STATION3_HOTSPOT_CONFIG: Record<string, { pos: [number, number, number]; dx: number; dy: number }> = {
  "m249-rail": { pos: [0, 0.10, -0.08], dx: -220, dy: -100 },
  "m249-feed-tray": { pos: [0, 0.06, 0.04], dx: -220, dy: -20 },
  "m249-trunnion": { pos: [0, 0.02, 0.15], dx: 220, dy: -60 },
  "m249-receiver": { pos: [0, 0.04, 0], dx: 220, dy: 90 },
}

/**
 * CR-6 -- Real M249/MK46 receiver platform GLB + Interactive Subassembly Inspection.
 *
 * Replaces the procedural rejection-sampled point-cloud placeholder in
 * StageManager stage 2 (CH.04). The model is Draco-compressed (KHR_draco,
 * confirmed by binary probe 2026-08-25); the same vendored public/draco/
 * decoders used for Default.glb cover it.
 */
export function M249Stage() {
  const { scene } = useGLTF(MODEL_URL)
  const groupRef = useRef<Group>(null)
  const originalMaterials = useRef(new Map<Mesh, Material | Material[]>())
  const cadBound = useRef(false)
  const activeHotspotId = useScrollValue("hotspotId")
  const chapter = useScrollValue("chapter")
  const [hovered, setHovered] = useState(false)

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

  // Emissive highlight on inspect/hover
  useMemo(() => {
    if (cadBound.current) return
    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      materials.forEach((mat) => {
        if (mat instanceof MeshStandardMaterial) {
          if (hovered || (activeHotspotId && activeHotspotId.startsWith("m249"))) {
            mat.emissive.set("#00e5ff")
            mat.emissiveIntensity = 0.25
          } else {
            mat.emissive.set("#000000")
            mat.emissiveIntensity = 0.0
          }
        }
      })
    })
  }, [scene, hovered, activeHotspotId])

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

  const station3Hotspots = useMemo(() => {
    return HOTSPOTS.filter((h) => h.chapters.includes(3) && h.id.startsWith("m249"))
  }, [])

  return (
    <group ref={groupRef} position={[-center.x, -center.y, -center.z]}>
      <primitive
        object={scene}
        onPointerOver={(e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: { stopPropagation: () => void; point: Vector3 }) => {
          e.stopPropagation()
          // Classify subassembly by click position in model frame
          const pt = e.point.clone().sub(new Vector3(56, 0, -12))
          if (pt.y > 0.08) {
            setScrollState({ hotspotId: "m249-rail" })
          } else if (pt.z > 0.1) {
            setScrollState({ hotspotId: "m249-trunnion" })
          } else if (pt.y > 0.04) {
            setScrollState({ hotspotId: "m249-feed-tray" })
          } else {
            setScrollState({ hotspotId: "m249-receiver" })
          }
        }}
      />

      {/* 3D Spatial Datum Markers on Station 3 */}
      {chapter === 3 &&
        station3Hotspots.map((def) => {
          const config = STATION3_HOTSPOT_CONFIG[def.id] ?? { pos: [0, 0, 0], dx: 200, dy: -80 }
          return (
            <SpatialHotspotAnchor
              key={def.id}
              def={def}
              position={config.pos}
              nominalDx={config.dx}
              nominalDy={config.dy}
              selected={activeHotspotId === def.id}
            />
          )
        })}
    </group>
  )
}

useGLTF.preload(MODEL_URL)
