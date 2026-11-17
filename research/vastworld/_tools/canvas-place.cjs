// Check whether webgl canvases are inside the barba container (nesting, not just index order)
const fs = require('fs');
const path = require('path');
const h = fs.readFileSync(path.join(__dirname, '..', '_dl', 'fresh', 'dom-ev_45b5963-1440-redu-settle.html'), 'utf8');
const container = h.indexOf('data-barba="container"');
console.log('container open context:', JSON.stringify(h.slice(container - 60, container + 120)));
// find the matching close: walk forward counting <div vs </div> from the container element start
let i = h.lastIndexOf('<', container);
let depth = 0, closed = -1;
const re = /<\/?div\b[^>]*>/g;
re.lastIndex = i;
let m;
while ((m = re.exec(h))) {
  if (m[0].startsWith('</')) { depth--; if (depth === 0) { closed = m.index; break; } }
  else if (!m[0].endsWith('/>')) depth++;
}
console.log('container div closes at', closed, 'of', h.length);
const bg = h.indexOf('data-webgl-background');
const fg = h.indexOf('id="webgl"');
const canvas3 = h.indexOf('clip-path:inset');
console.log('bg canvas idx', bg, 'fg canvas idx', fg, 'third canvas idx', canvas3);
console.log('=> bg inside container?', bg > container && bg < closed);
console.log('=> fg inside container?', fg > container && fg < closed);
console.log('=> third canvas inside container?', canvas3 > container && canvas3 < closed);
// what follows the container close
console.log('after container close:', JSON.stringify(h.slice(closed, closed + 400).replace(/\s+/g, ' ')));
// main content region markers
const mainOpen = h.indexOf('<main');
console.log('main open idx', mainOpen);
// check nav position
const navIdx = h.indexOf('data-navbar-link');
console.log('first navbar link idx', navIdx, '(nav inside container?', navIdx > container && navIdx < closed, ')');
