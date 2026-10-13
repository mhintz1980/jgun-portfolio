import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AnimationClip, Color, CylinderGeometry, Group, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, Quaternion, Scene, Vector3, VectorKeyframeTrack,
} from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createStorySession, type StorySession } from './session'
import { createRingRuntime } from './ringRuntime'
import { createRingRuntimeCore, createRingRuntimeProbe, type RingCleanupReport, type RingRuntimeCore } from './ringRuntimeCore'
import { ease, newFrame, odMask, rollerAngle, sampleInspection, SHOULDER } from './timeline'
import type { StoryContext, StoryRuntime } from './story'
import { inspection } from '../../state/inspectionStore'

const RING_RADIUS = .037722, RING_WIDTH = .027204217025541766
const runtimes: StoryRuntime[] = []

afterEach(() => {
  runtimes.forEach(runtime => runtime.dispose()); runtimes.length = 0
  vi.restoreAllMocks(); vi.unstubAllGlobals()
  inspection.source = null; inspection.meshes = []; inspection.time = 0; inspection.entryElapsed = 0
})

function context(): StoryContext {
  return { gl: { toneMappingExposure: 1.1 } as StoryContext['gl'], scene: new Scene(), hero: new Group(), rig: null, tier: 'full', aspect: 16 / 9 }
}

function session(): StorySession {
  return createStorySession('ring', { id: 38, current: () => true, fail: vi.fn() })
}

function sourceFixture() {
  const geometry = new CylinderGeometry(RING_RADIUS, RING_RADIUS, RING_WIDTH, 48).rotateX(Math.PI / 2)
  const material = new MeshBasicMaterial({ color: '#123456', opacity: .4, transparent: true })
  const mesh = new Mesh(geometry, material), source = new Group()
  source.name = 'P003068-source'; source.position.set(.03, -.02, .012); source.rotation.set(.2, -.1, .35)
  source.add(mesh); source.updateWorldMatrix(true, true)
  return { source, mesh, geometry, material }
}

function coreFixture(entryElapsed = 2, cleanup?: (report: RingCleanupReport) => void, pendingFetch = true) {
  const owned = sourceFixture(), probe = createRingRuntimeProbe()
  if (pendingFetch) vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const runtime = createRingRuntimeCore(session(), context(), {
    source: owned.source, meshes: [owned.mesh], initialTime: 0,
    getEntryElapsed: () => entryElapsed, probe, onCleanupError: cleanup,
  })
  runtimes.push(runtime)
  return { ...owned, runtime, probe }
}

function toolFixture(options: { animation?: boolean } = {}) {
  const scene = new Group(), toolRoot = new Group(); toolRoot.name = 'KT_TOOL_ROOT'; scene.add(toolRoot)
  const geometry = new CylinderGeometry(.006, .006, .012, 24), material = new MeshStandardMaterial()
  const wheels = ['KT_UPPER_KNURL_WHEEL_RH', 'KT_LOWER_KNURL_WHEEL_LH'].map(name => {
    const wheel = new Group(); wheel.name = name; wheel.add(new Mesh(geometry, material)); toolRoot.add(wheel)
    return wheel
  })
  scene.updateWorldMatrix(true, true)
  const track = new VectorKeyframeTrack('KT_TOOL_ROOT.position', [0, 5], [0, 0, 0, 0, 1, 0])
  const animations = options.animation === false ? [] : [new AnimationClip('KnurlTool_Approach_Contact_Traverse_Retract', 5, [track])]
  return { gltf: { scene, animations } as unknown as GLTF, scene, toolRoot, wheels, geometry, material }
}

async function installTool(gltf: GLTF) {
  const parse = vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockResolvedValue(gltf)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
  return parse
}

function ringMesh(runtime: StoryRuntime): Mesh {
  return runtime.root.getObjectByName('P003068-inspection-CAD') as Mesh
}

function diagnosticUniform(runtime: StoryRuntime) {
  const shader = {
    uniforms: {} as Record<string, { value: number }>,
    vertexShader: '#include <begin_vertex>',
    fragmentShader: '#include <normal_fragment_maps>\n#include <opaque_fragment>',
  }
  ;(ringMesh(runtime).material as MeshPhysicalMaterial).onBeforeCompile(shader as never, {} as never)
  return shader.uniforms.uInspectionDiagnostic
}

