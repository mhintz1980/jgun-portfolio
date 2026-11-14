// Scan downloaded HTML for scripts, preloads, meta and inline fingerprints
const fs = require('fs');
const path = require('path');
const d = path.join(__dirname, '..', '_dl', 'fresh');
const h = fs.readFileSync(path.join(d, 'index.html'), 'utf8');
console.log('HTML len', h.length);
const scripts = [...h.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(m => ({ src: m[1], attrs: m[0] }));
console.log('--- script tags ---');
scripts.forEach(s => console.log(' ', s.src, '|', s.attrs.replace(/\s+/g, ' ').slice(0, 160)));
console.log('--- modulepreload ---');
[...h.matchAll(/<link[^>]*rel=["']modulepreload["'][^>]*>/g)].forEach(m => console.log(' ', m[0].replace(/\s+/g, ' ').slice(0, 200)));
console.log('--- importmap ---');
const im = h.match(/<script[^>]*importmap[^>]*>[\s\S]*?<\/script>/);
console.log(im ? im[0].slice(0, 500) : 'none');
console.log('--- inline scripts (non-module, first 400 chars each) ---');
let i = 0;
for (const m of h.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
  const body = m[1].trim();
  if (!body) continue;
  i++;
  console.log('inline#' + i, 'len', body.length, '|', JSON.stringify(body.slice(0, 300)));
}
console.log('--- meta generator / viewport ---');
for (const m of h.matchAll(/<meta[^>]*>/g)) {
  if (/generator|viewport|theme-color/i.test(m[0])) console.log(' ', m[0].slice(0, 220));
}
console.log('--- canvas / webgl markers in HTML ---');
for (const t of ['canvas', 'webgl', 'splat', 'spz', 'three', 'gsap', 'lenis', 'astro-island']) {
  const c = (h.toLowerCase().match(new RegExp(t, 'g')) || []).length;
  console.log('  token', t, 'count', c);
}
