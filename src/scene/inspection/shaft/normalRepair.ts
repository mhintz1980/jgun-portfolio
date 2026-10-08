import { BufferGeometry, Float32BufferAttribute, Matrix3, Matrix4, Vector3 } from 'three'

/**
 * JG-035 S3 (owner revision 2026-10-07) — smooth shading for the CAD shaft meshes.
 *
 * Diagnosis (single-factor captures at 1.3 / 10.9 / 25.4 s, evidence `diag-s3/`): the streaks and lumpy
 * relief groove come from the STORED vertex normals of the exported shaft meshes, not from the geometry or
 * the material. The legacy shaft has ~12.7k triangles of which ~23 % are slivers (aspect > 20) and ~1.1k
 * vertices whose stored normal sits ≥ 15° off every adjacent face; interpolated across a sliver fan those
 * normals paint bright streaks onto a polished cylinder. Flat shading shows clean facets, recomputed
 * normals remove the streaks, a rough material merely hides them.
 *
 * Repair: de-index, weld by position, and give every triangle corner the ANGLE-weighted average of the face
 * normals of all faces at that welded position that lie within `creaseDeg` of the corner's own face. Angle
 * weights (not area) so slivers cannot dominate; the crease test keeps genuinely sharp edges (tooth tips,
 * shoulders, the groove walls) crisp while curved surfaces blend. Pure and deterministic; run once at load.
 *
 * Surfaces of revolution (the journals, shoulders and fillets that dominate this part) get one more step when
 * an `axisFrame` is supplied: a corner whose blended normal already points roughly radially has its AZIMUTH
 * snapped to the corner's own radial direction (keeping the axial tilt), so a sliver's chord-direction face
 * normal can never twist the highlight around the cylinder. Tooth flanks and flats face tangentially and are
 * left alone.
 */
export interface NormalRepairReport {
  triangles: number
  degenerate: number
  /** Largest angle (degrees) between a repaired normal and the stored one. */
  maxChangeDeg: number
  /** Corners whose normal moved by more than 15°. */
  changedCorners: number
}

const WELD = 1e7

const SNAP_DEG = 25

