import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'))
const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) || 'http://localhost:5199'
const report = { url, started: new Date().toISOString(), cases: [], failures: [], scope: 'Real poster and OS reduced-motion DOM entries. Poster denies WebGL; reduced retains the existing narrative canvas and records its CAD requests separately. No manufacturing/tool requests or inspection canvas permitted. Whole-page reduced-motion zero-CAD V4 remains an owner decision; no visual acceptance inferred.' }
const check = (condition, message) => { if (!condition) throw new Error(message) }
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] })
try {
  for (const config of [
    { name: 'poster-desktop', width: 1440, height: 900, reduced: false, poster: true },
    { name: 'poster-narrow', width: 390, height: 844, reduced: false, poster: true },
    { name: 'reduced-desktop', width: 1440, height: 900, reduced: true, poster: false },
    { name: 'reduced-narrow', width: 390, height: 844, reduced: true, poster: false },
  ]) {
    const result = { name: config.name, glbRequests: [], imageResponses: [], errors: [], failures: [] }
    report.cases.push(result)
    const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, deviceScaleFactor: 1, reducedMotion: config.reduced ? 'reduce' : 'no-preference' })
    if (config.poster) await context.addInitScript(() => { Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined }) })
    const page = await context.newPage()
    let entered = false
    page.on('request', request => { if (/\.glb(?:\?|$)|manufacturing-core|knurling-tool/i.test(request.url())) result.glbRequests.push({ url: request.url(), phase: entered ? 'entry' : 'page-load' }) })
    page.on('response', response => { if (response.url().includes('/inspection/shaft/')) result.imageResponses.push({ url: response.url(), status: response.status() }) })
    page.on('pageerror', error => result.errors.push(error.message))
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      const trigger = page.locator('button[data-story="shaft-p001835"]')
      await trigger.waitFor({ state: 'visible' })
      const before = await page.evaluate(() => ({ scrollX, scrollY, overflow: document.documentElement.style.overflow }))
      entered = true
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: 'Input Shaft' })
      await dialog.waitFor({ state: 'visible' })
      await page.locator('[data-static-shaft-story]').waitFor({ state: 'visible' })
      result.staticState = await page.evaluate(() => ({ canvasCount: document.querySelectorAll('canvas').length, inspectionCanvasCount: document.querySelector('[role=dialog]').querySelectorAll('canvas').length, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, status: window.__inspection?.status, phase: window.__inspection?.phase, time: window.__inspection?.time }))
      check(result.staticState.inspectionCanvasCount === 0, 'Fallback mounted an inspection canvas')
      if (config.poster) check(result.staticState.canvasCount === 0, 'Poster mounted a canvas')
      check(result.staticState.reduced === config.reduced, 'OS reduced-motion preference did not match context')
      check(result.staticState.status === 'ready' && result.staticState.time === 0, 'Static study was not ready/frozen')
      const chapters = await dialog.locator('[data-shaft-transcript] > section > h3').allTextContents()
      check(JSON.stringify(chapters) === JSON.stringify(['Why the groove was needed', 'Material attempts', 'Changing the process', 'Moving the supports']), 'Four-chapter transcript differs')
      result.chapterHeadings = chapters
      result.failedAlloys = await dialog.locator('.shaft-static-alloy').allTextContents()
      check(JSON.stringify(result.failedAlloys) === JSON.stringify(['AISI 4140 (40-45 HRC)', 'AISI 4340 (48-50 HRC)', 'C300 (56-58 HRC)']), 'Failed alloy text differs')
      check(await dialog.locator('.shaft-static-failed').count() === 3, 'Three FAILED stamps missing')
      check((await dialog.locator('.shaft-static-failed').allTextContents()).every(text => text === 'FAILED'), 'FAILED stamp differs')
      check(await dialog.locator('.shaft-static-final-alloy').innerText() === 'AISI 4340 (H.T. 48-50 HRC)', 'Final heat treatment differs')
      check(await dialog.locator('.shaft-static-attribution').innerText() === 'Earlier material attempts, as recounted by the designer.', 'Owner-account attribution missing')
      check(await dialog.getByText('Illustrative stress concentration', { exact: true }).count() === 2, 'Warm/cool illustration captions missing')
      const parts = await dialog.locator('[data-static-part]').evaluateAll(nodes => nodes.map(node => node.dataset.staticPart))
      check(parts.length === 6, 'Six-part sequence incomplete')
      result.parts = parts
      await page.screenshot({ path: path.join(out, `${config.name}-entry.png`) })
      const images = dialog.locator('.shaft-static-still img')
      result.images = []
      for (let index = 0; index < await images.count(); index++) {
        const image = images.nth(index)
        await image.scrollIntoViewIfNeeded()
        await image.evaluate(node => node.decode())
        const info = await image.evaluate(node => ({ src: node.currentSrc, width: node.naturalWidth, height: node.naturalHeight, loading: node.loading, alt: node.alt, complete: node.complete }))
        check(info.complete && info.width > 0 && info.height > 0, `Image ${index} did not load`)
        check(info.loading === 'lazy' && info.alt.length > 40, `Image ${index} has no meaningful alternative or lazy policy`)
        check(info.src.endsWith(config.width <= 600 ? '-narrow.webp' : '-desktop.webp'), `Image ${index} used the wrong picture variant`)
        result.images.push(info)
        await page.locator('.shaft-static-still').nth(index).screenshot({ path: path.join(out, `${config.name}-still-${index + 1}.png`) })
      }
      check(result.images.length === 8, 'Eight rendered stills missing')
      result.layout = await dialog.evaluate(node => {
        const rect = node.getBoundingClientRect()
        const controls = [...node.querySelectorAll('button')].map(button => { const r = button.getBoundingClientRect(); return { text: button.textContent, width: r.width, height: r.height, top: r.top, bottom: r.bottom } })
        const overflowing = [...node.querySelectorAll('.shaft-static-sequence *')].filter(child => { const r = child.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1) }).map(child => child.tagName + '.' + child.className)
        return { viewport: { width: innerWidth, height: innerHeight }, dialog: { left: rect.left, right: rect.right }, controls, overflowing }
      })
      check(result.layout.overflowing.length === 0, `Static content overflows viewport: ${result.layout.overflowing.join(',')}`)
      check(result.layout.controls.every(control => control.width >= 44 && control.height >= 44), 'Control target smaller than 44 CSS pixels')
      const returnButton = dialog.getByRole('button', { name: 'Return to narrative' })
      check(await returnButton.evaluate(node => document.activeElement === node), 'Entry did not focus Return')
      await page.keyboard.press('Tab')
      check(await returnButton.evaluate(node => document.activeElement === node), 'Tab escaped the static dialog')
      await page.keyboard.press('Shift+Tab')
      check(await returnButton.evaluate(node => document.activeElement === node), 'Shift+Tab escaped the static dialog')
      check(await returnButton.evaluate(node => { const r = node.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }), 'Return is not reachable after scrolling the still sequence')
      await page.screenshot({ path: path.join(out, `${config.name}-finale.png`) })
      await returnButton.click()
      await dialog.waitFor({ state: 'detached' })
      result.returnState = await page.evaluate(() => ({ focusStory: document.activeElement?.dataset?.story, scrollX, scrollY, overflow: document.documentElement.style.overflow, rootInert: document.getElementById('root').inert }))
      check(result.returnState.focusStory === 'shaft-p001835', 'Return did not restore trigger focus')
      check(result.returnState.scrollX === before.scrollX && result.returnState.scrollY === before.scrollY && result.returnState.overflow === before.overflow && result.returnState.rootInert === false, 'Return did not restore page state')
      await trigger.click()
      await dialog.waitFor({ state: 'visible' })
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      check(await trigger.evaluate(node => document.activeElement === node), 'Escape did not restore trigger focus')
      result.escapeRestoredFocus = true
      result.inspectionRequests = result.glbRequests.filter(request => /manufacturing-core|knurling-tool|\/inspection\/.*\.glb/i.test(request.url))
      result.narrativeRequests = result.glbRequests.filter(request => !result.inspectionRequests.includes(request))
      check(result.inspectionRequests.length === 0, `Static inspection requested CAD/tools: ${JSON.stringify(result.inspectionRequests)}`)
      if (config.poster) check(result.glbRequests.length === 0, `Poster requested CAD/tools: ${JSON.stringify(result.glbRequests)}`)
      check(result.errors.length === 0, `Browser errors: ${result.errors.join('; ')}`)
      result.pass = true
    } catch (error) { result.failures.push(error.message); report.failures.push(`${config.name}: ${error.message}`); result.pass = false }
    await context.close()
  }
} finally {
  await browser.close()
  report.completed = new Date().toISOString()
  await fs.writeFile(path.join(out, 'browser-report.json'), JSON.stringify(report, null, 2))
}
console.log(JSON.stringify({ url, cases: report.cases.map(result => ({ name: result.name, pass: result.pass, images: result.images?.length, glbRequests: result.glbRequests.length, failures: result.failures })), failures: report.failures }, null, 2))
if (report.failures.length) process.exitCode = 1