describe('ring runtime core boundaries', () => {
  it('keeps the core free of root stores and proof/browser globals', () => {
    const source = readFileSync(new URL('./ringRuntimeCore.ts', import.meta.url), 'utf8')
    expect(source).not.toContain('inspectionStore')
    expect(source).not.toContain('__inspectionProof')
    expect(source).not.toMatch(/\b(?:window|location)\b/)
  })

  it('allocates independent page-local probe arrays and numeric fields', () => {
    const a = createRingRuntimeProbe(), b = createRingRuntimeProbe()
    a.ringBounds.min[0] = 7; a.rollerCenters[0][1] = 8; a.maskSamples.odEnd = 9; a.disposed = 4
    expect(b.ringBounds.min).toEqual([0, 0, 0]); expect(b.rollerCenters[0]).toEqual([0, 0, 0])
    expect(b.maskSamples.odEnd).toBe(0); expect(b.disposed).toBe(0)
  })
})

describe('matched ring samples', () => {
  it('preserves entry pose, finish, hole-cover and mask laws at representative times', () => {
    const { runtime, probe, source } = coreFixture(2)
    const expectedCenter = new Vector3(...probe.ringBounds.center as [number, number, number]).applyMatrix4(source.matrixWorld)
    const expectedEntryRotation = new Quaternion().setFromRotationMatrix(source.matrixWorld)
    const mesh = ringMesh(runtime), material = mesh.material as MeshPhysicalMaterial
    const patch = runtime.root.children.find(child => child.name.startsWith('P003068-hole-cover-')) as Mesh | undefined

    for (const time of [0, 1.8, 5.1, 8.5, 10.8, 11.7, 12]) {
      const expected = sampleInspection(time, newFrame()), out: Record<string, unknown> = {}
      runtime.sample(time); runtime.apply(); runtime.telemetry(out)
      const poseBlend = 1 - ease(2 / 1.2) + ease(2 / 1.2) * expected.returnBlend
      expect(runtime.root.position.distanceTo(expectedCenter.clone().multiplyScalar(poseBlend))).toBeLessThan(1e-12)
      expect(runtime.root.quaternion.angleTo(new Quaternion().slerp(expectedEntryRotation, poseBlend))).toBeLessThan(1e-7)
      expect(runtime.root.getObjectByName('inspection-P003068-spin')!.rotation.z).toBeCloseTo(expected.angle, 12)
      expect(material.color.lerpColors(new Color('#040404'), new Color('#bfc5cb'), expected.aluminium)).toEqual(material.color)
      expect(material.roughness).toBeCloseTo(.26 + expected.aluminium * .09, 12)
      expect(material.opacity).toBeCloseTo(1 - expected.returnBlend, 12)
      expect(material.normalScale.x).toBeCloseTo(1.5 * expected.ringDetailScale, 12)
      if (patch) {
        const cover = patch.material as MeshPhysicalMaterial
        expect(cover.opacity).toBeCloseTo(expected.holePlugBlend * (1 - expected.returnBlend), 12)
        expect(patch.visible).toBe(cover.opacity > .001)
      }
      expect(probe.odKnurlProgress).toBeCloseTo(expected.knurl, 12)
      expect(probe.maskSamples.bore).toBe(odMask(RING_RADIUS * .8, 0, 0, RING_RADIUS, RING_WIDTH / 2, expected.knurl))
      expect(probe.maskSamples.shoulder).toBe(odMask(RING_RADIUS, RING_WIDTH / 2 - .0005, 0, RING_RADIUS, RING_WIDTH / 2, expected.knurl))
      expect(probe.maskSamples.odStart).toBe(odMask(RING_RADIUS, -RING_WIDTH / 2 + SHOULDER + .0005, 0, RING_RADIUS, RING_WIDTH / 2, expected.knurl))
      expect(probe.maskSamples.odEnd).toBe(odMask(RING_RADIUS, RING_WIDTH / 2 - SHOULDER - .0005, 0, RING_RADIUS, RING_WIDTH / 2, expected.knurl))
      expect(out.runtimeVersion).toBe(2); expect(out.trueSpin).toBeCloseTo(expected.spin, 12)
    }
  })

  it('supports explicit diagnostic and proof-progress controls', () => {
    const { runtime } = coreFixture()
    const diagnostic = diagnosticUniform(runtime)
    expect(diagnostic.value).toBe(0)
    runtime.mask(true); expect(diagnosticUniform(runtime).value).toBe(1)
    runtime.mask(false); expect(diagnosticUniform(runtime).value).toBe(0)
    runtime.progress(.42)
    runtime.sample(5.1); runtime.apply(); runtime.telemetry({})
    const progress = (runtime as RingRuntimeCore)
    expect(progress).toBe(runtime)
    expect(diagnosticUniform(runtime).value).toBe(0)
  })
})

