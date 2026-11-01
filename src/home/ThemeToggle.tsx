import { useEffect, useState } from 'react'
import { applyTheme, nextTheme, readTheme, safeLocalStorage, THEME_ATTR } from './theme'
import type { Theme } from './theme'
import './vault.css'

// Light/dark toggle. The head script in home/index.html sets the first theme before paint;
// this button flips it, stores the choice and stays in sync if anything else changes the attribute.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readTheme(document))

  useEffect(() => {
    const sync = () => setTheme(readTheme(document))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTR] })
    return () => observer.disconnect()
  }, [])

  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="home-theme-toggle"
      aria-pressed={dark}
      aria-label="Dark theme"
      onClick={() => applyTheme(document, nextTheme(theme), safeLocalStorage())}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M10.5 1.8a6.5 6.5 0 1 0 3.7 9.9A5.5 5.5 0 0 1 10.5 1.8Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      <span className="home-theme-toggle-text">Dark</span>
    </button>
  )
}
