import { useEffect, useMemo, useRef, useState } from 'react'
import { prefetchPage } from '../shared/pageFade'
import ContactRope from './ContactRope'
import DrawnName from './DrawnName'
import ProjectStack from './ProjectStack'
import RollingPhrase from './RollingPhrase'
import ShowreelSection from './ShowreelSection'
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
  const [menuInstant, setMenuInstant] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const wcsRef = useRef<HTMLSpanElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const menuLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoreNavFocusRef = useRef(false)
  const rowsRef = useRef<HTMLOListElement>(null)
  const year = new Date().getFullYear()

  useEffect(() => {
    let frame = 0
    let gateFrame = 0
    let gateVersion = 0
    let phase: 'expanded' | 'collapsing' | 'compact' = 'expanded'
    let touchY: number | null = null
    let touchHeld = false
    let wasScrolled = window.scrollY > 1
    let restoreFrame = 0
    let restorePending = true
    let disposed = false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const header = document.querySelector<HTMLElement>('.home-header')
    const theme = header?.querySelector<HTMLElement>('.home-theme-toggle')
    const setCompact = (compact: boolean) => {
      const active = document.activeElement
      if (compact) header?.setAttribute('data-header-used', '')
      if (compact && !header?.hasAttribute('data-compact') && active?.closest('.home-nav')) restoreNavFocusRef.current = true
      if (!compact && active === menuButtonRef.current) {
        // Work remains visually hidden during the reverse WCS sequence. The name
        // is immediately available, so focus never lands in hidden navigation.
        header?.querySelector<HTMLElement>('.home-name')?.focus({ preventScroll: true })
      }
      setCompactHeader(compact)
    }
    const measure = () => {
      const work = header?.querySelector<HTMLElement>('.home-nav a')
      if (!header || !work || !theme) return
      // Remove the current translation mathematically: fonts/orientation may change
      // the underlying flex layout even while the controls are compact.
      const box = theme.getBoundingClientRect()
      const transform = new DOMMatrixReadOnly(getComputedStyle(theme).transform)
      header.style.setProperty('--theme-corner-x', `${document.documentElement.clientWidth - 8 - box.right + transform.m41}px`)
      header.style.setProperty('--theme-corner-y', `${8 - box.top + transform.m42}px`)
      // Closed compact links retain the expanded flex layout; scale(.4) leaves
      // their centers unchanged. Keep the reverse destinations current as well.
      if (!header.hasAttribute('data-menu-open')) {
        const rect = work.getBoundingClientRect()
        const startX = rect.left + rect.width / 2
        const endX = document.documentElement.clientWidth - 96 - 24
        header.style.setProperty('--wcs-start-x', `${startX - endX}px`)
        header.style.setProperty('--wcs-start-y', `${rect.top + rect.height / 2 - 32}px`)
        const links = header.querySelectorAll<HTMLElement>('.home-nav a')
        for (const [index, name] of [[1, 'plus'], [2, 'contact']] as const) {
          const link = links[index]?.getBoundingClientRect()
          if (link && endX !== startX) {
            const progress = Math.max(0, Math.min(1, (link.left + link.width / 2 - startX) / (endX - startX)))
            header.style.setProperty(`--wcs-${name}-progress`, String(progress))
          }
        }
      }
    }
    const cancelGate = () => {
      gateVersion++
      cancelAnimationFrame(gateFrame)
    }
    const expand = () => {
      cancelGate()
      phase = 'expanded'
      setCompact(false)
    }
    const collapse = () => {
      cancelGate()
      phase = 'collapsing'
      const version = gateVersion
      const begin = () => {
        if (version !== gateVersion) return
        // Cold fonts may still be measuring the individual glyphs. Hold input
        // until DrawnName's bounded font fallback has supplied the same geometry.
        if (!header?.querySelector('.home-name[data-ready]')) { gateFrame = requestAnimationFrame(begin); return }
        measure()
        setCompact(true)
        // React must commit the compact state before the browser exposes its CSS transitions.
        gateFrame = requestAnimationFrame(() => {
          gateFrame = requestAnimationFrame(() => {
            if (version !== gateVersion) return
            const settle = () => {
              if (version !== gateVersion || phase !== 'collapsing') return
              // Re-query each frame so resize/reversal/canceled transitions cannot
              // unlock an obsolete snapshot. Include the WCS's separate translate.
              const moving = header?.getAnimations({ subtree: true }).some((animation) => {
                if (!(animation instanceof CSSTransition) || !['transform', 'translate', 'opacity'].includes(animation.transitionProperty)) return false
                const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null
                return (animation.playState === 'running' || animation.pending) && target instanceof Element &&
                  target.matches('.home-name, .home-letter, .home-nav-toggle, .home-wcs-spin, .home-theme-toggle')
              })
              if (moving) gateFrame = requestAnimationFrame(settle)
              else { phase = 'compact' }
            }
            settle()
          })
        })
      }
      begin()
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
          measure()
          setCompact(true)
          return
        }
        collapse()
      }
      if (phase === 'collapsing' && event.cancelable) event.preventDefault()
    }
    const wheel = (event: WheelEvent) => {
      restorePending = false
      if (!event.ctrlKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) input(Math.sign(event.deltaY), event)
    }
    const touchStart = (event: TouchEvent) => {
      restorePending = false
      touchHeld = false
      touchY = event.touches.length === 1 && !(event.target instanceof Element && event.target.closest('.home-rope'))
        ? event.touches[0].clientY : null
    }
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) { touchY = null; return }
      const next = event.touches[0].clientY
      const delta = touchY - next
      if (Math.abs(delta) >= 2) {
        touchY = next
        input(Math.sign(delta), event)
        if (event.defaultPrevented) touchHeld = true
        // A canceled touchmove disables native scrolling for this entire gesture.
        // Continue that same swipe after release; the next gesture is fully native.
        else if (touchHeld && event.cancelable) {
          event.preventDefault()
          window.scrollBy({ top: delta, behavior: 'instant' })
        }
      }
    }
    const touchEnd = () => { touchY = null; touchHeld = false }
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
          (event.target instanceof Element && (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ||
            (event.key === ' ' && event.target.closest('button, a'))))) return
      const down = event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === 'End' || (event.key === ' ' && !event.shiftKey)
      const up = event.key === 'ArrowUp' || event.key === 'PageUp' || event.key === 'Home' || (event.key === ' ' && event.shiftKey)
      if (down || up) { restorePending = false; input(down ? 1 : -1, event) }
    }
    const update = () => {
      frame = 0
      // Native anchors, restored scroll positions and focus-driven scrolling bypass the gate.
      if (window.scrollY > 1) {
        if (phase === 'collapsing') cancelGate()
        phase = 'compact'
        setCompact(true)
        wasScrolled = true
      } else if (wasScrolled) { wasScrolled = false; expand() }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = () => { measure(); schedule() }
    const focusIn = (event: FocusEvent) => {
      restorePending = false
      const target = event.target
      // Carousel cards manage their own roving focus as they move around the arc.
      if (phase !== 'expanded' && target instanceof HTMLElement && target.closest('main') && !target.closest('.home-arc-card')) {
        const rect = target.getBoundingClientRect()
        const name = header?.querySelector<HTMLElement>('.home-name')
        const nameRect = name?.getBoundingClientRect()
        const monogramWidth = name ? parseFloat(getComputedStyle(name).getPropertyValue('--monogram-end')) / 100 : 0
        const controls: Array<Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'> | undefined> = [theme?.getBoundingClientRect(), wcsRef.current?.getBoundingClientRect()]
        if (menuButtonRef.current && Number(getComputedStyle(menuButtonRef.current).opacity) > 0) controls.push(menuButtonRef.current.getBoundingClientRect())
        if (nameRect) controls.push({ left: nameRect.left, right: nameRect.left + nameRect.width * (monogramWidth || 0.3), top: nameRect.top, bottom: nameRect.bottom })
        if (controls.some((box) => box && rect.left < box.right && rect.right > box.left && rect.top < box.bottom && rect.bottom > box.top)) {
          target.scrollIntoView({ block: 'center', behavior: 'instant' })
        }
      }
    }
    const motionChange = () => { if (phase === 'collapsing' && reducedMotion.matches) { cancelGate(); phase = 'compact' } }
    const savePosition = () => {
      // Native restoration can run before React has created the tall page.
      // Store this entry's position, preserving any existing history metadata.
      try { history.replaceState({ ...history.state, jgHomeScrollY: window.scrollY }, '') } catch { /* Native history remains available. */ }
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', resize)
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('touchend', touchEnd)
    window.addEventListener('touchcancel', touchEnd)
    window.addEventListener('keydown', keydown)
    document.addEventListener('focusin', focusIn)
    reducedMotion.addEventListener('change', motionChange)
    window.addEventListener('pagehide', savePosition)
    const observer = new ResizeObserver(resize)
    if (header) observer.observe(header)
    measure()
    update()
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const savedY = history.state?.jgHomeScrollY
    const hash = window.location.hash
    const restorePosition = () => {
      if (disposed || !restorePending) return
      restorePending = false
      if (window.location.hash !== hash) return
      if ((navigation?.type === 'back_forward' || navigation?.type === 'reload') && typeof savedY === 'number' && savedY > 1) {
        window.scrollTo({ top: savedY, behavior: 'instant' })
      } else if (hash) {
        // A fragment may have been resolved before the client-rendered sections
        // existed. Use the native target and its authored scroll margin.
        try { document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start', behavior: 'instant' }) } catch { /* Ignore malformed fragments. */ }
      }
      measure()
      update()
    }
    void document.fonts.ready.then(() => { if (!disposed) restoreFrame = requestAnimationFrame(restorePosition) })
    return () => {
      disposed = true
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', resize)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchend', touchEnd)
      window.removeEventListener('touchcancel', touchEnd)
      window.removeEventListener('keydown', keydown)
      document.removeEventListener('focusin', focusIn)
      reducedMotion.removeEventListener('change', motionChange)
      window.removeEventListener('pagehide', savePosition)
      observer.disconnect()
      cancelGate()
      if (frame) cancelAnimationFrame(frame)
      cancelAnimationFrame(restoreFrame)
    }
  }, [])

  useEffect(() => {
    if (compactHeader && restoreNavFocusRef.current) {
      restoreNavFocusRef.current = false
      menuButtonRef.current?.focus({ preventScroll: true })
    }
    if (!compactHeader) { setMenuOpen(false); setMenuInstant(false) }
  }, [compactHeader])

  useEffect(() => {
    const dismissOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!headerRef.current?.contains(target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', dismissOutside)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      if (menuLeaveTimer.current) clearTimeout(menuLeaveTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!compactHeader || !menuOpen) return
    const trackPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const nav = navRef.current?.getBoundingClientRect()
      if (!nav) return
      // Keep the reverse animation open while the pointer travels between the
      // corner and the links, without placing an invisible layer over the page.
      const inside = event.clientX >= Math.min(nav.left, window.innerWidth - 144) - 12 &&
        event.clientX <= Math.max(nav.right, window.innerWidth - 96) + 12 &&
        event.clientY >= 0 && event.clientY <= Math.max(nav.bottom, 56) + 12
      if (inside) {
        if (menuLeaveTimer.current) clearTimeout(menuLeaveTimer.current)
        menuLeaveTimer.current = null
      } else if (!menuLeaveTimer.current) {
        menuLeaveTimer.current = setTimeout(() => {
          menuLeaveTimer.current = null
          if (!navRef.current?.contains(document.activeElement) && document.activeElement !== menuButtonRef.current) setMenuOpen(false)
        }, 160)
      }
    }
    const leaveDocument = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && !navRef.current?.contains(document.activeElement) && document.activeElement !== menuButtonRef.current) setMenuOpen(false)
    }
    document.addEventListener('pointermove', trackPointer, { passive: true })
    document.addEventListener('pointerleave', leaveDocument)
    return () => {
      document.removeEventListener('pointermove', trackPointer)
      document.removeEventListener('pointerleave', leaveDocument)
      if (menuLeaveTimer.current) clearTimeout(menuLeaveTimer.current)
      menuLeaveTimer.current = null
    }
  }, [compactHeader, menuOpen])

  const cancelMenuLeave = () => {
    if (menuLeaveTimer.current) clearTimeout(menuLeaveTimer.current)
    menuLeaveTimer.current = null
  }
  const enterMenu = (event: React.PointerEvent) => {
    if (!compactHeader || event.pointerType === 'touch') return
    cancelMenuLeave()
    setMenuInstant(false)
    setMenuOpen(true)
  }
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
    <div className="home" id="top">
      <Vault focus={focus} />
      <Thread />

      <header ref={headerRef} className="home-header" data-compact={compactHeader ? '' : undefined} data-menu-open={menuOpen ? '' : undefined} data-menu-instant={menuInstant ? '' : undefined} onKeyDown={(event) => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButtonRef.current?.focus() } }}>
        <div className="home-identity">
          <DrawnName href="#top" label="Mark Hintz, back to top" />
          <p className="home-eyebrow">{HERO.eyebrow}</p>
        </div>
        <nav ref={navRef} id="home-navigation" className="home-nav" aria-label="Sections" inert={compactHeader && !menuOpen} onPointerEnter={cancelMenuLeave} onBlur={(event) => { if (compactHeader && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== menuButtonRef.current) setMenuOpen(false) }} onClick={() => { if (compactHeader) menuButtonRef.current?.focus({ preventScroll: true }); setMenuOpen(false) }}>
          <a href="#work">Work</a>
          <a href="#plus">
            <span className="home-accent" aria-hidden="true">
              +
            </span>{' '}
            Plus
          </a>
          <a href="#contact">Contact</a>
        </nav>
        <span ref={wcsRef} className="home-nav-toggle" aria-hidden="true" onPointerEnter={enterMenu}>
          <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <g className="home-wcs-spin">
              <path className="home-wcs-y" d="M24 30V5m-4 5 4-5 4 5" />
              <path className="home-wcs-x" d="M24 30 42 37m-6-6 6 6-8 1" />
              <path className="home-wcs-z" d="M24 30 8 39m7-8-7 8 9 0" />
              <circle cx="24" cy="30" r="2" fill="currentColor" />
              <text x="26" y="8">Y</text><text x="40" y="32">X</text><text x="3" y="34">Z</text>
            </g>
          </svg>
        </span>
        <button ref={menuButtonRef} className="home-menu-trigger" type="button" aria-label="Sections menu" aria-expanded={menuOpen} aria-controls="home-navigation" tabIndex={compactHeader ? 0 : -1} onBlur={(event) => { if (compactHeader && !navRef.current?.contains(event.relatedTarget)) setMenuOpen(false) }} onClick={(event) => { cancelMenuLeave(); const opening = !menuOpen; setMenuInstant(event.detail === 0); setMenuOpen(opening); if (opening && event.detail === 0) requestAnimationFrame(() => navRef.current?.querySelector<HTMLElement>('a')?.focus()) }}>Menu</button>
        <ThemeToggle />
      </header>

      <main>
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

        <ShowreelSection />

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
