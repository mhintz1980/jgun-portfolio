/**
 * JG-038 Stage 4 opening recovery A/B.
 *
 * Two independent measurements, both matched-input:
 *   1. Offline camera-law A/B: the working-tree `sheetCamera.ts` versus the recovered
 *      pre-close-reading-rework version extracted from git, evaluated over the SAME
 *      layout, aspect and intro times. This isolates the camera/remap change from pit
 *      geometry before any cause is attributed.
 *   2. Live runtime capture: canonical opening telemetry plus unaltered PNGs from the
 *      real private page, with measured invariant checks.
 *
 * Usage: node scripts/verify-torque-opening-ab.mjs --url=http://localhost:<port>/torque-wrench/
 *        --out=<new evidence dir> --build-dir=<worktree .scratch production build>
 *        [--viewport=D|N] [--candidate=<git rev>^]
 *
 * This script closes no gate and infers no owner or Astra acceptance.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sha256 = data => createHash('sha256').update(data).digest('hex')
const finite = x => typeof x === 'number' && Number.isFinite(x)

const VIEWPORTS = {
  D: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  N: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true },
}

// Canonical progress samples across drafting -> pressure -> rupture -> emergence -> close handoff.
const SAMPLES = [0, 0.06, 0.15, 0.265, 0.32, 0.36, 0.395, 0.408, 0.415, 0.42, 0.428, 0.435, 0.46, 0.52]
// Intro times (0..1) the camera law is compared at, matched for both sides.
const INTRO_TIMES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.79, 0.84, 0.92, 1]

function parseArgs(argv) {
  const args = { viewport: 'D', candidate: '8988c2da^' }
  for (const raw of argv) {
    const m = /^--([a-z-]+)=(.*)$/i.exec(raw)
    if (!m || !['url', 'out', 'build-dir', 'viewport', 'candidate'].includes(m[1])) {
      throw new Error('usage: --url=... --out=... --build-dir=... [--viewport=D|N] [--candidate=<rev>]')
    }
    args[m[1] === 'build-dir' ? 'buildDir' : m[1]] = m[2]
  }
  for (const key of ['url', 'out', 'buildDir']) if (!args[key]) throw new Error('--' + key + ' is required')
  if (!VIEWPORTS[args.viewport]) throw new Error('--viewport must be D or N')
  return args
}

async function bundle(entryOrSource, resolveDir) {
  const options = typeof entryOrSource === 'string' && resolveDir
    ? { stdin: { contents: entryOrSource, resolveDir, sourcefile: 'sheetCamera.candidate.ts', loader: 'ts' } }
    : { entryPoints: [entryOrSource] }
  const result = await build({ ...options, bundle: true, platform: 'node', format: 'esm', write: false })
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
}

async function cameraLawAb(candidateRev) {
  const currentPath = path.join(ROOT, 'src/scene/drawing/sheetCamera.ts')
  const currentSource = readFileSync(currentPath, 'utf8')
  const candidatePath = path.join(ROOT, '.scratch/jg038-ab/sheetCamera.candidate.ts')
  mkdirSync(path.dirname(candidatePath), { recursive: true })
  const candidateSource = execFileSync('git', ['show', `${candidateRev}:src/scene/drawing/sheetCamera.ts`], { cwd: ROOT, encoding: 'utf8' })
  writeFileSync(candidatePath, candidateSource)

  const drawingDir = path.join(ROOT, 'src/scene/drawing')
  const [current, candidate, geometry, three] = await Promise.all([
    bundle(currentPath), bundle(candidateSource, drawingDir), bundle(path.join(drawingDir, 'drawingGeometry.ts')), import('three'),
  ])

  // One shared layout for both sides: the comparison isolates the camera law.
  const bounds = new three.Box3(new three.Vector3(-0.4, -0.25, 0), new three.Vector3(0.4, 0.25, 0.012))
  const rows = []
  for (const aspect of [1440 / 900, 390 / 844]) {
    const layout = geometry.makeDrawingLayout(aspect, bounds)
    for (const t of INTRO_TIMES) {
      const a = current.introCameraPose(layout, aspect, t, { position: new three.Vector3(), target: new three.Vector3(), up: new three.Vector3(0, 1, 0), fov: 34, ortho: 0, distance: 1 })
      const b = candidate.introCameraPose(layout, aspect, t, { position: new three.Vector3(), target: new three.Vector3(), up: new three.Vector3(0, 1, 0), fov: 34, ortho: 0, distance: 1 })
      rows.push({
        aspect: Number(aspect.toFixed(4)), introTime: t,
        current: { position: a.position.toArray(), target: a.target.toArray(), fov: a.fov },
        candidate: { position: b.position.toArray(), target: b.target.toArray(), fov: b.fov },
        deltaMetres: a.position.distanceTo(b.position),
        targetDeltaMetres: a.target.distanceTo(b.target),
        fovDeltaDegrees: Math.abs(a.fov - b.fov),
      })
    }
  }
  const maxPosition = Math.max(...rows.map(r => r.deltaMetres))
  const maxTarget = Math.max(...rows.map(r => r.targetDeltaMetres))
  const maxFov = Math.max(...rows.map(r => r.fovDeltaDegrees))
  return {
    candidateRevision: candidateRev,
    currentSheetCameraSha256: sha256(currentSource),
    candidateSheetCameraSha256: sha256(candidateSource),
    note: 'Candidate source is evaluated with the current sibling modules; only the sheetCamera law differs.',
    rows, maxPositionDeltaMetres: maxPosition, maxTargetDeltaMetres: maxTarget, maxFovDeltaDegrees: maxFov,
    identical: maxPosition === 0 && maxTarget === 0 && maxFov === 0,
  }
}

async function runtimeCapture(browser, args, provenance) {
  const viewport = VIEWPORTS[args.viewport]
  const { width, height, ...device } = viewport
  const context = await browser.newContext({ viewport: { width, height }, ...device, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push({ kind: 'pageerror', message: String(e) }))
  page.on('console', m => { if (m.type() === 'error') errors.push({ kind: 'console', message: m.text() }) })
  const result = { viewport, samples: [], artifacts: [], errors, assertions: [] }
  const check = (name, pass, actual) => result.assertions.push({ name, pass: Boolean(pass), actual })
  try {
    const url = new URL(args.url)
    url.searchParams.set('quality', 'full')
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => {
      const s = window.__torqueWorld?.snapshot?.()
      return s?.ready && s.sheet?.baked && s.opening && document.querySelector('.torque-scene canvas')
    }, null, { timeout: 120000 })

    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    for (const p of SAMPLES) {
      await page.evaluate(y => scrollTo(0, y), Math.round(max * p))
      await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().frames > 0, null, { timeout: 15000 })
      await page.waitForTimeout(1200)
      const obs = await page.evaluate(() => {
        const s = window.__torqueWorld.snapshot()
        return { progress: s.progress, camera: s.camera, opening: s.opening, renderer: s.renderer,
          narrative: window.__torqueNarrative?.snapshot?.() ?? null }
      })
      const png = await page.screenshot({ path: path.join(args.out, `${args.viewport}-p${p.toFixed(3)}.png`), animations: 'allow' })
      const file = `${args.viewport}-p${p.toFixed(3)}.png`
      result.artifacts.push({ file, bytes: png.length, sha256: sha256(png) })
      result.samples.push({ requested: p, ...obs })
    }

    const opening = result.samples.map(s => s.opening)
    check('every sample exposes finite opening telemetry', opening.every(o => o && finite(o.pressure) && finite(o.fracture)
      && finite(o.t) && finite(o.waveTime) && finite(o.lightSweep)), opening.map(o => o?.t))
    check('bake crossing solved and installed', finite(opening[0]?.crossing) && opening.every(o => o.bakeInstalled === true), opening[0]?.crossing)
    const pressures = opening.map(o => o.pressure)
    check('pressure is monotone non-decreasing across the walk', pressures.every((v, i) => i === 0 || v >= pressures[i - 1] - 1e-9), pressures)
    // Evaluate the opacity claim where the bulge is actually mid-stroke, not at a boundary sample.
    const midBulgeSample = result.samples
      .filter(s => s.opening.pressure > 0 && s.opening.pressure < 1)
      .sort((a, b) => b.opening.pressure - a.opening.pressure)[0]
    check('paper still opaque part-way through the model-driven bulge', midBulgeSample
      && midBulgeSample.opening.openingClear === 0 && midBulgeSample.opening.fracture < 1,
      midBulgeSample && { requested: midBulgeSample.requested, t: midBulgeSample.opening.t, openingClear: midBulgeSample.opening.openingClear, fracture: midBulgeSample.opening.fracture })
    check('bulge window is actually sampled', Boolean(midBulgeSample), midBulgeSample?.requested ?? null)
    const atDraft = result.samples.find(s => s.requested === 0.15)?.opening
    check('intact paper before the push (fracture 0, no opening)', atDraft && atDraft.fracture === 0 && atDraft.openingClear === 0, atDraft && { fracture: atDraft.fracture, openingClear: atDraft.openingClear })
    const atEmergence = result.samples.find(s => s.requested === 0.46)?.opening
    check('opening complete at the emergence handoff', atEmergence && atEmergence.openingClear === 1, atEmergence && { openingClear: atEmergence.openingClear, fracture: atEmergence.fracture })
    check('camera pose finite at every sample', result.samples.every(s => s.camera && s.camera.position.every(finite) && finite(s.camera.fov)), result.samples.length)
    check('renderer reports hardware-class backend', result.samples.every(s => s.renderer && s.renderer.calls > 0), result.samples.at(-1)?.renderer)
    check('no page or console errors during the walk', errors.length === 0, errors)
    check('unaltered PNG captured for every sample', result.artifacts.length === SAMPLES.length, result.artifacts.length)
  } catch (error) {
    result.errors.push({ kind: 'harness', message: String(error) })
    check('harness completed', false, String(error))
  } finally {
    await page.close(); await context.close()
  }
  result.pass = result.assertions.length > 0 && result.assertions.every(a => a.pass)
  result.failed = result.assertions.filter(a => !a.pass).map(a => a.name)
  return result
}

const args = parseArgs(process.argv.slice(2))
mkdirSync(args.out, { recursive: true })

const files = []
const manifest = JSON.parse(readFileSync(path.join(args.buildDir, '.vite/manifest.json'), 'utf8'))
const entry = Object.values(manifest).find(v => v.isEntry && /torque-wrench/.test(v.file))?.file
if (!entry) throw new Error('torque-wrench entry missing from the build manifest')
for (const [key, value] of Object.entries(manifest)) {
  if (value.file) files.push({ key, path: value.file, sha256: sha256(readFileSync(path.join(args.buildDir, value.file))) })
}
const provenance = { buildDir: args.buildDir, entry,
  aggregateSha256: sha256(JSON.stringify(files.map(f => f.path).sort())), fileCount: files.length }

const ab = await cameraLawAb(args.candidate)
const browser = await launchBrowser((await import('playwright')).chromium)
let runtime
try { runtime = await runtimeCapture(browser, args, provenance) } finally { await browser.close() }

const report = {
  schema: 'JG-038-stage4-opening-ab-v1', startedAt: new Date().toISOString(),
  url: args.url, launch: describeLaunch(), provenance, cameraLawAb: ab, runtime,
  scope: 'Measured camera-law A/B and live opening telemetry/PNG capture only. No pit-geometry attribution, no gate closure, no owner or Astra acceptance.',
}
const outFile = path.join(args.out, 'opening-ab-report.json')
writeFileSync(outFile, JSON.stringify(report, null, 2))
console.log('camera-law A/B max deltas: position ' + ab.maxPositionDeltaMetres.toFixed(6) + ' m, target '
  + ab.maxTargetDeltaMetres.toFixed(6) + ' m, fov ' + ab.maxFovDeltaDegrees.toFixed(4) + ' deg; identical=' + ab.identical)
console.log('runtime: ' + (runtime.pass ? 'PASS' : 'FAIL') + ' (' + runtime.assertions.filter(a => a.pass).length + '/' + runtime.assertions.length + ' assertions)')
if (runtime.failed.length) console.log('failed: ' + runtime.failed.join(' | '))
console.log('report: ' + outFile)
process.exit(runtime.pass ? 0 : 1)
