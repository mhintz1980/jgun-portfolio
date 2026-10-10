import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The shell boundary: src/shared/** carries no scroll length and imports almost nothing, and
// src/scene/rl300/** reaches outside itself only through the shell and sectionRenderPass.
// Structure section 2, contract rules.

const SHARED_DIR = fileURLToPath(new URL('.', import.meta.url))
const SCENE_DIR = path.resolve(SHARED_DIR, '..', 'scene')
const RL300_DIR = path.join(SCENE_DIR, 'rl300')
const SECTION_RENDER_PASS = path.join(SCENE_DIR, 'sectionRenderPass')

const SCROLL_LENGTH = /scrollHeight|scrollY|scrollTop|innerHeight|\d+\s*vh\b|lenis|ScrollTrigger/i
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/

/** Remove block and line comments, but keep `://` (a URL scheme is not a comment). */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const CLAUSE = String.raw`(?:type\s+)?(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\}|[\w$]+(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+[\w$]+))?)`
const FROM_IMPORT = new RegExp(String.raw`\b(?:import|export)\s+${CLAUSE}\s*from\s*['"]([^'"]+)['"]`, 'g')
const SIDE_EFFECT_IMPORT = /\bimport\s*['"]([^'"]+)['"]/g
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g

/** Every module specifier the source imports or re-exports, comments stripped first. */
function importSpecifiers(src: string): string[] {
  const code = stripComments(src)
  const found: string[] = []
  for (const re of [FROM_IMPORT, SIDE_EFFECT_IMPORT, DYNAMIC_IMPORT]) {
    for (const match of code.matchAll(re)) found.push(match[1])
  }
  return found
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out.sort()
}

const rel = (file: string) => path.relative(path.resolve(SHARED_DIR, '..', '..'), file).split(path.sep).join('/')
const isUnder = (file: string, dir: string) => {
  const r = path.relative(dir, file)
  return r !== '' && !r.startsWith('..') && !path.isAbsolute(r)
}
const isRelative = (specifier: string) => specifier.startsWith('.')
const withoutExtension = (file: string) => file.replace(/\.[cm]?[jt]sx?$/, '')

const sharedFiles = walk(SHARED_DIR)
const sharedSourceFiles = sharedFiles.filter((file) => !TEST_FILE.test(file))
const rl300Files = walk(RL300_DIR).filter((file) => /\.[cm]?[jt]sx?$/.test(file))

describe('boundary helpers', () => {
  it('stripComments removes block and line comments but not a URL scheme', () => {
    const src = ['const a = 1 // innerHeight', '/* scrollTop */ const b = 2', 'const u = "https://x.test/a"', '/**', ' * lenis', ' */'].join('\n')
    const out = stripComments(src)
    expect(out).not.toMatch(/innerHeight|scrollTop|lenis/)
    expect(out).toContain('const a = 1')
    expect(out).toContain('const b = 2')
    expect(out).toContain('https://x.test/a')
  })

  it('importSpecifiers finds import-from, export-from, side-effect and dynamic imports', () => {
    const src = [
      "import a from './a'",
      "import { b, type C } from '../b'",
      "import type { D } from './d'",
      "import * as e from 'pkg-e'",
      "import f, { g } from 'pkg-f'",
      'import {',
      '  h,',
      '  i,',
      "} from './multi'",
      "export { j } from './j'",
      "export * from './k'",
      "export * as l from './l'",
      "import './side'",
      "const m = import('./dyn')",
      "// import n from './commented'",
      "/* import o from './blocked' */",
    ].join('\n')
    expect(importSpecifiers(src).sort()).toEqual(
      ['./a', '../b', './d', 'pkg-e', 'pkg-f', './multi', './j', './k', './l', './side', './dyn'].sort(),
    )
  })

  it('finds the directories it scans', () => {
    expect(sharedSourceFiles.length).toBeGreaterThan(0)
    expect(rl300Files.length).toBeGreaterThan(0)
  })
})

describe('Rule 1: the shell carries no scroll length', () => {
  it.each(sharedSourceFiles.map((file) => [rel(file), file] as const))('%s', (name, file) => {
    const code = stripComments(readFileSync(file, 'utf8'))
    const hit = SCROLL_LENGTH.exec(code)
    expect(hit === null ? null : `${name} mentions "${hit[0]}"`).toBeNull()
  })
})

describe('Rule 2: src/shared imports only ./* and react (PageNav.tsx only)', () => {
  it.each(sharedSourceFiles.map((file) => [rel(file), file] as const))('%s', (name, file) => {
    const allowedPackage = path.basename(file) === 'PageNav.tsx' ? 'react' : null
    const bad = importSpecifiers(readFileSync(file, 'utf8')).filter((specifier) => {
      if (specifier === allowedPackage) return false
      if (!isRelative(specifier)) return true
      return !isUnder(path.resolve(path.dirname(file), specifier), SHARED_DIR)
    })
    expect(bad, `${name} imports`).toEqual([])
  })
})

describe('Rule 3: src/scene/rl300 imports only ./*, ../sectionRenderPass, ../../shared/* and packages', () => {
  it.each(rl300Files.map((file) => [rel(file), file] as const))('%s', (name, file) => {
    const bad = importSpecifiers(readFileSync(file, 'utf8')).filter((specifier) => {
      if (!isRelative(specifier)) return false
      const resolved = path.resolve(path.dirname(file), specifier)
      if (isUnder(resolved, RL300_DIR)) return false
      if (isUnder(resolved, SHARED_DIR)) return false
      return withoutExtension(resolved) !== SECTION_RENDER_PASS
    })
    expect(bad, `${name} imports`).toEqual([])
  })
})
