/** JG-038 Stage 3: installed cutter geometry, beauty visibility, and real DOM controls.
 * Parent runs this only after source stabilizes and preview is rebuilt/restarted.
 * No build/server/test-suite launch; no product mutations, setters, quality lock or masks.
 * G8, mechanical parity, owner art acceptance and full Stage 3 closure are NOT tested.
 *
 * Required read-only port:
 * __torqueWorld.snapshot(): live ready/frames/progress/camera/inspection/sheet.
 * inspection(): visible/vertices/triangles/rect/discRect/discBounds/near,
 * cameraClearance (all cutter triangles), studyClearanceLowerBound/visibleMeshes,
 * telemetry (runtime.telemetry), playback (snapshot).
 * Geometry witnesses supplied by the parent's expanded port (missing data fails):
 * contactRect: normalized projected full cutting-contact region, with minDepth/maxDepth;
 * subjectTransforms: installed shaft meshes [{name, position:[x,y,z] metres,
 * quaternion:[x,y,z,w]}], measured from matrixWorld, stable unique names;
 * contactVertices>0 and contactMethod document the real-vertex geometric sector derivation.
 * cutterCapture(): synchronous same beauty render {withCutter,withoutCutter} PNG URLs;
 * only cutter visibility changes, restored even on error, shaders/render state restored.
 * Whole arbor may crop; disc and full contact region must fit the visible viewport.
 *
 * Exit 0 = this geometry/control roster passes; 1 = actual gate/case failure;
 * 2 = usage; 11 = environment/provenance blocked; 12 = report write failure.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { launchConfig } from './lib/browser-launch.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EVIDENCE = path.join(ROOT, 'project/work/evidence/torque-wrench-rebuild')
const POINTS = [0.79, 0.795, 0.805, 0.815, 0.825, 0.835, 0.84]
const SLOW = [0.795, 0.805, 0.815, 0.825, 0.835]
const VIEWPORTS = {
  D: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  N: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
}
const TOL = { positionMetres: 0.0001, angleDegrees: 0.01, fovDegrees: 0.01,
  channels: 1e-4, progress: 1e-9, settleMs: 3000, stableMs: 500, holdMs: 5000 }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const finite = x => typeof x === 'number' && Number.isFinite(x)
const vector = (x, n) => Array.isArray(x) && x.length === n && x.every(finite)
const distance = (a, b) => vector(a, 3) && vector(b, 3) ? Math.hypot(...a.map((x, i) => x - b[i])) : Infinity
const angle = (a, b) => {
  if (!vector(a, 4) || !vector(b, 4)) return Infinity
  const norm = Math.hypot(...a) * Math.hypot(...b)
  if (!norm) return Infinity
  return 2 * Math.acos(Math.min(1, Math.abs(a.reduce((sum, x, i) => sum + x * b[i], 0) / norm))) * 180 / Math.PI
}
const inside = (base, file) => {
  const relative = path.relative(base, file)
  return relative !== '' && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)
}
const rectValid = r => r && ['left', 'top', 'right', 'bottom', 'minDepth', 'maxDepth'].every(k => finite(r[k]))
  && r.right > r.left && r.bottom > r.top && r.maxDepth >= r.minDepth
const inFrame = r => rectValid(r) && r.left >= 0 && r.top >= 0 && r.right <= 1 && r.bottom <= 1
  && r.minDepth >= -1 && r.maxDepth <= 1
const crop = r => rectValid(r) ? {
  left: Math.max(0, -r.left), top: Math.max(0, -r.top),
  right: Math.max(0, r.right - 1), bottom: Math.max(0, r.bottom - 1),
  visibleAreaFraction: Math.max(0, Math.min(1, r.right) - Math.max(0, r.left))
    * Math.max(0, Math.min(1, r.bottom) - Math.max(0, r.top)) / ((r.right - r.left) * (r.bottom - r.top)),
} : null

function parseArgs() {
  const args = {}
  for (let i = 2; i < process.argv.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(process.argv[i])
    if (!match || !['help', 'url', 'out', 'build-dir'].includes(match[1])) throw new Error('Unknown argument: ' + process.argv[i])
    const key = match[1]
    if (key in args) throw new Error('Duplicate --' + key)
    args[key] = key === 'help' ? true : match[2] ?? process.argv[++i]
    if (key !== 'help' && (!args[key] || args[key].startsWith('--'))) throw new Error('Missing --' + key)
  }
  if (args.help) return args
  for (const key of ['url', 'out', 'build-dir']) if (!args[key]) throw new Error('--' + key + ' is required')
  const url = new URL(args.url)
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || !['/torque-wrench', '/torque-wrench/'].includes(url.pathname) || url.search || url.hash || url.username || url.password) {
    throw new Error('--url must be loopback /torque-wrench/ without query, hash or credentials')
  }
  args.url = url.href
  args.out = path.resolve(args.out)
  if (!inside(EVIDENCE, args.out)) throw new Error('--out must be a NEW evidence directory inside ' + EVIDENCE)
  if (existsSync(args.out)) throw new Error('--out already exists; preserve prior evidence and choose a new directory')
  let existingParent = path.dirname(args.out)
  while (!existsSync(existingParent)) existingParent = path.dirname(existingParent)
  const evidenceReal = realpathSync(EVIDENCE), parentReal = realpathSync(existingParent)
  if (parentReal !== evidenceReal && !inside(evidenceReal, parentReal)) throw new Error('--out parent resolves outside the task evidence tree')
  args.buildDir = realpathSync(path.resolve(args['build-dir']))
  if (!inside(realpathSync(path.join(ROOT, '.scratch')), args.buildDir)) throw new Error('--build-dir must be inside this worktree .scratch')
  return args
}

function buildProvenance(args) {
  const files = []
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name)
      if (entry.isSymbolicLink()) throw new Error('Build symlink is not accepted: ' + full)
      if (entry.isDirectory()) visit(full)
      else if (entry.isFile()) {
        const bytes = readFileSync(full)
        files.push({ path: path.relative(args.buildDir, full).replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) })
      }
    }
  }
  visit(args.buildDir)
  const manifest = JSON.parse(readFileSync(path.join(args.buildDir, '.vite/manifest.json'), 'utf8'))
  const entry = manifest['torque-wrench/index.html']
  const sceneKey = Object.keys(manifest).find(k => /^src\/scene\/torque-wrench\/Scene\.[tj]sx?$/.test(k))
  if (!entry?.isEntry || !entry.file || !sceneKey || !manifest[sceneKey]?.file) throw new Error('Build manifest lacks private entry or lazy Scene')
  const sourcePaths = ['scripts/verify-torque-cutter.mjs', 'scripts/lib/browser-launch.mjs',
    'src/scene/torque-wrench/RuntimeWorld.tsx', 'src/scene/torque-wrench/inspectionProof.ts',
    'src/scene/torque-wrench/InspectionDirector.ts', 'src/scene/torque-wrench/inspectionPlayback.ts',
    'src/scene/torque-wrench/Story.tsx', 'src/scene/inspection/shaft/shaftRuntime.ts']
  return { buildDir: args.buildDir, aggregateSha256: hash(JSON.stringify(files)), files,
    entry: entry.file, scene: manifest[sceneKey].file,
    sourceAtRun: sourcePaths.map(file => ({ path: file, sha256: hash(readFileSync(path.join(ROOT, file))) })),
    sourceQualification: 'Current source hashes are observations, not proof the build was produced from that source. Served bytes are checked against the supplied build.',
  }
}

async function verifyServed(playwright, args, provenance) {
  const api = await playwright.request.newContext()
  const results = []
  try {
    for (const file of ['torque-wrench/index.html', provenance.entry, provenance.scene]) {
      const local = provenance.files.find(x => x.path === file)
      if (!local) throw new Error('Missing build file: ' + file)
      const response = await api.get(new URL('/' + file, args.url).href, { timeout: 30000 })
      const servedSha256 = hash(await response.body())
      const result = { file, status: response.status(), localSha256: local.sha256, servedSha256 }
      results.push(result)
      if (result.status !== 200 || result.localSha256 !== servedSha256) throw new Error('Stale/unmatched preview: ' + JSON.stringify(result))
    }
  } finally { await api.dispose() }
  return results
}

// Read live state only. WebGL debug identity is from the PRESENTATION canvas context,
// never a separately created renderer and never the launch flags.
async function observe(page, installed = true) {
  return page.evaluate(wantInstalled => {
    const world = window.__torqueWorld?.snapshot()
    const canvas = document.querySelector('.torque-scene canvas')
    const gl = canvas && (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    const debug = gl?.getExtension('WEBGL_debug_renderer_info')
    const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null
    const vendor = debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null
    const backend = renderer?.match(/Direct3D\d+|D3D\d+|Vulkan|Metal|OpenGL(?: ES)?|SwiftShader/i)?.[0] ?? null
    const tierFromDOM = world?.mechanical?.tier ?? null
    const box = canvas?.getBoundingClientRect()
    let inspection = null, inspectionError = null
    if (wantInstalled) {
      try { inspection = window.__torqueWorld?.inspection() ?? null }
      catch (error) { inspectionError = String(error) }
    }
    return { world, inspection, inspectionError, narrative: window.__torqueNarrative?.snapshot(),
      mode: document.querySelector('.torque-page')?.dataset.torqueMode,
      tierFromDOM, renderer: { renderer, vendor, backend, version: gl?.getParameter(gl.VERSION) ?? null,
        contextLost: gl?.isContextLost() ?? true,
        classification: !renderer ? 'unknown' : /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer) ? 'software' : 'hardware-reported' },
      scroll: { y: scrollY, max: document.documentElement.scrollHeight - innerHeight },
      canvas: box ? { x: box.x, y: box.y, width: box.width, height: box.height,
        bufferWidth: canvas.width, bufferHeight: canvas.height } : null,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    }
  }, installed)
}

async function waitReady(page, study = false) {
  await page.waitForFunction(wantStudy => {
    const s = window.__torqueWorld?.snapshot()
    return s?.ready && s.sheet?.baked && (!wantStudy || s.inspection?.ready)
      && typeof window.__torqueWorld?.inspection === 'function'
      && typeof window.__torqueWorld?.cutterCapture === 'function'
      && document.querySelector('.torque-scene canvas') && window.__torqueNarrative
  }, study, { timeout: 30000 })
}

async function settle(page, expectedY = null) {
  const start = Date.now(), trace = []
  let previous = null, stableSince = null
  while (Date.now() - start < TOL.settleMs) {
    const now = await observe(page, false)
    trace.push({ ms: Date.now() - start, progress: now.world?.progress, y: now.scroll.y, frames: now.world?.frames })
    const mapped = finite(now.world?.progress) && now.scroll.max > 0
      && Math.abs(now.world.progress - now.scroll.y / now.scroll.max) <= TOL.progress
    const atTarget = expectedY === null || Math.abs(now.scroll.y - expectedY) <= 0.5
    const stable = previous && Math.abs(now.scroll.y - previous.scroll.y) <= 0.5
      && Math.abs(now.world?.progress - previous.world?.progress) <= TOL.progress
    if (mapped && atTarget && stable) {
      stableSince ??= Date.now()
      if (Date.now() - stableSince >= TOL.stableMs && now.world.frames > previous.world.frames) return { pass: true, ms: Date.now() - start, trace, observation: now }
    } else stableSince = null
    previous = now
    await sleep(100)
  }
  return { pass: false, ms: Date.now() - start, trace, observation: previous }
}

async function seek(page, fraction, exactY = null) {
  const y = await page.evaluate(({ fraction, exactY }) => {
    const max = document.documentElement.scrollHeight - innerHeight
    const y = exactY ?? Math.round(max * fraction)
    window.scrollTo({ top: y, behavior: 'instant' })
    return y
  }, { fraction, exactY })
  return settle(page, y)
}

function poseDelta(a, b) {
  const ac = a?.world?.camera, bc = b?.world?.camera
  const ak = a?.inspection?.telemetry?.shaft?.cutter, bk = b?.inspection?.telemetry?.shaft?.cutter
  const at = a?.inspection?.subjectTransforms, bt = b?.inspection?.subjectTransforms
  const subjectsValid = Array.isArray(at) && at.length > 0 && Array.isArray(bt) && bt.length === at.length
    && new Set(at.map(x => x.name)).size === at.length
    && at.every(x => typeof x.name === 'string' && vector(x.position, 3) && vector(x.quaternion, 4)
        && Math.abs(Math.hypot(...x.quaternion) - 1) < 1e-4
        && bt.some(y => y.name === x.name && vector(y.position, 3) && vector(y.quaternion, 4)
          && Math.abs(Math.hypot(...y.quaternion) - 1) < 1e-4))
  const transforms = subjectsValid ? at.map(x => {
    const y = bt.find(y => y.name === x.name)
    return { name: x.name, positionMetres: distance(x.position, y.position), angleDegrees: angle(x.quaternion, y.quaternion) }
  }) : null
  return { cameraPositionMetres: distance(ac?.position, bc?.position), cameraTargetMetres: distance(ac?.target, bc?.target),
    cameraAngleDegrees: angle(ac?.quaternion, bc?.quaternion), fovDegrees: finite(ac?.fov) && finite(bc?.fov) ? Math.abs(ac.fov - bc.fov) : Infinity,
    subjectTime: finite(a?.world?.inspection?.subjectTime) && finite(b?.world?.inspection?.subjectTime)
      ? Math.abs(a.world.inspection.subjectTime - b.world.inspection.subjectTime) : Infinity,
    cameraTime: finite(a?.world?.inspection?.cameraTime) && finite(b?.world?.inspection?.cameraTime)
      ? Math.abs(a.world.inspection.cameraTime - b.world.inspection.cameraTime) : Infinity,
    cutterStrokeMm: finite(ak?.stroke) && finite(bk?.stroke) ? Math.abs(ak.stroke - bk.stroke) : Infinity,
    cutterInfeedMm: finite(ak?.infeed) && finite(bk?.infeed) ? Math.abs(ak.infeed - bk.infeed) : Infinity,
    cutterAngleRadians: finite(ak?.rotation) && finite(bk?.rotation) ? Math.abs(ak.rotation - bk.rotation) : Infinity,
    subjectsValid, subjectTransforms: transforms }
}

function equalPose(d) {
  return d.cameraPositionMetres <= TOL.positionMetres && d.cameraTargetMetres <= TOL.positionMetres
    && d.cameraAngleDegrees <= TOL.angleDegrees && d.fovDegrees <= TOL.fovDegrees
    && d.subjectTime <= TOL.channels && d.cameraTime <= TOL.channels
    && d.cutterStrokeMm / 1000 <= TOL.positionMetres && d.cutterInfeedMm / 1000 <= TOL.positionMetres
    && d.cutterAngleRadians * 180 / Math.PI <= TOL.angleDegrees && d.subjectsValid
    && d.subjectTransforms.every(x => x.positionMetres <= TOL.positionMetres && x.angleDegrees <= TOL.angleDegrees)
}

// PNGs are decoded on independent detached Canvas2D surfaces; never mutate beauty canvas.
async function beautyPixels(page) {
  return page.evaluate(async () => {
    const before = window.__torqueWorld.snapshot()
    const geometry = window.__torqueWorld.inspection()
    const pair = window.__torqueWorld.cutterCapture()
    const after = window.__torqueWorld.snapshot()
    const restored = window.__torqueWorld.inspection()
    const load = async url => {
      const img = new Image()
      img.src = url
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      return { width: canvas.width, height: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data }
    }
    const withImage = await load(pair.withCutter), withoutImage = await load(pair.withoutCutter)
    if (withImage.width !== withoutImage.width || withImage.height !== withoutImage.height) throw new Error('A/B image sizes differ')
    const { width, height } = withImage
    const regions = {}
    for (const [name, r] of Object.entries({ disc: geometry.discRect, cutter: geometry.rect, contact: geometry.contactRect })) {
      if (!r || ![r.left, r.top, r.right, r.bottom].every(Number.isFinite)) { regions[name] = null; continue }
      const left = Math.max(0, Math.min(width, Math.floor(r.left * width)))
      const top = Math.max(0, Math.min(height, Math.floor(r.top * height)))
      const right = Math.max(left, Math.min(width, Math.ceil(r.right * width)))
      const bottom = Math.max(top, Math.min(height, Math.ceil(r.bottom * height)))
      let changed = 0, strongChanged = 0, absoluteDelta = 0
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
        const i = (y * width + x) * 4
        let maxDelta = 0
        for (let c = 0; c < 4; c++) {
          const delta = Math.abs(withImage.data[i + c] - withoutImage.data[i + c])
          maxDelta = Math.max(maxDelta, delta); absoluteDelta += delta
        }
        if (maxDelta) changed++
        if (maxDelta >= 8) strongChanged++
      }
      const area = (right - left) * (bottom - top)
      regions[name] = { left, top, right, bottom, area, changed, strongChanged, absoluteDelta,
        changedFraction: area ? changed / area : 0, strongFraction: area ? strongChanged / area : 0 }
    }
    return { pair, before, after, geometry, restored, pixels: { width, height, regions } }
  })
}

async function overlaps(page, rects) {
  return page.evaluate(rects => {
    const canvas = document.querySelector('.torque-scene canvas').getBoundingClientRect()
    const result = {}
    for (const [name, r] of Object.entries(rects)) {
      if (!r || ![r.left, r.top, r.right, r.bottom].every(Number.isFinite)) { result[name] = null; continue }
      const region = { left: canvas.left + r.left * canvas.width, right: canvas.left + r.right * canvas.width,
        top: canvas.top + r.top * canvas.height, bottom: canvas.top + r.bottom * canvas.height }
      const candidates = []
      for (const el of document.querySelectorAll('.torque-chapter__title,.torque-chapter__lede,.torque-chapter__body,.torque-inspection__panel,.torque-inspection__toggle,.torque-header,.torque-footer')) {
        const style = getComputedStyle(el), b = el.getBoundingClientRect()
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || !b.width || !b.height) continue
        const width = Math.max(0, Math.min(region.right, b.right, innerWidth) - Math.max(region.left, b.left, 0))
        const height = Math.max(0, Math.min(region.bottom, b.bottom, innerHeight) - Math.max(region.top, b.top, 0))
        if (!width || !height) continue
        // elementsFromPoint observes DOM paint ordering; geometric overlap alone is also retained.
        const x = (Math.max(region.left, b.left, 0) + Math.min(region.right, b.right, innerWidth)) / 2
        const y = (Math.max(region.top, b.top, 0) + Math.min(region.bottom, b.bottom, innerHeight)) / 2
        const stack = document.elementsFromPoint(x, y)
        const ci = stack.indexOf(document.querySelector('.torque-scene canvas'))
        const ei = stack.findIndex(node => node === el || el.contains(node))
        candidates.push({ selector: el.id ? '#' + el.id : '.' + [...el.classList].join('.'),
          box: { left: b.left, top: b.top, right: b.right, bottom: b.bottom }, overlapAreaCss: width * height,
          paintsAboveCanvas: ei >= 0 && (ci < 0 || ei < ci), uncertainPaintOrder: ei < 0 || ci < 0,
          pointerEvents: style.pointerEvents,
          background: style.backgroundColor, opacity: style.opacity })
      }
      result[name] = { region, viewportContained: region.left >= 0 && region.top >= 0
        && region.right <= innerWidth && region.bottom <= innerHeight, candidates }
    }
    return result
  }, rects)
}

function savePng(dir, name, dataURL) {
  if (!/^data:image\/png;base64,/.test(dataURL)) throw new Error('Capture is not a PNG data URL')
  const bytes = Buffer.from(dataURL.slice(dataURL.indexOf(',') + 1), 'base64')
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Invalid PNG signature')
  writeFileSync(path.join(dir, name), bytes, { flag: 'wx' })
  return { file: name, bytes: bytes.length, sha256: hash(bytes) }
}

function assertObserved(c, obs, tier, label) {
  const i = obs.inspection
  c(label + ': live rendered study ready', obs.mode === 'live' && obs.world?.ready && obs.world?.inspection?.ready
    && obs.world?.sheet?.baked && obs.world?.renderer?.calls > 0 && obs.world?.frames > 0, obs)
  c(label + ': observed tier equals requested tier', obs.tierFromDOM === tier && obs.world?.sheet?.tier === tier,
    { requested: tier, navigationTier: obs.tierFromDOM, installedSheetTier: obs.world?.sheet?.tier })
  c(label + ': actual debug renderer and backend observed', Boolean(obs.renderer.renderer && obs.renderer.vendor && obs.renderer.backend)
    && !obs.renderer.contextLost, obs.renderer)
  c(label + ': observed runtime phase and canonical inspection beat', typeof i?.telemetry?.phase === 'string'
    && i.telemetry.phase.length > 0 && obs.narrative?.beatId?.startsWith('inspection-'),
    { runtimePhase: i?.telemetry?.phase, narrative: obs.narrative })
  c(label + ': actual installed cutter geometry', i?.visible === true && i.vertices > 0 && i.triangles > 0
    && rectValid(i.rect) && rectValid(i.discRect) && Array.isArray(i.discBounds)
    && i.discBounds.length === 2 && i.discBounds.every(x => vector(x, 3)), i)
  c(label + ': exact cutter clearance at least near', finite(i?.cameraClearance) && finite(i?.near)
    && i.near > 0 && i.cameraClearance >= i.near, { clearance: i?.cameraClearance, near: i?.near })
  c(label + ': conservative whole-study clearance greater than near', finite(i?.studyClearanceLowerBound)
    && i.studyClearanceLowerBound > i.near && i.visibleMeshes > 0,
    { lowerBound: i?.studyClearanceLowerBound, visibleMeshes: i?.visibleMeshes, near: i?.near })
  c(label + ': installed subject transform witnesses available', poseDelta(obs, obs).subjectsValid, i?.subjectTransforms ?? 'MISSING subjectTransforms')
}

async function captureSample(page, dir, name, c, strict = true) {
  const obs = await observe(page)
  const ab = await beautyPixels(page)
  const dom = await overlaps(page, { disc: ab.geometry.discRect, contact: ab.geometry.contactRect })
  const artifacts = [savePng(dir, name + '-with-cutter.png', ab.pair.withCutter),
    savePng(dir, name + '-without-cutter.png', ab.pair.withoutCutter)]
  const screenshot = await page.screenshot({ path: path.join(dir, name + '-page.png'), animations: 'allow' })
  artifacts.push({ file: name + '-page.png', bytes: screenshot.length, sha256: hash(screenshot) })
  c(name + ': A/B same frame/progress/camera and cutter restored', ab.before.frames === ab.after.frames
    && ab.before.progress === ab.after.progress && JSON.stringify(ab.before.camera) === JSON.stringify(ab.after.camera)
    && JSON.stringify(ab.restored) === JSON.stringify(ab.geometry), { before: ab.before, after: ab.after })
  for (const region of ['disc', 'cutter']) {
    const p = ab.pixels.regions[region]
    // One nonzero pixel is insufficient. Fixed diagnostic threshold is recorded, not an art/performance budget.
    c(name + ': beauty A/B visible pixels in actual ' + region, p?.strongChanged >= 16 && p?.strongFraction >= 0.001, p)
  }
  if (strict) {
    c(name + ': actual contact-sector vertices and method observed', ab.geometry.contactVertices > 0
      && typeof ab.geometry.contactMethod === 'string' && ab.geometry.contactMethod.length > 0,
      { vertices: ab.geometry.contactVertices, method: ab.geometry.contactMethod })
    c(name + ': active disc inside viewport/depth clip', inFrame(ab.geometry.discRect) && dom.disc?.viewportContained,
      { rect: ab.geometry.discRect, crop: crop(ab.geometry.discRect), dom: dom.disc })
    c(name + ': full contact region inside viewport/depth clip', inFrame(ab.geometry.contactRect) && dom.contact?.viewportContained,
      { rect: ab.geometry.contactRect ?? 'MISSING contactRect', dom: dom.contact })
    const contactPixels = ab.pixels.regions.contact
    c(name + ': beauty A/B visibility at full contact region', contactPixels?.strongChanged >= 16
      && contactPixels?.strongFraction >= 0.001, contactPixels)
    for (const region of ['disc', 'contact']) c(name + ': no DOM painting over ' + region,
      Boolean(dom[region]) && dom[region].candidates.every(x => !x.paintsAboveCanvas && !x.uncertainPaintOrder), dom[region])
  }
  return { observation: obs, captureGeometry: ab.geometry, pixels: ab.pixels, dom, artifacts,
    arborCropAllowed: true, arborCrop: crop(ab.geometry.rect), discCrop: crop(ab.geometry.discRect) }
}

async function hold(page, baseline, c, label) {
  const samples = [], started = Date.now()
  for (let n = 1; n <= 5; n++) {
    await sleep(Math.max(0, started + n * 1000 - Date.now()))
    const obs = await observe(page), delta = poseDelta(baseline, obs)
    samples.push({ ms: Date.now() - started, observation: obs, delta })
    c(label + ': freeze ' + n, equalPose(delta)
      && Math.abs(obs.world.progress - baseline.world.progress) <= TOL.progress, delta)
  }
  c(label + ': presentation frames continue during freeze', samples.at(-1).observation.world.frames > baseline.world.frames + 5,
    { before: baseline.world.frames, after: samples.at(-1).observation.world.frames })
  return samples
}

async function controls(page, dir, c, canonical) {
  const result = {}
  const trigger = page.getByRole('button', { name: 'Open cutter inspection details', exact: true })
  await trigger.scrollIntoViewIfNeeded()
  result.entrySettle = await settle(page)
  c('controls: settle at real DOM inspection section', result.entrySettle.pass, result.entrySettle)
  const entry = await observe(page)
  result.entry = entry
  c('controls: real section is within live inspection window before opening', entry.world.progress >= 0.735
    && entry.world.progress < 0.94 && entry.narrative?.beatId?.startsWith('inspection-'), entry)
  await trigger.click()
  await page.getByRole('region', { name: 'Cutter inspection details', exact: true }).waitFor({ state: 'visible' })
  const range = page.getByRole('slider', { name: 'Study position', exact: true })
  await range.focus()
  await range.press('Home')
  for (let n = 0; n < 39; n++) await range.press('ArrowRight')
  await sleep(250)
  result.keyboardSeek = await observe(page)
  c('controls: keyboard range seek reaches actual study and keeps narrative independent', result.keyboardSeek.inspection?.playback?.open
    && !result.keyboardSeek.inspection.playback.playing
    && Math.abs(result.keyboardSeek.inspection.playback.progress - 0.39) <= TOL.channels
    && result.keyboardSeek.world.inspection.subjectTime > 7.2 && result.keyboardSeek.world.inspection.subjectTime < 9.6
    && Math.abs(result.keyboardSeek.world.progress - entry.world.progress) <= TOL.progress,
    result.keyboardSeek)
  result.manualSlow = await captureSample(page, dir, 'controls-manual-slow', c)
  // Exercise the real HTMLInputElement setter + native input/change events through React.
  // Never call the playback or store port setters.
  async function rangeInput(value) {
    await range.evaluate((input, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, String(value))
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
    await sleep(250)
    return observe(page)
  }
  result.manualSeek = await rangeInput(42)
  const manualDelta = poseDelta(result.keyboardSeek, result.manualSeek)
  c('controls: native range event seek moves actual camera and installed subject', Math.abs(result.manualSeek.inspection?.playback?.progress - 0.42) <= TOL.channels
    && manualDelta.cameraPositionMetres > 1e-6 && manualDelta.subjectsValid
    && manualDelta.subjectTransforms.some(x => x.positionMetres > 1e-7 || x.angleDegrees > 1e-5), manualDelta)
  c('controls: manual seek does not alter native canonical progress', Math.abs(result.manualSeek.world.progress - result.keyboardSeek.world.progress) <= TOL.progress,
    { keyboard: result.keyboardSeek.world.progress, manual: result.manualSeek.world.progress })
  await page.getByRole('button', { name: 'Play shaft study', exact: true }).click()
  await sleep(250)
  const playStart = await observe(page)
  await sleep(1500)
  const playEnd = await observe(page), playDelta = poseDelta(playStart, playEnd)
  result.play = { start: playStart, end: playEnd, delta: playDelta }
  c('controls: Play advances actual subject while presentation frames advance', playEnd.inspection?.playback?.playing
    && playEnd.inspection.playback.progress > playStart.inspection.playback.progress
    && playDelta.subjectTime > 0 && playDelta.subjectsValid
    && playDelta.subjectTransforms.some(x => x.positionMetres > 1e-7 || x.angleDegrees > 1e-5)
    && playEnd.world.frames > playStart.world.frames + 5, result.play)
  c('controls: Play preserves canonical progress', Math.abs(playStart.world.progress - playEnd.world.progress) <= TOL.progress, result.play)
  await page.getByRole('button', { name: 'Pause shaft study', exact: true }).click()
  await sleep(250)
  const paused = await observe(page)
  c('controls: Pause state observed', paused.inspection?.playback?.open && !paused.inspection.playback.playing, paused)
  result.pause = await hold(page, paused, c, 'controls Pause')
  // Restore readable slow subject before changing native canonical scroll independently.
  const fixed = await rangeInput(39)
  result.scrollSettle = await seek(page, 0.825)
  c('controls: native scroll settles independently', result.scrollSettle.pass, result.scrollSettle)
  const scrolled = await observe(page)
  result.scrolled = scrolled
  c('controls: scroll moves canonical progress while manual subject/camera stay fixed', Math.abs(scrolled.world.progress - fixed.world.progress) > 0.001
    && Math.abs(scrolled.inspection?.playback?.progress - fixed.inspection?.playback?.progress) <= TOL.channels
    && equalPose(poseDelta(fixed, scrolled)), { delta: poseDelta(fixed, scrolled), before: fixed.world.progress, after: scrolled.world.progress })
  // Native keyboard Escape closes without bringing an offscreen DOM trigger into view first.
  await page.keyboard.press('Escape')
  const escapeSettle = await settle(page)
  const escaped = await observe(page)
  result.escape = { settle: escapeSettle, observation: escaped }
  c('controls: Escape closes and returns trigger focus', !escaped.inspection?.playback?.open
    && await page.getByRole('button', { name: 'Open cutter inspection details', exact: true }).evaluate(el => el === document.activeElement), escaped)
  c('controls: Escape resumes canonical study sampling', escapeSettle.pass
    && Math.abs(escaped.world.progress - scrolled.world.progress) <= TOL.progress
    && equalPose(poseDelta(canonical[0.825].observation, escaped)), poseDelta(canonical[0.825].observation, escaped))
  const reopen = page.getByRole('button', { name: 'Open cutter inspection details', exact: true })
  await reopen.scrollIntoViewIfNeeded()
  const reopenSettle = await settle(page), beforeReopen = await observe(page)
  c('controls: second real DOM entry remains within canonical inspection', reopenSettle.pass
    && beforeReopen.world.progress >= 0.735 && beforeReopen.world.progress < 0.94, beforeReopen)
  await reopen.click()
  await sleep(250)
  const closeTrigger = page.getByRole('button', { name: 'Hide cutter inspection details', exact: true })
  await closeTrigger.click()
  const closeSettle = await settle(page), closed = await observe(page)
  result.close = { settle: closeSettle, observation: closed }
  c('controls: close button returns focus and canonical sampling', closeSettle.pass && !closed.inspection?.playback?.open
    && Math.abs(closed.world.progress - beforeReopen.world.progress) <= TOL.progress
    && equalPose(poseDelta(beforeReopen, closed))
    && await page.getByRole('button', { name: 'Open cutter inspection details', exact: true }).evaluate(el => el === document.activeElement),
    { observation: closed, delta: poseDelta(beforeReopen, closed) })
  result.finalSettle = await seek(page, 0.815, canonical[0.815].observation.scroll.y)
  const final = await observe(page)
  c('controls: canonical .815 pose restored after close and native seek', result.finalSettle.pass
    && equalPose(poseDelta(canonical[0.815].observation, final)), poseDelta(canonical[0.815].observation, final))
  return result
}

async function runCase(browser, args, provenance, viewport, tier) {
  const id = viewport + '-' + tier, dir = path.join(args.out, id)
  mkdirSync(dir)
  const result = { id, viewport: VIEWPORTS[viewport], requestedTier: tier, assertions: [], samples: {}, errors: [], served: [], unmappedResponses: [] }
  const c = (name, pass, actual) => result.assertions.push({ name, pass: Boolean(pass), actual })
  const context = await browser.newContext({ viewport: { width: VIEWPORTS[viewport].width, height: VIEWPORTS[viewport].height },
    deviceScaleFactor: VIEWPORTS[viewport].deviceScaleFactor, isMobile: VIEWPORTS[viewport].isMobile,
    hasTouch: VIEWPORTS[viewport].hasTouch, reducedMotion: 'no-preference' })
  const pendingResponses = []
  let timer
  try {
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => result.errors.push({ kind: 'pageerror', message: String(error) }))
    page.on('console', message => { if (message.type() === 'error') result.errors.push({ kind: 'console', message: message.text() }) })
    page.on('requestfailed', request => result.errors.push({ kind: 'requestfailed', url: request.url(), failure: request.failure() }))
    page.on('response', response => {
      const url = new URL(response.url())
      if (url.protocol === 'blob:') return // Locally generated Draco/text worker scripts have no network build path.
      if (url.origin !== new URL(args.url).origin) return
      const file = decodeURIComponent(url.pathname).replace(/^\//, '')
      const local = provenance.files.find(x => x.path === file)
      if (!local) {
        const type = response.request().resourceType()
        if (['script', 'stylesheet', 'font', 'fetch', 'xhr'].includes(type)) result.unmappedResponses.push({ url: url.href, status: response.status(), type })
        return
      }
      if (/\.html$/.test(file)) return
      pendingResponses.push((async () => {
        try {
          let bytes, bodyMethod = 'original-browser-response'
          try { bytes = await response.body() }
          catch (error) {
            if (!String(error).includes('evicted from inspector cache')) throw error
            const repeated = await context.request.get(url.href)
            if (repeated.status() !== response.status()) throw new Error('Repeat provenance response changed HTTP status')
            bytes = await repeated.body(); bodyMethod = 'same-preview-refetch-after-inspector-eviction'
          }
          const servedSha256 = hash(bytes)
          const encoding = response.headers()['content-encoding'] ?? null
          const decodedLocalSha256 = file.endsWith('.gz') && encoding?.includes('gzip')
            ? hash(gunzipSync(readFileSync(path.join(args.buildDir, file)))) : null
          const witness = { file, url: url.href, status: response.status(), servedSha256, localSha256: local.sha256,
            decodedLocalSha256, encoding, bodyMethod }
          result.served.push(witness)
          c('served request matches build: ' + file, witness.status === 200
            && (servedSha256 === local.sha256 || servedSha256 === decodedLocalSha256), witness)
        } catch (error) { c('served response readable: ' + file, false, String(error)) }
      })())
    })
    const work = async () => {
      const url = new URL(args.url)
      url.searchParams.set('quality', tier)
      const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
      c('private document HTTP 200', response?.status() === 200 && new URL(page.url()).pathname.replace(/\/$/, '') === '/torque-wrench', page.url())
      const documentHash = response ? hash(await response.body()) : null
      c('navigated document bytes match supplied build', documentHash === provenance.files.find(x => x.path === 'torque-wrench/index.html')?.sha256,
        { servedSha256: documentHash, localSha256: provenance.files.find(x => x.path === 'torque-wrench/index.html')?.sha256 })
      c('exact build entry loaded by private document', await page.locator('script[type="module"]').evaluateAll((scripts, expected) => scripts.some(s => new URL(s.src).pathname === '/' + expected), provenance.entry), provenance.entry)
      await waitReady(page)
      // First entry installs the asynchronous study; readiness is separate from motion settling/G8.
      await page.evaluate(() => window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) * 0.79), behavior: 'instant' }))
      await waitReady(page, true)
      const initialSeek = await seek(page, 0.79)
      c('entry native scroll settles after study readiness', initialSeek.pass, initialSeek)
      for (const progress of POINTS) {
        const settled = await seek(page, progress)
        c('forward ' + progress + ': native progress settled', settled.pass, settled)
        const obs = await observe(page)
        assertObserved(c, obs, tier, 'forward ' + progress)
        if (SLOW.includes(progress)) c('forward ' + progress + ': measured subject rate in stable slow window',
          finite(obs.world?.inspection?.machiningRate) && obs.world.inspection.machiningRate <= 0.2201,
          obs.world?.inspection)
        result.samples[progress] = await captureSample(page, dir, 'forward-' + progress, c, SLOW.includes(progress))
        result.samples[progress].settle = settled
      }
      const first = result.samples[0.795].observation, last = result.samples[0.835].observation
      const delta = poseDelta(first, last)
      result.motion = { delta, cameraSecondsDelta: last.world.inspection.cameraTime - first.world.inspection.cameraTime,
        subjectSecondsDelta: last.world.inspection.subjectTime - first.world.inspection.subjectTime }
      result.motion.intervals = SLOW.slice(1).map((p, index) => {
        const a = result.samples[SLOW[index]].observation, b = result.samples[p].observation
        const d = poseDelta(a, b), subjectSeconds = b.world.inspection.subjectTime - a.world.inspection.subjectTime,
          cameraSeconds = b.world.inspection.cameraTime - a.world.inspection.cameraTime
        return { from: SLOW[index], to: p, delta: d, subjectSeconds, cameraSeconds,
          cameraMetresPerCameraSecond: d.cameraPositionMetres / cameraSeconds,
          cameraDegreesPerCameraSecond: d.cameraAngleDegrees / cameraSeconds,
          subjectDegreesPerMasterSecond: d.subjectTransforms?.map(x => ({ name: x.name, rate: x.angleDegrees / subjectSeconds })) ?? null }
      })
      c('slow window: actual camera translates and rotates independently of subject time', delta.cameraPositionMetres > 0.0001
        && delta.cameraAngleDegrees > 0.01 && result.motion.cameraSecondsDelta > result.motion.subjectSecondsDelta,
        result.motion)
      c('slow window: installed subject transforms are measured and move slowly', delta.subjectsValid
        && delta.subjectTransforms.some(x => x.positionMetres > 1e-7 || x.angleDegrees > 1e-5), delta)
      // Retained shaping law is pi radians per machining second for the shaft. At .22
      // machining rate, installed shaft angular speed is bounded by 39.6 degrees/master second.
      c('slow window: actual shaft angular rate is bounded independently of camera motion', result.motion.intervals.every(x =>
        x.subjectSeconds > 0 && x.cameraSeconds > 0 && x.delta.subjectsValid
        && x.subjectDegreesPerMasterSecond.every(s => finite(s.rate) && s.rate <= 39.7)), result.motion.intervals)
      result.reverse = []
      for (const progress of [...POINTS].reverse()) {
        const original = result.samples[progress].observation
        const settled = await seek(page, progress, original.scroll.y), obs = await observe(page)
        const delta = poseDelta(original, obs)
        c('reverse ' + progress + ': actual matched-progress equality', settled.pass && equalPose(delta)
          && Math.abs(original.world.progress - obs.world.progress) <= TOL.progress, delta)
        result.reverse.push({ progress, settle: settled, observation: obs, delta })
        if (SLOW.includes(progress)) {
          const captured = await captureSample(page, dir, 'reverse-' + progress, c)
          result.reverse.at(-1).capture = captured
          c('reverse ' + progress + ': matched beauty images retrace forward',
            captured.artifacts[0].sha256 === result.samples[progress].artifacts[0].sha256
            && captured.artifacts[1].sha256 === result.samples[progress].artifacts[1].sha256,
            { forward: result.samples[progress].artifacts.slice(0, 2), reverse: captured.artifacts.slice(0, 2) })
        }
      }
      await seek(page, 0.815, result.samples[0.815].observation.scroll.y)
      result.hold = await hold(page, await observe(page), c, 'canonical hold')
      result.holdCapture = await captureSample(page, dir, 'hold-0.815', c)
      c('canonical hold: beauty images freeze while frames advance',
        result.holdCapture.artifacts[0].sha256 === result.samples[0.815].artifacts[0].sha256
        && result.holdCapture.artifacts[1].sha256 === result.samples[0.815].artifacts[1].sha256,
        { forward: result.samples[0.815].artifacts.slice(0, 2), hold: result.holdCapture.artifacts.slice(0, 2) })
      result.controls = await controls(page, dir, c, result.samples)
    }
    await Promise.race([work(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Case watchdog: 240000ms')), 240000)
    })])
  } catch (error) {
    result.exception = String(error?.stack ?? error)
    c('case completes without exception', false, result.exception)
  } finally {
    clearTimeout(timer)
    // Drain finished resource reads while the context is live, then close even on hangs.
    let drainTimer
    await Promise.race([Promise.allSettled(pendingResponses), new Promise(resolve => { drainTimer = setTimeout(resolve, 5000) })])
    clearTimeout(drainTimer)
    await context.close()
    await Promise.allSettled(pendingResponses)
  }
  c('no console/page/request errors', result.errors.length === 0, result.errors)
  c('all same-origin runtime asset responses belong to supplied build', result.unmappedResponses.length === 0, result.unmappedResponses)
  c('entry and lazy Scene responses match supplied build', [provenance.entry, provenance.scene].every(file => result.served.some(x => x.file === file && x.servedSha256 === x.localSha256)), result.served)
  result.pass = result.assertions.length > 0 && result.assertions.every(x => x.pass)
  result.failed = result.assertions.filter(x => !x.pass).map(x => x.name)
  writeFileSync(path.join(dir, 'metrics.json'), JSON.stringify(result, nonfiniteJSON, 2) + '\n', { flag: 'wx' })
  console.log(`${id}: ${result.pass ? 'PASS' : 'FAIL'} (${result.assertions.length - result.failed.length}/${result.assertions.length} assertions)`)
  return result
}

// JSON's default null for Infinity hides missing measurements; retain them explicitly.
function nonfiniteJSON(_key, value) { return typeof value === 'number' && !Number.isFinite(value) ? String(value) : value }

async function main() {
  let args
  try { args = parseArgs() }
  catch (error) { console.error('USAGE: ' + error.message); process.exitCode = 2; return }
  if (args.help) {
    console.log('node scripts/verify-torque-cutter.mjs --url=http://localhost:<port>/torque-wrench/ --out=<NEW evidence directory> --build-dir=<worktree .scratch production build>\nSequential roster: desktop/full, desktop/lite, narrow/full, narrow/lite. No browser is launched for --help.\nRequired geometry witnesses: inspection().contactRect/contactVertices/contactMethod and subjectTransforms; missing evidence FAILS.\nG8 performance, parity and owner acceptance are not tested.')
    return
  }
  let playwright, provenance, served
  try {
    provenance = buildProvenance(args)
    playwright = await import('playwright')
    served = await verifyServed(playwright, args, provenance)
  } catch (error) { console.error('BLOCKED: ' + error.message); process.exitCode = 11; return }
  // mkdirSync is exclusive: no evidence replacement, even if another worker races this run.
  mkdirSync(path.dirname(args.out), { recursive: true })
  mkdirSync(args.out)
  const report = { task: 'JG-038 Stage3 cutter/controls', startedAt: new Date().toISOString(),
    url: args.url, provenance, served, tolerances: TOL, launchConfiguration: launchConfig(),
    visibilityThreshold: { strongChannelDelta: 8, minimumStrongPixels: 16, minimumRegionFraction: 0.001 },
    scope: 'Geometry/control evidence only. G8 hardware performance NOT TESTED; no matched mechanical parity or owner acceptance.',
    requiredProbeWitnesses: ['contactRect normalized real contact-sector vertices with minDepth/maxDepth, contactVertices and contactMethod',
      'subjectTransforms installed shaft meshes measured from matrixWorld: unique name, metre position, quaternion'],
    cases: [] }
  let browser
  try {
    browser = await playwright.chromium.launch(launchConfig())
    report.browserVersion = browser.version()
    for (const viewport of ['D', 'N']) for (const tier of ['full', 'lite']) {
      report.cases.push(await runCase(browser, args, provenance, viewport, tier))
    }
    report.pass = report.cases.length === 4 && report.cases.every(c => c.pass)
    process.exitCode = report.pass ? 0 : 1
  } catch (error) {
    report.pass = false; report.environmentError = String(error?.stack ?? error); process.exitCode = 11
  } finally {
    if (browser) await browser.close().catch(error => { report.browserCloseError = String(error); report.pass = false; process.exitCode = 1 })
    report.finishedAt = new Date().toISOString()
    try {
      writeFileSync(path.join(args.out, 'report.json'), JSON.stringify(report, nonfiniteJSON, 2) + '\n', { flag: 'wx' })
      console.log('Report: ' + path.join(args.out, 'report.json'))
    } catch (error) { console.error('REPORT WRITE FAILED: ' + error); process.exitCode = 12 }
  }
}

await main()
