/**
 * v3 binary container for the drawing precompute asset.
 *
 * The v2 JSON asset spent 98% of its bytes printing full-precision float64 decimals
 * for the CAD linework: 1.9M numbers became ~23.4 MB of text for data worth 14.7 MB
 * as raw f64. The container keeps every value bit-exact and changes only the encoding:
 *
 *   [u8 x4]  magic 'JGD3'
 *   [u32 LE] containerVersion (= DRAWING_CODEC_VERSION)
 *   [u32 LE] cacheVersion    (semantic DRAWING_CACHE_VERSION the asset was baked with)
 *   [u32 LE] segNumbers      (length of the segs number list; stride 9 per segment)
 *   [u32 LE] fillNumbers     (length of the fills number list; stride 15 per triangle)
 *   [u32 LE] profilePoints   (count of [x, y] pairs)
 *   [u32 LE] sidecarBytes    (UTF-8 byte length of the sidecar JSON below)
 *   [sidecar JSON] { key, texts, marks, stats }
 *   [zero padding] up to 8-byte alignment (keeps a typed view legal if one is ever added)
 *   [f64 LE xN] segs..., fills..., profile x,y... (N = segNumbers + fillNumbers + 2*profilePoints)
 *
 * Every multi-byte access goes through DataView with explicit little-endian — the bytes
 * are a portable encoding, not a same-machine memory dump. Decode validates all counts
 * and lengths against the actual byteLength before allocating, scans every decoded
 * number for finiteness, and returns null on any malformation so callers fail closed
 * to the live bake. Semantic validation (key match, text/mark/stat shapes) stays in
 * drawingCache.valid(), which runs on the decoded object like on any payload.
 */
import type { DrawingPrecompute } from './drawingCache'

export const DRAWING_CODEC_VERSION = 3

const MAGIC = [0x4a, 0x47, 0x44, 0x33] as const // 'JGD3'
const HEADER_BYTES = 28
const U32_MAX = 0xffff_ffff
const align8 = (n: number) => (n + 7) & ~7

function isContainer(bytes: Uint8Array): boolean {
  return bytes.length >= HEADER_BYTES
    && bytes[0] === MAGIC[0] && bytes[1] === MAGIC[1] && bytes[2] === MAGIC[2] && bytes[3] === MAGIC[3]
}

/** True when every value is finite; NaN/Infinity must never enter the container. */
function allFinite(values: number[]): boolean {
  for (let i = 0; i < values.length; i += 1) if (!Number.isFinite(values[i])) return false
  return true
}

export function encodeDrawingPrecompute(asset: DrawingPrecompute): Uint8Array<ArrayBuffer> {
  const { segs, fills, profile } = asset
  if (segs.length % 9 !== 0 || fills.length % 15 !== 0 || profile.length < 4) {
    throw new Error('Precompute arrays violate their strides')
  }
  if (!allFinite(segs) || !allFinite(fills)) {
    throw new Error('Precompute linework contains non-finite numbers')
  }
  for (const point of profile) {
    if (point.length !== 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      throw new Error('Precompute profile contains a malformed point')
    }
  }
  const numbers = segs.length + fills.length + profile.length * 2
  if (numbers > U32_MAX || profile.length > U32_MAX) {
    throw new Error('Precompute exceeds u32 count bounds')
  }
  const sidecar = JSON.stringify({ key: asset.key, texts: asset.texts, marks: asset.marks, stats: asset.stats })
  const sidecarBytes = new TextEncoder().encode(sidecar)
  if (sidecarBytes.length > U32_MAX) throw new Error('Precompute sidecar exceeds u32 length bounds')
  const dataStart = align8(HEADER_BYTES + sidecarBytes.length)
  const buffer = new ArrayBuffer(dataStart + numbers * 8)
  const view = new DataView(buffer)
  const out = new Uint8Array(buffer)
  out.set(MAGIC, 0)
  view.setUint32(4, DRAWING_CODEC_VERSION, true)
  view.setUint32(8, asset.version, true)
  view.setUint32(12, segs.length, true)
  view.setUint32(16, fills.length, true)
  view.setUint32(20, profile.length, true)
  view.setUint32(24, sidecarBytes.length, true)
  out.set(sidecarBytes, HEADER_BYTES)
  let offset = dataStart
  for (let i = 0; i < segs.length; i += 1) { view.setFloat64(offset, segs[i], true); offset += 8 }
  for (let i = 0; i < fills.length; i += 1) { view.setFloat64(offset, fills[i], true); offset += 8 }
  for (let i = 0; i < profile.length; i += 1) {
    view.setFloat64(offset, profile[i][0], true); offset += 8
    view.setFloat64(offset, profile[i][1], true); offset += 8
  }
  return out
}

/** Decode and fully validate a v3 container; null on any malformation (fail closed). */
export function decodeDrawingPrecompute(bytes: Uint8Array): DrawingPrecompute | null {
  if (!isContainer(bytes)) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint32(4, true) !== DRAWING_CODEC_VERSION) return null
  const cacheVersion = view.getUint32(8, true)
  const segNumbers = view.getUint32(12, true)
  const fillNumbers = view.getUint32(16, true)
  const profilePoints = view.getUint32(20, true)
  const sidecarBytes = view.getUint32(24, true)
  // Stride gates before any arithmetic, so corrupt counts cannot smuggle odd lengths through.
  if (segNumbers % 9 !== 0 || fillNumbers % 15 !== 0 || profilePoints < 4) return null
  // Bounded lengths: every allocation below is justified by an exact byte accounting
  // against the payload we already hold, never by an attacker-chosen count alone.
  const sidecarEnd = HEADER_BYTES + sidecarBytes
  if (sidecarEnd > bytes.length) return null
  const totalNumbers = segNumbers + fillNumbers + profilePoints * 2
  if (!Number.isSafeInteger(totalNumbers)) return null
  const dataStart = align8(sidecarEnd)
  if (dataStart + totalNumbers * 8 !== bytes.length) return null
  let sidecar: unknown
  try {
    sidecar = JSON.parse(new TextDecoder().decode(bytes.subarray(HEADER_BYTES, sidecarEnd)))
  } catch {
    return null
  }
  if (!sidecar || typeof sidecar !== 'object') return null
  const { key, texts, marks, stats } = sidecar as DrawingPrecompute
  if (typeof key !== 'string' || !Array.isArray(texts) || !marks || !stats) return null
  const segs = new Array<number>(segNumbers)
  let offset = dataStart
  for (let i = 0; i < segNumbers; i += 1) {
    const value = view.getFloat64(offset, true)
    if (!Number.isFinite(value)) return null
    segs[i] = value
    offset += 8
  }
  const fills = new Array<number>(fillNumbers)
  for (let i = 0; i < fillNumbers; i += 1) {
    const value = view.getFloat64(offset, true)
    if (!Number.isFinite(value)) return null
    fills[i] = value
    offset += 8
  }
  const profile = new Array<number[]>(profilePoints)
  for (let i = 0; i < profilePoints; i += 1) {
    const x = view.getFloat64(offset, true)
    const y = view.getFloat64(offset + 8, true)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    profile[i] = [x, y]
    offset += 16
  }
  return { version: cacheVersion, key, segs, fills, texts, marks, stats, profile }
}
