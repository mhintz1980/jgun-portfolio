import { Matrix4, ShaderMaterial, type Material, type Mesh, type Object3D } from 'three'
import { studyToShaftLocal } from '../inspection/shaft/frame'

/**
 * Region/transform-aware feature masks for cascade pixel proofs (contract v1).
 *
 * A contract scopes one cascade feature to axial bands on the shaft-datum Y
 * axis: the same frame as progression's vShaftLocal (shaft-local millimetres),
 * with per-mesh object-to-shaft matrices derived like shaftRuntime's
 * meshToShaft (studyToShaftLocal * rootInverse * mesh.matrixWorld, where
 * rootInverse strips the study root's world registration). Bands and matrices
 * must come from authenticated geometry measurement: this module has no
 * default bounds and never invents regions. Validation is fail-closed, so an
 * unproven, partial, or stale contract throws instead of widening a mask.
 *
 * The shader patch maps the mesh's original object-space position through the
 * contract matrix in the vertex stage and gates the fragment-stage
 * override/discard on the interpolated axial coordinate. The progression
 * deformation preserves axial Y, and bands test only Y, so masks stay bound to
 * the datum while the shaft deforms or spins about its axis. Injected symbols
 * carry jgfm/jgFeature prefixes that cannot collide with the progression
 * hook's jg* names; the patch targets built-in material shader style
 * (varying/gl_FragColor) like the existing conservative identityMaterial.
 */
export const FEATURE_MASK_VERSION = 'jgun-feature-mask-v1'
/** v1 gates fragments on the shaft-datum axial coordinate only. */
export const FEATURE_MASK_AXIS = 'y' as const
/** Uniform array capacity; programs key on this count, band values do not. */
export const FEATURE_MASK_BAND_CAPACITY = 4

/**
 * Authenticated shaft-datum (+Y, mm) feature bands from decoded Draco geometry
 * (output/high-low-feature-proof/geometry/geometry-report.json & FINDINGS.md).
 */
export const AUTHENTICATED_SHAFT_FEATURE_BANDS = Object.freeze({
  inputSunTeeth: Object.freeze({
    /** Shared 10-tooth functional face authenticated in both Default.glb and manufacturing-core-full.glb. */
    sharedFunctional: Object.freeze([[3.174827, 9.524858]] as const),
    /** Source P001835-2 full shaped tooth feature (includes shaped exit to 9.789711 mm). */
    sourceFullShaping: Object.freeze([[3.174827, 9.789711]] as const),
    /** Study approvedshaft full hobbed tooth feature (includes 10-fold hob lead-out to 13.938684 mm). */
    studyFullHob: Object.freeze([[3.174827, 13.938684]] as const),
  }),
  inputSixfold: Object.freeze({
    /** Shared far-end 6-flat feature including end lead-out through shaft tip. */
    sharedFull: Object.freeze([[61.109647, 71.52395]] as const),
    /** Sub-band containing all 6 modulo-60-deg coplanar flat normal clusters in both assets. */
    strongFlatSubBand: Object.freeze([[61.109647, 71.120672]] as const),
  }),
  controls: Object.freeze({
    /** Full-shaft datum envelope [-1, 72] mm for machinery-positive equivalence control. */
    fullShaftBand: Object.freeze([[-1, 72]] as const),
    /** Off-part datum band [-100, -90] mm for machinery-negative zero control. */
    nullBand: Object.freeze([[-100, -90]] as const),
  }),
})

export type FeatureMaskBand = readonly [yMin: number, yMax: number]
export type InputFeatureBandMode = 'variantFull' | 'sharedFunctional'

export interface FeatureMaskContract {
  version: string
  featureId: string
  /** Default shaft-datum mm bands, sorted ascending, non-overlapping. */
  bands: readonly FeatureMaskBand[]
  /** mesh uuid -> object-to-shaft matrix (16-entry column-major array or Matrix4). */
  objectToShaft: Record<string, readonly number[] | Matrix4>
  /** Optional per-mesh variant bands (e.g. source P001835 shaping exit vs study hob lead-out). */
  meshBands?: Record<string, readonly FeatureMaskBand[]>
  /** Provenance (e.g. geometry evidence path); recorded in proof output. */
  notes?: string
}

