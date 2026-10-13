import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Box3, BufferGeometry, CanvasTexture, Color, DataTexture, Float32BufferAttribute,
  Material, Matrix4, Texture, Vector3, WebGLRenderTarget, type WebGLRenderer,
} from 'three'
import { SIDE_ROTATION, makeDrawingLayout, type DrawingGeometry, type CleanupFailureSink } from '../drawingGeometry'
import * as geometryModule from '../drawingGeometry'
import * as pose from '../poseCore'
import * as cache from './drawingCache'
import * as composition from './composeSheet'
import * as profile from './profile'
import * as fracture from './breakthroughGeometry'
import * as masks from './breakthrough'
import * as ink from './ink'
import * as flex from './paperFlex'
import * as lettering from './sheetText'
import * as edges from './edgeExtract'
import * as registration from './registration'
import { bakeSheet, type SheetBakeInput, type SheetBakeResult } from './sheetBake'
import { DrawingLinework } from '../DrawingLinework'
import { forcePoster } from '../../../state/qualityStore'

const host = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  epoch: { current: 0 },
  setState: vi.fn(),
  gl: {} as unknown,
  meshFailure: null as unknown,
  targetFailure: null as unknown,
  batchGeometryFailure: null as unknown,
  batchTextures: [] as Array<{ dispose: ReturnType<typeof vi.fn> }>,
  texts: [] as Array<{ text?: string; font?: string; dispose: ReturnType<typeof vi.fn>; sync: ReturnType<typeof vi.fn> }>,
  batches: [] as Array<{ dispose: ReturnType<typeof vi.fn> }>,
}))
vi.mock('three', async (original) => {
  const actual = await original<typeof import('three')>()
  return {
    ...actual,
    Mesh: class extends actual.Mesh {
      constructor(...args: ConstructorParameters<typeof actual.Mesh>) {
        if (host.meshFailure !== null) throw host.meshFailure
        super(...args)
      }
    },
    WebGLRenderTarget: class extends actual.WebGLRenderTarget {
      constructor(...args: ConstructorParameters<typeof actual.WebGLRenderTarget>) {
        if (host.targetFailure !== null) throw host.targetFailure
        super(...args)
      }
    },
  }
})
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useLayoutEffect: (effect: () => void | (() => void)) => { host.effects.push(effect) },
  useState: () => [null, host.setState],
  useRef: () => host.epoch,
}))
vi.mock('@react-three/fiber', async (original) => ({
  ...await original<typeof import('@react-three/fiber')>(),
  useThree: () => ({ gl: host.gl }),
}))
vi.mock('../../../state/qualityStore', async (original) => ({
  ...await original<typeof import('../../../state/qualityStore')>(),
  getQuality: () => ({ tier: 'full', reducedMotion: false }),
  forcePoster: vi.fn(),
}))
// Only the font-atlas backend is substituted: the actual sheetText allocation/rollback runs.
vi.mock('troika-three-text', async () => {
  const { Object3D } = await import('three')
  class TestText extends Object3D {
    material: unknown
    text = ''
    font = ''
    textRenderInfo = { blockBounds: [0, 0, 0.003, 0.004] }
    dispose = vi.fn()
    sync = vi.fn((done?: () => void) => { done?.() })
    constructor() { super(); host.texts.push(this) }
  }
  class TestBatch extends TestText {
    _dataTextures: Record<string, { dispose: ReturnType<typeof vi.fn> }>
    constructor() {
      super()
      host.texts.pop()
      host.batches.push(this)
      this._dataTextures = Object.fromEntries(
        host.batchTextures.map((texture, index) => [String(index), texture]),
      )
      this.dispose = vi.fn(() => {
        if (host.batchGeometryFailure !== null) throw host.batchGeometryFailure
      })
    }
  }
  return { Text: TestText, BatchedText: TestBatch }
})
vi.mock('../poseCore', async (original) => {
  const actual = await original<typeof import('../poseCore')>()
  return { ...actual, solveExtraction: vi.fn(actual.solveExtraction), bindExtractionPressure: vi.fn(actual.bindExtractionPressure) }
})
vi.mock('./drawingCache', async (original) => {
  const actual = await original<typeof import('./drawingCache')>()
  return { ...actual, prepareDrawingCache: vi.fn(actual.prepareDrawingCache) }
})
vi.mock('./composeSheet', async (original) => {
  const actual = await original<typeof import('./composeSheet')>()
  return { ...actual, composeSheet: vi.fn(actual.composeSheet) }
})
vi.mock('./profile', async (original) => {
  const actual = await original<typeof import('./profile')>()
  return { ...actual, bakeProfile: vi.fn(actual.bakeProfile) }
})
vi.mock('./breakthroughGeometry', async (original) => {
  const actual = await original<typeof import('./breakthroughGeometry')>()
  return { ...actual, makeBreakthroughGeometry: vi.fn(actual.makeBreakthroughGeometry) }
})
vi.mock('./breakthrough', async (original) => {
  const actual = await original<typeof import('./breakthrough')>()
  return { ...actual, makeBarrierMask: vi.fn(actual.makeBarrierMask), makeFragmentPrint: vi.fn(actual.makeFragmentPrint), makeCrackMask: vi.fn(actual.makeCrackMask) }
})
vi.mock('./ink', async (original) => {
  const actual = await original<typeof import('./ink')>()
  return { ...actual, makeSheetUniforms: vi.fn(actual.makeSheetUniforms), makeInkLines: vi.fn(actual.makeInkLines), makeInkFills: vi.fn(actual.makeInkFills) }
})
vi.mock('./paperFlex', async (original) => {
  const actual = await original<typeof import('./paperFlex')>()
  return { ...actual, makePaperFlexField: vi.fn(actual.makePaperFlexField), clearPaperFlexField: vi.fn(actual.clearPaperFlexField) }
})
vi.mock('./sheetText', async (original) => {
  const actual = await original<typeof import('./sheetText')>()
  return { ...actual, makeSheetText: vi.fn(actual.makeSheetText) }
})
vi.mock('./edgeExtract', async (original) => {
  const actual = await original<typeof import('./edgeExtract')>()
  return { ...actual, extractView: vi.fn(actual.extractView) }
})
vi.mock('./registration', async (original) => {
  const actual = await original<typeof import('./registration')>()
  return { ...actual, measureProfileRegistration: vi.fn(actual.measureProfileRegistration) }
})
vi.mock('./sheetBake', async (original) => {
  const actual = await original<typeof import('./sheetBake')>()
  return { ...actual, bakeSheet: vi.fn(actual.bakeSheet) }
})

