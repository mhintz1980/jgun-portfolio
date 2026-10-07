import { afterEach, describe, expect, it, vi } from 'vitest'
import { Color, DirectionalLight, Fog, FogExp2, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, Texture, Vector2, Vector4, type WebGLRenderer } from 'three'
import { captureRenderLease, prepareRuntime, renderOwnership } from './renderLease'
import { createStorySession } from './session'

function renderer() {
  const clear = new Color('#123456'), viewport = new Vector4(3, 4, 50, 60), scissor = new Vector4(5, 6, 30, 40)
  let target: unknown = { name: 'original-target' }, lost = false, scissorTest = true
  const gl = {
    toneMapping: 4, toneMappingExposure: 1.7, autoClear: false,
    getContext: () => ({ isContextLost: () => lost }),
    getClearColor: (out: Color) => out.copy(clear), getClearAlpha: () => .4,
    setClearColor: vi.fn((value: Color) => clear.copy(value)),
    compile: vi.fn(() => new Set()), properties: { get: vi.fn() }, render: vi.fn(),
    getRenderTarget: () => target, setRenderTarget: vi.fn((value: unknown) => { target = value }),
    getActiveCubeFace: () => 2, getActiveMipmapLevel: () => 3,
    getViewport: (out: Vector4) => out.copy(viewport),
    setViewport: vi.fn((value: Vector4 | number, y?: number, w?: number, h?: number) => { if (value instanceof Vector4) viewport.copy(value); else viewport.set(value, y!, w!, h!) }),
    getScissor: (out: Vector4) => out.copy(scissor),
    setScissor: vi.fn((value: Vector4 | number, y?: number, w?: number, h?: number) => { if (value instanceof Vector4) scissor.copy(value); else scissor.set(value, y!, w!, h!) }),
    getScissorTest: () => scissorTest, setScissorTest: vi.fn((value: boolean) => { scissorTest = value }),
  }
  return { gl: gl as unknown as WebGLRenderer, raw: gl, lose: () => { lost = true } }
}
const sample = { background: new Color('#010203'), fogNear: 2, fogFar: 3, envIntensity: .2, envRotationY: .3, bloom: .4, aberration: .01, dofBokeh: 0, exposure: .7 }
afterEach(() => { renderOwnership.post = null; vi.useRealTimers() })

