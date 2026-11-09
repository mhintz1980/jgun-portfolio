import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { StackImage } from './content'
import { cardState, cardTransform, sectionHeightVh, sectionProgress } from './stackMath'
import './stack.css'

interface ProjectStackProps {
  number: string
  title: string
  reviewLine: string
  reviewQuote: string
  reviewTags: string
  images: readonly StackImage[]
  /** The 3D page, when the project has one. */
  href: string | null
  linkLabel: string
  hint: string
  /** Called with true while the stack holds the middle of the viewport. */
  onActive?: (active: boolean) => void
}

const REDUCED = '(prefers-reduced-motion: reduce)'
const COMPACT = '(max-width: 720px)'

// Peel-through image stack (from Mark's earlier site): the stage pins for a few viewports while
// each card lifts away in turn. Scroll drives it; a mouse can also drag the stack to scrub.
// Reduced motion: a plain grid of the same images.
export default function ProjectStack({
  number,
  title,
  reviewLine,
  reviewQuote,
  reviewTags,
  images,
  href,
  linkLabel,
  hint,
  onActive,
}: ProjectStackProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const countRef = useRef<HTMLSpanElement>(null)
  const reduced = typeof matchMedia === 'function' && matchMedia(REDUCED).matches

  useEffect(() => {
    const section = sectionRef.current
    if (!section || reduced) return
    let frame = 0
    let inView = false
    let last = -1
    const compact = matchMedia(COMPACT).matches

    const paint = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const p = sectionProgress(rect.top, rect.height, window.innerHeight)
      if (Math.abs(p - last) < 1e-4) return
      last = p
      let front = 0
      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const state = cardState(p, i, images.length)
        if (state.exit >= 0.5) front += 1
        // Cards that are gone or buried deep are skipped by the compositor entirely.
        const hidden = state.opacity <= 0 || state.depth > 3
        card.style.visibility = hidden ? 'hidden' : 'visible'
        if (hidden) return
        card.style.transform = cardTransform(state, compact)
        card.style.opacity = String(state.opacity)
      })
      if (countRef.current)
        countRef.current.textContent = `${String(Math.min(front + 1, images.length)).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`
    }
    const schedule = () => {
      if (inView && !frame) frame = requestAnimationFrame(paint)
    }
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      schedule()
    })
    io.observe(section)
    const centre = new IntersectionObserver(([entry]) => onActive?.(entry.isIntersecting), {
      rootMargin: '-50% 0px -50% 0px',
    })
    centre.observe(section)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    paint()
    return () => {
      io.disconnect()
      centre.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [images.length, reduced, onActive])

  // Mouse drag scrubs the page scroll (touch keeps native scrolling).
  const drag = useRef<{ id: number; y: number; x: number } | null>(null)
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { id: e.pointerId, y: e.clientY, x: e.clientX }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.y
    const dx = e.clientX - d.x
    d.y = e.clientY
    d.x = e.clientX
    const delta = Math.abs(dy) >= Math.abs(dx) ? -dy : -dx
    if (delta) window.scrollBy({ top: delta * 1.6, behavior: 'auto' })
  }
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  const link = href ? (
    <a className="home-stack-link" href={href} data-fade>
      {linkLabel} <span aria-hidden="true">→</span>
    </a>
  ) : null
  const description = (
    <div className="home-stack-description">
      <span className="home-stack-kicker">Project review stack · {number}</span>
      <h3>{title}</h3>
      <p>{reviewLine}</p>
      <blockquote>{reviewQuote}</blockquote>
      <p className="home-stack-tags">{reviewTags}</p>
      <span className="home-stack-hint">{hint}</span>
      {link}
    </div>
  )

  if (reduced) {
    return (
      <div className="home-stack home-stack-static">
        {description}
        <ul className="home-stack-grid">
          {images.map((image) => (
            <li key={image.src} className={`home-stack-frame is-${image.kind}`}>
              <img
                src={image.src}
                width={image.width}
                height={image.height}
                alt={`${title}: ${image.label}`}
                loading="lazy"
              />
              <span className="home-stack-caption">{image.label}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div ref={sectionRef} className="home-stack" style={{ height: `${sectionHeightVh(images.length)}vh` }}>
      <div className="home-stack-stage">
        {description}
        <div className="home-stack-visual">
          <span className="home-stack-count" ref={countRef} aria-hidden="true">
            01 / {String(images.length).padStart(2, '0')}
          </span>
          <div
            className="home-stack-cards"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {images.map((image, i) => (
              <figure
                key={image.src}
                ref={(node) => {
                  cardRefs.current[i] = node
                }}
                className={`home-stack-card is-${image.kind}`}
                style={{ zIndex: images.length - i }}
              >
                <img
                  src={image.src}
                  width={image.width}
                  height={image.height}
                  alt={`${title}: ${image.label}`}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  draggable={false}
                />
                <figcaption className="home-stack-caption">
                  <span>
                    {String(i + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                  </span>
                  {image.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
