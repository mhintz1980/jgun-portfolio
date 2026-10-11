// Compact summary of a GLB: nodes, roots, meshes, materials, textures, triangles (from index accessor counts), extensions.
import fs from 'node:fs'
const f = process.argv[2]
const b = fs.readFileSync(f)
const len = b.readUInt32LE(12)
const j = JSON.parse(b.subarray(20, 20 + len).toString('utf8'))
const acc = j.accessors || []
let tris = 0, prims = 0, drc = 0
for (const m of j.meshes || []) for (const p of m.primitives || []) {
  prims++; if (p.extensions?.KHR_draco_mesh_compression) drc++
  tris += p.indices !== undefined ? acc[p.indices].count / 3 : (acc[p.attributes.POSITION]?.count || 0) / 3
}
const nodes = j.nodes || []
const scene = j.scenes?.[j.scene ?? 0]
const roots = (scene?.nodes || []).map(i => nodes[i]?.name)
const mats = j.materials || []
const imgs = j.images || []
const kinds = { pbr: 0, texturedBase: 0, normal: 0, emissive: 0, transmission: 0, clearcoat: 0, other: [] }
for (const m of mats) {
  const p = m.pbrMetallicRoughness || {}
  kinds.pbr++
  if (p.baseColorTexture) kinds.texturedBase++
  if (m.normalTexture) kinds.normal++
  if (m.emissiveTexture || (m.emissiveFactor && m.emissiveFactor.some(v => v > 0))) kinds.emissive++
  const ex = Object.keys(m.extensions || {})
  if (ex.includes('KHR_materials_transmission')) kinds.transmission++
  if (ex.includes('KHR_materials_clearcoat')) kinds.clearcoat++
}
console.log(JSON.stringify({
  file: f.split(/[\\/]/).pop(), bytes: b.length, generator: j.asset?.generator, extensionsUsed: j.extensionsUsed,
  nodes: nodes.length, rootCount: roots.length, roots: roots.slice(0, 20), meshes: (j.meshes || []).length, primitives: prims, dracoPrims: drc,
  triangles: Math.round(tris), materials: mats.length, materialKinds: kinds, textures: (j.textures || []).length, images: imgs.length,
  imageMime: [...new Set(imgs.map(i => i.mimeType))], animations: (j.animations || []).length,
  namedNodeSample: nodes.map(n => n.name).filter(n => /^V2/.test(n || '')).length,
}, null, 1))
