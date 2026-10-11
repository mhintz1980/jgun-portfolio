// Orchestrator-owned: difference maps + cost table for round 1. Deterministic, no browser.
// Usage: node round-report.mjs   -> writes 35-v16-round-1/diff/*.png and diff/summary.json, prints a compact table.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
const EV = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/project/work/evidence/rl300-quiet-machine'
const R = `${EV}/35-v16-round-1`
const DM = `${R}/scripts/diffmap.mjs`
fs.mkdirSync(`${R}/diff`, { recursive: true })
const rows = []
const run = (label, before, after, out) => {
  if (!fs.existsSync(before) || !fs.existsSync(after)) { rows.push({ label, error: `missing ${!fs.existsSync(before) ? before : after}` }); return }
  try {
    const j = JSON.parse(execFileSync('node', [DM, before, after, `${R}/diff/${out}`], { encoding: 'utf8' }))
    rows.push({ label, out, changedPct: j.changedPct, maxDelta: j.maxDelta, meanDelta: j.meanDeltaChanged, grid: j.grid })
  } catch (e) { rows.push({ label, error: String(e.stderr || e.message).slice(0, 160) }) }
}
for (const vp of ['1440x900', '390x844']) for (const t of ['u34', 'u51']) {
  const n = `${t}-${vp}`
  run(`before->after ${n}`, `${EV}/32-gpu-2/${n}.png`, `${R}/after/${n}.png`, `diff-${n}.png`)
  run(`NOISE after vs repeat ${n}`, `${R}/after/${n}.png`, `${R}/after-repeat/${n}.png`, `noise-${n}.png`)
}
for (const t of ['u34', 'u51'])
  run(`lite before->after ${t}-390x844`, `${EV}/32-gpu-2/lite-vs-full-tiles/${t}-390x844-lite.png`, `${R}/after/lite-${t}-390x844.png`, `diff-lite-${t}-390x844.png`)
for (const vp of ['1440x900', '390x844']) for (let i = 1; i <= 7; i++)
  run(`sheet ${vp} shot${i}`, `${EV}/32-gpu-2/sheet-tiles/${vp}-shot${i}.png`, `${R}/after/sheet-tiles/${vp}-shot${i}.png`, `diff-sheet-${vp}-shot${i}.png`)
for (const p of ['dials', 'exhaust-connector', 'exhaust-connector-uncut', 'ffm-1001-1']) {
  run(`closeup ${p}`, `${R}/before-at-closeup-u/closeup-${p}.png`, `${R}/after/closeup-${p}.png`, `diff-closeup-${p}.png`)
  run(`closeup-full ${p}`, `${R}/before-at-closeup-u/closeup-${p}-full.png`, `${R}/after/closeup-${p}-full.png`, `diff-closeup-${p}-full.png`)
}
fs.writeFileSync(`${R}/diff/summary.json`, JSON.stringify(rows, null, 1))
for (const r of rows) console.log(r.error ? `ERR  ${r.label}: ${r.error}` : `${r.label.padEnd(40)} changed ${String(r.changedPct).padStart(6)}%  max ${String(r.maxDelta).padStart(3)}  mean ${String(r.meanDelta).padStart(5)}`)

// cost table
const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const before = rd(`${R}/before-now/cost.json`)
const after = rd(`${R}/after/cost.json`)
const b = Array.isArray(before) ? before : before.now
console.log('\nCOST (name: drawCalls / renderedTriangles / geometries / textures / batches[materials] / source / kept)')
const fmt = c => `${c.drawCalls} / ${c.renderedTriangles} / ${c.geometries} / ${c.textures} / ${c.batches}${c.materials != null ? '[' + c.materials + ']' : ''} / ${c.sourceTriangles} / ${c.keptTriangles}`
for (const a of after) {
  const m = b.find(x => x.name === a.name)
  console.log(`${a.name.padEnd(24)} tier=${a.tier}\n   before: ${m ? fmt(m) : 'n/a'}\n   after : ${fmt(a)}  extras=${a.extraParts}/${a.extraTriangles} mapped=${a.mappedParts}/${a.mappedPrimitives} unmappedMulti=${a.unmappedMultiSlot} v16=${a.v16Applied}`)
}
