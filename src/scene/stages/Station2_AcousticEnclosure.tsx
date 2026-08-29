import { useLoader } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Color, DoubleSide, FrontSide, Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { useMemo, useState } from 'react'
import { useQuality } from '../../state/qualityStore'
import { setScrollState, useScrollValue } from '../../state/scrollStore'
import { HOTSPOTS } from '../../data/caseStudies'
import { HotspotButton, SpatialLeaderLine } from '../Hotspots'
import type { HotspotDef } from '../../types/portfolio'

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
    id: 'enclosure-chassis',
    name: 'ENCLOSURE_CHASSIS',
    label: 'EXTRUDED CHASSIS FRAMEWORK',
    spec: 'Structural welded aluminum unibody with modular mounting channels',
    roleColor: '#6b7280',
  },
  COMPOSITE_PANELS: {
    id: 'composite-panels',
    name: 'COMPOSITE_PANELS',
    label: '5-LAYER COMPOSITE ACOUSTIC WALLS',
    spec: 'Mass-loaded vinyl core + dual-density closed-cell decoupling foam (-43 dBA)',
    roleColor: '#9ca3af',
  },
  PUMP_HOUSING: {
    id: 'pump-housing',
    name: 'PUMP_HOUSING',
    label: 'INTERNAL DRIVE UNIT & PUMP',
    spec: 'High-pressure continuous rotary pump generating 115 dBA source noise',
    roleColor: '#d97706',
  },
  ACOUSTIC_BAFFLES: {
    id: 'acoustic-baffles',
    name: 'ACOUSTIC_BAFFLES',
    label: 'INTERNAL ACOUSTIC LABYRINTH',
    spec: 'Sound-dissipating geometric baffles trapping high-frequency acoustic waves',
    roleColor: '#374151',
  },
  ISOLATION_MOUNTS: {
    id: 'isolation-mounts',
    name: 'ISOLATION_MOUNTS',
    label: 'VIBRATION DECOUPLING MOUNTS',
    spec: 'Elastomeric shear isolators preventing structure-borne chassis resonance',
    roleColor: '#111827',
  },
  DUCT_INTAKE: {
    id: 'duct-intake',
    name: 'DUCT_INTAKE',
    label: 'LAMINAR INTAKE AIRWAY',
    spec: '1,850 CFM low-velocity cooling intake with acoustic foam lining',
    roleColor: '#0891b2',
  },
  DUCT_EXHAUST: {
    id: 'duct-exhaust',
    name: 'DUCT_EXHAUST',
    label: 'ATTENUATED EXHAUST DUCT',
    spec: 'Low-backpressure thermal discharge port with integrated sound arrestor',
    roleColor: '#f97316',
  },
}

const STATION2_HOTSPOT_CONFIG: Record<string, { pos: [number, number, number]; dx: number; dy: number }> = {
  'enclosure-chassis': { pos: [0.0, 2.30, -0.40], dx: 240, dy: -90 },
  'composite-panels': { pos: [1.80, 1.50, 0.30], dx: 240, dy: -110 },
  'pump-housing': { pos: [0.02, 0.90, 0.00], dx: -220, dy: -80 },
  'acoustic-baffles': { pos: [-1.32, 1.55, -0.38], dx: -240, dy: 80 },
  'isolation-mounts': { pos: [0.60, 0.05, 0.60], dx: 220, dy: 90 },
  'duct-intake': { pos: [0.00, 1.35, 0.95], dx: -240, dy: -90 },
  'duct-exhaust': { pos: [-0.10, 1.50, -1.30], dx: 230, dy: -80 },
}

function Station2HotspotAnchor({
  def,
  selected,
}: {
  def: HotspotDef
  selected: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const config = STATION2_HOTSPOT_CONFIG[def.id] ?? { pos: [0, 0, 0], dx: 220, dy: -90 }
  const isRight = config.dx > 0

  return (
    <group position={config.pos}>
      <Html
        center={false}
        distanceFactor={7.5}
        zIndexRange={[40, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="relative">
          <SpatialLeaderLine
            dx={config.dx}
            dy={config.dy}
            selected={selected}
            hovered={hovered}
          />
          <div
            style={{
              position: 'absolute',
              left: `${config.dx}px`,
              top: `${config.dy - 14}px`,
              transform: isRight ? 'none' : 'translateX(-100%)',
              transformOrigin: isRight ? 'left center' : 'right center',
            }}
          >
            <HotspotButton
              def={def}
              selected={selected}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            />
          </div>
        </div>
      </Html>
    </group>
  )
}

function cloneMaterials(root: Object3D, lite: boolean): void {
  const meta = ENCLOSURE_SUBASSEMBLIES[root.name]
  const roleColor = new Color(meta?.roleColor ?? '#6b7280')
  const isPanels = root.name === 'COMPOSITE_PANELS'

  // Functional parts get higher role tint (t ≈ 0.55); structural roots get subtle tint (t ≈ 0.15)
  const isFunctional =
    root.name === 'DUCT_INTAKE' ||
    root.name === 'DUCT_EXHAUST' ||
    root.name === 'PUMP_HOUSING'
  const tintFactor = isFunctional ? 0.55 : 0.15

  const processMaterial = (material: Material): Material => {
    const clone = material.clone()
    if (clone instanceof MeshStandardMaterial) {
      // Keep GLB baked source color and lerp toward role color with functional/structural weights
      clone.color.lerp(roleColor, tintFactor)

      // Keep GLB metalness/roughness clamped to plausible engineering range
      clone.metalness = Math.min(1, Math.max(0, clone.metalness))
      clone.roughness = Math.min(1, Math.max(0.1, clone.roughness))
      if (lite) {
        clone.roughness = Math.max(clone.roughness, 0.62)
      }

      // DoubleSide only on composite panels
      clone.side = isPanels ? DoubleSide : FrontSide

      if (isPanels) {
        clone.transparent = true
        clone.opacity = 0.68
        clone.depthWrite = false
      }

      clone.userData.baseColor = clone.color.clone()
    }
    return clone
  }

  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    if (isPanels) {
      object.renderOrder = 10 // render panels after opaque internals to prevent sorting artifacts
    }
    if (Array.isArray(object.material)) {
      object.material = object.material.map(processMaterial)
    } else if (object.material) {
      object.material = processMaterial(object.material)
    }
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
  const chapter = useScrollValue('chapter')

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
      const sub = ENCLOSURE_SUBASSEMBLIES[child.name]
      const isHighlighted =
        child.name === hoveredNode || (activeHotspotId && sub && sub.id === activeHotspotId)

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

  const station2Hotspots = useMemo(() => {
    return HOTSPOTS.filter((h) => h.chapters.includes(2))
  }, [])

  return (
    <group>
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

      {/* 3D Spatial Datum Markers on Station 2 */}
      {chapter === 2 &&
        station2Hotspots.map((def) => (
          <Station2HotspotAnchor
            key={def.id}
            def={def}
            selected={activeHotspotId === def.id}
          />
        ))}
    </group>
  )
}

export const STATION2_ASSET_PATHS = ASSET_PATHS
export const STATION2_REQUIRED_NODES = REQUIRED_NODES
