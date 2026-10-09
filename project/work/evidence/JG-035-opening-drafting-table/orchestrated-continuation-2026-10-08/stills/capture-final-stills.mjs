// Final-build shaft visual-still capture. No source module import, so a built preview works.
// Usage: node capture-final-stills.mjs --url http://localhost:<port> --out <dir> [--quality-lock]
// Visual-only when --quality-lock is supplied: no tier, performance, acceptance, or G6 claim.
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

const args = process.argv.slice(2)
const argOf = name => {
  const prefix = '--' + name + '='
  const inline = args.find(value => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const i = args.indexOf('--' + name)
  return i >= 0 ? args[i + 1] : null
}
const urlText = argOf('url'), outText = argOf('out')
if (!urlText || !outText) throw new Error('usage: node capture-final-stills.mjs --url http://localhost:<port> --out <dir> [--quality-lock]')
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../../../../')
const out = path.isAbsolute(outText) ? outText : path.resolve(root, outText)
await fs.mkdir(out, { recursive: true })
const qualityLock = args.includes('--quality-lock')
const smoke = args.includes('--smoke')
const layouts = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
]
const publicationTargets = [
  ['cutter-exit', 8.4], ['material-attempts', 17], ['revised-blank', 25],
  ['hobbed', 32.4], ['cool-stress', 34.2], ['support-before', 35.8],
  ['support-after', 38.2], ['assembled-finale', 42.5],
]
const extraFosTargets = [['fos-4340', 19], ['fos-c300', 21.5]]
const selectedPublicationTargets = smoke ? publicationTargets.slice(0, 2) : publicationTargets
const selectedLayouts = smoke ? layouts.slice(0, 1) : layouts
const sha256 = value => createHash('sha256').update(value).digest('hex')
const provenanceFiles = [
  'src/scene/inspection/shaft/fosPresentation.ts',
  'src/scene/inspection/shaft/script.ts',
  'src/scene/inspection/shaft/camera.ts',
  'src/scene/inspection/shaft/progression.ts',
  'src/scene/inspection/shaft/shaftRuntime.ts',
  'src/components/ShaftStoryLayer.tsx',
  'src/components/StaticShaftStory.tsx',
  'public/fonts/AcFastReference.ttf',
  'public/drawing/jgun-sheet-v2.bin.gz',
  'dist/index.html',
]
const fileProvenance = {}
for (const relative of provenanceFiles) {
  try { fileProvenance[relative] = sha256(await fs.readFile(path.join(root, relative))) }
  catch { fileProvenance[relative] = null }
}
async function servedBundleProvenance() {
  const indexResponse = await fetch(urlText)
  if (!indexResponse.ok) throw new Error('served index fetch failed: ' + indexResponse.status)
  const indexBytes = Buffer.from(await indexResponse.arrayBuffer())
  const assetPattern = new RegExp('assets/[A-Za-z0-9_.-]+[.]js', 'g')
  const queue = [...new Set([...indexBytes.toString('utf8').matchAll(assetPattern)].map(match => match[0]))]
  const seen = new Set(queue)
  const assets = []
  while (queue.length) {
    const asset = queue.shift(), response = await fetch(new URL(asset, urlText))
    if (!response.ok) throw new Error('served asset fetch failed: ' + asset + ':' + response.status)
    const bytes = Buffer.from(await response.arrayBuffer()), text = bytes.toString('utf8')
    assets.push({ asset, sha256: sha256(bytes), bytes: bytes.length })
    for (const match of text.matchAll(assetPattern)) {
      if (!seen.has(match[0])) { seen.add(match[0]); queue.push(match[0]) }
    }
  }
  return { indexSha256: sha256(indexBytes), assets: assets.sort((a, b) => a.asset.localeCompare(b.asset)) }
}
const serverProvenance = await servedBundleProvenance()
const report = {
  schema: 'final-shaft-still-capture-v2', url: urlText, out, qualityLock,
  smoke,
  evidenceClass: qualityLock ? 'qualityLockVisualOnly' : 'normal-quality-candidate',
  started: new Date().toISOString(),
  gitHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  fileProvenance,
  serverProvenance,
  method: 'Real inspection entry, native exact seek, three distinct completed render stamps, camera/projection stability, composite canvas plus live FOS DOM. No camera/time override and no cache regeneration.',
  expected: { publicationRawCount: selectedPublicationTargets.length * (smoke ? 1 : 2), fosProofRawCount: smoke ? 0 : 4, sourceFormat: 'PNG', sourcePixels: { desktop: [1440, 900], narrow: [390, 844] }, publicationIds: selectedPublicationTargets.map(pair => pair[0]) },
  cases: [], failures: [],
}

