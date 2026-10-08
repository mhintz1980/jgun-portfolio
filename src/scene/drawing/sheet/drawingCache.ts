import type { DrawingGeometry, DrawingLayout } from '../drawingGeometry'
import type { ComposedSheet } from './composeSheet'
import { InkBuilder, type InkText } from './ink'
import { decodeDrawingPrecompute, encodeDrawingPrecompute } from './drawingCodec'

/** Bump whenever extraction, profile tracing, annotation content or font sizing changes. */
export const DRAWING_CACHE_VERSION = 7
export interface DrawingPrecompute {
  version: number
  key: string
  segs: number[]
  fills: number[]
  texts: InkText[]
  marks: Record<string, [number, number]>
  stats: Record<string, number>
  profile: number[][]
}

interface Entry {
  layout: string
  sheet?: ComposedSheet
  profile?: number[][]
  precomputed?: boolean
}
const entries = new WeakMap<DrawingGeometry, Entry>()
let latest: { data: DrawingGeometry; layout: DrawingLayout } | undefined

/** Generator opt-out lives here so DrawingLinework needs no tooling-only branch. */
export function drawingCacheBypassed(): boolean {
  return typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('drawingCache') === 'bypass'
}

/** Tooling access to the immutable source of the last live bake or installed asset. */
export function drawingPrecomputeSource() { return latest }

function layoutKey(data: DrawingGeometry, layout: DrawingLayout): string {
  return JSON.stringify({
    version: DRAWING_CACHE_VERSION,
    bounds: data.bounds, units: data.units, features: data.features,
    width: layout.width, height: layout.height,
    primaryRotation: layout.primaryRotation.elements, primaryCenter: layout.primaryCenter,
    sectionLineY: layout.sectionLineY,
    views: layout.views.map(({ name, rect, transform, scale, section, label, scaleLabel }) =>
      ({ name, rect, transform: transform.elements, scale, section, label, scaleLabel })),
  })
}

function entryFor(data: DrawingGeometry, layout: DrawingLayout): Entry {
  const key = layoutKey(data, layout)
  let entry = entries.get(data)
  if (!entry || entry.layout !== key) {
    entry = { layout: key }
    entries.set(data, entry)
  }
  return entry
}

/** SHA-256 includes every rest-pose position and index byte, including winding/order.
 * Snapshot geometry is immutable. No model simplification, welding or rounding is done here.
 */
export async function drawingCacheKey(data: DrawingGeometry, layout: DrawingLayout): Promise<string> {
  const position = data.geometry.getAttribute('position').array
  const bytes = new Uint8Array(position.buffer, position.byteOffset, position.byteLength)
  const index = data.geometry.getIndex()?.array
  const hash = async (input: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(input))),
    (n) => n.toString(16).padStart(2, '0')).join('')
  const topology = index
    ? `${index.constructor.name}:${await hash(new Uint8Array(index.buffer, index.byteOffset, index.byteLength))}`
    : 'non-indexed'
  return `${await hash(bytes)}:${topology}:${await hash(new TextEncoder().encode(layoutKey(data, layout)))}`
}

export function cachedSheet(data: DrawingGeometry, layout: DrawingLayout): ComposedSheet | undefined {
  if (drawingCacheBypassed()) return undefined
  const entry = entryFor(data, layout)
  if (!entry.sheet) return undefined
  return { ...entry.sheet, stats: { ...entry.sheet.stats, cacheHit: 1, precomputed: entry.precomputed ? 1 : 0, totalMs: 0, edgeSetMs: 0 } }
}

export function cachedProfile(data: DrawingGeometry, layout: DrawingLayout): number[][] | undefined {
  if (drawingCacheBypassed()) return undefined
  return entryFor(data, layout).profile
}

export function rememberSheet(data: DrawingGeometry, layout: DrawingLayout, sheet: ComposedSheet): void {
  const entry = entryFor(data, layout)
  entry.sheet = sheet
  entry.precomputed = false
  latest = { data, layout }
}

export function rememberProfile(data: DrawingGeometry, layout: DrawingLayout, points: number[][]): void {
  entryFor(data, layout).profile = points
}

