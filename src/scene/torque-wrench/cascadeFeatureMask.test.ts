import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Matrix4, Mesh, MeshBasicMaterial, ShaderMaterial, Vector3 } from 'three'
import {
  AUTHENTICATED_SHAFT_FEATURE_BANDS, FEATURE_MASK_AXIS, FEATURE_MASK_BAND_CAPACITY, FEATURE_MASK_VERSION,
  buildAuthenticatedInputFeatureContracts, createFeatureMaskedMaterial, createFeatureMaskShaderPatch, insertBeforeFinalBrace,
  validateFeatureMaskContract,
  type FeatureMaskContract, type ValidatedFeatureMask,
} from './cascadeFeatureMask'
import { shaftLocalToStudy } from '../inspection/shaft/frame'

// Synthetic fixture values only: these tests prove contract/mask logic and
// shader-string behavior, never CAD feature bounds.
const TEST_BAND: [number, number] = [10, 20]
const IDENTITY_16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

const validContract = (over: Partial<FeatureMaskContract> = {}): FeatureMaskContract => ({
  version: FEATURE_MASK_VERSION,
  featureId: 'inputSixfold',
  bands: [TEST_BAND],
  objectToShaft: { 'mesh-a': IDENTITY_16 },
  notes: 'synthetic test fixture',
  ...over,
})

const validMask = (over: Partial<FeatureMaskContract> = {}): ValidatedFeatureMask =>
  validateFeatureMaskContract(validContract(over), ['mesh-a'])