export interface ValidatedFeatureMask {
  version: string
  featureId: string
  bands: readonly FeatureMaskBand[]
  meshBands: ReadonlyMap<string, readonly FeatureMaskBand[]>
  matrices: ReadonlyMap<string, Matrix4>
  notes: string | null
}

const MIN_DETERMINANT = 1e-12

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function requireFinite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Feature mask ' + label + ' must be a finite number')
  return value
}

function validateBandsList(rawBands: unknown, context: string): readonly FeatureMaskBand[] {
  if (!Array.isArray(rawBands) || rawBands.length === 0)
    throw new Error('Feature mask ' + context + ' needs at least one axial band')
  if (rawBands.length > FEATURE_MASK_BAND_CAPACITY)
    throw new Error('Feature mask ' + context + ' supports at most ' + FEATURE_MASK_BAND_CAPACITY + ' bands')
  const bands = rawBands.map(band => {
    if (!Array.isArray(band) || band.length !== 2)
      throw new Error('Each feature mask band must be [yMin, yMax] in shaft-datum mm')
    const yMin = requireFinite(band[0], 'band yMin')
    const yMax = requireFinite(band[1], 'band yMax')
    if (yMin >= yMax)
      throw new Error('Feature mask band must be non-degenerate (yMin < yMax), got [' + yMin + ', ' + yMax + ']')
    return [yMin, yMax] as const
  })
  for (let i = 1; i < bands.length; i++)
    if (bands[i][0] < bands[i - 1][1])
      throw new Error('Feature mask bands must be sorted ascending without overlap')
  return bands
}

/** Fail-closed contract validation; exact mesh coverage when ids are supplied. */
export function validateFeatureMaskContract(contract: unknown, expectedMeshIds?: readonly string[]): ValidatedFeatureMask {
  if (!isRecord(contract)) throw new Error('Feature mask contract must be an object')
  if (contract.version !== FEATURE_MASK_VERSION)
    throw new Error('Feature mask contract version must be "' + FEATURE_MASK_VERSION + '"')
  const featureId = contract.featureId
  if (typeof featureId !== 'string' || !featureId)
    throw new Error('Feature mask contract needs a non-empty featureId')
  const bands = validateBandsList(contract.bands, 'contract')
  const rawMatrices = contract.objectToShaft
  if (!isRecord(rawMatrices) || Object.keys(rawMatrices).length === 0)
    throw new Error('Feature mask contract needs objectToShaft matrices for every covered mesh')
  const matrices = new Map<string, Matrix4>()
  for (const [meshId, value] of Object.entries(rawMatrices)) {
    if (!meshId) throw new Error('Feature mask matrix keys must be mesh uuids')
    let matrix: Matrix4
    if (value instanceof Matrix4) matrix = value.clone()
    else if (Array.isArray(value) && value.length === 16) {
      matrix = new Matrix4()
      for (let i = 0; i < 16; i++) matrix.elements[i] = requireFinite(value[i], 'matrix ' + meshId + '[' + i + ']')
    } else throw new Error('Feature mask matrix for ' + meshId + ' must be a Matrix4 or a 16-entry column-major array')
    const determinant = matrix.determinant()
    if (!Number.isFinite(determinant) || Math.abs(determinant) < MIN_DETERMINANT)
      throw new Error('Feature mask matrix for ' + meshId + ' is not invertible (determinant ' + determinant + ')')
    matrices.set(meshId, matrix)
  }
  const meshBands = new Map<string, readonly FeatureMaskBand[]>()
  if (contract.meshBands !== undefined) {
    if (!isRecord(contract.meshBands)) throw new Error('Feature mask meshBands must be an object when provided')
    for (const [meshId, rawMeshBands] of Object.entries(contract.meshBands)) {
      if (!matrices.has(meshId))
        throw new Error('Feature mask meshBands references unknown mesh ' + meshId)
      meshBands.set(meshId, validateBandsList(rawMeshBands, 'meshBands[' + meshId + ']'))
    }
  }
  if (expectedMeshIds) {
    const expected = new Set(expectedMeshIds)
    if (expected.size === 0) throw new Error('Feature mask coverage requires at least one selected mesh')
    for (const meshId of expected)
      if (!matrices.has(meshId))
        throw new Error('Feature mask contract is missing an objectToShaft matrix for selected mesh ' + meshId)
    for (const meshId of matrices.keys())
      if (!expected.has(meshId))
        throw new Error('Feature mask contract covers unexpected mesh ' + meshId + ' (stale contract)')
  }
  return { version: FEATURE_MASK_VERSION, featureId, bands, meshBands, matrices,
    notes: typeof contract.notes === 'string' ? contract.notes : null }
}

