import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Color,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from 'three'
import { degradeQuality, forcePoster, getQuality } from '../../state/qualityStore'
import { getScrollState, setScrollState, telemetry } from '../../state/scrollStore'
import {
  DRAWING_INTRO_WINDOW,
  REDUCED_MOTION_INTRO_T,
  drawingIntroState,
  INTRO_PHASES,
  pacedProgress,
  rawScrollFor,
} from './introTimeline'
import {
  INK,
  PAPER,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  SHEET_ZONES,
  type DrawingGeometry,
  type DrawingLayout,
  type RenderedDrawing,
  makeDrawingLayout,
  makePaperGrainTexture,
} from './drawingGeometry'
import {
  applyExtraction,
  bindExtractionPressure,
  drawingRuntime,
  relativePose,
  lowestVertex,
  solveExtraction,
  type Extraction,
} from './extractionPose'
import { sheetReveal } from './sheetCamera'
import { composeSheet } from './sheet/composeSheet'
import { prepareDrawingCache } from './sheet/drawingCache'
import { GROUP, WAVE_GLSL, makeInkFills, makeInkLines, makeSheetUniforms, type SheetUniforms } from './sheet/ink'
import { makePaperFlexField, paperContactShadow, paperFlexAmplitude, paperVellum } from './sheet/paperFlex'
import { bakeProfile } from './sheet/profile'
import { LIGHTNING_FRAGMENT, LIGHTNING_VERTEX, makeLightningRibbon } from './sheet/lightning'
import { measureProfileRegistration } from './sheet/registration'
import { makeSheetText, type SheetTextLayer } from './sheet/sheetText'
import { makeBreakthroughGeometry } from './sheet/breakthroughGeometry'
import { makeBarrierMask, makeFragmentPrint, makeCrackMask, CRACK_APERTURE_GLSL } from './sheet/breakthrough'
import { capturePortalPixels, makePortal, PORTAL_DESK_Z, PORTAL_PROFILE_GLSL } from './sheet/portal'

/**
 * THE DRAFTING TABLE (JG-035).
 *
 * A vellum sheet lying on a walnut desk under a warm lamp. Everything printed on it is vector
 * (sheet/ink.ts instanced pen strokes + sheet/sheetText.ts SDF lettering), composed once from
 * the live GLB (sheet/composeSheet.ts) and inked in by the intro timeline as the camera passes.
 * The bake is viewport-independent: nothing here depends on the canvas size except the pen
 * coverage floor, which reads the drawing buffer every frame (JG-034).
 */

