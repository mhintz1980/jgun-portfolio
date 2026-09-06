import {
  Box3,
  BufferGeometry,
  Color,
  DepthTexture,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Plane,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Uint32BufferAttribute,
  Vector4,
  WebGLRenderTarget,
  type Object3D,
  type WebGLRenderer,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { WrenchRig } from '../rig/nodeRoles'

export const PAPER = '#08283a'
export const INK = '#b3dae2'

/**
 * Annotation raster size. Fixed rather than viewport-derived so the print is identical on
 * every device, and chosen as an exact 22:17 pair (1760 = 22 × 80, 1360 = 17 × 80) so the
 * SVG overlay, the render target and the sheet all agree to the pixel.
 */
export const PRINT_TARGET_WIDTH = 1760
export const PRINT_TARGET_HEIGHT = 1360

/**
 * SHEET FORMAT — owner ruling 2026-09-05: ANSI C, 22 × 17 in, aspect 1.294 : 1, landscape
 * on every viewport (the previous build swapped to a 0.36 × 0.76 portrait arrangement on
 * mobile; that is replaced by a scroll-driven camera push-in, see `sheetCamera.ts`).
 *
 * The world sheet is larger than a physical C sheet because the primary elevation must be
 * drawn 1:1 in WORLD metres — that is what makes the 3D model register to a view the code
 * projected, and the JGun is 283 mm long. World sheet 854.118 × 660.000 mm keeps the ANSI C
 * proportion exactly (22:17) and holds a four-view third-angle block plus furniture zones;
 * a physical C sheet carrying the same layout would be at 1:1.528.
 */
export const SHEET_HEIGHT = 0.7
export const SHEET_WIDTH = (SHEET_HEIGHT * 22) / 17
/** SVG annotation density. Derived so the overlay's pixel sheet is exactly the render target. */
export const PIXELS_PER_METER = PRINT_TARGET_WIDTH / SHEET_WIDTH
/** Desktop framing rule: the sheet fills this fraction of viewport height. */
export const SHEET_FIT_HEIGHT_FRACTION = 0.92
/** Field of view the intro camera holds while the sheet owns the frame. */
export const SHEET_FOV = 42

/**
 * PRIMARY VIEW ROTATION (model -> sheet plane): `plane = (-z, -x, y)`.
 *
 * The view direction is unchanged from the approved build — the side elevation still looks
 * along the model's +Y — but the in-plane orientation is rotated 180°. That single change
 * fixes two things at once (JG-026 Item 7.1):
 *
 *   1. the tool now sits grip-DOWN on its own elevation, the way the thing is held;
 *   2. the sheet's printed "up" becomes world -X instead of world +X.
 *
 * (2) matters because `SHEET_ROTATION` is forced to be this matrix's inverse — that identity
 * is what lands the extracted model exactly at world identity when the intro hands off — and
 * it therefore decides which way the print faces once it is lying in the world XZ plane.
 * With printed-up on world -X the sheet reads right-way-up from the CH.01 hero camera
 * (0.32, 0.16, 0.42), which is where the intro camera ends. With printed-up on world +X it
 * read from the far edge with every annotation inverted.
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

/**
 * THIRD-ANGLE PROJECTION SET.
 *
 * Every secondary view is derived from the primary frame by an unfold about a shared axis,
 * so the alignment is structural rather than eyeballed:
 *
 *   front  : plane_x = -Z_m,  plane_y = -X_m,  toward viewer = +Y_m
 *   top    : eye on -X_m (the object's top). Shares the front's horizontal axis and vertical
 *            centreline; placed ABOVE the front view.
 *   right  : eye on -Z_m (the object's right, which is plane -X on the front view). Shares
 *            the front's vertical axis and horizontal centreline; placed to the RIGHT.
 *   section: eye on +X_m (the object's underside). Shares the front's horizontal axis and
 *            vertical centreline; placed BELOW the front view, which is where a horizontal
 *            cutting plane with arrows pointing down puts it in third angle — and it is the
 *            region the JGun rises out of (owner note, Item 7.3).
 */
const VIEW_ROTATIONS = {
  front: SIDE_ROTATION,
  /** plane = (-z, -y, -x) */
  top: new Matrix4().set(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1),
  /** plane = (-y, -x, -z) */
  right: new Matrix4().set(0, -1, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1),
  /** plane = (-z, y, x) */
  section: new Matrix4().set(0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1),
} as const

/** Clear space between adjacent third-angle views (leaders and dimensions live here). */
const VIEW_GAP = 0.022
/** Symmetric padding around each view's true extent so edge linework is never scissored. */
const VIEW_MARGIN = 0.005

/**
 * Reserved sheet furniture zones, in sheet-plane metres with the origin at the sheet centre.
 * These are the rectangles Mark's hand-drawn SVG owns; the generated content never draws
 * inside them and the SVG template (`scripts/export-sheet-template.mjs`) emits them verbatim.
 */
export const SHEET_ZONES = {
  /** Outer trim/border frame. */
  border: { x: -0.4249, y: -0.322, w: 0.8499, h: 0.644 },
  /** HAND-DRAWN SLOT — bottom-right title block. */
  titleBlock: { x: 0.1109, y: -0.322, w: 0.3, h: 0.086 },
  /** HAND-DRAWN SLOT — top-right revision block. */
  revisionBlock: { x: 0.2109, y: 0.242, w: 0.2, h: 0.08 },
  /** HAND-DRAWN SLOT — bottom-left general notes. */
  notes: { x: -0.4249, y: -0.322, w: 0.34, h: 0.086 },
  /** GENERATED — GD&T frames, datum table and the CAD reference-dimension table. */
  tables: { x: 0.175, y: -0.218, w: 0.2359, h: 0.438 },
  /**
   * GENERATED — the single callout lane, OUTBOARD of the view block on the left. Placing it
   * there is what makes the leader set short and planar: every anchor is on the primary
   * elevation or the section directly below it, both of which have open sheet to their left,
   * so no leader has to cross another view to reach its label.
   */
  callouts: { x: -0.4149, y: -0.232, w: 0.12, h: 0.538 },
  /** GENERATED — the third-angle view block. Nothing hand-drawn goes here. */
  views: { x: -0.2849, y: -0.236, w: 0.4401, h: 0.546 },
} as const

export interface DrawingView {
  name: string
  label: string
  camera: OrthographicCamera
  transform: Matrix4
  /** [x, y, width, height] in sheet-plane metres, origin at the sheet centre. */
  rect: [number, number, number, number]
  scale: number
  section: boolean
}

export interface DrawingGeometry {
  geometry: BufferGeometry
  edges: EdgesGeometry
  bounds: Box3
  features: Record<string, Vector3>
  sourceTriangles: number
}

export interface DrawingLayout {
  /** Sheet size in world metres. Identical on every viewport. */
  width: number
  height: number
  primaryRotation: Matrix4
  primaryCenter: Vector3
  views: DrawingView[]
  /** Camera distance that fits the sheet to SHEET_FIT_HEIGHT_FRACTION of viewport height. */
  fitDistance: number
  /** True when the viewport is too narrow to read the fitted sheet (drives the mobile pan). */
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
  // Actual camera-facing surface vertices on named rig units, never invented SVG endpoints.
  const units: [string, Object3D | null][] = [
    ['P000245', rig.housing],
    ['P003068', rig.clutch.ringSwitch],
    ['P000095', rig.outputShaft],
    ['A000606', rig.stages.stage5.carrier],
    ['K000004', rig.bearing],
    ['A000591', rig.stages.stage1.carrier],
    ['HANDLE', rig.handleRoot],
  ]
  const point = new Vector3()
  for (const [id, unit] of units) {
    if (!unit) continue
    let best = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    unit.traverse((node) => {
      if (!(node as Mesh).isMesh) return
      const mesh = node as Mesh
      const pos = mesh.geometry.getAttribute('position')
      for (let i = 0; i < pos.count; i += 1) {
        point.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).sub(rig.center)
        if (point.y > best) {
          best = point.y
          features[id] = point.clone()
        }
        if (point.z < minZ) {
          minZ = point.z
          features[`${id}:minZ`] = point.clone()
        }
        if (point.z > maxZ) {
          maxZ = point.z
          features[`${id}:maxZ`] = point.clone()
        }
      }
    })
  }
  const edges = new EdgesGeometry(geometry, 22)
  return {
    geometry,
    edges,
    bounds,
    features,
    sourceTriangles: geometry.getAttribute('position').count / 3,
  }
}

