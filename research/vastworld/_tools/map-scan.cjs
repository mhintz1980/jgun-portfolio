// Analyze source map: sources list grouped, plus JV lenis version + misc tokens
const fs = require('fs');
const path = require('path');
const d = path.join(__dirname, '..', '_dl', 'fresh');
const js = fs.readFileSync(path.join(d, 'layout.js'), 'utf8');
const mapPath = path.join(d, 'oldWorker-DUF0ALOS.js.map');
if (!fs.existsSync(mapPath)) { console.log('MAP MISSING'); process.exit(0); }
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
console.log('map version:', map.version, 'sources:', (map.sources || []).length, 'sourcesContent entries:', (map.sourcesContent || []).length, 'mappings len:', (map.mappings || '').length);
// group sources by top dir
const groups = {};
for (const s of map.sources || []) {
  const key = s.replace(/^.*node_modules\//, 'NM:').split('/').slice(0, 2).join('/');
  groups[key] = (groups[key] || 0) + 1;
}
console.log('--- source groups ---');
Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([k, v]) => console.log('  ', v, k));
console.log('--- non-nodemodules (site src) sources ---');
for (const s of map.sources || []) {
  if (!s.includes('node_modules')) console.log('  ', s);
}
// JV lenis version
const jv = js.match(/JV=`[^`]+`|JV=\s*["'][^"']+["']/);
console.log('lenis JV version:', jv ? jv[0] : 'unknown');
// barba version
const bv = js.match(/barba.{0,40}?version.{0,20}|\b2\.\d{2}\.\d+\b/);
console.log('barba version hint:', bv ? bv[0].slice(0, 80) : 'unknown');
// postprocessing / controls
for (const t of ['EffectComposer', 'OrbitControls', 'UnrealBloom', 'MateScroll|mate-scroll', 'astro:transitions|ViewTransition|startViewTransition']) {
  const c = (js.match(new RegExp(t, 'g')) || []).length;
  console.log('token', t, 'count', c);
}
