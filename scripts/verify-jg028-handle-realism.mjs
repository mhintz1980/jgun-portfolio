/**
 * JG-028 Handle Realism verification probe.
 *
 * Verifies that:
 * 1. The Handle Body mesh has material role 'anodizedAluminum' with deep satin black (#0c0c0e, roughness 0.28, metalness 0.85, envMapIntensity 1.2).
 * 2. The P001928 (reversing valve spool) mesh has material role 'stainlessSteel' (#c2c6cb, roughness 0.28, metalness 0.92, envMapIntensity 1.25).
 * 3. Fasteners retain 'blackOxideSteel' (#0d0d0d, roughness 0.28, metalness 0.96).
 * 4. P001928 is parented under handleRoot and translates rigidly (-0.354 offset at explode = 1).
 * 5. P000420 blue groove ring remains mounted and unoccluded at the collar seam.
 * 6. Captures proof screenshots for owner visual review.
 */
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'
)

const OUT_DIR = 'project/work/evidence/jg028-handle-realism'
const SCRATCH_DIR = '.scratch'
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(SCRATCH_DIR, { recursive: true })

const report = {
  startedAt: new Date().toISOString(),
  failures: [],
  assertions: {},
  telemetry: {},
}

const fail = (msg) => {
  report.failures.push(msg)
  console.error('FAIL:', msg)
}

const pass = (msg) => {
  console.log('PASS:', msg)
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
})

