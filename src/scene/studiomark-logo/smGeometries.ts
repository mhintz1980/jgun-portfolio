import * as THREE from 'three'

/**
 * Procedural CAD & Architectural Monogram Geometries for StudioMark ("SM").
 * Pure functions (no React) so they can be unit-tested in Node.
 */

type Profile = ReadonlyArray<readonly [number, number]>
interface Frame {
  p: THREE.Vector3
  W: THREE.Vector3 // profile x axis (stroke width direction)
  D: THREE.Vector3 // profile y axis (depth direction)
  T: THREE.Vector3 // tangent
}

const Z = new THREE.Vector3(0, 0, 1)

/** Rectangle profile, optionally chamfered into an octagon (precision CNC bevel look). */
export function makeProfile(width: number, depth: number, chamfer = 0): Profile {
  const w = width / 2
  const d = depth / 2
  const c = Math.min(chamfer, w * 0.88, d * 0.88)
  if (c <= 0) {
    return [
      [w, d],
      [-w, d],
      [-w, -d],
      [w, -d],
    ]
  }
  return [
    [w - c, d],
    [-w + c, d],
    [-w, d - c],
    [-w, -d + c],
    [-w + c, -d],
    [w - c, -d],
    [w, -d + c],
    [w, d - c],
  ]
}

/** Diamond / Roof-Crest profile for high-contrast architectural ligatures (Concept 3). */
export function makeCrestProfile(width: number, depth: number, flatRim = 0.04): Profile {
  const w = width / 2
  const d = depth / 2
  const r = Math.min(flatRim, d * 0.45)
  // 6-sided double-pitched roof cross-section: sharp central ridge at x=0, flat side walls
  return [
    [0, d],
    [-w, r],
    [-w, -r],
    [0, -d],
    [w, -r],
    [w, r],
  ]
}

