import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
const option = (key, fallback) => process.argv.find((a) => a.startsWith(`--${key}=`))?.slice(key.length + 3) || fallback
const base = option('url', 'http://127.0.0.1:4192')
const out = path.resolve(option('out', 'output/playwright/home-export'))
await fs.mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
for (const [name, width, height, reduced] of [
  ['desktop', 1440, 900, false],
  ['phone', 390, 844, false],
  ['small-phone', 320, 700, true],
  ['tablet', 820, 900, false],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })
  page.on('request', (r) => {
    if (/fonts\.google|fonts\.gstatic|\.glb(?:\?|$)|cdn\.jsdelivr/.test(r.url()))
      errors.push('Unwanted request: ' + r.url())
  })
  const result = { name, width, height, reduced, errors, checks: [] }
  try {
    await page.goto(base + '/home/')
    await page.locator('[data-home-design][data-ready]').waitFor()
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.locator('.design-gallery').count(), 4)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      'page overflows horizontally',
    )
    await page.screenshot({ path: path.join(out, name + '-hero.png') })
    const geometry = await page.evaluate(() => ({
      nameFont: getComputedStyle(document.querySelector('.design-name')).fontSize,
      hero: document.querySelector('.design-hero').getBoundingClientRect().height,
      work: document.querySelector('.design-work').getBoundingClientRect().height,
      fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
      mask: getComputedStyle(document.querySelector('.design-drawings>div')).maskImage,
    }))
    if (name === 'desktop') {
      assert.equal(geometry.nameFont, '65px')
      assert.equal(geometry.hero, 600)
      assert.equal(geometry.work, 5000)
      assert(geometry.mask.includes('url('))
    }
    result.checks.push({ geometry })
    await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click()
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light')
    await page.screenshot({ path: path.join(out, name + '-light.png') })
    await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click()
    for (let n = 0; n < 4; n++) {
      const gallery = page.locator('.design-gallery').nth(n)
      await gallery.scrollIntoViewIfNeeded()
      await page.waitForTimeout(80)
      const caption = gallery.locator('.design-caption')
      const box = await caption.boundingBox()
      assert(box && box.x >= -1 && box.x + box.width <= width + 1, 'caption overflows viewport')
      await page.screenshot({ path: path.join(out, `${name}-gallery-${n}.png`) })
      await gallery.getByRole('button', { name: 'Next image', exact: true }).click()
      await page.waitForTimeout(450)
      assert.match(await caption.locator('p').first().innerText(), /^02 /)
      const focused = gallery.locator('.design-card[tabindex="0"]')
      await focused.focus()
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(450)
      assert.match(await caption.locator('p').first().innerText(), /^03 /)
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-current')), 'true')
      await page.keyboard.press('End')
      await page.waitForTimeout(450)
      assert.equal(
        await gallery.getByRole('button', { name: 'Next image', exact: true }).getAttribute('aria-disabled'),
        'true',
      )
      await page.keyboard.press('Home')
      await page.waitForTimeout(450)
      assert.match(await caption.locator('p').first().innerText(), /^01 /)
      result.checks.push({ gallery: n, controls: 'PASS' })
    }
    await page.locator('.design-contact').scrollIntoViewIfNeeded()
    const pull = page.getByRole('button', { name: 'Pull the thread', exact: true })
    await pull.click()
    assert.equal(await pull.getAttribute('aria-pressed'), 'true')
    assert.equal(errors.length, 0, errors.join('\n'))
    result.result = 'PASS'
  } catch (e) {
    result.result = 'FAIL'
    result.failure = e.message
    await page.screenshot({ path: path.join(out, name + '-FAIL.png') }).catch(() => {})
  }
  results.push(result)
  console.log(`${name}: ${result.result}${result.failure ? ' ' + result.failure : ''}`)
  await context.close()
}
await browser.close()
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify({ base, results }, null, 2))
if (results.some((r) => r.result !== 'PASS')) process.exitCode = 1
