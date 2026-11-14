// Hunt app-specific scene/scroll identifiers in the app chunk (identifying lines only).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const dir = fileURLToPath(new URL('../exports/chunks/', import.meta.url));
const src = readFileSync(join(dir, '271d7upkv9vei.js'), 'utf8');

const hunts = {
  uniforms: /\b(?:uniforms|uTime|uProgress|uScroll|uVelocity|uNoise|uMouse)\b/g,
  shaderChunkNames: /["'`](crt|scanline|noise|pixel|ascii|terminal|grid|dither|fade|reveal|dissolve|keypad|cathode|phosphor|pixelate|speed|warp|tunnel|stars|smoke|fluid)[-_a-zA-Z0-9]{0,24}["'`]/gi,
  threeClasses: /\bnew (?:t\.|)(?:Scene|PerspectiveCamera|OrthographicCamera|PlaneGeometry|BoxGeometry|GridHelper|Points|ShaderMaterial|MeshBasicMaterial|InstancedMesh|BufferGeometry|Texture|Clock)\b/g,
  lenisWire: /\bnew (?:\w{1,3}\.)?Lenis\b|lenis[^;]{0,50}\.on\(["']scroll|autoRaf|lerp\s*:\s*[\d.]+|duration\s*:\s*[\d.]+|wheelMultiplier|syncTouch/g,
  scrollTriggerWire: /ScrollTrigger[^;]{0,60}(scroller|trigger|start|end|scrub|pin)|scrub\s*:\s*(?:!0|[\d.]+|["'][^"']+["'])|pin\s*:\s*!0|toggleActions/g,
  smoother: /ScrollSmoother[^;]{0,80}|normalizeScroll|smoothTouch/g,
  splitText: /SplitText[^;]{0,60}|type\s*:\s*["'](chars|lines|words)[^"']*["']/g,
  gsapTimelines: /(?:gsap\.)?timeline\(\{[^}]{0,120}/g,
  easings: /(?:CustomEase|power[123]\.(?:in|out|inOut)|expo\.|back\.|elastic\.|sine\.|circ\.)/g,
  nextTransitions: /template\.tsx|usePathname|AnimatePresence|ViewTransition|startViewTransition|unstable_ViewTransition/g,
  observers: /IntersectionObserver|ResizeObserver|MutationObserver/g,
  pixelRatio: /setPixelRatio|devicePixelRatio/g,
  pauseGuards: /document\.hidden|visibilitychange|requestAnimationFrame/g,
  sceneNames: /["'`](intro|hero|work|approach|studio|contact|keypad|terminal|monitor|screen|pixels|cursor|arrow|scroll|progress|noise|starfield|warp)[-_a-zA-Z0-9]{0,30}["'`]/gi,
};

for (const [label, re] of Object.entries(hunts)) {
  const matches = [...new Set((src.match(re) || []).map((m) => m.slice(0, 90)))];
  console.log('\n' + label + ' (' + matches.length + '):');
  if (matches.length) console.log('  ' + JSON.stringify(matches.slice(0, 14)));
}
