import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pixels } from './lib/preview-pixels.mjs'
import { seamBandProfile } from './lib/seam-roi.mjs'

const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) || 'http://localhost:5199'
const out = path.resolve(process.argv.find(arg => arg.startsWith('--out='))?.slice(6) || '.scratch/ring-inspection-runtime')
await fs.mkdir(out, { recursive: true })
// Uncalibrated gross-defect gate for the seam image-ROI (see scripts/lib/seam-roi.mjs). Override with --seam-threshold=.
const seamThreshold = Number(process.argv.find(arg => arg.startsWith('--seam-threshold='))?.slice(17) ?? 0.4)
const report = { url, browser: describeLaunch(), started: new Date().toISOString(), seamRoi: { kind: 'image-ROI', threshold: seamThreshold, calibrated: false }, cases: [], failures: [] }
const browser = await launchBrowser(chromium)
const check = (condition, message) => { if (!condition) throw new Error(message) }
const read = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__inspection)))
const loseContext = page => page.evaluate(() => {
  const canvas = document.querySelector('canvas[data-engine]') || document.querySelector('canvas')
  const gl = canvas?.getContext('webgl2')
  if (!gl) throw new Error('Live WebGL context is missing')
  gl.getExtension('WEBGL_lose_context')?.loseContext()
})
const seek = async (page, time, entryElapsed = 2) => { await page.evaluate(({ time, entryElapsed }) => window.__inspectionProof.seek(time, entryElapsed), { time, entryElapsed }); await page.waitForTimeout(250); return read(page) }
function pixelCounts(buffer) {
  const image = pixels(buffer); let green = 0, red = 0
  for (let i = 0; i < image.data.length; i += image.channels) {
    const [r, g, b] = image.data.subarray(i, i + 3)
    if (g > 100 && g > r * 1.3 && g > b * 1.3) green++
    if (r > 70 && r > g * 1.8 && r > b * 1.4) red++
  }
  return { green, red }
}
// ---- JG-035 R1: hole-plug schedule (runtime telemetry from the inspection store) --------------------------------
// Literal owner schedule, independent of timeline.ts: the six drilled holes (12 measured apertures / owned covers)
// are concealed on a smoothstep ramp 1.2 -> 2.4 s, i.e. BEFORE the knurl tool first appears (2.8 s), stay plugged while
// the knurl forms, reopen on a smoothstep ramp 8.2 -> 8.95 s and are open BEFORE the black finish completes (9.3 s).
const smooth = x => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u) }
const holeOracle = {
  closeStart: 1.2, closeEnd: 2.4, toolFirstVisible: 2.8, openStart: 8.2, openEnd: 8.95, blackComplete: 9.3, patches: 12, apertures: 12,
  blend: t => smooth((t - 1.2) / 1.2) * (1 - smooth((t - 8.2) / 0.75)),
}
async function verifyHolePlug(page, result) {
  const soft = []
  const times = [0, 1.19, 1.2, 1.5, 1.8, 2.1, 2.4, 2.79, 2.8, 4.2, 5.2, 6.2, 7.7, 8.2, 8.575, 8.6, 8.95, 9.3, 10, 10.6]
  const rows = []
  for (const time of times) {
    const f = await seek(page, time)
    const expected = holeOracle.blend(time)
    const row = { time, expected, blend: f.holePlugBlend, patchOpacity: f.holePatchOpacity, patches: f.holePatches, apertures: f.holeApertures, visible: f.holePatchesVisible, toolVisible: f.toolVisible, aluminiumBlend: f.aluminiumBlend }
    rows.push(row)
    if (!(Math.abs(f.holePlugBlend - expected) <= 1e-6)) soft.push(`t=${time}: holePlugBlend ${f.holePlugBlend} != schedule ${expected}`)
    if (f.holePatches !== holeOracle.patches || f.holeApertures !== holeOracle.apertures) soft.push(`t=${time}: ${f.holePatches} patches / ${f.holeApertures} apertures, expected ${holeOracle.patches}/${holeOracle.apertures}`)
    // The cover's own opacity follows the blend exactly until the assembly return fade (10.5 s) owns it.
    if (time < 10.5 && !(Math.abs(f.holePatchOpacity - f.holePlugBlend) <= 1e-6)) soft.push(`t=${time}: holePatchOpacity ${f.holePatchOpacity} != holePlugBlend ${f.holePlugBlend}`)
    // Covers are drawn only while the blend is > 0 (opacity > 0.001): all 12 when plugged, none when reopened.
    const shouldShow = f.holePatchOpacity > 0.001
    if (f.holePatchesVisible !== (shouldShow ? holeOracle.patches : 0)) soft.push(`t=${time}: ${f.holePatchesVisible} visible covers at patch opacity ${f.holePatchOpacity}`)
    if (time >= holeOracle.closeEnd && time <= holeOracle.openStart && !(f.holePlugBlend >= 0.999999 && f.holePatchesVisible === holeOracle.patches)) soft.push(`t=${time}: holes not fully plugged (blend ${f.holePlugBlend}, visible ${f.holePatchesVisible}) while the knurl tool can be on screen`)
    if (time <= holeOracle.closeStart && !(f.holePlugBlend === 0 && f.holePatchesVisible === 0)) soft.push(`t=${time}: holes must still be open before the close ramp (blend ${f.holePlugBlend}, visible ${f.holePatchesVisible})`)
  }
  const at = time => rows.find(r => r.time === time)
  // Ordering: plugged BEFORE the tool is visible; tool first visible at the authored approach time.
  if (!(at(2.79).toolVisible === false && at(2.79).blend >= 0.999999)) soft.push(`tool visible or holes not plugged at 2.79 s: ${JSON.stringify(at(2.79))}`)
  if (!(at(2.8).toolVisible === true && at(2.8).blend >= 0.999999)) soft.push(`tool not first visible at 2.8 s with holes already plugged: ${JSON.stringify(at(2.8))}`)
  // Ramp is monotone 1.2 -> 2.4 and strictly partial mid-ramp.
  const ramp = rows.filter(r => r.time >= 1.2 && r.time <= 2.4)
  if (!ramp.every((r, i) => i === 0 || r.blend >= ramp[i - 1].blend)) soft.push(`close ramp not monotone: ${ramp.map(r => r.blend)}`)
  if (!(at(1.8).blend > 0.1 && at(1.8).blend < 0.9)) soft.push(`close ramp not partial at 1.8 s: ${at(1.8).blend}`)
  // Reopened (blend -> 0, covers hidden) by 8.95 s, while the finish is still aluminium-tinted, i.e. before black completes.
  if (!(at(8.6).blend > 0.05 && at(8.6).blend < 0.95)) soft.push(`reopen ramp not partial at 8.6 s: ${at(8.6).blend}`)
  if (!(at(8.95).blend === 0 && at(8.95).visible === 0 && at(8.95).aluminiumBlend > 0)) soft.push(`holes not reopened before the black finish completes at 8.95 s: ${JSON.stringify(at(8.95))}`)
  if (!(at(9.3).aluminiumBlend === 0 && at(9.3).blend === 0 && at(9.3).visible === 0)) soft.push(`holes must stay open once the black finish completes (9.3 s): ${JSON.stringify(at(9.3))}`)
  result.holePlug = { schedule: holeOracle, rows, failures: soft }
  check(soft.length === 0, `hole-plug schedule: ${soft.length} deviation(s); first: ${soft[0]}`)
}

