// Test-only: decodes public/models/metrology-tools.glb in Node (draco3d) into sheet-local Z-up vertices.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import draco3d from 'draco3d'
import { Matrix4, Quaternion, Vector3 } from 'three'

export interface DecodedPrimitive { material: string; node: string; positions: Float32Array; uvs: Float32Array | null; indices: Uint32Array }
export interface DecodedTool { id: string; primitives: DecodedPrimitive[] }

interface GltfNode { name?: string; mesh?: number; children?: number[]; translation?: number[]; rotation?: number[]; scale?: number[]; matrix?: number[] }
export const ASSET_URL = new URL('../../../public/models/metrology-tools.glb', import.meta.url)

export async function decodeMetrologyAsset(): Promise<DecodedTool[]> {
  const bytes = readFileSync(fileURLToPath(ASSET_URL))
  const jsonLength = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'))
  const binStart = 20 + jsonLength + 8
  const bin = bytes.subarray(binStart)
  const mod = await draco3d.createDecoderModule({})
  const nodes: GltfNode[] = json.nodes
  const tools: DecodedTool[] = []
  const visit = (index: number, parent: Matrix4, tool: DecodedTool) => {
    const node = nodes[index]
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation ?? [0, 0, 0])), new Quaternion(...(node.rotation ?? [0, 0, 0, 1])), new Vector3(...(node.scale ?? [1, 1, 1])))
    const here = parent.clone().multiply(local)
    if (node.mesh !== undefined) for (const prim of json.meshes[node.mesh].primitives) {
      const ext = prim.extensions.KHR_draco_mesh_compression
      const view = json.bufferViews[ext.bufferView]
      const data = new Int8Array(bin.buffer, bin.byteOffset + (view.byteOffset ?? 0), view.byteLength)
      const decoder = new mod.Decoder(), buffer = new mod.DecoderBuffer()
      buffer.Init(data, data.length)
      const mesh = new mod.Mesh()
      if (!decoder.DecodeBufferToMesh(buffer, mesh).ok()) throw new Error('Draco decode failed: ' + node.name)
      const count = mesh.num_points()
      const read = (name: string, size: number) => {
        if (ext.attributes[name] === undefined) return null
        const attribute = decoder.GetAttributeByUniqueId(mesh, ext.attributes[name])
        const out = new mod.DracoFloat32Array()
        decoder.GetAttributeFloatForAllPoints(mesh, attribute, out)
        const array = new Float32Array(count * size)
        for (let i = 0; i < array.length; i++) array[i] = out.GetValue(i)
        mod.destroy(out)
        return array
      }
      const raw = read('POSITION', 3)!
      // glTF is Y-up; the runtime rotates X by +PI/2: (x, y, z) -> (x, -z, y).
      const positions = new Float32Array(raw.length)
      for (let i = 0; i < count; i++) {
        const v = new Vector3(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]).applyMatrix4(here), x = v.x, y = v.y, z = v.z
        positions[i * 3] = x; positions[i * 3 + 1] = -z; positions[i * 3 + 2] = y
      }
      // Read every Draco attribute while mesh/buffer/decoder are alive; free WASM objects on every exit path.
      const uvs = read('TEXCOORD_0', 2)
      const faces = mesh.num_faces(), indices = new Uint32Array(faces * 3), tri = new mod.DracoInt32Array()
      try {
        for (let f = 0; f < faces; f++) {
          decoder.GetFaceFromMesh(mesh, f, tri)
          indices[f * 3] = tri.GetValue(0); indices[f * 3 + 1] = tri.GetValue(1); indices[f * 3 + 2] = tri.GetValue(2)
        }
        tool.primitives.push({ material: json.materials[prim.material]?.name ?? '', node: node.name ?? '', positions, uvs, indices })
      } finally {
        mod.destroy(tri); mod.destroy(mesh); mod.destroy(buffer); mod.destroy(decoder)
      }
    }
    for (const child of node.children ?? []) visit(child, here, tool)
  }
  for (const root of json.scenes[0].nodes as number[]) {
    const tool: DecodedTool = { id: nodes[root].name!, primitives: [] }
    visit(root, new Matrix4(), tool)
    tools.push(tool)
  }
  return tools
}
