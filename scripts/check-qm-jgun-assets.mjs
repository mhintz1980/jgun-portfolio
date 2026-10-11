#!/usr/bin/env node
// U.4 asset compare: proves a Quiet Machine commit left the JGUN entry's static asset set unchanged.
//
//   node scripts/check-qm-jgun-assets.mjs <baseOut> <newOut> --base-root <dir> --new-root <dir> [--append <md>] [--label <QMn>]
//
// Each <out> is a `vite build --sourcemap --manifest` output directory. The compare follows the
// entry key `index.html` through `imports` only (never `dynamicImports`) to get the static closure,
// then checks (a) the stylesheets that index.html links and (b) the union of `sources` across the
// closure chunks' source maps, made relative to that build's own root so two worktrees compare.
//
// Exit 0 only if cssEqual and sourcesEqual. Exit 1 on a difference. Exit 2 on a usage or I/O error.
//
// dynamicEntries (informational, added in QM4): the verdict above sees only the static closure of
// `index.html`. For every key in the NEW manifest's `index.html` `dynamicImports` that also exists in
// the base manifest, dynamicEntries reports { key, kind, srcEqual, cssEqual, sourcesAdded,
// sourcesRemoved } over that entry's own closure: its `imports` and its nested `dynamicImports` (a
// chunk that is itself an entry contributes only its `imports`, so the walk never becomes the whole
// app). `srcEqual` compares the manifest `src` of the entry on the two sides; `cssEqual` compares the
// content of the stylesheets the closure carries; sources are normalised as for the verdict. A key
// that is a shared chunk (a `_` prefix and a content hash) is matched to the base by its chunk
// `name`. `kind: 'qm-preview'` marks the QuietMachinePreview subtree, which QM3-QM10 change by design;
// every other entry is `kind: 'other'`. dynamicEntries NEVER changes the exit code and never exits 2:
// a problem reading one entry is reported as `error` on that entry.

import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ENTRY_KEY = 'index.html'

function fail(message) {
  console.error(`check-qm-jgun-assets: ${message}`)
  process.exit(2)
}

/** Git Bash hands node `/c/...` paths. Native Windows node needs `C:/...`. */
function nativePath(p) {
  if (process.platform === 'win32') {
    const m = /^\/([a-zA-Z])(?:\/(.*))?$/.exec(p)
    if (m) return `${m[1].toUpperCase()}:/${m[2] ?? ''}`
  }
  return p
}

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const value = argv[i + 1]
      if (value === undefined || value.startsWith('--')) fail(`missing value for ${arg}`)
      flags[arg.slice(2)] = value
      i += 1
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

function readJson(file) {
  if (!existsSync(file)) fail(`missing file: ${file}`)
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    return fail(`cannot parse ${file}: ${error.message}`)
  }
}

/** Static closure of the entry key: follow `imports` recursively, never `dynamicImports`. */
function staticClosure(manifest, outDir) {
  if (!manifest[ENTRY_KEY]) fail(`${outDir}: manifest has no "${ENTRY_KEY}" key`)
  const seen = new Set()
  const order = []
  const visit = (key) => {
    if (seen.has(key)) return
    seen.add(key)
    const chunk = manifest[key]
    if (!chunk) fail(`${outDir}: manifest has no key "${key}" (imported by a closure chunk)`)
    order.push(key)
    for (const next of chunk.imports ?? []) visit(next)
  }
  visit(ENTRY_KEY)
  return order.map((key) => ({ key, ...manifest[key] }))
}

