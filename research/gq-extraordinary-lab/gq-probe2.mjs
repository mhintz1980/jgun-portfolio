// Probe v2: fixed CDP network attach, loader polling, scene-advance clicks.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab';
const URL_ = 'https://www.gq.com/sponsored/story/the-extraordinary-lab';
const EXEC = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const write = (n, d) => { fs.writeFileSync(path.join(OUT, n), JSON.stringify(d)); console.log('WROTE', n, fs.statSync(path.join(OUT, n)).size, 'bytes'); };
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.49 Mobile/15E148 Safari/604.1';

const INIT = () => {
  const p = { canvases: [], bigCanvasWall: null, webglContexts: 0, firstWebGLWall: null, pushStates: [], longTasks: [], reducedMotion: null };
  try { p.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch {}
  const op = history.pushState.bind(history), orp = history.replaceState.bind(history);
  history.pushState = (...a) => { p.pushStates.push({ t: Math.round(performance.now()), u: String(a[2] || '').slice(0, 100) }); return op(...a); };
  history.replaceState = (...a) => { p.pushStates.push({ t: Math.round(performance.now()), replace: true, u: String(a[2] || '').slice(0, 100) }); return orp(...a); };
  const oc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...a) {
    const ctx = oc.call(this, type, ...a);
    if (ctx && (type === 'webgl2' || type === 'webgl')) { p.webglContexts++; if (p.firstWebGLWall == null) p.firstWebGLWall = Math.round(performance.now()); }
    return ctx;
  };
  const mo = new MutationObserver(() => {
    for (const c of document.querySelectorAll('canvas')) {
      if (c.width >= 800 && !c.__gqSeen) { c.__gqSeen = true; p.canvases.push({ wall: Math.round(performance.now()), w: c.width, h: c.height }); if (p.bigCanvasWall == null) p.bigCanvasWall = Math.round(performance.now()); }
    }
  });
  const startMo = () => mo.observe(document, { childList: true, subtree: true });
  startMo();
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) p.longTasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); }).observe({ entryTypes: ['longtask'], buffered: true });
  } catch {}
  window.__gq = p;
};

async function collectNet(context, page, net) {
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  client.on('Network.requestWillBeSent', e => {
    if (!e.request.url.startsWith('data:')) net.requests.push({ id: e.requestId, url: e.request.url, type: e.type, wall: e.wallclock, initiator: e.initiator && e.initiator.type });
  });
  client.on('Network.responseReceived', e => net.responses.push({ id: e.requestId, status: e.response.status, mime: e.response.mimeType, fromDiskCache: e.response.fromDiskCache, fromPrefCache: e.response.fromPrefetchCache }));
  client.on('Network.loadingFinished', e => net.finished.push({ id: e.requestId, bytes: e.encodedDataLength, wall: e.wallclockMs }));
  client.on('Network.loadingFailed', e => net.failed.push({ id: e.requestId, err: e.errorText, canceled: e.canceled }));
  return client;
}

async function pollDom(page, stopAt, samples) {
  while (Date.now() < stopAt) {
    const s = await page.evaluate(() => {
      const q = document.querySelector('[class*="loader" i],[class*="loading" i],[class*="progress" i],[data-testid*="loader" i],[id*="loader" i]');
      return {
        t: Math.round(performance.now()),
        loaderText: q ? (q.innerText || '').replace(/\s+/g, ' ').slice(0, 60) : null,
        loaderCls: q ? (q.className || '').toString().slice(0, 50) : null,
        bodyLen: (document.body.innerText || '').length,
        videos: document.querySelectorAll('video').length,
        canvasW: (() => { const c = [...document.querySelectorAll('canvas')].find(x => x.width >= 800); return c ? c.width : 0; })()
      };
    }).catch(() => null);
    if (s) samples.push(s);
    await page.waitForTimeout(250);
  }
}

async function summarize(net) {
  const sizes = new Map(net.finished.map(f => [f.id, f.bytes]));
  const respo = new Map(net.responses.map(r => [r.id, r]));
  return net.requests.map(r => ({ url: r.url, type: r.type, wall: r.wall, status: (respo.get(r.id) || {}).status ?? null, mime: (respo.get(r.id) || {}).mime ?? null, bytes: sizes.get(r.id) ?? null, init: r.initiator }));
}

