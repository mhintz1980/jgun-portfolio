import { useFrame, useLoader } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DoubleSide, FrontSide, Group, Material, Mesh, MeshStandardMaterial, Object3D, Plane, Vector3 } from 'three'
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
import { recolorSpecFor } from './recolorAllowList'
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
    // Internal subassemblies visible only during the cross-section hold [0.610, 0.700]
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
        tone="dim"
      />
    </group>
  )
}

/**
 * Material treatment — JG-032 dark-blue recolor (2026-09-08 owner ruling):
 * the owner APPROVED the dark-blue enclosure treatment, SUPERSEDING the
 * JG-021 materials round-3 ruling (2026-08-30: "RETAIN the GLB's baked CAD
 * palette") that previously occupied this block. JG-021's failure catalogue
 * remains the binding constraint (see recolorAllowList.ts for the full
 * mapping): (1) no tint-lerps that pull black/rubber toward grey — the
 * recolor only SETs explicit finishes on allow-listed part numbers;
 * (2) no MSP_YELLOW_PAINT mesh is ever repainted — the intake grille
 * G2RL300-SAF-1003-2 stays canary, protected by material gate AND absence
 * from the allow-list; (3) the finish matrix sits below the milky-grey
 * metalness/env band that flattened the remediation to charcoal.
 *
 * The predicate (recolorSpecFor) is evaluated PER MESH inside the traverse
 * below — never on a root, which is what repainted all 191 chassis children
 * in the rejected draft. Part numbers are the stable key (AGENTS.md).
 *
 * The loader already delivers MSP_AIRWAY_VOLUME as the CAD author baked it —
 * translucent cyan at alpha 0.22 — so no code touches it.
 *
 * The one intentional mutation from JG-021 that survives: COMPOSITE_PANELS
 * translucency — the owner confirmed the acoustic walls are meant to be
 * mostly transparent, showing the internals; 0.68 rest read as "mostly
 * opaque".
 */
const PANEL_OPACITY_ASSEMBLED = 0.35
const PANEL_OPACITY_REVEALED = 0.18

/**
 * JG-021 glow experiment 1 (Mark-directed, 2026-08-30): while the residual
 * enclosure glow is isolated, panels render fully opaque — skipping the
 * translucent block keeps the GLB-baked material props (transparent=false,
 * depthWrite=true) and turns the useFrame opacity writes into rendering
 * no-ops. The cutaway is now driven by the cross-section clipping plane
 * (JG-032 rev2), not a lift. Flip to false to disable panel translucency.
 *
 * JG-032 (2026-09-08, isolated revert-gated commit): flipped to false —
 * the translucent treatment is restored now that the JG-021 glow drivers
 * (IBL blowout, additive wash) are resolved and the recolor landed. If
 * clipping/sorting artifacts or a glow regression appear at owner review,
 * revert this single const to true (or fall back to fading panel opacity
 * to 0.15 during the hold window only). COMPOSITE_PANELS renderOrder = 10
 * and DoubleSide are untouched.
 */
const PANELS_OPAQUE = false

/**
 * JG-032 rev2 (owner ruling 2026-09-08, superseding the panel-lift): the
 * enclosure is revealed by an ANIMATED CROSS-SECTION, not a vertical lift.
 * A single world-space clipping plane (normal −X) sweeps across the
 * enclosure shell — ENCLOSURE_CHASSIS and COMPOSITE_PANELS only. The engine/
 * pump, skid/isolation mounts, baffles, and both ducts are NEVER clipped.
 *
 * Choreography (same windows as the retired lift, timing preserved):
 *   p ≤ 0.585       closed (plane parked beyond the +X extent)
 *   0.585–0.645     cut opens (plane sweeps +X → mid)
 *   0.645–0.700     hold open (internals window [0.610, 0.700] unchanged)
 *   0.700–0.715     cut closes
 *   p ≥ 0.715       closed
 * Panels also fade 0.35 → 0.18 with the cut so the interior stays readable.
 *
 * Clipping planes are world-space: the constant rides the Station-2 origin
 * x = 28. Chassis clones go DoubleSide so the cut members read solid from
 * the sectioned side instead of hollow.
 */
const CUT_STATION_X = 28
const CUT_CLOSED_X = CUT_STATION_X + 1.3 // parked beyond the shell (+X extent ≈ 1.2)
const CUT_OPEN_X = CUT_STATION_X + 0.0 // mid-section
const CUT_PLANE = new Plane(new Vector3(-1, 0, 0), CUT_CLOSED_X)
const CUT_ROOTS = new Set<string>(['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS'])

