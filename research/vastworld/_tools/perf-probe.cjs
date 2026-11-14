// CDP probe for own Chrome instance (vastworld research).
// Usage: node perf-probe.cjs <port> <mode> [seconds]
// modes: globals | perf <seconds> | console2
const http = require('http');

const port = process.argv[2];
const mode = process.argv[3] || 'globals';
const seconds = parseFloat(process.argv[4] || '10');

function getJSON(path) {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port, path }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
}

async function main() {
  const targets = await getJSON('/json/list');
  const page = targets.find(t => t.type === 'page' && /vastworld\.ai/.test(t.url));
  if (!page) { console.log('NO_PAGE', JSON.stringify(targets.map(t => t.url))); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    else if (m.method) events.push(m);
  };
  await new Promise(r => { ws.onopen = r; });
  await send('Runtime.enable');
  await send('Log.enable');

  const evalJS = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { EXC: JSON.stringify(r.exceptionDetails).slice(0, 300) };
    return r.result.value;
  };

  if (mode === 'globals') {
    const out = await evalJS(`(() => {
      const g = {};
      g.title = document.title;
      g.scrollY = window.scrollY;
      g.docHeight = document.documentElement.scrollHeight;
      g.gsap = !!window.gsap; if (window.gsap) { g.gsapVersion = window.gsap.version; g.gsapKeys = Object.keys(window.gsap).slice(0, 40); g.gsapGlobals = Object.keys(window.GreenSockGlobals || {}); }
      try { if (window.gsap && gsap.globalTimeline) {} } catch(e){}
      g.lenis = !!window.lenis; if (window.lenis) { g.lenisVersion = window.lenis.version; g.lenisKeys = Object.keys(window.lenis); }
      g.THREE = !!window.THREE;
      const canvases = [...document.querySelectorAll('canvas')].map(c => ({ w: c.width, h: c.height, engine: c.getAttribute('data-engine'), id: c.id || null, dataAttrs: [...c.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value) }));
      g.canvases = canvases;
      const bg = document.querySelector('[data-webgl-background]');
      g.bgCtx = bg ? (bg.getContext('webgl2') ? 'webgl2' : (bg.getContext('webgl') ? 'webgl' : 'none-or-taken')) : 'no-canvas';
      const test = document.createElement('canvas');
      const gl2 = test.getContext('webgl2') || test.getContext('webgl');
      if (gl2) { const dbg = gl2.getExtension('WEBGL_debug_renderer_info'); g.gpu = dbg ? gl2.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl2.getParameter(gl2.RENDERER); }
      else g.gpu = null;
      g.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      g.metaViewport = document.querySelector('meta[name=viewport]')?.content || null;
      g.h1 = document.getElementById('heroTitleLanding')?.getAttribute('aria-label') || null;
      g.barbaNamespace = document.querySelector('[data-barba="container"]')?.getAttribute('data-barba-namespace') || null;
      g.workerCount = performance.getEntriesByType ? 'n/a' : 'n/a';
      return g;
    })()`);
    console.log(JSON.stringify(out, null, 1));
  } else if (mode === 'perf') {
    await send('Page.enable');
    await send('Page.bringToFront');
    await new Promise(r => setTimeout(r, 1000));
    // install longtask observer + rAF sampler
    console.error('installing');
    await evalJS(`(() => {
      window.__probe = { frames: [], longtasks: [], start: performance.now(), scrolls: [] };
      let last = performance.now();
      const loop = t => { window.__probe.frames.push(t - last); last = t; if (t - window.__probe.start < ${seconds * 1000 + 2000}) requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.__probe.longtasks.push({ s: e.startTime, d: e.duration }); }).observe({ entryTypes: ['longtask'] });
      window.__probe.tick = () => { const w = document.querySelector('#scroll-container'); window.__probe.scrolls.push(Math.round(w ? w.scrollTop : window.scrollY)); };
    })()`);
    const steps = Math.max(1, Math.floor(seconds / 0.5));
    const started = Date.now();
    for (let i = 0; i < steps * 2; i++) {
      // wheel scroll burst every 250ms (drives Lenis virtual scroll)
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 700, y: 450, deltaX: 0, deltaY: 260 });
      await new Promise(r => setTimeout(r, 250));
      if (i % 4 === 0) await evalJS('window.__probe.tick()');
    }
    const wall = Date.now() - started;
    const data = await evalJS('window.__probe && JSON.stringify({frames: window.__probe.frames, longtasks: window.__probe.longtasks, scrolls: window.__probe.scrolls})');
    const parsed = JSON.parse(data);
    const f = parsed.frames.slice(2);
    const sorted = [...f].sort((a, b) => a - b);
    const avg = f.reduce((a, b) => a + b, 0) / f.length;
    const fpsAvg = 1000 / avg;
    const worstFrame = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const lt = parsed.longtasks;
    const worstLt = lt.reduce((m, e) => Math.max(m, e.d), 0);
    console.log(JSON.stringify({
      wallMs: wall, frames: f.length, avgFrameMs: +avg.toFixed(2), fpsAvg: +fpsAvg.toFixed(1),
      fpsWorst: +(1000 / worstFrame).toFixed(1), frameP95ms: +p95.toFixed(2),
      longtasks: lt.length, worstLongtaskMs: +worstLt.toFixed(1),
      longtasksOver50: lt.filter(e => e.d > 50).length,
      longtasksOver200: lt.filter(e => e.d > 200).length,
      scrollTrace: parsed.scrolls
    }, null, 1));
  } else if (mode === 'console2') {
    const started = Date.now();
    await new Promise(r => setTimeout(r, seconds * 1000));
    for (const m of events) {
      if (m.method === 'Runtime.consoleAPICalled') {
        const args = (m.params.args || []).map(a => a.value !== undefined ? JSON.stringify(a.value) : (a.description || a.type)).join(' ');
        console.log('CONSOLE[' + m.params.type + ']', args.slice(0, 300));
      } else if (m.method === 'Log.entryAdded') {
        console.log('LOG[' + m.params.entry.level + ']', String(m.params.entry.text).slice(0, 300), m.params.entry.url || '');
      } else if (m.method === 'Runtime.exceptionThrown') {
        console.log('EXC', JSON.stringify(m.params.exceptionDetails).slice(0, 300));
      }
    }
  }
  ws.close();
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
