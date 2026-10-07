import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ts from 'typescript'
import { Box3, BoxGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Scene, Texture, Vector3 } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createStorySession, sharedStoryRefCount, type StorySession } from '../session'
import type { StoryContext, StoryRuntime } from '../story'
import { GEAR_RATIOS } from '../../../data/caseStudies'
import { narrativeModelToStudy, placeHob, placeShaper, shaftLocalToStudy, shaftMmPoint, studyPointToShaftMm, studyToShaftLocal } from './frame'
import { createShaftKinematicsFrame, sampleShaftKinematics, strokePhaseAt, WORK_RATE } from './kinematics'
import { SPACE_CLOCK_RAD, SPACE_PITCH_RAD } from './progression'
import { HOB_LEAD_ANGLE_DEG, SHAPER_THICKNESS_MM, SHAPER_TIP_RADIUS_MM } from './toolSpec'
import { createShaftSchedule, sampleShaftSchedule } from './schedule'
import { createShaftRuntime, exportedNodeBounds, measureSupportDelta, readShaftBundleDocument, type ShaftBundleDocument } from './shaftRuntime'
import { buildShaperCutter } from './tools'

function bundle(tier: 'full' | 'lite' = 'full'): ArrayBuffer {
  const b = readFileSync(resolve('public/models/manufacturing-core-' + tier + '.glb'))
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
}

/** No-WebGL parser stand-in: each exported POSITION union becomes a box with baked
 * vertex coordinates. Runtime tests exercise the real factory, not GPU/Draco decoding.
 */
function testScene(doc: ShaftBundleDocument, housingName = 'housing', legacyHousing = false): Group {
  const scene = new Group(), bounds = new Box3(), size = new Vector3(), center = new Vector3()
  for (const node of doc.nodes) {
    if (!node.name || node.mesh === undefined) continue
    if (node.name === 'legacyhousing' && !legacyHousing) continue
    exportedNodeBounds(doc, node.name, bounds); bounds.getSize(size); bounds.getCenter(center)
    const geometry = new BoxGeometry(size.x, size.y, size.z).translate(center.x, center.y, center.z)
    const mesh = new Mesh(geometry, new MeshStandardMaterial())
    mesh.name = node.name === 'housing' || node.name === 'approvedhousing' ? housingName : node.name
    scene.add(mesh)
  }
  if (legacyHousing && !scene.getObjectByName('legacyhousing')) {
    const original = scene.getObjectByName(housingName) as Mesh
    const witness = new Mesh(original.geometry.clone(), new MeshStandardMaterial()); witness.name = 'legacyhousing'; scene.add(witness)
  }
  return scene
}

const runtimes: StoryRuntime[] = []
afterEach(() => { runtimes.forEach(runtime => runtime.dispose()); runtimes.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals() })

