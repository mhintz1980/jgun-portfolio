/**
 * JG-035 shaft tooling leaf: illustrative shaper cutter and hob props.
 *
 * Both builders return a Group in metres, centred on the tool's own axis, with the axis
 * documented below. Materials are supplied by the caller (steel instances) and are never
 * disposed here; dispose() releases only the geometry this module creates.
 *
 *   buildShaperCutter - cutter axis parallel to the shaft axis (local +Y). The disc is one
 *     60-tooth ExtrudeGeometry (depth 8 mm, real bore) from cutterOutline.json: an illustrative
 *     derived prototype (SHAPER_PROTOTYPE in toolSpec.ts), not the certified 20-tooth tool.
 *     Sketch mount, a real load path along the tool axis: tapered spindle adapter, adapter flange
 *     and locating shoulder behind the disc (-Y); the pilot arbor passes through the disc bore;
 *     clamping flange, threaded stud (true swept helical ridge) and hex retaining nut on the +Y
 *     face. Every mount radius is <= SHAPER_MOUNT_MAX_RADIUS_MM, well inside the 35 mm centre
 *     distance. Mount dimensions are authoring proposals; none is measured from the reference image.
 *   buildHob - hob axis is the group's local +Y; the root quaternion points it along the
 *     clearance-v4 axis (cos(lead), sin(lead), 0) in the shaft-local CAD frame, i.e. perpendicular
 *     to the shaft axis and tilted by the lead angle. Collars and arbor are coaxial.
 */
import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Object3D,
  Path,
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
  SHAPER_ADAPTER_FLANGE_LENGTH_MM,
  SHAPER_ADAPTER_FLANGE_RADIUS_MM,
  SHAPER_BORE_RADIUS_MM,
  SHAPER_CLAMP_FLANGE_LENGTH_MM,
  SHAPER_CLAMP_FLANGE_RADIUS_MM,
  SHAPER_NUT_ACROSS_FLATS_MM,
  SHAPER_NUT_LENGTH_MM,
  SHAPER_PILOT_RADIUS_MM,
  SHAPER_SHOULDER_LENGTH_MM,
  SHAPER_SHOULDER_RADIUS_MM,
  SHAPER_STUD_PROTRUSION_MM,
  SHAPER_STUD_ROOT_RADIUS_MM,
  SHAPER_TAPER_LENGTH_MM,
  SHAPER_TAPER_RADIUS_FAR_MM,
  SHAPER_TAPER_RADIUS_NEAR_MM,
  SHAPER_TEETH,
  SHAPER_THICKNESS_MM,
  SHAPER_LEADING_FACE_Y_MM,
  SHAPER_BODY_REAR_Y_MM,
  SHAPER_ARBOR_EXTENSION_MM,
  SHAPER_THREAD_CREST_RADIUS_MM,
  SHAPER_THREAD_PITCH_MM,
} from './toolSpec'

const MM = 1e-3
const DEG = Math.PI / 180
/** Points kept per tooth when triangulating the 60-tooth disc (stride 4 of 120); the file keeps the full 0.05 deg polyline. */
const SHAPE_POINTS_PER_TOOTH = 30
/** Segments of the disc bore and steps per turn of the swept stud thread. */
const SHAPER_BORE_SEGMENTS = 96
const SHAPER_THREAD_STEPS_PER_TURN = 24
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
  /** Owned geometry count, retained by the runtime for census without duplicate ownership. */
  readonly geometryCount: number
  dispose(): void
}

export interface HobProp {
  readonly root: Group
  /** Owned geometry and instance-buffer count, retained by the runtime for census. */
  readonly geometryCount: number
  dispose(): void
}

export interface ShaftCleanupFailure { readonly resource: string; readonly error: unknown }
export interface ShaftLifecycleOptions {
  readonly onCleanupFailure?: (failures: readonly ShaftCleanupFailure[]) => void
}

/** Keep every stride-th outline point, always preserving index 0, the last point and the crest maximum. */
function decimateTooth(points: number[][], target: number): number[][] {
  const stride = Math.max(1, Math.ceil(points.length / target))
  let peak = 0
  for (let i = 1; i < points.length; i++) if (points[i][1] > points[peak][1]) peak = i
  const indices = new Set<number>([points.length - 1, peak])
  for (let i = 0; i < points.length; i += stride) indices.add(i)
  return [...indices].sort((a, b) => a - b).map((i) => points[i])
}

