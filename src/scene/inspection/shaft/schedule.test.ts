import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { CASCADE_RATIOS, SUN_TO_STAGE1_CARRIER_RATIO } from './cascadeConfig'
import { CASCADE_REVEAL_EVENTS, CASCADE_UNIT_COUNT, IGNITION_NORMAL_RATE, axialSlideProgress, createShaftSchedule, sampleFinaleAngle, sampleFinaleDriveRate, sampleShaftSchedule } from './schedule'
import { BULLET_TIME_SHOT_SPECS } from '../../torque-wrench/bulletTime'
import { shaftBeats, shaftStory } from './story'

/** Independent restatement of the Stage 1 carrier drive (rad/s); every piece is a cubic in t. */
const IGNITION = BULLET_TIME_SHOT_SPECS.stage1Ignition
const KNEE = Math.max(1e-4, Math.min(.45, IGNITION.rampFraction))
const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u) }
/** Calibration: .2 sun rev over 38.5..40.2 s at mean envelope (rate + knee * (1 - rate)) of normal. */
const NORMAL = IGNITION.maxRevolutions * 2 * Math.PI / (SUN_TO_STAGE1_CARRIER_RATIO * 1.7 * (IGNITION.rate + KNEE * (1 - IGNITION.rate)))
// Pre-preview mechanical timings: independently guard that earlier carrier
// visibility does not change the approved angular motion or final phase.
const APPROVED_DRIVE = [
  { carrierStart:52.2,carrierFull:53.1,driveRate:Math.PI/2 },
  { carrierStart:55.5,carrierFull:56.4,driveRate:1.5*Math.PI },
  { carrierStart:59.1,carrierFull:60,driveRate:7*Math.PI/3 },
  { carrierStart:62.25,carrierFull:63.15,driveRate:50*Math.PI/9 },
]
function envelope(u: number): number {
  if (u < KNEE) return 1 + (IGNITION.rate - 1) * smooth(u / KNEE)
  if (u > 1 - KNEE) return 1 + (IGNITION.rate - 1) * smooth((1 - u) / KNEE)
  return IGNITION.rate
}
function independentDrive(t: number): number {
  let w = t < 38.5 ? NORMAL * smooth((t - 38.2) / .3)
    : t <= 40.2 ? NORMAL * envelope((t - 38.5) / 1.7)
      : NORMAL + (.5 * Math.PI - NORMAL) * smooth((t - 40.2) / .4)
  let previous = .5 * Math.PI
  for (const event of APPROVED_DRIVE) {
    w += (event.driveRate - previous) * smooth((t - event.carrierStart) / (event.carrierFull - event.carrierStart))
    previous = event.driveRate
  }
  return w
}
/** Composite Simpson between every C1 breakpoint; exact for the piecewise cubics up to rounding. */
function integrateDrive(end: number): number {
  const breaks = [0, 38.2, 38.5, 38.5 + 1.7 * KNEE, 40.2 - 1.7 * KNEE, 40.2, 40.6,
    ...APPROVED_DRIVE.flatMap(event => [event.carrierStart, event.carrierFull]), end]
    .filter(t => t <= end).sort((a, b) => a - b)
  let total = 0
  for (let i = 1; i < breaks.length; i++) {
    const a = breaks[i - 1], b = breaks[i], n = 16, h = (b - a) / n
    if (h <= 0) continue
    let sum = independentDrive(a) + independentDrive(b)
    for (let k = 1; k < n; k++) sum += (k % 2 ? 4 : 2) * independentDrive(a + k * h)
    total += sum * h / 3
  }
  return total
}

