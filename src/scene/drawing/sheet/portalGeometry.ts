import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three'

/**
 * JG-035 blue-trace / vertical rock shaft — geometry and its metric contract.
 *
 * Owner direction (2026-10-03): the opening is a near-vertical extrusion of the EXACT torn
 * contour straight down through rock, with subtle relief on the wall faces, lightness-blue
 * #79CFFF fissures on wall faces only, an unknown depth that never shows a floor, and no
 * planar terminator, slope or boulder pocket. The rejected build flared rings outward by 65%
 * of the profile radius and closed on an opaque cap 0.32 m down, which read as a shallow
 * pocket with a visible floor.
 *
 * The shaft here is an open tube: every ring is the torn contour itself (ring 0 exactly, bit
 * for bit) displaced only by a bounded outward clearance and a smooth, fold-free relief warp.
 * The only closing surface is the far closure, one full shaft depth below the lip, where the
 * rock extinction has already driven the shading below one 8-bit step — so no edge, gradient
 * or silhouette can mark it (see `portalClosureContrast8Bit`).
 *
 * Depth is metric sheet-local metres, and it is chosen from occlusion, not taste: a sight ray
 * entering the aperture `offNormalDeg` out of the sheet normal meets the wall after
 * `extent / tan(offNormalDeg)`. With the closure deeper than the worst-case chord, every ray
 * that enters the hole terminates on rock, so the closure can never be photographed.
 */

/** Sheet-local metres. The torn lip; the desk cut and the paper hole are authored against it. */
export const PORTAL_MOUTH_Z = -0.00048

/** Approved fissure/trace blue: sRGB #79CFFF, written as display-referred shader components. */
export const PORTAL_FISSURE_HEX = 0x79cfff
export const PORTAL_FISSURE_CSS = '#79cfff'
export const PORTAL_FISSURE_RGB: readonly [number, number, number] =
  [0x79 / 255, 0xcf / 255, 1]

/**
 * Ring depths below the lip, in metres. Dense at the lip where parallax resolves rock, then
 * roughly doubling so a fixed vertex budget reaches an unknowable distance below.
 */
export const PORTAL_RING_DEPTHS: readonly number[] =
  Object.freeze([0, 0.012, 0.032, 0.07, 0.14, 0.28, 0.55, 1.05, 1.75, 2.4, 3.2])

/** Deepest ring — the far closure plane, 3.2 m below the lip. */
export const PORTAL_SHAFT_DEPTH_M = PORTAL_RING_DEPTHS[PORTAL_RING_DEPTHS.length - 1]
export const PORTAL_CLOSURE_Z = PORTAL_MOUTH_Z - PORTAL_SHAFT_DEPTH_M

/**
 * Outward wall clearance at depth, in metres. The torn contour is only ever within 0.4 mm
 * outward of the exact profile (`BREAKTHROUGH_TORN_MAX`), so the rock must stand off enough
 * that the rising tool never grazes it. Zero at the lip — the mouth must stay exactly the torn
 * contour the paper, rim and desk cut are authored against — then fully applied by the ramp.
 */
export const PORTAL_CLEARANCE_M = 0.006
export const PORTAL_CLEARANCE_RAMP_M = 0.09

/**
 * Rock relief amplitude, in metres. The warp is a smooth function of position and depth whose
 * XY gradient stays far below 1, so ring topology is preserved by construction: no fold, no
 * terrace, no pocket.
 */
export const PORTAL_RELIEF_M = 0.0018
/** Worst-case relief magnitude over both axes: hypot(1.5A, 1.5A). */
export const PORTAL_RELIEF_BOUND_M = Math.hypot(1.5 * PORTAL_RELIEF_M, 1.5 * PORTAL_RELIEF_M)
/** Worst-case XY deviation of any ring from the exact torn contour, in metres. */
export const PORTAL_RING_DEVIATION_BOUND_M = PORTAL_CLEARANCE_M + PORTAL_RELIEF_BOUND_M
/** Relief ramps in below the lip: ring 0 stays the exact torn contour. */
export const PORTAL_RELIEF_RAMP_M = 0.08
const RELIEF_WAVE_X = (2 * Math.PI) / 0.34
const RELIEF_WAVE_Y = (2 * Math.PI) / 0.27

