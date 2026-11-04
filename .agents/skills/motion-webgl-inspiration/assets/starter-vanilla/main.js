// Scroll-story starter: three.js + GSAP ScrollTrigger + Lenis.
// One fixed canvas behind DOM sections. Scroll progress drives camera, exploded view and HUD.
// Configure in scene.config.js. Start from this; don't paste in code from reference sites.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONFIG } from './scene.config.js';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('webgl');
const loaderEl = document.getElementById('loader');
const hudEl = document.getElementById('hud');
const linesEl = document.getElementById('hud-lines');
const pctEl = document.getElementById('hud-pct');
const sections = [...document.querySelectorAll('#story [data-beat]')];

// ---------- Renderer, scene, camera ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = {
  AgX: THREE.AgXToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping,
  Neutral: THREE.NeutralToneMapping,
}[CONFIG.toneMapping] ?? THREE.AgXToneMapping;
renderer.toneMappingExposure = CONFIG.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.background);
scene.environmentIntensity = CONFIG.envIntensity;

const isNarrow = () => window.innerWidth < 720;
const fov = () => (isNarrow() ? CONFIG.fov * 1.15 : CONFIG.fov);
// Portrait screens: dolly the spline camera back so the whole model fits the narrow frame.
const dolly = () => {
  const aspect = window.innerWidth / window.innerHeight;
  return aspect >= 1 ? 1 : THREE.MathUtils.clamp(0.8 / aspect, 1, 2.2);
};
let camera = new THREE.PerspectiveCamera(fov(), window.innerWidth / window.innerHeight, 0.05, 200);

// Key + rim light. The environment does most of the work; these give shape and separation.
const key = new THREE.DirectionalLight(0xfff1e0, 2.2); // ~5000K-ish warm key
key.position.set(4, 6, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -4;
key.shadow.camera.right = key.shadow.camera.top = 4;
key.shadow.radius = 6;
scene.add(key);
const rim = new THREE.DirectionalLight(0xcfe3ff, 1.4); // cool rim
rim.position.set(-5, 3, -4);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---------- CAD helpers ----------
// GLTFLoader sanitizes node names (spaces -> "_", strips []:./) and suffixes duplicates (_1, _2…).
// Resolve config keys against raw, sanitized and duplicate-suffixed names; return every top-most match.
function resolveNodes(root, key) {
  const want = THREE.PropertyBinding.sanitizeNodeName(key);
  const dup = new RegExp(`^${want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(_\\d+)?$`);
  const hits = [];
  root.traverse((o) => { if (o.name === key || o.name === want || dup.test(o.name)) hits.push(o); });
  return hits.filter((o) => !hits.some((h) => h !== o && isAncestor(h, o)));
}
const isAncestor = (a, o) => { for (let p = o.parent; p; p = p.parent) if (p === a) return true; return false; };

// CAD exports usually carry display colors only (metalness 0, roughness 1), which renders chalky.
// 'cad-auto': neutral colors -> metal (light = machined, dark = black oxide); saturated -> painted.
function applyMaterialPreset(root, preset) {
  if (preset !== 'cad-auto') return;
  const cache = new Map();
  const hsl = { h: 0, s: 0, l: 0 };
  root.traverse((o) => {
    if (!o.isMesh) return;
    const src = o.material;
    if (!src || src.metalness > 0 || src.roughness < 1 || src.map) return; // already authored: keep
    if (!cache.has(src)) {
      src.color.getHSL(hsl);
      const neutral = hsl.s < 0.18;
      const m = new THREE.MeshPhysicalMaterial({ color: src.color.clone(), name: `${src.name}:cad-auto` });
      if (neutral) {
        m.metalness = 1;
        m.roughness = hsl.l > 0.5 ? 0.32 : 0.48;             // machined steel vs black oxide
        if (hsl.l < 0.12) m.color.setScalar(0.05);           // keep black oxide visible
        else m.color.setHSL(hsl.h, hsl.s, Math.min(0.9, 0.35 + hsl.l * 0.6));
      } else {
        m.metalness = 0; m.roughness = 0.42; m.clearcoat = 0.5; m.clearcoatRoughness = 0.3; // paint/anodize
      }
      cache.set(src, m);
    }
    o.material = cache.get(src);
  });
}

// ---------- Environment ----------
async function loadEnvironment() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  if (CONFIG.hdrUrl) {
    const hdr = await new HDRLoader().loadAsync(CONFIG.hdrUrl);
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
  } else {
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }
  pmrem.dispose();
}

