/**
 * JG-035 shaft tooling leaf: closed-form machining progression.
 *
 * Turns the finished CAD shaft meshes into blank / partial / finished states without CSG.
 * Everything is a pure function of the state passed in: no accumulators, no clocks, no
 * randomness, and no allocation in per-frame paths. The same law runs on the CPU
 * (progressedRadius) and on the GPU (applyProgression -> onBeforeCompile), so seek order
 * cannot diverge.
 *
 * Frame: shaft-local millimetres, +Y is the shaft axis (CAD). The runtime loader performs
 * exactly one conversion (shaft-local +Y -> glTF -Z); the object-to-shaft matrix handed to
 * applyProgression maps render-object space back to shaft-local mm, once.
 */
import { DoubleSide, Matrix3, Matrix4, ShaderMaterial, Vector2, Vector3 } from 'three'
import type { IUniform, Material, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { FOS_MAX, fosGlsl } from './fosPresentation'

export type ProgressionMode = 'none' | 'shaping' | 'hobbing'
export type ProgressionShaft = 'legacy' | 'approved'

export interface ProgressionState {
  mode: ProgressionMode
  /** Per tooth-space depth in [0, 1]; 0 = uncut blank stock, 1 = finished tooth space. */
  spaceDepth: Float32Array
  /** Tooth-space index currently engaged by the cutter, or -1. */
  engagedSpace: number
  /** Depth before the engaged stroke; omitted means a first pass from the uncut blank. */
  engagedPreviousDepth?: number
  /** Cutter leading-face y (mm) during the current stroke; material behind it carries the new depth. */
  edgeY: number
  /** Hob axial centre y (mm). */
  hobYc: number
  /** Hob centre distance (mm). */
  hobA: number
  /** Hob envelope radius (mm). */
  hobR: number
}

export interface StressOverlay {
  kind: 'none' | 'warm' | 'cool'
  mix: number
  scanProgress: number
  yMin: number
  yMax: number
  rMax: number
  /** Axial centre (mm) of the stress concentration: relief-groove floor (warm) or hobbed lead-out end (cool). */
  centerY: number
  /** FOS at the hotspot and in the far field; the shader maps both through the shared FOS colour bar. */
  hotspotFos: number
  bodyFos: number
}

// ---- measured shaft geometry (camera/clearance-v4/report.json facts) ----
export const SHAFT_SPACES = 10
export const SPACE_PITCH_RAD = (Math.PI * 2) / SHAFT_SPACES
/**
 * Azimuth (rad, shaft-local) of the centre of tooth space 0. Recovered by
 * progression.test.ts from profile-study.json legacy 6.0 polar data: the 10 tooth-tip
 * centroids sit at 18 deg + 36 deg k, so the space centres sit at 0 + 36 deg k.
 */
export const SPACE_CLOCK_RAD = 0
/** Tooth tip radius = measured OD of the legacy face band. */
export const SHAFT_OD_MM = 6.083507443359969
/** Tooth-space floor radius = measured root of the approved face band. */
export const SHAFT_ROOT_MM = 4.29182859636582
/** First tooth-space material y (legacy pilot end). */
export const FACE_START_MM = 3.1749
/** Legacy last tooth material y: the shaping band ends here. */
export const SHAPING_FACE_END_MM = 9.875
/** Approved ramp end y: the hobbing band ends here. */
export const HOBBING_FACE_END_MM = 13.78

// ---- certified hob tool (report.hob) vs the equivalent meridian floor ----
export const HOB_CERTIFIED_R_MM = 5.87
export const HOB_CERTIFIED_LEAD_ANGLE_DEG = 5.5587
/**
 * Visual floor: the authored untilted circle R = 6.0 with centre at root + 6.0.
 * The certified tool is R 5.87 tilted to its lead angle; its equivalent meridian floor
 * (clearance-v4 ramp fit, max deviation 0.0049 mm) is this untilted circle, so the final
 * hobbing state equals the approved mesh.
 */
export const HOB_VISUAL_R_MM = 6.0
export const HOB_VISUAL_A_MM = SHAFT_ROOT_MM + HOB_VISUAL_R_MM
export const HOB_FINAL_YC_MM = 9.5249
export const HOB_INFEED_YC_MM = -4.195
export const HOB_RETRACT_MM = 2.5

export function createProgressionState(): ProgressionState {
  return {
    mode: 'none',
    spaceDepth: new Float32Array(SHAFT_SPACES),
    engagedSpace: -1,
    edgeY: 0,
    hobYc: HOB_INFEED_YC_MM,
    hobA: HOB_VISUAL_A_MM,
    hobR: HOB_VISUAL_R_MM,
  }
}

/** Nearest tooth-space index for a shaft-local azimuth (rad). Allocation-free. */
export function spaceIndexAt(azimuth: number): number {
  const raw = Math.round((azimuth - SPACE_CLOCK_RAD) / SPACE_PITCH_RAD) % SHAFT_SPACES
  const index = raw < 0 ? raw + SHAFT_SPACES : raw
  return index === 0 ? 0 : index
}

/** Hobbing meridian floor radius (mm). Allocation-free. */
export function hobFloorRadius(y: number, hobYc: number, hobA: number, hobR: number): number {
  if (y <= hobYc) return SHAFT_ROOT_MM
  if (y < hobYc + hobR) {
    const dy = y - hobYc
    const r2 = hobR * hobR - dy * dy
    return hobA - Math.sqrt(r2 > 0 ? r2 : 0)
  }
  return SHAFT_OD_MM
}

/**
 * CPU mirror of the vertex-shader law. Returns the progressed radius (mm) for a shaft-local
 * sample. Pure: depends only on its arguments and never writes to state.
 *
 * legacy shaping: only FACE_START <= y <= 9.875 with r < OD; r' = min(OD, r + (1 - depth_i)*(OD - ROOT)).
 * approved hobbing: only FACE_START <= y <= 13.78; r' = max(r, min(OD, floor(y))).
 */
export function progressedRadius(
  r: number,
  y: number,
  azimuth: number,
  state: ProgressionState,
  shaft: ProgressionShaft,
): number {
  if (state.mode === 'none') return r
  if (state.mode === 'shaping') {
    if (shaft !== 'legacy') return r
    if (y < FACE_START_MM || y > SHAPING_FACE_END_MM || r >= SHAFT_OD_MM) return r
    const space = spaceIndexAt(azimuth)
    let depth = state.spaceDepth[space]
    // The engaged space carries the new depth only behind the cutter's leading face.
    if (space === state.engagedSpace && y > state.edgeY) depth = state.engagedPreviousDepth ?? 0
    const value = r + (1 - depth) * (SHAFT_OD_MM - SHAFT_ROOT_MM)
    return value > SHAFT_OD_MM ? SHAFT_OD_MM : value
  }
  if (shaft !== 'approved') return r
  if (y < FACE_START_MM || y > HOBBING_FACE_END_MM) return r
  const floor = hobFloorRadius(y, state.hobYc, state.hobA, state.hobR)
  const clamped = floor > SHAFT_OD_MM ? SHAFT_OD_MM : floor
  return r > clamped ? r : clamped
}

// ---- shader patch -------------------------------------------------------------------------

export const PROGRESSION_LAW_MARKER = 'JG-PROGRESSION-LAW-BEGIN'
export const PROGRESSION_NORMAL_MARKER = 'JG-PROGRESSION-NORMAL-BEGIN'
export const PROGRESSION_VERTEX_MARKER = 'JG-PROGRESSION-VERTEX-BEGIN'
export const STRESS_MARKER = 'JG-STRESS-BEGIN'
export const AXIAL_CONTACT_MARKER = 'JG-AXIAL-CONTACT-BEGIN'

export interface ProgressionUniforms {
  uShaftMatrix: IUniform<Matrix4>
  uShaftInverse: IUniform<Matrix4>
  uShaftNormalMatrix: IUniform<Matrix3>
  /**
   * The shaft axis in the local frame. The exported bundle places the shaft
   * away from the local origin, so every radial and axial law has to measure
   * from the axis rather than from the origin.
   */
  uShaftAxis: IUniform<Vector3>
  uProgressionMode: IUniform<number>
  uShaftKind: IUniform<number>
  uSpaceDepth: IUniform<Float32Array>
  uSpacePitch: IUniform<number>
  uSpaceClock: IUniform<number>
  uEngagedSpace: IUniform<number>
  uEngagedPreviousDepth: IUniform<number>
  uEdgeY: IUniform<number>
  uHobYc: IUniform<number>
  uHobA: IUniform<number>
  uHobR: IUniform<number>
  uFaceStart: IUniform<number>
  uFaceEnd: IUniform<number>
  uShaftOD: IUniform<number>
  uShaftRoot: IUniform<number>
  uAxialContactY: IUniform<number>
  uAxialContactMix: IUniform<number>
  uStressKind: IUniform<number>
  uStressMix: IUniform<number>
  uStressScanProgress: IUniform<number>
  uStressYMin: IUniform<number>
  uStressYMax: IUniform<number>
  uStressRMax: IUniform<number>
  uStressCenterY: IUniform<number>
  /** Shaft axis in the same local frame, so the radius is measured from the axis. */
  uStressAxis: IUniform<Vector2>
  uStressHotspotFos: IUniform<number>
  uStressBodyFos: IUniform<number>
}

export function createProgressionUniforms(): ProgressionUniforms {
  return {
    uShaftMatrix: { value: new Matrix4() },
    uShaftInverse: { value: new Matrix4() },
    uShaftNormalMatrix: { value: new Matrix3() },
    uShaftAxis: { value: new Vector3() },
    uProgressionMode: { value: 0 },
    uShaftKind: { value: 0 },
    uSpaceDepth: { value: new Float32Array(SHAFT_SPACES) },
    uSpacePitch: { value: SPACE_PITCH_RAD },
    uSpaceClock: { value: SPACE_CLOCK_RAD },
    uEngagedSpace: { value: -1 },
    uEngagedPreviousDepth: { value: 0 },
    uEdgeY: { value: 0 },
    uHobYc: { value: HOB_INFEED_YC_MM },
    uHobA: { value: HOB_VISUAL_A_MM },
    uHobR: { value: HOB_VISUAL_R_MM },
    uFaceStart: { value: FACE_START_MM },
    uFaceEnd: { value: SHAPING_FACE_END_MM },
    uShaftOD: { value: SHAFT_OD_MM },
    uShaftRoot: { value: SHAFT_ROOT_MM },
    uAxialContactY: { value: 0 },
    uAxialContactMix: { value: 0 },
    uStressKind: { value: 0 },
    uStressMix: { value: 0 },
    uStressScanProgress: { value: 0 },
    uStressYMin: { value: 0 },
    uStressYMax: { value: 0 },
    uStressRMax: { value: SHAFT_OD_MM },
    uStressCenterY: { value: 10.41 },
    uStressAxis: { value: new Vector2() },
    uStressHotspotFos: { value: 0.55 },
    uStressBodyFos: { value: FOS_MAX },
  }
}

/** Set the object-to-shaft-local matrix once per mesh (or per frame if the object moves). */
export function setShaftTransform(uniforms: ProgressionUniforms, objectToShaft: Matrix4): void {
  uniforms.uShaftMatrix.value.copy(objectToShaft)
  uniforms.uShaftInverse.value.copy(objectToShaft).invert()
  uniforms.uShaftNormalMatrix.value.getNormalMatrix(uniforms.uShaftInverse.value)
  // The axis passes through the bundle's own origin; its position in the local
  // frame is the translation column of the object-to-shaft matrix.
  const e = objectToShaft.elements
  uniforms.uShaftAxis.value.set(e[12], e[13], e[14])
}

const MODE_VALUE: Readonly<Record<ProgressionMode, number>> = { none: 0, shaping: 1, hobbing: 2 }
const STRESS_VALUE: Readonly<Record<StressOverlay['kind'], number>> = { none: 0, warm: 1, cool: 2 }

/** Write the per-frame progression uniforms in place (no allocation). */
export function writeProgressionUniforms(
  uniforms: ProgressionUniforms,
  state: ProgressionState,
  shaft?: ProgressionShaft,
  contactYmm = 0,
  contactMix = 0,
): void {
  const resolved: ProgressionShaft = shaft ?? (state.mode === 'hobbing' ? 'approved' : 'legacy')
  uniforms.uProgressionMode.value = MODE_VALUE[state.mode]
  uniforms.uShaftKind.value = resolved === 'approved' ? 1 : 0
  uniforms.uFaceEnd.value = resolved === 'approved' ? HOBBING_FACE_END_MM : SHAPING_FACE_END_MM
  const depth = uniforms.uSpaceDepth.value
  const source = state.spaceDepth
  for (let i = 0; i < SHAFT_SPACES; i++) depth[i] = source[i]
  uniforms.uEngagedSpace.value = state.engagedSpace
  uniforms.uEngagedPreviousDepth.value = state.engagedPreviousDepth ?? 0
  uniforms.uEdgeY.value = state.edgeY
  uniforms.uHobYc.value = state.hobYc
  uniforms.uHobA.value = state.hobA
  uniforms.uHobR.value = state.hobR
  uniforms.uAxialContactY.value = Number.isFinite(contactYmm) ? Math.max(0, Math.min(9.525, contactYmm)) : 0
  uniforms.uAxialContactMix.value = resolved === 'approved' && Number.isFinite(contactMix)
    ? Math.max(0, Math.min(1, contactMix)) : 0
}

/** Write the stress-overlay uniforms in place (no allocation). */
export function writeStressUniforms(uniforms: ProgressionUniforms, stress: StressOverlay): void {
  uniforms.uStressKind.value = STRESS_VALUE[stress.kind]
  uniforms.uStressMix.value = stress.mix
  uniforms.uStressScanProgress.value = stress.scanProgress
  uniforms.uStressYMin.value = stress.yMin
  uniforms.uStressYMax.value = stress.yMax
  uniforms.uStressRMax.value = stress.rMax
  uniforms.uStressCenterY.value = stress.centerY
  uniforms.uStressHotspotFos.value = stress.hotspotFos
  uniforms.uStressBodyFos.value = stress.bodyFos
}

const VERTEX_COMMON = /* glsl */ `
uniform mat4 uShaftMatrix;
uniform mat4 uShaftInverse;
uniform mat3 uShaftNormalMatrix;
uniform vec3 uShaftAxis;
uniform float uProgressionMode;
uniform float uShaftKind;
uniform float uSpaceDepth[10];
uniform float uSpacePitch;
uniform float uSpaceClock;
uniform float uEngagedSpace;
uniform float uEngagedPreviousDepth;
uniform float uEdgeY;
uniform float uHobYc;
uniform float uHobA;
uniform float uHobR;
uniform float uFaceStart;
uniform float uFaceEnd;
uniform float uShaftOD;
uniform float uShaftRoot;
varying vec3 vShaftLocal;
// ${PROGRESSION_LAW_MARKER}
float jgEffectiveMode() {
  if (uProgressionMode > 1.5) return uShaftKind > 0.5 ? 2.0 : 0.0;
  if (uProgressionMode > 0.5) return uShaftKind < 0.5 ? 1.0 : 0.0;
  return 0.0;
}
float jgProgressedRadius(vec3 jgLocal, out float jgClamped) {
  float jgRadius = length(jgLocal.xz - uShaftAxis.xz);
  float jgNew = jgRadius;
  jgClamped = 0.0;
  float jgMode = jgEffectiveMode();
    if (jgMode > 0.5 && jgLocal.y >= uFaceStart && jgLocal.y <= uFaceEnd) {
    if (jgMode < 1.5) {
      if (jgRadius < uShaftOD) {
        // atan(0, 0) is undefined in GLSL; use the CPU atan2(0, 0) convention (+X).
        float jgAngle = jgRadius > 0.0 ? atan(jgLocal.z - uShaftAxis.z, jgLocal.x - uShaftAxis.x) : 0.0;
        float jgSpace = mod(floor((jgAngle - uSpaceClock) / uSpacePitch + 0.5), 10.0);
        float jgDepth = uSpaceDepth[int(jgSpace)];
        if (abs(uEngagedSpace - jgSpace) < 0.5 && jgLocal.y > uEdgeY) jgDepth = uEngagedPreviousDepth;
        jgNew = min(uShaftOD, jgRadius + (1.0 - jgDepth) * (uShaftOD - uShaftRoot));
      }
    } else {
      float jgFloor = uShaftOD;
      if (jgLocal.y <= uHobYc) {
        jgFloor = uShaftRoot;
      } else if (jgLocal.y < uHobYc + uHobR) {
        float jgDy = jgLocal.y - uHobYc;
        jgFloor = uHobA - sqrt(max(0.0, uHobR * uHobR - jgDy * jgDy));
      }
      jgNew = max(jgRadius, min(uShaftOD, jgFloor));
    }
    // Preserve original normals in the finished state and on untouched journal/tip vertices.
    if (jgNew > jgRadius + 0.000001 && jgNew > uShaftOD - 0.0001) jgClamped = 1.0;
  }
  return jgNew;
}
`

// ---- stress field (Issue 3) ------------------------------------------------------------------
/** Axial sigma (mm): warm colours stay near the groove; fillets/shoulders traverse the cooler bar stops. */
export const STRESS_SIGMA_MM = Object.freeze({ mild: 0.85, severe: 1.6 })

/** Severity in [0.35, 1]: 1 at the weakest attempt (FOS 0.55), shrinking as the alloy strengthens. */
export function stressSeverity(hotspotFos: number): number {
  const s = (1.15 - hotspotFos) / 0.6
  return s < 0.35 ? 0.35 : s > 1 ? 1 : s
}

/**
 * Normalised stress field in [0, 1] (1 = hotspot FOS, 0 = body FOS) at axial distance dy (mm) from the
 * hotspot centre. Axisymmetric by construction: no azimuth, radius or noise term. Mirrored exactly by
 * jgStressField in GLSL (stressFieldGlsl) so tests can pin the on-screen colours.
 */
export function stressFieldAt(dy: number, hotspotFos: number): number {
  const severity = stressSeverity(hotspotFos)
  const sigma = STRESS_SIGMA_MM.mild + (STRESS_SIGMA_MM.severe - STRESS_SIGMA_MM.mild) * severity
  // A single smooth peak has no flat minimum or core/skirt crossover. Only the measured floor
  // (dy = 0) reaches the bar minimum; every axial step into the fillet increases the FOS.
  return Math.exp(-(dy * dy) / (2 * sigma * sigma))
}

/** GLSL twin of stressFieldAt, generated from the same constants. */
export function stressFieldGlsl(): string {
  return `
float jgStressField(float dy, float hotspotFos) {
  float severity = clamp((1.15 - hotspotFos) / 0.6, 0.35, 1.0);
  float sigma = mix(${STRESS_SIGMA_MM.mild.toFixed(3)}, ${STRESS_SIGMA_MM.severe.toFixed(3)}, severity);
  return exp(-(dy * dy) / (2.0 * sigma * sigma));
}
`
}

const FRAGMENT_COMMON = /* glsl */ `
uniform float uShaftKind;
uniform float uAxialContactY;
uniform float uAxialContactMix;
uniform float uStressKind;
uniform float uStressMix;
uniform float uStressScanProgress;
uniform float uStressYMin;
uniform float uStressYMax;
uniform float uStressRMax;
uniform float uStressCenterY;
uniform vec3 uShaftAxis;
uniform float uStressHotspotFos;
uniform float uStressBodyFos;
varying vec3 vShaftLocal;
${fosGlsl()}
${stressFieldGlsl()}
`

const NORMAL_CHUNK = /* glsl */ `
#include <beginnormal_vertex>
// ${PROGRESSION_NORMAL_MARKER}
{
  vec4 jgNormalLocal = uShaftMatrix * vec4(position, 1.0);
  float jgNormalClamp;
  jgProgressedRadius(jgNormalLocal.xyz, jgNormalClamp);
  if (jgNormalClamp > 0.5) {
    vec2 jgNormalRel = jgNormalLocal.xz - uShaftAxis.xz;
    vec3 jgRadialLocal = length(jgNormalRel) > 0.0
      ? normalize(vec3(jgNormalRel.x, 0.0, jgNormalRel.y)) : vec3(1.0, 0.0, 0.0);
    vec3 jgRadialObject = normalize(uShaftNormalMatrix * jgRadialLocal);
    objectNormal = normalize(mix(objectNormal, jgRadialObject, jgNormalClamp));
  }
}
`

const VERTEX_CHUNK = /* glsl */ `
// ${PROGRESSION_VERTEX_MARKER}
vec4 jgLocal4 = uShaftMatrix * vec4(position, 1.0);
float jgClamp;
float jgNewRadius = jgProgressedRadius(jgLocal4.xyz, jgClamp);
float jgOldRadius = length(jgLocal4.xz - uShaftAxis.xz);
float jgScale = jgOldRadius > 0.0 ? jgNewRadius / jgOldRadius : 1.0;
// Scale about the shaft axis, not the local origin: the registered bundle puts the axis off-origin.
vec2 jgRelXZ = jgOldRadius > 0.0
  ? (jgLocal4.xz - uShaftAxis.xz) * jgScale + uShaftAxis.xz
  : uShaftAxis.xz + vec2(jgNewRadius, 0.0);
vec3 jgLocalNew = vec3(jgRelXZ.x, jgLocal4.y, jgRelXZ.y);
vShaftLocal = jgLocalNew;
vec3 transformed = (uShaftInverse * vec4(jgLocalNew, 1.0)).xyz;
`

const STRESS_CHUNK = /* glsl */ `
#include <emissivemap_fragment>
// ${STRESS_MARKER}
if (uStressKind > 0.5 && uStressMix > 0.001) {
  // FEA-style factor-of-safety field (JG-035 S2, Issue 3 2026-10-24): deterministic and AXISYMMETRIC.
  // Torsion loads the relief groove uniformly around all 360 deg, so the field depends only on the axial
  // distance from the measured groove floor: a narrow minimum with smooth falloff through the fillets
  // and shoulders, spreading further for weaker alloys. Colours come from the shared FOS bar.
  float jgStressInBand = smoothstep(uStressYMin, uStressYMin + 0.8, vShaftLocal.y)
    * (1.0 - smoothstep(uStressYMax - 0.8, uStressYMax, vShaftLocal.y));
  float jgStressRadius = length(vShaftLocal.xz - uShaftAxis.xz);
  float jgStressInR = (1.0 - step(uStressRMax, jgStressRadius)) * step(0.0001, jgStressRadius);
  float jgDy = vShaftLocal.y - uStressCenterY;
  float jgField = jgStressField(jgDy, uStressHotspotFos);
  float jgFos = mix(uStressBodyFos, uStressHotspotFos, jgField);
  // Reveal outward from the hotspot (scan 0 -> 1) instead of sweeping the shaft end to end.
  float jgReach = uStressScanProgress * (uStressYMax - uStressYMin + 1.2);
  float jgReveal = 1.0 - smoothstep(jgReach - 1.2, jgReach, abs(jgDy));
  float jgStressMask = jgStressInBand * jgStressInR * jgReveal * clamp(uStressMix, 0.0, 1.0);
  vec3 jgFosRgb = jgFosColorLinear(jgFos);
  // The shaft is a bright coated metal. Keep the FEA field legible on that
  // surface by replacing the base tint and damping the metallic response
  // wherever the field is present, then adding a restrained emissive term.
  diffuseColor.rgb = mix(diffuseColor.rgb, jgFosRgb, jgStressMask * 0.94);
  metalnessFactor = mix(metalnessFactor, 0.18, jgStressMask);
  roughnessFactor = mix(roughnessFactor, 0.46, jgStressMask);
  totalEmissiveRadiance += jgFosRgb * jgStressMask * 0.34;
}
`

const AXIAL_CONTACT_CHUNK = /* glsl */ `
// ${AXIAL_CONTACT_MARKER}
if (uShaftKind > 0.5 && uAxialContactMix > 0.0) {
  vec2 jgContactRadial = vShaftLocal.xz - uShaftAxis.xz;
  float jgContactR = length(jgContactRadial);
  // Finite derivatives in the same shaft frame as the contact plane. Their
  // tangential component selects flanks, excluding tooth tips and axial caps.
  vec3 jgContactN = cross(dFdx(vShaftLocal), dFdy(vShaftLocal));
  jgContactN *= inversesqrt(max(dot(jgContactN, jgContactN), 0.00000001));
  vec3 jgContactRadialN = vec3(jgContactRadial.x, 0.0, jgContactRadial.y) / max(jgContactR, 0.0001);
  float jgContactFlank = (1.0 - abs(jgContactN.y))
    * (1.0 - abs(dot(jgContactN, jgContactRadialN)));
  // 0.40 mm full-width line, with ordered smoothstep edges (GLSL-safe).
  float jgContactLine = 1.0 - smoothstep(0.0, 0.20, abs(vShaftLocal.y - uAxialContactY));
  float jgContactBand = step(3.15, vShaftLocal.y) * (1.0 - step(9.55, vShaftLocal.y));
  float jgContactZone = step(4.45, jgContactR) * (1.0 - step(5.95, jgContactR));
  float jgContactMask = clamp(jgContactLine * jgContactBand * jgContactZone
    * jgContactFlank * clamp(uAxialContactMix, 0.0, 1.0), 0.0, 1.0);
  roughnessFactor = mix(roughnessFactor, min(roughnessFactor, 0.16), jgContactMask);
  totalEmissiveRadiance += vec3(0.72, 0.91, 1.0) * (0.18 * jgContactMask);
}
`

/**
 * Patch a standard/physical material with the progression law and stress overlay.
 *
 * The caller owns the `uniforms` object (createProgressionUniforms), updates it each frame
 * with writeProgressionUniforms/writeStressUniforms, and disposes the material. This takes
 * ownership of material.onBeforeCompile.
 */
export function applyProgression(
  material: MeshStandardMaterial | MeshPhysicalMaterial,
  uniforms: ProgressionUniforms,
): Material {
  material.onBeforeCompile = (shader) => {
    for (const key of Object.keys(uniforms) as (keyof ProgressionUniforms)[]) {
      shader.uniforms[key] = uniforms[key]
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERTEX_COMMON)
      .replace('#include <beginnormal_vertex>', NORMAL_CHUNK)
      .replace('#include <begin_vertex>', VERTEX_CHUNK)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAGMENT_COMMON)
      .replace('#include <emissivemap_fragment>', STRESS_CHUNK + AXIAL_CONTACT_CHUNK)
    ;(material.userData as Record<string, unknown>).jgunStressShader = shader.fragmentShader.includes(STRESS_MARKER)
  }
  material.customProgramCacheKey = () => 'jgun-shaft-progression-v7:' + material.uuid
  material.needsUpdate = true
  return material
}

