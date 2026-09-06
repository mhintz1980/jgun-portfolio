import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
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
  PRINT_TARGET_HEIGHT,
  PRINT_TARGET_WIDTH,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  type DrawingGeometry,
  type DrawingLayout,
  type RenderedDrawing,
  makeDrawingLayout,
  renderDrawing,
} from './drawingGeometry'
import {
  applyExtraction,
  drawingRuntime,
  relativePose,
  lowestVertex,
  solveExtraction,
  type Extraction,
} from './extractionPose'

/**
 * SHOCKWAVE (JG-026 Item 4).
 *
 * Caused by the model completely separating from the page — the trigger is the solved
 * crossing, never a phase boundary. Owner requirements: it must travel essentially the whole
 * way to the edge of the page, and it must resolve in a single pass with no lingering and no
 * repeats.
 *
 *   reach  0.78  — front radius at waveTime 1. The far sheet corner sits 0.71 m from the
 *                  contact point, so the front clears it before the wave window closes.
 *   0.075        — front width, ~1.3 wavelengths of the 110 rad/m carrier, so each point on
 *                  the sheet is crossed by one crest and one trough and nothing else.
 *   exp(-1.1 r)  — was exp(-8 r), which was dead by 0.30 m and never reached the border.
 *   exp(-1.4 t)  — keeps the pass decaying rather than ringing; combined with the moving
 *                  Gaussian it is a single pass by construction.
 *   0.022 m      — amplitude. 0.005 m on a 0.85 m sheet viewed obliquely was invisible.
 */
const wave = /* glsl */ `
uniform float uWaveTime; uniform float uWaveEnabled; uniform vec2 uOrigin;
float waveFront(vec2 p) {
 float r = length(p - uOrigin);
 // Starts as a ring already clear of the contact point rather than as a central blob.
 return exp(-pow((r - (0.06 + uWaveTime * 0.72)) / 0.075, 2.0)) * exp(-1.1 * r) * exp(-1.4 * uWaveTime);
}
float waveDisplacement(vec2 p) {
 float r = length(p - uOrigin);
 return uWaveEnabled * 0.022 * sin(110.0 * r - 34.0 * uWaveTime) * waveFront(p);
}`

const vertex = /* glsl */ `${wave}
varying vec2 vUv; varying vec2 vPlane;
void main(){
 vUv = uv; vPlane = position.xy;
 vec3 p = position;
 p.z += waveDisplacement(p.xy);
 gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const fragment = /* glsl */ `${wave}