// ---------- Model ----------
function placeholderAssembly() {
  // Stand-in "pump package" with CAD-style node names. Replace via CONFIG.modelUrl.
  const root = new THREE.Group();
  root.name = 'assembly';
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x2b3a2f, metalness: 0, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const castIron = new THREE.MeshStandardMaterial({ color: 0x5a5d60, metalness: 1, roughness: 0.55 });
  const machined = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 1, roughness: 0.28 });
  const accent = new THREE.MeshPhysicalMaterial({ color: 0xffb000, metalness: 0, roughness: 0.4, clearcoat: 0.5 });

  const frame = new THREE.Group(); frame.name = 'frame';
  const rail = new THREE.BoxGeometry(3.4, 0.16, 0.12);
  for (const z of [-0.55, 0.55]) { const m = new THREE.Mesh(rail, paint); m.position.set(0, 0.08, z); frame.add(m); }
  for (const x of [-1.5, -0.5, 0.5, 1.5]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.1), paint); m.position.set(x, 0.1, 0); frame.add(m); }

  const engine = new THREE.Group(); engine.name = 'engine';
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.8), castIron); block.position.set(-0.7, 0.62, 0); engine.add(block);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.6), accent); cover.position.set(-0.7, 1.1, 0); engine.add(cover);
  const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 48), machined); flywheel.rotation.z = Math.PI / 2; flywheel.position.set(0.05, 0.62, 0); engine.add(flywheel);

  const pumpEnd = new THREE.Group(); pumpEnd.name = 'pump_end';
  const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.42, 64), castIron); volute.rotation.z = Math.PI / 2; volute.position.set(0.75, 0.62, 0); pumpEnd.add(volute);
  const suction = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 40), machined); suction.rotation.z = Math.PI / 2; suction.position.set(1.2, 0.62, 0); pumpEnd.add(suction);
  const discharge = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.55, 40), machined); discharge.position.set(0.75, 1.1, 0); pumpEnd.add(discharge);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 48), machined); flange.position.set(0.75, 1.38, 0); pumpEnd.add(flange);

  root.add(frame, engine, pumpEnd);
  return { root, animations: [], cameras: [] };
}

async function loadModel() {
  if (!CONFIG.modelUrl) return placeholderAssembly();
  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(CONFIG.modelUrl);
  gltf.scene.scale.setScalar(CONFIG.modelScale);
  return { root: gltf.scene, animations: gltf.animations, cameras: gltf.cameras };
}

// ---------- Scroll mapping ----------
// Beat i "arrives" when its section's top reaches the viewport top.
// Anchors map overall progress p (0..1) to a spline parameter u with an eased hold at each beat.
let anchors = [];
function computeAnchors() {
  const story = document.getElementById('story');
  const range = Math.max(1, story.offsetHeight - window.innerHeight);
  anchors = sections.map((s, i) => (i === 0 ? 0 : Math.min(1, (s.offsetTop - story.offsetTop) / range)));
  if (anchors.length > 1) anchors[anchors.length - 1] = 1;
}
const smooth = (t) => t * t * (3 - 2 * t); // smoothstep: ease out of and into each beat

function beatState(p) {
  const n = CONFIG.beats.length;
  if (n === 1) return { k: 0, local: 0, u: 0 };
  let k = 0;
  while (k < n - 2 && p > anchors[k + 1]) k++;
  const span = Math.max(1e-6, anchors[k + 1] - anchors[k]);
  const local = smooth(THREE.MathUtils.clamp((p - anchors[k]) / span, 0, 1));
  return { k, local, u: (k + local) / (n - 1) };
}

// ---------- Main ----------
const v3 = (a) => new THREE.Vector3(...a);
const parts = [];      // { node, base, offsetLocal }
const callouts = [];   // { name, node, anchorLocal, el, line, dot }
let posCurve, tgtCurve, mixer, clipDuration = 0;
let targetP = 0, currentP = -1;
let sceneFit = null; // { center, radius } after load
let buildCurves = null; // rebuilt on resize so mobile overrides apply

