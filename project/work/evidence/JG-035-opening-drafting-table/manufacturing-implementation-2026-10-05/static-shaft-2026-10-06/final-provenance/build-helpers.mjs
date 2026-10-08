// Derives capture-refresh.mjs from the ORIGINAL capture-completed-renders.mjs via exact
// anchored replacement (backtick-free regions only), keeping the rest byte-identical.
// encode-refresh.py is written directly next to this script. Run from the repo root.
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const here = path.join(root, 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/static-shaft-2026-10-06')

function replaceOnce(text, find, replacement, label) {
  const first = text.indexOf(find)
  if (first < 0 || text.indexOf(find, first + 1) >= 0) {
    throw new Error('anchor not unique: ' + label)
  }
  return text.slice(0, first) + replacement + text.slice(first + find.length)
}

const original = fs.readFileSync(path.join(here, 'capture-completed-renders.mjs'), 'utf8')

const oldHeader = [
  '// Read-only dev capture: three distinct completed paused renders, then DOM-hidden capture.',
  '// Never run concurrently with the manufacturing verifier. No camera, time or entry override.',
].join('\n')

const newHeader = [
  '// Parameterized copy of ../capture-completed-renders.mjs for a possible final-source refresh.',
  '// Only difference from the original: explicit --url and --out arguments (the original',
  '// hardcoded http://localhost:5199 and a sibling output dir); the report also records out.',
  '// Capture semantics preserved verbatim: real DOM #inspection-seek with the native value',
  "// setter (step='any'), exact Vite live-store URL import plus telemetry-identity guard,",
  '// three distinct completed-render stamps with entryElapsed >= 1.2, DOM-hidden screenshot,',
  '// camera-drift and support-pair checks. All target times sit on the 0.01 grid. Never run',
  '// concurrently with the manufacturing verifier. No camera, time or entry override.',
  '// Usage: node capture-refresh.mjs --url http://localhost:<port> --out <capture-output-dir>',
].join('\n')

const oldPaths = [
  "const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'completed-render-capture')",
  "const url = 'http://localhost:5199'",
].join('\n')

const newPaths = [
  'const argv = process.argv.slice(2)',
  "const argOf = (name) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : null }",
  "const url = argOf('url')",
  "const outArg = argOf('out')",
  'if (!url || !outArg) {',
  "  console.error('usage: node capture-refresh.mjs --url http://localhost:<port> --out <capture-output-dir>')",
  '  process.exit(2)',
  '}',
  'const out = path.isAbsolute(outArg) ? outArg : path.resolve(process.cwd(), outArg)',
].join('\n')

let out = replaceOnce(original, oldHeader, newHeader, 'capture header')
out = replaceOnce(out, oldPaths, newPaths, 'capture out/url')
out = replaceOnce(out,
  'const report = { url, started: new Date().toISOString(),',
  'const report = { url, out, started: new Date().toISOString(),',
  'capture report fields')

fs.writeFileSync(path.join(here, 'final-provenance/capture-refresh.mjs'), out)
console.log(JSON.stringify({ written: 'final-provenance/capture-refresh.mjs', bytes: out.length }))
