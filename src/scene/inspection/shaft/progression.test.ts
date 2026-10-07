import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Matrix3, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, ShaderLib, Vector3 } from 'three'
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
} from './progression'

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
    const stress = { kind: 'cool' as const, mix: 0.3, scanProgress: 0.6, yMin: 9, yMax: 13, rMax: 6 }
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
    expect(shader.vertexShader).toContain('jgRadius > 0.0 ? atan(jgLocal.z, jgLocal.x) : 0.0')
    expect(shader.vertexShader).toContain(': vec3(jgNewRadius, jgLocal4.y, 0.0)')
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
      writeStressUniforms(uniforms, { kind, mix: 0.4, scanProgress: 0.8, yMin: 9.9, yMax: 13.78, rMax: 6.074 })
      expect(uniforms.uStressKind.value).toBe({ none: 0, warm: 1, cool: 2 }[kind])
      expect(uniforms.uStressMix.value).toBe(0.4)
      expect(uniforms.uStressScanProgress.value).toBe(0.8)
      expect(uniforms.uStressYMin.value).toBe(9.9)
      expect(uniforms.uStressYMax.value).toBe(13.78)
      expect(uniforms.uStressRMax.value).toBe(6.074)
    }
  })
})

