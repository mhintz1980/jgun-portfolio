import { describe, expect, it } from 'vitest'
import { InstancedBufferGeometry, ShaderLib, ShaderMaterial, type WebGLRenderer } from 'three'
import { drawingIntroState, DRAWING_INTRO_WINDOW, INTRO_PHASES, introScrollTimeFor, REDUCED_MOTION_INTRO_T } from '../introTimeline'
import { InkBuilder, makeInkFills, makeInkLines, makeSheetUniforms } from './ink'
import { makeSheetText } from './sheetText'
import { CONTACT_SHADOW_MAX, makePaperFlexField, paperContactShadow, paperFlexAmplitude, paperVellum, PAPER_FLEX_MAX, PAPER_FLEX_STEP } from './paperFlex'

const rectangle = [[-0.15, -0.05], [0.15, -0.05], [0.15, 0.05], [-0.15, 0.05]]

describe('barrier pressure and release', () => {
  const at = (t: number, tier = 'full', flat = false, crossing = 0.6) => {
    const intro = drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
    return paperFlexAmplitude(intro.t, intro.poseT, crossing, tier, flat)
  }

  it('peaks at fractureStart and is flat again by fractureEnd, independent of the pose solve', () => {
    expect(at(0)).toBe(0)
    expect(at(INTRO_PHASES.pulseStart)).toBe(0)
    expect(at(INTRO_PHASES.pulseEnd)).toBe(0)
    expect(at(INTRO_PHASES.bulgeStart)).toBe(0)
    expect(at(INTRO_PHASES.fractureStart)).toBeCloseTo(PAPER_FLEX_MAX, 9)
    expect(at(INTRO_PHASES.fractureEnd)).toBe(0)
    expect(at(1)).toBe(0)
    // The swell is a scroll-window shape: neither the pose axis nor the solved crossing moves it.
    for (const t of [0.8, 0.82, 0.84, 0.85, 0.87]) {
      for (const pose of [0.4, 0.5, 0.6, 0.8, 1]) {
        expect(paperFlexAmplitude(t, pose, 0.6, 'full')).toBe(paperFlexAmplitude(t, 0.4, 0.6, 'full'))
        expect(paperFlexAmplitude(t, pose, 0.9, 'full')).toBe(paperFlexAmplitude(t, pose, 0.6, 'full'))
      }
    }
  })

  it('keeps the sheet flat through flicker, dark hold, trace and the reduced-motion still', () => {
    expect(at(INTRO_PHASES.blackoutStart)).toBe(0)
    expect(at(INTRO_PHASES.pulseEnd)).toBe(0)
    expect(at(REDUCED_MOTION_INTRO_T)).toBe(0)
    // Pressure builds only across .79-.84, capped at PAPER_FLEX_MAX.
    let previous = 0
    for (let i = 1; i <= 24; i += 1) {
      const t = INTRO_PHASES.bulgeStart + (i / 24) * (INTRO_PHASES.fractureStart - INTRO_PHASES.bulgeStart)
      const amplitude = at(t)
      expect(amplitude).toBeGreaterThanOrEqual(previous)
      expect(amplitude).toBeLessThanOrEqual(PAPER_FLEX_MAX)
      previous = amplitude
    }
    expect(previous).toBeCloseTo(PAPER_FLEX_MAX, 9)
    // and releases monotonically to flat across .84-.88 as the paper breaks.
    previous = PAPER_FLEX_MAX
    for (let i = 1; i <= 24; i += 1) {
      const t = INTRO_PHASES.fractureStart + (i / 24) * (INTRO_PHASES.fractureEnd - INTRO_PHASES.fractureStart)
      const amplitude = at(t)
      expect(amplitude).toBeLessThanOrEqual(previous + 1e-12)
      expect(amplitude).toBeGreaterThanOrEqual(0)
      previous = amplitude
    }
    expect(previous).toBe(0)
  })

  it('swells during the model push and is flat after fragment clearance', () => {
    expect(at(INTRO_PHASES.riseStart)).toBe(0)
    expect(at(0.815)).toBeCloseTo(PAPER_FLEX_MAX * 0.5, 12)
    expect(at(0.85)).toBeGreaterThan(0)
    for (let i = 0; i <= 100; i += 1) {
      expect(at(INTRO_PHASES.fractureEnd + (i / 100) * (1 - INTRO_PHASES.fractureEnd))).toBe(0)
    }
    expect(paperFlexAmplitude(0.7, 1, 0.88, 'full')).toBe(0)
    expect(paperFlexAmplitude(INTRO_PHASES.riseStart, 0.8, 0.88, 'full')).toBe(0)
    expect(paperFlexAmplitude(INTRO_PHASES.riseStart, 0.8, 0.6, 'full')).toBe(0)
  })

  it('reverse scrubbing is identical, with a restrained lite and flat proof/reduced fallback', () => {
    const times = Array.from({ length: 101 }, (_, i) => i / 100)
    const forward = times.map(t => at(t))
    expect([...times].reverse().map(t => at(t)).reverse()).toEqual(forward)
    expect(Math.max(...forward)).toBeLessThanOrEqual(PAPER_FLEX_MAX)
    expect(at(0.82, 'lite')).toBeCloseTo(at(0.82) * 0.45)
    for (const t of times) {
      expect(at(t, 'full', true)).toBe(0)
      expect(at(t, 'poster')).toBe(0)
    }
    expect(paperFlexAmplitude(NaN, 0, 0.9, 'full')).toBe(0)
  })

  it('retires the vellum: the breakthrough stock is always opaque', () => {
    for (const pose of [0, 0.4, 0.6, 1]) {
      for (const pbr of [0, 0.5, 1]) expect(paperVellum(pose, 0.6, pbr, 'full')).toBe(0)
    }
    expect(paperVellum(1, 1, 1, 'lite')).toBe(0)
    expect(paperVellum(1, 1, 1, 'poster', true)).toBe(0)
  })
})

