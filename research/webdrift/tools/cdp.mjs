// Minimal CDP client for webdrift.be REA probes (Node >=22, native WebSocket).
// Usage:
//   node cdp.mjs eval --port 9333 --target <id> --file expr.js [--out result.json] [--timeout 30000]
//   node cdp.mjs emulate-mobile --port 9333 --target <id>
//   node cdp.mjs wheel --port 9333 --target <id> --seconds 10 --out perf.json
//   node cdp.mjs reload --port 9333 --target <id>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) a[t.slice(2)] = argv[++i];
    else a._.push(t);
  }
  return a;
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  static async connect(port, targetId) {
    const res = await fetch(`http://127.0.0.1:${port}/json`);
    const targets = await res.json();
    const t = targetId
      ? targets.find((x) => x.id === targetId)
      : targets.find((x) => x.type === 'page');
    if (!t) throw new Error('target not found; targets: ' + targets.map((x) => `${x.type}:${x.url}`).join(', '));
    const c = new Cdp(t.webSocketDebuggerUrl);
    await new Promise((res2, rej2) => {
      c.ws.addEventListener('open', res2, { once: true });
      c.ws.addEventListener('error', rej2, { once: true });
    });
    return { cdp: c, target: t };
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject })
    );
  }
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
const port = args.port || '9333';

const { cdp, target } = await Cdp.connect(port, args.target);
await cdp.send('Runtime.enable');
await cdp.send('Page.enable');
await cdp.send('Network.enable');

async function evalInPage(expression, awaitPromise = true, timeoutMs = 30000) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    timeout: timeoutMs,
  });
  if (res.exceptionDetails) {
    throw new Error(
      'page exception: ' +
        (res.exceptionDetails.exception?.description || JSON.stringify(res.exceptionDetails))
    );
  }
  return res.result.value;
}

function save(outPath, value) {
  if (!outPath) return value;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  console.log('saved -> ' + outPath);
  return value;
}

