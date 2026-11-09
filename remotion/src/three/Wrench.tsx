import { useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import {
  Box3,
  Color,
  EdgesGeometry,
  GreaterDepth,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Plane,
  Vector3,
} from 'three'
import { buildWrenchRig, type WrenchRig } from '../../../src/scene/rig/nodeRoles'
import { applyWrenchMechanics } from '../../../src/scene/rig/wrenchMechanics'
import { usePrepared } from './useGltf'
import { ReadyGate } from './ReadyGate'

export interface WrenchPose {
  /** 0..1 rear-extraction ladder (the site's EXPLODE_OFFSETS, unchanged). */
  explode: number
  /** gear sweep angle, 0..8π (the site's gearRotation channel). */
  gearAngle: number
  /** 0..1 two-speed clutch shift. */
  shift: number
  /** World-x of the plotter head: linework exists left of it. */
  plotX: number
  /** World-x of the fill front: solid metal exists left of it. */
  fillX: number
  /** Linework opacity and colour. */
  lineOpacity: number
  lineColor: string
  /** Hidden-line removal for the linework (depth-only proxies of every part). */
  occlude: boolean
  /** Opacity of the faint hidden-line pass, relative to lineOpacity. */
  hidden: number
}

interface Prepared {
  rig: WrenchRig
  root: Group
  lines: LineSegments[]
  occluders: Mesh[]
  lineMaterial: LineBasicMaterial
  hiddenMaterial: LineBasicMaterial
  materials: Material[]
  plotPlane: Plane
  fillPlane: Plane
  size: Vector3
}

function prepare(scene: Group): Prepared {
  const rig = buildWrenchRig(scene)
  const plotPlane = new Plane(new Vector3(-1, 0, 0), 10)
  const fillPlane = new Plane(new Vector3(-1, 0, 0), 10)
  const lineMaterial = new LineBasicMaterial({ color: '#14181d', transparent: true, opacity: 1, clippingPlanes: [plotPlane], depthWrite: false })
  // Drafting convention: edges behind a surface are drawn too, but faint (hidden lines).
  const hiddenMaterial = new LineBasicMaterial({ color: '#14181d', transparent: true, opacity: 0.2, clippingPlanes: [plotPlane], depthWrite: false, depthFunc: GreaterDepth })
  const materials = new Set<Material>()
  const lines: LineSegments[] = []
  const occluders: Mesh[] = []
  // Depth-only twins pushed slightly back: the linework then reads as a true hidden-line
  // drawing instead of an x-ray.
  const depthOnly = new MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 })
  for (const mesh of rig.meshes) {
    const twin = new Mesh(mesh.geometry, depthOnly)
    twin.renderOrder = -1
    mesh.add(twin)
    occluders.push(twin)
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(m)
    // Feature edges only (crease > 28°): reads like a drawing, not a wireframe.
    const geometry = new EdgesGeometry(mesh.geometry, 28)
    const edges = new LineSegments(geometry, lineMaterial)
    edges.renderOrder = 2
    const hidden = new LineSegments(geometry, hiddenMaterial)
    hidden.renderOrder = 3
    mesh.add(edges, hidden)
    lines.push(edges, hidden)
  }
  for (const m of materials) {
    m.clippingPlanes = [fillPlane]
    m.needsUpdate = true
  }
  const root = new Group()
  const inner = new Group()
  inner.position.set(-rig.center.x, -rig.center.y, -rig.center.z)
  inner.add(scene)
  // Model Z (the drive axis, handle at −Z) → world +X: the wrench lies along the line.
  root.rotation.set(0, Math.PI / 2, 0)
  root.add(inner)
  const size = new Box3().setFromObject(root).getSize(new Vector3())
  return { rig, root, lines, occluders, lineMaterial, hiddenMaterial, materials: [...materials], plotPlane, fillPlane, size }
}

export type ScreenAnchor = { x: number; y: number; z: number }
export type AnchorSink = (anchors: ScreenAnchor[]) => void

const box = new Box3()
const v = new Vector3()

/** Screen-space centres of the five units the film calls out, after this frame's pose. */
function anchorObjects(rig: WrenchRig): (Object3D | null)[] {
  return [rig.outputShaft, rig.stages.stage3.carrier, rig.bearing, rig.clutch.static, rig.handleRoot]
}

export function Wrench({ pose, onAnchors }: { pose: WrenchPose; onAnchors?: AnchorSink }) {
  const [p, release] = usePrepared(['models/Default.glb'], ([scene]) => prepare(scene!), 'Torque wrench (Default.glb)')
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const color = useMemo(() => new Color(), [])

  useLayoutEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  useLayoutEffect(() => {
    if (!p) return
    applyWrenchMechanics(p.rig, { explode: pose.explode, gearAngle: pose.gearAngle, shift: pose.shift, idle: 0 })
    p.plotPlane.constant = pose.plotX
    p.fillPlane.constant = pose.fillX
    p.lineMaterial.opacity = pose.lineOpacity
    p.lineMaterial.color.copy(color.set(pose.lineColor))
    p.hiddenMaterial.color.copy(p.lineMaterial.color)
    p.hiddenMaterial.opacity = pose.lineOpacity * 0.22 * pose.hidden
    const showLines = pose.lineOpacity > 0.002
    for (const l of p.lines) l.visible = showLines
    for (const o of p.occluders) o.visible = showLines && pose.occlude
    if (onAnchors) {
      p.root.updateMatrixWorld(true)
      onAnchors(
        anchorObjects(p.rig).map((o) => {
          if (!o) return { x: -999, y: -999, z: 0 }
          box.setFromObject(o).getCenter(v)
          v.project(camera)
          return { x: (v.x * 0.5 + 0.5) * size.width, y: (0.5 - v.y * 0.5) * size.height, z: v.z }
        }),
      )
    }
  })

  return (
    <>
      {p && <primitive object={p.root} />}
      <ReadyGate ready={!!p} release={release} />
    </>
  )
}

