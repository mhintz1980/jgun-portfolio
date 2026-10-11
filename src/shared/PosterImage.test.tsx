import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PosterImage } from './PosterImage'
import type { PosterEntry } from './poster'
import { checkPosterPath } from './posterGuard'

// Node environment only: react-dom/server static markup, no jsdom (the PageNav.test.tsx pattern).

const entry: PosterEntry = {
  id: 'pit',
  alt: 'The exposed pit under the registered paper.',
  desktop: { src: '/torque-wrench/posters/pit-desktop.webp', width: 1920, height: 1080 },
  narrow: { src: '/torque-wrench/posters/pit-narrow.webp', width: 828, height: 1472 },
  status: 'temporary',
  provenance: null,
}

describe('PosterImage', () => {
  it('renders a figure with a narrow source and a sized, described desktop image', () => {
    const markup = renderToStaticMarkup(<PosterImage entry={entry} />)
    expect(markup).toContain('<figure class="shell-poster" data-poster="pit" data-poster-status="temporary">')
    expect(markup).toContain('<source media="(max-width: 600px)" srcSet="/torque-wrench/posters/pit-narrow.webp" width="828" height="1472"/>')
    expect(markup).toContain('alt="The exposed pit under the registered paper."')
    expect(markup).toContain('src="/torque-wrench/posters/pit-desktop.webp"')
    expect(markup).toContain('width="1920" height="1080"')
    expect(markup).toContain('loading="lazy"')
    expect(markup).toContain('decoding="async"')
  })

  it('omits the source when there is no narrow crop, and honours loading and className', () => {
    const markup = renderToStaticMarkup(<PosterImage entry={{ ...entry, narrow: undefined }} className="qm-poster" loading="eager" />)
    expect(markup).not.toContain('<source')
    expect(markup).toContain('class="qm-poster"')
    expect(markup).toContain('loading="eager"')
  })

  it('renders children inside the figure', () => {
    const markup = renderToStaticMarkup(<PosterImage entry={entry}><figcaption>Pit</figcaption></PosterImage>)
    expect(markup).toMatch(/<figcaption>Pit<\/figcaption><\/figure>$/)
  })

  it('is a zero-canvas, zero-CAD path under the guard, with the poster itself as the only request', () => {
    const markup = renderToStaticMarkup(<PosterImage entry={entry} />)
    const requested = [entry.desktop.src, entry.narrow?.src ?? '']
    expect(checkPosterPath({ markup, requestedUrls: requested })).toMatchObject({ ok: true, canvases: 0 })
  })
})
