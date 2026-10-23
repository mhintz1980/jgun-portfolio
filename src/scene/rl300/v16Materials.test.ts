import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Plane, Uint32BufferAttribute, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { isMultiSlotMismatch, mapFor, type V16Map, type V16Material } from './v16Materials'
import { locatePart, PART_POLICY, prepareModel, sanitizeName } from './prepareModel'
import v16Json from './v16-part-materials.json'

const material = (over: Partial<V16Material> = {}): V16Material => ({
  baseLinear: [.1, .2, .3], metalness: .5, roughness: .4, clearcoat: 0, clearcoatRoughness: .03,
  opacity: 1, procedural: false, nonPrincipled: false, notes: '', ...over,
})
const map: V16Map = {
  version: 1,
  source: {},
  materials: {
    PAINT: material({ roughness: .5 }),
    LACQUER: material({ roughness: .16, metalness: 0, clearcoat: 1, clearcoatRoughness: .005, baseLinear: [.02, .02, .02] }),
    BRASS: material({ metalness: 1, roughness: .3 }),
    FOAM: material({ roughness: .9, metalness: 0 }),
    GLASS: material({ opacity: .0337, roughness: .02, metalness: 0 }),
    SOLID: material({ roughness: .55 }),
  },
  parts: {
    SINGLE: { v16: ['PAINT'], glbPrims: 1 },
    SINGLE_ON_TWO: { v16: ['BRASS'], glbPrims: 2 },
    PAIR: { v16: ['PAINT', 'LACQUER'], glbPrims: 2 },
    PAIR_ON_ONE: { v16: ['PAINT', 'LACQUER'], glbPrims: 1 },
    TRIPLE_ON_TWO: { v16: ['PAINT', 'LACQUER', 'BRASS'], glbPrims: 2 },
    DANGLING: { v16: ['NO_SUCH_MATERIAL'], glbPrims: 1 },
    constructor: { v16: ['PAINT'], glbPrims: 1 },
  },
}

describe('v16 per-part material map', () => {
  it('maps a single-slot part directly and carries the entry values and its name', () => {
    const m = mapFor(map, 'SINGLE', 0, 1)
    expect(m?.name).toBe('PAINT')
    expect(m?.roughness).toBe(.5)
    expect(m?.baseLinear).toEqual([.1, .2, .3])
  })
  it('lets a single V16 slot cover every primitive the loader delivers', () => {
    expect(mapFor(map, 'SINGLE_ON_TWO', 0, 2)?.name).toBe('BRASS')
    expect(mapFor(map, 'SINGLE_ON_TWO', 1, 2)?.name).toBe('BRASS')
  })
  it('maps a multi-slot part per primitive only when the slot count equals the delivered primitive count', () => {
    expect(mapFor(map, 'PAIR', 0, 2)?.name).toBe('PAINT')
    expect(mapFor(map, 'PAIR', 1, 2)?.name).toBe('LACQUER')
    expect(mapFor(map, 'PAIR', 1, 2)?.clearcoat).toBe(1)
    expect(isMultiSlotMismatch(map, 'PAIR', 2)).toBe(false)
  })
  it('leaves a multi-slot part on current behaviour when slots and primitives disagree, and says so', () => {
    expect(mapFor(map, 'PAIR_ON_ONE', 0, 1)).toBeNull()
    expect(isMultiSlotMismatch(map, 'PAIR_ON_ONE', 1)).toBe(true)
    expect(mapFor(map, 'TRIPLE_ON_TWO', 0, 2)).toBeNull()
    expect(mapFor(map, 'TRIPLE_ON_TWO', 1, 2)).toBeNull()
    expect(isMultiSlotMismatch(map, 'TRIPLE_ON_TWO', 2)).toBe(true)
  })
  it('returns null for parts the map does not know and does not call them mismatches', () => {
    expect(mapFor(map, 'NOT_A_PART', 0, 1)).toBeNull()
    expect(isMultiSlotMismatch(map, 'NOT_A_PART', 1)).toBe(false)
    // Single-slot parts are never a mismatch, whatever the loader delivered.
    expect(isMultiSlotMismatch(map, 'SINGLE_ON_TWO', 2)).toBe(false)
  })
  it('refuses a slot index outside the part and a slot whose material the map lacks', () => {
    expect(mapFor(map, 'PAIR', 2, 2)).toBeNull()
    expect(mapFor(map, 'PAIR', -1, 2)).toBeNull()
    expect(mapFor(map, 'DANGLING', 0, 1)).toBeNull()
  })
  it('does not resolve names through the prototype chain', () => {
    expect(mapFor(map, 'toString', 0, 1)).toBeNull()
    expect(mapFor(map, '__proto__', 0, 1)).toBeNull()
    // An own key that happens to shadow a prototype member is still a real part.
    expect(mapFor(map, 'constructor', 0, 1)?.name).toBe('PAINT')
  })
})