const NOISE_GLSL = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
  return s;
}`

const planeVertex = /* glsl */ `
${WAVE_GLSL}
uniform float uDisplace;
uniform vec2 uFragmentCenter;
varying vec2 vPlane;
varying float vFront;
void main() {
  vPlane = position.xy + uFragmentCenter;
  vFront = normal.z;
  vec3 p = position;
  p.z += paperDisplacement(vPlane) * uDisplace;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

/**
 * Vellum: warm cream stock with low-frequency mottle, pressed fibres and tooth, a pale
 * non-repro graph grid inside the drawing frame, and the lamp. The lamp is a fixed warm key
 * off the top-left corner plus a small reading pool that trails the camera's look-at point.
 */
const paperFragment = /* glsl */ `
${WAVE_GLSL}
${NOISE_GLSL}
${CRACK_APERTURE_GLSL}
${PORTAL_PROFILE_GLSL}
uniform sampler2D uGrain;
uniform sampler2D uFragmentPrint;
uniform float uFragment; uniform float uFracture;
uniform vec3 uPaper; uniform vec3 uGrid;
uniform vec4 uFrame; uniform vec2 uSheetHalf;
uniform vec3 uKey; uniform vec3 uLamp;
uniform float uLampPower; uniform float uReadingPool;
uniform float uContrast; uniform float uOpacity; uniform float uMode;
uniform vec2 uContact; uniform float uVellum;
varying vec2 vPlane;
varying float vFront;
float gridLine(float coord, float spacing, float hw) {
  float fw = max(fwidth(coord), 1e-7);
  float d = abs(fract(coord / spacing - 0.5) - 0.5) * spacing;
  float hwEff = max(hw, 0.5 * fw);
  return clamp((hwEff - d) / fw + 0.5, 0.0, 1.0) * min(1.0, hw / (0.5 * fw));
}
void main() {
  if (uMode > 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 p = vPlane;
  openHairline(p);
  vec3 c = uPaper;
  // Stock: cloudy formation, fibres pressed in two loose directions, tooth.
  c *= 0.965 + 0.07 * fbm(p * 14.0);
  vec2 q1 = mat2(0.94, 0.34, -0.34, 0.94) * p;
  vec2 q2 = mat2(0.82, -0.57, 0.57, 0.82) * p;
  float fib = pow(noise(q1 * vec2(1500.0, 110.0)), 9.0) + pow(noise(q2 * vec2(1300.0, 95.0) + 7.0), 9.0);
  c *= 1.0 - 0.07 * fib;
  c += (texture2D(uGrain, p * 9.0).r - 0.5) * 0.018;
  // Graph grid: 5 mm minor, 25 mm major, inside the frame only. Fades as it drops below a
  // few pixels so it never moires.
  vec2 fr = step(uFrame.xy, p) * step(p, uFrame.xy + uFrame.zw);
  float inFrame = fr.x * fr.y;
  float px = max(fwidth(p.x), fwidth(p.y));
  float minorFade = 1.0 - smoothstep(0.0005, 0.0011, px);
  float minor = max(gridLine(p.x, 0.005, 0.00005), gridLine(p.y, 0.005, 0.00005)) * minorFade;
  float major = max(gridLine(p.x, 0.025, 0.00008), gridLine(p.y, 0.025, 0.00008));
  c = mix(c, uGrid, inFrame * max(minor * 0.16, major * 0.26));
  // Deckle: the last few millimetres of the stock catch less light.
  vec2 e2 = uSheetHalf - abs(p);
  c *= mix(0.86, 1.0, smoothstep(0.0, 0.007, min(e2.x, e2.y)));
  // Lamp.
  float dk = length(p - uKey.xy) / uKey.z;
  float key = exp(-dk * dk);
  float dl = length(p - uLamp.xy) / uLamp.z;
  float pool = exp(-dl * dl);
  float light = (0.64 + 0.34 * key + 0.1 * pool * uReadingPool) * uLampPower;
  // Cool room bounce is independent of the failed practical lamp. The stock and
  // printed drawing remain present while the white electrical core owns the light.
  vec3 ambient = vec3(0.034, 0.042, 0.061) * (1.0 - uLampPower);
  c *= light * mix(vec3(1.0), vec3(1.05, 1.0, 0.9), key) + ambient;
  // Pressure emboss: the bowed vellum under a raking lamp. Faces tilted toward the lamp
  // brighten, faces tilted away darken; the square-on camera sees no parallax, so this
  // shading is what carries the flex.
  float w = paperFlexWeight(p);
  float pressure = uFlexAmplitude / 0.012;
  vec2 h = vec2(0.004, 0.0);
  vec2 grad = vec2(paperDisplacement(p + h.xy) - paperDisplacement(p - h.xy),
                   paperDisplacement(p + h.yx) - paperDisplacement(p - h.yx)) / (2.0 * h.x);
  vec2 toLamp = normalize(uKey.xy - p);
  c *= 1.0 + clamp(dot(grad, toLamp) * 4.5, -0.28, 0.22);
  c *= 1.0 - 0.14 * pressure * (4.0 * w * (1.0 - w));
  // Contact shadow: the tool's footprint thrown away from the lamp. Tight while touching,
  // offset, widening and fading as the tool lifts clear.
  if (uContact.x > 0.0) {
    vec2 q = p + toLamp * uContact.y * 0.8;
    float shadow = 0.2 * paperFlexWeight(q);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982;
      shadow += 0.1 * paperFlexWeight(q + uContact.y * vec2(cos(a), sin(a)));
    }
    c *= 1.0 - uContact.x * shadow;
  }
  // Every face is opaque physical stock. Printed ink rides the departing fronts.
  if (uFragment > 0.5) {
    float ink = texture2D(uFragmentPrint, p / vec2(0.8, 0.5) + 0.5).a;
    c = mix(c, vec3(0.005, 0.014, 0.025) * (0.14 + 0.86 * uLampPower), ink * step(0.001, uFracture));
    if (abs(vFront) < 0.5) c = vec3(0.025, 0.012, 0.006) * (0.2 + uLampPower);
    if (vFront < -0.5) c *= 0.65;
  }
  // Restrict blue spill to the torn lip; never backlight the entire profile.
  float underlight = portalRim(p) * uPortalLight;
  c += vec3(0.475, 0.812, 1.0) * underlight * (vFront < -0.5 ? 0.06 : 0.018);
  gl_FragColor = vec4(c * uContrast, 1.0);
}`

/**
 * Walnut desk: dark figured grain running along the sheet's long axis, lit by the same lamp,
 * with the sheet's soft contact shadow. Fades to transparent well before its edge so it
 * dissolves into the scene's dark backdrop at every framing.
 */
const deskFragment = /* glsl */ `
${WAVE_GLSL}
${NOISE_GLSL}
${PORTAL_PROFILE_GLSL}
uniform vec3 uKey; uniform vec2 uSheetHalf;
uniform float uContrast; uniform float uOpacity; uniform float uMode; uniform float uVellum; uniform float uLampPower;
varying vec2 vPlane;
void main() {
  if (uMode > 0.5) discard;
  vec2 p = vPlane;
  // This opening exists before the first hairline and is never restored during the lift.
  // Slight mask dilation prevents a raster texel of wood leaking along the torn contour.
  if (portalProfile(p) > 0.5 || portalRim(p) > 0.0) discard;
  float warp = fbm(p * vec2(2.6, 9.0));
  float figure = fbm(p * vec2(3.0, 38.0) + warp * 1.8);
  float rings = 0.5 + 0.5 * sin(p.y * 150.0 + warp * 10.0 + figure * 5.0);
  rings = pow(rings, 1.6);
  // Open walnut pores: short dark dashes running with the grain.
  float pores = smoothstep(0.62, 0.9, noise(vec2(p.x * 260.0, p.y * 2400.0)));
  pores = 1.0 - pores * 0.6 + 0.25 * noise(vec2(p.x * 90.0, p.y * 900.0));
  vec3 dark = vec3(0.020, 0.0105, 0.0055);
  vec3 lite = vec3(0.078, 0.040, 0.019);
  vec3 wood = mix(dark, lite, clamp(rings * 0.55 + (figure - 0.5) * 0.9 + 0.2, 0.0, 1.0));
  wood *= 0.72 + 0.34 * pores;
  float dk = length(p - uKey.xy) / (uKey.z * 1.35);
  float key = exp(-dk * dk);
  // Lacquer sheen: a broad soft highlight elongated along the grain.
  vec2 s = (p - uKey.xy - vec2(0.18, -0.1)) * vec2(1.4, 3.2);
  float sheen = exp(-dot(s, s) * 3.0) * (0.6 + 0.4 * pores);
  vec3 c = (wood * (0.22 + 1.9 * key) + vec3(0.05, 0.032, 0.02) * sheen)
    * mix(vec3(0.07, 0.09, 0.14), vec3(1.0), uLampPower);
  // Contact shadow of the sheet, thrown away from the lamp.
  vec2 o = normalize(uKey.xy) * -0.007;
  vec2 q = abs(p - o) - uSheetHalf;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  c *= 1.0 - 0.72 * (1.0 - smoothstep(-0.002, 0.03, sd));
  float r = length(p * vec2(0.62, 0.95));
  float fade = 1.0 - smoothstep(0.42, 1.05, r);
  gl_FragColor = vec4(c * uContrast, fade);
}`

interface ScrollToApi {
  scrollTo?: (target: number, options?: { immediate?: boolean; force?: boolean }) => void
}

declare global {
  interface Window {
    __sheetStats?: Record<string, number>
  }
}

/** Fixed warm key: off the sheet's top-left corner, sheet-plane metres (x, y, radius). */
const KEY_LAMP = new Vector3(-0.16, 0.2, 0.62)
const INK_NAVY = new Color(INK)
const INK_PROOF = new Color(1, 1, 1)
const DESK = { width: 3.4, height: 2.4 }

interface BakedSheet {
  layout: DrawingLayout
  extraction: Extraction
  rendered: RenderedDrawing
  uniforms: SheetUniforms
  lines: Mesh
  fills: Mesh
  text: SheetTextLayer
  stats: Record<string, number>
  pulseRegistration: () => ReturnType<typeof measureProfileRegistration>
  fracture: ReturnType<typeof makeBreakthroughGeometry>
  barrierMask: ReturnType<typeof makeBarrierMask>
  fragmentPrint: ReturnType<typeof makeFragmentPrint>
  crackMask: ReturnType<typeof makeCrackMask>
}

export function DrawingLinework({ data }: { data: DrawingGeometry }) {
  const { gl } = useThree()
  const [baked, setBaked] = useState<BakedSheet | null>(null)

  // JG-034: the sheet is baked once per model, never per viewport. The old layout was
  // re-derived from a transient R3F size at mount and nothing re-fitted it until a resize.
  useLayoutEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined
    const started = performance.now()
    const layout = makeDrawingLayout(1, data.bounds)
    const bake = async () => {
    const precomputed = await prepareDrawingCache(data, layout)
    if (cancelled) return
    const cacheMs = performance.now() - started
    const extractStart = performance.now()
    const extraction = solveExtraction(data, layout)
    const extractMs = performance.now() - extractStart
    const composed = composeSheet(gl, data, layout)
    const rendered = bakeProfile(gl, data, layout)
    const fracture = makeBreakthroughGeometry(rendered.profilePoints, SHEET_WIDTH, SHEET_HEIGHT)
    const barrierMask = makeBarrierMask(fracture.outline, SHEET_WIDTH, SHEET_HEIGHT)
    const fragmentPrint = makeFragmentPrint(composed.ink.segs, composed.ink.fills, SHEET_WIDTH, SHEET_HEIGHT)
    const crackMask = makeCrackMask(rendered.profilePoints, fracture.cracks, SHEET_WIDTH, SHEET_HEIGHT)
    const uniforms = makeSheetUniforms()
    uniforms.uBarrierMask.value = barrierMask
    uniforms.uPortalSheetSize = { value: new Vector2(SHEET_WIDTH, SHEET_HEIGHT) }
    uniforms.uPortalLight = { value: 0 }
    const flex = makePaperFlexField(rendered.profilePoints, SHEET_WIDTH, SHEET_HEIGHT)
    bindExtractionPressure(extraction, layout, flex, getQuality().tier)
    uniforms.uFlexField.value = flex.texture
    uniforms.uFlexRect.value = flex.rect
    uniforms.uOrigin.value.set(extraction.contact.x, extraction.contact.y)
    const lines = makeInkLines(composed.ink, uniforms)
    const fills = makeInkFills(composed.ink, uniforms)
    const text = makeSheetText(composed.ink.texts, uniforms)
    const stats = { ...composed.stats, cacheMs, precomputed: precomputed ? 1 : 0, extractMs, bakeMs: performance.now() - started, flexFieldPeak: flex.peak, flexAmplitude: 0, flexPeakDisplacement: 0, flexEnabled: 0, flexNormalX: 0, flexNormalY: 0, flexNormalZ: 1, contactShadow: 0, contactRadius: 0, vellum: 0 }
    window.__sheetStats = stats
    // Diagnostics are lazy: the independent ink comparison must not tax startup.
    let registration: ReturnType<typeof measureProfileRegistration> | undefined
    const pulseRegistration = () => registration ??= measureProfileRegistration(rendered.profilePoints, composed.ink.segs, GROUP.side)
    setBaked({ layout, extraction, rendered, uniforms, lines, fills, text, stats, pulseRegistration, fracture, barrierMask, fragmentPrint, crackMask })
    dispose = () => {
      flex.texture.dispose()
      fracture.dispose()
      barrierMask.dispose(); fragmentPrint.dispose(); crackMask.dispose()
      rendered.dispose()
      lines.geometry.dispose()
      ;(lines.material as ShaderMaterial).dispose()
      fills.geometry.dispose()
      ;(fills.material as ShaderMaterial).dispose()
      text.dispose()
    }
    }
    void bake().catch((error) => {
      if (!cancelled) {
        console.error('Drawing initialization failed', error)
        forcePoster()
      }
    })
    return () => { cancelled = true; dispose?.() }
  }, [gl, data])

  return baked ? <DrawingPrint data={data} baked={baked} /> : null
}

