/**
 * P1 opening-quality-collapse timestamp capture - PREPARED; runtime waits for
 * parent release. SceneCanvas is frozen under Kuhn's fresh review - this
 * helper is node-side only and modifies no app code.
 *
 * Evidence contract (parent round 6):
 *  - explicit fail: writes quality-events-<label>-FAILED.json and exits 1 if
 *    window.__qualityEvents is missing, ?qualityDiagnostics is not armed, or
 *    the final bounded buffer is null/empty - never a silent null timeline,
 *  - build identity from the MOUNTED context: index.html hash + every loaded
 *    .js resource hashed in-page via crypto.subtle (only refetches what the
 *    page itself loaded),
 *  - renderer/vendor read from the EXISTING window.__threeRenderer WebGL
 *    context (WEBGL_debug_renderer_info) - NO new WebGL probe context,
 *  - console errors + page errors captured (bounded),
 *  - actual wall-clock start/end timestamps; per-sample wall +
 *    performance.now() stamps.
 *
 * Gates before runtime (parent-owned):
 *  - target = THIS isolated build (.scratch/quality-diagnostic-dist) served
 *    on port 5204; the frozen 5203 dist/ is never captured,
 *  - URL carries ?qualityDiagnostics (opt-in guard); natural adaptation - no
 *    qualityLock, no forced tier, forced-lite NOT used,
 *  - preview server (CPU static server, no browser):
 *    npx vite preview --outDir .scratch/quality-diagnostic-dist --port 5204 --host 127.0.0.1 --strictPort
 *
 * Usage:
 *   node project/work/evidence/performance-diagnosis/helpers/capture-quality-events.mjs --url=http://127.0.0.1:5204/?qualityDiagnostics --label=desktop [--dwell=60] [--width=1600] [--height=900]
 *
 * Browser launch: shared hardware-correct contract (scripts/lib/
 * browser-launch.mjs) - installed Chrome + ANGLE/D3D11 on Windows; bundled
 * Chromium + SwiftShader elsewhere (labeled in output metadata).
 */
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from '../../../../../scripts/lib/browser-launch.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..', '..', '..', '..')
const arg = (key, fallback) => {
  const hit = process.argv.find((x) => x.indexOf('--' + key + '=') === 0)
  return hit ? hit.split('=').slice(1).join('=') : fallback
}
const url = arg('url', 'http://127.0.0.1:5204/?qualityDiagnostics')
const label = String(arg('label', 'probe')).replace(/[^a-z0-9_-]/gi, '-')
const dwellSeconds = Number(arg('dwell', '60'))
const width = Number(arg('width', '1600'))
const height = Number(arg('height', '900'))
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = path.join(root, 'project/work/evidence/performance-diagnosis', label + '-' + stamp)
fs.mkdirSync(outDir, { recursive: true })
const wallStart = new Date().toISOString()

const browser = await launchBrowser(chromium)
try {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && consoleErrors.length < 200) {
      consoleErrors.push({ wallAt: new Date().toISOString(), text: msg.text() })
    }
  })
  page.on('pageerror', (err) => {
    if (pageErrors.length < 100) {
      pageErrors.push({ wallAt: new Date().toISOString(), text: String((err && err.message) || err) })
    }
  })

  await page.goto(url, { waitUntil: 'load' })

  // Cold-load readiness: SceneCanvas is a code-split chunk that defines the
  // armed probe after the load event. First runtime execution (2026-10-09)
  // failed the guard ~1s after load on a cold load. Bounded wait, then the
  // explicit-fail guard still fires when the probe is genuinely absent.
  await page
    .waitForFunction(
      () =>
        typeof window.__qualityEvents === 'function' &&
        new URLSearchParams(window.location.search).has('qualityDiagnostics'),
      null,
      { timeout: 60000 },
    )
    .catch(() => {})

  // Explicit-fail guard: the mounted document must expose the opt-in probe.
  const guard = await page.evaluate(() => ({
    armed: typeof window.__qualityEvents === 'function',
    qualityDiagnosticsParam: new URLSearchParams(window.location.search).has('qualityDiagnostics'),
  }))
  if (!guard.armed || !guard.qualityDiagnosticsParam) {
    throw new Error(
      'EXPLICIT_FAIL: window.__qualityEvents missing or ?qualityDiagnostics not armed ' +
        '(mounted page lacks the instrumentation - is this the frozen 5203 dist?)',
    )
  }

  // Build identity from the MOUNTED context; renderer/vendor from the
  // EXISTING three renderer context (never a new WebGL probe).
  const identity = await page.evaluate(async () => {
    async function sha256Hex(fetchUrl) {
      const buf = await (await fetch(fetchUrl, { cache: 'force-cache' })).arrayBuffer()
      const digest = await crypto.subtle.digest('SHA-256', buf)
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
    const indexHtmlSha256 = await sha256Hex(window.location.href)
    const scriptUrls = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => name.endsWith('.js'))
      .slice(0, 40)
    const loadedScripts = []
    for (const scriptUrl of scriptUrls) {
      loadedScripts.push({ url: scriptUrl, sha256: await sha256Hex(scriptUrl) })
    }
    let rendererInfo = null
    const threeRenderer = window.__threeRenderer
    const gl = threeRenderer && typeof threeRenderer.getContext === 'function' ? threeRenderer.getContext() : null
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      rendererInfo = {
        source: 'existing __threeRenderer mounted context (no new WebGL probe)',
        renderer: gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        vendor: gl.getParameter(dbg ? dbg.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
        glVersion: gl.getParameter(gl.VERSION),
      }
    }
    return { indexHtmlSha256, loadedScripts, rendererInfo }
  })

  const samples = []
  const startedAt = Date.now()
  while ((Date.now() - startedAt) / 1000 < dwellSeconds) {
    samples.push(
      await page.evaluate(() => {
        const events = window.__qualityEvents()
        return {
          wallAt: new Date().toISOString(),
          at: performance.now(),
          eventCount: events.length,
          events,
          performance: window.__telemetry
            ? {
                tier: window.__telemetry.performance.tier,
                declines: window.__telemetry.performance.declines,
                warmReady: window.__telemetry.performance.warmReady,
              }
            : null,
        }
      }),
    )
    await page.waitForTimeout(1000)
  }

  const finalEvents = await page.evaluate(() => window.__qualityEvents())
  if (!Array.isArray(finalEvents) || finalEvents.length === 0) {
    throw new Error(
      'EXPLICIT_FAIL: final bounded events buffer is null/empty after ' +
        dwellSeconds +
        's - guard armed but nothing recorded.',
    )
  }
  const wallEnd = new Date().toISOString()

  const outFile = path.join(outDir, 'quality-events-' + label + '.json')
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        url,
        label,
        viewport: { width, height },
        launch: describeLaunch(),
        wallStart,
        wallEnd,
        dwellSeconds,
        identity,
        consoleErrors,
        pageErrors,
        finalEventsCount: finalEvents.length,
        finalEvents,
        samples,
      },
      null,
      2,
    ) + '\n',
  )
  await context.close()
  console.log('OK ' + label + ' -> ' + outFile)
} catch (err) {
  const message = String((err && err.message) || err)
  fs.writeFileSync(
    path.join(outDir, 'quality-events-' + label + '-FAILED.json'),
    JSON.stringify({ url, label, wallStart, wallEnd: new Date().toISOString(), error: message }, null, 2) + '\n',
  )
  console.error('CAPTURE FAILED: ' + message)
  process.exitCode = 1
} finally {
  await browser.close()
}