/**
 * Padded extent of the model under a view rotation, in sheet-plane metres at scale 1.
 * The padding is symmetric so it never disturbs the third-angle centreline alignment.
 */
function viewExtent(bounds: Box3, rotation: Matrix4): { width: number; height: number } {
  const box = bounds.clone().applyMatrix4(rotation)
  return {
    width: box.max.x - box.min.x + 2 * VIEW_MARGIN,
    height: box.max.y - box.min.y + 2 * VIEW_MARGIN,
  }
}

/**
 * Build the sheet. The primary elevation is 1:1 and every other view is scaled to match it,
 * so the three-view alignment holds without any per-view fudge factor. Secondary views are
 * placed by shared axis, not by a hand-entered rectangle:
 *
 *      +----------+                    top   (above front, shared vertical centreline)
 *      +----------+  +--+
 *      |          |  |  |              front (1:1, the view the model registers to)
 *      |  front   |  |rt|              right (right of front, shared horizontal centreline)
 *      +----------+  +--+
 *      +----------+                    A–A   (below front, shared vertical centreline)
 */
export function makeDrawingLayout(aspect: number, bounds: Box3): DrawingLayout {
  const front = viewExtent(bounds, VIEW_ROTATIONS.front)
  const top = viewExtent(bounds, VIEW_ROTATIONS.top)
  const right = viewExtent(bounds, VIEW_ROTATIONS.right)
  const section = viewExtent(bounds, VIEW_ROTATIONS.section)

  const blockHeight = top.height + VIEW_GAP + front.height + VIEW_GAP + section.height
  const zone = SHEET_ZONES.views
  // Reserve the left margin of the views zone for the overall-height dimension, which sits
  // between the callout lane and the elevation it measures.
  const leftPad = 0.033
  const blockBottom = zone.y + Math.max(0, (zone.h - blockHeight) / 2)
  const frontLeft = zone.x + leftPad
  const frontBottom = blockBottom + section.height + VIEW_GAP
  const frontCenterX = frontLeft + front.width / 2
  const frontCenterY = frontBottom + front.height / 2

  const rects: Record<string, DrawingView['rect']> = {
    front: [frontLeft, frontBottom, front.width, front.height],
    // shared vertical centreline with front
    top: [frontCenterX - top.width / 2, frontBottom + front.height + VIEW_GAP, top.width, top.height],
    section: [frontCenterX - section.width / 2, blockBottom, section.width, section.height],
    // shared horizontal centreline with front
    right: [
      frontLeft + front.width + VIEW_GAP,
      frontCenterY - right.height / 2,
      right.width,
      right.height,
    ],
  }

  const view = (
    name: keyof typeof VIEW_ROTATIONS,
    label: string,
    isSection = false,
  ): DrawingView => {
    const rect = rects[name]
    const camera = new OrthographicCamera(
      -SHEET_WIDTH / 2,
      SHEET_WIDTH / 2,
      SHEET_HEIGHT / 2,
      -SHEET_HEIGHT / 2,
      0.01,
      4,
    )
    camera.position.z = 2
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()
    camera.userData.planeWidth = SHEET_WIDTH
    camera.userData.planeHeight = SHEET_HEIGHT
    const transform = new Matrix4()
      .makeTranslation(rect[0] + rect[2] / 2, rect[1] + rect[3] / 2, 0)
      .multiply(VIEW_ROTATIONS[name])
    return { name, label, rect, transform, camera, scale: 1, section: isSection }
  }

  const views = [
    view('front', '01 / SIDE ELEVATION · 1:1'),
    view('top', '02 / PLAN · THIRD ANGLE'),
    view('right', '03 / END · THIRD ANGLE'),
    view('section', '04 / SECTION A–A'),
  ]

  const fitDistance =
    SHEET_HEIGHT / SHEET_FIT_HEIGHT_FRACTION / 2 / Math.tan((SHEET_FOV * Math.PI) / 360)
  // The sheet reads at fitDistance only when the viewport is wide enough to hold its width.
  const narrow = SHEET_WIDTH / (SHEET_HEIGHT / SHEET_FIT_HEIGHT_FRACTION) > aspect

  return {
    width: SHEET_WIDTH,
    height: SHEET_HEIGHT,
    primaryRotation: VIEW_ROTATIONS.front,
    primaryCenter: new Vector3(frontCenterX, frontCenterY, 0),
    views,
    fitDistance,
    narrow,
    // The cutting plane is the model's X = 0, and the front view maps plane_y = -X_m, so
    // A–A lands exactly on the front view's horizontal centreline.
    sectionLineY: frontCenterY,
  }
}

