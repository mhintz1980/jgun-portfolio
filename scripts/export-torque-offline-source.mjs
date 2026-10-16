#!/usr/bin/env node
/**
 * JG-038 Stage 5/6 - torque offline source export (prototype).
 *
 * Emits a DETERMINISTIC source/vector intermediate for the drafting chapter from the real
 * procedural CPU pipeline, so Stage 6 offline art derives from the same registered content
 * the page draws - never from an invented design and never from a runtime canvas capture.
 *
 * Real pipeline this targets (all in this workspace, no protected sibling):
 *   buildWrenchRig(root)            src/scene/rig/nodeRoles.ts:191        pure CPU
 *   snapshotDrawing(rig)            src/scene/drawing/drawingGeometry.ts:202  pure CPU
 *   makeDrawingLayout(aspect, box)  src/scene/drawing/drawingGeometry.ts:322  pure CPU
 *   composeSheet(gl, data, layout)  src/scene/drawing/sheet/composeSheet.ts:130  ONE GL seam
 *   encode/decodeDrawingPrecompute  src/scene/drawing/sheet/drawingCodec.ts  pure CPU
 *
 * The single GL dependency is the PRIVATE depthField() inside
 * src/scene/drawing/sheet/edgeExtract.ts:181, reached through extractView(). Every other
 * stage - edge set, section linework, ink, fills, text, annotations, profile, fracture and
 * pit geometry - is CPU. See the contract payload for the exact seam and the requested
 * interface shapes.
 *
 * Modes (all read-only; nothing is written unless --out is given):
 *   contract                       export contract, schema, frozen fonts, GLB check
 *   glb [--path f]                 light GLB header/extension verification (no decode)
 *   container [--path f]           decode the v3 JGD3 container, report structure
 *   svg [--path f] --out f.svg     decode a container and emit deterministic SVG vectors
 *   layout [--aspect n] --bounds x0,y0,z0,x1,y1,z1   run the real makeDrawingLayout
 *
 * This script never loads a WebGL context, never rasterizes, never decodes mesh data,
 * never runs Blender and never writes into C:/Projects/CAD.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { Buffer } from 'node:buffer'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const NL = String.fromCharCode(10)

const argv = process.argv.slice(2)

// Piping into a consumer that exits early (Select-String, head) must not look like a failure.
for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (error) => {
    if (error && error.code === 'EPIPE') process.exit(0)
    throw error
  })
}

const MODE = argv.find((a) => a.startsWith('--') === false) ?? 'contract'
const has = (name) => argv.includes('--' + name)
const flag = (name, fallback) => {
  const i = argv.indexOf('--' + name)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}

const FINE_GLB = 'C:/Projects/CAD/JGUN.glb'
const DEFAULTS = {
  glb: FINE_GLB,
  container: path.join(ROOT, 'public/drawing/jgun-sheet-v2.bin.gz'),
}

const FROZEN_FONTS = [
  'public/fonts/BarlowCondensed-Medium.ttf',
  'public/fonts/BarlowCondensed-SemiBold.ttf',
  'public/fonts/AcFastReference.ttf',
]

// ---------------------------------------------------------------------------------------------
// Light readers: nothing below allocates from a file bigger than its declared chunk
// ---------------------------------------------------------------------------------------------

function fileIdentity(file) {
  const stat = fs.statSync(file)
  return { path: file, bytes: stat.size, mtime: stat.mtime.toISOString() }
}

/** Scan a byte range in bounded blocks for JSON markers. Never materialises the whole chunk. */
function scanChunk(fd, offset, length, markers, blockBytes = 4 * 1024 * 1024) {
  const found = {}
  const overlap = 64
  let carry = Buffer.alloc(0)
  let read = 0
  while (read < length) {
    const size = Math.min(blockBytes, length - read)
    const buf = Buffer.alloc(size)
    fs.readSync(fd, buf, 0, size, offset + read)
    const hay = Buffer.concat([carry, buf]).toString('latin1')
    for (const marker of markers) if (found[marker] !== true) found[marker] = hay.includes(marker)
    carry = buf.subarray(Math.max(0, buf.length - overlap))
    read += size
  }
  return found
}

/**
 * GLB header walk. Reads the 12-byte header, each 8-byte chunk header, and the JSON chunk
 * only as a bounded scan (or a full parse when it is small enough to justify one).
 */
