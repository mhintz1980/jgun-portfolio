// CDP driver for hanusek.com reverse-engineering capture (research/hanusek only).
// Node 22, native fetch + WebSocket. Usage:
//   node cdp-driver.mjs load <url> [--w=1440 --h=900] [--mobile] [--dsf=3] [--ua="..."] [--reduced] [--settle=15000] [--tag=desktop]
//   node cdp-driver.mjs eval "<expression>" [--await]
//   node cdp-driver.mjs fps [--dur=10000]
//   node cdp-driver.mjs route "<selector-or-text>" [--wait=6000]
//   node cdp-driver.mjs webgloff [--settle=12000]
//   node cdp-driver.mjs reduced [--settle=12000]
//   node cdp-driver.mjs shot <name.png>

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = 9334;
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SCRIPTS_DIR = path.join(DIR, 'scripts');

const args = process.argv.slice(2);
const cmd = args[0];
const rest = args.slice(1);
const opt = (name, dflt) => {
  const hit = rest.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.split('=').slice(1).join('=') : dflt;
};
const has = name => rest.includes('--' + name);

async function getPageTarget() {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const t = list.find(t => t.type === 'page');
  if (!t) throw new Error('no page target');
  return t;
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message + ' ' + JSON.stringify(msg.error.data || '')));
        else resolve(msg.result);
      } else if (msg.method) {
        (this.handlers.get(msg.method) || []).forEach(h => h(msg.params));
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(handler);
  }
}

async function connect() {
  const t = await getPageTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  return { cdp: new CDP(ws), target: t };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const FINGERPRINT_PROBE = `(() => {
  const win = window, doc = document;
  const g = k => { try { return win[k] !== undefined; } catch { return false; } };
  const globals = ['THREE','gsap','ScrollTrigger','ScrollSmoother','Flip','SplitText','DrawSVGPlugin','MorphSVGPlugin','CustomEase','Lenis','lenis','LocomotiveScroll','__NUXT__','__NEXT_DATA__','$nuxt','Nuxt','Rive','rive','lottie','Howl','Howler','theatre','Barba','barba','Swup','pixi','PIXI','OGL','regl','BABYLON','React','Vue','preact','Alpine','jQuery','SplitType','ScrollOut','GSDevTools','Zdog','_ convictions','vercel','RiveCanvas','MotionOne','motion','framerMotion'].filter(g);
  const canvases = [...doc.querySelectorAll('canvas')].map(c => ({
    w: c.width, h: c.height, id: c.id, cls: (c.className||'').toString().slice(0,80),
    parent: c.parentElement ? (c.parentElement.tagName + '.' + (c.parentElement.className||'').toString().slice(0,80)) : '',
    ariaHidden: c.getAttribute('aria-hidden'), style: (c.getAttribute('style')||'').slice(0,160)
  }));
  let webgl = null, webglInfo = null;
  try {
    const t = doc.createElement('canvas');
    const gl = t.getContext('webgl2') || t.getContext('webgl');
    webgl = !!gl;
    if (gl) webglInfo = { version: gl.getParameter(gl.VERSION), renderer: (gl.getExtension('WEBGL_debug_renderer_info') ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) };
  } catch {}
  return {
    title: doc.title,
    url: location.href,
    readyState: doc.readyState,
    ua: navigator.userAgent,
    dpr: win.devicePixelRatio,
    viewport: { iw: win.innerWidth, ih: win.innerHeight },
    metaViewport: doc.querySelector('meta[name=viewport]')?.content || null,
    reducedMedia: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl, webglInfo,
    globals, gsapVersion: win.gsap?.version || null,
    stVersion: win.ScrollTrigger?.version || null,
    smootherVersion: win.ScrollSmoother?.version || null,
    canvases,
    headings: [...doc.querySelectorAll('h1,h2,h3')].slice(0, 40).map(h => h.tagName + ': ' + (h.textContent||'').trim().replace(/\\s+/g,' ').slice(0,90)),
    bodyTextSample: (doc.body?.innerText || '').replace(/\\s+/g,' ').slice(0, 1500),
    links: [...doc.querySelectorAll('a[href]')].slice(0, 50).map(a => ({ href: a.getAttribute('href'), text: (a.textContent||'').trim().slice(0,50) })),
    scripts: [...doc.scripts].map(s => ({ src: s.src || '(inline:' + (s.textContent||'').length + ')', type: s.type || null, async: s.async || false, defer: s.defer || false })).slice(0, 80),
    domNodes: doc.getElementsByTagName('*').length,
    scrollHeight: doc.documentElement.scrollHeight,
    scroller: { isWindowScroll: true },
    fonts: [...doc.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.style).slice(0, 30),
    perfNav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { domContentLoaded: n.domContentLoadedEventEnd, loadEvent: n.loadEventEnd, type: n.type } : null; })(),
    longtasksEarly: (win.__longtasks || []).slice(0, 20),
    firstPaint: (win.__paint || []).slice(0, 6),
  };
})()`;

// in-document bootstrap installed before navigation to catch early perf events
const INIT_SCRIPT = `
window.__longtasks = []; window.__paint = [];
try {
  new PerformanceObserver(l => l.getEntries().forEach(e => window.__longtasks.push({start: Math.round(e.startTime), dur: Math.round(e.duration), name: e.name}))).observe({entryTypes:['longtask']});
} catch {}
try {
  new PerformanceObserver(l => l.getEntries().forEach(e => window.__paint.push({name: e.name, start: Math.round(e.startTime)}))).observe({entryTypes:['paint']});
} catch {}
try {
  new PerformanceObserver(l => { const es = l.getEntries(); if (es.length) window.__lcp = Math.round(es[es.length-1].startTime); }).observe({entryTypes:['largest-contentful-paint']});
} catch {}
`;

async function setupEnv(cdp, o) {
  if (o.w && o.h) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: o.w, height: o.h,
      deviceScaleFactor: o.dsf != null ? Number(o.dsf) : 1,
      mobile: !!o.mobile,
      screenOrientation: o.mobile ? { type: 'portraitPrimary', angle: 0 } : { type: 'landscapePrimary', angle: 0 }
    });
  }
  if (o.ua) await cdp.send('Emulation.setUserAgentOverride', { userAgent: o.ua });
  if (o.reduced) await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
}

