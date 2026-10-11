import { describe, expect, it } from 'vitest'
import { CANVAS_MOUNT_OBSERVER_SOURCE, checkPosterPath, countCanvases, isCadUrl } from './posterGuard'

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

  it('adds a caller pattern without replacing the default detector', () => {
    const report = checkPosterPath({
      markup: '',
      requestedUrls: ['/a/b.mesh', '/models/Default.glb', '/models/role-map.json', '/draco/draco_decoder.wasm'],
      extraCadPatterns: [/\.mesh$/],
    })
    expect(report.cadRequests).toEqual(['/a/b.mesh', '/models/Default.glb', '/models/role-map.json', '/draco/draco_decoder.wasm'])
  })

  it('a caller pattern with the g flag does not change the verdict on a repeated URL', () => {
    const extra = [/\.mesh$/g]
    const first = checkPosterPath({ markup: '', requestedUrls: ['/a.mesh'], extraCadPatterns: extra })
    const second = checkPosterPath({ markup: '', requestedUrls: ['/a.mesh'], extraCadPatterns: extra })
    expect(first.ok).toBe(false)
    expect(second.ok).toBe(false)
  })

  it('contradictory evidence takes the worse reading: markup shows a canvas, the count says zero', () => {
    const report = checkPosterPath({ markup: '<canvas></canvas>', canvasCount: 0, requestedUrls: [] })
    expect(report.ok).toBe(false)
    expect(report.canvases).toBe(1)
  })

  it.each([Number.NaN, -1, 1.5, Number.POSITIVE_INFINITY])('rejects canvasCount %s', (value) => {
    const report = checkPosterPath({ canvasCount: value, requestedUrls: [] })
    expect(report.ok).toBe(false)
    expect(report.problems.join(' ')).toMatch(/canvasCount is not a non-negative integer/)
  })

  it('a canvas mounted and then removed is caught by canvasMounts, not by the snapshot', () => {
    const report = checkPosterPath({ markup: '<div></div>', canvasCount: 0, canvasMounts: 1, requestedUrls: [] })
    expect(report.ok).toBe(false)
    expect(report.canvases).toBe(1)
  })

  it('lifecycle acceptance requires a mount observation', () => {
    const without = checkPosterPath({ canvasCount: 0, requestedUrls: [], requireMountObservation: true })
    expect(without.ok).toBe(false)
    expect(without.problems.join(' ')).toMatch(/no mount observation/)
    const withIt = checkPosterPath({ canvasCount: 0, canvasMounts: 0, requestedUrls: [], requireMountObservation: true })
    expect(withIt.ok).toBe(true)
  })

  it('the mount observer source is a well-formed function expression', () => {
    expect(() => new Function(CANVAS_MOUNT_OBSERVER_SOURCE)).not.toThrow()
    expect(CANVAS_MOUNT_OBSERVER_SOURCE).toContain('__posterCanvasMounts')
  })
})

type Node = { nodeName: string; querySelectorAll?: () => Node[] }
type Records = { addedNodes: Node[]; removedNodes: Node[] }[]

/** Execute the observer source against a stub document; `deliver` runs the observer callback. */
function runObserver() {
  let callback: (records: Records) => void = () => {}
  const document = {
    createElement: (tag: string): Node => ({ nodeName: tag.toUpperCase() }),
  }
  class MutationObserver {
    constructor(cb: (records: Records) => void) { callback = cb }
    observe() {}
  }
  const window: { __posterCanvasMounts?: number } = {}
  new Function('window', 'document', 'MutationObserver', CANVAS_MOUNT_OBSERVER_SOURCE)(window, document, MutationObserver)
  return {
    document,
    deliver: (records: Records) => callback(records),
    mounts: () => window.__posterCanvasMounts as number,
  }
}

describe('CANVAS_MOUNT_OBSERVER_SOURCE, executed', () => {
  it('counts a canvas created through createElement, once, even when it is later inserted', () => {
    const page = runObserver()
    const canvas = page.document.createElement('canvas')
    expect(page.mounts()).toBe(1)
    page.deliver([{ addedNodes: [canvas], removedNodes: [] }])
    expect(page.mounts()).toBe(1)
    page.document.createElement('div')
    expect(page.mounts()).toBe(1)
  })

  it('counts a canvas inside an inserted subtree', () => {
    const page = runObserver()
    const wrapper: Node = { nodeName: 'DIV', querySelectorAll: () => [{ nodeName: 'CANVAS' }, { nodeName: 'CANVAS' }] }
    page.deliver([{ addedNodes: [wrapper], removedNodes: [] }])
    expect(page.mounts()).toBe(2)
  })

  it('counts a parser-created canvas that was removed again before the callback ran', () => {
    // wrapper.innerHTML = '<canvas>' ; append(wrapper) ; canvas.remove(): by delivery time the added
    // wrapper is empty and only the removal record still names the canvas.
    const page = runObserver()
    const emptyWrapper: Node = { nodeName: 'DIV', querySelectorAll: () => [] }
    page.deliver([
      { addedNodes: [emptyWrapper], removedNodes: [] },
      { addedNodes: [], removedNodes: [{ nodeName: 'CANVAS' }] },
    ])
    expect(page.mounts()).toBe(1)
  })

  it('counts nothing for a page with no canvas', () => {
    const page = runObserver()
    page.deliver([{ addedNodes: [{ nodeName: 'DIV', querySelectorAll: () => [] }], removedNodes: [{ nodeName: 'P' }] }])
    expect(page.mounts()).toBe(0)
  })
})
