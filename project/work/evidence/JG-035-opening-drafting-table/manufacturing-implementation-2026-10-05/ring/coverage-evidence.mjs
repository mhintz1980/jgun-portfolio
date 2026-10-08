import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { AnimationMixer, Group, LoopOnce, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const folder = fileURLToPath(new URL('.', import.meta.url))
const repo = fileURLToPath(new URL('../../../../../../', import.meta.url))
const T = await import(pathToFileURL(join(repo, 'src/scene/inspection/timeline.ts')).href)
const hash = path => createHash('sha256').update(readFileSync(join(repo, path))).digest('hex')
const paths = ['src/scene/inspection/timeline.ts', 'src/scene/inspection/timeline.test.ts', 'src/scene/inspection/lifecycle.test.ts', 'src/scene/inspection/ringGeometry.ts', 'src/scene/inspection/ringGeometry.test.ts', 'src/scene/inspection/InspectionScene.tsx', 'public/models/knurling-tool.glb']
const hashes = Object.fromEntries(paths.map(path => [path, hash(path)]))
assert.equal(hashes['public/models/knurling-tool.glb'], 'e5bff99439eb6655ea9eda3929fcca2f3e388b98c5742dcef95c371423c8fbd8')
const bytes = readFileSync(join(repo, 'public/models/knurling-tool.glb'))
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
const scene = new Group(); scene.rotation.x = Math.PI / 2; scene.add(gltf.scene)
const mixer = new AnimationMixer(gltf.scene), action = mixer.clipAction(gltf.animations[0])
action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play()
const wheels = ['KT_UPPER_KNURL_WHEEL_RH', 'KT_LOWER_KNURL_WHEEL_LH'].map(name => gltf.scene.getObjectByName(name))
const positions = wheels[0].children[0].geometry.getAttribute('position')
let minY = Infinity, maxY = -Infinity
for (let i = 0; i < positions.count; i++) { minY = Math.min(minY, positions.getY(i)); maxY = Math.max(maxY, positions.getY(i)) }
const width = maxY - minY, half = T.RING_WIDTH / 2, bandMin = -half + T.SHOULDER, bandWidth = T.RING_WIDTH - 2 * T.SHOULDER
const scaleZ = (half - T.SHOULDER - width / 2) / ((T.RING_WIDTH - width) / 2)
const step = .0005, bins = 360, frame = T.newFrame(), point = new Vector3()
const slices = Array.from({ length: 257 }, (_, i) => ({ z: bandMin + bandWidth * (i + .5) / 257, sweep: 0, lastAngle: NaN, hits: new Uint8Array(bins), revealedAt: null, sweepAtReveal: null, binsAtReveal: null, legacySweepAtReveal: null }))
const contacts = wheels.map(() => ({ clearance: 0, z: 0, azimuth: 0 }))
for (let tick = 0; T.CONTACT_START + tick * step <= T.CONTACT_END; tick++) {
  const time = T.CONTACT_START + tick * step
  T.sampleInspection(time, frame); mixer.setTime(frame.clipTime); scene.updateMatrixWorld(true)
  wheels.forEach((wheel, i) => {
    point.setFromMatrixPosition(wheel.matrixWorld)
    contacts[i].clearance = Math.hypot(point.x, point.y) - T.RING_RADIUS - T.WHEEL_RADIUS
    contacts[i].z = point.z * scaleZ
    contacts[i].azimuth = Math.atan2(point.y, point.x)
  })
  for (const slice of slices) {
    const engaged = contacts.every(c => Math.abs(c.clearance) < 2e-6 && Math.abs(c.z - slice.z) <= width / 2)
    if (engaged) {
      if (!Number.isNaN(slice.lastAngle)) slice.sweep += frame.angle - slice.lastAngle
      slice.lastAngle = frame.angle
      for (const c of contacts) {
        const a = ((c.azimuth - frame.angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
        slice.hits[Math.floor(a / (2 * Math.PI) * bins)] = 1
      }
    } else slice.lastAngle = NaN
    if (slice.legacySweepAtReveal === null && T.odMask(T.RING_RADIUS, slice.z, 0, T.RING_RADIUS, half, Math.max(0, Math.min(1, (time - T.TRAVERSE_START) / 2)))) {
      // The rejected producer ran at 0.11 rad/s throughout this same contact interval.
      slice.legacySweepAtReveal = slice.sweep / T.SPIN_RATE * .11
    }
    if (slice.revealedAt === null && T.odMask(T.RING_RADIUS, slice.z, 0, T.RING_RADIUS, half, frame.knurl)) {
      slice.revealedAt = time; slice.sweepAtReveal = slice.sweep
      slice.binsAtReveal = slice.hits.reduce((sum, hit) => sum + hit, 0)
      assert.ok(slice.sweepAtReveal >= Math.PI, `incomplete paired sweep at z=${slice.z}`)
      assert.equal(slice.binsAtReveal, bins)
    }
  }
}
assert.ok(slices.every(s => s.revealedAt !== null))
assert.ok(slices.every(s => s.legacySweepAtReveal < Math.PI))
const checkpoints = [0, 2.8, 3.8, 4.2, 4.455, 5.2, 6.2, T.FORMING_END, T.CONTACT_END, 7.7, 8.2, 9.3, 10.5, 12].map(time => ({ ...T.sampleInspection(time, frame) }))
const coverage = {
  measuredRollerWidth: width, bandWidth, axialFeed: (bandWidth - width) / 2,
  slices: slices.length, angularBins: bins, sampleStep: step,
  minSweepAtReveal: Math.min(...slices.map(s => s.sweepAtReveal)),
  minAngularBinsAtReveal: Math.min(...slices.map(s => s.binsAtReveal)),
  finalSliceReveal: Math.max(...slices.map(s => s.revealedAt)),
  fullBandAt: T.FORMING_END, contactEndsAt: T.CONTACT_END,
  clearanceTimeMargin: T.CONTACT_END - T.FORMING_END,
  rejectedProducer: { spin: .11, traverseSweep: .22, traverseDegrees: .22 * 180 / Math.PI, incompleteSlicesAtReveal: slices.filter(s => s.legacySweepAtReveal < Math.PI).length },
  perSlice: slices.map(({ z, revealedAt, sweepAtReveal, binsAtReveal, legacySweepAtReveal }) => ({ z, revealedAt, sweepAtReveal, binsAtReveal, legacySweepAtReveal })),
}
const runCheck = (name, executable, args) => {
  const result = spawnSync(executable, args, { cwd: repo, encoding: 'utf8', windowsHide: true })
  writeFileSync(join(folder, `${name}.log`), `command: ${executable} ${args.join(' ')}\nexitCode: ${result.status}\n${result.stdout ?? ''}${result.stderr ?? ''}`)
  assert.equal(result.error, undefined); assert.equal(result.status, 0, `${name} failed; see ${name}.log`)
  return { executable, args, exitCode: result.status }
}
const checks = {
  focusedInspection: runCheck('focused-inspection', process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'src/scene/inspection', '--reporter=json', `--outputFile=${join(folder, 'focused-inspection.json')}`]),
  typecheck: runCheck('typecheck', process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit']),
}
for (const path of paths) assert.equal(hash(path), hashes[path], `concurrent change during verification: ${path}`)
const report = { generatedAt: new Date().toISOString(), repo, hashes, checks, coverage, checkpoints, scope: 'Sampler and GLB contact proof; renderer filtering, tool opacity and fresh runtime review still require integration.' }
writeFileSync(join(folder, 'coverage-report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ generatedAt: report.generatedAt, slices: coverage.slices, minSweepAtReveal: coverage.minSweepAtReveal, minAngularBinsAtReveal: coverage.minAngularBinsAtReveal, fullBandAt: coverage.fullBandAt, contactEndsAt: coverage.contactEndsAt, rejectedProducerIncompleteSlices: coverage.rejectedProducer.incompleteSlicesAtReveal, checks: 'focused inspection + typecheck PASS' }, null, 2))
mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene)
