// Asset seat verifier for public/models/rl300-extra-parts.glb. Run: node <this file>. Prints ASSET_GLB_OK on success.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(here, '../../../../../..')
const GLB = path.join(REPO, 'public/models/rl300-extra-parts.glb')
const PARTS = path.join(REPO, 'project/work/evidence/rl300-quiet-machine/34-v16-assessment/data/v16-parts.json')
const STATS = path.join(here, 'build-stats.json')

const fails = []
const note = []
const check = (cond, msg) => { if (!cond) fails.push(msg) }

// ---- parse
const buf = fs.readFileSync(GLB)
check(buf.readUInt32LE(0) === 0x46546c67, 'magic glTF')
const jsonLen = buf.readUInt32LE(12)
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'))
const binStart = 20 + jsonLen + 8
const bin = buf.subarray(binStart)
const acc = (i) => json.accessors[i]
const bv = (i) => json.bufferViews[i]
function readAccessor(i) {
  const a = acc(i), v = bv(a.bufferView)
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type]
  const ct = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType]
  const off = (v.byteOffset || 0) + (a.byteOffset || 0)
  const stride = v.byteStride
  if (stride && stride !== comps * ct.BYTES_PER_ELEMENT) {
    const out = new ct(a.count * comps)
    const dv = new DataView(bin.buffer, bin.byteOffset + off - (a.byteOffset || 0) + (a.byteOffset || 0))
    for (let n = 0; n < a.count; n++) for (let c = 0; c < comps; c++) out[n * comps + c] = dv.getFloat32(n * stride + c * 4, true)
    return out
  }
  const copy = new Uint8Array(bin.subarray(off, off + a.count * comps * ct.BYTES_PER_ELEMENT))
  return new ct(copy.buffer)
}

// ---- file-level rules
check(!(json.extensionsUsed || []).includes('KHR_draco_mesh_compression') && !(json.extensionsRequired || []).includes('KHR_draco_mesh_compression'), 'no draco')
for (const e of json.extensionsUsed || []) check(e === 'KHR_materials_clearcoat', 'extension not allowed: ' + e)
check(!json.images || json.images.length === 0, 'no images')
check(!json.textures || json.textures.length === 0, 'no textures')
check(!json.cameras && !json.animations && !json.skins, 'no cameras/animations/skins')
check(!json.extensions || !json.extensions.KHR_lights_punctual, 'no lights')
check(buf.length <= 400 * 1024, `file <= 400 KB (${buf.length})`)

// ---- nodes
const EXPECT = ['DUCT_EXHAUST', 'EXHAUST_CONNECTOR_PIPE', 'GAUGE_DIALS', 'BREP1.001', 'BREP1.002', 'BREP1.003', 'BREP1', 'DIAL_LENS_1',
  'BREP1.007', 'BREP1.006', 'BREP1.005', 'BREP1.008', 'DIAL_LENS_2']
const names = json.nodes.map(n => n.name)
check(names.length === EXPECT.length && EXPECT.every(n => names.includes(n)) && new Set(names).size === names.length, 'node name set: ' + JSON.stringify(names))
const byName = Object.fromEntries(json.nodes.map((n, i) => [n.name, { n, i }]))
const CHILDREN = {
  DUCT_EXHAUST: ['EXHAUST_CONNECTOR_PIPE'], GAUGE_DIALS: ['BREP1.001', 'BREP1.007'],
  'BREP1.001': ['BREP1.002', 'BREP1.003', 'BREP1', 'DIAL_LENS_1'], 'BREP1.007': ['BREP1.006', 'BREP1.005', 'BREP1.008', 'DIAL_LENS_2'],
}
for (const [p, kids] of Object.entries(CHILDREN)) {
  const got = ((byName[p]?.n.children) || []).map(i => json.nodes[i].name).sort()
  check(JSON.stringify(got) === JSON.stringify([...kids].sort()), `children of ${p}: ${JSON.stringify(got)}`)
}
const rootNames = (json.scenes[json.scene || 0].nodes || []).map(i => json.nodes[i].name).sort()
check(JSON.stringify(rootNames) === JSON.stringify(['DUCT_EXHAUST', 'GAUGE_DIALS']), 'scene roots: ' + JSON.stringify(rootNames))
const ident = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
for (const n of json.nodes) {
  const t = n.translation || [0, 0, 0], r = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1]
  check(t.every(v => Math.abs(v) < 1e-9) && r.slice(0, 3).every(v => Math.abs(v) < 1e-9) && Math.abs(r[3] - 1) < 1e-9 && s.every(v => Math.abs(v - 1) < 1e-9), `transform not identity: ${n.name}`)
  if (n.matrix) check(n.matrix.every((v, k) => Math.abs(v - ident[k]) < 1e-9), `matrix not identity: ${n.name}`)
}

