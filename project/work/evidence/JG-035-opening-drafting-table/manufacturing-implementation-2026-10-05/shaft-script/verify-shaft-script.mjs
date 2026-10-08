/**
 * Shaft story script verifier (leaf: shaft-script).
 * Spec: project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shaft-script-spec.md
 *
 * Playwright (chromium channel chrome) against the repo-root Vite dev server.
 * Mounts ShaftStoryLayer standalone via harness.html, captures desktop 1440x900 and
 * narrow 390x844 screenshots at the authored checkpoints, measures computed contrast
 * ratios and bounding boxes, counts aria-live status updates across a 0..43 sweep
 * against the sampler's discrete changes, and asserts zero console errors.
 * Owns: this script, report.json and the captures inside this folder.
 */
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..', '..', '..', '..', '..', '..')
if (!(await fs.stat(path.join(rootDir, 'package.json')).then(() => true, () => false))) throw new Error('repo root not found: ' + rootDir)
const urlArg = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) || 'http://localhost:5199'
const harnessUrl = urlArg + '/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shaft-script/harness.html'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
]
const CASES = [
  { t: 15.8, card: 'AISI 4140 (40-45 HRC)', stamp: false, attribution: true, stress: true, recap: false },
  { t: 17.5, card: 'AISI 4140 (40-45 HRC)', stamp: true, attribution: true, stress: true, recap: false },
  { t: 21.0, card: 'C300 (56-58 HRC)', stamp: false, attribution: true, stress: true, recap: false },
  { t: 33.5, card: 'AISI 4340 (H.T. 48-50 HRC)', stamp: false, attribution: false, stress: true, recap: false },
  { t: 12.0, card: null, stamp: false, attribution: false, stress: false, recap: true },
]
const RECAP_TEXT = 'Remaining teeth — time compressed'

const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
  return condition
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: VIEWPORTS[0] })
const consoleErrors = []
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', error => consoleErrors.push(String(error)))
await page.goto(harnessUrl, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => Boolean(window.__shaftHarness) && document.querySelector('.shaft-story-layer'))

const raf2 = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const collectDom = () => page.evaluate(() => {
  const parseColor = value => {
    const match = value.match(/rgba?\(([^)]+)\)/)
    if (!match) return null
    const [r, g, b] = match[1].split(',').map(part => Number(part.trim()))
    return [r, g, b]
  }
  const visible = el => {
    if (!el) return false
    const rect = el.getBoundingClientRect()
    if (rect.width < 2 || rect.height < 2) return false
    let node = el
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden') return false
      if (Number(style.opacity) < 0.05) return false
      node = node.parentElement
    }
    return true
  }
  const backgroundOf = el => {
    let node = el
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).backgroundColor
      const match = bg.match(/rgba?\(([^)]+)\)/)
      if (match) {
        const parts = match[1].split(',').map(part => Number(part.trim()))
        if ((parts[3] ?? 1) >= 0.999) return [parts[0], parts[1], parts[2]]
      }
      node = node.parentElement
    }
    return null
  }
  const luminance = rgb => {
    const channel = v => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
  }
  const contrast = (fg, bg) => {
    const a = luminance(fg), b = luminance(bg)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }
  const measure = el => {
    if (!visible(el)) return null
    const fg = parseColor(getComputedStyle(el).color)
    const bg = backgroundOf(el)
    if (!fg || !bg) return { text: el.textContent.trim(), error: 'unparseable colors' }
    const rect = el.getBoundingClientRect()
    return {
      text: el.textContent.trim(),
      color: fg,
      background: bg,
      contrast: contrast(fg, bg),
      box: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
    }
  }
  const wrapper = document.querySelector('[data-shaft-card] .shaft-card')
  const status = document.querySelector('[data-shaft-status]')
  const transcript = document.querySelector('[data-shaft-transcript]')
  return {
    card: measure(document.querySelector('[data-shaft-card] .shaft-card-text')),
    stamp: measure(document.querySelector('[data-shaft-card] .shaft-stamp')),
    attribution: measure(document.querySelector('[data-shaft-attribution]')),
    recap: measure(document.querySelector('[data-shaft-recap]')),
    stress: measure(document.querySelector('[data-shaft-stress]')),
    cardWrapperOpacity: wrapper ? getComputedStyle(wrapper).opacity : null,
    statusRole: status ? status.getAttribute('role') : null,
    ariaLive: status ? status.getAttribute('aria-live') : null,
    transcriptText: transcript ? transcript.textContent : null,
    overflow: {
      scrollWidth: document.scrollingElement.scrollWidth,
      scrollHeight: document.scrollingElement.scrollHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    },
  }
})

const overlapArea = (a, b) => {
  const left = Math.max(a.left, b.left)
  const right = Math.min(a.right, b.right)
  const top = Math.max(a.top, b.top)
  const bottom = Math.min(a.bottom, b.bottom)
  return Math.max(0, right - left) * Math.max(0, bottom - top)
}