/** Identical ortho matrix and viewport as the render target. */
export function projectFeature(point: Vector3, view: DrawingView): [number, number] {
  const p = point.clone().applyMatrix4(view.transform).project(view.camera)
  return [
    (p.x * view.camera.userData.planeWidth) / 2,
    (p.y * view.camera.userData.planeHeight) / 2,
  ]
}

export interface RenderedDrawing {
  target: WebGLRenderTarget
  mask: WebGLRenderTarget
  edgeMask: WebGLRenderTarget
  profile: BufferGeometry
  /** Widened strip along the same contour — the excitation needs real width to read. */
  profileRibbon: BufferGeometry
  profilePoints: number[][]
  perimeter: number
  dispose: () => void
}

/** Half-width of the excitation ribbon, in sheet metres (~7 px at 1920 on a fitted sheet). */
const PROFILE_RIBBON_HALF_WIDTH = 0.0025

/**
 * Turn the traced contour into a two-sided strip so the excitation is a visible trace rather
 * than a hairline. `LineBasicMaterial.linewidth` is ignored on every WebGL platform, so the
 * width has to be geometry.
 */
function buildProfileRibbon(points: number[][], arc: number[]): BufferGeometry {
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
    positions[i * 6 + 2] = 0.0002
    positions[i * 6 + 3] = points[i][0] - nx
    positions[i * 6 + 4] = points[i][1] - ny
    positions[i * 6 + 5] = 0.0002
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

/** Ordered outer contour of the depth-rendered silhouette, in target pixels. */
function traceProfile(pixels: Uint8Array, w: number, h: number): number[][] {
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

/** True triangle/section-plane intersections and 45-degree section hatching. */
function sectionLinework(data: DrawingGeometry, transform: Matrix4): BufferGeometry {
  const a = data.geometry.getAttribute('position')
  const v = [new Vector3(), new Vector3(), new Vector3()]
  const segments: number[][] = []
  const positions: number[] = []
  for (let i = 0; i < a.count; i += 3) {
    for (let k = 0; k < 3; k += 1) v[k].fromBufferAttribute(a, i + k).applyMatrix4(transform)
    const hit: number[][] = []
    for (let k = 0; k < 3; k += 1) {
      const p = v[k]
      const q = v[(k + 1) % 3]
      if (p.z < 0 !== q.z < 0) {
        const t = -p.z / (q.z - p.z)
        hit.push([p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t])
      }
    }
    if (hit.length === 2) {
      const s = [...hit[0], ...hit[1]]
      segments.push(s)
      positions.push(s[0], s[1], 0.0001, s[2], s[3], 0.0001)
    }
  }
  let lo = Infinity
  let hi = -Infinity
  for (const s of segments) {
    lo = Math.min(lo, s[0] + s[1], s[2] + s[3])
    hi = Math.max(hi, s[0] + s[1], s[2] + s[3])
  }
  for (let q = lo; q <= hi; q += 0.003) {
    const hits: number[] = []
    for (const s of segments) {
      const p = s[0] + s[1]
      const r = s[2] + s[3]
      if (p < q !== r < q) hits.push(s[0] + ((s[2] - s[0]) * (q - p)) / (r - p))
    }
    hits.sort((x, y) => x - y)
    for (let i = 0; i + 1 < hits.length; i += 2) {
      positions.push(hits[i], q - hits[i], 0.0001, hits[i + 1], q - hits[i + 1], 0.0001)
    }
  }
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3))
}

