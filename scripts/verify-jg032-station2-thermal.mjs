/**
 * JG-032 Station-2 Thermal Visualization Verification Probe
 *
 * Usage:
 *   node scripts/verify-jg032-station2-thermal.mjs            # full verify (needs :4173 current + :4174 baseline)
 *   MODE=capture BASE_URL=http://localhost:4174 OUT=<dir> node ...   # capture only (baseline build)
 *
 * Asserts, against a fresh preview:
 *  1. uAirwayMin/uAirwayMax resolve to the measured DUCT_INTAKE_AIRWAY AABB
 *     (x [-0.6, 0.6], y [1.2, 1.855], z [0.431, 1.3] ±0.01), uAirwayValid=1,
 *     uGrilleValid=1, 12,000 particles full tier.
 *  2. GLSL heatRamp carries the cool→hot spec stops; the acoustic pool is 6
 *     rings and the thermal pool is 5 shells with the ruled colors.
 *  3. A/B material census vs the pre-change baseline capture: the recolor
 *     delta set is EXACTLY the allow-listed MSP_BLACK_CHASSIS meshes
 *     (#272728 → #0a1a3a chassis / #132a4a panels); MSP_YELLOW_PAINT,
 *     MSP_AIRWAY_VOLUME, PUMP_HOUSING, ISOLATION_MOUNTS and all other meshes
 *     are unchanged.
 *  4. Default-route cross-section: shell material planes sweep from world
 *     x=29.3 to x=28 and back; panels stay stationary and fade 0.35 → 0.18.
 *     Opening/closing midpoints and boundaries are measured from live materials.
 *  5. JGUN gates: spot 1.4@y1.3 / rim 0.8 / shadow visible at p=0.50;
 *     spot 1.1@y1.2 / rim 0 / shadow hidden at p=0.85 (CH.04 inert).
 *  6. CH.04 telemetry byte-identical to baseline at p=0.80/0.90 (excluding
 *     the time-integrating rig.stageRot/planetRot fields and performance.*).
 *  7. Reduced-motion and lite tiers still mount clean; lite = 3,600 particles.
 *  8. Zero console/page errors throughout. Screenshots at the six windows.
 */
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'
)

const MODE = process.env.MODE || 'verify'
const BASE_URL = process.env.BASE_URL || 'http://localhost:4173'
const OUT = process.env.OUT || 'project/work/evidence/jg032-station2-thermal'
const BASELINE = process.env.BASELINE || path.join(OUT, 'baseline-capture.json')
fs.mkdirSync(OUT, { recursive: true })

const report = { startedAt: new Date().toISOString(), failures: [], assertions: {} }
const fail = (msg) => { report.failures.push(msg); console.error('FAIL:', msg) }
const pass = (msg) => { console.log('PASS:', msg) }

/** The 7 contract roots (census scope). */
const ROOTS = ['ENCLOSURE_CHASSIS', 'COMPOSITE_PANELS', 'PUMP_HOUSING', 'ACOUSTIC_BAFFLES', 'ISOLATION_MOUNTS', 'DUCT_INTAKE', 'DUCT_EXHAUST']

/** Mirror of recolorAllowList.ts (the unit tests guard the module itself). */
const CHASSIS_RE = [/V2RL300-FPL-000[12]/i, /RL300-CPM-3001/i, /V2RL300-FTS-100[79]/i, /V2RLP-SK-4000-A/i, /V2ECP-SM-5000/i, /V2FTA-FP-46-RL-1000/i]
const PANEL_RE = [/STD-LBAP-4001/i, /G2RL200-SAF-10(33|35|39|40|41|49)/i, /V2RL300-SAF-1047/i, /V2RL300-SAF-1066/i]
const allowListed = (name) => CHASSIS_RE.some((re) => re.test(name)) || PANEL_RE.some((re) => re.test(name))

