// JG-040 — the live-mode HUD, owner-chosen concept D (A+ museum caption) with inline
// technical content (ruling 2026-11-03). One fixed, quiet chrome layer: per-state caption,
// named chapter rail (desktop) / labeled Chapters disclosure (narrow), WIP label, scrims,
// and the real cutter controls for the Inspection chapter. The flowing story stays in the
// DOM for pacing and static modes; in live mode it is hidden + inert and this component is
// its complete visible equivalent, so chapter changes are announced politely here.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { InspectionPlayback } from './inspectionPlayback'
import { torqueLenisScrollTo } from './conductorRuntime'
import { TORQUE_POSTER_CHAPTERS, type TorquePosterChapterId } from './posterMap'
import { TORQUE_BEATS } from './beats'
import { torqueScrollFraction } from './scrollPacing'
import { CHAPTER_COPY, InspectionControl } from './Story'
import { readTorqueOverlaySample } from './hotspotData'
import { torqueHudChapter, torqueHudSeekStart } from './hudChapter'
import { sampleMechanism, type MechanismSample } from './MechanismDirector'
import { TORQUE_RAIL_TOOLTIPS, TORQUE_TERM_TOOLTIPS, torqueHudStepText } from './hudCopy'
import { createShaftScriptFrame, sampleShaftScript } from '../inspection/shaft/script'
import { CASCADE_TORQUE_PATH, FOS_PANEL_CUTOFF, FOS_PANEL_FADE, fosPanelOpacity, torquePathLitCount } from '../inspection/shaft/schedule'
import { FOS_MAX, FOS_MIN, newFosPresentation, sampleFosPresentation } from '../inspection/shaft/fosPresentation'
import type { TorqueWrenchStore } from '../../state/torqueWrenchStore'
import './torque-hud.css'

/** Real copy only (ShaftStoryLayer story); no value on this scale is invented. */
const TECH_CUE = 'The relief groove is the stress riser. Changing steel did not move it.'
const TECH_ATTEMPTS = [
  { material: 'AISI 4140', hardness: '40–45 HRC' },
  { material: 'AISI 4340', hardness: '48–50 HRC' },
  { material: 'C300', hardness: '56–58 HRC' },
]
const TECH_NOTE =
  'Groove blank: min FOS under 1.0 in every steel. Fix: rotary-hob a smooth 4340 blank (48–50 HRC) with no groove. It plots in the blue.'

const CHAPTER_IDS = new Set<TorquePosterChapterId>(TORQUE_POSTER_CHAPTERS.map(entry => entry.id))

function chapterFromPoster(poster: string | undefined, fallback: TorquePosterChapterId): TorquePosterChapterId {
  return poster && CHAPTER_IDS.has(poster as TorquePosterChapterId) ? (poster as TorquePosterChapterId) : fallback
}