const caseResults = []
for (const viewport of VIEWPORTS) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  for (const testCase of CASES) {
    await page.evaluate(time => window.__shaftHarness.setTime(time), testCase.t)
    await raf2()
    const dom = await collectDom()
    const entry = { viewport: viewport.name, viewportSize: viewport.width + 'x' + viewport.height, t: testCase.t, expectations: testCase, dom: { ...dom, transcriptText: undefined }, screenshot: null }
    check(dom.card !== null === (testCase.card !== null), viewport.name + ' t=' + testCase.t + ': card presence ' + (dom.card ? 'present' : 'absent') + ', expected ' + (testCase.card || 'none'))
    if (testCase.card !== null && dom.card) {
      check(dom.card.text === testCase.card, viewport.name + ' t=' + testCase.t + ': card text "' + dom.card.text + '" !== "' + testCase.card + '"')
      check(Number(dom.cardWrapperOpacity) >= 0.9, viewport.name + ' t=' + testCase.t + ': card wrapper opacity ' + dom.cardWrapperOpacity + ' < 0.9')
      check(dom.card.contrast >= 4.5, viewport.name + ' t=' + testCase.t + ': card contrast ' + dom.card.contrast.toFixed(2) + ' < 4.5')
    }
    check(dom.stamp !== null === testCase.stamp, viewport.name + ' t=' + testCase.t + ': stamp presence ' + (dom.stamp ? 'present' : 'absent') + ', expected ' + testCase.stamp)
    if (testCase.stamp && dom.stamp) {
      check(dom.stamp.text === 'FAILED', viewport.name + ' t=' + testCase.t + ': stamp text "' + dom.stamp.text + '" !== "FAILED"')
      check(dom.stamp.contrast >= 4.5, viewport.name + ' t=' + testCase.t + ': stamp contrast ' + dom.stamp.contrast.toFixed(2) + ' < 4.5')
      const [r, g, b] = dom.stamp.color
      check(r >= 150 && r > g + 40 && r > b + 40, viewport.name + ' t=' + testCase.t + ': stamp color rgb(' + r + ',' + g + ',' + b + ') is not localized red/ink')
    }
    check(dom.attribution !== null === testCase.attribution, viewport.name + ' t=' + testCase.t + ': attribution presence mismatch')
    check(dom.recap !== null === testCase.recap, viewport.name + ' t=' + testCase.t + ': recap caption presence mismatch')
    check(dom.stress !== null === testCase.stress, viewport.name + ' t=' + testCase.t + ': stress caption presence mismatch')
    if (dom.recap && testCase.recap) check(dom.recap.text === RECAP_TEXT, viewport.name + ' t=' + testCase.t + ': recap text "' + dom.recap.text + '" !== "' + RECAP_TEXT + '"')
    const measured = []
    for (const pair of [['card', dom.card], ['stamp', dom.stamp], ['attribution', dom.attribution], ['recap', dom.recap], ['stress', dom.stress]]) {
      if (!pair[1]) continue
      if (pair[1].error) {
        failures.push(viewport.name + ' t=' + testCase.t + ': ' + pair[0] + ' colors unparseable')
        continue
      }
      check(pair[1].contrast >= 4.5, viewport.name + ' t=' + testCase.t + ': ' + pair[0] + ' contrast ' + pair[1].contrast.toFixed(2) + ' < 4.5')
      check(pair[1].box.left >= 0.07 * viewport.width - 2, viewport.name + ' t=' + testCase.t + ': ' + pair[0] + ' left ' + pair[1].box.left.toFixed(1) + ' < 7% margin')
      check(pair[1].box.right <= 0.93 * viewport.width + 2, viewport.name + ' t=' + testCase.t + ': ' + pair[0] + ' right ' + pair[1].box.right.toFixed(1) + ' beyond 7% margin')
      check(pair[1].box.top >= 0 && pair[1].box.bottom <= viewport.height + 1, viewport.name + ' t=' + testCase.t + ': ' + pair[0] + ' box outside viewport')
      measured.push([pair[0], pair[1].box])
    }
    for (let i = 0; i < measured.length; i++) {
      for (let j = i + 1; j < measured.length; j++) {
        const area = overlapArea(measured[i][1], measured[j][1])
        check(area <= 1, viewport.name + ' t=' + testCase.t + ': ' + measured[i][0] + ' overlaps ' + measured[j][0] + ' by ' + area.toFixed(1) + ' px^2')
      }
    }
    check(dom.overflow.scrollWidth <= dom.overflow.innerWidth + 1, viewport.name + ' t=' + testCase.t + ': horizontal overflow ' + dom.overflow.scrollWidth + ' > ' + dom.overflow.innerWidth)
    check(dom.overflow.scrollHeight <= dom.overflow.innerHeight + 1, viewport.name + ' t=' + testCase.t + ': vertical overflow ' + dom.overflow.scrollHeight + ' > ' + dom.overflow.innerHeight)
    check(dom.statusRole === 'status' && dom.ariaLive === 'polite', viewport.name + ' t=' + testCase.t + ': status region role/aria-live mismatch')
    const screenshot = viewport.name + '-t' + String(testCase.t).replace('.', '_') + '.png'
    await page.screenshot({ path: path.join(scriptDir, screenshot) })
    entry.screenshot = screenshot
    caseResults.push(entry)
  }
}

