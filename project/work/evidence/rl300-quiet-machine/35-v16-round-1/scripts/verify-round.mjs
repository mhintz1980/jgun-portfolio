// Orchestrator-owned static gates for the V16 round 1. No browser, no servers, no GPU.
// Usage: node verify-round.mjs asset | baseline | common
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const EV = `${REPO}/project/work/evidence/rl300-quiet-machine/35-v16-round-1`
const COMMITTED = `${REPO}/project/work/evidence/rl300-quiet-machine/32-gpu-2`
const V16_SHA = '788ae2a2a2f784c56e70c16e81365b82fa0d236a48acce261855f4a7aa9d6146'
const SCR = 'C:/Users/Markimus/AppData/Local/Temp/claude/C--Users-Markimus--buzz-REPOS-jgun-quiet-machine/7a0ea69b-a024-4739-ae73-5eab43caed88/scratchpad'
const gate = process.argv[2]
let fails = 0
const check = (id, ok, msg) => { if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${id} ${msg}`) }
const exists = f => fs.existsSync(f)
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const sh = (c, a) => execFileSync(c, a, { cwd: REPO, encoding: 'utf8' })
const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const portFree = port => { try { sh('curl', ['-s', '-o', 'NUL', '--max-time', '2', `http://localhost:${port}/`]); return false } catch (e) { return e.status === 7 } }

function glb(file) {
  const b = fs.readFileSync(file)
  const len = b.readUInt32LE(12)
  const json = JSON.parse(b.slice(20, 20 + len).toString('utf8'))
  const binStart = 20 + len + 8
  return { json, bin: b.slice(binStart), size: b.length }
}
// bbox from accessor min/max of POSITION (no Draco in the extras file)
function nodeStats(g) {
  const out = {}
  const { json } = g
  const tris = p => (json.accessors[p.indices].count) / 3
  for (const n of json.nodes) {
    if (n.mesh == null) continue
    const m = json.meshes[n.mesh]
    let t = 0, min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9], hasN = true
    for (const p of m.primitives) {
      t += p.indices != null ? tris(p) : json.accessors[p.attributes.POSITION].count / 3
      const a = json.accessors[p.attributes.POSITION]
      for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], a.min[i]); max[i] = Math.max(max[i], a.max[i]) }
      if (p.attributes.NORMAL == null) hasN = false
    }
    out[n.name] = { tris: t, min, max, hasNormals: hasN, prims: m.primitives.length }
  }
  return out
}

function common() {
  check('C.ports-free', portFree(4173) && portFree(5199), '4173 and 5199 not answering')
  const v16 = sha(`${SCR}/v16/V16-copy.blend`)
  check('C.v16-copy-unchanged', v16 === V16_SHA, v16.slice(0, 16))
  const nm = fs.readdirSync(`${REPO}/node_modules`).length
  check('C.node_modules-154', nm === 154, `entries=${nm}`)
}

