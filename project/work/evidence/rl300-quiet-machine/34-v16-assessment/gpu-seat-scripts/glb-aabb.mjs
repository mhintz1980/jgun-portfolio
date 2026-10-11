// World AABB of named glTF nodes from the GLB JSON chunk: node TRS/matrix chain x POSITION accessor min/max.
// (Draco keeps accessor min/max in the JSON.) No decoding of geometry.
import fs from 'node:fs'
import { R, THREE } from './common.mjs'

export function loadGlb(file = R + '/public/models/msp-enclosure.glb') {
  const b = fs.readFileSync(file)
  const len = b.readUInt32LE(12)
  return JSON.parse(b.toString('utf8', 20, 20 + len))
}

export function nodeMatrix(n) {
  const m = new THREE.Matrix4()
  if (n.matrix) return m.fromArray(n.matrix)
  const t = new THREE.Vector3(...(n.translation || [0, 0, 0]))
  const q = new THREE.Quaternion(...(n.rotation || [0, 0, 0, 1]))
  const s = new THREE.Vector3(...(n.scale || [1, 1, 1]))
  return m.compose(t, q, s)
}

export function worldBoxes(json) {
  const parent = new Map()
  json.nodes.forEach((n, i) => (n.children || []).forEach(c => parent.set(c, i)))
  const cache = new Map()
  const world = i => {
    if (cache.has(i)) return cache.get(i)
    const local = nodeMatrix(json.nodes[i])
    const w = parent.has(i) ? world(parent.get(i)).clone().multiply(local) : local
    cache.set(i, w); return w
  }
  const boxes = []
  json.nodes.forEach((n, i) => {
    if (n.mesh === undefined) return
    const box = new THREE.Box3()
    for (const prim of json.meshes[n.mesh].primitives) {
      const a = json.accessors[prim.attributes.POSITION]
      if (!a.min || !a.max) continue
      const mn = a.min, mx = a.max, w = world(i)
      for (const x of [mn[0], mx[0]]) for (const y of [mn[1], mx[1]]) for (const z of [mn[2], mx[2]]) box.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(w))
    }
    if (!box.isEmpty()) boxes.push({ name: n.name, index: i, box })
  })
  return boxes
}

export function boxByName(boxes, re) { return boxes.filter(b => re.test(b.name)) }
