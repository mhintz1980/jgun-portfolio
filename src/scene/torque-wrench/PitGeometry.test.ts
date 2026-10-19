import { expect, it } from 'vitest'
import { makePrivatePitGeometry, makePrivatePitLipGeometry, makePrivatePitRockGeometry } from './PitGeometry'
import {
  makePortalShaftGeometry, PORTAL_MOUTH_Z, PORTAL_SHAFT_DEPTH_M,
} from '../drawing/sheet/portalGeometry'
const outline = Array.from({ length: 240 }, (_, i) => {
  const a = i / 240 * Math.PI * 2
  const r = .14 + .012 * Math.sin(a * 7) + .006 * Math.sin(a * 19)
    - .05 * Math.exp(-Math.pow((a - 3.6) / .35, 2))
  return [Math.cos(a) * r, Math.sin(a) * r]
})

it('builds stratified shelf and cliff rings that are fold-free, deterministic and wholly below the paper', () => {
  const a = makePrivatePitRockGeometry(outline), b = makePrivatePitRockGeometry(outline)
  const p = a.getAttribute('position')
  const n = outline.length
  const ringCount = p.count / n
  expect(p.count).toBeGreaterThan(1000)
  expect(Number.isInteger(ringCount)).toBe(true)
  expect(ringCount).toBeGreaterThanOrEqual(12)
  expect(a.index!.count).toBe((ringCount - 1) * n * 6)
  expect(Array.from(p.array)).toEqual(Array.from(b.getAttribute('position').array))
  expect(Array.from(p.array).every(Number.isFinite)).toBe(true)
  for (let i = 0; i < p.count; i++) expect(p.getZ(i)).toBeLessThan(PORTAL_MOUTH_Z)
  let shelfBenchSteps = 0
  for (let r = 0; r < ringCount; r++) {
    const ring: number[][] = []
    for (let i = 0; i < n; i++) {
      const idx = r * n + i
      ring.push([p.getX(idx), p.getY(idx)])
      if (r > 0) expect(p.getZ(idx)).toBeLessThan(p.getZ((r - 1) * n + i))
    }
    expect(signedArea(ring)).toBeGreaterThan(0)
    expect(findFold(ring), `rock shelf ring ${r} folds`).toBeNull()
    if (r > 0) {
      let meanInwardStep = 0
      for (let i = 0; i < n; i++) {
        const prevIdx = (r - 1) * n + i, curIdx = r * n + i
        const prevR = Math.hypot(p.getX(prevIdx), p.getY(prevIdx))
        const curR = Math.hypot(p.getX(curIdx), p.getY(curIdx))
        meanInwardStep += prevR - curR
      }
      if (meanInwardStep / n > .003) shelfBenchSteps++
    }
  }
  expect(shelfBenchSteps).toBeGreaterThanOrEqual(4)
  a.dispose(); b.dispose()
})

const signedArea = (ring: number[][]) => {
  let area = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    area += a[0] * b[1] - b[0] * a[1]
  }
  return area / 2
}

