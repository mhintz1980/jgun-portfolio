// Independent reproduction of the 390x844 material-card collision and the proposed
// materials-hold camera change (2026-10-06). Written from the camera.ts composition
// law and the same-session saved live camera matrices; shares no code path with
// candidate_material_camera.mjs.
//
// A) Live-matrix control: decode legacyshaft Draco positions from the lite bundle,
//    filter shaft-local y 3.2..14.2 mm, apply the live group rotation
//    rotationZ(2*cutterPhi) recorded in the anchor telemetry, and project through the
//    saved live projection/world matrices. Must reproduce material-region-report.json
//    narrow failed-4140 critical_action_bounds.
// B) Camera-law control: rebuild the same camera from the camera.ts anchor law
//    (machine azimuth 20 deg, elevation 0.5 deg, distance 0.2 m, up shaft-local +Z,
//    fovNarrow 9.5, tgtNarrow [0,8.5,-2.8] mm) in glTF space via the documented single
//    conversion (x_g, y_g, z_g) = (x_s, z_s, -y_s). Must match A within tolerance,
//    proving the reconstruction convention against the live session.
// C) Candidate under the same law: fovNarrow 18.5, tgtNarrow [0,8.5,1] mm. Clearance
//    to the tallest measured failed-card bottom (4140/C300 y 339.96875) and the footer
//    top (y 529.5), 8 px floor, plus 8 percent safe-frame containment.
// D) Prior-script reconciliation: reproduce candidate_material_camera.mjs's own
//    orbital convention to confirm where its published numbers came from.
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import draco3d from 'draco3d'
import { Matrix4, PerspectiveCamera, Vector3 } from 'three'

const out = path.dirname(fileURLToPath(import.meta.url))
let root = out
while (!(await fs.stat(path.join(root, 'package.json')).then(() => true).catch(() => false))) root = path.dirname(root)
const sha = async (p) => createHash('sha256').update(await fs.readFile(p)).digest('hex')
const blockout = JSON.parse(await fs.readFile(path.join(out, 'report.json'), 'utf8'))
const region = JSON.parse(await fs.readFile(path.join(out, 'material-region-report.json'), 'utf8'))
const row = blockout.anchors.find((a) => a.layout === 'narrow' && a.name === 'failed-4140')
const litePath = path.join(root, 'public/models/manufacturing-core-lite.glb')

const bytes = await fs.readFile(litePath)
const jl = bytes.readUInt32LE(12)
const doc = JSON.parse(bytes.subarray(20, 20 + jl))
const node = doc.nodes.find((n) => n.name === 'legacyshaft')
const prim = doc.meshes[node.mesh].primitives[0]
const ext = prim.extensions.KHR_draco_mesh_compression
const bv = doc.bufferViews[ext.bufferView]
const start = 28 + jl + (bv.byteOffset ?? 0)
const data = bytes.subarray(start, start + bv.byteLength)
const dm = await draco3d.createDecoderModule({})
const decoder = new dm.Decoder()
const db = new dm.DecoderBuffer()
const mesh = new dm.Mesh()
db.Init(new Int8Array(data), data.length)
decoder.DecodeBufferToMesh(db, mesh)
const attr = decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION)
const values = new dm.DracoFloat32Array()
decoder.GetAttributeFloatForAllPoints(mesh, attr, values)
const rot = new Matrix4().makeRotationZ(2 * row.telemetry.shaft.cutter.rotation)
const critical = []
for (let i = 0; i < mesh.num_points(); i++) {
  const v = new Vector3(values.GetValue(i * 3), values.GetValue(i * 3 + 1), values.GetValue(i * 3 + 2))
  const yShaft = -v.z * 1000
  if (yShaft >= 3.2 && yShaft <= 14.2) critical.push(v.applyMatrix4(rot))
}
dm.destroy(values); dm.destroy(mesh); dm.destroy(db); dm.destroy(decoder)

const W = row.viewport[0], H = row.viewport[1]
const project = (cam) => {
  const tmp = new Vector3()
  let min = [Infinity, Infinity], max = [-Infinity, -Infinity], ndcMax = 0
  for (const p of critical) {
    tmp.copy(p).project(cam)
    const px = ((tmp.x + 1) * W) / 2, py = ((1 - tmp.y) * H) / 2
    min = [Math.min(min[0], px), Math.min(min[1], py)]
    max = [Math.max(max[0], px), Math.max(max[1], py)]
    ndcMax = Math.max(ndcMax, Math.abs(tmp.x), Math.abs(tmp.y))
  }
  return { min, max, ndc_max_abs: ndcMax, vertices: critical.length }
}
const delta = (a, b) => Math.max(
  Math.abs(a.min[0] - b.min[0]), Math.abs(a.min[1] - b.min[1]),
  Math.abs(a.max[0] - b.max[0]), Math.abs(a.max[1] - b.max[1]))

