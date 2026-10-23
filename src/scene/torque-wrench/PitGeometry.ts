import { BufferGeometry, Float32BufferAttribute } from 'three'
import { PORTAL_MOUTH_Z, makePortalShaftGeometry, portalClearanceM,
  type PortalShaftGeometry } from '../drawing/sheet/portalGeometry'

export const PRIVATE_PIT_RELIEF_M = 0.018
export const PRIVATE_PIT_MAX_DEVIATION_M = 0.13
/** Angular fracture cells around the shaft; privatePitMaterial samples the same field. */
export const PRIVATE_PIT_ANGULAR_CELLS = 28
/** Mean stratum thickness in metres; the material's band field uses the same period. */
export const PRIVATE_PIT_STRATUM_M = 0.085

const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u) }
/** Triangle wave in [-1, 1]; its corners survive normal-based faceting better than sines. */
const tri = (u: number) => 4 * Math.abs(u - Math.floor(u) - 0.5) - 1
const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}
/**
 * Angular cells blend into the next cell over the last `ramp` fraction of each cell. A hard
 * step landing between two adjacent vertices of the dense traced contour (~0.125 mm pixel
 * stairs) lets a short radial stair edge reverse, crossing its neighbours on re-entrant
 * stretches. The offset depends on angle alone, so a continuous field cannot fold a ring.
 * Measured window on the tracked contour: coarse cells need ramp >= .12 to stay fold-free
 * and <= .16 to keep the sparse-ring cliff jumps; the fine rubble grain is the sharper
 * offender and needs a wide ramp. Integer periods wrap cell indices at the atan2 seam.
 */
export const PRIVATE_PIT_CELL_RAMP = .14
export const PRIVATE_PIT_FINE_CELL_RAMP = .5
const rampedCell = (u: number, seed: number, ramp: number, period = 0) => {
  const base = Math.floor(u)
  const blend = smooth((u - base - (1 - ramp)) / ramp)
  const wrap = (c: number) => period > 0 ? ((c % period) + period) % period : c
  return hash(wrap(base), seed) * (1 - blend) + hash(wrap(base + 1), seed) * blend
}
const wrapDistance = (a: number, b: number) => Math.abs(((a - b) % 1 + 1.5) % 1 - 0.5)

/**
 * Cavern ring depths: dense near the lip where parallax resolves rock, stretching below a
 * metre, ending on the hidden 3.2 m closure plane. 29 rings cost (29-1)/(22-1) = +33% wall
 * triangles over the previous 22-ring build — the budget that carves chambers and ledges.
 */
const RING_DEPTHS_M: readonly number[] = [0, .003, .007, .012, .019, .028, .04, .056, .076, .1,
  .128, .162, .2, .25, .31, .38, .46, .55, .66, .79, .94, 1.12, 1.32, 1.55, 1.82, 2.12,
  2.45, 2.82, 3.2]

/**
 * Overhang ledges (R4): local outward pulses at increasing depths. The rising edge hangs the
 * wall over the chamber below it; the falling edge leaves a shelf the mouth light can catch.
 * Pulse slope 2*amplitude/width stays under 0.28 so columns remain steep, never shelved.
 */
const LEDGE_COUNT = 6
const ledgeFieldM = (depth: number): number => {
  let sum = 0
  for (let j = 0; j < LEDGE_COUNT; j++) {
    const center = .12 + j * .36 + .08 * hash(j, 7.7)
    const width = .18 + .14 * hash(j, 11.3)
    const amplitude = .017 + .01 * hash(j, 9.1)
    sum += amplitude * Math.max(0, 1 - 2 * Math.abs(depth - center) / width)
  }
  return sum
}

/**
 * Chamber envelope (R4): the bore widens and narrows as it descends instead of flaring
 * monotonically. A fixed phase keeps the field continuous in depth; its slope is bounded by
 * 2*chamber/period, so widening never beats the 38-degree column steepness budget.
 */
const chamberFieldM = (depth: number): number =>
  .048 * smooth(depth / .16) * (.5 + .5 * tri(depth / .4 + .21))