const actual = {
  bake: await vi.importActual<typeof import('./sheetBake')>('./sheetBake'),
  pose: await vi.importActual<typeof import('../poseCore')>('../poseCore'),
  cache: await vi.importActual<typeof import('./drawingCache')>('./drawingCache'),
  composition: await vi.importActual<typeof import('./composeSheet')>('./composeSheet'),
  profile: await vi.importActual<typeof import('./profile')>('./profile'),
  fracture: await vi.importActual<typeof import('./breakthroughGeometry')>('./breakthroughGeometry'),
  masks: await vi.importActual<typeof import('./breakthrough')>('./breakthrough'),
  ink: await vi.importActual<typeof import('./ink')>('./ink'),
  flex: await vi.importActual<typeof import('./paperFlex')>('./paperFlex'),
  lettering: await vi.importActual<typeof import('./sheetText')>('./sheetText'),
  edges: await vi.importActual<typeof import('./edgeExtract')>('./edgeExtract'),
  registration: await vi.importActual<typeof import('./registration')>('./registration'),
}
const contour = [[-0.15, -0.05], [0.15, -0.05], [0.15, 0.05], [-0.15, 0.05], [-0.15, -0.05]]
const ownedResults: SheetBakeResult[] = []
const borrowed: BufferGeometry[] = []
const canvas = () => ({
  width: 1, height: 1,
  getContext: () => ({
    setLineDash() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, closePath() {},
  }),
}) as unknown as HTMLCanvasElement

function composedFixture(): ReturnType<typeof composition.composeSheet> {
  const builder = new ink.InkBuilder()
  for (let i = 1; i < contour.length; i++) {
    builder.line(...contour[i - 1] as [number, number], ...contour[i] as [number, number],
      0.0002, ink.GROUP.side, 0, 0.1)
  }
  builder.tri(0, 0, 0.001, 0, 0, 0.001, ink.GROUP.side)
  builder.text({ text: 'A', x: 0, y: 0, size: 0.0038, group: ink.GROUP.noteInput,
    key: 0, weight: 'handwriting', color: 'graphite' })
  return { ink: builder, marks: { side: [0, 0] }, stats: { segments: 4, totalMs: 7 } }
}

// Small owned fracture/texture fixtures keep the boundary matrix CPU-bounded.
// Actual factories run separately below, including their internal partial throws.
function fractureFixture(): ReturnType<typeof fracture.makeBreakthroughGeometry> {
  const paper = new BufferGeometry(), edge = new BufferGeometry(), cracks = new BufferGeometry()
  return {
    paper, edge, cracks, fragments: [], profile: contour, outline: contour, tornContour: contour,
    area: 0.03, fragmentArea: 0.03, thickness: 0.00045, maxBoundaryDeviation: 0,
    fragmentZRange: [-0.00045, 0],
    dispose: (sink?: CleanupFailureSink) => {
      const errors: unknown[] = []
      for (const geometry of [paper, edge, cracks]) {
        try { geometry.dispose() } catch (error) { errors.push(error) }
      }
      if (errors.length) sink?.(errors)
    },
  }
}

function fixture(): SheetBakeInput {
  const inv = SIDE_ROTATION.clone().invert()
  const values = [[-0.14, 0, 0.02], [0, 0, 0.02], [0.14, 0, 0.02],
    [-0.14, 0.045, 0.019], [0.14, -0.045, 0.019], [-0.14, 0, -0.04], [0.14, 0, -0.04]]
    .flatMap(p => new Vector3(...p as [number, number, number]).applyMatrix4(inv).toArray())
  const attribute = new Float32BufferAttribute(values, 3)
  const geometry = new BufferGeometry().setAttribute('position', attribute)
  borrowed.push(geometry)
  const data: DrawingGeometry = { geometry, bounds: new Box3().setFromBufferAttribute(attribute),
    features: {}, units: {}, rigCenter: new Vector3(), sourceTriangles: 0 }
  const layout = makeDrawingLayout(1, data.bounds)
  layout.primaryCenter.set(0, 0, 0)
  return { gl: {} as WebGLRenderer, data, layout,
    tier: 'full', onCleanupFailure: vi.fn() }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>(ok => { resolve = ok })
  return { promise, resolve }
}