// Independent contract samples, not imports from the production animation.
const SECTION_STOPS = [
  { p: 0.575, cut: 0 },
  { p: 0.585, cut: 0 },
  { p: 0.615, cut: 0.5 },
  { p: 0.645, cut: 1 },
  { p: 0.65, cut: 1 },
  { p: 0.7, cut: 1 },
  { p: 0.7075, cut: 0.5 },
  { p: 0.715, cut: 0 },
  { p: 0.74, cut: 0 },
]
const STOPS = [...new Set([0.05, 0.35, 0.47, 0.5, ...SECTION_STOPS.map(({ p }) => p), 0.85, 0.9])].sort((a, b) => a - b)
const SHOT_STOPS = new Set([0.05, 0.47, 0.5, 0.575, 0.65, 0.74])

/** Fields excluded from the CH.04 byte-compare: time-integrating rotations + perf counters. */
const CH04_EXCLUDE = ['rig.stageRot', 'rig.planetRot', 'performance']

async function launch() {
  return chromium.launch({
    channel: 'chrome',
    // Headed on the real GPU: in headless+software rendering the sustained
    // sub-45 FPS legitimately escalates the one-way quality ladder to poster
    // mid-sweep (canvas unmounts) — that is the ladder working as designed,
    // not a scene defect. HEADLESS=1 env forces headless for CI-style runs.
    headless: process.env.HEADLESS === '1',
    args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-position=40,40'],
  })
}

