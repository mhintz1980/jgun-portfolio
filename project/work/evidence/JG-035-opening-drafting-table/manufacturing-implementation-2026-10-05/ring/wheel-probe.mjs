
import { readFileSync } from 'node:fs'
import { Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const data = readFileSync('public/models/knurling-tool.glb')
const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
for (const t of gltf.animations[0].tracks) console.log(t.name, 'times', Array.from(t.times).map(x=>+x.toFixed(4)).join(','), 'vals', Array.from(t.values).map(x=>+x.toFixed(5)).join(','))
for (const n of ['KT_UPPER_KNURL_WHEEL_RH','KT_LOWER_KNURL_WHEEL_LH']) {
  const w = gltf.scene.getObjectByName(n); const m = w.children[0]; const g = m.geometry; g.computeBoundingBox()
  const p = g.getAttribute('position'); console.log(n, 'verts', p.count, 'bbox', g.boundingBox.min.toArray().map(x=>+x.toFixed(5)), g.boundingBox.max.toArray().map(x=>+x.toFixed(5)), 'pos', w.position.toArray(), 'scale', w.scale.toArray())
  // axis = Y; radius in XZ about bbox center
  const c = g.boundingBox.getCenter(new Vector3()); let rmax = 0
  for (let i=0;i<p.count;i++) rmax=Math.max(rmax, Math.hypot(p.getX(i)-c.x, p.getZ(i)-c.z))
  const ang=[]; for (let i=0;i<p.count;i++){ const r=Math.hypot(p.getX(i)-c.x,p.getZ(i)-c.z); if(r>rmax-0.0002) ang.push(Math.atan2(p.getZ(i)-c.z,p.getX(i)-c.x)) }
  ang.sort((a,b)=>a-b); const clusters=[]; for(const a of ang){ if(!clusters.length||a-clusters[clusters.length-1].hi>0.02) clusters.push({lo:a,hi:a}); else clusters[clusters.length-1].hi=a }
  const rmin = (()=>{let m=1;for(let i=0;i<p.count;i++){m=Math.min(m,Math.hypot(p.getX(i)-c.x,p.getZ(i)-c.z))} return m})()
  console.log(n,'rmax',rmax.toFixed(6),'rmin',rmin.toFixed(6),'tipVerts',ang.length,'tip clusters',clusters.length)
}

