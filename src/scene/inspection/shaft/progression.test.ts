import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Color, Matrix3, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, ShaderLib, Vector3 } from 'three'
import ts from 'typescript'
import {
  applyProgression,
  createProgressionState,
  createProgressionUniforms,
  FACE_START_MM,
  HOBBING_FACE_END_MM,
  HOB_FINAL_YC_MM,
  HOB_INFEED_YC_MM,
  HOB_VISUAL_A_MM,
  HOB_VISUAL_R_MM,
  PROGRESSION_LAW_MARKER,
  PROGRESSION_NORMAL_MARKER,
  PROGRESSION_VERTEX_MARKER,
  progressedRadius,
  SHAFT_OD_MM,
  SHAFT_ROOT_MM,
  SHAFT_SPACES,
  SHAPING_FACE_END_MM,
  SPACE_CLOCK_RAD,
  SPACE_PITCH_RAD,
  STRESS_MARKER,
  hobFloorRadius,
  spaceIndexAt,
  writeProgressionUniforms,
  writeStressUniforms,
  setShaftTransform,
  type ProgressionState,
  makeStressOverlayMaterial,
  stressFieldAt,
  stressFieldGlsl,
} from './progression'
import { FOS_ATTEMPTS, FOS_CENTER_Y, FOS_MAX, FOS_REVISED, fosColor } from './fosPresentation'

const DEG = Math.PI / 180
const PROFILE_PATH = 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/profile-study.json'

interface ProfileStudy {
  angular_step_deg: number
  profiles: { legacy: Record<string, number[]>; approved: Record<string, number[]> }
}

const study = JSON.parse(readFileSync(resolve(process.cwd(), PROFILE_PATH), 'utf8')) as ProfileStudy

const shapingState = (depths: number[]): ProgressionState => {
  const state = createProgressionState()
  state.mode = 'shaping'
  for (let i = 0; i < SHAFT_SPACES; i++) state.spaceDepth[i] = depths[i % depths.length]
  return state
}
const minOf = (values: number[]): number => {
  let min = Infinity
  for (const value of values) if (value < min) min = value
  return min
}

describe('tooth-space clock', () => {
  it('resolves the nearest space index, including across the seam', () => {
    expect(spaceIndexAt(0)).toBe(0)
    expect(spaceIndexAt(SPACE_PITCH_RAD * 0.49)).toBe(0)
    expect(spaceIndexAt(SPACE_PITCH_RAD * 0.51)).toBe(1)
    expect(spaceIndexAt(-SPACE_PITCH_RAD * 0.1)).toBe(0)
    expect(spaceIndexAt(Math.PI)).toBe(5)
    expect(spaceIndexAt(2 * Math.PI - 1e-6)).toBe(0)
    expect(spaceIndexAt(SPACE_PITCH_RAD * 9.6)).toBe(0)
  })
  it('recovers SPACE_CLOCK_RAD from the profile-study legacy 6.0 polar data', () => {
    const profile = study.profiles.legacy['6.0']
    const samples = profile.length
    const stepDeg = study.angular_step_deg
    const min = minOf(profile)
    let max = -Infinity
    for (const value of profile) if (value > max) max = value
    const mid = (min + max) / 2
    let sumSin = 0
    let sumCos = 0
    for (let i = 0; i < samples; i++) {
      if (profile[i] < mid) continue
      // Fold into one pitch: the ten tips are equally spaced, so a full-circle mean cancels.
      const angle = i * stepDeg * DEG
      const folded = angle - Math.floor(angle / SPACE_PITCH_RAD) * SPACE_PITCH_RAD
      sumSin += Math.sin(folded)
      sumCos += Math.cos(folded)
    }
    const tipRad = Math.atan2(sumSin, sumCos)
    // Tooth tips sit half a pitch from the tooth-space centres.
    const raw = tipRad - SPACE_PITCH_RAD / 2 - SPACE_CLOCK_RAD
    const diff = raw - Math.round(raw / SPACE_PITCH_RAD) * SPACE_PITCH_RAD
    expect(Math.abs(diff)).toBeLessThan(0.5 * DEG)
    // The same section also confirms the measured OD/root the law is built on.
    expect(max).toBeCloseTo(SHAFT_OD_MM, 3)
    expect(min).toBeCloseTo(SHAFT_ROOT_MM, 3)
  })
})

