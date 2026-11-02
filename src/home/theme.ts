// Light/dark theme helpers (W2). The head script in home/index.html sets the first theme before paint.

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'sm:theme'
export const THEME_ATTR = 'data-theme'

interface ThemeDoc {
  documentElement: { getAttribute(name: string): string | null; setAttribute(name: string, value: string): void }
}

export function readTheme(doc: ThemeDoc): Theme {
  return doc.documentElement.getAttribute(THEME_ATTR) === 'dark' ? 'dark' : 'light'
}

export function nextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

/** Sets the attribute, then stores the choice. Storage may be missing or throw (private mode): never fatal. */
export function applyTheme(doc: ThemeDoc, theme: Theme, storage: Pick<Storage, 'setItem'> | null | undefined): void {
  doc.documentElement.setAttribute(THEME_ATTR, theme)
  try {
    storage?.setItem(THEME_KEY, theme)
  } catch {
    // Theme still applies for this page view.
  }
}

/** Reads window.localStorage without letting a blocked accessor throw. */
export function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