function summariseNet(events, base) {
  const reqs = new Map();
  for (const e of events) {
    if (e.method === 'NW.req') {
      reqs.set(e.params.requestId, {
        url: e.params.request.url,
        method: e.params.request.method,
        type: e.params.type || null,
        initiator: e.params.initiator ? { type: e.params.initiator.type, url: e.params.initiator.url } : null,
        startMs: Math.round((e.params.timestamp - base) * 1000),
        headers: e.params.request.headers
      });
    } else if (e.method === 'NW.resp') {
      const r = reqs.get(e.params.requestId);
      if (!r) continue;
      Object.assign(r, {
        status: e.params.response.status,
        mime: e.params.response.mimeType,
        fromDiskCache: e.params.response.fromDiskCache || false,
        fromServiceWorker: e.params.response.fromServiceWorker || false,
        contentLengthHdr: e.params.response.headers && (e.params.response.headers['Content-Length'] || e.params.response.headers['content-length'] || null),
        encoding: e.params.response.headers && (e.params.response.headers['Content-Encoding'] || e.params.response.headers['content-encoding'] || null),
        protocol: e.params.response.protocol || null
      });
    } else if (e.method === 'NW.fin') {
      const r = reqs.get(e.params.requestId);
      if (!r) continue;
      r.encodedDataLength = e.params.encodedDataLength;
      r.endMs = Math.round((e.params.timestamp - base) * 1000);
    } else if (e.method === 'NW.fail') {
      const r = reqs.get(e.params.requestId);
      if (!r) continue;
      r.failed = true; r.error = e.params.errorText; r.canceled = !!e.params.canceled;
    }
  }
  return [...reqs.values()];
}

