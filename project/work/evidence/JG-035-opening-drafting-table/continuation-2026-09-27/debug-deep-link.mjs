import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
await context.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    return String(type).includes('webgl') ? null : original.call(this, type, args)
  }
})
const page = await context.newPage()
page.on('console', (m) => console.log('[console]', m.text()))
await page.goto('http://localhost:4173/?station=2', { waitUntil: 'commit' })
for (const delay of [50, 200, 500, 1000, 2000, 3000]) {
  await page.waitForTimeout(delay)
  const s = await page.evaluate(() => ({
    readyState: document.readyState,
    scrollHeight: document.documentElement.scrollHeight,
    scrollY: window.scrollY,
    hasMain: !!document.querySelector('main'),
    sections: document.querySelectorAll('section').length,
  }))
  console.log(JSON.stringify(s))
}
await browser.close()
