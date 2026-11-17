// probes2: preloader timing, SPA route transition, reduced-motion, no-WebGL, GPU perf.
import { chromium } from 'playwright';
import fs from 'node:fs';

const EXEC = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = 'research/fragment/data';
const result = {};

// ---------- A: preloader disappearance + route transition (headless, desktop) ----------
{
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto('https://www.fragment.im/', { waitUntil: 'commit' });
  const shot = (n) => page.screenshot({ path: `${base}/pre-${n}.png` }).catch(() => {});
  const goneTimes = [];
  for (const ms of [1500, 2000, 2500, 3000, 3500, 4000]) {
    const target = t0 + ms;
    const now = Date.now();
    if (target > now) await page.waitForTimeout(target - now);
    const vis = await page.evaluate(() => {
      const el = [...document.querySelectorAll('div,span,p')].find((e) => e.childElementCount === 0 && /loading page/i.test(e.textContent || ''));
      if (!el) return 'gone';
      const s = getComputedStyle(el.closest('[style]') || el);
      return 'vis op=' + s.opacity;
    }).catch(() => 'err');
    if (vis === 'gone' && !goneTimes.length) goneTimes.push(ms);
    await shot(ms);
  }
  result.preloaderGoneByMs = goneTimes[0] ?? 'unknown (>4000)';

  // route transition: click ABOUT in nav
  await page.waitForTimeout(2500);
  await page.evaluate(() => { window.__spaFlag = 42; });
  const mark = await page.evaluate(() => {
    const out = [];
    const deep = (root) => { for (const el of root.querySelectorAll('*')) { if (el.tagName === 'CANVAS' || el.tagName === 'SPLINE-VIEWER') { el.__mk = el.tagName + ':' + Math.random().toString(36).slice(2, 7); out.push({ tag: el.tagName, mk: el.__mk }); } if (el.shadowRoot) deep(el.shadowRoot); } };
    deep(document);
    return out;
  });
  const reqs = [];
  page.on('request', (r) => reqs.push({ t: Date.now(), u: r.url().slice(0, 110) }));
  const clickT = Date.now();
  await page.click('nav a[href="./about"], header a[href="./about"], a[href="./about"]', { timeout: 8000 }).catch((e) => { result.routeClickErr = String(e).slice(0, 120); });
  const shots = {};
  for (const ms of [200, 500, 1200]) { await page.waitForTimeout(ms === 200 ? 200 : ms === 500 ? 300 : 700); shots[ms] = `${base}/route-${ms}.png`; await page.screenshot({ path: shots[ms] }).catch(() => {}); }
  result.route = {
    spaFlagStillSet: await page.evaluate(() => window.__spaFlag === 42).catch(() => 'page-unloaded'),
    url: page.url(),
    requestsDuring: reqs.map((r) => ({ dt: r.t - clickT, u: r.u.replace('https://framerusercontent.com', 'FUC').replace('https://www.fragment.im', 'SITE').replace('https://prod.spline.design', 'PSD').replace('https://cdn.spline.design', 'CSD') })).slice(0, 25),
    canvasesAfter: await page.evaluate(() => { const out = []; const deep = (root) => { for (const el of root.querySelectorAll('*')) { if (el.tagName === 'CANVAS' || el.tagName === 'SPLINE-VIEWER') out.push({ tag: el.tagName, mk: el.__mk || 'NEW' }); if (el.shadowRoot) deep(el.shadowRoot); } }; deep(document); return out; }),
    canvasesBefore: mark,
    settleMs: Date.now() - clickT,
  };
  // back-button behavior
  await page.goBack({ waitUntil: 'commit' }).catch(() => {});
  await page.waitForTimeout(1500);
  result.backUrl = page.url();
  result.backSplineCount = await page.evaluate(() => document.querySelectorAll('spline-viewer').length).catch(() => -1);
  await browser.close();
}

// ---------- B: reduced motion ----------
{
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('https://www.fragment.im/', { waitUntil: 'commit' });
  await page.waitForTimeout(6000);
  result.reducedMotion = await page.evaluate(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    anims: document.getAnimations().length,
    splinePresent: !!document.querySelector('spline-viewer'),
    splineReady: document.querySelector('spline-viewer')?.hasAttribute('data-fragment-spline-ready'),
    bodyClasses: document.body.className.slice(0, 80),
    htmlAttrs: [...document.documentElement.attributes].map((a) => a.name).join(','),
  }));
  await page.screenshot({ path: `${base}/reduced-motion.png` }).catch(() => {});
  await browser.close();
}

// ---------- C: no-WebGL ----------
{
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  await page.goto('https://www.fragment.im/', { waitUntil: 'commit' });
  await page.waitForTimeout(8000);
  result.noWebgl = await page.evaluate(() => ({
    webglAvailable: (() => { try { const c = document.createElement('canvas'); return !!c.getContext('webgl'); } catch { return false; } })(),
    splinePresent: !!document.querySelector('spline-viewer'),
    splineCanvas: !!document.querySelector('spline-viewer')?.shadowRoot?.querySelector('canvas'),
    imgs: [...document.querySelectorAll('img')].slice(0, 8).map((i) => (i.currentSrc || i.src || '').split('/').pop().slice(0, 40)),
  }));
  result.noWebglConsole = errs.slice(0, 6);
  await page.screenshot({ path: `${base}/no-webgl.png` }).catch(() => {});
  await browser.close();
}

// ---------- D: GPU-headed 10s scroll perf ----------
{
  const browser = await chromium.launch({ executablePath: EXEC, headless: false, args: ['--window-position=2400,900'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://www.fragment.im/', { waitUntil: 'commit' });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${base}/gpu-hero.png` }).catch(() => {});
  const perf = await page.evaluate(async () => {
    const deltas = []; let last = performance.now(); let raf = 0;
    const loop = (now) => { deltas.push(now - last); last = now; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const longtasks = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) longtasks.push(e.duration); }).observe({ entryTypes: ['longtask'] }); } catch {}
    const idleFps = deltas.length; // warm-up frames
    deltas.length = 0;
    const total = document.body.scrollHeight - innerHeight;
    const dur = 10000; const start = performance.now();
    await new Promise((res) => { (function step(now) { const p = Math.min(1, (now - start) / dur); scrollTo(0, total * p); if (p < 1) requestAnimationFrame(step); else res(); })(performance.now()); });
    cancelAnimationFrame(raf);
    const n = deltas.length;
    const avg = n ? deltas.reduce((a, b) => a + b, 0) / n : 0;
    const sorted = [...deltas].sort((a, b) => a - b);
    return {
      frames: n, avgDelta: +avg.toFixed(2), p90: +(sorted[Math.floor(n * 0.9)] || 0).toFixed(2), worst: +Math.max(...deltas).toFixed(2),
      avgFps: +(1000 / avg).toFixed(1), framesOver30ms: deltas.filter((d) => d > 30).length,
      longTasks: longtasks.map((t) => Math.round(t)), longTaskCount: longtasks.length,
    };
  });
  result.gpuScrollPerf = perf;
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${base}/gpu-top.png` }).catch(() => {});
  await browser.close();
}

fs.writeFileSync(`${base}/probes2.json`, JSON.stringify(result, null, 1));
console.log('WROTE probes2.json');
