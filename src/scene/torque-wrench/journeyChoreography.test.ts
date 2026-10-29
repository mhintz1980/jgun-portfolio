import { expect, it } from 'vitest'
import { Matrix4 } from 'three'
import { createPrivateRingCamera, samplePrivateRingCamera, RING_CAMERA_RED_AT } from './InspectionDirector'
import { COLLAPSE_END, COLLAPSE_START, READOUT_END, createJourneyCameraSampler, createJourneyPose, isolationCamera, restorationCamera, monotoneAzimuthSign, signedAzimuthDelta } from './JourneyCamera'
import { sampleJourney, createJourneySample } from './JourneyDirector'

const FRAMES = [new Matrix4(), new Matrix4().makeRotationX(.3).setPosition(.08, -.04, .17), new Matrix4().makeRotationY(Math.PI / 6).multiply(new Matrix4().makeRotationZ(.4))]
const ASPECTS = [1.6, 390 / 844]
const RAD = 180 / Math.PI
type Pose = ReturnType<typeof createJourneyPose>
const flat = (p: Pose) => [...p.position.toArray(), ...p.target.toArray(), ...p.up.toArray(), p.fov]
/** Ring exit exactly as RuntimeWorld registers it: ring-anchor camera at .56 mapped into world. */
const ringExit = (h: Matrix4, aspect: number): Pose => {
  const exit = samplePrivateRingCamera(RING_CAMERA_RED_AT, .24, createPrivateRingCamera(), aspect), pose = createJourneyPose()
  pose.position.set(exit.px, exit.py, exit.pz).applyMatrix4(h)
  pose.target.set(exit.tx, exit.ty, exit.tz).applyMatrix4(h)
  pose.up.set(exit.ux, exit.uy, exit.uz).transformDirection(h);pose.fov = exit.fov
  return pose
}
/** Azimuth/elevation/radius of the camera about its target, in the frame whose forward transform is h. */
const spherical = (pose: Pose, h: Matrix4) => {
  const o = pose.position.clone().sub(pose.target).transformDirection(h.clone().invert()), r = pose.position.distanceTo(pose.target)
  return { az: Math.atan2(o.x, o.z), el: Math.asin(Math.max(-1, Math.min(1, o.y))), r }
}
const unwrap = (series: number[]) => {
  const out = [series[0]]
  for (let n = 1; n < series.length; n++) {
    let d = series[n] - series[n - 1]
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    out.push(out[n - 1] + d)
  }
  return out
}
const trace = (a: number, b: number, count: number, aspect: number, h: Matrix4, exit?: Pose) => {
  const sample = createJourneyCameraSampler(), out = createJourneyPose(), s = []
  for (let n = 0; n <= count; n++) { const p = a + (b - a) * n / count; s.push({ p, ...spherical(sample(p, aspect, h, out, exit), h) }) }
  const az = unwrap(s.map(v => v.az))
  return s.map((v, n) => ({ ...v, az: az[n] }))
}
const monotone = (values: number[], sign: number, tolerance = 1e-9) => values.every((v, n) => n === 0 || (v - values[n - 1]) * sign >= -tolerance)

it.each(ASPECTS)('signed azimuth sign picks the shorter combined direction and never adds a turn for equal endpoints, aspect %s', () => {
  expect(monotoneAzimuthSign(0, 1, 2)).toBe(1)
  expect(monotoneAzimuthSign(2, 1, 0)).toBe(-1)
  expect(signedAzimuthDelta(1, 1 + 1e-13, -1)).toBe(0)
  expect(signedAzimuthDelta(1, 1 - 1e-13, 1)).toBe(0)
})

