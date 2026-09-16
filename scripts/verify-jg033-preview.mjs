import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { compare } from './lib/preview-pixels.mjs'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs')
const out = process.env.OUT || 'output/playwright/quiet-machine'
const base = process.env.BASE_URL || 'http://localhost:4173'
const composer = process.env.COMPOSER || ''
fs.mkdirSync(out, { recursive: true })
const hash = b => crypto.createHash('sha256').update(b).digest('hex')
const percentile = (values, q) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * q)]
// Owner ruling 2026-09-11, restated here independently of the implementation.
const RULING = {
  keep: ['V2RL300-SAF-RES-1020-SAFE-1', 'RL300-PEM-1001-1', 'RL300-EMG-1001-P-1'],
  hide: ['MirrorRL200-AFS-2001-2', 'RL300-AFS-2003-5', 'V23028T25_Weld-on Tie-Down Ring-1',
    'V23028T25_Weld-on Tie-Down Ring-2', 'V2RL300-WO-NP-SAFE-1',
    'V2EDW-60335 (Fuel Tank Weld On Flange)-1', 'V2SKF-TB-2200-01-1',
    'V2MSP-MID-5406HHP24 ~-1', 'V2MSP-MID-5406HHP24 ~-3', 'V2SKF-TB-2200-01-2',
    'V2SKF-TB-2250-01-1', 'V2SKF-TB-2250-01-2', 'ISO_MOUNT_4', 'ISO_MOUNT_5', 'ISO_MOUNT_6',
    'V2EDW-60335 (Fuel Tank Weld On Flange)-2', 'V2EDW-60335 (Fuel Tank Weld On Flange)-3',
    'V2WISC-4770-7-1'],
  delete: ['12335A81_Oil-Resistant Push-on Seal with Bulb-1'],
  section: ['V2SKF-TB-5500-03-1', 'V2SKF-TB-5500-03-2'],
}
const FULL_CUT = -.15 // DEEPEST_CUT in src/scene/rl300/shot.ts — the sequence minimum, not evaluateShot(1)
function assertRuling(parts) {
  const seen = {}
  for (const [policy, names] of Object.entries(RULING)) for (const name of names) {
    const part = parts[name]
    assert(part, `ruled part missing from the prepared model: ${name}`)
    assert(part.triangles > 0, `ruled part contributes no geometry: ${name}`)
    assert.equal(part.policy, policy, `wrong section policy on ${name}`)
    if (policy === 'keep') {
      assert.equal(part.clipped, false, `${name} must survive the cut whole`)
      assert.equal(part.repainted, false, `${name} must keep its equipment finish, not the shell blue`)
    } else if (policy === 'delete') {
      // Ruled out of the assembly: absent at every progress, closed exterior included.
      assert.equal(part.removed, true, `${name} must not be built at all`)
    } else {
      assert.equal(part.clipped, true, `${name} must be cut by the section plane`)
      // Gone at the finished cut: either the plane reaches it, or it was dropped outright.
      if (policy === 'hide') assert(part.removed || part.xMin > FULL_CUT, `${name} survives the finished cut (xMin ${part.xMin})`)
      else assert(part.xMin < FULL_CUT && part.xMax > FULL_CUT, `${name} must straddle the finished cut`)
    }
    seen[name] = { policy: part.policy, removed: part.removed, triangles: part.triangles, xMin: part.xMin, xMax: part.xMax }
  }
  return seen
}
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
const report = { capturedAt: new Date().toISOString(), build: hash(fs.readFileSync('dist/index.html')), asset: hash(fs.readFileSync('public/models/msp-enclosure.glb')), captures: [], checks: {}, errors: [] }
report.liteAsset = hash(fs.readFileSync('public/models/rl300-lite.glb'))
report.composer = composer || 'direct'
let fullParts
let fullCapTriangles
async function seek(page, u) {
  const frame = await page.evaluate(u => { const q = window.__quietMachine; const f = q.frame; q.seek(u); return f }, u)
  await page.waitForFunction(f => window.__quietMachine.frame > f, frame)
  await page.waitForFunction(u => Number(document.querySelector('input[type=range]').value) === Math.round(u * 1000), u)
}
try {
  for (const [name, width, height, quality] of [['desktop', 1440, 900, 'full'], ['portrait', 390, 844, 'full'], ['tablet', 768, 1024, 'full'], ['lite', 390, 844, 'lite']]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    page.on('pageerror', e => report.errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
    const response = await page.goto(`${base}/?study=rl300&quality=${quality}&composer=${composer}`, { waitUntil: 'networkidle' })
    assert.equal(hash(await response.body()), report.build, 'served HTML must be the identified build')
    const assetResponse = await page.request.get(`${base}/models/${quality === 'lite' ? 'rl300-lite' : 'msp-enclosure'}.glb`)
    assert.equal(hash(await assetResponse.body()), quality === 'lite' ? report.liteAsset : report.asset, 'served CAD asset must match the local hash')
    await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
    const parts = await page.evaluate(() => window.__quietMachine.parts)
    report.checks.ruledParts = assertRuling(parts)
    if (quality === 'full') fullParts = parts
    else for (const [part, expected] of Object.entries(fullParts)) {
      assert.equal(parts[part].triangles, expected.triangles, `lite must preserve ruled geometry: ${part}`)
      for (const bound of ['xMin', 'xMax']) assert(Math.abs(parts[part][bound] - expected[bound]) < .0001, `lite part bounds: ${part}/${bound}`)
    }
    const images = {}
    const planes = {}
    // Shot anchors, not arbitrary stops: 01 closed exterior, 02 the incision, 04 the lower
    // intake, 07 the closed resolve. u = 1 is a CLOSED shell now — the section reopens only
    // in between — so a capture there proves the sequence returns, it is not a section view.
    for (const [shot, u] of [['exterior', 0], ['section', .2], ['intake', .51], ['resolve', 1],
      ['reverse-intake', .51], ['reverse-section', .2], ['reverse-exterior', 0]]) {
      await seek(page, u)
      images[shot] = await page.screenshot({ path: path.join(out, `${name}-${shot}.png`) })
      const telemetry = await page.evaluate(() => JSON.parse(JSON.stringify(window.__quietMachine)))
      planes[shot] = telemetry.cutPlane
      // Framing gate. The model AABB is a loose bound on the silhouette, so a detail shot
      // legitimately overflows — but the two closed-shell anchors are "the object", and the
      // object has to be inside the frame. Worst measured margin: 0.93 (desktop y at 01).
      const ndc = { x: telemetry.projection.map(p => p[0]), y: telemetry.projection.map(p => p[1]) }
      const worst = Math.max(...ndc.x.map(Math.abs), ...ndc.y.map(Math.abs))
      if (shot === 'exterior' || shot === 'resolve') assert(worst <= 1, `${name}/${shot}: the whole object must be in frame (ndc ${worst.toFixed(3)})`)
      assert(worst <= 2, `${name}/${shot}: camera is inside the machine (ndc ${worst.toFixed(3)})`)
      assert.equal(telemetry.stencilBits, 8)
      assert.equal(telemetry.capTarget.stencilBits, 8)
      assert.equal(telemetry.capTarget.complete, true)
      assert.equal(telemetry.capTarget.offscreen, composer === '1' || composer === '4')
      if (composer === '4') assert.equal(telemetry.capTarget.samples, 4)
      if (quality === 'lite') assert(telemetry.counts.keptTriangles < 248000, 'lite CAD geometry leaves room for intake/environment under 250k')
      if (quality === 'full') fullCapTriangles = telemetry.counts.cappedTriangles
      else assert.equal(telemetry.counts.cappedTriangles, fullCapTriangles, 'lite must preserve every cap-counting triangle')
      assert(telemetry.drawCalls < (quality === 'lite' ? 90 : 150))
      // Liner (108) + airway helper (28) + whatever the ruling removed outright, nothing else.
      assert.equal(telemetry.counts.sourceTriangles - telemetry.counts.keptTriangles,
        108 + 28 + telemetry.counts.removedTriangles, 'only liner, airway helper and ruled removals omitted')
      assert.equal(telemetry.counts.removedTriangles, 460, 'removals must be exactly the ruled push-on seal')
      report.captures.push({ name, shot, telemetry })
      // 07 resolves back to the 01 frame; the poster set stays the three distinct looks.
      if (name === 'desktop' && !shot.startsWith('reverse') && shot !== 'resolve' && process.env.CAPTURE_POSTERS === '1') {
        fs.mkdirSync('public/images', { recursive: true })
        await page.locator('.qm-stage').screenshot({ path: `public/images/rl300-${shot}-preview.png` })
      }
    }
    const reverse = {
      section: compare(images.section, images['reverse-section']),
      intake: compare(images.intake, images['reverse-intake']),
      exterior: compare(images.exterior, images['reverse-exterior']),
    }
    assert(Object.values(reverse).every(r => r.fraction < .0001), 'reverse must reproduce the rendered frame')
    // The sequence closes what it opened: 07 must land back on the 01 shell, not on a cut.
    assert(Math.abs(planes.resolve - planes.exterior) < 1e-9, 'resolve must return the section to the closed exterior plane')
    assert(planes.section < planes.exterior && planes.intake < planes.section, 'the cut must deepen from 01 through 04')
    assert(planes.intake >= FULL_CUT - 1e-9, 'no shot may cut past the plane geometry was deleted against')
    await seek(page, .52)
    const capOn = await page.locator('.qm-stage').screenshot()
    await page.evaluate(() => window.__quietMachine.setCaps(false))
    const capOff = await page.locator('.qm-stage').screenshot({ path: path.join(out, `${name}-section-no-caps.png`) })
    const capPixels = compare(capOn, capOff)
    assert(capPixels.changed > 2 && capPixels.fraction < .06, 'caps must be visible but cannot fill a large sheet')
    await page.evaluate(() => window.__quietMachine.setCaps(true))
    await seek(page, 0)
    const closedOn = await page.locator('.qm-stage').screenshot()
    await page.evaluate(() => window.__quietMachine.setCaps(false))
    const closedCaps = compare(closedOn, await page.locator('.qm-stage').screenshot())
    assert(closedCaps.fraction < .0001, 'closed exterior must have no stray caps')
    await page.evaluate(() => window.__quietMachine.setCaps(true))
    const samples = await page.evaluate(async () => {
      const times = [], cpu = [], q = window.__quietMachine
      for (let i = 0; i < 90; i++) {
        const start = performance.now(), frame = q.frame
        q.seek(.2 + .3 * (i / 89))
        while (q.frame === frame) await new Promise(requestAnimationFrame)
        times.push(performance.now() - start); cpu.push(q.renderCpuMs)
      }
      return { times: times.slice(10), cpu: cpu.slice(10) }
    })
    await seek(page, .52)
    const before = await page.evaluate(() => window.__quietMachine.frame)
    await page.waitForTimeout(350)
    const idleFrames = await page.evaluate(before => window.__quietMachine.frame - before, before)
    assert(idleFrames <= 1, 'resting scene should stop rendering')
    await page.getByRole('slider', { name: 'Section reveal' }).focus(); await page.keyboard.press('ArrowRight')
    await page.waitForFunction(() => window.__quietMachine.u > .52)
    await page.mouse.wheel(0, height); await page.waitForTimeout(120)
    assert(await page.evaluate(() => scrollY > 0), 'native page scroll must remain usable')
    report.checks[name] = { reverse, capPixels, closedCaps, idleFrames, frameResponseMs: { p50: percentile(samples.times, .5), p95: percentile(samples.times, .95) }, renderCpuMs: { p50: percentile(samples.cpu, .5), p95: percentile(samples.cpu, .95) } }
    await page.close()
  }
  if (process.env.CAPTURE_POSTERS !== '1') {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await p.goto(`${base}/?study=rl300`); await p.waitForFunction(() => window.__quietMachine?.ready)
    assert.equal(await p.evaluate(() => window.__quietMachine.u), .52)
    await p.mouse.wheel(0, 900); await p.waitForTimeout(120)
    assert.equal(await p.evaluate(() => window.__quietMachine.u), .52)
    await p.getByRole('button', { name: 'Exterior', exact: true }).click()
    await p.waitForFunction(() => window.__quietMachine.u === 0)
    await p.setViewportSize({ width: 768, height: 1024 }); await p.waitForTimeout(100)
    assert(await p.evaluate(() => window.__quietMachine.camera.every(Number.isFinite)))
    await p.evaluate(() => document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
    await p.waitForSelector('.qm-poster img')
    await p.waitForFunction(() => document.querySelector('.qm-poster img')?.naturalWidth > 0)
    report.checks.reducedMotionAndContextLoss = 'pass: fixed pose, explicit controls, resize, static fallback'
    await p.close()
    for (const scenario of ['poster', 'asset-failure', 'lite-asset-failure']) {
      const page = await browser.newPage()
      if (scenario === 'asset-failure') await page.route('**/models/msp-enclosure.glb', route => route.abort())
      if (scenario === 'lite-asset-failure') await page.route('**/models/rl300-lite.glb', route => route.abort())
      await page.goto(`${base}/?study=rl300${scenario === 'poster' ? '&quality=poster' : scenario === 'lite-asset-failure' ? '&quality=lite' : ''}`)
      await page.waitForSelector('.qm-poster img')
      await page.waitForFunction(() => document.querySelector('.qm-poster img')?.naturalWidth > 0)
      assert.equal(await page.locator('canvas').count(), 0)
      await page.getByRole('button', { name: 'Lower intake', exact: true }).click()
      await page.waitForFunction(() => document.querySelector('.qm-poster img')?.src.includes('intake'))
      report.checks[scenario] = 'pass: readable poster views without a canvas'
      await page.close()
    }
  }
  assert.equal(report.errors.length, 0)
} catch (e) { report.failure = String(e); process.exitCode = 1 }
finally { await browser.close(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)) }
console.log(JSON.stringify({ failure: report.failure, build: report.build, composer: report.composer,
  ruledParts: Object.keys(report.checks.ruledParts || {}).length,
  checks: Object.fromEntries(Object.entries(report.checks).filter(([key]) => key !== 'ruledParts')), errors: report.errors }, null, 2))
