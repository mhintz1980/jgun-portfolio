import { useLoader } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Color, Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { useMemo, useState } from 'react'
import { useQuality } from '../../state/qualityStore'
import { setScrollState, useScrollValue } from '../../state/scrollStore'

const ASSET_PATHS = ['/models/msp-enclosure.glb'] as const

const REQUIRED_NODES = [
  'ENCLOSURE_CHASSIS',
  'COMPOSITE_PANELS',
  'PUMP_HOUSING',
  'ACOUSTIC_BAFFLES',
  'ISOLATION_MOUNTS',
  'DUCT_INTAKE',
  'DUCT_EXHAUST',
] as const

export interface EnclosureSubassembly {
  id: string
  name: (typeof REQUIRED_NODES)[number]
  label: string
  spec: string
  roleColor: string
}

export const ENCLOSURE_SUBASSEMBLIES: Record<string, EnclosureSubassembly> = {
  ENCLOSURE_CHASSIS: {
    id: 'chassis',
    name: 'ENCLOSURE_CHASSIS',
    label: 'EXTRUDED CHASSIS FRAMEWORK',
    spec: 'Structural welded aluminum unibody with modular mounting channels',
    roleColor: '#6b7280',
  },
  COMPOSITE_PANELS: {
    id: 'panels',
    name: 'COMPOSITE_PANELS',
    label: '5-LAYER COMPOSITE ACOUSTIC WALLS',
    spec: 'Mass-loaded vinyl core + dual-density closed-cell decoupling foam (-43 dBA)',
    roleColor: '#9ca3af',
  },
  PUMP_HOUSING: {
    id: 'pump',
    name: 'PUMP_HOUSING',
    label: 'INTERNAL DRIVE UNIT & PUMP',
    spec: 'High-pressure continuous rotary pump generating 115 dBA source noise',
    roleColor: '#d97706',
  },
  ACOUSTIC_BAFFLES: {
    id: 'baffles',
    name: 'ACOUSTIC_BAFFLES',
    label: 'INTERNAL ACOUSTIC LABYRINTH',
    spec: 'Sound-dissipating geometric baffles trapping high-frequency acoustic waves',
    roleColor: '#374151',
  },
  ISOLATION_MOUNTS: {
    id: 'mounts',
    name: 'ISOLATION_MOUNTS',
    label: 'VIBRATION DECOUPLING MOUNTS',
    spec: 'Elastomeric shear isolators preventing structure-borne chassis resonance',
    roleColor: '#111827',
  },
  DUCT_INTAKE: {
    id: 'intake',
    name: 'DUCT_INTAKE',
    label: 'LAMINAR INTAKE AIRWAY',
    spec: '1,850 CFM low-velocity cooling intake with acoustic foam lining',
    roleColor: '#0891b2',
  },
  DUCT_EXHAUST: {
    id: 'exhaust',
    name: 'DUCT_EXHAUST',
    label: 'ATTENUATED EXHAUST DUCT',
    spec: 'Low-backpressure thermal discharge port with integrated sound arrestor',
    roleColor: '#f97316',
  },
}

function cloneMaterials(root: Object3D, lite: boolean): void {
  const meta = ENCLOSURE_SUBASSEMBLIES[root.name]
  const roleColor = meta?.roleColor ?? '#6b7280'

  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    object.material = materials.map((material) => {
      const clone = material.clone()
      if (clone instanceof MeshStandardMaterial) {
        clone.color.set(roleColor)
        clone.roughness = lite ? Math.max(clone.roughness, 0.62) : clone.roughness
        clone.userData.baseColor = new Color(roleColor)
      }
      return clone
    }) as Material[]
  })
}

function findStableNode(roots: Object3D[], name: string): Object3D | null {
  for (const root of roots) {
    const found = root.getObjectByName(name)
    if (found) return found
  }
  return null
}

export function Station2_AcousticEnclosure() {
  const { tier } = useQuality()
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const activeHotspotId = useScrollValue('hotspotId')

  const gltfs = useLoader(GLTFLoader, [...ASSET_PATHS], (loader) => {
    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    loader.setDRACOLoader(draco)
  })

  const scene = useMemo(() => {
    const roots = gltfs.map((gltf) => gltf.scene)
    const missing = REQUIRED_NODES.filter((name) => !findStableNode(roots, name))
    if (missing.length > 0 && import.meta.env.DEV) {
      console.warn(`[Station2] Missing stable nodes: ${missing.join(', ')}`)
    }

    const group = new Group()
    for (const name of REQUIRED_NODES) {
      const source = findStableNode(roots, name)
      if (!source) continue
      const clone = source.clone(true)
      cloneMaterials(clone, tier === 'lite')
      group.add(clone)
    }
    return group
  }, [gltfs, tier])

  // Update emissive highlighting on hover / inspect
  useMemo(() => {
    scene.children.forEach((child) => {
      const isHighlighted =
        child.name === hoveredNode || (activeHotspotId && child.name.toLowerCase().includes(activeHotspotId))

      child.traverse((obj) => {
        if (!(obj instanceof Mesh)) return
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((mat) => {
          if (mat instanceof MeshStandardMaterial) {
            if (isHighlighted) {
              mat.emissive.set('#00e5ff')
              mat.emissiveIntensity = 0.35
            } else {
              mat.emissive.set('#000000')
              mat.emissiveIntensity = 0.0
            }
          }
        })
      })
    })
  }, [scene, hoveredNode, activeHotspotId])

  return (
    <primitive
      object={scene}
      dispose={null}
      onPointerOver={(e: { stopPropagation: () => void; object: Object3D }) => {
        e.stopPropagation()
        let cur: Object3D | null = e.object
        while (cur && cur !== scene) {
          if (cur.name && REQUIRED_NODES.includes(cur.name as (typeof REQUIRED_NODES)[number])) {
            setHoveredNode(cur.name)
            return
          }
          cur = cur.parent
        }
      }}
      onPointerOut={() => setHoveredNode(null)}
      onClick={(e: { stopPropagation: () => void; object: Object3D }) => {
        e.stopPropagation()
        let cur: Object3D | null = e.object
        while (cur && cur !== scene) {
          if (cur.name && REQUIRED_NODES.includes(cur.name as (typeof REQUIRED_NODES)[number])) {
            const sub = ENCLOSURE_SUBASSEMBLIES[cur.name]
            if (sub) {
              setScrollState({ hotspotId: sub.id })
            }
            return
          }
          cur = cur.parent
        }
      }}
    />
  )
}

export const STATION2_ASSET_PATHS = ASSET_PATHS
export const STATION2_REQUIRED_NODES = REQUIRED_NODES