if (cmd === 'eval') {
  const expr = readFileSync(args.file, 'utf8');
  const v = await evalInPage(expr, true, Number(args.timeout || 30000));
  save(args.out, v);
  if (!args.out) console.log(JSON.stringify(v, null, 2));
} else if (cmd === 'reload') {
  await cdp.send('Page.reload', { ignoreCache: false });
  console.log('reload issued on ' + target.url);
} else if (cmd === 'nav') {
  await cdp.send('Page.navigate', { url: args.url });
  console.log('navigate -> ' + args.url);
} else if (cmd === 'media') {
  const features = args.name
    ? [{ name: args.name, value: args.value || 'reduce' }]
    : [];
  await cdp.send('Emulation.setEmulatedMedia', { features });
  console.log('emulated media set: ' + JSON.stringify(features));
} else if (cmd === 'poll-canvas') {
  // Poll for canvas + first stable rAF after a navigation; report ms offsets.
  const out = await evalInPage(`new Promise((resolve) => {
    const t0 = performance.now();
    const state = { navStartRel: Math.round(t0), canvasAt: null, lenisObject: null, threeDrawn: null };
    const iv = setInterval(() => {
      const c = document.querySelector('canvas');
      if (c && !state.canvasAt) {
        state.canvasAt = Math.round(performance.now());
        // first rAF after canvas mount approximates first render loop tick
        let ticks = 0;
        const loop = () => { ticks++; if (ticks === 5) { state.threeDrawn = Math.round(performance.now()); resolve(state); } else requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
      if (performance.now() - t0 > 20000) resolve(state);
    }, 25);
    setTimeout(() => { state.lenisObject = !!window.lenis; }, 500);
  })`);
  save(args.out, out);
  console.log(JSON.stringify(out));
} else if (cmd === 'emulate-mobile') {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 3, mobile: true,
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1 Chrome/157.0.0.0 Mobile Safari/604.1',
    platform: 'iPhone',
  });
  console.log('mobile emulation applied to ' + target.url);
} else if (cmd === 'wheel') {
  const seconds = Number(args.seconds || 10);
  let screencastOn = false;
  if (args.screencast) {
    // Force the compositor to keep producing frames (headless throttling guard).
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 20, maxWidth: 240, maxHeight: 160, everyNthFrame: 1 });
    // ack frames so production continues
    cdp.frameAcks = setInterval(() => {
      for (const ev of cdp.events.splice(0)) {
        if (ev.method === 'Page.screencastFrame') {
          cdp.send('Page.screencastFrameAck', { sessionId: ev.params.sessionId }).catch(() => {});
        }
      }
    }, 50);
    screencastOn = true;
  }
  // Start in-page samplers: rAF frame deltas + longtask observer.
  await evalInPage(`(() => {
    window.__probe = { frames: [], longTasks: [], t0: performance.now() };
    const lo = (ts) => { if (window.__probe) { window.__probe.frames.push(ts); requestAnimationFrame(lo); } };
    requestAnimationFrame(lo);
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__probe.longTasks.push({ start: e.startTime, dur: e.duration })))
        .observe({ entryTypes: ['longtask'] });
    } catch (e) { window.__probe.ltUnsupported = true; }
    return 'armed';
  })()`, false);
  const steps = Math.floor((seconds * 1000) / 100);
  const metrics = await cdp.send('Runtime.evaluate', { expression: '({w:innerWidth,h:innerHeight,dpr:devicePixelRatio,sh:document.documentElement.scrollHeight})', returnByValue: true });
  const dims = metrics.result.value;
  const centerX = Math.floor(dims.w / 2);
  const tEnd = Date.now() + seconds * 1000;
  let down = true;
  let i = 0;
  while (Date.now() < tEnd) {
    const frac = i / steps; // scroll down for first 60%, up for the rest
    const dy = frac < 0.6 ? 400 : -400;
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel', x: centerX, y: Math.floor(dims.h / 2),
      deltaX: 0, deltaY: dy, button: 'none', pointerType: 'mouse',
    });
    down = !down;
    i++;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (screencastOn) { clearInterval(cdp.frameAcks); try { await cdp.send('Page.stopScreencast'); } catch (e) {} }
  const result = await evalInPage(`(() => {
    const p = window.__probe; window.__probe = null;
    const f = p.frames;
    let deltas = [];
    for (let i = 1; i < f.length; i++) deltas.push(f[i] - f[i - 1]);
    deltas = deltas.filter((d) => d > 0 && d < 1000);
    const sum = deltas.reduce((a, b) => a + b, 0);
    const avg = deltas.length ? sum / deltas.length : 0;
    const worst = deltas.length ? Math.max(...deltas) : 0;
    const under50 = deltas.filter((d) => d <= 50).length;
    const under25 = deltas.filter((d) => d <= 25).length;
    const lt = p.longTasks;
    return {
      sampleMs: Math.round(f.length ? f[f.length - 1] - f[0] : 0),
      frames: f.length,
      avgFps: avg ? Math.round(1000 / avg * 10) / 10 : 0,
      p50FrameMs: (() => { const s = [...deltas].sort((a, b) => a - b); return s.length ? Math.round(s[Math.floor(s.length / 2)]) : 0; })(),
      worstFrameMs: Math.round(worst),
      framesWithin25ms: under25,
      framesWithin50ms: under50,
      droppedFramePct: deltas.length ? Math.round((1 - under50 / deltas.length) * 1000) / 10 : 0,
      longTasksOver50: lt.filter((e) => e.dur > 50).length,
      longTasksWorstMs: lt.length ? Math.max(...lt.map((e) => Math.round(e.dur))) : 0,
      longTaskBlockedMs: Math.round(lt.reduce((a, e) => a + e.dur, 0)),
      longtaskObserverSupported: !p.ltUnsupported,
      visibility: document.visibilityState,
      scrollY: Math.round(scrollY),
      scrollHeight: document.documentElement.scrollHeight,
    };
  })()`);
  result.viewport = dims;
  save(args.out, result);
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'click-link') {
  // Click an internal link, watch SPA transition + canvas identity + new network.
  const sel = args.selector || 'a[href$="/work"]';
  const before = await evalInPage(`(() => {
    const c = document.querySelector('canvas');
    window.__c0 = c || null;
    window.__resCount = performance.getEntriesByType('resource').length;
    return { url: location.pathname, hasCanvas: !!c, resCount: window.__resCount,
      vtSupported: typeof document.startViewTransition === 'function' };
  })()`);
  await evalInPage(`(() => { const a = document.querySelector(${JSON.stringify(sel)}); if (!a) throw new Error('no link for ' + ${JSON.stringify(sel)}); a.click(); return location.href; })()`);
  await new Promise((r) => setTimeout(r, Number(args.wait || 3000)));
  const after = await evalInPage(`(() => {
    const c = document.querySelector('canvas');
    const entries = performance.getEntriesByType('resource').slice(window.__resCount);
    return { url: location.pathname, hasCanvas: !!c,
      sameCanvasNode: !!(c && window.__c0 && c === window.__c0),
      canvasVisible: !!(c && (c.offsetParent || c.getClientRects().length)),
      newResources: entries.map((r) => r.name.split('/').pop().slice(0, 70)).slice(0, 12),
      textStart: (document.body.innerText || '').slice(0, 220) };
  })()`);
  const result = { before, after, link: sel };
  save(args.out, result);
  console.log(JSON.stringify(result, null, 2));
} else {
  console.error('unknown command: ' + cmd);
  process.exit(2);
}
cdp.ws.close();
process.exit(0);
