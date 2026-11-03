import { useEffect, useMemo, useRef, useState } from 'react'
import { prefetchPage } from '../shared/pageFade'
import ContactRope from './ContactRope'
import DrawnName from './DrawnName'
import ProjectStack from './ProjectStack'
import RollingPhrase from './RollingPhrase'
import { CONTACT, CORE_PROJECTS, FOOTER, HERO, PLUS, PLUS_ITEMS, STACKS, TESTIMONIAL, WORK } from './content'
import type { ProjectId } from './content'
import ThemeToggle from './ThemeToggle'
import Thread from './Thread'
import Vault from './Vault'
import './layout.css'

// The only shared file of the homepage. Effects live in their own components and CSS files;
// copy lives in content.ts. Thread anchors are marked with data-thread, in reading order.
export default function HomePage() {
  const [focus, setFocus] = useState<ProjectId | null>(null)
  const [compactHeader, setCompactHeader] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const restoreNavFocusRef = useRef(false)
  const rowsRef = useRef<HTMLOListElement>(null)
  const year = new Date().getFullYear()

  useEffect(() => {
    let frame = 0
    let gateFrame = 0
    let gateTimer = 0
    let gateVersion = 0
    let phase: 'expanded' | 'collapsing' | 'compact' = 'expanded'
    let touchY: number | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cancelGate = () => {
      gateVersion++
      cancelAnimationFrame(gateFrame)
      window.clearTimeout(gateTimer)
    }
    const expand = () => {
      cancelGate()
      phase = 'expanded'
      setCompactHeader(false)
    }
    const collapse = () => {
      cancelGate()
      phase = 'collapsing'
      restoreNavFocusRef.current = !!document.activeElement?.closest('.home-nav')
      setCompactHeader(true)
      const version = gateVersion
      // React must commit the compact state before the browser exposes its CSS transitions.
      gateFrame = requestAnimationFrame(() => {
        gateFrame = requestAnimationFrame(() => {
          if (version !== gateVersion) return
          const header = document.querySelector<HTMLElement>('.home-header')
          const finish = () => {
            if (version !== gateVersion || phase !== 'collapsing') return
            window.clearTimeout(gateTimer)
            phase = 'compact'
          }
          const animations = header?.getAnimations({ subtree: true }).filter((animation) => {
            if (!(animation instanceof CSSTransition) || animation.transitionProperty !== 'transform') return false
            const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null
            return target instanceof Element && target.matches('.home-name, .home-letter, .home-nav-toggle, .home-wcs-spin, .home-theme-toggle')
          }) ?? []
          // The fallback follows the actual CSS if a transition is longer than the intended 900ms.
          const remaining = animations.reduce((longest, animation) => {
            const end = animation.effect?.getComputedTiming().endTime
            return Math.max(longest, typeof end === 'number' && Number.isFinite(end) ? end : 0)
          }, 0)
          gateTimer = window.setTimeout(finish, Math.max(900, remaining) + 50)
          if (animations.length) void Promise.allSettled(animations.map((animation) => animation.finished)).then(finish)
          else if (reducedMotion.matches) finish()
        })
      })
    }
    const input = (direction: number, event: Event) => {
      if (window.scrollY > 1 || !direction) return
      if (direction < 0) {
        if (phase !== 'expanded') expand()
        return
      }
      if (phase === 'expanded') {
        // Reduced motion does not need an artificial pause before native scrolling.
        if (reducedMotion.matches) {
          phase = 'compact'
          setCompactHeader(true)
          return
        }
        collapse()
      }
      if (phase === 'collapsing' && event.cancelable) event.preventDefault()
    }
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) input(Math.sign(event.deltaY), event)
    }
    const touchStart = (event: TouchEvent) => {
      touchY = event.touches.length === 1 && !(event.target instanceof Element && event.target.closest('.home-rope'))
        ? event.touches[0].clientY : null
    }
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) return
      const next = event.touches[0].clientY
      const delta = touchY - next
      if (Math.abs(delta) >= 2) { touchY = next; input(Math.sign(delta), event) }
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
          (event.target instanceof Element && (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ||
            (event.key === ' ' && event.target.closest('button, a'))))) return
      const down = event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'End' || (event.key === ' ' && !event.shiftKey)
      const up = event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home' || (event.key === ' ' && event.shiftKey)
      if (down || up) input(down ? 1 : -1, event)
    }
    const update = () => {
      frame = 0
      const title = document.getElementById('home-title')
      const location = document.querySelector('.home-identity')
      if (!title || !location) return
      const header = document.querySelector<HTMLElement>('.home-header')
      const work = document.querySelector<HTMLElement>('.home-nav a')
      const theme = document.querySelector<HTMLElement>('.home-header .home-theme-toggle')
      if (header && work && !header.hasAttribute('data-compact')) {
        const rect = work.getBoundingClientRect()
        header.style.setProperty('--wcs-start-x', `${rect.left + rect.width / 2 - (document.documentElement.clientWidth - 96 - 24)}px`)
        header.style.setProperty('--wcs-start-y', `${rect.top + rect.height / 2 - 32}px`)
        if (theme) {
          const box = theme.getBoundingClientRect()
          header.style.setProperty('--theme-corner-x', `${document.documentElement.clientWidth - 8 - box.right}px`)
          header.style.setProperty('--theme-corner-y', `${8 - box.top}px`)
        }
      }
      // Native anchors, restored scroll positions and focus-driven scrolling bypass the gate.
      if (window.scrollY > 1) {
        if (phase === 'collapsing') cancelGate()
        const compact = phase !== 'expanded' || title.getBoundingClientRect().top <= location.getBoundingClientRect().bottom + 24
        phase = compact ? 'compact' : 'expanded'
        setCompactHeader(compact)
      } else if (phase === 'compact') expand()
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('keydown', keydown)
    update()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('keydown', keydown)
      cancelGate()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (compactHeader && restoreNavFocusRef.current) {
      restoreNavFocusRef.current = false
      menuButtonRef.current?.focus()
    }
    if (!compactHeader) setMenuOpen(false)
  }, [compactHeader])

  // A pinned project stack brings that project's drawings forward in the vault (all devices).
  const activeHandlers = useMemo(() => {
    const handlers = {} as Record<ProjectId, (active: boolean) => void>
    for (const project of CORE_PROJECTS) {
      handlers[project.id] = (active) => setFocus((current) => (active ? project.id : current === project.id ? null : current))
    }
    return handlers
  }, [])

  // Phones (no hover): the work row crossing the viewport's centre band takes focus. A tap still
  // navigates; nothing here intercepts it.
  useEffect(() => {
    const list = rowsRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const inBand = new Set<ProjectId>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.project as ProjectId
          if (entry.isIntersecting) inBand.add(id)
          else inBand.delete(id)
        }
        const next = CORE_PROJECTS.find((project) => inBand.has(project.id))
        setFocus(next ? next.id : null)
        if (next?.href) prefetchPage(document, [next.href])
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    list.querySelectorAll('[data-project]').forEach((row) => observer.observe(row))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="home">
      <Vault focus={focus} />
      <Thread />

      <header className="home-header" data-compact={compactHeader ? '' : undefined} onKeyDown={(event) => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButtonRef.current?.focus() } }}>
        <div className="home-identity">
          <DrawnName href="#top" label="Mark Hintz, back to top" />
          <p className="home-eyebrow">{HERO.eyebrow}</p>
        </div>
        <nav id="home-navigation" className="home-nav" aria-label="Sections" inert={compactHeader && !menuOpen} onClick={() => setMenuOpen(false)}>
          <a href="#work">Work</a>
          <a href="#plus">
            <span className="home-accent" aria-hidden="true">
              +
            </span>{' '}
            Plus
          </a>
          <a href="#contact">Contact</a>
        </nav>
        <button ref={menuButtonRef} className="home-nav-toggle" type="button" aria-label="Sections menu" aria-expanded={menuOpen} aria-controls="home-navigation" tabIndex={compactHeader ? 0 : -1} onClick={() => setMenuOpen((open) => !open)} onKeyDown={(event) => { if (event.key === 'Escape') { setMenuOpen(false); menuButtonRef.current?.focus() } }}>
          <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <g className="home-wcs-spin">
              <path className="home-wcs-y" d="M24 30V5m-4 5 4-5 4 5" />
              <path className="home-wcs-x" d="M24 30 42 37m-6-6 6 6-8 1" />
              <path className="home-wcs-z" d="M24 30 8 39m7-8-7 8 9 0" />
              <circle cx="24" cy="30" r="2" fill="currentColor" />
              <text x="26" y="8">Y</text><text x="40" y="32">X</text><text x="3" y="34">Z</text>
            </g>
          </svg>
        </button>
        <ThemeToggle />
      </header>

      <main id="top">
        <section className="home-hero" aria-labelledby="home-title">
          <h1 id="home-title" className="home-title">
            <span className="home-title-line">{HERO.titleTop}</span>
            <span className="home-title-line">
              <span className="home-plus" data-thread="start">
                +
              </span>{' '}
              {HERO.titleBottom}
            </span>
          </h1>
          <RollingPhrase lead={HERO.rollingLead} phrases={HERO.rolling} />
          <p className="home-lede">{HERO.lede}</p>
          <p className="home-hint home-hint-pointer">{HERO.hintPointer}</p>
          <p className="home-hint home-hint-touch">{HERO.hintTouch}</p>
        </section>

        <section id="work" className="home-work" aria-labelledby="home-work-title">
          <p className="home-label">{WORK.label}</p>
          <h2 id="home-work-title" className="home-h2">
            {WORK.heading}
          </h2>
          <ol className="home-rows" ref={rowsRef}>
            {CORE_PROJECTS.map((project) => {
              const body = (
                <>
                  <span className="home-row-number">{project.number}</span>
                  <span className="home-row-main">
                    <span className="home-row-title">{project.title}</span>
                    <span className="home-row-line">{project.line}</span>
                    <span className="home-row-tags">{project.tags}</span>
                  </span>
                  <span className="home-row-status">{project.status}</span>
                  <span className="home-row-arrow" aria-hidden="true">
                    {project.href ? '→' : '·'}
                  </span>
                </>
              )
              const enter = () => {
                setFocus(project.id)
                if (project.href) prefetchPage(document, [project.href])
              }
              const preview = {
                onMouseEnter: enter,
                onMouseLeave: () => setFocus(null),
                onFocus: enter,
                onBlur: () => setFocus(null),
              }
              const images = STACKS[project.id] ?? []
              return (
                <li key={project.id} className="home-project">
                  <div
                    className="home-row-item"
                    data-thread="row"
                    data-project={project.id}
                    data-active={focus === project.id ? '' : undefined}
                  >
                    {project.href ? (
                      <a className="home-row" href={project.href} data-fade {...preview}>
                        {body}
                      </a>
                    ) : (
                      <div className="home-row home-row-disabled" {...preview}>
                        {body}
                      </div>
                    )}
                  </div>
                  {images.length > 0 ? (
                    <ProjectStack
                      number={project.number}
                      title={project.title}
                      reviewLine={project.reviewLine}
                      reviewQuote={project.reviewQuote}
                      reviewTags={project.reviewTags}
                      images={images}
                      href={project.href}
                      linkLabel={project.linkLabel}
                      hint={WORK.stackHint}
                      onActive={activeHandlers[project.id]}
                    />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </section>

        <section id="plus" className="home-plus-section" aria-labelledby="home-plus-title">
          <p className="home-label">{PLUS.label}</p>
          <h2 id="home-plus-title" className="home-h2">
            <span className="home-accent">+</span> {PLUS.heading}
          </h2>
          <p className="home-sub">{PLUS.sub}</p>
          <ul className="home-cards">
            {PLUS_ITEMS.map((item) => (
              <li key={item.id} className="home-card" data-thread="card">
                <p className="home-card-status">{item.status}</p>
                <h3 className="home-card-title">{item.title}</h3>
                <p className="home-card-line">{item.line}</p>
                <p className="home-card-stack">{item.stack}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-quote" aria-label="Testimonial">
          <figure>
            <blockquote>
              <p>“{TESTIMONIAL.quote}”</p>
            </blockquote>
            <figcaption>
              {TESTIMONIAL.name} · {TESTIMONIAL.role}
            </figcaption>
          </figure>
        </section>

        <section id="contact" className="home-contact" aria-labelledby="home-contact-title">
          <h2 id="home-contact-title" className="home-h2">
            {CONTACT.heading}
          </h2>
          <ContactRope />
          <ul className="home-links">
            <li>
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>
              <a href={CONTACT.linkedin} rel="me noopener">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={CONTACT.github} rel="me noopener">
                GitHub
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="home-footer">
        {FOOTER.site} · {FOOTER.status} · © {year} Mark Hintz
      </footer>
    </div>
  )
}