beforeEach(() => {
  vi.mocked(bakeSheet).mockReset().mockImplementation(actual.bake.bakeSheet)
  vi.mocked(pose.solveExtraction).mockReset().mockImplementation(actual.pose.solveExtraction)
  vi.mocked(pose.bindExtractionPressure).mockReset().mockImplementation(actual.pose.bindExtractionPressure)
  vi.mocked(cache.prepareDrawingCache).mockReset().mockResolvedValue(false)
  vi.mocked(composition.composeSheet).mockReset().mockImplementation(composedFixture)
  vi.mocked(profile.bakeProfile).mockReset().mockImplementation(() => actual.profile.profileFromPoints(contour))
  vi.mocked(fracture.makeBreakthroughGeometry).mockReset().mockImplementation(fractureFixture)
  vi.mocked(masks.makeBarrierMask).mockReset().mockImplementation(() => new DataTexture(new Uint8Array(4), 1, 1))
  vi.mocked(masks.makeFragmentPrint).mockReset().mockImplementation(() => new CanvasTexture(canvas()))
  vi.mocked(masks.makeCrackMask).mockReset().mockImplementation(() => new CanvasTexture(canvas()))
  vi.mocked(ink.makeSheetUniforms).mockReset().mockImplementation(actual.ink.makeSheetUniforms)
  vi.mocked(ink.makeInkLines).mockReset().mockImplementation(actual.ink.makeInkLines)
  vi.mocked(ink.makeInkFills).mockReset().mockImplementation(actual.ink.makeInkFills)
  vi.mocked(flex.makePaperFlexField).mockReset().mockImplementation(actual.flex.makePaperFlexField)
  vi.mocked(flex.clearPaperFlexField).mockReset().mockImplementation(actual.flex.clearPaperFlexField)
  vi.mocked(lettering.makeSheetText).mockReset().mockImplementation(actual.lettering.makeSheetText)
  vi.mocked(edges.extractView).mockReset().mockImplementation(actual.edges.extractView)
  vi.mocked(registration.measureProfileRegistration).mockReset().mockImplementation(actual.registration.measureProfileRegistration)
  vi.mocked(forcePoster).mockReset()
  host.effects.length = 0
  host.meshFailure = null
  host.targetFailure = null
  host.batchGeometryFailure = null
  host.batchTextures.length = 0
  host.epoch.current = 0
  host.setState.mockReset()
  host.texts.length = 0
  host.batches.length = 0
  vi.stubGlobal('document', { createElement: canvas })
  vi.stubGlobal('window', { location: { search: '' } })
})
afterEach(() => {
  vi.restoreAllMocks()
  for (const result of ownedResults.splice(0)) result.dispose()
  for (const geometry of borrowed.splice(0)) geometry.dispose()
  actual.flex.clearPaperFlexField(actual.flex.getPaperFlexField())
  vi.unstubAllGlobals()
})

