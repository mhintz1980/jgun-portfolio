// Network capture for research: fragment.im — records requests with transfer sizes and timing.
// Usage: node net-capture.mjs <desktop|mobile> <outJson>
import { chromium } from 'playwright';
import fs from 'node:fs';

const mode = process.argv[2] || 'desktop';
const out = process.argv[3] || 'net.json';
const EXEC = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await chromium.launch({
  executablePath: EXEC,
  headless: true,
  args: ['--disable-blink-features=AutomationControlled'],
});

const ctxOpts =
  mode === 'mobile'
    ? {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      }
    : { viewport: { width: 1440, height: 900 } };

const ctx = await browser.newContext(ctxOpts);
const page = await ctx.newPage();

const navStartWall = { t: 0 };
const rows = [];
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
let firstDocWall = null;

cdp.on('Network.responseReceived', (e) => {
  const r = e.response;
  if (firstDocWall === null) firstDocWall = Date.now();
  rows.push({
    url: r.url.split('?')[0],
    q: r.url.includes('?') ? r.url.split('?')[1].slice(0, 40) : '',
    type: r.type,
    status: r.status,
    fromServiceWorker: !!r.fromServiceWorker,
    protocol: r.protocol,
    clen: Number(r.headers['content-length'] ?? -1),
    cenc: r.headers['content-encoding'] ?? '',
    mime: (r.mimeType || '').split(';')[0],
    tMs: null, // set on finished
    _id: e.requestId,
    _wall: Date.now(),
  });
});
const sizes = new Map();
cdp.on('Network.loadingFinished', (e) => {
  sizes.set(e.requestId, { enc: e.encodedDataLength, wall: Date.now() });
});
cdp.on('Network.loadingFailed', (e) => {
  sizes.set(e.requestId, { enc: -1, fail: e.errorText, wall: Date.now() });
});

const consoleErrs = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => consoleErrs.push('pageerror: ' + String(e).slice(0, 200)));

const t0 = Date.now();
await page.goto('https://www.fragment.im/', { waitUntil: 'commit', timeout: 60000 });
const commitMs = Date.now() - t0;

// wait for load event
await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
const loadMs = Date.now() - t0;

// screenshots of the loading sequence
const shotDir = out.replace(/\.json$/, '');
fs.mkdirSync(shotDir, { recursive: true });
await page.screenshot({ path: `${shotDir}/t-load.png` }).catch(() => {});
await page.waitForTimeout(1000);
await page.screenshot({ path: `${shotDir}/t1s.png` }).catch(() => {});
await page.waitForTimeout(3000);
await page.screenshot({ path: `${shotDir}/t5s.png` }).catch(() => {});

// phase 1 done; now scroll top->bottom over ~8s to trigger on-scroll loads
const scrollNewRequests = new Set();
const beforeScrollCount = rows.length;
await page.evaluate(async () => {
  const total = document.body.scrollHeight - innerHeight;
  const dur = 8000;
  const start = performance.now();
  await new Promise((res) => {
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      scrollTo(0, total * p);
      if (p < 1) requestAnimationFrame(step);
      else res();
    }
    requestAnimationFrame(step);
  });
});
await page.waitForTimeout(2000);
await page.screenshot({ path: `${shotDir}/t-bottom.png` }).catch(() => {});
// scroll back to top
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(1500);

// probe page state
const probe = await page.evaluate(() => {
  const canvases = [...document.querySelectorAll('canvas')].map((c) => ({
    w: c.width,
    h: c.height,
    cssW: c.getBoundingClientRect().width | 0,
    cssH: c.getBoundingClientRect().height | 0,
    fixed: getComputedStyle(c).position,
    visible: !!(c.offsetParent || getComputedStyle(c).position === 'fixed'),
  }));
  const vids = [...document.querySelectorAll('video')].map((v) => ({
    src: (v.currentSrc || v.src || '').split('?')[0].slice(-80),
    muted: v.muted,
    loop: v.loop,
    autoplay: v.autoplay,
    w: v.videoWidth,
    h: v.videoHeight,
  }));
  const g = (k) => typeof window[k] !== 'undefined' ? typeof window[k] : null;
  const globals = {};
  for (const k of ['THREE','gsap','ScrollTrigger','Lenis','Spline','spline','rive','Rive','lottie','Lottie','Howl','Howler','__spline','framerMotion','Motion','MotionOne','__FRAMERMotion','Barba','Swup','Theatre']) globals[k] = g(k);
  const meta = document.querySelector('meta[name="viewport"]')?.content ?? null;
  const htmlTouch = getComputedStyle(document.documentElement).touchAction;
  const bodyTouch = getComputedStyle(document.body).touchAction;
  const overflow = getComputedStyle(document.documentElement).overflow;
  const textLen = (document.body.innerText || '').length;
  const headings = [...document.querySelectorAll('h1,h2')].slice(0, 12).map((h) => h.textContent.trim().slice(0, 60));
  const htmlLen = document.documentElement.outerHTML.length;
  const hasTemplate = !!document.querySelector('template');
  const perf = (() => {
    try {
      const n = performance.getEntriesByType('navigation')[0];
      const p = performance.getEntriesByType('paint').map((e) => [e.name, Math.round(e.startTime)]);
      const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
      return { domContentLoaded: n && Math.round(n.domContentLoadedEventEnd), loadEvent: n && Math.round(n.loadEventEnd), paints: p, lcp: lcp && Math.round(lcp.startTime) };
    } catch (e) { return { err: String(e) }; }
  })();
  const reducedMatch = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animCount = document.getAnimations ? document.getAnimations().length : -1;
  const scrollHeight = document.body.scrollHeight;
  return { canvases, vids, globals, meta, htmlTouch, bodyTouch, overflow, textLen, headings, htmlLen, hasTemplate, perf, reducedMatch, animCount, scrollHeight, url: location.href };
});

// finish
const endWall = Date.now();
const items = rows.map((r) => {
  const f = sizes.get(r._id);
  const t = f ? f.wall - (firstDocWall ?? r._wall) : null;
  return {
    u: r.url.replace('https://framerusercontent.com', 'FUC').replace('https://www.fragment.im', 'SITE').replace('https://events.framer.com', 'EV').replace('https://fonts.gstatic.com', 'FG').replace('https://fonts.googleapis.com', 'FGA'),
    q: r.q, ty: r.type, st: r.status, enc: f ? Math.round(f.enc) : null, clen: r.clen, enc2: r.cenc, mime: r.mime,
    tMs: r.tMs ?? t, ph: rows.indexOf(r) < beforeScrollCount ? (r.tMs ?? t) <= loadMs + 500 ? 'initial' : 'lazy-idle' : 'on-scroll',
  };
});
fs.writeFileSync(out, JSON.stringify({ mode, commitMs, loadMs, probe, consoleErrs: consoleErrs.slice(0, 12), items }, null, 1));
console.log('WROTE', out, 'items=', items.length, 'scrollNew=', rows.length - beforeScrollCount);
await browser.close();