function readGlbHeader(file, parseCapBytes = Number(flag('parse-cap', 20 * 1024 * 1024))) {
  if (!fs.existsSync(file)) return { path: file, missing: true }
  const fd = fs.openSync(file, 'r')
  try {
    const identity = fileIdentity(file)
    const header = Buffer.alloc(12)
    fs.readSync(fd, header, 0, 12, 0)
    const magic = header.toString('ascii', 0, 4)
    if (magic !== 'glTF') return { ...identity, error: 'not a GLB, magic=' + JSON.stringify(magic) }
    const version = header.readUInt32LE(4)
    const declaredBytes = header.readUInt32LE(8)
    const chunks = []
    let offset = 12
    let jsonChunk = null
    while (offset + 8 <= Math.min(declaredBytes, identity.bytes)) {
      const head = Buffer.alloc(8)
      fs.readSync(fd, head, 0, 8, offset)
      const length = head.readUInt32LE(0)
      const type = head.toString('ascii', 4, 8).replace(/[^A-Za-z]/g, '')
      chunks.push({ type, length, offset })
      if (type === 'JSON' && jsonChunk === null) jsonChunk = { offset: offset + 8, length }
      offset += 8 + length
    }
    const markers = [
      'extensionsUsed',
      'extensionsRequired',
      'KHR_draco_mesh_compression',
      'KHR_texture_basisu',
      'KHR_mesh_quantization',
      'EXT_meshopt_compression',
    ]
    let scan = null
    let counts = null
    let jsonParsed = false
    if (jsonChunk) {
      if (jsonChunk.length <= parseCapBytes) {
        const buf = Buffer.alloc(jsonChunk.length)
        fs.readSync(fd, buf, 0, jsonChunk.length, jsonChunk.offset)
        try {
          const gltf = JSON.parse(buf.toString('utf8'))
          jsonParsed = true
          const primitives = Array.isArray(gltf.meshes)
            ? gltf.meshes.reduce((n, m) => n + (Array.isArray(m.primitives) ? m.primitives.length : 0), 0)
            : 0
          counts = {
            meshes: gltf.meshes ? gltf.meshes.length : 0,
            primitives,
            nodes: gltf.nodes ? gltf.nodes.length : 0,
            materials: gltf.materials ? gltf.materials.length : 0,
            images: gltf.images ? gltf.images.length : 0,
            accessors: gltf.accessors ? gltf.accessors.length : 0,
            extensionsUsed: gltf.extensionsUsed ?? [],
            extensionsRequired: gltf.extensionsRequired ?? [],
          }
        } catch (error) {
          counts = { parseError: String(error && error.message) }
        }
      }
      if (!jsonParsed) scan = scanChunk(fd, jsonChunk.offset, jsonChunk.length, markers)
    }
    const extensionsRequired = counts ? counts.extensionsRequired : []
    const extensionsUsed = counts ? counts.extensionsUsed : []
    const draco =
      extensionsRequired.includes('KHR_draco_mesh_compression')
      || extensionsUsed.includes('KHR_draco_mesh_compression')
      || (scan !== null && scan.KHR_draco_mesh_compression === true)
    return {
      ...identity,
      glbVersion: version,
      declaredBytes,
      chunks,
      jsonChunkBytes: jsonChunk ? jsonChunk.length : 0,
      jsonParsed,
      counts,
      scan,
      draco,
      binaryCompression: draco ? 'KHR_draco_mesh_compression (decode required)' : 'none declared',
    }
  } finally {
    fs.closeSync(fd)
  }
}

// ---------------------------------------------------------------------------------------------
// Drift-proof constants: read out of the module source, never duplicated by hand
// ---------------------------------------------------------------------------------------------

function readSource(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8')
}

function constString(text, name) {
  const marker = 'export const ' + name + ' = '
  const i = text.indexOf(marker)
  if (i < 0) return null
  const quote = text.indexOf(String.fromCharCode(39), i + marker.length)
  if (quote < 0) return null
  const end = text.indexOf(String.fromCharCode(39), quote + 1)
  return text.slice(quote + 1, end)
}

/** PAPER/INK are declared in drawingGeometry.ts; INK_RED/INK_GRAPHITE in ink.ts. */
function constStringIn(sources, name) {
  for (const text of sources) {
    const value = constString(text, name)
    if (value !== null) return value
  }
  return null
}

function inkPalette() {
  const text = readSource('src/scene/drawing/sheet/ink.ts')
  const both = [readSource('src/scene/drawing/drawingGeometry.ts'), text]
  const pen = {}
  const penBlock = text.slice(text.indexOf('export const PEN = {'))
  for (const line of penBlock.slice(0, penBlock.indexOf('}')).split(NL)) {
    const m = line.match(/([a-zA-Z]+): ([0-9.]+)/)
    if (m) pen[m[1]] = Number(m[2])
  }
  const group = {}
  const groupBlock = text.slice(text.indexOf('export const GROUP = {'))
  for (const line of groupBlock.slice(0, groupBlock.indexOf('}')).split(NL)) {
    const m = line.match(/([a-zA-Z0-9]+): ([0-9]+)/)
    if (m) group[m[1]] = Number(m[2])
  }
  return {
    paper: constStringIn(both, 'PAPER'),
    ink: constStringIn(both, 'INK'),
    red: constStringIn(both, 'INK_RED'),
    graphite: constStringIn(both, 'INK_GRAPHITE'),
    penHalfWidths: pen,
    group,
  }
}

