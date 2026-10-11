import fs from 'node:fs'
const b = fs.readFileSync('C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/public/models/msp-enclosure.glb')
const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'))
const acc = j.accessors
const glbMesh = new Map()
for (const n of j.nodes) if (n.mesh !== undefined) {
  let t = 0; for (const p of j.meshes[n.mesh].primitives) t += (p.indices !== undefined ? acc[p.indices].count : acc[p.attributes.POSITION].count) / 3
  glbMesh.set(n.name, t)
}
const v = JSON.parse(fs.readFileSync('blend/v16-objs.json', 'utf8'))
const vm = new Map(v.map(r => [r.n, r]))
const added = v.filter(r => !glbMesh.has(r.n))
const removed = [...glbMesh.keys()].filter(n => !vm.has(n))
const common = v.filter(r => glbMesh.has(r.n))
const sum = a => a.reduce((s, x) => s + x, 0)
console.log(`GLB mesh nodes ${glbMesh.size} (tris ${Math.round(sum([...glbMesh.values()]))}) | V16 mesh objects ${v.length} (tris ${sum(v.map(r => r.tris))})`)
console.log(`common by name ${common.length} | in V16 only ${added.length} (tris ${sum(added.map(r => r.tris))}) | in GLB only ${removed.length}`)
const byRoot = {}
for (const r of added) { (byRoot[r.root] ??= { n: 0, tris: 0, hidden: 0 }); byRoot[r.root].n++; byRoot[r.root].tris += r.tris; if (r.hide) byRoot[r.root].hidden++ }
console.log('V16-only by root:', JSON.stringify(Object.entries(byRoot).sort((a, b) => b[1].tris - a[1].tris).slice(0, 12)))
console.log('V16-only largest:', added.sort((a, b) => b.tris - a.tris).slice(0, 12).map(r => `${r.n}[${r.tris}]`).join('; '))
console.log('V16-only V2/named parts sample:', added.filter(r => /^V2|^MSP|^MAN/.test(r.n)).slice(0, 14).map(r => r.n).join('; '))
console.log('GLB-only sample:', removed.slice(0, 14).join('; '))
// tris in common parts: GLB (decimated) vs V16 raw
const ratios = common.filter(r => r.tris > 500).map(r => glbMesh.get(r.n) / r.tris)
ratios.sort((a, b) => a - b)
console.log(`common big parts: GLB/V16 tris ratio median ${ratios[Math.floor(ratios.length / 2)]?.toFixed(2)} (n=${ratios.length}); V16 decimate modifiers on ${v.filter(r => r.dec.length).length} objects`)
