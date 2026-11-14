// Second-pass fingerprint: word-boundary tokens, versions, config snippets
const fs = require('fs');
const path = require('path');
const d = path.join(__dirname, '..', '_dl', 'fresh');
const js = fs.readFileSync(path.join(d, 'layout.js'), 'utf8');
const h = fs.readFileSync(path.join(d, 'index.html'), 'utf8');

function ctx(token, n = 2, span = 200) {
  const re = new RegExp(token, 'g');
  let m, out = [], c = 0;
  while ((m = re.exec(js)) && c < n) {
    c++;
    out.push(JSON.stringify(js.slice(Math.max(0, m.index - span / 2), m.index + token.length + span)));
  }
  console.log('TOKEN /' + token + '/ count-total:', (js.match(re) || []).length, c ? '\n    ' + out.join('\n    ') : ' (no match)');
}
console.log('=== lenis version ===');
ctx('lenisVersion', 2, 300);
console.log('=== lenis instantiation ===');
ctx('respectReducedMotion', 2, 350);
console.log('=== smoother ===');
ctx('Smoother|smoother', 3, 150);
console.log('=== barba init/version ===');
ctx('barba\\.init|barba\\.version|data-barba', 4, 200);
console.log('=== rive word-boundary ===');
ctx('\\brive\\b|Rive\\b', 2, 120);
console.log('=== lottie word-boundary ===');
ctx('\\blottie\\b|\\bLottie\\b', 2, 120);
console.log('=== gsap plugins registered ===');
ctx('registerPlugin\\(\\w+', 6, 60);
console.log('=== reduced motion ===');
ctx('prefers-reduced-motion|prefersReducedMotion|reducedMotion', 5, 140);
console.log('=== scroll container ===');
ctx('scroll-container|data-scroll', 5, 120);
console.log('=== webgl fail fallback ===');
ctx('WebGL.*not.*support|webgl.*fallback|no-webgl|webglcontextlost', 3, 150);
console.log('=== html data-barba ===');
for (const m of h.matchAll(/data-barba[^ >]*=["'][^"']*["']/g)) console.log(' ', m[0]);
console.log('=== html nav/canvas/scroll attrs sample ===');
for (const t of ['data-navbar-link', 'data-webgl-foreground', 'data-webgl-background', 'data-world', 'data-scene', 'data-view']) {
  const c = (h.match(new RegExp(t, 'g')) || []).length;
  console.log('  ', t, c);
}
console.log('=== spark versions/keys ===');
ctx('spark_worker|SparkWorker|sortWorker', 4, 120);
console.log('=== source map check ===');
const mapPath = path.join(d, 'oldWorker-DUF0ALOS.js.map');
if (fs.existsSync(mapPath)) {
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  console.log('map version', map.version, 'sources:', (map.sources || []).length, 'sourcesContent:', (map.sourcesContent || []).length);
  (map.sources || []).slice(0, 80).forEach(s => console.log('  ', s));
} else {
  console.log('MAP MISSING');
}
