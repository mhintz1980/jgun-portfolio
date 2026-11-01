// W2 stub: light/dark toggle (aria-pressed). The head script in home/index.html sets the first theme.
export default function ThemeToggle() {
  return (
    <button type="button" className="home-theme-toggle" aria-pressed={false} aria-label="Dark theme">
      Theme
    </button>
  )
}
