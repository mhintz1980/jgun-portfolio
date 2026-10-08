// CPU-only independent Draco projection. No browser, GPU, runtime loader or camera sampler.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import draco3d from 'draco3d'
import { Matrix4, PerspectiveCamera, Vector3 } from 'three'

const out = path.dirname(fileURLToPath(import.meta.url))
let root = out
while (!(await fs.stat(path.join(root, 'package.json')).then(() => true).catch(() => false))) root = path.dirname(root)
const previous = path.join(out, '../blockout-2026-10-06')
const blockout = JSON.parse(await fs.readFile(path.join(previous, 'report.json'), 'utf8'))
const region = JSON.parse(await fs.readFile(path.join(previous, 'material-region-report.json'), 'utf8'))
const sourcePath = path.join(root, 'src/scene/inspection/shaft/camera.ts')
const source = await fs.readFile(sourcePath, 'utf8')
// Post-15 anchors subtract the frozen follow; adding it restores exactly the machine azimuth.
// Read authored values from source while rebuilding the composition independently.
const anchorText = source.match(/const ANCHORS:[\s\S]*?= (\[[\s\S]*?\n\])/)[1]
const anchors = Function('FOLLOW_AZIMUTH_MOD', 'DEG', `return ${anchorText}`)(0, Math.PI / 180)
const sha = async p => createHash('sha256').update(await fs.readFile(p)).digest('hex')
const dm = await draco3d.createDecoderModule({})
const decoder = new dm.Decoder()
const cache = new Map()
async function points(tier, name, row, y1) {
  const key = tier + name
  if (!cache.has(key)) {
    const bytes = await fs.readFile(path.join(root, `public/models/manufacturing-core-${tier}.glb`))
    const jl = bytes.readUInt32LE(12), doc = JSON.parse(bytes.subarray(20, 20 + jl))
    const node = doc.nodes.find(n => n.name === name), result = []
    for (const prim of doc.meshes[node.mesh].primitives) {
      const ext = prim.extensions.KHR_draco_mesh_compression, bv = doc.bufferViews[ext.bufferView]
      const data = bytes.subarray(28 + jl + (bv.byteOffset ?? 0), 28 + jl + (bv.byteOffset ?? 0) + bv.byteLength)
      const db = new dm.DecoderBuffer(), mesh = new dm.Mesh(), values = new dm.DracoFloat32Array()
      db.Init(new Int8Array(data), data.length)
      if (!decoder.DecodeBufferToMesh(db, mesh).ok()) throw new Error('Draco decode failed')
      decoder.GetAttributeFloatForAllPoints(mesh, decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION), values)
      for (let i = 0; i < mesh.num_points(); i++) result.push(new Vector3(values.GetValue(i * 3), values.GetValue(i * 3 + 1), values.GetValue(i * 3 + 2)))
      dm.destroy(values); dm.destroy(mesh); dm.destroy(db)
    }
    cache.set(key, result)
  }
  const angle = name === 'legacyshaft' ? 2 * row.telemetry.shaft.cutter.rotation : row.telemetry.shaft.hob.rotation / 10
  const rotation = new Matrix4().makeRotationZ(angle)
  return cache.get(key).filter(v => -v.z * 1000 >= 3.2 && -v.z * 1000 <= y1).map(v => v.clone().applyMatrix4(rotation))
}
const toGltf = v => new Vector3(v.x, v.z, -v.y)
function camera(anchor, row, overrides = {}) {
  const a = { ...anchor, ...overrides }, narrow = row.layout === 'narrow'
  const target = new Vector3(...(narrow ? a.tgtNarrow ?? a.tgt : a.tgt)).multiplyScalar(0.001)
  const az = a.az * Math.PI / 180, el = a.el * Math.PI / 180
  const pos = target.clone().add(new Vector3(a.dist * Math.cos(el) * Math.cos(az), a.dist * Math.sin(el), a.dist * Math.cos(el) * Math.sin(az)))
  const c = new PerspectiveCamera(narrow ? a.fovNarrow : a.fovDesktop, row.viewport[0] / row.viewport[1], 0.005, 150)
  c.position.copy(toGltf(pos)); c.up.set(0, 1, 0); c.lookAt(toGltf(target)); c.updateMatrixWorld(true)
  return c
}
function project(pts, row, cam) {
  const vp = cam instanceof PerspectiveCamera ? new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse) : cam
  const pixels = pts.map(v => { const p = v.clone().applyMatrix4(vp); return [(p.x + 1) * row.viewport[0] / 2, (1 - p.y) * row.viewport[1] / 2] })
  const bounds = { min: [Math.min(...pixels.map(p => p[0])), Math.min(...pixels.map(p => p[1]))], max: [Math.max(...pixels.map(p => p[0])), Math.max(...pixels.map(p => p[1]))] }
  // A rectangle is clear when at least one full separating axis has 8px clearance.
  // Use all X/Y extents, avoiding a Y-only collision inference.
  const protections = Object.fromEntries(['header', 'copy', 'card', 'footer'].map(name => {
    const r = row.dom[name]
    const gaps = [r.min[0] - bounds.max[0], bounds.min[0] - r.max[0], r.min[1] - bounds.max[1], bounds.min[1] - r.max[1]]
    return [name, { rect: r, separating_clearance_px: Math.max(...gaps), overlap_vertices: pixels.filter(p => p[0] >= r.min[0] && p[0] <= r.max[0] && p[1] >= r.min[1] && p[1] <= r.max[1]).length }]
  }))
  const ndcMax = Math.max(...pixels.flatMap(p => [Math.abs(2 * p[0] / row.viewport[0] - 1), Math.abs(1 - 2 * p[1] / row.viewport[1])]))
  const witnessIndices = [...new Set([0, 1].flatMap(axis => [pixels.findIndex(p => p[axis] === bounds.min[axis]), pixels.findIndex(p => p[axis] === bounds.max[axis])]))]
  const decoded_bound_witnesses_shaft_mm = witnessIndices.map(i => [pts[i].x * 1000, -pts[i].z * 1000, pts[i].y * 1000])
  return { bounds, vertices: pts.length, decoded_bound_witnesses_shaft_mm, ndc_max_abs: ndcMax, protections, pass: ndcMax <= 0.84 && Object.values(protections).every(p => p.separating_clearance_px >= 8) }
}
const delta = (a, b) => Math.max(...['min', 'max'].flatMap(k => a[k].map((v, i) => Math.abs(v - b[k][i]))))
const result = { schema: 1, method: 'Independent Draco positions; single shaft-local (x,y,z) -> glTF (x,z,-y) conversion; saved-matrix controls; source-authored post-15 machine anchors reconstructed independently; full rectangle X/Y separation >=8px.', limitations: 'CPU projection only. Saved DOM/matrices are from pre-mobile-fix source; current source is separately hashed. Raster visibility, actual new DOM and runtime matrices require rebuilt parent capture.', saved_source_sha256: blockout.input_hashes['src/scene/inspection/shaft/camera.ts'], inputs: {}, controls: [], current: [], candidates: [] }
for (const p of ['src/scene/inspection/shaft/camera.ts', 'src/scene/inspection/shaft/camera.test.ts', 'public/models/manufacturing-core-full.glb', 'public/models/manufacturing-core-lite.glb']) result.inputs[p] = await sha(path.join(root, p))
result.inputs['previous/report.json'] = await sha(path.join(previous, 'report.json'))
result.inputs['previous/material-region-report.json'] = await sha(path.join(previous, 'material-region-report.json'))
result.inputs['check-footer.mjs'] = await sha(fileURLToPath(import.meta.url))
for (const row of blockout.anchors.filter(r => r.name.startsWith('failed') || r.name === 'revised-4340')) {
  const material = row.name.startsWith('failed'), anchor = anchors.find(a => a.t === (material ? 15 : 33.2))
  const pts = await points(row.tier === 'full' ? 'full' : 'lite', material ? 'legacyshaft' : 'approvedshaft', row, material ? 14.2 : 20)
  const liveVp = new Matrix4().fromArray(row.camera.projection).multiply(new Matrix4().fromArray(row.camera.world).invert())
  const live = project(pts, row, liveVp)
  const prior = material ? { ...anchor, fovDesktop: 7.2, fovNarrow: 9.5, tgt: [0, 19.2, 0], tgtNarrow: [0, 8.5, -2.8] } : { ...anchor, fovDesktop: 7.6, fovNarrow: 17.5, tgt: [0, 18.5, 0], tgtNarrow: [0, 9, 0] }
  const oldLaw = project(pts, row, camera(prior, row))
  const measured = material ? region.rows.find(r => r.layout === row.layout && r.name === row.name).critical_action_bounds : row.projected['study-approvedshaft'].bounds
  result.controls.push({ layout: row.layout, name: row.name, saved_live: live, law_vs_saved_px: delta(oldLaw.bounds, live.bounds), decode_vs_previous_px: delta(live.bounds, measured) })
  result.current.push({ layout: row.layout, name: row.name, time: row.time, anchor, ...project(pts, row, camera(anchor, row)) })
  if (material && row.layout === 'desktop' && row.name === 'failed-4140') {
    for (const fovDesktop of [7.2, 7.4, 7.5, 7.6, 7.8, 8]) for (const z of [-2.5, -2.6, -2.8, -3]) {
      const override = { fovDesktop, tgt: [0, 19.2, z] }
      result.candidates.push({ layout: row.layout, name: row.name, override, ...project(pts, row, camera(anchor, row, override)) })
    }
  }
  if (!material && row.layout === 'desktop') for (const fovDesktop of [8, 8.5, 9, 9.5, 9.7, 10]) for (const z of [-2.5, -3, -3.5, -4]) {
    const override = { fovDesktop, tgt: [0, 18.5, z] }
    result.candidates.push({ layout: row.layout, name: row.name, override, ...project(pts, row, camera(anchor, row, override)) })
  }
  if (!material && row.layout === 'narrow') for (const z of [-1.5, -1.75, -2, -2.25]) {
    const override = { tgtNarrow: [0, 9, z] }
    result.candidates.push({ layout: row.layout, name: row.name, override, ...project(pts, row, camera(anchor, row, override)) })
  }
}
dm.destroy(decoder)
result.pass = result.controls.every(c => c.law_vs_saved_px < 0.001 && c.decode_vs_previous_px < 0.001) && result.current.every(c => c.pass)
await fs.writeFile(path.join(out, 'projection-report.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ pass: result.pass, controls: result.controls.map(c => ({ layout: c.layout, name: c.name, law_delta_px: c.law_vs_saved_px, decode_delta_px: c.decode_vs_previous_px })), current: result.current.map(c => ({ layout: c.layout, name: c.name, bounds: c.bounds, clearances: Object.fromEntries(Object.entries(c.protections).map(([k,v]) => [k,v.separating_clearance_px])), pass: c.pass })), passing_candidates: result.candidates.filter(c => c.pass).map(c => ({ layout: c.layout, override: c.override, bounds: c.bounds, clearances: Object.fromEntries(Object.entries(c.protections).map(([k,v]) => [k,v.separating_clearance_px])) })) }, null, 2))
