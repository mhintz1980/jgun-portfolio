import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { compare } from './lib/preview-pixels.mjs'

const base = process.env.BASE_URL || 'http://localhost:4173'
const failures = []
const report = {
  base,
  assertions: {},
}

function check(name, condition, message) {
  const pass = Boolean(condition)
  report.assertions[name] = pass ? { pass: true } : { pass: false, message }
  if (!pass) failures.push(name)
  return pass
}

async function seek(page, u) {
  const frame = await page.evaluate(u => {
    const q = window.__quietMachine
    const previous = q.frame
    q.seek(u)
    return previous
  }, u)
  await page.waitForFunction(frame => window.__quietMachine?.frame > frame, frame)
  await page.waitForFunction(u => Number(document.querySelector('input[type=range]')?.value) === Math.round(u * 1000), u)
}

async function readRibbons(page) {
  return page.evaluate(() => {
    const ribbons = window.__quietMachine?.ribbons
    if (!ribbons) return null
    const result = { render: typeof ribbons.render === 'function' }
    for (const bundle of ['main', 'lower', 'merged', 'sound']) {
      const entry = ribbons[bundle]
      result[bundle] = entry ? {
        clipping: entry.clipping,
        clippingPlanes: entry.clippingPlanes.map(plane => plane.constant),
        uuid: entry.uuid,
      } : null
    }
    return result
  })
}

async function mutateAndWait(page, bundles, constants) {
  const frame = await page.evaluate(({ bundles, constants }) => {
    const q = window.__quietMachine
    const previous = q.frame
    for (const bundle of bundles) {
      const planes = q.ribbons?.[bundle]?.clippingPlanes || []
      planes.forEach((plane, index) => { plane.constant = constants[bundle][index] })
    }
    q.ribbons?.render?.()
    return previous
  }, { bundles, constants })
  await page.waitForFunction(frame => window.__quietMachine?.frame > frame, frame)
}

async function setClipOverrideAndWait(page, constant) {
  const frame = await page.evaluate(constant => {
    const q = window.__quietMachine
    const previous = q.frame
    q.ribbons?.setClipOverride?.(constant)
    q.ribbons?.render?.()
    return previous
  }, constant)
  await page.waitForFunction(frame => window.__quietMachine?.frame > frame, frame)
}

async function clearClipOverrideAndWait(page) {
  const frame = await page.evaluate(() => {
    const q = window.__quietMachine
    const previous = q.frame
    q.ribbons?.clearClipOverride?.()
    q.ribbons?.render?.()
    return previous
  })
  await page.waitForFunction(frame => window.__quietMachine?.frame > frame, frame)
}

let browser
try {
  try {
    const response = await fetch(base, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error(`Preview server not reachable at ${base}; run npm run preview (${error.message})`)
    process.exitCode = 1
    process.exit()
  }

  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  page.setDefaultTimeout(60000)
  await page.goto(`${base}/?study=rl300`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
  await page.waitForFunction(() => window.__quietMachine?.ribbons, { timeout: 60000 })
  await seek(page, .70)

  const initial = await readRibbons(page)
  assert(initial, 'ribbon telemetry is present')
  assert(initial.render, 'ribbon render callback is present')
  for (const bundle of ['main', 'lower', 'merged', 'sound']) {
    assert(initial[bundle], `${bundle} telemetry is present`)
    assert.equal(typeof initial[bundle].uuid, 'string', `${bundle} exposes a material uuid`)
    assert(Array.isArray(initial[bundle].clippingPlanes), `${bundle} exposes clipping planes`)
  }
  check('main clipping enabled', initial.main.clipping === true, 'main material clipping is not enabled')
  check('merged clipping enabled', initial.merged.clipping === true, 'merged material clipping is not enabled')
  check('lower clipping disabled', initial.lower.clipping === false, 'lower material clipping must be disabled')

  const canvas = page.locator('canvas')
  await canvas.waitFor({ state: 'visible' })
  const baseline = await canvas.screenshot()
  await setClipOverrideAndWait(page, -10)
  const afterExclusion = await canvas.screenshot()
  const exclusion = compare(baseline, afterExclusion)
  const measurement = 'shared main+merged plane override via setClipOverride/clearClipOverride'
  report.main = { ...exclusion, measurement }
  report.merged = { ...exclusion, measurement }
  check('main exclusion changes pixels', exclusion.changed >= 200, `shared exclusion changed ${exclusion.changed} pixels`)
  check('merged exclusion changes pixels', exclusion.changed >= 200, `shared exclusion changed ${exclusion.changed} pixels`)

  await clearClipOverrideAndWait(page)
  const restored = compare(baseline, await canvas.screenshot())
  report.restore = restored
  check('restore matches baseline', restored.changed === 0 || restored.fraction < .0001,
    `restore changed ${restored.changed} pixels (${restored.fraction})`)

  const lowerBefore = await readRibbons(page)
  let lowerDiff
  let lowerRestored = null
  if (lowerBefore.lower.clippingPlanes.length > 0) {
    await mutateAndWait(page, ['lower'], { lower: lowerBefore.lower.clippingPlanes.map(() => -10) })
    lowerDiff = compare(baseline, await canvas.screenshot())
    const lowerConstants = lowerBefore.lower.clippingPlanes
    await mutateAndWait(page, ['lower'], { lower: lowerConstants })
    lowerRestored = compare(baseline, await canvas.screenshot())
    check('lower mutation is inert', lowerDiff.changed === 0 || lowerDiff.fraction < .0001,
      `lower mutation changed ${lowerDiff.changed} pixels (${lowerDiff.fraction})`)
    check('lower restore is inert', lowerRestored.changed === 0 || lowerRestored.fraction < .0001,
      `lower restore changed ${lowerRestored.changed} pixels (${lowerRestored.fraction})`)
  } else {
    await mutateAndWait(page, [], {})
    lowerDiff = compare(baseline, await canvas.screenshot())
    check('lower no-plane invalidate is inert', lowerDiff.changed === 0 || lowerDiff.fraction < .0001,
      `lower no-plane invalidate changed ${lowerDiff.changed} pixels (${lowerDiff.fraction})`)
  }
  report.lower = { ...lowerDiff, planes: lowerBefore.lower.clippingPlanes.length, ...(lowerRestored ? { restored: lowerRestored } : {}) }
} catch (error) {
  report.execution = String(error)
  failures.push('execution')
} finally {
  if (browser) await browser.close()
  report.pass = failures.length === 0
  if (failures.length) report.failures = failures
  console.log(JSON.stringify(report))
  if (failures.length) process.exitCode = 1
}
