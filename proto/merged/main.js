// Exploded view: studiomark.dev homepage concept 3.
// One planetary gear train, generated from tooth counts, drawn as a paper sheet. A lens renders it.
// Picking a project tips the camera over the stack and drops it down the bore.
import * as THREE from './lib/three.module.js'

const $ = id => document.getElementById(id)
const Q = new URLSearchParams(location.search)
let stored = null; try { stored = localStorage.getItem('sm-theme') } catch (e) {}
const DARK = Q.has('dark') || (!Q.has('light') && stored === 'dark'), EXTRA = 1.5   // EXTRA: screens of scroll the opening film gets before the gear train
if (DARK) document.documentElement.classList.add('dark')
const FREEZE = Q.has('t'), T0 = parseFloat(Q.get('t')) || 0
const VIEW = Q.get('view') || ''
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const TAU = Math.PI * 2
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const damp = (rate, dt) => 1 - Math.exp(-rate * dt)

/* ───────────── content (wording from src/home/content.ts) ───────────── */
const PROJECTS = [
  { n: '01', title: 'Industrial torque wrench', line: 'A pneumatic torque wrench and its planetary gearbox, taken apart in 3D as you scroll.', tags: 'Planetary gearbox · GD&T · DFM', status: 'Live, work in progress', href: '/torque-wrench/', link: 'Open the 3D teardown',
    imgs: [['/home/stacks/torque-wrench/08.webp', 'Sun-to-planet mesh, macro view'], ['/home/stacks/torque-wrench/09.webp', 'Stage 1 planets seated on the sun gear'], ['/home/stacks/torque-wrench/07.webp', 'Hobbed shaft, formed gear teeth'], ['/home/stacks/torque-wrench/05.webp', 'Gear housing detail drawing']] },
  { n: '02', title: 'The Quiet Machine', line: 'A diesel pump package in a sound-attenuating enclosure: air path, heat and sound, in section.', tags: 'Enclosures · sheet metal · weldments', status: 'Live, work in progress', href: '/quiet-machine/', link: 'Open the 3D section study',
    imgs: [['/home/stacks/quiet-machine/01.webp', 'Cutaway: pump, drive and engine'], ['/home/stacks/quiet-machine/02.webp', 'Sound-attenuated enclosure, closed'], ['/home/stacks/quiet-machine/04.webp', 'Enclosure framing and baffles'], ['/home/stacks/quiet-machine/06.webp', 'Skid base, under-floor detail']] },
  { n: '03', title: 'Armament components and receiver systems', line: 'Rifle receivers and small-arms parts, drawn for the machine shop. That includes M249 receiver work: 3D scan data rebuilt into toleranced, manufacturable CAD.', tags: 'Forgings · GD&T · machining', status: 'Under construction', href: '/armament/', link: 'Open the project page',
    imgs: [['/home/stacks/armament/07.webp', 'AR-pattern rifle, grayscale render'], ['/home/stacks/armament/05.webp', 'Billet upper and lower, CAD render'], ['/home/stacks/armament/03.webp', 'Handguard, three views'], ['/home/stacks/armament/02.webp', 'Lower receiver machining drawing'], ['/home/stacks/armament/08.webp', 'Bolt carrier, CAD render']] },
  { n: '04', title: 'Renderings and visualizations', line: 'Product renders made straight from the CAD model.', tags: 'Rendering · materials · lighting', status: 'Gallery', href: null, link: '',
    imgs: [['/home/stacks/renderings/03.webp', 'Gearbox drive, low-key lighting'], ['/home/stacks/renderings/02.webp', 'Hydraulic square-drive wrench'], ['/home/stacks/renderings/04.webp', 'Angle-head tool study'], ['/home/stacks/renderings/05.webp', 'Free-float handguard']] },
]
const PLUS = [
  ['PumpTracker', 'Used in production', 'Replaced the whiteboard and spreadsheets and gave the shop its first KPIs. Every lead and manager used it, phones included.', 'React · TypeScript · Supabase'],
  ['StudioMark', 'Working pipeline', 'Product renders and video straight from CAD, without a photo shoot.', 'Blender · Python · cloud GPU'],
  ['CAD/PDM tools', 'Prototype', 'Brings legacy DXF drawings up to current standards, and checks a release before it reaches the shop.', 'Python · SolidWorks PDM'],
]
const ROLL = ['convert complex CAD into shop-floor reality.', 'eliminate friction between design and fabrication.', 'bring half-thou precision to full-stack development.', 'hard-code manufacturability into every assembly.']
const VIEWS = ['Exploded stack', 'Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Full train', 'Assembled']

/* ───────────── the machine: every part comes from these numbers ───────────── */
const M = 0.12, ZR = 48, FACE = 0.62, GAP = 5.8, BORE = 0.3
const STAGES = [{ Zs: 12, Zp: 18, n: 3 }, { Zs: 12, Zp: 18, n: 4 }, { Zs: 24, Zp: 12, n: 6 }, { Zs: 18, Zp: 15, n: 3 }]
const RO = M * ZR / 2 + 0.54
const ratio = s => 1 + ZR / s.Zs

document.querySelectorAll('.proj-p').forEach((el, i) => {
  const p = PROJECTS[i], s = STAGES[i]
  el.innerHTML = `<div class="num" aria-hidden="true">${p.n}</div><div class="k mono">${p.status}</div><h2>${p.title}</h2><p>${p.line}</p>
  <dl class="spec mono"><dt>Work</dt><dd>${p.tags}</dd><dt>This stage</dt><dd>${s.Zs} / ${s.Zp} / ${ZR} teeth · ${s.n} planets · ${ratio(s).toFixed(2).replace(/\.?0+$/, '')} : 1</dd></dl>
  <button class="btn mono" data-fall="${i + 1}">Fall into project ${p.n} <i>↓</i></button>`
})
$('plus').innerHTML = PLUS.map(([t, st, l, k]) => `<li><h3>${t}</h3><span class="mono st">${st}</span><p>${l}</p><span class="mono" style="opacity:.62">${k}</span></li>`).join('')

/* ───────────── renderer ───────────── */
const canvas = $('gl')
let renderer
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false }) } catch (e) { renderer = null }
if (!renderer || !renderer.capabilities.isWebGL2) { $('bootT').style.display = 'none'; $('nogl').style.display = 'block'; throw new Error('WebGL2 unavailable') }
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.toneMapping = THREE.NoToneMapping

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x04070b, 0.02)
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 160)
const FAR = 160

// studio: softboxes built in code, prefiltered once
{
  const env = new THREE.Scene()
  const box = (w, h, d, x, y, z, c, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(x, y, z); env.add(m); return m }
  box(60, 60, 60, 0, 0, 0, 0x0a1018, 1)
  box(13, .2, 6, 9, 16, 7, 0xffffff, 3.2); box(44, .2, 44, 0, 24, 0, 0x8fa4c0, .45)            // top softbox
  box(.2, 26, 3.2, -18, 3, 6, 0xcfe0ff, 14)        // cool strip, left
  box(.2, 20, 2.2, 18, 0, -8, 0xffffff, 10)        // strip, right rear
  box(14, 1.2, .2, 4, -6, 20, 0xff9a62, 2.2)         // warm kick, low front
  box(10, 10, .2, -6, 6, -24, 0x8fb4e0, 2.2)       // rear fill
  const pm = new THREE.PMREMGenerator(renderer)
  scene.environment = pm.fromScene(env, 0.02).texture
  pm.dispose()
}
const key = new THREE.DirectionalLight(0xfff1e0, .55); key.position.set(6, 12, 7); scene.add(key)

