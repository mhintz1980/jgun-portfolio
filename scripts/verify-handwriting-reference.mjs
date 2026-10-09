/** Focused live handwriting evidence, using the real renderer and natural quality ladder
 * unless --qualityLock is explicitly supplied for visual evidence only.
 * node scripts/verify-handwriting-reference.mjs --url=http://localhost:5199 --out=...
 * Optional: --case=desktop|narrow --qualityLock --require-precomputed --timeout=90000
 * Builds a local source oracle on the runner, so built Vite preview servers are supported
 * without fetching /src from production. No asset generation.
 * Exit 0: required observations verified; 1: failure; 2: required observation unavailable.
 */
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { build as esbuildBuild } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
if (process.argv.includes('--help')) {
  console.log('node scripts/verify-handwriting-reference.mjs --url=http://localhost:5199 --out=DIR [--case=desktop|narrow] [--qualityLock] [--require-precomputed] [--timeout=90000]')
  process.exit(0)
}
const option = (name, fallback) => {
  const prefix = `--${name}=`
  const inline = process.argv.find(value => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')
    ? process.argv[index + 1] : fallback
}
const timeout = Number(option('timeout', '90000'))
if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('--timeout must be positive milliseconds')
const url = new URL(option('url', 'http://localhost:5199'))
if (process.argv.includes('--qualityLock')) url.searchParams.set('qualityLock', '')
const qualityLock = url.searchParams.has('qualityLock')
const requirePrecomputed = process.argv.includes('--require-precomputed')
const out = path.resolve(option('out', path.join(root, '.scratch', `handwriting-proof-${Date.now()}`)))
const cases = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'narrow', width: 390, height: 844 }]
  .filter(item => !option('case', '') || item.name === option('case', ''))
if (!cases.length) throw new Error('--case must be desktop or narrow')
fs.mkdirSync(out, { recursive: true })
const oracleSource = `import { handwrite } from './src/scene/drawing/sheet/handwriting.ts'
import { REFERENCE_GLYPHS } from './src/scene/drawing/sheet/referenceHandGlyphs.ts'
import { GROUP, INK_GRAPHITE, INK_RED } from './src/scene/drawing/sheet/ink.ts'
import { OWNER_NOTES } from './src/scene/drawing/sheet/ownerAnnotations.ts'
import { sheetReveal } from './src/scene/drawing/sheetCamera.ts'

export function buildHandwritingOracle() {
  const glyphs = REFERENCE_GLYPHS
  if (!glyphs || !Object.keys(glyphs).length) throw new Error('REFERENCE_GLYPHS is unavailable or empty')
  const input = [...OWNER_NOTES.input.lead, ...OWNER_NOTES.input.alloys, ...OWNER_NOTES.input.decision]
    .join('').toUpperCase().replace(/\\s/g, '')
  const output = OWNER_NOTES.output.join('').toUpperCase().replace(/\\s/g, '')
  const expected = Object.fromEntries([[GROUP.noteInput, input], [GROUP.noteOutput, output]]
    .map(([group, text]) => [group, { text, fontText: [...text].filter(ch => ch in glyphs).join(''),
      vectorFallbackCharacters: [...text].filter(ch => !(ch in glyphs)) }]))
  const samples = Object.entries(expected).map(([group, value]) => {
    const text = value.text, options = { x: 0, y: 0, capHeight: 0.0038, seed: 21 }
    const a = handwrite(text, options), b = handwrite(text, options)
    return { group: Number(group), glyphCount: a.glyphs.length, strokeCount: a.strokes.length,
      bounds: a.bounds, deterministic: JSON.stringify(a) === JSON.stringify(b),
      finiteBounds: Object.values(a.bounds).every(Number.isFinite) }
  })
  const contourIssues = []
  for (const ch of new Set(input + output)) {
    if (!glyphs[ch]) continue
    if (!(glyphs[ch].w > 0) || !glyphs[ch].contours?.length
      || !glyphs[ch].contours.every(contour => contour.length >= 3
        && contour.every(point => point.length === 2 && point.every(Number.isFinite)))) contourIssues.push(ch)
  }
  return { expected, samples, contourIssues, glyphs, referenceGlyphCount: Object.keys(glyphs).length,
    ink: { GROUP, INK_GRAPHITE, INK_RED }, revealAt: phase => sheetReveal(phase, []),
    modules: ['handwriting.ts', 'referenceHandGlyphs.ts', 'ink.ts', 'ownerAnnotations.ts', 'sheetCamera.ts'] }
}`
const oracleBundle = path.join(out, 'handwriting-oracle.mjs')
await esbuildBuild({ stdin: { contents: oracleSource, resolveDir: root, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: oracleBundle, logLevel: 'silent' })
const handwritingOracle = (await import(pathToFileURL(oracleBundle).href)).buildHandwritingOracle()
const sourceForPage = phase => ({
  expected: handwritingOracle.expected,
  samples: handwritingOracle.samples,
  contourIssues: handwritingOracle.contourIssues,
  glyphs: handwritingOracle.glyphs,
  referenceGlyphCount: handwritingOracle.referenceGlyphCount,
  ink: handwritingOracle.ink,
  camera: { expectedReveal: Number.isFinite(phase) ? handwritingOracle.revealAt(phase) : null },
  modules: handwritingOracle.modules,
})
const save = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const check = (result, name, passed, details = null) => {
  result.checks.push({ name, status: passed === null ? 'unverified' : passed ? 'verified' : 'failed', details })
}
const finiteRect = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite)
  && value[2] > value[0] && value[3] > value[1]
