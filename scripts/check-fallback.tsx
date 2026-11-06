/**
 * Degradation smoke check. Run (CSS import is stubbed, packages stay external):
 *   npx esbuild scripts/check-fallback.tsx --bundle --platform=node --format=esm --packages=external --loader:.css=empty --outfile=.scratch/check-fallback.mjs && node .scratch/check-fallback.mjs
 *
 * Renders the current /torque-wrench/ page (TorqueWrenchPage + a poster-tier
 * store, the tier a no-WebGL browser resolves to) in Node and asserts the
 * poster tier engages: static poster slots + full five-chapter DOM, no
 * <canvas>, story not inert/hidden, no preloader. Component-level
 * BootPanel/HotspotButton/TechnicalHUD assertions are unchanged.
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { TorqueWrenchPage } from '../src/scene/torque-wrench/TorqueWrenchPage'
import { createTorqueWrenchStore } from '../src/state/torqueWrenchStore'
import { BootPanel } from '../src/components/BootSequence'
import { TechnicalHUD } from '../src/components/TechnicalHUD'
import { HotspotButton } from '../src/scene/Hotspots'
import { HOTSPOTS } from '../src/data/caseStudies'
import { setScrollState } from '../src/state/scrollStore'

const html = renderToString(
  createElement(TorqueWrenchPage, { store: createTorqueWrenchStore({ tier: 'poster' }) }),
)
const storyOpen = /<article[^>]*id="torque-story"[^>]*>/.exec(html)?.[0] ?? ''

// Keyboard a11y: interactive surfaces must be real, tab-reachable buttons
// with the HUD-cyan focus ring — not click-only divs.
const hotspotHtml = renderToString(
  createElement(HotspotButton, { def: HOTSPOTS[0], selected: false }),
)
setScrollState({ hotspotId: HOTSPOTS[0].id }) // open the detail panel for the close-button check
const hudHtml = renderToString(createElement(TechnicalHUD))

// Boot panel frozen mid-load — the "GLB stalled at 42%" worst case. It must
// be pointer-transparent and translucent so the DOM narrative stays usable.
const stalledBoot = renderToString(
  createElement(BootPanel, {
    progress: 42,
    loaded: 1,
    total: 2,
    log: ['LOADING ASSY · RL-300 FULL'],
    faults: 1,
    reducedMotion: false,
    ready: false,
  }),
)

const checks: Array<[string, boolean]> = [
  ['poster title block renders', html.includes('Industrial Torque Wrench') && html.includes('<h1')],
  ['static-mode notice renders', html.includes('data-torque-mode="static"') && html.includes('Work in progress')],
  ['chapter 1 (drafting) DOM present', html.includes('data-torque-chapter="drafting"')],
  ['chapter 4 (inspection) DOM present', html.includes('data-torque-chapter="inspection"') && html.includes('aria-controls="torque-inspection-detail"')],
  ['no <canvas> in poster tier', !html.includes('<canvas') && !html.includes('data-torque-scene=')],
  ['story text not inert or aria-hidden', storyOpen.includes('id="torque-story"') && !/inert|aria-hidden/.test(storyOpen)],
  ['no preloader in poster tier', !html.includes('torque-preloader') && html.includes('data-torque-stage="poster"') && (html.match(/data-torque-poster-pending="stage-6"/g) ?? []).length === 5],
  ['stalled boot panel is pointer-transparent', stalledBoot.includes('pointer-events-none')],
  ['stalled boot panel is translucent, not opaque', stalledBoot.includes('bg-black/70')],
  ['stalled boot panel surfaces the fault', stalledBoot.includes('RESOURCE(S) FAILED')],
  ['stalled boot shows real progress', stalledBoot.includes('42%')],
  ['hotspot is a real <button>', hotspotHtml.startsWith('<button')],
  ['hotspot exposes aria-pressed state', hotspotHtml.includes('aria-pressed="false"')],
  ['hotspot has HUD-cyan focus ring', hotspotHtml.includes('focus-visible:ring-cyan-300')],
  ['mode switcher buttons are real <button>s', (hudHtml.match(/<button/g) ?? []).length >= 4],
  ['mode switcher exposes aria-pressed', hudHtml.includes('aria-pressed="true"')],
  ['mode switcher has HUD-cyan focus ring', hudHtml.includes('focus-visible:ring-cyan-300')],
  ['hotspot close button is labelled', hudHtml.includes('aria-label="Close hotspot detail"')],
  ['nothing removed from the tab order', !hotspotHtml.includes('tabindex="-1"') && !hudHtml.includes('tabindex="-1"')],
]

let failed = 0
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) failed += 1
}
if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll no-WebGL fallback checks passed.')
