import { readFileSync } from 'node:fs'
import type { Mesh, Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { buildWrenchRig, type WrenchRig } from '../../rig/nodeRoles'
import { roleMaterial } from '../../rig/materials'
import { NodeDracoLoader } from './nodeDraco'

/**
 * Test-only: the REAL Default.glb run through the REAL rig builder, yielding exactly the
 * `inspection.source` / `inspection.meshes` pair TorqueWrenchHero hands to the ring study.
 * Cached per process; decoding the 13.7 MB Draco asset takes several seconds.
 */
/** The LCD decal draws into a 2D canvas the Node tests never read; stub it with a no-op context. */
function installCanvasStub() {
  const g = globalThis as unknown as { document?: unknown }
  if (g.document) return
  const noop2d = new Proxy({}, { get: (_t, key) => key === 'measureText' ? () => ({ width: 0 }) : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}, set: () => true })
  const globals = globalThis as unknown as { Path2D?: unknown }
  globals.Path2D ??= class { moveTo() {} lineTo() {} closePath() {} arc() {} rect() {} }
  g.document = { createElement: () => ({ width: 0, height: 0, style: {}, getContext: () => noop2d }) }
}

let cached: Promise<{ rig: WrenchRig; source: Object3D; meshes: Mesh[] }> | null = null

export function loadRingSource(path = 'public/models/Default.glb') {
  cached ??= (async () => {
    const data = readFileSync(path)
    const loader = new GLTFLoader().setDRACOLoader(new NodeDracoLoader() as never)
    const gltf = await loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')
    installCanvasStub()
    const rig = buildWrenchRig(gltf.scene)
    const source = rig.clutch.ringSwitch
    if (!source) throw new Error('Ring switch unit missing from the rig')
    const meshes = rig.meshes.filter(mesh => rig.originalMaterials.get(mesh) === roleMaterial('ringSwitch'))
    return { rig, source, meshes }
  })()
  return cached
}
