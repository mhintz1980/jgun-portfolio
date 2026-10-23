// usage: node glb_bbox.cjs <glb> <names.json> <out.json>
const fs = require('fs')
const [glb, namesFile, outFile] = process.argv.slice(2)
const buf = fs.readFileSync(glb)
const jsonLen = buf.readUInt32LE(12)
const g = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'))
const names = JSON.parse(fs.readFileSync(namesFile, 'utf8'))
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o }
const local = n => {
  if (n.matrix) return n.matrix
  const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1]
  const [x, y, z, w] = q
  const r = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1]
  for (let i = 0; i < 3; i++) { r[i] *= s[0]; r[4 + i] *= s[1]; r[8 + i] *= s[2] }
  r[12] = t[0]; r[13] = t[1]; r[14] = t[2]
  return r
}
const world = new Map()
const parentOf = new Map()
const walk = (i, pm) => { const m = mul(pm, local(g.nodes[i])); world.set(i, m); for (const c of g.nodes[i].children || []) { parentOf.set(c, i); walk(c, m) } }
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
for (const i of g.scenes[g.scene || 0].nodes) walk(i, I)
const sub = (i, acc) => { acc.push(i); for (const c of g.nodes[i].children || []) sub(c, acc); return acc }
const res = {}
for (const nm of names) {
  const idx = g.nodes.map((n, i) => [n.name, i]).filter(([n]) => n === nm).map(([, i]) => i)
  if (!idx.length) { res[nm] = null; continue }
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  let meshes = 0
  for (const i of sub(idx[0], [])) {
    const n = g.nodes[i]
    if (n.mesh === undefined) continue
    for (const p of g.meshes[n.mesh].primitives) {
      const a = g.accessors[p.attributes.POSITION]
      if (!a.min) continue
      meshes++
      for (let c = 0; c < 8; c++) {
        const v = [c & 1 ? a.max[0] : a.min[0], c & 2 ? a.max[1] : a.min[1], c & 4 ? a.max[2] : a.min[2]]
        const m = world.get(i)
        for (let k = 0; k < 3; k++) { const w = m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2] + m[12 + k]; mn[k] = Math.min(mn[k], w); mx[k] = Math.max(mx[k], w) }
      }
    }
  }
  res[nm] = { min: mn, max: mx, meshes }
}
fs.writeFileSync(outFile, JSON.stringify(res))
