import { describe, expect, it, vi, type MockInstance } from 'vitest'
import {
  BufferGeometry, Group, Matrix4, Mesh, PointLight, ShaderMaterial, Texture, Vector2, Vector3,
} from 'three'
import { DRAWING_INTRO_WINDOW, drawingIntroState, INTRO_PHASES } from '../drawing/introTimeline'
import { makeSheetUniforms, GROUP } from '../drawing/sheet/ink'
import { paperFlexAmplitude } from '../drawing/sheet/paperFlex'
import type { SheetBakeResult } from '../drawing/sheet/sheetBake'
import type { ExtractionContext } from '../drawing/poseCore'
import {
  createPrivateSheetRuntime, type DrawingFrameInput, type PrivateSheetFactories,
} from './privateSheetRuntime'

/** CPU resource fixtures; no canvas, rasterization, GPU or framing claims. */
function fixture(failAt?: string) {
  const owned: Array<{ resource: { dispose(): void }; disposed: MockInstance }> = []
  const borrowed: MockInstance[] = []
  const constructionError = new Error('construction boundary ' + failAt)
  const check = (stage: string) => { if (failAt === stage) throw constructionError }
  const track = <T extends { dispose(): void }>(resource: T): T => {
    const disposable = resource as { dispose(): void }
    owned.push({ resource, disposed: vi.spyOn(disposable, 'dispose') as MockInstance })
    return resource
  }
  const borrow = <T extends { dispose(): void }>(resource: T): T => {
    const disposable = resource as { dispose(): void }
    borrowed.push(vi.spyOn(disposable, 'dispose') as MockInstance)
    return resource
  }
  const uniforms = makeSheetUniforms()
  uniforms.uPortalLight = { value: 0 }
  uniforms.uBarrierMask.value = borrow(new Texture())
  const lines = new Mesh(borrow(new BufferGeometry()), borrow(new ShaderMaterial({ uniforms })))
  const fills = new Mesh(borrow(new BufferGeometry()), borrow(new ShaderMaterial({ uniforms })))
  const textReady = { resolve: () => {}, reject: (_error: unknown) => {} }
  const ready = new Promise<void>((resolve, reject) => { textReady.resolve = resolve; textReady.reject = reject })
  const text = { object: new Group(), ready, update: vi.fn(), dispose: vi.fn() }
  const fracture = {
    paper: borrow(new BufferGeometry()), edge: borrow(new BufferGeometry()), cracks: borrow(new BufferGeometry()),
    fragments: [{
      geometry: borrow(new BufferGeometry()), center: new Vector2(0.02, -0.03),
      velocity: new Vector3(0.05, 0.12, 0.08), spin: new Vector3(0.4, -0.5, 0.6), delay: 0.2,
    }],
    outline: [[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1]],
    thickness: 0.00045, area: 0.04, fragmentArea: 0.04, maxBoundaryDeviation: 0.0002,
    dispose: vi.fn(),
  }
  // Geometry/bake production belongs to the external lane. This fixture supplies
  // their contract's presentation fields and guards every borrowed disposer.
  const baked = {
    layout: { primaryCenter: new Vector3(0.01, 0.02, 0) },
    extraction: { crossing: 0.9, clearanceTravel: 0.08 },
    uniforms, lines, fills, text, fracture,
    rendered: { profilePoints: fracture.outline, dispose: vi.fn() },
    flex: { peak: 0.75, texture: borrow(new Texture()) },
    barrierMask: uniforms.uBarrierMask.value, fragmentPrint: borrow(new Texture()), crackMask: borrow(new Texture()),
    stats: { flexFieldPeak: 0.75 }, dispose: vi.fn(),
  } as unknown as SheetBakeResult
  let materialCount = 0
  const factories: PrivateSheetFactories = {
    grain: () => { check('grain'); return track(new Texture()) },
    desk: () => { check('desk'); return track(new BufferGeometry()) },
    ribbon: () => { check('ribbon'); return track(new BufferGeometry()) },
    material: parameters => {
      check('material-' + ++materialCount)
      return track(new ShaderMaterial(parameters))
    },
    portal: (_outline, initialModelBottom, _center, sharedLight) => {
      check('portal')
      const group = new Group()
      const cap = new Mesh(track(new BufferGeometry()), track(new ShaderMaterial()))
      const walls = new Mesh(track(new BufferGeometry()), track(new ShaderMaterial()))
      const light = track(new PointLight())
      group.add(cap, walls, light)
      return {
        group, cap, walls, light, initialModelBottom, capZ: -3.2, mouthZ: -0.0005,
        profilePoints: 4, wallLevels: 8,
        update: vi.fn((_time: number, strength: number, _lite: boolean, _reduced: boolean) => {
          sharedLight.value = strength
          return 1
        }),
        dispose: vi.fn(),
      } as unknown as ReturnType<PrivateSheetFactories['portal']>
    },
  }
  const context: ExtractionContext = {
    sheetMatrix: new Matrix4().makeTranslation(0.1, 0.2, 0.3),
    modelMatrix: new Matrix4().makeTranslation(0.1, 0.2, 0.4),
  }
  return { baked, context, factories, owned, borrowed, textReady, constructionError }
}

