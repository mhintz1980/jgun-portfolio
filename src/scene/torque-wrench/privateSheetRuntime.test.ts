import { describe, expect, it, vi, type MockInstance } from 'vitest'
import {
  BufferGeometry,
  Color,
  Group,
  Matrix4,
  Mesh,
  PointLight,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
} from 'three'
import { DRAWING_INTRO_WINDOW, drawingIntroState, INTRO_PHASES } from '../drawing/introTimeline'
import * as introSource from '../drawing/introTimeline'
import * as openingSource from './OpeningDirector'
import * as domeSource from './shardDome'
import * as geometrySource from '../drawing/drawingGeometry'
import { BULLET_TIME_SHOT_SPECS } from './bulletTime'
// @ts-expect-error Node verification helper has no declaration file.
import { shatterPhysicalGates } from '../../../scripts/verify-page-cinematography.mjs'
import { makeSheetUniforms, GROUP } from '../drawing/sheet/ink'
import { paperFlexAmplitude } from '../drawing/sheet/paperFlex'
import type { SheetBakeResult } from '../drawing/sheet/sheetBake'
import type { ExtractionContext } from '../drawing/poseCore'
import {
  createPrivateSheetRuntime,
  PRIVATE_GLOW_ORDER,
  PRIVATE_INK_ORDER,
  PRIVATE_INTACT_STOCK_ORDER,
  type DrawingFrameInput,
  type PrivateSheetFactories,
} from './privateSheetRuntime'

