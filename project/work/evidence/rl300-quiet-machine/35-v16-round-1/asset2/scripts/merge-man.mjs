// Merge the MAN-only GLB (PUMP_HOUSING + 8 meshes) into the existing extras GLB, then set root node translations.
// Usage: node merge-man.mjs <extras-before.glb> <man-only.glb> <out.glb>   Existing nodes/meshes/accessors keep their indices.
import fs from 'node:fs'

const [A, B, OUT] = process.argv.slice(2)
const TRANSLATIONS = { DUCT_EXHAUST: [0, 0, 0.0154], GAUGE_DIALS: [0, 0, 0.0140], PUMP_HOUSING: [0, 0, 0.0141] }

function parse(file) {
  const b = fs.readFileSync(file)
  const jl = b.readUInt32LE(12)
  const json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'))
  const bl = b.readUInt32LE(20 + jl)
  const bin = b.subarray(20 + jl + 8, 20 + jl + 8 + bl)
  return { json, bin }
}
const a = parse(A), m = parse(B)
const J = a.json, M = m.json
if (a.bin.length % 4 || J.buffers[0].byteLength !== a.bin.length) throw new Error('base bin not aligned / length mismatch')
if (J.nodes.some(n => n.name === 'PUMP_HOUSING' || /^MAN-6650459107-1\.00\d$/.test(n.name))) throw new Error('MAN nodes already present')

const binOff = a.bin.length
const nBV = J.bufferViews.length, nAcc = J.accessors.length, nMesh = J.meshes.length, nNode = J.nodes.length
// materials: reuse by name, append the rest
const matMap = M.materials.map(mat => {
  const i = J.materials.findIndex(x => x.name === mat.name)
  if (i >= 0) return i
  J.materials.push(mat); return J.materials.length - 1
})
for (const bv of M.bufferViews) J.bufferViews.push({ ...bv, buffer: 0, byteOffset: bv.byteOffset + binOff })
for (const ac of M.accessors) J.accessors.push({ ...ac, bufferView: ac.bufferView + nBV })
for (const me of M.meshes) {
  J.meshes.push({
    ...me,
    primitives: me.primitives.map(p => ({
      ...p,
      attributes: Object.fromEntries(Object.entries(p.attributes).map(([k, v]) => [k, v + nAcc])),
      indices: p.indices === undefined ? undefined : p.indices + nAcc,
      material: p.material === undefined ? undefined : matMap[p.material],
    })),
  })
}
for (const n of M.nodes) {
  const c = { ...n }
  if (c.mesh !== undefined) c.mesh += nMesh
  if (c.children) c.children = c.children.map(x => x + nNode)
  J.nodes.push(c)
}
if (M.scenes[0].nodes.length !== 1) throw new Error('unexpected man scene roots')
J.scenes[0].nodes.push(M.scenes[0].nodes[0] + nNode)
J.extensionsUsed = [...new Set([...(J.extensionsUsed || []), ...(M.extensionsUsed || [])])]
J.buffers[0].byteLength = binOff + m.bin.length

// root translations (JSON only; vertex data untouched)
for (const idx of J.scenes[0].nodes) {
  const n = J.nodes[idx]
  if (!(n.name in TRANSLATIONS)) throw new Error('unexpected root ' + n.name)
  n.translation = TRANSLATIONS[n.name]
}

const bin = Buffer.concat([a.bin, m.bin])
let js = Buffer.from(JSON.stringify(J), 'utf8')
js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)])
const total = 12 + 8 + js.length + 8 + bin.length
const h = Buffer.alloc(12); h.write('glTF', 0, 'latin1'); h.writeUInt32LE(2, 4); h.writeUInt32LE(total, 8)
const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.write('JSON', 4, 'latin1')
const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.write('BIN\0', 4, 'latin1')
fs.writeFileSync(OUT, Buffer.concat([h, jh, js, bh, bin]))
console.log(JSON.stringify({ out: OUT, bytes: total, nodes: J.nodes.length, meshes: J.meshes.length, materials: J.materials.map(x => x.name), roots: J.scenes[0].nodes.map(i => [J.nodes[i].name, J.nodes[i].translation]) }))