function context(rig: unknown = null): StoryContext {
  const hero = new Group()
  Object.defineProperty(hero, 'matrixWorld', { get() { throw new Error('Forbidden hero.matrixWorld read') } })
  return { gl: { toneMappingExposure: 1.1 } as StoryContext['gl'], scene: new Scene(), hero, rig, tier: 'full', aspect: 16 / 9 }
}
function session(): StorySession { return createStorySession('shaft', { id: 91, current: () => true, fail: vi.fn() }) }
async function fixture(options: { housing?: string; legacyHousing?: boolean; rig?: unknown; tier?: 'full' | 'lite' } = {}) {
  const data = bundle(options.tier), doc = readShaftBundleDocument(data)
  const scene = testScene(doc, options.housing, options.legacyHousing)
  const parsed = { scene, scenes: [scene], animations: [] } as unknown as GLTF
  const parse = vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockResolvedValue(parsed)
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => data })
  vi.stubGlobal('fetch', fetchMock)
  const ctx = context(options.rig); ctx.tier = options.tier ?? 'full'
  const lease = session(), runtime = createShaftRuntime(lease, ctx); runtimes.push(runtime)
  await runtime.ready
  return { runtime, lease, fetchMock, parse, scene, doc }
}
function material(runtime: StoryRuntime, name: string): MeshStandardMaterial {
  return (runtime.root.getObjectByName(name) as Mesh).material as MeshStandardMaterial
}
function uniforms(runtime: StoryRuntime, name: string): Record<string, { value: unknown }> {
  const shader = { uniforms: {} as Record<string, { value: unknown }>, vertexShader: '#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <emissivemap_fragment>' }
  material(runtime, name).onBeforeCompile(shader as never, {} as never)
  return shader.uniforms
}
function seek(runtime: StoryRuntime, t: number): Record<string, unknown> {
  runtime.sample(t); runtime.apply(); const out: Record<string, unknown> = {}; runtime.telemetry(out); return out
}
function digest(runtime: StoryRuntime, t: number): string {
  const probe = seek(runtime, t), objects: unknown[] = []
  runtime.root.traverse(object => {
    const mesh = object as Mesh
    objects.push([object.name, object.visible, object.position.toArray(), object.quaternion.toArray(), object.scale.toArray(),
      mesh.material && !Array.isArray(mesh.material) ? [mesh.material.opacity, mesh.material.transparent, mesh.material.depthWrite] : null])
  })
  return JSON.stringify([runtime.frame, runtime.camera, runtime.render, probe, objects])
}

describe('R1 frame and actual GLB metadata', () => {
  it('maps exactly once and round-trips CAD millimetres and study metres', () => {
    const forward = shaftLocalToStudy(new Matrix4()), inverse = studyToShaftLocal(new Matrix4())
    const original = new Vector3(4, 71.5, -3), mapped = original.clone().applyMatrix4(forward)
    expect(mapped.toArray()).toEqual([0.004, -0.003, -0.07150000000000001])
    expect(mapped.clone().applyMatrix4(inverse).distanceTo(original)).toBeLessThan(1e-12)
    expect(shaftMmPoint(new Vector3(), 4, 71.5, -3).distanceTo(mapped)).toBeLessThan(1e-15)
    expect(studyPointToShaftMm(new Vector3(), mapped.x, mapped.y, mapped.z).distanceTo(original)).toBeLessThan(1e-12)
  })
  for (const tier of ['full', 'lite'] as const) {
    it(tier + ' has the measured -Z shaft axis and exported +2.750 mm rigid support delta', () => {
      const data = bundle(tier), doc = readShaftBundleDocument(data), bounds = new Box3(), delta = new Vector3()
      exportedNodeBounds(doc, 'approvedshaft', bounds)
      expect(bounds.min.z).toBeCloseTo(-0.071524, 5); expect(bounds.max.z).toBeCloseTo(0, 5)
      const a = bounds.min.clone().applyMatrix4(studyToShaftLocal(new Matrix4()))
      expect(a.y).toBeCloseTo(71.524, 2)
      expect(measureSupportDelta(doc, delta)).toBeCloseTo(2.75, 5)
      expect(Math.abs(delta.x) + Math.abs(delta.y)).toBeLessThan(0.000005)
      const ringLegacy = exportedNodeBounds(doc, 'legacyring', new Box3()).getCenter(new Vector3())
      const ringApproved = exportedNodeBounds(doc, 'approvedring', new Box3()).getCenter(new Vector3())
      expect(ringApproved.sub(ringLegacy).distanceTo(delta)).toBeLessThan(0.000005)
      expect(doc.meshes.some(mesh => mesh.primitives.length > 0)).toBe(true)
    })
  }
  it('retains the measured rest registration for narrative clones without world matrices', () => {
    const registry = JSON.parse(readFileSync(resolve('project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/geometry/source-registry.json'), 'utf8'))
    const datum = registry.registration.shaft_local_to_gltf_world as number[][]
    const expected = new Matrix4().set(...datum.flat() as [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number])
    // G0 shaft-local -> global GLTF equals measured rest shift followed by CAD-to-Y-up.
    const studyFromModel = narrativeModelToStudy(new Matrix4())
    const cadToModel = new Vector3(0.004, 0.02, -0.003).applyMatrix4(expected)
    expect(cadToModel.applyMatrix4(studyFromModel).distanceTo(new Vector3(0.004, -0.003, -0.02))).toBeLessThan(1e-7)
  })
})