function fontWeights() {
  const text = readSource('src/scene/drawing/sheet/sheetText.ts')
  const out = {}
  for (const weight of ['medium', 'semibold', 'handwriting']) {
    const marker = weight + ': '
    const i = text.indexOf(marker)
    if (i < 0) continue
    const quote = text.indexOf(String.fromCharCode(39), i + marker.length)
    const end = text.indexOf(String.fromCharCode(39), quote + 1)
    out[weight] = text.slice(quote + 1, end)
  }
  return out
}

function fontInventory() {
  return FROZEN_FONTS.map((relative) => {
    const abs = path.join(ROOT, relative)
    if (!fs.existsSync(abs)) return { relative, missing: true }
    const bytes = fs.readFileSync(abs)
    return {
      relative,
      bytes: bytes.length,
      sha256: require('node:crypto').createHash('sha256').update(bytes).digest('hex'),
    }
  })
}

// ---------------------------------------------------------------------------------------------
// In-memory compile of the real pure modules (esbuild, write:false - nothing lands on disk)
// ---------------------------------------------------------------------------------------------

async function compileEntry(contents) {
  let esbuild
  try {
    esbuild = require('esbuild')
  } catch {
    throw new Error(
      'esbuild is not resolvable from this workspace; run through the repo install or use Vite SSR',
    )
  }
  const built = await esbuild.build({
    stdin: {
      contents,
      resolveDir: ROOT,
      sourcefile: 'torque-offline-source-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'external-three-root',
        setup(b) {
          b.onResolve({ filter: /^three$/ }, () => ({ path: 'three', external: true }))
        },
      },
    ],
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', built.outputFiles[0].text)(require, module, module.exports)
  return module.exports
}

const drawingEntry = [
  "export * from './src/scene/drawing/drawingGeometry.ts'",
].join(NL)

const codecEntry = [
  "export { decodeDrawingPrecompute, DRAWING_CODEC_VERSION } from './src/scene/drawing/sheet/drawingCodec.ts'",
].join(NL)

// ---------------------------------------------------------------------------------------------
// Container decode (v3 JGD3) and deterministic SVG emission
// ---------------------------------------------------------------------------------------------

function decodeContainer(file) {
  const identity = fileIdentity(file)
  const raw = fs.readFileSync(file)
  const bytes = file.endsWith('.gz') ? zlib.gunzipSync(raw) : raw
  return {
    identity,
    gzipBytes: raw.length,
    containerBytes: bytes.length,
    bytes,
  }
}

function summarise(asset, decoded) {
  const strideOf = (list, stride) => (list.length % stride === 0 ? stride : 0)
  const textWeights = {}
  const textColors = {}
  const textAttrs = {
    withMaxWidth: 0, withLineHeight: 0, withLetterSpacing: 0, withScaleX: 0, withRotation: 0,
    anchorX: {}, anchorY: {}, unsupportedForSvg: [],
  }
  for (const t of asset.texts) {
    textWeights[t.weight ?? 'default'] = (textWeights[t.weight ?? 'default'] ?? 0) + 1
    textColors[t.color ?? 'default'] = (textColors[t.color ?? 'default'] ?? 0) + 1
    if (t.maxWidth !== undefined) textAttrs.withMaxWidth += 1
    if (t.lineHeight !== undefined) textAttrs.withLineHeight += 1
    if (t.letterSpacing !== undefined) textAttrs.withLetterSpacing += 1
    if (t.scaleX !== undefined && t.scaleX !== 1) textAttrs.withScaleX += 1
    if (t.rotation) textAttrs.withRotation += 1
    textAttrs.anchorX[t.anchorX ?? 'default'] = (textAttrs.anchorX[t.anchorX ?? 'default'] ?? 0) + 1
    textAttrs.anchorY[t.anchorY ?? 'default'] = (textAttrs.anchorY[t.anchorY ?? 'default'] ?? 0) + 1
  }
  if (textAttrs.withMaxWidth) textAttrs.unsupportedForSvg.push('maxWidth (runtime text wrapping)')
  if (textAttrs.withLineHeight) textAttrs.unsupportedForSvg.push('lineHeight (multi-line layout)')
  const groupCounts = {}
  for (let i = 0; i < asset.segs.length; i += 9) {
    const g = asset.segs[i + 5]
    groupCounts[g] = (groupCounts[g] ?? 0) + 1
  }
  // Loop, never spread: the full CAD line set is ~2M numbers and a spread blows the stack.
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < asset.segs.length; i += 9) {
    const x1 = asset.segs[i]
    const y1 = asset.segs[i + 1]
    const x2 = asset.segs[i + 2]
    const y2 = asset.segs[i + 3]
    if (x1 < minX) minX = x1
    if (x2 < minX) minX = x2
    if (x1 > maxX) maxX = x1
    if (x2 > maxX) maxX = x2
    if (y1 < minY) minY = y1
    if (y2 < minY) minY = y2
    if (y1 > maxY) maxY = y1
    if (y2 > maxY) maxY = y2
  }
  return {
    version: asset.version,
    key: asset.key,
    keyParts: asset.key.split(':').length,
    segments: asset.segs.length / 9,
    segStride: strideOf(asset.segs, 9),
    fills: asset.fills.length / 15,
    fillStride: strideOf(asset.fills, 15),
    texts: asset.texts.length,
    textWeights,
    textColors,
    textAttrs,
    marks: Object.keys(asset.marks),
    statKeys: Object.keys(asset.stats),
    profilePoints: asset.profile.length,
    segmentExtentM: Number.isFinite(minX) ? { minX, maxX, minY, maxY } : null,
    groupCounts,
    allSegsFinite: asset.segs.every(Number.isFinite),
    allFillsFinite: asset.fills.every(Number.isFinite),
    containerBytes: decoded.containerBytes,
    gzipBytes: decoded.gzipBytes,
  }
}

