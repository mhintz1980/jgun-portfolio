
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { AnimationMixer, Group, LoopOnce, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const data = readFileSync('public/models/knurling-tool.glb')
const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
const frame = new Group(); frame.rotation.x = Math.PI / 2; frame.add(gltf.scene)
console.log('clips', gltf.animations.map(a => a.name + ':' + a.duration + ':' + a.tracks.map(t=>t.name).join('|')))
const mixer = new AnimationMixer(gltf.scene), action = mixer.clipAction(gltf.animations[0])
action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play()
const R = .07544365628189591 / 2, W = .0115, p = new Vector3(), rows = []
for (let f = 1; f <= 150; f++) {
  const t = f / 30; mixer.setTime(t); frame.updateMatrixWorld(true)
  const row = { f, t }
  for (const n of ['KT_UPPER_KNURL_WHEEL_RH', 'KT_LOWER_KNURL_WHEEL_LH']) {
    const w = gltf.scene.getObjectByName(n); p.setFromMatrixPosition(w.matrixWorld)
    row[n] = { clr: Math.hypot(p.x, p.y) - R - W, z: p.z, ang: Math.atan2(p.y, p.x) }
  }
  rows.push(row)
}
for (const r of rows) if (r.f % 5 === 1 || (r.f > 40 && r.f < 70 && r.f % 2 === 0)) console.log(r.f, r.t.toFixed(3), r.KT_UPPER_KNURL_WHEEL_RH.clr.toFixed(6), r.KT_LOWER_KNURL_WHEEL_LH.clr.toFixed(6), r.KT_UPPER_KNURL_WHEEL_RH.z.toFixed(5), r.KT_LOWER_KNURL_WHEEL_LH.z.toFixed(5))
const names = []; gltf.scene.traverse(o => names.push(o.name)); console.log(names.join(','))
mkdirSync('project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/ring', { recursive: true })
writeFileSync('project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/ring/clip-contact-samples.json', JSON.stringify(rows))

