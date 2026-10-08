import { afterEach, describe, expect, it, vi } from 'vitest'
import { Box3, BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from 'three'
import { gzipSync } from 'node:zlib'
import type { DrawingGeometry, DrawingLayout } from '../drawingGeometry'
import { InkBuilder, PEN_COLOR, penColorOf, withPenColor } from './ink'
import {
  DRAWING_CACHE_VERSION, cachedProfile, cachedSheet, drawingCacheKey,
  drawingPrecomputeSource, exportDrawingPrecompute, installDrawingPrecompute,
  prepareDrawingCache, rememberProfile, rememberSheet,
} from './drawingCache'
import {
  decodeDrawingPrecompute, encodeDrawingPrecompute,
} from './drawingCodec'

function fixture() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
  geometry.setIndex([0, 1, 2])
  const data: DrawingGeometry = {
    geometry, bounds: new Box3(new Vector3(), new Vector3(1, 1, 0)),
    features: {}, units: {}, rigCenter: new Vector3(), sourceTriangles: 1,
  }
  const layout: DrawingLayout = {
    width: 1, height: 1, primaryRotation: new Matrix4(), primaryCenter: new Vector3(),
    views: [], fitDistance: 1, narrow: false, sectionLineY: 0,
  }
  return { data, layout }
}
async function liveBake(data: DrawingGeometry, layout: DrawingLayout) {
  const ink = new InkBuilder()
  ink.segs.push(0, 0, 1, 1, 0.001, 0, 0, 1, 0)
  ink.text({ text: 'R', x: 0.12, y: 0.05, size: 0.0038, group: 16, key: 0.2, dur: 0.015,
    weight: 'handwriting', color: 'graphite', scaleX: 0.97, rotation: -0.025,
    anchorX: 'left', anchorY: 'baseline', letterSpacing: 0 })
  rememberSheet(data, layout, { ink, marks: { origin: [0, 0] }, stats: { segments: 1, totalMs: 10 } })
  rememberProfile(data, layout, [[0, 0], [1, 0], [1, 1], [0, 1]])
  return exportDrawingPrecompute()
}
afterEach(() => vi.unstubAllGlobals())