async function settled(page, wanted, session, after = -1) {
  return page.evaluate(({ wanted, session, after }) => new Promise((resolve, reject) => {
    const begin = performance.now(); let previous = null, stable = 0
    function tick() {
      const v = window.__stillCapture, frame = v?.last, p = window.__inspection
      if (v?.errors?.length || p?.status === 'error' || p?.suspend === 'context' || !document.querySelector('canvas[data-engine]') || window.__threeRenderer?.getContext().isContextLost()) return reject(new Error('capture aborted: ' + JSON.stringify({ errors: v?.errors, status: p?.status, suspend: p?.suspend })))
      if (!p?.active || p.session !== session) return reject(new Error('inspection session changed'))
      if (frame && frame.frame > after && (!previous || frame.frame !== previous.frame) && (!previous || frame.sampleStamp !== previous.sampleStamp)) {
        const ready = frame.session === session && frame.status === 'ready' && frame.playing === false &&
          Math.abs(frame.sampledTime - wanted) < 1e-8 && Math.abs(frame.cameraSampleTime - wanted) < 1e-8 &&
          frame.sampleStamp === frame.cameraSampleStamp
        const same = previous && frame.camera.every((value, i) => Math.abs(value - previous.camera[i]) <= 1e-12) &&
          frame.projection.every((value, i) => Math.abs(value - previous.projection[i]) <= 1e-12)
        stable = ready ? (same ? stable + 1 : 1) : 0; previous = frame
        if (stable >= 3) return resolve(frame)
      }
      if (performance.now() - begin > 45000) return reject(new Error('completed renders did not settle: ' + JSON.stringify(frame)))
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }), { wanted, session, after })
}

function nonBackgroundBounds(bytes) {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('screenshot is not PNG')
  let width, height, channels
  const chunks = []
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8)
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0), height = data.readUInt32BE(4)
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0
      if (data[8] !== 8 || !channels || data[10] || data[11] || data[12]) throw new Error('unsupported screenshot PNG layout')
    }
    if (type === 'IDAT') chunks.push(data)
    offset += length + 12
    if (type === 'IEND') break
  }
  if (!width || !height || !channels) throw new Error('screenshot PNG has no supported IHDR')
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * channels
  if (raw.length !== height * (stride + 1)) throw new Error('unexpected screenshot PNG scanline length')
  const pixels = Buffer.alloc(height * stride)
  const paeth = (a, b, c) => {
    const value = a + b - c, da = Math.abs(value - a), db = Math.abs(value - b), dc = Math.abs(value - c)
    return da <= db && da <= dc ? a : db <= dc ? b : c
  }
  let minX = width, minY = height, maxX = -1, maxY = -1, count = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    if (filter > 4) throw new Error('unknown screenshot PNG filter ' + filter)
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, left = x >= channels ? pixels[i - channels] : 0
      const up = y ? pixels[i - stride] : 0, upperLeft = y && x >= channels ? pixels[i - stride - channels] : 0
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, upperLeft)][filter]
      pixels[i] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255
    }
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const luminance = Math.round(pixels[i] * .299 + pixels[i + 1] * .587 + pixels[i + 2] * .114)
      if (luminance > 22) {
        count++
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (count === 0) throw new Error('empty source render')
  return { bounds: [minX, minY, maxX + 1, maxY + 1], nonBackgroundPixels: count, nonBackgroundFraction: count / (width * height) }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: [
  '--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
] })
try {
  for (const layout of selectedLayouts) {
    const result = { name: layout.name, viewport: [layout.width, layout.height], shots: [], fosProofs: [], requests: [], errors: [] }
    report.cases.push(result)
    const context = await browser.newContext({ viewport: { width: layout.width, height: layout.height }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
    const page = await context.newPage()
    page.on('pageerror', error => result.errors.push(error.message))
    page.on('request', request => { if (/\.glb(?:\?|$)/.test(request.url())) result.requests.push(request.url()) })
    try {
      const target = new URL(urlText); target.searchParams.set('chapter', '1'); target.searchParams.set('inspectionProof', '1')
      if (qualityLock) target.searchParams.set('qualityLock', '1')
      await page.goto(target.href, { waitUntil: 'domcontentloaded' })
      const trigger = page.getByRole('button', { name: 'Inspect the input shaft' })
      await trigger.waitFor({ timeout: 90000 })
      await page.waitForFunction(() => window.__rig && window.__threeRenderer && window.__telemetry?.performance?.warmReady, null, { timeout: 60000 })
      await page.evaluate(() => {
        const v = window.__stillCapture = { frames: 0, last: null, errors: [] }
        document.querySelector('canvas[data-engine]').addEventListener('webglcontextlost', () => v.errors.push('contextlost'))
        const renderer = window.__threeRenderer, original = renderer.render
        renderer.render = function(scene, camera, ...rest) {
          const value = original.call(this, scene, camera, ...rest)
          if (scene === window.__threeScene) {
            const frame = ++v.frames
            queueMicrotask(() => {
              const p = window.__inspection
              v.last = { frame, session: p.session, status: p.status, playing: p.playing, sampledTime: p.sampledTime, cameraSampleTime: p.cameraSampleTime, sampleStamp: p.sampleStamp, cameraSampleStamp: p.cameraSampleStamp, camera: [...camera.matrixWorld.elements], projection: [...camera.projectionMatrix.elements] }
            })
          }
          return value
        }
      })
      await trigger.click()
      await page.waitForFunction(() => window.__inspection?.status === 'ready', null, { timeout: 90000 })
      const session = await page.evaluate(() => window.__inspection.session)
      await page.waitForTimeout(1300)
      const seek = async time => page.locator('#inspection-seek').evaluate((node, time) => {
        const step = node.getAttribute('step'); node.step = 'any'
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, String(time))
        node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true }))
        if (step === null) node.removeAttribute('step'); else node.setAttribute('step', step)
      }, time)
      const prepareComposite = () => page.evaluate(() => {
        const canvas = document.querySelector('canvas[data-engine]')
        const overlays = [...document.querySelectorAll('[data-shaft-fos-model], [data-shaft-fos-bar]')]
        const metadata = overlays.map(node => ({ kind: node.dataset.shaftFosKind ?? null, opacity: getComputedStyle(node).opacity, text: (node.textContent ?? '').replace(/\s+/g, ' ').trim(), rect: node.getBoundingClientRect().toJSON() }))
        const keep = new Set([canvas])
        for (let parent = canvas; parent; parent = parent.parentElement) keep.add(parent)
        for (const node of overlays) for (let parent = node; parent; parent = parent.parentElement) keep.add(parent)
        for (const node of overlays) {
          keep.add(node)
          for (const descendant of node.querySelectorAll('*')) keep.add(descendant)
        }
        window.__stillHidden = []
        for (const node of document.body.querySelectorAll('*')) {
          if (!(node instanceof HTMLElement) || keep.has(node)) continue
          window.__stillHidden.push([node, node.style.visibility]); node.style.visibility = 'hidden'
        }
        return { overlays: metadata, hiddenCount: window.__stillHidden.length }
      })
      const restoreComposite = () => page.evaluate(() => { for (const [node, value] of window.__stillHidden ?? []) node.style.visibility = value; window.__stillHidden = [] })
      const capture = async (destination, id, time) => {
        await seek(time)
        const initial = await settled(page, time, session)
        const composite = await prepareComposite()
        let before, after, bytes, file, visibility
        try {
          before = await settled(page, time, session)
          file = layout.name + '-' + id + '.png'
          bytes = await page.screenshot({ path: path.join(out, file), animations: 'disabled' })
          visibility = nonBackgroundBounds(bytes)
          if (!visibility.nonBackgroundPixels) throw new Error(id + ': empty source render')
          after = await settled(page, time, session, before.frame)
        } finally { await restoreComposite() }
        const cameraDrift = Math.max(...before.camera.map((value, i) => Math.abs(value - after.camera[i])))
        const projectionDrift = Math.max(...before.projection.map((value, i) => Math.abs(value - after.projection[i])))
        if (cameraDrift > 1e-12 || projectionDrift > 1e-12) throw new Error(id + ': camera/projection drift')
        destination.push({ id, time, file, format: 'PNG', pixels: [layout.width, layout.height], sha256: sha256(bytes), bytes: bytes.length, nonBackgroundPass: true, visibility, cameraDrift, projectionDrift, overlay: composite.overlays, hiddenCount: composite.hiddenCount, frame: after.frame, session: after.session, sampleStamp: after.sampleStamp, camera: after.camera, projection: after.projection })
        await fs.writeFile(path.join(out, 'capture-report.json'), JSON.stringify(report, null, 2))
      }
      for (const [id, time] of selectedPublicationTargets) await capture(result.shots, id, time)
      if (!smoke) for (const [id, time] of extraFosTargets) await capture(result.fosProofs, id, time)
      const first = result.shots.find(shot => shot.id === 'support-before'), second = result.shots.find(shot => shot.id === 'support-after')
      if (first && second) {
        const cameraDelta = Math.max(...first.camera.map((value, i) => Math.abs(value - second.camera[i])))
        const projectionDelta = Math.max(...second.projection.map((value, i) => Math.abs(value - first.projection[i])))
        result.supportPair = { session, cameraDelta, projectionDelta }
        if (cameraDelta > 1e-12 || projectionDelta > 1e-12) throw new Error("support pair camera mismatch")
      }
      if (result.errors.length) throw new Error(result.errors.join('; '))
      result.pass = result.shots.length === selectedPublicationTargets.length && result.fosProofs.length === (smoke ? 0 : 2)
    } catch (error) {
      result.errors.push(error.message); report.failures.push(layout.name + ': ' + error.message); result.pass = false
      result.diagnostics = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, inspection: window.__inspection ?? null, renderer: !!window.__threeRenderer, rig: !!window.__rig })).catch(() => null)
    } finally { await context.close() }
    if (!result.pass) break
  }
} finally {
  await browser.close(); report.completed = new Date().toISOString()
  await fs.writeFile(path.join(out, 'capture-report.json'), JSON.stringify(report, null, 2))
}
console.log(JSON.stringify({ report: path.join(out, 'capture-report.json'), qualityLock, failures: report.failures, cases: report.cases.map(item => ({ name: item.name, pass: item.pass, shots: item.shots.length, fosProofs: item.fosProofs.length, errors: item.errors })) }, null, 2))
if (report.failures.length || report.cases.some(item => !item.pass)) process.exitCode = 1