/** Stylesheet files named by `<link rel="stylesheet">` in <out>/index.html, in link order. */
function linkedStylesheets(outDir) {
  const htmlFile = path.join(outDir, 'index.html')
  if (!existsSync(htmlFile)) fail(`missing file: ${htmlFile}`)
  const html = readFileSync(htmlFile, 'utf8')
  const hrefs = []
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel\s*=\s*["']?stylesheet\b/i.test(tag)) continue
    const href = /\bhref\s*=\s*"([^"]*)"|\bhref\s*=\s*'([^']*)'|\bhref\s*=\s*([^\s>]+)/i.exec(tag)
    if (href) hrefs.push(href[1] ?? href[2] ?? href[3])
  }
  return hrefs.map((href) => path.join(outDir, href.split(/[?#]/)[0].replace(/^\/+/, '')))
}

function cssHash(outDir) {
  const hash = createHash('sha256')
  const files = linkedStylesheets(outDir)
  for (const file of files) {
    if (!existsSync(file)) fail(`missing stylesheet: ${file}`)
    hash.update(readFileSync(file))
  }
  return { hash: hash.digest('hex'), files }
}

/** One map `sources` entry, made relative to the build root with forward slashes when it is path-like. */
function normaliseSource(source, mapFile, root) {
  const pathLike = source.startsWith('.') || path.isAbsolute(source)
  if (!pathLike) return source
  const resolved = path.resolve(path.dirname(mapFile), source)
  return path.relative(root, resolved).split(path.sep).join('/')
}

/** `sources` of every closure chunk's map, made relative to the build root with forward slashes. */
function closureSources(closure, outDir, root) {
  const sources = new Set()
  for (const chunk of closure) {
    const mapFile = path.join(outDir, `${chunk.file}.map`)
    const map = readJson(mapFile)
    for (const source of map.sources ?? []) sources.add(normaliseSource(source, mapFile, root))
  }
  return sources
}

const QM_PREVIEW = /QuietMachinePreview/

/** Keys reachable from `key` by `imports` and nested `dynamicImports`; an entry chunk gives only its `imports`. */
function dynamicClosure(manifest, key) {
  const seen = new Set()
  const order = []
  const visit = (next) => {
    if (seen.has(next)) return
    seen.add(next)
    const chunk = manifest[next]
    if (!chunk) return
    order.push(next)
    for (const item of chunk.imports ?? []) visit(item)
    if (!chunk.isEntry) for (const item of chunk.dynamicImports ?? []) visit(item)
  }
  visit(key)
  return order
}

/** Normalised sources, a content hash of the carried stylesheets and the entry's `src`, for one side. */
function dynamicSummary(manifest, key, outDir, root) {
  const sources = new Set()
  const cssFiles = new Set()
  for (const item of dynamicClosure(manifest, key)) {
    const chunk = manifest[item]
    const mapFile = path.join(outDir, `${chunk.file}.map`)
    if (existsSync(mapFile)) {
      for (const source of JSON.parse(readFileSync(mapFile, 'utf8')).sources ?? []) {
        sources.add(normaliseSource(source, mapFile, root))
      }
    }
    for (const css of chunk.css ?? []) cssFiles.add(path.join(outDir, css))
  }
  const digests = [...cssFiles].map((file) => createHash('sha256').update(readFileSync(file)).digest('hex')).sort()
  return { src: manifest[key].src ?? null, sources, css: createHash('sha256').update(digests.join(',')).digest('hex') }
}

/** The base manifest key for a new dynamic entry: the same key, else the one dynamic entry of that `name`. */
function baseKeyFor(baseManifest, key, chunk) {
  if (baseManifest[key]) return key
  if (!chunk.name) return null
  const same = Object.keys(baseManifest).filter(
    (candidate) => baseManifest[candidate].isDynamicEntry && baseManifest[candidate].name === chunk.name,
  )
  return same.length === 1 ? same[0] : null
}

/** Informational only. Never throws, never changes the exit code. */
function dynamicEntries(baseOut, newOut, baseRoot, newRoot) {
  try {
    const baseManifest = JSON.parse(readFileSync(path.join(baseOut, '.vite', 'manifest.json'), 'utf8'))
    const newManifest = JSON.parse(readFileSync(path.join(newOut, '.vite', 'manifest.json'), 'utf8'))
    const entries = []
    for (const key of newManifest[ENTRY_KEY]?.dynamicImports ?? []) {
      const chunk = newManifest[key]
      if (!chunk) continue
      const baseKey = baseKeyFor(baseManifest, key, chunk)
      if (baseKey === null) continue
      const kind = QM_PREVIEW.test(key) || QM_PREVIEW.test(chunk.src ?? '') ? 'qm-preview' : 'other'
      const named = baseKey === key ? { key, kind } : { key, baseKey, kind }
      try {
        const base = dynamicSummary(baseManifest, baseKey, baseOut, baseRoot)
        const next = dynamicSummary(newManifest, key, newOut, newRoot)
        entries.push({
          ...named,
          srcEqual: base.src === next.src,
          cssEqual: base.css === next.css,
          sourcesAdded: [...next.sources].filter((s) => !base.sources.has(s)).sort(),
          sourcesRemoved: [...base.sources].filter((s) => !next.sources.has(s)).sort(),
        })
      } catch (error) {
        entries.push({ ...named, error: String(error.message ?? error) })
      }
    }
    return entries
  } catch (error) {
    return [{ error: String(error.message ?? error) }]
  }
}

function summarise(outDir, root) {
  const manifest = readJson(path.join(outDir, '.vite', 'manifest.json'))
  const closure = staticClosure(manifest, outDir)
  const css = cssHash(outDir)
  const sources = closureSources(closure, outDir, root)
  // One request per closure chunk, one per linked stylesheet, one for the HTML document.
  return { css, chunks: closure.length, requests: closure.length + css.files.length + 1, sources }
}

function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  if (positional.length !== 2 || !flags['base-root'] || !flags['new-root']) {
    fail('usage: check-qm-jgun-assets.mjs <baseOut> <newOut> --base-root <dir> --new-root <dir> [--append <md>] [--label <QMn>]')
  }
  const baseOut = path.resolve(nativePath(positional[0]))
  const newOut = path.resolve(nativePath(positional[1]))
  const baseRoot = path.resolve(nativePath(flags['base-root']))
  const newRoot = path.resolve(nativePath(flags['new-root']))

  const base = summarise(baseOut, baseRoot)
  const next = summarise(newOut, newRoot)

  const sourcesAdded = [...next.sources].filter((s) => !base.sources.has(s)).sort()
  const sourcesRemoved = [...base.sources].filter((s) => !next.sources.has(s)).sort()
  const result = {
    cssHashBase: base.css.hash,
    cssHashNew: next.css.hash,
    cssEqual: base.css.hash === next.css.hash,
    sourcesEqual: sourcesAdded.length === 0 && sourcesRemoved.length === 0,
    sourcesAdded,
    sourcesRemoved,
    chunksBase: base.chunks,
    chunksNew: next.chunks,
    requestsBase: base.requests,
    requestsNew: next.requests,
    dynamicEntries: dynamicEntries(baseOut, newOut, baseRoot, newRoot),
  }
  const json = JSON.stringify(result, null, 2)
  console.log(json)

  if (flags.append) {
    const target = path.resolve(nativePath(flags.append))
    mkdirSync(path.dirname(target), { recursive: true })
    const label = flags.label ?? 'compare'
    const verdict = result.cssEqual && result.sourcesEqual ? 'PASS' : 'FAIL'
    const section = [
      '',
      `### U.4 ${label}`,
      '',
      `Compare of \`${positional[1]}\` against \`${positional[0]}\`: ${verdict}.`,
      'chunks = JS chunks in the static closure of `index.html`; requests = chunks + linked stylesheets + 1 HTML document.',
      'dynamicEntries is informational (dynamic entries of `index.html` present in both builds) and never changes the verdict.',
      '',
      '```json',
      json,
      '```',
      '',
    ].join('\n')
    appendFileSync(target, section)
  }

  process.exit(result.cssEqual && result.sourcesEqual ? 0 : 1)
}

main()
