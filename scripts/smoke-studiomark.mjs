// Focused publication smoke check, not full cinematic or final visual acceptance.
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')))
const base = args.url ?? 'http://localhost:4173'
const out = resolve(args.out ?? 'output/playwright/studiomark-wip-smoke')
const selectedCase = args.case
mkdirSync(out, { recursive: true })
const report = { scope: 'publication smoke only; cinematic/alias/final visual acceptance unclaimed',
  base, selectedCase, capturedAt: new Date().toISOString(), launch: describeLaunch(), cases: [] }
const browser = await launchBrowser(chromium)
try {
  for (const [name, viewport, reduced] of [
    ['desktop', { width: 1440, height: 900 }, false],
    ['narrow', { width: 390, height: 844 }, false],
    ['reduced', { width: 390, height: 844 }, true],
  ]) {
    for (const route of ['home', 'torque-wrench', 'quiet-machine']) {
      if (selectedCase && `${name}-${route}` !== selectedCase) continue
      const result = { name: `${name}-${route}`, errors: [], httpErrors: [], cadRequests: [], samples: [] }
      report.cases.push(result)
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1,
        reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })
      const page = await context.newPage()
      page.on('pageerror', error => result.errors.push(String(error)))
      page.on('console', msg => { if (msg.type() === 'error') result.errors.push(msg.text()) })
      page.on('response', response => { if (response.status() >= 400) result.httpErrors.push(`${response.status()} ${response.url()}`) })
      page.on('request', request => { if (/\.glb(?:\?|$)/i.test(request.url())) result.cadRequests.push(request.url()) })
      try {
        const response = await page.goto(`${base.replace(/\/$/, '')}/${route}/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
        if (!response?.ok()) throw new Error(`document returned ${response?.status()}`)
        await page.getByText(/Work in progress/i).first().waitFor({ state: 'visible' })
        if (reduced) {
          if (route === 'home') {
            await page.locator('.home-name[data-ready]').waitFor({ state: 'visible' })
            await page.locator('#work').scrollIntoViewIfNeeded()
            await page.waitForFunction(() => [...document.images].filter(image => image.complete && image.naturalWidth > 0).length >= 4)
            result.poster = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length,
              images: [...document.images].filter(image => image.complete && image.naturalWidth > 0).length,
              storyCharacters: document.querySelector('main')?.textContent?.trim().length ?? 0 }))
            if (result.poster.canvases > 1 || result.cadRequests.length) throw new Error('reduced homepage loaded narrative CAD')
          } else if (route === 'torque-wrench') {
            // Current unfinished torque fallback is DOM narrative + labeled poster slots.
            // Do not invent an image requirement or claim completed offline artwork.
            await page.locator('[data-torque-mode="static"] [data-torque-poster]').first().waitFor({ state: 'visible' })
          } else {
            await page.waitForFunction(() => [...document.images].some(image => image.complete && image.naturalWidth > 0))
          }
          if (route !== 'home') {
            result.poster = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length,
              images: [...document.images].filter(image => image.complete && image.naturalWidth > 0).length,
              unfinishedPosterSlots: document.querySelectorAll('[data-torque-poster-pending]').length,
              storyCharacters: document.querySelector('main')?.textContent?.trim().length ?? 0 }))
            if (result.poster.canvases || result.cadRequests.length) throw new Error('reduced-motion path loaded narrative CAD or canvas')
          }
          if (route === 'torque-wrench' && result.poster.storyCharacters < 400) throw new Error('static narrative unavailable')
        } else if (route === 'home') {
          await page.locator('.home-name[data-ready]').waitFor({ state: 'visible' })
          await page.waitForFunction(() => [...document.images].filter(image => image.complete && image.naturalWidth > 0).length >= 4)
          await page.locator('a[href="/torque-wrench/"]').first().waitFor({ state: 'visible' })
          result.samples.push(await page.evaluate(() => ({ ready: !!document.querySelector('.home-name[data-ready]'),
            loadedImages: [...document.images].filter(image => image.complete && image.naturalWidth > 0).length,
            canvases: document.querySelectorAll('canvas').length })))
          if (result.samples.some(sample => !sample.ready || sample.canvases !== 1) || result.cadRequests.length) throw new Error('homepage readiness check failed')
        } else if (route === 'torque-wrench') {
          await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().ready, null, { timeout: 60000 })
          for (const p of [0, .62, .94]) {
            await page.evaluate(progress => window.scrollTo(0, window.__torqueNarrative.scrollFraction(progress)
              * (document.documentElement.scrollHeight - innerHeight)), p)
            await page.waitForFunction(progress => Math.abs(window.__torqueNarrative.snapshot().progress - progress) < .001,
              p, { timeout: 15000 })
            result.samples.push(await page.evaluate(() => ({ progress: window.__torqueNarrative.snapshot().progress,
              ready: window.__torqueWorld.snapshot().ready, canvases: document.querySelectorAll('canvas').length })))
          }
          if (result.samples.some(sample => !sample.ready || sample.canvases < 1)) throw new Error('live torque scene unavailable')
        } else {
          await page.waitForFunction(() => window.__quietMachine?.ready, null, { timeout: 60000 })
          await page.getByRole('button', { name: 'Section', exact: true }).click()
          await page.waitForFunction(() => Math.abs(window.__quietMachine.u - .2) < .01)
          result.samples.push(await page.evaluate(() => ({ ready: window.__quietMachine.ready, u: window.__quietMachine.u,
            canvases: document.querySelectorAll('canvas').length })))
          await page.getByRole('button', { name: 'Exterior', exact: true }).click()
        }
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: resolve(out, `${result.name}.png`), timeout: 30000 })
        const sibling = route === 'home' ? 'torque-wrench' : route === 'torque-wrench' ? 'quiet-machine' : 'torque-wrench'
        const link = route === 'home'
          ? page.locator(`a[href="/${sibling}/"]`).first()
          : page.getByRole('navigation', { name: 'Pages', exact: true }).locator(`a[href^="/${sibling}/"]`).first()
        await link.click()
        await page.waitForURL(url => url.pathname === `/${sibling}/`, { timeout: 15000 })
        result.navigation = true
      } catch (error) {
        result.errors.push(String(error))
      } finally {
        await context.close()
      }
      result.result = result.errors.length || result.httpErrors.length || !result.navigation ? 'FAIL' : 'PASS'
      console.log(`${result.name}: ${result.result}`)
    }
  }
} finally {
  await browser.close()
  report.result = report.cases.length === (selectedCase ? 1 : 9) && report.cases.every(result => result.result === 'PASS') ? 'PASS' : 'FAIL'
  writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`${report.result}: ${out}/report.json`)
  if (report.result !== 'PASS') process.exitCode = 1
}