const intersects = (a, b) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1e-7
  && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1e-7
const maxDelta = (a, b) => !Array.isArray(a) || !Array.isArray(b) || a.length !== b.length
  || !a.every(Number.isFinite) || !b.every(Number.isFinite) ? null
  : a.reduce((delta, value, i) => Math.max(delta, Math.abs(value - b[i])), 0)

// Decode actual screenshot pixels, independently of PNG encoder bytes. No imaging dependency.
function pngPixels(bytes) {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Not a PNG')
  let width, height, channels
  const chunks = []
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8)
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0
      if (data[8] !== 8 || !channels || data[10] || data[11] || data[12]) throw new Error('Unsupported PNG layout')
    }
    if (type === 'IDAT') chunks.push(data)
    offset += length + 12
    if (type === 'IEND') break
  }
  if (!width || !height || !channels) throw new Error('PNG has no supported IHDR')
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * channels
  if (raw.length !== height * (stride + 1)) throw new Error('Unexpected PNG scanline length')
  const pixels = Buffer.alloc(height * stride)
  const paeth = (a, b, c) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c)
    return da <= db && da <= dc ? a : db <= dc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    if (filter > 4) throw new Error(`Unknown PNG filter ${filter}`)
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, left = x >= channels ? pixels[i - channels] : 0
      const up = y ? pixels[i - stride] : 0, upperLeft = y && x >= channels ? pixels[i - stride - channels] : 0
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, upperLeft)][filter]
      pixels[i] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255
    }
  }
  return { width, height, channels, pixels }
}

function compareScreenshots(before, after) {
  const a = fs.readFileSync(before), b = fs.readFileSync(after)
  const result = { byteEqual: a.equals(b), beforeSha256: hash(a), afterSha256: hash(b),
    equalityIsAGate: false, reason: 'Normal cinematic rendering remains active; time-dependent lighting or grain may change pixels. No clock, camera, light or renderer is frozen.' }
  try {
    const x = pngPixels(a), y = pngPixels(b)
    if (x.width !== y.width || x.height !== y.height || x.channels !== y.channels) throw new Error('Screenshot layouts differ')
    let changedPixels = 0, totalDelta = 0, maxChannelDelta = 0
    for (let p = 0; p < x.width * x.height; p++) {
      let changed = false
      for (let c = 0; c < x.channels; c++) {
        const delta = Math.abs(x.pixels[p * x.channels + c] - y.pixels[p * y.channels + c])
        totalDelta += delta; maxChannelDelta = Math.max(maxChannelDelta, delta); changed ||= delta !== 0
      }
      changedPixels += Number(changed)
    }
    Object.assign(result, { pixelEquality: changedPixels === 0 ? 'equal' : 'observed-difference',
      changedPixels, changedPixelFraction: changedPixels / (x.width * x.height),
      meanChannelDelta: totalDelta / x.pixels.length, maxChannelDelta,
      beforePixelSha256: hash(x.pixels), afterPixelSha256: hash(y.pixels) })
  } catch (error) { result.pixelEquality = 'unverified'; result.decodeError = String(error) }
  return result
}