async function dismissConsent(page) {
  const out = { tried: [], dismissed: false };
  try {
    for (const label of ['Reject all', 'Reject All']) {
      const b = page.getByRole('button', { name: label }).first();
      if (await b.count() > 0 && await b.isVisible().catch(() => false)) { await b.click({ timeout: 2500 }); out.dismissed = true; out.tried.push(label); break; }
    }
    if (!out.dismissed) {
      for (const f of page.frames()) {
        const u = f.url() || '';
        if (/sp_|sourcepoint|privacy|cdn\.condenastdigital|consent/i.test(u)) {
          for (const label of ['Reject All', 'Reject all', 'Accept All']) {
            const b = f.getByRole('button', { name: label }).first();
            if (await b.count() > 0) { try { await b.click({ timeout: 2000 }); out.dismissed = true; out.tried.push(u.slice(0, 40) + '::' + label); break; } catch {} }
          }
        }
        if (out.dismissed) break;
      }
    }
  } catch (e) { out.err = String(e).slice(0, 120); }
  return out;
}

async function survey(page) {
  return await page.evaluate(() => {
    const q = s => document.querySelectorAll(s).length;
    return {
      title: document.title, metaViewport: (document.querySelector('meta[name=viewport]') || {}).content || null,
      bodyTextLength: (document.body.innerText || '').length,
      text: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 400),
      canvasCount: q('canvas'), videoCount: q('video'),
      h2s: [...document.querySelectorAll('h2')].map(h => (h.textContent || '').trim().slice(0, 80)).slice(0, 8),
      scrollHeight: document.documentElement.scrollHeight,
      interactiveScripts: [...document.querySelectorAll('script[src]')].map(s => s.src).filter(s => /interactive\.gq\.com/.test(s)).length
    };
  }).catch(e => ({ err: String(e).slice(0, 150) }));
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, executablePath: EXEC });

// ---- Phase A: desktop network + loader + clicks ----
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await context.addInitScript(INIT);
  const net = { requests: [], responses: [], finished: [], failed: [] };
  const t0 = Date.now();
  const client = await collectNet(context, page, net);
  const milestones = { navStartWall: 0 };
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  milestones.commitWall = Date.now() - t0;
  const samples = [];
  await pollDom(page, Date.now() + 9000, samples);
  milestones.afterIdleWall = Date.now() - t0;
  const consent = await dismissConsent(page);
  const survey1 = await survey(page);
  const probe1 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gq))).catch(() => ({}));
  // advance scenes with clicks
  const clicks = [];
  for (let i = 0; i < 3; i++) {
    const cWall = Date.now() - t0;
    await page.mouse.click(720, 450).catch(() => {});
    clicks.push(cWall);
    await page.waitForTimeout(3500);
  }
  const survey2 = await survey(page);
  const probe2 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gq))).catch(() => ({}));
  milestones.endWall = Date.now() - t0;
  const rows = await summarize(net);
  write('net-desktop2.json', { t0Iso: new Date(t0).toISOString(), milestones, consent, survey1, survey2, probe1: { bigCanvasWall: probe1.bigCanvasWall, firstWebGLWall: probe1.firstWebGLWall, webglContexts: probe1.webglContexts, reducedMotion: probe1.reducedMotion }, probe2: { bigCanvasWall: probe2.bigCanvasWall, firstWebGLWall: probe2.firstWebGLWall, webglContexts: probe2.webglContexts, pushStates: (probe2.pushStates || []).slice(0, 12), longTasks: { count: (probe2.longTasks || []).length, worst: Math.max(0, ...(probe2.longTasks || []).map(l => l.d)), list: (probe2.longTasks || []).slice(0, 25) } }, clicks, domPoll: samples.slice(0, 80), requests: rows });
  await client.detach().catch(() => {});
  await context.close();
} catch (e) { console.log('FAIL A', String(e).slice(0, 300)); }

// ---- Phase B: mobile network ----
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  const page = await context.newPage();
  await context.addInitScript(INIT);
  const net = { requests: [], responses: [], finished: [], failed: [] };
  const t0 = Date.now();
  const client = await collectNet(context, page, net);
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  const samples = [];
  await pollDom(page, Date.now() + 9000, samples);
  await dismissConsent(page);
  const sv = await survey(page);
  const probe = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gq))).catch(() => ({}));
  const rows = await summarize(net);
  write('net-mobile2.json', { t0Iso: new Date(t0).toISOString(), survey: sv, probe: { bigCanvasWall: probe.bigCanvasWall, firstWebGLWall: probe.firstWebGLWall, webglContexts: probe.webglContexts, longTaskCount: (probe.longTasks || []).length }, domPoll: samples.slice(0, 50), requests: rows });
  await client.detach().catch(() => {});
  await context.close();
} catch (e) { console.log('FAIL B', String(e).slice(0, 300)); }