describe('explicit sheet bake ownership', () => {
  it('completes a CPU bake with real fracture/masks/ink/flex/text factories and borrowed input', async () => {
    const input = fixture(), borrowDispose = vi.spyOn(input.data.geometry, 'dispose')
    vi.mocked(fracture.makeBreakthroughGeometry).mockImplementation(actual.fracture.makeBreakthroughGeometry)
    vi.mocked(masks.makeBarrierMask).mockImplementation(actual.masks.makeBarrierMask)
    vi.mocked(masks.makeFragmentPrint).mockImplementation(actual.masks.makeFragmentPrint)
    vi.mocked(masks.makeCrackMask).mockImplementation(actual.masks.makeCrackMask)
    const result = await bakeSheet(input)
    ownedResults.push(result)
    expect(result.fracture.fragments.length).toBeGreaterThanOrEqual(fracture.BREAKTHROUGH_FRAGMENT_MIN)
    expect(result.barrierMask.image.width).toBe(1536)
    expect(result.fragmentPrint.image.width).toBe(2048)
    expect(result.crackMask.image.width).toBe(4096)
    expect(result.fracture.paper.getAttribute('position').count).toBeGreaterThan(0)
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose')
    result.dispose()
    for (const fragment of result.fracture.fragments) expect(dispose.mock.contexts).toContain(fragment.geometry)
    expect(borrowDispose).not.toHaveBeenCalled()
    expect(input.onCleanupFailure).toHaveBeenCalledExactlyOnceWith([])
  })

  it('keeps stats/uniforms/font and measured pressure, with lazy cached registration and borrowed geometry', async () => {
    const input = fixture()
    const borrowDispose = vi.spyOn(input.data.geometry, 'dispose')
    const result = await bakeSheet(input)
    ownedResults.push(result)
    expect(cache.prepareDrawingCache).toHaveBeenCalledWith(input.data, input.layout, undefined, undefined)
    expect(result.stats).toMatchObject({ segments: 4, precomputed: 0, flexAmplitude: 0,
      flexNormalZ: 1, contactShadow: 0, vellum: 0, flexFieldPeak: result.flex.peak })
    for (const key of ['cacheMs', 'extractMs', 'bakeMs']) expect(result.stats[key]).toBeGreaterThanOrEqual(0)
    expect(result.uniforms.uFlexField.value).toBe(result.flex.texture)
    expect(result.uniforms.uFlexRect.value).toBe(result.flex.rect)
    expect(result.uniforms.uBarrierMask.value).toBe(result.barrierMask)
    expect(result.extraction.pressureTravel).toBeGreaterThan(0)
    expect(host.texts[0].font).toBe('/fonts/AcFastReference.ttf')
    expect(registration.measureProfileRegistration).not.toHaveBeenCalled()
    const registrationResult = result.pulseRegistration()
    expect(registrationResult).toMatchObject({ ready: true, maxDistance: 0, units: 'metres' })
    expect(result.pulseRegistration()).toBe(registrationResult)
    expect(registration.measureProfileRegistration).toHaveBeenCalledOnce()
    await result.text.ready
    result.dispose()
    result.dispose()
    expect(borrowDispose).not.toHaveBeenCalled()
    expect(flex.getPaperFlexField()).toBeNull()
    expect(input.onCleanupFailure).toHaveBeenCalledExactlyOnceWith([])
    expect(Object.isFrozen(vi.mocked(input.onCleanupFailure).mock.calls[0][0])).toBe(true)
  })

  it('uses explicit lite pressure and keeps precompute-success versus false fallback stats', async () => {
    vi.mocked(cache.prepareDrawingCache).mockResolvedValueOnce(true)
    const full = await bakeSheet(fixture())
    ownedResults.push(full)
    const liteInput = fixture()
    liteInput.tier = 'lite'
    const lite = await bakeSheet(liteInput)
    ownedResults.push(lite)
    expect(full.stats.precomputed).toBe(1)
    expect(lite.stats.precomputed).toBe(0)
    expect(lite.extraction.pressureTravel).toBeLessThan(full.extraction.pressureTravel)
    expect(lettering.makeSheetText).toHaveBeenCalledTimes(2)
    full.dispose()
    expect(flex.getPaperFlexField()).toBe(lite.flex)
    lite.dispose()
    expect(flex.getPaperFlexField()).toBeNull()
  })

  const boundaries = [
    ['solve', pose.solveExtraction], ['compose', composition.composeSheet], ['profile', profile.bakeProfile],
    ['fracture', fracture.makeBreakthroughGeometry], ['barrier', masks.makeBarrierMask],
    ['print', masks.makeFragmentPrint], ['crack mask', masks.makeCrackMask],
    ['uniforms', ink.makeSheetUniforms], ['flex', flex.makePaperFlexField],
    ['pressure bind', pose.bindExtractionPressure], ['lines', ink.makeInkLines],
    ['fills', ink.makeInkFills], ['text', lettering.makeSheetText],
  ] as const
  for (const [name, factory] of boundaries) {
    it(`cleans all returned resources when the ${name} boundary throws, keeping the primary error`, async () => {
      const input = fixture(), primary = new Error(name)
      const borrowDispose = vi.spyOn(input.data.geometry, 'dispose')
      const geometryDispose = vi.spyOn(BufferGeometry.prototype, 'dispose')
      const textureDispose = vi.spyOn(Texture.prototype, 'dispose')
      vi.mocked(factory).mockImplementationOnce(() => { throw primary })
      await expect(bakeSheet(input)).rejects.toBe(primary)
      expect(input.onCleanupFailure).toHaveBeenCalledExactlyOnceWith([])
      expect(borrowDispose).not.toHaveBeenCalled()
      expect(flex.getPaperFlexField()).toBeNull()
      const madeProfile = vi.mocked(profile.bakeProfile).mock.results.find(r => r.type === 'return')?.value
      if (madeProfile) {
        expect(geometryDispose.mock.contexts).toContain(madeProfile.profile)
        expect(geometryDispose.mock.contexts).toContain(madeProfile.profileRibbon)
      }
      const madeFracture = vi.mocked(fracture.makeBreakthroughGeometry).mock.results.find(r => r.type === 'return')?.value
      if (madeFracture) for (const geometry of [madeFracture.paper, madeFracture.edge, madeFracture.cracks]) {
        expect(geometryDispose.mock.contexts).toContain(geometry)
      }
      for (const maskFactory of [masks.makeBarrierMask, masks.makeFragmentPrint, masks.makeCrackMask]) {
        const texture = vi.mocked(maskFactory).mock.results.find(r => r.type === 'return')?.value
        if (texture) expect(textureDispose.mock.contexts).toContain(texture)
      }
      for (const meshFactory of [ink.makeInkLines, ink.makeInkFills]) {
        const mesh = vi.mocked(meshFactory).mock.results.find(r => r.type === 'return')?.value
        if (mesh) expect(geometryDispose.mock.contexts).toContain(mesh.geometry)
      }
    })
  }

  it('collects nested and throwing leaf cleanup once, still clears flex, and survives a throwing reporter', async () => {
    const input = fixture()
    const hostError = new Error('host'), cleanupA = new Error('profile'), cleanupB = new Error('flex')
    input.onCleanupFailure = vi.fn(() => { throw hostError })
    const result = await bakeSheet(input)
    ownedResults.push(result)
    const borrowDispose = vi.spyOn(input.data.geometry, 'dispose')
    result.rendered.profile.addEventListener('dispose', () => { throw cleanupA })
    result.flex.texture.addEventListener('dispose', () => { throw cleanupB })
    const geometryDispose = vi.spyOn(BufferGeometry.prototype, 'dispose')
    const materialDispose = vi.spyOn(Material.prototype, 'dispose')
    expect(() => result.dispose()).not.toThrow()
    expect(() => result.dispose()).not.toThrow()
    expect(input.onCleanupFailure).toHaveBeenCalledExactlyOnceWith([cleanupA, cleanupB])
    expect(Object.isFrozen(vi.mocked(input.onCleanupFailure).mock.calls[0][0])).toBe(true)
    expect(geometryDispose.mock.contexts).toContain(result.rendered.profileRibbon)
    expect(geometryDispose.mock.contexts).toContain(result.fills.geometry)
    expect(materialDispose.mock.contexts).toContain(result.fills.material)
    expect(host.texts[0].dispose).toHaveBeenCalledOnce()
    expect(host.batches[0].dispose).toHaveBeenCalledOnce()
    expect(flex.clearPaperFlexField).toHaveBeenCalledWith(result.flex)
    expect(flex.getPaperFlexField()).toBeNull()
    expect(borrowDispose).not.toHaveBeenCalled()
  })

  it('preserves a primary construction error with factory diagnostics and a throwing host reporter', async () => {
    const input = fixture(), primary = new Error('construction'), nested = new Error('rollback')
    input.onCleanupFailure = vi.fn(() => { throw new Error('report') })
    vi.mocked(ink.makeInkFills).mockImplementationOnce((_builder, _uniforms, sink) => {
      sink?.([nested])
      throw primary
    })
    await expect(bakeSheet(input)).rejects.toBe(primary)
    expect(input.onCleanupFailure).toHaveBeenCalledExactlyOnceWith([nested])
    expect(flex.getPaperFlexField()).toBeNull()
  })

  it('rejects an already-aborted caller before cache work, instead of fallback', async () => {
    const input = fixture(), controller = new AbortController()
    controller.abort('owner')
    input.signal = controller.signal
    await expect(bakeSheet(input)).rejects.toMatchObject({ name: 'AbortError' })
    expect(cache.prepareDrawingCache).not.toHaveBeenCalled()
    expect(composition.composeSheet).not.toHaveBeenCalled()
  })

  it('propagates caller AbortError from cache; a false cache result instead composes live', async () => {
    const input = fixture(), abort = new DOMException('cancelled', 'AbortError')
    vi.mocked(cache.prepareDrawingCache).mockRejectedValueOnce(abort)
    await expect(bakeSheet(input)).rejects.toBe(abort)
    expect(composition.composeSheet).not.toHaveBeenCalled()
    ownedResults.push(await bakeSheet(fixture()))
    expect(composition.composeSheet).toHaveBeenCalledOnce()
  })

  it('checks the signal after cache resolves and before the first allocation', async () => {
    const input = fixture(), controller = new AbortController(), pending = deferred<boolean>()
    input.signal = controller.signal
    vi.mocked(cache.prepareDrawingCache).mockReturnValueOnce(pending.promise)
    const result = bakeSheet(input)
    controller.abort({ reason: 'after cache' })
    pending.resolve(false)
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    expect(pose.solveExtraction).not.toHaveBeenCalled()
    expect(composition.composeSheet).not.toHaveBeenCalled()
  })

  it('checks cancellation after final allocation and disposes text plus every earlier resource', async () => {
    const input = fixture(), controller = new AbortController()
    input.signal = controller.signal
    vi.mocked(lettering.makeSheetText).mockImplementationOnce((...args) => {
      const layer = actual.lettering.makeSheetText(...args)
      controller.abort('before return')
      return layer
    })
    await expect(bakeSheet(input)).rejects.toMatchObject({ name: 'AbortError' })
    expect(host.texts[0].dispose).toHaveBeenCalledOnce()
    expect(host.batches[0].dispose).toHaveBeenCalledOnce()
    expect(flex.getPaperFlexField()).toBeNull()
    expect(input.onCleanupFailure).toHaveBeenCalledOnce()
  })

  it('leaves a delivered result owned by the host when the caller aborts later', async () => {
    const input = fixture(), controller = new AbortController()
    input.signal = controller.signal
    const result = await bakeSheet(input)
    ownedResults.push(result)
    controller.abort('after return')
    expect(input.onCleanupFailure).not.toHaveBeenCalled()
    expect(flex.getPaperFlexField()).toBe(result.flex)
    result.dispose()
    expect(input.onCleanupFailure).toHaveBeenCalledOnce()
    expect(flex.getPaperFlexField()).toBeNull()
  })

  it('returns without waiting for text readiness and still disposes once when readiness arrives after retirement', async () => {
    const ready = deferred<void>(), input = fixture()
    vi.mocked(lettering.makeSheetText).mockImplementationOnce((...args) => ({
      ...actual.lettering.makeSheetText(...args), ready: ready.promise,
    }))
    const result = await bakeSheet(input)
    ownedResults.push(result)
    expect(result.text.ready).toBe(ready.promise)
    result.dispose()
    ready.resolve()
    await result.text.ready
    result.dispose()
    expect(host.texts[0].dispose).toHaveBeenCalledOnce()
    expect(input.onCleanupFailure).toHaveBeenCalledOnce()
  })
})