// lathe-turned finish: concentric bands of roughness and height, mapped by the extrusion's own x/y
const turned = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d')
  x.fillStyle = '#808080'; x.fillRect(0, 0, 1024, 1024)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let r = 724; r > 0; r -= 1 + rnd() * 1.6) { const v = Math.round(96 + rnd() * 110); x.strokeStyle = `rgb(${v},${v},${v})`; x.lineWidth = 1 + rnd() * 2; x.beginPath(); x.arc(512, 512, r, 0, TAU); x.stroke() }
  const id = x.getImageData(0, 0, 1024, 1024), d = id.data
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n }
  x.putImageData(id, 0, 0)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.13, .13); t.offset.set(.5, .5); t.anisotropy = 8
  return t
})()
const std = (color, rough, metal = 1, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, envMapIntensity: 1.2, roughnessMap: turned, bumpMap: turned, bumpScale: .06, ...extra })
const MAT = {
  ring: std(0x3b434d, .52), planet: std(0xaab0b8, .46), sun: std(0xb9975c, .46), shaft: std(0x8d949d, .5),
  carrier: std(0x69717b, .8), pin: std(0xd5dadf, .3), tube: std(0x0a0e14, .75, .7, { side: THREE.BackSide, roughnessMap: null, bumpMap: null }), tring: std(0x59616b, .5),
}

function gearProfile(Z, m, { add = 1, ded = 1.25, w = 1 } = {}) {
  const r = m * Z / 2, ra = r + add * m, rf = r - ded * m, tau = TAU / Z
  const P = [[-.5, rf], [-.36, rf], [-.30, rf + .25 * m], [-.25, r], [-.19, r + .55 * m], [-.13, ra - .08 * m], [-.10, ra], [.10, ra], [.13, ra - .08 * m], [.19, r + .55 * m], [.25, r], [.30, rf + .25 * m], [.36, rf]]
  const pts = []
  for (let i = 0; i < Z; i++) for (const [f, rad] of P) { const a = (i + (f === -.5 ? f : f * w)) * tau; pts.push(new THREE.Vector2(Math.cos(a) * rad, Math.sin(a) * rad)) }
  return pts
}
const hole = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, TAU, true); return p }
const disc = r => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, TAU, false); return s }
function extrude(shape, depth, bevel = 0.012) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 1, curveSegments: 72 })
  g.translate(0, 0, bevel); g.rotateX(-Math.PI / 2); return g
}
const cache = new Map(), memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k) }
const ringGeo = () => memo('ring', () => {
  const pts = []
  for (let i = 0; i < 480; i++) { const a = i / 480 * TAU, l = RO + .2 * Math.pow(Math.max(0, Math.cos(a * 12)), 2.2); pts.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l)) }
  const s = new THREE.Shape(pts)
  s.holes.push(new THREE.Path(gearProfile(ZR, M, { add: 1.25, ded: 1, w: 1.05 })))
  for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; s.holes.push(hole(Math.cos(a) * (RO + .02), Math.sin(a) * (RO + .02), .085)) }
  return extrude(s, FACE)
})
const sunGeo = Z => memo('sun' + Z, () => { const s = new THREE.Shape(gearProfile(Z, M, { w: .95 })); s.holes.push(hole(0, 0, BORE)); return extrude(s, FACE) })
const shaftGeo = () => memo('shaft', () => { const s = new THREE.Shape(gearProfile(26, .034)); s.holes.push(hole(0, 0, BORE)); return extrude(s, 1.25, .008) })
const planetGeo = Z => memo('pl' + Z, () => {
  const rp = M * Z / 2, s = new THREE.Shape(gearProfile(Z, M, { w: .95 })); s.holes.push(hole(0, 0, rp * .3))
  if (Z >= 15) for (let j = 0; j < 6; j++) { const a = j / 6 * TAU; s.holes.push(hole(Math.cos(a) * rp * .6, Math.sin(a) * rp * .6, rp * .13)) }
  return extrude(s, FACE - .06)
})
const carrierGeo = (st) => memo('car' + st.Zs + st.n, () => {
  const rp = M * st.Zp / 2, a = M * (st.Zs + st.Zp) / 2, s = disc(a + rp * .56)
  s.holes.push(hole(0, 0, .52))
  const gapR = Math.min(a * Math.sin(Math.PI / st.n) - rp * .3 - .16, .46)
  if (gapR > .1) for (let j = 0; j < st.n; j++) { const an = (j + .5) / st.n * TAU; s.holes.push(hole(Math.cos(an) * a, Math.sin(an) * a, gapR)) }
  return extrude(s, .22)
})

const stack = new THREE.Group(); scene.add(stack)
const stages = STAGES.map((st, idx) => {
  const rs = M * st.Zs / 2, rp = M * st.Zp / 2, a = rs + rp
  const g = new THREE.Group()
  g.add(new THREE.Mesh(ringGeo(), MAT.ring))
  const sun = new THREE.Group(); sun.add(new THREE.Mesh(sunGeo(st.Zs), MAT.sun))
  const shaft = new THREE.Mesh(shaftGeo(), MAT.shaft); shaft.position.y = FACE; sun.add(shaft); g.add(sun)
  const orbit = new THREE.Group(), drop = new THREE.Group(); g.add(orbit); orbit.add(drop)
  const plate = new THREE.Mesh(carrierGeo(st), MAT.carrier); plate.position.y = -.22; drop.add(plate)
  const planets = []
  for (let i = 0; i < st.n; i++) {
    const ph = i / st.n * TAU, x = Math.cos(ph) * a, z = -Math.sin(ph) * a
    const p = new THREE.Mesh(planetGeo(st.Zp), MAT.planet); p.position.set(x, .03, z); orbit.add(p); planets.push({ p, ph })
    const pin = new THREE.Mesh(memo('pin' + st.Zp, () => new THREE.CylinderGeometry(rp * .3 - .012, rp * .3 - .012, .74, 40)), MAT.pin); pin.position.set(x, .37, z); drop.add(pin)
  }
  stack.add(g)
  return { st, g, sun, shaft, orbit, drop, planets, phi: idx * 1.3, w: (idx % 2 ? -1 : 1) * (.2 + idx * .035), boost: 0 }
})
function poseStage(s) {
  const { Zs, Zp } = s.st
  s.orbit.rotation.y = s.phi
  s.sun.rotation.y = s.phi * (ZR + Zs) / Zs + Math.PI * (Zp - 1) / Zs
  for (const { p, ph } of s.planets) p.rotation.y = (s.phi + ph) * (1 - ZR / Zp) - s.phi
}
const stageY = (i, e = 1) => -i * GAP * lerp(1.14 / GAP, 1, e)
function explode(e) {
  stages.forEach((s, i) => { s.g.position.y = stageY(i, e); s.drop.position.y = lerp(-.24, -1.2, e); s.shaft.scale.y = lerp(.16, 1, e) })
}