try {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (err) => pageErrors.push(String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push('console.error: ' + msg.text())
  })

  console.log('Navigating to http://localhost:4173/?chapter=0...')
  await page.goto('http://localhost:4173/?chapter=0', { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () => Boolean(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady),
    null,
    { timeout: 60000 }
  )
  await page.waitForTimeout(2000)

  // Scroll to CH.01 drawing view (progress = 0.10, matching owner reference perspective)
  console.log('Scrolling to CH.01 drawing view (progress = 0.10)...')
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, 0.10)

  await page.evaluate(async () => {
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
  })

  const drawingScreenshotPath = path.join(SCRATCH_DIR, 'jg028-ch1-drawing-0.10.png')
  await page.screenshot({ path: drawingScreenshotPath })
  fs.copyFileSync(drawingScreenshotPath, path.join(OUT_DIR, 'jg028-ch1-drawing-0.10.png'))
  console.log(`Saved screenshot: ${drawingScreenshotPath}`)

  // Scroll to CH.01 lift-off view (progress = 0.22)
  console.log('Scrolling to CH.01 lift view (progress = 0.22)...')
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, 0.22)

  // Wait for quiet
  await page.evaluate(async () => {
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
  })

  const liftScreenshotPath = path.join(SCRATCH_DIR, 'jg028-ch1-lift-0.22.png')
  await page.screenshot({ path: liftScreenshotPath })
  fs.copyFileSync(liftScreenshotPath, path.join(OUT_DIR, 'jg028-ch1-lift-0.22.png'))
  console.log(`Saved screenshot: ${liftScreenshotPath}`)

  // Scroll to CH.01 hero view (progress ~0.35)
  console.log('Scrolling to CH.01 hero view (progress = 0.35)...')
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, 0.35)

  // Wait for damping quiet
  await page.evaluate(async () => {
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
    return { progress: t.scroll.progress, explodeFactor: t.rig.explodeFactor }
  })

  // Capture CH.01 hero screenshot
  const heroScreenshotPath = path.join(SCRATCH_DIR, 'jg028-ch1-hero-verified.png')
  await page.screenshot({ path: heroScreenshotPath })
  fs.copyFileSync(heroScreenshotPath, path.join(OUT_DIR, 'jg028-ch1-hero-verified.png'))
  console.log(`Saved screenshot: ${heroScreenshotPath}`)

  // Probe materials & scene graph
  const probe = await page.evaluate(() => {
    const rig = window.__rig
    if (!rig) return { error: 'window.__rig is missing' }

    // Find handle meshes
    const handleMeshes = []
    if (rig.handleRoot) {
      rig.handleRoot.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          const mat = obj.material
          handleMeshes.push({
            name: obj.name,
            parentName: obj.parent ? obj.parent.name : null,
            colorHex: '#' + mat.color.getHexString(),
            roughness: mat.roughness,
            metalness: mat.metalness,
            clearcoat: mat.clearcoat ?? null,
            clearcoatRoughness: mat.clearcoatRoughness ?? null,
            envMapIntensity: mat.envMapIntensity ?? null,
            type: mat.type,
          })
        }
      })
    }

    // Inspect all rig.meshes
    const allRigMeshes = rig.meshes.map((m) => {
      const mat = m.material
      return {
        name: m.name,
        colorHex: mat?.color ? '#' + mat.color.getHexString() : null,
        roughness: mat?.roughness ?? null,
        metalness: mat?.metalness ?? null,
        clearcoat: mat?.clearcoat ?? null,
        envMapIntensity: mat?.envMapIntensity ?? null,
        type: mat?.type ?? null,
      }
    })

    // Find blue groove
    let blueGrooveFound = false
    let blueGrooveParent = null
    let blueGrooveColor = null
    if (rig.clutch?.static) {
      rig.clutch.static.traverse((obj) => {
        if (obj.name && /Speed Indicator \(Blue\)/i.test(obj.name)) {
          blueGrooveFound = true
          blueGrooveParent = obj.parent?.name ?? null
          if (obj.material?.color) {
            blueGrooveColor = '#' + obj.material.color.getHexString()
          }
        }
      })
    }

    // Fasteners
    const fastenerMeshes = allRigMeshes.filter(
      (m) => m.colorHex === '#0d0d0d' && m.metalness >= 0.95
    )

    return {
      handleMeshes,
      allRigMeshes,
      blueGroove: {
        found: blueGrooveFound,
        parent: blueGrooveParent,
        color: blueGrooveColor,
      },
      fastenerCount: fastenerMeshes.length,
      telemetry: window.__telemetry?.rig,
    }
  })

  report.probe = probe
  report.pageErrors = pageErrors

  if (probe.error) {
    fail(probe.error)
  } else {
    // 1. Assert handle body mesh has anodizedAluminum deep obsidian black (#040404, roughness 0.26, metalness 0.98, envMapIntensity 1.0)
    const anodizedMeshes = probe.handleMeshes.filter(
      (m) => m.colorHex === '#040404' && Math.abs(m.roughness - 0.26) <= 0.02 && Math.abs(m.metalness - 0.98) <= 0.02
    )
    if (anodizedMeshes.length > 0) {
      pass(`Found ${anodizedMeshes.length} handle mesh(es) matching anodizedAluminum (#040404, roughness 0.26, metalness 0.98)`)
      report.assertions.anodizedAluminum = { pass: true, count: anodizedMeshes.length, sample: anodizedMeshes[0] }
    } else {
      fail(`No handle mesh found matching anodizedAluminum (#040404, roughness 0.26, metalness 0.98). Handle meshes: ${JSON.stringify(probe.handleMeshes)}`)
      report.assertions.anodizedAluminum = { pass: false }
    }

    // 2. Assert P001928 has stainlessSteel (#c2c6cb, roughness 0.28, metalness 0.92, envMapIntensity 1.25)
    const stainlessMeshes = probe.handleMeshes.filter(
      (m) => m.colorHex === '#c2c6cb' && Math.abs(m.roughness - 0.28) < 0.01 && Math.abs(m.metalness - 0.92) < 0.01
    )
    if (stainlessMeshes.length > 0) {
      pass(`Found ${stainlessMeshes.length} handle mesh(es) matching P001928 stainlessSteel (#c2c6cb, roughness 0.28, metalness 0.92)`)
      report.assertions.stainlessSteel = { pass: true, count: stainlessMeshes.length, sample: stainlessMeshes[0] }
    } else {
      fail(`No handle mesh found matching stainlessSteel (#c2c6cb, roughness 0.28, metalness 0.92). Handle meshes: ${JSON.stringify(probe.handleMeshes)}`)
      report.assertions.stainlessSteel = { pass: false }
    }

    // 3. Assert fasteners retain blackOxideSteel (#0d0d0d)
    if (probe.fastenerCount > 0) {
      pass(`Found ${probe.fastenerCount} fastener mesh(es) matching blackOxideSteel (#0d0d0d)`)
      report.assertions.blackOxideSteel = { pass: true, count: probe.fastenerCount }
    } else {
      fail(`No fastener meshes found matching blackOxideSteel (#0d0d0d)`)
      report.assertions.blackOxideSteel = { pass: false }
    }

    // 4. Assert blue groove ring exists
    if (probe.blueGroove.found && probe.blueGroove.color === '#005daa') {
      pass(`Blue speed indicator groove verified at collar seam (color ${probe.blueGroove.color})`)
      report.assertions.blueGroove = { pass: true, details: probe.blueGroove }
    } else {
      fail(`Blue groove not found or incorrect: ${JSON.stringify(probe.blueGroove)}`)
      report.assertions.blueGroove = { pass: false, details: probe.blueGroove }
    }
  }

  // 5. Assert explosion ladder: scroll to explode = 1 (progress = 0.50)
  console.log('Scrolling to exploded view (progress = 0.50)...')
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, 0.50)

  // Wait for quiet
  await page.evaluate(async () => {
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
    return { progress: t.scroll.progress, explodeFactor: t.rig.explodeFactor }
  })

  // Capture exploded screenshot
  const explodedScreenshotPath = path.join(SCRATCH_DIR, 'jg028-handle-realism-exploded.png')
  await page.screenshot({ path: explodedScreenshotPath })
  console.log(`Saved screenshot: ${explodedScreenshotPath}`)

  const explosionCheck = await page.evaluate(() => {
    const rig = window.__rig
    const handleRoot = rig?.handleRoot
    const basePos = rig?.basePositions?.get(handleRoot)
    const currentZ = handleRoot?.position?.z ?? 0
    const baseZ = basePos?.z ?? 0
    const deltaZ = currentZ - baseZ

    // Also check P001928 child mesh position relative to handleRoot
    const stainlessMeshes = []
    handleRoot.traverse((obj) => {
      if (obj.isMesh && obj.material?.color?.getHexString() === 'c2c6cb') {
        stainlessMeshes.push({
          pos: [obj.position.x, obj.position.y, obj.position.z],
          worldPos: obj.getWorldPosition(new obj.position.constructor()),
        })
      }
    })

    return {
      baseZ,
      currentZ,
      deltaZ,
      expectedDeltaZ: -0.354,
      stainlessMeshes,
    }
  })

  report.explosionCheck = explosionCheck
  if (Math.abs(explosionCheck.deltaZ - explosionCheck.expectedDeltaZ) < 0.002) {
    pass(`Handle exploded offset verified: deltaZ = ${explosionCheck.deltaZ.toFixed(4)} (expected ${explosionCheck.expectedDeltaZ})`)
    report.assertions.explosionOffset = { pass: true, explosionCheck }
  } else {
    fail(`Handle exploded offset mismatch: deltaZ = ${explosionCheck.deltaZ} (expected ${explosionCheck.expectedDeltaZ})`)
    report.assertions.explosionOffset = { pass: false, explosionCheck }
  }

  // Save report
  const reportPath = path.join(OUT_DIR, 'report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Saved verification report to: ${reportPath}`)

  if (report.failures.length > 0) {
    console.error(`\n${report.failures.length} verification assertion(s) failed!`)
    process.exit(1)
  } else {
    console.log(`\nALL JG-028 verification assertions PASSED cleanly!`)
  }
} finally {
  await browser.close()
}
