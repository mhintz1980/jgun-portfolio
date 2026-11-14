// Extract exact version tokens + asset URL references from chunks (identifying lines only).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('../exports/chunks/', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));

const hunts = {
  threeRevision: /REVISION\s*=\s*["'][^"']+["']/,
  threeRevisionAlt: /revision\s*:\s*["'][^"']+["']/i,
  gsapVersion: /(?:gsap|core)[^;]{0,60}?["']3\.\d+\.\d+["']|["']3\.\d+\.\d+["'][^;]{0,40}?gsap/i,
  lenisVersion: /lenis[^;]{0,80}?["']1\.\d+\.\d+["']|["']1\.\d+\.\d+["'][^;]{0,60}?lenis/i,
  splittEtc: /"(SplitText|Flip|CustomEase|DrawSVG|MorphSVG|ScrambleText|MotionPath)"/g,
  assetRefs: /["'`(][^"'`()\s]{0,120}?\.(glb|gltf|hdr|exr|ktx2|basis|mp4|webm|mp3|ogg|wav|splat|ply|draco)(["'?()\\ ]|$)/g,
  imgRefs: /[^"'`()\s]{0,80}\.(png|jpg|jpeg|webp|avif)/gi,
  webglFailText: /["'`][^"'`]{0,140}(WebGL|webgl)[^"'`]{0,140}["'`]/g,
  reducedMotion: /["'`][^"'`]{0,100}(prefers-reduced-motion|reduced-motion|reducedMotion)[^"'`]{0,100}["'`]/g,
  reactVer: /"(1[89]\.\d+\.\d+[^"]*)"/,
  nextVer: /next[^a-z]{0,20}(\d{1,2}\.\d+\.\d+)/,
};

for (const f of files) {
  const src = readFileSync(join(dir, f), 'utf8');
  const lines = [];
  const grab = (label, re, limit = 3) => {
    const ms = src.match(re);
    if (ms) lines.push(`${label}: ${JSON.stringify(ms.slice(0, limit))}`);
  };
  grab('threeRevision', hunts.threeRevision);
  grab('threeRevisionAlt', hunts.threeRevisionAlt);
  grab('gsapVersion', hunts.gsapVersion);
  grab('lenisVersion', hunts.lenisVersion);
  grab('reactVer', hunts.reactVer);
  grab('nextVer', hunts.nextVer);
  const sp = [...new Set((src.match(hunts.splittEtc) || []).map((m) => m))];
  if (sp.length) lines.push('gsap plugin names: ' + JSON.stringify(sp.slice(0, 10)));
  const assets = [...new Set((src.match(hunts.assetRefs) || []).map((m) => m.slice(0, 130)))];
  if (assets.length) lines.push('asset refs: ' + JSON.stringify(assets.slice(0, 12)));
  const imgs = [...new Set((src.match(hunts.imgRefs) || []).map((m) => m.slice(0, 90)))];
  if (imgs.length) lines.push('img refs: ' + JSON.stringify(imgs.slice(0, 8)));
  const wgl = [...new Set((src.match(hunts.webglFailText) || []).map((m) => m.slice(0, 180)))];
  if (wgl.length) lines.push('webgl strings: ' + JSON.stringify(wgl.slice(0, 5)));
  const rm = [...new Set((src.match(hunts.reducedMotion) || []).map((m) => m.slice(0, 170)))];
  if (rm.length) lines.push('reduced-motion strings: ' + JSON.stringify(rm.slice(0, 6)));
  if (lines.length) {
    console.log('\n== ' + f);
    for (const l of lines) console.log('  ' + l);
  }
}