describe('tool and lifecycle ownership', () => {
  it('installs only a current parse and preserves sampled tool law', async () => {
    const tool = toolFixture(), parse = await installTool(tool.gltf), fixture = coreFixture(2, undefined, false)
    const sourceGeometryDispose = vi.spyOn(fixture.geometry, 'dispose'), sourceMaterialDispose = vi.spyOn(fixture.material, 'dispose')
    const parsedGeometryDispose = vi.spyOn(tool.geometry, 'dispose'), parsedMaterialDispose = vi.spyOn(tool.material, 'dispose')
    await fixture.runtime.ready
    expect(parse).toHaveBeenCalledOnce(); expect(fixture.probe.toolMeshes).toBe(2)
    expect(fixture.runtime.resources).toEqual({ geometries: 2, materials: 5, textures: 1, meshes: 3 })
    expect(fixture.runtime.root.getObjectByName('inspection-tool-frame')!.children).toHaveLength(1)

    const expected = sampleInspection(5.2, newFrame())
    fixture.runtime.sample(5.2); fixture.runtime.apply(); fixture.runtime.telemetry({})
    expect(fixture.runtime.root.getObjectByName('inspection-tool-frame')!.visible).toBe(true)
    for (const wheel of tool.wheels) {
      const actual = wheel.children[0] as Mesh
      expect(actual.geometry.getAttribute('inspectionSmoothPosition')).toBeTruthy()
      expect(actual.geometry.getAttribute('inspectionSmoothNormal')).toBeTruthy()
      expect((actual.material as MeshStandardMaterial).opacity).toBeCloseTo(expected.toolOpacity, 12)
    }
    // Parsed roller bounds are measured from Float32 vertices, not the constructor literal.
    expect(tool.wheels[0].quaternion.y).toBeCloseTo(Math.sin(.5 * rollerAngle(expected.angle, RING_RADIUS, .006)), 6)
    expect(tool.wheels[1].quaternion.y).toBeCloseTo(Math.sin(.5 * rollerAngle(expected.angle, RING_RADIUS, .006)), 6)

    const clonedMaterialDisposers = tool.wheels.map(wheel => vi.spyOn(((wheel.children[0] as Mesh).material as MeshStandardMaterial), 'dispose'))
    fixture.runtime.dispose(); fixture.runtime.dispose()
    expect(sourceGeometryDispose).not.toHaveBeenCalled(); expect(sourceMaterialDispose).not.toHaveBeenCalled()
    expect(parsedGeometryDispose).toHaveBeenCalledOnce(); expect(parsedMaterialDispose).toHaveBeenCalledOnce()
    for (const dispose of clonedMaterialDisposers) expect(dispose).toHaveBeenCalledOnce()
    expect(fixture.probe.disposed).toBe(1)
  })

  it('disposes a parse that resolves after runtime disposal and never mounts it', async () => {
    const tool = toolFixture()
    let resolveParse!: (value: GLTF) => void
    vi.spyOn(GLTFLoader.prototype, 'parseAsync').mockImplementation(() => new Promise(resolve => { resolveParse = resolve }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    const fixture = coreFixture(2, undefined, false)
    const geometryDispose = vi.spyOn(tool.geometry, 'dispose'), materialDispose = vi.spyOn(tool.material, 'dispose')
    await vi.waitFor(() => expect(resolveParse).toBeTypeOf('function'))
    fixture.runtime.dispose(); resolveParse(tool.gltf); await fixture.runtime.ready
    expect(fixture.runtime.root.getObjectByName('inspection-tool-frame')!.children).toHaveLength(0)
    expect(geometryDispose).toHaveBeenCalledOnce(); expect(materialDispose).toHaveBeenCalledOnce()
  })

  it('preserves the original tool fault and cleans its parsed resources on final disposal', async () => {
    const tool = toolFixture({ animation: false }); await installTool(tool.gltf)
    const fixture = coreFixture(2, undefined, false)
    const geometryDispose = vi.spyOn(tool.geometry, 'dispose'), materialDispose = vi.spyOn(tool.material, 'dispose')
    await expect(fixture.runtime.ready).rejects.toThrow('Verified tool animation is missing')
    fixture.runtime.dispose(); fixture.runtime.dispose()
    expect(geometryDispose).toHaveBeenCalledOnce(); expect(materialDispose).toHaveBeenCalledOnce()
  })

  it('attempts every disposal once, reports cleanup failures, and preserves probe completion', async () => {
    const reports: RingCleanupReport[] = [], tool = toolFixture(); await installTool(tool.gltf)
    const fixture = coreFixture(2, report => reports.push(report), false); await fixture.runtime.ready
    const original = tool.material, clone = (tool.wheels[0].children[0] as Mesh).material as MeshStandardMaterial
    const cloneDispose = vi.spyOn(clone, 'dispose')
    original.dispose = () => { throw new Error('tool material cleanup failed') }
    fixture.runtime.dispose(); fixture.runtime.dispose()
    expect(reports.map(report => report.error)).toEqual([new Error('tool material cleanup failed')])
    expect(reports[0]).toMatchObject({ phase: 'runtime', resource: 'tool' })
    expect(cloneDispose).toHaveBeenCalledOnce(); expect(fixture.probe.disposed).toBe(1)
  })

  it('cleans partial construction without disposing the borrowed source and preserves the original error', () => {
    const reports: RingCleanupReport[] = [], source = sourceFixture()
    const sourceGeometryDispose = vi.spyOn(source.geometry, 'dispose'), sourceMaterialDispose = vi.spyOn(source.material, 'dispose')
    const cleanupError = new Error('normal map cleanup failed')
    const materialDispose = vi.spyOn(MeshStandardMaterial.prototype, 'dispose').mockImplementation(() => { throw cleanupError })
    const ctx = context(), constructionError = new Error('renderer exposure read failed')
    Object.defineProperty(ctx.gl, 'toneMappingExposure', { get() { throw constructionError } })
    expect(() => createRingRuntimeCore(session(), ctx, {
      source: source.source, meshes: [source.mesh], initialTime: 0,
      getEntryElapsed: () => 0, probe: createRingRuntimeProbe(), onCleanupError: report => reports.push(report),
    })).toThrow(constructionError)
    expect(reports).toEqual([
      { phase: 'construction', resource: 'ring', error: cleanupError },
      { phase: 'construction', resource: 'ring', error: cleanupError },
    ])
    expect(sourceGeometryDispose).not.toHaveBeenCalled(); expect(sourceMaterialDispose).not.toHaveBeenCalled()
    expect(materialDispose).toHaveBeenCalledTimes(2)
  })
})

describe('legacy proof adapter', () => {
  it('publishes and clears only its own proof identity', async () => {
    const owned = sourceFixture()
    inspection.source = owned.source; inspection.meshes = [owned.mesh]; inspection.time = 1.2; inspection.entryElapsed = .1; inspection.playing = true
    const proofWindow: { __inspectionProof?: unknown } = {}
    vi.stubGlobal('window', proofWindow)
    vi.stubGlobal('location', { search: '?inspectionProof=1' })
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const runtime = createRingRuntime(session(), context()); runtimes.push(runtime)
    const proof = proofWindow.__inspectionProof as { seek(time: number, entryElapsed?: number): void }
    expect(proof).toBeTruthy()
    proof.seek(5.4, 1.4)
    expect(inspection.playing).toBe(false); expect(inspection.time).toBeCloseTo(5.4, 12); expect(inspection.entryElapsed).toBeCloseTo(1.4, 12)
    runtime.dispose()
    expect(proofWindow.__inspectionProof).toBeUndefined()
  })
})