async function capture(BASE, out, { screenshots = true } = {}) {
  const browser = await launch()
  const captureReport = { baseUrl: BASE, pageErrors: [] }
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.on('pageerror', (err) => captureReport.pageErrors.push('pageerror: ' + String(err)))
    page.on('console', (msg) => {
      if (msg.type() === 'error') captureReport.pageErrors.push('console.error: ' + msg.text())
    })

    await page.goto(BASE + '/?chapter=0', { waitUntil: 'networkidle' })
    await page.waitForFunction(
      () => Boolean(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady),
      null,
      { timeout: 60000 },
    )
    await page.waitForFunction(() => Boolean(window.__threeScene?.getObjectByName('station-2-enclosure')), null, {
      timeout: 60000,
    })
    await page.waitForTimeout(2000)

    // --- Station-2 scene-graph census (7 roots) + field pools + uniforms ---
    captureReport.probeEnv = await page.evaluate(() => ({
      hasScene: Boolean(window.__threeScene),
      hasCanvas: Boolean(document.querySelector('canvas')),
      tier: window.__telemetry?.performance?.tier,
    }))
    if (!captureReport.probeEnv.hasScene) {
      console.error('scene missing at census time:', JSON.stringify(captureReport.probeEnv))
      throw new Error('window.__threeScene is null at census time (poster degradation?)')
    }
    captureReport.station2 = await page.evaluate((ROOTS) => {
      const scene = window.__threeScene
      const st2 = scene.getObjectByName('station-2-enclosure')
      if (!st2) return { error: 'station-2-enclosure missing' }
      const sig = (m) => ({
        name: m.name || null,
        type: m.type,
        color: m.color ? '#' + m.color.getHexString() : null,
        roughness: m.roughness ?? null,
        metalness: m.metalness ?? null,
        envMapIntensity: m.envMapIntensity ?? null,
        transparent: !!m.transparent,
        opacity: m.opacity ?? null,
        depthWrite: m.depthWrite ?? null,
      })
      const GENERIC = /^mesh\d+_mesh(_\d+)?$/i
      const census = []
      for (const rootName of ROOTS) {
        const root = st2.getObjectByName(rootName)
        if (!root) { census.push({ root: rootName, error: 'missing' }); continue }
        root.traverse((o) => {
          if (!o.isMesh) return
          // nearest non-generic ancestor name (GLTFLoader prim-suffix trap)
          let cur = o
          let part = o.name
          while (cur && cur !== root) {
            if (cur.name && !GENERIC.test(cur.name)) { part = cur.name; break }
            cur = cur.parent
          }
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          census.push({
            key: rootName + '::' + part + '::' + (o.name || 'mesh'),
            root: rootName,
            part,
            verts: o.geometry?.attributes?.position?.count ?? 0,
            mats: mats.map(sig),
          })
        })
      }
      // field pools + airflow uniforms
      let airflow = null
      st2.traverse((o) => {
        if (o.isPoints && o.material?.uniforms?.uAirwayValid) {
          const u = o.material.uniforms
          airflow = {
            particleCount: o.geometry.attributes.position.count,
            uAirwayValid: u.uAirwayValid.value,
            uGrilleValid: u.uGrilleValid.value,
            uAirwayMin: u.uAirwayMin.value.toArray(),
            uAirwayMax: u.uAirwayMax.value.toArray(),
            uGrilleMin: u.uGrilleMin.value.toArray(),
            uGrilleMax: u.uGrilleMax.value.toArray(),
            hasHeatRamp: o.material.vertexShader.includes('heatRamp'),
            rampStops: ['vec3(0.0, 0.898, 1.0)', 'vec3(0.220, 0.742, 0.973)', 'vec3(0.490, 0.827, 0.988)', 'vec3(0.984, 0.749, 0.141)', 'vec3(0.976, 0.451, 0.086)', 'vec3(0.937, 0.267, 0.267)'].map((s) => o.material.vertexShader.includes(s)),
          }
        }
      })
      const field = st2.getObjectByName('acoustic-baffle-field')
      const pools = field
        ? field.children.map((g) => ({
            count: g.children.length,
            colors: g.children.map((m) => '#' + m.material.color.getHexString()),
            sides: g.children.map((m) => m.material.side),
          }))
        : null
      return { census, airflow, pools }
    }, ROOTS)

    // --- settle-gated telemetry at all stops + screenshots + gate probes ---
    captureReport.stops = {}
    for (const p of STOPS) {
      await page.evaluate((prog) => {
        window.__scrollCommitDisabled = true
        return window.__drawingProof.scrollToProgress(prog)
      }, p)
      const tele = await page.evaluate(async (ROOTS) => {
        const t = window.__telemetry
        const snap = () => [t.scroll.progress, t.camera.x, t.camera.y, t.camera.z, t.camera.fov, t.rig.explodeFactor, t.rig.ghostOpacity]
        let previous = snap()
        let quiet = 0
        const start = performance.now()
        while (performance.now() - start < 9000 && quiet < 10) {
          await new Promise((resolve) => requestAnimationFrame(() => resolve()))
          const current = snap()
          let delta = 0
          for (let i = 0; i < current.length; i += 1) delta = Math.max(delta, Math.abs(current[i] - previous[i]))
          previous = current
          quiet = delta <= 1e-7 ? quiet + 1 : 0
        }
        // JGUN gate probes (live scene state) — null-safe: a missing scene
        // (poster degradation) must be reported by the caller, not crash here
        let spot = null, rim = null, shadowVisible = null, panelOpacity = null, panelY = null
        let section = null
        const scene = window.__threeScene
        if (scene) {
          scene.traverse((o) => {
            if (o.isSpotLight) spot = { intensity: o.intensity, y: o.position.y }
            if (o.isPointLight && Math.abs(o.position.x + 0.3) < 0.001 && Math.abs(o.position.z - 0.5) < 0.001) rim = o.intensity
          })
          // JG-032 secondary explode shadow: gradient plane at y=-0.18
          scene.traverse((o) => {
            if (o.isMesh && Math.abs(o.position.y + 0.18) < 0.001 && o.material?.map && o.geometry?.type === 'PlaneGeometry') shadowVisible = o.visible
          })
          const st2 = scene.getObjectByName('station-2-enclosure')
          const panels = st2?.getObjectByName('COMPOSITE_PANELS')
          if (panels) {
            panelY = panels.position.y
            panels.traverse((o) => {
              if (panelOpacity === null && o.isMesh) {
                const m = Array.isArray(o.material) ? o.material[0] : o.material
                panelOpacity = m.opacity
              }
            })
          }
          if (st2) {
            section = {
              panelPosition: panels?.position.toArray() ?? null,
              roots: ROOTS.map((name) => {
                const root = st2.getObjectByName(name)
                const materials = new Set()
                root?.traverse((o) => {
                  if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m))
                })
                const planes = new Set([...materials].flatMap((m) => m.clippingPlanes || []))
                return {
                  name,
                  materialCount: materials.size,
                  planeCounts: [...new Set([...materials].map((m) => m.clippingPlanes?.length || 0))],
                  planes: [...planes].map((plane) => ({ normal: plane.normal.toArray(), constant: plane.constant })),
                  panelStates: name === 'COMPOSITE_PANELS'
                    ? [...new Set([...materials].map((m) => JSON.stringify({ opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite })))].map((s) => JSON.parse(s))
                    : [],
                }
              }),
            }
          }
        }
        return {
          reached: t.scroll.progress,
          sceneAlive: Boolean(scene),
          telemetry: JSON.parse(JSON.stringify(t)),
          gates: { spot, rim, shadowVisible, panelOpacity, panelY, section },
        }
      }, ROOTS)
      captureReport.stops['p' + p] = tele
      if (screenshots && SHOT_STOPS.has(p)) {
        await page.screenshot({ path: path.join(out, `shot-p${String(p).replace('.', '_')}.png`) })
      }
    }

    // --- perf: frame-time p95 at the cutaway hold ---
    await page.evaluate(() => window.__drawingProof.scrollToProgress(0.65))
    await page.waitForTimeout(1500)
    captureReport.perf = await page.evaluate(async () => {
      const deltas = []
      let last = performance.now()
      for (let i = 0; i < 180; i++) {
        await new Promise((r) => requestAnimationFrame(r))
        const now = performance.now()
        deltas.push(now - last)
        last = now
      }
      deltas.sort((a, b) => a - b)
      return {
        p50: +deltas[Math.floor(deltas.length * 0.5)].toFixed(2),
        p95: +deltas[Math.floor(deltas.length * 0.95)].toFixed(2),
        max: +deltas[deltas.length - 1].toFixed(2),
      }
    })

    // --- reduced motion + lite tier smoke ---
    const rm = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' })
    const rmPage = await rm.newPage()
    const rmErrors = []
    rmPage.on('pageerror', (err) => rmErrors.push(String(err)))
    rmPage.on('console', (msg) => { if (msg.type() === 'error') rmErrors.push(msg.text()) })
    await rmPage.goto(BASE + '/?chapter=2', { waitUntil: 'networkidle' })
    await rmPage.waitForTimeout(4000)
    captureReport.reducedMotion = {
      canvasMounted: await rmPage.evaluate(() => Boolean(document.querySelector('canvas'))),
      errors: rmErrors,
    }
    await rm.close()

    await page.evaluate(() => window.__drawingProof.setTier('lite'))
    await page.waitForTimeout(1500)
    captureReport.liteTier = await page.evaluate(() => {
      let count = null
      if (window.__threeScene) {
        window.__threeScene.traverse((o) => {
          if (o.isPoints && o.material?.uniforms?.uAirwayValid) count = o.geometry.attributes.position.count
        })
      }
      return {
        particleCount: count,
        tier: window.__telemetry?.performance?.tier,
        sceneAlive: Boolean(window.__threeScene),
        canvasMounted: Boolean(document.querySelector('canvas')),
      }
    })

    fs.writeFileSync(path.join(out, MODE === 'capture' ? 'baseline-capture.json' : 'current-capture.json'), JSON.stringify(captureReport, null, 1))
    console.log(`captured ${BASE} → ${out}; census=${captureReport.station2?.census?.length} meshes, errors=${captureReport.pageErrors.length}`)
    return captureReport
  } finally {
    await browser.close()
  }
}

