// Locate site-code hotspot regions in layout.js with line numbers
const fs = require('fs');
const path = require('path');
const js = fs.readFileSync(path.join(__dirname, '..', '_dl', 'fresh', 'layout.js'), 'utf8');
const lines = js.split('\n');
function lineOf(idx) { return js.slice(0, idx).split('\n').length; }
function show(token, re, max = 3, span = 220) {
  const rx = new RegExp(re, 'g');
  let m, c = 0;
  console.log('--- /' + re + '/ ---');
  while ((m = rx.exec(js)) && c < max) {
    c++;
    const ln = lineOf(m.index);
    const ctx = js.slice(Math.max(0, m.index - span / 2), m.index + span).replace(/\s+/g, ' ');
    console.log('  L' + ln + ' idx=' + m.index + ': ' + JSON.stringify(ctx.slice(0, span + 40)));
  }
  if (c === 0) console.log('  (none)');
}
// Lenis instantiation
show('lenis-new', /new [A-Za-z_$]{1,3}\(\{[^}]{0,80}wrapper/, 3, 260);
show('lenis-class', /window\.lenisVersion/, 1, 100);
// scroll container references in site code
show('scroll-container', /scroll-container/, 6, 180);
// world loader / spz
show('spz-path', /splats\/spz/, 4, 160);
show('warmup', /warmup\.spz/, 3, 200);
show('looks-json', /alive-looks\.json/, 2, 200);
// prefetch worlds
show('prefetch-worlds', /Prefetch \(worlds\) failed/, 2, 260);
// splat mesh site usage
show('SplatMesh-use', /new \w{1,3}\(\{[\w\W]{0,60}splat/, 3, 200);
show('splatmesh-lower', /splatMesh/, 4, 120);
// data-webgl drivers
show('data-webgl', /data-webgl-(background|foreground)/, 4, 160);
// text animation driver
show('data-text-animation', /data-text-animation/, 3, 160);
// showcase
show('data-showcase', /data-showcase/, 3, 160);
// page transition panel
show('page-transition', /page-transition/, 4, 200);
// barba init
show('barba-init', /namespace[:=]/, 3, 160);
show('barba-usage', /\bbarba\b/, 2, 120);
// render loop
show('setAnimationLoop', /setAnimationLoop|requestAnimationFrame\(/, 4, 120);
// clock
show('clock', /new \w{1,3}\.Clock\(|getDelta\(\)/, 3, 120);
// reduced motion gate helper
show('hm-gate', /prefers-reduced-motion: reduce/, 5, 200);
// stats panel
show('stats-panel', /Stats\(|showPanel/, 3, 120);
// video hover driver
show('research-card', /data-research-card/, 3, 160);
// scroll-to
show('scroll-to', /data-scroll-to/, 3, 160);
// resize handling
show('resize', /addEventListener\(`?resize/, 3, 140);
// visibility pause
show('visibility', /visibilitychange|document\.hidden/, 3, 140);
// dpr cap
show('dpr', /setPixelRatio|devicePixelRatio/, 4, 120);
