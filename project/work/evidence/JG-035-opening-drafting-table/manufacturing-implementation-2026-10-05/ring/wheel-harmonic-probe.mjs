
import { readFileSync } from 'node:fs'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const data = readFileSync('public/models/knurling-tool.glb')
const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
const g = gltf.scene.getObjectByName('KT_UPPER_KNURL_WHEEL_RH').children[0].geometry, p = g.getAttribute('position')
// Angular spectrum of the tip radius on the OD (axis = local Y), per axial slab.
for (const y of [-0.003, -0.0015, 0, 0.0015, 0.003]) {
  const pts = []
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i) - y) < 0.00025) { const r = Math.hypot(p.getX(i), p.getZ(i)); if (r > 0.0113) pts.push([Math.atan2(p.getZ(i), p.getX(i)), r]) }
  let best = [0, 0]
  for (let k = 8; k <= 400; k++) { let c = 0, s = 0; for (const [a, r] of pts) { c += (r - 0.0114) * Math.cos(k * a); s += (r - 0.0114) * Math.sin(k * a) } const m = Math.hypot(c, s); if (m > best[1]) best = [k, m] }
  console.log('y', y, 'tip verts', pts.length, 'dominant angular harmonic', best[0])
}

