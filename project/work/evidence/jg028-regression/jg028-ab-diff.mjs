/**
 * A/B diff for the JG-028 regression census (throwaway).
 * Compares baseline (pre-JG-028) vs current (JG-028) census.json:
 *  - scene census: meshes keyed by (parent, verts, bbox) → material signature
 *  - per-stop telemetry deep-diff with tolerance
 */
import fs from 'node:fs'

const read = (dir) => JSON.parse(fs.readFileSync(`${dir}/census.json`, 'utf8'))
const A = read(process.argv[2] || '.scratch/jg028-regression/baseline')
const B = read(process.argv[3] || '.scratch/jg028-regression/current')

const sig = (m) => JSON.stringify(m.mat)
const key = (m) => `${m.parent}|${m.verts}|${(m.bbox || []).join(',')}`

function censusDiff(phase) {
  const a = A['census' + phase]
  const b = B['census' + phase]
  if (!a || !b || a.error || b.error) return { phase, error: 'missing census' }
  const out = {
    phase,
    meshCount: [a.meshCount, b.meshCount],
    ghostMaterials: [a.ghostMaterialCount, b.ghostMaterialCount],
    lcdCluster: [a.lcdClusterPresent, b.lcdClusterPresent],
    onlyInBaseline: [],
    onlyInCurrent: [],
    materialChanged: [],
  }
  const index = (list) => {
    const m = new Map()
    for (const mesh of list) {
      const k = key(mesh)
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(mesh)
    }
    return m
  }
  const [ia, ib] = [index(a.meshes), index(b.meshes)]
  for (const [k, list] of ia) {
    if (!ib.has(k)) {
      out.onlyInBaseline.push(...list.map((m) => ({ ...m, mat: JSON.parse(sig(m)) })))
      continue
    }
    const bList = ib.get(k)
    const bSigs = new Set(bList.map(sig))
    for (const mesh of list) {
      if (!bSigs.has(sig(mesh)))
        out.materialChanged.push({
          parent: mesh.parent,
          verts: mesh.verts,
          bbox: mesh.bbox,
          before: JSON.parse(sig(mesh)),
          afterSigs: [...new Set(bList.map((m) => JSON.parse(sig(m))))],
        })
    }
  }
  for (const [k, list] of ib) {
    if (!ia.has(k)) out.onlyInCurrent.push(...list.map((m) => ({ ...m, mat: JSON.parse(sig(m)) })))
  }
  // handle subtree material sets
  out.handleMaterials = {
    before: [...new Set(a.handleMeshes.map(sig))].map((s) => JSON.parse(s)),
    after: [...new Set(b.handleMeshes.map(sig))].map((s) => JSON.parse(s)),
  }
  return out
}

const TELE_TOL = 1e-3
function deepDiff(a, b, path, out) {
  if (typeof a === 'number' && typeof b === 'number') {
    if (Math.abs(a - b) > TELE_TOL) out.push({ path, before: a, after: b, delta: +(b - a).toFixed(5) })
    return
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      out.push({ path, before: a, after: b })
      return
    }
    a.forEach((v, i) => deepDiff(v, b[i], `${path}[${i}]`, out))
    return
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) deepDiff(a[k], b[k], `${path}.${k}`, out)
    return
  }
  if (a !== b) out.push({ path, before: a, after: b })
}

const result = {
  rest: censusDiff('AtRest'),
  end: censusDiff('AtEnd'),
  telemetryDiffs: {},
  pageErrors: { baseline: A.pageErrors, current: B.pageErrors },
}
for (const key of Object.keys(A)) {
  if (key.startsWith('stop_')) {
    const diffs = []
    deepDiff(A[key]?.telemetry, B[key]?.telemetry, key, diffs)
    result.telemetryDiffs[key] = {
      baselineReached: A[key]?.reached,
      currentReached: B[key]?.reached,
      diffs,
    }
  }
}

fs.writeFileSync('.scratch/jg028-regression/ab-diff.json', JSON.stringify(result, null, 1))
// compact console summary
const brief = (c) => ({
  meshCount: c.meshCount,
  ghost: c.ghostMaterials,
  onlyBaseline: c.onlyInBaseline.length,
  onlyCurrent: c.onlyInCurrent.length,
  materialChanged: c.materialChanged.length,
})
console.log(JSON.stringify({ rest: brief(result.rest), end: brief(result.end) }, null, 1))
console.log('--- materialChanged (rest) ---')
for (const c of result.rest.materialChanged)
  console.log(`${c.parent} verts=${c.verts} bbox=[${c.bbox}] ${c.before.color}/${c.before.type} -> ${c.afterSigs.map((s) => s.color + '/' + s.type).join(' | ')}`)
console.log('--- onlyInCurrent (rest) ---')
for (const m of result.rest.onlyInCurrent)
  console.log(`${m.parent} verts=${m.verts} ${m.mat.color} r${m.mat.roughness} m${m.mat.metalness} ${m.mat.emissive ?? ''}`)
console.log('--- onlyInBaseline (rest) ---')
for (const m of result.rest.onlyInBaseline)
  console.log(`${m.parent} verts=${m.verts} ${m.mat.color} r${m.mat.roughness} m${m.mat.metalness} ${m.mat.emissive ?? ''}`)
console.log('--- telemetry diffs per stop ---')
for (const [k, v] of Object.entries(result.telemetryDiffs))
  console.log(k, 'reached', v.baselineReached, '/', v.currentReached, 'diffs:', v.diffs.length, v.diffs.slice(0, 6))