/** Family name for a frozen font file, e.g. /fonts/BarlowCondensed-Medium.ttf -> BarlowCondensed-Medium. */
function familyOf(fontUrl) {
  return path.basename(fontUrl).split('.')[0]
}

/**
 * Embed the frozen TTFs as base64 @font-face rules. The font-family URL form is not a binding
 * and a renderer resolving /fonts/... from a file is not guaranteed, so the bytes travel with
 * the artwork and the glyphs come from the real outlines and real metrics.
 */
function embeddedFontFaces(fonts) {
  const faces = []
  const seen = {}
  for (const weight of Object.keys(fonts)) {
    const url = fonts[weight]
    if (!url) continue
    const family = familyOf(url)
    if (seen[family]) continue
    seen[family] = true
    const file = path.join(ROOT, 'public/fonts', path.basename(url))
    if (!fs.existsSync(file)) {
      faces.push({ weight, family, missing: file })
      continue
    }
    const bytes = fs.readFileSync(file)
    const sha256 = require('node:crypto').createHash('sha256').update(bytes).digest('hex')
    faces.push({
      weight,
      family,
      file: 'public/fonts/' + path.basename(url),
      bytes: bytes.length,
      sha256,
      css: "@font-face { font-family: '" + family + "'; font-style: normal; font-weight: normal;"
        + ' src: url(data:font/ttf;base64,' + bytes.toString('base64') + ") format('truetype'); }",
    })
  }
  return faces
}