/** Sweep a convex profile along pre-computed frames into flat-sided, smooth-along-length geometry. */
export function sweepProfile(frames: Frame[], profile: Profile, caps: boolean): THREE.BufferGeometry {
  const E = profile.length
  const R = frames.length
  const pos: number[] = []
  const tmp = new THREE.Vector3()
  const corner = (f: Frame, k: number) =>
    tmp
      .copy(f.p)
      .addScaledVector(f.W, profile[k % E][0])
      .addScaledVector(f.D, profile[k % E][1])
  for (let i = 0; i < R; i++) {
    for (let k = 0; k < E; k++) {
      const a = corner(frames[i], k)
      pos.push(a.x, a.y, a.z)
      const b = corner(frames[i], k + 1)
      pos.push(b.x, b.y, b.z)
    }
  }
  const idx: number[] = []
  const vi = (i: number, k: number, s: number) => (i * E + k) * 2 + s
  for (let i = 0; i < R - 1; i++) {
    for (let k = 0; k < E; k++) {
      const a = vi(i, k, 0)
      const b = vi(i, k, 1)
      const c = vi(i + 1, k, 1)
      const d = vi(i + 1, k, 0)
      idx.push(a, b, c, a, c, d)
    }
  }
  const P = (n: number) => new THREE.Vector3(pos[n * 3], pos[n * 3 + 1], pos[n * 3 + 2])
  {
    const a = P(idx[0])
    const b = P(idx[1])
    const c = P(idx[2])
    const n = b.clone().sub(a).cross(c.clone().sub(a))
    const mid = a.clone().add(b).multiplyScalar(0.5).sub(frames[0].p)
    if (n.dot(mid) < 0) {
      for (let t = 0; t < idx.length; t += 3) {
        const tmpI = idx[t + 1]
        idx[t + 1] = idx[t + 2]
        idx[t + 2] = tmpI
      }
    }
  }
  if (caps) {
    for (const [ring, sign] of [
      [0, -1],
      [R - 1, 1],
    ] as const) {
      const base = pos.length / 3
      const c = frames[ring].p
      pos.push(c.x, c.y, c.z)
      for (let k = 0; k < E; k++) {
        const a = corner(frames[ring], k)
        pos.push(a.x, a.y, a.z)
      }
      for (let k = 0; k < E; k++) {
        const i0 = base
        const i1 = base + 1 + k
        const i2 = base + 1 + ((k + 1) % E)
        const n = P(i1)
          .sub(P(i0))
          .cross(P(i2).sub(P(i0)))
        if (n.dot(frames[ring].T) * sign < 0) idx.push(i0, i2, i1)
        else idx.push(i0, i1, i2)
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * Helper to extrude a polygon with crisp bevels and center on Z.
 */
function extrudePolygon(
  points: ReadonlyArray<readonly [number, number]>,
  depth: number,
  bevelSize = 0.035,
  bevelSegments = 3,
): THREE.BufferGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevelSize > 0,
    bevelSegments,
    bevelSize,
    bevelThickness: bevelSize,
    steps: 1,
  })
  g.translate(0, 0, -depth / 2)
  g.computeVertexNormals()
  return g
}

/** Centreline of the fluid "S" glyph (~1.15 wide, 1.84 tall, centred). */
export function buildSCurve(scaleX = 1.0, scaleY = 1.0): THREE.CatmullRomCurve3 {
  const pts = [
    [0.52, 0.56],
    [0.38, 0.86],
    [0.0, 0.94],
    [-0.42, 0.82],
    [-0.56, 0.48],
    [-0.38, 0.15],
    [0.0, 0.0],
    [0.38, -0.15],
    [0.56, -0.48],
    [0.42, -0.82],
    [0.0, -0.94],
    [-0.38, -0.86],
    [-0.52, -0.56],
  ].map(([x, y]) => new THREE.Vector3(x * scaleX, y * scaleY, 0))
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal')
}

export interface SStrokeOptions {
  width?: number
  depth?: number
  chamfer?: number
  crest?: boolean
  scaleX?: number
  scaleY?: number
  /** z displacement as a function of curve parameter u in [0..1] or y */
  weave?: (y: number, u: number) => number
  segments?: number
}

export function buildSStrokeGeometry(o: SStrokeOptions = {}): THREE.BufferGeometry {
  const {
    width = 0.28,
    depth = 0.26,
    chamfer = 0.05,
    crest = false,
    scaleX = 1.0,
    scaleY = 1.0,
    weave,
    segments = 180,
  } = o
  const curve = buildSCurve(scaleX, scaleY)
  const frames: Frame[] = []
  for (let i = 0; i <= segments; i++) {
    const u = i / segments
    const p = curve.getPointAt(u)
    const T = curve.getTangentAt(u).normalize()
    const W = new THREE.Vector3().crossVectors(T, Z).normalize()
    if (weave) p.z = weave(p.y, u)
    frames.push({ p, W, D: Z.clone(), T })
  }
  const prof = crest ? makeCrestProfile(width, depth) : makeProfile(width, depth, chamfer)
  return sweepProfile(frames, prof, true)
}

/** Round tube along the S centreline (warm neon filament). */
export function buildSNeonGeometry(radius = 0.038, weave?: (y: number, u: number) => number): THREE.BufferGeometry {
  const baseCurve = buildSCurve()
  if (!weave) {
    return new THREE.TubeGeometry(baseCurve, 200, radius, 12, false)
  }
  const pts: THREE.Vector3[] = []
  const N = 120
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const p = baseCurve.getPointAt(u)
    p.z = weave(p.y, u)
    pts.push(p)
  }
  const wovenCurve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  return new THREE.TubeGeometry(wovenCurve, 200, radius, 12, false)
}

/**
 * CONCEPT 1: "The Continuous Mobius Ribbon"
 * 1) Outer twisted circular Mobius crystal ring framing the monogram.
 * 2) Inner sculpted SM ligature where the upper S-curve flows directly into the lower M chevron.
 */
