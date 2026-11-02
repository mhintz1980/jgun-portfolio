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
  const rowsRef = useRef<HTMLOListElement>(null)
  const year = new Date().getFullYear()

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

      <header className="home-header">
        <DrawnName href="#top" label="Mark Hintz, back to top" />
        <nav className="home-nav" aria-label="Sections">
          <a href="#work">Work</a>
          <a href="#plus">
            <span className="home-accent" aria-hidden="true">
              +
            </span>{' '}
            Plus
          </a>
          <a href="#contact">Contact</a>
        </nav>
        <ThemeToggle />
      </header>

      <main id="top">
        <section className="home-hero" aria-labelledby="home-title">
          <p className="home-eyebrow">{HERO.eyebrow}</p>
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
          <p className="home-cue">
            <a href="#work">
              {HERO.cue} <span aria-hidden="true">↓</span>
            </a>
          </p>
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