describe('drawing precompute integrity', () => {
  it('keys all position bytes, index topology and the indexed/non-indexed distinction', async () => {
    const { data, layout } = fixture()
    const original = await drawingCacheKey(data, layout)
    data.geometry.setIndex([0, 2, 1])
    expect(await drawingCacheKey(data, layout)).not.toBe(original)
    data.geometry.setIndex(null)
    expect(await drawingCacheKey(data, layout)).not.toBe(original)
    data.geometry.setIndex([0, 1, 2])
    expect(await drawingCacheKey(data, layout)).toBe(original)
    data.geometry.getAttribute('position').setX(2, 0.01)
    expect(await drawingCacheKey(data, layout)).not.toBe(original)
  })

  it('keys source content independently of geometry identity, and includes layout', async () => {
    const a = fixture(), b = fixture()
    expect(await drawingCacheKey(a.data, a.layout)).toBe(await drawingCacheKey(b.data, b.layout))
    b.layout.primaryCenter.x = 0.1
    expect(await drawingCacheKey(a.data, a.layout)).not.toBe(await drawingCacheKey(b.data, b.layout))
  })

  it('installs a complete live bake exactly and refuses to re-export the installed asset', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    expect(await installDrawingPrecompute(data, layout, asset)).toBe(true)
    expect(cachedSheet(data, layout)?.ink.segs).toEqual(asset.segs)
    expect(cachedSheet(data, layout)?.ink.texts).toEqual(asset.texts)
    expect(cachedProfile(data, layout)).toEqual(asset.profile)
    expect(cachedSheet(data, layout)?.stats.precomputed).toBe(1)
    expect(drawingPrecomputeSource()).toEqual({ data, layout })
    await expect(exportDrawingPrecompute()).rejects.toThrow('Cannot export an installed precompute')
  })

  it('is on cache version 8 (reference font lettering) so a version-7 asset falls back to the live bake', async () => {
    expect(DRAWING_CACHE_VERSION).toBe(8)
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    expect(await installDrawingPrecompute(data, layout, { ...asset, version: 7 })).toBe(false)
  })

  it('keeps the per-stroke pen colour (dash + 10 * colour, incl. graphite = 2) through install and the binary codec', async () => {
    const { data, layout } = fixture()
    const ink = new InkBuilder()
    ink.line(0, 0, 1, 0, 0.001, 0, 0, 0.1, withPenColor(0, PEN_COLOR.ink))
    ink.line(0, 1, 1, 1, 0.001, 0, 0.1, 0.1, withPenColor(0, PEN_COLOR.red))
    ink.line(0, 2, 1, 2, 0.001, 0, 0.2, 0.1, withPenColor(0, PEN_COLOR.graphite))
    ink.line(0, 3, 1, 3, 0.001, 0, 0.3, 0.1, withPenColor(1, PEN_COLOR.graphite)) // dashed graphite
    rememberSheet(data, layout, { ink, marks: { origin: [0, 0] }, stats: { segments: 4, totalMs: 1 } })
    rememberProfile(data, layout, [[0, 0], [1, 0], [1, 1], [0, 1]])
    const asset = await exportDrawingPrecompute()
    const colours = (segs: number[]) => Array.from({ length: segs.length / 9 }, (_, i) => penColorOf(segs[i * 9 + 8]))
    expect(colours(asset.segs)).toEqual([0, 1, 2, 2])
    const decoded = decodeDrawingPrecompute(encodeDrawingPrecompute(asset))!
    expect(colours(decoded.segs)).toEqual([0, 1, 2, 2])
    expect(decoded.segs[3 * 9 + 8] - 10 * penColorOf(decoded.segs[3 * 9 + 8])).toBe(1)
    expect(await installDrawingPrecompute(data, layout, decoded)).toBe(true)
    expect(colours(cachedSheet(data, layout)!.ink.segs)).toEqual([0, 1, 2, 2])
  })

  it('rejects old versions, changed topology, and malformed payloads', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    expect(await installDrawingPrecompute(data, layout, { ...asset, version: DRAWING_CACHE_VERSION - 1 })).toBe(false)
    expect(await installDrawingPrecompute(data, layout, { ...asset, segs: [NaN] })).toBe(false)
    for (const fields of [{ scaleX: 0 }, { scaleX: -1 }, { scaleX: Infinity }, { rotation: NaN },
      { color: 'blue' }, { weight: 'synthetic' }]) {
      expect(await installDrawingPrecompute(data, layout, { ...asset, texts: [{ ...asset.texts[0], ...fields }] })).toBe(false)
    }
    data.geometry.setIndex([0, 2, 1])
    expect(await installDrawingPrecompute(data, layout, asset)).toBe(false)
  })

  it('bypasses HTTP, in-memory reads and installation, but still exports a new live bake', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    await installDrawingPrecompute(data, layout, asset)
    vi.stubGlobal('window', { location: { search: '?drawingCache=bypass' } })
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    expect(cachedSheet(data, layout)).toBeUndefined()
    expect(cachedProfile(data, layout)).toBeUndefined()
    expect(await prepareDrawingCache(data, layout)).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
    expect(await installDrawingPrecompute(data, layout, asset)).toBe(false)
    await expect(exportDrawingPrecompute()).rejects.toThrow('incomplete')
    expect(await liveBake(data, layout)).toEqual(asset)
  })

  it('loads raw gzip or host-decoded JSON and falls back on failed or corrupt responses', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(gzipSync(JSON.stringify(asset))))))
    expect(await prepareDrawingCache(data, layout)).toBe(true)
    // vite/sirv and CDNs send .gz with Content-Encoding: gzip, so fetch yields plain JSON.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(asset))))
    expect(await prepareDrawingCache(data, layout)).toBe(true)
    expect(cachedSheet(data, layout)?.stats.precomputed).toBe(1)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('missing', { status: 404 })))
    expect(await prepareDrawingCache(data, layout)).toBe(false)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not gzip')))
    expect(await prepareDrawingCache(data, layout)).toBe(false)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await prepareDrawingCache(data, layout)).toBe(false)
  })

  it('round-trips a bake through the v3 binary container value-exactly', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    const container = encodeDrawingPrecompute(asset)
    const decoded = decodeDrawingPrecompute(container)
    expect(decoded).not.toBeNull()
    expect(decoded).toEqual(asset)
  })

  it('installs a v3 container payload served as gzip or plain bytes', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    const container = encodeDrawingPrecompute(asset)
    // Raw gzip wire form (host without transparent decompression).
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(gzipSync(container)))))
    expect(await prepareDrawingCache(data, layout)).toBe(true)
    expect(cachedSheet(data, layout)?.ink.segs).toEqual(asset.segs)
    expect(cachedSheet(data, layout)?.ink.texts).toEqual(asset.texts)
    expect(cachedSheet(data, layout)?.stats.precomputed).toBe(1)
    // Host-decoded form (vite/sirv/CDN applied Content-Encoding: gzip for us).
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(container))))
    expect(await prepareDrawingCache(data, layout)).toBe(true)
    expect(cachedSheet(data, layout)?.ink.segs).toEqual(asset.segs)
    expect(cachedSheet(data, layout)?.ink.texts).toEqual(asset.texts)
    expect(JSON.stringify(cachedProfile(data, layout))).toBe(JSON.stringify(asset.profile))
  })

  it('rejects truncated, corrupt-metadata and non-finite v3 containers, and unsupported versions', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    const container = encodeDrawingPrecompute(asset)
    // Truncations: header, mid-sidecar, mid-number-blob.
    for (const cut of [10, 40, container.length - 8]) {
      expect(decodeDrawingPrecompute(container.subarray(0, cut))).toBeNull()
    }
    // Corrupt metadata: length/counts that do not add up to the real byteLength.
    for (const [offset, value] of [[4, 0], [4, 99], [12, 3], [20, 3], [24, 0xffff_ffff]]) {
      const corrupt = new Uint8Array(container)
      new DataView(corrupt.buffer).setUint32(offset, value, true)
      expect(decodeDrawingPrecompute(corrupt)).toBeNull()
    }
    // A wrong cacheVersion is structurally valid (decodes) but must fail the install gate.
    {
      const wrongCache = new Uint8Array(container)
      new DataView(wrongCache.buffer).setUint32(8, 99, true)
      const decoded = decodeDrawingPrecompute(wrongCache)
      expect(decoded?.version).toBe(99)
      expect(await installDrawingPrecompute(data, layout, decoded)).toBe(false)
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array(wrongCache))))
      expect(await prepareDrawingCache(data, layout)).toBe(false)
      vi.unstubAllGlobals()
    }
    // NaN injected into the number blob.
    const withNaN = new Uint8Array(container)
    const view = new DataView(withNaN.buffer)
    const dataStart = container.length - (asset.segs.length + asset.fills.length + asset.profile.length * 2) * 8
    view.setFloat64(dataStart, NaN, true)
    expect(decodeDrawingPrecompute(withNaN)).toBeNull()
    // A legacy v2 JSON payload reaching the v3 loader fails the version gate, not the parser.
    expect(await installDrawingPrecompute(data, layout, { ...asset, version: DRAWING_CACHE_VERSION - 1 })).toBe(false)
    expect(decodeDrawingPrecompute(new TextEncoder().encode(JSON.stringify(asset)))).toBeNull()
  })
})