function asset() {
  const G = `${REPO}/public/models/rl300-extra-parts.glb`
  const J = `${REPO}/src/scene/rl300/v16-part-materials.json`
  check('A.files', exists(G) && exists(J), `glb=${exists(G)} json=${exists(J)}`)
  if (!exists(G) || !exists(J)) return
  const g = glb(G)
  const ext = g.json.extensionsUsed || []
  check('A.no-draco', !ext.includes('KHR_draco_mesh_compression'), `extensionsUsed=${JSON.stringify(ext)}`)
  check('A.ext-subset', ext.every(e => e === 'KHR_materials_clearcoat'), JSON.stringify(ext))
  check('A.no-images', !(g.json.images || []).length && !(g.json.textures || []).length, `images=${(g.json.images || []).length}`)
  check('A.size', g.size <= 400 * 1024, `${g.size} B`)
  const names = g.json.nodes.map(n => n.name)
  const expect = ['DUCT_EXHAUST', 'EXHAUST_CONNECTOR_PIPE', 'GAUGE_DIALS', 'BREP1.001', 'BREP1.002', 'BREP1.003', 'BREP1', 'DIAL_LENS_1', 'BREP1.007', 'BREP1.006', 'BREP1.005', 'BREP1.008', 'DIAL_LENS_2']
  const missing = expect.filter(n => !names.includes(n)), extra = names.filter(n => !expect.includes(n))
  check('A.node-names', !missing.length && !extra.length, `missing=[${missing}] extra=[${extra}]`)
  const st = nodeStats(g)
  check('A.normals', Object.values(st).every(s => s.hasNormals), 'every primitive has NORMAL')
  check('A.pipe-tris', st.EXHAUST_CONNECTOR_PIPE?.tris === 2172, `${st.EXHAUST_CONNECTOR_PIPE?.tris}`)
  const total = Object.values(st).reduce((s, x) => s + x.tris, 0)
  check('A.total-tris', total <= 7500, `${total}`)
  const budget = { 'BREP1.001': 1000, 'BREP1.007': 1000, 'BREP1.002': 150, 'BREP1.006': 150, 'BREP1.003': 900, 'BREP1.005': 900, BREP1: 150, 'BREP1.008': 150 }
  for (const [n, b] of Object.entries(budget)) check(`A.budget.${n}`, st[n] && st[n].tris <= b && st[n].tris > 0, `${st[n]?.tris} <= ${b}`)
  // V16 bbox (Blender Z-up) -> glTF (x, z, -y), within 1 mm
  const rows = rd(`${REPO}/project/work/evidence/rl300-quiet-machine/34-v16-assessment/data/v16-parts.json`).rows
  for (const r of rows) {
    if (r.name === 'RL300-P-FFM-1001-1') continue
    const s = st[r.name]; if (!s) { check(`A.bbox.${r.name}`, false, 'node absent'); continue }
    const [a, b] = r.bbox
    const exp = { min: [a[0], a[2], -b[1]], max: [b[0], b[2], -a[1]] }
    const d = Math.max(...exp.min.map((v, i) => Math.abs(v - s.min[i])), ...exp.max.map((v, i) => Math.abs(v - s.max[i])))
    if (r.name === 'EXHAUST_CONNECTOR_PIPE') {
      // v16-parts.json holds the AABB of the ROTATED object's bound_box corners, which is looser than the vertices.
      // Independent check: the GLB box must lie inside it and shrink it by at most 3 mm per side.
      // v16-parts.json is rounded to 4 decimals (0.1 mm), so allow 0.1 mm slack on containment.
      const inside = s.min.every((v, i) => v >= exp.min[i] - 1e-4) && s.max.every((v, i) => v <= exp.max[i] + 1e-4)
      check(`A.bbox.${r.name}`, inside && d <= 0.003, `inside bound_box AABB=${inside}, max shrink ${(d * 1000).toFixed(3)} mm (seat reports 0.000 mm vs tight vertex AABB)`)
    } else check(`A.bbox.${r.name}`, d <= 0.001, `max |delta| = ${(d * 1000).toFixed(3)} mm`)
  }
  const m = rd(J)
  const text = fs.readFileSync(J, 'utf8')
  check('J.no-section', !text.includes('__SECTION'), 'no __SECTION anywhere')
  check('J.shape', m.version === 1 && m.materials && m.parts, `materials=${Object.keys(m.materials || {}).length} parts=${Object.keys(m.parts || {}).length}`)
  const used = new Set(Object.values(m.parts).flatMap(p => p.v16))
  const absent = [...used].filter(n => !m.materials[n])
  check('J.materials-defined', absent.length === 0, absent.length ? absent.join(',') : 'all used materials defined')
  for (const n of ['EXHAUST_CONNECTOR_PIPE', 'BREP1001', 'BREP1007', 'DIAL_LENS_1', 'DIAL_LENS_2']) check(`J.part.${n}`, !!m.parts[n], m.parts[n] ? JSON.stringify(m.parts[n]) : 'missing')
  check('J.size', text.length <= 150 * 1024, `${text.length} B`)
  check('J.source-sha', m.source?.sha256?.startsWith('788ae2a2'), m.source?.sha256?.slice(0, 12))
}

function baseline() {
  const d = `${EV}/before-now`
  for (const vp of ['1440x900', '390x844']) for (const t of ['u34', 'u51']) {
    const base = `${d}/${t}-${vp}`
    check(`B.png.${t}-${vp}`, exists(`${base}.png`) && fs.statSync(`${base}.png`).size > 20000, exists(`${base}.png`) ? `${fs.statSync(`${base}.png`).size} B` : 'missing')
    if (exists(`${base}.json`)) {
      const j = rd(`${base}.json`)
      check(`B.sidecar.${t}-${vp}`, j.tier === 'full' && j.uMatchesRequest === true && j.ready === true && !(j.pageErrors || []).length, `tier=${j.tier} u=${j.u} drawCalls=${j.drawCalls} tris=${j.renderedTriangles}`)
    } else check(`B.sidecar.${t}-${vp}`, false, 'missing json')
  }
  check('B.cost.json', exists(`${d}/cost.json`), exists(`${d}/cost.json`) ? 'present' : 'missing')
  check('B.run-file', exists(`${EV}/run-A-baseline.md`), 'run-A-baseline.md')
}

if (gate === 'asset') { common(); asset() } else if (gate === 'baseline') { common(); baseline() } else if (gate === 'common') common()
else { console.log('usage: asset|baseline|common'); process.exit(2) }
console.log(fails ? `${gate.toUpperCase()}_FAIL ${fails}` : `${gate.toUpperCase()}_OK`)
process.exit(fails ? 1 : 0)
