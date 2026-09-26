import {
  Box3,
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Matrix4,
  OrthographicCamera,
  RepeatWrapping,
  Uint32BufferAttribute,
  Vector3,
  type Mesh,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { WrenchRig } from '../rig/nodeRoles'

/** Cream drafting vellum with navy ink — owner-supplied reference sheet, 2026-09-24. */
export const PAPER = '#e2dac4'
export const INK = '#15295a'

/**
 * JG-032 — procedural paper grain. Deterministic LCG (fixed seed) so intro frames are
 * reproducible. fillPaperGrain is the pure, node-testable core; makePaperGrainTexture is the
 * browser wrapper.
 */
export const PAPER_GRAIN_SIZE = 256
export const PAPER_GRAIN_MIX = 0.06
export const PAPER_GRAIN_SEED = 0x2f6e2b1

export function fillPaperGrain(
  data: Uint8ClampedArray,
  size: number,
  seed: number = PAPER_GRAIN_SEED,
): void {
  let s = seed >>> 0
  const next = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0xffffffff
  }
  for (let i = 0; i < size * size; i++) {
    const v = Math.floor(next() * 256)
    data[i * 4] = v
    data[i * 4 + 1] = v
    data[i * 4 + 2] = v
    data[i * 4 + 3] = 255
  }
}

export function makePaperGrainTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = PAPER_GRAIN_SIZE
  canvas.height = PAPER_GRAIN_SIZE
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(PAPER_GRAIN_SIZE, PAPER_GRAIN_SIZE)
  fillPaperGrain(image.data, PAPER_GRAIN_SIZE)
  ctx.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

/**
 * SHEET FORMAT — JG-035 rebuild (2026-09-25).
 *
 * A real drafting sheet, laid out like the owner's reference: the side elevation is the hero
 * at TRUE 1:1 (that is what lets the 3D model register to a view the code projected), the
 * other orthographic views and the longitudinal section sit around it at 1:2, and 2:1 detail
 * circles fill the margins. 0.80 x 0.50 m is roughly an ANSI D sheet, so the pen weights and
 * lettering heights below are the real drafting ones. The previous 2.6 m sheet left ~85% of
 * the paper empty around a 0.44 m view block.
 *
 * All line work is vector (see sheet/), so the camera can come as close as it likes.
 */
export const SHEET_WIDTH = 0.8
export const SHEET_HEIGHT = 0.5
/** Field of view the intro camera holds while the sheet owns the frame. */
export const SHEET_FOV = 34

/**
 * PRIMARY VIEW ROTATION (model -> sheet plane): `plane = (-z, -x, y)`. The tool sits grip-down
 * on its own elevation with the snout to the left. `SHEET_ROTATION` is forced to be the
 * inverse — that identity is what lands the extracted model exactly at world identity when
 * the intro hands off — which puts the sheet's printed "up" on world -X.
 */
export const SIDE_ROTATION = new Matrix4().set(
  0, 0, -1, 0,
  -1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 0, 1,
)
/** Sheet placement (plane -> world). Forced to be `SIDE_ROTATION` inverted; see above. */
export const SHEET_ROTATION = SIDE_ROTATION.clone().invert()
/** Printed "up" on the sheet, in world space. Used by the intro camera's up vector. */
export const SHEET_UP_WORLD = new Vector3(0, 1, 0).applyMatrix4(SHEET_ROTATION).normalize()
/** Printed "right" on the sheet, in world space. */
export const SHEET_RIGHT_WORLD = new Vector3(1, 0, 0).applyMatrix4(SHEET_ROTATION).normalize()
/** Sheet normal (toward the viewer) in world space. */
export const SHEET_NORMAL_WORLD = new Vector3(0, 0, 1).applyMatrix4(SHEET_ROTATION).normalize()

/**
 * View rotations (model -> plane). Every one keeps the tool's top (model -X) printed up
 * except the plan/bottom views, which look down/up the grip.
 */
