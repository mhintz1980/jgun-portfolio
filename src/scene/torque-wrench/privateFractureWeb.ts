import { BufferGeometry, Float32BufferAttribute } from 'three'
import { makePrivateCrackGeometry } from './privateElectricGeometry'

/** Ribbon half-widths per branch level (L0 seam, L1 primary, L2 secondary, L3 hairline). */
const HALF = [.00044, .00072, .00046, .00026]
const Z = .00045
const MARGIN = .0015
const VERTEX_BUDGET = 78000

interface Pt { x: number; y: number; arc: number }

/** Deterministic scalar hash; the only randomness source in this module. */
function hash(n: number): number {
  let t = (n + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function makeField(outline: number[][]) {
  const edges: number[][] = []
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i < outline.length; i += 1) {
    const a = outline[i], b = outline[(i + 1) % outline.length]
    minX = Math.min(minX, a[0]); minY = Math.min(minY, a[1])
    maxX = Math.max(maxX, a[0]); maxY = Math.max(maxY, a[1])
    if (Math.abs(a[0] - b[0]) > 1e-12 || Math.abs(a[1] - b[1]) > 1e-12) edges.push([a[0], a[1], b[0], b[1]])
  }
  const pip = (x: number, y: number): boolean => {
    if (x < minX || x > maxX || y < minY || y > maxY) return false
    let odd = false
    for (const e of edges) {
      if ((e[1] > y) !== (e[3] > y)) {
        const t = (y - e[1]) / (e[3] - e[1])
        if (x < e[0] + t * (e[2] - e[0])) odd = !odd
      }
    }
    return odd
  }
  const depth = (x: number, y: number): number => {
    let best = Infinity
    for (const e of edges) {
      const dx = e[2] - e[0], dy = e[3] - e[1]
      let t = ((x - e[0]) * dx + (y - e[1]) * dy) / (dx * dx + dy * dy)
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const px = e[0] + dx * t - x, py = e[1] + dy * t - y
      best = Math.min(best, px * px + py * py)
    }
    return Math.sqrt(best)
  }
  return { pip, depth, inside: (x: number, y: number, m: number) => pip(x, y) && depth(x, y) >= m }
}

/** Uniform grid over already-emitted crack samples; branches stop when they touch it. */
class Cells {
  private map = new Map<string, number[]>()
  private xs: number[] = []
  private ys: number[] = []
  add(x: number, y: number): void {
    const key = `${Math.floor(x / .002)},${Math.floor(y / .002)}`
    const bucket = this.map.get(key) ?? []
    bucket.push(this.xs.length); this.xs.push(x); this.ys.push(y); this.map.set(key, bucket)
  }
  hit(x: number, y: number, radius = .0011): boolean {
    const gx = Math.floor(x / .002), gy = Math.floor(y / .002), r2 = radius * radius
    for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) {
      for (const i of this.map.get(`${gx + dx},${gy + dy}`) ?? []) {
        const ddx = this.xs[i] - x, ddy = this.ys[i] - y
        if (ddx * ddx + ddy * ddy < r2) return true
      }
    }
    return false
  }
}

type Field = ReturnType<typeof makeField>
type Jitter = (s: number) => number

/** Walk a slightly curved, multi-octave jittered branch; stop at the polygon edge or another crack. */
function trace(
  sx: number, sy: number, a0: number, length: number, step: number,
  bend: number, jitter: Jitter, field: Field, cells: Cells, margin: number,
  minFreeRun = .010, hitRadius = .0013, passProb = 0, passKey = 1,
): Array<{ x: number; y: number }> {
  const out = [{ x: sx, y: sy }]
  let x = sx, y = sy
  const n = Math.max(1, Math.ceil(length / step))
  const ds = length / n
  for (let i = 1; i <= n; i += 1) {
    const s = i * ds
    const ang = a0 + bend * s + jitter(s) * Math.min(1, s / .0045)
    const nx = x + Math.cos(ang) * ds, ny = y + Math.sin(ang) * ds
    if (!field.inside(nx, ny, margin)) break
    // Forks and co-origin radials legitimately share their first few samples with a parent.
    if (s > minFreeRun && cells.hit(nx, ny, hitRadius) && hash(passKey + i * 31) >= passProb) break
    x = nx; y = ny; out.push({ x, y })
  }
  return out
}