// Observe only the mounted renderer, after normal startup. Never intercept the
// disconnected WebGL capability probe or SDF-worker startup contexts.
function observeGL() {
  const renderer = window.__threeRenderer, canvas = renderer?.domElement
  if (!renderer || !canvas?.isConnected) throw new Error('Actual renderer is not mounted')
  const gl = renderer.getContext(), entry = { gl, canvas, draws: 0, lastDrawAt: 0 }
  const harness = window.__handwritingGL = { entries: [entry], contextLosses: 0, linkFailures: [] }
  canvas.addEventListener('webglcontextlost', () => { if (canvas.isConnected) harness.contextLosses++ })
  for (const program of renderer.info.programs ?? []) {
    if (program.program && !gl.getProgramParameter(program.program, gl.LINK_STATUS)) harness.linkFailures.push(gl.getProgramInfoLog(program.program))
  }
  for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
    if (typeof gl[name] !== 'function') continue
    const originalDraw = gl[name]
    gl[name] = function (...values) {
      const result = originalDraw.apply(this, values)
      entry.draws++; entry.lastDrawAt = performance.now()
      return result
    }
  }
  const originalLink = gl.linkProgram
  gl.linkProgram = function (program) {
    const result = originalLink.call(this, program)
    if (!this.getProgramParameter(program, this.LINK_STATUS)) harness.linkFailures.push(this.getProgramInfoLog(program))
    return result
  }
}

