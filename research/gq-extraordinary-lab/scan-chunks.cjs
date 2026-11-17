// Static scan of downloaded public JS chunks (data only; never executed).
const fs = require('fs');
const p = 'C:/Users/Markimus/.buzz/REPOS/jgun-torque-wrench/research/gq-extraordinary-lab/scripts/';
const files = fs.readdirSync(p).filter(f => f.endsWith('.js'));
const markers = ['three.js', 'REVISION', 'gsap', 'ScrollTrigger', 'FlipPlugin', 'CustomEase', 'lenis', 'Lenis', 'rive', '.riv', 'Theatre', 'theatre', 'DRACO', 'draco', 'meshopt', 'KTX2', 'basis', 'AudioContext', 'Howler', 'createApp', 'WebGPU', 'data-engine', 'prefers-reduced-motion', 'glb', 'hdr', 'exr', 'fov', 'lerp', 'dpr', 'wheelMultiplier', 'duration', 'easing'];
for (const f of files) {
  const s = fs.readFileSync(p + f, 'utf8');
  const counts = {};
  for (const m of markers) { const c = s.split(m).length - 1; if (c > 0) counts[m] = c; }
  const assets = [...new Set([...s.matchAll(/[A-Za-z0-9_\-.\/]*\.(glb|gltf|ktx2|hdr|exr|mp4|webm|mp3|m4a|riv|webp|draco)/g)].map(x => x[0]))];
  console.log('=== ' + f + ' chars=' + s.length);
  console.log('markers:', JSON.stringify(counts));
  console.log('assets(' + assets.length + '):', JSON.stringify(assets.slice(0, 25)));
}
console.log('=== builds-latest.json ===');
try { console.log(fs.readFileSync(p + 'builds-latest.json', 'utf8').slice(0, 600)); } catch (e) { console.log('read fail', String(e).slice(0, 80)); }
