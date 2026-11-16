// @vitest-environment node
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { BoxGeometry, BufferGeometry, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, PerspectiveCamera, Texture, Vector3 } from 'three'
import type { DrawingFrameInput } from './privateSheetRuntime'
import type { ExtractionContext } from '../drawing/poseCore'

// The GLTFLoader / DRACOLoader pair is replaced so lifecycle paths (late parse, abort, partial scenes) are deterministic.
const loaderState = vi.hoisted(() => ({ parse: undefined as undefined | ((data: ArrayBuffer) => Promise<unknown>), dracoDisposed: 0, decoderPath: '' }))
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class { setDRACOLoader() { return this } parseAsync(data: ArrayBuffer) { return loaderState.parse!(data) } },
}))
vi.mock('three/addons/loaders/DRACOLoader.js', () => ({
  DRACOLoader: class { setDecoderPath(path: string) { loaderState.decoderPath = path; return this } dispose() { loaderState.dracoDisposed++ } },
}))

import { addMicroUv, createMetrologyWorkbenchProps, createMicroTextures, METROLOGY_LAYOUT, rasterizeContactShadow, type MetrologyWorkbenchPropsRuntime } from './MetrologyWorkbenchProps'
import { boxPolygon, hull, intersects, KEEP_OUT, onPlate, pointBoxDistance, type Point } from './metrologyFootprints'
import { decodeMetrologyAsset, type DecodedTool } from './metrologyAsset.testutil'

const identity = { modelMatrix: new Matrix4(), sheetMatrix: new Matrix4() } as ExtractionContext
const camera = new PerspectiveCamera(35, 16 / 9, .01, 20)
camera.position.set(0, -.55, .85); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true)
const frame = (over: Partial<Record<string, unknown>> = {}, fracture = 0) => ({
  intro: { fracture }, tier: 'full', reducedMotion: false, proofMode: 'normal', retirement: 0, cameraLookTargetWorld: null, cameraSheetDistance: 1, delta: 1 / 60, ...over,
}) as unknown as DrawingFrameInput
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
const live: MetrologyWorkbenchPropsRuntime[] = []
const make = () => { const r = createMetrologyWorkbenchProps(); live.push(r); return r }
afterEach(() => { while (live.length) live.pop()!.dispose(); vi.unstubAllGlobals(); loaderState.parse = undefined })

describe('authored layout', () => {
  it('keeps every home pose on the plate, outside the drawing keep-out and clear of every other tool', () => {
    const runtime = make(), snap = runtime.snapshot()
    expect(snap.props).toHaveLength(14)
    expect(snap.layoutAdjusted).toEqual([])
    expect(snap.violations).toEqual([])
    for (const e of METROLOGY_LAYOUT) {
      const p = runtime.props.find(q => q.id === e.id)!
      expect([p.x, p.y, p.theta]).toEqual([e.x, e.y, e.theta])
      const shape = boxPolygon(e.box, e.x, e.y, e.theta)
      expect(onPlate(shape)).toBe(true)
      expect(intersects(shape, KEEP_OUT)).toBe(false)
    }
  })
  it('constructs synchronously in Node with proxies, shaped shadow planes and no network', () => {
    const fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy)
    const runtime = make()
    expect(fetchSpy).not.toHaveBeenCalled()
    for (const p of runtime.props) {
      expect(p.root.getObjectByName('loading-proxy')).toBeTruthy()
      expect(p.root.getObjectByName('contact-AO')).toBeTruthy()
    }
    expect(runtime.snapshot().loaded).toBe(false)
  })
  it('places the height gauge stylus 0.9 mm (asset) from the V-block test shaft without footprint overlap', () => {
    const vb = METROLOGY_LAYOUT.find(e => e.id === 'v-block-clamp')!, hg = METROLOGY_LAYOUT.find(e => e.id === 'height-gauge-dial')!
    expect(hg.theta).toBe(vb.theta)
    const gap = (() => { // separation along the shaft axis between the two footprints
      const a = [Math.cos(vb.theta), Math.sin(vb.theta)]
      const d = (e: typeof vb, lx: number) => (e.x + lx * a[0]) * a[0] + (e.y + lx * a[1]) * a[1]
      return d(vb, vb.box[0]) - d(hg, hg.box[1])
    })()
    expect(gap).toBeGreaterThan(.0002); expect(gap).toBeLessThan(.0008)
    expect(intersects(boxPolygon(vb.box, vb.x, vb.y, vb.theta), boxPolygon(hg.box, hg.x, hg.y, hg.theta))).toBe(false)
  })
})

