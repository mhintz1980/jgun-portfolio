import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
import { launchBrowser } from '../../../../../scripts/lib/browser-launch.mjs'
const [base, out] = process.argv.slice(2)
if (!base || !out) throw new Error('Require base URL and output path')
const report = { base, at: new Date().toISOString(), errors: [] }
const browser = await launchBrowser(chromium)
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  page.on('pageerror', error => report.errors.push(String(error)))
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForURL(url => url.pathname === '/home/', { timeout: 20000 })
  await page.getByText(/Work in progress/i).first().waitFor({ state: 'visible' })
  report.finalUrl = page.url()
  report.result = report.errors.length ? 'FAIL' : 'PASS'
} catch (error) {
  report.errors.push(String(error))
  report.result = 'FAIL'
} finally {
  await browser.close()
  writeFileSync(out, JSON.stringify(report, null, 2) + '\n')
}
console.log(JSON.stringify(report))
if (report.result !== 'PASS') process.exitCode = 1