// the bore below the last stage, and the plate at the bottom of it
const tunnel = new THREE.Group(); scene.add(tunnel); tunnel.visible = false
const T_TOP = stageY(3) - 3, T_N = 12, T_STEP = 2.5, PLATE_Y = T_TOP - T_N * T_STEP - 3.5
{
  const len = T_TOP - PLATE_Y + 1.5
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 5.3, len, 96, 1, true), new THREE.MeshLambertMaterial({ color: 0x1a2028, side: THREE.BackSide })); tube.position.y = T_TOP - len / 2 + .2; tunnel.add(tube)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.3, 96), new THREE.MeshLambertMaterial({ color: 0x2a3038 })); floor.rotation.x = -Math.PI / 2; floor.position.y = PLATE_Y - .05; tunnel.add(floor)
  for (let j = 0; j < 7; j++) {
    const a = j / 7 * TAU + .3, hot = j % 3 === 0
    const m = new THREE.Mesh(new THREE.BoxGeometry(.05, len - 9, .05), new THREE.MeshBasicMaterial({ color: new THREE.Color(hot ? 0xf0703a : 0xcfe0f2).multiplyScalar(hot ? 5 : 2.4) }))
    m.position.set(Math.cos(a) * 5.15, tube.position.y + 4.5, Math.sin(a) * 5.15); tunnel.add(m)
  }
}
const trings = new THREE.InstancedMesh(ringGeo(), MAT.tring, T_N + 1); tunnel.add(trings)
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s1 = new THREE.Vector3(1.32, 1, 1.32), _up = new THREE.Vector3(0, 1, 0)
function poseTunnel(t) {
  for (let j = 0; j <= T_N; j++) { _q.setFromAxisAngle(_up, j * .7 + t * (j % 2 ? -.35 : .28)); _v.set(0, j === T_N ? PLATE_Y - .04 : T_TOP - 1.2 - j * T_STEP, 0); _m4.compose(_v, _q, _s1); trings.setMatrixAt(j, _m4) }
  trings.instanceMatrix.needsUpdate = true
}
const plateMat = new THREE.ShaderMaterial({
  uniforms: { map: { value: null }, uFade: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  // the composite pass tone-maps everything; pre-invert it here so the photograph comes out as authored
  fragmentShader: `uniform sampler2D map; uniform float uFade; varying vec2 vUv;
    void main(){ vec3 c = min(pow(texture2D(map, vUv).rgb, vec3(2.2)), vec3(.97));
      vec3 A = 2.51 - 2.43*c, B = .03 - .59*c, C = -.14*c; vec3 x = (-B + sqrt(B*B - 4.*A*C)) / (2.*A);
      gl_FragColor = vec4(x / 1.4 * uFade, 1.); }`,
})
const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), plateMat); plate.layers.set(1); plate.position.y = PLATE_Y; tunnel.add(plate)
// a lamp that rides with the camera during the fall, so bores and oncoming gears catch light
const headLamp = new THREE.PointLight(0xdfe8ff, 0, 18, 1.5); scene.add(headLamp)
const plateLight = new THREE.PointLight(0xdfe8f5, 26, 34, 1.6); plateLight.position.y = PLATE_Y + 2.4; scene.add(plateLight)
const texLoader = new THREE.TextureLoader(), texCache = new Map()
function loadTex(src) {
  if (!texCache.has(src)) texCache.set(src, new Promise(res => texLoader.load(src, t => { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; res(t) }, undefined, () => res(null))))
  return texCache.get(src)
}
PROJECTS.forEach(p => loadTex(p.imgs[0][0]))

