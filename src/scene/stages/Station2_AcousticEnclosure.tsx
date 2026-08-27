import { useLoader } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { useMemo } from 'react'
import { useQuality } from '../../state/qualityStore'

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

const ROLE_COLORS: Record<string, string> = {
  ENCLOSURE_CHASSIS: '#6b7280',
  COMPOSITE_PANELS: '#9ca3af',
  PUMP_HOUSING: '#d97706',
  ACOUSTIC_BAFFLES: '#374151',
  ISOLATION_MOUNTS: '#111827',
  DUCT_INTAKE: '#0891b2',
  DUCT_EXHAUST: '#f97316',
}

function cloneMaterials(root: Object3D, lite: boolean): void {
  const roleColor = ROLE_COLORS[root.name]
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    object.material = materials.map((material) => {
      const clone = material.clone()
      if (clone instanceof MeshStandardMaterial) {
        if (roleColor) clone.color.set(roleColor)
        clone.roughness = lite ? Math.max(clone.roughness, 0.62) : clone.roughness
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

  return <primitive object={scene} dispose={null} />
}

export const STATION2_ASSET_PATHS = ASSET_PATHS
export const STATION2_REQUIRED_NODES = REQUIRED_NODES