/** Exact proper-segment crossing check for this compact synthetic contour. */
const findFold = (ring: number[][]) => {
  const turn = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
  const crosses = (p: number, q: number) => (p > 0 && q < 0) || (p < 0 && q > 0)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    for (let j = i + 2; j < ring.length; j++) {
      if (i === 0 && j === ring.length - 1) continue
      const c = ring[j], d = ring[(j + 1) % ring.length]
      if (crosses(turn(a[0], a[1], b[0], b[1], c[0], c[1]),
        turn(a[0], a[1], b[0], b[1], d[0], d[1]))
        && crosses(turn(c[0], c[1], d[0], d[1], a[0], a[1]),
          turn(c[0], c[1], d[0], d[1], b[0], b[1]))) return [i, j]
    }
  }
  return null
}
it('preserves exact mouth, wall topology, steep walls and extinct matched closure', () => {
  const current = makePortalShaftGeometry(outline), pit = makePrivatePitGeometry(outline)
  const a = current.wallGeometry.getAttribute('position').array, b = pit.wallGeometry.getAttribute('position').array
  expect(Array.from(b).slice(0, outline.length * 3)).toEqual(Array.from(a).slice(0, outline.length * 3))
  expect(pit.ringCount).toBeGreaterThan(current.ringCount)
  expect(pit.wallGeometry.index!.count).toBe((pit.ringCount - 1) * outline.length * 6)
  expect(Array.from(b).every(Number.isFinite)).toBe(true)
  expect(pit.ringDepthsM.at(-1)).toBe(PORTAL_SHAFT_DEPTH_M)
  expect(pit.maxRingDeviationM).toBeGreaterThan(0.05)
  expect(pit.maxRingDeviationM).toBeLessThan(0.13)
  const finalRingOffset = (pit.ringCount - 1) * outline.length * 3
  const closure = Array.from(pit.closureGeometry.getAttribute('position').array)
  expect(closure).toEqual(Array.from(b).slice(finalRingOffset))
  for (let i = 0; i < outline.length; i++) {
    const o = i * 3, v = finalRingOffset + o
    expect(closure[o + 2]).toBeCloseTo(PORTAL_MOUTH_Z - PORTAL_SHAFT_DEPTH_M, 6)
    expect(b[v + 2]).toBe(closure[o + 2])
    const outward = [b[v] - outline[i][0], b[v + 1] - outline[i][1]]
    const radial = [outline[i][0] - pit.profile.centroid[0], outline[i][1] - pit.profile.centroid[1]]
    expect(outward[0] * radial[0] + outward[1] * radial[1]).toBeGreaterThanOrEqual(-1e-10)
  }
  const repeat = makePrivatePitGeometry(outline)
  expect(Array.from(repeat.wallGeometry.getAttribute('position').array)).toEqual(Array.from(b))
  expect(Array.from(repeat.closureGeometry.getAttribute('position').array)).toEqual(closure)
  repeat.wallGeometry.dispose(); repeat.closureGeometry.dispose()
  let maxSlope = 0
  for (let k = 1; k < pit.ringCount; k++) for (let i = 0; i < outline.length; i++) {
    const v = (k * outline.length + i) * 3, p = v - outline.length * 3
    expect(b[v + 2]).toBeLessThan(b[p + 2])
    maxSlope = Math.max(maxSlope, Math.hypot(b[v] - b[p], b[v + 1] - b[p + 1]) / (b[p + 2] - b[v + 2]))
  }
  expect(Math.atan(maxSlope) * 180 / Math.PI).toBeLessThan(45)
  current.wallGeometry.dispose(); current.closureGeometry.dispose(); pit.wallGeometry.dispose(); pit.closureGeometry.dispose()
})

it('builds steep fractured relief without folding a ring or reversing depth', () => {
  const pit = makePrivatePitGeometry(outline)
  const p = pit.wallGeometry.getAttribute('position').array
  const n = outline.length
  let maxSlope = 0
  let maxRingDepthSpread = 0
  let changedRadialProfiles = 0
  let coarseRadialJumps = 0
  let maxRadialJump = 0
  let previousRadial: number[] | null = null

  for (let k = 1; k < pit.ringCount; k++) {
    const ring: number[][] = []
    const depths: number[] = []
    const radial: number[] = []
    for (let i = 0; i < n; i++) {
      const v = (k * n + i) * 3, above = v - n * 3
      ring.push([p[v], p[v + 1]])
      depths.push(p[v + 2])
      radial.push(Math.hypot(p[v] - outline[i][0], p[v + 1] - outline[i][1]))
      expect(p[v + 2]).toBeLessThan(p[above + 2])
      maxSlope = Math.max(maxSlope, Math.hypot(p[v] - p[above], p[v + 1] - p[above + 1])
        / (p[above + 2] - p[v + 2]))
    }
    expect(signedArea(ring)).toBeGreaterThan(0)
    expect(findFold(ring), `ring ${k} folds`).toBeNull()

    // A repeated extrusion would keep each ring planar and reuse one displaced profile.
    // These are structural protections for fractured cliff faces, not aesthetic acceptance.
    maxRingDepthSpread = Math.max(maxRingDepthSpread, Math.max(...depths) - Math.min(...depths))
    if (previousRadial) {
      let radialChange = 0
      for (let i = 0; i < n; i++) {
        radialChange = Math.max(radialChange, Math.abs(radial[i] - previousRadial[i]))
      }
      if (radialChange > .0015) changedRadialProfiles += 1
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const jump = Math.abs(radial[i] - radial[j])
      if (jump > .003) coarseRadialJumps++
      maxRadialJump = Math.max(maxRadialJump, jump)
    }
    previousRadial = radial
  }

  expect(maxRingDepthSpread).toBeGreaterThan(.001)
  expect(changedRadialProfiles).toBeGreaterThan(pit.ringCount / 3)
  expect(coarseRadialJumps).toBeGreaterThan(pit.ringCount * 3)
  expect(maxRadialJump).toBeGreaterThan(.004)
  expect(maxRadialJump).toBeLessThan(.012)
  // The old 45-degree ceiling was only a visual scalar. The tighter 38-degree bound keeps
  // relief steep enough that it cannot read as a shelf or cone; 36.13 degrees is measured.
  expect(Math.atan(maxSlope) * 180 / Math.PI).toBeLessThan(38)
  pit.wallGeometry.dispose(); pit.closureGeometry.dispose()
})

