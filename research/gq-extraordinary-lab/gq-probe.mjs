// Research probe for https://www.gq.com/sponsored/story/the-extraordinary-lab
// Writes JSON results into the same folder. Read-only against the public page;
// only dismisses (rejects) a consent banner if present.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab';
const URL_ = 'https://www.gq.com/sponsored/story/the-extraordinary-lab';
const EXEC = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const write = (name, data) => {
  const p = path.join(OUT, name);
  fs.writeFileSync(p, JSON.stringify(data, null, 1));
  console.log('WROTE', name, String(JSON.stringify(data)).length, 'bytes');
};

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.49 Mobile/15E148 Safari/604.1';

function attachNetUnused() {}

async function collectNetwork(context, page, net, t0) {
  const client = await context.newCDPSession(page);
  await client.send('Network.enable', { maxPostDataSize: 0 });
  const meta = new Map(); // requestId -> {url,type,wall,servedFrom}
  client.on('Network.requestWillBeSent', e => {
    if (e.request.url.startsWith('data:')) return;
    meta.set(e.requestId, { url: e.request.url, type: e.type, wall: Date.now() - t0, initiator: e.initiator && e.initiator.type });
    net.requests.push({ id: e.requestId, url: e.request.url, type: e.type, wall: Date.now() - t0, initiator: e.initiator && e.initiator.type });
  });
  client.on('Network.responseReceived', e => {
    const m = meta.get(e.requestId);
    if (m) { m.status = e.response.status; m.mime = e.response.mimeType; m.fromDiskCache = e.response.fromDiskCache; }
    net.responses.push({ id: e.requestId, status: e.response.status, mime: e.response.mimeType, fromCache: e.response.fromDiskCache, wall: Date.now() - t0 });
  });
  client.on('Network.loadingFinished', e => {
    net.finished.push({ id: e.requestId, encodedDataLength: e.encodedDataLength, wall: Date.now() - t0 });
  });
  client.on('Network.loadingFailed', e => {
    net.failed.push({ id: e.requestId, errorText: e.errorText, canceled: e.canceled, wall: Date.now() - t0 });
  });
  return client;
}

async function tryDismissConsent(page) {
  const out = { attempted: false, dismissed: false, how: null };
  try {
    out.attempted = true;
    // Sourcepoint CMP renders in a cross-origin iframe; look for a reject/accept button.
    for (const frame of page.frames()) {
      const u = frame.url() || '';
      if (/sp_|sourcepoint|privacy|cmp|consent/i.test(u)) {
        for (const label of ['Reject All', 'Reject all', 'Reject', 'Accept All', 'Accept all', 'Accept']) {
          const btn = frame.getByRole('button', { name: label, exact: false });
          if (await btn.count() > 0) {
            try { await btn.first().click({ timeout: 3000 }); out.dismissed = true; out.how = u.slice(0, 60) + ' :: ' + label; break; } catch {}
          }
        }
        if (out.dismissed) break;
      }
    }
  } catch (e) { out.error = String(e).slice(0, 200); }
  return out;
}