describe('R3 placement math', () => {
  it('holds shaper near-edge radius, centred stroke, and hob axis/centre distance at dense times', () => {
    const k = createShaftKinematicsFrame(), shaper = new Group(), hob = new Group(), axis = new Vector3()
    const expectedTilt = Math.sin(HOB_LEAD_ANGLE_DEG * Math.PI / 180)
    for (let i = 0; i <= 2580; i++) {
      sampleShaftKinematics(i / 60, k); placeShaper(shaper, k); placeHob(hob, k)
      expect(Math.hypot(shaper.position.x, shaper.position.y) - SHAPER_TIP_RADIUS_MM / 1000).toBeCloseTo(k.cutterRho / 1000, 12)
      expect(-shaper.position.z).toBeCloseTo(k.strokeCentreY / 1000, 12)
      expect(Math.hypot(hob.position.x, hob.position.y)).toBeCloseTo(k.hobToolA / 1000, 12)
      expect(-hob.position.z).toBeCloseTo(k.hobYc / 1000, 12)
      axis.set(0, 1, 0).applyQuaternion(hob.quaternion)
      expect(-axis.z).toBeCloseTo(expectedTilt, 12)
      axis.set(0, 1, 0).applyQuaternion(shaper.quaternion)
      expect(axis.distanceTo(new Vector3(0, 0, -1))).toBeLessThan(1e-12)
    }
  })
  it('places the actual centred disc and rake face at the sampled reveal edge and chip anchor', () => {
    const steel = new MeshStandardMaterial(), cutter = buildShaperCutter(steel)
    const k = createShaftKinematicsFrame(), edge = new Vector3(), centre = new Vector3()
    const disc = cutter.root.getObjectByName('shaper-cutter-disc') as Mesh
    disc.geometry.computeBoundingBox()
    const bounds = disc.geometry.boundingBox!
    expect(bounds.min.y).toBeCloseTo(-SHAPER_THICKNESS_MM / 2000, 9)
    expect(bounds.max.y).toBeCloseTo(SHAPER_THICKNESS_MM / 2000, 9)
    try {
      for (const t of [2, 3.5, 6, 8.4, 10, 12, 14.9]) {
        sampleShaftKinematics(t, k); placeShaper(cutter.root, k); cutter.root.updateWorldMatrix(true, true)
        edge.copy(cutter.cuttingEdgeLocal).applyMatrix4(cutter.root.matrixWorld)
        bounds.getCenter(centre).applyMatrix4(disc.matrixWorld)
        expect(-centre.z * 1000).toBeCloseTo(k.strokeCentreY, 6)
        expect(-edge.z * 1000).toBeCloseTo(k.edgeY, 12)
        expect(-edge.z * 1000).toBeCloseTo(k.chipY, 12)
      }
      sampleShaftKinematics(8.4, k)
      expect(k.edgeY).toBeCloseTo(10.3749, 9)
      expect(k.edgeY - 9.8749).toBeCloseTo(0.5, 9)
    } finally { cutter.dispose(); steel.dispose() }
  })
})