describe('decoded asset (real GLB geometry)', () => {
  let tools: DecodedTool[]
  beforeAll(async () => { tools = await decodeMetrologyAsset() }, 60000)
  it('has all 14 roots, rests on z >= 0 and stays inside its footprint box and roll envelope', () => {
    expect(tools.map(t => t.id).sort()).toEqual(METROLOGY_LAYOUT.map(e => e.id).sort())
    for (const e of METROLOGY_LAYOUT) {
      const tool = tools.find(t => t.id === e.id)!
      let minZ = Infinity, radial = 0
      for (const prim of tool.primitives) for (let i = 0; i < prim.positions.length; i += 3) {
        const x = prim.positions[i], y = prim.positions[i + 1], z = prim.positions[i + 2]
        minZ = Math.min(minZ, z)
        expect(x).toBeGreaterThanOrEqual(e.box[0]); expect(x).toBeLessThanOrEqual(e.box[1])
        if (e.kind === 'roller') radial = Math.max(radial, Math.hypot(y, z - e.radius))
        else { expect(y).toBeGreaterThanOrEqual(e.box[2]); expect(y).toBeLessThanOrEqual(e.box[3]) }
      }
      expect(minZ).toBeGreaterThanOrEqual(-1e-4)
      if (e.kind === 'roller') expect(radial).toBeLessThanOrEqual(Math.max(-e.box[2], e.box[3]))
    }
  }, 60000)
  it('puts every roller axis where its turned surfaces are centred (circle fit on cylinder vertices, not global bounds)', () => {
    // Kasa circle fit in (y, z) per material; only materials whose vertices are a real turned section (radius > 2.5 mm).
    const fit = (pts: Array<[number, number]>) => {
      const n = pts.length; let my = 0, mz = 0
      for (const [y, z] of pts) { my += y; mz += z }
      my /= n; mz /= n
      let syy = 0, szz = 0, syz = 0, syr = 0, szr = 0
      for (const [y, z] of pts) { const u = y - my, v = z - mz, r = u * u + v * v; syy += u * u; szz += v * v; syz += u * v; syr += u * r; szr += v * r }
      const det = syy * szz - syz * syz
      if (Math.abs(det) < 1e-24) return null
      const cy = my + (syr * szz - szr * syz) / (2 * det), cz = mz + (szr * syy - syr * syz) / (2 * det)
      const radii = pts.map(([y, z]) => Math.hypot(y - cy, z - cz)), r = radii.reduce((s, v) => s + v, 0) / n
      return { cy, cz, r, spread: (Math.max(...radii) - Math.min(...radii)) / r }
    }
    let checked = 0
    for (const e of METROLOGY_LAYOUT.filter(l => l.kind === 'roller')) {
      const byMaterial = new Map<string, Array<[number, number]>>()
      for (const prim of tools.find(t => t.id === e.id)!.primitives) {
        const list = byMaterial.get(prim.material) ?? []
        for (let i = 0; i < prim.positions.length; i += 3) list.push([prim.positions[i + 1], prim.positions[i + 2]])
        byMaterial.set(prim.material, list)
      }
      let agreeing = 0
      for (const pts of byMaterial.values()) {
        const f = pts.length > 100 ? fit(pts) : null
        // Only genuine turned sections (near-constant radius); clips, cones and text are not axis references.
        if (!f || f.r < .0025 || f.spread > .25) continue
        expect(Math.abs(f.cy)).toBeLessThan(1e-4)
        expect(Math.abs(f.cz - e.radius)).toBeLessThan(1.2e-4)
        agreeing++
      }
      expect(agreeing).toBeGreaterThanOrEqual(2); checked++
    }
    expect(checked).toBe(5)
  }, 60000)
  it('meets the triangle and payload budgets and the lite tier removes the detail-* nodes', () => {
    let full = 0, detail = 0
    for (const tool of tools) for (const prim of tool.primitives) { full += prim.indices.length / 3; if (prim.node.startsWith('detail-')) detail += prim.indices.length / 3 }
    expect(full).toBeLessThanOrEqual(120000)
    expect(detail).toBeGreaterThan(5000)
    expect(full - detail).toBeLessThan(full * .85)
    const bytes = readFileSync(fileURLToPath(new URL('../../../public/models/metrology-tools.glb', import.meta.url)))
    expect(gzipSync(bytes).length).toBeLessThan(1.5 * 1024 * 1024)
  })
  it('keeps the ruby stylus on the V-block shaft axis, 0.7-1.1 mm from the shaft end face', () => {
    const vb = METROLOGY_LAYOUT.find(e => e.id === 'v-block-clamp')!, hg = METROLOGY_LAYOUT.find(e => e.id === 'height-gauge-dial')!
    const a = [Math.cos(vb.theta), Math.sin(vb.theta)], n = [-a[1], a[0]]
    const world = (e: typeof vb, x: number, y: number) => [e.x + x * Math.cos(e.theta) - y * Math.sin(e.theta), e.y + x * Math.sin(e.theta) + y * Math.cos(e.theta)]
    const shaft = tools.find(t => t.id === vb.id)!.primitives.filter(p => p.material === 'lap')
    const ruby = tools.find(t => t.id === hg.id)!.primitives.filter(p => p.material === 'ruby')
    expect(shaft.length).toBeGreaterThan(0); expect(ruby.length).toBeGreaterThan(0)
    let shaftMin = Infinity, shaftZ0 = Infinity, shaftZ1 = -Infinity
    for (const p of shaft) for (let i = 0; i < p.positions.length; i += 3) { const w = world(vb, p.positions[i], p.positions[i + 1]); shaftMin = Math.min(shaftMin, w[0] * a[0] + w[1] * a[1]); shaftZ0 = Math.min(shaftZ0, p.positions[i + 2]); shaftZ1 = Math.max(shaftZ1, p.positions[i + 2]) }
    let rubyMax = -Infinity, lateral = 0, count = 0, zc = 0
    for (const p of ruby) for (let i = 0; i < p.positions.length; i += 3) { const w = world(hg, p.positions[i], p.positions[i + 1]); rubyMax = Math.max(rubyMax, w[0] * a[0] + w[1] * a[1]); lateral += w[0] * n[0] + w[1] * n[1]; zc += p.positions[i + 2]; count++ }
    const vbLateral = vb.x * n[0] + vb.y * n[1]
    expect(shaftMin - rubyMax).toBeGreaterThan(.0007); expect(shaftMin - rubyMax).toBeLessThan(.0011)
    expect(Math.abs(lateral / count - vbLateral)).toBeLessThan(.0006)
    expect(zc / count).toBeGreaterThan(shaftZ0); expect(zc / count).toBeLessThan(shaftZ1)
  })
  it('never lets a real vertex cross the keep-out or leave the plate under cursor, nudge and shockwave stress', () => {
    const runtime = make(), random = rng(7), ids = METROLOGY_LAYOUT.map(e => e.id)
    // The XY convex hull of the real vertices is exact for every extreme-point test below.
    const hulls = new Map(tools.map(t => [t.id, hull(t.primitives.flatMap(q => { const out: Point[] = []; for (let i = 0; i < q.positions.length; i += 3) out.push([q.positions[i], q.positions[i + 1]]); return out }))]))
    let worst = 0
    const check = () => {
      const snap = runtime.snapshot(); expect(snap.violations).toEqual([])
      let bad = 0
      for (const p of runtime.props) {
        const c = Math.cos(p.theta), s = Math.sin(p.theta)
        for (const [vx, vy] of hulls.get(p.id)!) {
          const x = p.x + vx * c - vy * s, y = p.y + vx * s + vy * c
          if (Math.abs(x) < .404 && Math.abs(y) < .254) bad++
          if (Math.abs(x) > .68 || Math.abs(y) > .45) bad++
          for (const o of runtime.props) if (o !== p && pointBoxDistance(x, y, o.box, o.x, o.y, o.theta) <= 0) bad++
        }
        worst = Math.max(worst, Math.hypot(p.x - p.homeX, p.y - p.homeY))
      }
      expect(bad).toBe(0)
    }
    for (let k = 0; k < 2400; k++) {
      const id = ids[Math.floor(random() * ids.length)]
      if (k % 3 === 0) runtime.nudgeProp(id, (random() - .5) * .4, (random() - .5) * .4, (random() - .5) * 3)
      runtime.onPointerMove(random() * 2 - 1, random() * 2 - 1)
      // shockwave at k=900 (fracture crosses .04) then relaxes
      runtime.update(frame({}, k >= 900 && k < 1500 ? .05 : 0), identity, camera)
      if (k % 20 === 0) check()
    }
    check()
    expect(worst).toBeGreaterThan(.0005)
    expect(runtime.snapshot().interactionCount).toBeGreaterThan(100)
  }, 60000)
})

