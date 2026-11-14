// Inspect saved DOM captures: barba structure, canvas placement, headings, data-anim attrs
const fs = require('fs');
const path = require('path');
const d = path.join(__dirname, '..', '_dl', 'fresh');
const files = ['dom-ev_45b5963-1440-redu-settle.html', 'dom-ev_55eff9f-390-no-p-bottom-settle.html'];
for (const f of files) {
  const p = path.join(d, f);
  if (!fs.existsSync(p)) { console.log('MISSING', f); continue; }
  const h = fs.readFileSync(p, 'utf8');
  console.log('===', f, h.length, 'chars');
  // outline: find data-barba elements and their nesting depth relative to canvases
  const idxBarba = h.indexOf('data-barba="wrapper"');
  const idxContainer = h.indexOf('data-barba="container"');
  const idxCanvas = h.indexOf('data-webgl-background');
  const idxCanvasFg = h.indexOf('id="webgl"');
  console.log('wrapper idx', idxBarba, '| container idx', idxContainer, '| bg canvas idx', idxCanvas, '| fg canvas idx', idxCanvasFg);
  console.log('canvas inside container?', idxContainer !== -1 && idxCanvas > idxContainer);
  // first 400 chars of body structure
  const bodyIdx = h.indexOf('<body');
  console.log('BODY OPEN:', h.slice(bodyIdx, bodyIdx + 700).replace(/\s+/g, ' '));
  // data-text-animation elements count
  for (const t of ['data-text-animation', 'data-navbar-link', 'data-scroll-to', 'data-showcase', 'data-world', 'data-research-card', 'loading="lazy"', 'decoding=', 'fetchpriority', 'link rel="preload"', 'rel="preload"']) {
    const c = (h.match(new RegExp(t, 'g')) || []).length;
    console.log('  ', t, c);
  }
  // preload hints
  const pre = [...h.matchAll(/<link[^>]*rel=["'](?:preload|prefetch|preconnect)["'][^>]*>/g)].map(m => m[0].replace(/\s+/g, ' '));
  console.log('--- link preload/prefetch hints ---');
  pre.slice(0, 30).forEach(x => console.log('  ', x));
  // section/heading inventory
  const heads = [...h.matchAll(/<h([1-3])[^>]*>([\s\S]{0,120}?)<\/h\1>/g)].map(m => 'h' + m[1] + ': ' + m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60));
  console.log('--- headings ---');
  [...new Set(heads)].slice(0, 25).forEach(x => console.log('  ', x));
}
