// One-page development probe: proves the progression-uniform capture mechanics used
// by scripts/verify-shaft-inspection.mjs S2 against the current dev-server source.
import { chromium } from 'playwright'
import { build } from 'esbuild'
import fs from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:5199'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto(url + '/?chapter=1&inspectionProof=1', { waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: 'Inspect the input shaft' }).waitFor({ timeout: 60000 })
await page.waitForFunction(() => window.__rig && window.__threeRenderer && window.__telemetry?.performance?.warmReady, null, { timeout: 60000 })
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent?.includes('Inspect the input shaft')); b.click() })
await page.getByRole('dialog').waitFor()
await page.waitForFunction(() => window.__inspection?.status === 'ready', null, { timeout: 60000 })
await page.waitForTimeout(1400)
const seek = async t => {
  await page.evaluate(v => {
    const e = document.querySelector('#inspection-seek')
    e.step = 'any'
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, String(v))
    e.dispatchEvent(new Event('input', { bubbles: true }))
    e.dispatchEvent(new Event('change', { bubbles: true }))
  }, t)
  // No verifier render hook here: wait for the sampled time to settle on the store,
  // then let a few rendered frames apply it before reading state.
  await page.waitForFunction(t => { const p = window.__inspection; return p?.sampledTime === t && p.sampleStamp === p.cameraSampleStamp }, t, { timeout: 30000 })
  await page.waitForTimeout(300)
}
await seek(4)
const wrapped = await page.evaluate(() => {
  const store = window.__shaftProgression = { legacy: null, approved: null }
  const root = window.__threeScene.getObjectByName('manufacturing-study-root')
  if (!root) return { error: 'no root' }
  let n = 0
  root.traverse(o => {
    if (!o.isMesh) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (typeof m.onBeforeCompile !== 'function' || m.__shaftWrapped) continue
      const orig = m.onBeforeCompile
      m.__shaftWrapped = true; n++
      m.onBeforeCompile = function (s, r) { const res = orig.call(this, s, r); try { const u = s.uniforms; if (u && u.uSpaceDepth) store[u.uShaftKind?.value === 1 ? 'approved' : 'legacy'] = { uniforms: u } } catch { } return res }
      m.customProgramCacheKey = () => 'jgun-shaft-progression-verify'
      m.needsUpdate = true
    }
  })
  return { wrapped: n }
})
let captureError = null
try { await page.waitForFunction(() => window.__shaftProgression?.legacy?.uniforms?.uSpaceDepth, null, { timeout: 30000 }) } catch (e) { captureError = String(e) }
await seek(5.5)
const data = await page.evaluate(() => ({
  uni: {
    depth: Array.from(window.__shaftProgression?.legacy?.uniforms?.uSpaceDepth?.value ?? []),
    engaged: window.__shaftProgression?.legacy?.uniforms?.uEngagedSpace?.value,
    prev: window.__shaftProgression?.legacy?.uniforms?.uEngagedPreviousDepth?.value,
    edgeY: window.__shaftProgression?.legacy?.uniforms?.uEdgeY?.value,
  },
  teeth: { formed: window.__inspection.shaft.teethFormed, partial: window.__inspection.shaft.teethPartial },
}))
const b = await build({ entryPoints: ['src/scene/inspection/shaft/kinematics.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const kin = await import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
const f = kin.createShaftKinematicsFrame()
kin.sampleShaftKinematics(5.5, f)
const st = { mode: 'none', spaceDepth: new Float32Array(10), engagedSpace: -1, engagedPreviousDepth: 0, edgeY: 0, hobYc: 0, hobA: 0, hobR: 0 }
kin.writeShaftProgression(f, st)
const out = { wrapped, data, model: { depths: Array.from(st.spaceDepth), engaged: st.engagedSpace, prev: st.engagedPreviousDepth, edgeY: st.edgeY, cutting: f.cutting }, captureError }
fs.writeFileSync(new URL('./probe-uniform-capture.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(JSON.stringify(out, null, 1))
await browser.close()
