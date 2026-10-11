import fs from 'node:fs'
const b = fs.readFileSync('C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/public/models/msp-enclosure.glb')
const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'))
const mul = (a, c) => { const o = new Array(16).fill(0); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) o[k * 4 + r] += a[i * 4 + r] * c[k * 4 + i]; return o }
const trs = n => { if (n.matrix) return n.matrix; const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1]
  const [x, y, z, w] = q; const m = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1]
  for (let i = 0; i < 3; i++) { m[i] *= s[0]; m[4 + i] *= s[1]; m[8 + i] *= s[2] } m[12] = t[0]; m[13] = t[1]; m[14] = t[2]; return m }
const bbox = {}
const parent = new Map(); j.nodes.forEach((n, i) => (n.children || []).forEach(c => parent.set(c, i)))
const world = []
const walk = (i, pm) => { const m = pm ? mul(pm, trs(j.nodes[i])) : trs(j.nodes[i]); world[i] = m; (j.nodes[i].children || []).forEach(c => walk(c, m)) }
for (const r of j.scenes[0].nodes) walk(r, null)
const boxOf = i => { const n = j.nodes[i]; let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]
  const add = k => { const nn = j.nodes[k]; if (nn.mesh !== undefined) for (const p of j.meshes[nn.mesh].primitives) { const a = j.accessors[p.attributes.POSITION]; if (!a.min) continue
    for (const cx of [a.min[0], a.max[0]]) for (const cy of [a.min[1], a.max[1]]) for (const cz of [a.min[2], a.max[2]]) { const m = world[k]; const v = [m[0] * cx + m[4] * cy + m[8] * cz + m[12], m[1] * cx + m[5] * cy + m[9] * cz + m[13], m[2] * cx + m[6] * cy + m[10] * cz + m[14]]
      for (let d = 0; d < 3; d++) { lo[d] = Math.min(lo[d], v[d]); hi[d] = Math.max(hi[d], v[d]) } } }
    (nn.children || []).forEach(add) }
  add(i); return [lo.map(v => +v.toFixed(3)), hi.map(v => +v.toFixed(3))] }
for (const name of ['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'DUCT_EXHAUST', 'V2RL300-SAF-RES-1020-SAFE-1', 'EXHAUST_CONNECTOR_PIPE', 'RL300-P-FFM-1001-1', 'RL300-P-FFM-1000']) {
  const i = j.nodes.findIndex(n => n.name === name)
  console.log(name.padEnd(30), i < 0 ? 'NOT IN GLB' : JSON.stringify(boxOf(i)))
}
console.log('Blender->glTF expectation (x,z,-y): ENCLOSURE_CHASSIS y[0.05,1.914] z[-1.655,1.535]; RES-1020 x[.293,.512] y[1.032,1.251] z[.94,1.46]')
