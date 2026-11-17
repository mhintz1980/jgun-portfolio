// Scan a JS bundle for identifying strings. Usage: node scan.mjs <file>
import { readFileSync } from 'node:fs';
const src = readFileSync(process.argv[2], 'utf8');
const pats = [
  ['sourceMappingURL', /\/\/# sourceMappingURL=(\S+)/],
  ['gsap version', /version:\s*["'](\d+\.\d+\.\d+)["']/g],
  ['gsap core', /gsap|\bGSAP\b/g],
  ['ScrollTrigger', /ScrollTrigger/g],
  ['SplitText', /SplitText/g],
  ['Flip plugin', /\bFlip\b/g],
  ['ScrollSmoother', /ScrollSmoother/g],
  ['CustomEase', /CustomEase/g],
  ['MotionPath', /MotionPath/g],
  ['DrawSVG', /DrawSVG/g],
  ['MorphSVG', /MorphSVG/g],
  ['Draggable', /Draggable/g],
  ['Observer', /Observer\.create/g],
  ['three REVISION', /REVISION\s*=\s*["'](\d+)["']/],
  ['three marks', /ShaderMaterial|PerspectiveCamera|WebGLRenderer/g],
  ['pixi', /PIXI|Application\(|data-engine/g],
  ['lenis', /[Ll]enis/g],
  ['locomotive', /locomotive/gi],
  ['rive', /@rive-app|rive\.wasm|Rive\b/g],
  ['lottie', /lottie/gi],
  ['barba', /barba/gi],
  ['swup', /swup/gi],
  ['howler', /howler/gi],
  ['theatre', /theatre\.js|@theatre/gi],
  ['sog/splat', /\.sog|splat|gaussian/gi],
  ['msdf', /msdf/gi],
  ['lusion', /lusion/gi],
  ['astro', /astro-island|Astro/g],
  ['smaa', /smaa/gi],
  ['lut/LDR_RGB', /LDR_RGB1_0|LUT/g],
  ['harmonics', /harmonics/gi],
  ['fetch-priority/eager hints', /fetchpriority/gi],
  ['prefers-reduced-motion', /prefers-reduced-motion/gi],
  ['view-transition', /startViewTransition/g],
  ['IntersectionObserver', /IntersectionObserver/g],
  ['ResizeObserver', /ResizeObserver/g],
  ['matchMedia', /matchMedia\(/g],
  ['vimeo', /vimeo/gi],
  ['webrtc/webgpu', /webgpu|WebGPU/g],
  ['workers', /new Worker|Worker\(/g],
  ['comlink', /comlink/gi],
];
for (const [name, re0] of pats) {
  const re = new RegExp(re0.source, re0.flags.includes('g') ? re0.flags : re0.flags + 'g');
  const m = [...src.matchAll(re)];
  if (m.length) {
    const uniq = [...new Set(m.slice(0, 50).map(x => (x[1] !== undefined && re.source.indexOf('(') === 0 ? x[1] : x[0])))];
    console.log(`== ${name}: ${m.length} hit(s)` + (uniq.length <= 6 ? ` -> ${JSON.stringify(uniq)}` : ` -> first: ${JSON.stringify(uniq.slice(0, 3))}`));
    if (m.length <= 4) {
      for (const x of m) {
        const i = x.index;
        console.log(`   ctx: ...${src.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' ')}...`);
      }
    }
  }
}
