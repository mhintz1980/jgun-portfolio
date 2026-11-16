import { Box3, BoxGeometry, BufferAttribute, BufferGeometry, DataTexture, Group, LinearFilter, LinearMipmapLinearFilter, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Raycaster, RepeatWrapping, RGBAFormat, Texture, UnsignedByteType, Vector2, Vector3, type Camera, type Material, type Object3D } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { PORTAL_DESK_Z } from '../drawing/sheet/portal'
import type { ExtractionContext } from '../drawing/poseCore'
import type { DrawingFrameInput } from './privateSheetRuntime'
import { boxPolygon, boxReach, hull, intersects, KEEP_OUT, onPlate, pointBoxDistance, type LocalBox, type Point } from './metrologyFootprints'

type Kind = 'roller' | 'slider' | 'fixture'
export interface MetrologyLayoutEntry {
  readonly id: string; readonly kind: Kind
  /** Home pose on the surface plate (sheet-local metres, yaw in radians). */
  readonly x: number; readonly y: number; readonly theta: number
  /** Tool-local footprint box covering every vertex of the authored asset (rollers: the full roll envelope). */
  readonly box: LocalBox
  /** Rolling radius = height of the cylinder axis above the table; 0 for non-rollers. */
  readonly radius: number
}
const entry = (id: string, kind: Kind, x: number, y: number, theta: number, box: LocalBox, radius = 0): MetrologyLayoutEntry => ({ id, kind, x, y, theta, box, radius })
/**
 * Authored layout. Boxes come from the decoded GLB (see metrologyRuntime tests) plus 0.2 mm; every home pose
 * keeps its full oriented footprint outside |x|<0.404 && |y|<0.254, on the granite plate and clear of the others.
 * The height gauge stands on the -u side of the V-block with its ruby stylus tip 0.9 mm from the test-shaft end face.
 */
export const METROLOGY_LAYOUT: readonly MetrologyLayoutEntry[] = [
  entry('pencil-rotring-600', 'roller', .427, -.16, 1.5, [-.0757, .0663, -.0053, .0053], .0044),
  entry('digital-calipers-150mm', 'slider', .472, .048, -1.5, [-.1073, .1313, -.0463, .0281]),
  entry('micrometer-0-25mm', 'slider', -.452, -.135, 1.4, [-.0722, .0693, -.0233, .0195]),
  entry('gauge-block-10mm', 'slider', .438, -.239, -.34, [-.0052, .0052, -.0047, .0047]),
  entry('gauge-block-20mm', 'slider', .202, -.27, 0, [-.0102, .0102, -.0047, .0047]),
  entry('gauge-block-25mm', 'slider', -.432, -.022, -.27, [-.0127, .0127, -.0047, .0047]),
  entry('gauge-block-30mm', 'slider', .436, .195, .42, [-.0152, .0152, -.0047, .0047]),
  entry('gauge-block-50mm', 'slider', .469, -.101, 0, [-.0252, .0252, -.0047, .0047]),
  entry('pin-gauge-6mm', 'roller', .102, -.271, -.08, [-.0252, .0252, -.0035, .0035], .003),
  entry('pin-gauge-8mm', 'roller', .468, -.165, .92, [-.0252, .0252, -.0044, .0044], .004),
  entry('pin-gauge-10mm', 'roller', -.199, -.271, 0, [-.0252, .0252, -.0054, .0054], .005),
  entry('plug-gauge-gonogo', 'roller', -.463, .066, 0, [-.0622, .0482, -.0065, .0065], .0052),
  entry('v-block-clamp', 'fixture', -.449, .168, .24, [-.0377, .0377, -.0317, .0317]),
  entry('height-gauge-dial', 'fixture', -.54458, .14461, .24, [-.0362, .0602, -.0302, .0302]),
]