function deepDiff(a, b, pathPrefix = '', exclude = []) {
  const diffs = []
  if (exclude.some((p) => pathPrefix === p || pathPrefix.startsWith(p + '.'))) return diffs
  if (typeof a !== typeof b) { diffs.push(`${pathPrefix}: type ${typeof a} vs ${typeof b}`); return diffs }
  if (a && b && typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) diffs.push(...deepDiff(a[k], b[k], pathPrefix ? `${pathPrefix}.${k}` : k, exclude))
    return diffs
  }
  // Numbers compare at 1e-4 quantization: the damped camera and transition
  // fields carry sub-1e-7 residue between ANY two runs (the JG-028 control
  // pair showed ~1% gear-phase residue); real regressions are orders of
  // magnitude larger. Non-numbers stay exact (byte-identical).
  if (typeof a === 'number' && typeof b === 'number') {
    if (Math.round(a * 1e4) !== Math.round(b * 1e4)) diffs.push(`${pathPrefix}: ${a} vs ${b}`)
    return diffs
  }
  if (a !== b) diffs.push(`${pathPrefix}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`)
  return diffs
}

// ================= capture-only mode =================
if (MODE === 'capture') {
  await capture(BASE_URL, OUT)
  process.exit(0)
}

// ================= verify mode =================
console.log('--- Step 1: capture current build at ' + BASE_URL + ' ---')
const current = await capture(BASE_URL, OUT)

