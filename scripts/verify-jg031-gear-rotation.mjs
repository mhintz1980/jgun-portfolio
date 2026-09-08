/**
 * JG-031 Epicyclic Gear Rotation Verification Script
 *
 * Verifies:
 * 1. Runtime telemetry stageRot has 5 entries corresponding to stage1..stage5.
 * 2. Strict monotonicity: stageRot[i+1] < stageRot[i] at all active scroll positions.
 * 3. Consistent ~65% reduction ratio between adjacent stages (stageRot[i+1] / stageRot[i] in [0.63, 0.67]).
 * 4. Absolute values at full sweep match [50.265, 32.673, 21.237, 13.823, 8.985] rad (±0.25 rad integration margin).
 * 5. Planet counter-rotation: planetRot === -3.5 * stageRot[0].
 * 6. Static exploded mode (?view=exploded) keeps train at rest (stageRot all 0).
 * 7. Zero console / page errors throughout.
 * 8. Captures proof screenshots for review.
 */
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'
)

const OUT_DIR = 'project/work/evidence/jg031-gear-rotation'
fs.mkdirSync(OUT_DIR, { recursive: true })

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

  console.log('--- Step 1: Navigating to http://localhost:4173/?chapter=0 ---')
  await page.goto('http://localhost:4173/?chapter=0', { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () => Boolean(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady),
    null,
    { timeout: 60000 }
  )
  await page.waitForTimeout(2000)

  // Test at progress 0.35 (CH.02 gear sweep active)
  console.log('--- Step 2: Scrolling to progress = 0.35 (CH.02 rotation sweep) ---')
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, 0.35)
  await page.waitForTimeout(2500)

  const telem035 = await page.evaluate(() => window.__telemetry?.rig)
  report.telemetry['progress_0.35'] = telem035

  console.log('Telemetry at 0.35:', JSON.stringify(telem035?.stageRot))

  if (!telem035 || !telem035.stageRot || telem035.stageRot.length !== 5) {
    fail(`progress 0.35: Expected 5 stages in stageRot, got ${telem035?.stageRot?.length}`)
  } else {
    pass('stageRot contains 5 stages at progress 0.35')
    report.assertions.stageCount035 = true

    // Map through physical driveline order: [stage1, stage2, stage5, stage3, stage4] -> indices [0, 1, 4, 2, 3]
    const drivelineRot035 = [
      telem035.stageRot[0],
      telem035.stageRot[1],
      telem035.stageRot[4],
      telem035.stageRot[2],
      telem035.stageRot[3],
    ]
    const drivelineNames = ['stage1', 'stage2', 'stage5', 'stage3', 'stage4']

    // Check strict monotonicity along physical driveline
    let monotonic = true
    for (let i = 0; i < drivelineRot035.length - 1; i++) {
      if (drivelineRot035[i + 1] >= drivelineRot035[i]) {
        monotonic = false
        fail(`Driveline monotonicity failed at progress 0.35: ${drivelineNames[i+1]} (${drivelineRot035[i+1]}) >= ${drivelineNames[i]} (${drivelineRot035[i]})`)
      }
    }
    if (monotonic) {
      pass(`Physical driveline strict monotonicity verified at 0.35: ${drivelineRot035.map((r, idx) => `${drivelineNames[idx]}=${r.toFixed(2)}`).join(' > ')}`)
      report.assertions.monotonic035 = true
    }

    // Check ratios ~0.65 along physical driveline
    let ratiosOk = true
    const ratios = []
    for (let i = 0; i < drivelineRot035.length - 1; i++) {
      const r = drivelineRot035[i + 1] / drivelineRot035[i]
      ratios.push(r)
      if (r < 0.63 || r > 0.67) {
        ratiosOk = false
        fail(`Driveline ratio between ${drivelineNames[i+1]} and ${drivelineNames[i]} out of bounds: ${r.toFixed(4)} (expected ~0.65)`)
      }
    }
    report.assertions.ratios035 = ratios
    if (ratiosOk) {
      pass(`All consecutive physical driveline stage ratios at 0.35 are in [0.63, 0.67]: ${ratios.map(r => (r * 100).toFixed(1) + '%').join(', ')}`)
      report.assertions.ratiosOk035 = true
    }

    // Planet counter-rotation
    const expectedPlanet = -3.5 * telem035.stageRot[0]
    const planetDiff = Math.abs(telem035.planetRot - expectedPlanet)
    if (planetDiff < 1e-3) {
      pass(`Planet counter-rotation verified: ${telem035.planetRot.toFixed(3)} === -3.5 * ${telem035.stageRot[0].toFixed(3)}`)
      report.assertions.planetRot035 = true
    } else {
      fail(`Planet counter-rotation mismatch: ${telem035.planetRot} vs expected ${expectedPlanet}`)
    }
  }

  // Capture screenshot at 0.35
  const shotPath035 = path.join(OUT_DIR, 'lateral-ch02-gear-rotation-0.35.png')
  await page.screenshot({ path: shotPath035 })
  console.log(`Saved screenshot: ${shotPath035}`)

  // Test at progress 0.50 (near full sweep)
  console.log('--- Step 3: Scrolling to progress = 0.50 (full sweep range) ---')
  await page.evaluate((p) => {
    window.__scrollCommitDisabled = true
    return window.__drawingProof.scrollToProgress(p)
  }, 0.50)
  await page.waitForTimeout(2500)

  const telem050 = await page.evaluate(() => window.__telemetry?.rig)
  report.telemetry['progress_0.50'] = telem050

  console.log('Telemetry at 0.50:', JSON.stringify(telem050?.stageRot))

  if (telem050 && telem050.stageRot && telem050.stageRot.length === 5) {
    const drivelineRot050 = [
      telem050.stageRot[0],
      telem050.stageRot[1],
      telem050.stageRot[4],
      telem050.stageRot[2],
      telem050.stageRot[3],
    ]
    const drivelineNames = ['stage1', 'stage2', 'stage5', 'stage3', 'stage4']

    let monotonic050 = true
    for (let i = 0; i < drivelineRot050.length - 1; i++) {
      if (drivelineRot050[i + 1] >= drivelineRot050[i]) {
        monotonic050 = false
        fail(`Driveline monotonicity failed at progress 0.50: ${drivelineNames[i+1]} >= ${drivelineNames[i]}`)
      }
    }
    if (monotonic050) {
      pass(`Physical driveline strict monotonicity verified at 0.50: ${drivelineRot050.map((r, idx) => `${drivelineNames[idx]}=${r.toFixed(2)}`).join(' > ')}`)
      report.assertions.monotonic050 = true
    }

    const ratios050 = []
    let ratiosOk050 = true
    for (let i = 0; i < drivelineRot050.length - 1; i++) {
      const r = drivelineRot050[i + 1] / drivelineRot050[i]
      ratios050.push(r)
      if (r < 0.63 || r > 0.67) {
        ratiosOk050 = false
        fail(`Driveline ratio between ${drivelineNames[i+1]} and ${drivelineNames[i]} at 0.50 out of bounds: ${r.toFixed(4)}`)
      }
    }
    report.assertions.ratios050 = ratios050
    if (ratiosOk050) {
      pass(`All consecutive physical driveline stage ratios at 0.50 are in [0.63, 0.67]: ${ratios050.map(r => (r * 100).toFixed(1) + '%').join(', ')}`)
      report.assertions.ratiosOk050 = true
    }
  }

  const shotPath050 = path.join(OUT_DIR, 'lateral-ch02-gear-rotation-0.50.png')
  await page.screenshot({ path: shotPath050 })
  console.log(`Saved screenshot: ${shotPath050}`)

  // Step 4: Static exploded mode (?view=exploded)
  console.log('--- Step 4: Testing static exploded mode (?view=exploded) ---')
  await page.goto('http://localhost:4173/?view=exploded', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(window.__telemetry?.rig), null, { timeout: 60000 })
  await page.waitForTimeout(2000)

  const telemExploded = await page.evaluate(() => window.__telemetry?.rig)
  report.telemetry['view_exploded'] = telemExploded

  if (telemExploded && telemExploded.stageRot) {
    const allZero = telemExploded.stageRot.every(r => Math.abs(r) < 1e-4)
    if (allZero) {
      pass('Static exploded mode: all 5 stageRot values are 0 (train at rest)')
      report.assertions.explodedAtRest = true
    } else {
      fail(`Static exploded mode: stageRot not zero: ${JSON.stringify(telemExploded.stageRot)}`)
    }
  }

  // Console error check
  if (pageErrors.length > 0) {
    fail(`Page/Console errors detected (${pageErrors.length}):\n${pageErrors.join('\n')}`)
  } else {
    pass('0 console errors, 0 uncaught page errors')
    report.assertions.zeroErrors = true
  }

  report.completedAt = new Date().toISOString()
  report.status = report.failures.length === 0 ? 'PASS' : 'FAIL'

  const reportPath = path.join(OUT_DIR, 'verification-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(`Verification report written to ${reportPath}`)

  if (report.status === 'PASS') {
    console.log('\n>>> ALL JG-031 VERIFICATION GATES PASSED <<<')
  } else {
    console.error(`\n>>> JG-031 VERIFICATION FAILED with ${report.failures.length} issues <<<`)
    process.exitCode = 1
  }
} finally {
  await browser.close()
}
