// JG-035 S3 diagnosis: change ONE factor at a time on the live input-shaft meshes and capture the same
// frame, to find what produces the body artifacts the owner marked at 1.3 / 10.9 / 25.4 s.
//   node scripts/diag-shaft-artifacts.mjs --url=http://localhost:4173 --out=<dir> [--times=1.3,10.9,25.4] [--variants=base,flat,recompute,rough] [--viewport=1440x900]
// Proof-only: edits live materials/geometry in the page, never the app source or assets.
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'
import fs from 'node:fs'
import path from 'node:path'

const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const url = arg('url') ?? 'http://localhost:4173'
const out = path.resolve(arg('out') ?? 'diag-out')
const times = (arg('times') ?? '1.3,10.9,25.4').split(',').map(Number)
const [vw, vh] = (arg('viewport') ?? '1440x900').split('x').map(Number)
const variants = (arg('variants') ?? 'base,flat,recompute,rough').split(',')
fs.mkdirSync(out, { recursive: true })
const report = { url, launch: describeLaunch(), times, variants, shots: [], findings: [] }
const browser = await launchBrowser(chromium)
const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 })).newPage()
await page.goto(`${url}/?chapter=1&inspectionProof=1&qualityLock=1`, { waitUntil: 'domcontentloaded' })
const trigger = page.getByRole('button', { name: 'Inspect the input shaft' })
await trigger.waitFor({ state: 'visible', timeout: 240000 })
await page.waitForFunction(() => window.__rig && window.__threeRenderer && window.__telemetry?.performance?.warmReady, null, { timeout: 240000 })
await page.waitForTimeout(1500)
await trigger.click({ timeout: 240000 })
await page.getByRole('dialog').waitFor({ timeout: 240000 })
await page.waitForFunction(() => ['ready', 'error'].includes(window.__inspection?.status), null, { timeout: 240000 })
await page.waitForTimeout(12000) // let the entry camera ease finish under software GL
const seek = async t => {
  await page.locator('#inspection-seek').evaluate((e, value) => {
    e.step = 'any'
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, String(value))
    e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }))
  }, t)
  await page.waitForFunction(time => { const p = window.__inspection; return Math.abs((p.sampledTime ?? p.time) - time) < 1e-6 && Math.abs((p.cameraSampleTime ?? time) - time) < 1e-6 }, t, { timeout: 120000 })
  await page.evaluate(n => new Promise(resolve => { let k = 0; const tick = () => (++k >= n ? resolve() : requestAnimationFrame(tick)); requestAnimationFrame(tick) }), 6)
}
const apply = variant => page.evaluate(variant => {
  const meshes = []
  window.__threeScene.traverse(o => { if (o.isMesh && /shaft/i.test(o.name) && !/housing|bearing|ring/i.test(o.name) && o.visible) meshes.push(o) })
  window.__diag ??= { saved: new Map() }
  for (const mesh of meshes) {
    const saved = window.__diag.saved.get(mesh) ?? { flat: mesh.material.flatShading, rough: mesh.material.roughness, metal: mesh.material.metalness, env: mesh.material.envMapIntensity, normal: mesh.geometry.getAttribute('normal').array.slice() }
    window.__diag.saved.set(mesh, saved)
    // restore, then apply exactly one factor
    mesh.material.flatShading = saved.flat; mesh.material.roughness = saved.rough; mesh.material.metalness = saved.metal; mesh.material.envMapIntensity = saved.env
    mesh.geometry.getAttribute('normal').array.set(saved.normal); mesh.geometry.getAttribute('normal').needsUpdate = true
    if (variant === 'flat') mesh.material.flatShading = true
    if (variant === 'rough') { mesh.material.roughness = 0.65; mesh.material.metalness = 0.2 }
    if (variant === 'recompute') { mesh.geometry.computeVertexNormals(); mesh.geometry.getAttribute('normal').needsUpdate = true }
    mesh.material.needsUpdate = true
  }
  return meshes.map(m => m.name)
}, variant)
for (const t of times) {
  await seek(t)
  for (const variant of variants) {
    const names = await apply(variant)
    await page.evaluate(n => new Promise(resolve => { let k = 0; const tick = () => (++k >= n ? resolve() : requestAnimationFrame(tick)); requestAnimationFrame(tick) }), 4)
    const file = path.join(out, `diag-${vw < 800 ? 'narrow-' : ''}${String(t).replace('.', 'p')}s-${variant}.png`)
    await page.screenshot({ path: file, timeout: 300000 })
    report.shots.push({ t, variant, file: path.basename(file), meshes: names })
  }
  await apply('base')
}
fs.writeFileSync(path.join(out, 'diag-report.json'), JSON.stringify(report, null, 2))
await browser.close()
console.log(JSON.stringify({ shots: report.shots.length }))
