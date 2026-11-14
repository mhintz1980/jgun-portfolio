// Static scan of downloaded public JS (data only; never executed).
const fs = require('fs');
const p = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab/scripts/';
console.log('--- embed-index.html ---');
console.log(fs.readFileSync(p + 'embed-index.html', 'utf8').slice(0, 200));
const s = fs.readFileSync(p + 'entry.js', 'utf8');
console.log('--- entry.js chars:', s.length);
const counts = {};
for (const m of ['PlayCanvas', 'playcanvas', 'THREE.REVISION', 'three.js', '@vue/', 'createApp', 'gsap', 'ScrollTrigger', 'ScrollSmoother', 'Flip', 'SplitText', 'CustomEase', 'Howl', 'Howler', 'lenis', 'Lenis', 'Locomotive', 'barba', 'Swup', 'lottie', 'rive', 'Theatre', 'ammo', 'OGL', 'pixi', 'data-engine', 'prefers-reduced-motion', 'matchMedia', 'draco', 'DRACO', 'meshopt', 'KTX2', 'basis', 'WebGPU', 'devicePixelRatio', 'requestAnimationFrame', 'AudioContext', 'touchstart', 'wheel', 'scrollY', 'pinch', 'gesturestart']) {
  const c = s.split(m).length - 1;
  if (c > 0) counts[m] = c;
}
console.log('--- library markers ---');
console.log(JSON.stringify(counts));
const imports = [...new Set([...s.matchAll(/from\s*"(\.\/[^"]+\.js)"/g)].map(x => x[1]))];
console.log('--- relative chunk imports ---', JSON.stringify(imports.slice(0, 40)));
const imports2 = [...new Set([...s.matchAll(/import\(["'](\.\/[^"']+)["']\)/g)].map(x => x[1]))];
console.log('--- dynamic chunk imports ---', JSON.stringify(imports2.slice(0, 40)));
const assets = [...new Set([...s.matchAll(/[A-Za-z0-9_\-.\/]+\.(glb|gltf|ktx2|basis|hdr|exr|mp4|webm|mp3|m4a|ogg|wav|webp|json|draco)/g)].map(x => x[0]))];
console.log('--- asset-like strings (' + assets.length + ') ---');
console.log(JSON.stringify(assets.slice(0, 100), null, 0));
const rev = s.match(/REVISION\s*=\s*["']([0-9]+[^"']*)/);
console.log('three REVISION:', rev ? rev[1] : 'none');
const pc = s.match(/PLAYCANVAS[\s_A-Z]*VERSION[^0-9]{0,24}([0-9][0-9.]*)/i);
console.log('playcanvas version marker:', pc ? pc[0].slice(0, 60) : 'none');
const vv = s.match(/vue[:"'\s]*3\.[0-9]+\.[0-9]+/i);
console.log('vue version marker:', vv ? vv[0].slice(0, 30) : 'none');