export interface InteractivePropState {
  readonly id: string; readonly kind: Kind; readonly root: Group; readonly rollerMesh: Group
  homeX: number; homeY: number; readonly homeTheta: number; readonly radius: number
  readonly interactionRadius: number; readonly mass: number; readonly maxOffset: number; readonly maxYaw: number
  readonly box: LocalBox; readonly reach: number
  /** Cached oriented footprint of the current pose (rebuilt only when the pose changes) and the sleep flag. */
  shape: Point[]; asleep: boolean
  x: number; y: number; theta: number; vx: number; vy: number; vTheta: number; rollAngle: number; lastShockFracture: number
}
export interface MetrologyAssetStats { triangles: number; detailTriangles: number; drawCalls: number; materials: string[] }
export interface MetrologyWorkbenchTelemetry {
  visible: boolean; loaded: boolean; loadError: string | null; disposed: boolean
  lastCursorLocal: [number, number] | null; interactionCount: number
  /** Triangles of the full-tier asset / of the lite tier (detail-* nodes hidden) / currently drawn. */
  assetTriangles: number; liteTriangles: number; visibleTriangles: number
  tier: 'full' | 'lite'; awakeProps: number; frozen: boolean; measurementHidden: boolean; layoutAdjusted: string[]; violations: string[]
  props: Array<{
    id: string; kind: Kind; position: [number, number, number]; rotationZ: number; rollAngle: number; displacedMm: number
    footprint: Point[]; localBounds: { min: number[]; max: number[] } | null; asset: MetrologyAssetStats | null
  }>
}
export interface MetrologyWorkbenchPropsRuntime {
  readonly group: Group; readonly props: readonly InteractivePropState[]
  startLoading(onLoaded?: () => void): Promise<void>
  onPointerMove(x: number, y: number): void
  nudgeProp(id: string, x: number, y: number, theta?: number): boolean
  /** Reversibly hides every prop visual and contact-shadow material (measurement only; physics and group visibility untouched). */
  setMeasurementHidden(hidden: boolean): void
  update(frame: DrawingFrameInput, context: ExtractionContext, camera: Camera): void
  snapshot(): MetrologyWorkbenchTelemetry
  dispose(): void
}
declare global {
  interface Window {
    __metrologyWorkbench?: Pick<MetrologyWorkbenchPropsRuntime, 'snapshot' | 'nudgeProp'> & {
      moveCursorNdc: (x: number, y: number) => void
      setMeasurementHidden?: (hidden: boolean) => void
    }
  }
}

const deskZ = PORTAL_DESK_Z + .00015
const clamp = (n: number, max: number) => Math.max(-max, Math.min(max, n))
const ASSET_TOLERANCE = .0003
const SHADOW_MARGIN = .014