async function domSurvey(page) {
  return await page.evaluate(() => {
    const q = (s) => document.querySelectorAll(s).length;
    const canvases = [...document.querySelectorAll('canvas')].map(c => {
      const r = c.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), area: Math.round(r.width * r.height), cls: (c.className || '').toString().slice(0, 80), id: c.id || null, dataAttrs: [...c.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name).slice(0, 6) };
    });
    const videos = [...document.querySelectorAll('video')].map(v => {
      const r = v.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), src: (v.currentSrc || v.src || '').slice(0, 120), muted: v.muted, autoplay: v.autoplay, loop: v.loop, playsInline: v.playsInline };
    });
    const iframes = [...document.querySelectorAll('iframe')].map(f => ({ src: (f.src || '').slice(0, 160), w: Math.round(f.getBoundingClientRect().width), title: f.title || null }));
    const mv = document.querySelector('meta[name="viewport"]');
    const headings = [...document.querySelectorAll('h1,h2,h3')].slice(0, 14).map(h => ({ tag: h.tagName, text: (h.textContent || '').trim().slice(0, 90) }));
    // find likely embed container
    const embedHost = document.querySelector('[class*="embed"], [id*="embed"], [data-testid*="embed"], .interactive, [class*="interactive"]');
    return {
      title: document.title,
      metaViewport: mv ? mv.getAttribute('content') : null,
      bodyTextLength: (document.body.innerText || '').length,
      canvasCount: q('canvas'), canvases,
      videoCount: q('video'), videos,
      iframeCount: q('iframe'), iframes: iframes.slice(0, 12),
      headings,
      embedHostFound: !!embedHost,
      embedHostTag: embedHost ? embedHost.tagName + '.' + (embedHost.className || '').toString().slice(0, 60) : null,
      embedHostText: embedHost ? (embedHost.innerText || '').slice(0, 120) : null,
      scrollHeight: document.documentElement.scrollHeight,
      reducedMotionMatches: (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return null; } })(),
      docDriverScripts: [...document.querySelectorAll('script[src]')].map(s => s.src).filter(s => /interactive\.gq\.com|three|gsap/.test(s)).slice(0, 10)
    };
  });
}

function inPageProbeInstall() {
  // Runs before page scripts on every navigation.
  (() => {
    const p = { canvases: [], firstCanvasWall: null, webglContexts: 0, firstWebGLWall: null, scrollSamples: [] };
    window.__gqProbe = p;
    const origGet = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...a) {
      const ctx = origGet.call(this, type, ...a);
      if (ctx) {
        if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') {
          p.webglContexts++; if (p.firstWebGLWall == null) p.firstWebGLWall = Math.round(performance.now());
        }
      }
      return ctx;
    };
    const mo = new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n && n.tagName === 'CANVAS') {
          p.canvases.push({ wall: Math.round(performance.now()), w: n.width, h: n.height });
          if (p.firstCanvasWall == null) p.firstCanvasWall = Math.round(performance.now());
        }
      }
    });
    const start = () => mo.observe(document.documentElement, { childList: true, subTree: false });
    // observe subtree via document
    const mo2 = new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (!n || !n.querySelectorAll) continue;
        if (n.tagName === 'CANVAS' || n.querySelectorAll('canvas').length) {
          const cs = n.tagName === 'CANVAS' ? [n] : n.querySelectorAll('canvas');
          cs.forEach(c => { p.canvases.push({ wall: Math.round(performance.now()), w: c.width, h: c.height }); if (p.firstCanvasWall == null) p.firstCanvasWall = Math.round(performance.now()); });
        }
      }
    });
    mo2.observe(document, { childList: true, subtree: true });
  })();
}

async function scrollAndSample(page, { durationMs = 10000, pxPerSec = 2600 } = {}) {
  return await page.evaluate(async ({ durationMs, pxPerSec }) => {
    const res = { frames: 0, deltas: [], worstDelta: 0, sumDelta: 0, longTasks: 0, worstLongTask: 0, scrollSamples: [], errors: [] };
    let ltWorst = 0;
    try {
      new PerformanceObserver(list => {
        for (const e of list.getEntries()) { res.longTasks++; ltWorst = Math.max(ltWorst, e.duration); }
      }).observe({ entryTypes: ['longtask'] });
    } catch (e) { res.errors.push('longtask-observer: ' + e); }
    let last = performance.now(); let running = true;
    const t0 = performance.now();
    const scrollStep = () => {
      const now = performance.now();
      const dt = now - t0;
      window.scrollTo(0, Math.min(document.documentElement.scrollHeight - innerHeight, (dt / 1000) * pxPerSec));
      if (now - t0 > durationMs) running = false;
    };
    await new Promise(resolve => {
      const loop = (now) => {
        const delta = now - last; last = now;
        res.frames++; res.deltas.push(delta); res.sumDelta += delta;
        if (delta > res.worstDelta) res.worstDelta = delta;
        scrollStep();
        if (res.frames % 10 === 0) res.scrollSamples.push({ t: Math.round(now - t0), y: Math.round(scrollY) });
        if (running) requestAnimationFrame(loop); else resolve();
      };
      requestAnimationFrame(loop);
    });
    res.worstLongTask = Math.round(ltWorst);
    // settle sample
    await new Promise(r => setTimeout(r, 1500));
    const avg = res.sumDelta / Math.max(1, res.frames);
    return { frames: res.frames, avgFps: Math.round(1000 / avg), worstFrameMs: Math.round(res.worstDelta), longTasks: res.longTasks, worstLongTask: res.worstLongTask, scrollSamples: res.scrollSamples.slice(0, 60), finalScrollY: Math.round(scrollY), scrollHeight: document.documentElement.scrollHeight, errors: res.errors };
  }, { durationMs, pxPerSec });
}

