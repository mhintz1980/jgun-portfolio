/**
 * Degradation smoke check (run with: npx tsx scripts/check-fallback.tsx).
 *
 * Renders <App/> in Node, where WebGL2 does not exist — the exact condition a
 * no-WebGL browser presents — and asserts the poster tier engages: static
 * poster + full case-study DOM, no <canvas>, no pointer-events-gated text.
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import App from '../src/App'
import { BootPanel } from '../src/components/BootSequence'

const html = renderToString(createElement(App))

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
  ['poster title block renders', html.includes('Industrial Pneumatic Torque Wrench')],
  ['static-mode notice renders', html.includes('STATIC RENDER MODE')],
  ['case study 1 (gearbox) DOM present', html.includes('data-chapter="0"')],
  ['case study 4 (AI matrix) DOM present', html.includes('data-chapter="3"')],
  ['no <canvas> in poster tier', !html.includes('<canvas')],
  ['chapter text not pointer-events-gated', !html.includes('pointer-events-none flex min-h-[220vh]')],
  ['no boot sequence in poster tier', !html.includes('SYSTEM BOOT')],
  ['stalled boot panel is pointer-transparent', stalledBoot.includes('pointer-events-none')],
  ['stalled boot panel is translucent, not opaque', stalledBoot.includes('bg-black/70')],
  ['stalled boot panel surfaces the fault', stalledBoot.includes('RESOURCE(S) FAILED')],
  ['stalled boot shows real progress', stalledBoot.includes('42%')],
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
