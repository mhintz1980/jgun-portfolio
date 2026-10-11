// Builds src/scene/rl300/v16-part-materials.json from the V16 inspection dump + the main/lite GLBs. Run with node.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const asset = path.resolve(here, '..')
const REPO = path.resolve(asset, '../../../../../..')
const DATA = path.join(asset, 'data') + '/'
const inspect = JSON.parse(fs.readFileSync(DATA + 'inspect.json', 'utf8'))
const maprange = JSON.parse(fs.readFileSync(DATA + 'maprange.json', 'utf8'))
const stats = JSON.parse(fs.readFileSync(path.join(asset, 'build-stats.json'), 'utf8'))
const OUT = path.join(REPO, 'src/scene/rl300/v16-part-materials.json')

const sanitize = (n) => n.replace(/\s/g, '_').replace(/[[\].:/]/g, '')
const base = (m) => (m === null ? null : m.replace(/__SECTION$/, ''))

function glbNodes(file) {
  const b = fs.readFileSync(file)
  const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'))
  const m = new Map()
  // Orchestrator fix: node names must be sanitized the same way as the V16 names (the seat keyed the raw
  // GLB name, so every name with whitespace or . [ ] : / failed to match: 220 of 540 matched).
  for (const n of j.nodes) m.set(sanitize(n.name), n.mesh === undefined ? 0 : j.meshes[n.mesh].primitives.length)
  return m
}
const main = glbNodes(path.join(REPO, 'public/models/msp-enclosure.glb'))
const lite = glbNodes(path.join(REPO, 'public/models/rl300-lite.glb'))
const EXTRAS = ['EXHAUST_CONNECTOR_PIPE', 'BREP1.001', 'BREP1.002', 'BREP1.003', 'BREP1', 'DIAL_LENS_1', 'BREP1.007', 'BREP1.006', 'BREP1.005', 'BREP1.008', 'DIAL_LENS_2'].map(sanitize)

// ---- materials (base names only)
const r6 = (v) => +(+v).toFixed(6)
const rr = (v) => (Array.isArray(v) ? v.map(x => +x.toFixed(4)) : +(+v).toFixed(4))
const materials = {}
const baseNames = [...new Set(Object.keys(inspect.materials).map(base))].sort()
const diffKeys = ['Base Color', 'Metallic', 'Roughness', 'Coat Weight', 'Coat Roughness', 'Alpha']
for (const name of baseNames) {
  const row = inspect.materials[name]
  if (!row) continue
  if (!row.principled) {
    if (name !== 'DIAL_LENS') throw new Error('unexpected non-principled ' + name)
    const l = stats.lens
    materials[name] = {
      baseLinear: l.glossy_color.map(r6), metalness: 0, roughness: r6(l.glossy_roughness), clearcoat: 0, clearcoatRoughness: 0,
      opacity: r6(l.f0_normal_incidence), procedural: false, nonPrincipled: true,
      notes: `Not Principled: Mix Shader(Fac=Fresnel IOR ${l.fresnel_ior.toFixed(2)}, Shader=Transparent BSDF, Shader_001=Glossy BSDF colour ${l.glossy_color[0].toFixed(2)} roughness ${l.glossy_roughness.toFixed(2)}). `
        + `Mix factor is the Fresnel term (socket default 0.5 is inert, the socket is linked); opacity = glossy weight at normal incidence F0=((n-1)/(n+1))^2=${l.f0_normal_incidence.toFixed(4)}, which rises towards 1 at grazing angles (a constant alpha cannot reproduce that). Metalness 0 (white dielectric-like reflection).`,
    }
    continue
  }
  let p = row.p
  if (!p) p = row.tree.nodes.find(n => n.type === 'BSDF_PRINCIPLED').inputs
  const linked = []
  for (const k of ['Base Color', 'Metallic', 'Roughness', 'Coat Weight', 'Coat Roughness']) if (p[k] && p[k].linked) linked.push(k)
  const rec = {
    baseLinear: p['Base Color'].v.slice(0, 3).map(r6), metalness: r6(p.Metallic.v), roughness: r6(p.Roughness.v),
    clearcoat: r6(p['Coat Weight'].v), clearcoatRoughness: r6(p['Coat Roughness'].v), opacity: 1,
    procedural: linked.length > 0, nonPrincipled: false, notes: 'plain Principled values',
  }
  if (linked.length) {
    const bits = []
    for (const k of linked) {
      const from = (p[k].from || []).map(f => f[1]).join('+')
      if (k === 'Roughness' && maprange[name]) {
        const n = maprange[name][0].inputs
        const lo = n['To Min'].v, hi = n['To Max'].v
        bits.push(`Roughness linked to Map Range (Object Info Random, from ${n['From Min'].v}..${n['From Max'].v}) to ${r6(lo)}..${r6(hi)}, midpoint ${r6((lo + hi) / 2)}; socket default ${rec.roughness} used`)
      } else bits.push(`${k} linked to ${from}; socket default used`)
    }
    rec.notes = bits.join('; ')
  }
  // section twin
  const twin = inspect.materials[name + '__SECTION']
  if (twin && twin.principled) {
    const d = []
    for (const k of diffKeys) {
      const a = JSON.stringify(row.p[k].v), b = JSON.stringify(twin.p[k].v)
      if (a !== b) d.push(`${k}: ${JSON.stringify(rr(row.p[k].v))} -> ${JSON.stringify(rr(twin.p[k].v))}`)
    }
    if (d.length) rec.sectionVariantOf = 'render-only cut-face twin differs (twin value after arrow): ' + d.join('; ')
  }
  materials[name] = rec
}

