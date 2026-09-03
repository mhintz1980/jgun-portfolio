/**
 * Static fallback stage — rendered instead of the WebGL canvas when WebGL2 is
 * unavailable, the context is lost, or the perf ladder bottoms out. Pure
 * CSS/DOM (no image asset dependency): an engineering-drawing title block over
 * a blueprint grid, so the site still opens with intent instead of a blank
 * void. The case-study narrative in <Chapters> renders on top as usual.
 */
export function StaticPoster() {
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

      <div className="absolute left-1/2 top-1/2 w-[min(52rem,84vw)] -translate-x-1/2 -translate-y-1/2 select-none">
        <p className="font-mono text-xs tracking-[0.4em] text-cyan-400">
          DWG NO. JG-D1-AP-001 · REV 01 · SCALE 1:1
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-zinc-100 md:text-6xl">
          JGun Torque Multiplier
        </h1>
        <p className="mt-3 max-w-xl text-zinc-400">
          Multi-stage planetary reduction · ASME Y14.5 GD&amp;T · STATIC ENGINEERING VIEW
        </p>
        <p className="mt-8 font-mono text-[10px] tracking-widest text-cyan-400/60">
          STATIC RENDER MODE — INTERACTIVE 3D UNAVAILABLE ON THIS DEVICE
        </p>
      </div>

      <div className="absolute bottom-8 right-8 hidden border border-cyan-400/30 font-mono text-[10px] tracking-widest text-cyan-300/80 md:block">
        <div className="border-b border-cyan-400/30 px-4 py-2">TITLE: JGUN PLANETARY REDUCTION ASSY</div>
        <div className="flex divide-x divide-cyan-400/30">
          <span className="px-4 py-2">TOL ±.0015&quot;</span>
          <span className="px-4 py-2">MAT&apos;L: 4140 HT</span>
          <span className="px-4 py-2">SHEET 1 OF 1</span>
        </div>
      </div>
    </div>
  )
}
