export type RenderBudgetTier = 'full' | 'lite'

export interface RenderBudget {
  dpr: number
  widthPx: number
  heightPx: number
  pixels: number
  pixelLimit: number
  deviceDpr: number
  tier: RenderBudgetTier
}

export const FULL_DPR_CAP = 1.5
export const LITE_DPR_CAP = 1
export const FULL_PIXEL_LIMIT = 2560 * 1440
export const LITE_PIXEL_LIMIT = FULL_PIXEL_LIMIT

function floorAtLeastOne(value: number): number {
  return Math.max(1, Math.floor(value))
}

function fitToPixelLimit(
  width: number,
  height: number,
  limit: number,
): { widthPx: number; heightPx: number } {
  let widthPx = floorAtLeastOne(width)
  let heightPx = floorAtLeastOne(height)
  let pixels = widthPx * heightPx

  if (pixels > limit) {
    const scale = Math.sqrt(limit / pixels)
    widthPx = floorAtLeastOne(widthPx * scale)
    heightPx = floorAtLeastOne(heightPx * scale)
    pixels = widthPx * heightPx

    if (pixels > limit) {
      const wider = widthPx >= heightPx
      const shorter = wider ? heightPx : widthPx
      const excess = pixels - limit
      const reduction = Math.ceil(excess / shorter)
      if (wider) widthPx = Math.max(1, widthPx - reduction)
      else heightPx = Math.max(1, heightPx - reduction)
      pixels = widthPx * heightPx
    }
  }

  if (pixels > limit) throw new Error('Unable to fit render budget within pixel limit')
  return { widthPx, heightPx }
}

export function computeRenderBudget(
  width: number,
  height: number,
  deviceDpr: number,
  tier: RenderBudgetTier,
): RenderBudget {
  for (const [value, field] of [[width, 'CSS width'], [height, 'CSS height'], [deviceDpr, 'Device DPR']] as const) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${field} must be finite and positive`)
  }
  if (tier !== 'full' && tier !== 'lite') throw new TypeError('Render budget tier must be full or lite')

  const tierDprCap = tier === 'full' ? FULL_DPR_CAP : LITE_DPR_CAP
  const pixelLimit = tier === 'full' ? FULL_PIXEL_LIMIT : LITE_PIXEL_LIMIT
  const areaDprCap = Math.sqrt(pixelLimit / (width * height))
  const requestedDpr = Math.min(deviceDpr, tierDprCap, areaDprCap)

  const rawWidth = floorAtLeastOne(width * requestedDpr)
  const rawHeight = floorAtLeastOne(height * requestedDpr)
  const fitted = fitToPixelLimit(rawWidth, rawHeight, pixelLimit)

  // Choose a representable ratio strictly inside the interval that floors to the fitted
  // dimensions, then make those recomputed floors authoritative.
  const lowerDpr = Math.max(fitted.widthPx / width, fitted.heightPx / height)
  const upperDpr = Math.min((fitted.widthPx + 1) / width, (fitted.heightPx + 1) / height)
  const dpr = Math.min(requestedDpr, (lowerDpr + upperDpr) / 2)
  const widthPx = Math.floor(width * dpr)
  const heightPx = Math.floor(height * dpr)
  if (widthPx !== fitted.widthPx || heightPx !== fitted.heightPx) {
    throw new Error('Render-budget DPR does not reproduce its integer drawing buffer')
  }

  return {
    dpr,
    widthPx,
    heightPx,
    pixels: widthPx * heightPx,
    pixelLimit,
    deviceDpr,
    tier,
  }
}