function frame(t: number, overrides: Partial<DrawingFrameInput> = {}): DrawingFrameInput {
  return {
    intro: drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd),
    tier: 'full', reducedMotion: false, proofMode: 'normal', retirement: 0,
    cameraLookTargetWorld: null, cameraSheetDistance: 0.4, delta: 0,
    ...overrides,
  }
}
const viewport = new Vector2(1440, 900)

function fragmentSnapshot(group: Group) {
  const mesh = group.getObjectByName('paper-fragment-0')!
  return { position: mesh.position.toArray(), rotation: mesh.rotation.toArray(), visible: mesh.visible }
}

describe('private sheet explicit frame application', () => {
  it('borrows bake objects, consumes host matrices and never writes model/sheet context', () => {
    const f = fixture()
    const context = { sheet: f.context.sheetMatrix.clone(), model: f.context.modelMatrix.clone() }
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(0.85, { retirement: 0.5 }), f.context, viewport)
    expect(runtime.group.matrix.equals(context.sheet)).toBe(true)
    expect(f.context.sheetMatrix.equals(context.sheet)).toBe(true)
    expect(f.context.modelMatrix.equals(context.model)).toBe(true)
    expect(f.baked.lines.parent).toBe(runtime.group)
    expect(f.baked.fills.parent).toBe(runtime.group)
    expect(f.baked.text.object.parent).toBe(runtime.group)
    expect(f.baked.uniforms.uViewport.value.toArray()).toEqual([1440, 900])
    expect(runtime.stats.localZ).toBeCloseTo(0.1, 12)
    expect(runtime.stats.portalInitialModelBottom).toBeCloseTo(0.0006 - 0.08, 12)
    runtime.dispose()
  })

  it('retraces delayed ballistic fragments on reverse/seek/hold without accumulated time', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    const checkpoints = [0.7, 0.84, 0.851, 0.865, 0.875, 0.9, 1]
    const snapshots = new Map<number, ReturnType<typeof fragmentSnapshot>>()
    for (const t of checkpoints) {
      const input = frame(t)
      runtime.apply(input, f.context, viewport)
      snapshots.set(t, fragmentSnapshot(runtime.group))
      const fragment = f.baked.fracture.fragments[0]
      const event = Math.max(0, Math.min(1, ((input.intro.t - INTRO_PHASES.fractureStart)
        / (INTRO_PHASES.fractureEnd - INTRO_PHASES.fractureStart) - fragment.delay) / (1 - fragment.delay)))
      expect(snapshots.get(t)!.position.every(Number.isFinite)).toBe(true)
      if (event === 0) expect(snapshots.get(t)!.position).toEqual([fragment.center.x, fragment.center.y, .00002])
      if (event === 1) expect(snapshots.get(t)!.position[2]).toBeLessThan(-.12)
    }
    for (const t of [...checkpoints].reverse().concat([0.865, 0.7, 0.9, 0.851])) {
      runtime.apply(frame(t), f.context, viewport)
      expect(fragmentSnapshot(runtime.group)).toEqual(snapshots.get(t))
      for (let i = 0; i < 5; i++) {
        runtime.apply(frame(t), f.context, viewport)
        expect(fragmentSnapshot(runtime.group)).toEqual(snapshots.get(t))
      }
    }
    runtime.dispose()
  })

  it('lifts the shards higher and keeps them airborne through the bullet-time orbit', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    let apex = 0
    for (const t of [0.845, 0.855, 0.865, 0.875, 0.885, 0.9]) {
      runtime.apply(frame(t), f.context, viewport)
      apex = Math.max(apex, fragmentSnapshot(runtime.group).position[2])
    }
    // The owner asked for a higher launch than the previous .065 sheet lift.
    expect(apex).toBeGreaterThan(0.1)
    runtime.dispose()
  })

  it('retires the pit with the printed stock and restores it on reverse', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(1, { retirement: 1 }), f.context, viewport)
    expect(runtime.group.visible).toBe(true)
    expect(runtime.group.matrix.equals(f.context.sheetMatrix)).toBe(true)
    expect(f.baked.lines.visible).toBe(false)
    expect(f.baked.text.object.visible).toBe(false)
    expect(runtime.group.getObjectByName('paper-fragment-0')!.visible).toBe(false)
    expect(runtime.stats.pitRetained).toBe(0)
    expect(runtime.stats.stockRetired).toBe(1)
    runtime.apply(frame(.9, { retirement: .5 }), f.context, viewport)
    expect(runtime.stats.pitRetained).toBe(1)
    runtime.apply(frame(.9, { retirement: 0 }), f.context, viewport)
    expect(runtime.stats.pitRetained).toBe(1)
    runtime.dispose()
  })

  it('retains pressure tier scaling, opaque stock, portal gating and inert legacy wave', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    for (const tier of ['full', 'lite'] as const) {
      const input = frame(0.82, { tier })
      runtime.apply(input, f.context, viewport)
      expect(f.baked.uniforms.uFlexAmplitude.value).toBe(paperFlexAmplitude(
        input.intro.t, input.intro.poseT, 0.9, tier, false))
      expect(runtime.stats.flexPeakDisplacement).toBe(f.baked.uniforms.uFlexAmplitude.value * 0.75)
      expect(f.baked.uniforms.uWaveEnabled.value).toBe(0)
      expect(runtime.stats.paperOpacity).toBe(1)
      expect(runtime.stats.portalActive).toBe(0) // no portal before actual rupture
    }
    runtime.apply(frame(0.82, { reducedMotion: true }), f.context, viewport)
    expect(f.baked.uniforms.uFlexAmplitude.value).toBe(0)
    expect(f.baked.uniforms.uPulse.value).toBe(0)
    expect(f.baked.uniforms.uCrackWeb.value).toBe(0)
    expect(f.baked.uniforms.uFracture.value).toBe(0)
    expect(f.baked.uniforms.uLampPower.value).toBe(1)
    expect(runtime.stats.portalLight).toBe(0)
    expect(fragmentSnapshot(runtime.group).position).toEqual([0.02, -0.03, 0.00002])
    runtime.dispose()
  })

  it('resets ink from its base each frame and preserves text/portal frame laws', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    const input = frame(0.6)
    runtime.apply(input, f.context, viewport)
    const expected = f.baked.uniforms.uInk.value.toArray()
    for (let i = 0; i < 30; i++) runtime.apply(input, f.context, viewport)
    expect(f.baked.uniforms.uInk.value.toArray()).toEqual(expected)
    expect(f.baked.text.update).toHaveBeenLastCalledWith(f.baked.uniforms.uReveal.value,
      input.intro.drawingOpacity * (0.88 + 0.12 * input.intro.lampPower))
    runtime.dispose()
  })

  it('gives separated glass measurable thickness while retaining intact and reduced-motion stock', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(.86), f.context, viewport)
    expect(runtime.stats.glassThickness).toBeGreaterThan(f.baked.fracture.thickness)
    const shard = runtime.group.getObjectByName('paper-fragment-0') as Mesh<BufferGeometry, ShaderMaterial>
    expect(shard.position.z).toBeGreaterThan(.04) // above intact stock during the suspended beat
    expect(shard.material.vertexShader).toContain('smoothstep(0.0, .15, uFracture) * 4.0')
    expect(shard.material.fragmentShader).toContain('reflect(-view, n)')
    runtime.apply(frame(.86, { reducedMotion: true }), f.context, viewport)
    expect(shard.material.uniforms.uFracture.value).toBe(0)
    runtime.dispose()
  })

  it('seeds the first explicit lamp target, freezes at zero delta, and clamps settling delta', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(0.4, { cameraLookTargetWorld: new Vector3(0.2, 0.4, 0.3) }), f.context, viewport)
    expect(f.baked.uniforms.uLamp.value.x).toBeCloseTo(0.1, 12)
    expect(f.baked.uniforms.uLamp.value.y).toBeCloseTo(0.2, 12)
    expect(f.baked.uniforms.uLamp.value.z).toBeCloseTo(0.4 * 0.55, 12)
    const before = f.baked.uniforms.uLamp.value.clone()
    const target = new Vector3(0.5, 0.6, 0.3)
    runtime.apply(frame(0.4, { cameraLookTargetWorld: target, delta: 0 }), f.context, viewport)
    expect(f.baked.uniforms.uLamp.value.equals(before)).toBe(true)
    runtime.apply(frame(0.4, { cameraLookTargetWorld: target, delta: 100 }), f.context, viewport)
    const k = 1 - Math.exp(-3 * 0.1)
    expect(f.baked.uniforms.uLamp.value.x).toBeCloseTo(before.x + (0.4 - before.x) * k, 12)
    expect(f.baked.uniforms.uLamp.value.y).toBeCloseTo(before.y + (0.4 - before.y) * k, 12)
    const settled = f.baked.uniforms.uLamp.value.clone()
    runtime.apply(frame(0.4, { cameraLookTargetWorld: null, delta: 1 }), f.context, viewport)
    expect(f.baked.uniforms.uLamp.value.equals(settled)).toBe(true)
    runtime.dispose()
  })

  it('retires stock from explicit progress; drawing-edges and reduced motion retain stock', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(1, { retirement: 1 }), f.context, viewport)
    expect(runtime.group.visible).toBe(true)
    expect(f.baked.lines.visible).toBe(false)
    runtime.apply(frame(1, { retirement: 1, proofMode: 'drawing-edges' }), f.context, viewport)
    expect(runtime.group.visible).toBe(true)
    expect(runtime.group.matrix.equals(f.context.sheetMatrix)).toBe(true)
    expect(f.baked.uniforms.uReveal.value[GROUP.side]).toBe(1)
    expect(f.baked.uniforms.uReveal.value.filter((_, i) => i !== GROUP.side).every(v => v === 0)).toBe(true)
    expect(f.baked.uniforms.uMode.value).toBe(1)
    expect(f.baked.lines.visible).toBe(true)
    expect(f.baked.fills.visible).toBe(false)
    expect(f.baked.text.object.visible).toBe(false)
    runtime.apply(frame(1, { retirement: 1, reducedMotion: true }), f.context, viewport)
    expect(runtime.group.visible).toBe(true)
    expect(f.baked.uniforms.uReveal.value.every(v => v === 1)).toBe(true)
    runtime.apply(frame(0.2, { reducedMotion: true }), f.context, viewport)
    expect(f.baked.uniforms.uReveal.value[GROUP.printed]).toBe(1)
    expect(f.baked.uniforms.uReveal.value[GROUP.side]).toBe(0)
    expect(f.baked.uniforms.uReveal.value[GROUP.gdt]).toBe(0)
    runtime.dispose()
  })

  it.each(['drawing-mask', 'model-mask', 'model-edges', 'unknown'])('rejects unsupported proof %s before mutation', proofMode => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(0.7), f.context, viewport)
    const before = runtime.group.matrix.clone()
    const ink = f.baked.uniforms.uInk.value.clone()
    expect(() => runtime.apply(frame(1, { proofMode }), f.context, viewport)).toThrow(/Unsupported.*proofMode/)
    expect(runtime.group.matrix.equals(before)).toBe(true)
    expect(f.baked.uniforms.uInk.value.equals(ink)).toBe(true)
    runtime.dispose()
  })
})