function emitSvg(asset, dims, palette, fonts, limit = 0, options = {}) {
  const W = dims.width * 1000
  const H = dims.height * 1000
  const X = (x) => x * 1000 + W / 2
  const Y = (y) => H / 2 - y * 1000
  const n = (v) => Number(v.toFixed(4))
  const colorOf = (dash) => {
    const pen = Math.floor(dash / 10 + 0.5)
    return pen === 1 ? palette.red : pen === 2 ? palette.graphite : palette.ink
  }
  const dashOf = (dash) => Math.round(dash - 10 * Math.floor(dash / 10 + 0.5))
  // SVG-side dash rendering is a documented approximation: the runtime dashes in-shader and
  // exposes no metric constants, so each style carries its conventional ISO pattern here.
  const DASH_ARRAY = { 1: '6 3', 2: '12 3 3 3', 3: '12 3 3 3 3 3' }
  const out = []
  const faces = embeddedFontFaces(fonts)
  const embedFonts = options.embedFonts !== false
  const unverified = asset.texts.filter((t) => t.maxWidth !== undefined || t.lineHeight !== undefined).length
  out.push('<?xml version="1.0" encoding="UTF-8"?>')
  out.push('<!-- JG-038 torque offline source export. Generated from ' + asset.key + ' -->')
  out.push('<!-- 1 user unit = 1 mm of the world sheet. Sheet origin is the sheet centre, +Y up. -->')
  out.push('<!-- key / dur attributes carry the runtime reveal timing so a renderer can pick a state. -->')
  out.push('<!-- FIDELITY: geometry (segs, fills) is emitted exactly as the ink builder holds it. -->')
  out.push('<!-- FIDELITY: text is emitted with the embedded frozen outlines at the authored size, -->')
  out.push('<!-- anchors, rotation and horizontal scale; no textLength or width heuristic is used. -->')
  if (unverified) {
    out.push('<!-- UNVERIFIED TEXT: ' + unverified + ' of ' + asset.texts.length
      + ' strings carry maxWidth and/or lineHeight, which need runtime layout; those elements are -->')
    out.push('<!-- marked data-fidelity="unverified-wrapping" and must not be treated as exact. -->')
  }
  if (!embedFonts) {
    out.push('<!-- UNVERIFIED TEXT: --no-embed-fonts was requested, so no glyph data travels with the -->')
    out.push('<!-- file; every text element is marked data-fidelity="unverified-font". Geometry is exact. -->')
  }
  out.push(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + n(W) + 'mm" height="' + n(H)
    + 'mm" viewBox="0 0 ' + n(W) + ' ' + n(H) + '">',
  )
  if (embedFonts && faces.length) {
    out.push('  <defs>')
    out.push('    <style type="text/css">')
    for (const face of faces) if (face.css) out.push('      ' + face.css)
    out.push('    </style>')
    out.push('  </defs>')
  }
  out.push('  <rect x="0" y="0" width="' + n(W) + '" height="' + n(H) + '" fill="' + palette.paper + '"/>')
  let emittedSegs = 0
  let emittedFills = 0
  let emittedTexts = 0
  out.push('  <g id="segs" fill="none" stroke-linecap="round">')
  for (let i = 0; i < asset.segs.length; i += 9) {
    if (limit && emittedSegs >= limit) break
    emittedSegs += 1
    const x1 = asset.segs[i]
    const y1 = asset.segs[i + 1]
    const x2 = asset.segs[i + 2]
    const y2 = asset.segs[i + 3]
    const halfWidth = asset.segs[i + 4]
    const group = asset.segs[i + 5]
    const key = asset.segs[i + 6]
    const dur = asset.segs[i + 7]
    const dash = asset.segs[i + 8]
    const style = dashOf(dash)
    out.push(
      '    <line x1="' + n(X(x1)) + '" y1="' + n(Y(y1)) + '" x2="' + n(X(x2)) + '" y2="' + n(Y(y2))
      + '" stroke="' + colorOf(dash) + '" stroke-width="' + n(halfWidth * 2000) + '"'
      + (DASH_ARRAY[style] ? ' stroke-dasharray="' + DASH_ARRAY[style] + '"' : '')
      + ' data-group="' + group + '" data-key="' + n(key) + '" data-dur="' + n(dur) + '"/>',
    )
  }
  out.push('  </g>')
  out.push('  <g id="fills">')
  for (let i = 0; i < asset.fills.length; i += 15) {
    if (limit && emittedFills >= limit) break
    emittedFills += 1
    const points = []
    for (let v = 0; v < 3; v += 1) {
      points.push(n(X(asset.fills[i + v * 5])) + ',' + n(Y(asset.fills[i + v * 5 + 1])))
    }
    const group = asset.fills[i + 2]
    const key = asset.fills[i + 3]
    const dur = asset.fills[i + 4]
    out.push(
      '    <polygon points="' + points.join(' ') + '" fill="' + palette.ink
      + '" data-group="' + group + '" data-key="' + n(key) + '" data-dur="' + n(dur) + '"/>',
    )
  }
  out.push('  </g>')
  out.push('  <g id="texts" fill="' + palette.ink + '">')
  for (const t of asset.texts) {
    if (limit && emittedTexts >= limit) break
    emittedTexts += 1
    const size = t.size * 1000
    const anchor = t.anchorX === 'center' ? 'middle' : t.anchorX === 'right' ? 'end' : 'start'
    // anchorY 'baseline' is the SVG default (alphabetic), so it emits no dominant-baseline.
    const baseline = t.anchorY === 'middle' ? 'central' : t.anchorY === 'top' ? 'hanging'
      : t.anchorY === 'bottom' ? 'text-after-edge' : null
    const rotation = t.rotation ? -t.rotation : 0
    const scaleX = t.scaleX !== undefined && t.scaleX !== 1 ? t.scaleX : 0
    const color = t.color === 'red' ? palette.red : t.color === 'graphite' ? palette.graphite : palette.ink
    const family = familyOf(fonts[t.weight ?? 'medium'] ?? fonts.medium ?? 'BarlowCondensed-Medium.ttf')
    // troika letterSpacing is in ems; SVG letter-spacing is in user units, so em x font size.
    const spacing = t.letterSpacing ? ' letter-spacing="' + n(t.letterSpacing * size) + '"' : ''
    const transform = rotation || scaleX
      ? ' transform="translate(' + n(X(t.x)) + ' ' + n(Y(t.y)) + ')'
        + (rotation ? ' rotate(' + n(rotation) + ')' : '')
        + (scaleX ? ' scale(' + n(scaleX) + ' 1)' : '') + '"'
      : ''
    const xy = transform
      ? ' x="0" y="0"'
      : ' x="' + n(X(t.x)) + '" y="' + n(Y(t.y)) + '"'
    const fidelity = !embedFonts
      ? ' data-fidelity="unverified-font"'
      : t.maxWidth !== undefined || t.lineHeight !== undefined
        ? ' data-fidelity="unverified-wrapping"'
        : ' data-fidelity="exact"'
    out.push(
      '    <text' + xy + transform + ' font-size="' + n(size)
      + '" font-family="' + family + '"'
      + ' text-anchor="' + anchor + '"' + (baseline ? ' dominant-baseline="' + baseline + '"' : '') + spacing
      + fidelity
      + ' fill="' + color + '" data-group="' + t.group + '" data-key="' + n(t.key) + '">'
      + t.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</text>',
    )
  }
  out.push('  </g>')
  out.push('</svg>')
  return {
    svg: out.join(NL) + NL,
    emitted: { segs: emittedSegs, fills: emittedFills, texts: emittedTexts },
    fonts: faces.map((f) => ({ weight: f.weight, family: f.family, file: f.file, bytes: f.bytes, sha256: f.sha256, embedded: Boolean(f.css) })),
    textFidelity: {
      exact: embedFonts ? asset.texts.length - unverified : 0,
      unverifiedWrapping: unverified,
      fontsEmbedded: embedFonts,
      note: embedFonts
        ? 'exact = outline glyphs from the embedded frozen font at authored size/anchor/rotation/scale; unverified-wrapping = maxWidth or lineHeight needs runtime layout'
        : 'no font data embedded: every text element is unverified-font; geometry remains exact',
    },
  }
}

