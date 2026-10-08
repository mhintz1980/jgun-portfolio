// Focused DOM-hidden canvas capture for the missing static-shaft anchors (2026-10-06).
//
// preview-run-1 (runtime/shaft/preview-run-1) has no frame for:
//  - the cool illustrative stress scan (32.8-34.7 s; its runout frame is t=32.4, stress none),
//  - the support pair at the earlier placement under the settled supports camera
//    (camera anchors t=35.8..38.2 are identical; only t=38 was screenshotted),
//  - a completed axial wipe onto the revised smooth blank (its revised-blank frame is
//    t=23.8, mid-wipe; the wipe completes at t=25.0 with the hob still invisible).
//
// Method: CameraRig blends the inspection camera in from the narrative pose with
// ease(entryElapsed / 1.2) (src/scene/CameraRig.tsx), so every shot first waits until the
// applied three.js camera is bit-stable across reads (the blend terminal state samples the
// closed-form camera exactly), then hides DOM overlays exactly like
// scripts/verify-shaft-inspection.mjs (visibility only, canvas ancestry preserved) and
// screenshots the canvas element. One context per viewport; the dialog is re-entered if a
// target loses it. Never run while a verifier GPU run is active. The runtime session
// legitimately downloads manufacturing-core; those requests are recorded for provenance.
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const out = path.dirname(fileURLToPath(import.meta.url))
const rawDir = path.join(out, 'raw')
const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) || 'http://localhost:5199'
const onlyCase = process.argv.find(arg => arg.startsWith('--case='))?.slice(7) || null
await fs.mkdir(rawDir, { recursive: true })

const nearly = (a, b, eps = 1e-9) => Math.abs(a - b) < eps
const maxDelta = (a, b) => Math.max(...a.map((value, index) => Math.abs(value - b[index])))

const TARGETS = [
  {
    label: 'revised-blank-complete-wipe', t: 25,
    expect: p => p.shaft.teethFormed === 0 && p.shaft.teethPartial === 0 && p.shaft.hob.visible === false,
    why: 'Completed wipe onto the revised smooth blank; hob not yet visible, no teeth formed.',
  },
  {
    label: 'cool-stress', t: 34,
    expect: p => p.shaft.stress.kind === 'cool' && nearly(p.shaft.stress.mix, 1) && p.shaft.teethFormed === 10 && p.shaft.card.id === '4340-ht',
    why: 'Cool illustrative stress field at full mix inside 32.8-34.7 s, final card window 33.2-35 s.',
  },
  {
    label: 'support-before', t: 35.8,
    expect: p => p.shaft.supports.witnesses === true && p.shaft.supports.endpointHeld === false && p.shaft.teethFormed === 10,
    why: 'Settled supports camera start; schedule supportBlend=smoothstep(0.1)=0.028 (pair at the earlier placement, 0.08 mm of the 2.75 mm slide).',
  },
  {
    label: 'support-after', t: 38,
    expect: p => p.shaft.supports.witnesses === true && p.shaft.supports.endpointHeld === true,
    why: 'Same settled supports camera; supportBlend=1, endpoint held at the approved +2.75 mm placement.',
  },
]

const readCamera = page => page.evaluate(() => ({ matrixWorld: [...window.__threeCamera.matrixWorld.elements], projection: [...window.__threeCamera.projectionMatrix.elements] }))

async function stableCamera(page, timeoutMs = 300000) {
  let previous = await readCamera(page)
  const deadline = Date.now() + timeoutMs
  for (;;) {
    await page.waitForTimeout(500)
    const current = await readCamera(page)
    const same = previous.matrixWorld.every((value, index) => value === current.matrixWorld[index])
      && previous.projection.every((value, index) => value === current.projection[index])
    if (same) return current
    previous = current
    if (Date.now() > deadline) throw new Error('Camera never reached a bit-stable pose: ' + JSON.stringify(current))
  }
}