/** Extinction lengths, in metres: how fast trace light dies on rock, and how haze lingers. */
export const PORTAL_ROCK_EXTINCTION_M = 0.55
export const PORTAL_HAZE_EXTINCTION_M = 2.2
/** Wall shading endpoints (display-referred, cold blue-grey). */
export const PORTAL_ROCK_DARK: readonly [number, number, number] = [0.012, 0.018, 0.03]
export const PORTAL_ROCK_LIGHT: readonly [number, number, number] = [0.07, 0.092, 0.124]
export const PORTAL_HAZE_RGB: readonly [number, number, number] = [0.02, 0.032, 0.052]
/** Wall response to the shared trace light: never fully dark, never a white floodlight. */
export const PORTAL_AMBIENT_FLOOR = 0.18
/** Hard cap on the fissure emission scalar. Keeps the blue's own hue; forbids a white core. */
export const PORTAL_FISSURE_CEILING = 0.86
/** E-folding of fissure visibility with depth: pronounced at the lip, faint far below. */
export const PORTAL_FISSURE_FALLOFF_M = 0.95

/**
 * Conservative off-normal bound for the "closure can never be seen" guarantee. The drafting
 * camera never gets closer to the sheet normal than this, and the shipped shaft clears it with
 * better than 2x margin on the real contour.
 */
export const PORTAL_SIGHTLINE_FLOOR_DEG = 15