describe('legacy shaping law', () => {
  const samples: Array<[number, number, number]> = []
  for (let y = FACE_START_MM; y <= SHAPING_FACE_END_MM + 1e-9; y += 0.137) {
    for (let a = 0; a < 12; a++) samples.push([SHAFT_ROOT_MM + 0.31, y, a * 0.31])
  }

  it('leaves every face-band sample unchanged at full depth', () => {
    const state = shapingState([1])
    for (const [r, y, a] of samples) expect(progressedRadius(r, y, a, state, 'legacy')).toBe(r)
  })
  it('fills the face band to OD at depth 0 and leaves the groove untouched', () => {
    const state = shapingState([0])
    for (const [, y, a] of samples) expect(progressedRadius(SHAFT_ROOT_MM + 0.31, y, a, state, 'legacy')).toBe(SHAFT_OD_MM)
    for (const y of [SHAPING_FACE_END_MM + 0.005, 10.41, 10.94, 13.0]) {
      const r = SHAFT_ROOT_MM + 0.42
      expect(progressedRadius(r, y, 0.3, state, 'legacy')).toBe(r)
    }
    expect(progressedRadius(SHAFT_OD_MM, 5, 0.3, state, 'legacy')).toBe(SHAFT_OD_MM)
  })
  it('cuts each space independently by its own depth', () => {
    const state = shapingState([0, 0.5, 1])
    const depth = (i: number) => [0, 0.5, 1][i % 3]
    const r = SHAFT_ROOT_MM + 0.4
    for (let i = 0; i < SHAFT_SPACES; i++) {
      const expected = Math.min(SHAFT_OD_MM, r + (1 - depth(i)) * (SHAFT_OD_MM - SHAFT_ROOT_MM))
      expect(progressedRadius(r, 5, i * SPACE_PITCH_RAD, state, 'legacy')).toBeCloseTo(expected, 9)
    }
  })
  it('does not apply to the approved shaft under the shaping mode', () => {
    const state = shapingState([0])
    expect(progressedRadius(SHAFT_ROOT_MM + 0.4, 5, 0, state, 'approved')).toBe(SHAFT_ROOT_MM + 0.4)
  })
  it('retains the previous partial depth ahead of the cutter during a repeated pass', () => {
    const state = shapingState([0.25])
    state.engagedSpace = 3
    state.spaceDepth[3] = 0.75
    state.engagedPreviousDepth = 0.25
    state.edgeY = 6
    const r = SHAFT_ROOT_MM + 0.1
    const angle = 3 * SPACE_PITCH_RAD
    const expected = (depth: number) => Math.min(SHAFT_OD_MM, r + (1 - depth) * (SHAFT_OD_MM - SHAFT_ROOT_MM))
    expect(progressedRadius(r, 5.99, angle, state, 'legacy')).toBe(expected(0.75))
    expect(progressedRadius(r, 6, angle, state, 'legacy')).toBe(expected(0.75))
    expect(progressedRadius(r, 6.01, angle, state, 'legacy')).toBe(expected(0.25))
    expect(progressedRadius(r, 6.01, 4 * SPACE_PITCH_RAD, state, 'legacy')).toBe(expected(0.25))
    // First-pass callers remain compatible without the optional prior-depth field.
    delete state.engagedPreviousDepth
    expect(progressedRadius(r, 6.01, angle, state, 'legacy')).toBe(SHAFT_OD_MM)
  })
  it('preserves the actual final legacy polar samples and restores blank stock across all spaces', () => {
    const final = shapingState([1])
    const blank = shapingState([0])
    const profile = study.profiles.legacy['6.0']
    for (let i = 0; i < profile.length; i++) {
      const r = profile[i]
      const azimuth = i * study.angular_step_deg * DEG
      expect(progressedRadius(r, 6, azimuth, final, 'legacy')).toBe(r)
      expect(progressedRadius(r, 6, azimuth, blank, 'legacy')).toBeCloseTo(SHAFT_OD_MM, 4)
    }
  })
})