const transcriptText = await page.evaluate(() => document.querySelector('[data-shaft-transcript]')?.textContent ?? '')
for (const heading of ['Why the groove was needed', 'Material attempts', 'Changing the process', 'Moving the supports']) {
  check(transcriptText.includes(heading), 'transcript missing chapter: ' + heading)
}
const undercutCount = (transcriptText.match(/undercut/g) ?? []).length
check(undercutCount === 2, 'transcript must gloss undercut once (cutter runout/relief groove vs involute); found ' + undercutCount + ' occurrences')
for (const phrase of ['cutter runout', 'relief groove', 'involute']) check(transcriptText.includes(phrase), 'transcript missing gloss phrase: ' + phrase)
for (const forbidden of ['FEA', 'safety factor', 'solver', 'MPa', 'ksi', 'PASSED']) check(!transcriptText.includes(forbidden), 'transcript contains forbidden token: ' + forbidden)

await page.evaluate(async () => {
  window.__shaftHarness.setTime(0)
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  window.__sweepState = { i: 1, last: document.querySelector('[data-shaft-status]').getAttribute('data-version'), changes: [] }
})
for (let chunk = 0; chunk < 10; chunk++) {
  await page.evaluate(async ({ step, total }) => {
    const state = window.__sweepState
    const statusEl = document.querySelector('[data-shaft-status]')
    const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const end = Math.min(state.i + 86, total + 1)
    for (; state.i <= end; state.i++) {
      const t = Math.min(state.i * step, 43)
      window.__shaftHarness.setTime(t)
      await settle()
      const version = statusEl.getAttribute('data-version')
      if (version !== state.last) {
        state.changes.push({ t, version: Number(version) })
        state.last = version
      }
    }
  }, { step: 0.05, total: 860 })
}
const sweep = await page.evaluate(({ step }) => {
  const countExpected = size => {
    // Mirrors ShaftStoryLayer buildAnnouncement: one polite update per change of announced text.
    const announce = f => [f.card !== 'none' ? f.cardText : null, f.stamp === 'settled' ? 'FAILED' : null,
      f.remainingTeeth ? 'recap' : null, f.attribution ? 'attribution' : null, f.stressIllustrative ? 'stress' : null].filter(Boolean).join('; ')
    let lastKey = null
    let count = 0
    const total = Math.round(43 / size)
    for (let i = 0; i <= total; i++) {
      const t = Math.min(i * size, 43)
      const key = announce(window.__shaftHarness.sample(t, false))
      if (lastKey !== null && key !== lastKey) count += 1
      lastKey = key
    }
    return count
  }
  return {
    domChanges: window.__sweepState.changes,
    domCount: window.__sweepState.changes.length,
    expectedCoarse: countExpected(step),
    expectedFine: countExpected(1 / 240),
  }
}, { step: 0.05 })
check(sweep.domCount === sweep.expectedCoarse, 'status updates (' + sweep.domCount + ') !== discrete changes at 0.05 s (' + sweep.expectedCoarse + ')')
check(sweep.domCount === sweep.expectedFine, 'status updates (' + sweep.domCount + ') !== discrete changes at 1/240 s (' + sweep.expectedFine + ')')
check(consoleErrors.length === 0, 'console errors: ' + consoleErrors.join(' | '))

await browser.close()

const report = {
  url: harnessUrl,
  command: 'node project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/shaft-script/verify-shaft-script.mjs --url=' + urlArg,
  started: new Date().toISOString(),
  cases: caseResults,
  transcript: { chaptersChecked: 4, undercutOccurrences: undercutCount },
  sweep,
  consoleErrors,
  failures,
  result: failures.length === 0 ? 'pass' : 'fail',
}
await fs.writeFile(path.join(scriptDir, 'report.json'), JSON.stringify(report, null, 2))

console.log('shaft-script verifier: ' + report.result)
console.log('cases: ' + caseResults.length + ' captures, sweep changes ' + sweep.domCount + ' (expected ' + sweep.expectedFine + '), console errors ' + consoleErrors.length)
if (failures.length) {
  for (const failure of failures) console.log('FAIL: ' + failure)
  process.exitCode = 1
}
