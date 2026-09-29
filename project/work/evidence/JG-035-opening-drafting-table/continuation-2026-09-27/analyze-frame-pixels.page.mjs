export default async function analyze(src) {
  const img = new Image()
  img.src = src
  await img.decode()
  const W = img.naturalWidth, H = img.naturalHeight
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, W, H).data

  const px = (x, y) => {
    const i = (y * W + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }
  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

  // Region samplers: model band = central 50% x middle 40%; sheet = full frame;
  // title block = bottom-right quadrant where the engineering title block sits.
  const regions = {
    full: { x0: 0, y0: 0, x1: W, y1: H },
    modelBand: { x0: Math.round(W * 0.25), y0: Math.round(H * 0.3), x1: Math.round(W * 0.75), y1: Math.round(H * 0.7) },
    titleBlockArea: { x0: Math.round(W * 0.72), y0: Math.round(H * 0.62), x1: W, y1: H },
    leftMargin: { x0: 0, y0: Math.round(H * 0.2), x1: Math.round(W * 0.18), y1: Math.round(H * 0.8) },
  }

  const out = { width: W, height: H, regions: {} }
  for (const [name, r] of Object.entries(regions)) {
    let n = 0, sumL = 0, sumR = 0, sumG = 0, sumB = 0, minL = 1e9, maxL = -1e9
    let bright = 0, cyanLeaning = 0, warmLeaning = 0
    for (let y = r.y0; y < r.y1; y += 2) {
      for (let x = r.x0; x < r.x1; x += 2) {
        const [pr, pg, pb] = px(x, y)
        const L = lum([pr, pg, pb])
        n++; sumL += L; sumR += pr; sumG += pg; sumB += pb
        if (L < minL) minL = L
        if (L > maxL) maxL = L
        if (L > 90) bright++
        // Cool/hologram lean: blue+green clearly above red.
        if (pb + pg - 2 * pr > 40) cyanLeaning++
        // Warm lean: red clearly above blue.
        if (pr - pb > 40) warmLeaning++
      }
    }
    out.regions[name] = {
      meanLum: +(sumL / n).toFixed(1),
      meanR: +(sumR / n).toFixed(1), meanG: +(sumG / n).toFixed(1), meanB: +(sumB / n).toFixed(1),
      minLum: +minL.toFixed(1), maxLum: +maxL.toFixed(1),
      brightFrac: +(bright / n).toFixed(4),
      cyanLeanFrac: +(cyanLeaning / n).toFixed(4),
      warmLeanFrac: +(warmLeaning / n).toFixed(4),
    }
  }

  // Local contrast (RMS of horizontal luminance gradient) in the title-block area —
  // a proxy for text legibility: faint furniture yields low gradient energy.
  const tc = regions.titleBlockArea
  let gradN = 0, gradSumSq = 0
  for (let y = tc.y0; y < tc.y1; y += 2) {
    for (let x = tc.x0 + 1; x < tc.x1; x += 2) {
      const d = lum(px(x, y)) - lum(px(x - 1, y))
      gradSumSq += d * d; gradN++
    }
  }
  out.titleBlockGradientRMS = +Math.sqrt(gradSumSq / gradN).toFixed(2)

  // Foreground ink coverage: fraction of pixels meaningfully brighter than the
  // 10th-percentile background (drawing strokes on dark vellum).
  const lums = []
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) lums.push(lum(px(x, y)))
  lums.sort((a, b) => a - b)
  const p10 = lums[Math.floor(lums.length * 0.10)]
  const p90 = lums[Math.floor(lums.length * 0.90)]
  out.inkCoverage = +(lums.filter(L => L > p10 + 24).length / lums.length).toFixed(4)
  out.dynamicRange = +(p90 - p10).toFixed(1)
  return out
}