/** arcLength grows inward from the contour; a child starts exactly at its parent's fork value. */
function assignArcs(raw: Array<{ x: number; y: number }>, startArc: number | null, arcAt: (x: number, y: number) => number): Pt[] {
  let m = startArc ?? arcAt(raw[0].x, raw[0].y)
  const pts: Pt[] = []
  for (const q of raw) {
    m = Math.max(m, arcAt(q.x, q.y))
    pts.push({ x: q.x, y: q.y, arc: Math.min(.99, m) })
  }
  return pts
}

/**
 * Subdivide straight Voronoi shard seams into multi-octave jagged fracture paths while
 * keeping endpoints and monotone arcLength intact. The physical crack mask still uses
 * the unmodified seam geometry in privateSheetRuntime.ts.
 */
function jitterSeamChain(chain: Pt[], chainIdx: number, field: Field): Pt[] {
  if (chain.length < 2) return chain
  const out: Pt[] = []
  let distAcc = 0
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i], b = chain[i + 1]
    const dx = b.x - a.x, dy = b.y - a.y, segLen = Math.hypot(dx, dy)
    if (segLen < 1e-9) continue
    const nx = -dy / segLen, ny = dx / segLen
    const steps = Math.max(1, Math.min(14, Math.ceil(segLen / .0032)))
    for (let s = 0; s < steps; s++) {
      const u = s / steps
      const bx = a.x + dx * u, by = a.y + dy * u
      const arc = a.arc + (b.arc - a.arc) * u
      const sCoord = distAcc + u * segLen
      // Envelope pins segment endpoints (u=0, u=1) so seam junctions remain connected.
      const env = Math.sin(Math.PI * u)
      const c1 = Math.floor(sCoord / .0095), f1 = (sCoord % .0095) / .0095
      const j1 = (hash(chainIdx * 911 + c1 * 37) - .5) * (1 - f1) + (hash(chainIdx * 911 + (c1 + 1) * 37) - .5) * f1
      const c2 = Math.floor(sCoord / .0034), f2 = (sCoord % .0034) / .0034
      const j2 = (hash(chainIdx * 353 + c2 * 73) - .5) * (1 - f2) + (hash(chainIdx * 353 + (c2 + 1) * 73) - .5) * f2
      const clearance = Math.min(.0016, Math.max(0, field.depth(bx, by) - .0016))
      const offset = env * clearance * (1.35 * j1 + .55 * j2)
      const jx = bx + nx * offset, jy = by + ny * offset
      if (s > 0 && field.pip(jx, jy)) out.push({ x: jx, y: jy, arc })
      else out.push({ x: bx, y: by, arc })
    }
    distAcc += segLen
  }
  out.push(chain[chain.length - 1])
  return out
}