// ---------------------------------------------------------------------------------------------------------------
// Deterministic finish maps (no network): one shared normal map + roughness map for every metal/plastic material.
// ---------------------------------------------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** Tileable value noise on a lx x ly lattice, sampled at u,v in [0,1). */
function latticeNoise(seed: number, lx: number, ly: number) {
  const rand = mulberry32(seed), cells = new Float32Array(lx * ly)
  for (let i = 0; i < cells.length; i++) cells[i] = rand()
  const at = (ix: number, iy: number) => cells[((iy % ly + ly) % ly) * lx + ((ix % lx + lx) % lx)]
  return (u: number, v: number) => {
    const fx = u * lx, fy = v * ly, ix = Math.floor(fx), iy = Math.floor(fy)
    const tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    return (at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy
  }
}
export interface MicroTextures { normal: DataTexture; roughness: DataTexture }
export function createMicroTextures(size = 128): MicroTextures {
  // Streaks run along U (the tool's long axis); a fine isotropic grain and a few deterministic scratches sit on top.
  const streakA = latticeNoise(11, 3, 40), streakB = latticeNoise(23, 5, 96), grain = latticeNoise(37, 48, 48), grain2 = latticeNoise(41, 96, 96)
  const height = new Float32Array(size * size), scratchRand = mulberry32(53)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size, v = (y + .5) / size
    height[y * size + x] = streakA(u, v) * .5 + streakB(u, v) * .35 + grain(u, v) * .22 + grain2(u, v) * .12
  }
  for (let s = 0; s < 14; s++) {
    const row = Math.floor(scratchRand() * size), start = Math.floor(scratchRand() * size), length = 18 + Math.floor(scratchRand() * 56), depth = .08 + scratchRand() * .12
    for (let i = 0; i < length; i++) { const col = (start + i) % size, idx = ((row + (i % 11 === 0 ? 1 : 0)) % size) * size + col; height[idx] -= depth }
  }
  const normal = new Uint8Array(size * size * 4), rough = new Uint8Array(size * size * 4), strength = 2.2
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let nx = -(h(x + 1, y) - h(x - 1, y)) * strength, ny = -(h(x, y + 1) - h(x, y - 1)) * strength, nz = 1
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l
    const i = (y * size + x) * 4
    normal[i] = Math.round((nx * .5 + .5) * 255); normal[i + 1] = Math.round((ny * .5 + .5) * 255); normal[i + 2] = Math.round((nz * .5 + .5) * 255); normal[i + 3] = 255
    const r = Math.max(.84, Math.min(1, .93 + (grain(x / size, y / size) - .5) * .14 + (streakB(x / size, y / size) - .5) * .1 + Math.min(0, height[y * size + x] - .9) * .2))
    const g = Math.round(r * 255)
    rough[i] = g; rough[i + 1] = g; rough[i + 2] = g; rough[i + 3] = 255
  }
  const make = (data: Uint8Array) => {
    const t = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
    t.wrapS = RepeatWrapping; t.wrapT = RepeatWrapping; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter
    t.generateMipmaps = true; t.anisotropy = 4; t.channel = 1; t.needsUpdate = true
    return t
  }
  return { normal: make(normal), roughness: make(rough) }
}
const FINISH: Record<string, { n: number; r: number; env?: number }> = {
  // Barely-there micro-relief: reflections stay crisp at distance, detail only shows in close glancing light.
  steel: { n: .04, r: 1.04 }, lap: { n: .015, r: 1.03, env: 1.2 }, black: { n: .025, r: 1.04 }, grip: { n: .1, r: 1.05 },
  brass: { n: .04, r: 1.04 }, ivory: { n: .03, r: 1.03 }, red: { n: .03, r: 1.03 }, green: { n: .03, r: 1.03 },
}
function finishMaterial(m: Material, maps: MicroTextures) {
  const spec = FINISH[m.name]
  if (!spec || !(m instanceof MeshStandardMaterial)) return
  m.normalMap = maps.normal; m.normalScale.set(spec.n, spec.n)
  m.roughnessMap = maps.roughness; m.roughness = Math.min(1, m.roughness * spec.r)
  if (spec.env) m.envMapIntensity = spec.env
  m.needsUpdate = true
}
/** Box-projected second UV set (metric, long axis along U) used only by the finish maps; the authored uv stays untouched. */
export function addMicroUv(geometry: BufferGeometry, tile = .012) {
  if (geometry.getAttribute('uv1')) return
  const pos = geometry.getAttribute('position'), nor = geometry.getAttribute('normal')
  if (!pos) return
  const uv = new Float32Array(pos.count * 2), k = 1 / tile
  for (let i = 0; i < pos.count; i++) {
    const nx = nor ? Math.abs(nor.getX(i)) : 0, ny = nor ? Math.abs(nor.getY(i)) : 1, nz = nor ? Math.abs(nor.getZ(i)) : 0
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    let u: number, v: number
    if (nx >= ny && nx >= nz) { u = z; v = y } else if (ny >= nz) { u = x; v = z } else { u = x; v = y }
    uv[i * 2] = u * k; uv[i * 2 + 1] = v * k
  }
  geometry.setAttribute('uv1', new BufferAttribute(uv, 2))
}

// ---------------------------------------------------------------------------------------------------------------
// Shaped contact shadow: projected XY triangles of the real mesh, weighted by height above the table, then blurred.
// ---------------------------------------------------------------------------------------------------------------
export interface ShadowRaster { width: number; height: number; data: Uint8Array; x0: number; y0: number; w: number; h: number }
export function rasterizeContactShadow(xyz: ArrayLike<number>, index: ArrayLike<number>, box: LocalBox, margin = SHADOW_MARGIN, maxCells = 160): ShadowRaster {
  const x0 = box[0] - margin, y0 = box[2] - margin, w = box[1] - box[0] + 2 * margin, h = box[3] - box[2] + 2 * margin
  const cell = Math.max(w, h) / maxCells, W = Math.max(8, Math.ceil(w / cell)), H = Math.max(8, Math.ceil(h / cell))
  const field = new Float32Array(W * H)
  for (let t = 0; t + 2 < index.length; t += 3) {
    const a = index[t] * 3, b = index[t + 1] * 3, c = index[t + 2] * 3
    const ax = (xyz[a] - x0) / cell, ay = (xyz[a + 1] - y0) / cell, bx = (xyz[b] - x0) / cell, by = (xyz[b + 1] - y0) / cell, cx = (xyz[c] - x0) / cell, cy = (xyz[c + 1] - y0) / cell
    const value = Math.exp(-Math.max(0, (xyz[a + 2] + xyz[b + 2] + xyz[c + 2]) / 3) / .009)
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx))), maxX = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx)))
    const minY = Math.max(0, Math.floor(Math.min(ay, by, cy))), maxY = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)))
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
    for (let py = minY; py <= maxY; py++) for (let px = minX; px <= maxX; px++) {
      const sx = px + .5, sy = py + .5
      let inside = Math.abs(area) < 1e-9
      if (!inside) {
        const w0 = ((bx - sx) * (cy - sy) - (cx - sx) * (by - sy)) / area, w1 = ((cx - sx) * (ay - sy) - (ax - sx) * (cy - sy)) / area, w2 = 1 - w0 - w1
        inside = w0 >= -.02 && w1 >= -.02 && w2 >= -.02
      }
      if (inside && field[py * W + px] < value) field[py * W + px] = value
    }
  }
  // Three box blurs ~ gaussian of 4 mm.
  const radius = Math.max(1, Math.round(.004 / cell)), tmp = new Float32Array(W * H)
  const blur = (src: Float32Array, dst: Float32Array, horizontal: boolean) => {
    const n = horizontal ? W : H, lines = horizontal ? H : W
    for (let line = 0; line < lines; line++) for (let i = 0; i < n; i++) {
      let sum = 0
      for (let k = -radius; k <= radius; k++) { const j = Math.min(n - 1, Math.max(0, i + k)); sum += horizontal ? src[line * W + j] : src[j * W + line] }
      const value = sum / (radius * 2 + 1)
      if (horizontal) dst[line * W + i] = value; else dst[i * W + line] = value
    }
  }
  let a = field, b = tmp
  for (let pass = 0; pass < 3; pass++) { blur(a, b, true); blur(b, a, false) }
  const data = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) data[i * 4 + 3] = Math.round(Math.pow(Math.min(1, a[i] * 1.7), 1.25) * .72 * 255)
  return { width: W, height: H, data, x0, y0, w, h }
}
const rasterTexture = (r: ShadowRaster) => {
  const t = new DataTexture(r.data, r.width, r.height, RGBAFormat, UnsignedByteType)
  t.magFilter = LinearFilter; t.minFilter = LinearFilter; t.generateMipmaps = false; t.needsUpdate = true
  return t
}