describe('inspection render lease', () => {
  it('restores reference identity, scene values, full light transforms, post values and original visibility exactly once', () => {
    const scene = new Scene(), hero = new Group(), study = new Group(), hidden = new Group()
    hidden.visible = false; scene.add(hero, study, hidden)
    const background = new Color('#abcdef'), environment = new Texture(), fog = new Fog('#ffaaaa', 8, 90)
    scene.background = background; scene.environment = environment; scene.fog = fog
    scene.backgroundIntensity = .6; scene.backgroundBlurriness = .8; scene.backgroundRotation.set(.1, .2, .3, 'ZXY')
    scene.environmentIntensity = 1.3; scene.environmentRotation.set(.5, .6, .7, 'YXZ')
    const light = new DirectionalLight('#ee4422', 3.1)
    light.position.set(1, 2, 3); light.rotation.set(.4, .5, .6); light.scale.set(2, 3, 4); light.up.set(1, 0, 0)
    light.target.position.set(4, 5, 6); light.updateMatrixWorld(); scene.add(light)
    const lightPose = light.matrix.clone(), rotation = light.quaternion.clone()
    renderOwnership.post = { bloom: { intensity: .51 }, aberration: { offset: new Vector2(.001, .002) }, dof: { bokehScale: 2.5 } }
    const { gl, raw } = renderer(), lease = captureRenderLease(scene, gl, hero, study)
    lease.apply(sample)
    expect(light.visible).toBe(false); expect(hero.visible).toBe(true); expect(study.visible).toBe(true)
    light.position.set(9, 8, 7); light.rotation.set(1, 1, 1); light.scale.set(8, 8, 8); light.up.set(0, 1, 0); light.intensity = 9; light.color.set('#ffffff'); light.target.position.set(9, 9, 9)
    background.set('#000000'); fog.color.set('#000000'); fog.near = 99; scene.environment = null
    lease.restore(); lease.restore()
    expect(scene.background).toBe(background); expect(background.getHexString()).toBe('abcdef')
    expect(scene.fog).toBe(fog); expect(fog.near).toBe(8); expect(fog.far).toBe(90); expect(fog.color.getHexString()).toBe('ffaaaa')
    expect(scene.environment).toBe(environment); expect(scene.environmentIntensity).toBe(1.3)
    expect(scene.environmentRotation.toArray()).toEqual([.5, .6, .7, 'YXZ']); expect(scene.backgroundRotation.toArray()).toEqual([.1, .2, .3, 'ZXY'])
    expect(scene.backgroundIntensity).toBe(.6); expect(scene.backgroundBlurriness).toBe(.8)
    expect(light.visible).toBe(true); expect(light.intensity).toBe(3.1); expect(light.color.getHexString()).toBe('ee4422')
    expect(light.position.toArray()).toEqual([1, 2, 3]); expect(light.scale.toArray()).toEqual([2, 3, 4]); expect(light.quaternion.toArray()).toEqual(rotation.toArray())
    expect(light.matrix.elements).toEqual(lightPose.elements); expect(light.up.toArray()).toEqual([1, 0, 0]); expect(light.target.position.toArray()).toEqual([4, 5, 6])
    expect(hidden.visible).toBe(false); expect(gl.toneMappingExposure).toBe(1.7); expect(raw.setClearColor).toHaveBeenCalledTimes(1)
    expect(renderOwnership.post.bloom!.intensity).toBe(.51); expect(renderOwnership.post.aberration!.offset.toArray()).toEqual([.001, .002]); expect(renderOwnership.post.dof!.bokehScale).toBe(2.5)
  })
  it('discovers equal-count replacements and new descendants by identity, excluding every study descendant', () => {
    const scene = new Scene(), hero = new Group(), study = new Group(), other = new Group(), owned = new Mesh()
    study.add(owned); scene.add(hero, study, other)
    const { gl } = renderer(), lease = captureRenderLease(scene, gl, hero, study)
    const replacement = new Group(), late = new Mesh(), hiddenLate = new Mesh(); hiddenLate.visible = false
    scene.remove(other); scene.add(replacement); replacement.add(late, hiddenLate)
    lease.discover()
    expect(replacement.visible).toBe(false); expect(late.visible).toBe(false); expect(owned.visible).toBe(true)
    lease.restore()
    expect(other.visible).toBe(true); expect(replacement.visible).toBe(true); expect(late.visible).toBe(true); expect(hiddenLate.visible).toBe(false)
  })
  it('recovers a late hero ancestor and restores FogExp2 without any GL call after loss', () => {
    const scene = new Scene(), wrapper = new Group(), hero = new Group(); scene.add(wrapper); wrapper.add(hero)
    const fog = new FogExp2('#112233', .12); scene.fog = fog
    const { gl, raw, lose } = renderer(), lease = captureRenderLease(scene, gl, null, null)
    expect(wrapper.visible).toBe(false)
    lease.setHero(hero); expect(wrapper.visible).toBe(true); expect(hero.visible).toBe(true)
    lease.apply(sample); fog.density = .9; lose(); lease.contextLost(); lease.restore()
    expect(scene.fog).toBe(fog); expect(fog.density).toBe(.12); expect(raw.setClearColor).not.toHaveBeenCalled()
  })
  it('compiles the owned light census and restores target, viewport, scissor and flags after warming', async () => {
    vi.useFakeTimers()
    const scene = new Scene(), study = new Group(), prop = new Mesh(undefined, new MeshStandardMaterial()), light = new DirectionalLight()
    prop.visible = false; study.add(prop, light); scene.add(study)
    const { gl, raw } = renderer(), originalTarget = gl.getRenderTarget()
    const session = createStorySession('ring', { id: 1, current: () => true, fail: () => {} })
    raw.compile.mockImplementation(() => { expect(prop.visible).toBe(true); expect(light.visible).toBe(true); return new Set() })
    const pending = prepareRuntime(session, gl, scene, new PerspectiveCamera(), study)
    expect(prop.visible).toBe(false)
    await vi.runAllTimersAsync(); expect(await pending).toBe(true)
    expect(raw.render).toHaveBeenCalledTimes(1); expect(gl.getRenderTarget()).toBe(originalTarget)
    expect(gl.getViewport(new Vector4()).toArray()).toEqual([3, 4, 50, 60]); expect(gl.getScissor(new Vector4()).toArray()).toEqual([5, 6, 30, 40]); expect(gl.getScissorTest()).toBe(true); expect(gl.autoClear).toBe(false)
    expect(prop.visible).toBe(false); expect(prop.frustumCulled).toBe(true)
  })
  it('cancelled compile cannot warm or access programs from a retired session', async () => {
    vi.useFakeTimers()
    const { gl, raw } = renderer(), scene = new Scene(), study = new Group(); scene.add(study)
    const session = createStorySession('ring', { id: 1, current: () => true, fail: () => {} })
    const pending = prepareRuntime(session, gl, scene, new PerspectiveCamera(), study); session.cancel()
    await vi.runAllTimersAsync(); expect(await pending).toBe(false); expect(raw.render).not.toHaveBeenCalled(); expect(raw.properties.get).not.toHaveBeenCalled()
  })
  it('restores offscreen state when warming throws', async () => {
    vi.useFakeTimers()
    const { gl, raw } = renderer(), scene = new Scene(), study = new Group(); scene.add(study)
    const session = createStorySession('ring', { id: 1, current: () => true, fail: () => {} })
    raw.render.mockImplementation(() => { throw new Error('warm failure') })
    const pending = prepareRuntime(session, gl, scene, new PerspectiveCamera(), study)
    const rejection = expect(pending).rejects.toThrow('warm failure')
    await vi.runAllTimersAsync(); await rejection
    expect(gl.getViewport(new Vector4()).toArray()).toEqual([3, 4, 50, 60]); expect(gl.getScissor(new Vector4()).toArray()).toEqual([5, 6, 30, 40]); expect(gl.getScissorTest()).toBe(true)
  })
})
