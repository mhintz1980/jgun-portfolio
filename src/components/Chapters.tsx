import { ASSEMBLY_IDENTITY, CASE_STUDIES, CHAPTERS } from '../data/caseStudies'
import { useQuality } from '../state/qualityStore'
import { useScrollValue } from '../state/scrollStore'

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
 * Left-Column Narrative Grid (Milestone 5).
 *
 * Partitions chapter story and case studies to a 5-column left-hand overlay panel
 * (max-width: 42%) with a dark glass backdrop-filter surface. The right 58%+ of
 * the viewport remains open and unobstructed for the 3D WebGL canvas and Track C
 * spatial hotspot leader lines.
 *
 * Text opacity clamps to its chapter's active scroll range with smooth fade-in / fade-out.
 * The background sections provide the 440vh / 660vh scroll track for Lenis and GSAP ScrollTrigger.
 */
export function Chapters() {
  const { tier, reducedMotion } = useQuality()
  const progress = useScrollValue('progress')
  const activeChapter = useScrollValue('chapter')

  const isStaticMode = tier === 'poster' || reducedMotion

  return (
    <>
      {/* 1. Left-Hand 5-Column Narrative Grid Overlay (Fixed, z-10) */}
      {!isStaticMode ? (
        <div className="fixed inset-0 pointer-events-none z-10 grid grid-cols-12 p-6 md:p-12 items-center">
          {CHAPTERS.map((chapterDef) => {
            const caseStudy = CASE_STUDIES.find((cs) => cs.chapter === chapterDef.index)
            const [start, end] = CHAPTER_RANGES[chapterDef.index] ?? [0, 1]

            const fadeIn = Math.min(Math.max((progress - start) / 0.035, 0), 1)
            const fadeOut = Math.min(Math.max((end - progress) / 0.035, 0), 1)
            const opacity = Math.min(fadeIn, fadeOut)

            if (opacity <= 0.001) return null

            return (
              <div
                key={chapterDef.index}
                className="col-span-12 md:col-span-5 max-w-[42vw] max-md:max-w-full flex flex-col justify-center transition-opacity duration-150"
                style={{ opacity }}
              >
                <div className="pointer-events-auto bg-slate-950/85 border border-slate-800/80 p-6 md:p-8 rounded-xl backdrop-blur-md shadow-2xl">
                  {/* Chapter Tag & Identity */}
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-2">
                    <span className="tracking-[0.2em]">{chapterDef.label}</span>
                    {chapterDef.index === 0 && (
                      <>
                        <span className="text-slate-600">//</span>
                        <span className="text-cyan-200 tracking-wider">{ASSEMBLY_IDENTITY.machine}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100 mb-3 font-sans leading-tight">
                    {chapterDef.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed font-sans">
                    {chapterDef.subtitle}
                  </p>

                  {/* CH.01 Spec */}
                  {chapterDef.index === 0 && (
                    <p className="font-mono text-xs tracking-wider text-slate-400 mb-4 border-l-2 border-cyan-500/40 pl-3">
                      {ASSEMBLY_IDENTITY.spec}
                    </p>
                  )}

                  {/* Case Study Details */}
                  {caseStudy && (
                    <div className="border-t border-slate-800/80 pt-4 mt-2">
                      <h3 className="text-sm md:text-base font-semibold text-slate-200 mb-1">
                        {caseStudy.headline}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                        {caseStudy.oneLiner}
                      </p>
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
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Reduced Motion / Poster Tier Static Fallback */
        <div className="relative z-10 p-6 md:p-12">
          {CHAPTERS.map((chapterDef) => {
            const caseStudy = CASE_STUDIES.find((cs) => cs.chapter === chapterDef.index)
            if (activeChapter !== chapterDef.index && reducedMotion) return null

            return (
              <div
                key={chapterDef.index}
                className="max-w-xl mb-12 bg-slate-950/85 border border-slate-800/80 p-6 md:p-8 rounded-xl"
              >
                <p className="font-mono text-xs tracking-[0.2em] text-cyan-400 mb-2">{chapterDef.label}</p>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-3 font-sans">{chapterDef.title}</h2>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed font-sans">{chapterDef.subtitle}</p>
                {caseStudy && (
                  <div className="border-t border-slate-800/80 pt-4 mt-2">
                    <h3 className="text-sm md:text-base font-semibold text-slate-200 mb-1">{caseStudy.headline}</h3>
                    <p className="text-xs text-slate-400 mb-3">{caseStudy.oneLiner}</p>
                    <ul className="space-y-2 mb-4">
                      {caseStudy.bullets.map((bullet) => (
                        <li key={bullet.slice(0, 32)} className="flex items-start gap-2 text-xs text-slate-300 font-sans">
                          <span className="text-cyan-400 mt-0.5">▸</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                      {caseStudy.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 2. Scroll Sections: Provides the scroll height for Lenis + ScrollTrigger */}
      <div className="relative z-0">
        {CHAPTERS.map((chapterDef) => (
          <section
            key={chapterDef.index}
            data-chapter={chapterDef.index}
            className={`pointer-events-none ${
              chapterDef.index === 3
                ? 'min-h-[660vh]'
                : 'min-h-[440vh]'
            }`}
          />
        ))}

        <footer className="pointer-events-none flex h-[40vh] items-end px-[8vw] pb-16">
          <p className="font-mono text-xs tracking-widest text-zinc-500">
            BUILT WITH REACT 19 · R3F · GSAP · LENIS — THE SAME HANDS THAT HOLD .0015" TIR
          </p>
        </footer>
      </div>
    </>
  )
}