// ---- reference bboxes
const parts = JSON.parse(fs.readFileSync(PARTS, 'utf8'))
const ref = Object.fromEntries(parts.rows.map(r => [r.name, r.bbox]))
const stats = JSON.parse(fs.readFileSync(STATS, 'utf8'))
const toY = (b) => [[b[0][0], b[0][2], -b[1][1]], [b[1][0], b[1][2], -b[0][1]]]
const mm = (a, b) => Math.max(...[0, 1].flatMap(k => [0, 1, 2].map(i => Math.abs(a[k][i] - b[k][i])))) * 1000

// ---- per-mesh node analysis
const BUDGET = { 'BREP1.001': 1000, 'BREP1.007': 1000, 'BREP1.002': 150, 'BREP1.006': 150, 'BREP1.003': 900, 'BREP1.005': 900, 'BREP1': 150, 'BREP1.008': 150 }
const MARKS = ['BREP1.003', 'BREP1.005']
const V16_MARK_ISLANDS = 30   // welded (1 um) island count of both V16 marks meshes (unwelded V16 count is 400)
function islands(pos, idx) {
  const q = (v) => Math.round(v * 1e6)
  const map = new Map(); const id = new Int32Array(pos.length / 3)
  for (let i = 0; i < id.length; i++) {
    const k = q(pos[i * 3]) + ',' + q(pos[i * 3 + 1]) + ',' + q(pos[i * 3 + 2])
    let g = map.get(k); if (g === undefined) { g = map.size; map.set(k, g) }
    id[i] = g
  }
  const par = Array.from({ length: map.size }, (_, i) => i)
  const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x] } return x }
  const tris = idx ? idx.length / 3 : id.length / 3
  for (let t = 0; t < tris; t++) {
    const a = id[idx ? idx[t * 3] : t * 3], b = id[idx ? idx[t * 3 + 1] : t * 3 + 1], c = id[idx ? idx[t * 3 + 2] : t * 3 + 2]
    par[find(a)] = find(b); par[find(b)] = find(c)
  }
  const roots = new Set(); for (const v of new Set(id)) roots.add(find(v))
  return roots.size
}
const table = []
let totalTris = 0
for (const n of json.nodes) {
  if (n.mesh === undefined) continue
  const mesh = json.meshes[n.mesh]
  let tris = 0; let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; let isl = 0
  check(mesh.primitives.length === 1, `${n.name}: ${mesh.primitives.length} primitives`)
  for (const p of mesh.primitives) {
    check(p.attributes.POSITION !== undefined && p.attributes.NORMAL !== undefined, `${n.name}: POSITION+NORMAL`)
    check(Object.keys(p.attributes).every(k => k === 'POSITION' || k === 'NORMAL'), `${n.name}: extra attributes ${Object.keys(p.attributes)}`)
    check(p.mode === undefined || p.mode === 4, `${n.name}: mode`)
    const pa = acc(p.attributes.POSITION)
    const pos = readAccessor(p.attributes.POSITION)
    const idx = p.indices !== undefined ? readAccessor(p.indices) : null
    tris += (idx ? idx.length : pa.count) / 3
    for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], pa.min[i]); hi[i] = Math.max(hi[i], pa.max[i]) }
    // recompute min/max from data to be safe
    const nrm = readAccessor(p.attributes.NORMAL)
    let bad = 0
    for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]); if (Math.abs(l - 1) > 1e-2) bad++ }
    check(bad === 0, `${n.name}: ${bad} non-unit normals`)
    if (n.name === 'BREP1.002' || n.name === 'BREP1.006') {   // the dial face plate must face +x (towards the viewer)
      let sx = 0; for (let i = 0; i < nrm.length; i += 3) sx += nrm[i]
      check(sx / (nrm.length / 3) > 0.99, `${n.name}: face plate normals mean x ${(sx / (nrm.length / 3)).toFixed(3)}`)
    }
    isl = islands(pos, idx)
    if (p.material !== undefined) n._mat = json.materials[p.material].name
  }
  totalTris += tris
  const r = ref[n.name]
  let d = null, dTight = null
  if (r) { d = mm([lo, hi], toY(r)) }
  if (n.name === 'EXHAUST_CONNECTOR_PIPE') {
    const tb = stats.objects[n.name].bbox_before
    dTight = mm([lo, hi], toY(tb))
    check(dTight < 1, `${n.name}: bbox vs tight V16 vertex AABB ${dTight.toFixed(3)} mm`)
    if (d >= 1) note.push(`SPEC_DEVIATION ${n.name}: v16-parts.json bbox differs ${d.toFixed(3)} mm (reference is the AABB of the rotated object's bound_box corners); tight vertex AABB differs ${dTight.toFixed(3)} mm`)
    else check(d < 1, `${n.name}: bbox ${d}`)
  } else if (r) {
    check(d < 1, `${n.name}: bbox vs v16-parts ${d.toFixed(3)} mm`)
  }
  if (n.name === 'EXHAUST_CONNECTOR_PIPE') check(tris === 2172, `pipe tris ${tris}`)
  if (n.name.startsWith('DIAL_LENS')) check(tris === 380, `${n.name} tris ${tris}`)
  if (BUDGET[n.name]) check(tris <= BUDGET[n.name], `${n.name}: ${tris} > ${BUDGET[n.name]}`)
  if (MARKS.includes(n.name)) check(isl === V16_MARK_ISLANDS && stats.objects[n.name].islands_before === V16_MARK_ISLANDS, `${n.name}: islands ${isl} vs V16 ${V16_MARK_ISLANDS}`)
  table.push({ node: n.name, mat: n._mat, tris, islands: isl, bboxYup: [lo.map(v => +v.toFixed(4)), hi.map(v => +v.toFixed(4))], delta_v16parts_mm: d === null ? null : +d.toFixed(3), delta_tight_mm: dTight === null ? undefined : +dTight.toFixed(3) })
}
check(totalTris <= 7500, `total tris ${totalTris}`)

