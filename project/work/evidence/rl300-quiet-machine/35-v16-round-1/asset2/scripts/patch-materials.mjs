// Round 2 material map: add the eight MAN extras (glbPrims null), drop the fused key MAN-6650459107-1.
// Equivalent to re-running make-materials-json.mjs with the eight names in EXTRAS and the old key excluded; patching
// the round-1 output keeps every other key byte-identical (round-1 writer: JSON.stringify(out), compact).
// Usage: node patch-materials.mjs <in.json> <inspect.json> <out.json>
import fs from 'node:fs'
import crypto from 'node:crypto'

const [IN, INSPECT, OUT] = process.argv.slice(2)
const text = fs.readFileSync(IN, 'utf8')
const doc = JSON.parse(text)
if (JSON.stringify(doc) !== text) throw new Error('input is not in compact JSON.stringify form')
const inspect = JSON.parse(fs.readFileSync(INSPECT, 'utf8'))
const sanitize = (n) => n.replace(/\s/g, '_').replace(/[[\].:/]/g, '')
const base = (m) => (m === null ? null : m.replace(/__SECTION$/, ''))

const OLD = 'MAN-6650459107-1'
if (!doc.parts[OLD]) throw new Error('old key missing')
const MAN = [OLD, ...[1, 2, 3, 4, 5, 6, 7].map(i => `${OLD}.00${i}`)]   // V16 object names
const exportedName = (v16Name) => (v16Name === OLD ? `${OLD}.000` : v16Name)   // GLB node names
const added = {}
for (const v of MAN) {
  const o = inspect.objects.find(x => x.n === v)
  if (!o) throw new Error('V16 object missing ' + v)
  const slots = o.slots.map(base)
  for (const m of slots) if (m !== null && !doc.materials[m]) throw new Error('unknown material ' + m)
  added[sanitize(exportedName(v))] = { v16: slots, glbPrims: null }
}
for (const k of Object.keys(added)) if (k in doc.parts && k !== OLD) throw new Error('key already present ' + k)

const parts = {}
for (const [k, v] of Object.entries(doc.parts)) {
  if (k === OLD) { Object.assign(parts, added); continue }   // old fused key replaced in place by the eight
  parts[k] = v
}
const out = { ...doc, parts }
fs.writeFileSync(OUT, JSON.stringify(out))
const buf = fs.readFileSync(OUT)
console.log(JSON.stringify({
  out: OUT, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  partsBefore: Object.keys(doc.parts).length, partsAfter: Object.keys(parts).length, oldKeyPresent: OLD in parts,
  added,
}))
