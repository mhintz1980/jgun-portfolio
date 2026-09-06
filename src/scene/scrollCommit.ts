import { DRAWING_INTRO_WINDOW, INTRO_PHASES, rawScrollFor } from './drawing/introTimeline'

/**
 * Committed-pace assist (JG-026 Item 5) — the ONE moment inside the B1/B2 intro where the
 * page finishes a beat for the visitor instead of leaving them parked inside it.
 *
 * WHAT IS COMMITTED
 *   The detachment run: from the moment the model is about to leave the sheet through the end
 *   of the shockwave. Stopping halfway through that leaves the JGun frozen mid-separation with
 *   a half-crossed wave, which is the one place in the sequence where a still frame reads as
 *   broken rather than as a pause.
 *
 * HOW THE USER GETS OUT
 *   Any input at all — wheel, touch, key, pointer, or the browser's own scroll — cancels the
 *   assist immediately and for the rest of that pass. There is no exit button, ever: the exit
 *   is the same gesture the visitor was already making. Escape cancels too and disables the
 *   assist for the session, which is accessibility parity, not a second UI.
 *
 * REVERSE SCROLL
 *   Fully symmetric. The assist eases toward whichever end of the window the visitor was last
 *   travelling toward, so scrolling up out of the window is completed upward. It only ever
 *   moves the scroll position; every position in the window stays reachable, and the rendered
 *   frame remains a pure function of scroll, so forward/reverse replay is unchanged.
 *
 * NEVER ENGAGES
 *   Reduced motion (ScrollRig does not mount at all in that tier), and any time a proof probe
 *   has pinned progress or set `__scrollCommitDisabled`.
 */

interface LenisLike {
  scrollTo: (target: number, options?: Record<string, unknown>) => void
}

/** Quiet time after the last input before the assist may take over. */
const IDLE_MS = 260
/** Below this |raw scroll per second| the visitor has effectively stopped. */
const REST_VELOCITY = 0.02
/** Ease duration for the committed run, in seconds. */
const COMMIT_SECONDS = 1.15

export function installScrollCommit(lenis: LenisLike): () => void {
  const start = rawScrollFor(DRAWING_INTRO_WINDOW.releaseEnd * INTRO_PHASES.detachStart)
  const end = rawScrollFor(DRAWING_INTRO_WINDOW.releaseEnd)

  let lastInput = performance.now()
  let lastRaw = 0
  let direction = 1
  let engaged = false
  let sessionDisabled = false
  let timer = 0

  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

  const cancel = () => {
    lastInput = performance.now()
    if (engaged) {
      engaged = false
      // Handing control back means stopping where the visitor's own input put them.
      lenis.scrollTo(window.scrollY, { immediate: true, force: true })
    }
  }

  const onInput = () => cancel()
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') sessionDisabled = true
    cancel()
  }

  const tick = () => {
    timer = window.setTimeout(tick, 120)
    if (sessionDisabled || engaged) return
    const flags = window as unknown as Record<string, unknown>
    if (flags.__scrollCommitDisabled || typeof flags.__drawingProofProgress === 'number') return

    const raw = window.scrollY / maxScroll()
    const delta = raw - lastRaw
    if (Math.abs(delta) > 1e-6) direction = Math.sign(delta)
    const speed = Math.abs(delta) / 0.12
    lastRaw = raw

    if (raw <= start || raw >= end) return
    if (speed > REST_VELOCITY) return
    if (performance.now() - lastInput < IDLE_MS) return

    engaged = true
    const target = direction >= 0 ? end : start
    lenis.scrollTo(target * maxScroll(), {
      duration: COMMIT_SECONDS,
      force: true,
      onComplete: () => {
        engaged = false
      },
    })
  }

  const events: [string, EventListener][] = [
    ['wheel', onInput],
    ['touchstart', onInput],
    ['pointerdown', onInput],
    ['keydown', onKey as EventListener],
  ]
  for (const [name, handler] of events) {
    window.addEventListener(name, handler, { passive: true })
  }
  lastRaw = window.scrollY / maxScroll()
  timer = window.setTimeout(tick, 120)

  return () => {
    window.clearTimeout(timer)
    for (const [name, handler] of events) window.removeEventListener(name, handler)
  }
}
