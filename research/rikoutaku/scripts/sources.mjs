// Export all parsed script sources + post-load DOM via CDP Debugger for offline grep.
// Usage: node sources.mjs [--outdir=../scripts-export] [--dom=../data/dom.html]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const outdir = resolve(here, args.outdir ?? '../scripts-export');
const domPath = resolve(here, args.dom ?? '../data/dom.html');
const PORT = args.port ?? 9777;

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page' && /rikoutaku\.work/.test(t.url));
if (!page) { console.error('NO_TARGET'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej, method }); ws.send(JSON.stringify({ id, method, params })); });
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ' -> ' + JSON.stringify(m.error))) : p.res(m.result); } });
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

const scripts = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Debugger.scriptParsed' && m.params.url && !m.params.url.startsWith('devtools')) scripts.push(m.params);
});
await send('Debugger.enable');
await new Promise(r => setTimeout(r, 1500));

mkdirSync(outdir, { recursive: true });
const manifest = [];
for (const s of scripts) {
  if (!s.url.startsWith('http') && !s.url.startsWith('blob:')) continue;
  try {
    const r = await send('Debugger.getScriptSource', { scriptId: s.scriptId });
    const name = s.url.startsWith('blob:') ? `blob-${s.scriptId}.js` : s.url.split('/').slice(2).join('__').replace(/[?&=]/g, '_');
    const file = resolve(outdir, name.slice(0, 120));
    writeFileSync(file, r.scriptSource ?? '');
    manifest.push({ scriptId: s.scriptId, url: s.url, length: s.length, hash: s.hash, file: name.slice(0, 120) });
  } catch (e) { manifest.push({ scriptId: s.scriptId, url: s.url, error: e.message }); }
}
// post-load DOM
const dom = await send('Runtime.evaluate', { expression: 'document.documentElement.outerHTML', returnByValue: true });
mkdirSync(dirname(domPath), { recursive: true });
writeFileSync(domPath, dom.result.value ?? '');
writeFileSync(resolve(outdir, '_manifest.json'), JSON.stringify(manifest, null, 1));
console.log('scripts exported:', manifest.length, 'wrote DOM', domPath);
ws.close(); process.exit(0);