// All values are read from the scene actually being drawn, not reconstructed Text objects.
function readRuntime(source) {
  const proof = window.__drawingProof, renderer = window.__threeRenderer
  const scene = window.__threeScene, camera = window.__threeCamera
  const textBounds = proof?.captureTextBounds?.() ?? null
  const gl = renderer?.getContext?.(), extension = gl?.getExtension('WEBGL_debug_renderer_info')
  const observed = window.__handwritingGL?.entries.find(entry => entry.gl === gl)
  const rendererDescription = gl ? { vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER),
    unmaskedVendor: extension ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL) : null,
    unmaskedRenderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null,
    version: gl.getParameter(gl.VERSION), drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
    canvasConnected: renderer.domElement.isConnected, contextLost: gl.isContextLost(),
    observedDraws: observed?.draws ?? null, msSinceLastDraw: observed ? performance.now() - observed.lastDrawAt : null } : null
  const batches = [], pathMeshes = []
  scene?.traverse(object => {
    if (object._members instanceof Map) batches.push(object)
    if (object.name === 'sheet-ink-lines') pathMeshes.push(object)
  })
  const items = textBounds?.items ?? []
  const candidates = batches.filter(batch => {
    const members = [...batch._members.keys()]
    return members.length === items.length && members.every((text, i) => text.text === items[i].text)
  })
  const batch = candidates.length === 1 ? candidates[0] : null
  const groups = source ? [source.ink.GROUP.noteInput, source.ink.GROUP.noteOutput] : []
  const fontMembers = []
  let packedTexture = null
  if (batch) {
    const texture = batch._dataTextures?.main
    const packed = texture?.image?.data
    const textureHandle = texture ? renderer.properties.get(texture).__webglTexture : null
    const bound = batch.material?.uniforms?.uTroikaMatricesTexture?.value
    packedTexture = { floatsPerMember: 32, available: !!packed, boundToMaterial: bound === texture,
      uploadedTexture: !!textureHandle && gl.isTexture(textureHandle),
      evidence: 'Read CPU packing used by the live material and its uploaded WebGL texture handle; no GPU texture readback.' }
    batch.updateWorldMatrix(true, false)
    let i = 0
    for (const [text, packing] of batch._members) {
      const item = items[i++]
      if (!groups.includes(item.group)) continue
      const info = text.textRenderInfo, block = info?.blockBounds, visible = info?.visibleBounds
      const referenceGlyph = source?.glyphs[text.text]
      const visibleInkHeight = visible ? visible[3] - visible[1] : null
      const expectedInkHeight = referenceGlyph?.fontHeight > 0
        ? referenceGlyph.fontHeight * text.fontSize / 1000 : null
      const clip = Array.isArray(text.clipRect) ? [...text.clipRect] : null
      const fraction = block && clip && block[2] > block[0] ? (clip[2] - block[0]) / (block[2] - block[0]) : null
      const base = packing.index * 32
      const packedClip = packed && packing.index >= 0 ? Array.from(packed.slice(base + 20, base + 24)) : null
      const screenPoints = item.bounds && camera ? [[item.bounds[0], item.bounds[1]], [item.bounds[2], item.bounds[1]],
        [item.bounds[2], item.bounds[3]], [item.bounds[0], item.bounds[3]]].map(([x, y]) => {
        const point = text.position.clone().set(x, y, 0).applyMatrix4(batch.matrixWorld).project(camera)
        return [(point.x + 1) * innerWidth / 2, (1 - point.y) * innerHeight / 2, point.z]
      }) : null
      fontMembers.push({ group: item.group, text: text.text, font: text.font,
        ready: !!info && !!info.glyphAtlasIndices?.length && !!info.sdfTexture,
        glyphCount: info?.glyphAtlasIndices?.length ?? 0, atlasIndices: info ? Array.from(info.glyphAtlasIndices ?? []) : [],
        fontSize: text.fontSize, capHeight: info?.capHeight ?? null, visibleInkHeight, expectedInkHeight,
        referenceFontHeight: referenceGlyph?.fontHeight ?? null, blockBounds: block ? Array.from(block) : null,
        visibleBounds: visible ? Array.from(visible) : null, bounds: item.bounds, screenPoints,
        matrix: text.matrix.toArray(), color: typeof text.color === 'number' ? text.color : null,
        clip, fraction, fillOpacity: text.fillOpacity, packingIndex: packing.index,
        packedClip, packedColor: packed && packing.index >= 0 ? packed[base + 24] : null,
        packedOpacity: packed && packing.index >= 0 ? packed[base + 25] : null, timings: info?.timings ?? null })
    }
  }
  const paths = [], uniforms = []
  let graphiteColor = null
  for (const mesh of pathMeshes) {
    const attr = mesh.geometry.attributes, u = mesh.material?.uniforms
    if (!attr.aSeg || !attr.aStyle || !attr.aDash || !attr.aRange) continue
    const notePaths = []
    for (let i = 0; i < attr.aStyle.count; i++) {
      const style = attr.aStyle.array.slice(i * 4, i * 4 + 4)
      if (!groups.includes(Math.round(style[1]))) continue
      notePaths.push({ segment: Array.from(attr.aSeg.array.slice(i * 4, i * 4 + 4)), style: Array.from(style),
        range: Array.from(attr.aRange.array.slice(i * 2, i * 2 + 2)), dash: attr.aDash.array[i] })
    }
    paths.push({ matrix: mesh.matrix.toArray(), paths: notePaths })
    if (u?.uReveal?.value) {
      const light = 0.14 + 0.86 * (u.uLampPower?.value ?? NaN)
      uniforms.push({ noteReveal: Object.fromEntries(groups.map(group => [group, u.uReveal.value[group]])),
        opacity: u.uOpacity?.value ?? null, lampPower: u.uLampPower?.value ?? null,
        graphite: u.uInkGraphite?.value?.toArray?.() ?? null, red: u.uInkRed?.value?.toArray?.() ?? null,
        expectedGraphite: source && u.uInkGraphite?.value
          ? u.uInkGraphite.value.clone().set(source.ink.INK_GRAPHITE).multiplyScalar(light).toArray() : null,
        expectedRed: source && u.uInkRed?.value
          ? u.uInkRed.value.clone().set(source.ink.INK_RED).multiplyScalar(light).toArray() : null })
    }
    if (u?.uInkGraphite?.value && source) graphiteColor = u.uInkGraphite.value.clone().set(source.ink.INK_GRAPHITE).getHex('srgb-linear')
  }
  const phase = window.__telemetry?.drawing?.phase
  const expectedReveal = source?.camera?.expectedReveal ?? null
  return { at: performance.now(), telemetry: structuredClone(window.__telemetry ?? null),
    stats: structuredClone(proof?.sheetStats?.() ?? window.__sheetStats ?? null), textBounds,
    renderer: rendererDescription, camera: camera ? { matrix: camera.matrixWorld.toArray(), fov: camera.fov,
      position: camera.position.toArray() } : null, mode: window.__drawingProofMode ?? 'normal',
    matchingBatches: candidates.length, batchMemberCount: batch?._members.size ?? null,
    fontMembers, packedTexture, graphiteColor, paths, uniforms,
    expectedNoteReveal: expectedReveal ? Object.fromEntries(groups.map(group => [group, expectedReveal[group]])) : null,
    contextLosses: window.__handwritingGL?.contextLosses ?? null, linkFailures: window.__handwritingGL?.linkFailures ?? [] }
}