describe('physics', () => {
  it('couples roller spin to transverse travel about the true cylinder axis', () => {
    const runtime = make(), pencil = runtime.props.find(p => p.id === 'pencil-rotring-600')!
    const x0 = pencil.x, y0 = pencil.y
    expect(runtime.nudgeProp('pencil-rotring-600', .03, .02, 0)).toBe(true)
    const transverse = -Math.sin(pencil.theta) * (pencil.x - x0) + Math.cos(pencil.theta) * (pencil.y - y0)
    expect(Math.abs(transverse)).toBeGreaterThan(1e-6)
    expect(pencil.rollAngle * pencil.radius).toBeCloseTo(-transverse, 9)
  })
  it('freezes at the authored home pose in reduced motion and ignores input until motion returns', () => {
    const runtime = make()
    runtime.nudgeProp('micrometer-0-25mm', .05, .02, .3); runtime.update(frame(), identity, camera)
    expect(runtime.snapshot().props.some(p => p.displacedMm > 0)).toBe(true)
    runtime.update(frame({ reducedMotion: true }, .2), identity, camera)
    const snap = runtime.snapshot()
    expect(snap.frozen).toBe(true); expect(snap.visible).toBe(true)
    for (const p of snap.props) expect(p.displacedMm).toBe(0)
    expect(runtime.nudgeProp('micrometer-0-25mm', .05, 0)).toBe(false)
    runtime.onPointerMove(0, 0); runtime.update(frame({ reducedMotion: true }), identity, camera)
    expect(runtime.snapshot().interactionCount).toBe(1)
    runtime.update(frame(), identity, camera)
    expect(runtime.nudgeProp('micrometer-0-25mm', .05, 0)).toBe(true)
  })
  it('hides for drawing-edges proof mode and after retirement unless motion is reduced', () => {
    const runtime = make()
    runtime.update(frame(), identity, camera); expect(runtime.group.visible).toBe(true)
    runtime.update(frame({ proofMode: 'drawing-edges' }), identity, camera); expect(runtime.group.visible).toBe(false)
    runtime.update(frame({ retirement: 1 }), identity, camera); expect(runtime.group.visible).toBe(false)
    runtime.update(frame({ retirement: 1, reducedMotion: true }), identity, camera); expect(runtime.group.visible).toBe(true)
  })
})

