import { CASE_STUDIES, CHAPTERS } from '../data/caseStudies'
import { useQuality } from '../state/qualityStore'

/**
 * The scrollable narrative — four chapters, each a tall section that drives a
 * ScrollTrigger. Copy comes from OUTBOX/portfolio-module4-copy.md (Honey).
 * Text is pointer-events-none so the canvas keeps hover parallax; the sections
 * only exist to give the story scroll room.
 */
export function Chapters() {
  const { tier, reducedMotion } = useQuality()
  // pointer-events-none exists only to preserve canvas hover parallax; when
  // there is no live canvas interaction (poster tier or reduced motion) the
  // text must be selectable and screen-reader/keyboard friendly standalone.
  const passThrough = tier !== 'poster' && !reducedMotion ? 'pointer-events-none ' : ''

  return (
    <div className="relative z-10">
      {CHAPTERS.map((chapterDef) => {
        const caseStudy = CASE_STUDIES.find((cs) => cs.chapter === chapterDef.index)
        return (
          <section
            key={chapterDef.index}
            data-chapter={chapterDef.index}
            className={`${passThrough}flex min-h-[220vh] flex-col justify-center px-[8vw] py-[20vh]`}
          >
            <p className="font-mono text-xs tracking-[0.4em] text-cyan-400">{chapterDef.label}</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold text-zinc-100 md:text-6xl">
              {chapterDef.title}
            </h2>
            <p className="mt-4 max-w-xl text-zinc-400">{chapterDef.subtitle}</p>

            {caseStudy && (
              <div className="mt-12 max-w-xl border-l border-cyan-400/40 pl-6">
                <h3 className="text-xl text-zinc-100">{caseStudy.headline}</h3>
                <p className="mt-2 text-sm text-zinc-400">{caseStudy.oneLiner}</p>
                <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                  {caseStudy.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 32)} className="flex gap-3">
                      <span className="text-cyan-400">▸</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 font-mono text-[10px] tracking-widest text-cyan-400/70">
                  {caseStudy.tags.join(' · ')}
                </p>
              </div>
            )}
          </section>
        )
      })}

      <footer className="pointer-events-none flex h-[40vh] items-end px-[8vw] pb-16">
        <p className="font-mono text-xs tracking-widest text-zinc-500">
          BUILT WITH REACT 19 · R3F · GSAP · LENIS — THE SAME HANDS THAT HOLD .0015" TIR
        </p>
      </footer>
    </div>
  )
}
