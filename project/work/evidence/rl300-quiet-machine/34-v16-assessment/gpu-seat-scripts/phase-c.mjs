// GPU-2 phase C: the two recordings (webm; mp4 is converted afterwards with ffmpeg).
import fs from 'node:fs'
import path from 'node:path'
import { E, launchBrowser, chromium, open, readProof, seekRest, writeJson } from './common.mjs'

const browser = await launchBrowser(chromium)
const [w, h] = [1440, 900]
const out = {}
const dirFor = tag => path.join(E, '_video-' + tag)

async function finish(ctx, page, tag, name) {
  const vp = page.video()
  await ctx.close()
  const src = await vp.path()
  const dest = path.join(E, name + '.webm')
  fs.copyFileSync(src, dest)
  fs.rmSync(dirFor(tag), { recursive: true, force: true })
  return dest
}

// ---- forward-reverse: u 0 -> 1 -> 0 via the proof's seek, driven from an in-page rAF clock ----
{
  const dir = dirFor('fr'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const t0 = Date.now()
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full', video: dir })
  const loadMs = Date.now() - t0
  const tier = (await readProof(page)).tier
  const run = await page.evaluate(async ({ fwd, back }) => {
    const q = window.__quietMachine, samples = []
    const ease = x => x // linear: a steady, visible pace
    const leg = (from, to, ms) => new Promise(res => {
      const start = performance.now()
      const step = now => {
        const t = Math.min(1, (now - start) / ms)
        q.seek(from + (to - from) * ease(t))
        if (t >= 1) return res()
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    const s = performance.now()
    q.seek(0); await new Promise(r => setTimeout(r, 1000))
    const a = performance.now(); await leg(0, 1, fwd); const b = performance.now()
    samples.push({ at: 'forward end', u: q.u, rangeValue: Number(document.querySelector('input[type=range]').value), scrollY: scrollY })
    await new Promise(r => setTimeout(r, 1000))
    const c = performance.now(); await leg(1, 0, back); const d = performance.now()
    await new Promise(r => setTimeout(r, 1000))
    samples.push({ at: 'reverse end', u: q.u, rangeValue: Number(document.querySelector('input[type=range]').value), scrollY: scrollY })
    return { samples, forwardMs: b - a, reverseMs: d - c, totalMs: performance.now() - s, frame: q.frame }
  }, { fwd: 12000, back: 12000 })
  await seekRest(page, 0)
  const end = await readProof(page)
  const dest = await finish(ctx, page, 'fr', 'forward-reverse')
  out.forwardReverse = { file: path.basename(dest), tier, loadMs, ...run, finalU: end.u, errors: [...page.errors], note: 'u driven by __quietMachine.seek from an in-page rAF clock (the verifier seek path), page scrollY stays 0; video starts at context creation so it includes the load lead-in' }
}

// ---- forward at the committed length: a real wheel scroll through the 900vh page ----
{
  const dir = dirFor('wheel'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const t0 = Date.now()
  const { ctx, page } = await open(browser, { w, h, qs: '?quality=full', video: dir })
  const loadMs = Date.now() - t0
  const before = await readProof(page)
  const max = before.scrollHeight - before.innerHeight
  await page.mouse.move(w / 2, h / 2)
  await page.waitForTimeout(1000)
  const T = 48000, startAt = Date.now()
  let sent = 0, n = 0
  const marks = []
  while (true) {
    const el = Date.now() - startAt
    if (el >= T) break
    const want = max * el / T, delta = want - sent
    if (delta >= 3) { await page.mouse.wheel(0, delta); sent += delta; n++ }
    if (n % 150 === 0 && n) marks.push({ s: +(el / 1000).toFixed(1), sent: Math.round(sent) })
    await page.waitForTimeout(16)
  }
  await page.mouse.wheel(0, max - sent + 50) // land exactly at the bottom
  await page.waitForTimeout(2500)
  const end = await readProof(page)
  const scrolledMs = Date.now() - startAt
  const dest = await finish(ctx, page, 'wheel', 'forward-at-proposed-length')
  out.wheel = { file: path.basename(dest), tier: before.tier, loadMs, scrollHeight: before.scrollHeight, innerHeight: before.innerHeight, maxScroll: max, scrollHeightInVh: before.scrollHeight / before.innerHeight,
    wheelEvents: n, scrollMs: scrolledMs, finalScrollY: end.scrollY, finalU: end.u, finalRange: end.rangeValue, endCardRendered: end.u >= .97, errors: [...page.errors], marks,
    note: 'real mouse.wheel events at ~' + Math.round(max / (T / 1000)) + ' px/s through the committed page (QM_LENGTH_VH = 900)' }
}
writeJson('videos-log.json', out)
await browser.close()
console.log('phase C done')
