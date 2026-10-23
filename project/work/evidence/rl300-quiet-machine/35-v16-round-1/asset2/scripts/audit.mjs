// Fused/shifted-parts audit: shipped msp-enclosure.glb vs V16 (world bboxes in glTF frame from dump_bboxes.py).
// Usage: node audit.mjs <out.md> [--json]
import fs from 'node:fs'
import { loadGlb } from './load.mjs'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const EV = REPO + '/project/work/evidence/rl300-quiet-machine'
const THREE = await import('file:///' + REPO + '/node_modules/three/build/three.module.js')
const OUT = process.argv[2]
const TOL = 0.002   // 2 mm containment tolerance
const MED_MM = 5

const san = n => n.replace(/\s/g, '_').replace(/[[\].:/]/g, '')
const fam = n => san(n.replace(/\.\d{3}$/, ''))
const v16 = JSON.parse(fs.readFileSync(EV + '/35-v16-round-1/asset2/v16-bboxes.json', 'utf8'))
const objs = JSON.parse(fs.readFileSync(EV + '/34-v16-assessment/data/v16-objs.json', 'utf8'))
const rootOf = new Map(objs.map(o => [o.n, o.root]))
const bySan = new Map()
for (const r of v16) { r.s = san(r.n); r.fam = fam(r.n); r.root = rootOf.get(r.n) ?? '(none)'; if (!bySan.has(r.s)) bySan.set(r.s, r) }
const famMembers = new Map()
for (const r of v16) { if (!famMembers.has(r.fam)) famMembers.set(r.fam, []); famMembers.get(r.fam).push(r) }

// shipped
const file = REPO + '/public/models/msp-enclosure.glb'
const buf = fs.readFileSync(file)
const J = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
const meshNodes = new Set(J.nodes.filter(n => n.mesh !== undefined).map(n => san(n.name)))
const gltf = await loadGlb(file)
gltf.scene.updateMatrixWorld(true)
const found = new Map()
gltf.scene.traverse(o => { if (meshNodes.has(o.name) && !found.has(o.name)) found.set(o.name, o) })
const boxOf = (o) => {
  const b = new THREE.Box3(); const kids = o.isMesh ? [o] : o.children.filter(c => c.isMesh)
  for (const k of kids) { k.geometry.computeBoundingBox(); b.union(k.geometry.boundingBox.clone().applyMatrix4(k.matrixWorld)) }
  return b
}
const trisOf = (o) => { let t = 0; const kids = o.isMesh ? [o] : o.children.filter(c => c.isMesh); for (const k of kids) t += (k.geometry.index ? k.geometry.index.count : k.geometry.attributes.position.count) / 3; return t }
const shipped = new Map()
for (const [name, o] of found) { const b = boxOf(o); if (!b.isEmpty()) shipped.set(name, { min: b.min.toArray(), max: b.max.toArray(), tris: trisOf(o) }) }

const contains = (a, b) => b.min.every((x, i) => x >= a.min[i] - TOL) && b.max.every((x, i) => x <= a.max[i] + TOL)
const union = (list) => ({ min: [0, 1, 2].map(i => Math.min(...list.map(r => r.min[i]))), max: [0, 1, 2].map(i => Math.max(...list.map(r => r.max[i]))) })

// (a) fused nodes
const fused = []
for (const [s, sh] of shipped) {
  const own = bySan.get(s)
  if (!own) continue
  const members = famMembers.get(own.fam).filter(r => r.n !== own.n)
  if (members.length < 1) continue
  // members whose bbox sits inside the shipped node's bbox (own V16 object counted too)
  let inside = [own, ...members].filter(r => contains(sh, r))
  // translation-invariant fallback: a fused node that is itself shifted (frame offset) pokes out of containment, so also
  // accept the node when its bbox dimensions equal the dimensions of the union of the whole family (+-3 mm)
  const U = union([own, ...members])
  const dimOk = [0, 1, 2].every(i => Math.abs((sh.max[i] - sh.min[i]) - (U.max[i] - U.min[i])) < 0.003)
  if (dimOk) inside = [own, ...members]
  // absorbed = family members inside the node that are not themselves shipped as separate nodes
  const absorbed = inside.filter(r => r !== own && !shipped.has(r.s))
  const grows = !contains({ min: own.min.map(x => x - TOL), max: own.max.map(x => x + TOL) }, sh)   // shipped bbox reaches beyond its own V16 object
  if (inside.length >= 2 && absorbed.length >= 1 && grows) {
    fused.push({ node: s, shippedTris: sh.tris, v16Names: inside.map(r => r.n), v16Tris: inside.reduce((a, r) => a + r.tris, 0), absorbed: absorbed.length })
  }
}
// (b) per-root median delta over matched, non-fused parts
const fusedSet = new Set(fused.map(f => f.node))
const groups = new Map()
let matched = 0
for (const [s, sh] of shipped) {
  const v = bySan.get(s)
  if (!v || fusedSet.has(s)) continue
  matched++
  const d = [0, 1, 2].map(i => ((sh.min[i] + sh.max[i]) - (v.min[i] + v.max[i])) / 2 * 1000)
  if (!groups.has(v.root)) groups.set(v.root, [])
  groups.get(v.root).push(d)
}
const med = a => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2 }
const shiftedParts = new Map()
for (const [s, sh] of shipped) {
  const v = bySan.get(s); if (!v || fusedSet.has(s)) continue
  const d = [0, 1, 2].map(i => ((sh.min[i] + sh.max[i]) - (v.min[i] + v.max[i])) / 2 * 1000)
  if (d.some(x => Math.abs(x) > MED_MM)) { if (!shiftedParts.has(v.root)) shiftedParts.set(v.root, []); shiftedParts.get(v.root).push({ n: v.n, d }) }
}
const rows = []
for (const [root, ds] of groups) {
  const m = [0, 1, 2].map(i => med(ds.map(d => d[i])))
  rows.push({ root, n: ds.length, m, flag: m.some(x => Math.abs(x) > MED_MM) })
}
rows.sort((a, b) => Math.max(...b.m.map(Math.abs)) - Math.max(...a.m.map(Math.abs)))
const f1 = x => (x >= 0 ? '+' : '') + x.toFixed(1)
const unmatchedShipped = [...shipped.keys()].filter(s => !bySan.has(s))
const v16NotShipped = v16.filter(r => !shipped.has(r.s))