export function creasedNormals(source: BufferGeometry, creaseDeg = 40, axisFrame?: Matrix4): { geometry: BufferGeometry; report: NormalRepairReport } {
  const geometry = source.index ? source.toNonIndexed() : source.clone()
  const position = geometry.getAttribute('position')
  const stored = geometry.getAttribute('normal')
  const triangles = Math.floor(position.count / 3)
  const faceNormal = new Float32Array(triangles * 3)
  const cornerAngle = new Float32Array(triangles * 3)
  const keyOf = (i: number) => `${Math.round(position.getX(i) * WELD)},${Math.round(position.getY(i) * WELD)},${Math.round(position.getZ(i) * WELD)}`
  const groups = new Map<string, number[]>()
  let degenerate = 0
  for (let t = 0; t < triangles; t++) {
    const a = t * 3, b = a + 1, c = a + 2
    const ux = position.getX(b) - position.getX(a), uy = position.getY(b) - position.getY(a), uz = position.getZ(b) - position.getZ(a)
    const vx = position.getX(c) - position.getX(a), vy = position.getY(c) - position.getY(a), vz = position.getZ(c) - position.getZ(a)
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    const length = Math.hypot(nx, ny, nz)
    if (length < 1e-18) { degenerate++; continue }
    nx /= length; ny /= length; nz /= length
    faceNormal[t * 3] = nx; faceNormal[t * 3 + 1] = ny; faceNormal[t * 3 + 2] = nz
    for (let corner = 0; corner < 3; corner++) {
      const p = t * 3 + corner, q = t * 3 + ((corner + 1) % 3), r = t * 3 + ((corner + 2) % 3)
      const e1x = position.getX(q) - position.getX(p), e1y = position.getY(q) - position.getY(p), e1z = position.getZ(q) - position.getZ(p)
      const e2x = position.getX(r) - position.getX(p), e2y = position.getY(r) - position.getY(p), e2z = position.getZ(r) - position.getZ(p)
      const l1 = Math.hypot(e1x, e1y, e1z), l2 = Math.hypot(e2x, e2y, e2z)
      const cos = l1 > 0 && l2 > 0 ? (e1x * e2x + e1y * e2y + e1z * e2z) / (l1 * l2) : 1
      cornerAngle[p] = Math.acos(Math.max(-1, Math.min(1, cos)))
      const key = keyOf(p)
      const list = groups.get(key)
      if (list) list.push(p); else groups.set(key, [p])
    }
  }
  const cosCrease = Math.cos((creaseDeg * Math.PI) / 180)
  const out = new Float32Array(position.count * 3)
  if (stored) for (let i = 0; i < position.count; i++) { out[i * 3] = stored.getX(i); out[i * 3 + 1] = stored.getY(i); out[i * 3 + 2] = stored.getZ(i) } // zero-area triangles keep theirs
  let maxChangeDeg = 0, changedCorners = 0
  for (const list of groups.values()) {
    for (const corner of list) {
      const t = Math.floor(corner / 3)
      const fx = faceNormal[t * 3], fy = faceNormal[t * 3 + 1], fz = faceNormal[t * 3 + 2]
      let sx = 0, sy = 0, sz = 0
      for (const other of list) {
        const u = Math.floor(other / 3)
        const gx = faceNormal[u * 3], gy = faceNormal[u * 3 + 1], gz = faceNormal[u * 3 + 2]
        if (fx * gx + fy * gy + fz * gz < cosCrease) continue
        const w = cornerAngle[other]
        sx += gx * w; sy += gy * w; sz += gz * w
      }
      const length = Math.hypot(sx, sy, sz)
      if (length < 1e-12) { sx = fx; sy = fy; sz = fz } else { sx /= length; sy /= length; sz /= length }
      out[corner * 3] = sx; out[corner * 3 + 1] = sy; out[corner * 3 + 2] = sz
      if (stored) {
        const dot = sx * stored.getX(corner) + sy * stored.getY(corner) + sz * stored.getZ(corner)
        const change = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI
        if (change > maxChangeDeg) maxChangeDeg = change
        if (change > 15) changedCorners++
      }
    }
  }
  if (axisFrame) snapRevolved(position, out, axisFrame)
  geometry.setAttribute('normal', new Float32BufferAttribute(out, 3))
  return { geometry, report: { triangles, degenerate, maxChangeDeg, changedCorners } }
}

/** `axisFrame` maps geometry space to a frame whose +Y axis through the origin is the part axis. */
function snapRevolved(position: BufferGeometry['attributes'][string], out: Float32Array, axisFrame: Matrix4): void {
  const rotation = new Matrix3().setFromMatrix4(axisFrame)
  const inverse = new Matrix3().copy(rotation).invert()
  const cosSnap = Math.cos((SNAP_DEG * Math.PI) / 180)
  const point = new Vector3(), normal = new Vector3()
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).applyMatrix4(axisFrame)
    const radius = Math.hypot(point.x, point.z)
    if (radius < 1e-9) continue
    normal.set(out[i * 3], out[i * 3 + 1], out[i * 3 + 2]).applyMatrix3(rotation)
    const horizontal = Math.hypot(normal.x, normal.z)
    if (horizontal < 1e-6) continue
    const cos = (normal.x * point.x + normal.z * point.z) / (horizontal * radius)
    if (cos < cosSnap) continue
    normal.set((point.x / radius) * horizontal, normal.y, (point.z / radius) * horizontal).normalize().applyMatrix3(inverse).normalize()
    out[i * 3] = normal.x; out[i * 3 + 1] = normal.y; out[i * 3 + 2] = normal.z
  }
}
