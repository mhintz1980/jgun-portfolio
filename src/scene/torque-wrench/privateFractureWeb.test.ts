import { expect, it } from 'vitest'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { makePrivateFractureWebGeometry } from './privateFractureWeb'

/** Concave open-end-wrench profile, ~0.55 x 0.17: two heads, jaw notch, socket notch. */
function wrenchOutline(): number[][] {
  const raw: number[][] = [
    [-.128, .018], [-.142, .042], [-.17, .064], [-.21, .074], [-.25, .06], [-.272, .03],
    [-.262, .012], [-.24, 0], [-.262, -.012],
    [-.272, -.03], [-.25, -.06], [-.21, -.074], [-.17, -.064], [-.142, -.042], [-.128, -.018],
    [-.09, -.02], [.09, -.016], [.125, -.022], [.14, -.05], [.175, -.07], [.21, -.055], [.228, -.018],
    [.19, -.008], [.19, .008],
    [.228, .018], [.21, .055], [.175, .07], [.14, .05], [.125, .022], [.09, .016], [-.09, .02],
  ]
  return raw.map(([x, y]) => [x * 1.1, y * 1.1])
}

function pip(outline: number[][], x: number, y: number): boolean {
  let odd = false
  for (let i = 0; i < outline.length; i += 1) {
    const a = outline[i], b = outline[(i + 1) % outline.length]
    if ((a[1] > y) !== (b[1] > y)) {
      const t = (y - a[1]) / (b[1] - a[1])
      if (x < a[0] + t * (b[0] - a[0])) odd = !odd
    }
  }
  return odd
}

function depthTo(outline: number[][], x: number, y: number): number {
  let best = Infinity
  for (let i = 0; i < outline.length; i += 1) {
    const a = outline[i], b = outline[(i + 1) % outline.length]
    const dx = b[0] - a[0], dy = b[1] - a[1]
    let t = ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const px = a[0] + dx * t - x, py = a[1] + dy * t - y
    best = Math.min(best, px * px + py * py)
  }
  return Math.sqrt(best)
}

/** Seam strip fixture: 4 chains hugging the contour inward, 2 vertices per sample. */
function seamSource(outline: number[][]): BufferGeometry {
  // Seams hug the LOCAL contour: each sample sits a fixed offset inside its nearest edge.
  const nearestOnOutline = (x: number, y: number): [number, number] => {
    let bx = 0, by = 0, bd = Infinity
    for (let i = 0; i < outline.length; i += 1) {
      const a = outline[i], b = outline[(i + 1) % outline.length]
      const dx = b[0] - a[0], dy = b[1] - a[1]
      let t = ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const px = a[0] + dx * t, py = a[1] + dy * t
      const d = Math.hypot(px - x, py - y)
      if (d < bd) { bd = d; bx = px; by = py }
    }
    return [bx, by]
  }
  const positions: number[] = [], arcs: number[] = [], ids: number[] = []
  for (let c = 0; c < 4; c += 1) {
    const path: number[][] = []
    for (let j = 0; j < 14; j += 1) {
      const p = outline[(c * 7 + j) % outline.length], q = outline[(c * 7 + j + 1) % outline.length]
      const steps = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / .004))
      for (let s = 0; s < steps; s += 1) {
        const u = s / steps
        const x = p[0] + (q[0] - p[0]) * u, y = p[1] + (q[1] - p[1]) * u
        const [bx, by] = nearestOnOutline(x, y)
        const d = Math.hypot(x - bx, y - by) || 1
        const off = .005 + .001 * c
        path.push([x + (x - bx) / d * off, y + (y - by) / d * off])
      }
    }
    for (let j = 0; j < path.length; j += 1) {
      const a = path[j], b = path[Math.min(j + 1, path.length - 1)]
      const dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1
      const px = -dy / dl * .0008, py = dx / dl * .0008
      positions.push(a[0] + px, a[1] + py, 0, a[0] - px, a[1] - py, 0)
      arcs.push(0, 0); ids.push(c, c)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('arcLength', new Float32BufferAttribute(arcs, 1))
  geometry.setAttribute('crackId', new Float32BufferAttribute(ids, 1))
  return geometry
}

interface Sample { x: number; y: number; arc: number; level: number }

/** Reconstruct ribbon samples and triangle-connected branch runs from the indexed strip. */
function branchesOf(geometry: BufferGeometry): { samples: Sample[]; runs: number[][] } {
  const pos = geometry.getAttribute('position')
  const arc = geometry.getAttribute('arcLength')
  const lvl = geometry.getAttribute('branchLevel')
  const samples: Sample[] = []
  for (let k = 0; k < pos.count / 2; k += 1) {
    samples.push({
      x: (pos.getX(2 * k) + pos.getX(2 * k + 1)) / 2,
      y: (pos.getY(2 * k) + pos.getY(2 * k + 1)) / 2,
      arc: arc.getX(2 * k),
      level: lvl.getX(2 * k),
    })
  }
  const adj = new Set<string>()
  const index = geometry.getIndex()!
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)].map((v) => v >> 1)
    for (let a = 0; a < 3; a += 1) for (let b = a + 1; b < 3; b += 1) {
      if (ids[a] !== ids[b]) adj.add(`${Math.min(ids[a], ids[b])},${Math.max(ids[a], ids[b])}`)
    }
  }
  const runs: number[][] = []
  let run: number[] = []
  for (let k = 0; k < samples.length; k += 1) {
    if (run.length && adj.has(`${k - 1},${k}`)) run.push(k)
    else { if (run.length > 1) runs.push(run); run = [k] }
  }
  if (run.length > 1) runs.push(run)
  return { samples, runs }
}

