import fs from 'node:fs'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
const REPO = process.argv[2]
const sh = (c, o = {}) => execSync(c, { cwd: REPO, maxBuffer: 1 << 28, ...o })
const PIN = 'a48c12e578f2143944820cbbd1d64c9058556b85d4a01327903b28e8972615c6'
const hash = b => crypto.createHash('sha256').update(b).digest('hex')
function read(bytes) {
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
  const nodes = new Map()
  const visit = (i, parent) => {
    const n = gltf.nodes[i]
    const prims = n.mesh === undefined ? [] : gltf.meshes[n.mesh].primitives
    const tris = prims.reduce((s, p) => s + (p.indices === undefined ? 0 : gltf.accessors[p.indices].count / 3), 0)
    nodes.set(n.name, { parent, tris, prims: prims.length, mats: [...new Set(prims.map(p => gltf.materials[p.material]?.name))].sort().join('|') })
    for (const c of n.children || []) visit(c, n.name)
  }
  for (const r of gltf.scenes[gltf.scene || 0].nodes) visit(r, null)
  return { nodes, total: [...nodes.values()].reduce((s, n) => s + n.tris, 0), gen: gltf.asset?.generator }
}
const commits = sh('git log --format=%h -- public/models/msp-enclosure.glb').toString().trim().split(/\r?\n/)
const cur = fs.readFileSync(REPO + '/public/models/msp-enclosure.glb')
console.log('current hash', hash(cur).slice(0, 12), 'pin', PIN.slice(0, 12))
let old = null
for (const c of commits) {
  const b = sh(`git show ${c}:public/models/msp-enclosure.glb`)
  const h = hash(b)
  console.log(c, h.slice(0, 12), h === PIN ? '<== PIN' : '', h === hash(cur) ? '(current)' : '')
  if (h === PIN) old = b
}
const lite = read(fs.readFileSync(REPO + '/public/models/rl300-lite.glb'))
const now = read(cur)
console.log('lite gen:', lite.gen, 'tris', lite.total, 'nodes', lite.nodes.size)
console.log('current full gen:', now.gen, 'tris', now.total, 'nodes', now.nodes.size)
if (old) {
  const o = read(old)
  console.log('PIN source: gen', o.gen, 'tris', o.total, 'nodes', o.nodes.size)
  const added = [...now.nodes.keys()].filter(k => !o.nodes.has(k))
  const removed = [...o.nodes.keys()].filter(k => !now.nodes.has(k))
  const changed = [...now.nodes].filter(([k, v]) => o.nodes.has(k) && (o.nodes.get(k).tris !== v.tris || o.nodes.get(k).mats !== v.mats))
  console.log('added', added.length, added.slice(0, 15))
  console.log('removed', removed.length, removed.slice(0, 15))
  console.log('changed tris/mats', changed.length, changed.slice(0, 15).map(([k, v]) => `${k}: ${o.nodes.get(k).tris}->${v.tris}`))
} else console.log('pinned source not found in history of that path')
// lite vs current full node-set
const liteOnly = [...lite.nodes.keys()].filter(k => !now.nodes.has(k))
const fullOnly = [...now.nodes.keys()].filter(k => !lite.nodes.has(k))
console.log('lite-only nodes', liteOnly.length, liteOnly.slice(0, 10))
console.log('full-only nodes', fullOnly.length, fullOnly.slice(0, 10))
const PROTECTED = ['V2RL300-SAF-RES-1020-SAFE', 'RL300-PEM-1001', 'RL300-EMG-1001', 'MirrorRL200-AFS-2001', 'RL300-AFS-2003', 'V23028T25', 'V2RL300-WO-NP-SAFE', 'V2EDW-60335', 'V2SKF-TB-', 'V2MSP-MID-5406HHP24', 'ISO_MOUNT_', 'V2WISC-4770', '12335A81', 'V2RL300-SAF-1047']
for (const p of PROTECTED) console.log('protected', p, [...now.nodes.keys()].filter(k => k.includes(p)).length)
for (const k of ['DUCT_INTAKE_AIRWAY', 'ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'ACOUSTIC_BAFFLES', 'DUCT_INTAKE', 'DUCT_EXHAUST', 'PUMP_HOUSING']) {
  const n = now.nodes.get(k); const l = lite.nodes.get(k)
  console.log('root', k, 'full', n && n.tris, 'lite', l && l.tris)
}
const airway = [...now.nodes].filter(([k]) => /AIRWAY|LINER/i.test(k)).map(([k, v]) => `${k}:${v.tris}/${lite.nodes.get(k)?.tris}`)
console.log('airway/liner full/lite', airway.slice(0, 10))
