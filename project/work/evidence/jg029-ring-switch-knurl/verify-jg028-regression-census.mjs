/**
 * JG-028 regression census probe (throwaway, never committed).
 *
 * Runs identically against two builds:
 *   - baseline: pre-JG-028 HEAD a76fc73 served on :4174
 *   - current:  JG-028 working tree served on :4173
 * and captures, per build:
 *   1. Full consolidated-scene census: every mesh in rig.meshes → parent group,
 *      material signature (type/color/roughness/metalness/clearcoat/emissive/
 *      envMapIntensity/transparent/opacity), vertex count, local bbox.
 *   2. Full window.__telemetry snapshot at 8 scroll stops (drawing 0.10, lift
 *      0.22, hero 0.35, explode 0.50/0.518, cross-fade 0.555, enclosure 0.64,
 *      cloud 0.90).
 *   3. Screenshots at 0.10 / 0.35 / 0.50 for cross-build pixel diff.
 *   4. Console/page errors throughout.
 *
 * Usage: MODE=capture BASE_URL=http://localhost:4173 OUT=.scratch/jg028-regression/current node <this file>
 *        MODE=pixeldiff A=<png> B=<png> OUT=<json> node <this file>
 */
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'
)

const MODE = process.env.MODE || 'capture'

const STOPS = [0.1, 0.22, 0.35, 0.5, 0.518, 0.555, 0.64, 0.9]
const SHOT_STOPS = new Set([0.1, 0.35, 0.5])

if (MODE === 'pixeldiff') {
  const [aPath, bPath, outPath] = [process.env.A, process.env.B, process.env.OUT]
  const toDataUrl = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64')
  const [aUrl, bUrl] = [toDataUrl(aPath), toDataUrl(bPath)]
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await (await browser.newContext()).newPage()
    const stats = await page.evaluate(
      async ([aUrl, bUrl]) => {
        const load = (url) =>
          new Promise((res, rej) => {
            const img = new Image()
            img.onload = () => res(img)
            img.onerror = rej
            img.src = url
          })
        const [a, b] = await Promise.all([load(aUrl), load(bUrl)])
        if (a.width !== b.width || a.height !== b.height) return { error: `size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}` }
        const w = a.width
        const h = a.height
        const cv = document.createElement('canvas')
        cv.width = w
        cv.height = h
        const ctx = cv.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(a, 0, 0)
        const da = ctx.getImageData(0, 0, w, h).data
        ctx.clearRect(0, 0, w, h)
        ctx.drawImage(b, 0, 0)
        const db = ctx.getImageData(0, 0, w, h).data
        let changed = 0
        let maxDelta = 0
        let sumAbs = 0
        let minX = w
        let minY = h
        let maxX = -1
        let maxY = -1
        const GX = 24
        const GY = 14
        const grid = new Array(GX * GY).fill(0)
        const cw = w / GX
        const ch = h / GY
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const i = (y * w + x) * 4
            const d = Math.max(
              Math.abs(da[i] - db[i]),
              Math.abs(da[i + 1] - db[i + 1]),
              Math.abs(da[i + 2] - db[i + 2])
            )
            if (d > 0) {
              sumAbs += d
              if (d > maxDelta) maxDelta = d
              if (d > 8) {
                changed += 1
                grid[Math.floor(y / ch) * GX + Math.floor(x / cw)] += 1
                if (x < minX) minX = x
                if (y < minY) minY = y
                if (x > maxX) maxX = x
                if (y > maxY) maxY = y
              }
            }
          }
        }
        const total = w * h
        const cell = Math.ceil(cw) * Math.ceil(ch)
        return {
          width: w,
          height: h,
          changedPxOver8: changed,
          changedFrac: +(changed / total).toFixed(6),
          meanAbsDeltaWhereAny: changed ? +(sumAbs / total).toFixed(4) : 0,
          maxDelta,
          changedRegion: maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null,
          grid: grid.map((n) => +(n / cell).toFixed(2)),
        }
      },
      [aUrl, bUrl]
    )
    fs.writeFileSync(outPath, JSON.stringify(stats, null, 2))
    console.log(JSON.stringify(stats, null, 1))
  } finally {
    await browser.close()
  }
  process.exit(0)
}