/** Generator entry point: export only a complete successful bake. */
export async function exportDrawingPrecompute(): Promise<DrawingPrecompute> {
  if (!latest) throw new Error('No drawing has been baked')
  const { data, layout } = latest
  const { sheet, profile, precomputed } = entryFor(data, layout)
  if (precomputed) throw new Error('Cannot export an installed precompute; generate with ?drawingCache=bypass')
  if (!sheet || !profile?.length) throw new Error('Drawing bake is incomplete')
  return {
    version: DRAWING_CACHE_VERSION, key: await drawingCacheKey(data, layout),
    segs: sheet.ink.segs, fills: sheet.ink.fills, texts: sheet.ink.texts,
    marks: sheet.marks, stats: sheet.stats, profile,
  }
}

/** Encode a live bake into the v3 binary container the site serves. */
export async function encodedDrawingPrecompute(): Promise<Uint8Array<ArrayBuffer>> {
  const asset = await exportDrawingPrecompute()
  return encodeDrawingPrecompute(asset)
}

function valid(value: unknown): value is DrawingPrecompute {
  if (!value || typeof value !== 'object') return false
  const p = value as DrawingPrecompute
  const numbers = (v: unknown, stride: number) => Array.isArray(v) && v.length % stride === 0 && v.every(Number.isFinite)
  return p.version === DRAWING_CACHE_VERSION && typeof p.key === 'string'
    && numbers(p.segs, 9) && numbers(p.fills, 15)
    && Array.isArray(p.profile) && p.profile.length > 3 && p.profile.every((point) => numbers(point, 2) && point.length === 2)
    && Array.isArray(p.texts) && p.texts.every((t) => t && typeof t.text === 'string'
      && [t.x, t.y, t.size, t.group, t.key].every(Number.isFinite) && t.size > 0)
    && !!p.marks && Object.values(p.marks).every((point) => numbers(point, 2) && point.length === 2)
    && !!p.stats && Object.values(p.stats).every(Number.isFinite)
}

export async function installDrawingPrecompute(data: DrawingGeometry, layout: DrawingLayout, value: unknown): Promise<boolean> {
  if (drawingCacheBypassed()) return false
  if (!valid(value) || value.key !== await drawingCacheKey(data, layout)) return false
  const ink = new InkBuilder()
  // Avoid spread's argument limit on the full CAD line set.
  for (const n of value.segs) ink.segs.push(n)
  for (const n of value.fills) ink.fills.push(n)
  for (const text of value.texts) ink.texts.push({ ...text })
  entries.set(data, {
    layout: layoutKey(data, layout), precomputed: true,
    sheet: { ink, marks: structuredClone(value.marks), stats: { ...value.stats } },
    profile: value.profile.map((point) => [...point]),
  })
  latest = { data, layout }
  return true
}

/** Parse a precompute payload whether or not the host already decoded it. Static servers
 * (vite/sirv, many CDNs) send `.gz` with `Content-Encoding: gzip`, so the browser hands us
 * the already-decompressed bytes; others serve the raw gzip stream. Sniff the payload magic
 * instead of trusting either host behaviour. Two payload formats exist:
 * the v3 JGD3 binary container (current, written by scripts/precompute-drawing.mjs) and the
 * legacy v2 JSON (still parseable so an old asset fails its version gate cleanly, not as
 * a decode crash).
 */
export async function decodeDrawingPayload(bytes: Uint8Array<ArrayBuffer>): Promise<unknown> {
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const body = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    bytes = new Uint8Array(await new Response(body).arrayBuffer())
  }
  if (bytes.length >= 4 && bytes[0] === 0x4a && bytes[1] === 0x47 && bytes[2] === 0x44 && bytes[3] === 0x33) {
    return decodeDrawingPrecompute(bytes)
  }
  return JSON.parse(new TextDecoder().decode(bytes))
}

/** Call before composeSheet/bakeProfile. Any missing/stale/broken asset falls back to live CAD. */
export async function prepareDrawingCache(data: DrawingGeometry, layout: DrawingLayout,
  url = '/drawing/jgun-sheet-v2.bin.gz'): Promise<boolean> {
  if (drawingCacheBypassed()) {
    entries.delete(data)
    return false
  }
  // A dead host fails fast (headers), but a responding one gets to finish the body: aborting a
  // valid asset on a busy first load only swaps a download for the heavier live bake.
  const controller = new AbortController()
  let timer = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return false
    clearTimeout(timer)
    timer = setTimeout(() => controller.abort(), 30000)
    const value = await decodeDrawingPayload(new Uint8Array(await response.arrayBuffer()))
    return await installDrawingPrecompute(data, layout, value)
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
