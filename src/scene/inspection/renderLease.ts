import { Color, Fog, FogExp2, Light, Vector2, Vector4, WebGLRenderTarget, type Camera, type Object3D, type Scene, type WebGLRenderer } from 'three'
import type { RenderSample } from './story'
import { compileWithLease } from './compileLease'
import type { StorySession } from './session'

export interface PostLeasePort {
  bloom: { intensity: number } | null
  aberration: { offset: Vector2 } | null
  dof: { bokehScale: number } | null
}
export const renderOwnership = {
  owned: false, restoring: false, restoreObserved: false,
  post: null as PostLeasePort | null,
  get blocked() { return this.owned || this.restoring },
}

function transform(object: Object3D) {
  const position = object.position.clone(), quaternion = object.quaternion.clone(), scale = object.scale.clone()
  const up = object.up.clone(), matrix = object.matrix.clone(), matrixWorld = object.matrixWorld.clone()
  const auto = object.matrixAutoUpdate, worldAuto = object.matrixWorldAutoUpdate, dirty = object.matrixWorldNeedsUpdate
  return { restore() {
    object.position.copy(position); object.quaternion.copy(quaternion); object.scale.copy(scale); object.up.copy(up)
    object.matrix.copy(matrix); object.matrixWorld.copy(matrixWorld)
    object.matrixAutoUpdate = auto; object.matrixWorldAutoUpdate = worldAuto; object.matrixWorldNeedsUpdate = dirty
  } }
}

/** Capture references and values before any studio or inspection writer runs. */
export function captureRenderLease(scene: Scene, gl: WebGLRenderer, hero: Object3D | null, root: Object3D | null) {
  const background = scene.background, backgroundColor = background instanceof Color ? background.clone() : null
  const fog = scene.fog, fogColor = fog?.color.clone()
  const fogNear = fog instanceof Fog ? fog.near : 0, fogFar = fog instanceof Fog ? fog.far : 0
  const fogDensity = fog instanceof FogExp2 ? fog.density : 0
  const environment = scene.environment, environmentIntensity = scene.environmentIntensity
  const environmentRotation = scene.environmentRotation.clone(), backgroundRotation = scene.backgroundRotation.clone()
  const backgroundIntensity = scene.backgroundIntensity, backgroundBlurriness = scene.backgroundBlurriness
  const toneMapping = gl.toneMapping, exposure = gl.toneMappingExposure
  const clearColor = gl.getClearColor(new Color()).clone(), clearAlpha = gl.getClearAlpha()
  const post = renderOwnership.post
  const bloom = post?.bloom?.intensity, aberration = post?.aberration?.offset.clone(), dof = post?.dof?.bokehScale
  const hidden = new Map<Object3D, boolean>()
  const lights = new Map<Light, { visible: boolean; intensity: number; color: Color; pose: ReturnType<typeof transform>; target: ReturnType<typeof transform> | null }>()
  const studioFog = new Fog('#05070a', 25, 120), studioBackground = new Color()
  let restored = false, lost = false
  function contains(object: Object3D, child: Object3D | null) {
    for (let node = child; node; node = node.parent) if (node === object) return true
    return false
  }
  function visit(object: Object3D) {
    if (object === scene || contains(root!, object)) return
    if (object instanceof Light) {
      if (!lights.has(object)) {
        const target = (object as Light & { target?: Object3D }).target
        lights.set(object, { visible: object.visible, intensity: object.intensity, color: object.color.clone(), pose: transform(object), target: target ? transform(target) : null })
      }
      object.visible = false
      // The light record owns this visibility; a second record would capture the hidden state.
      return
    }
    if (contains(object, root) || contains(object, hero) || contains(hero!, object) || (object as Object3D & { isCamera?: boolean }).isCamera) return
    if (!hidden.has(object)) hidden.set(object, object.visible)
    object.visible = false
  }
  const discover = () => { if (!restored) scene.traverse(visit) }
  // Discovery is by identity, including same-count replacements and new descendants.
  discover()
  return {
    hidden, lights,
    setRoot(value: Object3D) { root = value },
    setHero(value: Object3D) {
      hero = value
      for (const [object, visible] of hidden) if (contains(object, hero) || contains(hero, object)) { object.visible = visible; hidden.delete(object) }
    },
    discover,
    contextLost() { lost = true },
    apply(sample: RenderSample) {
      if (restored) return
      discover()
      scene.background = studioBackground.copy(sample.background); scene.fog = studioFog
      studioFog.near = sample.fogNear; studioFog.far = sample.fogFar
      scene.environmentIntensity = sample.envIntensity; scene.environmentRotation.set(0, sample.envRotationY, 0)
      gl.toneMappingExposure = sample.exposure
      if (post?.bloom) post.bloom.intensity = sample.bloom
      if (post?.aberration) post.aberration.offset.set(sample.aberration, sample.aberration)
      if (post?.dof) post.dof.bokehScale = sample.dofBokeh
    },
    restore() {
      if (restored) return
      restored = true
      if (backgroundColor && background instanceof Color) background.copy(backgroundColor)
      scene.background = background; scene.backgroundIntensity = backgroundIntensity; scene.backgroundBlurriness = backgroundBlurriness
      scene.backgroundRotation.copy(backgroundRotation)
      scene.fog = fog
      if (fog && fogColor) fog.color.copy(fogColor)
      if (fog instanceof Fog) { fog.near = fogNear; fog.far = fogFar }
      if (fog instanceof FogExp2) fog.density = fogDensity
      scene.environment = environment; scene.environmentIntensity = environmentIntensity; scene.environmentRotation.copy(environmentRotation)
      gl.toneMapping = toneMapping; gl.toneMappingExposure = exposure
      // setClearColor touches GL state in r185. Never invoke it on a lost context.
      if (!lost && !gl.getContext().isContextLost()) gl.setClearColor(clearColor, clearAlpha)
      if (post?.bloom && bloom !== undefined) post.bloom.intensity = bloom
      if (post?.aberration && aberration) post.aberration.offset.copy(aberration)
      if (post?.dof && dof !== undefined) post.dof.bokehScale = dof
      for (const [light, saved] of lights) {
        light.visible = saved.visible; light.intensity = saved.intensity; light.color.copy(saved.color)
        saved.pose.restore(); saved.target?.restore()
      }
      for (const [object, visible] of hidden) object.visible = visible
      hidden.clear(); lights.clear()
    },
  }
}

