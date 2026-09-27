#!/usr/bin/env node
// Losslessly transcode the existing v2 JSON precompute artifact into the v3 JGD3 binary
// container without a browser or GPU: read the old asset, decode values, encode with the
// production codec, write the new .bin.gz next to it, and prove the roundtrip is value-exact.
//
// Usage: node scripts/convert-drawing-precompute.mjs [path/to/jgun-sheet-v1.json.gz]
//
// Deliberately fails (exit 1) without writing anything if the roundtrip differs in any value.
import { gunzipSync, gzipSync } from 'node:zlib'
import { readFile, writeFile } from 'node:fs/promises'

const source = new URL(process.argv[2] ?? '../public/drawing/jgun-sheet-v1.json.gz', import.meta.url)
const target = new URL('../public/drawing/jgun-sheet-v2.bin.gz', import.meta.url)

// Import the production codec — the same module the site decodes with. Node runs TS with
// type stripping (v22+); if the environment lacks it, fall back to an inline copy-free
// error so nobody silently transcodes with a divergent encoder.
let codec
try {
  codec = await import(new URL('../src/scene/drawing/sheet/drawingCodec.ts', import.meta.url).href)
} catch (error) {
  console.error('Cannot import drawingCodec.ts (needs Node >= 22.6 type stripping):', error.message)
  process.exit(1)
}
const { encodeDrawingPrecompute, decodeDrawingPrecompute } = codec

const legacy = JSON.parse(gunzipSync(await readFile(source)).toString('utf8'))
const container = encodeDrawingPrecompute(legacy)
const decoded = decodeDrawingPrecompute(container)
if (!decoded) throw new Error('Encoded container failed to decode (codec bug)')

// Value-exact roundtrip proof, field by field.
const failures = []
if (decoded.version !== legacy.version) failures.push('version')
if (decoded.key !== legacy.key) failures.push('key')
for (const [name, a, b] of [
  ['segs', legacy.segs, decoded.segs],
  ['fills', legacy.fills, decoded.fills],
]) {
  if (a.length !== b.length || !a.every((v, i) => v === b[i])) failures.push(name)
}
if (legacy.profile.length !== decoded.profile.length
  || !legacy.profile.every((p, i) => p[0] === decoded.profile[i][0] && p[1] === decoded.profile[i][1])) {
  failures.push('profile')
}
if (JSON.stringify(decoded.texts) !== JSON.stringify(legacy.texts)) failures.push('texts')
if (JSON.stringify(decoded.marks) !== JSON.stringify(legacy.marks)) failures.push('marks')
if (JSON.stringify(decoded.stats) !== JSON.stringify(legacy.stats)) failures.push('stats')
if (failures.length) {
  console.error(`Roundtrip mismatch in: ${failures.join(', ')}`)
  process.exit(1)
}

// Also prove losslessness against the original JSON text: re-serializing the decoded object
// must be byte-identical to the canonical JSON.stringify of the legacy object.
const canonicalLegacy = JSON.stringify(legacy)
const canonicalDecoded = JSON.stringify(decoded)
if (canonicalLegacy !== canonicalDecoded) {
  console.error('Canonical re-serialization differs from the legacy JSON')
  process.exit(1)
}

const gzip = gzipSync(container, { level: 9 })
await writeFile(target, gzip)
console.log(JSON.stringify({
  status: 'converted',
  source: source.pathname.split('/').pop(),
  target: target.pathname.split('/').pop(),
  exact: true,
  legacyJsonBytes: Buffer.byteLength(canonicalLegacy),
  containerBytes: container.length,
  gzipBytes: gzip.length,
  legacyGzipBytes: (await readFile(source)).length,
}, null, 2))
