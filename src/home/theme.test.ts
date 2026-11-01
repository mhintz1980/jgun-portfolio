import { describe, expect, it } from 'vitest'
import { THEME_KEY, applyTheme, nextTheme, readTheme } from './theme'

function fakeDoc(initial: string | null) {
  const attrs = new Map<string, string>()
  if (initial !== null) attrs.set('data-theme', initial)
  return {
    attrs,
    documentElement: {
      getAttribute: (name: string) => attrs.get(name) ?? null,
      setAttribute: (name: string, value: string) => void attrs.set(name, value),
    },
  }
}

describe('theme', () => {
  it('reads the attribute, defaulting to light', () => {
    expect(readTheme(fakeDoc('dark'))).toBe('dark')
    expect(readTheme(fakeDoc('light'))).toBe('light')
    expect(readTheme(fakeDoc(null))).toBe('light')
    expect(readTheme(fakeDoc('sepia'))).toBe('light')
  })

  it('flips', () => {
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('light')
  })

  it('sets the attribute and stores the choice', () => {
    const doc = fakeDoc('light')
    const stored = new Map<string, string>()
    applyTheme(doc, 'dark', { setItem: (k, v) => void stored.set(k, v) })
    expect(doc.attrs.get('data-theme')).toBe('dark')
    expect(stored.get(THEME_KEY)).toBe('dark')
  })

  it('still applies when storage throws or is missing', () => {
    const doc = fakeDoc('light')
    const throwing = {
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(() => applyTheme(doc, 'dark', throwing)).not.toThrow()
    expect(doc.attrs.get('data-theme')).toBe('dark')
    expect(() => applyTheme(doc, 'light', null)).not.toThrow()
    expect(doc.attrs.get('data-theme')).toBe('light')
  })
})
