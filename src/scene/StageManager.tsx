import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  PointsMaterial,
  Vector3,
} from 'three'
import { getQuality } from '../state/qualityStore'
import { getScrollState, telemetry } from '../state/scrollStore'
import {
  ENCLOSURE_HALF,
  stageEnvelope,
  STAGE_TRANSITIONS,
} from './stages/stageWindows'
import { AirflowField } from './stages/AirflowField'

/**
 * Module 5 — multi-chapter stage orchestrator.
 *
 * Three stages share the fixed canvas, keyed off GLOBAL scroll progress (not
 * DOM triggers — the mission's stage windows are progress-based):
 *
 *   Stage 1 (wrench)      CH.01+02 — the existing TorqueWrenchHero, passed in
 *                         as children so its rig, timeline and hotspots stay
 *                         untouched; exits by sinking after the explosion
 *                         ladder completes (no material fade — the ghost system
 *                         owns wrench opacity).
 *   Stage 2 (enclosure)   CH.03 — MSP SAFE enclosure: procedural 5-layer
 *                         composite-wall bounding-box placeholder + the
 *                         AirflowField particle system, cross-faded in/out.
 *   Stage 3 (point cloud) CH.04 — M249/MK46 scan placeholder points + datum
 *                         bounding boxes, cross-faded in, holding to the end.
 *
 * Contract (r3f-scroll-performance-guard): scroll state is read imperatively
 * via getScrollState() inside useFrame — zero React re-renders, zero props
 * beyond children. Reduced motion pins stage 1 alone (today's behavior);
 * poster tier never mounts a canvas at all.
 */

/** Enclosure wall cross-section read: five nested shells, outer → inner. */
const WALL_LAYERS = [0, 0.005, 0.01, 0.015, 0.02] as const

/** M249 placeholder regions (half-extents + center, stage-local meters). */
const CLOUD_REGIONS = [
  { half: [0.055, 0.045, 0.11] as const, center: [-0.02, 0, 0.03] as const }, // receiver
  { half: [0.02, 0.02, 0.16] as const, center: [0, 0.005, -0.1] as const }, // barrel + stock
]
const CLOUD_POINTS = 2600

/** Rejection-sample scan points inside the union of the cloud regions. */
function buildCloudGeometry(): BufferGeometry {
  const geo = new BufferGeometry()
  const positions = new Float32Array(CLOUD_POINTS * 3)
  const boxes = CLOUD_REGIONS.map(
    (region) =>
      new Box3(
        new Vector3(
          region.center[0] - region.half[0],
          region.center[1] - region.half[1],
          region.center[2] - region.half[2],
        ),
        new Vector3(
          region.center[0] + region.half[0],
          region.center[1] + region.half[1],
          region.center[2] + region.half[2],
        ),
      ),
  )
  let written = 0
  while (written < CLOUD_POINTS) {
    const x = (Math.random() * 2 - 1) * 0.12
    const y = (Math.random() * 2 - 1) * 0.09
    const z = (Math.random() * 2 - 1) * 0.28
    if (boxes.some((box) => box.containsPoint(new Vector3(x, y, z)))) {
      positions[written * 3] = x
      positions[written * 3 + 1] = y
      positions[written * 3 + 2] = z
      written += 1
    }
  }
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  return geo
}

