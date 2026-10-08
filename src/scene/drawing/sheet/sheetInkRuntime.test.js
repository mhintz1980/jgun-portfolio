import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Box3, BoxGeometry, Color, LinearSRGBColorSpace, ShaderLib, Vector3 } from 'three'
import { Text } from 'troika-three-text'
import parser from 'troika-three-text/src/FontParser.js'
import { createTypesetter } from 'troika-three-text/src/Typesetter.js'
import bidiFactory from 'bidi-js'
import { makeDrawingLayout } from '../drawingGeometry'
import { composeSheet } from './composeSheet'
import { GROUP, INK_GRAPHITE, INK_RED, InkBuilder, PEN_COLOR, dashStyleOf, makeInkFills, makeInkLines, makeSheetUniforms, penColorOf, withPenColor } from './ink'
import { INK } from '../drawingGeometry'
import { PAPER_FLEX_STEP } from './paperFlex'
import { makeSheetText } from './sheetText'
import { REFERENCE_GLYPHS } from './referenceHandGlyphs'

// The test exercises real sheet composition and installed Troika typography;
// only GPU hidden-line extraction and the SDF atlas are outside this unit gate.
vi.mock('./edgeExtract', async importOriginal => ({
  ...await importOriginal(),
  extractView: () => ({ outline: new Float32Array(), edges: new Float32Array() }),
}))

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

function captureMembers() {
  const members = []
  vi.spyOn(Text.prototype, 'sync').mockImplementation(function (done) {
    members.push(this)
    done?.()
  })
  return members
}

function setBounds(text, blockBounds) {
  Object.defineProperty(text, 'textRenderInfo', { configurable: true, value: { blockBounds } })
}

