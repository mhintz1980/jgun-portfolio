// REA-fallback CDP capture driver (zero deps, Node 22 built-in WebSocket).
// Usage: node capture.mjs --out=../data/desktop.json --shot=../data/desktop.png [--mobile] [--settle=8000]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const outPath = resolve(here, args.out ?? '../data/capture.json');
const shotPath = resolve(here, args.shot ?? '../data/capture.png');
const settle = Number(args.settle ?? 8000);
const mobile = !!args.mobile;
const PORT = args.port ?? 9777;

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page' && /rikoutaku\.work/.test(t.url));
if (!page) { console.error('NO_TARGET'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
const events = [];
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej, method });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(p.method + ' -> ' + JSON.stringify(msg.error))) : p.res(msg.result); }
  else if (msg.method) events.push(msg);
});
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

for (const m of [['Page.enable', {}], ['Network.enable', {}], ['Runtime.enable', {}], ['Performance.enable', {}], ['Log.enable', {}]]) {
  try { await send(m[0], m[1]); } catch (e) { console.error('setup failed:', m[0], e.message); }
}

if (mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Network.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36',
    platform: 'Android mobile'
  });
}

// Network records keyed by requestId
const net = new Map();
let t0Wall = null, loadFired = null, dclFired = null;
const consoleMsgs = [];

ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (!msg.method) return;
  const { method, params } = msg;
  if (method === 'Network.requestWillBeSent') {
    if (t0Wall === null && params.request.url.startsWith('http')) t0Wall = params.wallTime;
    net.set(params.requestId, {
      url: params.request.url, method: params.request.method, type: params.type ?? null,
      initiator: params.initiator?.type ?? null,
      tRelMs: (params.wallTime - t0Wall) * 1000,
      headers: params.request.headers
    });
  } else if (method === 'Network.responseReceived') {
    const r = net.get(params.requestId);
    if (r) { Object.assign(r, { status: params.response.status, mimeType: params.response.mimeType, fromCache: params.response.fromDiskCache ?? false, fromSvc: params.response.fromServiceWorker ?? false, protocol: params.response.protocol ?? null, contentEncoding: params.response.headers?.['content-encoding'] ?? params.response.headers?.['Content-Encoding'] ?? null, contentLengthHdr: params.response.headers?.['content-length'] ?? params.response.headers?.['Content-Length'] ?? null }); }
  } else if (method === 'Network.loadingFinished') {
    const r = net.get(params.requestId);
    if (r) { r.transferred = params.encodedDataLength; r.finishedMs = (params.timestamp - (t0Wall + 0)) * 1000; r.chunked = params.encodedDataLength > 0; r.blockedCrossOrigin = false; }
  } else if (method === 'Network.loadingFailed') {
    const r = net.get(params.requestId);
    if (r) { r.failed = true; r.errorText = params.errorText; r.blocked = params.blockedReason ?? null; }
  } else if (method === 'Page.loadEventFired') { loadFired = true; }
  else if (method === 'Page.domContentEventFired') { dclFired = true; }
  else if (method === 'Runtime.consoleAPICalled') { consoleMsgs.push({ type: params.type, tRelMs: t0Wall ? (params.timestamp / 1000 - t0Wall) * 1000 : null, text: (params.args ?? []).map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300) }); }
  else if (method === 'Log.entryAdded') { consoleMsgs.push({ type: params.entry.level, text: String(params.entry.text).slice(0, 300) }); }
});

// reload for a clean load capture
await send('Page.reload', { ignoreCache: true });
await new Promise(r => setTimeout(r, settle + 4000));

// page-state probes
const probe = await send('Runtime.evaluate', {
  expression: `(() => {
    const c = document.querySelector('canvas');
    const res = performance.getEntriesByType('resource').map(e => ({
      name: e.name, init: e.initiatorType, start: +e.startTime.toFixed(1), dur: +e.duration.toFixed(1),
      transfer: e.transferSize, enc: e.encodedBodySize, dec: e.decodedBodySize
    }));
    const nav = performance.getEntriesByType('navigation')[0];
    return JSON.stringify({
      paint: performance.getEntriesByType('paint').map(e => ({ name: e.name, t: +e.startTime.toFixed(1) })),
      lcp: (performance.getEntriesByType('largest-contentful-paint') ?? []).slice(-1).map(e => +e.startTime.toFixed(1))[0] ?? null,
      title: document.title,
      engine: c ? c.getAttribute('data-engine') : null,
      canvases: [...document.querySelectorAll('canvas')].map(x => ({ w: x.width, h: x.height, engine: x.getAttribute('data-engine'), cssPos: getComputedStyle(x).position })),
      globals: Object.fromEntries(['gsap','THREE','Lenis','LocomotiveScroll','ScrollTrigger','__NUXT__','__NEXT_DATA__','__ASTRO__','Vue','React','jQuery','Barba','Swup','Howl','Rive','rive','lottie','Theatre','SplitType','ScrollSmoother','Dragscroll','_virtual_scroll'].map(k => [k, typeof window[k]])),
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
      prefersReduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      navType: nav ? nav.type : null,
      htmlAttrs: document.documentElement.getAttributeNames(),
      bodyChildClasses: [...document.body.children].map(el => el.tagName + '.' + (el.className && typeof el.className === 'string' ? el.className.split(' ').slice(0,3).join('.') : '')).slice(0, 25),
      scrollHeight: document.documentElement.scrollHeight,
      innerW: innerWidth, innerH: innerHeight, dpr: devicePixelRatio,
      resources: res
    });
  })()`,
  returnByValue: true, awaitPromise: false
});

const perf = await send('Performance.getMetrics');
const navEntry = await send('Runtime.evaluate', { expression: `JSON.stringify(performance.getEntriesByType('navigation')[0])`, returnByValue: true });
const pageStateJson = probe.result?.value ?? '{}';
const navJson = navEntry.result?.value ?? '{}';

// screenshot
const shot = await send('Page.captureScreenshot', { format: 'png' });

mkdirSync(dirname(outPath), { recursive: true });
mkdirSync(dirname(shotPath), { recursive: true });
writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

const out = {
  meta: { mobile, settle, ua: (await send('Runtime.evaluate', { expression: 'navigator.userAgent', returnByValue: true })).result.value, viewport: mobile ? '390x844@3x (emulated)' : '1440x900 (native window)', capturedAt: new Date().toISOString(), targetUrl: page.url },
  timing: { t0Wall, loadEventFired: loadFired, domContentEventFired: dclFired, metrics: perf.metrics.filter(m => ['NavigationStart','DOMContentLoadEventEnd','LoadEventEnd','FirstPaint','FirstContentfulPaint','TimeToInteractive','TaskDurationMs'].includes(m.name)) },
  navigation: JSON.parse(navJson),
  network: [...net.values()].map(r => ({ ...r, headers: undefined })),
  networkCount: net.size,
  console: consoleMsgs.slice(0, 80),
  page: JSON.parse(pageStateJson)
};
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log('WROTE', outPath, 'network records:', net.size);
ws.close();
process.exit(0);