export const VIEW_ROTATIONS = {
  side: SIDE_ROTATION,
  /** Looking down on the tool's top (-X_m). plane = (-z, -y, -x) */
  top: new Matrix4().set(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1),
  /** Looking up at the grip (+X_m). plane = (-z, y, x) */
  bottom: new Matrix4().set(0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1),
  /** Looking into the snout (+Z_m). plane = (y, -x, z) */
  front: new Matrix4().set(0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
  /** Looking at the handle end (-Z_m). plane = (-y, -x, -z) */
  rear: new Matrix4().set(0, -1, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1),
} as const
export type ViewRotation = keyof typeof VIEW_ROTATIONS

/** Sheet zones in sheet-plane metres, origin at the sheet centre. */
export const SHEET_ZONES = {
  trim: { x: -SHEET_WIDTH / 2, y: -SHEET_HEIGHT / 2, w: SHEET_WIDTH, h: SHEET_HEIGHT },
  /** Outer border line (zone letters/numbers live between trim and border). */
  border: { x: -0.388, y: -0.238, w: 0.776, h: 0.476 },
  /** Inner drawing frame. */
  frame: { x: -0.38, y: -0.23, w: 0.76, h: 0.46 },
  titleBlock: { x: 0.14, y: -0.23, w: 0.24, h: 0.085 },
  revisionBlock: { x: 0.14, y: -0.145, w: 0.24, h: 0.036 },
  notes: { x: 0.198, y: 0.118, w: 0.176, h: 0.106 },
} as const

export interface DrawingView {
  name: string
  label: string
  scaleLabel: string
  rotation: ViewRotation
  camera: OrthographicCamera
  /** Model -> sheet plane, including scale and placement. */
  transform: Matrix4
  /** [x, y, width, height] in sheet-plane metres, origin at the sheet centre. */
  rect: [number, number, number, number]
  scale: number
  /** Longitudinal half-section through the drivetrain axis (model y = 0). */
  section: boolean
}

export interface UnitBounds {
  min: Vector3
  max: Vector3
}

export interface DrawingGeometry {
  geometry: BufferGeometry
  bounds: Box3
  features: Record<string, Vector3>
  /** Rest-pose bounds of the named rig units, in the recentered model frame. */
  units: Record<string, UnitBounds>
  sourceTriangles: number
}

export interface DrawingLayout {
  /** Sheet size in world metres. Identical on every viewport. */
  width: number
  height: number
  primaryRotation: Matrix4
  /** Sheet-plane point the model origin maps to on the primary (1:1) view. */
  primaryCenter: Vector3
  views: DrawingView[]
  /** Camera distance that frames the whole sheet. */
  fitDistance: number
  narrow: boolean
  /** Sheet-plane y of the A–A cutting plane drawn on the primary view. */
  sectionLineY: number
}

/** Snapshot consolidated rest geometry without changing the cached GLTF. */
export function snapshotDrawing(rig: WrenchRig): DrawingGeometry {
  const list: BufferGeometry[] = []
  const features: Record<string, Vector3> = {}
  const recenter = new Matrix4().makeTranslation(-rig.center.x, -rig.center.y, -rig.center.z)
  for (const mesh of rig.meshes) {
    mesh.updateWorldMatrix(true, false)
    const g = mesh.geometry.clone()
    for (const key of Object.keys(g.attributes)) if (key !== 'position') g.deleteAttribute(key)
    g.applyMatrix4(new Matrix4().multiplyMatrices(recenter, mesh.matrixWorld))
    if (g.index) {
      list.push(g.toNonIndexed())
      g.dispose()
    } else list.push(g)
  }
  const geometry = mergeGeometries(list)!
  list.forEach((g) => g.dispose())
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox!.clone()
  const unitList: [string, Object3D | null | readonly Object3D[]][] = [
    ['housing', rig.housing],
    ['output', rig.outputShaft],
    ['bearing', rig.bearing],
    ['handle', rig.handleRoot],
    ['clutch', rig.clutch.static],
    ['fork', rig.clutch.sliding],
    ['ringSwitch', rig.clutch.ringSwitch],
    ['stage1', rig.stages.stage1.carrier],
    ['stage2', rig.stages.stage2.carrier],
    ['stage3', rig.stages.stage3.carrier],
    ['stage4', rig.stages.stage4.carrier],
    ['stage5', rig.stages.stage5.carrier],
  ]
  const units: Record<string, UnitBounds> = {}
  const point = new Vector3()
  for (const [id, unit] of unitList) {
    const nodes = ([] as Object3D[]).concat((unit ?? []) as Object3D | Object3D[])
    const min = new Vector3(Infinity, Infinity, Infinity)
    const max = new Vector3(-Infinity, -Infinity, -Infinity)
    let best = -Infinity
    for (const node of nodes) {
      node.updateWorldMatrix(true, true)
      node.traverse((child) => {
        const mesh = child as Mesh
        if (!mesh.isMesh) return
        const pos = mesh.geometry.getAttribute('position')
        for (let i = 0; i < pos.count; i += 1) {
          point.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).sub(rig.center)
          min.min(point)
          max.max(point)
          // Most camera-facing surface vertex (model +Y faces the side-elevation viewer).
          if (point.y > best) {
            best = point.y
            features[id] = point.clone()
          }
        }
      })
    }
    if (min.x !== Infinity) units[id] = { min, max }
  }
  return {
    geometry,
    bounds,
    features,
    units,
    sourceTriangles: geometry.getAttribute('position').count / 3,
  }
}

