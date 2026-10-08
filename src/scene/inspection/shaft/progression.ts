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
import { Matrix3, Matrix4 } from 'three'
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

export interface ProgressionUniforms {
  uShaftMatrix: IUniform<Matrix4>
  uShaftInverse: IUniform<Matrix4>
  uShaftNormalMatrix: IUniform<Matrix3>
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
  uStressKind: IUniform<number>
  uStressMix: IUniform<number>
  uStressScanProgress: IUniform<number>
  uStressYMin: IUniform<number>
  uStressYMax: IUniform<number>
  uStressRMax: IUniform<number>
  uStressCenterY: IUniform<number>
  uStressHotspotFos: IUniform<number>
  uStressBodyFos: IUniform<number>
}

export function createProgressionUniforms(): ProgressionUniforms {
  return {
    uShaftMatrix: { value: new Matrix4() },
    uShaftInverse: { value: new Matrix4() },
    uShaftNormalMatrix: { value: new Matrix3() },
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
    uStressKind: { value: 0 },
    uStressMix: { value: 0 },
    uStressScanProgress: { value: 0 },
    uStressYMin: { value: 0 },
    uStressYMax: { value: 0 },
    uStressRMax: { value: SHAFT_OD_MM },
    uStressCenterY: { value: 10.41 },
    uStressHotspotFos: { value: 0.55 },
    uStressBodyFos: { value: FOS_MAX },
  }
}

/** Set the object-to-shaft-local matrix once per mesh (or per frame if the object moves). */
export function setShaftTransform(uniforms: ProgressionUniforms, objectToShaft: Matrix4): void {
  uniforms.uShaftMatrix.value.copy(objectToShaft)
  uniforms.uShaftInverse.value.copy(objectToShaft).invert()
  uniforms.uShaftNormalMatrix.value.getNormalMatrix(uniforms.uShaftInverse.value)
}

const MODE_VALUE: Readonly<Record<ProgressionMode, number>> = { none: 0, shaping: 1, hobbing: 2 }
const STRESS_VALUE: Readonly<Record<StressOverlay['kind'], number>> = { none: 0, warm: 1, cool: 2 }

/** Write the per-frame progression uniforms in place (no allocation). */
export function writeProgressionUniforms(
  uniforms: ProgressionUniforms,
  state: ProgressionState,
  shaft?: ProgressionShaft,
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
  float jgRadius = length(jgLocal.xz);
  float jgNew = jgRadius;
  jgClamped = 0.0;
  float jgMode = jgEffectiveMode();
  if (jgMode > 0.5 && jgLocal.y >= uFaceStart && jgLocal.y <= uFaceEnd) {
    if (jgMode < 1.5) {
      if (jgRadius < uShaftOD) {
        // atan(0, 0) is undefined in GLSL; use the CPU atan2(0, 0) convention (+X).
        float jgAngle = jgRadius > 0.0 ? atan(jgLocal.z, jgLocal.x) : 0.0;
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

const FRAGMENT_COMMON = /* glsl */ `
uniform float uStressKind;
uniform float uStressMix;
uniform float uStressScanProgress;
uniform float uStressYMin;
uniform float uStressYMax;
uniform float uStressRMax;
uniform float uStressCenterY;
uniform float uStressHotspotFos;
uniform float uStressBodyFos;
varying vec3 vShaftLocal;
${fosGlsl()}
`

const NORMAL_CHUNK = /* glsl */ `
#include <beginnormal_vertex>
// ${PROGRESSION_NORMAL_MARKER}
{
  vec4 jgNormalLocal = uShaftMatrix * vec4(position, 1.0);
  float jgNormalClamp;
  jgProgressedRadius(jgNormalLocal.xyz, jgNormalClamp);
  if (jgNormalClamp > 0.5) {
    vec3 jgRadialLocal = length(jgNormalLocal.xz) > 0.0
      ? normalize(vec3(jgNormalLocal.x, 0.0, jgNormalLocal.z)) : vec3(1.0, 0.0, 0.0);
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
float jgOldRadius = length(jgLocal4.xz);
float jgScale = jgOldRadius > 0.0 ? jgNewRadius / jgOldRadius : 1.0;
vec3 jgLocalNew = jgOldRadius > 0.0
  ? vec3(jgLocal4.x * jgScale, jgLocal4.y, jgLocal4.z * jgScale)
  : vec3(jgNewRadius, jgLocal4.y, 0.0);
vShaftLocal = jgLocalNew;
vec3 transformed = (uShaftInverse * vec4(jgLocalNew, 1.0)).xyz;
`

const STRESS_CHUNK = /* glsl */ `
#include <emissivemap_fragment>
// ${STRESS_MARKER}
if (uStressKind > 0.5 && uStressMix > 0.001) {
  // FEA-style factor-of-safety field (JG-035 S2): deterministic, a pure function of shaft-local position.
  // Tight concentration at the measured fillet/floor, a broad skirt along the body, a bending-side bias and a
  // little low-frequency blotch so it reads as a solved field. Colours come from the shared FOS bar.
  float jgStressInBand = step(uStressYMin, vShaftLocal.y) * (1.0 - step(uStressYMax, vShaftLocal.y));
  float jgStressRadius = length(vShaftLocal.xz);
  float jgStressInR = (1.0 - step(uStressRMax, jgStressRadius)) * step(0.0001, jgStressRadius);
  float jgDy = vShaftLocal.y - uStressCenterY;
  float jgTheta = atan(vShaftLocal.z, vShaftLocal.x);
  float jgSide = 0.62 + 0.38 * cos(jgTheta - 0.35);
  float jgCore = exp(-(jgDy * jgDy) / (2.0 * 0.55 * 0.55));
  float jgSkirt = exp(-(jgDy * jgDy) / (2.0 * 2.4 * 2.4));
  float jgFloorBias = 1.0 - 0.6 * smoothstep(3.9, 6.1, jgStressRadius);
  float jgBlotch = 0.1 * sin(jgTheta * 3.0 + jgDy * 2.2) + 0.06 * sin(jgTheta * 5.0 - jgDy * 3.1);
  float jgField = clamp((0.95 * jgCore * jgFloorBias + 0.38 * jgSkirt) * jgSide + jgBlotch * jgSkirt, 0.0, 1.0);
  float jgFos = mix(uStressBodyFos, uStressHotspotFos, jgField);
  // Reveal outward from the hotspot (scan 0 -> 1) instead of sweeping the shaft end to end.
  float jgReach = uStressScanProgress * (uStressYMax - uStressYMin + 1.2);
  float jgReveal = 1.0 - smoothstep(jgReach - 1.2, jgReach, abs(jgDy));
  float jgStressMask = jgStressInBand * jgStressInR * jgReveal * clamp(uStressMix, 0.0, 1.0);
  vec3 jgFosRgb = jgFosColor(jgFos);
  diffuseColor.rgb = mix(diffuseColor.rgb, jgFosRgb * 0.72, jgStressMask * 0.9);
  totalEmissiveRadiance += jgFosRgb * jgStressMask * 0.42;
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
      .replace('#include <emissivemap_fragment>', STRESS_CHUNK)
  }
  material.customProgramCacheKey = () => 'jgun-shaft-progression-v3'
  material.needsUpdate = true
  return material
}
