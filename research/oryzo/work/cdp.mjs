// CDP helper for oryzo.ai motion research. Usage:
//   node cdp.mjs net <port> <out.json> <waitMs> [reduce]
//   node cdp.mjs scrollperf <port> <out.json> <durationMs>
//   node cdp.mjs route <port> <out.json> <selector>
//   node cdp.mjs dom <port> <out.json>
import { writeFileSync } from 'node:fs';

const [, , mode, portArg, outPath, ...rest] = process.argv;
const base = `http://127.0.0.1:${portArg}`;

const page = await (await fetch(`${base}/json`)).json()
  .then(list => list.find(t => t.type === 'page' && t.url.includes('oryzo'))
    || list.find(t => t.type === 'page' && /^https?:/.test(t.url)));
if (!page) { console.error('no page target'); process.exit(2); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
const listeners = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  } else if (msg.method) {
    for (const l of listeners) l(msg);
  }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params }));
});
const on = (fn) => listeners.push(fn);
const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
};

await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');

if (mode === 'net') {
  const [waitMs, flag] = rest;
  if (flag === 'reduce') {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  }
  if (flag === 'mobile') {
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', platform: 'iPhone' });
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__longtasks = [];
    window.__canvasEvents = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__longtasks.push({ s: +e.startTime.toFixed(1), d: +e.duration.toFixed(1) }); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
    try {
      const mo = new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType === 1) {
          if (n.tagName === 'CANVAS') window.__canvasEvents.push({ t: +performance.now().toFixed(1), ev: 'canvas-added', id: n.id || '', cls: (n.className || '').toString().slice(0, 60) });
          if (n.tagName === 'VIDEO') window.__canvasEvents.push({ t: +performance.now().toFixed(1), ev: 'video-added', src: (n.currentSrc || n.src || '').slice(-80) });
          if (n.tagName === 'MODEL-VIEWER') window.__canvasEvents.push({ t: +performance.now().toFixed(1), ev: 'model-viewer-added' });
          const cs = n.querySelectorAll ? n.querySelectorAll('canvas,video,model-viewer') : [];
          for (const c of cs) window.__canvasEvents.push({ t: +performance.now().toFixed(1), ev: c.tagName.toLowerCase() + '-added-subtree', id: c.id || '' });
        }
      } });
      mo.observe(document, { childList: true, subtree: true });
    } catch (e) {}
  ` });
  const net = new Map(); // requestId -> record
  let firstTs = null;
  let loadEventFiredAt = null;
  let domContentFiredAt = null;
  on((msg) => {
    const m = msg.method;
    if (m === 'Network.requestWillBeSent') {
      if (firstTs === null) firstTs = msg.params.timestamp;
      net.set(msg.params.requestId, {
        url: msg.params.request.url, method: msg.params.request.method,
        type: msg.params.type || null, startTsMs: null, status: null,
        encodedDataLength: null, fromCache: false, mimeType: null,
        contentEncoding: null, initiator: msg.params.initiator?.type || null,
      });
    } else if (m === 'Network.responseReceived') {
      const r = net.get(msg.params.requestId);
      if (r) {
        r.status = msg.params.response.status;
        r.mimeType = msg.params.response.mimeType;
        r.contentEncoding = msg.params.response.headers['content-encoding'] || msg.params.response.headers['Content-Encoding'] || null;
      }
    } else if (m === 'Network.loadingFinished') {
      const r = net.get(msg.params.requestId);
      if (r) { r.encodedDataLength = msg.params.encodedDataLength; }
    } else if (m === 'Network.loadingFailed') {
      const r = net.get(msg.params.requestId);
      if (r) { r.failed = msg.params.errorText; }
    } else if (m === 'Network.requestServedFromCache') {
      const r = net.get(msg.params.requestId);
      if (r) { r.fromCache = true; }
    } else if (m === 'Page.domContentEventFired') {
      domContentFiredAt = (msg.params.timestamp - firstTs) * 1000;
    } else if (m === 'Page.loadEventFired') {
      loadEventFiredAt = (msg.params.timestamp - firstTs) * 1000;
    }
  });
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, Number(waitMs)));
  // compute start times relative to first request
  // (approximate navigation start; resource timing below gives exact ms)
  const perf = await evalJs(`(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paints = performance.getEntriesByType('paint').map(p => ({ name: p.name, t: +p.startTime.toFixed(1) }));
    let lcp = null;
    try { lcp = performance.getEntriesByType('largest-contentful-paint').map(e => ({ t: +e.startTime.toFixed(1), tag: e.element ? e.element.tagName : null, txt: (e.element && e.element.textContent || '').trim().slice(0, 60) })); } catch (e) {}
    const res = performance.getEntriesByType('resource').map(e => ({
      name: e.name, init: e.initiatorType, start: +e.startTime.toFixed(1),
      end: +Math.min(e.responseEnd, 30000).toFixed(1), dur: +Math.min(e.duration, 30000).toFixed(1),
      transfer: e.transferSize, encoded: e.encodedBodySize, decoded: e.decodedBodySize,
    }));
    return {
      timeOrigin: nav.startTime, navigationType: nav.type,
      domInteractive: nav.domInteractive ? +nav.domInteractive.toFixed(1) : null,
      domContentLoaded: nav.domContentLoadedEventEnd ? +nav.domContentLoadedEventEnd.toFixed(1) : null,
      loadEnd: nav.loadEventEnd ? +nav.loadEventEnd.toFixed(1) : null,
      paints, lcp, res,
      longtasks: window.__longtasks || [],
      canvasEvents: window.__canvasEvents || [],
      canvasCtxTypes: [...document.querySelectorAll('canvas')].map(c => { const names = []; for (const k of ['webgl2','webgl','2d']) { try { const ctx = c.getContext(k); if (ctx) names.push(k); } catch(e){} } return names; }),
    };
  })()`);
  const records = [...net.values()].map(r => ({ ...r, startTsMs: null }));
  writeFileSync(outPath, JSON.stringify({ mode, viewport: 'see-launch', perf, records, milestones: { domContentLoadedFiredAtMs: domContentFiredAt, loadEventFiredAtMs: loadEventFiredAt } }, null, 1));
  console.log('net capture written:', outPath, 'records:', records.length);

} else if (mode === 'scrollperf') {
  const [durMs, fracArg] = rest;
  const frac = fracArg ? Number(fracArg) : 1;
  await send('Network.enable');
  const scrollReqs = [];
  const t0wall = Date.now();
  on((msg) => {
    if (msg.method === 'Network.requestWillBeSent') {
      const u = msg.params.request.url;
      if (!/cloudflareinsights/.test(u)) scrollReqs.push({ t: Date.now() - t0wall, url: u.replace('https://oryzo.ai', ''), type: msg.params.type || '' });
    }
  });
  const out = await evalJs(`(async () => {
    const D = ${Number(durMs)};
    const lt = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push(+e.duration.toFixed(1)); }).observe({ type: 'longtask', buffered: false }); } catch (e) {}
    await new Promise(r => requestAnimationFrame(r));
    const doc = document.documentElement;
    const maxScroll = Math.max(0, (doc.scrollHeight - window.innerHeight));
    const gaps = [];
    let last = performance.now();
    const t0 = last;
    let frames = 0;
    while (performance.now() - t0 < D) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now();
      gaps.push(+(now - last).toFixed(2));
      last = now;
      frames++;
      const p = Math.min(1, (now - t0) / D) * ${frac};
      window.scrollTo(0, Math.round(maxScroll * p));
    }
    gaps.sort((a, b) => a - b);
    const elapsed = performance.now() - t0;
    const worst = gaps.slice(-8);
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      scrollHeight: doc.scrollHeight, maxScroll,
      frames, elapsedMs: +elapsed.toFixed(1),
      avgFps: +(frames / (elapsed / 1000)).toFixed(1),
      worstGapMs: gaps[gaps.length - 1],
      p95GapMs: gaps[Math.floor(gaps.length * 0.95)],
      gapsOver50ms: gaps.filter(g => g > 50).length,
      gapsOver100ms: gaps.filter(g => g > 100).length,
      worstGaps: worst,
      longtasksDuringScroll: lt,
      longtaskCount: lt.length,
      canvasPresent: document.querySelectorAll('canvas').length,
      endedAtY: window.scrollY,
    };
  })()`);
  const extra = await evalJs(`(() => ({
    dataEngine: (document.getElementById('canvas') || {}).getAttribute ? document.getElementById('canvas').getAttribute('data-engine') : null,
    preloaderStillInDom: !!document.getElementById('preloader-canvas'),
    scrollHeight: document.documentElement.scrollHeight,
  }))()`).catch(e => ({ error: String(e) }));
  writeFileSync(outPath, JSON.stringify({ ...out, networkDuringScroll: scrollReqs, extra }, null, 1));
  console.log('scrollperf written:', outPath);

} else if (mode === 'route') {
  const [selector] = rest;
  const result = await evalJs(`(async () => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { error: 'selector not found: ${selector}' };
    const before = {
      url: location.href,
      canvases: document.querySelectorAll('canvas').length,
      title: document.title,
      astroVT: !!document.querySelector('meta[name="astro-view-transitions-enabled"]'),
    };
    window.__probeMarker = 'probe-' + Math.random().toString(36).slice(2);
    window.__vtCount = 0;
    const orig = document.startViewTransition ? document.startViewTransition.bind(document) : null;
    if (orig) { try { document.startViewTransition = (...a) => { window.__vtCount++; return orig(...a); }; } catch (e) {} }
    el.click();
    await new Promise(r => setTimeout(r, 6000));
    const after = {
      url: location.href,
      title: document.title,
      canvases: document.querySelectorAll('canvas').length,
      markerSurvived: window.__probeMarker !== undefined,
      vtCount: window.__vtCount || 0,
      readyState: document.readyState,
    };
    return { before, after, linkText: (el.textContent || '').trim().slice(0, 40), href: el.getAttribute('href') };
  })()`);
  writeFileSync(outPath, JSON.stringify(result, null, 1));
  console.log('route written:', outPath);

} else if (mode === 'glinfo') {
  const out = await evalJs(`(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return { webgl: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      webgl: true,
      vendor: gl.getParameter(gl.VENDOR),
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
    };
  })()`);
  writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log('glinfo written:', outPath);
} else if (mode === 'dom') {
  const out = await evalJs(`(() => {
    const metas = {};
    for (const m of document.querySelectorAll('meta')) { const k = m.getAttribute('name') || m.getAttribute('property'); if (k && !metas[k]) metas[k] = m.getAttribute('content'); }
    const globals = {};
    for (const g of ['THREE','gsap','ScrollTrigger','Lenis','LocomotiveScroll','Rive','lottie','__NEXT_DATA__','__NUXT__','jQuery','pixi','BABYLON','Theatre']) { try { globals[g] = typeof window[g] !== 'undefined'; } catch (e) {} }
    const links = [...document.querySelectorAll('a[href]')].map(a => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 40) }));
    return {
      url: location.href, title: document.title,
      readyState: document.readyState,
      metas, globals,
      viewportMeta: (document.querySelector('meta[name="viewport"]') || {}).content || null,
      canvases: [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, cls: (c.className||'').toString().slice(0,80), w: c.width, h: c.height, inShadow: false, fixed: getComputedStyle(c).position })),
      ctxProbe: [...document.querySelectorAll('canvas')].map(c => { const names = []; for (const k of ['webgl2','webgl','2d','webgpu']) { try { if (c.getContext(k)) names.push(k); } catch(e){} } return names.join(','); }),
      videos: [...document.querySelectorAll('video')].map(v => ({ src: (v.currentSrc || v.src || '').slice(-100), autoplay: v.autoplay, muted: v.muted, loop: v.loop, playsinline: v.playsInline, w: v.videoWidth, paused: v.paused, cls: (v.className||'').toString().slice(0,60) })),
      astroIslands: [...document.querySelectorAll('astro-island')].map(i => ({ component: i.getAttribute('component-url') || '', client: i.getAttribute('client') || '', props: (i.getAttribute('props') || '').slice(0, 200) })),
      scripts: [...document.querySelectorAll('script[src]')].map(s => s.src),
      inlineScriptCount: document.querySelectorAll('script:not([src])').length,
      bodyTextLen: (document.body.innerText || '').length,
      headings: [...document.querySelectorAll('h1,h2,h3')].slice(0, 20).map(h => h.tagName + ': ' + (h.textContent || '').trim().slice(0, 60)),
      navLinks: links.filter(l => l.href && !l.href.startsWith('#') && !l.href.startsWith('mailto') && !l.href.startsWith('http')),
      reducedMotionMedia: matchMedia('(prefers-reduced-motion: reduce)').matches,
      startViewTransitionExists: typeof document.startViewTransition === 'function',
      videoPlaybackRateSample: [...document.querySelectorAll('video')].map(v => v.playbackRate),
    };
  })()`);
  writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log('dom written:', outPath);
}
ws.close();
process.exit(0);