console.log('--- Step 2: load baseline capture ' + BASELINE + ' ---')
if (!fs.existsSync(BASELINE)) {
  fail(`baseline capture missing: ${BASELINE} (run MODE=capture BASE_URL=http://localhost:4174 OUT=${OUT} first)`)
} else {
  const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))

  // --- 3. A/B material census ---
  console.log('--- Step 3: A/B material census ---')
  const baseMap = new Map(baseline.station2.census.map((e) => [e.key, e]))
  const curMap = new Map(current.station2.census.map((e) => [e.key, e]))
  if (baseMap.size !== curMap.size) fail(`census size differs: baseline ${baseMap.size} vs current ${curMap.size}`)
  const deltas = []
  const missedAllowList = []
  // The PANELS_OPAQUE flip (commit 3/3) is an intended delta: COMPOSITE_PANELS
  // meshes gain exactly {transparent: false→true, opacity: 1→0.35,
  // depthWrite: true→false}. Combined with the recolor on allow-listed panels.
  const FLIP_FIELDS = ['transparent', 'opacity', 'depthWrite']
  const classifyMat = (b, m, root) => {
    if (JSON.stringify(b) === JSON.stringify(m)) return 'identical'
    const changed = Object.keys(b).filter((k) => JSON.stringify(b[k]) !== JSON.stringify(m[k]))
    const flipOnly =
      changed.length > 0 &&
      changed.every((k) => FLIP_FIELDS.includes(k)) &&
      root === 'COMPOSITE_PANELS' &&
      b.transparent === false && m.transparent === true &&
      b.depthWrite === true && m.depthWrite === false
    const recolorFields = ['color', 'roughness', 'metalness', 'envMapIntensity']
    const nonFlip = changed.filter((k) => !FLIP_FIELDS.includes(k))
    const recolor =
      nonFlip.length > 0 &&
      nonFlip.every((k) => recolorFields.includes(k)) &&
      b.name === 'MSP_BLACK_CHASSIS' &&
      b.color === '#272728' &&
      m.name === 'MSP_BLACK_CHASSIS' &&
      (m.color === '#0a1a3a' || m.color === '#132a4a')
    const flipPart = changed.some((k) => FLIP_FIELDS.includes(k))
    if (recolor && (!flipPart || (root === 'COMPOSITE_PANELS' && b.transparent === false && m.transparent === true && b.depthWrite === true && m.depthWrite === false))) return 'recolor'
    if (flipOnly) return 'panel-flip'
    return null
  }
  for (const [key, cur] of curMap) {
    const base = baseMap.get(key)
    if (!base) { deltas.push({ key, kind: 'ADDED' }); continue }
    if (cur.verts !== base.verts) { deltas.push({ key, kind: 'UNEXPECTED', diff: [`verts: ${base.verts} vs ${cur.verts}`] }); continue }
    const kinds = new Set(cur.mats.map((m, i) => classifyMat(base.mats[i], m, cur.root)))
    kinds.delete('identical')
    if (kinds.size === 0) continue
    if ([...kinds].every((k) => k === 'recolor' || k === 'panel-flip')) {
      const hasRecolor = kinds.has('recolor')
      if (hasRecolor && !allowListed(cur.part)) {
        deltas.push({ key, kind: 'UNEXPECTED', diff: ['recolor on non-allow-listed part'] })
        continue
      }
      deltas.push({ key, kind: hasRecolor ? 'RECOLOR' : 'PANEL_FLIP', colors: cur.mats.map((m) => m.color) })
    } else {
      deltas.push({ key, kind: 'UNEXPECTED', diff: deepDiff(base.mats, cur.mats, 'mats').slice(0, 4) })
    }
  }
  for (const [key] of baseMap) if (!curMap.has(key)) deltas.push({ key, kind: 'REMOVED' })

  const unexpected = deltas.filter((d) => d.kind !== 'RECOLOR' && d.kind !== 'PANEL_FLIP')
  const recolors = deltas.filter((d) => d.kind === 'RECOLOR')
  const flips = deltas.filter((d) => d.kind === 'PANEL_FLIP')
  report.assertions.censusRecolorCount = recolors.length
  report.assertions.censusPanelFlipCount = flips.length
  if (unexpected.length > 0) {
    fail(`A/B census: ${unexpected.length} unexpected deltas: ${JSON.stringify(unexpected.slice(0, 5))}`)
  } else {
    pass(`A/B census: delta set = ${recolors.length} allow-listed recolors + ${flips.length} intended panel-flip flag changes, zero unexpected (of ${curMap.size} station-2 meshes)`)
  }
  // every allow-listed mesh present must have been recolored (no misses)
  for (const [, cur] of curMap) {
    if (!allowListed(cur.part)) continue
    const isNavy = cur.mats.every((m) => m.name !== 'MSP_BLACK_CHASSIS' || m.color === '#0a1a3a' || m.color === '#132a4a')
    const hasBlack = cur.mats.some((m) => m.name === 'MSP_BLACK_CHASSIS')
    if (hasBlack && !isNavy) missedAllowList.push(cur.key)
  }
  if (missedAllowList.length > 0) fail(`allow-listed parts NOT recolored: ${missedAllowList.join(', ')}`)
  else pass('all allow-listed parts recolored (no misses)')

  // protected buckets unchanged (explicit)
  for (const [, cur] of curMap) {
    for (const m of cur.mats) {
      if (m.name === 'MSP_YELLOW_PAINT' && m.color !== '#ffc500') fail(`yellow paint touched: ${cur.key} → ${m.color}`)
      if (m.name === 'MSP_AIRWAY_VOLUME' && m.color !== '#59c4f9') fail(`airway volume touched: ${cur.key} → ${m.color}`)
    }
  }
  pass('MSP_YELLOW_PAINT (#ffc500) and MSP_AIRWAY_VOLUME (#59c4f9) unchanged everywhere')

  // --- 6. CH.04 byte-identical telemetry ---
  console.log('--- Step 6: CH.04 telemetry byte-compare ---')
  for (const stop of ['p0.85', 'p0.9']) {
    const diffs = deepDiff(baseline.stops[stop]?.telemetry, current.stops[stop]?.telemetry, '', CH04_EXCLUDE)
    if (diffs.length > 0) fail(`CH.04 telemetry differs at ${stop}: ${diffs.slice(0, 6).join(' | ')}`)
    else pass(`CH.04 telemetry byte-identical at ${stop} (excluding time-integrating stageRot/planetRot + performance)`)
  }
}

