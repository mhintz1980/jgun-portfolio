/**
 * JG-035 shaft tooling leaf: illustrative shaper cutter and hob props.
 *
 * Both builders return a Group in metres, centred on the tool's own axis, with the axis
 * documented below. Materials are supplied by the caller (steel instances) and are never
 * disposed here; dispose() releases only the geometry this module creates.
 *
 *   buildShaperCutter - cutter axis parallel to the shaft axis (local +Y). The disc is one
 *     20-tooth ExtrudeGeometry (depth 1.2 mm) from cutterOutline.json; the trailing stack is
 *     hub, clamp nut then arbor along -Y, so the leading (+Y) face stays clear of the cut.
 *   buildHob - hob axis is the group's local +Y; the root quaternion points it along the
 *     clearance-v4 axis (cos(lead), sin(lead), 0) in the shaft-local CAD frame, i.e. perpendicular
 *     to the shaft axis and tilted by the lead angle. Collars and arbor are coaxial.
 */
import {
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Shape,
  Vector3,
} from 'three'
import type { Material } from 'three'
import outlineData from './cutterOutline.json'
import {
  HOB_ARBOR_LENGTH_MM,
  HOB_ARBOR_RADIUS_MM,
  HOB_COLLAR_RADIUS_MM,
  HOB_COLLAR_WIDTH_MM,
  HOB_LEAD_ANGLE_DEG,
  HOB_LEAD_MM,
  HOB_LENGTH_MM,
  HOB_RADIUS_MM,
  HOB_THREAD_DEPTH_MM,
  SHAPER_ARBOR_LENGTH_MM,
  SHAPER_ARBOR_RADIUS_MM,
  SHAPER_CLAMP_LENGTH_MM,
  SHAPER_CLAMP_RADIUS_MM,
  SHAPER_HUB_LENGTH_MM,
  SHAPER_HUB_RADIUS_MM,
  SHAPER_TEETH,
  SHAPER_THICKNESS_MM,
} from './toolSpec'

const MM = 1e-3
const DEG = Math.PI / 180
/** Points kept per tooth when triangulating the shaper disc; the file keeps the full 0.05 deg polyline. */
const SHAPE_POINTS_PER_TOOTH = 90
/** Trapezoid thread instances per helix turn (5 deg of cutter rotation each). */
const HOB_INSTANCES_PER_TURN = 72
const HOB_GASH_COUNT = 10
const HOB_GASH_HALF_WIDTH_DEG = 3
const Y_AXIS = new Vector3(0, 1, 0)

interface CutterOutlineFile {
  schema: string
  tooth: { angle_span_deg: number; point_count: number; min_radius_mm: number; max_radius_mm: number; points: number[][] }
}

const OUTLINE = outlineData as unknown as CutterOutlineFile

export interface ShaperCutter {
  readonly root: Group
  /** Rake-face point at the cutter crest on the leading (+Y) face, in the root's local metre frame. */
  readonly cuttingEdgeLocal: Vector3
  dispose(): void
}

export interface HobProp {
  readonly root: Group
  dispose(): void
}

/** Keep every stride-th outline point, always preserving index 0. */
function decimateTooth(points: number[][], target: number): number[][] {
  const stride = Math.max(1, Math.ceil(points.length / target))
  const kept: number[][] = []
  for (let i = 0; i < points.length; i += stride) kept.push(points[i])
  if (kept[kept.length - 1] !== points[points.length - 1]) kept.push(points[points.length - 1])
  return kept
}

