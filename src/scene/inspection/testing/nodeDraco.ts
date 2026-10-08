import { createRequire } from 'node:module'
import { BufferAttribute, BufferGeometry } from 'three'

/**
 * Test-only DRACOLoader stand-in for Node (vitest). GLTFLoader only needs `preload()` and
 * `decodeDracoFile(buffer, onLoad, attributeIDs, attributeTypes, colorSpace, onError)`; this decodes
 * with the `draco3d` Node module using the same logic as three's DRACOWorker. Never imported by app code.
 */
type TypedArrayCtor = Float32ArrayConstructor | Int8ArrayConstructor | Int16ArrayConstructor | Int32ArrayConstructor | Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modulePromise: Promise<any> | null = null
const decoderModule = () => {
  modulePromise ??= createRequire(import.meta.url)('draco3d').createDecoderModule({})
  return modulePromise!
}

export class NodeDracoLoader {
  preload() { return this }
  dispose() {}
  decodeDracoFile(
    buffer: ArrayBuffer | Uint8Array,
    onLoad: (geometry: BufferGeometry) => void,
    attributeIDs: Record<string, number>,
    attributeTypes: Record<string, string>,
    _colorSpace?: unknown,
    onError: (error: unknown) => void = () => {},
  ) {
    return decoderModule().then((draco: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const decoder = new draco.Decoder()
      try {
        const bytes = buffer instanceof Uint8Array ? new Int8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Int8Array(buffer)
        const mesh = new draco.Mesh()
        const status = decoder.DecodeArrayToMesh(bytes, bytes.byteLength, mesh)
        if (!status.ok() || mesh.ptr === 0) throw new Error('Draco decode failed: ' + status.error_msg())
        const geometry = new BufferGeometry()
        const count = mesh.num_points()
        for (const name of Object.keys(attributeIDs)) {
          const attribute = decoder.GetAttributeByUniqueId(mesh, attributeIDs[name])
          const itemSize: number = attribute.num_components()
          const Typed = (globalThis as unknown as Record<string, TypedArrayCtor>)[attributeTypes[name]]
          const dataType = ({ Float32Array: draco.DT_FLOAT32, Int8Array: draco.DT_INT8, Int16Array: draco.DT_INT16, Int32Array: draco.DT_INT32, Uint8Array: draco.DT_UINT8, Uint16Array: draco.DT_UINT16, Uint32Array: draco.DT_UINT32 } as Record<string, number>)[attributeTypes[name]]
          const byteLength = count * itemSize * Typed.BYTES_PER_ELEMENT
          const ptr = draco._malloc(byteLength)
          decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, dataType, byteLength, ptr)
          const array = new (Typed as Float32ArrayConstructor)(draco.HEAPF32.buffer, ptr, byteLength / Typed.BYTES_PER_ELEMENT).slice()
          draco._free(ptr)
          geometry.setAttribute(name, new BufferAttribute(array, itemSize))
        }
        const faces = mesh.num_faces(), indexBytes = faces * 3 * 4, indexPtr = draco._malloc(indexBytes)
        decoder.GetTrianglesUInt32Array(mesh, indexBytes, indexPtr)
        geometry.setIndex(new BufferAttribute(new Uint32Array(draco.HEAPF32.buffer, indexPtr, faces * 3).slice(), 1))
        draco._free(indexPtr)
        draco.destroy(mesh)
        onLoad(geometry)
      } catch (error) { onError(error) } finally { draco.destroy(decoder) }
    }).catch(onError)
  }
}