// ---- materials
const matNames = json.materials.map(m => m.name).sort()
const wantMats = ['0.886275_0.694118_0.027451_0.000000_0.000000', '0.886275_0.694118_0.027451_0.000000_0.001', 'DIAL_BEZEL', 'DIAL_FACE', 'DIAL_LENS', 'DIAL_MARKS', 'MSP_STAINLESS_FASTENER'].sort()
check(JSON.stringify(matNames) === JSON.stringify(wantMats), 'materials: ' + JSON.stringify(matNames))
const lens = json.materials.find(m => m.name === 'DIAL_LENS')
check(lens && lens.alphaMode === 'BLEND', 'lens alphaMode BLEND: ' + JSON.stringify(lens && lens.alphaMode))
const lensAlpha = lens?.pbrMetallicRoughness?.baseColorFactor?.[3]
for (const m of json.materials) if (m.name !== 'DIAL_LENS') check(m.alphaMode === undefined || m.alphaMode === 'OPAQUE', `${m.name}: alphaMode ${m.alphaMode}`)

console.log(JSON.stringify({ file: path.relative(REPO, GLB), bytes: buf.length, nodes: names.length, totalTris, lensAlpha, materials: json.materials.length, extensionsUsed: json.extensionsUsed || [] }))
for (const t of table) console.log('  ', t.node.padEnd(24), String(t.tris).padStart(5), 'tris', 'isl', String(t.islands).padStart(3), t.mat, 'bboxY', JSON.stringify(t.bboxYup), 'd_ref', t.delta_v16parts_mm, t.delta_tight_mm !== undefined ? 'd_tight ' + t.delta_tight_mm : '')
for (const n of note) console.log(n)
if (fails.length) { console.log('ASSET_GLB_FAIL'); for (const f of fails) console.log('  FAIL', f); process.exit(1) }
fs.writeFileSync(path.join(here, 'glb-table.json'), JSON.stringify({ bytes: buf.length, totalTris, lensAlpha, table, notes: note }, null, 1))
console.log('ASSET_GLB_OK')