describe('profile-derived pressure field', () => {
  it('is deterministic, peaks near centerline, softly shoulders and leaves edges pinned', () => {
    const a = makePaperFlexField(rectangle, 0.8, 0.5)
    const b = makePaperFlexField(rectangle, 0.8, 0.5)
    expect(a.texture.image.data).toEqual(b.texture.image.data)
    const data = a.texture.image.data!
    const sample = (x: number, y: number) => Number(data[(y * 256 + x) * 4]) / 255
    expect(sample(128, 80)).toBeGreaterThan(0.9)
    expect(sample(128, 80)).toBeGreaterThan(sample(128, 90))
    expect(sample(128, 98)).toBeGreaterThan(0)
    expect(sample(128, 125)).toBe(0)
    for (let x = 0; x < 256; x += 1) { expect(sample(x, 0)).toBe(0); expect(sample(x, 159)).toBe(0) }
    for (let y = 0; y < 160; y += 1) { expect(sample(0, y)).toBe(0); expect(sample(255, y)).toBe(0) }
    a.texture.dispose(); b.texture.dispose()
  })

  it('follows a translated profile and gracefully handles a missing profile', () => {
    const a = makePaperFlexField(rectangle.map(([x, y]) => [x, y + 0.1]), 0.8, 0.5)
    const data = a.texture.image.data!
    expect(Number(data[(112 * 256 + 128) * 4])).toBeGreaterThan(230)
    expect(Number(data[(65 * 256 + 128) * 4])).toBe(0)
    const empty = makePaperFlexField([], 0.8, 0.5)
    expect(empty.peak).toBe(0)
    a.texture.dispose(); empty.texture.dispose()
  })
})

describe('all printed layers share the paper deformation', () => {
  it('subdivides long ink without changing reveal/dash coordinates or leaving gaps', () => {
    const ink = new InkBuilder().line(-0.2, 0, 0.2, 0, 0.0002, 12, 0.3, 0.1, 2)
    const uniforms = makeSheetUniforms()
    const mesh = makeInkLines(ink, uniforms)
    const geometry = mesh.geometry as InstancedBufferGeometry
    const ranges = geometry.getAttribute('aRange')
    const segs = geometry.getAttribute('aSeg')
    const style = geometry.getAttribute('aStyle')
    expect(geometry.instanceCount).toBe(Math.ceil(0.4 / PAPER_FLEX_STEP))
    expect(ranges.getX(0)).toBe(0)
    expect(ranges.getY(ranges.count - 1)).toBe(1)
    for (let i = 0; i < ranges.count; i += 1) {
      expect(segs.getX(i)).toBeCloseTo(-0.2)
      expect(style.getZ(i)).toBeCloseTo(0.3)
      if (i > 0) expect(ranges.getX(i)).toBe(ranges.getY(i - 1))
    }
    const material = mesh.material as ShaderMaterial
    expect(material.uniforms.uFlexAmplitude).toBe(uniforms.uFlexAmplitude)
    expect(material.vertexShader).toContain('paperDisplacement(p)')
    expect(material.vertexShader).not.toContain('waveDisplacement')
    geometry.dispose(); material.dispose()
    ink.tri(0, 0, 0.001, 0, 0, 0.001, 0)
    const fills = makeInkFills(ink, uniforms)
    expect((fills.material as ShaderMaterial).uniforms.uFlexAmplitude).toBe(uniforms.uFlexAmplitude)
    expect((fills.material as ShaderMaterial).vertexShader).toContain('paperDisplacement(position.xy)')
    fills.geometry.dispose(); (fills.material as ShaderMaterial).dispose()
  })

  it('injects text flex after Troika batching and shares live uniform references', () => {
    const uniforms = makeSheetUniforms()
    const text = makeSheetText([], uniforms)
    const shader = { uniforms: {}, vertexShader: ShaderLib.basic.vertexShader, fragmentShader: ShaderLib.basic.fragmentShader }
    const material = text.object.material as ShaderMaterial
    material.onBeforeCompile(shader as Parameters<typeof material.onBeforeCompile>[0], {} as WebGLRenderer)
    expect(shader.vertexShader).toContain('uTroikaMatricesTexture')
    expect(shader.vertexShader).toContain('transformed.z += paperDisplacement(transformed.xy);')
    expect(shader.vertexShader.indexOf('transformed.z +=')).toBeLessThan(shader.vertexShader.indexOf('vec4 mvPosition'))
    expect((shader.uniforms as typeof uniforms).uFlexAmplitude).toBe(uniforms.uFlexAmplitude)
    // Troika's outer derived material runs the user onBeforeCompile handler after its
    // own nested rewrites, so the evidence holds the final batched/SDF sources, with
    // the base material's lamp injection intact in the fragment.
    const evidence = text.captureShaderEvidence()
    expect(evidence.generated).toBe(true)
    expect(evidence.vertexShader).toBe(shader.vertexShader)
    expect(evidence.generatedFragment).toBe(true)
    const fragmentShader = evidence.fragmentShader ?? ''
    expect(fragmentShader).toContain('uniform float uLampPower;')
    // Troika resolves #include directives during its rewrite, so the multiplication is
    // asserted on its own inlined final form rather than beside the raw include line.
    expect(fragmentShader.match(/diffuseColor\.rgb \*= 0\.14 \+ 0\.86 \* uLampPower;/g)).toHaveLength(1)
    text.dispose()
  })
})