export interface PortalShaftProfile {
  /** Torn contour, counter-clockwise, sheet-local metres — used verbatim as ring 0. */
  outline: number[][]
  centroid: [number, number]
  count: number
  perimeterM: number
  /** Bounding diagonal in metres; a conservative aperture chord bound. */
  extentM: number
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const finite = (v: number) => Number.isFinite(v)

/** Validate and measure the torn contour. Throws rather than building a broken shaft. */
export function buildPortalShaftProfile(outline: number[][]): PortalShaftProfile {
  if (!Array.isArray(outline) || outline.length < 3) {
    throw new Error(`Portal shaft needs a closed torn contour of 3+ points, received ${outline?.length ?? 0}`)
  }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let cx = 0
  let cy = 0
  let perimeterM = 0
  for (let i = 0; i < outline.length; i += 1) {
    const p = outline[i]
    if (!p || !finite(p[0]) || !finite(p[1])) {
      throw new Error(`Portal shaft contour has a non-finite point at index ${i}`)
    }
    if (p[0] < minX) minX = p[0]
    if (p[0] > maxX) maxX = p[0]
    if (p[1] < minY) minY = p[1]
    if (p[1] > maxY) maxY = p[1]
    cx += p[0]
    cy += p[1]
    const q = outline[(i + 1) % outline.length]
    perimeterM += Math.hypot(q[0] - p[0], q[1] - p[1])
  }
  const centroid: [number, number] = [cx / outline.length, cy / outline.length]
  if (!(perimeterM > 1e-6)) {
    throw new Error('Portal shaft contour is degenerate (zero perimeter)')
  }
  // Bounding diagonal conservatively bounds every aperture chord in linear time.
  // The live raster contour contains thousands of points; pairwise calipers stall boot.
  const extentM = Math.hypot(maxX - minX, maxY - minY)
  return { outline, centroid, count: outline.length, perimeterM, extentM, minX, maxX, minY, maxY }
}

const smoothstep01 = (u: number) => {
  const k = u <= 0 ? 0 : u >= 1 ? 1 : u
  return k * k * (3 - 2 * k)
}

/** Outward wall clearance at a given depth below the lip, in metres. */
export function portalClearanceM(depthM: number): number {
  if (!(depthM > 0)) return 0
  return PORTAL_CLEARANCE_M * smoothstep01(depthM / PORTAL_CLEARANCE_RAMP_M)
}

/**
 * Smooth rock relief, in metres, applied to a point of the exact contour at a given depth.
 * Bounded by 1.5x the amplitude, and its XY gradient is ~0.06, so the displaced ring stays a
 * simple polygon with the same winding.
 */
export function portalReliefM(x: number, y: number, depthM: number): [number, number] {
  const amplitude = PORTAL_RELIEF_M * smoothstep01(Math.max(0, depthM) / PORTAL_RELIEF_RAMP_M)
  if (amplitude === 0) return [0, 0]
  const dx = amplitude * (Math.sin(RELIEF_WAVE_X * x + 1.7 + 0.9 * depthM)
    + 0.5 * Math.sin(RELIEF_WAVE_Y * y + 0.6 * depthM))
  const dy = amplitude * (Math.cos(RELIEF_WAVE_Y * y + 4.1 + 1.1 * depthM)
    + 0.5 * Math.sin(RELIEF_WAVE_X * x + 2.2 + 0.7 * depthM))
  return [dx, dy]
}

/** One shaft vertex: exact contour point + relief + outward clearance, at its metric depth. */
export function portalRingPoint(
  profile: PortalShaftProfile, index: number, depthM: number,
): [number, number, number] {
  const p = profile.outline[index]
  const [dx, dy] = portalReliefM(p[0], p[1], depthM)
  const clearance = portalClearanceM(depthM)
  let ox = p[0] - profile.centroid[0]
  let oy = p[1] - profile.centroid[1]
  const len = Math.hypot(ox, oy)
  if (len > 1e-9 && clearance > 0) { ox /= len; oy /= len } else { ox = 0; oy = 0 }
  return [p[0] + dx + ox * clearance, p[1] + dy + oy * clearance, PORTAL_MOUTH_Z - depthM]
}

export interface PortalShaftGeometry {
  /** Open tube from the exact lip down to the deepest ring. No floor in this mesh. */
  wallGeometry: BufferGeometry
  /** Far closure disc, coincident with the deepest ring: the only closing surface. */
  closureGeometry: BufferGeometry
  profile: PortalShaftProfile
  ringCount: number
  /** Depth of each ring below the lip, in metres (mirrors PORTAL_RING_DEPTHS). */
  ringDepthsM: readonly number[]
  maxRingDeviationM: number
}

/**
 * Build the shaft. Ring 0 is the torn contour itself (relief and clearance are both exactly
 * zero there), and every deeper ring is that contour displaced by millimetres, so the torn
 * tool silhouette — barrel, shoulder, finger concavity, grip — continues straight down.
 */
export function makePortalShaftGeometry(
  outline: number[][],
  options: { ringDepthsM?: readonly number[] } = {},
): PortalShaftGeometry {
  const profile = buildPortalShaftProfile(outline)
  const depths = options.ringDepthsM ?? PORTAL_RING_DEPTHS
  const n = profile.count
  const rings = depths.length
  const positions = new Float32Array(rings * n * 3)
  let maxRingDeviationM = 0
  for (let k = 0; k < rings; k += 1) {
    const depth = depths[k]
    if (k > 0 && !(depth > depths[k - 1])) {
      throw new Error(`Portal ring depths must strictly increase; ${depth} follows ${depths[k - 1]}`)
    }
    for (let i = 0; i < n; i += 1) {
      const [x, y, z] = portalRingPoint(profile, i, depth)
      const o = (k * n + i) * 3
      positions[o] = x
      positions[o + 1] = y
      positions[o + 2] = z
      const p = outline[i]
      const deviation = Math.hypot(x - p[0], y - p[1])
      if (deviation > maxRingDeviationM) maxRingDeviationM = deviation
    }
  }
  // Winding faces inward: tangent (i -> i+1) crossed with the downward step yields the
  // shaft-interior normal for a counter-clockwise contour.
  const indices: number[] = []
  for (let k = 0; k < rings - 1; k += 1) {
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n
      const a = k * n + i
      const b = k * n + j
      const c = (k + 1) * n + i
      const d = (k + 1) * n + j
      indices.push(a, b, d, a, d, c)
    }
  }
  const wallGeometry = new BufferGeometry()
  wallGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  wallGeometry.setIndex(indices)
  // The closure reuses the deepest ring verbatim: same numbers, so the seam is watertight and
  // wall and closure shade to the same extinct value there.
  const floor = new Float32Array(n * 3)
  const base = (rings - 1) * n * 3
  for (let i = 0; i < n * 3; i += 1) floor[i] = positions[base + i]
  const closureContour = Array.from({ length: n }, (_, i) => new Vector2(floor[i * 3], floor[i * 3 + 1]))
  const closureGeometry = new BufferGeometry()
  closureGeometry.setAttribute('position', new Float32BufferAttribute(floor, 3))
  closureGeometry.setIndex(ShapeUtils.triangulateShape(closureContour, []).flat())
  return {
    wallGeometry, closureGeometry, profile,
    ringCount: rings, ringDepthsM: depths, maxRingDeviationM,
  }
}

