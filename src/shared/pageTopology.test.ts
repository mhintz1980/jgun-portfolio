import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FADE_IN_MS, FADE_KEY, FADE_MAX_AGE_MS, FADE_OUT_MS, HOLD_CAP_MS, isFreshFlag } from './pageFade'
import { LEGACY_REDIRECTS, PAGES, pageHref } from './pages'

// Page topology: every HTML entry in PAGES carries the shell block its row calls for, byte for
// byte. The tests iterate PAGES, so a new page needs no edit here (structure section 2).

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * sha256 of the fade sub-block (`<!-- shell:fade:begin -->` through `<!-- shell:fade:end -->`,
 * markers included, CRLF normalised to LF). Changing it is a deliberate, reviewed act: with one
 * fade entry, byte parity between copies would otherwise be vacuous.
 */
const FADE_BLOCK_SHA256 = '0748289c34751d9c7f32e3387d5f5766feaeaacb98381f39aec1d1290c652561'

// Same expression as src/shared/shellBoundary.test.ts (rule 1); that file does not export it.
const SCROLL_LENGTH = /scrollHeight|scrollY|scrollTop|innerHeight|\d+\s*vh\b|lenis|ScrollTrigger/i

const entries = PAGES.filter((page) => page.htmlEntry !== null).map((page) => ({
  page,
  entry: page.htmlEntry as string,
  html: readFileSync(path.join(ROOT, page.htmlEntry as string), 'utf8').replace(/\r\n/g, '\n'),
}))

function between(text: string, begin: string, end: string): string | null {
  const from = text.indexOf(begin)
  const to = text.indexOf(end)
  if (from === -1 || to === -1 || to < from) return null
  return text.slice(from, to + end.length)
}

const shellBlock = (html: string) => between(html, '<!-- shell:begin -->', '<!-- shell:end -->')
const fadeBlock = (html: string) => between(html, '<!-- shell:fade:begin -->', '<!-- shell:fade:end -->')
const redirectBlock = (html: string) => between(html, '<!-- shell:redirect:begin -->', '<!-- shell:redirect:end -->')
const scriptBody = (block: string) => /<script>([\s\S]*?)<\/script>/.exec(block)?.[1] ?? null
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const count = (text: string, needle: string) => text.split(needle).length - 1

/** Drop HTML comments, block comments and whole-line `//` comments. */
function stripComments(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\n)[ \t]*\/\/[^\n]*/g, '$1')
}

