import { DataTexture, LinearFilter, RGBAFormat, UnsignedByteType, Vector4 } from 'three'
import { INTRO_PHASES, smooth01 } from '../introTimeline'

/** Metres along sheet-local +Z (the extraction normal). No time integration or overshoot. */
export const PAPER_FLEX_MAX = 0.003
export const PAPER_FLEX_STEP = 0.004

export function paperFlexAmplitude(t: number, poseT: number, crossing: number, tier: string, flat = false): number {
  if (flat || tier === 'poster' || !Number.isFinite(t + poseT + crossing)) return 0
  const pressureStart = INTRO_PHASES.pulseStart + (INTRO_PHASES.riseStart - INTRO_PHASES.pulseStart) * 0.55
  const pressure = smooth01((t - pressureStart) / Math.max(0.001, INTRO_PHASES.riseStart - pressureStart))
  // Release progressively with the actual extraction pose, reaching flat at solved separation.
  const release = smooth01((poseT - 0.4) / Math.max(0.001, crossing - 0.4))
  return PAPER_FLEX_MAX * pressure * (1 - release) * (tier === 'full' ? 1 : 0.45)
}

/** The translucent impression closes with the paper; a lifted tool must not leave a hole. */
export function paperVellum(poseT: number, crossing: number, pbr: number, tier: string, flat = false): number {
  if (flat || tier === 'poster' || !Number.isFinite(poseT + crossing + pbr)) return 0
  const release = smooth01((poseT - 0.4) / Math.max(0.001, crossing - 0.4))
  return Math.max(0, Math.min(1, pbr)) * (1 - release)
}

/** Peak paper darkening under the tool while it is still in contact with the sheet. */
export const CONTACT_SHADOW_MAX = 0.34

/**
 * Contact-shadow separation: a tight shadow once the metal is present, which widens and
 * fades as the tool lifts past the solved separation. Returns [strength, radius (m)].
 */
export function paperContactShadow(poseT: number, crossing: number, pbr: number, tier: string, flat = false): [number, number] {
  if (flat || tier === 'poster' || !Number.isFinite(poseT + crossing + pbr)) return [0, 0]
  const separation = smooth01((poseT - crossing) / Math.max(0.001, 1 - crossing))
  const strength = CONTACT_SHADOW_MAX * pbr * (1 - separation)
  return [strength, 0.006 + 0.03 * separation]
}

/** Shared by paper, ink, fills, pulse and batched text, all in sheet coordinates. */
export const PAPER_FLEX_GLSL = /* glsl */ `
uniform sampler2D uFlexField;
uniform vec4 uFlexRect;
uniform float uFlexAmplitude;
float paperFlexWeight(vec2 p) {
  vec2 uv = (p - uFlexRect.xy) / uFlexRect.zw;
  if (min(uv.x, uv.y) <= 0.0 || max(uv.x, uv.y) >= 1.0) return 0.0;
  return texture2D(uFlexField, uv).r;
}
float paperDisplacement(vec2 p) { return uFlexAmplitude * paperFlexWeight(p); }
`

/** Scanline raster + separable soft mask: bounded startup cost, no per-frame CPU geometry work. */
export function makePaperFlexField(points: number[][], width: number, height: number, nx = 256, ny = 160) {
  const mask = new Float32Array(nx * ny)
  for (let y = 0; y < ny; y += 1) {
    const py = ((y + 0.5) / ny - 0.5) * height
    const hits: number[] = []
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[j], b = points[i]
      if ((a[1] > py) !== (b[1] > py)) hits.push(a[0] + (py - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
    }
    hits.sort((a, b) => a - b)
    for (let k = 0; k + 1 < hits.length; k += 2) {
      const lo = Math.max(0, Math.ceil((hits[k] / width + 0.5) * nx - 0.5))
      const hi = Math.min(nx - 1, Math.floor((hits[k + 1] / width + 0.5) * nx - 0.5))
      for (let x = lo; x <= hi; x += 1) mask[y * nx + x] = 1
    }
  }
  const blur = (input: Float32Array, horizontal: boolean) => {
    const sigma = 0.012 / (horizontal ? width / nx : height / ny)
    const radius = Math.ceil(3 * sigma)
    const weights = Array.from({ length: 2 * radius + 1 }, (_, i) => Math.exp(-0.5 * ((i - radius) / sigma) ** 2))
    const total = weights.reduce((sum, w) => sum + w, 0)
    const output = new Float32Array(input.length)
    for (let y = 0; y < ny; y += 1) for (let x = 0; x < nx; x += 1) {
      let sum = 0
      for (let d = -radius; d <= radius; d += 1) {
        const xx = horizontal ? x + d : x, yy = horizontal ? y : y + d
        if (xx >= 0 && xx < nx && yy >= 0 && yy < ny) sum += input[yy * nx + xx] * weights[d + radius]
      }
      output[y * nx + x] = sum / total
    }
    return output
  }
  const soft = blur(blur(mask, true), false)
  const bytes = new Uint8Array(nx * ny * 4)
  let peak = 0
  for (let x = 0; x < nx; x += 1) {
    let mass = 0, moment = 0, variance = 0
    for (let y = 0; y < ny; y += 1) { const w = soft[y * nx + x]; mass += w; moment += w * y }
    const center = mass > 0 ? moment / mass : ny / 2
    for (let y = 0; y < ny; y += 1) variance += soft[y * nx + x] * ((y - center) * height / ny) ** 2
    const spread = Math.max(0.02, Math.sqrt(variance / Math.max(mass, 1e-9)))
    for (let y = 0; y < ny; y += 1) {
      const dy = (y - center) * height / ny
      const edge = Math.min(x, nx - 1 - x) * width / nx
      const edgeY = Math.min(y, ny - 1 - y) * height / ny
      const weight = soft[y * nx + x] * (0.55 + 0.45 * Math.exp(-0.5 * (dy / spread) ** 2)) * smooth01(Math.min(edge, edgeY) / 0.018)
      const i = (y * nx + x) * 4
      bytes[i] = Math.round(weight * 255)
      bytes[i + 3] = 255
      peak = Math.max(peak, bytes[i] / 255)
    }
  }
  const texture = new DataTexture(bytes, nx, ny, RGBAFormat, UnsignedByteType)
  texture.minFilter = texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return { texture, rect: new Vector4(-width / 2, -height / 2, width, height), peak }
}