it('carves widening and narrowing chambers with overhanging ledges (R4)', () => {
  const pit = makePrivatePitGeometry(outline)
  const p = pit.wallGeometry.getAttribute('position').array
  const n = outline.length
  // Radial displacement per ring, averaged around the contour: the chamber profile.
  const meanRadial: number[] = []
  for (let k = 0; k < pit.ringCount; k++) {
    let sum = 0
    for (let i = 0; i < n; i++) {
      const v = (k * n + i) * 3
      sum += Math.hypot(p[v] - outline[i][0], p[v + 1] - outline[i][1])
    }
    meanRadial.push(sum / n)
  }
  // The bore widens and narrows as it descends instead of flaring monotonically.
  let reversals = 0
  for (let k = 1; k < meanRadial.length - 1; k++) {
    const before = meanRadial[k] - meanRadial[k - 1]
    const after = meanRadial[k + 1] - meanRadial[k]
    if (Math.abs(before) > .006 && Math.abs(after) > .006
      && Math.sign(before) !== Math.sign(after)) reversals++
  }
  expect(reversals).toBeGreaterThanOrEqual(4)
  // Local bulges that overhang the ring below them: real undercuts, not a uniform wall.
  let overhangs = 0
  let maxLedgeDrop = 0
  for (let k = 1; k < meanRadial.length - 1; k++) {
    if (meanRadial[k] - meanRadial[k - 1] > .005 && meanRadial[k] - meanRadial[k + 1] > .008) {
      overhangs++
    }
  }
  for (let k = 1; k < meanRadial.length; k++) {
    maxLedgeDrop = Math.max(maxLedgeDrop, meanRadial[k - 1] - meanRadial[k])
  }
  expect(overhangs).toBeGreaterThanOrEqual(3)
  expect(maxLedgeDrop).toBeGreaterThan(.02)
  // 29 rings: (29-1)/(22-1) = +33% triangles over the previous build, locked deliberately.
  expect(pit.ringCount).toBe(29)
  pit.wallGeometry.dispose(); pit.closureGeometry.dispose()
})

it('keeps the raised lip open, deterministic and attached to the exact mouth', () => {
  const lip = makePrivatePitLipGeometry(outline)
  const p = lip.getAttribute('position')
  expect(p.count).toBe(outline.length * 3)
  expect(lip.index!.count).toBe(outline.length * 12)
  for (let i = 0; i < outline.length; i++) {
    expect(p.getX(i * 3)).toBeCloseTo(outline[i][0], 7)
    expect(p.getY(i * 3)).toBeCloseTo(outline[i][1], 7)
    expect(p.getZ(i * 3 + 1)).toBeGreaterThan(p.getZ(i * 3))
    expect(p.getZ(i * 3 + 1)).toBeLessThan(.003)
  }
  expect(Array.from(p.array).every(Number.isFinite)).toBe(true)
  lip.dispose()
})
