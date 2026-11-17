// Show import statements of entry script + gsap context in HTML + sourceMappingURL
const fs = require('fs');
const path = require('path');
const d = path.join(__dirname, '..', '_dl', 'fresh');
const js = fs.readFileSync(path.join(d, 'layout.js'), 'utf8');
console.log('layout.js len', js.length, 'lines', js.split('\n').length);
console.log('--- import lines ---');
let n = 0;
for (const m of js.matchAll(/import[\s\S]{0,200}?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']/g)) {
  n++;
  if (n <= 60) console.log(String(n).padStart(3), (m[1] || m[2] || m[3]));
}
console.log('total import matches:', n);
const sm = js.match(/\/\/#\s*sourceMappingURL=(\S+)/);
console.log('sourceMappingURL:', sm ? sm[1] : 'none');
// dynamic import chunks
console.log('--- dynamic import specifiers ---');
for (const m of js.matchAll(/["'](_astro\/[^"']+)["']/g)) console.log(' ', m[1]);
const h = fs.readFileSync(path.join(d, 'index.html'), 'utf8');
console.log('--- gsap mentions in HTML ---');
for (const m of h.matchAll(/.{80}gsap.{120}/gi)) console.log(' ', JSON.stringify(m[0].replace(/\s+/g, ' ')));
console.log('--- canvas mentions in HTML ---');
for (const m of h.matchAll(/<canvas[^>]*>/g)) console.log(' ', m[0].replace(/\s+/g, ' ').slice(0, 240));
console.log('--- splat mentions in HTML ---');
for (const m of h.matchAll(/.{60}splat.{140}/gi)) console.log(' ', JSON.stringify(m[0].replace(/\s+/g, ' ').slice(0, 260)));
