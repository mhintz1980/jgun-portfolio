// Route transition recorder: click first internal nav link, record events/DOM/network/screenshots.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.argv[2] ?? 9777;
const outdir = resolve(here, '../data/transition');
mkdirSync(outdir, { recursive: true });

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page' && /rikoutaku\.work/.test(t.url));
if (!page) { console.error('NO_TARGET'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const attempt = (n) => {
    const id = ++msgId;
    pending.set(id, { res, rej, method });
    try { ws.send(JSON.stringify({ id, method, params })); }
    catch (e) { pending.delete(id); if (n < 2) setTimeout(() => attempt(n + 1), 250); else rej(new Error(method + ' send failed: ' + e.message)); }
  };
  attempt(0);
});
const eventsLog = [];
const netLog = [];
let t0 = null;
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ' -> ' + JSON.stringify(m.error))) : p.res(m.result); return; }
  if (!m.method) return;
  const ts = Date.now();
  if (t0 === null) t0 = ts;
  const rec = { t: ts - t0, method: m.method };
  if (m.method === 'Page.frameStartedLoading' || m.method === 'Page.frameStoppedLoading' || m.method === 'Page.navigatedWithinDocument') rec.frame = m.params.frameId;
  if (m.method === 'Page.frameNavigated') { rec.frame = m.params.frame?.frameId; rec.url = m.params.frame?.url; }
  if (m.method === 'Network.requestWillBeSent') rec.url = m.params.request.url;
  if (m.method === 'Network.requestServedFromCache') rec.cached = true;
  eventsLog.push(rec);
});
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await new Promise(r => setTimeout(r, 300));
await send('Page.enable'); await send('Network.enable');

const shot = async (name) => {
  const s = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(resolve(outdir, name), Buffer.from(s.data, 'base64'));
};
const state = () => send('Runtime.evaluate', {
  expression: `JSON.stringify({href:location.href, htmlClass:document.documentElement.className, curtain:!!document.querySelector('.ri-curtain'), canvas:!!document.querySelector('canvas'), canvasTagged:(c=>c&&c.__rik||null)(document.querySelector('canvas')), heroVisible:(h=>h?getComputedStyle(h).opacity:null)(document.querySelector('[data-motion-system]')), bodyScroll:scrollY})`,
  returnByValue: true
}).then(r => JSON.parse(r.result.value)).catch(e => ({ err: e.message }));

await shot('0-before.png');
const s0 = await state();
// tag the canvas node
await send('Runtime.evaluate', { expression: `const c=document.querySelector('canvas'); if(c) c.__rik='original-canvas'; 'tagged'`, returnByValue: true });

// click the About nav link
const clickResult = await send('Runtime.evaluate', {
  expression: `(() => { const a=document.querySelector('header a[href="/about.html"], a[href="/about.html"]'); if(!a) return 'NO_LINK'; a.click(); return 'clicked ' + a.getAttribute('href'); })()`,
  returnByValue: true
});

const samples = [];
const dt = [80, 200, 400, 700, 1000, 1500, 2500, 4000, 6000];
let prev = 0;
for (const d of dt) {
  await new Promise(r => setTimeout(r, d - prev)); prev = d;
  const st = await state();
  st.atMs = d;
  samples.push(st);
  if (d === 200 || d === 700 || d === 1500 || d === 4000) await shot(d + '-mid.png');
}
await shot('9-after.png');
const sEnd = await state();

writeFileSync(resolve(outdir, 'transition.json'), JSON.stringify({ click: clickResult.result.value, start: s0, samples, end: sEnd, events: eventsLog }, null, 1));
console.log('CLICK:', clickResult.result.value);
console.log('START:', JSON.stringify(s0));
for (const s of samples) console.log('t=' + s.atMs, JSON.stringify(s));
console.log('EVENTS:', JSON.stringify(eventsLog.filter(e => e.method !== 'Network.requestWillBeSent' || !String(e.url).includes('supabase')).slice(0, 60), null, 0).slice(0, 2500));
ws.close(); process.exit(0);