/* ───────────── passes: shaded, normals + depth, composite ───────────── */
const rtOpts = { type: THREE.HalfFloatType, samples: 4, depthBuffer: true }
const rtC = new THREE.WebGLRenderTarget(4, 4, rtOpts), rtN = new THREE.WebGLRenderTarget(4, 4, rtOpts)
// the fall is motion-blurred, so it renders at 0.6x without multisampling
const rtCf = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }), rtNf = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType })
const normMat = new THREE.ShaderMaterial({
  side: THREE.DoubleSide, uniforms: { uFar: { value: FAR } },
  vertexShader: `varying vec3 vN; varying float vD;
    void main(){
      #ifdef USE_INSTANCING
        mat4 mm = modelViewMatrix * instanceMatrix;
      #else
        mat4 mm = modelViewMatrix;
      #endif
      vec4 mv = mm * vec4(position, 1.); vN = mat3(mm) * normal; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; uniform float uFar;
    void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(n * .5 + .5, vD / uFar); }`,
})
const U = {
  tC: { value: rtC.texture }, tN: { value: rtN.texture }, uRes: { value: new THREE.Vector2(4, 4) }, uLens: { value: new THREE.Vector2() },
  uProj: { value: new THREE.Vector4() }, uAo: { value: 1 }, uR: { value: 100 }, uPx: { value: 1 }, uTime: { value: 0 }, uWarp: { value: 0 }, uFull: { value: 0 }, uScroll: { value: 0 }, uFlash: { value: 0 }, uAspect: { value: 1 },
  uIntro: { value: 1 }, uVig: { value: parseFloat(Q.get('vig') || '.08') }, uPaper: { value: new THREE.Color(DARK ? 0x0c2238 : parseInt(Q.get('paper') || 'f4f1ea', 16)) }, uInk: { value: new THREE.Color(DARK ? 0xe8e4da : 0x14181d) }, uBlue: { value: new THREE.Color(DARK ? 0x8fb8e6 : 0x1d4e89) }, uAccent: { value: new THREE.Color(0xf0703a) },
}
;[U.uPaper, U.uInk, U.uBlue, U.uAccent].forEach(u => u.value.convertLinearToSRGB())   // the shader works in display space for the drawing
const vid = document.createElement('video'); vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = 'auto'; vid.src = '/video/showreel-v3.mp4'
const FILM_IN = 14, FILM_OUT = 40.4   // the dark passage of the reel, as in concept 1
vid.addEventListener('loadedmetadata', () => { vid.currentTime = FILM_IN }, { once: true })
vid.addEventListener('timeupdate', () => { if (vid.currentTime > FILM_OUT || vid.currentTime < FILM_IN - .5) vid.currentTime = FILM_IN })
const vtex = new THREE.VideoTexture(vid); vtex.colorSpace = THREE.NoColorSpace
U.tV = { value: vtex }; U.uFilm = { value: 1 }; U.uDark = { value: 0 }
// theme: light paper or dark blueprint. The dark lens is the lit render on a light studio, so text inverts under it in both.
function setTheme(dark, save) {
  U.uPaper.value.set(dark ? 0x0c2238 : parseInt(Q.get('paper') || 'f4f1ea', 16)).convertLinearToSRGB()
  U.uInk.value.set(dark ? 0xe8e4da : 0x14181d).convertLinearToSRGB(); U.uBlue.value.set(dark ? 0x8fb8e6 : 0x1d4e89).convertLinearToSRGB()
  U.uDark.value = dark ? (Q.get('dark') === 'xray' ? 2 : 1) : 0
  document.documentElement.classList.toggle('dark', dark)
  const b = $('theme'); if (b) { b.textContent = dark ? 'Light' : 'Dark'; b.setAttribute('aria-pressed', dark) }
  if (save) try { localStorage.setItem('sm-theme', dark ? 'dark' : 'light') } catch (e) {}
}
setTheme(DARK, false)
$('theme')?.addEventListener('click', () => setTheme(!document.documentElement.classList.contains('dark'), true))
const post = new THREE.Scene(), postCam = new THREE.Camera()
{
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `precision highp float;
uniform sampler2D tC, tN; uniform vec2 uRes, uLens;
uniform float uR, uPx, uTime, uWarp, uFull, uScroll, uFlash, uAspect;
uniform vec3 uPaper, uInk, uBlue, uAccent; uniform float uVig, uIntro, uFilm, uDark; uniform sampler2D tV; varying vec2 vUv;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
vec3 studio(vec2 uv){ vec2 c = uv - vec2(.5, .56); c.x *= uAspect; float r = length(c);
  vec3 dk = mix(vec3(.011, .019, .032), vec3(.002, .003, .005), smoothstep(0., .95, r));
  return uDark > .5 && uDark < 1.5 ? mix(vec3(.6, .61, .6), vec3(.4, .42, .45), smoothstep(0., .95, r)) : dk; }
uniform vec4 uProj; uniform float uAo;
vec3 vpos(vec2 uv){ float dd = texture2D(tN, uv).a * 160.; return vec3((uv * 2. - 1. - uProj.zw) * uProj.xy * dd, -dd); }
float ao(vec2 uv){
  vec4 n0 = texture2D(tN, uv); if (n0.a > .999) return 1.;
  vec3 p = vec3((uv * 2. - 1. - uProj.zw) * uProj.xy * n0.a * 160., -n0.a * 160.), n = normalize(n0.xyz * 2. - 1.);
  const float rad = .34; float rpx = rad / (n0.a * 160.) / uProj.y * .5, a0 = hash(gl_FragCoord.xy) * 6.283, occ = 0.;
  for (int i = 0; i < 8; i++) {
    float fi = (float(i) + .5) / 8., an = a0 + float(i) * 2.4; vec2 o = vec2(cos(an) / uAspect, sin(an)) * sqrt(fi) * rpx;
    vec3 v = vpos(uv + o) - p; float l2 = dot(v, v);
    occ += max(0., dot(n, v) / sqrt(l2 + 1e-5) - .14) / (1. + l2 / (rad * rad) * 2.);
  }
  return clamp(1. - occ * .3, 0., 1.);
}
vec3 shaded(vec2 uv){ vec4 s = texture2D(tC, uv); return studio(uv) * (1. - s.a) + s.rgb; }
void main(){
  vec2 frag = vUv * uRes, px = 1. / uRes;
  vec2 d = frag - uLens; float r = length(d), q = clamp(r / uR, 0., 1.);
  float full = smoothstep(.85, 1., uFull);
  float inside = max(1. - smoothstep(uR - 1.5*uPx, uR, r), full);
  vec3 outc;
  // ── the sheet
  vec2 pp = frag / uPx + vec2(0., uScroll * .3);
  float fib = vnoise(pp * vec2(.7, .09)) * .55 + vnoise(pp * .31) * .45;
  vec3 paper = uPaper * (.955 + .06 * fib) - .016 * hash(floor(pp * 1.4));
  vec2 g1 = abs(fract(pp / 24. - .5) - .5) * 24., g5 = abs(fract(pp / 120. - .5) - .5) * 120.;
  paper = mix(paper, uBlue, (1. - smoothstep(0., 1., min(g1.x, g1.y))) * .028 + (1. - smoothstep(0., 1.3, min(g5.x, g5.y))) * .055);
  vec2 vc = vUv - .5; paper *= 1. - uVig * dot(vc, vc) * 2.2;
  vec3 dr = paper;
  if (inside < 1.) {
    vec4 n0 = texture2D(tN, vUv);
    float w1 = .9 * uPx, w2 = .75 * uPx;
    float lap = abs(texture2D(tN, vUv + vec2(w1, 0.) * px).a + texture2D(tN, vUv - vec2(w1, 0.) * px).a
                  + texture2D(tN, vUv + vec2(0., w1) * px).a + texture2D(tN, vUv - vec2(0., w1) * px).a - 4. * n0.a) / max(n0.a, 1e-4);
    float eD = smoothstep(.0022, .008, lap);
    vec3 nc = n0.xyz * 2. - 1.;
    float eN = 4. - dot(nc, texture2D(tN, vUv + vec2(w2, 0.) * px).xyz * 2. - 1.) - dot(nc, texture2D(tN, vUv - vec2(w2, 0.) * px).xyz * 2. - 1.)
                  - dot(nc, texture2D(tN, vUv + vec2(0., w2) * px).xyz * 2. - 1.) - dot(nc, texture2D(tN, vUv - vec2(0., w2) * px).xyz * 2. - 1.);
    float eC = smoothstep(.45, 1.05, eN);
    float geo = texture2D(tC, vUv).a;
    float far = smoothstep(.14, .44, n0.a);
    float sh = clamp(dot(normalize(nc), normalize(vec3(-.42, .66, .62))) * .5 + .5, 0., 1.);
    vec3 fill = mix(vec3(1.), uPaper, .62) * mix(1., sh * 1.08, .5);
    fill = mix(fill, fill * vec3(.84, .9, .98), (1. - sh) * .7);
    fill *= mix(1., ao(vUv), .45);
    float hl = abs(fract((pp.x + pp.y) / 5.) - .5);
    float hatch = (1. - smoothstep(.06, .13, hl)) * smoothstep(.38, .2, sh);
    if (uDark > .5) fill = uPaper * mix(1.2, 2.5, sh) * mix(1., ao(vUv), .45);
    fill = mix(fill, paper, far * .55);
    dr = mix(paper, fill, geo);
    dr = mix(dr, uBlue, hatch * geo * .72 * (1. - far));
    dr = mix(dr, uBlue, eC * geo * mix(.8, .3, far));
    dr = mix(dr, mix(uInk, uBlue, .22), eD * mix(.9, .4, far));
    dr = mix(paper, dr, uIntro);
    float shd = smoothstep(uR + 46. * uPx, uR, length(d - vec2(10., -14.) * uPx));
    dr *= 1. - .24 * shd * shd * (1. - full);
  }
  outc = dr;
  // ── through the glass
  if (inside > 0.) {
    float mag = mix(.9, 1., max(q*q*q, uFull));
    vec2 uvS = (uLens + d * mag) / uRes, cc = vec2(.5);
    vec2 off = (d / uRes) * .005 * smoothstep(.5, 1., q) * (1. - uFull) + (uvS - cc) * .006 * uWarp;
    vec3 col = vec3(0.);
    if (uWarp < .004) col = vec3(shaded(uvS + off).r, shaded(uvS).g, shaded(uvS - off).b);
    else { float jit = fract(52.9829189 * fract(dot(frag, vec2(.06711056, .00583715))));
      for (int i = 0; i < 10; i++) col += shaded(cc + (uvS - cc) * (1. - uWarp * .085 * (float(i) + jit) / 10.));
      col /= 10.; }
    if (uAo > .01) col *= mix(1., ao(uvS), .9 * uAo);
    col = pow(aces(col * 1.4), vec3(1. / 2.2));
    if (uDark > 1.5) { vec4 x0 = texture2D(tN, uvS); vec3 nn = normalize(x0.xyz * 2. - 1.); float gg = texture2D(tC, uvS).a;
      float lp = 0., soft = 0.;
      for (int i = 0; i < 8; i++) { float an = float(i) * .7854; vec2 o = vec2(cos(an), sin(an)) * px;
        lp += abs(texture2D(tN, uvS + o * 1.2).a - x0.a) / max(x0.a, 1e-4);
        soft += texture2D(tC, uvS + o * 7.).a; }
      float ed = smoothstep(.004, .02, lp), glow = pow(1. - abs(nn.z), 1.7) * gg;
      float thin = gg * (1. - soft / 8.);            // near an outline the part is thin, so it ghosts brighter
      col = vec3(.006, .016, .032) + vec3(.42, .84, 1.) * (glow * 1.1 + ed * .7 + thin * 1.6 + gg * .09) + vec3(1.) * (glow * glow * .4 + thin * thin * .8); }
    if (uFilm > .001) { vec2 vu = uvS - .5; float va = 16. / 9.; if (uAspect > va) vu.y *= va / uAspect; else vu.x *= uAspect / va;
      col = mix(col, texture2D(tV, vu + .5).rgb, uFilm); }
    float rimIn = smoothstep(.7, 1., q) * (1. - uFull);
    col *= 1. - .4 * rimIn * rimIn;
    float ang = atan(d.y, d.x);
    col += smoothstep(.9, .95, q) * (1. - smoothstep(.95, .985, q)) * pow(max(0., cos(ang - 2.2)), 10.) * .5 * (1. - uFull);
    vec2 v2 = vUv - .5; col *= 1. - uWarp * .9 * dot(v2, v2);
    outc = mix(outc, col, inside);
  }
  float rim = smoothstep(uR - 4. * uPx, uR - 2.4 * uPx, r) * (1. - smoothstep(uR, uR + 1.4 * uPx, r)) * (1. - full);
  float ang2 = atan(d.y, d.x);
  vec3 rimc = mix(vec3(.05, .06, .075), vec3(.96), pow(max(0., sin(ang2 * 1. - .6)), 12.));
  rimc = mix(rimc, vec3(.72, .88, 1.), min(uDark, 1.) * .85);
  rimc = mix(rimc, uAccent, step(.985, cos(ang2 + .78)));
  outc = mix(outc, rimc, rim);
  outc += uFlash;
  outc += (hash(frag + fract(uTime) * 91.7) - .5) * .02;
  gl_FragColor = vec4(outc, 1.);
}`,
  }))
  m.frustumCulled = false; post.add(m)
}

