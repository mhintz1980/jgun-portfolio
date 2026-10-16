/**
 * JG-038 private sheet presentation. Borrows the bake and host pose; owns only
 * presentation resources. Shader/fragment laws copied from DrawingPrint.
 */
import {
  Color, DoubleSide, Group, Matrix4, Mesh, PlaneGeometry, ShaderMaterial, WebGLRenderTarget,
  Vector2, Vector3, Vector4,
  type BufferGeometry, type ShaderMaterialParameters, type Texture, type WebGLRenderer, type Camera,
} from 'three'
import { INK, PAPER, SHEET_HEIGHT, SHEET_WIDTH, SHEET_ZONES, makePaperGrainTexture } from '../drawing/drawingGeometry'
import { INTRO_PHASES, type IntroState } from '../drawing/introTimeline'
import type { ExtractionContext } from '../drawing/poseCore'
import type { SheetBakeResult, SheetBakeTier } from '../drawing/sheet/sheetBake'
import { sheetReveal } from '../drawing/sheetCamera'
import { GROUP, INK_GRAPHITE, INK_RED, WAVE_GLSL } from '../drawing/sheet/ink'
import { paperContactShadow, paperFlexAmplitude, paperVellum } from '../drawing/sheet/paperFlex'
import { LIGHTNING_VERTEX, makeLightningRibbon } from '../drawing/sheet/lightning'
import { CRACK_APERTURE_GLSL, makeCrackMask } from '../drawing/sheet/breakthrough'
import { capturePortalPixels, makePortal, PORTAL_DESK_Z, PORTAL_PROFILE_GLSL } from '../drawing/sheet/portal'
import { makePrivatePitGeometry } from './PitGeometry'
import { configurePrivatePitMaterial } from './privatePitMaterial'
import { samplePit } from './PitDirector'
import { samplePrivateElectrical } from './ElectricalDirector'
import { makePrivateCrackGeometry } from './privateElectricGeometry'

const PRIVATE_LIGHTNING_VERTEX = LIGHTNING_VERTEX.replace('jag * 0.00006', 'jag * 0.00085')

const PRIVATE_LIGHTNING_FRAGMENT = /* glsl */ `
uniform float uPulseHead; uniform float uCrackGlow; uniform float uElectricalEnergy;
uniform float uFracture; uniform float uSpark;
varying float vArc; varying float vAcross;
void main() {
  float cell = floor(vArc * 211.0);
  float a = fract(sin(cell * 127.1) * 43758.5453) - .5;
  float b = fract(sin((cell + 1.0) * 127.1) * 43758.5453) - .5;
  float jag = mix(a, b, fract(vArc * 211.0)) * .65;
  float d = abs(vAcross - jag);
  float aa = max(fwidth(vAcross), .015);
  float core = 1.0 - smoothstep(.045, .045 + aa, d);
  float halo = exp(-d * d * 9.0) * .48;
  float fork = abs(vAcross - jag - sin(vArc * 593.0) * .5);
  float branch = (1.0 - smoothstep(.015, .015 + aa, fork))
    * smoothstep(.68, .92, sin(vArc * 317.0));
  float head = exp(-pow((vArc - uPulseHead) / .018, 2.0));
  float grown = 1.0 - smoothstep(uPulseHead, uPulseHead + .009, vArc);
  float spark = uSpark * (1.0 - smoothstep(.002, .012, vArc));
  float energy = uElectricalEnergy * (grown * .72 + head * .7);
  float retirement = 1.0 - smoothstep(.15, .9, uFracture);
  float alpha = clamp((core + halo + branch * .55) * (energy + spark) * uCrackGlow * retirement, 0.0, 1.0);
  gl_FragColor = vec4(mix(vec3(.12, .43, 1.0), vec3(.79, .94, 1.0), core), alpha);
}`

