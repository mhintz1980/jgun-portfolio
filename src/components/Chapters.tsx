import { useEffect, useState } from 'react'
import { ASSEMBLY_IDENTITY, CASE_STUDIES, CHAPTERS } from '../data/caseStudies'
import type { CaseStudy } from '../types/portfolio'
import { useQuality } from '../state/qualityStore'
import { useScrollValue } from '../state/scrollStore'
import { DRAWING_INTRO_WINDOW, pacedProgress } from '../scene/drawing/introTimeline'

/**
 * Scroll-track heights, in vh, for the empty sections that give Lenis and ScrollTrigger
 * their distance. JG-026 pacing ruling (2026-09-05) sets these; the derivation is in
 * `project/work/evidence/JG-026-b1-b2-verification.md` (pacing table).
 *
 * `intro` is a dedicated track so the drawing sequence no longer has to share chapter 0's
 * section, and so `[data-chapter="1"]` — the element the hero GSAP ScrollTrigger measures
 * — still opens at paced progress 0.17703 and closes at 0.45843, i.e. within 1e-4 of the
 * window the retained CH.02 timeline was authored and verified against.
 *
 * Document height 3120vh (scroll distance 3020vh), up from 2020vh / 1920vh.
 */
const SCROLL_TRACK_VH = { intro: 906, chapters: [237, 576, 541, 811], footer: 49 } as const

/**
 * Chapter active scroll progress ranges [start, end] on the global 0..1 scroll timeline.
 * Opacity clamps smoothly inside and fades between adjacent chapter boundaries.
 */
const CHAPTER_RANGES: Record<number, [number, number]> = {
  0: [0.00, 0.22],
  1: [0.24, 0.46],
  2: [0.50, 0.72],
  3: [0.76, 1.00],
}

/**
 * Opening mechanical beats (JG-014) — the one-active-at-a-time annotations
 * that accompany the ring-shift, extraction, and rear-LCD dwell. Windows are
 * measured against the live timeline: ring switch travels 0.05→0.17, the
 * rear extraction completes at ≈0.416, and the LCD orbit runs
 * LCD_REVEAL_WINDOW 0.420→0.525 (caseStudies.ts). Kept as transparent
 * bottom-left edge captions — never a filled panel over the mechanism
 * (gdt-annotation-style.md: annotation may identify the part but not cover
 * the feature).
 */
const isShiftBeatOn = (progress: number): boolean => progress >= 0.04 && progress <= 0.18
const isExplodeBeatOn = (progress: number): boolean => progress > 0.18 && progress <= 0.42
const isLcdBeatOn = (progress: number): boolean => progress > 0.44 && progress <= 0.51

/** Bottom-left edge caption for the active mechanical beat. */
function BeatCaption({
  kicker,
  children,
}: {
  kicker: string
  children: React.ReactNode
}) {
  return (
    <div className="fixed left-6 md:left-12 bottom-[9vh] z-10 pointer-events-none font-mono border-l-2 border-cyan-400 pl-3 [text-shadow:0_1px_8px_rgba(0,0,0,0.95)]">
      <p className="text-[10px] tracking-[0.25em] text-cyan-400 mb-1.5">{kicker}</p>
      {children}
    </div>
  )
}