describe('approved hobbing law', () => {
  it('reproduces the approved floor at final depth within 0.01 mm', () => {
    const errors: string[] = []
    for (const key of ['9.72', '10.92', '13.78']) {
      const approved = study.profiles.approved[key]
      const floor = hobFloorRadius(Number(key), HOB_FINAL_YC_MM, HOB_VISUAL_A_MM, HOB_VISUAL_R_MM)
      expect(Math.abs(floor - minOf(approved))).toBeLessThan(0.01)
      errors.push(key + ':' + Math.abs(floor - minOf(approved)).toFixed(6))
    }
    console.log('A4: approved floor absolute errors (y:mm) ' + errors.join(', ') + '; each <0.01 mm')
  })
  it('leaves the finished approved mesh within 0.01 mm at final yc', () => {
    const state = createProgressionState()
    state.mode = 'hobbing'
    state.hobYc = HOB_FINAL_YC_MM
    state.hobA = HOB_VISUAL_A_MM
    state.hobR = HOB_VISUAL_R_MM
    const step = study.angular_step_deg
    for (const key of ['9.72', '10.92', '13.78']) {
      const y = Number(key)
      const approved = study.profiles.approved[key]
      for (let i = 0; i < approved.length; i += 7) {
        const r = approved[i]
        const result = progressedRadius(r, y, i * step * DEG, state, 'approved')
        expect(result).toBeGreaterThanOrEqual(r - 1e-9)
        expect(Math.abs(result - r)).toBeLessThan(0.01)
      }
    }
  })
  it('starts as an uncut blank ahead of the hob and cuts behind it', () => {
    const state = createProgressionState()
    state.mode = 'hobbing'
    state.hobYc = HOB_INFEED_YC_MM
    state.hobA = HOB_VISUAL_A_MM
    state.hobR = HOB_VISUAL_R_MM
    expect(progressedRadius(SHAFT_ROOT_MM + 0.4, 6, 0.2, state, 'approved')).toBe(SHAFT_OD_MM)
    expect(progressedRadius(SHAFT_ROOT_MM + 0.4, 13.7, 0.2, state, 'approved')).toBe(SHAFT_OD_MM)
    // Outside the hobbing band the law never applies.
    expect(progressedRadius(SHAFT_ROOT_MM + 0.4, 13.9, 0.2, state, 'approved')).toBe(SHAFT_ROOT_MM + 0.4)
  })
})