function DrawingPrint({ data, baked }: { data: DrawingGeometry; baked: BakedSheet }) {
  const { layout, extraction, rendered, uniforms, lines, fills, text } = baked
  const { size, camera, gl } = useThree()
  const group = useRef<Group>(null)
  const grain = useMemo(() => makePaperGrainTexture(), [])
  useEffect(() => () => grain.dispose(), [grain])

  const materials = useMemo(() => {
    Object.assign(uniforms, {
      uGrain: { value: grain },
      uPaper: { value: new Color(PAPER) },
      uGrid: { value: new Color('#7fa7c4') },
      uFrame: {
        value: new Vector4(SHEET_ZONES.frame.x, SHEET_ZONES.frame.y, SHEET_ZONES.frame.w, SHEET_ZONES.frame.h),
      },
      uSheetHalf: { value: new Vector2(SHEET_WIDTH / 2, SHEET_HEIGHT / 2) },
      uKey: { value: KEY_LAMP.clone() },
      uContrast: { value: 1 },
      uMode: { value: 0 },
      uDisplace: { value: 1 },
      uPulseHead: { value: 0 },
      uPulse: { value: 0 },
      uLampPower: { value: 1 },
      uReadingPool: { value: 1 },
      uFragmentCenter: { value: new Vector2() },
      uFragment: { value: 0 },
      uFragmentPrint: { value: baked.fragmentPrint },
      uCrackMask: { value: baked.crackMask },
      uCrackGlow: { value: 0 },
      uCrackWeb: { value: 0 },
      uCrackGrowth: { value: 0 },
      uSpark: { value: 0 },
    })
    const paper = new ShaderMaterial({
      uniforms,
      vertexShader: planeVertex,
      fragmentShader: paperFragment,
      transparent: false,
      side: DoubleSide,
      depthWrite: true,
      toneMapped: false,
    })
    const desk = new ShaderMaterial({
      uniforms,
      vertexShader: planeVertex.replace("p.z += paperDisplacement(vPlane) * uDisplace;", ""),
      fragmentShader: deskFragment,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
    const pulse = new ShaderMaterial({
      uniforms,
      vertexShader: WAVE_GLSL + LIGHTNING_VERTEX,
      fragmentShader: LIGHTNING_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    })
    const cracks = new ShaderMaterial({ uniforms, vertexShader: WAVE_GLSL + LIGHTNING_VERTEX,
      fragmentShader: LIGHTNING_FRAGMENT.replace(/uPulseHead/g, 'uCrackGrowth').replace(/uCrackGlow/g, 'uCrackWeb').replace(/uSpark/g, 'uCrackSpark'),
      transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false })
    const edge = new ShaderMaterial({ uniforms, vertexShader: planeVertex,
      fragmentShader: `uniform float uLampPower; varying vec2 vPlane; ${PORTAL_PROFILE_GLSL}
        void main(){ gl_FragColor=vec4(vec3(0.012,0.006,0.003)*(0.3+uLampPower)
          + vec3(0.21,0.45,0.76)*portalRim(vPlane)*uPortalLight*0.18,1.0); }`,
      side: DoubleSide, toneMapped: false })
    const fragments = baked.fracture.fragments.map(f => new ShaderMaterial({ uniforms: { ...uniforms,
      uFragmentCenter: { value: f.center }, uFragment: { value: 1 } },
      vertexShader: planeVertex, fragmentShader: paperFragment, side: DoubleSide, toneMapped: false }))
    return { paper, desk, pulse, cracks, edge, fragments }
  }, [uniforms, grain])

  const meshes = useMemo(() => {
    const paper = new Mesh(baked.fracture.paper, materials.paper)
    paper.name = 'engineering-drawing-Z0'
    paper.renderOrder = 1
    const desk = new Mesh(new PlaneGeometry(DESK.width, DESK.height, 1, 1), materials.desk)
    desk.name = 'drafting-desk'
    desk.position.z = PORTAL_DESK_Z
    desk.renderOrder = -1
    desk.frustumCulled = false
    const pulse = new Mesh(makeLightningRibbon(rendered.profilePoints), materials.pulse)
    pulse.name = 'lightning'
    pulse.frustumCulled = false
    pulse.renderOrder = 4
    const edge = new Mesh(baked.fracture.edge, materials.edge)
    edge.renderOrder = 2; edge.frustumCulled = false; edge.name = 'charred-profile-edge'
    const cracks = new Mesh(baked.fracture.cracks, materials.cracks)
    cracks.renderOrder = 4; cracks.frustumCulled = false; cracks.name = 'pressure-crack-web'
    const fragments = baked.fracture.fragments.map((f, i) => {
      const mesh = new Mesh(f.geometry, materials.fragments[i])
      mesh.position.set(f.center.x, f.center.y, 0); mesh.renderOrder = 1
      mesh.frustumCulled = false; mesh.name = `paper-fragment-${i}`
      return mesh
    })
    const initialModelBottom = data.bounds.clone().applyMatrix4(layout.primaryRotation).min.z + extraction.initialZ
    const portal = makePortal(baked.fracture.outline, initialModelBottom,
      new Vector2(layout.primaryCenter.x, layout.primaryCenter.y), uniforms.uPortalLight as { value: number })
    // Proof-only: the primary elevation's filled silhouette, flattened onto the sheet.
    const primary = layout.views[0]
    const mask = new Mesh(
      data.geometry,
      new MeshBasicMaterial({ color: 0xffffff, toneMapped: false, depthWrite: false }),
    )
    mask.matrixAutoUpdate = false
    mask.matrix.makeTranslation(0, 0, 0.0005).multiply(new Matrix4().makeScale(1, 1, 0)).multiply(primary.transform)
    mask.renderOrder = 5
    mask.visible = false
    mask.frustumCulled = false
    return { paper, desk, pulse, mask, edge, cracks, fragments, portal }
  }, [materials, rendered, layout, data])

  useEffect(
    () => () => {
      meshes.desk.geometry.dispose()
      meshes.pulse.geometry.dispose()
      ;(meshes.mask.material as MeshBasicMaterial).dispose()
      materials.paper.dispose()
      materials.desk.dispose()
      materials.pulse.dispose()
      materials.cracks.dispose(); materials.edge.dispose(); materials.fragments.forEach(m => m.dispose())
      meshes.portal.dispose()
    },
    [meshes, materials],
  )

  useEffect(() => {
    let disposed = false
    drawingRuntime.layout = layout
    drawingRuntime.extraction = extraction
    drawingRuntime.rendered = rendered
    drawingRuntime.ready = true
    telemetry.drawing.annotationsReady = false
    text.ready.then(() => {
      if (disposed) return
      telemetry.drawing.annotationsReady = true
    })

    const api = {
      ready: true,
      captureNextFrame: () =>
        new Promise((resolve) => {
          drawingRuntime.captureNext = () =>
            resolve(
              structuredClone({
                cameraGoal: telemetry.camera.goal,
                cameraUp: telemetry.camera.up,
                drawing: telemetry.drawing,
                rig: telemetry.rig,
                actualCamera: camera.matrixWorld.toArray(),
              }),
            )
        }),
      setTier: (tier: string) => {
        if (tier === 'lite' && getQuality().tier === 'full') degradeQuality(true)
        if (tier === 'poster') forcePoster()
      },
      setMode: (mode: string) => {
        ;(window as unknown as Record<string, unknown>).__drawingProofMode = mode
      },
      /** Pin a paced-progress value. Scrolls the real document to the matching raw offset. */
      setProgress: (p: number) => {
        ;(window as unknown as Record<string, unknown>).__drawingProofProgress = p
        const max = document.documentElement.scrollHeight - window.innerHeight
        const raw = max * rawScrollFor(p)
        const lenis = (window as unknown as Record<string, ScrollToApi | undefined>).__lenis
        lenis?.scrollTo?.(raw, { immediate: true, force: true })
        window.scrollTo(0, raw)
        setScrollState({ progress: p, velocity: 0 })
      },
      /**
       * Release the pin and let the page settle from a real scroll position. Used by the
       * determinism harness: the damped camera and the scrubbed GSAP timeline are allowed to
       * settle before a checkpoint is read, instead of the damping being deleted.
       */
      scrollToProgress: (p: number) => {
        delete (window as unknown as Record<string, unknown>).__drawingProofProgress
        const max = document.documentElement.scrollHeight - window.innerHeight
        const raw = max * rawScrollFor(p)
        const lenis = (window as unknown as Record<string, ScrollToApi | undefined>).__lenis
        lenis?.scrollTo?.(raw, { immediate: true, force: true })
        window.scrollTo(0, raw)
        return { raw, expected: pacedProgress(raw / Math.max(max, 1)) }
      },
      release: () => {
        delete (window as unknown as Record<string, unknown>).__drawingProofProgress
        ;(window as unknown as Record<string, unknown>).__drawingProofMode = 'normal'
      },
      sheetStats: () => baked.stats,
      capturePulseRegistration: () => baked.pulseRegistration(),
      captureTextBounds: () => text.captureBounds(),
      captureTitleBounds: () => text.captureBounds(GROUP.titleBlock),
      capturePortalPixels: () => capturePortalPixels({ gl, camera, sheet: group.current!,
        outline: baked.fracture.outline, portal: meshes.portal, desk: meshes.desk,
        paper: meshes.paper, fragments: meshes.fragments, edge: meshes.edge }),
      capturePortal: () => ({
        active: meshes.portal.group.visible && !!group.current?.visible,
        capZ: meshes.portal.capZ, mouthZ: meshes.portal.mouthZ, deskZ: meshes.desk.position.z,
        initialModelBottom: meshes.portal.initialModelBottom,
        capBehindInitialModel: meshes.portal.capZ < meshes.portal.initialModelBottom,
        deskProfileDiscard: true, broadBacklight: false,
        depthTest: meshes.portal.cap.material.depthTest, depthWrite: meshes.portal.cap.material.depthWrite,
        opacity: 1, profile: baked.fracture.outline, profilePoints: meshes.portal.profilePoints,
        wallLevels: meshes.portal.wallLevels, light: uniforms.uPortalLight.value,
        sheetMatrix: group.current?.matrixWorld.toArray(),
      }),
      /** Offscreen normal/null trace pixel comparison, isolated from post effects. */
      captureLightningPixels: () => {
        const target = new WebGLRenderTarget(512, 288)
        const priorTarget = gl.getRenderTarget()
        const priorVisibility = meshes.pulse.visible
        const scene = group.current!.parent!
        let root = scene
        while (root.parent) root = root.parent
        const normal = new Uint8Array(512 * 288 * 4)
        const nullTrace = new Uint8Array(normal.length)
        const matrix = camera.matrixWorld.clone()
        try {
          gl.setRenderTarget(target)
          gl.render(root, camera)
          gl.readRenderTargetPixels(target, 0, 0, 512, 288, normal)
          meshes.pulse.visible = false
          gl.render(root, camera)
          gl.readRenderTargetPixels(target, 0, 0, 512, 288, nullTrace)
          let changedBrightPixels = 0, contourPixels = 0
          for (let i = 0; i < normal.length; i += 4) {
            const peak = Math.max(normal[i], normal[i + 1], normal[i + 2])
            const delta = Math.max(normal[i] - nullTrace[i], normal[i + 1] - nullTrace[i + 1], normal[i + 2] - nullTrace[i + 2])
            if (delta > 8) { contourPixels++; if (peak > 80) changedBrightPixels++ }
          }
          const linked = gl.info.programs?.every(p => {
            const program = p as typeof p & { diagnostics?: { runnable: boolean } }
            return program.diagnostics?.runnable !== false
          }) ?? false
          return { meshName: meshes.pulse.name, meshVisible: priorVisibility, fixedCamera: matrix.equals(camera.matrixWorld), shaderValid: linked, consoleErrors: 0, changedBrightPixels, contourPixels, width: 512, height: 288 }
        } finally {
          meshes.pulse.visible = priorVisibility
          gl.setRenderTarget(priorTarget)
          target.dispose()
        }
      },
      captureRegistration: () => ({
        sourceTriangles: data.sourceTriangles,
        primaryMatrix: layout.views[0].camera.projectionMatrix.toArray(),
        planeMatrix: layout.primaryRotation.toArray(),
        profilePoints: rendered.profilePoints.length,
        perimeter: rendered.perimeter,
        sheet: { width: layout.width, height: layout.height, aspect: layout.width / layout.height },
        views: layout.views.map((view) => ({ name: view.name, rect: view.rect, label: view.label })),
        bounds: { min: data.bounds.min.toArray(), max: data.bounds.max.toArray() },
        /**
         * Registration error, in screen pixels. The expected point is where the printed
         * primary view puts the feature (model -> sheet plane through the view transform, then
         * lifted into the world with the sheet's live matrix); the actual point is the live
         * model's own vertex. Both go through the same live camera.
         */
        projectedFeatures: Object.entries(data.features).map(([id, p]) => {
          const onSheet = p.clone().applyMatrix4(layout.views[0].transform)
          const expected = new Vector3(onSheet.x, onSheet.y, 0.0002)
            .applyMatrix4(drawingRuntime.sheetMatrix)
            .project(camera)
          const actual = p.clone().applyMatrix4(drawingRuntime.modelMatrix).project(camera)
          return {
            id,
            expected: expected.toArray(),
            actual: actual.toArray(),
            errorPixels: Math.hypot(
              ((actual.x - expected.x) * size.width) / 2,
              ((actual.y - expected.y) * size.height) / 2,
            ),
          }
        }),
        crossing: extraction.crossing,
        contact: extraction.contact.toArray(),
        travel: extraction.travel,
        exactContact: lowestVertex(
          data,
          relativePose(extraction.crossing, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel, extraction.pressureTravel),
        ).toArray(),
      }),
      captureContact: (t: number) => ({
        t,
        point: lowestVertex(
          data,
          relativePose(t, layout, extraction.travel, extraction.initialZ, new Matrix4(), extraction.clearanceTravel, extraction.pressureTravel),
        ).toArray(),
        rippleOrigin: extraction.contact.toArray(),
      }),
      captureBreakthrough: () => {
        // Exact transformed-vertex barrier checks are deliberately off the frame loop.
        const relative = new Matrix4().copy(drawingRuntime.sheetMatrix).invert().multiply(drawingRuntime.modelMatrix)
        const vertices = data.geometry.getAttribute('position'), q = new Vector3()
        let minZ = Infinity, maxZ = -Infinity, crossingVertices = 0, outsideOpening = 0
        const contour = baked.fracture.outline
        const buckets: number[][] = Array.from({length:256},()=>[])
        const row = (y:number) => Math.max(0,Math.min(255,Math.floor((y / SHEET_HEIGHT + 0.5) * 256)))
        for (let i=0,j=contour.length-1;i<contour.length;j=i++) {
          const a=contour[j],b=contour[i]
          for(let k=row(Math.min(a[1],b[1]));k<=row(Math.max(a[1],b[1]));k++) buckets[k].push(i)
        }
        const inside = (x: number, y: number) => {
          let hit = false
          for (const i of buckets[row(y)]) {
            const a = contour[(i + contour.length - 1) % contour.length], b = contour[i]
            if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit
          }
          return hit
        }
        for (let i = 0; i < vertices.count; i++) {
          q.fromBufferAttribute(vertices, i).applyMatrix4(relative)
          minZ = Math.min(minZ, q.z); maxZ = Math.max(maxZ, q.z)
          if (Math.abs(q.z) < 0.001) { crossingVertices++; if (!inside(q.x, q.y)) outsideOpening++ }
        }
        const current = drawingIntroState(getScrollState().progress, extraction.crossing)
        return { minZ, maxZ, crossingVertices, outsideOpening, modelMoving: current.poseT > 0.4,
          openingClear: current.openingClear, opacity: uniforms.uOpacity.value,
          area: baked.fracture.area, fragmentArea: baked.fracture.fragmentArea,
          fragments: meshes.fragments.map(m => ({ name: m.name, position: m.position.toArray(), rotation: m.rotation.toArray().slice(0,3), visible: m.visible })),
          profile: baked.fracture.outline, thickness: baked.fracture.thickness,
          maxBoundaryDeviation: baked.fracture.maxBoundaryDeviation,
          geometries: { paperTriangles: baked.fracture.paper.getIndex() ? baked.fracture.paper.getIndex()!.count / 3 : baked.fracture.paper.getAttribute('position').count / 3,
            edgeVertices: baked.fracture.edge.getAttribute('position').count },
        }
      },
    }
    ;(window as unknown as Record<string, unknown>).__drawingProof = api

    return () => {
      disposed = true
      drawingRuntime.ready = false
      drawingRuntime.rendered = null
    }
  }, [data, layout, extraction, rendered, text, baked, camera, size])

  const buffer = useMemo(() => new Vector2(), [])
  const inverseSheet = useMemo(() => new Matrix4(), [])
  const look = useMemo(() => new Vector3(), [])
  const lamp = useMemo(() => new Vector3(0, 0, 0.2), [])

  useFrame((_, delta) => {
    const { reducedMotion, tier } = getQuality()
    const p = getScrollState().progress
    const intro = drawingIntroState(
      reducedMotion ? DRAWING_INTRO_WINDOW.releaseEnd * REDUCED_MOTION_INTRO_T : p,
      extraction.crossing,
    )
    const mode = ((window as unknown as Record<string, unknown>).__drawingProofMode as string | undefined) ?? 'normal'
    const proof = mode !== 'normal'
    const poseT = proof ? 0 : intro.poseT
    const minZ = applyExtraction(
      poseT,
      layout,
      extraction,
      drawingRuntime.modelMatrix,
      drawingRuntime.sheetMatrix,
    )
    if (group.current) {
      group.current.matrixAutoUpdate = false
      group.current.matrix.copy(drawingRuntime.sheetMatrix)
      // Opaque stock and its hole leave together through spatial motion after handoff.
      const retirement = proof || reducedMotion ? 0 : Math.max(0, Math.min(1, (p - 0.18) / 0.04))
      group.current.matrix.elements[13] -= 1.4 * retirement * retirement
      group.current.visible = p < 0.22 || proof || reducedMotion
    }

    // Ink schedule. Proof modes and reduced motion see the finished print.
    const reveal = uniforms.uReveal.value
    if (proof || reducedMotion) reveal.fill(1)
    else sheetReveal(intro.t, reveal)
    const edgesProof = mode === 'drawing-edges'
    if (edgesProof) {
      reveal.fill(0)
      reveal[GROUP.side] = 1
    }
    uniforms.uInk.value.copy(edgesProof ? INK_PROOF : INK_NAVY)
    const drawingProof = mode === 'drawing-mask' || edgesProof
    const modelProof = mode === 'model-mask' || mode === 'model-edges'
    meshes.paper.visible = !modelProof
    meshes.desk.visible = !proof
    lines.visible = !modelProof && mode !== 'drawing-mask'
    fills.visible = !proof
    text.object.visible = !proof
    meshes.mask.visible = mode === 'drawing-mask'
    meshes.edge.visible = !proof && intro.fracture > 0
    meshes.cracks.visible = !proof && !reducedMotion && intro.crackWeb > 0
    // Geometry is ready throughout the sheet lifetime; pulse/pressure only switch its light.
    meshes.portal.group.visible = !proof
    // Before pressure starts there is no aperture; avoid shading the covered deep shaft.
    meshes.portal.cap.visible = meshes.portal.walls.visible = !proof && intro.t >= INTRO_PHASES.bulgeStart
    const portalStrength = proof || reducedMotion ? 0 : Math.max(intro.crackGlow, intro.pressure * 0.75, intro.fracture * 0.68)
    const portalPulse = meshes.portal.update(intro.t, portalStrength, tier === 'lite', reducedMotion)
    for (let i = 0; i < meshes.fragments.length; i++) {
      const f = baked.fracture.fragments[i], mesh = meshes.fragments[i]
      const event = proof || reducedMotion ? 0 : Math.max(0, Math.min(1, ((intro.t - INTRO_PHASES.fractureStart) /
        (INTRO_PHASES.fractureEnd - INTRO_PHASES.fractureStart) - f.delay) / (1 - f.delay)))
      // Ballistic displacement with a fast initial impulse, deterministic in scroll.
      const flight = Math.pow(event, 0.72)
      mesh.position.set(f.center.x + f.velocity.x * flight, f.center.y + f.velocity.y * flight - 0.12 * flight * flight, 0.00002 + f.velocity.z * flight)
      mesh.rotation.set(f.spin.x * flight, f.spin.y * flight, f.spin.z * flight)
      mesh.visible = !modelProof && mode !== 'drawing-mask'
    }
    uniforms.uMode.value = drawingProof ? 1 : 0

    const contrast = proof ? 1 : intro.contrast
    const opacity = proof ? 1 : intro.drawingOpacity
    uniforms.uContrast.value = contrast
    uniforms.uOpacity.value = opacity
    const lampPower = proof || reducedMotion ? 1 : intro.lampPower
    uniforms.uLampPower.value = lampPower
    uniforms.uReadingPool.value = proof ? 0 : intro.readingPool
    const inkLight = proof ? 1 : 0.14 + 0.86 * lampPower
    uniforms.uInk.value.multiplyScalar(inkLight)
    // Faint printed notes share the ambient-lit stock rather than disappearing
    // when the practical goes out. Keep the lit hold exactly as before.
    text.update(reveal, opacity * (proof ? 1 : 0.88 + 0.12 * lampPower))
    uniforms.uPulseHead.value = intro.pulseHead
    uniforms.uPulse.value = proof || reducedMotion ? 0 : intro.pulse
    uniforms.uCrackGlow.value = proof || reducedMotion ? 0 : intro.crackGlow
    uniforms.uCrackWeb.value = proof || reducedMotion ? 0 : intro.crackWeb
    uniforms.uCrackGrowth.value = proof || reducedMotion ? 0 : intro.crackGrowth
    uniforms.uSpark.value = proof || reducedMotion ? 0 : intro.sparkAnticipation
    uniforms.uFracture.value = proof || reducedMotion ? 0 : intro.fracture
    uniforms.uWaveTime.value = intro.waveTime
    uniforms.uWaveEnabled.value = 0
    uniforms.uFlexAmplitude.value = paperFlexAmplitude(intro.t, poseT, extraction.crossing, tier, proof || reducedMotion)
    baked.stats.flexAmplitude = uniforms.uFlexAmplitude.value
    baked.stats.flexPeakDisplacement = uniforms.uFlexAmplitude.value * baked.stats.flexFieldPeak
    baked.stats.flexEnabled = uniforms.uFlexAmplitude.value > 0 ? 1 : 0
    const [contactStrength, contactRadius] = paperContactShadow(poseT, extraction.crossing, intro.pbr, tier, proof || reducedMotion)
    ;(uniforms.uContact.value as Vector2).set(contactStrength, contactRadius)
    // Legacy probe remains zero: no translucency participates in the breakthrough.
    uniforms.uVellum.value = paperVellum(poseT, extraction.crossing, intro.pbr, tier, proof || reducedMotion)
    baked.stats.vellum = uniforms.uVellum.value as number
    baked.stats.contactShadow = contactStrength
    baked.stats.contactRadius = contactRadius
    const sheetMatrix = drawingRuntime.sheetMatrix.elements
    baked.stats.flexNormalX = sheetMatrix[8]
    baked.stats.flexNormalY = sheetMatrix[9]
    baked.stats.flexNormalZ = sheetMatrix[10]
    meshes.pulse.visible = (uniforms.uCrackGlow.value as number) > 0
    baked.stats.fracture = intro.fracture
    baked.stats.openingClear = intro.openingClear
    baked.stats.fragmentCount = meshes.fragments.length
    baked.stats.fragmentThickness = baked.fracture.thickness
    baked.stats.fragmentArea = baked.fracture.fragmentArea
    baked.stats.holeArea = baked.fracture.area
    baked.stats.maxBoundaryDeviation = baked.fracture.maxBoundaryDeviation
    baked.stats.crackGlow = intro.crackGlow
    baked.stats.crackWeb = intro.crackWeb
    baked.stats.paperOpacity = 1
    baked.stats.modelBarrierSafe = intro.openingClear || intro.poseT <= 0.4 ? 1 : 0
    baked.stats.portalActive = meshes.portal.group.visible && (group.current?.visible ?? false) ? 1 : 0
    baked.stats.portalCapZ = meshes.portal.capZ
    baked.stats.portalMouthZ = meshes.portal.mouthZ
    baked.stats.portalDeskZ = meshes.desk.position.z
    baked.stats.portalCapBehindModel = meshes.portal.capZ < meshes.portal.initialModelBottom ? 1 : 0
    baked.stats.portalInitialModelBottom = meshes.portal.initialModelBottom
    baked.stats.portalProfilePoints = meshes.portal.profilePoints
    baked.stats.portalWallLevels = meshes.portal.wallLevels
    baked.stats.portalDepthWrite = 1
    baked.stats.portalDeskDiscard = 1
    baked.stats.portalPulse = portalPulse
    baked.stats.portalLight = uniforms.uPortalLight.value as number
    uniforms.uViewport.value.copy(gl.getDrawingBufferSize(buffer))

    // Reading lamp trails the camera's look-at point across the sheet.
    const goal = telemetry.camera.goal.target
    inverseSheet.copy(drawingRuntime.sheetMatrix).invert()
    look.set(goal[0], goal[1], goal[2]).applyMatrix4(inverseSheet)
    const reach = Math.min(0.32, Math.max(0.09, (telemetry.camera.sheetDistance || 0.4) * 0.55))
    const k = 1 - Math.exp(-3 * Math.min(delta, 0.1))
    lamp.x += (look.x - lamp.x) * k
    lamp.y += (look.y - lamp.y) * k
    lamp.z += (reach - lamp.z) * k
    uniforms.uLamp.value.copy(lamp)

    // Preallocated telemetry — mutate in place, never rebuild (repo rule).
    const t = telemetry.drawing
    t.lineOpacity = opacity
    t.edgeSource = 'Default.glb:vector-hlr+crease+silhouette'
    t.phase = intro.t
    t.poseT = poseT
    t.focus = proof || reducedMotion ? 1 : intro.focus
    t.pulseHead = intro.pulseHead
    t.crackGrowth = intro.crackGrowth
    t.sparkAnticipation = intro.sparkAnticipation
    t.pulse = intro.pulse
    t.pbr = intro.pbr
    t.illumination = intro.illumination
    t.travel = extraction.travel
    // Read the live relative transform so telemetry follows the pressure/rise pose law.
    inverseSheet.copy(drawingRuntime.sheetMatrix).invert().multiply(drawingRuntime.modelMatrix)
    t.localZ = inverseSheet.elements[14]
    t.minZ = minZ
    t.crossing = extraction.crossing
    t.contact[0] = extraction.contact.x
    t.contact[1] = extraction.contact.y
    t.contact[2] = extraction.contact.z
    t.waveTime = intro.waveTime
    t.waveEnabled = uniforms.uWaveEnabled.value
    t.pulseLuminance = (uniforms.uPulse.value as number) * (1 - lampPower)
    t.lightningLuminance = t.pulseLuminance
    t.lampPower = lampPower
    t.blackout = lampPower <= 0.03 ? 1 : 0
    t.readingPool = uniforms.uReadingPool.value as number
    t.bulgeDisplacement = baked.stats.flexPeakDisplacement
    t.inkLuminance = 0.2126 * uniforms.uInk.value.r + 0.7152 * uniforms.uInk.value.g + 0.0722 * uniforms.uInk.value.b
    t.profilePoints = rendered.profilePoints.length
    drawingRuntime.sheetMatrix.toArray(t.planeMatrix)
    drawingRuntime.modelMatrix.toArray(t.modelMatrix)
  }, -2)

  return (
    <group ref={group} name="engineering-drawing-plane-frame">
      <primitive object={meshes.desk} />
      <primitive object={meshes.paper} />
      <primitive object={meshes.portal.group} />
      {meshes.fragments.map(mesh => <primitive key={mesh.name} object={mesh} />)}
      <primitive object={meshes.edge} />
      <primitive object={meshes.cracks} />
      <primitive object={lines} />
      <primitive object={fills} />
      <primitive object={text.object} />
      <primitive object={meshes.pulse} />
      <primitive object={meshes.mask} />
    </group>
  )
}