describe('contact-shadow separation', () => {
  // The solved crossing is a pose-time from solveExtraction() (~.6 after the 2026-10-01
  // revision). Samples are derived from it through the scroll reparameterization rather
  // than hard-coding a scroll time, so the shadow follows the actual separation.
  const crossing = 0.6
  const separationT = introScrollTimeFor(crossing)
  const gripPbr = drawingIntroState(separationT * DRAWING_INTRO_WINDOW.releaseEnd, crossing).pbr
  const at = (t: number, tier = 'full', flat = false) => {
    const intro = drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
    return paperContactShadow(intro.poseT, crossing, intro.pbr, tier, flat)
  }

  it('is absent before light, tight at the solved separation, widening and gone after lift', () => {
    expect(at(INTRO_PHASES.metalStart)[0]).toBe(0)
    const touching = at(separationT)
    // Separation is exactly zero at the crossing: the tightest shadow the sheet can hold.
    expect(touching[1]).toBeCloseTo(0.006, 12)
    expect(touching[0]).toBeCloseTo(CONTACT_SHADOW_MAX * gripPbr, 12)
    expect(touching[0]).toBeGreaterThan(0.8 * CONTACT_SHADOW_MAX)
    expect(touching[0]).toBeLessThanOrEqual(CONTACT_SHADOW_MAX)
    const lifting = at(0.97)
    expect(lifting[0]).toBeGreaterThan(0)
    expect(lifting[0]).toBeLessThan(touching[0])
    expect(lifting[1]).toBeGreaterThan(touching[1])
    expect(at(1)[0]).toBe(0)
    expect(at(1)[1]).toBeCloseTo(0.036, 12)
  })

  it('widens and fades monotonically with the pose after the crossing', () => {
    // Pin the material fully lit to isolate the separation shape: at the crossing itself the
    // shadow is exactly full strength and at its tightest radius.
    expect(paperContactShadow(crossing, crossing, 1, 'full')).toEqual([CONTACT_SHADOW_MAX, 0.006])
    let previousStrength = CONTACT_SHADOW_MAX
    let previousRadius = 0.006
    for (let i = 1; i <= 60; i += 1) {
      const poseT = crossing + (i / 60) * (1 - crossing)
      const [strength, radius] = paperContactShadow(poseT, crossing, 1, 'full')
      expect(strength).toBeLessThanOrEqual(previousStrength + 1e-12)
      expect(radius).toBeGreaterThanOrEqual(previousRadius - 1e-12)
      previousStrength = strength
      previousRadius = radius
    }
    expect(previousStrength).toBe(0)
    expect(previousRadius).toBeCloseTo(0.036, 12)
  })

  it('is deterministic under reverse scrub and off in flat / poster modes', () => {
    const samples = Array.from({ length: 201 }, (_, i) => i / 200)
    const forward = samples.map(t => at(t))
    expect([...samples].reverse().map(t => at(t)).reverse()).toEqual(forward)
    expect(at(separationT + 0.01, 'full', true)).toEqual([0, 0])
    expect(at(separationT + 0.01, 'poster')).toEqual([0, 0])
    expect(paperContactShadow(NaN, crossing, 1, 'full')).toEqual([0, 0])
  })
})