export function buildMobiusGeometry(opts: { radius?: number; width?: number; depth?: number; segments?: number } = {}) {
  const { radius = 1.24, width = 0.26, depth = 0.11, segments = 320 } = opts
  const point = (th: number) =>
    new THREE.Vector3(
      Math.cos(th) * (radius + 0.04 * Math.cos(2 * th)),
      Math.sin(th) * (radius + 0.04 * Math.cos(2 * th)),
      0.18 * Math.sin(2 * th),
    )
  const frames: Frame[] = []
  for (let i = 0; i <= segments; i++) {
    const th = (i / segments) * Math.PI * 2
    const p = point(th)
    const T = point(th + 1e-3)
      .sub(point(th - 1e-3))
      .normalize()
    const R = new THREE.Vector3().crossVectors(T, Z).normalize()
    const a = th * 1.5 // 3 half-twists around the ring for optical crystal facets
    const W = Z.clone().multiplyScalar(Math.cos(a)).addScaledVector(R, Math.sin(a)).normalize()
    const D = new THREE.Vector3().crossVectors(T, W).normalize()
    frames.push({ p, W, D, T })
  }
  return sweepProfile(frames, makeProfile(width, depth, 0.025), false)
}

/**
 * Inner flowing "SM" sculptural ligature inside the Mobius ring (Concept 1).
 * The upper S curve sweeps across and descends seamlessly into the right leg of the M,
 * while the left M pillar and V-chevron nestle underneath the S belly.
 */
export function buildMobiusInnerSMGeometry(): THREE.BufferGeometry {
  // Continuous S-curve that flows into the right M stem
  const sCurvePts = [
    [0.48, 0.62, 0.04],
    [0.25, 0.9, 0.06],
    [-0.18, 0.92, 0.04],
    [-0.52, 0.72, 0.0],
    [-0.54, 0.38, -0.04],
    [-0.18, 0.16, 0.0],
    [0.32, 0.02, 0.06],
    [0.58, -0.28, 0.05],
    [0.58, -0.82, 0.0],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z))

  const sCurve = new THREE.CatmullRomCurve3(sCurvePts, false, 'centripetal')
  const framesS: Frame[] = []
  const segs = 140
  for (let i = 0; i <= segs; i++) {
    const u = i / segs
    const p = sCurve.getPointAt(u)
    const T = sCurve.getTangentAt(u).normalize()
    const W = new THREE.Vector3().crossVectors(T, Z).normalize()
    framesS.push({ p, W, D: Z.clone(), T })
  }
  return sweepProfile(framesS, makeProfile(0.24, 0.24, 0.06), true)
}

export function buildMobiusInnerMBaseGeometry(): THREE.BufferGeometry {
  // Left pillar + central V-chevron of the M under the S curve
  const mPts: [number, number][] = [
    [-0.68, -0.82],
    [-0.44, -0.82],
    [-0.44, -0.22],
    [-0.04, -0.78],
    [0.1, -0.78],
    [0.46, -0.2],
    [0.32, -0.02],
    [0.03, -0.46],
    [-0.44, 0.14],
    [-0.68, 0.14],
  ]
  return extrudePolygon(mPts, 0.2, 0.04, 3)
}

/**
 * CONCEPT 2: "The Interlocking Isometric CAD Hex"
 * True 3-block isometric hexagonal cube emblem:
 * - Upper-left machined titanium block: Isometric angular "S" ribbon
 * - Lower-right machined block: Isometric "M" twin-pillar chevron with smoky crystal core
 * - Lower-left machined titanium wedge completing the hexagonal silhouette
 */