it.each(ASPECTS)('entry .56-.62 sweeps one way through the isolation pass with no counter-swing, aspect %s', aspect => {
  for (const h of FRAMES) {
    const t = trace(.56, .62, 1200, aspect, h, ringExit(h, aspect))
    const sign = Math.sign(t[t.length - 1].az - t[0].az)
    expect(sign).not.toBe(0)
    expect(monotone(t.map(v => v.az), sign), 'azimuth direction').toBe(true)
    // log radius has no overshoot beyond the endpoint/isolation envelope
    const radii = t.map(v => v.r), low = Math.min(radii[0], radii[600], radii[1200]) * .97, high = Math.max(radii[0], radii[600], radii[1200]) * 1.03
    expect(radii.every(r => r >= low && r <= high), 'radius envelope').toBe(true)
  }
})

/**
 * Law 3 is measured DURING the housing fade (.585-.600), not across the whole entry. The real ring exit (-113 deg local
 * azimuth, 11.5 deg elevation) sits behind the isolation profile (-60 deg) and the study entry (-96 deg); one sweep
 * direction through both therefore wraps the long way (-307 deg over .56-.60, 114 deg of it inside the fade), because
 * the only shorter option reverses at the .600 pass-through (53 deg then -36 deg) and fades with 17 deg of motion.
 */
it.each(ASPECTS)('sweeps at least 45 degrees of azimuth and shifts elevation DURING the isolation fade, aspect %s', aspect => {
  for (const h of FRAMES) {
    const exit = ringExit(h, aspect), fade = trace(.585, .600, 600, aspect, h, exit), entry = trace(.56, .60, 600, aspect, h, exit)
    const sweep = Math.abs(fade[fade.length - 1].az - fade[0].az) * RAD, shift = Math.abs(fade[fade.length - 1].el - fade[0].el) * RAD
    expect(sweep, 'azimuth sweep during fade').toBeGreaterThanOrEqual(45)
    expect(shift, 'elevation shift during fade').toBeGreaterThanOrEqual(3)
    expect(Math.abs(entry[entry.length - 1].az - entry[0].az) * RAD, 'no more than one wrap on the ring-to-isolation leg').toBeLessThanOrEqual(360)
    expect(monotone(fade.map(v => v.az), Math.sign(fade[fade.length - 1].az - fade[0].az)), 'fade direction').toBe(true)
  }
})

it.each(ASPECTS)('the isolation pass-through has nonzero speed on every channel pair (no ease stop), aspect %s', aspect => {
  const h = FRAMES[1], exit = ringExit(h, aspect), sample = createJourneyCameraSampler(), a = createJourneyPose(), b = createJourneyPose(), eps = 1e-5
  sample(.6 - eps, aspect, h, a, exit);sample(.6 + eps, aspect, h, b, exit)
  expect(a.position.distanceTo(b.position) / (2 * eps)).toBeGreaterThan(.5)
})

/**
 * Canonical Law 2 applies across the restore hold as well: choose the shorter
 * TOTAL same-sign itinerary, rather than individually shortest opposing legs.
 */
it.each(ASPECTS)('retirement and extraction use one direction and at most one complete turn, aspect %s', aspect => {
  for (const h of FRAMES) {
    const legs = [[.825, .845], [.855, .94]].map(([a, b]) => { const t = trace(a, b, 800, aspect, h), travel = t[t.length - 1].az - t[0].az
      expect(monotone(t.map(v => v.az), Math.sign(travel) || 1), 'direction ' + a).toBe(true)
      expect(t.every(v => Number.isFinite(v.r) && v.r > .03)).toBe(true)
      return travel * RAD })
    expect(Math.sign(legs[0])).toBe(Math.sign(legs[1]))
    expect(Math.abs(legs[0])+Math.abs(legs[1])).toBeLessThanOrEqual(360+1e-8)
    const sample = createJourneyCameraSampler(), a = createJourneyPose(), b = createJourneyPose(), iso = flat(restorationCamera(aspect, h, createJourneyPose()))
    for (const p of [.845, .85, .855]) expect(flat(sample(p, aspect, h, a))).toEqual(iso)
    expect(sample(.93, aspect, h, a).position.distanceTo(sample(.94, aspect, h, b).position)).toBeGreaterThan(1e-5)
  }
})

