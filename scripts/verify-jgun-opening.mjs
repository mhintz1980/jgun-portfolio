/** Browser-only stages 1–3 evidence. No app mutations. Run again with --label=integration.
 * node scripts/verify-jgun-opening.mjs [--label=baseline] [--case=desktop] [--out=absolute-path]
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
const url = arg('url', 'http://localhost:5199')
const out = arg('out', '')
  ? path.resolve(arg('out', ''))
  : label === 'quick'
  ? path.join(root, 'project/work/evidence/blackout-emergence-2026-09-30/quick')
  : path.join(root, 'project/work/evidence/JG-035-opening-drafting-table/stages-1-3-2026-09-26', `${label}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
fs.mkdirSync(out, { recursive: true })
const save = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n')
const report = { url, label, started: new Date().toISOString(), browser: 'installed Playwright, channel chrome', coldLoadDefinition: 'fresh browser context; HTTP cache disabled; elapsed navigation to proof, annotations, sheet stats and live WebGL draws ready (OS/server caches uncontrolled)', thresholds: { scrollProgress: 0.001, scrollShare: 0.001, realScrollPhase: 0.001 / 0.12 + 1e-6, pinnedPhase: 1e-9, reverseNumericDelta: 0.002, reverseBreakthroughDelta: 1e-9, pulseRegistrationMetres: 0.001, registeredHoldPixels: 0.1, registeredCameraMetres: 0.001, lampPower: 0.001, paperFlexMaxMetres: 0.012, litePaperFlexMaxMetres: 0.0054, holeAreaRelative: 1e-6, boundaryDeviationMetres: 0.0006, nearPaperMetres: 0.001, initialClearanceMetres: 0.0006, sheetRetirementWindow: [0.18, 0.22] }, cases: [] }
// Fast mode (--quick): desktop + narrow only, forward owner checkpoints, no reverse pass
// and no reduced-motion static waits.
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

const introProgress = (t) => t * 0.12
const REAL_SCROLL_PHASE_EPSILON = 0.001 / 0.12 + 1e-6
const PINNED_PHASE_EPSILON = 1e-9
// Hero-transit contract (2026-10-01 pacing integration). `[data-chapter="1"]` is the element the
// hero ScrollTrigger measures (`start: 'top bottom'`, `end: 'bottom top'`), so its live rect plus
// the document travel is where the paced window has to land. `paced` is the window the retained
// CH.02 timeline was authored against; `raw` is what the share-.50 derivation in
// `src/scene/drawing/scrollTracks.ts` produces over the 3020vh document travel
// (1607.857143vh -> 2090.714286vh). The pre-fix literals handed the transit back at
// 0.082887/0.241801 with the intro releasing 69% into it.
const HERO_TRANSIT = {
  paced: { start: 0.177029, end: 0.458429 },
  raw: { start: 0.532403027436, end: 0.692289498581 },
}
// Release gate: the intro hands off at paced .12 and the hero transit only opens 97.9vh later,
// so the retained mechanism channels must read rest on both sides of the release and just after.
// Nonreduced only — the reduced tier never mounts Lenis/ScrollTrigger or the hero timeline.
// Epsilon: the real-scroll pass settles on `|scroll.progress - point| < 0.001` (the same
// tolerance every checkpoint asserts). Quantization is far smaller — 1 device px is 3.7e-5/3.9e-5
// of raw travel on the 1600x900 and 390x844 cases, i.e. <= 9.4e-6 on the paced axis — and the
// .1199 point sits 11.3px / 10.6px below the raw .50 boundary, so it cannot round across the
// release. The two gate sides therefore straddle .12 by construction, and each checkpoint
// records the measured progress error as evidence.
const releaseGatePoints = [0.1199, 0.1201, 0.13]
const phaseSamples = [
  { t: 0.38, keys: ['onboardEnd'] },
  { t: 0.45, keys: ['flickerStart'] },
  { t: 0.58, keys: ['blackoutStart'] },
  { t: 0.66, keys: ['pulseStart'] },
  { t: 0.79, keys: ['pulseEnd', 'registrationEnd', 'bulgeStart', 'lampReturnStart', 'riseStart'] },
  { t: 0.84, keys: ['fractureStart'] },
  { t: 0.86, keys: ['lampReturnEnd'] },
  { t: 0.88, keys: ['fractureEnd', 'detachStart'] },
  { t: 0.8405, keys: ['firstRupture'] },
  { t: 0.845, keys: ['immediateMetal'] },
  { t: 0.90, keys: ['orbitStart'] },
  { t: 0.97, keys: ['waveEnd'] },
  { t: 1, keys: ['release'] },
].map((sample) => ({ ...sample, progress: introProgress(sample.t) }))
const phaseSampleByProgress = new Map(phaseSamples.map((sample) => [sample.progress, sample]))
const lampFailureKeys = [
  { u: 0, power: 1, role: 'lit-edge' },
  { u: 0.12, power: 0.58, role: 'dip-1' },
  { u: 0.18, power: 0.92, role: 'recovery-1' },
  { u: 0.28, power: 0.14, role: 'dip-2' },
  { u: 0.34, power: 0.78, role: 'recovery-2' },
  { u: 0.46, power: 0.36, role: 'dip-3' },
  { u: 0.51, power: 0.86, role: 'recovery-3' },
  { u: 0.64, power: 0.015, role: 'dip-4-shelf-start' },
  { u: 0.72, power: 0.015, role: 'dip-4-shelf-end' },
  { u: 0.78, power: 0.58, role: 'recovery-4' },
  { u: 0.85, power: 0.08, role: 'dip-5' },
  { u: 0.91, power: 0.34, role: 'recovery-5' },
  { u: 1, power: 0, role: 'dark-edge' },
].map((key) => ({ ...key, t: 0.45 + key.u * (0.58 - 0.45), progress: introProgress(0.45 + key.u * (0.58 - 0.45)) }))
const lampSampleByProgress = new Map(lampFailureKeys.map((sample) => [sample.progress, sample]))
const pinnedSampleByProgress = new Map(phaseSamples.map((sample) => [sample.progress, { phase: sample, lamp: null }]))
for (const sample of lampFailureKeys) {
  const existing = pinnedSampleByProgress.get(sample.progress)
  if (existing) existing.lamp = sample
  else pinnedSampleByProgress.set(sample.progress, { phase: null, lamp: sample })
}
const pinnedSamples = [...pinnedSampleByProgress.entries()]
  .map(([progress, samples]) => ({ progress, ...samples }))
  .sort((a, b) => a.progress - b.progress)
const registeredCameraProgresses = new Set([
  introProgress(0.38),
  introProgress(0.58),
  introProgress(0.66),
  introProgress(0.79),
])
const phaseProgresses = phaseSamples.map((sample) => sample.progress)
const lampProgresses = lampFailureKeys.map((sample) => sample.progress)
// Paper breakthrough beats (2026-10-01): pressure peak, fracture start/mid/end, extraction
// hand-off, the two crossing samples the off-frame breakthrough probe is asked for, and the
// first fully emerged frame.
const breakthroughTimes = [0.825, 0.84, 0.8405, 0.845, 0.85, 0.865, 0.88, 0.895, 0.905, 0.91]
const breakthroughProgresses = breakthroughTimes.map(introProgress)
const breakthroughByProgress = new Map(breakthroughProgresses.map((progress, index) => [progress, breakthroughTimes[index]]))
const quickCore = [0, ...releaseGatePoints, introProgress(0.67), introProgress(0.78), ...breakthroughProgresses, introProgress(0.92), 0.12]
// The opaque sheet leaves through its authored physical retirement (.18 -> .22 after the
// handoff), so the window is sampled on both sides of its midpoint.
const sheetRetirementPoints = [0.18, 0.2, 0.22]
quickCore.push(...sheetRetirementPoints)
const fullOnlyCore = [0.018, 0.04, introProgress(0.725)]
const points = [...new Set([...(quick ? quickCore : [...quickCore, ...fullOnlyCore]), ...phaseProgresses, ...lampProgresses])].sort((a, b) => a - b)
const browser = await chromium.launch({
  channel: 'chrome',
  // Launch contract matches the sibling manufacturing verifiers
  // (verify-shaft-inspection / verify-manufacturing-inspection /
  // verify-ring-inspection): channel chrome, headless, --use-angle=d3d11,
  // background flags, DPR 1. Both 2026-10-06 rosters are preserved as records:
  // the headed one under runtime/opening-contact-final, the headless one under
  // runtime/opening-triage-glm. Headless launching did not clear the desktop
  // full-tier gate, and no causal claim about the headed failures is made here.
  // Viewport, DPR, thresholds, tier expectations, and the app's adaptive ladder
  // are unchanged.
  headless: true,
  args: [
    '--use-angle=d3d11',
    // Keep the renderer from being backgrounded/throttled by other processes.
    // Production quality policy is unchanged.
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
  ],
})
try {
  report.browserVersion = browser.version()
  for (const config of cases) {
    const result = { ...config, checkpoints: [], errors: [], warnings: [], requestFailures: [], httpErrors: [], failures: [], reverse: [], cadRequests: [] }
    report.cases.push(result)
    const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, reducedMotion: config.reducedMotion, deviceScaleFactor: 1, serviceWorkers: 'block' })
    const page = await context.newPage()
    page.on('pageerror', e => result.errors.push(String(e)))
    page.on('console', msg => { if (msg.type() === 'error') result.errors.push(msg.text()); else if (msg.type() === 'warning') result.warnings.push(msg.text()) })
    page.on('requestfailed', r => result.requestFailures.push({ url: r.url(), error: r.failure() }))
    page.on('response', r => { if (r.status() >= 400) result.httpErrors.push({ url: r.url(), status: r.status() }) })
    // CAD/tool asset census for the posters-throughout reduced policy (owner
    // decision 2026-10-06): model GLBs, Draco decoders, inspection assets.
    page.on('request', r => { const u = r.url(); if (u.includes('/models/') || /\.glb(\?|$)/.test(u) || u.includes('/draco/') || u.includes('/inspection/')) result.cadRequests.push(u) })
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    // Count real GL submissions, independently of app telemetry and rAF callbacks.
    await page.addInitScript(() => {
      // The harness drives exact real-scroll checkpoints; suppress scrollCommit's
      // visitor-paced assist so forward/reverse samples remain comparable.
      window.__scrollCommitDisabled = true
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
    // The owner's breakthrough curves, re-derived here from the written windows (fracture
    // .84-.88, metal and illumination complete by .84) so pinned frames are compared against the
    // contract and not against the app's own output.
    const smooth01 = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c) }
    const expectedPoseT = (t) => t <= 0.79 ? 0.4 * (t / 0.79)
      : t <= 0.84 ? 0.4 + 0.1 * (t - 0.79) / 0.05
      : 0.5 + 0.5 * Math.pow(Math.min(1, Math.max(0, (t - 0.84) / 0.16)), 0.55)
    const expectedBreakthrough = (t) => {
      const pressure = smooth01((t - 0.79) / (0.84 - 0.79))
      const fracture = smooth01((t - 0.84) / (0.88 - 0.84))
      return {
        pressure,
        fracture,
        openingClear: t >= 0.88 ? 1 : 0,
        crackWeb: smooth01((t - 0.75) / 0.07) * (1 - fracture),
        crackGlow: t < 0.66 ? 0 : t <= 0.79 ? 1 : (0.65 + 0.35 * pressure) * (1 - 0.78 * fracture) * (1 - smooth01((t - 0.94) / 0.05)),
        // Lamp return only: every breakthrough beat sits past .79, where the envelope is the
        // single smoothed ramp from the dark hold to full power.
        lampPower: smooth01((t - 0.96) / 0.04),
        pbr: smooth01((t - 0.80) / 0.02),
        illumination: smooth01((t - 0.96) / 0.04) * smooth01((t - 0.80) / 0.02),
        poseT: expectedPoseT(t),
      }
    }
    /**
     * The standing breakthrough contract, asserted on every real-scroll checkpoint: the print
     * is permanently opaque, the stock is thick, the torn boundary stays inside 0.4 mm, the
     * fragments tile the hole, and lit metal causes the rupture before the hole fully clears.
     */
    const checkBarrierContract = (snap, name, checkpoint = null) => {
      const stats = snap.sheetStats ?? {}
      const drawing = snap.telemetry?.drawing ?? {}
      const area = stats.holeArea, fragments = stats.fragmentArea
      fail(stats.paperOpacity === 1, `${name}: paperOpacity must stay permanently 1, got ${stats.paperOpacity}`)
      fail(Number.isFinite(stats.fragmentThickness) && stats.fragmentThickness > 0, `${name}: fragment thickness must be > 0, got ${stats.fragmentThickness}`)
      fail(Number.isFinite(stats.maxBoundaryDeviation) && stats.maxBoundaryDeviation <= 0.0006, `${name}: torn boundary deviation ${stats.maxBoundaryDeviation} m exceeds 0.0006 m`)
      fail(Number.isFinite(area) && area > 0, `${name}: hole area must be positive, got ${area}`)
      fail(Number.isFinite(area) && Number.isFinite(fragments) && Math.abs(area - fragments) <= 1e-6 * area, `${name}: hole/fragment area conservation off by ${Math.abs(area - fragments)} m^2`)
      fail(Number.isInteger(stats.fragmentCount) && stats.fragmentCount >= 25 && stats.fragmentCount <= 128, `${name}: fragment count ${stats.fragmentCount} outside the piece/chip budget`)
      // The old modelBarrierSafe flag encoded openingClear-before-motion. The exact
      // transformed-vertex probe below now establishes pressure/barrier safety instead.
      if (drawing.phase >= 0.84) {
        fail(drawing.pbr === 1 && Math.abs(drawing.illumination - expectedBreakthrough(drawing.phase).illumination) <= 1e-9, `${name}: rupture PBR/studio envelope mismatch (pbr ${drawing.pbr}, illumination ${drawing.illumination})`)
      }
      if (checkpoint) {
        checkpoint.fractureContract = { paperOpacity: stats.paperOpacity, fragmentThickness: stats.fragmentThickness, maxBoundaryDeviation: stats.maxBoundaryDeviation, holeArea: area, fragmentArea: fragments, fragmentCount: stats.fragmentCount, openingClear: stats.openingClear, modelBarrierSafe: stats.modelBarrierSafe }
      }
    }
    /**
     * Off-frame transformed-vertex probe. The near-paper test is the parent's: a vertex counts
     * only when it sits within +/-1 mm of the sheet, and a collision is only claimed when the
     * model genuinely spans the barrier (minZ < -1 mm AND maxZ > +1 mm) with such a vertex
     * outside the torn opening. The hole outline's own area is measured here with the shoelace
     * formula, independently of the reported hole area.
     */
    const captureBreakthrough = () => page.evaluate(() => {
      const capture = window.__drawingProof?.captureBreakthrough
      if (typeof capture !== 'function') return { available: false }
      try {
        const proof = capture()
        const contour = proof.profile
        let doubled = 0
        for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
          doubled += contour[j][0] * contour[i][1] - contour[i][0] * contour[j][1]
        }
        // The raw contour can carry thousands of traced points; evidence keeps its measured
        // area and vertex count instead of the whole outline.
        delete proof.profile
        return { available: true, ...proof, outlineCount: contour.length, outlineArea: Math.abs(doubled) / 2 }
      } catch (error) { return { available: true, error: String(error) } }
    })
    const checkBreakthrough = (proof, name, expected, checkpoint) => {
      fail(proof.available === true, `${name}: captureBreakthrough probe unavailable`)
      if (!proof.available) return
      fail(!proof.error, `${name}: captureBreakthrough failed (${proof.error})`)
      if (proof.error) return
      checkpoint.breakthroughProof = proof
      const area = proof.area, fragmentArea = proof.fragmentArea
      fail(proof.opacity === 1, `${name}: breakthrough opacity ${proof.opacity} must stay 1`)
      fail(Number.isFinite(proof.thickness) && proof.thickness > 0, `${name}: breakthrough thickness ${proof.thickness} must be positive`)
      fail(Number.isFinite(proof.maxBoundaryDeviation) && proof.maxBoundaryDeviation <= 0.0006, `${name}: torn boundary deviation ${proof.maxBoundaryDeviation} m exceeds 0.0006 m`)
      fail(Number.isFinite(area) && area > 0 && Number.isFinite(proof.outlineArea) && proof.outlineArea > 0 && Math.abs(proof.outlineArea - area) <= 1e-6 * area,
        `${name}: measured hole outline area ${proof.outlineArea} disagrees with the reported hole area ${area}`)
      fail(Number.isFinite(area) && Number.isFinite(fragmentArea) && Math.abs(area - fragmentArea) <= 1e-6 * area,
        `${name}: hole/fragment area conservation off by ${Math.abs(area - fragmentArea)} m^2`)
      fail(Number.isInteger(proof.outlineCount) && proof.outlineCount >= 3, `${name}: hole outline has ${proof.outlineCount} points`)
      fail(Array.isArray(proof.fragments) && proof.fragments.length > 0 && proof.fragments.every(f => Array.isArray(f.position) && Array.isArray(f.rotation)),
        `${name}: fragment transforms unavailable`)
      fail(Number.isFinite(proof.minZ) && Number.isFinite(proof.maxZ), `${name}: transformed vertex extent unavailable`)
      fail(proof.openingClear === expected.openingClear, `${name}: probe openingClear ${proof.openingClear}, expected ${expected.openingClear}`)
      fail(proof.modelMoving === (expected.poseT > 0.4 + 1e-9), `${name}: probe modelMoving ${proof.modelMoving} disagrees with the authored pose time ${expected.poseT}`)
      const spansBarrier = proof.minZ < -0.001 && proof.maxZ > 0.001
      if (expected.fracture === 0) {
        fail(proof.maxZ <= 0.012 * expected.pressure + 1e-6, `${name}: model top ${proof.maxZ} exceeds pressure bulge ${0.012 * expected.pressure}`)
      }
      fail(!(spansBarrier && proof.outsideOpening > 0),
        `${name}: ${proof.outsideOpening} near-paper vertices outside the torn opening while the model spans the barrier (minZ ${proof.minZ}, maxZ ${proof.maxZ})`)
      checkpoint.breakthroughContract = { spansBarrier, nearPaperMetres: 0.001, outsideOpening: proof.outsideOpening, crossingVertices: proof.crossingVertices, minZ: proof.minZ, maxZ: proof.maxZ }
    }
    try {
      const start = Date.now()
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      result.domContentLoadedMs = Date.now() - start
      if (config.reducedMotion === 'reduce') {
        // Posters throughout (owner decision 2026-10-06): reduced startup renders the
        // DOM poster + native narrative. There is no drawingProof/canvas to wait for;
        // readiness is the poster DOM itself plus the always-DOM chapter content.
        await page.waitForFunction(() => {
          const poster = [...document.querySelectorAll('div')].some(d => {
            const c = String(d.className ?? '')
            return c.includes('fixed') && c.includes('inset-0') && c.includes('z-0')
              && (d.textContent ?? '').includes('STATIC RENDER MODE') && (d.textContent ?? '').includes('DWG NO.')
          })
          return document.readyState === 'complete' && poster && document.querySelector('main') && document.querySelector('main h2')
        }, null, { timeout: 90000 })
      } else {
        await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady && window.__sheetStats && window.__openingHarness.contexts.some(e => e.canvas.isConnected && e.draws > 0), null, { timeout: 90000 })
      }
      result.coldLoadReadyMs = Date.now() - start
      result.navigation = await page.evaluate(() => performance.getEntriesByType('navigation').map(e => e.toJSON()))
      console.log(`${config.name}: ready in ${result.coldLoadReadyMs} ms`)
      const reduced = config.reducedMotion === 'reduce'
      if (config.forceTier) {
        // Let cold-load shader preparation and its initial FPS window settle before
        // explicitly changing tier. Compilation work is not a lite render failure.
        await page.waitForFunction(() => window.__telemetry?.performance?.warmReady, null, { timeout: 30000 })
        await page.waitForTimeout(3000)
        await page.evaluate(t => window.__drawingProof.setTier(t), config.forceTier)
        await page.waitForFunction(t => window.__telemetry?.performance?.tier === t &&
          window.__drawingProof?.ready && window.__openingHarness.contexts.some(e => e.canvas.isConnected && !e.gl.isContextLost() && e.draws > 0), config.forceTier, { timeout: 10000 })
        result.forcedTier = config.forceTier
      }
      if (reduced) {
        // Posters throughout (owner decision 2026-10-06): a fresh reduced-motion startup
        // renders the real DOM poster + native-scroll narrative with zero connected WebGL
        // canvas, zero CAD/tool requests, and no Lenis/ScrollTrigger. There is no
        // drawingProof or sheetStats on this path. Written against that authorized
        // policy; the pre-change build (reduced kept the canvas) fails here by design.
        const posterProbe = () => page.evaluate(() => {
          const stamp = [...document.querySelectorAll('div')].find(d => {
            const c = String(d.className ?? '')
            return c.includes('fixed') && c.includes('inset-0') && c.includes('z-0')
              && (d.textContent ?? '').includes('STATIC RENDER MODE') && (d.textContent ?? '').includes('DWG NO.')
          })
          const nav = document.querySelector('nav[aria-label="Station navigation"]')
          const main = document.querySelector('main')
          return {
            readyState: document.readyState,
            hasMain: Boolean(main),
            mainHeadings: main ? main.querySelectorAll('h1,h2,h3').length : 0,
            dataChapters: document.querySelectorAll('[data-chapter]').length,
            poster: stamp
              ? { found: true, ariaHidden: stamp.getAttribute('aria-hidden'), rect: stamp.getBoundingClientRect().toJSON(), text: (stamp.textContent ?? '').trim().slice(0, 240) }
              : { found: false },
            navButtons: nav ? [...nav.querySelectorAll('button[aria-label^="Navigate to"]')].map(b => b.getAttribute('aria-label')) : [],
            canvases: [...document.querySelectorAll('canvas')].map(c => ({ connected: c.isConnected, width: c.width, height: c.height, rect: c.getBoundingClientRect().toJSON() })),
            harnessContexts: (window.__openingHarness?.contexts ?? []).map(e => ({ connected: e.canvas.isConnected, draws: e.draws })),
            lenis: Boolean(window.__lenis),
            telemetry: Boolean(window.__telemetry),
            htmlLenisClass: document.documentElement.classList.contains('lenis'),
            scrollHeight: document.documentElement.scrollHeight,
            clientWidth: document.documentElement.clientWidth,
            innerHeight: window.innerHeight,
            scrollY: Math.round(window.scrollY),
            reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
          }
        })
        const before = await posterProbe()
        await page.waitForTimeout(250)
        const settled = await posterProbe()
        await page.evaluate(() => window.scrollTo(0, Math.floor(document.documentElement.scrollHeight / 2)))
        await page.waitForTimeout(250)
        const scrolled = await posterProbe()
        await page.screenshot({ path: path.join(out, `${config.name}-static-scrolled.png`), timeout: 15000 })
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitForTimeout(150)
        const returned = await posterProbe()
        const harness = await read()
        const name = `${config.name}-static`
        const checkpoint = { name, mode: 'static', direction: 'static', before, settled, scrolled, returned, gl: harness.gl, cadRequests: result.cadRequests.slice(), shaderFailures: harness.shaderFailures, contextLosses: harness.contextLosses }
        result.checkpoints.push(checkpoint)
        fail(before.reducedMotion === true && settled.reducedMotion === true, `${name}: reduced-motion media query mismatch`)
        fail(before.poster.found && settled.poster.found && scrolled.poster.found, `${name}: DOM poster (STATIC RENDER MODE sheet) absent`)
        fail(before.poster.ariaHidden === 'true', `${name}: poster backdrop must stay aria-hidden furniture`)
        fail((before.poster.rect?.width ?? 0) >= before.clientWidth - 2 && (before.poster.rect?.height ?? 0) >= before.innerHeight - 2, `${name}: poster backdrop does not cover the viewport (${before.poster.rect?.width}x${before.poster.rect?.height} vs viewport ${before.clientWidth}x${before.innerHeight})`)
        fail(Math.abs((before.poster.rect?.width ?? 0) - (settled.poster.rect?.width ?? 0)) <= 1 && Math.abs((before.poster.rect?.height ?? 0) - (settled.poster.rect?.height ?? 0)) <= 1, `${name}: poster layout unstable across samples`)
        fail(Math.abs(before.scrollHeight - settled.scrollHeight) <= 1 && Math.abs(before.scrollHeight - scrolled.scrollHeight) <= 1, `${name}: document height unstable (${before.scrollHeight}/${settled.scrollHeight}/${scrolled.scrollHeight})`)
        fail(before.hasMain && before.mainHeadings > 0, `${name}: native-scroll narrative (main headings) absent`)
        fail(before.dataChapters > 0, `${name}: chapter sections ([data-chapter]) absent`)
        fail(before.navButtons.length === 3 && before.navButtons.every(Boolean), `${name}: station navigation expected 3 buttons, got ${JSON.stringify(before.navButtons)}`)
        fail(before.canvases.length === 0 && settled.canvases.length === 0 && scrolled.canvases.length === 0, `${name}: canvas element present in posters-throughout reduced mode (${before.canvases.length}/${settled.canvases.length}/${scrolled.canvases.length})`)
        fail([before, settled, scrolled].every(s => s.harnessContexts.every(c => !c.connected && c.draws === 0)), `${name}: connected or drawing WebGL context in posters-throughout reduced mode`)
        fail(result.cadRequests.length === 0, `${name}: ${result.cadRequests.length} CAD/tool request(s) in reduced mode: ${result.cadRequests.join(', ')}`)
        fail(!before.lenis && !settled.lenis && !scrolled.lenis, `${name}: Lenis present in reduced mode`)
        fail(!before.htmlLenisClass && !settled.htmlLenisClass, `${name}: lenis html class present in reduced mode`)
        const expectedScroll = Math.max(0, Math.floor(scrolled.scrollHeight / 2))
        fail(Math.abs(scrolled.scrollY - expectedScroll) <= 2, `${name}: native scroll did not reach midpoint (${scrolled.scrollY} vs ${expectedScroll})`)
        fail(returned.scrollY <= 1, `${name}: native scroll did not return to top (${returned.scrollY})`)
        fail(harness.shaderFailures.length === 0 && harness.contextLosses === 0, `${name}: shader link failure or context loss`)
        await page.screenshot({ path: path.join(out, `${name}.png`), timeout: 15000 })
        save(`${name}.json`, checkpoint)
      }
      // Pass 1 — true document scroll. Finite scroll quantization is allowed an explicit
      // phase epsilon; endpoint booleans and discontinuities are proved by pinned frames below.
      let canvasInactive = false
      const expectedTier = config.forceTier ?? 'full'
      const hasActiveCanvas = (snap) => snap.gl.some(g => g.connected && !g.lost && g.width > 1 && g.height > 1 && g.rect.width > 1 && g.rect.height > 1)
      realScrollPass:
      for (const [direction, sequence] of (reduced ? [] : quick ? [['forward', points]] : [['forward', points], ['reverse', [...points].reverse()]])) {
        for (const [pointIndex, progress] of sequence.entries()) {
          const scroll = await page.evaluate(p => window.__drawingProof.scrollToProgress(p), progress)
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
          const active = hasActiveCanvas(snap)
          const live = active && liveCanvas(before, snap)
          const tier = snap.telemetry?.performance?.tier
          const name = `${config.name}-${direction}-${String(pointIndex).padStart(2, '0')}-${progress.toFixed(6)}`
          const checkpoint = { name, mode: 'real-scroll', progress, direction, scroll, settled, settleMs: Date.now() - began, live, tier, ...snap }
          result.checkpoints.push(checkpoint)
          if (!active) {
            result.canvasInactive = { name, tier, gl: snap.gl, note: 'real render canvas disconnected/lost; later proof APIs and telemetry would be stale' }
            fail(false, `${name}: WEBGL_CANVAS_INACTIVE (connected/renderable canvas absent)`)
            canvasInactive = true
            break realScrollPass
          }
          fail(live, `${name}: no live canvas GL submissions`)
          fail(tier === expectedTier, `${name}: expected ${expectedTier} tier for browser evidence, got ${tier}`)
          fail(settled, `${name}: scroll/camera did not settle`)
          fail(Math.abs(snap.telemetry?.scroll?.progress - progress) < 0.001, `${name}: scroll target mismatch`)
          fail(snap.reducedMotion === (config.reducedMotion === 'reduce'), `${name}: media query mismatch`)
          const drawing = snap.telemetry?.drawing ?? {}
          const phaseSample = phaseSampleByProgress.get(progress)
          if (phaseSample) {
            const phaseError = Math.abs(drawing.phase - phaseSample.t)
            checkpoint.phaseSample = { ...phaseSample, measuredPhase: drawing.phase, phaseError, epsilon: REAL_SCROLL_PHASE_EPSILON }
            fail(Number.isFinite(phaseError) && phaseError <= REAL_SCROLL_PHASE_EPSILON,
              `${name}: real-scroll phase error ${phaseError} > ${REAL_SCROLL_PHASE_EPSILON} at ${phaseSample.keys.join('/')}`)
          }
          const lampSample = lampSampleByProgress.get(progress)
          if (lampSample) {
            // Exact key powers are pinned below: neighboring flicker keys can be closer than
            // the legitimate real-scroll quantization represented by REAL_SCROLL_PHASE_EPSILON.
            checkpoint.realScrollLampSample = { ...lampSample, measuredLampPower: drawing.lampPower }
          }
          if (phaseSample || lampSample || progress === introProgress(0.67)) {
            for (const key of ['lampPower', 'blackout', 'lightningLuminance', 'bulgeDisplacement', 'readingPool', 'inkLuminance']) {
              fail(typeof drawing[key] === 'number' && Number.isFinite(drawing[key]), `${name}: drawing.${key} telemetry unavailable`)
            }
          }
          if (progress === introProgress(0.67)) {
            checkpoint.lightning = { lampPower: drawing.lampPower, blackout: drawing.blackout, lightningLuminance: drawing.lightningLuminance, pulse: drawing.pulse, readingPool: drawing.readingPool }
            fail(drawing.lampPower <= 0.001 && drawing.pulse >= 0.999 && drawing.lightningLuminance > 0, `${name}: t=.67 must show lightning while the lamp is off and pulse is active`)
            const pixels = await page.evaluate(async () => {
              const capture = window.__drawingProof?.captureLightningPixels
              if (typeof capture !== 'function') return { available: false }
              try { return { available: true, ...(await capture()) } } catch (error) { return { available: true, error: String(error) } }
            })
            checkpoint.lightningPixelProof = pixels
            fail(pixels.available === true, `${name}: named lightning mesh pixel proof unavailable`)
            fail(!pixels.error && pixels.meshName === 'lightning' && pixels.meshVisible === true && pixels.fixedCamera === true
              && Number.isFinite(pixels.changedBrightPixels) && pixels.changedBrightPixels > 0
              && Number.isFinite(pixels.contourPixels) && pixels.contourPixels > 0,
              `${name}: lightning pixel proof failed (mesh visibility, fixed camera, contour, or bright-pixel delta)`)
          }
          if (progress === introProgress(0.78)) {
            checkpoint.traceInteriorEnd = { lampPower: drawing.lampPower, blackout: drawing.blackout, pulse: drawing.pulse, pulseHead: drawing.pulseHead }
            fail(drawing.lampPower <= 0.001 && drawing.blackout >= 0.999 && drawing.pulse >= 0.999 && drawing.pulseHead > 0.9 && drawing.pulseHead < 1,
              `${name}: t=.78 interior trace must remain active and dark`)
          }
          checkBarrierContract(snap, name, checkpoint)
          const stats = snap.sheetStats ?? {}
          if (breakthroughByProgress.has(progress)) {
            // Real-scroll quantization is worth up to one REAL_SCROLL_PHASE_EPSILON of phase, so
            // the authored curves are checked against the MEASURED phase (internal consistency of
            // the contract) plus a hard band on the phase itself, and the boundary behaviour the
            // beat exists for is asserted from that measured phase.
            const beatT = breakthroughByProgress.get(progress)
            const phaseT = drawing.phase
            const expected = expectedBreakthrough(phaseT)
            checkpoint.breakthroughBeat = { requestedT: beatT, measuredPhase: phaseT, phaseBand: 0.01, expected: { fracture: expected.fracture, openingClear: expected.openingClear, crackWeb: expected.crackWeb, crackGlow: expected.crackGlow, pbr: expected.pbr, poseT: expected.poseT }, measured: { fracture: stats.fracture, openingClear: stats.openingClear, crackWeb: stats.crackWeb, crackGlow: stats.crackGlow, pbr: drawing.pbr, poseT: drawing.poseT, flexAmplitude: stats.flexAmplitude, contactShadow: stats.contactShadow } }
            fail(Number.isFinite(phaseT) && Math.abs(phaseT - beatT) <= 0.01, `${name}: phase ${phaseT} outside the ${beatT} beat band`)
            fail(Math.abs(stats.fracture - expected.fracture) <= 0.002, `${name}: fracture ${stats.fracture} != authored ${expected.fracture} at phase ${phaseT}`)
            fail(stats.openingClear === expected.openingClear, `${name}: openingClear ${stats.openingClear} != authored ${expected.openingClear} at phase ${phaseT}`)
            fail(Math.abs(stats.crackWeb - expected.crackWeb) <= 0.002, `${name}: crackWeb ${stats.crackWeb} != authored ${expected.crackWeb} at phase ${phaseT}`)
            fail(Math.abs(stats.crackGlow - expected.crackGlow) <= 0.002, `${name}: crackGlow ${stats.crackGlow} != authored ${expected.crackGlow} at phase ${phaseT}`)
            fail(Math.abs(drawing.pbr - expected.pbr) <= 0.002, `${name}: pbr ${drawing.pbr} != authored ${expected.pbr} at phase ${phaseT}`)
            fail(Number.isFinite(drawing.poseT) && Math.abs(drawing.poseT - expected.poseT) <= 1e-6, `${name}: poseT ${drawing.poseT} != authored ${expected.poseT} at phase ${phaseT}`)
            fail(Number.isFinite(drawing.lampPower) && Math.abs(drawing.lampPower - expected.lampPower) <= 1e-6, `${name}: lampPower ${drawing.lampPower} != authored ${expected.lampPower} at phase ${phaseT}`)
            if (phaseT > 0.79 && phaseT < 0.88) {
              fail(drawing.poseT > 0.4, `${name}: model must push through pressure and rupture (poseT ${drawing.poseT})`)
              fail(stats.flexAmplitude > 0, `${name}: ${tier} pressure flex expected > 0 at ${beatT}, got ${stats.flexAmplitude}`)
            }
            if (beatT === 0.88 || beatT === 0.89) {
              fail(drawing.poseT > 0.4 && drawing.pbr === 1, `${name}: model must continue rising after fracture clearance`)
              const amplitude = stats.flexAmplitude, peak = stats.flexPeakDisplacement
              const flexMax = tier === 'lite' ? 0.0054 : 0.012
              checkpoint.peakFlex = { tier, amplitude, peakDisplacement: peak }
              fail(Number.isFinite(peak) && peak >= 0 && peak <= flexMax, `${name}: ${tier} flex displacement expected [0, ${flexMax}] m at the fracture end, got ${peak}`)
            }
            if (beatT === 0.825 || beatT === 0.84) {
              const amplitude = stats.flexAmplitude, peak = stats.flexPeakDisplacement
              const flexMax = tier === 'lite' ? 0.0054 : 0.012
              checkpoint.pressureFlex = { tier, amplitude, peakDisplacement: peak, phaseT }
              fail(Number.isFinite(peak) && peak > 0 && peak <= flexMax, `${name}: ${tier} pressure flex displacement expected (0, ${flexMax}] m, got ${peak}`)
            }
            if (beatT >= 0.91) {
              fail(drawing.poseT > 0.4 && drawing.pbr > 0, `${name}: emerging sample expected pose>.4 and metal (poseT ${drawing.poseT}, pbr ${drawing.pbr})`)
              const contact = stats.contactShadow, radius = stats.contactRadius
              checkpoint.contactShadow = { contact, radius }
              fail(contact > 0 && radius > 0, `${name}: contact shadow expected during the extraction, got ${contact}`)
            }
            const wantsProbe = [0.825, 0.84, 0.8405, 0.845, 0.88, 0.895, 0.905, 0.91].includes(beatT) || (!quick && beatT === 0.865)
            if (wantsProbe) {
              checkBreakthrough(await captureBreakthrough(), name, expected, checkpoint)
            }
          }
          if (sheetRetirementPoints.includes(progress)) {
            // Past the handoff: the model is fully extracted, the opening is permanently clear
            // and the stock is still opaque - the sheet leaves only through its own authored
            // physical retirement between .18 and .22, never through a fade.
            checkpoint.sheetRetirement = { window: [0.18, 0.22], poseT: drawing.poseT, openingClear: stats.openingClear, paperOpacity: stats.paperOpacity, modelBarrierSafe: stats.modelBarrierSafe, contactShadow: stats.contactShadow, lineOpacity: drawing.lineOpacity }
            fail(Math.abs(drawing.poseT - 1) <= 1e-9 && stats.openingClear === 1 && stats.paperOpacity === 1 && Math.abs(drawing.lineOpacity - 1) <= 1e-9,
              `${name}: post-handoff sheet must stay a fully extracted, fully opaque sheet (poseT ${drawing.poseT}, clear ${stats.openingClear}, opacity ${stats.paperOpacity}, lineOpacity ${drawing.lineOpacity})`)
          }
          if (progress < 0.12) checkProbes(snap, name)
          if (progress === introProgress(0.38) || progress === introProgress(0.79)) {
            const registration = snap.optional.captureRegistration
            const features = registration?.projectedFeatures
            fail(!registration?.error && Array.isArray(features) && features.length > 0
              && features.every(feature => Number.isFinite(feature.errorPixels)), `${name}: registered-hold feature measurements unavailable`)
            const maxErrorPixels = Array.isArray(features) ? Math.max(...features.map(feature => feature.errorPixels)) : NaN
            checkpoint.registeredHold = { phase: drawing.phase, maxErrorPixels, projectedFeatures: features ?? null }
            fail(maxErrorPixels <= 0.1, `${name}: registered-hold error ${maxErrorPixels} px > 0.1 px`)
            if (progress === introProgress(0.79)) {
              const contact = registration?.contact, exactContact = registration?.exactContact
              const contactDelta = Array.isArray(contact) && Array.isArray(exactContact)
                ? Math.max(...contact.map((value, index) => Math.abs(value - exactContact[index])))
                : Number.NaN
              checkpoint.liveExtractionSolve = { source: '__drawingProof.captureRegistration', crossing: registration?.crossing, travel: registration?.travel, contact, exactContact, contactDelta }
              fail(Number.isFinite(registration?.crossing) && registration.crossing > 0.4 && registration.crossing < 1,
                `${name}: live extraction crossing unavailable/out of range (${registration?.crossing})`)
              fail(Number.isFinite(registration?.travel) && registration.travel > 0,
                `${name}: live extraction travel unavailable/non-positive (${registration?.travel})`)
              fail(Number.isFinite(contactDelta) && contactDelta <= 1e-9,
                `${name}: live contact solve disagrees with exact support vertex (delta ${contactDelta} m)`)
            }
          }
          const cameraPose = { x: snap.telemetry?.camera?.x, y: snap.telemetry?.camera?.y, z: snap.telemetry?.camera?.z, fov: snap.telemetry?.camera?.fov }
          if (registeredCameraProgresses.has(progress)) {
            checkpoint.registeredCamera = cameraPose
            fail(Number.isFinite(cameraPose.x + cameraPose.y + cameraPose.z + cameraPose.fov), `${name}: registered camera pose unavailable`)
            if (direction === 'forward') {
              const previousCamera = [...result.checkpoints].reverse()
                .find(c => c.mode === 'real-scroll' && c.direction === 'forward' && c.progress < progress && c.registeredCamera)
              if (previousCamera) {
                const moved = Math.hypot(cameraPose.x - previousCamera.registeredCamera.x, cameraPose.y - previousCamera.registeredCamera.y, cameraPose.z - previousCamera.registeredCamera.z)
                const fovDelta = Math.abs(cameraPose.fov - previousCamera.registeredCamera.fov)
                checkpoint.registeredCameraDelta = { fromProgress: previousCamera.progress, moved, fovDelta }
                fail(moved <= 0.001 && fovDelta <= 0.001, `${name}: registered camera moved before .79 (delta ${moved} m, fov ${fovDelta})`)
              }
            }
          }
          if (progress === introProgress(0.92)) {
            const hold = result.checkpoints.find(c => c.mode === 'real-scroll' && c.direction === 'forward' && c.registeredCamera && c.progress === introProgress(0.79))
            const moved = hold?.registeredCamera && Number.isFinite(cameraPose.x + cameraPose.y + cameraPose.z + cameraPose.fov)
              ? Math.hypot(cameraPose.x - hold.registeredCamera.x, cameraPose.y - hold.registeredCamera.y, cameraPose.z - hold.registeredCamera.z)
              : Number.NaN
            checkpoint.tiltCamera = { ...cameraPose, holdDelta: moved }
            fail(Number.isFinite(moved) && moved > 0.005, `${name}: camera did not move off the flat registration view (delta ${moved} m)`)
          }
          if (progress === introProgress(0.97)) {
            checkpoint.approximateWaveEnd = { phase: drawing.phase, waveTime: drawing.waveTime, waveEnabled: drawing.waveEnabled, lineOpacity: drawing.lineOpacity, liveCrossing: drawing.crossing }
            fail(Number.isFinite(drawing.waveTime) && drawing.waveTime > 0.9 && drawing.waveTime <= 1.001,
              `${name}: approximate real-scroll wave time out of range (${drawing.waveTime})`)
          }
          if (progress === 0.12) {
            const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
            const rawShare = scroll.raw / Math.max(maxScroll, 1)
            checkpoint.scrollMap = { rawShare, expectedProgress: scroll.expected, productionMap: 'window.__drawingProof.scrollToProgress -> rawScrollFor' }
            checkpoint.approximateRelease = { contactShadow: snap.sheetStats?.contactShadow, contactRadius: snap.sheetStats?.contactRadius, lineOpacity: drawing.lineOpacity }
            fail(Math.abs(rawShare - 0.5) <= 0.001 && Math.abs(scroll.expected - progress) <= 0.001,
              `${name}: dynamic rawScrollFor handoff expected raw share .50 and progress .12, got ${rawShare}/${scroll.expected}`)
            // Hero transit metadata (restored): measure the CH.02 section from the live DOM
            // rather than trusting the layout literals. Paced evaluation prefers a production
            // probe when the page exposes one; the current proof API only maps paced -> raw
            // (`scrollToProgress`), so the default path is the independent share-.50 anchors.
            const transit = await page.evaluate(() => {
              const section = document.querySelector('[data-chapter="1"]')
              const max = document.documentElement.scrollHeight - window.innerHeight
              if (!(section instanceof HTMLElement) || max <= 0) return null
              const rect = section.getBoundingClientRect()
              const top = window.scrollY + rect.top
              const rawStart = (top - window.innerHeight) / max
              const rawEnd = (top + rect.height) / max
              const paced = typeof window.__drawingProof?.pacedProgress === 'function'
                ? (raw) => window.__drawingProof.pacedProgress(raw)
                : null
              return {
                elementTopPx: top, elementHeightPx: rect.height, documentTravelPx: max,
                rawStart, rawEnd,
                pacedStart: paced ? paced(rawStart) : null,
                pacedEnd: paced ? paced(rawEnd) : null,
              }
            })
            checkpoint.heroTransit = transit ? {
              ...transit,
              expectedRaw: HERO_TRANSIT.raw,
              expectedPaced: HERO_TRANSIT.paced,
              evaluation: transit.pacedStart === null ? 'independent share-.50 raw anchors' : 'production pacedProgress probe',
            } : null
            fail(Boolean(transit), `${name}: [data-chapter="1"] transit metadata unavailable (section or document travel)`)
            if (transit) {
              fail(transit.rawEnd > transit.rawStart, `${name}: hero transit end must follow its start (${transit.rawStart} -> ${transit.rawEnd})`)
              // Ordering is the pacing fix itself: the pre-fix layout opened the transit at raw
              // .345364 and had it 69% consumed by the .50 handoff.
              fail(transit.rawStart > 0.5, `${name}: hero transit opens at raw ${transit.rawStart}; expected past the .50 intro handoff`)
              if (transit.pacedStart === null) {
                fail(Math.abs(transit.rawStart - HERO_TRANSIT.raw.start) <= 0.001 && Math.abs(transit.rawEnd - HERO_TRANSIT.raw.end) <= 0.001,
                  `${name}: hero transit raw ${transit.rawStart.toFixed(6)}/${transit.rawEnd.toFixed(6)} outside the share-.50 derivation ${HERO_TRANSIT.raw.start}/${HERO_TRANSIT.raw.end}`)
              } else {
                fail(Math.abs(transit.pacedStart - HERO_TRANSIT.paced.start) <= 0.002 && Math.abs(transit.pacedEnd - HERO_TRANSIT.paced.end) <= 0.002,
                  `${name}: hero transit paced ${transit.pacedStart}/${transit.pacedEnd} outside the retained CH.02 window ${HERO_TRANSIT.paced.start}/${HERO_TRANSIT.paced.end}`)
              }
            }
          }
          if (releaseGatePoints.includes(progress)) {
            const rig = snap.telemetry?.rig ?? {}
            const gateSide = progress < 0.12 ? 'release-epsilon (drawing still owns the frame)' : 'post-handoff'
            checkpoint.releaseGate = {
              side: gateSide,
              measuredProgress: snap.telemetry?.scroll?.progress,
              progressError: Math.abs((snap.telemetry?.scroll?.progress ?? Number.NaN) - progress),
              drawingPhase: drawing.phase,
              rig: { explodeFactor: rig.explodeFactor, gearRotation: rig.gearRotation, ghostOpacity: rig.ghostOpacity, shift: rig.shift },
            }
            // The CH.02 transit has not started at these points, so no partially advanced
            // mechanics are allowed on the frames around the handoff. Camera pose is
            // deliberately NOT asserted here: the handoff legitimately moves the camera.
            // .1199 rides the drawing-hold branch (`progress <= releaseEnd`), .1201/.13 ride the
            // animated branch with the scrub still at timeline time 0 — both must read rest.
            fail(Number.isFinite(rig.explodeFactor) && Math.abs(rig.explodeFactor) <= 1e-6,
              `${name}: ${gateSide} rig explodeFactor expected 0, got ${rig.explodeFactor}`)
            fail(Number.isFinite(rig.gearRotation) && Math.abs(rig.gearRotation) <= 1e-6,
              `${name}: ${gateSide} rig gearRotation expected 0, got ${rig.gearRotation}`)
            fail(Number.isFinite(rig.ghostOpacity) && Math.abs(rig.ghostOpacity - 1) <= 1e-6,
              `${name}: ${gateSide} rig ghostOpacity expected 1, got ${rig.ghostOpacity}`)
          }
          await page.screenshot({ path: path.join(out, `${name}.png`), timeout: 15000 })
          save(`${name}.json`, checkpoint)
        }
      }
      // Pass 2 — exact pinned frames for phase metadata, inclusive endpoints, immutable lamp
      // keys, and discontinuities. This is not mapping or visual-pixel evidence.
      if (!reduced && !canvasInactive) {
        result.pinnedCheckpoints = []
        for (const [sampleIndex, sample] of pinnedSamples.entries()) {
          const before = await read()
          await page.evaluate(p => window.__drawingProof.setProgress(p), sample.progress)
          const frame = await page.evaluate(() => Promise.race([
            window.__drawingProof.captureNextFrame(),
            new Promise(resolve => setTimeout(() => resolve(null), 10000)),
          ]))
          fail(frame !== null, `${config.name}: pinned frame callback timed out at ${sample.progress}`)
          const snap = await read()
          const active = hasActiveCanvas(snap)
          const live = active && liveCanvas(before, snap)
          const tier = snap.telemetry?.performance?.tier
          const name = `${config.name}-pinned-${String(sampleIndex).padStart(2, '0')}-${sample.progress.toFixed(6)}`
          const drawing = frame?.drawing ?? snap.telemetry?.drawing ?? {}
          const checkpoint = { name, mode: 'pinned', progress: sample.progress, requestedT: sample.phase?.t ?? sample.lamp?.t, live, tier, frameDrawing: frame?.drawing ?? null, ...snap }
          result.pinnedCheckpoints.push(checkpoint)
          if (!active) {
            result.canvasInactive = { name, tier, gl: snap.gl, note: 'pinned render canvas disconnected/lost' }
            fail(false, `${name}: WEBGL_CANVAS_INACTIVE (connected/renderable canvas absent)`)
            canvasInactive = true
            break
          }
          fail(live, `${name}: no live pinned-frame GL submission`)
          fail(tier === expectedTier, `${name}: expected ${expectedTier} tier for pinned phase evidence, got ${tier}`)
          const expectedT = sample.phase?.t ?? sample.lamp?.t
          const phaseError = Math.abs(drawing.phase - expectedT)
          checkpoint.pinnedPhase = { expectedT, measuredPhase: drawing.phase, phaseError, epsilon: PINNED_PHASE_EPSILON }
          fail(phaseError <= PINNED_PHASE_EPSILON, `${name}: pinned phase error ${phaseError} > ${PINNED_PHASE_EPSILON}`)
          if (sample.lamp) {
            checkpoint.lampSample = { ...sample.lamp, measuredLampPower: drawing.lampPower }
            fail(Math.abs(drawing.lampPower - sample.lamp.power) <= 0.001,
              `${name}: lamp key ${sample.lamp.role} at u=${sample.lamp.u} expected ${sample.lamp.power}, got ${drawing.lampPower}`)
          }
          if (sample.phase?.t === 0.38) {
            fail(drawing.lampPower >= 0.999 && drawing.blackout <= 0.001 && drawing.pulse <= 0.001, `${name}: exact .38 hold must be lit and pulse-free`)
          }
          if (sample.phase?.t === 0.58) {
            fail(drawing.lampPower <= 0.001 && drawing.blackout >= 0.999 && drawing.pulse <= 0.001, `${name}: exact .58 dark hold must be pulse-free`)
          }
          if (sample.phase?.t === 0.66) {
            fail(drawing.lampPower <= 0.001 && drawing.blackout >= 0.999 && drawing.pulse >= 0.999 && drawing.pulseHead <= 0.001, `${name}: exact .66 pulse start mismatch`)
          }
          if (sample.phase?.t === 0.79) {
            fail(drawing.lampPower <= 0.001 && drawing.blackout >= 0.999 && drawing.pulse >= 0.999 && Math.abs(drawing.pulseHead - 1) <= 0.001,
              `${name}: exact .79 pulse end mismatch`)
            fail(Math.abs(drawing.bulgeDisplacement) <= 1e-9 && Math.abs(drawing.pbr) <= 1e-9,
              `${name}: exact .79 bulge/metal start mismatch (bulge ${drawing.bulgeDisplacement}, pbr ${drawing.pbr})`)
          }
          if (sample.phase?.t === 0.84) {
            const expected = expectedBreakthrough(0.84)
            // Pressure is at its authored peak with the lamp returning and the fracture not yet
            // begun: the sheet is still closed and opaque, with lit metal pushing underneath.
            fail(drawing.lampPower === 0 && drawing.blackout === 1 && drawing.bulgeDisplacement > 0 && drawing.bulgeDisplacement <= 0.012,
              `${name}: exact .84 return/bulge mismatch`)
            fail(Math.abs(snap.sheetStats?.fracture - expected.fracture) <= 1e-9 && snap.sheetStats?.openingClear === 0,
              `${name}: exact .84 fracture-start mismatch (fracture ${snap.sheetStats?.fracture}, openingClear ${snap.sheetStats?.openingClear})`)
            fail(Math.abs(snap.sheetStats?.crackWeb - expected.crackWeb) <= 1e-9 && Math.abs(snap.sheetStats?.crackGlow - expected.crackGlow) <= 1e-9,
              `${name}: exact .84 crack web/glow mismatch (web ${snap.sheetStats?.crackWeb}, glow ${snap.sheetStats?.crackGlow})`)
            fail(drawing.pbr === 1 && drawing.illumination === 0 && drawing.poseT > 0.4,
              `${name}: exact .84 metal/motion mismatch (pbr ${drawing.pbr}, poseT ${drawing.poseT})`)
          }
          if (sample.phase?.t === 0.86) {
            const expected = expectedBreakthrough(0.86)
            // Halfway through fracture, the causal object continues rising in full light.
            fail(Math.abs(drawing.lampPower - expected.lampPower) <= 1e-9 && expected.lampPower === 0 && drawing.pbr === 1 && drawing.illumination === 0 && drawing.poseT > 0.4,
              `${name}: exact .86 lamp-return/fracture mismatch (lamp ${drawing.lampPower}, pbr ${drawing.pbr}, pose ${drawing.poseT})`)
            fail(Math.abs(snap.sheetStats?.fracture - expected.fracture) <= 1e-9 && Math.abs(snap.sheetStats?.crackWeb - expected.crackWeb) <= 1e-9 && snap.sheetStats?.openingClear === 0,
              `${name}: exact .86 fracture stats mismatch (fracture ${snap.sheetStats?.fracture}, web ${snap.sheetStats?.crackWeb}, clear ${snap.sheetStats?.openingClear})`)
          }
          if (sample.phase?.t === 0.88) {
            const expected = expectedBreakthrough(0.88)
            // The fracture completes exactly at .88 with the lit object already emerging.
            fail(snap.sheetStats?.openingClear === 1 && Math.abs(snap.sheetStats?.fracture - 1) <= 1e-9 && snap.sheetStats?.crackWeb === 0,
              `${name}: exact .88 fracture-end mismatch (clear ${snap.sheetStats?.openingClear}, fracture ${snap.sheetStats?.fracture}, web ${snap.sheetStats?.crackWeb})`)
            fail(Math.abs(drawing.poseT - expected.poseT) <= 1e-9 && drawing.pbr === 1 && drawing.illumination === 0,
              `${name}: exact .88 barrier/metal/light ordering mismatch (pose ${drawing.poseT}, pbr ${drawing.pbr})`)
            fail(Math.abs(snap.sheetStats?.paperOpacity - 1) <= 1e-9 && Math.abs(snap.sheetStats?.maxBoundaryDeviation) <= 0.0006 && snap.sheetStats?.fragmentThickness > 0,
              `${name}: exact .88 opaque-stock contract mismatch`)
          }
          if (sample.phase?.t === 0.8405 || sample.phase?.t === 0.845) {
            checkBreakthrough(await captureBreakthrough(), name, expectedBreakthrough(sample.phase.t), checkpoint)
            fail(drawing.pbr === 1 && drawing.illumination === 0 && drawing.poseT > 0.4 && snap.sheetStats?.fracture > 0,
              `${name}: first rupture must reveal already pushing metal`)
          }
          if (sample.phase?.t === 0.90) {
            const expected = expectedBreakthrough(0.90)
            fail(Math.abs(drawing.pbr - expected.pbr) <= 1e-9 && drawing.lampPower === 0,
              `${name}: exact .90 fully resolved metal mismatch (pbr ${drawing.pbr})`)
          }
          if (sample.phase?.t === 0.97) {
            fail(drawing.waveTime >= 0.999 && drawing.waveTime <= 1.001 && drawing.waveEnabled === 0 && drawing.lineOpacity >= 0.999,
              `${name}: exact .97 wave-end mismatch (waveTime ${drawing.waveTime}, enabled ${drawing.waveEnabled}, lineOpacity ${drawing.lineOpacity})`)
          }
          if (sample.phase?.t === 1) {
            // The print never fades: the sheet holds full opacity through the handoff and only
            // leaves the frame through its authored .18-.22 retirement motion.
            fail(Math.abs(drawing.poseT - 1) <= 1e-9 && Math.abs(drawing.lineOpacity - 1) <= 1e-9 && drawing.waveEnabled === 0,
              `${name}: exact release drawing mismatch (pose ${drawing.poseT}, lineOpacity ${drawing.lineOpacity}, waveEnabled ${drawing.waveEnabled})`)
            fail(Math.abs(snap.sheetStats?.paperOpacity - 1) <= 1e-9 && snap.sheetStats?.openingClear === 1,
              `${name}: exact release stock must stay opaque with the opening cleared (opacity ${snap.sheetStats?.paperOpacity}, clear ${snap.sheetStats?.openingClear})`)
            fail(Math.abs(snap.sheetStats?.contactShadow) <= 1e-9, `${name}: exact release contact expected 0, got ${snap.sheetStats?.contactShadow}`)
          }
          save(`${name}.json`, checkpoint)
        }
        await page.evaluate(() => window.__drawingProof.release())
      }
      // Compare authored deterministic real-scroll channels at identical requested targets.
      // Quick intentionally has no reverse comparison; a full run remains the completion gate.
      for (const forward of result.checkpoints.filter(c => !quick && c.mode === 'real-scroll' && c.direction === 'forward')) {
        const reverse = result.checkpoints.find(c => c.mode === 'real-scroll' && c.direction === 'reverse' && c.progress === forward.progress)
        const deltas = {}
        for (const key of ['phase', 'poseT', 'pulse', 'pulseHead', 'lineOpacity', 'minZ', 'paperFlex', 'flexAmplitude', 'lightSweep', 'lightSweepPosition', 'lampPower', 'blackout', 'lightningLuminance', 'bulgeDisplacement', 'readingPool', 'inkLuminance', 'pbr', 'waveTime', 'waveEnabled']) {
          const a = forward.telemetry?.drawing?.[key], b = reverse?.telemetry?.drawing?.[key]
          if (typeof a === 'number' && typeof b === 'number') deltas[key] = Math.abs(a - b)
        }
        for (const key of ['flexAmplitude', 'flexPeakDisplacement', 'contactShadow', 'contactRadius']) {
          const a = forward.sheetStats?.[key], b = reverse?.sheetStats?.[key]
          if (typeof a === 'number' && typeof b === 'number') deltas[`sheet.${key}`] = Math.abs(a - b)
        }
        const passed = Object.keys(deltas).length > 0 && Object.values(deltas).every(n => n <= 0.002)
        // Breakthrough channels are deterministic functions of scroll, so they must match the
        // forward pass exactly - counts, flags, areas and the fragment transforms alike.
        const fractureDeltas = {}
        for (const key of ['fracture', 'openingClear', 'crackGlow', 'crackWeb', 'fragmentCount', 'fragmentThickness', 'fragmentArea', 'holeArea', 'maxBoundaryDeviation', 'paperOpacity', 'modelBarrierSafe']) {
          const a = forward.sheetStats?.[key], b = reverse?.sheetStats?.[key]
          if (typeof a === 'number' && typeof b === 'number') fractureDeltas[key] = Math.abs(a - b)
        }
        const fragmentTransforms = (() => {
          const a = forward.breakthroughProof?.fragments, b = reverse?.breakthroughProof?.fragments
          if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
            return a === undefined && b === undefined ? { compared: false } : { compared: true, delta: Infinity, count: -1 }
          }
          let delta = 0
          for (let i = 0; i < a.length; i += 1) {
            for (const axis of ['position', 'rotation']) {
              const left = a[i][axis] ?? [], right = b[i][axis] ?? []
              if (left.length !== right.length) return { compared: true, delta: Infinity, count: a.length }
              for (let k = 0; k < left.length; k += 1) delta = Math.max(delta, Math.abs(left[k] - right[k]))
            }
          }
          return { compared: true, delta, count: a.length }
        })()
        const fracturePassed = Object.values(fractureDeltas).every(n => n <= 1e-9)
          && (!fragmentTransforms.compared || fragmentTransforms.delta <= 1e-9)
        result.reverse.push({ progress: forward.progress, deltas, passed, fractureDeltas, fragmentTransforms, fracturePassed })
        fail(passed, `reverse ${forward.progress}: deterministic drawing mismatch`)
        fail(fracturePassed, `reverse ${forward.progress}: breakthrough stats or fragment transforms not deterministic (stats ${JSON.stringify(fractureDeltas)}, fragments ${JSON.stringify(fragmentTransforms)})`)
      }      const last = await read()
      result.shaderFailures = last.shaderFailures
      result.contextLosses = last.contextLosses
      fail(last.shaderFailures.length === 0 && last.contextLosses === 0, 'shader link failure or context loss')
      if (!reduced) {
        result.exposedInspection = { methods: last.proofMethods, note: 'Required probes must return measurement evidence while the sheet is present. Raw measurements are retained for registration and bounds review; probe presence alone does not establish geometric correctness.' }
        result.unavailable = ['capturePulseRegistration', 'captureTextBounds', 'captureTitleBounds'].filter(k => !last.proofMethods.includes(k))
        fail(result.unavailable.length === 0, `required proof probes unavailable: ${result.unavailable.join(', ')}`)
      }
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
  const peakOf = name => report.cases.find(c => c.name === name)?.checkpoints
    .find(c => c.mode === 'real-scroll' && c.direction === 'forward' && c.progress === introProgress(0.84))?.peakFlex
  report.flexTierComparison = ['desktop', 'narrow'].map(base => {
    const full = peakOf(base), lite = peakOf(`${base}-lite`)
    if (!full || !lite) return { base, compared: false }
    const passed = full.tier === 'full' && lite.tier === 'lite'
      && full.peakDisplacement > lite.peakDisplacement && full.peakDisplacement <= 0.012
      && lite.peakDisplacement > 0 && lite.peakDisplacement <= 0.0054
    return { base, compared: true, full: full.peakDisplacement, lite: lite.peakDisplacement, passed }
  })
  report.passed = report.cases.length === cases.length && report.cases.every(c => c.passed)
    && report.flexTierComparison.every(c => !c.compared || c.passed)
  try { report.gitEnd = execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }) } catch {}
  save('summary.json', report)
  console.log(`Evidence: ${out}`)
}
process.exitCode = report.passed ? 0 : 1