// ---- prepareModel with the V16 options, on a fake source -----------------------------------
const plane = () => new Plane(new Vector3(-1, 0, 0), .85)
const box = (x: number) => { const g = new BoxGeometry(.02, .02, .02); g.translate(x, 0, 0); return g }
const base = (name: string, over: Partial<MeshStandardMaterial> = {}) => {
  const m = new MeshStandardMaterial({ name }); m.color.setHex(0x808080); m.roughness = .1; m.metalness = .95
  return Object.assign(m, over)
}

/** Shell + equipment + the registered liner + one mesh per PART_POLICY key (prepareModel
 *  throws when a ruled part is missing). `extra` lets a test add parts to any root. */
function build(extra: (roots: Record<string, Group>) => void = () => {}) {
  const source = new Group()
  const roots: Record<string, Group> = {}
  for (const n of ['COMPOSITE_PANELS', 'DUCT_EXHAUST', 'PUMP_HOUSING']) { const g = new Group(); g.name = n; source.add(g); roots[n] = g }
  let x = 0
  const add = (parent: Group, name: string, mat: MeshStandardMaterial) => { const m = new Mesh(box(x += .03), mat); m.name = name; parent.add(m); return m }
  add(roots.PUMP_HOUSING, 'V2RL300-SAF-1047-5', base('MSP_ALUMINUM'))
  for (const key of Object.keys(PART_POLICY)) add(roots.PUMP_HOUSING, sanitizeName(key), base('MSP_STAINLESS'))
  extra(roots)
  return { source, roots, add }
}
const meshes = (g: Group) => g.children as Mesh[]
const byName = (g: Group, name: string) => meshes(g).find(m => m.name === name)