/* ───────────── state ───────────── */
let W = 1, H = 1, SEC = 1, PR = 1, scale = 1, mobile = false
function resize() {
  W = innerWidth; H = innerHeight; mobile = W < 820
  PR = Math.min(devicePixelRatio || 1, 2) * scale
  renderer.setPixelRatio(PR); renderer.setSize(W, H, false)
  const bw = Math.round(W * PR), bh = Math.round(H * PR)
  rtC.setSize(bw, bh); rtN.setSize(bw, bh); rtCf.setSize(Math.round(bw * .72), Math.round(bh * .72)); rtNf.setSize(Math.round(bw * .72), Math.round(bh * .72))
  U.uRes.value.set(bw, bh); U.uPx.value = PR; U.uAspect.value = W / H
  camera.aspect = W / H
  SEC = ($('work').offsetTop || H * (1 + EXTRA)) / (1 + EXTRA)   // sections are 100svh, which is not always innerHeight on phones
}
addEventListener('resize', resize); resize()

const ptr = { x: W * .62, y: H * .46, sx: W * .62, sy: H * .46, auto: true, down: false, last: -10, nx: 0, ny: 0, snx: 0, sny: 0 }
addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.auto = false; ptr.last = performance.now() / 1000; ptr.nx = e.clientX / W - .5; ptr.ny = e.clientY / H - .5 }, { passive: true })
addEventListener('pointerdown', e => { ptr.down = true; ptr.x = e.clientX; ptr.y = e.clientY; ptr.auto = false; ptr.last = performance.now() / 1000 })
addEventListener('pointerup', () => { ptr.down = false }); addEventListener('pointercancel', () => { ptr.down = false })
if (Q.has('lens')) { const [lx, ly] = Q.get('lens').split(',').map(Number); ptr.x = lx * W; ptr.y = ly * H; ptr.auto = false; ptr.last = 1e9 }

const VMAP = { hero: 0, s1: 1, s2: 2, s3: 3, s4: 4, plus: 5, contact: 6 }
let oS = 0, pS = VMAP[VIEW] ?? 0, pV = 0, lensR = 0, full = 0, flash = 0
const pFixed = FREEZE && (VIEW in VMAP || VIEW === 'fall' || VIEW === 'project') ? (VMAP[VIEW] ?? (parseInt(Q.get('p')) || 1)) : null
if (pFixed === null && VIEW in VMAP) addEventListener('load', () => scrollTo(0, (VMAP[VIEW] + (VMAP[VIEW] ? EXTRA : 0)) * SEC))

/* camera along the scroll */
const KEYS = [
  { rho: 19, h: 10.6, az: -.62, sh: .25, ty: () => -3.1 },
  ...[0, 1, 2, 3].map(i => ({ rho: 11.8, h: 7.4, az: -.62 + (i + 1) * .9, sh: .24, ty: e => stageY(i, e) + .1 })),
  { rho: 39, h: 9, az: 4.15, sh: .3, ty: e => lerp(-1.7, -GAP * 1.5, e) },
  { rho: 12.5, h: 5.2, az: 4.75, sh: .28, ty: e => lerp(-1.7, -GAP * 1.5, e) },
]
const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _mm = new THREE.Matrix4()
function journey(p, e, out) {
  const i = Math.min(Math.floor(p), 5), f = sstep(.1, .9, p - i), a = KEYS[i], b = KEYS[i + 1]
  const k = mobile ? clamp(1.05 / (W / H), 1, 2.6) : 1
  const rho = lerp(a.rho, b.rho, f) * k, h = lerp(a.h, b.h, f) * k + ptr.sny * -.9, az = lerp(a.az, b.az, f) + ptr.snx * .09, ty = lerp(a.ty(e), b.ty(e), f)
  out.pos.set(Math.sin(az) * rho, ty + h, Math.cos(az) * rho)
  _t.set(0, ty, 0); _mm.lookAt(out.pos, _t, _up); out.quat.setFromRotationMatrix(_mm)
  out.fov = 30; out.sh = mobile ? 0 : lerp(a.sh, b.sh, f); out.shY = mobile ? .5 : 0
  return out
}
const mkPose = () => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion(), fov: 30, sh: 0, shY: 0 })
const jp = mkPose(), cp = mkPose()

