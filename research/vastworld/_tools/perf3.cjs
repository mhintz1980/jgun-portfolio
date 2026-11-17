// CDP perf probe v3: reset scroll, then rAF/longtask sampling while wheel-scrolling for N seconds.
// Usage: node perf3.cjs <port> <targetId> <seconds>
const http = require('http');
const port = parseInt(process.argv[2] || '9555');
const targetId = process.argv[3];
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

setTimeout(() => { console.error('WATCHDOG'); process.exit(3); }, (seconds + 40) * 1000);

async function main() {
  const targets = await getJSON('/json/list');
  const page = targetId ? targets.find(t => t.id === targetId) : targets.find(t => t.type === 'page' && /vastworld\.ai/.test(t.url));
  if (!page) { console.error('NO_PAGE'); process.exit(1); }
  console.error('target', page.url.slice(0, 80));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const reports = [];
  const consoleLines = [];
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    else if (m.method === 'Runtime.bindingCalled' && m.params.name === '__vastReport') {
      try { reports.push(JSON.parse(m.params.payload)); } catch (e) { console.error('BAD_PAYLOAD'); }
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const args = (m.params.args || []).map(a => a.value !== undefined ? JSON.stringify(a.value) : (a.description || a.type)).join(' ');
      consoleLines.push('CONSOLE[' + m.params.type + '] ' + args.slice(0, 240));
    } else if (m.method === 'Log.entryAdded') {
      consoleLines.push('LOG[' + m.params.entry.level + '] ' + String(m.params.entry.text).slice(0, 240) + ' ' + (m.params.entry.url || ''));
    }
  };
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Runtime.addBinding', { name: '__vastReport' });
  await send('Page.bringToFront');
  await new Promise(r => setTimeout(r, 500));

  // preflight: page facts + reset scroll to top
  const facts = await send('Runtime.evaluate', {
    expression: `(() => {
      const w = document.querySelector('#scroll-container');
      if (w) w.scrollTop = 0; else window.scrollTo(0, 0);
      const canvases = [...document.querySelectorAll('canvas')].map(c => ({
        id: c.id || null, w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight,
        visible: !!c.offsetParent, cls: (c.className || '').toString().slice(0, 80)
      }));
      return JSON.stringify({
        innerW: innerWidth, innerH: innerHeight, dpr: devicePixelRatio,
        scrollContainer: !!w, scrollTop: w ? w.scrollTop : -1,
        scrollH: w ? w.scrollHeight : document.body.scrollHeight,
        canvases,
        gl: (() => { try { const t = document.createElement('canvas'); return !!(t.getContext('webgl2') || t.getContext('webgl')); } catch (e) { return false; } })(),
        lenisVersion: window.lenis && window.lenis.version, lenisGlobal: typeof window.lenis,
        threeGlobal: typeof window.THREE, gsapGlobal: typeof window.gsap,
        barbaGlobal: typeof window.barba,
        h1s: [...document.querySelectorAll('h1,h2')].slice(0, 6).map(e => (e.textContent || '').trim().slice(0, 40)),
        bodyTextLen: (document.body.innerText || '').length,
        bodyTextSample: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 400)
      });
    })()`, returnByValue: true
  });
  let factsObj = null;
  try { factsObj = JSON.parse(facts.result.value); } catch (e) { console.error('FACTS_PARSE', facts.result && facts.result.value); }
  console.error('facts ok, scroll reset to top, waiting 1.2s');
  await new Promise(r => setTimeout(r, 1200));

  const install = `(() => {
    window.__v = { last: performance.now(), frames: [], longtasks: [], scroll: [] };
    const loop = t => { window.__v.frames.push(t - window.__v.last); window.__v.last = t; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__v.longtasks.push({ s: Math.round(e.startTime), d: Math.round(e.duration) }); }).observe({ entryTypes: ['longtask'] });
    window.__v.driver = setInterval(() => {
      const w = document.querySelector('#scroll-container');
      if (w) w.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, deltaX: 0, bubbles: true, cancelable: true }));
    }, 250);
    setInterval(() => { const w = document.querySelector('#scroll-container'); try { window.__vastReport(JSON.stringify({ t: Math.round(performance.now()), st: Math.round(w ? w.scrollTop : -1), frames: window.__v.frames.splice(0), longtasks: window.__v.longtasks.splice(0) })); } catch (e) {} }, 500);
    return 'ok';
  })()`;
  ws.send(JSON.stringify({ id: ++id, method: 'Runtime.evaluate', params: { expression: install, returnByValue: true } }));

  const tWheel0 = Date.now();
  await new Promise(r => setTimeout(r, seconds * 1000));
  console.error('scroll window done wall=' + (Date.now() - tWheel0));
  await new Promise(r => setTimeout(r, 2500));

  const frames = [];
  const longtasks = [];
  const trace = [];
  for (const rep of reports) {
    frames.push(...rep.frames.filter(f => f > 0 && f < 5000));
    longtasks.push(...rep.longtasks);
    trace.push(rep.st);
  }
  frames.sort((a, b) => a - b);
  const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : NaN;
  const out = {
    facts: factsObj,
    samples: reports.length, framesSampled: frames.length,
    avgFrameMs: +avg.toFixed(2), fpsAvg: isFinite(avg) ? +(1000 / avg).toFixed(1) : null,
    fpsWorst: frames.length ? +(1000 / frames[frames.length - 1]).toFixed(1) : null,
    fpsBest: frames.length ? +(1000 / frames[0]).toFixed(1) : null,
    frameP95ms: frames.length ? +frames[Math.floor(frames.length * 0.95)].toFixed(2) : null,
    longtasks: longtasks.length,
    longtasksOver50: longtasks.filter(e => e.d > 50).length,
    longtasksOver200: longtasks.filter(e => e.d > 200).length,
    worstLongtaskMs: longtasks.reduce((m, e) => Math.max(m, e.d), 0),
    scrollStart: trace[0], scrollEnd: trace[trace.length - 1], scrollMonotonic: trace.every((v, i) => i === 0 || v >= trace[i - 1]),
    scrollTrace: trace,
    console: consoleLines.slice(0, 20)
  };
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
