#!/usr/bin/env node
// Launch gate for dist/ (studiomark.dev): run after `npm run build`, before any deploy.
// Fails closed (exit 1) when a required page or asset is missing, or when anything M249 ships.
// Usage: node scripts/verify-launch-dist.mjs [--dist=dist]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distArg = process.argv.find((arg) => arg.startsWith('--dist='))
const DIST = path.resolve(ROOT, distArg ? distArg.slice('--dist='.length) : 'dist')

const REQUIRED = [
  'index.html',
  'torque-wrench/index.html',
  'quiet-machine/index.html',
  'models/Default.glb',
  'models/knurling-tool.glb',
  'models/manufacturing-core-full.glb',
  'models/manufacturing-core-lite.glb',
  'models/msp-enclosure.glb',
  'models/rl300-lite.glb',
  'models/rl300-extra-parts.glb',
  'models/role-map.json',
  'draco/draco_decoder.js',
  'draco/draco_decoder.wasm',
  'draco/draco_wasm_wrapper.js',
  'drawing/jgun-sheet-v2.bin.gz',
  ...[1, 2, 3, 4, 5, 6, 7].flatMap((n) => [`images/rl300-shot-0${n}-poster.webp`, `images/rl300-shot-0${n}-poster-960.webp`]),
  ...['assembled-finale', 'cool-stress', 'cutter-exit', 'hobbed', 'material-attempts', 'revised-blank', 'support-after', 'support-before']
    .flatMap((name) => [`inspection/shaft/${name}-desktop.webp`, `inspection/shaft/${name}-narrow.webp`]),
]

// Text files that ship code or markup; M249 must not appear in any of them.
const TEXT_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.txt', '.svg', '.map'])
const M249 = /m249/i

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const failures = []
const warnings = []

if (!existsSync(DIST)) {
  console.error(`verify-launch-dist: ${DIST} does not exist. Run npm run build first.`)
  process.exit(1)
}

for (const file of REQUIRED) {
  const full = path.join(DIST, file)
  if (!existsSync(full)) failures.push(`missing ${file}`)
  else if (statSync(full).size === 0) failures.push(`empty ${file}`)
}

const files = walk(DIST)
for (const full of files) {
  const rel = path.relative(DIST, full).split(path.sep).join('/')
  if (M249.test(rel)) failures.push(`M249 file shipped: ${rel}`)
  if (TEXT_EXT.has(path.extname(full)) && M249.test(readFileSync(full, 'utf8'))) failures.push(`M249 reference in ${rel}`)
  if (/^assets\/draco_/.test(rel)) warnings.push(`unused hashed Draco copy: ${rel}`)
}

// The root is a redirect shell and must not pull the legacy root app.
const rootHtml = existsSync(path.join(DIST, 'index.html')) ? readFileSync(path.join(DIST, 'index.html'), 'utf8') : ''
if (/<script[^>]+type="module"/.test(rootHtml)) failures.push('dist/index.html loads a module script (legacy root app shipped)')
if (!rootHtml.includes("'/torque-wrench/'")) failures.push('dist/index.html does not forward to /torque-wrench/')

const bytes = files.reduce((sum, full) => sum + statSync(full).size, 0)
for (const line of warnings) console.warn(`WARN  ${line}`)
if (failures.length) {
  for (const line of failures) console.error(`FAIL  ${line}`)
  console.error(`verify-launch-dist: ${failures.length} failure(s) in ${DIST}`)
  process.exit(1)
}
console.log(`verify-launch-dist: OK — ${files.length} files, ${(bytes / 1048576).toFixed(2)} MB, ${REQUIRED.length} required present, zero M249.`)