describe('prepareModel with V16 options', () => {
  const v16: V16Map = {
    ...map,
    parts: {
      ...map.parts,
      EQUIP: { v16: ['LACQUER'], glbPrims: 1 },
      EQUIP_B: { v16: ['BRASS'], glbPrims: 1 },
      SHELL_PAINT: { v16: ['PAINT'], glbPrims: 1 },
      'EXHAUST_PIPE-1': { v16: ['PAINT'], glbPrims: 1 },
      'RL300-SIF-A-1': { v16: ['FOAM'], glbPrims: 1 },
      'RL300-SIF-B-1': { v16: ['FOAM'], glbPrims: 1 },
      'RL300-P-FFM-1001-1': { v16: ['LACQUER'], glbPrims: 1 },
    },
  }

  it('is byte-for-byte the old behaviour with no options', () => {
    const { source, add, roots } = build()
    add(roots.PUMP_HOUSING, 'EQUIP', base('MSP_STAINLESS'))
    const model = prepareModel(source, plane())
    const m = byName(model.group, 'PUMP_HOUSING/MSP_STAINLESS/whole/cad')!
    expect((m.material as MeshStandardMaterial).roughness).toBe(.28) // clamped from .1
    expect((m.material as MeshStandardMaterial).metalness).toBe(.8) // clamped from .95
    expect(model.counts.v16Applied).toBe(false)
    expect(model.counts.mappedParts + model.counts.mappedPrimitives + model.counts.extraParts + model.counts.unmappedMultiSlot).toBe(0)
    model.dispose()
  })

  it('applies V16 values to a non-repainted mapped part without the .28/.8 clamps', () => {
    const { source, add, roots } = build()
    add(roots.PUMP_HOUSING, 'EQUIP', base('MSP_STAINLESS'))
    add(roots.PUMP_HOUSING, 'EQUIP_B', base('MSP_STAINLESS'))
    const model = prepareModel(source, plane(), { v16, physical: false })
    const lacquer = byName(model.group, 'PUMP_HOUSING/LACQUER/whole/cad')!.material as MeshStandardMaterial
    expect(lacquer.roughness).toBe(.16) // the clamp would have made it .28
    expect(lacquer.metalness).toBe(0)
    expect(lacquer).not.toBeInstanceOf(MeshPhysicalMaterial) // lite tier: no clearcoat
    expect(lacquer.color.toArray()).toEqual([.02, .02, .02]) // setRGB in the linear working space
    const brass = byName(model.group, 'PUMP_HOUSING/BRASS/whole/cad')!.material as MeshStandardMaterial
    expect(brass.metalness).toBe(1) // the clamp would have made it .8
    expect(brass.envMapIntensity).toBe(.65)
    // The un-mapped GLB look never merges with a V16 bucket of the same name.
    expect(byName(model.group, 'PUMP_HOUSING/MSP_STAINLESS~glb/whole/cad')).toBeDefined()
    model.dispose()
  })

  it('builds MeshPhysicalMaterial only for clearcoat on the physical tier', () => {
    const { source, add, roots } = build()
    add(roots.PUMP_HOUSING, 'EQUIP', base('MSP_STAINLESS'))
    add(roots.PUMP_HOUSING, 'EQUIP_B', base('MSP_STAINLESS'))
    const model = prepareModel(source, plane(), { v16, physical: true })
    const lacquer = byName(model.group, 'PUMP_HOUSING/LACQUER/whole/cad')!.material as MeshPhysicalMaterial
    expect(lacquer).toBeInstanceOf(MeshPhysicalMaterial)
    expect([lacquer.clearcoat, lacquer.clearcoatRoughness, lacquer.roughness]).toEqual([1, .005, .16])
    expect(lacquer.defines).toHaveProperty('PHYSICAL')
    expect(byName(model.group, 'PUMP_HOUSING/BRASS/whole/cad')!.material).not.toBeInstanceOf(MeshPhysicalMaterial)
    model.dispose()
  })

  it('protects ruled looks: repainted and chrome buckets keep their current roughness and metalness', () => {
    const { source, add, roots } = build()
    add(roots.COMPOSITE_PANELS, 'SHELL_PAINT', base('MSP_YELLOW_PAINT'))
    const pipe = new Group(); pipe.name = 'EXHAUST_PIPE-1'; roots.DUCT_EXHAUST.add(pipe)
    const pm = new Mesh(box(.5), base('MSP_STAINLESS')); pm.name = 'pipe_mesh'; pipe.add(pm)
    const model = prepareModel(source, plane(), { v16, physical: true })
    const blue = byName(model.group, 'COMPOSITE_PANELS/MSP_YELLOW_PAINT/cut/#193f66')!.material as MeshStandardMaterial
    expect([blue.roughness, blue.metalness]).toEqual([.34, .32])
    expect(blue.color.getHexString()).toBe(new MeshStandardMaterial({ color: '#193f66' }).color.getHexString())
    // The pipe mesh does map (to PAINT, through its EXHAUST_PIPE-1 group), but the chrome
    // ruling protects the look, so it stays the ruled chrome.
    const chrome = meshes(model.group).find(m => m.name.endsWith('/#b8babf'))!.material as MeshStandardMaterial
    expect([chrome.roughness, chrome.metalness]).toEqual([.28, .8])
    model.dispose()
  })

  it('keeps the base material in the key of repainted parts so insulation looks never mix', () => {
    const { source, add, roots } = build()
    add(roots.COMPOSITE_PANELS, 'RL300-SIF-A-1', base('MSP_RUBBER', { roughness: .75, metalness: 0 }))
    add(roots.COMPOSITE_PANELS, 'RL300-SIF-B-1', base('MSP_ALUMINUM', { roughness: .1, metalness: .95 }))
    const model = prepareModel(source, plane(), { v16, physical: false })
    const rubber = byName(model.group, 'COMPOSITE_PANELS/MSP_RUBBER/cut/#193f66')!.material as MeshStandardMaterial
    const alu = byName(model.group, 'COMPOSITE_PANELS/MSP_ALUMINUM/cut/#193f66')!.material as MeshStandardMaterial
    expect([rubber.roughness, rubber.metalness]).toEqual([.75, 0])
    expect([alu.roughness, alu.metalness]).toEqual([.28, .8])
    // Two insulation parts + the builder's own EXHAUST_PIPE-1 mesh (a PART_POLICY key since round 2, chrome).
    expect(model.counts.protectedPrimitives).toBe(3)
    model.dispose()
  })

  it('maps multi-primitive groups per slot when equal and counts the ones that are not', () => {
    const { source, roots } = build()
    const group = (name: string, mats: string[]) => {
      const g = new Group(); g.name = name; roots.PUMP_HOUSING.add(g)
      mats.forEach((m, i) => { const mesh = new Mesh(box(.6 + i * .01), base(m)); mesh.name = i ? `Mesh_9_${i}` : 'Mesh_9'; g.add(mesh) })
      return g
    }
    group('PAIR', ['MSP_STAINLESS', 'MSP_STAINLESS'])
    group('TRIPLE_ON_TWO', ['MSP_STAINLESS', 'MSP_STAINLESS'])
    group('SINGLE_ON_TWO', ['MSP_STAINLESS', 'MSP_STAINLESS'])
    const pair = roots.PUMP_HOUSING.children.find(c => c.name === 'PAIR')!
    expect(locatePart(pair.children[1] as Mesh, v16.parts)).toEqual({ part: 'PAIR', slotIndex: 1, slotCount: 2 })
    const model = prepareModel(source, plane(), { v16, physical: false })
    expect(byName(model.group, 'PUMP_HOUSING/PAINT/whole/cad')).toBeDefined() // PAIR slot 0
    expect(byName(model.group, 'PUMP_HOUSING/LACQUER/whole/cad')).toBeDefined() // PAIR slot 1
    expect(byName(model.group, 'PUMP_HOUSING/BRASS/whole/cad')).toBeDefined() // SINGLE_ON_TWO: one slot, both prims
    expect(model.counts.unmappedMultiSlot).toBe(1) // TRIPLE_ON_TWO, by part not by primitive
    // PAIR (2 primitives), SINGLE_ON_TWO (2), and the fake RL300-P-FFM-1001-1 and EXHAUST_PIPE-1 the builder always adds (1 each).
    expect(model.counts.mappedParts).toBe(4)
    expect(model.counts.mappedPrimitives).toBe(6)
    model.dispose()
  })

  it('keeps RL300-P-FFM-1001-1 whole, unrepainted and on its V16 look', () => {
    expect(PART_POLICY['RL300-P-FFM-1001-1']).toBe('keep')
    const { source, roots } = build()
    // The fake build already holds one stainless FFM mesh under PUMP_HOUSING; it is the part.
    roots.PUMP_HOUSING.children.find(c => c.name === 'RL300-P-FFM-1001-1')!.removeFromParent()
    const m = new Mesh(box(.7), base('MSP_BLACK_CHASSIS')); m.name = 'RL300-P-FFM-1001-1'; roots.COMPOSITE_PANELS.add(m)
    const model = prepareModel(source, plane(), { v16, physical: true })
    expect(model.parts['RL300-P-FFM-1001-1']).toMatchObject({ policy: 'keep', clipped: false, repainted: false })
    expect(byName(model.group, 'COMPOSITE_PANELS/LACQUER/whole/cad')).toBeDefined()
    model.dispose()
  })

  it('makes only the lens transparent, in its own bucket, after the opaque equipment', () => {
    const { source, roots } = build()
    const extras = new Group()
    const dials = new Group(); dials.name = 'GAUGE_DIALS'; extras.add(dials)
    const face = new Mesh(box(0), base('SOLID')); face.name = 'FACE'; dials.add(face)
    const lens = new Mesh(box(0), base('GLASS')); lens.name = 'LENS'; dials.add(lens)
    const lensMap: V16Map = { ...v16, parts: { ...v16.parts, FACE: { v16: ['SOLID'], glbPrims: null }, LENS: { v16: ['GLASS'], glbPrims: null } } }
    expect(roots.PUMP_HOUSING).toBeDefined()
    const model = prepareModel(source, plane(), { v16: lensMap, physical: true, extras })
    const glass = byName(model.group, 'GAUGE_DIALS/GLASS/whole/cad')!
    const solid = byName(model.group, 'GAUGE_DIALS/SOLID/whole/cad')!
    const gm = glass.material as MeshStandardMaterial
    expect([gm.transparent, gm.opacity, gm.depthWrite, gm.forceSinglePass]).toEqual([true, .0337, false, true])
    expect(glass.renderOrder).toBeGreaterThan(solid.renderOrder)
    expect(glass.userData.lens).toBe(true)
    expect(meshes(model.group).filter(m => (m.material as MeshStandardMaterial).transparent)).toEqual([glass])
    expect(model.counts.extraParts).toBe(2)
    model.dispose()
  })

  it('prepares the extras in the same call: shared buckets, never cut or capped, dials and pipe whole', () => {
    const { source } = build()
    const extras = new Group()
    const duct = new Group(); duct.name = 'DUCT_EXHAUST'; extras.add(duct)
    const pipe = new Mesh(box(0), base('MSP_STAINLESS_FASTENER')); pipe.name = 'EXHAUST_CONNECTOR_PIPE'; duct.add(pipe)
    const dials = new Group(); dials.name = 'GAUGE_DIALS'; extras.add(dials)
    const bezel = new Mesh(box(.1), base('MSP_YELLOW_PAINT')); bezel.name = 'BREP1001'; dials.add(bezel)
    const extrasMap: V16Map = {
      ...v16,
      materials: { ...v16.materials, MSP_STAINLESS_FASTENER: material({ roughness: .3 }), MSP_YELLOW_PAINT: material({ roughness: .5 }) },
      parts: { ...v16.parts, EXHAUST_CONNECTOR_PIPE: { v16: ['MSP_STAINLESS_FASTENER'], glbPrims: null } },
    }
    const model = prepareModel(source, plane(), { v16: extrasMap, physical: true, extras })
    // Round 2: the connector pipe is `keep` (visible through the section), so it is whole and never capped.
    const pipeBucket = byName(model.group, 'DUCT_EXHAUST/MSP_STAINLESS_FASTENER/whole/cad')!
    expect((pipeBucket.material as MeshStandardMaterial).clippingPlanes).toBeNull()
    expect(model.sections.map(s => s.name)).not.toContain('DUCT_EXHAUST')
    // Under a non-shell root, never the shell blue even when the material is yellow paint.
    const bezelBucket = byName(model.group, 'GAUGE_DIALS/MSP_YELLOW_PAINT/whole/cad')!
    expect((bezelBucket.material as MeshStandardMaterial).clippingPlanes).toBeNull()
    expect(meshes(model.group).some(m => m.name.endsWith('/#193f66') && m.userData.sourceRoot === 'GAUGE_DIALS')).toBe(false)
    expect(model.counts.extraParts).toBe(2)
    expect(model.counts.extraTriangles).toBe(24)
    // The fake liner box (12) and the ruled push-on seal (12) are omitted; the extras are kept, so both totals include them.
    expect(model.counts.sourceTriangles - model.counts.keptTriangles).toBe(12 + model.counts.removedTriangles)
    expect(model.counts.removedTriangles).toBe(12)
    model.dispose()
  })
})

