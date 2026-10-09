import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const argOf = name => {
  const prefix = '--' + name + '='
  const inline = args.find(value => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = args.indexOf('--' + name)
  return index >= 0 ? args[index + 1] : null
}
const dirText = argOf('dir'), urlText = argOf('url')
if (!dirText || !urlText) throw new Error('usage: node finalize-owner-revision-captures.mjs --dir DIR --url URL')
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../../../../')
const dir = path.resolve(root, dirText)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

async function servedProvenance() {
  const indexResponse = await fetch(urlText)
  if (!indexResponse.ok) throw new Error('served index fetch failed: ' + indexResponse.status)
  const indexBytes = Buffer.from(await indexResponse.arrayBuffer())
  const pattern = new RegExp('assets/[A-Za-z0-9_.-]+[.]js', 'g')
  const queue = [...new Set([...indexBytes.toString('utf8').matchAll(pattern)].map(match => match[0]))]
  const seen = new Set(queue), assets = []
  while (queue.length) {
    const asset = queue.shift(), response = await fetch(new URL(asset, urlText))
    if (!response.ok) throw new Error('served asset fetch failed: ' + asset + ':' + response.status)
    const bytes = Buffer.from(await response.arrayBuffer())
    assets.push({ asset, sha256: sha256(bytes), bytes: bytes.length })
    for (const match of bytes.toString('utf8').matchAll(pattern)) if (!seen.has(match[0])) { seen.add(match[0]); queue.push(match[0]) }
  }
  return { indexSha256: sha256(indexBytes), assets: assets.sort((a, b) => a.asset.localeCompare(b.asset)) }
}

const sourceSets = {
  opening: [
    'src/scene/SceneCanvas.tsx', 'src/scene/drawing/sheetCamera.ts',
    'src/scene/drawing/sheet/ownerAnnotations.ts', 'src/scene/drawing/sheet/handwriting.ts',
    'src/scene/drawing/sheet/ink.ts', 'src/scene/drawing/sheet/referenceHandGlyphs.ts',
    'public/fonts/AcFastReference.ttf', 'public/drawing/jgun-sheet-v2.bin.gz', 'dist/index.html',
  ],
  shaft: [
    'src/scene/SceneCanvas.tsx', 'src/scene/inspection/shaft/fosPresentation.ts',
    'src/scene/inspection/shaft/script.ts', 'src/scene/inspection/shaft/camera.ts',
    'src/scene/inspection/shaft/progression.ts', 'src/scene/inspection/shaft/shaftRuntime.ts',
    'src/components/ShaftStoryLayer.tsx', 'src/components/StaticShaftStory.tsx', 'dist/index.html',
  ],
}
const reports = fs.readdirSync(dir, { withFileTypes: true })
  .filter(entry => entry.isFile() && /^capture-report-.*\.json$/.test(entry.name)).map(entry => path.join(dir, entry.name))
if (!reports.length) throw new Error('no capture report found')
const served = await servedProvenance()
for (const reportPath of reports) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  const kinds = [...new Set(report.captures.map(capture => capture.kind))]
  const sourceFiles = [...new Set(kinds.flatMap(kind => sourceSets[kind] ?? []))]
  const sourceProvenance = Object.fromEntries(sourceFiles.map(file => {
    try { return [file, sha256(fs.readFileSync(path.join(root, file)))] } catch { return [file, null] }
  }))
  for (const capture of report.captures) {
    const file = path.join(dir, capture.file), bytes = fs.readFileSync(file)
    if (bytes.readUInt32BE(0) !== 0x89504e47) throw new Error(capture.file + ': not PNG')
    capture.sha256 = sha256(bytes)
    capture.bytes = bytes.length
    capture.pixels = [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
    capture.qualityLockVisualOnly = true
    capture.caption = capture.kind === 'opening'
      ? 'Owner title/career reading proof, ' + capture.viewport + ' at intro t ' + capture.t + ' (qualityLock visual-only).'
      : 'Input Shaft artifact-neighbor proof at ' + capture.t + ' s (qualityLock visual-only). Residual relief geometry remains an owner decision.'
  }
  report.provenance = { sourceProvenance, servedBundle: served, note: 'Working-tree source hashes identify current inputs; served JS hashes identify the frozen build actually rendered.' }
  report.expectedCounts = { opening: 6, shaft: 9 }
  report.actualCounts = Object.fromEntries(kinds.map(kind => [kind, report.captures.filter(capture => capture.kind === kind).length]))
  report.countsPass = kinds.every(kind => report.actualCounts[kind] === report.expectedCounts[kind])
  if (!report.countsPass) report.errors.push('capture count mismatch: ' + JSON.stringify({ actual: report.actualCounts, expected: report.expectedCounts }))
  report.finalized = new Date().toISOString()
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ report: path.relative(root, reportPath), captures: report.captures.length, kinds: report.actualCounts, errors: report.errors.length }))
}
if (reports.some(reportPath => JSON.parse(fs.readFileSync(reportPath, 'utf8')).errors.length)) process.exitCode = 1
