// Scratch helper: load a GLB (Draco or plain) in node through the real three GLTFLoader.
import fs from 'node:fs'
import { createRequire } from 'node:module'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const require = createRequire(REPO + '/package.json')
const draco3d = require('draco3d')
const { GLTFLoader } = await import('file:///' + REPO + '/node_modules/three/examples/jsm/loaders/GLTFLoader.js')
const { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } = await import('file:///' + REPO + '/node_modules/three/build/three.module.js')
const mod = await draco3d.createDecoderModule({})

const stub = {
  preload() {},
  decodeDracoFile(buffer, callback, attributeIDs, attributeTypes, cs, onError) {
    try {
      const array = new Int8Array(buffer.buffer ? buffer : new Uint8Array(buffer))
      const decoder = new mod.Decoder()
      const dm = new mod.Mesh()
      const st = decoder.DecodeArrayToMesh(array, array.byteLength, dm)
      if (!st.ok()) throw new Error(st.error_msg())
      const g = new BufferGeometry()
      const n = dm.num_points()
      for (const name in attributeIDs) {
        const attr = decoder.GetAttributeByUniqueId(dm, attributeIDs[name])
        const items = attr.num_components()
        const out = new mod.DracoFloat32Array()
        decoder.GetAttributeFloatForAllPoints(dm, attr, out)
        const a = new Float32Array(n * items)
        for (let i = 0; i < a.length; i++) a[i] = out.GetValue(i)
        mod.destroy(out)
        g.setAttribute(name, new Float32BufferAttribute(a, items))
      }
      const nf = dm.num_faces()
      const idx = new Uint32Array(nf * 3)
      const ia = new mod.DracoInt32Array()
      for (let f = 0; f < nf; f++) {
        decoder.GetFaceFromMesh(dm, f, ia)
        idx[f * 3] = ia.GetValue(0); idx[f * 3 + 1] = ia.GetValue(1); idx[f * 3 + 2] = ia.GetValue(2)
      }
      mod.destroy(ia)
      g.setIndex(new Uint32BufferAttribute(idx, 1))
      mod.destroy(dm); mod.destroy(decoder)
      callback(g)
    } catch (e) { onError(e) }
  },
}

export function loadGlb(file) {
  const b = fs.readFileSync(file)
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
  const loader = new GLTFLoader().setDRACOLoader(stub)
  return new Promise((res, rej) => loader.parse(ab, '', gltf => res(gltf), rej))
}
