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
  // Pill switch from Mark's earlier site: the knob slides right for dark, and its icon spins.
  return (
    <button
      type="button"
      className="home-theme-toggle"
      data-theme-state={theme}
      aria-pressed={dark}
      aria-label="Dark theme"
      onClick={() => applyTheme(document, nextTheme(theme), safeLocalStorage())}
    >
      <span className="home-theme-knob" aria-hidden="true">
        <span className="home-theme-icon">
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 16 16" focusable="false">
              <path d="M10.5 1.8a6.5 6.5 0 1 0 3.7 9.9A5.5 5.5 0 0 1 10.5 1.8Z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 16 16" focusable="false">
              <circle cx="8" cy="8" r="3.2" fill="currentColor" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}
