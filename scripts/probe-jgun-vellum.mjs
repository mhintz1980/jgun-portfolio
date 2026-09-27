// JG-035 diagnostics — vellum/paper/desk/model compositing A/B at one exact progress.
// One fresh GPU page per variant (a lost context must never masquerade as a still).
// Runtime mutations are diagnostic-only: material.visible=false (the frame loop resets
// mesh.visible every frame, but never touches material.visible, so the hide persists).
import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { inflateSync } from 'node:zlib'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=')
  return [key, value.join('=')]
}))
const url = args.url || 'http://localhost:5211'
const progress = Number(args.p || 0.072)
const width = Number(args.width || 1600)
const height = Number(args.height || 900)
const out = args.out || 'project/work/evidence/JG-035-opening-drafting-table/camera-pressure-2026-09-27/diagnostics'
if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error('Expected progress in [0,1]')
if (!Number.isFinite(width + height) || width <= 0 || height <= 0) throw new Error('Expected positive viewport')

const VARIANTS = [
  { id: 'baseline', hide: [] },
  { id: 'no-paper', hide: ['paper'] },
  { id: 'no-desk', hide: ['desk'] },
  // Paper + desk + all ink layers off: the model alone over the scene background.
  { id: 'clean-model', hide: ['paper', 'desk', 'lines', 'fills', 'text'] },
  // All model materials off: the paper + desk + ink composite alone.
  { id: 'no-model', hide: ['model'] },
]

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11', '--enable-gpu'] })
const results = []

/** Minimal PNG decode (RGBA8/RGB8, non-interlaced) — enough for Playwright screenshots. */
function decodePng(buffer) {
  let off = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idat = []
  while (off < buffer.length) {
    const len = buffer.readUInt32BE(off)
    const type = buffer.toString('ascii', off + 4, off + 8)
    const data = buffer.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2) || interlace) throw new Error(`Unsupported PNG ${bitDepth}/${colorType}/${interlace}`)
  const bpp = colorType === 6 ? 4 : 3
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * bpp
  const px = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null
    const cur = px.subarray(y * stride, (y + 1) * stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev ? prev[x] : 0
      const c = x >= bpp && prev ? prev[x - bpp] : 0
      let v = row[x]
      if (filter === 1) v = (v + a) & 255
      else if (filter === 2) v = (v + b) & 255
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
      cur[x] = v
    }
  }
  return { width: w, height: h, bpp, data: px }
}

function regionStats(png, region) {
  const x0 = Math.max(0, Math.floor(region.x)), x1 = Math.min(png.width, Math.ceil(region.x + region.w))
  const y0 = Math.max(0, Math.floor(region.y)), y1 = Math.min(png.height, Math.ceil(region.y + region.h))
  let n = 0, rSum = 0, gSum = 0, bSum = 0, dark = 0, cream = 0, cool = 0, bright = 0
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * png.width + x) * png.bpp
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2]
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    n++; rSum += r; gSum += g; bSum += b
    if (l < 0.08) dark++
    if (l > 0.75) bright++
    if (r > g && g > b && r - b > 15 && l > 0.45) cream++
    if (b >= r && l > 0.08 && l <= 0.75) cool++
  }
  if (!n) return { pixels: 0 }
  const f = (c) => +(c / n).toFixed(4)
  return { pixels: n, meanL: +((0.2126 * rSum + 0.7152 * gSum + 0.0722 * bSum) / n / 255).toFixed(4), meanRGB: [Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)], fracDark: f(dark), fracBright: f(bright), fracCream: f(cream), fracCool: f(cool) }
}