const L = []
L.push('# Fused / shifted parts audit (shipped msp-enclosure.glb vs V16 copy, glTF Y-up frame)')
L.push(`Shipped mesh nodes with a bbox: ${shipped.size}; V16 mesh objects: ${v16.length}; matched by sanitized name: ${shipped.size - unmatchedShipped.length} (shipped-only: ${unmatchedShipped.length}); V16 objects with no shipped node: ${v16NotShipped.length}.`)
L.push('')
L.push(`## (a) shipped nodes containing the union of 2+ same-family V16 objects (tol ${TOL * 1000} mm or equal union dims; absorbed = no own shipped node; shipped tris ~ one member = stacked duplicates, not a fusion)`)
L.push('| shipped node | tris shipped | tris V16 (members) | members inside | absorbed (no own node) |')
L.push('|---|---:|---:|---:|---:|')
for (const f of fused.sort((a, b) => b.v16Tris - a.v16Tris).slice(0, 14)) L.push(`| ${f.node} | ${f.shippedTris} | ${f.v16Tris} | ${f.v16Names.length} | ${f.absorbed} |`)
if (fused.length > 14) L.push(`| ... ${fused.length - 14} more | | | | |`)
if (!fused.length) L.push('| none | | | | |')
L.push('')
L.push(`## (b) median per-axis bbox-centre delta, shipped minus V16, per V16 root group (matched non-fused parts: ${matched}; groups: ${rows.length}; flag > ${MED_MM} mm on any axis)`)
L.push('| root group | parts | dx mm | dy mm | dz mm |')
L.push('|---|---:|---:|---:|---:|')
const flagged = rows.filter(r => r.flag)
for (const r of flagged.slice(0, 12)) L.push(`| ${r.root} | ${r.n} | ${f1(r.m[0])} | ${f1(r.m[1])} | ${f1(r.m[2])} |`)
if (!flagged.length) L.push('| none above 5 mm | | | | |')
L.push(`| groups above 5 mm: ${flagged.length} of ${rows.length}; largest unflagged: ${rows.filter(r => !r.flag).slice(0, 1).map(r => `${r.root} ${r.m.map(f1).join('/')}`).join('')} | | | | |`)
L.push('## (c) individual parts shifted > 5 mm on any axis (shipped minus V16, fused excluded), by root group')
L.push('| root group | shifted parts | example (dx/dy/dz mm) |')
L.push('|---|---:|---|')
for (const [root, ps] of [...shiftedParts].sort((a, b) => b[1].length - a[1].length).slice(0, 10)) { const e = ps[0]; L.push('| ' + root + ' | ' + ps.length + ' | ' + e.n + ' ' + e.d.map(f1).join('/') + ' |') }
L.push('')
L.push('## Reference rows (fused nodes excluded from (b); the three extras roots are not in msp-enclosure.glb)')
L.push('| group | parts | dx mm | dy mm | dz mm |')
L.push('|---|---:|---:|---:|---:|')
for (const g of ['DUCT_EXHAUST', 'PUMP_HOUSING', 'GAUGE_DIALS', 'RL300-CPM-3000']) { const r = rows.find(x => x.root === g); if (r) L.push(`| ${g} | ${r.n} | ${f1(r.m[0])} | ${f1(r.m[1])} | ${f1(r.m[2])} |`) }
fs.writeFileSync(OUT, L.join('\n') + '\n')
console.log(L.length, 'lines; fused', fused.length, 'flagged', flagged.length, 'rows', rows.length)
if (process.argv.includes('--json')) console.log(JSON.stringify({ fused, rows: rows.slice(0, 25), unmatchedShipped: unmatchedShipped.slice(0, 20), v16NotShipped: v16NotShipped.length }, null, 0))
