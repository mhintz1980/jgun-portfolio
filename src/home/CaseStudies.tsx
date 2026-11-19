import { useState } from 'react'
import ModelBench from './ModelBench'
import { CASE_STUDIES, LIFECYCLE_COPY, LIFECYCLE_STAGES, SHOWCASE, TOOLCHAIN_STEPS } from './content'
import type { CaseStudy } from './content'
import { FIRST_PRODUCTION_STAGE, NEW_PUMP, advance, assignSerial } from './lifecycle'
import type { PumpState } from './lifecycle'
import './showcase.css'

// The four case files. Mechanical ones carry a live model bench; software ones carry a diagram of
// what the software does. Copy lives in content.ts.

/** PumpTracker's stage rules, small enough to try: advance an order and hit the serial gate. */
function LifecycleDemo() {
  const [pump, setPump] = useState<PumpState>(NEW_PUMP)
  const [message, setMessage] = useState<string>(LIFECYCLE_COPY.idle)
  const [blocked, setBlocked] = useState(0)

  const next = () => {
    const result = advance(pump, LIFECYCLE_STAGES.length)
    if (result.ok) {
      setPump(result.state)
      setMessage(result.state.stage === LIFECYCLE_STAGES.length - 1 ? LIFECYCLE_COPY.closed : `${LIFECYCLE_COPY.moved} ${LIFECYCLE_STAGES[result.state.stage]}.`)
    } else if (result.reason === 'no-serial') {
      setBlocked((count) => count + 1)
      setMessage(LIFECYCLE_COPY.blocked)
    } else setMessage(LIFECYCLE_COPY.closed)
  }
  const assign = () => {
    setPump(assignSerial)
    setMessage(LIFECYCLE_COPY.assigned + '.')
  }
  const reset = () => {
    setPump(NEW_PUMP)
    setMessage(LIFECYCLE_COPY.idle)
  }

  return (
    <div className="lifecycle" data-serial={pump.serial ? '' : undefined}>
      <ol className="lifecycle-stages">
        {LIFECYCLE_STAGES.map((stage, index) => (
          <li
            key={stage}
            className="lifecycle-stage"
            data-state={index < pump.stage ? 'done' : index === pump.stage ? 'current' : 'ahead'}
            data-gate={index === FIRST_PRODUCTION_STAGE ? '' : undefined}
            aria-current={index === pump.stage ? 'step' : undefined}
          >
            <span className="lifecycle-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="lifecycle-name">{stage}</span>
          </li>
        ))}
      </ol>
      <div className="lifecycle-panel">
        <p className="lifecycle-try">{LIFECYCLE_COPY.try}</p>
        <div className="lifecycle-actions">
          <button type="button" className="press" onClick={next} disabled={pump.stage === LIFECYCLE_STAGES.length - 1}>
            {LIFECYCLE_COPY.advance} <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="press press-quiet" onClick={assign} aria-pressed={pump.serial} disabled={pump.serial}>
            {pump.serial ? LIFECYCLE_COPY.assigned : LIFECYCLE_COPY.assign}
          </button>
          <button type="button" className="press press-quiet" onClick={reset}>
            {LIFECYCLE_COPY.reset}
          </button>
        </div>
        {/* The key restarts the shake each time the gate refuses. */}
        <p key={blocked} className="lifecycle-message" data-blocked={message === LIFECYCLE_COPY.blocked ? '' : undefined} role="status">
          {message}
        </p>
      </div>
    </div>
  )
}

function Toolchain() {
  return (
    <ol className="toolchain">
      {TOOLCHAIN_STEPS.map((step, index) => (
        <li key={step.label} className="toolchain-step" data-built={step.built ? '' : undefined}>
          <span className="toolchain-index">{String(index + 1).padStart(2, '0')}</span>
          <span className="toolchain-label">{step.label}</span>
          <span className="toolchain-state">{step.built ? 'Runs today' : 'Specified'}</span>
        </li>
      ))}
    </ol>
  )
}

function Visual({ study }: { study: CaseStudy }) {
  if (study.visual === 'gear-core' || study.visual === 'enclosure') {
    return <ModelBench variant={study.visual} label={`3D model: ${study.visualCaption}`} caption={study.visualCaption} />
  }
  return (
    <figure className="case-diagram">
      {study.visual === 'lifecycle' ? <LifecycleDemo /> : <Toolchain />}
      <figcaption className="bench-caption">{study.visualCaption}</figcaption>
    </figure>
  )
}

export default function CaseStudies() {
  return (
    <section id="cases" className="cases" aria-labelledby="cases-title">
      <header className="cases-head">
        <p className="home-label">{SHOWCASE.label}</p>
        <h2 id="cases-title" className="home-h2">
          {SHOWCASE.heading}
        </h2>
        <p className="home-sub">{SHOWCASE.sub}</p>
      </header>
      <ol className="cases-list">
        {CASE_STUDIES.map((study) => (
          <li key={study.id} className="case" data-case={study.id} data-thread="card">
            <div className="case-text">
              <p className="case-meta">
                <span className="case-number">{study.number}</span>
                <span className="case-status">{study.status}</span>
              </p>
              <h3 className="case-title">{study.title}</h3>
              <p className="case-summary">{study.summary}</p>
              <dl className="case-facts">
                {study.facts.map((fact) => (
                  <div key={fact.label} className="case-fact">
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="case-stack">{study.stack}</p>
              {study.links.length > 0 ? (
                <ul className="case-links">
                  {study.links.map((link) => (
                    <li key={link.href}>
                      {link.external ? (
                        <a className="press" href={link.href} target="_blank" rel="noopener noreferrer">
                          {link.label} <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <a className="press" href={link.href} data-fade>
                          {link.label} <span aria-hidden="true">→</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="case-visual">
              <Visual study={study} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