/**
 * Compute live per-mesh objectToShaft matrices (studyToShaftLocal * rootInverse * mesh.matrixWorld)
 * and build authenticated contracts for inputSunTeeth and inputSixfold.
 */
export function buildAuthenticatedInputFeatureContracts(
  studyRoot: Object3D,
  meshes: { inputSunTeeth: readonly Mesh[]; inputSixfold: readonly Mesh[] },
  mode: InputFeatureBandMode = 'variantFull',
): { inputSunTeeth: FeatureMaskContract; inputSixfold: FeatureMaskContract } {
  studyRoot.updateWorldMatrix(true, true)
  const rootInverse = new Matrix4().copy(studyRoot.matrixWorld).invert()
  const toShaft = studyToShaftLocal(new Matrix4())
  const computeMatrices = (list: readonly Mesh[]) => {
    const out: Record<string, Matrix4> = {}
    for (const mesh of list) {
      mesh.updateWorldMatrix(true, false)
      out[mesh.uuid] = new Matrix4().multiplyMatrices(rootInverse, mesh.matrixWorld).premultiply(toShaft)
    }
    return out
  }
  const teethMatrices = computeMatrices(meshes.inputSunTeeth)
  const sixfoldMatrices = computeMatrices(meshes.inputSixfold)
  const teethMeshBands: Record<string, readonly FeatureMaskBand[]> = {}
  for (const mesh of meshes.inputSunTeeth) {
    const isSource = mesh.userData.partNumber === 'P001835'
    teethMeshBands[mesh.uuid] = mode === 'sharedFunctional'
      ? AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.sharedFunctional
      : isSource
        ? AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.sourceFullShaping
        : AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.studyFullHob
  }
  return {
    inputSunTeeth: {
      version: FEATURE_MASK_VERSION,
      featureId: 'inputSunTeeth',
      bands: AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.sharedFunctional,
      meshBands: teethMeshBands,
      objectToShaft: teethMatrices,
      notes: mode === 'sharedFunctional'
        ? 'Authenticated shared 10-tooth functional band [3.174827, 9.524858] mm (geometry-report.json)'
        : 'Authenticated variant-specific full tooth bands: source P001835 [3.174827, 9.789711] mm, study approvedshaft [3.174827, 13.938684] mm (geometry-report.json)',
    },
    inputSixfold: {
      version: FEATURE_MASK_VERSION,
      featureId: 'inputSixfold',
      bands: AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSixfold.sharedFull,
      objectToShaft: sixfoldMatrices,
      notes: 'Authenticated shared 6-flat far-end feature band [61.109647, 71.523950] mm (geometry-report.json)',
    },
  }
}

export type FeatureMaskFragment = { kind: 'discard' } | { kind: 'rgb'; expression: string }

export interface FeatureMaskShaderPatch {
  vertexDeclarations: string
  vertexBody: string
  fragmentDeclarations: string
  fragmentBody: string
  uniforms: Record<string, { value: unknown }>
  cacheKeySuffix: string
}

/**
 * Build the GLSL patch for one mesh's materials. Band values are uniforms, so
 * masks with equal capacity and fragment kind share programs; only the
 * fragment kind, override expression, and capacity are compile-time and live
 * in the cache key. Unused uniform slots are (0, 0) and can never match a
 * non-degenerate band, so a stray count cannot widen the mask.
 */
