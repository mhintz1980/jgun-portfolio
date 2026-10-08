import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const output = path.dirname(fileURLToPath(import.meta.url))
const base = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) ?? 'http://localhost:5201'
const harness = '/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shell/harness.html'
const report = { scope: 'Real DOM shell in isolation; no inspection canvas/runtime', url: base + harness, started: new Date().toISOString(), cases: [], failures: [] }
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] })
function check(condition, message) { if (!condition) throw new Error(message) }
try {
  for (const config of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'narrow', width: 390, height: 844 }, { name: 'reduced-narrow', width: 390, height: 844, reduced: true }, { name: 'poster-narrow', width: 390, height: 844, poster: true }]) {
    const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, reducedMotion: config.reduced ? 'reduce' : 'no-preference' })
    const page = await context.newPage(), result = { name: config.name, errors: [], cadRequests: [], assertions: [], controls: [] }
    report.cases.push(result)
    page.on('pageerror', error => result.errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()) })
    page.on('request', request => { if (/\.glb(?:\?|$)/.test(request.url())) result.cadRequests.push(request.url()) })
    const pass = message => result.assertions.push(message)
    try {
      await page.goto(report.url)
      await page.waitForFunction(() => window.shellProof)
      check((await page.evaluate(() => window.shellProof.getQuality().tier)) === 'full', 'Harness requires working WebGL detection, even though it mounts no scene')
      if (config.poster) await page.evaluate(() => window.shellProof.forcePoster())
      await page.evaluate(() => scrollTo(0, 320))
      const trigger = page.getByRole('button', { name: 'Inspect the finish' })
      await trigger.click()
      const dialog = page.getByRole('dialog'), returnButton = page.getByRole('button', { name: 'Return to narrative' })
      await dialog.waitFor()
      check(await returnButton.evaluate(node => document.activeElement === node), 'Entry did not focus Return')
      check(await page.evaluate(() => document.getElementById('root').inert), 'Narrative is not inert')
      await page.evaluate(() => document.getElementById('outside-focus').focus())
      check(await returnButton.evaluate(node => document.activeElement === node), 'Focus escaped the dialog')
      await page.evaluate(() => { const node = document.createElement('button'); node.id = 'late-outside'; document.body.appendChild(node) })
      await page.waitForFunction(() => document.getElementById('late-outside').inert)
      pass('Entry/focus guard and dynamic outside inert isolation')
      if (config.reduced || config.poster) {
        check(await dialog.locator('svg').count() === 1, 'Ring static fallback missing')
        check(await dialog.locator('input').count() === 0, 'Static fallback exposes playhead')
      } else {
        check(await returnButton.isEnabled(), 'Return unavailable during loading')
        check(await page.getByLabel('Seek', { exact: true }).isDisabled(), 'Seek available before readiness')
        await page.evaluate(() => window.shellProof.status('compiling'))
        check(await returnButton.isEnabled(), 'Return unavailable during compile')
        await page.evaluate(() => window.shellProof.status('ready'))
        await page.getByLabel('Seek', { exact: true }).focus(); await page.keyboard.press('End')
        check(await page.evaluate(() => window.shellProof.inspection.time === 12 && !window.shellProof.inspection.playing), 'Seek did not hold absolute end')
        await page.getByRole('button', { name: 'Replay', exact: true }).click()
        check(await page.evaluate(() => window.shellProof.inspection.time === 0 && window.shellProof.inspection.playing), 'Replay did not reset/play')
        await page.getByRole('button', { name: 'Pause', exact: true }).click()
        await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
        check(await page.evaluate(() => window.shellProof.inspection.suspend === 'hidden' && !window.shellProof.inspection.userPlaying), 'Hide lost manual pause')
        await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')) })
        check(await page.evaluate(() => !window.shellProof.inspection.playing), 'Hide/show resumed manual pause')
        await page.getByRole('button', { name: 'Replay', exact: true }).focus(); await page.keyboard.press('Tab')
        check(await returnButton.evaluate(node => document.activeElement === node), 'Tab did not wrap to Return')
        await page.keyboard.press('Shift+Tab')
        check(await page.getByRole('button', { name: 'Replay', exact: true }).evaluate(node => document.activeElement === node), 'Shift Tab did not wrap to Replay')
        const epoch = await page.evaluate(() => window.shellProof.inspection.epoch)
        await page.evaluate(() => window.shellProof.fail('denied CAD fetch'))
        check(await returnButton.isEnabled(), 'Return unavailable on error')
        await page.getByRole('button', { name: 'Try again' }).click()
        check(await page.evaluate(epoch => window.shellProof.inspection.epoch === epoch + 1 && window.shellProof.inspection.status === 'loading', epoch), 'Retry did not replace failed epoch')
        await page.evaluate(() => window.shellProof.fail('second failure'))
        pass('Loading/compiling/error Return, absolute seek/replay, pause/hide, Tab wrapping and epoch retry')
      }
      result.controls = await dialog.locator('button,input').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { label: node.textContent || node.getAttribute('id'), width: rect.width, height: rect.height, inside: rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight } }))
      check(result.controls.every(control => control.width >= 44 && control.height >= 44 && control.inside), 'Control is smaller than 44px or outside viewport')
      const overlap = await dialog.evaluate(node => {
        const header = node.querySelector('header').getBoundingClientRect(), copy = node.querySelector('.ring-inspection-copy').getBoundingClientRect(), footer = node.querySelector('footer').getBoundingClientRect()
        return header.bottom > copy.top || copy.bottom > footer.top
      })
      check(!overlap, 'Header/copy/footer overlap')
      await page.screenshot({ path: path.join(output, `${config.name}.png`) })
      pass('44px controls and non-overlapping viewport layout')
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' })
      check(await page.evaluate(() => !document.getElementById('root').inert && document.getElementById('already-inert').inert && !document.getElementById('late-outside').inert && !document.body.classList.contains('ring-inspection-open') && scrollY === 320), 'Return failed inert/scroll restoration')
      check(await trigger.evaluate(node => document.activeElement === node), 'Original trigger focus not restored')
      check(await trigger.evaluate(node => node.tabIndex === 0), 'Return made the trigger untabbable')
      pass('Escape restores scroll, inert values and trigger focus')
      if (!config.reduced && !config.poster) {
        await page.evaluate(() => window.shellProof.openRemovedTrigger())
        await dialog.waitFor(); await returnButton.click(); await dialog.waitFor({ state: 'detached' })
        result.removedTriggerFocus = await page.evaluate(() => ({ element: document.activeElement?.outerHTML, inert: document.getElementById('root').inert, progress: window.shellProof.inspection.entry }))
        check(await page.evaluate(() => document.activeElement === document.querySelector('[data-chapter="0"]')), 'Removed trigger fallback did not focus JGun chapter')
        pass('Removed trigger recovers focus at JGun chapter')
      }
      check(result.cadRequests.length === 0, 'Isolated DOM shell fetched CAD')
      check(result.errors.length === 0, `Browser errors: ${result.errors.join('; ')}`)
    } catch (error) { result.failure = String(error); report.failures.push(`${config.name}: ${error}`) }
    finally { await context.close() }
  }
} finally {
  await browser.close()
  await fs.writeFile(path.join(output, 'dom-report.json'), JSON.stringify(report, null, 2) + '\n')
}
console.log(JSON.stringify({ cases: report.cases.map(item => ({ name: item.name, assertions: item.assertions, failure: item.failure })), failures: report.failures }, null, 2))
if (report.failures.length) process.exitCode = 1
