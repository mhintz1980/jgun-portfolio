// Version-string extraction. Data-only scan.
const fs = require('fs');
const p = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab/scripts/';
function rx(file, re, n = 3, w = 60) {
  const s = fs.readFileSync(p + file, 'utf8');
  const out = [];
  let m; const g = new RegExp(re, 'g');
  while ((m = g.exec(s)) !== null && out.length < n) out.push(s.slice(Math.max(0, m.index - w), m.index + m[0].length + w).replace(/\s+/g, ' '));
  return out;
}
console.log('### GSAP version');
for (const c of rx('entry.js', /version\s*[:=]\s*["']3\.\d+\.\d+["']/, 4, 40)) console.log('  >', c);
for (const c of rx('entry.js', /["']3\.1[0-9]\.[0-9]+["']/, 4, 40)) console.log('  v>', c);
console.log('### Lenis version');
for (const c of rx('entry.js', /lenisVersion/, 2, 80)) console.log('  >', c);
for (const c of rx('entry.js', /lenis[\\/@ -][0-9]+\.[0-9]+[0-9.a-z-]*/i, 3, 40)) console.log('  v>', c);
console.log('### Vue version');
for (const c of rx('entry.js', /["']3\.[0-9]+\.[0-9]+["']\s*,\s*["']vue["']|["']vue["']\s*:\s*["']3\.[0-9.]+["']|__vue_inject_styles__|VueVersion|appVersion/, 3, 50)) console.log('  >', c);
for (const c of rx('entry.js', /createSSRApp|nuxt/i, 2, 60)) console.log('  n>', c);
console.log('### theatre version');
for (const c of rx('entry.js', /@theatre\/[a-z]+[\"']?\s*[,}]\s*version|theatre.*?["']0\.[0-9.]+["']/i, 3, 60)) console.log('  >', c);
for (const c of rx('chunk-C4irFK9B.js', /["']0\.[0-9]{1,2}\.[0-9]+["']/, 5, 40)) console.log('  v>', c);
console.log('### Flip plugin');
for (const c of rx('entry.js', /Flip\.(getState|makeAbsolute|flip)|registerPlugin\((Flip|flip)/, 3, 60)) console.log('  >', c);
console.log('### detect-gpu usage');
for (const f of ['entry.js', 'chunk-CROz8He7.js']) for (const c of rx(f, /detect-gpu|getGPUTier|benchmark/, 3, 70)) console.log('  [' + f + ']', c);
console.log('### lowPerfMode');
for (const f of ['entry.js', 'chunk-CROz8He7.js']) for (const c of rx(f, /lowPerfMode/, 3, 80)) console.log('  [' + f + ']', c);
console.log('### loader / progress');
for (const f of ['entry.js']) for (const re of ['progress', 'loader', 'Loader', 'preloader', 'assetCount', 'loadedCount']) for (const c of rx(f, re, 2, 60)) console.log('  [' + re + ']', c);