/** Compile with the leased light census, then warm buffers without changing the live target. */
export async function prepareRuntime(session: StorySession, gl: WebGLRenderer, scene: Scene, camera: Camera, root: Object3D) {
  const cancelled = () => !session.current() || gl.getContext().isContextLost()
  if (cancelled()) return false
  const flags: { object: Object3D; visible: boolean; culled: boolean }[] = []
  root.traverse(object => { flags.push({ object, visible: object.visible, culled: object.frustumCulled }); object.visible = true; object.frustumCulled = false })
  let pending: Promise<boolean>
  try { pending = compileWithLease(gl, scene, camera, cancelled) }
  finally { for (const flag of flags) { flag.object.visible = flag.visible; flag.object.frustumCulled = flag.culled } }
  if (!(await pending) || cancelled()) return false
  const target = new WebGLRenderTarget(1, 1), previousTarget = gl.getRenderTarget()
  const viewport = gl.getViewport(new Vector4()), scissor = gl.getScissor(new Vector4()), scissorTest = gl.getScissorTest()
  const autoClear = gl.autoClear, activeFace = gl.getActiveCubeFace(), activeLevel = gl.getActiveMipmapLevel()
  try {
    for (const flag of flags) { flag.object.visible = true; flag.object.frustumCulled = false }
    gl.setRenderTarget(target); gl.setViewport(0, 0, 1, 1); gl.setScissor(0, 0, 1, 1); gl.setScissorTest(false)
    gl.autoClear = true; gl.render(scene, camera)
  } finally {
    for (const flag of flags) { flag.object.visible = flag.visible; flag.object.frustumCulled = flag.culled }
    gl.autoClear = autoClear
    if (!gl.getContext().isContextLost()) {
      gl.setRenderTarget(previousTarget, activeFace, activeLevel); gl.setViewport(viewport); gl.setScissor(scissor); gl.setScissorTest(scissorTest)
    }
    target.dispose()
  }
  return !cancelled()
}
