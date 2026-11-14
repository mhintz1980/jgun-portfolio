import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { StackImage } from './content'
import {
  ARC_STEP,
  arcGeometry,
  arcPlace,
  arcVisible,
  indexAt,
  positionForProgress,
  ringOffset,
  ringSize,
  scrollTopForIndex,
  smoothToward,
  trackStages,
} from './arcMath'
import type { ArcGeometry } from './arcMath'
import './arc.css'

interface ProjectStackProps {
  number: string
  title: string
  reviewLine: string
  /** Kept for the existing call site; the caption no longer shows it. */
  reviewQuote?: string
  reviewTags: string
  /** Each image becomes one card: label is its caption title, kind picks the fit. */
  images: readonly StackImage[]
  /** The 3D page, when the project has one. */
  href: string | null
  linkLabel: string
  /** Kept for the existing call site; the caption shows its own wording for the wheel. */
  hint?: string
  /** Called with true while the carousel holds the middle of the viewport. */
  onActive?: (active: boolean) => void
}

const REDUCED = '(prefers-reduced-motion: reduce)'
const KIND_LABEL: Record<StackImage['kind'], string> = { render: 'Render', drawing: 'Drawing', photo: 'Photo' }
const pad2 = (n: number) => String(n).padStart(2, '0')

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia(REDUCED).matches)
  useEffect(() => {
    const query = matchMedia(REDUCED)
    const on = () => setReduced(query.matches)
    on()
    query.addEventListener('change', on)
    return () => query.removeEventListener('change', on)
  }, [])
  return reduced
}