// ---- JG-035 R2: knurl-strip / CAD UV-seam image-ROI hook ---------------------------------------------------------
// IMAGE-ROI, not telemetry: the seam (ring-local -X half-plane, atan2 = +-pi) is projected through the live camera and
// the normal render (diagnostic mask OFF, knurl forced fully formed with __inspectionProof.progress(1)) is compared in
// columns around it versus columns on either side (scripts/lib/seam-roi.mjs). Hole covers are excluded by their projected
// bounding boxes because a hole pair straddles the seam. Sampling happens while the tool is hidden and the holes are
// plugged (2.4..2.79 s, ring fully aluminium); when no sample in that window faces the camera it falls back to t=0.6 s
// (angle 0, black finish). Only the PRECONDITIONS are structural; the ratio gate uses an uncalibrated gross-defect threshold.
async function seamGeometry(page) {
  return page.evaluate(() => {
    const scene = window.__threeScene, cam = window.__threeCamera, spin = scene?.getObjectByName('inspection-P003068-spin')
    if (!scene || !cam || !spin) return { error: 'scene/camera/ring probe missing' }
    scene.updateMatrixWorld(true); cam.updateMatrixWorld(true)
    const probe = window.__inspection, R = probe.ringBounds.radius, W = probe.ringBounds.width, SHOULDER = 0.0016
    const canvas = window.__threeRenderer?.domElement ?? document.querySelector('canvas'), box = canvas.getBoundingClientRect()
    const scratch = cam.position.clone()
    const px = v => { const n = v.clone().project(cam); return { x: box.left + (n.x + 1) / 2 * box.width, y: box.top + (1 - n.y) / 2 * box.height, z: n.z } }
    const world = (x, y, z) => spin.localToWorld(scratch.clone().set(x, y, z))
    const margin = 0.0005, z0 = -W / 2 + SHOULDER + margin, z1 = W / 2 - SHOULDER - margin, count = 40
    const points = []
    for (let i = 0; i <= count; i++) points.push(px(world(-R, 0, z0 + (z1 - z0) * i / count)))
    const mid = world(-R, 0, 0), normal = scratch.clone().set(-1, 0, 0).transformDirection(spin.matrixWorld), toCam = cam.position.clone().sub(mid).normalize()
    const exclusions = []
    for (const mesh of spin.children) {
      if (!mesh.name.startsWith('P003068-hole-cover-')) continue
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
      const b = mesh.geometry.boundingBox, xs = [], ys = []
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = px(mesh.localToWorld(scratch.clone().set(x, y, z))); xs.push(p.x); ys.push(p.y) }
      exclusions.push({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) })
    }
    return { facing: normal.dot(toCam), points, exclusions, ringAngle: probe.ringAngle, toolVisible: probe.toolVisible, aluminiumBlend: probe.aluminiumBlend, canvas: { width: box.width, height: box.height } }
  })
}
async function verifySeamRoi(page, result, name) {
  const candidates = []
  for (let time = 2.4; time <= 2.79 + 1e-9; time += 0.05) candidates.push(+time.toFixed(2))
  let best = null
  for (const time of candidates) {
    await seek(page, time)
    const g = await seamGeometry(page)
    if (!g.error && g.toolVisible === false && g.aluminiumBlend >= 0.99 && (!best || g.facing > best.g.facing)) best = { time, g }
  }
  if (!best || best.g.facing < 0.6) { await seek(page, 0.6); const g = await seamGeometry(page); if (!g.error && g.toolVisible === false) best = { time: 0.6, g } }
  check(best && !best.g.error, `seam ROI: could not obtain seam geometry ${JSON.stringify(best?.g?.error)}`)
  await seek(page, best.time)
  await page.evaluate(() => window.__inspectionProof.mask(false))
  await page.evaluate(() => window.__inspectionProof.progress(1)); await page.waitForTimeout(250)
  const geometry = await seamGeometry(page)
  const buffer = await page.screenshot({ path: path.join(out, `${name}-seam-roi.png`) })
  await page.evaluate(() => window.__inspectionProof.progress(null))
  const roi = seamBandProfile(buffer, geometry.points, geometry.exclusions)
  result.seamRoi = { time: best.time, facing: geometry.facing, ringAngle: geometry.ringAngle, aluminiumBlend: geometry.aluminiumBlend, excludedRects: geometry.exclusions.length, ...roi, threshold: seamThreshold, thresholdCalibrated: false }
  check(geometry.facing >= 0.3, `seam ROI precondition: seam does not face the camera (facing ${geometry.facing} at ${best.time} s)`)
  check(roi.valid, `seam ROI precondition: insufficient texture/unexcluded samples ${JSON.stringify({ counts: roi.counts, reference: roi.reference })}`)
  check(roi.ratio >= seamThreshold, `seam ROI: texture energy at the CAD UV seam is ${roi.ratio.toFixed(3)} of its neighbours (< ${seamThreshold}, uncalibrated gross-defect gate): a flat un-knurled band is likely`)
}
async function run(config) {
  const result = { name: config.name, errors: [], requests: [], frames: [], masks: [], failures: [] }
  report.cases.push(result)
  const context = await browser.newContext({ viewport: config.mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 }, reducedMotion: config.reduced ? 'reduce' : 'no-preference', isMobile: !!config.mobile, hasTouch: !!config.mobile, deviceScaleFactor: 1 })
  if (config.poster) await context.addInitScript(() => { Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined }) })
  const page = await context.newPage()
  page.on('pageerror', error => result.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()) })
  page.on('request', request => { if (/\.glb(?:\?|$)/.test(request.url())) result.requests.push(request.url()) })
  try {
    await page.goto(`${url}/?chapter=1&inspectionProof=1`, { waitUntil: 'domcontentloaded' })
    const trigger = page.getByRole('button', { name: 'Inspect the finish' })
    await trigger.waitFor({ state: 'visible', timeout: 120000 })
    if (!config.poster && !config.reduced) await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(1500)
    if (config.mode) {
      await page.getByRole('button', { name: config.mode === 'blueprint' ? /BLUEPRINT WIREFRAME/ : /EXPLODED ASSEMBLY/ }).click()
      await page.waitForTimeout(350)
    }
    result.entry = await page.evaluate(() => ({ scroll: scrollY, height: document.documentElement.scrollHeight, camera: window.__threeCamera?.matrixWorld.elements.slice(), meshes: window.__rig?.meshes.map(mesh => [mesh.geometry.uuid, mesh.geometry.attributes.position.count, mesh.material.uuid]), ring: window.__rig?.clutch.ringSwitch?.matrixWorld.elements.slice() }))
    await trigger.focus(); await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor()
    check(await page.getByRole('button', { name: /Return/ }).evaluate(button => document.activeElement === button), 'Return must receive initial focus')
    if (config.poster || config.reduced) {
      check(await page.locator('.ring-static').count() === 1, 'Static finish equivalent missing')
      check(!result.requests.some(request => request.includes('knurling-tool')), 'Static inspection fetched the tool')
      const probe = await read(page); check(probe.time === 0 && probe.ringAngle === 0, 'Static inspection advanced rapid spin')
      check(probe.holePlugBlend === 0 && probe.holePatches === 0 && probe.holePatchesVisible === 0, `Static inspection built hole covers ${JSON.stringify({ blend: probe.holePlugBlend, patches: probe.holePatches, visible: probe.holePatchesVisible })}`)
    } else {
      // Tool census is assigned only after the async knurling-tool.glb fetch+parse (ringRuntime.ts), so the
      // readiness gate must include it or the census check races the load (ring-full 2026-10-09 diagnosis).
      // Counter ledger (ringRuntime.ts): resources.meshes is INITIALIZED to ring.geometries.length (1)
      // + hole-cover patchMeshes.length (12) at :84, then the tool GLB traverse adds 12 Mesh instances
      // at :128, and :129 subtracts ring.geometries.length — so the runtime invariant on the frozen
      // build is toolMeshes 24 (12 covers + 12 tool meshes), measured live 2026-10-09 and independently
      // by the lifecycle V5 ring-render proof (ringMeshes 1 / toolMeshes 24). The old `=== 12` asserted
      // the tool-only file census, which this counter never reports.
      await page.waitForFunction(() => window.__inspection?.loaded && window.__inspectionProof && (window.__inspection?.toolMeshes ?? 0) > 0, null, { timeout: 60000 })
      const initial = await seek(page, 0)
      check(
        initial.ringMeshes > 0 && initial.toolMeshes === 24,
        `Ring/tool census mismatch: measured ring ${initial.ringMeshes} / tool ${initial.toolMeshes}, expected 1 / 24`,
      )
      check(Math.abs(initial.ringBounds.radius * 2 - .07544365628189591) < .00001, 'Ring OD differs from fit source')
      check(Math.abs(initial.ringBounds.width - .027204217025541766) < .000001, 'Ring width differs from fit source')
      check(initial.cameraOwner === 'CameraRig', 'Multiple camera owner')
      const entryFade = await seek(page, 0, .5), macroFade = await seek(page, 4.2), returnFade = await seek(page, 11.25), endFade = await seek(page, 12)
      result.fade = [entryFade, macroFade, returnFade, endFade].map(f => ({ time: f.time, alpha: f.narrativeAlpha, visibleMeshes: f.narrativeVisibleMeshes, originalsIntact: f.narrativeOriginalsIntact }))
      check(entryFade.narrativeAlpha > 0 && entryFade.narrativeAlpha < 1 && entryFade.narrativeVisibleMeshes > 0, 'Narrative did not fade smoothly out')
      check(macroFade.narrativeAlpha === 0 && macroFade.narrativeVisibleMeshes === 0, 'Assembly did not isolate into darkness')
      check(returnFade.narrativeAlpha > .3 && returnFade.narrativeAlpha < .7 && returnFade.narrativeVisibleMeshes > 0, 'Assembly did not fade smoothly back in')
      check(endFade.narrativeAlpha === 1 && result.fade.every(f => f.originalsIntact), 'Original finish context not preserved')
      for (const [time, elapsed, name] of [[0, .4, 'entry-fade'], [4.2, 2, 'isolated'], [11.25, 2, 'return-fade'], [12, 2, 'returned']]) {
        await seek(page, time, elapsed); await page.screenshot({ path: path.join(out, `${config.name}-${name}.png`) })
      }
      await seek(page, 0)
      await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
      await page.waitForTimeout(350)
      check((await read(page)).time > 0, 'Play control failed')
      await page.getByRole('button', { name: 'Pause', exact: true }).click()
      for (const time of [2.4, 4.2, 4.7, 5.2, 5.7, 6.2, 7.7, 8.2, 10, 12]) {
        const frame = await seek(page, time); result.frames.push(frame)
        for (const value of [...frame.rollerClearance, ...frame.rollerAxial, ...frame.worldBounds.min, ...frame.worldBounds.max]) check(Number.isFinite(value), `Nonfinite transformed value at ${time}`)
        if (time >= 4.2 && time <= 6.2) {
          check(frame.toolVisible, `Tool absent during traverse at ${time}`)
          check(frame.rollerClearance.every(gap => Math.abs(gap) < .00002), `Actual roller radial contact failed at ${time}: ${frame.rollerClearance}`)
          check(frame.wheelAxis.every(axis => Math.abs(axis[2]) > .9999), 'Roller spin axis does not match ring Z')
        }
        check(frame.maskSamples.bore === 0 && frame.maskSamples.shoulder === 0, 'Relief spilled onto bore/shoulders')
      }
      check(result.frames.find(f => f.time === 7.7).rollerClearance.every(gap => gap > .008), 'Rollers did not clear OD before withdrawal')
      const contact = result.frames.filter(f => f.time >= 4.2 && f.time <= 6.2)
      check(contact.every((f, i) => i === 0 || f.rollerAxial[0] > contact[i - 1].rollerAxial[0]), 'Traverse is not increasing in mapped axial frame')
      await verifyHolePlug(page, result)
      await verifySeamRoi(page, result, config.name)
      await seek(page, 5.2)
      await page.evaluate(() => window.__inspectionProof.mask(true))
      for (const progress of [0, .5, 1]) {
        await page.evaluate(p => window.__inspectionProof.progress(p), progress); await page.waitForTimeout(250)
        const filename = path.join(out, `${config.name}-od-mask-${progress}.png`)
        const buffer = await page.screenshot({ path: filename })
        result.masks.push({ progress, ...pixelCounts(buffer), filename })
      }
      check(result.masks[0].green < 20, 'Smooth OD emitted relief pixels')
      check(result.masks[1].green > 100 && result.masks[2].green > result.masks[1].green * 1.15, 'Progressive OD shader mask has no increasing rendered pixel evidence')
      check(result.masks[2].red > 100, 'No visible unknurled bore/shoulder pixel evidence')
      await page.evaluate(() => { window.__inspectionProof.mask(false); window.__inspectionProof.progress(null) })
      await seek(page, 5.2); await page.screenshot({ path: path.join(out, `${config.name}-contact.png`) })
      await seek(page, 10); await page.screenshot({ path: path.join(out, `${config.name}-black-finish.png`) })
      await page.getByRole('button', { name: 'Replay', exact: true }).click()
      await page.waitForTimeout(150); check((await read(page)).time < .5, 'Replay did not restart')
      const rigDuring = await page.evaluate(() => ({ ring: window.__rig.clutch.ringSwitch.matrixWorld.elements.slice(), meshes: window.__rig.meshes.map(mesh => [mesh.geometry.uuid, mesh.geometry.attributes.position.count, mesh.material.uuid]) }))
      check(JSON.stringify(rigDuring.meshes.map(mesh => mesh.slice(0, 2))) === JSON.stringify(result.entry.meshes.map(mesh => mesh.slice(0, 2))), 'Narrative CAD geometry changed')
      check((await read(page)).narrativeOriginalsIntact, 'Borrowed originals were mutated during fade')
      check(JSON.stringify(rigDuring.ring) === JSON.stringify(result.entry.ring), 'Narrative ring pose moved during inspection')
    }
    await page.keyboard.press('Shift+Tab')
    check(await page.getByRole('dialog').evaluate(dialog => dialog.contains(document.activeElement)), 'Focus escaped inspection')
    await page.mouse.wheel(0, 800); await page.waitForTimeout(200)
    check(Math.abs(await page.evaluate(() => scrollY) - result.entry.scroll) < 1, 'Scroll escaped inspection lock')
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'detached' })
    check(await trigger.evaluate(button => document.activeElement === button), 'Trigger focus was not restored')
    result.restored = await read(page)
    check(Math.abs(await page.evaluate(() => scrollY) - result.entry.scroll) < 1, 'Entry scroll not restored')
    check(await page.evaluate(() => document.documentElement.scrollHeight) === result.entry.height, 'Inspection changed narrative scroll track height')
    if (!config.poster && !config.reduced) {
      const restoredMeshes = await page.evaluate(() => window.__rig.meshes.map(mesh => [mesh.geometry.uuid, mesh.geometry.attributes.position.count, mesh.material.uuid]))
      check(JSON.stringify(restoredMeshes) === JSON.stringify(result.entry.meshes), 'Original narrative material instances were not restored')
      check(result.restored.disposed > 0 && !result.restored.loaded, 'Inspection resources did not dispose')
      check(result.restored.restoredPoseError < 1e-7, 'Camera pose restore failed')
      await trigger.click(); await page.waitForFunction(() => window.__inspection?.loaded, null, { timeout: 60000 })
      check((await read(page)).time === 0, 'Reentry did not return smooth')
      await page.getByRole('button', { name: /Return/ }).click()
      // Reverse native narrative scroll and reenter from a different mechanical pose.
      await page.evaluate(() => window.__lenis.scrollTo(scrollY - 600, { immediate: true, force: true }))
      await page.waitForTimeout(1000); const reverse = await page.evaluate(() => scrollY)
      await trigger.click(); await page.waitForFunction(() => window.__inspection?.loaded, null, { timeout: 60000 })
      await page.keyboard.press('Escape'); check(Math.abs(await page.evaluate(() => scrollY) - reverse) < 1, 'Reverse-scroll entry restore failed')
      if (!config.mobile) {
        let hold = true
        const held = []
        const routeTool = async route => { if (hold) { held.push(route); return } await route.continue() }
        await page.route('**/models/knurling-tool.glb', routeTool)
        await trigger.click(); await page.waitForTimeout(200)
        await page.keyboard.press('Escape'); hold = false
        await trigger.click(); await page.waitForFunction(() => window.__inspection?.loaded, null, { timeout: 60000 })
        for (const route of held) await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'invalid canceled glb' }).catch(() => {})
        await page.waitForTimeout(250)
        check(await page.getByRole('button', { name: 'Play sequence', exact: true }).isEnabled(), 'Canceled loader rejection corrupted reentry')
        result.canceledEpochLoads = held.length
        check(held.length > 0, 'Canceled loader scenario did not actually intercept a load')
        await page.keyboard.press('Escape'); await page.unroute('**/models/knurling-tool.glb', routeTool)
        const failTool = route => route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'invalid current glb' })
        await page.route('**/models/knurling-tool.glb', failTool)
        await trigger.click(); await page.getByRole('button', { name: 'Try again', exact: true }).waitFor()
        await page.unroute('**/models/knurling-tool.glb', failTool)
        await page.getByRole('button', { name: 'Try again', exact: true }).click()
        await page.waitForFunction(() => window.__inspection?.loaded, null, { timeout: 60000 })
        result.failedLoadRecovered = true
        await loseContext(page)
        await page.getByRole('dialog').waitFor({ state: 'detached' })
        check(await page.evaluate(() => !document.body.classList.contains('ring-inspection-open') && !document.getElementById('root').inert), 'Quality teardown left narrative chrome hidden/inert')
        result.qualityFallbackRestored = true
      }
    }
    check(result.errors.length === 0, `${result.errors.length} console/page errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) { result.failures.push(error.stack || String(error)); report.failures.push(`${config.name}: ${error}`); result.pass = false }
  finally { await context.close() }
}
async function earlyCadEntry() {
  const result = { name: 'delayed-CAD-entry', errors: [], failures: [] }
  report.cases.push(result)
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  let release
  const gate = new Promise(resolve => { release = resolve })
  await context.route('**/models/Default.glb', async route => { await gate; await route.continue() })
  const page = await context.newPage()
  page.on('pageerror', error => result.errors.push(error.stack))
  page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()) })
  try {
    await page.goto(`${url}/?chapter=1&inspectionProof=1`, { waitUntil: 'domcontentloaded' })
    const trigger = page.getByRole('button', { name: 'Inspect the finish' })
    await trigger.waitFor({ timeout: 60000 }); await trigger.click()
    check(await page.getByRole('dialog').count() === 1, 'Early inspection did not open')
    check(!(await read(page)).loaded, 'Early-entry test did not actually delay CAD')
    release()
    await page.waitForFunction(() => window.__inspection?.loaded && window.__inspectionProof, null, { timeout: 120000 })
    result.loadedAfterSourceNotification = true
    await page.keyboard.press('Escape')
    // Reproduce canvas disposal while the warm-up may still be polling programs.
    result.warmReadyBeforeFallback = await page.evaluate(() => window.__telemetry.performance.warmReady)
    await loseContext(page)
    await page.waitForTimeout(750)
    check(!result.errors.length, `${result.errors.length} early/fallback errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) { result.pass = false; result.failures.push(String(error)); report.failures.push(`${result.name}: ${error}`) }
  finally { release(); await context.close() }
}
try {
  await earlyCadEntry()
  const cases = process.argv.includes('--focused') ? [{ name: 'desktop' }, { name: 'mobile', mobile: true }] : [{ name: 'desktop' }, { name: 'mobile', mobile: true }, { name: 'blueprint', mode: 'blueprint' }, { name: 'exploded', mode: 'exploded' }, { name: 'reduced-mobile', reduced: true, mobile: true }, { name: 'poster', poster: true }]
  for (const config of cases) await run(config)
} finally {
  await browser.close(); report.finished = new Date().toISOString()
  await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2))
}
console.log(JSON.stringify({ report: path.join(out, 'report.json'), cases: report.cases.map(c => ({ name: c.name, pass: c.pass, failures: c.failures, errorCount: c.errors.length, firstErrors: c.errors.slice(0, 2) })), failures: report.failures }, null, 2))
if (report.failures.length) process.exitCode = 1