// ---------------------------------------------------------------------------------------------
// Contract payload - the exact export path, seams and requested interface shapes
// ---------------------------------------------------------------------------------------------

function contractPayload(glbChecks) {
  return {
    schema: 'jg038-offline-source-export/v1',
    generatedFrom: {
      root: ROOT,
      mode: 'contract',
      gl: false,
      glbDecode: false,
      blender: false,
      render: false,
    },
    intermediate: {
      format: 'JGD3 container v3 (drawingCodec.ts) equivalent to DrawingPrecompute JSON',
      shape: {
        version: 'number (DRAWING_CACHE_VERSION, currently 8)',
        key: 'string, sha256(positions):type:sha256(topology):sha256(layoutKey)',
        segs: 'number[], stride 9 = x1 y1 x2 y2 halfWidth group key dur dash',
        fills: 'number[], stride 15 = 3 x (x y group key dur)',
        texts: 'InkText[] = {text,x,y,size,anchorX?,anchorY?,rotation?,weight?,color?,scaleX?,letterSpacing?,group,key,dur?,opacity?,maxWidth?,lineHeight?,fitCell?}',
        marks: 'Record<string,[number,number]> sheet-plane anchor points',
        stats: 'Record<string,number>',
        profile: 'number[][] [x,y] pairs, the traced fracture profile',
      },
      containerLayout: [
        'u8[4] magic JGD3',
        'u32 LE containerVersion (3)',
        'u32 LE cacheVersion',
        'u32 LE segNumbers (stride 9)',
        'u32 LE fillNumbers (stride 15)',
        'u32 LE profilePoints',
        'u32 LE sidecarBytes',
        'sidecar JSON {key,texts,marks,stats}',
        'zero padding to 8-byte alignment',
        'f64 LE segs..., fills..., profile x,y...',
      ],
      determinism: 'every value bit-exact f64; no canvas, no rasterization, no font rasterization at export time',
    },
    exportPath: [
      { step: 1, fn: 'buildWrenchRig', file: 'src/scene/rig/nodeRoles.ts', line: 191, signature: 'buildWrenchRig(root: Object3D): WrenchRig', purity: 'cpu', input: 'GLTF scene parsed from the immutable Fine GLB', note: 'the only GLB-decode step; never run by this script' },
      { step: 2, fn: 'snapshotDrawing', file: 'src/scene/drawing/drawingGeometry.ts', line: 202, signature: 'snapshotDrawing(rig: WrenchRig): DrawingGeometry', purity: 'cpu', note: 'clones consolidated rest geometry, recentres on rig.center, records bounds/features/units' },
      { step: 3, fn: 'makeDrawingLayout', file: 'src/scene/drawing/drawingGeometry.ts', line: 322, signature: 'makeDrawingLayout(aspect: number, bounds: Box3): DrawingLayout', purity: 'cpu' },
      { step: 4, fn: 'buildEdgeSet', file: 'src/scene/drawing/sheet/edgeExtract.ts', line: 48, signature: 'buildEdgeSet(position: Float32Array): EdgeSet', purity: 'cpu' },
      { step: 5, fn: 'depthField', file: 'src/scene/drawing/sheet/edgeExtract.ts', line: 181, signature: 'depthField(gl: WebGLRenderer, geometry: BufferGeometry, view: ViewSpec, sink?): {z: Float32Array, w: number, h: number}', purity: 'GL', note: 'PRIVATE. The one and only GL dependency of the whole drafting pipeline.' },
      { step: 6, fn: 'extractView', file: 'src/scene/drawing/sheet/edgeExtract.ts', line: 344, signature: 'extractView(gl: WebGLRenderer, geometry: BufferGeometry, edges: EdgeSet, view: ViewSpec, sink?): ViewLines', purity: 'GL (via depthField)', note: 'everything after depthField is CPU' },
      { step: 7, fn: 'composeSheet', file: 'src/scene/drawing/sheet/composeSheet.ts', line: 130, signature: 'composeSheet(gl: WebGLRenderer, data: DrawingGeometry, layout: DrawingLayout, cleanupFailureSink?): ComposedSheet', purity: 'GL (via extractView)', returns: '{ink: InkBuilder, stats: Record<string,number>, marks: Record<string,[number,number]>}' },
      { step: 8, fn: 'exportDrawingPrecompute', file: 'src/scene/drawing/sheet/drawingCache.ts', line: 126, signature: 'exportDrawingPrecompute(): Promise<DrawingPrecompute>', purity: 'cpu', note: 'reads the last live bake; rejects an installed precompute (needs drawingCache=bypass)' },
      { step: 9, fn: 'encodeDrawingPrecompute', file: 'src/scene/drawing/sheet/drawingCodec.ts', line: 46, signature: 'encodeDrawingPrecompute(asset: DrawingPrecompute): Uint8Array<ArrayBuffer>', purity: 'cpu' },
    ],
    glSeam: {
      why: 'depthField renders an orthographic depth field of the model to a WebGLRenderTarget and reads it back to decide visibility (hidden-line removal). It is not a picture of the model; it is a z buffer.',
      fieldSemantics: {
        camera: 'OrthographicCamera(rect) at z=2, near 0.01, far 4',
        resolution: 'view.resolution samples per sheet metre; 7000 for 1:1 views, 9000 for 1:2 views',
        encoding: 'linear sheet-plane z as 24-bit fixed point over [-0.5, 0.5] m packed into RGB; alpha = coverage',
        size: 'w = max(8, ceil(rect.w * resolution)), h = max(8, ceil(rect.h * resolution))',
      },
      requestedInterfaceShapes: [
        'depthFieldCpu(geometry: BufferGeometry, view: ViewSpec): { z: Float32Array, w: number, h: number }  // identical buffer semantics to the GL path',
        'extractViewFromField(field: { z: Float32Array, w: number, h: number }, geometry: BufferGeometry, edges: EdgeSet, view: ViewSpec, sink?: CleanupFailureSink): ViewLines',
        'composeSheetCpu(data: DrawingGeometry, layout: DrawingLayout, sink?: CleanupFailureSink): ComposedSheet  // convenience wrapper over the two above',
      ],
      note: 'Either seam keeps composeSheet and everything downstream unchanged. No new design is introduced: the CPU field must reproduce the same coverage/visibility decision, so the registered content is identical.',
    },
    fractureAndPitExport: [
      { capability: 'fracture', fn: 'makeBreakthroughGeometry', file: 'src/scene/drawing/sheet/breakthroughGeometry.ts', line: 1057, purity: 'cpu' },
      { capability: 'fracture outline', fn: 'rasterTornOutline', file: 'src/scene/drawing/sheet/breakthroughGeometry.ts', line: 455, purity: 'cpu', signature: 'rasterTornOutline(profile: number[][]): number[][]' },
      { capability: 'pit', fn: 'makePrivatePitGeometry', file: 'src/scene/torque-wrench/PitGeometry.ts', purity: 'cpu', signature: 'makePrivatePitGeometry(outline: number[][]): PortalShaftGeometry' },
      { capability: 'pit shaft', fn: 'makePortalShaftGeometry', file: 'src/scene/drawing/sheet/portalGeometry.ts', line: 212, purity: 'cpu' },
      { capability: 'paper flex field', fn: 'PaperFlexField', file: 'src/scene/drawing/sheet/paperFlex.ts', purity: 'cpu' },
      { note: 'both consumers take the same profile number[][] the JGD3 container already carries, so a fracture/pit export can reuse profile from the container without re-deriving it' },
    ],
    frozenFonts: fontInventory(),
    palette: inkPalette(),
    glbChecks,
    notImplementedHere: [
      'no GL context, no depth field, no composeSheet',
      'no GLB mesh decode (header only)',
      'no Blender, no render, no rasterization, no poster PNG',
      'final background/composition still waits for Stage 5 settlement',
    ],
  }
}