async function armNetwork(cdp) {
  const events = [];
  cdp.on('Network.requestWillBeSent', p => events.push({ method: 'NW.req', params: p }));
  cdp.on('Network.responseReceived', p => events.push({ method: 'NW.resp', params: p }));
  cdp.on('Network.loadingFinished', p => events.push({ method: 'NW.fin', params: p }));
  cdp.on('Network.loadingFailed', p => events.push({ method: 'NW.fail', params: p }));
  await cdp.send('Network.enable', { maxPostDataSize: 4096 });
  return events;
}

async function saveJsBodies(cdp, reqs) {
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  const saved = [];
  for (const r of reqs) {
    if (!r.mime || !/javascript|ecmascript/.test(r.mime)) continue;
    if (!r.url.startsWith('http')) continue;
    if (r.failed || r.status >= 400) continue;
    try {
      const { body, base64Encoded } = await cdp.send('Network.getResponseBody', { requestId: undefined_ });
    } catch {}
  }
  return saved;
}
// (placeholder removed below — real implementation in main())

let undefined_;
// NOTE: saveJsBodies is superseded; real body saving happens inline in cmdLoad.

async function cmdLoad(url, o) {
  const { cdp } = await connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Performance.enable');
  await cdp.on ? null : null;
  const consoleMsgs = [];
  cdp.on('Runtime.consoleAPICalled', p => consoleMsgs.push({ type: p.type, text: (p.args || []).map(a => a.value != null ? String(a.value) : (a.description || '')).join(' ').slice(0, 300) }));
  cdp.on('Runtime.exceptionThrown', p => consoleMsgs.push({ type: 'exception', text: (p.exceptionDetails.text || '') + ' ' + ((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || '').slice(0, 300) }));
  cdp.on('Log.entryAdded', p => consoleMsgs.push({ type: 'log.' + p.entry.level, text: (p.entry.text || '').slice(0, 300), url: p.entry.url }));

  const events = await armNetwork(cdp);
  if (o.fresh) { try { await cdp.send('Network.clearBrowserCache', {}); } catch {} }
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: INIT_SCRIPT });
  await setupEnv(cdp, o);

  const wall0 = Date.now();
  const t0 = Date.now();
  const nav = await cdp.send('Page.navigate', { url });

  // wait for load event
  await new Promise((resolve) => {
    const h = p => { if (p.frame && p.frame.parentId === undefined && (url === '' || true)) { /* resolve on any main load after nav */ } };
    let done = false;
    cdp.on('Page.loadEventFired', () => { if (!done) { done = true; resolve(); } });
    setTimeout(() => { if (!done) { done = true; resolve(); } }, 45000);
  });
  const loadMs = Date.now() - t0;

  const settle = Number(o.settle || 15000);
  await sleep(settle);

  const baseEvt = events.find(e => e.method === 'NW.req');
  const base = baseEvt ? baseEvt.params.timestamp : 0;
  const reqs = summariseNet(events, base);

  // fetch JS bodies and save
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  const savedScripts = [];
  for (const r of reqs) {
    if (!r.mime || !/javascript|ecmascript/.test(r.mime)) continue;
    if (!r.url.startsWith('http') || r.failed || (r.status && r.status >= 400)) continue;
    try {
      const { body, base64Encoded } = await cdp.send('Network.getResponseBody', { requestId: events.find(e => e.method === 'NW.req' && e.params.request.url === r.url)?.params.requestId });
      const buf = base64Encoded ? Buffer.from(body, 'base64') : Buffer.from(body, 'utf8');
      const h = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
      const name = (r.url.split('/').pop() || 'inline').split('?')[0].replace(/[^\w.-]/g, '_').slice(0, 80) + '.' + h + '.js';
      fs.writeFileSync(path.join(SCRIPTS_DIR, name), buf);
      savedScripts.push({ url: r.url, file: name, bytes: buf.length, mapRef: /\/\/[#@]\s*sourceMappingURL=(\S+)/.exec(body)?.[1] || null });
    } catch (e) { savedScripts.push({ url: r.url, error: String(e.message || e).slice(0, 100) }); }
  }

  const fp = (await cdp.send('Runtime.evaluate', { expression: FINGERPRINT_PROBE, returnByValue: true })).result.value;
  const metrics = (await cdp.send('Performance.getMetrics', {})).metrics.filter(m => ['JSHeapUsedSize','JSHeapTotalSize','Documents','Frames','JSEventListeners','Nodes'].includes(m.name));

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const shotPath = path.join(DIR, `screenshot-${o.tag || 'load'}.png`);
  fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

  const out = {
    cmd: 'load', url, opts: o, wallStart: new Date(wall0).toISOString(),
    navError: nav.errorText || null, loadEventMs: loadMs, settleMs: settle,
    network: reqs, savedScripts, fingerprint: fp, metrics,
    console: consoleMsgs.slice(0, 60),
    totalTransferKB: Math.round(reqs.reduce((a, r) => a + (r.encodedDataLength || 0), 0) / 1024 * 10) / 10
  };
  const outPath = path.join(DIR, `net-${o.tag || 'load'}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log('WROTE ' + outPath + ' screenshot=' + shotPath + ' transferKB=' + out.totalTransferKB + ' requests=' + reqs.length);
  // brief stdout summary of big items
  reqs.filter(r => (r.encodedDataLength || 0) > 30000).forEach(r => console.log('BIG ' + Math.round((r.encodedDataLength||0)/1024) + 'KB ' + r.mime + ' ' + r.url.slice(0, 110)));
  (fp.canvases || []).forEach(c => console.log('CANVAS ' + c.w + 'x' + c.h + ' cls=' + c.cls + ' parent=' + c.parent));
  console.log('GLOBALS ' + JSON.stringify(fp.globals) + ' gsap=' + fp.gsapVersion + ' st=' + fp.stVersion);
  console.log('TITLE ' + fp.title);
  await cdp.ws.close?.();
  process.exit(0);
}

async function cmdEval(expr) {
  const { cdp } = await connect();
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 60000 });
  console.log(JSON.stringify(r.result.value !== undefined ? r.result.value : r, null, 1).slice(0, 8000));
  process.exit(0);
}

async function cmdFps(dur) {
  const { cdp } = await connect();
  try { await cdp.send('Page.bringToFront', {}); } catch {}
  const expr = `(async (durMs) => {
    const deltas = []; let last = performance.now(); let raf = 0;
    const longTasks = [];
    try { new PerformanceObserver(l => l.getEntries().forEach(e => longTasks.push(Math.round(e.duration)))).observe({entryTypes:['longtask']}); } catch {}
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const t0 = performance.now();
    const run = () => {
      const now = performance.now();
      deltas.push(now - last); last = now;
      const p = Math.min(1, (now - t0) / durMs);
      window.scrollTo(0, Math.round(p * total));
      if (p < 1 && now - t0 < durMs) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    await new Promise(r => setTimeout(r, durMs + 400));
    cancelAnimationFrame(raf);
    deltas.sort((a,b)=>a-b);
    const sum = deltas.reduce((a,b)=>a+b,0);
    return {
      frames: deltas.length,
      avgFps: Math.round(1000 / (sum / deltas.length) * 10) / 10,
      worstFrameMs: Math.round(deltas[deltas.length-1]*10)/10,
      p95FrameMs: Math.round(deltas[Math.floor(deltas.length*0.95)]*10)/10,
      longTasksOver50: longTasks.filter(d => d >= 50).length,
      longTaskWorstMs: longTasks.length ? Math.max(...longTasks) : 0,
      scrollHeight: document.documentElement.scrollHeight,
      innerH: window.innerHeight
    };
  })(${dur})`;
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: (dur + 30000) });
  console.log(JSON.stringify(r.result.value, null, 1));
  process.exit(0);
}

async function cmdRoute(sel, waitMs) {
  const { cdp } = await connect();
  const events = await armNetwork(cdp);
  const base = (await cdp.send('Runtime.evaluate', { expression: '1', returnByValue: true }));
  // canvas + text snapshot before
  const before = (await cdp.send('Runtime.evaluate', { expression: `({url: location.href, canvases: document.querySelectorAll('canvas').length, htmlLen: document.documentElement.outerHTML.length, markers: window.__NUXT__?1:0, navType: performance.getEntriesByType('navigation').length})`, returnByValue: true })).result.value;
  const expr = `(async () => {
    const links = [...document.querySelectorAll('a[href]')].filter(a => a.getAttribute('href') && !a.getAttribute('href').startsWith('http') && !a.getAttribute('href').startsWith('#') && a.getAttribute('href') !== location.pathname);
    const target = ${JSON.stringify(sel)} ? (document.querySelector(${JSON.stringify(sel)}) || links.find(a => (a.textContent||'').includes(${JSON.stringify(sel)}))) : links[0];
    if (!target) return { found: false, candidates: links.map(a => a.getAttribute('href') + ' :: ' + (a.textContent||'').trim().slice(0,30)).slice(0,20) };
    const href = target.getAttribute('href');
    const t0 = performance.now();
    let pop = null;
    const onPop = () => { pop = Math.round(performance.now() - t0); };
    window.addEventListener('popstate', onPop);
    target.click();
    await new Promise(r => setTimeout(r, ${waitMs}));
    return { found: true, href, popstateAfterMs: pop, url: location.href,
      canvases: document.querySelectorAll('canvas').length,
      htmlLen: document.documentElement.outerHTML.length,
      title: document.title, navEntries: performance.getEntriesByType('navigation').length,
      bodySample: (document.body.innerText||'').replace(/\\s+/g,' ').slice(0, 300) };
  })()`;
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: waitMs + 30000 });
  const baseT = events.find(e => e.method === 'NW.req');
  const reqs = summariseNet(events, baseT ? baseT.params.timestamp : 0);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(DIR, 'screenshot-after-route.png'), Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ before, result: r.result.value, routeRequests: reqs.map(x => ({ url: x.url.slice(0, 120), type: x.type, mime: x.mime, KB: Math.round((x.encodedDataLength||0)/1024) })) }, null, 1).slice(0, 9000));
  process.exit(0);
}

async function cmdWebglOff(settle) {
  const { cdp } = await connect();
  try { await cdp.send('Page.bringToFront', {}); } catch {}
  await cdp.send('Page.enable');
  const events = await armNetwork(cdp);
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...a) {
      if (/webgl|webgl2|experimental-webgl/i.test(String(type))) return null;
      return orig.call(this, type, ...a);
    };` });
  const consoleMsgs = [];
  cdp.on('Runtime.exceptionThrown', p => consoleMsgs.push(((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text || '').slice(0, 200)));
  const t0 = Date.now();
  await cdp.send('Page.navigate', { url: 'https://www.hanusek.com/' });
  await new Promise(res => { let d = false; cdp.on('Page.loadEventFired', () => { if (!d) { d = true; res(); } }); setTimeout(res, 45000); });
  await sleep(settle);
  // scroll to the 3D crew section and see what happens without WebGL
  const crew = (await cdp.send('Runtime.evaluate', { expression: `(() => { const el = document.getElementById('crew'); if (!el) return null; el.scrollIntoView(); window.scrollBy(0, -40); return { top: Math.round(el.getBoundingClientRect().top), h: el.offsetHeight }; })()`, returnByValue: true })).result.value;
  await sleep(8000);
  const fp2 = (await cdp.send('Runtime.evaluate', { expression: `({ canvases: [...document.querySelectorAll('canvas')].length, crewText: (document.getElementById('crewHead')||{}).innerText || '', exceptionsSeen: true })`, returnByValue: true })).result.value;
  const fp = (await cdp.send('Runtime.evaluate', { expression: FINGERPRINT_PROBE, returnByValue: true })).result.value;
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(DIR, 'screenshot-webgl-off.png'), Buffer.from(shot.data, 'base64'));
  fs.writeFileSync(path.join(DIR, 'webgl-off.json'), JSON.stringify({ loadMs: Date.now() - t0, crewAfterScroll: crew, crewState: fp2, fingerprint: fp, exceptions: consoleMsgs.slice(0, 30) }, null, 1));
  console.log('WROTE webgl-off.json');
  console.log('CREW ' + JSON.stringify(crew) + ' STATE ' + JSON.stringify(fp2));
  console.log('EXCEPTIONS ' + JSON.stringify(consoleMsgs.slice(0, 6)));
  console.log('CANVASES ' + JSON.stringify(fp.canvases));
  console.log('BODYTEXT ' + (fp.bodyTextSample || '').slice(0, 400));
  console.log('EXCEPTIONS ' + JSON.stringify(consoleMsgs.slice(0, 10)));
  process.exit(0);
}

async function cmdReduced(settle) {
  const { cdp } = await connect();
  try { await cdp.send('Page.bringToFront', {}); } catch {}
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: INIT_SCRIPT + `
    window.__motionSamples = [];
    document.addEventListener('DOMContentLoaded', () => {
      const els = [...document.querySelectorAll('*')].filter(e => e.tagName !== 'SCRIPT').slice(0, 400);
      const t0 = performance.now();
      const iv = setInterval(() => {
        const moving = els.filter(e => { const s = getComputedStyle(e); return s.transform && s.transform !== 'none'; }).length;
        window.__motionSamples.push(Math.round(performance.now() - t0) + ':' + moving);
        if (performance.now() - t0 > 6000) clearInterval(iv);
      }, 500);
    });` });
  await cdp.send('Page.navigate', { url: 'https://www.hanusek.com/' });
  await new Promise(res => { let d = false; cdp.on('Page.loadEventFired', () => { if (!d) { d = true; res(); } }); setTimeout(res, 45000); });
  await sleep(settle);
  // scroll to crew section, let the 3D scene attach, then sample whether things still move under reduced motion
  (await cdp.send('Runtime.evaluate', { expression: `(() => { const el = document.getElementById('crew'); if (el) { el.scrollIntoView(); window.scrollBy(0, -40); } return 1; })()`, returnByValue: true }));
  await sleep(9000);
  const crewSample = (await cdp.send('Runtime.evaluate', { expression: `(async () => { const c = document.querySelector('#crewCanvas canvas'); const s1 = c ? c.toDataURL().length : 0; await new Promise(r => setTimeout(r, 1500)); const s2 = c ? c.toDataURL().length : 0; return { canvasPresent: !!c, pixelsChanging: s1 !== s2, headText: (document.getElementById('crewHead')||{}).innerText || '' }; })()`, returnByValue: true, awaitPromise: true })).result.value;
  const fp = (await cdp.send('Runtime.evaluate', { expression: FINGERPRINT_PROBE + '; Object.assign(window.__fpExtra || (window.__fpExtra={}), {motionSamples: window.__motionSamples, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches}) || {}', returnByValue: true })).result.value;
  console.log(JSON.stringify({ reduced: fp.reduced, motionSamples: fp.motionSamples, crewSample, canvases: fp.canvases, longtasks: (fp.longtasksEarly || []).length, body: (fp.bodyTextSample||'').slice(0,200) }, null, 1));
  process.exit(0);
}