/** Opaque depth occluders plus depth-tested crease edges. Targets are baked once per layout. */
export function renderDrawing(
  gl: WebGLRenderer,
  data: DrawingGeometry,
  layout: DrawingLayout,
  pixelWidth: number,
  pixelHeight: number,
): RenderedDrawing {
  const w = pixelWidth
  const h = pixelHeight
  const ppm = h / layout.height
  const rw = layout.width
  const rh = layout.height
  const target = new WebGLRenderTarget(w, h, { depthBuffer: true })
  const mask = new WebGLRenderTarget(w, h, { depthBuffer: true })
  target.depthTexture = new DepthTexture(w, h)
  const outlined = new WebGLRenderTarget(w, h)
  const edgeMask = new WebGLRenderTarget(w, h)
  const scene = new Scene()
  const solidMat = new MeshBasicMaterial({
    color: PAPER,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    toneMapped: false,
  })
  const edgeMat = new LineBasicMaterial({ color: INK, depthTest: true, depthWrite: false, toneMapped: false })
  const solid = new Mesh(data.geometry, solidMat)
  const lines = new LineSegments(data.edges, edgeMat)
  lines.renderOrder = 1
  const root = new Group()
  root.add(solid, lines)
  scene.add(root)
  const previous = gl.getRenderTarget()
  const clear = gl.getClearColor(new Color())
  const alpha = gl.getClearAlpha()
  const viewport = gl.getViewport(new Vector4())
  const scissor = gl.getScissor(new Vector4())
  const scissorTest = gl.getScissorTest()
  const auto = gl.autoClear
  const clipping = gl.localClippingEnabled
  gl.autoClear = false
  gl.localClippingEnabled = true
  gl.setRenderTarget(target)
  gl.setClearColor(PAPER, 1)
  gl.clear()
  for (const view of layout.views) {
    root.matrix.copy(view.transform)
    root.matrixAutoUpdate = false
    root.updateMatrixWorld(true)
    // Third-angle half section: the observer of the A–A view sits on +X_m, so the material
    // between the observer and the cutting plane (view depth > 0) is what gets removed.
    const clip = view.section ? [new Plane(new Vector3(0, 0, -1), 0)] : null
    solidMat.clippingPlanes = clip
    edgeMat.clippingPlanes = clip
    const [x, y, vw, vh] = view.rect
    gl.setViewport(0, 0, w, h)
    gl.setScissor(
      Math.floor((x + rw / 2) * ppm),
      Math.floor((y + rh / 2) * ppm),
      Math.ceil(vw * ppm),
      Math.ceil(vh * ppm),
    )
    gl.setScissorTest(true)
    gl.render(scene, view.camera)
    if (view.section) {
      const cutGeometry = sectionLinework(data, view.transform)
      const cutMaterial = new LineBasicMaterial({
        color: INK,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
      const cutScene = new Scene()
      cutScene.add(new LineSegments(cutGeometry, cutMaterial))
      gl.render(cutScene, view.camera)
      cutGeometry.dispose()
      cutMaterial.dispose()
    }
  }
  gl.setScissorTest(false)
  const primary = layout.views[0]
  // Depth discontinuities add true view silhouettes (smooth cylinders have no crease at their profile).
  // Occluded/back-face lines never enter this pass: they failed the opaque scene's depth test.
  const quadScene = new Scene()
  const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 2)
  quadCamera.position.z = 1
  const quadGeometry = new PlaneGeometry(2, 2)
  const quadMaterial = new ShaderMaterial({
    uniforms: {
      source: { value: target.texture },
      depth: { value: target.depthTexture },
      texel: { value: new Vector2(1 / w, 1 / h) },
      paper: { value: new Color(PAPER) },
      ink: { value: new Color(INK) },
      proof: { value: 0 },
      region: {
        value: new Vector4(
          (primary.rect[0] + rw / 2) / rw,
          (primary.rect[1] + rh / 2) / rh,
          primary.rect[2] / rw,
          primary.rect[3] / rh,
        ),
      },
    },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}',
    fragmentShader: `
  uniform sampler2D source,depth;uniform vec2 texel;uniform vec3 paper,ink;uniform float proof;uniform vec4 region;varying vec2 vUv;
  void main(){vec3 c=texture2D(source,vUv).rgb;float d=texture2D(depth,vUv).r;
   float edge=max(max(abs(d-texture2D(depth,vUv+vec2(texel.x,0.)).r),abs(d-texture2D(depth,vUv-vec2(texel.x,0.)).r)),max(abs(d-texture2D(depth,vUv+vec2(0.,texel.y)).r),abs(d-texture2D(depth,vUv-vec2(0.,texel.y)).r)));
   float line=max(step(.003,edge),step(.08,length(c-paper)));
   if(proof>.5){float inside=step(region.x,vUv.x)*step(region.y,vUv.y)*step(vUv.x,region.x+region.z)*step(vUv.y,region.y+region.w);gl_FragColor=vec4(vec3(line*inside),1.);}
   else gl_FragColor=vec4(mix(c,ink,step(.003,edge)),1.);
  }`,
    toneMapped: false,
  })
  quadScene.add(new Mesh(quadGeometry, quadMaterial))
  gl.setRenderTarget(outlined)
  gl.setViewport(0, 0, w, h)
  gl.clear()
  gl.render(quadScene, quadCamera)
  quadMaterial.uniforms.proof.value = 1
  gl.setRenderTarget(edgeMask)
  gl.clear()
  gl.render(quadScene, quadCamera)
  quadMaterial.dispose()
  quadGeometry.dispose()
  gl.setRenderTarget(mask)
  gl.setClearColor(0x000000, 1)
  gl.clear()
  root.matrix.copy(primary.transform)
  root.updateMatrixWorld(true)
  solidMat.clippingPlanes = null
  solidMat.color.set(0xffffff)
  lines.visible = false
  gl.setViewport(0, 0, w, h)
  gl.render(scene, primary.camera)
  const pixels = new Uint8Array(w * h * 4)
  gl.readRenderTargetPixels(mask, 0, 0, w, h, pixels)
  const profilePoints = traceProfile(pixels, w, h).map(([px, py]) => [
    (px / w - 0.5) * rw,
    (py / h - 0.5) * rh,
  ])
  const positions: number[] = []
  const lengths: number[] = []
  let perimeter = 0
  for (let i = 0; i < profilePoints.length; i += 1) {
    const p = profilePoints[i]
    if (i) perimeter += Math.hypot(p[0] - profilePoints[i - 1][0], p[1] - profilePoints[i - 1][1])
    positions.push(p[0], p[1], 0.0002)
    lengths.push(perimeter)
  }
  const normalizedArc = lengths.map((s) => s / perimeter)
  const profile = new BufferGeometry()
  profile.setAttribute('position', new Float32BufferAttribute(positions, 3))
  profile.setAttribute('arcLength', new Float32BufferAttribute(normalizedArc, 1))
  const profileRibbon = buildProfileRibbon(profilePoints, normalizedArc)
  gl.setRenderTarget(previous)
  gl.setViewport(viewport)
  gl.setScissor(scissor)
  gl.setScissorTest(scissorTest)
  gl.setClearColor(clear, alpha)
  gl.autoClear = auto
  gl.localClippingEnabled = clipping
  solidMat.dispose()
  edgeMat.dispose()
  target.dispose()
  return {
    target: outlined,
    mask,
    edgeMask,
    profile,
    profileRibbon,
    profilePoints,
    perimeter,
    dispose: () => {
      outlined.dispose()
      mask.dispose()
      edgeMask.dispose()
      profile.dispose()
      profileRibbon.dispose()
    },
  }
}
