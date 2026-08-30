import { useFrame, useLoader } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Color, DoubleSide, FrontSide, Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { useMemo, useRef, useState } from 'react'
import { getQuality, useQuality } from '../../state/qualityStore'
import { getScrollState, setScrollState, useScrollValue } from '../../state/scrollStore'
import { HOTSPOTS } from '../../data/caseStudies'
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
    roleColor: '#b45309',
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
    roleColor: '#0e7490',
  },
  DUCT_EXHAUST: {
    id: 'duct-exhaust',
    name: 'DUCT_EXHAUST',
    label: 'ATTENUATED EXHAUST DUCT',
    spec: 'Low-backpressure thermal discharge port with integrated sound arrestor',
    roleColor: '#c2410c',
  },
}

import { STATION2_CAD_ANCHORS } from './stageWindows'
import { SpatialHotspotAnchor } from '../Hotspots'

const STATION2_ANCHOR_MAP: Record<string, { pos: readonly [number, number, number]; dx: number; dy: number }> = {
  'enclosure-chassis': { pos: STATION2_CAD_ANCHORS.enclosureChassis, dx: 220, dy: -140 },
  'composite-panels': { pos: STATION2_CAD_ANCHORS.compositePanels, dx: 220, dy: -70 },
  'duct-exhaust': { pos: STATION2_CAD_ANCHORS.ductExhaust, dx: 220, dy: 20 },
  'isolation-mounts': { pos: STATION2_CAD_ANCHORS.isolationMounts, dx: 220, dy: 110 },
  'pump-housing': { pos: STATION2_CAD_ANCHORS.pumpHousing, dx: -220, dy: -210 },
  'acoustic-baffles': { pos: STATION2_CAD_ANCHORS.acousticBaffles, dx: -220, dy: -20 },
  'duct-intake': { pos: STATION2_CAD_ANCHORS.ductIntake, dx: -220, dy: 100 },
}

function Station2Callout({
  def,
  selected,
}: {
  def: HotspotDef
  selected: boolean
}) {
  const groupRef = useRef<Group>(null)
  const config = STATION2_ANCHOR_MAP[def.id] ?? { pos: [0, 0, 0], dx: 200, dy: -80 }
  const isInternal =
    def.id === 'pump-housing' ||
    def.id === 'acoustic-baffles' ||
    def.id === 'duct-intake' ||
    def.id === 'duct-exhaust'

  useFrame(() => {
    if (!groupRef.current) return
    const { progress } = getScrollState()
    // Internal subassemblies visible only during lifted reveal [0.610, 0.700]
    // External subassemblies visible from entry [0.565, 0.720]
    const isVisible = isInternal
      ? progress >= 0.610 && progress <= 0.700
      : progress >= 0.565 && progress <= 0.720
    groupRef.current.visible = isVisible
  })

  return (
    <group ref={groupRef}>
      <SpatialHotspotAnchor
        def={def}
        selected={selected}
        position={[...config.pos]}
        nominalDx={config.dx}
        nominalDy={config.dy}
      />
    </group>
  )
}

/**
 * GLB source material → dark industrial finish (JG-021 remediation).
 * The CAD package ships bright display colors (yellow paint on 138 meshes,
 * near-white stainless/plastic on ~220 more, coppery cast steel) that read
 * blown-out and orange/yellow where the product is black — the owner visual
 * pass failed the material look on exactly this. Keyed by the 9 verified GLB
 * material names; MSP_AIRWAY_VOLUME keeps its functional translucent cyan.
 */
const MSP_FINISH_OVERRIDES: Record<string, string> = {
  MSP_YELLOW_PAINT: '#23262b', // the dominant "should be black" mass → charcoal
  MSP_STAINLESS: '#43494f', // dark stainless
  MSP_ALUMINUM: '#4c5258', // extruded frame aluminum
  MSP_RUBBER: '#14161a', // elastomer stays near-black
  MSP_BLACK_CHASSIS: '#1b1e23', // true chassis black
  MSP_PLASTIC: '#2b2f35', // dark composite plastic
  MSP_STEEL_MACHINED: '#5a6169', // machined steel — mid tone to catch the key
  MSP_STEEL_CAST: '#3c4147', // cast iron (kills the copper #c18b72)
}