/* the fall */
const fall = { active: false, k: 1, u: 0, dir: 1, from: mkPose(), qDown: new THREE.Quaternion(), img: 0 }
const G = x => 1 - Math.pow(Math.max(0, 1 - Math.pow(clamp(x), 2.3)), 1.7)
let GMAX = 0; for (let x = 0; x < 1; x += .01) GMAX = Math.max(GMAX, (G(x + .01) - G(x)) / .01)
const END_H = 6.3
let warp = 0
function fallPose(u, out) {
  const f = fall.dir < 0 ? jp : fall.from, top = stageY(fall.k - 1) + 3.6, yEnd = PLATE_Y + END_H
  const a = sstep(0, .26, u), x = clamp((u - .2) / .8), g = G(x)
  warp = clamp((G(Math.min(x + .01, 1)) - G(Math.max(x - .01, 0))) / .02 / GMAX)
  _p.set(0, lerp(top, yEnd, g), 0)
  out.pos.copy(f.pos).lerp(_p, a)
  out.quat.copy(f.quat).slerp(fall.qDown, a)
  _q.setFromAxisAngle(_v.set(0, 0, 1), Math.sin(Math.PI * g) * (RM ? 0 : .85)); out.quat.multiply(_q)
  const settle = sstep(.82, 1, g)
  if (!RM && !mobile) { _q.setFromAxisAngle(_v.set(0, 1, 0), -ptr.snx * .05 * settle); out.quat.multiply(_q); _q.setFromAxisAngle(_v.set(1, 0, 0), -ptr.sny * .035 * settle); out.quat.multiply(_q) }
  out.fov = lerp(lerp(f.fov, 60, a), 50, settle) + 36 * warp * (1 - settle)
  out.sh = lerp(lerp(f.sh, 0, a), mobile ? 0 : .3, settle); out.shY = lerp(lerp(f.shY, 0, a), mobile ? .22 : 0, settle)
  return out
}
async function setImage(i) {
  const p = PROJECTS[fall.k - 1]; fall.img = (i + p.imgs.length) % p.imgs.length
  const [src, label] = p.imgs[fall.img]
  $('pjC').textContent = `${String(fall.img + 1).padStart(2, '0')} / ${String(p.imgs.length).padStart(2, '0')} · ${label}`
  const k = fall.k, n = fall.img, t = await loadTex(src)
  if (!t || k !== fall.k || n !== fall.img) return
  plateMat.uniforms.map.value = t
  const asp = t.image.width / t.image.height, maxW = mobile ? 3.4 : 5.5, maxH = mobile ? 3.4 : 3.5
  const w = Math.min(maxW, maxH * asp); plate.scale.set(w, w / asp, 1)
  imgFade = 0
}
let imgFade = 1
function startFall(k) {
  if (fall.active || pS > 5.2) return
  fall.active = true; fall.k = k; fall.u = 0; fall.dir = 1
  const f = fall.from; f.pos.copy(cp.pos); f.quat.copy(cp.quat); f.fov = cp.fov; f.sh = cp.sh; f.shY = cp.shY
  _v.set(-cp.pos.x, 0, -cp.pos.z).normalize(); _mm.lookAt(_p.set(0, 1, 0), _t.set(0, 0, 0), _v); fall.qDown.setFromRotationMatrix(_mm)
  plate.quaternion.copy(fall.qDown)
  const p = PROJECTS[k - 1]
  $('pjN').textContent = p.n; $('pjS').textContent = p.status; $('pjT').textContent = p.title; $('pjL').textContent = p.line; $('pjG').textContent = p.tags
  $('pjA').hidden = !p.href; if (p.href) { $('pjA').href = p.href; $('pjAl').textContent = p.link }
  setImage(0); document.body.classList.add('locked')
  sfx.whoosh()
}
function climbOut() { if (fall.active && fall.dir > 0 && fall.u > .5) { fall.dir = -1; sfx.whoosh(true) } }
document.addEventListener('click', e => { const b = e.target.closest('[data-fall]'); if (b) startFall(+b.dataset.fall) })
$('pjX').addEventListener('click', climbOut)
$('pjPrev').addEventListener('click', () => setImage(fall.img - 1)); $('pjNext').addEventListener('click', () => setImage(fall.img + 1))
let hover = -1
// a short press on a stage falls into it; a long press only opens the lens wider
let pd = null
canvas.addEventListener('pointerdown', e => { pd = { t: performance.now(), x: e.clientX, y: e.clientY } })
canvas.addEventListener('pointerup', e => { if (pd && performance.now() - pd.t < 320 && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 8 && hover >= 0 && !fall.active) startFall(hover + 1); pd = null })
addEventListener('keydown', e => {
  if (e.key === 'Escape') climbOut()
  else if (fall.active) { if (e.key === 'ArrowRight') setImage(fall.img + 1); if (e.key === 'ArrowLeft') setImage(fall.img - 1) }
  else if (e.key === 'Enter' && document.activeElement === document.body) { const k = Math.round(pS); if (k >= 1 && k <= 4) startFall(k) }
  else if (e.key >= '1' && e.key <= '4') scrollTo({ top: (+e.key + EXTRA) * SEC, behavior: RM ? 'auto' : 'smooth' })
})
document.querySelectorAll('a[href^="#"]:not(#pjA)').forEach(a => a.addEventListener('click', e => { if (fall.active) { e.preventDefault(); return } const el = document.querySelector(a.getAttribute('href')); if (el) { e.preventDefault(); scrollTo({ top: el.offsetTop, behavior: RM ? 'auto' : 'smooth' }) } }))
if (FREEZE && (VIEW === 'fall' || VIEW === 'project')) addEventListener('load', () => { journey(pFixed, 1, cp); startFall(pFixed); fall.u = VIEW === 'project' ? 1 : clamp(parseFloat(Q.get('f')) || .5); fall.dir = 0 })

/* ───────────── sound: all of it synthesised, silent until asked ───────────── */
let AC = null, master = null, nodes = null, soundOn = false, meter = null, meterBuf = null, rms = 0
const sfx = {
  init() {
    AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0; master.connect(AC.destination)
    meter = AC.createAnalyser(); meter.fftSize = 1024; meterBuf = new Float32Array(1024); master.connect(meter); window.__meter = meter   // level probe only, not routed to the output
    const nb = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const noise = () => { const s = AC.createBufferSource(); s.buffer = nb; s.loop = true; s.start(); return s }
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const dg = AC.createGain(); dg.gain.value = .08
    // the bed sits at 110-330 Hz, not 55 Hz: laptop and phone speakers reproduce almost nothing below ~200 Hz
    ;[110, 110.7, 165.4, 330.2].forEach(f => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start() }); lp.connect(dg); dg.connect(master)
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2100; bp.Q.value = 4
    const chop = AC.createGain(); chop.gain.value = .5; const lfo = AC.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 9
    const lg = AC.createGain(); lg.gain.value = .5; lfo.connect(lg); lg.connect(chop.gain); lfo.start()
    const mg = AC.createGain(); mg.gain.value = .05; noise().connect(bp); bp.connect(chop); chop.connect(mg); mg.connect(master)
    const wf = AC.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 400; wf.Q.value = .7; const wg = AC.createGain(); wg.gain.value = 0
    noise().connect(wf); wf.connect(wg); wg.connect(master)
    nodes = { lfo, mg, wf, wg, lp }
  },
  toggle() {
    if (!AC) this.init()
    soundOn = !soundOn; AC.resume(); master.gain.setTargetAtTime(soundOn ? 1 : 0, AC.currentTime, .12)
    if (soundOn) { this.tone(880, 1320, .12, .22, 'triangle'); setTimeout(() => this.tone(1320, 1760, .1, .16, 'triangle'), 110) }   // audible confirmation
    $('snd').setAttribute('aria-pressed', soundOn); $('snd').textContent = soundOn ? 'Sound on' : 'Enable sound'
  },
  frame(spin, w) {
    if (!soundOn) { rms = 0; window.__s.rms = 0; return }
    meter.getFloatTimeDomainData(meterBuf); let sq = 0; for (let i = 0; i < 1024; i++) sq += meterBuf[i] * meterBuf[i]
    rms = Math.sqrt(sq / 1024); window.__s.rms = rms
    const t = AC.currentTime
    nodes.lfo.frequency.setTargetAtTime(7 + spin * 9, t, .1); nodes.mg.gain.setTargetAtTime(.045 + spin * .025, t, .1)
    nodes.wg.gain.setTargetAtTime(w * .7, t, .06); nodes.wf.frequency.setTargetAtTime(500 + w * 2600, t, .06); nodes.lp.frequency.setTargetAtTime(900 + w * 1400, t, .1)
  },
  tone(f0, f1, dur, vol, type = 'sine') {
    if (!soundOn) return
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur)
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02)
  },
  whoosh(up) { up ? this.tone(160, 640, 1.4, .22, 'triangle') : this.tone(620, 130, 2.6, .24, 'triangle') },
  thunk() { this.tone(240, 70, .6, .45, 'triangle'); this.tone(1400, 500, .09, .16, 'triangle') },
  tick() { this.tone(2400, 1500, .05, .1, 'triangle') },
}
$('snd').addEventListener('click', () => sfx.toggle())