// ---- the real GLBs, when present ---------------------------------------------------------
const modelPath = (name: string) => fileURLToPath(new URL(`../../../public/models/${name}`, import.meta.url))
const haveAssets = ['msp-enclosure.glb', 'rl300-lite.glb', 'rl300-extra-parts.glb'].every(f => fs.existsSync(modelPath(f)))

async function loadGlb(file: string): Promise<Group> {
  const draco3d = createRequire(import.meta.url)('draco3d')
  const mod = await draco3d.createDecoderModule({})
  // Node stand-in for DRACOLoader (which needs a worker): same contract, three attributes only.
  const stub = {
    preload() {},
    decodeDracoFile(buffer: ArrayBuffer, callback: (g: BufferGeometry) => void, ids: Record<string, number>, _t: unknown, _c: unknown, onError: (e: unknown) => void) {
      try {
        const array = new Int8Array(buffer)
        const decoder = new mod.Decoder(), dm = new mod.Mesh()
        const st = decoder.DecodeArrayToMesh(array, array.byteLength, dm)
        if (!st.ok()) throw new Error(st.error_msg())
        const g = new BufferGeometry(), n = dm.num_points()
        for (const name in ids) {
          const attr = decoder.GetAttributeByUniqueId(dm, ids[name]), items = attr.num_components()
          const out = new mod.DracoFloat32Array()
          decoder.GetAttributeFloatForAllPoints(dm, attr, out)
          const a = new Float32Array(n * items)
          for (let i = 0; i < a.length; i++) a[i] = out.GetValue(i)
          mod.destroy(out)
          g.setAttribute(name, new Float32BufferAttribute(a, items))
        }
        const nf = dm.num_faces(), idx = new Uint32Array(nf * 3), ia = new mod.DracoInt32Array()
        for (let f = 0; f < nf; f++) { decoder.GetFaceFromMesh(dm, f, ia); idx.set([ia.GetValue(0), ia.GetValue(1), ia.GetValue(2)], f * 3) }
        mod.destroy(ia); mod.destroy(dm); mod.destroy(decoder)
        g.setIndex(new Uint32BufferAttribute(idx, 1))
        callback(g)
      } catch (e) { onError(e) }
    },
  }
  const bytes = fs.readFileSync(modelPath(file))
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const loader = new GLTFLoader().setDRACOLoader(stub as never)
  return new Promise((resolve, reject) => loader.parse(ab, '', gltf => resolve(gltf.scene), reject))
}