/**
 * Right-hand helical ridge swept around +Y from y = 0 (mm in, metres out). The profile ring is
 * root-low, crest-low, crest-high, root-high; it advances one pitch per turn, so this is a true
 * helix and not stacked rings. Open ends are capped.
 */
function buildHelicalThread(rootRadius: number, crestRadius: number, pitch: number, length: number, stepsPerTurn: number): BufferGeometry {
  const profile = [[rootRadius, -0.4 * pitch], [crestRadius, -0.12 * pitch], [crestRadius, 0.12 * pitch], [rootRadius, 0.4 * pitch]]
  const start = 0.4 * pitch
  const turns = (length - 0.8 * pitch) / pitch
  const steps = Math.max(1, Math.ceil(turns * stepsPerTurn))
  const positions = new Float32Array((steps + 1) * 4 * 3)
  for (let k = 0; k <= steps; k++) {
    const u = (turns * k) / steps
    const theta = u * 2 * Math.PI
    for (let j = 0; j < 4; j++) {
      const o = (k * 4 + j) * 3
      positions[o] = profile[j][0] * Math.cos(theta) * MM
      positions[o + 1] = (start + u * pitch + profile[j][1]) * MM
      positions[o + 2] = -profile[j][0] * Math.sin(theta) * MM
    }
  }
  const indices: number[] = []
  for (let k = 0; k < steps; k++) {
    for (let j = 0; j < 4; j++) {
      const a = k * 4 + j
      const b = k * 4 + ((j + 1) % 4)
      const c = (k + 1) * 4 + j
      const e = (k + 1) * 4 + ((j + 1) % 4)
      indices.push(a, b, c, c, b, e)
    }
  }
  const last = steps * 4
  indices.push(0, 2, 1, 0, 3, 2)
  indices.push(last, last + 1, last + 2, last, last + 2, last + 3)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function buildShaperCutter(material: Material, options: ShaftLifecycleOptions = {}): ShaperCutter {
  const geometries: BufferGeometry[] = []
  const dispose = makeDisposer(geometries, [], options)
  try {
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
  // Real bore for the pilot arbor (96-gon; the pilot mesh below fills it).
  const bore = new Path()
  for (let i = 0; i < SHAPER_BORE_SEGMENTS; i++) {
    const a = (i / SHAPER_BORE_SEGMENTS) * 2 * Math.PI
    const x = SHAPER_BORE_RADIUS_MM * Math.cos(a)
    const y = SHAPER_BORE_RADIUS_MM * Math.sin(a)
    if (i === 0) bore.moveTo(x, y)
    else bore.lineTo(x, y)
  }
  bore.closePath()
  shape.holes.push(bore)

  const discGeometry = new ExtrudeGeometry(shape, { depth: SHAPER_THICKNESS_MM, bevelEnabled: false, steps: 1, curveSegments: 1 })
  geometries.push(discGeometry)
  // Thicken behind the retained rake datum, preserving the real cutting path.
  discGeometry.translate(0, 0, SHAPER_BODY_REAR_Y_MM)
  discGeometry.rotateX(-Math.PI / 2)
  discGeometry.scale(MM, MM, MM)
  const disc = new Mesh(discGeometry, material)
  disc.name = 'shaper-cutter-disc'
  root.add(disc)

  // Sketch mount along the tool axis (tool-local mm, +Y = cutting face). Mesh add order starts
  // disc, shaper-hub, shaper-clamp-nut: the runtime fault tests rely on that three-geometry prefix.
  const face = SHAPER_LEADING_FACE_Y_MM
  const rear = SHAPER_BODY_REAR_Y_MM
  const adapterTop = rear - SHAPER_SHOULDER_LENGTH_MM
  const taperTop = adapterTop - SHAPER_ADAPTER_FLANGE_LENGTH_MM
  const flangeTop = face + SHAPER_CLAMP_FLANGE_LENGTH_MM
  const nutTop = flangeTop + SHAPER_NUT_LENGTH_MM
  const studTop = nutTop + SHAPER_STUD_PROTRUSION_MM
  const threadStart = nutTop - SHAPER_THREAD_PITCH_MM
  const addCylinder = (name: string, radiusTop: number, radiusBottom: number, bottom: number, top: number, segments = 32) => {
    const geometry = new CylinderGeometry(radiusTop * MM, radiusBottom * MM, (top - bottom) * MM, segments, 1, false)
    geometries.push(geometry)
    const mesh = new Mesh(geometry, material)
    mesh.name = name
    mesh.position.y = ((top + bottom) / 2) * MM
    root.add(mesh)
  }
  // 'shaper-hub' is the locating shoulder against the disc's trailing face.
  addCylinder('shaper-hub', SHAPER_SHOULDER_RADIUS_MM, SHAPER_SHOULDER_RADIUS_MM, adapterTop, rear)
  // 'shaper-clamp-nut' is the hex retaining nut, kept under its historical name for materials and fault tests.
  const nutRadius = SHAPER_NUT_ACROSS_FLATS_MM / Math.sqrt(3)
  addCylinder('shaper-clamp-nut', nutRadius, nutRadius, flangeTop, nutTop, 6)
  addCylinder('shaper-adapter-flange', SHAPER_ADAPTER_FLANGE_RADIUS_MM, SHAPER_ADAPTER_FLANGE_RADIUS_MM, taperTop, adapterTop)
  addCylinder('shaper-adapter-taper', SHAPER_TAPER_RADIUS_NEAR_MM, SHAPER_TAPER_RADIUS_FAR_MM, taperTop - SHAPER_TAPER_LENGTH_MM, taperTop)
  addCylinder('shaper-arbor-shank', SHAPER_TAPER_RADIUS_FAR_MM, SHAPER_TAPER_RADIUS_FAR_MM,
    taperTop-SHAPER_TAPER_LENGTH_MM-SHAPER_ARBOR_EXTENSION_MM,taperTop-SHAPER_TAPER_LENGTH_MM)
  // Pilot arbor: starts inside the shoulder, passes the disc bore, ends inside the clamping flange.
  addCylinder('shaper-arbor', SHAPER_PILOT_RADIUS_MM, SHAPER_PILOT_RADIUS_MM, rear - 0.5, flangeTop - 0.5)
  addCylinder('shaper-clamp-flange', SHAPER_CLAMP_FLANGE_RADIUS_MM, SHAPER_CLAMP_FLANGE_RADIUS_MM, face, flangeTop)
  addCylinder('shaper-stud', SHAPER_STUD_ROOT_RADIUS_MM, SHAPER_STUD_ROOT_RADIUS_MM, flangeTop, studTop, 24)
  const threadGeometry = buildHelicalThread(
    SHAPER_STUD_ROOT_RADIUS_MM, SHAPER_THREAD_CREST_RADIUS_MM, SHAPER_THREAD_PITCH_MM, studTop - threadStart, SHAPER_THREAD_STEPS_PER_TURN,
  )
  geometries.push(threadGeometry)
  const thread = new Mesh(threadGeometry, material)
  thread.name = 'shaper-stud-thread'
  thread.position.y = threadStart * MM
  root.add(thread)

  const cuttingEdgeLocal = new Vector3(
    tipRadius * MM * Math.cos(tipAngle),
    SHAPER_LEADING_FACE_Y_MM * MM,
    -tipRadius * MM * Math.sin(tipAngle),
  )

    return { root, cuttingEdgeLocal, geometryCount: geometries.length, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}

export function buildHob(material: Material, options: ShaftLifecycleOptions = {}): HobProp {
  const geometries: BufferGeometry[] = []
  const instances: InstancedMesh[] = []
  const dispose = makeDisposer(geometries, instances, options)
  try {
  const root = new Group()
  root.name = 'hob'

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
  geometries.push(threadGeometry)
  threadGeometry.translate(0, 0, -tangentialWidth / 2)
  threadGeometry.scale(MM, MM, MM)

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
  instances.push(thread)
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

    return { root, geometryCount: geometries.length, dispose }
  } catch (error) {
    dispose()
    throw error
  }
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

/** Tools own their geometry and instance buffers, but borrow the caller's material. */
function makeDisposer(geometries: BufferGeometry[], instances: InstancedMesh[], options: ShaftLifecycleOptions): () => void {
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    const failures: ShaftCleanupFailure[] = []
    const attempt = (resource: string, release: () => void) => {
      try { release() } catch (error) { failures.push(Object.freeze({ resource, error })) }
    }
    for (const instance of instances) attempt('tool-instance', () => instance.dispose())
    for (const geometry of new Set(geometries)) attempt('tool-geometry', () => geometry.dispose())
    if (failures.length) {
      try { options.onCleanupFailure?.(Object.freeze(failures)) } catch { /* Reporting must not interrupt cleanup. */ }
    }
  }
}