describe('monotonicity and determinism', () => {
  it('applies the same law to zero and sub-micrometre radii at the canonical +X azimuth', () => {
    const shaping = shapingState([0.5])
    const hob = createProgressionState()
    hob.mode = 'hobbing'
    for (const r of [0, 0.0000005, 0.000001, 0.000002]) {
      expect(progressedRadius(r, 6, 0, shaping, 'legacy')).toBe(r + 0.5 * (SHAFT_OD_MM - SHAFT_ROOT_MM))
      expect(progressedRadius(r, 6, 0, hob, 'approved')).toBe(SHAFT_OD_MM)
      expect(progressedRadius(r, 20, 0, hob, 'approved')).toBe(r)
    }
  })
  it('is non-increasing in tooth-space depth', () => {
    const shallow = shapingState([0.2, 0.35, 0.5, 0.65])
    const deep = shapingState([0.6, 0.7, 0.8, 0.9])
    for (let y = FACE_START_MM; y <= SHAPING_FACE_END_MM + 1e-9; y += 0.21) {
      for (let i = 0; i < SHAFT_SPACES; i++) {
        const azimuth = i * SPACE_PITCH_RAD
        const r = SHAFT_ROOT_MM + 0.5
        const deepValue = progressedRadius(r, y, azimuth, deep, 'legacy')
        const shallowValue = progressedRadius(r, y, azimuth, shallow, 'legacy')
        expect(deepValue).toBeLessThanOrEqual(shallowValue + 1e-12)
      }
    }
  })
  it('is non-increasing in hob yc', () => {
    const state = createProgressionState()
    state.mode = 'hobbing'
    state.hobA = HOB_VISUAL_A_MM
    state.hobR = HOB_VISUAL_R_MM
    const r = SHAFT_ROOT_MM + 0.35
    for (const y of [5.0, 9.6, 12.4]) {
      let previous = Infinity
      for (let yc = HOB_INFEED_YC_MM; yc <= HOB_FINAL_YC_MM + 1e-9; yc += 0.25) {
        state.hobYc = yc
        const value = progressedRadius(r, y, 0.4, state, 'approved')
        expect(value).toBeLessThanOrEqual(previous + 1e-12)
        previous = value
      }
    }
  })
  it('returns identical values for any seek order', () => {
    const state = shapingState([0.1, 0.9, 0.5])
    state.engagedSpace = 1
    state.edgeY = 6.5
    let seed = 0x51ed270b
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    const inputs: Array<[number, number, number]> = Array.from({ length: 400 }, () => [
      SHAFT_ROOT_MM + next() * (SHAFT_OD_MM - SHAFT_ROOT_MM),
      FACE_START_MM + next() * (SHAPING_FACE_END_MM - FACE_START_MM),
      next() * Math.PI * 2,
    ])
    const expected = new Map<number, number>()
    inputs.forEach((value, index) => expected.set(index, progressedRadius(value[0], value[1], value[2], state, 'legacy')))
    const order = inputs.map((_, index) => index).sort(() => next() - 0.5)
    for (const index of order) {
      const [r, y, a] = inputs[index]
      expect(progressedRadius(r, y, a, state, 'legacy')).toBe(expected.get(index))
    }
  })
  it('allocates nothing and does not write to the state', () => {
    const state = shapingState([0, 0.4, 0.8])
    const snapshot = Array.from(state.spaceDepth)
    const counts = { arrays: 0, typed: 0 }
    const OriginalArray = globalThis.Array
    const OriginalFloat32Array = globalThis.Float32Array
    const globals = globalThis as unknown as { Array: unknown; Float32Array: unknown }
    globals.Array = new Proxy(OriginalArray, {
      construct(target, args) {
        counts.arrays += 1
        return Reflect.construct(target, args)
      },
    })
    globals.Float32Array = new Proxy(OriginalFloat32Array, {
      construct(target, args) {
        counts.typed += 1
        return Reflect.construct(target, args)
      },
    })
    const hob = createProgressionState()
    hob.mode = 'hobbing'
    hob.hobYc = HOB_FINAL_YC_MM
    const uniforms = createProgressionUniforms()
    const depthIdentity = uniforms.uSpaceDepth.value
    const shaftMatrixIdentity = uniforms.uShaftMatrix.value
    const inverseIdentity = uniforms.uShaftInverse.value
    const normalIdentity = uniforms.uShaftNormalMatrix.value
    const transform = new Matrix4().makeScale(1000, 1000, 1000)
    const stress = { kind: 'cool' as const, mix: 0.3, scanProgress: 0.6, yMin: 9, yMax: 13, rMax: 6, centerY: 13.4, hotspotFos: 2.55, bodyFos: 3 }
    // Factories allocate at setup time; only the samplers and writers run in the guarded loop.
    counts.arrays = 0
    counts.typed = 0
    let checksum = 0
    try {
      for (let i = 0; i < 5000; i++) {
        checksum += progressedRadius(SHAFT_ROOT_MM + 0.3, FACE_START_MM + (i % 97) * 0.07, (i % 10) * 0.31, state, 'legacy')
        checksum += progressedRadius(SHAFT_ROOT_MM + 0.3, 6 + (i % 53) * 0.13, (i % 7) * 0.4, hob, 'approved')
        writeProgressionUniforms(uniforms, state, 'legacy')
        writeStressUniforms(uniforms, stress)
        setShaftTransform(uniforms, transform)
      }
    } finally {
      globals.Array = OriginalArray
      globals.Float32Array = OriginalFloat32Array
    }
    expect(Number.isFinite(checksum)).toBe(true)
    expect(counts.arrays).toBe(0)
    expect(counts.typed).toBe(0)
    expect(Array.from(state.spaceDepth)).toEqual(snapshot)
    expect(uniforms.uSpaceDepth.value).toBe(depthIdentity)
    expect(uniforms.uShaftMatrix.value).toBe(shaftMatrixIdentity)
    expect(uniforms.uShaftInverse.value).toBe(inverseIdentity)
    expect(uniforms.uShaftNormalMatrix.value).toBe(normalIdentity)
  })
  it('has no constructor, array-literal or object-literal allocations in per-call function bodies', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/scene/inspection/shaft/progression.ts'), 'utf8')
    const ast = ts.createSourceFile('progression.ts', source, ts.ScriptTarget.Latest, true)
    const names = new Set(['progressedRadius', 'hobFloorRadius', 'spaceIndexAt', 'writeProgressionUniforms', 'writeStressUniforms', 'setShaftTransform'])
    const checked: string[] = []
    for (const node of ast.statements) {
      if (!ts.isFunctionDeclaration(node) || !node.name || !node.body || !names.has(node.name.text)) continue
      checked.push(node.name.text)
      const visit = (child: ts.Node) => {
        expect(ts.isNewExpression(child) || ts.isArrayLiteralExpression(child) || ts.isObjectLiteralExpression(child), child.getText(ast)).toBe(false)
        child.forEachChild(visit)
      }
      visit(node.body)
    }
    expect(checked).toHaveLength(names.size)
    console.log('A4: six per-call functions allocation-free by source audit; 5000 sampled/written calls preserve caller-owned buffers')
  })
})