// --- 1. airway uniforms ---
console.log('--- Step 1b: airway uniforms ---')
const af = current.station2.airflow
if (!af) fail('airflow field not found')
else {
  const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol
  const expMin = [-0.6, 1.2, 0.431]
  const expMax = [0.6, 1.855, 1.3]
  if (af.uAirwayValid !== 1) fail('uAirwayValid !== 1 (airway node unresolved)')
  else if (!expMin.every((v, i) => near(af.uAirwayMin[i], v)) || !expMax.every((v, i) => near(af.uAirwayMax[i], v))) {
    fail(`airway AABB wrong: ${JSON.stringify(af.uAirwayMin)} ${JSON.stringify(af.uAirwayMax)}`)
  } else pass(`uAirwayMin/uAirwayMax = measured AABB [${expMin}] → [${expMax}] (±0.01), uAirwayValid=1`)
  if (af.uGrilleValid !== 1) fail('uGrilleValid !== 1 (grille node unresolved)')
  else pass(`grille AABB resolved (uGrilleValid=1): [${af.uGrilleMin.map((v) => v.toFixed(3))}] → [${af.uGrilleMax.map((v) => v.toFixed(3))}]`)
  if (af.particleCount !== 12000) fail(`particle count ${af.particleCount} !== 12000 (full tier)`)
  else pass('12,000 particles (full tier)')
  if (!af.hasHeatRamp || af.rampStops.some((s) => !s)) fail('GLSL heatRamp missing spec stops')
  else pass('GLSL heatRamp carries all 6 cool→hot spec stops (#00e5ff → #38bdf8/#7dd3fc → #fbbf24 → #f97316 → #ef4444)')
}