describe('cascadeFeatureMask v1', () => {
  it('gates on the axial axis and normalizes matrices to copied Matrix4 instances', () => {
    expect(FEATURE_MASK_AXIS).toBe('y')
    const source = new Matrix4().makeTranslation(1, 2, 3)
    const mask = validateFeatureMaskContract(validContract({ objectToShaft: { 'mesh-a': source } }), ['mesh-a'])
    expect(mask.version).toBe(FEATURE_MASK_VERSION)
    expect(mask.bands).toEqual([TEST_BAND])
    expect(mask.notes).toBe('synthetic test fixture')
    const matrix = mask.matrices.get('mesh-a')!
    expect(matrix).not.toBe(source)
    expect(matrix.elements).toEqual(source.elements)
    source.makeTranslation(9, 9, 9)
    expect(matrix.elements[12]).toBe(1)
  })

  it('rejects wrong versions, degenerate bounds, and broken transforms fail-closed', () => {
    expect(() => validateFeatureMaskContract(validContract({ version: 'v0' }))).toThrow(/version/)
    expect(() => validateFeatureMaskContract(validContract({ featureId: '' }))).toThrow(/featureId/)
    expect(() => validateFeatureMaskContract('nope')).toThrow(/object/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [] }))).toThrow(/at least one/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [[1, 1]] }))).toThrow(/non-degenerate/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [[20, 10]] }))).toThrow(/non-degenerate/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [[Number.NaN, 2]] }))).toThrow(/finite/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [[0, Number.POSITIVE_INFINITY]] }))).toThrow(/finite/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [[0, 5], [4, 9]] }))).toThrow(/overlap/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [[5, 6], [0, 1]] }))).toThrow(/sorted/)
    expect(() => validateFeatureMaskContract(validContract({
      bands: Array.from({ length: FEATURE_MASK_BAND_CAPACITY + 1 }, (_, i) => [i * 10, i * 10 + 1] as [number, number]),
    }))).toThrow(/at most/)
    expect(() => validateFeatureMaskContract(validContract({ bands: [[0, 1], [2, 3]] }))).not.toThrow()
    expect(() => validateFeatureMaskContract(validContract({ objectToShaft: { 'mesh-a': [1, 0, 0] } }))).toThrow(/16-entry/)
    expect(() => validateFeatureMaskContract(validContract({
      objectToShaft: { 'mesh-a': IDENTITY_16.map((v, i) => (i === 12 ? Number.NaN : v)) },
    }))).toThrow(/finite/)
    expect(() => validateFeatureMaskContract(validContract({
      objectToShaft: { 'mesh-a': new Array(16).fill(0) },
    }))).toThrow(/invertible/)
    expect(() => validMask({ objectToShaft: { 'mesh-a': new Matrix4().makeScale(2, 2, 2) } })).not.toThrow()
  })

  it('enforces exact mesh coverage: no missing meshes, no stale contracts', () => {
    expect(() => validateFeatureMaskContract(validContract(), ['mesh-a', 'mesh-b'])).toThrow(/missing/)
    expect(() => validateFeatureMaskContract(validContract({
      objectToShaft: { 'mesh-a': IDENTITY_16, 'mesh-z': IDENTITY_16 },
    }), ['mesh-a'])).toThrow(/unexpected/)
    expect(() => validateFeatureMaskContract(validContract(), [])).toThrow(/at least one selected mesh/)
    expect(() => validateFeatureMaskContract(validContract(), ['mesh-a'])).not.toThrow()
  })

  it('scopes fragment statements to the region guard and never touches other pixels', () => {
    const removal = createFeatureMaskShaderPatch(validMask(), 'mesh-a', { kind: 'discard' })
    expect(removal.fragmentBody.trim()).toBe('if (jgFeatureInside()) discard;')
    expect(removal.fragmentBody).not.toContain('gl_FragColor')
    const white = createFeatureMaskShaderPatch(validMask(), 'mesh-a', { kind: 'rgb', expression: 'vec3(1.0)' })
    expect(white.fragmentBody).toContain('if (jgFeatureInside()) gl_FragColor.rgb = vec3(1.0);')
    expect(white.vertexBody).toContain('jgFeatureShaftLocal = (uJgFeatureToShaft * vec4(position, 1.0)).xyz;')
    expect(white.vertexDeclarations).not.toContain('position')
    expect(white.fragmentDeclarations).toContain('bool jgFeatureInside()')
    expect(() => createFeatureMaskShaderPatch(validMask(), 'mesh-a', { kind: 'rgb', expression: '  ' })).toThrow(/non-empty/)
    expect(() => createFeatureMaskShaderPatch(validMask(), 'mesh-unknown', { kind: 'discard' })).toThrow(/mesh-unknown/)
  })

  it('passes bands as uniforms and keys programs only on capacity and fragment kind', () => {
    const mask = validMask()
    const wide = validMask({ bands: [[-5, 2.5], [30, 31]] })
    const plain = createFeatureMaskShaderPatch(mask, 'mesh-a', { kind: 'discard' })
    const differentBands = createFeatureMaskShaderPatch(wide, 'mesh-a', { kind: 'discard' })
    expect(plain.cacheKeySuffix).toBe(differentBands.cacheKeySuffix)
    expect(differentBands.uniforms.uJgFeatureBandCount).toEqual({ value: 2 })
    const plainBands = plain.uniforms.uJgFeatureBands.value as Float32Array
    expect(plainBands).toBeInstanceOf(Float32Array)
    expect(Array.from(plainBands.slice(0, 2))).toEqual(TEST_BAND)
    expect(plainBands[2 * FEATURE_MASK_BAND_CAPACITY - 1]).toBe(0)
    expect(plain.uniforms.uJgFeatureToShaft.value).toBe(mask.matrices.get('mesh-a'))
    const white = createFeatureMaskShaderPatch(mask, 'mesh-a', { kind: 'rgb', expression: 'vec3(1.0)' })
    const premultiplied = createFeatureMaskShaderPatch(mask, 'mesh-a', { kind: 'rgb', expression: 'vec3(gl_FragColor.a)' })
    const capped = createFeatureMaskShaderPatch(mask, 'mesh-a', { kind: 'discard' }, 8)
    expect(new Set([plain.cacheKeySuffix, white.cacheKeySuffix, premultiplied.cacheKeySuffix, capped.cacheKeySuffix]).size).toBe(4)
  })

  it('clones materials, chains the original hook, and injects per-mesh uniforms', () => {
    const hookCalls: string[] = []
    const original = new MeshBasicMaterial({ color: 0x112233, depthWrite: true })
    original.onBeforeCompile = shader => { hookCalls.push('hook'); void shader }
    const mask = validMask()
    const patch = createFeatureMaskShaderPatch(mask, 'mesh-a', { kind: 'rgb', expression: 'vec3(1.0)' })
    const clone = createFeatureMaskedMaterial(original, patch)
    expect(clone).not.toBe(original)
    expect(clone.depthWrite).toBe(original.depthWrite)
    const fakeShader = {
      vertexShader: 'void main() {\n  gl_Position = vec4(0.0);\n}',
      fragmentShader: 'void main() {\n  gl_FragColor = vec4(1.0);\n}',
      uniforms: {} as Record<string, unknown>,
    }
    ;(clone.onBeforeCompile as unknown as (shader: typeof fakeShader, renderer: unknown) => void)(fakeShader, null)
    expect(hookCalls).toEqual(['hook'])
    expect(fakeShader.vertexShader.startsWith(patch.vertexDeclarations)).toBe(true)
    expect(fakeShader.vertexShader).toContain('jgFeatureShaftLocal = (uJgFeatureToShaft * vec4(position, 1.0)).xyz;')
    expect(fakeShader.vertexShader.indexOf('void main()')).toBeLessThan(fakeShader.vertexShader.indexOf('jgFeatureShaftLocal ='))
    expect(fakeShader.vertexShader.trimEnd().endsWith('}')).toBe(true)
    expect(fakeShader.fragmentShader.startsWith(patch.fragmentDeclarations)).toBe(true)
    expect(fakeShader.fragmentShader).toContain('if (jgFeatureInside()) gl_FragColor.rgb = vec3(1.0);')
    const uniforms = fakeShader.uniforms as Record<string, { value: unknown }>
    expect(uniforms.uJgFeatureToShaft.value).toBe(mask.matrices.get('mesh-a'))
    expect(uniforms.uJgFeatureBandCount.value).toBe(1)
    expect(clone.customProgramCacheKey()).toBe(original.customProgramCacheKey() + '|' + patch.cacheKeySuffix)
  })

  it('rejects brace-less shader mains so patches fail loud instead of landing outside main', () => {
    expect(insertBeforeFinalBrace('void main() {\n  a();\n}', '\n  b();\n')).toBe('void main() {\n  a();\n\n  b();\n}')
    expect(() => insertBeforeFinalBrace('no braces here', 'x')).toThrow(/closing brace/)
  })

  it('builds authenticated input contracts with live world registration stripping and variant meshBands', () => {
    const studyRoot = new Group()
    studyRoot.matrixAutoUpdate = false
    // Apply non-trivial world registration (translation + rotation)
    studyRoot.matrix.makeRotationX(0.4).setPosition(-0.077, 0.012, 0.021)
    const studyPart = new Group()
    studyPart.name = 'study-approvedshaft'
    studyPart.rotation.z = -1.25
    studyRoot.add(studyPart)
    const geom = new BoxGeometry(0.01, 0.01, 0.07)
    const mat = new MeshBasicMaterial()
    const studyMesh = new Mesh(geom, mat)
    studyPart.add(studyMesh)
    const sourceMesh = new Mesh(geom, mat)
    sourceMesh.userData.partNumber = 'P001835'
    // Coincident with studyPart in world space
    studyRoot.updateWorldMatrix(true, true)
    sourceMesh.matrixAutoUpdate = false
    sourceMesh.matrix.copy(studyMesh.matrixWorld)
    sourceMesh.updateWorldMatrix(true, false)

    const meshes = { inputSunTeeth: [studyMesh, sourceMesh], inputSixfold: [studyMesh, sourceMesh] }
    const variantContracts = buildAuthenticatedInputFeatureContracts(studyRoot, meshes, 'variantFull')
    const teethMask = validateFeatureMaskContract(variantContracts.inputSunTeeth, [studyMesh.uuid, sourceMesh.uuid])
    const sixfoldMask = validateFeatureMaskContract(variantContracts.inputSixfold, [studyMesh.uuid, sourceMesh.uuid])

    expect(teethMask.meshBands.get(studyMesh.uuid)).toEqual(AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.studyFullHob)
    expect(teethMask.meshBands.get(sourceMesh.uuid)).toEqual(AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.sourceFullShaping)
    expect(sixfoldMask.bands).toEqual(AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSixfold.sharedFull)

    // Verify that any shaft-datum point (xMm, yMm, zMm) rotated by studyPart.rotation.z in study space
    // maps back to exact yMm under both studyMesh and sourceMesh objectToShaft matrices!
    const toStudy = shaftLocalToStudy(new Matrix4())
    for (const yMm of [0, 3.174827, 9.524858, 13.938684, 61.109647, 71.52395]) {
      const localStudyPt = new Vector3(4.2, yMm, -3.1).applyMatrix4(toStudy)
      // Because studyPart only rotates around study Z (which is -shaft Y), study Z is invariant under rotation.z
      const studyTransformed = localStudyPt.clone().applyMatrix4(teethMask.matrices.get(studyMesh.uuid)!)
      const sourceTransformed = localStudyPt.clone().applyMatrix4(teethMask.matrices.get(sourceMesh.uuid)!)
      expect(studyTransformed.y).toBeCloseTo(yMm, 9)
      expect(sourceTransformed.y).toBeCloseTo(yMm, 9)
    }

    const studyPatch = createFeatureMaskShaderPatch(teethMask, studyMesh.uuid, { kind: 'discard' })
    const sourcePatch = createFeatureMaskShaderPatch(teethMask, sourceMesh.uuid, { kind: 'discard' })
    expect(Array.from((studyPatch.uniforms.uJgFeatureBands.value as Float32Array).slice(0, 2))).toEqual([
      expect.closeTo(3.174827, 5),
      expect.closeTo(13.938684, 5),
    ])
    expect(Array.from((sourcePatch.uniforms.uJgFeatureBands.value as Float32Array).slice(0, 2))).toEqual([
      expect.closeTo(3.174827, 5),
      expect.closeTo(9.789711, 5),
    ])

    // Also verify ShaderMaterial uniform injection
    const shaderMat = new ShaderMaterial({
      vertexShader: 'void main() { gl_Position = vec4(position, 1.0); }',
      fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }',
    })
    const maskedShaderMat = createFeatureMaskedMaterial(shaderMat, studyPatch) as ShaderMaterial
    expect(maskedShaderMat.uniforms.uJgFeatureBandCount.value).toBe(1)
    geom.dispose()
    mat.dispose()
    shaderMat.dispose()
  })
})