describe('finish maps and shaped shadows', () => {
  it('generates identical, bounded normal and roughness maps', () => {
    const a = createMicroTextures(), b = createMicroTextures()
    expect(Array.from(a.normal.image.data as Uint8Array)).toEqual(Array.from(b.normal.image.data as Uint8Array))
    const n = a.normal.image.data as Uint8Array, r = a.roughness.image.data as Uint8Array
    let minR = 255, varied = new Set<number>()
    for (let i = 0; i < n.length; i += 4) {
      const x = n[i] / 127.5 - 1, y = n[i + 1] / 127.5 - 1, z = n[i + 2] / 127.5 - 1
      expect(Math.hypot(x, y, z)).toBeGreaterThan(.97); expect(Math.hypot(x, y, z)).toBeLessThan(1.03); expect(z).toBeGreaterThan(.3)
      minR = Math.min(minR, r[i + 1]); varied.add(r[i + 1])
    }
    expect(minR).toBeGreaterThanOrEqual(Math.floor(.84 * 255)); expect(varied.size).toBeGreaterThan(12)
    for (const t of [a.normal, a.roughness]) { t.dispose() }
  })
  it('rasterises a silhouette-matched shadow that is dark under the tool and soft outside it', () => {
    // An L-shaped plate: 40 x 10 mm bar plus a 10 x 20 mm leg, lying on the table (z = 0).
    const quad = (x0: number, y0: number, x1: number, y1: number, base: number) => ({ v: [x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0], i: [base, base + 1, base + 2, base, base + 2, base + 3] })
    const a = quad(-.02, -.005, .02, .005, 0), b = quad(-.02, .005, -.01, .025, 4)
    const box = [-.02, .02, -.005, .025] as const
    const r = rasterizeContactShadow([...a.v, ...b.v], [...a.i, ...b.i], box)
    const alphaAt = (x: number, y: number) => r.data[(Math.floor((y - r.y0) / r.h * r.height) * r.width + Math.floor((x - r.x0) / r.w * r.width)) * 4 + 3]
    expect(alphaAt(0, 0)).toBeGreaterThan(150)
    expect(alphaAt(-.015, .018)).toBeGreaterThan(120)           // inside the leg
    expect(alphaAt(.015, .018)).toBeLessThan(alphaAt(-.015, .018) * .5) // notch beside the leg is lighter
    expect(alphaAt(.0, .0215)).toBeLessThan(alphaAt(0, .0))
    expect(alphaAt(.024, .0)).toBeLessThan(90); expect(alphaAt(.024, .0)).toBeGreaterThan(0) // soft falloff beyond the end
    expect(alphaAt(.032, .022)).toBeLessThan(12)
  })
  it('adds a second box-projected UV set without touching the authored uv', () => {
    const geometry = new BoxGeometry(.02, .01, .005), uv = Array.from(geometry.getAttribute('uv').array)
    addMicroUv(geometry)
    expect(geometry.getAttribute('uv1').count).toBe(geometry.getAttribute('position').count)
    expect(Array.from(geometry.getAttribute('uv').array)).toEqual(uv)
  })
})