const report = {
  url, started: new Date().toISOString(),
  purpose: 'Missing static-shaft anchors: cool stress scan, support-before at the settled supports camera, completed-wipe revised blank, and a same-session support-after partner frame.',
  cases: [], failures: [],
  notes: [
    'Camera anchors (src/scene/inspection/shaft/camera.ts) are identical for t=35.8..38.2 desktop and narrow; the support pair is compared under one camera in one session after CameraRig entry blending has terminally settled.',
    'The runtime probe exposes witnesses/endpointHeld booleans, not the schedule blend; blend values above are quoted from src/scene/inspection/shaft/schedule.ts (supportPair.position = -delta*(1-blend)).',
    'DOM overlays hidden via visibility only; canvas ancestry preserved. No camera/CAD/runtime source was modified.',
    'Entry camera easing: CameraRig blends ease(entryElapsed/1.2) from the narrative pose, so each shot waits for a bit-stable matrixWorld before capturing.',
  ],
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  for (const config of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'narrow', width: 390, height: 844, isMobile: true, hasTouch: true },
  ]) {
    if (onlyCase && config.name !== onlyCase) continue
    const result = { name: config.name, shots: [], errors: [] }
    report.cases.push(result)
    const context = await browser.newContext({
      viewport: { width: config.width, height: config.height }, deviceScaleFactor: 1,
      isMobile: Boolean(config.isMobile), hasTouch: Boolean(config.hasTouch), reducedMotion: 'no-preference',
    })
    const page = await context.newPage()
    page.on('pageerror', error => result.errors.push(error.message))
    page.on('request', request => { if (/manufacturing-core|knurling-tool/i.test(request.url())) result.requests.push(request.url()) })
    result.requests = []
    try {
      await page.goto(url + '/?chapter=1&inspectionProof=1', { waitUntil: 'domcontentloaded', timeout: 120000 })
      await page.getByRole('button', { name: 'Inspect the input shaft' }).waitFor({ state: 'visible', timeout: 120000 })
      await page.waitForFunction(() => window.__rig && window.__threeRenderer && window.__telemetry?.performance?.warmReady, null, { timeout: 180000 })
      for (const target of TARGETS) {
        try {
          const active = await page.evaluate(() => window.__inspection?.active === true)
          if (!active) {
            await page.getByRole('button', { name: 'Inspect the input shaft' }).click()
          }
          await page.waitForFunction(() => window.__inspection?.active === true && window.__inspection?.status === 'ready', null, { timeout: 120000 })
          const slider = page.locator('#inspection-seek')
          const originalStep = await slider.getAttribute('step')
          await slider.evaluate(element => { element.step = 'any' })
          let probe
          try {
            await slider.fill(String(target.t))
            await page.waitForFunction(t => { const p = window.__inspection; return p?.active && p.status === 'ready' && p.playing === false && Math.abs(p.sampledTime - t) < 1e-8 && Math.abs(p.cameraSampleTime - t) < 1e-8 }, target.t, { timeout: 30000 })
          } finally {
            await slider.evaluate((element, step) => { if (step === null) element.removeAttribute('step'); else element.step = step }, originalStep)
          }
          const camera = await stableCamera(page)
          probe = await page.evaluate(() => JSON.parse(JSON.stringify(window.__inspection)))
          if (!target.expect(probe)) throw new Error('Telemetry mismatch at t=' + target.t + ': ' + JSON.stringify(probe.shaft))
          const file = 'raw-' + config.name + '-' + target.label + '.png'
          await page.evaluate(() => {
            const canvas = document.querySelector('canvas[data-engine]')
            if (!canvas) throw new Error('Live canvas missing')
            window.__staticShaftCapture = []
            for (const element of document.body.querySelectorAll('*')) {
              if (!(element instanceof HTMLElement) || element === canvas || element.contains(canvas)) continue
              window.__staticShaftCapture.push([element, element.style.visibility])
              element.style.visibility = 'hidden'
            }
          })
          let bytes
          try { bytes = await page.locator('canvas[data-engine]').screenshot({ path: path.join(rawDir, file) }) }
          finally { await page.evaluate(() => { for (const [element, visibility] of window.__staticShaftCapture) element.style.visibility = visibility; window.__staticShaftCapture = [] }) }
          const settled = await readCamera(page)
          const drift = Math.max(maxDelta(camera.matrixWorld, settled.matrixWorld), maxDelta(camera.projection, settled.projection))
          if (drift > 1e-9) throw new Error('Camera moved during capture (drift ' + drift + ')')
          result.shots.push({
            label: target.label, why: target.why, t: target.t, file, cameraDrift: drift,
            sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length,
            probe: { status: probe.status, phase: probe.phase, time: probe.time, sampledTime: probe.sampledTime, cameraSampleTime: probe.cameraSampleTime, shaft: probe.shaft },
            camera: settled,
          })
        } catch (error) {
          result.errors.push(target.label + ': ' + error.message)
          report.failures.push(config.name + '/' + target.label + ': ' + error.message)
        }
      }
      const before = result.shots.find(shot => shot.label === 'support-before')
      const after = result.shots.find(shot => shot.label === 'support-after')
      if (before && after) {
        const matrixWorldMaxDelta = maxDelta(before.camera.matrixWorld, after.camera.matrixWorld)
        const projectionMaxDelta = maxDelta(before.camera.projection, after.camera.projection)
        result.supportPair = { matrixWorldMaxDelta, projectionMaxDelta, sameCamera: matrixWorldMaxDelta < 1e-9 && projectionMaxDelta < 1e-9 }
        if (!result.supportPair.sameCamera) report.failures.push(config.name + ': support before/after cameras differ: ' + JSON.stringify(result.supportPair))
      }
      result.pass = result.errors.length === 0 && result.shots.length === TARGETS.length && (!result.supportPair || result.supportPair.sameCamera)
    } catch (error) {
      result.errors.push(error.message)
      report.failures.push(config.name + ': ' + error.message)
      result.pass = false
    }
    await context.close()
  }
} finally {
  await browser.close()
  report.completed = new Date().toISOString()
  await fs.writeFile(path.join(out, 'capture-report.json'), JSON.stringify(report, null, 2))
}
console.log(JSON.stringify({ url, cases: report.cases.map(result => ({ name: result.name, pass: result.pass, shots: result.shots.map(shot => ({ label: shot.label, t: shot.t, bytes: shot.bytes, drift: shot.cameraDrift })), supportPair: result.supportPair, requests: result.requests?.length, errors: result.errors })), failures: report.failures }, null, 2))
if (report.failures.length) process.exitCode = 1
