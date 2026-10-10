import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PageLink, PageNav } from './PageNav'
import { PAGES } from './pages'

// Node environment only: react-dom/server static markup, no jsdom (the staticChapter.test.tsx pattern).

const render = (node: ReactElement) => renderToStaticMarkup(node)
const anchors = (markup: string) => markup.match(/<a\b[^>]*>/g) ?? []

describe('PageNav', () => {
  it('renders a labelled nav with the variant class', () => {
    const header = render(<PageNav current="quiet-machine" tier="full" variant="header" />)
    expect(header).toContain('<nav class="shell-nav shell-nav-header" aria-label="Pages">')
    const endcard = render(<PageNav current="quiet-machine" tier="full" variant="endcard" />)
    expect(endcard).toContain('<nav class="shell-nav shell-nav-endcard" aria-label="Pages">')
  })

  it('renders one row per page, in registry order', () => {
    const markup = render(<PageNav current="jgun" tier="full" variant="header" />)
    const positions = PAGES.map((page) => markup.indexOf(page.label))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    expect(markup.match(/<li\b/g)).toHaveLength(PAGES.length)
  })

  it('links the live pages with data-fade and an href', () => {
    const markup = render(<PageNav current="quiet-machine" tier="full" variant="header" />)
    expect(markup).toContain('<a data-fade="" href="/">TORQUE GUN</a>')
    expect(markup).toContain('data-fade="" href="/quiet-machine/"')
    for (const tag of anchors(markup)) expect(tag).toContain('data-fade=""')
  })

  it('marks only the current row with aria-current=page', () => {
    const markup = render(<PageNav current="quiet-machine" tier="full" variant="header" />)
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1)
    const current = anchors(markup).filter((tag) => tag.includes('aria-current="page"'))
    expect(current).toHaveLength(1)
    expect(current[0]).toContain('href="/quiet-machine/"')
  })

  it('renders the reserved m249 row as text, not a link, with the in-preparation wording', () => {
    const markup = render(<PageNav current="jgun" tier="full" variant="header" />)
    expect(markup).toContain('<span class="shell-nav-reserved">M249, in preparation</span>')
    expect(markup).not.toContain('/m249/')
    expect(anchors(markup)).toHaveLength(2)
    expect(anchors(markup).join('')).not.toContain('M249')
  })

  it('carries the tier onto every live link', () => {
    const lite = render(<PageNav current="jgun" tier="lite" variant="header" />)
    expect(lite).toContain('href="/?quality=lite"')
    expect(lite).toContain('href="/quiet-machine/?quality=lite"')
    const poster = render(<PageNav current="jgun" tier="poster" variant="endcard" />)
    expect(poster).toContain('href="/?quality=poster"')
    expect(poster).toContain('href="/quiet-machine/?quality=poster"')
    const full = render(<PageNav current="jgun" tier="full" variant="header" />)
    expect(full).not.toContain('quality=')
  })

  it('uses only shell-* class names, so no Tailwind-looking token is added', () => {
    const markup = render(<PageNav current="quiet-machine" tier="lite" variant="endcard" />)
    const names = [...markup.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(/\s+/))
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(name).toMatch(/^shell-[a-z-]+$/)
  })
})

describe('PageLink', () => {
  it('renders a live page as an anchor with data-fade', () => {
    const markup = render(
      <PageLink id="quiet-machine" tier="full">
        Next
      </PageLink>,
    )
    expect(markup).toBe('<a data-fade="" href="/quiet-machine/">Next</a>')
  })

  it('renders a reserved page as a span with the label and the preparation wording', () => {
    const markup = render(
      <PageLink id="m249" tier="lite">
        M249
      </PageLink>,
    )
    expect(markup).toBe('<span class="shell-nav-reserved">M249, in preparation</span>')
  })

  it('puts aria-current on the element it renders for the current row', () => {
    const link = render(
      <PageLink id="jgun" tier="full" current>
        Home
      </PageLink>,
    )
    expect(link).toBe('<a data-fade="" href="/" aria-current="page">Home</a>')
    const reserved = render(
      <PageLink id="m249" tier="full" current>
        M249
      </PageLink>,
    )
    expect(reserved).toContain('aria-current="page"')
    expect(reserved).not.toContain('<a')
  })
})