async function capture(variant) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors = []
  let contextLost = false
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (/context lost/i.test(message.text())) contextLost = true
  })
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 90000 })
    await page.evaluate((p) => window.__drawingProof.setProgress(p), progress)
    await page.waitForFunction((p) => {
      const t = window.__telemetry
      const c = t?.camera
      const g = c?.goal
      return !!document.querySelector('canvas') && Math.abs((t?.drawing?.phase ?? -1) - Math.min(p / 0.12, 1)) < 1e-5 &&
        g && Math.hypot(c.x - g.position[0], c.y - g.position[1], c.z - g.position[2]) < 1e-5 && Math.abs(c.fov - g.fov) < 1e-4
    }, progress, { timeout: 20000 })
    // Reading-lamp trails the look-at with a lag; let it converge before mutating.
    await page.waitForTimeout(700)

    const sceneDump = await page.evaluate(() => {
      const scene = window.__threeScene
      const describe = (o) => ({
        name: o.name || o.type, type: o.type, visible: o.visible, renderOrder: o.renderOrder, z: +o.position?.z?.toFixed(5),
        material: o.material ? { type: o.material.type, visible: o.material.visible, transparent: !!o.material.transparent, depthWrite: !!o.material.depthWrite, opacity: o.material.opacity, blending: o.material.blending } : undefined,
      })
      const group = scene.getObjectByName('engineering-drawing-plane-frame')
      const text = group?.children.find((c) => c.renderOrder === 3)
      const model = scene.getObjectByName('jgun-live-registered-model')
      const modelMats = new Set()
      let modelMeshes = 0
      model?.traverse((o) => { if (o.material) { modelMeshes++; modelMats.add(o.material) } })
      return {
        environmentIntensity: scene.environmentIntensity,
        groupVisible: group?.visible,
        drawing: [
          describe(scene.getObjectByName('drafting-desk')),
          describe(scene.getObjectByName('engineering-drawing-Z0')),
          describe(scene.getObjectByName('sheet-ink-lines')),
          describe(scene.getObjectByName('sheet-ink-fills')),
          text ? describe(text) : null,
        ],
        model: { visible: model?.visible, meshes: modelMeshes, uniqueMaterials: modelMats.size, materialTypes: [...modelMats].map((m) => m.type) },
      }
    })

    // Registration actuals -> the model footprint bbox in screen pixels.
    const footprint = await page.evaluate(() => {
      const reg = window.__drawingProof.captureRegistration()
      return reg.projectedFeatures.map((f) => ({ id: f.id, x: (f.actual[0] * 0.5 + 0.5) * window.innerWidth, y: (1 - (f.actual[1] * 0.5 + 0.5)) * window.innerHeight, err: f.errorPixels }))
    })

    if (variant.hide.length) {
      const applied = await page.evaluate((targets) => {
        const scene = window.__threeScene
        const group = scene.getObjectByName('engineering-drawing-plane-frame')
        const byName = {
          desk: scene.getObjectByName('drafting-desk'),
          paper: scene.getObjectByName('engineering-drawing-Z0'),
          lines: scene.getObjectByName('sheet-ink-lines'),
          fills: scene.getObjectByName('sheet-ink-fills'),
          text: group?.children.find((c) => c.renderOrder === 3),
        }
        const hidden = []
        for (const t of targets) {
          if (t === 'model') {
            const model = scene.getObjectByName('jgun-live-registered-model')
            const mats = new Set()
            model?.traverse((o) => { if (o.material) mats.add(o.material) })
            mats.forEach((m) => { m.visible = false })
            hidden.push(`model(${mats.size} materials)`)
          } else if (byName[t]?.material) {
            byName[t].material.visible = false
            hidden.push(t)
          } else hidden.push(`${t}:NOT_FOUND`)
        }
        return hidden
      }, variant.hide)
      // Two fresh frames so the hide survives a full render cycle.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      await page.waitForTimeout(150)
      if (applied.some((h) => h.endsWith('NOT_FOUND'))) errors.push(`hide failed: ${applied.join(',')}`)
    }

    const telemetry = await page.evaluate(() => ({
      drawing: JSON.parse(JSON.stringify(window.__telemetry.drawing)),
      camera: { fov: window.__telemetry.camera.fov, sheetDistance: window.__telemetry.camera.sheetDistance },
      sheetStats: JSON.parse(JSON.stringify(window.__sheetStats ?? {})),
    }))
    if (contextLost) throw new Error('WebGL context lost before capture')

    const file = `p${progress.toFixed(4)}-${variant.id}-${width}x${height}.png`
    await page.screenshot({ path: path.join(out, file) })
    return { variant: variant.id, file, errors, sceneDump, footprint, telemetry }
  } finally {
    await page.close()
  }
}

try {
  for (const variant of VARIANTS) {
    console.log(`capturing ${variant.id}...`)
    results.push(await capture(variant))
  }
} finally {
  await browser.close()
}

// Pixel metrics on a shared footprint frame: use the baseline page's feature bbox.
const base = results[0]
const xs = base.footprint.map((f) => f.x), ys = base.footprint.map((f) => f.y)
const pad = 24
const bbox = { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad }
const half = { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 }
const regions = {
  full: { x: 0, y: 0, w: width, h: height },
  footprint: bbox,
  footprintLeft: { x: bbox.x, y: bbox.y, w: bbox.w / 2, h: bbox.h },
  footprintRight: { x: half.x, y: bbox.y, w: bbox.w / 2, h: bbox.h },
  footprintTop: { x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h / 2 },
  footprintBottom: { x: bbox.x, y: half.y, w: bbox.w, h: bbox.h / 2 },
}

for (const r of results) {
  const png = decodePng(await readFile(path.join(out, r.file)))
  r.metrics = Object.fromEntries(Object.entries(regions).map(([name, region]) => [name, regionStats(png, region)]))
}

const report = {
  url, progress, viewport: { width, height }, footprintBBox: bbox,
  footprintFeatures: base.footprint,
  variants: results.map(({ variant, file, errors, sceneDump, telemetry, metrics }) => ({ variant, file, errors, sceneDump, telemetry, metrics })),
}
await writeFile(path.join(out, 'diagnostics.json'), JSON.stringify(report, null, 2))

console.log(`\nprogress=${progress}  t=${report.variants[0].telemetry.drawing.phase.toFixed(4)}  pbr=${report.variants[0].telemetry.drawing.pbr}`)
console.log(`footprint bbox: x=${Math.round(bbox.x)} y=${Math.round(bbox.y)} w=${Math.round(bbox.w)} h=${Math.round(bbox.h)}  (from ${base.footprint.length} registration features)`)
console.log(`environmentIntensity=${report.variants[0].sceneDump.environmentIntensity}`)
console.log('\nvariant         | region          | meanL | meanRGB      | dark  | cream | cool  | bright')
for (const v of report.variants) {
  for (const [name, s] of Object.entries(v.metrics)) {
    console.log(`${v.variant.padEnd(15)} | ${name.padEnd(15)} | ${s.meanL.toFixed(3).padEnd(5)} | ${s.meanRGB.join(',').padEnd(12)} | ${String(s.fracDark).padEnd(5)} | ${String(s.fracCream).padEnd(5)} | ${String(s.fracCool).padEnd(5)} | ${s.fracBright}`)
  }
}
const bad = results.filter((r) => r.errors.length)
console.log(bad.length ? `\nERRORS: ${bad.map((b) => `${b.variant}: ${b.errors.join(' | ')}`).join(' ;; ')}` : '\nno page errors')