/* ───────────── frame ───────────── */
const panels = [...document.querySelectorAll('.panel')], veil = $('veil')
if (matchMedia('(pointer: coarse)').matches) $('hintA').textContent = 'The lens renders what the sheet draws'
const ld = $('ld'), ldc = $('ldc'), ldb = $('ldb'), ldt = $('ldt'), lenstag = $('lenstag'), axis = $('axis'), ann = $('ann'), tags = [...document.querySelectorAll('.tag')]
tags.forEach((t, i) => { const s = STAGES[i]; t.textContent = `STAGE ${i + 1}  ·  ${s.Zs} / ${s.Zp} / ${ZR} T` })
let warm = 2, last = performance.now(), T = FREEZE ? T0 : 0, first = true, emaMs = 16.7, slow = 0, fastN = 0, frames = 0, fpsT = last, tbKey = '', rollI = -1, landed = false
window.__s = { fps: 0, ms: 0, scale: 1 }
const dwg = $('dwg')
function frame(now) {
  const dtR = Math.min((now - last) / 1000, .05); last = now
  const dt = FREEZE ? 0 : dtR; if (!FREEZE) T += dt
  const K = r => (FREEZE || first) ? 1 : damp(r, dt)

  // scroll
  const pT = pFixed !== null ? pFixed : clamp(scrollY / SEC - EXTRA, 0, 6), pPrev = pS
  const oT = pFixed !== null ? (Q.has('o') ? parseFloat(Q.get('o')) : 1) : clamp(scrollY / (EXTRA * SEC))
  oS += (oT - oS) * K(RM ? 30 : 4.5)
  pS += (pT - pS) * K(RM ? 30 : 4.5)
  pV += ((dt > 0 ? (pS - pPrev) / dt : 0) - pV) * K(8)
  const e = FREEZE && Q.has('e') ? parseFloat(Q.get('e')) : 1 - sstep(5.2, 5.95, pS)
  explode(e)

  // fall progress
  if (fall.active && fall.dir) {
    fall.u = clamp(fall.u + fall.dir * dt / (RM ? .5 : fall.dir > 0 ? 3.7 : 2.2))
    if (fall.dir > 0 && fall.u >= 1 && !landed) { landed = true; sfx.thunk(); flash = .1 }
    if (fall.dir < 0 && fall.u <= 0) { fall.active = false; landed = false; document.body.classList.remove('locked') }
  }
  const fa = fall.active ? sstep(0, .22, fall.u) : 0

  // gears
  const spinMul = 1 + Math.min(Math.abs(pV) * 3.5, 7) + (fall.active ? 5 * warp : 0)
  stages.forEach((s, i) => {
    s.boost += ((hover === i ? 3.2 : 0) - s.boost) * K(3)
    if (FREEZE) s.phi = i * 1.3 + s.w * T0; else s.phi += s.w * (spinMul + s.boost) * dt
    poseStage(s)
  })
  poseTunnel(T)

  // camera
  ptr.snx += (ptr.nx - ptr.snx) * K(3); ptr.sny += (ptr.ny - ptr.sny) * K(3)
  journey(pS, e, jp)
  if (fall.active) fallPose(fall.u, cp); else { warp = 0; cp.pos.copy(jp.pos); cp.quat.copy(jp.quat); cp.fov = jp.fov; cp.sh = jp.sh; cp.shY = jp.shY }
  camera.position.copy(cp.pos); camera.quaternion.copy(cp.quat); camera.fov = cp.fov; camera.updateProjectionMatrix()
  camera.projectionMatrix.elements[8] = -cp.sh; camera.projectionMatrix.elements[9] = -cp.shY
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert(); camera.updateMatrixWorld()
  headLamp.position.copy(camera.position); headLamp.intensity = fall.active ? 5 * sstep(.1, .3, fall.u) * (1 - sstep(.8, .95, fall.u)) : 0

  // stage hit-test and leader anchor
  const tnow = now / 1000
  let hv = -1, hd = 1e9
  const scr = []
  for (let i = 0; i < 4; i++) {
    const y = stageY(i, e) + FACE
    _p.set(0, y, 0).project(camera); const cx = (_p.x * .5 + .5) * W, cy = (.5 - _p.y * .5) * H
    _v.set(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(RO).add(_t.set(0, y, 0)).project(camera)
    const rad = Math.abs((_v.x * .5 + .5) * W - cx)
    scr.push({ cx, cy, rad })
    const dist = camera.position.distanceTo(_t)
    if (!fall.active && !ptr.auto && oS > .99 && e > .9 && Math.hypot((ptr.x - cx) / rad, (ptr.y - cy) / (rad * .62)) < .9 && dist < hd) { hd = dist; hv = i }
  }
  if (hv !== hover) { hover = hv; canvas.style.cursor = hv >= 0 ? 'pointer' : ''; if (hv >= 0) sfx.tick() }

  // lens
  if (!FREEZE && !ptr.auto && tnow - ptr.last > 7 && !ptr.down) ptr.auto = true
  let lx = ptr.x, ly = ptr.y
  if (ptr.auto || mobile) {
    const f = scr[clamp(Math.round(pS) - 1, 0, 3)], hero = pS < .5
    const bx = hero ? scr[0].cx : f.cx, by = hero ? scr[0].cy + H * .04 : f.cy
    lx = bx + Math.sin(T * .53) * W * (mobile ? .2 : .11) + Math.sin(T * 1.31) * W * .02; ly = by + Math.sin(T * .41 + 1.2) * H * .1
  }
  ptr.sx += (lx - ptr.sx) * K(13); ptr.sy += (ly - ptr.sy) * K(13)
  const baseR = clamp(Math.min(W, H) * .2, 96, 250) * (ptr.down ? 1.55 : 1) * (1 + Math.min(Math.abs(pV), 2) * .12)
  const fullT = fall.active ? sstep(.02, .3, fall.u) : sstep(.12, .5, oS) * (1 - sstep(.8, 1, oS))
  full += (fullT - full) * K(20)
  const rT = lerp(baseR, Math.hypot(W, H) * 1.05, full * full)
  lensR += (rT - lensR) * K(9); if (FREEZE || first) lensR = rT
  flash += (0 - flash) * K(5)
  U.uLens.value.set(ptr.sx * PR, (H - ptr.sy) * PR); U.uR.value = lensR * PR; U.uFull.value = full; U.uWarp.value = RM ? 0 : warp
  { const tt = Math.tan(camera.fov * Math.PI / 360); U.uProj.value.set(camera.aspect * tt, tt, cp.sh, cp.shY) }
  const intro = fall.active ? 1 : sstep(.5, .6, oS); U.uIntro.value = intro
  const film = fall.active || FREEZE && !Q.has('o') ? 0 : 1 - sstep(.52, .66, oS); U.uFilm.value = film
  if (film > 0 && vid.paused) vid.play().catch(() => {}); else if (film === 0 && !vid.paused) vid.pause()
  U.uTime.value = T; U.uScroll.value = pS * H; U.uFlash.value = flash
  imgFade += (1 - imgFade) * K(6); plateMat.uniforms.uFade.value = imgFade

  // render
  const fast = fall.active && (warp > .1 || (fall.u > .15 && fall.u < .5)), tc = fast ? rtCf : rtC, tn = fast ? rtNf : rtN, aoK = (1 - sstep(.15, .5, warp)) * (fall.active ? 1 - sstep(.86, .98, fall.u) : 1)
  U.tC.value = tc.texture; U.tN.value = tn.texture; U.uAo.value = aoK
  tunnel.visible = fall.active || warm > 0; if (warm > 0) warm--
  camera.layers.enable(1); scene.overrideMaterial = null
  renderer.setRenderTarget(tc); renderer.setClearColor(0x000000, 0); renderer.render(scene, camera)
  if (full < .999 || aoK > .01) {
    camera.layers.disable(1); scene.overrideMaterial = normMat
    renderer.setRenderTarget(tn); renderer.setClearColor(0x8080ff, 1); renderer.render(scene, camera)
  }
  scene.overrideMaterial = null
  renderer.setRenderTarget(null); renderer.render(post, postCam)

  // DOM
  const par = RM || mobile ? 0 : 1   // pointer look-around: text floats above the sheet, the drawing stays on it
  const hide = 1 - fa
  veil.style.opacity = hide.toFixed(2)
  panels.forEach((el, i) => {
    const d = pS - i, op = sstep(.5, .16, Math.abs(d)) * hide * (i === 0 ? 1 - sstep(.08, .3, oS) : 1)
    if (op > .004) { if (!el._on) { el._on = true; el.classList.add('on') } el.style.opacity = op.toFixed(3); el.style.transform = `translate3d(${(par * ptr.snx * -21.6).toFixed(1)}px,${(-d * 110 + par * ptr.sny * -12).toFixed(1)}px,0)` }
    else if (el._on) { el._on = false; el.classList.remove('on'); el.style.opacity = 0 }
  })
  const si = Math.round(pS), sOp = si >= 1 && si <= 4 && !mobile ? sstep(.5, .16, Math.abs(pS - si)) * hide : 0
  if (sOp > .004) {
    const f = scr[si - 1], x0 = Math.min(W * .47, parseFloat(getComputedStyle(panels[si]).width) + W * .06), y0 = H * .5 - (pS - si) * 110 - 120
    const ax = f.cx - f.rad * .82, ay = f.cy + f.rad * .1
    ld.setAttribute('d', `M${x0 + 15} ${y0}H${lerp(x0, ax, .35)}L${ax} ${ay}`); ldc.setAttribute('cx', ax); ldc.setAttribute('cy', ay)
    ldb.setAttribute('cx', x0); ldb.setAttribute('cy', y0); ldt.setAttribute('x', x0); ldt.setAttribute('y', y0); ldt.textContent = PROJECTS[si - 1].n
    ld.parentNode.style.opacity = sOp.toFixed(3)
  } else ld.parentNode.style.opacity = 0
  // explosion centreline and stage call-outs, projected from the machine every frame
  { const o = (1 - intro) * .62 * hide
    if (o > .004) { dwg.style.opacity = o.toFixed(3); dwg.style.transform = `translate3d(${(par * ptr.snx * 31.2).toFixed(1)}px,${(-intro * 70 - oS * 60 + par * ptr.sny * 19.2).toFixed(1)}px,0) scale(${(1 + intro * .16).toFixed(4)})`
      const b = dwg.getBoundingClientRect(), sc = b.width / dwg.offsetWidth, m = `radial-gradient(circle ${(lensR / sc).toFixed(1)}px at ${((ptr.sx - b.left) / sc).toFixed(1)}px ${((ptr.sy - b.top) / sc).toFixed(1)}px, transparent 98%, #000 100%)`
      dwg.style.maskImage = m; dwg.style.webkitMaskImage = m; dwg.style.visibility = 'visible' }
    else dwg.style.visibility = 'hidden' }
  const aOp = mobile ? 0 : hide * sstep(.3, .8, e) * intro * (1 - full)
  ann.style.opacity = aOp.toFixed(3)
  if (aOp > .004) {
    _p.set(0, FACE + 2.4, 0).project(camera); _v.set(0, stageY(3, e) - 2.2, 0).project(camera)
    axis.setAttribute('x1', (_p.x * .5 + .5) * W); axis.setAttribute('y1', (.5 - _p.y * .5) * H); axis.setAttribute('x2', (_v.x * .5 + .5) * W); axis.setAttribute('y2', (.5 - _v.y * .5) * H)
    tags.forEach((t, i) => { const f = scr[i]; const tx = Math.min(f.cx + f.rad * 1.06, W - 232), ty = f.cy + f.rad * .16; t.setAttribute('x', tx); t.setAttribute('y', ty); t.style.opacity = ty > H - 110 || ty < 70 ? 0 : i === si - 1 || pS < .5 ? 1 : .45 })
  }
  lenstag.style.transform = `translate3d(${(ptr.sx + lensR * .74).toFixed(1)}px,${(ptr.sy + lensR * .74).toFixed(1)}px,0)`
  lenstag.style.opacity = (hide * (1 - full)).toFixed(2)
  $('proj').style.transform = `translate3d(${(par * ptr.snx * -19.2).toFixed(1)}px,${(par * ptr.sny * -10.8).toFixed(1)}px,0)`
  $('proj').style.opacity = fall.active ? sstep(.9, 1, fall.u).toFixed(3) : 0
  $('proj').classList.toggle('on', fall.active && fall.u > .88)
  const dOp = fall.active ? sstep(.12, .3, fall.u) * (1 - sstep(.8, .92, fall.u)) : 0
  $('depth').style.opacity = dOp.toFixed(2)
  if (dOp > 0) $('depN').textContent = Math.max(0, fall.from.pos.y - camera.position.y).toFixed(1).padStart(4, '0')
  const key2 = si + '|' + (fall.active ? 1 : 0) + '|' + (e < .5 ? 1 : 0)
  if (key2 !== tbKey) {
    tbKey = key2
    $('tbS').textContent = `${String(Math.min(si, 6) + 1).padStart(2, '0')} / 07`
    $('tbV').textContent = fall.active ? 'Down the bore' : si === 6 && e > .5 ? 'Full train' : VIEWS[si]
    $('tbR').textContent = si >= 1 && si <= 4 ? `${ratio(STAGES[si - 1]).toFixed(2).replace(/\.?0+$/, '')} : 1` : `${STAGES.reduce((a, s) => a * ratio(s), 1).toFixed(0)} : 1`
    $('tbM').textContent = fall.active ? 'Shaded' : 'Line + lens'
  }
  const ri = Math.floor(T / 3.4) % ROLL.length
  if (ri !== rollI) { rollI = ri; $('roll').textContent = ROLL[ri] }
  sfx.frame(clamp((spinMul - 1) / 6), warp)

  // adaptive resolution
  if (!FREEZE && !first) {
    emaMs += (dtR * 1000 - emaMs) * .08
    if (emaMs > 19.5) { if (++slow > 40 && scale > .5) { scale = Math.max(.5, scale * .86); slow = 0; resize() } } else slow = 0
    if (emaMs < 12.5) { if (++fastN > 240 && scale < 1) { scale = Math.min(1, scale / .9); fastN = 0; resize() } } else fastN = 0
  }
  frames++; if (now - fpsT > 500) { window.__s = { fps: Math.round(frames * 1000 / (now - fpsT)), ms: +emaMs.toFixed(1), scale: +scale.toFixed(2), rms }; frames = 0; fpsT = now }
  if (first) { first = false; document.body.classList.add('ready') }
  requestAnimationFrame(frame)
}
poseTunnel(0)
// compile every program up front, including the bore's, so the first fall does not hitch
tunnel.visible = true; camera.layers.enable(1); renderer.compile(scene, camera); scene.overrideMaterial = normMat; renderer.compile(scene, camera); scene.overrideMaterial = null; tunnel.visible = false
requestAnimationFrame(frame)
window.__fall = startFall; window.__climb = climbOut; window.__d = { renderer, rtC, rtN, scene, camera, fall, tunnel, plate, cp, THREE }
