import fs from 'node:fs'
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs')
const out = process.env.OUT || 'output/playwright/quiet-machine'
const base = process.env.BASE_URL || 'http://localhost:4173'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
const report = { checks: {}, errors: [] }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: `${out}/video`, size: { width: 1440, height: 900 } } })
  const page = await context.newPage()
  await page.goto(`${base}/?study=rl300&shot=.52`)
  await page.waitForFunction(() => window.__quietMachine?.ready)
  assert(Math.abs(await page.evaluate(() => window.__quietMachine.u) - .52) < .001)
  await page.reload(); await page.waitForFunction(() => window.__quietMachine?.ready)
  assert(Math.abs(await page.evaluate(() => window.__quietMachine.u) - .52) < .001)
  report.checks.directNavigationAndReload = 'pass'
  for (let i = 0; i <= 100; i++) {
    const u = .56 * (i <= 50 ? i / 50 : (100 - i) / 50)
    await page.evaluate(u => window.scrollTo({ top: u * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }), u)
    await page.waitForTimeout(33)
  }
  await page.waitForFunction(() => window.__quietMachine.u < .001)
  report.checks.nativeForwardReverse = 'pass'
  await page.close(); await context.close()
  await page.video().saveAs(`${out}/reversible-reveal.webm`)
  const legacy = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  legacy.on('pageerror', e => report.errors.push(String(e)))
  await legacy.goto(`${base}/`)
  await legacy.waitForFunction(() => window.__drawingProof?.scrollToProgress && document.querySelector('canvas') && window.__telemetry?.rig, { timeout: 60000 })
  await legacy.evaluate(() => window.__drawingProof.scrollToProgress(.47))
  await legacy.waitForFunction(() => Math.abs(window.__telemetry.scroll.progress - .47) < .003)
  await legacy.waitForTimeout(1800)
  report.legacy = await legacy.evaluate(() => ({ rig: window.__telemetry.rig, scroll: window.__telemetry.scroll, stage: window.__telemetry.stage, height: document.documentElement.scrollHeight / innerHeight }))
  assert(report.legacy.stage.alpha[0] > .99)
  assert(report.legacy.rig.explodeFactor > .9)
  assert.equal(await legacy.evaluate(() => !!window.__quietMachine), false)
  report.checks.legacyPortfolioSmoke = 'pass: original canvas, wrench exploded state and progress route alive'
  assert.equal(report.errors.length, 0)
  await legacy.close()
} catch (e) { report.failure = String(e); process.exitCode = 1 }
finally { await browser.close(); fs.writeFileSync(`${out}/review-smoke.json`, JSON.stringify(report, null, 2)) }
console.log(JSON.stringify(report, null, 2))