/** Per-stratum rubble bulges: hash-selected angular wedges, faded in below the visible lip. */
const rubbleFieldM = (sector: number, depth: number, stratumCell: number): number => {
  const fade = smooth((depth - .2) / .18)
  if (fade <= 0) return 0
  let bump = 0
  for (let j = 0; j < 4; j++) {
    const center = hash(stratumCell * 3.1, j * 7.7 + 2.2)
    const sigma = .022 + .03 * hash(stratumCell, j + 40)
    const amplitude = .004 + .0035 * hash(stratumCell + 9, j)
    const d = wrapDistance(sector, center)
    bump += amplitude * Math.exp(-(d * d) / (2 * sigma * sigma))
  }
  return bump * fade
}

/** Exact torn mouth opens into a cavern with independent near-wall relief.
 *
 * Radial displacement is strictly outward from the profile centroid, so every displaced ring
 * keeps the contour's winding and cannot fold; same-column depth stays strictly descending;
 * the registered mouth ring and the 3.2 m closure ring are untouched. Rock structure is a
 * stack of four bounded fields — chamber oscillation, ledge pulses, angular fracture cells
 * and rubble wedges — whose combined slope the tests verify numerically against R4's steep,
 * thick-walled cavern reading.
 */
export function makePrivatePitGeometry(outline: number[][]): PortalShaftGeometry {
  const ringDepthsM = RING_DEPTHS_M
  const shaft = makePortalShaftGeometry(outline, { ringDepthsM })
  const attribute = shaft.wallGeometry.getAttribute('position')
  const positions = attribute.array
  let maxDeviation = 0
  for (let k = 1; k < shaft.ringCount; k++) {
    const depth = shaft.ringDepthsM[k]
    const stratumCell = Math.floor(depth / PRIVATE_PIT_STRATUM_M)
    const chamber = chamberFieldM(depth)
    const ledge = ledgeFieldM(depth)
    for (let i = 0; i < outline.length; i++) {
      const [x, y] = outline[i]
      const rx = x - shaft.profile.centroid[0], ry = y - shaft.profile.centroid[1]
      const radius = Math.hypot(rx, ry)
      const angle = Math.atan2(ry, rx)
      const sector = angle / (Math.PI * 2) + .5
      // Cliff cells read as angular steps; the fine sub-cell grain adds rubble scale. Both
      // ramp across cell boundaries (see rampedCell) so outward-only displacement cannot fold.
      const cellSector = Math.floor(sector * PRIVATE_PIT_ANGULAR_CELLS + stratumCell * .37)
      const cell = rampedCell(sector * PRIVATE_PIT_ANGULAR_CELLS + stratumCell * .37,
        stratumCell, PRIVATE_PIT_CELL_RAMP, PRIVATE_PIT_ANGULAR_CELLS)
      const cellEdge = Math.abs(2 * (sector * PRIVATE_PIT_ANGULAR_CELLS
        - Math.floor(sector * PRIVATE_PIT_ANGULAR_CELLS)) - 1)
      const fineCell = rampedCell(sector * PRIVATE_PIT_ANGULAR_CELLS * 2.6 + stratumCell * .61,
        stratumCell * 1.7, PRIVATE_PIT_FINE_CELL_RAMP)
      const facet = .66 * cell + .18 * cellEdge + .16 * fineCell
      const buttress = (PRIVATE_PIT_RELIEF_M + .006) * smooth(depth / .10)
        * (.58 + .42 * facet)
      const rubble = rubbleFieldM(sector, depth, stratumCell)
      const clearance = portalClearanceM(depth) + chamber + buttress + ledge + rubble
      const o = (k * outline.length + i) * 3
      positions[o] = x + (radius > 1e-9 ? rx / radius * clearance : 0)
      positions[o + 1] = y + (radius > 1e-9 ? ry / radius * clearance : 0)
      // Strata relief keeps each column descending: two adjacent strata bounds total well
      // under their shared nominal gap; the last ring stays on the 3.2m closure plane.
      const gapBefore = depth - shaft.ringDepthsM[k - 1]
      const gapAfter = k + 1 < shaft.ringCount ? shaft.ringDepthsM[k + 1] - depth : gapBefore
      const localGap = Math.min(gapBefore, gapAfter)
      const strataRelief = k + 1 < shaft.ringCount
        ? .30 * localGap * smooth(depth / .025)
          * (.5 + .5 * hash(cellSector, stratumCell + 17))
        : 0
      positions[o + 2] = PORTAL_MOUTH_Z - depth - strataRelief
      maxDeviation = Math.max(maxDeviation, Math.hypot(positions[o] - x, positions[o + 1] - y))
    }
  }
  // The closure shares the final ring byte-for-byte. It remains at 3.2m beyond sight.
  const last = (shaft.ringCount - 1) * outline.length * 3
  shaft.closureGeometry.getAttribute('position').array.set(Array.from(positions).slice(last))
  attribute.needsUpdate = true
  shaft.wallGeometry.computeVertexNormals()
  shaft.closureGeometry.computeVertexNormals()
  shaft.maxRingDeviationM = maxDeviation
  return shaft
}