export function buildShaperCutter(material: Material): ShaperCutter {
  const root = new Group()
  root.name = 'shaper-cutter'

  const span = OUTLINE.tooth.angle_span_deg
  const tooth = decimateTooth(OUTLINE.tooth.points, SHAPE_POINTS_PER_TOOTH)
  const shape = new Shape()
  let tipRadius = 0
  let tipAngle = 0
  for (let t = 0; t < SHAPER_TEETH; t++) {
    for (let i = 0; i < tooth.length; i++) {
      const angle = tooth[i][0] + t * span * DEG
      const radius = tooth[i][1]
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)
      if (t === 0 && i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
      if (radius > tipRadius) {
        tipRadius = radius
        tipAngle = angle
      }
    }
  }
  shape.closePath()

  const discGeometry = new ExtrudeGeometry(shape, { depth: SHAPER_THICKNESS_MM, bevelEnabled: false, steps: 1, curveSegments: 1 })
  // Certified stroke positions are disc-centre positions; the leading face is +thickness/2.
  discGeometry.translate(0, 0, -SHAPER_THICKNESS_MM / 2)
  discGeometry.rotateX(-Math.PI / 2)
  discGeometry.scale(MM, MM, MM)
  const disc = new Mesh(discGeometry, material)
  disc.name = 'shaper-cutter-disc'
  root.add(disc)

  const trailing = [
    { name: 'shaper-hub', radius: SHAPER_HUB_RADIUS_MM, length: SHAPER_HUB_LENGTH_MM, y: -SHAPER_THICKNESS_MM / 2 - SHAPER_HUB_LENGTH_MM / 2 },
    {
      name: 'shaper-clamp-nut',
      radius: SHAPER_CLAMP_RADIUS_MM,
      length: SHAPER_CLAMP_LENGTH_MM,
      y: -SHAPER_THICKNESS_MM / 2 - SHAPER_HUB_LENGTH_MM - SHAPER_CLAMP_LENGTH_MM / 2,
    },
    {
      name: 'shaper-arbor',
      radius: SHAPER_ARBOR_RADIUS_MM,
      length: SHAPER_ARBOR_LENGTH_MM,
      y: -SHAPER_THICKNESS_MM / 2 - SHAPER_HUB_LENGTH_MM - SHAPER_CLAMP_LENGTH_MM - SHAPER_ARBOR_LENGTH_MM / 2,
    },
  ]
  const geometries: BufferGeometry[] = [discGeometry]
  for (const part of trailing) {
    const geometry = new CylinderGeometry(part.radius * MM, part.radius * MM, part.length * MM, 24, 1, false)
    geometries.push(geometry)
    const mesh = new Mesh(geometry, material)
    mesh.name = part.name
    mesh.position.y = part.y * MM
    root.add(mesh)
  }

  const cuttingEdgeLocal = new Vector3(
    tipRadius * MM * Math.cos(tipAngle),
    SHAPER_THICKNESS_MM / 2 * MM,
    -tipRadius * MM * Math.sin(tipAngle),
  )

  return { root, cuttingEdgeLocal, dispose: makeDisposer(geometries) }
}

