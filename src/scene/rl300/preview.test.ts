import { describe, expect, it } from 'vitest'
import { BoxGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial, Plane, Raycaster, Vector3 } from 'three'
import { bakeGeometry, finishFor, FINISHED_CUT, isClosedVolume, PART_POLICY, policyFor, SECTION_ROOTS } from './prepareModel'
import { CLOSED_CUT, DEEPEST_CUT, evaluateShot, MODEL_BOUNDS, SHOTS } from './shot'
import { createLowerIntake } from './LowerIntake'
import { createStencilMaterials } from './SectionCaps'
import { AIRWAY_BOUNDS, evaluateFlow, insideAirwaySection, RIBBON_COUNT, SPINES } from './flow'

describe('RL300 review prototype', () => {
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
    // Waypoints 0-1 are entry (outboard of and passing through the intake panel) and 9-11 are tail
    // (below and aft of the volume, running to the engine): both groups are deliberately outside
    // the airway volume by design, so they are pinned positively instead: entries must stay
    // outboard of the intake panel and tails must have dropped below the volume.
    for (let i = 2; i <= 8; i++) for (const [axis, v] of SPINES.main[i].entries()) {
      expect(v).toBeGreaterThanOrEqual(AIRWAY_BOUNDS.min[axis])
      expect(v).toBeLessThanOrEqual(AIRWAY_BOUNDS.max[axis])
    }
    for (let i = 2; i <= 8; i++) {
      const [y, z] = [SPINES.main[i][1], SPINES.main[i][2]]
      expect(insideAirwaySection(y, z)).toBe(true)
    }
    // This is the exact point the rebuild removed; the AABB test alone cannot catch it.
    expect(insideAirwaySection(1.40, .74)).toBe(false)
    expect(SPINES.main[0][2]).toBeGreaterThan(AIRWAY_BOUNDS.max[2])
    expect(SPINES.main[1][2]).toBeGreaterThan(AIRWAY_BOUNDS.max[2])
    expect(SPINES.main[9][1]).toBeLessThan(AIRWAY_BOUNDS.min[1])
    expect(SPINES.main[10][1]).toBeLessThan(AIRWAY_BOUNDS.min[1])
    expect(SPINES.main[11][1]).toBeLessThan(AIRWAY_BOUNDS.min[1])
    expect(SPINES.main[6][2]).toBeLessThanOrEqual(.564)
  })
  it('keeps desktop and mobile ribbon counts within their authored budgets', () => {
    expect(RIBBON_COUNT.desktop).toBeGreaterThanOrEqual(12)
    expect(RIBBON_COUNT.desktop).toBeLessThanOrEqual(24)
    expect(RIBBON_COUNT.mobile).toBeGreaterThanOrEqual(6)
    expect(RIBBON_COUNT.mobile).toBeLessThanOrEqual(10)
  })
})
