/** Browser-only stages 1–3 evidence. No app mutations. Run again with --label=integration.
 * node scripts/verify-jgun-opening.mjs [--label=baseline] [--case=desktop]
 * Each run gets its own directory; failures still preserve JSON and screenshots.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (key, fallback) => process.argv.find(x => x.startsWith(`--${key}=`))?.split('=').slice(1).join('=') ?? fallback
const label = arg('label', 'baseline').replace(/[^a-z0-9_-]/gi, '-')
const url = arg('url', 'http://127.0.0.1:5198')
const out = path.join(root, 'project/work/evidence/JG-035-opening-drafting-table/stages-1-3-2026-09-26', `${label}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
fs.mkdirSync(out, { recursive: true })
const save = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n')
const report = { url, label, started: new Date().toISOString(), browser: 'installed Playwright, channel chrome', coldLoadDefinition: 'fresh browser context; HTTP cache disabled; elapsed navigation to proof, annotations, sheet stats and live WebGL draws ready (OS/server caches uncontrolled)', thresholds: { scrollProgress: 0.001, reverseNumericDelta: 0.002, pulseRegistrationMetres: 0.001, registeredHoldPixels: 0.1, flexPeakDisplacementMetres: 0.003 }, cases: [] }
// Fast mode (--quick): desktop + narrow only, forward checkpoints, one registration probe per
// checkpoint instead of two samples, no reverse pass and no reduced-motion static waits.
// Use for iteration; a --quick pass never replaces a full run as "done" evidence.
const quick = !!arg('quick', '') || process.argv.includes('--quick')
try { report.gitStart = execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }) } catch {}
const cases = [
  { name: 'desktop', width: 1600, height: 900, reducedMotion: 'no-preference' },
  { name: 'narrow', width: 390, height: 844, reducedMotion: 'no-preference' },
  { name: 'desktop-reduced', width: 1600, height: 900, reducedMotion: 'reduce' },
  { name: 'narrow-reduced', width: 390, height: 844, reducedMotion: 'reduce' },
  // Forced after load through the proof hook: the real tier ratchet, not a synthetic uniform.
  { name: 'desktop-lite', width: 1600, height: 900, reducedMotion: 'no-preference', forceTier: 'lite' },
  { name: 'narrow-lite', width: 390, height: 844, reducedMotion: 'no-preference', forceTier: 'lite' },
].filter(c => !arg('case', '') || c.name === arg('case', ''))
// Quick default set replaces the full roster unless --case picks one explicitly.
if (quick && !arg('case', '')) {
  cases.length = 0
  cases.push({ name: 'desktop', width: 1600, height: 900, reducedMotion: 'no-preference' }, { name: 'narrow', width: 390, height: 844, reducedMotion: 'no-preference' })
}
if (!cases.length) throw new Error('Unknown --case')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  report.browserVersion = browser.version()
  for (const config of cases) {
    const result = { ...config, checkpoints: [], errors: [], warnings: [], requestFailures: [], httpErrors: [], failures: [], reverse: [] }
    report.cases.push(result)
    const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, reducedMotion: config.reducedMotion, deviceScaleFactor: 1, serviceWorkers: 'block' })
    const page = await context.newPage()
    page.on('pageerror', e => result.errors.push(String(e)))
    page.on('console', msg => { if (msg.type() === 'error') result.errors.push(msg.text()); else if (msg.type() === 'warning') result.warnings.push(msg.text()) })
    page.on('requestfailed', r => result.requestFailures.push({ url: r.url(), error: r.failure() }))
    page.on('response', r => { if (r.status() >= 400) result.httpErrors.push({ url: r.url(), status: r.status() }) })
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    // Count real GL submissions, independently of app telemetry and rAF callbacks.
    await page.addInitScript(() => {
      window.__openingHarness = { contexts: [], shaderFailures: [], contextLosses: 0 }
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (...args) {
        const gl = original.apply(this, args)
        if (!gl || !String(args[0]).includes('webgl') || gl.__openingObserved) return gl
        gl.__openingObserved = true
        const entry = { canvas: this, gl, draws: 0, lastDrawAt: 0 }
        window.__openingHarness.contexts.push(entry)
        // detectWebGL2 deliberately loses its never-connected capability canvas.
        this.addEventListener('webglcontextlost', () => {
          if (this.isConnected) window.__openingHarness.contextLosses++
        })
        for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
          if (!gl[method]) continue
          const fn = gl[method]
          gl[method] = function (...values) { const value = fn.apply(this, values); entry.draws++; entry.lastDrawAt = performance.now(); return value }
        }
        const link = gl.linkProgram
        gl.linkProgram = function (program) {
          const value = link.call(this, program)
          if (!this.getProgramParameter(program, this.LINK_STATUS)) window.__openingHarness.shaderFailures.push(this.getProgramInfoLog(program))
          return value
        }
        return gl
      }
    })
    const read = () => page.evaluate(() => {
      const h = window.__openingHarness
      const proof = window.__drawingProof
      const optional = {}
      for (const name of ['captureRegistration', 'capturePulseRegistration', 'captureTextBounds', 'captureTitleBounds']) {
        if (typeof proof?.[name] === 'function') { try { optional[name] = proof[name]() } catch (e) { optional[name] = { error: String(e) } } }
      }
      return {
        at: performance.now(), scrollY, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        telemetry: window.__telemetry ?? null, sheetStats: window.__sheetStats ?? null,
        proofMethods: Object.keys(proof ?? {}), optional,
        gl: h.contexts.map(e => ({ connected: e.canvas.isConnected, width: e.canvas.width, height: e.canvas.height, rect: e.canvas.getBoundingClientRect().toJSON(), draws: e.draws, lastDrawAt: e.lastDrawAt, lost: e.gl.isContextLost() })),
        shaderFailures: h.shaderFailures, contextLosses: h.contextLosses,
      }
    })
    const fail = (condition, message) => { if (!condition) result.failures.push(message) }
    const liveCanvas = (before, snap) => snap.gl.some((g, i) => g.connected && !g.lost && g.width > 1 && g.height > 1 && g.rect.width > 1 && g.rect.height > 1 && g.draws > (before.gl[i]?.draws ?? Infinity))
    const checkProbes = (snap, name) => {
      const pulse = snap.optional.capturePulseRegistration
      fail(Boolean(pulse?.ready === true && !pulse.error && pulse.pointCount > 0 && pulse.segmentCount > 0
        && pulse.units === 'metres' && Number.isFinite(pulse.maxDistance) && Number.isFinite(pulse.meanDistance)
        && pulse.meanDistance >= 0 && pulse.meanDistance <= pulse.maxDistance && pulse.maxDistance <= 0.001),
      `${name}: pulse registration unavailable or outside 0.001 m (max=${pulse?.maxDistance}, mean=${pulse?.meanDistance})`)
      for (const method of ['captureTextBounds', 'captureTitleBounds']) {
        const evidence = snap.optional[method]
        fail(Boolean(evidence?.ready === true && !evidence.error && evidence.count > 0
          && evidence.violations === 0 && Array.isArray(evidence.items) && evidence.items.length === evidence.count),
        `${name}: ${method} unavailable, empty, or out of bounds (count=${evidence?.count}, violations=${evidence?.violations})`)
      }
    }
    try {
      const start = Date.now()
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      result.domContentLoadedMs = Date.now() - start
      await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady && window.__sheetStats && window.__openingHarness.contexts.some(e => e.canvas.isConnected && e.draws > 0), null, { timeout: 90000 })
      result.coldLoadReadyMs = Date.now() - start
      result.navigation = await page.evaluate(() => performance.getEntriesByType('navigation').map(e => e.toJSON()))
      console.log(`${config.name}: ready in ${result.coldLoadReadyMs} ms`)
      const reduced = config.reducedMotion === 'reduce'
      if (config.forceTier) {
        await page.evaluate(t => window.__drawingProof.setTier(t), config.forceTier)
        await page.waitForFunction(t => window.__telemetry?.performance?.tier === t, config.forceTier, { timeout: 10000 })
        result.forcedTier = config.forceTier
      }
      if (reduced) {
        // Lenis/ScrollTrigger do not mount here. Verify the actual parked frame,
        // twice, without scrollToProgress or a synthetic progress override.
        const before = await read()
        await page.waitForTimeout(250)
        const snap = await read()
        const name = `${config.name}-static`
        const live = liveCanvas(before, snap)
        const tier = snap.telemetry?.performance?.tier
        const checkpoint = { name, direction: 'static', live, tier, before, ...snap }
        result.checkpoints.push(checkpoint)
        fail(live, `${name}: no live canvas GL submissions`)
        for (const [index, sample] of [before, snap].entries()) {
          fail(['full', 'lite'].includes(sample.telemetry?.performance?.tier), `${name} sample ${index}: missing or non-WebGL quality tier`)
          fail(sample.reducedMotion === true, `${name} sample ${index}: media query mismatch`)
          // Independent owner-contract expectation; catches a wrong shared constant too.
          for (const [key, expected] of Object.entries({ phase: 0.4, focus: 1, lineOpacity: 1, pulse: 0, pbr: 0, waveEnabled: 0 })) {
            const value = sample.telemetry?.drawing?.[key]
            fail(Number.isFinite(value) && Math.abs(value - expected) <= 0.001, `${name} sample ${index}: static ${key} expected ${expected}, got ${value}`)
          }
          for (const key of ['flexAmplitude', 'flexPeakDisplacement', 'contactShadow']) {
            const value = sample.sheetStats?.[key]
            fail(Number.isFinite(value) && Math.abs(value) <= 1e-9, `${name} sample ${index}: static ${key} expected 0, got ${value}`)
          }
          fail(sample.shaderFailures.length === 0 && sample.contextLosses === 0, `${name} sample ${index}: shader link failure or context loss`)
          checkProbes(sample, `${name} sample ${index}`)
        }
        await page.screenshot({ path: path.join(out, `${name}.png`), timeout: 15000 })
        save(`${name}.json`, checkpoint)
      }
      // .066 is peak paper flex (intro t=.55); .06/.072 bracket the registered hold.
      // Quick keeps the contract-bearing points (registration holds, peak flex, HUD handoff).
      const points = quick ? [0, 0.048, 0.06, 0.066, 0.084, 0.12] : [0, 0.018, 0.04, 0.048, 0.06, 0.066, 0.072, 0.084, 0.102, 0.12]
      for (const [direction, sequence] of (reduced ? [] : quick ? [['forward', points]] : [['forward', points], ['reverse', [...points].reverse()]])) {
        for (const progress of sequence) {
          const scroll = await page.evaluate(p => window.__drawingProof.scrollToProgress(p), progress)
          // Allow real scroll + camera damping to settle. Never pin progress; tier is only forced once, at load, for -lite cases.
          let previous, quiet = 0, settled = false
          const began = Date.now()
          while (Date.now() - began < 6000) {
            await page.waitForTimeout(150)
            const values = await page.evaluate(() => { const t = window.__telemetry; return [t?.scroll?.progress, t?.drawing?.phase, t?.drawing?.poseT, t?.camera?.x, t?.camera?.y, t?.camera?.z, t?.camera?.fov] })
            const delta = previous ? Math.max(...values.map((v, i) => Math.abs(v - previous[i]))) : Infinity
            quiet = delta < 0.00002 ? quiet + 1 : 0
            previous = values
            if (quiet >= 4 && Math.abs(values[0] - progress) < 0.001) { settled = true; break }
          }
          const before = await read()
          await page.waitForTimeout(250)
          const snap = await read()
          const live = liveCanvas(before, snap)
          const tier = snap.telemetry?.performance?.tier
          const name = `${config.name}-${direction}-${progress.toFixed(3)}`
          const checkpoint = { name, progress, direction, scroll, settled, settleMs: Date.now() - began, live, tier, ...snap }
          result.checkpoints.push(checkpoint)
          fail(live, `${name}: no live canvas GL submissions`)
          fail(['full', 'lite'].includes(tier), `${name}: missing or non-WebGL quality tier ${tier}`)
          if (config.forceTier) fail(tier === config.forceTier, `${name}: forced tier ${config.forceTier} not held (got ${tier})`)
          fail(settled, `${name}: scroll/camera did not settle`)
          fail(Math.abs(snap.telemetry?.scroll?.progress - progress) < 0.001, `${name}: scroll target mismatch`)
          fail(snap.reducedMotion === (config.reducedMotion === 'reduce'), `${name}: media query mismatch`)
          // The sheet is present through these opening checkpoints; after release
          // its hidden text/profile is no longer an appropriate visible-proof gate.
          if (progress < 0.12) checkProbes(snap, name)
          if (progress === 0.048 || progress === 0.06 || progress === 0.066 || progress === 0.072) {
            const registration = snap.optional.captureRegistration
            const features = registration?.projectedFeatures
            fail(!registration?.error && Array.isArray(features) && features.length > 0
              && features.every(feature => Number.isFinite(feature.errorPixels)), `${name}: registered-hold feature measurements unavailable`)
            const maxErrorPixels = Array.isArray(features) ? Math.max(...features.map(feature => feature.errorPixels)) : NaN
            checkpoint.registeredHold = { phase: snap.telemetry?.drawing?.phase, maxErrorPixels, projectedFeatures: features ?? null }
            // .048 precedes the square-on hold: perspective/depth parallax is expected there, so
            // it is recorded only. From .06 the printed feature must project onto the live one.
            if (progress !== 0.048) fail(maxErrorPixels <= 0.1, `${name}: registered-hold error ${maxErrorPixels} px > 0.1 px`)
          }
          if (progress === 0.066) {
            const amplitude = snap.sheetStats?.flexAmplitude, peak = snap.sheetStats?.flexPeakDisplacement
            checkpoint.peakFlex = { tier, amplitude, peakDisplacement: peak }
            fail(Number.isFinite(amplitude) && amplitude > 0, `${name}: ${tier} peak flex amplitude expected > 0, got ${amplitude}`)
            fail(Number.isFinite(peak) && peak > 0 && peak <= 0.003, `${name}: ${tier} peak flex displacement expected (0, 0.003] m, got ${peak}`)
            // Metal shows through the pressed sheet before the tool lifts (pose still registered).
            const pbr = snap.telemetry?.drawing?.pbr, poseT = snap.telemetry?.drawing?.poseT
            checkpoint.metalBeforeLift = { pbr, poseT }
            fail(pbr > 0 && poseT <= 0.4 + 1e-9, `${name}: expected metal before lift, got pbr ${pbr} poseT ${poseT}`)
          }
          if (progress === 0.084 || progress === 0.12) {
            const contact = snap.sheetStats?.contactShadow, radius = snap.sheetStats?.contactRadius
            checkpoint.contactShadow = { contact, radius }
            if (progress === 0.084) fail(contact > 0 && radius > 0, `${name}: contact shadow expected while touching, got ${contact}`)
            else fail(Math.abs(contact) <= 1e-9, `${name}: contact shadow expected 0 after separation, got ${contact}`)
          }
          await page.screenshot({ path: path.join(out, `${name}.png`), timeout: 15000 })
          save(`${name}.json`, checkpoint)
        }
      }
      // Compare authored deterministic drawing channels, excluding intentionally time-driven
      // camera/gear idle. Quick has no reverse pass to compare against.
      for (const forward of result.checkpoints.filter(c => !quick && c.direction === 'forward')) {
        const reverse = result.checkpoints.find(c => c.direction === 'reverse' && c.progress === forward.progress)
        const deltas = {}
        for (const key of ['phase', 'poseT', 'pulse', 'pulseHead', 'lineOpacity', 'minZ', 'paperFlex', 'flexAmplitude', 'lightSweep']) {
          const a = forward.telemetry?.drawing?.[key], b = reverse?.telemetry?.drawing?.[key]
          if (typeof a === 'number' && typeof b === 'number') deltas[key] = Math.abs(a - b)
        }
        for (const key of ['flexAmplitude', 'flexPeakDisplacement', 'contactShadow', 'contactRadius']) {
          const a = forward.sheetStats?.[key], b = reverse?.sheetStats?.[key]
          if (typeof a === 'number' && typeof b === 'number') deltas[`sheet.${key}`] = Math.abs(a - b)
        }
        const passed = Object.keys(deltas).length > 0 && Object.values(deltas).every(n => n <= 0.002)
        result.reverse.push({ progress: forward.progress, deltas, passed })
        fail(passed, `reverse ${forward.progress}: deterministic drawing mismatch`)
      }
      const last = await read()
      result.shaderFailures = last.shaderFailures
      result.contextLosses = last.contextLosses
      fail(last.shaderFailures.length === 0 && last.contextLosses === 0, 'shader link failure or context loss')
      result.exposedInspection = { methods: last.proofMethods, note: 'Required probes must return measurement evidence while the sheet is present. Raw measurements are retained for registration and bounds review; probe presence alone does not establish geometric correctness.' }
      result.unavailable = ['capturePulseRegistration', 'captureTextBounds', 'captureTitleBounds'].filter(k => !last.proofMethods.includes(k))
      fail(result.unavailable.length === 0, `required proof probes unavailable: ${result.unavailable.join(', ')}`)
    } catch (e) {
      result.failures.push(String(e))
      try { result.failureSnapshot = await read(); await page.screenshot({ path: path.join(out, `${config.name}-failure.png`), timeout: 10000 }) } catch {}
    } finally {
      fail(result.errors.length === 0, 'browser console/page errors recorded')
      fail(result.httpErrors.length === 0, 'HTTP errors recorded')
      // requestFailures is diagnostics, not a gate: an aborted precompute fetch is the
      // designed timeout fallback into a live bake, and that path is gated by the
      // precomputed/cacheMs telemetry and every checkpoint check above.
      result.requestFailureNote = result.requestFailures.length
        ? `${result.requestFailures.length} aborted/failed request(s) recorded (precompute fallback is expected)`
        : 'none'
      result.passed = result.failures.length === 0
      save(`${config.name}.json`, result)
      save('summary.json', report)
      console.log(`${config.name}: ${result.passed ? 'PASS' : 'FAIL'} (${result.failures.length} failures)`)
      await context.close()
    }
  }
} finally {
  await browser.close()
  report.finished = new Date().toISOString()
  const peakOf = name => report.cases.find(c => c.name === name)?.checkpoints.find(c => c.name === `${name}-forward-0.066`)?.peakFlex
  report.flexTierComparison = ['desktop', 'narrow'].map(base => {
    const full = peakOf(base), lite = peakOf(`${base}-lite`)
    if (!full || !lite) return { base, compared: false }
    const passed = full.tier === 'full' && lite.tier === 'lite' && full.peakDisplacement > lite.peakDisplacement && lite.peakDisplacement > 0
    return { base, compared: true, full: full.peakDisplacement, lite: lite.peakDisplacement, passed }
  })
  report.passed = report.cases.length === cases.length && report.cases.every(c => c.passed)
    && report.flexTierComparison.every(c => !c.compared || c.passed)
  try { report.gitEnd = execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }) } catch {}
  save('summary.json', report)
  console.log(`Evidence: ${out}`)
}
process.exitCode = report.passed ? 0 : 1