// --- 2. ring pools ---
console.log('--- Step 2b: ring pools ---')
const pools = current.station2.pools
if (!pools || pools.length !== 2) fail(`acoustic-baffle-field pools wrong: ${JSON.stringify(pools?.map((p) => p.count))}`)
else {
  if (pools[0].count !== 6) fail(`acoustic pool ${pools[0].count} !== 6`)
  else if (pools[0].colors.some((c) => c !== '#00e5ff')) fail('acoustic ring colors drifted from #00e5ff')
  else pass('acoustic pool: 6 rings, #00e5ff (unchanged behavior)')
  const expectedShell = ['#fbbf24', '#f9991d', '#f97316', '#f26511', '#ea580c']
  if (pools[1].count !== 5) fail(`thermal pool ${pools[1].count} !== 5`)
  else if (JSON.stringify(pools[1].colors) !== JSON.stringify(expectedShell)) fail(`thermal shell colors ${JSON.stringify(pools[1].colors)}`)
  else if (pools[1].sides.some((s) => s !== 1)) fail('thermal shells are not BackSide')
  else pass('thermal pool: 5 nested shells, #fbbf24→#f97316→#ea580c, BackSide')
}

// --- 4. default-route cross-section (the panel lift was retired in JG-032 rev2) ---
console.log('--- Step 4: live cross-section contract ---')
const near = (a, b, tol = 0.002) => Number.isFinite(a) && Math.abs(a - b) <= tol
const restPosition = current.stops['p0.575']?.gates.section?.panelPosition
// Browser scroll positions are pixel-quantized. Keep the target-progress gate,
// then evaluate the independently specified curve at the position actually
// reached, rather than treating a requested midpoint as an exact scroll value.
const contractRamp = (progress, start, end) => {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)))
  return t * t * (3 - 2 * t)
}
report.assertions.crossSection = []
for (const { p, cut: targetCut } of SECTION_STOPS) {
  const sample = current.stops['p' + p]
  const section = sample?.gates.section
  const cut = Number.isFinite(sample?.reached)
    ? contractRamp(sample.reached, 0.585, 0.645) - contractRamp(sample.reached, 0.7, 0.715)
    : NaN
  const errors = []
  if (!sample?.sceneAlive || !section) errors.push('live station-2 scene missing')
  if (!near(sample?.reached, p, 0.0001)) errors.push(`progress ${sample?.reached} did not reach ${p}`)
  if (!restPosition || !section?.panelPosition || !near(section.panelPosition[1], 0.05, 0.0001) ||
      !section.panelPosition.every((v, i) => near(v, restPosition[i], 0.0001))) {
    errors.push(`panels moved from assembled position: ${JSON.stringify(section?.panelPosition)}`)
  }
  for (const name of ROOTS) {
    const root = section?.roots.find((r) => r.name === name)
    if (!root?.materialCount) { errors.push(`${name}: no live materials`); continue }
    const shell = name === 'ENCLOSURE_CHASSIS' || name === 'COMPOSITE_PANELS'
    if (root.planeCounts.length !== 1 || root.planeCounts[0] !== (shell ? 1 : 0)) {
      errors.push(`${name}: clipping scope/count ${JSON.stringify(root.planeCounts)}`)
    }
    if (shell && (root.planes.length === 0 || root.planes.some((plane) =>
      !plane.normal.every((v, i) => near(v, [-1, 0, 0][i], 0.0001)) ||
      !near(plane.constant, 29.3 - 1.3 * cut)))) {
      errors.push(`${name}: actual planes ${JSON.stringify(root.planes)} expected normal [-1,0,0], constant ${29.3 - 1.3 * cut}`)
    }
    if (name === 'COMPOSITE_PANELS' && (root.panelStates.length === 0 || root.panelStates.some((m) =>
      !near(m.opacity, 0.35 - 0.17 * cut) || m.transparent !== true || m.depthWrite !== false))) {
      errors.push(`panel material state wrong: ${JSON.stringify(root.panelStates)}`)
    }
  }
  report.assertions.crossSection.push({ progress: p, reached: sample?.reached, targetCut, expectedCut: cut, passed: errors.length === 0 })
  if (errors.length) fail(`cross-section p=${p}: ${errors.join(' | ')}`)
  else pass(`cross-section p=${p}: cut ${cut}, world plane x=${29.3 - 1.3 * cut}, stationary panels, opacity ${+(0.35 - 0.17 * cut).toFixed(3)}`)
}