// A) live saved matrices, applied manually (view-projection composition)
const liveWorld = new Matrix4().fromArray(row.camera.world)
const liveProj = new Matrix4().fromArray(row.camera.projection)
const A = (() => {
  const inv = new Matrix4().copy(liveWorld).invert()
  const tmp = new Vector3()
  let min = [Infinity, Infinity], max = [-Infinity, -Infinity], ndcMax = 0
  for (const p of critical) {
    tmp.copy(p).applyMatrix4(inv).applyMatrix4(liveProj)
    const px = ((tmp.x + 1) * W) / 2, py = ((1 - tmp.y) * H) / 2
    min = [Math.min(min[0], px), Math.min(min[1], py)]
    max = [Math.max(max[0], px), Math.max(max[1], py)]
    ndcMax = Math.max(ndcMax, Math.abs(tmp.x), Math.abs(tmp.y))
  }
  return { min, max, ndc_max_abs: ndcMax, vertices: critical.length }
})()

// B/C) camera.ts law reconstruction. Shaft-local: p = t + dist*(ce*cos az, sin el, ce*sin az).
const toGltf = (v) => new Vector3(v.x, v.z, -v.y)
const lawCamera = (fov, tgtMM) => {
  const az = (20 * Math.PI) / 180, el = (0.5 * Math.PI) / 180, dist = 0.2
  const t = new Vector3(tgtMM[0], tgtMM[1], tgtMM[2]).multiplyScalar(1e-3)
  const pos = new Vector3(
    t.x + dist * Math.cos(el) * Math.cos(az),
    t.y + dist * Math.sin(el),
    t.z + dist * Math.cos(el) * Math.sin(az))
  const cam = new PerspectiveCamera(fov, W / H, 0.005, 150)
  cam.position.copy(toGltf(pos))
  cam.up.copy(toGltf(new Vector3(0, 0, 1)))
  cam.lookAt(toGltf(t))
  cam.updateMatrixWorld(true)
  return cam
}
const B = project(lawCamera(9.5, [0, 8.5, -2.8]))
const C = project(lawCamera(18.5, [0, 8.5, 1]))

// D) prior candidate script convention (its glTF offset uses sin(el) in the azimuth slot)
const priorCamera = (fov, tgtMM) => {
  const az = (20 * Math.PI) / 180, el = (0.5 * Math.PI) / 180, dist = 0.2
  const tG = new Vector3(0, tgtMM[2] / 1000, -tgtMM[1] / 1000)
  const cam = new PerspectiveCamera(fov, W / H, 0.005, 150)
  cam.position.copy(tG).add(new Vector3(dist * Math.cos(el) * Math.cos(az), dist * Math.cos(el) * Math.sin(el), -dist * Math.sin(el)))
  cam.up.set(0, 1, 0)
  cam.lookAt(tG)
  cam.updateMatrixWorld(true)
  return cam
}
const D = project(priorCamera(18.5, [0, 8.5, 1]))

const measured = region.rows.find((r) => r.layout === 'narrow' && r.name === 'failed-4140').critical_action_bounds
const cardBottom = Math.max(row.dom.card.max[1], 339.96875)
const footerTop = row.dom.footer.min[1]
const result = {
  schema: 1,
  generated_utc: new Date().toISOString(),
  method: 'Independent Draco decode of manufacturing-core-lite.glb legacyshaft; shaft-local y 3.2..14.2 mm band; live group rotationZ(2*cutterPhi) from anchor telemetry; projections cross-validated against the same-session saved live camera matrices before evaluating the candidate under the camera.ts composition law.',
  inputs: {
    'public/models/manufacturing-core-lite.glb': await sha(litePath),
    'src/scene/inspection/shaft/camera.ts': await sha(path.join(root, 'src/scene/inspection/shaft/camera.ts')),
    'camera/blockout-2026-10-06/report.json': await sha(path.join(out, 'report.json')),
    'camera/blockout-2026-10-06/material-region-report.json': await sha(path.join(out, 'material-region-report.json')),
  },
  source_note: 'camera.ts hash must equal the blockout-session source dda15941... recorded in report.json input_hashes (pre-fix).',
  critical_band_vertices: critical.length,
  live_rotation_rad: row.telemetry.shaft.cutter.rotation * 2,
  A_live_matrices: A,
  A_vs_measured_region_report_max_px: +delta(A, measured).toFixed(6),
  B_camera_law_current_anchor: B,
  B_vs_A_max_px: +delta(B, A).toFixed(6),
  C_camera_law_candidate: C,
  C_clearance: {
    card_bottom_px: cardBottom,
    card_clearance_px: +(C.min[1] - cardBottom).toFixed(4),
    footer_top_px: footerTop,
    footer_clearance_px: +(footerTop - C.max[1]).toFixed(4),
    margin_floor_px: 8,
  },
  D_prior_script_convention: D,
  D_vs_published_candidate_max_px: +delta(D, { min: [124.47674765509201, 352.46180715361044], max: [251.58014814530893, 516.1410830139212] }).toFixed(6),
  pass: false,
}
result.pass = result.A_vs_measured_region_report_max_px < 0.5
  && result.B_vs_A_max_px < 1
  && result.C_clearance.card_clearance_px >= 8
  && result.C_clearance.footer_clearance_px >= 8
  && C.ndc_max_abs <= 0.84
await fs.writeFile(path.join(out, 'independent-material-camera-check.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({
  vertices: critical.length,
  A_vs_measured: result.A_vs_measured_region_report_max_px,
  B_vs_A: result.B_vs_A_max_px,
  C: C,
  card_clearance: result.C_clearance.card_clearance_px,
  footer_clearance: result.C_clearance.footer_clearance_px,
  D_vs_published: result.D_vs_published_candidate_max_px,
  pass: result.pass,
}, null, 1))