/** Synthetic Y-up asset with every layout root: bodies hug each layout box, rollers are true cylinders on their axis. */
function syntheticScene(options: { omit?: string } = {}) {
  const scene = new Group(), meshes: Mesh[] = []
  const finish = new MeshStandardMaterial({ name: 'steel', roughness: .4 }), ink = new MeshStandardMaterial({ name: 'ink' })
  for (const e of METROLOGY_LAYOUT) {
    if (e.id === options.omit) continue
    const root = new Group(); root.name = e.id
    const [x0, x1, y0, y1] = e.box, sx = x1 - x0 - .0004, sy = y1 - y0 - .0004
    let geometry: BufferGeometry
    if (e.kind === 'roller') { geometry = new CylinderGeometry(e.radius, e.radius, sx, 24); geometry.rotateZ(Math.PI / 2); geometry.translate((x0 + x1) / 2, e.radius, 0) }
    else { geometry = new BoxGeometry(sx, .01, sy); geometry.translate((x0 + x1) / 2, .005, -(y0 + y1) / 2) }
    const body = new Mesh(geometry, finish); body.name = e.id + '-steel'
    const detail = new Mesh(new BoxGeometry(.001, .0005, .001), ink); detail.name = 'detail-' + e.id + '-ink'; detail.position.set((x0 + x1) / 2, e.kind === 'roller' ? e.radius : .0101, 0)
    root.add(body, detail); meshes.push(body, detail); scene.add(root)
  }
  return { scene, meshes, finish, ink }
}
const okFetch = () => vi.fn(async (_url: string, init?: { signal?: AbortSignal }) => ({ ok: true, status: 200, arrayBuffer: async () => { if (init?.signal?.aborted) throw new DOMException('aborted', 'AbortError'); return new ArrayBuffer(8) } }))

