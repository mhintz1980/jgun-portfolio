import { chromium } from 'playwright'
import { launchBrowserMinimal } from './lib/browser-launch.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
const outArg = process.argv.find(arg => arg.startsWith('--out='))?.slice(6)
const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) ?? 'http://localhost:4173'
const out = path.resolve(outArg ?? 'project/work/evidence/JG-035-opening-drafting-table/blue-trace-tunnel-2026-10-03/drawing-review')
fs.mkdirSync(out, { recursive: true })
const browser = await launchBrowserMinimal(chromium)
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 150000 })
  await page.evaluate(() => window.__drawingProof.setProgress(0.44 * 0.12))
  await page.waitForFunction(() => {
    const c = window.__telemetry?.camera
    return window.__telemetry?.drawing?.phase === 0.44 && c &&
      Math.hypot(c.x - c.goal.position[0], c.y - c.goal.position[1], c.z - c.goal.position[2]) < 0.00001 &&
      Math.abs(c.fov - c.goal.fov) < 0.001
  }, null, { timeout: 60000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(out, 'drawing-callouts-cutaway.png') })
  const proof = await page.evaluate(() => {
    const materials = window.__rig?.meshes?.map(m => ({ name: m.name, color: m.material?.color?.getHexString(), roughness: m.material?.roughness, normal: m.material?.normalMap ? { repeat: m.material.normalMap.repeat.toArray(), scale: m.material.normalScale.toArray(), uvCount: m.geometry.getAttribute('uv')?.count } : null })) ?? []
    const textBounds = window.__drawingProof.captureTextBounds()
    return { stats: window.__sheetStats, drawing: window.__telemetry?.drawing, camera: window.__telemetry?.camera, materials, textBounds }
  })
  const container = gunzipSync(fs.readFileSync('public/drawing/jgun-sheet-v2.bin.gz'))
  const sidecar = JSON.parse(container.subarray(28, 28 + container.readUInt32LE(24)).toString('utf8'))
  const placement = { cacheVersion: container.readUInt32LE(8), marks: sidecar.marks,
    texts: sidecar.texts.filter(t => /OUTPUT SPINDLE|GEARBOX HOUSING|CLUTCH HOUSING|RING SWITCH|P000095|P000245|P000420|P003068/.test(t.text)) }
  fs.writeFileSync(path.join(out, 'proof.json'), JSON.stringify({ ...proof, placement, errors }, null, 2))
  if (errors.length) throw new Error(JSON.stringify({ errors }))
  if (!process.argv.includes('--drawing-only')) {
  const aperture = []
  for (const t of [0.79, 0.8405, 0.845, 0.88, 0.92]) {
    await page.evaluate(t => window.__drawingProof.setProgress(t * 0.12), t)
    await page.waitForFunction(t => Math.abs(window.__telemetry.drawing.phase - t) < 1e-8, t, { timeout: 60000 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(out, `opening-${t}.png`) })
    if (t > 0.84) aperture.push({ t, ...await page.evaluate(() => window.__drawingProof.capturePortalPixels()) })
  }
  const failures = aperture.flatMap(p => [
    ...(p.deskChangedInsidePixels !== 0 ? [`${p.t}: visible desk`] : []),
    ...(p.capChangedPixels !== 0 ? [`${p.t}: visible floor`] : []),
    ...(p.modelChangedPixels <= 0 ? [`${p.t}: model absent`] : []),
    ...(p.t >= 0.88 && p.wallChangedPixels <= 0 ? [`${p.t}: walls absent`] : []),
  ])
  fs.writeFileSync(path.join(out, 'aperture-proof.json'), JSON.stringify({ aperture, failures, errors, pass: !failures.length && !errors.length }, null, 2))
  if (failures.length || errors.length) throw new Error(JSON.stringify({ failures, errors }))
  }
  console.log(JSON.stringify({ out, errors, cutSegments: proof.stats?.airMotorCutSegments, materials: proof.materials.filter(m => m.normal) }))
} finally { await browser.close() }