describe('the registry and its entries', () => {
  it('lists the entries this build serves', () => {
    expect(entries.map((item) => item.entry)).toEqual(['index.html', 'quiet-machine/index.html'])
  })

  it.each(entries.map((item) => [item.entry] as const))('%s exists and names an entry module that exists', (entry) => {
    expect(existsSync(path.join(ROOT, entry))).toBe(true)
    const html = entries.find((item) => item.entry === entry)?.html ?? ''
    const src = /<script type="module" src="([^"]+)"><\/script>/.exec(html)?.[1]
    expect(src, `${entry} module script`).toBeDefined()
    expect(existsSync(path.join(ROOT, (src as string).replace(/^\//, '')))).toBe(true)
  })

  it('a reserved page has no entry, and a live page has one', () => {
    for (const page of PAGES) {
      expect(page.htmlEntry === null, page.id).toBe(page.reserved)
      expect(page.href === null, page.id).toBe(page.reserved)
    }
  })

  it('the build input follows PAGES (vite.config.ts derives it and runs without the SPA fallback)', () => {
    const config = readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8')
    expect(config).toMatch(/import \{ PAGES \} from '\.\/src\/shared\/pages'/)
    expect(config).toMatch(/PAGES\.filter\(\(page\) => page\.htmlEntry\)/)
    expect(config).toMatch(/rollupOptions:\s*\{\s*input\s*\}/)
    expect(config).toMatch(/appType: 'mpa'/)
  })
})

describe('the shell block', () => {
  it.each(entries.map((item) => [item.entry] as const))('%s has one shell block, with every sub-block inside it', (entry) => {
    const html = entries.find((item) => item.entry === entry)?.html ?? ''
    expect(count(html, '<!-- shell:begin -->')).toBe(1)
    expect(count(html, '<!-- shell:end -->')).toBe(1)
    const shell = shellBlock(html)
    expect(shell).not.toBeNull()
    for (const sub of [fadeBlock(html), redirectBlock(html)]) {
      if (sub !== null) expect((shell as string).includes(sub)).toBe(true)
    }
  })

  it('has no scroll length inside it, comments stripped', () => {
    for (const { entry, html } of entries) {
      const code = stripComments(shellBlock(html) ?? '')
      const hit = SCROLL_LENGTH.exec(code)
      expect(hit === null ? null : `${entry} mentions "${hit[0]}"`).toBeNull()
    }
  })

  it('the scroll-length expression does see a vh length and a scroll read', () => {
    expect(SCROLL_LENGTH.test(stripComments('html { height: 100vh; }'))).toBe(true)
    expect(SCROLL_LENGTH.test(stripComments('var h = innerHeight'))).toBe(true)
    expect(SCROLL_LENGTH.test(stripComments('/* 100vh */ <!-- innerHeight -->'))).toBe(false)
  })
})

describe('the fade sub-block', () => {
  it('exists in every fadeIn entry and nowhere else', () => {
    expect(PAGES.some((page) => page.fadeIn && page.htmlEntry !== null)).toBe(true)
    for (const { page, entry, html } of entries) {
      expect(fadeBlock(html) !== null, `${entry} fade block`).toBe(page.fadeIn)
    }
  })

  it('is byte for byte the reviewed block, in every copy', () => {
    for (const { page, entry, html } of entries) {
      if (!page.fadeIn) continue
      expect(sha256(fadeBlock(html) as string), `${entry} fade block sha256`).toBe(FADE_BLOCK_SHA256)
    }
  })

  it('carries the constants of pageFade.ts', () => {
    for (const { page, entry, html } of entries) {
      if (!page.fadeIn) continue
      const block = fadeBlock(html) as string
      expect(block, entry).toContain(`'${FADE_KEY}'`)
      expect(block, entry).toContain(String(FADE_MAX_AGE_MS))
      const out = /html\[data-fade="out"\]::after\s*\{[^}]*?\b(\d+)ms/.exec(block)?.[1]
      const release = /html\[data-fade="release"\]::after\s*\{[^}]*?\b(\d+)ms/.exec(block)?.[1]
      expect(Number(out), `${entry} out ramp`).toBe(FADE_OUT_MS)
      expect(Number(release), `${entry} release fade`).toBe(FADE_IN_MS)
    }
  })

  it('has a style-only safety release that cannot fire before the script-side hold cap', () => {
    // If the page script never runs (a chunk that does not load), the cover must still clear.
    for (const { page, entry, html } of entries) {
      if (!page.fadeIn) continue
      const rule = /html\[data-fade="in"\]::after\s*\{([^}]*)\}/.exec(fadeBlock(html) as string)?.[1] ?? ''
      const delay = /\bease\s+(\d+)ms/.exec(rule)?.[1]
      expect(Number(delay), `${entry} safety release delay`).toBeGreaterThan(HOLD_CAP_MS)
      expect(rule, entry).toContain('shell-fade-release')
    }
  })

  it('parses the flag the way isFreshFlag does: Number(), finite, 0 <= age < 5000', () => {
    for (const { page, html } of entries) {
      if (!page.fadeIn) continue
      const body = scriptBody(fadeBlock(html) as string) as string
      expect(body).toContain('Number(')
      expect(body).toContain('5000')
      const NOW = 1_700_000_000_000
      const flags: (string | null)[] = [
        null, '', '   ', 'soon', 'NaN', 'Infinity', '-Infinity', '1e999',
        String(NOW), String(NOW - 1), String(NOW - 4999), String(NOW - 5000), String(NOW - 60_000), String(NOW + 1),
        ` ${NOW - 10} `, '0x10', `${NOW - 100}.5`,
      ]
      for (const raw of flags) {
        const attributes: Record<string, string> = {}
        const removed: string[] = []
        const run = new Function('sessionStorage', 'document', 'Date', body)
        run(
          { getItem: () => raw, removeItem: (key: string) => void removed.push(key) },
          { documentElement: { setAttribute: (name: string, value: string) => void (attributes[name] = value) } },
          { now: () => NOW },
        )
        expect(attributes['data-fade'] === 'in', `flag ${JSON.stringify(raw)}`).toBe(isFreshFlag(raw, NOW))
        expect(removed, `flag ${JSON.stringify(raw)} is consumed`).toEqual([FADE_KEY])
      }
    }
  })

  it('does nothing, and throws nothing, when sessionStorage is unavailable', () => {
    for (const { page, html } of entries) {
      if (!page.fadeIn) continue
      const body = scriptBody(fadeBlock(html) as string) as string
      const attributes: string[] = []
      const run = new Function('sessionStorage', 'document', 'Date', body)
      const hostile = {
        getItem: () => {
          throw new Error('SecurityError')
        },
      }
      expect(() =>
        run(hostile, { documentElement: { setAttribute: (name: string) => void attributes.push(name) } }, { now: () => 1 }),
      ).not.toThrow()
      expect(attributes).toEqual([])
    }
  })
})

describe('the redirect sub-block', () => {
  const PROBES = [
    '?study=rl300',
    '?study=rl300&quality=lite',
    '?station=2',
    '?station=enclosure',
    '?station=safe-enclosure',
    '?chapter=2',
    '?station=3',
    '?station=m249',
    '?chapter=3',
    '?study=other',
    '',
  ] as const
  /** The only probes that redirect, with the URL each one must reach. Literal, not derived. */
  const EXPECTED: Record<string, string> = {
    '?study=rl300': '/quiet-machine/',
    '?study=rl300&quality=lite': '/quiet-machine/?quality=lite',
  }

  const index = entries.find((item) => item.entry === 'index.html')
  const body = scriptBody(redirectBlock(index?.html ?? '') ?? '') as string

  function run(search: string, hash = ''): string[] {
    const calls: string[] = []
    const stub = { search, hash, replace: (url: string) => void calls.push(url) }
    new Function('location', 'URLSearchParams', body)(stub, URLSearchParams)
    return calls
  }

  const covered = (search: string) => {
    const params = new URLSearchParams(search)
    return LEGACY_REDIRECTS.some((row) => {
      const value = params.get(row.param)
      return row.status === 'active' && value !== null && row.values.includes(value)
    })
  }

  it('exists in index.html and in no other entry', () => {
    for (const { entry, html } of entries) {
      expect(redirectBlock(html) !== null, entry).toBe(entry === 'index.html')
    }
    expect(body).toBeTruthy()
  })

  it('at least one redirect row is active, and every active row targets the page the script names', () => {
    const active = LEGACY_REDIRECTS.filter((row) => row.status === 'active')
    expect(active.length).toBeGreaterThan(0)
    for (const row of active) expect(row.to).toBe('quiet-machine')
    expect(pageHref('quiet-machine')).toBe('/quiet-machine/')
    expect(pageHref('quiet-machine', 'lite')).toBe(EXPECTED['?study=rl300&quality=lite'])
  })

  it.each(PROBES.map((probe) => [probe] as const))('probe "%s" redirects if and only if an active row covers it', (probe) => {
    const calls = run(probe)
    expect(calls.length > 0, `redirected: ${calls.join(',')}`).toBe(covered(probe))
    if (covered(probe)) {
      expect(EXPECTED[probe], 'expected URL for a covered probe').toBeDefined()
      expect(calls).toEqual([EXPECTED[probe]])
    } else {
      expect(calls).toEqual([])
    }
  })

  it('keeps the other params and the fragment, and drops only study', () => {
    expect(run('?study=rl300', '#air')).toEqual(['/quiet-machine/#air'])
    expect(run('?shot=.5&study=rl300&quality=poster')).toEqual(['/quiet-machine/?shot=.5&quality=poster'])
    expect(run('?study=rl300&quality=lite', '#heat')).toEqual(['/quiet-machine/?quality=lite#heat'])
  })
})
