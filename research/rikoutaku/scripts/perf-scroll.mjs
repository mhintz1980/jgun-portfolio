// 10s top-to-bottom scroll perf sample: rAF deltas + longtask observer, via CDP evaluate.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.argv[2] ?? 9777;
const outPath = resolve(here, '../data/perf-scroll.json');

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page' && /rikoutaku\.work/.test(t.url) && !/\/about|\/projects/.test(t.url)) ?? list.find(t => t.type === 'page' && /rikoutaku\.work/.test(t.url));
if (!page) { console.error('NO_TARGET'); process.exit(1); }
console.log('TARGET:', page.url);
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej, method }); ws.send(JSON.stringify({ id, method, params })); });
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ' -> ' + JSON.stringify(m.error))) : p.res(m.result); } });
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await new Promise(r => setTimeout(r, 300));

const expr = `(async () => {
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 600));
  const longtasks = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) longtasks.push(+e.duration.toFixed(1)); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const t0 = performance.now(); const DUR = 10000;
  let frames = 0, worst = 0, sum = 0, n = 0;
  await new Promise(done => {
    let last = performance.now();
    const step = (now) => {
      const d = now - last; last = now;
      frames++; n++; sum += d; if (d > worst) worst = d;
      const p = Math.min(1, (now - t0) / DUR);
      window.scrollTo(0, Math.round(p * max));
      if (p >= 1) { done(); } else { requestAnimationFrame(step); }
    };
    requestAnimationFrame(step);
  });
  const wall = performance.now() - t0;
  window.scrollTo(0, 0);
  return JSON.stringify({ wallMs: +wall.toFixed(0), frames, avgFps: +(frames / (wall / 1000)).toFixed(1), avgFrameMs: +(sum / n).toFixed(2), worstFrameMs: +worst.toFixed(1), longTasks: longtasks, longTaskCount: longtasks.length, worstLongTaskMs: longtasks.length ? +Math.max(...longtasks).toFixed(1) : 0, scrollRangePx: max, scrollHeight: document.documentElement.scrollHeight });
})()`;

const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 20000 });
const data = JSON.parse(r.result.value);
// JS transferred from earlier network captures is merged into the report manually.
writeFileSync(outPath, JSON.stringify(data, null, 1));
console.log(JSON.stringify(data, null, 1));
ws.close(); process.exit(0);