// Arc card carousel adapted from "Curved Arc Image Carousel" by Kedhareswer Naidu
// (https://21st.dev/@kedhareswer/components/arc-card-carousel, listed there as MIT licensed;
// the listing publishes no separate copyright line). Wheel geometry and the pinned-track idea
// follow the original; the scroll driver, controls and accessibility are rewritten for this page.
// A pinned track turns the wheel one card per stretch of page scroll, 1:1 with the scroll
// position (no snapping, so the page is never pulled back). Previous/next buttons, arrow keys
// and card clicks move between cards; mouse drag scrubs. The wheel does not loop, so the page
// continues once the last card is flat. Filler copies of the cards that keep the arc full are
// inert. Reduced motion: no easing, no smooth scrolling and no caption animation.
export default function ProjectStack({
  number,
  title,
  reviewLine,
  reviewTags,
  images,
  href,
  linkLabel,
  onActive,
}: ProjectStackProps) {
  const total = images.length
  const ring = ringSize(total)
  const slots = useMemo(() => Array.from({ length: ring }, (_, slot) => slot), [ring])
  const reduced = usePrefersReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const geom = useRef<ArcGeometry>(arcGeometry(1, 1))
  const wheel = useRef({ v: 0, target: 0 })
  const paintRef = useRef<() => void>(() => {})
  const [active, setActive] = useState(0)
  const [narrow, setNarrow] = useState(false)

  const paint = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const g = geom.current
    const h = stage.clientHeight
    const { v } = wheel.current
    const next = indexAt(v, total)
    // Keep roving focus on the current card before an older card leaves the visible arc.
    // Otherwise hiding the focused card makes the browser move focus to the document body.
    const focused = document.activeElement
    if (focused instanceof HTMLButtonElement && cardRefs.current.includes(focused)) {
      const currentCard = cardRefs.current[next]
      if (currentCard && currentCard !== focused) {
        currentCard.style.visibility = 'visible'
        currentCard.focus({ preventScroll: true })
      }
    }
    for (let slot = 0; slot < ring; slot++) {
      const card = cardRefs.current[slot]
      if (!card) continue
      const offset = ringOffset(slot, v, ring)
      const p = arcPlace(offset, ARC_STEP, g)
      const shown = arcVisible(p, g, h)
      card.style.visibility = shown ? 'visible' : 'hidden'
      if (!shown) continue
      card.style.transform =
        'translate3d(' +
        (p.x - g.cardW / 2).toFixed(2) +
        'px,' +
        (p.y - g.cardH / 2).toFixed(2) +
        'px,0) rotate(' +
        p.rot.toFixed(3) +
        'deg)'
      card.style.zIndex = String(Math.round((ring - offset) * 10))
    }
    setActive((prev) => (prev === next ? prev : next))
  }, [ring, total])
  paintRef.current = paint

  const placeCaption = useCallback(() => {
    const stage = stageRef.current
    const caption = captionRef.current
    if (!stage || !caption) return
    const g = geom.current
    const scale = g.cardW / 360
    caption.style.top = Math.max(80, 190 * scale) + 'px'
    caption.style.left = 550 * scale + 'px'
    caption.style.setProperty('--caption-left', caption.style.left)
  }, [])

  // Geometry follows the stage size.
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const g = arcGeometry(stage.clientWidth, stage.clientHeight)
      geom.current = g
      for (const card of cardRefs.current) {
        if (!card) continue
        card.style.width = g.cardW + 'px'
        card.style.height = g.cardH + 'px'
      }
      placeCaption()
      setNarrow(stage.clientWidth < 0.9 * stage.clientHeight || stage.clientWidth < 640)
      paintRef.current()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [placeCaption, ring])

  // Scroll drives the wheel: target from page position, eased toward it, snapped when idle.
  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage || total < 1) return
    let frame = 0
    let last = 0
    let inView = false
    const metrics = () => {
      const rect = track.getBoundingClientRect()
      const start = rect.top + window.scrollY
      const travel = Math.max(rect.height - stage.clientHeight, 0)
      return { start, travel, progress: travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0 }
    }
    const tick = (now: number) => {
      frame = 0
      const w = wheel.current
      const dt = last ? Math.min(now - last, 64) : 16
      last = now
      w.v = reduced ? w.target : smoothToward(w.v, w.target, dt)
      paintRef.current()
      if (inView && w.v !== w.target) frame = requestAnimationFrame(tick)
      else last = 0
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const retarget = () => {
      wheel.current.target = positionForProgress(metrics().progress, total)
      if (inView) schedule()
    }
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) retarget()
    })
    io.observe(track)
    const centre = new IntersectionObserver(([entry]) => onActive?.(entry.isIntersecting), {
      rootMargin: '-50% 0px -50% 0px',
    })
    centre.observe(track)
    window.addEventListener('scroll', retarget, { passive: true })
    window.addEventListener('resize', retarget)
    wheel.current.target = positionForProgress(metrics().progress, total)
    wheel.current.v = wheel.current.target
    paintRef.current()
    return () => {
      io.disconnect()
      centre.disconnect()
      window.removeEventListener('scroll', retarget)
      window.removeEventListener('resize', retarget)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [total, reduced, onActive])

  // Rapid key presses and clicks accumulate: while a smooth scroll is still travelling, the next
  // step starts from the card it is heading to, not from the card currently nearest the equator.
  const pending = useRef<{ index: number; at: number } | null>(null)
  const baseIndex = (current: number) => {
    const p = pending.current
    return p && performance.now() - p.at < 900 ? p.index : current
  }
  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current
      const stage = stageRef.current
      if (!track || !stage) return
      pending.current = { index: Math.min(Math.max(index, 0), total - 1), at: performance.now() }
      const rect = track.getBoundingClientRect()
      const top = scrollTopForIndex(
        index,
        total,
        rect.top + window.scrollY,
        Math.max(rect.height - stage.clientHeight, 0),
      )
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
    },
    [total, reduced],
  )

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight'
    const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
    if (!forward && !back) return
    e.preventDefault()
    goTo(Math.min(Math.max(baseIndex(active) + (forward ? 1 : -1), 0), total - 1))
  }

  // Mouse drag scrubs the page scroll once it moves past a few pixels, so plain clicks still reach
  // the cards. Touch keeps native scrolling.
  const drag = useRef<{ id: number; y: number; x: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if ((e.target as HTMLElement).closest('.home-arc-controls, .home-arc-link')) return
    drag.current = { id: e.pointerId, y: e.clientY, x: e.clientX, moved: false }
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.y
    const dx = e.clientX - d.x
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    d.y = e.clientY
    d.x = e.clientX
    const delta = Math.abs(dy) >= Math.abs(dx) ? -dy : -dx
    if (delta) window.scrollBy({ top: delta * 1.6, behavior: 'auto' })
  }
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d?.id !== e.pointerId) return
    drag.current = null
    if (d.moved) {
      justDragged.current = true
      window.setTimeout(() => {
        justDragged.current = false
      }, 0)
    }
  }

  const current = images[active] ?? images[0]
  if (!current) return null

  return (
    <div
      ref={trackRef}
      className="home-arc"
      style={{ height: 'calc(100svh * ' + trackStages(total).toFixed(3) + ')' }}
      role="region"
      aria-roledescription="carousel"
      aria-label={title + ' images'}
    >
      <div
        ref={stageRef}
        className="home-arc-stage"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (justDragged.current) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        {slots.map((slot) => {
          const image = images[slot % total]
          const real = slot < total
          const portrait = image.height > image.width
          const crop = !portrait && image.kind === 'drawing' && image.src.startsWith('/home/stacks/torque-wrench/')
          return (
            <button
              key={slot}
              ref={(node) => {
                cardRefs.current[slot] = node
              }}
              type="button"
              className={'home-arc-card is-' + image.kind + (portrait ? ' is-portrait' : '') + (crop ? ' is-crop' : '')}
              tabIndex={real && slot === active ? 0 : -1}
              inert={real ? undefined : true}
              aria-roledescription={real ? 'slide' : undefined}
              aria-label={real ? image.label + ', ' + (slot + 1) + ' of ' + total : undefined}
              aria-current={real && slot === active ? 'true' : undefined}
              onClick={() => goTo(slot % total)}
            >
              <img
                src={image.src}
                width={image.width}
                height={image.height}
                alt={real ? title + ': ' + image.label : ''}
                loading={slot < 4 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </button>
          )
        })}

        <div
          ref={captionRef}
          className="home-arc-caption"
          data-project-number={number}
          data-narrow={narrow ? '' : undefined}
        >
          <div className="home-arc-text" key={active}>
            <p className="home-arc-num" aria-hidden="true">
              {pad2(active + 1)} / {pad2(total)}
            </p>
            <h3 className="home-arc-title">{current.label}</h3>
            <p className="home-arc-meta">
              {number} · {title} · {KIND_LABEL[current.kind]}
            </p>
          </div>
          <div className="home-arc-actions">
            {total > 1 ? (
              <div className="home-arc-controls" role="group" aria-label={title + ' carousel controls'}>
                <button
                  type="button"
                  className="home-arc-btn"
                  aria-label="Previous image"
                  aria-disabled={active <= 0}
                  onClick={() => baseIndex(active) > 0 && goTo(baseIndex(active) - 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="home-arc-btn"
                  aria-label="Next image"
                  aria-disabled={active >= total - 1}
                  onClick={() => baseIndex(active) < total - 1 && goTo(baseIndex(active) + 1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            ) : null}
            {href ? (
              <a className="home-arc-link" href={href} data-fade>
                {linkLabel} <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </div>
          <p className="home-arc-tags">
            {reviewLine} · {reviewTags}
          </p>
          <p className="home-arc-hint">Scroll, drag or use the arrow keys to turn the wheel</p>
        </div>

        <p className="home-arc-sr" aria-live="polite">
          {'Image ' + (active + 1) + ' of ' + total + ': ' + current.label}
        </p>
      </div>
    </div>
  )
}
