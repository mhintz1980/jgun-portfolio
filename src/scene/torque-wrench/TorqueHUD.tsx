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
import { createShaftScriptFrame, sampleShaftScript } from '../inspection/shaft/script'
import { FOS_MAX, FOS_MIN, newFosPresentation, sampleFosPresentation } from '../inspection/shaft/fosPresentation'
import type { TorqueWrenchStore } from '../../state/torqueWrenchStore'
import './torque-hud.css'

/** Real copy only (ShaftStoryLayer story); no value on this scale is invented. */
const TECH_CUE = 'INPUT SHAFT P001835 · TRIED AISI 4140 / 4340 / C300\nMIN FOS < 1.0 AT THE RELIEF GROOVE — FAILED'
const TECH_ATTEMPTS = [
  { material: 'AISI 4140', hardness: '40–45 HRC' },
  { material: 'AISI 4340', hardness: '48–50 HRC' },
  { material: 'C300', hardness: '56–58 HRC' },
]
const TECH_NOTE =
  'Relief-groove blank: min FOS < 1.0 at the groove, every attempt FAILED. Revised smooth blank, rotary-hobbed AISI 4340 (H.T. 48–50 HRC), plots in the blue end.'

const CHAPTER_IDS = new Set<TorquePosterChapterId>(TORQUE_POSTER_CHAPTERS.map(entry => entry.id))

function chapterFromPoster(poster: string | undefined, fallback: TorquePosterChapterId): TorquePosterChapterId {
  return poster && CHAPTER_IDS.has(poster as TorquePosterChapterId) ? (poster as TorquePosterChapterId) : fallback
}

export function TorqueHUD({ store, playback }: { store: TorqueWrenchStore; playback: InspectionPlayback }) {
  const [chapter, setChapter] = useState<TorquePosterChapterId>(() =>
    chapterFromPoster(store.getNarrativeSample().beat.poster, 'drafting'))
  const [railOpen, setRailOpen] = useState(false)
  const fosMarkerRef = useRef<HTMLSpanElement>(null)
  const fosValueRef = useRef<HTMLSpanElement>(null)
  const captionRef = useRef<HTMLElement>(null)
  const leaderRef = useRef<SVGPolylineElement>(null)
  const leaderDotRef = useRef<SVGCircleElement>(null)

  // Stage 2 live Min-FOS sync (JG-040): while the cutter study runs, the strip's marker and
  // a small value track the same closed-form study presentation the (now suppressed) study
  // FosPanels used. Same discipline as the overlay: one pre-allocated frame + presentation,
  // 15 Hz quantized subject time, DOM writes only on discrete change, no React state.
  // The same loop drives the tracked caption→shaft leader (RuntimeWorld publishes the
  // projected study look point in the overlay sample).
  useEffect(() => {
    if (chapter !== 'inspection') return
    const frame = createShaftScriptFrame()
    const fos = newFosPresentation()
    const STATIC_LEFT = '28%'
    let raf = 0, lastTime = -1, live = false
    let captionRect: { left: number; top: number; right: number; bottom: number } | null = null
    const measureCaption = () => {
      const r = captionRef.current?.getBoundingClientRect()
      captionRect = r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null
    }
    const reset = () => {
      if (!live) return
      live = false
      if (fosMarkerRef.current) fosMarkerRef.current.style.left = STATIC_LEFT
      if (fosValueRef.current) fosValueRef.current.textContent = ''
    }
    const hideLeader = () => {
      leaderRef.current?.setAttribute('visibility', 'hidden')
      leaderDotRef.current?.setAttribute('visibility', 'hidden')
    }
    const drawLeader = (x: number, y: number) => {
      const rect = captionRect
      const line = leaderRef.current, dot = leaderDotRef.current
      if (!rect || !line || !dot) return hideLeader()
      // Tangled stubs: the anchor sits inside (or brushes) the caption block.
      if (x < rect.right + 24 && y > rect.top - 24 && y < rect.bottom + 24) return hideLeader()
      const sx = rect.right - 6, sy = rect.top
      line.setAttribute('points', `${sx.toFixed(1)},${sy.toFixed(1)} ${(x - 18).toFixed(1)},${y.toFixed(1)} ${(x - 6).toFixed(1)},${y.toFixed(1)}`)
      dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1))
      line.setAttribute('visibility', 'visible')
      dot.setAttribute('visibility', 'visible')
    }
    measureCaption()
    window.addEventListener('resize', measureCaption)
    const tick = () => {
      raf = 0
      const sample = document.hidden ? null : readTorqueOverlaySample()
      const anchor = sample?.studyAnchor
      if (anchor && anchor.visible) drawLeader(anchor.x, anchor.y)
      else hideLeader()
      const active = Boolean(sample?.studyVisible && Number.isFinite(sample?.subjectTime))
      if (!active) { lastTime = -1; reset() }
      else {
        const time = Math.round(sample!.subjectTime * 15) / 15
        if (time !== lastTime) {
          lastTime = time
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
    return () => { cancelAnimationFrame(raf); reset(); hideLeader(); window.removeEventListener('resize', measureCaption) }
  }, [chapter])

  useEffect(() => {
    // Same subscription pattern as Scene's activateStory: beat granularity, never per-frame.
    setChapter(current => chapterFromPoster(store.getNarrativeSample().beat.poster, current))
    return store.subscribeBeat(sample => setChapter(current => chapterFromPoster(sample.beat.poster, current)))
  }, [store])

  const index = TORQUE_POSTER_CHAPTERS.findIndex(entry => entry.id === chapter)
  const copy = CHAPTER_COPY[chapter]

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
    const start = chapterStart.get(id)
    if (start === undefined) return
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

      {chapter === 'inspection' && (
        <svg className="torque-hud__leader" aria-hidden="true">
          <polyline ref={leaderRef} visibility="hidden" />
          <circle ref={leaderDotRef} r="2.5" visibility="hidden" />
        </svg>
      )}

      <section ref={captionRef} className="torque-hud__caption" aria-live="polite" aria-label="Current chapter">
        {/* Keyed by chapter: the copy remounts on chapter change and fades/rises in
            (motion review, JG-040 Stage 2) — a quiet swap, never a scroll-driven effect. */}
        <div className="torque-hud__caption-copy" key={chapter}>
          <p className="torque-hud__kicker">
            <span>{String(index + 1).padStart(2, '0')} / 05</span>
            <span className="torque-hud__rule" aria-hidden="true" />
            <span>The JGun story</span>
          </p>
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
        <aside className="torque-hud__tech" aria-label="Inspection evidence">
          <p className="torque-hud__tech-head">INSPECTION · INPUT SHAFT P001835</p>
          <ul className="torque-hud__tech-attempts">
            {TECH_ATTEMPTS.map(attempt => (
              <li key={attempt.material}>
                <span>{attempt.material}</span>
                <span>{attempt.hardness}</span>
                <span className="torque-hud__tech-fail">FAILED</span>
              </li>
            ))}
          </ul>
          <div
            className="torque-hud__fos"
            role="img"
            aria-label="Factor-of-safety scale from 0 to 3; every relief-groove attempt stays below 1.0"
          >
            <span className="torque-hud__fos-title">FOS<span className="torque-hud__fos-live" ref={fosValueRef} aria-hidden="true" /></span>
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
              aria-current={entry.id === chapter ? 'step' : undefined}
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