/** Depth at which a sight ray entering the aperture meets the far wall, in metres. */
export function portalSightlineDepthM(extentM: number, offNormalDeg: number): number {
  const clamped = Math.min(Math.max(offNormalDeg, 0.5), 89.5)
  return extentM / Math.tan((clamped * Math.PI) / 180)
}

export interface PortalOcclusionGuarantee {
  offNormalDeg: number
  /** Worst-case chord the ray must cross before it can reach the closure. */
  requiredDepthM: number
  availableDepthM: number
  margin: number
  /** True when the closure sits beyond every sight line that fits through the aperture. */
  closureOccluded: boolean
}

/** Can any sight line through the torn aperture reach the far closure? */
export function portalOcclusionGuarantee(
  extentM: number, offNormalDeg: number = PORTAL_SIGHTLINE_FLOOR_DEG,
): PortalOcclusionGuarantee {
  const requiredDepthM = portalSightlineDepthM(extentM, offNormalDeg)
  return {
    offNormalDeg,
    requiredDepthM,
    availableDepthM: PORTAL_SHAFT_DEPTH_M,
    margin: PORTAL_SHAFT_DEPTH_M / requiredDepthM,
    closureOccluded: PORTAL_SHAFT_DEPTH_M > requiredDepthM,
  }
}

/** Rock term alone (relief texture, lip light) at a depth. The far closure has none. */
export function portalRockTermM(depthM: number): [number, number, number] {
  const rock = Math.exp(-Math.max(0, depthM) / PORTAL_ROCK_EXTINCTION_M)
  return [PORTAL_ROCK_LIGHT[0] * rock, PORTAL_ROCK_LIGHT[1] * rock, PORTAL_ROCK_LIGHT[2] * rock]
}

/** Deep haze alone: the slow, smooth blue-black that keeps the bore from reading as a void. */
export function portalDeepHazeM(depthM: number): [number, number, number] {
  const haze = Math.exp(-Math.max(0, depthM) / PORTAL_HAZE_EXTINCTION_M)
  return [PORTAL_HAZE_RGB[0] * haze, PORTAL_HAZE_RGB[1] * haze, PORTAL_HAZE_RGB[2] * haze]
}

/** Wall/closure radiance at a depth, using the shipped extinction constants. */
export function portalRockRadianceM(depthM: number): [number, number, number] {
  const rock = portalRockTermM(depthM)
  const haze = portalDeepHazeM(depthM)
  return [rock[0] + haze[0], rock[1] + haze[1], rock[2] + haze[2]]
}

/** Display-referred contrast in 8-bit steps between two linear triples. */
export function portalRgbSteps8Bit(a: readonly number[], b: readonly number[]): number {
  return 255 * Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]))
}

/** The same triple, in 8-bit steps of the display buffer. */
export function portalRgb8Bit(rgb: readonly number[]): [number, number, number] {
  return [rgb[0] * 255, rgb[1] * 255, rgb[2] * 255]
}
