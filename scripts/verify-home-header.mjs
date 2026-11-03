import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const option = (name, fallback) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const url = option('url', 'http://127.0.0.1:4187/home/')
const out = resolve(option('out', 'output/playwright/home-header'))
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
const errors = []
const desktop = { viewport: { width: 1440, height: 900 } }
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }
const headerState = () => {
  const h = document.querySelector('.home-header')
  const rect = (selector) => h.querySelector(selector).getBoundingClientRect().toJSON()
  const name = rect('.home-name'), nav = rect('.home-nav-toggle'), theme = rect('.home-theme-toggle')
  const near = (a, b) => Math.abs(a - b) < 1
  return {
    y: scrollY, compact: h.hasAttribute('data-compact'), name, nav, theme,
    corners: near(name.left, 8) && near(name.top, 8) && near(nav.top, 8) &&
      near(nav.right, document.documentElement.clientWidth - 96) && near(theme.top, 8) && near(theme.right, document.documentElement.clientWidth - 8),
    hero: document.querySelector('.home-hero').getBoundingClientRect().top + scrollY,
  }
}
const ready = async (page, href = url) => {
  await page.goto(href)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.home-name[data-ready]').waitFor()
  await page.waitForTimeout(80)
}
const settled = async (page) => {
  await page.waitForFunction(() => {
    const h = document.querySelector('.home-header')
    return h.hasAttribute('data-compact') && !h.getAnimations({ subtree: true }).some((a) => a instanceof CSSTransition && a.playState === 'running')
  })
  await page.waitForTimeout(60)
}
const compact = async (page) => {
  await ready(page)
  await page.keyboard.press('PageDown')
  await settled(page)
}
const menu = (page) => page.getByRole('button', { name: 'Sections menu' })
const expectMenu = async (page, expanded) => {
  await page.waitForFunction((value) => document.querySelector('.home-nav-toggle')?.getAttribute('aria-expanded') === String(value), expanded, { timeout: 3000 })
}
const test = async (name, options, run) => {
  const context = await browser.newContext(options)
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`))
  try {
    const details = await run(page, context)
    results.push({ name, status: 'PASS', ...details })
    console.log(`PASS ${name}`)
  } catch (error) {
    results.push({ name, status: 'FAIL', error: error.message, stack: error.stack })
    await page.screenshot({ path: resolve(out, `${name.replace(/\W+/g, '-')}-FAIL.png`) }).catch(() => {})
    console.log(`FAIL ${name}: ${error.message}`)
  } finally { await context.close() }
}

try {
  await test('WCS hover travel exit and reentry', desktop, async (page) => {
    await compact(page)
    await page.mouse.move(20, 200)
    await menu(page).hover()
    await expectMenu(page, true)
    for (const name of ['Work', 'Plus', 'Contact']) {
      const link = page.getByRole('link', { name, exact: name !== 'Plus' })
      await link.waitFor({ state: 'visible' })
      const box = await link.boundingBox()
      assert(box, `${name} must have a pointer target`)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 })
      assert.equal(await menu(page).getAttribute('aria-expanded'), 'true', `menu closed travelling to ${name}`)
      assert(await link.evaluate((el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return hit === el || el.contains(hit) }), `${name} must receive pointer input`)
    }
    await page.mouse.move(20, 200, { steps: 20 })
    await expectMenu(page, false)
    await menu(page).hover()
    await expectMenu(page, true)
    await page.getByRole('link', { name: 'Contact', exact: true }).click()
    await page.waitForFunction(() => location.hash === '#contact')
    await expectMenu(page, false)
  })

  await test('WCS keyboard toggle dismissal and focus', desktop, async (page) => {
    await compact(page)
    await page.mouse.move(20, 200)
    await menu(page).focus()
    await page.keyboard.press('Enter')
    await expectMenu(page, true)
    const work = page.getByRole('link', { name: 'Work', exact: true })
    await work.evaluate((el) => new Promise((resolve) => requestAnimationFrame(resolve)))
    assert(await work.evaluate((el) => el === document.activeElement && !el.closest('[inert]')), 'keyboard opening must focus the first link')
    await page.keyboard.press('Escape')
    await expectMenu(page, false)
    assert(await menu(page).evaluate((el) => el === document.activeElement), 'Escape must restore focus to WCS')
    await page.keyboard.press('Space')
    await expectMenu(page, true)
    await page.keyboard.press('Escape')
    await expectMenu(page, false)
  })

  await test('WCS touch toggle dismissal and navigation', phone, async (page) => {
    await compact(page)
    await menu(page).tap()
    await expectMenu(page, true)
    await menu(page).tap()
    await expectMenu(page, false)
    await menu(page).tap()
    await expectMenu(page, true)
    await page.getByRole('link', { name: 'Work', exact: true }).tap()
    await page.waitForFunction(() => location.hash === '#work')
    await expectMenu(page, false)
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('[inert]')), false)
  })

  for (const [label, options, reduced] of [
    ['desktop', desktop, false], ['mobile', phone, false],
    ['desktop-reduced', { ...desktop, reducedMotion: 'reduce' }, true],
    ['mobile-reduced', { ...phone, reducedMotion: 'reduce' }, true],
  ]) {
    await test(`torque image coverage ${label}`, options, async (page) => {
      await ready(page)
      const images = page.locator('img[src*="/home/stacks/torque-wrench/"]')
      assert.equal(await images.count(), 4, 'all four torque images must be present')
      assert.deepEqual((await images.evaluateAll((els) => els.map((el) => new URL(el.currentSrc || el.src).pathname))).sort(),
        ['03.webp', '04.webp', '05.webp', '06.webp'].map((name) => `/home/stacks/torque-wrench/${name}`))
      const measurements = []
      const problems = []
      for (let i = 0; i < 4; i++) {
        const image = images.nth(i)
        if (reduced) {
          await image.scrollIntoViewIfNeeded()
        } else {
          await image.evaluate((el, progress) => {
            const section = el.closest('.home-stack')
            const top = section.getBoundingClientRect().top + scrollY
            window.scrollTo(0, top + (section.offsetHeight - innerHeight) * progress)
          }, [0.04, 0.34, 0.62, 0.90][i])
        }
        await page.waitForTimeout(350)
        await image.evaluate((el) => el.decode())
        const measure = await image.evaluate((el) => {
          const card = el.closest('.home-stack-card, .home-stack-frame')
          const style = getComputedStyle(el), rect = el.getBoundingClientRect(), frame = card.getBoundingClientRect()
          const caption = card.querySelector('.home-stack-caption')
          const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height * 0.35)
          const width = el.clientWidth, height = el.clientHeight
          const scale = style.objectFit === 'cover' ? Math.max(width / el.naturalWidth, height / el.naturalHeight)
            : style.objectFit === 'contain' ? Math.min(width / el.naturalWidth, height / el.naturalHeight) : 0
          const position = style.objectPosition.split(' ').map(parseFloat)
          const drawnWidth = el.naturalWidth * scale * rect.width / width, drawnHeight = el.naturalHeight * scale * rect.height / height
          const left = rect.left + (rect.width - drawnWidth) * (position[0] / 100)
          const top = rect.top + (rect.height - drawnHeight) * ((position[1] ?? position[0]) / 100)
          return { src: el.currentSrc, fit: style.objectFit, padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
            image: rect.toJSON(), frame: frame.toJSON(), natural: [el.naturalWidth, el.naturalHeight],
            drawn: { left, top, right: left + drawnWidth, bottom: top + drawnHeight },
            visible: getComputedStyle(card).visibility === 'visible' && Number(getComputedStyle(card).opacity) > 0.9,
            front: !!hit && card.contains(hit), caption: !!caption && getComputedStyle(caption).visibility === 'visible' }
        })
        measurements.push(measure)
        await page.screenshot({ path: resolve(out, `torque-${label}-${i + 1}.png`) })
        if (!measure.visible || !measure.front) problems.push(`image ${i + 1} is not visibly in front`)
        if (!measure.caption) problems.push(`image ${i + 1} caption is not visible`)
        if (!measure.natural.every((n) => n > 0)) problems.push(`image ${i + 1} did not load`)
        if (!measure.padding.every((n) => parseFloat(n) === 0)) problems.push(`image ${i + 1} has padding`)
        const tolerance = 2
        if (!(measure.drawn.left <= measure.frame.left + tolerance && measure.drawn.top <= measure.frame.top + tolerance &&
          measure.drawn.right >= measure.frame.right - tolerance && measure.drawn.bottom >= measure.frame.bottom - tolerance)) problems.push(`image ${i + 1} does not cover its frame`)
      }
      await writeFile(resolve(out, `torque-${label}-measurements.json`), JSON.stringify({ measurements, problems }, null, 2))
      assert.equal(problems.length, 0, problems.join('; '))
      return { measurements, note: 'Screenshots require visual inspection for margins embedded in source images and caption legibility.' }
    })
  }

  await test('cold font and immediate first scroll', desktop, async (page) => {
    await page.route('**/fonts/home/Archivo.woff2', async (route) => {
      await new Promise((done) => setTimeout(done, 650))
      await route.continue()
    })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.locator('.home-header').waitFor()
    await page.mouse.wheel(0, 100)
    await page.waitForTimeout(160)
    assert.equal(await page.evaluate(() => scrollY), 0)
    await settled(page)
    assert((await page.evaluate(headerState)).corners)
    assert.equal(await page.locator('.home-letter-h').evaluate((el) => getComputedStyle(el).fillOpacity), '1')
    await page.mouse.wheel(0, 100)
    await page.waitForFunction(() => scrollY > 1)
  })

  await test('late font refit and newer anchor intent', desktop, async (page) => {
    await page.route('**/fonts/home/Archivo.woff2', async (route) => {
      await new Promise((done) => setTimeout(done, 2200))
      await route.continue()
    })
    await page.goto(`${url.split('#')[0]}#work`, { waitUntil: 'domcontentloaded' })
    await page.locator('.home-header').waitFor()
    await page.getByRole('link', { name: 'Contact', exact: true }).click()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(650)
    const state = await page.evaluate(() => {
      const original = document.querySelector('.home-name-svg > text')
      const bounds = original.getBBox()
      const view = document.querySelector('.home-name-svg').viewBox.baseVal
      return { hash: location.hash, target: document.querySelector('#contact').getBoundingClientRect().top, width: bounds.width, viewWidth: view.width }
    })
    assert.equal(state.hash, '#contact')
    assert(state.target >= 0 && state.target < 900, 'late restoration overrode the newer Contact navigation')
    assert(Math.abs(state.width - state.viewWidth) < 0.11, 'actual font must replace fallback SVG metrics')
  })

  await test('desktop continuous wheel and fade', desktop, async (page) => {
    await ready(page)
    const hero = (await page.evaluate(headerState)).hero
    await page.evaluate((state) => {
      const read = new Function(`return (${state})`)()
      window.headerFrames = []
      window.headerRecording = true
      const tick = () => {
        if (!window.headerRecording) return
        window.headerFrames.push({ time: performance.now(), ...read() })
        requestAnimationFrame(tick)
      }
      tick()
    }, headerState.toString())
    for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 24); await page.waitForTimeout(45) }
    const frames = await page.evaluate(() => { window.headerRecording = false; return window.headerFrames })
    const firstCompact = frames.find((f) => f.compact)
    const firstScroll = frames.find((f) => f.y > 1)
    assert(firstCompact && firstScroll, 'wheel must collapse then scroll')
    assert(firstScroll.time - firstCompact.time >= 400, 'page moved before the 450ms sequence completed')
    assert(firstScroll.time - firstCompact.time < 1000, 'collapse should finish promptly')
    assert(frames.filter((f) => f.y > 1).every((f) => f.corners), 'scroll released before all three controls reached corners')
    assert(frames.every((f) => Math.abs(f.hero - hero) < 1), 'header collapse changed page layout')
    const veil = await page.evaluate(() => {
      const h = document.querySelector('.home'), veil = getComputedStyle(h, '::after'), blocker = getComputedStyle(h, '::before')
      return { clearance: parseFloat(getComputedStyle(h).getPropertyValue('--header-clearance')), height: parseFloat(veil.height), background: veil.backgroundImage, blocker: blocker.pointerEvents }
    })
    const end = await page.evaluate(headerState)
    assert(veil.clearance > Math.max(end.name.bottom, end.nav.bottom, end.theme.bottom), 'opaque fade must clear the icons')
    assert(veil.height > veil.clearance && veil.background.includes('gradient') && veil.blocker === 'auto')
    await writeFile(resolve(out, 'wheel-frames.json'), JSON.stringify(frames))
    await page.screenshot({ path: resolve(out, 'desktop-compact.png') })
    await page.keyboard.press('Home')
    await page.waitForFunction(() => scrollY === 0 && !document.querySelector('.home-header').hasAttribute('data-compact'))
    await page.waitForTimeout(500)
    await page.mouse.wheel(100, 0)
    assert.equal((await page.evaluate(headerState)).compact, false, 'horizontal gestures must not close the header')
    return { releaseMs: Math.round(firstScroll.time - firstCompact.time), frameCount: frames.length, veil }
  })

  await test('reverse resize navigation and focus', desktop, async (page) => {
    await ready(page)
    await page.getByRole('link', { name: 'Work', exact: true }).focus()
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(100)
    await page.mouse.wheel(0, -60)
    await page.waitForFunction(() => !document.querySelector('.home-header').hasAttribute('data-compact'))
    await page.waitForTimeout(500)
    assert.equal(await page.evaluate(() => scrollY), 0)
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Mark Hintz, back to top')
    await page.getByRole('link', { name: 'Work', exact: true }).focus()
    await page.keyboard.press('PageDown')
    await settled(page)
    assert.equal(await page.locator('.home-nav-toggle').evaluate((el) => el === document.activeElement), true)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForFunction(() => Math.abs(document.querySelector('.home-theme-toggle').getBoundingClientRect().top - 8) < 1)
    await settled(page)
    assert((await page.evaluate(headerState)).corners, 'compact controls must survive resize')
    await page.getByRole('button', { name: 'Sections menu' }).press('Enter')
    await page.getByRole('link', { name: 'Plus', exact: false }).focus()
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('button', { name: 'Sections menu' }).getAttribute('aria-expanded'), 'false')
    assert(await page.locator('.home-nav-toggle').evaluate((el) => el === document.activeElement))
    await page.getByRole('button', { name: 'Dark theme' }).press('Space')
    assert.equal(await page.getByRole('button', { name: 'Dark theme' }).getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'Sections menu' }).press('Enter')
    await page.getByRole('link', { name: 'Contact', exact: true }).click()
    await page.waitForFunction(() => location.hash === '#contact' && scrollY > 100)
    assert.equal(await page.getByRole('button', { name: 'Sections menu' }).getAttribute('aria-expanded'), 'false')
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('[inert]')), false)
    await page.getByRole('link', { name: 'Mark Hintz, back to top' }).click()
    await page.waitForFunction(() => scrollY === 0 && !document.querySelector('.home-header').hasAttribute('data-compact'))
    await page.waitForTimeout(500)
    const reverseTarget = await page.evaluate(() => {
      const work = document.querySelector('.home-nav a').getBoundingClientRect()
      const icon = document.querySelector('.home-nav-toggle').getBoundingClientRect()
      return { dx: Math.abs(work.left + work.width / 2 - icon.left - icon.width / 2), dy: Math.abs(work.top + work.height / 2 - icon.top - icon.height / 2) }
    })
    assert(reverseTarget.dx < 1 && reverseTarget.dy < 1, 'WCS reverse must return to the current Work location after resize')
    await page.screenshot({ path: resolve(out, 'mobile-expanded-dark.png') })
  })

  for (const key of ['ArrowDown', 'PageDown', 'Space', 'End']) {
    await test(`keyboard ${key}`, desktop, async (page) => {
      await ready(page)
      await page.keyboard.press(key)
      await page.waitForTimeout(180)
      assert.equal(await page.evaluate(() => scrollY), 0, 'first key input must hold the page')
      await settled(page)
      await page.keyboard.press(key)
      await page.waitForFunction(() => scrollY > 1)
      await page.keyboard.press('Home')
      await page.waitForFunction(() => scrollY === 0 && !document.querySelector('.home-header').hasAttribute('data-compact'))
    })
  }

  await test('mobile continuous touch and next native swipe', phone, async (page, context) => {
    await ready(page)
    const cdp = await context.newCDPSession(page)
    const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: y === undefined ? [] : [{ x: 200, y }] })
    await touch('touchStart', 650)
    await touch('touchMove', 600)
    await page.waitForTimeout(180)
    assert.equal(await page.evaluate(() => scrollY), 0)
    await settled(page)
    assert((await page.evaluate(headerState)).corners)
    await touch('touchMove', 500)
    await page.waitForFunction(() => scrollY >= 90)
    await touch('touchEnd')
    const before = await page.evaluate(() => scrollY)
    await touch('touchStart', 650)
    await touch('touchMove', 560)
    await touch('touchMove', 470)
    await touch('touchEnd')
    await page.waitForFunction((y) => scrollY > y + 30, before)
    await page.screenshot({ path: resolve(out, 'mobile-compact.png') })
  })

  for (const hash of ['#work', '#contact']) {
    await test(`direct entry ${hash}`, phone, async (page) => {
      await ready(page, `${url.split('#')[0]}${hash}`)
      await page.waitForFunction(() => scrollY > 1 && document.querySelector('.home-header').hasAttribute('data-compact'))
      await page.reload()
      await page.waitForFunction(() => scrollY > 1 && document.querySelector('.home-header').hasAttribute('data-compact'))
      await page.getByRole('link', { name: 'Mark Hintz, back to top' }).click()
      await page.waitForFunction(() => scrollY === 0 && !document.querySelector('.home-header').hasAttribute('data-compact'))
    })
  }

  await test('reduced motion and live preference change', { ...phone, reducedMotion: 'reduce' }, async (page) => {
    await ready(page)
    await page.keyboard.press('PageDown')
    await page.waitForFunction(() => scrollY > 1)
    assert.equal(await page.locator('.home-header').evaluate((el) => el.getAnimations({ subtree: true }).length), 0)
    await page.keyboard.press('Home')
    await page.waitForFunction(() => scrollY === 0)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.mouse.wheel(0, 80)
    await page.waitForTimeout(100)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.mouse.wheel(0, 80)
    await page.waitForFunction(() => scrollY > 1)
    await page.screenshot({ path: resolve(out, 'mobile-reduced.png') })
  })

  await test('native focus and history restoration', desktop, async (page) => {
    await ready(page)
    await page.locator('.home-links a').first().focus()
    await page.waitForFunction(() => scrollY > 100)
    await settled(page)
    const focused = await page.evaluate(() => document.activeElement.getBoundingClientRect().toJSON())
    assert(focused.top >= 180 && focused.bottom <= 900, 'keyboard focus must remain visible below the veil')
    const before = await page.evaluate(() => scrollY)
    await page.goto(`${url}?history=1`)
    await page.goBack()
    await page.waitForFunction(() => scrollY > 100)
    assert(Math.abs(await page.evaluate(() => scrollY) - before) < 3)
  })
} finally { await browser.close() }

const summary = { url, results, browserErrors: errors, passed: results.filter((r) => r.status === 'PASS').length, failed: results.filter((r) => r.status === 'FAIL').length }
await writeFile(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(`${summary.passed}/${results.length} PASS; ${errors.length} page errors; ${out}`)
if (summary.failed || errors.length) process.exitCode = 1
