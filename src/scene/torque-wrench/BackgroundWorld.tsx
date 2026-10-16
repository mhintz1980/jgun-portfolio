import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, HalfFloatType, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { TorqueWrenchStore } from '../../state/torqueWrenchStore'
import { createBackgroundSample, sampleBackground } from './BackgroundDirector'
import { BACKGROUND_LAYERS } from './backgroundLayers'
import { createPostProfile, samplePostProfile } from './postProfile'
import { computeRenderBudget } from './renderBudget'
import { createBlueNoiseTexture } from './blueNoise'
import { createResourceScope } from './resourceScope'
import type { InspectionIsolationSample } from './inspectionIsolation'

const vertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const backgroundFragment = `
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uScale;
uniform float uBase;
uniform float uLayer;
uniform float uSurroundings;
void main(){
  vec2 p=vUv-.5; p.x*=uResolution.x/max(1.0,uResolution.y);
  // Broad, unequal pools reveal separate depths instead of three coincident glows.
  vec2 center=uLayer<.5?vec2(-.18,.10):(uLayer<1.5?vec2(.28,.12):vec2(-.24,-.18));
  vec2 q=(p-center)*vec2(.75,1.25)*uScale;
  float radial=exp(-dot(q,q)*3.0);
  float strata=.82+.18*sin(p.y*9.0+p.x*3.0+uScale*8.0);
  radial*=strata;
  vec3 base=vec3(.009,.011,.016);
  vec3 color=mix(base,uColor,radial);
  gl_FragColor=vec4(color*uSurroundings,uBase>.5?1.0:radial*uOpacity*uSurroundings);
}`
const gradeFragment = `
uniform sampler2D tDiffuse;
uniform sampler2D uNoise;
uniform vec2 uResolution;
uniform float uExposure;
uniform float uSaturation;
uniform float uVignette;
varying vec2 vUv;
void main(){
  vec4 source=texture2D(tDiffuse,vUv);
  vec3 color=source.rgb*uExposure;
  float luma=dot(color,vec3(.2126,.7152,.0722));
  color=mix(vec3(luma),color,uSaturation);
  vec2 p=vUv*2.0-1.0;
  color*=1.0-uVignette*smoothstep(.25,1.5,dot(p,p));
  float dither=texture2D(uNoise,gl_FragCoord.xy/32.0).r-.5;
  // Scale linear noise by the local sRGB slope, for about one display-code step.
  color+=dither/255.0*max(vec3(.0774),2.4*pow(max(color,vec3(0.0)),vec3(.583333)));
  gl_FragColor=vec4(max(color,vec3(0.0)),source.a);
}`
const gradeVertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`

export function BackgroundWorld({ store, onFailure, isolation }: {
  store: TorqueWrenchStore
  onFailure: (error: unknown) => void
  isolation: InspectionIsolationSample
}) {
  const { gl, scene, camera, size, setDpr } = useThree()
  const current = useRef<ReturnType<typeof install> | null>(null)
  const terminal = useRef(false)
  const dimensions = useRef(size)
  dimensions.current = size

  function install() {
    let initialized = false
    const constructionCleanup: unknown[] = []
    const owned = createResourceScope(errors => {
      if (!initialized) constructionCleanup.push(...errors)
      else onFailure(new AggregateError(errors, 'Background cleanup failed'))
    })
    try {
    const sample = createBackgroundSample(), post = createPostProfile()
    const noise = owned.own(createBlueNoiseTexture())
    const geometry = owned.own(new PlaneGeometry(2, 2))
    const meshes = BACKGROUND_LAYERS.map((definition, index) => {
      const material = owned.own(new ShaderMaterial({ name: 'TorqueBackgroundLinear-' + definition.id, vertexShader: vertex, fragmentShader: backgroundFragment,
        uniforms: { uResolution: { value: new Vector2() }, uColor: { value: new Vector3() },
          uOpacity: { value: 0 }, uScale: { value: 1 }, uBase: { value: index === 0 ? 1 : 0 }, uLayer: { value: index }, uSurroundings: { value: 1 } },
        transparent: index > 0, depthTest: true, depthWrite: false, toneMapped: false }))
      const mesh = new Mesh(geometry, material)
      mesh.name = 'torque-private-background-' + definition.id; mesh.frustumCulled = false; mesh.renderOrder = -100000 + index
      scene.add(mesh); owned.defer(() => mesh.removeFromParent())
      return mesh
    })
    const initialTier = store.getState().tier === 'lite' ? 'lite' : 'full'
    const initialBudget = computeRenderBudget(dimensions.current.width, dimensions.current.height,
      window.devicePixelRatio, initialTier)
    const context = gl.getContext() as WebGL2RenderingContext
    const priorTarget = gl.getRenderTarget()
    gl.setRenderTarget(null)
    const nativeSamples = context.getParameter(context.SAMPLES) as number
    gl.setRenderTarget(priorTarget)
    const requestedComposerSamples = initialTier === 'full' ? nativeSamples : 0
    const deviceMaxSamples = Number.isFinite(gl.capabilities.maxSamples)
      ? Math.max(0, Math.floor(gl.capabilities.maxSamples))
      : 0
    const colorSampleCounts = Array.from(context.getInternalformatParameter(
      context.RENDERBUFFER, context.RGBA16F, context.SAMPLES,
    ) as Int32Array)
    const requestedTargetSamples = colorSampleCounts.filter(count =>
      count <= Math.min(requestedComposerSamples, deviceMaxSamples)).sort((a, b) => b - a)[0] ?? 0
    if (initialTier === 'full' && requestedTargetSamples < nativeSamples) {
      throw new Error('Private half-float composer cannot retain the native geometry antialiasing baseline')
    }
    const composerTarget = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: requestedTargetSamples })
    composerTarget.texture.name = 'TorqueBackgroundComposer.rt1'
    let composer: EffectComposer
    try { composer = new EffectComposer(gl, composerTarget) }
    catch (error) { composerTarget.dispose(); throw error }
    owned.own(composer)
    const renderPass = new RenderPass(scene, camera)
    const grade = new ShaderPass({ name: 'TorqueContinuousGrade', vertexShader: gradeVertex, fragmentShader: gradeFragment,
      uniforms: { tDiffuse: { value: null }, uNoise: { value: noise }, uResolution: { value: new Vector2() },
        uExposure: { value: 1 }, uSaturation: { value: 1 }, uVignette: { value: 0 } } })
    const output = new OutputPass()
    owned.defer(() => renderPass.dispose()); owned.defer(() => grade.dispose()); owned.defer(() => output.dispose())
    composer.addPass(renderPass); composer.addPass(grade); composer.addPass(output)
    const originalBackground = scene.background
    // The background mesh owns the base; an opaque scene.background would clear over it only before geometry, but retain original on teardown.
    scene.background = null
    owned.defer(() => { if (scene.background === null) scene.background = originalBackground })
    const achievedComposerSamples = Math.min(composer.renderTarget1.samples, composer.renderTarget2.samples)
    const telemetry = { progress: 0, active: false, hidden: false, frames: 0, layers: sample.layers,
      isolation: { progress: isolation.progress, surroundingsOpacity: isolation.surroundingsOpacity, manual: isolation.manual },
      actualLayers: BACKGROUND_LAYERS.map((layer, index) => ({
        id: layer.id, depth: layer.depth, position: [0, 0, 0], visible: false, requestedOpacity: 0, uSurroundings: 1,
        effectiveAlpha: {
        model: index === 0 ? 'forced-opaque' : 'radial-gaussian-times-strata',
          alphaUpperBound: index === 0 ? 1 : 0,
          valueMeaning: index === 0 ? 'constant shader alpha' : 'analytic upper bound; per-pixel alpha includes Gaussian and strata',
          spatiallyUniform: index === 0,
        },
      })),
      post, budget: initialBudget, actualBuffer: [0, 0], calls: 0, triangles: 0,
      pointerWeight: 0, pointerMode: 'omitted; reading/fracture suppression exact zero',
      noise: { method: 'periodic Gaussian void ranking', size: 32, static: true },
      antialias: {
        native: gl.getContext().getContextAttributes()?.antialias ?? false,
        deviceMaxSamples,
        nativeSamples,
        colorSampleCounts,
        requestedComposerSamples,
        composerSamples: achievedComposerSamples,
        configuredComposerSamples: achievedComposerSamples,
        achievedComposerSamples: 0,
        measuredTargetSamples: [0, 0],
        smaa: false,
      } }
    const globals = window as unknown as Record<string, unknown>
    const port = { snapshot: () => JSON.parse(JSON.stringify(telemetry)),
      /** Synchronous diagnostic only; never part of performance sampling or narrative state. */
      captureLayerContributions: () => {
        if (document.hidden || !gl.domElement.isConnected) throw new Error('Layer capture requires a visible connected world')
        const target = gl.getRenderTarget(), autoClear = gl.autoClear, screen = composer.renderToScreen
        const autoReset = gl.info.autoReset
        const visible = meshes.map(mesh => mesh.visible)
        const width = gl.domElement.width, height = gl.domElement.height
        const baseline = new Uint8Array(width * height * 4), candidate = new Uint8Array(baseline.length)
        const read = (pixels: Uint8Array) => {
          composer.renderToScreen = true; composer.render(0)
          context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels)
        }
        try {
          read(baseline)
          const contributions = meshes.map((mesh, index) => {
            mesh.visible = false; read(candidate); mesh.visible = visible[index]
            let changedPixels = 0, sumDelta = 0, maxDelta = 0
            for (let p = 0; p < baseline.length; p += 4) {
              const delta = Math.max(Math.abs(baseline[p] - candidate[p]),
                Math.abs(baseline[p + 1] - candidate[p + 1]), Math.abs(baseline[p + 2] - candidate[p + 2]))
              if (delta >= 2) changedPixels++
              sumDelta += delta; maxDelta = Math.max(maxDelta, delta)
            }
            return { id: BACKGROUND_LAYERS[index].id, changedPixels, maxDelta8Bit: maxDelta,
              meanMaxChannelDelta8Bit: sumDelta / (width * height) }
          })
          return { width, height, progress: telemetry.progress, threshold8Bit: 2, contributions,
            method: 'same camera/state, one background layer hidden per render; restored before return' }
        } finally {
          meshes.forEach((mesh, i) => { mesh.visible = visible[i] })
          composer.renderToScreen = true; composer.render(0)
          composer.renderToScreen = screen; gl.autoClear = autoClear; gl.info.autoReset = autoReset; gl.setRenderTarget(target)
        }
      },
    }
    globals.__torqueBackground = port
    owned.defer(() => { if (globals.__torqueBackground === port) delete globals.__torqueBackground })
    let appliedWidth = -1, appliedHeight = -1, appliedDpr = -1
    let appliedDeviceDpr = -1
    const buffer = new Vector2()
    const savedColor = new Color()
    const forward = new Vector3(), right = new Vector3(), up = new Vector3()
    const originalDpr = gl.getPixelRatio()
    owned.defer(() => { if (gl.getPixelRatio() === appliedDpr) setDpr(originalDpr) })
    let budget = telemetry.budget
    setDpr(initialBudget.dpr)
    composer.setPixelRatio(initialBudget.dpr); composer.setSize(dimensions.current.width, dimensions.current.height)
    appliedDpr = initialBudget.dpr; appliedDeviceDpr = window.devicePixelRatio
    appliedWidth = dimensions.current.width; appliedHeight = dimensions.current.height; budget = initialBudget
    let warmedUp = false
    const warmUp = () => {
      const warmTarget = gl.getRenderTarget(), warmClear = gl.autoClear
      try {
        // Compile and resolve once through the real pass chain, but only after visibility is known.
        gl.compile(scene, camera)
        composer.renderToScreen = false
        composer.render(0)
      } finally {
        composer.renderToScreen = true
        gl.autoClear = warmClear
        gl.setRenderTarget(warmTarget)
      }
    }
    initialized = true
    return { owned, tick(delta: number) {
      const hidden = document.hidden
      telemetry.hidden = hidden
      if (hidden || !owned.current()) { telemetry.active = false; return }
      const progress = store.getProgress()
      const surroundings = isolation.surroundingsOpacity
      const tier = store.getState().tier === 'lite' ? 'lite' : 'full'
      if (dimensions.current.width !== appliedWidth || dimensions.current.height !== appliedHeight
        || appliedDeviceDpr !== window.devicePixelRatio || budget.tier !== tier) {
        budget = computeRenderBudget(dimensions.current.width, dimensions.current.height, window.devicePixelRatio, tier)
        appliedDeviceDpr = window.devicePixelRatio
      }
      if (budget.dpr !== appliedDpr || dimensions.current.width !== appliedWidth || dimensions.current.height !== appliedHeight) {
        // R3F owns logical CSS size; this page-local renderer owns only its buffer cap.
        setDpr(budget.dpr)
        composer.setPixelRatio(budget.dpr); composer.setSize(dimensions.current.width, dimensions.current.height)
        appliedWidth = dimensions.current.width; appliedHeight = dimensions.current.height; appliedDpr = budget.dpr
      }
      sampleBackground(progress, sample); samplePostProfile(progress, post)
      telemetry.progress = progress; telemetry.active = sample.active; telemetry.budget = budget
      telemetry.isolation.progress = isolation.progress
      telemetry.isolation.surroundingsOpacity = surroundings
      telemetry.isolation.manual = isolation.manual
      telemetry.pointerWeight = sample.pointerWeight
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
      right.set(1, 0, 0).applyQuaternion(camera.quaternion); up.set(0, 1, 0).applyQuaternion(camera.quaternion)
      for (let i = 0; i < BACKGROUND_LAYERS.length; i++) {
        const layer = sample.layers[i]
        const definition = BACKGROUND_LAYERS[i], mesh = meshes[i], material = mesh.material
        const height = camera instanceof PerspectiveCamera ? 2 * Math.tan(camera.fov * Math.PI / 360) * definition.depth : 2
        mesh.position.copy(camera.position).addScaledVector(forward, definition.depth).addScaledVector(right, layer.offset[0]).addScaledVector(up, layer.offset[1])
        mesh.quaternion.copy(camera.quaternion)
        mesh.scale.set(height * appliedWidth / appliedHeight * 2, height * 2, 1)
        mesh.visible = i === 0 || (sample.active && layer.opacity > 0)
        material.uniforms.uResolution.value.set(appliedWidth, appliedHeight)
        material.uniforms.uColor.value.set(...layer.color)
        material.uniforms.uOpacity.value = layer.opacity; material.uniforms.uScale.value = layer.scale
        material.uniforms.uSurroundings.value = surroundings
        const actual = telemetry.actualLayers[i]
        mesh.position.toArray(actual.position); actual.visible = mesh.visible
        actual.requestedOpacity = layer.opacity
        actual.uSurroundings = material.uniforms.uSurroundings.value
        actual.effectiveAlpha.alphaUpperBound = i === 0 ? 1 : layer.opacity * surroundings
      }
      grade.uniforms.uExposure.value = post.exposure; grade.uniforms.uSaturation.value = post.saturation; grade.uniforms.uVignette.value = post.vignette
      if (!warmedUp) {
        if (!gl.domElement.isConnected) { telemetry.active = false; return }
        warmUp()
        const saved = gl.getRenderTarget()
        try {
          for (const [i, target] of [composer.renderTarget1, composer.renderTarget2].entries()) {
            gl.setRenderTarget(target)
            telemetry.antialias.measuredTargetSamples[i] = context.getParameter(context.SAMPLES) as number
          }
          telemetry.antialias.achievedComposerSamples = Math.min(...telemetry.antialias.measuredTargetSamples)
          if (initialTier === 'full' && telemetry.antialias.achievedComposerSamples < nativeSamples) {
            throw new Error('Private composer actual framebuffer samples do not retain native antialiasing')
          }
        } finally { gl.setRenderTarget(saved) }
        warmedUp = true
      }
      const autoReset = gl.info.autoReset, oldTarget = gl.getRenderTarget(), oldAutoClear = gl.autoClear
      gl.getClearColor(savedColor)
      const oldAlpha = gl.getClearAlpha()
      try {
        gl.info.autoReset = false; gl.info.reset()
        composer.render(Math.min(delta, .1))
        gl.getDrawingBufferSize(buffer); telemetry.actualBuffer[0] = buffer.x; telemetry.actualBuffer[1] = buffer.y
        telemetry.calls = gl.info.render.calls; telemetry.triangles = gl.info.render.triangles; telemetry.frames++
      } finally {
        gl.info.autoReset = autoReset; gl.autoClear = oldAutoClear; gl.setRenderTarget(oldTarget); gl.setClearColor(savedColor, oldAlpha)
      }
    } }
    } catch (error) {
      owned.dispose()
      if (constructionCleanup.length) throw new AggregateError([error, ...constructionCleanup], 'Background initialization and cleanup failed')
      throw error
    }
  }
  useEffect(() => {
    terminal.current = false
    try { current.current = install() } catch (error) { terminal.current = true; onFailure(error) }
    return () => { const value = current.current; current.current = null; value?.owned.dispose() }
  }, [gl, scene, camera, store, onFailure, isolation])
  useFrame((_state, delta) => {
    if (terminal.current) return
    try { current.current?.tick(delta) } catch (error) {
      terminal.current = true
      const value = current.current; current.current = null
      try { onFailure(error) } finally { value?.owned.dispose() }
    }
  }, 1)
  return null
}