interface Prepared {
  p: InteractivePropState; node: Object3D; corrected: Group; inner: Group
  bounds: Box3; minZ: number; support: Point[] | null
  stats: MetrologyAssetStats; shadow: ShadowRaster
}

export function createMetrologyWorkbenchProps(): MetrologyWorkbenchPropsRuntime {
  const group = new Group(); group.name = 'metrology-workbench-props'; group.matrixAutoUpdate = false; group.visible = false
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>()
  const props: InteractivePropState[] = []
  const bounds = new Map<string, Box3>(), supports = new Map<string, Point[]>(), floors = new Map<string, number>(), assetStats = new Map<string, MetrologyAssetStats>()
  const shadowMeshes = new Map<string, Mesh>(), placeholders = new Map<string, Mesh>()
  const layoutAdjusted: string[] = []
  let loaded = false, disposed = false, loadError: string | null = null, loading: Promise<void> | undefined
  let tier: 'full' | 'lite' = 'full', interactionCount = 0, fullTriangles = 0, liteTriangles = 0
  let frozen = false, measurementHidden = false
  const abort = new AbortController()
  const track = (mat: Material) => { mat.visible = !measurementHidden; materials.add(mat); return mat }
  const ownMesh = (geometry: BufferGeometry, material: Material) => { geometries.add(geometry); track(material); return new Mesh(geometry, material) }
  const fallback = track(new MeshStandardMaterial({ color: 0x62676b, metalness: .8, roughness: .3 }))
  // Analytic soft capsule used until the real silhouette is ready (and when no GLB loads).
  const rgba = new Uint8Array(64 * 32 * 4)
  for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
    const u = (x + .5) / 32 - 1, v = (y + .5) / 16 - 1, d = Math.hypot(Math.max(0, Math.abs(u) - .6) / .4, v)
    rgba[(y * 64 + x) * 4 + 3] = Math.round(95 * Math.pow(Math.max(0, 1 - d), 1.5))
  }
  const shadowTex = new DataTexture(rgba, 64, 32, RGBAFormat); shadowTex.needsUpdate = true; textures.add(shadowTex)
  const shadowMaterial = (map: Texture) => track(new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }))
  const genericShadow = shadowMaterial(shadowTex)

  const poly = (p: InteractivePropState, x = p.x, y = p.y, t = p.theta, pad = 0) => boxPolygon(p.box, x, y, t, pad)
  const safe = (shape: Point[], except?: InteractivePropState) => onPlate(shape) && !intersects(shape, KEEP_OUT) && props.every(q => q === except || !intersects(shape, q.shape))

  for (const e of METROLOGY_LAYOUT) {
    const root = new Group(), visual = new Group(); root.name = 'prop-' + e.id; visual.name = 'metrology-visual'; root.add(visual)
    const [bx0, bx1, by0, by1] = e.box
    const proxy = ownMesh(new BoxGeometry(bx1 - bx0, by1 - by0, .002), fallback)
    proxy.position.set((bx0 + bx1) / 2, (by0 + by1) / 2, .001); proxy.name = 'loading-proxy'; visual.add(proxy); placeholders.set(e.id, proxy)
    const shadow = ownMesh(new PlaneGeometry(bx1 - bx0 + SHADOW_MARGIN * 2, by1 - by0 + SHADOW_MARGIN * 2), genericShadow)
    shadow.position.set((bx0 + bx1) / 2, (by0 + by1) / 2, .00005); shadow.name = 'contact-AO'; shadow.renderOrder = 0; root.add(shadow); shadowMeshes.set(e.id, shadow)
    const p: InteractivePropState = {
      id: e.id, kind: e.kind, root, rollerMesh: visual, homeX: e.x, homeY: e.y, homeTheta: e.theta, radius: e.radius,
      interactionRadius: .03, mass: e.kind === 'fixture' ? 8 : e.kind === 'slider' ? 1.5 : .5,
      maxOffset: e.kind === 'fixture' ? .006 : .055, maxYaw: e.kind === 'fixture' ? .04 : e.kind === 'slider' ? .5 : .7,
      box: e.box, reach: boxReach(e.box), x: e.x, y: e.y, theta: e.theta, vx: 0, vy: 0, vTheta: 0, rollAngle: 0, lastShockFracture: 0, shape: [], asleep: false,
    }
    if (!safe(poly(p))) {
      // Authored poses are valid (unit-tested); this nearest-valid search only guards against future layout edits.
      let found = false
      for (let ring = 1; ring <= 90 && !found; ring++) for (let n = 0; n < 72; n++) {
        const a = n * Math.PI / 36, nx = e.x + ring * .002 * Math.cos(a), ny = e.y + ring * .002 * Math.sin(a)
        if (safe(poly(p, nx, ny))) { p.x = p.homeX = nx; p.y = p.homeY = ny; found = true; layoutAdjusted.push(e.id); break }
      }
      if (!found) layoutAdjusted.push(e.id + ':unplaced')
    }
    p.shape = poly(p); props.push(p); group.add(root)
  }
  const sync = (p: InteractivePropState) => {
    p.root.position.set(p.x, p.y, deskZ); p.root.rotation.z = p.theta
    p.rollerMesh.rotation.x = p.kind === 'roller' ? p.rollAngle : 0
    // Roll about the true cylinder axis (inner offset puts it at the visual origin), then rest on the lowest vertex.
    const profile = supports.get(p.id)
    if (profile && p.kind === 'roller') {
      const s = Math.sin(p.rollAngle), c = Math.cos(p.rollAngle)
      let z = Infinity
      for (const [y, zr] of profile) z = Math.min(z, y * s + zr * c)
      p.rollerMesh.position.z = -z
    } else if (floors.has(p.id)) p.rollerMesh.position.z = -floors.get(p.id)!
  }
  props.forEach(sync)

  function step(dt: number) {
    dt = Math.min(.033, Math.max(0, Number.isFinite(dt) ? dt : 0))
    for (const p of props) {
      if (p.asleep) continue
      const damping = p.kind === 'roller' ? 3.4 : p.kind === 'slider' ? 7.2 : 12
      p.vx = clamp((p.vx - (p.x - p.homeX) * 2 * dt) * Math.exp(-damping * dt), .15)
      p.vy = clamp((p.vy - (p.y - p.homeY) * 2 * dt) * Math.exp(-damping * dt), .15)
      p.vTheta = clamp((p.vTheta - (p.theta - p.homeTheta) * 3 * dt) * Math.exp(-8 * dt), 1)
      // Settled props sleep (no polygon work) until an impulse wakes them.
      if (Math.abs(p.vx) < 1e-4 && Math.abs(p.vy) < 1e-4 && Math.abs(p.vTheta) < 2e-4 && Math.hypot(p.x - p.homeX, p.y - p.homeY) < 5e-5 && Math.abs(p.theta - p.homeTheta) < 2e-4) { p.vx = p.vy = p.vTheta = 0; p.asleep = true; continue }
      const dx = p.vx * dt, dy = p.vy * dt, da = p.vTheta * dt
      // Convex swept envelope: both end poses grown by the arc sagitta of the farthest corner.
      const pad = p.reach * (1 - Math.cos(Math.abs(da) / 2)) + 1e-6
      const swept = hull([...poly(p, p.x, p.y, p.theta, pad), ...poly(p, p.x + dx, p.y + dy, p.theta + da, pad)])
      if (Math.hypot(p.x + dx - p.homeX, p.y + dy - p.homeY) <= p.maxOffset && Math.abs(p.theta + da - p.homeTheta) <= p.maxYaw && safe(swept, p)) {
        p.x += dx; p.y += dy; p.theta += da; p.shape = poly(p)
        if (p.kind === 'roller') p.rollAngle -= (-Math.sin(p.theta) * dx + Math.cos(p.theta) * dy) / p.radius
      } else { p.vx = 0; p.vy = 0; p.vTheta = 0 }
      sync(p)
    }
  }
  const impulse = (p: InteractivePropState, x: number, y: number, t = 0) => {
    if (![x, y, t].every(Number.isFinite)) return false
    p.vx += clamp(x, .15) / p.mass; p.vy += clamp(y, .15) / p.mass; p.vTheta += clamp(t, 1) / p.mass; p.asleep = false; interactionCount++; return true
  }
  const raycaster = new Raycaster(), inverse = new Matrix4(), origin = new Vector3(), direction = new Vector3(), pointer = new Vector2()
  let pending = false, lastCursorLocal: [number, number] | null = null
  const onPointerMove = (x: number, y: number) => { if (!disposed && Number.isFinite(x) && Number.isFinite(y)) { pointer.set(x, y); pending = true } }
  const nudgeProp = (id: string, x: number, y: number, t = 0) => {
    const p = props.find(q => q.id === id)
    if (disposed || frozen || !p) return false
    const ok = impulse(p, x, y, t); if (ok) step(1 / 60); return ok
  }
  const freezeAtHome = () => {
    for (const p of props) { p.x = p.homeX; p.y = p.homeY; p.theta = p.homeTheta; p.vx = p.vy = p.vTheta = 0; p.rollAngle = 0; p.asleep = true; p.shape = poly(p); sync(p) }
    pending = false; lastCursorLocal = null
  }
  const setTierVisibility = () => group.traverse(o => { if (o.name.startsWith('detail-')) o.visible = tier === 'full' })
  const update = (frame: DrawingFrameInput, context: ExtractionContext, camera: Camera) => {
    if (disposed) return
    group.matrix.copy(context.sheetMatrix); group.matrixWorldNeedsUpdate = true
    group.visible = frame.proofMode !== 'drawing-edges' && (frame.retirement < 1 || frame.reducedMotion) && (frame.surroundingsOpacity ?? 1) > .01
    const nextTier = frame.tier === 'full' ? 'full' : 'lite'
    if (nextTier !== tier) { tier = nextTier; setTierVisibility() }
    // Reduced motion: props rest exactly at their authored home pose, no cursor, shockwave or leash dynamics.
    if (frame.reducedMotion && !frozen) { frozen = true; freezeAtHome() } else if (!frame.reducedMotion) frozen = false
    if (!group.visible || frozen) return
    for (const p of props) {
      const f = frame.intro.fracture
      if (f > .04 && p.lastShockFracture <= .04) { const d = Math.hypot(p.x, p.y) || 1; impulse(p, p.x / d * .03, p.y / d * .03, .12) }
      p.lastShockFracture = f
    }
    if (pending) {
      pending = false; raycaster.setFromCamera(pointer, camera); inverse.copy(context.sheetMatrix).invert()
      origin.copy(raycaster.ray.origin).applyMatrix4(inverse); direction.copy(raycaster.ray.direction).transformDirection(inverse)
      const t = (deskZ - origin.z) / direction.z
      if (Number.isFinite(t) && t > 0 && t < 8) {
        const x = origin.x + t * direction.x, y = origin.y + t * direction.y
        const dx = lastCursorLocal ? clamp(x - lastCursorLocal[0], .05) : 0, dy = lastCursorLocal ? clamp(y - lastCursorLocal[1], .05) : 0
        lastCursorLocal = [x, y]
        for (const p of props) {
          const d = pointBoxDistance(x, y, p.box, p.x, p.y, p.theta)
          if (d < p.interactionRadius) {
            const f = 1 - d / p.interactionRadius
            impulse(p, (dx + (p.x - x) * .2) * f, (dy + (p.y - y) * .2) * f, ((x - p.x) * dy - (y - p.y) * dx) * 15 * f)
          }
        }
      }
    }
    step(frame.delta)
  }

  const setMeasurementHidden = (hidden: boolean) => { measurementHidden = hidden; for (const m of materials) m.visible = !hidden }

  // ---- loading -------------------------------------------------------------------------------------------------
  const disposeOwned = (geos: Iterable<BufferGeometry>, mats: Iterable<Material>, texs: Iterable<Texture>) => {
    for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); for (const t of texs) t.dispose()
  }
  function collectScene(scene: Object3D) {
    const geos = new Set<BufferGeometry>(), mats = new Set<Material>(), texs = new Set<Texture>()
    scene.traverse(o => {
      if (!(o instanceof Mesh)) return
      geos.add(o.geometry)
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) { mats.add(m); for (const value of Object.values(m)) if (value instanceof Texture) texs.add(value) }
    })
    return { geos, mats, texs }
  }
  function prepare(p: InteractivePropState, node: Object3D): Prepared {
    const inner = new Group(), corrected = new Group()
    corrected.rotation.x = Math.PI / 2; corrected.add(node)
    inner.position.z = -p.radius; inner.add(corrected); inner.updateMatrixWorld(true)
    const box = new Box3(), v = new Vector3(), pts: Point[] = [], xyz: number[] = [], index: number[] = []
    const stats: MetrologyAssetStats = { triangles: 0, detailTriangles: 0, drawCalls: 0, materials: [] }
    const names = new Set<string>()
    let minZ = Infinity, radial = 0
    const [bx0, bx1, by0, by1] = p.box, matrix = new Matrix4()
    corrected.updateMatrixWorld(true)
    corrected.traverse(o => {
      if (!(o instanceof Mesh)) return
      const position = o.geometry.getAttribute('position'), count = o.geometry.index?.count ?? position.count
      matrix.copy(o.matrixWorld); matrix.premultiply(inner.matrixWorld.clone().invert()) // asset frame relative to the unshifted visual origin
      stats.drawCalls++; stats.triangles += count / 3; if (o.name.startsWith('detail-')) stats.detailTriangles += count / 3
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) names.add(m.name)
      const base = xyz.length / 3
      for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i).applyMatrix4(matrix)
        const zr = v.z - p.radius   // height of the vertex relative to the cylinder axis (rollers) or the table
        minZ = Math.min(minZ, v.z); box.expandByPoint(v)
        xyz.push(v.x, v.y, v.z)
        if (p.kind === 'roller') {
          radial = Math.max(radial, Math.hypot(v.y, zr)); pts.push([v.y, zr])
          if (v.x < bx0 - ASSET_TOLERANCE || v.x > bx1 + ASSET_TOLERANCE) throw new Error('Asset exceeds footprint: ' + p.id)
        } else if (v.x < bx0 - ASSET_TOLERANCE || v.x > bx1 + ASSET_TOLERANCE || v.y < by0 - ASSET_TOLERANCE || v.y > by1 + ASSET_TOLERANCE) throw new Error('Asset exceeds footprint: ' + p.id)
      }
      if (o.geometry.index) for (let i = 0; i < o.geometry.index.count; i++) index.push(base + o.geometry.index.getX(i))
      else for (let i = 0; i < position.count; i++) index.push(base + i)
    })
    if (!Number.isFinite(minZ)) throw new Error('Asset has no geometry: ' + p.id)
    if (minZ < -.0001) throw new Error('Asset below the table plane: ' + p.id)
    if (p.kind === 'roller' && radial > Math.max(Math.abs(by0), Math.abs(by1)) + ASSET_TOLERANCE) throw new Error('Asset exceeds roll envelope: ' + p.id)
    stats.materials = [...names].sort()
    return { p, node, corrected, inner, bounds: box, minZ, support: p.kind === 'roller' ? hull(pts) : null, stats, shadow: rasterizeContactShadow(xyz, index, p.box) }
  }
  const startLoading = (onLoaded?: () => void): Promise<void> => {
    if (disposed) return Promise.resolve()
    if (loading) return loading
    loading = (async () => {
      const draco = new DRACOLoader(); draco.setDecoderPath(import.meta.env.BASE_URL + 'draco/')
      let owned: ReturnType<typeof collectScene> | null = null
      let committed = false
      try {
        const response = await fetch(import.meta.env.BASE_URL + 'models/metrology-tools.glb', { signal: abort.signal })
        if (!response.ok) throw new Error('Metrology HTTP ' + response.status)
        const data = await response.arrayBuffer(); if (disposed) return
        const gltf = await new GLTFLoader().setDRACOLoader(draco).parseAsync(data, '')
        owned = collectScene(gltf.scene)
        if (disposed) return
        // Phase 1: validate everything without touching live state, so a bad asset leaves clean proxies.
        const prepared = props.map(p => {
          const node = gltf.scene.getObjectByName(p.id)
          if (!node) throw new Error('Missing asset root ' + p.id)
          return prepare(p, node)
        })
        // Phase 2: finish maps, second UV set, shaped shadows; then commit.
        const maps = createMicroTextures(); textures.add(maps.normal); textures.add(maps.roughness)
        const newShadows: Array<[Prepared, DataTexture]> = prepared.map(item => [item, rasterTexture(item.shadow)])
        for (const t of newShadows) textures.add(t[1])
        for (const m of owned.mats) finishMaterial(m, maps)
        for (const g of owned.geos) addMicroUv(g)
        for (const g of owned.geos) geometries.add(g)
        for (const m of owned.mats) track(m)
        for (const t of owned.texs) textures.add(t)
        fullTriangles = 0; liteTriangles = 0
        for (const [item, shadowTexture] of newShadows) {
          const { p } = item
          const proxy = placeholders.get(p.id)
          if (proxy) { p.rollerMesh.remove(proxy); proxy.geometry.dispose(); geometries.delete(proxy.geometry); placeholders.delete(p.id) }
          p.rollerMesh.add(item.inner)
          bounds.set(p.id, new Box3(new Vector3(item.bounds.min.x, item.bounds.min.y, item.minZ), item.bounds.max.clone()))
          floors.set(p.id, p.kind === 'roller' ? 0 : item.minZ)
          if (item.support) supports.set(p.id, item.support)
          assetStats.set(p.id, item.stats)
          fullTriangles += item.stats.triangles; liteTriangles += item.stats.triangles - item.stats.detailTriangles
          const shadow = shadowMeshes.get(p.id)!
          shadow.geometry.dispose(); geometries.delete(shadow.geometry)
          shadow.geometry = new PlaneGeometry(item.shadow.w, item.shadow.h); geometries.add(shadow.geometry)
          shadow.position.set(item.shadow.x0 + item.shadow.w / 2, item.shadow.y0 + item.shadow.h / 2, .00005)
          shadow.material = shadowMaterial(shadowTexture)
          sync(p)
        }
        committed = true
        setTierVisibility()
        loaded = true; onLoaded?.()
      } catch (e) {
        if (!disposed) loadError = e instanceof Error ? e.message : String(e)
      } finally {
        draco.dispose()
        // Anything parsed but never committed (late parse after dispose, or a validation failure) is released now.
        if (owned && !committed) disposeOwned(owned.geos, owned.mats, owned.texs)
      }
    })()
    return loading
  }
  const snapshot = (): MetrologyWorkbenchTelemetry => {
    const violations: string[] = []
    for (let i = 0; i < props.length; i++) {
      const p = props[i], shape = p.shape
      if (!onPlate(shape)) violations.push(p.id + ':plate')
      if (intersects(shape, KEEP_OUT)) violations.push(p.id + ':drawing')
      for (let j = 0; j < i; j++) if (intersects(shape, props[j].shape)) violations.push(p.id + ':' + props[j].id)
      const b = bounds.get(p.id); if (b && b.min.z < -.0001) violations.push(p.id + ':z')
    }
    return {
      visible: group.visible, loaded, loadError, disposed, lastCursorLocal, interactionCount,
      assetTriangles: fullTriangles, liteTriangles, visibleTriangles: tier === 'full' ? fullTriangles : liteTriangles,
      tier, awakeProps: props.filter(p => !p.asleep).length, frozen, measurementHidden, layoutAdjusted: [...layoutAdjusted], violations,
      props: props.map(p => {
        const b = bounds.get(p.id)
        return { id: p.id, kind: p.kind, position: [p.x, p.y, deskZ], rotationZ: p.theta, rollAngle: p.rollAngle, displacedMm: Math.hypot(p.x - p.homeX, p.y - p.homeY) * 1000,
          footprint: p.shape.map(v => [v[0], v[1]] as Point), localBounds: b ? { min: b.min.toArray(), max: b.max.toArray() } : null, asset: assetStats.get(p.id) ?? null }
      }),
    }
  }
  const dispose = () => {
    if (disposed) return
    disposed = true; abort.abort(); group.removeFromParent(); group.clear()
    disposeOwned(geometries, materials, textures)
    geometries.clear(); materials.clear(); textures.clear(); bounds.clear(); supports.clear(); floors.clear(); assetStats.clear(); shadowMeshes.clear(); placeholders.clear()
  }
  return { group, props, startLoading, onPointerMove, nudgeProp, setMeasurementHidden, update, snapshot, dispose }
}
