/** Focused diagnostic, never a full-roster or dense alias PASS. */
import { chromium } from 'playwright'
import { buildSync } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { launchConfig, describeLaunch } from './lib/browser-launch.mjs'

const arg = (name, fallback) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const url = arg('url', 'http://localhost:5297/torque-wrench/')
const out = path.resolve(arg('out', 'output/high-low-feature-proof/runtime'))
const seekOnly = process.argv.includes('--seek-only')
const widths = arg('widths', '1440,390').split(',').map(Number)
const times = arg('times', '44.4,53.1,56,57.9,60,62.25,65.4,66.9').split(',').map(Number)
const load = async entry => {
  const text = buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' }).outputFiles[0].text
  return import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`)
}
const clock = await load('src/scene/torque-wrench/InspectionDirector.ts')
const config = await load('src/scene/inspection/shaft/cascadeConfig.ts')
const schedule = await load('src/scene/inspection/shaft/schedule.ts')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
mkdirSync(out, { recursive: true })
const report = { kind: 'focused diagnostic only', url, seekOnly, browser: describeLaunch(), started: new Date().toISOString(), cases: [] }
const save = () => writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2))
function images(value, dir, prefix) {
  for (const [key, item] of Object.entries(value ?? {})) {
    if (typeof item === 'string' && item.startsWith('data:image/png;base64,')) {
      const name = `${prefix}-${key}.png`
      writeFileSync(path.join(dir, name), Buffer.from(item.split(',')[1], 'base64'))
      value[key] = name
    } else if (item && typeof item === 'object') images(item, dir, `${prefix}-${key}`)
  }
}
const browser = await chromium.launch(launchConfig())
try {
  for (const width of widths) {
    const height = width === 1440 ? 900 : 844
    const item = { width, height, errors: [], samples: [] }
    report.cases.push(item)
    const dir = path.join(out, String(width)); mkdirSync(dir, { recursive: true })
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.on('pageerror', e => item.errors.push(String(e)))
    page.on('console', message => { if (message.type() === 'error') item.errors.push(message.text()) })
    try {
      await page.goto(`${url}?quality=full`, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction(() => window.__torqueWorld?.snapshot().ready && window.__torqueWorld.snapshot().sheet?.stats?.shaderWarmReady === 1, null, { timeout: 180000 })
      const modules = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name).filter(n => /\/assets\/[^/]+\.js$/.test(n)))
      if (!modules.length) throw Error('Diagnostic requires an identified production build')
      item.modules = await Promise.all(modules.map(async u => {
        const file = path.basename(new URL(u).pathname)
        const served = hash(Buffer.from(await (await fetch(u)).arrayBuffer()))
        const local = hash(readFileSync(path.join('dist/assets', file)))
        if (served !== local) throw Error(`Stale module ${file}`)
        return { file, sha256: served }
      }))
      const seek = async (requestedProgress, expectedTime = null) => {
        // Select the nearest physically reachable integer native-scroll position.
        // Exact replay compares against its mapped progress, NOT a relaxed tolerance.
        const target = await page.evaluate(p => {
          const n = window.__torqueNarrative, range = document.documentElement.scrollHeight - innerHeight
          const idealY = n.scrollFraction(p) * range
          const candidates = [...new Set([Math.floor(idealY), Math.ceil(idealY)])].map(y => ({ y, progress: n.narrativeProgress(y / range) }))
          candidates.sort((a, b) => Math.abs(a.progress - p) - Math.abs(b.progress - p))
          return { requestedProgress: p, idealY, range, candidates, ...candidates[0] }
        }, requestedProgress)
        const before = await page.evaluate(t => {
          const frames = window.__torqueWorld.motionSample().frames
          window.scrollTo({ top: t.y, behavior: 'instant' })
          return frames
        }, target)
        if (requestedProgress >= .62 && requestedProgress < .845) await page.waitForFunction(() => window.__torqueWorld.snapshot().inspection.ready, null, { timeout: 90000 })
        await page.waitForFunction(({ target, before }) => {
          const m = window.__torqueWorld.motionSample()
          return m.frames >= before + 3 && Math.abs(m.progress - target.progress) < 2e-6
        }, { target, before }, { timeout: 20000 })
        await page.waitForTimeout(300)
        const actual = await page.evaluate(() => ({ motion: window.__torqueWorld.motionSample(), camera: window.__torqueWorld.cinematography(false).camera, renderer: window.__torqueWorld.snapshot().renderer, scrollY, liveCanvases: [...document.querySelectorAll('canvas')].filter(c => c.width > 1 && c.height > 1).length }))
        if (!actual.liveCanvases || actual.motion.frames <= before || Math.abs(actual.scrollY - target.y) > .01) throw Error('Native canvas/scroll liveness failed')
        const timeError = expectedTime === null ? null : Math.abs(actual.motion.time - expectedTime)
        if (timeError !== null && timeError > .003) throw Error(`Strict time target is unreachable: ${JSON.stringify({ target, expectedTime, actualTime: actual.motion.time, timeError })}`)
        return { target, expectedTime, timeError, ...actual }
      }
      // Compile all relevant visibility/material phases before stable comparisons.
      for (const t of [66.9, 60, 56, 53.1, 44.4]) await seek(clock.cascadeProgressAtTime(t) - .115)
      const points = times.map(time => ({ p: clock.cascadeProgressAtTime(time) - .115, time }))
      points.push(...[.825, .845, .855, .9].map(p => ({ p, time: null })))
      const featureIds = ['inputSunTeeth', 'inputSixfold', 'stage1Sun']
      for (const direction of ['forward', 'reverse']) {
        for (const point of direction === 'forward' ? points : [...points].reverse()) {
          const state = await seek(point.p, point.time)
          const sample = { direction, ...state }
          if (!seekOnly) {
            const withControls = direction === 'forward'
            const proof = await page.evaluate(({ features, withControls }) => window.__torqueWorld.cascadeProof({
              features,
              controls: withControls ? {
                positiveFullBandEquivalence: true,
                nullBandZero: true,
                functionalVsFullComparison: true,
                populationBreakdown: true,
              } : undefined,
            }), { features: featureIds, withControls })
            images(proof, dir, `${direction}-${point.time ?? point.p}`)
            sample.proof = proof
            sample.limits = config.CASCADE_ALIAS_FEATURES.filter(f => featureIds.includes(f.id)).map(f => ({ id: f.id, periods: config.featureStepPeriods(schedule.sampleFinaleDriveRate(state.motion.time) / 60, f), exactZero: proof.features[f.id].exactZero }))
          }
          item.samples.push(sample); save()
          console.log(JSON.stringify({
            width, direction, time: state.motion.time, progress: state.motion.progress,
            reachabilityError: state.motion.progress - point.p,
            features: sample.proof && Object.fromEntries(featureIds.map(id => [id, {
              identityPixels: sample.proof.features[id].identityDifference.pixels,
              beautyPixels: sample.proof.features[id].beautyDifference.pixels,
              exactZero: sample.proof.features[id].exactZero,
            }])),
            controls: sample.proof?.controls && {
              posEq: sample.proof.controls.positiveFullBandEquivalence?.passed,
              fullShaftIdPx: sample.proof.controls.positiveFullBandEquivalence?.conservativeIdentityPixels,
              nullZero: sample.proof.controls.nullBandZero?.passed,
              sharedFuncIdPx: sample.proof.controls.functionalVsFullComparison?.sharedFunctional?.identityPixels,
              variantFullIdPx: sample.proof.controls.functionalVsFullComparison?.variantFull?.identityPixels,
              popTeeth: sample.proof.controls.populationBreakdown?.inputSunTeeth && {
                studyIdPx: sample.proof.controls.populationBreakdown.inputSunTeeth.studyClone?.identityPixels,
                sourceIdPx: sample.proof.controls.populationBreakdown.inputSunTeeth.rigSource?.identityPixels,
              },
            },
            limits: sample.limits,
          }))
        }
      }
      const delta = (a, b) => Math.max(0, ...a.map((v, i) => Math.abs(v - b[i])))
      item.reverse = item.samples.filter(s => s.direction === 'reverse').map(s => {
        const f = item.samples.find(f => f.direction === 'forward' && f.target.requestedProgress === s.target.requestedProgress)
        return { progress: s.target.requestedProgress, cameraError: delta([...s.camera.position, ...s.camera.target, ...s.camera.quaternion, s.camera.fov], [...f.camera.position, ...f.camera.target, ...f.camera.quaternion, f.camera.fov]), subjectError: delta([s.motion.time, s.motion.sun, s.motion.driveAngle, ...s.motion.carriers], [f.motion.time, f.motion.sun, f.motion.driveAngle, ...f.motion.carriers]) }
      })
      item.complete = true
      item.reversePass = item.reverse.every(x => x.cameraError < 1e-5 && x.subjectError < 1e-5)
      await page.screenshot({ path: path.join(dir, 'final.png') })
    } catch (e) { item.error = String(e); console.log(item.error) }
    finally { await context.close(); save() }
  }
} finally { await browser.close() }
report.finished = new Date().toISOString()
report.executionComplete = report.cases.every(c => c.complete && c.reversePass && !c.errors.length)
report.aliasAccepted = false // Focused samples cannot establish dense per-frame acceptance.
save()
console.log(JSON.stringify({ out, executionComplete: report.executionComplete, aliasAccepted: false }))
process.exitCode = report.executionComplete ? 0 : 1
