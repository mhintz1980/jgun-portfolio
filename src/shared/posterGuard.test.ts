import { describe, expect, it } from 'vitest'
import { checkPosterPath, countCanvases, isCadUrl } from './posterGuard'

// URLs this repo's scenes really request (src/scene/inspection/story.ts, ringRuntime.ts,
// Hotspots.tsx, BootSequence.tsx) and the rasters its static paths really use.
const CAD_URLS = [
  '/models/Default.glb',
  '/models/knurling-tool.glb?v=1',
  'http://localhost:4173/models/role-map.json',
  '/draco/draco_decoder.wasm',
  '/models/rl300-extra-parts.glb#x',
]
const RASTER_URLS = [
  '/images/rl300-exterior-preview.png',
  '/inspection/shaft/cutter-exit-desktop.webp',
  '/inspection/shaft/cutter-exit-narrow.webp',
  '/torque-wrench/posters/opening-desktop.webp',
]

describe('isCadUrl', () => {
  it.each(CAD_URLS)('flags %s', (url) => expect(isCadUrl(url)).toBe(true))
  it.each(RASTER_URLS)('passes %s', (url) => expect(isCadUrl(url)).toBe(false))
})

describe('countCanvases', () => {
  it('counts canvas elements and nothing else', () => {
    expect(countCanvases('<main><canvas></canvas><canvas width="1"></canvas></main>')).toBe(2)
    expect(countCanvases('<p>canvases</p><img alt="canvas">')).toBe(0)
  })
})

describe('checkPosterPath', () => {
  it('passes a poster path: no canvas, only raster requests', () => {
    const report = checkPosterPath({ markup: '<main><figure><img src="/x.png"></figure></main>', requestedUrls: RASTER_URLS })
    expect(report).toMatchObject({ ok: true, canvases: 0, cadRequests: [], problems: [] })
  })

  it('red: a canvas in the markup fails', () => {
    const report = checkPosterPath({ markup: '<div><canvas></canvas></div>', requestedUrls: [] })
    expect(report.ok).toBe(false)
    expect(report.canvases).toBe(1)
  })

  it('red: a real model request fails and is named', () => {
    const report = checkPosterPath({ markup: '<div></div>', requestedUrls: [...RASTER_URLS, '/models/Default.glb'] })
    expect(report.ok).toBe(false)
    expect(report.cadRequests).toEqual(['/models/Default.glb'])
  })

  it('a script-created canvas is caught through canvasCount, which wins over markup', () => {
    const report = checkPosterPath({ markup: '<div></div>', canvasCount: 1, requestedUrls: [] })
    expect(report.ok).toBe(false)
  })

  it('missing evidence is a problem, never a pass', () => {
    expect(checkPosterPath({ requestedUrls: [] }).ok).toBe(false)
    expect(checkPosterPath({ markup: '' }).ok).toBe(false)
    expect(checkPosterPath({}).problems).toHaveLength(2)
  })

  it('an empty request list is evidence', () => {
    expect(checkPosterPath({ markup: '', requestedUrls: [] }).ok).toBe(true)
  })

  it('honours a caller pattern', () => {
    const report = checkPosterPath({ markup: '', requestedUrls: ['/a/b.mesh'], cadPattern: /\.mesh$/ })
    expect(report.cadRequests).toEqual(['/a/b.mesh'])
  })
})