describe('shaft schedule', () => {
  it('uses the authored beat boundaries, including the held endpoint', () => {
    const out = createShaftSchedule()
    for (let i = 0; i < shaftBeats.length; i++) {
      const beat = shaftBeats[i]
      expect(sampleShaftSchedule(beat.start, out)).toBe(out)
      expect(out.beat).toBe(beat.id); expect(out.beatIndex).toBe(i)
      if (i > 0) expect(sampleShaftSchedule(beat.start - 1e-9, out).beat).toBe(shaftBeats[i - 1].id)
      expect(sampleShaftSchedule(beat.start + 1e-9, out).beat).toBe(beat.id)
    }
    expect(sampleShaftSchedule(100, out).time).toBe(66.9)
    expect(out.beat).toBe('cascade-finale')
    expect(sampleShaftSchedule(-2, out).time).toBe(0)
    expect(sampleShaftSchedule(NaN, out).time).toBe(0)
    expect(shaftBeats.slice(-3)).toEqual([
      { id: 'runout-hold', start: 32, end: 35 },
      { id: 'stage1-mesh', start: 35, end: 38.5 },
      { id: 'cascade-finale', start: 38.5, end: 66.9 },
    ])
    expect(shaftStory.chapters[3]).toEqual({ id: 'stage1-cascade', label: 'Planetary mesh and driveline cascade', start: 35, end: 66.9 })
  })

  it('is deterministic under shuffled seeks and rewrites all fields in place', () => {
    const times = [...shaftBeats.flatMap(beat => [beat.start, beat.start + 1e-8, beat.end - 1e-8]),
      ...CASCADE_REVEAL_EVENTS.flatMap(event => [event.planetStart, event.planetFull, event.carrierStart, event.carrierFull]),
      0, 1.2, 32.8, 35.6, 37.6, 38.25, 38.6, 40.4, 41.2, 42.5, 42.8, 66.9]
    const out = createShaftSchedule(), keys = Object.keys(out)
    const alpha = out.cascadeAlpha, planetAlpha = out.cascadePlanetAlpha, offsets = out.cascadeOffsetZ
    const expected = times.map(t => JSON.stringify(sampleShaftSchedule(t, out)))
    for (let i = times.length - 1; i >= 0; i--) expect(JSON.stringify(sampleShaftSchedule(times[i], out))).toBe(expected[i])
    let seed = 1979
    for (let i = 0; i < 500; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0
      const index = seed % times.length
      expect(sampleShaftSchedule(times[index], out)).toBe(out)
      expect(JSON.stringify(out)).toBe(expected[index])
      expect(Object.keys(out)).toEqual(keys)
      expect(out.cascadePlanetAlpha).toBe(planetAlpha); expect(out.cascadeAlpha).toBe(alpha); expect(out.cascadeOffsetZ).toBe(offsets)
      expect(alpha).toHaveLength(CASCADE_UNIT_COUNT); expect(offsets).toHaveLength(CASCADE_UNIT_COUNT)
    }
  })

  it('enforces opacity, tool, wipe, section, witness and narrative rules at dense times', () => {
    const out = createShaftSchedule()
    const opacities = ['legacyShaft', 'approvedShaft', 'shaper', 'hob', 'housing', 'legacyHousing', 'legacyBearing', 'legacyRing', 'approvedBearing', 'approvedRing', 'neighbours'] as const
    const violations: string[] = []
    for (let i = 0; i <= 6960; i++) {
      const t = i / 120; sampleShaftSchedule(t, out)
      for (const key of opacities) if (!(out[key] >= 0 && out[key] <= 1)) violations.push(t + ': ' + key)
      if ((t < 2 || t >= 15) && out.shaper !== 0) violations.push(t + ': shaper')
      if ((t < 25 || t >= 32) && out.hob !== 0) violations.push(t + ': hob')
      if (t >= 1.2 && out.narrativeAlpha !== 0) violations.push(t + ': narrative')
      if (t < 22.6 && out.approvedShaft !== 0) violations.push(t + ': approved before wipe')
      if (t >= 22.6 && t < 25 && (!out.wipe || out.legacyShaft !== 1 || out.approvedShaft !== 1)) violations.push(t + ': opaque wipe')
      if (t >= 25 && t <= 52.2 && (out.legacyShaft !== 0 || out.approvedShaft !== 1)) violations.push(t + ': shaft selection')
      if (out.section || out.legacyHousing !== 0 || out.legacyBearing !== 0 || out.legacyRing !== 0) violations.push(t + ': retired legacy section')
      if (out.approvedBearing !== out.approvedRing || out.legacyBearing !== out.legacyRing) violations.push(t + ': rigid pair visibility')
      if (out.witnesses) violations.push(t + ': witnesses')
      if (t <= 35 && out.neighbours !== 0) violations.push(t + ': neighbours')
      if (out.approvedBearing !== out.cascadeAlpha[3]) violations.push(t + ': support cascade')
      if (out.housing !== 0 || out.cascadeAlpha[7] !== 0) violations.push(t + ': private shell visibility')
      if (out.bulletTimeActive !== (t >= 38.5 && t < 40.2)) violations.push(t + ': bullet time')
      for (let k = 0; k < CASCADE_UNIT_COUNT; k++) {
        if (!(out.cascadeAlpha[k] >= 0 && out.cascadeAlpha[k] <= 1)) violations.push(t + ': cascade alpha ' + k)
        if (!Number.isFinite(out.cascadeOffsetZ[k])) violations.push(t + ': cascade offset ' + k)
      }
    }
    expect(violations).toEqual([])
  })

  it('slides Stage 1 from the open snout during its fade, then seats without reversing primary travel', () => {
    const out = createShaftSchedule()
    expect(sampleShaftSchedule(35, out).cascadeOffsetZ[0]).toBe(0.028)
    sampleShaftSchedule(35.4, out)
    expect(out.cascadeAlpha[0]).toBeCloseTo(0.5, 12)
    // Gate 3's <27 mm bound conflicts with the specified 3.2 s quintic:
    // q(0.125) = 0.01605224609375, so this moving pose is +27.551 mm.
    expect(out.cascadeOffsetZ[0]).toBeCloseTo(0.027550537109375, 12)
    expect(out.cascadeOffsetZ[0]).toBeLessThan(0.028)
    let previous = 0
    for (let i = 0; i <= 640; i++) {
      sampleShaftSchedule(35 + i * 0.005, out)
      expect(out.stage1SlideProgress).toBeGreaterThanOrEqual(previous)
      expect(out.stage1SlideProgress).toBeLessThanOrEqual(1)
      previous = out.stage1SlideProgress
    }
    sampleShaftSchedule(38.25, out)
    expect(out.stage1SlideProgress).toBe(1)
    expect(Math.abs(out.cascadeOffsetZ[0])).toBeLessThan(0.00008)
    expect(out.cascadeOffsetZ[0]).toBeLessThan(0)
    expect(out.datumPulseAlpha).toBeGreaterThan(0.25)
    for (const t of [38.2, 38.45, 38.5, 66.9]) expect(sampleShaftSchedule(t, out).cascadeOffsetZ[0]).toBe(0)
    const h = 1e-5
    for (const t of [35, 38.2, 38.45]) {
      const before = sampleShaftSchedule(t - h, out).cascadeOffsetZ[0]
      const at = sampleShaftSchedule(t, out).cascadeOffsetZ[0]
      const after = sampleShaftSchedule(t + h, out).cascadeOffsetZ[0]
      expect(Math.abs((after - at) / h - (at - before) / h)).toBeLessThan(1e-6)
    }
    expect(axialSlideProgress(35, 35, 38.2)).toBe(0)
    expect(axialSlideProgress(36.6, 35, 38.2)).toBeCloseTo(0.5, 12)
  })

  it('holds all downstream planets until the sun reference pose and reveals in physical order without slides', () => {
    const out = createShaftSchedule()
    expect(Object.isFrozen(CASCADE_REVEAL_EVENTS)).toBe(true)
    expect(CASCADE_REVEAL_EVENTS.map(event => event.index)).toEqual([1, 2, 4, 5])
    expect(CASCADE_REVEAL_EVENTS.map(({ index, planetStart, planetFull, carrierStart, carrierFull }) =>
      [index, planetStart, planetFull, carrierStart, carrierFull])).toEqual([
      [1,43.5,44.4,45.3,46.2], [2,53.1,54,55.5,56.4],
      [4,57,57.9,59.1,60], [5,60,60.9,62.25,63.15],
    ])
    for (const t of [40.2, 41, 41.7, 42.4]) {
      sampleShaftSchedule(t, out)
      expect(out.cascadePlanetAlpha.slice(1)).toEqual([0, 0, 0, 0, 0, 0, 0])
    }
    for (const [n, event] of CASCADE_REVEAL_EVENTS.entries()) {
      expect(Object.isFrozen(event)).toBe(true)
      if (n > 0) expect(event.planetStart).toBeGreaterThanOrEqual(CASCADE_REVEAL_EVENTS[n - 1].carrierFull)
      const { index, planetStart, planetFull, carrierStart, carrierFull } = event
      expect(planetFull).toBeLessThan(carrierStart)
      for (const [t, planet, carrier] of [[planetStart, 0, 0], [(planetStart + planetFull) / 2, .5, 0],
        [planetFull, 1, 0], [carrierStart, 1, 0], [(carrierStart + carrierFull) / 2, 1, .5], [carrierFull, 1, 1]]) {
        sampleShaftSchedule(t, out)
        expect(out.cascadePlanetAlpha[index]).toBeCloseTo(planet, 12)
        expect(out.cascadeAlpha[index]).toBeCloseTo(carrier, 12)
      }
    }
    for (let i = 0; i <= 5800; i++) {
      sampleShaftSchedule(i / 100, out)
      expect(out.cascadeOffsetZ.slice(1)).toEqual([0, 0, 0, 0, 0, 0, 0])
      if(i/100 <= 52.2)expect(out.cascadePlanetAlpha[0]).toBe(out.cascadeAlpha[0])
      for (const k of [3, 6, 7]) expect(out.cascadePlanetAlpha[k]).toBe(0)
    }
    expect(sampleShaftSchedule(56.4, out).approvedBearing).toBe(0)
    expect(sampleShaftSchedule(56.7, out).approvedBearing).toBeCloseTo(.5, 12)
    expect(out.supportBlend).toBe(1); expect(out.endpointHeld).toBe(false)
    expect(sampleShaftSchedule(57, out).approvedBearing).toBe(1)
    expect(out.endpointHeld).toBe(true)
  })

  it('holds fully visible planets before cages without an orbit-count requirement', () => {
    const out = createShaftSchedule()
    for (const event of CASCADE_REVEAL_EVENTS) {
      const orbit = (sampleFinaleAngle(event.carrierStart) - sampleFinaleAngle(event.planetFull)) * CASCADE_RATIOS[event.index] / (2 * Math.PI)
      expect(Number.isFinite(orbit)).toBe(true)
      for (let i = 0; i <= 120; i++) {
        sampleShaftSchedule(event.planetFull + (event.carrierStart - event.planetFull) * i / 120, out)
        expect(out.cascadePlanetAlpha[event.index]).toBe(1)
        expect(out.cascadeAlpha[event.index]).toBe(0)
      }
    }
  })

  it('signals source exterior restoration only after output, keeping the private shell hidden', () => {
    const out = createShaftSchedule()
    for (const t of [0,40.2,43.5,60,64.65,65.4]) expect(sampleShaftSchedule(t, out).housingGhostAlpha).toBe(0)
    sampleShaftSchedule(66.15, out)
    expect(out.cascadeAlpha[6]).toBe(1)
    expect(out.housingGhostAlpha).toBeCloseTo(.5, 12)
    sampleShaftSchedule(66.9, out)
    expect(out.housingGhostAlpha).toBe(1)
    expect(out.cascadeAlpha).toEqual([0, 1, 1, 1, 1, 1, 1, 0])
    expect(out.cascadePlanetAlpha).toEqual([0, 1, 1, 0, 1, 1, 0, 0])
    expect(out.housing).toBe(0)
    expect(out.cascadeOffsetZ).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(sampleShaftSchedule(63.15, out).cascadeAlpha[6]).toBe(0)
    expect(sampleShaftSchedule(63.9, out).cascadeAlpha[6]).toBeCloseTo(.5, 12)
    expect(out.finaleDriveRate).toBeGreaterThan(0)
    expect(sampleShaftSchedule(64.65, out).cascadeAlpha[6]).toBe(1)
  })

  it('integrates the canonical .1 ignition envelope as exactly two sun pitches and resumes the .5*pi cascade drive by 40.6 s', () => {
    const out = createShaftSchedule()
    const angle = (t: number) => sampleShaftSchedule(t, out).finaleAngle
    const h = 1e-5
    const rate = (t: number) => (angle(t + h) - angle(t - h)) / (2 * h)
    expect(IGNITION.rate).toBe(.1)
    expect(IGNITION.maxRevolutions).toBe(.2)
    expect(SUN_TO_STAGE1_CARRIER_RATIO).toBe(5.2)
    expect(IGNITION_NORMAL_RATE).toBeCloseTo(NORMAL, 14)
    // Stationary until the 38.2 s seat, then a .3 s smoothstep ramp to normal speed banks .15 s of it.
    expect(angle(30)).toBe(0)
    expect(angle(38.2)).toBe(0)
    expect(angle(38.5)).toBeCloseTo(NORMAL * .15, 12)
    expect(rate(38.35)).toBeCloseTo(NORMAL * .5, 6)
    // Two of the input sun's ten tooth pitches across the full macro, both full-speed knees included.
    expect((angle(40.2) - angle(38.5)) * SUN_TO_STAGE1_CARRIER_RATIO / (2 * Math.PI)).toBeCloseTo(.2, 12)
    expect(rate(38.5)).toBeCloseTo(NORMAL, 6)
    expect(rate(40.2)).toBeCloseTo(NORMAL, 6)
    for (const t of [38.5 + 1.7 * KNEE + .01, 39, 39.35, 39.8, 40.2 - 1.7 * KNEE - .01]) expect(rate(t)).toBeCloseTo(IGNITION.rate * NORMAL, 8)
    expect(rate(40.4)).toBeCloseTo((NORMAL + .5 * Math.PI) / 2, 8)
    expect(angle(40.6) - angle(40.2)).toBeCloseTo(NORMAL * .4 + (.5 * Math.PI - NORMAL) * .2, 12)
    for (const t of [40.6, 40.7, 41, 42, 52.2]) expect(rate(t)).toBeCloseTo(0.5 * Math.PI, 8)
    for (const t of [38.2, 38.5, 38.5 + 1.7 * KNEE, 40.2 - 1.7 * KNEE, 40.2, 40.6]) {
      const left = (angle(t) - angle(t - h)) / h
      const right = (angle(t + h) - angle(t)) / h
      expect(Math.abs(right - left)).toBeLessThan(1e-7)
      expect(Math.abs(angle(t + h) - angle(t - h))).toBeLessThan(0.00004)
    }
    expect(angle(100)).toBe(angle(66.9))
  })

  it('ramps the analytic drive in cage fades and reduces both hero speeds', () => {
    const h=1e-5,deg=180/Math.PI
    for(const [start,end,from,to] of [[55.5,56.4,90,270],[59.1,60,270,420],[62.25,63.15,420,1000]]) {
      expect(sampleFinaleDriveRate(start)*deg).toBeCloseTo(from,10)
      expect(sampleFinaleDriveRate(end)*deg).toBeCloseTo(to,10)
      expect(sampleFinaleDriveRate((start+end)/2)*deg).toBeCloseTo((from+to)/2,10)
      for(const t of [start,(start+end)/2,end])expect((sampleFinaleAngle(t+h)-sampleFinaleAngle(t-h))/(2*h)).toBeCloseTo(sampleFinaleDriveRate(t),6)
    }
    const cages=[90*.2,270*.04,420*.008,1000*.0016]
    const planets=[cages[0]*(10/3-1),cages[1]*(36/13-1),cages[2]*(52/11-1),cages[3]*5]
    for(let i=1;i<cages.length;i++){expect(cages[i-1]/cages[i]).toBeGreaterThanOrEqual(1.5);expect(planets[i-1]/planets[i]).toBeGreaterThanOrEqual(1.5)}
    // Independent numerical integration of the restated rate law replaces the frozen revolution total.
    for (let i = 0; i <= 669; i++) expect(sampleFinaleDriveRate(i / 10)).toBeCloseTo(independentDrive(i / 10), 9)
    for (const t of [38.5, 40.2, 43.5, 52.2, 56.4, 60, 63.15, 66.9]) expect(sampleFinaleAngle(t)).toBeCloseTo(integrateDrive(t), 9)
    expect(sampleFinaleAngle(66.9)*CASCADE_RATIOS[6]*deg).toBeCloseTo(integrateDrive(66.9)*CASCADE_RATIOS[6]*deg,6)
    // Only the .2-rev ignition budget is ignition-dependent; it is the same two pitches at any later time.
    expect((integrateDrive(40.2) - integrateDrive(38.5)) * SUN_TO_STAGE1_CARRIER_RATIO / (2 * Math.PI)).toBeCloseTo(.2, 10)
    expect(sampleFinaleDriveRate(66.9)*SUN_TO_STAGE1_CARRIER_RATIO/6*deg).toBeCloseTo(866.6666666667,8)
    for(const t of [NaN,Infinity,-1]){expect(sampleFinaleAngle(t)).toBe(0);expect(sampleFinaleDriveRate(t)).toBe(0)}
  })

  it('sweeps a bounded contact glint across the face and extinguishes it after bullet time', () => {
    const out = createShaftSchedule()
    let previousY = 3.175
    for (let i = 3500; i <= 5800; i++) {
      sampleShaftSchedule(i / 100, out)
      expect(out.contactGlintYmm).toBeGreaterThanOrEqual(previousY)
      expect(out.contactGlintYmm).toBeLessThanOrEqual(9.525)
      expect(out.contactGlintMix).toBeGreaterThanOrEqual(0)
      expect(out.contactGlintMix).toBeLessThanOrEqual(1)
      expect(out.datumPulseAlpha).toBeGreaterThanOrEqual(0)
      expect(out.datumPulseAlpha).toBeLessThanOrEqual(0.55)
      previousY = out.contactGlintYmm
    }
    expect(sampleShaftSchedule(36, out).contactGlintMix).toBe(0)
    expect(sampleShaftSchedule(38.2, out).contactGlintYmm).toBeCloseTo(9.525, 12)
    expect(out.contactGlintMix).toBe(1)
    expect(sampleShaftSchedule(40.2, out).contactGlintMix).toBe(0)
    expect(sampleShaftSchedule(35, out).datumPulseAlpha).toBe(0)
    expect(sampleShaftSchedule(38.5, out).datumPulseAlpha).toBe(0)
  })

  it('keeps the sampler and its closed-form helpers free of frame allocations', () => {
    const ast = ts.createSourceFile('schedule.ts', readFileSync('src/scene/inspection/shaft/schedule.ts', 'utf8'), ts.ScriptTarget.Latest, true)
    const names = new Set(['sampleShaftSchedule', 'axialSlideProgress', 'smoothRateIntegral', 'sampleFinaleAngle', 'sampleFinaleDriveRate'])
    let checked = 0
    for (const statement of ast.statements) {
      if (!ts.isFunctionDeclaration(statement) || !statement.name || !statement.body || !names.has(statement.name.text)) continue
      checked++
      const visit = (node: ts.Node) => {
        expect(ts.isNewExpression(node) || ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node) || ts.isArrowFunction(node), node.getText(ast)).toBe(false)
        node.forEachChild(visit)
      }
      visit(statement.body)
    }
    expect(checked).toBe(names.size)
  })
})