// ---------------------------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------------------------

async function runContract() {
  const checks = []
  for (const file of [FINE_GLB, 'C:/Projects/CAD/JGUN-1.glb', path.join(ROOT, 'public/models/Default.glb')]) {
    checks.push(readGlbHeader(file))
  }
  return contractPayload(checks)
}

async function runLayout() {
  const aspect = Number(flag('aspect', '1.6'))
  const raw = flag('bounds', null)
  if (!raw) throw new Error('layout mode needs --bounds x0,y0,z0,x1,y1,z1 (real model bounds from snapshotDrawing)')
  const values = raw.split(',').map(Number)
  if (values.length !== 6 || values.some((v) => !Number.isFinite(v))) throw new Error('--bounds must be six finite numbers')
  const THREE = require('three')
  const mod = await compileEntry(drawingEntry)
  const bounds = new THREE.Box3(
    new THREE.Vector3(values[0], values[1], values[2]),
    new THREE.Vector3(values[3], values[4], values[5]),
  )
  const layout = mod.makeDrawingLayout(aspect, bounds)
  return {
    mode: 'layout',
    aspect,
    bounds: values,
    width: layout.width,
    height: layout.height,
    narrow: layout.narrow,
    sectionLineY: layout.sectionLineY,
    fitDistance: layout.fitDistance,
    primaryCenter: [layout.primaryCenter.x, layout.primaryCenter.y, layout.primaryCenter.z],
    views: layout.views.map((v) => ({
      name: v.name,
      label: v.label,
      scale: v.scale,
      section: v.section === true,
      rect: v.rect,
      transform: Array.from(v.transform.elements),
    })),
  }
}