/** CPU resource fixtures; no canvas, rasterization, GPU or framing claims. */
function fixture(failAt?: string) {
  const owned: Array<{ resource: { dispose(): void }; disposed: MockInstance }> = []
  const borrowed: MockInstance[] = []
  const constructionError = new Error('construction boundary ' + failAt)
  const check = (stage: string) => {
    if (failAt === stage) throw constructionError
  }
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
  const ready = new Promise<void>((resolve, reject) => {
    textReady.resolve = resolve
    textReady.reject = reject
  })
  const text = { object: new Group(), ready, update: vi.fn(), dispose: vi.fn() }
  const fracture = {
    paper: borrow(new BufferGeometry()),
    edge: borrow(new BufferGeometry()),
    cracks: borrow(new BufferGeometry()),
    fragments: [
      {
        geometry: borrow(new BufferGeometry()),
        center: new Vector2(0.02, -0.03),
        velocity: new Vector3(0.05, 0.12, 0.08),
        spin: new Vector3(0.4, -0.5, 0.6),
        delay: 0.2,
      },
    ],
    outline: [
      [-0.1, -0.1],
      [0.1, -0.1],
      [0.1, 0.1],
      [-0.1, 0.1],
    ],
    thickness: 0.00045,
    area: 0.04,
    fragmentArea: 0.04,
    maxBoundaryDeviation: 0.0002,
    dispose: vi.fn(),
  }
  // Geometry/bake production belongs to the external lane. This fixture supplies
  // their contract's presentation fields and guards every borrowed disposer.
  const baked = {
    layout: { primaryCenter: new Vector3(0.01, 0.02, 0) },
    extraction: { crossing: 0.9, clearanceTravel: 0.08 },
    uniforms,
    lines,
    fills,
    text,
    fracture,
    rendered: { profilePoints: fracture.outline, dispose: vi.fn() },
    flex: { peak: 0.75, texture: borrow(new Texture()) },
    barrierMask: uniforms.uBarrierMask.value,
    fragmentPrint: borrow(new Texture()),
    crackMask: borrow(new Texture()),
    stats: { flexFieldPeak: 0.75 },
    dispose: vi.fn(),
  } as unknown as SheetBakeResult
  let materialCount = 0
  const factories: PrivateSheetFactories = {
    grain: () => {
      check('grain')
      return track(new Texture())
    },
    desk: () => {
      check('desk')
      return track(new BufferGeometry())
    },
    ribbon: () => {
      check('ribbon')
      return track(new BufferGeometry())
    },
    material: (parameters) => {
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
        group,
        cap,
        walls,
        light,
        initialModelBottom,
        capZ: -3.2,
        mouthZ: -0.0005,
        profilePoints: 4,
        wallLevels: 8,
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
    tier: 'full',
    reducedMotion: false,
    proofMode: 'normal',
    retirement: 0,
    cameraLookTargetWorld: null,
    cameraSheetDistance: 0.4,
    delta: 0,
    ...overrides,
  }
}
const viewport = new Vector2(1440, 900)

it('reconstructs actual installed shatter matrices from bake inputs and rejects motion or clock tampering', () => {
  const f = fixture(),
    runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
  const sources = { opening: openingSource, dome: domeSource, intro: introSource, geometry: geometrySource }
  const shot = BULLET_TIME_SHOT_SPECS.shatter
  const samples = [0.43, 0.43008, 0.434, 0.44, 0.446, 0.452].map((progress) => {
    const state = openingSource.sampleOpening(progress)
    const release =
      state.poseT <= 0.5
        ? introSource.smooth01((state.poseT - 0.7) / 0.3)
        : state.poseT >= 1
          ? 1
          : Math.pow((state.poseT - 0.5) / 0.5, 1.4)
    f.context.sheetMatrix
      .copy(geometrySource.SHEET_ROTATION)
      .multiply(new Matrix4().makeTranslation(-0.01 * release, -0.02 * release, -0.18 * release))
    runtime.apply(frame(state.t, { intro: state }), f.context, viewport)
    runtime.group.updateMatrixWorld(true)
    const shard = runtime.group.getObjectByName('paper-fragment-0')!
    return {
      snapshot: { opening: { extraction: { initialZ: -0.04, travel: 0.22 }, crossing: 0.9 } },
      telemetry: {
        progress,
        shatter: { ...runtime.shatterInputs(), frame: runtime.group.matrixWorld.toArray(), subjectTime: state.t },
        subjects: [{ name: 'shatter/id/paper-fragment-0', matrixWorld: shard.matrixWorld.toArray() }],
      },
    }
  })
  expect(shatterPhysicalGates(samples, shot, sources).every((g: { status: string }) => g.status === 'PASS')).toBe(true)
  const tampered = structuredClone(samples)
  tampered[2].telemetry.subjects[0].matrixWorld[12] += 0.001
  expect(shatterPhysicalGates(tampered, shot, sources).some((g: { status: string }) => g.status === 'FAIL')).toBe(true)
  const badClock = structuredClone(samples)
  badClock[3].telemetry.shatter.subjectTime += 0.001
  expect(shatterPhysicalGates(badClock, shot, sources).some((g: { status: string }) => g.status === 'FAIL')).toBe(true)
  const missing = structuredClone(samples)
  missing[2].telemetry.subjects = []
  expect(shatterPhysicalGates(missing, shot, sources).some((g: { status: string }) => g.status === 'FAIL')).toBe(true)
  expect(shatterPhysicalGates([], shot, sources)[0].status).toBe('INCOMPLETE')
  runtime.dispose()
})

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
      const event = Math.max(
        0,
        Math.min(
          1,
          ((input.intro.t - INTRO_PHASES.fractureStart) / (INTRO_PHASES.fractureEnd - INTRO_PHASES.fractureStart) -
            fragment.delay) /
            (1 - fragment.delay),
        ),
      )
      expect(snapshots.get(t)!.position.every(Number.isFinite)).toBe(true)
      if (event === 0) expect(snapshots.get(t)!.position).toEqual([fragment.center.x, fragment.center.y, 0.00002])
      if (event === 1) expect(snapshots.get(t)!.position[2]).toBeLessThan(-0.12)
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
    runtime.apply(frame(0.9, { retirement: 0.5 }), f.context, viewport)
    expect(runtime.stats.pitRetained).toBe(1)
    runtime.apply(frame(0.9, { retirement: 0 }), f.context, viewport)
    expect(runtime.stats.pitRetained).toBe(1)
    runtime.dispose()
  })

  it('retains pressure tier scaling, opaque stock, portal gating and inert legacy wave', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    for (const tier of ['full', 'lite'] as const) {
      const input = frame(0.82, { tier })
      runtime.apply(input, f.context, viewport)
      expect(f.baked.uniforms.uFlexAmplitude.value).toBe(
        paperFlexAmplitude(input.intro.t, input.intro.poseT, 0.9, tier, false),
      )
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
    expect(f.baked.text.update).toHaveBeenLastCalledWith(
      f.baked.uniforms.uReveal.value,
      input.intro.drawingOpacity * (0.88 + 0.12 * input.intro.lampPower),
    )
    runtime.dispose()
  })

  it('gives separated glass measurable thickness while retaining intact and reduced-motion stock', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(0.86), f.context, viewport)
    expect(runtime.stats.glassThickness).toBeGreaterThan(f.baked.fracture.thickness)
    const shard = runtime.group.getObjectByName('paper-fragment-0') as Mesh<BufferGeometry, ShaderMaterial>
    expect(shard.position.z).toBeGreaterThan(0.04) // above intact stock during the suspended beat
    expect(shard.material.vertexShader).toContain('smoothstep(0.0, .15, uFracture) * 4.0')
    expect(shard.material.fragmentShader).toContain('reflect(-view, n)')
    runtime.apply(frame(0.86, { reducedMotion: true }), f.context, viewport)
    expect(shard.material.uniforms.uFracture.value).toBe(0)
    runtime.dispose()
  })

  it('layers live ink above intact profile stock and keeps the baked print off until fracture', () => {
    // Owner items 1-3 (2026-10-24): intact shards (renderOrder 3, depthTest off) painted
    // over the linework inside the profile, so it read light blue and clipped Detail C.
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    const shard = runtime.group.getObjectByName('paper-fragment-0') as Mesh<BufferGeometry, ShaderMaterial>
    const lineMaterial = f.baked.lines.material as ShaderMaterial
    const fillMaterial = f.baked.fills.material as ShaderMaterial
    const ordered = (name: string) => runtime.group.getObjectByName(name)!.renderOrder
    for (const t of [0.1, 0.2, 0.5, 0.8]) {
      const input = frame(t)
      expect(input.intro.fracture).toBe(0)
      runtime.apply(input, f.context, viewport)
      expect(shard.renderOrder).toBe(PRIVATE_INTACT_STOCK_ORDER)
      expect(shard.material.depthTest).toBe(false)
      for (const object of [f.baked.lines, f.baked.fills, f.baked.text.object]) {
        expect(object.renderOrder).toBeGreaterThan(shard.renderOrder)
      }
      expect(lineMaterial.depthTest).toBe(false)
      expect(fillMaterial.depthTest).toBe(false)
      expect(f.baked.uniforms.uFracture.value).toBe(0)
    }
    for (const name of ['lightning', 'pressure-crack-web', 'pressure-crack-halo']) {
      expect(ordered(name)).toBe(PRIVATE_GLOW_ORDER)
      expect(ordered(name)).toBeGreaterThan(PRIVATE_INK_ORDER)
    }
    // The print is gated on fracture alone; completed side-view reveal no longer lays it
    // over the intact stock.
    expect(shard.material.fragmentShader).toContain('ink * .78 * smoothstep(0.0, .02, uFracture)')
    expect(shard.material.fragmentShader).not.toMatch(/smoothstep\(\.98, 1\.0, uFragmentInk\)/)
    expect(shard.material.uniforms.uFragmentInk).toBeDefined()
    // From fracture on, the ink is cut from the opening and depth-tests normally again.
    runtime.apply(frame(0.86), f.context, viewport)
    expect(f.baked.uniforms.uFracture.value).toBeGreaterThan(0)
    expect(lineMaterial.depthTest).toBe(true)
    expect(fillMaterial.depthTest).toBe(true)
    runtime.dispose()
    // Borrowed bake meshes get their original layering back.
    expect(f.baked.lines.renderOrder).toBe(0)
    expect(f.baked.fills.renderOrder).toBe(0)
    expect(f.baked.text.object.renderOrder).toBe(0)
    expect(lineMaterial.depthTest).toBe(true)
    expect(fillMaterial.depthTest).toBe(true)
  })

  it('samples the current lamp aim at zero delta, retaining sheet-local aim and reach bounds', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(0.4, { cameraLookTargetWorld: new Vector3(0.2, 0.4, 0.3) }), f.context, viewport)
    expect(f.baked.uniforms.uLamp.value.x).toBeCloseTo(0.1, 12)
    expect(f.baked.uniforms.uLamp.value.y).toBeCloseTo(0.2, 12)
    expect(f.baked.uniforms.uLamp.value.z).toBeCloseTo(0.4 * 0.55, 12)
    const target = new Vector3(0.5, 0.6, 0.3)
    runtime.apply(frame(0.4, { cameraLookTargetWorld: target, delta: 0 }), f.context, viewport)
    expect(runtime.renderState().lamp[0]).toBeCloseTo(0.4, 12)
    expect(runtime.renderState().lamp[1]).toBeCloseTo(0.4, 12)
    for (const [distance, radius] of [
      [0.01, 0.09],
      [0.4, 0.22],
      [2, 0.32],
      [0, 0.22],
    ]) {
      for (const delta of [0, 1 / 60, 100]) {
        runtime.apply(
          frame(0.4, { cameraLookTargetWorld: target, cameraSheetDistance: distance, delta }),
          f.context,
          viewport,
        )
        expect(runtime.renderState().lamp[2]).toBeCloseTo(radius, 12)
        expect(f.baked.uniforms.uLamp.value.toArray()).toEqual(runtime.renderState().lamp)
      }
    }
    expect(target.toArray()).toEqual([0.5, 0.6, 0.3])
    const snapshot = runtime.renderState()
    snapshot.lamp[0] = 999
    expect(runtime.renderState().lamp[0]).toBeCloseTo(0.4, 12)
    expect([runtime.stats.lampX, runtime.stats.lampY, runtime.stats.lampRadius]).toEqual(runtime.renderState().lamp)
    runtime.dispose()
  })

  it('resets a null lamp target to the same centered pool on fresh, held and revisited frames', () => {
    const f = fixture()
    const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
    runtime.apply(frame(0.4), f.context, viewport)
    const original = runtime.renderState()
    expect(original.lamp).toEqual([0, 0, 0.2])
    runtime.apply(
      frame(0.8, { cameraLookTargetWorld: new Vector3(2, -3, 1), cameraSheetDistance: 2, delta: 0.1 }),
      f.context,
      viewport,
    )
    for (const delta of [0, 0.1, 100]) {
      runtime.apply(frame(0.4, { cameraLookTargetWorld: null, delta }), f.context, viewport)
      expect(runtime.renderState()).toEqual(original)
    }
    runtime.dispose()
  })

  it.each(['normal', 'drawing-edges', 'reduced-motion'])(
    'replays lamp and installed uniforms exactly forward/reverse/prime-stride in %s',
    (mode) => {
      const f = fixture()
      // A rotated, translated sheet catches accidental world-space targeting.
      f.context.sheetMatrix.makeRotationX(0.3).multiply(new Matrix4().makeRotationY(-0.4)).setPosition(0.1, 0.2, 0.3)
      const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
      const capture = () => {
        const uniforms: unknown[] = []
        runtime.group.traverse((object) => {
          if (!(object instanceof Mesh)) return
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            if (!(material instanceof ShaderMaterial)) continue
            uniforms.push(
              Object.fromEntries(
                Object.entries(material.uniforms).map(([key, { value }]) => {
                  // Three's generic toArray overloads cannot be called through this
                  // union; narrow each concrete type before copying its components.
                  if (value instanceof Vector2) return [key, value.toArray()]
                  if (value instanceof Vector3) return [key, value.toArray()]
                  if (value instanceof Color) return [key, value.toArray()]
                  if (value instanceof Matrix4) return [key, value.toArray()]
                  return [key, Array.isArray(value) ? [...value] : value instanceof Texture ? value.uuid : value]
                }),
              ),
            )
          }
        })
        return { render: runtime.renderState(), uniforms }
      }
      // 19 checkpoints and the coprime 613 stride visit every target, including
      // null, blackout and lamp return, with varying distances and frame deltas.
      const sample = (i: number, delta: number) => {
        const t = i / 18
        const local = new Vector3(0.15 * Math.sin(t * 7), 0.2 * Math.cos(t * 5), 0)
        runtime.apply(
          frame(t, {
            cameraLookTargetWorld: i % 5 === 0 ? null : local.clone().applyMatrix4(f.context.sheetMatrix),
            cameraSheetDistance: 0.1 + t,
            delta,
            proofMode: mode === 'drawing-edges' ? mode : 'normal',
            reducedMotion: mode === 'reduced-motion',
          }),
          f.context,
          viewport,
        )
        const render = runtime.renderState()
        if (i % 5 === 0) expect(render.lamp).toEqual([0, 0, 0.2])
        else {
          expect(render.lamp[0]).toBeCloseTo(local.x, 12)
          expect(render.lamp[1]).toBeCloseTo(local.y, 12)
          expect(render.lamp[2]).toBeCloseTo(Math.min(0.32, Math.max(0.09, (0.1 + t) * 0.55)), 12)
        }
        expect(render.lampPower).toBe(f.baked.uniforms.uLampPower.value)
        expect(render.readingPool).toBe(f.baked.uniforms.uReadingPool.value)
        return capture()
      }
      const forward = Array.from({ length: 19 }, (_, i) => sample(i, 1 / 60))
      expect(new Set(forward.map((x) => JSON.stringify(x.render))).size).toBeGreaterThan(10)
      for (const i of Array.from({ length: 19 }, (_, n) => 18 - n).concat(
        Array.from({ length: 19 }, (_, n) => (n * 613) % 19),
      )) {
        expect(sample(i, 0.1)).toEqual(forward[i])
        expect(sample(i, 0)).toEqual(forward[i])
        expect(sample(i, 100)).toEqual(forward[i])
      }
      runtime.dispose()
    },
  )

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
    expect(f.baked.uniforms.uReveal.value.filter((_, i) => i !== GROUP.side).every((v) => v === 0)).toBe(true)
    expect(f.baked.uniforms.uMode.value).toBe(1)
    expect(f.baked.lines.visible).toBe(true)
    expect(f.baked.fills.visible).toBe(false)
    expect(f.baked.text.object.visible).toBe(false)
    runtime.apply(frame(1, { retirement: 1, reducedMotion: true }), f.context, viewport)
    expect(runtime.group.visible).toBe(true)
    expect(f.baked.uniforms.uReveal.value.every((v) => v === 1)).toBe(true)
    runtime.apply(frame(0.2, { reducedMotion: true }), f.context, viewport)
    expect(f.baked.uniforms.uReveal.value[GROUP.printed]).toBe(1)
    expect(f.baked.uniforms.uReveal.value[GROUP.side]).toBe(0)
    expect(f.baked.uniforms.uReveal.value[GROUP.gdt]).toBe(0)
    runtime.dispose()
  })

  it.each(['drawing-mask', 'model-mask', 'model-edges', 'unknown'])(
    'rejects unsupported proof %s before mutation',
    (proofMode) => {
      const f = fixture()
      const runtime = createPrivateSheetRuntime(f.baked, vi.fn(), f.factories)
      runtime.apply(frame(0.7), f.context, viewport)
      const before = runtime.group.matrix.clone()
      const ink = f.baked.uniforms.uInk.value.clone()
      expect(() => runtime.apply(frame(1, { proofMode }), f.context, viewport)).toThrow(/Unsupported.*proofMode/)
      expect(runtime.group.matrix.equals(before)).toBe(true)
      expect(f.baked.uniforms.uInk.value.equals(ink)).toBe(true)
      runtime.dispose()
    },
  )
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
    runtime.dispose()
    runtime.dispose()
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
    const report = vi.fn((_errors: readonly unknown[]) => {
      throw new Error('report failure')
    })
    const runtime = createPrivateSheetRuntime(f.baked, report, f.factories)
    const errors = [new Error('grain disposal'), new Error('last portal resource disposal')]
    f.owned[0].disposed.mockImplementation(() => {
      throw errors[0]
    })
    f.owned[f.owned.length - 1].disposed.mockImplementation(() => {
      throw errors[1]
    })
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

  it.each([
    'grain',
    'material-1',
    'material-2',
    'material-3',
    'material-4',
    'material-5',
    'desk',
    'ribbon',
    'material-6',
    'portal',
  ])('rolls back partial construction at %s without replacing its error', (failAt) => {
    const f = fixture(failAt)
    const report = vi.fn((_errors: readonly unknown[]) => {
      throw new Error('report failed')
    })
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
