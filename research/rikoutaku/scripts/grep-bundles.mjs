// Grep exported bundles for library/system signatures.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts-export');
const pats = {
  'registerPlugin': /registerPlugin\(/g, 'ScrollTrigger': /ScrollTrigger/g, 'lenis': /lenis/gi,
  'locomotive': /locomotive/gi, 'startViewTransition': /startViewTransition/g,
  'prefers-reduced-motion': /prefers-reduced-motion/g, 'REVISION': /REVISION/g,
  'WebGLRenderer': /WebGLRenderer/g, 'Scatter': /Scatter/g, 'Tyndall': /Tyndall/g,
  'Guestbook': /Guestbook/g, 'arrangement': /arrangement/gi, 'matchMedia': /matchMedia/g,
  'barba|swup': /barba|swup/gi, 'SplitType|SplitText': /SplitType|SplitText/g,
  'howler': /howler/gi, 'lottie': /lottie/gi, 'rive': /\brive\b/gi,
  'IntersectionObserver': /IntersectionObserver/g, 'ResizeObserver': /ResizeObserver/g,
  'requestAnimationFrame': /requestAnimationFrame/g, 'wheel-listener': /addEventListener\(["'`]wheel/g,
  'touchmove-listener': /addEventListener\(["'`]touchmove/g, 'gsap-ticker': /gsap\.ticker|ticker\.add/g,
  'data-motion': /data-motion/g, 'Draco': /draco/gi, 'KTX2': /ktx2/gi, 'splat': /splat/gi,
  'GLTFLoader': /GLTFLoader/g, 'curtain': /curtain/gi, 'helix': /helix/gi,
  'layout.json': /layouts\.json/g, 'composition': /composition/g, 'chapter': /chapter/g,
  'pointer-lock': /pointerlock/gi, 'pinch': /pinch|gesturestart/gi
};
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.js')) continue;
  const t = readFileSync(resolve(dir, f), 'utf8');
  const hits = [];
  for (const [k, re] of Object.entries(pats)) { const m = t.match(re); if (m) hits.push(`${k}:${m.length}`); }
  if (hits.length) console.log(f.slice(0, 58), '=>', hits.join(', '));
}
