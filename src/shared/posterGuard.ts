// Poster-path guard: pure checks that a poster / reduced-motion / failure path mounted no canvas and
// requested no CAD asset. Plain data in, a report out, so a unit test, a Playwright script and a
// build check can all call it. Zero imports by design. It carries no scroll length.
//
// It proves nothing without evidence: a missing canvas count or a missing request list is a problem,
// never a pass.

/**
 * A URL is a CAD asset when it names a model or mesh file, or sits under a models or draco
 * directory. Rasters (`/images/*.png`, `/inspection/**.webp`) are not CAD.
 */
export const CAD_ASSET_PATTERN = /\.(?:glb|gltf|drc|ktx2)(?:$|[?#])|(?:^|\/)(?:models|draco)\//i

export function isCadUrl(url: string, pattern: RegExp = CAD_ASSET_PATTERN): boolean {
  return pattern.test(url)
}

/** Count `<canvas` elements in serialized markup. */
export function countCanvases(markup: string): number {
  return (markup.match(/<canvas\b/gi) ?? []).length
}

export interface PosterPathEvidence {
  /** Serialized page markup (`page.content()` or `renderToStaticMarkup`). */
  markup?: string
  /** `document.querySelectorAll('canvas').length`, for canvases created by script. Wins over markup. */
  canvasCount?: number
  /** Every URL the cold load requested. An empty list is evidence; an absent one is not. */
  requestedUrls?: readonly string[]
  cadPattern?: RegExp
}

export interface PosterPathReport {
  canvases: number | null
  cadRequests: string[]
  problems: string[]
  ok: boolean
}

export function checkPosterPath(evidence: PosterPathEvidence): PosterPathReport {
  const problems: string[] = []
  let canvases: number | null = null
  if (typeof evidence.canvasCount === 'number') canvases = evidence.canvasCount
  else if (typeof evidence.markup === 'string') canvases = countCanvases(evidence.markup)
  if (canvases === null) problems.push('no canvas evidence: pass markup or canvasCount')
  else if (canvases > 0) problems.push(`${canvases} canvas element(s) mounted on a poster path`)

  const cadRequests: string[] = []
  if (!evidence.requestedUrls) problems.push('no request evidence: pass requestedUrls')
  else {
    for (const url of evidence.requestedUrls) if (isCadUrl(url, evidence.cadPattern)) cadRequests.push(url)
    if (cadRequests.length > 0) problems.push(`${cadRequests.length} CAD request(s): ${cadRequests.join(', ')}`)
  }
  return { canvases, cadRequests, problems, ok: problems.length === 0 }
}
