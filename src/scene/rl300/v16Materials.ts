/** V16 per-part material map (owner-approved materials-and-parts track).
 *
 *  `v16-part-materials.json` is the asset seat's reading of the V16 review scene: for each
 *  part, the V16 material of every slot, in order, plus a table of the 27 materials with
 *  their Principled values. Nothing here touches three; `prepareModel` applies the values.
 *
 *  How GLTFLoader delivers parts (measured over msp-enclosure.glb and rl300-lite.glb):
 *  a single-primitive mesh is one Mesh named after its node, which is the JSON key. A
 *  multi-primitive mesh is a non-Mesh group carrying the node name (the JSON key) whose
 *  Mesh children are named after the mesh def (`Mesh_422`, `Mesh_422_1`, ...) in primitive
 *  order. `prepareModel` finds the part name and slot position; this module only decides
 *  what a slot means. */
export interface V16Material {
  /** Linear-sRGB base colour (Blender's working space, three's working space). */
  baseLinear: readonly number[]
  metalness: number
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  opacity: number
  procedural: boolean
  nonPrincipled: boolean
  notes: string
}
export interface V16Part {
  /** The V16 material name of every slot, in primitive order. */
  v16: readonly string[]
  /** Primitive count the asset seat saw in the GLB; null when the part is not in the main GLB. */
  glbPrims: number | null
}
export interface V16Map {
  version: number
  source: unknown
  materials: Record<string, V16Material>
  parts: Record<string, V16Part>
}
export type V16Resolved = V16Material & { name: string }

const has = (table: object, key: string) => Object.prototype.hasOwnProperty.call(table, key)

/** The V16 material for one primitive of a part, or null (current behaviour).
 *
 *  Rules:
 *  - a part the map does not know is null;
 *  - a single-slot part maps directly: its one material covers every primitive the loader
 *    delivered (one part has one V16 slot on two GLB primitives);
 *  - a multi-slot part maps per primitive only when `v16.length === slotCount`, where
 *    `slotCount` is what the loader actually delivered for this tier (lite splits fewer
 *    parts than full). Any other count is a mismatch: null, and `isMultiSlotMismatch`
 *    reports it so the caller can count it.
 *  The slot index is trusted as primitive order: no multi-slot part with distinguishable
 *  base materials is permuted between the GLB and the V16 slot list (see runtime notes). */
export function mapFor(map: V16Map, partName: string, slotIndex: number, slotCount: number): V16Resolved | null {
  if (!has(map.parts, partName)) return null
  const slots = map.parts[partName].v16
  let name: string | undefined
  if (slots.length === 1) name = slots[0]
  else if (slots.length === slotCount && Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < slots.length) name = slots[slotIndex]
  if (name === undefined || !has(map.materials, name)) return null
  return { ...map.materials[name], name }
}

/** True when the part is multi-slot and the delivered primitive count is not its slot count. */
export function isMultiSlotMismatch(map: V16Map, partName: string, slotCount: number): boolean {
  if (!has(map.parts, partName)) return false
  const slots = map.parts[partName].v16
  return slots.length > 1 && slots.length !== slotCount
}
