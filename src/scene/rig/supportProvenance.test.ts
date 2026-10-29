import { expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { Box3, BufferAttribute, BufferGeometry, Matrix4, Mesh, Vector3, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { buildWrenchRig } from './nodeRoles'
import { roleMaterial } from './materials'
import { applyWrenchMechanics } from './wrenchMechanics'
import { snapshotDrawing } from '../drawing/drawingGeometry'
import { narrativeModelToStudy } from '../inspection/shaft/frame'

/** Actual source fixture: native Draco + GLTFLoader's primitive names/ancestry. */
async function sourceFixture() {
  const data = readFileSync('public/models/Default.glb')
  const require = createRequire(import.meta.url)
  const draco = await require('draco3d').createDecoderModule({})
  const decoder = {
    preload() {},
    decodeDracoFile(buffer: ArrayBuffer, done: (geometry: BufferGeometry) => void, ids: Record<string, number>) {
      const d = new draco.Decoder(), b = new draco.DecoderBuffer(), m = new draco.Mesh(), g = new BufferGeometry()
      b.Init(new Int8Array(buffer), buffer.byteLength)
      const result = d.DecodeBufferToMesh(b, m)
      if (!result.ok()) throw new Error(result.error_msg())
      for (const [name, id] of Object.entries(ids)) {
        const attribute = d.GetAttributeByUniqueId(m, id), values = new draco.DracoFloat32Array()
        d.GetAttributeFloatForAllPoints(m, attribute, values)
        const floats = new Float32Array(values.size())
        for (let i = 0; i < floats.length; i++) floats[i] = values.GetValue(i)
        g.setAttribute(name, new BufferAttribute(floats, attribute.num_components()))
        draco.destroy(values)
      }
      const face = new draco.DracoInt32Array(), indices = new Uint32Array(m.num_faces() * 3)
      for (let i = 0; i < m.num_faces(); i++) {
        d.GetFaceFromMesh(m, i, face)
        for (let j = 0; j < 3; j++) indices[i * 3 + j] = face.GetValue(j)
      }
      g.setIndex(new BufferAttribute(indices, 1))
      draco.destroy(face); draco.destroy(m); draco.destroy(b); draco.destroy(d)
      done(g)
    },
  }
  const loader = new GLTFLoader().setDRACOLoader(decoder as never)
  return (await loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '')).scene
}

const noop = () => {}
function stubCanvas() {
  const ctx = new Proxy({ createRadialGradient: () => ({ addColorStop: noop }) }, {
    get: (object, key) => Reflect.get(object, key) ?? noop,
    set: (object, key, value) => Reflect.set(object, key, value),
  })
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ctx }) })
  vi.stubGlobal('Path2D', class { moveTo = noop; lineTo = noop; closePath = noop })
}

function worldVertices(meshes: Mesh[]) {
  const points: number[] = [], point = new Vector3()
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false)
    const position = mesh.geometry.getAttribute('position')
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
      points.push(point.x, point.y, point.z)
    }
  }
  return points
}

function vertexHash(meshes: Mesh[]) {
  const points = worldVertices(meshes), rows: string[] = []
  for (let i = 0; i < points.length; i += 3) rows.push(points.slice(i, i + 3).map(n => n.toFixed(8)).join(','))
  return createHash('sha256').update(rows.sort().join('\n')).digest('hex')
}

function materialCounts(meshes: Mesh[]) {
  const counts = new Map<string, { vertices: number; indices: number }>()
  for (const mesh of meshes) {
    if (Array.isArray(mesh.material)) throw new Error('Unexpected source material array')
    const material = mesh.material
    // Ghosts clone the role material per rig; compare their stable role properties.
    const color = 'color' in material ? (material.color as { getHexString(): string }).getHexString() : ''
    const key = [material.name, material.type, color, material.transparent, material.opacity].join('|')
    const count = counts.get(key) ?? { vertices: 0, indices: 0 }
    count.vertices += mesh.geometry.getAttribute('position').count
    count.indices += mesh.geometry.index?.count ?? 0
    counts.set(key, count)
  }
  return counts
}