async function runContainer(wantSvg) {
  const file = flag('path', DEFAULTS.container)
  const decoded = decodeContainer(file)
  const mod = await compileEntry(codecEntry)
  const asset = mod.decodeDrawingPrecompute(new Uint8Array(decoded.bytes))
  if (!asset) throw new Error('container failed to decode with the real decodeDrawingPrecompute')
  const summary = summarise(asset, decoded)
  if (!wantSvg) return { mode: 'container', codecVersion: mod.DRAWING_CODEC_VERSION, decoded: true, summary }
  const drawing = await compileEntry(drawingEntry)
  const dims = { width: drawing.SHEET_WIDTH, height: drawing.SHEET_HEIGHT }
  const limit = Number(flag('limit', '0'))
  const built = emitSvg(asset, dims, inkPalette(), fontWeights(), Number.isFinite(limit) ? limit : 0, {
    embedFonts: !has('no-embed-fonts'),
  })
  return {
    mode: 'svg',
    codecVersion: mod.DRAWING_CODEC_VERSION,
    summary,
    dims,
    emitted: built.emitted,
    fonts: built.fonts,
    textFidelity: built.textFidelity,
    svg: built.svg,
  }
}

/**
 * --out is deliberately restricted to a NEW file strictly inside <root>/.scratch/. That protects
 * sources, the evidence tree and other sessions' work; .scratch/ is gitignored working space.
 * The exclusive create flag (wx) refuses to overwrite or truncate anything that already exists.
 */
function writeNewScratchFile(requested, data) {
  const scratch = path.join(ROOT, '.scratch')
  const abs = path.resolve(ROOT, requested)
  const rel = path.relative(scratch, abs)
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('--out must be a new file inside ' + scratch + ' (resolved ' + abs + ')')
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, data, { flag: 'wx' })
  process.stdout.write('wrote ' + abs + ' (' + Buffer.byteLength(data) + ' bytes)' + NL)
}

async function main() {
  let payload
  let plain = null
  if (MODE === 'contract') payload = await runContract()
  else if (MODE === 'glb') payload = readGlbHeader(flag('path', DEFAULTS.glb))
  else if (MODE === 'container') payload = await runContainer(false)
  else if (MODE === 'svg') {
    const result = await runContainer(true)
    plain = result.svg
    payload = {
      mode: result.mode,
      codecVersion: result.codecVersion,
      dims: result.dims,
      emitted: result.emitted,
      totalAvailable: { segs: result.summary.segments, fills: result.summary.fills, texts: result.summary.texts },
      fonts: result.fonts,
      textFidelity: result.textFidelity,
      svgBytes: Buffer.byteLength(result.svg),
    }
  } else if (MODE === 'layout') payload = await runLayout()
  else throw new Error('unknown mode ' + MODE)

  const out = flag('out', null)
  if (plain !== null) {
    if (out) {
      writeNewScratchFile(out, plain)
    } else {
      process.stdout.write(plain)
    }
    return
  }
  const json = JSON.stringify(payload, null, 2)
  if (out) {
    writeNewScratchFile(out, json + NL)
  } else {
    process.stdout.write(json + NL)
  }
}

main().catch((error) => {
  process.stderr.write('export-torque-offline-source: ' + String(error && error.message ? error.message : error) + NL)
  process.exitCode = 1
})