// ---- capture mode ----
const BASE_URL = process.env.BASE_URL
const OUT = process.env.OUT
fs.mkdirSync(OUT, { recursive: true })
const report = { baseUrl: BASE_URL, startedAt: new Date().toISOString(), pageErrors: [] }

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
})

try {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('pageerror', (err) => report.pageErrors.push('pageerror: ' + String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.pageErrors.push('console.error: ' + msg.text())
  })

  await page.goto(BASE_URL + '/?chapter=0', { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () => Boolean(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady),
    null,
    { timeout: 60000 }
  )
  await page.waitForTimeout(2000)

  const census = () =>
    page.evaluate(() => {
      const rig = window.__rig
      if (!rig) return { error: 'window.__rig missing' }
      const sig = (mat) => ({
        type: mat.type,
        color: mat.color ? '#' + mat.color.getHexString() : null,
        roughness: mat.roughness ?? null,
        metalness: mat.metalness ?? null,
        clearcoat: mat.clearcoat ?? null,
        emissive: mat.emissive ? '#' + mat.emissive.getHexString() : null,
        emissiveIntensity: mat.emissiveIntensity ?? null,
        envMapIntensity: mat.envMapIntensity ?? null,
        transparent: mat.transparent ?? false,
        opacity: mat.opacity ?? null,
        normalMapRepeat: mat.normalMap ? [mat.normalMap.repeat.x, mat.normalMap.repeat.y] : null,
        normalScale: mat.normalScale ? [mat.normalScale.x, mat.normalScale.y] : null,
      })
      const meshes = rig.meshes.map((m) => {
        const g = m.geometry
        g.computeBoundingBox()
        const bb = g.boundingBox
        return {
          parent: m.parent ? m.parent.name : null,
          name: m.name || null,
          mat: sig(Array.isArray(m.material) ? { type: 'array', color: null } : m.material),
          verts: g.attributes.position ? g.attributes.position.count : 0,
          uvs: g.attributes.uv ? g.attributes.uv.count : 0,
          bbox: bb
            ? [
                +(bb.max.x - bb.min.x).toFixed(4),
                +(bb.max.y - bb.min.y).toFixed(4),
                +(bb.max.z - bb.min.z).toFixed(4),
              ]
            : null,
        }
      })
      const handleMeshes = []
      if (rig.handleRoot)
        rig.handleRoot.traverse((o) => {
          if (o.isMesh && o.material && !Array.isArray(o.material))
            handleMeshes.push({ name: o.name || null, parent: o.parent?.name ?? null, mat: sig(o.material) })
        })
      return {
        meshCount: rig.meshes.length,
        ghostMaterialCount: rig.ghostMaterials.size,
        handleMeshCount: handleMeshes.length,
        lcdClusterPresent: Boolean(rig.lcdCluster),
        meshes,
        handleMeshes,
      }
    })

  report.censusAtRest = await census()

  for (const p of STOPS) {
    await page.evaluate((prog) => {
      window.__scrollCommitDisabled = true
      return window.__drawingProof.scrollToProgress(prog)
    }, p)
    const tele = await page.evaluate(async (prog) => {
      const t = window.__telemetry
      const snap = () => [t.camera.x, t.camera.y, t.camera.z, t.camera.fov, t.rig.explodeFactor, t.rig.ghostOpacity]
      let previous = snap()
      let quiet = 0
      const start = performance.now()
      while (performance.now() - start < 9000 && quiet < 10) {
        await new Promise((resolve) => requestAnimationFrame(() => resolve()))
        const current = snap()
        let delta = 0
        for (let i = 0; i < current.length; i += 1) delta = Math.max(delta, Math.abs(current[i] - previous[i]))
        previous = current
        quiet = delta <= 1e-7 ? quiet + 1 : 0
      }
      return { requested: prog, reached: t.scroll.progress, telemetry: JSON.parse(JSON.stringify(window.__telemetry)) }
    }, p)
    report['stop_' + p] = tele
    if (SHOT_STOPS.has(p)) {
      await page.screenshot({ path: path.join(OUT, `shot-${String(p).replace('.', '_')}.png`) })
    }
  }

  report.censusAtEnd = await census()
  fs.writeFileSync(path.join(OUT, 'census.json'), JSON.stringify(report, null, 1))
  console.log(`captured ${BASE_URL} → ${OUT}; meshes=${report.censusAtRest.meshCount} errors=${report.pageErrors.length}`)
} finally {
  await browser.close()
}