it('retains exact source supports while conserving geometry, roles, drawing bytes, mechanics and rig cache', async () => {
  stubCanvas()
  try {
    const source = await sourceFixture(), baseline = source.clone(true)
    const parts = ['K000210', 'K000211'] as const
    const raw = new Map(parts.map(part => [part, [] as Mesh[]]))
    const sourceNames: string[] = []
    source.traverse(node => {
      if (/K00021[01]/i.test(node.name)) sourceNames.push(node.name)
      if (!(node instanceof Mesh)) return
      let ancestor: Object3D | null = node
      while (ancestor) {
        const part = parts.find(part => ancestor!.name.includes(part))
        if (part) { raw.get(part)!.push(node); break }
        ancestor = ancestor.parent
      }
    })
    source.updateMatrixWorld(true)
    const before = new Map(parts.map(part => [part, worldVertices(raw.get(part)!)]))
    // Removing only the new identities reconstructs the previous clutch-static merge.
    baseline.traverse(node => { node.name = node.name.replace(/K000210/g, 'K00021X').replace(/K000211/g, 'K00021Y') })
    const rig = buildWrenchRig(source), old = buildWrenchRig(baseline)
    const studyFrame = narrativeModelToStudy(new Matrix4()), evidence = []
    for (const part of parts) {
      const merged = rig.meshes.filter(mesh => mesh.userData.partNumber === part)
      expect(raw.get(part)!.length).toBeGreaterThan(0)
      expect(sourceNames).toContain(part + '-1')
      expect(sourceNames).toContain('occurrence_of_' + part + '-1')
      expect(merged).toHaveLength(1)
      const mesh = merged[0]
      expect(mesh.name).toBe('MERGED ' + part)
      expect(mesh.parent === rig.clutch.static).toBe(true)
      expect(mesh.material === roleMaterial('blackOxideSteel')).toBe(true)
      expect(rig.originalMaterials.get(mesh)).toBe(mesh.material)
      expect(rig.ghostMaterials.has(mesh)).toBe(false)
      const after = worldVertices(merged), original = before.get(part)!
      expect(after).toHaveLength(original.length)
      let maxError = 0
      for (let i = 0; i < after.length; i++) maxError = Math.max(maxError, Math.abs(after[i] - original[i]))
      expect(maxError).toBeLessThan(1e-7)
      expect(mesh.geometry.index!.count).toBe(raw.get(part)!.reduce((sum, mesh) => sum + mesh.geometry.index!.count, 0))
      const bounds = new Box3().setFromObject(mesh, true), studyBounds = new Box3(), point = new Vector3()
      for (let i = 0; i < after.length; i += 3) studyBounds.expandByPoint(point.fromArray(after, i).applyMatrix4(studyFrame))
      evidence.push({ part, rawMeshes: raw.get(part)!.length, mergedMeshes: merged.length, vertices: after.length / 3,
        indices: mesh.geometry.index!.count, modelBounds: [bounds.min.toArray(), bounds.max.toArray()],
        studyBounds: [studyBounds.min.toArray(), studyBounds.max.toArray()], maxVertexError: maxError })
    }
    expect(rig.meshes.length).toBe(old.meshes.length + 2)
    expect(rig.meshes.filter(mesh => mesh.userData.partNumber === 'P001835')).toHaveLength(1)
    expect(rig.clutch.static!.children.some(node => node instanceof Mesh && !node.userData.partNumber)).toBe(true)
    expect(materialCounts(rig.meshes)).toEqual(materialCounts(old.meshes))
    expect(vertexHash(rig.meshes)).toBe(vertexHash(old.meshes))
    const drawing = snapshotDrawing({ ...rig, meshes: source.userData.journeyDrawingMeshes })
    const oldDrawing = snapshotDrawing({ ...old, meshes: baseline.userData.journeyDrawingMeshes })
    const hash = (geometry: BufferGeometry) => createHash('sha256').update(Buffer.from(geometry.getAttribute('position').array.buffer)).digest('hex')
    expect(hash(drawing.geometry)).toBe(hash(oldDrawing.geometry))
    drawing.geometry.dispose(); oldDrawing.geometry.dispose()
    for (const state of [{ shift: 1, explode: .3, gearAngle: 4, idle: 0 }, { shift: 0, explode: 1, gearAngle: 8, idle: 0 }]) {
      applyWrenchMechanics(rig, state); applyWrenchMechanics(old, state)
      expect(vertexHash(rig.meshes)).toBe(vertexHash(old.meshes))
      expect(rig.clutch.static!.matrixWorld.elements).toEqual(old.clutch.static!.matrixWorld.elements)
    }
    const cachedMeshes = [...rig.meshes], cachedDrawing = source.userData.journeyDrawingMeshes
    expect(buildWrenchRig(source)).toBe(rig)
    expect(rig.meshes).toEqual(cachedMeshes)
    expect(source.userData.journeyDrawingMeshes).toBe(cachedDrawing)
    process.stdout.write('support provenance (metres, union of all transformed vertices): ' + JSON.stringify({ sourceNames, evidence }) + '\n')
  } finally {
    vi.unstubAllGlobals()
  }
}, 60000)
