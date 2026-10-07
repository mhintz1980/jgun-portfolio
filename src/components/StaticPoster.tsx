/**
 * Static fallback stage — rendered instead of the WebGL canvas when WebGL2 is
 * unavailable, the context is lost, the perf ladder bottoms out, or the
 * visitor prefers reduced motion (owner decision "posters throughout",
 * 2026-10-06 — in that case the mode line must describe the preference, not
 * claim hardware is unavailable). Pure CSS/DOM (no image asset dependency):
 * a blueprint grid with drawing-sheet furniture (frame, title block, drill
 * notes). Deliberately low-contrast and
 * non-narrative: the case-study chapter cards in <Chapters> are the hero of
 * this tier, so this backdrop carries only small unobtrusive sheet furniture —
 * never a large centered title competing with the narrative (fallback QA,
 * 2026-09-27: the old viewport-centered text-6xl heading sat behind the cards
 * at every scroll position).
 */
import { ASSEMBLY_IDENTITY } from '../data/caseStudies'

/** Why the poster is up; keeps the mode line truthful per path. */
export type StaticPosterReason = 'poster-tier' | 'reduced-motion'

const MODE_LINES: Record<StaticPosterReason, string> = {
  'poster-tier': 'STATIC RENDER MODE — INTERACTIVE 3D UNAVAILABLE ON THIS DEVICE',
  'reduced-motion': 'STATIC RENDER MODE — REDUCED MOTION PREFERRED; ANIMATED 3D DISABLED',
}

export function StaticPoster({ reason }: { reason?: StaticPosterReason }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden bg-[#05070a]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(56,232,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,232,255,0.05) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <div className="absolute inset-6 border border-cyan-400/20" />

      {/* Sheet furniture, top-left — small mono DWG stamp, not a narrative title. */}
      <div className="absolute left-8 top-8 select-none font-mono text-[10px] leading-4 tracking-widest text-cyan-400/50">
        <p>
          DWG NO. {ASSEMBLY_IDENTITY.drawingNumber} · {ASSEMBLY_IDENTITY.revision} · SCALE 1:1
        </p>
        <p className="text-cyan-400/30">{ASSEMBLY_IDENTITY.machine}</p>
        <p className="text-cyan-400/30">{ASSEMBLY_IDENTITY.spec}</p>
        <p className="mt-1 text-cyan-400/30">
          {reason ? MODE_LINES[reason] : 'STATIC RENDER MODE'}
        </p>
      </div>

      {/* Sheet furniture, bottom-right — engineering title block. */}
      <div className="absolute bottom-8 right-8 hidden border border-cyan-400/30 font-mono text-[10px] tracking-widest text-cyan-300/80 md:block">
        <div className="border-b border-cyan-400/30 px-4 py-2">TITLE: PLANETARY REDUCTION ASSY</div>
        <div className="flex divide-x divide-cyan-400/30">
          <span className="px-4 py-2">TIR &lt; .001&quot;</span>
          <span className="px-4 py-2">MAT&apos;L: 4140 HT</span>
          <span className="px-4 py-2">SHEET 1 OF 1</span>
        </div>
      </div>
    </div>
  )
}