/** Raised torn stock outside the exact mouth; no cap or face spans the aperture. */
export function makePrivatePitLipGeometry(outline: number[][]): BufferGeometry {
  const positions: number[] = [], roots: number[] = [], profiles: number[] = [], indices: number[] = []
  const n = outline.length
  const rawNx = new Float64Array(n), rawNy = new Float64Array(n), arc = new Float64Array(n)
  let totalArc = 0
  for (let i = 0; i < n; i++) {
    const prev = outline[(i + n - 1) % n], next = outline[(i + 1) % n]
    const dx = next[0] - prev[0], dy = next[1] - prev[1], len = Math.hypot(dx, dy) || 1
    rawNx[i] = dy / len
    rawNy[i] = -dx / len
    arc[i] = totalArc
    totalArc += Math.hypot(next[0] - outline[i][0], next[1] - outline[i][1])
  }
  const totalLen = Math.max(totalArc, 1e-6)
  for (let i = 0; i < n; i++) {
    const [x, y] = outline[i]
    let sx = 0, sy = 0
    for (let w = -3; w <= 3; w++) {
      const k = (i + w + n) % n
      const weight = 4 - Math.abs(w)
      sx += rawNx[k] * weight
      sy += rawNy[k] * weight
    }
    const slen = Math.hypot(sx, sy) || 1
    const nx = sx / slen, ny = sy / slen
    const u = arc[i] / totalLen
    // Multi-scale non-periodic tear envelope: broad delamination flaps, jagged notches and fibre tufts.
    const flapCell = Math.floor(u * 16)
    const flapNext = (flapCell + 1) % 16
    const flap = hash(flapCell, 13) + (hash(flapNext, 13) - hash(flapCell, 13)) * smooth(u * 16 - flapCell)
    const notch = .5 + .5 * tri(u * 47 + .47 * hash(flapCell, 29))
    const sharpNotch = Math.pow(notch, 1.65)
    const tuft = .5 + .5 * tri(u * 163 + .63 * hash(Math.floor(u * 67), 71))
    const tear = Math.max(0.05, Math.min(1, .44 * Math.pow(flap, 1.3) + .38 * sharpNotch + .18 * tuft))
    const width = .0009 + .0054 * tear + .0006 * hash(i, 47)
    const height = .00028 + .0023 * Math.pow(tear, 1.25) + .00018 * hash(i, 31)
    positions.push(
      x, y, .00003,
      x + nx * width * .54, y + ny * width * .54, height,
      x + nx * width, y + ny * width, .00006 + .00055 * tear,
    )
    roots.push(x, y, x, y, x, y)
    profiles.push(0, tear, .52, tear, 1, tear)
    const j = (i + 1) % n
    for (let k = 0; k < 2; k++) indices.push(i * 3 + k, j * 3 + k, i * 3 + k + 1,
      i * 3 + k + 1, j * 3 + k, j * 3 + k + 1)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aLipRoot', new Float32BufferAttribute(roots, 2))
  geometry.setAttribute('aLipProfile', new Float32BufferAttribute(profiles, 2))
  geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}

/**
 * Stratified cliff ledges, vertical shear planes and stepped overhangs spanning the whole
 * bore (R4). Built as a continuous fold-free multi-stratum shelf/cliff mesh inside the shaft
 * so horizontal gearbox walls, spindle collar, clutch throat and handle chasm all resolve as
 * thick stepped rock beds rather than bare wall or isolated pebbles.
 */
const ROCK_STRATA_RINGS: ReadonlyArray<{ depth: number; shelf: number; overhang: number }> = [
  { depth: .0005, shelf: -.0012, overhang: 0 },
  { depth: .0024, shelf: .0022, overhang: .25 },
  { depth: .0120, shelf: .0008, overhang: .20 },
  { depth: .0165, shelf: .0105, overhang: .75 },
  { depth: .0335, shelf: .0058, overhang: .40 },
  { depth: .0395, shelf: .0185, overhang: .95 },
  { depth: .0640, shelf: .0125, overhang: .50 },
  { depth: .0725, shelf: .0245, overhang: 1.0 },
  { depth: .1080, shelf: .0180, overhang: .60 },
  { depth: .1190, shelf: .0285, overhang: 1.0 },
  { depth: .1720, shelf: .0220, overhang: .65 },
  { depth: .1880, shelf: .0300, overhang: .90 },
  { depth: .2700, shelf: .0195, overhang: .40 },
  { depth: .3800, shelf: -.0080, overhang: 0 },
]

export function makePrivatePitRockGeometry(outline: number[][]): BufferGeometry {
  const n = outline.length
  let cx = 0, cy = 0
  for (let i = 0; i < n; i++) { cx += outline[i][0]; cy += outline[i][1] }
  cx /= n; cy /= n

  // Smoothed inward normal + radial blend so shelves jut into both the horizontal gearbox
  // tunnel and the angled handle chasm without self-crossing at tight contour corners.
  let inx = new Float64Array(n), iny = new Float64Array(n)
  const arc = new Float64Array(n)
  let totalArc = 0
  for (let i = 0; i < n; i++) {
    const prev = outline[(i + n - 1) % n], next = outline[(i + 1) % n]
    const dx = next[0] - prev[0], dy = next[1] - prev[1], len = Math.hypot(dx, dy) || 1
    inx[i] = -dy / len
    iny[i] = dx / len
    arc[i] = totalArc
    totalArc += Math.hypot(next[0] - outline[i][0], next[1] - outline[i][1])
  }
  const smoothPasses = Math.max(18, Math.floor(n / 5))
  for (let pass = 0; pass < smoothPasses; pass++) {
    const nx = new Float64Array(n), ny = new Float64Array(n)
    for (let i = 0; i < outline.length; i++) {
      const p = (i + n - 1) % n, q = (i + 1) % n
      nx[i] = .25 * inx[p] + .5 * inx[i] + .25 * inx[q]
      ny[i] = .25 * iny[p] + .5 * iny[i] + .25 * iny[q]
    }
    inx = nx; iny = ny
  }
  for (let i = 0; i < n; i++) {
    const rx = cx - outline[i][0], ry = cy - outline[i][1], rlen = Math.hypot(rx, ry) || 1
    const bx = .72 * inx[i] + .28 * (rx / rlen), by = .72 * iny[i] + .28 * (ry / rlen)
    const blen = Math.hypot(bx, by) || 1
    inx[i] = bx / blen; iny[i] = by / blen
  }

  // Measure opposite-wall chord distance so narrow bores (spindle, air fitting) cap inward
  // shelf reach while wide bores (gearbox, clutch, throat) project bold stratified benches.
  let oppDist = new Float64Array(n)
  const sampleStep = Math.max(1, Math.floor(n / 160))
  const skipWindow = Math.max(3, Math.floor(n / 18))
  for (let i = 0; i < n; i++) {
    let minChord = .075
    const [xi, yi] = outline[i]
    for (let j = 0; j < n; j += sampleStep) {
      const diff = Math.min(Math.abs(i - j), n - Math.abs(i - j))
      if (diff < skipWindow) continue
      const vx = outline[j][0] - xi, vy = outline[j][1] - yi
      const d = Math.hypot(vx, vy)
      if (d < 1e-6) continue
      const align = (vx * inx[i] + vy * iny[i]) / d
      if (align > .28 && d < minChord) minChord = d
    }
    oppDist[i] = Math.max(.0045, Math.min(.072, minChord))
  }
  for (let pass = 0; pass < 5; pass++) {
    const next = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      next[i] = .25 * oppDist[(i + n - 1) % n] + .5 * oppDist[i] + .25 * oppDist[(i + 1) % n]
    }
    oppDist = next
  }

  const totalLen = Math.max(totalArc, 1e-6)
  const ringCount = ROCK_STRATA_RINGS.length
  const positions = new Float32Array(ringCount * n * 3)
  const prevZ = new Float64Array(n).fill(PORTAL_MOUTH_Z - .0002)

  for (let r = 0; r < ringCount; r++) {
    const spec = ROCK_STRATA_RINGS[r]
    const stratum = Math.max(0, Math.floor((r - 1) / 2))
    const rawReach = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      const u = arc[i] / totalLen
      // Asymmetric promontory buttresses separated by deep vertical shear canyons so the
      // strata never read as continuous parallel racetrack stripes around the bore.
      const blockCoord = u * 19 + stratum * .43
      const blockId = Math.floor(blockCoord)
      const blockNext = (blockId + 1) % 19
      const shearBlend = smooth(Math.min(1, (blockCoord - blockId) / .14))
      const blockVal = hash(blockId, stratum * 11 + 3)
        + (hash(blockNext, stratum * 11 + 3) - hash(blockId, stratum * 11 + 3)) * shearBlend
      // Master vertical shear canyons and bold rocky promontories cutting across strata.
      const canyonCoord = u * 9 + stratum * .19
      const canyonId = Math.floor(canyonCoord)
      const canyonVal = hash(canyonId, 97)
        + (hash((canyonId + 1) % 9, 97) - hash(canyonId, 97)) * smooth(Math.min(1, (canyonCoord - canyonId) / .18))
      // Promontory gate: some angular sectors jut boldly into the bore while canyon sectors shear back.
      const promontory = Math.pow(Math.max(0.08, .55 * blockVal + .45 * canyonVal), 1.45)
      const crag = .5 + .5 * tri(u * 43 + stratum * 2.1 + .55 * blockVal)
      const jag = .5 + .5 * tri(u * 117 - stratum * 2.9 + .4 * canyonVal)
      const slotScale = Math.min(1, oppDist[i] / .028)
      const edgeJag = (.0022 + .0034 * spec.overhang) * slotScale * (crag - .38 + .42 * (jag - .5))
      const maxInward = .29 * oppDist[i]
      const desired = spec.shelf >= 0
        ? Math.min(maxInward, Math.max(.0003, spec.shelf * slotScale * (.22 + 1.35 * promontory) + edgeJag))
        : spec.shelf * (.85 + .3 * promontory)
      rawReach[i] = desired
    }
    // Smooth reach slightly along the contour so angular shear steps never invert an edge.
    let reach = rawReach
    const reachPasses = Math.max(1, Math.floor(n / 130))
    for (let p = 0; p < reachPasses; p++) {
      const next = new Float64Array(n)
      for (let i = 0; i < n; i++) {
        next[i] = .18 * reach[(i + n - 1) % n] + .64 * reach[i] + .18 * reach[(i + 1) % n]
      }
      reach = next
    }
    for (let i = 0; i < n; i++) {
      const u = arc[i] / totalLen
      const blockId = Math.floor(u * 19 + stratum * .43)
      const nextDepth = r + 1 < ringCount ? ROCK_STRATA_RINGS[r + 1].depth : spec.depth + .06
      const prevDepth = r > 0 ? ROCK_STRATA_RINGS[r - 1].depth : 0
      const localSpan = Math.min(spec.depth - prevDepth, nextDepth - spec.depth)
      // Strong per-block vertical shear offset breaks horizontal ring alignment across the shaft.
      const thicknessVar = r > 0 && r + 1 < ringCount
        ? .44 * localSpan * ((hash(blockId, stratum * 19 + 7) - .45) + .45 * tri(u * 29 + r * 1.13))
        : 0
      const z = Math.min(prevZ[i] - .00025, PORTAL_MOUTH_Z - spec.depth - Math.max(-.36 * localSpan, thicknessVar))
      prevZ[i] = z
      const o = (r * n + i) * 3
      positions[o] = outline[i][0] + inx[i] * reach[i]
      positions[o + 1] = outline[i][1] + iny[i] * reach[i]
      positions[o + 2] = z
    }
  }

  const indices: number[] = []
  for (let r = 0; r < ringCount - 1; r++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const a = r * n + i, b = r * n + j, c = (r + 1) * n + i, d = (r + 1) * n + j
      indices.push(a, b, d, a, d, c)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