describe.skipIf(!haveAssets)('V16 map over the shipped GLBs', () => {
  const v16 = v16Json as unknown as V16Map
  it('delivers multi-primitive parts as a named group of Mesh_N primitives in order', async () => {
    const scene = await loadGlb('msp-enclosure.glb')
    const group = scene.getObjectByName('RL200-SIF-1005-1')!
    expect(group).toBeDefined()
    expect(group instanceof Mesh).toBe(false)
    expect(group.children.map(c => c.name)).toEqual(['Mesh_422', 'Mesh_422_1'])
    expect(locatePart(group.children[1] as Mesh, v16.parts)).toEqual({ part: 'RL200-SIF-1005-1', slotIndex: 1, slotCount: 2 })
    // The single-primitive form is the mesh itself.
    expect(locatePart(scene.getObjectByName('RL300-P-FFM-1001-1') as Mesh, v16.parts)).toEqual({ part: 'RL300-P-FFM-1001-1', slotIndex: 0, slotCount: 1 })
  })

  it('full tier: V16 applied, 36 multi-slot mismatches counted, extras prepared, invariants hold', async () => {
    const main = await loadGlb('msp-enclosure.glb')
    const extras = await loadGlb('rl300-extra-parts.glb')
    const model = prepareModel(main, plane(), { v16, physical: true, extras })
    const c = model.counts
    expect(c).toMatchObject({ v16Applied: true, unmappedMultiSlot: 36, extraParts: 19, extraTriangles: 13411, removedTriangles: 460, linerTriangles: 108, replacedTriangles: 4000, cappedTriangles: 152008, batches: 49, mappedParts: 520 })
    // extras 19 meshes: 11 dial/connector (7248 triangles) + the 8 MAN meshes (6163) that replace the 4000-triangle fused MAN mesh.
    // mappedParts 520 = 501 main (the replaced fused MAN is gone) + 19 extras.
    // liner 108 + airway helper 28 + the ruled push-on seal + the replaced fused MAN mesh: nothing else is omitted, extras included.
    expect(c.sourceTriangles - c.keptTriangles).toBe(108 + 28 + 460 + c.replacedTriangles)
    expect(c.materials).toBe(c.batches)
    // Only the two dial lenses are glass, in one bucket.
    expect(meshes(model.group).filter(m => (m.material as MeshStandardMaterial).transparent)).toHaveLength(1)
    // FFM-1001-1 is whole and unrepainted.
    expect(model.parts['RL300-P-FFM-1001-1']).toMatchObject({ policy: 'keep', clipped: false, repainted: false, triangles: 674 })
    model.dispose()
  })

  it('lite tier: same map, no extras, standard materials only', async () => {
    const lite = await loadGlb('rl300-lite.glb')
    const model = prepareModel(lite, plane(), { v16, physical: false })
    const c = model.counts
    expect(c).toMatchObject({ v16Applied: true, extraParts: 0, extraTriangles: 0, removedTriangles: 460, replacedTriangles: 0, cappedTriangles: 152008, batches: 43 })
    expect(c.unmappedMultiSlot).toBe(48)
    expect(meshes(model.group).some(m => m.material instanceof MeshPhysicalMaterial)).toBe(false)
    model.dispose()
  })

  it('without options the shipped GLBs reproduce the old counts apart from the FFM-1001-1 keep ruling', async () => {
    const main = await loadGlb('msp-enclosure.glb')
    const full = prepareModel(main, plane())
    // HEAD (before the rulings): capped 154554, keptWhole 9136; FFM-1001-1 is a closed 674-triangle volume. Round 2 keeps
    // RL300-CPM-3001-1, RL300-P-CPM-2001-1 and EXHAUST PIPE-1 whole too: 4768 triangles leave the cut
    // (1872 closed from the caps, 2896 open from openSection), so keptWhole 9810 + 4768 = 14578.
    expect(full.counts).toMatchObject({ cappedTriangles: 153880 - 1872, keptWholeTriangles: 9810 + 4768, openSectionTriangles: 47390 - 2896, batches: 32 })
    full.dispose()
  })
})