interface ViewDef {
  name: string
  label: string
  scaleLabel: string
  rotation: ViewRotation
  scale: number
  /** Sheet-plane centre of the view's model bounds. */
  at: [number, number]
  section?: boolean
}

/**
 * The view set. The 1:1 elevation owns the left-centre; its end views flank it (third-angle:
 * the snout view on the snout side), plan and bottom views run across the top band, and the
 * half-section sits in the right column between the notes and the title block. Positions are the
 * centres of each view's model bounds; tune here, everything else derives from them.
 */
export const VIEW_DEFS: readonly ViewDef[] = [
  { name: 'side', label: 'SIDE VIEW', scaleLabel: 'SCALE 1:1', rotation: 'side', scale: 1, at: [-0.12, -0.042] },
  { name: 'top', label: 'TOP VIEW', scaleLabel: 'SCALE 1:2', rotation: 'top', scale: 0.5, at: [-0.262, 0.19] },
  { name: 'section', label: 'SECTION A–A', scaleLabel: 'SCALE 1:2', rotation: 'side', scale: 0.5, at: [0.19, 0.02], section: true },
  { name: 'front', label: 'FRONT VIEW', scaleLabel: 'SCALE 1:2', rotation: 'front', scale: 0.5, at: [-0.335, -0.03] },
  { name: 'rear', label: 'REAR VIEW', scaleLabel: 'SCALE 1:2', rotation: 'rear', scale: 0.5, at: [0.085, -0.03] },
  { name: 'bottom', label: 'BOTTOM VIEW', scaleLabel: 'SCALE 1:2', rotation: 'bottom', scale: 0.5, at: [-0.07, 0.19] },
]

/** Model -> plane transform that puts the view's bounds centre at `at` with `scale`. */
function placeView(bounds: Box3, rotation: Matrix4, scale: number, at: [number, number]): Matrix4 {
  const centre = bounds.getCenter(new Vector3()).applyMatrix4(rotation).multiplyScalar(scale)
  return new Matrix4()
    .makeTranslation(at[0] - centre.x, at[1] - centre.y, -centre.z)
    .multiply(new Matrix4().makeScale(scale, scale, scale))
    .multiply(rotation)
}

export function viewCamera(): OrthographicCamera {
  const camera = new OrthographicCamera(-SHEET_WIDTH / 2, SHEET_WIDTH / 2, SHEET_HEIGHT / 2, -SHEET_HEIGHT / 2, 0.01, 4)
  camera.position.z = 2
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  camera.userData.planeWidth = SHEET_WIDTH
  camera.userData.planeHeight = SHEET_HEIGHT
  return camera
}

/** Sheet-plane rect of `bounds` under a full view transform, padded. */
export function transformedRect(bounds: Box3, transform: Matrix4, pad = 0.004): [number, number, number, number] {
  const box = bounds.clone().applyMatrix4(transform)
  return [box.min.x - pad, box.min.y - pad, box.max.x - box.min.x + 2 * pad, box.max.y - box.min.y + 2 * pad]
}

