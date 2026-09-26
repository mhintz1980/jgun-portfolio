import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
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
} from 'three'
import { degradeQuality, forcePoster, getQuality } from '../../state/qualityStore'
import { getScrollState, setScrollState, telemetry } from '../../state/scrollStore'
import {
  DRAWING_INTRO_WINDOW,
  drawingIntroState,
  pacedProgress,
  rawScrollFor,
} from './introTimeline'
import {
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
  drawingRuntime,
  relativePose,
  lowestVertex,
  solveExtraction,
  type Extraction,
} from './extractionPose'
import { sheetReveal } from './sheetCamera'
import { composeSheet } from './sheet/composeSheet'
import { GROUP, WAVE_GLSL, makeInkFills, makeInkLines, makeSheetUniforms, type SheetUniforms } from './sheet/ink'
import { bakeProfile } from './sheet/profile'
import { makeSheetText, type SheetTextLayer } from './sheet/sheetText'

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
varying vec2 vPlane;
void main() {
  vPlane = position.xy;
  vec3 p = position;
  p.z += waveDisplacement(p.xy) * uDisplace;
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
uniform sampler2D uGrain;
uniform vec3 uPaper; uniform vec3 uGrid;
uniform vec4 uFrame; uniform vec2 uSheetHalf;
uniform vec3 uKey; uniform vec3 uLamp;
uniform float uContrast; uniform float uOpacity; uniform float uMode;
varying vec2 vPlane;
float gridLine(float coord, float spacing, float hw) {
  float fw = max(fwidth(coord), 1e-7);
  float d = abs(fract(coord / spacing - 0.5) - 0.5) * spacing;
  float hwEff = max(hw, 0.5 * fw);
  return clamp((hwEff - d) / fw + 0.5, 0.0, 1.0) * min(1.0, hw / (0.5 * fw));
}
void main() {
  if (uMode > 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 p = vPlane;
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
  float light = 0.64 + 0.34 * key + 0.1 * pool;
  c *= light * mix(vec3(1.0), vec3(1.05, 1.0, 0.9), key);
  // The shockwave lights the paper it passes over.
  c += vec3(0.18, 0.55, 0.75) * uWaveEnabled * waveFront(p) * 1.15;
  gl_FragColor = vec4(c * uContrast, uOpacity);
}`

/**
 * Walnut desk: dark figured grain running along the sheet's long axis, lit by the same lamp,
 * with the sheet's soft contact shadow. Fades to transparent well before its edge so it
 * dissolves into the scene's dark backdrop at every framing.
 */
const deskFragment = /* glsl */ `
${NOISE_GLSL}
uniform vec3 uKey; uniform vec2 uSheetHalf;
uniform float uContrast; uniform float uOpacity; uniform float uMode;
varying vec2 vPlane;
void main() {
  if (uMode > 0.5) discard;
  vec2 p = vPlane;
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
  vec3 c = wood * (0.22 + 1.9 * key) + vec3(0.05, 0.032, 0.02) * sheen;
  // Contact shadow of the sheet, thrown away from the lamp.
  vec2 o = normalize(uKey.xy) * -0.007;
  vec2 q = abs(p - o) - uSheetHalf;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  c *= 1.0 - 0.72 * (1.0 - smoothstep(-0.002, 0.03, sd));
  float r = length(p * vec2(0.62, 0.95));
  float fade = 1.0 - smoothstep(0.42, 1.05, r);
  gl_FragColor = vec4(c * uContrast, fade * uOpacity);
}`

/**
 * ORDERED EXCITATION (JG-026 Item 3) — unchanged behaviour: a head, an exponential trail and
 * a charged wake running the primary elevation's traced profile.
 */
const pulseVertex = /* glsl */ `
${WAVE_GLSL}
attribute float arcLength; varying float vArc;
void main() {
  vArc = arcLength;
  vec3 p = position;
  p.z += waveDisplacement(p.xy);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const pulseFragment = /* glsl */ `
uniform float uPulseHead; uniform float uPulse; uniform float uPulseGain; varying float vArc;
void main() {
  float d = vArc - uPulseHead;
  float head = exp(-pow(d / 0.045, 2.0));
  float trail = exp(-max(0.0, -d) / 0.055) * 0.55;
  float charged = step(0.0, -d) * 0.22;
  float flicker = 0.9 + 0.1 * sin(uPulseHead * 1700.0);
  float amount = (head + trail + charged) * flicker;
  gl_FragColor = vec4(vec3(0.30, 0.82, 1.0) * amount * uPulseGain, uPulse * min(1.0, amount));
}`

interface ScrollToApi {
  scrollTo?: (target: number, options?: { immediate?: boolean; force?: boolean }) => void
}

declare global {
  interface Window {
    __sheetStats?: Record<string, number>
  }
}

/** Additive gain on the excitation. Peak linear luminance is reported against the 0.6 bloom gate. */
const PULSE_GAIN = 6
/** Rec.709 luminance of the excitation hue, used for the JG-021 light canon readout. */
const PULSE_HUE_LUMINANCE = 0.2126 * 0.3 + 0.7152 * 0.82 + 0.0722 * 1.0
/** head + trail + charged at the head, before gain. */
const PULSE_PEAK_AMOUNT = 1 + 0.55 + 0.22
/** Fixed warm key: off the sheet's top-left corner, sheet-plane metres (x, y, radius). */
const KEY_LAMP = new Vector3(-0.16, 0.2, 0.62)
const INK_NAVY = new Color()
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
}

export function DrawingLinework({ data }: { data: DrawingGeometry }) {
  const { gl } = useThree()
  const [baked, setBaked] = useState<BakedSheet | null>(null)

  // JG-034: the sheet is baked once per model, never per viewport. The old layout was
  // re-derived from a transient R3F size at mount and nothing re-fitted it until a resize.
  useLayoutEffect(() => {
    const started = performance.now()
    const layout = makeDrawingLayout(1, data.bounds)
    const extraction = solveExtraction(data, layout)
    const extractMs = performance.now() - started
    const composed = composeSheet(gl, data, layout)
    const rendered = bakeProfile(gl, data, layout)
    const uniforms = makeSheetUniforms()
    INK_NAVY.copy(uniforms.uInk.value)
    uniforms.uOrigin.value.set(extraction.contact.x, extraction.contact.y)
    const lines = makeInkLines(composed.ink, uniforms)
    const fills = makeInkFills(composed.ink, uniforms)
    const text = makeSheetText(composed.ink.texts)
    const stats = { ...composed.stats, extractMs, bakeMs: performance.now() - started }
    window.__sheetStats = stats
    setBaked({ layout, extraction, rendered, uniforms, lines, fills, text, stats })
    return () => {
      rendered.dispose()
      lines.geometry.dispose()
      ;(lines.material as ShaderMaterial).dispose()
      fills.geometry.dispose()
      ;(fills.material as ShaderMaterial).dispose()
      text.dispose()
    }
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
      uPulseGain: { value: PULSE_GAIN },
    })
    const paper = new ShaderMaterial({
      uniforms,
      vertexShader: planeVertex,
      fragmentShader: paperFragment,
      transparent: true,
      depthWrite: true,
      toneMapped: false,
    })
    const desk = new ShaderMaterial({
      uniforms,
      vertexShader: planeVertex,
      fragmentShader: deskFragment,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
    const pulse = new ShaderMaterial({
      uniforms,
      vertexShader: pulseVertex,
      fragmentShader: pulseFragment,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      toneMapped: false,
    })
    return { paper, desk, pulse }
  }, [uniforms, grain])

  const meshes = useMemo(() => {
    const paper = new Mesh(new PlaneGeometry(SHEET_WIDTH, SHEET_HEIGHT, 160, 100), materials.paper)
    paper.name = 'engineering-drawing-Z0'
    paper.renderOrder = 1
    const desk = new Mesh(new PlaneGeometry(DESK.width, DESK.height, 1, 1), materials.desk)
    desk.name = 'drafting-desk'
    desk.position.z = -0.0016
    desk.renderOrder = -1
    desk.frustumCulled = false
    const pulse = new Mesh(rendered.profileRibbon, materials.pulse)
    pulse.renderOrder = 4
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
    return { paper, desk, pulse, mask }
  }, [materials, rendered, layout, data])

  useEffect(
    () => () => {
      meshes.paper.geometry.dispose()
      meshes.desk.geometry.dispose()
      ;(meshes.mask.material as MeshBasicMaterial).dispose()
      materials.paper.dispose()
      materials.desk.dispose()
      materials.pulse.dispose()
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
        if (tier === 'lite' && getQuality().tier === 'full') degradeQuality()
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
          relativePose(extraction.crossing, layout, extraction.travel, extraction.initialZ, new Matrix4()),
        ).toArray(),
      }),
      captureContact: (t: number) => ({
        t,
        point: lowestVertex(
          data,
          relativePose(t, layout, extraction.travel, extraction.initialZ, new Matrix4()),
        ).toArray(),
        rippleOrigin: extraction.contact.toArray(),
      }),
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
      reducedMotion ? DRAWING_INTRO_WINDOW.releaseEnd * 0.2 : p,
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
      group.current.visible = intro.t < 1 || proof || reducedMotion
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
    uniforms.uMode.value = drawingProof ? 1 : 0

    const contrast = proof ? 1 : intro.contrast
    const opacity = proof ? 1 : intro.drawingOpacity
    uniforms.uContrast.value = contrast
    uniforms.uOpacity.value = opacity
    text.update(reveal, opacity)
    uniforms.uPulseHead.value = intro.pulseHead
    uniforms.uPulse.value = proof || reducedMotion ? 0 : intro.pulse
    uniforms.uWaveTime.value = intro.waveTime
    uniforms.uWaveEnabled.value =
      !proof && !reducedMotion && tier === 'full' && intro.waveActive > 0 ? 1 : 0
    meshes.pulse.visible = (uniforms.uPulse.value as number) > 0
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
    t.pulse = intro.pulse
    t.pbr = intro.pbr
    t.travel = extraction.travel
    t.localZ = extraction.initialZ + extraction.travel * Math.pow(Math.max(0, (poseT - 0.4) / 0.6), 4)
    t.minZ = minZ
    t.crossing = extraction.crossing
    t.contact[0] = extraction.contact.x
    t.contact[1] = extraction.contact.y
    t.contact[2] = extraction.contact.z
    t.waveTime = intro.waveTime
    t.waveEnabled = uniforms.uWaveEnabled.value
    t.pulseLuminance = (uniforms.uPulse.value as number) * PULSE_PEAK_AMOUNT * PULSE_GAIN * PULSE_HUE_LUMINANCE
    t.profilePoints = rendered.profilePoints.length
    drawingRuntime.sheetMatrix.toArray(t.planeMatrix)
    drawingRuntime.modelMatrix.toArray(t.modelMatrix)
  }, -2)

  return (
    <group ref={group} name="engineering-drawing-plane-frame">
      <primitive object={meshes.desk} />
      <primitive object={meshes.paper} />
      <primitive object={lines} />
      <primitive object={fills} />
      <primitive object={text.object} />
      <primitive object={meshes.pulse} />
      <primitive object={meshes.mask} />
    </group>
  )
}