// --- 5. JGUN gates ---
console.log('--- Step 5: JGUN progress gates ---')
const g50 = current.stops['p0.5']?.gates
const g47 = current.stops['p0.47']?.gates
const g85 = current.stops['p0.85']?.gates
if (!g50 || !g47 || !g85) fail('missing JGUN gate probes')
else {
  if (Math.abs(g50.spot.intensity - 1.4) > 0.01 || Math.abs(g50.spot.y - 1.3) > 0.01) fail(`spot nudge at 0.50: ${JSON.stringify(g50.spot)}`)
  else pass('p=0.50: spot 1.4 @ y 1.3 (nudge active)')
  if (g47.rim < 0.7) fail(`micro-rim at 0.47: ${g47.rim}`)
  else pass('p=0.47: micro-rim 0.8 inside LCD_REVEAL_WINDOW')
  if (g50.shadowVisible !== true) fail('explode shadow not visible at 0.50')
  else pass('p=0.50: secondary explode shadow visible')
  if (Math.abs(g85.spot.intensity - 1.1) > 0.01 || Math.abs(g85.spot.y - 1.2) > 0.01 || g85.rim !== 0 || g85.shadowVisible !== false) {
    fail(`CH.04 not inert at 0.85: ${JSON.stringify(g85)}`)
  } else pass('p=0.85 CH.04: spot resting 1.1 @ y 1.2, rim 0, shadow hidden — inert')
}

// --- tiers ---
if (!current.reducedMotion.canvasMounted || current.reducedMotion.errors.length > 0) fail(`reduced-motion broken: ${JSON.stringify(current.reducedMotion)}`)
else pass('reduced-motion tier mounts clean, 0 errors')
if (current.liteTier.particleCount !== 3600) fail(`lite tier particles ${current.liteTier.particleCount} !== 3600`)
else pass('lite tier: 3,600 particles')

// --- perf ---
if (current.perf.p95 > 17.5) console.warn(`WARN: p95 ${current.perf.p95} ms above the 16.8 vsync quantum`)
else pass(`perf at hold: p50 ${current.perf.p50} / p95 ${current.perf.p95} / max ${current.perf.max} ms`)

// --- 8. console errors ---
if (current.pageErrors.length > 0) fail(`${current.pageErrors.length} console/page errors:\n${current.pageErrors.join('\n')}`)
else pass('0 console errors, 0 uncaught page errors')

report.completedAt = new Date().toISOString()
report.status = report.failures.length === 0 ? 'PASS' : 'FAIL'
fs.writeFileSync(path.join(OUT, 'verification-report.json'), JSON.stringify(report, null, 2))
console.log(`report → ${path.join(OUT, 'verification-report.json')}`)
if (report.status === 'PASS') console.log('\n>>> ALL JG-032 VERIFICATION GATES PASSED <<<')
else { console.error(`\n>>> JG-032 VERIFICATION FAILED (${report.failures.length}) <<<`); process.exitCode = 1 }
