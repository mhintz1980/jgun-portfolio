// One sanity read-back of the merged extras GLB: node tree, tri counts, existing nodes byte-identical, MAN world bbox vs V16.
import fs from 'node:fs'
import crypto from 'node:crypto'
const SCR = 'C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/7a0ea69b-a024-4739-ae73-5eab43caed88/scratchpad'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const { loadGlb } = await import('file:///' + SCR + '/runtime/load.mjs')
const THREE = await import('file:///' + REPO + '/node_modules/three/build/three.module.js')
const after = await loadGlb(process.argv[2]), before = await loadGlb(SCR + '/asset2/extras-before.glb')
const v16 = JSON.parse(fs.readFileSync(SCR + '/asset2/v16-bboxes.json', 'utf8'))
const sig = o => crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).update(Buffer.from(o.geometry.index.array.buffer)).update(Buffer.from(o.geometry.attributes.normal.array.buffer)).digest('hex').slice(0, 12)
const meshes = g => { const m = new Map(); g.scene.traverse(o => { if (o.isMesh) m.set(o.name, o) }); return m }
const A = meshes(after), B = meshes(before)
let same = 0, diff = []
for (const [n, o] of B) { const p = A.get(n); if (p && sig(p) === sig(o) && p.material.name === o.material.name) same++; else diff.push(n) }
console.log('existing nodes identical:', same, '/', B.size, 'diff:', diff.join(',') || 'none')
after.scene.updateMatrixWorld(true)
console.log('scene roots:', after.scene.children.map(c => `${c.name} t=${c.position.toArray().map(x => +x.toFixed(4))} kids=${c.children.length}`).join(' | '))
const q = n => n.replace(/^/, '')
for (const [n, o] of A) {
  if (!/^MAN-/.test(n)) continue
  const b = new THREE.Box3().setFromObject(o)
  const v = v16.find(r => r.n.replace(/[.]/g, '') === n.replace(/1000$/, '1').replace(/[.]/g, '') || (n.endsWith('1000') && r.n === 'MAN-6650459107-1') || r.n.replace(/[.]/g,'') === n)
  const d = b.min.toArray().map((x, i) => +(x - v.min[i]).toFixed(4)).concat(b.max.toArray().map((x, i) => +(x - v.max[i]).toFixed(4)))
  console.log(n.padEnd(24), o.material.name.padEnd(18), 'tris', o.geometry.index.count / 3, 'v16tris', v.tris, 'bbox-delta(min|max) vs V16', JSON.stringify(d))
}
