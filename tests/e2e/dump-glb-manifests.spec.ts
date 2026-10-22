import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import type { GLBManifest } from '../../src/utils/glbSceneAuditor'

const MODELS = [
  { query: 'msp', modelPath: '/models/msp-enclosure.glb' },
  { query: 'm249', modelPath: '/models/m249-transformed.glb' },
] as const

const collected: Record<string, GLBManifest> = {}

async function openRig(page: Page, query: string, extra = '') {
  await page.goto(`/?debug=rig&model=${query}${extra}`)
  await page.waitForFunction(
    () =>
      window.__WEBGL_TELEMETRY__ !== undefined &&
      window.__GLB_MANIFESTS__ !== undefined &&
      Object.keys(window.__GLB_MANIFESTS__).length > 0,
    undefined,
    { timeout: 90_000 },
  )
}

test.describe.configure({ mode: 'serial' })

for (const { query, modelPath } of MODELS) {
  test(`extracts the ${modelPath} manifest and verifies rig telemetry`, async ({ page }) => {
    await openRig(page, query)

    const manifest = await page.evaluate((key) => window.__GLB_MANIFESTS__![key], modelPath)
    const telemetry = await page.evaluate(() => window.__WEBGL_TELEMETRY__!)

    expect(manifest.totalMeshes).toBeGreaterThan(0)
    expect(manifest.nodes).toHaveLength(manifest.totalMeshes)
    expect(manifest.nodes.every((n) => n.explodeVector.some((v) => v !== 0))).toBe(true)
    expect(telemetry.modelPath).toBe(modelPath)
    expect(telemetry.cameraFov).toBeGreaterThan(10)
    expect(telemetry.explodableMeshCount).toBe(manifest.totalMeshes)

    collected[modelPath] = manifest
  })
}

/** Resolves once the render loop has produced `frames` more frames. */
async function waitForFrames(page: Page, frames: number) {
  const start = await page.evaluate(() => window.__WEBGL_TELEMETRY__!.frameCount)
  await page.waitForFunction((target) => (window.__WEBGL_TELEMETRY__?.frameCount ?? 0) >= target, start + frames, {
    timeout: 60_000,
  })
}

async function gotoShot(page: Page, shot: 1 | 2 | 3 | 4, id: string) {
  await page.getByRole('button', { name: `Shot ${shot}` }).click()
  await page.waitForFunction((expected) => window.__WEBGL_TELEMETRY__?.activeShot === expected, id, {
    timeout: 60_000,
  })
  // Two more frames so the materials and plane have been written for this state.
  await waitForFrames(page, 2)
  return page.evaluate(() => window.__WEBGL_TELEMETRY__!)
}

test('studio scrub drives bullet-time clock, depthWrite guard, explosion and machining plane', async ({ page }) => {
  await openRig(page, 'msp')

  // Shot 1: housing opaque and depth-writing, real-time clock.
  let t = await gotoShot(page, 1, 'establishing')
  expect(t.splineProgress).toBe(0)
  expect(t.timeScale).toBe(1)
  expect(t.housingOpacity).toBe(1)
  expect(t.housingDepthWrite).toBe(true)
  expect(t.housingMeshCount).toBeGreaterThan(0)
  const realStart = t.simTime
  await waitForFrames(page, 3)
  const realAdvance = (await page.evaluate(() => window.__WEBGL_TELEMETRY__!.simTime)) - realStart

  // Shot 2: bullet-time. Each frame may add at most 0.1 s * 0.03 to simTime.
  t = await gotoShot(page, 2, 'bullet-time-orbit')
  expect(t.timeScale).toBeCloseTo(0.03, 3)
  expect(t.explodeAmount).toBeCloseTo(0.15, 3)
  const slowStart = t.simTime
  const frameStart = t.frameCount
  await waitForFrames(page, 3)
  t = await page.evaluate(() => window.__WEBGL_TELEMETRY__!)
  const slowAdvance = t.simTime - slowStart
  expect(slowAdvance).toBeLessThanOrEqual((t.frameCount - frameStart) * 0.1 * 0.03 + 1e-6)
  expect(realAdvance).toBeGreaterThan(slowAdvance * 5)

  // Shot 3: housing faded, so the depthWrite guard must have released.
  t = await gotoShot(page, 3, 'assembly-isolation')
  expect(t.housingOpacity).toBeCloseTo(0.08, 3)
  expect(t.housingDepthWrite).toBe(false)
  expect(t.explodeAmount).toBeCloseTo(0.35, 3)

  // Shot 4: macro lens, machining plane moved into the part, camera on the authored keyframe.
  t = await gotoShot(page, 4, 'machining-macro')
  expect(t.cameraFov).toBeCloseTo(22, 1)
  expect(t.machiningPlaneConstant).toBeCloseTo(-0.25, 3)
  expect(t.cameraWorldPos).toEqual([-0.9, 0.65, 1.35])
})

test('scroll reel advances the spline progress under Lenis', async ({ page }) => {
  await page.goto('/?rig=cinematic&model=msp')
  await page.waitForFunction(() => window.__WEBGL_TELEMETRY__ !== undefined, undefined, { timeout: 60_000 })
  expect((await page.evaluate(() => window.__WEBGL_TELEMETRY__!)).splineProgress).toBe(0)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForFunction(() => (window.__WEBGL_TELEMETRY__?.splineProgress ?? 0) > 0.99, undefined, {
    timeout: 90_000,
  })
  const t = await page.evaluate(() => window.__WEBGL_TELEMETRY__!)
  expect(t.activeShot).toBe('machining-macro')
  expect(t.housingDepthWrite).toBe(false)
})

test.afterAll(() => {
  if (Object.keys(collected).length !== MODELS.length) return
  const outDir = path.resolve(process.cwd(), 'src/data')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'glb-manifests.json'), `${JSON.stringify(collected, null, 2)}\n`, 'utf-8')
})
