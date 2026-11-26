// Per-frame main-thread cost by scroll section: node scripts/perf-probe.cjs <url> <label>
// Copied 2026-11-26 from work-assets/portfolio/jg044-frame-scrub-2026-11-21/ch04/perf/perf2.cjs (the 60 fps probe).
// Wraps requestAnimationFrame to time each callback (JS + WebGL command submission), buckets by page
// section (scrollY / innerHeight), and also records rAF deltas. Headless=false, window kept focused.
const { chromium } = require('playwright')
const [url, label] = process.argv.slice(2)
const W = 1440,
  H = 900
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
;(async () => {
  const b = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: [
      '--enable-gpu',
      '--ignore-gpu-blocklist',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  })
  const ctx = await b.newContext({ viewport: { width: W, height: H } })
  await ctx.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window)
    window.__cb = []
    window.__dl = []
    let last = 0
    window.requestAnimationFrame = (fn) =>
      raf((t) => {
        const s = performance.now()
        fn(t)
        const e = performance.now()
        if (window.__rec) window.__cb.push([Math.floor(scrollY / innerHeight), e - s])
      })
    const tick = (t) => {
      if (window.__rec && last) window.__dl.push([Math.floor(scrollY / innerHeight), t - last])
      last = t
      raf(tick)
    }
    raf(tick)
  })
  const p = await ctx.newPage()
  await p.bringToFront()
  await p.goto(url, { waitUntil: 'load' })
  await sleep(4000)
  await p.mouse.move(W / 2, H / 2)
  const res = {}
  for (const pass of ['cold', 'warm']) {
    await p.evaluate(() => {
      scrollTo(0, 0)
    })
    await sleep(1500)
    await p.evaluate(() => {
      window.__cb = []
      window.__dl = []
      window.__rec = true
    })
    const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
    for (let y = 0; y < total; y += 20) {
      await p.mouse.wheel(0, 20)
      await sleep(16)
    }
    await sleep(400)
    res[pass] = await p.evaluate(() => {
      window.__rec = false
      const by = {}
      for (const [k, v] of window.__dl) {
        ;(by[k] ||= { d: [], c: [] }).d.push(v)
      }
      for (const [k, v] of window.__cb) {
        ;(by[k] ||= { d: [], c: [] }).c.push(v)
      }
      const m = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0)
      const p95 = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length * 0.95)] : 0)
      return Object.entries(by).map(
        ([k, o]) =>
          `sec${k}: frame p50 ${m(o.d).toFixed(1)} p95 ${p95(o.d).toFixed(1)} | js/frame p50 ${m(o.c).toFixed(1)} p95 ${p95(o.c).toFixed(1)} (${o.d.length}f)`,
      )
    })
  }
  console.log('== ' + label)
  for (const k in res) {
    console.log(' ' + k)
    res[k].forEach((l) => console.log('  ' + l))
  }
  await b.close()
})()
