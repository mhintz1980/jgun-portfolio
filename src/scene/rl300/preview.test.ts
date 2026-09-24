import { describe, expect, it } from 'vitest'
import { BoxGeometry, CatmullRomCurve3, Float32BufferAttribute, Mesh, MeshStandardMaterial, Plane, Raycaster, Vector3 } from 'three'
import { bakeGeometry, finishFor, FINISHED_CUT, isClosedVolume, PART_POLICY, policyFor, SECTION_ROOTS } from './prepareModel'
import { CLOSED_CUT, DEEPEST_CUT, evaluateShot, MODEL_BOUNDS, SHOTS } from './shot'
import { createLowerIntake } from './LowerIntake'
import { createStencilMaterials } from './SectionCaps'
import { airPaths, AIR_SAMPLES } from './AirRibbons'
import { AIRWAY_BOUNDS, AIRWAY_SECTION, evaluateFlow, insideAirwaySection, RIBBON_COUNT, ribbonSplit, SPINES } from './flow'

describe('RL300 review prototype', () => {
  // Point-to-segment distance on the (y, z) plane, shared by the owner-ruled path tests.
  const pointToSegment = (y: number, z: number, a: readonly [number, number], b: readonly [number, number]) => {
    const dy = b[0] - a[0], dz = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((y - a[0]) * dy + (z - a[1]) * dz) / (dy * dy + dz * dz)))
    return Math.hypot(y - (a[0] + t * dy), z - (a[1] + t * dz))
  }
  it('moves both stencil counters with the live plane after material cloning', () => {
    const plane = new Plane(new Vector3(-1, 0, 0), .85)
    const pair = createStencilMaterials(plane)
    plane.constant = -.15
    expect(pair.back.clippingPlanes![0].distanceToPoint(new Vector3(0, 0, 0))).toBe(-.15)
    expect(pair.front.clippingPlanes![0].distanceToPoint(new Vector3(0, 0, 0))).toBe(-.15)
    pair.back.dispose(); pair.front.dispose()
  })
  it('returns the same finite shot in either direction and clamps invalid input', () => {
    const forward = Array.from({ length: 101 }, (_, i) => evaluateShot(i / 100, false))
    const reverse = Array.from({ length: 101 }, (_, i) => evaluateShot(1 - i / 100, false)).reverse()
    forward.forEach((shot, i) => { expect(shot.plane).toBeCloseTo(reverse[i].plane, 10); expect(shot.position.every(Number.isFinite)).toBe(true) })
    expect(evaluateShot(NaN, true).u).toBe(0)
    // The sequence opens the section and closes it again, so both ends are the closed shell.
    expect(evaluateShot(-1, false).cut).toBe(0)
    expect(evaluateShot(2, false).cut).toBe(0)
    expect(evaluateShot(2, false).plane).toBe(CLOSED_CUT)
  })
  it('walks the seven authored shots in order without a gap or an overlap', () => {
    expect(SHOTS).toHaveLength(7)
    expect(SHOTS[0].from).toBe(0)
    expect(SHOTS[SHOTS.length - 1].to).toBe(1)
    SHOTS.forEach((shot, i) => {
      expect(shot.to).toBeGreaterThan(shot.from)
      if (i) expect(shot.from).toBe(SHOTS[i - 1].to)
      // Each shot owns the beat at its own start, and the midpoint of its own window.
      expect(evaluateShot(shot.from, false).beat).toBe(i)
      expect(evaluateShot((shot.from + shot.to) / 2, false).beat).toBe(i)
    })
    expect(evaluateShot(1, false).beat).toBe(6)
  })
  it('cuts no deeper than the plane prepareModel deleted geometry against', () => {
    const planes = Array.from({ length: 1001 }, (_, i) => evaluateShot(i / 1000, false).plane)
    expect(Math.min(...planes)).toBeCloseTo(DEEPEST_CUT, 10)
    expect(Math.max(...planes)).toBeCloseTo(CLOSED_CUT, 10)
    expect(FINISHED_CUT).toBe(DEEPEST_CUT)
    // The deepest cut must actually be reached, or ruled `hide` parts survive the sequence.
    expect(planes.some(p => Math.abs(p - DEEPEST_CUT) < 1e-9)).toBe(true)
  })
  it('keeps the camera outside the model envelope and on the side the cut opens', () => {
    for (let i = 0; i <= 1000; i++) {
      for (const portrait of [false, true]) {
        const shot = evaluateShot(i / 1000, portrait)
        // The clip keeps x <= plane.constant, so an eye at x <= the model's own +x face
        // would sit inside the opened shell and read as a camera punch-through.
        expect(shot.position[0]).toBeGreaterThan(MODEL_BOUNDS.max[0])
        expect(shot.position[1]).toBeGreaterThan(-.22) // never below the ground plane
        expect(shot.fov).toBeGreaterThanOrEqual(28)
        expect(shot.fov).toBeLessThanOrEqual(45)
      }
    }
  })
  it('frames portrait from further out than landscape at the same progress', () => {
    for (const u of [0, .2, .51, .76, 1]) {
      const wide = evaluateShot(u, false), tall = evaluateShot(u, true)
      const span = (s: ReturnType<typeof evaluateShot>) =>
        Math.hypot(...s.position.map((v, i) => v - s.target[i]))
      expect(span(tall)).toBeGreaterThan(span(wide))
      expect(tall.target).toEqual(wide.target)
      expect(tall.plane).toBe(wide.plane)
    }
  })
  it('repaints shell roles but preserves equipment and hardware identity', () => {
    expect(finishFor('COMPOSITE_PANELS', 'MSP_YELLOW_PAINT')).toBe('#193f66')
    expect(finishFor('PUMP_HOUSING', 'MSP_YELLOW_PAINT')).toBeNull()
    expect(finishFor('ENCLOSURE_CHASSIS', 'MSP_STAINLESS')).toBeNull()
    // A kept component stays equipment: the shell repaint is what buried it.
    expect(finishFor('COMPOSITE_PANELS', 'MSP_YELLOW_PAINT', 'keep')).toBeNull()
  })
  it('keeps the machine roots whole by default and cuts them only where a part is named', () => {
    for (const root of ['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'ACOUSTIC_BAFFLES', 'DUCT_INTAKE', 'DUCT_EXHAUST']) {
      expect(SECTION_ROOTS.has(root)).toBe(true)
    }
    // The engine and pump are the story; only the ruled occurrences inside them are cut.
    expect(SECTION_ROOTS.has('PUMP_HOUSING')).toBe(false)
    expect(SECTION_ROOTS.has('ISOLATION_MOUNTS')).toBe(false)
    expect(policyFor('V2SKF-TB-5500-03-1')?.policy).toBe('section')
  })
  it('resolves the ruled section policy through uniquified primitive names', () => {
    expect(policyFor('RL300-PEM-1001-1')?.policy).toBe('keep')
    expect(policyFor('V2SKF-TB-5500-03-1')?.policy).toBe('section')
    expect(policyFor('V2SKF-TB-2200-01-1')?.policy).toBe('hide')
    // GLTFLoader sanitizes spaces and uniquifies multi-primitive mesh defs.
    expect(policyFor('V23028T25_Weld-on_Tie-Down_Ring-1')?.name).toBe('V23028T25_Weld-on Tie-Down Ring-1')
    expect(policyFor('V2EDW-60335_(Fuel_Tank_Weld_On_Flange)-1')?.policy).toBe('hide')
    expect(policyFor('V2EDW-60335_(Fuel_Tank_Weld_On_Flange)-3')?.policy).toBe('hide')
    expect(policyFor('RL300-EMG-1001-P-1_1')?.policy).toBe('keep')
    expect(policyFor('V2SKF-TB-2200-01-3')).toBeNull()
    expect(policyFor('ENCLOSURE_CHASSIS')).toBeNull()
    // Names carry a tilde and a space; sanitizing must not lose the occurrence.
    expect(policyFor('V2MSP-MID-5406HHP24_~-3')?.name).toBe('V2MSP-MID-5406HHP24 ~-3')
    expect(policyFor('V2MSP-MID-5406HHP24_~-2')).toBeNull()
    expect(policyFor('12335A81_Oil-Resistant_Push-on_Seal_with_Bulb-1')?.policy).toBe('delete')
    expect(Object.values(PART_POLICY).filter(p => p === 'keep')).toHaveLength(3)
    expect(Object.values(PART_POLICY).filter(p => p === 'hide')).toHaveLength(18)
    expect(Object.values(PART_POLICY).filter(p => p === 'delete')).toHaveLength(1)
  })
  it('bakes reflected CAD without reversing the signed volume or mutating source', () => {
    const g = new BoxGeometry(1, 2, 3)
    const mesh = new Mesh(g, new MeshStandardMaterial()); mesh.scale.x = -1; mesh.updateMatrixWorld()
    const baked = bakeGeometry(mesh), p = baked.getAttribute('position')
    let volume = 0
    const a = new Vector3(), b = new Vector3(), c = new Vector3()
    for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2); volume += a.dot(b.cross(c)) / 6 }
    expect(volume).toBeCloseTo(6)
    expect(isClosedVolume(baked)).toBe(true)
    expect(g.index).not.toBeNull()
    const open = baked.clone(); open.setDrawRange(0, p.count - 6)
    // Remove a face from the actual position/normal arrays, not merely a draw range.
    for (const name of ['position', 'normal']) {
      const attr = open.getAttribute(name); open.setAttribute(name, new Float32BufferAttribute(attr.array.slice(0, -18), attr.itemSize))
    }
    expect(isClosedVolume(open)).toBe(false)
    g.dispose(); baked.dispose(); open.dispose(); (mesh.material as MeshStandardMaterial).dispose()
  })
  it('authors actual open louver gaps at the named liner location', () => {
    const intake = createLowerIntake(); intake.group.updateMatrixWorld(true)
    const louvers = intake.group.children[0]
    const ray = new Raycaster(); let misses = 0
    for (let i = 0; i < 40; i++) {
      ray.set(new Vector3(.1, .3, .48 + i / 40 * .54), new Vector3(0, -1, 0))
      if (ray.intersectObject(louvers).length === 0) misses++
    }
    expect(misses).toBeGreaterThan(8)
    expect(misses).toBeLessThan(32)
    intake.dispose()
  })
  it('evaluates finite, bounded flow values across the whole sequence', () => {
    for (let i = 0; i <= 1000; i++) {
      const flow = evaluateFlow(i / 1000)
      for (const value of [...Object.values(flow.extent), ...Object.values(flow.weight), flow.heat]) {
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })
  it('returns deeply equal flow state for repeated progress samples', () => {
    for (const u of [0, .26, .31, .55, .67, .78, .845, .89, .9, 1]) {
      expect(evaluateFlow(u)).toEqual(evaluateFlow(u))
    }
  })
  it('returns exact zero flow quantities at the closed-shell boundaries', () => {
    for (const u of [0, .26, .90, 1]) {
      const flow = evaluateFlow(u)
      expect(Object.values(flow.extent)).toEqual([0, 0, 0, 0])
      expect(Object.values(flow.weight)).toEqual([0, 0, 0, 0])
      expect(flow.heat).toBe(0)
    }
  })
  it('draws the authored bundles in main, lower, merged, sound order', () => {
    const firstNonZero = (bundle: keyof ReturnType<typeof evaluateFlow>['extent']) => {
      for (let i = 0; i <= 1000; i++) if (evaluateFlow(i / 1000).extent[bundle] > 0) return i / 1000
      return Infinity
    }
    expect(firstNonZero('main')).toBeLessThan(firstNonZero('lower'))
    expect(firstNonZero('lower')).toBeLessThan(firstNonZero('merged'))
    expect(firstNonZero('merged')).toBeLessThan(firstNonZero('sound'))
  })
  it('heats through the pump beat and is cool again after the handoff', () => {
    expect(evaluateFlow(.54).heat).toBe(0)
    expect([.56, .64, .78].some(u => evaluateFlow(u).heat > 0)).toBe(true)
    expect(evaluateFlow(.89).heat).toBe(0)
  })
  it('keeps every authored flow spine point inside the measured model envelope', () => {
    for (const [bundle, spine] of Object.entries(SPINES)) for (const [x, y, z] of spine) {
      expect(x).toBeGreaterThanOrEqual(-.8)
      expect(x).toBeLessThanOrEqual(.8)
      expect(y).toBeGreaterThanOrEqual(-.2)
      expect(y).toBeLessThanOrEqual(2.107)
      // The merged exhaust discharge intentionally leaves the enclosure through the -z face.
      expect(z).toBeGreaterThanOrEqual(bundle === 'merged' ? -1.95 : -1.683)
      expect(z).toBeLessThanOrEqual(1.683)
    }
    expect(SPINES.merged.at(-1)![2]).toBeLessThan(-1.683)
  })
  it('keeps the main corridor waypoints inside the rebuilt airway bounds', () => {
    // Waypoints 0-1 are entry (outboard of and passing through the intake panel), 2-9 ride the
    // rebuilt airway (ceiling run plus the hairpin loop), and 10-18 are tail (dropped out through
    // the pocket mouth, running aft to the merged discharge): the outside groups are pinned
    // positively instead: entries must stay outboard of the intake panel, tails must have left
    // the section and dropped below the volume.
    for (let i = 2; i <= 9; i++) for (const [axis, v] of SPINES.main[i].entries()) {
      expect(v).toBeGreaterThanOrEqual(AIRWAY_BOUNDS.min[axis])
      expect(v).toBeLessThanOrEqual(AIRWAY_BOUNDS.max[axis])
    }
    for (let i = 2; i <= 9; i++) {
      const [y, z] = [SPINES.main[i][1], SPINES.main[i][2]]
      expect(insideAirwaySection(y, z)).toBe(true)
    }
    // This is the exact point the rebuild removed; the AABB test alone cannot catch it.
    expect(insideAirwaySection(1.40, .74)).toBe(false)
    expect(SPINES.main[0][2]).toBeGreaterThan(AIRWAY_BOUNDS.max[2])
    expect(SPINES.main[1][2]).toBeGreaterThan(AIRWAY_BOUNDS.max[2])
    for (let i = 10; i <= 18; i++) {
      expect(insideAirwaySection(SPINES.main[i][1], SPINES.main[i][2])).toBe(false)
      expect(SPINES.main[i][1]).toBeLessThan(1.479)
    }
    for (let i = 14; i <= 18; i++) expect(SPINES.main[i][1]).toBeLessThan(AIRWAY_BOUNDS.min[1])
    // The hairpin's tip is the loop's minimum z, and the loop returns aft of the tip.
    expect(SPINES.main[7][2]).toBe(Math.min(...SPINES.main.slice(5, 10).map(p => p[2])))
    expect(SPINES.main[9][2]).toBeGreaterThan(SPINES.main[7][2] + .04)
    for (let i = 10; i < 18; i++) expect(SPINES.main[i][2]).toBeGreaterThan(SPINES.main[i + 1][2])
  })
  it('keeps the entry approach in the owner-ruled band, clear of the slanted floor', () => {
    // The owner's 2026-09-23 ruling (project/work/evidence/rl300-quiet-machine/entry-fix/owner-entry-path-ruling-2026-09-23.png) unprojected onto the x = -.40 plane from the u = 0.34 camera, as [y, z] polygons.
    const OWNER_BAND: readonly (readonly [number, number])[] =
      [[1.523, 1.552], [1.522, 1.392], [1.828, 1.072], [1.813, .588],
       [1.680, .712], [1.691, 1.067], [1.385, 1.416], [1.383, 1.597]]
    const OWNER_RED: readonly (readonly [number, number])[] =
      [[1.369, 1.357], [1.316, 1.335], [1.610, .722], [1.624, 1.079]]
    // the owner's middle blue strand
    const OWNER_MIDDLE: readonly (readonly [number, number])[] =
      [[1.450, 1.573], [1.448, 1.402], [1.757, 1.056], [1.749, .694]]
    // Same ray-casting rule as insideAirwaySection in flow.ts, on [y, z].
    const pointInPolygon = (y: number, z: number, polygon: readonly (readonly [number, number])[]) => {
      let inside = false
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, zi] = polygon[i]
        const [yj, zj] = polygon[j]
        if ((zi > z) !== (zj > z) && y < (yj - yi) * (z - zi) / (zj - zi) + yi) inside = !inside
      }
      return inside
    }
    const signedDistance = (y: number, z: number, polygon: readonly (readonly [number, number])[], openLastEdge = false) => {
      const edgeCount = openLastEdge ? polygon.length - 1 : polygon.length
      let nearest = Infinity
      for (let i = 0; i < edgeCount; i++)
        nearest = Math.min(nearest, pointToSegment(y, z, polygon[i], polygon[(i + 1) % polygon.length]))
      return (pointInPolygon(y, z, polygon) ? 1 : -1) * nearest
    }
    const middleDistance = (y: number, z: number) => Math.min(
      ...OWNER_MIDDLE.slice(0, -1).map((a, i) => pointToSegment(y, z, a, OWNER_MIDDLE[i + 1])))
    // Centerline: the spine the ribbons fan around, sampled exactly as AirRibbons.tsx samples it (AIR_SAMPLES).
    const spine = new CatmullRomCurve3(SPINES.main.map(p => new Vector3(...p)), false, 'centripetal', .5).getPoints(AIR_SAMPLES)
    const entryEnd = spine.findIndex(p => p.z < .60)
    expect(entryEnd).toBeGreaterThan(0)
    const entry = entryEnd === -1 ? spine : spine.slice(0, entryEnd)
    const banded = entry.filter(p => p.z >= .72 && p.z <= 1.55)
    expect(banded.length).toBeGreaterThan(0)
    // The centerline has to hold well inside the owner's outer strands and track the owner's middle strand.
    expect(Math.min(...banded.map(p => signedDistance(p.y, p.z, OWNER_BAND)))).toBeGreaterThanOrEqual(.020)
    expect(Math.max(...banded.map(p => middleDistance(p.y, p.z)))).toBeLessThanOrEqual(.030)
    // Rendered envelope: a ribbon is the centerline plus a radial fan plus a half-width, so a centerline
    // inside the band is not enough. 6 is the desktop main-bundle ribbon count: RIBBON_COUNT.desktop 18
    // split three ways by ribbonSplit.
    expect(ribbonSplit(RIBBON_COUNT.desktop).main).toBe(6)
    const paths = airPaths('main', 6)
    let minRedClearance = Infinity
    let minWallClearance = Infinity
    let redCount = 0
    let wallCount = 0
    for (const path of paths) for (let i = 0; i < entry.length; i++) {
      const point = path.points[i]
      // The half-width w is added because the vertex shader offsets each strip edge by aSide * aWidth (AirRibbons.tsx VERTEX_SHADER).
      const w = path.width(i / AIR_SAMPLES)
      redCount++
      minRedClearance = Math.min(minRedClearance, -signedDistance(point.y, point.z, OWNER_RED) - w)
      // Only the retuned entry run is checked against the wall: the ceiling stretch from spine z .70 down
      // to .60 belongs to the unchanged corridor waypoints and is out of scope here.
      if (point.z <= 1.300 && spine[i].z >= .70) {
        wallCount++
        minWallClearance = Math.min(minWallClearance, signedDistance(point.y, point.z, AIRWAY_SECTION, true) - w)
      }
    }
    expect(redCount).toBeGreaterThan(0)
    expect(wallCount).toBeGreaterThan(0)
    expect(minRedClearance).toBeGreaterThanOrEqual(.015)
    expect(minWallClearance).toBeGreaterThanOrEqual(.015)
  })
  it('follows the owner mid-path ruling: hairpin under the canopy, then a smooth aft descent', () => {
    // Owner ruling 2026-09-23 (project/work/evidence/rl300-quiet-machine/entry-fix/owner-mid-path-ruling-2026-09-23.png)
    // unprojected onto x = -.40 from the u = .425 camera, as [y, z].
    const OWNER_MID_RED: readonly (readonly [number, number])[] = [
      [1.767, .757], [1.75, .692], [1.729, .625], [1.701, .56], [1.647, .543], [1.595, .585],
      [1.554, .64], [1.496, .659], [1.443, .621], [1.405, .56], [1.374, .494], [1.352, .421],
      [1.328, .349], [1.304, .275], [1.281, .2], [1.257, .125], [1.233, .046], [1.208, -.032],
      [1.183, -.112], [1.157, -.194], [1.131, -.277],
    ]
    const spine = new CatmullRomCurve3(SPINES.main.map(p => new Vector3(...p)), false, 'centripetal', .5).getPoints(AIR_SAMPLES)
    const per = AIR_SAMPLES / (SPINES.main.length - 1)
    expect(Number.isInteger(per)).toBe(true)
    const polylineDistance = (y: number, z: number, polyline: readonly (readonly [number, number])[]) =>
      Math.min(...polyline.slice(0, -1).map((a, i) => pointToSegment(y, z, a, polyline[i + 1])))
    // Fidelity both ways in the (y, z) plane: the rendered centerline tracks the owner's red
    // curve and every red vertex lands on the centerline.
    for (let i = 5 * per; i <= 16 * per; i++) {
      expect(polylineDistance(spine[i].y, spine[i].z, OWNER_MID_RED)).toBeLessThanOrEqual(.035)
    }
    const centerline = spine.slice(4 * per, 16 * per + 1).map(p => [p.y, p.z] as const)
    for (const [y, z] of OWNER_MID_RED) {
      expect(polylineDistance(y, z, centerline)).toBeLessThanOrEqual(.035)
    }
    // Smoothness on the rendered centerline: no linear direction changes between samples.
    for (let i = 4 * per + 1; i <= AIR_SAMPLES - 1; i++) {
      const incoming = spine[i].clone().sub(spine[i - 1])
      const outgoing = spine[i + 1].clone().sub(spine[i])
      const cosine = incoming.dot(outgoing) / (incoming.length() * outgoing.length())
      expect(Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI).toBeLessThanOrEqual(15)
      // Circumradius of the sampled triplet bounds the local curvature; collinear triplets are skipped.
      const chord = spine[i + 1].clone().sub(spine[i - 1])
      const doubledArea = new Vector3().crossVectors(incoming, chord).length()
      if (doubledArea > 1e-9) {
        const radius = incoming.length() * chord.length() * outgoing.length() / (2 * doubledArea)
        expect(radius).toBeGreaterThanOrEqual(.050)
      }
    }
    // Wall envelope: ribbon points between the ceiling run and the pocket mouth hold clearance
    // from the airway's solid sheet metal (the mouth and the intake end are open).
    const paths = airPaths('main', 6)
    const exit = spine.findIndex((point, i) => i > 8 * per && point.y < 1.479)
    expect(exit).toBeGreaterThan(4 * per)
    const SOLID_EDGES: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6]]
    let minClearance = Infinity
    for (const path of paths) {
      for (let i = 4 * per; i < exit; i++) {
        const point = path.points[i]
        const distance = Math.min(...SOLID_EDGES.map(([a, b]) =>
          pointToSegment(point.y, point.z, AIRWAY_SECTION[a], AIRWAY_SECTION[b])))
        minClearance = Math.min(minClearance, distance - path.width(i / AIR_SAMPLES))
      }
    }
    expect(minClearance).toBeGreaterThanOrEqual(.015)
    // Handoff: the rebuilt tail meets the merged discharge spine.
    const merged = new CatmullRomCurve3(SPINES.merged.map(p => new Vector3(...p)), false, 'centripetal', .5).getPoints(4000)
    const tail = new Vector3(...SPINES.main.at(-1)!)
    expect(Math.min(...merged.map(p => p.distanceTo(tail)))).toBeLessThanOrEqual(.005)
  })
  it('routes the lower supply in through the louver opening and onto the merged discharge', () => {
    // Lower-bundle ruling 2026-09-24 (cycle "lower-fix"): the spine is drawn from the crawl space
    // under the louver footprint, crosses the authored louver panel inside a measured open gap,
    // rides the collector and shallow duct with 15 mm centerline clearance, climbs past the EMG
    // panel on the old lane, and lands ON the merged discharge spine like the main tail does.
    const spine = new CatmullRomCurve3(SPINES.lower.map(p => new Vector3(...p)), false, 'centripetal', .5).getPoints(AIR_SAMPLES)
    // The head starts in the crawl space under the louver footprint — not at the ground (y -.22),
    // not touching the panel (bottom y -.042).
    const [, sy, sz] = SPINES.lower[0]
    expect(sy).toBeGreaterThanOrEqual(-.13)
    expect(sy).toBeLessThanOrEqual(-.062)
    expect(sz).toBeGreaterThanOrEqual(.449)
    expect(sz).toBeLessThanOrEqual(1.052)
    // Traversal is checked against the authored louver geometry itself: where the centerline
    // crosses the panel plane, a downward ray at the crossing (and +/- 4 mm along z) must miss
    // the louvers entirely, i.e. the crossing sits in an open gap.
    let crossing: Vector3 | null = null
    for (let i = 1; i <= AIR_SAMPLES && !crossing; i++) {
      if (spine[i - 1].y < -.033 && spine[i].y >= -.033) {
        const t = (-.033 - spine[i - 1].y) / (spine[i].y - spine[i - 1].y)
        crossing = spine[i - 1].clone().lerp(spine[i], t)
      }
    }
    expect(crossing).not.toBeNull()
    // The crossing must be through the actual panel footprint, not just anywhere on the
    // infinite y = -.033 plane — a bypass route under the machine would cross the plane
    // where no panel exists and the rays would trivially miss.
    expect(crossing!.z).toBeGreaterThanOrEqual(.449)
    expect(crossing!.z).toBeLessThanOrEqual(1.052)
    expect(Math.abs(crossing!.x)).toBeLessThanOrEqual(.378)
    const intake = createLowerIntake(); intake.group.updateMatrixWorld(true)
    const louvers = intake.group.children[0]
    const ray = new Raycaster()
    for (const dz of [-.004, 0, .004]) {
      ray.set(new Vector3(crossing!.x, .3, crossing!.z + dz), new Vector3(0, -1, 0))
      expect(ray.intersectObject(louvers)).toHaveLength(0)
    }
    intake.dispose()
    // The collector ride stays inside the open box (walls to y .14, open bottom at the panel).
    const collector = spine.filter(p => p.z <= 1.025 && p.z >= .475 && p.y > .01)
    expect(collector.length).toBeGreaterThan(0)
    for (const p of collector) {
      expect(p.y).toBeLessThanOrEqual(.138)
      expect(p.y).toBeGreaterThanOrEqual(-.024)
    }
    // Under the duct's top panel the centerline holds 15 mm clearance to the panel bottom (y .129)
    // and the floor top (y -.009).
    const duct = spine.filter(p => p.z <= .584 && p.z >= -.036 && p.y > .02)
    expect(duct.length).toBeGreaterThan(0)
    for (const p of duct) {
      expect(p.y).toBeLessThanOrEqual(.129 - .015)
      expect(p.y).toBeGreaterThanOrEqual(-.009 + .015)
    }
    // In the riser's z band at riser heights, the centerline stays 15 mm off the left wall's inner
    // face (x -.204); the wall spans y -.015...295, so higher samples are the open interior climb.
    const riser = spine.filter(p => p.z <= -.185 && p.z >= -.455 && p.y <= .32)
    expect(riser.length).toBeGreaterThan(0)
    for (const p of riser) {
      expect(p.x).toBeGreaterThanOrEqual(-.204 + .015)
    }
    // Handoff: the tail lands ON the merged discharge spine — the same contract the main tail holds.
    const merged = new CatmullRomCurve3(SPINES.merged.map(p => new Vector3(...p)), false, 'centripetal', .5).getPoints(4000)
    const tail = new Vector3(...SPINES.lower.at(-1)!)
    expect(Math.min(...merged.map(p => p.distanceTo(tail)))).toBeLessThanOrEqual(.005)
    // Smoothness on the rendered centerline: no linear direction change over 15 degrees and no
    // curvature radius under 50 mm — the bounds the mid-path ruling test holds the main bundle to.
    for (let i = 1; i < AIR_SAMPLES; i++) {
      const incoming = spine[i].clone().sub(spine[i - 1])
      const outgoing = spine[i + 1].clone().sub(spine[i])
      const cosine = incoming.dot(outgoing) / (incoming.length() * outgoing.length())
      expect(Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI).toBeLessThanOrEqual(15)
      const chord = spine[i + 1].clone().sub(spine[i - 1])
      const doubledArea = new Vector3().crossVectors(incoming, chord).length()
      if (doubledArea > 1e-9) {
        const radius = incoming.length() * chord.length() * outgoing.length() / (2 * doubledArea)
        expect(radius).toBeGreaterThanOrEqual(.050)
      }
    }
  })
  it('moves every ribbon continuously: no frame flip between samples', () => {
    // Parallel transport replaces the legacy world-up frame, whose sideways jump at every
    // |tangent.y| >= .92 switch showed as a kink in the fanned ribbons.
    for (const bundle of ['main', 'lower', 'merged'] as const) {
      const spine = new CatmullRomCurve3(SPINES[bundle].map(p => new Vector3(...p)), false, 'centripetal', .5).getPoints(AIR_SAMPLES)
      for (const path of airPaths(bundle, 6)) {
        let maximum = 0
        for (let i = 1; i < path.points.length; i++) {
          const previous = path.points[i - 1].clone().sub(spine[i - 1])
          const current = path.points[i].clone().sub(spine[i])
          maximum = Math.max(maximum, current.distanceTo(previous))
        }
        expect(maximum).toBeLessThanOrEqual(.015)
      }
    }
  })
  it('keeps desktop and mobile ribbon counts within their authored budgets', () => {
    expect(RIBBON_COUNT.desktop).toBeGreaterThanOrEqual(12)
    expect(RIBBON_COUNT.desktop).toBeLessThanOrEqual(24)
    expect(RIBBON_COUNT.mobile).toBeGreaterThanOrEqual(6)
    expect(RIBBON_COUNT.mobile).toBeLessThanOrEqual(10)
  })
})