/** Case-study body shared by the on-demand surface and the static fallback. */
function CaseStudyBody({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <div className="border-t border-slate-800/80 pt-4 mt-2">
      <h3 className="text-sm md:text-base font-semibold text-slate-200 mb-1">
        {caseStudy.headline}
      </h3>
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{caseStudy.oneLiner}</p>
      <ul className="space-y-2 mb-4">
        {caseStudy.bullets.map((bullet) => (
          <li key={bullet.slice(0, 32)} className="flex items-start gap-2 text-xs text-slate-300 font-sans leading-normal">
            <span className="text-cyan-400 mt-0.5 shrink-0">▸</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
        {caseStudy.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Left-Column Narrative Grid (Milestone 5) + opening beat captions (JG-014).
 *
 * CH.03/CH.04 keep the 5-column glass cards. CH.01/CH.02 — the chapters whose
 * scroll windows carry the ring-switch and extraction mechanics — render as
 * TRANSPARENT top-left edge captions (no fill, no backdrop blur) so the
 * mechanism is never covered; the gearbox case study moves behind an
 * on-demand `[ + CASE STUDY ]` disclosure. The active mechanical beat gets a
 * bottom-left edge caption, one at a time.
 *
 * The background sections provide the 440vh / 660vh scroll track for Lenis and GSAP ScrollTrigger.
 */
export function Chapters() {
  const { tier, reducedMotion } = useQuality()
  const progress = useScrollValue('progress')
  const [openStudy, setOpenStudy] = useState<string | null>(null)

  const isStaticMode = tier === 'poster' || reducedMotion

  // JG-022: the reduced-motion tier unmounts ScrollRig (Lenis/ScrollTrigger),
  // so `chapter` in the scroll store stays locked at 0 and the static card
  // below never advances. This tier-only native-scroll listener derives the
  // active chapter from the same CHAPTER_RANGES the full-motion path gates
  // cards by. Deliberately local state — no store writes, so the 3D world
  // stays pinned to Station 1 in this tier (plan: static cards only, no
  // canvas spin-up), and the full-motion path is untouched.
  const [staticChapter, setStaticChapter] = useState(0)
  useEffect(() => {
    if (!reducedMotion) return
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      // CHAPTER_RANGES are authored on the paced progress axis, so raw scroll has to be
      // mapped the same way ScrollRig maps it in the full-motion tier (JG-026 pacing).
      const p = max > 0 ? pacedProgress(window.scrollY / max) : 0
      let chapter = 0
      for (const chapterDef of CHAPTERS) {
        const [start] = CHAPTER_RANGES[chapterDef.index] ?? [0, 1]
        if (p >= start) chapter = chapterDef.index
      }
      setStaticChapter(chapter)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reducedMotion])

  // The shift beat's window opens at 0.04, inside the intro band the drawing owns.
  const shiftBeat =
    !isStaticMode && progress > DRAWING_INTRO_WINDOW.releaseEnd && isShiftBeatOn(progress)
  const explodeBeat = !isStaticMode && isExplodeBeatOn(progress)
  const lcdBeat = !isStaticMode && isLcdBeatOn(progress)

  return (
    <>
      {/* 1. Left-Hand Narrative Grid Overlay (Fixed, z-10) */}
      {!isStaticMode ? (
        <div className="fixed inset-0 pointer-events-none z-10 grid grid-cols-12 p-6 md:p-12 items-center">
          {CHAPTERS.map((chapterDef) => {
            const caseStudy = CASE_STUDIES.find((cs) => cs.chapter === chapterDef.index)
            const [start, end] = CHAPTER_RANGES[chapterDef.index] ?? [0, 1]

            const fadeIn = Math.min(Math.max((progress - start) / 0.035, 0), 1)
            const fadeOut = Math.min(Math.max((end - progress) / 0.035, 0), 1)
            // CH.01's range opens at 0.00, which the B1/B2 intro now owns outright:
            // hold its card back until the drawing has handed off.
            const afterIntro =
              chapterDef.index === 0
                ? Math.min(Math.max((progress - DRAWING_INTRO_WINDOW.releaseEnd) / 0.02, 0), 1)
                : 1
            const opacity = Math.min(fadeIn, fadeOut) * afterIntro

            if (opacity <= 0.001) return null

            // CH.01/CH.02 own the mechanical reveal windows — transparent edge
            // caption instead of the glass card (JG-014).
            const isMechanicalChapter = chapterDef.index === 0 || chapterDef.index === 1

            if (isMechanicalChapter) {
              return (
                <div
                  key={chapterDef.index}
                  className="col-span-12 md:col-span-4 max-w-[30vw] max-md:max-w-full self-start pt-[9vh] flex flex-col transition-opacity duration-150"
                  style={{ opacity }}
                >
                  <div className="pointer-events-none [text-shadow:0_1px_10px_rgba(0,0,0,0.9)]">
                    <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-2">
                      <span className="tracking-[0.2em]">{chapterDef.label}</span>
                      {chapterDef.index === 0 && (
                        <>
                          <span className="text-slate-600">//</span>
                          <span className="text-cyan-200 tracking-wider">{ASSEMBLY_IDENTITY.machine}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 mb-2 font-sans leading-tight">
                      {chapterDef.title}
                    </h2>
                    <p className="text-sm text-slate-300 mb-3 leading-relaxed font-sans">
                      {chapterDef.subtitle}
                    </p>
                    {chapterDef.index === 0 && (
                      <p className="font-mono text-xs tracking-wider text-slate-400 border-l-2 border-cyan-500/40 pl-3">
                        {ASSEMBLY_IDENTITY.spec}
                      </p>
                    )}
                  </div>

                  {/* On-demand case-study surface — collapsed while the
                      mechanism owns the viewport; filled card only after an
                      explicit user request. */}
                  {chapterDef.index === 1 && caseStudy && (
                    <div className="pointer-events-auto mt-4">
                      <button
                        type="button"
                        aria-expanded={openStudy === caseStudy.id}
                        aria-controls="gearbox-case-study"
                        onClick={() => setOpenStudy(openStudy === caseStudy.id ? null : caseStudy.id)}
                        className="font-mono text-[10px] tracking-[0.2em] text-cyan-300 border border-cyan-400/50 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded transition-colors hover:border-cyan-300 hover:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none"
                      >
                        {openStudy === caseStudy.id ? '[ − CLOSE CASE STUDY ]' : '[ + CASE STUDY ]'}
                      </button>
                      {openStudy === caseStudy.id && (
                        <div
                          id="gearbox-case-study"
                          className="mt-3 max-w-[30rem] bg-slate-950/85 border border-slate-800/80 p-5 rounded-xl backdrop-blur-md shadow-2xl"
                        >
                          <CaseStudyBody caseStudy={caseStudy} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div
                key={chapterDef.index}
                className="col-span-12 md:col-span-5 max-w-[42vw] max-md:max-w-full flex flex-col justify-center transition-opacity duration-150"
                style={{ opacity }}
              >
                <div className="pointer-events-auto border p-4 md:p-6 rounded-xl border-slate-800/80 bg-slate-950/80 backdrop-blur-md shadow-2xl">
                  {/* Chapter Tag & Identity */}
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-2">
                    <span className="tracking-[0.2em]">{chapterDef.label}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mb-3 font-sans leading-tight">
                    {chapterDef.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed font-sans">
                    {chapterDef.subtitle}
                  </p>

                  {/* Case Study Details */}
                  {caseStudy && <CaseStudyBody caseStudy={caseStudy} />}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Reduced Motion / Poster Tier Static Fallback.
           JG-022: exactly one card at a time, in normal document flow. The card's own
           translucent panel already reads over the static drawing frame behind it, so
           nothing is pushed below the fold — stranding the copy a viewport down is the
           defect JG-022 exists to prevent. */
        <div className="relative z-10 p-6 md:p-12">
          {CHAPTERS.map((chapterDef) => {
            const caseStudy = CASE_STUDIES.find((cs) => cs.chapter === chapterDef.index)
            if (staticChapter !== chapterDef.index && reducedMotion) return null

            return (
              <div
                key={chapterDef.index}
                className="max-w-xl mb-12 bg-slate-950/85 border border-slate-800/80 p-6 md:p-8 rounded-xl"
              >
                <p className="font-mono text-xs tracking-[0.2em] text-cyan-400 mb-2">{chapterDef.label}</p>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mb-3 font-sans">{chapterDef.title}</h2>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed font-sans">{chapterDef.subtitle}</p>
                {caseStudy && <CaseStudyBody caseStudy={caseStudy} />}
              </div>
            )
          })}
        </div>
      )}

      {/* 2. Active mechanical beat annotation — bottom-left edge caption,
          one at a time (JG-014). */}
      {shiftBeat && (
        <BeatCaption kicker="P000420 // 2-SPEED SHIFT MECHANISM">
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 text-cyan-200">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#005DAA]" />
              <span className="font-semibold">LOWER GROOVE OSHA BLUE</span>
              <span className="text-slate-400">· LOW SPEED</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300/90 pl-4 text-[10px]">
              <span className="text-cyan-400">▸</span>
              <span>3X @120° HELICAL CAM SLOTS</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-200">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#C8102E]" />
              <span className="font-semibold">UPPER GROOVE OSHA RED</span>
              <span className="text-slate-400">· HIGH SPEED</span>
            </div>
          </div>
        </BeatCaption>
      )}

      {explodeBeat && (
        <BeatCaption kicker="REAR EXTRACTION — DRIVELINE ORDER">
          <p className="text-[10px] tracking-wider text-slate-300">
            P003047 → P003045 → P001849 → K000004 → P001837 → P001836
          </p>
        </BeatCaption>
      )}

      {lcdBeat && (
        <BeatCaption kicker="DIGITAL TELEMETRY // REAR ENDCAP">
          <p className="text-[11px] text-slate-200 font-semibold mb-1">Smart-Tool Instrument Interface</p>
          <p className="text-[10px] tracking-wide text-slate-400">
            MANOMETER LCD (BK11356) · MSP430 MCU · 3.7V LiPo CELL
          </p>
        </BeatCaption>
      )}

      {/* 3. Scroll Sections: Provides the scroll height for Lenis + ScrollTrigger.
             The intro track carries no `data-chapter`, so ScrollRig's per-chapter
             triggers and the hero timeline's `[data-chapter="1"]` selector are
             unaffected by its presence. */}
      <div className="relative z-0">
        <section
          data-intro="b1b2"
          className="pointer-events-none"
          style={{ minHeight: `${SCROLL_TRACK_VH.intro}vh` }}
        />
        {CHAPTERS.map((chapterDef) => (
          <section
            key={chapterDef.index}
            data-chapter={chapterDef.index}
            className="pointer-events-none"
            style={{ minHeight: `${SCROLL_TRACK_VH.chapters[chapterDef.index] ?? 576}vh` }}
          />
        ))}

        <footer
          className="pointer-events-none flex items-end px-[8vw] pb-16"
          style={{ height: `${SCROLL_TRACK_VH.footer}vh` }}
        >
          <p className="font-mono text-xs tracking-widest text-zinc-500">
            BUILT WITH REACT 19 · R3F · GSAP · LENIS — THE SAME HANDS THAT HOLD .0015" TIR
          </p>
        </footer>
      </div>
    </>
  )
}