/**
 * Surface-projected FEA overlay. The base shaft is polished metal whose
 * reflections can wash out a diffuse tint; this transparent pass shares the
 * exact stress uniforms and FOS stops and draws the field on the verified
 * shaft surface throughout the FEA beats.
 */
export function makeStressOverlayMaterial(uniforms: ProgressionUniforms): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, { value: unknown }>,
    // The overlay must ride the same progression transform as the shaft
    // surface it colours, so it reuses the shared vertex chunks verbatim.
    vertexShader: /* glsl */ `
${VERTEX_COMMON}
void main() {
${VERTEX_CHUNK}
  // The overlay rides the same surface as the shaft, so it needs a small
  // view-space bias TOWARD the camera to win the depth test. View-space z is
  // negative in front of the camera, so adding pulls it closer.
  vec4 jgOverlayPosition = modelViewMatrix * vec4(transformed, 1.0);
  jgOverlayPosition.z += 0.0004;
  gl_Position = projectionMatrix * jgOverlayPosition;
}`,
    fragmentShader: /* glsl */ `
uniform float uStressKind;
uniform float uStressMix;
uniform float uStressScanProgress;
uniform float uStressYMin;
uniform float uStressYMax;
uniform float uStressRMax;
uniform float uStressCenterY;
uniform float uStressHotspotFos;
uniform float uStressBodyFos;
uniform vec3 uShaftAxis;
varying vec3 vShaftLocal;
${fosGlsl()}
${stressFieldGlsl()}
void main() {
  if (uStressKind < 0.5 || uStressMix < 0.001) discard;
  float band = smoothstep(uStressYMin, uStressYMin + 0.8, vShaftLocal.y)
    * (1.0 - smoothstep(uStressYMax - 0.8, uStressYMax, vShaftLocal.y));
  float radius = length(vShaftLocal.xz - uShaftAxis.xz);
  float radial = (1.0 - step(uStressRMax, radius)) * step(0.0001, radius);
  float dy = vShaftLocal.y - uStressCenterY;
  float field = jgStressField(dy, uStressHotspotFos);
  float reach = uStressScanProgress * (uStressYMax - uStressYMin + 1.2);
  float reveal = 1.0 - smoothstep(reach - 1.2, reach, abs(dy));
  float mask = band * radial * reveal * clamp(uStressMix, 0.0, 1.0);
  if (mask < 0.001) discard;
  vec3 color = jgFosColorLinear(mix(uStressBodyFos, uStressHotspotFos, field));
  gl_FragColor = vec4(color, mask * 0.92);
}`,
    transparent: true, depthTest: true, depthWrite: false, side: DoubleSide, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  })
}