async function settle(page, t) {
  const start = Date.now()
  await page.evaluate(progress => window.__drawingProof.setProgress(progress), t * 0.12)
  let previous = null, quiet = 0, last = null
  while (Date.now() - start < Math.min(timeout, 20000)) {
    await page.waitForTimeout(150)
    last = await page.evaluate(() => {
      const camera = window.__threeCamera, telemetry = window.__telemetry
      return { matrix: camera?.matrixWorld.toArray(), fov: camera?.fov, phase: telemetry?.drawing?.phase,
        progress: telemetry?.scroll?.progress, goal: telemetry?.camera?.goal?.position,
        position: camera?.position.toArray() }
    })
    const delta = previous ? maxDelta([...(last.matrix ?? []), last.fov], [...(previous.matrix ?? []), previous.fov]) : null
    const goalDelta = maxDelta(last.position, last.goal)
    quiet = delta !== null && delta <= 1e-7 && goalDelta !== null && goalDelta <= 1e-4 ? quiet + 1 : 0
    if (quiet >= 3 && Math.abs(last.phase - t) < 1e-8 && Math.abs(last.progress - t * 0.12) < 1e-8) {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      return { converged: true, elapsedMs: Date.now() - start, cameraDelta: delta, goalDelta, last }
    }
    previous = last
  }
  return { converged: false, elapsedMs: Date.now() - start, last }
}

