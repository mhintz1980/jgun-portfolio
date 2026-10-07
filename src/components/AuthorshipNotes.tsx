import { useEffect, useRef } from 'react'
import { DRAWING_INTRO_WINDOW } from '../scene/drawing/introTimeline'
import { getScrollState } from '../state/scrollStore'
import { useQuality } from '../state/qualityStore'

/**
 * JG-035 authorship layer — Mark's identity plate and a personal margin note.
 *
 * Two constraints shape this component:
 *  - Mark has to be readable from first paint, before the GLB / drawing annotations are ready and
 *    in every quality mode, so this lives in the always-DOM <Chapters> tree and never waits on the
 *    canvas. It is also the static equivalent for the poster and reduced-motion tiers, where
 *    <IntroTitles> never mounts.
 *  - The note is PERSONAL ink, not manufacturing ink. It rides its own cream vellum chip in navy
 *    (the same navy/cream pair as `.station-summary`) so it stays legible over both the bright
 *    drafting sheet and the dark poster, and stays visually separate from the cyan instrument
 *    chrome and the formal callouts.
 *
 * The fade is written straight to the DOM from a rAF loop (like IntroTitles / TechnicalHUD) so a
 * scroll value never re-renders React per frame. Static tiers use inline introductory copy;
 * the floating layer never competes with their chapter cards or inspection controls.
 */

/** Public name only — role wording stays descriptive, never an inflated job title. */
const AUTHOR_NAME = 'Mark Hintz'

/** Documented domains only: mechanical design / machining and the software bridge (CH.01 copy). */
const AUTHOR_DOMAINS = 'Mechanical design · Manufacturing · Programming'

/**
 * Mark's personal drawing note — the verified single-setup decision in one restrained line. The
 * fuller first-person explanation lives in the CH.01 narrative and the gearbox case study; the
 * unresolved undercut story is deliberately not asserted here.
 */
const MARGIN_NOTE = 'Turn and hob the shafts in one chucking.'

export function AuthorshipNotes() {
  const { tier, reducedMotion } = useQuality()
  const isStaticMode = tier === 'poster' || reducedMotion
  const root = useRef<HTMLDivElement>(null)

  // Paint immediately: show on the first render when the intro still owns the page, hide when a
  // deep link lands mid-timeline. The rAF pass below only refines it thereafter.
  const initiallyVisible = isStaticMode || getScrollState().progress < DRAWING_INTRO_WINDOW.releaseEnd

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (isStaticMode) {
      el.style.opacity = '1'
      el.style.visibility = 'visible'
      return
    }
    let frame = 0
    const tick = () => {
      const p = getScrollState().progress
      // Hold through the drafting-sheet intro; fade out exactly as the model takes over at
      // releaseEnd (where the HUD chrome starts to fade in) so the two never overlap.
      const k = Math.max(0, Math.min(1, (DRAWING_INTRO_WINDOW.releaseEnd - p) / 0.015))
      el.style.opacity = String(k)
      el.style.visibility = k > 0.001 ? 'visible' : 'hidden'
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isStaticMode])

  return (
    <div
      ref={root}
      className="authorship-layer"
      data-static={isStaticMode ? 'true' : 'false'}
      style={{ visibility: initiallyVisible ? 'visible' : 'hidden' }}
    >
      <header className="authorship-id">
        <h1 className="authorship-name">{AUTHOR_NAME}</h1>
        <p className="authorship-role">{AUTHOR_DOMAINS}</p>
      </header>
      <aside className="authorship-note" aria-label="Designer's drawing note">
        <p className="authorship-note-text">{MARGIN_NOTE}</p>
      </aside>
    </div>
  )
}

/**
 * Static equivalent, in the introductory card's reading flow at every viewport size.
 * Later static chapters omit it, so the personal note leaves with the introduction.
 */
export function AuthorshipInline() {
  return (
    <div className="authorship-inline">
      <h1 className="authorship-inline-name">{AUTHOR_NAME}</h1>
      <p className="authorship-inline-role">{AUTHOR_DOMAINS}</p>
      <p className="authorship-inline-note">{MARGIN_NOTE}</p>
    </div>
  )
}
