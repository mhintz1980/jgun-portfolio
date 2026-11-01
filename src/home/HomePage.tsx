import { useState } from 'react'
import ContactRope from './ContactRope'
import { CONTACT, CORE_PROJECTS, FOOTER, HERO, PLUS, PLUS_ITEMS, TESTIMONIAL, WORK } from './content'
import type { ProjectId } from './content'
import ThemeToggle from './ThemeToggle'
import Thread from './Thread'
import Vault from './Vault'
import './layout.css'

// The only shared file of the homepage. Effects live in their own components and CSS files;
// copy lives in content.ts. Thread anchors are marked with data-thread, in reading order.
export default function HomePage() {
  const [focus, setFocus] = useState<ProjectId | null>(null)
  const year = new Date().getFullYear()

  return (
    <div className="home">
      <Vault focus={focus} />
      <Thread />

      <header className="home-header">
        <a className="home-mark" href="#top">
          MARK HINTZ
        </a>
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
          <ol className="home-rows">
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
              const preview = {
                onMouseEnter: () => setFocus(project.id),
                onMouseLeave: () => setFocus(null),
                onFocus: () => setFocus(project.id),
                onBlur: () => setFocus(null),
              }
              return (
                <li key={project.id} className="home-row-item" data-thread="row" data-project={project.id}>
                  {project.href ? (
                    <a className="home-row" href={project.href} data-fade {...preview}>
                      {body}
                    </a>
                  ) : (
                    <div className="home-row home-row-disabled" {...preview}>
                      {body}
                    </div>
                  )}
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
