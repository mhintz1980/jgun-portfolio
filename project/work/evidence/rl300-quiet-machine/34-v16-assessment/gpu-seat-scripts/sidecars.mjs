// Sidecar JSON for the composite PNGs (they have no page of their own): derived from the source frames' proof JSON.
import fs from 'node:fs'
import path from 'node:path'
import { E, sha } from './common.mjs'
const rd = n => JSON.parse(fs.readFileSync(path.join(E, n), 'utf8'))
const brief = m => ({ file: m.file, tier: m.tier, requestedTier: m.requestedTier, u: m.u, ready: m.ready, viewport: m.viewport, url: m.url, uMatchesRequest: m.uMatchesRequest, tierMatchesRequest: m.tierMatchesRequest })
const png = n => { const b = fs.readFileSync(path.join(E, n)); return { pngBytes: b.length, pngSha256: sha(b) } }
const put = (name, obj) => fs.writeFileSync(path.join(E, name.replace(/\.png$/, '.json')), JSON.stringify(obj, null, 2))
const comp = (name, sources, extra = {}) => {
  const s = sources.map(brief)
  put(name, { composite: 'Chromium page compositor (no sharp/canvas/ImageMagick in node_modules)', file: name, ...png(name),
    tier: [...new Set(s.map(x => x.tier))].join('+'), u: s.map(x => x.u), ready: s.every(x => x.ready), viewport: s[0].viewport, url: s.map(x => x.url), sources: s, ...extra })
}
for (const vp of ['1440x900', '390x844']) comp(`sheet-${vp}.png`, [1, 2, 3, 4, 5, 6, 7].map(i => rd(`sheet-tiles/${vp}-shot${i}.json`)))
for (const vp of ['1440x900', '768x1024']) {
  const raw = rd(`intake-raw-${vp}.json`), b = rd('phase-b-intake.json').intake[vp]
  comp(`intake-closeup-${vp}.png`, [raw], { intake: b })
}
for (const vp of ['1440x900', '390x844']) for (const tag of ['u34', 'u51']) comp(`lite-vs-full-${tag}-${vp}.png`, ['full', 'lite'].map(t => rd(`lite-vs-full-tiles/${tag}-${vp}-${t}.json`)))
comp('reservoir-1019-vs-1020.png', [rd('reservoir-raw-1440x900.json')], { reservoir: rd('phase-b-reservoir.json').reservoir })
comp('chevrons.png', ['u840', 'u873', 'u900'].map(t => rd(`chevrons-raw-${t}.json`)), { chevrons: rd('phase-b-chevrons.json').chevrons })
console.log('sidecars ok')
