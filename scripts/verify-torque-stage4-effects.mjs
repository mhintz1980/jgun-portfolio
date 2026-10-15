/**
 * JG-038 Stage 4 real-runtime effects verifier (parent telemetry contract v1).
 *
 * Extends the opening-ab conventions with the effects surfaces the parent owns:
 *   - production build provenance hashed from file BYTES plus served-byte matching
 *     (the opening-ab aggregate hashed filenames only and is explicitly weak)
 *   - hardware-class launch recording; the narrative renderer name is read from
 *     snapshot.renderer (backend/rendererName plus drawingBuffer and effectiveDpr
 *     per the parent contract). NO separate GL context is created for probing;
 *     until the field lands the hardware claim stays UNVERIFIED.
 *   - requested/effective tier with measured effective DPR and drawing-buffer size,
 *     asserted against the approved contract-18 ceilings for the tier under test
 *   - viewport provenance: nested Playwright viewport + observed innerWidth/
 *     innerHeight/devicePixelRatio asserted against the request (the pre-fix
 *     opening-ab/pit-ab runs silently ran 1280x720 and their both-viewport claims
 *     are unreliable until the corrected captures land)
 *   - unaltered PNG coverage across opening, rupture, emergence, pit and handoffs;
 *     fractional progress samples use 4-decimal file tags so names never collide
 *   - stationary/reverse/seek determinism against the approved contract-18
 *     tolerances, including the portal pulse (no wall-clock drift while held)
 *   - camera handoff sampling across sheet->overview, overview->ring, ring->shaft
 *     and shaft->overview, recorded as DIAGNOSTICS ONLY: the ring/shaft windows
 *     sit outside the Stage 4 opening exit and no synthetic threshold claims C1.
 *   - effectsCapture null-render proof: fixed camera, non-vacuous aperture
 *     sampling, zero desk leakage inside the profile, zero visible far closure;
 *     lit model visible through the aperture during rupture (p0.428/0.435) and
 *     gone at emergence (p0.46+); walls-only shaft contribution
 *   - electricity: emission bursts (electricalEnergy/pitFissureEnergy) in the pit
 *     window t0.845-0.87 (six bursts; sampled p0.422-0.426) and emission fields
 *     zero after emergence.
 *     electricalOutline/electricalBranch accumulate to 1 and pitReveal latches by
 *     design, so they are recorded but never counted as emissions. Missing parent
 *     fields are recorded UNVERIFIED; no assertion requires energy to stay above
 *     zero at any time.
 *
 * Usage: node scripts/verify-torque-stage4-effects.mjs --url=http://localhost:<port>/torque-wrench/
 *        --out=<new evidence dir> --build-dir=<worktree .scratch production build>
 *        [--viewport=D|N]
 *
 * pitGeometryAb is parent-owned attribution and is intentionally not invoked here.
 * This script closes no gate and infers no owner, Astra or pit-geometry attribution.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sha256 = data => createHash('sha256').update(data).digest('hex')
const finite = x => typeof x === 'number' && Number.isFinite(x)
// Fetch transparently decompresses Content-Encoding:gzip, including these .gz
// public inputs. Hash raw response bytes to compare the actual copied file.
const rawResponse = url => new Promise((resolve, reject) => {
  const client = new URL(url).protocol === 'https:' ? https : http
  client.get(url, { headers: { 'Accept-Encoding': 'identity' } }, response => {
    const chunks = []
    response.on('data', chunk => chunks.push(chunk))
    response.on('end', () => resolve({ ok: response.statusCode === 200, bytes: Buffer.concat(chunks),
      contentEncoding: response.headers['content-encoding'] ?? null }))
    response.on('error', reject)
  }).on('error', reject)
})
// Collision-safe artifact tag: fractional samples keep 4 decimals (0.4205 would
// otherwise round onto 0.42's 3-decimal name).
const fileTag = p => Math.abs(p * 1000 - Math.round(p * 1000)) < 1e-8 ? p.toFixed(3) : p.toFixed(4)

const VIEWPORTS = {
  D: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  N: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true },
}

// Opening walk (opening-ab roster) extended through the post-emergence window so
// electricity-after-emergence and the pit-visible span are both actually sampled.
const SAMPLES = [0, 0.06, 0.15, 0.265, 0.32, 0.36, 0.395, 0.408, 0.415, 0.42,
  0.422, 0.423, 0.424, 0.426, 0.428, 0.435, 0.46, 0.47, 0.48, 0.49, 0.5, 0.52]
// Rupture points show the lit model THROUGH the torn aperture; at emergence the
// model has passed through and modelChangedPixels must read zero again.
const EFFECTS_POINTS = [0.428, 0.435, 0.46]
// Camera handoff windows: sheet->overview at 0.46, overview->ring 0.69,
// ring->shaft 0.735, shaft->overview 0.94.
const HANDOFF_WINDOWS = [
  { name: 'sheet-to-overview', start: 0.44, end: 0.48, step: 0.005 },
  { name: 'overview-to-ring', start: 0.68, end: 0.7, step: 0.0025 },
  { name: 'ring-to-shaft', start: 0.7275, end: 0.7425, step: 0.0025 },
  { name: 'shaft-to-overview', start: 0.9325, end: 0.9475, step: 0.0025 },
]
const ELECTRICAL_FIELDS = ['pitReveal', 'pitFissureEnergy', 'electricalEnergy',
  'electricalOutline', 'electricalBranch']
// True emission fields only. electricalOutline/electricalBranch accumulate to 1
// and pitReveal latches to 1 by design; counting them would assert growth as energy.
const EMISSION_FIELDS = ['electricalEnergy', 'pitFissureEnergy']
const EMERGENCE_ZERO_POINTS = [0.46, 0.48, 0.5, 0.52]

// Approved contract-18 deterministic-state tolerances.
const HOLD_POSITION_DRIFT_M = 1e-4
const HOLD_QUAT_DRIFT_DEG = 0.01
const HOLD_FOV_DRIFT_DEG = 0.01
const CHANNEL_DRIFT = 1e-4
const CANON_EPS = 1e-9
// Approved contract-18 rendering ceilings (full / lite).
const TIER_CEILINGS = {
  full: { maxEffectiveDpr: 1.5, maxBufferPixels: 3686400 },
  lite: { maxEffectiveDpr: 1, maxBufferPixels: 2073600 },
}
const WALK_SETTLE_MS = 1200
const DETERMINISM_SETTLE_MS = 2000
const SEEK_SETTLE_MS = 2500
const HOLD_SPAN_MS = 5000

function parseArgs(argv) {
  const args = { viewport: 'D' }
  for (const raw of argv) {
    const m = /^--([a-z-]+)=(.*)$/i.exec(raw)
    if (!m || !['url', 'out', 'build-dir', 'viewport', 'source-manifest'].includes(m[1])) {
      throw new Error('usage: --url=... --out=... --build-dir=... [--viewport=D|N]')
    }
    args[m[1] === 'build-dir' ? 'buildDir' : m[1] === 'source-manifest' ? 'sourceManifest' : m[1]] = m[2]
  }
  for (const key of ['url', 'out', 'buildDir', 'sourceManifest']) if (!args[key]) throw new Error('--' + key + ' is required')
  if (!VIEWPORTS[args.viewport]) throw new Error('--viewport must be D or N')
  return args
}

function buildProvenance(buildDir, sourceManifest) {
  const sourceBytes = readFileSync(sourceManifest)
  const source = JSON.parse(sourceBytes)
  const changed = source.files.filter(f => sha256(readFileSync(path.join(ROOT, f.path))) !== f.sha256)
  if (changed.length) throw new Error('Frozen input drift: ' + changed.map(f => f.path).join(', '))
  if (sha256(JSON.stringify(source.files)) !== source.sourceAggregateSha256) throw new Error('Source aggregate mismatch')
  const manifest = JSON.parse(readFileSync(path.join(buildDir, '.vite/manifest.json'), 'utf8'))
  const entry = Object.values(manifest).find(v => v.isEntry && /torque-wrench/.test(v.file))?.file
  if (!entry) throw new Error('torque-wrench entry missing from the build manifest')
  const files = []
  for (const [key, value] of Object.entries(manifest)) {
    if (!value.file) continue
    // Byte hash of the built file. The aggregate hashes these byte digests, never
    // filenames alone.
    files.push({ key, path: value.file, sha256: sha256(readFileSync(path.join(buildDir, value.file))) })
    for (const asset of value.css ?? []) if (!files.some(f => f.path === asset)) files.push({ key: 'css', path: asset,
      sha256: sha256(readFileSync(path.join(buildDir, asset))) })
  }
  files.push({ key: 'html', path: 'torque-wrench/index.html', sha256: sha256(readFileSync(path.join(buildDir, 'torque-wrench/index.html'))) })
  const publicPaths = source.files.filter(f => f.path.startsWith('public/')).map(f => {
    const p = f.path.slice(7), digest = sha256(readFileSync(path.join(buildDir, p)))
    if (digest !== f.sha256) throw new Error('Copied public asset mismatch: ' + p)
    if (!files.some(x => x.path === p)) files.push({ key: 'public:' + p, path: p, sha256: digest })
    return p
  })
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  const aggregateSha256 = sha256(files.map(f => f.path + ' ' + f.sha256).join('\n'))
  return { buildDir, entry, fileCount: files.length, aggregateSha256, files, publicPaths,
    verifierSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    source: { path: sourceManifest, sha256: sha256(sourceBytes), aggregateSha256: source.sourceAggregateSha256,
      branch: source.branch, head: source.head, verifiedInputCount: source.files.length },
    note: 'aggregateSha256 covers per-file BYTE digests, unlike the filename-only opening-ab aggregate' }
}

async function servedProvenance(url, provenance) {
  const htmlBytes = Buffer.from(await (await fetch(url)).arrayBuffer())
  const servedHtmlSha256 = sha256(htmlBytes)
  const text = htmlBytes.toString('utf8')
  const expected = new Map(provenance.files.map(f => [f.path, f.sha256]))
  const assetUrls = [...expected.keys()].filter(p => /\.(js|css)$/.test(p) || provenance.publicPaths.includes(p))
    .map(p => new URL('/' + p, url).href)
  const assets = []
  for (const assetUrl of assetUrls) {
    const response = await rawResponse(assetUrl)
    const bytes = response.bytes
    const digest = sha256(bytes)
    const matched = response.ok && expected.get(new URL(assetUrl).pathname.slice(1)) === digest
    assets.push({ url: assetUrl, sha256: digest, contentEncoding: response.contentEncoding, matchedToBuild: matched })
  }
  const htmlMatchesBuildEntry = provenance.files.some(f => f.path.endsWith('.html') && f.sha256 === servedHtmlSha256)
  const pass = assets.length > 0 && assets.every(a => a.matchedToBuild) && htmlMatchesBuildEntry
  return { servedHtmlSha256, htmlMatchesBuildEntry, pass, assets,
    matchedCount: assets.filter(a => a.matchedToBuild).length, mismatches: assets.filter(a => !a.matchedToBuild).map(a => a.url) }
}

function quatAngleDegrees(a, b) {
  const dot = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])
  return 2 * Math.acos(Math.min(1, dot)) * 180 / Math.PI
}
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const canonOpening = o => ({ pressure: o.pressure, fracture: o.fracture,
  openingClear: o.openingClear, poseT: o.poseT, t: o.t })
const canonDelta = (a, b) => Object.keys(a).reduce((max, k) => Math.max(max, Math.abs((a[k] ?? 0) - (b[k] ?? 0))), 0)

function makeHarness(result) {
  const check = (name, pass, actual) => result.assertions.push({ name, pass: Boolean(pass), actual })
  const unverified = (name, reason) => result.unverified.push({ name, reason })
  return { check, unverified }
}

function pickElectrical(stats) {
  const present = ELECTRICAL_FIELDS.filter(f => typeof stats[f] === 'number' && Number.isFinite(stats[f]))
  const fields = {}
  for (const f of present) fields[f] = stats[f]
  return { present, fields }
}

async function settleAt(page, progress, settleMs) {
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  const y = Math.round(max * progress)
  const before = await page.evaluate(() => window.__torqueWorld.snapshot().frames)
  await page.evaluate(y => scrollTo(0, y), y)
  // A timer alone cannot establish matched progress after native scroll. Fail
  // explicitly if the live world/conductor never reaches this pixel's target.
  await page.waitForFunction(({ y, max, before }) => {
    const s = window.__torqueWorld?.snapshot?.()
    return s?.frames > before && Math.abs(scrollY - y) <= 0.5
      && Math.abs(s.progress - y / max) <= 0.5 / max
  }, { y, max, before }, { timeout: 15000 })
  await page.waitForTimeout(settleMs)
}

async function readObservation(page) {
  return page.evaluate(() => {
    const s = window.__torqueWorld.snapshot()
    const canvas = document.querySelector('.torque-scene canvas')
    const stats = s.sheet?.stats ?? {}
    return {
      progress: s.progress, frames: s.frames, hiddenFrames: s.hiddenFrames,
      camera: s.camera, opening: s.opening, renderer: s.renderer,
      mechanicalTier: s.mechanical?.tier ?? null, sheetTier: s.sheet?.tier ?? null,
      stats: {
        portalLight: stats.portalLight ?? null,
        portalPulse: stats.portalPulse ?? null,
        portalActive: stats.portalActive ?? null,
        shaderWarmReady: stats.shaderWarmReady ?? null,
        crackGlow: stats.crackGlow ?? null,
        crackWeb: stats.crackWeb ?? null,
        fracture: stats.fracture ?? null,
        openingClear: stats.openingClear ?? null,
        pitReveal: stats.pitReveal ?? null,
        pitFissureEnergy: stats.pitFissureEnergy ?? null,
        electricalEnergy: stats.electricalEnergy ?? null,
        electricalOutline: stats.electricalOutline ?? null,
        electricalBranch: stats.electricalBranch ?? null,
      },
      narrative: window.__torqueNarrative?.snapshot?.() ?? null,
      viewport: canvas ? { innerWidth, innerHeight, devicePixelRatio,
        canvasWidth: canvas.width, canvasHeight: canvas.height,
        cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight } : null,
    }
  })
}

async function capturePng(page, outDir, file, artifacts) {
  const png = await page.screenshot({ path: path.join(outDir, file), animations: 'allow' })
  artifacts.push({ file, bytes: png.length, sha256: sha256(png) })
}

async function runViewport(browser, args) {
  const spec = VIEWPORTS[args.viewport]
  const result = { viewport: spec, samples: [], effects: [], holds: [], reverse: [],
    seek: [], continuity: [], artifacts: [], errors: [], assertions: [], unverified: [] }
  const { check, unverified } = makeHarness(result)
  // Playwright requires the NESTED viewport shape; flat width/height is ignored and
  // silently yields the 1280x720 default.
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: spec.deviceScaleFactor, isMobile: spec.isMobile,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  page.on('pageerror', error => result.errors.push({ kind: 'pageerror', message: String(error) }))
  page.on('console', message => { if (message.type() === 'error') result.errors.push({ kind: 'console', message: message.text() }) })
  try {
    const url = new URL(args.url)
    url.searchParams.set('quality', 'full')
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => {
      const s = window.__torqueWorld?.snapshot?.()
      return s?.ready && s.sheet?.baked && s.opening && document.querySelector('.torque-scene canvas')
    }, null, { timeout: 120000 })

    const observed = await page.evaluate(() => ({ innerWidth, innerHeight, devicePixelRatio }))
    result.observedViewport = observed
    check('viewport observed matches request (post-fix harness)', observed.innerWidth === spec.width
      && observed.innerHeight === spec.height && observed.devicePixelRatio === spec.deviceScaleFactor,
      { requested: spec, observed })

    const first = await readObservation(page)
    check('private effects shaders compiled before opening capture', first.stats.shaderWarmReady === 1, first.stats.shaderWarmReady)
    const rendererName = first.renderer?.backend ?? first.renderer?.rendererName ?? null
    result.rendererName = rendererName
    if (typeof rendererName === 'string' && rendererName.length > 0) {
      const software = /swiftshader|llvmpipe|software|basic render/i.test(rendererName)
      check('narrative renderer is hardware-class', !software, rendererName)
    } else {
      check('narrative renderer name published in snapshot.renderer.backend', false,
        'renderer.backend/rendererName missing from snapshot (field has landed in the parent contract)')
    }
    const requestedTier = url.searchParams.get('quality')
    result.tier = { requested: requestedTier, storeTier: first.mechanicalTier, sheetTier: first.sheetTier,
      ...first.viewport }
    const reportedDpr = first.renderer?.effectiveDpr
    const reportedBuffer = first.renderer?.drawingBuffer
    const effectiveDpr = finite(reportedDpr) ? reportedDpr
      : first.viewport ? first.viewport.canvasWidth / first.viewport.cssWidth : null
    const bufferPixels = Array.isArray(reportedBuffer) && reportedBuffer.every(finite)
      ? reportedBuffer[0] * reportedBuffer[1]
      : first.viewport ? first.viewport.canvasWidth * first.viewport.canvasHeight : null
    result.tier.effectiveDpr = effectiveDpr
    result.tier.drawingBufferPixels = bufferPixels
    const ceiling = TIER_CEILINGS[requestedTier] ?? null
    result.tier.ceiling = ceiling
    check('requested tier equals effective tier on sheet and store', requestedTier === first.mechanicalTier
      && requestedTier === first.sheetTier, { requestedTier, storeTier: first.mechanicalTier, sheetTier: first.sheetTier })
    if (ceiling && finite(effectiveDpr) && finite(bufferPixels)) {
      check('effective DPR within approved tier ceiling', effectiveDpr <= ceiling.maxEffectiveDpr + 1e-6,
        { effectiveDpr, maxEffectiveDpr: ceiling.maxEffectiveDpr })
      check('drawing-buffer pixels within approved tier ceiling', bufferPixels <= ceiling.maxBufferPixels,
        { bufferPixels, maxBufferPixels: ceiling.maxBufferPixels })
    } else {
      unverified('tier ceiling check', 'canvas measurement unavailable')
    }

    let electricalPresent = null
    const forwardByProgress = new Map()
    for (const p of SAMPLES) {
      await settleAt(page, p, WALK_SETTLE_MS)
      const obs = await readObservation(page)
      const electrical = pickElectrical({ ...obs.stats })
      if (electricalPresent === null) electricalPresent = electrical.present
      const file = args.viewport + '-p' + fileTag(p) + '.png'
      await capturePng(page, args.out, file, result.artifacts)
      result.samples.push({ requested: p, ...obs, electrical: electrical.fields })
      forwardByProgress.set(p, obs)
    }
    result.electricalFieldsPresent = electricalPresent ?? []
    check('required electrical fields finite at every sample', result.samples.every(s => ELECTRICAL_FIELDS.every(f => finite(s.electrical[f]))), ELECTRICAL_FIELDS)
    if (!electricalPresent?.length) {
      unverified('electricity emissions (burst at rupture, zero after emergence, outline by end of intro)',
        'pitReveal/pitFissureEnergy/electricalEnergy/electricalOutline/electricalBranch are not published in sheet.stats yet')
      unverified('no permanently glowing seams',
        'needs electrical emission time-series/flags; portalLight residual is recorded as a diagnostic only')
    }

    const opening = result.samples.map(s => s.opening)
    check('every sample exposes finite opening telemetry', opening.every(o => o && finite(o.pressure)
      && finite(o.fracture) && finite(o.t) && finite(o.poseT) && finite(o.openingClear)),
      opening.map(o => o?.t))
    check('bake crossing solved and installed', finite(opening[0]?.crossing) && opening.every(o => o.bakeInstalled === true),
      opening[0]?.crossing)
    const pressures = opening.map(o => o.pressure)
    check('pressure is monotone non-decreasing across the forward walk',
      pressures.every((v, i) => i === 0 || v >= pressures[i - 1] - 1e-9), pressures)
    const midBulge = result.samples.filter(s => s.opening.pressure > 0 && s.opening.pressure < 1)
      .sort((a, b) => b.opening.pressure - a.opening.pressure)[0]
    check('paper still opaque part-way through the model-driven bulge', midBulge
      && midBulge.opening.openingClear === 0 && midBulge.opening.fracture < 1,
      midBulge && { requested: midBulge.requested, openingClear: midBulge.opening.openingClear, fracture: midBulge.opening.fracture })
    const atEmergence = result.samples.find(s => s.requested === 0.46)?.opening
    check('opening complete at the emergence handoff', atEmergence && atEmergence.openingClear === 1,
      atEmergence && { openingClear: atEmergence.openingClear, fracture: atEmergence.fracture })
    check('camera pose finite at every sample', result.samples.every(s => s.camera
      && s.camera.position.every(finite) && s.camera.target.every(finite)
      && s.camera.quaternion.every(finite) && finite(s.camera.fov)), result.samples.length)
    check('renderer reports live draw calls', result.samples.every(s => s.renderer && s.renderer.calls > 0),
      result.samples.at(-1)?.renderer)
    check('no page or console errors during the walk', result.errors.length === 0, result.errors)

    if (electricalPresent?.length) {
      const at = p => result.samples.find(s => Math.abs(s.requested - p) < 1e-9)
      const burstWindow = [0.422, 0.423, 0.424, 0.426].map(at).filter(Boolean)
      const burst = Math.max(...burstWindow.flatMap(s => EMISSION_FIELDS.map(f => s.electrical[f] ?? 0)))
      check('emission bursts inside the pit window t0.845-0.87', burst > 0,
        { burst, window: burstWindow.map(s => ({ requested: s.requested, electrical: s.electrical })) })
      const introEnd = at(0.395)
      check('outline electricity accumulated by the end of intro', introEnd
        && (introEnd.electrical.electricalOutline ?? 0) > 0, introEnd?.electrical)
      const after = EMERGENCE_ZERO_POINTS.map(p => at(p)).filter(Boolean)
      const residuals = after.flatMap(s => EMISSION_FIELDS.map(f => s.electrical[f] ?? 0))
      check('emission fields fully off after emergence (no permanent emission)',
        residuals.every(v => Math.abs(v) <= CANON_EPS),
        after.map(s => ({ requested: s.requested, electrical: s.electrical })))
    }
    const residualPortal = result.samples.filter(s => s.requested >= 0.46)
      .map(s => ({ requested: s.requested, portalLight: s.stats.portalLight, portalPulse: s.stats.portalPulse }))
    result.portalResidualDiagnostic = residualPortal
    check('zero portal emission after emergence', residualPortal.every(s => Math.abs(s.portalLight) <= CANON_EPS), residualPortal)
    result.electricalPixels = []
    for (const p of [0.395, 0.423, 0.424]) {
      await settleAt(page, p, WALK_SETTLE_MS)
      const capture = await page.evaluate(() => window.__torqueWorld.electricityCapture())
      const observation = await readObservation(page)
      result.electricalPixels.push({ requested: p, capture, stats: observation.stats })
      check('electrical null-render fixed and restored at ' + p, capture.fixedCamera && capture.controlChangedPixels === 0 && capture.restoredChangedPixels === 0, capture)
      if (p === 0.395) {
        check('profile and interior electricity both visible', capture.profileChangedPixels > 0 && capture.interiorChangedPixels > 0, capture)
      } else if (p === 0.423) {
        check('pit fissure electricity visible during burst', capture.pitFissureChangedPixels > 0 && observation.stats.pitFissureEnergy > 0, capture)
      } else {
        check('dark hold has no profile interior or pit emission pixels', capture.profileChangedPixels === 0 && capture.interiorChangedPixels === 0 && capture.pitFissureChangedPixels === 0
          && observation.stats.electricalEnergy === 0 && observation.stats.pitFissureEnergy === 0, capture)
      }
    }

    // Direct null-render proof that no cavern appears before actual rupture.
    await settleAt(page, 0.415, WALK_SETTLE_MS)
    const intactPit = await page.evaluate(() => window.__torqueWorld.effectsCapture())
    check('pit fully occluded before rupture', intactPit.fullFramePortalChangedPixels === 0, intactPit.fullFramePortalChangedPixels)
    // Effects null-render proof at pit-visible progress points.
    let sawActiveCapture = false
    for (const p of EFFECTS_POINTS) {
      await settleAt(page, p, WALK_SETTLE_MS)
      const call = await page.evaluate(() => {
        try { return { ok: true, capture: window.__torqueWorld.effectsCapture() } }
        catch (error) { return { ok: false, error: String(error) } }
      })
      const entry = { requested: p, ...call }
      result.effects.push(entry)
      if (!call.ok) { check('effectsCapture usable at ' + p.toFixed(3), false, call.error); continue }
      const c = call.capture
      check('pit active at required effects point ' + p, c.portalActive === true, c.portalActive)
      check('effectsCapture shader programs valid at ' + p.toFixed(3), c.shaderValid === true, c.shaderValid)
      check('effectsCapture camera unchanged at ' + p.toFixed(3), c.cameraUnchanged === true, c.cameraUnchanged)
      if (c.portalActive) {
        sawActiveCapture = true
        const rupturePoint = p < 0.46
        check('aperture sampling non-vacuous at ' + p.toFixed(3), c.sampledInsidePixels > 0, c.sampledInsidePixels)
        check('no desk changed inside the aperture at ' + p.toFixed(3), c.deskChangedInsidePixels === 0,
          c.deskChangedInsidePixels)
        check('no visible far closure inside the aperture at ' + p.toFixed(3), c.capChangedPixels === 0,
          c.capChangedPixels)
        if (rupturePoint) {
          check('lit model visible inside the aperture during rupture at ' + p.toFixed(3),
            c.modelLitPixels > 0, { modelLitPixels: c.modelLitPixels, modelMaxLuminance: c.modelMaxLuminance })
        } else {
          check('model no longer inside the aperture at emergence ' + p.toFixed(3),
            c.modelChangedPixels === 0, c.modelChangedPixels)
        }
        check('shaft walls are the visible portal surface at ' + p.toFixed(3), c.wallChangedPixels > 0,
          c.wallChangedPixels)
        check('far closure occluded by design at ' + p.toFixed(3), c.closureOccluded === true, c.closureOccluded)
        check('portal contribution confined to the aperture (corner controls) at ' + p.toFixed(3),
          c.controls.every(ctl => ctl.portalChangedPixels === 0), c.controls)
      }
    }
    if (!sawActiveCapture) {
      unverified('effects null-render proof', 'portal was not active at any effects point on this run; portal-active window must be located before these assertions bind')
    }

    // Stationary holds: live frames but frozen canonical state, including pulse.
    for (const p of [0.15, 0.52]) {
      await settleAt(page, p, DETERMINISM_SETTLE_MS)
      const a = await readObservation(page)
      await page.waitForTimeout(HOLD_SPAN_MS)
      const b = await readObservation(page)
      const hold = { requested: p,
        positionDriftM: dist3(a.camera.position, b.camera.position),
        quatDriftDeg: quatAngleDegrees(a.camera.quaternion, b.camera.quaternion),
        fovDriftDeg: Math.abs(a.camera.fov - b.camera.fov),
        portalLightDrift: Math.abs((a.stats.portalLight ?? 0) - (b.stats.portalLight ?? 0)),
        openingCanonicalDrift: canonDelta(canonOpening(a.opening), canonOpening(b.opening)),
        framesA: a.frames, framesB: b.frames, framesAdvanced: b.frames > a.frames }
      result.holds.push(hold)
      check('stationary hold at ' + p + ' freezes camera', hold.positionDriftM <= HOLD_POSITION_DRIFT_M
        && hold.quatDriftDeg <= HOLD_QUAT_DRIFT_DEG && hold.fovDriftDeg <= HOLD_FOV_DRIFT_DEG, hold)
      check('stationary hold at ' + p + ' freezes opening canonical state',
        hold.openingCanonicalDrift <= CANON_EPS, hold.openingCanonicalDrift)
      check('portal pulse deterministic under hold at ' + p, hold.portalLightDrift <= CHANNEL_DRIFT,
        hold.portalLightDrift)
      check('frames advance during stationary hold at ' + p + ' (live render, not frozen)',
        hold.framesAdvanced, { framesA: hold.framesA, framesB: hold.framesB })
    }

    // Reverse retraces the forward walk.
    for (const p of [...SAMPLES].reverse()) {
      await settleAt(page, p, DETERMINISM_SETTLE_MS)
      const obs = await readObservation(page)
      const fwd = forwardByProgress.get(p)
      const rec = { requested: p,
        observedProgress: obs.progress, observedOpening: canonOpening(obs.opening),
        forwardProgress: fwd?.progress ?? null,
        positionDeltaM: fwd ? dist3(fwd.camera.position, obs.camera.position) : null,
        quatDeltaDeg: fwd ? quatAngleDegrees(fwd.camera.quaternion, obs.camera.quaternion) : null,
        fovDeltaDeg: fwd ? Math.abs(fwd.camera.fov - obs.camera.fov) : null,
        portalLightDelta: fwd ? Math.abs((fwd.stats.portalLight ?? 0) - (obs.stats.portalLight ?? 0)) : null,
        openingCanonicalDelta: fwd ? canonDelta(canonOpening(fwd.opening), canonOpening(obs.opening)) : null }
      result.reverse.push(rec)
    }
    check('reverse retraces camera within contract-18 tolerances', result.reverse.every(r => r.positionDeltaM !== null
      && r.positionDeltaM <= HOLD_POSITION_DRIFT_M && r.quatDeltaDeg <= HOLD_QUAT_DRIFT_DEG
      && r.fovDeltaDeg <= HOLD_FOV_DRIFT_DEG),
      { maxPositionDeltaM: Math.max(...result.reverse.map(r => r.positionDeltaM ?? Infinity)),
        maxQuatDeltaDeg: Math.max(...result.reverse.map(r => r.quatDeltaDeg ?? Infinity)),
        maxFovDeltaDeg: Math.max(...result.reverse.map(r => r.fovDeltaDeg ?? Infinity)) })
    check('reverse retraces opening canonical state', result.reverse.every(r => r.openingCanonicalDelta !== null
      && r.openingCanonicalDelta <= CANON_EPS),
      Math.max(...result.reverse.map(r => r.openingCanonicalDelta ?? Infinity)))
    check('reverse retraces portal pulse', result.reverse.every(r => r.portalLightDelta !== null
      && r.portalLightDelta <= CHANNEL_DRIFT), Math.max(...result.reverse.map(r => r.portalLightDelta ?? Infinity)))

    // Direct seek from the top.
    for (const p of [0.15, 0.435, 0.52]) {
      await settleAt(page, 0, DETERMINISM_SETTLE_MS)
      await settleAt(page, p, SEEK_SETTLE_MS)
      const obs = await readObservation(page)
      const fwd = forwardByProgress.get(p)
      const rec = { requested: p,
        observedProgress: obs.progress, observedOpening: canonOpening(obs.opening),
        forwardProgress: fwd?.progress ?? null,
        positionDeltaM: fwd ? dist3(fwd.camera.position, obs.camera.position) : null,
        quatDeltaDeg: fwd ? quatAngleDegrees(fwd.camera.quaternion, obs.camera.quaternion) : null,
        fovDeltaDeg: fwd ? Math.abs(fwd.camera.fov - obs.camera.fov) : null,
        openingCanonicalDelta: fwd ? canonDelta(canonOpening(fwd.opening), canonOpening(obs.opening)) : null }
      result.seek.push(rec)
    }
    check('direct seek reproduces forward state within contract-18 tolerances', result.seek.every(r =>
      r.positionDeltaM !== null && r.positionDeltaM <= HOLD_POSITION_DRIFT_M
      && r.quatDeltaDeg <= HOLD_QUAT_DRIFT_DEG && r.fovDeltaDeg <= HOLD_FOV_DRIFT_DEG
      && r.openingCanonicalDelta <= CANON_EPS),
      { max: Math.max(...result.seek.map(r => r.positionDeltaM ?? Infinity)),
        maxOpening: Math.max(...result.seek.map(r => r.openingCanonicalDelta ?? Infinity)) })

    // Camera handoff continuity windows.
    for (const w of HANDOFF_WINDOWS) {
      const pts = []
      for (let p = w.start; p <= w.end + 1e-9; p = +(p + w.step).toFixed(6)) {
        await settleAt(page, p, WALK_SETTLE_MS)
        const obs = await readObservation(page)
        const file = args.viewport + '-h-' + w.name + '-p' + p.toFixed(4) + '.png'
        await capturePng(page, args.out, file, result.artifacts)
        pts.push({ requested: p, position: obs.camera.position, fov: obs.camera.fov,
          beatId: obs.narrative?.beatId ?? null, stateKey: obs.narrative?.stateKey ?? null })
      }
      const jumps = pts.slice(1).map((pt, i) => ({
        from: pts[i].requested, to: pt.requested,
        positionJumpM: dist3(pts[i].position, pt.position),
        fovJumpDeg: Math.abs(pts[i].fov - pt.fov),
      }))
      result.continuity.push({ window: w.name, points: pts, jumps,
        maxPositionJumpM: Math.max(...jumps.map(j => j.positionJumpM)),
        maxFovJumpDeg: Math.max(...jumps.map(j => j.fovJumpDeg)) })
    }
    result.continuityDiagnosticOnly = true
    check('unaltered PNG captured for every sample', result.artifacts.length === SAMPLES.length
      + HANDOFF_WINDOWS.reduce((n, w) => n + Math.round((w.end - w.start) / w.step) + 1, 0), result.artifacts.length)
    check('no runtime errors through complete roster', result.errors.length === 0, result.errors)
    unverified('camera handoff continuity as Stage 4 exit evidence',
      'windows are recorded as diagnostics only: ring/shaft windows sit outside the Stage 4 opening exit and a synthetic adjacent-sample threshold cannot claim C1; derivative classification is parent-contract/G5 scope')
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
const startedAt = new Date().toISOString()
mkdirSync(args.out, { recursive: true })
const provenance = buildProvenance(args.buildDir, args.sourceManifest)
const served = await servedProvenance(args.url, provenance)

const browser = await launchBrowser((await import('playwright')).chromium)
let runtime
try { runtime = await runViewport(browser, args) } finally { await browser.close() }

const report = {
  schema: 'JG-038-stage4-effects-v2', startedAt, finishedAt: new Date().toISOString(),
  url: args.url, launch: describeLaunch(), provenance, served,
  scope: 'Real-runtime effects proof over the parent contract v1. No pit-geometry attribution (pitGeometryAb is parent-owned), no gate closure, no owner or Astra acceptance.',
  runtime,
}
const outFile = path.join(args.out, 'stage4-effects-report.json')
writeFileSync(outFile, JSON.stringify(report, null, 2))
console.log('served provenance: ' + served.matchedCount + '/' + served.assets.length + ' assets byte-matched'
  + (served.mismatches.length ? '; MISMATCHES: ' + served.mismatches.join(', ') : ''))
console.log('runtime ' + args.viewport + ': ' + (runtime.pass ? 'PASS' : 'FAIL') + ' ('
  + runtime.assertions.filter(a => a.pass).length + '/' + runtime.assertions.length + ' assertions, '
  + runtime.unverified.length + ' unverified)')
if (runtime.failed.length) console.log('failed: ' + runtime.failed.join(' | '))
if (runtime.unverified.length) console.log('unverified: ' + runtime.unverified.map(u => u.name).join(' | '))
console.log('report: ' + outFile)
process.exit(runtime.pass && served.pass ? 0 : 1)