it.each(ASPECTS)('collapse to readout is one C1 span: same azimuth direction, no stop at the collapse pose, aspect %s', aspect => {
  const h = new Matrix4(), t = trace(COLLAPSE_START, READOUT_END, 2000, aspect, h)
  const sign = Math.sign(t[t.length - 1].az - t[0].az)
  expect(sign).toBe(-1)
  expect(monotone(t.map(v => v.az), sign)).toBe(true)
  // Azimuth velocity per unit progress at the collapse knot is non-zero and continuous (no ease stop).
  const sample = createJourneyCameraSampler(), out = createJourneyPose(), eps = 1e-6
  const speed = (p: number) => { const A = spherical(sample(p - eps, aspect, h, out), h).az; const B = spherical(sample(p + eps, aspect, h, out), h).az; return (B - A) / (2 * eps) }
  const left = speed(COLLAPSE_END - 1e-5), mid = speed(COLLAPSE_END), right = speed(COLLAPSE_END + 1e-5)
  expect(Math.abs(mid)).toBeGreaterThan(1)
  expect(Math.abs(left - mid) / Math.abs(mid)).toBeLessThan(.05)
  expect(Math.abs(right - mid) / Math.abs(mid)).toBeLessThan(.05)
  // Radius is monotone between the collapse and readout distances (log-space, no overshoot).
  const radii = t.filter(v => v.p >= COLLAPSE_END).map(v => v.r), step = radii[radii.length - 1] - radii[0]
  expect(monotone(radii, Math.sign(step) || 1, 1e-9)).toBe(true)
})

it.each(ASPECTS)('keeps pole protection through every journey leg and has no seek-history dependence, aspect %s', aspect => {
  for (const h of FRAMES) {
    const exit = ringExit(h, aspect), sample = createJourneyCameraSampler(), out = createJourneyPose()
    const ps = Array.from({ length: 1001 }, (_, n) => .56 + .44 * n / 1000), expected = ps.map(p => flat(sample(p, aspect, h, out, exit)))
    for (const p of ps) {
      sample(p, aspect, h, out, exit)
      const view = out.target.clone().sub(out.position).normalize()
      expect(Math.abs(out.up.clone().normalize().dot(view)), 'pole ' + p).toBeLessThan(.98)
    }
    for (const indices of [ps.map((_, n) => 1000 - n), ps.map((_, n) => (n * 613) % 1001)]) for (const n of indices) expect(flat(sample(ps[n], aspect, h, out, exit))).toEqual(expected[n])
  }
})

it('a vertical (polar) endpoint borrows the other azimuth so orbit stays finite', () => {
  const sample = createJourneyCameraSampler(), out = createJourneyPose(), h = new Matrix4()
  const exit = createJourneyPose();exit.target.set(0, 0, -.1);exit.position.set(0, .3, -.1);exit.up.set(0, 0, -1)
  for (let n = 0; n <= 100; n++) {
    sample(.56 + .06 * n / 100, 1.6, h, out, exit)
    expect(flat(out).every(Number.isFinite)).toBe(true)
  }
})

it('isolation profile is at least 45 degrees from the ring exit and the fade is bound to the sweep window', () => {
  const state = createJourneySample()
  expect(sampleJourney(.585, true, state).surroundingsOpacity).toBe(1)
  expect(sampleJourney(.600, true, state).surroundingsOpacity).toBe(0)
  const h = new Matrix4(), exit = ringExit(h, 1.6), iso = isolationCamera(1.6, h, createJourneyPose())
  let d = Math.abs(spherical(iso, h).az - spherical(exit, h).az) * RAD
  if (d > 180) d = 360 - d
  expect(d).toBeGreaterThanOrEqual(45)
})
