// Grep downloaded chunks for library fingerprints. Prints only identifying hits, never long excerpts.
import fs from 'node:fs';
const dir = process.argv[2] || '.';
const pats = {
  version: /version[":'=]+\s*["'][\d.]+["']/g,
  semver: /\b\d+\.\d+\.\d+\b/g,
  three: /REVISION|WebGLRenderer|PerspectiveCamera/g,
  gsap: /gsap|ScrollTrigger/gi,
  smooth: /lenis|locomotive|scrollsmoother|data-scroll/gi,
  transition: /barba|swup|startViewTransition/gi,
  misc: /theatre|rive|lottie|howler|splinetool|spline-viewer/gi,
  motion: /framer-motion|useReducedMotion|useScroll|useTransform|useSpring|AnimatePresence|dominant-window/g,
  hooks: /requestAnimationFrame|scrollY|IntersectionObserver|ResizeObserver|wheel|touchmove/g,
};
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.mjs') && !f.endsWith('.js')) continue;
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8');
  console.log('==', f, 'bytes', s.length);
  for (const [name, p] of Object.entries(pats)) {
    const m = s.match(p);
    if (!m) continue;
    const uniq = [...new Set(m.map((x) => (typeof x === 'string' ? x.toLowerCase().slice(0, 40) : x)))].slice(0, 10);
    console.log(`  ${name}:`, uniq.join(' | '));
  }
}