async function init() {
  try {
    await loadEnvironment();
    const model = await loadModel();
    model.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    applyMaterialPreset(model.root, CONFIG.materials);
    scene.add(model.root);
    scene.updateMatrixWorld(true);

    // Fit: ground under the model, shadow frustum, clip planes, and (optionally) model-relative beats.
    const box = new THREE.Box3().setFromObject(model.root);
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    ground.position.y = box.min.y - radius * 0.002;
    key.position.copy(center).add(new THREE.Vector3(1, 1.6, 0.8).multiplyScalar(radius * 2.5));
    key.target.position.copy(center); scene.add(key.target);
    rim.position.copy(center).add(new THREE.Vector3(-1.3, 0.8, -1).multiplyScalar(radius * 2.5));
    const sc = key.shadow.camera;
    sc.left = sc.bottom = -radius * 1.4; sc.right = sc.top = radius * 1.4;
    sc.near = radius * 0.5; sc.far = radius * 8; sc.updateProjectionMatrix();
    key.shadow.bias = -0.0005; key.shadow.normalBias = radius * 0.004;
    camera.near = radius * 0.02; camera.far = radius * 40;
    const toWorld = (a) => (CONFIG.fitToModel ? v3(a).multiplyScalar(radius).add(center) : v3(a));
    sceneFit = { center, radius };

    // Exploded-view parts: convert world-axis offsets to each node's parent space.
    // Offsets are world-axis vectors; with fitToModel they're multiples of the model radius.
    for (const [name, off] of Object.entries(CONFIG.explode)) {
      const nodes = resolveNodes(model.root, name);
      if (!nodes.length) { console.warn(`[explode] node not found: ${name}`); continue; }
      // explodeUnits 'meters' keeps measured offsets (e.g. a project's own ladder) exact under fitToModel.
      const relative = CONFIG.fitToModel && CONFIG.explodeUnits !== 'meters';
      const offWorld = v3(off).multiplyScalar(relative ? radius : 1);
      for (const node of nodes) {
        const parent = node.parent;
        const origin = parent.worldToLocal(new THREE.Vector3(0, 0, 0));
        const tip = parent.worldToLocal(offWorld.clone());
        parts.push({ node, base: node.position.clone(), offsetLocal: tip.sub(origin) });
      }
    }

    // HUD callouts anchored at each node's bounding-box center.
    for (const [name, label] of Object.entries(CONFIG.callouts)) {
      const node = resolveNodes(model.root, name)[0];
      if (!node) { console.warn(`[callout] node not found: ${name}`); continue; }
      const center = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
      const el = document.createElement('div');
      el.className = 'callout';
      el.innerHTML = `<span class="title"></span><span class="spec"></span>`;
      el.querySelector('.title').textContent = label.title;
      el.querySelector('.spec').textContent = label.spec;
      hudEl.appendChild(el);
      const ns = 'http://www.w3.org/2000/svg';
      const line = document.createElementNS(ns, 'line');
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('r', '2.5');
      linesEl.append(line, dot);
      callouts.push({ name, node, anchorLocal: node.worldToLocal(center), el, line, dot });
    }

    // Camera: baked glTF clip if present, otherwise splines through the beats.
    const clip = model.animations.find((a) => a.name === CONFIG.cameraClip);
    if (clip && model.cameras.length) {
      camera = model.cameras[0];
      mixer = new THREE.AnimationMixer(model.root);
      mixer.clipAction(clip).play(); // keep playing; mixer.setTime() scrubs it
      clipDuration = clip.duration;
    } else {
      buildCurves = () => {
        // Per-beat `mobile: { camera, target }` overrides apply on narrow screens (long parts need
        // a more foreshortened angle in portrait than a dolly-back alone can give).
        const pick = (b, k) => (isNarrow() && b.mobile?.[k]) || b[k];
        posCurve = new THREE.CatmullRomCurve3(CONFIG.beats.map((b) => toWorld(pick(b, 'camera'))), false, 'centripetal');
        tgtCurve = new THREE.CatmullRomCurve3(CONFIG.beats.map((b) => toWorld(pick(b, 'target'))), false, 'centripetal');
      };
      buildCurves();
    }
    onResize();

    // Smooth scroll (skipped for reduced motion) feeding ScrollTrigger.
    if (!reduceMotion) {
      const lenis = new Lenis();
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    ScrollTrigger.create({
      trigger: '#story', start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { targetP = self.progress; },
    });
    ScrollTrigger.addEventListener('refresh', computeAnchors);
    computeAnchors();
    targetP = ScrollTrigger.getAll()[0]?.progress ?? 0;

    gsap.ticker.add(tick);
    loaderEl.classList.add('is-done');
    window.__scrollStory = {
      ready: true,
      fit: { center: sceneFit.center.toArray(), radius: sceneFit.radius },
      parts: parts.map((p) => p.node.name),
      callouts: callouts.map((c) => c.node.name),
      state: () => ({ p: currentP, target: targetP, ...beatState(currentP) }),
    };
  } catch (err) {
    console.error(err);
    loaderEl.textContent = 'MODEL FAILED TO LOAD — SEE CONSOLE';
    window.__scrollStory = { ready: false, error: String(err) };
  }
}

const tmp = new THREE.Vector3();
function tick(time, deltaMs) {
  // Frame-rate independent damping: same feel at 30, 60 or 120 fps.
  const alpha = reduceMotion ? 1 : 1 - Math.pow(1 - CONFIG.damping, (deltaMs || 16.667) / 16.667);
  const next = currentP < 0 ? targetP : currentP + (targetP - currentP) * alpha;
  if (Math.abs(next - currentP) < 1e-5) return; // settled: skip render
  currentP = next;

  const { k, local, u } = beatState(currentP);
  const beats = CONFIG.beats;
  const b0 = beats[k], b1 = beats[Math.min(k + 1, beats.length - 1)];

  // Camera
  if (mixer) {
    mixer.setTime(currentP * clipDuration);
  } else {
    const target = tgtCurve.getPoint(u);
    camera.position.copy(posCurve.getPoint(u)).sub(target).multiplyScalar(dolly()).add(target);
    // Never let a spline swing pass through the model: keep a minimum distance from its center.
    if (CONFIG.minCameraDistance && sceneFit) {
      const min = CONFIG.minCameraDistance * (CONFIG.fitToModel ? sceneFit.radius : 1);
      tmp.copy(camera.position).sub(sceneFit.center);
      const d = tmp.length();
      if (d < min) camera.position.copy(sceneFit.center).addScaledVector(tmp, min / Math.max(d, 1e-6));
    }
    camera.lookAt(target);
  }

  // Exploded view
  const explode = THREE.MathUtils.lerp(b0.explode ?? 0, b1.explode ?? 0, local);
  for (const part of parts) part.node.position.copy(part.base).addScaledVector(part.offsetLocal, explode);

  renderer.render(scene, camera);
  updateHud(local < 0.5 ? b0 : b1);
  pctEl.textContent = String(Math.round(currentP * 100)).padStart(3, '0');
}

function updateHud(activeBeat) {
  const active = new Set(activeBeat.callouts ?? []);
  const w = window.innerWidth, h = window.innerHeight;
  const gap = isNarrow() ? 36 : 70;
  const shown = [];
  for (const c of callouts) {
    tmp.copy(c.anchorLocal);
    c.node.localToWorld(tmp);
    tmp.project(camera);
    const inView = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
    const show = active.has(c.name) && inView;
    c.el.classList.toggle('is-visible', show);
    c.line.style.opacity = c.dot.style.opacity = show ? 1 : 0;
    if (!show) continue;
    const x = (tmp.x * 0.5 + 0.5) * w;
    const y = (-tmp.y * 0.5 + 0.5) * h;
    const lw = c.el.offsetWidth, lh = c.el.offsetHeight;
    const right = x > w * 0.5;
    shown.push({ c, x, y, lw, lh,
      lx: THREE.MathUtils.clamp(right ? x + gap : x - gap - lw, 8, w - lw - 8),
      ly: THREE.MathUtils.clamp(y - gap, 8, h - lh - 8) });
  }
  if (isNarrow()) {
    // Narrow screens: dock labels as a list along the bottom edge so they never cover the model;
    // leader lines still run up to each part. Ordered left-to-right by anchor to minimize crossings.
    shown.sort((a, b) => a.x - b.x);
    let y = h - 72;
    for (let i = shown.length - 1; i >= 0; i--) { y -= shown[i].lh + 6; shown[i].lx = 12; shown[i].ly = y; }
  }
  // Simple collision pass: stack overlapping labels vertically.
  if (!isNarrow()) shown.sort((a, b) => a.ly - b.ly);
  for (let i = 1; !isNarrow() && i < shown.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = shown[j], b = shown[i];
      const overlapX = b.lx < a.lx + a.lw && a.lx < b.lx + b.lw;
      if (overlapX && b.ly < a.ly + a.lh + 6) b.ly = Math.min(a.ly + a.lh + 6, h - b.lh - 8);
    }
  }
  for (const { c, x, y, lw, lh, lx, ly } of shown) {
    c.el.style.transform = `translate(${Math.round(lx)}px, ${Math.round(ly)}px)`;
    c.line.setAttribute('x1', x); c.line.setAttribute('y1', y);
    c.line.setAttribute('x2', lx + (x > lx + lw / 2 ? lw : 0));
    c.line.setAttribute('y2', isNarrow() ? ly : ly + lh); // docked labels: line meets the top edge
    c.dot.setAttribute('cx', x); c.dot.setAttribute('cy', y);
  }
}

function onResize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  if (!mixer) camera.fov = fov();
  // Shift the framing sideways so the model clears the copy column (desktop only).
  const shift = isNarrow() ? 0 : CONFIG.frameOffsetX ?? 0;
  if (shift) camera.setViewOffset(w, h, -w * shift, 0, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  buildCurves?.();
  currentP = -1; // force a redraw
}
window.addEventListener('resize', onResize);

init();
