// Probes: Spline embed structure, load-to-3D timeline, links, route transition, scroll perf.
import { chromium } from 'playwright';
import fs from 'node:fs';

const EXEC = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = process.argv[2] || 'probes.json';
const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// init script: instrument timeline from document start
await page.addInitScript(() => {
  window.__t = { start: performance.now() };
  const mark = (k) => { try { window.__t[k] = performance.now(); } catch {} };
  window.__mark = mark;
  document.addEventListener('DOMContentLoaded', () => mark('domContentLoaded'));
  window.addEventListener('load', () => mark('load'));
  window.addEventListener('fragment-portrait-ready', () => mark('portraitReady'));
  Object.defineProperty(window, '__fragmentPortraitReady', {
    set(v) { if (v === true) mark('portraitReadyTrue'); this._v = v; },
    get() { return this._v; },
    configurable: true,
  });
  const mo = new MutationObserver(() => {
    const sv = document.querySelector('spline-viewer');
    if (sv && !window.__t.splineViewerSeen) {
      window.__t.splineViewerSeen = performance.now();
      sv.addEventListener('load', () => mark('splineLoadEvt'), { once: true });
      const q = () => {
        const c = sv.shadowRoot && sv.shadowRoot.querySelector('canvas');
        if (c && !window.__t.splineCanvas) { window.__t.splineCanvas = performance.now(); window.__t.splineCanvasSize = [c.width, c.height]; }
      };
      q(); sv.addEventListener('wheel', () => {}, { passive: true });
      const imo = new MutationObserver(q);
      if (sv.shadowRoot) imo.observe(sv.shadowRoot, { childList: true, subtree: true });
      else mo2();
      function mo2() { setTimeout(() => { if (sv.shadowRoot) { imo.observe(sv.shadowRoot, { childList: true, subtree: true }); q(); } else setTimeout(mo2, 200); }, 200); }
    }
    const ifr = document.querySelector('iframe[src*="spline"], iframe[title*="Spline" i]');
    if (ifr && !window.__t.splineIframeSeen) window.__t.splineIframeSeen = performance.now();
  });
  mo.observe(document, { childList: true, subtree: true });
});

const reqs = [];
page.on('request', (r) => reqs.push({ t: Date.now(), u: r.url().slice(0, 120), m: r.method() }));
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)); });

const t0 = Date.now();
await page.goto('https://www.fragment.im/', { waitUntil: 'commit' });
await page.waitForTimeout(14000);

const structure = await page.evaluate(() => {
  const deep = (root, depth = 0, acc = []) => {
    if (depth > 4) return acc;
    for (const el of root.querySelectorAll('*')) {
      if (el.tagName === 'CANVAS') acc.push({ kind: 'canvas', tag: 'canvas', inShadow: depth > 0, w: el.width, h: el.height, vis: el.getBoundingClientRect().width > 0 });
      if (el.tagName === 'VIDEO') acc.push({ kind: 'video', src: (el.currentSrc || el.src || '').split('/').pop().slice(0, 40), cls: el.className.slice(0, 30) });
      if (el.tagName === 'IFRAME') acc.push({ kind: 'iframe', src: (el.src || '').slice(0, 100), title: el.title || '' });
      if (el.tagName === 'SPLINE-VIEWER' || (el.tagName || '').toLowerCase().includes('spline')) acc.push({ kind: 'spline-el', tag: el.tagName, url: el.getAttribute('url') || el.getAttribute('scene') || '', attrs: [...el.attributes].map(a => a.name).slice(0, 8).join(',') });
      if (el.shadowRoot) deep(el.shadowRoot, depth + 1, acc);
    }
    return acc;
  };
  const media = deep(document);
  const links = [...document.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 30) })).filter(l => l.href && !l.href.startsWith('http') && !l.href.startsWith('mailto'));
  const nav = [...document.querySelectorAll('nav a, header a')].map(a => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 25) })).slice(0, 20);
  const sections = [...document.querySelectorAll('[data-framer-name]')].slice(0, 30).map(e => ({ n: e.getAttribute('data-framer-name'), tag: e.tagName }));
  return { media, links, nav, sections, scrollH: document.body.scrollHeight, canvasCount: document.querySelectorAll('canvas').length };
});
const timing = await page.evaluate(() => window.__t);
const navTiming = await page.evaluate(() => {
  const n = performance.getEntriesByType('navigation')[0];
  return { start: Math.round(n.startTime), fcp: Math.round(performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime ?? -1), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) };
});