async function cmdSweep(url, o) {
  const { cdp } = await connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  const consoleMsgs = [];
  cdp.on('Runtime.exceptionThrown', p => consoleMsgs.push(((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text || '').slice(0, 200)));
  const events = await armNetwork(cdp);
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: INIT_SCRIPT });
  await setupEnv(cdp, o);
  try { await cdp.send('Page.bringToFront', {}); } catch {}
  const t0 = Date.now();
  await cdp.send('Page.navigate', { url });
  await new Promise(res => { let d = false; cdp.on('Page.loadEventFired', () => { if (!d) { d = true; res(); } }); setTimeout(res, 45000); });
  await sleep(8000);
  const beforeSweep = events.filter(e => e.method === 'NW.req').length;
  // scroll top -> bottom over ~14s; rAF when visible, setInterval fallback when occluded, hard deadline
  const sw = await cdp.send('Runtime.evaluate', { awaitPromise: true, expression: `(async()=>{const total=document.documentElement.scrollHeight-innerHeight;const t0=performance.now();const dur=14000;return await new Promise(res=>{let lastY=-1,stalls=0;const done=()=>{clearInterval(iv);cancelAnimationFrame(raf);res({ms:Math.round(performance.now()-t0),y:Math.round(scrollY),total,stalls});};const step=()=>{const p=Math.min(1,(performance.now()-t0)/dur);window.scrollTo(0,Math.round(p*total));const y=scrollY;if(y===lastY&&p<1){if(++stalls>60){done();return;}}else{stalls=0;lastY=y;}if(p>=1)done();};const iv=setInterval(step,60);let raf=0;setTimeout(done,dur+15000);});})()` });
  await sleep(8000);
  const baseEvt = events.find(e => e.method === 'NW.req');
  const reqs = summariseNet(events, baseEvt ? baseEvt.params.timestamp : 0);
  const fp = (await cdp.send('Runtime.evaluate', { expression: FINGERPRINT_PROBE, returnByValue: true })).result.value;
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(DIR, `screenshot-${o.tag || 'sweep'}-bottom.png`), Buffer.from(shot.data, 'base64'));
  const out = { cmd: 'sweep', url, opts: o, reqsBeforeScroll: beforeSweep, network: reqs, fingerprint: fp, exceptions: consoleMsgs.slice(0, 30), totalTransferKB: Math.round(reqs.reduce((a, r) => a + (r.encodedDataLength || 0), 0) / 1024 * 10) / 10 };
  const outPath = path.join(DIR, `net-${o.tag || 'sweep'}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log('WROTE ' + outPath + ' requests=' + reqs.length + ' transferKB=' + out.totalTransferKB + ' beforeSweep=' + beforeSweep);
  console.log('SCROLL ' + JSON.stringify(sw.result && sw.result.value) + ' vis=' + fp.viewport.iw + 'x' + fp.viewport.ih + ' sh=' + fp.scrollHeight + ' canvasesN=' + (fp.canvases || []).length);
  console.log('CANVASES ' + JSON.stringify(fp.canvases));
  console.log('THREE global? ' + fp.globals.includes('THREE'));
  process.exit(0);
}

async function cmdShot(name) {
  const { cdp } = await connect();
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const p = path.join(DIR, name || 'screenshot.png');
  fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
  console.log('WROTE ' + p);
  process.exit(0);
}

(async () => {
  const settle = opt('settle', '15000');
  switch (cmd) {
    case 'load': await cmdLoad(rest[0], { w: Number(opt('w', '1440')), h: Number(opt('h', '900')), mobile: has('mobile'), dsf: opt('dsf', has('mobile') ? '3' : '1'), ua: opt('ua', has('mobile') ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' : null), reduced: has('reduced'), fresh: has('fresh'), settle, tag: opt('tag', 'desktop') }); break;
    case 'sweep': await cmdSweep(rest[0], { w: Number(opt('w', '1440')), h: Number(opt('h', '900')), mobile: has('mobile'), dsf: opt('dsf', has('mobile') ? '3' : '1'), reduced: has('reduced'), tag: opt('tag', 'sweep') }); break;
    case 'eval': await cmdEval(rest[0]); break;
    case 'fps': await cmdFps(Number(opt('dur', '10000'))); break;
    case 'route': await cmdRoute(rest[0], Number(opt('wait', '6000'))); break;
    case 'webgloff': await cmdWebglOff(Number(settle)); break;
    case 'reduced': await cmdReduced(Number(settle)); break;
    case 'shot': await cmdShot(rest[0]); break;
    default: console.log('unknown cmd ' + cmd); process.exit(2);
  }
})().catch(e => { console.error('DRIVER-ERR ' + (e.message || e)); process.exit(1); });