/** One indexed ribbon strip per branch, z-offset above the sheet like the lightning trace. */
export function makePrivateFractureWebGeometry(source: BufferGeometry, outline: number[][]): BufferGeometry {
  const seam = makePrivateCrackGeometry(source, outline)
  const field = makeField(outline)
  const cells = new Cells()
  const branches: Array<{ level: number; pts: Pt[] }> = []
  let seed = 1
  const rnd = () => hash(seed++)
  const marginFor = (level: number) => MARGIN + HALF[level] + .0002

  // Level 0: shard seams, subdivided and multi-octave jittered so no ruler-straight Voronoi
  // chords cross the gearbox or clutch. Do not seed cells yet so Level-1 primaries can
  // propagate across the entire profile instead of stopping at their local Voronoi polygon.
  const sp = seam.getAttribute('position')
  const sa = seam.getAttribute('arcLength')
  const si = seam.getAttribute('crackId')
  let seamChainCount = 0
  if (sp) {
    let chain: Pt[] = []
    const flush = () => {
      if (chain.length > 1) {
        if (chain[chain.length - 1].arc < chain[0].arc) chain.reverse()
        let m = -1
        for (const q of chain) { m = Math.max(m, q.arc); q.arc = Math.min(.99, m) }
        const jittered = jitterSeamChain(chain, ++seamChainCount, field)
        let m2 = -1
        for (const q of jittered) { m2 = Math.max(m2, q.arc); q.arc = Math.min(.99, m2) }
        branches.push({ level: 0, pts: jittered })
      }
      chain = []
    }
    for (let i = 0; i + 1 < sp.count; i += 2) {
      const x = (sp.getX(i) + sp.getX(i + 1)) / 2, y = (sp.getY(i) + sp.getY(i + 1)) / 2
      let arc = sa ? (sa.getX(i) + sa.getX(i + 1)) / 2 : .5
      if (!Number.isFinite(arc)) arc = .5
      if (chain.length) {
        const last = chain[chain.length - 1]
        const broke = si ? si.getX(i) !== si.getX(i - 2) : false
        if (broke || Math.hypot(x - last.x, y - last.y) > .012) flush()
      }
      chain.push({ x, y, arc })
    }
    flush()
  }

  if (outline.length >= 3) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of outline) {
      minX = Math.min(minX, x); minY = Math.min(minY, y)
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
    }
    const diag = Math.hypot(maxX - minX, maxY - minY)
    // 3-4 well-separated impact hubs spanning gearbox, body/clutch and handle (R7/R8).
    let minDepth = Math.max(.020, diag * .115)
    let picked: Array<{ x: number; y: number }> = []
    for (let attempt = 0; attempt < 7 && picked.length < 3; attempt += 1, minDepth *= .68) {
      const cands: Array<{ x: number; y: number; d: number; i: number }> = []
      for (let gx = 1; gx < 38; gx += 1) for (let gy = 1; gy < 18; gy += 1) {
        const x = minX + (maxX - minX) * gx / 38, y = minY + (maxY - minY) * gy / 18
        const d = field.depth(x, y)
        if (field.pip(x, y) && d >= minDepth) cands.push({ x, y, d, i: cands.length })
      }
      cands.sort((a, b) => b.d - a.d || a.i - b.i)
      const local: Array<{ x: number; y: number }> = []
      for (const c of cands) {
        if (local.every((o) => Math.hypot(o.x - c.x, o.y - c.y) >= diag * .19)) local.push(c)
        if (local.length >= 4) break
      }
      if (local.length > picked.length) picked = local
    }
    if (!picked.length) picked = [{ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }]
    picked.length = Math.max(1, Math.min(picked.length, 4))
    let maxDepth = .02
    for (const o of picked) maxDepth = Math.max(maxDepth, field.depth(o.x, o.y))
    const arcAt = (x: number, y: number) => Math.min(.99, .025 + .95 * Math.min(1, field.depth(x, y) / maxDepth))
    const bendOf = () => {
      let b = (rnd() - .5) * 3.4
      if (Math.abs(b) < .35) b = b >= 0 ? .35 : -.35
      return b
    }
    const jitterOf = (scale: number): Jitter => {
      const key = Math.floor(rnd() * 100000)
      // Multi-scale electrical lightning kinks (R3): coarse elbows + crisp 2.8mm/1.2mm zig-zags.
      return (s: number) => scale * ((hash(key + Math.floor(s / .0075)) - .5) * .72
        + (hash(key + 499 + Math.floor(s / .0028)) - .5) * .64
        + (hash(key + 977 + Math.floor(s / .0012)) - .5) * .36)
    }

    // Level 1: radial primaries, emitted outer-end -> origin so arcLength rises toward the impact.
    // Defer cells.add until each hub's full radial fan is traced so sibling radials from the
    // same hub do not prematurely truncate one another near the hub origin.
    const radials: Pt[][] = []
    for (let hubIdx = 0; hubIdx < picked.length; hubIdx += 1) {
      const o = picked[hubIdx]
      const count = 7 + Math.floor(rnd() * 4)
      const base = rnd() * Math.PI * 2
      const hubBranches: Pt[][] = []
      for (let k = 0; k < count; k += 1) {
        const a0 = base + k * Math.PI * 2 / count + (rnd() - .5) * .22
        // Stagger radial start slightly around the hub core so 10 ribbons do not pile up on one pixel.
        const r0 = (k % 3) * .0022
        const ox = o.x + Math.cos(a0) * r0, oy = o.y + Math.sin(a0) * r0
        if (!field.inside(ox, oy, marginFor(1) + .001)) continue
        let reach = .01
        for (let s = .012; s <= .38; s += .004) {
          if (field.inside(ox + Math.cos(a0) * s, oy + Math.sin(a0) * s, marginFor(1) + .001)) reach = s
          else break
        }
        const raw = trace(
          ox, oy, a0, reach * (.84 + rnd() * .16), .0010,
          bendOf(), jitterOf(1.0), field, cells, marginFor(1),
          .014, .0015, 0, hubIdx * 1000 + k * 53,
        )
        if (raw.length < 3) continue
        raw.reverse()
        const pts = assignArcs(raw, null, arcAt)
        branches.push({ level: 1, pts })
        hubBranches.push(pts)
        radials.push(pts)
      }
      for (const pts of hubBranches) for (const q of pts) cells.add(q.x, q.y)
    }

    // Level 1: perimeter-inward primary lightning trunks (R3) launching from distributed points
    // around the contour (spindle, gearbox, clutch, body, handle) deep into the interior.
    const perimLaunchCount = 16
    const stepIdx = Math.max(1, Math.floor(outline.length / perimLaunchCount))
    for (let m = 0; m < perimLaunchCount; m += 1) {
      const idx = (m * stepIdx + Math.floor(rnd() * stepIdx)) % outline.length
      const prev = outline[(idx + outline.length - 1) % outline.length]
      const cur = outline[idx]
      const next = outline[(idx + 1) % outline.length]
      const dx = next[0] - prev[0], dy = next[1] - prev[1], len = Math.hypot(dx, dy) || 1
      const inx = -dy / len, iny = dx / len
      const launchDist = marginFor(1) + .0016
      const sx = cur[0] + inx * launchDist, sy = cur[1] + iny * launchDist
      if (!field.inside(sx, sy, marginFor(1))) continue
      const a0 = Math.atan2(iny, inx) + (rnd() - .5) * .45
      const maxLen = .048 + rnd() * .110
      const raw = trace(
        sx, sy, a0, maxLen, .0010,
        bendOf(), jitterOf(1.05), field, cells, marginFor(1),
        .012, .0015, 0, 7000 + m * 71,
      )
      if (raw.length < 4) continue
      const pts = assignArcs(raw, null, arcAt)
      branches.push({ level: 1, pts })
      for (const q of pts) cells.add(q.x, q.y)
      radials.push(pts)
    }

    // Level 1: wide, irregular angularly stepped linking arcs bridging between radials (R7/R8).
    for (const o of picked) {
      let r = .026 + rnd() * .008
      const rMax = Math.min(.16, maxDepth * 1.85)
      while (r < rMax) {
        const sectors = 5 + Math.floor(rnd() * 4)
        const a0 = rnd() * Math.PI * 2
        let run: Array<{ x: number; y: number }> = []
        const flushRun = () => {
          if (run.length >= 3) {
            const pts = assignArcs(run, null, arcAt)
            branches.push({ level: 1, pts })
            for (const q of pts) cells.add(q.x, q.y)
          }
          run = []
        }
        let prevTh = a0
        let prevR = r * (.84 + rnd() * .32)
        for (let s = 0; s < sectors; s += 1) {
          const nextTh = a0 + ((s + 1) / sectors) * Math.PI * 2 + (rnd() - .5) * .14
          const nextR = r * (.80 + rnd() * .42)
          if (rnd() < .52) {
            flushRun()
            prevTh = nextTh; prevR = nextR
            continue
          }
          const ax = o.x + Math.cos(prevTh) * prevR, ay = o.y + Math.sin(prevTh) * prevR
          const bx = o.x + Math.cos(nextTh) * nextR, by = o.y + Math.sin(nextTh) * nextR
          const chord = Math.hypot(bx - ax, by - ay)
          const subSteps = Math.max(2, Math.ceil(chord / .0022))
          const nx = -(by - ay) / (chord || 1), ny = (bx - ax) / (chord || 1)
          for (let j = 0; j <= subSteps; j += 1) {
            const u = j / subSteps
            const kink = Math.sin(Math.PI * u) * (rnd() - .5) * .0016
            const x = ax + (bx - ax) * u + nx * kink
            const y = ay + (by - ay) * u + ny * kink
            if (field.inside(x, y, marginFor(1))) run.push({ x, y })
            else flushRun()
          }
          flushRun()
          prevTh = nextTh; prevR = nextR
        }
        flushRun()
        r *= 1.68 + rnd() * .42
      }
    }

    // Level 2: secondary forks at 20-40 degrees, log-spaced along each radial, decaying length.
    const secondaries: Pt[][] = []
    for (const pts of radials) {
      if (pts.length < 5) continue
      const forks = 2 + Math.floor(rnd() * 3)
      for (let k = 0; k < forks; k += 1) {
        const f = .18 + .68 * ((k + .35 * rnd()) / forks)
        const idx = Math.min(pts.length - 2, Math.max(1, Math.round(f * (pts.length - 1))))
        const a = pts[idx - 1], b = pts[idx + 1], start = pts[idx]
        const dl = Math.hypot(b.x - a.x, b.y - a.y) || 1
        const base = Math.atan2((b.y - a.y) / dl, (b.x - a.x) / dl) + (rnd() < .5 ? -1 : 1) * (.34 + rnd() * .42)
        const raw = trace(
          start.x, start.y, base, .010 + rnd() * .026, .0009,
          bendOf(), jitterOf(1.1), field, cells, marginFor(2),
          .0045, .0013, 0, k * 131 + idx,
        )
        if (raw.length < 3) continue
        const pts2 = assignArcs(raw, start.arc, arcAt)
        branches.push({ level: 2, pts: pts2 })
        for (const q of pts2) cells.add(q.x, q.y)
        secondaries.push(pts2)
      }
    }

    // Level 3: tertiary hairlines, 3-8 mm, several per secondary.
    for (const pts of secondaries) {
      if (pts.length < 4) continue
      const count = 2 + Math.floor(rnd() * 2)
      for (let k = 0; k < count; k += 1) {
        const f = (k + 1) / (count + 1) + (rnd() - .5) * .08
        const idx = Math.min(pts.length - 2, Math.max(1, Math.round(f * (pts.length - 1))))
        const a = pts[idx - 1], b = pts[idx + 1], start = pts[idx]
        const dl = Math.hypot(b.x - a.x, b.y - a.y) || 1
        const base = Math.atan2((b.y - a.y) / dl, (b.x - a.x) / dl) + (rnd() < .5 ? -1 : 1) * (.38 + rnd() * .42)
        const raw = trace(
          start.x, start.y, base, .004 + rnd() * .009, .0008,
          bendOf(), jitterOf(1.0), field, cells, marginFor(3),
          .0030, .0011, 0, k * 97 + idx,
        )
        if (raw.length < 3) continue
        const pts3 = assignArcs(raw, start.arc, arcAt)
        branches.push({ level: 3, pts: pts3 })
        for (const q of pts3) cells.add(q.x, q.y)
      }
    }
  }
  seam.dispose()

  const positions: number[] = [], arcs: number[] = [], sides: number[] = [], normals: number[] = [], levels: number[] = [], halves: number[] = []
  const indices: number[] = []
  let vertices = 0
  const emit = (x: number, y: number, arc: number, nx: number, ny: number, level: number): number => {
    if (vertices + 2 > VERTEX_BUDGET) return -1
    const pair = vertices >> 1
    const half = HALF[level] * (.55 + .45 * hash(Math.floor(x * 80 + y * 61) + level * 719))
    for (const side of [-1, 1]) {
      positions.push(x + nx * half * side, y + ny * half * side, Z)
      arcs.push(arc); sides.push(side); normals.push(nx, ny); levels.push(level); halves.push(half)
    }
    vertices += 2
    return pair
  }
  for (const branch of branches) {
    const sub = Math.min(.0014, Math.max(.00065, HALF[branch.level] * 1.15))
    let prevPair = -1
    let lastNx = 0, lastNy = 0
    for (let i = 1; i < branch.pts.length; i += 1) {
      const a = branch.pts[i - 1], b = branch.pts[i]
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      if (len < 1e-9) continue
      const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len
      lastNx = nx; lastNy = ny
      const steps = Math.max(1, Math.ceil(len / sub))
      for (let j = 0; j < steps; j += 1) {
        const u = j / steps
        const arc = a.arc + (b.arc - a.arc) * u
        const pair = emit(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, arc, nx, ny, branch.level)
        if (pair < 0) { prevPair = -1; continue }
        if (prevPair >= 0) indices.push(prevPair * 2, prevPair * 2 + 1, pair * 2, prevPair * 2 + 1, pair * 2 + 1, pair * 2)
        prevPair = pair
      }
    }
    const last = branch.pts[branch.pts.length - 1]
    const pair = emit(last.x, last.y, last.arc, lastNx, lastNy, branch.level)
    if (pair >= 0 && prevPair >= 0) indices.push(prevPair * 2, prevPair * 2 + 1, pair * 2, prevPair * 2 + 1, pair * 2 + 1, pair * 2)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('arcLength', new Float32BufferAttribute(arcs, 1))
  geometry.setAttribute('ribbonSide', new Float32BufferAttribute(sides, 1))
  geometry.setAttribute('ribbonNormal', new Float32BufferAttribute(normals, 2))
  geometry.setAttribute('branchLevel', new Float32BufferAttribute(levels, 1))
  geometry.setAttribute('ribbonHalf', new Float32BufferAttribute(halves, 1))
  geometry.setIndex(indices)
  return geometry
}
