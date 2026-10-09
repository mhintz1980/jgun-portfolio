/**
 * JG-036 Scope 1 keeper-hotspot layering verifier.
 *
 * Usage:
 *   node scripts/verify-jg036-hotspot-layering.mjs --url=http://localhost:5199
 *   node scripts/verify-jg036-hotspot-layering.mjs --static-only   (CPU static contract, no browser)
 *   Optional fallback only: --quality-lock (functional/visual candidate when the
 *   inherited canvas collapse reproduces; this excludes G6/performance claims).
 *
 * Contract:
 *   - Windows uses the installed Chrome channel with ANGLE/D3D11 (hardware).
 *   - Desktop and narrow both test the three owner-selected keepers naturally.
 *   - Every selection is a real actionability-checked click. This script never
 *     calls DOM click(), Locator.click({ force }), or a synthetic click event.
 *   - elementFromPoint is sampled only after scroll/camera settling.
 *   - Missing natural badges are reported as open product gates, not hidden by
 *     diagnostic anchor unblocking.
 *   - Inspect goals are checked against the authored frame plus the exact
 *     CameraRig wrappers (rotor explode offset, authored portrait dolly/FOV
 *     ramp, framing-bias target shift); telemetry never vouches for itself.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { describeLaunch, launchBrowser } from './lib/browser-launch.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (key, fallback) =>
  process.argv.find((value) => value.startsWith(`--${key}=`))?.split('=').slice(1).join('=') ?? fallback
const url = arg('url', 'http://localhost:5199')
const qualityLock = process.argv.includes('--quality-lock') || process.argv.includes('--qualityLock')
const staticOnly = process.argv.includes('--static-only')
const targetUrl = new URL(url)
if (qualityLock) targetUrl.searchParams.set('qualityLock', '1')
const label = arg('label', 'keeper-layering').replace(/[^a-z0-9_-]/gi, '-')
const out = path.resolve(
  arg('out', path.join(root, 'project/work/evidence/JG-036-hotspot-clickability/z-order-2026-10-08')),
)
fs.mkdirSync(out, { recursive: true })

const KEEPERS = [
  {
    id: 'rotor',
    label: 'AIR MOTOR ROTOR',
    occurrence: 'ROTOR-1',
    chapters: [0, 1],
    progress: 0.25,
    assembly: 'JGun torque multiplier',
    inspectFrame: { position: [0.18, 0.08, 0.12], target: [0, 0, -0.06], fov: 24 },
    producer: 'station1-legacy',
  },
  {
    id: 'duct-intake',
    label: 'DATUM F — 1,850 CFM INTAKE AIRWAY',
    occurrence: 'DUCT_INTAKE',
    chapters: [2],
    progress: 0.6,
    assembly: 'RL-300 acoustic enclosure',
    inspectFrame: { position: [29.8, 1.6, -2.8], target: [28, 1.11, -5.05], fov: 28 },
    producer: 'station2-stage',
  },
  {
    id: 'm249-trunnion',
    label: 'DATUM B — BARREL TRUNNION BORE',
    occurrence: 'BARREL_TRUNNION',
    chapters: [3],
    progress: 0.83,
    assembly: 'M249 receiver',
    inspectFrame: { position: [56.22, 0.25, -11.35], target: [56, 0.03, -11.85], fov: 22 },
    producer: 'station3-stage',
  },
]

// Authored case-study module, loaded once by sourceContract and reused by the
// runtime oracle so EXPLODE_OFFSETS, framingBiasVec, and HOTSPOTS detail text
// come from the same source CameraRig/TechnicalHUD consume.
let dataModule = null

const report = {
  task: 'JG-036 Scope 1 hotspot layering and keeper revival',
  url: targetUrl.href,
  qualityLock,
  evidenceClass: qualityLock ? 'quality-locked functional/visual candidate; G6/performance excluded' : 'normal-quality candidate',
  qualityPolicy: 'Run without --quality-lock first. A quality-locked rerun is allowed only if the inherited global canvas failure reproduces; it never closes tier/performance/G6.',
  label,
  startedAt: new Date().toISOString(),
  browser: describeLaunch(),
  servedModelProof: 'NOT ATTRIBUTION: this browser verifier asserts no model identity; model selection is parent-owned',
  ownerDecision: {
    narrowed: 'One legacy keeper per assembly in the Station 1 Hotspots layer; later additions are a separate task.',
    extras: 'Station 2 enclosure and Station 3 M249 stage producers keep their extra callout badges active; owner-permitted (2026-10-08).',
    producerPaths: [
      'src/scene/Hotspots.tsx (Station 1 legacy keeper filter)',
      'src/scene/stages/Station2_AcousticEnclosure.tsx (Station 2 stage callouts)',
      'src/scene/stages/M249Stage.tsx (Station 3 stage anchors)',
    ],
    inspectParallax: 'PRESERVED: existing inspect parallax behavior deliberately kept (owner decision 2026-10-08).',
  },
  staticContract: {},
  cases: [],
  reducedRoute: null,
  openGates: [],
  failures: [],
}

const fail = (message) => {
  report.failures.push(message)
  console.error(`FAIL: ${message}`)
}
const openGate = (message) => {
  report.openGates.push(message)
  console.warn(`OPEN: ${message}`)
}
const camDistance = (a, b) =>
  Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0), (a.z ?? 0) - (b.z ?? 0))

const readCamera = (page) =>
  page.evaluate(() => ({
    ...(window.__telemetry?.camera ?? {}),
    progress: window.__telemetry?.scroll?.progress,
    chapter: window.__telemetry?.scroll?.chapter,
    explodeFactor: window.__telemetry?.rig?.explodeFactor,
  }))

const seek = async (page, progress) => {
  await page.evaluate((target) => {
    window.__scrollCommitDisabled = true
    window.__drawingProof?.scrollToProgress(target)
  }, progress)
  await page.waitForFunction(
    (target) => Math.abs((window.__telemetry?.scroll?.progress ?? -1) - target) < 0.002,
    progress,
    { timeout: 30000 },
  )
  // The prior diagnosis measured false coverage during HUD/camera transitions.
  // Rest means no synthetic scroll or pointer motion during this settle window.
  await page.waitForTimeout(1800)
  const before = await readCamera(page)
  await page.waitForTimeout(350)
  const after = await readCamera(page)
  return { camera: after, restDelta: camDistance(before, after) }
}

// Reach a chapter by its real DOM position: natural scrollIntoView on the
// actual [data-chapter] section, then let the scroll commit settle. Bounded
// native wheel nudges are used only if the section sits exactly on the
// trigger boundary. block:'center' lands mid-chapter: block:'start' parks the
// section top at the viewport top, which for chapter 1 is BELOW the card
// attach gate (CHAPTER_RANGES[1] starts 0.24, block:'start' lands ~0.235)
// while telemetry already reports chapter 1 there, so the card never mounts
// and the nudge recovery never runs. No raw progress seeks on this path.
const gotoChapterSection = async (page, chapterIndex) => {
  const section = page.locator(`[data-chapter="${chapterIndex}"]`)
  await section.waitFor({ state: 'attached', timeout: 20000 })
  await section.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }))
  const chapterReached = () =>
    page.evaluate((idx) => window.__telemetry?.scroll?.chapter === idx, chapterIndex)
  if (!(await chapterReached())) {
    for (let index = 0; index < 8 && !(await chapterReached()); index += 1) {
      await page.mouse.wheel(0, 360)
      await page.waitForTimeout(400)
    }
  }
  await page.waitForFunction(
    (idx) => window.__telemetry?.scroll?.chapter === idx,
    chapterIndex,
    { timeout: 30000 },
  )
  await page.waitForTimeout(1500)
  const before = await readCamera(page)
  await page.waitForTimeout(350)
  const after = await readCamera(page)
  return { camera: after, restDelta: camDistance(before, after) }
}

const hitProbe = (page, x, y) =>
  page.evaluate(({ x: px, y: py }) => {
    const element = document.elementFromPoint(px, py)
    if (!element) return { present: false }
    const chain = []
    let cursor = element
    for (let index = 0; index < 6 && cursor; index += 1, cursor = cursor.parentElement) {
      chain.push({
        tag: cursor.tagName,
        className: String(cursor.className || ''),
        dataLayer: cursor.dataset?.jg036HotspotLayer ? 'hotspot-layer' : undefined,
      })
    }
    return {
      present: true,
      tag: element.tagName,
      text: element.textContent?.trim().slice(0, 120) ?? '',
      chain,
      inHotspotLayer: Boolean(element.closest('[data-jg036-hotspot-layer]')),
      closestBadge: element.closest('button[aria-pressed]')?.textContent?.trim().slice(0, 120) ?? '',
    }
  }, { x, y })

const badgeLocator = (page, keeper) =>
  page.locator('button[aria-pressed]').filter({ hasText: keeper.label }).first()

// Authored mirrors of CameraRig's intro-handoff factor (introTimeline.ts).
// Every keeper sits far past the ramp; modeling it exactly keeps the oracle
// honest rather than assuming the constant 1.
const clamp01 = (value) => Math.min(Math.max(value, 0), 1)
const smoothstepT = (t) => t * t * (3 - 2 * t)
const DRAWING_INTRO_RELEASE_END = 0.12

const authoredInspectGoal = (keeper, caseDef, camera) => {
  const progress = camera.progress ?? keeper.progress
  const aspect = caseDef.width / Math.max(caseDef.height, 1)
  const portrait = aspect < 0.9

  // CameraRig §6: authored frame + rotor exploded-handle offset.
  const rotorOffsetZ =
    keeper.id === 'rotor' ? dataModule.EXPLODE_OFFSETS.handle * (camera.explodeFactor ?? 0) : 0
  const framePosition = keeper.inspectFrame.position.map((value, index) =>
    index === 2 ? value + rotorOffsetZ : value,
  )
  const frameTarget = keeper.inspectFrame.target.map((value, index) =>
    index === 2 ? value + rotorOffsetZ : value,
  )
  let fov = keeper.inspectFrame.fov

  // CameraRig §6.5: authored portrait dolly ramp and FOV widening.
  const portraitW = smoothstepT(clamp01((progress - 0.5) / 0.06))
  const ch4 = progress >= 0.76 ? smoothstepT(Math.min((progress - 0.76) / 0.24, 1)) : 0
  const dolly = portrait ? 1 + portraitW * (1 + 0.8 * ch4) : 1
  fov += portrait ? 10 * portraitW : 0
  const dollyPosition = dolly > 1
    ? frameTarget.map((value, index) => value + (framePosition[index] - value) * dolly)
    : framePosition

  // CameraRig §7: framing bias along camera-left (desktop) / portrait -Y.
  const biasVec = dataModule.framingBiasVec(progress)
  const att = (lo, hi) =>
    Math.min(Math.max((progress - lo) / 0.015, 0), Math.max((hi - progress) / 0.015, 0), 1)
  const flightAtt = 1 - 0.75 * Math.max(att(0.53, 0.598), att(0.722, 0.758))
  const afterIntro = smoothstepT(clamp01((progress - DRAWING_INTRO_RELEASE_END) / 0.03))
  const biasX = (portrait ? biasVec.x * 0.25 * flightAtt : biasVec.x * flightAtt) * afterIntro
  const biasY = (portrait ? biasVec.y : 0) * afterIntro
  const finalTarget = [...frameTarget]
  if (biasX > 0.0001 || biasY > 0.0001) {
    const fwd = finalTarget.map((value, index) => value - dollyPosition[index])
    const dist = Math.hypot(...fwd)
    if (dist > 0.0001) {
      const fovRad = (fov * Math.PI) / 180
      if (biasX > 0.0001) {
        const left = [fwd[2], 0, -fwd[0]]
        const leftLen = Math.hypot(...left)
        if (leftLen > 0.0001) {
          const meters = (biasX * dist * Math.tan(fovRad / 2) * aspect) / leftLen
          finalTarget[0] += left[0] * meters
          finalTarget[2] += left[2] * meters
        }
      }
      if (biasY > 0.0001) finalTarget[1] -= biasY * dist * Math.tan(fovRad / 2)
    }
  }
  return { progress, aspect, portrait, framePosition, frameTarget, dolly, fov, finalTarget, biasX, biasY }
}

const inspectGoalCheck = (camera, keeper, caseDef) => {
  const goal = camera.goal
  if (!goal || goal.position?.length !== 3 || goal.target?.length !== 3 || typeof goal.fov !== 'number') {
    return { ok: false, reason: 'telemetry.camera.goal is missing position/target/fov' }
  }
  if (!dataModule?.EXPLODE_OFFSETS || typeof dataModule.framingBiasVec !== 'function') {
    return { ok: false, reason: 'authored caseStudies oracle module unavailable' }
  }

  const expected = authoredInspectGoal(keeper, caseDef, camera)
  // Verify the authored dolly ramp independently; the unwrap below uses the
  // authored value so telemetry.portraitDolly cannot vouch for itself.
  const dollyDelta = Math.abs((camera.portraitDolly ?? 1) - expected.dolly)
  // Unwrap around the pre-bias dolly pivot. Pointer parallax (<= .036) and the
  // rotor rest orbit (<= .006) are the only unobservable residuals left.
  const unwrappedPosition = expected.frameTarget.map(
    (value, index) => value + (goal.position[index] - value) / expected.dolly,
  )
  const positionDelta = Math.hypot(
    ...unwrappedPosition.map((value, index) => value - expected.framePosition[index]),
  )
  const targetDelta = Math.hypot(...goal.target.map((value, index) => value - expected.finalTarget[index]))
  const fovDelta = Math.abs(goal.fov - expected.fov)
  const positionLimit = 0.045
  const targetLimit = 0.01
  const fovLimit = 0.01
  const ok =
    dollyDelta <= 0.001 && positionDelta <= positionLimit && targetDelta <= targetLimit && fovDelta <= fovLimit
  const reason = ok
    ? undefined
    : dollyDelta > 0.001
      ? 'telemetry portraitDolly differs from the authored ramp'
      : positionDelta > positionLimit
        ? 'unwrapped inspect position exceeds the parallax/orbit budget'
        : targetDelta > targetLimit
          ? 'inspect target differs from the authored frame plus exact framing bias'
          : 'inspect FOV differs from the authored portrait FOV'
  return {
    ok,
    reason,
    expected,
    actual: { position: goal.position, target: goal.target, fov: goal.fov, portraitDolly: camera.portraitDolly },
    unwrappedPosition,
    positionDelta,
    targetDelta,
    fovDelta,
    dollyDelta,
    limits: { position: positionLimit, target: targetLimit, fov: fovLimit, dolly: 0.001 },
  }
}

const probeAndClickBadge = async (page, keeper, caseDef) => {
  const caseName = caseDef.name
  const allBadges = page.locator('button[aria-pressed]')
  const count = await allBadges.count()
  if (count === 0) {
    const context = await page.evaluate(() => ({
      progress: window.__telemetry?.scroll?.progress,
      chapter: document.body.textContent?.match(/CH\.0\d[^\n]{0,30}/)?.[0] ?? null,
      canvas: Boolean(document.querySelector('canvas')),
    }))
    openGate(
      `${caseName}/${keeper.id}: natural zero-badge render blocker at progress ${context.progress}; chapter=${context.chapter}; canvas=${context.canvas}`,
    )
    fail(`${caseName}/${keeper.id}: expected the naturally rendered keeper badge, found none`)
    return null
  }
  // Owner ruling 2026-10-08: Station 2/3 stage producers keep their own extra
  // callout badges live, so the total badge census is recorded (badgeCount),
  // not asserted; the distinct-count census is a separate task.

  const badge = badgeLocator(page, keeper)
  await badge.waitFor({ state: 'visible', timeout: 20000 })
  const box = await badge.boundingBox()
  if (!box) {
    fail(`${caseName}/${keeper.id}: badge has no viewport box`)
    return null
  }
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  const hit = await hitProbe(page, x, y)
  // The deepest element at the badge center may be the button's own label
  // descendant (real clicks reach the button by bubbling). A hit passes only
  // when it resolves INSIDE this keeper's button within the hotspot layer; a
  // foreign overlay or a different badge still fails (label mismatch).
  const isBadgeHit =
    hit.inHotspotLayer &&
    ((hit.tag === 'BUTTON' && (hit.text || '').includes(keeper.label)) ||
      (hit.closestBadge || '').includes(keeper.label))
  if (!isBadgeHit) {
    fail(
      `${caseName}/${keeper.id}: elementFromPoint returned ${hit.tag}/${hit.text || '(empty)'} instead of the keeper button`,
    )
  }

  // Pin the pointer before entry. The real click uses this same point; after the
  // real close click we restore it before comparing the exit baseline.
  await page.mouse.move(x, y)
  await page.waitForTimeout(450)
  const cameraBefore = await readCamera(page)
  // Default click only: Playwright waits for visibility, stability, and pointer
  // reception. A covered badge times out rather than being forced through.
  await badge.click({ timeout: 20000 })
  // Authored culling hides the selected badge while its inspect card is open
  // (anchor leaves the frustum on the inspect camera); selection state is
  // proven by the aria-pressed wait + HUD card checks below, so no post-click
  // badge-visible wait is asserted here.
  await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll('button[aria-pressed]')].some(
        (b) => b.textContent?.includes(label) && b.getAttribute('aria-pressed') === 'true',
      ),
    keeper.label,
    { timeout: 20000 },
  )
  await page.waitForTimeout(1800)
  const cameraAfter = await readCamera(page)
  const inspectGoal = inspectGoalCheck(cameraAfter, keeper, caseDef)
  if (!inspectGoal.ok) {
    fail(`${caseName}/${keeper.id}: ${inspectGoal.reason}`)
  }

  const close = page.getByRole('button', { name: 'Close hotspot detail' })
  await close.waitFor({ state: 'visible', timeout: 10000 })
  // Scope to the selected detail card: body text contains the badge label
  // before selection, so a body scan cannot prove the HUD opened.
  const detailCard = close.locator('xpath=ancestor::div[2]')
  const cardText = (await detailCard.textContent()) ?? ''
  const def = dataModule?.HOTSPOTS.find((hotspot) => hotspot.id === keeper.id)
  if (!def) {
    fail(`${caseName}/${keeper.id}: authored hotspot definition unavailable for HUD card oracle`)
  } else {
    if (!cardText.includes(keeper.label)) fail(`${caseName}/${keeper.id}: HUD card label missing`)
    if (!cardText.includes(def.detail)) fail(`${caseName}/${keeper.id}: HUD card detail missing`)
    if (!cardText.includes(`OCCURRENCE: ${def.occurrence}`)) {
      fail(`${caseName}/${keeper.id}: HUD card occurrence missing`)
    }
  }
  await close.click({ timeout: 10000 })
  await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll('button[aria-pressed]')].some(
        (b) => b.textContent?.includes(label) && b.getAttribute('aria-pressed') === 'false',
      ),
    keeper.label,
    { timeout: 15000 },
  )
  await close.waitFor({ state: 'detached', timeout: 15000 })
  await page.mouse.move(x, y)
  await page.waitForTimeout(1200)
  const cameraExited = await readCamera(page)
  const goalBefore = cameraBefore.goal
  const goalAfterExit = cameraExited.goal
  const goalDelta = goalBefore && goalAfterExit
    ? Math.hypot(
        ...goalBefore.position.map((value, index) => value - goalAfterExit.position[index]),
        ...goalBefore.target.map((value, index) => value - goalAfterExit.target[index]),
      )
    : Number.POSITIVE_INFINITY
  const progressDelta = Math.abs((cameraBefore.progress ?? -1) - (cameraExited.progress ?? -2))
  const poseDelta = camDistance(cameraBefore, cameraExited)
  const fovDelta = Math.abs((cameraBefore.fov ?? -1) - (cameraExited.fov ?? -2))
  // Exit restoration is a UX-level expectation, not a framing contract: exact
  // frames are enforced at entry (inspect goal tolerances above). Measured
  // residual after close with pointer parallax and eased camera damping is
  // 0.002-0.029 m; a stuck-inspect or unreturned camera is meter-scale.
  const exitBaselineRestored = progressDelta <= 0.003 && poseDelta <= 0.04 && fovDelta <= 0.05 && goalDelta <= 0.04
  if (!exitBaselineRestored) {
    fail(`${caseName}/${keeper.id}: close did not restore the pinned-pointer scroll/camera baseline`)
  }

  return {
    id: keeper.id,
    box: { x, y, width: box.width, height: box.height },
    hit,
    isBadgeHit,
    badgeCount: count,
    cameraBefore,
    cameraAfter,
    cameraExited,
    inspectGoal,
    pinnedPointer: { x, y },
    exitBaseline: { progressDelta, poseDelta, fovDelta, goalDelta, restored: exitBaselineRestored },
  }
}

const sourceContract = async () => {
  const bundled = await build({
    entryPoints: [path.join(root, 'src/data/caseStudies.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    logLevel: 'silent',
  })
  const module = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)
  dataModule = module
  const active = [...module.ACTIVE_HOTSPOT_IDS].sort()
  const expected = KEEPERS.map((keeper) => keeper.id).sort()
  const byId = new Map(module.HOTSPOTS.map((def) => [def.id, def]))
  const source = {
    hotspots: fs.readFileSync(path.join(root, 'src/scene/Hotspots.tsx'), 'utf8'),
    hud: fs.readFileSync(path.join(root, 'src/components/TechnicalHUD.tsx'), 'utf8'),
    camera: fs.readFileSync(path.join(root, 'src/scene/CameraRig.tsx'), 'utf8'),
    chapters: fs.readFileSync(path.join(root, 'src/components/Chapters.tsx'), 'utf8'),
  }

  const checks = {
    activeSetExact: JSON.stringify(active) === JSON.stringify(expected),
    keeperDefinitionsExact: KEEPERS.every((keeper) => {
      const def = byId.get(keeper.id)
      return def?.occurrence === keeper.occurrence && JSON.stringify(def.chapters) === JSON.stringify(keeper.chapters)
    }),
    authoredIdsUnique: new Set(module.HOTSPOTS.map((def) => def.id)).size === module.HOTSPOTS.length,
    // CameraRig frame keys are unquoted when they are valid identifiers
    // (rotor:) and quoted for hyphenated ids ('duct-intake':, 'm249-trunnion':).
    allFramesRetained: KEEPERS.every(
      (keeper) => new RegExp(`(?<![\\w$])(['\\"])${keeper.id}\\1\\s*:|(?<![\\w$-])${keeper.id}\\s*:`).test(source.camera),
    ),
    portalWired: source.hotspots.includes('getHotspotLayerPortal') && source.hotspots.includes('portal={hotspotPortal ?? undefined}'),
    keeperFilterWired: source.hotspots.includes('ACTIVE_HOTSPOT_IDS.has(h.id)'),
    noDiagnosticAllHotspotUnblock: !source.hotspots.includes('HOTSPOTS.flatMap('),
    hudLayerWired: source.hud.includes('dataset.jg036HotspotLayer') && source.hud.includes('pointer-events-none absolute inset-0 z-0'),
    chapterTrackPointerInert: /relative z-0 pointer-events-none/.test(source.chapters),
    chapterDescendantControlsNative: source.chapters.includes("[&_:is(button,a,[role='button'])]:pointer-events-auto"),
  }
  for (const [name, passed] of Object.entries(checks)) if (!passed) fail(`static contract: ${name}`)
  report.staticContract = { active, authoredCount: module.HOTSPOTS.length, checks }
}

const exerciseCase = async (browser, caseDef) => {
  const context = await browser.newContext({
    viewport: { width: caseDef.width, height: caseDef.height },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  const result = { name: caseDef.name, viewport: caseDef, keepers: [], errors }
  report.cases.push(result)

  try {
    await page.goto(targetUrl.href, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForFunction(
      () =>
        Boolean(
          window.__drawingProof?.ready &&
            window.__telemetry?.drawing?.annotationsReady &&
            window.__rig &&
            window.__telemetry?.performance?.warmReady,
        ),
      null,
      { timeout: 180000 },
    )
    await page.waitForTimeout(1500)

    // Core keeper flows run first; the chapter-owned launch control is
    // exercised after them via the derived [data-chapter="1"] navigation below,
    // so no control-detection timeouts can precede or gate the core keepers.

    for (const keeper of KEEPERS) {
      const rest = await seek(page, keeper.progress)
      const passBefore = await page.locator('button[aria-pressed]').count()
      // A fixed top-center point is blank canvas on desktop, but on narrow the
      // safe-area-clamped badges stack near it at the intake/trunnion anchors.
      // Probe candidates in order and use the first genuinely blank canvas
      // point; the pass-through claim is "a blank canvas point lets wheel
      // through", which any one of these proves.
      const canvasCandidates = [
        { x: Math.round(caseDef.width * 0.5), y: Math.round(caseDef.height * 0.12) },
        { x: Math.round(caseDef.width * 0.5), y: Math.round(caseDef.height * 0.3) },
        { x: Math.round(caseDef.width * 0.3), y: Math.round(caseDef.height * 0.3) },
        { x: Math.round(caseDef.width * 0.7), y: Math.round(caseDef.height * 0.3) },
        { x: Math.round(caseDef.width * 0.5), y: Math.round(caseDef.height * 0.55) },
        // Narrow grid-scan 2026-10-09: the full-width chapter card + badge stack
        // own the center column at the intake/trunnion anchors; both side
        // margins at mid-height are canvas at every keeper anchor.
        { x: Math.round(caseDef.width * 0.05), y: Math.round(caseDef.height * 0.5) },
        { x: Math.round(caseDef.width * 0.95), y: Math.round(caseDef.height * 0.5) },
      ]
      let canvasPoint = canvasCandidates[0]
      let canvasHit = await hitProbe(page, canvasPoint.x, canvasPoint.y)
      if (canvasHit.tag !== 'CANVAS') {
        for (const candidate of canvasCandidates.slice(1)) {
          const probe = await hitProbe(page, candidate.x, candidate.y)
          if (probe.tag === 'CANVAS') {
            canvasPoint = candidate
            canvasHit = probe
            break
          }
        }
      }
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await page.mouse.move(canvasPoint.x, canvasPoint.y)
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(600)
      const scrollAfter = await page.evaluate(() => window.scrollY)
      result.canvasPassThrough = {
        point: canvasPoint,
        hit: canvasHit,
        scrollDelta: scrollAfter - scrollBefore,
      }
      if (canvasHit.tag !== 'CANVAS') {
        fail(`${caseDef.name}: blank pass-through point hit ${canvasHit.tag}, expected canvas`)
      }
      if (Math.abs(scrollAfter - scrollBefore) < 100) {
        fail(`${caseDef.name}: wheel scroll did not pass through to the document`)
      }
      await seek(page, keeper.progress)
      const keeperResult = await probeAndClickBadge(page, keeper, caseDef)
      if (keeperResult) {
        keeperResult.restBeforeEnter = rest
        keeperResult.badgeCountBeforeScroll = passBefore
        result.keepers.push(keeperResult)
        await page.screenshot({
          path: path.join(out, `${caseDef.name}-${keeper.id}-after-exit.png`),
        })
      }
    }

    // Chapter-owned launch control, exercised AFTER the badge/HUD path so a
    // lingering overlay or stale pointer catcher cannot pass on pre-click state
    // alone. Position derives from the real [data-chapter="1"] section (0-based
    // index: the launch button renders in chapterDef.index === 1's card) via a
    // natural scrollIntoView + settle, never a raw progress seek.
    await gotoChapterSection(page, 1)
    const chapterButton = page.locator('button[aria-controls="gearbox-case-study"]')
    await chapterButton.waitFor({ state: 'visible', timeout: 20000 })
    const chapterBox = await chapterButton.boundingBox()
    if (!chapterBox) {
      fail(`${caseDef.name}: chapter 1 launch control has no viewport box`)
    } else {
      result.chapterControlHit = await hitProbe(
        page,
        chapterBox.x + chapterBox.width / 2,
        chapterBox.y + chapterBox.height / 2,
      )
      if (result.chapterControlHit.tag !== 'BUTTON') {
        fail(`${caseDef.name}: chapter 1 launch control hit ${result.chapterControlHit.tag}, expected BUTTON`)
      }
    }
    await chapterButton.click({ timeout: 20000 })
    await page.waitForFunction(
      () => document.querySelector('button[aria-controls="gearbox-case-study"]')?.getAttribute('aria-expanded') === 'true',
      null,
      { timeout: 20000 },
    )
    await chapterButton.click({ timeout: 20000 })
    await page.waitForFunction(
      () => document.querySelector('button[aria-controls="gearbox-case-study"]')?.getAttribute('aria-expanded') === 'false',
      null,
      { timeout: 20000 },
    )
    result.chapterControlRealClicks = true

    if (caseDef.name === 'desktop') {
      await seek(page, KEEPERS[0].progress)
      const badge = badgeLocator(page, KEEPERS[0])
      await badge.waitFor({ state: 'visible', timeout: 20000 })
      const isRotorFocused = () =>
        page.evaluate(() => {
          const active = document.activeElement
          return (
            active?.tagName === 'BUTTON' &&
            active.hasAttribute('aria-pressed') &&
            active.textContent?.includes('AIR MOTOR ROTOR')
          )
        })
      const focusRotorBadge = async () => {
        for (let index = 0; index < 40 && !(await isRotorFocused()); index += 1) {
          await page.keyboard.press('Tab')
          await page.waitForTimeout(50)
        }
        return isRotorFocused()
      }
      const focused = await focusRotorBadge()
      if (!focused) fail('desktop keyboard route: Tab did not reach the rotor badge')
      const focusProbe = await page.evaluate(() => {
        const active = document.activeElement
        const style = getComputedStyle(active)
        return {
          tag: active?.tagName,
          text: active?.textContent ?? '',
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
          boxShadow: style.boxShadow,
        }
      })
      const focusRingVisible = Boolean(focusProbe.boxShadow) && focusProbe.boxShadow !== 'none'
      if (!focusRingVisible) {
        fail('desktop keyboard route: focused rotor badge has no visible focus ring (computed box-shadow none)')
      }
      result.keyboardRoute = { focused, focusProbe, focusRingVisible }
      const waitForKeeperPressed = async (pressed) => {
        await page.waitForFunction(
          (state) =>
            [...document.querySelectorAll('button[aria-pressed]')].some(
              (b) => b.textContent?.includes('AIR MOTOR ROTOR') && b.getAttribute('aria-pressed') === state,
            ),
          pressed,
          { timeout: 15000 },
        )
      }
      const closeVisible = async () => {
        await page.getByRole('button', { name: 'Close hotspot detail' }).waitFor({ state: 'visible', timeout: 10000 })
      }
      await page.keyboard.press('Enter')
      await waitForKeeperPressed('true')
      await closeVisible()
      result.keyboardRoute.enterOpenedCard = true
      await page.keyboard.press('Escape')
      await waitForKeeperPressed('false')
      result.keyboardRoute.escapeClosedCard = true
      // Space must activate the button natively as well.
      if (!(await focusRotorBadge())) fail('desktop keyboard route: focus lost before Space activation')
      await page.keyboard.press(' ')
      await waitForKeeperPressed('true')
      await closeVisible()
      result.keyboardRoute.spaceOpenedCard = true
      await page.keyboard.press('Escape')
      await waitForKeeperPressed('false')
      result.keyboardRoute.spaceClosedCard = true
    }
  } catch (error) {
    fail(`${caseDef.name}: ${String(error)}`)
    await page.screenshot({ path: path.join(out, `${caseDef.name}-failure.png`) }).catch(() => {})
  } finally {
    if (errors.length) fail(`${caseDef.name}: browser reported ${errors.length} error(s): ${errors.join(' | ')}`)
    await context.close()
  }
  return result
}

const exerciseReducedRoute = async (browser) => {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const result = { name: 'desktop-reduced', badges: 0, canvas: 0, nativeScrollDelta: 0 }
  report.reducedRoute = result
  try {
    await page.goto(targetUrl.href, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.waitForTimeout(1500)
    result.canvas = await page.locator('canvas').count()
    result.badges = await page.locator('button[aria-pressed]').count()
    if (result.canvas !== 0) fail('reduced route unexpectedly mounted WebGL canvas')
    if (result.badges !== 0) fail('reduced route unexpectedly rendered hotspot badges')
    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.move(780, 450)
    await page.mouse.wheel(0, 700)
    await page.waitForTimeout(600)
    const after = await page.evaluate(() => window.scrollY)
    result.nativeScrollDelta = after - before
    if (Math.abs(result.nativeScrollDelta) < 100) fail('reduced route native scroll blocked')
  } catch (error) {
    fail(`reduced route: ${String(error)}`)
  } finally {
    await context.close()
  }
}

let browser
try {
  await sourceContract()
  if (!staticOnly) {
    if (process.platform !== 'win32') {
      openGate(`hardware gate: platform ${process.platform} would use SwiftShader; this evidence cannot claim Windows hardware GL`)
      fail('JG-036 runtime evidence requires installed Windows Chrome with hardware ANGLE/D3D11')
    }
    browser = await launchBrowser(chromium)
    for (const caseDef of [
      { name: 'desktop', width: 1600, height: 900 },
      { name: 'narrow', width: 390, height: 844 },
    ]) {
      await exerciseCase(browser, caseDef)
    }
    await exerciseReducedRoute(browser)
  }
} catch (error) {
  fail(String(error))
} finally {
  await browser?.close()
  report.staticOnly = staticOnly
  report.completedAt = new Date().toISOString()
  report.status = report.failures.length ? 'FAIL' : 'PASS'
  let reportPath = path.join(out, `${label}-verification-report.json`)
  if (fs.existsSync(reportPath)) {
    reportPath = path.join(out, `${label}-${Date.now()}-verification-report.json`)
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ status: report.status, reportPath, failures: report.failures, openGates: report.openGates }, null, 2))
  if (report.failures.length) process.exitCode = 1
}