export function makeDrawingLayout(aspect: number, bounds: Box3): DrawingLayout {
  const views: DrawingView[] = VIEW_DEFS.map((def) => {
    const rotation = VIEW_ROTATIONS[def.rotation]
    // No z offset on any view: extractionPose places the model with
    // translate(primaryCenter) * SIDE_ROTATION, and the section's cut must stay on plane z = 0.
    const transform = placeView(bounds, rotation, def.scale, def.at)
    transform.elements[14] = 0
    return {
      name: def.name,
      label: def.label,
      scaleLabel: def.scaleLabel,
      rotation: def.rotation,
      camera: viewCamera(),
      transform,
      rect: transformedRect(bounds, transform),
      scale: def.scale,
      section: def.section === true,
    }
  })
  const primary = views[0]
  const primaryCenter = new Vector3().setFromMatrixPosition(primary.transform)
  const fitDistance = SHEET_HEIGHT / 0.92 / 2 / Math.tan((SHEET_FOV * Math.PI) / 360)
  return {
    width: SHEET_WIDTH,
    height: SHEET_HEIGHT,
    primaryRotation: SIDE_ROTATION,
    primaryCenter,
    views,
    fitDistance,
    narrow: SHEET_WIDTH / (SHEET_HEIGHT / 0.92) > aspect,
    // The A–A cutting plane is model y = 0, i.e. edge-on in the plan view; on the side view
    // it is drawn along the drivetrain centreline.
    sectionLineY: primaryCenter.y,
  }
}

/** Identical ortho matrix and viewport as the render target. */
export function projectFeature(point: Vector3, view: DrawingView): [number, number] {
  const p = point.clone().applyMatrix4(view.transform)
  return [p.x, p.y]
}

export interface RenderedDrawing {
  profile: BufferGeometry
  /** Widened strip along the same contour — the excitation needs real width to read. */
  profileRibbon: BufferGeometry
  profilePoints: number[][]
  perimeter: number
  dispose: () => void
}

/** Half-width of the excitation ribbon, in sheet metres. */
const PROFILE_RIBBON_HALF_WIDTH = 0.0011

/**
 * Turn the traced contour into a two-sided strip so the excitation is a visible trace rather
 * than a hairline. `LineBasicMaterial.linewidth` is ignored on every WebGL platform, so the
 * width has to be geometry.
 */
export function buildProfileRibbon(points: number[][], arc: number[]): BufferGeometry {
  const count = points.length
  const positions = new Float32Array(count * 6)
  const arcLength = new Float32Array(count * 2)
  for (let i = 0; i < count; i += 1) {
    const previous = points[(i - 1 + count) % count]
    const next = points[(i + 1) % count]
    let tx = next[0] - previous[0]
    let ty = next[1] - previous[1]
    const length = Math.hypot(tx, ty) || 1
    tx /= length
    ty /= length
    const nx = -ty * PROFILE_RIBBON_HALF_WIDTH
    const ny = tx * PROFILE_RIBBON_HALF_WIDTH
    positions[i * 6 + 0] = points[i][0] + nx
    positions[i * 6 + 1] = points[i][1] + ny
    positions[i * 6 + 2] = 0.0004
    positions[i * 6 + 3] = points[i][0] - nx
    positions[i * 6 + 4] = points[i][1] - ny
    positions[i * 6 + 5] = 0.0004
    arcLength[i * 2] = arc[i]
    arcLength[i * 2 + 1] = arc[i]
  }
  const indices = new Uint32Array(Math.max(0, count - 1) * 6)
  for (let i = 0; i + 1 < count; i += 1) {
    const a = i * 2
    indices[i * 6 + 0] = a
    indices[i * 6 + 1] = a + 1
    indices[i * 6 + 2] = a + 2
    indices[i * 6 + 3] = a + 1
    indices[i * 6 + 4] = a + 3
    indices[i * 6 + 5] = a + 2
  }
  const ribbon = new BufferGeometry()
  ribbon.setAttribute('position', new Float32BufferAttribute(positions, 3))
  ribbon.setAttribute('arcLength', new Float32BufferAttribute(arcLength, 1))
  ribbon.setIndex(new Uint32BufferAttribute(indices, 1))
  return ribbon
}