// ---- parts
const parts = {}
const counts = { v16Objects: inspect.objects.length, matchedMain: 0, matchedAlsoLite: 0, extras: 0, droppedV16Only: 0, collisions: 0, extrasAlsoInMain: [] }
const missingMats = new Set()
for (const o of inspect.objects) {
  const s = sanitize(o.n)
  const inMain = main.has(s), isExtra = EXTRAS.includes(s)
  if (!inMain && !isExtra) { counts.droppedV16Only++; continue }
  if (inMain) { counts.matchedMain++; if (lite.has(s)) counts.matchedAlsoLite++ }
  if (isExtra) { counts.extras++; if (inMain) counts.extrasAlsoInMain.push(s) }
  if (parts[s]) { counts.collisions++; continue }
  const slots = o.slots.map(base)
  for (const m of slots) if (m !== null && !materials[m]) missingMats.add(m)
  parts[s] = { v16: slots, glbPrims: inMain ? main.get(s) : null }
}
const mapStats = { single: 0, multiEqual: 0, multiUnequal: 0, multiNullPrims: 0, hasNullSlot: 0 }
for (const [s, p] of Object.entries(parts)) {
  if (p.v16.includes(null)) mapStats.hasNullSlot++
  if (p.v16.length === 1) mapStats.single++
  else if (p.glbPrims === null) mapStats.multiNullPrims++
  else if (p.v16.length === p.glbPrims) mapStats.multiEqual++
  else mapStats.multiUnequal++
}
// extras matched in lite? (not part of the spec counts)
const sha = crypto.createHash('sha256').update(fs.readFileSync('C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/7a0ea69b-a024-4739-ae73-5eab43caed88/scratchpad/v16/V16-copy.blend')).digest('hex')
const out = {
  version: 1,
  source: { file: 'RL300-SAFE-photoreal-V16-review.blend', sha256: sha, savedAt: '2026-10-10T20:44' },
  materials, parts,
}
fs.writeFileSync(OUT, JSON.stringify(out))
const size = fs.statSync(OUT).size
const result = { out: path.relative(REPO, OUT), bytes: size, sha256: crypto.createHash('sha256').update(fs.readFileSync(OUT)).digest('hex'),
  counts, mapStats, materialCount: Object.keys(materials).length, partCount: Object.keys(parts).length, missingMats: [...missingMats] }
fs.writeFileSync(path.join(asset, 'mapping-stats.json'), JSON.stringify(result, null, 1))
console.log(JSON.stringify(result))