function validateSnapshot(result, snapshot, label, source) {
  const observed = snapshot.renderer
  check(result, `${label}: live actual renderer`, !!observed?.canvasConnected && !observed.contextLost
    && observed.observedDraws > 0 && observed.msSinceLastDraw < 2000, observed)
  check(result, `${label}: normal scene mode`, snapshot.mode === 'normal', snapshot.mode)
  check(result, `${label}: annotationsReady`, snapshot.telemetry?.drawing?.annotationsReady === true)
  check(result, `${label}: GL health`, snapshot.contextLosses === 0 && snapshot.linkFailures.length === 0,
    { contextLosses: snapshot.contextLosses, linkFailures: snapshot.linkFailures })
  for (const [groupString, expected] of Object.entries(source.expected)) {
    const group = Number(groupString), bounds = snapshot.textBounds?.items.filter(item => item.group === group) ?? []
    check(result, `${label}: group ${group} finite actual bounds`, bounds.length > 0
      && bounds.every(item => finiteRect(item.bounds)), { count: bounds.length })
    check(result, `${label}: group ${group} letter identity/count`, bounds.map(item => item.text).join('') === expected.fontText,
      { actual: bounds.map(item => item.text).join(''), expected: expected.fontText,
        vectorFallbackCharacters: expected.vectorFallbackCharacters })
  }
  const airMotor = snapshot.textBounds?.items.filter(item => /\bAIR\s+MOTOR\b/i.test(item.text)) ?? []
  const output = snapshot.textBounds?.items.filter(item => item.group === 17) ?? []
  const overlap = output.flatMap(note => airMotor.filter(callout => finiteRect(note.bounds) && finiteRect(callout.bounds)
    && intersects(note.bounds, callout.bounds)).map(callout => ({ note: note.text, noteBounds: note.bounds,
      callout: callout.text, calloutBounds: callout.bounds })))
  check(result, `${label}: output/AIR MOTOR overlap`, !airMotor.length ? null
    : airMotor.every(item => finiteRect(item.bounds)) && overlap.length === 0,
  { calloutsFound: airMotor.length, overlaps: overlap, units: 'sheet metres; actual unclipped Troika bounds' })
  if (snapshot.matchingBatches !== 1 || !snapshot.fontMembers.length) {
    check(result, `${label}: actual Troika members and reveal uniforms`, null,
      { reason: 'Could not uniquely correlate live BatchedText members with captureTextBounds order.', matchingBatches: snapshot.matchingBatches })
    return
  }
  check(result, `${label}: actual font readiness`, snapshot.fontMembers.every(member => member.ready
    && member.glyphCount === 1 && /\/AcFastReference\.ttf(?:[?#]|$)/.test(member.font)
    // Typesetter returns per-font metrics; TextBuilder's copied top-level
    // capHeight is undefined. Prove cap size from the live visible ink bounds
    // and the reference glyph's measured TTF extent instead of that stale field.
    && finiteRect(member.visibleBounds) && Number.isFinite(member.fontSize) && member.fontSize > 0
    && Number.isFinite(member.expectedInkHeight) && member.expectedInkHeight > 0
    && Number.isFinite(member.visibleInkHeight)
    && Math.abs(member.visibleInkHeight - member.expectedInkHeight) <= Math.max(1e-8, member.expectedInkHeight * 1e-5)),
  { count: snapshot.fontMembers.length, fonts: [...new Set(snapshot.fontMembers.map(member => member.font))],
    capProof: 'Live visible ink height agrees with source TTF fontHeight × fontSize / 1000.',
    maxInkHeightDelta: Math.max(...snapshot.fontMembers.map(member => Math.abs(member.visibleInkHeight - member.expectedInkHeight))),
    tolerance: 'max(1e-8 metres, expected ink height × 1e-5)' })
  check(result, `${label}: graphite letter identities`, snapshot.graphiteColor === null ? null
    : snapshot.fontMembers.every(member => member.color === snapshot.graphiteColor), { expectedLinearHex: snapshot.graphiteColor })
  const packed = snapshot.packedTexture
  check(result, `${label}: packed per-letter reveal uniforms`, !packed?.available ? null
    : packed.boundToMaterial && packed.uploadedTexture && snapshot.fontMembers.every(member => {
      const clipDelta = maxDelta(member.clip, member.packedClip)
      return clipDelta !== null && clipDelta < 1e-6 && Number.isFinite(member.fraction)
        && member.fraction >= -1e-6 && member.fraction <= 1 + 1e-6
        && member.color === member.packedColor && Number.isFinite(member.packedOpacity)
        && Math.abs(member.fillOpacity - member.packedOpacity) < 1e-6
    }), packed)
  check(result, `${label}: note reveal uniforms`, !snapshot.uniforms.length || !snapshot.expectedNoteReveal ? null
    : snapshot.uniforms.every(u => Object.entries(snapshot.expectedNoteReveal)
      .every(([group, expected]) => Number.isFinite(u.noteReveal[group]) && Math.abs(u.noteReveal[group] - expected) < 1e-6)),
  { actual: snapshot.uniforms.map(u => u.noteReveal), expected: snapshot.expectedNoteReveal })
  const colors = [...new Set(snapshot.paths.flatMap(mesh => mesh.paths.map(item => Math.floor(item.dash / 10 + 0.5))))]
  check(result, `${label}: vector red/graphite identities`, snapshot.paths.length ? colors.includes(1) && colors.includes(2) : null,
    { observedPenColors: colors, red: 1, graphite: 2 })
  check(result, `${label}: actual red/graphite shader colors`, !snapshot.uniforms.length ? null
    : snapshot.uniforms.every(u => {
      const graphiteDelta = maxDelta(u.graphite, u.expectedGraphite), redDelta = maxDelta(u.red, u.expectedRed)
      return graphiteDelta !== null && redDelta !== null && graphiteDelta <= 1e-7 && redDelta <= 1e-7
    }), snapshot.uniforms)
}

async function warmMetrics(page) {
  return page.evaluate(async () => {
    const samples = [], counts = [], renderer = window.__threeRenderer
    let previous = performance.now()
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
      const now = performance.now()
      samples.push(now - previous); previous = now
      counts.push({ frame: renderer?.info.render.frame, calls: renderer?.info.render.calls,
        triangles: renderer?.info.render.triangles })
    }
    const sorted = [...samples].sort((a, b) => a - b)
    return { definition: '60 observed rAF intervals in the normal rendered scene; not GPU timings or an FPS acceptance gate.',
      frames: samples.length, medianFrameMs: sorted[30], p95FrameMs: sorted[Math.ceil(sorted.length * 0.95) - 1],
      minFrameMs: sorted[0], maxFrameMs: sorted.at(-1), renderCounters: counts,
      rendererMemory: renderer?.info.memory ?? null, programs: renderer?.info.programs?.length ?? null,
      warmReady: window.__telemetry?.performance?.warmReady ?? null, tier: window.__telemetry?.performance?.tier ?? null }
  })
}

const report = { url: url.href, started: new Date().toISOString(), launchContract: describeLaunch(), qualityLock,
  oracle: { file: oracleBundle, sha256: hash(fs.readFileSync(oracleBundle)), method: 'Runner-side esbuild bundle of local source exports; no /src request to the preview server.' },
  performanceProofEligible: !qualityLock, evidenceClass: qualityLock ? 'quality-locked visual proof; performance acceptance excluded' : 'natural quality-ladder note proof',
  qualityPolicy: 'No forced tier, renderer, DPR, proof mode, or pass override. Explicit qualityLock disables the automatic quality ratchet for visual captures only.',
  readinessDefinition: 'Fresh browser context, HTTP cache disabled. Navigation to actual drawn renderer and annotationsReady; server/OS caches uncontrolled.',
  scope: 'Handwritten note typography, live bounds, colors, reveal and reverse consistency only.',
  cases: [] }
let browser
try {
  browser = await launchBrowser(chromium)
  for (const config of cases) {
    const result = { ...config, checks: [], errors: [], consoleErrors: [], requestFailures: [], checkpoints: [],
      unverified: ['Glyph font provenance inside Troika\'s private SDF atlas is not exposed; requested font, real layout readiness, glyph counts and font HTTP response are recorded.',
        'Uploaded per-member texture handle and CPU packing are observed; no GPU texture-value readback is claimed.'] }
    report.cases.push(result)
    let context
    try {
      context = await browser.newContext({ viewport: { width: config.width, height: config.height },
        deviceScaleFactor: 1, reducedMotion: 'no-preference' })
      const page = await context.newPage()
      page.setDefaultTimeout(timeout)
      page.on('pageerror', error => result.errors.push(String(error)))
      page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()) })
      page.on('requestfailed', request => result.requestFailures.push({ url: request.url(), error: request.failure() }))
      const fontResponses = []
      page.on('response', response => {
        if (/\/AcFastReference\.ttf(?:[?#]|$)/.test(response.url())) fontResponses.push({ url: response.url(), status: response.status() })
      })
      const session = await context.newCDPSession(page)
      await session.send('Network.enable')
      await session.send('Network.setCacheDisabled', { cacheDisabled: true })
      const began = Date.now()
      await page.goto(url.href, { waitUntil: 'domcontentloaded' })
      result.navigationMs = Date.now() - began
      await page.waitForFunction(() => !!window.__drawingProof?.ready,
        null, { timeout })
      result.proofReadyMs = Date.now() - began
      await page.waitForFunction(() => window.__telemetry?.drawing?.annotationsReady === true
        && !!window.__threeRenderer && !!window.__threeScene && !!window.__threeCamera,
      null, { timeout })
      result.annotationsReadyMs = Date.now() - began
      await page.evaluate(observeGL)
      await page.waitForFunction(() => window.__handwritingGL.entries.some(entry => entry.gl === window.__threeRenderer?.getContext()
        && entry.canvas.isConnected && entry.draws > 0), null, { timeout })
      result.liveDrawReadyMs = Date.now() - began
      result.observerScope = 'Mounted renderer after normal annotations readiness; startup capability/SDF probes are not intercepted.'
      const readyPhase = await page.evaluate(() => window.__telemetry?.drawing?.phase)
      result.source = sourceForPage(readyPhase)
      result.sourceImportReadyMs = Date.now() - began
      const readySnapshot = await page.evaluate(readRuntime, result.source)
      result.actualFontReadyObservedMs = readySnapshot.fontMembers.length
        && readySnapshot.fontMembers.every(member => member.ready) ? Date.now() - began : null
      result.warmReadyObservedMs = readySnapshot.telemetry?.performance?.warmReady ? Date.now() - began : null
      check(result, 'Runner-bundled source reference/pure handwriting proof', result.source.contourIssues.length === 0
        && result.source.samples.every(sample => sample.deterministic && sample.finiteBounds), result.source)
      const capture = async (t, direction = 'forward') => {
        const name = `${config.name}-${direction}-${t.toFixed(2)}`
        const convergence = await settle(page, t)
        check(result, `${name}: converged camera/progress`, convergence.converged, convergence)
        const phase = await page.evaluate(() => window.__telemetry?.drawing?.phase)
        const snapshot = await page.evaluate(readRuntime, sourceForPage(phase))
        const screenshot = path.join(out, `${name}.png`)
        await page.screenshot({ path: screenshot, animations: 'allow', timeout })
        const checkpoint = { name, normalizedT: t, pacedProgress: t * 0.12, convergence, snapshot, screenshot }
        result.checkpoints.push(checkpoint)
        validateSnapshot(result, snapshot, name, result.source)
        save(`${name}.json`, checkpoint)
        return checkpoint
      }
      for (const t of [0.15, 0.17, 0.24, 0.29]) await capture(t)
      result.warmMetrics = await warmMetrics(page)
      if (result.warmMetrics.warmReady && result.warmReadyObservedMs === null) result.warmReadyObservedMs = Date.now() - began
      result.warmMetrics.handwritingMemberCount = result.checkpoints.at(-1).snapshot.fontMembers.length
      result.warmMetrics.qualityLock = qualityLock
      const forward = await capture(0.17, 'cycle-forward')
      await capture(0.29, 'cycle-turn')
      const reverse = await capture(0.17, 'cycle-reverse')
      const a = forward.snapshot, b = reverse.snapshot
      const stableMembers = snapshot => snapshot.fontMembers.map(member => ({ group: member.group, text: member.text,
        font: member.font, bounds: member.bounds, matrix: member.matrix, color: member.color, clip: member.clip,
        fraction: member.fraction, fillOpacity: member.fillOpacity, packedClip: member.packedClip,
        packedColor: member.packedColor, packedOpacity: member.packedOpacity }))
      const memberEquality = JSON.stringify(stableMembers(a)) === JSON.stringify(stableMembers(b))
      const boundsEquality = JSON.stringify(a.textBounds?.items.filter(item => [16, 17].includes(item.group)))
        === JSON.stringify(b.textBounds?.items.filter(item => [16, 17].includes(item.group)))
      const pathsEquality = JSON.stringify(a.paths) === JSON.stringify(b.paths)
      result.reverse = { sequence: [0.17, 0.29, 0.17], memberEquality, boundsEquality, pathsEquality,
        cameraDelta: maxDelta(a.camera?.matrix, b.camera?.matrix),
        screenshots: compareScreenshots(forward.screenshot, reverse.screenshot) }
      check(result, 'reverse: actual bounds', boundsEquality && !!a.textBounds && !!b.textBounds)
      check(result, 'reverse: actual paths', a.paths.length && b.paths.length ? pathsEquality : null)
      check(result, 'reverse: member placement and reveal', a.fontMembers.length && b.fontMembers.length ? memberEquality : null)
      const forwardPoints = result.checkpoints.slice(0, 4)
      check(result, 'forward: per-letter reveal monotonic', forwardPoints.every(point => point.snapshot.fontMembers.length) ?
        forwardPoints.slice(1).every((point, index) => point.snapshot.fontMembers.length === forwardPoints[index].snapshot.fontMembers.length
          && point.snapshot.fontMembers.every((member, i) => member.text === forwardPoints[index].snapshot.fontMembers[i].text
            && Number.isFinite(member.fraction) && member.fraction + 1e-6 >= forwardPoints[index].snapshot.fontMembers[i].fraction)) : null)
      const endMembers = result.checkpoints[3].snapshot.fontMembers
      check(result, 'completed notes at normalized .29', endMembers.length ? endMembers.every(member => Math.abs(member.fraction - 1) < 1e-6) : null)
      const firstOutput = result.checkpoints[0].snapshot.fontMembers.filter(member => member.group === 17)
      check(result, 'output hidden at normalized .15', firstOutput.length ? firstOutput.every(member => Math.abs(member.fraction) < 1e-6 && member.fillOpacity === 0) : null)
      result.fontResponses = fontResponses
      check(result, 'reference TTF response', fontResponses.some(response => response.status >= 200 && response.status < 300), fontResponses)
      const cacheValues = result.checkpoints.map(point => point.snapshot.stats?.precomputed ?? null)
      result.cache = { precomputed: cacheValues, requirement: 'Regenerated release evidence requires precomputed=1 at every checkpoint.' }
      check(result, 'regenerated precompute', cacheValues.every(value => value === 1) ? true : requirePrecomputed ? false : null, result.cache)
      check(result, 'runtime errors', result.errors.length === 0 && result.consoleErrors.length === 0,
        { errors: result.errors, consoleErrors: result.consoleErrors })
    } catch (error) {
      result.errors.push(String(error.stack ?? error))
      check(result, 'runtime execution', false, String(error))
    } finally {
      await context?.close()
      result.status = result.checks.some(item => item.status === 'failed') ? 'failed'
        : result.checks.some(item => item.status === 'unverified') ? 'unverified' : 'verified'
      save(`${config.name}-report.json`, result)
      console.log(`${config.name}: ${result.status}; annotationsReady ${result.annotationsReadyMs ?? 'unavailable'} ms; ${result.checkpoints.length} captures`)
    }
  }
} catch (error) { report.fatalError = String(error.stack ?? error) }
finally {
  try { await browser?.close() } catch (error) { report.closeError = String(error); report.fatalError ??= String(error) }
  report.finished = new Date().toISOString()
  report.status = report.fatalError || report.cases.some(result => result.status === 'failed') ? 'failed'
    : report.cases.some(result => result.status === 'unverified') ? 'unverified' : 'verified'
  save('report.json', report)
  console.log(`Handwriting evidence: ${report.status}; ${path.join(out, 'report.json')}`)
  process.exitCode = report.status === 'failed' ? 1 : report.status === 'unverified' ? 2 : 0
}