async function newPage(browser, opts, state) {
  const context = await browser.newContext(opts);
  const page = await context.newPage();
  const net = { requests: [], responses: [], finished: [], failed: [] };
  await context.addInitScript(inPageProbeInstall);
  const consoleMsgs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) consoleMsgs.push({ t: m.type(), text: (m.text() || '').slice(0, 220) }); });
  page.on('pageerror', e => consoleMsgs.push({ t: 'pageerror', text: String(e).slice(0, 220) }));
  return { context, page, net, consoleMsgs };
}

async function summarizeNet(net, wallEnd = Infinity, wallStart = 0) {
  const sizes = new Map();
  for (const f of net.finished) sizes.set(f.id, f.encodedDataLength);
  const rows = [];
  for (const r of net.requests) {
    if (r.wall < wallStart || r.wall > wallEnd) continue;
    const resp = net.responses.find(x => x.id === r.id);
    rows.push({ url: r.url, type: r.type, wall: r.wall, status: resp ? resp.status : null, mime: resp ? resp.mime : null, bytes: sizes.get(r.id) ?? null });
  }
  return rows;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, executablePath: EXEC, args: ['--disable-blink-features=AutomationControlled'] });

// ---------- Phase 1: desktop network + scroll lazy loads + DOM ----------
let phase = 'desktop';
try {
  const { context, page, net, consoleMsgs } = await newPage(browser, { viewport: { width: 1440, height: 900 }, userAgent: undefined, reducedMotion: 'no-preference' }, phase);
  const t0 = Date.now();
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const dom = { domContentLoadedWall: Date.now() - t0 };
  await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  dom.loadWall = Date.now() - t0;
  const consent = await tryDismissConsent(page);
  await page.waitForTimeout(7000);
  const survey1 = await domSurvey(page).catch(e => ({ err: String(e).slice(0, 200) }));
  const probe1 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gqProbe || {}))).catch(() => ({}));
  // scroll top->bottom over 10s while network keeps recording
  const scrollRes = await scrollAndSample(page, { durationMs: 10000, pxPerSec: 3200 }).catch(e => ({ err: String(e).slice(0, 200) }));
  await page.waitForTimeout(2500);
  const survey2 = await domSurvey(page).catch(e => ({ err: String(e).slice(0, 200) }));
  const rows = await summarizeNet(net);
  write('net-desktop.json', { t0Iso: new Date(t0).toISOString(), dom, consent, survey1, survey2, probe1, scrollRes, consoleMsgs: consoleMsgs.slice(0, 40), requests: rows });
  await context.close();
} catch (e) { console.log('PHASE FAIL', phase, String(e).slice(0, 400)); }

// ---------- Phase 2: mobile emulation network ----------
phase = 'mobile';
try {
  const { context, page, net, consoleMsgs } = await newPage(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: IPHONE_UA }, phase);
  const t0 = Date.now();
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
  await tryDismissConsent(page);
  await page.waitForTimeout(6000);
  const survey = await domSurvey(page).catch(e => ({ err: String(e).slice(0, 200) }));
  // quick scroll to trigger lazy loads
  await scrollAndSample(page, { durationMs: 6000, pxPerSec: 2400 }).catch(() => {});
  await page.waitForTimeout(2000);
  const rows = await summarizeNet(net);
  write('net-mobile.json', { t0Iso: new Date(t0).toISOString(), survey, consoleMsgs: consoleMsgs.slice(0, 30), requests: rows });
  await context.close();
} catch (e) { console.log('PHASE FAIL', phase, String(e).slice(0, 400)); }