describe('shader patch', () => {
  const VERTEX_SRC = ['#include <common>', 'void main() {', '#include <beginnormal_vertex>', '#include <begin_vertex>', '}'].join('\n')
  const FRAGMENT_SRC = ['#include <common>', 'void main() {', '#include <emissivemap_fragment>', '}'].join('\n')
  interface ShaderStub { uniforms: Record<string, unknown>; vertexShader: string; fragmentShader: string }

  it('injects the progression law, normal blend and stress overlay markers', () => {
    const material = new MeshStandardMaterial()
    const uniforms = createProgressionUniforms()
    applyProgression(material, uniforms)
    const shader: ShaderStub = { uniforms: {}, vertexShader: VERTEX_SRC, fragmentShader: FRAGMENT_SRC }
    const hook = material.onBeforeCompile as unknown as (s: ShaderStub, r: unknown) => void
    hook(shader, {})
    expect(shader.vertexShader).toContain(PROGRESSION_LAW_MARKER)
    expect(shader.vertexShader).toContain(PROGRESSION_NORMAL_MARKER)
    expect(shader.vertexShader).toContain(PROGRESSION_VERTEX_MARKER)
    expect(shader.vertexShader).toContain('uSpaceDepth[10]')
    expect(shader.vertexShader).toContain('#include <beginnormal_vertex>')
    expect(shader.vertexShader).toContain('jgProgressedRadius(jgNormalLocal.xyz, jgNormalClamp)')
    expect(shader.vertexShader).toContain('jgProgressedRadius(jgLocal4.xyz, jgClamp)')
    expect(shader.vertexShader).toContain('jgNew > jgRadius + 0.000001')
    expect(shader.vertexShader).not.toContain('jgRadius > 0.000001 && jgMode')
    expect(shader.vertexShader).toContain('jgRadius > 0.0 ? atan(jgLocal.z - uShaftAxis.z, jgLocal.x - uShaftAxis.x) : 0.0')
    // The registered bundle places the shaft away from the local origin, so
    // every radial law measures from the axis rather than from the origin.
    expect(shader.vertexShader).toContain('uShaftAxis')
    expect(shader.vertexShader).toContain('length(jgLocal.xz - uShaftAxis.xz)')
    // Radial scaling and the normal's radial direction are both relative to the axis (1B-2).
    expect(shader.vertexShader).toContain('(jgLocal4.xz - uShaftAxis.xz) * jgScale + uShaftAxis.xz')
    expect(shader.vertexShader).toContain(': uShaftAxis.xz + vec2(jgNewRadius, 0.0)')
    expect(shader.vertexShader).toContain('vec2 jgNormalRel = jgNormalLocal.xz - uShaftAxis.xz')
    expect(shader.vertexShader).not.toContain('jgLocal4.x * jgScale')
    expect(shader.fragmentShader).toContain(STRESS_MARKER)
    expect(shader.fragmentShader).toContain('totalEmissiveRadiance')
    expect(shader.fragmentShader).toContain('uStressKind > 0.5 && uStressMix > 0.001')
    expect(shader.uniforms.uHobYc).toBe(uniforms.uHobYc)
    expect(typeof material.customProgramCacheKey()).toBe('string')
    material.dispose()
  })
  it('patches actual installed standard and physical shader sources with vec3-compatible calls', () => {
    for (const material of [new MeshStandardMaterial(), new MeshPhysicalMaterial()]) {
      const uniforms = createProgressionUniforms()
      applyProgression(material, uniforms)
      const src = material instanceof MeshPhysicalMaterial ? ShaderLib.physical : ShaderLib.standard
      const shader: ShaderStub = { uniforms: {}, vertexShader: src.vertexShader, fragmentShader: src.fragmentShader }
      const hook = material.onBeforeCompile as unknown as (s: ShaderStub, r: unknown) => void
      hook(shader, {})
      expect(shader.vertexShader).toContain(PROGRESSION_VERTEX_MARKER)
      expect(shader.vertexShader).not.toContain('#include <begin_vertex>')
      expect(shader.vertexShader).not.toMatch(/jgProgressedRadius\(jg(?:NormalLocal|Local4),/)
      for (const key of ['uStressKind', 'uStressMix', 'uStressScanProgress', 'uStressYMin', 'uStressYMax', 'uStressRMax']) {
        expect(shader.uniforms[key]).toBe(uniforms[key as keyof typeof uniforms])
      }
      material.dispose()
    }
  })
  it('maps metre glTF -Z back to CAD +Y millimetres once, with consistent radial normals', () => {
    const uniforms = createProgressionUniforms()
    const matrix = new Matrix4().makeRotationX(Math.PI / 2).scale(new Vector3(1000, 1000, 1000))
    setShaftTransform(uniforms, matrix)
    const objectPoint = new Vector3(0.004, 0.003, -0.009)
    const shaftPoint = objectPoint.clone().applyMatrix4(uniforms.uShaftMatrix.value)
    expect(shaftPoint.x).toBeCloseTo(4, 9)
    expect(shaftPoint.y).toBeCloseTo(9, 9)
    expect(shaftPoint.z).toBeCloseTo(3, 9)
    expect(shaftPoint.clone().applyMatrix4(uniforms.uShaftInverse.value).distanceTo(objectPoint)).toBeLessThan(1e-12)
    const expected = new Matrix3().getNormalMatrix(matrix.clone().invert())
    expect(uniforms.uShaftNormalMatrix.value.elements).toEqual(expected.elements)
  })
  it('writes the progression and stress uniforms in place', () => {
    const uniforms = createProgressionUniforms()
    const state = createProgressionState()
    state.mode = 'hobbing'
    state.hobYc = 4.2
    state.hobA = 10.2
    state.hobR = 6
    state.spaceDepth[3] = 0.75
    state.engagedPreviousDepth = 0.25
    writeProgressionUniforms(uniforms, state)
    expect(uniforms.uProgressionMode.value).toBe(2)
    expect(uniforms.uShaftKind.value).toBe(1)
    expect(uniforms.uFaceEnd.value).toBe(HOBBING_FACE_END_MM)
    expect(uniforms.uSpaceDepth.value[3]).toBeCloseTo(0.75, 6)
    expect(uniforms.uEngagedPreviousDepth.value).toBe(0.25)
    const legacy = createProgressionState()
    legacy.mode = 'shaping'
    writeProgressionUniforms(uniforms, legacy, 'legacy')
    expect(uniforms.uProgressionMode.value).toBe(1)
    expect(uniforms.uShaftKind.value).toBe(0)
    expect(uniforms.uFaceEnd.value).toBe(SHAPING_FACE_END_MM)
    expect(uniforms.uEngagedPreviousDepth.value).toBe(0)
    for (const kind of ['warm', 'cool', 'none'] as const) {
      writeStressUniforms(uniforms, { kind, mix: 0.4, scanProgress: 0.8, yMin: 9.9, yMax: 13.78, rMax: 6.074, centerY: 10.41, hotspotFos: 0.55, bodyFos: 3 })
      expect(uniforms.uStressKind.value).toBe({ none: 0, warm: 1, cool: 2 }[kind])
      expect(uniforms.uStressMix.value).toBe(0.4)
      expect(uniforms.uStressScanProgress.value).toBe(0.8)
      expect(uniforms.uStressYMin.value).toBe(9.9)
      expect(uniforms.uStressCenterY.value).toBe(10.41)
      expect(uniforms.uStressHotspotFos.value).toBe(0.55)
      expect(uniforms.uStressYMax.value).toBe(13.78)
      expect(uniforms.uStressRMax.value).toBe(6.074)
    }
  })
})


describe('Stage 1 axial flank contact glint', () => {
  it('defaults off, updates caller-owned scalars, sanitizes unsafe values and clears on legacy seeks', () => {
    const uniforms = createProgressionUniforms(), state = createProgressionState()
    const y = uniforms.uAxialContactY, mix = uniforms.uAxialContactMix
    expect(y.value).toBe(0); expect(mix.value).toBe(0)
    writeProgressionUniforms(uniforms, state, 'approved', 6.35, 0.8)
    expect(uniforms.uAxialContactY).toBe(y); expect(uniforms.uAxialContactMix).toBe(mix)
    expect(y.value).toBe(6.35); expect(mix.value).toBe(0.8)
    writeProgressionUniforms(uniforms, state, 'approved', 1e6, 2)
    expect(y.value).toBe(9.525); expect(mix.value).toBe(1)
    writeProgressionUniforms(uniforms, state, 'approved', -1, -1)
    expect(y.value).toBe(0); expect(mix.value).toBe(0)
    for (const bad of [NaN, Infinity, -Infinity]) {
      writeProgressionUniforms(uniforms, state, 'approved', bad, bad)
      expect(y.value).toBe(0); expect(mix.value).toBe(0)
    }
    writeProgressionUniforms(uniforms, state, 'legacy', 6.35, 1)
    expect(mix.value).toBe(0)
    writeProgressionUniforms(uniforms, state, 'approved')
    expect(y.value).toBe(0); expect(mix.value).toBe(0)
    writeProgressionUniforms(uniforms, state)
    expect(mix.value).toBe(0)
  })

  it('patches installed PBR shaders in the existing pass with a bounded, finite, flank-only line', () => {
    for (const material of [new MeshStandardMaterial(), new MeshPhysicalMaterial()]) {
      const uniforms = createProgressionUniforms()
      applyProgression(material, uniforms)
      const src = material instanceof MeshPhysicalMaterial ? ShaderLib.physical : ShaderLib.standard
      const shader = { uniforms: {} as Record<string, unknown>, vertexShader: src.vertexShader, fragmentShader: src.fragmentShader }
      ;(material.onBeforeCompile as unknown as (s: typeof shader, r: unknown) => void)(shader, {})
      expect(shader.uniforms.uAxialContactY).toBe(uniforms.uAxialContactY)
      expect(shader.uniforms.uAxialContactMix).toBe(uniforms.uAxialContactMix)
      expect(shader.fragmentShader).toContain('uShaftKind > 0.5 && uAxialContactMix > 0.0')
      expect(shader.fragmentShader).toContain('cross(dFdx(vShaftLocal), dFdy(vShaftLocal))')
      expect(shader.fragmentShader).toContain('inversesqrt(max(dot(jgContactN, jgContactN), 0.00000001))')
      expect(shader.fragmentShader).toContain('0.18 * jgContactMask')
      // Evaluate the emitted scalar mask itself: exercises its ordered smoothstep,
      // face/radius gates and mix clamp without creating a parallel CPU law.
      const maskSource = shader.fragmentShader.slice(shader.fragmentShader.indexOf('float jgContactLine ='), shader.fragmentShader.indexOf('  roughnessFactor = mix(roughnessFactor, min'))
        .replace(/\bfloat\b/g, 'let').replace(/vShaftLocal\.y/g, 'y')
      const smoothstep = (a: number, b: number, x: number) => {
        expect(b).toBeGreaterThan(a)
        const u = Math.max(0, Math.min(1, (x - a) / (b - a)))
        return u * u * (3 - 2 * u)
      }
      const mask = new Function('y', 'jgContactR', 'jgContactFlank', 'uAxialContactY', 'uAxialContactMix', 'smoothstep', 'step', 'abs', 'clamp', `${maskSource}\nreturn jgContactMask`)
      const sample = (y: number, r = 5.2, flank = 1, mix = 1) => mask(y, r, flank, 6.35, mix, smoothstep,
        (edge: number, x: number) => x < edge ? 0 : 1, Math.abs, (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))) as number
      expect(sample(6.35)).toBe(1)
      expect(sample(6.25)).toBeCloseTo(0.5, 12)
      expect(sample(6.55)).toBe(0)
      for (const y of [0, 3.14, 9.56, 71.52]) expect(sample(y)).toBe(0)
      for (const r of [0, 4.44, 5.96, 8.86]) expect(sample(6.35, r)).toBe(0)
      expect(sample(6.35, 5.2, 0)).toBe(0)
      expect(sample(6.35, 5.2, 1, 0)).toBe(0)
      expect(sample(6.35, 5.2, 1, 2)).toBe(1)
      expect(sample(6.35, 5.2, 1, -1)).toBe(0)
      for (let i = 0; i <= 100; i++) {
        const value = sample(6.1 + i * 0.005, 5.2, i / 100, i / 80)
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(1)
      }
      material.dispose()
    }
  })
})

