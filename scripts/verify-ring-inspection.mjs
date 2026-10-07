import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pixels } from './lib/preview-pixels.mjs'

const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) || 'http://localhost:5199'
const out = path.resolve(process.argv.find(arg => arg.startsWith('--out='))?.slice(6) || '.scratch/ring-inspection-runtime')
await fs.mkdir(out, { recursive: true })
const report = { url, started: new Date().toISOString(), cases: [], failures: [] }
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] })
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
    } else {
      await page.waitForFunction(() => window.__inspection?.loaded && window.__inspectionProof, null, { timeout: 60000 })
      const initial = await seek(page, 0)
      check(initial.ringMeshes > 0 && initial.toolMeshes === 12, 'Expected actual ring and 12 verified prop meshes')
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