// ---------- Phase 3: perf trace (fresh desktop context, 10s scroll) ----------
phase = 'perf';
try {
  const { context, page } = await newPage(browser, { viewport: { width: 1440, height: 900 } }, phase);
  await page.goto(URL_, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await tryDismissConsent(page);
  await page.waitForTimeout(5000);
  const perf = await scrollAndSample(page, { durationMs: 10000, pxPerSec: 3200 });
  write('perf-desktop.json', perf);
  await context.close();
} catch (e) { console.log('PHASE FAIL', phase, String(e).slice(0, 400)); }

// ---------- Phase 4: reduced motion ----------
phase = 'reduced';
try {
  const { context, page, net } = await newPage(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, phase);
  await page.goto(URL_, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await tryDismissConsent(page);
  await page.waitForTimeout(6000);
  const survey = await domSurvey(page).catch(e => ({ err: String(e).slice(0, 200) }));
  const probe = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gqProbe || {}))).catch(() => ({}));
  const rows = await summarizeNet(net);
  const interactive = rows.filter(r => /interactive\.gq\.com/.test(r.url));
  write('reduced-motion.json', { survey, probe, interactiveInteractiveCount: interactive.length, interactiveUrls: interactive.map(r => r.url.slice(0, 120)).slice(0, 20) });
  await context.close();
} catch (e) { console.log('PHASE FAIL', phase, String(e).slice(0, 400)); }

// ---------- Phase 5: no-WebGL ----------
phase = 'nowebgl';
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await context.addInitScript(inPageProbeInstall);
  await page.goto(URL_, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await tryDismissConsent(page);
  await page.waitForTimeout(6000);
  const survey = await domSurvey(page).catch(e => ({ err: String(e).slice(0, 200) }));
  const probe = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gqProbe || {}))).catch(() => ({}));
  write('nowebgl.json', { survey, probe });
  await context.close();
} catch (e) { console.log('PHASE FAIL', phase, String(e).slice(0, 400)); }

// ---------- Phase 6: route transition ----------
phase = 'route';
try {
  const { context, page, net } = await newPage(browser, { viewport: { width: 1440, height: 900 } }, phase);
  await page.goto(URL_, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await tryDismissConsent(page);
  await page.waitForTimeout(4000);
  const before = { canvasCount: await page.evaluate(() => document.querySelectorAll('canvas').length), url: page.url() };
  // find first in-article internal link (same origin, different path)
  const link = await page.evaluate(() => {
    const as = [...document.querySelectorAll('main a[href], article a[href], p a[href]')]
      .map(a => a.href)
      .filter(h => h && h.startsWith('https://www.gq.com/') && !h.includes('#') && new URL(h).pathname !== location.pathname);
    return as[0] || null;
  });
  const docRequests = [];
  const t0 = Date.now();
  let navEvents = [];
  page.on('framenavigated', f => navEvents.push({ wall: Date.now() - t0, url: (f.url() || '').slice(0, 120) }));
  let navMs = null;
  if (link) {
    const resp = await page.click(`a[href="${new URL(link).pathname}"]`, { timeout: 8000 }).catch(e => null);
    // detect network doc request
    const t0c = Date.now();
    try { await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }); navMs = Date.now() - t0; } catch { navMs = null; }
    await page.waitForTimeout(3000);
  }
  const after = await page.evaluate(() => ({ canvasCount: document.querySelectorAll('canvas').length, url: location.href, title: document.title, bodyText: (document.body.innerText || '').length })).catch(e => ({ err: String(e).slice(0, 150) }));
  const rows = await summarizeNet(net);
  const during = rows.filter(r => r.wall > 4000 && r.wall < 20000).slice(0, 80);
  write('route.json', { link, before, after, navMs, navEvents: navEvents.slice(0, 10), requestsDuring: during });
  await context.close();
} catch (e) { console.log('PHASE FAIL', phase, String(e).slice(0, 400)); }

await browser.close();
console.log('ALL PHASES DONE');
