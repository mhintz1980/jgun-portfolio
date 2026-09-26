import { useEffect, useRef } from 'react'
import { getScrollState, telemetry } from '../state/scrollStore'
import { DRAWING_INTRO_WINDOW } from '../scene/drawing/introTimeline'

/**
 * JG-035 opening titles — large confident type laid onto the drafting sheet while the camera
 * dollies across it. Navy ink multiplied onto the paper so the words read as printed on the
 * vellum rather than floating over it. Every card is scrubbed by scroll (no timers): lines rise
 * out of their masks as a card's window opens and lift away as it closes, so scrolling back
 * plays the film in reverse. Copy is limited to the locked JG-035 facts.
 */

interface Card {
  /** Intro-normalised window [in, out] on t = progress / releaseEnd. */
  window: [number, number]
  kicker: string
  lines: string[]
  body?: string
  place: string
  /** Plays in on load (once the sheet is ready) instead of waiting for scroll. */
  opening?: boolean
}

const CARDS: Card[] = [
  {
    window: [0.0, 0.085],
    opening: true,
    kicker: 'PTG-HP-1000 · REV 03',
    lines: ['Drawn to', 'a thousandth.'],
    body: 'A high-precision industrial torque gun. Every geared part held to less than .001" TIR.',
    place: 'left-[6vw] top-[8vh]',
  },
  {
    window: [0.13, 0.25],
    kicker: 'MULTI-STAGE PLANETARY',
    lines: ['Every gear', 'cut in house.'],
    body: 'ISO 1328 Grade A6. Input and output shafts turned and hobbed in one chucking.',
    place: 'left-[6vw] bottom-[12vh]',
  },
  {
    window: [0.27, 0.37],
    kicker: '7-AXIS MILL-TURN',
    lines: ['Machined', 'complete.'],
    body: 'Datums A–E, ASME Y14.5. The clutch housing is finished after heat treat.',
    place: 'left-[6vw] bottom-[12vh]',
  },
]

const INK = '#15295a'
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)

export function IntroTitles() {
  const cards = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let frame = 0
    let readyAt = 0
    const tick = () => {
      const now = performance.now()
      if (!readyAt && telemetry.drawing.annotationsReady) readyAt = now + 350
      // Load-time entrance for the opening card: ~1.6 s after the sheet is ready.
      const onLoad = readyAt ? Math.max(0, (now - readyAt) / 1600) : 0
      const t = getScrollState().progress / DRAWING_INTRO_WINDOW.releaseEnd
      CARDS.forEach((card, i) => {
        const el = cards.current[i]
        if (!el) return
        const [a, b] = card.window
        const span = b - a
        const enter = card.opening ? onLoad * 1.6 : (t - a) / (span * 0.3)
        const exit = (t - (b - span * 0.22)) / (span * 0.22)
        const live = t > a - 0.01 && t < b + 0.01
        el.style.visibility = live ? 'visible' : 'hidden'
        if (!live) return
        el.querySelectorAll<HTMLElement>('[data-line]').forEach((line, j) => {
          const k = easeOut(enter - j * 0.18)
          const out = easeOut(exit - j * 0.12)
          line.style.transform = `translate3d(0, ${(1 - k) * 105 - out * 105}%, 0)`
        })
        const kick = el.querySelector<HTMLElement>('[data-kicker]')
        const rule = el.querySelector<HTMLElement>('[data-rule]')
        const body = el.querySelector<HTMLElement>('[data-body]')
        const fade = Math.min(easeOut(enter * 1.2), 1 - easeOut(exit * 1.4))
        if (kick) kick.style.opacity = String(fade)
        if (rule) rule.style.transform = `scaleX(${Math.min(easeOut(enter), 1 - easeOut(exit))})`
        if (body) {
          const bodyIn = Math.min(easeOut(enter - 0.5), 1 - easeOut(exit * 1.6))
          body.style.opacity = String(bodyIn)
          body.style.transform = `translate3d(0, ${(1 - bodyIn) * 12}px, 0)`
        }
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[15] select-none"
      style={{ color: INK, mixBlendMode: 'multiply' }}
    >
      {CARDS.map((card, i) => (
        <div
          key={card.kicker}
          ref={(el) => {
            cards.current[i] = el
          }}
          className={`absolute flex flex-col max-w-[62vw] max-md:max-w-[92vw] ${card.place}`}
          style={{ visibility: 'hidden' }}
        >
          <div data-kicker className="font-mono text-[11px] tracking-[0.32em] mb-3 opacity-0">
            {card.kicker}
          </div>
          <div
            data-rule
            className={`h-px w-40 mb-5 ${card.place.includes('text-right') ? 'origin-right' : 'origin-left'}`}
            style={{ background: INK, transform: 'scaleX(0)' }}
          />
          <h2 className="intro-display uppercase">
            {card.lines.map((line) => (
              <span key={line} className="block overflow-hidden whitespace-nowrap pb-[0.04em]">
                <span data-line className="block will-change-transform" style={{ transform: 'translate3d(0,105%,0)' }}>
                  {line}
                </span>
              </span>
            ))}
          </h2>
          {card.body && (
            <p data-body className="mt-5 max-w-[30rem] font-mono text-[12px] leading-relaxed tracking-[0.06em] opacity-0">
              {card.body}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
