import { useFrame, useLoader } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DoubleSide, FrontSide, Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three'
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
 * Material treatment — JG-021 materials round 3 (2026-08-30 owner ruling):
 * RETAIN the GLB's baked CAD palette. Both repaint attempts failed owner
 * review — the role-tint lerp pulled black/rubber toward grey (round 1
 * "wrong tints on black parts") and repainted large meshes into saturated
 * walls (round 2: DUCT_INTAKE's biggest face, an opaque MSP_YELLOW_PAINT
 * intake grille, lerped teal and read as "the cyan camera-facing panel");
 * the remediation's dark finish matrix flattened the whole identity to
 * charcoal under metalness-1 env reflections (milky grey). Subassembly
 * identity in 3D comes from the CAD's own material distribution; roleColor
 * above is registry/HUD documentation only. The loader already delivers
 * MSP_AIRWAY_VOLUME as the CAD author baked it — translucent cyan at
 * alpha 0.22 — so no code touches it.
 *
 * The one intentional mutation is COMPOSITE_PANELS translucency: the owner
 * confirmed the acoustic walls are meant to be mostly transparent, showing
 * the internals; 0.68 rest read as "mostly opaque".
 */
const PANEL_OPACITY_ASSEMBLED = 0.35
const PANEL_OPACITY_REVEALED = 0.18

/**
 * JG-021 glow experiment 1 (Mark-directed, 2026-08-30): while the residual
 * enclosure glow is isolated, panels render fully opaque — skipping the
 * translucent block keeps the GLB-baked material props (transparent=false,
 * depthWrite=true) and turns the useFrame opacity writes into rendering
 * no-ops. The cutaway lift still runs. Flip to false to restore the
 * owner-approved 0.35/0.18 translucent treatment.
 */
const PANELS_OPAQUE = true

function cloneMaterials(
  root: Object3D,
  lite: boolean,
  panelMaterialsCollector?: MeshStandardMaterial[],
): void {
  const isPanels = root.name === 'COMPOSITE_PANELS'

  const processMaterial = (material: Material): Material => {
    const clone = material.clone()
    if (clone instanceof MeshStandardMaterial) {
      // Keep GLB metalness/roughness clamped to plausible engineering range
      clone.metalness = Math.min(1, Math.max(0, clone.metalness))
      clone.roughness = Math.min(1, Math.max(0.1, clone.roughness))
      if (lite) {
        clone.roughness = Math.max(clone.roughness, 0.62)
      }

      // DoubleSide only on composite panels
      clone.side = isPanels ? DoubleSide : FrontSide

      if (isPanels) {
        if (!PANELS_OPAQUE) {
          clone.transparent = true
          clone.opacity = PANEL_OPACITY_ASSEMBLED
          clone.depthWrite = false
        }
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
        m.opacity = PANEL_OPACITY_ASSEMBLED
      })
      return
    }

    // Panel Cutaway Lifecycle:
    // - [0.000, 0.585]: Assembled (y = 0, opacity = PANEL_OPACITY_ASSEMBLED)
    // - [0.585, 0.645]: Lift reveal (y: 0 -> 0.55m, opacity fades ASSEMBLED -> REVEALED)
    // - [0.645, 0.700]: Hold lifted (y = 0.55m, opacity = PANEL_OPACITY_REVEALED)
    // - [0.700, 0.715]: Restore assembled (y: 0.55m -> 0, opacity REVEALED -> ASSEMBLED)
    // - [0.715, 1.000]: Assembled (y = 0, opacity = PANEL_OPACITY_ASSEMBLED)
    let panelY = 0
    let panelOpacity = PANEL_OPACITY_ASSEMBLED

    if (progress >= 0.585 && progress <= 0.645) {
      const u = (progress - 0.585) / (0.645 - 0.585)
      const s = u * u * (3 - 2 * u)
      panelY = 0.55 * s
      panelOpacity = PANEL_OPACITY_ASSEMBLED - (PANEL_OPACITY_ASSEMBLED - PANEL_OPACITY_REVEALED) * s
    } else if (progress > 0.645 && progress < 0.700) {
      panelY = 0.55
      panelOpacity = PANEL_OPACITY_REVEALED
    } else if (progress >= 0.700 && progress <= 0.715) {
      const u = (progress - 0.700) / (0.715 - 0.700)
      const s = u * u * (3 - 2 * u)
      panelY = 0.55 * (1 - s)
      panelOpacity = PANEL_OPACITY_REVEALED + (PANEL_OPACITY_ASSEMBLED - PANEL_OPACITY_REVEALED) * s
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
