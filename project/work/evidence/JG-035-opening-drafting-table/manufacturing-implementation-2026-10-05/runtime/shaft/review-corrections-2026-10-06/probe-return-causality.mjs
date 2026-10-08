import { build } from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = process.cwd()
const source = path.join(root, 'src/scene/inspection/shaft/kinematics.ts')
const result = await build({ entryPoints: [source], bundle: true, platform: 'node', format: 'esm', write: false })
const kin = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const progResult = await build({ entryPoints: [path.join(root, 'src/scene/inspection/shaft/progression.ts')], bundle: true, platform: 'node', format: 'esm', write: false })
const prog = await import(`data:text/javascript;base64,${Buffer.from(progResult.outputFiles[0].text).toString('base64')}`)
const frame = kin.createShaftKinematicsFrame()
const state = prog.createProgressionState()
const records = []
for (const [start, end, space] of [[2.5, 2.55, 3], [6.75, 6.8, 3], [12.05, 12.1, 3]]) {
  const at = t => { kin.sampleShaftKinematics(t, frame); kin.writeShaftProgression(frame, state); return { t, machining: frame.machining, cutting: frame.cutting, engagedSpace: frame.engagedSpace, edgeY: frame.edgeY, spaceDepth: frame.spaceDepth[space], stockRadiusAtY4: prog.progressedRadius(prog.SHAFT_ROOT_MM, 4, space * prog.SPACE_PITCH_RAD, state, 'legacy') } }
  const before = at(start), after = at(end), gains = []
  let previous = before, activeEngagementSamples = 0, cuttingStrokeSamples = 0
  for (let i = 1; i <= 10000; i++) {
    const sample = at(start + (end - start) * i / 10000)
    if (sample.cutting) cuttingStrokeSamples++
    if (sample.cutting && sample.engagedSpace >= 0) activeEngagementSamples++
    if (sample.spaceDepth > previous.spaceDepth) gains.push({ previous, current: sample })
    previous = sample
  }
  records.push({ start, end, space, before, after, stepSeconds: (end - start) / 10000, activeEngagementSamples, cuttingStrokeSamples, gains })
}
const evidence = { source, faceStartMM: prog.FACE_START_MM, probe: 'Pure current-source sampler and vertex-law CPU mirror; no browser/GPU; 10000 subdivisions per failing interval.', records }
await fs.writeFile(path.join(path.dirname(fileURLToPath(import.meta.url)), 'probe-return-causality.json'), JSON.stringify(evidence, null, 2))
console.log(JSON.stringify(evidence))