describe('sheet text runtime proof', () => {
  it('reports pending layouts, applies live rotation/position, filters groups, and detects hidden overflow', async () => {
    const members = captureMembers()
    const layer = makeSheetText([
      { text: 'ROTATED', x: 0.1, y: 0.2, rotation: Math.PI / 2, size: 0.003, group: GROUP.titleBlock, key: 0,
        fitCell: { x: 0.08, y: 0.18, w: 0.04, h: 0.04 } },
      { text: 'NOTE', x: 0, y: 0, size: 0.003, group: GROUP.notes, key: 0 },
    ])
    await layer.ready
    // sync is mocked here, so a resolved ready promise supplies no measured layout.
    // Both unavailable bounds remain fail-closed until their real layouts arrive.
    expect(layer.captureBounds()).toMatchObject({ ready: false, count: 2, violations: 2 })
    expect(layer.captureBounds().items.every(item => item.bounds === null && item.contained === null)).toBe(true)
    setBounds(members[0], [-0.01, -0.005, 0.01, 0.005])
    setBounds(members[1], [0, 0, 0.01, 0.01])
    const title = layer.captureBounds(GROUP.titleBlock)
    expect(title).toMatchObject({ ready: true, count: 1, violations: 0 })
    title.items[0].bounds.forEach((n, i) => expect(n).toBeCloseTo([0.095, 0.19, 0.105, 0.21][i], 10))
    expect(layer.captureBounds().items[1].contained).toBeNull()
    members[0].position.x += 0.03
    layer.update(new Array(16).fill(0), 0)
    expect(layer.captureBounds(GROUP.titleBlock)).toMatchObject({ ready: true, count: 1, violations: 1 })
    expect(layer.captureBounds(GROUP.titleBlock).items[0].contained).toBe(false)
    layer.dispose()
  })

  it('never silently accepts missing title targets or nonfinite layout', () => {
    const members = captureMembers()
    const layer = makeSheetText([{ text: 'UNTRACKED', x: 0, y: 0, size: 0.003, group: GROUP.titleBlock, key: 0 }])
    setBounds(members[0], [0, 0, 0.01, 0.01])
    expect(layer.captureBounds()).toMatchObject({ ready: true, violations: 1, count: 1 })
    setBounds(members[0], [0, 0, NaN, 0.01])
    expect(layer.captureBounds()).toMatchObject({ ready: false, violations: 1, count: 1 })
    layer.dispose()
  })

  it('contains every authored title/revision label using the shipped fonts and actual Troika blockBounds', async () => {
    vi.stubGlobal('self', globalThis)
    const geometry = new BoxGeometry(0.08, 0.08, 0.3).toNonIndexed()
    const bounds = new Box3(new Vector3(-0.04, -0.04, -0.15), new Vector3(0.04, 0.04, 0.15))
    const data = { geometry, bounds, units: {}, features: {}, rigCenter: new Vector3(), sourceTriangles: 12 }
    const { ink } = composeSheet({}, data, makeDrawingLayout(16 / 9, bounds))
    const titles = ink.texts.filter(t => t.group === GROUP.titleBlock)
    expect(titles.length).toBeGreaterThan(35)
    expect(titles.every(t => t.fitCell && t.size > 0)).toBe(true)
    // JG-035 owner revision: personal title + career block (A/B/C), no dates or approval columns.
    for (const text of ['MARK HINTZ', 'Digital Systems Architect', 'ORGANIZATION', 'Myers-Seth Pumps', 'Special Tool Solutions', 'Black Creek Precision', 'A', 'B', 'C']) expect(titles.some(t => t.text === text)).toBe(true)
    expect(titles.some(t => t.text === 'APPD' || t.text === 'DATE')).toBe(false)
    expect(titles.some(t => /Product Design \/ R&D \/ 3D Product Visualizer/.test(t.text))).toBe(true)
    const fonts = {}
    for (const weight of ['medium', 'semibold']) {
      const bytes = readFileSync(`public/fonts/BarlowCondensed-${weight === 'medium' ? 'Medium' : 'SemiBold'}.ttf`)
      fonts[weight] = await parser.onMainThread(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
      fonts[weight].src = weight
    }
    const typesetter = createTypesetter(() => { throw new Error('Unexpected font fallback') }, bidiFactory())
    const members = captureMembers()
    const layer = makeSheetText(titles)
    for (let i = 0; i < titles.length; i++) {
      const item = titles[i], text = members[i]
      typesetter.typeset({
        text: text.text, fontSize: text.fontSize, letterSpacing: text.letterSpacing,
        lineHeight: text.lineHeight, anchorX: text.anchorX, anchorY: text.anchorY, textAlign: text.textAlign,
        preResolvedFonts: { chars: new Uint8Array(text.text.length), fonts: [fonts[item.weight ?? 'medium']] },
      }, result => setBounds(text, result.blockBounds))
    }
    const proof = layer.captureBounds(GROUP.titleBlock)
    expect(proof.ready).toBe(true)
    expect(proof.items.filter(item => !item.contained)).toEqual([])
    expect(proof.violations).toBe(0)
    layer.dispose(); geometry.dispose()
  })

  it('measures real reference-font visible ink with baseline/LSB compensation and live scale/rotation', async () => {
    vi.stubGlobal('self', globalThis)
    const bytes = readFileSync('public/fonts/AcFastReference.ttf')
    const font = await parser.onMainThread(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    font.src = 'ac-fast'
    expect(font.unitsPerEm).toBe(1000)
    const typesetter = createTypesetter(() => { throw new Error('Unexpected font fallback') }, bidiFactory())
    const items = [
      { text: 'I', x: 0.03, y: 0.06, size: 0.0038, scaleX: 0.95, rotation: 0 },
      { text: 'M', x: 0.05, y: 0.06, size: 0.0042, scaleX: 1.05, rotation: 0.18 },
      { text: 'A', x: 0.07, y: 0.06, size: 0.0038, scaleX: 0.97, rotation: -0.12 },
    ].map((item, index) => ({ ...item, weight: 'handwriting', color: 'graphite', anchorY: 'baseline',
      group: GROUP.noteInput, key: index * 0.2, dur: 0.1, fitCell: { x: 0.02, y: 0.05, w: 0.07, h: 0.03 } }))
    const members = captureMembers(), layer = makeSheetText(items)
    await layer.ready
    expect(layer.captureBounds(GROUP.noteInput)).toMatchObject({ ready: false, count: 3, violations: 3 })
    const layouts = []
    for (const [i, text] of members.entries()) {
      expect(text.font).toBe('/fonts/AcFastReference.ttf')
      expect(text.anchorY).toBe('top-baseline')
      expect(text.color).toBe(new Color(INK_GRAPHITE).getHex(LinearSRGBColorSpace))
      typesetter.typeset({
        text: text.text, fontSize: text.fontSize, letterSpacing: text.letterSpacing,
        lineHeight: text.lineHeight, anchorX: text.anchorX, anchorY: text.anchorY, textAlign: text.textAlign,
        preResolvedFonts: { chars: new Uint8Array(1), fonts: [font] },
      }, result => {
        layouts[i] = result
        Object.defineProperty(text, 'textRenderInfo', { configurable: true, value: result })
      })
    }
    const proof = layer.captureBounds(GROUP.noteInput)
    expect(proof).toMatchObject({ ready: true, count: 3, violations: 0 })
    for (const [i, item] of items.entries()) {
      const text = members[i], layout = layouts[i]
      let glyph
      font.forEachGlyph(item.text, 1000, 0, value => { glyph = value })
      expect(glyph).toBeDefined()
      expect(glyph.xMax).toBeGreaterThan(glyph.xMin)
      expect(glyph.yMax).toBeGreaterThan(glyph.yMin)
      expect(layout.topBaseline).toBeCloseTo(0, 12)
      expect(layout.visibleBounds[0]).toBeCloseTo(text.fontSize * glyph.xMin / 1000, 12)
      expect(layout.visibleBounds[0]).toBeGreaterThan(layout.blockBounds[0])
      text.updateMatrix()
      const reference = REFERENCE_GLYPHS[item.text]
      expect(reference.fontMinX).toBe(glyph.xMin)
      expect(reference.fontMinY).toBe(glyph.yMin)
      expect(reference.fontHeight).toBe(glyph.yMax - glyph.yMin)
      expect(text.fontSize).toBe(item.size * 1000 / reference.fontHeight)
      expect(layout.visibleBounds[3] - layout.visibleBounds[1]).toBeCloseTo(item.size, 12)
      // Actual TTF black ink, including conversion offsets, must land exactly at the authored origin.
      const origin = new Vector3(layout.visibleBounds[0], layout.visibleBounds[1], 0).applyMatrix4(text.matrix)
      expect(origin.x).toBeCloseTo(item.x, 12)
      expect(origin.y).toBeCloseTo(item.y, 12)
      const unit = text.fontSize / 1000
      const c = Math.cos(item.rotation), s = Math.sin(item.rotation)
      const expected = [[glyph.xMin, glyph.yMin], [glyph.xMax, glyph.yMin],
        [glyph.xMax, glyph.yMax], [glyph.xMin, glyph.yMax]]
        .map(([x, y]) => [(x - glyph.xMin) * unit * item.scaleX, (y - glyph.yMin) * unit])
        .map(([x, y]) => [item.x + x * c - y * s, item.y + x * s + y * c])
      const expectedBounds = [Math.min(...expected.map(p => p[0])), Math.min(...expected.map(p => p[1])),
        Math.max(...expected.map(p => p[0])), Math.max(...expected.map(p => p[1]))]
      proof.items[i].bounds.forEach((value, j) => expect(value).toBeCloseTo(expectedBounds[j], 12))
      expect(proof.items[i].contained).toBe(true)
    }
    const reveal = new Array(19).fill(1)
    layer.update(reveal, 1)
    expect(members.every(text => text.fillOpacity === 1)).toBe(true)
    reveal[GROUP.noteInput] = items[1].key + items[1].dur / 2
    layer.update(reveal, 1)
    expect(members[1].clipRect[2]).toBeCloseTo((layouts[1].blockBounds[0] + layouts[1].blockBounds[2]) / 2, 12)
    expect(members[2].fillOpacity).toBe(0)
    reveal[GROUP.noteInput] = 1
    layer.update(reveal, 1)
    expect(members.every(text => text.fillOpacity === 1)).toBe(true)
    // Available blockBounds cannot substitute for missing/nonfinite handwriting visibleBounds.
    setBounds(members[0], layouts[0].blockBounds)
    expect(layer.captureBounds(GROUP.noteInput)).toMatchObject({ ready: false, count: 3, violations: 1 })
    Object.defineProperty(members[0], 'textRenderInfo', { configurable: true,
      value: { ...layouts[0], visibleBounds: [0, 0, NaN, 0.01] } })
    expect(layer.captureBounds(GROUP.noteInput)).toMatchObject({ ready: false, count: 3, violations: 1 })
    layer.dispose()
  })
})

describe('ink colour encoding (dash + 10 * colour)', () => {
  it('round-trips navy 0, red 1 and graphite 2 with every dash style, and the shader decodes all three', () => {
    for (const color of Object.values(PEN_COLOR)) {
      for (const style of [0, 1, 2, 3]) {
        const dash = withPenColor(style, color)
        expect(penColorOf(dash)).toBe(color)
        expect(dashStyleOf(dash)).toBe(style)
      }
    }
    const uniforms = makeSheetUniforms()
    expect(uniforms.uInkGraphite.value.getHexString()).toBe(new Color(INK_GRAPHITE).getHexString())
    expect(uniforms.uInkRed.value.getHexString()).toBe(new Color(INK_RED).getHexString())
    const ink = new InkBuilder().line(0, 0, 0.01, 0, 0.0002, 16, 0, 0.1, withPenColor(0, PEN_COLOR.graphite))
    const mesh = makeInkLines(ink, uniforms)
    const { fragmentShader, vertexShader, uniforms: u } = mesh.material
    expect(vertexShader).toContain('floor(aDash / 10.0 + 0.5)')
    expect(fragmentShader).toContain('uniform vec3 uInkGraphite')
    expect(fragmentShader).toMatch(/vPen > 1\.5 \? uInkGraphite : \(vPen > 0\.5 \? uInkRed : uInk\)/)
    expect(u.uInkGraphite).toBe(uniforms.uInkGraphite)
    // the grain is pinned to the sheet (vPlane) and never reads the clock
    expect(fragmentShader).toContain('graphiteDensity(vPlane, vPx)')
    expect(fragmentShader.match(/uWaveTime|uTime/g)).toBeNull()
    mesh.geometry.dispose(); mesh.material.dispose()
  })

  it('keeps the graphite pen a neutral near-black, distinct from the saturated navy of the printed typeface', () => {
    const g = new Color(INK_GRAPHITE), n = new Color(INK)
    const sat = c => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)
    expect(sat(g)).toBeLessThan(sat(n) * 0.25)
    const lum = c => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
    expect(lum(g)).toBeLessThan(0.03)
    expect(lum(g)).toBeLessThan(lum(n))
  })
})

describe('sheet flex geometry and shader', () => {
  it('subdivides every triangle edge while conserving area, winding and per-vertex reveal values', () => {
    const ink = new InkBuilder().tri(0, 0, 0.03, 0, 0, 0.017, 12, 0.31, 0.12)
      .tri(0.05, 0, 0.05, 0.001, 0.051, 0, 2, 0.7, 0.02)
    const original = [...ink.fills]
    const mesh = makeInkFills(ink, makeSheetUniforms())
    const p = mesh.geometry.getAttribute('position'), style = mesh.geometry.getAttribute('aStyle')
    const areas = { 12: 0, 2: 0 }
    expect(p.count).toBeGreaterThan(6)
    for (let i = 0; i < p.count; i += 3) {
      const vertices = [0, 1, 2].map(j => [p.getX(i + j), p.getY(i + j)])
      const [a, b, c] = vertices
      const area = ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
      const group = style.getX(i)
      expect(Math.sign(area)).toBe(group === 12 ? 1 : -1)
      areas[group] += area
      for (let j = 0; j < 3; j++) {
        const next = vertices[(j + 1) % 3], here = vertices[j]
        expect(Math.hypot(next[0] - here[0], next[1] - here[1])).toBeLessThanOrEqual(PAPER_FLEX_STEP + 1e-8)
        expect(style.getX(i + j)).toBe(group)
        expect(style.getY(i + j)).toBeCloseTo(group === 12 ? 0.31 : 0.7)
        expect(style.getZ(i + j)).toBeCloseTo(group === 12 ? 0.12 : 0.02)
      }
    }
    expect(areas[12]).toBeCloseTo(0.03 * 0.017 / 2, 10)
    expect(areas[2]).toBeCloseTo(-0.001 * 0.001 / 2, 10)
    expect(ink.fills).toEqual(original)
    mesh.geometry.dispose(); mesh.material.dispose()
  })

  it('executes the Troika member transform before sheet flex and flex before projection', () => {
    const uniforms = makeSheetUniforms(), layer = makeSheetText([], uniforms)
    expect(layer.captureShaderEvidence()).toEqual({
      generated: false,
      vertexShader: null,
      generatedFragment: false,
      fragmentShader: null,
    })
    const shader = { uniforms: {}, vertexShader: ShaderLib.basic.vertexShader, fragmentShader: ShaderLib.basic.fragmentShader }
    layer.object.material.onBeforeCompile(shader, {})
    const source = shader.vertexShader
    const fragmentSource = shader.fragmentShader
    // Follow actual GLSL execution through Troika's nested wrappers. Source
    // offsets alone do not prove order because function definitions are hoisted.
    const functions = new Map()
    const pattern = /void\s+(\w+)\s*\([^)]*\)\s*\{/g
    for (const match of source.matchAll(pattern)) {
      const start = match.index + match[0].length
      let end = start, depth = 1
      while (depth && end < source.length) {
        if (source[end] === '{') depth++
        if (source[end] === '}') depth--
        end++
      }
      functions.set(match[1], source.slice(start, end - 1))
    }
    const expand = name => functions.get(name).replace(/\b(troika\w+)\(\);/g, (call, callee) => functions.has(callee) ? expand(callee) : call)
    const execution = expand('main')
    const member = execution.indexOf('matrix * vec4(')
    const transformed = execution.indexOf('vec3 transformed =')
    const flex = execution.indexOf('transformed.z += paperDisplacement(transformed.xy);')
    const project = execution.indexOf('vec4 mvPosition')
    expect(member).toBeGreaterThanOrEqual(0)
    expect(transformed).toBeGreaterThan(member)
    expect(flex).toBeGreaterThan(transformed)
    expect(project).toBeGreaterThan(flex)
    expect(shader.uniforms.uFlexAmplitude).toBe(uniforms.uFlexAmplitude)
    expect(shader.uniforms.uLampPower).toBe(uniforms.uLampPower)
    expect(fragmentSource.match(/uniform float uLampPower;/g)).toHaveLength(1)
    expect(fragmentSource.match(/diffuseColor\.rgb \*= 0\.14 \+ 0\.86 \* uLampPower;/g)).toHaveLength(1)
    expect(layer.captureShaderEvidence()).toEqual({
      generated: true,
      vertexShader: source,
      generatedFragment: true,
      fragmentShader: fragmentSource,
    })
    layer.dispose()
  })
})
