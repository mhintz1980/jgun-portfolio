import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, Object3D } from 'three'
import { getQuality } from '../../state/qualityStore'
import { getScrollState, telemetry } from '../../state/scrollStore'
import { drawingIntroState } from './introTimeline'

const MODEL_URL = '/models/Default.glb'
const CREASE_ANGLE_DEGREES = 22

function lineworkFrom(source: Object3D): Group {
  const root = source.clone(true) as Group
  root.traverse((node) => {
    if (!(node as Mesh).isMesh) return
    const mesh = node as Mesh
    const edges = new EdgesGeometry(mesh.geometry, CREASE_ANGLE_DEGREES)
    const material = new LineBasicMaterial({
      color: '#8eefff',
      transparent: true,
      opacity: 1,
      depthTest: true,
      depthWrite: false,
    })
    const lines = new LineSegments(edges, material)
    lines.name = `DRAWING_EDGE_${mesh.name || mesh.uuid}`
    mesh.parent?.add(lines)
    mesh.visible = false
  })
  return root
}

/**
 * B1 primary elevation. The edge set is extracted from Default.glb geometry at
 * runtime (boundary/silhouette edges plus creases), never from an authored
 * drawing asset. It shares the live hero's local frame, so its zero-transform
 * handoff is pixel-registered with the PBR model by construction.
 */
export function DrawingLinework() {
  const { scene } = useGLTF(MODEL_URL)
  const root = useMemo(() => lineworkFrom(scene), [scene])
  const opacity = useRef(1)

  useFrame(() => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()
    const proofMode = (window as unknown as Record<string, unknown>).__drawingProofMode
    const next = proofMode === 'lines' || proofMode === 'registered'
      ? 1
      : proofMode === 'model'
        ? 0
        : reducedMotion
          ? 1
          : drawingIntroState(progress).drawingOpacity
    if (Math.abs(next - opacity.current) >= 0.0001 || root.userData.proofMode !== proofMode) {
      opacity.current = next
      root.userData.proofMode = proofMode
      root.visible = next > 0.001
      root.traverse((node) => {
        const material = (node as LineSegments).material
        if (material instanceof LineBasicMaterial) {
          material.opacity = next
          // Evidence mode draws the edge mask above PBR so capture pairs test
          // registration, not ordinary hidden-line occlusion differences.
          material.depthTest = proofMode !== 'registered'
        }
      })
    }
    telemetry.drawing.lineOpacity = next
    telemetry.drawing.edgeSource = 'Default.glb:crease+boundary'
  })

  return <primitive object={root} />
}

useGLTF.preload(MODEL_URL)