function resolvePartNodeName(object: Object3D): string {
  let cur: Object3D | null = object
  while (cur) {
    if (cur.name && !/^mesh\d+_mesh(_\d+)?$/i.test(cur.name)) return cur.name
    cur = cur.parent
  }
  return object.name
}

function cloneMaterials(
  root: Object3D,
  lite: boolean,
  panelMaterialsCollector?: MeshStandardMaterial[],
): void {
  const isPanels = root.name === 'COMPOSITE_PANELS'
  // JG-032 recolor scope gate: only the chassis and panel roots are even
  // eligible — the per-mesh allow-list predicate decides inside them.
  const recolorScope = isPanels || root.name === 'ENCLOSURE_CHASSIS'
  // JG-032 rev2: only the enclosure shell is sectioned
  const cutScope = CUT_ROOTS.has(root.name)

  const processMaterial = (material: Material, partNodeName: string): Material => {
    const clone = material.clone()
    if (clone instanceof MeshStandardMaterial) {
      // Keep GLB metalness/roughness clamped to plausible engineering range
      clone.metalness = Math.min(1, Math.max(0, clone.metalness))
      clone.roughness = Math.min(1, Math.max(0.1, clone.roughness))

      // JG-032 dark-blue recolor (owner ruling 2026-09-08): per-mesh
      // part-number allow-list + material gate — SET, never lerp.
      if (recolorScope) {
        const spec = recolorSpecFor(partNodeName, clone.name ?? '')
        if (spec) {
          clone.color.set(spec.color)
          clone.roughness = spec.roughness
          clone.metalness = spec.metalness
          clone.envMapIntensity = spec.envMapIntensity
        }
      }

      if (lite) {
        clone.roughness = Math.max(clone.roughness, 0.62)
      }

      // DoubleSide on composite panels (always) and on the chassis (so the
      // cross-section cut reads solid from the sectioned side)
      clone.side = isPanels || (cutScope && root.name === 'ENCLOSURE_CHASSIS') ? DoubleSide : FrontSide

      if (cutScope) {
        clone.clippingPlanes = [CUT_PLANE]
        clone.clipShadows = true
      }

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
    const partNodeName = recolorScope ? resolvePartNodeName(object) : ''
    if (Array.isArray(object.material)) {
      object.material = object.material.map((m) => processMaterial(m, partNodeName))
    } else if (object.material) {
      object.material = processMaterial(object.material, partNodeName)
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

  // Animate the cross-section cut sweep + panel fade in useFrame (zero React re-renders)
  useFrame(() => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()

    if (reducedMotion) {
      CUT_PLANE.constant = CUT_CLOSED_X
      panelMaterialsRef.current.forEach((m) => {
        m.opacity = PANEL_OPACITY_ASSEMBLED
      })
      return
    }

    // Cross-section lifecycle (JG-032 rev2 — the vertical panel lift is retired):
    // - [0.000, 0.585]: closed (plane parked beyond the shell, opacity 0.35)
    // - [0.585, 0.645]: cut opens (plane sweeps in, opacity 0.35 → 0.18)
    // - [0.645, 0.700]: hold open (opacity 0.18)
    // - [0.700, 0.715]: cut closes (opacity 0.18 → 0.35)
    // - [0.715, 1.000]: closed
    let cut = 0 // 0 = closed, 1 = fully open
    let panelOpacity = PANEL_OPACITY_ASSEMBLED

    if (progress >= 0.585 && progress <= 0.645) {
      const u = (progress - 0.585) / (0.645 - 0.585)
      cut = u * u * (3 - 2 * u)
    } else if (progress > 0.645 && progress < 0.700) {
      cut = 1
    } else if (progress >= 0.700 && progress <= 0.715) {
      const u = (progress - 0.700) / (0.715 - 0.700)
      cut = 1 - u * u * (3 - 2 * u)
    }
    panelOpacity = PANEL_OPACITY_ASSEMBLED - (PANEL_OPACITY_ASSEMBLED - PANEL_OPACITY_REVEALED) * cut

    CUT_PLANE.constant = CUT_CLOSED_X + (CUT_OPEN_X - CUT_CLOSED_X) * cut
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