function cloneMaterials(
  root: Object3D,
  lite: boolean,
  panelMaterialsCollector?: MeshStandardMaterial[],
): void {
  const meta = ENCLOSURE_SUBASSEMBLIES[root.name]
  const roleColor = new Color(meta?.roleColor ?? '#6b7280')
  const isPanels = root.name === 'COMPOSITE_PANELS'

  // Functional parts get higher role tint (t ≈ 0.55) over the darkened base
  // (deep accent hues, remediation-deepened from the bright originals);
  // structural roots get a subtle tint (t ≈ 0.15) for hierarchy.
  const isFunctional =
    root.name === 'DUCT_INTAKE' ||
    root.name === 'DUCT_EXHAUST' ||
    root.name === 'PUMP_HOUSING'
  const tintFactor = isFunctional ? 0.55 : 0.15

  const processMaterial = (material: Material): Material => {
    const clone = material.clone()
    if (clone instanceof MeshStandardMaterial) {
      // Dark industrial base from the GLB source identity, then role tint.
      // The translucent airway volume is purely functional — never re-tinted.
      if (clone.name === 'MSP_AIRWAY_VOLUME') {
        // keep baked cyan + transparency
      } else {
        const finish = MSP_FINISH_OVERRIDES[clone.name]
        if (finish) {
          clone.color.set(finish)
        }
        clone.color.lerp(roleColor, tintFactor)
      }

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
        if (panelMaterialsCollector) {
          panelMaterialsCollector.push(clone)
        }
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

  const panelsRootRef = useRef<Object3D | null>(null)
  const panelMaterialsRef = useRef<MeshStandardMaterial[]>([])

  const gltfs = useLoader(GLTFLoader, [...ASSET_PATHS], (loader) => {
    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    loader.setDRACOLoader(draco)
  })

  const scene = useMemo(() => {
    panelMaterialsRef.current = []
    panelsRootRef.current = null

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
      if (name === 'COMPOSITE_PANELS') {
        panelsRootRef.current = clone
      }
      cloneMaterials(clone, tier === 'lite', panelMaterialsRef.current)
      group.add(clone)
    }
    return group
  }, [gltfs, tier])

  // Animate COMPOSITE_PANELS cutaway reveal and restore in useFrame (zero React re-renders)
  useFrame(() => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()

    if (reducedMotion) {
      if (panelsRootRef.current) panelsRootRef.current.position.y = 0
      panelMaterialsRef.current.forEach((m) => {
        m.opacity = 0.68
      })
      return
    }

    // Panel Cutaway Lifecycle:
    // - [0.000, 0.585]: Assembled (y = 0, opacity = 0.68)
    // - [0.585, 0.645]: Lift reveal (y: 0 -> 0.55m, opacity: 0.68 -> 0.42)
    // - [0.645, 0.700]: Hold lifted (y = 0.55m, opacity = 0.42)
    // - [0.700, 0.715]: Restore assembled (y: 0.55m -> 0, opacity: 0.42 -> 0.68)
    // - [0.715, 1.000]: Assembled (y = 0, opacity = 0.68)
    let panelY = 0
    let panelOpacity = 0.68

    if (progress >= 0.585 && progress <= 0.645) {
      const u = (progress - 0.585) / (0.645 - 0.585)
      const s = u * u * (3 - 2 * u)
      panelY = 0.55 * s
      panelOpacity = 0.68 - (0.68 - 0.42) * s
    } else if (progress > 0.645 && progress < 0.700) {
      panelY = 0.55
      panelOpacity = 0.42
    } else if (progress >= 0.700 && progress <= 0.715) {
      const u = (progress - 0.700) / (0.715 - 0.700)
      const s = u * u * (3 - 2 * u)
      panelY = 0.55 * (1 - s)
      panelOpacity = 0.42 + (0.68 - 0.42) * s
    }

    if (panelsRootRef.current) {
      panelsRootRef.current.position.y = panelY
    }
    panelMaterialsRef.current.forEach((mat) => {
      mat.opacity = panelOpacity
    })
  })

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
          <Station2Callout
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