// ---- route transition test ----
const routeTest = { transitionRequests: 0 };
const target = structure.links.find(l => l.href && l.href.startsWith('/') && !l.href.startsWith('/#')) || null;
routeTest.target = target;
// mark canvases
const canvasMarkers = await page.evaluate(() => {
  const found = [];
  const deep = (root) => { for (const el of root.querySelectorAll('*')) { if (el.tagName === 'CANVAS') { el.__mk = Math.random().toString(36).slice(2); found.push(el.__mk); } if (el.shadowRoot) deep(el.shadowRoot); } };
  deep(document);
  return found;
});
routeTest.canvasesBefore = canvasMarkers.length;
if (target) {
  await page.screenshot({ path: out.replace(/\.json$/, '') + '-pre-click.png' });
  const clickT = Date.now();
  reqs.length = 0;
  await page.click(`a[href="${target.href}"]`, { timeout: 5000 }).catch(e => routeTest.clickErr = String(e).slice(0, 100));
  for (const ms of [400, 1000, 2000]) { await page.waitForTimeout(ms === 400 ? 400 : ms === 1000 ? 600 : 1000); await page.screenshot({ path: `${out.replace(/\.json$/, '')}-post${ms}.png` }); }
  routeTest.urlAfter = page.url();
  routeTest.transitionRequests = reqs.length;
  routeTest.transitionReqUrls = reqs.slice(0, 12).map(r => r.u.replace('https://framerusercontent.com', 'FUC').replace('https://www.fragment.im', 'SITE'));
  routeTest.canvasesAfter = await page.evaluate(() => {
    const found = [];
    const deep = (root) => { for (const el of root.querySelectorAll('*')) { if (el.tagName === 'CANVAS') found.push(el.__mk || 'new'); if (el.shadowRoot) deep(el.shadowRoot); } };
    deep(document);
    return found;
  });
  routeTest.clickToSettledMs = Date.now() - clickT;
}

// ---- 10s scroll perf ----
await page.goto('https://www.fragment.im/', { waitUntil: 'commit' }).catch(() => {});
await page.waitForTimeout(9000); // let 3D settle
const perf = await page.evaluate(async () => {
  const deltas = []; let last = performance.now(); let raf = 0;
  const loop = (now) => { deltas.push(now - last); last = now; raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  const longtasks = []; let ltObserverOk = true;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) longtasks.push(e.duration); }).observe({ entryTypes: ['longtask'] }); } catch { ltObserverOk = false; }
  const total = document.body.scrollHeight - innerHeight;
  const dur = 10000; const start = performance.now();
  await new Promise((res) => { (function step(now) { const p = Math.min(1, (now - start) / dur); scrollTo(0, total * p); if (p < 1) requestAnimationFrame(step); else res(); })(performance.now()); });
  cancelAnimationFrame(raf);
  const n = deltas.length;
  const avg = n ? deltas.reduce((a, b) => a + b, 0) / n : 0;
  const worst = n ? Math.max(...deltas) : 0;
  const over30 = deltas.filter(d => d > 30).length;
  return { frames: n, avgDelta: +avg.toFixed(2), worstDelta: +worst.toFixed(2), avgFps: +(1000 / avg).toFixed(1), worstFps: +(1000 / worst).toFixed(1), framesOver30ms: over30, longTasks: longtasks.map(t => Math.round(t)), longTaskCount: longtasks.length, ltObserverOk, scrollH: document.body.scrollHeight };
});

fs.writeFileSync(out, JSON.stringify({ structure, timing, navTiming, routeTest, perf, errors: errors.slice(0, 10) }, null, 1));
console.log('WROTE', out);
await browser.close();