describe('private sheet presentation ownership', () => {
  it('disposes all owned resources once, leaves borrowed bake untouched, and restores bindings/parents', () => {
    const f = fixture()
    const previousParent = new Group()
    previousParent.add(f.baked.lines)
    const priorMode = { value: 7 }
    f.baked.uniforms.uMode = priorMode
    const report = vi.fn()
    const runtime = createPrivateSheetRuntime(f.baked, report, f.factories)
    runtime.dispose(); runtime.dispose()
    for (const entry of f.owned) expect(entry.disposed).toHaveBeenCalledTimes(1)
    for (const spy of f.borrowed) expect(spy).not.toHaveBeenCalled()
    expect(f.baked.dispose).not.toHaveBeenCalled()
    expect(f.baked.fracture.dispose).not.toHaveBeenCalled()
    expect(f.baked.rendered.dispose).not.toHaveBeenCalled()
    expect(f.baked.text.dispose).not.toHaveBeenCalled()
    expect(f.baked.lines.parent).toBe(previousParent)
    expect(f.baked.uniforms.uMode).toBe(priorMode)
    expect(f.baked.uniforms.uGrain).toBeUndefined()
    expect(report).toHaveBeenCalledTimes(1)
    expect(report.mock.calls[0][0]).toEqual([])
    expect(Object.isFrozen(report.mock.calls[0][0])).toBe(true)
    expect(() => runtime.apply(frame(0.5), f.context, viewport)).toThrow(/disposed/)
  })

  it('attempts every cleanup despite resource/report failures and protects later uniform owners', () => {
    const f = fixture()
    const report = vi.fn((_errors: readonly unknown[]) => { throw new Error('report failure') })
    const runtime = createPrivateSheetRuntime(f.baked, report, f.factories)
    const errors = [new Error('grain disposal'), new Error('last portal resource disposal')]
    f.owned[0].disposed.mockImplementation(() => { throw errors[0] })
    f.owned[f.owned.length - 1].disposed.mockImplementation(() => { throw errors[1] })
    const laterGrain = { value: new Texture() }
    f.baked.uniforms.uGrain = laterGrain
    expect(() => runtime.dispose()).not.toThrow()
    for (const entry of f.owned) expect(entry.disposed).toHaveBeenCalledTimes(1)
    expect(report).toHaveBeenCalledTimes(1)
    expect(report.mock.calls[0][0]).toEqual([errors[1], errors[0]])
    expect(f.baked.uniforms.uGrain).toBe(laterGrain)
    runtime.dispose()
    expect(report).toHaveBeenCalledTimes(1)
  })

  it.each(['grain', 'material-1', 'material-2', 'material-3', 'material-4', 'material-5',
    'desk', 'ribbon', 'material-6', 'portal'])('rolls back partial construction at %s without replacing its error', failAt => {
    const f = fixture(failAt)
    const report = vi.fn((_errors: readonly unknown[]) => { throw new Error('report failed') })
    expect(() => createPrivateSheetRuntime(f.baked, report, f.factories)).toThrow(f.constructionError)
    for (const entry of f.owned) expect(entry.disposed).toHaveBeenCalledTimes(1)
    for (const spy of f.borrowed) expect(spy).not.toHaveBeenCalled()
    expect(f.baked.dispose).not.toHaveBeenCalled()
    expect(f.baked.uniforms.uGrain).toBeUndefined()
    expect(report).toHaveBeenCalledTimes(1)
  })

  it('recreates presentation over the same live bake and ignores late readiness after disposal', async () => {
    const f = fixture()
    const report = vi.fn()
    const first = createPrivateSheetRuntime(f.baked, report, f.factories)
    first.dispose()
    f.textReady.resolve()
    await Promise.resolve()
    expect(f.baked.stats.annotationsReady).toBe(0)
    const second = createPrivateSheetRuntime(f.baked, report, f.factories)
    await Promise.resolve()
    expect(second.stats.annotationsReady).toBe(1)
    second.apply(frame(0.82), f.context, viewport)
    expect(second.group.visible).toBe(true)
    second.dispose()
    expect(report).toHaveBeenCalledTimes(2)
    for (const spy of f.borrowed) expect(spy).not.toHaveBeenCalled()
  })

  it('surfaces text readiness rejection on the next host frame and guards rejection after unmount', async () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    const error = new Error('text readiness failed')
    f.textReady.reject(error)
    await Promise.resolve()
    expect(runtime.stats.annotationsFailed).toBe(1)
    expect(() => runtime.apply(frame(0.4), f.context, viewport)).toThrow(error)
    runtime.dispose()
    const late = fixture()
    const disposed = createPrivateSheetRuntime(late.baked, vi.fn(), late.factories)
    disposed.dispose()
    late.textReady.reject(error)
    await Promise.resolve()
    expect(late.baked.stats.annotationsFailed).toBe(0)
  })
})
