// prefers-reduced-motion emulation check: set media, reload, inspect classes/canvas/console.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.argv[2] ?? 9777;
const outdir = resolve(here, '../data');
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page' && /rikoutaku\.work\/$/.test(t.url) || t.type === 'page' && t.url === 'https://www.rikoutaku.work/');
if (!page) { console.error('NO_TARGET'); process.exit(1); }
console.log('TARGET:', page.url);
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej, method }); ws.send(JSON.stringify({ id, method, params })); });
const events = [];
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ' -> ' + JSON.stringify(m.error))) : p.res(m.result); } else if (m.method === 'Runtime.consoleAPICalled') { events.push({ t: m.params.timestamp, type: m.params.type, text: m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 160) }); } });
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await new Promise(r => setTimeout(r, 300));
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.reload', { ignoreCache: false });
await new Promise(r => setTimeout(r, 9000));
const r = await send('Runtime.evaluate', { expression: `JSON.stringify({ htmlClass: document.documentElement.className, matchReduce: matchMedia('(prefers-reduced-motion: reduce)').matches, canvas: !!document.querySelector('canvas'), engine: document.querySelector('canvas')?.getAttribute('data-engine'), scrollHeight: document.documentElement.scrollHeight, heroText: (document.querySelector('h1')?.textContent || '').trim().slice(0, 60), dataFx: [...document.querySelectorAll('[data-fx]')].length })`, returnByValue: true });
const s = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(resolve(outdir, 'reduced-motion.png'), Buffer.from(s.data, 'base64'));
const parsed = JSON.parse(r.result.value);
parsed.console = events.slice(0, 25);
writeFileSync(resolve(outdir, 'reduced-motion.json'), JSON.stringify(parsed, null, 1));
console.log(JSON.stringify(parsed, null, 1));
ws.close(); process.exit(0);