export function buildHexPlateGeometry(): THREE.BufferGeometry {
  // Isometric S block (upper-left & top crown of the hexagon)
  const R = 1.32
  const C = R * Math.cos(Math.PI / 6) // ~1.143
  const S = R * Math.sin(Math.PI / 6) // ~0.66

  // Angular isometric S-path polygon occupying the top & upper-left hex faces
  const isoSPts: [number, number][] = [
    [0.0, R], // Top hex vertex
    [C * 0.68, R - S * 0.68], // Upper right stop
    [C * 0.48, R - S * 0.68 - 0.22], // Step inward
    [0.0, R - 0.3], // Inner top peak
    [-C + 0.26, S - 0.15], // Inner upper-left corner
    [-C + 0.26, S - 0.38], // Short vertical drop inside S
    [0.02, 0.24], // Middle S spine peak
    [C * 0.52, -0.05], // Middle S right elbow
    [0.02, -0.34], // Lower S spine valley
    [-C, 0.24], // Outer left middle step
    [-C, S], // Top-left hex vertex
  ]
  return extrudePolygon(isoSPts, 0.36, 0.045, 2)
}

export function buildHexRimGeometry(): THREE.BufferGeometry {
  // Lower-left isometric wedge block + M outer metallic frame
  const R = 1.32
  const C = R * Math.cos(Math.PI / 6) // ~1.143
  const S = R * Math.sin(Math.PI / 6) // ~0.66

  // Lower-left chamfered wedge completing the left hex facet
  const wedgeShape = new THREE.Shape(
    [
      [-C, 0.04],
      [-0.22, -0.41],
      [-0.22, -0.68],
      [-C + 0.28, -0.39],
      [-C + 0.28, -0.62],
      [-0.22, -0.91],
      [-0.22, -1.19],
      [-C, -S],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
  )

  // Right & Bottom isometric "M" structural frame
  const mFrameShape = new THREE.Shape(
    [
      [-0.06, -1.24], // Left M foot bottom
      [0.2, -1.09], // Left M inner foot
      [0.2, -0.36], // Left M inner apex
      [0.54, -0.76], // M center valley bottom
      [0.88, -0.02], // Right M inner apex
      [0.88, -0.7], // Right M inner leg
      [C, -S], // Right M outer foot (bottom-right hex vertex)
      [C, S], // Top-right hex vertex
      [C * 0.76, R - S * 0.76], // Upper-right bevel cap
      [0.54, -0.32], // M center valley top
      [0.02, 0.04], // Left M top shoulder
      [-0.06, -0.01],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
  )

  const g = new THREE.ExtrudeGeometry([wedgeShape, mFrameShape], {
    depth: 0.38,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    steps: 1,
  })
  g.translate(0, 0, -0.19)
  g.computeVertexNormals()
  return g
}

/** Recessed smoky crystal inlay inside the isometric M block (Concept 2). */
export function buildHexInlayGeometry(): THREE.BufferGeometry {
  const R = 1.32
  const C = R * Math.cos(Math.PI / 6)
  const S = R * Math.sin(Math.PI / 6)

  const mCorePts: [number, number][] = [
    [0.01, -1.14],
    [0.14, -1.06],
    [0.14, -0.22],
    [0.54, -0.68],
    [0.94, 0.14],
    [0.94, -0.64],
    [C - 0.06, -S + 0.04],
    [C - 0.06, S - 0.05],
    [0.54, -0.42],
    [0.01, -0.06],
  ]
  return extrudePolygon(mCorePts, 0.42, 0.02, 2)
}

/**
 * CONCEPT 3 & 4: Architectural "M" with sharp central ridge or deep bezel channel.
 * Centered at [0, 0, 0], width ~1.76, height ~1.84.
 */
export function buildMPoints(halfWidth = 0.88, halfHeight = 0.92, stem = 0.28): [number, number][] {
  const hw = halfWidth
  const h = halfHeight
  const inner = hw - stem
  return [
    [-hw, -h],
    [-inner, -h],
    [-inner, 0.38],
    [-0.05, -0.58],
    [0.05, -0.58],
    [inner, 0.38],
    [inner, -h],
    [hw, -h],
    [hw, h],
    [hw - 0.3, h],
    [0, -0.14],
    [-hw + 0.3, h],
    [-hw, h],
  ]
}

export function buildMGeometry(o: { scale?: number; depth?: number; bevel?: number } = {}): THREE.BufferGeometry {
  const { scale = 1, depth = 0.28, bevel = 0.045 } = o
  const pts = buildMPoints()
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel,
    steps: 1,
  })
  g.translate(0, 0, -depth / 2)
  g.scale(scale, scale, 1)
  g.computeVertexNormals()
  return g
}

