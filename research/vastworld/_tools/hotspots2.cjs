// Final targeted hotspot probes
const fs = require('fs');
const path = require('path');
const js = fs.readFileSync(path.join(__dirname, '..', '_dl', 'fresh', 'layout.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', '_dl', 'fresh', 'page-wrapper.css'), 'utf8');
function lineOf(idx) { return js.slice(0, idx).split('\n').length; }
function show(tag, re, max = 3, span = 200, filterIdx = null) {
  const rx = new RegExp(re, 'g');
  let m, c = 0;
  console.log('--- ' + tag + ' /' + re + '/ ---');
  while ((m = rx.exec(js)) && c < max) {
    if (filterIdx && m.index < filterIdx) continue;
    c++;
    const ln = lineOf(m.index);
    const ctx = js.slice(Math.max(0, m.index - span / 2), m.index + span).replace(/\s+/g, ' ');
    console.log('  L' + ln + ' idx=' + m.index + ': ' + JSON.stringify(ctx.slice(0, span + 30)));
  }
  if (c === 0) console.log('  (none)');
}
show('prefetch-msg', /Prefetch \(/, 3, 220);
show('loadSplatMesh-def', /loadSplatMesh\(/, 5, 160);
show('SplatMesh-ctx', /SplatMesh/, 5, 140);
show('renderer-new', /new \w+\(\{[\w\W]{0,120}antialias/, 3, 220, 5000000);
show('dpr-cap', /setPixelRatio\((Math\.min|window\.devicePixelRatio)/, 3, 160, 5000000);
show('scrolltrigger-site', /scrollTrigger:\{/, 4, 180, 5700000);
show('Db-plugin', /registerPlugin\(Jy,\w+\)|registerPlugin\(\w+,\w+\)/, 3, 200);
show('observer-register', /registerPlugin\(\w+\)\|\|console\.warn\(`Please gsap\.registerPlugin\(Observer\)`\)/, 1, 100);
show('warmup-class', /class\{.*warmup|warmup.*class/, 2, 200);
show('showFirstWorld-full', /showFirstWorld/, 2, 400);
show('world-builder-idle', /requestIdleCallback\(\w+=>\w+\(\)\)|requestIdleCallback\(\w+,\{timeout/, 3, 220);
show(' IntersectionObserver', /new IntersectionObserver/, 4, 160, 5700000);
show('footer-nightcamp', /Night Camp/, 2, 200);
show('paper', /paperRunning|paper-\(/, 3, 140, 5700000);
show('hero-section-bind', /__FIRST_WORLD__/, 3, 200);
// CSS checks
console.log('=== CSS checks ===');
const rm = css.match(/@media[^{]*prefers-reduced-motion[^{]*\{[\s\S]{0,400}/);
console.log('reduced-motion media block:', rm ? rm[0].slice(0, 300).replace(/\s+/g, ' ') : 'none');
const touchAction = (css.match(/touch-action[^;]+;/g) || []).slice(0, 6);
console.log('touch-action rules:', JSON.stringify(touchAction));
const scrollBehavior = (css.match(/scroll-behavior[^;]+;/g) || []).slice(0, 4);
console.log('scroll-behavior rules:', JSON.stringify(scrollBehavior));
const containerQueries = (css.match(/@container/g) || []).length;
console.log('@container count:', containerQueries);
const fontFaces = (css.match(/@font-face/g) || []).length;
console.log('@font-face count:', fontFaces);
const willChange = (css.match(/will-change[^;}]*/g) || []).length;
console.log('will-change count:', willChange);
