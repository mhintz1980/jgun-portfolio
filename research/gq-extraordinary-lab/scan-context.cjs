// Extract short identifying contexts (<=120 chars) around markers. Data-only scan.
const fs = require('fs');
const p = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab/scripts/';
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
const jobs = [
  ['entry.js', 'data-engine', 2, 80],
  ['entry.js', 'REVISION', 3, 40],
  ['entry.js', 'wheelMultiplier', 4, 70],
  ['entry.js', 'scrollerProxy', 2, 70],
  ['entry.js', 'ScrollTrigger.create', 3, 60],
  ['entry.js', 'gsap.registerPlugin', 2, 80],
  ['entry.js', 'matchMedia', 4, 60],
  ['entry.js', 'prefers-reduced', 2, 60],
  ['entry.js', 'new Lenis', 2, 90],
  ['chunk-CROz8He7.js', 'fov', 6, 50],
  ['chunk-CROz8He7.js', 'dpr', 4, 50],
  ['chunk-CROz8He7.js', 'theatre', 3, 60],
  ['chunk-CROz8He7.js', 'getProject', 2, 60],
  ['chunk-CROz8He7.js', 'webgl/geometry', 6, 70],
  ['chunk-CROz8He7.js', '.glb', 6, 60],
  ['chunk-C4irFK9B.js', '.riv', 4, 60],
  ['chunk-C4irFK9B.js', 'theatre', 3, 60],
  ['entry.js', 'chapter', 5, 50],
  ['entry.js', 'WheelEvent', 2, 50],
  ['entry.js', 'wheel', 3, 50]
];
for (const [f, needle, n, w] of jobs) {
  console.log('##### ' + f + ' :: ' + needle);
  for (const c of ctx(f, needle, n, w)) console.log('  >', c);
}