export function StageManager({ children }: { children: ReactNode }) {
  const wrenchStage = useRef<Group>(null)
  const enclosureStage = useRef<Group>(null)
  const cloudStage = useRef<Group>(null)

  // Placeholder geometry/materials: created once, mutated only through
  // material.opacity in useFrame, disposed on unmount.
  const enclosureEdges = useMemo(
    () =>
      WALL_LAYERS.map(
        (inset) =>
          new EdgesGeometry(
            new BoxGeometry(
              (ENCLOSURE_HALF[0] - inset) * 2,
              (ENCLOSURE_HALF[1] - inset * 0.6) * 2,
              (ENCLOSURE_HALF[2] - inset) * 2,
            ),
          ),
      ),
    [],
  )
  const outerWallMaterial = useMemo(
    () => new LineBasicMaterial({ color: '#ff6b1a', transparent: true, opacity: 0.5 }),
    [],
  )
  const layerWallMaterial = useMemo(
    () => new LineBasicMaterial({ color: '#38e8ff', transparent: true, opacity: 0.16 }),
    [],
  )
  const cloudGeometry = useMemo(buildCloudGeometry, [])
  const cloudMaterial = useMemo(
    () =>
      new PointsMaterial({
        color: '#38e8ff',
        size: 0.0045,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    [],
  )
  const cloudBoxMaterial = useMemo(
    () => new LineBasicMaterial({ color: '#38e8ff', transparent: true, opacity: 0.2 }),
    [],
  )
  const cloudEdges = useMemo(
    () =>
      CLOUD_REGIONS.map(
        (region) =>
          new EdgesGeometry(
            new BoxGeometry(region.half[0] * 2, region.half[1] * 2, region.half[2] * 2),
          ),
      ),
    [],
  )

  useEffect(() => {
    return () => {
      enclosureEdges.forEach((edges) => edges.dispose())
      cloudEdges.forEach((edges) => edges.dispose())
      outerWallMaterial.dispose()
      layerWallMaterial.dispose()
      cloudMaterial.dispose()
      cloudBoxMaterial.dispose()
      cloudGeometry.dispose()
    }
  }, [
    enclosureEdges,
    cloudEdges,
    outerWallMaterial,
    layerWallMaterial,
    cloudMaterial,
    cloudBoxMaterial,
    cloudGeometry,
  ])

  useFrame(() => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()

    const wrench = reducedMotion
      ? { alpha: 1, y: 0, active: true }
      : stageEnvelope(progress, undefined, STAGE_TRANSITIONS.wrenchOut)
    const enclosure = reducedMotion
      ? { alpha: 0, y: 0, active: false }
      : stageEnvelope(progress, STAGE_TRANSITIONS.enclosureIn, STAGE_TRANSITIONS.enclosureOut)
    const cloud = reducedMotion
      ? { alpha: 0, y: 0, active: false }
      : stageEnvelope(progress, STAGE_TRANSITIONS.pointCloudIn, undefined)

    if (wrenchStage.current) {
      wrenchStage.current.visible = wrench.active
      wrenchStage.current.position.y = wrench.y
    }
    if (enclosureStage.current) {
      enclosureStage.current.visible = enclosure.active
      enclosureStage.current.position.y = enclosure.y
      outerWallMaterial.opacity = 0.5 * enclosure.alpha
      layerWallMaterial.opacity = 0.16 * enclosure.alpha
    }
    if (cloudStage.current) {
      cloudStage.current.visible = cloud.active
      cloudStage.current.position.y = cloud.y
      cloudMaterial.opacity = 0.85 * cloud.alpha
      cloudBoxMaterial.opacity = 0.2 * cloud.alpha
    }

    const alphas: [number, number, number] = [wrench.alpha, enclosure.alpha, cloud.alpha]
    const dominant = alphas.indexOf(Math.max(...alphas))
    telemetry.stage.active = alphas[dominant] > 0.25 ? dominant : -1
    telemetry.stage.alpha = alphas
    telemetry.stage.y = [wrench.y, enclosure.y, cloud.y]
  })

  return (
    <group>
      {/* STAGE 1 — CH.01/02: RL-300 assembly + exploded reduction train */}
      <group ref={wrenchStage}>
        {children}
      </group>

      {/* STAGE 2 — CH.03: MSP SAFE enclosure placeholder (5-layer composite
          wall) + thermal airflow field. Replaced by the real Draco GLB when
          it lands in public/models/. */}
      <group ref={enclosureStage} visible={false}>
        {enclosureEdges.map((edges, index) => (
          <lineSegments
            key={index}
            geometry={edges}
            material={index === 0 ? outerWallMaterial : layerWallMaterial}
          />
        ))}
        <AirflowField />
      </group>

      {/* STAGE 3 — CH.04: M249/MK46 scan point-cloud placeholder + datum
          bounding boxes. */}
      <group ref={cloudStage} visible={false}>
        <points geometry={cloudGeometry} material={cloudMaterial} />
        {cloudEdges.map((edges, index) => (
          <lineSegments
            key={index}
            geometry={edges}
            material={cloudBoxMaterial}
            position={CLOUD_REGIONS[index].center}
          />
        ))}
      </group>
    </group>
  )
}