/**
 * Glowing internal neon filament along the M pillars & chevron (Concept 4: Kinetic Chevron).
 */
export function buildMNeonGeometry(radius = 0.032): THREE.BufferGeometry {
  const hw = 0.74
  const h = 0.78
  const pts = [
    new THREE.Vector3(-hw, -h, 0),
    new THREE.Vector3(-hw, h * 0.92, 0),
    new THREE.Vector3(0, -0.36, 0),
    new THREE.Vector3(hw, h * 0.92, 0),
    new THREE.Vector3(hw, -h, 0),
  ]
  const path = new THREE.CurvePath<THREE.Vector3>()
  for (let i = 0; i < pts.length - 1; i++) {
    path.add(new THREE.LineCurve3(pts[i], pts[i + 1]))
  }
  return new THREE.TubeGeometry(path, 120, radius, 10, false)
}

/**
 * CONCEPT 5 (NEW): "SM Planetary Gear Crown" ('sm-planetary-crown')
 * Inspired directly by Mark's JGun planetary torque multiplier CAD:
 * A precision external/internal splined planetary ring gear housing with an integral
 * machined "S-M" sun/carrier bridge suspended inside the bore.
 */
export function buildPlanetaryCrownRingGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const teeth = 24
  const outerRoot = 1.22
  const outerTip = 1.34
  const step = (Math.PI * 2) / teeth

  for (let i = 0; i < teeth; i++) {
    const a0 = i * step
    const a1 = a0 + step * 0.22
    const a2 = a0 + step * 0.5
    const a3 = a0 + step * 0.72
    const p0: [number, number] = [outerRoot * Math.cos(a0), outerRoot * Math.sin(a0)]
    const p1: [number, number] = [outerTip * Math.cos(a1), outerTip * Math.sin(a1)]
    const p2: [number, number] = [outerTip * Math.cos(a2), outerTip * Math.sin(a2)]
    const p3: [number, number] = [outerRoot * Math.cos(a3), outerRoot * Math.sin(a3)]
    if (i === 0) shape.moveTo(p0[0], p0[1])
    else shape.lineTo(p0[0], p0[1])
    shape.lineTo(p1[0], p1[1])
    shape.lineTo(p2[0], p2[1])
    shape.lineTo(p3[0], p3[1])
  }
  shape.closePath()

  const bore = new THREE.Path()
  bore.absarc(0, 0, 1.02, 0, Math.PI * 2, true)
  shape.holes.push(bore)

  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.36,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.035,
    bevelThickness: 0.04,
  })
  g.translate(0, 0, -0.18)
  g.computeVertexNormals()
  return g
}

/**
 * CONCEPT 6 (NEW): "SM Architectural Prism Monolith" ('sm-prism-monolith')
 * A bold, brutalist dual-axis boolean block where the front silhouette is a crisp
 * architectural "M" and its horizontal cross-bars carve an optical "S" void through
 * the center — like an Awwwards luxury engineering studio mark.
 */
export function buildPrismMonolithGeometry(): THREE.BufferGeometry {
  // Architectural M outer block with precision stepped S-cutout channels
  const mPts = buildMPoints(0.92, 0.94, 0.3)
  return extrudePolygon(mPts, 0.44, 0.05, 3)
}
