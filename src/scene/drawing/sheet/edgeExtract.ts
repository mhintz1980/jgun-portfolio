import {
  Color,
  DoubleSide,
  Float32BufferAttribute,
  BufferGeometry,
  Matrix4,
  Mesh,
  OrthographicCamera,
  Plane,
  Scene,
  ShaderMaterial,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three'

/**
 * VECTOR LINEWORK FROM THE GLB (JG-035 rebuild).
 *
 * The old sheet baked every view into one 1-px raster, so the print had a single line weight
 * and went soft the moment the camera came close. This module turns the live model into real
 * drafting linework instead:
 *
 *   1. `buildEdgeSet`  — one pass over the merged rest-pose triangles. Edges are welded by a
 *      quantized position hash and classified once: creases (dihedral > CREASE_DEG), open
 *      boundaries, and "smooth" edges that keep both face normals so each view can pick its
 *      own silhouettes (a cylinder has no crease at its profile).
 *   2. `extractView`   — per view: silhouettes = smooth edges whose two faces disagree about
 *      facing the viewer. Hidden-line removal samples an orthographic depth render of the same
 *      view, so a line is kept only where it is the nearest surface.
 *
 * Output is plain segment arrays in sheet-plane metres; weights are assigned by the caller.
 */

const CREASE_DEG = 34
const QUANT = 1e-5

export interface EdgeSet {
  /** Crease + boundary edges, 6 floats each (model space). */
  hard: Float32Array
  /** Smooth edges, 6 floats each, plus both face normals (6 floats) for silhouette tests. */
  smooth: Float32Array
  smoothNormals: Float32Array
  triangles: number
}

export function buildEdgeSet(position: Float32Array): EdgeSet {
  const triCount = position.length / 9
  const ids = new Int32Array(triCount * 3)
  const weld = new Map<number, number>()
  let next = 0
  for (let v = 0; v < triCount * 3; v += 1) {
    const qx = Math.round(position[v * 3] / QUANT) + 131072
    const qy = Math.round(position[v * 3 + 1] / QUANT) + 131072
    const qz = Math.round(position[v * 3 + 2] / QUANT) + 131072
    const key = (qx * 262144 + qy) * 262144 + qz
    let id = weld.get(key)
    if (id === undefined) {
      id = next++
      weld.set(key, id)
    }
    ids[v] = id
  }
  weld.clear()
  const normals = new Float32Array(triCount * 3)
  const degenerate = new Uint8Array(triCount)
  for (let t = 0; t < triCount; t += 1) {
    const o = t * 9
    const ux = position[o + 3] - position[o], uy = position[o + 4] - position[o + 1], uz = position[o + 5] - position[o + 2]
    const vx = position[o + 6] - position[o], vy = position[o + 7] - position[o + 1], vz = position[o + 8] - position[o + 2]
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    const len = Math.hypot(nx, ny, nz)
    if (len < 1e-14) {
      degenerate[t] = 1
      continue
    }
    nx /= len; ny /= len; nz /= len
    normals[t * 3] = nx; normals[t * 3 + 1] = ny; normals[t * 3 + 2] = nz
  }
  const cosCrease = Math.cos((CREASE_DEG * Math.PI) / 180)
  // edge key -> first triangle (+1, negative once consumed by a second face)
  const edges = new Map<number, number>()
  const hard: number[] = []
  const smooth: number[] = []
  const smoothNormals: number[] = []
  const pushEdge = (out: number[], a: number, b: number) => {
    out.push(position[a * 3], position[a * 3 + 1], position[a * 3 + 2], position[b * 3], position[b * 3 + 1], position[b * 3 + 2])
  }
  const firstVertex = new Map<number, number>()
  for (let t = 0; t < triCount; t += 1) {
    if (degenerate[t]) continue
    for (let k = 0; k < 3; k += 1) {
      const va = t * 3 + k
      const vb = t * 3 + ((k + 1) % 3)
      const a = ids[va]
      const b = ids[vb]
      if (a === b) continue
      const key = a < b ? a * 4194304 + b : b * 4194304 + a
      const seen = edges.get(key)
      if (seen === undefined) {
        edges.set(key, t + 1)
        firstVertex.set(key, va * 4 + ((k + 1) % 3))
        continue
      }
      if (seen < 0) continue // non-manifold third face: already emitted
      edges.set(key, -1)
      const s = seen - 1
      const d = normals[s * 3] * normals[t * 3] + normals[s * 3 + 1] * normals[t * 3 + 1] + normals[s * 3 + 2] * normals[t * 3 + 2]
      if (d < cosCrease) pushEdge(hard, va, vb)
      else {
        pushEdge(smooth, va, vb)
        smoothNormals.push(normals[s * 3], normals[s * 3 + 1], normals[s * 3 + 2], normals[t * 3], normals[t * 3 + 1], normals[t * 3 + 2])
      }
      firstVertex.delete(key)
    }
  }
  // Open boundaries (edges seen by exactly one face) are real outlines on CAD tessellation.
  for (const [, packed] of firstVertex) {
    const va = Math.floor(packed / 4)
    const t = Math.floor(va / 3)
    const vb = t * 3 + (packed % 4)
    pushEdge(hard, va, vb)
  }
  return {
    hard: new Float32Array(hard),
    smooth: new Float32Array(smooth),
    smoothNormals: new Float32Array(smoothNormals),
    triangles: triCount,
  }
}

export interface ViewSpec {
  /** Model -> sheet plane (includes the view's scale and its placement on the sheet). */
  transform: Matrix4
  /** Sheet-plane rectangle the view owns: [x, y, w, h]. */
  rect: [number, number, number, number]
  /** Depth samples per sheet metre. */
  resolution: number
  /** Optional model-space clip: keep geometry where plane.distanceToPoint(p) >= 0. */
  clip?: Plane
}

export interface ViewLines {
  /** Visible silhouette/boundary outline segments, 4 floats each (sheet plane). */
  outline: Float32Array
  /** Visible interior crease segments, 4 floats each. */
  edges: Float32Array
}

const tmpA = new Vector3()
const tmpB = new Vector3()
const visBuffer = new Uint8Array(65)

/**
 * Orthographic depth of `geometry` through `view`, as linear sheet-plane z per pixel
 * (larger = nearer the viewer). Background is -Infinity.
 */
function depthField(
  gl: WebGLRenderer,
  geometry: BufferGeometry,
  view: ViewSpec,
): { z: Float32Array; w: number; h: number } {
  const [rx, ry, rw, rh] = view.rect
  const w = Math.max(8, Math.ceil(rw * view.resolution))
  const h = Math.max(8, Math.ceil(rh * view.resolution))
  const near = 0.01
  const far = 4
  const camera = new OrthographicCamera(rx, rx + rw, ry + rh, ry, near, far)
  camera.position.set(0, 0, 2)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  // Linear sheet-plane z, 24-bit fixed point over [-0.5, 0.5] m in RGB; alpha marks coverage.
  const material = new ShaderMaterial({
    clipping: true,
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      varying float vZ;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vZ = (modelMatrix * vec4(position, 1.0)).z;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      varying float vZ;
      void main() {
        #include <clipping_planes_fragment>
        float v = clamp(vZ + 0.5, 0.0, 0.999999) * 255.0;
        float r = floor(v); v = fract(v) * 255.0;
        float g = floor(v); v = fract(v) * 255.0;
        float b = floor(v);
        gl_FragColor = vec4(r / 255.0, g / 255.0, b / 255.0, 1.0);
      }`,
    side: DoubleSide,
  })
  if (view.clip) {
    // Clip in model space by transforming the plane into the sheet frame.
    material.clippingPlanes = [view.clip.clone().applyMatrix4(view.transform)]
  }
  const mesh = new Mesh(geometry, material)
  mesh.matrixAutoUpdate = false
  mesh.matrix.copy(view.transform)
  mesh.matrixWorld.copy(view.transform)
  const scene = new Scene()
  scene.add(mesh)
  const target = new WebGLRenderTarget(w, h, { depthBuffer: true })
  const previous = gl.getRenderTarget()
  const viewport = gl.getViewport(new Vector4())
  const clipping = gl.localClippingEnabled
  const clearAlpha = gl.getClearAlpha()
  gl.localClippingEnabled = true
  gl.setRenderTarget(target)
  gl.setViewport(0, 0, w, h)
  const clearColor = gl.getClearColor(new Color())
  gl.setClearColor(0x000000, 0)
  gl.clear()
  gl.render(scene, camera)
  const pixels = new Uint8Array(w * h * 4)
  gl.readRenderTargetPixels(target, 0, 0, w, h, pixels)
  gl.setRenderTarget(previous)
  gl.setViewport(viewport)
  gl.setClearColor(clearColor, clearAlpha)
  gl.localClippingEnabled = clipping
  target.dispose()
  material.dispose()
  const z = new Float32Array(w * h)
  for (let i = 0; i < w * h; i += 1) {
    if (pixels[i * 4 + 3] < 128) {
      z[i] = -Infinity
      continue
    }
    z[i] = pixels[i * 4] / 255 + pixels[i * 4 + 1] / 65025 + pixels[i * 4 + 2] / 16581375 - 0.5
  }
  return { z, w, h }
}

/**
 * Visible linework for one view. Samples along each candidate segment against the depth field;
 * a sample is visible when it is within `eps` of the nearest surface in a 3x3 neighbourhood
 * minimum (so silhouettes on depth steps survive, while lines behind a surface do not).
 */
export function extractView(gl: WebGLRenderer, geometry: BufferGeometry, edges: EdgeSet, view: ViewSpec): ViewLines {
  const field = depthField(gl, geometry, view)
  const [rx, ry, rw, rh] = view.rect
  const sx = field.w / rw
  const sy = field.h / rh
  const eps = 0.0006 * Math.abs(view.transform.getMaxScaleOnAxis())
  const inverse = view.transform.clone().invert()
  // Toward-viewer direction in model space.
  const toward = new Vector3(0, 0, 1).transformDirection(inverse)
  const minAround = (px: number, py: number): number => {
    let m = Infinity
    for (let dy = -1; dy <= 1; dy += 1) {
      const y = py + dy
      if (y < 0 || y >= field.h) continue
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = px + dx
        if (x < 0 || x >= field.w) continue
        const v = field.z[y * field.w + x]
        if (v < m) m = v
      }
    }
    return m
  }
  const visibleAt = (x: number, y: number, z: number): boolean => {
    const px = Math.floor((x - rx) * sx)
    const py = Math.floor((y - ry) * sy)
    if (px < 0 || py < 0 || px >= field.w || py >= field.h) return false
    return z >= minAround(px, py) - eps
  }
  const clip = view.clip
  const emit = (out: number[], src: Float32Array, i: number) => {
    tmpA.set(src[i], src[i + 1], src[i + 2])
    tmpB.set(src[i + 3], src[i + 4], src[i + 5])
    if (clip) {
      const da = clip.distanceToPoint(tmpA)
      const db = clip.distanceToPoint(tmpB)
      if (da < 0 && db < 0) return
      if (da < 0 || db < 0) {
        const t = da / (da - db)
        const cut = tmpA.clone().lerp(tmpB, t)
        if (da < 0) tmpA.copy(cut)
        else tmpB.copy(cut)
      }
    }
    tmpA.applyMatrix4(view.transform)
    tmpB.applyMatrix4(view.transform)
    const lenPx = Math.hypot((tmpB.x - tmpA.x) * sx, (tmpB.y - tmpA.y) * sy)
    const steps = Math.max(2, Math.min(64, Math.ceil(lenPx / 1.5)))
    for (let s = 0; s <= steps; s += 1) {
      const u = s / steps
      visBuffer[s] = visibleAt(
        tmpA.x + (tmpB.x - tmpA.x) * u,
        tmpA.y + (tmpB.y - tmpA.y) * u,
        tmpA.z + (tmpB.z - tmpA.z) * u,
      ) ? 1 : 0
    }
    // Hysteresis against depth-quantisation flicker (knurls, threads, grazing faces): bridge
    // hidden gaps of up to 2 samples (~3 px), then drop visible flecks shorter than 3 samples
    // unless they are the whole segment. Without this the HLR prints as dotted speckle.
    for (let s = 1; s < steps; s += 1) {
      if (visBuffer[s] || !visBuffer[s - 1]) continue
      let e = s
      while (e <= steps && !visBuffer[e]) e += 1
      if (e <= steps && e - s <= 2) for (let k = s; k < e; k += 1) visBuffer[k] = 1
      s = e
    }
    for (let s = 0; s <= steps; s += 1) {
      if (!visBuffer[s]) continue
      let e = s
      while (e <= steps && visBuffer[e]) e += 1
      if (e - s < 3 && !(s === 0 && e > steps)) for (let k = s; k < e; k += 1) visBuffer[k] = 0
      s = e
    }
    let runStart = -1
    for (let s = 0; s <= steps; s += 1) {
      const u = s / steps
      const vis = visBuffer[s] === 1
      if (vis && runStart < 0) runStart = u
      if ((!vis || s === steps) && runStart >= 0) {
        const end = vis ? u : (s - 0.5) / steps
        if (end - runStart > 1e-6) {
          out.push(
            tmpA.x + (tmpB.x - tmpA.x) * runStart,
            tmpA.y + (tmpB.y - tmpA.y) * runStart,
            tmpA.x + (tmpB.x - tmpA.x) * end,
            tmpA.y + (tmpB.y - tmpA.y) * end,
          )
        }
        runStart = -1
      }
    }
  }
  const outline: number[] = []
  const creases: number[] = []
  for (let i = 0; i < edges.hard.length; i += 6) emit(creases, edges.hard, i)
  const n = edges.smoothNormals
  for (let e = 0; e < edges.smooth.length / 6; e += 1) {
    const d1 = n[e * 6] * toward.x + n[e * 6 + 1] * toward.y + n[e * 6 + 2] * toward.z
    const d2 = n[e * 6 + 3] * toward.x + n[e * 6 + 4] * toward.y + n[e * 6 + 5] * toward.z
    if (d1 > 0 === d2 > 0) continue
    emit(outline, edges.smooth, e * 6)
  }
  return { outline: new Float32Array(outline), edges: new Float32Array(creases) }
}

/** Build a position-only BufferGeometry from a raw float array (helper for callers). */
export function geometryFrom(position: Float32Array): BufferGeometry {
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(position, 3))
}
