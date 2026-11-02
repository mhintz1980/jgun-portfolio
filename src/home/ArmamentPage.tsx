import { ARMAMENT_PAGE, FOOTER } from './content'
import DrawnName from './DrawnName'
import ThemeToggle from './ThemeToggle'
import './layout.css'
import './armament.css'

// Text-only placeholder for the third portfolio project. No drawings until the owner clears them.
export default function ArmamentPage() {
  const year = new Date().getFullYear()
  return (
    <div className="home home-placeholder">
      <header className="home-header">
        <DrawnName href="/home/" label="Mark Hintz, homepage" fade />
        <span className="home-nav" />
        <ThemeToggle />
      </header>
      <main className="home-placeholder-main">
        <p className="home-label">{ARMAMENT_PAGE.label}</p>
        <h1 className="home-h2 home-placeholder-title">{ARMAMENT_PAGE.title}</h1>
        <p className="home-placeholder-status">{ARMAMENT_PAGE.status}</p>
        <p className="home-placeholder-body">{ARMAMENT_PAGE.body}</p>
        <p className="home-cue">
          <a href="/home/" data-fade>
            <span aria-hidden="true">←</span> {ARMAMENT_PAGE.back}
          </a>
        </p>
      </main>
      <footer className="home-footer">
        {FOOTER.site} · {FOOTER.status} · © {year} Mark Hintz
      </footer>
    </div>
  )
}
