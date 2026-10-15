/** JG-038 lane C: continuous per-presented-frame clearance/framing recorder (revision 2).
 * Records EVERY presented frame while the native scroll input drives the complete
 * canonical inspection window forward, reverse, and hold (D/N x full/lite), using
 * window.__torqueWorld.inspection() geometry, the RuntimeWorld snapshot and measured
 * DOM rectangles. Exact existing thresholds only (verify-torque-cutter.mjs TOL /
 * contract 18 section 6).
 *
 * Gate scoping (independent-review correction):
 * - Whole study [0.735,0.94) on EVERY row: finite progress and mapped input (at most one
 *   commanded scroll step of pipeline lag, step derived per row; exact 1e-9 at hold),
 *   strict frame-ID advancement, rows == world.frames delta, zero hiddenFrames delta,
 *   live renderer/context/draw (calls>0, context not lost), inspection- beat and
 *   live/ready state.
 * - Cutter geometry/clearance/contact gates ONLY on rows where the runtime schedule has
 *   the cutter present (telemetry shaft cutter.visible === true; shaper ease fades inside
 *   subjectTime 2..15).
 * - Viewport/depth/DOM paint gates ONLY where arcWeight > 0 (InspectionDirector camera
 *   arc, subjectTime ~6.5..10.3).
 * - Endpoint full-pose equality is compared at active framed .815 (anchor vs hold
 *   baseline), never at inactive .735.
 * - Missing/non-finite evidence fails closed; unreadable probes are reported UNVERIFIED
 *   and the case cannot PASS. Runtime phase, actual cutter visibility, arcWeight,
 *   discBounds, contactMethod and GL backend/drawingBuffer/context are recorded per row,
 *   never inferred from canonical progress alone.
 * - Rows are retained, never discarded as hidden noise: inactive/absent-study transition
 *   rows (cutter not scheduled; visibleMeshes 0 / studyClearanceLowerBound Infinity at the
 *   window edge) are recorded as retained observations and are not product failures; an
 *   active-cutter DOM paint-order ambiguity outside the camera arc (paintsAboveCanvas=false,
 *   uncertainPaintOrder=true) is reported UNVERIFIED with the exact overlap, never claimed
 *   as actual occlusion.
 * No pacing or C1 tolerance exists anywhere in this harness: traversal pacing, per-frame
 * progress deltas and rAF gaps are recorded observations, never gates. No analytical
 * continuous proof is derived from sampled frames; the record itself is the evidence.
 * G8 performance, mechanical parity, lifecycle and owner/Astra acceptance are NOT tested.
 *
 * Exit 0 = recorded cases pass the corrected gates with zero UNVERIFIED probes;
 * 1 = gate failure; 2 = usage; 11 = environment/provenance blocked; 12 = report write
 * failure.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchConfig, describeLaunch } from './lib/browser-launch.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EVIDENCE = path.join(ROOT, 'project/work/evidence/torque-wrench-rebuild')
// Canonical inspection window: RuntimeWorld.tsx studyVisible gate progress >= 0.735 && < 0.94.
const WINDOW = { start: 0.735, end: 0.94 }
// Existing cutter canonical hold point (verify-torque-cutter.mjs seeks 0.815 for hold).
const HOLD_PROGRESS = 0.815
// Presented-frame budget per traversal (input fixture, not a tolerance; pace is reported).
const TRAVERSE_FRAMES = 600
const VIEWPORTS = {
  D: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  N: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
}
// Byte-identical to verify-torque-cutter.mjs TOL (contract 18 hold/settle numbers).
const TOL = { positionMetres: 0.0001, angleDegrees: 0.01, fovDegrees: 0.01,
  channels: 1e-4, progress: 1e-9, settleMs: 3000, stableMs: 500, holdMs: 5000 }
const DOM_SELECTOR = '.torque-chapter__title,.torque-chapter__lede,.torque-chapter__body,' +
  '.torque-inspection__panel,.torque-inspection__toggle,.torque-header,.torque-footer'
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

function parseArgs() {
  const args = {}
  for (let i = 2; i < process.argv.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(process.argv[i])
    if (!match || !['help', 'url', 'out', 'build-dir', 'viewport', 'tier'].includes(match[1])) throw new Error('Unknown argument: ' + process.argv[i])
    const key = match[1]
    if (key in args) throw new Error('Duplicate --' + key)
    args[key] = key === 'help' ? true : match[2] ?? process.argv[++i]
    if (key !== 'help' && (!args[key] || args[key].startsWith('--'))) throw new Error('Missing --' + key)
  }
  if (args.help) return args
  args.viewport = args.viewport ?? 'all'
  args.tier = args.tier ?? 'all'
  if (!['D', 'N', 'all'].includes(args.viewport)) throw new Error('--viewport must be D, N or all')
  if (!['full', 'lite', 'all'].includes(args.tier)) throw new Error('--tier must be full, lite or all')
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
        files.push({ path: path.relative(args.buildDir, full).replaceAll(String.fromCharCode(92), '/'), bytes: bytes.length, sha256: hash(bytes) })
      }
    }
  }
  visit(args.buildDir)
  const manifest = JSON.parse(readFileSync(path.join(args.buildDir, '.vite/manifest.json'), 'utf8'))
  const entry = manifest['torque-wrench/index.html']
  const sceneKey = Object.keys(manifest).find(k => /^src\/scene\/torque-wrench\/Scene\.[tj]sx?$/.test(k))
  if (!entry?.isEntry || !entry.file || !sceneKey || !manifest[sceneKey]?.file) throw new Error('Build manifest lacks private entry or lazy Scene')
  const sourcePaths = ['scripts/verify-torque-continuous-clearance.mjs', 'scripts/lib/browser-launch.mjs',
    'src/scene/torque-wrench/RuntimeWorld.tsx', 'src/scene/torque-wrench/inspectionProof.ts',
    'src/scene/torque-wrench/InspectionDirector.ts', 'src/scene/torque-wrench/beats.ts',
    'src/scene/inspection/shaft/schedule.ts', 'src/scene/inspection/shaft/shaftRuntime.ts',
    'src/scene/inspection/shaft/story.ts', 'src/scene/torque-wrench/Scene.tsx']
  return { buildDir: args.buildDir, aggregateSha256: hash(JSON.stringify(files)), files,
    entry: entry.file, scene: manifest[sceneKey].file,
    sourceAtRun: sourcePaths.map(file => ({ path: file, sha256: hash(readFileSync(path.join(ROOT, file))) })),
    sourceQualification: 'Current source hashes are observations, not proof the build was produced from that source. Served bytes are checked against the supplied build.' }
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

async function observe(page) {
  return page.evaluate(() => {
    const world = window.__torqueWorld?.snapshot()
    const canvas = document.querySelector('.torque-scene canvas')
    const gl = canvas && (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    const debug = gl?.getExtension('WEBGL_debug_renderer_info')
    const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null
    const vendor = debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null
    const backend = renderer?.match(/Direct3D\d+|D3D\d+|Vulkan|Metal|OpenGL(?: ES)?|SwiftShader/i)?.[0] ?? null
    return { world, narrative: window.__torqueNarrative?.snapshot(),
      mode: document.querySelector('.torque-page')?.dataset.torqueMode,
      tierFromDOM: world?.mechanical?.tier ?? null,
      renderer: { renderer, vendor, backend, version: gl?.getParameter(gl.VERSION) ?? null,
        contextLost: gl?.isContextLost() ?? true,
        classification: !renderer ? 'unknown' : /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer) ? 'software' : 'hardware-reported' },
      scroll: { y: scrollY, max: document.documentElement.scrollHeight - innerHeight },
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio } }
  })
}

async function waitReady(page, study = false) {
  await page.waitForFunction(wantStudy => {
    const s = window.__torqueWorld?.snapshot()
    return s?.ready && s.sheet?.baked && (!wantStudy || s.inspection?.ready)
      && typeof window.__torqueWorld?.inspection === 'function'
      && document.querySelector('.torque-scene canvas') && window.__torqueNarrative
  }, study, { timeout: 30000 })
}

async function settle(page, expectedY = null) {
  const start = Date.now(), trace = []
  let previous = null, stableSince = null
  while (Date.now() - start < TOL.settleMs) {
    const now = await observe(page)
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

async function seek(page, fraction) {
  const y = await page.evaluate(fraction => {
    const max = document.documentElement.scrollHeight - innerHeight
    const y = Math.round(max * fraction)
    window.scrollTo({ top: y, behavior: 'instant' })
    return y
  }, fraction)
  return { y, settle: await settle(page, y) }
}

// One row-shaped full observation (same fields as recorder rows) at the current state.
async function sampleNow(page) {
  return page.evaluate(() => {
    const s = window.__torqueWorld.snapshot()
    const insp = window.__torqueWorld.inspection()
    const n = window.__torqueNarrative?.snapshot?.() ?? null
    const canvasEl = document.querySelector('.torque-scene canvas')
    const gl = canvasEl && (canvasEl.getContext('webgl2') || canvasEl.getContext('webgl'))
    return { phase: 'spot', t: performance.now(), frames: s.frames, targetY: scrollY, y: scrollY,
      scrollMax: document.documentElement.scrollHeight - innerHeight,
      progress: s.progress, beat: n?.beatId ?? null, localProgress: n?.localProgress ?? null, hidden: document.hidden,
      ready: s.ready === true, inspectionReady: s.inspection?.ready === true, sheetBaked: s.sheet?.baked === true,
      mode: document.querySelector('.torque-page')?.dataset.torqueMode ?? null,
      arcWeight: s.inspection?.arcWeight ?? null, runtimePhase: insp.telemetry?.phase ?? null,
      scheduledCutterVisible: insp.telemetry?.shaft?.cutter?.visible ?? null,
      subjectTime: s.inspection?.subjectTime ?? null, cameraTime: s.inspection?.cameraTime ?? null,
      machiningRate: s.inspection?.machiningRate ?? null, camera: s.camera,
      renderer: { calls: s.renderer.calls, triangles: s.renderer.triangles, effectiveDpr: s.renderer.effectiveDpr,
        backend: s.renderer.backend ?? null, drawingBuffer: s.renderer.drawingBuffer ?? null,
        contextLost: gl ? gl.isContextLost() : null },
      geometry: { visible: insp.visible, vertices: insp.vertices, triangles: insp.triangles,
        cameraClearance: insp.cameraClearance, near: insp.near, studyClearanceLowerBound: insp.studyClearanceLowerBound,
        visibleMeshes: insp.visibleMeshes, contactVertices: insp.contactVertices,
        rect: insp.rect, discRect: insp.discRect, contactRect: insp.contactRect,
        subjectTransforms: insp.subjectTransforms, discBounds: insp.discBounds ?? null,
        contactMethod: insp.contactMethod ?? null, cutter: insp.telemetry?.shaft?.cutter ?? null },
      inspErr: null, dom: {}, domViewport: { w: innerWidth, h: innerHeight }, discDom: null, contactDom: null,
      paint: { disc: [], contact: [] } }
  })
}

// In-page presented-frame recorder: sample the presented state first, then command the
// next native scroll target. Input witness (targetY) is stored on every row.
async function recordPhase(page, spec) {
  spec.domSelector = DOM_SELECTOR
  return page.evaluate(async spec => {
    const worldPort = () => window.__torqueWorld
    const max = document.documentElement.scrollHeight - innerHeight
    const before = worldPort().snapshot()
    const rows = []
    const started = performance.now()
    const canvasEl = document.querySelector('.torque-scene canvas')
    const paintOrder = region => {
      const candidates = []
      for (const el of document.querySelectorAll(spec.domSelector)) {
        const style = getComputedStyle(el), b = el.getBoundingClientRect()
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || !b.width || !b.height) continue
        const width = Math.max(0, Math.min(region.right, b.right, innerWidth) - Math.max(region.left, b.left, 0))
        const height = Math.max(0, Math.min(region.bottom, b.bottom, innerHeight) - Math.max(region.top, b.top, 0))
        if (!width || !height) continue
        const x = (Math.max(region.left, b.left, 0) + Math.min(region.right, b.right, innerWidth)) / 2
        const y = (Math.max(region.top, b.top, 0) + Math.min(region.bottom, b.bottom, innerHeight)) / 2
        // Hit testing omits pointer-events:none even though those pixels paint.
        // Temporarily expose only the two candidates to hit testing; restore
        // inline declarations synchronously, without rendering or layout edits.
        const candidatesForHitTest = [canvasEl, el].filter(Boolean)
        const declarations = candidatesForHitTest.map(node => ({ node,
          value: node.style.getPropertyValue('pointer-events'),
          priority: node.style.getPropertyPriority('pointer-events') }))
        let stack
        try {
          for (const node of candidatesForHitTest) node.style.setProperty('pointer-events', 'auto', 'important')
          stack = document.elementsFromPoint(x, y)
        } finally {
          for (const saved of declarations) {
            if (saved.value) saved.node.style.setProperty('pointer-events', saved.value, saved.priority)
            else saved.node.style.removeProperty('pointer-events')
          }
        }
        const ci = stack.indexOf(canvasEl)
        const ei = stack.findIndex(node => node === el || el.contains(node))
        candidates.push({ selector: el.id ? '#' + el.id : '.' + [...el.classList].join('.'),
          box: { left: b.left, top: b.top, right: b.right, bottom: b.bottom }, overlapAreaCss: width * height,
          paintsAboveCanvas: ei >= 0 && ci >= 0 && ei < ci, uncertainPaintOrder: ei < 0 || ci < 0,
          method: 'temporary candidate hit-test eligibility; original inline pointer-events restored; ordering is not opaque pixel coverage' })
      }
      return candidates
    }
    const normalized = (canvasBox, r) => {
      if (!canvasBox || !r || ![r.left, r.top, r.right, r.bottom].every(Number.isFinite)) return null
      return { left: canvasBox.left + r.left * canvasBox.width, top: canvasBox.top + r.top * canvasBox.height,
        right: canvasBox.left + r.right * canvasBox.width, bottom: canvasBox.top + r.bottom * canvasBox.height }
    }
    const sample = (now, targetY) => {
      const s = worldPort().snapshot()
      let insp = null, inspErr = null
      try { insp = worldPort().inspection() } catch (error) { inspErr = String(error) }
      const n = window.__torqueNarrative?.snapshot?.() ?? null
      const canvasBox = canvasEl?.getBoundingClientRect() ?? null
      const gl = canvasEl && (canvasEl.getContext('webgl2') || canvasEl.getContext('webgl'))
      const debug = gl?.getExtension('WEBGL_debug_renderer_info')
      const dom = {}
      for (const el of document.querySelectorAll(spec.domSelector)) {
        const style = getComputedStyle(el), b = el.getBoundingClientRect()
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || !b.width || !b.height) continue
        dom[el.id ? '#' + el.id : '.' + [...el.classList].join('.')] = { left: b.left, top: b.top, right: b.right, bottom: b.bottom }
      }
      const geometry = insp ? { visible: insp.visible, vertices: insp.vertices, triangles: insp.triangles,
        cameraClearance: insp.cameraClearance, near: insp.near, studyClearanceLowerBound: insp.studyClearanceLowerBound,
        visibleMeshes: insp.visibleMeshes, contactVertices: insp.contactVertices,
        rect: insp.rect, discRect: insp.discRect, contactRect: insp.contactRect,
        subjectTransforms: insp.subjectTransforms, discBounds: insp.discBounds ?? null,
        contactMethod: insp.contactMethod ?? null, cutter: insp.telemetry?.shaft?.cutter ?? null } : null
      const discDom = geometry ? normalized(canvasBox, geometry.discRect) : null
      const contactDom = geometry ? normalized(canvasBox, geometry.contactRect) : null
      rows.push({ phase: spec.phase, t: now - started, frames: s.frames, targetY, y: scrollY,
        scrollMax: document.documentElement.scrollHeight - innerHeight,
        progress: s.progress, beat: n?.beatId ?? null, localProgress: n?.localProgress ?? null, hidden: document.hidden,
        ready: s.ready === true, inspectionReady: s.inspection?.ready === true, sheetBaked: s.sheet?.baked === true,
        mode: document.querySelector('.torque-page')?.dataset.torqueMode ?? null,
        arcWeight: s.inspection?.arcWeight ?? null, runtimePhase: insp?.telemetry?.phase ?? null,
        scheduledCutterVisible: insp?.telemetry?.shaft?.cutter?.visible ?? null,
        subjectTime: s.inspection?.subjectTime ?? null, cameraTime: s.inspection?.cameraTime ?? null,
        machiningRate: s.inspection?.machiningRate ?? null, camera: s.camera,
        renderer: { calls: s.renderer.calls, triangles: s.renderer.triangles, effectiveDpr: s.renderer.effectiveDpr,
          backend: s.renderer.backend ?? null, drawingBuffer: s.renderer.drawingBuffer ?? null,
          vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
          debugRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
          actualDrawingBuffer: gl ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight } : null,
          contextLost: gl ? gl.isContextLost() : null },
        geometry, inspErr, dom, domViewport: { w: innerWidth, h: innerHeight },
        discDom, contactDom,
        paint: { disc: discDom ? paintOrder(discDom) : [], contact: contactDom ? paintOrder(contactDom) : [] } })
    }
    await new Promise(resolve => {
      let i = 0
      const frame = now => {
        if (spec.phase === 'hold') {
          sample(now, spec.toY)
          if (now - started >= spec.holdMs) return resolve()
        } else {
          sample(now, Math.round(spec.fromY + (spec.toY - spec.fromY) * (i / spec.frames)))
          if (i >= spec.frames) return resolve()
          scrollTo(0, Math.round(spec.fromY + (spec.toY - spec.fromY) * (++i / spec.frames)))
        }
        requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })
    const after = worldPort().snapshot()
    return { rows, max,
      before: { frames: before.frames, progress: before.progress, hiddenFrames: before.hiddenFrames },
      after: { frames: after.frames, progress: after.progress, hiddenFrames: after.hiddenFrames } }
  }, spec)
}

function poseDelta(a, b) {
  const ac = a?.camera, bc = b?.camera
  const at = a?.geometry?.subjectTransforms, bt = b?.geometry?.subjectTransforms
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
  const ak = a?.geometry?.cutter, bk = b?.geometry?.cutter
  return { cameraPositionMetres: distance(ac?.position, bc?.position), cameraTargetMetres: distance(ac?.target, bc?.target),
    cameraAngleDegrees: angle(ac?.quaternion, bc?.quaternion),
    fovDegrees: finite(ac?.fov) && finite(bc?.fov) ? Math.abs(ac.fov - bc.fov) : Infinity,
    subjectTime: finite(a?.subjectTime) && finite(b?.subjectTime) ? Math.abs(a.subjectTime - b.subjectTime) : Infinity,
    cameraTime: finite(a?.cameraTime) && finite(b?.cameraTime) ? Math.abs(a.cameraTime - b.cameraTime) : Infinity,
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

// Whole-study gates run on every row. Cutter geometry gates run only where the runtime
// schedule has the cutter present (telemetry shaft cutter.visible; shaper ease fades
// inside subjectTime 2..15). Viewport/depth/DOM paint gates run only where arcWeight > 0
// (director camera arc, subjectTime ~6.5..10.3). Missing/non-finite evidence is a
// violation; probes that cannot be read at all are listed in `unverified` so absence can
// never become a PASS. Inactive/absent-study transition rows are retained as explicit
// observations (`retained`), and active-cutter paint-order ambiguity outside the arc is
// retained as UNVERIFIED with the exact overlap, never as an occlusion claim.
function auditRows(rows) {
  const violations = { inspError: 0, notInspectionBeat: 0, notReady: 0, notFinite: 0, unmappedInput: 0,
    frameIdNotAdvancing: 0, rendererDead: 0, contextLost: 0, arcWeightMissing: 0, runtimePhaseMissing: 0,
    arcSubjectWindowMismatch: 0, cutterWindowMismatch: 0, cutterHidden: 0, cutterInvisible: 0,
    missingWitnesses: 0, clearanceAtOrBelowNear: 0, studyClearanceAtOrBelowNear: 0,
    discBoundsMissing: 0, contactMethodMissing: 0, discOutOfFrame: 0, contactOutOfFrame: 0,
    discDomOverflow: 0, contactDomOverflow: 0, paintOverDisc: 0, paintOverContact: 0 }
  const examples = [], unverified = [], retained = []
  let cutterPresentRows = 0, arcRows = 0
  const drawRange = { callsMin: Infinity, callsMax: -Infinity, trianglesMin: Infinity, trianglesMax: -Infinity }
  const mark = (row, reason) => { violations[reason]++; if (examples.length < 20) examples.push({ t: Math.round(row.t), phase: row.phase, frames: row.frames, reason }) }
  const probeAbsent = (row, probe, detail) => { if (unverified.length < 40) unverified.push({ t: Math.round(row.t), phase: row.phase, frames: row.frames, probe, detail }) }
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], prev = i > 0 ? rows[i - 1] : null
    if (row.inspErr) { mark(row, 'inspError'); probeAbsent(row, 'window.__torqueWorld.inspection()', row.inspErr) }
    if (!(row.beat ?? '').startsWith('inspection-')) mark(row, 'notInspectionBeat')
    if (!(typeof row.runtimePhase === 'string' && row.runtimePhase.trim().length > 0)) mark(row, 'runtimePhaseMissing')
    if (!(row.ready === true && row.inspectionReady === true && row.sheetBaked === true && row.mode === 'live')) mark(row, 'notReady')
    const draws = row.renderer ?? {}
    if (!(finite(draws.calls) && draws.calls > 0 && finite(draws.triangles) && draws.triangles >= 0)) mark(row, 'rendererDead')
    drawRange.callsMin = Math.min(drawRange.callsMin, draws.calls); drawRange.callsMax = Math.max(drawRange.callsMax, draws.calls)
    drawRange.trianglesMin = Math.min(drawRange.trianglesMin, draws.triangles); drawRange.trianglesMax = Math.max(drawRange.trianglesMax, draws.triangles)
    if (draws.contextLost !== false) mark(row, 'contextLost')
    if (draws.contextLost == null) probeAbsent(row, 'canvas WebGL context', 'isContextLost unreadable in the sampler')
    if (draws.backend == null) probeAbsent(row, 'renderer.backend', 'WEBGL_debug_renderer_info unavailable')
    if (!(typeof draws.vendor === 'string' && draws.vendor.trim() && typeof draws.debugRenderer === 'string' && draws.debugRenderer.trim()))
      probeAbsent(row, 'renderer debug identity', 'nonempty actual vendor and renderer strings required')
    if (!(finite(draws.actualDrawingBuffer?.width) && draws.actualDrawingBuffer.width > 0
      && finite(draws.actualDrawingBuffer?.height) && draws.actualDrawingBuffer.height > 0
      && finite(draws.effectiveDpr) && draws.effectiveDpr > 0))
      probeAbsent(row, 'renderer buffer/DPR', 'positive actual drawing-buffer dimensions and effective DPR required')
    if (!finite(row.arcWeight)) mark(row, 'arcWeightMissing')
    else if (row.arcWeight > 0) {
      arcRows++
      if (!(finite(row.subjectTime) && row.subjectTime > 6.5 && row.subjectTime < 10.3)) mark(row, 'arcSubjectWindowMismatch')
      if (!inFrame(row.geometry?.discRect)) mark(row, 'discOutOfFrame')
      if (!inFrame(row.geometry?.contactRect)) mark(row, 'contactOutOfFrame')
      const contained = r => r && r.left >= 0 && r.top >= 0 && r.right <= row.domViewport.w && r.bottom <= row.domViewport.h
      if (!contained(row.discDom)) mark(row, 'discDomOverflow')
      if (!contained(row.contactDom)) mark(row, 'contactDomOverflow')
      if ((row.paint?.disc ?? []).some(x => x.paintsAboveCanvas || x.uncertainPaintOrder)) mark(row, 'paintOverDisc')
      if ((row.paint?.contact ?? []).some(x => x.paintsAboveCanvas || x.uncertainPaintOrder)) mark(row, 'paintOverContact')
    }
    const mappable = finite(row.progress) && finite(row.y) && finite(row.targetY) && finite(row.scrollMax) && row.scrollMax > 0
    if (!mappable) mark(row, 'notFinite')
    else {
      // Mapped input: progress must match the applied scroll within the existing 1e-9
      // mapping tolerance plus at most one commanded scroll step of pipeline lag (the
      // step is derived from the recorded input witness, never a new fixed tolerance).
      const step = prev && finite(prev.targetY) ? Math.abs(row.targetY - prev.targetY) / row.scrollMax : 0
      if (Math.abs(row.progress - row.y / row.scrollMax) > step + TOL.progress) mark(row, 'unmappedInput')
    }
    if (prev && !(finite(row.frames) && row.frames > prev.frames)) mark(row, 'frameIdNotAdvancing')
    const scheduled = row.scheduledCutterVisible
    if (scheduled === true) {
      cutterPresentRows++
      if (!(finite(row.subjectTime) && row.subjectTime > 2 && row.subjectTime < 15)) mark(row, 'cutterWindowMismatch')
      const g = row.geometry
      if (!g || g.visible !== true) mark(row, 'cutterHidden')
      if (g) {
        if (!(g.vertices > 0 && g.triangles > 0 && rectValid(g.rect) && rectValid(g.discRect))) mark(row, 'cutterInvisible')
        if (!(finite(g.cameraClearance) && finite(g.near) && g.near > 0 && g.cameraClearance >= g.near)) mark(row, 'clearanceAtOrBelowNear')
        if (!(finite(g.studyClearanceLowerBound) && g.studyClearanceLowerBound > g.near && g.visibleMeshes > 0)) mark(row, 'studyClearanceAtOrBelowNear')
        if (!(g.contactVertices > 0 && rectValid(g.contactRect))) mark(row, 'missingWitnesses')
        if (!(Array.isArray(g.discBounds) && g.discBounds.length === 2 && g.discBounds.every(b => vector(b, 3)))) mark(row, 'discBoundsMissing')
        if (!(typeof g.contactMethod === 'string' && g.contactMethod.length > 0)) mark(row, 'contactMethodMissing')
      }
    } else if (scheduled !== false) probeAbsent(row, 'telemetry.shaft.cutter.visible', 'runtime cutter schedule visibility unavailable')
    if (scheduled === true && finite(row.arcWeight) && row.arcWeight <= 0) {
      for (const region of ['disc', 'contact']) {
        const flag = (row.paint?.[region] ?? []).find(x => x.paintsAboveCanvas || x.uncertainPaintOrder)
        if (flag && unverified.length < 40) unverified.push({ t: Math.round(row.t), phase: row.phase,
          frames: row.frames, progress: row.progress, probe: 'paint order over ' + region + ' region',
          detail: 'active cutter outside the camera arc: paintsAboveCanvas=' + flag.paintsAboveCanvas
            + ', uncertainPaintOrder=' + flag.uncertainPaintOrder + ', overlap ' + flag.selector
            + ' — UNVERIFIED active ambiguity, actual occlusion not claimed and not refuted' })
      }
    }
    if (scheduled !== true && row.geometry && (row.geometry.visibleMeshes === 0 || !finite(row.geometry.studyClearanceLowerBound))
      && retained.length < 40) {
      retained.push({ t: Math.round(row.t), phase: row.phase, frames: row.frames, progress: row.progress,
        kind: 'studyTransition', detail: 'cutter not scheduled: visibleMeshes=' + row.geometry.visibleMeshes
          + ', studyClearanceLowerBound=' + row.geometry.studyClearanceLowerBound
          + ' — retained inactive/absent-study transition observation, not product, not clearance evidence' })
    }
  }
  return { frames: rows.length, violations, examples, unverified, retained, cutterPresentRows, arcRows, drawRange }
}

function gaps(rows, thresholdMs = 100) {
  const list = []
  for (let i = 1; i < rows.length; i++) {
    const dt = rows[i].t - rows[i - 1].t
    if (dt > thresholdMs) list.push({ phase: rows[i].phase, atMs: Math.round(rows[i - 1].t), dtMs: Math.round(dt),
      framesBefore: rows[i - 1].frames, framesAfter: rows[i].frames })
  }
  return list
}

function nonfiniteJSON(_key, value) { return typeof value === 'number' && !Number.isFinite(value) ? String(value) : value }

async function runCase(browser, args, provenance, viewport, tier) {
  const id = viewport + '-' + tier
  const result = { id, viewport: VIEWPORTS[viewport], requestedTier: tier, assertions: [], errors: [], requestFailures: [] }
  const c = (name, pass, actual) => result.assertions.push({ name, pass: Boolean(pass), actual })
  const context = await browser.newContext({ viewport: { width: VIEWPORTS[viewport].width, height: VIEWPORTS[viewport].height },
    deviceScaleFactor: VIEWPORTS[viewport].deviceScaleFactor, isMobile: VIEWPORTS[viewport].isMobile,
    hasTouch: VIEWPORTS[viewport].hasTouch, reducedMotion: 'no-preference' })
  let timer
  try {
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror', error => result.errors.push(String(error)))
    page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()) })
    page.on('requestfailed', request => result.requestFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? null }))
    const work = async () => {
      const navigation = new URL(args.url)
      navigation.searchParams.set('quality', tier)
      await page.goto(navigation.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await waitReady(page)
      const entered = await seek(page, WINDOW.start)
      c('entry native scroll settles at inspection window start', entered.settle.pass, entered)
      await waitReady(page, true)
      const start = await observe(page)
      result.startObservation = start
      c('observed tier equals requested tier', start.tierFromDOM === tier && start.world?.sheet?.tier === tier,
        { requested: tier, tierFromDOM: start.tierFromDOM, installedSheetTier: start.world?.sheet?.tier })
      c('live rendered study ready at window start', start.mode === 'live' && start.world?.ready
        && start.world?.inspection?.ready && start.world?.sheet?.baked
        && start.narrative?.beatId?.startsWith('inspection-'), { mode: start.mode, narrative: start.narrative })
      const anchorSeek = await seek(page, HOLD_PROGRESS)
      c('anchor seek settles at canonical .815', anchorSeek.settle.pass, anchorSeek)
      const anchor = await sampleNow(page)
      const anchorReturn = await seek(page, WINDOW.start)
      c('anchor return native scroll settles at inspection window start', anchorReturn.settle.pass, anchorReturn)
      result.anchor = { seek: anchorSeek, observation: anchor, returnSeek: anchorReturn }
      const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
      const startY = Math.round(maxY * WINDOW.start), endY = Math.max(startY + 1, Math.round(maxY * WINDOW.end) - 1)
      const holdY = await page.evaluate(fraction => Math.round((document.documentElement.scrollHeight - innerHeight) * fraction), HOLD_PROGRESS)
      result.window = { canonical: WINDOW, maxY, startY, endY, holdProgress: HOLD_PROGRESS, holdY, traverseFrames: TRAVERSE_FRAMES }
      const forward = await recordPhase(page, { phase: 'forward', fromY: startY, toY: endY, frames: TRAVERSE_FRAMES })
      const forwardExit = await seek(page, WINDOW.end - 1 / Math.max(2, maxY))
      c('forward exit native scroll settles inside window', forwardExit.settle.pass && forwardExit.y <= endY, forwardExit)
      const reverse = await recordPhase(page, { phase: 'reverse', fromY: endY, toY: startY, frames: TRAVERSE_FRAMES })
      const reverseExit = await seek(page, WINDOW.start)
      c('reverse exit native scroll settles at window start', reverseExit.settle.pass, reverseExit)
      const holdSeek = await seek(page, HOLD_PROGRESS)
      c('hold seek settles at canonical .815', holdSeek.settle.pass, holdSeek)
      const hold = await recordPhase(page, { phase: 'hold', fromY: holdY, toY: holdY, holdMs: TOL.holdMs })
      const baseline = hold.rows[0]
      const endpoint = poseDelta(anchor, baseline)
      c('post-traversal full pose at canonical .815 matches pre-traversal anchor', hold.rows.length > 0
        && equalPose(endpoint) && Math.abs(baseline.progress - anchor.progress) <= TOL.progress, endpoint)
      const drift = hold.rows.map(row => ({ t: Math.round(row.t), delta: poseDelta(baseline, row),
        progressDelta: Math.abs(row.progress - baseline.progress) }))
      c('hold: every presented frame within existing drift tolerances', drift.length > 0
        && drift.every(x => equalPose(x.delta) && x.progressDelta <= TOL.progress),
        { frames: drift.length, worst: drift.reduce((a, x) => {
            const rank = y => y.delta.cameraPositionMetres + y.delta.cameraAngleDegrees + y.delta.fovDegrees + y.delta.subjectTime
            return a === null || rank(x) > rank(a) ? x : a }, null) })
      c('hold: presentation frames continue during freeze', hold.after.frames > hold.before.frames + 5,
        { before: hold.before.frames, after: hold.after.frames })
      c('hold: recorder covered the full existing hold window', hold.rows.length > 0
        && hold.rows[hold.rows.length - 1].t >= TOL.holdMs, { lastRowMs: hold.rows.length ? hold.rows[hold.rows.length - 1].t : null })
      const phases = { forward, reverse, hold }
      result.audits = {}
      for (const name of Object.keys(phases)) {
        const phase = phases[name]
        const base = auditRows(phase.rows)
        const coverage = { rows: phase.rows.length, presentedFrames: phase.after.frames - phase.before.frames,
          hiddenFramesDelta: phase.after.hiddenFrames - phase.before.hiddenFrames,
          countMatchesPresentedFrames: phase.rows.length === phase.after.frames - phase.before.frames,
          recordedFirstFrame: phase.before.frames, recordedLastFrame: phase.after.frames,
          note: 'presentedFrames is the world.frames delta; rows must equal it and hiddenFramesDelta must be zero (gates). rows below presentedFrames means the sampler missed presented frames (rAF starvation or hidden tab)' }
        const audit = { ...base, coverage,
          gapsOver100ms: gaps(phase.rows),
          progressRange: { first: phase.rows[0]?.progress ?? null, last: phase.rows[phase.rows.length - 1]?.progress ?? null,
            min: Math.min(...phase.rows.map(r => r.progress)), max: Math.max(...phase.rows.map(r => r.progress)) },
          durationMs: phase.rows.length ? Math.round(phase.rows[phase.rows.length - 1].t) : 0 }
        result.audits[name] = audit
        c(name + ': whole-study gates pass on every row and scheduled cutter/arc gates pass where they apply',
          audit.frames > 0 && Object.values(audit.violations).every(x => x === 0) && audit.unverified.length === 0
            && coverage.countMatchesPresentedFrames && coverage.hiddenFramesDelta === 0,
          { violations: audit.violations, examples: audit.examples, unverified: audit.unverified,
            retained: audit.retained, coverage })
      }
      result.effectiveEnvironment = { requestedTier: tier, tierFromDOM: start.tierFromDOM, sheetTier: start.world?.sheet?.tier,
        effectiveDpr: start.world?.renderer?.effectiveDpr ?? null, drawingBuffer: start.world?.renderer?.drawingBuffer ?? null,
        rendererClassification: start.renderer.classification, backend: start.renderer.backend,
        launch: describeLaunch(), note: 'tier equality is gated; software GL is recorded and never treated as hardware evidence' }
      writeFileSync(path.join(args.out, id + '-frames.json'),
        JSON.stringify({ id, window: result.window, phases }, nonfiniteJSON) + String.fromCharCode(10), { flag: 'wx' })
    }
    await Promise.race([work(), new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Case watchdog: 240000ms')), 240000) })])
  } catch (error) {
    result.exception = String(error?.stack ?? error)
    c('case completes without exception', false, result.exception)
  } finally {
    clearTimeout(timer)
    await context.close()
  }
  c('no console/page/request errors', result.errors.length === 0 && result.requestFailures.length === 0,
    { errors: result.errors, requestFailures: result.requestFailures })
  result.pass = result.assertions.length > 0 && result.assertions.every(x => x.pass)
  result.failed = result.assertions.filter(x => !x.pass).map(x => x.name)
  console.log(id + ': ' + (result.pass ? 'PASS' : 'FAIL') + ' (' + (result.assertions.length - result.failed.length) + '/' + result.assertions.length + ' assertions)')
  return result
}

async function main() {
  let args
  try { args = parseArgs() }
  catch (error) { console.error('USAGE: ' + error.message); process.exitCode = 2; return }
  if (args.help) {
    console.log('node scripts/verify-torque-continuous-clearance.mjs --url=http://localhost:<port>/torque-wrench/ --out=<NEW evidence directory> --build-dir=<worktree .scratch production build> [--viewport=D|N|all] [--tier=full|lite|all]')
    console.log('Records every presented frame while native scroll drives the canonical inspection window [0.735,0.94) forward, reverse, and holds .815 for ' + TOL.holdMs + 'ms.')
    console.log('Whole-study gates on every row: finite mapped progress/input, strict frame-ID advancement, rows==world.frames delta, zero hiddenFrames delta, live renderer/context/draw, inspection beat and readiness. Cutter geometry/clearance/contact gates only where the runtime schedule has the cutter present (subjectTime 2..15 with fades); viewport/depth/DOM paint gates only where arcWeight>0 (camera arc subjectTime ~6.5..10.3). Endpoint full-pose equality is compared at active framed .815, not inactive .735.')
    console.log('Missing/non-finite evidence fails closed; unreadable probes are reported UNVERIFIED and the case cannot PASS. Inactive/absent-study transition rows are retained observations; active-cutter paint-order ambiguity outside the arc is UNVERIFIED with the exact overlap, never claimed as occlusion. Exact existing thresholds only (verify-torque-cutter.mjs TOL). Pacing and rAF gaps are reported observations, never gates. No browser is launched for --help.')
    console.log('NOT TESTED: G8 performance, mechanical parity, lifecycle, owner/Astra acceptance.')
    return
  }
  let playwright, provenance, served
  try {
    provenance = buildProvenance(args)
    playwright = await import('playwright')
    served = await verifyServed(playwright, args, provenance)
  } catch (error) { console.error('BLOCKED: ' + error.message); process.exitCode = 11; return }
  mkdirSync(path.dirname(args.out), { recursive: true })
  mkdirSync(args.out)
  const report = { task: 'JG-038 lane C continuous clearance recorder', startedAt: new Date().toISOString(),
    url: args.url, provenance, served, tolerances: TOL, launchConfiguration: launchConfig(),
    window: { canonical: WINDOW, holdProgress: HOLD_PROGRESS, traverseFrames: TRAVERSE_FRAMES,
      source: 'RuntimeWorld.tsx studyVisible gate; cutter canonical hold .815; endpoint full-pose anchor compare at .815' },
    scope: 'Continuous per-presented-frame clearance/framing record (revision 2). Whole-study liveness/mapping/count gates on every row; cutter geometry gates only on runtime-scheduled cutter-present rows (telemetry shaft cutter.visible, subjectTime 2..15 with fades); viewport/depth/DOM gates only where arcWeight>0 (subjectTime ~6.5..10.3); endpoint full-pose equality at active .815. Missing/non-finite evidence fails closed; unreadable probes are reported UNVERIFIED and cannot PASS; absent-study transition rows are retained observations and active-cutter paint ambiguity outside the arc is UNVERIFIED, never claimed as occlusion. No pacing or C1 tolerance exists; pacing and rAF gaps are recorded observations, never gates. No analytical continuous proof from sampled frames. G8 performance, mechanical parity, lifecycle and owner/Astra acceptance NOT TESTED.',
    cases: [] }
  let browser
  try {
    browser = await playwright.chromium.launch(launchConfig())
    report.browserVersion = browser.version()
    const viewports = args.viewport === 'all' ? ['D', 'N'] : [args.viewport]
    const tiers = args.tier === 'all' ? ['full', 'lite'] : [args.tier]
    for (const viewport of viewports) for (const tier of tiers) {
      report.cases.push(await runCase(browser, args, provenance, viewport, tier))
    }
    report.pass = report.cases.length > 0 && report.cases.every(c => c.pass)
    process.exitCode = report.pass ? 0 : 1
  } catch (error) {
    report.pass = false; report.environmentError = String(error?.stack ?? error); process.exitCode = 11
  } finally {
    if (browser) await browser.close().catch(error => { report.browserCloseError = String(error); report.pass = false; process.exitCode = 1 })
    report.finishedAt = new Date().toISOString()
    try {
      writeFileSync(path.join(args.out, 'report.json'), JSON.stringify(report, nonfiniteJSON, 2) + String.fromCharCode(10), { flag: 'wx' })
      console.log('Report: ' + path.join(args.out, 'report.json'))
    } catch (error) { console.error('REPORT WRITE FAILED: ' + error); process.exitCode = 12 }
  }
}

await main()
