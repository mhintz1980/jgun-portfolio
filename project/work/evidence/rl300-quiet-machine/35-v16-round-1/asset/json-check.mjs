// Done-when 2: v16-part-materials.json sanity. Run: node <this file>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(here, '../../../../../..')
const file = path.join(REPO, 'src/scene/rl300/v16-part-materials.json')
const text = fs.readFileSync(file, 'utf8')
const j = JSON.parse(text)
const errs = []
if (text.includes('__SECTION')) errs.push('contains __SECTION')
if (text.includes('\n ')) errs.push('not compact')
let missing = 0
for (const [k, p] of Object.entries(j.parts)) for (const m of p.v16) if (m !== null && !j.materials[m]) { missing++; errs.push(`part ${k}: material ${m} missing`) }
for (const [k, m] of Object.entries(j.materials)) {
  for (const f of ['baseLinear', 'metalness', 'roughness', 'clearcoat', 'clearcoatRoughness', 'opacity', 'procedural', 'nonPrincipled', 'notes']) if (!(f in m)) errs.push(`${k}: ${f} missing`)
}
const bytes = Buffer.byteLength(text)
if (bytes > 150 * 1024) errs.push('larger than 150 KB: ' + bytes)
const multi = Object.values(j.parts).filter(p => p.v16.length > 1)
console.log(JSON.stringify({ file: path.relative(REPO, file), bytes, version: j.version, source: j.source, materials: Object.keys(j.materials).length, parts: Object.keys(j.parts).length,
  singleSlot: Object.values(j.parts).length - multi.length, multiSlot: multi.length, nullPrims: Object.values(j.parts).filter(p => p.glbPrims === null).length,
  procedural: Object.values(j.materials).filter(m => m.procedural).length, nonPrincipled: Object.values(j.materials).filter(m => m.nonPrincipled).length,
  withClearcoat: Object.values(j.materials).filter(m => m.clearcoat > 0).length, sectionVariantOf: Object.values(j.materials).filter(m => m.sectionVariantOf).length, missing }))
if (errs.length) { console.log('JSON_FAIL'); for (const e of errs) console.log('  ', e); process.exit(1) }
console.log('JSON_OK')