function rendererFixture(primary?: unknown, restoreError?: unknown) {
  const clearColor = new Color(0.1, 0.2, 0.3)
  const methods = {
    localClippingEnabled: false,
    getRenderTarget: vi.fn(() => null),
    getClearColor: vi.fn((out: Color) => out.copy(clearColor)),
    getClearAlpha: vi.fn(() => 0.4),
    setRenderTarget: vi.fn((target: unknown) => {
      if (target === null && restoreError !== undefined) throw restoreError
    }),
    setClearColor: vi.fn(),
    clear: vi.fn(),
    render: vi.fn(() => { if (primary !== undefined) throw primary }),
    readRenderTargetPixels: vi.fn(),
  }
  return { methods, gl: methods as unknown as WebGLRenderer }
}

describe('actual allocating factory rollback', () => {
  it('composeSheet disposes its temporary extracted geometry after extraction fails, preserving the snapshot', () => {
    const input = fixture(), primary = new Error('extract')
    const triangle = new Float32BufferAttribute([0, 0, 0, 0.01, 0, 0, 0, 0.01, 0], 3)
    input.data.geometry.setAttribute('position', triangle)
    input.data.bounds.setFromBufferAttribute(triangle)
    input.layout = makeDrawingLayout(1, input.data.bounds)
    vi.stubGlobal('window', { location: { search: '?drawingCache=bypass' } })
    vi.mocked(edges.extractView).mockImplementationOnce(() => { throw primary })
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose')
    expect(() => actual.composition.composeSheet(input.gl, input.data, input.layout, vi.fn())).toThrow(primary)
    const temporary = vi.mocked(edges.extractView).mock.calls[0][1]
    expect(temporary).not.toBe(input.data.geometry)
    expect(dispose.mock.contexts).toEqual([temporary])
    expect(input.data.geometry.getAttribute('position')).toBe(triangle)
  })

  it('composeSheet propagates a null cleanup sentinel instead of treating it as success', () => {
    const input = fixture(), primary = null
    const triangle = new Float32BufferAttribute([0, 0, 0, 0.01, 0, 0, 0, 0.01, 0], 3)
    input.data.geometry.setAttribute('position', triangle)
    input.data.bounds.setFromBufferAttribute(triangle)
    input.layout = makeDrawingLayout(1, input.data.bounds)
    vi.stubGlobal('window', { location: { search: '?drawingCache=bypass' } })
    vi.mocked(edges.extractView).mockImplementation(() => ({ outline: new Float32Array(), edges: new Float32Array() }))
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementationOnce(() => { throw primary })
    let thrown: unknown = primary
    let didThrow = false
    try {
      actual.composition.composeSheet(input.gl, input.data, input.layout)
    } catch (error) {
      thrown = error
      didThrow = true
    }
    expect(didThrow).toBe(true)
    expect(thrown).toBeNull()
    expect(dispose).toHaveBeenCalledOnce()
    expect(dispose.mock.contexts).not.toContain(input.data.geometry)
  })

  it('geometryFrom rolls back its new geometry if attribute installation throws', () => {
    const primary = new Error('attribute'), cleanup = new Error('geometry dispose'), sink = vi.fn()
    vi.spyOn(BufferGeometry.prototype, 'setAttribute').mockImplementationOnce(() => { throw primary })
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementation(() => { throw cleanup })
    expect(() => actual.edges.geometryFrom(new Float32Array(9), sink)).toThrow(primary)
    expect(dispose).toHaveBeenCalledOnce()
    expect(sink).toHaveBeenCalledExactlyOnceWith([cleanup])
  })

  it('buildProfileRibbon cleans its allocation if index setup fails', () => {
    const primary = new Error('ribbon index'), sink = vi.fn()
    vi.spyOn(BufferGeometry.prototype, 'setIndex').mockImplementationOnce(() => { throw primary })
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose')
    expect(() => geometryModule.buildProfileRibbon(contour, [0, 0.3, 0.5, 0.8, 1], sink)).toThrow(primary)
    expect(dispose).toHaveBeenCalledOnce()
    expect(sink).not.toHaveBeenCalled()
  })

  it('profileFromPoints rolls back the profile and failed ribbon, even if the first disposer throws', () => {
    const primary = new Error('ribbon index'), cleanup = new Error('dispose'), sink = vi.fn()
    vi.spyOn(BufferGeometry.prototype, 'setIndex').mockImplementationOnce(() => { throw primary })
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementation(() => { throw cleanup })
    expect(() => actual.profile.profileFromPoints(contour, sink)).toThrow(primary)
    expect(dispose).toHaveBeenCalledTimes(2)
    expect(new Set(dispose.mock.contexts).size).toBe(2)
    expect(sink.mock.calls.flatMap(([errors]) => errors)).toEqual([cleanup, cleanup])
  })

  it('bakeProfile cleans material exactly once when Mesh construction throws before renderer setup', () => {
    const input = fixture(), primary = new Error('profile mesh'), sink = vi.fn()
    const dispose = vi.spyOn(Material.prototype, 'dispose')
    host.meshFailure = primary
    expect(() => actual.profile.bakeProfile(input.gl, input.data, input.layout, sink)).toThrow(primary)
    expect(dispose).toHaveBeenCalledOnce()
    expect(sink).not.toHaveBeenCalled()
  })

  it('depthField cleans material exactly once when render-target construction fails', () => {
    const input = fixture(), primary = new Error('render target'), sink = vi.fn()
    const dispose = vi.spyOn(Material.prototype, 'dispose')
    host.targetFailure = primary
    expect(() => actual.edges.extractView(input.gl, input.data.geometry,
      { hard: new Float32Array(), smooth: new Float32Array(), smoothNormals: new Float32Array(), triangles: 0 },
      { transform: new Matrix4(), rect: [0, 0, 0.001, 0.001], resolution: 8 }, sink)).toThrow(primary)
    expect(dispose).toHaveBeenCalledOnce()
    expect(sink).not.toHaveBeenCalled()
  })

  for (const surface of ['depthField', 'bakeProfile']) {
    it(`preserves the ${surface} render error while attempting all restoration and disposal`, () => {
      const input = fixture(), primary = new Error('render'), cleanup = new Error('restore'), sink = vi.fn()
      const renderer = rendererFixture(primary, cleanup)
      const materialDispose = vi.spyOn(Material.prototype, 'dispose')
      const targetDispose = vi.spyOn(WebGLRenderTarget.prototype, 'dispose')
      const borrowDispose = vi.spyOn(input.data.geometry, 'dispose')
      const invoke = surface === 'depthField'
        ? () => actual.edges.extractView(renderer.gl, input.data.geometry,
          { hard: new Float32Array(), smooth: new Float32Array(), smoothNormals: new Float32Array(), triangles: 0 },
          { transform: new Matrix4(), rect: [0, 0, 0.001, 0.001], resolution: 8 }, sink)
        : () => actual.profile.bakeProfile(renderer.gl, input.data, input.layout, sink)
      expect(invoke).toThrow(primary)
      expect(renderer.methods.setRenderTarget.mock.calls.at(-1)).toEqual([null])
      expect(renderer.methods.setClearColor.mock.calls.at(-1)?.[1]).toBe(0.4)
      expect(renderer.methods.localClippingEnabled).toBe(false)
      expect(materialDispose).toHaveBeenCalledOnce()
      expect(targetDispose).toHaveBeenCalledOnce()
      expect(borrowDispose).not.toHaveBeenCalled()
      expect(sink.mock.calls.flatMap(([errors]) => errors)).toEqual([cleanup])
    })
  }

  for (const surface of ['depthField', 'bakeProfile'] as const) {
    it('fails loudly when ' + surface + ' restoration throws null without a sink', () => {
      const input = fixture(), cleanup = null
      const renderer = rendererFixture(null, cleanup)
      const materialDispose = vi.spyOn(Material.prototype, 'dispose')
      const targetDispose = vi.spyOn(WebGLRenderTarget.prototype, 'dispose')
      const invoke = surface === 'depthField'
        ? () => actual.edges.extractView(renderer.gl, input.data.geometry,
          { hard: new Float32Array(), smooth: new Float32Array(), smoothNormals: new Float32Array(), triangles: 0 },
          { transform: new Matrix4(), rect: [0, 0, 0.001, 0.001], resolution: 8 })
        : () => actual.profile.bakeProfile(renderer.gl, input.data, input.layout)
      let thrown: unknown = cleanup
      let didThrow = false
      try {
        invoke()
      } catch (error) {
        thrown = error
        didThrow = true
      }
      expect(didThrow).toBe(true)
      expect(thrown).toBeNull()
      expect(renderer.methods.setRenderTarget.mock.calls.at(-1)).toEqual([null])
      expect(materialDispose).toHaveBeenCalledOnce()
      expect(targetDispose).toHaveBeenCalledOnce()
    })
  }

  for (const surface of ['depthField', 'bakeProfile'] as const) {
    it(`preserves the ${surface} render error over a restoration failure without a sink`, () => {
      const input = fixture(), primary = new Error('render'), cleanup = new Error('restore')
      const renderer = rendererFixture(primary, cleanup)
      const materialDispose = vi.spyOn(Material.prototype, 'dispose')
      const targetDispose = vi.spyOn(WebGLRenderTarget.prototype, 'dispose')
      const borrowDispose = vi.spyOn(input.data.geometry, 'dispose')
      const invoke = surface === 'depthField'
        ? () => actual.edges.extractView(renderer.gl, input.data.geometry,
          { hard: new Float32Array(), smooth: new Float32Array(), smoothNormals: new Float32Array(), triangles: 0 },
          { transform: new Matrix4(), rect: [0, 0, 0.001, 0.001], resolution: 8 })
        : () => actual.profile.bakeProfile(renderer.gl, input.data, input.layout)
      expect(invoke).toThrow(primary)
      expect(renderer.methods.setRenderTarget.mock.calls.at(-1)).toEqual([null])
      expect(materialDispose).toHaveBeenCalledOnce()
      expect(targetDispose).toHaveBeenCalledOnce()
      expect(borrowDispose).not.toHaveBeenCalled()
    })
  }

  it('rolls back earlier fragment geometries plus a later failed fragment without double disposal', () => {
    const primary = new Error('later fracture'), sink = vi.fn()
    const setAttribute = BufferGeometry.prototype.setAttribute
    let positions = 0
    vi.spyOn(BufferGeometry.prototype, 'setAttribute').mockImplementation(function (this: BufferGeometry, name, attribute) {
      if (name === 'position' && ++positions === 3) throw primary
      return setAttribute.call(this, name, attribute)
    })
    const dispose = vi.spyOn(BufferGeometry.prototype, 'dispose')
    expect(() => actual.fracture.makeBreakthroughGeometry(contour, 0.8, 0.5, sink)).toThrow(primary)
    expect(positions).toBe(3)
    expect(dispose).toHaveBeenCalledTimes(3)
    expect(new Set(dispose.mock.contexts).size).toBe(3)
  })

  for (const kind of ['lines', 'fills'] as const) {
    it(`makeInk ${kind} rolls back geometry and material after Mesh construction fails`, () => {
      const primary = new Error('ink mesh'), sink = vi.fn(), builder = composedFixture().ink
      const uniforms = actual.ink.makeSheetUniforms()
      const geometryDispose = vi.spyOn(BufferGeometry.prototype, 'dispose')
      const materialDispose = vi.spyOn(Material.prototype, 'dispose')
      host.meshFailure = primary
      expect(() => (kind === 'lines' ? actual.ink.makeInkLines : actual.ink.makeInkFills)(builder, uniforms, sink)).toThrow(primary)
      expect(geometryDispose).toHaveBeenCalledOnce()
      expect(materialDispose).toHaveBeenCalledOnce()
    })
  }

  it('invalid handwriting metrics dispose the Text allocated before member registration, plus batch/material', () => {
    const dispose = vi.spyOn(Material.prototype, 'dispose'), sink = vi.fn()
    expect(() => actual.lettering.makeSheetText([
      { text: 'not-a-reference-glyph', x: 0, y: 0, size: 0.0038, group: ink.GROUP.noteInput,
        key: 0, weight: 'handwriting', color: 'graphite' },
    ], actual.ink.makeSheetUniforms(), sink)).toThrow('Missing reference font metrics')
    expect(host.texts).toHaveLength(1)
    expect(host.texts[0].font).toBe('/fonts/AcFastReference.ttf')
    expect(host.texts[0].dispose).toHaveBeenCalledOnce()
    expect(host.batches[0].dispose).toHaveBeenCalledOnce()
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('a throwing Text disposer does not skip its batch/material cleanup or replace invalid-metrics error', () => {
    const cleanup = new Error('text dispose'), sink = vi.fn()
    // A real sheetText call first creates a batch and a Text; fault the mock Text's disposal.
    const push = host.texts.push.bind(host.texts)
    vi.spyOn(host.texts, 'push').mockImplementation((...texts) => {
      for (const text of texts) text.dispose.mockImplementation(() => { throw cleanup })
      return push(...texts)
    })
    const dispose = vi.spyOn(Material.prototype, 'dispose')
    expect(() => actual.lettering.makeSheetText([
      { text: '?invalid', x: 0, y: 0, size: 0.003, group: 0, key: 0, weight: 'handwriting' },
    ], undefined, sink)).toThrow('Missing reference font metrics')
    expect(host.texts[0].dispose).toHaveBeenCalledOnce()
    expect(host.batches[0].dispose).toHaveBeenCalledOnce()
    expect(dispose).toHaveBeenCalledOnce()
    // The mock batch inherits the same allocation hook, so both failures reach the sink.
    expect(sink.mock.calls.flatMap(([errors]) => errors)).toContain(cleanup)
  })

  it('synchronous text sync failure enters construction rollback', () => {
    const primary = new Error('sync'), sink = vi.fn()
    const push = host.texts.push.bind(host.texts)
    vi.spyOn(host.texts, 'push').mockImplementation((...texts) => {
      for (const text of texts) text.sync.mockImplementation(() => { throw primary })
      return push(...texts)
    })
    const materialDispose = vi.spyOn(Material.prototype, 'dispose')
    expect(() => actual.lettering.makeSheetText([
      { text: 'A', x: 0, y: 0, size: 0.003, group: ink.GROUP.noteInput, key: 0 },
    ], undefined, sink)).toThrow(primary)
    expect(host.texts).toHaveLength(1)
    expect(host.texts[0].dispose).toHaveBeenCalledOnce()
    expect(host.batches[0].dispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
  })

  it('batch-owned data textures survive a throwing inherited geometry disposal', () => {
    const geometryCleanup = new Error('batch geometry'), sink = vi.fn()
    const firstTexture = { dispose: vi.fn() }
    const secondTexture = { dispose: vi.fn() }
    host.batchGeometryFailure = geometryCleanup
    host.batchTextures.push(firstTexture, secondTexture)
    const layer = actual.lettering.makeSheetText([
      { text: 'A', x: 0, y: 0, size: 0.003, group: ink.GROUP.noteInput, key: 0 },
    ])
    layer.dispose(sink)
    expect(host.batches[0].dispose).toHaveBeenCalledOnce()
    expect(firstTexture.dispose).toHaveBeenCalledOnce()
    expect(secondTexture.dispose).toHaveBeenCalledOnce()
    expect(sink).toHaveBeenCalledExactlyOnceWith([geometryCleanup])
  })

  it('barrier-mask texture setup failure rolls back its allocated texture with a resilient sink', () => {
    const primary = new Error('texture setup'), cleanup = new Error('texture dispose'), sink = vi.fn()
    vi.spyOn(Texture.prototype, 'needsUpdate', 'set').mockImplementation(() => { throw primary })
    const dispose = vi.spyOn(Texture.prototype, 'dispose').mockImplementation(() => { throw cleanup })
    expect(() => actual.masks.makeBarrierMask(contour, 0.8, 0.5, sink)).toThrow(primary)
    expect(dispose).toHaveBeenCalledOnce()
    expect(sink).toHaveBeenCalledExactlyOnceWith([cleanup])
  })

  for (const kind of ['print', 'cracks'] as const) {
    it(`rolls back the actual ${kind} canvas texture if post-allocation filter setup throws`, () => {
      const primary = new Error('filter'), sink = vi.fn()
      // CanvasTexture marks needsUpdate inside its constructor. Inject after that succeeds.
      vi.spyOn(Texture.prototype, 'needsUpdate', 'set').mockImplementation(function (this: Texture) {
        Object.defineProperty(this, 'minFilter', { configurable: true, set: () => { throw primary } })
      })
      const dispose = vi.spyOn(Texture.prototype, 'dispose')
      const cracks = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([], 3))
      borrowed.push(cracks)
      cracks.setAttribute('arcLength', new Float32BufferAttribute([], 1))
      expect(() => kind === 'print'
        ? actual.masks.makeFragmentPrint([], [], 0.8, 0.5, sink)
        : actual.masks.makeCrackMask(contour, cracks, 0.8, 0.5, sink)).toThrow(primary)
      expect(dispose).toHaveBeenCalledOnce()
      expect(sink).not.toHaveBeenCalled()
    })
  }
})

async function settleHost() {
  // Flush the then/catch chain; no renderer, browser or React root is created here.
  for (let i = 0; i < 6; i++) await Promise.resolve()
}

function startHost(input: SheetBakeInput) {
  host.gl = input.gl
  DrawingLinework({ data: input.data })
  const effect = host.effects.at(-1)!
  return effect() as () => void
}

describe('legacy adapter installation guard', () => {
  it('disposes a stale result exactly once and publishes no stats or React result', async () => {
    const input = fixture(), pending = deferred<SheetBakeResult>()
    const result = await actual.bake.bakeSheet(input)
    ownedResults.push(result)
    const dispose = vi.spyOn(result, 'dispose')
    vi.mocked(bakeSheet).mockReturnValueOnce(pending.promise)
    const cleanup = startHost(input)
    const signal = vi.mocked(bakeSheet).mock.calls[0][0].signal!
    cleanup()
    cleanup()
    expect(signal.aborted).toBe(true)
    pending.resolve(result)
    await settleHost()
    expect(dispose).toHaveBeenCalledOnce()
    expect(window.__sheetStats).toBeUndefined()
    expect(host.setState.mock.calls).toEqual([[null]])
    expect(forcePoster).not.toHaveBeenCalled()
  })

  it('rejects an earlier epoch even if its result arrives before its cleanup is called', async () => {
    const first = fixture(), second = fixture()
    const resultA = await actual.bake.bakeSheet(first), resultB = await actual.bake.bakeSheet(second)
    ownedResults.push(resultA, resultB)
    const disposeA = vi.spyOn(resultA, 'dispose'), disposeB = vi.spyOn(resultB, 'dispose')
    const a = deferred<SheetBakeResult>(), b = deferred<SheetBakeResult>()
    vi.mocked(bakeSheet).mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
    const cleanupA = startHost(first), cleanupB = startHost(second)
    a.resolve(resultA)
    await settleHost()
    expect(disposeA).toHaveBeenCalledOnce()
    expect(window.__sheetStats).toBeUndefined()
    cleanupA()
    b.resolve(resultB)
    await settleHost()
    expect(window.__sheetStats).toBe(resultB.stats)
    expect(host.setState).toHaveBeenLastCalledWith(resultB)
    cleanupB()
    cleanupB()
    expect(disposeA).toHaveBeenCalledOnce()
    expect(disposeB).toHaveBeenCalledOnce()
  })

  it('keeps initialization failure and cleanup diagnostics in the host, with no bake quality policy', async () => {
    const primary = new Error('factory'), cleanupError = new Error('cleanup'), input = fixture()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(bakeSheet).mockRejectedValueOnce(primary)
    const cleanup = startHost(input)
    const request = vi.mocked(bakeSheet).mock.calls[0][0]
    request.onCleanupFailure(Object.freeze([cleanupError]))
    await settleHost()
    expect(error).toHaveBeenCalledWith('Drawing cleanup failed', [cleanupError])
    expect(error).toHaveBeenCalledWith('Drawing initialization failed', primary)
    expect(forcePoster).toHaveBeenCalledOnce()
    expect(window.__sheetStats).toBeUndefined()
    cleanup()
  })

  it('suppresses stale rejection policy after unmount', async () => {
    const input = fixture(), pending = deferred<SheetBakeResult>()
    vi.mocked(bakeSheet).mockReturnValueOnce(pending.promise)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cleanup = startHost(input)
    cleanup()
    // Simulate a late adapter input rejection through a thenable delivery fault.
    pending.resolve(Promise.reject(new DOMException('cancelled', 'AbortError')))
    await settleHost()
    expect(error).not.toHaveBeenCalled()
    expect(forcePoster).not.toHaveBeenCalled()
  })
})
