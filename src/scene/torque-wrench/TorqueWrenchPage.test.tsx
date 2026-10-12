import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTorqueWrenchStore } from '../../state/torqueWrenchStore'
import { TorqueWrenchPage } from './TorqueWrenchPage'

// Node environment only (the shared-test pattern): markup and store-contract assertions. Runtime
// mount/focus/remount proof under a real DOM belongs to the parent's browser evidence.

const CHAPTER_IDS = ['drafting', 'breakthrough', 'mechanism', 'inspection', 'close']
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1

function markupFor(store: ReturnType<typeof createTorqueWrenchStore>) {
  return renderToStaticMarkup(<TorqueWrenchPage store={store} />)
}

describe('TorqueWrenchPage static foundation', () => {
  it('renders the five ordered chapters exactly once in every tier', () => {
    for (const tier of ['full', 'lite', 'poster'] as const) {
      const markup = markupFor(createTorqueWrenchStore({ tier }))
      expect(count(markup, 'class="torque-chapter"')).toBe(5)
      let position = -1
      for (const id of CHAPTER_IDS) {
        const at = markup.indexOf(`torque-chapter-${id}-title`)
        expect(at, `${id} should appear in ${tier}`).toBeGreaterThan(position)
        position = at
      }
    }
  })

  it('keeps the story, controls, and footer mounted while the full-tier scene is pending', () => {
    const markup = markupFor(createTorqueWrenchStore({ tier: 'full' }))
    expect(markup).toContain('data-torque-stage="pending"')
    expect(markup).not.toContain('data-torque-scene=')
    expect(markup).toContain('href="#torque-story"')
    expect(markup).toContain('aria-label="Pages"')
    expect(markup).toContain('aria-controls="torque-inspection-detail"')
    expect(markup).toContain('role="region"')
    expect(markup).toContain('torque-footer')
  })

  it('poster tier shows pending poster slots, no scene, and the same story', () => {
    const markup = markupFor(createTorqueWrenchStore({ tier: 'poster' }))
    expect(markup).toContain('data-torque-stage="poster"')
    expect(count(markup, 'data-torque-poster-pending="stage-6"')).toBe(5)
    expect(markup).not.toContain('data-torque-scene=')
    expect(count(markup, 'class="torque-chapter"')).toBe(5)
    expect(markup).not.toContain('<img')
  })

  it('a failed scene falls back to the poster layer with the story and footer intact', () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    store.setSceneStatus('failed')
    const markup = markupFor(store)
    expect(markup).toContain('data-torque-stage="poster"')
    expect(markup).not.toContain('data-torque-scene=')
    expect(count(markup, 'class="torque-chapter"')).toBe(5)
    expect(markup).toContain('aria-controls="torque-inspection-detail"')
    expect(markup).toContain('torque-footer')
  })
})