describe('axisymmetric FEA groove gradient (Issue 3)', () => {
  const STUDIES = [['4140', FOS_ATTEMPTS['4140']], ['4340', FOS_ATTEMPTS['4340']], ['c300', FOS_ATTEMPTS.c300]] as const
  const fosAt = (dy: number, hot: number, body = FOS_MAX) => body + (hot - body) * stressFieldAt(dy, hot)
  const hueAt = (dy: number, hot: number) => new Color(...fosColor(fosAt(dy, hot))).getHSL({ h: 0, s: 0, l: 0 }).h * 360

  it('reaches the exact alloy minimum only at the measured groove floor, with changing fillet colours', () => {
    for (const [, hot] of STUDIES) {
      expect(fosAt(0, hot)).toBeCloseTo(hot, 12)
      // Measured legacy tooth end and upper groove edge, either side of the 10.41 mm floor.
      for (const y of [SHAPING_FACE_END_MM, 10.94]) {
        expect(fosAt(y - FOS_CENTER_Y.attempt, hot) - hot).toBeGreaterThan(0.08)
      }
      expect(fosAt(0.1, hot) - hot).toBeGreaterThan(0.002)
      expect(fosAt(0.5, hot)).toBeLessThan(fosAt(1, hot))
      expect(fosAt(1, hot)).toBeLessThan(fosAt(1.5, hot))
    }
  })

  it('has smooth, strictly rising FOS contours on both sides, without a plateau or crossover kink', () => {
    for (const [, hot] of STUDIES) {
      let previous: number = hot
      for (let i = 1; i <= 600; i++) {
        const dy = i * 0.01
        const f = fosAt(dy, hot)
        expect(fosAt(-dy, hot)).toBe(f)
        expect(f).toBeGreaterThan(previous)
        expect(f).toBeLessThanOrEqual(FOS_MAX)
        // Bound the change in slope over adjacent 0.01 mm intervals throughout the contour.
        expect(Math.abs(fosAt(dy + 0.01, hot) - 2 * f + previous)).toBeLessThan(0.001)
        previous = f
      }
      expect((fosAt(0.001, hot) - hot) / 0.001).toBeLessThan(0.005)
      expect(fosAt(12, hot)).toBeCloseTo(FOS_MAX, 9)
    }
  })

  it('traverses blue, cyan, green and yellow on the actual tooth-to-groove span for every alloy', () => {
    for (const [, hot] of STUDIES) {
      const bands = [0, 0, 0, 0] // blue, cyan, green, yellow
      let previousHue = 360
      for (let y = FACE_START_MM; y <= FOS_CENTER_Y.attempt; y += 0.01) {
        const hue = hueAt(y - FOS_CENTER_Y.attempt, hot)
        expect(hue).toBeLessThanOrEqual(previousHue + 1e-9)
        previousHue = hue
        if (hue >= 205) bands[0]++
        if (hue >= 175 && hue < 205) bands[1]++
        if (hue >= 85 && hue < 160) bands[2]++
        if (hue >= 45 && hue < 70) bands[3]++
      }
      // Each intermediate hue occupies measurable surface length, not just a single sample.
      for (const count of bands) expect(count).toBeGreaterThan(5)
      expect(hueAt(FACE_START_MM - FOS_CENTER_Y.attempt, hot) - hueAt(0, hot)).toBeGreaterThan(180)
      expect(fosAt(6 - FOS_CENTER_Y.attempt, hot)).toBeGreaterThan(2.9)
      expect(fosAt(HOBBING_FACE_END_MM - FOS_CENTER_Y.attempt, hot)).toBeGreaterThan(2.7)
    }
    expect(hueAt(0, FOS_ATTEMPTS['4140'])).toBeLessThan(10)
  })

  it('keeps the failing zone narrow and visibly shrinks it as the alloy strengthens', () => {
    for (const dy of [-2, -1, -0.5, 0.5, 1, 2]) {
      const [a, b, c] = STUDIES.map(([, hot]) => fosAt(dy, hot))
      expect(b - a).toBeGreaterThan(0.15)
      expect(c - b).toBeGreaterThan(0.15)
    }
    const widths = STUDIES.map(([, hot]) => {
      let samples = 0
      for (let i = -600; i <= 600; i++) if (fosAt(i * 0.01, hot) < 1) samples++
      return samples * 0.01
    })
    for (const width of widths) {
      expect(width).toBeGreaterThan(0.3)
      expect(width).toBeLessThan(2.1)
    }
    expect(widths[0] - widths[1]).toBeGreaterThan(0.3)
    expect(widths[1] - widths[2]).toBeGreaterThan(0.3)
  })

  it('keeps the revised study within the blue end of the unchanged FOS bar', () => {
    for (let dy = -8; dy <= 8; dy += 0.05) {
      const f = fosAt(dy, FOS_REVISED.hotspot, FOS_REVISED.body)
      expect(f).toBeGreaterThanOrEqual(FOS_REVISED.hotspot)
      expect(f).toBeLessThanOrEqual(FOS_REVISED.body)
      const [r, g, b] = fosColor(f)
      expect(b).toBeGreaterThan(r)
      expect(b).toBeGreaterThan(g)
    }
  })

  it('numerically matches the emitted GLSL across the groove, shoulders and alloy transitions', () => {
    // Execute the emitted scalar helper with JS equivalents of GLSL builtins; no second field formula.
    const glsl = stressFieldGlsl().replace(/float jgStressField\(float dy, float hotspotFos\)/, 'function jgStressField(dy, hotspotFos)').replace(/\bfloat\b/g, 'let')
    const gpu = new Function('clamp', 'mix', 'exp', `${glsl}\nreturn jgStressField`)(
      (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x)),
      (a: number, b: number, t: number) => a + (b - a) * t,
      Math.exp,
    ) as typeof stressFieldAt
    for (const hot of [0.55, 0.63, 0.72, 0.81, 0.9, FOS_REVISED.hotspot]) {
      for (let i = -240; i <= 240; i++) {
        expect(gpu(i * 0.05, hot)).toBeCloseTo(stressFieldAt(i * 0.05, hot), 12)
      }
    }
  })

  it('embeds the identical field helper in both shaders, without azimuth, radial attenuation or noise', () => {
    const glsl = stressFieldGlsl()
    const material = new MeshStandardMaterial()
    applyProgression(material, createProgressionUniforms())
    const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <emissivemap_fragment>' }
    ;(material.onBeforeCompile as unknown as (s: typeof shader, r: unknown) => void)(shader, {})
    const overlay = makeStressOverlayMaterial(createProgressionUniforms())
    for (const source of [shader.fragmentShader, overlay.fragmentShader]) {
      expect(source.split(glsl)).toHaveLength(2)
      expect(source).toContain('float jgStressField(float dy, float hotspotFos)')
      expect(source).toMatch(/jgStressField\((jgDy|dy), uStressHotspotFos\)/)
      expect(source).not.toMatch(/atan\(|Theta|theta|floorBias|FloorBias|[bB]lotch|cos\(/)
      expect(source).not.toMatch(/(?<!smooth)step\(uStressY(Min|Max)/)
    }
    material.dispose()
    overlay.dispose()
  })
})
