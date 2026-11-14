// Static fingerprint scan of downloaded chunks (counts only, no code pasted).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('../exports/chunks/', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));

const patterns = {
  'three REVISION token': /REVISION\s*[:=]\s*["'](\d+)["']/,
  'three.js string': /three\.js|THREE\.(WebGLRenderer|Scene|PerspectiveCamera|Clock|ShaderMaterial)/,
  'OGL lib': /\bOGL\b|from"ogl"|from'ogl'|ogl\/src/,
  'gsap core': /gsap|GreenSockGlobals|_gsScope/,
  'gsap version': /["']3\.\d+\.\d+["']\s*[,;]?\s*["']?(core)?["']?|version\s*[:=]\s*["']3\.\d+/,
  'ScrollTrigger': /ScrollTrigger/,
  'ScrollSmoother': /ScrollSmoother/,
  'SplitText/Flip/CustomEase': /SplitText|Flip\b|CustomEase|MorphSVG|DrawSVG/,
  'lenis': /[Ll]enis/,
  'lenis version': /lenis@?["'s]*\s*[:=]\s*["']1\.\d+\.\d+|version\s*[:=]\s*["']1\.\d+\.\d+["'][^;]{0,40}lenis/i,
  'locomotive': /LocomotiveScroll|locomotive/,
  'react': /react(-dom)?\.production|__SECRET_INTERNALS|ReactVersion/,
  'react version': /version\s*[:=]\s*["']1[89]\.\d+\.\d+["']/,
  'next app router': /app-router|__next_f|next\/dist/,
  'framer motion': /framer|MotionConfig|AnimatePresence|motion\./,
  'barba/swup': /barba|swup/,
  'rive': /\brive\b|RiveAnimation/,
  'lottie': /lottie/i,
  'theatre': /theatre|@theatre/,
  'howler': /Howl\b|howler/i,
  'pixi': /PIXI|pixi\.js/,
  'babylon': /BABYLON|babylon/,
  'ogl-style shaders': /attribute vec3 position|uniform mat4 (projectionMatrix|modelViewMatrix)/,
  'glsl noise': /simplex|cnoise|snoise|curl ?noise|fbm/i,
  'fresnel/dissolve/clip': /fresnel|dissolve|clippingPlanes|uProgress/i,
  'reduced motion': /prefers-reduced-motion|reducedMotion|reduced-motion/i,
  'webgl fail msg': /WebGL.*(not supported|unsupported|failed|unavailable)|webglContextLost|webglcontextlost/i,
  'media queries mq': /matchMedia\(/,
  'video tag/canvas vid': /createElement\(["']video|<video|autoplay/i,
  'audio': /AudioContext|\.mp3|\.ogg|\.wav|Howl/,
  'sourcemaps': /sourceMappingURL/,
  'fonts preload': /woff2/,
  'sanity cms': /sanity\.io|cdn\.sanity/,
  'useTransform/scrollYProgress (fr)': /useTransform|useScroll|scrollYProgress/,
};

const out = {};
for (const f of files) {
  const src = readFileSync(join(dir, f), 'utf8');
  const row = {};
  for (const [label, re] of Object.entries(patterns)) {
    const m = src.match(new RegExp(re.source, 'g' + (re.flags.includes('i') ? 'i' : '')));
    row[label] = m ? m.length : 0;
    if (label.includes('REVISION') && m) row['three revision value'] = m[0].match(/(\d+)/)?.[1];
  }
  out[f] = row;
}
// compact print: only non-zero cells
for (const [f, row] of Object.entries(out)) {
  const hits = Object.entries(row).filter(([k, v]) => v > 0 && k !== 'three revision value');
  console.log('\n== ' + f);
  console.log(hits.map(([k, v]) => `${k}=${v}${k === 'three REVISION token' ? ' rev=' + row['three revision value'] : ''}`).join(' | ') || '(no fingerprint hits)');
}
