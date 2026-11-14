// More marker contexts. Data-only scan.
const fs = require('fs');
const p = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab/scripts/';
function rx(file, re, n = 5, w = 70) {
  const s = fs.readFileSync(p + file, 'utf8');
  const out = [];
  let m;
  const g = new RegExp(re, 'g');
  while ((m = g.exec(s)) !== null && out.length < n) {
    out.push(s.slice(Math.max(0, m.index - w), m.index + m[0].length + w).replace(/\s+/g, ' '));
  }
  return out;
}
function ctx(file, needle, n = 4, w = 60) {
  const s = fs.readFileSync(p + file, 'utf8');
  const out = [];
  let i = 0;
  while ((i = s.indexOf(needle, i)) !== -1 && out.length < n) {
    out.push(s.slice(Math.max(0, i - w), i + needle.length + w).replace(/\s+/g, ' '));
    i += needle.length;
  }
  return out;
}
console.log('### three revision var');
for (const c of rx('entry.js', /Ix\s*=\s*["'`][0-9]/, 3, 30)) console.log('  >', c);
console.log('### L$ definition (lenis lerp check)');
for (const c of rx('entry.js', /L\$\s*=\s*\(\)\s*=>/, 3, 90)) console.log('  >', c);
console.log('### reduced-motion-ish strings in entry');
for (const re of ['educed', 'reducedMotion', 'no-preference', 'accessib', 'prefers']) {
  for (const c of ctx('entry.js', re, 2, 60)) console.log('  [' + re + ']', c);
}
console.log('### post passes in scene chunk');
for (const re of ['bloom', 'Bloom', 'DOF', 'dof', 'SMAA', 'FXAA', 'vignette', 'Vignette', 'grain', 'chromatic', 'outputpass', 'OutputPass', 'ShaderPass', 'EffectComposer']) {
  for (const c of ctx('chunk-CROz8He7.js', re, 2, 55)) console.log('  [' + re + ']', c);
}
console.log('### section names in scene chunk');
for (const re of ['sections:[', 'deepDive', 'chapter', 'section:', '_section']) {
  for (const c of ctx('chunk-CROz8He7.js', re, 3, 80)) console.log('  [' + re + ']', c);
}
console.log('### gsap eases + tweens in scene chunk');
for (const re of ['ease:', 'duration:', 'CustomEase', 'expo', 'power4', 'elastic']) {
  for (const c of ctx('chunk-CROz8He7.js', re, 4, 60)) console.log('  [' + re + ']', c);
}
console.log('### ScrollTrigger wiring in entry');
for (const re of ['scroller:', 'ticker', 'lenis.on', 'raf(', 'autoRaf', 'autoRaf:']) {
  for (const c of ctx('entry.js', re, 3, 70)) console.log('  [' + re + ']', c);
}
console.log('### rive usage in C4 chunk');
for (const re of ['rive', 'Rive', 'layout', 'stateMachines']) {
  for (const c of ctx('chunk-C4irFK9B.js', re, 3, 60)) console.log('  [' + re + ']', c);
}
console.log('### audio strings');
for (const re of ['audio', 'Audio', 'sound', 'Sound', 'unmute', 'muted']) {
  for (const c of ctx('entry.js', re, 2, 50)) console.log('  [' + re + ']', c);
}
