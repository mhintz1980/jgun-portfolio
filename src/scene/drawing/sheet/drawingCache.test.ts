import { afterEach, describe, expect, it, vi } from 'vitest'
import { Box3, BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from 'three'
import { gzipSync } from 'node:zlib'
import type { DrawingGeometry, DrawingLayout } from '../drawingGeometry'
import { InkBuilder } from './ink'
import {
  DRAWING_CACHE_VERSION, cachedProfile, cachedSheet, drawingCacheKey,
  drawingPrecomputeSource, exportDrawingPrecompute, installDrawingPrecompute,
  prepareDrawingCache, rememberProfile, rememberSheet,
} from './drawingCache'

function fixture() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
  geometry.setIndex([0, 1, 2])
  const data: DrawingGeometry = {
    geometry, bounds: new Box3(new Vector3(), new Vector3(1, 1, 0)),
    features: {}, units: {}, sourceTriangles: 1,
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
    expect(cachedProfile(data, layout)).toEqual(asset.profile)
    expect(cachedSheet(data, layout)?.stats.precomputed).toBe(1)
    expect(drawingPrecomputeSource()).toEqual({ data, layout })
    await expect(exportDrawingPrecompute()).rejects.toThrow('Cannot export an installed precompute')
  })

  it('rejects old versions, changed topology, and malformed payloads', async () => {
    const { data, layout } = fixture()
    const asset = await liveBake(data, layout)
    expect(await installDrawingPrecompute(data, layout, { ...asset, version: DRAWING_CACHE_VERSION - 1 })).toBe(false)
    expect(await installDrawingPrecompute(data, layout, { ...asset, segs: [NaN] })).toBe(false)
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
})