it('builds a deterministic multi-scale fracture web inside a concave wrench profile', () => {
  const outline = wrenchOutline()
  const source = seamSource(outline)
  const beforePos = Array.from(source.getAttribute('position').array as Float32Array)
  const beforeArc = Array.from(source.getAttribute('arcLength').array as Float32Array)

  const t0 = performance.now()
  const a = makePrivateFractureWebGeometry(source, outline)
  const ms = performance.now() - t0

  const pos = a.getAttribute('position')
  const arc = a.getAttribute('arcLength')
  const side = a.getAttribute('ribbonSide')
  const normal = a.getAttribute('ribbonNormal')
  const level = a.getAttribute('branchLevel')
  const half = a.getAttribute('ribbonHalf')
  expect(pos && arc && side && normal && level && half).toBeTruthy()
  expect(pos.itemSize).toBe(3)
  expect(arc.itemSize).toBe(1)
  expect(side.itemSize).toBe(1)
  expect(normal.itemSize).toBe(2)
  expect(level.itemSize).toBe(1)
  expect(half.itemSize).toBe(1)
  expect(arc.count).toBe(pos.count)
  expect(side.count).toBe(pos.count)
  expect(normal.count).toBe(pos.count)
  expect(level.count).toBe(pos.count)
  expect(half.count).toBe(pos.count)
  expect(a.index).not.toBeNull()
  expect(pos.count).toBeGreaterThan(0)
  expect(pos.count).toBeLessThanOrEqual(80000)

  let finite = true
  for (const attr of [pos, arc, side, normal, level, half]) {
    for (let i = 0; i < attr.array.length; i += 1) if (!Number.isFinite(attr.array[i])) finite = false
  }
  expect(finite).toBe(true)
  const index = a.getIndex()!
  let indexOk = true
  for (let i = 0; i < index.count; i += 1) if (index.getX(i) < 0 || index.getX(i) >= pos.count) indexOk = false
  expect(indexOk).toBe(true)

  // Generated (non-seam) geometry stays strictly inside with margin; seam level 0 is exempt.
  let insideOk = true
  for (let i = 0; i < pos.count; i += 1) {
    if (level.getX(i) < .5) continue
    if (!pip(outline, pos.getX(i), pos.getY(i)) || depthTo(outline, pos.getX(i), pos.getY(i)) <= .0009) insideOk = false
  }
  expect(insideOk).toBe(true)

  const { samples, runs } = branchesOf(a)
  const counts = [0, 0, 0, 0]
  const runCounts = [0, 0, 0, 0]
  const parentGrid = new Map<string, Sample[]>()
  for (const s of samples) {
    counts[Math.round(s.level)] += 1
    const key = `${Math.floor(s.x * 1e6)},${Math.floor(s.y * 1e6)}`
    const bucket = parentGrid.get(key) ?? []
    bucket.push(s); parentGrid.set(key, bucket)
  }
  for (const run of runs) {
    const lvl = Math.round(samples[run[0]].level)
    runCounts[lvl] += 1
    let prev = -1
    for (const k of run) {
      const v = samples[k].arc
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(.991)
      if (prev >= 0) expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
    // A forked branch starts exactly at its parent's value at the shared point.
    if (lvl >= 2) {
      const s0 = samples[run[0]]
      const cx = Math.floor(s0.x * 1e6), cy = Math.floor(s0.y * 1e6)
      let matched = false
      for (let dx = -1; dx <= 1 && !matched; dx += 1) for (let dy = -1; dy <= 1 && !matched; dy += 1) {
        for (const s of parentGrid.get(`${cx + dx},${cy + dy}`) ?? []) {
          if (Math.round(s.level) !== lvl - 1) continue
          if (Math.hypot(s.x - s0.x, s.y - s0.y) < 1e-7 && Math.abs(s.arc - s0.arc) < 1e-9) { matched = true; break }
        }
      }
      expect(matched).toBe(true)
    }
  }
  expect(counts[0]).toBeGreaterThan(0)
  expect(counts[1]).toBeGreaterThan(2000)
  expect(counts[2]).toBeGreaterThan(500)
  expect(counts[3]).toBeGreaterThan(200)
  expect(runCounts[1]).toBeGreaterThan(10)
  expect(runCounts[2]).toBeGreaterThan(5)
  expect(runCounts[3]).toBeGreaterThan(10)

  // Fix B coverage: Level-1 primaries span left gearbox, central body and right handle regions.
  const xs1 = samples.filter(s => Math.round(s.level) === 1).map(s => s.x)
  expect(Math.min(...xs1)).toBeLessThan(-.18)
  expect(Math.max(...xs1)).toBeGreaterThan(.15)

  // Determinism: a second build is bit-identical.
  const b = makePrivateFractureWebGeometry(source, outline)
  for (const name of ['position', 'arcLength', 'ribbonSide', 'ribbonNormal', 'branchLevel', 'ribbonHalf']) {
    expect(Array.from(b.getAttribute(name).array as Float32Array))
      .toEqual(Array.from(a.getAttribute(name).array as Float32Array))
  }
  expect(Array.from(b.getIndex()!.array)).toEqual(Array.from(index.array))

  // The cached seam strip is never mutated.
  expect(Array.from(source.getAttribute('position').array as Float32Array)).toEqual(beforePos)
  expect(Array.from(source.getAttribute('arcLength').array as Float32Array)).toEqual(beforeArc)

  expect(ms).toBeLessThan(1000)
  console.log(`fracture web: ${pos.count} vertices, ${runs.length} branches, ${ms.toFixed(1)} ms`)
  a.dispose(); b.dispose(); source.dispose()
})