describe('shaft runtime without WebGL', () => {
  it('keeps sample/apply/telemetry and their sampler bodies free of allocation syntax', () => {
    const surfaces: Record<string, string[]> = {
      'shaftRuntime.ts': ['sample', 'apply', 'telemetry', 'materialOpacity', 'partOpacity'],
      'schedule.ts': ['sampleShaftSchedule'], 'frame.ts': ['placeShaper', 'placeHob', 'shaftMetrePoint', 'shaftMmPoint'],
      'camera.ts': ['sampleShaftCamera'], 'kinematics.ts': ['sampleShaftKinematics', 'writeShaftProgression'],
      'script.ts': ['sampleShaftScript'], 'progression.ts': ['writeProgressionUniforms', 'writeStressUniforms'],
    }
    for (const [file, names] of Object.entries(surfaces)) {
      const source = ts.createSourceFile(file, readFileSync(resolve('src/scene/inspection/shaft', file), 'utf8'), ts.ScriptTarget.Latest, true)
      const found = new Set<string>()
      function inspect(node: ts.Node) {
        if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name && node.body) {
          const name = node.name.getText(source)
          if (names.includes(name)) {
            found.add(name)
            function forbidAllocation(child: ts.Node) {
              expect(ts.isNewExpression(child) || ts.isObjectLiteralExpression(child) || ts.isArrayLiteralExpression(child)
                || ts.isArrowFunction(child) || ts.isFunctionExpression(child), file + ':' + name + ':' + child.getText(source)).toBe(false)
              ts.forEachChild(child, forbidAllocation)
            }
            ts.forEachChild(node.body, forbidAllocation)
          }
        }
        ts.forEachChild(node, inspect)
      }
      inspect(source); expect([...found].sort()).toEqual([...names].sort())
    }
  })

  it('returns immediately, selects the tier/abort signal and consumes both housing names and optional witness', async () => {
    const { runtime, lease, fetchMock, parse } = await fixture({ housing: 'approvedhousing', legacyHousing: true, tier: 'lite' })
    expect(fetchMock.mock.calls[0][0]).toContain('manufacturing-core-lite.glb')
    expect(fetchMock.mock.calls[0][1].signal).toBe(lease.signal)
    expect(parse).toHaveBeenCalledOnce()
    const out = seek(runtime, 36) as { shaft: { nodes: { housing: string; legacyHousingPresent: boolean } } }
    expect(out.shaft.nodes.housing).toBe('approvedhousing'); expect(out.shaft.nodes.legacyHousingPresent).toBe(true)
    expect(runtime.root.getObjectByName('study-legacyhousing')?.visible).toBe(true)
    expect(runtime.camera.valid).toBe(true); expect(runtime.frame.ownsNarrative).toBe(true); expect(runtime.frame.returnBlend).toBe(0)
  })

  it('wires blank/finished progression, stress, opaque complementary wipe and freezes the formed envelope during withdrawal', async () => {
    const { runtime } = await fixture()
    const old = uniforms(runtime, 'legacyshaft'), revised = uniforms(runtime, 'approvedshaft')
    seek(runtime, 1)
    expect(old.uProgressionMode.value).toBe(1); expect(Array.from(old.uSpaceDepth.value as Float32Array)).toEqual(new Array(10).fill(0))
    seek(runtime, 16.3)
    expect(Array.from(old.uSpaceDepth.value as Float32Array)).toEqual(new Array(10).fill(1))
    expect(old.uStressKind.value).toBe(1); expect(revised.uStressKind.value).toBe(0)
    seek(runtime, 23.8)
    expect(material(runtime, 'legacyshaft').opacity).toBe(1); expect(material(runtime, 'approvedshaft').opacity).toBe(1)
    expect(material(runtime, 'legacyshaft').transparent).toBe(false); expect(material(runtime, 'approvedshaft').transparent).toBe(false)
    const oldPlane = material(runtime, 'legacyshaft').clippingPlanes![0], newPlane = material(runtime, 'approvedshaft').clippingPlanes![0]
    expect(oldPlane.normal.clone().add(newPlane.normal).length()).toBe(0)
    expect(oldPlane.constant + newPlane.constant).toBe(0)
    expect(revised.uProgressionMode.value).toBe(2); expect(revised.uHobYc.value).toBe(-4.195)
    for (const t of [30.2, 30.8, 31.2, 31.8, 31.999]) {
      seek(runtime, t); expect(revised.uHobYc.value).toBe(9.5249)
      expect(revised.uHobA.value).toBeCloseTo(10.29182859636582)
    }
    seek(runtime, 32.2); expect(revised.uProgressionMode.value).toBe(0); expect(revised.uStressKind.value).toBe(0)
    seek(runtime, 34); expect(revised.uStressKind.value).toBe(2); expect(old.uStressKind.value).toBe(0)
    seek(runtime, 12); expect(material(runtime, 'shaper-cutter-disc').opacity).toBeLessThan(material(runtime, 'shaper-hub').opacity)
  })

  it('moves the support pair rigidly, holds the baked endpoint, sections both shaft/housing and removes the section for finale', async () => {
    const { runtime, doc } = await fixture()
    const pair = runtime.root.getObjectByName('shaft-rigid-support-pair')!, delta = new Vector3()
    measureSupportDelta(doc, delta)
    const bearing = runtime.root.getObjectByName('study-approvedbearing')!, ring = runtime.root.getObjectByName('study-approvedring')!
    for (const t of [35.1, 35.5, 35.6, 36, 37, 37.6, 38.5]) {
      seek(runtime, t); const schedule = sampleShaftSchedule(t, createShaftSchedule())
      expect(pair.position.distanceTo(delta.clone().multiplyScalar(-(1 - schedule.supportBlend)))).toBeLessThan(1e-12)
      expect(bearing.quaternion.toArray()).toEqual(ring.quaternion.toArray())
      expect(material(runtime, 'approvedshaft').clippingPlanes).toHaveLength(1)
      expect(material(runtime, 'housing').clippingPlanes).toHaveLength(1)
      expect(material(runtime, 'housing').clippingPlanes![0].distanceToPoint(runtime.camera.position)).toBeLessThan(0)
    }
    seek(runtime, 39); expect(pair.position.length()).toBe(0)
    expect(material(runtime, 'approvedshaft').clippingPlanes).toHaveLength(0)
    expect(material(runtime, 'housing').clippingPlanes).toHaveLength(0)
    const caps: boolean[] = []; runtime.root.traverse(object => { if (object.name === 'study-section-backface') caps.push(object.visible) })
    expect(caps).toEqual([false, false])
  })

  it('delivers the counted previous-pass depth to the actual legacy material uniforms', async () => {
    const { runtime } = await fixture(), old = uniforms(runtime, 'legacyshaft')
    const k = createShaftKinematicsFrame(), covered = new Set<number>()
    for (let i = 0; i <= 780; i++) {
      const t = 2 + i / 60
      sampleShaftKinematics(t, k); seek(runtime, t)
      if (k.engagedSpace < 0) { expect(old.uEngagedPreviousDepth.value).toBe(0); continue }
      let first = (SPACE_CLOCK_RAD + k.engagedSpace * SPACE_PITCH_RAD - Math.PI / 2) / -WORK_RATE
      first -= Math.floor(first / 2) * 2
      const current = first + Math.round((k.machining - first) / 2) * 2
      let prior = 0
      for (let crossing = first; crossing < current - 1e-9; crossing += 2) {
        if (strokePhaseAt(crossing) < 0.5) prior++
      }
      const previous = Math.min(1, prior / 4)
      expect(old.uEngagedPreviousDepth.value).toBe(previous)
      if (prior >= 1 && prior <= 3) covered.add(prior)
    }
    expect([...covered].sort()).toEqual([1, 2, 3])
  })

  it('has identical complete runtime digests after shuffled seeks and stable sample/telemetry identities', async () => {
    const { runtime } = await fixture()
    const times = [0, 1.2, 2, 6, 8.4, 11, 14.99, 15, 16.3, 22.6, 23.8, 25, 28, 30.2, 31.6, 32, 32.8, 35, 36.6, 37.6, 39, 40.5, 43]
    const expected = times.map(t => digest(runtime, t))
    const frame = runtime.frame, camera = runtime.camera, position = camera.position, target = camera.target, up = camera.up, render = runtime.render
    const probe: Record<string, unknown> = {}; runtime.telemetry(probe)
    const subtree = probe.shaft, census = probe.resources
    let seed = 7193
    for (let i = 0; i < 240; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0; const index = seed % times.length
      expect(digest(runtime, times[index])).toBe(expected[index])
      runtime.telemetry(probe)
      expect(runtime.frame).toBe(frame); expect(runtime.camera).toBe(camera); expect(camera.position).toBe(position)
      expect(camera.target).toBe(target); expect(camera.up).toBe(up); expect(runtime.render).toBe(render)
      expect(probe.shaft).toBe(subtree); expect(probe.resources).toBe(census)
    }
    const a = seek(runtime, 15) as { shaft: { teethFormed: number; card: { id: string }; narrative: { alpha: number } } }
    expect(a.shaft.teethFormed).toBe(10); expect(a.shaft.card.id).toBe('4140'); expect(a.shaft.narrative.alpha).toBe(0)
    const b = seek(runtime, 43) as { shaft: { finale: { assembled: boolean; shaftCount: number; missingCarriers: boolean }; nodes: { legacyHousingPresent: boolean } } }
    expect(b.shaft.finale.assembled).toBe(false); expect(b.shaft.finale.shaftCount).toBe(1)
    expect(b.shaft.finale.missingCarriers).toBe(true); expect(b.shaft.nodes.legacyHousingPresent).toBe(false)
  })

  it('clones rest carriers/planets, preserves the rotation multiplier and leaves originals and shared resources intact', async () => {
    const carrier = new Group(), planet = new Group(), geometry = new BoxGeometry(), texture = new Texture()
    carrier.name = 'fixture-carrier'; planet.name = 'fixture-planet'
    const original = new MeshStandardMaterial({ map: texture }), mesh = new Mesh(geometry, original)
    original.onBeforeCompile = vi.fn(); planet.add(mesh); carrier.add(planet)
    carrier.position.set(0.02, 0.01, -0.4); carrier.rotation.z = 1.1; planet.rotation.z = 2.2
    const base = new Vector3(0.02, 0.01, 0)
    const basePositions = new Map([[carrier, base]])
    const stages = Object.fromEntries(['stage1', 'stage2', 'stage3', 'stage4', 'stage5'].map(id => {
      const source = id === 'stage1' ? carrier : carrier.clone(true)
      if (id !== 'stage1') { source.name = 'fixture-' + id; source.children[0].name = 'fixture-planet-' + id }
      basePositions.set(source, base)
      return [id, { carrier: source, planets: [source.children[0]] }]
    }))
    const rig = { stages, basePositions }
    const disposeGeometry = vi.spyOn(geometry, 'dispose'), disposeTexture = vi.spyOn(texture, 'dispose'), disposeMaterial = vi.spyOn(original, 'dispose')
    const { runtime } = await fixture({ rig })
    const clone = runtime.root.getObjectByName('fixture-carrier')!, clonePlanet = runtime.root.getObjectByName('fixture-planet')!
    expect(clone).not.toBe(carrier); expect(clone.position.toArray()).toEqual(base.toArray())
    seek(runtime, 42)
    expect(clonePlanet.rotation.z).toBeCloseTo(-clone.rotation.z * GEAR_RATIOS.planetMultiplier, 12)
    expect(carrier.position.toArray()).toEqual([0.02, 0.01, -0.4]); expect(carrier.rotation.z).toBe(1.1); expect(planet.rotation.z).toBe(2.2)
    const cloneMaterial = ((clonePlanet.children[0]) as Mesh).material as MeshStandardMaterial
    expect(cloneMaterial).not.toBe(original); expect(cloneMaterial.map).toBe(texture)
    const out = seek(runtime, 43) as { shaft: { finale: { assembled: boolean; shaftCount: number; racesFollow: boolean; ringFollowsShaft: boolean; bearingOuterFixed: boolean } } }
    expect(out.shaft.finale.assembled).toBe(true); expect(out.shaft.finale.shaftCount).toBe(1)
    expect(out.shaft.finale.racesFollow).toBe(false); expect(out.shaft.finale.ringFollowsShaft).toBe(true); expect(out.shaft.finale.bearingOuterFixed).toBe(true)
    expect(sharedStoryRefCount('shaft-finale-carriers')).toBe(1)
    runtime.dispose(); runtime.dispose()
    expect(sharedStoryRefCount('shaft-finale-carriers')).toBe(0)
    expect(disposeGeometry).not.toHaveBeenCalled(); expect(disposeTexture).not.toHaveBeenCalled(); expect(disposeMaterial).not.toHaveBeenCalled()
    geometry.dispose(); original.dispose(); texture.dispose()
  })

  it('disposes every owned resource once on cancel and prevents mounting a late parse', async () => {
    const data = bundle(), scene = testScene(readShaftBundleDocument(data))
    const owned = scene.children.map(object => vi.spyOn((object as Mesh).geometry, 'dispose'))
    let resolveParse!: (value: GLTF) => void
    vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockImplementation(() => new Promise(resolve => { resolveParse = resolve }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => data }))
    const lease = session(), runtime = createShaftRuntime(lease, context()); runtimes.push(runtime)
    const thread = runtime.root.getObjectByName('hob-thread') as InstancedMesh
    const disposeThread = vi.spyOn(thread, 'dispose')
    await vi.waitFor(() => expect(resolveParse).toBeTypeOf('function'))
    lease.cancel(); resolveParse({ scene } as unknown as GLTF); await runtime.ready
    expect(runtime.root.children).toHaveLength(0); expect(runtime.resources.meshes).toBe(0)
    owned.forEach(dispose => expect(dispose).toHaveBeenCalledOnce())
    expect(disposeThread).toHaveBeenCalledOnce()
    runtime.dispose(); owned.forEach(dispose => expect(dispose).toHaveBeenCalledOnce())
    expect(disposeThread).toHaveBeenCalledOnce()
  })

  it('reports current download failure, while cancellation before a fetch result stays silent', async () => {
    const fail = vi.fn(), lease = createStorySession('shaft', { id: 11, current: () => true, fail })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const runtime = createShaftRuntime(lease, context()); runtimes.push(runtime)
    await expect(runtime.ready).rejects.toThrow('Shaft download failed (404)')
    expect(fail).toHaveBeenCalledOnce(); expect(runtime.resources.meshes).toBe(0)
    let resolveFetch!: (value: unknown) => void
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(resolve => { resolveFetch = resolve })))
    const cancelledLease = session(), cancelled = createShaftRuntime(cancelledLease, context()); runtimes.push(cancelled)
    cancelledLease.cancel(); const body = vi.fn()
    resolveFetch({ ok: true, arrayBuffer: body }); await cancelled.ready
    expect(body).not.toHaveBeenCalled(); expect(cancelled.root.children).toHaveLength(0)
  })

  it('registers instance disposal with the session and returns the resource census to zero', async () => {
    const { runtime, lease } = await fixture()
    const thread = runtime.root.getObjectByName('hob-thread') as InstancedMesh
    expect(thread.isInstancedMesh).toBe(true)
    const disposeThread = vi.spyOn(thread, 'dispose')
    const geometryDisposers = new Map()
    const materialDisposers = new Map()
    runtime.root.traverse(object => {
      if (!(object instanceof Mesh)) return
      if (!geometryDisposers.has(object.geometry)) geometryDisposers.set(object.geometry, vi.spyOn(object.geometry, 'dispose'))
      for (const value of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!materialDisposers.has(value)) materialDisposers.set(value, vi.spyOn(value, 'dispose'))
      }
    })
    expect(runtime.resources.geometries).toBeGreaterThan(7); expect(runtime.resources.materials).toBeGreaterThan(7)
    lease.cancel(); expect(runtime.resources).toEqual({ geometries: 0, materials: 0, textures: 0, meshes: 0 })
    expect(disposeThread).toHaveBeenCalledOnce()
    runtime.dispose(); lease.cancel()
    expect(disposeThread).toHaveBeenCalledOnce()
    for (const dispose of geometryDisposers.values()) expect(dispose).toHaveBeenCalledOnce()
    for (const dispose of materialDisposers.values()) expect(dispose).toHaveBeenCalledOnce()
    expect(sharedStoryRefCount('shaft-finale-carriers')).toBe(0)
  })
})