uniform sampler2D uPrint,uAnnotations,uMask,uEdges;
uniform vec2 uTexel; uniform float uFocus,uContrast,uOpacity,uMode;
varying vec2 vUv; varying vec2 vPlane;
vec3 paper(vec2 uv) {
 vec4 a = texture2D(uAnnotations, uv);
 return mix(texture2D(uPrint, uv).rgb, a.rgb, a.a);
}
void main(){
 if(uMode > 1.5){ gl_FragColor = vec4(texture2D(uEdges, vUv).rgb, 1.0); return; }
 if(uMode > 0.5){ gl_FragColor = vec4(texture2D(uMask, vUv).rgb, 1.0); return; }
 float radius = (1.0 - uFocus) * 2.5;
 vec3 c = paper(vUv);
 if(radius > 0.01){
  c = vec3(0.0); float total = 0.0;
  for(int x = -2; x <= 2; x++) for(int y = -2; y <= 2; y++){
   float weight = exp(-float(x * x + y * y) * 0.35);
   c += paper(vUv + uTexel * vec2(float(x), float(y)) * radius) * weight;
   total += weight;
  }
  c /= total;
 }
 // The front also lights the paper it passes over. Displacement alone is invisible at the
 // oblique viewing angle the wave happens at.
 c += vec3(0.18, 0.55, 0.75) * uWaveEnabled * waveFront(vPlane) * 1.15;
 gl_FragColor = vec4(c * uContrast, uOpacity);
}`

/**
 * ORDERED EXCITATION (JG-026 Item 3).
 *
 * Runs on the traced profile of the PRIMARY SIDE ELEVATION — the same contour the model
 * lifts out of — and only after the focus rack has completed. Owner report: the previous
 * head (a 0.022 arc Gaussian on a hairline) was a ~20 px glint nobody could find.
 *
 *   head    0.045 arc Gaussian on a widened ribbon
 *   trail   real exponential tail, 0.055 arc decay length
 *   charged the traversed arc stays energised so the circuit visibly completes, which is
 *           what motivates the model activating
 *   flicker retained — the high-frequency component was the right idea
 */
const pulseVertex = /* glsl */ `${wave}
attribute float arcLength; varying float vArc;
void main(){
 vArc = arcLength;
 vec3 p = position;
 p.z += waveDisplacement(p.xy);
 gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const pulseFragment = /* glsl */ `
uniform float uPulseHead,uPulse,uPulseGain; varying float vArc;
void main(){
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

/** Additive gain on the excitation. Peak linear luminance is reported against the 0.6 bloom gate. */
const PULSE_GAIN = 6
/** Rec.709 luminance of the excitation hue, used for the JG-021 light-canon readout. */
const PULSE_HUE_LUMINANCE = 0.2126 * 0.3 + 0.7152 * 0.82 + 0.0722 * 1.0
/** head + trail + charged at the head, before gain. */
const PULSE_PEAK_AMOUNT = 1 + 0.55 + 0.22

export function DrawingLinework({ data }: { data: DrawingGeometry }) {
  const { gl, size } = useThree()
  const [prepared, setPrepared] = useState<{
    layout: DrawingLayout
    extraction: Extraction
    rendered: RenderedDrawing
  } | null>(null)

  useLayoutEffect(() => {
    const layout = makeDrawingLayout(size.width / size.height, data.bounds)
    const extraction = solveExtraction(data, layout)
    const rendered = renderDrawing(gl, data, layout, PRINT_TARGET_WIDTH, PRINT_TARGET_HEIGHT)
    setPrepared({ layout, extraction, rendered })
    return () => rendered.dispose()
  }, [gl, data, size.width, size.height])

  return prepared ? <DrawingPrint data={data} {...prepared} /> : null
}

function DrawingPrint({
  data,
  layout,
  extraction,
  rendered,
}: {
  data: DrawingGeometry
  layout: DrawingLayout
  extraction: Extraction
  rendered: RenderedDrawing
}) {
  const { size, camera } = useThree()
  const group = useRef<Group>(null)
  const plane = useRef<Mesh>(null)
  const empty = useMemo(() => new CanvasTexture(document.createElement('canvas')), [])
  const uniforms = useMemo(
    () => ({
      uPrint: { value: rendered.target.texture },
      uMask: { value: rendered.mask.texture },
      uAnnotations: { value: empty },
      uEdges: { value: rendered.edgeMask.texture },
      uTexel: { value: new Vector2(1 / rendered.target.width, 1 / rendered.target.height) },
      uFocus: { value: 1 },
      uContrast: { value: 1 },
      uOpacity: { value: 1 },
      uMode: { value: 0 },
      uWaveTime: { value: 0 },
      uWaveEnabled: { value: 0 },
      uOrigin: { value: new Vector2(extraction.contact.x, extraction.contact.y) },
      uPulseHead: { value: 0 },
      uPulse: { value: 0 },
      uPulseGain: { value: PULSE_GAIN },
    }),
    [rendered, extraction, empty],
  )
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: true,
        toneMapped: false,
      }),
    [uniforms],
  )
  const pulseMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: pulseVertex,
        fragmentShader: pulseFragment,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [uniforms],
  )
  const pulseMesh = useMemo(
    () => new Mesh(rendered.profileRibbon, pulseMaterial),
    [rendered, pulseMaterial],
  )

  useEffect(() => {
    let disposed = false
    drawingRuntime.layout = layout
    drawingRuntime.extraction = extraction
    drawingRuntime.rendered = rendered
    drawingRuntime.ready = true

    window.__drawingSvgReady = (source: string) => {
      const image = new Image()
      image.onload = () => {
        if (disposed) return
        const canvas = document.createElement('canvas')
        canvas.width = rendered.target.width
        canvas.height = rendered.target.height
        // The annotation sheet and the render target are the same rectangle now that the
        // plane IS the sheet — no letterboxing offset.
        canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
        if (uniforms.uAnnotations.value !== empty) uniforms.uAnnotations.value.dispose()
        uniforms.uAnnotations.value = new CanvasTexture(canvas)
        uniforms.uAnnotations.value.colorSpace = SRGBColorSpace
        telemetry.drawing.annotationsReady = true
      }
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
    }
    window.__drawingPrint = { data, layout }
    window.dispatchEvent(new Event('drawing-print'))

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
         * Registration error, in screen pixels.
         *
         * Both sides are projected through the SAME live camera. The expected point is where
         * the printed view puts the feature: project it with the drawing's own orthographic
         * view camera to get its position on the sheet, lift that sheet point into the world
         * with the sheet's current matrix, then look at it through the live camera. The actual
         * point is the live model's own vertex through the same camera. Comparing the two
         * cameras' NDC directly would be meaningless — the sheet fills 92% of the frame, not
         * 100%, so their extents differ by construction.
         */
        projectedFeatures: Object.entries(data.features).map(([id, p]) => {
          const onSheet = p.clone().applyMatrix4(layout.views[0].transform).project(layout.views[0].camera)
          const expected = new Vector3(
            (onSheet.x * layout.width) / 2,
            (onSheet.y * layout.height) / 2,
            0.0002,
          )
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
      material.dispose()
      pulseMaterial.dispose()
      if (uniforms.uAnnotations.value !== empty) uniforms.uAnnotations.value.dispose()
      drawingRuntime.ready = false
      drawingRuntime.rendered = null
    }
  }, [data, layout, extraction, rendered, material, pulseMaterial, uniforms, empty, camera, size])

  useEffect(() => () => empty.dispose(), [empty])

  useFrame(() => {
    const { reducedMotion, tier } = getQuality()
    const p = getScrollState().progress
    const intro = drawingIntroState(
      reducedMotion ? DRAWING_INTRO_WINDOW.releaseEnd * 0.2 : p,
      extraction.crossing,
    )
    const mode = (window as unknown as Record<string, unknown>).__drawingProofMode ?? 'normal'
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
    if (plane.current) plane.current.visible = mode !== 'model-mask' && mode !== 'model-edges'
    uniforms.uMode.value = mode === 'drawing-mask' ? 1 : mode === 'drawing-edges' ? 2 : 0
    uniforms.uPrint.value = rendered.target.texture
    uniforms.uFocus.value = proof || reducedMotion ? 1 : intro.focus
    uniforms.uContrast.value = proof ? 1 : intro.contrast
    uniforms.uOpacity.value = proof ? 1 : intro.drawingOpacity
    uniforms.uPulseHead.value = intro.pulseHead
    uniforms.uPulse.value = proof || reducedMotion ? 0 : intro.pulse
    uniforms.uWaveTime.value = intro.waveTime
    uniforms.uWaveEnabled.value =
      !proof && !reducedMotion && tier === 'full' && intro.waveActive > 0 ? 1 : 0
    pulseMesh.visible = uniforms.uPulse.value > 0

    // Preallocated telemetry — mutate in place, never rebuild (repo rule).
    const t = telemetry.drawing
    t.lineOpacity = intro.drawingOpacity
    t.edgeSource = 'Default.glb:orthographic-depth+crease+silhouette'
    t.phase = intro.t
    t.poseT = poseT
    t.focus = uniforms.uFocus.value
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
    t.pulseLuminance = uniforms.uPulse.value * PULSE_PEAK_AMOUNT * PULSE_GAIN * PULSE_HUE_LUMINANCE
    t.profilePoints = rendered.profilePoints.length
    drawingRuntime.sheetMatrix.toArray(t.planeMatrix)
    drawingRuntime.modelMatrix.toArray(t.modelMatrix)
  }, -2)

  return (
    <group ref={group} name="engineering-drawing-plane-frame">
      <mesh ref={plane} name="engineering-drawing-Z0" material={material}>
        <planeGeometry args={[SHEET_WIDTH, SHEET_HEIGHT, 128, 96]} />
      </mesh>
      <primitive object={pulseMesh} />
    </group>
  )
}