describe('loading lifecycle', () => {
  it('commits a valid asset: proxies swapped out, finish maps, lite triangles, rest on the table, local Draco path', async () => {
    const synth = syntheticScene(); loaderState.parse = async () => ({ scene: synth.scene }); vi.stubGlobal('fetch', okFetch())
    const runtime = make(), loadedSpy = vi.fn()
    await runtime.startLoading(loadedSpy)
    const snap = runtime.snapshot()
    expect(snap.loadError).toBeNull(); expect(snap.loaded).toBe(true); expect(loadedSpy).toHaveBeenCalledTimes(1)
    expect(loaderState.decoderPath.endsWith('draco/')).toBe(true); expect(loaderState.dracoDisposed).toBeGreaterThan(0)
    expect(snap.assetTriangles).toBeGreaterThan(snap.liteTriangles); expect(snap.liteTriangles).toBeGreaterThan(0)
    for (const p of runtime.props) expect(p.root.getObjectByName('loading-proxy')).toBeUndefined()
    for (const p of snap.props) { expect(p.localBounds!.min[2]).toBeGreaterThanOrEqual(-1e-6); expect(p.asset!.drawCalls).toBe(2); expect(p.asset!.materials).toEqual(['ink', 'steel']) }
    expect(synth.finish.normalMap).toBeTruthy(); expect(synth.finish.roughnessMap).toBeTruthy(); expect(synth.ink.normalMap).toBeNull()
    expect(synth.meshes[0].geometry.getAttribute('uv1')).toBeTruthy()
    expect(snap.violations).toEqual([])
    runtime.update(frame({ tier: 'lite' }), identity, camera)
    expect(runtime.snapshot().visibleTriangles).toBe(snap.liteTriangles)
    expect(synth.meshes[1].visible).toBe(false)
    runtime.update(frame({ tier: 'full' }), identity, camera); expect(synth.meshes[1].visible).toBe(true)
  })
  it('rolls cylinders about their own axis and keeps them resting on the table at any angle', async () => {
    const synth = syntheticScene(); loaderState.parse = async () => ({ scene: synth.scene }); vi.stubGlobal('fetch', okFetch())
    const runtime = make(); await runtime.startLoading()
    for (const id of ['pencil-rotring-600', 'pin-gauge-10mm', 'plug-gauge-gonogo']) {
      const p = runtime.props.find(q => q.id === id)!
      for (const angle of [0, .4, 1.1, 2.3, -3.0, 5.2]) {
        p.rollAngle = angle; runtime.nudgeProp(id, 0, 0, 0)
        p.root.updateMatrixWorld(true)
        let minZ = Infinity
        p.rollerMesh.traverse(o => { if (o instanceof Mesh && !o.name.startsWith('detail-')) { const pos = o.geometry.getAttribute('position'); for (let i = 0; i < pos.count; i++) minZ = Math.min(minZ, o.localToWorld(new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))).z) } })
        expect(minZ - (-.0016 + .00015)).toBeCloseTo(0, 6)
      }
    }
  })
  it('releases parsed resources when the asset is missing a root and keeps clean proxies', async () => {
    const synth = syntheticScene({ omit: 'v-block-clamp' }); loaderState.parse = async () => ({ scene: synth.scene }); vi.stubGlobal('fetch', okFetch())
    const disposed: string[] = []; synth.meshes.forEach(m => m.geometry.addEventListener('dispose', () => disposed.push(m.name)))
    const runtime = make(); await runtime.startLoading()
    const snap = runtime.snapshot()
    expect(snap.loaded).toBe(false); expect(snap.loadError).toContain('Missing asset root v-block-clamp')
    expect(disposed.length).toBe(synth.meshes.length)
    for (const p of runtime.props) expect(p.root.getObjectByName('loading-proxy')).toBeTruthy()
    expect(synth.finish.normalMap).toBeNull()
  })
  it('rejects an asset that exceeds its footprint without partial swaps', async () => {
    const synth = syntheticScene(); (synth.meshes[0].geometry as BufferGeometry).translate(.05, 0, 0)
    loaderState.parse = async () => ({ scene: synth.scene }); vi.stubGlobal('fetch', okFetch())
    const runtime = make(); await runtime.startLoading()
    expect(runtime.snapshot().loadError).toContain('Asset exceeds footprint')
    expect(runtime.snapshot().assetTriangles).toBe(0)
    for (const p of runtime.props) expect(p.root.getObjectByName('loading-proxy')).toBeTruthy()
  })
  it('disposes a parse that resolves after dispose and never reports loaded', async () => {
    const synth = syntheticScene(); let release!: () => void
    loaderState.parse = () => new Promise(resolve => { release = () => resolve({ scene: synth.scene }) }); vi.stubGlobal('fetch', okFetch())
    const disposed: string[] = []; synth.meshes.forEach(m => m.geometry.addEventListener('dispose', () => disposed.push(m.name)))
    const runtime = make(), loadedSpy = vi.fn(), done = runtime.startLoading(loadedSpy)
    await vi.waitFor(() => expect(release).toBeTypeOf('function'))
    runtime.dispose(); release(); await done
    const snap = runtime.snapshot()
    expect(snap.loaded).toBe(false); expect(snap.loadError).toBeNull(); expect(snap.disposed).toBe(true); expect(loadedSpy).not.toHaveBeenCalled()
    expect(disposed.length).toBe(synth.meshes.length)
    expect(synth.finish.normalMap).toBeNull()
  })
  it('aborts the fetch on dispose without surfacing an error', async () => {
    let signal: AbortSignal | undefined
    vi.stubGlobal('fetch', vi.fn((_u: string, init?: { signal?: AbortSignal }) => new Promise((_r, reject) => { signal = init?.signal; signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))) })))
    const runtime = make(), done = runtime.startLoading()
    await vi.waitFor(() => expect(signal).toBeDefined())
    runtime.dispose(); await done
    expect(signal!.aborted).toBe(true); expect(runtime.snapshot().loadError).toBeNull()
    await expect(runtime.startLoading()).resolves.toBeUndefined()
  })
  it('surfaces HTTP failures and keeps the runtime usable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    const runtime = make(); await runtime.startLoading()
    expect(runtime.snapshot().loadError).toBe('Metrology HTTP 404'); expect(runtime.snapshot().loaded).toBe(false)
    runtime.update(frame(), identity, camera); expect(runtime.snapshot().visible).toBe(true)
  })
  it('disposes every owned geometry, material and texture exactly once on unmount', async () => {
    const synth = syntheticScene(); loaderState.parse = async () => ({ scene: synth.scene }); vi.stubGlobal('fetch', okFetch())
    const geometries = new Set<BufferGeometry>(), materials = new Set<unknown>(), textures = new Set<Texture>(), counts = new Map<unknown, number>()
    const spy = (o: { addEventListener: (t: 'dispose', f: () => void) => void }) => o.addEventListener('dispose', () => counts.set(o, (counts.get(o) ?? 0) + 1))
    const runtime = make(); await runtime.startLoading()
    runtime.group.traverse(o => { if (o instanceof Mesh) { geometries.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) { materials.add(m); for (const v of Object.values(m)) if (v instanceof Texture) textures.add(v) } } })
    for (const o of [...geometries, ...materials as Set<MeshStandardMaterial>, ...textures]) spy(o as never)
    expect(textures.size).toBeGreaterThan(2)
    runtime.dispose(); runtime.dispose()
    for (const o of [...geometries, ...materials, ...textures]) expect(counts.get(o)).toBe(1)
    expect(runtime.group.children.length).toBe(0)
  })
  it('hides and restores every prop and shadow material for measurement without moving the group', async () => {
    const synth = syntheticScene(); loaderState.parse = async () => ({ scene: synth.scene }); vi.stubGlobal('fetch', okFetch())
    const runtime = make(); runtime.setMeasurementHidden(true); await runtime.startLoading()
    runtime.update(frame(), identity, camera)
    const mats = new Set<MeshStandardMaterial>(); runtime.group.traverse(o => { if (o instanceof Mesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) mats.add(m as MeshStandardMaterial) })
    expect(mats.size).toBeGreaterThan(15); expect([...mats].every(m => m.visible === false)).toBe(true); expect(runtime.group.visible).toBe(true)
    runtime.setMeasurementHidden(false); expect([...mats].every(m => m.visible === true)).toBe(true)
    expect(runtime.snapshot().measurementHidden).toBe(false)
  })
})
