// Image-ROI helper for the ring verifier's knurl-strip / CAD UV-seam check (JG-035 R2).
//
// The CAD cylinder UV branch cut (atan2 = +-pi, the -X half-plane in ring-local coordinates) used to leave one
// un-knurled band: triangles straddling the cut interpolated u across [0, 1], so the x96 repeating knurl normal map
// was minified to its mip average. That defect is a property of the NORMAL render (not of the diagnostic mask, which
// depends on position only), so it can only be seen in pixels. This helper compares texture energy (mean luminance
// gradient magnitude) in a thin band centred on the projected seam line against bands offset on both sides of it.
//
//   ratio = energy(seam band) / mean(energy(left band), energy(right band))
//
// A healthy knurl is statistically self-similar, so ratio is ~1; a flat un-knurled band drives it toward 0.
// Provenance: this is an IMAGE-ROI measurement (screenshot pixels), not runtime telemetry. The default gross-defect
// threshold the caller applies is UNCALIBRATED against a known-bad render; the ratio is always recorded so it can be
// calibrated from evidence.
import { pixels } from './preview-pixels.mjs'

export function seamBandProfile(png, points, exclusions = [], { halfWidth = 4, refInner = 12, refOuter = 36, margin = 6 } = {}) {
  const image = pixels(png), { width, height, channels, data } = image
  const lum = (x, y) => {
    const xi = Math.round(x), yi = Math.round(y)
    if (xi < 1 || yi < 1 || xi >= width - 1 || yi >= height - 1) return NaN
    const i = (yi * width + xi) * channels
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  }
  const gradient = (x, y) => Math.hypot(lum(x + 1, y) - lum(x - 1, y), lum(x, y + 1) - lum(x, y - 1)) / 2
  const excluded = (x, y) => exclusions.some(r => x >= r.x0 - margin && x <= r.x1 + margin && y >= r.y0 - margin && y <= r.y1 + margin)
  const sums = { seam: 0, left: 0, right: 0 }, counts = { seam: 0, left: 0, right: 0 }
  for (let i = 0; i + 1 < points.length; i++) {
    const p = points[i], q = points[i + 1]
    const tx = q.x - p.x, ty = q.y - p.y, length = Math.hypot(tx, ty)
    if (!(length > 0) || excluded(p.x, p.y)) continue
    const nx = -ty / length, ny = tx / length
    for (let d = -refOuter; d <= refOuter; d++) {
      const abs = Math.abs(d)
      const band = abs <= halfWidth ? 'seam' : abs >= refInner ? (d < 0 ? 'left' : 'right') : null
      if (!band) continue
      const x = p.x + nx * d, y = p.y + ny * d
      if (excluded(x, y)) continue
      const g = gradient(x, y)
      if (!Number.isFinite(g)) continue
      sums[band] += g; counts[band]++
    }
  }
  const energy = Object.fromEntries(Object.keys(sums).map(k => [k, counts[k] ? sums[k] / counts[k] : NaN]))
  const reference = (energy.left + energy.right) / 2
  return {
    kind: 'image-ROI',
    energy, counts, reference,
    ratio: energy.seam / reference,
    // Preconditions: enough unexcluded samples in every band, and a reference band that actually carries texture.
    valid: counts.seam >= 60 && counts.left >= 60 && counts.right >= 60 && reference >= 0.5,
    params: { halfWidth, refInner, refOuter, margin },
  }
}
