/** Controlled Stage 4 pit-only A/B. No camera, shader, light or progress law is swapped. */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sha = data => createHash('sha256').update(data).digest('hex')
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const match = /^--([a-z-]+)=(.*)$/.exec(arg)
  if (!match) throw new Error('Expected --url= --out= --build-dir= [--viewport=D|N]')
  return [match[1], match[2]]
}))
for (const key of ['url', 'out', 'build-dir']) if (!args[key]) throw new Error('Missing ' + key)
const viewport = args.viewport ?? 'D'
const size = viewport === 'D' ? { width: 1440, height: 900 } : { width: 390, height: 844 }
const candidateRevision = args.candidate ?? '4035be9d^'
const sourcePath = 'src/scene/drawing/sheet/portalGeometry.ts'
const candidateSource = execFileSync('git', ['show', `${candidateRevision}:${sourcePath}`], { cwd: ROOT, encoding: 'utf8' })
const currentSource = readFileSync(path.join(ROOT, sourcePath), 'utf8')
const compiled = await build({ stdin: { contents: candidateSource, resolveDir: path.join(ROOT, 'src/scene/drawing/sheet'),
  sourcefile: 'portalGeometry.candidate.ts', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const candidate = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const manifest = JSON.parse(readFileSync(path.join(args['build-dir'], '.vite/manifest.json'), 'utf8'))
const assets = Object.values(manifest).filter(item => item.file).map(item => ({ path: item.file,
  sha256: sha(readFileSync(path.join(args['build-dir'], item.file))) })).sort((a, b) => a.path.localeCompare(b.path))
mkdirSync(args.out, { recursive: true })
const browser = await launchBrowser(chromium)
const report = { schema: 'JG-038-pit-geometry-ab-v2', harnessSourceSha256: sha(readFileSync(fileURLToPath(import.meta.url))),
  createdAt: new Date().toISOString(), viewport, size,
  launch: describeLaunch(), candidateRevision, currentSourceSha256: sha(currentSource), candidateSourceSha256: sha(candidateSource),
  provenance: { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    buildDir: args['build-dir'], assets, aggregateSha256: sha(JSON.stringify(assets)) }, samples: [], served: [], assertions: [] }
const check = (name, pass, actual) => report.assertions.push({ name, pass: !!pass, actual })
try {
  const context = await browser.newContext({ viewport: size, deviceScaleFactor: viewport === 'D' ? 1 : 3,
    isMobile: viewport === 'N', reducedMotion: 'no-preference' })
  const page = await context.newPage()
  report.errors = []
  page.on('pageerror', error => report.errors.push(String(error)))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
  const url = new URL(args.url); url.searchParams.set('quality', 'full')
  for (const asset of assets) {
    const response = await context.request.get(new URL('/' + asset.path, url).href)
    report.served.push({ path: asset.path, status: response.status(), sha256: sha(await response.body()), expected: asset.sha256 })
  }
  await page.goto(url.href, { waitUntil: 'domcontentloaded' })
  report.actualViewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio }))
  check('actual viewport matches requested', report.actualViewport.width === size.width && report.actualViewport.height === size.height
    && report.actualViewport.dpr === (viewport === 'D' ? 1 : 3),
    report.actualViewport)
  await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().sheet?.baked && window.__torqueWorld?.pitInputs?.(), null, { timeout: 120000 })
  const input = await page.evaluate(() => window.__torqueWorld.pitInputs())
  const geometry = candidate.makePortalShaftGeometry(input.outline, { ringDepthsM: input.ringDepthsM })
  const positions = Array.from(geometry.wallGeometry.getAttribute('position').array)
  check('wall topology matches', JSON.stringify(Array.from(geometry.wallGeometry.index.array)) === JSON.stringify(input.indices), positions.length)
  check('lip ring remains exact', positions.slice(0, input.outline.length * 3).every((x, i) => x === input.positions[i]), input.outline.length)
  report.input = { points: input.outline.length, ringDepthsM: input.ringDepthsM, sha256: sha(JSON.stringify(input)),
    candidatePositionsSha256: sha(Buffer.from(new Float32Array(positions).buffer)) }
  geometry.wallGeometry.dispose(); geometry.closureGeometry.dispose()
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  for (const progress of [0.395, 0.408, 0.415, 0.42, 0.428, 0.435, 0.46, 0.52]) {
    await page.evaluate(y => scrollTo(0, y), Math.round(max * progress))
    await page.waitForTimeout(1400)
    const observed = await page.evaluate(candidate => ({ snapshot: window.__torqueWorld.snapshot(),
      ab: window.__torqueWorld.pitGeometryAb(candidate), pixels: window.__torqueWorld.effectsCapture() }), positions)
    const file = `${viewport}-p${progress.toFixed(3)}.png`
    const png = await page.screenshot({ path: path.join(args.out, file), animations: 'allow' })
    report.samples.push({ requested: progress, ...observed, png: { file, sha256: sha(png), bytes: png.length } })
    console.log(`${viewport} p=${progress}: geometry Δ=${observed.ab.maxVertexDeltaM}m, pixels=${observed.ab.changedPixels}, control=${observed.ab.controlChangedPixels}`)
  }
  report.renderer = await page.evaluate(() => {
    const canvas = document.querySelector('.torque-scene canvas'), gl = canvas?.getContext('webgl2')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null
  })
  check('served byte hashes match build', report.served.every(x => x.status === 200 && x.sha256 === x.expected), report.served.length)
  check('candidate geometry source differs', sha(currentSource) !== sha(candidateSource), candidateRevision)
  check('renderer reports hardware', !!report.renderer && !/swiftshader|llvmpipe|software/i.test(report.renderer), report.renderer)
  check('full tier actually rendered', report.samples.every(s => s.snapshot.opening.tier === 'full'), report.samples.map(s => s.snapshot.opening.tier))
  check('same-build control is exact', report.samples.every(s => s.ab.controlChangedPixels === 0), report.samples.map(s => s.ab.controlChangedPixels))
  check('positions restore to exact render', report.samples.every(s => s.ab.restoredChangedPixels === 0), report.samples.map(s => s.ab.restoredChangedPixels))
  check('no runtime errors', report.errors.length === 0, report.errors)
  const exposed = report.samples.filter(s => s.pixels.sampledInsidePixels > 0 && s.ab.wallVisible)
  check('aperture wall contribution observable', exposed.some(s => s.pixels.wallChangedPixels > 0), exposed.length)
  check('closure is occluded in interpreted samples', exposed.length > 0 && exposed.every(s => s.pixels.capVisiblePixels === 0 && s.pixels.closureOccluded), exposed.map(s => s.pixels.capVisiblePixels))
  report.visiblePixelContributionObserved = exposed.some(s => s.ab.changedPixels > 0)
  check('camera unchanged across isolated swap', report.samples.every(s => s.ab.cameraUnchanged), null)
  check('capture raster matches viewport aspect', report.samples.every(s => s.ab.width === 640
    && Math.abs(s.ab.height - Math.round(640 * size.height / size.width)) <= 1
    && s.pixels.width === s.ab.width && s.pixels.height === s.ab.height), report.samples.map(s => [s.ab.width, s.ab.height]))
  check('geometry contribution measured with nonzero vertex delta', report.samples.some(s => s.ab.maxVertexDeltaM > 0), report.samples[0]?.ab.maxVertexDeltaM)
} catch (error) { report.error = String(error); check('harness completed', false, String(error)) }
finally { await browser.close() }
report.pass = report.assertions.every(x => x.pass)
report.scope = 'Pit wall position attribute only under the current camera/remap. Pixel changes measure this contribution, not subjective root cause or owner acceptance.'
writeFileSync(path.join(args.out, 'pit-ab-report.json'), JSON.stringify(report, null, 2))
console.log(`${report.pass ? 'PASS' : 'FAIL'} ${report.assertions.filter(x => x.pass).length}/${report.assertions.length}; report ${args.out}/pit-ab-report.json`)
process.exitCode = report.pass ? 0 : 1
