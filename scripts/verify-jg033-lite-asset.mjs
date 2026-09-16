import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { Matrix4, Quaternion, Vector3 } from 'three'

const read = path => {
  const bytes = fs.readFileSync(path)
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
  const nodes = new Map()
  const visit = (index, parent = null, world = new Matrix4()) => {
    const n = gltf.nodes[index]
    const local = n.matrix ? new Matrix4().fromArray(n.matrix) : new Matrix4().compose(
      new Vector3(...(n.translation || [0, 0, 0])), new Quaternion(...(n.rotation || [0, 0, 0, 1])), new Vector3(...(n.scale || [1, 1, 1])))
    const matrix = world.clone().multiply(local)
    const primitives = n.mesh === undefined ? [] : gltf.meshes[n.mesh].primitives
    const triangles = primitives.reduce((sum, p) => sum + gltf.accessors[p.indices].count / 3, 0)
    assert(!nodes.has(n.name), `duplicate occurrence name: ${n.name}`)
    nodes.set(n.name, { parent, matrix: matrix.toArray(), triangles,
      materials: [...new Set(primitives.map(p => gltf.materials[p.material].name))].sort() })
    for (const child of n.children || []) visit(child, n.name, matrix)
  }
  for (const node of gltf.scenes[gltf.scene || 0].nodes) visit(node)
  return { nodes, gltf, bytes: bytes.length, hash: crypto.createHash('sha256').update(bytes).digest('hex') }
}
const source = read('public/models/msp-enclosure.glb')
const lite = read('public/models/rl300-lite.glb')
assert.equal(source.hash, 'f429a200be18e9d08bd586d1f9581b1266501d63342dfe8ce80573b87b9b8ed3', 'audited source changed: reassess export before rebuilding')
assert.deepEqual([...lite.nodes.keys()].sort(), [...source.nodes.keys()].sort(), 'every CAD occurrence survives, with no additions')
let maxTransformDelta = 0
for (const [name, a] of source.nodes) {
  const b = lite.nodes.get(name)
  assert.equal(b.parent, a.parent, `hierarchy: ${name}`)
  assert.deepEqual(b.materials, a.materials, `material identity: ${name}`)
  assert(b.triangles > 0 || a.triangles === 0, `geometry removed: ${name}`)
  const delta = Math.max(...a.matrix.map((v, i) => Math.abs(v - b.matrix[i])))
  maxTransformDelta = Math.max(maxTransformDelta, delta)
  assert(delta < 1e-5, `world transform changed: ${name}: ${delta}`)
}
// Owner explicitly ruled these unnamed twins to stay; independent of PART_POLICY/export rules.
const twins = ['V2EDW-60335 (Fuel Tank Weld On Flange)-4', 'V2EDW-60335 (Fuel Tank Weld On Flange)-5',
  'V2SKF-TB-2200-01-3', 'V2SKF-TB-2200-01-4', 'ISO_MOUNT_1', 'ISO_MOUNT_2', 'ISO_MOUNT_3',
  'V2MSP-MID-5406HHP24 ~-2', 'V2MSP-MID-5406HHP24 ~-4']
for (const name of twins) {
  assert(source.nodes.has(name) && lite.nodes.has(name), `missing retained twin: ${name}`)
  assert.equal(lite.nodes.get(name).triangles, source.nodes.get(name).triangles, `retained twin tessellation: ${name}`)
}
const triangles = [...lite.nodes.values()].reduce((sum, n) => sum + n.triangles, 0)
assert(triangles < 248000)
assert(lite.bytes < 4000000)
assert(lite.gltf.extensionsRequired.includes('KHR_draco_mesh_compression'))
console.log(JSON.stringify({ pass: true, sourceHash: source.hash, liteHash: lite.hash, liteBytes: lite.bytes,
  occurrences: lite.nodes.size, retainedTwins: twins.length, triangles, maxTransformDelta }, null, 2))
