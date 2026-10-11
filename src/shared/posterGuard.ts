// Poster-path guard: pure checks that a poster / reduced-motion / failure path mounted no canvas and
// requested no CAD asset. Plain data in, a report out, so a unit test, a Playwright script and a
// build check can all call it. Zero imports by design. It carries no scroll length.
//
// It proves nothing without evidence: a missing or invalid canvas count, or a missing request
// list, is a problem, never a pass. Contradictory evidence takes the worse reading.
//
// What it cannot see: a canvas count read after load is a snapshot, so a canvas that was mounted and
// then removed is invisible to it. For "never mounted during the cold load" pass `canvasMounts`,
// the cumulative count from CANVAS_MOUNT_OBSERVER_SOURCE installed before the page script runs.

/**
 * A URL is a CAD asset when it names a model or mesh file, or sits under a models or draco
 * directory. Rasters (`/images/*.png`, `/inspection/**.webp`) are not CAD. This detector always
 * applies; a caller can add patterns but never replace it.
 */
export const CAD_ASSET_PATTERN = /\.(?:glb|gltf|drc|ktx2)(?:$|[?#])|(?:^|\/)(?:models|draco)\//i

/** A stateless copy: a caller's `g` or `y` flag must not make `.test()` remember `lastIndex`. */
function stateless(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''))
}

/** True when the default detector, or any extra pattern, matches. */
export function isCadUrl(url: string, extraPatterns: readonly RegExp[] = []): boolean {
  return [CAD_ASSET_PATTERN, ...extraPatterns].some((pattern) => stateless(pattern).test(url))
}

/** Count `<canvas` elements in serialized markup. */
export function countCanvases(markup: string): number {
  return (markup.match(/<canvas\b/gi) ?? []).length
}

/**
 * Source for a page init script (Playwright `addInitScript`). It counts every canvas the page
 * creates, inserts or removes, cumulatively, into `window.__posterCanvasMounts`, one count per
 * canvas identity. Removed subtrees are inspected too, so a canvas that is parser-created inside an
 * inserted wrapper and removed before the observer callback runs is still counted. Read it with
 * `page.evaluate(() => window.__posterCanvasMounts)` and pass it as `canvasMounts`.
 * Not covered: OffscreenCanvas, a canvas created in a worker, and a canvas that never enters the
 * document.
 */
export const CANVAS_MOUNT_OBSERVER_SOURCE = `(() => {
  let n = 0
  const seen = new WeakSet()
  const note = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return
    if (node.nodeName === 'CANVAS') { seen.add(node); n += 1; return }
    if (node.querySelectorAll) for (const canvas of node.querySelectorAll('canvas')) note(canvas)
  }
  Object.defineProperty(window, '__posterCanvasMounts', { get: () => n })
  const create = document.createElement.bind(document)
  document.createElement = (tag, options) => {
    const element = create(tag, options)
    if (String(tag).toLowerCase() === 'canvas') note(element)
    return element
  }
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) note(node)
      for (const node of record.removedNodes) note(node)
    }
  }).observe(document, { childList: true, subtree: true })
})()`

export interface PosterPathEvidence {
  /** Serialized page markup (`page.content()` or `renderToStaticMarkup`). */
  markup?: string
  /** `document.querySelectorAll('canvas').length` after load: a snapshot. */
  canvasCount?: number
  /** Cumulative canvases created or inserted during the load (CANVAS_MOUNT_OBSERVER_SOURCE). */
  canvasMounts?: number
  /** Require `canvasMounts`: set for lifecycle acceptance, where a snapshot is not enough. */
  requireMountObservation?: boolean
  /** Every URL the cold load requested. An empty list is evidence; an absent one is not. */
  requestedUrls?: readonly string[]
  /** Added to the default CAD detector. Cannot replace it. */
  extraCadPatterns?: readonly RegExp[]
}

export interface PosterPathReport {
  /** The highest canvas count any supplied evidence shows, or null with no evidence. */
  canvases: number | null
  cadRequests: string[]
  problems: string[]
  ok: boolean
}

const validCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0

export function checkPosterPath(evidence: PosterPathEvidence): PosterPathReport {
  const problems: string[] = []
  const seen: number[] = []
  for (const [name, value] of [['canvasCount', evidence.canvasCount], ['canvasMounts', evidence.canvasMounts]] as const) {
    if (value === undefined) continue
    if (validCount(value)) seen.push(value)
    else problems.push(`${name} is not a non-negative integer`)
  }
  if (typeof evidence.markup === 'string') seen.push(countCanvases(evidence.markup))
  if (evidence.requireMountObservation && evidence.canvasMounts === undefined) {
    problems.push('no mount observation: pass canvasMounts from CANVAS_MOUNT_OBSERVER_SOURCE')
  }
  const canvases = seen.length > 0 ? Math.max(...seen) : null
  if (canvases === null) {
    if (problems.length === 0) problems.push('no canvas evidence: pass markup, canvasCount or canvasMounts')
  } else if (canvases > 0) problems.push(`${canvases} canvas element(s) mounted on a poster path`)

  const cadRequests: string[] = []
  if (!evidence.requestedUrls) problems.push('no request evidence: pass requestedUrls')
  else {
    for (const url of evidence.requestedUrls) if (isCadUrl(url, evidence.extraCadPatterns)) cadRequests.push(url)
    if (cadRequests.length > 0) problems.push(`${cadRequests.length} CAD request(s): ${cadRequests.join(', ')}`)
  }
  return { canvases, cadRequests, problems, ok: problems.length === 0 }
}
