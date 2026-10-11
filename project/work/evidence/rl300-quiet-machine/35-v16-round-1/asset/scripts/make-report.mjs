// Assembles report.json from build-stats.json, glb-table.json, mapping-stats.json and file hashes.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const asset = path.resolve(here, '..')
const REPO = path.resolve(asset, '../../../../../..')
const rd = (f) => JSON.parse(fs.readFileSync(path.join(asset, f), 'utf8'))
const stats = rd('build-stats.json'), glb = rd('glb-table.json'), map = rd('mapping-stats.json')
const hash = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')
const g = path.join(REPO, 'public/models/rl300-extra-parts.glb'), j = path.join(REPO, 'src/scene/rl300/v16-part-materials.json')
const decim = Object.entries(stats.objects).map(([name, o]) => ({
  name, kind: o.kind, material: o.material, trisBefore: o.tris_before, trisAfter: o.tris_after, budget: o.budget ?? null,
  islandsBeforeWelded: o.islands_before, islandsAfterWelded: o.islands_after, bboxChangeMm: +o.bbox_change_mm.toFixed(4),
  devDstToSrcMaxMm: o.dev ? +o.dev.dst_to_src_max_mm.toFixed(3) : null, devSrcToDstMaxMm: o.dev ? +o.dev.src_to_dst_max_mm.toFixed(3) : null,
  method: o.method ?? 'unchanged (triangulated)', reusedFrom: o.reused_from ?? null,
}))
const report = {
  generatedBy: 'asset seat (Sonnet 5.5)',
  v16Source: { sha256: '788ae2a2a2f784c56e70c16e81365b82fa0d236a48acce261855f4a7aa9d6146', note: 'scratch copy V16-copy.blend; never saved over' },
  outputs: {
    glb: { path: 'public/models/rl300-extra-parts.glb', bytes: fs.statSync(g).size, sha256: hash(g), totalTris: glb.totalTris, note: 'matched by .gitignore public/models/*.glb: needs git add -f' },
    json: { path: 'src/scene/rl300/v16-part-materials.json', bytes: fs.statSync(j).size, sha256: hash(j) },
  },
  counts: map.counts, mapping: map.mapStats, materialCount: map.materialCount, partCount: map.partCount,
  decimation: decim, twinCheck: stats.twin_check, nodes: glb.table, notes: glb.notes,
  lens: stats.lens, stainless: stats.stainless, glbMaterials: stats.materials, config: stats.config,
  faceFill: stats.objects['BREP1.002'].fill && { holesTotal: stats.objects['BREP1.002'].fill.holes_total, holesFilled: stats.objects['BREP1.002'].fill.holes_filled,
    holesKept: stats.objects['BREP1.002'].fill.holes_kept, rimVerts: stats.objects['BREP1.002'].fill.rim_verts, epsOuterMm: stats.objects['BREP1.002'].fill.eps_outer_mm },
}
fs.writeFileSync(path.join(asset, 'report.json'), JSON.stringify(report, null, 1))
console.log('report.json', fs.statSync(path.join(asset, 'report.json')).size)
