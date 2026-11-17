// Runtime probes: gsap version/plugins, debug handles, links, sections.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const PORT = process.argv[2] ?? 9777;
const outPath = resolve(here, '../data/probes.json');

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page' && /rikoutaku\.work/.test(t.url));
if (!page) { console.error('NO_TARGET'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej, method }); ws.send(JSON.stringify({ id, method, params })); });
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(p.method + ' -> ' + JSON.stringify(m.error))) : p.res(m.result); } });
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

const expr = `(() => {
  const out = {};
  try { out.gsapVersion = window.gsap ? window.gsap.version : null; } catch (e) { out.gsapVersion = 'err ' + e.message; }
  try { out.gsapGlobals = window.gsap ? Object.keys(window.gsap).slice(0, 40) : null; } catch (e) {}
  try {
    out.pluginsRegistry = [];
    if (window.gsap) { const gs = window.gsap; out.pluginsRegistry = (gs.plugins ? Object.keys(gs.plugins) : []).concat(typeof gs.core !== 'undefined' && gs.core.plugins ? Object.keys(gs.core.plugins) : []); }
  } catch (e) {}
  try { out.tyndall = typeof window.tyndall === 'object' ? Object.keys(window.tyndall).slice(0, 30) : typeof window.tyndall; } catch (e) {}
  try { out.guiHandles = ['experience','world','__DEBUG','debug','ri','rikoutaku','scene','camera'].map(k => k + ':' + (typeof window[k])); } catch (e) {}
  try {
    out.links = [...document.querySelectorAll('a[href]')].map(a => ({ href: a.getAttribute('href'), label: (a.textContent || '').trim().slice(0, 40), aria: a.getAttribute('aria-label') })).filter(l => l.href && !l.href.startsWith('#') && !l.href.startsWith('mailto') && !l.href.startsWith('http'));
  } catch (e) {}
  try {
    out.sections = [...document.querySelectorAll('[data-motion-chapter],[data-composition]')].map(s => ({ tag: s.tagName, chapter: s.getAttribute('data-motion-chapter'), comp: s.getAttribute('data-composition'), label: s.getAttribute('aria-label'), cls: (s.className || '').slice(0, 60) }));
  } catch (e) {}
  try {
    out.fxSample = [...document.querySelectorAll('[data-fx]')].slice(0, 12).map(el => el.getAttribute('data-fx') + '@' + (el.getAttribute('data-at') || ''));
  } catch (e) {}
  try { out.fxLive = document.documentElement.className; } catch (e) {}
  try { out.riSmooth = { smooth: document.documentElement.classList.contains('ri-smooth'), covered: document.documentElement.classList.contains('ri-covered') }; } catch (e) {}
  try {
    const c = document.querySelector('canvas');
    out.canvasInfo = c ? { engine: c.getAttribute('data-engine'), w: c.width, h: c.height, styleW: c.style.width, styleH: c.style.height, parent: c.parentElement ? c.parentElement.tagName + '.' + (c.parentElement.className || '').slice(0, 40) : null } : null;
  } catch (e) {}
  try { out.reduceQuery = matchMedia('(prefers-reduced-motion: reduce)').matches; out.coarse = matchMedia('(pointer: coarse)').matches; } catch (e) {}
  try { out.webgl = (() => { try { const t = document.createElement('canvas'); return !!(t.getContext('webgl2') || t.getContext('webgl')); } catch (e) { return false; } })(); } catch (e) {}
  try { out.supabaseUrl = (performance.getEntriesByType('resource').find(r => r.name.includes('supabase')) || {}).name || null; } catch (e) {}
  return JSON.stringify(out);
})()`;

const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
mkdirSync(dirname(outPath), { recursive: true });
const parsed = JSON.parse(r.result.value);
writeFileSync(outPath, JSON.stringify(parsed, null, 1));
console.log(JSON.stringify(parsed, null, 1).slice(0, 4500));
ws.close(); process.exit(0);
