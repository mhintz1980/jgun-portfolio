/** Analyze measured headed native-scroll frames against decoded CAD periodicity. */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const root = process.cwd()
const folders = (process.argv.length > 2 ? process.argv.slice(2) : ['output/playwright/owner-corrections/56-speed-160-warm']).map(p => path.resolve(p))
const folder = folders[0]
const measured = folders.flatMap(directory => JSON.parse(readFileSync(path.join(directory, 'measurement.json')))
  .map(run => ({ ...run, evidenceDirectory: path.relative(root, directory) })))
const features = JSON.parse(readFileSync(path.join(root, 'output/playwright/owner-corrections/56-features/summary.json')))
const cap = 158, degrees = 180 / Math.PI
const r = (.052) ** .25, ratios = [1, r, r ** 2, 0, r ** 3, r ** 4]
const integral = (time, start, end) => {
  const dt = Math.max(0, time - start), duration = end - start
  if (dt >= duration) return dt - duration / 2
  const u = dt / duration
  return duration * (u ** 3 - .5 * u ** 4)
}
// Independent frozen rate/timing contract, evaluated at actual rendered times.
function drive(time, rpm) {
  const t = Math.min(58, time), unit = rpm * Math.PI / 156
  return .05 * Math.PI * integral(t, 38.5, 38.8)
    + .45 * Math.PI * integral(t, 40.2, 40.6)
    + (unit * .8 - .5 * Math.PI) * integral(t, 42.4, 43)
    + unit * .07 * integral(t, 48.8, 49.4)
    + unit * .07 * integral(t, 51.4, 52)
    + unit * .06 * integral(t, 53.4, 54)
}
const planetParts = ['P000247', 'P000247', 'P000248', null, 'P000069', 'P003046']
const planetCounts = [4, 4, 4, 0, 4, 5]
const cageSunTeeth = [10, 9, 13, 0, 15, 0]
const names = ['stage1', 'stage2', 'stage5', 'bearing', 'stage3', 'stage4']
const counts = Object.fromEntries(features.measurements.map(m => [m.part, m.measuredCount]))
assert.deepEqual(planetParts.map(p => p && counts[p]), [12, 12, 13, null, 11, 10])
const cases = measured.map(run => {
  const recordedCap = Math.round(Math.max(...run.frames.map(f => f.inputRpm)))
  const channels = [{ name: 'input sun (10 tooth face)', halfPeriod: 18, factor: 5.2, angle: f => f.sun }]
  for (let i = 0; i < names.length; i++) {
    if (!planetCounts[i]) continue
    channels.push({ name: names[i] + ' carrier/array', halfPeriod: 180 / planetCounts[i], factor: ratios[i], angle: f => f.carriers[i] })
    if (cageSunTeeth[i]) channels.push({ name: names[i] + ' integral sun', halfPeriod: 180 / cageSunTeeth[i], factor: ratios[i], angle: f => f.carriers[i] })
    // Planet is a child of its carrier: absolute rotation = carrier + local(-3.5 carrier).
    channels.push({ name: names[i] + ' planet absolute', halfPeriod: 180 / counts[planetParts[i]], factor: 2.5 * ratios[i], angle: f => -2.5 * f.carriers[i] })
    channels.push({ name: names[i] + ' planet local', halfPeriod: 180 / counts[planetParts[i]], factor: 3.5 * ratios[i], angle: f => -3.5 * f.carriers[i] })
  }
  const rows = channels.map(channel => {
    const steps = run.frames.slice(1).map((b, i) => {
      const a = run.frames[i]
      const rawDegrees = Math.abs(channel.angle(b) - channel.angle(a)) * degrees
      const predictedRecordedDegrees = Math.abs(drive(b.time, recordedCap) - drive(a.time, recordedCap)) * channel.factor * degrees
      assert.ok(Math.abs(rawDegrees - predictedRecordedDegrees) < .00001, 'Sampler disagrees with installed rendered angles: ' + channel.name)
      return { a: a.time, b: b.time, wallGapMs: b.now - a.now, rawDegrees,
        stepDegrees: Math.abs(drive(b.time, cap) - drive(a.time, cap)) * channel.factor * degrees,
        nextRpmDegrees: Math.abs(drive(b.time, cap + 1) - drive(a.time, cap + 1)) * channel.factor * degrees }
    })
    const witness = steps.reduce((a, b) => a.stepDegrees > b.stepDegrees ? a : b)
    return { name: channel.name, halfPeriodDegrees: channel.halfPeriod, maximumDegreesPerFrame: witness.stepDegrees,
      maximumRawDegreesPerFrame: Math.max(...steps.map(s => s.rawDegrees)),
      flags: steps.filter(s => !Number.isFinite(s.stepDegrees) || s.stepDegrees >= channel.halfPeriod).length, witness }
  })
  const input = rows[0]
  // This maximum witness is in the final constant-cap plateau. Its angle
  // difference scales exactly with RPM; replay at the next integer is exact.
  assert.ok(input.witness.a >= 54 && input.witness.b <= 58)
  const nextRpmWitness = input.witness.nextRpmDegrees
  return { evidenceDirectory: run.evidenceDirectory, recordedCap, headed: run.headed === true, installation: run.installation,
    viewport: run.viewport, nominal: run.nominal, measuredFrames: run.frames.length, cadence: run.summary,
    channels: rows, pass: rows.every(c => c.flags === 0), nextWholeRpm: cap + 1, nextRpmWitnessDegrees: nextRpmWitness,
    nextWholeRpmFailsSameMeasuredCadence: nextRpmWitness >= input.halfPeriodDegrees }
})
const realTimeConfirmed = [1440, 390].every(width => cases.some(c => c.viewport.width === width && c.recordedCap === cap && c.headed
  && c.channels.every(channel => channel.maximumRawDegreesPerFrame < channel.halfPeriodDegrees)))
const result = { cap, ratio: 100, nominalFps: 60, realTimeConfirmed, method: 'All measured headed 1x intervals; independent sampler must match every recorded angle. Replay candidate and next integer at the union of observed cadences; require actual headed confirmation at selected cap on both viewports. No frame-gap exclusions.',
  ideal60HzInputStep: cap * 360 / (60 * 60), assetSha256: features.sha256After, cases,
  output55p5to58Degrees: 15 * cap / 100,
  comparisonTable: [158, 180, 330, 600, 943].map(inputRpm => ({ inputRpm, outputDegreesAt100to1: 15 * inputRpm / 100 })),
  pass: cases.length >= 2 && [1440, 390].every(width => cases.some(c => c.viewport.width === width))
    && realTimeConfirmed && cases.every(c => c.pass) && cases.some(c => c.nextWholeRpmFailsSameMeasuredCadence),
  limits: 'Numerical temporal-alias evidence at this measured nominal pace and cadence; no universal guarantee for faster scrolling, cold shader stalls or arbitrary display scheduling. Owner visual acceptance remains open.' }
writeFileSync(path.join(folder, 'analysis.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ ...result, cases: cases.map(c => ({ ...c, channels: undefined })) }, null, 2))
assert.ok(result.pass, 'Measured artifact bound or next-integer bracket failed')
