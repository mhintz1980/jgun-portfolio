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

/** `sources` of every closure chunk's map, made relative to the build root with forward slashes. */
function closureSources(closure, outDir, root) {
  const sources = new Set()
  for (const chunk of closure) {
    const mapFile = path.join(outDir, `${chunk.file}.map`)
    const map = readJson(mapFile)
    for (const source of map.sources ?? []) {
      const pathLike = source.startsWith('.') || path.isAbsolute(source)
      if (!pathLike) {
        sources.add(source)
        continue
      }
      const resolved = path.resolve(path.dirname(mapFile), source)
      sources.add(path.relative(root, resolved).split(path.sep).join('/'))
    }
  }
  return sources
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