export function buildHob(material: Material): HobProp {
  const root = new Group()
  root.name = 'hob'
  const geometries: BufferGeometry[] = []

  const bodyRadius = HOB_RADIUS_MM - HOB_THREAD_DEPTH_MM
  const bodyGeometry = new CylinderGeometry(bodyRadius * MM, bodyRadius * MM, HOB_LENGTH_MM * MM, 32, 1, false)
  geometries.push(bodyGeometry)
  const body = new Mesh(bodyGeometry, material)
  body.name = 'hob-body'
  root.add(body)

  const collarGeometry = new CylinderGeometry(HOB_COLLAR_RADIUS_MM * MM, HOB_COLLAR_RADIUS_MM * MM, HOB_COLLAR_WIDTH_MM * MM, 24, 1, false)
  geometries.push(collarGeometry)
  for (const sign of [-1, 1]) {
    const collar = new Mesh(collarGeometry, material)
    collar.name = sign < 0 ? 'hob-collar-drive' : 'hob-collar-free'
    collar.position.y = sign * (HOB_LENGTH_MM / 2 + HOB_COLLAR_WIDTH_MM / 2) * MM
    root.add(collar)
  }

  const arborGeometry = new CylinderGeometry(HOB_ARBOR_RADIUS_MM * MM, HOB_ARBOR_RADIUS_MM * MM, HOB_ARBOR_LENGTH_MM * MM, 24, 1, false)
  geometries.push(arborGeometry)
  const arbor = new Mesh(arborGeometry, material)
  arbor.name = 'hob-arbor'
  arbor.position.y = (HOB_LENGTH_MM / 2 + HOB_COLLAR_WIDTH_MM + HOB_ARBOR_LENGTH_MM / 2) * MM
  root.add(arbor)

  // Single-start helical thread approximated by trapezoid instances placed along the helix.
  const axialHalfRoot = HOB_LEAD_MM * 0.25
  const axialHalfCrest = Math.max(0.05, axialHalfRoot - HOB_THREAD_DEPTH_MM * 0.2)
  const tangentialWidth = (HOB_RADIUS_MM * 2 * Math.PI) / HOB_INSTANCES_PER_TURN
  // A tangential extrusion otherwise puts crest corners outside the certified cylinder.
  const crestRadius = Math.sqrt(HOB_RADIUS_MM ** 2 - (tangentialWidth / 2) ** 2)
  const threadShape = new Shape()
  threadShape.moveTo(bodyRadius, -axialHalfRoot)
  threadShape.lineTo(crestRadius, -axialHalfCrest)
  threadShape.lineTo(crestRadius, axialHalfCrest)
  threadShape.lineTo(bodyRadius, axialHalfRoot)
  threadShape.closePath()
  const threadGeometry = new ExtrudeGeometry(threadShape, { depth: tangentialWidth, bevelEnabled: false, steps: 1, curveSegments: 1 })
  threadGeometry.translate(0, 0, -tangentialWidth / 2)
  threadGeometry.scale(MM, MM, MM)
  geometries.push(threadGeometry)

  const yPositions: number[] = []
  const angles: number[] = []
  const gashCentres = new Float64Array(HOB_GASH_COUNT)
  for (let g = 0; g < HOB_GASH_COUNT; g++) gashCentres[g] = (360 / HOB_GASH_COUNT) * g
  for (let i = 0; ; i++) {
    // Keep the complete trapezoid inside the certified 16 mm axial cutting-body span.
    const y = -HOB_LENGTH_MM / 2 + axialHalfRoot + (i / HOB_INSTANCES_PER_TURN) * HOB_LEAD_MM
    if (y + axialHalfRoot > HOB_LENGTH_MM / 2 + 1e-9) break
    const deg = (i % HOB_INSTANCES_PER_TURN) * (360 / HOB_INSTANCES_PER_TURN)
    let gash = false
    for (let g = 0; g < HOB_GASH_COUNT; g++) {
      const delta = Math.abs(deg - gashCentres[g])
      if (Math.min(delta, 360 - delta) <= HOB_GASH_HALF_WIDTH_DEG) {
        gash = true
        break
      }
    }
    if (gash) continue
    yPositions.push(y)
    angles.push((i % HOB_INSTANCES_PER_TURN) * (2 * Math.PI / HOB_INSTANCES_PER_TURN))
  }

  const thread = new InstancedMesh(threadGeometry, material, yPositions.length)
  thread.name = 'hob-thread'
  const matrix = new Matrix4()
  const quaternion = new Quaternion()
  const position = new Vector3()
  const scale = new Vector3(1, 1, 1)
  for (let k = 0; k < yPositions.length; k++) {
    quaternion.setFromAxisAngle(Y_AXIS, angles[k])
    position.set(0, yPositions[k] * MM, 0)
    matrix.compose(position, quaternion, scale)
    thread.setMatrixAt(k, matrix)
  }
  thread.instanceMatrix.needsUpdate = true
  root.add(thread)

  // Ten axial gashes: the thread instances are omitted inside each window, so the smooth body
  // reads as the flute floor. Named anchors keep the gash phase available downstream.
  for (let g = 0; g < HOB_GASH_COUNT; g++) {
    const anchor = new Object3D()
    anchor.name = 'hob-gash-' + g
    anchor.rotation.y = (2 * Math.PI / HOB_GASH_COUNT) * g
    root.add(anchor)
  }

  // Hob axis = perpendicular to the shaft axis, tilted by the lead angle (clearance-v4 axis).
  const axis = new Vector3(Math.cos(HOB_LEAD_ANGLE_DEG * DEG), Math.sin(HOB_LEAD_ANGLE_DEG * DEG), 0).normalize()
  root.quaternion.setFromUnitVectors(Y_AXIS, axis)

  const disposeGeometry = makeDisposer(geometries)
  let disposed = false
  return { root, dispose() {
    if (disposed) return
    disposed = true
    thread.dispose()
    disposeGeometry()
  } }
}

/** Triangle count for a prop, counting InstancedMesh instances. */
export function countTriangles(object: Object3D): number {
  let total = 0
  object.traverse((child) => {
    const mesh = child as Mesh
    const geometry = mesh.geometry as BufferGeometry | undefined
    if (!geometry) return
    const index = geometry.getIndex()
    const position = geometry.getAttribute('position')
    const vertices = index ? index.count : position ? position.count : 0
    const instances = (child as InstancedMesh).isInstancedMesh ? (child as InstancedMesh).count : 1
    total += Math.floor(vertices / 3) * instances
  })
  return total
}

/** Idempotent geometry disposer: repeated calls never re-dispose. */
function makeDisposer(geometries: BufferGeometry[]): () => void {
  const seen = new Set<BufferGeometry>()
  return () => {
    for (const geometry of geometries) {
      if (seen.has(geometry)) continue
      seen.add(geometry)
      geometry.dispose()
    }
  }
}
