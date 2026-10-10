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

/**
 * Remove block and line comments, but not string contents and not `://` (a URL scheme is not a
 * comment). A character scanner: single-quoted, double-quoted and template literals are copied
 * through whole, with backslash escapes, so a `//` or `/*` inside a string cannot hide code.
 * Limits: regex literals are not tokenized, so a quote, a double slash or a slash-star inside one
 * (reachable unescaped only inside a character class) is misread, and so is a quote in JSX text.
 * A single- or double-quoted string ends at a line break, which bounds the damage to one line.
 * None of the scanned files contains such a regex.
 */
function stripComments(src: string): string {
  let out = ''
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    const next = src[i + 1]
    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2)
      i = end === -1 ? src.length : end + 2
      out += ' '
    } else if (ch === '/' && next === '/' && src[i - 1] !== ':') {
      while (i < src.length && src[i] !== '\n') i += 1
    } else if (ch === "'" || ch === '"' || ch === '`') {
      const start = i
      i += 1
      while (i < src.length && src[i] !== ch && (ch === '`' || src[i] !== '\n')) {
        i += src[i] === '\\' ? 2 : 1
      }
      i = Math.min(src.length, src[i] === ch ? i + 1 : i)
      out += src.slice(start, i)
    } else {
      out += ch
      i += 1
    }
  }
  return out
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

  describe('stripComments is string-literal aware', () => {
    it('keeps code after a // inside a single-quoted string', () => {
      const out = stripComments("const s = 'a//b'; const h = innerHeight")
      expect(SCROLL_LENGTH.exec(out)?.[0]).toBe('innerHeight')
    })

    it('keeps code after a quoted /* that a later */ would otherwise close', () => {
      const src = ["const a = '/*'", 'const h = innerHeight', "const b = '*/'"].join('\n')
      expect(SCROLL_LENGTH.exec(stripComments(src))?.[0]).toBe('innerHeight')
    })

    it('does not let a double-quoted /* swallow code up to a real block comment end', () => {
      const src = ['const a = "/*"', 'const h = scrollTop', '/* real */ const z = 1'].join('\n')
      const out = stripComments(src)
      expect(SCROLL_LENGTH.exec(out)?.[0]).toBe('scrollTop')
      expect(out).not.toContain('real')
      expect(out).toContain('const z = 1')
    })

    it('sees code after // or /* inside a template literal', () => {
      const sameLine = 'const t = `a // ${innerHeight}`'
      expect(SCROLL_LENGTH.exec(stripComments(sameLine))?.[0]).toBe('innerHeight')
      const multiLine = ['const t = `/*', '${scrollY}`', "const e = '*/'"].join('\n')
      expect(SCROLL_LENGTH.exec(stripComments(multiLine))?.[0]).toBe('scrollY')
    })

    it('honours backslash escapes, so an escaped quote does not end the string', () => {
      const src = String.raw`const q = 'it\'s //'; const h = innerHeight`
      expect(SCROLL_LENGTH.exec(stripComments(src))?.[0]).toBe('innerHeight')
    })

    it('still strips real line and block comments, including ones that hold quotes', () => {
      const src = [
        'const a = 1 // innerHeight',
        '/* lenis */ const b = 2',
        "// don't scrollTop",
        '/* it\'s ScrollTrigger */',
        'const u = "https://x.test/a" // 100vh',
      ].join('\n')
      const out = stripComments(src)
      expect(SCROLL_LENGTH.exec(out)).toBeNull()
      expect(out).toContain('const a = 1')
      expect(out).toContain('const b = 2')
      expect(out).toContain('"https://x.test/a"')
    })
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