/** Ordered outer contour of a binary silhouette mask (R channel), in mask pixels. */
export function traceProfile(pixels: Uint8Array, w: number, h: number): number[][] {
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && pixels[(y * w + x) * 4] > 127
  const edges = new Map<string, [number, number][]>()
  const add = (x: number, y: number, a: number, b: number) => {
    const key = `${x},${y}`
    const bucket = edges.get(key) ?? []
    bucket.push([a, b])
    edges.set(key, bucket)
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!on(x, y)) continue
      if (!on(x, y - 1)) add(x, y, x + 1, y)
      if (!on(x + 1, y)) add(x + 1, y, x + 1, y + 1)
      if (!on(x, y + 1)) add(x + 1, y + 1, x, y + 1)
      if (!on(x - 1, y)) add(x, y + 1, x, y)
    }
  }
  let longest: number[][] = []
  while (edges.size) {
    const first = edges.keys().next().value!
    let key = first
    const path: number[][] = []
    do {
      const bucket = edges.get(key)
      if (!bucket?.length) break
      path.push(key.split(',').map(Number))
      const next = bucket.pop()!
      if (!bucket.length) edges.delete(key)
      key = next.join(',')
    } while (key !== first && path.length < w * h)
    if (key === first && path.length > longest.length) longest = path
  }
  if (longest.length) longest.push(longest[0])
  return longest
}

/**
 * True triangle/section-plane intersections (the cut outline) and 45-degree hatching of the
 * cut faces, for a transform whose section plane is plane z = 0. Returns 4-float segments.
 */
export function sectionLinework(
  position: Float32Array,
  transform: Matrix4,
  spacing: number,
): { cut: Float32Array; hatch: Float32Array } {
  const e = transform.elements
  const segments: number[] = []
  const v = new Float32Array(9)
  for (let i = 0; i < position.length; i += 9) {
    for (let k = 0; k < 3; k += 1) {
      const x = position[i + k * 3], y = position[i + k * 3 + 1], z = position[i + k * 3 + 2]
      v[k * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]
      v[k * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]
      v[k * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]
    }
    let hits = 0
    let hx0 = 0, hy0 = 0, hx1 = 0, hy1 = 0
    for (let k = 0; k < 3; k += 1) {
      const pz = v[k * 3 + 2]
      const q = (k + 1) % 3
      const qz = v[q * 3 + 2]
      if (pz < 0 !== qz < 0) {
        const t = -pz / (qz - pz)
        const hx = v[k * 3] + (v[q * 3] - v[k * 3]) * t
        const hy = v[k * 3 + 1] + (v[q * 3 + 1] - v[k * 3 + 1]) * t
        if (hits === 0) { hx0 = hx; hy0 = hy } else { hx1 = hx; hy1 = hy }
        hits += 1
      }
    }
    if (hits === 2) segments.push(hx0, hy0, hx1, hy1)
  }
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < segments.length; i += 4) {
    lo = Math.min(lo, segments[i] + segments[i + 1], segments[i + 2] + segments[i + 3])
    hi = Math.max(hi, segments[i] + segments[i + 1], segments[i + 2] + segments[i + 3])
  }
  const hatch: number[] = []
  for (let q = lo + spacing / 2; q <= hi; q += spacing) {
    const hits: number[] = []
    for (let i = 0; i < segments.length; i += 4) {
      const p = segments[i] + segments[i + 1]
      const r = segments[i + 2] + segments[i + 3]
      if (p < q !== r < q) hits.push(segments[i] + ((segments[i + 2] - segments[i]) * (q - p)) / (r - p))
    }
    hits.sort((x, y) => x - y)
    for (let i = 0; i + 1 < hits.length; i += 2) {
      if (hits[i + 1] - hits[i] < 1e-5) continue
      hatch.push(hits[i], q - hits[i], hits[i + 1], q - hits[i + 1])
    }
  }
  return { cut: new Float32Array(segments), hatch: new Float32Array(hatch) }
}