// ---- Phase C: perf (idle + clicks), longtasks from init ----
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await context.addInitScript(INIT);
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  await dismissConsent(page);
  await page.waitForTimeout(8000);
  const idle = await page.evaluate(async () => {
    const res = { frames: 0, worst: 0, sum: 0 };
    let last = performance.now(); const t0 = last;
    await new Promise(r => { const l = n => { const d = n - last; last = n; res.frames++; res.sum += d; if (d > res.worst) res.worst = d; if (n - t0 < 5000) requestAnimationFrame(l); else r(); }; requestAnimationFrame(l); });
    return { frames: res.frames, avgFps: Math.round(1000 / (res.sum / res.frames)), worstFrameMs: Math.round(res.worst) };
  });
  const during = await page.evaluate(async () => {
    const res = { frames: 0, worst: 0, sum: 0, clickFrames: [] };
    let last = performance.now(); const t0 = last; let ci = 0;
    await new Promise(r => { const l = n => { const d = n - last; last = n; res.frames++; res.sum += d; if (d > res.worst) res.worst = d; if (n - t0 > ci * 3000 && ci < 3) { ci++; window.dispatchEvent(new MouseEvent('click', { bubbles: true })); document.body.click(); res.clickFrames.push({ t: Math.round(n - t0) }); } if (n - t0 < 10000) requestAnimationFrame(l); else r(); }; requestAnimationFrame(l); });
    return { frames: res.frames, avgFps: Math.round(1000 / (res.sum / res.frames)), worstFrameMs: Math.round(res.worst) };
  });
  const probe = await page.evaluate(() => { const p = JSON.parse(JSON.stringify(window.__gq)); const lt = p.longTasks || []; return { longTaskCount: lt.length, worstLongTask: Math.max(0, ...lt.map(l => l.d)), longTasksFirst: lt.slice(0, 20), bigCanvasWall: p.bigCanvasWall, firstWebGLWall: p.firstWebGLWall }; });
  write('perf2.json', { idle, during, probe });
  await context.close();
} catch (e) { console.log('FAIL C', String(e).slice(0, 300)); }

// ---- Phase D: no-WebGL ----
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] });
  const page = await context.newPage();
  await context.addInitScript(INIT);
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  const samples = [];
  await pollDom(page, Date.now() + 9000, samples);
  await dismissConsent(page);
  const sv = await survey(page);
  const probe = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gq))).catch(() => ({}));
  write('nowebgl2.json', { survey: sv, probe: { bigCanvasWall: probe.bigCanvasWall, firstWebGLWall: probe.firstWebGLWall, webglContexts: probe.webglContexts, reducedMotion: probe.reducedMotion }, domPoll: samples.slice(0, 50) });
  await context.close();
} catch (e) { console.log('FAIL D', String(e).slice(0, 300)); }

// ---- Phase E: reduced motion with network ----
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await context.addInitScript(INIT);
  const net = { requests: [], responses: [], finished: [], failed: [] };
  const client = await collectNet(context, page, net);
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  const samples = [];
  await pollDom(page, Date.now() + 9000, samples);
  await dismissConsent(page);
  const sv = await survey(page);
  const probe = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gq))).catch(() => ({}));
  const rows = await summarize(net);
  const videoUrls = rows.filter(r => /\.(mp4|webm)/.test(r.url)).map(r => r.url.slice(0, 110)).slice(0, 15);
  write('reduced2.json', { survey: sv, probe: { bigCanvasWall: probe.bigCanvasWall, firstWebGLWall: probe.firstWebGLWall, webglContexts: probe.webglContexts, reducedMotion: probe.reducedMotion }, domPoll: samples.slice(0, 40), videoCount: rows.filter(r => /video/.test(r.type || '')).length, videoUrls });
  await client.detach().catch(() => {});
  await context.close();
} catch (e) { console.log('FAIL E', String(e).slice(0, 300)); }

// ---- Phase F: link inventory + URL stability ----
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await context.addInitScript(INIT);
  await page.goto(URL_, { waitUntil: 'commit', timeout: 45000 });
  await dismissConsent(page);
  await page.waitForTimeout(8000);
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => ({ href: a.href.slice(0, 120), text: (a.innerText || '').trim().slice(0, 40) })).filter(l => l.href.startsWith('https://www.gq.com/')).slice(0, 25));
  const urlBefore = page.url();
  await page.mouse.click(720, 450);
  await page.waitForTimeout(2500);
  const midUrl = page.url();
  // BACK button if present
  const backClicked = await page.evaluate(() => { const els = [...document.querySelectorAll('button,div,a')].filter(e => (e.innerText || '').trim().toUpperCase() === 'BACK'); if (els.length) { els[0].click(); return true; } return false; });
  await page.waitForTimeout(2000);
  const afterUrl = page.url();
  const probe = await page.evaluate(() => JSON.parse(JSON.stringify(window.__gq))).catch(() => ({}));
  write('route2.json', { links, urlBefore, midUrl, afterUrl, backClicked, pushStates: (probe.pushStates || []).slice(0, 12), canvasStillThere: await page.evaluate(() => document.querySelectorAll('canvas').length) });
  await context.close();
} catch (e) { console.log('FAIL F', String(e).slice(0, 300)); }

await browser.close();
console.log('ALL PHASES DONE');