export function TorqueHUD({ store, playback }: { store: TorqueWrenchStore; playback: InspectionPlayback }) {
  const [railChapter, setRailChapter] = useState<TorquePosterChapterId>(() =>
    chapterFromPoster(store.getNarrativeSample().beat.poster, 'drafting'))
  const [chapter, setChapter] = useState(() => torqueHudChapter(railChapter, readTorqueOverlaySample()?.studyVisible === true))
  const [railOpen, setRailOpen] = useState(false)
  const [beatId, setBeatId] = useState<string | undefined>(() => store.getNarrativeSample().beat.id)
  const fosMarkerRef = useRef<HTMLSpanElement>(null)
  const fosValueRef = useRef<HTMLSpanElement>(null)
  const techRef = useRef<HTMLElement>(null)
  const modesRef = useRef<HTMLDivElement>(null)
  const showModes = beatId === 'mechanism-switch' && chapter === 'mechanism'
  const pathRef = useRef<HTMLDivElement>(null)
  // Torque-path tracker (audit #3): mounted for the runout + cascade beats, revealed once
  // Stage 1 starts turning (subject 38.2 s, inside the runout beat's ignition).
  const showPath = chapter === 'inspection' && (beatId === 'inspection-runout' || beatId === 'inspection-cascade')

  // Mode pills (animation audit #2): the same closed-form shift the ring uses (0 Rundown →
  // 1 High Torque over .520–.545), written to one CSS variable. No React state per frame.
  useEffect(() => {
    if (!showModes) return
    const sample = {} as MechanismSample
    let raf = 0, last = -1
    const tick = () => {
      const shift = Math.round(sampleMechanism(store.getNarrativeSample().progress, sample).shift * 100) / 100
      if (shift !== last && modesRef.current) {
        last = shift
        modesRef.current.style.setProperty('--shift', String(shift))
        modesRef.current.dataset.mode = shift >= 0.5 ? 'high' : 'rundown'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [showModes, store])

  // Torque-path tracker: lit count from the study's own subject clock (CASCADE_TORQUE_PATH),
  // written as data attributes only when the count changes. No React state per frame.
  useEffect(() => {
    if (!showPath) return
    let raf = 0, last = -1
    const tick = () => {
      const sample = document.hidden ? null : readTorqueOverlaySample()
      const lit = sample?.studyVisible ? torquePathLitCount(Math.round(sample.subjectTime * 15) / 15) : 0
      const root = pathRef.current
      if (lit !== last && root) {
        last = lit
        root.dataset.lit = String(lit)
        const steps = root.children
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i] as HTMLElement
          step.dataset.on = Number(step.dataset.step) < lit ? 'true' : 'false'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [showPath])

  // Stage 2 live Min-FOS sync (JG-040): while the cutter study runs, the strip's marker and
  // a small value track the same closed-form study presentation the (now suppressed) study
  // FosPanels used. Same discipline as the overlay: one pre-allocated frame + presentation,
  // 15 Hz quantized subject time, DOM writes only on discrete change, no React state.
  useEffect(() => {
    if (chapter !== 'inspection') return
    const frame = createShaftScriptFrame()
    const fos = newFosPresentation()
    const STATIC_LEFT = '28%'
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let raf = 0, lastTime = -1, live = false, lastPanel = -1
    // Owner 2026-11-05: the FEA evidence panel is gone before any Stage 1 planet moves toward the
    // input shaft. Scrubbed by subject time (not wall clock), so a fast scroll cannot outrun it.
    const writePanel = (opacity: number) => {
      if (opacity === lastPanel || !techRef.current) return
      lastPanel = opacity
      techRef.current.style.opacity = opacity === 1 ? '' : String(opacity)
      techRef.current.style.visibility = opacity === 0 ? 'hidden' : ''
    }
    const reset = () => {
      if (!live) return
      live = false
      if (fosMarkerRef.current) fosMarkerRef.current.style.left = STATIC_LEFT
      if (fosValueRef.current) fosValueRef.current.textContent = ''
    }
    const tick = () => {
      raf = 0
      const sample = document.hidden ? null : readTorqueOverlaySample()
      const active = Boolean(sample?.studyVisible && Number.isFinite(sample?.subjectTime))
      if (!active) { lastTime = -1; reset(); writePanel(1) }
      else {
        const time = Math.round(sample!.subjectTime * 15) / 15
        if (time !== lastTime) {
          lastTime = time
          writePanel(reduced?.matches
            ? (time < FOS_PANEL_CUTOFF - FOS_PANEL_FADE ? 1 : 0)
            : Math.round(fosPanelOpacity(time) * 100) / 100)
          sampleShaftScript(time, false, frame)
          sampleFosPresentation(time, frame.stress, frame.stressMix, fos)
          if (fos.kind === 'none') reset()
          else {
            live = true
            if (fosMarkerRef.current) {
              const pct = (((fos.hotspot - FOS_MIN) / (FOS_MAX - FOS_MIN)) * 100).toFixed(1) + '%'
              fosMarkerRef.current.style.left = pct
            }
            if (fosValueRef.current) fosValueRef.current.textContent = fos.hotspot.toFixed(2)
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); reset() }
  }, [chapter])

  useEffect(() => {
    // Same subscription pattern as Scene's activateStory: beat granularity, never per-frame.
    setRailChapter(current => chapterFromPoster(store.getNarrativeSample().beat.poster, current))
    setBeatId(store.getNarrativeSample().beat.id)
    return store.subscribeBeat(sample => {
      setRailChapter(current => chapterFromPoster(sample.beat.poster, current))
      setBeatId(sample.beat.id)
    })
  }, [store])

  useEffect(() => {
    // .845 is inside inspection-return: beat subscriptions alone miss the source handoff.
    // Use effective runtime visibility so a cold seek holds Mechanism while the shaft loads.
    // Poll the imperative port, but publish React state only on a discrete chrome change.
    let raf = 0
    let current = torqueHudChapter(railChapter, readTorqueOverlaySample()?.studyVisible === true)
    setChapter(current)
    const tick = () => {
      const next = torqueHudChapter(railChapter, readTorqueOverlaySample()?.studyVisible === true)
      if (next !== current) { current = next; setChapter(next) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [store, railChapter])

  const index = TORQUE_POSTER_CHAPTERS.findIndex(entry => entry.id === chapter)
  const copy = CHAPTER_COPY[chapter]
  const step = torqueHudStepText(beatId, chapter)

  // Chapter seek targets the chapter's first beat window, not the story section's grid slot:
  // the pacing map is non-linear (paced tail), so even grid spacing over the document does not
  // correspond to narrative windows. First beat start + one epsilon lands inside the window.
  const chapterStart = useMemo(() => {
    const starts = new Map<TorquePosterChapterId, number>()
    for (const beat of TORQUE_BEATS) {
      const poster = beat.poster
      if (poster && !starts.has(poster as TorquePosterChapterId)) starts.set(poster as TorquePosterChapterId, beat.start)
    }
    return starts
  }, [])

  const seekChapter = (id: TorquePosterChapterId) => {
    setRailOpen(false)
    const beatStart = chapterStart.get(id)
    if (beatStart === undefined) return
    const start = torqueHudSeekStart(id, beatStart)
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max <= 0) return
    const target = torqueScrollFraction(Math.min(1, start + 0.001)) * max
    if (!torqueLenisScrollTo(target, 0.9)) window.scrollTo({ top: target, behavior: 'smooth' })
  }

  return (
    <div className="torque-hud" data-torque-hud-chapter={chapter} data-rail-open={railOpen || undefined}>
      <div className="torque-hud__scrim-top" aria-hidden="true" />
      <div className="torque-hud__scrim-edge" aria-hidden="true" />
      {/* Owner ruling 2026-11-03 (Stage 2): small fixed brand mast top-left, mono caps with
          the concept's gold; the WIP label keeps the top-right corner. */}
      <p className="torque-hud__mast">studiomark</p>
      <p className="torque-hud__wip">Work in progress</p>

      <section className="torque-hud__caption" aria-live="polite" aria-label="Current chapter">
        {/* Keyed by chapter: the copy remounts on chapter change and fades/rises in
            (motion review, JG-040 Stage 2) — a quiet swap, never a scroll-driven effect. */}
        <div className="torque-hud__caption-copy" key={chapter}>
          <p className="torque-hud__kicker">
            <span>{String(index + 1).padStart(2, '0')} / 05</span>
            <span className="torque-hud__rule" aria-hidden="true" />
            <span>The torque wrench story</span>
          </p>
          {/* Step line (copy deck 2026-11-05): keyed by text so it fades on beat change. */}
          {step && <p className="torque-hud__step" key={step}>{step}</p>}
          {showModes && (
            <div className="torque-hud__modes" ref={modesRef} data-mode="rundown" aria-hidden="true">
              <span className="torque-hud__mode torque-hud__mode--rundown">Rundown</span>
              <span className="torque-hud__mode torque-hud__mode--high">High Torque</span>
            </div>
          )}
          {showPath && (
            <div className="torque-hud__path" ref={pathRef} data-lit="0" aria-hidden="true">
              {CASCADE_TORQUE_PATH.map((dot, i) => [
                i > 0 && <span key={`link-${dot.label}`} className="torque-hud__path-link" data-step={i} data-on="false" />,
                <span key={dot.label} className="torque-hud__path-dot" data-step={i} data-on="false">{dot.label}</span>,
              ])}
            </div>
          )}
          <h3 className="torque-hud__title">{copy.title}</h3>
          <p className="torque-hud__lede">{copy.lede}</p>
          {chapter === 'inspection' && (
            <p className="torque-hud__cue">{TECH_CUE}</p>
          )}
        </div>
        {chapter === 'inspection'
          ? <InspectionControl playback={playback} live />
          : (
            <details className="torque-hud__details">
              <summary>Explore details</summary>
              <p>{copy.body}</p>
            </details>
          )}
      </section>

      {chapter === 'inspection' && (
        <aside className="torque-hud__tech" ref={techRef} aria-label="Inspection evidence">
          <p className="torque-hud__tech-head">INSPECTION · INPUT SHAFT P001835</p>
          <ul className="torque-hud__tech-attempts">
            {TECH_ATTEMPTS.map(attempt => (
              <li key={attempt.material}>
                <span>{attempt.material}</span>
                <span>{attempt.hardness.replace(' HRC', '')} <abbr title={TORQUE_TERM_TOOLTIPS.HRC}>HRC</abbr></span>
                <span className="torque-hud__tech-fail">FAILED</span>
              </li>
            ))}
          </ul>
          <div
            className="torque-hud__fos"
            role="img"
            aria-label="Factor-of-safety scale from 0 to 3; every relief-groove attempt stays below 1.0"
          >
            <span className="torque-hud__fos-title"><abbr title={TORQUE_TERM_TOOLTIPS.FOS}>FOS</abbr><span className="torque-hud__fos-live" ref={fosValueRef} aria-hidden="true" /></span>
            <span className="torque-hud__fos-scale"><span className="torque-hud__fos-marker" ref={fosMarkerRef} /></span>
            <span className="torque-hud__fos-ticks"><span>0</span><span>1.0</span><span>2.0</span><span>3.0</span></span>
          </div>
          <p className="torque-hud__tech-note">{TECH_NOTE}</p>
        </aside>
      )}

      <nav className="torque-hud__rail" aria-label="Story chapters">
        <button
          type="button"
          className="torque-hud__chapters-toggle"
          aria-expanded={railOpen}
          aria-controls="torque-hud-chapter-list"
          onClick={() => setRailOpen(open => !open)}
        >
          The story · Chapters <span aria-hidden="true">⌄</span>
        </button>
        <div className="torque-hud__rail-list" id="torque-hud-chapter-list" data-open={railOpen || undefined}>
          {TORQUE_POSTER_CHAPTERS.map((entry, entryIndex) => (
            <button
              key={entry.id}
              type="button"
              className="torque-hud__rail-button"
              aria-current={entry.id === railChapter ? 'step' : undefined}
              title={TORQUE_RAIL_TOOLTIPS[entry.id]}
              onClick={() => seekChapter(entry.id)}
            >
              <span className="torque-hud__rail-index">{String(entryIndex + 1).padStart(2, '0')}</span>
              <span className="torque-hud__rail-name">{entry.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default TorqueHUD
