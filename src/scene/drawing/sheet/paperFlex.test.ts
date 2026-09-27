import { describe, expect, it } from 'vitest'
import { InstancedBufferGeometry, ShaderLib, ShaderMaterial, type WebGLRenderer } from 'three'
import { drawingIntroState, DRAWING_INTRO_WINDOW, INTRO_PHASES } from '../introTimeline'
import { InkBuilder, makeInkFills, makeInkLines, makeSheetUniforms } from './ink'
import { makeSheetText } from './sheetText'
import { CONTACT_SHADOW_MAX, makePaperFlexField, paperContactShadow, paperFlexAmplitude, PAPER_FLEX_MAX, PAPER_FLEX_STEP } from './paperFlex'

const rectangle = [[-0.15, -0.05], [0.15, -0.05], [0.15, 0.05], [-0.15, 0.05]]

describe('vellum pressure and release', () => {
  const at = (t: number, tier = 'full', flat = false, crossing = 0.9) => {
    const intro = drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
    return paperFlexAmplitude(intro.t, intro.poseT, crossing, tier, flat)
  }

  it('preserves initial registration and builds pressure before metal emergence', () => {
    expect(at(0)).toBe(0)
    expect(at(INTRO_PHASES.pulseStart)).toBe(0)
    expect(at(INTRO_PHASES.riseStart - 0.02)).toBeGreaterThan(0)
    expect(at(INTRO_PHASES.riseStart)).toBeCloseTo(PAPER_FLEX_MAX, 9)
  })

  it('settles monotonically with extraction and is flat at actual separation', () => {
    let previous = PAPER_FLEX_MAX
    for (let i = 0; i <= 100; i += 1) {
      const pose = 0.4 + i * 0.006
      const amplitude = paperFlexAmplitude(0.7, pose, 0.88, 'full')
      expect(amplitude).toBeLessThanOrEqual(previous + 1e-12)
      expect(amplitude).toBeGreaterThanOrEqual(0)
      previous = amplitude
    }
    expect(paperFlexAmplitude(0.7, 0.88, 0.88, 'full')).toBe(0)
    expect(paperFlexAmplitude(0.7, 0.8, 0.88, 'full')).toBeLessThan(paperFlexAmplitude(0.7, 0.8, 0.95, 'full'))
    expect(at(1)).toBe(0)
  })

  it('reverse scrubbing is identical, with a restrained lite and flat proof/reduced fallback', () => {
    const times = Array.from({ length: 101 }, (_, i) => i / 100)
    const forward = times.map(t => at(t))
    expect([...times].reverse().map(t => at(t)).reverse()).toEqual(forward)
    expect(Math.max(...forward)).toBeLessThanOrEqual(PAPER_FLEX_MAX)
    expect(at(0.6, 'lite')).toBeCloseTo(at(0.6) * 0.45)
    for (const t of times) {
      expect(at(t, 'full', true)).toBe(0)
      expect(at(t, 'poster')).toBe(0)
    }
    expect(paperFlexAmplitude(NaN, 0, 0.9, 'full')).toBe(0)
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
    text.dispose()
  })
})

describe('contact-shadow separation', () => {
  const crossing = 0.9
  const at = (t: number, tier = 'full', flat = false) => {
    const intro = drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
    return paperContactShadow(intro.poseT, crossing, intro.pbr, tier, flat)
  }

  it('is absent before metal, tight while touching, widening and gone after lift', () => {
    expect(at(INTRO_PHASES.metalStart)[0]).toBe(0)
    const touching = at(INTRO_PHASES.riseStart + 0.06)
    expect(touching[0]).toBeCloseTo(CONTACT_SHADOW_MAX, 6)
    expect(touching[1]).toBeCloseTo(0.006, 6)
    const lifting = at(0.97)
    expect(lifting[0]).toBeGreaterThan(0)
    expect(lifting[0]).toBeLessThan(touching[0])
    expect(lifting[1]).toBeGreaterThan(touching[1])
    expect(at(1)[0]).toBe(0)
  })

  it('is deterministic under reverse scrub and off in flat / poster modes', () => {
    expect(at(0.97)).toEqual(at(0.97))
    expect(at(0.7, 'full', true)).toEqual([0, 0])
    expect(at(0.7, 'poster')).toEqual([0, 0])
  })
})