export function createFeatureMaskShaderPatch(mask: ValidatedFeatureMask, meshId: string, fragment: FeatureMaskFragment,
  capacity: number = FEATURE_MASK_BAND_CAPACITY): FeatureMaskShaderPatch {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 16)
    throw new Error('Feature mask band capacity must be an integer in [1, 16]')
  const activeBands = mask.meshBands.get(meshId) ?? mask.bands
  if (activeBands.length > capacity)
    throw new Error('Feature mask for ' + mask.featureId + ' has more bands than the shader capacity')
  const matrix = mask.matrices.get(meshId)
  if (!matrix) throw new Error('Feature mask for ' + mask.featureId + ' has no objectToShaft matrix for mesh ' + meshId)
  const override = fragment.kind === 'rgb' ? fragment.expression : null
  if (fragment.kind === 'rgb' && (!override || !override.trim()))
    throw new Error('Feature mask rgb override needs a non-empty GLSL expression')
  const bands = new Float32Array(capacity * 2)
  for (const [index, band] of activeBands.entries()) { bands[index * 2] = band[0]; bands[index * 2 + 1] = band[1] }
  return {
    vertexDeclarations: 'uniform mat4 uJgFeatureToShaft;\nvarying vec3 jgFeatureShaftLocal;\n',
    // Original object-space position mapped once per vertex into the
    // shaft-datum frame. The progression hook may displace the transformed
    // variable afterwards, but axial Y is preserved, so bands stay datum-bound.
    vertexBody: '\n  jgFeatureShaftLocal = (uJgFeatureToShaft * vec4(position, 1.0)).xyz;\n',
    fragmentDeclarations:
      'uniform vec2 uJgFeatureBands[' + capacity + '];\n' +
      'uniform int uJgFeatureBandCount;\n' +
      'varying vec3 jgFeatureShaftLocal;\n' +
      'bool jgFeatureInside() {\n' +
      '  for (int jgfmBand = 0; jgfmBand < ' + capacity + '; jgfmBand++) {\n' +
      '    if (jgfmBand >= uJgFeatureBandCount) break;\n' +
      '    vec2 jgfmBandRange = uJgFeatureBands[jgfmBand];\n' +
      '    if (jgFeatureShaftLocal.y >= jgfmBandRange.x && jgFeatureShaftLocal.y <= jgfmBandRange.y) return true;\n' +
      '  }\n' +
      '  return false;\n' +
      '}\n',
    fragmentBody: override
      ? '\n  if (jgFeatureInside()) gl_FragColor.rgb = ' + override + ';\n'
      : '\n  if (jgFeatureInside()) discard;\n',
    uniforms: {
      uJgFeatureToShaft: { value: matrix },
      uJgFeatureBands: { value: bands },
      uJgFeatureBandCount: { value: activeBands.length },
    },
    cacheKeySuffix: 'jgfm-v1|' + (override ? 'rgb(' + override + ')' : 'discard') + '|cap' + capacity,
  }
}

/** Insert diagnostic statements as the last statements of a shader's main. */
export function insertBeforeFinalBrace(source: string, body: string): string {
  const end = source.lastIndexOf('}')
  if (end < 0) throw new Error('Feature mask shader patch requires a shader main with a closing brace')
  return source.slice(0, end) + body + source.slice(end)
}

/**
 * Clone one original material with the region patch appended AFTER its own
 * onBeforeCompile hook (progression etc.), preserving the entire original
 * vertex/fragment path - discards, clipping, maps, alpha, depth flags, side,
 * blending - and adding only the guarded statements.
 */
export function createFeatureMaskedMaterial(original: Material, patch: FeatureMaskShaderPatch): Material {
  const clone = original.clone()
  const hook = original.onBeforeCompile
  if (clone instanceof ShaderMaterial) {
    Object.assign(clone.uniforms, patch.uniforms)
  }
  clone.onBeforeCompile = (shader, renderer) => {
    hook.call(clone, shader, renderer)
    shader.vertexShader = patch.vertexDeclarations + insertBeforeFinalBrace(shader.vertexShader, patch.vertexBody)
    shader.fragmentShader = patch.fragmentDeclarations + insertBeforeFinalBrace(shader.fragmentShader, patch.fragmentBody)
    Object.assign(shader.uniforms, patch.uniforms)
  }
  const baseKey = original.customProgramCacheKey()
  clone.customProgramCacheKey = () => baseKey + '|' + patch.cacheKeySuffix
  clone.needsUpdate = true
  return clone
}
