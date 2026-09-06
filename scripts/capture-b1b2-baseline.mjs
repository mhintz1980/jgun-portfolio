import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { chromium } from 'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'

const root = process.cwd()
const out = path.join(root, 'project/work/evidence/b1-b2-rebuild/baseline')
fs.mkdirSync(out, { recursive: true })
const save = (name, data) => fs.writeFileSync(path.join(out, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n')
if (process.argv.includes('--main-bundle-only')) {
  const assets = 'C:/Users/Markimus/.buzz/.scratch/b1-b2-main-baseline/dist/assets'
  const entries = fs.readdirSync(assets).map(name => {
    const data = fs.readFileSync(path.join(assets, name))
    return { name, bytes: data.length, gzipBytes: gzipSync(data).length }
  }).sort((a, b) => a.name.localeCompare(b.name))
  save('main-bundle.json', entries)
  const failed = JSON.parse(fs.readFileSync(path.join(out, 'failed-bundle.json'), 'utf8'))
  const totals = values => ({ allAssetBytes: values.reduce((s,v) => s + v.bytes, 0), jsBytes: values.filter(v => v.name.endsWith('.js')).reduce((s,v) => s + v.bytes, 0), appJsBytes: values.filter(v => v.name.endsWith('.js') && !v.name.startsWith('draco_')).reduce((s,v) => s + v.bytes, 0), cssBytes: values.filter(v => v.name.endsWith('.css')).reduce((s,v) => s + v.bytes, 0) })
  const mainTotals = totals(entries), failedTotals = totals(failed)
  save('bundle-comparison.json', { mainCommit: execFileSync('git',['rev-parse','main'],{encoding:'utf8'}).trim(), failedCommit: '5dfd0aad3a31d71d16bbd585e0878965f7091156', main: mainTotals, failed: failedTotals, failedMinusMain: Object.fromEntries(Object.keys(mainTotals).map(k => [k, failedTotals[k] - mainTotals[k]])) })
  console.log(JSON.stringify({ main: mainTotals, failed: failedTotals }, null, 2))
  process.exit(0)
}
const baselineCommit = execFileSync('git', ['rev-parse', '5dfd0aa'], { encoding: 'utf8' }).trim()
const sourceFiles = ['src/scene/CameraRig.tsx', 'src/scene/drawing/introTimeline.ts', 'src/data/caseStudies.ts', 'src/scene/stages/stageWindows.ts', 'src/scene/TorqueWrenchHero.tsx']
for (const file of sourceFiles) save(file.replaceAll('/', '__') + '.txt', execFileSync('git', ['show', `5dfd0aa:${file}`], { encoding: 'utf8' }))
save('main-versus-failed-boundary.diff', execFileSync('git', ['diff', 'main', '5dfd0aa', '--', ...sourceFiles], { encoding: 'utf8' }))
save('failed-bundle.json', fs.readdirSync('dist/assets').map(name => ({ name, bytes: fs.statSync(path.join('dist/assets', name)).size })).sort((a, b) => a.name.localeCompare(b.name)))

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] })
const all = { commit: baselineCommit, capturedAt: new Date().toISOString(), viewportRuns: [] }
for (const viewport of [{ width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
  const label = viewport.width === 1920 ? 'desktop' : 'mobile'
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', err => errors.push(String(err)))
  await page.goto('http://localhost:4173/?chapter=0', { waitUntil: 'networkidle' })
  await page.waitForTimeout(9000)
  await page.mouse.move(viewport.width / 2, viewport.height / 2)
  await page.evaluate(() => {
    window.__baselineFrameIntervals = []
    let previous = performance.now()
    const frame = now => { window.__baselineFrameIntervals.push(now - previous); previous = now; requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
  })
  const rows = []
  const capture = async (name, progress, screenshot = true) => {
    await page.evaluate(p => {
      const y = (document.documentElement.scrollHeight - innerHeight) * p
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo(0, y)
    }, progress)
    await page.waitForTimeout(2600)
    const data = await page.evaluate(() => ({ telemetry: window.__telemetry, camera: window.__threeCamera ? { position: window.__threeCamera.position.toArray(), quaternion: window.__threeCamera.quaternion.toArray(), fov: window.__threeCamera.fov } : null, canvas: !!document.querySelector('canvas'), scroll: { y: scrollY, max: document.documentElement.scrollHeight - innerHeight }, rig: window.__rig ? { bearingZ: window.__rig.bearing?.position.z } : null }))
    rows.push({ name, requestedProgress: progress, ...data })
    if (screenshot) await page.screenshot({ path: path.join(out, `${label}-${name}.png`) })
    console.log(`${label} ${name}: requested=${progress} actual=${data.telemetry?.scroll?.progress} canvas=${data.canvas} fov=${data.camera?.fov}`)
  }
  for (const p of [0, 0.2, 0.4, 0.85, 1]) await capture(`intro-${p.toFixed(2)}`, p * 0.12)
  for (const p of [0.10, 0.30, 0.50, 0.65, 0.80, 0.95]) await capture(`forward-${p.toFixed(2)}`, p)
  for (const p of [0.95, 0.80, 0.65, 0.50, 0.30, 0.10]) await capture(`reverse-${p.toFixed(2)}`, p, false)
  await capture('release-left', 0.1199, false)
  await capture('release-right', 0.1201, false)
  const runtime = await page.evaluate(() => {
    const values = window.__baselineFrameIntervals.slice(1).sort((a,b) => a-b)
    const gl = document.querySelector('canvas')?.getContext('webgl2')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    return { sampleCount: values.length, p95Ms: values[Math.floor(values.length * .95)], maxMs: values.at(-1), renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null, canvas: !!gl }
  })
  all.viewportRuns.push({ viewport, label, rows, runtime, errors })
  save('telemetry.json', all)
  await context.close()
}
await browser.close()
console.log(JSON.stringify(all.viewportRuns.map(r => ({ label: r.label, runtime: r.runtime, errors: r.errors })), null, 2))