// Crystal-thin fissures develop under the electrical front, then extinguish as
// separated stock begins to fall. Existing crack masks retain exact shard seams.
const PRIVATE_CRACK_FRAGMENT = PRIVATE_LIGHTNING_FRAGMENT
  .replace(/uPulseHead/g, 'uCrackGrowth').replace(/uCrackGlow/g, 'uCrackWeb')
  .replace('jag = mix(a, b, fract(vArc * 211.0)) * .65', 'jag = mix(a, b, fract(vArc * 211.0)) * .22')

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
uniform float uFragment; uniform float uFracture;
uniform vec2 uFragmentCenter;
varying vec2 vPlane;
varying float vFront;
varying vec3 vFacetNormal;
varying vec3 vViewDirection;
void main() {
  vPlane = position.xy + uFragmentCenter;
  vFront = normal.z;
  vec3 p = position;
  // Departing pieces develop a bevel-thick edge; intact drafting stays flat.
  p.z *= 1.0 + uFragment * smoothstep(0.0, .15, uFracture) * 4.0;
  p.z += paperDisplacement(vPlane) * uDisplace;
  vFacetNormal = normalize(normalMatrix * normal);
  vViewDirection = -(modelViewMatrix * vec4(p, 1.0)).xyz;
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
varying vec3 vFacetNormal;
varying vec3 vViewDirection;
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
  vec3 ambient = vec3(0.19, 0.205, 0.23) * (1.0 - uLampPower);
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
    vec3 n = normalize(vFacetNormal), view = normalize(vViewDirection);
    float fresnel = pow(1.0 - abs(dot(n, view)), 3.0);
    float reflection = pow(max(0.0, dot(reflect(-view, n), normalize(vec3(-.4, .7, 1.0)))), 36.0);
    vec3 glass = vec3(.013, .025, .041) + vec3(.08, .15, .22) * fresnel
      + vec3(.38, .58, .72) * reflection;
    glass *= 1.0 - ink * .48;
    if (abs(vFront) < .5) glass += vec3(.08, .19, .27) * (.35 + fresnel);
    c = mix(c, glass, smoothstep(0.0, .11, uFracture));
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
    * mix(vec3(0.22, 0.25, 0.31), vec3(1.0), uLampPower);
  // Contact shadow of the sheet, thrown away from the lamp.
  vec2 o = normalize(uKey.xy) * -0.007;
  vec2 q = abs(p - o) - uSheetHalf;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  c *= 1.0 - 0.72 * (1.0 - smoothstep(-0.002, 0.03, sd));
  float r = length(p * vec2(0.62, 0.95));
  float fade = 1.0 - smoothstep(0.42, 1.05, r);
  gl_FragColor = vec4(c * uContrast, fade);
}`

export interface DrawingFrameInput {
  intro: IntroState
  tier: SheetBakeTier
  reducedMotion: boolean
  /** Current private interface supports normal and drawing-edges only. */
  proofMode: string
  retirement: number
  /** Shared camera-arrival/isolation fade; pit follows the surrounding assembly. */
  surroundingsOpacity?: number
  cameraLookTargetWorld: Vector3 | null
  cameraSheetDistance: number
  delta: number
}

export interface PrivateSheetRuntime {
  readonly group: Group
  /** Page-local presentation probes, published into the host-owned bake stats. */
  readonly stats: Record<string, number>
  pitInputs(): { outline: number[][]; ringDepthsM: readonly number[]; positions: number[]; indices: number[] }
  captureEffects(gl: WebGLRenderer, camera: Camera): ReturnType<typeof capturePortalPixels>
  captureElectricity(gl: WebGLRenderer, camera: Camera): unknown
  pitGeometryAb(gl: WebGLRenderer, camera: Camera, candidate: number[]): unknown
  apply(frame: DrawingFrameInput, context: ExtractionContext, viewport: Vector2): void
  dispose(): void
}

/** CPU fault fixtures replace allocation boundaries, never shader/frame behavior. */
export interface PrivateSheetFactories {
  grain(): Texture
  desk(): BufferGeometry
  ribbon(points: number[][]): BufferGeometry
  material(parameters: ShaderMaterialParameters): ShaderMaterial
  portal: typeof makePortal
}

const DEFAULT_FACTORIES: PrivateSheetFactories = {
  grain: makePaperGrainTexture,
  desk: () => new PlaneGeometry(3.4, 2.4, 1, 1),
  ribbon: makeLightningRibbon,
  material: parameters => new ShaderMaterial(parameters),
  portal: (outline, bottom, center, light) => makePortal(outline, bottom, center, light, makePrivatePitGeometry,
    { fissureEnergy: { value: 0 }, fissureGrowth: { value: 0 }, rocky: true }),
}

export function createPrivateSheetRuntime(
  baked: SheetBakeResult,
  onCleanupFailure: (errors: readonly unknown[]) => void,
  factories: PrivateSheetFactories = DEFAULT_FACTORIES,
): PrivateSheetRuntime {
  const { layout, extraction, uniforms: u, lines, fills, text } = baked
  const group = new Group()
  group.name = 'private-engineering-drawing-plane-frame'
  group.matrixAutoUpdate = false
  group.visible = false // The first explicit frame establishes the composition.
  const cleanups: Array<() => void> = []
  const owned = new Set<object>()
  let disposed = false
  const own = <T extends { dispose(): void }>(resource: T): T => {
    if (!owned.has(resource)) {
      owned.add(resource)
      cleanups.push(() => resource.dispose())
    }
    return resource
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    group.visible = false
    const errors: unknown[] = []
    for (let i = cleanups.length - 1; i >= 0; i--) {
      try { cleanups[i]() } catch (error) { errors.push(error) }
    }
    cleanups.length = 0
    owned.clear()
    try { onCleanupFailure(Object.freeze(errors)) } catch { /* Keep the primary error. */ }
  }
  cleanups.push(() => group.clear())
  // Detach, never dispose, borrowed meshes/text. Restore their previous parent.
  for (const object of [lines, fills, text.object]) {
    const parent = object.parent
    cleanups.push(() => {
      if (object.parent === group) {
        group.remove(object)
        parent?.add(object)
      }
    })
  }
  cleanups.push(() => group.removeFromParent())
  try {
    const grain = own(factories.grain())
    const decorate = (key: string, value: unknown) => {
      const previous = u[key]
      const entry = { value }
      u[key] = entry
      cleanups.push(() => {
        // A later owner may have replaced the binding: do not overwrite it.
        if (u[key] !== entry) return
        if (previous) u[key] = previous
        else delete u[key]
      })
    }
    decorate('uGrain', grain)
    decorate('uPaper', new Color(PAPER))
    decorate('uGrid', new Color('#7fa7c4'))
    decorate('uFrame', new Vector4(SHEET_ZONES.frame.x, SHEET_ZONES.frame.y, SHEET_ZONES.frame.w, SHEET_ZONES.frame.h))
    decorate('uSheetHalf', new Vector2(SHEET_WIDTH / 2, SHEET_HEIGHT / 2))
    decorate('uKey', new Vector3(-0.16, 0.2, 0.62))
    for (const [key, value] of Object.entries({
      uContrast: 1, uMode: 0, uDisplace: 1, uPulseHead: 0, uPulse: 0,
      uLampPower: 1, uReadingPool: 1, uFragment: 0, uCrackGlow: 0,
      uCrackWeb: 0, uCrackGrowth: 0, uSpark: 0,
      uElectricalEnergy: 0,
    })) decorate(key, value)
    decorate('uFragmentCenter', new Vector2())
    decorate('uFragmentPrint', baked.fragmentPrint)
    decorate('uCrackMask', baked.crackMask)

    const material = (parameters: ShaderMaterialParameters) => own(factories.material(parameters))
    const paperMaterial = material({
      uniforms: u, vertexShader: planeVertex, fragmentShader: paperFragment,
      side: DoubleSide, depthWrite: true, transparent: false, toneMapped: false,
    })
    const deskMaterial = material({
      uniforms: u, vertexShader: planeVertex.replace('p.z += paperDisplacement(vPlane) * uDisplace;', ''),
      fragmentShader: deskFragment, transparent: true, depthWrite: false, toneMapped: false,
    })
    const pulseMaterial = material({
      uniforms: u, vertexShader: WAVE_GLSL + PRIVATE_LIGHTNING_VERTEX, fragmentShader: PRIVATE_LIGHTNING_FRAGMENT,
      transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false,
    })
    const cracksMaterial = material({
      uniforms: u, vertexShader: WAVE_GLSL + LIGHTNING_VERTEX,
      fragmentShader: PRIVATE_CRACK_FRAGMENT,
      transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false,
    })
    const edgeMaterial = material({
      uniforms: u, vertexShader: planeVertex,
      fragmentShader: 'uniform float uLampPower; varying vec2 vPlane; ' + PORTAL_PROFILE_GLSL
        + 'void main(){ gl_FragColor=vec4(vec3(0.012,0.006,0.003)*(0.3+uLampPower)'
        + '+vec3(0.21,0.45,0.76)*portalRim(vPlane)*uPortalLight*0.18,1.0); }',
      side: DoubleSide, toneMapped: false,
    })
    const paper = new Mesh(baked.fracture.paper, paperMaterial)
    paper.name = 'engineering-drawing-Z0'; paper.renderOrder = 1
    const desk = new Mesh(own(factories.desk()), deskMaterial)
    desk.name = 'drafting-desk'; desk.position.z = PORTAL_DESK_Z
    desk.renderOrder = -1; desk.frustumCulled = false
    const pulse = new Mesh(own(factories.ribbon(baked.rendered.profilePoints)), pulseMaterial)
    pulse.name = 'lightning'; pulse.renderOrder = 4; pulse.frustumCulled = false
    const edge = new Mesh(baked.fracture.edge, edgeMaterial)
    edge.name = 'charred-profile-edge'; edge.renderOrder = 2; edge.frustumCulled = false
    const cracks = new Mesh(own(makePrivateCrackGeometry(baked.fracture.cracks, baked.fracture.outline)), cracksMaterial)
    // Match the physical hairline apertures to the private connected growth map.
    // Empty CPU fixtures have no ribbon attributes and retain their borrowed mask.
    if (cracks.geometry.getAttribute('position') && cracks.geometry.getAttribute('arcLength')) {
      decorate('uCrackMask', own(makeCrackMask(baked.rendered.profilePoints, cracks.geometry, SHEET_WIDTH, SHEET_HEIGHT)))
    }
    cracks.name = 'pressure-crack-web'; cracks.renderOrder = 4; cracks.frustumCulled = false
    const fragments = baked.fracture.fragments.map((fragment, i) => {
      const mesh = new Mesh(fragment.geometry, material({
        uniforms: { ...u, uFragmentCenter: { value: fragment.center }, uFragment: { value: 1 } },
        vertexShader: planeVertex, fragmentShader: paperFragment,
        side: DoubleSide, toneMapped: false,
      }))
      mesh.name = 'paper-fragment-' + i; mesh.renderOrder = 1; mesh.frustumCulled = false
      mesh.position.set(fragment.center.x, fragment.center.y, 0)
      return mesh
    })
    // solveExtraction: clearanceTravel = -(side.min.z + initialZ) + 0.0006.
    // Recover the same bound as DrawingPrint without borrowing the CAD snapshot.
    const initialModelBottom = 0.0006 - extraction.clearanceTravel
    const portal = factories.portal(baked.fracture.outline, initialModelBottom,
      new Vector2(layout.primaryCenter.x, layout.primaryCenter.y), u.uPortalLight as { value: number })
    // Private faceted rock and fissures; shared portal shaders stay unchanged.
    for (const mesh of [portal.walls, portal.cap]) {
      configurePrivatePitMaterial(mesh.material as ShaderMaterial)
    }
    // Register each returned portal resource separately: a throwing dispose listener
    // must not prevent cleanup of its other geometry/material/light resources.
    own(portal.walls.geometry); own(portal.cap.geometry)
    for (const mesh of [portal.walls, portal.cap]) {
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) own(m)
    }
    own(portal.light)
    group.add(desk, paper, portal.group, ...fragments, edge, cracks, lines, fills, text.object, pulse)

    const inverseSheet = new Matrix4()
    const look = new Vector3()
    const lamp = new Vector3(0, 0, 0.2)
    let lampSeeded = false
    const navy = new Color(INK)
    const white = new Color(1, 1, 1)
    const stats = baked.stats
    stats.annotationsReady = 0
    stats.annotationsFailed = 0
    let readinessError: unknown
    let readinessFailed = false
    void text.ready.then(() => {
      if (!disposed) stats.annotationsReady = 1
    }, error => {
      if (disposed) return
      readinessFailed = true; readinessError = error
      stats.annotationsFailed = 1
    })

    return {
      group, stats, dispose,
      pitInputs: () => ({ outline: baked.fracture.outline, ringDepthsM: portal.ringDepthsM,
        positions: Array.from(portal.walls.geometry.getAttribute('position').array),
        indices: Array.from(portal.walls.geometry.index!.array) }),
      captureEffects: (gl, camera) => capturePortalPixels({ gl, camera, sheet: group,
        outline: baked.fracture.outline, portal, desk, paper, fragments, edge, modelRootName: 'private-wrench-world' }),
      captureElectricity(gl, camera) {
        const priorTarget = gl.getRenderTarget(), priorCamera = camera.matrixWorld.clone()
        const profileVisible = pulse.visible, interiorVisible = cracks.visible
        const fissure = (portal.walls.material as ShaderMaterial).uniforms.uPortalFissureEnergy
        const energy = fissure.value
        const width = 640, height = Math.max(1, Math.round(width * gl.domElement.height / gl.domElement.width))
        const target = new WebGLRenderTarget(width, height)
        let root = group
        while (root.parent) root = root.parent as Group
        const read = () => {
          const pixels = new Uint8Array(width * height * 4)
          gl.setRenderTarget(target); gl.render(root, camera)
          gl.readRenderTargetPixels(target, 0, 0, width, height, pixels)
          return pixels
        }
        const difference = (a: Uint8Array, b: Uint8Array) => {
          let count = 0
          for (let i = 0; i < a.length; i += 4) if ([0, 1, 2].some(c => Math.abs(a[i + c] - b[i + c]) > 2)) count++
          return count
        }
        try {
          root.updateMatrixWorld(true)
          const normal = read(), control = read()
          pulse.visible = false; const noProfile = read(); pulse.visible = profileVisible
          cracks.visible = false; const noInterior = read(); cracks.visible = interiorVisible
          fissure.value = 0; const noFissure = read(); fissure.value = energy
          const restored = read()
          return { width, height, profileChangedPixels: difference(normal, noProfile),
            interiorChangedPixels: difference(normal, noInterior), pitFissureChangedPixels: difference(normal, noFissure),
            controlChangedPixels: difference(normal, control), restoredChangedPixels: difference(normal, restored),
            fixedCamera: priorCamera.equals(camera.matrixWorld), threshold8Bit: 2 }
        } finally {
          pulse.visible = profileVisible; cracks.visible = interiorVisible; fissure.value = energy
          gl.setRenderTarget(priorTarget); target.dispose()
        }
      },
      pitGeometryAb(gl, camera, candidate) {
        const attribute = portal.walls.geometry.getAttribute('position')
        if (candidate.length !== attribute.array.length || !candidate.every(Number.isFinite)) {
          throw new RangeError('Pit A/B requires finite matched vertex positions')
        }
        const original = Float32Array.from(attribute.array)
        const priorTarget = gl.getRenderTarget()
        const priorCamera = camera.matrixWorld.clone()
        const width = 640, height = Math.max(1, Math.round(width * gl.domElement.height / gl.domElement.width))
        const target = new WebGLRenderTarget(width, height)
        let root = group
        while (root.parent) root = root.parent as Group
        const read = () => {
          const pixels = new Uint8Array(width * height * 4)
          gl.setRenderTarget(target); gl.render(root, camera)
          gl.readRenderTargetPixels(target, 0, 0, width, height, pixels)
          return pixels
        }
        try {
          root.updateMatrixWorld(true)
          const controlA = read(), controlB = read()
          attribute.array.set(candidate); attribute.needsUpdate = true
          const recovered = read()
          attribute.array.set(original); attribute.needsUpdate = true
          const restored = read()
          let changedPixels = 0, controlChangedPixels = 0, restoredChangedPixels = 0, maxChannelDelta = 0, maxVertexDeltaM = 0
          for (let i = 0; i < original.length; i += 3) maxVertexDeltaM = Math.max(maxVertexDeltaM,
            Math.hypot(original[i] - candidate[i], original[i + 1] - candidate[i + 1], original[i + 2] - candidate[i + 2]))
          for (let i = 0; i < controlA.length; i += 4) {
            const delta = Math.max(...[0, 1, 2].map(c => Math.abs(controlA[i + c] - recovered[i + c])))
            const noise = Math.max(...[0, 1, 2].map(c => Math.abs(controlA[i + c] - controlB[i + c])))
            if (delta > 2) changedPixels++
            if (noise > 2) controlChangedPixels++
            if ([0, 1, 2].some(c => Math.abs(controlA[i + c] - restored[i + c]) > 2)) restoredChangedPixels++
            maxChannelDelta = Math.max(maxChannelDelta, delta)
          }
          return { width, height, changedPixels, controlChangedPixels, restoredChangedPixels, maxChannelDelta, maxVertexDeltaM,
            cameraUnchanged: priorCamera.equals(camera.matrixWorld), wallVisible: portal.walls.visible && portal.group.visible && group.visible,
            isolatedVariable: 'wall-position-attribute-only', threshold8Bit: 2 }
        } finally {
          attribute.array.set(original); attribute.needsUpdate = true
          gl.setRenderTarget(priorTarget); target.dispose()
        }
      },
      apply(frame, context, viewport) {
        if (disposed) throw new Error('Private sheet presentation is disposed')
        if (frame.proofMode !== 'normal' && frame.proofMode !== 'drawing-edges') {
          throw new RangeError('Unsupported private sheet proofMode: ' + frame.proofMode)
        }
        if (readinessFailed) throw readinessError
        if (!Number.isFinite(frame.delta) || !Number.isFinite(frame.retirement)
          || !Number.isFinite(frame.cameraSheetDistance)) throw new RangeError('Private sheet frame inputs must be finite')
        const { intro, tier, reducedMotion } = frame
        const pit = samplePit(intro.t, intro.fracture)
        const electricity = samplePrivateElectrical(intro.t, intro.fracture)
        const proof = frame.proofMode === 'drawing-edges'
        const poseT = proof ? 0 : intro.poseT
        const retirement = proof || reducedMotion ? 0 : Math.max(0, Math.min(1, frame.retirement))
        // Consume host matrices; never recompute or modify the extraction context.
        group.matrix.copy(context.sheetMatrix)
        // Keep the spatial pit anchored under the wrench. Retire the paper and
        // desk individually, rather than hiding their shared parent and pit.
        group.matrixWorldNeedsUpdate = true
        group.visible = true

        const reveal = u.uReveal.value
        if (proof || reducedMotion) reveal.fill(1)
        else sheetReveal(intro.t, reveal)
        if (proof) { reveal.fill(0); reveal[GROUP.side] = 1 }
        u.uInk.value.copy(proof ? white : navy)
        const stockVisible = retirement < 1 || proof || reducedMotion
        paper.visible = stockVisible; desk.visible = !proof && stockVisible
        lines.visible = stockVisible; fills.visible = !proof && stockVisible; text.object.visible = !proof && stockVisible
        edge.visible = !proof && intro.fracture > 0 && stockVisible
        cracks.visible = !proof && !reducedMotion && intro.crackWeb > 0 && stockVisible
        portal.group.visible = !proof
        portal.cap.visible = portal.walls.visible = !proof && pit.visible
        const visibleEnergy = Math.max(electricity.energy, intro.pulseHead > 0 ? .26 : 0)
        const pitEnergy = Math.max(electricity.pitEnergy, .35 * pit.reveal)
        const portalStrength = proof || reducedMotion ? 0 : Math.max(visibleEnergy, pitEnergy)
        const portalPulse = portal.update(intro.t, portalStrength, tier === 'lite', reducedMotion)
        const wallUniforms = (portal.walls.material as ShaderMaterial).uniforms
        const surroundings = Math.max(0, Math.min(1, frame.surroundingsOpacity ?? 1)) * (1-retirement)
        portal.group.visible = !proof && pit.visible && surroundings > 0
        for (const mesh of [portal.walls, portal.cap]) {
          const shader = mesh.material as ShaderMaterial
          shader.uniforms.uPrivateSurroundings.value = surroundings
          if (shader.transparent !== (surroundings < 1)) {
            shader.transparent = surroundings < 1; shader.needsUpdate = true
          }
          shader.depthWrite = surroundings === 1
          mesh.visible = !proof && pit.visible && surroundings > 0
        }
        // Ambient cliff light remains after the transient electrical score ends.
        // A narrow mouth spill gives relief without revealing the remote cap.
        if (wallUniforms.uPortalRockAlive) wallUniforms.uPortalRockAlive.value = .5
        if (wallUniforms.uPortalFissureEnergy) wallUniforms.uPortalFissureEnergy.value = proof || reducedMotion ? 0 : pitEnergy
        if (wallUniforms.uPortalFissureGrowth) wallUniforms.uPortalFissureGrowth.value = electricity.pitGrowth
        for (let i = 0; i < fragments.length; i++) {
          const f = baked.fracture.fragments[i], mesh = fragments[i]
          const event = proof || reducedMotion ? 0 : Math.max(0, Math.min(1,
            ((intro.t - INTRO_PHASES.fractureStart) / (INTRO_PHASES.fractureEnd - INTRO_PHASES.fractureStart)
              - f.delay) / (1 - f.delay)))
          // Pressure lifts each shard before gravity takes it into the opening.
          // A smooth launch has no infinite derivative at the crack boundary.
          const flight = event * event * (3 - 2 * event)
          const lift = .065 * Math.sin(Math.PI * event)
          const fallU = Math.max(0, Math.min(1, (event - .62) / .38))
          const fall = fallU * fallU * (3 - 2 * fallU)
          mesh.position.set(f.center.x + f.velocity.x * flight * .65,
            f.center.y + f.velocity.y * flight * .65 - .08 * event * event,
            .00002 + lift + Math.min(0, f.velocity.z) * event * event - .05 * event * event - .28 * fall)
          mesh.rotation.set(f.spin.x * flight, f.spin.y * flight, f.spin.z * flight)
          mesh.visible = stockVisible
        }
        u.uMode.value = proof ? 1 : 0
        const contrast = proof ? 1 : intro.contrast
        const opacity = proof ? 1 : intro.drawingOpacity
        const lampPower = proof || reducedMotion ? 1 : intro.lampPower
        u.uContrast.value = contrast; u.uOpacity.value = opacity
        u.uLampPower.value = lampPower; u.uReadingPool.value = proof ? 0 : intro.readingPool
        const inkLight = proof ? 1 : 0.32 + 0.68 * lampPower
        u.uInk.value.multiplyScalar(inkLight)
        ;(u.uInkRed.value as Color).set(INK_RED).multiplyScalar(inkLight)
        ;(u.uInkGraphite.value as Color).set(INK_GRAPHITE).multiplyScalar(inkLight)
        text.update(reveal, opacity * (proof ? 1 : 0.88 + 0.12 * lampPower))
        u.uPulseHead.value = intro.pulseHead
        u.uElectricalEnergy.value = proof || reducedMotion ? 0 : visibleEnergy
        u.uPulse.value = proof || reducedMotion ? 0 : intro.pulse
        u.uCrackGlow.value = proof || reducedMotion ? 0 : intro.crackGlow
        u.uCrackWeb.value = proof || reducedMotion ? 0 : intro.crackWeb
        u.uCrackGrowth.value = proof || reducedMotion ? 0 : intro.crackGrowth
        u.uSpark.value = proof || reducedMotion ? 0 : intro.sparkAnticipation
        u.uFracture.value = proof || reducedMotion ? 0 : intro.fracture
        u.uWaveTime.value = intro.waveTime; u.uWaveEnabled.value = 0
        u.uFlexAmplitude.value = paperFlexAmplitude(intro.t, poseT, extraction.crossing, tier, proof || reducedMotion)
        const [contactStrength, contactRadius] = paperContactShadow(poseT, extraction.crossing, intro.pbr, tier, proof || reducedMotion)
        ;(u.uContact.value as Vector2).set(contactStrength, contactRadius)
        u.uVellum.value = paperVellum(poseT, extraction.crossing, intro.pbr, tier, proof || reducedMotion)
        pulse.visible = (u.uCrackGlow.value as number) > 0 && stockVisible
        u.uViewport.value.copy(viewport)

        // Only the reading lamp is transient. Null target holds its current pool;
        // the first explicit target seeds it even when delta is zero.
        if (frame.cameraLookTargetWorld) {
          inverseSheet.copy(context.sheetMatrix).invert()
          look.copy(frame.cameraLookTargetWorld).applyMatrix4(inverseSheet)
          const reach = Math.min(0.32, Math.max(0.09, (frame.cameraSheetDistance || 0.4) * 0.55))
          if (!lampSeeded) { lamp.set(look.x, look.y, reach); lampSeeded = true }
          else {
            const k = 1 - Math.exp(-3 * Math.min(Math.max(frame.delta, 0), 0.1))
            lamp.x += (look.x - lamp.x) * k
            lamp.y += (look.y - lamp.y) * k
            lamp.z += (reach - lamp.z) * k
          }
        }
        u.uLamp.value.copy(lamp)
        stats.flexAmplitude = u.uFlexAmplitude.value
        stats.flexPeakDisplacement = u.uFlexAmplitude.value * baked.flex.peak
        stats.flexEnabled = u.uFlexAmplitude.value > 0 ? 1 : 0
        stats.vellum = u.uVellum.value as number
        stats.contactShadow = contactStrength; stats.contactRadius = contactRadius
        const matrix = context.sheetMatrix.elements
        stats.flexNormalX = matrix[8]; stats.flexNormalY = matrix[9]; stats.flexNormalZ = matrix[10]
        stats.fracture = intro.fracture; stats.openingClear = intro.openingClear
        stats.fragmentCount = fragments.length; stats.fragmentThickness = baked.fracture.thickness
        const glassU = proof || reducedMotion ? 0 : Math.max(0, Math.min(1, intro.fracture / .15))
        stats.glassThickness = baked.fracture.thickness * (1 + 4 * glassU * glassU * (3 - 2 * glassU))
        stats.fragmentArea = baked.fracture.fragmentArea; stats.holeArea = baked.fracture.area
        stats.maxBoundaryDeviation = baked.fracture.maxBoundaryDeviation
        stats.crackGlow = intro.crackGlow; stats.crackWeb = intro.crackWeb; stats.paperOpacity = 1
        stats.pitReveal = pit.reveal; stats.pitFissureEnergy = proof || reducedMotion ? 0 : pitEnergy
        stats.electricalEnergy = proof || reducedMotion ? 0 : visibleEnergy; stats.electricalOutline = electricity.outline
        stats.electricalBranch = electricity.branch; stats.pitFissureGrowth = electricity.pitGrowth
        stats.pitMaxRingDeviationM = portal.maxRingDeviationM
        stats.modelBarrierSafe = intro.openingClear || intro.poseT <= 0.4 ? 1 : 0
        stats.portalActive = portal.group.visible && group.visible ? 1 : 0
        stats.stockRetired = stockVisible ? 0 : 1
        stats.pitRetained = portal.group.visible && group.visible && portal.walls.visible ? 1 : 0
        stats.surroundingsOpacity = surroundings
        stats.portalCapZ = portal.capZ; stats.portalMouthZ = portal.mouthZ
        stats.portalDeskZ = desk.position.z
        stats.portalCapBehindModel = portal.capZ < portal.initialModelBottom ? 1 : 0
        stats.portalInitialModelBottom = portal.initialModelBottom
        stats.portalProfilePoints = portal.profilePoints; stats.portalWallLevels = portal.wallLevels
        stats.portalDepthWrite = (portal.walls.material as ShaderMaterial).depthWrite ? 1 : 0
        stats.portalCapDepthWrite = (portal.cap.material as ShaderMaterial).depthWrite ? 1 : 0
        stats.portalDeskDiscard = 1
        stats.portalPulse = portalPulse; stats.portalLight = u.uPortalLight.value as number
        stats.phase = intro.t; stats.poseT = poseT; stats.lineOpacity = opacity
        stats.focus = proof || reducedMotion ? 1 : intro.focus
        stats.lampPower = lampPower; stats.blackout = lampPower <= 0.03 ? 1 : 0
        stats.readingPool = u.uReadingPool.value as number
        inverseSheet.copy(context.sheetMatrix).invert().multiply(context.modelMatrix)
        stats.localZ = inverseSheet.elements[14]
      },
    }
  } catch (error) {
    dispose()
    throw error
  }
}
